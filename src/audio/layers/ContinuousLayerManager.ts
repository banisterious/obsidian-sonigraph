/**
 * ContinuousLayerManager
 * 
 * Central orchestrator for continuous audio layers that evolve with vault state.
 * Manages ambient, rhythmic, and harmonic background layers with dynamic modulation.
 */

import { Volume, Filter, Reverb, Delay, LFO, start } from 'tone';
import {
  ContinuousLayerConfig,
  VaultState,
  LayerState,
  MusicalGenre,
  ContinuousLayerError,
  LayerPerformanceMetrics
} from './types';
import { MusicalGenreEngine } from './MusicalGenreEngine';
import { FreesoundSampleLoader } from './FreesoundSampleLoader';
import { RhythmicLayerManager } from './RhythmicLayerManager';
import { HarmonicLayerManager } from './HarmonicLayerManager';
import { getLogger } from '../../logging';
import { SonigraphSettings } from '../../utils/constants';

const logger = getLogger('ContinuousLayerManager');

export class ContinuousLayerManager {
  private config: ContinuousLayerConfig;
  private isInitialized = false;
  private isPlaying = false;
  
  // Audio components
  private masterVolume: Volume;
  private genreEngine: MusicalGenreEngine;
  private sampleLoader: FreesoundSampleLoader;
  private rhythmicLayer: RhythmicLayerManager;
  private harmonicLayer: HarmonicLayerManager;
  
  // Audio processing chain
  private filterChain: Filter;
  private reverbBus: Reverb;
  private delayBus: Delay;
  private modLFO: LFO;
  
  // State management
  private currentState: LayerState;
  private lastVaultState: VaultState | null = null;
  private modulationTimer: number | null = null;
  private performanceMonitor: number | null = null;
  
  // Performance optimization
  private parameterUpdateCounter = 0;
  private readonly PARAMETER_UPDATE_THROTTLE = 10; // Update every 10 frames
  private readonly PERFORMANCE_CHECK_INTERVAL = 5000; // Check every 5 seconds
  
  // Integration callbacks
  private onStateChange?: (state: LayerState) => void;
  private onPerformanceUpdate?: (metrics: LayerPerformanceMetrics) => void;
  
  constructor(
    private settings: SonigraphSettings,
    config?: Partial<ContinuousLayerConfig>
  ) {
    void logger.debug('initialization', 'Creating ContinuousLayerManager');

    this.config = {
      enabled: false, // Disabled by default for gradual rollout
      genre: 'ambient',
      intensity: 0.5,
      evolutionRate: 0.3,
      baseVolume: 0, // Set to 0dB for maximum audibility during testing
      adaptiveIntensity: true,
      ...config
    };

    logger.info('initialization', 'Final layer config', {
      enabled: this.config.enabled,
      genre: this.config.genre,
      intensity: this.config.intensity
    });
    
    // Initialize state
    this.currentState = {
      isPlaying: false,
      currentGenre: this.config.genre,
      intensity: this.config.intensity,
      lastParameterUpdate: 0,
      activeVoices: 0,
      cpuUsage: 0,
      memoryUsage: 0
    };
    
    // Create audio components
    this.masterVolume = new Volume(this.config.baseVolume);
    this.filterChain = new Filter(1000, "lowpass");
    this.reverbBus = new Reverb(2);
    this.delayBus = new Delay("8n", 0.3);
    this.modLFO = new LFO(0.5, 0, 1);
    
    // Initialize engines
    this.genreEngine = new MusicalGenreEngine(this.config.genre, settings);

    logger.info('initialization', 'About to create FreesoundSampleLoader', {
      hasSettings: !!settings,
      hasApiKey: !!settings?.freesoundApiKey,
      hasSamples: !!settings?.freesoundSamples,
      samplesCount: settings?.freesoundSamples?.length || 0
    });

    this.sampleLoader = new FreesoundSampleLoader(settings?.freesoundApiKey, settings);
    this.rhythmicLayer = new RhythmicLayerManager(settings);
    this.harmonicLayer = new HarmonicLayerManager(settings);

    // Set user samples directly on genre engine (flat array)
    if (settings.freesoundSamples) {
      this.genreEngine.setUserSamples(settings.freesoundSamples);
      logger.debug('initialization', 'Set user samples on genre engine', {
        count: settings.freesoundSamples.length
      });
    }

    logger.info('initialization', `ContinuousLayerManager created with genre: ${this.config.genre}`);
  }
  
