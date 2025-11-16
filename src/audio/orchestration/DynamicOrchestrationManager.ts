/**
 * Phase 6.2: Dynamic Orchestration Manager
 *
 * Manages evolving instrumentation based on vault complexity and temporal context.
 * Coordinates complexity analysis, temporal influence, and instrument layer activation.
 */

import { GraphNode, GraphLink } from '../../graph/GraphDataExtractor';
import { Cluster } from '../../graph/SmartClusteringAlgorithms';
import { ComplexityAnalyzer } from './ComplexityAnalyzer';
import { getLogger } from '../../logging';

const logger = getLogger('dynamic-orchestration');
import { TemporalInfluence } from './TemporalInfluence';
import {
  DynamicOrchestrationSettings,
  OrchestrationState,
  VaultComplexity,
  ComplexityTier,
  OrchestrationLayer,
  InstrumentLayer,
  TemporalInfluence as TemporalInfluenceData
} from './types';
import * as Tone from 'tone';

export class DynamicOrchestrationManager {
  private settings: DynamicOrchestrationSettings;
  private complexityAnalyzer: ComplexityAnalyzer;
  private temporalInfluence: TemporalInfluence;
  private orchestrationState: OrchestrationState;
  private updateInterval: number | null = null;
  private transitionStartTime: number = 0;

  constructor(settings: DynamicOrchestrationSettings) {
    this.settings = settings;
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.temporalInfluence = new TemporalInfluence();

    // Initialize state
    this.orchestrationState = this.createInitialState();

    // Apply custom thresholds if provided
    if (settings.customThresholds && settings.complexityThresholds.length > 0) {
      this.complexityAnalyzer.setComplexityThresholds(settings.complexityThresholds);
    }

    // Set temporal influence strengths
    this.temporalInfluence.setTimeOfDayStrength(settings.timeOfDayInfluence);
    this.temporalInfluence.setSeasonalStrength(settings.seasonalInfluence);
  }

  /**
   * Create initial orchestration state
   */
  private createInitialState(): OrchestrationState {
    return {
      currentComplexity: {
        totalNodes: 0,
        totalLinks: 0,
        averageDegree: 0,
        clusterCount: 0,
        maxDepth: 0,
        complexityScore: 0,
        tier: 'minimal'
      },
      activeTier: 'minimal',
      previousTier: 'minimal',
      activeLayers: new Set(['basic-melody']),
      temporalInfluence: {
        timeOfDay: 'afternoon',
        season: 'spring',
        instrumentBrightness: 0.5,
        orchestralDensity: 0.5,
        preferredInstruments: [],
        timbreAdjustment: 0
      },
      activeInstrumentLayers: [],
      transitionProgress: 1.0,
      lastUpdateTime: Date.now()
    };
  }

  /**
   * Update orchestration based on current graph state
   */
  updateOrchestration(
    nodes: GraphNode[],
    links: GraphLink[],
    clusters?: Cluster[]
  ): void {
    if (!this.settings.enabled) return;

    // Evaluate vault complexity
    const complexity = this.complexityAnalyzer.evaluateComplexity(nodes, links, clusters);

    // Get current temporal influence
    const temporal = this.settings.temporalInfluenceEnabled
      ? this.temporalInfluence.getCurrentTemporalInfluence()
      : this.orchestrationState.temporalInfluence;

    // Check if tier change is needed
    if (complexity.tier !== this.orchestrationState.activeTier) {
      void this.initiateTierTransition(complexity.tier);
    }

    // Update state
    this.orchestrationState.currentComplexity = complexity;
    this.orchestrationState.temporalInfluence = temporal;
    this.orchestrationState.lastUpdateTime = Date.now();

    // Update instrument layers
    void this.updateInstrumentLayers(complexity, temporal);

    // Update transition progress
    void this.updateTransitionProgress();
  }

  /**
   * Initiate transition to new complexity tier
   */
  private initiateTierTransition(newTier: ComplexityTier): void {
    logger.info('tier-transition', `Transitioning: ${this.orchestrationState.activeTier} → ${newTier}`);

    this.orchestrationState.previousTier = this.orchestrationState.activeTier;
    this.orchestrationState.activeTier = newTier;
    this.orchestrationState.transitionProgress = 0;
    this.transitionStartTime = Date.now();

    // Update active layers for new tier
    const threshold = this.complexityAnalyzer.getThresholdForTier(newTier);
    if (threshold) {
      this.orchestrationState.activeLayers = new Set(threshold.enabledLayers);
    }
  }

