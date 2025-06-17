import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const woodwindInstruments: InstrumentFamily = {
    name: 'Woodwind Instruments',
    description: 'Flute, clarinet, saxophone, oboe and other wind instruments',
    instruments: {
        flute: {
            urls: {
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`,
                "D6": `D6.${FORMAT_PLACEHOLDER}`, "E6": `E6.${FORMAT_PLACEHOLDER}`
            },
            release: 1.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/flute/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        },

        clarinet: {
            urls: {
                "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`,
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`,
                "D6": `D6.${FORMAT_PLACEHOLDER}`, "E6": `E6.${FORMAT_PLACEHOLDER}`
            },
            release: 2.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/clarinet/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        },

        saxophone: {
            urls: {
                "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`,
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`,
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`
            },
            release: 1.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/saxophone/",
            effects: ['reverb', 'chorus', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        },

        oboe: {
            urls: {
                "Bb3": `Bb3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`,
                "E4": `E4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "A4": `A4.${FORMAT_PLACEHOLDER}`, "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "D5": `D5.${FORMAT_PLACEHOLDER}`, "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`,
                "G5": `G5.${FORMAT_PLACEHOLDER}`, "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`,
                "C6": `C6.${FORMAT_PLACEHOLDER}`, "D6": `D6.${FORMAT_PLACEHOLDER}`
            },
            release: 1.6,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/oboe/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        }
    }
};