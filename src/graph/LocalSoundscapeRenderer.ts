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
import { LocalSoundscapeData, LocalSoundscapeNode, LocalSoundscapeLink } from './LocalSoundscapeExtractor';
import { RadialLayoutAlgorithm, RadialLayoutConfig } from './RadialLayoutAlgorithm';
import { getLogger } from '../logging';

const logger = getLogger('LocalSoundscapeRenderer');

export interface RendererConfig {
	width: number;
	height: number;
	nodeRadius: number;
	showLabels: boolean;
	enableZoom: boolean;
}

export class LocalSoundscapeRenderer {
	private container: HTMLElement;
	private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
	private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
	private config: RendererConfig;
	private layoutAlgorithm: RadialLayoutAlgorithm;

	private linkGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
	private nodeGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
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

		// Apply layout to position nodes
		this.layoutAlgorithm.applyLayout(data);

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
			.selectAll('line')
			.data(links, (d: any) => d.id);

		// Enter + Update
		linkSelection.enter()
			.append('line')
			.merge(linkSelection as any)
			.attr('class', (d) => `link link-${d.direction}`)
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
			.attr('stroke', (d) => this.getLinkColor(d.direction))
			.attr('stroke-width', 1.5)
			.attr('stroke-opacity', 0.4);

		// Exit
		linkSelection.exit().remove();

		logger.debug('links-rendered', `Rendered ${links.length} links`);
	}

	/**
	 * Render nodes
	 */
	private renderNodes(nodes: LocalSoundscapeNode[]): void {
		const nodeSelection = this.nodeGroup
			.selectAll('circle')
			.data(nodes, (d: any) => d.id);

		// Enter + Update
		nodeSelection.enter()
			.append('circle')
			.merge(nodeSelection as any)
			.attr('class', (d) => `node node-${d.direction} node-depth-${d.depth}`)
			.attr('cx', (d) => d.x || 0)
			.attr('cy', (d) => d.y || 0)
			.attr('r', (d) => d.depth === 0 ? this.config.nodeRadius * 1.5 : this.config.nodeRadius)
			.attr('fill', (d) => this.getNodeColor(d))
			.attr('stroke', (d) => this.getNodeStroke(d))
			.attr('stroke-width', (d) => d.depth === 0 ? 3 : 2)
			.style('cursor', 'pointer')
			.on('click', (event, d) => this.handleNodeClick(event, d))
			.on('contextmenu', (event, d) => this.handleNodeRightClick(event, d))
			.on('mouseover', (event, d) => this.handleNodeHover(event, d))
			.on('mouseout', (event, d) => this.handleNodeMouseOut(event, d));

		// Exit
		nodeSelection.exit().remove();

		logger.debug('nodes-rendered', `Rendered ${nodes.length} nodes`);
	}

	/**
	 * Render labels
	 */
	private renderLabels(nodes: LocalSoundscapeNode[]): void {
		const labelSelection = this.labelGroup
			.selectAll('text')
			.data(nodes, (d: any) => d.id);

		// Enter + Update
		labelSelection.enter()
			.append('text')
			.merge(labelSelection as any)
			.attr('class', 'node-label')
			.attr('x', (d) => d.x || 0)
			.attr('y', (d) => (d.y || 0) + this.config.nodeRadius + 12)
			.attr('text-anchor', 'middle')
			.attr('font-size', '11px')
			.attr('fill', 'var(--text-muted)')
			.text((d) => d.basename);

		// Exit
		labelSelection.exit().remove();

		logger.debug('labels-rendered', `Rendered ${nodes.length} labels`);
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
		// Highlight node
		d3.select(event.target as any)
			.attr('r', (d: any) => (d.depth === 0 ? this.config.nodeRadius * 2 : this.config.nodeRadius * 1.3))
			.attr('stroke-width', 4);

		// Show tooltip
		this.showTooltip(event, node);

		logger.debug('node-hover', 'Node hovered', { node: node.basename });
	}

	/**
	 * Handle node mouse out
	 */
	private handleNodeMouseOut(event: MouseEvent, node: LocalSoundscapeNode): void {
		// Reset node appearance
		d3.select(event.target as any)
			.attr('r', (d: any) => (d.depth === 0 ? this.config.nodeRadius * 1.5 : this.config.nodeRadius))
			.attr('stroke-width', (d: any) => (d.depth === 0 ? 3 : 2));

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

		// Apply transform
		const transform = d3.zoomIdentity
			.translate(translateX, translateY)
			.scale(scale);

		this.svg.call(this.zoom.transform, transform);

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
		this.tooltip = this.container.createDiv({ cls: 'local-soundscape-tooltip' });
		this.tooltip.style.position = 'fixed';
		this.tooltip.style.display = 'none';
		this.tooltip.style.pointerEvents = 'none';
		this.tooltip.style.zIndex = '1000';
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

		this.tooltip.innerHTML = `
			<div class="tooltip-title">${node.basename}</div>
			<div class="tooltip-info">
				<div>Depth: ${node.depth}</div>
				<div>Direction: ${directionLabel}</div>
				<div>Links: ${node.linkCount}</div>
				<div>Words: ${node.wordCount}</div>
			</div>
		`;

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
		this.contextMenu = this.container.createDiv({ cls: 'local-soundscape-context-menu' });
		this.contextMenu.style.position = 'fixed';
		this.contextMenu.style.display = 'none';
		this.contextMenu.style.zIndex = '1000';

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
