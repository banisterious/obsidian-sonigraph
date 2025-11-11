/**
 * TensionArcController
 *
 * Creates melodic tension and release arcs for emotional narrative in soundscapes.
 * Modulates pitch, velocity, and timing to create journey-like progressions.
 *
 * Arc Shapes:
 * - rise-fall: Tension builds to peak, then releases (classical arc)
 * - build: Continuous tension increase (crescendo)
 * - release: Continuous tension decrease (decrescendo)
 * - wave: Multiple tension peaks (undulating)
 * - plateau: Sustained high tension (dramatic)
 */

import { getLogger } from '../../logging';

const logger = getLogger('TensionArcController');

/**
 * Tension arc shape types
 */
export type TensionArcShape =
	| 'rise-fall'    // Tension builds to peak, then releases
	| 'build'        // Continuous tension increase
	| 'release'      // Continuous tension decrease
	| 'wave'         // Multiple tension peaks
	| 'plateau';     // Sustained high tension

/**
 * Tension tracking configuration
 */
export interface TensionTrackingConfig {
	enabled: boolean;
	arcShape: TensionArcShape;
	peakPosition: number;  // 0-1, where tension peaks in sequence

	// Modulation amounts
	pitchModulation: number;     // Semitones to raise/lower at peak (default: 5)
	velocityModulation: number;  // Velocity multiplier at peak (default: 1.3)
	durationModulation: number;  // Duration multiplier at peak (default: 1.2)
}

/**
 * Tension modulation result
 */
export interface TensionModulation {
	pitchOffset: number;       // Semitones to add
	velocityMultiplier: number; // Multiply velocity
	durationMultiplier: number; // Multiply duration
	tensionLevel: number;       // 0-1 current tension
}

/**
 * Default tension tracking configuration
 */
export const DEFAULT_TENSION_CONFIG: TensionTrackingConfig = {
	enabled: false,
	arcShape: 'rise-fall',
	peakPosition: 0.6,
	pitchModulation: 5,        // Up to 5 semitones higher at peak
	velocityModulation: 1.3,   // 30% louder at peak
	durationModulation: 1.2    // 20% longer notes at peak
};

/**
 * TensionArcController class
 */
export class TensionArcController {
	private config: TensionTrackingConfig;

	constructor(config: Partial<TensionTrackingConfig>) {
		this.config = { ...DEFAULT_TENSION_CONFIG, ...config };

		logger.info('tension-init', 'TensionArcController initialized', {
			enabled: this.config.enabled,
			arcShape: this.config.arcShape,
			peakPosition: this.config.peakPosition
		});
	}

	/**
	 * Calculate tension level at a specific position in sequence
	 * @param position 0-1, position in overall sequence
	 * @returns tension level 0-1
	 */
	public calculateTensionLevel(position: number): number {
		if (!this.config.enabled) {
			return 0.5; // Neutral tension
		}

		// Clamp position to 0-1
		position = Math.max(0, Math.min(1, position));

		switch (this.config.arcShape) {
			case 'rise-fall':
				return this.calculateRiseFall(position);

			case 'build':
				return this.calculateBuild(position);

			case 'release':
				return this.calculateRelease(position);

			case 'wave':
				return this.calculateWave(position);

			case 'plateau':
				return this.calculatePlateau(position);

			default:
				return 0.5;
		}
	}

	/**
	 * Get modulation for a note at given position
	 */
	public getModulation(position: number): TensionModulation {
		const tensionLevel = this.calculateTensionLevel(position);

		// Map tension level (0-1) to modulation amounts
		// At tension=0.5 (neutral), no modulation
		// At tension=1.0 (peak), full modulation
		// At tension=0.0 (low), negative modulation

		const tensionDeviation = tensionLevel - 0.5; // -0.5 to +0.5

		return {
			pitchOffset: tensionDeviation * 2 * this.config.pitchModulation,
			velocityMultiplier: 1 + (tensionDeviation * 2 * (this.config.velocityModulation - 1)),
			durationMultiplier: 1 + (tensionDeviation * 2 * (this.config.durationModulation - 1)),
			tensionLevel
		};
	}

	/**
	 * Rise-Fall arc: Tension builds to peak, then releases
	 * Classic dramatic arc shape
	 */
	private calculateRiseFall(position: number): number {
		const peakPos = this.config.peakPosition;

		if (position < peakPos) {
			// Rising phase: ease-in curve
			const progress = position / peakPos;
			return 0.2 + (0.8 * this.easeInQuad(progress));
		} else {
			// Falling phase: ease-out curve
			const progress = (position - peakPos) / (1 - peakPos);
			return 1.0 - (0.8 * this.easeOutQuad(progress));
		}
	}

	/**
	 * Build arc: Continuous tension increase
	 * Crescendo effect
	 */
	private calculateBuild(position: number): number {
		// Exponential build for dramatic effect
		return 0.2 + (0.8 * Math.pow(position, 1.5));
	}

	/**
	 * Release arc: Continuous tension decrease
	 * Decrescendo effect
	 */
	private calculateRelease(position: number): number {
		// Exponential decay
		return 1.0 - (0.8 * Math.pow(position, 1.5));
	}

	/**
	 * Wave arc: Multiple tension peaks
	 * Undulating pattern
	 */
	private calculateWave(position: number): number {
		// Multiple sine waves for varied peaks
		const numPeaks = 3;
		const wave = Math.sin(position * Math.PI * numPeaks);

		// Map sine wave (-1 to 1) to tension (0.2 to 1.0)
		return 0.6 + (0.4 * wave);
	}

	/**
	 * Plateau arc: Sustained high tension
	 * Dramatic sustained effect
	 */
	private calculatePlateau(position: number): number {
		const peakPos = this.config.peakPosition;
		const plateauWidth = 0.3; // Plateau duration

		const plateauStart = peakPos - (plateauWidth / 2);
		const plateauEnd = peakPos + (plateauWidth / 2);

		if (position < plateauStart) {
			// Rising to plateau
			const progress = position / plateauStart;
			return 0.2 + (0.8 * this.easeInQuad(progress));
		} else if (position <= plateauEnd) {
			// On plateau - sustained high tension
			return 1.0;
		} else {
			// Falling from plateau
			const progress = (position - plateauEnd) / (1 - plateauEnd);
			return 1.0 - (0.8 * this.easeOutQuad(progress));
		}
	}

	/**
	 * Ease-in quadratic curve
	 */
	private easeInQuad(t: number): number {
		return t * t;
	}

	/**
	 * Ease-out quadratic curve
	 */
	private easeOutQuad(t: number): number {
		return t * (2 - t);
	}

	/**
	 * Update configuration
	 */
	public updateConfig(config: Partial<TensionTrackingConfig>): void {
		this.config = { ...this.config, ...config };
		logger.info('tension-config-updated', 'Tension config updated', {
			arcShape: this.config.arcShape,
			peakPosition: this.config.peakPosition
		});
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): TensionTrackingConfig {
		return { ...this.config };
	}
}
