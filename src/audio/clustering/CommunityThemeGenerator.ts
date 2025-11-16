/**
 * CommunityThemeGenerator - Phase 5.3: Community Detection Audio
 *
 * Generates unique audio themes for different community types with
 * orchestral characteristics matching community structures
 */

import { getLogger } from '../../logging';
import {
  Community,
  CommunityType,
  CommunityAudioTheme,
  TimbreProfile,
  DynamicsRange,
  OrchestrationProfile
} from './types';

const logger = getLogger('community-themes');

/**
 * Generates community-specific audio themes
 */
export class CommunityThemeGenerator {
  private themes: Map<CommunityType, CommunityAudioTheme> = new Map();
  private isInitialized = false;
  private themeIntensity = 1.0; // Global theme intensity multiplier

  /**
   * Initialize theme generator with predefined community themes
   */
  public initialize(): Promise<void> {
    if (this.isInitialized) return;

    void logger.debug('initialization', 'Initializing community theme generator');

    // Generate themes for each community type
    this.themes.set('large-stable', this.createLargeStableTheme());
    this.themes.set('small-dynamic', this.createSmallDynamicTheme());
    this.themes.set('bridge', this.createBridgeTheme());
    this.themes.set('isolated', this.createIsolatedTheme());
    this.themes.set('hierarchical', this.createHierarchicalTheme());

    this.isInitialized = true;
    logger.debug('initialization', 'Community themes initialized', {
      themeCount: this.themes.size
    });
  }

  /**
   * Large Stable Communities → Deep, rich orchestral sections with sustained harmonies
   */
  private createLargeStableTheme(): CommunityAudioTheme {
    return {
      id: 'large-stable',
      communityType: 'large-stable',
      name: 'Orchestral Foundation',
      description: 'Deep, rich orchestral sound with sustained harmonies for large stable communities',

      // Deep, foundational frequencies
      baseFrequency: 110.00, // A2 - lower register for depth
      harmonicIntervals: [0, 7, 12, 16, 19, 24], // Perfect 5th, octave, major 3rd, minor 7th, two octaves

      timbreProfile: {
        brightness: 0.4, // Darker, more foundational
        warmth: 0.9, // Very warm for community cohesion
        thickness: 1.0, // Maximum thickness for orchestral fullness
        texture: 'harmonic' // Rich harmonic content
      },

      dynamicsRange: {
        baseVolume: 0.8,
        velocityRange: [0.6, 1.0],
        attackTime: 0.8, // Slow attack for orchestral swell
        decayTime: 1.2,
        sustainLevel: 0.95, // Very high sustain for stability
        releaseTime: 3.0 // Long release for richness
      },

      orchestrationProfile: {
        voiceCount: 6, // Multiple orchestral voices
        voiceSpread: 24, // Two octave spread
        ensembleType: 'full-orchestra',
        sectionBalance: {
          bass: 0.9, // Strong bass foundation
          mid: 0.8,
          treble: 0.5
        }
      },

      // Slow, stable modulation
      modulationRate: 0.3, // Very slow
      modulationDepth: 0.1, // Subtle
      filterCutoff: 1200, // Warm, foundational
      resonance: 0.2, // Low resonance for smoothness

      // Spatial characteristics
      panningBehavior: 'static', // Stable positioning
      reverbAmount: 0.8, // Rich reverb for orchestral depth
      spatialWidth: 1.0, // Full stereo width

      // Evolution parameters
      evolutionSpeed: 0.2, // Very slow evolution
      complexityFactor: 1.8, // High complexity for large community
      harmonyComplexity: 0.9 // Rich harmonic complexity
    };
  }

