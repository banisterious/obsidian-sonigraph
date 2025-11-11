/**
 * RhythmicPatternGenerator
 *
 * Organizes note timing into musical patterns for temporal coherence.
 * Replaces random timing with structured rhythmic organization.
 *
 * Pattern Types:
 * - Sequential: Even spacing (default)
 * - Arpeggio: Ascending/descending rapid notes
 * - Ostinato: Repeating rhythmic figure
 * - Pulse: Rhythmic accent pattern
 * - Cluster: Simultaneous or near-simultaneous notes
 * - Decay: Fast → slow timing (ritardando)
 * - Accelerando: Slow → fast timing
 */

import { getLogger } from '../../logging';

const logger = getLogger('RhythmicPatternGenerator');

/**
 * Rhythmic pattern types
 */
export type RhythmicPattern =
	| 'sequential'     // Even spacing (current default)
	| 'arpeggio'       // Ascending/descending rapid notes
	| 'ostinato'       // Repeating rhythmic figure
	| 'pulse'          // Rhythmic accent pattern
	| 'cluster'        // Simultaneous or near-simultaneous
	| 'decay'          // Fast → slow timing
	| 'accelerando';   // Slow → fast timing

/**
 * Rhythmic pattern configuration
 */
export interface RhythmicConfig {
	enabled: boolean;
	patternPerDepth: {
		center: RhythmicPattern;
		depth1: RhythmicPattern;
		depth2: RhythmicPattern;
		depth3Plus: RhythmicPattern;
	};

	tempo: number;                        // BPM (default: 60)
	timeSignature: [number, number];      // e.g., [4, 4]

	// Pattern-specific configuration
	patterns: {
		arpeggio: {
			direction: 'ascending' | 'descending' | 'alternating';
			noteValue: '16th' | '8th' | 'triplet';
		};

		ostinato: {
			pattern: number[];   // Rhythmic pattern [1, 0.5, 0.5, 1] = quarter, eighth, eighth, quarter
			repeat: number;      // How many times to repeat
		};

		pulse: {
			accentPattern: number[]; // [1, 0, 0, 0] = accent every 4th note
			accentMultiplier: number; // Volume boost for accented notes (1.0-2.0)
		};

		decay: {
			initialInterval: number;  // Starting interval in beats (fast)
			finalInterval: number;    // Ending interval in beats (slow)
			curve: 'linear' | 'exponential';
		};

		accelerando: {
			initialInterval: number;  // Starting interval in beats (slow)
			finalInterval: number;    // Ending interval in beats (fast)
			curve: 'linear' | 'exponential';
		};

		cluster: {
			spread: number;  // Max time spread in seconds (default: 0.1s)
		};
	};

	// Global timing constraints
	depthGapDuration: number;  // Seconds between depth layers (default: 1.0s)
}

/**
 * Timing result with optional velocity modification
 */
export interface TimingResult {
	timing: number;
	velocityMultiplier?: number;  // For accent patterns
}

/**
 * Default rhythmic configuration
 */
export const DEFAULT_RHYTHMIC_CONFIG: RhythmicConfig = {
	enabled: false,
	patternPerDepth: {
		center: 'sequential',
		depth1: 'arpeggio',
		depth2: 'pulse',
		depth3Plus: 'sequential'
	},
	tempo: 60,
	timeSignature: [4, 4],
	patterns: {
		arpeggio: {
			direction: 'ascending',
			noteValue: '8th'
		},
		ostinato: {
			pattern: [1, 0.5, 0.5, 1],  // Quarter, eighth, eighth, quarter
			repeat: 4
		},
		pulse: {
			accentPattern: [1, 0, 0, 0],  // Accent every 4th note
			accentMultiplier: 1.3
		},
		decay: {
			initialInterval: 0.25,  // Fast start (16th notes)
			finalInterval: 2.0,     // Slow end (half notes)
			curve: 'exponential'
		},
		accelerando: {
			initialInterval: 2.0,   // Slow start
			finalInterval: 0.25,    // Fast end
			curve: 'exponential'
		},
		cluster: {
			spread: 0.1  // 100ms max spread
		}
	},
	depthGapDuration: 1.0
};

