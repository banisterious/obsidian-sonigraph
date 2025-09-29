/**
 * Musical Theory Module
 *
 * Export all musical theory components for use throughout the audio system.
 */

// Core engine
export { MusicalTheoryEngine } from './MusicalTheoryEngine';

// Type definitions
export type {
    NoteName,
    ScaleType,
    ModalScale,
    IntervalType,
    ChordQuality,
    ScaleDefinition,
    MusicalScale,
    Interval,
    ChordDefinition,
    Chord,
    ChordProgression,
    HarmonicFunction,
    VoiceLeadingRule,
    HarmonicConstraints,
    QuantizedPitch,
    MusicalTheoryConfig,
    ScaleModulationRule,
    MusicalContext,
    Note,
    HarmonicAnalysis
} from './types';

// Scale and chord definitions
export {
    NOTE_FREQUENCIES,
    NOTE_NAMES,
    SCALE_DEFINITIONS,
    INTERVAL_DEFINITIONS,
    CHORD_DEFINITIONS,
    CHORD_PROGRESSIONS,
    calculateFrequency,
    getNoteNameFromIndex,
    getSemitoneIndexFromNoteName,
    getFrequencyForNote,
    getClosestNoteName,
    generateScaleFrequencies,
    generateScaleNotes
} from './ScaleDefinitions';

// Harmonic rules
export {
    DEFAULT_HARMONIC_CONSTRAINTS,
    CONSONANCE_RATINGS,
    VOICE_LEADING_RULES,
    calculateDissonance,
    calculateHarmonicTension,
    validateVoiceLeading,
    getHarmonicFunction,
    suggestNextChord,
    applyHarmonicConstraints,
    isIntervalAvoided,
    getSuggestedIntervals
} from './HarmonicRules';