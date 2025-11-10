/**
 * NoteCentricMapper
 *
 * Generates rich musical content from a single note's prose structure.
 * Unlike DepthBasedMapper which requires a graph, this mapper creates
 * compelling audio even for isolated notes with zero connections.
 *
 * Core Philosophy:
 * - Center note = Rich musical composition (melody, harmony, rhythm)
 * - Connected nodes = Optional embellishments and responses
 * - Prose structure determines musical DNA
 */

import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import type { SonigraphSettings } from '../../utils/constants';
import type { LocalSoundscapeData, LocalSoundscapeNode } from '../../graph/LocalSoundscapeExtractor';
import { ProseAnalysis, ProseAnalyzer } from '../../utils/ProseAnalyzer';
import { getLogger } from '../../logging';

const logger = getLogger('NoteCentricMapper');

/**
 * Musical phrase generated from prose
 */
export interface MusicalPhrase {
	// Melodic contour (array of relative pitch offsets in semitones)
	melody: number[];

	// Harmonic progression (chord root notes in semitones)
	harmony: number[];

	// Rhythmic pattern (note durations in beats)
	rhythm: number[];

	// Velocity curve (0-1 for each note)
	velocities: number[];

	// Tempo (BPM)
	tempo: number;

	// Total duration in beats
	totalBeats: number;
}

/**
 * Musical motif - A short melodic/rhythmic pattern that can be developed
 */
export interface MusicalMotif {
	// 3-5 note melodic pattern (relative intervals)
	pitchPattern: number[];

	// Rhythmic pattern (note durations in beats)
	rhythmPattern: number[];

	// Motif identity
	id: string;

	// Which phrase index it came from
	sourcePhrase: number;
}

/**
 * Musical memory for motivic development
 */
export interface MusicalMemory {
	// Primary motifs extracted from composition
	primaryMotifs: MusicalMotif[];

	// How many times each motif has been used
	usageCount: Map<string, number>;

	// Last transformation applied to each motif
	lastTransform: Map<string, string>;

	// Current phrase index
	currentPhrase: number;
}

/**
 * Note-centric mapping result
 */
export interface NoteCentricMapping {
	// Center note's musical phrase
	centerPhrase: MusicalPhrase;

	// Optional embellishments from connected nodes
	embellishments: {
		nodeId: string;
		depth: number;
		type: 'harmonic-response' | 'rhythmic-counterpoint' | 'ambient-texture';
		phrase: MusicalPhrase;
	}[];

	// Prose analysis that generated this
	proseAnalysis: ProseAnalysis;

	// Musical memory for this composition (optional - used for extended compositions)
	memory?: MusicalMemory;
}

/**
 * NoteCentricMapper class
 */
export class NoteCentricMapper {
	private app: App;
	private settings: SonigraphSettings;

