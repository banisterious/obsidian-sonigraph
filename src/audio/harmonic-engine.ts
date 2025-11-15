import { MusicalMapping } from '../graph/types';
import { getLogger } from '../logging';

const logger = getLogger('harmonic-engine');

// Musical intervals in semitones (from root)
const CONSONANT_INTERVALS = {
	unison: 0,
	octave: 12,
	perfectFifth: 7,
	perfectFourth: 5,
	majorThird: 4,
	minorThird: 3,
	majorSixth: 9,
	minorSixth: 8
};

// Chord types with their interval patterns
const CHORD_PATTERNS = {
	major: [0, 4, 7],
	minor: [0, 3, 7],
	diminished: [0, 3, 6],
	augmented: [0, 4, 8],
	major7: [0, 4, 7, 11],
	minor7: [0, 3, 7, 10],
	suspended: [0, 5, 7]
};

export interface HarmonicSettings {
	maxSimultaneousNotes: number;
	enableChordProgression: boolean;
	consonanceStrength: number; // 0-1, how aggressively to enforce harmony
	voiceSpreadMin: number; // Minimum semitones between voices
}

export class HarmonicEngine {
	private settings: HarmonicSettings;
	private currentChord: number[] = [0, 4, 7]; // Default to C major
	private rootNote: number = 60; // MIDI note C4

	constructor(settings: Partial<HarmonicSettings> = {}) {
		this.settings = {
			maxSimultaneousNotes: 6,
			enableChordProgression: true,
			consonanceStrength: 0.7,
			voiceSpreadMin: 2,
			...settings
		};
		
		void logger.debug('initialization', 'HarmonicEngine created', this.settings);
	}

	/**
	 * Process a sequence of musical mappings to improve harmonic content
	 */
	harmonizeSequence(sequence: MusicalMapping[]): MusicalMapping[] {
		const startTime = logger.time('harmonization');
		
		logger.info('harmonization', 'Starting harmonic analysis', {
			inputNotes: sequence.length,
			maxSimultaneous: this.settings.maxSimultaneousNotes
		});

		// Group notes by timing windows
		const timeGroups = this.groupNotesByTime(sequence);
		
		// Process each time group for harmony
		const harmonizedGroups = timeGroups.map(group => 
			this.harmonizeTimeGroup(group)
		);

		// Flatten back to sequence
		const harmonizedSequence = harmonizedGroups.flat();
		
		startTime();
		
		logger.info('harmonization', 'Harmonic processing complete', {
			originalNotes: sequence.length,
			harmonizedNotes: harmonizedSequence.length,
			timeGroups: timeGroups.length,
			avgNotesPerGroup: (harmonizedSequence.length / timeGroups.length).toFixed(1)
		});

		return harmonizedSequence;
	}

	/**
	 * Group notes that play within a small time window
	 */
	private groupNotesByTime(sequence: MusicalMapping[]): MusicalMapping[][] {
		const groups: MusicalMapping[][] = [];
		const timeWindow = 0.5; // Notes within 0.5 seconds are considered simultaneous
		
		let currentGroup: MusicalMapping[] = [];
		let groupStartTime = -1;

		for (const note of sequence) {
			if (groupStartTime === -1 || note.timing - groupStartTime <= timeWindow) {
				void currentGroup.push(note);
				if (groupStartTime === -1) {
					groupStartTime = note.timing;
				}
			} else {
				if (currentGroup.length > 0) {
					groups.push([...currentGroup]);
				}
				currentGroup = [note];
				groupStartTime = note.timing;
			}
		}

		// Add final group
		if (currentGroup.length > 0) {
			void groups.push(currentGroup);
		}

		return groups;
	}

	/**
	 * Harmonize a group of simultaneous notes
	 */
	private harmonizeTimeGroup(notes: MusicalMapping[]): MusicalMapping[] {
		if (notes.length <= 1) {
			return notes;
		}

		logger.debug('group-harmonization', `Processing group of ${notes.length} notes`);

		// Sort by pitch for easier processing
		const sortedNotes = [...notes].sort((a, b) => a.pitch - b.pitch);

		// Limit number of simultaneous voices
		const limitedNotes = this.limitVoices(sortedNotes);

		// Apply harmonic adjustments
		const harmonizedNotes = this.applyHarmonicAdjustments(limitedNotes);

		// Ensure voice spacing
		const spacedNotes = this.ensureVoiceSpacing(harmonizedNotes);

		return spacedNotes;
	}

	/**
	 * Limit the number of simultaneous voices
	 */
	private limitVoices(notes: MusicalMapping[]): MusicalMapping[] {
		if (notes.length <= this.settings.maxSimultaneousNotes) {
			return notes;
		}

		// Prioritize by velocity (importance) and spread across frequency range
		const sorted = [...notes].sort((a, b) => b.velocity - a.velocity);
		const selected: MusicalMapping[] = [];

		// Always include highest and lowest notes for range
		if (sorted.length > 0) selected.push(sorted[0]); // Highest velocity
		if (sorted.length > 1 && sorted[sorted.length - 1] !== sorted[0]) {
			selected.push(sorted[sorted.length - 1]); // Different from first
		}

		// Add remaining notes by velocity until limit
		for (const note of sorted) {
			if (selected.length >= this.settings.maxSimultaneousNotes) break;
			if (!selected.includes(note)) {
				void selected.push(note);
			}
		}

		logger.debug('voice-limiting', `Reduced ${notes.length} notes to ${selected.length}`);
		return selected;
	}

