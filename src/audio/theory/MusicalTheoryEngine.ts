/**
 * Musical Theory Engine
 *
 * Core engine for musical theory integration. Provides pitch quantization,
 * harmonic constraint enforcement, chord progression, and scale modulation.
 */

import {
    MusicalScale,
    NoteName,
    ScaleType,
    ModalScale,
    MusicalTheoryConfig,
    QuantizedPitch,
    Chord,
    ChordDefinition,
    ChordProgression,
    MusicalContext,
    HarmonicConstraints,
    ScaleModulationRule,
    Note,
    HarmonicAnalysis
} from './types';

import {
    SCALE_DEFINITIONS,
    NOTE_FREQUENCIES,
    NOTE_NAMES,
    CHORD_DEFINITIONS,
    CHORD_PROGRESSIONS,
    calculateFrequency,
    generateScaleFrequencies,
    generateScaleNotes,
    getClosestNoteName
} from './ScaleDefinitions';

import {
    DEFAULT_HARMONIC_CONSTRAINTS,
    VOICE_LEADING_RULES,
    calculateDissonance,
    calculateHarmonicTension,
    validateVoiceLeading,
    applyHarmonicConstraints,
    getSuggestedIntervals
} from './HarmonicRules';

import { getLogger } from '../../logging';

const logger = getLogger('MusicalTheoryEngine');

export class MusicalTheoryEngine {
    private config: MusicalTheoryConfig;
    private currentScale: MusicalScale;
    private currentContext: MusicalContext;
    private harmonicConstraints: HarmonicConstraints;
    private scaleModulationRules: ScaleModulationRule[];

    constructor(config: MusicalTheoryConfig) {
        this.config = config;
        this.harmonicConstraints = {
            ...DEFAULT_HARMONIC_CONSTRAINTS,
            enforceScale: config.enforceHarmony,
            allowChromatic: config.allowChromaticPassing,
            maxDissonance: config.dissonanceThreshold
        };
        this.scaleModulationRules = [];

        // Initialize current scale
        this.currentScale = this.createScale(config.rootNote, config.scale);

        // Initialize musical context
        this.currentContext = {
            currentScale: this.currentScale,
            recentNotes: [],
            harmonicTension: 0,
            timeInProgression: 0
        };

        logger.info('initialization', `Musical Theory Engine created with ${config.rootNote} ${config.scale}`);
    }

    /**
     * Create a musical scale from root note and scale type
     */
    public createScale(root: NoteName, type: ScaleType | ModalScale): MusicalScale {
        const definition = SCALE_DEFINITIONS[type];
        const frequencies = generateScaleFrequencies(root, type);
        const notes = generateScaleNotes(root, type);

        return {
            root,
            type,
            definition,
            frequencies,
            notes
        };
    }

    /**
     * Constrain a frequency to the current scale
     */
    public constrainPitchToScale(frequency: number): number {
        if (!this.config.enabled || !this.config.enforceHarmony) {
            return frequency;
        }

        const quantized = this.quantizePitch(frequency);
        return quantized.quantized;
    }

    /**
     * Quantize a pitch to the nearest scale degree
     */
    public quantizePitch(frequency: number): QuantizedPitch {
        const scaleFreqs = this.currentScale.frequencies;
        let closestFreq = scaleFreqs[0];
        let closestIndex = 0;
        let minCents = Infinity;

        // Find closest scale frequency
        for (let i = 0; i < scaleFreqs.length; i++) {
            const scaleFreq = scaleFreqs[i];
            const cents = 1200 * Math.log2(frequency / scaleFreq);
            const absCents = Math.abs(cents);

            if (absCents < minCents) {
                minCents = absCents;
                closestFreq = scaleFreq;
                closestIndex = i;
            }
        }

        // Apply quantization strength
        const quantizationStrength = this.config.quantizationStrength;
        const quantizedFreq = frequency * Math.pow(closestFreq / frequency, quantizationStrength);

        const noteInfo = getClosestNoteName(quantizedFreq);

        return {
            original: frequency,
            quantized: quantizedFreq,
            noteName: noteInfo.note,
            cents: minCents,
            scaleIndex: closestIndex
        };
    }

    /**
     * Generate harmonic interval from root note
     */
    public generateHarmonicInterval(
        rootFrequency: number,
        intervalSemitones: number
    ): number {
        if (!this.config.enabled) {
            return calculateFrequency(rootFrequency, intervalSemitones);
        }

        const targetFrequency = calculateFrequency(rootFrequency, intervalSemitones);
        return this.constrainPitchToScale(targetFrequency);
    }

