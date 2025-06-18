import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const percussionInstruments: InstrumentFamily = {
    name: 'Percussion Instruments',
    description: 'Timpani, xylophone, vibraphone, gongs and other percussion',
    instruments: {
        timpani: {
            urls: {
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`,
                "Bb2": `Bb2.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`
            },
            release: 4.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/timpani/",
            effects: ['reverb'],
            maxVoices: 2,
            priority: 'medium',
            category: 'percussion'
        },

        xylophone: {
            urls: {
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`,
                "D6": `D6.${FORMAT_PLACEHOLDER}`, "E6": `E6.${FORMAT_PLACEHOLDER}`, "F6": `F6.${FORMAT_PLACEHOLDER}`
            },
            release: 0.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/xylophone/",
            effects: ['reverb'],
            maxVoices: 6,
            priority: 'medium',
            category: 'percussion'
        },

        vibraphone: {
            urls: {
                "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`,
                "B3": `B3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`,
                "E4": `E4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "A4": `A4.${FORMAT_PLACEHOLDER}`, "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "D5": `D5.${FORMAT_PLACEHOLDER}`, "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`,
                "G5": `G5.${FORMAT_PLACEHOLDER}`, "A5": `A5.${FORMAT_PLACEHOLDER}`
            },
            release: 2.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/vibraphone/",
            effects: ['reverb', 'chorus'],
            maxVoices: 6,
            priority: 'medium',
            category: 'percussion'
        },

        gongs: {
            urls: {
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`
            },
            release: 8.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/gongs/",
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
            urls: {
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "G2": `G2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`,
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "C5": `C5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`
            },
            release: 1.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/lead-synth/",
            effects: ['filter', 'chorus'],
            maxVoices: 6,
            priority: 'medium',
            category: 'electronic'
        },

        bassSynth: {
            urls: {
                "C1": `C1.${FORMAT_PLACEHOLDER}`, "F1": `F1.${FORMAT_PLACEHOLDER}`, "Bb1": `Bb1.${FORMAT_PLACEHOLDER}`,
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`, "Bb2": `Bb2.${FORMAT_PLACEHOLDER}`,
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`, "Bb3": `Bb3.${FORMAT_PLACEHOLDER}`
            },
            release: 2.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/bass-synth/",
            effects: ['filter', 'chorus'],
            maxVoices: 4,
            priority: 'medium',
            category: 'electronic'
        },

        arpSynth: {
            urls: {
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "C5": `C5.${FORMAT_PLACEHOLDER}`, "E5": `E5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`
            },
            release: 0.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/arp-synth/",
            effects: ['filter', 'chorus', 'reverb'],
            maxVoices: 8,
            priority: 'low',
            category: 'electronic'
        }
    }
};