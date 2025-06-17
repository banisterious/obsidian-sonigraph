import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const worldInstruments: InstrumentFamily = {
    name: 'World & Environmental Instruments',
    description: 'Unique, environmental and world music instruments',
    instruments: {
        whaleHumpback: {
            urls: {
                "C1": `C1.${FORMAT_PLACEHOLDER}`, "F1": `F1.${FORMAT_PLACEHOLDER}`, "Bb1": `Bb1.${FORMAT_PLACEHOLDER}`,
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`, "Bb2": `Bb2.${FORMAT_PLACEHOLDER}`,
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`
            },
            release: 6.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/whale-humpback/",
            effects: ['reverb', 'filter'],
            maxVoices: 2,
            priority: 'low',
            category: 'world'
        }
    }
};