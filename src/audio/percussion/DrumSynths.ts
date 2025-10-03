/**
 * Drum Synth Definitions
 *
 * Creates synthesized drum sounds using Tone.js synthesis
 */

import * as Tone from 'tone';
import { DrumSynthParams } from './types';

/**
 * Default synthesis parameters for each drum type
 */
export const DEFAULT_DRUM_PARAMS: DrumSynthParams = {
    kick: {
        pitchDecay: 0.05,
        octaves: 10,
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4
    },
    snare: {
        noiseType: 'white',
        noiseAttack: 0.001,
        noiseDecay: 0.2,
        toneFrequency: 200,
        toneAttack: 0.001,
        toneDecay: 0.1
    },
    hihat: {
        frequency: 200,
        envelope: {
            attack: 0.001,
            decay: 0.1,
            release: 0.01
        },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    },
    tom: {
        pitchDecay: 0.08,
        octaves: 4,
        attack: 0.001,
        decay: 0.5,
        sustain: 0,
        release: 0.3,
        frequency: 150 // Mid tom frequency
    }
};

/**
 * Create kick drum synth
 */
export function createKickDrum(params = DEFAULT_DRUM_PARAMS.kick): Tone.MembraneSynth {
    return new Tone.MembraneSynth({
        pitchDecay: params.pitchDecay,
        octaves: params.octaves,
        oscillator: {
            type: 'sine'
        },
        envelope: {
            attack: params.attack,
            decay: params.decay,
            sustain: params.sustain,
            release: params.release
        }
    });
}

/**
 * Create snare drum synth (combination of noise and tone)
 */
export function createSnareDrum(params = DEFAULT_DRUM_PARAMS.snare): {
    noise: Tone.NoiseSynth;
    tone: Tone.Synth;
} {
    const noise = new Tone.NoiseSynth({
        noise: {
            type: params.noiseType
        },
        envelope: {
            attack: params.noiseAttack,
            decay: params.noiseDecay,
            sustain: 0
        }
    });

    const tone = new Tone.Synth({
        oscillator: {
            type: 'triangle'
        },
        envelope: {
            attack: params.toneAttack,
            decay: params.toneDecay,
            sustain: 0,
            release: 0.1
        }
    });

    return { noise, tone };
}

/**
 * Create hi-hat synth
 */
export function createHiHat(params = DEFAULT_DRUM_PARAMS.hihat): Tone.MetalSynth {
    return new Tone.MetalSynth({
        frequency: params.frequency,
        envelope: {
            attack: params.envelope.attack,
            decay: params.envelope.decay,
            release: params.envelope.release
        },
        harmonicity: params.harmonicity,
        modulationIndex: params.modulationIndex,
        resonance: params.resonance,
        octaves: params.octaves
    });
}

/**
 * Create tom drum synth
 */
export function createTom(params = DEFAULT_DRUM_PARAMS.tom): Tone.MembraneSynth {
    return new Tone.MembraneSynth({
        pitchDecay: params.pitchDecay,
        octaves: params.octaves,
        oscillator: {
            type: 'sine'
        },
        envelope: {
            attack: params.attack,
            decay: params.decay,
            sustain: params.sustain,
            release: params.release
        }
    });
}