/**
 * RhythmicPatternGenerator class
 */
export class RhythmicPatternGenerator {
	private config: RhythmicConfig;

	constructor(config: Partial<RhythmicConfig>) {
		this.config = { ...DEFAULT_RHYTHMIC_CONFIG, ...config };

		logger.info('rhythmic-init', 'RhythmicPatternGenerator initialized', {
			enabled: this.config.enabled,
			tempo: this.config.tempo,
			centerPattern: this.config.patternPerDepth.center
		});
	}

	/**
	 * Generate timing values for a group of nodes
	 */
	public generateTimings(
		nodeCount: number,
		pattern: RhythmicPattern,
		startTime: number
	): TimingResult[] {
		if (!this.config.enabled || nodeCount === 0) {
			// Fallback to even spacing
			return Array.from({ length: nodeCount }, (_, i) => ({
				timing: startTime + i * 0.5  // 500ms default spacing
			}));
		}

		const beatDuration = 60 / this.config.tempo;

		switch (pattern) {
			case 'arpeggio':
				return this.generateArpeggio(nodeCount, startTime, beatDuration);

			case 'ostinato':
				return this.generateOstinato(nodeCount, startTime, beatDuration);

			case 'pulse':
				return this.generatePulse(nodeCount, startTime, beatDuration);

			case 'cluster':
				return this.generateCluster(nodeCount, startTime);

			case 'decay':
				return this.generateDecay(nodeCount, startTime, beatDuration);

			case 'accelerando':
				return this.generateAccelerando(nodeCount, startTime, beatDuration);

			case 'sequential':
			default:
				return this.generateSequential(nodeCount, startTime, beatDuration);
		}
	}

	/**
	 * Generate sequential (even spacing) pattern
	 */
	private generateSequential(count: number, start: number, beat: number): TimingResult[] {
		return Array.from({ length: count }, (_, i) => ({
			timing: start + (i * beat)
		}));
	}

	/**
	 * Generate arpeggio pattern (rapid ascending/descending notes)
	 */
	private generateArpeggio(count: number, start: number, beat: number): TimingResult[] {
		const config = this.config.patterns.arpeggio;
		const noteValue = config.noteValue === '16th' ? beat / 4 :
		                  config.noteValue === 'triplet' ? beat / 3 : beat / 2;

		const timings: TimingResult[] = [];
		let currentTime = start;

		for (let i = 0; i < count; i++) {
			timings.push({ timing: currentTime });

			// For alternating direction, reverse every other repetition
			if (config.direction === 'alternating') {
				const cycleLength = 8;  // Alternate every 8 notes
				const cycle = Math.floor(i / cycleLength);
				const inReverse = cycle % 2 === 1;

				if (inReverse) {
					// Descending: slightly longer intervals
					currentTime += noteValue * 1.1;
				} else {
					// Ascending: standard intervals
					currentTime += noteValue;
				}
			} else {
				currentTime += noteValue;
			}
		}

		logger.debug('arpeggio-generated', `Generated arpeggio pattern`, {
			count,
			noteValue: config.noteValue,
			direction: config.direction,
			duration: timings[timings.length - 1].timing - start
		});

		return timings;
	}

	/**
	 * Generate ostinato pattern (repeating rhythmic figure)
	 */
	private generateOstinato(count: number, start: number, beat: number): TimingResult[] {
		const pattern = this.config.patterns.ostinato.pattern;
		const timings: TimingResult[] = [];
		let currentTime = start;

		for (let i = 0; i < count; i++) {
			const patternIndex = i % pattern.length;
			timings.push({ timing: currentTime });
			currentTime += pattern[patternIndex] * beat;
		}

		logger.debug('ostinato-generated', `Generated ostinato pattern`, {
			count,
			pattern: pattern.join(', '),
			duration: timings[timings.length - 1].timing - start
		});

		return timings;
	}

