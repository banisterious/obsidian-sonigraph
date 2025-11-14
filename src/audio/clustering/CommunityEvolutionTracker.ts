/**
 * CommunityEvolutionTracker - Phase 5.3: Community Detection Audio
 *
 * Tracks community evolution over time and generates audio events for
 * community lifecycle changes (merge, split, growth, decline, bridging)
 */

import { getLogger } from '../../logging';
import {
  Community,
  CommunityEvolutionEvent,
  CommunityEvolutionType,
  CommunityEvolutionSettings,
  CommunityLifecycleState,
  CommunityAudioTheme
} from './types';
import * as Tone from 'tone';

const logger = getLogger('community-evolution');

/**
 * Tracks and manages community evolution events
 */
export class CommunityEvolutionTracker {
  private settings: CommunityEvolutionSettings;
  private previousCommunities: Map<string, Community> = new Map();
  private communityLifecycles: Map<string, CommunityLifecycleState> = new Map();
  private activeEvolutionEvents: Map<string, CommunityEvolutionEvent> = new Map();
  private masterVolume: Tone.Volume;
  private isInitialized = false;

  // Event throttling
  private eventThrottleTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(settings: CommunityEvolutionSettings, masterVolume: Tone.Volume) {
    logger.debug('initialization', 'CommunityEvolutionTracker created');

    this.settings = { ...settings };
    this.masterVolume = masterVolume;
  }

  /**
   * Initialize the evolution tracker
   */
  public initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.debug('initialization', 'Initializing community evolution tracker');