  /**
   * Update transition progress
   */
  private updateTransitionProgress(): void {
    if (this.orchestrationState.transitionProgress >= 1.0) return;

    const elapsed = (Date.now() - this.transitionStartTime) / 1000; // seconds
    const progress = elapsed / this.settings.transitionDuration;

    this.orchestrationState.transitionProgress = Math.min(1.0, progress);
  }

  /**
   * Update instrument layers based on complexity and temporal influence
   */
  private updateInstrumentLayers(
    complexity: VaultComplexity,
    temporal: TemporalInfluenceData
  ): void {
    const threshold = this.complexityAnalyzer.getThresholdForTier(complexity.tier);
    if (!threshold) return;

    const layers: InstrumentLayer[] = [];

    // Create layers for each enabled orchestration layer
    for (const layerType of threshold.enabledLayers) {
      const instruments = this.selectInstrumentsForLayer(
        layerType,
        temporal,
        complexity
      );

      const layer: InstrumentLayer = {
        id: `${layerType}-${Date.now()}`,
        layerType,
        instruments,
        volume: this.calculateLayerVolume(layerType, complexity, temporal),
        enabled: true,
        activationThreshold: complexity.tier,
        temporalSensitivity: this.getLayerTemporalSensitivity(layerType)
      };

      void layers.push(layer);
    }

    this.orchestrationState.activeInstrumentLayers = layers;
  }

  /**
   * Select instruments for a specific layer
   */
  private selectInstrumentsForLayer(
    layerType: OrchestrationLayer,
    temporal: TemporalInfluenceData,
    complexity: VaultComplexity
  ): string[] {
    // Base instruments for each layer type
    const baseInstruments = this.getBaseInstrumentsForLayer(layerType);

    // Filter by temporal preference if enabled
    if (this.settings.temporalInfluenceEnabled && temporal.preferredInstruments.length > 0) {
      const preferredSet = new Set(temporal.preferredInstruments);
      const filtered = baseInstruments.filter(inst => preferredSet.has(inst));

      // If we filtered out all instruments, keep the base set
      if (filtered.length > 0) {
        return filtered;
      }
    }

    return baseInstruments;
  }

  /**
   * Get base instruments for layer type
   */
  private getBaseInstrumentsForLayer(layerType: OrchestrationLayer): string[] {
    switch (layerType) {
      case 'basic-melody':
        return ['piano', 'acoustic-guitar', 'violin', 'flute'];
      case 'rhythmic':
        return ['timpani', 'vibraphone', 'xylophone', 'marimba'];
      case 'harmonic-pad':
        return ['synth-pad', 'vocal-pad', 'string-ensemble', 'choir'];
      case 'bass-line':
        return ['bass', 'cello', 'contrabass', 'bass-synth'];
      case 'counter-melody':
        return ['oboe', 'clarinet', 'french-horn', 'trumpet'];
      case 'orchestral-fills':
        return ['brass-section', 'string-ensemble', 'woodwind-ensemble'];
      case 'ambient-texture':
        return ['ambient-drone', 'synth-pad', 'vocal-pad', 'bells'];
      default:
        return ['piano'];
    }
  }

  /**
   * Calculate volume for layer
   */
  private calculateLayerVolume(
    layerType: OrchestrationLayer,
    complexity: VaultComplexity,
    temporal: TemporalInfluenceData
  ): number {
    // Base volume by layer type
    let volume = this.getBaseLayerVolume(layerType);

    // Adjust by complexity
    volume *= (0.5 + complexity.complexityScore * 0.5);

    // Adjust by temporal density
    if (this.settings.temporalInfluenceEnabled) {
      volume *= (0.7 + temporal.orchestralDensity * 0.3);
    }

    // Apply transition fade
    if (this.orchestrationState.transitionProgress < 1.0) {
      volume *= this.orchestrationState.transitionProgress;
    }

    return Math.max(0, Math.min(1, volume));
  }

