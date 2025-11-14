/**
 * Rhythmic Percussion Engine
 *
 * Manages rhythmic percussion accent layer that triggers alongside note events
 */

import * as Tone from 'tone';
import { getLogger } from '../../logging';
import { DrumType, PercussionConfig, NoteEvent } from './types';
import { createKickDrum, createSnareDrum, createHiHat, createTom } from './DrumSynths';
import { AccentMapper } from './AccentMapper';

const logger = getLogger('rhythmic-percussion');

export class RhythmicPercussionEngine {
    private kick: Tone.MembraneSynth | null = null;
    private snare: { noise: Tone.NoiseSynth; tone: Tone.Synth } | null = null;
    private hihat: Tone.MetalSynth | null = null;
    private tom: Tone.MembraneSynth | null = null;

    private volume: Tone.Volume;
    private isInitialized = false;
    private config: PercussionConfig;
    private mapper: AccentMapper;

    constructor(
        initialConfig: PercussionConfig = {
            enabled: false,
            density: 0.6,
            activeDrums: {
                kick: true,
                snare: true,
                hihat: true,
                tom: false
            },
            accentMode: 'velocity',
            volume: -6
        }
    ) {
        this.config = initialConfig;
        this.mapper = new AccentMapper();

        // Create volume control for all percussion
        this.volume = new Tone.Volume(this.config.volume);
    }

    /**
     * Initialize percussion synths and connect to audio output
     */
    initialize(destination: Tone.ToneAudioNode): Promise<void> {
        if (this.isInitialized) {
            logger.warn('rhythmic-percussion', 'Already initialized');
            return;
        }

        try {
            logger.info('rhythmic-percussion', 'Initializing percussion engine');

            // Create drum synths
            this.kick = createKickDrum();
            this.snare = createSnareDrum();
            this.hihat = createHiHat();
            this.tom = createTom();

            // Connect all drums through volume control to destination
            this.kick.connect(this.volume);
            this.snare.noise.connect(this.volume);
            this.snare.tone.connect(this.volume);
            this.hihat.connect(this.volume);
            this.tom.connect(this.volume);

            this.volume.connect(destination);

            this.isInitialized = true;
            logger.info('rhythmic-percussion', 'Percussion engine initialized successfully');

        } catch (error) {
            logger.error('rhythmic-percussion', 'Failed to initialize percussion engine:', error);
            throw error;
        }
    }

    /**
     * Trigger percussion accent based on note event
     */
    triggerAccent(note: NoteEvent): void {
        if (!this.isInitialized || !this.config.enabled) {
            return;
        }

        // Select which drum to trigger
        const drum = this.mapper.selectDrum(note, this.config);
        if (!drum) {
            return; // Probability check failed or no enabled drums
        }

        // Get velocity multiplier
        const velocity = this.mapper.getVelocityMultiplier(note);

        // Trigger the selected drum
        this.triggerDrum(drum, velocity, note);
    }

    /**
     * Trigger specific drum type
     */
    private triggerDrum(drum: DrumType, velocity: number, note: NoteEvent): void {
        const time = note.time || Tone.now();

        try {
            switch (drum) {
                case 'kick':
                    if (this.kick) {
                        // Kick at low frequency (C1)
                        this.kick.triggerAttackRelease('C1', '8n', time, velocity);
                    }
                    break;

                case 'snare':
                    if (this.snare) {
                        // Trigger both noise and tone for snare
                        this.snare.noise.triggerAttackRelease('16n', time, velocity);
                        this.snare.tone.triggerAttackRelease('G3', '16n', time, velocity * 0.7);
                    }
                    break;

                case 'hihat':
                    if (this.hihat) {
                        // Hi-hat at high frequency
                        this.hihat.triggerAttackRelease('32n', time, velocity * 0.6);
                    }
                    break;

                case 'tom':
                    if (this.tom) {
                        // Tom at mid frequency (varies pitch slightly for variety)
                        const tomPitch = ['E2', 'G2', 'A2'][Math.floor(Math.random() * 3)];
                        this.tom.triggerAttackRelease(tomPitch, '8n', time, velocity);
                    }
                    break;
            }

            logger.debug('rhythmic-percussion', `Triggered ${drum}`, { velocity, time });

        } catch (error) {
            logger.error('rhythmic-percussion', `Failed to trigger ${drum}:`, error);
        }
    }

    /**
     * Update percussion configuration
     */
    updateConfig(config: Partial<PercussionConfig>): void {
        this.config = { ...this.config, ...config };

        // Update volume if changed
        if (config.volume !== undefined) {
            this.volume.volume.value = config.volume;
        }

        logger.debug('rhythmic-percussion', 'Config updated', this.config);
    }

    /**
     * Set overall percussion volume
     */
    setVolume(db: number): void {
        this.config.volume = db;
        this.volume.volume.value = db;
    }

    /**
     * Set percussion density (probability of triggering)
     */
    setDensity(density: number): void {
        this.config.density = Math.max(0, Math.min(1, density));
    }

    /**
     * Enable/disable percussion
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
    }

    /**
     * Enable/disable specific drum
     */
    setDrumEnabled(drum: DrumType, enabled: boolean): void {
        this.config.activeDrums[drum] = enabled;
    }

    /**
     * Set accent mode
     */
    setAccentMode(mode: 'velocity' | 'pitch' | 'random'): void {
        this.config.accentMode = mode;
    }

    /**
     * Get current configuration
     */
    getConfig(): PercussionConfig {
        return { ...this.config };
    }

    /**
     * Cleanup and dispose resources
     */
    dispose(): void {
        if (!this.isInitialized) return;

        logger.info('rhythmic-percussion', 'Disposing percussion engine');

        // Dispose all synths
        this.kick?.dispose();
        this.snare?.noise.dispose();
        this.snare?.tone.dispose();
        this.hihat?.dispose();
        this.tom?.dispose();
        this.volume.dispose();

        this.kick = null;
        this.snare = null;
        this.hihat = null;
        this.tom = null;

        this.isInitialized = false;
    }
}
