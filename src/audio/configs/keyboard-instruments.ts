import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const keyboardInstruments: InstrumentFamily = {
    name: 'Keyboard Instruments',
    description: 'Piano, organ, harpsichord, and other keyboard-based instruments',
    instruments: {
        piano: {
            urls: {
                "C1": `C1.${FORMAT_PLACEHOLDER}`, "D#1": `Ds1.${FORMAT_PLACEHOLDER}`,
                "F#1": `Fs1.${FORMAT_PLACEHOLDER}`, "A1": `A1.${FORMAT_PLACEHOLDER}`, "C2": `C2.${FORMAT_PLACEHOLDER}`,
                "D#2": `Ds2.${FORMAT_PLACEHOLDER}`, "F#2": `Fs2.${FORMAT_PLACEHOLDER}`, "A2": `A2.${FORMAT_PLACEHOLDER}`,
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D#3": `Ds3.${FORMAT_PLACEHOLDER}`, "F#3": `Fs3.${FORMAT_PLACEHOLDER}`,
                "A3": `A3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D#4": `Ds4.${FORMAT_PLACEHOLDER}`,
                "F#4": `Fs4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "D#5": `Ds5.${FORMAT_PLACEHOLDER}`, "F#5": `Fs5.${FORMAT_PLACEHOLDER}`, "A5": `A5.${FORMAT_PLACEHOLDER}`,
                "C6": `C6.${FORMAT_PLACEHOLDER}`, "D#6": `Ds6.${FORMAT_PLACEHOLDER}`, "F#6": `Fs6.${FORMAT_PLACEHOLDER}`,
                "A6": `A6.${FORMAT_PLACEHOLDER}`, "C7": `C7.${FORMAT_PLACEHOLDER}`, "D#7": `Ds7.${FORMAT_PLACEHOLDER}`,
                "F#7": `Fs7.${FORMAT_PLACEHOLDER}`, "A7": `A7.${FORMAT_PLACEHOLDER}`, "C8": `C8.${FORMAT_PLACEHOLDER}`
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            effects: ['reverb'],
            maxVoices: 8,
            priority: 'high',
            category: 'keyboard'
        },
        
        organ: {
            urls: {
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`,
                "C5": `C5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`, "A2": `A2.${FORMAT_PLACEHOLDER}`,
                "A3": `A3.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`, "F#2": `Fs2.${FORMAT_PLACEHOLDER}`,
                "F#3": `Fs3.${FORMAT_PLACEHOLDER}`, "F#4": `Fs4.${FORMAT_PLACEHOLDER}`, "F#5": `Fs5.${FORMAT_PLACEHOLDER}`
            },
            release: 0.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/organ/",
            effects: ['chorus', 'reverb'],
            maxVoices: 6,
            priority: 'medium',
            category: 'keyboard'
        },

        electricPiano: {
            // Note: No samples available - synthesis only
            urls: {},
            release: 2.5,
            baseUrl: "",
            effects: ['reverb', 'chorus'],
            maxVoices: 8,
            priority: 'medium',
            category: 'keyboard',
            requiresHighQuality: false
        },

        harpsichord: {
            // Note: No samples available - synthesis only
            urls: {},
            release: 1.0,
            baseUrl: "",
            effects: ['reverb', 'filter'],
            maxVoices: 8,
            priority: 'medium',
            category: 'keyboard',
            requiresHighQuality: false
        },

        accordion: {
            // Note: No samples available - synthesis only
            urls: {},
            release: 2.8,
            baseUrl: "",
            effects: ['reverb', 'chorus'],
            maxVoices: 6,
            priority: 'low',
            category: 'keyboard',
            requiresHighQuality: false
        },

        celesta: {
            // Note: No samples available - synthesis only
            urls: {},
            release: 3.5,
            baseUrl: "",
            effects: ['reverb', 'filter'],
            maxVoices: 6,
            priority: 'low',
            category: 'keyboard',
            requiresHighQuality: false
        }
    }
};