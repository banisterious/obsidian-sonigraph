/**
 * Phase 5.2: Hub Transition Handler
 *
 * Handles audio events for hub emergence, demise, and shift transitions.
 * Creates musical transitions that reflect changing node centrality.
 */

import * as Tone from 'tone';
import { getLogger } from '../../logging';
import {
  HubTransitionEvent,
  HubTransitionType,
  HubTransitionAudioConfig,
  HubTransitionEffectType,
  HubMetrics
} from './types';

const logger = getLogger('hub-transitions');

export class HubTransitionHandler {
  private masterVolume: Tone.Volume;
  private transitionsEnabled: boolean;
  private activeTransitions: Map<string, HubTransitionEvent> = new Map();

  constructor(masterVolume: Tone.Volume, transitionsEnabled: boolean = true) {
    this.masterVolume = masterVolume;
    this.transitionsEnabled = transitionsEnabled;
  }

  /**
   * Detect hub transitions by comparing previous and current metrics
   */
  public detectHubTransitions(
    previousMetrics: Map<string, HubMetrics>,
    currentMetrics: Map<string, HubMetrics>,
    hubThreshold: number
  ): HubTransitionEvent[] {
    const transitions: HubTransitionEvent[] = [];

    // Check each node for hub status changes
    currentMetrics.forEach((current, nodeId) => {
      const previous = previousMetrics.get(nodeId);

      if (!previous) {
        // New node - check if it's immediately a hub
        if (current.isHub) {
          transitions.push(this.createTransitionEvent(
            'hub-emergence',
            nodeId,
            0,
            current.compositeScore
          ));
        }
        return;
      }

      // Check for hub emergence (crossed threshold upward)
      if (!previous.isHub && current.isHub) {
        transitions.push(this.createTransitionEvent(
          'hub-emergence',
          nodeId,
          previous.compositeScore,
          current.compositeScore
        ));
      }
      // Check for hub demise (crossed threshold downward)
      else if (previous.isHub && !current.isHub) {
        transitions.push(this.createTransitionEvent(
          'hub-demise',
          nodeId,
          previous.compositeScore,
          current.compositeScore
        ));
      }
      // Check for significant shift in hub score (still a hub)
      else if (previous.isHub && current.isHub) {
        const scoreDiff = Math.abs(current.compositeScore - previous.compositeScore);
        if (scoreDiff > 0.15) { // Significant change threshold
          transitions.push(this.createTransitionEvent(
            'hub-shift',
            nodeId,
            previous.compositeScore,
            current.compositeScore
          ));
        }
      }
    });

    // Check for nodes that disappeared
    previousMetrics.forEach((previous, nodeId) => {
      if (!currentMetrics.has(nodeId) && previous.isHub) {
        transitions.push(this.createTransitionEvent(
          'hub-demise',
          nodeId,
          previous.compositeScore,
          0
        ));
      }
    });

    if (transitions.length > 0) {
      logger.debug('transitions-detected', 'Hub transitions detected', {
        transitionCount: transitions.length,
        types: transitions.map(t => t.type)
      });
    }

    return transitions;
  }

  /**
   * Create hub transition event
   */
  private createTransitionEvent(
    type: HubTransitionType,
    nodeId: string,
    previousScore: number,
    newScore: number
  ): HubTransitionEvent {
    return {
      type,
      nodeId,
      previousScore,
      newScore,
      timestamp: Date.now(),
      audioConfig: this.createAudioConfig(type, previousScore, newScore)
    };
  }

  /**
   * Create audio configuration for transition type
   */
  private createAudioConfig(
    type: HubTransitionType,
    previousScore: number,
    newScore: number
  ): HubTransitionAudioConfig {
    const scoreDiff = Math.abs(newScore - previousScore);

    switch (type) {
      case 'hub-emergence':
        return {
          duration: 2.0 + scoreDiff,  // Longer for dramatic emergence
          volumeCurve: 'exponential',  // Crescendo effect
          instrumentTransition: true,
          harmonicEnrichment: newScore,
          effectType: 'crescendo'
        };

      case 'hub-demise':
        return {
          duration: 2.5,               // Graceful fadeout
          volumeCurve: 'logarithmic',  // Decrescendo effect
          instrumentTransition: true,
          harmonicEnrichment: 0,
          effectType: 'fadeout'
        };

      case 'hub-shift':
        return {
          duration: 1.5,
          volumeCurve: 'linear',
          instrumentTransition: false,  // Keep same instrument
          harmonicEnrichment: Math.abs(newScore - previousScore),
          effectType: newScore > previousScore ? 'crescendo' : 'decrescendo'
        };
    }
  }

