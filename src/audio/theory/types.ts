/**
 * Type definitions for musical theory system
 *
 * Provides types for scales, modes, intervals, chords, and harmonic principles
 * used throughout the musical theory integration.
 */

/**
 * Musical note names (12-tone equal temperament)
 */
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

/**
 * Scale types supported by the theory engine
 */
export type ScaleType =
    | 'major'
    | 'minor'
    | 'harmonic-minor'
    | 'melodic-minor'
    | 'pentatonic-major'
    | 'pentatonic-minor'
    | 'blues'
    | 'chromatic'
    | 'whole-tone'
    | 'diminished'
    | 'custom';

/**
 * Modal scales (church modes)
 */
export type ModalScale =
    | 'ionian'      // Major scale
    | 'dorian'
    | 'phrygian'
    | 'lydian'
    | 'mixolydian'
    | 'aeolian'     // Natural minor
    | 'locrian';

/**
 * Musical interval types
 */
export type IntervalType =
    | 'unison'
    | 'minor-second'
    | 'major-second'
    | 'minor-third'
    | 'major-third'
    | 'perfect-fourth'
    | 'tritone'
    | 'perfect-fifth'
    | 'minor-sixth'
    | 'major-sixth'
    | 'minor-seventh'
    | 'major-seventh'
    | 'octave';

/**
 * Chord quality types
 */
export type ChordQuality =
    | 'major'
    | 'minor'
    | 'diminished'
    | 'augmented'
    | 'dominant-seventh'
    | 'major-seventh'
    | 'minor-seventh'
    | 'half-diminished'
    | 'suspended-fourth'
    | 'suspended-second';

/**
 * Scale definition with semitone intervals from root
 */
export interface ScaleDefinition {
    name: string;
    type: ScaleType | ModalScale;
    intervals: number[];           // Semitones from root [0, 2, 4, 5, 7, 9, 11] for major
    description?: string;
    characteristic?: string;       // Musical character description
}

/**
 * Complete musical scale with root note
 */
export interface MusicalScale {
    root: NoteName;
    type: ScaleType | ModalScale;
    definition: ScaleDefinition;
    frequencies: number[];         // Actual frequencies for this scale
    notes: NoteName[];            // Note names in scale
}

/**
 * Musical interval definition
 */
export interface Interval {
    name: string;
    type: IntervalType;
    semitones: number;
    frequency_ratio: number;      // Just intonation ratio (for reference)
}

/**
 * Chord definition
 */
export interface ChordDefinition {
    name: string;
    quality: ChordQuality;
    intervals: number[];          // Semitones from root [0, 4, 7] for major triad
    tensions?: number[];          // Optional extensions [9, 11, 13]
}

/**
 * Chord instance with actual frequencies
 */
export interface Chord {
    root: NoteName;
    rootFrequency: number;
    definition: ChordDefinition;
    frequencies: number[];        // All chord tone frequencies
    notes: NoteName[];           // All chord tone names
}

/**
 * Chord progression definition
 */
export interface ChordProgression {
    name: string;
    chords: ChordDefinition[];
    romanNumerals?: string[];    // Roman numeral analysis [I, IV, V, I]
    description?: string;
}

/**
 * Harmonic function types
 */
export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant' | 'predominant';

/**
 * Voice leading rule
 */
export interface VoiceLeadingRule {
    name: string;
    type: 'parallel-motion' | 'contrary-motion' | 'oblique-motion' | 'voice-crossing';
    severity: 'error' | 'warning' | 'suggestion';
    check: (voices: number[][]) => boolean;
    description: string;
}

/**
 * Harmonic constraint options
 */
export interface HarmonicConstraints {
    enforceScale: boolean;                  // Constrain all pitches to scale
    allowChromatic: boolean;               // Allow chromatic passing tones
    maxDissonance: number;                 // 0-1, maximum dissonance level
    voiceLeadingRules: VoiceLeadingRule[]; // Active voice leading rules
    preferredIntervals: IntervalType[];    // Preferred intervals for harmony
    avoidedIntervals: IntervalType[];      // Intervals to avoid
}

/**
 * Pitch quantization result
 */
export interface QuantizedPitch {
    original: number;              // Original frequency
    quantized: number;             // Quantized frequency
    noteName: NoteName;           // Closest note name
    cents: number;                // Deviation in cents
    scaleIndex: number;           // Index in current scale
}

/**
 * Musical theory engine configuration
 */
export interface MusicalTheoryConfig {
    enabled: boolean;
    scale: ScaleType | ModalScale;
    rootNote: NoteName;
    enforceHarmony: boolean;
    allowChromaticPassing: boolean;
    dissonanceThreshold: number;           // 0-1
    quantizationStrength: number;          // 0-1, how strongly to quantize
    preferredChordProgression?: string;    // Name of preferred progression
    dynamicScaleModulation: boolean;       // Change scale based on vault state
}

/**
 * Scale modulation rule
 */
export interface ScaleModulationRule {
    name: string;
    condition: (vaultState: Record<string, unknown>) => boolean;
    targetScale: ScaleType | ModalScale;
    targetRoot?: NoteName;
    description: string;
}

/**
 * Musical context for decision making
 */
export interface MusicalContext {
    currentScale: MusicalScale;
    currentChord?: Chord;
    recentNotes: number[];               // Recently played frequencies
    harmonicTension: number;             // Current tension level 0-1
    timeInProgression: number;           // Position in chord progression
}

/**
 * Note in frequency space
 */
export interface Note {
    frequency: number;
    name: NoteName;
    octave: number;
    midiNote: number;
}

/**
 * Harmonic analysis result
 */
export interface HarmonicAnalysis {
    fundamentalFrequency: number;
    harmonics: number[];
    inharmonicity: number;            // 0-1, deviation from perfect harmonics
    spectralCentroid: number;
    dissonanceLevel: number;          // 0-1
}