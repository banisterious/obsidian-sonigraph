/**
 * MusicalTheoryEngine
 * 
 * Provides musical theory integration for continuous layers including
 * scale constraints, chord progressions, and harmonic rules.
 */

import { MusicalScale, ChordProgression } from '../layers/types';
import { getLogger } from '../../logging';

const logger = getLogger('MusicalTheoryEngine');

// Note constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const INTERVAL_NAMES = ['unison', 'minor2nd', 'major2nd', 'minor3rd', 'major3rd', 'perfect4th', 'tritone', 'perfect5th', 'minor6th', 'major6th', 'minor7th', 'major7th'];

// Scale definitions
const SCALE_PATTERNS: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  'pentatonic_major': [0, 2, 4, 7, 9],
  'pentatonic_minor': [0, 3, 5, 7, 10],
  'blues': [0, 3, 5, 6, 7, 10],
  'whole_tone': [0, 2, 4, 6, 8, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

// Chord quality patterns (intervals from root)
const CHORD_PATTERNS: Record<string, number[]> = {
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'diminished': [0, 3, 6],
  'augmented': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  'major7': [0, 4, 7, 11],
  'minor7': [0, 3, 7, 10],
  'dominant7': [0, 4, 7, 10],
  'diminished7': [0, 3, 6, 9],
  'major9': [0, 4, 7, 11, 14],
  'minor9': [0, 3, 7, 10, 14]
};

export class MusicalTheoryEngine {
  private currentScale: MusicalScale;
  private chordProgressions: Map<string, ChordProgression> = new Map();
  
  constructor(initialScale?: MusicalScale) {
    this.currentScale = initialScale || {
      name: 'major',
      intervals: SCALE_PATTERNS.major,
      key: 'C'
    };
    
    this.generateChordProgressions();
    
    logger.debug('initialization', `MusicalTheoryEngine created with ${this.currentScale.key} ${this.currentScale.name}`);
  }
  
  /**
   * Set the current musical scale
   */
  setScale(scale: MusicalScale): void {
    this.currentScale = scale;
    this.generateChordProgressions();
    
    logger.info('scale', `Scale changed to ${scale.key} ${scale.name}`);
  }
  
  /**
   * Get the current scale
   */
  getScale(): MusicalScale {
    return { ...this.currentScale };
  }
  
  /**
   * Constrain a frequency to the current scale
   */
  constrainFrequencyToScale(frequency: number): number {
    // Convert frequency to MIDI note number
    const midiNote = this.frequencyToMidi(frequency);
    
    // Constrain to scale
    const constrainedMidi = this.constrainMidiToScale(midiNote);
    
    // Convert back to frequency
    return this.midiToFrequency(constrainedMidi);
  }
  
  /**
   * Constrain a MIDI note to the current scale
   */
  constrainMidiToScale(midiNote: number): number {
    const rootMidi = this.noteNameToMidi(this.currentScale.key + '4'); // Use octave 4 as reference
    const octave = Math.floor((midiNote - rootMidi) / 12);
    const chromaticNote = ((midiNote - rootMidi) % 12 + 12) % 12; // Ensure positive
    
    // Find closest scale degree
    let closestInterval = this.currentScale.intervals[0];
    let minDistance = Math.abs(chromaticNote - closestInterval);
    
    for (const interval of this.currentScale.intervals) {
      const distance = Math.abs(chromaticNote - interval);
      if (distance < minDistance) {
        minDistance = distance;
        closestInterval = interval;
      }
    }
    
    // Return constrained MIDI note
    return rootMidi + (octave * 12) + closestInterval;
  }
  
  /**
   * Generate a chord from a root note and quality
   */
  generateChord(rootNote: string, quality: string = 'major', octave: number = 3): string[] {
    const pattern = CHORD_PATTERNS[quality];
    if (!pattern) {
      logger.warn('chord', `Unknown chord quality: ${quality}, using major`);
      return this.generateChord(rootNote, 'major', octave);
    }
    
    const rootMidi = this.noteNameToMidi(rootNote + octave);
    
    return pattern.map(interval => {
      const noteMidi = rootMidi + interval;
      return this.midiToNoteName(noteMidi);
    });
  }
  
  /**
   * Generate a chord progression in the current key
   */
  generateProgressionInKey(progressionName: string = 'basic'): ChordProgression {
    const cached = this.chordProgressions.get(progressionName);
    if (cached) {
      return cached;
    }
    
    // Generate basic I-V-vi-IV progression
    const scaleChords = this.getScaleChords();
    
    let chordSequence: string[];
    let durations: number[];
    
    switch (progressionName) {
      case 'basic':
        chordSequence = [
          scaleChords[0], // I
          scaleChords[4], // V
          scaleChords[5], // vi
          scaleChords[3]  // IV
        ];
        durations = [4, 4, 4, 4]; // Whole notes
        break;
        
      case 'jazz':
        chordSequence = [
          scaleChords[0] + '7', // Imaj7
          scaleChords[5] + '7', // vi7
          scaleChords[1] + '7', // ii7
          scaleChords[4] + '7'  // V7
        ];
        durations = [2, 2, 2, 2]; // Half notes
        break;
        
      case 'melancholy':
        chordSequence = [
          scaleChords[5], // vi (relative minor)
          scaleChords[3], // IV
          scaleChords[0], // I
          scaleChords[4]  // V
        ];
        durations = [8, 4, 4, 4]; // Longer on the minor chord
        break;
        
      default:
        chordSequence = [scaleChords[0]];
        durations = [4];
    }
    
    const progression: ChordProgression = {
      chords: chordSequence,
      durations,
      key: this.currentScale.key,
      scale: this.currentScale
    };
    
    this.chordProgressions.set(progressionName, progression);
    return progression;
  }
  
  /**
   * Get harmonic interval between two notes
   */
  getHarmonicInterval(note1: string, note2: string): number {
    const midi1 = this.noteNameToMidi(note1);
    const midi2 = this.noteNameToMidi(note2);
    
    return Math.abs(midi2 - midi1) % 12;
  }
  
  /**
   * Check if an interval is consonant
   */
  isConsonant(interval: number): boolean {
    const consonantIntervals = [0, 3, 4, 5, 7, 8, 9]; // Unison, minor 3rd, major 3rd, perfect 4th, perfect 5th, minor 6th, major 6th
    return consonantIntervals.includes(interval % 12);
  }
  
  /**
   * Generate scale degrees as note names
   */
  getScaleNotes(octave: number = 3): string[] {
    const rootMidi = this.noteNameToMidi(this.currentScale.key + octave);
    
    return this.currentScale.intervals.map(interval => {
      return this.midiToNoteName(rootMidi + interval);
    });
  }
  
  /**
   * Get available chord progressions
   */
  getAvailableProgressions(): string[] {
    return ['basic', 'jazz', 'melancholy'];
  }
  
  /**
   * Get available scales
   */
  getAvailableScales(): string[] {
    return Object.keys(SCALE_PATTERNS);
  }
  
  /**
   * Create a scale from name and key
   */
  createScale(scaleName: string, key: string, mode?: string): MusicalScale {
    const intervals = SCALE_PATTERNS[scaleName];
    if (!intervals) {
      logger.warn('scale', `Unknown scale: ${scaleName}, using major`);
      return this.createScale('major', key, mode);
    }
    
    return {
      name: scaleName,
      intervals,
      key,
      mode
    };
  }
  
  // === PRIVATE METHODS ===
  
  private frequencyToMidi(frequency: number): number {
    return 69 + 12 * Math.log2(frequency / 440);
  }
  
  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }
  
  private noteNameToMidi(noteName: string): number {
    const match = noteName.match(/^([A-G])(#|b)?(\d+)$/);
    if (!match) {
      logger.error('note-conversion', `Invalid note name: ${noteName}`);
      return 60; // Middle C fallback
    }
    
    const [, noteLetter, accidental = '', octaveStr] = match;
    const octave = parseInt(octaveStr);
    
    let noteIndex = NOTES.indexOf(noteLetter);
    if (noteIndex === -1) {
      logger.error('note-conversion', `Invalid note letter: ${noteLetter}`);
      return 60;
    }
    
    // Apply accidental
    if (accidental === '#') {
      noteIndex = (noteIndex + 1) % 12;
    } else if (accidental === 'b') {
      noteIndex = (noteIndex - 1 + 12) % 12;
    }
    
    return (octave * 12) + noteIndex + 12; // +12 because C0 is MIDI note 12
  }
  
  private midiToNoteName(midiNote: number): string {
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    
    return NOTES[noteIndex] + octave;
  }
  
  private generateChordProgressions(): void {
    this.chordProgressions.clear();
    
    // Pre-generate common progressions for the current scale
    const progressions = ['basic', 'jazz', 'melancholy'];
    
    progressions.forEach(name => {
      this.generateProgressionInKey(name);
    });
    
    logger.debug('progressions', `Generated ${progressions.length} chord progressions for ${this.currentScale.key} ${this.currentScale.name}`);
  }
  
  private getScaleChords(): string[] {
    const scaleNotes = this.getScaleNotes(3);
    
    // Generate triads for each scale degree
    return scaleNotes.map((note, index) => {
      // Determine chord quality based on scale degree intervals
      const third = this.currentScale.intervals[(index + 2) % this.currentScale.intervals.length];
      const fifth = this.currentScale.intervals[(index + 4) % this.currentScale.intervals.length];
      
      // Calculate intervals to determine quality
      const thirdInterval = (third - this.currentScale.intervals[index] + 12) % 12;
      const fifthInterval = (fifth - this.currentScale.intervals[index] + 12) % 12;
      
      let quality = 'major';
      if (thirdInterval === 3 && fifthInterval === 7) {
        quality = 'minor';
      } else if (thirdInterval === 3 && fifthInterval === 6) {
        quality = 'diminished';
      } else if (thirdInterval === 4 && fifthInterval === 8) {
        quality = 'augmented';
      }
      
      return note.replace(/\d+$/, '') + quality; // Remove octave number
    });
  }
}