  /**
   * Initialize the continuous layer system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      void logger.warn('initialization', 'ContinuousLayerManager already initialized');
      return;
    }
    
    try {
      void logger.info('initialization', 'Initializing continuous layer system');
      
      // Ensure Tone.js is started
      await start();
      
      // Connect audio chain
      this.genreEngine.connect(this.filterChain);
      this.filterChain.connect(this.reverbBus);
      this.reverbBus.connect(this.delayBus);
      this.delayBus.connect(this.masterVolume);
      this.masterVolume.toDestination();
      
      // Initialize LFO for modulation
      this.modLFO.start();
      
      // Initialize sub-engines
      await this.genreEngine.initialize();
      await this.sampleLoader.initialize();
      await this.rhythmicLayer.initialize();
      await this.harmonicLayer.initialize();

      // Connect sample loader to genre engine
      this.genreEngine.setSampleLoader(this.sampleLoader);

      // Preload samples for current genre if Freesound is available
      if (this.settings.freesoundApiKey) {
        await this.sampleLoader.preloadGenreSamples(this.config.genre);
      }
      
      this.isInitialized = true;
      void this.startPerformanceMonitoring();
      
      void logger.info('initialization', 'Continuous layer system initialized successfully');
    } catch (error) {
      void logger.error('initialization', 'Failed to initialize continuous layer system', error);
      throw new ContinuousLayerError('Initialization failed', 'ambient');
    }
  }
  
  /**
   * Start continuous layer playback
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config.enabled) {
      logger.warn('playback', 'Continuous layers disabled in config, skipping start', {
        configEnabled: this.config.enabled
      });
      return;
    }

    // Validate that we have enabled samples before starting
    const enabledSamples = this.settings.freesoundSamples?.filter(s => s.enabled !== false) || [];
    if (enabledSamples.length === 0) {
      void logger.warn('playback', 'No enabled Freesound samples available - continuous layers require at least one enabled sample to function properly. Please enable samples in the Sample Browser.');
      return;
    }

    if (this.isPlaying) {
      void logger.warn('playback', 'Continuous layers already playing');
      return;
    }

    try {
      logger.info('playback', `Starting continuous layer playback - Genre: ${this.config.genre}, ${enabledSamples.length} enabled samples available`);
      
      // Start genre engine
      await this.genreEngine.start(this.config);
      
      // Start sub-layers if enabled
      if (this.rhythmicLayer.isEnabled()) {
        await this.rhythmicLayer.start();
      }
      
      if (this.harmonicLayer.isEnabled()) {
        await this.harmonicLayer.start();
      }
      
      // Start modulation timer
      void this.startModulation();
      
      this.isPlaying = true;
      this.currentState.isPlaying = true;
      
      void this.notifyStateChange();
      
      void logger.info('playback', 'Continuous layer playback started successfully');
    } catch (error) {
      void logger.error('playback', 'Failed to start continuous layer playback', error);
      throw new ContinuousLayerError('Playback start failed', 'ambient', this.config.genre);
    }
  }
  
  /**
   * Stop continuous layer playback
   */
  async stop(): Promise<void> {
    if (!this.isPlaying) {
      void logger.debug('playback', 'Continuous layers not playing, skipping stop');
      return;
    }
    
    try {
      void logger.info('playback', 'Stopping continuous layer playback');
      
      // Stop modulation
      void this.stopModulation();
      
      // Stop sub-layers
      await this.rhythmicLayer.stop();
      await this.harmonicLayer.stop();
      
      // Stop genre engine with fade out
      await this.genreEngine.stop();
      
      this.isPlaying = false;
      this.currentState.isPlaying = false;
      this.currentState.activeVoices = 0;
      
      void this.notifyStateChange();
      
      void logger.info('playback', 'Continuous layer playback stopped');
    } catch (error) {
      void logger.error('playback', 'Error stopping continuous layer playback', error);
    }
  }
  
