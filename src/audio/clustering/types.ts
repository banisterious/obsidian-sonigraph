/**
 * Types and interfaces for Phase 5.1: Cluster-Based Musical Themes
 *
 * Defines audio mapping for different cluster types and transition events
 */

import { GraphNode } from '../../graph/GraphDataExtractor';
import { Cluster } from '../../graph/SmartClusteringAlgorithms';

/**
 * Audio theme configuration for each cluster type
 */
export interface ClusterAudioTheme {
  id: string;
  clusterType: ClusterType;
  name: string;
  description: string;

  // Base audio characteristics
  baseFrequency: number;
  harmonicIntervals: number[]; // Array of harmonic intervals in semitones
  timbreProfile: TimbreProfile;
  dynamicsRange: DynamicsRange;

  // Modulation parameters
  modulationRate: number; // LFO speed
  modulationDepth: number; // 0-1
  filterCutoff: number; // Base filter frequency
  resonance: number; // Filter resonance

  // Spatial characteristics
  panningBehavior: 'static' | 'dynamic' | 'cluster-based';
  reverbAmount: number; // 0-1

  // Evolution parameters
  evolutionSpeed: number; // How fast the theme evolves
  complexityFactor: number; // Increases complexity with cluster strength
}

/**
 * Cluster types matching SmartClusteringAlgorithms
 */
export type ClusterType = 'tag-based' | 'folder-based' | 'link-dense' | 'temporal' | 'community';

/**
 * Timbre profile for cluster audio themes
 */
export interface TimbreProfile {
  brightness: number; // 0-1, controls high frequency content
  warmth: number; // 0-1, controls mid-frequency richness
  thickness: number; // 0-1, controls low frequency presence
  texture: 'smooth' | 'granular' | 'harmonic' | 'noise' | 'organic';
}

/**
 * Dynamic range characteristics
 */
export interface DynamicsRange {
  baseVolume: number; // 0-1
  velocityRange: [number, number]; // Min/max velocity
  attackTime: number; // ADSR attack in seconds
  decayTime: number; // ADSR decay in seconds
  sustainLevel: number; // ADSR sustain level 0-1
  releaseTime: number; // ADSR release in seconds
}

/**
 * Cluster transition event types
 */
export type ClusterTransitionType = 'join' | 'leave' | 'formation' | 'dissolution' | 'strength_change';

/**
 * Configuration for cluster transition audio events
 */
export interface ClusterTransitionEvent {
  type: ClusterTransitionType;
  clusterId: string;
  clusterType: ClusterType;
  nodeId?: string; // For join/leave events
  strength?: number; // For strength_change events
  timestamp: number;

  // Audio parameters for the transition
  audioConfig: {
    duration: number; // Duration of transition effect in seconds
    pitchDirection: 'ascending' | 'descending' | 'stable';
    pitchRange: number; // Semitones to traverse
    volumeFade: 'in' | 'out' | 'cross' | 'none';
    effectType: 'glissando' | 'harmonic_buildup' | 'filter_sweep' | 'granular_scatter';
  };
}

/**
 * Settings for cluster-based audio themes
 */
export interface ClusterAudioSettings {
  enabled: boolean;
  globalVolume: number; // 0-1, master volume for all cluster audio

  // Individual cluster type toggles
  clusterTypeEnabled: Record<ClusterType, boolean>;

  // Per-cluster-type volume controls
  clusterTypeVolumes: Record<ClusterType, number>;

  // Transition settings
  transitionsEnabled: boolean;
  transitionVolume: number; // 0-1
  transitionSpeed: number; // 0.1-5.0, speed multiplier

  // Advanced settings
  realTimeUpdates: boolean; // Update audio as clusters change
  strengthModulation: boolean; // Modulate audio based on cluster strength
  strengthSensitivity: number; // 0.1-2.0, how responsive to strength changes
  spatialAudio: boolean; // Use cluster positions for panning