  /**
   * Small Dynamic Communities → Agile chamber music ensembles with quick transitions
   */
  private createSmallDynamicTheme(): CommunityAudioTheme {
    return {
      id: 'small-dynamic',
      communityType: 'small-dynamic',
      name: 'Chamber Ensemble',
      description: 'Agile chamber music with quick transitions for small dynamic communities',

      // Mid-range, agile frequencies
      baseFrequency: 293.66, // D4 - mid register for agility
      harmonicIntervals: [0, 3, 7, 10], // Minor 3rd, perfect 5th, minor 7th

      timbreProfile: {
        brightness: 0.8, // Bright for clarity and agility
        warmth: 0.5, // Balanced warmth
        thickness: 0.4, // Light for agility
        texture: 'organic' // Natural, chamber music texture
      },

      dynamicsRange: {
        baseVolume: 0.6,
        velocityRange: [0.3, 0.9],
        attackTime: 0.08, // Very quick attack for agility
        decayTime: 0.3,
        sustainLevel: 0.4, // Low sustain for quick transitions
        releaseTime: 0.5 // Short release for responsiveness
      },

      orchestrationProfile: {
        voiceCount: 3, // Small chamber ensemble
        voiceSpread: 12, // One octave spread
        ensembleType: 'chamber-group',
        sectionBalance: {
          bass: 0.4,
          mid: 0.8, // Focus on mid-range
          treble: 0.7
        }
      },

      // Fast, dynamic modulation
      modulationRate: 2.5, // Fast modulation for dynamics
      modulationDepth: 0.5, // Strong modulation
      filterCutoff: 3000, // Bright for presence
      resonance: 0.6, // Higher resonance for character

      // Spatial characteristics
      panningBehavior: 'dynamic', // Moving for activity
      reverbAmount: 0.3, // Less reverb for clarity
      spatialWidth: 0.6, // Moderate stereo width

      // Evolution parameters
      evolutionSpeed: 1.5, // Fast evolution for dynamic nature
      complexityFactor: 1.0, // Moderate complexity
      harmonyComplexity: 0.5 // Simpler harmonies for agility
    };
  }

  /**
   * Bridge Communities → Harmonic progressions that connect disparate musical keys
   */
  private createBridgeTheme(): CommunityAudioTheme {
    return {
      id: 'bridge',
      communityType: 'bridge',
      name: 'Harmonic Bridge',
      description: 'Harmonic progressions connecting different musical spaces',

      // Pivot frequency for bridging
      baseFrequency: 261.63, // C4 - central pivot point
      harmonicIntervals: [0, 2, 5, 7, 9, 14], // Whole tone and modal intervals for bridging

      timbreProfile: {
        brightness: 0.7, // Clear for connection
        warmth: 0.6, // Balanced warmth
        thickness: 0.6, // Medium thickness
        texture: 'smooth' // Smooth transitions
      },

      dynamicsRange: {
        baseVolume: 0.7,
        velocityRange: [0.4, 0.8],
        attackTime: 0.4, // Moderate attack for transition
        decayTime: 0.6,
        sustainLevel: 0.6, // Moderate sustain
        releaseTime: 1.8 // Longer release for connection
      },

      orchestrationProfile: {
        voiceCount: 4, // Moderate ensemble
        voiceSpread: 14, // Extended spread for bridging
        ensembleType: 'mixed-ensemble',
        sectionBalance: {
          bass: 0.6,
          mid: 0.9, // Strong mid-range for bridging
          treble: 0.6
        }
      },

      // Progressive modulation for bridging
      modulationRate: 1.0, // Moderate modulation
      modulationDepth: 0.4, // Significant modulation for transition
      filterCutoff: 2200, // Balanced filter
      resonance: 0.4, // Moderate resonance

      // Spatial characteristics
      panningBehavior: 'dynamic', // Moving between spaces
      reverbAmount: 0.5, // Moderate reverb for space
      spatialWidth: 0.8, // Wide for bridging

      // Evolution parameters
      evolutionSpeed: 0.8, // Moderate-fast evolution for transitions
      complexityFactor: 1.3, // Moderate-high complexity
      harmonyComplexity: 0.8 // Complex harmonies for bridging
    };
  }

