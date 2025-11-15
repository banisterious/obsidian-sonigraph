/**
 * LocalSoundscapeRenderer
 *
 * Renders Local Soundscape graph with radial layout using D3 + SVG.
 * Simpler than GraphRenderer - no force simulation, uses pre-computed radial positions.
 *
 * Phase 1: Basic SVG rendering with zoom/pan
 * Phase 2: Will integrate with audio system
 */

import * as d3 from 'd3';
import { LocalSoundscapeData, LocalSoundscapeNode, LocalSoundscapeLink, LocalSoundscapeCluster } from './LocalSoundscapeExtractor';
import { RadialLayoutAlgorithm, RadialLayoutConfig } from './RadialLayoutAlgorithm';
import { getLogger } from '../logging';

const logger = getLogger('LocalSoundscapeRenderer');

export interface RendererConfig {
	width: number;
	height: number;
	nodeRadius: number;
	showLabels: boolean;
	enableZoom: boolean;
	nodeSizeMode?: 'uniform' | 'link-count' | 'content-length';
}

export class LocalSoundscapeRenderer {
	private container: HTMLElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- D3.js Selection type has complex nested generics
	private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- D3.js Selection type has complex nested generics
	private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
	private config: RendererConfig;
	private layoutAlgorithm: RadialLayoutAlgorithm;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- D3.js Selection type has complex nested generics
	private clusterGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- D3.js Selection type has complex nested generics
	private linkGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- D3.js Selection type has complex nested generics
	private nodeGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- D3.js Selection type has complex nested generics
	private labelGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

	// Tooltip
	private tooltip: HTMLElement | null = null;

	// Context menu
	private contextMenu: HTMLElement | null = null;

	// Current data
	private data: LocalSoundscapeData | null = null;

	// Callbacks
	private onNodeOpen?: (node: LocalSoundscapeNode) => void;
	private onNodeRecenter?: (node: LocalSoundscapeNode) => void;

	constructor(container: HTMLElement, config: Partial<RendererConfig> = {}) {
		this.container = container;
		this.config = {
			width: 800,
			height: 600,
			nodeRadius: 8,
			showLabels: true,
			enableZoom: true,
			...config
		};

		// Initialize layout algorithm with config based on container size
		const layoutConfig: Partial<RadialLayoutConfig> = {
			centerX: this.config.width / 2,
			centerY: this.config.height / 2,
			radiusPerDepth: 100,
			nodeSpacing: 15,
			separateDirections: true
		};

		this.layoutAlgorithm = new RadialLayoutAlgorithm(layoutConfig);

		// Initialize SVG
		this.initializeSVG();

		// Create tooltip
		this.createTooltip();

		// Create context menu
		this.createContextMenu();

		logger.info('renderer-init', 'LocalSoundscapeRenderer initialized', this.config);
	}

	/**
	 * Initialize SVG container and groups
	 */
	private initializeSVG(): void {
		// Clear existing content
		d3.select(this.container).selectAll('*').remove();

		// Create SVG
		this.svg = d3.select(this.container)
			.append('svg')
			.attr('class', 'local-soundscape-svg')
			.attr('width', this.config.width)
			.attr('height', this.config.height)
			.style('background', 'var(--background-primary)');

		// Create main group for zoom/pan
		this.g = this.svg.append('g');

		// Create groups for rendering (order matters for z-index)
		this.clusterGroup = this.g.append('g').attr('class', 'clusters');
		this.linkGroup = this.g.append('g').attr('class', 'links');
		this.nodeGroup = this.g.append('g').attr('class', 'nodes');
		this.labelGroup = this.g.append('g').attr('class', 'labels');

		// Setup zoom if enabled
		if (this.config.enableZoom) {
			this.zoom = d3.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.1, 4])
				.on('zoom', (event) => {
					this.g.attr('transform', event.transform);
				});

			this.svg.call(this.zoom);

