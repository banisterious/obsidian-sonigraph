import * as d3 from 'd3';
import { GraphNode, GraphLink } from './GraphDataExtractor';
import { getLogger } from '../logging';
import { SonicGraphSettings } from '../utils/constants';
import { ContentAwarePositioning } from './ContentAwarePositioning';
import { SmartClusteringAlgorithms, Cluster, ClusteringResult } from './SmartClusteringAlgorithms';

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

// Hub Highlighting interfaces
interface NodeStyling {
  size: number;
  strokeWidth: number;
  strokeColor: string;
  glowEffect: boolean;
  animation: 'pulse' | 'none';
}

interface HubTier {
  name: string;
  minConnections: number;
  visualTreatment: NodeStyling;
}

export class GraphRenderer {
  private container: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private linkGroup: d3.Selection<d3.BaseType, unknown, d3.BaseType, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private nodeGroup: d3.Selection<d3.BaseType, unknown, d3.BaseType, any>;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private onZoomChangeCallback: ((zoomLevel: number) => void) | null = null;
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
  private updateDebounceMs: number = 33; // Reduced to ~30fps for better performance
  private pendingUpdate: number | null = null;
  
  // Enhanced performance controls
  private performanceMode: 'quality' | 'balanced' | 'performance' = 'quality';
  private isSimulationPaused: boolean = false;
  private frameSkipCounter: number = 0;
  private maxFrameSkip: number = 1; // Skip every other frame for dense graphs
  
  // Phase 3.8: Settings integration
  private layoutSettings: SonicGraphSettings['layout'] | null = null;
  
  // Content-Aware Positioning integration
  private contentAwarePositioning: ContentAwarePositioning | null = null;
  private contentAwareSettings: SonicGraphSettings['contentAwarePositioning'] | null = null;
  
  // Smart Clustering integration
  private smartClustering: SmartClusteringAlgorithms | null = null;
  private smartClusteringSettings: SonicGraphSettings['smartClustering'] | null = null;
  private clusteringResult: ClusteringResult | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clusterGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any> | null = null;
  
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

    // Initialize ContentAwarePositioning with default settings
    this.contentAwarePositioning = new ContentAwarePositioning({
      enabled: false, // Will be enabled via settings
      tagInfluence: { strength: 'moderate', weight: 0.3 },
      temporalPositioning: { enabled: true, weight: 0.1, recentThresholdDays: 30 },
      hubCentrality: { enabled: true, weight: 0.2, minimumConnections: 5 },
      debugVisualization: false
    });

    // Initialize SmartClustering with default settings (flat structure)
    this.smartClustering = new SmartClusteringAlgorithms({
      enabled: false, // Will be enabled via settings
      algorithm: 'hybrid',
      weights: { linkStrength: 0.4, sharedTags: 0.3, folderHierarchy: 0.2, temporalProximity: 0.1 },
      minClusterSize: 3,
      maxClusters: 12,
      resolution: 1.0,
      enableVisualization: true,
      respectExistingGroups: true,
      debugMode: false
    });

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
          
