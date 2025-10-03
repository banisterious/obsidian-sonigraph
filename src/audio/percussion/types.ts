/**
 * Types for rhythmic percussion accent layer
 */

export type DrumType = 'kick' | 'snare' | 'hihat' | 'tom';

export type AccentMode = 'velocity' | 'pitch' | 'random';

export interface PercussionConfig {
    enabled: boolean;
    density: number; // 0-1 probability
    activeDrums: {
        kick: boolean;
        snare: boolean;
        hihat: boolean;
        tom: boolean;
    };
    accentMode: AccentMode;
    volume: number; // dB
}

export interface NoteEvent {
    pitch: number; // MIDI note number
    velocity: number; // 0-1
    duration?: number;
    time?: number;
}

export interface DrumSynthParams {
    kick: {
        pitchDecay: number;
        octaves: number;
        attack: number;
        decay: number;
        sustain: number;
        release: number;
    };
    snare: {
        noiseType: 'white' | 'pink' | 'brown';
        noiseAttack: number;
        noiseDecay: number;
        toneFrequency: number;
        toneAttack: number;
        toneDecay: number;
    };
    hihat: {
        frequency: number;
        envelope: {
            attack: number;
            decay: number;
            release: number;
        };
        harmonicity: number;
        modulationIndex: number;
        resonance: number;
        octaves: number;
    };
    tom: {
        pitchDecay: number;
        octaves: number;
        attack: number;
        decay: number;
        sustain: number;
        release: number;
        frequency: number; // Base frequency for tom
    };
}
