import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const worldInstruments: InstrumentFamily = {
    name: 'World & Environmental Instruments',
    description: 'Unique, environmental and world music instruments with authentic whale sounds',
    instruments: {
        // Original humpback whale (fallback synthesis)
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
        },
        
        // External whale samples (Freesound integration)
        whaleBlue: {
            urls: {
                "C1": "external", "F1": "external", "Bb1": "external",
                "C2": "external", "F2": "external", "Bb2": "external"
            },
            release: 8.0,
            baseUrl: "external://whale/blue",
            effects: ['reverb', 'filter'],
            maxVoices: 1,
            priority: 'low',
            category: 'world',
            frequencyRange: [10, 40], // Infrasonic calls
            description: 'Authentic blue whale infrasonic calls from MBARI hydrophone recordings'
        },
        
        whaleOrca: {
            urls: {
                "C3": "external", "F3": "external", "Bb3": "external",
                "C4": "external", "F4": "external", "Bb4": "external",
                "C5": "external", "F5": "external"
            },
            release: 4.0,
            baseUrl: "external://whale/orca",
            effects: ['reverb', 'filter'],
            maxVoices: 3,
            priority: 'medium',
            category: 'world',
            frequencyRange: [500, 25000], // Clicks and calls
            description: 'Authentic orca vocalizations and pod communications from deep-sea observatory'
        },
        
        whaleGray: {
            urls: {
                "C2": "external", "F2": "external", "Bb2": "external",
                "C3": "external", "F3": "external", "Bb3": "external"
            },
            release: 5.0,
            baseUrl: "external://whale/gray",
            effects: ['reverb', 'filter'],
            maxVoices: 2,
            priority: 'low',
            category: 'world',
            frequencyRange: [100, 2000], // Migration calls
            description: 'Gray whale migration calls from MBARI oceanic soundscape project'
        },
        
        whaleSperm: {
            urls: {
                "C4": "external", "F4": "external", "Bb4": "external",
                "C5": "external", "F5": "external", "Bb5": "external"
            },
            release: 3.0,
            baseUrl: "external://whale/sperm",
            effects: ['reverb', 'filter'],
            maxVoices: 2,
            priority: 'medium',
            category: 'world',
            frequencyRange: [100, 30000], // Echolocation
            description: 'Sperm whale echolocation clicks from hydrophone recordings'
        },
        
        whaleMinke: {
            urls: {
                "C2": "external", "F2": "external", "Bb2": "external"
            },
            release: 0.5,
            baseUrl: "external://whale/minke",
            effects: ['reverb'],
            maxVoices: 2,
            priority: 'low',
            category: 'world',
            frequencyRange: [35, 50], // Downsweeps
            description: 'Atlantic minke whale thump trains from NOAA PMEL recordings'
        },
        
        whaleFin: {
            urls: {
                "C1": "external", "F1": "external", "Bb1": "external"
            },
            release: 0.8,
            baseUrl: "external://whale/fin",
            effects: ['reverb'],
            maxVoices: 2,
            priority: 'low',
            category: 'world',
            frequencyRange: [15, 30], // Pulse sequences
            description: 'Atlantic fin whale pulse sequences from NOAA research'
        },
        
        // Enhanced humpback with external samples
        whaleHumpbackExternal: {
            urls: {
                "C2": "external", "F2": "external", "Bb2": "external",
                "C3": "external", "F3": "external", "Bb3": "external",
                "C4": "external", "F4": "external"
            },
            release: 6.0,
            baseUrl: "external://whale/humpback",
            effects: ['reverb', 'filter', 'chorus'],
            maxVoices: 3,
            priority: 'medium',
            category: 'world',
            frequencyRange: [20, 4000], // Complex songs
            description: 'Authentic humpback whale songs from Caribbean and Alaska recordings'
        }
    }
};