import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const percussionInstruments: InstrumentFamily = {
    name: 'Percussion Instruments',
    description: 'Timpani, xylophone, vibraphone, gongs and other percussion',
    instruments: {
        timpani: {
            // Synth-only instrument - no samples available
            urls: {},
            baseUrl: "",
            requiresHighQuality: false,
            release: 4.0,
            effects: ['reverb'],
            maxVoices: 2,
            priority: 'medium',
            category: 'percussion'
        },

        xylophone: {
            urls: {
                "G4": `G4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "C6": `C6.${FORMAT_PLACEHOLDER}`, "G6": `G6.${FORMAT_PLACEHOLDER}`, "C7": `C7.${FORMAT_PLACEHOLDER}`,
                "G7": `G7.${FORMAT_PLACEHOLDER}`, "C8": `C8.${FORMAT_PLACEHOLDER}`
            },
            release: 0.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/xylophone/",
            effects: ['reverb'],
            maxVoices: 6,
            priority: 'medium',
            category: 'percussion'
        },

        vibraphone: {
            // Synth-only instrument - no samples available
            urls: {},
            baseUrl: "",
            requiresHighQuality: false,
            release: 2.5,
            effects: ['reverb', 'chorus'],
            maxVoices: 6,
            priority: 'medium',
            category: 'percussion'
        },

        gongs: {
            // Synth-only instrument - no samples available
            urls: {},
            baseUrl: "",
            requiresHighQuality: false,
            release: 8.0,
            effects: ['reverb', 'filter'],
            maxVoices: 4,
            priority: 'low',
            category: 'percussion'
        }
    }
};

export const electronicInstruments: InstrumentFamily = {
    name: 'Electronic Instruments',
    description: 'Synthesized leads, bass, arpeggios and ambient pads',
    instruments: {
        leadSynth: {
            urls: {},
            baseUrl: "",
            requiresHighQuality: false,
            release: 1.0,
            effects: ['filter', 'chorus'],
            maxVoices: 6,
            priority: 'medium',
            category: 'electronic'
        },

        bassSynth: {
            urls: {},
            baseUrl: "",
            requiresHighQuality: false,
            release: 2.0,
            effects: ['filter', 'chorus'],
            maxVoices: 4,
            priority: 'medium',
            category: 'electronic'
        },

        arpSynth: {
            urls: {},
            baseUrl: "",
            requiresHighQuality: false,
            release: 0.5,
            effects: ['filter', 'chorus', 'reverb'],
            maxVoices: 8,
            priority: 'low',
            category: 'electronic'
        }
    }
};