  /**
   * Get base volume for layer type
   */
  private getBaseLayerVolume(layerType: OrchestrationLayer): number {
    switch (layerType) {
      case 'basic-melody':
        return 0.8;
      case 'rhythmic':
        return 0.6;
      case 'harmonic-pad':
        return 0.5;
      case 'bass-line':
        return 0.7;
      case 'counter-melody':
        return 0.6;
      case 'orchestral-fills':
        return 0.5;
      case 'ambient-texture':
        return 0.4;
      default:
        return 0.5;
    }
  }

  /**
   * Get temporal sensitivity for layer
   */
  private getLayerTemporalSensitivity(layerType: OrchestrationLayer): number {
    switch (layerType) {
      case 'basic-melody':
        return 0.7;
      case 'rhythmic':
        return 0.5;
      case 'harmonic-pad':
        return 0.8;
      case 'bass-line':
        return 0.4;
      case 'counter-melody':
        return 0.6;
      case 'orchestral-fills':
        return 0.5;
      case 'ambient-texture':
        return 0.9;
      default:
        return 0.5;
    }
  }

  /**
   * Start auto-update loop (if enabled)
   */
  startAutoUpdate(intervalMs: number = 60000): void {
    if (!this.settings.autoAdjust) return;

    void this.stopAutoUpdate();

    this.updateInterval = window.setInterval(() => {
      // Update temporal influence only (complexity updated on graph changes)
      if (this.settings.temporalInfluenceEnabled) {
        const temporal = this.temporalInfluence.getCurrentTemporalInfluence();
        this.orchestrationState.temporalInfluence = temporal;
      }
    }, intervalMs);
  }

  /**
   * Stop auto-update loop
   */
  stopAutoUpdate(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get current orchestration state
   */
  getState(): OrchestrationState {
    return { ...this.orchestrationState };
  }

  /**
   * Get active instrument layers
   */
  getActiveInstrumentLayers(): InstrumentLayer[] {
    return this.orchestrationState.activeInstrumentLayers;
  }

  /**
   * Get current complexity
   */
  getCurrentComplexity(): VaultComplexity {
    return this.orchestrationState.currentComplexity;
  }

  /**
   * Get current temporal influence
   */
  getCurrentTemporalInfluence(): TemporalInfluenceData {
    return this.orchestrationState.temporalInfluence;
  }

  /**
   * Check if layer is active
   */
  isLayerActive(layerType: OrchestrationLayer): boolean {
    return this.orchestrationState.activeLayers.has(layerType);
  }

  /**
   * Get recommended instrument count
   */
  getRecommendedInstrumentCount(): number {
    return this.complexityAnalyzer.getRecommendedInstrumentCount(
      this.orchestrationState.currentComplexity
    );
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<DynamicOrchestrationSettings>): void {
    this.settings = { ...this.settings, ...settings };

    // Update component settings
    if (settings.timeOfDayInfluence !== undefined) {
      this.temporalInfluence.setTimeOfDayStrength(settings.timeOfDayInfluence);
    }

    if (settings.seasonalInfluence !== undefined) {
      this.temporalInfluence.setSeasonalStrength(settings.seasonalInfluence);
    }

    if (settings.customThresholds && settings.complexityThresholds) {
      this.complexityAnalyzer.setComplexityThresholds(settings.complexityThresholds);
    }

    // Restart auto-update if setting changed
    if (settings.autoAdjust !== undefined) {
      if (settings.autoAdjust) {
        void this.startAutoUpdate();
      } else {
        void this.stopAutoUpdate();
      }
    }
  }

  /**
   * Get human-readable orchestration description
   */
  getOrchestrationDescription(): string {
    const tier = this.orchestrationState.activeTier;
    const layerCount = this.orchestrationState.activeInstrumentLayers.length;
    const temporal = this.temporalInfluence.getTemporalDescription(
      this.orchestrationState.temporalInfluence
    );

    return `${tier} complexity, ${layerCount} active layers, ${temporal}`;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    void this.stopAutoUpdate();
    this.complexityAnalyzer.dispose();
    this.temporalInfluence.dispose();
  }
}