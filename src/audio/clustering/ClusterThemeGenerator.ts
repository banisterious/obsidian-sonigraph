/**
 * ClusterThemeGenerator - Phase 5.1: Cluster-Based Musical Themes
 *
 * Generates unique audio themes for each cluster type with distinct sonic characteristics
 */

import { getLogger } from '../../logging';
import {
  ClusterAudioTheme,
  ClusterType,
  TimbreProfile,
  DynamicsRange
} from './types';

const logger = getLogger('cluster-themes');

export class ClusterThemeGenerator {
  private themes: Map<ClusterType, ClusterAudioTheme> = new Map();
  private isInitialized = false;

  /**
   * Initialize the theme generator with predefined themes
   */
  public initialize(): Promise<void> {
    if (this.isInitialized) return;

    void logger.debug('initialization', 'Initializing cluster theme generator');

    // Generate themes for each cluster type
    this.themes.set('tag-based', this.createTagBasedTheme());
    this.themes.set('folder-based', this.createFolderBasedTheme());
    this.themes.set('link-dense', this.createLinkDenseTheme());
    this.themes.set('temporal', this.createTemporalTheme());
    this.themes.set('community', this.createCommunityTheme());

    this.isInitialized = true;
    logger.debug('initialization', 'Cluster themes initialized', {
      themeCount: this.themes.size
    });
  }

  /**
   * Create theme for tag-based clusters (Green visual theme)
   * Harmonious chords/arpeggios representing semantic connections
   */
  private createTagBasedTheme(): ClusterAudioTheme {
    return {
      id: 'tag-based',
      clusterType: 'tag-based',
      name: 'Semantic Harmony',
      description: 'Harmonious chords representing semantic tag relationships',

      // Consonant, stable frequencies for semantic stability
      baseFrequency: 261.63, // C4
      harmonicIntervals: [0, 4, 7, 11], // Major 7th chord (C-E-G-B)

      timbreProfile: {
        brightness: 0.7, // Clear and bright for clarity of meaning
        warmth: 0.6, // Warm but not overwhelming
        thickness: 0.4, // Light bass presence
        texture: 'harmonic' // Clear harmonic structure
      },

      dynamicsRange: {
        baseVolume: 0.6,
        velocityRange: [0.4, 0.8],
        attackTime: 0.3, // Gentle attack
        decayTime: 0.5,
        sustainLevel: 0.7, // Strong sustain for stability
        releaseTime: 1.2 // Gentle release
      },

      // Gentle modulation for organic feel
      modulationRate: 0.8, // Slow LFO
      modulationDepth: 0.15,
      filterCutoff: 2000, // Bright but not harsh
      resonance: 0.3,

      // Spatial characteristics
      panningBehavior: 'cluster-based',
      reverbAmount: 0.4, // Moderate reverb for warmth

      // Evolution parameters
      evolutionSpeed: 0.5, // Slow, stable evolution
      complexityFactor: 1.2 // Moderate complexity increase with strength
    };
  }

  /**
   * Create theme for folder-based clusters (Blue visual theme)
   * Structured, architectural sounds reflecting organizational hierarchy
   */
  private createFolderBasedTheme(): ClusterAudioTheme {
    return {
      id: 'folder-based',
      clusterType: 'folder-based',
      name: 'Architectural Structure',
      description: 'Structured tones reflecting organizational hierarchy',

      // Structured intervals reflecting hierarchy
      baseFrequency: 196.00, // G3
      harmonicIntervals: [0, 5, 10, 17], // Perfect 4th, minor 7th, perfect 12th

      timbreProfile: {
        brightness: 0.5, // Balanced brightness
        warmth: 0.7, // Warm, foundational feel
        thickness: 0.8, // Strong bass for structure
        texture: 'smooth' // Clean, architectural lines
      },

      dynamicsRange: {
        baseVolume: 0.7,
        velocityRange: [0.5, 0.9],
        attackTime: 0.4, // Deliberate attack
        decayTime: 0.6,
        sustainLevel: 0.8, // Strong sustain for stability
        releaseTime: 1.5 // Substantial release
      },

      // Steady, architectural modulation
      modulationRate: 0.6, // Slow, measured
      modulationDepth: 0.1, // Subtle
      filterCutoff: 1500, // Warm, foundational
      resonance: 0.4,

      // Spatial characteristics
      panningBehavior: 'static', // Fixed position like architecture
      reverbAmount: 0.6, // Spacious reverb for depth

      // Evolution parameters
      evolutionSpeed: 0.3, // Very slow, stable evolution
      complexityFactor: 1.0 // Consistent complexity
    };
  }

