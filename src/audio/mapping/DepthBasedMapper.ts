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

const logger = getLogger('DepthBasedMapper');

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
}

export interface DepthMapping extends MusicalMapping {
	depth: number;
	direction: 'center' | 'incoming' | 'outgoing' | 'bidirectional';
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

		logger.info('mapper-init', 'DepthBasedMapper initialized', {
			maxNodesPerDepth: this.config.maxNodesPerDepth,
			panningEnabled: this.config.directionalPanning.enabled,
			hasAudioEngine: !!this.audioEngine,
			contextAwareEnabled: !!settings?.localSoundscape?.contextAware?.enabled
		});
	}

	/**
	 * Merge provided config with sensible defaults
	 * Uses enabled instruments from Control Center if available
	 */
	private mergeWithDefaults(config: Partial<DepthMappingConfig>): DepthMappingConfig {
		// Get enabled instruments from audio engine
		const enabledInstruments = this.audioEngine?.getEnabledInstrumentsForTesting() || [];

		// Filter instruments for each depth, only using enabled ones
		const getInstrumentsForDepth = (preferred: string[]): string[] => {
			if (enabledInstruments.length === 0) {
				// Fallback to preferred list if no instruments enabled (shouldn't happen)
				return preferred;
			}

			// Filter preferred instruments to only include enabled ones
			const available = preferred.filter(inst => enabledInstruments.includes(inst));

			// If none of the preferred are enabled, use all enabled instruments
			return available.length > 0 ? available : enabledInstruments;
		};

		// Define default preferred instruments (will be filtered to enabled only)
		const defaultInstrumentsByDepth = config.instrumentsByDepth || {
			center: getInstrumentsForDepth(['piano', 'organ', 'leadSynth']),
			depth1: getInstrumentsForDepth(['strings', 'electricPiano']),
			depth2: getInstrumentsForDepth(['bassSynth', 'timpani', 'cello']),
			depth3Plus: getInstrumentsForDepth(['arpSynth', 'vibraphone'])
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
				center: { min: 0, max: 12 },      // C4 to C5
				depth1: { min: -5, max: 7 },      // G3 to G4
				depth2: { min: -12, max: 0 },     // C3 to C4
				depth3Plus: { min: -24, max: -12 } // C2 to C3
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

		logger.info('mapping-start', 'Mapping soundscape to music', {
			totalNodes: data.stats.totalNodes,
			maxDepth: data.stats.maxDepth,
			centerNode: data.centerNode.basename,
			randomizationSeed: this.randomizationSeed,
			contextAwareEnabled: !!contextModifiers
		});

		this.currentCenterNodePath = data.centerNode.path;

		const mappings: DepthMapping[] = [];

		// Map center node
		const centerMapping = await this.mapNode(data.centerNode, 0, contextModifiers);
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
				const mapping = await this.mapNode(node, depth, contextModifiers);
				if (mapping) {
					mappings.push(mapping);
				}
			}
		}

		// Calculate timing for each mapping based on depth
		// Center note plays first, then spread each depth level's notes
		this.calculateTimingForMappings(mappings);

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
	 * Spreads notes evenly across time for a flowing sequence
	 * Applies ±50ms timing jitter if seed is set
	 */
	private calculateTimingForMappings(mappings: DepthMapping[]): void {
		// Calculate safe interval based on note duration and max polyphony
		// Use max duration (not average) to be extra safe
		const maxDuration = Math.max(...mappings.map(m => m.duration));
		const avgDuration = mappings.reduce((sum, m) => sum + m.duration, 0) / mappings.length;
		const maxSafePolyphony = 6; // Reduced from 12 to prevent CPU overload and crackling

		// Calculate minimum interval needed to prevent polyphony issues
		// Use max duration to ensure worst case is still safe
		const minSafeInterval = maxDuration / maxSafePolyphony;

		// Use at least 0.5s spacing to ensure clear note separation
		const noteInterval = Math.max(0.5, minSafeInterval);

		const totalDuration = mappings.length * noteInterval;

		mappings.forEach((mapping, index) => {
			// Base timing aligned with intervals
			let timing = index * noteInterval;

			// Apply timing jitter if seed is set (±50ms)
			if (this.randomizationSeed !== null) {
				const randomValue = this.seededRandom(mapping.nodeId, 'timing');
				const jitter = (randomValue - 0.5) * 0.1; // Range: -0.05s to +0.05s (±50ms)
				timing += jitter;
			}

			mapping.timing = Math.max(0, timing); // Ensure non-negative
		});

		// Sort by timing for proper playback order
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
	 * Map a single node to musical parameters
	 */
	private async mapNode(
		node: LocalSoundscapeNode,
		depth: number,
		contextModifiers?: ContextModifiers
	): Promise<DepthMapping | null> {
		try {
			// Get file for metadata analysis
			const file = this.app.vault.getAbstractFileByPath(node.path);
			if (!(file instanceof TFile)) {
				logger.warn('file-not-found', `File not found: ${node.path}`);
				return null;
			}

			// Get pitch range for this depth
			const pitchRange = this.getPitchRangeForDepth(depth);

			// Calculate pitch based on node properties
			// Use word count and connection density to vary pitch within range
			const pitchOffset = this.calculatePitchOffset(node, pitchRange, contextModifiers);

			// Get instrument pool for this depth
			const instruments = this.getInstrumentsForDepth(depth);
			const instrument = this.selectInstrument(node, instruments, contextModifiers);

			// Calculate duration based on word count (longer notes = more content)
			const duration = this.calculateDuration(node);

			// Calculate velocity based on modification recency
			const velocity = this.calculateVelocity(node, contextModifiers);

			// Convert semitone offset to frequency (Hz)
			// Formula: frequency = rootFreq * 2^(semitones/12)
			// Get root frequency from musical mapper (defaults to C4 = 261.63 Hz)
			const rootFreq = 261.63; // C4
			const frequency = rootFreq * Math.pow(2, pitchOffset / 12);

			const mapping: DepthMapping = {
				nodeId: node.id,
				pitch: frequency, // Convert offset to Hz
				duration: duration,
				velocity: velocity,
				instrument: instrument,
				timing: 0, // Will be calculated after all mappings are created
				depth: depth,
				direction: node.direction
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
	 */
	private getPitchRangeForDepth(depth: number): { min: number; max: number } {
		if (depth === 0) return this.config.pitchRangesByDepth.center;
		if (depth === 1) return this.config.pitchRangesByDepth.depth1;
		if (depth === 2) return this.config.pitchRangesByDepth.depth2;
		return this.config.pitchRangesByDepth.depth3Plus;
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

		// Weighted combination
		const combinedFactor = (
			(wordCountFactor * weights.wordCount) +
			(charCountFactor * weights.charCount) +
			(headingLevelFactor * weights.headingLevel) +
			(linkDensityFactor * weights.linkDensity)
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
	 * Get instrument pool for a given depth
	 */
	private getInstrumentsForDepth(depth: number): string[] {
		if (depth === 0) return this.config.instrumentsByDepth.center;
		if (depth === 1) return this.config.instrumentsByDepth.depth1;
		if (depth === 2) return this.config.instrumentsByDepth.depth2;
		return this.config.instrumentsByDepth.depth3Plus;
	}

	/**
	 * Select instrument from pool using weighted combination of node properties
	 * Uses configurable weights from mappingWeights.instrument
	 * Applies randomization if seed is set
	 * Applies context-aware bias if enabled
	 */
	private selectInstrument(node: LocalSoundscapeNode, instruments: string[], contextModifiers?: ContextModifiers): string {
		const weights = this.config.mappingWeights!.instrument;

		// Calculate normalized factors (0-1 range)
		// Depth factor (already 0-3, normalize to 0-1)
		const depthFactor = node.depth / 3;

		// Tag count factor
		const tagCountFactor = node.tags ? Math.min(node.tags.length / 5, 1) : 0; // Cap at 5 tags

		// Folder depth factor (path separators)
		const folderDepthFactor = Math.min(node.path.split('/').length / 5, 1); // Cap at 5 levels

		// Node ID hash factor (for variation)
		const nodeIdHashFactor = (this.hashString(node.id) % 1000) / 1000; // Normalize hash to 0-1

		// Weighted combination
		let combinedFactor = (
			(depthFactor * weights.depth) +
			(tagCountFactor * weights.tagCount) +
			(folderDepthFactor * weights.folderDepth) +
			(nodeIdHashFactor * weights.nodeIdHash)
		);

		// Apply context-aware bias if available
		// instrumentBias ranges from -1 to +1, shifts index toward beginning or end of array
		if (contextModifiers) {
			combinedFactor += contextModifiers.instrumentBias * 0.3; // 30% influence on instrument selection
			combinedFactor = Math.max(0, Math.min(1, combinedFactor)); // Clamp to 0-1 range
		}

		// Convert combined factor to instrument index
		let index = Math.floor(combinedFactor * instruments.length);

		// Apply randomization if seed is set
		if (this.randomizationSeed !== null) {
			const randomOffset = this.seededRandom(node.id, 'instrument');
			// Add random offset (0-1) scaled to instrument count
			index += Math.floor(randomOffset * instruments.length);
		}

		// Ensure index is within bounds
		index = index % instruments.length;

		return instruments[index];
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
		logger.info('config-updated', 'DepthBasedMapper config updated');
	}

	/**
	 * Get current configuration
	 */
	getConfig(): DepthMappingConfig {
		return { ...this.config };
	}
}
