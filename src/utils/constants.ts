export interface InstrumentSettings {
	enabled: boolean;
	volume: number;
	maxVoices: number;
	effects: {
		reverb: EffectSettings;
		chorus: EffectSettings;
		filter: EffectSettings;
	};
}

export interface EffectSettings {
	enabled: boolean;
	params: {
		[key: string]: number | string;
	};
}

export interface SonigraphSettings {
	tempo: number;
	volume: number;
	scale: string;
	rootNote: string;
	traversalMethod: string;
	isEnabled: boolean;
	audioFormat: 'mp3' | 'wav';
	instruments: {
		piano: InstrumentSettings;
		organ: InstrumentSettings;
		strings: InstrumentSettings;
		choir: InstrumentSettings;
		vocalPads: InstrumentSettings;
		pad: InstrumentSettings;
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
	audioFormat: 'mp3',
	instruments: {
		piano: { 
			enabled: true, 
			volume: 0.8, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 1.8, 
						preDelay: 0.02, 
						wet: 0.25 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.8, 
						depth: 0.5, 
						delayTime: 4.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 3500, 
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		organ: { 
			enabled: true, 
			volume: 0.7, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: false, 
					params: { 
						decay: 2.2, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.8, 
						depth: 0.5, 
						delayTime: 4.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 4000, 
						Q: 0.6, 
						type: 'lowpass' 
					} 
				}
			}
		},
		strings: { 
			enabled: true, 
			volume: 0.6, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: false, 
					params: { 
						decay: 2.8, 
						preDelay: 0.04, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.3, 
						delayTime: 3.0, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 3500, 
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		choir: { 
			enabled: true, 
			volume: 0.7, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.2, 
						preDelay: 0.05, 
						wet: 0.6 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.4, 
						depth: 0.6, 
						delayTime: 5.0, 
						feedback: 0.08 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 2000, 
						Q: 0.7, 
						type: 'lowpass' 
					} 
				}
			}
		},
		vocalPads: { 
			enabled: true, 
			volume: 0.5, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 4.0, 
						preDelay: 0.06, 
						wet: 0.7 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.3, 
						depth: 0.4, 
						delayTime: 6.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 1500, 
						Q: 1.2, 
						type: 'lowpass' 
					} 
				}
			}
		},
		pad: { 
			enabled: true, 
			volume: 0.4, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.5, 
						preDelay: 0.08, 
						wet: 0.8 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.2, 
						depth: 0.7, 
						delayTime: 8.0, 
						feedback: 0.1 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 1200, 
						Q: 1.5, 
						type: 'lowpass' 
					} 
				}
			}
		}
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
	},
	choir: {
		name: 'Choir',
		icon: '🎤',
		description: 'Additive synthesis with formant filtering for ethereal human voices',
		defaultFrequencyRange: 'Mid-High (400-1200Hz)'
	},
	vocalPads: {
		name: 'Vocal Pads',
		icon: '🌊',
		description: 'Multi-layer sine waves with formant filtering for atmospheric textures',
		defaultFrequencyRange: 'Mid (300-800Hz)'
	},
	pad: {
		name: 'Pad',
		icon: '🎛️',
		description: 'Multi-oscillator synthesis with filter sweeps for ambient foundations',
		defaultFrequencyRange: 'Full Spectrum (100-2000Hz)'
	}
}; 