  /**
   * Trigger hub emergence audio
   */
  public triggerHubEmergence(
    event: HubTransitionEvent,
    baseFrequency: number = 440
  ): void {
    if (!this.transitionsEnabled) return;

    logger.debug('emergence', 'Triggering hub emergence audio', {
      nodeId: event.nodeId,
      newScore: event.newScore
    });

    const config = event.audioConfig;
    const now = Tone.now();

    try {
      // Create synth for emergence
      const synth = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: config.duration * 0.3,
          decay: config.duration * 0.2,
          sustain: 0.7,
          release: config.duration * 0.5
        }
      }).connect(this.masterVolume);

      // Build harmonic series for richness
      const harmonics = this.buildHarmonics(
        baseFrequency,
        Math.floor(config.harmonicEnrichment * 5) + 1
      );

      // Start with low volume and crescendo
      synth.volume.value = Tone.gainToDb(0.1);

      // Trigger all harmonics
      void synth.triggerAttack(harmonics, now);

      // Crescendo with exponential curve
      if (config.volumeCurve === 'exponential') {
        synth.volume.exponentialRampTo(Tone.gainToDb(0.7), config.duration * 0.7, now);
      } else {
        synth.volume.rampTo(Tone.gainToDb(0.7), config.duration * 0.7, now);
      }

      // Release
      void synth.triggerRelease(harmonics, now + config.duration);

      // Store active transition
      this.activeTransitions.set(event.nodeId, event);

      // Clean up
      setTimeout(() => {
        void synth.dispose();
        this.activeTransitions.delete(event.nodeId);
      }, (config.duration + 1) * 1000);

    } catch (error) {
      logger.error('emergence-error', 'Error triggering hub emergence', { error });
    }
  }

  /**
   * Trigger hub demise audio
   */
  public triggerHubDemise(
    event: HubTransitionEvent,
    baseFrequency: number = 440
  ): void {
    if (!this.transitionsEnabled) return;

    logger.debug('demise', 'Triggering hub demise audio', {
      nodeId: event.nodeId,
      previousScore: event.previousScore
    });

    const config = event.audioConfig;
    const now = Tone.now();

    try {
      // Create synth for demise
      const synth = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.5,
          release: config.duration
        }
      }).connect(this.masterVolume);

      // Start with harmonics and simplify
      const initialHarmonics = this.buildHarmonics(
        baseFrequency,
        Math.floor(event.previousScore * 5) + 1
      );

      // Start at medium volume
      synth.volume.value = Tone.gainToDb(0.6);

      // Trigger chord
      void synth.triggerAttack(initialHarmonics, now);

      // Decrescendo with logarithmic curve
      if (config.volumeCurve === 'logarithmic') {
        // Manual logarithmic ramp
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const volume = 0.6 * Math.log10(1 + (1 - t) * 9) / Math.log10(10);
          synth.volume.setValueAtTime(
            Tone.gainToDb(volume),
            now + (config.duration * t)
          );
        }
      } else {
        synth.volume.rampTo(-Infinity, config.duration * 0.8, now);
      }

      // Graceful release
      void synth.triggerRelease(initialHarmonics, now + config.duration);

      // Store active transition
      this.activeTransitions.set(event.nodeId, event);

      // Clean up
      setTimeout(() => {
        void synth.dispose();
        this.activeTransitions.delete(event.nodeId);
      }, (config.duration + 2) * 1000);

    } catch (error) {
      logger.error('demise-error', 'Error triggering hub demise', { error });
    }
  }

  /**
   * Trigger hub shift audio (hub score changed significantly)
   */
  public triggerHubShift(
    event: HubTransitionEvent,
    baseFrequency: number = 440
  ): void {
    if (!this.transitionsEnabled) return;

    logger.debug('shift', 'Triggering hub shift audio', {
      nodeId: event.nodeId,
      previousScore: event.previousScore,
      newScore: event.newScore,
      direction: event.newScore > event.previousScore ? 'up' : 'down'
    });

    const config = event.audioConfig;
    const now = Tone.now();
    const increasing = event.newScore > event.previousScore;

    try {
      // Create synth for shift
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.2,
          decay: 0.3,
          sustain: 0.5,
          release: config.duration * 0.4
        }
      }).connect(this.masterVolume);

      // Add filter for sweep effect
      const filter = new Tone.Filter({
        frequency: 1000,
        type: 'lowpass',
        Q: 5
      }).connect(this.masterVolume);

      void synth.disconnect();
      void synth.connect(filter);

      // Start frequency
      const startFreq = baseFrequency * (1 + event.previousScore * 0.5);
      const endFreq = baseFrequency * (1 + event.newScore * 0.5);

      synth.volume.value = Tone.gainToDb(0.5);
      void synth.triggerAttack(startFreq, now);

      // Frequency sweep
      synth.frequency.rampTo(endFreq, config.duration, now);

      // Filter sweep
      const filterEnd = increasing ? 3000 : 500;
      filter.frequency.rampTo(filterEnd, config.duration, now);

      // Volume adjustment
      if (increasing) {
        synth.volume.rampTo(Tone.gainToDb(0.7), config.duration, now);
      } else {
        synth.volume.rampTo(Tone.gainToDb(0.3), config.duration, now);
      }

      // Release
      void synth.triggerRelease(now + config.duration);

      // Store active transition
      this.activeTransitions.set(event.nodeId, event);

      // Clean up
      setTimeout(() => {
        void synth.dispose();
        void filter.dispose();
        this.activeTransitions.delete(event.nodeId);
      }, (config.duration + 1) * 1000);

    } catch (error) {
      logger.error('shift-error', 'Error triggering hub shift', { error });
    }
  }

  /**
   * Trigger appropriate transition based on event type
   */
  public triggerTransition(
    event: HubTransitionEvent,
    baseFrequency: number = 440
  ): void {
    switch (event.type) {
      case 'hub-emergence':
        void this.triggerHubEmergence(event, baseFrequency);
        break;
      case 'hub-demise':
        void this.triggerHubDemise(event, baseFrequency);
        break;
      case 'hub-shift':
        void this.triggerHubShift(event, baseFrequency);
        break;
    }
  }

  /**
   * Build harmonic series for a fundamental frequency
   */
  private buildHarmonics(fundamental: number, count: number): number[] {
    const harmonics: number[] = [];

    for (let i = 1; i <= count; i++) {
      // Add octave and fifth harmonics for musical richness
      if (i === 1) {
        void harmonics.push(fundamental);
      } else if (i === 2) {
        harmonics.push(fundamental * 2); // Octave
      } else if (i === 3) {
        harmonics.push(fundamental * 1.5); // Perfect fifth
      } else {
        harmonics.push(fundamental * (1 + i * 0.2)); // Other harmonics
      }
    }

    return harmonics;
  }

  /**
   * Get active transitions
   */
  public getActiveTransitions(): HubTransitionEvent[] {
    return Array.from(this.activeTransitions.values());
  }

  /**
   * Update settings
   */
  public updateSettings(transitionsEnabled: boolean): void {
    this.transitionsEnabled = transitionsEnabled;
    logger.debug('settings-updated', 'Hub transition settings updated', {
      transitionsEnabled
    });
  }

  /**
   * Stop all active transitions
   */
  public stopAllTransitions(): void {
    logger.debug('stop-all', 'Stopping all active hub transitions', {
      count: this.activeTransitions.size
    });

    this.activeTransitions.clear();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    void this.stopAllTransitions();
    void logger.debug('disposal', 'Hub transition handler disposed');
  }
}