  /**
   * Isolated Communities → Unique timbres and scales that stand apart
   */
  private createIsolatedTheme(): CommunityAudioTheme {
    return {
      id: 'isolated',
      communityType: 'isolated',
      name: 'Unique Voice',
      description: 'Distinctive timbres and scales for isolated communities',

      // Unique frequency for distinctiveness
      baseFrequency: 369.99, // F#4 - unique pitch center
      harmonicIntervals: [0, 1, 6, 8, 13], // Exotic intervals (semitone, tritone, augmented 5th)

      timbreProfile: {
        brightness: 0.9, // Very bright for distinctiveness
        warmth: 0.3, // Less warm, more unique
        thickness: 0.3, // Thin for isolation
        texture: 'noise' // Unique, distinctive texture
      },

      dynamicsRange: {
        baseVolume: 0.5,
        velocityRange: [0.2, 0.7],
        attackTime: 0.15, // Quick attack
        decayTime: 0.4,
        sustainLevel: 0.5, // Moderate sustain
        releaseTime: 1.0 // Medium release
      },

      orchestrationProfile: {
        voiceCount: 2, // Solo or duo
        voiceSpread: 6, // Narrow spread
        ensembleType: 'solo',
        sectionBalance: {
          bass: 0.3,
          mid: 0.6,
          treble: 0.9 // Focus on treble for distinctiveness
        }
      },

      // Unusual modulation for uniqueness
      modulationRate: 1.8, // Fast modulation
      modulationDepth: 0.6, // Strong modulation
      filterCutoff: 4000, // Very bright
      resonance: 0.8, // High resonance for character

      // Spatial characteristics
      panningBehavior: 'static', // Fixed unique position
      reverbAmount: 0.2, // Minimal reverb for isolation
      spatialWidth: 0.3, // Narrow stereo width

      // Evolution parameters
      evolutionSpeed: 0.4, // Slow evolution maintains uniqueness
      complexityFactor: 0.8, // Lower complexity for distinctiveness
      harmonyComplexity: 0.3 // Simple, unique harmonies
    };
  }

  /**
   * Hierarchical Communities → Nested harmonic structures with sub-community variations
   */
  private createHierarchicalTheme(): CommunityAudioTheme {
    return {
      id: 'hierarchical',
      communityType: 'hierarchical',
      name: 'Nested Harmonies',
      description: 'Multi-layered harmonic structures for hierarchical communities',

      // Structured frequency for hierarchy
      baseFrequency: 196.00, // G3 - structured foundation
      harmonicIntervals: [0, 5, 7, 12, 17, 19, 24], // Perfect intervals for structure

      timbreProfile: {
        brightness: 0.6, // Balanced brightness
        warmth: 0.7, // Warm for cohesion
        thickness: 0.8, // Strong bass for foundation
        texture: 'harmonic' // Clear harmonic structure
      },

      dynamicsRange: {
        baseVolume: 0.75,
        velocityRange: [0.5, 0.95],
        attackTime: 0.5, // Moderate attack
        decayTime: 0.8,
        sustainLevel: 0.8, // High sustain for structure
        releaseTime: 2.0 // Long release for layering
      },

      orchestrationProfile: {
        voiceCount: 5, // Multiple layered voices
        voiceSpread: 19, // Wide spread for hierarchy
        ensembleType: 'sectional-orchestra',
        sectionBalance: {
          bass: 0.8, // Strong bass foundation
          mid: 0.9, // Strong mid-range for layers
          treble: 0.6
        }
      },

      // Structured modulation for hierarchy
      modulationRate: 0.6, // Moderate-slow modulation
      modulationDepth: 0.25, // Moderate modulation
      filterCutoff: 1800, // Warm but clear
      resonance: 0.35, // Moderate resonance

      // Spatial characteristics
      panningBehavior: 'cluster-based', // Hierarchical positioning
      reverbAmount: 0.6, // Good reverb for depth
      spatialWidth: 0.9, // Wide stereo width for layers

      // Evolution parameters
      evolutionSpeed: 0.5, // Moderate evolution
      complexityFactor: 1.6, // High complexity for hierarchy
      harmonyComplexity: 0.85 // Complex nested harmonies
    };
  }

  /**
   * Generate theme for specific community with customization based on characteristics
   */
  public generateThemeForCommunity(community: Community): CommunityAudioTheme {
    if (!this.isInitialized) {
      throw new Error('CommunityThemeGenerator not initialized');
    }

    const baseTheme = this.themes.get(community.type);
    if (!baseTheme) {
      logger.warn('theme-missing', 'No theme found for community type', {
        type: community.type
      });
      return this.createFallbackTheme(community);
    }

    // Customize theme based on community characteristics
    const customizedTheme = this.customizeTheme(baseTheme, community);

    logger.debug('theme-generation', 'Generated customized community theme', {
      communityId: community.id,
      type: community.type,
      baseFrequency: customizedTheme.baseFrequency
    });

    return customizedTheme;
  }