	/**
	 * Generate pulse pattern (rhythmic accents)
	 */
	private generatePulse(count: number, start: number, beat: number): TimingResult[] {
		const config = this.config.patterns.pulse;
		const timings: TimingResult[] = [];
		let currentTime = start;

		for (let i = 0; i < count; i++) {
			const accentIndex = i % config.accentPattern.length;
			const isAccent = config.accentPattern[accentIndex] === 1;

			timings.push({
				timing: currentTime,
				velocityMultiplier: isAccent ? config.accentMultiplier : 1.0
			});

			currentTime += beat;
		}

		logger.debug('pulse-generated', `Generated pulse pattern`, {
			count,
			accentPattern: config.accentPattern.join(', '),
			accentMultiplier: config.accentMultiplier
		});

		return timings;
	}

	/**
	 * Generate cluster pattern (simultaneous or near-simultaneous)
	 */
	private generateCluster(count: number, start: number): TimingResult[] {
		const spread = this.config.patterns.cluster.spread;

		return Array.from({ length: count }, (_, i) => ({
			timing: start + (Math.random() * spread)
		}));
	}

	/**
	 * Generate decay pattern (fast → slow timing)
	 */
	private generateDecay(count: number, start: number, beat: number): TimingResult[] {
		const config = this.config.patterns.decay;
		const timings: TimingResult[] = [];
		let currentTime = start;

		for (let i = 0; i < count; i++) {
			timings.push({ timing: currentTime });

			// Calculate interval based on position in sequence
			const progress = i / (count - 1);  // 0 to 1

			let interval: number;
			if (config.curve === 'exponential') {
				// Exponential decay: fast start, slow end
				interval = config.initialInterval + (config.finalInterval - config.initialInterval) * Math.pow(progress, 2);
			} else {
				// Linear decay
				interval = config.initialInterval + (config.finalInterval - config.initialInterval) * progress;
			}

			currentTime += interval * beat;
		}

		logger.debug('decay-generated', `Generated decay pattern`, {
			count,
			curve: config.curve,
			initialInterval: config.initialInterval,
			finalInterval: config.finalInterval
		});

		return timings;
	}

	/**
	 * Generate accelerando pattern (slow → fast timing)
	 */
	private generateAccelerando(count: number, start: number, beat: number): TimingResult[] {
		const config = this.config.patterns.accelerando;
		const timings: TimingResult[] = [];
		let currentTime = start;

		for (let i = 0; i < count; i++) {
			timings.push({ timing: currentTime });

			// Calculate interval based on position in sequence
			const progress = i / (count - 1);  // 0 to 1

			let interval: number;
			if (config.curve === 'exponential') {
				// Exponential acceleration: slow start, fast end
				interval = config.initialInterval - (config.initialInterval - config.finalInterval) * Math.pow(progress, 2);
			} else {
				// Linear acceleration
				interval = config.initialInterval - (config.initialInterval - config.finalInterval) * progress;
			}

			currentTime += interval * beat;
		}

		logger.debug('accelerando-generated', `Generated accelerando pattern`, {
			count,
			curve: config.curve,
			initialInterval: config.initialInterval,
			finalInterval: config.finalInterval
		});

		return timings;
	}

	/**
	 * Get pattern for a given depth
	 */
	public getPatternForDepth(depth: number): RhythmicPattern {
		if (depth === 0) return this.config.patternPerDepth.center;
		if (depth === 1) return this.config.patternPerDepth.depth1;
		if (depth === 2) return this.config.patternPerDepth.depth2;
		return this.config.patternPerDepth.depth3Plus;
	}

	/**
	 * Get depth gap duration
	 */
	public getDepthGapDuration(): number {
		return this.config.depthGapDuration;
	}

	/**
	 * Update configuration
	 */
	public updateConfig(config: Partial<RhythmicConfig>): void {
		this.config = { ...this.config, ...config };
		logger.info('rhythmic-config-updated', 'Rhythmic config updated', {
			enabled: this.config.enabled,
			tempo: this.config.tempo
		});
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): RhythmicConfig {
		return { ...this.config };
	}
}
