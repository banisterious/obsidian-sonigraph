/**
 * Phase 5.2: Hub Centrality Analyzer
 *
 * Calculates multiple centrality metrics to identify hub nodes in the graph.
 * Hub nodes act as "conductors" to drive orchestration decisions.
 */

import { GraphNode, GraphLink } from '../../graph/GraphDataExtractor';
import { getLogger } from '../../logging';
import {
  HubMetrics,
  CentralityWeights,
  HubProminenceTier
} from './types';

const logger = getLogger('hub-centrality');

export class HubCentralityAnalyzer {
  private centralityWeights: CentralityWeights;
  private hubThreshold: number;
  private metricsCache: Map<string, HubMetrics> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 5000; // 5 second cache

  constructor(
    centralityWeights?: CentralityWeights,
    hubThreshold: number = 0.6
  ) {
    this.centralityWeights = centralityWeights || {
      degree: 0.3,
      betweenness: 0.3,
      eigenvector: 0.2,
      pageRank: 0.2
    };
    this.hubThreshold = hubThreshold;
  }

  /**
   * Calculate hub metrics for all nodes in the graph
   */
  public calculateHubMetrics(nodes: GraphNode[], links: GraphLink[]): Map<string, HubMetrics> {
    // Check cache
    const now = Date.now();
    if (this.metricsCache.size > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION_MS) {
      logger.debug('cache-hit', 'Using cached hub metrics');
      return this.metricsCache;
    }

    logger.debug('calculation-start', 'Calculating hub metrics', {
      nodeCount: nodes.length,
      linkCount: links.length
    });

    const metrics = new Map<string, HubMetrics>();

    // Build adjacency structures for efficient computation
    const adjacencyList = this.buildAdjacencyList(nodes, links);
    const nodeIndices = this.buildNodeIndexMap(nodes);

    // Calculate each centrality metric
    const degreeCentralities = this.calculateAllDegreeCentrality(nodes, adjacencyList);
    const betweennessCentralities = this.calculateAllBetweennessCentrality(nodes, adjacencyList, nodeIndices);
    const eigenvectorCentralities = this.calculateAllEigenvectorCentrality(nodes, adjacencyList, nodeIndices);
    const pageRanks = this.calculateAllPageRank(nodes, adjacencyList, nodeIndices);

    // Combine metrics for each node
    for (const node of nodes) {
      const hubMetrics: HubMetrics = {
        nodeId: node.id,
        degreeCentrality: degreeCentralities.get(node.id) || 0,
        betweennessCentrality: betweennessCentralities.get(node.id) || 0,
        eigenvectorCentrality: eigenvectorCentralities.get(node.id) || 0,
        pageRank: pageRanks.get(node.id) || 0,
        compositeScore: 0,
        isHub: false
      };

      // Calculate composite score
      hubMetrics.compositeScore = this.calculateCompositeScore(hubMetrics);
      hubMetrics.isHub = hubMetrics.compositeScore >= this.hubThreshold;

      metrics.set(node.id, hubMetrics);
    }

    // Update cache
    this.metricsCache = metrics;
    this.cacheTimestamp = now;

    logger.debug('calculation-complete', 'Hub metrics calculated', {
      totalNodes: metrics.size,
      hubCount: Array.from(metrics.values()).filter(m => m.isHub).length,
      avgCompositeScore: this.calculateAverageScore(metrics)
    });

    return metrics;
  }

  /**
   * Calculate composite hub score from individual metrics
   */
  public calculateCompositeScore(metrics: HubMetrics): number {
    const weights = this.centralityWeights;
    const totalWeight = weights.degree + weights.betweenness + weights.eigenvector + weights.pageRank;

    if (totalWeight === 0) return 0;

    return (
      (metrics.degreeCentrality * weights.degree +
       metrics.betweennessCentrality * weights.betweenness +
       metrics.eigenvectorCentrality * weights.eigenvector +
       metrics.pageRank * weights.pageRank) / totalWeight
    );
  }

  /**
   * Get hub prominence tier for a composite score
   */
  public getProminenceTier(compositeScore: number): HubProminenceTier {
    if (compositeScore >= 0.9) return 'super-hub';
    if (compositeScore >= 0.8) return 'hub';
    if (compositeScore >= 0.6) return 'near-hub';
    if (compositeScore >= 0.4) return 'intermediate';
    return 'peripheral';
  }