          // Adaptive detail levels: Notify zoom change callback
          if (this.onZoomChangeCallback) {
            this.onZoomChangeCallback(event.transform.k);
          }
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
          // Hub highlighting: Use actual node size plus padding for collision
          const nodeSize = this.calculateNodeSize(d);
          const padding = 2; // Small padding between nodes
          const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1 multiplier for organic feel
          return (nodeSize + padding) * randomFactor;
        })
        .strength(0.8) // Slightly softer collision for more organic overlap
      )
      // Enhanced jitter force for organic clusters (performance mode aware)
      .force('jitter', (alpha) => {
        // Skip jitter for performance mode or when alpha is low enough
        if (this.performanceMode === 'performance' || alpha < this.getJitterThreshold()) return;
        
        const strength = this.getJitterStrength() * alpha;
        this.nodes.forEach(node => {
          if (node.vx !== undefined && node.vy !== undefined) {
            // Circular jitter pattern for more organic clustering
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * strength;
            node.vx += Math.cos(angle) * distance;
            node.vy += Math.sin(angle) * distance;
          }
        });
      });

    // Apply Content-Aware Positioning forces
    this.applyContentAwareForces();

    this.simulation.on('tick', () => {
        // Performance optimization: Frame skipping for dense graphs
        if (this.maxFrameSkip > 0) {
          this.frameSkipCounter++;
          if (this.frameSkipCounter <= this.maxFrameSkip) {
            return; // Skip this frame
          }
          this.frameSkipCounter = 0; // Reset counter
        }
        
        // Performance optimization: Only constrain coordinates occasionally
        if (this.simulation.alpha() > 0.3 || Math.random() < 0.1) {
          this.constrainNodeCoordinates();
        }
        
        // Optimized position updates
        this.updatePositions();
        
        // Update debug visualization if enabled (Content-Aware Positioning debug overlay)
        this.updateDebugVisualization();
      })
      .alphaDecay(this.getAlphaDecay()) // Adaptive convergence based on performance mode
      .velocityDecay(this.getVelocityDecay()) // Adaptive velocity decay
      .alphaMin(this.getAlphaMin())     // Adaptive stopping threshold
      .on('end', () => this.onSimulationEnd());
  }

  // Tooltip initialization removed - using native browser tooltips

  /**
   * Render the graph with given nodes and links
   */
  render(nodes: GraphNode[], links: GraphLink[]): void {
    logger.debug('renderer', `Rendering graph: ${nodes.length} nodes, ${links.length} links`);
    
    // Debug: Check node connection data
    const sampleNodes = nodes.slice(0, 5);
    sampleNodes.forEach(node => {
      logger.debug('node-data', `Sample node: ${node.title}, connections: ${node.connections?.length || 0}`, { 
        connections: node.connections,
        type: node.type 
      });
    });
    
    this.nodes = nodes;
    this.links = links;
    
    // Performance optimization: Initialize node coordinates to prevent invalid positions
    this.initializeNodeCoordinates();
    
    // Performance optimization: Detect graph complexity and set performance mode
    this.detectPerformanceMode(nodes.length, links.length);
    this.isDenseGraph = this.performanceMode === 'performance';
    
    if (this.isDenseGraph) {
      logger.info('renderer', `Performance mode: ${this.performanceMode} (${nodes.length} nodes, ${links.length} links)`);
      this.disableTransitionsForDenseGraph();
    } else {
      this.enableTransitionsForNormalGraph();
    }
    
    // Phase 3.8: Apply adaptive performance scaling
    this.applyAdaptiveScaling(nodes.length);
    
    // Phase 3.8: Apply initial clustering positioning (one-time)
    this.applyInitialClustering();
    
    // Apply Smart Clustering analysis and visualization
    this.applySmartClustering();
    
    // Initialize all nodes as visible for static rendering
    this.visibleNodes = new Set(nodes.map(n => n.id));
    this.visibleLinks = new Set(links.map((l, i) => this.getLinkId(l, i)));
    
    this.updateSimulation();
    this.renderLinks();
    this.renderNodes();
    
    // Note: Initial view/zoom is now controlled by the calling component (SonicGraphView)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * Hub Highlighting: Calculate node size based on connection count (Obsidian Graph style)
   */
  private calculateNodeSize(node: GraphNode): number {
    const connections = node.connections.length;
    const baseSize = 5; // Larger minimum for better visibility
    const maxSize = 24; // Larger maximum for dramatic variation
    
    // More dramatic scaling like Obsidian Graph
    if (connections === 0) {
      logger.debug('node-sizing', `Node ${node.title} has 0 connections, size: ${baseSize}`);
      return baseSize;
    }
    
    // Square root scaling for dramatic size differences
    const sizeMultiplier = Math.sqrt(connections);
    const finalSize = Math.min(baseSize + (sizeMultiplier * 3), maxSize);
    
    logger.debug('node-sizing', `Node ${node.title} has ${connections} connections, multiplier: ${sizeMultiplier.toFixed(2)}, final size: ${finalSize.toFixed(2)}`);
    return finalSize;
  }

  /**
   * Hub Highlighting: Determine hub tier based on connection count
   */
  private getHubTier(node: GraphNode): HubTier {
    const connections = node.connections.length;
    
    if (connections >= 20) {
      return {
        name: 'mega-hub',
        minConnections: 20,
        visualTreatment: {
          size: 16,
          strokeWidth: 3,
          strokeColor: '#ff6b35',
          glowEffect: true,
          animation: 'pulse'
        }
      };
    } else if (connections >= 10) {
      return {
        name: 'major-hub',
        minConnections: 10,
        visualTreatment: {
          size: 12,
          strokeWidth: 2,
          strokeColor: '#f7931e',
          glowEffect: false,
          animation: 'none'
        }
      };
    } else if (connections >= 5) {
      return {
        name: 'minor-hub',
        minConnections: 5,
        visualTreatment: {
          size: 8,
          strokeWidth: 1.5,
          strokeColor: '#4f46e5',
          glowEffect: false,
          animation: 'none'
        }
      };
    } else {
      return {
        name: 'regular-node',
        minConnections: 0,
        visualTreatment: {
          size: 4,
          strokeWidth: 1,
          strokeColor: '',
          glowEffect: false,
          animation: 'none'
        }
      };
    }
  }

  /**
   * Hub Highlighting: Get CSS class for hub styling
   */
  private getHubClass(node: GraphNode): string {
    const tier = this.getHubTier(node);
    return `hub-${tier.name}`;
  }

  /**
   * Hub Highlighting: Temporarily boost visual prominence of hub on hover
   */
  private temporaryHubBoost(nodeElement: d3.Selection<d3.BaseType, unknown, null, undefined>, node: GraphNode): void {
    const hubTier = this.getHubTier(node);
    const currentSize = this.calculateNodeSize(node);
    const boostedSize = Math.min(currentSize * 1.2, 20); // 20% boost, max 20px
    
    nodeElement.select('circle')
      .transition()
      .duration(200)
      .attr('r', boostedSize)
      .style('filter', `brightness(1.3) ${hubTier.visualTreatment.glowEffect ? 'drop-shadow(0 0 8px currentColor)' : ''}`);
    
    // Update label position for boosted size
    nodeElement.select('text')
      .transition()
      .duration(200)
      .attr('dy', boostedSize + 15);
  }

  /**
   * Hub Highlighting: Remove temporary boost effects
   */
  private removeHubBoost(nodeElement: d3.Selection<d3.BaseType, unknown, null, undefined>): void {
    nodeElement.select('circle')
      .transition()
      .duration(200)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('r', (d: any) => this.calculateNodeSize(d as GraphNode))
      .style('filter', null); // Reset to CSS filter

    // Reset label position
    nodeElement.select('text')
      .transition()
      .duration(200)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('dy', (d: any) => this.calculateNodeSize(d as GraphNode) + 15);
  }

  /**
   * Hub Highlighting: Show enhanced tooltip for hub nodes
   */
  private showHubTooltip(node: GraphNode, _event: MouseEvent): void {
    // For now, we'll enhance the native tooltip
    // In the future, this could create a custom tooltip element
    const hubTier = this.getHubTier(node);
    const fileName = node.title.split('/').pop() || node.title;
    const connections = node.connections.length;
    
    logger.debug('hub-tooltip', `Showing hub tooltip for ${fileName}`, {
      connections,
      hubTier: hubTier.name,
      tierDescription: this.getHubTierDescription(hubTier)
    });
  }

  /**
   * Hub Highlighting: Hide hub tooltip
   */
  private hideHubTooltip(): void {
    // For now, this is a no-op since we're using native tooltips
    // In the future, this would hide custom tooltip elements
  }

  /**
   * Hub Highlighting: Get human-readable description of hub tier
   */
  private getHubTierDescription(hubTier: HubTier): string {
    switch (hubTier.name) {
      case 'mega-hub':
        return 'Major Knowledge Hub (20+ connections)';
      case 'major-hub':
        return 'Important Hub (10-19 connections)';
      case 'minor-hub':
        return 'Knowledge Connector (5-9 connections)';
      default:
        return 'Regular Note';
    }
  }

  /**
   * Render nodes
   * Performance optimization: Only render visible nodes with valid coordinates
   * Hub highlighting: Connection-based sizing and styling
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(validNodes, (d: any) => d.id);

    // Enter new nodes
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'sonigraph-temporal-node appearing')
      .style('opacity', 0)
      .call(this.setupNodeInteractions.bind(this));

    // Add circles to new nodes with connection-based sizing and hub classification
    nodeEnter.append('circle')
      .attr('r', (d: GraphNode) => this.calculateNodeSize(d))
      .attr('class', d => `${d.type}-node ${this.getHubClass(d)}`)
      .attr('data-connections', (d: GraphNode) => d.connections.length)
      .attr('data-hub-tier', (d: GraphNode) => this.getHubTier(d).name);

    // Add title element for tooltips (SVG-compatible approach)
    nodeEnter.append('title')
      .text((d: GraphNode) => {
        const fileName = d.title.split('/').pop() || d.title;
        const connections = d.connections.length;
        return `${fileName} (${connections} connection${connections !== 1 ? 's' : ''})`;
      });

    // Add labels to new nodes with hub-aware positioning
    nodeEnter.append('text')
      .attr('dy', (d: GraphNode) => this.calculateNodeSize(d) + 15)
      .attr('class', this.config.showLabels ? 'labels-visible' : 'labels-hidden')
      .text(d => d.title);
    
    logger.debug('renderer', `Node labels created with showLabels: ${this.config.showLabels}`);

    // Update existing nodes with new sizing and hub classification
    nodeSelection.selectAll('circle')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('r', (d: any) => this.calculateNodeSize(d as GraphNode))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('class', (d: any) => `${(d as GraphNode).type}-node ${this.getHubClass(d as GraphNode)}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('data-connections', (d: any) => (d as GraphNode).connections.length)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('data-hub-tier', (d: any) => this.getHubTier(d as GraphNode).name);

    // Update existing title elements for tooltips
    nodeSelection.selectAll('title')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .text((d: any) => {
        const node = d as GraphNode;
        const fileName = node.title.split('/').pop() || node.title;
        const connections = node.connections.length;
        return `${fileName} (${connections} connection${connections !== 1 ? 's' : ''})`;
      });

    // Update existing labels positioning based on new node sizes
    nodeSelection.selectAll('text')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('dy', (d: any) => this.calculateNodeSize(d as GraphNode) + 15);

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
   * Enhanced with hub highlighting features
   */
  private setupNodeInteractions(selection: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>): void {
    selection
      .on('mouseover', (event, d) => {
        // Highlight connected links
        this.highlightConnectedLinks(d.id, true);
        
        // Hub highlighting: Add special hover effects for hubs
        const hubTier = this.getHubTier(d);
        const nodeElement = d3.select(event.currentTarget);
        
        // Add hover class for CSS styling
        nodeElement.classed('hub-hovered', true);
        
        // For major and mega hubs, temporarily boost their visual prominence
        if (hubTier.name === 'major-hub' || hubTier.name === 'mega-hub') {
          this.temporaryHubBoost(nodeElement, d);
        }
        
        // Enhanced tooltip for hubs
        if (d.connections.length >= 5) {
          this.showHubTooltip(d, event);
        }
      })
      .on('mouseout', (event, d) => {
        // Remove highlight from connected links
        this.highlightConnectedLinks(d.id, false);
        
        // Remove hover effects
        const nodeElement = d3.select(event.currentTarget);
        nodeElement.classed('hub-hovered', false);
        
        // Remove temporary boost
        this.removeHubBoost(nodeElement);
        
        // Hide hub tooltip
        this.hideHubTooltip();
      })
      .on('click', (_, d) => {
        // Enhanced logging for hubs
        const hubTier = this.getHubTier(d);
        logger.debug('renderer', `Node clicked: ${d.title}`, { 
          node: d, 
          connections: d.connections.length,
          hubTier: hubTier.name 
        });
      });
  }

  /**
   * Highlight links connected to a node
   */
  private highlightConnectedLinks(nodeId: string, highlight: boolean): void {
    this.linkGroup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    
    // Update cluster positions if clustering is enabled
    if (this.smartClustering && this.smartClusteringSettings?.enabled) {
      // Only update occasionally for performance
      if (Math.random() < 0.1) { // 10% of ticks
        this.smartClustering.recalculateClusterPositions();
        this.renderClusterVisualization();
      }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .style('display', (d: any) => {
        const hasValidCoords = this.hasValidCoordinates(d.source) && this.hasValidCoordinates(d.target);
        return hasValidCoords ? 'block' : 'none';
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((d: any) => this.hasValidCoordinates(d.source) && this.hasValidCoordinates(d.target))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x1', (d: any) => d.source.x)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('y1', (d: any) => d.source.y)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x2', (d: any) => d.target.x)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((d: any) => {
        // Only update positions for valid and visible links
        if (!this.hasValidCoordinates(d.source) || !this.hasValidCoordinates(d.target)) {
          return false;
        }

        const sourceVisible = this.isNodeInViewport(d.source, bounds);
        const targetVisible = this.isNodeInViewport(d.target, bounds);
        return sourceVisible || targetVisible;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x1', (d: any) => d.source.x)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('y1', (d: any) => d.source.y)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x2', (d: any) => d.target.x)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    
    // Update node radius - use dynamic sizing based on connections
    if (newConfig.nodeRadius !== undefined) {
      const nodeSelection = this.g.select('.sonigraph-temporal-nodes').selectAll('.sonigraph-temporal-node');
      if (!nodeSelection.empty()) {
        nodeSelection.selectAll('circle')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('r', (d: any) => this.calculateNodeSize(d as GraphNode));
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
      .force('collision', d3.forceCollide<GraphNode>()
        .radius((d: GraphNode) => {
          // Hub highlighting: Use actual node size plus padding for collision
          const nodeSize = this.calculateNodeSize(d);
          const padding = 2; // Small padding between nodes
          return nodeSize + padding;
        }))
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
   * Public method to set zoom transform (called by SonicGraphView)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setZoomTransform(transform: any): void {
    if (this.config.enableZoom && this.zoom) {
      this.svg.call(this.zoom.transform, transform);
      logger.info('zoom-set', `Zoom transform set externally: scale=${transform.k}, translate=(${transform.x}, ${transform.y})`);
    }
  }

  /**
   * Get current zoom level for adaptive detail levels
   */
  getCurrentZoom(): number {
    if (!this.config.enableZoom || !this.zoom || !this.svg) {
      return 1.0; // Default zoom level
    }
    
    try {
      const transform = d3.zoomTransform(this.svg.node() as Element);
      return transform.k;
    } catch (error) {
      logger.warn('zoom-get', 'Failed to get current zoom transform', { error });
      return 1.0; // Fallback
    }
  }

  /**
   * Set callback for zoom level changes (for adaptive detail levels)
   */
  setOnZoomChangeCallback(callback: ((zoomLevel: number) => void) | null): void {
    this.onZoomChangeCallback = callback;
    logger.debug('zoom-callback', 'Zoom change callback set', { hasCallback: !!callback });
  }

  // Tooltip methods removed - using native browser tooltips for better performance

  /**
   * Generate consistent link ID for D3.js data binding
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * Update Content-Aware Positioning settings
   */
  updateContentAwareSettings(settings: SonicGraphSettings['contentAwarePositioning']): void {
    logger.debug('content-aware-settings', 'Updating content-aware positioning settings', settings);
    
    this.contentAwareSettings = settings;
    
    // Update ContentAwarePositioning instance if it exists
    if (this.contentAwarePositioning) {
      this.contentAwarePositioning.updateSettings(settings);
    }
    
    // Re-apply forces if simulation exists and content-aware positioning is enabled
    if (this.simulation && settings.enabled) {
      this.applyContentAwareForces();
      this.simulation.alpha(0.3).restart(); // Gentle restart to apply changes
    }
    
    logger.debug('content-aware-settings', 'Content-aware positioning settings applied', settings);
  }

  /**
   * Update Smart Clustering settings
   */
  updateSmartClusteringSettings(settings: SonicGraphSettings['smartClustering']): void {
    logger.debug('smart-clustering-settings', 'Updating smart clustering settings', settings);
    
    this.smartClusteringSettings = settings;
    
    // Update SmartClustering instance if it exists - convert to flat structure
    if (this.smartClustering) {
      const flatSettings = {
        enabled: settings.enabled,
        algorithm: settings.algorithm,
        weights: settings.weights,
        minClusterSize: settings.clustering.minClusterSize,
        maxClusters: settings.clustering.maxClusters,
        resolution: settings.clustering.resolution,
        enableVisualization: settings.visualization.enableVisualization,
        respectExistingGroups: settings.integration.respectExistingGroups,
        debugMode: settings.debugging.debugMode
      };
      this.smartClustering.updateSettings(flatSettings);
    }
    
    // Re-apply clustering if simulation exists and clustering is enabled
    if (this.simulation && settings.enabled && this.nodes.length > 0) {
      this.applySmartClustering(); // Async call, no need to await here
    } else if (!settings.enabled) {
      this.clearClusterVisualization();
    }
    
    logger.debug('smart-clustering-settings', 'Smart clustering settings applied', settings);
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
   * Get adaptive alpha decay based on performance mode
   */
  private getAlphaDecay(): number {
    switch (this.performanceMode) {
      case 'quality': return 0.03; // Slower, smoother convergence
      case 'balanced': return 0.05; // Balanced convergence
      case 'performance': return 0.08; // Faster convergence
      default: return 0.05;
    }
  }

  /**
   * Get adaptive velocity decay based on performance mode
   */
  private getVelocityDecay(): number {
    switch (this.performanceMode) {
      case 'quality': return 0.4; // Lower decay for smoother motion
      case 'balanced': return 0.6; // Balanced decay
      case 'performance': return 0.8; // Higher decay for faster settling
      default: return 0.6;
    }
  }

  /**
   * Get adaptive alpha minimum based on performance mode
   */
  private getAlphaMin(): number {
    switch (this.performanceMode) {
      case 'quality': return 0.005; // Run longer for better quality
      case 'balanced': return 0.01; // Balanced stopping point
      case 'performance': return 0.02; // Stop earlier for performance
      default: return 0.01;
    }
  }

  /**
   * Get jitter strength based on performance mode
   */
  private getJitterStrength(): number {
    switch (this.performanceMode) {
      case 'quality': return 0.03; // Full jitter for organic movement
      case 'balanced': return 0.02; // Reduced jitter
      case 'performance': return 0; // No jitter for performance
      default: return 0.02;
    }
  }

  /**
   * Get jitter threshold based on performance mode
   */
  private getJitterThreshold(): number {
    switch (this.performanceMode) {
      case 'quality': return 0.03; // Apply jitter longer
      case 'balanced': return 0.05; // Balanced threshold
      case 'performance': return 0.1; // Stop jitter early
      default: return 0.05;
    }
  }

  /**
   * Detect optimal performance mode based on graph complexity
   */
  private detectPerformanceMode(nodeCount: number, linkCount: number): void {
    // Calculate graph complexity score
    const complexityScore = nodeCount + (linkCount * 0.5);
    const linkDensity = nodeCount > 0 ? linkCount / nodeCount : 0;
    
    if (nodeCount <= 50 && complexityScore <= 100) {
      this.performanceMode = 'quality';
      this.updateDebounceMs = 16; // 60fps
      this.maxFrameSkip = 0;
    } else if (nodeCount <= 200 && complexityScore <= 400) {
      this.performanceMode = 'balanced';
      this.updateDebounceMs = 33; // 30fps
      this.maxFrameSkip = 1;
    } else {
      this.performanceMode = 'performance';
      this.updateDebounceMs = 50; // 20fps
      this.maxFrameSkip = 2;
    }
    
    logger.info('performance-mode', `Performance mode detected: ${this.performanceMode}`, {
      nodeCount,
      linkCount,
      complexityScore: complexityScore.toFixed(1),
      linkDensity: linkDensity.toFixed(2),
      targetFPS: Math.round(1000 / this.updateDebounceMs),
      frameSkip: this.maxFrameSkip
    });
  }

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
      ?.radius((d: GraphNode) => {
        // Hub highlighting: Use actual node size plus padding for collision
        const nodeSize = this.calculateNodeSize(d);
        const padding = 2; // Small padding between nodes
        return nodeSize + padding;
      });
    
    // Update link force
    (this.simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)
      ?.distance((d: GraphLink) => {
        return d.strength > 0.7 ? this.forceConfig.strongLinkDistance : this.forceConfig.weakLinkDistance;
      })
      ?.strength((d: GraphLink) => d.strength * this.forceConfig.linkStrength * 1.5);
    
    logger.debug('adaptive-scaling', 'Updated simulation forces with new parameters');
  }

  /**
   * Apply Content-Aware Positioning forces to the simulation
   */
  private applyContentAwareForces(): void {
    if (!this.contentAwarePositioning || !this.contentAwareSettings?.enabled) {
      return;
    }
    
    logger.debug('content-aware', 'Applying content-aware positioning forces', {
      hasPositioning: !!this.contentAwarePositioning,
      enabled: this.contentAwareSettings?.enabled,
      nodeCount: this.nodes.length,
      linkCount: this.links.length
    });
    
    // Set graph data for positioning calculations
    this.contentAwarePositioning.setGraphData(
      this.nodes, 
      this.links, 
      this.config.width, 
      this.config.height
    );
    
    // Apply content-aware forces to the simulation
    this.contentAwarePositioning.applyForcesToSimulation(this.simulation);
    
    // Update debug visualization if enabled
    this.updateDebugVisualization();
  }

  /**
   * Apply Smart Clustering and render cluster visualization
   */
  private async applySmartClustering(): Promise<void> {
    if (!this.smartClustering || !this.smartClusteringSettings?.enabled) {
      this.clearClusterVisualization();
      return;
    }
    
    logger.debug('smart-clustering', 'Applying smart clustering', {
      hasClustering: !!this.smartClustering,
      enabled: this.smartClusteringSettings?.enabled,
      algorithm: this.smartClusteringSettings?.algorithm,
      nodeCount: this.nodes.length,
      linkCount: this.links.length
    });
    
    try {
      // Run clustering algorithm
      this.clusteringResult = await this.smartClustering.clusterGraph(this.nodes, this.links);
      
      logger.debug('smart-clustering', 'Clustering completed', {
        clusterCount: this.clusteringResult.clusters.length,
        coverage: this.clusteringResult.coverage,
        modularity: this.clusteringResult.modularity,
        orphanNodes: this.clusteringResult.orphanNodes.length
      });
      
      // Render cluster visualization
      this.renderClusterVisualization();
      
    } catch (error) {
      logger.error('smart-clustering', 'Failed to apply smart clustering', (error as Error).message);
      this.clearClusterVisualization();
    }
  }

  /**
   * Update debug visualization elements based on content-aware positioning settings
   */
  private updateDebugVisualization(): void {
    if (!this.contentAwarePositioning || !this.contentAwareSettings?.debugVisualization) {
      this.clearDebugVisualization();
      return;
    }

    const debugData = this.contentAwarePositioning.getDebugVisualization();
    if (!debugData) {
      this.clearDebugVisualization();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tagConnections = (debugData.tagConnections as any) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const temporalZones = (debugData.temporalZones as any) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hubNodes = (debugData.hubNodes as any) || [];

    logger.debug('debug-viz', 'Updating debug visualization', {
      tagConnections: tagConnections.length || 0,
      temporalZones: temporalZones.length || 0,
      hubNodes: hubNodes.length || 0
    });

    // Create debug group if it doesn't exist
    let debugGroup = this.g.select('.debug-visualization');
    if (debugGroup.empty()) {
      debugGroup = this.g.append('g').attr('class', 'debug-visualization');
    }

    // Render temporal zones
    this.renderTemporalZones(debugGroup, temporalZones);

    // Render tag connections
    this.renderTagConnections(debugGroup, tagConnections);

    // Render hub indicators
    this.renderHubIndicators(debugGroup, hubNodes);
  }

  /**
   * Render temporal positioning zones
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderTemporalZones(debugGroup: any, zones: any[]): void {
    const zoneSelection = debugGroup.selectAll('.temporal-zone')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(zones, (d: any) => d.name);

    // Enter new zones
    const zoneEnter = zoneSelection.enter()
      .append('circle')
      .attr('class', 'temporal-zone')
      .attr('fill', 'none')
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 2);

    // Update existing zones
    zoneSelection.merge(zoneEnter)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('cx', (d: any) => d.centerX)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('cy', (d: any) => d.centerY)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('r', (d: any) => d.radius)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('stroke', (d: any) => {
        switch (d.name) {
          case 'recent': return '#4ade80'; // Green for recent
          case 'established': return '#3b82f6'; // Blue for established
          case 'archive': return '#6b7280'; // Gray for archive
          default: return '#9ca3af';
        }
      });

    // Remove old zones
    zoneSelection.exit().remove();

    // Add zone labels
    const labelSelection = debugGroup.selectAll('.temporal-zone-label')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(zones, (d: any) => d.name);

    const labelEnter = labelSelection.enter()
      .append('text')
      .attr('class', 'temporal-zone-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill-opacity', 0.7);

    labelSelection.merge(labelEnter)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x', (d: any) => d.centerX)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('y', (d: any) => d.centerY - d.radius + 20)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('fill', (d: any) => {
        switch (d.name) {
          case 'recent': return '#22c55e';
          case 'established': return '#2563eb';
          case 'archive': return '#4b5563';
          default: return '#6b7280';
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .text((d: any) => d.name.toUpperCase());

    labelSelection.exit().remove();
  }

  /**
   * Render tag connection links
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderTagConnections(debugGroup: any, connections: any[]): void {
    const connectionSelection = debugGroup.selectAll('.tag-connection')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(connections, (d: any) => `${d.sourceId}-${d.targetId}`);

    // Enter new connections
    const connectionEnter = connectionSelection.enter()
      .append('line')
      .attr('class', 'tag-connection')
      .attr('stroke', '#f59e0b') // Orange for tag connections
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '3,3');

    // Update existing connections
    connectionSelection.merge(connectionEnter)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('stroke-width', (d: any) => Math.max(1, d.strength * 4))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x1', (d: any) => {
        const sourceNode = this.nodes.find(n => n.id === d.sourceId);
        return sourceNode?.x || 0;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('y1', (d: any) => {
        const sourceNode = this.nodes.find(n => n.id === d.sourceId);
        return sourceNode?.y || 0;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x2', (d: any) => {
        const targetNode = this.nodes.find(n => n.id === d.targetId);
        return targetNode?.x || 0;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('y2', (d: any) => {
        const targetNode = this.nodes.find(n => n.id === d.targetId);
        return targetNode?.y || 0;
      });

    // Remove old connections
    connectionSelection.exit().remove();
  }

  /**
   * Render hub node indicators
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderHubIndicators(debugGroup: any, hubs: any[]): void {
    const hubSelection = debugGroup.selectAll('.hub-indicator')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(hubs, (d: any) => d.nodeId);

    // Enter new hub indicators
    const hubEnter = hubSelection.enter()
      .append('circle')
      .attr('class', 'hub-indicator')
      .attr('fill', 'none')
      .attr('stroke', '#ef4444') // Red for hub indicators
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 3);

    // Update existing hub indicators
    hubSelection.merge(hubEnter)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('cx', (d: any) => {
        const hubNode = this.nodes.find(n => n.id === d.nodeId);
        return hubNode?.x || 0;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('cy', (d: any) => {
        const hubNode = this.nodes.find(n => n.id === d.nodeId);
        return hubNode?.y || 0;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('r', (d: any) => 15 + (d.centralityScore * 10)); // Scale with centrality

    // Remove old hub indicators
    hubSelection.exit().remove();
  }

  /**
   * Clear all debug visualization elements
   */
  private clearDebugVisualization(): void {
    const debugGroup = this.g.select('.debug-visualization');
    if (!debugGroup.empty()) {
      debugGroup.remove();
    }
  }

  /**
   * Render cluster visualization with boundaries, colors, and labels
   */
  private renderClusterVisualization(): void {
    if (!this.clusteringResult || !this.smartClusteringSettings?.visualization.enableVisualization) {
      this.clearClusterVisualization();
      return;
    }

    logger.debug('cluster-viz', 'Rendering cluster visualization', {
      clusterCount: this.clusteringResult.clusters.length,
      showLabels: this.smartClusteringSettings.visualization.showClusterLabels,
      boundaryStyle: this.smartClusteringSettings.visualization.clusterBoundaries
    });

    // Create cluster group if it doesn't exist
    if (!this.clusterGroup) {
      // Insert cluster group AFTER nodes so it renders on top
      this.clusterGroup = this.g.append('g')
        .attr('class', 'cluster-visualization');
    }

    // Render cluster boundaries
    this.renderClusterBoundaries();
    
    // Render cluster labels if enabled
    if (this.smartClusteringSettings.visualization.showClusterLabels) {
      this.renderClusterLabels();
    }
  }

  /**
   * Render cluster boundaries (circles or convex hulls)
   */
  private renderClusterBoundaries(): void {
    if (!this.clusterGroup || !this.clusteringResult) return;

    const boundarySelection = this.clusterGroup.selectAll('.cluster-boundary')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(this.clusteringResult.clusters, (d: any) => d.id);

    // Remove old boundaries
    boundarySelection.exit().remove();

    // Enter new boundaries
    const boundaryEnter = boundarySelection.enter()
      .append('circle')
      .attr('class', 'cluster-boundary')
      .attr('fill', 'none');

    // Update all boundaries (merge enter and update)
    const boundaryUpdate = boundarySelection.merge(boundaryEnter);

    // Apply boundary style and type based on settings
    const boundaryStyle = this.smartClusteringSettings?.visualization.clusterBoundaries || 'subtle';

    boundaryUpdate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('cx', (d: any) => d.centroid.x)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('cy', (d: any) => d.centroid.y)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('r', (d: any) => d.radius) // Use calculated radius without artificial minimum
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('stroke', (d: any) => d.color)
      .attr('data-style', boundaryStyle)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('data-type', (d: any) => d.type);
  }

  /**
   * Render cluster labels
   */
  private renderClusterLabels(): void {
    if (!this.clusterGroup || !this.clusteringResult) return;

    const labelSelection = this.clusterGroup.selectAll('.cluster-label')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(this.clusteringResult.clusters, (d: any) => d.id);

    // Remove old labels
    labelSelection.exit().remove();

    // Enter new labels
    const labelEnter = labelSelection.enter()
      .append('text')
      .attr('class', 'cluster-label');

    // Update all labels (merge enter and update)
    const labelUpdate = labelSelection.merge(labelEnter);

    labelUpdate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('x', (d: any) => d.centroid.x)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('y', (d: any) => d.centroid.y - d.radius + 15) // Position above cluster
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('data-type', (d: any) => d.type)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .text((d: any) => d.label || `Cluster ${d.nodes.length}`);
  }

  /**
   * Clear cluster visualization elements
   */
  private clearClusterVisualization(): void {
    if (this.clusterGroup) {
      this.clusterGroup.remove();
      this.clusterGroup = null;
    }
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
    
    // Apply Content-Aware Positioning forces if enabled
    this.applyContentAwareForces();
    
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Move this CSS to component stylesheet
    // .dense-graph-mode .sonigraph-temporal-svg * {
    //   transition: none !important;
    //   animation: none !important;
    // }

    logger.debug('performance', 'Dense graph mode enabled (CSS in stylesheet)');
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * Highlight a node with glow effect for visual note display
   * @param nodeId The ID of the node to highlight
   * @param layer The audio layer (for color coding)
   * @param duration How long to show the highlight (ms)
   */
  highlightNode(nodeId: string, layer: string, duration: number = 300): void {
    if (!this.svg) return;

    // Find the node element
    const nodeElement = this.svg.select(`circle[data-id="${nodeId}"]`);
    if (nodeElement.empty()) return;

    // Layer colors from visual-note-display spec
    const layerColors: Record<string, string> = {
      'rhythmic': '#FF6B35',
      'harmonic': '#4ECDC4',
      'melodic': '#A78BFA',
      'ambient': '#10B981',
      'percussion': '#EF4444'
    };

    const color = layerColors[layer] || '#888888';

    // Add active class for CSS animations
    nodeElement.classed('note-active', true);
    nodeElement.classed(`note-active-${layer}`, true);

    // Apply glow effect
    nodeElement
      .transition()
      .duration(50)
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .style('filter', `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})`)
      .transition()
      .duration(duration)
      .attr('stroke-width', 1.5)
      .style('filter', null)
      .on('end', () => {
        nodeElement.classed('note-active', false);
        nodeElement.classed(`note-active-${layer}`, false);
      });
  }

  /**
   * Clear all node highlights
   */
  clearHighlights(): void {
    if (!this.svg) return;

    this.svg.selectAll('circle')
      .classed('note-active', false)
      .classed('note-active-rhythmic', false)
      .classed('note-active-harmonic', false)
      .classed('note-active-melodic', false)
      .classed('note-active-ambient', false)
      .classed('note-active-percussion', false)
      .attr('stroke-width', 1.5)
      .style('filter', null);
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

    // Stop and clean up simulation
    this.simulation.stop();
    this.simulation.nodes([]);

    // Clear data arrays to release memory
    this.nodes = [];
    this.links = [];

    // No tooltip cleanup needed - using native browser tooltips

    // Remove all DOM elements
    d3.select(this.container).selectAll('*').remove();

    logger.debug('renderer', 'GraphRenderer destroyed and memory released');
  }
} 