  /**
   * Update vault state and modulate parameters accordingly
   */
  updateVaultState(vaultState: VaultState): void {
    if (!this.isPlaying || !this.config.adaptiveIntensity) {
      return;
    }
    
    this.lastVaultState = vaultState;
    
    // Throttle parameter updates for performance
    this.parameterUpdateCounter++;
    if (this.parameterUpdateCounter % this.PARAMETER_UPDATE_THROTTLE !== 0) {
      return;
    }
    
    try {
      // Calculate intensity based on vault density
      const densityRatio = vaultState.totalNodes / Math.max(vaultState.maxNodes, 100);
      const activityIntensity = Math.min(vaultState.vaultActivityLevel / 10, 1);
      
      // Combine density and activity for overall intensity
      const targetIntensity = (densityRatio * 0.7) + (activityIntensity * 0.3);
      const smoothedIntensity = this.smoothIntensity(targetIntensity);
      
      // Update filter cutoff based on vault size (more nodes = brighter)
      const targetCutoff = 200 + (densityRatio * 1800); // 200Hz - 2000Hz range
      this.filterChain.frequency.rampTo(targetCutoff, 2); // 2 second ramp
      
      // Update reverb based on animation progress
      const reverbAmount = 0.1 + (vaultState.currentAnimationProgress * 0.4);
      this.reverbBus.wet.rampTo(reverbAmount, 3);
      
      // Update LFO rate based on activity level
      const lfoRate = 0.1 + (activityIntensity * 0.9); // 0.1Hz - 1Hz
      this.modLFO.frequency.rampTo(lfoRate, 1);
      
      // Update genre engine parameters
      this.genreEngine.updateParameters({
        intensity: smoothedIntensity,
        filterCutoff: targetCutoff,
        activityLevel: activityIntensity,
        animationProgress: vaultState.currentAnimationProgress
      });
      
      // Update state
      this.currentState.intensity = smoothedIntensity;
      this.currentState.lastParameterUpdate = Date.now();
      
      logger.debug('modulation', 
        `Updated parameters - Intensity: ${smoothedIntensity.toFixed(2)}, ` +
        `Cutoff: ${targetCutoff.toFixed(0)}Hz, Activity: ${activityIntensity.toFixed(2)}`
      );
      
    } catch (error) {
      void logger.error('modulation', 'Error updating vault state parameters', error);
    }
  }
  
  /**
   * Change the active genre
   */
  async setGenre(genre: MusicalGenre): Promise<void> {
    if (this.config.genre === genre) {
      return;
    }
    
    logger.info('configuration', `Changing genre from ${this.config.genre} to ${genre}`);
    
    try {
      const wasPlaying = this.isPlaying;
      
      // Stop current playback if active
      if (wasPlaying) {
        await this.stop();
      }
      
      // Update configuration
      this.config.genre = genre;
      this.currentState.currentGenre = genre;
      
      // Switch genre engine
      await this.genreEngine.setGenre(genre);
      
      // Preload samples for new genre if available
      if (this.settings.freesoundApiKey) {
        this.sampleLoader.preloadGenreSamples(genre).catch(error => {
          logger.warn('samples', `Failed to preload samples for ${genre}`, error);
        });
      }
      
      // Restart playback if it was active
      if (wasPlaying) {
        await this.start();
      }
      
      void this.notifyStateChange();
      
      logger.info('configuration', `Genre changed to ${genre} successfully`);
    } catch (error) {
      logger.error('configuration', `Failed to change genre to ${genre}`, error);
      throw new ContinuousLayerError('Genre change failed', 'ambient', genre);
    }
  }
  
  /**
   * Update layer configuration
   */
  updateConfig(newConfig: Partial<ContinuousLayerConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    logger.debug('configuration', `Updated config:`, { 
      old: oldConfig, 
      new: this.config,
      changes: newConfig
    });
    
    // Apply volume change immediately
    if (newConfig.baseVolume !== undefined) {
      this.masterVolume.volume.rampTo(newConfig.baseVolume, 1);
    }
    
    // Apply intensity change
    if (newConfig.intensity !== undefined) {
      this.currentState.intensity = newConfig.intensity;
      if (this.isPlaying) {
        this.genreEngine.updateParameters({ intensity: newConfig.intensity });
      }
    }
    
    // Enable/disable layers
    if (newConfig.enabled !== undefined && newConfig.enabled !== oldConfig.enabled) {
      if (newConfig.enabled && !this.isPlaying) {
        this.start().catch(error => {
          void logger.error('configuration', 'Failed to start after enabling', error);
        });
      } else if (!newConfig.enabled && this.isPlaying) {
        this.stop().catch(error => {
          void logger.error('configuration', 'Failed to stop after disabling', error);
        });
      }
    }
    
    void this.notifyStateChange();
  }
  
