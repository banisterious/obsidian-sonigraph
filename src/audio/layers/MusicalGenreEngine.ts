/**
 * MusicalGenreEngine
 * 
 * Handles 13 distinct musical genres for continuous background layers.
 * Each genre has unique synthesis parameters, sample sets, and modulation patterns.
 */

import { 
  PolySynth, 
  FMSynth, 
  AMSynth, 
  NoiseSynth, 
  MetalSynth,
  Sampler,
  Volume,
  Filter,
  LFO,
  Reverb,
  Delay,
  Chorus,
  Distortion,
  PingPongDelay,
  BitCrusher,
  Phaser,
  start
} from 'tone';

import {
  MusicalGenre,
  GenreParameters,
  ContinuousLayerConfig,
  ContinuousLayerError,
  FreesoundSample
} from './types';
import { FreesoundSampleLoader } from './FreesoundSampleLoader';
import { getLogger } from '../../logging';
import { requestUrl } from 'obsidian';
import type { SonigraphSettings } from '../../utils/constants';

const logger = getLogger('MusicalGenreEngine');

interface GenreConfiguration {
  primarySynth: 'fm' | 'am' | 'poly' | 'noise' | 'metal' | 'sampler';
  supportingSynths?: ('fm' | 'am' | 'poly' | 'noise' | 'metal')[];
  parameters: GenreParameters;
  sampleCategories: string[]; // Freesound sample categories
  modulationPatterns: ModulationPattern[];
  effectChain: EffectType[];
}

interface ModulationPattern {
  parameter: keyof GenreParameters;
  lfoRate: number;
  depth: number;
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
}

type EffectType = 'reverb' | 'delay' | 'chorus' | 'distortion' | 'filter' | 'phaser' | 'bitcrusher' | 'pingpong';

export class MusicalGenreEngine {
  private currentGenre: MusicalGenre;
  private settings: SonigraphSettings | undefined;
  private isInitialized = false;
  private isPlaying = false;

  // Synthesis components
  private primarySynth: PolySynth | FMSynth | AMSynth | NoiseSynth | MetalSynth | Sampler | null = null;
  private supportingSynths: Map<string, unknown> = new Map();
  private synthVolume: Volume;

  // Effects chain
  private effects: Map<string, unknown> = new Map();
  private effectsChain: unknown[] = [];

  // Modulation
  private lfos: Map<string, LFO> = new Map();
  private modulationTargets: Map<string, unknown> = new Map();

  // Sample integration
  private sampleLoader: FreesoundSampleLoader | null = null;
  private loadedSamples: Map<string, Sampler> = new Map();
  private activeSampleAudios: HTMLAudioElement[] = [];
  private sampleFadeOutTimers: number[] = [];
  private userSamples: FreesoundSample[] = [];

  // Playback state
  private activeNotes: Set<string> = new Set();
  private evolutionTimer: number | null = null;
  private lastNoteTime = 0;
  private noteInterval = 0;

  // Performance tracking
  private activeVoices = 0;
  private cpuUsage = 0;

  constructor(genre: MusicalGenre, settings?: SonigraphSettings) {
    this.currentGenre = genre;
    this.settings = settings;
    this.synthVolume = new Volume(-20); // Start quiet

    logger.debug('initialization', `Creating MusicalGenreEngine for genre: ${genre}`);
  }
  
