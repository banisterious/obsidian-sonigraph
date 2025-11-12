/**
 * DepthBasedMapper
 *
 * Maps Local Soundscape graph data to musical parameters based on depth and direction.
 * Creates an immersive soundscape where distance and direction from center node
 * determine instrument selection, volume, pitch range, and stereo panning.
 *
 * Phase 2: Local Soundscape sonification
 * Future: Will be reused by Note Journey feature
 */

import { LocalSoundscapeData, LocalSoundscapeNode } from '../../graph/LocalSoundscapeExtractor';
import { MusicalMapper } from '../../graph/musical-mapper';
import { MusicalMapping } from '../../graph/types';
import { SonigraphSettings } from '../../utils/constants';
import { getLogger } from '../../logging';
import { App, TFile } from 'obsidian';
import { AudioEngine } from '../engine';
import { ContextualModifier, ContextModifiers } from './ContextualModifier';
import { MusicalTheoryEngine } from '../theory/MusicalTheoryEngine';
import { NoteName, ScaleType, ModalScale } from '../theory/types';
import { ChordVoicingStrategy, ChordVoicingConfig } from './ChordVoicingStrategy';
import { RhythmicPatternGenerator, RhythmicConfig } from './RhythmicPatternGenerator';
import { TensionArcController, TensionTrackingConfig } from './TensionArcController';
import { TurnTakingEngine, TurnTakingConfig } from './TurnTakingEngine';
import { DynamicPanningController, DynamicPanningConfig } from './DynamicPanningController';

const logger = getLogger('DepthBasedMapper');

/**
 * Adaptive pitch range configuration
 */
export interface AdaptivePitchConfig {
	enabled: boolean;

	// Define ranges as scale degrees instead of semitones
	rangesByDepth: {
		center: { minDegree: number; maxDegree: number };     // Default: 0 to 7 (root to octave)
		depth1: { minDegree: number; maxDegree: number };     // Default: -2 to 5 (below root to fifth)
		depth2: { minDegree: number; maxDegree: number };     // Default: -7 to 0 (octave below to root)
		depth3Plus: { minDegree: number; maxDegree: number }; // Default: -14 to -7 (two octaves down)
	};

	// How ranges adapt when key changes
	adaptationMode: 'transpose' | 'recompute';
}

/**
 * MappingWeights - Configurable weights for musical parameter calculation
 * Each property weight determines how much that property influences the final value
 * All weights are normalized (0-1 range) and sum to 1.0 for each parameter type
 */
export interface MappingWeights {
	// Duration calculation weights
	duration: {
		wordCount: number;        // Default: 0.4 (40%)
		charCount: number;        // Default: 0.3 (30%)
		headingCount: number;     // Default: 0.2 (20%)
		linkCount: number;        // Default: 0.1 (10%)
	};

	// Pitch offset calculation weights
	pitch: {
		wordCount: number;        // Default: 0.3 (30%)
		charCount: number;        // Default: 0.2 (20%)
		headingLevel: number;     // Default: 0.25 (25%) - avg heading level
		linkDensity: number;      // Default: 0.25 (25%) - links per word
	};

	// Instrument selection weights
	instrument: {
		depth: number;            // Default: 0.5 (50%) - primary factor
		tagCount: number;         // Default: 0.2 (20%)
		folderDepth: number;      // Default: 0.15 (15%)
		nodeIdHash: number;       // Default: 0.15 (15%) - for variation
	};

	// Velocity calculation weights
	velocity: {
		recency: number;          // Default: 0.4 (40%) - modification time
		wordCount: number;        // Default: 0.3 (30%)
		linkCount: number;        // Default: 0.2 (20%)
		headingCount: number;     // Default: 0.1 (10%)
	};
}

export interface DepthMappingConfig {
	// Instrument assignment by depth
	instrumentsByDepth: {
		center: string[];       // Lead instruments (piano, organ, leadSynth)
		depth1: string[];       // Harmony (strings, electricPiano, pad)
		depth2: string[];       // Rhythm/Bass (bass, timpani, cello)
		depth3Plus: string[];   // Ambient (pad, drone, atmosphericSynth)
	};

	// Volume attenuation by depth
	volumeByDepth: {
		center: number;      // 1.0 (100%)
		depth1: number;      // 0.8 (80%)
		depth2: number;      // 0.6 (60%)
		depth3Plus: number;  // 0.4 (40%)
	};

	// Pitch ranges by depth (in semitones relative to root)
	pitchRangesByDepth: {
		center: { min: number; max: number };      // Middle register (1 octave)
		depth1: { min: number; max: number };      // Surrounding center
		depth2: { min: number; max: number };      // Lower register
		depth3Plus: { min: number; max: number };  // Very low (ambient)
	};

	// Directional panning based on link type
	directionalPanning: {
		enabled: boolean;
		incomingLinks: number;   // -0.7 (left channel)
		outgoingLinks: number;   // +0.7 (right channel)
		bidirectional: number;   // 0.0 (center)
	};

	// Maximum nodes per depth (performance limit)
	maxNodesPerDepth: number | 'all'; // Default: 100, 'all' for unlimited

	// Configurable mapping weights for extensible musical mapping
	mappingWeights?: MappingWeights;

	// Musical theory integration for harmonic consonance
	musicalTheory?: {
		enabled: boolean;
		scale: ScaleType | ModalScale;
		rootNote: NoteName;
		quantizationStrength: number;  // 0-1, how strongly to quantize pitches to scale
	};

	// Adaptive pitch ranges (Phase 2)
	adaptivePitch?: AdaptivePitchConfig;

	// Chord voicing for polyphonic richness (Phase 2)
	chordVoicing?: ChordVoicingConfig;

	// Rhythmic patterns for temporal organization (Phase 3)
	rhythmic?: RhythmicConfig;

	// Tension tracking for emotional narrative (Phase 3)
	tensionTracking?: TensionTrackingConfig;

	// Turn-taking for instrument dialogue patterns (Phase 3)
	turnTaking?: TurnTakingConfig;

	// Dynamic panning for immersive stereo field (Phase 3)
	dynamicPanning?: DynamicPanningConfig;
}

export interface DepthMapping extends MusicalMapping {
	depth: number;
	direction: 'center' | 'incoming' | 'outgoing' | 'bidirectional';

	// Polyphonic voicing support (Phase 2)
	chordFrequencies?: number[];  // All frequencies in chord (if voicing enabled)
	voiceCount?: number;          // Number of voices in chord
	isChordVoiced?: boolean;      // Whether this mapping has chord voicing

	// Turn-taking support (Phase 3)
	isSolo?: boolean;             // This note is featured/prominent
	isAccompaniment?: boolean;    // This note is background support
	turnIndex?: number;           // Which turn this belongs to
}

export class DepthBasedMapper {
	private config: DepthMappingConfig;
	private musicalMapper: MusicalMapper;
	private app: App;
	private audioEngine: AudioEngine | null;
	private currentCenterNodePath: string | null = null;
	private randomizationSeed: number | null = null;
	private contextualModifier: ContextualModifier | null = null;
	private settings: SonigraphSettings;
	private musicalTheoryEngine: MusicalTheoryEngine | null = null;
	private chordVoicingStrategy: ChordVoicingStrategy | null = null;
	private rhythmicPatternGenerator: RhythmicPatternGenerator | null = null;
	private tensionArcController: TensionArcController | null = null;
	private turnTakingEngine: TurnTakingEngine | null = null;
	private dynamicPanningController: DynamicPanningController | null = null;

