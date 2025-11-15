import { GraphNode, GraphLink } from './GraphDataExtractor';
import { SonicGraphSettings } from '../utils/constants';
import { getLogger } from '../logging';
import * as d3 from 'd3';

const logger = getLogger('ContentAwarePositioning');

export interface TagConnection {
  sourceId: string;
  targetId: string;
  sharedTags: string[];
  strength: number; // 0-1, based on tag overlap
}

export interface TemporalZone {
  name: string;
  centerX: number;
  centerY: number;
  radius: number;
  ageThresholdDays: number;
}

export interface HubNode {
  nodeId: string;
  connections: number;
  centralityScore: number;
}

/**
 * ContentAwarePositioning - Semantic layout forces for graph positioning
 * 
 * Adds intelligent forces to D3.js simulations based on:
 * - Tag relationships: Files with shared tags attract each other
 * - Temporal positioning: Recent files gravitate toward active zones
 * - Hub centrality: Highly connected nodes pull toward center
 */
export class ContentAwarePositioning {
  private settings: SonicGraphSettings['contentAwarePositioning'];
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private tagConnections: TagConnection[] = [];
  private temporalZones: TemporalZone[] = [];
  private hubNodes: HubNode[] = [];
  
  // Graph dimensions for positioning calculations
  private width: number = 800;
  private height: number = 600;

  constructor(settings: SonicGraphSettings['contentAwarePositioning']) {
    this.settings = settings;
    
    logger.debug('content-aware', 'ContentAwarePositioning initialized', {
      enabled: settings.enabled,
      tagWeight: settings.tagInfluence.weight,
      temporalWeight: settings.temporalPositioning.weight,
      hubWeight: settings.hubCentrality.weight
    });
  }

  /**
   * Update settings from plugin settings or modal changes
   */
  updateSettings(newSettings: SonicGraphSettings['contentAwarePositioning']): void {
    this.settings = newSettings;
    
    logger.debug('content-aware', 'Settings updated', {
      enabled: this.settings.enabled,
      tagStrength: this.settings.tagInfluence.strength,
      debugVisualization: this.settings.debugVisualization
    });
  }

  /**
   * Update graph data and dimensions
   */
  setGraphData(nodes: GraphNode[], links: GraphLink[], width: number, height: number): void {
    this.nodes = nodes;
    this.links = links;
    this.width = width;
    this.height = height;
    
    // Analyze data for semantic relationships
    void this.analyzeTagConnections();
    void this.setupTemporalZones();
    void this.identifyHubNodes();
    
    logger.debug('content-aware', 'Graph data updated', {
      nodeCount: nodes.length,
      linkCount: links.length,
      tagConnections: this.tagConnections.length,
      hubNodes: this.hubNodes.length
    });
  }

  /**
   * Apply content-aware forces to D3.js simulation
   */
  applyForcesToSimulation(simulation: d3.Simulation<GraphNode, GraphLink>): void {
    if (!this.settings.enabled) {
      return;
    }

    // Add tag-based attraction force
    if (this.settings.tagInfluence.weight > 0) {
      void this.addTagAttractionForce(simulation);
    }

    // Add temporal positioning force
    if (this.settings.temporalPositioning.enabled && this.settings.temporalPositioning.weight > 0) {
      void this.addTemporalPositioningForce(simulation);
    }

    // Add hub centrality force
    if (this.settings.hubCentrality.enabled && this.settings.hubCentrality.weight > 0) {
      void this.addHubCentralityForce(simulation);
    }

    logger.debug('content-aware', 'Forces applied to simulation', {
      tagForceActive: this.settings.tagInfluence.weight > 0,
      temporalForceActive: this.settings.temporalPositioning.enabled,
      hubForceActive: this.settings.hubCentrality.enabled
    });
  }

  /**
   * Analyze tag relationships between nodes
   */
  private analyzeTagConnections(): void {
    this.tagConnections = [];
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];
        
        const tagsA = nodeA.metadata?.tags || [];
        const tagsB = nodeB.metadata?.tags || [];
        