  /**
   * Get current layer state for monitoring
   */
  getState(): LayerState {
    return { ...this.currentState };
  }
  
  /**
   * Get configuration
   */
  getConfig(): ContinuousLayerConfig {
    return { ...this.config };
  }
  
  /**
   * Set state change callback
   */
  setStateChangeCallback(callback: (state: LayerState) => void): void {
    this.onStateChange = callback;
  }
  
  /**
   * Set performance update callback
   */
  setPerformanceCallback(callback: (metrics: LayerPerformanceMetrics) => void): void {
    this.onPerformanceUpdate = callback;
  }
  
  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    void logger.info('cleanup', 'Disposing ContinuousLayerManager');
    
    try {
      await this.stop();
      void this.stopPerformanceMonitoring();
      
      // Dispose audio components
      this.masterVolume.dispose();
      this.filterChain.dispose();
      this.reverbBus.dispose();
      this.delayBus.dispose();
      this.modLFO.dispose();
      
      // Dispose engines
      await this.genreEngine.dispose();
      await this.sampleLoader.dispose();
      await this.rhythmicLayer.dispose();
      await this.harmonicLayer.dispose();
      
      this.isInitialized = false;
      
      void logger.info('cleanup', 'ContinuousLayerManager disposed');
    } catch (error) {
      void logger.error('cleanup', 'Error during cleanup', error);
    }
  }
  
  // === PRIVATE METHODS ===
  
  private startModulation(): void {
    if (this.modulationTimer) {
      clearInterval(this.modulationTimer);
    }
    
    this.modulationTimer = window.setInterval(() => {
      if (this.isPlaying && this.lastVaultState) {
        void this.updateVaultState(this.lastVaultState);
      }
    }, 100); // Update every 100ms
  }
  
  private stopModulation(): void {
    if (this.modulationTimer) {
      clearInterval(this.modulationTimer);
      this.modulationTimer = null;
    }
  }
  
  private smoothIntensity(targetIntensity: number): number {
    const currentIntensity = this.currentState.intensity;
    const maxChange = this.config.evolutionRate * 0.1; // Limit rate of change
    
    if (Math.abs(targetIntensity - currentIntensity) <= maxChange) {
      return targetIntensity;
    }
    
    return currentIntensity + Math.sign(targetIntensity - currentIntensity) * maxChange;
  }
  
  private startPerformanceMonitoring(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
    }
    
    this.performanceMonitor = window.setInterval(() => {
      if (this.onPerformanceUpdate) {
        const metrics: LayerPerformanceMetrics = {
          layerType: 'ambient',
          genre: this.config.genre,
          cpuUsage: this.getCurrentCPUUsage(),
          memoryUsage: this.getCurrentMemoryUsage(),
          activeVoices: this.genreEngine.getActiveVoices(),
          bufferUnderruns: 0, // Would need Web Audio API monitoring
          lastUpdate: Date.now()
        };
        
        this.currentState.cpuUsage = metrics.cpuUsage;
        this.currentState.memoryUsage = metrics.memoryUsage;
        this.currentState.activeVoices = metrics.activeVoices;
        
        void this.onPerformanceUpdate(metrics);
      }
    }, this.PERFORMANCE_CHECK_INTERVAL);
  }
  
  private stopPerformanceMonitoring(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
    }
  }
  
  private getCurrentCPUUsage(): number {
    // Simplified CPU usage estimation based on active voices and effects
    const baseUsage = this.isPlaying ? 0.5 : 0;
    const voiceUsage = this.currentState.activeVoices * 0.1;
    const effectUsage = 0.2; // Estimate for filter, reverb, delay
    
    return Math.min(baseUsage + voiceUsage + effectUsage, 5.0); // Max 5% for continuous layers
  }
  
  private getCurrentMemoryUsage(): number {
    // Simplified memory usage estimation
    const baseUsage = 10; // Base 10MB
    const sampleUsage = this.sampleLoader.getMemoryUsage();
    const bufferUsage = this.currentState.activeVoices * 0.5; // 0.5MB per voice
    
    return baseUsage + sampleUsage + bufferUsage;
  }
  
  private notifyStateChange(): void {
    if (this.onStateChange) {
      void this.onStateChange(this.currentState);
    }
  }
}