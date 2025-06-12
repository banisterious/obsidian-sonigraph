export interface InstrumentSettings {
	enabled: boolean;
	volume: number;
	maxVoices: number;
}

export interface SonigraphSettings {
	tempo: number;
	volume: number;
	scale: string;
	rootNote: string;
	traversalMethod: string;
	isEnabled: boolean;
	instruments: {
		piano: InstrumentSettings;
		organ: InstrumentSettings;
		strings: InstrumentSettings;
	};
	voiceAssignmentStrategy: 'frequency' | 'round-robin' | 'connection-based';
}

export const DEFAULT_SETTINGS: SonigraphSettings = {
	tempo: 120,
	volume: 0.5,
	scale: 'major',
	rootNote: 'C',
	traversalMethod: 'breadth-first',
	isEnabled: true,
	instruments: {
		piano: { enabled: true, volume: 0.8, maxVoices: 8 },
		organ: { enabled: true, volume: 0.7, maxVoices: 8 },
		strings: { enabled: true, volume: 0.6, maxVoices: 8 }
	},
	voiceAssignmentStrategy: 'frequency'
};

export const MUSICAL_SCALES = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
	pentatonic: [0, 2, 4, 7, 9],
	chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const TRAVERSAL_METHODS = ['breadth-first', 'depth-first', 'sequential'];

export const VOICE_ASSIGNMENT_STRATEGIES = {
	frequency: 'Frequency-Based (Automatic)',
	'round-robin': 'Round-Robin (Cycling)',
	'connection-based': 'Connection-Based (Graph)'
};

export const INSTRUMENT_INFO = {
	piano: {
		name: 'Piano',
		icon: '🎹',
		description: 'Triangle waves with quick attack/decay for percussive clarity',
		defaultFrequencyRange: 'High (>800Hz)'
	},
	organ: {
		name: 'Organ', 
		icon: '🎛️',
		description: 'FM synthesis with chorus effect for rich, sustained tones',
		defaultFrequencyRange: 'Medium (300-800Hz)'
	},
	strings: {
		name: 'Strings',
		icon: '🎻',
		description: 'AM synthesis with filtering for warm, flowing sounds',
		defaultFrequencyRange: 'Low (<300Hz)'
	}
}; 