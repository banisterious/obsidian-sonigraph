/**
 * Type definitions for continuous audio layer system
 * Supports 13 musical genres with dynamic parameter modulation
 */

import { GraphNode } from '../../graph/types';

export type MusicalGenre = 
  | 'ambient' 
  | 'drone' 
  | 'orchestral' 
  | 'electronic' 
  | 'minimal' 
  | 'oceanic' 
  | 'sci-fi' 
  | 'experimental' 
  | 'industrial' 
  | 'urban' 
  | 'nature' 
  | 'mechanical' 
  | 'organic';

export interface ContinuousLayerConfig {
  enabled: boolean;
  genre: MusicalGenre;
  intensity: number; // 0-1 scale
  evolutionRate: number; // How quickly parameters change
  baseVolume: number; // Base volume level (-60 to 0 dB)
  adaptiveIntensity: boolean; // Whether intensity responds to vault state
}

export interface VaultState {
  totalNodes: number;
  maxNodes: number;
  currentAnimationProgress: number; // 0-1
  vaultActivityLevel: number; // Recent event frequency
  visibleNodes: Set<string>;
  clusters?: ClusterInfo[];
}

export interface ClusterInfo {
  id: string;
  type: 'tag-based' | 'temporal' | 'link-dense' | 'community';
  strength: number;
  nodes: GraphNode[];
}

export interface ActivityMetrics {
  recentEventCount: number; // Events in last 5 seconds
  eventRate: number; // Events per second
  intensitySpikes: boolean; // True if >5 simultaneous events
  averageEventSpacing: number; // Average time between events
}

export interface MusicalContext {
  vaultState: VaultState;
  activityMetrics: ActivityMetrics;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  seasonalContext?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface GenreParameters {
  // Synthesis parameters that vary by genre
  filterCutoff: number; // Hz
  resonance: number; // 0-40
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0-1
  release: number; // seconds
  
  // Modulation parameters
  lfoRate: number; // Hz
  lfoDepth: number; // 0-1
  
  // Effects parameters
  reverbAmount: number; // 0-1
  delayTime: string; // Note value like "8n"
  delayFeedback: number; // 0-1
  distortionAmount: number; // 0-1
  
  // Genre-specific parameters
  harmonicContent: number; // Number of harmonics/voices
  stereoSpread: number; // 0-1 for stereo width
  brightness: number; // High-frequency content 0-1
}

export interface FreesoundSample {
  id: number;
  title: string;
  previewUrl: string; // preview-hq-mp3 URL
  duration: number;
  license: string;
  attribution: string;
  fadeIn: number; // Fade in duration in seconds
  fadeOut: number; // Fade out duration in seconds
  enabled?: boolean; // Whether this sample is enabled for playback (default: true)
}

export interface LayerState {
  isPlaying: boolean;
  currentGenre: MusicalGenre;
  intensity: number;
  lastParameterUpdate: number;
  activeVoices: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface RhythmicLayerConfig {
  enabled: boolean;
  baseTempo: number; // BPM
  tempoRange: [number, number]; // Min/max BPM based on activity
  percussionIntensity: number; // 0-1
  arpeggioComplexity: number; // 0-1, affects pattern complexity
  activitySensitivity: number; // How responsive to vault activity
}

export interface HarmonicLayerConfig {
  enabled: boolean;
  chordComplexity: number; // Number of voices in chords
  progressionSpeed: number; // How fast harmonies change
  dissonanceLevel: number; // 0-1, affects harmonic tension
  clusterInfluence: number; // How much clusters affect harmony
  scaleConstraints: boolean; // Whether to constrain to musical scale
}

export interface MusicalScale {
  name: string;
  intervals: number[]; // Semitone intervals from root
  key: string; // Root note
  mode?: string; // Modal variation
}

export interface ChordProgression {
  chords: string[]; // Chord symbols like "Cmaj7", "Am", etc.
  durations: number[]; // Duration of each chord in beats
  key: string;
  scale: MusicalScale;
}

// Error handling for continuous layers
export class ContinuousLayerError extends Error {
  constructor(
    message: string,
    public layerType: 'ambient' | 'rhythmic' | 'harmonic',
    public genre?: MusicalGenre
  ) {
    super(`[${layerType}${genre ? `-${genre}` : ''}] ${message}`);
    this.name = 'ContinuousLayerError';
  }
}

// Performance monitoring
export interface LayerPerformanceMetrics {
  layerType: 'ambient' | 'rhythmic' | 'harmonic';
  genre?: MusicalGenre;
  cpuUsage: number; // Percentage
  memoryUsage: number; // MB
  activeVoices: number;
  bufferUnderruns: number;
  lastUpdate: number;
}