    /**
     * Generate chord from root frequency and chord quality
     */
    public generateChord(
        rootFrequency: number,
        chordDefinition: ChordDefinition
    ): Chord {
        const rootNote = getClosestNoteName(rootFrequency);
        const frequencies: number[] = [];
        const notes: NoteName[] = [];

        for (const interval of chordDefinition.intervals) {
            const freq = this.generateHarmonicInterval(rootFrequency, interval);
            const note = getClosestNoteName(freq);
            frequencies.push(freq);
            notes.push(note.note);
        }

        return {
            root: rootNote.note,
            rootFrequency,
            definition: chordDefinition,
            frequencies,
            notes
        };
    }

    /**
     * Generate chord progression
     */
    public generateChordProgression(
        rootFrequency: number,
        progressionName: string
    ): Chord[] {
        const progression = CHORD_PROGRESSIONS[progressionName];
        if (!progression) {
            logger.warn('chord-progression', `Unknown progression: ${progressionName}, using I-IV-V-I`);
            return this.generateChordProgression(rootFrequency, 'I-IV-V-I');
        }

        const chords: Chord[] = [];
        const scaleDegrees = [0, 2, 4, 5, 7, 9, 11]; // Major scale degrees

        for (let i = 0; i < progression.chords.length; i++) {
            const chordDef = progression.chords[i];
            const degreeOffset = scaleDegrees[i % scaleDegrees.length];
            const chordRoot = calculateFrequency(rootFrequency, degreeOffset);
            chords.push(this.generateChord(chordRoot, chordDef));
        }

        return chords;
    }

    /**
     * Harmonize a melody note with accompanying voices
     */
    public harmonizeMelody(
        melodyFrequency: number,
        numVoices: number = 3
    ): number[] {
        if (!this.config.enabled || numVoices < 1) {
            return [melodyFrequency];
        }

        const voices: number[] = [melodyFrequency];
        const suggestedIntervals = getSuggestedIntervals(this.harmonicConstraints);

        // Add harmony voices below melody
        for (let i = 0; i < numVoices - 1; i++) {
            const intervalIndex = i % suggestedIntervals.length;
            const interval = suggestedIntervals[intervalIndex];

            // Generate voice below by going down an octave then up by interval
            const harmonyFreq = melodyFrequency * 0.5 * Math.pow(2, interval / 12);
            const quantized = this.constrainPitchToScale(harmonyFreq);
            voices.push(quantized);
        }

        return voices;
    }

    /**
     * Validate harmonic content
     */
    public validateHarmony(frequencies: number[]): {
        valid: boolean;
        dissonance: number;
        tension: number;
        suggestions: string[];
    } {
        const dissonance = calculateDissonance(frequencies);
        const tension = calculateHarmonicTension(frequencies, frequencies[0]);
        const suggestions: string[] = [];

        let valid = true;

        if (dissonance > this.harmonicConstraints.maxDissonance) {
            valid = false;
            suggestions.push(`High dissonance: ${dissonance.toFixed(2)} > ${this.harmonicConstraints.maxDissonance}`);
        }

        // Check if frequencies are in scale
        if (this.harmonicConstraints.enforceScale) {
            for (const freq of frequencies) {
                const quantized = this.quantizePitch(freq);
                if (Math.abs(quantized.cents) > 50) {
                    valid = false;
                    suggestions.push(`Frequency ${freq.toFixed(2)}Hz is ${quantized.cents.toFixed(0)} cents from scale`);
                }
            }
        }

        return { valid, dissonance, tension, suggestions };
    }

    /**
     * Update musical context based on recent events
     */
    public updateContext(recentFrequencies: number[]): void {
        this.currentContext.recentNotes = recentFrequencies.slice(-10);

        if (recentFrequencies.length > 0) {
            const tension = calculateHarmonicTension(
                recentFrequencies,
                this.currentScale.frequencies[0]
            );
            this.currentContext.harmonicTension = tension;
        }

        this.currentContext.timeInProgression += 1;

        // Check for scale modulation
        if (this.config.dynamicScaleModulation) {
            this.checkScaleModulation();
        }
    }

    /**
     * Check if scale should be modulated based on context
     */
    private checkScaleModulation(): void {
        for (const rule of this.scaleModulationRules) {
            if (rule.condition(this.currentContext)) {
                const newRoot = rule.targetRoot || this.config.rootNote;
                this.currentScale = this.createScale(newRoot, rule.targetScale);
                this.currentContext.currentScale = this.currentScale;
                logger.info('scale-modulation', `Scale modulated to ${newRoot} ${rule.targetScale}`);
                break;
            }
        }
    }

