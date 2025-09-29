/**
 * Phase 5.2: Hub Node Orchestration Type Definitions
 *
 * Defines types for hub-based orchestration where central nodes
 * act as "conductors" to drive cluster audio dynamics.
 */

import { GraphNode } from '../../graph/GraphDataExtractor';
import { Cluster, ClusterType } from '../../graph/SmartClusteringAlgorithms';

/**
 * Hub centrality metrics for a node
 */
export interface HubMetrics {
  nodeId: string;
  degreeCentrality: number;      // 0-1: Connection count normalized
  betweennessCentrality: number; // 0-1: How often node is on shortest paths
  eigenvectorCentrality: number; // 0-1: Connected to well-connected nodes
  pageRank: number;              // 0-1: Google PageRank algorithm
  compositeScore: number;        // 0-1: Weighted combination of all metrics
  isHub: boolean;                // True if score exceeds threshold
}

/**
 * Weights for combining centrality metrics into composite score
 */
export interface CentralityWeights {
  degree: number;       // Default: 0.3 - Basic connectivity
  betweenness: number;  // Default: 0.3 - Bridge importance
  eigenvector: number;  // Default: 0.2 - Network influence
  pageRank: number;     // Default: 0.2 - Authority score
}

/**
 * Hub orchestration configuration
 */
export interface HubOrchestrationSettings {
  enabled: boolean;
  hubThreshold: number;              // 0-1: Minimum composite score to be hub (default: 0.6)
  prominenceMultiplier: number;      // 1-5: How much louder hubs are (default: 2.0)
  orchestrationMode: OrchestrationMode;
  transitionsEnabled: boolean;       // Enable hub emergence/demise audio
  centralityWeights: CentralityWeights;
  hubInstrumentPreference: string[]; // Preferred instruments for hub nodes
}

/**
 * Orchestration modes
 */
export type OrchestrationMode =
  | 'hub-led'      // Hubs dominate, clear leader-follower hierarchy
  | 'democratic'   // All nodes equal volume, no hub prominence
  | 'balanced';    // Moderate hub prominence (default)

/**
 * Orchestration decisions for a cluster
 */
export interface OrchestrationDecisions {
  clusterId: string;
  hubNodeId: string | null;
  leadInstrument: string;                    // Hub node instrument
  accompanyingInstruments: string[];         // Peripheral node instruments
  harmonyComplexity: number;                 // 0-1: Hub score affects complexity
  volumeDistribution: Map<string, number>;   // Per-node volume (0-1)
  spatialPositioning: Map<string, number>;   // Per-node pan (-1 to 1)
  hubDistances: Map<string, number>;         // Graph distance from hub
}

/**
 * Hub transition event types
 */
export type HubTransitionType =
  | 'hub-emergence'  // Node becomes a hub (crosses threshold)
  | 'hub-demise'     // Hub loses centrality (falls below threshold)
  | 'hub-shift';     // Hub role transfers to different node

/**
 * Hub transition event
 */
export interface HubTransitionEvent {
  type: HubTransitionType;
  nodeId: string;
  previousScore: number;
  newScore: number;
  clusterId?: string;
  timestamp: number;
  audioConfig: HubTransitionAudioConfig;
}

/**
 * Audio configuration for hub transitions
 */
export interface HubTransitionAudioConfig {
  duration: number;           // Transition duration in seconds
  volumeCurve: 'linear' | 'exponential' | 'logarithmic';
  instrumentTransition: boolean; // Change instrument during transition
  harmonicEnrichment: number;    // 0-1: Add harmonics during emergence
  effectType: HubTransitionEffectType;
}

/**
 * Audio effect types for hub transitions
 */
export type HubTransitionEffectType =
  | 'crescendo'           // Volume increase with harmonic buildup
  | 'decrescendo'         // Volume decrease with harmonic simplification
  | 'instrument-morph'    // Smooth instrument change
  | 'spotlight'           // Sudden prominence with reverb
  | 'fadeout';            // Graceful exit with release

/**
 * Hub prominence tier based on composite score
 */
export type HubProminenceTier =
  | 'peripheral'   // Score < 0.4: Subtle, background
  | 'intermediate' // Score 0.4-0.6: Supporting
  | 'near-hub'     // Score 0.6-0.8: Prominent
  | 'hub'          // Score > 0.8: Lead/conductor
  | 'super-hub';   // Score > 0.9: Dominant central node

/**
 * Hub role assignment within cluster
 */
export interface HubRoleAssignment {
  nodeId: string;
  role: 'conductor' | 'lead' | 'harmony' | 'accompaniment' | 'ambient';
  tier: HubProminenceTier;
  volume: number;        // 0-1
  complexity: number;    // 0-1: Harmonic complexity
  instrument: string;
}

/**
 * Distance-based audio scaling
 */
export interface DistanceScaling {
  distance: number;      // Graph distance from hub (0 = hub itself)
  volumeScale: number;   // 0-1: Volume multiplier
  complexityScale: number; // 0-1: Harmony complexity multiplier
  panPosition: number;   // -1 to 1: Stereo position
}

/**
 * Hub orchestration state for tracking
 */
export interface HubOrchestrationState {
  currentHubs: Map<string, HubMetrics>;           // Node ID → metrics
  previousHubs: Map<string, HubMetrics>;          // For transition detection
  activeTransitions: Map<string, HubTransitionEvent>; // Transition ID → event
  clusterOrchestrations: Map<string, OrchestrationDecisions>; // Cluster ID → decisions
  lastUpdateTime: number;
}

/**
 * Hub analysis result for cluster
 */
export interface ClusterHubAnalysis {
  clusterId: string;
  hubCount: number;
  primaryHub: GraphNode | null;
  secondaryHubs: GraphNode[];
  peripheralNodes: GraphNode[];
  averageHubScore: number;
  hubScoreDistribution: {
    min: number;
    max: number;
    median: number;
    standardDeviation: number;
  };
}