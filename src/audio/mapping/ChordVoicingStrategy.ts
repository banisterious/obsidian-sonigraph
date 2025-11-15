/**
 * ChordVoicingStrategy
 *
 * Generates harmonic chord voicings for Local Soundscape based on depth.
 * Creates polyphonic richness by adding harmony voices to melodic notes.
 *
 * Strategy:
 * - Depth 0 (center): Melody only (monophonic)
 * - Depth 1: Melody + third (dyad)
 * - Depth 2: Melody + third + fifth (triad)
 * - Depth 3+: Full chord voicing with extensions
 */

import { MusicalTheoryEngine } from '../theory/MusicalTheoryEngine';
import { ChordDefinition, ChordQuality } from '../theory/types';
import { getLogger } from '../../logging';

const logger = getLogger('ChordVoicingStrategy');

/**
 * Voicing strategy types
 */
export type VoicingStrategy =
	| 'depth-based'      // Voices increase with depth (default)
	| 'close'            // All voices in close position
	| 'drop-2'           // Drop-2 voicing (second voice dropped octave)
	| 'spread'           // Wide voicing across multiple octaves
	| 'root-position'    // Root position triads only
	| 'inversions';      // Use chord inversions

/**
 * Chord voicing configuration
 */
export interface ChordVoicingConfig {
	enabled: boolean;
	strategy: VoicingStrategy;

	// Number of voices by depth
	voicesByDepth: {
		center: number;      // Depth 0: 1 (melody only)
		depth1: number;      // Depth 1: 2 (dyad)
		depth2: number;      // Depth 2: 3 (triad)
		depth3Plus: number;  // Depth 3+: 4 (seventh chord)
	};

	// Chord quality selection
	chordQuality: {
		preferMajor: boolean;    // Prefer major chords (brighter)
		preferMinor: boolean;    // Prefer minor chords (darker)
		allowDiminished: boolean;
		allowAugmented: boolean;
		allowSevenths: boolean;
		allowExtensions: boolean; // 9ths, 11ths, 13ths
	};

	// Voicing constraints
	maxVoiceSpread: number;  // Max semitones between lowest and highest voice
	minVoiceSpacing: number; // Min semitones between adjacent voices

	// Harmonic rhythm
	voicingDensity: number;  // 0-1, how many notes get chord voicing (1 = all)
}

/**
 * Chord voicing result
 */
export interface ChordVoicing {
	rootFrequency: number;
	frequencies: number[];    // All voice frequencies (including root)
	intervals: number[];      // Semitone intervals from root
	chordQuality: ChordQuality;
	voiceCount: number;
}

/**
 * Default chord voicing configuration
 */
export const DEFAULT_CHORD_VOICING_CONFIG: ChordVoicingConfig = {
	enabled: false,
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
	maxVoiceSpread: 19,  // Max of octave + perfect fifth
	minVoiceSpacing: 3,  // Min of minor third
	voicingDensity: 0.5  // 50% of notes get chord voicing
};

/**
 * ChordVoicingStrategy class
 */
export class ChordVoicingStrategy {
	private config: ChordVoicingConfig;
	private musicalTheoryEngine: MusicalTheoryEngine;

	constructor(
		config: Partial<ChordVoicingConfig>,
		musicalTheoryEngine: MusicalTheoryEngine
	) {
		this.config = { ...DEFAULT_CHORD_VOICING_CONFIG, ...config };
		this.musicalTheoryEngine = musicalTheoryEngine;

		logger.info('voicing-init', 'ChordVoicingStrategy initialized', {
			enabled: this.config.enabled,
			strategy: this.config.strategy,
			centerVoices: this.config.voicesByDepth.center,
			depth3Voices: this.config.voicesByDepth.depth3Plus
		});
	}

	/**
	 * Generate chord voicing for a given frequency and depth
	 */
	public generateVoicing(
		rootFrequency: number,
		depth: number,
		shouldVoice?: boolean
	): ChordVoicing {
		// Determine if this note should be voiced based on density
		const applyVoicing = shouldVoice ?? (Math.random() < this.config.voicingDensity);

		if (!this.config.enabled || !applyVoicing) {
			// Return single note (no voicing)
			return {
				rootFrequency,
				frequencies: [rootFrequency],
				intervals: [0],
				chordQuality: 'major',
				voiceCount: 1
			};
		}

		// Get number of voices for this depth
		const targetVoices = this.getVoiceCountForDepth(depth);

		// Select chord quality based on config and musical context
		const chordQuality = this.selectChordQuality(rootFrequency);

		// Generate chord based on strategy
		const voicing = this.generateVoicingByStrategy(
			rootFrequency,
			targetVoices,
			chordQuality
		);

		logger.debug('voicing-generated', 'Generated chord voicing', {
			depth,
			voices: voicing.voiceCount,
			quality: chordQuality,
			rootFreq: rootFrequency.toFixed(2),
			strategy: this.config.strategy
		});

		return voicing;
	}

