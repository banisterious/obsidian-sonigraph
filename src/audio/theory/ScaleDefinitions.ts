/**
 * Musical scale and mode definitions
 *
 * Comprehensive collection of scales, modes, and intervals used by the
 * musical theory engine. All intervals are in semitones from the root.
 */

import {
    ScaleDefinition,
    ScaleType,
    ModalScale,
    Interval,
    IntervalType,
    NoteName,
    ChordDefinition,
    ChordQuality,
    ChordProgression
} from './types';

/**
 * Note frequencies in Hz for A440 tuning (middle C = C4)
 */
export const NOTE_FREQUENCIES: Record<NoteName, number> = {
    'C': 261.63,
    'C#': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'B': 493.88
};

/**
 * Note names in chromatic order
 */
export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Western scale definitions
 */
export const SCALE_DEFINITIONS: Record<ScaleType | ModalScale, ScaleDefinition> = {
    // Major scales
    'major': {
        name: 'Major',
        type: 'major',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        description: 'Major scale (Ionian mode)',
        characteristic: 'Bright, happy, stable'
    },

    // Minor scales
    'minor': {
        name: 'Natural Minor',
        type: 'minor',
        intervals: [0, 2, 3, 5, 7, 8, 10],
        description: 'Natural minor scale (Aeolian mode)',
        characteristic: 'Dark, sad, melancholic'
    },
    'harmonic-minor': {
        name: 'Harmonic Minor',
        type: 'harmonic-minor',
        intervals: [0, 2, 3, 5, 7, 8, 11],
        description: 'Harmonic minor with raised 7th',
        characteristic: 'Exotic, dramatic, Middle Eastern'
    },
    'melodic-minor': {
        name: 'Melodic Minor',
        type: 'melodic-minor',
        intervals: [0, 2, 3, 5, 7, 9, 11],
        description: 'Melodic minor (ascending)',
        characteristic: 'Bright minor, versatile'
    },

    // Pentatonic scales
    'pentatonic-major': {
        name: 'Pentatonic Major',
        type: 'pentatonic-major',
        intervals: [0, 2, 4, 7, 9],
        description: 'Five-note major scale',
        characteristic: 'Simple, folk, universal'
    },
    'pentatonic-minor': {
        name: 'Pentatonic Minor',
        type: 'pentatonic-minor',
        intervals: [0, 3, 5, 7, 10],
        description: 'Five-note minor scale',
        characteristic: 'Blues, rock, melancholic'
    },

    // Blues scale
    'blues': {
        name: 'Blues',
        type: 'blues',
        intervals: [0, 3, 5, 6, 7, 10],
        description: 'Blues scale with blue notes',
        characteristic: 'Bluesy, soulful, expressive'
    },

    // Exotic scales
    'chromatic': {
        name: 'Chromatic',
        type: 'chromatic',
        intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        description: 'All twelve notes',
        characteristic: 'Dissonant, atonal, free'
    },
    'whole-tone': {
        name: 'Whole Tone',
        type: 'whole-tone',
        intervals: [0, 2, 4, 6, 8, 10],
        description: 'Six-note scale with whole steps',
        characteristic: 'Dreamy, ambiguous, impressionistic'
    },
    'diminished': {
        name: 'Diminished',
        type: 'diminished',
        intervals: [0, 2, 3, 5, 6, 8, 9, 11],
        description: 'Octatonic scale (half-whole)',
        characteristic: 'Tense, symmetrical, jazzy'
    },

    // Modal scales (Church modes)
    'ionian': {
        name: 'Ionian',
        type: 'ionian',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        description: 'Major scale',
        characteristic: 'Bright, happy, stable'
    },
    'dorian': {
        name: 'Dorian',
        type: 'dorian',
        intervals: [0, 2, 3, 5, 7, 9, 10],
        description: 'Minor scale with raised 6th',
        characteristic: 'Jazzy, sophisticated, versatile'
    },
    'phrygian': {
        name: 'Phrygian',
        type: 'phrygian',
        intervals: [0, 1, 3, 5, 7, 8, 10],
        description: 'Minor scale with lowered 2nd',
        characteristic: 'Spanish, dark, exotic'
    },
    'lydian': {
        name: 'Lydian',
        type: 'lydian',
        intervals: [0, 2, 4, 6, 7, 9, 11],
        description: 'Major scale with raised 4th',
        characteristic: 'Dreamy, ethereal, floating'
    },
    'mixolydian': {
        name: 'Mixolydian',
        type: 'mixolydian',
        intervals: [0, 2, 4, 5, 7, 9, 10],
        description: 'Major scale with lowered 7th',
        characteristic: 'Blues-rock, dominant, strong'
    },
    'aeolian': {
        name: 'Aeolian',
        type: 'aeolian',
        intervals: [0, 2, 3, 5, 7, 8, 10],
        description: 'Natural minor scale',
        characteristic: 'Dark, sad, melancholic'
    },
    'locrian': {
        name: 'Locrian',
        type: 'locrian',
        intervals: [0, 1, 3, 5, 6, 8, 10],
        description: 'Diminished scale',
        characteristic: 'Unstable, dissonant, theoretical'
    },

    // Custom placeholder
    'custom': {
        name: 'Custom',
        type: 'custom',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        description: 'User-defined scale',
        characteristic: 'Variable'
    }
};

