/**
 * Phase 5.2: Hub Orchestration Manager
 *
 * Uses hub nodes as "conductors" to drive dynamic orchestration decisions.
 * Hubs get prominent lead instruments while peripheral nodes provide accompaniment.
 */

import { GraphNode, GraphLink } from '../../graph/GraphDataExtractor';
import { Cluster, ClusterType } from '../../graph/SmartClusteringAlgorithms';
import { getLogger } from '../../logging';
import { HubCentralityAnalyzer } from './HubCentralityAnalyzer';
import {
  HubMetrics,
  HubOrchestrationSettings,
  OrchestrationDecisions,
  OrchestrationMode,
  HubRoleAssignment,
  HubProminenceTier,
  DistanceScaling,
  ClusterHubAnalysis
} from './types';

const logger = getLogger('hub-orchestration');

export class HubOrchestrationManager {
  private centralityAnalyzer: HubCentralityAnalyzer;
  private settings: HubOrchestrationSettings;
  private hubMetrics: Map<string, HubMetrics> = new Map();

  // Instrument pools by role
  private readonly CONDUCTOR_INSTRUMENTS = ['piano', 'trumpet', 'lead-synth', 'violin'];
  private readonly LEAD_INSTRUMENTS = ['electric-piano', 'french-horn', 'cello', 'flute'];
  private readonly HARMONY_INSTRUMENTS = ['strings', 'pad-synth', 'vibraphone', 'clarinet'];
  private readonly ACCOMPANIMENT_INSTRUMENTS = ['guitar', 'bass', 'marimba', 'harp'];
  private readonly AMBIENT_INSTRUMENTS = ['choir', 'celesta', 'ambient-synth', 'vocal-pad'];

  constructor(settings: HubOrchestrationSettings) {
    this.settings = { ...settings };
    this.centralityAnalyzer = new HubCentralityAnalyzer(
      settings.centralityWeights,
      settings.hubThreshold
    );
  }

  /**
   * Orchestrate a cluster using hub node as conductor
   */
  public orchestrateClusterFromHub(
    cluster: Cluster,
    nodes: GraphNode[],
    links: GraphLink[]
  ): OrchestrationDecisions {
    logger.debug('orchestration-start', 'Orchestrating cluster', {
      clusterId: cluster.id,
      clusterType: cluster.type,
      nodeCount: cluster.nodes.length
    });

    // Calculate hub metrics if not cached
    if (this.hubMetrics.size === 0) {
      this.hubMetrics = this.centralityAnalyzer.calculateHubMetrics(nodes, links);
    }

    // Identify primary hub in cluster
    const clusterHubAnalysis = this.analyzeClusterHubs(cluster);
    const primaryHub = clusterHubAnalysis.primaryHub;

    if (!primaryHub) {
      logger.debug('no-hub', 'No hub found in cluster, using democratic orchestration', {
        clusterId: cluster.id
      });
      return this.createDemocraticOrchestration(cluster);
    }

    const hubMetrics = this.hubMetrics.get(primaryHub.id)!;

    // Calculate role assignments for all nodes in cluster
    const roleAssignments = this.assignRoles(cluster, primaryHub, hubMetrics);

    // Create orchestration decisions
    const decisions: OrchestrationDecisions = {
      clusterId: cluster.id,
      hubNodeId: primaryHub.id,
      leadInstrument: roleAssignments.get(primaryHub.id)?.instrument || 'piano',
      accompanyingInstruments: Array.from(roleAssignments.values())
        .filter(r => r.nodeId !== primaryHub.id)
        .map(r => r.instrument),
      harmonyComplexity: this.calculateHarmonyComplexity(hubMetrics.compositeScore, cluster.type),
      volumeDistribution: this.calculateVolumeDistribution(roleAssignments),
      spatialPositioning: this.calculateSpatialPositioning(cluster, primaryHub, roleAssignments),
      hubDistances: this.calculateHubDistances(cluster, primaryHub, links)
    };

    logger.debug('orchestration-complete', 'Cluster orchestration completed', {
      clusterId: cluster.id,
      hubNodeId: primaryHub.id,
      hubScore: hubMetrics.compositeScore,
      harmonyComplexity: decisions.harmonyComplexity
    });

    return decisions;
  }

