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
  
  private simulation: d3.Simulation<GraphNode, GraphLink>;
  private config: RenderConfig;
  private forceConfig: ForceConfig;
  
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private visibleNodes: Set<string> = new Set();
  private visibleLinks: Set<string> = new Set();

  constructor(container: HTMLElement, config: Partial<RenderConfig> = {}) {
    this.container = container;
    this.config = {
      width: 800,
      height: 600,
      nodeRadius: 8,
      linkDistance: 50,
      showLabels: false,
      enableZoom: true,
      ...config
    };
    
    this.forceConfig = {
      centerStrength: 0.3,
      linkStrength: 0.5,
      chargeStrength: -150,
      collisionRadius: 12
    };

    this.initializeSVG();
    this.initializeSimulation();
    
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
      
      // Fix touch event warnings by making touch events passive
      this.svg.on('touchstart.zoom', null);
      this.svg.on('touchmove.zoom', null);
      this.svg.on('touchend.zoom', null);
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
      .on('tick', () => this.updatePositions())
      .on('end', () => this.onSimulationEnd());
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
    this.visibleLinks = new Set(links.map((l, i) => `${l.source}-${l.target}-${i}`));
    
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
      .data(this.links, (d: any, i) => `${typeof d.source === 'string' ? d.source : d.source.id}-${typeof d.target === 'string' ? d.target : d.target.id}-${i}`);

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
    const textElements = nodeEnter.append('text')
      .attr('dy', this.config.nodeRadius + 15)
      .attr('class', this.config.showLabels ? 'labels-visible' : '')
      .text(d => d.title);
    
    // Set initial visibility with inline styles
    if (this.config.showLabels) {
      textElements.style('display', 'block').style('opacity', '1');
    } else {
      textElements.style('display', 'none').style('opacity', '0');
    }
    
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
   * Setup node interactions (hover, click, etc.)
   */
  private setupNodeInteractions(selection: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>): void {
    selection
      .on('mouseover', (event, d) => {
        // Highlight connected links
        this.highlightConnectedLinks(d.id, true);
      })
      .on('mouseout', (event, d) => {
        // Remove highlight from connected links
        this.highlightConnectedLinks(d.id, false);
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
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const linkId = `${sourceId}-${targetId}-${i}`;
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
        
        // Use both class and inline style for maximum compatibility
        if (this.config.showLabels) {
          textSelection
            .classed('labels-visible', true)
            .style('display', 'block')
            .style('opacity', '1');
        } else {
          textSelection
            .classed('labels-visible', false)
            .style('display', 'none')
            .style('opacity', '0');
        }
        
        // Log the state for debugging
        logger.debug('renderer', `Labels ${this.config.showLabels ? 'shown' : 'hidden'} via inline styles`);
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
   * Handle simulation end
   */
  private onSimulationEnd(): void {
    logger.debug('renderer', 'Force simulation ended');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.simulation.stop();
    d3.select(this.container).selectAll('*').remove();
    logger.debug('renderer', 'GraphRenderer destroyed');
  }
} 