	/**
	 * Get voice count for a given depth
	 */
	private getVoiceCountForDepth(depth: number): number {
		if (depth === 0) return this.config.voicesByDepth.center;
		if (depth === 1) return this.config.voicesByDepth.depth1;
		if (depth === 2) return this.config.voicesByDepth.depth2;
		return this.config.voicesByDepth.depth3Plus;
	}

	/**
	 * Select chord quality based on configuration and musical context
	 */
	private selectChordQuality(rootFrequency: number): ChordQuality {
		const scale = this.musicalTheoryEngine.getCurrentScale();
		const scaleDegree = this.musicalTheoryEngine.getScaleDegree(rootFrequency);

		// Determine if this scale degree typically has major or minor quality
		// In major scale: I, IV, V = major; ii, iii, vi = minor; vii = diminished
		const majorDegrees = [0, 3, 4]; // I, IV, V (0-indexed: 0, 3, 4)
		const minorDegrees = [1, 2, 5]; // ii, iii, vi
		const diminishedDegrees = [6]; // vii°

		const isMajorDegree = majorDegrees.includes(scaleDegree % 7);
		const isMinorDegree = minorDegrees.includes(scaleDegree % 7);
		const isDiminishedDegree = diminishedDegrees.includes(scaleDegree % 7);

		// Apply user preferences
		if (this.config.chordQuality.preferMajor && isMajorDegree) {
			return this.config.chordQuality.allowSevenths ? 'major-seventh' : 'major';
		}

		if (this.config.chordQuality.preferMinor && isMinorDegree) {
			return this.config.chordQuality.allowSevenths ? 'minor-seventh' : 'minor';
		}

		if (this.config.chordQuality.allowDiminished && isDiminishedDegree) {
			return 'diminished';
		}

		// Default: use major or minor based on scale type
		if (scale.type.includes('minor')) {
			return this.config.chordQuality.allowSevenths ? 'minor-seventh' : 'minor';
		}

		return this.config.chordQuality.allowSevenths ? 'major-seventh' : 'major';
	}

	/**
	 * Generate voicing based on selected strategy
	 */
	private generateVoicingByStrategy(
		rootFrequency: number,
		targetVoices: number,
		chordQuality: ChordQuality
	): ChordVoicing {
		switch (this.config.strategy) {
			case 'depth-based':
			case 'close':
				return this.generateCloseVoicing(rootFrequency, targetVoices, chordQuality);

			case 'drop-2':
				return this.generateDrop2Voicing(rootFrequency, targetVoices, chordQuality);

			case 'spread':
				return this.generateSpreadVoicing(rootFrequency, targetVoices, chordQuality);

			case 'root-position':
				return this.generateRootPositionVoicing(rootFrequency, targetVoices, chordQuality);

			case 'inversions':
				return this.generateInversionVoicing(rootFrequency, targetVoices, chordQuality);

			default:
				return this.generateCloseVoicing(rootFrequency, targetVoices, chordQuality);
		}
	}

	/**
	 * Generate close position voicing (all voices within an octave)
	 */
	private generateCloseVoicing(
		rootFrequency: number,
		targetVoices: number,
		chordQuality: ChordQuality
	): ChordVoicing {
		// Get basic chord intervals
		const intervals = this.getIntervalsForQuality(chordQuality, targetVoices);

		// Generate frequencies
		const frequencies: number[] = intervals.map(interval =>
			this.musicalTheoryEngine.generateHarmonicInterval(rootFrequency, interval)
		);

		return {
			rootFrequency,
			frequencies,
			intervals,
			chordQuality,
			voiceCount: frequencies.length
		};
	}

	/**
	 * Generate drop-2 voicing (second voice from top dropped an octave)
	 */
	private generateDrop2Voicing(
		rootFrequency: number,
		targetVoices: number,
		chordQuality: ChordQuality
	): ChordVoicing {
		if (targetVoices < 3) {
			// Not enough voices for drop-2, use close voicing
			return this.generateCloseVoicing(rootFrequency, targetVoices, chordQuality);
		}

		const intervals = this.getIntervalsForQuality(chordQuality, targetVoices);

		// Drop second voice from top by an octave
		const modifiedIntervals = [...intervals];
		modifiedIntervals[modifiedIntervals.length - 2] -= 12;

		// Sort intervals to maintain bass to treble order
		modifiedIntervals.sort((a, b) => a - b);

		const frequencies = modifiedIntervals.map(interval =>
			this.musicalTheoryEngine.generateHarmonicInterval(rootFrequency, interval)
		);

		return {
			rootFrequency,
			frequencies,
			intervals: modifiedIntervals,
			chordQuality,
			voiceCount: frequencies.length
		};
	}