	constructor(app: App, settings: SonigraphSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Map a local soundscape to note-centric music
	 */
	public async map(data: LocalSoundscapeData): Promise<NoteCentricMapping | null> {
		logger.info('mapping-start', 'Generating note-centric music', {
			centerNode: data.centerNode.basename,
			connectedNodes: data.stats.totalNodes - 1
		});

		// Step 1: Analyze center note's prose
		const proseAnalysis = await this.analyzeCenterNote(data.centerNode);
		if (!proseAnalysis) {
			logger.warn('mapping-failed', 'Could not analyze center note');
			return null;
		}

		// Step 2: Generate musical phrase from prose
		const centerPhrase = this.generatePhraseFromProse(proseAnalysis);

		// Step 3: Extract motifs from center phrase for future musical development
		const motifs = this.extractMotifs(centerPhrase.melody, centerPhrase.rhythm);

		// Initialize musical memory with extracted motifs
		const memory: MusicalMemory = {
			primaryMotifs: motifs,
			usageCount: new Map(),
			lastTransform: new Map(),
			currentPhrase: 0
		};

		// Step 4: Generate embellishments from connected nodes (optional)
		const embellishments = this.generateEmbellishments(data, proseAnalysis, centerPhrase);

		logger.info('mapping-complete', 'Note-centric mapping complete', {
			phraseLength: centerPhrase.melody.length,
			tempo: centerPhrase.tempo,
			embellishments: embellishments.length,
			motifsExtracted: motifs.length
		});

		return {
			centerPhrase,
			embellishments,
			proseAnalysis,
			memory
		};
	}

	/**
	 * Analyze center note's prose structure
	 */
	private async analyzeCenterNote(node: LocalSoundscapeNode): Promise<ProseAnalysis | null> {
		try {
			logger.debug('analyze-start', 'Starting prose analysis', {
				path: node.path,
				basename: node.basename
			});

			const file = this.app.vault.getAbstractFileByPath(node.path);
			if (!(file instanceof TFile)) {
				logger.warn('file-not-found', `File not found: ${node.path}`);
				return null;
			}

			logger.debug('file-found', 'File found, reading content', {
				path: file.path,
				name: file.name
			});

			const content = await this.app.vault.cachedRead(file);

			logger.debug('content-read', 'Content read successfully', {
				length: content.length,
				firstChars: content.substring(0, 100)
			});

			const analysis = ProseAnalyzer.analyze(content);

			logger.info('prose-analysis', 'Analyzed center note prose', {
				contentType: analysis.contentType,
				complexity: analysis.overallComplexity.toFixed(2),
				expressiveness: analysis.musicalExpressiveness.toFixed(2),
				wordCount: node.wordCount
			});

			return analysis;
		} catch (error) {
			logger.error('prose-analysis-error', 'Failed to analyze prose', error as Error);
			return null;
		}
	}

	/**
	 * Generate musical phrase from prose analysis
	 */
	private generatePhraseFromProse(prose: ProseAnalysis): MusicalPhrase {
		// Determine phrase length based on content density (16-48 notes for richer compositions)
		const phraseLength = Math.round(16 + prose.density.contentDensity * 32);

		// Determine tempo based on content type
		const tempo = this.getTempoForContentType(prose.contentType, prose.linguistic.avgSentenceLength);

		// Generate melodic contour from prose structure
		const melody = this.generateMelodyFromProse(prose, phraseLength);

		// Generate harmonic progression
		const harmony = this.generateHarmonyFromProse(prose, phraseLength);

		// Generate rhythmic pattern
		const rhythm = this.generateRhythmFromProse(prose, phraseLength);

		// Generate velocity curve
		const velocities = this.generateVelocityCurve(prose, phraseLength);

		// Calculate total duration
		const totalBeats = rhythm.reduce((sum, duration) => sum + duration, 0);

		return {
			melody,
			harmony,
			rhythm,
			velocities,
			tempo,
			totalBeats
		};
	}

	/**
	 * Get tempo based on content type and sentence length
	 */
	private getTempoForContentType(contentType: string, avgSentenceLength: number): number {
		// Base tempo by content type
		const baseTempo: Record<string, number> = {
			'meeting-notes': 120,    // Quick, businesslike
			'research': 80,          // Slow, contemplative
			'creative': 90,          // Moderate, flowing
			'technical': 100,        // Steady, methodical
			'journal': 85,           // Personal, reflective
			'outline': 110,          // Structured, organized
			'mixed': 95              // Balanced
		};

		const base = baseTempo[contentType] || 95;

		// Adjust based on sentence length (longer sentences = slower tempo)
		const lengthFactor = Math.max(0.7, Math.min(1.3, 15 / avgSentenceLength));

		return Math.round(base * lengthFactor);
	}

	/**
	 * Generate melodic contour from prose with phrase-based structure
	 */
	private generateMelodyFromProse(prose: ProseAnalysis, length: number): number[] {
		const melody: number[] = [];

		// Determine melodic range based on complexity (1-3 octaves)
		const range = 12 + Math.round(prose.overallComplexity * 24); // 12-36 semitones

		// Break melody into musical phrases (4-8 notes each)
		const phraseSize = Math.round(4 + prose.structure.nestingDepth * 2);
		const numPhrases = Math.ceil(length / phraseSize);

		// Seed random generator for reproducibility with prose content
		let seed = prose.linguistic.avgWordLength * 1000 + prose.density.contentDensity * 100;

		// Generate phrases with distinct musical direction
		let currentPitch = 0;

		for (let phraseIdx = 0; phraseIdx < numPhrases; phraseIdx++) {
			const phrasePosition = phraseIdx / numPhrases;
			const notesInPhrase = Math.min(phraseSize, length - phraseIdx * phraseSize);

			// Determine phrase contour (arc shape)
			const contourType = this.getPhraseContour(prose, phraseIdx, seed);

			// Phrase starting pitch - move to new register between phrases
			if (phraseIdx > 0) {
				// Leap to new starting pitch (3rd, 4th, 5th, or octave)
				const leapOptions = [3, 4, 5, 7, 12, -3, -4, -5, -7];
				const leapIndex = Math.floor((seed + phraseIdx * 137) % leapOptions.length);
				currentPitch += leapOptions[leapIndex];
				currentPitch = Math.max(-range/2, Math.min(range/2, currentPitch));
			}

			const phraseStartPitch = currentPitch;

			// Generate notes within phrase with more freedom
			for (let i = 0; i < notesInPhrase; i++) {
				const posInPhrase = i / (notesInPhrase - 1 || 1);

				// Apply contour shape with more organic variation
				let pitch = phraseStartPitch;

				switch (contourType) {
					case 'ascending':
						// Mix stepwise and leaps - more natural ascent
						const ascendStep = ((seed + i * 7) % 5) + 1; // 1-5 semitones
						pitch += ascendStep * i;
						// Occasional rests on plateau
						if ((seed + i) % 4 === 0) pitch -= ascendStep;
						break;
					case 'descending':
						// Mix stepwise and leaps - more natural descent
						const descendStep = ((seed + i * 7) % 5) + 1;
						pitch -= descendStep * i;
						if ((seed + i) % 4 === 0) pitch += descendStep;
						break;
					case 'arch':
						// More expressive arch with varied apex
						const archHeight = 6 + ((seed % 5) * 2); // Variable height
						pitch += Math.sin(posInPhrase * Math.PI) * archHeight;
						// Add wobble to the curve
						pitch += Math.sin(posInPhrase * Math.PI * 3) * 2;
						break;
					case 'valley':
						// More expressive valley
						const valleyDepth = 6 + ((seed % 5) * 2);
						pitch -= Math.sin(posInPhrase * Math.PI) * valleyDepth;
						pitch += Math.sin(posInPhrase * Math.PI * 3) * 2;
						break;
					case 'oscillating':
						// Less predictable oscillation
						const oscSize = 2 + ((seed + i) % 4);
						pitch += (i % 2 === 0 ? oscSize : -oscSize) * (1 + i * 0.2);
						break;
					case 'static':
						// Repeating with more varied embellishments
						const embellish = ((seed + i * 13) % 7) - 3; // -3 to +3
						pitch += embellish;
						break;
				}

				// Add expressive variations based on prose features
				if (prose.linguistic.vocabularyDiversity > 0.5) {
					// More diverse = more chromatic color
					const chromaticism = ((seed * (i + 1) * 17) % 5) - 2; // -2 to +2
					pitch += chromaticism;
				}

				// Add "breathing" - occasional larger leaps for interest
				if (i > 0 && (seed + i * 23) % 7 === 0) {
					const breathLeap = ((seed + i) % 2 === 0 ? 5 : -5); // Perfect 4th leap
					pitch += breathLeap;
				}

				// Constrain to range
				pitch = Math.max(-range/2, Math.min(range/2, pitch));

				// Allow leaps but add tendency tones AFTER large leaps
				if (melody.length > 0) {
					const interval = Math.abs(pitch - melody[melody.length - 1]);

					// Very large leaps (> octave) are rare but allowed
					if (interval > 12) {
						// Reduce extremely large leaps slightly
						const reduction = (interval - 12) * 0.3;
						pitch = pitch > melody[melody.length - 1]
							? pitch - reduction
							: pitch + reduction;
					}
				}

				currentPitch = pitch;
				melody.push(Math.round(pitch));

				// Update seed for variation
				seed = (seed * 1.1 + i * 7) % 10000;
			}

			// Add cadential motion at phrase end
			if (phraseIdx < numPhrases - 1 && melody.length > 0) {
				// Tendency toward tonic or dominant before new phrase
				const cadenceTarget = (phraseIdx % 2 === 0) ? 0 : 7;
				const lastNote = melody[melody.length - 1];
				if (Math.abs(lastNote - cadenceTarget) > 2) {
					melody[melody.length - 1] = Math.round((lastNote + cadenceTarget) / 2);
				}
			}
		}

		return melody.slice(0, length);
	}

	/**
	 * Determine phrase contour type based on prose features
	 */
	private getPhraseContour(prose: ProseAnalysis, phraseIndex: number, seed: number): string {
		const contours = ['ascending', 'descending', 'arch', 'valley', 'oscillating', 'static'];

		// Content type influences contour preferences
		const preferences: Record<string, string[]> = {
			'meeting-notes': ['ascending', 'arch', 'static'],      // Forward motion
			'research': ['arch', 'valley', 'descending'],          // Contemplative arcs
			'creative': ['ascending', 'arch', 'oscillating'],      // Dynamic shapes
			'technical': ['static', 'ascending', 'descending'],    // Methodical
			'journal': ['valley', 'arch', 'descending'],           // Reflective
			'outline': ['ascending', 'static', 'arch'],            // Organized
			'mixed': contours
		};

		const preferred = preferences[prose.contentType] || contours;
		const index = (phraseIndex + Math.floor(seed)) % preferred.length;
		return preferred[index];
	}

	/**
	 * Generate harmonic progression from prose with variety and color
	 */
	private generateHarmonyFromProse(prose: ProseAnalysis, length: number): number[] {
		const harmony: number[] = [];

		// Determine chord change frequency based on structure (more complex = more changes)
		const chordChanges = Math.max(3, Math.round(4 + prose.structure.nestingDepth * 3));
		const notesPerChord = Math.ceil(length / chordChanges);

		// Base progressions by content type with more variety
		const baseProgressions: Record<string, number[][]> = {
			'meeting-notes': [
				[0, 5, 7, 5],         // I-IV-V-IV
				[0, 7, 5, 0],         // I-V-IV-I
				[0, 2, 5, 7]          // I-ii-IV-V
			],
			'research': [
				[0, 3, 5, 7],         // I-iii-IV-V
				[0, 5, -3, 0],        // I-IV-vi-I (minor sixth)
				[0, 2, 7, 0]          // I-ii-V-I
			],
			'creative': [
				[0, 4, 7, 3],         // I-iii-V-iii
				[0, -3, 5, 7],        // I-vi-IV-V
				[0, 2, 4, 7]          // I-ii-iii-V
			],
			'technical': [
				[0, 7, 5, 0],         // I-V-IV-I
				[0, 5, 0, 7],         // I-IV-I-V
				[0, 0, 5, 7]          // I-I-IV-V
			],
			'journal': [
				[0, -3, 5, 0],        // I-vi-IV-I
				[0, 3, -3, 0],        // I-iii-vi-I
				[0, 5, 3, 7]          // I-IV-iii-V
			],
			'outline': [
				[0, 5, 7, 0],         // I-IV-V-I
				[0, 2, 5, 0],         // I-ii-IV-I
				[0, 5, 2, 7]          // I-IV-ii-V
			],
			'mixed': [
				[0, 5, 7, 0],         // I-IV-V-I
				[0, 2, 7, 5],         // I-ii-V-IV
				[0, -3, 5, 7]         // I-vi-IV-V
			]
		};

		const progressionChoices = baseProgressions[prose.contentType] || baseProgressions['mixed'];

		// Select progression based on complexity
		const progressionIndex = Math.min(
			Math.floor(prose.overallComplexity * progressionChoices.length),
			progressionChoices.length - 1
		);
		const baseProgression = progressionChoices[progressionIndex];

		// Build harmonic structure with voice leading and stronger cadences
		const fullProgression: number[] = [];
		const repetitions = Math.ceil(chordChanges / baseProgression.length);

		// Seed for harmonic variation
		let harmonicSeed = Math.floor(prose.musicalExpressiveness * 97);

		for (let rep = 0; rep < repetitions; rep++) {
			for (let j = 0; j < baseProgression.length; j++) {
				let chord = baseProgression[j];

				// Add EXTREMELY ADVENTUROUS harmonic color (VERY low threshold)
				if (prose.musicalExpressiveness > 0.1) { // DRASTICALLY LOWERED from 0.3
					// More frequent color with more options
					const colorOptions = [
						chord,                                    // Original
						chord + 2,                                // Add 9th
						chord === 7 ? 10 : chord,                // V7 becomes dominant 7th
						chord === 5 ? 9 : chord,                 // IV becomes secondary dominant
						chord === 0 ? -3 : chord,                // Modal interchange: I becomes bVI (parallel minor)
						chord === 5 ? 8 : chord,                 // IV becomes #IVdim (lydian color)
						chord - 1,                                // Sus4 tendency (chromatic lower neighbor)
						chord + 1,                                // Sus2 tendency (chromatic upper neighbor)
						chord + 6,                                // Tritone substitution
						chord === 0 ? 3 : chord                  // Modal interchange: I becomes III (phrygian)
					];

					// Use seed for reproducible variation - MORE VARIATION
					const colorIdx = (harmonicSeed + j * 17 + rep * 7) % colorOptions.length;
					chord = colorOptions[colorIdx];
				}

				// Add MUCH MORE CHROMATIC voice leading
				if (fullProgression.length > 0) {
					const prevChord = fullProgression[fullProgression.length - 1];
					const interval = Math.abs(chord - prevChord);

					// Add chromatic passing chords VERY frequently (threshold lowered to 2)
					if (interval > 2 && interval < 12) { // Was > 3
						// Choose passing chord that creates CHROMATIC bass motion
						let passingChord: number;

						// ULTRA FREQUENT chromatic approaches (was % 2, now ALWAYS if expressiveness > 0.2)
						if ((harmonicSeed + j) % 2 === 0 && prose.musicalExpressiveness > 0.2) { // DRASTICALLY lowered from 0.4
							// Chromatic approach from below or above
							if (prevChord < chord) {
								passingChord = chord - 1; // Chromatic approach from below
							} else {
								passingChord = chord + 1; // Chromatic approach from above
							}
						} else {
							// Diatonic passing chord (original behavior)
							if (prevChord < chord) {
								passingChord = prevChord + Math.floor(interval / 2);
							} else {
								passingChord = prevChord - Math.floor(interval / 2);
							}
						}
						fullProgression.push(passingChord);
					}

					// EXTREMELY FREQUENT TRITONE substitutions (was % 7, now % 5)
					if ((harmonicSeed + j * 23) % 5 === 0 && prose.musicalExpressiveness > 0.3) { // MUCH lower: was 0.5
						// Add tritone substitute (diminished 5th away)
						const tritoneSubstitute = chord + 6;
						fullProgression.push(tritoneSubstitute);
					}

					// MUCH MORE augmented sixth chords for EXTREME spice (was % 9, now % 6)
					if ((harmonicSeed + j * 19) % 6 === 0 && prose.musicalExpressiveness > 0.4) { // Lower from 0.6
						const augSixth = chord - 1; // German sixth flavor
						fullProgression.push(augSixth);
					}
				}

				harmonicSeed = (harmonicSeed * 1.05 + j * 11) % 1000;

				// Strengthen cadences at phrase ends
				const isPhraseFinal = (j === baseProgression.length - 1);
				if (isPhraseFinal && rep < repetitions - 1) {
					// Not final cadence - use half cadence (end on V)
					if (chord === 0) {
						// If we were going to tonic, stop on dominant instead
						chord = 7;
					}
				} else if (isPhraseFinal && rep === repetitions - 1) {
					// Final cadence - strong resolution to tonic
					if (chord !== 0) {
						// Ensure we end on tonic
						fullProgression.push(7);  // Add dominant
						chord = 0;  // Resolve to tonic
					}
				}

				fullProgression.push(chord);
			}
		}

		// Fill harmony array with varied note durations per chord
		let chordIdx = 0;
		for (let i = 0; i < length; i++) {
			// More complex prose = more frequent chord changes
			const chordChangeFactor = prose.overallComplexity > 0.5 ? 0.8 : 1.0;
			const adjustedNotesPerChord = Math.max(1, Math.floor(notesPerChord * chordChangeFactor));

			chordIdx = Math.floor(i / adjustedNotesPerChord) % fullProgression.length;
			harmony.push(fullProgression[chordIdx]);
		}

		return harmony;
	}

	/**
	 * Generate rhythmic pattern from prose using motifs
	 */
	private generateRhythmFromProse(prose: ProseAnalysis, length: number): number[] {
		const rhythm: number[] = [];

		// Define rhythmic motifs (patterns that repeat with variation)
		const motifs: Record<string, number[]> = {
			'flowing': [2.0, 1.0, 1.0, 2.0],              // Long-short-short-long
			'steady': [1.5, 1.5, 1.5, 1.5],               // Even pulse
			'syncopated': [1.0, 0.5, 1.5, 1.0, 2.0],      // Syncopation
			'contemplative': [3.0, 1.0, 2.0, 2.0],        // Sustained with movement
			'energetic': [0.5, 0.5, 1.0, 0.5, 0.5, 1.0],  // Quick pulses
			'sparse': [3.0, 2.0, 3.0, 2.0],               // Space between notes
			'building': [2.0, 1.5, 1.0, 0.5]              // Accelerating
		};

		// Select motif based on content type and prose features
		let selectedMotif: number[];

		if (prose.density.contentDensity > 0.7) {
			selectedMotif = motifs['energetic'];
		} else if (prose.density.contentDensity < 0.3) {
			selectedMotif = motifs['sparse'];
		} else if (prose.linguistic.punctuationDensity > 20) {
			selectedMotif = motifs['syncopated'];
		} else if (prose.structure.complexityScore > 0.6) {
			selectedMotif = motifs['building'];
		} else if (prose.contentType === 'research' || prose.contentType === 'journal') {
			selectedMotif = motifs['contemplative'];
		} else if (prose.contentType === 'creative') {
			selectedMotif = motifs['flowing'];
		} else {
			selectedMotif = motifs['steady'];
		}

		// Apply motif with evolution and transformation
		let motifIndex = 0;
		const motifLength = selectedMotif.length;
		let currentMotif = [...selectedMotif]; // Make mutable copy

		// Seed for reproducible variation
		let seed = Math.floor(prose.linguistic.avgSentenceLength * 10 + prose.density.listDensity * 100);

		// Track motif evolution
		let cycleCount = 0;

		for (let i = 0; i < length; i++) {
			// Get base duration from current evolved motif
			let duration = currentMotif[motifIndex % motifLength];

			// Add humanizing variation (±15% for more natural feel)
			const variation = ((seed + i * 17) % 30 - 15) / 100;
			duration *= (1 + variation);

			// Gradual evolution: occasionally transform the motif itself
			if ((i + 1) % (motifLength * 2) === 0) {
				cycleCount++;

				// Every 2 cycles, evolve the motif
				if (cycleCount % 2 === 0 && prose.overallComplexity > 0.4) {
					for (let m = 0; m < currentMotif.length; m++) {
						// Gradually stretch or compress motif values
						const evolution = ((seed + m * 19) % 3 - 1) * 0.15; // ±15%
						currentMotif[m] *= (1 + evolution);
						currentMotif[m] = Math.max(0.5, Math.min(4.0, currentMotif[m]));
					}
				}

				// Insert phrase break
				duration *= 1.3;
			}

			// Add micro-timing - slight swing feel for some content types
			if (prose.contentType === 'creative' && i % 2 === 1) {
				duration *= 1.1; // Slight delay on off-beats
			}

			// List-heavy content: shorter notes
			if (prose.density.listDensity > 0.4) {
				duration *= 0.85;
			}

			// Build toward phrase endings
			const progressThroughPhrase = (i % (motifLength * 4)) / (motifLength * 4);
			if (progressThroughPhrase > 0.75) {
				// Ritardando at phrase end
				duration *= 1 + (progressThroughPhrase - 0.75) * 0.4;
			}

			// Scale to reasonable range (0.5 - 4.5 beats)
			duration = Math.max(0.5, Math.min(4.5, duration));

			rhythm.push(duration);

			// Move to next position in motif
			motifIndex++;

			// Update seed for next iteration
			seed = (seed * 1.05 + i * 7) % 1000;
		}

		return rhythm;
	}

	/**
	 * Generate velocity curve with EXPANDED dynamics and phrase shaping
	 */
	private generateVelocityCurve(prose: ProseAnalysis, length: number): number[] {
		const velocities: number[] = [];

		// EXPANDED base velocity range (0.20 - 0.90 instead of 0.25 - 0.85)
		const baseVelocity = 0.20 + prose.musicalExpressiveness * 0.7;

		// Seed for consistent micro-variations
		let seed = Math.floor(prose.linguistic.avgWordLength * 50);

		for (let i = 0; i < length; i++) {
			const position = i / (length - 1 || 1);

			// Start with base
			let velocity = baseVelocity;

			// EXTREMELY DRAMATIC macro phrase shape - FORCE extreme ranges
			if (prose.overallComplexity > 0.5) {
				// ULTRA dramatic arc: whisper soft start (0.25), huge crescendo, then decrescendo
				const arcPosition = position * 1.5; // Shift peak earlier
				velocity *= 0.25 + Math.sin(Math.min(arcPosition, 1.0) * Math.PI) * 0.75; // WIDER: 0.25-1.0 range
			} else {
				// Even "gentle" arcs are now dramatic
				velocity *= 0.5 + Math.sin(position * Math.PI) * 0.5; // 0.5-1.0 range
			}

			// MUCH STRONGER phrase-level micro-dynamics
			const phraseLength = 6;
			const posInPhrase = (i % phraseLength) / phraseLength;

			// Each phrase has DRAMATIC crescendo-decrescendo
			const phraseDynamics = 0.75 + Math.sin(posInPhrase * Math.PI) * 0.35; // Much wider: ±0.35
			velocity *= phraseDynamics;

			// MUCH STRONGER accents on strong beats
			if (i % 4 === 0) {
				velocity *= 1.25; // MUCH louder downbeats (was 1.15)
			} else if (i % 2 === 0) {
				velocity *= 1.12; // Increased from 1.08
			}

			// Question-like rising at end with HUGE crescendo
			if (prose.linguistic.questionRatio > 0.2) {
				// Massive crescendo in last 30%
				if (position > 0.7) {
					velocity *= 0.6 + (position - 0.7) * 1.8; // Massive increase
				}
			}

			// Add larger natural micro-variations (±15% instead of ±10%)
			const microVariation = ((seed + i * 13) % 30 - 15) / 100;
			velocity *= (1 + microVariation);

			// Expressive content has EXTREME dynamic contrast
			if (prose.musicalExpressiveness > 0.6) {
				// Exaggerate dynamics MASSIVELY
				const deviation = velocity - baseVelocity;
				velocity = baseVelocity + (deviation * 2.0); // DOUBLED exaggeration (was 1.5)
			}

			// FORCE MANY MORE notes to extremes (true pp and ff) - MUCH MORE FREQUENT
			if ((seed + i) % 10 === 0) {
				// Every 10th note: force to pianissimo
				velocity = Math.min(velocity, 0.12);
			} else if ((seed + i) % 8 === 0) {
				// Every 8th note: force to fortissimo
				velocity = Math.max(velocity, 0.95);
			} else if ((seed + i) % 12 === 0) {
				// Every 12th note: force to mezzo-piano
				velocity = Math.min(velocity, 0.40);
			}

			// WIDER playable range (0.08 - 0.99 for even more extremes)
			velocity = Math.max(0.08, Math.min(0.99, velocity));

			velocities.push(velocity);

			// Update seed
			seed = (seed + i * 7) % 1000;
		}

		return velocities;
	}

	/**
	 * Generate embellishments from connected nodes
	 */
	private generateEmbellishments(
		data: LocalSoundscapeData,
		prose: ProseAnalysis,
		centerPhrase: MusicalPhrase
	): NoteCentricMapping['embellishments'] {
		const embellishments: NoteCentricMapping['embellishments'] = [];

		// Limit embellishments to avoid overcrowding
		const maxEmbellishments = 6;
		let count = 0;

		// Process depth 1 nodes as harmonic responses
		const depth1Nodes = data.nodesByDepth.get(1) || [];
		for (const node of depth1Nodes.slice(0, 3)) {
			if (count >= maxEmbellishments) break;

			embellishments.push({
				nodeId: node.path,
				depth: 1,
				type: 'harmonic-response',
				phrase: this.generateHarmonicResponse(centerPhrase, prose)
			});
			count++;
		}

		// Process depth 2 nodes as rhythmic counterpoint
		const depth2Nodes = data.nodesByDepth.get(2) || [];
		for (const node of depth2Nodes.slice(0, 2)) {
			if (count >= maxEmbellishments) break;

			embellishments.push({
				nodeId: node.path,
				depth: 2,
				type: 'rhythmic-counterpoint',
				phrase: this.generateRhythmicCounterpoint(centerPhrase, prose)
			});
			count++;
		}

		// Process depth 3+ nodes as ambient textures
		const depth3PlusNodes = [...(data.nodesByDepth.get(3) || []), ...(data.nodesByDepth.get(4) || []), ...(data.nodesByDepth.get(5) || [])];
		for (const node of depth3PlusNodes.slice(0, 1)) {
			if (count >= maxEmbellishments) break;

			embellishments.push({
				nodeId: node.path,
				depth: 3,
				type: 'ambient-texture',
				phrase: this.generateAmbientTexture(centerPhrase, prose)
			});
			count++;
		}

		return embellishments;
	}

	/**
	 * Generate harmonic response phrase - independent melodic answer
	 */
	private generateHarmonicResponse(centerPhrase: MusicalPhrase, prose: ProseAnalysis): MusicalPhrase {
		// Create a MORE independent melodic line that responds harmonically
		const length = Math.round(centerPhrase.melody.length * 0.7); // Shorter response
		const melody: number[] = [];

		// Use inverted contour as starting point, but add much more variation
		const centerAvg = centerPhrase.melody.reduce((a, b) => a + b, 0) / centerPhrase.melody.length;
		let seed = Math.floor(prose.linguistic.avgWordLength * 73);

		for (let i = 0; i < length; i++) {
			const centerPitch = centerPhrase.melody[Math.min(i, centerPhrase.melody.length - 1)];

			// Start with VERY loose inversion (only 20% influence - mostly independent!)
			const invertedPitch = centerAvg - (centerPitch - centerAvg);
			let harmonicPitch = invertedPitch * 0.2 + centerPitch * 0.2; // Was 0.5 each

			// Transpose up a third for harmonic support
			harmonicPitch += 4;

			// Add MUCH MORE melodic independence
			// 1. HUGE random variations (±8 semitones instead of ±5)
			const melodicFreedom = ((seed + i * 23) % 17) - 8; // -8 to +8
			harmonicPitch += melodicFreedom;

			// 2. Add STRONG melodic direction independent of center (MORE LIKELY)
			const directionSeed = (seed + i * 17) % 100;
			if (directionSeed < 40) { // INCREASED from 30
				// Ascending motion - STRONGER
				harmonicPitch += Math.floor(i * 0.8); // Was 0.5
			} else if (directionSeed < 80) { // INCREASED from 60
				// Descending motion - STRONGER
				harmonicPitch -= Math.floor(i * 0.8); // Was 0.5
			}
			// else: static/oscillating (now rarer)

			// 3. MORE FREQUENT leaps for interest (every 3rd note instead of 5th)
			if (i > 0 && (seed + i * 29) % 3 === 0) { // Was % 5
				const leap = ((seed + i) % 2 === 0 ? 7 : -7); // Perfect fifth leap
				harmonicPitch += leap;
			}

			// 4. NEW: Occasional OCTAVE leaps for drama
			if (i > 0 && (seed + i * 31) % 7 === 0) {
				const octaveLeap = ((seed + i) % 2 === 0 ? 12 : -12);
				harmonicPitch += octaveLeap;
			}

			melody.push(Math.round(harmonicPitch));
			seed = (seed * 1.1 + i * 7) % 10000;
		}

		// Use complementary rhythm - fill in gaps where center has longer notes
		const rhythm: number[] = [];
		for (let i = 0; i < length; i++) {
			const centerRhythm = centerPhrase.rhythm[Math.min(i, centerPhrase.rhythm.length - 1)];

			// Inverse rhythm - short when center is long, long when center is short
			const inverted = centerRhythm > 2.0 ? 0.75 : 2.0;

			// Add rhythmic variation
			const rhythmVariation = ((seed + i * 11) % 20 - 10) / 100; // ±10%
			rhythm.push(inverted * (1 + rhythmVariation));
		}

		const harmony = centerPhrase.harmony.slice(0, length);

		// DRAMATIC velocity contrast - some harmonic responses MUCH quieter, some LOUDER
		const velocities = centerPhrase.velocities.slice(0, length).map((v, i) => {
			if ((seed + i) % 7 === 0) {
				return v * 0.35; // VERY quiet whispers
			} else if ((seed + i) % 11 === 0) {
				return v * 1.15; // LOUDER than center for accent
			} else {
				return v * 0.60; // Generally quieter
			}
		});

		return {
			melody,
			harmony,
			rhythm,
			velocities,
			tempo: centerPhrase.tempo,
			totalBeats: rhythm.reduce((sum, d) => sum + d, 0)
		};
	}

	/**
	 * Generate rhythmic counterpoint phrase - independent bass line
	 */
	private generateRhythmicCounterpoint(centerPhrase: MusicalPhrase, prose: ProseAnalysis): MusicalPhrase {
		// Create a MORE chromatic walking bass line with unexpected approach tones
		const length = centerPhrase.melody.length;
		const melody: number[] = [];
		let seed = Math.floor(prose.density.contentDensity * 83);

		// Build bass line from chord roots and chromatic passing tones
		for (let i = 0; i < length; i++) {
			const chordRoot = centerPhrase.harmony[i];
			const nextChord = i < length - 1 ? centerPhrase.harmony[i + 1] : chordRoot;

			// Bass movement: roots, fifths, chromatic approaches, and surprising leaps
			if (i % 4 === 0) {
				// On strong beats: play root (stable)
				melody.push(chordRoot - 12); // Octave lower
			} else if (i % 2 === 0) {
				// On medium beats: more variety - fifth, third, or seventh
				const chordToneOptions = [
					chordRoot - 5,  // Fifth (fourth down)
					chordRoot - 8,  // Third (sixth down)
					chordRoot - 2   // Seventh
				];
				const toneIndex = (seed + i) % chordToneOptions.length;
				melody.push(chordToneOptions[toneIndex] - 12);
			} else {
				// On weak beats: MORE chromatic and unexpected approaches
				const interval = nextChord - chordRoot;
				let approach: number;

				// Chromatic approach from above or below (50% more chromaticism)
				if ((seed + i) % 2 === 0) {
					// Chromatic approach from below
					approach = nextChord - 1;
				} else {
					// Chromatic approach from above
					approach = nextChord + 1;
				}

				// Occasionally add tritone substitutions for jazz flavor
				if ((seed + i * 19) % 7 === 0 && prose.musicalExpressiveness > 0.6) {
					approach = nextChord + 6; // Tritone away
				}

				// Occasionally add scalar approach instead of chromatic
				if ((seed + i * 23) % 5 === 0) {
					approach = chordRoot < nextChord ? chordRoot + 2 : chordRoot - 2;
				}

				melody.push(approach - 12);
			}

			seed = (seed * 1.05 + i * 11) % 1000;
		}

		// Rhythmic counterpoint - more varied syncopation
		const rhythm: number[] = [];
		const bassMotifs = [
			[1.0, 0.75, 1.25, 1.0],       // Original syncopated
			[1.5, 0.5, 1.0, 1.0],         // Anticipation
			[0.75, 0.75, 1.5, 1.0]        // Delayed emphasis
		];

		const motifIndex = Math.floor(prose.overallComplexity * bassMotifs.length);
		const bassMotif = bassMotifs[Math.min(motifIndex, bassMotifs.length - 1)];

		for (let i = 0; i < length; i++) {
			let duration = bassMotif[i % bassMotif.length];

			// Add micro-variations to rhythm
			const variation = ((seed + i * 13) % 20 - 10) / 100; // ±10%
			duration *= (1 + variation);

			rhythm.push(duration);
		}

		const harmony = centerPhrase.harmony;

		// DRAMATIC velocity contrast - bass can be whisper quiet or THUNDERING
		const velocities = centerPhrase.velocities.map((v, i) => {
			if ((seed + i) % 9 === 0) {
				return v * 0.40; // Very quiet bass (pedal tone effect)
			} else if ((seed + i) % 13 === 0) {
				return v * 1.25; // MUCH LOUDER bass (accent)
			} else {
				return v * 0.75; // Moderate bass
			}
		});

		return {
			melody,
			harmony,
			rhythm,
			velocities,
			tempo: centerPhrase.tempo,
			totalBeats: rhythm.reduce((sum, d) => sum + d, 0)
		};
	}

	/**
	 * Generate ambient texture phrase - slow-moving harmonic pad
	 */
	private generateAmbientTexture(centerPhrase: MusicalPhrase, prose: ProseAnalysis): MusicalPhrase {
		// Create evolving ambient tones that shift through the harmony
		const length = 6; // Several sustained tones
		const melody: number[] = [];
		const harmony: number[] = [];
		const rhythm: number[] = [];

		// Extract unique chord roots from center phrase
		const chordRoots = [...new Set(centerPhrase.harmony)].slice(0, length);

		for (let i = 0; i < length; i++) {
			const chord = chordRoots[i % chordRoots.length];

			// Play chord tones in high register (root, third, fifth alternating)
			const chordTone = i % 3 === 0 ? chord : (i % 3 === 1 ? chord + 4 : chord + 7);
			melody.push(chordTone + 19); // High register

			harmony.push(chord);

			// Very long sustained notes that overlap
			const duration = centerPhrase.totalBeats / (length * 0.6); // Overlapping sustains
			rhythm.push(duration);
		}

		// Very soft, creating atmospheric layer
		const velocities = new Array(length).fill(0.35);

		return {
			melody,
			harmony,
			rhythm,
			velocities,
			tempo: centerPhrase.tempo * 0.5, // Half tempo (slower)
			totalBeats: rhythm.reduce((sum, d) => sum + d, 0)
		};
	}

	/**
	 * Extract motifs from a melody and rhythm
	 */
	private extractMotifs(melody: number[], rhythm: number[]): MusicalMotif[] {
		const motifs: MusicalMotif[] = [];

		// Motif A: First 3-5 notes (opening gesture)
		const motifALength = Math.min(4, melody.length);
		motifs.push({
			pitchPattern: this.toIntervals(melody.slice(0, motifALength)),
			rhythmPattern: rhythm.slice(0, motifALength),
			id: 'motif-A',
			sourcePhrase: 0
		});

		// Motif B: Most distinctive gesture (largest leap or turn)
		if (melody.length >= 8) {
			const distinctiveIndex = this.findMostDistinctiveGesture(melody);
			const motifBLength = Math.min(4, melody.length - distinctiveIndex);
			if (motifBLength >= 3) {
				motifs.push({
					pitchPattern: this.toIntervals(melody.slice(distinctiveIndex, distinctiveIndex + motifBLength)),
					rhythmPattern: rhythm.slice(distinctiveIndex, distinctiveIndex + motifBLength),
					id: 'motif-B',
					sourcePhrase: 0
				});
			}
		}

		logger.info('motif-extraction', 'Extracted motifs', {
			count: motifs.length,
			motifA: motifs[0]?.pitchPattern,
			motifB: motifs[1]?.pitchPattern
		});

		return motifs;
	}

	/**
	 * Convert absolute pitches to intervals (relative to first note)
	 */
	private toIntervals(pitches: number[]): number[] {
		if (pitches.length === 0) return [];

		const intervals = [0]; // First note is reference point
		const referencePitch = pitches[0];

		for (let i = 1; i < pitches.length; i++) {
			intervals.push(pitches[i] - referencePitch);
		}

		return intervals;
	}

	/**
	 * Find the most distinctive melodic gesture (largest interval or directional change)
	 */
	private findMostDistinctiveGesture(melody: number[]): number {
		let maxInterest = 0;
		let bestIndex = 0;

		for (let i = 1; i < melody.length - 2; i++) {
			// Calculate "interest" as combination of leap size and direction change
			const interval1 = Math.abs(melody[i] - melody[i - 1]);
			const interval2 = Math.abs(melody[i + 1] - melody[i]);

			// Check for direction change
			const dir1 = Math.sign(melody[i] - melody[i - 1]);
			const dir2 = Math.sign(melody[i + 1] - melody[i]);
			const directionChange = dir1 !== dir2 ? 1.5 : 1.0;

			const interest = (interval1 + interval2) * directionChange;

			if (interest > maxInterest) {
				maxInterest = interest;
				bestIndex = i - 1;
			}
		}

		return bestIndex;
	}

	/**
	 * Develop a motif using various transformations
	 */
	private developMotif(
		motif: MusicalMotif,
		transformation: 'repeat' | 'transpose' | 'invert' | 'augment' | 'fragment',
		transposition: number = 0
	): { melody: number[], rhythm: number[] } {
		switch (transformation) {
			case 'repeat':
				// Exact repetition at new pitch level
				return {
					melody: motif.pitchPattern.map(p => p + transposition),
					rhythm: [...motif.rhythmPattern]
				};

			case 'transpose':
				// Move to new key area (up a fifth = +7 semitones)
				return {
					melody: motif.pitchPattern.map(p => p + 7),
					rhythm: [...motif.rhythmPattern]
				};

			case 'invert':
				// Mirror intervals (ascending becomes descending)
				return {
					melody: motif.pitchPattern.map(p => -p),
					rhythm: [...motif.rhythmPattern]
				};

			case 'augment':
				// Stretch rhythm (2x slower for dramatic effect)
				return {
					melody: [...motif.pitchPattern],
					rhythm: motif.rhythmPattern.map(d => d * 2)
				};

			case 'fragment':
				// Use only first 2-3 notes (fragmentation creates tension)
				const fragmentLength = Math.min(3, motif.pitchPattern.length);
				return {
					melody: motif.pitchPattern.slice(0, fragmentLength),
					rhythm: motif.rhythmPattern.slice(0, fragmentLength)
				};

			default:
				return {
					melody: [...motif.pitchPattern],
					rhythm: [...motif.rhythmPattern]
				};
		}
	}

	/**
	 * Choose appropriate transformation based on usage and context
	 */
	private chooseTransformation(
		memory: MusicalMemory,
		motif: MusicalMotif
	): 'repeat' | 'transpose' | 'invert' | 'augment' | 'fragment' {
		const usageCount = memory.usageCount.get(motif.id) || 0;
		const lastTransform = memory.lastTransform.get(motif.id);

		// Cycle through transformations to maintain variety
		if (usageCount === 0) {
			return 'repeat'; // First use: exact repetition
		} else if (usageCount === 1 && lastTransform !== 'transpose') {
			return 'transpose'; // Second use: transpose for contrast
		} else if (usageCount === 2 && lastTransform !== 'invert') {
			return 'invert'; // Third use: inversion for development
		} else if (usageCount === 3 && lastTransform !== 'fragment') {
			return 'fragment'; // Fourth use: fragmentation
		} else if (usageCount >= 4 && lastTransform !== 'augment') {
			return 'augment'; // Later uses: augmentation
		}

		// Default: alternate between repeat and transpose
		return usageCount % 2 === 0 ? 'repeat' : 'transpose';
	}
}