	constructor(
		config: Partial<DepthMappingConfig>,
		musicalMapper: MusicalMapper,
		app: App,
		audioEngine?: AudioEngine,
		settings?: SonigraphSettings
	) {
		this.audioEngine = audioEngine || null;
		this.config = this.mergeWithDefaults(config);
		this.musicalMapper = musicalMapper;
		this.app = app;
		this.settings = settings || {} as SonigraphSettings;

		// Initialize contextual modifier if settings provided
		if (settings) {
			this.contextualModifier = new ContextualModifier(settings);
		}

		// Initialize musical theory engine if enabled in config
		if (this.config.musicalTheory?.enabled) {
			this.musicalTheoryEngine = new MusicalTheoryEngine({
				enabled: true,
				scale: this.config.musicalTheory.scale,
				rootNote: this.config.musicalTheory.rootNote,
				enforceHarmony: true,
				allowChromaticPassing: false,
				dissonanceThreshold: 0.3,
				quantizationStrength: this.config.musicalTheory.quantizationStrength,
				dynamicScaleModulation: false
			});

			// Initialize chord voicing strategy if both theory engine and voicing are enabled
			if (this.config.chordVoicing?.enabled && this.musicalTheoryEngine) {
				this.chordVoicingStrategy = new ChordVoicingStrategy(
					this.config.chordVoicing,
					this.musicalTheoryEngine
				);
			}
		}

		// Initialize rhythmic pattern generator if enabled
		if (this.config.rhythmic?.enabled) {
			this.rhythmicPatternGenerator = new RhythmicPatternGenerator(
				this.config.rhythmic
			);
		}

		// Initialize tension arc controller if enabled
		if (this.config.tensionTracking?.enabled) {
			this.tensionArcController = new TensionArcController(
				this.config.tensionTracking
			);
		}

		// Initialize turn-taking engine if enabled
		if (this.config.turnTaking?.enabled) {
			this.turnTakingEngine = new TurnTakingEngine(
				this.config.turnTaking
			);
		}

		// Initialize dynamic panning controller if enabled
		if (this.config.dynamicPanning?.enabled) {
			this.dynamicPanningController = new DynamicPanningController(
				this.config.dynamicPanning
			);
		}

		logger.info('mapper-init', 'DepthBasedMapper initialized', {
			maxNodesPerDepth: this.config.maxNodesPerDepth,
			panningEnabled: this.config.directionalPanning.enabled,
			hasAudioEngine: !!this.audioEngine,
			contextAwareEnabled: !!settings?.localSoundscape?.contextAware?.enabled,
			musicalTheoryEnabled: !!this.musicalTheoryEngine,
			chordVoicingEnabled: !!this.chordVoicingStrategy,
			rhythmicPatternsEnabled: !!this.rhythmicPatternGenerator,
			tensionTrackingEnabled: !!this.tensionArcController,
			scale: this.config.musicalTheory ? `${this.config.musicalTheory.rootNote} ${this.config.musicalTheory.scale}` : 'none'
		});
	}

