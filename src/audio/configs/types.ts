/**
 * Instrument configuration types for the audio engine
 */

export interface InstrumentUrls {
    [note: string]: string;
}

export interface InstrumentConfig {
    urls: InstrumentUrls;
    release: number;
    baseUrl: string;
    effects: string[];
    maxVoices?: number;
    priority?: 'low' | 'medium' | 'high';
    category?: 'keyboard' | 'strings' | 'brass' | 'woodwind' | 'vocals' | 'world' | 'percussion' | 'electronic';
    frequencyRange?: [number, number]; // For whale species frequency mapping
    description?: string; // For whale sample attribution and context
    requiresHighQuality?: boolean; // Only available when high-quality samples are enabled
}

export interface InstrumentCollection {
    [instrumentName: string]: InstrumentConfig;
}

export interface InstrumentFamily {
    name: string;
    description: string;
    instruments: InstrumentCollection;
}

// Default audio format placeholder that will be replaced during loading
export const FORMAT_PLACEHOLDER = '[format]';

// Default effect configurations
export const DEFAULT_EFFECTS = {
    keyboard: ['reverb'],
    strings: ['reverb', 'filter'],
    brass: ['reverb', 'chorus'],
    woodwind: ['reverb', 'filter'],
    vocals: ['reverb', 'chorus'],
    world: ['reverb', 'chorus', 'filter'],
    percussion: ['reverb'],
    electronic: ['filter', 'chorus']
};

// Default voice limits by instrument type
export const DEFAULT_VOICE_LIMITS = {
    piano: 8,
    organ: 6,
    harpsichord: 8,
    strings: 4,
    violin: 4,
    viola: 4,
    cello: 4,
    contrabass: 3,
    harp: 12,
    trumpet: 3,
    horn: 3,
    trombone: 3,
    tuba: 2,
    flute: 3,
    oboe: 3,
    clarinet: 3,
    bassoon: 3,
    piccolo: 3,
    soprano: 4,
    alto: 4,
    tenor: 4,
    bass: 4,
    choir: 8,
    timpani: 2,
    xylophone: 6,
    vibraphone: 6,
    gongs: 4,
    default: 4
};