/**
 * HarmonicLayerManager
 * 
 * Handles harmonic pad layer with cluster-based harmony generation.
 * Creates evolving harmonic progressions based on vault structure and relationships.
 */

import { 
  PolySynth, 
  Volume,
  Filter,
  Reverb,
  Chorus,
  LFO,
  start,
  FMSynth,
  AMSynth
} from 'tone';

import {
  HarmonicLayerConfig,
  VaultState,
  ClusterInfo,
  ChordProgression,
  MusicalScale,
  ContinuousLayerError,
  LayerState
} from './types';
import { SonigraphSettings } from '../../utils/constants';
import { getLogger } from '../../logging';

const logger = getLogger('HarmonicLayerManager');

interface ChordVoicing {
  root: string;
  notes: string[];
  quality: 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4' | 'major7' | 'minor7';
  tension: number; // 0-1 scale of harmonic tension
}

interface HarmonicState {
  currentChord: ChordVoicing | null;
  targetChord: ChordVoicing | null;
  transitionProgress: number;
  lastClusterUpdate: number;
}

export class HarmonicLayerManager {
  private config: HarmonicLayerConfig;
  private isInitialized = false;
  private isPlaying = false;
  
  // Synthesis components
  private chordSynth: PolySynth;
  private padSynth: PolySynth;
  private masterVolume: Volume;
  
  // Effects
  private filter: Filter;
  private reverb: Reverb;
  private chorus: Chorus;
  private modLFO: LFO;
  
  // Harmonic state
  private harmonicState: HarmonicState;
  private currentScale: MusicalScale;
  private progressionTimer: number | null = null;
  
  // Cluster analysis
  private lastClusterAnalysis: ClusterInfo[] = [];
  private harmonyMap: Map<string, ChordVoicing> = new Map();
  
  // Performance tracking
  private activeVoices = 0;
  private cpuUsage = 0;
  
  // Callbacks
  private onStateChange?: (state: LayerState) => void;
  
  constructor(private settings: SonigraphSettings) {
    this.config = {
      enabled: false, // Disabled by default
      chordComplexity: 3, // 3-note chords by default
      progressionSpeed: 30, // Change every 30 seconds
      dissonanceLevel: 0.2,
      clusterInfluence: 0.7,
      scaleConstraints: true
    };
    
    // Initialize harmonic state
    this.harmonicState = {
      currentChord: null,
      targetChord: null,
      transitionProgress: 0,
      lastClusterUpdate: 0
    };
    
    // Default C Major scale
    this.currentScale = {
      name: 'Major',
      intervals: [0, 2, 4, 5, 7, 9, 11],
      key: 'C',
      mode: 'Ionian'
    };
    
    // Create synthesis components
    this.chordSynth = new PolySynth(FMSynth, {
      maxPolyphony: 8, // Limit polyphony to prevent voice overflow
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.8,
        release: 4
      },
      oscillator: {
        type: 'sine'
      }
    });
    
    this.padSynth = new PolySynth(AMSynth, {
      maxPolyphony: 8, // Limit polyphony to prevent voice overflow
      envelope: {
        attack: 3,
        decay: 2,
        sustain: 0.9,
        release: 6
      },
      oscillator: {
        type: 'sawtooth'
      }
    });
    
    this.masterVolume = new Volume(-25);
    this.filter = new Filter(1200, 'lowpass');
    this.reverb = new Reverb(3);
    this.chorus = new Chorus(2, 2.5, 0.3);
    this.modLFO = new LFO(0.1, 0.5, 1.5);
    
    this.initializeHarmonyMappings();
    