	/**
	 * Merge provided config with sensible defaults
	 * Uses enabled instruments from Control Center if available
	 */
	private mergeWithDefaults(config: Partial<DepthMappingConfig>): DepthMappingConfig {
		// Get enabled instruments from audio engine
		const enabledInstruments = this.audioEngine?.getEnabledInstrumentsForTesting() || [];

		logger.info('depth-mapper-init', 'Initializing DepthBasedMapper with enabled instruments', {
			enabledCount: enabledInstruments.length,
			enabledInstruments: enabledInstruments
		});

		// Filter instruments for each depth, only using enabled ones
		const getInstrumentsForDepth = (preferred: string[], depthName: string): string[] => {
			if (enabledInstruments.length === 0) {
				// Fallback to preferred list if no instruments enabled (shouldn't happen)
				logger.warn('no-enabled-instruments', `No instruments enabled, using preferred for ${depthName}`);
				return preferred;
			}

			// Filter preferred instruments to only include enabled ones
			const available = preferred.filter(inst => enabledInstruments.includes(inst));

			// If none of the preferred are enabled, use all enabled instruments
			const result = available.length > 0 ? available : enabledInstruments;

			logger.info('depth-instruments-filtered', `Instruments for ${depthName}`, {
				preferred,
				available,
				result,
				usedFallback: available.length === 0
			});

			return result;
		};

		// Define default preferred instruments (will be filtered to enabled only)
		const defaultInstrumentsByDepth = config.instrumentsByDepth || {
			center: getInstrumentsForDepth(['piano', 'organ', 'leadSynth'], 'center'),
			depth1: getInstrumentsForDepth(['strings', 'electricPiano'], 'depth1'),
			depth2: getInstrumentsForDepth(['bassSynth', 'timpani', 'cello'], 'depth2'),
			depth3Plus: getInstrumentsForDepth(['arpSynth', 'vibraphone'], 'depth3Plus')
		};

		return {
			instrumentsByDepth: defaultInstrumentsByDepth,
			volumeByDepth: config.volumeByDepth || {
				center: 1.0,
				depth1: 0.8,
				depth2: 0.6,
				depth3Plus: 0.4
			},
			pitchRangesByDepth: config.pitchRangesByDepth || {
				center: { min: 0, max: 19 },      // C4 to G5 (expanded from C5)
				depth1: { min: -7, max: 12 },     // F3 to C5 (expanded range)
				depth2: { min: -12, max: 7 },     // C3 to G4 (expanded upward)
				depth3Plus: { min: -24, max: 0 }  // C2 to C4 (expanded upward)
			},
			directionalPanning: config.directionalPanning || {
				enabled: true,
				incomingLinks: -0.7,
				outgoingLinks: 0.7,
				bidirectional: 0.0
			},
			maxNodesPerDepth: config.maxNodesPerDepth || 100, // Default to 100, can be 'all' for unlimited
			mappingWeights: config.mappingWeights || {
				duration: {
					wordCount: 0.4,
					charCount: 0.3,
					headingCount: 0.2,
					linkCount: 0.1
				},
				pitch: {
					wordCount: 0.3,
					charCount: 0.2,
					headingLevel: 0.25,
					linkDensity: 0.25
				},
				instrument: {
					depth: 0.5,
					tagCount: 0.2,
					folderDepth: 0.15,
					nodeIdHash: 0.15
				},
				velocity: {
					recency: 0.4,
					wordCount: 0.3,
					linkCount: 0.2,
					headingCount: 0.1
				}
			},
			musicalTheory: config.musicalTheory || {
				// Use musicalEnhancements settings if available, otherwise defaults
				enabled: this.settings?.localSoundscape?.musicalEnhancements?.scaleQuantization?.enabled || false,
				scale: (this.settings?.localSoundscape?.musicalEnhancements?.scaleQuantization?.scale as ScaleType) || 'major',
				rootNote: (this.settings?.localSoundscape?.musicalEnhancements?.scaleQuantization?.rootNote as NoteName) || 'C',
				quantizationStrength: this.settings?.localSoundscape?.musicalEnhancements?.scaleQuantization?.quantizationStrength || 0.8
			},
			adaptivePitch: config.adaptivePitch || {
				// Use musicalEnhancements settings if available
				enabled: this.settings?.localSoundscape?.musicalEnhancements?.adaptivePitch?.enabled || false,
				adaptationMode: 'transpose',
				rangesByDepth: {
					center: { minDegree: 0, maxDegree: 7 },          // Root to octave
					depth1: { minDegree: -2, maxDegree: 5 },         // Below root to fifth
					depth2: { minDegree: -7, maxDegree: 0 },         // Octave below to root
					depth3Plus: { minDegree: -14, maxDegree: -7 }    // Two octaves down
				}
			},
			chordVoicing: config.chordVoicing || {
				// Use musicalEnhancements settings if available, otherwise defaults
				enabled: this.settings?.localSoundscape?.musicalEnhancements?.chordVoicing?.enabled || false,
				strategy: 'depth-based',
				voicesByDepth: {
					center: 1,      // Melody only
					depth1: 2,      // Dyad
					depth2: 3,      // Triad
					depth3Plus: 4   // Seventh chord
				},
				chordQuality: {
					preferMajor: true,
					preferMinor: false,
					allowDiminished: false,
					allowAugmented: false,
					allowSevenths: true,
					allowExtensions: false
				},
				maxVoiceSpread: 19,
				minVoiceSpacing: 3,
				voicingDensity: this.settings?.localSoundscape?.musicalEnhancements?.chordVoicing?.voicingDensity ?? 0.5
			},
			rhythmic: config.rhythmic || {
				// Use musicalEnhancements settings if available, otherwise defaults
				enabled: this.settings?.localSoundscape?.musicalEnhancements?.rhythmicPatterns?.enabled || false,
				patternPerDepth: {
					center: 'sequential',
					depth1: 'arpeggio',
					depth2: 'pulse',
					depth3Plus: 'sequential'
				},
				tempo: this.settings?.localSoundscape?.musicalEnhancements?.rhythmicPatterns?.tempo ?? 60,
				timeSignature: [4, 4],
				patterns: {
					arpeggio: {
						direction: 'ascending',
						noteValue: '8th'
					},
					ostinato: {
						pattern: [1, 0.5, 0.5, 1],
						repeat: 4
					},
					pulse: {
						accentPattern: [1, 0, 0, 0],
						accentMultiplier: 1.3
					},
					decay: {
						initialInterval: 0.25,
						finalInterval: 2.0,
						curve: 'exponential'
					},
					accelerando: {
						initialInterval: 2.0,
						finalInterval: 0.25,
						curve: 'exponential'
					},
					cluster: {
						spread: 0.1
					}
				},
				depthGapDuration: 1.0
			},
			tensionTracking: config.tensionTracking || {
				// Use musicalEnhancements settings if available, otherwise defaults
				enabled: this.settings?.localSoundscape?.musicalEnhancements?.tensionTracking?.enabled || false,
				arcShape: (this.settings?.localSoundscape?.musicalEnhancements?.tensionTracking?.arcShape as any) || 'rise-fall',
				peakPosition: this.settings?.localSoundscape?.musicalEnhancements?.tensionTracking?.peakPosition ?? 0.6,
				pitchModulation: 5,
				velocityModulation: 1.3,
				durationModulation: 1.2
			},
			turnTaking: config.turnTaking || {
				// Use musicalEnhancements settings if available, otherwise defaults
				enabled: this.settings?.localSoundscape?.musicalEnhancements?.turnTaking?.enabled || false,
				pattern: (this.settings?.localSoundscape?.musicalEnhancements?.turnTaking?.pattern as any) || 'call-response',
				turnLength: this.settings?.localSoundscape?.musicalEnhancements?.turnTaking?.turnLength ?? 4,
				accompanimentReduction: this.settings?.localSoundscape?.musicalEnhancements?.turnTaking?.accompanimentReduction ?? 0.4
			},
			dynamicPanning: config.dynamicPanning || {
				// Use musicalEnhancements settings if available, otherwise defaults
				enabled: this.settings?.localSoundscape?.musicalEnhancements?.dynamicPanning?.enabled || false,
				smoothingFactor: this.settings?.localSoundscape?.musicalEnhancements?.dynamicPanning?.smoothingFactor ?? 0.3,
				animationSpeed: this.settings?.localSoundscape?.musicalEnhancements?.dynamicPanning?.animationSpeed ?? 2.0
			}
		};
	}

	/**
	 * Map Local Soundscape data to musical parameters
	 * @param seed Optional randomization seed for reproducible variations
	 */
	async mapSoundscapeToMusic(data: LocalSoundscapeData, seed?: number): Promise<DepthMapping[]> {
		const startTime = performance.now();

		// Set randomization seed (null means default/no randomization)
		this.randomizationSeed = seed ?? null;

		// Calculate context modifiers if enabled
		const contextModifiers = this.contextualModifier?.calculateModifiers();
		if (contextModifiers && this.contextualModifier) {
			this.contextualModifier.logContext();
		}

		// Analyze prose structure of center node if enabled
		let proseAnalysis = null;
		if (this.settings?.localSoundscape?.contextAware?.proseStructure?.enabled) {
			try {
				const { ProseAnalyzer } = await import('../../utils/ProseAnalyzer');
				const centerFile = this.app.vault.getAbstractFileByPath(data.centerNode.path);
				if (centerFile && 'cachedRead' in centerFile) {
					const content = await this.app.vault.cachedRead(centerFile);
					proseAnalysis = ProseAnalyzer.analyze(content);
					logger.info('prose-analysis', 'Analyzed prose structure', {
						contentType: proseAnalysis.contentType,
						complexity: proseAnalysis.overallComplexity.toFixed(2),
						expressiveness: proseAnalysis.musicalExpressiveness.toFixed(2)
					});
				} else {
					logger.warn('prose-analysis', 'Could not read center node file', {
						path: data.centerNode.path,
						fileFound: !!centerFile
					});
				}
			} catch (error) {
				logger.error('prose-analysis', 'Failed to analyze prose structure', error as Error);
			}
		}

		logger.info('mapping-start', 'Mapping soundscape to music', {
			totalNodes: data.stats.totalNodes,
			maxDepth: data.stats.maxDepth,
			centerNode: data.centerNode.basename,
			randomizationSeed: this.randomizationSeed,
			contextAwareEnabled: !!contextModifiers,
			proseAnalysisEnabled: !!proseAnalysis
		});

		this.currentCenterNodePath = data.centerNode.path;

		const mappings: DepthMapping[] = [];

		// Map center node
		const centerMapping = await this.mapNode(data.centerNode, 0, contextModifiers, proseAnalysis);
		if (centerMapping) {
			mappings.push(centerMapping);
		}

		// Map nodes at each depth level
		for (let depth = 1; depth <= data.stats.maxDepth; depth++) {
			const nodesAtDepth = data.nodesByDepth.get(depth) || [];

			// Limit nodes per depth for performance
			const limitedNodes = this.selectMostImportantNodes(nodesAtDepth, this.config.maxNodesPerDepth);

			logger.debug('mapping-depth', `Mapping depth ${depth}`, {
				totalNodes: nodesAtDepth.length,
				selectedNodes: limitedNodes.length
			});

			for (const node of limitedNodes) {
				const mapping = await this.mapNode(node, depth, contextModifiers, proseAnalysis);
				if (mapping) {
					mappings.push(mapping);
				}
			}
		}

		// Calculate timing for each mapping based on depth
		// Center note plays first, then spread each depth level's notes
		this.calculateTimingForMappings(mappings);

		// Apply tension arc modulation if enabled
		if (this.tensionArcController) {
			this.applyTensionModulation(mappings);
		}

		// Apply turn-taking patterns if enabled
		if (this.turnTakingEngine) {
			this.applyTurnTakingPattern(mappings);
		}

		// Apply dynamic panning if enabled
		if (this.dynamicPanningController) {
			this.applyDynamicPanning(mappings);
		}

		const duration = performance.now() - startTime;

		logger.info('mapping-complete', 'Soundscape mapping complete', {
			mappingsCreated: mappings.length,
			duration: `${duration.toFixed(2)}ms`,
			avgVelocity: mappings.reduce((sum, m) => sum + m.velocity, 0) / mappings.length,
			timingRange: mappings.length > 0 ?
				`${mappings[0].timing.toFixed(2)}s - ${mappings[mappings.length - 1].timing.toFixed(2)}s` : 'N/A'
		});

		return mappings;
	}

