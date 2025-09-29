/**
 * Types and interfaces for Phase 5.1: Cluster-Based Musical Themes
 *
 * Defines audio mapping for different cluster types and transition events
 */

import { GraphNode } from '../../graph/types';
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