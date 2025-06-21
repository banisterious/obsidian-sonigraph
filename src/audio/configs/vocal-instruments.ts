import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const vocalInstruments: InstrumentFamily = {
    name: 'Vocal Instruments',
    description: 'Choir, individual voice sections, and vocal pads',
    instruments: {
        choir: {
            urls: {
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D#3": `Ds3.${FORMAT_PLACEHOLDER}`, "F#3": `Fs3.${FORMAT_PLACEHOLDER}`,
                "A3": `A3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D#4": `Ds4.${FORMAT_PLACEHOLDER}`,
                "F#4": `Fs4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "D#5": `Ds5.${FORMAT_PLACEHOLDER}`, "F#5": `Fs5.${FORMAT_PLACEHOLDER}`, "A5": `A5.${FORMAT_PLACEHOLDER}`,
                "C6": `C6.${FORMAT_PLACEHOLDER}`, "D#6": `Ds6.${FORMAT_PLACEHOLDER}`
            },
            release: 3.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/choir/",
            effects: ['reverb', 'chorus'],
            maxVoices: 8,
            priority: 'high',
            category: 'vocals'
        },

        // Vocal instruments with invalid URLs disabled until valid samples are found
        // The nbrosowsky-tonejs-instruments collection does not contain vocal samples
        /*
        soprano: {
            urls: {
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`,
                "D6": `D6.${FORMAT_PLACEHOLDER}`, "E6": `E6.${FORMAT_PLACEHOLDER}`, "F6": `F6.${FORMAT_PLACEHOLDER}`
            },
            release: 2.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/soprano/", // INVALID URL
            effects: ['reverb', 'chorus', 'filter'],
            maxVoices: 4,
            priority: 'high',
            category: 'vocals'
        },

        alto: {
            urls: {
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`
            },
            release: 2.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/alto/", // INVALID URL
            effects: ['reverb', 'chorus', 'filter'],
            maxVoices: 4,
            priority: 'high',
            category: 'vocals'
        },

        tenor: {
            urls: {
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`,
                "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`,
                "B3": `B3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`,
                "E4": `E4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "A4": `A4.${FORMAT_PLACEHOLDER}`, "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`
            },
            release: 2.3,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/tenor/", // INVALID URL
            effects: ['reverb', 'filter'],
            maxVoices: 4,
            priority: 'high',
            category: 'vocals'
        },

        bass: {
            urls: {
                "E2": `E2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`, "G2": `G2.${FORMAT_PLACEHOLDER}`,
                "A2": `A2.${FORMAT_PLACEHOLDER}`, "B2": `B2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`,
                "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`,
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`
            },
            release: 3.2,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/bass-voice/", // INVALID URL
            effects: ['reverb'],
            maxVoices: 4,
            priority: 'high',
            category: 'vocals'
        },

        vocalPads: {
            urls: {
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`, "A2": `A2.${FORMAT_PLACEHOLDER}`,
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "C5": `C5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "A5": `A5.${FORMAT_PLACEHOLDER}`
            },
            release: 4.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/vocal-pads/", // INVALID URL
            effects: ['reverb', 'filter'],
            maxVoices: 6,
            priority: 'medium',
            category: 'vocals'
        },

        pad: {
            urls: {
                "C1": `C1.${FORMAT_PLACEHOLDER}`, "G1": `G1.${FORMAT_PLACEHOLDER}`, "C2": `C2.${FORMAT_PLACEHOLDER}`,
                "G2": `G2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "G5": `G5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`
            },
            release: 5.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/synth-pad/", // INVALID URL
            effects: ['reverb', 'filter'],
            maxVoices: 8,
            priority: 'low',
            category: 'vocals'
        }
        */
    }
};