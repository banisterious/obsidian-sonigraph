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

const logger = getLogger('DepthBasedMapper');

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

	constructor(
		config: Partial<DepthMappingConfig>,
		musicalMapper: MusicalMapper,
		app: App,
		audioEngine?: AudioEngine
	) {
		this.audioEngine = audioEngine || null;
		this.config = this.mergeWithDefaults(config);
		this.musicalMapper = musicalMapper;
		this.app = app;

		logger.info('mapper-init', 'DepthBasedMapper initialized', {
			maxNodesPerDepth: this.config.maxNodesPerDepth,
			panningEnabled: this.config.directionalPanning.enabled,
			hasAudioEngine: !!this.audioEngine
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
			maxNodesPerDepth: config.maxNodesPerDepth || 100 // Default to 100, can be 'all' for unlimited
		};
	}

	/**
	 * Map Local Soundscape data to musical parameters
	 */
	async mapSoundscapeToMusic(data: LocalSoundscapeData): Promise<DepthMapping[]> {
		const startTime = performance.now();

		logger.info('mapping-start', 'Mapping soundscape to music', {
			totalNodes: data.stats.totalNodes,
			maxDepth: data.stats.maxDepth,
			centerNode: data.centerNode.basename
		});

		this.currentCenterNodePath = data.centerNode.path;

		const mappings: DepthMapping[] = [];

		// Map center node
		const centerMapping = await this.mapNode(data.centerNode, 0);
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
				const mapping = await this.mapNode(node, depth);
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
			avgVolume: mappings.reduce((sum, m) => sum + m.volume, 0) / mappings.length,
			timingRange: mappings.length > 0 ?
				`${mappings[0].timing.toFixed(2)}s - ${mappings[mappings.length - 1].timing.toFixed(2)}s` : 'N/A'
		});

		return mappings;
	}

	/**
	 * Calculate timing for mappings based on depth
	 * Spreads notes evenly across time for a flowing sequence
	 */
	private calculateTimingForMappings(mappings: DepthMapping[]): void {
		// Use exact 0.4 second intervals to match the real-time timer (400ms)
		// This ensures every timer tick finds exactly one note
		const noteInterval = 0.4; // Match AudioEngine timer interval
		const totalDuration = mappings.length * noteInterval;

		mappings.forEach((mapping, index) => {
			// Exact timing aligned with timer ticks
			mapping.timing = index * noteInterval;
		});

		// Sort by timing for proper playback order
		mappings.sort((a, b) => a.timing - b.timing);

		logger.debug('timing-calculated', 'Timing calculated for all mappings', {
			totalMappings: mappings.length,
			totalDuration: totalDuration.toFixed(1),
			noteInterval: noteInterval.toFixed(3),
			firstNote: mappings[0]?.timing.toFixed(3),
			lastNote: mappings[mappings.length - 1]?.timing.toFixed(3)
		});
	}

	/**
	 * Map a single node to musical parameters
	 */
	private async mapNode(
		node: LocalSoundscapeNode,
		depth: number
	): Promise<DepthMapping | null> {
		try {
			// Get file for metadata analysis
			const file = this.app.vault.getAbstractFileByPath(node.path);
			if (!(file instanceof TFile)) {
				logger.warn('file-not-found', `File not found: ${node.path}`);
				return null;
			}

			// Get base volume for this depth
			const baseVolume = this.getVolumeForDepth(depth);

			// Get pitch range for this depth
			const pitchRange = this.getPitchRangeForDepth(depth);

			// Calculate pitch based on node properties
			// Use word count and connection density to vary pitch within range
			const pitchOffset = this.calculatePitchOffset(node, pitchRange);

			// Get instrument pool for this depth
			const instruments = this.getInstrumentsForDepth(depth);
			const instrument = this.selectInstrument(node, instruments);

			// Calculate panning based on direction
			const panning = this.calculatePanning(node);

			// Calculate duration based on word count (longer notes = more content)
			const duration = this.calculateDuration(node);

			// Calculate velocity based on modification recency
			const velocity = this.calculateVelocity(node);

			// Convert semitone offset to frequency (Hz)
			// Formula: frequency = rootFreq * 2^(semitones/12)
			// Get root frequency from musical mapper (defaults to C4 = 261.63 Hz)
			const rootFreq = 261.63; // C4
			const frequency = rootFreq * Math.pow(2, pitchOffset / 12);

			const mapping: DepthMapping = {
				nodeId: node.id,
				pitch: frequency, // Convert offset to Hz
				duration: duration,
				volume: baseVolume,
				velocity: velocity,
				instrument: instrument,
				panning: panning,
				timing: 0, // Will be calculated after all mappings are created
				delay: 0, // Will be set during playback scheduling
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
	 * Calculate pitch offset within range based on node properties
	 */
	private calculatePitchOffset(
		node: LocalSoundscapeNode,
		range: { min: number; max: number }
	): number {
		// Use word count to determine pitch within range
		// More words = higher pitch within the range
		const wordCountNormalized = Math.min(node.wordCount / 1000, 1); // Cap at 1000 words

		const rangeSpan = range.max - range.min;
		const offset = range.min + (wordCountNormalized * rangeSpan);

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
	 * Select instrument from pool based on node properties
	 */
	private selectInstrument(node: LocalSoundscapeNode, instruments: string[]): string {
		// Use node ID hash to deterministically select instrument
		const hash = this.hashString(node.id);
		const index = hash % instruments.length;
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
	 * Calculate note duration based on word count
	 */
	private calculateDuration(node: LocalSoundscapeNode): number {
		// Longer durations to create sustained, flowing soundscape
		// Base duration: 2.0 to 6.0 seconds based on word count
		const minDuration = 2.0;
		const maxDuration = 6.0;

		const wordCountNormalized = Math.min(node.wordCount / 500, 1); // Cap at 500 words
		const duration = minDuration + (wordCountNormalized * (maxDuration - minDuration));

		return duration;
	}

	/**
	 * Calculate velocity based on modification recency
	 */
	private calculateVelocity(node: LocalSoundscapeNode): number {
		// Recent modifications = higher velocity (louder/brighter)
		const now = Date.now();
		const daysSinceModified = (now - node.modified) / (1000 * 60 * 60 * 24);

		// Map to 0.3 to 1.0 range
		// Fresh (0 days) = 1.0
		// Old (30+ days) = 0.3
		const velocity = Math.max(0.3, 1.0 - (daysSinceModified / 30) * 0.7);

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
