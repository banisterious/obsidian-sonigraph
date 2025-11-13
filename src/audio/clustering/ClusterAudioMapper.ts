/**
 * ClusterAudioMapper - Phase 5.1: Cluster-Based Musical Themes
 *
 * Maps cluster data to unique sonic characteristics and handles cluster transitions
 */

import { Cluster, SmartClusteringAlgorithms } from '../../graph/SmartClusteringAlgorithms';
import { GraphNode, GraphLink } from '../../graph/GraphDataExtractor';
import { getLogger } from '../../logging';
import {
  ClusterAudioTheme,
  ClusterType,
  ClusterTransitionEvent,
  ClusterTransitionType,
  ClusterAudioSettings,
  ClusterAudioState,
  ActiveClusterAudio,
  ClusterAudioAnalysis,
  Community,
  CommunityDetectionSettings,
  CommunityEvolutionSettings
} from './types';
import { ClusterThemeGenerator } from './ClusterThemeGenerator';
import { CommunityAudioAnalyzer } from './CommunityAudioAnalyzer';
import { CommunityEvolutionTracker } from './CommunityEvolutionTracker';
import { HubOrchestrationManager } from '../orchestration/HubOrchestrationManager';
import { HubTransitionHandler } from '../orchestration/HubTransitionHandler';
import type { HubOrchestrationSettings, OrchestrationDecisions, HubMetrics } from '../orchestration/types';
import { MusicalTheoryEngine } from '../theory/MusicalTheoryEngine';
import type { MusicalTheoryConfig, NoteName, ScaleType, ModalScale } from '../theory/types';
import * as Tone from 'tone';

const logger = getLogger('cluster-audio');

export class ClusterAudioMapper {
  private themeGenerator: ClusterThemeGenerator;
  private settings: ClusterAudioSettings;
  private state: ClusterAudioState;
  private masterVolume: Tone.Volume;
  private isInitialized = false;
  private updateThrottleTimer: NodeJS.Timeout | null = null;

  // Cluster tracking for transition detection
  private previousClusters: Map<string, Cluster> = new Map();
  private nodeClusterMapping: Map<string, string> = new Map();

  // Phase 5.3: Community detection integration
  private communityAnalyzer: CommunityAudioAnalyzer | null = null;
  private communityEvolutionTracker: CommunityEvolutionTracker | null = null;
  private communityDetectionSettings: CommunityDetectionSettings | null = null;
  private communityEvolutionSettings: CommunityEvolutionSettings | null = null;
  private clusteringAlgorithms: SmartClusteringAlgorithms | null = null;

  // Phase 5.2: Hub orchestration integration
  private hubOrchestrationManager: HubOrchestrationManager | null = null;
  private hubTransitionHandler: HubTransitionHandler | null = null;
  private hubOrchestrationSettings: HubOrchestrationSettings | null = null;
  private allNodes: GraphNode[] = [];
  private allLinks: GraphLink[] = [];

  // Phase 6.1: Musical theory integration
  private musicalTheoryEngine: MusicalTheoryEngine | null = null;
  private musicalTheoryConfig: MusicalTheoryConfig | null = null;

  constructor(
    settings: ClusterAudioSettings,
    communityDetectionSettings?: CommunityDetectionSettings,
    communityEvolutionSettings?: CommunityEvolutionSettings,
    clusteringAlgorithms?: SmartClusteringAlgorithms,
    hubOrchestrationSettings?: HubOrchestrationSettings,
    musicalTheoryConfig?: MusicalTheoryConfig
  ) {
    logger.debug('initialization', 'ClusterAudioMapper created');

    this.settings = { ...settings };
    this.themeGenerator = new ClusterThemeGenerator();
    this.masterVolume = new Tone.Volume(this.settings.globalVolume * -20); // Convert to dB

    // Initialize state
    this.state = {
      activeClusters: new Map(),
      activeTransitions: new Map(),
      lastUpdateTime: Date.now(),
      currentStrengthValues: new Map()
    };

    // Phase 5.3: Initialize community detection if settings provided
    if (communityDetectionSettings && communityEvolutionSettings && clusteringAlgorithms) {
      this.communityDetectionSettings = communityDetectionSettings;
      this.communityEvolutionSettings = communityEvolutionSettings;
      this.clusteringAlgorithms = clusteringAlgorithms;
      this.communityAnalyzer = new CommunityAudioAnalyzer(
        communityDetectionSettings,
        clusteringAlgorithms
      );
      this.communityEvolutionTracker = new CommunityEvolutionTracker(
        communityEvolutionSettings,
        this.masterVolume
      );
    }

    // Phase 5.2: Initialize hub orchestration if settings provided
    if (hubOrchestrationSettings) {
      this.hubOrchestrationSettings = hubOrchestrationSettings;
      if (hubOrchestrationSettings.enabled) {
        this.hubOrchestrationManager = new HubOrchestrationManager(hubOrchestrationSettings);
        this.hubTransitionHandler = new HubTransitionHandler(
          this.masterVolume,
          hubOrchestrationSettings.transitionsEnabled
        );
        logger.debug('initialization', 'Hub orchestration initialized');
      }
    }

    // Phase 6.1: Initialize musical theory if config provided
    if (musicalTheoryConfig) {
      this.musicalTheoryConfig = musicalTheoryConfig;
      if (musicalTheoryConfig.enabled) {
        this.musicalTheoryEngine = new MusicalTheoryEngine(musicalTheoryConfig);
        logger.debug('initialization', `Musical theory initialized: ${musicalTheoryConfig.rootNote} ${musicalTheoryConfig.scale}`);
      }
    }

    // Connect master volume to destination
    this.masterVolume.toDestination();
  }