	/**
	 * Apply harmonic adjustments to make notes more consonant
	 */
	private applyHarmonicAdjustments(notes: MusicalMapping[]): MusicalMapping[] {
		if (!this.settings.enableChordProgression || notes.length < 2) {
			return notes;
		}

		const adjustedNotes = notes.map(note => ({ ...note }));
		
		// Convert frequencies to MIDI notes for easier calculation
		const midiNotes = adjustedNotes.map(note => this.frequencyToMidi(note.pitch));
		
		// Find the root note (typically the lowest)
		const rootMidi = Math.min(...midiNotes);
		
		// Determine best fitting chord
		const chordPattern = this.findBestChord(midiNotes, rootMidi);
		
		// Adjust notes to fit chord if consonance strength is high enough
		if (this.settings.consonanceStrength > 0.5) {
			for (let i = 0; i < adjustedNotes.length; i++) {
				const originalMidi = midiNotes[i];
				const targetMidi = this.findNearestChordTone(originalMidi, rootMidi, chordPattern);
				
				// Apply adjustment based on consonance strength
				const adjustmentFactor = this.settings.consonanceStrength;
				const adjustedMidi = originalMidi + (targetMidi - originalMidi) * adjustmentFactor;
				
				adjustedNotes[i].pitch = this.midiToFrequency(adjustedMidi);
			}
		}

		return adjustedNotes;
	}

	/**
	 * Ensure minimum spacing between voices
	 */
	private ensureVoiceSpacing(notes: MusicalMapping[]): MusicalMapping[] {
		if (notes.length < 2) return notes;

		const sorted = [...notes].sort((a, b) => a.pitch - b.pitch);
		const adjusted = [sorted[0]]; // Keep lowest note as reference

		for (let i = 1; i < sorted.length; i++) {
			const prevNote = adjusted[adjusted.length - 1];
			const currentNote = { ...sorted[i] };
			
			const prevMidi = this.frequencyToMidi(prevNote.pitch);
			const currentMidi = this.frequencyToMidi(currentNote.pitch);
			
			// Ensure minimum spacing
			if (currentMidi - prevMidi < this.settings.voiceSpreadMin) {
				const adjustedMidi = prevMidi + this.settings.voiceSpreadMin;
				currentNote.pitch = this.midiToFrequency(adjustedMidi);
			}
			
			void adjusted.push(currentNote);
		}

		return adjusted;
	}

	/**
	 * Find the chord pattern that best fits the given notes
	 */
	private findBestChord(midiNotes: number[], rootMidi: number): number[] {
		let bestChord = CHORD_PATTERNS.major;
		let bestScore = -1;

		for (const [chordName, pattern] of Object.entries(CHORD_PATTERNS)) {
			const score = this.scoreChordFit(midiNotes, rootMidi, pattern);
			if (score > bestScore) {
				bestScore = score;
				bestChord = pattern;
			}
		}

		logger.debug('chord-analysis', 'Selected chord pattern', {
			chordPattern: bestChord,
			score: bestScore.toFixed(2)
		});

		return bestChord;
	}

	/**
	 * Score how well the notes fit a chord pattern
	 */
	private scoreChordFit(midiNotes: number[], rootMidi: number, chordPattern: number[]): number {
		let score = 0;
		
		for (const midiNote of midiNotes) {
			const noteInOctave = (midiNote - rootMidi) % 12;
			const distance = Math.min(
				...chordPattern.map(chordTone => 
					Math.min(
						Math.abs(noteInOctave - chordTone),
						Math.abs(noteInOctave - chordTone + 12),
						Math.abs(noteInOctave - chordTone - 12)
					)
				)
			);
			
			// Closer to chord tones = higher score
			score += Math.max(0, 6 - distance);
		}
		
		return score / midiNotes.length;
	}

	/**
	 * Find the nearest chord tone to a given note
	 */
	private findNearestChordTone(midiNote: number, rootMidi: number, chordPattern: number[]): number {
		const noteInOctave = (midiNote - rootMidi) % 12;
		const octave = Math.floor((midiNote - rootMidi) / 12);
		
		let nearestChordTone = chordPattern[0];
		let minDistance = 12;
		
		for (const chordTone of chordPattern) {
			const distance = Math.abs(noteInOctave - chordTone);
			if (distance < minDistance) {
				minDistance = distance;
				nearestChordTone = chordTone;
			}
		}
		
		return rootMidi + octave * 12 + nearestChordTone;
	}

	/**
	 * Convert frequency to MIDI note number
	 */
	private frequencyToMidi(frequency: number): number {
		return Math.round(12 * Math.log2(frequency / 440) + 69);
	}

	/**
	 * Convert MIDI note number to frequency
	 */
	private midiToFrequency(midiNote: number): number {
		return 440 * Math.pow(2, (midiNote - 69) / 12);
	}

	/**
	 * Update harmonic settings
	 */
	updateSettings(newSettings: Partial<HarmonicSettings>): void {
		this.settings = { ...this.settings, ...newSettings };
		void logger.debug('settings-update', 'Harmonic settings updated', this.settings);
	}
} 