  // Performance settings
  maxSimultaneousClusters: number; // Limit concurrent cluster audio
  updateThrottleMs: number; // Throttle cluster updates to prevent crackling
}

/**
 * Current state of cluster audio system
 */
export interface ClusterAudioState {
  activeClusters: Map<string, ActiveClusterAudio>;
  activeTransitions: Map<string, ClusterTransitionEvent>;
  lastUpdateTime: number;
  currentStrengthValues: Map<string, number>;
}

/**
 * Active cluster audio instance
 */
export interface ActiveClusterAudio {
  clusterId: string;
  clusterType: ClusterType;
  theme: ClusterAudioTheme;

  // Audio instances (will be Tone.js objects)
  audioSource: any; // Tone.Synth or similar
  effectChain: any; // Tone effects chain

  // Current audio parameters
  currentFrequency: number;
  currentVolume: number;
  currentFilter: number;

  // State tracking
  isPlaying: boolean;
  lastStrengthUpdate: number;
  nodeCount: number;
}

/**
 * Hub node orchestration configuration
 */
export interface HubNodeAudioConfig {
  enabled: boolean;
  hubThreshold: number; // Minimum connections to be considered a hub
  orchestrationIntensity: number; // 0-1, how prominent hub audio is

  // Hub-specific audio characteristics
  hubAudioTheme: {
    baseInstrument: string;
    harmonicComplexity: number; // More complex harmonies for hub nodes
    spatialPresence: number; // How much space the hub audio takes
    connectionResonance: boolean; // Audio reflects number of connections
  };

  // Hub transition effects
  hubFormation: {
    enabled: boolean;
    effectType: 'orchestral_swell' | 'harmonic_convergence' | 'rhythmic_emphasis';
    duration: number;
  };
}

/**
 * Community detection audio configuration
 */
export interface CommunityAudioConfig {
  enabled: boolean;

  // Community-specific themes
  communityThemes: {
    largeStable: ClusterAudioTheme; // Large, stable communities
    smallDynamic: ClusterAudioTheme; // Small, changing communities
    bridgeCommunities: ClusterAudioTheme; // Communities that bridge others
    isolatedCommunities: ClusterAudioTheme; // Isolated community groups
  };

  // Community evolution audio
  evolutionEffects: {
    communityMerge: ClusterTransitionEvent;
    communitySplit: ClusterTransitionEvent;
    communityGrowth: ClusterTransitionEvent;
    communityDecline: ClusterTransitionEvent;
  };
}

/**
 * Result of cluster audio analysis
 */
export interface ClusterAudioAnalysis {
  clusterId: string;
  audioTheme: ClusterAudioTheme;
  recommendedVolume: number;
  spatialPosition: { pan: number; depth: number };
  transitionEvents: ClusterTransitionEvent[];
  hubNodes: string[]; // Node IDs that are hubs within this cluster
}

// ============================================================================
// Phase 5.3: Community Detection Audio Types
// ============================================================================

/**
 * Community type classifications
 */
export type CommunityType =
  | 'large-stable'      // Large, stable communities with rich orchestral sound
  | 'small-dynamic'     // Small, agile communities with chamber music
  | 'bridge'            // Bridge communities connecting other communities
  | 'isolated'          // Isolated communities with unique characteristics
  | 'hierarchical';     // Hierarchical communities with nested structures

/**
 * Community structure extending Cluster
 */
export interface Community {
  id: string;
  nodes: GraphNode[];
  type: CommunityType;
  characteristics: CommunityCharacteristics;
  strength: number;
  centroid: { x: number; y: number };
  radius: number;
  label: string;

  // Hierarchy information
  hierarchyLevel: number;
  parentCommunityId?: string;
  subCommunities: string[];
}

/**
 * Community characteristics for audio mapping
 */
export interface CommunityCharacteristics {
  size: number;
  density: number; // 0-1, how densely connected the community is
  stability: number; // 0-1, temporal stability of the community
  connectionStrength: number; // Average strength of internal connections
  isBridge: boolean; // Whether this community bridges others
  isIsolated: boolean; // Whether this community is isolated
  internalConnections: number;
  externalConnections: number;
  cohesion: number; // Overall cohesiveness measure
}