  /**
   * Initialize the cluster audio system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.debug('initialization', 'Initializing cluster audio system');

      // Initialize theme generator
      await this.themeGenerator.initialize();

      // Phase 5.3: Initialize community detection components
      if (this.communityAnalyzer) {
        await this.communityAnalyzer.initialize();
        logger.debug('initialization', 'Community audio analyzer initialized');
      }

      if (this.communityEvolutionTracker) {
        await this.communityEvolutionTracker.initialize();
        logger.debug('initialization', 'Community evolution tracker initialized');
      }

      // Set up performance monitoring
      this.startPerformanceMonitoring();

      this.isInitialized = true;
      logger.debug('initialization', 'Cluster audio system initialized successfully');
    } catch (error) {
      logger.error('initialization', 'Failed to initialize cluster audio system', { error });
      throw error;
    }
  }

  /**
   * Phase 5.2: Update graph data for hub orchestration
   */
  public updateGraphData(nodes: GraphNode[], links: GraphLink[]): void {
    this.allNodes = nodes;
    this.allLinks = links;

    // Update hub metrics if orchestration is enabled
    if (this.hubOrchestrationManager && this.hubOrchestrationSettings?.enabled) {
      this.hubOrchestrationManager.updateHubMetrics(nodes, links);

      // Detect and trigger hub transitions
      if (this.hubTransitionHandler && this.hubOrchestrationSettings.transitionsEnabled) {
        // This will be called from the orchestration manager when metrics are updated
        logger.debug('hub-transitions', 'Hub metrics updated, transitions will be detected on next orchestration');
      }
    }
  }

  /**
   * Process clusters and generate audio mapping
   */
  public async processClusters(clusters: Cluster[]): Promise<void> {
    if (!this.isInitialized || !this.settings.enabled) {
      return;
    }

    // Throttle updates to prevent audio crackling
    if (this.updateThrottleTimer) {
      clearTimeout(this.updateThrottleTimer);
    }

    this.updateThrottleTimer = setTimeout(async () => {
      await this.processClustersCached(clusters);
    }, this.settings.updateThrottleMs);
  }

  /**
   * Internal cluster processing (throttled)
   */
  private async processClustersCached(clusters: Cluster[]): Promise<void> {
    logger.debug('processing', 'Processing clusters for audio mapping', {
      clusterCount: clusters.length
    });

    try {
      // Detect cluster transitions
      const transitions = this.detectClusterTransitions(clusters);

      // Process transitions first
      for (const transition of transitions) {
        await this.handleClusterTransition(transition);
      }

      // Update active clusters
      await this.updateActiveClusters(clusters);

      // Update cluster strength modulation
      if (this.settings.strengthModulation) {
        this.updateClusterStrengthModulation(clusters);
      }

      // Update previous clusters for next transition detection
      this.previousClusters.clear();
      clusters.forEach(cluster => {
        this.previousClusters.set(cluster.id, { ...cluster });
      });

      this.state.lastUpdateTime = Date.now();

    } catch (error) {
      logger.error('processing', 'Error processing clusters', { error });
    }
  }