  /**
   * Calculate degree centrality for all nodes
   * Simple ratio of connections to total possible connections
   */
  private calculateAllDegreeCentrality(
    nodes: GraphNode[],
    adjacencyList: Map<string, Set<string>>
  ): Map<string, number> {
    const centralities = new Map<string, number>();
    const n = nodes.length;

    if (n <= 1) {
      nodes.forEach(node => centralities.set(node.id, 0));
      return centralities;
    }

    const maxPossibleDegree = n - 1;

    for (const node of nodes) {
      const degree = adjacencyList.get(node.id)?.size || 0;
      const normalized = degree / maxPossibleDegree;
      centralities.set(node.id, normalized);
    }

    return centralities;
  }

  /**
   * Calculate betweenness centrality for all nodes
   * Measures how often a node appears on shortest paths between other nodes
   */
  private calculateAllBetweennessCentrality(
    nodes: GraphNode[],
    adjacencyList: Map<string, Set<string>>,
    nodeIndices: Map<string, number>
  ): Map<string, number> {
    const centralities = new Map<string, number>();
    const n = nodes.length;

    // Initialize all to zero
    nodes.forEach(node => centralities.set(node.id, 0));

    if (n <= 2) return centralities;

    // For each pair of nodes, find shortest paths and count passages
    for (let i = 0; i < n; i++) {
      const source = nodes[i];
      const distances = this.dijkstraShortestPaths(source.id, adjacencyList, nodeIndices, nodes);

      // Count how many shortest paths pass through each node
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const target = nodes[j];

        if (!distances.has(target.id)) continue;

        const pathNodes = this.reconstructPath(source.id, target.id, distances);

        // Increment betweenness for intermediate nodes
        for (let k = 1; k < pathNodes.length - 1; k++) {
          const currentScore = centralities.get(pathNodes[k]) || 0;
          centralities.set(pathNodes[k], currentScore + 1);
        }
      }
    }

    // Normalize by maximum possible betweenness
    const maxBetweenness = (n - 1) * (n - 2) / 2;

    if (maxBetweenness > 0) {
      centralities.forEach((value, key) => {
        centralities.set(key, value / maxBetweenness);
      });
    }