  /**
   * Customize base theme based on community characteristics
   */
  private customizeTheme(
    baseTheme: CommunityAudioTheme,
    community: Community
  ): CommunityAudioTheme {
    const customized = { ...baseTheme };

    // Adjust based on community size
    const sizeRatio = Math.min(community.characteristics.size / 20, 1.0); // Normalize to 20 nodes
    customized.dynamicsRange = {
      ...customized.dynamicsRange,
      baseVolume: customized.dynamicsRange.baseVolume * (0.5 + sizeRatio * 0.5) * this.themeIntensity
    };

    // Adjust based on community density
    const density = community.characteristics.density;
    customized.orchestrationProfile = {
      ...customized.orchestrationProfile,
      voiceCount: Math.round(customized.orchestrationProfile.voiceCount * (0.5 + density * 0.5))
    };

    // Adjust based on community stability
    const stability = community.characteristics.stability;
    customized.evolutionSpeed *= (2.0 - stability); // More stable = slower evolution

    // Adjust modulation depth based on connection strength
    const connectionStrength = community.characteristics.connectionStrength;
    customized.modulationDepth *= (0.5 + connectionStrength * 0.5);

    // Apply global theme intensity
    customized.timbreProfile = {
      ...customized.timbreProfile,
      brightness: customized.timbreProfile.brightness * this.themeIntensity,
      warmth: customized.timbreProfile.warmth * this.themeIntensity
    };

    return customized;
  }

  /**
   * Create fallback theme for unknown community types
   */
  private createFallbackTheme(community: Community): CommunityAudioTheme {
    return {
      id: `fallback-${community.id}`,
      communityType: community.type,
      name: 'Default Community',
      description: 'Default theme for unrecognized community type',

      baseFrequency: 220.00, // A3
      harmonicIntervals: [0, 4, 7], // Simple major triad

      timbreProfile: {
        brightness: 0.5,
        warmth: 0.5,
        thickness: 0.5,
        texture: 'smooth'
      },

      dynamicsRange: {
        baseVolume: 0.5,
        velocityRange: [0.3, 0.7],
        attackTime: 0.3,
        decayTime: 0.5,
        sustainLevel: 0.6,
        releaseTime: 1.0
      },

      orchestrationProfile: {
        voiceCount: 3,
        voiceSpread: 12,
        ensembleType: 'chamber-group',
        sectionBalance: {
          bass: 0.5,
          mid: 0.5,
          treble: 0.5
        }
      },

      modulationRate: 1.0,
      modulationDepth: 0.2,
      filterCutoff: 2000,
      resonance: 0.3,

      panningBehavior: 'static',
      reverbAmount: 0.4,
      spatialWidth: 0.5,

      evolutionSpeed: 0.5,
      complexityFactor: 1.0,
      harmonyComplexity: 0.5
    };
  }

  /**
   * Get all available themes
   */
  public getAllThemes(): CommunityAudioTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme for specific community type
   */
  public getThemeForCommunityType(type: CommunityType): CommunityAudioTheme {
    const theme = this.themes.get(type);
    if (!theme) {
      throw new Error(`No theme found for community type: ${type}`);
    }
    return theme;
  }

  /**
   * Update global theme intensity
   */
  public updateThemeIntensity(intensity: number): void {
    this.themeIntensity = Math.max(0.1, Math.min(2.0, intensity));
    logger.debug('settings', 'Theme intensity updated', { intensity: this.themeIntensity });
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      themeCount: this.themes.size,
      themeIntensity: this.themeIntensity,
      themes: Array.from(this.themes.entries()).map(([type, theme]) => ({
        type,
        name: theme.name,
        baseFrequency: theme.baseFrequency,
        voiceCount: theme.orchestrationProfile.voiceCount
      }))
    };
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    void logger.debug('shutdown', 'Disposing community theme generator');
    this.themes.clear();
    this.isInitialized = false;
  }
}