	/**
	 * Calculate timing for mappings based on depth
	 * Uses rhythmic pattern generator if enabled, otherwise spreads notes evenly
	 * Applies ±50ms timing jitter if seed is set (fallback mode only)
	 */
	private calculateTimingForMappings(mappings: DepthMapping[]): void {
		// Use rhythmic patterns if enabled
		if (this.rhythmicPatternGenerator) {
			this.calculateTimingWithRhythmicPatterns(mappings);
			return;
		}

		// Fallback to original linear timing
		const maxDuration = Math.max(...mappings.map(m => m.duration));
		const avgDuration = mappings.reduce((sum, m) => sum + m.duration, 0) / mappings.length;
		const maxSafePolyphony = 6;

		const minSafeInterval = maxDuration / maxSafePolyphony;
		const noteInterval = Math.max(0.5, minSafeInterval);
		const totalDuration = mappings.length * noteInterval;

		mappings.forEach((mapping, index) => {
			let timing = index * noteInterval;

			if (this.randomizationSeed !== null) {
				const randomValue = this.seededRandom(mapping.nodeId, 'timing');
				const jitter = (randomValue - 0.5) * 0.1;
				timing += jitter;
			}

			mapping.timing = Math.max(0, timing);
		});

		mappings.sort((a, b) => a.timing - b.timing);

		logger.info('timing-calculated', 'Timing calculated for all mappings', {
			totalMappings: mappings.length,
			maxDuration: maxDuration.toFixed(2),
			avgDuration: avgDuration.toFixed(2),
			minSafeInterval: minSafeInterval.toFixed(3),
			noteInterval: noteInterval.toFixed(3),
			totalDuration: totalDuration.toFixed(1),
			firstNote: mappings[0]?.timing.toFixed(3),
			lastNote: mappings[mappings.length - 1]?.timing.toFixed(3),
			estimatedMaxPolyphony: Math.ceil(maxDuration / noteInterval),
			hasJitter: this.randomizationSeed !== null
		});
	}

	/**
	 * Calculate timing using rhythmic pattern generator
	 * Groups mappings by depth and applies appropriate pattern to each layer
	 */
	private calculateTimingWithRhythmicPatterns(mappings: DepthMapping[]): void {
		if (!this.rhythmicPatternGenerator) {
			return;
		}

		// Group mappings by depth
		const byDepth = new Map<number, DepthMapping[]>();
		mappings.forEach(m => {
			const group = byDepth.get(m.depth) || [];
			group.push(m);
			byDepth.set(m.depth, group);
		});

		// Sort depths numerically
		const sortedDepths = Array.from(byDepth.keys()).sort((a, b) => a - b);

		let globalTime = 0;

		// Generate timings per depth layer
		for (const depth of sortedDepths) {
			const group = byDepth.get(depth)!;
			const pattern = this.rhythmicPatternGenerator.getPatternForDepth(depth);

			logger.debug('rhythmic-timing', `Generating rhythmic pattern for depth ${depth}`, {
				nodeCount: group.length,
				pattern,
				startTime: globalTime.toFixed(3)
			});

			// Generate timing results for this depth layer
			const timingResults = this.rhythmicPatternGenerator.generateTimings(
				group.length,
				pattern,
				globalTime
			);

			// Apply timings and velocity multipliers to mappings
			group.forEach((mapping, i) => {
				mapping.timing = timingResults[i].timing;

				// Apply velocity multiplier if present (for accent patterns)
				if (timingResults[i].velocityMultiplier) {
					mapping.velocity *= timingResults[i].velocityMultiplier;
					// Clamp velocity to valid range
					mapping.velocity = Math.max(0.1, Math.min(1.0, mapping.velocity));
				}
			});

			// Update global time for next depth layer
			// Find latest timing in this layer and add gap duration
			const latestTiming = Math.max(...timingResults.map(t => t.timing));
			globalTime = latestTiming + this.rhythmicPatternGenerator.getDepthGapDuration();

			logger.debug('rhythmic-layer-complete', `Completed rhythmic pattern for depth ${depth}`, {
				firstNote: timingResults[0].timing.toFixed(3),
				lastNote: timingResults[timingResults.length - 1].timing.toFixed(3),
				nextLayerStart: globalTime.toFixed(3)
			});
		}

		// Sort all mappings by timing for proper playback order
		mappings.sort((a, b) => a.timing - b.timing);

		const maxDuration = Math.max(...mappings.map(m => m.duration));
		const totalDuration = mappings[mappings.length - 1].timing + maxDuration;

		logger.info('rhythmic-timing-complete', 'Rhythmic timing calculated for all mappings', {
			totalMappings: mappings.length,
			depthLayers: sortedDepths.length,
			depths: sortedDepths.join(', '),
			totalDuration: totalDuration.toFixed(1),
			firstNote: mappings[0]?.timing.toFixed(3),
			lastNote: mappings[mappings.length - 1]?.timing.toFixed(3),
			avgVelocity: (mappings.reduce((sum, m) => sum + m.velocity, 0) / mappings.length).toFixed(2)
		});
	}

	/**
	 * Apply tension arc modulation to all mappings
	 * Modulates pitch, velocity, and duration based on position in sequence
	 */
	private applyTensionModulation(mappings: DepthMapping[]): void {
		if (!this.tensionArcController || mappings.length === 0) {
			return;
		}

		// Calculate total duration for position calculation
		const lastMapping = mappings[mappings.length - 1];
		const totalDuration = lastMapping.timing + lastMapping.duration;

		logger.debug('tension-start', 'Applying tension modulation', {
			totalMappings: mappings.length,
			totalDuration: totalDuration.toFixed(2)
		});

		mappings.forEach((mapping, index) => {
			// Calculate position in sequence (0-1)
			const position = mapping.timing / totalDuration;

			// Get modulation for this position
			const modulation = this.tensionArcController!.getModulation(position);

			// Apply pitch modulation
			mapping.pitch += Math.round(modulation.pitchOffset);

			// Apply velocity modulation
			mapping.velocity *= modulation.velocityMultiplier;
			mapping.velocity = Math.max(0.1, Math.min(1.0, mapping.velocity)); // Clamp 0.1-1.0

			// Apply duration modulation
			mapping.duration *= modulation.durationMultiplier;

			if (index === 0 || index === Math.floor(mappings.length / 2) || index === mappings.length - 1) {
				logger.debug('tension-sample', `Tension at position ${(position * 100).toFixed(0)}%`, {
					tensionLevel: (modulation.tensionLevel * 100).toFixed(0) + '%',
					pitchOffset: modulation.pitchOffset > 0 ? '+' + modulation.pitchOffset.toFixed(1) : modulation.pitchOffset.toFixed(1),
					velocityMult: modulation.velocityMultiplier.toFixed(2),
					durationMult: modulation.durationMultiplier.toFixed(2)
				});
			}
		});

		const avgVelocity = mappings.reduce((sum, m) => sum + m.velocity, 0) / mappings.length;

		logger.info('tension-complete', 'Tension modulation applied', {
			totalMappings: mappings.length,
			avgVelocity: avgVelocity.toFixed(2),
			arcShape: this.tensionArcController.getConfig().arcShape
		});
	}