  /**
   * Create theme for link-dense clusters (Pink visual theme)
   * Dense, complex sounds with rich harmonic content
   */
  private createLinkDenseTheme(): ClusterAudioTheme {
    return {
      id: 'link-dense',
      clusterType: 'link-dense',
      name: 'Connection Matrix',
      description: 'Dense, complex harmonies representing rich interconnections',

      // Complex harmony for density
      baseFrequency: 293.66, // D4
      harmonicIntervals: [0, 3, 6, 10, 14, 17], // Dense chromatic cluster

      timbreProfile: {
        brightness: 0.8, // Bright for complexity
        warmth: 0.4, // Less warm, more analytical
        thickness: 0.6, // Moderate bass
        texture: 'granular' // Complex texture for density
      },

      dynamicsRange: {
        baseVolume: 0.5,
        velocityRange: [0.3, 0.7],
        attackTime: 0.1, // Quick attack for activity
        decayTime: 0.3,
        sustainLevel: 0.5, // Moderate sustain
        releaseTime: 0.8 // Quick release for busyness
      },

      // Active modulation for density
      modulationRate: 1.5, // Faster LFO
      modulationDepth: 0.3, // More modulation
      filterCutoff: 3000, // Bright for detail
      resonance: 0.6, // Higher resonance for complexity

      // Spatial characteristics
      panningBehavior: 'dynamic', // Moving for activity
      reverbAmount: 0.3, // Less reverb for clarity

      // Evolution parameters
      evolutionSpeed: 0.8, // Faster evolution
      complexityFactor: 1.8 // High complexity scaling
    };
  }

  /**
   * Create theme for temporal clusters (Yellow visual theme)
   * Rhythmic patterns reflecting time-based grouping
   */
  private createTemporalTheme(): ClusterAudioTheme {
    return {
      id: 'temporal',
      clusterType: 'temporal',
      name: 'Temporal Flow',
      description: 'Rhythmic patterns reflecting time-based relationships',

      // Intervals suggesting motion and rhythm
      baseFrequency: 329.63, // E4
      harmonicIntervals: [0, 2, 7, 12], // Major 2nd, Perfect 5th, Octave

      timbreProfile: {
        brightness: 0.9, // Bright for forward motion
        warmth: 0.5, // Balanced warmth
        thickness: 0.3, // Light for agility
        texture: 'organic' // Natural, flowing texture
      },

      dynamicsRange: {
        baseVolume: 0.6,
        velocityRange: [0.4, 0.8],
        attackTime: 0.05, // Very quick attack for rhythmic precision
        decayTime: 0.4,
        sustainLevel: 0.3, // Low sustain for rhythm
        releaseTime: 0.6 // Medium release
      },

      // Rhythmic modulation
      modulationRate: 2.0, // Fast LFO for rhythmic feel
      modulationDepth: 0.4, // Strong modulation
      filterCutoff: 2500, // Bright for presence
      resonance: 0.5,

      // Spatial characteristics
      panningBehavior: 'dynamic', // Moving through time
      reverbAmount: 0.2, // Minimal reverb for clarity

      // Evolution parameters
      evolutionSpeed: 1.2, // Fast evolution like time
      complexityFactor: 1.4 // Moderate complexity scaling
    };
  }

  /**
   * Create theme for community clusters (Purple visual theme)
   * Orchestral sections representing community structures
   */
  private createCommunityTheme(): ClusterAudioTheme {
    return {
      id: 'community',
      clusterType: 'community',
      name: 'Community Ensemble',
      description: 'Rich orchestral harmonies representing community structures',

      // Rich, orchestral harmony
      baseFrequency: 220.00, // A3
      harmonicIntervals: [0, 4, 7, 10, 14], // Extended major chord with 9th

      timbreProfile: {
        brightness: 0.6, // Balanced brightness
        warmth: 0.8, // Very warm for community feel
        thickness: 0.9, // Rich, full sound
        texture: 'harmonic' // Rich harmonic content
      },

      dynamicsRange: {
        baseVolume: 0.8,
        velocityRange: [0.6, 1.0],
        attackTime: 0.5, // Slower attack for ensemble feel
        decayTime: 0.8,
        sustainLevel: 0.9, // High sustain for fullness
        releaseTime: 2.0 // Long release for richness
      },

      // Gentle, ensemble-like modulation
      modulationRate: 0.4, // Very slow
      modulationDepth: 0.2,
      filterCutoff: 1800, // Warm but present
      resonance: 0.2, // Lower resonance for smoothness

      // Spatial characteristics
      panningBehavior: 'cluster-based', // Community-centered
      reverbAmount: 0.7, // Rich reverb for ensemble depth

      // Evolution parameters
      evolutionSpeed: 0.4, // Slow, community-like evolution
      complexityFactor: 1.5 // Moderate-high complexity
    };
  }

  /**
   * Get theme for specific cluster type
   */
  public getThemeForClusterType(clusterType: ClusterType): ClusterAudioTheme {
    if (!this.isInitialized) {
      throw new Error('ClusterThemeGenerator not initialized');
    }

    const theme = this.themes.get(clusterType);
    if (!theme) {
      logger.warn('theme-missing', 'No theme found for cluster type, using fallback', {
        clusterType
      });
      return this.createFallbackTheme(clusterType);
    }

    return theme;
  }