/**
 * Audio theme for communities with orchestration
 */
export interface CommunityAudioTheme {
  id: string;
  communityType: CommunityType;
  name: string;
  description: string;

  // Base audio characteristics
  baseFrequency: number;
  harmonicIntervals: number[];
  timbreProfile: TimbreProfile;
  dynamicsRange: DynamicsRange;

  // Orchestration profile
  orchestrationProfile: OrchestrationProfile;

  // Modulation parameters
  modulationRate: number;
  modulationDepth: number;
  filterCutoff: number;
  resonance: number;

  // Spatial characteristics
  panningBehavior: 'static' | 'dynamic' | 'cluster-based';
  reverbAmount: number;
  spatialWidth: number; // Stereo width 0-1

  // Evolution parameters
  evolutionSpeed: number;
  complexityFactor: number;
  harmonyComplexity: number; // 0-1, harmonic richness
}

/**
 * Orchestration profile for community audio
 */
export interface OrchestrationProfile {
  voiceCount: number; // Number of simultaneous voices
  voiceSpread: number; // Pitch spread in semitones
  ensembleType: 'solo' | 'chamber-group' | 'mixed-ensemble' | 'sectional-orchestra' | 'full-orchestra';
  sectionBalance: {
    bass: number; // 0-1, bass presence
    mid: number; // 0-1, mid-range presence
    treble: number; // 0-1, treble presence
  };
}

/**
 * Community evolution event types
 */
export type CommunityEvolutionType =
  | 'merge'       // Communities merging together
  | 'split'       // Community splitting apart
  | 'growth'      // Community growing in size
  | 'decline'     // Community declining in size
  | 'bridging'    // Community forming bridges
  | 'formation'   // New community forming
  | 'dissolution'; // Community dissolving

/**
 * Community evolution event
 */
export interface CommunityEvolutionEvent {
  type: CommunityEvolutionType;
  communityId: string;
  sourceCommunityIds: string[]; // Communities involved in the evolution
  targetCommunityId?: string; // Target community for merge/formation
  targetCommunityIds?: string[]; // Target communities for split
  timestamp: number;
  intensity: number; // 0-1, intensity of the evolution
  affectedNodeCount: number;
}

/**
 * Community lifecycle state
 */
export interface CommunityLifecycleState {
  communityId: string;
  state: 'forming' | 'growing' | 'stable' | 'mature' | 'declining' | 'merging' | 'splitting' | 'bridging';
  age: number; // Number of update cycles
  previousState?: CommunityLifecycleState['state'];
  stateChangedAt: number;
}

/**
 * Settings for community detection audio
 */
export interface CommunityDetectionSettings {
  enabled: boolean;

  // Detection parameters
  largeCommunitySizeThreshold: number; // Minimum size for large community
  hierarchyAnalysis: boolean; // Enable hierarchy detection
  hierarchyContainmentThreshold: number; // 0-1, threshold for parent-child relationship

  // Audio parameters
  themeIntensity: number; // 0-2, global theme intensity multiplier
  communityTypeEnabled: Record<CommunityType, boolean>;
  communityTypeVolumes: Record<CommunityType, number>;

  // Spatial audio
  spatialAudio: boolean;
  spatialWidth: number; // 0-1, stereo width
}

/**
 * Settings for community evolution tracking
 */
export interface CommunityEvolutionSettings {
  enabled: boolean;

  // Evolution detection thresholds
  growthThreshold: number; // 0-1, minimum growth ratio to trigger event
  declineThreshold: number; // 0-1, minimum decline ratio to trigger event

  // Event audio settings
  eventAudioEnabled: boolean;
  enabledEventTypes: Record<CommunityEvolutionType, boolean>;
  eventVolumes: Record<CommunityEvolutionType, number>;
  eventThrottleMs: number; // Throttle duration for events
}