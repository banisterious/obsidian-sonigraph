import * as d3 from 'd3';
import { GraphNode, GraphLink } from './GraphDataExtractor';
import { getLogger } from '../logging';
import { SonicGraphSettings } from '../utils/constants';

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
  // Phase 3.8: Enhanced clustering parameters
  strongLinkDistance: number;    // Distance for strong connections (>0.7 strength)
  weakLinkDistance: number;      // Distance for weak connections (<=0.7 strength) 
  orphanRepulsion: number;       // Reduced repulsion for orphaned nodes
  clusterStrength: number;       // Strength of clustering force
  separationStrength: number;    // Force between distinct groups
}

export class GraphRenderer {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private linkGroup: any;
  private nodeGroup: any;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  // Removed tooltip property - using native browser tooltips
  
  private simulation: d3.Simulation<GraphNode, GraphLink>;
  private config: RenderConfig;
  private forceConfig: ForceConfig;
  
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private visibleNodes: Set<string> = new Set();
  private visibleLinks: Set<string> = new Set();
  private animationStyle: 'fade' | 'scale' | 'slide' | 'pop' = 'fade';
  
  // Performance optimization: Viewport culling and batching
  private viewportBounds: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };
  private cullingMargin: number = 100; // Extra margin around viewport for smoother scrolling
  private isDenseGraph: boolean = false;
  private lastUpdateTime: number = 0;
  private updateDebounceMs: number = 16; // ~60fps
  private pendingUpdate: number | null = null;
  
  // Phase 3.8: Settings integration
  private layoutSettings: SonicGraphSettings['layout'] | null = null;
  
  // Tooltip variables removed - using native browser tooltips

  constructor(container: HTMLElement, config: Partial<RenderConfig> = {}) {
    this.container = container;
    this.config = {
      width: 800,
      height: 600,
      nodeRadius: 8,
      linkDistance: 35, // Phase 3.8: Increased for better node spacing
      showLabels: false,
      enableZoom: true,
      ...config
    };
    
    this.forceConfig = {
      centerStrength: 0.1,  // Reduced for more organic spread
      linkStrength: 0.5,    // Slightly reduced to prevent rigid connections
      chargeStrength: -60,  // Much less rigid repulsion for organic clusters
      collisionRadius: 14,  // Smaller radius for more natural clustering
      // Enhanced clustering parameters for rounded clusters
      strongLinkDistance: 25,    // Tighter for strong connections
      weakLinkDistance: 60,      // Reduced for less spacing
      orphanRepulsion: -20,      // Gentler orphan repulsion
      clusterStrength: 0.12,     // Balanced clustering
      separationStrength: 0.06   // Softer separation for organic shapes
    };

    this.initializeSVG();
    this.initializeSimulation();
    // Tooltip initialization removed - using native browser tooltips
    
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
    
    // Performance optimization: Initialize viewport bounds
    this.initializeViewportBounds();

    // Setup zoom behavior
    if (this.config.enableZoom) {
      this.zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          this.g.attr('transform', event.transform);
          // Performance optimization: Update viewport bounds for culling
          this.updateViewportBounds(event.transform);
          this.scheduleViewportUpdate();
        });

      // Configure zoom with touch event optimization before applying
      this.zoom
        .filter((event) => {
          // Allow all mouse events, but be more selective with touch
          return !event.ctrlKey && !event.button;
        })
        .touchable(() => false); // Disable touch events to prevent violations
      
      this.svg.call(this.zoom);
    }
  }

  /**
   * Initialize the D3 force simulation
   */
  private initializeSimulation(): void {
    this.simulation = d3.forceSimulation<GraphNode>()
      .force('link', d3.forceLink<GraphNode, GraphLink>()
        .id(d => d.id)
        // Phase 3.8: Variable link distance based on connection strength
        .distance((d: GraphLink) => {
          return d.strength > 0.7 ? this.forceConfig.strongLinkDistance : this.forceConfig.weakLinkDistance;
        })
        // Phase 3.8: Amplify connection strength for better clustering
        .strength((d: GraphLink) => d.strength * this.forceConfig.linkStrength * 1.5)
      )
      .force('charge', d3.forceManyBody<GraphNode>()
        // Phase 3.8: Adaptive charge based on node connections
        .strength((d: GraphNode) => {
          return d.connections.length > 0 ? this.forceConfig.chargeStrength : this.forceConfig.orphanRepulsion;
        })
      )
      .force('center', d3.forceCenter<GraphNode>(
        this.config.width / 2, 
        this.config.height / 2
      ).strength(this.forceConfig.centerStrength))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius((d: GraphNode) => {
          // Add randomness to collision radius for organic clustering
          const baseRadius = this.forceConfig.collisionRadius;
          const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3 multiplier
          return baseRadius * randomFactor;
        })
        .strength(0.8) // Slightly softer collision for more organic overlap
      )
      // Enhanced jitter force for organic, rounded clusters
      .force('jitter', (alpha) => {
        if (alpha < 0.05) return; // Apply for longer during simulation
        const strength = 0.03 * alpha; // Increased jitter strength for more organic movement
        this.nodes.forEach(node => {
          if (node.vx !== undefined && node.vy !== undefined) {
            // Circular jitter pattern for more organic clustering
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * strength;
            node.vx += Math.cos(angle) * distance;
            node.vy += Math.sin(angle) * distance;
          }
        });
      })
      .on('tick', () => {
        // Performance optimization: Only constrain coordinates occasionally
        if (this.simulation.alpha() > 0.3 || Math.random() < 0.1) {
          this.constrainNodeCoordinates();
        }
        
        // Optimized position updates
        this.updatePositions();
      })
      .alphaDecay(0.05) // Faster convergence for better performance
      .velocityDecay(0.6) // Higher decay for faster settling
      .alphaMin(0.01)     // Stop simulation earlier
      .on('end', () => this.onSimulationEnd());
  }

  // Tooltip initialization removed - using native browser tooltips

  /**
   * Render the graph with given nodes and links
   */
  render(nodes: GraphNode[], links: GraphLink[]): void {
    logger.debug('renderer', `Rendering graph: ${nodes.length} nodes, ${links.length} links`);
    
    this.nodes = nodes;
    this.links = links;
    
    // Performance optimization: Initialize node coordinates to prevent invalid positions
    this.initializeNodeCoordinates();
    
    // Performance optimization: Detect dense graphs for optimizations
    this.isDenseGraph = links.length > 500 || (nodes.length > 200 && links.length > nodes.length * 2);
    if (this.isDenseGraph) {
      logger.info('renderer', `Dense graph detected: ${links.length} links, enabling performance optimizations`);
      this.disableTransitionsForDenseGraph();
    } else {
      this.enableTransitionsForNormalGraph();
    }
    
    // Phase 3.8: Apply adaptive performance scaling
    this.applyAdaptiveScaling(nodes.length);
    
    // Phase 3.8: Apply initial clustering positioning (one-time)
    this.applyInitialClustering();
    
    // Initialize all nodes as visible for static rendering
    this.visibleNodes = new Set(nodes.map(n => n.id));
    this.visibleLinks = new Set(links.map((l, i) => this.getLinkId(l, i)));
    
    this.updateSimulation();
    this.renderLinks();
    this.renderNodes();
    
    // Note: Initial view/zoom is now controlled by the calling component (e.g., SonicGraphModal)
    // this.setInitialView(); // Removed to prevent zoom conflicts
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
   * Phase 3.8: Enhanced with link type and strength attributes for CSS styling
   * Performance optimization: Only render visible links with valid coordinates
   */
  private renderLinks(): void {
    // Performance optimization: Filter links to only include visible ones with valid endpoints
    const validLinks = this.links.filter((link, i) => {
      const linkId = this.getLinkId(link, i);
      
      // Check if link is in visible set
      if (!this.visibleLinks.has(linkId)) {
        return false;
      }
      
      // Get source and target nodes
      const sourceNode = typeof link.source === 'string' 
        ? this.nodes.find(n => n.id === link.source)
        : link.source;
      const targetNode = typeof link.target === 'string'
        ? this.nodes.find(n => n.id === link.target)
        : link.target;
      
      // Only include links where both endpoints exist and have valid coordinates
      if (!sourceNode || !targetNode) {
        logger.debug('link-filtering', `Link ${linkId} missing nodes - source: ${!!sourceNode}, target: ${!!targetNode}`);
        return false;
      }
      
      const sourceValid = this.hasValidCoordinates(sourceNode);
      const targetValid = this.hasValidCoordinates(targetNode);
      
      if (!sourceValid || !targetValid) {
        logger.debug('link-filtering', `Link ${linkId} invalid coords - source: [${sourceNode.x}, ${sourceNode.y}] valid: ${sourceValid}, target: [${targetNode.x}, ${targetNode.y}] valid: ${targetValid}`);
        return false;
      }
      
      return true;
    });
    
    logger.info('link-filtering', `Rendering ${validLinks.length} valid links out of ${this.links.length} total links (filtered out ${this.links.length - validLinks.length})`);
    
    const linkSelection = this.g.select('.sonigraph-temporal-links')
      .selectAll('line')
      .data(validLinks, (d: any, i) => this.getLinkId(d, i));

    // Enter new links with Phase 3.8 enhancements
    const linkEnter = linkSelection.enter()
      .append('line')
      .attr('class', 'appearing')
      // Phase 3.8: Add data attributes for CSS styling
      .attr('data-link-type', (d: GraphLink) => d.type)
      .attr('data-strength', (d: GraphLink) => this.getStrengthCategory(d.strength))
      .style('opacity', 0);

    // Phase 3.8: Enhanced link appearance animation
    linkEnter
      .transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', function() {
        d3.select(this).classed('appearing', false);
      });

    // Phase 3.8: Add hover interactions for links
    linkEnter
      .on('mouseenter', function(event, d) {
        d3.select(this).classed('highlighted', true);
        logger.debug('link-hover', 'Link hovered', {
          source: typeof d.source === 'string' ? d.source : d.source.id,
          target: typeof d.target === 'string' ? d.target : d.target.id,
          type: d.type,
          strength: d.strength
        });
      })
      .on('mouseleave', function() {
        d3.select(this).classed('highlighted', false);
      });

    // Update existing links with new data attributes
    linkSelection
      .attr('data-link-type', (d: GraphLink) => d.type)
      .attr('data-strength', (d: GraphLink) => this.getStrengthCategory(d.strength));

    // Remove old links
    linkSelection.exit()
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();

    this.linkGroup = this.g.select('.sonigraph-temporal-links').selectAll('line');
  }

  /**
   * Phase 3.8: Categorize link strength for CSS styling
   */
  private getStrengthCategory(strength: number): string {
    if (strength >= 0.7) return 'strong';
    if (strength >= 0.4) return 'medium';
    return 'weak';
  }

  /**
   * Render nodes
   * Performance optimization: Only render visible nodes with valid coordinates
   */
  private renderNodes(): void {
    // Performance optimization: Filter nodes to only include visible ones with valid coordinates
    const validNodes = this.nodes.filter(node => {
      // Check if node is in visible set and has valid coordinates
      return this.visibleNodes.has(node.id) && this.hasValidCoordinates(node);
    });
    
    logger.debug('node-filtering', `Rendering ${validNodes.length} valid nodes out of ${this.nodes.length} total nodes`);
    
    const nodeSelection = this.g.select('.sonigraph-temporal-nodes')
      .selectAll('.sonigraph-temporal-node')
      .data(validNodes, (d: any) => d.id);

    // Enter new nodes
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'sonigraph-temporal-node appearing')
      .style('opacity', 0)
      .call(this.setupNodeInteractions.bind(this));

    // Add circles to new nodes with tooltips
    nodeEnter.append('circle')
      .attr('r', this.config.nodeRadius)
      .attr('class', d => `${d.type}-node`)
      .attr('title', (d: GraphNode) => {
        const fileName = d.title.split('/').pop() || d.title;
        return fileName;
      });

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
      .on('mouseover', (_, d) => {
        // Highlight connected links
        this.highlightConnectedLinks(d.id, true);
      })
      .on('mouseout', (_, d) => {
        // Remove highlight from connected links
        this.highlightConnectedLinks(d.id, false);
      })
      .on('click', (_, d) => {
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
    // Performance optimization: Batch position updates for dense graphs
    if (this.isDenseGraph) {
      this.updatePositionsBatched();
    } else {
      this.updatePositionsStandard();
    }
    
    // Performance optimization: Much less frequent cleanup for better performance
    if (Math.random() < 0.02) { // Only 2% of the time for much better performance
      this.forceRemoveInvalidLinks();
    }
  }
  
  /**
   * Standard position updates for normal graphs
   */
  private updatePositionsStandard(): void {
    // Update link positions - hide invalid links, update valid ones
    this.linkGroup = this.g.select('.sonigraph-temporal-links').selectAll('line');
    this.linkGroup
      .style('display', (d: any) => {
        const hasValidCoords = this.hasValidCoordinates(d.source) && this.hasValidCoordinates(d.target);
        return hasValidCoords ? 'block' : 'none';
      })
      .filter((d: any) => this.hasValidCoordinates(d.source) && this.hasValidCoordinates(d.target))
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    // Update node positions - hide invalid nodes, update valid ones
    this.nodeGroup = this.g.select('.sonigraph-temporal-nodes').selectAll('.sonigraph-temporal-node');
    this.nodeGroup
      .style('display', (d: GraphNode) => this.hasValidCoordinates(d) ? 'block' : 'none')
      .filter((d: GraphNode) => this.hasValidCoordinates(d))
      .attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`);
  }
  
  /**
   * Batched position updates for dense graphs (only visible elements)
   */
  private updatePositionsBatched(): void {
    const bounds = this.viewportBounds;
    
    // Update link positions - hide invalid links, show only valid and visible ones
    this.linkGroup = this.g.select('.sonigraph-temporal-links').selectAll('line');
    this.linkGroup
      .style('display', (d: any) => {
        // First check for valid coordinates
        if (!this.hasValidCoordinates(d.source) || !this.hasValidCoordinates(d.target)) {
          return 'none';
        }
        
        // Then check viewport visibility
        const sourceVisible = this.isNodeInViewport(d.source, bounds);
        const targetVisible = this.isNodeInViewport(d.target, bounds);
        return (sourceVisible || targetVisible) ? 'block' : 'none';
      })
      .filter((d: any) => {
        // Only update positions for valid and visible links
        if (!this.hasValidCoordinates(d.source) || !this.hasValidCoordinates(d.target)) {
          return false;
        }
        
        const sourceVisible = this.isNodeInViewport(d.source, bounds);
        const targetVisible = this.isNodeInViewport(d.target, bounds);
        return sourceVisible || targetVisible;
      })
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    // Update node positions - hide invalid nodes, show only valid and visible ones
    this.nodeGroup = this.g.select('.sonigraph-temporal-nodes').selectAll('.sonigraph-temporal-node');
    this.nodeGroup
      .style('display', (d: GraphNode) => {
        return this.hasValidCoordinates(d) && this.isNodeInViewport(d, bounds) ? 'block' : 'none';
      })
      .filter((d: GraphNode) => this.hasValidCoordinates(d) && this.isNodeInViewport(d, bounds))
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
  /**
   * Public method to set zoom transform (called by SonicGraphModal)
   */
  setZoomTransform(transform: any): void {
    if (this.config.enableZoom && this.zoom) {
      this.svg.call(this.zoom.transform, transform);
      logger.info('zoom-set', `Zoom transform set externally: scale=${transform.k}, translate=(${transform.x}, ${transform.y})`);
    }
  }

  /**
   * Set initial view for static preview (deprecated - now handled by caller)
   */
  private setInitialView(): void {
    // ULTRA aggressive zoom out - show the full graph at tiny scale
    const initialScale = 0.05; // Extremely zoomed out
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    logger.info('zoom-setup', `Setting ULTRA zoom out: scale=${initialScale}, center=(${centerX}, ${centerY})`);
    
    // Apply transform using multiple methods to ensure it takes effect
    const initialTransform = d3.zoomIdentity
      .translate(centerX, centerY) 
      .scale(initialScale);
    
    if (this.config.enableZoom && this.zoom) {
      // Apply the transform immediately
      this.svg.call(this.zoom.transform, initialTransform);
      logger.info('zoom-applied', 'Ultra zoom transform applied');
      
      // Also try setting it on the g element directly
      this.g.attr('transform', `translate(${centerX}, ${centerY}) scale(${initialScale})`);
      logger.info('manual-transform', 'Manual transform also applied');
    }
    
    // Alternative approach: Just apply the transform to the g element
    this.g.attr('transform', `translate(${centerX}, ${centerY}) scale(${initialScale})`);
    
    // Performance optimization: Reduce intensive cleanup for better performance
    let cleanupCount = 0;
    const cleanupInterval = setInterval(() => {
      // Less frequent coordinate constraints (now handled in tick)
      if (Math.random() < 0.3) { // Only 30% of the time
        this.constrainNodeCoordinates();
      }
      
      // Remove invalid links less aggressively
      const removed = this.forceRemoveInvalidLinks();
      if (removed > 0) {
        cleanupCount++;
        logger.warn('invalid-links', `Cleanup ${cleanupCount}: Removed ${removed} invalid links`);
      }
    }, 200); // Less frequent cleanup - every 200ms for better performance
    
    // Stop simulation sooner for better performance
    setTimeout(() => {
      clearInterval(cleanupInterval);
      this.simulation.stop();
      
      // Minimal final cleanup
      const finalRemoved = this.forceRemoveInvalidLinks();
      if (finalRemoved > 0) {
        logger.info('post-simulation', `Simulation stopped. Final cleanup removed ${finalRemoved} invalid links`);
      }
      
      logger.debug('renderer', 'Simulation stopped with optimized performance');
    }, 500); // Reduced from 800ms to 500ms for faster loading
    
    logger.debug('renderer', 'Ultra aggressive initial view set with continuous cleanup');
  }

  // Tooltip methods removed - using native browser tooltips for better performance

  /**
   * Generate consistent link ID for D3.js data binding
   */
  private getLinkId(link: any, index: number): string {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return `${sourceId}-${targetId}-${index}`;
  }

  // formatFileSize method removed - no longer needed with native tooltips

  /**
   * Handle simulation end
   */
  private onSimulationEnd(): void {
    logger.debug('renderer', 'Force simulation ended');
  }

  /**
   * Get offset position for path-based grouping
   */
  private getPathBasedOffset(filePath: string, groups: any[]): { x: number; y: number } {
    const radius = 100; // Distance from center for group clusters
    
    // Find which group this file belongs to
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (filePath.startsWith(group.path)) {
        // Calculate angle based on group index
        const angle = (i / groups.length) * 2 * Math.PI;
        // Add some randomness for natural clustering
        const jitteredAngle = angle + (Math.random() - 0.5) * 0.3;
        const jitteredRadius = radius * (0.8 + Math.random() * 0.4);
        
        return {
          x: Math.cos(jitteredAngle) * jitteredRadius,
          y: Math.sin(jitteredAngle) * jitteredRadius
        };
      }
    }
    
    // If no group match, place near center with some scatter
    return {
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 40
    };
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
   * Phase 3.8: Update layout settings and apply changes
   */
  updateLayoutSettings(settings: SonicGraphSettings['layout']): void {
    logger.debug('layout-settings', 'Updating layout settings', settings);
    
    this.layoutSettings = settings;
    
    // Apply layout preset if specified
    if (settings.layoutPreset) {
      this.applyLayoutPreset(settings.layoutPreset);
    }
    
    // Update force parameters based on settings
    this.forceConfig.clusterStrength = settings.clusteringStrength;
    this.forceConfig.separationStrength = settings.groupSeparation;
    
    // Update simulation forces if simulation exists
    if (this.simulation) {
      this.updateSimulationForces();
      this.simulation.alpha(0.3).restart(); // Gentle restart to apply changes
    }
    
    logger.debug('layout-settings', 'Layout settings applied', settings);
  }

  /**
   * Phase 3.8: Apply predefined layout presets
   */
  private applyLayoutPreset(preset: 'loose' | 'balanced' | 'tight' | 'very-tight'): void {
    logger.debug('layout-preset', 'Applying layout preset', { preset });
    
    switch (preset) {
      case 'loose':
        this.forceConfig.clusterStrength = 0.1;
        this.forceConfig.separationStrength = 0.04;
        this.forceConfig.strongLinkDistance = 30;
        this.forceConfig.weakLinkDistance = 80;
        this.forceConfig.chargeStrength = -60;
        break;
        
      case 'balanced':
        this.forceConfig.clusterStrength = 0.15;
        this.forceConfig.separationStrength = 0.08;
        this.forceConfig.strongLinkDistance = 20;
        this.forceConfig.weakLinkDistance = 60;
        this.forceConfig.chargeStrength = -80;
        break;
        
      case 'tight':
        this.forceConfig.clusterStrength = 0.2;
        this.forceConfig.separationStrength = 0.12;
        this.forceConfig.strongLinkDistance = 15;
        this.forceConfig.weakLinkDistance = 40;
        this.forceConfig.chargeStrength = -100;
        break;
        
      case 'very-tight':
        this.forceConfig.clusterStrength = 0.25;
        this.forceConfig.separationStrength = 0.15;
        this.forceConfig.strongLinkDistance = 12;
        this.forceConfig.weakLinkDistance = 35;
        this.forceConfig.chargeStrength = -120;
        break;
    }
    
    logger.debug('layout-preset', 'Layout preset applied', { preset, config: this.forceConfig });
  }

  /**
   * Phase 3.8: Apply initial clustering positioning (one-time optimization)
   */
  private applyInitialClustering(): void {
    logger.debug('clustering', 'Applying initial clustering positioning');
    
    const layoutSettings = this.layoutSettings;
    if (!layoutSettings) return;
    
    // Apply initial positions based on clustering method
    this.nodes.forEach(node => {
      let offset = { x: 0, y: 0 };
      
      // Check if path-based grouping is enabled
      if (layoutSettings.pathBasedGrouping.enabled) {
        offset = this.getPathBasedOffset(node.path, layoutSettings.pathBasedGrouping.groups);
      } else {
        // Fall back to file type clustering
        offset = this.getTypeOffset(node.type);
      }
      
      // Set initial positions for better clustering
      node.x = this.config.width / 2 + offset.x + (Math.random() - 0.5) * 20;
      node.y = this.config.height / 2 + offset.y + (Math.random() - 0.5) * 20;
      
      // For highly connected nodes (journals), position closer to center
      if (node.connections.length > 5) {
        const centerPull = 0.3;
        node.x = node.x * (1 - centerPull) + (this.config.width / 2) * centerPull;
        node.y = node.y * (1 - centerPull) + (this.config.height / 2) * centerPull;
      }
    });
    
    logger.debug('clustering', 'Initial clustering positioning applied');
  }

  // Phase 3.8: Clustering methods removed - now using one-time initial positioning

  /**
   * Phase 3.8: Adaptive performance scaling based on graph size
   */
  private applyAdaptiveScaling(nodeCount: number): void {
    logger.debug('adaptive-scaling', `Applying adaptive scaling for ${nodeCount} nodes`);
    
    // Define scaling thresholds
    if (nodeCount <= 50) {
      // Small graphs: Full quality
      this.forceConfig.clusterStrength = 0.15;
      this.forceConfig.separationStrength = 0.08;
      this.forceConfig.chargeStrength = -80;
      logger.debug('adaptive-scaling', 'Applied small graph settings (full quality)');
      
    } else if (nodeCount <= 200) {
      // Medium graphs: Balanced quality
      this.forceConfig.clusterStrength = 0.12;
      this.forceConfig.separationStrength = 0.06;
      this.forceConfig.chargeStrength = -70;
      logger.debug('adaptive-scaling', 'Applied medium graph settings (balanced quality)');
      
    } else if (nodeCount <= 500) {
      // Large graphs: Performance focused
      this.forceConfig.clusterStrength = 0.1;
      this.forceConfig.separationStrength = 0.04;
      this.forceConfig.chargeStrength = -60;
      logger.debug('adaptive-scaling', 'Applied large graph settings (performance focused)');
      
    } else {
      // Very large graphs: Minimal complexity
      this.forceConfig.clusterStrength = 0.08;
      this.forceConfig.separationStrength = 0.02;
      this.forceConfig.chargeStrength = -50;
      logger.debug('adaptive-scaling', 'Applied very large graph settings (minimal complexity)');
    }
    
    // Update simulation with new parameters if it exists
    if (this.simulation) {
      this.updateSimulationForces();
    }
  }

  /**
   * Phase 3.8: Update simulation forces with current config
   */
  private updateSimulationForces(): void {
    // Update charge force
    (this.simulation.force('charge') as d3.ForceManyBody<GraphNode>)
      ?.strength((d: GraphNode) => {
        return d.connections.length > 0 ? this.forceConfig.chargeStrength : this.forceConfig.orphanRepulsion;
      });
    
    // Update collision force
    (this.simulation.force('collision') as d3.ForceCollide<GraphNode>)
      ?.radius(this.forceConfig.collisionRadius);
    
    // Update link force
    (this.simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)
      ?.distance((d: GraphLink) => {
        return d.strength > 0.7 ? this.forceConfig.strongLinkDistance : this.forceConfig.weakLinkDistance;
      })
      ?.strength((d: GraphLink) => d.strength * this.forceConfig.linkStrength * 1.5);
    
    logger.debug('adaptive-scaling', 'Updated simulation forces with new parameters');
  }

  /**
   * Update graph data and restart simulation
   */
  updateData(nodes: GraphNode[], links: GraphLink[]): void {
    logger.debug('renderer', 'Updating graph data', { 
      nodeCount: nodes.length, 
      linkCount: links.length 
    });
    
    this.nodes = nodes;
    this.links = links;
    
    // Update simulation with new data
    this.simulation.nodes(this.nodes);
    (this.simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)?.links(this.links);
    
    // Re-render with new data
    this.renderNodes();
    this.renderLinks();
    
    // Restart simulation to apply spacing changes
    this.restartSimulation();
    
    logger.debug('renderer', 'Graph data updated and simulation restarted');
  }

  /**
   * Restart simulation with current configuration
   */
  restartSimulation(): void {
    logger.debug('renderer', 'Restarting simulation with updated spacing parameters');
    
    // Update all forces with current configuration
    this.updateSimulationForces();
    
    // Restart with medium alpha for visible movement but not chaos
    this.simulation.alpha(0.5).restart();
    
    logger.debug('renderer', 'Simulation restarted', { 
      collisionRadius: this.forceConfig.collisionRadius,
      chargeStrength: this.forceConfig.chargeStrength,
      strongLinkDistance: this.forceConfig.strongLinkDistance,
      weakLinkDistance: this.forceConfig.weakLinkDistance
    });
  }

  /**
   * Force apply better spacing immediately
   */
  applyBetterSpacing(): void {
    logger.debug('renderer', 'Applying better spacing configuration');
    
    // Update force configuration with better spacing
    this.forceConfig.collisionRadius = 24;  // One node-sized space between nodes
    this.forceConfig.chargeStrength = -120; // Stronger repulsion
    this.forceConfig.strongLinkDistance = 30;
    this.forceConfig.weakLinkDistance = 80;
    
    // Apply changes immediately
    this.restartSimulation();
    
    logger.debug('renderer', 'Better spacing applied and simulation restarted');
  }

  // Performance optimization: Viewport culling methods
  
  /**
   * Initialize viewport bounds on startup
   */
  private initializeViewportBounds(): void {
    const identity = d3.zoomIdentity;
    this.updateViewportBounds(identity);
  }
  
  /**
   * Update viewport bounds based on current zoom transform
   */
  private updateViewportBounds(transform: d3.ZoomTransform): void {
    const containerRect = this.container.getBoundingClientRect();
    
    // Calculate the visible area in graph coordinates
    this.viewportBounds = {
      x: -transform.x / transform.k - this.cullingMargin,
      y: -transform.y / transform.k - this.cullingMargin,
      width: containerRect.width / transform.k + (this.cullingMargin * 2),
      height: containerRect.height / transform.k + (this.cullingMargin * 2)
    };
  }
  
  /**
   * Schedule a viewport update (debounced for performance)
   */
  private scheduleViewportUpdate(): void {
    if (!this.isDenseGraph) return; // Only use culling for dense graphs
    
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateDebounceMs) {
      if (this.pendingUpdate) {
        cancelAnimationFrame(this.pendingUpdate);
      }
      this.pendingUpdate = requestAnimationFrame(() => {
        this.updateVisibleElements();
        this.lastUpdateTime = performance.now();
        this.pendingUpdate = null;
      });
      return;
    }
    
    this.updateVisibleElements();
    this.lastUpdateTime = now;
  }
  
  /**
   * Update which elements are visible based on viewport bounds
   */
  private updateVisibleElements(): void {
    if (!this.isDenseGraph) return;
    
    const bounds = this.viewportBounds;
    let visibleLinksCount = 0;
    let hiddenLinksCount = 0;
    
    // Update visible links based on viewport culling
    this.linkGroup.selectAll('line')
      .style('display', (d: any) => {
        const sourceNode = d.source;
        const targetNode = d.target;
        
        // First check for valid coordinates
        if (!this.hasValidCoordinates(sourceNode) || !this.hasValidCoordinates(targetNode)) {
          hiddenLinksCount++;
          return 'none';
        }
        
        // Check if either endpoint is in viewport
        const sourceVisible = this.isNodeInViewport(sourceNode, bounds);
        const targetVisible = this.isNodeInViewport(targetNode, bounds);
        
        if (sourceVisible || targetVisible) {
          visibleLinksCount++;
          return 'block';
        } else {
          hiddenLinksCount++;
          return 'none';
        }
      });
    
    // Update visible nodes based on viewport culling
    this.nodeGroup.selectAll('circle')
      .style('display', (d: any) => {
        // Only show nodes with valid coordinates that are in viewport
        if (!this.hasValidCoordinates(d)) {
          return 'none';
        }
        return this.isNodeInViewport(d, bounds) ? 'block' : 'none';
      });
    
    logger.debug('viewport-culling', `Updated visibility: ${visibleLinksCount} visible, ${hiddenLinksCount} hidden links`);
  }
  
  /**
   * Initialize node coordinates to prevent invalid positions
   */
  private initializeNodeCoordinates(): void {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    let invalidCount = 0;
    
    this.nodes.forEach((node, index) => {
      if (!this.hasValidCoordinates(node)) {
        // Initialize with a slight random offset to prevent overlap
        const angle = (index / this.nodes.length) * 2 * Math.PI;
        const radius = 50 + (Math.random() * 100);
        
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
        invalidCount++;
      }
    });
    
    if (invalidCount > 0) {
      logger.debug('coordinate-init', `Initialized coordinates for ${invalidCount} nodes with invalid positions`);
    }
  }
  
  /**
   * Check if a node has valid coordinates (not NaN or undefined)
   */
  private hasValidCoordinates(node: any): boolean {
    return node && 
           typeof node.x === 'number' && 
           typeof node.y === 'number' && 
           !isNaN(node.x) && 
           !isNaN(node.y) &&
           isFinite(node.x) &&
           isFinite(node.y);
  }
  
  /**
   * Aggressively constrain all node coordinates to valid values
   */
  private constrainNodeCoordinates(): void {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const maxDistance = Math.max(this.config.width, this.config.height); // Reasonable bounds
    
    this.nodes.forEach(node => {
      // Fix invalid x coordinate
      if (typeof node.x !== 'number' || !isFinite(node.x) || isNaN(node.x)) {
        node.x = centerX + (Math.random() - 0.5) * 20; // Small random offset from center
        logger.warn('coordinate-fix', `Fixed invalid x coordinate for node ${node.id}: set to ${node.x}`);
      } else if (Math.abs(node.x - centerX) > maxDistance) {
        // Constrain to reasonable bounds
        node.x = centerX + Math.sign(node.x - centerX) * maxDistance * 0.9;
      }
      
      // Fix invalid y coordinate
      if (typeof node.y !== 'number' || !isFinite(node.y) || isNaN(node.y)) {
        node.y = centerY + (Math.random() - 0.5) * 20; // Small random offset from center
        logger.warn('coordinate-fix', `Fixed invalid y coordinate for node ${node.id}: set to ${node.y}`);
      } else if (Math.abs(node.y - centerY) > maxDistance) {
        // Constrain to reasonable bounds
        node.y = centerY + Math.sign(node.y - centerY) * maxDistance * 0.9;
      }
      
      // Fix velocity coordinates if they exist
      if (node.vx && (typeof node.vx !== 'number' || !isFinite(node.vx) || isNaN(node.vx))) {
        node.vx = 0;
      }
      if (node.vy && (typeof node.vy !== 'number' || !isFinite(node.vy) || isNaN(node.vy))) {
        node.vy = 0;
      }
    });
  }
  
  /**
   * Check if a node is within the viewport bounds
   */
  private isNodeInViewport(node: any, bounds: { x: number; y: number; width: number; height: number }): boolean {
    if (!this.hasValidCoordinates(node)) {
      return false;
    }
    
    return node.x >= bounds.x && 
           node.x <= bounds.x + bounds.width &&
           node.y >= bounds.y && 
           node.y <= bounds.y + bounds.height;
  }
  
  /**
   * Disable CSS transitions for dense graphs to improve performance
   */
  private disableTransitionsForDenseGraph(): void {
    this.container.classList.add('dense-graph-mode');
    
    // Add CSS rule to disable transitions for dense graphs
    const style = document.createElement('style');
    style.textContent = `
      .dense-graph-mode .sonigraph-temporal-svg * {
        transition: none !important;
        animation: none !important;
      }
    `;
    
    // Add to document head if not already present
    if (!document.querySelector('#dense-graph-performance-style')) {
      style.id = 'dense-graph-performance-style';
      document.head.appendChild(style);
    }
    
    logger.debug('performance', 'Disabled CSS transitions for dense graph');
  }
  
  /**
   * Enable CSS transitions for normal graphs
   */
  private enableTransitionsForNormalGraph(): void {
    this.container.classList.remove('dense-graph-mode');
    logger.debug('performance', 'Enabled CSS transitions for normal graph');
  }
  
  /**
   * Force removal of all links with invalid coordinates from the DOM
   */
  private forceRemoveInvalidLinks(): number {
    const allLines = this.g.select('.sonigraph-temporal-links').selectAll('line');
    let removedCount = 0;
    
    allLines.each(function(d: any) {
      const sourceNode = d.source;
      const targetNode = d.target;
      
      // Check if either endpoint has invalid coordinates
      const sourceInvalid = !sourceNode || 
        typeof sourceNode.x !== 'number' || 
        typeof sourceNode.y !== 'number' || 
        isNaN(sourceNode.x) || 
        isNaN(sourceNode.y) ||
        !isFinite(sourceNode.x) ||
        !isFinite(sourceNode.y);
        
      const targetInvalid = !targetNode || 
        typeof targetNode.x !== 'number' || 
        typeof targetNode.y !== 'number' || 
        isNaN(targetNode.x) || 
        isNaN(targetNode.y) ||
        !isFinite(targetNode.x) ||
        !isFinite(targetNode.y);
      
      if (sourceInvalid || targetInvalid) {
        // Log details about the invalid link for debugging
        if (removedCount < 5) { // Only log first few to avoid spam
          logger.warn('invalid-link-detail', 'Removing invalid link', {
            sourceValid: !sourceInvalid,
            targetValid: !targetInvalid,
            sourceCoords: sourceNode ? [sourceNode.x, sourceNode.y] : 'null',
            targetCoords: targetNode ? [targetNode.x, targetNode.y] : 'null'
          });
        }
        d3.select(this).remove();
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      logger.info('invalid-link-removal', `Force removed ${removedCount} links with invalid coordinates from DOM`);
    }
    
    return removedCount;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Cancel any pending updates
    if (this.pendingUpdate) {
      cancelAnimationFrame(this.pendingUpdate);
      this.pendingUpdate = null;
    }
    
    this.simulation.stop();
    
    // No tooltip cleanup needed - using native browser tooltips
    
    d3.select(this.container).selectAll('*').remove();
    logger.debug('renderer', 'GraphRenderer destroyed');
  }
} 