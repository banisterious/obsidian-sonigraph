/**
 * DynamicPanningController
 *
 * Creates smooth, animated stereo field transitions for immersive spatial audio.
 * Instead of static left/right panning, creates evolving spatial landscapes
 * with smooth interpolation and optional animation.
 *
 * Features:
 * - Smooth interpolation between pan positions
 * - Animated stereo field evolution over time
 * - Depth-based spatial positioning
 * - Configurable smoothing and animation speed
 */

import { getLogger } from '../../logging';

const logger = getLogger('DynamicPanningController');

/**
 * Dynamic panning configuration
 */
export interface DynamicPanningConfig {
	enabled: boolean;
	smoothingFactor: number;   // 0-1, how gradual transitions are (0 = instant, 1 = very smooth)
	animationSpeed: number;    // 0.5-5, how fast stereo field evolves (1 = normal)
}

/**
 * Panning result for a mapping
 */
export interface PanningResult {
	pan: number;           // -1 (left) to +1 (right)
	spatialDepth: number;  // 0-1, perceived distance (for reverb/filtering)
}

/**
 * Extended mapping interface for dynamic panning
 */
export interface DynamicPanningMapping {
	pan?: number;          // Original pan position
	depth?: number;        // Depth in graph
	timing?: number;       // Note timing
	instrument?: string;   // Instrument name
	direction?: 'center' | 'incoming' | 'outgoing' | 'bidirectional';
}

/**
 * Default dynamic panning configuration
 */
export const DEFAULT_DYNAMIC_PANNING_CONFIG: DynamicPanningConfig = {
	enabled: false,
	smoothingFactor: 0.3,    // 30% smoothing
	animationSpeed: 2.0      // 2x normal speed
};

/**
 * DynamicPanningController class
 */
export class DynamicPanningController {
	private config: DynamicPanningConfig;

	constructor(config: Partial<DynamicPanningConfig>) {
		this.config = { ...DEFAULT_DYNAMIC_PANNING_CONFIG, ...config };

		logger.info('dynamic-panning-init', 'DynamicPanningController initialized', {
			enabled: this.config.enabled,
			smoothingFactor: this.config.smoothingFactor,
			animationSpeed: this.config.animationSpeed
		});
	}

	/**
	 * Apply dynamic panning to mappings
	 * Creates smooth spatial transitions and optional animation
	 */
	public applyDynamicPanning<T extends DynamicPanningMapping>(mappings: T[]): T[] {
		if (!this.config.enabled || mappings.length === 0) {
			return mappings;
		}

		logger.debug('panning-apply', 'Applying dynamic panning', {
			totalMappings: mappings.length
		});

		// Calculate total duration for temporal animation
		const totalDuration = this.getTotalDuration(mappings);

		mappings.forEach((mapping, index) => {
			// Get base pan position (if already set by directional panning)
			const basePan = mapping.pan ?? 0;

			// Calculate temporal animation offset
			const position = (mapping.timing || 0) / totalDuration;
			const animationOffset = this.calculateAnimationOffset(position);

			// Calculate depth-based spatial spread
			const depthSpread = this.calculateDepthSpread(mapping.depth || 0);

			// Apply smoothing to transitions
			let smoothedPan = basePan;
			if (index > 0) {
				const prevPan = mappings[index - 1].pan ?? 0;
				smoothedPan = this.smoothTransition(prevPan, basePan);
			}

			// Combine all panning factors
			let finalPan = smoothedPan + animationOffset + depthSpread;

			// Clamp to valid range [-1, 1]
			finalPan = Math.max(-1, Math.min(1, finalPan));

			// Update mapping
			mapping.pan = finalPan;
		});

		// Log statistics
		const avgPan = mappings.reduce((sum, m) => sum + Math.abs(m.pan || 0), 0) / mappings.length;
		const leftCount = mappings.filter(m => (m.pan || 0) < -0.1).length;
		const centerCount = mappings.filter(m => Math.abs(m.pan || 0) <= 0.1).length;
		const rightCount = mappings.filter(m => (m.pan || 0) > 0.1).length;

		logger.info('panning-complete', 'Dynamic panning applied', {
			totalMappings: mappings.length,
			avgPanSpread: avgPan.toFixed(2),
			leftNotes: leftCount,
			centerNotes: centerCount,
			rightNotes: rightCount
		});

		return mappings;
	}

	/**
	 * Calculate animated pan offset based on position in sequence
	 * Creates evolving stereo field over time
	 */
	private calculateAnimationOffset(position: number): number {
		// Use sine wave for smooth back-and-forth animation
		// Speed controlled by animationSpeed config
		const cycles = this.config.animationSpeed;
		const wave = Math.sin(position * Math.PI * 2 * cycles);

		// Scale to ±0.3 range (subtle animation, doesn't override directional panning)
		return wave * 0.3;
	}

	/**
	 * Calculate depth-based spatial spread
	 * Deeper nodes get wider stereo placement for sense of space
	 */
	private calculateDepthSpread(depth: number): number {
		// Deeper depths get slightly wider stereo spread
		// Center (depth 0) = 0 spread
		// Depth 3+ = ±0.2 spread variation

		if (depth === 0) return 0;

		// Use hash-like calculation for consistent but varied spread per depth
		const spreadFactor = Math.sin(depth * 2.7) * 0.5 + 0.5; // 0-1 range

		// Scale based on depth: deeper = wider
		const maxSpread = Math.min(depth * 0.1, 0.2); // Cap at 0.2

		return (spreadFactor - 0.5) * maxSpread * 2; // -maxSpread to +maxSpread
	}

	/**
	 * Smooth transition between pan positions
	 * Reduces jarring jumps in stereo field
	 */
	private smoothTransition(prevPan: number, targetPan: number): number {
		const smoothing = this.config.smoothingFactor;

		// Linear interpolation weighted by smoothing factor
		// smoothing = 0: instant (targetPan)
		// smoothing = 1: very gradual (heavily weighted toward prevPan)
		return prevPan * smoothing + targetPan * (1 - smoothing);
	}

	/**
	 * Helper: Get total duration of sequence
	 */
	private getTotalDuration<T extends DynamicPanningMapping>(mappings: T[]): number {
		if (mappings.length === 0) return 1.0; // Avoid division by zero

		const maxTiming = mappings.reduce((max, m) =>
			Math.max(max, m.timing || 0), 0
		);

		return maxTiming || 1.0; // Ensure non-zero
	}

	/**
	 * Update configuration
	 */
	public updateConfig(config: Partial<DynamicPanningConfig>): void {
		this.config = { ...this.config, ...config };
		logger.info('panning-config-updated', 'Dynamic panning config updated', {
			smoothingFactor: this.config.smoothingFactor,
			animationSpeed: this.config.animationSpeed
		});
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): DynamicPanningConfig {
		return { ...this.config };
	}
}