/**
 * Interval definitions with semitones and frequency ratios
 */
export const INTERVAL_DEFINITIONS: Record<IntervalType, Interval> = {
    'unison': {
        name: 'Perfect Unison',
        type: 'unison',
        semitones: 0,
        frequency_ratio: 1.0
    },
    'minor-second': {
        name: 'Minor Second',
        type: 'minor-second',
        semitones: 1,
        frequency_ratio: 16 / 15
    },
    'major-second': {
        name: 'Major Second',
        type: 'major-second',
        semitones: 2,
        frequency_ratio: 9 / 8
    },
    'minor-third': {
        name: 'Minor Third',
        type: 'minor-third',
        semitones: 3,
        frequency_ratio: 6 / 5
    },
    'major-third': {
        name: 'Major Third',
        type: 'major-third',
        semitones: 4,
        frequency_ratio: 5 / 4
    },
    'perfect-fourth': {
        name: 'Perfect Fourth',
        type: 'perfect-fourth',
        semitones: 5,
        frequency_ratio: 4 / 3
    },
    'tritone': {
        name: 'Tritone',
        type: 'tritone',
        semitones: 6,
        frequency_ratio: Math.sqrt(2)
    },
    'perfect-fifth': {
        name: 'Perfect Fifth',
        type: 'perfect-fifth',
        semitones: 7,
        frequency_ratio: 3 / 2
    },
    'minor-sixth': {
        name: 'Minor Sixth',
        type: 'minor-sixth',
        semitones: 8,
        frequency_ratio: 8 / 5
    },
    'major-sixth': {
        name: 'Major Sixth',
        type: 'major-sixth',
        semitones: 9,
        frequency_ratio: 5 / 3
    },
    'minor-seventh': {
        name: 'Minor Seventh',
        type: 'minor-seventh',
        semitones: 10,
        frequency_ratio: 9 / 5
    },
    'major-seventh': {
        name: 'Major Seventh',
        type: 'major-seventh',
        semitones: 11,
        frequency_ratio: 15 / 8
    },
    'octave': {
        name: 'Octave',
        type: 'octave',
        semitones: 12,
        frequency_ratio: 2.0
    }
};

/**
 * Chord definitions
 */
export const CHORD_DEFINITIONS: Record<ChordQuality, ChordDefinition> = {
    'major': {
        name: 'Major',
        quality: 'major',
        intervals: [0, 4, 7]
    },
    'minor': {
        name: 'Minor',
        quality: 'minor',
        intervals: [0, 3, 7]
    },
    'diminished': {
        name: 'Diminished',
        quality: 'diminished',
        intervals: [0, 3, 6]
    },
    'augmented': {
        name: 'Augmented',
        quality: 'augmented',
        intervals: [0, 4, 8]
    },
    'dominant-seventh': {
        name: 'Dominant 7th',
        quality: 'dominant-seventh',
        intervals: [0, 4, 7, 10]
    },
    'major-seventh': {
        name: 'Major 7th',
        quality: 'major-seventh',
        intervals: [0, 4, 7, 11]
    },
    'minor-seventh': {
        name: 'Minor 7th',
        quality: 'minor-seventh',
        intervals: [0, 3, 7, 10]
    },
    'half-diminished': {
        name: 'Half Diminished',
        quality: 'half-diminished',
        intervals: [0, 3, 6, 10]
    },
    'suspended-fourth': {
        name: 'Suspended 4th',
        quality: 'suspended-fourth',
        intervals: [0, 5, 7]
    },
    'suspended-second': {
        name: 'Suspended 2nd',
        quality: 'suspended-second',
        intervals: [0, 2, 7]
    }
};

/**
 * Common chord progressions
 */
