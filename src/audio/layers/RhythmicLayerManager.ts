/**
 * RhythmicLayerManager
 * 
 * Handles rhythmic background layer with activity-based tempo mapping.
 * Provides subtle percussion and arpeggiator patterns that respond to vault activity.
 */

import {
  PolySynth,
  MembraneSynth,
  MetalSynth,
  FMSynth,
  Sequence,
  Pattern,
  getTransport,
  Volume,
  Filter,
  Reverb,
  start
} from 'tone';

import {
  RhythmicLayerConfig,
  ActivityMetrics,
  ContinuousLayerError,
  LayerState
} from './types';
import { SonigraphSettings } from '../../utils/constants';
import { getLogger } from '../../logging';

const logger = getLogger('RhythmicLayerManager');

interface RhythmicPattern {
  name: string;
  notes: (string | null)[]; // null represents rests
  durations: string[]; // Tone.js duration notation
  velocity: number[];
  complexity: number; // 0-1 scale
}

export class RhythmicLayerManager {
  private config: RhythmicLayerConfig;
  private isInitialized = false;
  private isPlaying = false;
  
  // Synthesis components
  private percussion: MembraneSynth;
  private metalPerc: MetalSynth;
  private arpSynth: PolySynth;
  private masterVolume: Volume;
  
  // Effects
  private filter: Filter;
  private reverb: Reverb;
  
  // Sequencing
  private currentSequence: Sequence | null = null;
  private currentPattern: Pattern<string> | null = null;
  private activePatterns: Set<string> = new Set();
  
  // Activity tracking
  private lastActivityUpdate = 0;
  private activityBuffer: number[] = [];
  private readonly ACTIVITY_BUFFER_SIZE = 10;
  
  // Rhythm patterns by complexity
  private rhythmPatterns: Map<string, RhythmicPattern> = new Map();
  
  // Performance metrics
  private activeVoices = 0;
  private cpuUsage = 0;
  
  // Callbacks
  private onStateChange?: (state: LayerState) => void;
  