    return centralities;
  }

  /**
   * Calculate eigenvector centrality for all nodes
   * Nodes connected to important nodes are themselves important
   */
  private calculateAllEigenvectorCentrality(
    nodes: GraphNode[],
    adjacencyList: Map<string, Set<string>>,
    nodeIndices: Map<string, number>
  ): Map<string, number> {
    const n = nodes.length;
    const centralities = new Map<string, number>();

    if (n === 0) return centralities;

    // Initialize with equal values
    let scores = new Array(n).fill(1 / Math.sqrt(n));

    // Power iteration method
    const maxIterations = 100;
    const tolerance = 1e-6;

    for (let iter = 0; iter < maxIterations; iter++) {
      const newScores = new Array(n).fill(0);

      // For each node, sum scores of neighbors
      for (let i = 0; i < n; i++) {
        const node = nodes[i];
        const neighbors = adjacencyList.get(node.id) || new Set();

        for (const neighborId of neighbors) {
          const neighborIndex = nodeIndices.get(neighborId);
          if (neighborIndex !== undefined) {
            newScores[i] += scores[neighborIndex];
          }
        }
      }

      // Normalize
      const norm = Math.sqrt(newScores.reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        for (let i = 0; i < n; i++) {
          newScores[i] /= norm;
        }
      }

      // Check convergence
      let maxDiff = 0;
      for (let i = 0; i < n; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(newScores[i] - scores[i]));
      }

      scores = newScores;

      if (maxDiff < tolerance) {
        break;
      }
    }

    // Convert to 0-1 range
    const maxScore = Math.max(...scores);
    if (maxScore > 0) {
      for (let i = 0; i < n; i++) {
        centralities.set(nodes[i].id, scores[i] / maxScore);
      }
    } else {
      nodes.forEach(node => centralities.set(node.id, 0));
    }

    return centralities;
  }

  /**
   * Calculate PageRank for all nodes
   * Google's algorithm for ranking web pages, applied to graph
   */
  private calculateAllPageRank(
    nodes: GraphNode[],
    adjacencyList: Map<string, Set<string>>,
    nodeIndices: Map<string, number>
  ): Map<string, number> {
    const n = nodes.length;
    const pageRanks = new Map<string, number>();

    if (n === 0) return pageRanks;

    const dampingFactor = 0.85;
    const maxIterations = 100;
    const tolerance = 1e-6;

    // Initialize with equal PageRank
    let ranks = new Array(n).fill(1 / n);

    for (let iter = 0; iter < maxIterations; iter++) {
      const newRanks = new Array(n).fill((1 - dampingFactor) / n);

      // Calculate incoming PageRank from neighbors
      for (let i = 0; i < n; i++) {
        const node = nodes[i];
        const neighbors = adjacencyList.get(node.id) || new Set();
        const outDegree = neighbors.size;

        if (outDegree > 0) {
          const contribution = ranks[i] / outDegree;

          for (const neighborId of neighbors) {
            const neighborIndex = nodeIndices.get(neighborId);
            if (neighborIndex !== undefined) {
              newRanks[neighborIndex] += dampingFactor * contribution;
            }
          }
        }
      }

      // Check convergence
      let maxDiff = 0;
      for (let i = 0; i < n; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(newRanks[i] - ranks[i]));
      }

      ranks = newRanks;

      if (maxDiff < tolerance) {
        break;
      }
    }

    // Normalize to 0-1 range
    const maxRank = Math.max(...ranks);
    if (maxRank > 0) {
      for (let i = 0; i < n; i++) {
        pageRanks.set(nodes[i].id, ranks[i] / maxRank);
      }
    } else {
      nodes.forEach(node => pageRanks.set(node.id, 1 / n));
    }

    return pageRanks;
  }

  /**
   * Build adjacency list from links
   */
  private buildAdjacencyList(nodes: GraphNode[], links: GraphLink[]): Map<string, Set<string>> {
    const adjacencyList = new Map<string, Set<string>>();

    // Initialize empty sets for all nodes
    nodes.forEach(node => {
      adjacencyList.set(node.id, new Set());
    });

    // Add edges (undirected graph)
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;

      adjacencyList.get(sourceId)?.add(targetId);
      adjacencyList.get(targetId)?.add(sourceId);
    });

    return adjacencyList;
  }

  /**
   * Build node index map for efficient array access
   */
  private buildNodeIndexMap(nodes: GraphNode[]): Map<string, number> {
    const indexMap = new Map<string, number>();
    nodes.forEach((node, index) => {
      indexMap.set(node.id, index);
    });
    return indexMap;
  }

  /**
   * Dijkstra's shortest path algorithm
   */
  private dijkstraShortestPaths(
    sourceId: string,
    adjacencyList: Map<string, Set<string>>,
    nodeIndices: Map<string, number>,
    nodes: GraphNode[]
  ): Map<string, { distance: number; previous: string | null }> {
    const distances = new Map<string, { distance: number; previous: string | null }>();
    const unvisited = new Set(nodes.map(n => n.id));

    // Initialize distances
    nodes.forEach(node => {
      distances.set(node.id, {
        distance: node.id === sourceId ? 0 : Infinity,
        previous: null
      });
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let minNode: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)?.distance || Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          minNode = nodeId;
        }
      }

      if (minNode === null || minDistance === Infinity) break;

      unvisited.delete(minNode);

      // Update neighbors
      const neighbors = adjacencyList.get(minNode) || new Set();
      const currentDistance = distances.get(minNode)!.distance;

      for (const neighborId of neighbors) {
        if (!unvisited.has(neighborId)) continue;

        const newDistance = currentDistance + 1; // Unweighted edges
        const neighborData = distances.get(neighborId)!;

        if (newDistance < neighborData.distance) {
          neighborData.distance = newDistance;
          neighborData.previous = minNode;
        }
      }
    }

    return distances;
  }

  /**
   * Reconstruct shortest path from distances map
   */
  private reconstructPath(
    sourceId: string,
    targetId: string,
    distances: Map<string, { distance: number; previous: string | null }>
  ): string[] {
    const path: string[] = [];
    let current: string | null = targetId;

    while (current !== null) {
      path.unshift(current);
      if (current === sourceId) break;
      current = distances.get(current)?.previous || null;
    }

    return path;
  }

  /**
   * Calculate average composite score
   */
  private calculateAverageScore(metrics: Map<string, HubMetrics>): number {
    if (metrics.size === 0) return 0;
    const sum = Array.from(metrics.values()).reduce((acc, m) => acc + m.compositeScore, 0);
    return sum / metrics.size;
  }

  /**
   * Update settings
   */
  public updateSettings(weights: CentralityWeights, threshold: number): void {
    this.centralityWeights = { ...weights };
    this.hubThreshold = threshold;
    this.invalidateCache();

    logger.debug('settings-updated', 'Hub centrality settings updated', {
      weights,
      threshold
    });
  }

  /**
   * Invalidate cache to force recalculation
   */
  public invalidateCache(): void {
    this.metricsCache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Get current cache status
   */
  public getCacheStatus(): { size: number; age: number; isValid: boolean } {
    const age = Date.now() - this.cacheTimestamp;
    return {
      size: this.metricsCache.size,
      age,
      isValid: this.metricsCache.size > 0 && age < this.CACHE_DURATION_MS
    };
  }
}