        if (tagsA.length > 0 && tagsB.length > 0) {
          const sharedTags = tagsA.filter(tag => tagsB.includes(tag));
          
          if (sharedTags.length > 0) {
            // Calculate strength based on tag overlap ratio
            const totalUniqueTags = new Set([...tagsA, ...tagsB]).size;
            const strength = sharedTags.length / totalUniqueTags;
            
            this.tagConnections.push({
              sourceId: nodeA.id,
              targetId: nodeB.id,
              sharedTags,
              strength
            });
          }
        }
      }
    }
  }

  /**
   * Setup temporal zones for time-based positioning
   */
  private setupTemporalZones(): void {
    this.temporalZones = [
      {
        name: 'recent',
        centerX: this.width * 0.3,
        centerY: this.height * 0.3,
        radius: this.width * 0.2,
        ageThresholdDays: this.settings.temporalPositioning.recentThresholdDays
      },
      {
        name: 'established',
        centerX: this.width * 0.7,
        centerY: this.height * 0.5,
        radius: this.width * 0.3,
        ageThresholdDays: this.settings.temporalPositioning.recentThresholdDays * 3
      },
      {
        name: 'archive',
        centerX: this.width * 0.5,
        centerY: this.height * 0.8,
        radius: this.width * 0.4,
        ageThresholdDays: Infinity
      }
    ];
  }

  /**
   * Identify hub nodes based on connection count
   */
  private identifyHubNodes(): void {
    this.hubNodes = this.nodes
      .filter(node => node.connections.length >= this.settings.hubCentrality.minimumConnections)
      .map(node => ({
        nodeId: node.id,
        connections: node.connections.length,
        centralityScore: node.connections.length / Math.max(...this.nodes.map(n => n.connections.length))
      }))
      .sort((a, b) => b.connections - a.connections);
  }

  /**
   * Add tag-based attraction force to simulation
   */
  private addTagAttractionForce(simulation: d3.Simulation<GraphNode, GraphLink>): void {
    const strengthMultiplier = this.getTagStrengthMultiplier();
    
    // Create virtual links for tag connections with custom strength property
    interface TagLink extends d3.SimulationLinkDatum<GraphNode> {
      strength: number;
    }
    
    const tagLinks: TagLink[] = this.tagConnections.map(connection => ({
      source: connection.sourceId,
      target: connection.targetId,
      strength: connection.strength * strengthMultiplier
    }));

    if (tagLinks.length > 0) {
      simulation.force('tagAttraction', d3.forceLink(tagLinks)
        .strength(d => (d).strength * this.settings.tagInfluence.weight)
        .distance(50) // Closer than default links
      );
    }
  }

  /**
   * Add temporal positioning force to simulation
   */
  private addTemporalPositioningForce(simulation: d3.Simulation<GraphNode, GraphLink>): void {
    simulation.force('temporalPositioning', () => {
      this.nodes.forEach(node => {
        const ageInDays = this.getNodeAgeInDays(node);
        const targetZone = this.getTemporalZoneForAge(ageInDays);
        
        if (targetZone && node.x !== undefined && node.y !== undefined) {
          const dx = targetZone.centerX - node.x;
          const dy = targetZone.centerY - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = this.settings.temporalPositioning.weight * 0.01;
            node.vx = (node.vx || 0) + (dx / distance) * force;
            node.vy = (node.vy || 0) + (dy / distance) * force;
          }
        }
      });
    });
  }

  /**
   * Add hub centrality force to simulation
   */
  private addHubCentralityForce(simulation: d3.Simulation<GraphNode, GraphLink>): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    simulation.force('hubCentrality', () => {
      this.hubNodes.forEach(hub => {
        const node = this.nodes.find(n => n.id === hub.nodeId);
        
        if (node && node.x !== undefined && node.y !== undefined) {
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = this.settings.hubCentrality.weight * hub.centralityScore * 0.02;
            node.vx = (node.vx || 0) + (dx / distance) * force;
            node.vy = (node.vy || 0) + (dy / distance) * force;
          }
        }
      });
    });
  }

  /**
   * Get strength multiplier based on tag influence setting
   */
  private getTagStrengthMultiplier(): number {
    switch (this.settings.tagInfluence.strength) {
      case 'subtle': return 0.5;
      case 'moderate': return 1.0;
      case 'strong': return 1.5;
      default: return 1.0;
    }
  }

  /**
   * Calculate node age in days
   */
  private getNodeAgeInDays(node: GraphNode): number {
    const now = new Date();
    const creationDate = node.creationDate;
    const diffTime = Math.abs(now.getTime() - creationDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get appropriate temporal zone for node age
   */
  private getTemporalZoneForAge(ageInDays: number): TemporalZone | null {
    return this.temporalZones.find(zone => ageInDays <= zone.ageThresholdDays) || null;
  }

  /**
   * Get debug visualization data
   */
  getDebugVisualization(): Record<string, unknown> | null {
    if (!this.settings.debugVisualization) {
      return null;
    }

    return {
      tagConnections: this.tagConnections,
      temporalZones: this.temporalZones,
      hubNodes: this.hubNodes,
      activeForces: {
        tagAttraction: this.settings.tagInfluence.weight > 0,
        temporalPositioning: this.settings.temporalPositioning.enabled,
        hubCentrality: this.settings.hubCentrality.enabled
      }
    };
  }
}