  /**
   * Analyze hub structure within cluster
   */
  public analyzeClusterHubs(cluster: Cluster): ClusterHubAnalysis {
    const clusterNodeIds = new Set(cluster.nodes.map(n => n.id));
    const clusterMetrics = Array.from(this.hubMetrics.entries())
      .filter(([nodeId]) => clusterNodeIds.has(nodeId))
      .map(([, metrics]) => metrics);

    // Sort by composite score
    clusterMetrics.sort((a, b) => b.compositeScore - a.compositeScore);

    const primaryHub = clusterMetrics.length > 0 && clusterMetrics[0].isHub
      ? cluster.nodes.find(n => n.id === clusterMetrics[0].nodeId) || null
      : null;

    const secondaryHubs = clusterMetrics
      .slice(1, 4) // Top 3 secondary hubs
      .filter(m => m.isHub)
      .map(m => cluster.nodes.find(n => n.id === m.nodeId))
      .filter((n): n is GraphNode => n !== undefined);

    const peripheralNodes = cluster.nodes.filter(n => {
      const metrics = this.hubMetrics.get(n.id);
      return !metrics || !metrics.isHub;
    });

    // Calculate score statistics
    const scores = clusterMetrics.map(m => m.compositeScore);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length || 0;

    return {
      clusterId: cluster.id,
      hubCount: clusterMetrics.filter(m => m.isHub).length,
      primaryHub,
      secondaryHubs,
      peripheralNodes,
      averageHubScore: avgScore,
      hubScoreDistribution: {
        min: Math.min(...scores, 0),
        max: Math.max(...scores, 0),
        median: this.calculateMedian(scores),
        standardDeviation: this.calculateStandardDeviation(scores, avgScore)
      }
    };
  }

  /**
   * Assign musical roles to nodes in cluster based on hub distance
   */
  private assignRoles(
    cluster: Cluster,
    hub: GraphNode,
    hubMetrics: HubMetrics
  ): Map<string, HubRoleAssignment> {
    const assignments = new Map<string, HubRoleAssignment>();
    const tier = this.centralityAnalyzer.getProminenceTier(hubMetrics.compositeScore);

    // Assign hub role
    assignments.set(hub.id, {
      nodeId: hub.id,
      role: 'conductor',
      tier,
      volume: this.calculateHubVolume(hubMetrics.compositeScore),
      complexity: this.calculateHubComplexity(hubMetrics.compositeScore),
      instrument: this.selectHubInstrument(hubMetrics.compositeScore, cluster.type)
    });

    // Assign roles to other nodes based on their centrality
    for (const node of cluster.nodes) {
      if (node.id === hub.id) continue;

      const nodeMetrics = this.hubMetrics.get(node.id);
      const nodeTier = nodeMetrics
        ? this.centralityAnalyzer.getProminenceTier(nodeMetrics.compositeScore)
        : 'peripheral';

      const role = this.determineRole(nodeTier);
      const instrument = this.selectInstrumentForRole(role, cluster.type);

      assignments.set(node.id, {
        nodeId: node.id,
        role,
        tier: nodeTier,
        volume: this.calculateVolumeForTier(nodeTier),
        complexity: this.calculateComplexityForTier(nodeTier),
        instrument
      });
    }

    return assignments;
  }

  /**
   * Determine role based on prominence tier
   */
  private determineRole(tier: HubProminenceTier): HubRoleAssignment['role'] {
    switch (tier) {
      case 'super-hub':
      case 'hub':
        return 'conductor';
      case 'near-hub':
        return 'lead';
      case 'intermediate':
        return 'harmony';
      default:
        return 'accompaniment';
    }
  }

  /**
   * Select instrument for hub node
   */
  private selectHubInstrument(hubScore: number, clusterType: ClusterType): string {
    const pool = this.settings.hubInstrumentPreference.length > 0
      ? this.settings.hubInstrumentPreference
      : this.CONDUCTOR_INSTRUMENTS;

    // Use cluster type to influence instrument selection
    const typeIndex = this.getClusterTypeIndex(clusterType);
    const scoreIndex = Math.floor(hubScore * (pool.length - 1));

    return pool[(typeIndex + scoreIndex) % pool.length];
  }

