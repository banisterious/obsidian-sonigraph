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

		// Step 3: Generate embellishments from connected nodes (optional)
		const embellishments = this.generateEmbellishments(data, proseAnalysis, centerPhrase);

		logger.info('mapping-complete', 'Note-centric mapping complete', {
			phraseLength: centerPhrase.melody.length,
			tempo: centerPhrase.tempo,
			embellishments: embellishments.length
		});

		return {
			centerPhrase,
			embellishments,
			proseAnalysis
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
	 * Generate melodic contour from prose
	 */
	private generateMelodyFromProse(prose: ProseAnalysis, length: number): number[] {
		const melody: number[] = [];

		// Determine melodic range based on complexity (1-3 octaves)
		const range = 12 + Math.round(prose.overallComplexity * 24); // 12-36 semitones

		// Generate contour based on prose characteristics
		for (let i = 0; i < length; i++) {
			const position = i / (length - 1); // 0 to 1

			// Base contour from structural complexity
			let pitch = 0;

			if (prose.structure.complexityScore > 0.6) {
				// Complex structure: wave-like motion
				pitch = Math.sin(position * Math.PI * 4) * range * 0.5;
			} else if (prose.density.contentDensity > 0.6) {
				// Dense content: ascending arc
				pitch = Math.sin(position * Math.PI) * range * 0.7;
			} else {
				// Simple/sparse: gentle meandering
				pitch = Math.sin(position * Math.PI * 2) * range * 0.4;
			}

			// Add variation based on vocabulary diversity
			const variation = (Math.random() - 0.5) * prose.linguistic.vocabularyDiversity * 12;
			pitch += variation;

			// Constrain to range
			pitch = Math.max(-range/2, Math.min(range/2, pitch));

			melody.push(Math.round(pitch));
		}

		return melody;
	}

	/**
	 * Generate harmonic progression from prose
	 */
	private generateHarmonyFromProse(prose: ProseAnalysis, length: number): number[] {
		const harmony: number[] = [];

		// Determine chord change frequency based on structure
		const chordChanges = Math.max(2, Math.round(prose.structure.nestingDepth * 2));
		const notesPerChord = Math.ceil(length / chordChanges);

		// Common progressions by content type
		const progressions: Record<string, number[]> = {
			'meeting-notes': [0, 5, 7, 5],      // I-IV-V-IV (bright, forward)
			'research': [0, 5, 3, 7],           // I-IV-iii-V (contemplative)
			'creative': [0, 4, 7, 5],           // I-iii-V-IV (flowing)
			'technical': [0, 7, 5, 0],          // I-V-IV-I (structured)
			'journal': [0, 3, 5, 0],            // I-iii-IV-I (personal)
			'outline': [0, 5, 7, 0],            // I-IV-V-I (clear structure)
			'mixed': [0, 5, 7, 0]               // I-IV-V-I (balanced)
		};

		const progression = progressions[prose.contentType] || progressions['mixed'];

		// Fill harmony array
		for (let i = 0; i < length; i++) {
			const chordIndex = Math.floor(i / notesPerChord) % progression.length;
			harmony.push(progression[chordIndex]);
		}

		return harmony;
	}

	/**
	 * Generate rhythmic pattern from prose
	 */
	private generateRhythmFromProse(prose: ProseAnalysis, length: number): number[] {
		const rhythm: number[] = [];

		// Base note duration based on content density (1.0 - 4.0 beats for longer, more substantial notes)
		const baseDuration = 1.0 + (1 - prose.density.contentDensity) * 3.0;

		for (let i = 0; i < length; i++) {
			let duration = baseDuration;

			// Vary duration based on list density (lists = shorter notes)
			if (prose.density.listDensity > 0.3) {
				duration *= (1 - prose.density.listDensity * 0.4);
			}

			// Vary based on punctuation (high punctuation = more rhythmic variety)
			if (prose.linguistic.punctuationDensity > 15) {
				const variation = (Math.random() - 0.5) * 1.0;
				duration += variation;
			}

			// Ensure minimum duration of 0.5 beats (longer minimum)
			duration = Math.max(0.5, duration);

			rhythm.push(duration);
		}

		return rhythm;
	}

	/**
	 * Generate velocity curve from prose
	 */
	private generateVelocityCurve(prose: ProseAnalysis, length: number): number[] {
		const velocities: number[] = [];

		// Base velocity from musical expressiveness (0.3 - 0.9)
		const baseVelocity = 0.3 + prose.musicalExpressiveness * 0.6;

		for (let i = 0; i < length; i++) {
			const position = i / (length - 1);

			// Create dynamic arc
			let velocity = baseVelocity;

			// High complexity = crescendo to middle, decrescendo to end
			if (prose.overallComplexity > 0.5) {
				velocity *= 0.7 + Math.sin(position * Math.PI) * 0.3;
			}

			// High question ratio = rising inflection at end
			if (prose.linguistic.questionRatio > 0.2) {
				velocity *= 0.8 + position * 0.4;
			}

			// Add small random variations
			velocity += (Math.random() - 0.5) * 0.1;

			// Constrain
			velocity = Math.max(0.1, Math.min(1.0, velocity));

			velocities.push(velocity);
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
	 * Generate harmonic response phrase
	 */
	private generateHarmonicResponse(centerPhrase: MusicalPhrase, prose: ProseAnalysis): MusicalPhrase {
		// Create a harmonic answer to the center phrase
		// Uses same harmony but different melody
		const length = Math.round(centerPhrase.melody.length * 0.7); // Shorter response

		const melody = centerPhrase.melody
			.slice(0, length)
			.map(pitch => pitch + 7); // Transpose up a fifth

		const harmony = centerPhrase.harmony.slice(0, length);
		const rhythm = centerPhrase.rhythm.slice(0, length);
		const velocities = centerPhrase.velocities.slice(0, length).map(v => v * 0.7); // Quieter

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
	 * Generate rhythmic counterpoint phrase
	 */
	private generateRhythmicCounterpoint(centerPhrase: MusicalPhrase, prose: ProseAnalysis): MusicalPhrase {
		// Create rhythmic variation using same pitches
		const length = centerPhrase.melody.length;

		const melody = centerPhrase.melody.map(pitch => pitch - 12); // Octave lower
		const harmony = centerPhrase.harmony;

		// Syncopated rhythm (offset by half beat)
		const rhythm = centerPhrase.rhythm.map(duration => duration * 0.8);

		const velocities = centerPhrase.velocities.map(v => v * 0.6); // Even quieter

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
	 * Generate ambient texture phrase
	 */
	private generateAmbientTexture(centerPhrase: MusicalPhrase, prose: ProseAnalysis): MusicalPhrase {
		// Create sustained ambient tones using harmony
		const length = 4; // Just a few long notes

		const melody = centerPhrase.harmony.slice(0, length).map(h => h + 24); // Two octaves up
		const harmony = centerPhrase.harmony.slice(0, length);
		const rhythm = new Array(length).fill(centerPhrase.totalBeats / length); // Even sustains
		const velocities = new Array(length).fill(0.4); // Soft

		return {
			melody,
			harmony,
			rhythm,
			velocities,
			tempo: centerPhrase.tempo * 0.5, // Half tempo (slower)
			totalBeats: rhythm.reduce((sum, d) => sum + d, 0)
		};
	}
}