	/**
	 * Generate spread voicing (voices across multiple octaves)
	 */
	private generateSpreadVoicing(
		rootFrequency: number,
		targetVoices: number,
		chordQuality: ChordQuality
	): ChordVoicing {
		const intervals = this.getIntervalsForQuality(chordQuality, targetVoices);

		// Spread voices across octaves
		const spreadIntervals = intervals.map((interval, index) => {
			if (index === 0) return interval; // Keep root
			// Spread each voice by adding octaves
			const octaveSpread = Math.floor(index / 2);
			return interval + (octaveSpread * 12);
		});

		const frequencies = spreadIntervals.map(interval =>
			this.musicalTheoryEngine.generateHarmonicInterval(rootFrequency, interval)
		);

		return {
			rootFrequency,
			frequencies,
			intervals: spreadIntervals,
			chordQuality,
			voiceCount: frequencies.length
		};
	}

	/**
	 * Generate root position voicing (standard triad: root, third, fifth)
	 */
	private generateRootPositionVoicing(
		rootFrequency: number,
		targetVoices: number,
		chordQuality: ChordQuality
	): ChordVoicing {
		// Always use root position intervals regardless of target voices
		const basicIntervals = this.getBasicTriadIntervals(chordQuality);

		// If more voices requested, double the root and/or fifth
		const intervals = [...basicIntervals];
		while (intervals.length < targetVoices) {
			intervals.push(0); // Double root
		}

		const frequencies = intervals.map(interval =>
			this.musicalTheoryEngine.generateHarmonicInterval(rootFrequency, interval)
		);

		return {
			rootFrequency,
			frequencies,
			intervals,
			chordQuality,
			voiceCount: frequencies.length
		};
	}

	/**
	 * Generate inversion voicing (first or second inversion)
	 */
	private generateInversionVoicing(
		rootFrequency: number,
		targetVoices: number,
		chordQuality: ChordQuality
	): ChordVoicing {
		const intervals = this.getIntervalsForQuality(chordQuality, targetVoices);

		// Randomly choose first or second inversion
		const inversion = Math.random() < 0.5 ? 1 : 2;

		// Apply inversion by moving bass voices up an octave
		const invertedIntervals = intervals.map((interval, index) => {
			if (index < inversion) {
				return interval + 12; // Move to next octave
			}
			return interval;
		});

		// Sort to maintain bass to treble order
		invertedIntervals.sort((a, b) => a - b);

		const frequencies = invertedIntervals.map(interval =>
			this.musicalTheoryEngine.generateHarmonicInterval(rootFrequency, interval)
		);

		return {
			rootFrequency,
			frequencies,
			intervals: invertedIntervals,
			chordQuality,
			voiceCount: frequencies.length
		};
	}

	/**
	 * Get intervals for a chord quality
	 */
	private getIntervalsForQuality(quality: ChordQuality, targetVoices: number): number[] {
		const basicIntervals = this.getBasicTriadIntervals(quality);

		// If more voices requested, add extensions
		if (targetVoices > basicIntervals.length) {
			return this.addExtensions(basicIntervals, quality, targetVoices);
		}

		// If fewer voices requested, use subset
		return basicIntervals.slice(0, targetVoices);
	}

	/**
	 * Get basic triad intervals for chord quality
	 */
	private getBasicTriadIntervals(quality: ChordQuality): number[] {
		switch (quality) {
			case 'major':
				return [0, 4, 7]; // Root, major third, perfect fifth

			case 'minor':
				return [0, 3, 7]; // Root, minor third, perfect fifth

			case 'diminished':
				return [0, 3, 6]; // Root, minor third, diminished fifth

			case 'augmented':
				return [0, 4, 8]; // Root, major third, augmented fifth

			case 'major-seventh':
				return [0, 4, 7, 11]; // Root, major third, perfect fifth, major seventh

			case 'minor-seventh':
				return [0, 3, 7, 10]; // Root, minor third, perfect fifth, minor seventh

			case 'dominant-seventh':
				return [0, 4, 7, 10]; // Root, major third, perfect fifth, minor seventh

			case 'half-diminished':
				return [0, 3, 6, 10]; // Root, minor third, diminished fifth, minor seventh

			default:
				return [0, 4, 7]; // Default to major triad
		}
	}

	/**
	 * Add chord extensions (9ths, 11ths, 13ths)
	 */
	private addExtensions(
		basicIntervals: number[],
		quality: ChordQuality,
		targetVoices: number
	): number[] {
		const intervals = [...basicIntervals];

		if (!this.config.chordQuality.allowExtensions) {
			// Just double existing notes if extensions not allowed
			while (intervals.length < targetVoices) {
				intervals.push(intervals[intervals.length - 1]);
			}
			return intervals;
		}

		// Add extensions: 9th, 11th, 13th
		const extensions = [14, 17, 21]; // 9th, 11th, 13th (octave + intervals)

		for (const extension of extensions) {
			if (intervals.length >= targetVoices) break;
			void intervals.push(extension);
		}

		return intervals;
	}

	/**
	 * Update configuration
	 */
	public updateConfig(config: Partial<ChordVoicingConfig>): void {
		this.config = { ...this.config, ...config };
		logger.info('voicing-config-updated', 'Chord voicing config updated', {
			enabled: this.config.enabled,
			strategy: this.config.strategy
		});
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): ChordVoicingConfig {
		return { ...this.config };
	}
}
