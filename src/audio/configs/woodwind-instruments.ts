import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const woodwindInstruments: InstrumentFamily = {
    name: 'Woodwind Instruments',
    description: 'Flute, clarinet, saxophone, bassoon and other wind instruments',
    instruments: {
        // Oboe - no samples available, synthesis only
        oboe: {
            urls: {},
            release: 1.6,
            baseUrl: "",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind',
            requiresHighQuality: false
        },

        // Clarinet - only include available samples
        clarinet: {
            urls: {
                'D3': `D3.${FORMAT_PLACEHOLDER}`,
                'D4': `D4.${FORMAT_PLACEHOLDER}`,
                'D5': `D5.${FORMAT_PLACEHOLDER}`,
                'F3': `F3.${FORMAT_PLACEHOLDER}`,
                'F4': `F4.${FORMAT_PLACEHOLDER}`,
                'F5': `F5.${FORMAT_PLACEHOLDER}`
            },
            release: 2.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/clarinet/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        },

        // Flute - only include available samples
        flute: {
            urls: {
                'A4': `A4.${FORMAT_PLACEHOLDER}`,
                'A5': `A5.${FORMAT_PLACEHOLDER}`,
                'A6': `A6.${FORMAT_PLACEHOLDER}`,
                'C4': `C4.${FORMAT_PLACEHOLDER}`,
                'C5': `C5.${FORMAT_PLACEHOLDER}`,
                'C6': `C6.${FORMAT_PLACEHOLDER}`,
                'C7': `C7.${FORMAT_PLACEHOLDER}`,
                'E4': `E4.${FORMAT_PLACEHOLDER}`,
                'E5': `E5.${FORMAT_PLACEHOLDER}`,
                'E6': `E6.${FORMAT_PLACEHOLDER}`
            },
            release: 1.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/flute/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        },

        // Saxophone - only include available samples
        saxophone: {
            urls: {
                'Ds4': `Ds4.${FORMAT_PLACEHOLDER}`,
                'Ds5': `Ds5.${FORMAT_PLACEHOLDER}`,
                'F3': `F3.${FORMAT_PLACEHOLDER}`,
                'F4': `F4.${FORMAT_PLACEHOLDER}`,
                'F5': `F5.${FORMAT_PLACEHOLDER}`,
                'A3': `A3.${FORMAT_PLACEHOLDER}`,
                'A4': `A4.${FORMAT_PLACEHOLDER}`,
                'A5': `A5.${FORMAT_PLACEHOLDER}`,
                'C3': `C3.${FORMAT_PLACEHOLDER}`,
                'C4': `C4.${FORMAT_PLACEHOLDER}`,
                'C5': `C5.${FORMAT_PLACEHOLDER}`
            },
            release: 1.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/saxophone/",
            effects: ['reverb', 'chorus', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        },

        // Bassoon - corrected to match actual nbrosowsky samples
        bassoon: {
            urls: {
                'A2': `A2.${FORMAT_PLACEHOLDER}`,
                'A3': `A3.${FORMAT_PLACEHOLDER}`,
                'A4': `A4.${FORMAT_PLACEHOLDER}`,
                'C3': `C3.${FORMAT_PLACEHOLDER}`,
                'C4': `C4.${FORMAT_PLACEHOLDER}`,
                'C5': `C5.${FORMAT_PLACEHOLDER}`,
                'E4': `E4.${FORMAT_PLACEHOLDER}`,
                'G2': `G2.${FORMAT_PLACEHOLDER}`,
                'G3': `G3.${FORMAT_PLACEHOLDER}`,
                'G4': `G4.${FORMAT_PLACEHOLDER}`
            },
            release: 2.2,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/bassoon/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'woodwind'
        }
    }
};