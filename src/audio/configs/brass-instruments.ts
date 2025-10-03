import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const brassInstruments: InstrumentFamily = {
    name: 'Brass Instruments',
    description: 'Trumpet, horn, trombone, tuba and other brass instruments',
    instruments: {
        trumpet: {
            urls: {
                'C5': `C5.${FORMAT_PLACEHOLDER}`,
                'D4': `D4.${FORMAT_PLACEHOLDER}`,
                'Ds5': `Ds5.${FORMAT_PLACEHOLDER}`,
                'F4': `F4.${FORMAT_PLACEHOLDER}`,
                'G4': `G4.${FORMAT_PLACEHOLDER}`,
                'A4': `A4.${FORMAT_PLACEHOLDER}`,
                'As4': `As4.${FORMAT_PLACEHOLDER}`
            },
            release: 1.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/trumpet/",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'high',
            category: 'brass'
        },

        'french-horn': {
            urls: {
                'A1': `A1.${FORMAT_PLACEHOLDER}`,
                'A3': `A3.${FORMAT_PLACEHOLDER}`,
                'C2': `C2.${FORMAT_PLACEHOLDER}`,
                'C4': `C4.${FORMAT_PLACEHOLDER}`,
                'D3': `D3.${FORMAT_PLACEHOLDER}`,
                'D5': `D5.${FORMAT_PLACEHOLDER}`,
                'Ds2': `Ds2.${FORMAT_PLACEHOLDER}`,
                'F3': `F3.${FORMAT_PLACEHOLDER}`,
                'F5': `F5.${FORMAT_PLACEHOLDER}`,
                'G2': `G2.${FORMAT_PLACEHOLDER}`
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
                'As2': `As2.${FORMAT_PLACEHOLDER}`,
                'C3': `C3.${FORMAT_PLACEHOLDER}`,
                'D3': `D3.${FORMAT_PLACEHOLDER}`,
                'F2': `F2.${FORMAT_PLACEHOLDER}`,
                'F3': `F3.${FORMAT_PLACEHOLDER}`,
                'As1': `As1.${FORMAT_PLACEHOLDER}`
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
                'As1': `As1.${FORMAT_PLACEHOLDER}`,
                'D2': `D2.${FORMAT_PLACEHOLDER}`,
                'D3': `D3.${FORMAT_PLACEHOLDER}`,
                'Ds2': `Ds2.${FORMAT_PLACEHOLDER}`,
                'F1': `F1.${FORMAT_PLACEHOLDER}`,
                'As0': `As0.${FORMAT_PLACEHOLDER}`
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