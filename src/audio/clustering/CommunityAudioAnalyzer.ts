/**
 * CommunityAudioAnalyzer - Phase 5.3: Community Detection Audio
 *
 * Integrates with Louvain community detection to analyze community structures
 * and generate community-specific audio themes based on community characteristics
 */

import { getLogger } from '../../logging';
import { SmartClusteringAlgorithms, Cluster } from '../../graph/SmartClusteringAlgorithms';
import { GraphNode, GraphLink } from '../../graph/GraphDataExtractor';
import {
  Community,
  CommunityType,
  CommunityAudioTheme,
  CommunityCharacteristics,
  CommunityDetectionSettings
} from './types';
import { CommunityThemeGenerator } from './CommunityThemeGenerator';

const logger = getLogger('community-audio');

/**
 * Analyzes community structures and generates audio themes
 */
export class CommunityAudioAnalyzer {
  private themeGenerator: CommunityThemeGenerator;
  private settings: CommunityDetectionSettings;
  private clusteringAlgorithms: SmartClusteringAlgorithms;
  private isInitialized = false;

  // Community tracking
  private detectedCommunities: Map<string, Community> = new Map();
  private communityThemes: Map<string, CommunityAudioTheme> = new Map();

  constructor(
    settings: CommunityDetectionSettings,
    clusteringAlgorithms: SmartClusteringAlgorithms
  ) {
    void logger.debug('initialization', 'CommunityAudioAnalyzer created');

    this.settings = { ...settings };
    this.clusteringAlgorithms = clusteringAlgorithms;
    this.themeGenerator = new CommunityThemeGenerator();
  }

  /**
   * Initialize the community audio analyzer
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      void logger.debug('initialization', 'Initializing community audio analyzer');

      // Initialize theme generator
      await this.themeGenerator.initialize();

      this.isInitialized = true;
      void logger.debug('initialization', 'Community audio analyzer initialized');
    } catch (error) {
      logger.error('initialization', 'Failed to initialize community audio analyzer', { error });
      throw error;
    }
  }

  /**
   * Detect communities from graph data using Louvain algorithm
   */
  public detectCommunities(
    nodes: GraphNode[],
    links: GraphLink[]
  ): Community[] {
    if (!this.isInitialized || !this.settings.enabled) {
      return [];
    }

    logger.debug('detection', 'Detecting communities from graph data', {
      nodeCount: nodes.length,
      linkCount: links.length
    });

    try {
      // Use SmartClusteringAlgorithms' Louvain implementation
      const clusteringResult = this.clusteringAlgorithms.clusterGraph(nodes, links);

      // Filter for community-type clusters
      const communityClusters = clusteringResult.clusters.filter(
        cluster => cluster.type === 'community'
      );

      // Convert clusters to communities with enhanced analysis
      const communities = communityClusters.map(cluster =>
        this.clusterToCommunity(cluster, nodes, links)
      );

      // Update community tracking
      void this.updateCommunityTracking(communities);

      logger.debug('detection', 'Communities detected', {
        communityCount: communities.length,
        types: communities.map(c => c.type)
      });

      return communities;
    } catch (error) {
      logger.error('detection', 'Error detecting communities', { error });
      return [];
    }
  }

  /**
   * Convert a cluster to a community with enhanced characteristics
   */
  private clusterToCommunity(
    cluster: Cluster,
    nodes: GraphNode[],
    links: GraphLink[]
  ): Community {
    const characteristics = this.analyzeCommunityCharacteristics(cluster, nodes, links);
    const type = this.determineCommunityType(characteristics);

    const community: Community = {
      id: cluster.id,
      nodes: cluster.nodes,
      type,
      characteristics,
      strength: cluster.strength,
      centroid: cluster.centroid,
      radius: cluster.radius,
      label: this.generateCommunityLabel(cluster, type),
      hierarchyLevel: 0, // Will be computed if hierarchy analysis is enabled
      parentCommunityId: undefined,
      subCommunities: []
    };

    return community;
  }