  /**
   * Initialize the genre engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      logger.info('initialization', `Initializing genre engine: ${this.currentGenre}`);
      
      // Ensure Tone.js is started
      await start();
      
      // Create synthesis chain for current genre
      this.createSynthesisChain();
      
      // Setup effects chain
      void this.createEffectsChain();
      
      // Setup modulation
      void this.createModulation();
      
      // Connect audio chain
      void this.connectAudioChain();
      
      this.isInitialized = true;
      
      logger.info('initialization', `Genre engine initialized: ${this.currentGenre}`);
    } catch (error) {
      logger.error('initialization', `Failed to initialize genre engine: ${this.currentGenre}`, error);
      throw new ContinuousLayerError('Genre engine initialization failed', 'ambient', this.currentGenre);
    }
  }
  
  /**
   * Start playing the current genre
   */
  async start(config: ContinuousLayerConfig): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isPlaying) {
      return;
    }
    
    try {
      logger.info('playback', `Starting genre playback: ${this.currentGenre}`);
      
      // Apply configuration
      void this.applyConfiguration(config);
      
      // Start LFOs
      this.lfos.forEach(lfo => lfo.start());
      
      // Begin evolution cycle
      void this.startEvolution();
      
      // Play initial chord/drone based on genre
      await this.playInitialSound();
      
      this.isPlaying = true;
      
      logger.info('playback', `Genre playback started: ${this.currentGenre}`);
    } catch (error) {
      logger.error('playback', `Failed to start genre playback: ${this.currentGenre}`, error);
      throw new ContinuousLayerError('Genre playback start failed', 'ambient', this.currentGenre);
    }
  }
  
  /**
   * Stop genre playback
   */
  async stop(): Promise<void> {
    if (!this.isPlaying) {
      return;
    }

    try {
      logger.info('playback', `Stopping genre playback: ${this.currentGenre}`);

      // Stop evolution
      void this.stopEvolution();

      // Stop all LFOs
      this.lfos.forEach(lfo => lfo.stop());

      // Release all active notes
      void this.releaseAllNotes();

      // Stop any active sample playback
      void this.stopActiveSample();

      // Fade out volume
      this.synthVolume.volume.rampTo(-60, 2);

      // Wait for fade out
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.isPlaying = false;
      this.activeVoices = 0;

      logger.info('playback', `Genre playback stopped: ${this.currentGenre}`);
    } catch (error) {
      logger.error('playback', `Error stopping genre playback: ${this.currentGenre}`, error);
    }
  }
  
  /**
   * Change to a different genre
   */
  async setGenre(genre: MusicalGenre): Promise<void> {
    if (this.currentGenre === genre) {
      return;
    }
    
    logger.info('configuration', `Changing genre from ${this.currentGenre} to ${genre}`);
    
    const wasPlaying = this.isPlaying;
    
    try {
      // Stop current playback
      if (wasPlaying) {
        await this.stop();
      }
      
      // Clean up current synths and effects
      this.cleanup();
      
      // Update genre
      this.currentGenre = genre;
      this.isInitialized = false;
      
      // Re-initialize with new genre
      await this.initialize();
      
      // Restart if it was playing
      if (wasPlaying) {
        // Use default config for restart
        const defaultConfig: ContinuousLayerConfig = {
          enabled: true,
          genre,
          intensity: 0.5,
          evolutionRate: 0.3,
          baseVolume: -20,
          adaptiveIntensity: true
        };
        await this.start(defaultConfig);
      }
      
      logger.info('configuration', `Genre changed to ${genre} successfully`);
    } catch (error) {
      logger.error('configuration', `Failed to change genre to ${genre}`, error);
      throw new ContinuousLayerError('Genre change failed', 'ambient', genre);
    }
  }
  
  /**
   * Update genre parameters in real-time
   */
  updateParameters(params: {
    intensity?: number;
    filterCutoff?: number;
    activityLevel?: number;
    animationProgress?: number;
  }): void {
    if (!this.isPlaying) {
      return;
    }
    
    try {
      // Update filter cutoff
      if (params.filterCutoff && this.effects.has('filter')) {
        const filter = this.effects.get('filter');
        filter.frequency.rampTo(params.filterCutoff, 1);
      }
      
      // Update intensity (affects volume and brightness)
      if (params.intensity !== undefined) {
        const targetVolume = -40 + (params.intensity * 20); // -40dB to -20dB range
        this.synthVolume.volume.rampTo(targetVolume, 2);
        
        // Update brightness if applicable
        void this.updateBrightness(params.intensity);
      }
      
      // Update evolution rate based on activity
      if (params.activityLevel !== undefined) {
        void this.updateEvolutionRate(params.activityLevel);
      }
      
      // Update modulation based on animation progress
      if (params.animationProgress !== undefined) {
        void this.updateModulation(params.animationProgress);
      }
      
      void logger.debug('parameters', `Updated genre parameters`, params);
    } catch (error) {
      void logger.error('parameters', 'Error updating genre parameters', error);
    }
  }
  
  /**
   * Connect to audio destination
   */
  connect(destination: unknown): void {
    this.synthVolume.connect(destination);
  }
  
  /**
   * Get number of active voices
   */
  getActiveVoices(): number {
    return this.activeVoices;
  }
  
  /**
   * Set sample loader for Freesound integration
   */
  setSampleLoader(loader: FreesoundSampleLoader): void {
    this.sampleLoader = loader;
  }

  /**
   * Set user samples from settings (flat array)
   */
  setUserSamples(userSamples: FreesoundSample[]): void {
    this.userSamples = userSamples || [];
    logger.debug('samples', 'User samples set', {
      count: this.userSamples.length
    });
  }
  
  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    logger.info('cleanup', `Disposing genre engine: ${this.currentGenre}`);
    
    try {
      await this.stop();
      this.cleanup();
      
      this.synthVolume.dispose();
      
      logger.info('cleanup', `Genre engine disposed: ${this.currentGenre}`);
    } catch (error) {
      void logger.error('cleanup', 'Error disposing genre engine', error);
    }
  }
  
  // === PRIVATE METHODS ===
  
  private createSynthesisChain(): void {
    const genreConfig = this.getGenreConfiguration();
    
    // Create primary synth
    this.primarySynth = this.createSynth(genreConfig.primarySynth, genreConfig.parameters);
    
    // Create supporting synths if specified
    if (genreConfig.supportingSynths) {
      for (const synthType of genreConfig.supportingSynths) {
        const synth = this.createSynth(synthType, genreConfig.parameters);
        this.supportingSynths.set(synthType, synth);
      }
    }
    
    // Load samples if available
    if (this.sampleLoader) {
      this.loadGenreSamples(genreConfig.sampleCategories);
    }
  }
  
  private createSynth(type: string, params: GenreParameters): unknown {
    switch (type) {
      case 'fm':
        return new FMSynth({
          oscillator: { type: 'sine' },
          envelope: {
            attack: params.attack,
            decay: params.decay,
            sustain: params.sustain,
            release: params.release
          },
          modulation: { type: 'sine' },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.5,
            release: 0.1
          }
        });
        
      case 'am':
        return new AMSynth({
          oscillator: { type: 'sine' },
          envelope: {
            attack: params.attack,
            decay: params.decay,
            sustain: params.sustain,
            release: params.release
          },
          modulation: { type: 'sine' }
        });
        
      case 'noise':
        return new NoiseSynth({
          noise: { type: 'white' },
          envelope: {
            attack: params.attack,
            decay: params.decay,
            sustain: params.sustain,
            release: params.release
          }
        });
        
      case 'metal':
        return new MetalSynth({
          envelope: {
            attack: 0.001,
            decay: 1.4,
            release: 0.2
          },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5
        });
        
      case 'poly':
        return new PolySynth({
          voice: FMSynth,
          maxPolyphony: 8, // Limit polyphony to prevent voice overflow
          options: {
            oscillator: { type: 'sine' },
            envelope: {
              attack: params.attack,
              decay: params.decay,
              sustain: params.sustain,
              release: params.release
            }
          }
        });

      default:
        return new PolySynth({
          maxPolyphony: 8 // Limit polyphony to prevent voice overflow
        });
    }
  }
  
  private createEffectsChain(): void {
    const genreConfig = this.getGenreConfiguration();
    const params = genreConfig.parameters;

    for (const effectType of genreConfig.effectChain) {
      let effect: unknown;
      
      switch (effectType) {
        case 'reverb':
          effect = new Reverb(2);
          effect.wet.value = params.reverbAmount;
          break;
          
        case 'delay':
          effect = new Delay(params.delayTime, params.delayFeedback);
          break;
          
        case 'chorus':
          effect = new Chorus(4, 2.5, 0.5);
          break;
          
        case 'distortion':
          effect = new Distortion(params.distortionAmount);
          break;
          
        case 'filter':
          effect = new Filter(params.filterCutoff, 'lowpass');
          effect.Q.value = params.resonance;
          break;
          
        case 'phaser':
          effect = new Phaser({
            frequency: 0.5,
            octaves: 3,
            stages: 10,
            Q: 10,
            baseFrequency: 350
          });
          break;
          
        case 'bitcrusher':
          effect = new BitCrusher(4);
          break;
          
        case 'pingpong':
          effect = new PingPongDelay(params.delayTime, params.delayFeedback);
          break;
      }
      
      if (effect) {
        this.effects.set(effectType, effect);
        this.effectsChain.push(effect);
      }
    }
  }
  
  private createModulation(): void {
    const genreConfig = this.getGenreConfiguration();
    
    for (const pattern of genreConfig.modulationPatterns) {
      const lfo = new LFO({
        frequency: pattern.lfoRate,
        type: pattern.waveform,
        min: 0,
        max: pattern.depth
      });
      
      this.lfos.set(`${pattern.parameter}_lfo`, lfo);
    }
  }
  
  private connectAudioChain(): void {
    let currentNode: unknown = this.primarySynth;
    
    // Connect supporting synths to a gain node first
    // (Simplified - would need proper mixing in full implementation)
    
    // Connect through effects chain
    for (const effect of this.effectsChain) {
      void currentNode.connect(effect);
      currentNode = effect;
    }
    
    // Connect to volume control
    void currentNode.connect(this.synthVolume);
  }
  
  private loadGenreSamples(categories: string[]): void {
    if (!this.sampleLoader) {
      return;
    }

    try {
      for (const category of categories) {
        const samples = this.sampleLoader.getSamplesForCategory(category);
        if (samples.length > 0) {
          // Create sampler with first sample (simplified)
          const sampleUrl = samples[0].previewUrl;
          const sampler = new Sampler({
            urls: { C3: sampleUrl },
            onload: () => {
              logger.debug('samples', `Loaded sample for category: ${category}`);
            }
          });

          this.loadedSamples.set(category, sampler);
        }
      }
    } catch (error) {
      logger.warn('samples', `Failed to load samples for genre: ${this.currentGenre}`, error);
    }
  }
  
  private getGenreConfiguration(): GenreConfiguration {
    // Return configuration for current genre
    switch (this.currentGenre) {
      case 'ambient':
        return {
          primarySynth: 'poly',
          supportingSynths: ['fm'],
          parameters: {
            filterCutoff: 800,
            resonance: 1,
            attack: 3,
            decay: 1,
            sustain: 0.8,
            release: 4,
            lfoRate: 0.3,
            lfoDepth: 0.2,
            reverbAmount: 0.4,
            delayTime: '8n',
            delayFeedback: 0.3,
            distortionAmount: 0.1,
            harmonicContent: 3,
            stereoSpread: 0.7,
            brightness: 0.6
          },
          sampleCategories: ['ambient', 'atmospheric'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.1, depth: 200, waveform: 'sine' }
          ],
          effectChain: ['filter', 'reverb', 'delay']
        };
        
      case 'drone':
        return {
          primarySynth: 'fm',
          supportingSynths: ['am'],
          parameters: {
            filterCutoff: 400,
            resonance: 0.5,
            attack: 5,
            decay: 2,
            sustain: 0.9,
            release: 8,
            lfoRate: 0.1,
            lfoDepth: 0.1,
            reverbAmount: 0.6,
            delayTime: '4n',
            delayFeedback: 0.4,
            distortionAmount: 0.05,
            harmonicContent: 2,
            stereoSpread: 0.5,
            brightness: 0.3
          },
          sampleCategories: ['drone', 'atmospheric'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.05, depth: 100, waveform: 'triangle' }
          ],
          effectChain: ['filter', 'reverb']
        };
        
      case 'electronic':
        return {
          primarySynth: 'poly',
          supportingSynths: ['fm', 'am'],
          parameters: {
            filterCutoff: 1200,
            resonance: 2,
            attack: 0.1,
            decay: 0.5,
            sustain: 0.6,
            release: 1,
            lfoRate: 0.5,
            lfoDepth: 0.3,
            reverbAmount: 0.2,
            delayTime: '16n',
            delayFeedback: 0.2,
            distortionAmount: 0.2,
            harmonicContent: 4,
            stereoSpread: 0.9,
            brightness: 0.8
          },
          sampleCategories: ['electronic', 'synth'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.3, depth: 400, waveform: 'square' }
          ],
          effectChain: ['filter', 'chorus', 'delay']
        };
        
      case 'industrial':
        return {
          primarySynth: 'metal',
          supportingSynths: ['noise'],
          parameters: {
            filterCutoff: 600,
            resonance: 3,
            attack: 0.01,
            decay: 0.8,
            sustain: 0.3,
            release: 2,
            lfoRate: 0.8,
            lfoDepth: 0.4,
            reverbAmount: 0.3,
            delayTime: '8n',
            delayFeedback: 0.5,
            distortionAmount: 0.6,
            harmonicContent: 2,
            stereoSpread: 0.8,
            brightness: 0.4
          },
          sampleCategories: ['industrial', 'mechanical'],
          modulationPatterns: [
            { parameter: 'distortionAmount', lfoRate: 0.2, depth: 0.3, waveform: 'sawtooth' }
          ],
          effectChain: ['distortion', 'filter', 'pingpong']
        };
        
      case 'orchestral':
        return {
          primarySynth: 'poly',
          supportingSynths: ['fm'],
          parameters: {
            filterCutoff: 1000,
            resonance: 1,
            attack: 0.5,
            decay: 1,
            sustain: 0.8,
            release: 3,
            lfoRate: 0.05,
            lfoDepth: 0.1,
            reverbAmount: 0.6,
            delayTime: '4n',
            delayFeedback: 0.1,
            distortionAmount: 0,
            harmonicContent: 3,
            stereoSpread: 0.95,
            brightness: 0.6
          },
          sampleCategories: ['orchestral', 'strings'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.02, depth: 200, waveform: 'sine' }
          ],
          effectChain: ['filter', 'reverb']
        };
        
      case 'minimal':
        return {
          primarySynth: 'poly',
          supportingSynths: [],
          parameters: {
            filterCutoff: 600,
            resonance: 0.5,
            attack: 1,
            decay: 2,
            sustain: 0.4,
            release: 4,
            lfoRate: 0.01,
            lfoDepth: 0.05,
            reverbAmount: 0.4,
            delayTime: '2n',
            delayFeedback: 0.1,
            distortionAmount: 0,
            harmonicContent: 1,
            stereoSpread: 0.3,
            brightness: 0.3
          },
          sampleCategories: ['minimal', 'sparse'],
          modulationPatterns: [],
          effectChain: ['filter', 'reverb']
        };
        
      case 'oceanic':
        return {
          primarySynth: 'fm',
          supportingSynths: ['noise'],
          parameters: {
            filterCutoff: 500,
            resonance: 2,
            attack: 2,
            decay: 3,
            sustain: 0.7,
            release: 5,
            lfoRate: 0.07,
            lfoDepth: 0.4,
            reverbAmount: 0.8,
            delayTime: '1n',
            delayFeedback: 0.4,
            distortionAmount: 0,
            harmonicContent: 2,
            stereoSpread: 1,
            brightness: 0.4
          },
          sampleCategories: ['ocean', 'water', 'whale'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.05, depth: 300, waveform: 'sine' }
          ],
          effectChain: ['filter', 'chorus', 'reverb']
        };
        
      case 'sci-fi':
        return {
          primarySynth: 'fm',
          supportingSynths: ['am', 'noise'],
          parameters: {
            filterCutoff: 1500,
            resonance: 4,
            attack: 0.01,
            decay: 0.5,
            sustain: 0.5,
            release: 1.5,
            lfoRate: 2,
            lfoDepth: 0.6,
            reverbAmount: 0.5,
            delayTime: '8n',
            delayFeedback: 0.6,
            distortionAmount: 0.3,
            harmonicContent: 8,
            stereoSpread: 0.8,
            brightness: 0.9
          },
          sampleCategories: ['sci-fi', 'space', 'futuristic'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 1, depth: 800, waveform: 'sawtooth' }
          ],
          effectChain: ['filter', 'phaser', 'delay', 'reverb']
        };
        
      case 'experimental':
        return {
          primarySynth: 'noise',
          supportingSynths: ['fm', 'am', 'metal'],
          parameters: {
            filterCutoff: 800,
            resonance: 5,
            attack: 0.1,
            decay: 0.3,
            sustain: 0.2,
            release: 1,
            lfoRate: 3,
            lfoDepth: 0.8,
            reverbAmount: 0.3,
            delayTime: '16t',
            delayFeedback: 0.7,
            distortionAmount: 0.5,
            harmonicContent: 10,
            stereoSpread: 0.9,
            brightness: 0.7
          },
          sampleCategories: ['experimental', 'glitch', 'abstract'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 5, depth: 1000, waveform: 'sine' },
            { parameter: 'distortionAmount', lfoRate: 0.5, depth: 0.8, waveform: 'square' }
          ],
          effectChain: ['bitcrusher', 'filter', 'pingpong', 'distortion']
        };
        
      case 'urban':
        return {
          primarySynth: 'poly',
          supportingSynths: ['noise'],
          parameters: {
            filterCutoff: 900,
            resonance: 2,
            attack: 0.2,
            decay: 0.8,
            sustain: 0.5,
            release: 2,
            lfoRate: 0.2,
            lfoDepth: 0.2,
            reverbAmount: 0.4,
            delayTime: '8n',
            delayFeedback: 0.3,
            distortionAmount: 0.1,
            harmonicContent: 3,
            stereoSpread: 0.7,
            brightness: 0.6
          },
          sampleCategories: ['urban', 'city', 'traffic'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.1, depth: 200, waveform: 'triangle' }
          ],
          effectChain: ['filter', 'delay', 'reverb']
        };
        
      case 'nature':
        return {
          primarySynth: 'fm',
          supportingSynths: ['poly'],
          parameters: {
            filterCutoff: 700,
            resonance: 1.5,
            attack: 1.5,
            decay: 2,
            sustain: 0.6,
            release: 4,
            lfoRate: 0.08,
            lfoDepth: 0.3,
            reverbAmount: 0.7,
            delayTime: '2n',
            delayFeedback: 0.2,
            distortionAmount: 0,
            harmonicContent: 2,
            stereoSpread: 0.85,
            brightness: 0.5
          },
          sampleCategories: ['nature', 'forest', 'birds', 'wind'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.06, depth: 150, waveform: 'sine' }
          ],
          effectChain: ['filter', 'chorus', 'reverb']
        };
        
      case 'mechanical':
        return {
          primarySynth: 'metal',
          supportingSynths: ['noise', 'fm'],
          parameters: {
            filterCutoff: 1100,
            resonance: 3,
            attack: 0.001,
            decay: 0.1,
            sustain: 0.8,
            release: 0.5,
            lfoRate: 1,
            lfoDepth: 0.5,
            reverbAmount: 0.2,
            delayTime: '16n',
            delayFeedback: 0.4,
            distortionAmount: 0.4,
            harmonicContent: 6,
            stereoSpread: 0.6,
            brightness: 0.8
          },
          sampleCategories: ['mechanical', 'machine', 'motor'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 2, depth: 500, waveform: 'square' }
          ],
          effectChain: ['distortion', 'filter', 'delay']
        };
        
      case 'organic':
        return {
          primarySynth: 'poly',
          supportingSynths: ['fm'],
          parameters: {
            filterCutoff: 800,
            resonance: 1,
            attack: 0.8,
            decay: 1.5,
            sustain: 0.7,
            release: 3,
            lfoRate: 0.1,
            lfoDepth: 0.2,
            reverbAmount: 0.5,
            delayTime: '4n',
            delayFeedback: 0.15,
            distortionAmount: 0,
            harmonicContent: 2,
            stereoSpread: 0.75,
            brightness: 0.55
          },
          sampleCategories: ['organic', 'acoustic', 'wooden'],
          modulationPatterns: [
            { parameter: 'filterCutoff', lfoRate: 0.08, depth: 100, waveform: 'sine' }
          ],
          effectChain: ['filter', 'reverb']
        };
        
      default:
        return this.getGenreConfiguration(); // Fallback to ambient
    }
  }
  
  private applyConfiguration(config: ContinuousLayerConfig): void {
    // Set volume based on config
    this.synthVolume.volume.value = config.baseVolume;
    
    // Apply intensity to filter and other parameters
    this.updateParameters({ intensity: config.intensity });
  }
  
  private async playInitialSound(): Promise<void> {
    if (!this.primarySynth) {
      return;
    }

    try {
      // Use user samples (only enabled ones) - no genre filtering
      let samplesToUse = null;
      let sampleSource = 'none';

      // Check for enabled user samples
      if (this.userSamples && this.userSamples.length > 0) {
        const enabledUserSamples = this.userSamples.filter(s => s.enabled !== false);
        if (enabledUserSamples.length > 0) {
          samplesToUse = enabledUserSamples;
          sampleSource = 'user';
        }
      }

      // If we have samples, play all of them layered together
      if (samplesToUse && samplesToUse.length > 0) {
        logger.info('playback', `Playing ${samplesToUse.length} ${sampleSource} sample(s)`);

        // Play all enabled samples concurrently
        const playPromises = samplesToUse.map((sample, index) =>
          this.playSample(sample, samplesToUse.length)
        );

        await Promise.all(playPromises);
        return;
      }

      // Fallback to synthesized sounds if no samples available
      // Play initial drone/chord based on genre
      switch (this.currentGenre) {
        case 'drone':
        case 'ambient':
          // Play a low drone chord
          this.triggerNote(['C2', 'G2', 'C3'], 16); // Long sustain
          break;

        case 'electronic':
          // Play an evolving pad chord
          this.triggerNote(['C3', 'E3', 'G3'], 8);
          break;

        case 'industrial':
          // Play percussive industrial sound
          if (this.primarySynth instanceof MetalSynth) {
            this.primarySynth.triggerAttackRelease('C2', '2n');
          }
          break;

        case 'orchestral':
          // Play rich orchestral chord
          this.triggerNote(['C2', 'G2', 'C3', 'E3', 'G3'], 12);
          break;

        case 'minimal':
          // Play single sparse note
          this.triggerNote(['C3'], 16);
          break;

        case 'oceanic':
          // Play flowing wave-like chord
          this.triggerNote(['F2', 'C3', 'F3'], 20);
          break;

        case 'sci-fi':
          // Play futuristic interval
          this.triggerNote(['C2', 'F#2', 'C3'], 8);
          break;

        case 'experimental':
          // Play dissonant cluster
          this.triggerNote(['C2', 'C#2', 'D2', 'Eb2'], 6);
          break;

        case 'urban':
          // Play city-like rhythm chord
          this.triggerNote(['A2', 'E3', 'A3'], 8);
          break;

        case 'nature':
          // Play natural harmonics
          this.triggerNote(['D2', 'A2', 'D3', 'F#3'], 16);
          break;

        case 'mechanical':
          // Play industrial rhythm
          this.triggerNote(['E2', 'B2'], 2);
          break;

        case 'organic':
          // Play warm organic chord
          this.triggerNote(['G2', 'D3', 'G3', 'B3'], 12);
          break;

        default:
          this.triggerNote(['C3', 'E3'], 8);
      }
    } catch (error) {
      void logger.error('playback', 'Error playing initial sound', error);
    }
  }

  /**
   * Play a Freesound sample
   * @param sample - The sample to play
   * @param totalSamples - Total number of samples playing (for volume adjustment)
   */
  private async playSample(sample: FreesoundSample, totalSamples: number = 1): Promise<void> {
    try {
      logger.info('playback', `Playing sample: ${sample.title}`, { id: sample.id });

      // Fetch fresh preview URL from Freesound API (same as Preview button)
      // This ensures we always have a valid, non-expired URL
      const apiKey = this.settings?.freesoundApiKey;
      if (!apiKey) {
        void logger.error('playback', 'Freesound API key not configured');
        return;
      }

      const soundUrl = `https://freesound.org/apiv2/sounds/${sample.id}/?token=${apiKey}`;
      logger.debug('api-fetch', 'Fetching fresh preview URL from API', { soundUrl: soundUrl.replace(apiKey, '[REDACTED]') });

      const soundResponse = await requestUrl({ url: soundUrl, method: 'GET' });
      const soundData = JSON.parse(soundResponse.text);
      const previewUrl = soundData.previews?.['preview-hq-mp3'] || soundData.previews?.['preview-lq-mp3'];

      if (!previewUrl) {
        logger.error('playback', 'No preview URL available from API', { sampleId: sample.id });
        return;
      }

      logger.debug('download', 'Downloading sample via requestUrl', {
        previewUrl
      });

      // Download audio via requestUrl to bypass CORS
      const response = await requestUrl({ url: previewUrl, method: 'GET' });
      const blob = new Blob([response.arrayBuffer], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);

      logger.debug('download', 'Sample downloaded, blob URL created', {
        blobUrl,
        blobSize: blob.size
      });

      // Create HTML5 audio element with blob URL (no CORS issues)
      const audio = new Audio(blobUrl);
      this.activeSampleAudios.push(audio);

      logger.debug('audio-element', 'Audio element created with blob URL', {
        sampleTitle: sample.title,
        blobUrl,
        readyState: audio.readyState
      });

      // Adjust volume based on number of samples to prevent clipping
      // Use equal-power panning formula: 1/sqrt(n) for n sources
      const volumeAdjustment = Math.min(1, 1 / Math.sqrt(totalSamples));

      logger.debug('volume', 'Volume adjustment calculated', {
        totalSamples,
        volumeAdjustment,
        formula: `1/sqrt(${totalSamples}) = ${volumeAdjustment}`
      });

      // Apply fade in
      audio.volume = 0;
      const playPromise = audio.play();

      logger.debug('playback', 'Attempting to play audio', {
        initialVolume: audio.volume,
        targetVolume: volumeAdjustment,
        fadeInDuration: sample.fadeIn || 1
      });

      // Handle play promise
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            logger.info('playback', 'Audio playback started successfully', {
              sampleTitle: sample.title,
              currentTime: audio.currentTime,
              duration: audio.duration,
              volume: audio.volume,
              paused: audio.paused
            });
          })
          .catch(error => {
            logger.error('playback', `Failed to play sample: ${sample.title}`, {
              error: error.message,
              errorName: error.name,
              blobUrl
            });
          });
      }

      // Clean up blob URL when audio ends
      audio.addEventListener('ended', () => {
        void URL.revokeObjectURL(blobUrl);
      }, { once: true });

      // Fade in over fadeIn duration
      const fadeInSteps = 20;
      const fadeInInterval = ((sample.fadeIn || 1) * 1000) / fadeInSteps;

      logger.debug('fade-in', 'Fade-in configuration', {
        fadeInSteps,
        fadeInInterval,
        totalFadeInDuration: fadeInSteps * fadeInInterval
      });

      for (let i = 0; i <= fadeInSteps; i++) {
        setTimeout(() => {
          if (audio && this.activeSampleAudios.includes(audio)) {
            audio.volume = Math.min(volumeAdjustment, (i / fadeInSteps) * volumeAdjustment);

            // Log every 5th step to avoid spam
            if (i % 5 === 0 || i === fadeInSteps) {
              logger.debug('fade-in', `Fade-in step ${i}/${fadeInSteps}`, {
                volume: audio.volume,
                paused: audio.paused,
                currentTime: audio.currentTime
              });
            }
          }
        }, i * fadeInInterval);
      }

      // Schedule fade out before end
      const fadeOutStart = (sample.duration || 4) - (sample.fadeOut || 1);
      const fadeOutTimer = window.setTimeout(() => {
        if (audio && this.activeSampleAudios.includes(audio)) {
          const fadeOutSteps = 20;
          const fadeOutInterval = ((sample.fadeOut || 1) * 1000) / fadeOutSteps;
          const currentVolume = audio.volume;

          for (let i = fadeOutSteps; i >= 0; i--) {
            setTimeout(() => {
              if (audio && this.activeSampleAudios.includes(audio)) {
                audio.volume = (i / fadeOutSteps) * currentVolume;
                if (i === 0) {
                  void audio.pause();
                  // Clean up blob URL
                  if (audio.src.startsWith('blob:')) {
                    void URL.revokeObjectURL(audio.src);
                  }
                  // Remove from active list
                  const audioIndex = this.activeSampleAudios.indexOf(audio);
                  if (audioIndex > -1) {
                    this.activeSampleAudios.splice(audioIndex, 1);
                  }
                }
              }
            }, (fadeOutSteps - i) * fadeOutInterval);
          }
        }
      }, fadeOutStart * 1000);

      this.sampleFadeOutTimers.push(fadeOutTimer);

      logger.info('playback', `Sample ${sample.id} playing successfully at ${(volumeAdjustment * 100).toFixed(0)}% volume`);
    } catch (error) {
      logger.error('playback', `Error playing sample ${sample.id}`, error);
    }
  }

  /**
   * Stop all currently playing samples
   */
  private stopActiveSample(): void {
    // Stop all active audio elements
    this.activeSampleAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      // Clean up blob URLs
      if (audio.src.startsWith('blob:')) {
        void URL.revokeObjectURL(audio.src);
      }
    });
    this.activeSampleAudios = [];

    // Clear all fade out timers
    this.sampleFadeOutTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.sampleFadeOutTimers = [];

    void logger.debug('playback', 'Stopped all active samples');
  }
  
  private triggerNote(notes: string | string[], duration: number): void {
    if (!this.primarySynth) {
      return;
    }
    
    try {
      if (!this.primarySynth) return;

      if (Array.isArray(notes)) {
        notes.forEach(note => {
          if (this.primarySynth) {
            this.primarySynth.triggerAttackRelease(note, duration);
            this.activeNotes.add(note);
          }
        });
        this.activeVoices += notes.length;
      } else {
        this.primarySynth.triggerAttackRelease(notes, duration);
        this.activeNotes.add(notes);
        this.activeVoices++;
      }
      
      // Schedule note release from tracking
      setTimeout(() => {
        if (Array.isArray(notes)) {
          notes.forEach(note => this.activeNotes.delete(note));
          this.activeVoices = Math.max(0, this.activeVoices - notes.length);
        } else {
          this.activeNotes.delete(notes);
          this.activeVoices = Math.max(0, this.activeVoices - 1);
        }
      }, duration * 1000);
      
    } catch (error) {
      void logger.error('playback', 'Error triggering note', error);
    }
  }
  
  private releaseAllNotes(): void {
    if (this.primarySynth && 'releaseAll' in this.primarySynth) {
      interface SynthWithReleaseAll {
        releaseAll(): void;
      }
      (this.primarySynth as unknown as SynthWithReleaseAll).releaseAll();
    }

    this.supportingSynths.forEach(synth => {
      if ('releaseAll' in synth) {
        void synth.releaseAll();
      }
    });

    this.activeNotes.clear();
    this.activeVoices = 0;
  }
  
  private startEvolution(): void {
    // Start evolution timer for genre-specific patterns
    this.evolutionTimer = window.setInterval(() => {
      void this.evolvePattern();
    }, 5000); // Evolve every 5 seconds
  }
  
  private stopEvolution(): void {
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      this.evolutionTimer = null;
    }
  }
  
  private evolvePattern(): void {
    // Add subtle evolution to the playing pattern
    // This would be genre-specific
    if (this.currentGenre === 'ambient' || this.currentGenre === 'drone') {
      // Occasionally add a subtle harmonic
      if (Math.random() < 0.3) {
        void this.triggerNote('G3', 4);
      }
    }
  }
  
  private updateBrightness(intensity: number): void {
    // Update filter cutoff to affect brightness
    if (this.effects.has('filter')) {
      const filter = this.effects.get('filter');
      const baseCutoff = this.getGenreConfiguration().parameters.filterCutoff;
      const targetCutoff = baseCutoff + (intensity * 800);
      filter.frequency.rampTo(targetCutoff, 2);
    }
  }
  
  private updateEvolutionRate(activityLevel: number): void {
    // Adjust evolution timer based on activity
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      const baseRate = 5000;
      const adjustedRate = baseRate / Math.max(0.5, activityLevel);
      this.evolutionTimer = window.setInterval(() => {
        void this.evolvePattern();
      }, adjustedRate);
    }
  }
  
  private updateModulation(progress: number): void {
    // Update LFO rates based on animation progress
    this.lfos.forEach((lfo) => {
      interface AudioParamWithValue {
        value: number;
      }
      const baseRate = (lfo.frequency as unknown as AudioParamWithValue).value;
      const modulation = 1 + (progress * 0.5); // Up to 50% faster
      lfo.frequency.rampTo(baseRate * modulation, 3);
    });
  }
  
  private cleanup(): void {
    // Stop and dispose all synths
    if (this.primarySynth) {
      this.primarySynth.dispose();
      this.primarySynth = null;
    }

    this.supportingSynths.forEach(synth => {
      synth.dispose();
    });
    this.supportingSynths.clear();

    // Dispose effects
    this.effects.forEach(effect => {
      effect.dispose();
    });
    this.effects.clear();
    this.effectsChain = [];
    
    // Dispose LFOs
    this.lfos.forEach(lfo => {
      lfo.dispose();
    });
    this.lfos.clear();
    
    // Dispose samples
    this.loadedSamples.forEach(sampler => {
      sampler.dispose();
    });
    this.loadedSamples.clear();
    
    void this.stopEvolution();
  }
}