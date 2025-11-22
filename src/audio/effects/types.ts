// Import required types from constants
import * as Tone from 'tone';

export interface EffectNode {
    id: string;
    type: 'reverb' | 'chorus' | 'filter' | 'delay' | 'distortion' | 'compressor' | 'eq3';
    enabled: boolean;
    bypassed: boolean;
    parameters: Record<string, unknown>;
}

export interface SendBus {
    id: string;
    name: string;
    level: number;
    enabled: boolean;
    destination: string; // Effect or return bus ID
}

export interface ReturnBus {
    id: string;
    name: string;
    level: number;
    enabled: boolean;
    effectChain: EffectNode[];
}

export interface EffectChain {
    instrumentName: string;
    nodes: EffectNode[];
    sendConnections: string[]; // Send bus IDs
}

export interface MasterEffectsConfig {
    reverb: {
        enabled: boolean;
        roomSize: number;
        dampening: number;
        wet: number;
    };
    eq: {
        enabled: boolean;
        low: number;
        mid: number;
        high: number;
    };
    compressor: {
        enabled: boolean;
        threshold: number;
        ratio: number;
        attack: number;
        release: number;
    };
}

export interface EffectParameters {
    // Common parameters
    wet?: number;
    frequency?: number;
    delayTime?: number;
    feedback?: number;

    // Reverb parameters
    decay?: number;
    preDelay?: number;

    // Chorus parameters
    depth?: number;

    // Filter parameters
    type?: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
    rolloff?: -12 | -24 | -48 | -96;
    Q?: number;

    // Distortion parameters
    distortion?: number;
    oversample?: '2x' | '4x' | 'none';

    // Compressor parameters
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
    knee?: number;

    // EQ3 parameters
    low?: number;
    mid?: number;
    high?: number;

    // Index signature for additional parameters
    [key: string]: unknown;
}

export type ToneEffectNode = Tone.Reverb | Tone.Chorus | Tone.Filter | Tone.Delay | Tone.Distortion | Tone.Compressor | Tone.EQ3;

export interface EffectInstance {
    node: ToneEffectNode; // Tone.js effect instance
    type: string;
    parameters: EffectParameters;
    enabled: boolean;
    bypassed: boolean;
}

export interface EffectBusMetrics {
    totalEffectNodes: number;
    activeEffectNodes: number;
    sendBusCount: number;
    returnBusCount: number;
    cpuUsageEstimate: number;
}

export type EffectType = 'reverb' | 'chorus' | 'filter' | 'delay' | 'distortion' | 'compressor' | 'eq3';

export interface EffectConfig {
    type: EffectType;
    defaultParameters: EffectParameters;
    cpuCost: number; // Relative CPU cost (1-10 scale)
}