			// Set initial zoom to fit content
			this.resetZoom();
		}

		logger.debug('svg-initialized', 'SVG structure created');
	}

	/**
	 * Render graph data
	 */
	render(data: LocalSoundscapeData): void {
		const startTime = performance.now();

		logger.info('render-start', 'Rendering graph', {
			nodes: data.stats.totalNodes,
			links: data.stats.totalLinks
		});

		this.data = data;

		// Apply layout to position nodes (only if nodes don't already have positions)
		const needsLayout = data.allNodes.some(n => n.x === undefined || n.y === undefined);
		if (needsLayout) {
			this.layoutAlgorithm.applyLayout(data);
		} else {
			logger.debug('skip-layout', 'Nodes already have positions, skipping layout');
		}

		// Render clusters if available (before links and nodes for proper layering)
		if (data.clusters && data.clusters.length > 0) {
			this.renderClusters(data.clusters, data.allNodes);
		}

		// Render links
		this.renderLinks(data.links);

		// Render nodes
		this.renderNodes(data.allNodes);

		// Render labels if enabled
		if (this.config.showLabels) {
			this.renderLabels(data.allNodes);
		}

		// Fit to content
		if (this.config.enableZoom) {
			this.fitToContent();
		}

		const renderTime = performance.now() - startTime;

		logger.info('render-complete', 'Graph rendered', {
			renderTime: renderTime.toFixed(2) + 'ms'
		});
	}

	/**
	 * Render links
	 */
	private renderLinks(links: LocalSoundscapeLink[]): void {
		const linkSelection = this.linkGroup
			.selectAll<SVGLineElement, LocalSoundscapeLink>('line')
			.data(links, (d) => d.id);

		// Enter (new links)
		const linkEnter = linkSelection.enter()
			.append('line')
			.attr('class', (d) => `link link-${d.direction}`)
			.attr('stroke', (d) => this.getLinkColor(d.direction))
			.attr('stroke-width', 1.5)
			.attr('stroke-opacity', 0); // Start invisible

		// Update (enter + existing links)
		linkEnter.merge(linkSelection)
			.transition()
			.duration(500)
			.ease(d3.easeCubicInOut)
			.attr('x1', (d) => {
				const source = this.findNode(d.source);
				return source?.x || 0;
			})
			.attr('y1', (d) => {
				const source = this.findNode(d.source);
				return source?.y || 0;
			})
			.attr('x2', (d) => {
				const target = this.findNode(d.target);
				return target?.x || 0;
			})
			.attr('y2', (d) => {
				const target = this.findNode(d.target);
				return target?.y || 0;
			})
			.attr('stroke-opacity', 0.4);

		// Exit (removed links)
		linkSelection.exit()
			.transition()
			.duration(300)
			.attr('stroke-opacity', 0)
			.remove();

		logger.debug('links-rendered', `Rendered ${links.length} links`);
	}

	/**
	 * Render nodes
	 */
	private renderNodes(nodes: LocalSoundscapeNode[]): void {
		const nodeSelection = this.nodeGroup
			.selectAll<SVGCircleElement, LocalSoundscapeNode>('circle')
			.data(nodes, (d) => d.id);

		// Enter (new nodes)
		const nodeEnter = nodeSelection.enter()
			.append('circle')
			.attr('class', (d) => `node node-${d.direction} node-depth-${d.depth}`)
			.attr('cx', (d) => d.x || 0)
			.attr('cy', (d) => d.y || 0)
			.attr('r', 0) // Start at size 0
			.attr('fill', (d) => this.getNodeColor(d))
			.attr('stroke', (d) => this.getNodeStroke(d))
			.attr('stroke-width', (d) => d.depth === 0 ? 3 : 2)
			.style('cursor', 'pointer')
			.style('opacity', 0) // Start invisible
			.on('click', (event, d) => this.handleNodeClick(event, d))
			.on('contextmenu', (event, d) => this.handleNodeRightClick(event, d))
			.on('mouseover', (event, d) => this.handleNodeHover(event, d))
			.on('mouseout', (event, d) => this.handleNodeMouseOut(event, d));

		// Update (enter + existing nodes)
		nodeEnter.merge(nodeSelection)
			.transition()
			.duration(500)
			.ease(d3.easeCubicInOut)
			.attr('cx', (d) => d.x || 0)
			.attr('cy', (d) => d.y || 0)
			.attr('r', (d) => this.getNodeRadius(d))
			.attr('fill', (d) => this.getNodeColor(d))
			.attr('stroke', (d) => this.getNodeStroke(d))
			.style('opacity', 1);

		// Exit (removed nodes)
		nodeSelection.exit()
			.transition()
			.duration(300)
			.attr('r', 0)
			.style('opacity', 0)
			.remove();

		logger.debug('nodes-rendered', `Rendered ${nodes.length} nodes`);
	}

	/**
	 * Render labels
	 */
	private renderLabels(nodes: LocalSoundscapeNode[]): void {
		const labelSelection = this.labelGroup
			.selectAll<SVGTextElement, LocalSoundscapeNode>('text')
			.data(nodes, (d) => d.id);

		// Enter (new labels)
		const labelEnter = labelSelection.enter()
			.append('text')
			.attr('class', 'node-label')
			.attr('x', (d) => d.x || 0)
			.attr('y', (d) => (d.y || 0) + this.config.nodeRadius + 12)
			.attr('text-anchor', 'middle')
			.attr('font-size', '11px')
			.attr('fill', 'var(--text-muted)')
			.style('opacity', 0) // Start invisible
			.text((d) => d.basename);

		// Update (enter + existing labels)
		labelEnter.merge(labelSelection)
			.transition()
			.duration(500)
			.ease(d3.easeCubicInOut)
			.attr('x', (d) => d.x || 0)
			.attr('y', (d) => (d.y || 0) + this.config.nodeRadius + 12)
			.style('opacity', 1);

		// Exit (removed labels)
		labelSelection.exit()
			.transition()
			.duration(300)
			.style('opacity', 0)
			.remove();

		logger.debug('labels-rendered', `Rendered ${nodes.length} labels`);
	}

	/**
	 * Render clusters
	 */
	private renderClusters(clusters: LocalSoundscapeCluster[], nodes: LocalSoundscapeNode[]): void {
		// Calculate bounding boxes for each cluster
		interface ClusterBounds {
			cluster: LocalSoundscapeCluster;
			minX: number;
			minY: number;
			maxX: number;
			maxY: number;
			centerX: number;
			centerY: number;
		}

		const clusterBounds: ClusterBounds[] = clusters.map(cluster => {
			// Get all nodes in this cluster
			const clusterNodes = nodes.filter(n => cluster.nodes.includes(n.id));

			if (clusterNodes.length === 0) {
				return {
					cluster,
					minX: 0,
					minY: 0,
					maxX: 0,
					maxY: 0,
					centerX: 0,
					centerY: 0
				};
			}

			// Calculate bounds with padding
			const padding = 30;
			const minX = Math.min(...clusterNodes.map(n => (n.x || 0) - this.config.nodeRadius)) - padding;
			const minY = Math.min(...clusterNodes.map(n => (n.y || 0) - this.config.nodeRadius)) - padding;
			const maxX = Math.max(...clusterNodes.map(n => (n.x || 0) + this.config.nodeRadius)) + padding;
			const maxY = Math.max(...clusterNodes.map(n => (n.y || 0) + this.config.nodeRadius)) + padding;

			const centerX = (minX + maxX) / 2;
			const centerY = (minY + maxY) / 2;

			return {
				cluster,
				minX,
				minY,
				maxX,
				maxY,
				centerX,
				centerY
			};
		});

		// Render cluster backgrounds
		const clusterSelection = this.clusterGroup
			.selectAll<SVGGElement, ClusterBounds>('g.cluster')
			.data(clusterBounds, (d) => d.cluster.id);

		// Enter (new clusters)
		const clusterEnter = clusterSelection.enter()
			.append('g')
			.attr('class', 'cluster');

		// Add background rectangle with initial state
		clusterEnter.append('rect')
			.attr('class', 'cluster-background')
			.attr('x', (d) => d.centerX)
			.attr('y', (d) => d.centerY)
			.attr('width', 0)
			.attr('height', 0)
			.attr('rx', 12)
			.attr('ry', 12)
			.attr('fill-opacity', 0)
			.attr('stroke-opacity', 0);

		// Add label with initial state
		clusterEnter.append('text')
			.attr('class', 'cluster-label')
			.style('opacity', 0);

		// Update (both enter and existing)
		const clusterUpdate = clusterEnter.merge(clusterSelection);

		// Update background with transition
		clusterUpdate.select<SVGRectElement>('rect.cluster-background')
			.transition()
			.duration(500)
			.ease(d3.easeCubicInOut)
			.attr('x', (d) => d.minX)
			.attr('y', (d) => d.minY)
			.attr('width', (d) => d.maxX - d.minX)
			.attr('height', (d) => d.maxY - d.minY)
			.attr('fill', (d) => d.cluster.color)
			.attr('fill-opacity', 0.15)
			.attr('stroke', (d) => d.cluster.color)
			.attr('stroke-width', 2)
			.attr('stroke-opacity', 0.4);

		// Update label with transition
		clusterUpdate.select<SVGTextElement>('text.cluster-label')
			.transition()
			.duration(500)
			.ease(d3.easeCubicInOut)
			.attr('x', (d) => d.centerX)
			.attr('y', (d) => d.minY - 8)
			.attr('text-anchor', 'middle')
			.attr('font-size', '13px')
			.attr('font-weight', 'bold')
			.attr('fill', (d) => d.cluster.color)
			.attr('fill-opacity', 0.8)
			.style('opacity', 1)
			.text((d) => d.cluster.label);

		// Exit (removed clusters) with fade out
		clusterSelection.exit()
			.transition()
			.duration(300)
			.style('opacity', 0)
			.remove();

		logger.debug('clusters-rendered', `Rendered ${clusters.length} clusters`);
	}

	/**
	 * Calculate node radius based on size mode
	 */
	private getNodeRadius(node: LocalSoundscapeNode): number {
		const baseRadius = this.config.nodeRadius;
		const mode = this.config.nodeSizeMode || 'uniform';

		// Center node is always larger
		if (node.depth === 0) {
			return baseRadius * 1.5;
		}

		switch (mode) {
			case 'uniform':
				return baseRadius;

			case 'link-count': {
				// Scale based on link count (1-3x base radius)
				const linkCount = node.linkCount || 1;
				const maxLinks = 20; // Reasonable maximum for scaling
				const scale = 1 + Math.min(linkCount / maxLinks, 1) * 2; // 1x to 3x
				return baseRadius * scale;
			}

			case 'content-length': {
				// Scale based on word count (1-2.5x base radius)
				const wordCount = node.wordCount || 100;
				const maxWords = 2000; // Reasonable maximum for scaling
				const scale = 1 + Math.min(wordCount / maxWords, 1) * 1.5; // 1x to 2.5x
				return baseRadius * scale;
			}

			default:
				return baseRadius;
		}
	}

	/**
	 * Get node color based on direction
	 */
	private getNodeColor(node: LocalSoundscapeNode): string {
		if (node.depth === 0) {
			return 'var(--interactive-accent)';
		}

		switch (node.direction) {
			case 'incoming':
				return 'var(--color-pink)';
			case 'outgoing':
				return 'var(--color-cyan)';
			case 'bidirectional':
				return 'var(--color-purple)';
			default:
				return 'var(--text-muted)';
		}
	}

	/**
	 * Get node stroke color
	 */
	private getNodeStroke(node: LocalSoundscapeNode): string {
		if (node.depth === 0) {
			return 'var(--interactive-accent-hover)';
		}
		return this.getNodeColor(node);
	}

	/**
	 * Get link color based on direction
	 */
	private getLinkColor(direction: string): string {
		switch (direction) {
			case 'incoming':
				return 'var(--color-pink)';
			case 'outgoing':
				return 'var(--color-cyan)';
			case 'bidirectional':
				return 'var(--color-purple)';
			default:
				return 'var(--text-faint)';
		}
	}

	/**
	 * Find node by ID
	 */
	private findNode(nodeId: string): LocalSoundscapeNode | undefined {
		return this.data?.allNodes.find(n => n.id === nodeId);
	}

	/**
	 * Handle node click (left-click)
	 */
	private handleNodeClick(event: MouseEvent, node: LocalSoundscapeNode): void {
		event.stopPropagation();
		logger.info('node-clicked', 'Node clicked', { node: node.basename });

		// Left-click opens the note
		if (this.onNodeOpen) {
			this.onNodeOpen(node);
		}
	}

	/**
	 * Handle node right-click
	 */
	private handleNodeRightClick(event: MouseEvent, node: LocalSoundscapeNode): void {
		event.preventDefault();
		event.stopPropagation();
		logger.info('node-right-clicked', 'Node right-clicked', { node: node.basename });

		// Show context menu
		this.showContextMenu(event, node);
	}

	/**
	 * Handle node hover
	 */
	private handleNodeHover(event: MouseEvent, node: LocalSoundscapeNode): void {
		// Highlight node with smooth transition (increase size by 30%)
		d3.select<SVGCircleElement, LocalSoundscapeNode>(event.target as SVGCircleElement)
			.transition()
			.duration(200)
			.ease(d3.easeBackOut.overshoot(1.5))
			.attr('r', (d) => this.getNodeRadius(d) * 1.3)
			.attr('stroke-width', 4);

		// Show tooltip
		this.showTooltip(event, node);

		logger.debug('node-hover', 'Node hovered', { node: node.basename });
	}

	/**
	 * Handle node mouse out
	 */
	private handleNodeMouseOut(event: MouseEvent, node: LocalSoundscapeNode): void {
		// Reset node appearance with smooth transition
		d3.select<SVGCircleElement, LocalSoundscapeNode>(event.target as SVGCircleElement)
			.transition()
			.duration(200)
			.ease(d3.easeCubicOut)
			.attr('r', (d) => this.getNodeRadius(d))
			.attr('stroke-width', (d) => (d.depth === 0 ? 3 : 2));

		// Hide tooltip
		this.hideTooltip();
	}

	/**
	 * Fit graph to content
	 */
	private fitToContent(): void {
		if (!this.data) return;

		const bounds = this.layoutAlgorithm.calculateBounds(this.data);

		// Calculate scale to fit
		const scaleX = this.config.width / bounds.width;
		const scaleY = this.config.height / bounds.height;
		const scale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% to add padding

		// Calculate translation to center
		const translateX = (this.config.width - bounds.width * scale) / 2 - bounds.minX * scale;
		const translateY = (this.config.height - bounds.height * scale) / 2 - bounds.minY * scale;

		// Apply transform with smooth transition
		const transform = d3.zoomIdentity
			.translate(translateX, translateY)
			.scale(scale);

		this.svg
			.transition()
			.duration(750)
			.ease(d3.easeCubicInOut)
			.call(this.zoom.transform, transform);

		logger.debug('fit-to-content', 'Graph fitted to content', { scale, translateX, translateY });
	}

	/**
	 * Reset zoom to default
	 */
	private resetZoom(): void {
		const transform = d3.zoomIdentity.translate(0, 0).scale(1);
		this.svg.call(this.zoom.transform, transform);
	}

	/**
	 * Create tooltip element
	 */
	private createTooltip(): void {
		// Create tooltip at body level to avoid container overflow issues
		this.tooltip = document.body.createDiv({ cls: 'local-soundscape-tooltip' });
		this.tooltip.setCssProps({
			position: 'fixed',
			display: 'none',
			pointerEvents: 'none',
			zIndex: '10000'
		});
	}

	/**
	 * Show tooltip with node info
	 */
	private showTooltip(event: MouseEvent, node: LocalSoundscapeNode): void {
		if (!this.tooltip) return;

		// Build tooltip content
		const directionLabel = node.direction === 'incoming' ? 'Incoming' :
		                       node.direction === 'outgoing' ? 'Outgoing' :
		                       node.direction === 'bidirectional' ? 'Bidirectional' : 'Center';

		this.tooltip.empty();
		this.tooltip.createDiv({ cls: 'tooltip-title', text: node.basename });
		const tooltipInfo = this.tooltip.createDiv({ cls: 'tooltip-info' });
		tooltipInfo.createDiv({ text: `Depth: ${node.depth}` });
		tooltipInfo.createDiv({ text: `Direction: ${directionLabel}` });
		tooltipInfo.createDiv({ text: `Links: ${node.linkCount}` });
		tooltipInfo.createDiv({ text: `Words: ${node.wordCount}` });

		// Position tooltip near cursor
		this.tooltip.style.left = `${event.clientX + 10}px`;
		this.tooltip.style.top = `${event.clientY + 10}px`;
		this.tooltip.style.display = 'block';
	}

	/**
	 * Hide tooltip
	 */
	private hideTooltip(): void {
		if (this.tooltip) {
			this.tooltip.style.display = 'none';
		}
	}

	/**
	 * Create context menu element
	 */
	private createContextMenu(): void {
		// Create context menu at body level to avoid container overflow issues
		this.contextMenu = document.body.createDiv({ cls: 'local-soundscape-context-menu' });
		this.contextMenu.style.position = 'fixed';
		this.contextMenu.style.display = 'none';
		this.contextMenu.style.zIndex = '10000';

		// Close context menu when clicking elsewhere
		document.addEventListener('click', () => {
			this.hideContextMenu();
		});
	}

	/**
	 * Show context menu for node
	 */
	private showContextMenu(event: MouseEvent, node: LocalSoundscapeNode): void {
		if (!this.contextMenu) return;

		// Build context menu
		this.contextMenu.empty();

		const menu = this.contextMenu.createDiv({ cls: 'context-menu-items' });

		// Open note option
		const openItem = menu.createDiv({ cls: 'context-menu-item' });
		openItem.textContent = 'Open note';
		openItem.addEventListener('click', (e) => {
			e.stopPropagation();
			if (this.onNodeOpen) {
				this.onNodeOpen(node);
			}
			this.hideContextMenu();
		});

		// Re-center soundscape option (only if not already center)
		if (node.depth !== 0) {
			const recenterItem = menu.createDiv({ cls: 'context-menu-item' });
			recenterItem.textContent = 'Re-center soundscape here';
			recenterItem.addEventListener('click', (e) => {
				e.stopPropagation();
				if (this.onNodeRecenter) {
					this.onNodeRecenter(node);
				}
				this.hideContextMenu();
			});
		}

		// Position context menu
		this.contextMenu.style.left = `${event.clientX}px`;
		this.contextMenu.style.top = `${event.clientY}px`;
		this.contextMenu.style.display = 'block';
	}

	/**
	 * Hide context menu
	 */
	private hideContextMenu(): void {
		if (this.contextMenu) {
			this.contextMenu.style.display = 'none';
		}
	}

	/**
	 * Highlight a node as currently playing
	 */
	highlightPlayingNode(nodeId: string): void {
		// Find the node element and add playing class with smooth transition (increase size by 50%)
		this.nodeGroup
			.selectAll<SVGCircleElement, LocalSoundscapeNode>('circle')
			.filter((d) => d.id === nodeId)
			.classed('playing', true)
			.transition()
			.duration(150)
			.ease(d3.easeBackOut)
			.attr('r', (d) => this.getNodeRadius(d) * 1.5);

		logger.debug('node-highlight', 'Node highlighted as playing', { nodeId });
	}

	/**
	 * Remove highlight from a playing node
	 */
	unhighlightPlayingNode(nodeId: string): void {
		// Find the node element and remove playing class with smooth transition
		this.nodeGroup
			.selectAll<SVGCircleElement, LocalSoundscapeNode>('circle')
			.filter((d) => d.id === nodeId)
			.classed('playing', false)
			.transition()
			.duration(200)
			.ease(d3.easeCubicOut)
			.attr('r', (d) => this.getNodeRadius(d));

		logger.debug('node-unhighlight', 'Node unhighlighted', { nodeId });
	}

	/**
	 * Clear all playing node highlights
	 */
	clearAllPlayingHighlights(): void {
		this.nodeGroup
			.selectAll<SVGCircleElement, LocalSoundscapeNode>('circle.playing')
			.classed('playing', false)
			.transition()
			.duration(200)
			.ease(d3.easeCubicOut)
			.attr('r', (d) => this.getNodeRadius(d));

		logger.debug('clear-highlights', 'Cleared all playing node highlights');
	}

	/**
	 * Set callbacks for node interactions
	 */
	setCallbacks(onNodeOpen?: (node: LocalSoundscapeNode) => void, onNodeRecenter?: (node: LocalSoundscapeNode) => void): void {
		this.onNodeOpen = onNodeOpen;
		this.onNodeRecenter = onNodeRecenter;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<RendererConfig>): void {
		this.config = {
			...this.config,
			...config
		};

		logger.debug('config-updated', 'Renderer config updated', this.config);

		// Re-render if we have data
		if (this.data) {
			this.render(this.data);
		}
	}

	/**
	 * Clean up renderer
	 */
	dispose(): void {
		d3.select(this.container).selectAll('*').remove();
		this.data = null;
		logger.debug('renderer-disposed', 'Renderer disposed');
	}
}