  /**
   * Select instrument for non-hub role
   */
  private selectInstrumentForRole(role: HubRoleAssignment['role'], clusterType: ClusterType): string {
    let pool: string[];

    switch (role) {
      case 'conductor':
        pool = this.CONDUCTOR_INSTRUMENTS;
        break;
      case 'lead':
        pool = this.LEAD_INSTRUMENTS;
        break;
      case 'harmony':
        pool = this.HARMONY_INSTRUMENTS;
        break;
      case 'accompaniment':
        pool = this.ACCOMPANIMENT_INSTRUMENTS;
        break;
      case 'ambient':
        pool = this.AMBIENT_INSTRUMENTS;
        break;
    }

    const typeIndex = this.getClusterTypeIndex(clusterType);
    return pool[typeIndex % pool.length];
  }

  /**
   * Get cluster type index for instrument selection
   */
  private getClusterTypeIndex(clusterType: ClusterType): number {
    const types: ClusterType[] = ['tag-based', 'folder-based', 'link-dense', 'temporal', 'community'];
    return types.indexOf(clusterType);
  }

  /**
   * Calculate hub volume based on orchestration mode
   */
  public calculateHubVolume(hubScore: number): number {
    const baseVolume = 0.6; // Hubs always reasonably prominent

    switch (this.settings.orchestrationMode) {
      case 'hub-led':
        return Math.min(1.0, baseVolume + (hubScore * 0.4 * this.settings.prominenceMultiplier));
      case 'democratic':
        return baseVolume; // Equal volume for all
      case 'balanced':
        return Math.min(1.0, baseVolume + (hubScore * 0.2 * this.settings.prominenceMultiplier));
    }
  }

  /**
   * Calculate harmony complexity based on hub score
   */
  public calculateHubComplexity(hubScore: number): number {
    // More central nodes get more complex harmonies
    return 0.3 + (hubScore * 0.7); // 0.3-1.0 range
  }

  /**
   * Calculate harmony complexity for cluster
   */
  private calculateHarmonyComplexity(hubScore: number, clusterType: ClusterType): number {
    let baseComplexity = 0.5;

    // Adjust based on cluster type
    switch (clusterType) {
      case 'link-dense':
        baseComplexity = 0.7; // Dense connections = complex harmony
        break;
      case 'community':
        baseComplexity = 0.6;
        break;
      case 'tag-based':
        baseComplexity = 0.5;
        break;
      case 'temporal':
        baseComplexity = 0.4;
        break;
      case 'folder-based':
        baseComplexity = 0.45;
        break;
    }

    return Math.min(1.0, baseComplexity + (hubScore * 0.3));
  }

  /**
   * Calculate volume for prominence tier
   */
  private calculateVolumeForTier(tier: HubProminenceTier): number {
    switch (tier) {
      case 'super-hub': return 0.9;
      case 'hub': return 0.8;
      case 'near-hub': return 0.6;
      case 'intermediate': return 0.4;
      case 'peripheral': return 0.2;
    }
  }

  /**
   * Calculate complexity for prominence tier
   */
  private calculateComplexityForTier(tier: HubProminenceTier): number {
    switch (tier) {
      case 'super-hub': return 0.9;
      case 'hub': return 0.8;
      case 'near-hub': return 0.6;
      case 'intermediate': return 0.4;
      case 'peripheral': return 0.3;
    }
  }

  /**
   * Calculate volume distribution for all nodes
   */
  private calculateVolumeDistribution(
    roleAssignments: Map<string, HubRoleAssignment>
  ): Map<string, number> {
    const volumes = new Map<string, number>();

    roleAssignments.forEach((assignment, nodeId) => {
      volumes.set(nodeId, assignment.volume);
    });

    return volumes;
  }

