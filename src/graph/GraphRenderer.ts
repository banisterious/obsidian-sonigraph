import * as d3 from 'd3';
import { GraphNode, GraphLink } from './GraphDataExtractor';
import { getLogger } from '../logging';

const logger = getLogger('GraphRenderer');

export interface RenderConfig {
  width: number;
  height: number;
  nodeRadius: number;
  linkDistance: number;
  showLabels: boolean;
  enableZoom: boolean;
}

export interface ForceConfig {
  centerStrength: number;
  linkStrength: number;
  chargeStrength: number;
  collisionRadius: number;
}

export class GraphRenderer {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private linkGroup: any;
  private nodeGroup: any;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  
  private simulation: d3.Simulation<GraphNode, GraphLink>;
  private config: RenderConfig;
  private forceConfig: ForceConfig;
  
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private visibleNodes: Set<string> = new Set();
  private visibleLinks: Set<string> = new Set();
  private animationStyle: 'fade' | 'scale' | 'slide' | 'pop' = 'fade';
  
  // Performance optimization for mouseover events
  private lastTooltipUpdate: number = 0;
  private tooltipThrottleMs: number = 16; // ~60fps
  private isTooltipVisible: boolean = false;
  
  // Performance optimization for force simulation
  private lastPositionUpdate: number = 0;
  private positionUpdateThrottleMs: number = 16; // ~60fps
  private pendingPositionUpdate: boolean = false;

  constructor(container: HTMLElement, config: Partial<RenderConfig> = {}) {
    this.container = container;
    this.config = {
      width: 800,
      height: 600,
      nodeRadius: 8,
      linkDistance: 25, // Much smaller for tighter clustering
      showLabels: false,
      enableZoom: true,
      ...config
    };
    
    this.forceConfig = {
      centerStrength: 0.2, // Slightly stronger to pull nodes together
      linkStrength: 0.4,   // Stronger links to keep connected nodes close
      chargeStrength: -60, // Reduced repulsion to allow closer packing
      collisionRadius: 12   // Smaller collision radius for tighter packing
    };

    this.initializeSVG();
    this.initializeSimulation();
    this.initializeTooltip();
    
    logger.debug('renderer', 'GraphRenderer initialized', { config: this.config });
  }