  /**
   * Detect cluster transitions by comparing current and previous cluster states
   */
  private detectClusterTransitions(currentClusters: Cluster[]): ClusterTransitionEvent[] {
    const transitions: ClusterTransitionEvent[] = [];
    const currentClusterIds = new Set(currentClusters.map(c => c.id));
    const previousClusterIds = new Set(this.previousClusters.keys());

    // Detect cluster formations
    for (const cluster of currentClusters) {
      if (!this.previousClusters.has(cluster.id)) {
        transitions.push(this.createTransitionEvent('formation', cluster));
      } else {
        // Detect strength changes
        const previousCluster = this.previousClusters.get(cluster.id)!;
        const strengthDiff = Math.abs(cluster.strength - previousCluster.strength);

        if (strengthDiff > 0.1) { // Threshold for significant strength change
          transitions.push(this.createTransitionEvent('strength_change', cluster, undefined, cluster.strength));
        }

        // Detect node joins/leaves
        const previousNodeIds = new Set(previousCluster.nodes.map(n => n.id));
        const currentNodeIds = new Set(cluster.nodes.map(n => n.id));

        // Node joins
        for (const nodeId of currentNodeIds) {
          if (!previousNodeIds.has(nodeId)) {
            transitions.push(this.createTransitionEvent('join', cluster, nodeId));
          }
        }

        // Node leaves
        for (const nodeId of previousNodeIds) {
          if (!currentNodeIds.has(nodeId)) {
            transitions.push(this.createTransitionEvent('leave', cluster, nodeId));
          }
        }
      }
    }

    // Detect cluster dissolutions
    for (const clusterId of previousClusterIds) {
      if (!currentClusterIds.has(clusterId)) {
        const dissolvedCluster = this.previousClusters.get(clusterId)!;
        transitions.push(this.createTransitionEvent('dissolution', dissolvedCluster));
      }
    }

    logger.debug('transitions', 'Detected cluster transitions', {
      transitionCount: transitions.length,
      transitions: transitions.map(t => ({ type: t.type, clusterId: t.clusterId }))
    });

    return transitions;
  }

  /**
   * Create a cluster transition event
   */
  private createTransitionEvent(
    type: ClusterTransitionType,
    cluster: Cluster,
    nodeId?: string,
    strength?: number
  ): ClusterTransitionEvent {
    const transitionConfig = this.getTransitionAudioConfig(type, cluster.type);

    return {
      type,
      clusterId: cluster.id,
      clusterType: cluster.type,
      nodeId,
      strength,
      timestamp: Date.now(),
      audioConfig: transitionConfig
    };
  }

  /**
   * Get audio configuration for different transition types
   */
  private getTransitionAudioConfig(transitionType: ClusterTransitionType, clusterType: ClusterType) {
    const baseConfigs = {
      join: {
        duration: 1.0,
        pitchDirection: 'ascending' as const,
        pitchRange: 12,
        volumeFade: 'in' as const,
        effectType: 'glissando' as const
      },
      leave: {
        duration: 1.5,
        pitchDirection: 'descending' as const,
        pitchRange: 12,
        volumeFade: 'out' as const,
        effectType: 'glissando' as const
      },
      formation: {
        duration: 2.0,
        pitchDirection: 'ascending' as const,
        pitchRange: 24,
        volumeFade: 'in' as const,
        effectType: 'harmonic_buildup' as const
      },
      dissolution: {
        duration: 2.5,
        pitchDirection: 'descending' as const,
        pitchRange: 24,
        volumeFade: 'out' as const,
        effectType: 'filter_sweep' as const
      },
      strength_change: {
        duration: 0.8,
        pitchDirection: 'stable' as const,
        pitchRange: 0,
        volumeFade: 'cross' as const,
        effectType: 'filter_sweep' as const
      }
    };

    const config = baseConfigs[transitionType];

    // Adjust duration based on transition speed setting
    config.duration *= (2.0 - this.settings.transitionSpeed); // Faster = shorter duration

    return config;
  }

  /**
   * Handle a cluster transition event
   */
  private async handleClusterTransition(transition: ClusterTransitionEvent): Promise<void> {
    if (!this.settings.transitionsEnabled) return;

    logger.debug('transition', 'Handling cluster transition', {
      type: transition.type,
      clusterId: transition.clusterId,
      clusterType: transition.clusterType
    });

    try {
      // Store the transition for potential cleanup
      this.state.activeTransitions.set(
        `${transition.clusterId}_${transition.timestamp}`,
        transition
      );

      // Execute the transition audio effect
      await this.executeTransitionEffect(transition);

      // Clean up completed transitions
      setTimeout(() => {
        this.state.activeTransitions.delete(`${transition.clusterId}_${transition.timestamp}`);
      }, transition.audioConfig.duration * 1000);

    } catch (error) {
      logger.error('transition', 'Error handling cluster transition', {
        transition,
        error
      });
    }
  }