	/**
	 * Apply turn-taking pattern to mappings
	 * Creates instrument dialogue by organizing turns instead of simultaneous playback
	 */
	private applyTurnTakingPattern(mappings: DepthMapping[]): void {
		if (!this.turnTakingEngine || mappings.length === 0) {
			return;
		}

		logger.debug('turn-taking-start', 'Applying turn-taking pattern', {
			totalMappings: mappings.length,
			pattern: this.turnTakingEngine.getConfig().pattern
		});

		// Apply the pattern (modifies mappings in place)
		this.turnTakingEngine.applyPattern(mappings);

		// Count solo vs accompaniment notes
		const soloCount = mappings.filter(m => m.isSolo).length;
		const accompCount = mappings.filter(m => m.isAccompaniment).length;

		logger.info('turn-taking-complete', 'Turn-taking pattern applied', {
			totalMappings: mappings.length,
			soloNotes: soloCount,
			accompanimentNotes: accompCount,
			pattern: this.turnTakingEngine.getConfig().pattern
		});
	}

	/**
	 * Apply dynamic panning to mappings
	 * Creates smooth spatial transitions for immersive stereo field
	 */
	private applyDynamicPanning(mappings: DepthMapping[]): void {
		if (!this.dynamicPanningController || mappings.length === 0) {
			return;
		}

		logger.debug('dynamic-panning-start', 'Applying dynamic panning', {
			totalMappings: mappings.length
		});

		// Apply dynamic panning (modifies mappings in place)
		this.dynamicPanningController.applyDynamicPanning(mappings);

		// Log statistics
		const avgPan = mappings.reduce((sum, m) => sum + Math.abs(m.pan), 0) / mappings.length;

		logger.info('dynamic-panning-complete', 'Dynamic panning applied', {
			totalMappings: mappings.length,
			avgPanSpread: avgPan.toFixed(2),
			smoothingFactor: this.dynamicPanningController.getConfig().smoothingFactor,
			animationSpeed: this.dynamicPanningController.getConfig().animationSpeed
		});
	}

	/**
	 * Map a single node to musical parameters
	 */
	private async mapNode(
		node: LocalSoundscapeNode,
		depth: number,
		contextModifiers?: ContextModifiers,
		proseAnalysis?: any
	): Promise<DepthMapping | null> {
		try {
			// Get file for metadata analysis
			const file = this.app.vault.getAbstractFileByPath(node.path);
			if (!(file instanceof TFile)) {
				logger.warn('file-not-found', `File not found: ${node.path}`);
				return null;
			}

			// Get pitch range for this depth
			let pitchRange = this.getPitchRangeForDepth(depth);

			// Apply prose structure modifiers to pitch range if enabled
			if (proseAnalysis && this.settings?.localSoundscape?.contextAware?.proseStructure?.affectPitch) {
				const sensitivity = this.settings.localSoundscape.contextAware.proseStructure.sensitivity || 0.5;
				// More complex prose = wider pitch range (amplified effect with 2x multiplier)
				const rangeMultiplier = 1 + (proseAnalysis.overallComplexity - 0.5) * sensitivity * 2;
				pitchRange = {
					min: pitchRange.min,
					max: pitchRange.min + (pitchRange.max - pitchRange.min) * rangeMultiplier
				};
				logger.debug('prose-pitch-mod', 'Applied prose pitch modulation', {
					complexity: proseAnalysis.overallComplexity.toFixed(2),
					sensitivity,
					rangeMultiplier: rangeMultiplier.toFixed(2),
					originalRange: `${pitchRange.min}-${pitchRange.max}`,
					modifiedRange: `${pitchRange.min}-${(pitchRange.min + (pitchRange.max - pitchRange.min) * rangeMultiplier).toFixed(1)}`
				});
			}

			// Calculate pitch based on node properties
			// Use word count and connection density to vary pitch within range
			const pitchOffset = this.calculatePitchOffset(node, pitchRange, contextModifiers);

			// Get instrument pool for this depth
			const instruments = this.getInstrumentsForDepth(depth);
			const instrument = this.selectInstrument(node, instruments, contextModifiers, proseAnalysis);

			// Calculate duration based on word count (longer notes = more content)
			let duration = this.calculateDuration(node);

			// Apply prose structure modifiers to duration if enabled
			if (proseAnalysis && this.settings?.localSoundscape?.contextAware?.proseStructure?.affectDuration) {
				const sensitivity = this.settings.localSoundscape.contextAware.proseStructure.sensitivity || 0.5;
				// Dense prose = longer durations (amplified effect with 2x multiplier)
				const durationMultiplier = 1 + (proseAnalysis.density.contentDensity - 0.5) * sensitivity * 2;
				duration = duration * durationMultiplier;
			}

			// Calculate velocity based on modification recency
			let velocity = this.calculateVelocity(node, contextModifiers);

			// Apply prose structure modifiers to velocity if enabled
			if (proseAnalysis && this.settings?.localSoundscape?.contextAware?.proseStructure?.affectVelocity) {
				const sensitivity = this.settings.localSoundscape.contextAware.proseStructure.sensitivity || 0.5;
				// More expressive prose = higher velocities (amplified effect with 2x multiplier)
				const velocityMultiplier = 1 + (proseAnalysis.musicalExpressiveness - 0.5) * sensitivity * 2;
				velocity = Math.min(1, velocity * velocityMultiplier);
			}

			// Convert semitone offset to frequency (Hz)
			// Formula: frequency = rootFreq * 2^(semitones/12)
			// Get root frequency from musical mapper (defaults to C4 = 261.63 Hz)
			const rootFreq = 261.63; // C4
			let frequency = rootFreq * Math.pow(2, pitchOffset / 12);

			// Apply scale quantization if musical theory engine is enabled
			if (this.musicalTheoryEngine) {
				frequency = this.musicalTheoryEngine.constrainPitchToScale(frequency);

				logger.debug('pitch-quantization', `Quantized pitch for node ${node.basename}`, {
					originalFreq: (rootFreq * Math.pow(2, pitchOffset / 12)).toFixed(2),
					quantizedFreq: frequency.toFixed(2),
					scale: this.musicalTheoryEngine.getCurrentScale().type,
					rootNote: this.musicalTheoryEngine.getCurrentScale().root
				});
			}

			// Generate chord voicing if enabled (Phase 2)
			let chordFrequencies: number[] | undefined;
			let voiceCount = 1;
			let isChordVoiced = false;

			if (this.chordVoicingStrategy) {
				const voicing = this.chordVoicingStrategy.generateVoicing(frequency, depth);

				if (voicing.voiceCount > 1) {
					chordFrequencies = voicing.frequencies;
					voiceCount = voicing.voiceCount;
					isChordVoiced = true;

					logger.debug('chord-voicing', `Generated chord voicing for node ${node.basename}`, {
						depth,
						voices: voiceCount,
						quality: voicing.chordQuality,
						rootFreq: frequency.toFixed(2),
						intervals: voicing.intervals.join(', ')
					});
				}
			}

			const mapping: DepthMapping = {
				nodeId: node.id,
				pitch: frequency, // Convert offset to Hz (quantized if enabled)
				duration: duration,
				velocity: velocity,
				instrument: instrument,
				timing: 0, // Will be calculated after all mappings are created
				depth: depth,
				direction: node.direction,
				// Polyphonic voicing data
				chordFrequencies,
				voiceCount,
				isChordVoiced
			};

			return mapping;

		} catch (error) {
			logger.error('mapping-error', `Error mapping node ${node.path}`, error as Error);
			return null;
		}
	}