    /**
     * Add scale modulation rule
     */
    public addScaleModulationRule(rule: ScaleModulationRule): void {
        this.scaleModulationRules.push(rule);
        logger.debug('scale-modulation', `Added modulation rule: ${rule.name}`);
    }

    /**
     * Get current scale
     */
    public getCurrentScale(): MusicalScale {
        return this.currentScale;
    }

    /**
     * Set current scale
     */
    public setScale(root: NoteName, type: ScaleType | ModalScale): void {
        this.currentScale = this.createScale(root, type);
        this.currentContext.currentScale = this.currentScale;
        this.config.rootNote = root;
        this.config.scale = type;
        logger.info('scale-change', `Scale changed to ${root} ${type}`);
    }

    /**
     * Get current musical context
     */
    public getContext(): MusicalContext {
        return this.currentContext;
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<MusicalTheoryConfig>): void {
        this.config = { ...this.config, ...config };

        if (config.rootNote || config.scale) {
            this.currentScale = this.createScale(
                this.config.rootNote,
                this.config.scale
            );
            this.currentContext.currentScale = this.currentScale;
        }

        if (config.enforceHarmony !== undefined ||
            config.allowChromaticPassing !== undefined ||
            config.dissonanceThreshold !== undefined) {
            this.harmonicConstraints = {
                ...this.harmonicConstraints,
                enforceScale: this.config.enforceHarmony,
                allowChromatic: this.config.allowChromaticPassing,
                maxDissonance: this.config.dissonanceThreshold
            };
        }

        logger.debug('config-update', 'Configuration updated');
    }

    /**
     * Analyze harmonic content of frequencies
     */
    public analyzeHarmony(frequencies: number[]): HarmonicAnalysis {
        if (frequencies.length === 0) {
            return {
                fundamentalFrequency: 0,
                harmonics: [],
                inharmonicity: 0,
                spectralCentroid: 0,
                dissonanceLevel: 0
            };
        }

        const fundamental = frequencies[0];
        const harmonics: number[] = [];

        // Detect harmonic series
        for (let i = 1; i <= 8; i++) {
            const expectedHarmonic = fundamental * i;
            const closest = frequencies.reduce((prev, curr) =>
                Math.abs(curr - expectedHarmonic) < Math.abs(prev - expectedHarmonic) ? curr : prev
            );

            if (Math.abs(closest - expectedHarmonic) < expectedHarmonic * 0.1) {
                harmonics.push(closest);
            }
        }

        // Calculate inharmonicity (deviation from perfect harmonic series)
        let inharmonicity = 0;
        for (let i = 0; i < harmonics.length; i++) {
            const expected = fundamental * (i + 2);
            const actual = harmonics[i];
            inharmonicity += Math.abs(actual - expected) / expected;
        }
        inharmonicity = inharmonicity / (harmonics.length || 1);

        // Calculate spectral centroid (brightness)
        const totalEnergy = frequencies.reduce((sum, f) => sum + f, 0);
        const spectralCentroid = totalEnergy / frequencies.length;

        // Calculate dissonance
        const dissonanceLevel = calculateDissonance(frequencies);

        return {
            fundamentalFrequency: fundamental,
            harmonics,
            inharmonicity,
            spectralCentroid,
            dissonanceLevel
        };
    }

    /**
     * Get scale degree for a frequency
     */
    public getScaleDegree(frequency: number): number {
        const quantized = this.quantizePitch(frequency);
        return quantized.scaleIndex;
    }

    /**
     * Get note object from frequency
     */
    public frequencyToNote(frequency: number): Note {
        const noteInfo = getClosestNoteName(frequency);
        const midiNote = 69 + 12 * Math.log2(frequency / 440);

        return {
            frequency,
            name: noteInfo.note,
            octave: noteInfo.octave,
            midiNote: Math.round(midiNote)
        };
    }

    /**
     * Convert MIDI note number to frequency
     */
    public midiToFrequency(midiNote: number): number {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    /**
     * Get configuration
     */
    public getConfig(): MusicalTheoryConfig {
        return { ...this.config };
    }

    /**
     * Reset to default state
     */
    public reset(): void {
        this.currentScale = this.createScale(this.config.rootNote, this.config.scale);
        this.currentContext = {
            currentScale: this.currentScale,
            recentNotes: [],
            harmonicTension: 0,
            timeInProgression: 0
        };
        logger.info('reset', 'Musical Theory Engine reset');
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.scaleModulationRules = [];
        this.currentContext.recentNotes = [];
        logger.info('dispose', 'Musical Theory Engine disposed');
    }
}