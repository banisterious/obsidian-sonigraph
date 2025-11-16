/**
 * Smart Clustering Algorithms for Sonic Graph
 * 
 * Intelligently groups related nodes based on content relationships using
 * community detection algorithms and multi-factor clustering weights.
 * 
 * Integrates with existing path-based grouping system and provides
 * real-time clustering with visual feedback.
 */

import { GraphNode, GraphLink } from './GraphDataExtractor';
import { getLogger } from '../logging';

const logger = getLogger('SmartClustering');

export type ClusterType = 'tag-based' | 'folder-based' | 'link-dense' | 'temporal' | 'community';

export interface Cluster {
  id: string;
  nodes: GraphNode[];
  centroid: { x: number; y: number };
  radius: number;
  color: string;
  type: ClusterType;
  strength: number; // 0-1, how cohesive the cluster is
  label?: string; // Auto-generated or user-defined cluster name
}

export interface ClusteringWeights {
  linkStrength: number;    // 40% - Direct connections between files
  sharedTags: number;      // 30% - Files with common tags
  folderHierarchy: number; // 20% - Folder-based organization
  temporalProximity: number; // 10% - Recently created/modified files
}

export interface SmartClusteringSettings {
  enabled: boolean;
  algorithm: 'louvain' | 'modularity' | 'hybrid';
  weights: ClusteringWeights;
  minClusterSize: number;
  maxClusters: number;
  resolution: number; // Controls cluster granularity
  enableVisualization: boolean;
  respectExistingGroups: boolean; // Integrate with manual path-based groups
  debugMode: boolean;
}

export interface ClusteringResult {
  clusters: Cluster[];
  modularity: number; // Quality score 0-1
  coverage: number; // Percentage of nodes clustered
  orphanNodes: GraphNode[]; // Nodes not assigned to any cluster
}

export class SmartClusteringAlgorithms {
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private settings: SmartClusteringSettings;
  private lastClusteringResult: ClusteringResult | null = null;

  /**
   * Helper method to get node ID from string or GraphNode
   */
  private getNodeId(node: string | GraphNode): string {
    return typeof node === 'string' ? node : node.id;
  }

  constructor(settings: SmartClusteringSettings) {
    this.settings = { ...settings };
  }

  /**
   * Main clustering interface - processes graph data and returns clusters
   */
  public async clusterGraph(nodes: GraphNode[], links: GraphLink[]): Promise<ClusteringResult> {
    this.nodes = [...nodes];
    this.links = [...links];

    if (!this.settings.enabled || this.nodes.length < 3) {
      return this.createEmptyResult();
    }

    // Choose clustering algorithm based on settings
    switch (this.settings.algorithm) {
      case 'louvain':
        return this.louvainClustering();
      case 'modularity':
        return this.modularityClustering();
      case 'hybrid':
        return this.hybridClustering();
      default:
        return this.louvainClustering();
    }
  }

  /**
   * Louvain algorithm for community detection
   * Fast, high-quality clustering for most use cases
   */
  private louvainClustering(): ClusteringResult {
    // Initialize each node as its own cluster
    const nodeClusters = new Map<string, string>();
    this.nodes.forEach(node => {
      nodeClusters.set(node.id, node.id);
    });

    let improved = true;
    let iteration = 0;
    const maxIterations = 100;

    // Multi-pass optimization
    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      // For each node, try moving it to neighboring clusters
      for (const node of this.nodes) {
        const currentClusterId = nodeClusters.get(node.id);
        const neighborClusters = this.getNeighborClusters(node, nodeClusters);

        let bestClusterId = currentClusterId;
        let bestModularityGain = 0;

        // Test moving to each neighbor cluster
        for (const clusterId of neighborClusters) {
          if (clusterId === currentClusterId) continue;

          const modularityGain = this.calculateModularityGain(
            node, currentClusterId, clusterId, nodeClusters
          );

          if (modularityGain > bestModularityGain) {
            bestModularityGain = modularityGain;
            bestClusterId = clusterId;
          }
        }

        // Move node if improvement found
        if (bestClusterId !== currentClusterId) {
          void nodeClusters.set(node.id, bestClusterId);
          improved = true;
        }
      }
    }

