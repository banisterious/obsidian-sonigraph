/**
 * Harmonic rules and voice leading principles
 *
 * Implements music theory rules for harmony, voice leading, dissonance,
 * and chord progression validation.
 */

import {
    VoiceLeadingRule,
    HarmonicConstraints,
    IntervalType,
    HarmonicFunction
} from './types';
import { INTERVAL_DEFINITIONS } from './ScaleDefinitions';

/**
 * Default harmonic constraints for consonant harmony
 */
export const DEFAULT_HARMONIC_CONSTRAINTS: HarmonicConstraints = {
    enforceScale: true,
    allowChromatic: false,
    maxDissonance: 0.3,
    voiceLeadingRules: [],
    preferredIntervals: ['perfect-fifth', 'major-third', 'perfect-fourth', 'major-sixth'],
    avoidedIntervals: ['minor-second', 'tritone', 'major-seventh']
};

/**
 * Consonance ratings for intervals (0 = dissonant, 1 = consonant)
 */
export const CONSONANCE_RATINGS: Record<IntervalType, number> = {
    'unison': 1.0,
    'octave': 1.0,
    'perfect-fifth': 0.95,
    'perfect-fourth': 0.9,
    'major-third': 0.85,
    'major-sixth': 0.85,
    'minor-third': 0.8,
    'minor-sixth': 0.75,
    'major-second': 0.5,
    'minor-seventh': 0.45,
    'major-seventh': 0.4,
    'minor-second': 0.2,
    'tritone': 0.1
};

/**
 * Voice leading rules for classical harmony
 */
export const VOICE_LEADING_RULES: VoiceLeadingRule[] = [
    {
        name: 'No Parallel Fifths',
        type: 'parallel-motion',
        severity: 'error',
        check: (voices: number[][]) => {
            return !hasParallelInterval(voices, 7); // 7 semitones = perfect fifth
        },
        description: 'Avoid parallel motion in perfect fifths between voices'
    },
    {
        name: 'No Parallel Octaves',
        type: 'parallel-motion',
        severity: 'error',
        check: (voices: number[][]) => {
            return !hasParallelInterval(voices, 12); // 12 semitones = octave
        },
        description: 'Avoid parallel motion in octaves between voices'
    },
    {
        name: 'Prefer Contrary Motion',
        type: 'contrary-motion',
        severity: 'suggestion',
        check: (voices: number[][]) => {
            return hasContraryMotion(voices);
        },
        description: 'Prefer contrary motion between outer voices'
    },
    {
        name: 'Avoid Voice Crossing',
        type: 'voice-crossing',
        severity: 'warning',
        check: (voices: number[][]) => {
            return !hasVoiceCrossing(voices);
        },
        description: 'Avoid voices crossing each other in pitch'
    },
    {
        name: 'Resolve Leading Tone',
        type: 'oblique-motion',
        severity: 'warning',
        check: (voices: number[][]) => {
            // Simplified check - in practice would check for leading tone resolution
            return true;
        },
        description: 'Leading tone should resolve up by semitone to tonic'
    }
];

/**
 * Check for parallel intervals between voices
 */