	/**
	 * Get volume multiplier for a given depth
	 */
	private getVolumeForDepth(depth: number): number {
		if (depth === 0) return this.config.volumeByDepth.center;
		if (depth === 1) return this.config.volumeByDepth.depth1;
		if (depth === 2) return this.config.volumeByDepth.depth2;
		return this.config.volumeByDepth.depth3Plus;
	}

	/**
	 * Get pitch range for a given depth
	 * Supports adaptive key-relative ranges if enabled
	 */
	private getPitchRangeForDepth(depth: number): { min: number; max: number } {
		// Use adaptive pitch ranges if enabled and musical theory engine is available
		if (this.config.adaptivePitch?.enabled && this.musicalTheoryEngine) {
			return this.calculateAdaptivePitchRange(depth);
		}

		// Fall back to fixed semitone ranges
		if (depth === 0) return this.config.pitchRangesByDepth.center;
		if (depth === 1) return this.config.pitchRangesByDepth.depth1;
		if (depth === 2) return this.config.pitchRangesByDepth.depth2;
		return this.config.pitchRangesByDepth.depth3Plus;
	}

	/**
	 * Calculate adaptive pitch range based on scale degrees
	 * Converts scale degrees to semitone offsets relative to current scale
	 */
	private calculateAdaptivePitchRange(depth: number): { min: number; max: number } {
		if (!this.musicalTheoryEngine || !this.config.adaptivePitch) {
			// Shouldn't reach here, but safety fallback
			return this.getPitchRangeForDepth(depth);
		}

		const scale = this.musicalTheoryEngine.getCurrentScale();
		const degreeRanges = this.config.adaptivePitch.rangesByDepth;

		// Select degree range for this depth
		const range = depth === 0 ? degreeRanges.center :
		              depth === 1 ? degreeRanges.depth1 :
		              depth === 2 ? degreeRanges.depth2 : degreeRanges.depth3Plus;

		// Convert scale degrees to semitone offsets
		const minSemitones = this.scaleDegreesToSemitones(range.minDegree, scale);
		const maxSemitones = this.scaleDegreesToSemitones(range.maxDegree, scale);

		logger.debug('adaptive-pitch-range', `Calculated adaptive range for depth ${depth}`, {
			scale: `${scale.root} ${scale.type}`,
			minDegree: range.minDegree,
			maxDegree: range.maxDegree,
			minSemitones,
			maxSemitones
		});

		return { min: minSemitones, max: maxSemitones };
	}

	/**
	 * Convert scale degree to semitone offset
	 * Handles negative degrees (below root) and positive degrees (above root)
	 */
	private scaleDegreesToSemitones(degree: number, scale: any): number {
		const scaleIntervals = scale.definition.intervals;
		const scaleLength = scaleIntervals.length;

		// Determine octave and degree within octave
		const octaves = Math.floor(degree / scaleLength);
		const degreeInOctave = ((degree % scaleLength) + scaleLength) % scaleLength;

		// Get semitone offset within the octave
		const semitonesInOctave = scaleIntervals[degreeInOctave];

		// Total semitones = octave offset + degree offset
		const totalSemitones = (octaves * 12) + semitonesInOctave;

		return totalSemitones;
	}

	/**
	 * Calculate pitch offset within range using weighted combination of node properties
	 * Uses configurable weights from mappingWeights.pitch
	 * Applies ±2 semitone randomization if seed is set
	 * Applies context-aware modifiers if enabled
	 */
	private calculatePitchOffset(
		node: LocalSoundscapeNode,
		range: { min: number; max: number },
		contextModifiers?: ContextModifiers
	): number {
		const weights = this.config.mappingWeights!.pitch;

		// Calculate normalized factors (0-1 range)
		const wordCountFactor = Math.min(node.wordCount / 1000, 1); // Cap at 1000 words
		const charCountFactor = node.charCount ? Math.min(node.charCount / 5000, 1) : 0; // Cap at 5000 chars

		// Average heading level (1-6 normalized to 0-1)
		let headingLevelFactor = 0;
		if (node.headings && node.headings.count > 0) {
			const avgLevel = node.headings.levels.reduce((sum, level) => sum + level, 0) / node.headings.count;
			headingLevelFactor = 1 - (avgLevel / 6); // H1 = 1.0, H6 = 0.0
		}

		// Link density (links per word)
		let linkDensityFactor = 0;
		if (node.linkCount && node.wordCount > 0) {
			linkDensityFactor = Math.min(node.linkCount / node.wordCount * 10, 1); // Cap at 10% link density
		}

		// Add node path variation factor for melodic diversity
		// Use hash of node path to create consistent but unique pitch variations
		const pathHash = this.hashStringToFactor(node.id);
		const pathVariationFactor = pathHash;  // 0-1 range

		// Combine all factors with weights, adding path variation
		// Reduce the influence of similar metrics (wordCount, charCount) and increase diversity
		const combinedFactor = (
			(wordCountFactor * weights.wordCount * 0.5) +      // Reduced from full weight
			(charCountFactor * weights.charCount * 0.5) +      // Reduced from full weight
			(headingLevelFactor * weights.headingLevel) +
			(linkDensityFactor * weights.linkDensity) +
			(pathVariationFactor * 0.4)                        // New path-based variation
		);

		const rangeSpan = range.max - range.min;
		let offset = range.min + (combinedFactor * rangeSpan);

		// Apply randomization if seed is set (±2 semitones)
		if (this.randomizationSeed !== null) {
			const randomValue = this.seededRandom(node.id, 'pitch');
			const pitchShift = (randomValue - 0.5) * 4; // Range: -2 to +2 semitones
			offset += pitchShift;
		}

		// Apply context-aware pitch offset if available
		if (contextModifiers) {
			offset += contextModifiers.pitchOffset;
		}

		return Math.round(offset);
	}

	/**
	 * Hash a string to a consistent 0-1 factor for pitch variation
	 */
	private hashStringToFactor(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		// Convert to 0-1 range
		return Math.abs(hash % 1000) / 1000;
	}