export const CHORD_PROGRESSIONS: Record<string, ChordProgression> = {
    'I-IV-V-I': {
        name: 'I-IV-V-I',
        chords: [
            CHORD_DEFINITIONS['major'],
            CHORD_DEFINITIONS['major'],
            CHORD_DEFINITIONS['major'],
            CHORD_DEFINITIONS['major']
        ],
        romanNumerals: ['I', 'IV', 'V', 'I'],
        description: 'Classic major progression'
    },
    'i-iv-v-i': {
        name: 'i-iv-v-i',
        chords: [
            CHORD_DEFINITIONS['minor'],
            CHORD_DEFINITIONS['minor'],
            CHORD_DEFINITIONS['minor'],
            CHORD_DEFINITIONS['minor']
        ],
        romanNumerals: ['i', 'iv', 'v', 'i'],
        description: 'Classic minor progression'
    },
    'I-V-vi-IV': {
        name: 'I-V-vi-IV (Pop progression)',
        chords: [
            CHORD_DEFINITIONS['major'],
            CHORD_DEFINITIONS['major'],
            CHORD_DEFINITIONS['minor'],
            CHORD_DEFINITIONS['major']
        ],
        romanNumerals: ['I', 'V', 'vi', 'IV'],
        description: 'Popular modern progression'
    },
    'ii-V-I': {
        name: 'ii-V-I (Jazz turnaround)',
        chords: [
            CHORD_DEFINITIONS['minor-seventh'],
            CHORD_DEFINITIONS['dominant-seventh'],
            CHORD_DEFINITIONS['major-seventh']
        ],
        romanNumerals: ['ii7', 'V7', 'Imaj7'],
        description: 'Classic jazz cadence'
    },
    'I-vi-IV-V': {
        name: 'I-vi-IV-V (50s progression)',
        chords: [
            CHORD_DEFINITIONS['major'],
            CHORD_DEFINITIONS['minor'],
            CHORD_DEFINITIONS['major'],
            CHORD_DEFINITIONS['major']
        ],
        romanNumerals: ['I', 'vi', 'IV', 'V'],
        description: '1950s doo-wop progression'
    }
};

/**
 * Calculate frequency for a note given root frequency and semitone offset
 */
export function calculateFrequency(rootFrequency: number, semitones: number): number {
    return rootFrequency * Math.pow(2, semitones / 12);
}

/**
 * Get note name from semitone index (0-11)
 */
export function getNoteNameFromIndex(index: number): NoteName {
    return NOTE_NAMES[index % 12];
}

/**
 * Get semitone index from note name
 */
export function getSemitoneIndexFromNoteName(noteName: NoteName): number {
    return NOTE_NAMES.indexOf(noteName);
}

/**
 * Calculate frequency for a specific note name
 */
export function getFrequencyForNote(noteName: NoteName, octave: number = 4): number {
    const baseFrequency = NOTE_FREQUENCIES[noteName];
    const octaveMultiplier = Math.pow(2, octave - 4);
    return baseFrequency * octaveMultiplier;
}

/**
 * Get closest note name to a frequency
 */
export function getClosestNoteName(frequency: number): { note: NoteName; octave: number; cents: number } {
    // Calculate number of semitones from A4 (440 Hz)
    const semitonesFromA4 = 12 * Math.log2(frequency / 440);
    const roundedSemitones = Math.round(semitonesFromA4);
    const cents = (semitonesFromA4 - roundedSemitones) * 100;

    // Calculate octave and note index
    const octave = Math.floor((roundedSemitones + 9) / 12) + 4;
    const noteIndex = ((roundedSemitones + 9) % 12 + 12) % 12;

    return {
        note: NOTE_NAMES[noteIndex],
        octave,
        cents
    };
}

/**
 * Generate all frequencies for a scale
 */
export function generateScaleFrequencies(
    rootNote: NoteName,
    scaleType: ScaleType | ModalScale,
    octave: number = 4
): number[] {
    const rootFrequency = getFrequencyForNote(rootNote, octave);
    const scaleDefinition = SCALE_DEFINITIONS[scaleType];

    return scaleDefinition.intervals.map(semitones =>
        calculateFrequency(rootFrequency, semitones)
    );
}

/**
 * Generate all note names for a scale
 */
export function generateScaleNotes(
    rootNote: NoteName,
    scaleType: ScaleType | ModalScale
): NoteName[] {
    const rootIndex = getSemitoneIndexFromNoteName(rootNote);
    const scaleDefinition = SCALE_DEFINITIONS[scaleType];

    return scaleDefinition.intervals.map(semitones =>
        getNoteNameFromIndex(rootIndex + semitones)
    );
}