  /**
   * Execute the actual audio effect for a transition
   */
  private async executeTransitionEffect(transition: ClusterTransitionEvent): Promise<void> {
    const theme = this.themeGenerator.getThemeForClusterType(transition.clusterType);
    const config = transition.audioConfig;
    const volume = this.settings.transitionVolume;

    // Create temporary audio source for transition
    const transitionSynth = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: config.duration * 0.7
      }
    }).connect(this.masterVolume);

    const now = Tone.now();

    try {
      switch (config.effectType) {
        case 'glissando':
          await this.executeGlissando(transitionSynth, theme, config, volume, now);
          break;
        case 'harmonic_buildup':
          await this.executeHarmonicBuildup(transitionSynth, theme, config, volume, now);
          break;
        case 'filter_sweep':
          await this.executeFilterSweep(transitionSynth, theme, config, volume, now);
          break;
        case 'granular_scatter':
          await this.executeGranularScatter(transitionSynth, theme, config, volume, now);
          break;
      }

      // Clean up the temporary synth
      setTimeout(() => {
        transitionSynth.dispose();
      }, (config.duration + 1) * 1000);

    } catch (error) {
      logger.error('transition-effect', 'Error executing transition effect', { error });
      transitionSynth.dispose();
    }
  }

  /**
   * Execute glissando transition effect
   */
  private async executeGlissando(
    synth: Tone.MonoSynth,
    theme: ClusterAudioTheme,
    config: any,
    volume: number,
    startTime: number
  ): Promise<void> {
    const startFreq = theme.baseFrequency;
    const endFreq = config.pitchDirection === 'ascending'
      ? startFreq * Math.pow(2, config.pitchRange / 12)
      : startFreq / Math.pow(2, config.pitchRange / 12);

    synth.volume.value = Tone.gainToDb(volume * theme.dynamicsRange.baseVolume);
    synth.triggerAttack(startFreq, startTime);

    // Create glissando by sweeping frequency
    synth.frequency.rampTo(endFreq, config.duration, startTime);

    // Handle volume fade
    if (config.volumeFade === 'out') {
      synth.volume.rampTo(-Infinity, config.duration, startTime + config.duration * 0.3);
    }

    synth.triggerRelease(startTime + config.duration);
  }

  /**
   * Execute harmonic buildup transition effect
   */
  private async executeHarmonicBuildup(
    synth: Tone.MonoSynth,
    theme: ClusterAudioTheme,
    config: any,
    volume: number,
    startTime: number
  ): Promise<void> {
    // Create multiple harmonics that build up over time
    const harmonics = theme.harmonicIntervals.slice(0, 4); // Use first 4 harmonics

    for (let i = 0; i < harmonics.length; i++) {
      const harmonic = harmonics[i];
      const freq = theme.baseFrequency * Math.pow(2, harmonic / 12);
      const delay = (config.duration / harmonics.length) * i;

      const harmonicSynth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.2,
          decay: 0.3,
          sustain: 0.4,
          release: config.duration - delay
        }
      }).connect(this.masterVolume);

      const harmonicVolume = volume * theme.dynamicsRange.baseVolume * (0.8 - i * 0.15); // Decreasing volume
      harmonicSynth.volume.value = Tone.gainToDb(harmonicVolume);

      harmonicSynth.triggerAttackRelease(freq, config.duration - delay, startTime + delay);

      // Clean up
      setTimeout(() => {
        harmonicSynth.dispose();
      }, (config.duration + 1) * 1000);
    }
  }

  /**
   * Execute filter sweep transition effect
   */
  private async executeFilterSweep(
    synth: Tone.MonoSynth,
    theme: ClusterAudioTheme,
    config: any,
    volume: number,
    startTime: number
  ): Promise<void> {
    // Add a filter to the synth
    const filter = new Tone.Filter({
      frequency: theme.filterCutoff,
      type: 'lowpass',
      Q: theme.resonance * 10
    }).connect(this.masterVolume);

    synth.disconnect();
    synth.connect(filter);

    synth.volume.value = Tone.gainToDb(volume * theme.dynamicsRange.baseVolume);
    synth.triggerAttack(theme.baseFrequency, startTime);

    // Sweep filter frequency
    const endFilterFreq = config.pitchDirection === 'ascending' ? 8000 : 200;
    filter.frequency.rampTo(endFilterFreq, config.duration, startTime);

    if (config.volumeFade === 'out') {
      synth.volume.rampTo(-Infinity, config.duration * 0.8, startTime + config.duration * 0.2);
    }

    synth.triggerRelease(startTime + config.duration);

    // Clean up filter
    setTimeout(() => {
      filter.dispose();
    }, (config.duration + 1) * 1000);
  }

  /**
   * Execute granular scatter transition effect
   */
  private async executeGranularScatter(
    synth: Tone.MonoSynth,
    theme: ClusterAudioTheme,
    config: any,
    volume: number,
    startTime: number
  ): Promise<void> {
    // Create scattered granular-like effect with multiple short notes
    const grainCount = 8;
    const grainDuration = config.duration / grainCount;

    for (let i = 0; i < grainCount; i++) {
      const grainSynth = new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0,
          release: 0.1
        }
      }).connect(this.masterVolume);

      const grainTime = startTime + (i * grainDuration) + (Math.random() * grainDuration * 0.5);
      const grainFreq = theme.baseFrequency * (0.8 + Math.random() * 0.4); // Random variation
      const grainVol = volume * theme.dynamicsRange.baseVolume * (0.3 + Math.random() * 0.4);

      grainSynth.volume.value = Tone.gainToDb(grainVol);
      grainSynth.triggerAttackRelease(grainFreq, grainDuration * 0.3, grainTime);

      // Clean up
      setTimeout(() => {
        grainSynth.dispose();
      }, (config.duration + 1) * 1000);
    }
  }

  /**
   * Update active cluster audio based on current cluster state
   */
  private async updateActiveClusters(clusters: Cluster[]): Promise<void> {
    const currentClusterIds = new Set(clusters.map(c => c.id));
    const activeClusterIds = new Set(this.state.activeClusters.keys());

    // Stop audio for removed clusters
    for (const clusterId of activeClusterIds) {
      if (!currentClusterIds.has(clusterId)) {
        await this.stopClusterAudio(clusterId);
      }
    }

    // Start or update audio for current clusters
    for (const cluster of clusters) {
      if (!this.settings.clusterTypeEnabled[cluster.type]) {
        continue; // Skip disabled cluster types
      }

      if (this.state.activeClusters.has(cluster.id)) {
        // Update existing cluster audio
        await this.updateClusterAudio(cluster);
      } else {
        // Start new cluster audio
        await this.startClusterAudio(cluster);
      }
    }
  }

  /**
   * Start audio for a new cluster
   */
  private async startClusterAudio(cluster: Cluster): Promise<void> {
    if (this.state.activeClusters.size >= this.settings.maxSimultaneousClusters) {
      logger.debug('cluster-limit', 'Maximum simultaneous clusters reached', {
        max: this.settings.maxSimultaneousClusters,
        current: this.state.activeClusters.size
      });
      return;
    }

    logger.debug('cluster-start', 'Starting cluster audio', {
      clusterId: cluster.id,
      type: cluster.type,
      nodeCount: cluster.nodes.length
    });

    try {
      // Phase 5.2: Apply hub orchestration if enabled
      let orchestrationDecisions: OrchestrationDecisions | null = null;
      if (this.hubOrchestrationManager && this.hubOrchestrationSettings?.enabled) {
        orchestrationDecisions = this.hubOrchestrationManager.orchestrateClusterFromHub(
          cluster,
          this.allNodes,
          this.allLinks
        );
        logger.debug('cluster-start', 'Hub orchestration applied', {
          clusterId: cluster.id,
          hubNodeId: orchestrationDecisions.hubNodeId,
          harmonyComplexity: orchestrationDecisions.harmonyComplexity
        });
      }

      const theme = this.themeGenerator.getThemeForClusterType(cluster.type);
      const volume = orchestrationDecisions
        ? (orchestrationDecisions.volumeDistribution.get(cluster.nodes[0]?.id) || 0.5)
        : (this.settings.clusterTypeVolumes[cluster.type] || 0.5);

      // Create audio source for cluster
      const audioSource = this.createClusterAudioSource(theme);
      const effectChain = this.createClusterEffectChain(theme);

      // Connect audio chain
      audioSource.connect(effectChain);
      effectChain.connect(this.masterVolume);

      // Calculate initial parameters
      const frequency = this.calculateClusterFrequency(cluster, theme);
      const filterFreq = this.calculateClusterFilter(cluster, theme);

      // Create active cluster audio instance
      const activeCluster: ActiveClusterAudio = {
        clusterId: cluster.id,
        clusterType: cluster.type,
        theme,
        audioSource,
        effectChain,
        currentFrequency: frequency,
        currentVolume: volume,
        currentFilter: filterFreq,
        isPlaying: false,
        lastStrengthUpdate: Date.now(),
        nodeCount: cluster.nodes.length
      };

      this.state.activeClusters.set(cluster.id, activeCluster);

      // Start the audio
      await this.playClusterAudio(activeCluster);

    } catch (error) {
      logger.error('cluster-start', 'Error starting cluster audio', {
        clusterId: cluster.id,
        error
      });
    }
  }

  /**
   * Create audio source for cluster based on theme
   */
  private createClusterAudioSource(theme: ClusterAudioTheme): Tone.PolySynth {
    const oscillatorType = this.getOscillatorTypeForTexture(theme.timbreProfile.texture);

    const polySynth = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: {
        type: oscillatorType
      },
      envelope: {
        attack: theme.dynamicsRange.attackTime,
        decay: theme.dynamicsRange.decayTime,
        sustain: theme.dynamicsRange.sustainLevel,
        release: theme.dynamicsRange.releaseTime
      }
    });
    polySynth.maxPolyphony = 4;

    return polySynth;
  }

  /**
   * Create effect chain for cluster audio
   */
  private createClusterEffectChain(theme: ClusterAudioTheme): Tone.Filter {
    return new Tone.Filter({
      frequency: theme.filterCutoff,
      type: 'lowpass',
      Q: theme.resonance
    });
  }

  /**
   * Get Tone.js oscillator type for texture
   */
  private getOscillatorTypeForTexture(texture: string): string {
    const textureMap: Record<string, string> = {
      smooth: 'sine',
      granular: 'sawtooth',
      harmonic: 'triangle',
      noise: 'square',
      organic: 'sine'
    };
    return textureMap[texture] || 'sine';
  }

  /**
   * Calculate frequency for cluster based on position and theme
   */
  private calculateClusterFrequency(cluster: Cluster, theme: ClusterAudioTheme): number {
    // Use cluster centroid and strength to modulate base frequency
    const strengthMod = 1 + (cluster.strength - 0.5) * 0.2; // ±10% based on strength
    const sizeMod = 1 + (cluster.nodes.length - 5) * 0.01; // Slight increase for larger clusters

    let frequency = theme.baseFrequency * strengthMod * sizeMod;

    // Phase 6.1: Apply musical theory constraints
    if (this.musicalTheoryEngine && this.musicalTheoryConfig?.enabled) {
      frequency = this.musicalTheoryEngine.constrainPitchToScale(frequency);
    }

    return frequency;
  }

  /**
   * Calculate filter frequency for cluster
   */
  private calculateClusterFilter(cluster: Cluster, theme: ClusterAudioTheme): number {
    // Brighter filter for stronger, more connected clusters
    const strengthMod = 0.5 + cluster.strength * 0.5; // 0.5-1.0 range
    return theme.filterCutoff * strengthMod;
  }

  /**
   * Play cluster audio
   */
  private async playClusterAudio(activeCluster: ActiveClusterAudio): Promise<void> {
    if (activeCluster.isPlaying) return;

    const theme = activeCluster.theme;
    const harmonics = theme.harmonicIntervals.slice(0, 3); // Use first 3 harmonics

    // Build chord from harmonics
    const frequencies = harmonics.map(interval =>
      activeCluster.currentFrequency * Math.pow(2, interval / 12)
    );

    // Set volume
    activeCluster.audioSource.volume.value = Tone.gainToDb(activeCluster.currentVolume);

    // Trigger chord
    activeCluster.audioSource.triggerAttack(frequencies);
    activeCluster.isPlaying = true;

    logger.debug('cluster-play', 'Started cluster audio playback', {
      clusterId: activeCluster.clusterId,
      frequencies,
      volume: activeCluster.currentVolume
    });
  }

  /**
   * Update existing cluster audio
   */
  private async updateClusterAudio(cluster: Cluster): Promise<void> {
    const activeCluster = this.state.activeClusters.get(cluster.id);
    if (!activeCluster) return;

    // Update frequency and filter based on current cluster state
    const newFrequency = this.calculateClusterFrequency(cluster, activeCluster.theme);
    const newFilter = this.calculateClusterFilter(cluster, activeCluster.theme);

    // Smooth parameter changes to prevent audio crackling
    if (Math.abs(newFrequency - activeCluster.currentFrequency) > 5) {
      // Significant frequency change - ramp to new frequency
      if (activeCluster.isPlaying) {
        activeCluster.audioSource.frequency.rampTo(newFrequency, 0.5);
      }
      activeCluster.currentFrequency = newFrequency;
    }

    // Update filter
    if (Math.abs(newFilter - activeCluster.currentFilter) > 50) {
      (activeCluster.effectChain as Tone.Filter).frequency.rampTo(newFilter, 0.3);
      activeCluster.currentFilter = newFilter;
    }

    // Update node count
    activeCluster.nodeCount = cluster.nodes.length;
  }

  /**
   * Stop cluster audio
   */
  private async stopClusterAudio(clusterId: string): Promise<void> {
    const activeCluster = this.state.activeClusters.get(clusterId);
    if (!activeCluster) return;

    logger.debug('cluster-stop', 'Stopping cluster audio', { clusterId });

    try {
      if (activeCluster.isPlaying) {
        activeCluster.audioSource.triggerRelease();
        activeCluster.isPlaying = false;
      }

      // Fade out and dispose after delay
      setTimeout(() => {
        activeCluster.audioSource.dispose();
        activeCluster.effectChain.dispose();
        this.state.activeClusters.delete(clusterId);
      }, 1000);

    } catch (error) {
      logger.error('cluster-stop', 'Error stopping cluster audio', { clusterId, error });
    }
  }

  /**
   * Update cluster strength modulation
   */
  private updateClusterStrengthModulation(clusters: Cluster[]): void {
    if (!this.settings.strengthModulation) return;

    for (const cluster of clusters) {
      const activeCluster = this.state.activeClusters.get(cluster.id);
      if (!activeCluster || !activeCluster.isPlaying) continue;

      const previousStrength = this.state.currentStrengthValues.get(cluster.id) || 0.5;
      const strengthDiff = Math.abs(cluster.strength - previousStrength);

      if (strengthDiff > (0.1 / this.settings.strengthSensitivity)) {
        // Modulate volume based on strength
        const volumeModulation = 0.5 + cluster.strength * 0.5;
        const newVolume = this.settings.clusterTypeVolumes[cluster.type] * volumeModulation;

        activeCluster.audioSource.volume.rampTo(Tone.gainToDb(newVolume), 0.2);
        activeCluster.currentVolume = newVolume;

        this.state.currentStrengthValues.set(cluster.id, cluster.strength);
      }
    }
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: ClusterAudioSettings): void {
    logger.debug('settings', 'Updating cluster audio settings');

    const wasEnabled = this.settings.enabled;
    this.settings = { ...newSettings };

    // Update master volume
    this.masterVolume.volume.value = this.settings.globalVolume * -20;

    // If disabled, stop all active clusters
    if (!this.settings.enabled && wasEnabled) {
      this.stopAllClusterAudio();
    }
  }

  /**
   * Stop all active cluster audio
   */
  private async stopAllClusterAudio(): Promise<void> {
    logger.debug('shutdown', 'Stopping all cluster audio');

    const clusterIds = Array.from(this.state.activeClusters.keys());
    for (const clusterId of clusterIds) {
      await this.stopClusterAudio(clusterId);
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const activeCount = this.state.activeClusters.size;
      const transitionCount = this.state.activeTransitions.size;

      if (activeCount > 0 || transitionCount > 0) {
        logger.debug('performance', 'Cluster audio performance metrics', {
          activeClusters: activeCount,
          activeTransitions: transitionCount,
          maxClusters: this.settings.maxSimultaneousClusters
        });
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Get current cluster audio analysis
   */
  public getClusterAnalysis(cluster: Cluster): ClusterAudioAnalysis {
    const theme = this.themeGenerator.getThemeForClusterType(cluster.type);
    const activeCluster = this.state.activeClusters.get(cluster.id);

    return {
      clusterId: cluster.id,
      audioTheme: theme,
      recommendedVolume: this.settings.clusterTypeVolumes[cluster.type] || 0.5,
      spatialPosition: {
        pan: this.calculateClusterPan(cluster),
        depth: cluster.strength
      },
      transitionEvents: Array.from(this.state.activeTransitions.values())
        .filter(t => t.clusterId === cluster.id),
      hubNodes: this.identifyHubNodes(cluster)
    };
  }

  /**
   * Calculate stereo pan position for cluster
   */
  private calculateClusterPan(cluster: Cluster): number {
    if (!this.settings.spatialAudio) return 0;

    // Use cluster centroid X position for panning
    const normalizedX = (cluster.centroid.x - 400) / 400; // Assume 800px width, center at 400
    return Math.max(-1, Math.min(1, normalizedX)); // Clamp to [-1, 1]
  }

  /**
   * Identify hub nodes within cluster
   */
  private identifyHubNodes(cluster: Cluster): string[] {
    // Simple hub detection based on connection count
    const avgConnections = cluster.nodes.reduce((sum, node) => sum + node.connections.length, 0) / cluster.nodes.length;
    const hubThreshold = avgConnections * 1.5;

    return cluster.nodes
      .filter(node => node.connections.length >= hubThreshold)
      .map(node => node.id);
  }

  /**
   * Phase 5.3: Process communities with audio mapping
   */
  public async processCommunities(
    nodes: GraphNode[],
    links: GraphLink[]
  ): Promise<void> {
    if (!this.isInitialized || !this.communityAnalyzer || !this.communityEvolutionTracker) {
      return;
    }

    if (!this.communityDetectionSettings?.enabled) {
      return;
    }

    try {
      logger.debug('community-processing', 'Processing communities for audio', {
        nodeCount: nodes.length,
        linkCount: links.length
      });

      // Detect communities
      const communities = await this.communityAnalyzer.detectCommunities(nodes, links);

      // Analyze hierarchy if enabled
      const hierarchicalCommunities = this.communityAnalyzer.analyzeCommunityHierarchy(communities);

      // Track evolution
      const evolutionEvents = this.communityEvolutionTracker.trackEvolution(hierarchicalCommunities);

      // Generate themes and trigger evolution audio events
      for (const community of hierarchicalCommunities) {
        // Generate theme for this community
        const theme = this.communityAnalyzer.generateCommunityTheme(community);

        // Handle any evolution events for this community
        const communityEvents = evolutionEvents.filter(e => e.communityId === community.id);
        for (const event of communityEvents) {
          await this.communityEvolutionTracker.triggerEvolutionAudioEvent(event, theme);
        }
      }

      logger.debug('community-processing', 'Communities processed', {
        communityCount: hierarchicalCommunities.length,
        evolutionEventCount: evolutionEvents.length
      });

    } catch (error) {
      logger.error('community-processing', 'Error processing communities', { error });
    }
  }

  /**
   * Phase 5.3: Get community audio analysis
   */
  public getCommunityAnalysis(communityId: string): any {
    if (!this.communityAnalyzer) {
      return null;
    }

    const theme = this.communityAnalyzer.getCommunityTheme(communityId);
    const lifecycle = this.communityEvolutionTracker?.getCommunityLifecycle(communityId);

    return {
      theme,
      lifecycle,
      activeEvents: this.communityEvolutionTracker?.getActiveEvolutionEvents().filter(
        e => e.communityId === communityId
      ) || []
    };
  }

  /**
   * Phase 5.3: Update community detection settings
   */
  public updateCommunitySettings(
    detectionSettings: CommunityDetectionSettings,
    evolutionSettings: CommunityEvolutionSettings
  ): void {
    if (this.communityAnalyzer) {
      this.communityAnalyzer.updateSettings(detectionSettings);
      this.communityDetectionSettings = detectionSettings;
    }

    if (this.communityEvolutionTracker) {
      this.communityEvolutionTracker.updateSettings(evolutionSettings);
      this.communityEvolutionSettings = evolutionSettings;
    }

    logger.debug('settings', 'Community settings updated');
  }

  /**
   * Phase 5.2: Update hub orchestration settings
   */
  public updateHubOrchestrationSettings(settings: HubOrchestrationSettings): void {
    this.hubOrchestrationSettings = settings;

    if (settings.enabled) {
      if (!this.hubOrchestrationManager) {
        this.hubOrchestrationManager = new HubOrchestrationManager(settings);
        logger.debug('settings', 'Hub orchestration manager created');
      } else {
        this.hubOrchestrationManager.updateSettings(settings);
        logger.debug('settings', 'Hub orchestration settings updated');
      }

      if (!this.hubTransitionHandler) {
        this.hubTransitionHandler = new HubTransitionHandler(
          this.masterVolume,
          settings.transitionsEnabled
        );
        logger.debug('settings', 'Hub transition handler created');
      } else {
        this.hubTransitionHandler.updateSettings(settings.transitionsEnabled);
        logger.debug('settings', 'Hub transition settings updated');
      }
    } else {
      // Dispose if disabled
      if (this.hubOrchestrationManager) {
        this.hubOrchestrationManager.dispose();
        this.hubOrchestrationManager = null;
      }
      if (this.hubTransitionHandler) {
        this.hubTransitionHandler.dispose();
        this.hubTransitionHandler = null;
      }
      logger.debug('settings', 'Hub orchestration disabled and disposed');
    }
  }

  /**
   * Update musical theory settings
   */
  public updateMusicalTheorySettings(config: MusicalTheoryConfig): void {
    this.musicalTheoryConfig = config;

    if (config.enabled) {
      if (!this.musicalTheoryEngine) {
        this.musicalTheoryEngine = new MusicalTheoryEngine(config);
        logger.debug('settings', `Musical theory engine created: ${config.rootNote} ${config.scale}`);
      } else {
        this.musicalTheoryEngine.updateConfig(config);
        logger.debug('settings', 'Musical theory settings updated');
      }
    } else {
      // Dispose if disabled
      if (this.musicalTheoryEngine) {
        this.musicalTheoryEngine.dispose();
        this.musicalTheoryEngine = null;
      }
      logger.debug('settings', 'Musical theory disabled and disposed');
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    logger.debug('shutdown', 'Disposing cluster audio mapper');

    this.stopAllClusterAudio();

    if (this.updateThrottleTimer) {
      clearTimeout(this.updateThrottleTimer);
    }

    // Phase 5.3: Dispose community components
    if (this.communityAnalyzer) {
      this.communityAnalyzer.dispose();
    }

    if (this.communityEvolutionTracker) {
      this.communityEvolutionTracker.dispose();
    }

    // Phase 5.2: Dispose hub orchestration components
    if (this.hubOrchestrationManager) {
      this.hubOrchestrationManager.dispose();
    }

    if (this.hubTransitionHandler) {
      this.hubTransitionHandler.dispose();
    }

    // Phase 6.1: Dispose musical theory engine
    if (this.musicalTheoryEngine) {
      this.musicalTheoryEngine.dispose();
    }

    this.masterVolume.dispose();
    this.themeGenerator.dispose();
  }
}