  constructor(private settings: SonigraphSettings) {
    this.config = {
      enabled: false, // Disabled by default
      baseTempo: 80,
      tempoRange: [60, 120],
      percussionIntensity: 0.3,
      arpeggioComplexity: 0.4,
      activitySensitivity: 0.7
    };
    
    // Create synthesis components
    this.percussion = new MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4
      }
    });
    
    this.metalPerc = new MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.01
      },
      harmonicity: 5,
      modulationIndex: 2,
      resonance: 800,
      octaves: 0.5
    });
    
    this.arpSynth = new PolySynth(FMSynth, {
      maxPolyphony: 8, // Limit polyphony to prevent voice overflow
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3
      }
    });
    
    this.masterVolume = new Volume(-30); // Start quiet
    this.filter = new Filter(800, 'lowpass');
    this.reverb = new Reverb(1.5);
    
    void this.initializeRhythmPatterns();
    
    void logger.debug('initialization', 'RhythmicLayerManager created');
  }
  
  /**
   * Initialize the rhythmic layer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      void logger.info('initialization', 'Initializing RhythmicLayerManager');
      
      await start();
      
      // Connect audio chain
      void this.connectAudioChain();
      
      this.isInitialized = true;
      
      void logger.info('initialization', 'RhythmicLayerManager initialized');
    } catch (error) {
      void logger.error('initialization', 'Failed to initialize RhythmicLayerManager', error);
      throw new ContinuousLayerError('Rhythmic layer initialization failed', 'rhythmic');
    }
  }
  
  /**
   * Start rhythmic layer playback
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      void logger.debug('playback', 'Rhythmic layer disabled, skipping start');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isPlaying) {
      return;
    }
    
    try {
      void logger.info('playback', 'Starting rhythmic layer playback');
      
      // Set initial tempo
      getTransport().bpm.value = this.config.baseTempo;
      
      // Start with a simple pattern
      void this.startPattern('gentle');
      
      this.isPlaying = true;
      
      void this.notifyStateChange();
      
      void logger.info('playback', 'Rhythmic layer playback started');
    } catch (error) {
      void logger.error('playback', 'Failed to start rhythmic layer', error);
      throw new ContinuousLayerError('Rhythmic layer start failed', 'rhythmic');
    }
  }
  
  /**
   * Stop rhythmic layer playback
   */
  async stop(): Promise<void> {
    if (!this.isPlaying) {
      return;
    }
    
    try {
      void logger.info('playback', 'Stopping rhythmic layer playback');
      
      // Stop all patterns
      void this.stopAllPatterns();
      
      // Fade out volume
      this.masterVolume.volume.rampTo(-60, 1);
      
      // Wait for fade
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isPlaying = false;
      this.activeVoices = 0;
      
      void this.notifyStateChange();
      
      void logger.info('playback', 'Rhythmic layer playback stopped');
    } catch (error) {
      void logger.error('playback', 'Error stopping rhythmic layer', error);
    }
  }
  
  /**
   * Update activity metrics and adjust rhythm accordingly
   */
  updateActivity(metrics: ActivityMetrics): void {
    if (!this.isPlaying) {
      return;
    }
    
    this.lastActivityUpdate = Date.now();
    
    // Add to activity buffer
    this.activityBuffer.push(metrics.eventRate);
    if (this.activityBuffer.length > this.ACTIVITY_BUFFER_SIZE) {
      this.activityBuffer.shift();
    }
    
    // Calculate smoothed activity level
    const avgActivity = this.activityBuffer.reduce((sum, val) => sum + val, 0) / this.activityBuffer.length;
    
    try {
      // Map activity to tempo
      const tempoRange = this.config.tempoRange[1] - this.config.tempoRange[0];
      const activityRatio = Math.min(avgActivity / 10, 1); // Normalize to 0-1
      const targetTempo = this.config.tempoRange[0] + (activityRatio * tempoRange);
      
      // Smooth tempo changes
      getTransport().bpm.rampTo(targetTempo, 2);
      
      // Handle intensity spikes
      if (metrics.intensitySpikes) {
        void this.triggerDensityBurst(metrics.recentEventCount);
      }
      
      // Adjust pattern complexity based on activity
      void this.adjustPatternComplexity(activityRatio);
      
      logger.debug('activity', `Updated rhythm activity`, {
        eventRate: metrics.eventRate,
        avgActivity,
        targetTempo: Math.round(targetTempo),
        intensitySpikes: metrics.intensitySpikes
      });
      
    } catch (error) {
      void logger.error('activity', 'Error updating rhythm activity', error);
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RhythmicLayerConfig>): void {
    const oldEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };
    
    void logger.debug('configuration', 'Updated rhythmic layer config', newConfig);
    
    // Handle enable/disable
    if (newConfig.enabled !== undefined && newConfig.enabled !== oldEnabled) {
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
    
    // Apply volume changes immediately
    if (newConfig.percussionIntensity !== undefined && this.isPlaying) {
      const targetVolume = -40 + (newConfig.percussionIntensity * 20);
      this.masterVolume.volume.rampTo(targetVolume, 1);
    }
    
    void this.notifyStateChange();
  }
  
  /**
   * Check if layer is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      enabled: this.config.enabled,
      tempo: getTransport().bpm.value,
      activeVoices: this.activeVoices,
      cpuUsage: this.cpuUsage,
      activePatterns: Array.from(this.activePatterns)
    };
  }
  
  /**
   * Set state change callback
   */
  setStateChangeCallback(callback: (state: LayerState) => void): void {
    this.onStateChange = callback;
  }
  
  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    void logger.info('cleanup', 'Disposing RhythmicLayerManager');
    
    try {
      await this.stop();
      
      // Dispose audio components
      this.percussion.dispose();
      this.metalPerc.dispose();
      this.arpSynth.dispose();
      this.masterVolume.dispose();
      this.filter.dispose();
      this.reverb.dispose();
      
      this.isInitialized = false;
      
      void logger.info('cleanup', 'RhythmicLayerManager disposed');
    } catch (error) {
      void logger.error('cleanup', 'Error disposing rhythmic layer', error);
    }
  }
  
  // === PRIVATE METHODS ===
  
  private connectAudioChain(): void {
    // Connect percussion through effects
    this.percussion.connect(this.filter);
    this.metalPerc.connect(this.filter);
    this.arpSynth.connect(this.filter);
    
    this.filter.connect(this.reverb);
    this.reverb.connect(this.masterVolume);
  }
  
  private initializeRhythmPatterns(): void {
    // Gentle pattern for low activity
    this.rhythmPatterns.set('gentle', {
      name: 'Gentle',
      notes: ['C2', null, null, null, 'C2', null, null, null],
      durations: ['8n', '8n', '8n', '8n', '8n', '8n', '8n', '8n'],
      velocity: [0.3, 0, 0, 0, 0.2, 0, 0, 0],
      complexity: 0.2
    });
    
    // Moderate pattern
    this.rhythmPatterns.set('moderate', {
      name: 'Moderate',
      notes: ['C2', null, 'G2', null, 'C2', null, 'G2', 'C2'],
      durations: ['8n', '8n', '8n', '8n', '8n', '8n', '16n', '16n'],
      velocity: [0.4, 0, 0.3, 0, 0.4, 0, 0.2, 0.3],
      complexity: 0.5
    });
    
    // Active pattern for high activity
    this.rhythmPatterns.set('active', {
      name: 'Active',
      notes: ['C2', 'G2', 'C2', 'G2', 'C2', 'G2', 'C2', 'G2'],
      durations: ['16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n'],
      velocity: [0.5, 0.3, 0.4, 0.3, 0.5, 0.3, 0.4, 0.3],
      complexity: 0.8
    });
    
    logger.debug('patterns', `Initialized ${this.rhythmPatterns.size} rhythm patterns`);
  }
  
  private startPattern(patternName: string): void {
    const pattern = this.rhythmPatterns.get(patternName);
    if (!pattern) {
      logger.warn('patterns', `Pattern not found: ${patternName}`);
      return;
    }
    
    try {
      // Stop existing patterns
      void this.stopAllPatterns();
      
      // Create new sequence
      this.currentSequence = new Sequence((time, note) => {
        if (note && note.note) {
          void this.playRhythmNote(time, note.note, note.velocity);
        }
      }, pattern.notes.map((note, i) => ({
        note,
        velocity: pattern.velocity[i]
      })), pattern.durations[0]);
      
      // Start the sequence
      this.currentSequence.start();
      this.activePatterns.add(patternName);
      
      logger.debug('patterns', `Started pattern: ${patternName}`, {
        complexity: pattern.complexity,
        noteCount: pattern.notes.filter(n => n !== null).length
      });
      
    } catch (error) {
      logger.error('patterns', `Failed to start pattern: ${patternName}`, error);
    }
  }
  
  private stopAllPatterns(): void {
    if (this.currentSequence) {
      this.currentSequence.stop();
      this.currentSequence.dispose();
      this.currentSequence = null;
    }
    
    if (this.currentPattern) {
      this.currentPattern.stop();
      this.currentPattern.dispose();
      this.currentPattern = null;
    }
    
    this.activePatterns.clear();
  }
  
  private playRhythmNote(time: number, note: string, velocity: number): void {
    try {
      // Choose instrument based on note
      if (note.includes('2')) {
        // Low notes on membrane synth (kick-like)
        this.percussion.triggerAttackRelease(note, '8n', time, velocity);
        this.activeVoices++;
        
        // Release tracking
        setTimeout(() => {
          this.activeVoices = Math.max(0, this.activeVoices - 1);
        }, 200);
        
      } else {
        // Higher notes on metal synth (hi-hat-like)
        this.metalPerc.triggerAttackRelease(note, '16n', time, velocity * 0.7);
        this.activeVoices++;
        
        // Release tracking
        setTimeout(() => {
          this.activeVoices = Math.max(0, this.activeVoices - 1);
        }, 100);
      }
      
    } catch (error) {
      void logger.error('playback', 'Error playing rhythm note', error);
    }
  }
  
  private triggerDensityBurst(eventCount: number): void {
    // Trigger a brief burst of activity for high-density events
    if (eventCount < 5) {
      return;
    }
    
    try {
      logger.debug('activity', `Triggering density burst for ${eventCount} events`);
      
      // Play a quick fill
      const fillNotes = ['C3', 'G3', 'C3', 'G3'];
      fillNotes.forEach((note, i) => {
        const delay = i * 50; // 50ms spacing
        setTimeout(() => {
          this.metalPerc.triggerAttackRelease(note, '32n', undefined, 0.6);
        }, delay);
      });
      
    } catch (error) {
      void logger.error('activity', 'Error triggering density burst', error);
    }
  }
  
  private adjustPatternComplexity(activityRatio: number): void {
    let targetPattern: string;
    
    if (activityRatio < 0.3) {
      targetPattern = 'gentle';
    } else if (activityRatio < 0.7) {
      targetPattern = 'moderate';
    } else {
      targetPattern = 'active';
    }
    
    // Only switch if we're not already using this pattern
    if (!this.activePatterns.has(targetPattern)) {
      logger.debug('patterns', `Switching to ${targetPattern} pattern (activity: ${activityRatio.toFixed(2)})`);
      void this.startPattern(targetPattern);
    }
  }
  
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
}