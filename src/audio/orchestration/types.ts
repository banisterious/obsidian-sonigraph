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

// ============================================================================
// Phase 6.2: Dynamic Orchestration Type Definitions
// ============================================================================

/**
 * Vault complexity metrics for orchestration decisions
 */
export interface VaultComplexity {
  totalNodes: number;
  totalLinks: number;
  averageDegree: number;
  clusterCount: number;
  maxDepth: number;
  complexityScore: number; // 0-1: Normalized complexity
  tier: ComplexityTier;
}

/**
 * Complexity tiers for layer activation
 */
export type ComplexityTier =
  | 'minimal'      // 0-100 nodes: Basic instruments only
  | 'simple'       // 100-500 nodes: Add rhythmic layers
  | 'moderate'     // 500-1000 nodes: Add harmonic pads
  | 'complex'      // 1000-5000 nodes: Full orchestral arrangement
  | 'extensive';   // 5000+ nodes: Maximum complexity with all layers

/**
 * Complexity threshold configuration
 */
export interface ComplexityThreshold {
  tier: ComplexityTier;
  minNodes: number;
  maxNodes: number;
  enabledLayers: OrchestrationLayer[];
  instrumentDensity: number; // 0-1: How many instruments to activate
  harmonyComplexity: number; // 0-1: Chord complexity for this tier
}

/**
 * Orchestration layers that can be activated
 */
export type OrchestrationLayer =
  | 'basic-melody'     // Always active
  | 'rhythmic'         // Active at simple+
  | 'harmonic-pad'     // Active at moderate+
  | 'bass-line'        // Active at moderate+
  | 'counter-melody'   // Active at complex+
  | 'orchestral-fills' // Active at complex+
  | 'ambient-texture'; // Active at extensive

/**
 * Time-of-day periods for temporal influence
 */
export type TimeOfDay =
  | 'early-morning'  // 5am-8am: Bright, awakening sounds
  | 'morning'        // 8am-12pm: Energetic, clear tones
  | 'afternoon'      // 12pm-5pm: Warm, balanced
  | 'evening'        // 5pm-9pm: Mellow, reflective
  | 'night'          // 9pm-12am: Darker, atmospheric
  | 'late-night';    // 12am-5am: Minimal, ambient

/**
 * Seasonal periods for temporal influence
 */
export type Season =
  | 'spring'  // March-May: Bright, light instruments
  | 'summer'  // June-August: Full, rich orchestration
  | 'autumn'  // September-November: Warm, reflective tones
  | 'winter'; // December-February: Cool, crystalline sounds

/**
 * Temporal influence on instrument selection
 */
export interface TemporalInfluence {
  timeOfDay: TimeOfDay;
  season: Season;
  instrumentBrightness: number;  // 0-1: Affects filter cutoff
  orchestralDensity: number;     // 0-1: How many instruments to use
  preferredInstruments: string[]; // Instruments fitting this time/season
  timbreAdjustment: number;      // -1 to 1: Darker to brighter
}

/**
 * Instrument layer configuration
 */
export interface InstrumentLayer {
  id: string;
  layerType: OrchestrationLayer;
  instruments: string[];         // Instruments for this layer
  volume: number;                // 0-1
  enabled: boolean;
  activationThreshold: ComplexityTier;
  temporalSensitivity: number;   // 0-1: How much temporal influence affects this layer
}

/**
 * Dynamic orchestration configuration
 */
export interface DynamicOrchestrationSettings {
  enabled: boolean;
  complexityThresholds: ComplexityThreshold[];
  customThresholds: boolean;     // Use custom vs default thresholds
  temporalInfluenceEnabled: boolean;
  timeOfDayInfluence: number;    // 0-1: Strength of time-of-day effect
  seasonalInfluence: number;     // 0-1: Strength of seasonal effect
  transitionDuration: number;    // Seconds: How long to transition between tiers
  autoAdjust: boolean;           // Automatically adjust based on vault changes
}

/**
 * Current orchestration state
 */
export interface OrchestrationState {
  currentComplexity: VaultComplexity;
  activeTier: ComplexityTier;
  previousTier: ComplexityTier;
  activeLayers: Set<OrchestrationLayer>;
  temporalInfluence: TemporalInfluence;
  activeInstrumentLayers: InstrumentLayer[];
  transitionProgress: number;    // 0-1: Progress of tier transition
  lastUpdateTime: number;
}