  /**
   * Initialize the SVG container and groups
   */
  private initializeSVG(): void {
    // Clear existing content
    d3.select(this.container).selectAll('*').remove();

    // Create SVG element
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('class', 'sonigraph-temporal-svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height);

    // Create main group for zoom/pan
    this.g = this.svg.append('g');

    // Create groups for links and nodes (order matters for z-index)
    this.g.append('g').attr('class', 'sonigraph-temporal-links');
    this.g.append('g').attr('class', 'sonigraph-temporal-nodes');

    // Setup zoom behavior
    if (this.config.enableZoom) {
      this.zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          this.g.attr('transform', event.transform);
        });

      this.svg.call(this.zoom);
      
      // Fix touch event warnings by properly configuring passive listeners
      const svgNode = this.svg.node() as SVGSVGElement;
      if (svgNode) {
        // Remove default D3 touch handlers and add passive ones
        svgNode.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        svgNode.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        svgNode.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
      }
    }
  }

  /**
   * Initialize the D3 force simulation
   */
  private initializeSimulation(): void {
    this.simulation = d3.forceSimulation<GraphNode>()
      .force('link', d3.forceLink<GraphNode, GraphLink>()
        .id(d => d.id)
        .distance(this.config.linkDistance)
        .strength(this.forceConfig.linkStrength)
      )
      .force('charge', d3.forceManyBody<GraphNode>()
        .strength(this.forceConfig.chargeStrength)
      )
      .force('center', d3.forceCenter<GraphNode>(
        this.config.width / 2, 
        this.config.height / 2
      ).strength(this.forceConfig.centerStrength))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius(this.forceConfig.collisionRadius)
      )
      // Add organic clustering based on file type
      .force('cluster', (alpha) => {
        const strength = 0.1 * alpha;
        this.nodes.forEach(node => {
          if (node.x !== undefined && node.y !== undefined) {
            // Create loose clusters by file type
            const typeOffset = this.getTypeOffset(node.type);
            const targetX = this.config.width / 2 + typeOffset.x;
            const targetY = this.config.height / 2 + typeOffset.y;
            
            node.vx = (node.vx || 0) + (targetX - node.x) * strength;
            node.vy = (node.vy || 0) + (targetY - node.y) * strength;
          }
        });
      })
      // Add random jitter to break symmetry
      .force('jitter', (alpha) => {
        const strength = 0.02 * alpha;
        this.nodes.forEach(node => {
          if (node.vx !== undefined && node.vy !== undefined) {
            node.vx += (Math.random() - 0.5) * strength;
            node.vy += (Math.random() - 0.5) * strength;
          }
        });
      })
      .on('tick', () => {
        // Throttle position updates to reduce animation frame load
        const now = performance.now();
        if (now - this.lastPositionUpdate >= this.positionUpdateThrottleMs && !this.pendingPositionUpdate) {
          this.pendingPositionUpdate = true;
          requestAnimationFrame(() => {
            this.updatePositions();
            this.lastPositionUpdate = performance.now();
            this.pendingPositionUpdate = false;
          });
        }
      })
      .on('end', () => this.onSimulationEnd());
  }

  /**
   * Initialize tooltip for node information
   */
  private initializeTooltip(): void {
    // Create tooltip div - all styles now in CSS
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'sonic-graph-tooltip');
  }

  /**
   * Render the graph with given nodes and links
   */
  render(nodes: GraphNode[], links: GraphLink[]): void {
    logger.debug('renderer', `Rendering graph: ${nodes.length} nodes, ${links.length} links`);
    
    this.nodes = nodes;
    this.links = links;
    
    // Initialize all nodes as visible for static rendering
    this.visibleNodes = new Set(nodes.map(n => n.id));
    this.visibleLinks = new Set(links.map((l, i) => this.getLinkId(l, i)));
    
    this.updateSimulation();
    this.renderLinks();
    this.renderNodes();
    
    // For static preview, set initial zoom to show full graph
    this.setInitialView();
  }

  /**
   * Update which nodes are visible (for temporal animation)
   */
  updateVisibleNodes(visibleNodeIds: Set<string>): void {
    this.visibleNodes = visibleNodeIds;
    
    // Update visible links based on visible nodes
    this.visibleLinks.clear();
    this.links.forEach((link, i) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (this.visibleNodes.has(sourceId) && this.visibleNodes.has(targetId)) {
        this.visibleLinks.add(`${sourceId}-${targetId}-${i}`);
      }
    });
    
    this.updateNodeVisibility();
    this.updateLinkVisibility();
  }

  /**
   * Update the simulation with current data
   */
  private updateSimulation(): void {
    const visibleNodes = this.nodes.filter(n => this.visibleNodes.has(n.id));
    const visibleLinks = this.links.filter((l, i) => 
      this.visibleLinks.has(`${typeof l.source === 'string' ? l.source : l.source.id}-${typeof l.target === 'string' ? l.target : l.target.id}-${i}`)
    );

    this.simulation
      .nodes(visibleNodes);
    
    (this.simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)
      .links(visibleLinks);

    this.simulation.alpha(1).restart();
  }

  /**
   * Render links
   */
  private renderLinks(): void {
    const linkSelection = this.g.select('.sonigraph-temporal-links')
      .selectAll('line')
      .data(this.links, (d: any, i) => this.getLinkId(d, i));

    // Enter new links
    linkSelection.enter()
      .append('line')
      .attr('class', 'appearing')
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', function() {
        d3.select(this).classed('appearing', false);
      });

    // Remove old links
    linkSelection.exit()
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();

    this.linkGroup = this.g.select('.sonigraph-temporal-links').selectAll('line');
  }

  /**
   * Render nodes
   */
  private renderNodes(): void {
    const nodeSelection = this.g.select('.sonigraph-temporal-nodes')
      .selectAll('.sonigraph-temporal-node')
      .data(this.nodes, (d: any) => d.id);

    // Enter new nodes
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'sonigraph-temporal-node appearing')
      .style('opacity', 0)
      .call(this.setupNodeInteractions.bind(this));

    // Add circles to new nodes
    nodeEnter.append('circle')
      .attr('r', this.config.nodeRadius)
      .attr('class', d => `${d.type}-node`);

    // Add labels to new nodes
    nodeEnter.append('text')
      .attr('dy', this.config.nodeRadius + 15)
      .attr('class', this.config.showLabels ? 'labels-visible' : 'labels-hidden')
      .text(d => d.title);
    
    logger.debug('renderer', `Node labels created with showLabels: ${this.config.showLabels}`);

    // Animate new nodes
    nodeEnter.transition()
      .duration(500)
      .style('opacity', 1)
      .on('end', function() {
        d3.select(this).classed('appearing', false);
      });

    // Remove old nodes
    nodeSelection.exit()
      .transition()
      .duration(300)
      .style('opacity', 0)
      .attr('transform', 'scale(0.1)')
      .remove();

    this.nodeGroup = this.g.select('.sonigraph-temporal-nodes').selectAll('.sonigraph-temporal-node');
  }

  /**
   * Setup node interactions (hover, click, tooltips)
   */
  private setupNodeInteractions(selection: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>): void {
    selection
      .on('mouseover', (event, d) => {
        // Throttle mouseover events for performance
        const now = performance.now();
        if (now - this.lastTooltipUpdate < this.tooltipThrottleMs) {
          return;
        }
        this.lastTooltipUpdate = now;
        
        // Use requestAnimationFrame to avoid forced reflows
        requestAnimationFrame(() => {
          // Highlight connected links
          this.highlightConnectedLinks(d.id, true);
          
          // Show tooltip
          this.showTooltip(event, d);
          this.isTooltipVisible = true;
        });
      })
      .on('mousemove', (event, d) => {
        // Throttle mousemove events more aggressively
        const now = performance.now();
        if (now - this.lastTooltipUpdate < this.tooltipThrottleMs || !this.isTooltipVisible) {
          return;
        }
        this.lastTooltipUpdate = now;
        
        // Use requestAnimationFrame for smooth tooltip positioning
        requestAnimationFrame(() => {
          this.updateTooltipPosition(event);
        });
      })
      .on('mouseout', (event, d) => {
        // Use requestAnimationFrame to batch DOM updates
        requestAnimationFrame(() => {
          // Remove highlight from connected links
          this.highlightConnectedLinks(d.id, false);
          
          // Hide tooltip
          this.hideTooltip();
          this.isTooltipVisible = false;
        });
      })
      .on('click', (event, d) => {
        // Could emit event to open file in Obsidian
        logger.debug('renderer', `Node clicked: ${d.title}`, { node: d });
      });
  }

  /**
   * Highlight links connected to a node
   */
  private highlightConnectedLinks(nodeId: string, highlight: boolean): void {
    this.linkGroup
      .classed('highlighted', function(d: any) {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        
        if (sourceId === nodeId || targetId === nodeId) {
          return highlight;
        }
        return d3.select(this).classed('highlighted') && !highlight ? false : d3.select(this).classed('highlighted');
      });
  }

  /**
   * Update node visibility based on current visible set
   */
  private updateNodeVisibility(): void {
    this.nodeGroup
      .style('display', (d: GraphNode) => this.visibleNodes.has(d.id) ? 'block' : 'none');
  }

  /**
   * Update link visibility based on current visible set
   */
  private updateLinkVisibility(): void {
    this.linkGroup
      .style('display', (d: any, i: number) => {
        const linkId = this.getLinkId(d, i);
        return this.visibleLinks.has(linkId) ? 'block' : 'none';
      });
  }

  /**
   * Update positions during simulation tick
   */
  private updatePositions(): void {
    this.linkGroup
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    this.nodeGroup
      .attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update labels visibility
    if (newConfig.showLabels !== undefined) {
      logger.debug('renderer', `Updating showLabels to: ${this.config.showLabels}`);
      // Update existing nodes if they exist
      const nodeSelection = this.g.select('.sonigraph-temporal-nodes').selectAll('.sonigraph-temporal-node');
      logger.debug('renderer', `Found ${nodeSelection.size()} nodes to update`);
      if (!nodeSelection.empty()) {
        const textSelection = nodeSelection.selectAll('text');
        logger.debug('renderer', `Found ${textSelection.size()} text elements to update`);
        
        // Use CSS classes for visibility control
        if (this.config.showLabels) {
          textSelection
            .classed('labels-visible', true)
            .classed('labels-hidden', false);
        } else {
          textSelection
            .classed('labels-visible', false)
            .classed('labels-hidden', true);
        }
        
        // Log the state for debugging
        logger.debug('renderer', `Labels ${this.config.showLabels ? 'shown' : 'hidden'} via CSS classes`);
      }
    }
    
    // Update node radius
    if (newConfig.nodeRadius !== undefined) {
      const nodeSelection = this.g.select('.sonigraph-temporal-nodes').selectAll('.sonigraph-temporal-node');
      if (!nodeSelection.empty()) {
        nodeSelection.selectAll('circle')
          .attr('r', this.config.nodeRadius);
      }
    }
    
    logger.debug('renderer', 'Configuration updated', { config: this.config });
  }

  /**
   * Update force configuration
   */
  updateForces(newForceConfig: Partial<ForceConfig>): void {
    this.forceConfig = { ...this.forceConfig, ...newForceConfig };
    
    // Update simulation forces
    this.simulation
      .force('charge', d3.forceManyBody<GraphNode>().strength(this.forceConfig.chargeStrength))
      .force('collision', d3.forceCollide<GraphNode>().radius(this.forceConfig.collisionRadius))
      .force('center', d3.forceCenter<GraphNode>(this.config.width / 2, this.config.height / 2)
        .strength(this.forceConfig.centerStrength));
    
    if (this.simulation.force('link')) {
      (this.simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)
        .strength(this.forceConfig.linkStrength);
    }
    
    this.simulation.alpha(0.3).restart();
    
    logger.debug('renderer', 'Force configuration updated', { forceConfig: this.forceConfig });
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    this.svg
      .attr('width', width)
      .attr('height', height);
    
    this.simulation
      .force('center', d3.forceCenter<GraphNode>(width / 2, height / 2)
        .strength(this.forceConfig.centerStrength));
    
    logger.debug('renderer', `Renderer resized to ${width}x${height}`);
  }

  /**
   * Get current zoom transform
   */
  getZoomTransform(): d3.ZoomTransform {
    return d3.zoomTransform(this.svg.node()!);
  }

  /**
   * Set zoom transform
   */
  setZoomTransform(transform: d3.ZoomTransform): void {
    this.svg.call(this.zoom.transform, transform);
  }

  /**
   * Set initial view for static preview
   */
  private setInitialView(): void {
    // Set a comfortable zoom level immediately
    const initialScale = 0.6;
    const initialTransform = d3.zoomIdentity
      .translate(this.config.width * 0.2, this.config.height * 0.2)
      .scale(initialScale);
    
    if (this.config.enableZoom && this.zoom) {
      this.svg.call(this.zoom.transform, initialTransform);
    }
    
    // Stop simulation after a short time for static preview
    setTimeout(() => {
      this.simulation.stop();
      logger.debug('renderer', 'Simulation stopped for static preview');
    }, 1500); // Let simulation run for 1.5 seconds to settle
    
    logger.debug('renderer', 'Initial view set for static preview');
  }

  /**
   * Show tooltip with node information
   */
  private showTooltip(event: MouseEvent, node: GraphNode): void {
    const tooltipContent = this.createTooltipContent(node);
    
    this.tooltip
      .html(tooltipContent)
      .classed('tooltip-visible', true)
      .classed('tooltip-hidden', false);
    
    this.updateTooltipPosition(event);
  }

  /**
   * Update tooltip position based on mouse event
   */
  private updateTooltipPosition(event: MouseEvent): void {
    // Cache container rect to avoid repeated DOM queries
    const containerRect = this.container.getBoundingClientRect();
    const x = event.clientX - containerRect.left + 10;
    const y = event.clientY - containerRect.top - 10;
    
    // Batch style updates to avoid layout thrashing
    const tooltipNode = this.tooltip.node() as HTMLElement;
    if (tooltipNode) {
      tooltipNode.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.tooltip
      .classed('tooltip-visible', false)
      .classed('tooltip-hidden', true);
  }

  /**
   * Create tooltip content for a node
   */
  private createTooltipContent(node: GraphNode): string {
    const creationDate = node.creationDate.toLocaleDateString();
    const modificationDate = node.modificationDate.toLocaleDateString();
    const fileSize = this.formatFileSize(node.fileSize);
    const connectionCount = node.connections.length;
    
    // Extract just the filename from the full path
    const fileName = node.title.split('/').pop() || node.title;
    
    return `
      <div class="sonic-graph-tooltip-title">${fileName}</div>
      <div class="sonic-graph-tooltip-path">${node.path}</div>
      <div class="sonic-graph-tooltip-meta">
        <div>Type: ${node.type}</div>
        <div>Size: ${fileSize}</div>
        <div>Created: ${creationDate}</div>
        <div>Modified: ${modificationDate}</div>
        <div>Connections: ${connectionCount}</div>
      </div>
    `;
  }

  /**
   * Generate consistent link ID for D3.js data binding
   */
  private getLinkId(link: any, index: number): string {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return `${sourceId}-${targetId}-${index}`;
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Handle simulation end
   */
  private onSimulationEnd(): void {
    logger.debug('renderer', 'Force simulation ended');
  }

  /**
   * Get offset position for file type clustering
   */
  private getTypeOffset(type: string): { x: number; y: number } {
    const radius = 80; // Distance from center for type clusters
    const typeAngles: Record<string, number> = {
      'note': 0,          // 0 degrees
      'image': Math.PI/3, // 60 degrees
      'pdf': 2*Math.PI/3, // 120 degrees
      'audio': Math.PI,   // 180 degrees
      'video': 4*Math.PI/3, // 240 degrees
      'other': 5*Math.PI/3  // 300 degrees
    };
    
    const angle = typeAngles[type] || 0;
    // Add some randomness to the angle
    const jitteredAngle = angle + (Math.random() - 0.5) * 0.5;
    // Add some randomness to the radius
    const jitteredRadius = radius * (0.7 + Math.random() * 0.6);
    
    return {
      x: Math.cos(jitteredAngle) * jitteredRadius,
      y: Math.sin(jitteredAngle) * jitteredRadius
    };
  }

  /**
   * Update file name visibility on nodes
   */
  updateFileNameVisibility(showFileNames: boolean): void {
    logger.debug('renderer', 'Updating file name visibility', { showFileNames });
    
    // Update existing text elements
    this.svg.selectAll('.node text')
      .style('display', showFileNames ? 'block' : 'none')
      .style('font-size', '10px')
      .style('text-anchor', 'middle')
      .style('fill', '#666')
      .style('pointer-events', 'none');
      
    logger.debug('renderer', 'File name visibility updated', { showFileNames });
  }

  /**
   * Set animation style for node appearances
   */
  setAnimationStyle(style: 'fade' | 'scale' | 'slide' | 'pop'): void {
    logger.debug('renderer', 'Setting animation style', { style });
    
    // Store the animation style for future node animations
    this.animationStyle = style;
    
    logger.debug('renderer', 'Animation style set', { style });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.simulation.stop();
    
    // Remove tooltip
    if (this.tooltip) {
      this.tooltip.remove();
    }
    
    d3.select(this.container).selectAll('*').remove();
    logger.debug('renderer', 'GraphRenderer destroyed');
  }
} 