  /**
   * Create a fallback theme for unknown cluster types
   */
  private createFallbackTheme(clusterType: ClusterType): ClusterAudioTheme {
    return {
      id: `fallback-${clusterType}`,
      clusterType,
      name: 'Default Cluster',
      description: 'Default theme for unrecognized cluster type',

      baseFrequency: 261.63, // C4
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
        attackTime: 0.2,
        decayTime: 0.5,
        sustainLevel: 0.6,
        releaseTime: 1.0
      },

      modulationRate: 1.0,
      modulationDepth: 0.2,
      filterCutoff: 2000,
      resonance: 0.3,

      panningBehavior: 'static',
      reverbAmount: 0.3,

      evolutionSpeed: 0.5,
      complexityFactor: 1.0
    };
  }

  /**
   * Get all available themes
   */
  public getAllThemes(): ClusterAudioTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Create custom theme (for future extensibility)
   */
  public createCustomTheme(
    clusterType: ClusterType,
    customizations: Partial<ClusterAudioTheme>
  ): ClusterAudioTheme {
    const baseTheme = this.getThemeForClusterType(clusterType);
    const customTheme = { ...baseTheme, ...customizations };

    // Generate unique ID for custom theme
    customTheme.id = `custom-${clusterType}-${Date.now()}`;
    customTheme.name = `Custom ${baseTheme.name}`;

    return customTheme;
  }

  /**
   * Update existing theme with new parameters
   */
  public updateTheme(clusterType: ClusterType, updates: Partial<ClusterAudioTheme>): void {
    const existingTheme = this.themes.get(clusterType);
    if (!existingTheme) {
      logger.warn('theme-update', 'Cannot update non-existent theme', { clusterType });
      return;
    }

    const updatedTheme = { ...existingTheme, ...updates };
    this.themes.set(clusterType, updatedTheme);

    logger.debug('theme-update', 'Theme updated', {
      clusterType,
      updatedProperties: Object.keys(updates)
    });
  }

  /**
   * Get theme variation based on cluster strength
   * Stronger clusters get more complex harmonic content
   */
  public getThemeVariation(clusterType: ClusterType, strength: number): ClusterAudioTheme {
    const baseTheme = this.getThemeForClusterType(clusterType);
    const variation = { ...baseTheme };

    // Modulate complexity based on strength
    const complexityMultiplier = 0.5 + (strength * variation.complexityFactor);

    // Adjust harmonic intervals based on strength
    if (strength > 0.7) {
      // Add extra harmonics for strong clusters
      variation.harmonicIntervals = [
        ...variation.harmonicIntervals,
        ...this.getAdditionalHarmonics(clusterType)
      ];
    } else if (strength < 0.3) {
      // Simplify harmonics for weak clusters
      variation.harmonicIntervals = variation.harmonicIntervals.slice(0, 2);
    }

    // Adjust dynamics based on strength
    variation.dynamicsRange = {
      ...variation.dynamicsRange,
      baseVolume: variation.dynamicsRange.baseVolume * (0.3 + strength * 0.7),
      sustainLevel: Math.min(1.0, variation.dynamicsRange.sustainLevel * (0.5 + strength * 0.5))
    };

    // Adjust timbre based on strength
    variation.timbreProfile = {
      ...variation.timbreProfile,
      brightness: Math.min(1.0, variation.timbreProfile.brightness * (0.7 + strength * 0.6)),
      thickness: Math.min(1.0, variation.timbreProfile.thickness * (0.4 + strength * 0.6))
    };

    // Adjust modulation based on strength
    variation.modulationDepth *= complexityMultiplier;
    variation.resonance *= (0.5 + strength * 0.5);

    return variation;
  }

  /**
   * Get additional harmonics for strong clusters
   */
  private getAdditionalHarmonics(clusterType: ClusterType): number[] {
    const additionalHarmonics: Record<ClusterType, number[]> = {
      'tag-based': [16, 19], // Add 9th and 11th
      'folder-based': [12, 19], // Add octave and 11th
      'link-dense': [1, 5, 8, 11], // Add more chromatic intervals
      'temporal': [5, 9, 14], // Add rhythmic intervals
      'community': [9, 16, 21] // Add rich orchestral extensions
    };

    return additionalHarmonics[clusterType] || [];
  }

  /**
   * Get debug information about themes
   */
  public getDebugInfo(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      themeCount: this.themes.size,
      themes: Array.from(this.themes.entries()).map(([type, theme]) => ({
        type,
        name: theme.name,
        baseFrequency: theme.baseFrequency,
        harmonicCount: theme.harmonicIntervals.length,
        texture: theme.timbreProfile.texture
      }))
    };
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    void logger.debug('shutdown', 'Disposing cluster theme generator');
    this.themes.clear();
    this.isInitialized = false;
  }
}