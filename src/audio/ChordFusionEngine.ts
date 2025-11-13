/**
 * Chord Fusion Engine
 *
 * Detects simultaneous notes and combines them into chords based on timing windows
 * and user-configured settings. Supports both "smart" mode (fit to chord patterns)
 * and "direct" mode (play notes as-is).
 */

import { getLogger } from '../logging';
import { SonigraphSettings } from '../utils/constants';
import { HarmonicEngine } from './harmonic-engine';

const logger = getLogger('chord-fusion');

export interface NoteEvent {
	note: string;
	pitch: number;
	velocity: number;
	timestamp: number;
	duration: number;
	layer?: 'melodic' | 'harmonic' | 'rhythmic' | 'ambient' | 'percussion';
	instrument?: string;
}

export interface ChordGroup {
	notes: NoteEvent[];
	rootNote: number;
	chordType: string; // 'major', 'minor', 'dim', 'aug', etc.
	timestamp: number;
	layer?: string;
}

export class ChordFusionEngine {
	private settings: SonigraphSettings;
	private harmonicEngine: HarmonicEngine;
	private pendingNotes: NoteEvent[] = [];
	private lastProcessTime: number = 0;

	constructor(settings: SonigraphSettings) {
		this.settings = settings;
		this.harmonicEngine = new HarmonicEngine({
			enableChordProgression: true
		});
	}

	/**
	 * Update settings from plugin
	 */
	public updateSettings(settings: SonigraphSettings): void {
		this.settings = settings;

		// Update harmonic engine settings
		if (settings.audioEnhancement?.musicalTheory) {
			this.harmonicEngine = new HarmonicEngine({
				enableChordProgression: true
			});
		}
	}

	/**
	 * Process a note event - may trigger chord fusion if enabled
	 * Returns either the original note or a chord group
	 */
	public processNote(note: NoteEvent): NoteEvent | ChordGroup | null {
		const chordSettings = this.settings.audioEnhancement?.chordFusion;

		// If chord fusion is disabled, return note as-is
		if (!chordSettings?.enabled) {
			return note;
		}

		// Check if this layer has chord fusion enabled
		if (note.layer && !this.isLayerEnabled(note.layer, chordSettings)) {
			return note;
		}

		// Add note to pending buffer
		this.pendingNotes.push(note);

		// Check if we should process the pending notes
		const currentTime = Date.now();
		const timingWindow = chordSettings.timingWindow || 200;

		// If enough time has passed since the first note, process the buffer
		if (this.pendingNotes.length > 0) {
			const firstNoteTime = this.pendingNotes[0].timestamp;
			const elapsed = currentTime - firstNoteTime;

			if (elapsed >= timingWindow) {
				return this.processPendingNotes();
			}
		}

		// Not ready to process yet
		return null;
	}

	/**
	 * Force processing of pending notes (called at end of event stream)
	 */
	public flush(): (NoteEvent | ChordGroup)[] {
		if (this.pendingNotes.length === 0) {
			return [];
		}

		const result = this.processPendingNotes();
		return result ? [result] : [];
	}

	/**
	 * Process pending notes and determine if they should form a chord
	 */
	private processPendingNotes(): NoteEvent | ChordGroup | null {
		if (this.pendingNotes.length === 0) {
			return null;
		}

		const chordSettings = this.settings.audioEnhancement?.chordFusion!;
		const minimumNotes = chordSettings.minimumNotes || 2;

		// If we have fewer notes than the minimum, return them individually
		if (this.pendingNotes.length < minimumNotes) {
			const note = this.pendingNotes.shift();
			return note || null;
		}

		// We have enough notes for a chord - process based on mode
		const notes = [...this.pendingNotes];
		this.pendingNotes = [];

		if (chordSettings.mode === 'smart') {
			return this.createSmartChord(notes, chordSettings);
		} else {
			return this.createDirectChord(notes);
		}
	}

	/**
	 * Create a chord in "smart" mode - fit notes to proper chord patterns
	 */
	private createSmartChord(notes: NoteEvent[], settings: any): ChordGroup {
		// Sort notes by pitch
		const sortedNotes = notes.sort((a, b) => a.pitch - b.pitch);

		// Extract pitch classes (mod 12 for chromatic scale)
		const pitches = sortedNotes.map(n => n.pitch);

		// Determine root note and chord type
		const rootPitch = pitches[0];
		const chordType = this.analyzeChordType(pitches);

		// Limit to chord complexity setting
		const maxVoices = settings.chordComplexity || 3;
		const limitedNotes = sortedNotes.slice(0, maxVoices);

		// Apply voicing strategy
		const voicedNotes = this.applyVoicing(limitedNotes, settings.voicingStrategy || 'compact');

		logger.debug('chord-fusion', `Created smart chord: ${chordType} with ${voicedNotes.length} voices`);

		return {
			notes: voicedNotes,
			rootNote: rootPitch,
			chordType,
			timestamp: notes[0].timestamp,
			layer: notes[0].layer
		};
	}

