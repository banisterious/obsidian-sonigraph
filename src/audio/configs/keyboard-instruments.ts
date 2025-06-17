import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const keyboardInstruments: InstrumentFamily = {
    name: 'Keyboard Instruments',
    description: 'Piano, organ, harpsichord, and other keyboard-based instruments',
    instruments: {
        piano: {
            urls: {
                "A0": `A0.${FORMAT_PLACEHOLDER}`, "C1": `C1.${FORMAT_PLACEHOLDER}`, "D#1": `Ds1.${FORMAT_PLACEHOLDER}`,
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
                "C5": `C5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`,
                "F3": `F3.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`,
                "F6": `F6.${FORMAT_PLACEHOLDER}`, "F#2": `Fs2.${FORMAT_PLACEHOLDER}`, "F#3": `Fs3.${FORMAT_PLACEHOLDER}`,
                "F#4": `Fs4.${FORMAT_PLACEHOLDER}`, "F#5": `Fs5.${FORMAT_PLACEHOLDER}`, "F#6": `Fs6.${FORMAT_PLACEHOLDER}`,
                "G2": `G2.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "G5": `G5.${FORMAT_PLACEHOLDER}`, "G6": `G6.${FORMAT_PLACEHOLDER}`
            },
            release: 0.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/harmonium/",
            effects: ['chorus', 'reverb'],
            maxVoices: 6,
            priority: 'medium',
            category: 'keyboard'
        },

        electricPiano: {
            urls: {
                "A1": `A1.${FORMAT_PLACEHOLDER}`, "C2": `C2.${FORMAT_PLACEHOLDER}`, "E2": `E2.${FORMAT_PLACEHOLDER}`,
                "G2": `G2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`,
                "G3": `G3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "G4": `G4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "E5": `E5.${FORMAT_PLACEHOLDER}`,
                "G5": `G5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`, "E6": `E6.${FORMAT_PLACEHOLDER}`
            },
            release: 2.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/electric-piano/",
            effects: ['reverb', 'chorus'],
            maxVoices: 8,
            priority: 'medium',
            category: 'keyboard'
        },

        harpsichord: {
            urls: {
                "C2": `C2.${FORMAT_PLACEHOLDER}`, "D2": `D2.${FORMAT_PLACEHOLDER}`, "F2": `F2.${FORMAT_PLACEHOLDER}`,
                "G2": `G2.${FORMAT_PLACEHOLDER}`, "A2": `A2.${FORMAT_PLACEHOLDER}`, "C3": `C3.${FORMAT_PLACEHOLDER}`,
                "D3": `D3.${FORMAT_PLACEHOLDER}`, "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`,
                "A3": `A3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`
            },
            release: 1.0,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/harpsichord/",
            effects: ['reverb', 'filter'],
            maxVoices: 8,
            priority: 'medium',
            category: 'keyboard'
        },

        accordion: {
            urls: {
                "C3": `C3.${FORMAT_PLACEHOLDER}`, "D3": `D3.${FORMAT_PLACEHOLDER}`, "E3": `E3.${FORMAT_PLACEHOLDER}`,
                "F3": `F3.${FORMAT_PLACEHOLDER}`, "G3": `G3.${FORMAT_PLACEHOLDER}`, "A3": `A3.${FORMAT_PLACEHOLDER}`,
                "B3": `B3.${FORMAT_PLACEHOLDER}`, "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`,
                "E4": `E4.${FORMAT_PLACEHOLDER}`, "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`,
                "A4": `A4.${FORMAT_PLACEHOLDER}`, "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`,
                "D5": `D5.${FORMAT_PLACEHOLDER}`, "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`
            },
            release: 2.8,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/accordion/",
            effects: ['reverb', 'chorus'],
            maxVoices: 6,
            priority: 'low',
            category: 'keyboard'
        },

        celesta: {
            urls: {
                "C4": `C4.${FORMAT_PLACEHOLDER}`, "D4": `D4.${FORMAT_PLACEHOLDER}`, "E4": `E4.${FORMAT_PLACEHOLDER}`,
                "F4": `F4.${FORMAT_PLACEHOLDER}`, "G4": `G4.${FORMAT_PLACEHOLDER}`, "A4": `A4.${FORMAT_PLACEHOLDER}`,
                "B4": `B4.${FORMAT_PLACEHOLDER}`, "C5": `C5.${FORMAT_PLACEHOLDER}`, "D5": `D5.${FORMAT_PLACEHOLDER}`,
                "E5": `E5.${FORMAT_PLACEHOLDER}`, "F5": `F5.${FORMAT_PLACEHOLDER}`, "G5": `G5.${FORMAT_PLACEHOLDER}`,
                "A5": `A5.${FORMAT_PLACEHOLDER}`, "B5": `B5.${FORMAT_PLACEHOLDER}`, "C6": `C6.${FORMAT_PLACEHOLDER}`,
                "D6": `D6.${FORMAT_PLACEHOLDER}`, "E6": `E6.${FORMAT_PLACEHOLDER}`, "F6": `F6.${FORMAT_PLACEHOLDER}`
            },
            release: 3.5,
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/celesta/",
            effects: ['reverb', 'filter'],
            maxVoices: 6,
            priority: 'low',
            category: 'keyboard'
        }
    }
};