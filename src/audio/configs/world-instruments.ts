import { InstrumentFamily, FORMAT_PLACEHOLDER } from './types';

export const worldInstruments: InstrumentFamily = {
    name: 'World & Environmental Instruments',
    description: 'Unique, environmental and world music instruments with authentic whale sounds',
    instruments: {
        // Synthesized humpback whale (fallback when external samples unavailable)
        whaleHumpback: {
            urls: {},  // No CDN samples available, use synthesis or external whale manager
            release: 6.0,
            baseUrl: "",  // Empty baseUrl forces synthesis mode
            effects: ['reverb', 'filter'],
            maxVoices: 2,
            priority: 'low',
            category: 'world'
        },
        
        // High-quality whale species (real NOAA recordings) - Only available in high-quality mode
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
            description: 'Authentic blue whale infrasonic calls from NOAA hydrophone recordings',
            requiresHighQuality: true
        },
        whaleOrca: {
            urls: {
                "C2": "external", "F2": "external", "Bb2": "external",
                "C3": "external", "F3": "external", "Bb3": "external"
            },
            release: 5.0,
            baseUrl: "external://whale/orca",
            effects: ['reverb', 'filter'],
            maxVoices: 2,
            priority: 'low',
            category: 'world',
            frequencyRange: [500, 25000], // Clicks and calls
            description: 'Authentic orca pod communications from MBARI deep-sea observatory',
            requiresHighQuality: true
        },
        whaleGray: {
            urls: {
                "C1": "external", "F1": "external", "Bb1": "external",
                "C2": "external", "F2": "external", "Bb2": "external"
            },
            release: 7.0,
            baseUrl: "external://whale/gray",
            effects: ['reverb', 'filter'],
            maxVoices: 1,
            priority: 'low',
            category: 'world',
            frequencyRange: [100, 2000], // Migration calls
            description: 'Authentic gray whale migration calls from oceanic soundscape recordings',
            requiresHighQuality: true
        },
        whaleSperm: {
            urls: {
                "C2": "external", "F2": "external", "Bb2": "external",
                "C3": "external", "F3": "external", "Bb3": "external"
            },
            release: 4.0,
            baseUrl: "external://whale/sperm",
            effects: ['reverb', 'filter'],
            maxVoices: 1,
            priority: 'low',
            category: 'world',
            frequencyRange: [100, 30000], // Echolocation
            description: 'Authentic sperm whale echolocation clicks from Newfoundland recordings',
            requiresHighQuality: true
        },
        whaleMinke: {
            urls: {
                "C1": "external", "F1": "external", "Bb1": "external",
                "C2": "external", "F2": "external", "Bb2": "external"
            },
            release: 6.0,
            baseUrl: "external://whale/minke",
            effects: ['reverb', 'filter'],
            maxVoices: 1,
            priority: 'low',
            category: 'world',
            frequencyRange: [35, 50], // Downsweeps
            description: 'Authentic Atlantic minke whale downsweeps from NOAA PMEL recordings',
            requiresHighQuality: true
        },
        whaleFin: {
            urls: {
                "C1": "external", "F1": "external", "Bb1": "external",
                "C2": "external", "F2": "external", "Bb2": "external"
            },
            release: 8.0,
            baseUrl: "external://whale/fin",
            effects: ['reverb', 'filter'],
            maxVoices: 1,
            priority: 'low',
            category: 'world',
            frequencyRange: [15, 30], // Pulse sequences
            description: 'Authentic fin whale pulse sequences from NOAA Pennsylvania Group',
            requiresHighQuality: true
        },
        whaleRight: {
            urls: {
                "C1": "external", "F1": "external", "Bb1": "external",
                "C2": "external", "F2": "external", "Bb2": "external"
            },
            release: 5.0,
            baseUrl: "external://whale/right",
            effects: ['reverb', 'filter'],
            maxVoices: 1,
            priority: 'low',
            category: 'world',
            frequencyRange: [50, 500], // Upcalls
            description: 'Authentic North Atlantic right whale upcalls from NOAA Fisheries',
            requiresHighQuality: true
        },
        whaleSei: {
            urls: {
                "C1": "external", "F1": "external", "Bb1": "external",
                "C2": "external", "F2": "external", "Bb2": "external"
            },
            release: 7.0,
            baseUrl: "external://whale/sei",
            effects: ['reverb', 'filter'],
            maxVoices: 1,
            priority: 'low',
            category: 'world',
            frequencyRange: [200, 600], // Downsweeps
            description: 'Authentic sei whale downsweeps from NOAA Pennsylvania Group',
            requiresHighQuality: true
        },
        whalePilot: {
            urls: {
                "C2": "external", "F2": "external", "Bb2": "external",
                "C3": "external", "F3": "external", "Bb3": "external"
            },
            release: 5.0,
            baseUrl: "external://whale/pilot",
            effects: ['reverb', 'filter'],
            maxVoices: 2,
            priority: 'low',
            category: 'world',
            frequencyRange: [300, 8000], // Toothed whale vocalizations
            description: 'Authentic pilot whale multi-sound communications from NOAA Fisheries',
            requiresHighQuality: true
        }
    }
};