    // Convert cluster assignments to Cluster objects
    return this.createClusteringResult(nodeClusters);
  }

  /**
   * Pure modularity-based clustering
   * Slower but potentially higher quality for academic use cases
   */
  private modularityClustering(): ClusteringResult {
    // Start with all nodes in separate clusters
    const clusters = this.nodes.map((node, index) => ({
      id: `cluster_${index}`,
      nodeIds: [node.id],
      edges: this.getClusterEdges([node.id])
    }));

    let improved = true;

    // Iteratively merge clusters to maximize modularity
    while (improved && clusters.length > 1) {
      improved = false;
      let bestMergeGain = 0;
      let bestMergeIndices: [number, number] = [0, 1];

      // Try all possible cluster merges
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const modularityGain = this.calculateMergeGain(clusters, i, j);
          
          if (modularityGain > bestMergeGain) {
            bestMergeGain = modularityGain;
            bestMergeIndices = [i, j];
          }
        }
      }

      // Perform best merge if improvement found
      if (bestMergeGain > 0) {
        const [i, j] = bestMergeIndices;
        void this.mergeClusters(clusters, i, j);
        improved = true;
      }
    }

    // Convert to our cluster format
    const nodeClusters = new Map<string, string>();
    clusters.forEach(cluster => {
      cluster.nodeIds.forEach(nodeId => {
        nodeClusters.set(nodeId, cluster.id);
      });
    });

    return this.createClusteringResult(nodeClusters);
  }

  /**
   * Hybrid clustering combining multiple approaches
   * Uses Louvain for initial clustering, then refines with multi-factor weights
   */
  private hybridClustering(): ClusteringResult {
    // Start with Louvain clustering
    const louvainResult = this.louvainClustering();

    // Apply multi-factor refinement
    const refinedClusters = this.applyMultiFactorRefinement(louvainResult.clusters);
    
    // Recalculate metrics
    const nodeClusters = new Map<string, string>();
    refinedClusters.forEach(cluster => {
      cluster.nodes.forEach(node => {
        nodeClusters.set(node.id, cluster.id);
      });
    });

    return this.createClusteringResult(nodeClusters);
  }

  /**
   * Apply multi-factor weights to refine clustering
   */
  private applyMultiFactorRefinement(clusters: Cluster[]): Cluster[] {
    const refinedClusters: Cluster[] = [];

    for (const cluster of clusters) {
      // Calculate multi-factor cohesion score
      const linkScore = this.calculateLinkCohesion(cluster) * this.settings.weights.linkStrength;
      const tagScore = this.calculateTagCohesion(cluster) * this.settings.weights.sharedTags;
      const folderScore = this.calculateFolderCohesion(cluster) * this.settings.weights.folderHierarchy;
      const temporalScore = this.calculateTemporalCohesion(cluster) * this.settings.weights.temporalProximity;

      const totalCohesion = linkScore + tagScore + folderScore + temporalScore;

      // Split weak clusters
      if (totalCohesion < 0.3 && cluster.nodes.length > this.settings.minClusterSize * 2) {
        const splitClusters = this.splitCluster(cluster);
        void refinedClusters.push(...splitClusters);
      } else {
        // Update cluster strength and type
        const updatedCluster = {
          ...cluster,
          strength: totalCohesion,
          type: this.determineClusterType(cluster) as Cluster['type']
        };
        void refinedClusters.push(updatedCluster);
      }
    }

    return refinedClusters;
  }

  /**
   * Calculate neighbor clusters for a node
   */
  private getNeighborClusters(node: GraphNode, nodeClusters: Map<string, string>): Set<string> {
    const neighbors = new Set<string>();
    
    // Add current cluster
    neighbors.add(nodeClusters.get(node.id));

    // Add clusters of connected nodes
    for (const link of this.links) {
      if (this.getNodeId(link.source) === node.id) {
        const targetCluster = nodeClusters.get(this.getNodeId(link.target));
        if (targetCluster) neighbors.add(targetCluster);
      } else if (this.getNodeId(link.target) === node.id) {
        const sourceCluster = nodeClusters.get(this.getNodeId(link.source));
        if (sourceCluster) neighbors.add(sourceCluster);
      }
    }

    return neighbors;
  }

  /**
   * Calculate modularity gain from moving a node between clusters
   */
  private calculateModularityGain(
    node: GraphNode, 
    fromCluster: string, 
    toCluster: string, 
    nodeClusters: Map<string, string>
  ): number {
    // Simplified modularity gain calculation
    // In practice, this would be the full Newman modularity formula
    
    const fromConnections = this.getClusterConnections(node, fromCluster, nodeClusters);
    const toConnections = this.getClusterConnections(node, toCluster, nodeClusters);
    
    // Apply multi-factor weights
    const linkGain = (toConnections - fromConnections) * this.settings.weights.linkStrength;
    const tagGain = this.calculateTagSimilarityGain(node, fromCluster, toCluster, nodeClusters);
    const folderGain = this.calculateFolderSimilarityGain(node, fromCluster, toCluster, nodeClusters);
    
    return linkGain + tagGain + folderGain;
  }

  /**
   * Get number of connections between node and cluster
   */
  private getClusterConnections(
    node: GraphNode, 
    clusterId: string, 
    nodeClusters: Map<string, string>
  ): number {
    let connections = 0;
    
    for (const link of this.links) {
      if (this.getNodeId(link.source) === node.id) {
        if (nodeClusters.get(this.getNodeId(link.target)) === clusterId) {
          connections += link.strength || 1;
        }
      } else if (this.getNodeId(link.target) === node.id) {
        if (nodeClusters.get(this.getNodeId(link.source)) === clusterId) {
          connections += link.strength || 1;
        }
      }
    }
    
    return connections;
  }

  /**
   * Calculate tag similarity gain from cluster move
   */
  private calculateTagSimilarityGain(
    node: GraphNode,
    fromCluster: string,
    toCluster: string,
    nodeClusters: Map<string, string>
  ): number {
    if (!node.metadata?.tags) return 0;

    const fromTags = this.getClusterTags(fromCluster, nodeClusters);
    const toTags = this.getClusterTags(toCluster, nodeClusters);

    const fromSimilarity = this.calculateTagSimilarity(node.metadata.tags, fromTags);
    const toSimilarity = this.calculateTagSimilarity(node.metadata.tags, toTags);

    return (toSimilarity - fromSimilarity) * this.settings.weights.sharedTags;
  }

  /**
   * Calculate folder similarity gain from cluster move
   */
  private calculateFolderSimilarityGain(
    node: GraphNode,
    fromCluster: string,
    toCluster: string,
    nodeClusters: Map<string, string>
  ): number {
    const nodePath = this.getNodePath(node);
    if (!nodePath) return 0;

    const fromPaths = this.getClusterPaths(fromCluster, nodeClusters);
    const toPaths = this.getClusterPaths(toCluster, nodeClusters);

    const fromSimilarity = this.calculatePathSimilarity(nodePath, fromPaths);
    const toSimilarity = this.calculatePathSimilarity(nodePath, toPaths);

    return (toSimilarity - fromSimilarity) * this.settings.weights.folderHierarchy;
  }

  /**
   * Helper methods for cohesion calculations
   */
  private calculateLinkCohesion(cluster: Cluster): number {
    if (cluster.nodes.length < 2) return 0;

    const nodeIds = new Set(cluster.nodes.map(n => n.id));
    let internalLinks = 0;
    let totalPossibleLinks = cluster.nodes.length * (cluster.nodes.length - 1) / 2;

    for (const link of this.links) {
      if (nodeIds.has(this.getNodeId(link.source)) && nodeIds.has(this.getNodeId(link.target))) {
        internalLinks++;
      }
    }

    return totalPossibleLinks > 0 ? internalLinks / totalPossibleLinks : 0;
  }

  private calculateTagCohesion(cluster: Cluster): number {
    const allTags = new Set<string>();
    const nodeTags: string[][] = [];

    cluster.nodes.forEach(node => {
      const tags = node.metadata?.tags || [];
      void nodeTags.push(tags);
      tags.forEach((tag: string) => allTags.add(tag));
    });

    if (allTags.size === 0) return 0;

    // Calculate average tag overlap
    let totalOverlap = 0;
    let comparisons = 0;

    for (let i = 0; i < nodeTags.length; i++) {
      for (let j = i + 1; j < nodeTags.length; j++) {
        const overlap = this.calculateTagSimilarity(nodeTags[i], nodeTags[j]);
        totalOverlap += overlap;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalOverlap / comparisons : 0;
  }

  private calculateFolderCohesion(cluster: Cluster): number {
    const paths = cluster.nodes.map(node => this.getNodePath(node)).filter(Boolean);
    if (paths.length < 2) return 0;

    // Calculate common path prefix length
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < paths.length; i++) {
      for (let j = i + 1; j < paths.length; j++) {
        const similarity = this.calculatePathSimilarity(paths[i], [paths[j]]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private calculateTemporalCohesion(cluster: Cluster): number {
    if (cluster.nodes.length < 2) return 0;

    const dates = cluster.nodes.map(node => node.creationDate.getTime());
    dates.sort((a, b) => a - b);

    const timeSpan = dates[dates.length - 1] - dates[0];
    const dayInMs = 24 * 60 * 60 * 1000;
    const maxReasonableSpan = 365 * dayInMs; // 1 year

    // Higher cohesion for files created closer in time
    return Math.max(0, 1 - (timeSpan / maxReasonableSpan));
  }

  /**
   * Utility methods
   */
  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    if (tags1.length === 0 && tags2.length === 0) return 1;
    if (tags1.length === 0 || tags2.length === 0) return 0;

    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    const intersection = new Set([...set1].filter(tag => set2.has(tag)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  private getNodePath(node: GraphNode): string | null {
    // Extract folder path from node ID or title
    if (node.id.includes('/')) {
      const parts = node.id.split('/');
      parts.pop(); // Remove filename
      return parts.join('/');
    }
    return null;
  }

  private calculatePathSimilarity(path: string, clusterPaths: string[]): number {
    if (clusterPaths.length === 0) return 0;

    let maxSimilarity = 0;
    for (const clusterPath of clusterPaths) {
      const similarity = this.getPathOverlap(path, clusterPath);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  private getPathOverlap(path1: string, path2: string): number {
    const parts1 = path1.split('/');
    const parts2 = path2.split('/');
    
    let commonPrefixLength = 0;
    const minLength = Math.min(parts1.length, parts2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) {
        commonPrefixLength++;
      } else {
        break;
      }
    }

    const maxLength = Math.max(parts1.length, parts2.length);
    return maxLength > 0 ? commonPrefixLength / maxLength : 0;
  }

  /**
   * Result generation methods
   */
  private createClusteringResult(nodeClusters: Map<string, string>): ClusteringResult {
    const clusterMap = new Map<string, GraphNode[]>();
    const orphanNodes: GraphNode[] = [];

    // Group nodes by cluster
    this.nodes.forEach(node => {
      const clusterId = nodeClusters.get(node.id);
      if (clusterId) {
        if (!clusterMap.has(clusterId)) {
          clusterMap.set(clusterId, []);
        }
        const cluster = clusterMap.get(clusterId); if (cluster) cluster.push(node);
      } else {
        void orphanNodes.push(node);
      }
    });

    // Filter clusters by minimum size
    const validClusters: Cluster[] = [];
    clusterMap.forEach((nodes, clusterId) => {
      if (nodes.length >= this.settings.minClusterSize) {
        const cluster = this.createCluster(clusterId, nodes);
        void validClusters.push(cluster);
      } else {
        void orphanNodes.push(...nodes);
      }
    });

    // Limit number of clusters
    if (validClusters.length > this.settings.maxClusters) {
      validClusters.sort((a, b) => b.nodes.length - a.nodes.length);
      const removedClusters = validClusters.splice(this.settings.maxClusters);
      removedClusters.forEach(cluster => orphanNodes.push(...cluster.nodes));
    }

    const modularity = this.calculateTotalModularity(validClusters);
    const coverage = (this.nodes.length - orphanNodes.length) / this.nodes.length;

    this.lastClusteringResult = {
      clusters: validClusters,
      modularity,
      coverage,
      orphanNodes
    };

    return this.lastClusteringResult;
  }

  private createCluster(id: string, nodes: GraphNode[]): Cluster {
    // Calculate centroid
    const centroid = this.calculateCentroid(nodes);
    
    // Calculate radius
    const radius = this.calculateClusterRadius(nodes, centroid);
    
    // Determine cluster type
    const type = this.determineClusterType({ nodes } as Cluster);
    
    // Generate color
    const color = this.generateClusterColor(type);
    
    // Generate label
    const label = this.generateClusterLabel(nodes, type);

    return {
      id,
      nodes,
      centroid,
      radius,
      color,
      type,
      strength: this.calculateClusterStrength(nodes),
      label
    };
  }

  private calculateCentroid(nodes: GraphNode[]): { x: number; y: number } {
    if (nodes.length === 0) return { x: 0, y: 0 };

    // D3 adds x/y properties to nodes during simulation
    interface D3Node {
      x?: number;
      y?: number;
    }

    let totalX = 0;
    let totalY = 0;
    let validPositions = 0;

    nodes.forEach(node => {
      // Use existing node positions if available (added by D3)
      const d3Node = node as GraphNode & D3Node;
      const x = d3Node.x;
      const y = d3Node.y;

      if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
        totalX += x;
        totalY += y;
        validPositions++;
      }
    });

    // If no valid positions, return a distributed position to avoid overlap
    if (validPositions === 0) {
      // Use hash of first node ID to create distributed positions
      const hash = this.hashString(nodes[0]?.id || 'default');
      const angle = (hash % 360) * (Math.PI / 180);
      const radius = 100 + (hash % 200); // 100-300px from center
      return {
        x: 400 + Math.cos(angle) * radius, // Assume 800px canvas width
        y: 300 + Math.sin(angle) * radius  // Assume 600px canvas height
      };
    }

    return {
      x: totalX / validPositions,
      y: totalY / validPositions
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateClusterRadius(nodes: GraphNode[], centroid: { x: number; y: number }): number {
    if (nodes.length === 0) return 15; // Small default for empty clusters

    // D3 adds x/y properties to nodes during simulation
    interface D3Node {
      x?: number;
      y?: number;
    }

    let maxDistance = 0;
    let validNodes = 0;

    nodes.forEach(node => {
      const d3Node = node as GraphNode & D3Node;
      const x = d3Node.x || 0;
      const y = d3Node.y || 0;

      // Only consider nodes with valid positions
      if (x !== 0 || y !== 0) {
        const distance = Math.sqrt((x - centroid.x) ** 2 + (y - centroid.y) ** 2);
        maxDistance = Math.max(maxDistance, distance);
        validNodes++;
      }
    });

    // If no valid nodes found, use a small radius based on cluster size
    if (validNodes === 0) {
      return Math.min(15 + (nodes.length * 3), 40);
    }

    // Add proportional padding based on node size and count, but much smaller minimum
    const nodePadding = 8 + Math.sqrt(nodes.length) * 2; // Adaptive padding
    const calculatedRadius = maxDistance + nodePadding;
    
    // Much smaller minimum radius that adapts to cluster size
    const minimumRadius = Math.min(15 + (nodes.length * 2), 25);
    
    return Math.max(calculatedRadius, minimumRadius);
  }

  private determineClusterType(cluster: { nodes: GraphNode[] }): 'tag-based' | 'folder-based' | 'link-dense' | 'temporal' | 'community' {
    // Analyze cluster composition to determine type
    const tagCohesion = this.calculateTagCohesion(cluster as Cluster);
    const folderCohesion = this.calculateFolderCohesion(cluster as Cluster);
    const linkCohesion = this.calculateLinkCohesion(cluster as Cluster);
    const temporalCohesion = this.calculateTemporalCohesion(cluster as Cluster);

    // Enhanced scoring with lower thresholds and better differentiation
    const factors = [
      { type: 'tag-based', score: tagCohesion * 1.2 }, // Boost tag detection
      { type: 'folder-based', score: folderCohesion },
      { type: 'link-dense', score: linkCohesion * 1.5 }, // Boost link detection
      { type: 'temporal', score: temporalCohesion }
    ];

    factors.sort((a, b) => b.score - a.score);
    
    // Lower threshold for better type detection (0.3 -> 0.15)
    if (factors[0].score > 0.15) {
      return factors[0].type as 'tag-based' | 'folder-based' | 'link-dense' | 'temporal';
    }
    
    // If no clear winner, use cluster size and connectivity to decide
    if (cluster.nodes.length >= 10) {
      // Large clusters with moderate connectivity are likely communities
      return 'community';
    } else if (linkCohesion > 0.1) {
      // Small, well-connected clusters are link-dense
      return 'link-dense';
    }
    
    return 'community';
  }

  private generateClusterColor(type: string): string {
    const colors = {
      'tag-based': '#4ade80',     // Green
      'folder-based': '#60a5fa',  // Blue
      'link-dense': '#f472b6',    // Pink
      'temporal': '#fbbf24',      // Yellow
      'community': '#a78bfa'      // Purple
    };
    return colors[type as keyof typeof colors] || colors.community;
  }

  private generateClusterLabel(nodes: GraphNode[], type: string): string {
    switch (type) {
      case 'tag-based':
        return this.getCommonTags(nodes);
      case 'folder-based':
        return this.getCommonFolder(nodes);
      case 'temporal':
        return this.getTimeRangeLabel(nodes);
      default:
        return `Cluster (${nodes.length} nodes)`;
    }
  }

  private getCommonTags(nodes: GraphNode[]): string {
    const tagCounts = new Map<string, number>();
    
    nodes.forEach(node => {
      const tags = node.metadata?.tags || [];
      tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const commonTags = Array.from(tagCounts.entries())
      .filter(([, count]) => count >= Math.ceil(nodes.length * 0.5))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag);

    return commonTags.length > 0 ? `#${commonTags.join(', #')}` : `Tag Cluster (${nodes.length})`;
  }

  private getCommonFolder(nodes: GraphNode[]): string {
    const paths = nodes.map(node => this.getNodePath(node)).filter(Boolean);
    if (paths.length === 0) return `Folder Cluster (${nodes.length})`;

    // Find common prefix
    let commonPrefix = paths[0];
    for (let i = 1; i < paths.length; i++) {
      commonPrefix = this.getCommonPathPrefix(commonPrefix, paths[i]);
    }

    const folderName = commonPrefix.split('/').pop() || 'Root';
    return `${folderName}/ (${nodes.length})`;
  }

  private getCommonPathPrefix(path1: string, path2: string): string {
    const parts1 = path1.split('/');
    const parts2 = path2.split('/');
    const commonParts: string[] = [];

    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i]) {
        commonParts.push(parts1[i]);
      } else {
        break;
      }
    }

    return commonParts.join('/');
  }

  private getTimeRangeLabel(nodes: GraphNode[]): string {
    const dates = nodes.map(node => node.creationDate);
    dates.sort((a, b) => a.getTime() - b.getTime());

    const start = dates[0];
    const end = dates[dates.length - 1];
    
    const daysDiff = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    
    if (daysDiff < 1) {
      return `Today (${nodes.length})`;
    } else if (daysDiff < 7) {
      return `This Week (${nodes.length})`;
    } else if (daysDiff < 30) {
      return `This Month (${nodes.length})`;
    } else {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (${nodes.length})`;
    }
  }

  private calculateClusterStrength(nodes: GraphNode[]): number {
    // Combine all cohesion measures
    const cluster = { nodes } as Cluster;
    const linkCohesion = this.calculateLinkCohesion(cluster);
    const tagCohesion = this.calculateTagCohesion(cluster);
    const folderCohesion = this.calculateFolderCohesion(cluster);
    const temporalCohesion = this.calculateTemporalCohesion(cluster);

    return (
      linkCohesion * this.settings.weights.linkStrength +
      tagCohesion * this.settings.weights.sharedTags +
      folderCohesion * this.settings.weights.folderHierarchy +
      temporalCohesion * this.settings.weights.temporalProximity
    );
  }

  private calculateTotalModularity(clusters: Cluster[]): number {
    // Newman modularity calculation
    let modularity = 0;
    const totalEdges = this.links.length;
    
    if (totalEdges === 0) return 0;

    clusters.forEach(cluster => {
      const nodeIds = new Set(cluster.nodes.map(n => n.id));
      let internalEdges = 0;
      let clusterDegree = 0;

      // Count internal edges and total degree
      this.links.forEach(link => {
        const sourceInCluster = nodeIds.has(this.getNodeId(link.source));
        const targetInCluster = nodeIds.has(this.getNodeId(link.target));
        
        if (sourceInCluster && targetInCluster) {
          internalEdges++;
        }
        
        if (sourceInCluster || targetInCluster) {
          clusterDegree++;
        }
      });

      const expectedEdges = (clusterDegree * clusterDegree) / (4 * totalEdges);
      modularity += (internalEdges / totalEdges) - expectedEdges;
    });

    return Math.max(0, Math.min(1, modularity));
  }

  private createEmptyResult(): ClusteringResult {
    return {
      clusters: [],
      modularity: 0,
      coverage: 0,
      orphanNodes: [...this.nodes]
    };
  }

  /**
   * Update settings and recalculate if needed
   */
  public updateSettings(newSettings: SmartClusteringSettings): void {
    const needsReclustering = 
      newSettings.algorithm !== this.settings.algorithm ||
      newSettings.minClusterSize !== this.settings.minClusterSize ||
      newSettings.maxClusters !== this.settings.maxClusters ||
      newSettings.resolution !== this.settings.resolution ||
      JSON.stringify(newSettings.weights) !== JSON.stringify(this.settings.weights);

    this.settings = { ...newSettings };

    if (needsReclustering && this.nodes.length > 0) {
      // Trigger reclustering on next call
      this.lastClusteringResult = null;
    }
  }

  /**
   * Get current clustering result
   */
  public getCurrentClusters(): Cluster[] {
    return this.lastClusteringResult?.clusters || [];
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): Record<string, unknown> | null {
    if (!this.settings.debugMode || !this.lastClusteringResult) {
      return null;
    }

    return {
      algorithm: this.settings.algorithm,
      clusterCount: this.lastClusteringResult.clusters.length,
      modularity: this.lastClusteringResult.modularity,
      coverage: this.lastClusteringResult.coverage,
      orphanCount: this.lastClusteringResult.orphanNodes.length,
      weights: this.settings.weights,
      clusterDetails: this.lastClusteringResult.clusters.map(cluster => ({
        id: cluster.id,
        size: cluster.nodes.length,
        type: cluster.type,
        strength: cluster.strength,
        label: cluster.label
      }))
    };
  }

  // Additional helper methods for modularity and merge calculations
  private getClusterEdges(nodeIds: string[]): number {
    const nodeSet = new Set(nodeIds);
    return this.links.filter(link => 
      nodeSet.has(this.getNodeId(link.source)) && nodeSet.has(this.getNodeId(link.target))
    ).length;
  }

  private calculateModularity(clusters: Array<{ nodeIds: string[] }>): number {
    let modularity = 0;
    const totalEdges = this.links.length;
    
    if (totalEdges === 0) return 0;

    clusters.forEach(cluster => {
      const internalEdges = this.getClusterEdges(cluster.nodeIds);
      const totalDegree = this.getTotalDegree(cluster.nodeIds);
      
      const fraction = internalEdges / totalEdges;
      const expected = (totalDegree / (2 * totalEdges)) ** 2;
      
      modularity += fraction - expected;
    });

    return modularity;
  }

  private getTotalDegree(nodeIds: string[]): number {
    const nodeSet = new Set(nodeIds);
    let degree = 0;
    
    this.links.forEach(link => {
      if (nodeSet.has(this.getNodeId(link.source)) || nodeSet.has(this.getNodeId(link.target))) {
        degree++;
      }
    });
    
    return degree;
  }

  private calculateMergeGain(clusters: Array<{ id: string; nodeIds: string[] }>, i: number, j: number): number {
    const cluster1 = clusters[i];
    const cluster2 = clusters[j];
    
    const beforeModularity = this.calculateModularity([cluster1, cluster2]);
    
    const mergedCluster = {
      nodeIds: [...cluster1.nodeIds, ...cluster2.nodeIds]
    };
    
    const afterModularity = this.calculateModularity([mergedCluster]);
    
    return afterModularity - beforeModularity;
  }

  private mergeClusters(clusters: Array<{ id: string; nodeIds: string[] }>, i: number, j: number): void {
    const cluster1 = clusters[i];
    const cluster2 = clusters[j];
    
    cluster1.nodeIds.push(...cluster2.nodeIds);
    void clusters.splice(j, 1);
  }

  private splitCluster(cluster: Cluster): Cluster[] {
    // Simple split for now - could be enhanced with more sophisticated algorithms
    const midpoint = Math.floor(cluster.nodes.length / 2);
    const nodes1 = cluster.nodes.slice(0, midpoint);
    const nodes2 = cluster.nodes.slice(midpoint);
    
    return [
      this.createCluster(`${cluster.id}_1`, nodes1),
      this.createCluster(`${cluster.id}_2`, nodes2)
    ];
  }

  private getClusterTags(clusterId: string, nodeClusters: Map<string, string>): string[] {
    const tags = new Set<string>();
    
    this.nodes.forEach(node => {
      if (nodeClusters.get(node.id) === clusterId) {
        const nodeTags = node.metadata?.tags || [];
        nodeTags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags);
  }

  private getClusterPaths(clusterId: string, nodeClusters: Map<string, string>): string[] {
    const paths: string[] = [];
    
    this.nodes.forEach(node => {
      if (nodeClusters.get(node.id) === clusterId) {
        const path = this.getNodePath(node);
        if (path) paths.push(path);
      }
    });
    
    return paths;
  }

  /**
   * Recalculate cluster positions after nodes have been positioned by force simulation
   */
  public recalculateClusterPositions(): void {
    if (!this.lastClusteringResult) return;

    void logger.debug('smart-clustering', 'Recalculating cluster positions after force simulation');

    this.lastClusteringResult.clusters.forEach(cluster => {
      // Recalculate centroid with actual node positions
      const newCentroid = this.calculateCentroid(cluster.nodes);
      cluster.centroid = newCentroid;
      
      // Recalculate radius with actual positions
      cluster.radius = this.calculateClusterRadius(cluster.nodes, newCentroid);
    });

    logger.debug('smart-clustering', 'Cluster positions recalculated', {
      clusterCount: this.lastClusteringResult.clusters.length
    });
  }
}