    logger.debug('initialization', 'HarmonicLayerManager created');
  }
  
  /**
   * Initialize the harmonic layer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      logger.info('initialization', 'Initializing HarmonicLayerManager');
      
      await start();
      
      // Connect audio chain
      this.connectAudioChain();
      
      // Start modulation LFO
      this.modLFO.start();
      
      this.isInitialized = true;
      
      logger.info('initialization', 'HarmonicLayerManager initialized');
    } catch (error) {
      logger.error('initialization', 'Failed to initialize HarmonicLayerManager', error);
      throw new ContinuousLayerError('Harmonic layer initialization failed', 'harmonic');
    }
  }
  
  /**
   * Start harmonic layer playback
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.debug('playback', 'Harmonic layer disabled, skipping start');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isPlaying) {
      return;
    }
    
    try {
      logger.info('playback', 'Starting harmonic layer playback');
      
      // Start with a basic tonic chord
      const initialChord = this.generateTonicChord();
      await this.transitionToChord(initialChord);
      
      // Start progression timer
      this.startProgression();
      
      this.isPlaying = true;
      
      this.notifyStateChange();
      
      logger.info('playback', 'Harmonic layer playback started');
    } catch (error) {
      logger.error('playback', 'Failed to start harmonic layer', error);
      throw new ContinuousLayerError('Harmonic layer start failed', 'harmonic');
    }
  }
  
  /**
   * Stop harmonic layer playback
   */
  async stop(): Promise<void> {
    if (!this.isPlaying) {
      return;
    }
    
    try {
      logger.info('playback', 'Stopping harmonic layer playback');
      
      // Stop progression
      this.stopProgression();
      
      // Release all notes
      this.chordSynth.releaseAll();
      this.padSynth.releaseAll();
      
      // Fade out volume
      this.masterVolume.volume.rampTo(-60, 3);
      
      // Wait for fade
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.isPlaying = false;
      this.activeVoices = 0;
      this.harmonicState.currentChord = null;
      this.harmonicState.targetChord = null;
      
      this.notifyStateChange();
      
      logger.info('playback', 'Harmonic layer playback stopped');
    } catch (error) {
      logger.error('playback', 'Error stopping harmonic layer', error);
    }
  }
  
  /**
   * Update vault state and adjust harmony based on clusters
   */
  updateVaultState(vaultState: VaultState): void {
    if (!this.isPlaying) {
      return;
    }
    
    try {
      // Analyze clusters for harmonic content
      if (vaultState.clusters) {
        this.analyzeClusterHarmony(vaultState.clusters);
      }
      
      // Update filter based on animation progress
      const filterFreq = 800 + (vaultState.currentAnimationProgress * 800);
      this.filter.frequency.rampTo(filterFreq, 2);
      
      // Update reverb based on vault size
      const densityRatio = vaultState.totalNodes / Math.max(vaultState.maxNodes, 100);
      const reverbAmount = 0.3 + (densityRatio * 0.4);
      this.reverb.wet.rampTo(reverbAmount, 3);
      
      logger.debug('vault-state', 'Updated harmonic layer from vault state', {
        clusters: vaultState.clusters?.length || 0,
        progress: vaultState.currentAnimationProgress,
        nodes: vaultState.totalNodes
      });
      
    } catch (error) {
      logger.error('vault-state', 'Error updating vault state', error);
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HarmonicLayerConfig>): void {
    const oldEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };
    
    logger.debug('configuration', 'Updated harmonic layer config', newConfig);
    
    // Handle enable/disable
    if (newConfig.enabled !== undefined && newConfig.enabled !== oldEnabled) {
      if (newConfig.enabled && !this.isPlaying) {
        this.start().catch(error => {
          logger.error('configuration', 'Failed to start after enabling', error);
        });
      } else if (!newConfig.enabled && this.isPlaying) {
        this.stop().catch(error => {
          logger.error('configuration', 'Failed to stop after disabling', error);
        });
      }
    }
    
    // Update progression speed
    if (newConfig.progressionSpeed !== undefined && this.isPlaying) {
      this.restartProgression();
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Set musical scale for harmonic constraints
   */
  setScale(scale: MusicalScale): void {
    this.currentScale = scale;
    
    logger.info('scale', `Changed scale to ${scale.key} ${scale.name}`, scale);
    
    // Regenerate harmony mappings for new scale
    this.initializeHarmonyMappings();
    
    // If playing, transition to scale-appropriate chord
    if (this.isPlaying) {
      const newChord = this.generateChordFromScale();
      this.transitionToChord(newChord);
    }
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
      currentChord: this.harmonicState.currentChord?.root,
      scale: `${this.currentScale.key} ${this.currentScale.name}`,
      activeVoices: this.activeVoices,
      cpuUsage: this.cpuUsage,
      clusterInfluence: this.config.clusterInfluence
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
    logger.info('cleanup', 'Disposing HarmonicLayerManager');
    
    try {
      await this.stop();
      
      // Dispose audio components
      this.chordSynth.dispose();
      this.padSynth.dispose();
      this.masterVolume.dispose();
      this.filter.dispose();
      this.reverb.dispose();
      this.chorus.dispose();
      this.modLFO.dispose();
      
      this.isInitialized = false;
      
      logger.info('cleanup', 'HarmonicLayerManager disposed');
    } catch (error) {
      logger.error('cleanup', 'Error disposing harmonic layer', error);
    }
  }
  
  // === PRIVATE METHODS ===
  
  private connectAudioChain(): void {
    // Connect both synths through effects chain
    this.chordSynth.connect(this.filter);
    this.padSynth.connect(this.filter);
    
    this.filter.connect(this.chorus);
    this.chorus.connect(this.reverb);
    this.reverb.connect(this.masterVolume);
    
    // Connect LFO to filter for subtle modulation
    this.modLFO.connect(this.filter.frequency);
  }
  
  private initializeHarmonyMappings(): void {
    // Create chord voicings based on current scale
    const scaleNotes = this.getScaleNotes();
    
    // Generate triads for each scale degree
    for (let i = 0; i < scaleNotes.length; i++) {
      const root = scaleNotes[i];
      const third = scaleNotes[(i + 2) % scaleNotes.length];
      const fifth = scaleNotes[(i + 4) % scaleNotes.length];
      
      const chord: ChordVoicing = {
        root,
        notes: [root, third, fifth],
        quality: this.determineChordQuality(i),
        tension: this.calculateTension(i)
      };
      
      this.harmonyMap.set(`chord_${i}`, chord);
      
      // Add extended versions for higher complexity
      if (this.config.chordComplexity >= 4) {
        const seventh = scaleNotes[(i + 6) % scaleNotes.length];
        const extendedChord: ChordVoicing = {
          root,
          notes: [root, third, fifth, seventh],
          quality: chord.quality === 'major' ? 'major7' : 'minor7',
          tension: chord.tension * 1.2
        };
        this.harmonyMap.set(`chord_${i}_7`, extendedChord);
      }
    }
    
    logger.debug('harmony', `Generated ${this.harmonyMap.size} chord voicings for ${this.currentScale.key} ${this.currentScale.name}`);
  }
  
  private getScaleNotes(): string[] {
    // Convert scale intervals to note names
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.indexOf(this.currentScale.key);
    
    return this.currentScale.intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return noteNames[noteIndex] + '3'; // Use octave 3 for chords
    });
  }
  
  private determineChordQuality(scaleDegree: number): ChordVoicing['quality'] {
    // Determine chord quality based on scale degree (for major scale)
    switch (scaleDegree) {
      case 0: case 3: case 4: return 'major'; // I, IV, V
      case 1: case 2: case 5: return 'minor'; // ii, iii, vi
      case 6: return 'diminished'; // vii°
      default: return 'major';
    }
  }
  
  private calculateTension(scaleDegree: number): number {
    // Calculate harmonic tension based on scale degree
    const tensionMap = [0.1, 0.6, 0.4, 0.2, 0.3, 0.5, 0.9]; // I, ii, iii, IV, V, vi, vii°
    return tensionMap[scaleDegree] || 0.5;
  }
  
  private generateTonicChord(): ChordVoicing {
    const tonicChord = this.harmonyMap.get('chord_0');
    if (!tonicChord) {
      // Fallback C major chord
      return {
        root: 'C3',
        notes: ['C3', 'E3', 'G3'],
        quality: 'major',
        tension: 0.1
      };
    }
    return tonicChord;
  }
  
  private generateChordFromScale(): ChordVoicing {
    // Generate a chord based on current harmonic context
    const chordKeys = Array.from(this.harmonyMap.keys());
    const randomKey = chordKeys[Math.floor(Math.random() * chordKeys.length)];
    return this.harmonyMap.get(randomKey);
  }
  
  private analyzeClusterHarmony(clusters: ClusterInfo[]): void {
    if (clusters.length === 0) {
      return;
    }
    
    // Use cluster information to influence harmony
    const dominantCluster = clusters.reduce((prev, current) => 
      current.strength > prev.strength ? current : prev
    );
    
    // Map cluster type to harmonic characteristics
    let targetChordType: string;
    switch (dominantCluster.type) {
      case 'tag-based':
        targetChordType = 'chord_0'; // Stable tonic
        break;
      case 'temporal':
        targetChordType = 'chord_4'; // Dominant
        break;
      case 'link-dense':
        targetChordType = 'chord_5'; // Submediant
        break;
      case 'community':
        targetChordType = 'chord_1'; // Supertonic
        break;
      default:
        targetChordType = 'chord_0';
    }
    
    // Add complexity extension if cluster is strong
    if (dominantCluster.strength > 0.7 && this.config.chordComplexity >= 4) {
      targetChordType += '_7';
    }
    
    const targetChord = this.harmonyMap.get(targetChordType);
    if (targetChord && this.shouldTransition(targetChord)) {
      logger.debug('cluster-harmony', `Transitioning to ${targetChordType} based on ${dominantCluster.type} cluster`);
      this.transitionToChord(targetChord);
    }
  }
  
  private shouldTransition(targetChord: ChordVoicing): boolean {
    // Don't transition too frequently
    const timeSinceLastUpdate = Date.now() - this.harmonicState.lastClusterUpdate;
    if (timeSinceLastUpdate < 10000) { // 10 second minimum
      return false;
    }
    
    // Don't transition to same chord
    if (this.harmonicState.currentChord?.root === targetChord.root) {
      return false;
    }
    
    return true;
  }
  
  private async transitionToChord(chord: ChordVoicing): Promise<void> {
    try {
      // Release current notes
      if (this.harmonicState.currentChord) {
        this.chordSynth.releaseAll();
        this.padSynth.releaseAll();
      }
      
      // Wait briefly for release
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Play new chord
      const velocity = 0.6 - (chord.tension * 0.3); // Lower velocity for tense chords
      
      // Play chord on both synths with slight offset
      this.chordSynth.triggerAttack(chord.notes, undefined, velocity);
      
      setTimeout(() => {
        this.padSynth.triggerAttack(chord.notes, undefined, velocity * 0.7);
      }, 200);
      
      // Update state
      this.harmonicState.currentChord = chord;
      this.harmonicState.lastClusterUpdate = Date.now();
      this.activeVoices = chord.notes.length * 2; // Both synths
      
      logger.debug('chord-transition', `Transitioned to ${chord.quality} chord on ${chord.root}`, {
        notes: chord.notes,
        tension: chord.tension,
        velocity: velocity.toFixed(2)
      });
      
    } catch (error) {
      logger.error('chord-transition', 'Error transitioning to chord', error);
    }
  }
  
  private startProgression(): void {
    if (this.progressionTimer) {
      clearInterval(this.progressionTimer);
    }
    
    this.progressionTimer = window.setInterval(() => {
      this.evolveProgression();
    }, this.config.progressionSpeed * 1000);
  }
  
  private stopProgression(): void {
    if (this.progressionTimer) {
      clearInterval(this.progressionTimer);
      this.progressionTimer = null;
    }
  }
  
  private restartProgression(): void {
    this.stopProgression();
    if (this.isPlaying) {
      this.startProgression();
    }
  }
  
  private evolveProgression(): void {
    // Generate next chord in progression
    if (!this.harmonicState.currentChord) {
      return;
    }
    
    // Simple progression logic - can be enhanced
    const progressionChoices = ['chord_0', 'chord_3', 'chord_4', 'chord_5'];
    const randomChoice = progressionChoices[Math.floor(Math.random() * progressionChoices.length)];
    
    const nextChord = this.harmonyMap.get(randomChoice);
    if (nextChord) {
      this.transitionToChord(nextChord);
    }
  }
  
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
}