	/**
	 * Get instrument pool for a given depth
	 */
	private getInstrumentsForDepth(depth: number): string[] {
		if (depth === 0) return this.config.instrumentsByDepth.center;
		if (depth === 1) return this.config.instrumentsByDepth.depth1;
		if (depth === 2) return this.config.instrumentsByDepth.depth2;
		return this.config.instrumentsByDepth.depth3Plus;
	}

	/**
	 * Select instrument from pool with depth-layer consistency
	 *
	 * Strategy:
	 * - All nodes at the same depth use the SAME primary instrument for timbral consistency
	 * - When randomization is enabled, allows subtle variation within instrument pool (max ±1 instrument)
	 * - Context-aware modifiers can shift the primary instrument choice
	 * - Uses 70/30 mix: 70% depth-based, 30% varied to ensure all enabled instruments get used
	 *
	 * This creates coherent depth layers (e.g., all depth-1 nodes = strings) while allowing
	 * slight variation when desired.
	 */
	private selectInstrument(node: LocalSoundscapeNode, instruments: string[], contextModifiers?: ContextModifiers, proseAnalysis?: any): string {
		if (instruments.length === 0) {
			logger.warn('no-instruments', 'No instruments available for depth', { depth: node.depth });
			return 'piano'; // Fallback
		}

		// Use node hash for deterministic variety
		const nodeHash = this.hashString(node.id + node.path);

		// 70/30 distribution: 70% depth-based for consistency, 30% varied for coverage
		let primaryIndex: number;
		if (nodeHash % 10 < 7) {
			// 70% chance: use depth-based selection for timbral consistency
			primaryIndex = Math.floor(node.depth % instruments.length);
		} else {
			// 30% chance: use hash-based selection to ensure all instruments get used
			primaryIndex = Math.floor(nodeHash % instruments.length);
		}

		// Apply context-aware bias if available (shifts instrument choice for all nodes at this depth)
		if (contextModifiers && contextModifiers.instrumentBias !== 0) {
			// Bias ranges from -1 to +1, can shift instrument by ±1 position
			const biasShift = Math.round(contextModifiers.instrumentBias);
			primaryIndex = (primaryIndex + biasShift + instruments.length) % instruments.length;
		}

		// Apply prose structure bias if enabled and timbre affecting is on
		if (proseAnalysis && this.settings?.localSoundscape?.contextAware?.proseStructure?.affectTimbre) {
			const sensitivity = this.settings.localSoundscape.contextAware.proseStructure.sensitivity || 0.5;
			// Content type influences instrument preference
			// Technical/structured content → shift toward precise instruments (higher index)
			// Creative/flowing content → shift toward expressive instruments (lower index)
			const timbreBias = (proseAnalysis.structure.complexityScore - 0.5) * sensitivity * 2;
			const biasShift = Math.round(timbreBias);
			primaryIndex = (primaryIndex + biasShift + instruments.length) % instruments.length;
		}

		// Apply LIMITED randomization if seed is set (±1 instrument maximum)
		// This allows subtle variation while maintaining depth-layer consistency
		if (this.randomizationSeed !== null && instruments.length > 1) {
			const randomValue = this.seededRandom(node.id, 'instrument');

			// Map 0-1 random value to -1, 0, or +1 instrument shift
			// This gives: 33% chance of -1, 33% chance of 0, 33% chance of +1
			let shift = 0;
			if (randomValue < 0.33) {
				shift = -1;
			} else if (randomValue > 0.67) {
				shift = 1;
			}

			primaryIndex = (primaryIndex + shift + instruments.length) % instruments.length;
		}

		const selectedInstrument = instruments[primaryIndex];

		logger.info('instrument-selection', `Selected instrument for node`, {
			nodeId: node.id.slice(0, 8),
			depth: node.depth,
			instrument: selectedInstrument,
			primaryIndex,
			instrumentPool: instruments,
			poolSize: instruments.length,
			nodeHash: nodeHash % 10,
			usedVariety: (nodeHash % 10) >= 7,
			hasRandomization: this.randomizationSeed !== null
		});

		return selectedInstrument;
	}

	/**
	 * Calculate stereo panning based on link direction
	 */
	private calculatePanning(node: LocalSoundscapeNode): number {
		if (!this.config.directionalPanning.enabled) {
			return 0;
		}

		switch (node.direction) {
			case 'center':
				return 0;
			case 'incoming':
				return this.config.directionalPanning.incomingLinks;
			case 'outgoing':
				return this.config.directionalPanning.outgoingLinks;
			case 'bidirectional':
				return this.config.directionalPanning.bidirectional;
			default:
				return 0;
		}
	}

	/**
	 * Calculate note duration using weighted combination of node properties
	 * Uses configurable weights from mappingWeights.duration
	 */
	private calculateDuration(node: LocalSoundscapeNode): number {
		// Duration range: 1.0 to 3.0 seconds
		// This allows up to 6 overlapping voices per instrument (3s / 0.5s spacing)
		const minDuration = 1.0;
		const maxDuration = 3.0;

		const weights = this.config.mappingWeights!.duration;

		// Calculate normalized factors (0-1 range)
		const wordCountFactor = Math.min(node.wordCount / 500, 1); // Cap at 500 words
		const charCountFactor = node.charCount ? Math.min(node.charCount / 2500, 1) : 0; // Cap at 2500 chars
		const headingCountFactor = node.headings ? Math.min(node.headings.count / 10, 1) : 0; // Cap at 10 headings
		const linkCountFactor = node.linkCount ? Math.min(node.linkCount / 20, 1) : 0; // Cap at 20 links

		// Weighted combination
		const combinedFactor = (
			(wordCountFactor * weights.wordCount) +
			(charCountFactor * weights.charCount) +
			(headingCountFactor * weights.headingCount) +
			(linkCountFactor * weights.linkCount)
		);

		const duration = minDuration + (combinedFactor * (maxDuration - minDuration));

		return duration;
	}

	/**
	 * Calculate velocity using weighted combination of node properties
	 * Uses configurable weights from mappingWeights.velocity
	 * Applies context-aware multiplier if enabled
	 */
	private calculateVelocity(node: LocalSoundscapeNode, contextModifiers?: ContextModifiers): number {
		const weights = this.config.mappingWeights!.velocity;

		// Calculate normalized factors (0-1 range)
		// Recency factor (recently modified = higher velocity)
		const now = Date.now();
		const daysSinceModified = (now - node.modified) / (1000 * 60 * 60 * 24);
		const recencyFactor = Math.max(0, 1.0 - (daysSinceModified / 30)); // Fresh (0 days) = 1.0, Old (30+ days) = 0.0

		// Word count factor
		const wordCountFactor = Math.min(node.wordCount / 500, 1); // Cap at 500 words

		// Link count factor
		const linkCountFactor = node.linkCount ? Math.min(node.linkCount / 20, 1) : 0; // Cap at 20 links

		// Heading count factor
		const headingCountFactor = node.headings ? Math.min(node.headings.count / 10, 1) : 0; // Cap at 10 headings

		// Weighted combination
		const combinedFactor = (
			(recencyFactor * weights.recency) +
			(wordCountFactor * weights.wordCount) +
			(linkCountFactor * weights.linkCount) +
			(headingCountFactor * weights.headingCount)
		);

		// Map to 0.3 to 1.0 range (minimum velocity to ensure audibility)
		let velocity = 0.3 + (combinedFactor * 0.7);

		// Apply context-aware velocity multiplier if available
		if (contextModifiers) {
			velocity *= contextModifiers.velocityMultiplier;
			velocity = Math.max(0.1, Math.min(1.0, velocity)); // Clamp to 0.1-1.0 range
		}

		return velocity;
	}