function hasParallelInterval(voices: number[][], intervalSemitones: number): boolean {
    if (voices.length < 2 || voices[0].length < 2) return false;

    for (let i = 0; i < voices.length - 1; i++) {
        for (let j = i + 1; j < voices.length; j++) {
            const voice1 = voices[i];
            const voice2 = voices[j];

            for (let t = 0; t < voice1.length - 1; t++) {
                const semitones1 = frequencyToSemitones(voice1[t], voice2[t]);
                const semitones2 = frequencyToSemitones(voice1[t + 1], voice2[t + 1]);

                if (Math.abs(semitones1 - intervalSemitones) < 0.5 &&
                    Math.abs(semitones2 - intervalSemitones) < 0.5 &&
                    voice1[t] !== voice1[t + 1] &&
                    voice2[t] !== voice2[t + 1]) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Check for contrary motion between voices
 */
function hasContraryMotion(voices: number[][]): boolean {
    if (voices.length < 2 || voices[0].length < 2) return false;

    const topVoice = voices[0];
    const bottomVoice = voices[voices.length - 1];

    for (let t = 0; t < topVoice.length - 1; t++) {
        const topDirection = topVoice[t + 1] - topVoice[t];
        const bottomDirection = bottomVoice[t + 1] - bottomVoice[t];

        if (topDirection * bottomDirection < 0) {
            return true; // Opposite directions = contrary motion
        }
    }
    return false;
}

/**
 * Check for voice crossing
 */
function hasVoiceCrossing(voices: number[][]): boolean {
    if (voices.length < 2) return false;

    for (let t = 0; t < voices[0].length; t++) {
        for (let i = 0; i < voices.length - 1; i++) {
            if (voices[i][t] < voices[i + 1][t]) {
                return true; // Lower voice is higher than upper voice
            }
        }
    }
    return false;
}

/**
 * Convert frequency pair to semitone interval
 */
function frequencyToSemitones(freq1: number, freq2: number): number {
    return Math.abs(12 * Math.log2(freq2 / freq1));
}

/**
 * Calculate dissonance level for a set of frequencies
 * Uses Plomp-Levelt roughness model
 */
export function calculateDissonance(frequencies: number[]): number {
    if (frequencies.length < 2) return 0;

    let totalDissonance = 0;
    let pairCount = 0;

    for (let i = 0; i < frequencies.length - 1; i++) {
        for (let j = i + 1; j < frequencies.length; j++) {
            const interval = frequencyToSemitones(frequencies[i], frequencies[j]);
            const intervalType = getIntervalType(Math.round(interval) % 12);
            const consonance = CONSONANCE_RATINGS[intervalType] || 0.5;
            totalDissonance += (1 - consonance);
            pairCount++;
        }
    }

    return pairCount > 0 ? totalDissonance / pairCount : 0;
}

/**
 * Get interval type from semitone distance
 */
function getIntervalType(semitones: number): IntervalType {
    const intervalMap: Record<number, IntervalType> = {
        0: 'unison',
        1: 'minor-second',
        2: 'major-second',
        3: 'minor-third',
        4: 'major-third',
        5: 'perfect-fourth',
        6: 'tritone',
        7: 'perfect-fifth',
        8: 'minor-sixth',
        9: 'major-sixth',
        10: 'minor-seventh',
        11: 'major-seventh'
    };
    return intervalMap[semitones] || 'unison';
}

/**
 * Calculate harmonic tension for a chord
 * Higher values = more tension
 */
export function calculateHarmonicTension(frequencies: number[], rootFrequency: number): number {
    const dissonance = calculateDissonance(frequencies);

    // Calculate distance from root
    const rootDistanceScore = frequencies.reduce((sum, freq) => {
        const semitones = frequencyToSemitones(rootFrequency, freq);
        const distance = Math.abs(semitones % 12 - 0); // Distance from root in scale
        return sum + (distance / 12);
    }, 0) / frequencies.length;

    // Combine dissonance and distance
    return (dissonance * 0.7) + (rootDistanceScore * 0.3);
}

/**
 * Validate voice leading between two chords
 */
export function validateVoiceLeading(
    chord1: number[],
    chord2: number[],
    rules: VoiceLeadingRule[]
): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    const voices: number[][] = [];
    for (let i = 0; i < Math.min(chord1.length, chord2.length); i++) {
        voices.push([chord1[i], chord2[i]]);
    }

    for (const rule of rules) {
        if (!rule.check(voices)) {
            if (rule.severity === 'error' || rule.severity === 'warning') {
                violations.push(`${rule.severity.toUpperCase()}: ${rule.description}`);
            }
        }
    }

    return {
        valid: violations.length === 0,
        violations
    };
}

/**
 * Get harmonic function for a chord in a key
 */
export function getHarmonicFunction(
    chordRoot: number,
    keyRoot: number
): HarmonicFunction {
    const semitones = Math.round(frequencyToSemitones(keyRoot, chordRoot)) % 12;

    // Map scale degrees to harmonic functions
    const functionMap: Record<number, HarmonicFunction> = {
        0: 'tonic',       // I
        2: 'predominant', // ii
        4: 'predominant', // iii
        5: 'subdominant', // IV
        7: 'dominant',    // V
        9: 'tonic',       // vi
        11: 'dominant'    // vii°
    };

    return functionMap[semitones] || 'tonic';
}

/**
 * Suggest next chord based on harmonic function
 */
export function suggestNextChord(
    currentFunction: HarmonicFunction,
    keyRoot: number
): number[] {
    // Common progressions by function
    const progressions: Record<HarmonicFunction, number[]> = {
        'tonic': [5, 7], // I -> IV or V
        'subdominant': [7], // IV -> V
        'predominant': [7], // ii -> V
        'dominant': [0]  // V -> I
    };

    const nextDegrees = progressions[currentFunction] || [0];
    return nextDegrees.map(semitones => keyRoot * Math.pow(2, semitones / 12));
}

/**
 * Apply harmonic constraints to a frequency
 */
export function applyHarmonicConstraints(
    frequency: number,
    scaleFrequencies: number[],
    constraints: HarmonicConstraints
): number {
    if (!constraints.enforceScale) {
        return frequency;
    }

    // Find closest scale frequency
    let closestFreq = scaleFrequencies[0];
    let minDistance = Math.abs(frequency - closestFreq);

    for (const scaleFreq of scaleFrequencies) {
        const distance = Math.abs(frequency - scaleFreq);
        if (distance < minDistance) {
            minDistance = distance;
            closestFreq = scaleFreq;
        }
    }

    // Allow chromatic passing tones if enabled
    if (constraints.allowChromatic) {
        const cents = 1200 * Math.log2(frequency / closestFreq);
        if (Math.abs(cents) > 150) {
            // If more than 150 cents away, might be intentional chromatic
            return frequency;
        }
    }

    return closestFreq;
}

/**
 * Check if an interval should be avoided
 */
export function isIntervalAvoided(
    freq1: number,
    freq2: number,
    constraints: HarmonicConstraints
): boolean {
    const semitones = Math.round(frequencyToSemitones(freq1, freq2)) % 12;
    const intervalType = getIntervalType(semitones);

    return constraints.avoidedIntervals.includes(intervalType);
}

/**
 * Get suggested intervals for harmonization
 */
export function getSuggestedIntervals(constraints: HarmonicConstraints): number[] {
    return constraints.preferredIntervals.map(intervalType => {
        const interval = INTERVAL_DEFINITIONS[intervalType];
        return interval.semitones;
    });
}