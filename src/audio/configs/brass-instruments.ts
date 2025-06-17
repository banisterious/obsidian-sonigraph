import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const brassInstruments: InstrumentFamily = {
    name: 'Brass Instruments',
    description: 'Trumpet, horn, trombone, tuba and other brass instruments',
    instruments: {
        trumpet: {
            urls: {
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`,
                "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`,
                "B3": `B3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`,
                "E4": `E4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "A4": `A4.${FORMAT_PLACEHOLDER}`, "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "D5": `D5.${FORMAT_PLACEHOLDER}`, "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`
            },
            release: 1.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/trumpet/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'high',
            category: 'brass'
        },

        frenchHorn: {
            urls: {
                "B2": `B2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`,
                "E3": `E3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`,
                "A3": `A3.${FORMAT_PLACEHOLDER}`, "B3": `B3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`,
                "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`,
                "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`, "B4": `B4.${FORMAT_PLACEHOLDER}`,
                "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`, "E5": `E5.${FORMAT_PLACEHOLDER}`
            },
            release: 2.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/french-horn/",
            effects: ['reverb', 'chorus', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'brass'
        },

        trombone: {
            urls: {
                "A1": `A1.${FORMAT_PLACEHOLDER}`, "B1": `B1.${FORMAT_PLACEHOLDER}`, "C2": `C2.${FORMAT_PLACEHOLDER}`,
                "D2": `D2.${FORMAT_PLACEHOLDER}`, "E2": `E2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`,
                "G2": `G2.${FORMAT_PLACEHOLDER}`, "A2": `A2.${FORMAT_PLACEHOLDER}`, "B2": `B2.${FORMAT_PLACEHOLDER}`,
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`,
                "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`,
                "B3": `B3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`
            },
            release: 2.2,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/trombone/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'brass'
        },

        tuba: {
            urls: {
                "E1": `E1.${FORMAT_PLACEHOLDER}`, "F1": `F1.${FORMAT_PLACEHOLDER}`, "G1": `G1.${FORMAT_PLACEHOLDER}`,
                "A1": `A1.${FORMAT_PLACEHOLDER}`, "B1": `B1.${FORMAT_PLACEHOLDER}`, "C2": `C2.${FORMAT_PLACEHOLDER}`,
                "D2": `D2.${FORMAT_PLACEHOLDER}`, "E2": `E2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`,
                "G2": `G2.${FORMAT_PLACEHOLDER}`, "A2": `A2.${FORMAT_PLACEHOLDER}`, "B2": `B2.${FORMAT_PLACEHOLDER}`,
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`
            },
            release: 3.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/tuba/",
            effects: ['reverb'],
            maxVoices: 2,
            priority: 'medium',
            category: 'brass'
        }
    }
};