	/**
	 * Create a chord in "direct" mode - play notes exactly as triggered
	 */
	private createDirectChord(notes: NoteEvent[]): ChordGroup {
		// Sort by pitch for consistent ordering
		const sortedNotes = notes.sort((a, b) => a.pitch - b.pitch);

		const rootPitch = sortedNotes[0].pitch;
		const chordType = 'direct'; // No chord type analysis in direct mode

		logger.debug('chord-fusion', `Created direct chord with ${sortedNotes.length} notes`);

		return {
			notes: sortedNotes,
			rootNote: rootPitch,
			chordType,
			timestamp: notes[0].timestamp,
			layer: notes[0].layer
		};
	}

	/**
	 * Analyze chord type from harmonized pitches
	 */
	private analyzeChordType(pitches: number[]): string {
		if (pitches.length < 2) return 'note';

		// Calculate intervals from root
		const root = pitches[0];
		const intervals = pitches.map(p => (p - root) % 12);

		// Match against common chord patterns
		if (this.matchesPattern(intervals, [0, 4, 7])) return 'major';
		if (this.matchesPattern(intervals, [0, 3, 7])) return 'minor';
		if (this.matchesPattern(intervals, [0, 3, 6])) return 'diminished';
		if (this.matchesPattern(intervals, [0, 4, 8])) return 'augmented';
		if (this.matchesPattern(intervals, [0, 4, 7, 11])) return 'major7';
		if (this.matchesPattern(intervals, [0, 3, 7, 10])) return 'minor7';
		if (this.matchesPattern(intervals, [0, 4, 7, 10])) return 'dominant7';
		if (this.matchesPattern(intervals, [0, 5, 7])) return 'suspended4';
		if (this.matchesPattern(intervals, [0, 2, 7])) return 'suspended2';

		return 'complex';
	}

	/**
	 * Check if intervals match a chord pattern
	 */
	private matchesPattern(intervals: number[], pattern: number[]): boolean {
		if (intervals.length < pattern.length) return false;

		for (let i = 0; i < pattern.length; i++) {
			if (!intervals.includes(pattern[i])) return false;
		}

		return true;
	}

	/**
	 * Apply voicing strategy to chord notes
	 */
	private applyVoicing(notes: NoteEvent[], strategy: string): NoteEvent[] {
		switch (strategy) {
			case 'compact':
				// Keep notes close together (already sorted)
				return notes;

			case 'spread':
				// Spread notes across wider range
				return this.spreadVoicing(notes);

			case 'drop2':
				// Drop the second-highest voice by an octave
				return this.drop2Voicing(notes);

			case 'drop3':
				// Drop the third-highest voice by an octave
				return this.drop3Voicing(notes);

			default:
				return notes;
		}
	}

	/**
	 * Spread voicing - distribute notes across wider range
	 */
	private spreadVoicing(notes: NoteEvent[]): NoteEvent[] {
		if (notes.length < 3) return notes;

		const spread = [...notes];
		// Move middle voices up by octaves
		for (let i = 1; i < spread.length - 1; i++) {
			spread[i] = {
				...spread[i],
				pitch: spread[i].pitch + 12 // Up one octave
			};
		}

		return spread;
	}

	/**
	 * Drop-2 voicing - drop second-highest voice by octave
	 */
	private drop2Voicing(notes: NoteEvent[]): NoteEvent[] {
		if (notes.length < 3) return notes;

		const voiced = [...notes];
		const secondHighest = voiced.length - 2;

		voiced[secondHighest] = {
			...voiced[secondHighest],
			pitch: voiced[secondHighest].pitch - 12 // Down one octave
		};

		// Re-sort after dropping
		return voiced.sort((a, b) => a.pitch - b.pitch);
	}

	/**
	 * Drop-3 voicing - drop third-highest voice by octave
	 */
	private drop3Voicing(notes: NoteEvent[]): NoteEvent[] {
		if (notes.length < 4) return notes;

		const voiced = [...notes];
		const thirdHighest = voiced.length - 3;

		voiced[thirdHighest] = {
			...voiced[thirdHighest],
			pitch: voiced[thirdHighest].pitch - 12 // Down one octave
		};

		// Re-sort after dropping
		return voiced.sort((a, b) => a.pitch - b.pitch);
	}

	/**
	 * Check if a layer has chord fusion enabled
	 */
	private isLayerEnabled(layer: string, settings: any): boolean {
		if (!settings.layerSettings) return false;

		switch (layer) {
			case 'melodic':
				return settings.layerSettings.melodic || false;
			case 'harmonic':
				return settings.layerSettings.harmonic || false;
			case 'rhythmic':
				return settings.layerSettings.rhythmic || false;
			case 'ambient':
				return settings.layerSettings.ambient || false;
			default:
				return false;
		}
	}

	/**
	 * Reset the engine state
	 */
	public reset(): void {
		this.pendingNotes = [];
		this.lastProcessTime = 0;
	}
}