	/**
	 * Select most important nodes from a depth level
	 * Priority: word count, modification recency
	 */
	private selectMostImportantNodes(
		nodes: LocalSoundscapeNode[],
		limit: number | 'all'
	): LocalSoundscapeNode[] {
		// If 'all', return all nodes
		if (limit === 'all' || nodes.length <= limit) {
			return nodes;
		}

		// Score nodes by importance
		const scoredNodes = nodes.map(node => ({
			node,
			score: this.calculateImportanceScore(node)
		}));

		// Sort by score (descending) and take top N
		scoredNodes.sort((a, b) => b.score - a.score);

		return scoredNodes.slice(0, limit).map(item => item.node);
	}

	/**
	 * Calculate importance score for node selection
	 */
	private calculateImportanceScore(node: LocalSoundscapeNode): number {
		// Factors:
		// - Word count (more content = more important)
		// - Recency (recently modified = more important)

		const wordCountScore = Math.min(node.wordCount / 100, 10); // Cap at 10 points

		const daysSinceModified = (Date.now() - node.modified) / (1000 * 60 * 60 * 24);
		const recencyScore = Math.max(0, 10 - daysSinceModified / 3); // 10 points for today, 0 after 30 days

		return wordCountScore + recencyScore;
	}

	/**
	 * Simple string hash function for deterministic instrument selection
	 */
	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}

	/**
	 * Seeded pseudo-random number generator (LCG algorithm)
	 * Returns a deterministic random number between 0 and 1
	 */
	private seededRandom(nodeId: string, context: string): number {
		if (this.randomizationSeed === null) {
			// No randomization - return 0 (neutral value)
			return 0;
		}

		// Combine seed, nodeId, and context for unique but deterministic values
		const combinedSeed = this.randomizationSeed + this.hashString(nodeId + context);

		// Linear Congruential Generator (LCG) - produces values in [0, 1)
		const a = 1664525;
		const c = 1013904223;
		const m = Math.pow(2, 32);
		const value = ((a * combinedSeed + c) % m) / m;

		return value;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<DepthMappingConfig>): void {
		this.config = this.mergeWithDefaults({ ...this.config, ...config });

		// Reinitialize musical theory engine if config changed
		if (config.musicalTheory) {
			if (this.config.musicalTheory?.enabled) {
				this.musicalTheoryEngine = new MusicalTheoryEngine({
					enabled: true,
					scale: this.config.musicalTheory.scale,
					rootNote: this.config.musicalTheory.rootNote,
					enforceHarmony: true,
					allowChromaticPassing: false,
					dissonanceThreshold: 0.3,
					quantizationStrength: this.config.musicalTheory.quantizationStrength,
					dynamicScaleModulation: false
				});
				logger.info('music-theory-updated', 'Musical theory engine updated', {
					scale: `${this.config.musicalTheory.rootNote} ${this.config.musicalTheory.scale}`,
					quantizationStrength: this.config.musicalTheory.quantizationStrength
				});

				// Reinitialize chord voicing if enabled and theory engine exists
				if (this.config.chordVoicing?.enabled && this.musicalTheoryEngine) {
					this.chordVoicingStrategy = new ChordVoicingStrategy(
						this.config.chordVoicing,
						this.musicalTheoryEngine
					);
					logger.info('chord-voicing-updated', 'Chord voicing strategy updated');
				}
			} else {
				this.musicalTheoryEngine = null;
				this.chordVoicingStrategy = null;
				logger.info('music-theory-disabled', 'Musical theory engine disabled');
			}
		}

		// Update chord voicing if config changed (and theory engine exists)
		if (config.chordVoicing && this.musicalTheoryEngine) {
			if (this.config.chordVoicing?.enabled) {
				this.chordVoicingStrategy = new ChordVoicingStrategy(
					this.config.chordVoicing,
					this.musicalTheoryEngine
				);
				logger.info('chord-voicing-enabled', 'Chord voicing enabled', {
					strategy: this.config.chordVoicing.strategy,
					centerVoices: this.config.chordVoicing.voicesByDepth.center,
					depth3Voices: this.config.chordVoicing.voicesByDepth.depth3Plus
				});
			} else {
				this.chordVoicingStrategy = null;
				logger.info('chord-voicing-disabled', 'Chord voicing disabled');
			}
		}

		// Update rhythmic pattern generator if config changed
		if (config.rhythmic) {
			if (this.config.rhythmic?.enabled) {
				this.rhythmicPatternGenerator = new RhythmicPatternGenerator(
					this.config.rhythmic
				);
				logger.info('rhythmic-patterns-enabled', 'Rhythmic pattern generator enabled', {
					tempo: this.config.rhythmic.tempo,
					centerPattern: this.config.rhythmic.patternPerDepth.center,
					depth1Pattern: this.config.rhythmic.patternPerDepth.depth1
				});
			} else {
				this.rhythmicPatternGenerator = null;
				logger.info('rhythmic-patterns-disabled', 'Rhythmic pattern generator disabled');
			}
		}

		// Update tension arc controller if config changed
		if (config.tensionTracking) {
			if (this.config.tensionTracking?.enabled) {
				this.tensionArcController = new TensionArcController(
					this.config.tensionTracking
				);
				logger.info('tension-tracking-enabled', 'Tension arc controller enabled', {
					arcShape: this.config.tensionTracking.arcShape,
					peakPosition: this.config.tensionTracking.peakPosition
				});
			} else {
				this.tensionArcController = null;
				logger.info('tension-tracking-disabled', 'Tension arc controller disabled');
			}
		}

		// Update turn-taking engine if config changed
		if (config.turnTaking) {
			if (this.config.turnTaking?.enabled) {
				this.turnTakingEngine = new TurnTakingEngine(
					this.config.turnTaking
				);
				logger.info('turn-taking-enabled', 'Turn-taking engine enabled', {
					pattern: this.config.turnTaking.pattern,
					turnLength: this.config.turnTaking.turnLength
				});
			} else {
				this.turnTakingEngine = null;
				logger.info('turn-taking-disabled', 'Turn-taking engine disabled');
			}
		}

		// Update dynamic panning controller if config changed
		if (config.dynamicPanning) {
			if (this.config.dynamicPanning?.enabled) {
				this.dynamicPanningController = new DynamicPanningController(
					this.config.dynamicPanning
				);
				logger.info('dynamic-panning-enabled', 'Dynamic panning controller enabled', {
					smoothingFactor: this.config.dynamicPanning.smoothingFactor,
					animationSpeed: this.config.dynamicPanning.animationSpeed
				});
			} else {
				this.dynamicPanningController = null;
				logger.info('dynamic-panning-disabled', 'Dynamic panning controller disabled');
			}
		}

		logger.info('config-updated', 'DepthBasedMapper config updated');
	}

	/**
	 * Get current configuration
	 */
	getConfig(): DepthMappingConfig {
		return { ...this.config };
	}
}
