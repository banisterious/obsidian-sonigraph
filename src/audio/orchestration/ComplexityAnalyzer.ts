/**
 * Phase 6.2: Complexity Analyzer
 *
 * Evaluates vault complexity based on node count, link density, clustering,
 * and folder structure to determine appropriate orchestration tier.
 */

import { GraphNode, GraphLink } from '../../graph/GraphDataExtractor';
import { Cluster } from '../../graph/SmartClusteringAlgorithms';
import {
  VaultComplexity,
  ComplexityTier,
  ComplexityThreshold
} from './types';

export class ComplexityAnalyzer {
  private complexityThresholds: ComplexityThreshold[];

  constructor() {
    this.complexityThresholds = this.getDefaultThresholds();
  }

  /**
   * Evaluate vault complexity from graph data
   */
  evaluateComplexity(
    nodes: GraphNode[],
    links: GraphLink[],
    clusters?: Cluster[]
  ): VaultComplexity {
    const totalNodes = nodes.length;
    const totalLinks = links.length;

    // Calculate average degree (connections per node)
    const averageDegree = totalNodes > 0 ? totalLinks / totalNodes : 0;

    // Calculate cluster count
    const clusterCount = clusters?.length || 0;

    // Calculate maximum folder depth
    const maxDepth = this.calculateMaxDepth(nodes);

    // Calculate normalized complexity score (0-1)
    const complexityScore = this.calculateComplexityScore(
      totalNodes,
      totalLinks,
      averageDegree,
      clusterCount,
      maxDepth
    );

    // Determine complexity tier
    const tier = this.determineComplexityTier(totalNodes);

    return {
      totalNodes,
      totalLinks,
      averageDegree,
      clusterCount,
      maxDepth,
      complexityScore,
      tier
    };
  }

  /**
   * Calculate maximum folder depth from nodes
   */
  private calculateMaxDepth(nodes: GraphNode[]): number {
    let maxDepth = 0;

    for (const node of nodes) {
      // Calculate depth from path (count forward slashes)
      const depth = node.path.split('/').length - 1;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    }

    return maxDepth;
  }

  /**
   * Calculate normalized complexity score (0-1)
   *
   * Factors:
   * - Node count (40%): More nodes = more complex
   * - Link density (30%): More connections = more complex
   * - Cluster count (20%): More clusters = more structure
   * - Folder depth (10%): Deeper hierarchy = more organization
   */
  private calculateComplexityScore(
    nodes: number,
    links: number,
    avgDegree: number,
    clusters: number,
    maxDepth: number
  ): number {
    // Normalize node count (logarithmic scale for large vaults)
    const nodeScore = Math.min(1, Math.log10(nodes + 1) / 4); // log10(10000) ≈ 4

    // Normalize link density (average degree of 10 = high density)
    const linkScore = Math.min(1, avgDegree / 10);

    // Normalize cluster count (50 clusters = very structured)
    const clusterScore = Math.min(1, clusters / 50);

    // Normalize folder depth (10 levels = deeply nested)
    const depthScore = Math.min(1, maxDepth / 10);

    // Weighted combination
    const complexityScore =
      nodeScore * 0.4 +
      linkScore * 0.3 +
      clusterScore * 0.2 +
      depthScore * 0.1;

    return Math.max(0, Math.min(1, complexityScore));
  }

  /**
   * Determine complexity tier based on node count
   */
  private determineComplexityTier(nodeCount: number): ComplexityTier {
    const threshold = this.complexityThresholds.find(
      t => nodeCount >= t.minNodes && nodeCount < t.maxNodes
    );

    return threshold?.tier || 'extensive';
  }

  /**
   * Get default complexity thresholds
   */
  private getDefaultThresholds(): ComplexityThreshold[] {
    return [
      {
        tier: 'minimal',
        minNodes: 0,
        maxNodes: 100,
        enabledLayers: ['basic-melody'],
        instrumentDensity: 0.3,
        harmonyComplexity: 0.3
      },
      {
        tier: 'simple',
        minNodes: 100,
        maxNodes: 500,
        enabledLayers: ['basic-melody', 'rhythmic'],
        instrumentDensity: 0.5,
        harmonyComplexity: 0.5
      },
      {
        tier: 'moderate',
        minNodes: 500,
        maxNodes: 1000,
        enabledLayers: ['basic-melody', 'rhythmic', 'harmonic-pad', 'bass-line'],
        instrumentDensity: 0.7,
        harmonyComplexity: 0.7
      },
      {
        tier: 'complex',
        minNodes: 1000,
        maxNodes: 5000,
        enabledLayers: [
          'basic-melody',
          'rhythmic',
          'harmonic-pad',
          'bass-line',
          'counter-melody',
          'orchestral-fills'
        ],
        instrumentDensity: 0.85,
        harmonyComplexity: 0.85
      },
      {
        tier: 'extensive',
        minNodes: 5000,
        maxNodes: Infinity,
        enabledLayers: [
          'basic-melody',
          'rhythmic',
          'harmonic-pad',
          'bass-line',
          'counter-melody',
          'orchestral-fills',
          'ambient-texture'
        ],
        instrumentDensity: 1.0,
        harmonyComplexity: 1.0
      }
    ];
  }

  /**
   * Update complexity thresholds (for custom user configuration)
   */
  setComplexityThresholds(thresholds: ComplexityThreshold[]): void {
    this.complexityThresholds = thresholds;
  }

  /**
   * Get current complexity thresholds
   */
  getComplexityThresholds(): ComplexityThreshold[] {
    return this.complexityThresholds;
  }

  /**
   * Get threshold for specific tier
   */
  getThresholdForTier(tier: ComplexityTier): ComplexityThreshold | undefined {
    return this.complexityThresholds.find(t => t.tier === tier);
  }

  /**
   * Check if vault complexity requires tier change
   */
  shouldChangeTier(
    currentTier: ComplexityTier,
    newComplexity: VaultComplexity
  ): boolean {
    return currentTier !== newComplexity.tier;
  }

  /**
   * Get complexity change direction
   */
  getTierChangeDirection(
    currentTier: ComplexityTier,
    newTier: ComplexityTier
  ): 'increase' | 'decrease' | 'none' {
    const tierOrder: ComplexityTier[] = [
      'minimal',
      'simple',
      'moderate',
      'complex',
      'extensive'
    ];

    const currentIndex = tierOrder.indexOf(currentTier);
    const newIndex = tierOrder.indexOf(newTier);

    if (newIndex > currentIndex) return 'increase';
    if (newIndex < currentIndex) return 'decrease';
    return 'none';
  }

  /**
   * Calculate recommended instrument count for complexity
   */
  getRecommendedInstrumentCount(complexity: VaultComplexity): number {
    const threshold = this.getThresholdForTier(complexity.tier);
    if (!threshold) return 3;

    // Base instrument count by tier
    const baseCount = {
      minimal: 3,
      simple: 5,
      moderate: 8,
      complex: 12,
      extensive: 16
    };

    const base = baseCount[complexity.tier];

    // Adjust by complexity score
    const adjustment = Math.floor(complexity.complexityScore * 4);

    return base + adjustment;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.complexityThresholds = [];
  }
}