  /**
   * Calculate spatial positioning (pan) for nodes
   */
  private calculateSpatialPositioning(
    cluster: Cluster,
    hub: GraphNode,
    roleAssignments: Map<string, HubRoleAssignment>
  ): Map<string, number> {
    const positions = new Map<string, number>();

    // Hub at center
    positions.set(hub.id, 0);

    // Spread other nodes around hub
    const peripheralNodes = Array.from(roleAssignments.keys()).filter(id => id !== hub.id);
    const angleStep = (2 * Math.PI) / peripheralNodes.length;

    peripheralNodes.forEach((nodeId, index) => {
      const assignment = roleAssignments.get(nodeId)!;
      const angle = index * angleStep;

      // Pan position based on angle (-1 to 1)
      // More peripheral nodes get wider panning
      const panRadius = assignment.tier === 'peripheral' ? 0.8 : 0.4;
      const pan = Math.sin(angle) * panRadius;

      positions.set(nodeId, pan);
    });

    return positions;
  }

  /**
   * Calculate graph distances from hub
   */
  private calculateHubDistances(
    cluster: Cluster,
    hub: GraphNode,
    links: GraphLink[]
  ): Map<string, number> {
    const distances = new Map<string, number>();
    const clusterNodeIds = new Set(cluster.nodes.map(n => n.id));

    // BFS to find distances
    const queue: Array<{ nodeId: string; distance: number }> = [{ nodeId: hub.id, distance: 0 }];
    const visited = new Set<string>([hub.id]);
    distances.set(hub.id, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Find neighbors in cluster
      for (const link of links) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;

        let neighborId: string | null = null;

        if (sourceId === current.nodeId && clusterNodeIds.has(targetId)) {
          neighborId = targetId;
        } else if (targetId === current.nodeId && clusterNodeIds.has(sourceId)) {
          neighborId = sourceId;
        }

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          const distance = current.distance + 1;
          distances.set(neighborId, distance);
          queue.push({ nodeId: neighborId, distance });
        }
      }
    }

    // Set infinite distance for unreachable nodes
    cluster.nodes.forEach(node => {
      if (!distances.has(node.id)) {
        distances.set(node.id, Infinity);
      }
    });

    return distances;
  }

  /**
   * Create democratic orchestration (no hub prominence)
   */
  private createDemocraticOrchestration(cluster: Cluster): OrchestrationDecisions {
    const defaultInstrument = 'piano';
    const defaultVolume = 0.5;

    const volumeDistribution = new Map<string, number>();
    const spatialPositioning = new Map<string, number>();
    const hubDistances = new Map<string, number>();

    cluster.nodes.forEach((node, index) => {
      volumeDistribution.set(node.id, defaultVolume);

      // Distribute spatially
      const angle = (index / cluster.nodes.length) * 2 * Math.PI;
      spatialPositioning.set(node.id, Math.sin(angle) * 0.5);

      hubDistances.set(node.id, 0);
    });

    return {
      clusterId: cluster.id,
      hubNodeId: null,
      leadInstrument: defaultInstrument,
      accompanyingInstruments: cluster.nodes.map(() => defaultInstrument),
      harmonyComplexity: 0.5,
      volumeDistribution,
      spatialPositioning,
      hubDistances
    };
  }

  /**
   * Update hub metrics with new graph data
   */
  public updateHubMetrics(nodes: GraphNode[], links: GraphLink[]): void {
    this.hubMetrics = this.centralityAnalyzer.calculateHubMetrics(nodes, links);
  }

  /**
   * Get hub metrics for specific node
   */
  public getNodeHubMetrics(nodeId: string): HubMetrics | null {
    return this.hubMetrics.get(nodeId) || null;
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: HubOrchestrationSettings): void {
    this.settings = { ...newSettings };
    this.centralityAnalyzer.updateSettings(
      newSettings.centralityWeights,
      newSettings.hubThreshold
    );

    logger.debug('settings-updated', 'Hub orchestration settings updated');
  }

  /**
   * Utility: Calculate median
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Utility: Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;

    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.hubMetrics.clear();
    this.centralityAnalyzer.invalidateCache();
    logger.debug('disposal', 'Hub orchestration manager disposed');
  }
}