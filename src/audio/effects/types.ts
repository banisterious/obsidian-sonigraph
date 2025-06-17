// Import required types from constants
export interface EffectNode {
    id: string;
    type: 'reverb' | 'chorus' | 'filter' | 'delay' | 'distortion' | 'compressor';
    enabled: boolean;
    bypassed: boolean;
    parameters: Record<string, any>;
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
    // Reverb parameters
    roomSize?: number;
    dampening?: number;
    wet?: number;
    
    // Chorus parameters
    frequency?: number;
    delayTime?: number;
    depth?: number;
    feedback?: number;
    
    // Filter parameters
    frequency?: number;
    type?: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
    rolloff?: number;
    Q?: number;
    
    // Delay parameters
    delayTime?: number;
    feedback?: number;
    wet?: number;
    
    // Distortion parameters
    distortion?: number;
    oversample?: string;
    
    // Compressor parameters
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
    knee?: number;
}

export interface EffectInstance {
    node: any; // Tone.js effect instance
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