    this.isInitialized = true;
    logger.debug('initialization', 'Community evolution tracker initialized');
  }

  /**
   * Track community evolution by comparing current and previous states
   */
  public trackEvolution(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    if (!this.isInitialized || !this.settings.enabled) {
      return [];
    }

    logger.debug('tracking', 'Tracking community evolution', {
      currentCount: currentCommunities.length,
      previousCount: this.previousCommunities.size
    });

    const events: CommunityEvolutionEvent[] = [];

    // Detect various evolution events
    events.push(...this.detectCommunityMerges(currentCommunities));
    events.push(...this.detectCommunitySplits(currentCommunities));
    events.push(...this.detectCommunityGrowth(currentCommunities));
    events.push(...this.detectCommunityDecline(currentCommunities));
    events.push(...this.detectCommunityBridging(currentCommunities));
    events.push(...this.detectCommunityFormation(currentCommunities));
    events.push(...this.detectCommunityDissolution(currentCommunities));

    // Update lifecycle states
    this.updateCommunityLifecycles(currentCommunities, events);

    // Update previous communities for next comparison
    this.previousCommunities.clear();
    currentCommunities.forEach(community => {
      this.previousCommunities.set(community.id, { ...community });
    });

    logger.debug('tracking', 'Evolution events detected', {
      eventCount: events.length,
      types: events.map(e => e.type)
    });

    return events;
  }

  /**
   * Detect community merges (two or more communities combining)
   */
  private detectCommunityMerges(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    const events: CommunityEvolutionEvent[] = [];

    for (const currentCommunity of currentCommunities) {
      // Check if this community's nodes came from multiple previous communities
      const sourceNodeIds = new Set(currentCommunity.nodes.map(n => n.id));
      const sourceCommunityIds = new Set<string>();

      this.previousCommunities.forEach((prevCommunity, prevId) => {
        const overlap = prevCommunity.nodes.filter(n => sourceNodeIds.has(n.id)).length;
        const overlapRatio = overlap / prevCommunity.nodes.length;

        if (overlapRatio > 0.5) { // At least 50% overlap
          sourceCommunityIds.add(prevId);
        }
      });

      // If multiple source communities, it's a merge
      if (sourceCommunityIds.size >= 2) {
        events.push({
          type: 'merge',
          communityId: currentCommunity.id,
          sourceCommunityIds: Array.from(sourceCommunityIds),
          targetCommunityId: currentCommunity.id,
          timestamp: Date.now(),
          intensity: Math.min(sourceCommunityIds.size / 3, 1.0), // Normalize to 1.0
          affectedNodeCount: currentCommunity.nodes.length
        });

        logger.debug('evolution-merge', 'Community merge detected', {
          targetId: currentCommunity.id,
          sourceCount: sourceCommunityIds.size
        });
      }
    }

    return events;
  }

  /**
   * Detect community splits (one community dividing into multiple)
   */
  private detectCommunitySplits(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    const events: CommunityEvolutionEvent[] = [];

    this.previousCommunities.forEach((prevCommunity, prevId) => {
      const prevNodeIds = new Set(prevCommunity.nodes.map(n => n.id));
      const targetCommunities: string[] = [];

      // Find which current communities contain nodes from this previous community
      for (const currentCommunity of currentCommunities) {
        const overlap = currentCommunity.nodes.filter(n => prevNodeIds.has(n.id)).length;
        const overlapRatio = overlap / currentCommunity.nodes.length;

        if (overlapRatio > 0.3) { // At least 30% overlap
          targetCommunities.push(currentCommunity.id);
        }
      }

      // If multiple target communities, it's a split
      if (targetCommunities.length >= 2) {
        events.push({
          type: 'split',
          communityId: prevId,
          sourceCommunityIds: [prevId],
          targetCommunityIds: targetCommunities,
          timestamp: Date.now(),
          intensity: Math.min(targetCommunities.length / 3, 1.0), // Normalize to 1.0
          affectedNodeCount: prevCommunity.nodes.length
        });

        logger.debug('evolution-split', 'Community split detected', {
          sourceId: prevId,
          targetCount: targetCommunities.length
        });
      }
    });

    return events;
  }

  /**
   * Detect community growth (significant increase in node count)
   */
  private detectCommunityGrowth(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    const events: CommunityEvolutionEvent[] = [];

    for (const currentCommunity of currentCommunities) {
      const prevCommunity = this.previousCommunities.get(currentCommunity.id);
      if (!prevCommunity) continue;

      const growthRatio = currentCommunity.nodes.length / prevCommunity.nodes.length;
      const growthThreshold = 1 + this.settings.growthThreshold;

      if (growthRatio >= growthThreshold) {
        const newNodeCount = currentCommunity.nodes.length - prevCommunity.nodes.length;

        events.push({
          type: 'growth',
          communityId: currentCommunity.id,
          sourceCommunityIds: [currentCommunity.id],
          timestamp: Date.now(),
          intensity: Math.min((growthRatio - 1.0), 1.0), // Normalize intensity
          affectedNodeCount: newNodeCount
        });

        logger.debug('evolution-growth', 'Community growth detected', {
          communityId: currentCommunity.id,
          previousSize: prevCommunity.nodes.length,
          currentSize: currentCommunity.nodes.length,
          growthRatio
        });
      }
    }

    return events;
  }

  /**
   * Detect community decline (significant decrease in node count)
   */
  private detectCommunityDecline(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    const events: CommunityEvolutionEvent[] = [];

    for (const currentCommunity of currentCommunities) {
      const prevCommunity = this.previousCommunities.get(currentCommunity.id);
      if (!prevCommunity) continue;

      const declineRatio = currentCommunity.nodes.length / prevCommunity.nodes.length;
      const declineThreshold = 1 - this.settings.declineThreshold;

      if (declineRatio <= declineThreshold) {
        const lostNodeCount = prevCommunity.nodes.length - currentCommunity.nodes.length;

        events.push({
          type: 'decline',
          communityId: currentCommunity.id,
          sourceCommunityIds: [currentCommunity.id],
          timestamp: Date.now(),
          intensity: Math.min((1.0 - declineRatio), 1.0), // Normalize intensity
          affectedNodeCount: lostNodeCount
        });

        logger.debug('evolution-decline', 'Community decline detected', {
          communityId: currentCommunity.id,
          previousSize: prevCommunity.nodes.length,
          currentSize: currentCommunity.nodes.length,
          declineRatio
        });
      }
    }

    return events;
  }

  /**
   * Detect community bridging (communities becoming more connected)
   */
  private detectCommunityBridging(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    const events: CommunityEvolutionEvent[] = [];

    // Detect if previously isolated communities are now connected
    for (const currentCommunity of currentCommunities) {
      const prevCommunity = this.previousCommunities.get(currentCommunity.id);
      if (!prevCommunity) continue;

      const prevExternalConnections = prevCommunity.characteristics.externalConnections;
      const currentExternalConnections = currentCommunity.characteristics.externalConnections;

      // Significant increase in external connections suggests bridging
      if (currentExternalConnections > prevExternalConnections * 2) {
        events.push({
          type: 'bridging',
          communityId: currentCommunity.id,
          sourceCommunityIds: [currentCommunity.id],
          timestamp: Date.now(),
          intensity: Math.min(currentExternalConnections / (prevExternalConnections || 1), 1.0),
          affectedNodeCount: currentCommunity.nodes.length
        });

        logger.debug('evolution-bridging', 'Community bridging detected', {
          communityId: currentCommunity.id,
          previousExternalConnections: prevExternalConnections,
          currentExternalConnections
        });
      }
    }

    return events;
  }

  /**
   * Detect community formation (new community appears)
   */
  private detectCommunityFormation(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    const events: CommunityEvolutionEvent[] = [];

    for (const currentCommunity of currentCommunities) {
      if (!this.previousCommunities.has(currentCommunity.id)) {
        events.push({
          type: 'formation',
          communityId: currentCommunity.id,
          sourceCommunityIds: [],
          targetCommunityId: currentCommunity.id,
          timestamp: Date.now(),
          intensity: Math.min(currentCommunity.nodes.length / 10, 1.0), // Normalize by typical size
          affectedNodeCount: currentCommunity.nodes.length
        });

        logger.debug('evolution-formation', 'Community formation detected', {
          communityId: currentCommunity.id,
          size: currentCommunity.nodes.length
        });
      }
    }

    return events;
  }

  /**
   * Detect community dissolution (community disappears)
   */
  private detectCommunityDissolution(currentCommunities: Community[]): CommunityEvolutionEvent[] {
    const events: CommunityEvolutionEvent[] = [];
    const currentIds = new Set(currentCommunities.map(c => c.id));

    this.previousCommunities.forEach((prevCommunity, prevId) => {
      if (!currentIds.has(prevId)) {
        events.push({
          type: 'dissolution',
          communityId: prevId,
          sourceCommunityIds: [prevId],
          timestamp: Date.now(),
          intensity: Math.min(prevCommunity.nodes.length / 10, 1.0), // Normalize by typical size
          affectedNodeCount: prevCommunity.nodes.length
        });

        logger.debug('evolution-dissolution', 'Community dissolution detected', {
          communityId: prevId,
          size: prevCommunity.nodes.length
        });
      }
    });

    return events;
  }

  /**
   * Update community lifecycle states based on evolution events
   */
  private updateCommunityLifecycles(
    communities: Community[],
    events: CommunityEvolutionEvent[]
  ): void {
    // Update existing lifecycles
    communities.forEach(community => {
      let lifecycle = this.communityLifecycles.get(community.id);

      if (!lifecycle) {
        // New community
        lifecycle = {
          communityId: community.id,
          state: 'forming',
          age: 0,
          previousState: undefined,
          stateChangedAt: Date.now()
        };
      } else {
        // Age the community
        lifecycle.age++;

        // Update state based on recent events
        const recentEvents = events.filter(e => e.communityId === community.id);
        if (recentEvents.length > 0) {
          lifecycle.previousState = lifecycle.state;
          lifecycle.state = this.determineLifecycleState(community, recentEvents);
          lifecycle.stateChangedAt = Date.now();
        }
      }

      this.communityLifecycles.set(community.id, lifecycle);
    });

    // Clean up lifecycles for dissolved communities
    const currentIds = new Set(communities.map(c => c.id));
    this.communityLifecycles.forEach((_, id) => {
      if (!currentIds.has(id)) {
        this.communityLifecycles.delete(id);
      }
    });
  }

  /**
   * Determine lifecycle state based on community and recent events
   */
  private determineLifecycleState(
    community: Community,
    events: CommunityEvolutionEvent[]
  ): CommunityLifecycleState['state'] {
    // Check for specific evolution events
    const hasGrowth = events.some(e => e.type === 'growth');
    const hasDecline = events.some(e => e.type === 'decline');
    const hasMerge = events.some(e => e.type === 'merge');
    const hasSplit = events.some(e => e.type === 'split');
    const hasBridging = events.some(e => e.type === 'bridging');

    const lifecycle = this.communityLifecycles.get(community.id);
    const age = lifecycle?.age || 0;

    // Determine state based on events and characteristics
    if (age < 3) return 'forming';
    if (hasGrowth && age < 10) return 'growing';
    if (hasMerge) return 'merging';
    if (hasSplit) return 'splitting';
    if (hasDecline) return 'declining';
    if (hasBridging) return 'bridging';
    if (community.characteristics.stability > 0.7 && age > 20) return 'stable';
    if (age > 10 && community.characteristics.stability > 0.5) return 'mature';

    return 'stable';
  }

  /**
   * Trigger audio event for community evolution
   */
  public triggerEvolutionAudioEvent(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme
  ): Promise<void> {
    if (!this.settings.eventAudioEnabled || !this.settings.enabledEventTypes[event.type]) {
      return;
    }

    // Throttle events to prevent audio crackling
    const throttleKey = `${event.communityId}_${event.type}`;
    if (this.eventThrottleTimers.has(throttleKey)) {
      logger.debug('audio-event', 'Event throttled', { event: throttleKey });
      return;
    }

    this.eventThrottleTimers.set(
      throttleKey,
      setTimeout(() => {
        this.eventThrottleTimers.delete(throttleKey);
      }, this.settings.eventThrottleMs)
    );

    logger.debug('audio-event', 'Triggering evolution audio event', {
      type: event.type,
      communityId: event.communityId,
      intensity: event.intensity
    });

    try {
      // Store active event
      const eventKey = `${event.communityId}_${event.timestamp}`;
      this.activeEvolutionEvents.set(eventKey, event);

      // Execute the appropriate audio effect
      this.executeEvolutionAudioEffect(event, theme);

      // Clean up after event duration
      setTimeout(() => {
        this.activeEvolutionEvents.delete(eventKey);
      }, this.getEventDuration(event.type) * 1000);

    } catch (error) {
      logger.error('audio-event', 'Error triggering evolution audio event', {
        event,
        error
      });
    }
  }

  /**
   * Execute the actual audio effect for evolution event
   */
  private executeEvolutionAudioEffect(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme
  ): void {
    const duration = this.getEventDuration(event.type);
    const volume = this.settings.eventVolumes[event.type] * event.intensity;

    switch (event.type) {
      case 'merge':
        this.executeHarmonicConvergence(event, theme, duration, volume);
        break;
      case 'split':
        this.executeDivergentHarmony(event, theme, duration, volume);
        break;
      case 'growth':
        this.executeExpandingOrchestration(event, theme, duration, volume);
        break;
      case 'decline':
        this.executeFadingVoices(event, theme, duration, volume);
        break;
      case 'bridging':
        this.executeCrossFade(event, theme, duration, volume);
        break;
      case 'formation':
        this.executeHarmonicBuildup(event, theme, duration, volume);
        break;
      case 'dissolution':
        this.executeHarmonicFadeout(event, theme, duration, volume);
        break;
    }
  }

  /**
   * Harmonic convergence effect (community merge)
   */
  private executeHarmonicConvergence(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme,
    duration: number,
    volume: number
  ): void {
    const now = Tone.now();
    const voiceCount = Math.min(event.sourceCommunityIds?.length || 2, 4);

    for (let i = 0; i < voiceCount; i++) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: duration * 0.3,
          decay: duration * 0.2,
          sustain: 0.6,
          release: duration * 0.5
        }
      }).connect(this.masterVolume);

      // Start at different frequencies, converge to base frequency
      const startFreq = theme.baseFrequency * (0.8 + i * 0.15);
      const endFreq = theme.baseFrequency;

      synth.volume.value = Tone.gainToDb(volume * (0.8 - i * 0.1));
      synth.triggerAttack(startFreq, now + i * 0.1);
      synth.frequency.rampTo(endFreq, duration, now + i * 0.1);
      synth.triggerRelease(now + duration);

      setTimeout(() => synth.dispose(), (duration + 1) * 1000);
    }
  }

  /**
   * Divergent harmony effect (community split)
   */
  private executeDivergentHarmony(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme,
    duration: number,
    volume: number
  ): void {
    const now = Tone.now();
    const voiceCount = Math.min(event.targetCommunityIds?.length || 2, 4);

    for (let i = 0; i < voiceCount; i++) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.2,
          decay: duration * 0.3,
          sustain: 0.4,
          release: duration * 0.5
        }
      }).connect(this.masterVolume);

      // Start at base frequency, diverge to different frequencies
      const startFreq = theme.baseFrequency;
      const endFreq = theme.baseFrequency * (0.9 + i * 0.1);

      synth.volume.value = Tone.gainToDb(volume * (0.7 - i * 0.1));
      synth.triggerAttack(startFreq, now);
      synth.frequency.rampTo(endFreq, duration, now + duration * 0.2);
      synth.triggerRelease(now + duration);

      setTimeout(() => synth.dispose(), (duration + 1) * 1000);
    }
  }

  /**
   * Expanding orchestration effect (community growth)
   */
  private executeExpandingOrchestration(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme,
    duration: number,
    volume: number
  ): void {
    const now = Tone.now();
    const voiceCount = Math.min(Math.floor(event.intensity * 6), 6);

    for (let i = 0; i < voiceCount; i++) {
      const delay = (duration / voiceCount) * i;
      const synth = new Tone.PolySynth(Tone.MonoSynth).connect(this.masterVolume);

      synth.volume.value = Tone.gainToDb(volume * (0.6 + i * 0.05));

      const freq = theme.baseFrequency * Math.pow(2, theme.harmonicIntervals[i % theme.harmonicIntervals.length] / 12);
      synth.triggerAttackRelease(freq, duration - delay, now + delay);

      setTimeout(() => synth.dispose(), (duration + 1) * 1000);
    }
  }

  /**
   * Fading voices effect (community decline)
   */
  private executeFadingVoices(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme,
    duration: number,
    volume: number
  ): void {
    const now = Tone.now();
    const voiceCount = Math.min(4, theme.harmonicIntervals.length);

    for (let i = 0; i < voiceCount; i++) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.7,
          release: duration * 0.8
        }
      }).connect(this.masterVolume);

      const freq = theme.baseFrequency * Math.pow(2, theme.harmonicIntervals[i] / 12);
      const fadeStart = now + (duration / voiceCount) * i;

      synth.volume.value = Tone.gainToDb(volume * (0.8 - i * 0.1));
      synth.triggerAttack(freq, now);
      synth.volume.rampTo(-Infinity, duration - (duration / voiceCount) * i, fadeStart);
      synth.triggerRelease(now + duration);

      setTimeout(() => synth.dispose(), (duration + 1) * 1000);
    }
  }

  /**
   * Cross-fade effect (community bridging)
   */
  private executeCrossFade(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme,
    duration: number,
    volume: number
  ): void {
    const now = Tone.now();

    // Create two synths that cross-fade
    const synth1 = new Tone.MonoSynth({
      oscillator: { type: 'sine' }
    }).connect(this.masterVolume);

    const synth2 = new Tone.MonoSynth({
      oscillator: { type: 'triangle' }
    }).connect(this.masterVolume);

    synth1.volume.value = Tone.gainToDb(volume);
    synth2.volume.value = Tone.gainToDb(0.01); // Start very quiet

    synth1.triggerAttack(theme.baseFrequency, now);
    synth2.triggerAttack(theme.baseFrequency * 1.5, now);

    // Cross-fade volumes
    synth1.volume.rampTo(-Infinity, duration, now + duration * 0.2);
    synth2.volume.rampTo(Tone.gainToDb(volume), duration, now + duration * 0.2);

    synth1.triggerRelease(now + duration);
    synth2.triggerRelease(now + duration);

    setTimeout(() => {
      synth1.dispose();
      synth2.dispose();
    }, (duration + 1) * 1000);
  }

  /**
   * Harmonic buildup effect (community formation)
   */
  private executeHarmonicBuildup(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme,
    duration: number,
    volume: number
  ): void {
    const now = Tone.now();
    const harmonics = theme.harmonicIntervals.slice(0, 4);

    for (let i = 0; i < harmonics.length; i++) {
      const delay = (duration / harmonics.length) * i;
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.3,
          decay: 0.4,
          sustain: 0.6,
          release: duration - delay
        }
      }).connect(this.masterVolume);

      const freq = theme.baseFrequency * Math.pow(2, harmonics[i] / 12);
      synth.volume.value = Tone.gainToDb(volume * (0.8 - i * 0.15));
      synth.triggerAttackRelease(freq, duration - delay, now + delay);

      setTimeout(() => synth.dispose(), (duration + 1) * 1000);
    }
  }

  /**
   * Harmonic fadeout effect (community dissolution)
   */
  private executeHarmonicFadeout(
    event: CommunityEvolutionEvent,
    theme: CommunityAudioTheme,
    duration: number,
    volume: number
  ): void {
    const now = Tone.now();
    const harmonics = theme.harmonicIntervals.slice(0, 3);

    for (let i = 0; i < harmonics.length; i++) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.5,
          release: duration
        }
      }).connect(this.masterVolume);

      const freq = theme.baseFrequency * Math.pow(2, harmonics[i] / 12);
      synth.volume.value = Tone.gainToDb(volume * (0.7 - i * 0.2));
      synth.triggerAttack(freq, now);
      synth.volume.rampTo(-Infinity, duration * 0.8, now + duration * 0.2);
      synth.triggerRelease(now + duration);

      setTimeout(() => synth.dispose(), (duration + 1) * 1000);
    }
  }

  /**
   * Get event duration based on type
   */
  private getEventDuration(type: CommunityEvolutionType): number {
    const baseDurations: Record<CommunityEvolutionType, number> = {
      merge: 3.0,
      split: 2.5,
      growth: 2.0,
      decline: 2.5,
      bridging: 2.0,
      formation: 2.5,
      dissolution: 3.0
    };

    return baseDurations[type] || 2.0;
  }

  /**
   * Get community lifecycle state
   */
  public getCommunityLifecycle(communityId: string): CommunityLifecycleState | undefined {
    return this.communityLifecycles.get(communityId);
  }

  /**
   * Get all active evolution events
   */
  public getActiveEvolutionEvents(): CommunityEvolutionEvent[] {
    return Array.from(this.activeEvolutionEvents.values());
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: CommunityEvolutionSettings): void {
    logger.debug('settings', 'Updating community evolution settings');
    this.settings = { ...newSettings };
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): Record<string, unknown> {
    return {
      initialized: this.isInitialized,
      previousCommunityCount: this.previousCommunities.size,
      activeEventCount: this.activeEvolutionEvents.size,
      lifecycleCount: this.communityLifecycles.size,
      settings: this.settings
    };
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    logger.debug('shutdown', 'Disposing community evolution tracker');

    // Clear all timers
    this.eventThrottleTimers.forEach(timer => clearTimeout(timer));
    this.eventThrottleTimers.clear();

    this.previousCommunities.clear();
    this.communityLifecycles.clear();
    this.activeEvolutionEvents.clear();
    this.isInitialized = false;
  }
}