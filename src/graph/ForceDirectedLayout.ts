/**
 * ForceDirectedLayout
 *
 * Simple force-directed layout algorithm for Local Soundscape
 * Uses D3's force simulation for natural graph positioning
 */

import * as d3 from 'd3';
import { LocalSoundscapeData, LocalSoundscapeNode } from './LocalSoundscapeExtractor';
import { getLogger } from '../logging';

const logger = getLogger('ForceDirectedLayout');

export interface ForceLayoutConfig {
	width: number;
	height: number;
	centerX: number;
	centerY: number;
	linkDistance: number;
	linkStrength: number;
	chargeStrength: number;
	centerStrength: number;
}

export class ForceDirectedLayout {
	private config: ForceLayoutConfig;

	constructor(config: Partial<ForceLayoutConfig> = {}) {
		this.config = {
			width: 800,
			height: 600,
			centerX: 400,
			centerY: 300,
			linkDistance: 80,
			linkStrength: 0.5,
			chargeStrength: -300,
			centerStrength: 0.1,
			...config
		};

		logger.debug('force-layout-init', 'ForceDirectedLayout initialized', this.config);
	}

	/**
	 * Apply force-directed layout to graph data
	 */
	applyLayout(data: LocalSoundscapeData): void {
		const startTime = performance.now();

		logger.info('layout-start', 'Applying force-directed layout', {
			nodes: data.allNodes.length,
			links: data.links.length
		});

		// Create force simulation
		const simulation = d3.forceSimulation(data.allNodes as any)
			.force('link', d3.forceLink(data.links)
				.id((d: any) => d.id)
				.distance(this.config.linkDistance)
				.strength(this.config.linkStrength))
			.force('charge', d3.forceManyBody()
				.strength(this.config.chargeStrength))
			.force('center', d3.forceCenter(this.config.centerX, this.config.centerY)
				.strength(this.config.centerStrength))
			.force('collision', d3.forceCollide()
				.radius(20));

		// Pin center node to center
		const centerNode = data.allNodes.find(n => n.depth === 0);
		if (centerNode) {
			centerNode.x = this.config.centerX;
			centerNode.y = this.config.centerY;
			// @ts-ignore - D3 adds fx/fy for fixed positions
			centerNode.fx = this.config.centerX;
			// @ts-ignore
			centerNode.fy = this.config.centerY;
		}

		// Run simulation synchronously (not animated)
		const iterations = 300; // Number of ticks to run
		for (let i = 0; i < iterations; i++) {
			simulation.tick();
		}

		// Stop simulation
		simulation.stop();

		// Unpin center node (keep computed position but allow future updates)
		if (centerNode) {
			// @ts-ignore
			delete centerNode.fx;
			// @ts-ignore
			delete centerNode.fy;
		}

		const duration = performance.now() - startTime;

		logger.info('layout-complete', 'Force-directed layout complete', {
			duration: duration.toFixed(2) + 'ms',
			iterations
		});
	}

	/**
	 * Calculate bounds of positioned nodes
	 */
	calculateBounds(data: LocalSoundscapeData): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
		if (data.allNodes.length === 0) {
			return { minX: 0, minY: 0, maxX: this.config.width, maxY: this.config.height, width: this.config.width, height: this.config.height };
		}

		const minX = Math.min(...data.allNodes.map(n => n.x || 0));
		const maxX = Math.max(...data.allNodes.map(n => n.x || 0));
		const minY = Math.min(...data.allNodes.map(n => n.y || 0));
		const maxY = Math.max(...data.allNodes.map(n => n.y || 0));

		return {
			minX,
			minY,
			maxX,
			maxY,
			width: maxX - minX,
			height: maxY - minY
		};
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<ForceLayoutConfig>): void {
		this.config = {
			...this.config,
			...config
		};
		logger.debug('config-updated', 'Force layout config updated', this.config);
	}
}
