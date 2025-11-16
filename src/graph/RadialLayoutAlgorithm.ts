/**
 * RadialLayoutAlgorithm
 *
 * Positions nodes in concentric circles based on their depth from center node.
 * Separates incoming and outgoing links spatially (left/right).
 */

import { LocalSoundscapeData, LocalSoundscapeNode } from './LocalSoundscapeExtractor';
import { getLogger } from '../logging';

const logger = getLogger('RadialLayoutAlgorithm');

export interface RadialLayoutConfig {
	centerX: number;
	centerY: number;
	radiusPerDepth: number;  // Radius increment per depth level
	nodeSpacing: number;     // Minimum spacing between nodes (in degrees)
	separateDirections: boolean; // Separate incoming/outgoing spatially
}

export class RadialLayoutAlgorithm {
	private config: RadialLayoutConfig;

	constructor(config: Partial<RadialLayoutConfig> = {}) {
		this.config = {
			centerX: 400,
			centerY: 300,
			radiusPerDepth: 120,
			nodeSpacing: 15,
			separateDirections: true,
			...config
		};
	}

	/**
	 * Apply radial layout to graph data
	 */
	applyLayout(data: LocalSoundscapeData): void {
		const startTime = performance.now();

		logger.info('layout-start', 'Applying radial layout', {
			totalNodes: data.stats.totalNodes,
			maxDepth: data.stats.maxDepth
		});

		// Position center node
		data.centerNode.x = this.config.centerX;
		data.centerNode.y = this.config.centerY;

		// Position nodes at each depth
		for (let depth = 1; depth <= data.stats.maxDepth; depth++) {
			const nodesAtDepth = data.nodesByDepth.get(depth) || [];
			if (nodesAtDepth.length === 0) continue;

			if (this.config.separateDirections) {
				// Separate incoming (left) and outgoing (right) nodes
				void this.positionNodesByDirection(nodesAtDepth, depth);
			} else {
				// Distribute evenly around circle
				void this.positionNodesEvenly(nodesAtDepth, depth);
			}
		}

		const layoutTime = performance.now() - startTime;

		logger.info('layout-complete', 'Radial layout applied', {
			layoutTime: layoutTime.toFixed(2) + 'ms'
		});
	}

	/**
	 * Position nodes by their direction (incoming left, outgoing right)
	 */
	private positionNodesByDirection(nodes: LocalSoundscapeNode[], depth: number): void {
		const radius = depth * this.config.radiusPerDepth;

		// Separate by direction
		const incomingNodes = nodes.filter(n => n.direction === 'incoming');
		const outgoingNodes = nodes.filter(n => n.direction === 'outgoing');
		const bidirectionalNodes = nodes.filter(n => n.direction === 'bidirectional');

		// Position incoming nodes on left side (180° to 270°)
		if (incomingNodes.length > 0) {
			this.positionNodesInArc(
				incomingNodes,
				radius,
				180, // Start angle (left)
				90   // Arc span
			);
		}

		// Position outgoing nodes on right side (270° to 360° and 0° to 90°)
		if (outgoingNodes.length > 0) {
			this.positionNodesInArc(
				outgoingNodes,
				radius,
				-90, // Start angle (right)
				180  // Arc span
			);
		}

		// Position bidirectional nodes at top/bottom
		if (bidirectionalNodes.length > 0) {
			// Split between top and bottom
			const halfCount = Math.ceil(bidirectionalNodes.length / 2);
			const topNodes = bidirectionalNodes.slice(0, halfCount);
			const bottomNodes = bidirectionalNodes.slice(halfCount);

			// Top nodes (90° to 135°)
			if (topNodes.length > 0) {
				void this.positionNodesInArc(topNodes, radius, 90, 45);
			}

			// Bottom nodes (225° to 270°)
			if (bottomNodes.length > 0) {
				void this.positionNodesInArc(bottomNodes, radius, 225, 45);
			}
		}
	}

	/**
	 * Position nodes evenly around the circle
	 */
	private positionNodesEvenly(nodes: LocalSoundscapeNode[], depth: number): void {
		const radius = depth * this.config.radiusPerDepth;
		void this.positionNodesInArc(nodes, radius, 0, 360);
	}

	/**
	 * Position nodes within a specific arc
	 */
	private positionNodesInArc(
		nodes: LocalSoundscapeNode[],
		radius: number,
		startAngleDeg: number,
		arcSpanDeg: number
	): void {
		if (nodes.length === 0) return;

		// Calculate angle step
		const angleStep = nodes.length > 1
			? arcSpanDeg / (nodes.length - 1)
			: 0;

		// Position each node
		nodes.forEach((node, index) => {
			const angleDeg = startAngleDeg + (index * angleStep);
			const angleRad = (angleDeg * Math.PI) / 180;

			node.x = this.config.centerX + radius * Math.cos(angleRad);
			node.y = this.config.centerY + radius * Math.sin(angleRad);

			logger.debug('node-positioned', `Positioned node: ${node.basename}`, {
				depth: node.depth,
				direction: node.direction,
				angle: angleDeg.toFixed(1),
				x: node.x?.toFixed(1),
				y: node.y?.toFixed(1)
			});
		});
	}

	/**
	 * Update layout configuration
	 */
	updateConfig(config: Partial<RadialLayoutConfig>): void {
		this.config = {
			...this.config,
			...config
		};

		void logger.debug('config-updated', 'Radial layout config updated', this.config);
	}

	/**
	 * Get current configuration
	 */
	getConfig(): RadialLayoutConfig {
		return { ...this.config };
	}

	/**
	 * Calculate optimal radius based on node count
	 */
	static calculateOptimalRadius(nodeCount: number, depth: number): number {
		// More nodes = larger radius to avoid overlap
		const baseRadius = 80;
		const increment = Math.max(20, nodeCount * 2);
		return baseRadius + (depth * increment);
	}

	/**
	 * Calculate bounds of the layout
	 */
	calculateBounds(data: LocalSoundscapeData): {
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
		width: number;
		height: number;
	} {
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		data.allNodes.forEach(node => {
			if (node.x !== undefined && node.y !== undefined) {
				minX = Math.min(minX, node.x);
				maxX = Math.max(maxX, node.x);
				minY = Math.min(minY, node.y);
				maxY = Math.max(maxY, node.y);
			}
		});

		// Add padding
		const padding = 50;
		minX -= padding;
		maxX += padding;
		minY -= padding;
		maxY += padding;

		return {
			minX,
			maxX,
			minY,
			maxY,
			width: maxX - minX,
			height: maxY - minY
		};
	}
}