  /**
   * Analyze community characteristics to determine audio mapping
   */
  private analyzeCommunityCharacteristics(
    cluster: Cluster,
    nodes: GraphNode[],
    links: GraphLink[]
  ): CommunityCharacteristics {
    const nodeIds = new Set(cluster.nodes.map(n => n.id));

    // Calculate internal and external connections
    let internalConnections = 0;
    let externalConnections = 0;
    let totalConnectionStrength = 0;

    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const strength = link.strength || 1;

      const sourceInCommunity = nodeIds.has(sourceId);
      const targetInCommunity = nodeIds.has(targetId);

      if (sourceInCommunity && targetInCommunity) {
        internalConnections++;
        totalConnectionStrength += strength;
      } else if (sourceInCommunity || targetInCommunity) {
        externalConnections++;
      }
    });

    // Calculate density
    const maxPossibleConnections = cluster.nodes.length * (cluster.nodes.length - 1) / 2;
    const density = maxPossibleConnections > 0
      ? internalConnections / maxPossibleConnections
      : 0;

    // Determine if it's a bridge community
    const isBridge = externalConnections > internalConnections;

    // Calculate average connection strength
    const averageConnectionStrength = internalConnections > 0
      ? totalConnectionStrength / internalConnections
      : 0;

    // Analyze temporal stability (variance in creation dates)
    const creationDates = cluster.nodes.map(n => n.creationDate.getTime());
    const avgCreationTime = creationDates.reduce((sum, time) => sum + time, 0) / creationDates.length;
    const variance = creationDates.reduce((sum, time) => sum + Math.pow(time - avgCreationTime, 2), 0) / creationDates.length;
    const stability = 1 / (1 + Math.sqrt(variance) / (30 * 24 * 60 * 60 * 1000)); // Normalize by 30 days

    return {
      size: cluster.nodes.length,
      density,
      stability,
      connectionStrength: averageConnectionStrength,
      isBridge,
      isIsolated: externalConnections === 0 && cluster.nodes.length < 5,
      internalConnections,
      externalConnections,
      cohesion: cluster.strength
    };
  }

  /**
   * Determine community type based on characteristics
   */
  private determineCommunityType(characteristics: CommunityCharacteristics): CommunityType {
    // Large stable communities
    if (characteristics.size >= this.settings.largeCommunitySizeThreshold &&
        characteristics.stability > 0.7) {
      return 'large-stable';
    }

    // Small dynamic communities
    if (characteristics.size < this.settings.largeCommunitySizeThreshold &&
        characteristics.stability < 0.5) {
      return 'small-dynamic';
    }

    // Bridge communities
    if (characteristics.isBridge) {
      return 'bridge';
    }

    // Isolated communities
    if (characteristics.isIsolated) {
      return 'isolated';
    }

    // Hierarchical communities (to be refined with hierarchy analysis)
    if (characteristics.density > 0.6 &&
        characteristics.size >= this.settings.largeCommunitySizeThreshold / 2) {
      return 'hierarchical';
    }

    // Default to hierarchical if no clear pattern
    return 'hierarchical';
  }

  /**
   * Generate community label based on type and characteristics
   */
  private generateCommunityLabel(cluster: Cluster, type: CommunityType): string {
    const size = cluster.nodes.length;

    switch (type) {
      case 'large-stable':
        return `Core Community (${size} nodes)`;
      case 'small-dynamic':
        return `Dynamic Group (${size} nodes)`;
      case 'bridge':
        return `Bridge Community (${size} nodes)`;
      case 'isolated':
        return `Isolated Cluster (${size} nodes)`;
      case 'hierarchical':
        return `Organized Community (${size} nodes)`;
      default:
        return `Community (${size} nodes)`;
    }
  }

  /**
   * Generate audio theme for a community
   */
  public generateCommunityTheme(community: Community): CommunityAudioTheme {
    if (!this.isInitialized) {
      throw new Error('CommunityAudioAnalyzer not initialized');
    }

    logger.debug('theme-generation', 'Generating audio theme for community', {
      communityId: community.id,
      type: community.type,
      size: community.characteristics.size
    });

    try {
      const theme = this.themeGenerator.generateThemeForCommunity(community);
      this.communityThemes.set(community.id, theme);

      logger.debug('theme-generation', 'Community theme generated', {
        communityId: community.id,
        themeId: theme.id
      });

      return theme;
    } catch (error) {
      logger.error('theme-generation', 'Error generating community theme', {
        communityId: community.id,
        error
      });
      throw error;
    }
  }

  /**
   * Update community tracking for evolution detection
   */
  private updateCommunityTracking(communities: Community[]): void {
    // Clear old communities
    this.detectedCommunities.clear();

    // Store new communities
    communities.forEach(community => {
      this.detectedCommunities.set(community.id, community);
    });
  }

  /**
   * Analyze community hierarchy (for hierarchical communities)
   */
  public analyzeCommunityHierarchy(communities: Community[]): Community[] {
    if (!this.settings.hierarchyAnalysis) {
      return communities;
    }

    logger.debug('hierarchy', 'Analyzing community hierarchy', {
      communityCount: communities.length
    });

    // Sort communities by size (largest first)
    const sortedCommunities = [...communities].sort((a, b) =>
      b.characteristics.size - a.characteristics.size
    );

    // Assign hierarchy levels based on containment and connectivity
    for (let i = 0; i < sortedCommunities.length; i++) {
      const parentCommunity = sortedCommunities[i];

      for (let j = i + 1; j < sortedCommunities.length; j++) {
        const childCommunity = sortedCommunities[j];

        // Check if child is contained within parent
        const containmentRatio = this.calculateContainment(parentCommunity, childCommunity);

        if (containmentRatio > this.settings.hierarchyContainmentThreshold) {
          // Establish parent-child relationship
          childCommunity.parentCommunityId = parentCommunity.id;
          childCommunity.hierarchyLevel = parentCommunity.hierarchyLevel + 1;
          parentCommunity.subCommunities.push(childCommunity.id);

          logger.debug('hierarchy', 'Hierarchy relationship detected', {
            parent: parentCommunity.id,
            child: childCommunity.id,
            containmentRatio
          });
        }
      }
    }

    return communities;
  }

  /**
   * Calculate containment ratio between two communities
   */
  private calculateContainment(parent: Community, child: Community): number {
    const parentNodeIds = new Set(parent.nodes.map(n => n.id));
    const childNodeIds = new Set(child.nodes.map(n => n.id));

    let containedNodes = 0;
    childNodeIds.forEach(nodeId => {
      if (parentNodeIds.has(nodeId)) {
        containedNodes++;
      }
    });

    return containedNodes / child.nodes.length;
  }

  /**
   * Get detected communities
   */
  public getDetectedCommunities(): Community[] {
    return Array.from(this.detectedCommunities.values());
  }

  /**
   * Get community theme by ID
   */
  public getCommunityTheme(communityId: string): CommunityAudioTheme | undefined {
    return this.communityThemes.get(communityId);
  }

  /**
   * Get all community themes
   */
  public getAllCommunityThemes(): Map<string, CommunityAudioTheme> {
    return new Map(this.communityThemes);
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: CommunityDetectionSettings): void {
    void logger.debug('settings', 'Updating community detection settings');
    this.settings = { ...newSettings };

    // Update theme generator settings if needed
    this.themeGenerator.updateThemeIntensity(newSettings.themeIntensity);
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      communityCount: this.detectedCommunities.size,
      themeCount: this.communityThemes.size,
      settings: this.settings,
      communities: Array.from(this.detectedCommunities.values()).map(c => ({
        id: c.id,
        type: c.type,
        size: c.characteristics.size,
        density: c.characteristics.density,
        stability: c.characteristics.stability
      }))
    };
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    void logger.debug('shutdown', 'Disposing community audio analyzer');

    this.detectedCommunities.clear();
    this.communityThemes.clear();
    this.themeGenerator.dispose();
    this.isInitialized = false;
  }
}