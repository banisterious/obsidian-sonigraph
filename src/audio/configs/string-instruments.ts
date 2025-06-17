import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const stringInstruments: InstrumentFamily = {
    name: 'String Instruments',
    description: 'Violin, viola, cello, bass, guitar, harp and other stringed instruments',
    instruments: {
        strings: {
            urls: {
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D#3": `Ds3.${FORMAT_PLACEHOLDER}`, "F#3": `Fs3.${FORMAT_PLACEHOLDER}`,
                "A3": `A3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D#4": `Ds4.${FORMAT_PLACEHOLDER}`,
                "F#4": `Fs4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "D#5": `Ds5.${FORMAT_PLACEHOLDER}`, "F#5": `Fs5.${FORMAT_PLACEHOLDER}`, "A5": `A5.${FORMAT_PLACEHOLDER}`,
                "C6": `C6.${FORMAT_PLACEHOLDER}`, "D#6": `Ds6.${FORMAT_PLACEHOLDER}`, "F#6": `Fs6.${FORMAT_PLACEHOLDER}`,
                "A6": `A6.${FORMAT_PLACEHOLDER}`
            },
            release: 2.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
            effects: ['reverb', 'filter'],
            maxVoices: 4,
            priority: 'high',
            category: 'strings'
        },

        violin: {
            urls: {
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`
            },
            release: 2.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
            effects: ['reverb', 'filter'],
            maxVoices: 4,
            priority: 'high',
            category: 'strings'
        },

        cello: {
            urls: {
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "D2": `D2.${FORMAT_PLACEHOLDER}`, "E2": `E2.${FORMAT_PLACEHOLDER}`,
                "F2": `F2.${FORMAT_PLACEHOLDER}`, "G2": `G2.${FORMAT_PLACEHOLDER}`, "A2": `A2.${FORMAT_PLACEHOLDER}`,
                "B2": `B2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`,
                "E3": `E3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`,
                "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`,
                "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`
            },
            release: 3.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/cello/",
            effects: ['reverb', 'filter'],
            maxVoices: 4,
            priority: 'high',
            category: 'strings'
        },

        guitar: {
            urls: {
                "E2": `E2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`, "G2": `G2.${FORMAT_PLACEHOLDER}`,
                "A2": `A2.${FORMAT_PLACEHOLDER}`, "B2": `B2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`,
                "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`,
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`
            },
            release: 1.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
            effects: ['reverb', 'chorus'],
            maxVoices: 6,
            priority: 'medium',
            category: 'strings'
        },

        harp: {
            urls: {
                "C1": `C1.${FORMAT_PLACEHOLDER}`, "D1": `D1.${FORMAT_PLACEHOLDER}`, "F1": `F1.${FORMAT_PLACEHOLDER}`,
                "G1": `G1.${FORMAT_PLACEHOLDER}`, "A1": `A1.${FORMAT_PLACEHOLDER}`, "C2": `C2.${FORMAT_PLACEHOLDER}`,
                "D2": `D2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`, "G2": `G2.${FORMAT_PLACEHOLDER}`,
                "A2": `A2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`,
                "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`
            },
            release: 4.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/harp/",
            effects: ['reverb', 'filter'],
            maxVoices: 12,
            priority: 'medium',
            category: 'strings'
        }
    }
};