// Import Tone.js with ESM-compatible approach
import { start, Volume, PolySynth, FMSynth, Sampler, getContext, getTransport, Reverb, Chorus, Filter, Delay, Distortion, Compressor, EQ3 } from 'tone';
import { MusicalMapping } from '../graph/types';
import { SonigraphSettings, EFFECT_PRESETS, EffectPreset, DEFAULT_SETTINGS, EffectNode, SendBus, ReturnBus, migrateToEnhancedRouting } from '../utils/constants';
import { PercussionEngine } from './percussion-engine';
import { ElectronicEngine } from './electronic-engine';
import { getLogger } from '../logging';

const logger = getLogger('audio-engine');

// Sampled instrument configurations using high-quality samples
const SAMPLER_CONFIGS = {
	piano: {
		urls: {
			"A0": "A0.[format]", "C1": "C1.[format]", "D#1": "Ds1.[format]",
			"F#1": "Fs1.[format]", "A1": "A1.[format]", "C2": "C2.[format]",
			"D#2": "Ds2.[format]", "F#2": "Fs2.[format]", "A2": "A2.[format]",
			"C3": "C3.[format]", "D#3": "Ds3.[format]", "F#3": "Fs3.[format]",
			"A3": "A3.[format]", "C4": "C4.[format]", "D#4": "Ds4.[format]",
			"F#4": "Fs4.[format]", "A4": "A4.[format]", "C5": "C5.[format]",
			"D#5": "Ds5.[format]", "F#5": "Fs5.[format]", "A5": "A5.[format]",
			"C6": "C6.[format]", "D#6": "Ds6.[format]", "F#6": "Fs6.[format]",
			"A6": "A6.[format]", "C7": "C7.[format]", "D#7": "Ds7.[format]",
			"F#7": "Fs7.[format]", "A7": "A7.[format]", "C8": "C8.[format]"
		},
		release: 1,
		baseUrl: "https://tonejs.github.io/audio/salamander/",
		effects: ['reverb']
	},
	organ: {
		urls: {
			"C2": "C2.[format]", "C3": "C3.[format]", "C4": "C4.[format]",
			"C5": "C5.[format]", "C6": "C6.[format]", "F2": "F2.[format]",
			"F3": "F3.[format]", "F4": "F4.[format]", "F5": "F5.[format]",
			"F6": "F6.[format]", "F#2": "Fs2.[format]", "F#3": "Fs3.[format]",
			"F#4": "Fs4.[format]", "F#5": "Fs5.[format]", "F#6": "Fs6.[format]",
			"G2": "G2.[format]", "G3": "G3.[format]", "G4": "G4.[format]",
			"G5": "G5.[format]", "G6": "G6.[format]"
		},
		release: 0.8,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/harmonium/",
		effects: ['chorus', 'reverb']
	},
	strings: {
		urls: {
			"C3": "C3.[format]", "D#3": "Ds3.[format]", "F#3": "Fs3.[format]",
			"A3": "A3.[format]", "C4": "C4.[format]", "D#4": "Ds4.[format]",
			"F#4": "Fs4.[format]", "A4": "A4.[format]", "C5": "C5.[format]",
			"D#5": "Ds5.[format]", "F#5": "Fs5.[format]", "A5": "A5.[format]",
			"C6": "C6.[format]", "D#6": "Ds6.[format]", "F#6": "Fs6.[format]",
			"A6": "A6.[format]"
		},
		release: 2.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
		effects: ['reverb', 'filter']
	},
	choir: {
		urls: {
			"C3": "C3.[format]", "D#3": "Ds3.[format]", "F#3": "Fs3.[format]",
			"A3": "A3.[format]", "C4": "C4.[format]", "D#4": "Ds4.[format]",
			"F#4": "Fs4.[format]", "A4": "A4.[format]", "C5": "C5.[format]",
			"D#5": "Ds5.[format]", "F#5": "Fs5.[format]", "A5": "A5.[format]",
			"C6": "C6.[format]", "D#6": "Ds6.[format]"
		},
		release: 3.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/choir/",
		effects: ['reverb', 'chorus']
	},
	vocalPads: {
		urls: {
			"C2": "C2.[format]", "F2": "F2.[format]", "A2": "A2.[format]",
			"C3": "C3.[format]", "F3": "F3.[format]", "A3": "A3.[format]",
			"C4": "C4.[format]", "F4": "F4.[format]", "A4": "A4.[format]",
			"C5": "C5.[format]", "F5": "F5.[format]", "A5": "A5.[format]"
		},
		release: 4.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/vocal-pads/",
		effects: ['reverb', 'filter']
	},
	pad: {
		urls: {
			"C1": "C1.[format]", "G1": "G1.[format]", "C2": "C2.[format]",
			"G2": "G2.[format]", "C3": "C3.[format]", "G3": "G3.[format]",
			"C4": "C4.[format]", "G4": "G4.[format]", "C5": "C5.[format]",
			"G5": "G5.[format]", "C6": "C6.[format]"
		},
		release: 5.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/synth-pad/",
		effects: ['reverb', 'filter']
	},
	flute: {
		urls: {
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]",
			"B4": "B4.[format]", "C5": "C5.[format]", "D5": "D5.[format]",
			"E5": "E5.[format]", "F5": "F5.[format]", "G5": "G5.[format]",
			"A5": "A5.[format]", "B5": "B5.[format]", "C6": "C6.[format]",
			"D6": "D6.[format]", "E6": "E6.[format]"
		},
		release: 1.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/flute/",
		effects: ['reverb', 'filter']
	},
	clarinet: {
		urls: {
			"D3": "D3.[format]", "F3": "F3.[format]", "A3": "A3.[format]",
			"C4": "C4.[format]", "E4": "E4.[format]", "G4": "G4.[format]",
			"B4": "B4.[format]", "D5": "D5.[format]", "F5": "F5.[format]",
			"A5": "A5.[format]", "C6": "C6.[format]", "E6": "E6.[format]"
		},
		release: 2.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/clarinet/",
		effects: ['reverb', 'filter']
	},
	saxophone: {
		urls: {
			"D3": "D3.[format]", "F#3": "Fs3.[format]", "A3": "A3.[format]",
			"C4": "C4.[format]", "D#4": "Ds4.[format]", "F#4": "Fs4.[format]",
			"A4": "A4.[format]", "C5": "C5.[format]", "D#5": "Ds5.[format]",
			"F#5": "Fs5.[format]", "A5": "A5.[format]", "C6": "C6.[format]"
		},
		release: 2.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/saxophone/",
		effects: ['reverb', 'chorus']
	},
	// Phase 6A: Individual Vocal Sections with formant synthesis
	soprano: {
		urls: {
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]",
			"B4": "B4.[format]", "C5": "C5.[format]", "D5": "D5.[format]",
			"E5": "E5.[format]", "F5": "F5.[format]", "G5": "G5.[format]",
			"A5": "A5.[format]", "B5": "B5.[format]", "C6": "C6.[format]",
			"D6": "D6.[format]", "E6": "E6.[format]", "F6": "F6.[format]"
		},
		release: 2.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/soprano/",
		effects: ['reverb', 'chorus', 'filter'] // Full vocal effects suite
	},
	alto: {
		urls: {
			"G3": "G3.[format]", "A3": "A3.[format]", "B3": "B3.[format]",
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]",
			"B4": "B4.[format]", "C5": "C5.[format]", "D5": "D5.[format]",
			"E5": "E5.[format]", "F5": "F5.[format]", "G5": "G5.[format]"
		},
		release: 2.8,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/alto/",
		effects: ['reverb', 'chorus', 'filter'] // Full vocal effects suite
	},
	tenor: {
		urls: {
			"C3": "C3.[format]", "D3": "D3.[format]", "E3": "E3.[format]",
			"F3": "F3.[format]", "G3": "G3.[format]", "A3": "A3.[format]",
			"B3": "B3.[format]", "C4": "C4.[format]", "D4": "D4.[format]",
			"E4": "E4.[format]", "F4": "F4.[format]", "G4": "G4.[format]",
			"A4": "A4.[format]", "B4": "B4.[format]", "C5": "C5.[format]"
		},
		release: 2.3,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/tenor/",
		effects: ['reverb', 'filter'] // Less chorus for male voice clarity
	},
	bass: {
		urls: {
			"E2": "E2.[format]", "F2": "F2.[format]", "G2": "G2.[format]",
			"A2": "A2.[format]", "B2": "B2.[format]", "C3": "C3.[format]",
			"D3": "D3.[format]", "E3": "E3.[format]", "F3": "F3.[format]",
			"G3": "G3.[format]", "A3": "A3.[format]", "B3": "B3.[format]",
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]"
		},
		release: 3.2,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/bass-voice/",
		effects: ['reverb'] // Minimal effects for deep bass clarity
	},
	// Phase 6B: Extended Keyboard Family
	electricPiano: {
		urls: {
			"A1": "A1.[format]", "C2": "C2.[format]", "E2": "E2.[format]",
			"G2": "G2.[format]", "C3": "C3.[format]", "E3": "E3.[format]",
			"G3": "G3.[format]", "C4": "C4.[format]", "E4": "E4.[format]",
			"G4": "G4.[format]", "C5": "C5.[format]", "E5": "E5.[format]",
			"G5": "G5.[format]", "C6": "C6.[format]", "E6": "E6.[format]"
		},
		release: 2.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/electric-piano/",
		effects: ['reverb', 'chorus'] // Classic electric piano effects
	},
	harpsichord: {
		urls: {
			"C2": "C2.[format]", "D2": "D2.[format]", "F2": "F2.[format]",
			"G2": "G2.[format]", "A2": "A2.[format]", "C3": "C3.[format]",
			"D3": "D3.[format]", "F3": "F3.[format]", "G3": "G3.[format]",
			"A3": "A3.[format]", "C4": "C4.[format]", "D4": "D4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]",
			"C5": "C5.[format]", "D5": "D5.[format]", "F5": "F5.[format]"
		},
		release: 1.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/harpsichord/",
		effects: ['reverb', 'filter'] // Baroque clarity with filtering
	},
	accordion: {
		urls: {
			"C3": "C3.[format]", "D3": "D3.[format]", "E3": "E3.[format]",
			"F3": "F3.[format]", "G3": "G3.[format]", "A3": "A3.[format]",
			"B3": "B3.[format]", "C4": "C4.[format]", "D4": "D4.[format]",
			"E4": "E4.[format]", "F4": "F4.[format]", "G4": "G4.[format]",
			"A4": "A4.[format]", "B4": "B4.[format]", "C5": "C5.[format]",
			"D5": "D5.[format]", "E5": "E5.[format]", "F5": "F5.[format]"
		},
		release: 2.8,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/accordion/",
		effects: ['reverb', 'chorus'] // Bellows character with chorus
	},
	celesta: {
		urls: {
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]",
			"B4": "B4.[format]", "C5": "C5.[format]", "D5": "D5.[format]",
			"E5": "E5.[format]", "F5": "F5.[format]", "G5": "G5.[format]",
			"A5": "A5.[format]", "B5": "B5.[format]", "C6": "C6.[format]",
			"D6": "D6.[format]", "E6": "E6.[format]", "F6": "F6.[format]"
		},
		release: 3.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/celesta/",
		effects: ['reverb', 'filter'] // Bell-like with ethereal reverb
	},
	// Phase 7: Strings & Brass Completion
	violin: {
		urls: {
			"G3": "G3.[format]", "A3": "A3.[format]", "B3": "B3.[format]",
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]",
			"B4": "B4.[format]", "C5": "C5.[format]", "D5": "D5.[format]",
			"E5": "E5.[format]", "F5": "F5.[format]", "G5": "G5.[format]",
			"A5": "A5.[format]", "B5": "B5.[format]", "C6": "C6.[format]"
		},
		release: 2.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
		effects: ['reverb', 'filter'] // Expressive bowing with vibrato
	},
	cello: {
		urls: {
			"C2": "C2.[format]", "D2": "D2.[format]", "E2": "E2.[format]",
			"F2": "F2.[format]", "G2": "G2.[format]", "A2": "A2.[format]",
			"B2": "B2.[format]", "C3": "C3.[format]", "D3": "D3.[format]",
			"E3": "E3.[format]", "F3": "F3.[format]", "G3": "G3.[format]",
			"A3": "A3.[format]", "B3": "B3.[format]", "C4": "C4.[format]",
			"D4": "D4.[format]", "E4": "E4.[format]", "F4": "F4.[format]"
		},
		release: 3.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/cello/",
		effects: ['reverb', 'filter'] // Rich low harmonics with bow noise
	},
	guitar: {
		urls: {
			"E2": "E2.[format]", "F2": "F2.[format]", "G2": "G2.[format]",
			"A2": "A2.[format]", "B2": "B2.[format]", "C3": "C3.[format]",
			"D3": "D3.[format]", "E3": "E3.[format]", "F3": "F3.[format]",
			"G3": "G3.[format]", "A3": "A3.[format]", "B3": "B3.[format]",
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]"
		},
		release: 1.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
		effects: ['reverb', 'chorus'] // Plucked string with natural resonance
	},
	harp: {
		urls: {
			"C1": "C1.[format]", "D1": "D1.[format]", "F1": "F1.[format]",
			"G1": "G1.[format]", "A1": "A1.[format]", "C2": "C2.[format]",
			"D2": "D2.[format]", "F2": "F2.[format]", "G2": "G2.[format]",
			"A2": "A2.[format]", "C3": "C3.[format]", "D3": "D3.[format]",
			"F3": "F3.[format]", "G3": "G3.[format]", "A3": "A3.[format]",
			"C4": "C4.[format]", "D4": "D4.[format]", "F4": "F4.[format]"
		},
		release: 4.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/harp/",
		effects: ['reverb', 'filter'] // Cascading arpeggios with long decay
	},
	trumpet: {
		urls: {
			"C3": "C3.[format]", "D3": "D3.[format]", "E3": "E3.[format]",
			"F3": "F3.[format]", "G3": "G3.[format]", "A3": "A3.[format]",
			"B3": "B3.[format]", "C4": "C4.[format]", "D4": "D4.[format]",
			"E4": "E4.[format]", "F4": "F4.[format]", "G4": "G4.[format]",
			"A4": "A4.[format]", "B4": "B4.[format]", "C5": "C5.[format]",
			"D5": "D5.[format]", "E5": "E5.[format]", "F5": "F5.[format]"
		},
		release: 1.8,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/trumpet/",
		effects: ['reverb', 'filter'] // Bright brass with metallic formants
	},
	frenchHorn: {
		urls: {
			"B2": "B2.[format]", "C3": "C3.[format]", "D3": "D3.[format]",
			"E3": "E3.[format]", "F3": "F3.[format]", "G3": "G3.[format]",
			"A3": "A3.[format]", "B3": "B3.[format]", "C4": "C4.[format]",
			"D4": "D4.[format]", "E4": "E4.[format]", "F4": "F4.[format]",
			"G4": "G4.[format]", "A4": "A4.[format]", "B4": "B4.[format]",
			"C5": "C5.[format]", "D5": "D5.[format]", "E5": "E5.[format]"
		},
		release: 2.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/french-horn/",
		effects: ['reverb', 'chorus', 'filter'] // Warm middle register with slight distortion
	},
	trombone: {
		urls: {
			"A1": "A1.[format]", "B1": "B1.[format]", "C2": "C2.[format]",
			"D2": "D2.[format]", "E2": "E2.[format]", "F2": "F2.[format]",
			"G2": "G2.[format]", "A2": "A2.[format]", "B2": "B2.[format]",
			"C3": "C3.[format]", "D3": "D3.[format]", "E3": "E3.[format]",
			"F3": "F3.[format]", "G3": "G3.[format]", "A3": "A3.[format]",
			"B3": "B3.[format]", "C4": "C4.[format]", "D4": "D4.[format]"
		},
		release: 2.2,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/trombone/",
		effects: ['reverb', 'filter'] // Sliding pitch with sawtooth character
	},
	tuba: {
		urls: {
			"E1": "E1.[format]", "F1": "F1.[format]", "G1": "G1.[format]",
			"A1": "A1.[format]", "B1": "B1.[format]", "C2": "C2.[format]",
			"D2": "D2.[format]", "E2": "E2.[format]", "F2": "F2.[format]",
			"G2": "G2.[format]", "A2": "A2.[format]", "B2": "B2.[format]",
			"C3": "C3.[format]", "D3": "D3.[format]", "E3": "E3.[format]"
		},
		release: 3.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/tuba/",
		effects: ['reverb'] // Deep foundation with breath noise
	},
	// Phase 8: Percussion & Electronic Finale (8 instruments)
	oboe: {
		urls: {
			"Bb3": "Bb3.[format]", "D4": "D4.[format]", "F4": "F4.[format]",
			"A4": "A4.[format]", "C5": "C5.[format]", "E5": "E5.[format]",
			"G5": "G5.[format]", "Bb5": "Bb5.[format]", "D6": "D6.[format]"
		},
		release: 2.2,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/oboe/",
		effects: ['reverb', 'filter', 'chorus'] // Nasal formants + expression
	},
	timpani: {
		urls: {
			"C2": "C2.[format]", "F2": "F2.[format]", "Bb2": "Bb2.[format]", "D3": "D3.[format]"
		},
		release: 4.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/timpani/",
		effects: ['reverb', 'filter'] // Hall acoustics + rumble control
	},
	xylophone: {
		urls: {
			"C4": "C4.[format]", "D4": "D4.[format]", "E4": "E4.[format]",
			"F4": "F4.[format]", "G4": "G4.[format]", "A4": "A4.[format]",
			"B4": "B4.[format]", "C5": "C5.[format]", "D5": "D5.[format]",
			"E5": "E5.[format]", "F5": "F5.[format]", "G5": "G5.[format]",
			"A5": "A5.[format]", "B5": "B5.[format]", "C6": "C6.[format]",
			"D6": "D6.[format]", "E6": "E6.[format]", "F6": "F6.[format]"
		},
		release: 2.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/xylophone/",
		effects: ['reverb', 'filter'] // Bright attack + resonance
	},
	vibraphone: {
		urls: {
			"F3": "F3.[format]", "A3": "A3.[format]", "C4": "C4.[format]",
			"E4": "E4.[format]", "G4": "G4.[format]", "B4": "B4.[format]",
			"D5": "D5.[format]", "F5": "F5.[format]", "A5": "A5.[format]"
		},
		release: 6.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/vibraphone/",
		effects: ['reverb', 'chorus', 'filter'] // Metallic + vibrato motor
	},
	gongs: {
		urls: {
			"C2": "C2.[format]", "F2": "F2.[format]", "C3": "C3.[format]"
		},
		release: 12.0,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/gong/",
		effects: ['reverb', 'filter', 'distortion'] // Massive hall + metallic
	},
	leadSynth: {
		urls: {
			"C2": "C2.[format]", "C3": "C3.[format]", "C4": "C4.[format]",
			"C5": "C5.[format]", "C6": "C6.[format]"
		},
		release: 0.2,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/synth-lead/",
		effects: ['filter', 'distortion', 'delay'] // Cutting + modulation
	},
	bassSynth: {
		urls: {
			"C1": "C1.[format]", "F1": "F1.[format]", "C2": "C2.[format]",
			"F2": "F2.[format]", "C3": "C3.[format]"
		},
		release: 0.5,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/synth-bass/",
		effects: ['filter', 'compressor'] // Foundation + punch
	},
	arpSynth: {
		urls: {
			"C3": "C3.[format]", "C4": "C4.[format]", "C5": "C5.[format]", "C6": "C6.[format]"
		},
		release: 0.1,
		baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/synth-arp/",
		effects: ['filter', 'delay', 'reverb'] // Sequenced + space
	},
	// Phase 8B: Environmental & Natural Sounds
	whaleHumpback: {
		urls: {
			// Public domain NOAA humpback whale recordings from Internet Archive
			// Single whale recording mapped to multiple pitches for musical use
			// Available for download when sample downloading feature is implemented
			"C1": "whale_song.mp3", "F1": "whale_song.mp3", "Bb1": "whale_song.mp3",
			"C2": "whale_song.mp3", "F2": "whale_song.mp3", "Bb2": "whale_song.mp3",
			"C3": "whale_song.mp3", "F3": "whale_song.mp3"
		},
		release: 12.0, // Long whale song sustains
		baseUrl: "https://archive.org/download/WhaleSong_928/", // Public domain NOAA scientific recordings
		effects: ['reverb', 'chorus', 'filter'] // Deep oceanic processing
	}
};

export interface VoiceAssignment {
	nodeId: string;
	instrument: keyof typeof SAMPLER_CONFIGS;
	voiceIndex: number;
}

export class AudioEngine {
	private instruments: Map<string, PolySynth | Sampler> = new Map();
	private instrumentVolumes: Map<string, Volume> = new Map();
	private instrumentEffects: Map<string, Map<string, any>> = new Map(); // Per-instrument effects
	private isInitialized = false;
	private isPlaying = false;
	private currentSequence: MusicalMapping[] = [];
	private scheduledEvents: number[] = [];
	private realtimeTimer: ReturnType<typeof setInterval> | null = null;
	private realtimeStartTime: number = 0;
	private volume: Volume | null = null;
	private voiceAssignments: Map<string, VoiceAssignment> = new Map();
	private maxVoicesPerInstrument = 8;

	// Real-time feedback properties
	private previewTimeouts: Map<string, number> = new Map();
	private bypassStates: Map<string, Map<string, boolean>> = new Map(); // instrument -> effect -> bypassed
	private performanceMetrics: Map<string, { cpuUsage: number; latency: number }> = new Map();
	private isPreviewMode: boolean = false;
	private previewInstrument: string | null = null;
	private previewNote: any = null;

	// Performance optimization properties
	private voicePool: Map<string, any[]> = new Map(); // Pre-allocated voice pools
	private lastCPUCheck: number = 0;
	private adaptiveQuality: boolean = true;
	private currentQualityLevel: 'high' | 'medium' | 'low' = 'high';

	// Phase 3.5: Enhanced Effect Routing properties
	private enhancedRouting: boolean = false;
	private effectChains: Map<string, EffectNode[]> = new Map(); // instrument -> effect nodes
	private sendBuses: Map<string, SendBus> = new Map(); // bus id -> send bus
	private returnBuses: Map<string, ReturnBus> = new Map(); // bus id -> return bus
	private masterEffectsNodes: Map<string, any> = new Map(); // master effect instances
	private effectNodeInstances: Map<string, any> = new Map(); // effect id -> tone.js instance

	// Phase 8: Advanced Synthesis Engines
	private percussionEngine: PercussionEngine | null = null;
	private electronicEngine: ElectronicEngine | null = null;
	
	// Master Effects Processing
	private masterReverb: Reverb | null = null;
	private masterEQ: EQ3 | null = null;
	private masterCompressor: Compressor | null = null;

	constructor(private settings: SonigraphSettings) {
		logger.debug('initialization', 'AudioEngine created');
	}

	private getSamplerConfigs(): typeof SAMPLER_CONFIGS {
		// Replace [format] placeholder with actual format (unless synthesis-only mode)
		const format = this.settings.audioFormat;
		const configs = JSON.parse(JSON.stringify(SAMPLER_CONFIGS)) as typeof SAMPLER_CONFIGS;
		
		// Skip format replacement in synthesis-only mode
		if (format !== 'synthesis') {
			Object.values(configs).forEach(config => {
				Object.keys(config.urls).forEach(note => {
					const noteKey = note as string;
					(config.urls as any)[noteKey] = (config.urls as any)[noteKey].replace('[format]', format);
				});
			});
		}
		
		return configs;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.warn('AudioEngine already initialized');
			return;
		}

		try {
			logger.debug('audio', 'Initializing AudioEngine');
			
			// Start Tone.js
			await start();
			logger.debug('audio', 'Tone.js started successfully');

			// Create master volume control
			this.volume = new Volume(this.settings.volume).toDestination();
			logger.debug('audio', 'Master volume created');

			// Initialize instruments
			this.initializeInstruments();
			
			// Initialize advanced synthesis engines
			await this.initializeAdvancedSynthesis();
			
			// Check if enhanced routing is enabled
			if (this.settings.enhancedRouting?.enabled) {
				this.initializeEnhancedRouting();
			} else {
				this.initializeEffects();
				this.applyEffectSettings();
			}

			this.isInitialized = true;
			
			
			logger.info('audio', 'AudioEngine initialized successfully');
		} catch (error) {
			logger.error('audio', 'Failed to initialize AudioEngine', error);
			throw error;
		}
	}

	private async initializeAdvancedSynthesis(): Promise<void> {
		logger.info('advanced-synthesis', 'Initializing Phase 8 advanced synthesis engines');
		
		try {
			// Initialize percussion engine
			if (this.volume) {
				this.percussionEngine = new PercussionEngine(this.volume);
				await this.percussionEngine.initializePercussion();
				logger.debug('percussion', 'Advanced percussion synthesis initialized');
			}
			
			// Initialize electronic synthesis engine
			if (this.volume) {
				this.electronicEngine = new ElectronicEngine(this.volume);
				await this.electronicEngine.initializeElectronic();
				logger.debug('electronic', 'Advanced electronic synthesis initialized');
			}
			
			// Initialize master effects
			this.initializeMasterEffects();
			
			// Initialize performance optimization
			this.initializePerformanceOptimization();
			
			logger.info('advanced-synthesis', 'Advanced synthesis engines ready');
		} catch (error) {
			logger.error('advanced-synthesis', 'Failed to initialize advanced synthesis', error);
			// Don't throw - fall back to basic synthesis
		}
	}

	private async initializeEffects(): Promise<void> {
		// Initialize per-instrument effects - Phase 8B: Now supporting 34 instruments (Complete Orchestral Vision + Environmental Sounds)
		const instruments = ['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone', 'soprano', 'alto', 'tenor', 'bass', 'electricPiano', 'harpsichord', 'accordion', 'celesta', 'violin', 'cello', 'guitar', 'harp', 'trumpet', 'frenchHorn', 'trombone', 'tuba', 'oboe', 'timpani', 'xylophone', 'vibraphone', 'gongs', 'leadSynth', 'bassSynth', 'arpSynth', 'whaleHumpback'];
		
		for (const instrumentName of instruments) {
			const effectMap = new Map<string, any>();
			
			// Create reverb for this instrument
			const reverb = new Reverb({
				decay: 1.8,      
				preDelay: 0.02,  
				wet: 0.25        
			});
			await reverb.generate();
			effectMap.set('reverb', reverb);

			// Create chorus for this instrument
			const chorus = new Chorus({
				frequency: 0.8,   
				delayTime: 4.0,   
				depth: 0.5,       
				feedback: 0.05,   
				spread: 120       
			});
			chorus.start();
			effectMap.set('chorus', chorus);

			// Create filter for this instrument
			const filter = new Filter({
				frequency: 3500,  
				type: 'lowpass',
				rolloff: -24,     
				Q: 0.8           
			});
			effectMap.set('filter', filter);
			
			this.instrumentEffects.set(instrumentName, effectMap);
		}

		logger.debug('effects', 'Per-instrument audio effects initialized', {
			instrumentCount: instruments.length,
			effectsPerInstrument: 3
		});
	}

	// Phase 3.5: Enhanced Effect Routing initialization
	private async initializeEnhancedRouting(): Promise<void> {
		logger.debug('enhanced-routing', 'Initializing enhanced effect routing');
		
		this.enhancedRouting = true;
		
		// Migrate settings if needed
		if (!this.settings.enhancedRouting) {
			this.settings = migrateToEnhancedRouting(this.settings);
		}
		
		// Initialize effect chains for each instrument
		const instruments = Object.keys(this.settings.instruments);
		for (const instrumentName of instruments) {
			await this.initializeInstrumentEffectChain(instrumentName);
		}
		
		// Initialize master effects
		
		// Initialize send/return buses
		this.initializeSendReturnBuses();
		
		// Connect instruments with enhanced routing
		this.connectInstrumentsEnhanced();
		
		logger.info('enhanced-routing', 'Enhanced effect routing initialized', {
			instrumentCount: instruments.length,
			enhancedRouting: true
		});
	}

	private async initializeInstrumentEffectChain(instrumentName: string): Promise<void> {
		const effectChain = this.settings.enhancedRouting?.effectChains.get(instrumentName);
		if (!effectChain) {
			logger.warn('enhanced-routing', `No effect chain found for ${instrumentName}`);
			return;
		}

		const effectNodes: EffectNode[] = [];
		
		// Create effect instances for each node in the chain
		for (const node of effectChain.nodes) {
			const effectInstance = await this.createEffectInstance(node);
			if (effectInstance) {
				this.effectNodeInstances.set(node.id, effectInstance);
				effectNodes.push(node);
			}
		}
		
		// Store the processed effect chain
		this.effectChains.set(instrumentName, effectNodes);
		
		logger.debug('enhanced-routing', `Effect chain initialized for ${instrumentName}`, {
			nodeCount: effectNodes.length
		});
	}

	private async createEffectInstance(node: EffectNode): Promise<any> {
		try {
			switch (node.type) {
				case 'reverb':
					const reverbSettings = node.settings as any;
					const reverb = new Reverb(reverbSettings.params);
					await reverb.generate();
					return reverb;
					
				case 'chorus':
					const chorusSettings = node.settings as any;
					const chorus = new Chorus(chorusSettings.params);
					chorus.start();
					return chorus;
					
				case 'filter':
					const filterSettings = node.settings as any;
					const filter = new Filter(filterSettings.params);
					return filter;
					
				case 'delay':
					const delaySettings = node.settings as any;
					const delay = new Delay(delaySettings.params);
					return delay;
					
				case 'distortion':
					const distortionSettings = node.settings as any;
					const distortion = new Distortion(distortionSettings.params);
					return distortion;
					
				case 'compressor':
					const compressorSettings = node.settings as any;
					const compressor = new Compressor(compressorSettings.params);
					return compressor;
					
				default:
					logger.warn('enhanced-routing', `Unknown effect type: ${node.type}`);
					return null;
			}
		} catch (error) {
			logger.error('enhanced-routing', `Failed to create effect ${node.type}`, error);
			return null;
		}
	}


	private initializeSendReturnBuses(): void {
		const routingMatrix = this.settings.enhancedRouting?.routingMatrix;
		if (!routingMatrix) return;

		// Initialize send buses
		for (const [busId, sendBusArray] of routingMatrix.sends) {
			for (const sendBus of sendBusArray) {
				this.sendBuses.set(sendBus.id, sendBus);
			}
		}

		// Initialize return buses  
		for (const [busId, returnBus] of routingMatrix.returns) {
			this.returnBuses.set(busId, returnBus);
		}

		logger.debug('enhanced-routing', 'Send/return buses initialized', {
			sendBuses: this.sendBuses.size,
			returnBuses: this.returnBuses.size
		});
	}

	private connectInstrumentsEnhanced(): void {
		// Enhanced connection logic with effect chains
		for (const [instrumentName, effectNodes] of this.effectChains) {
			const instrument = this.instruments.get(instrumentName);
			const volume = this.instrumentVolumes.get(instrumentName);
			
			if (!instrument || !volume) continue;

			// Connect instrument through its effect chain
			let output = instrument.connect(volume);
			
			// Process effects in order
			const sortedNodes = [...effectNodes].sort((a, b) => a.order - b.order);
			for (const node of sortedNodes) {
				if (node.enabled && !node.bypass) {
					const effect = this.effectNodeInstances.get(node.id);
					if (effect) {
						output = output.connect(effect);
					}
				}
			}
			
			// Connect to master effects chain or directly to output
			this.connectToMasterChain(output);
		}
		
		logger.debug('enhanced-routing', 'Enhanced instrument connections established');
	}

	private connectToMasterChain(instrumentOutput: any): void {
		let output = instrumentOutput;
		
		// Connect through master effects if enabled
		if (this.masterEffectsNodes.has('compressor')) {
			output = output.connect(this.masterEffectsNodes.get('compressor'));
		}
		
		if (this.masterEffectsNodes.has('eq')) {
			output = output.connect(this.masterEffectsNodes.get('eq'));
		}
		
		if (this.masterEffectsNodes.has('reverb')) {
			output = output.connect(this.masterEffectsNodes.get('reverb'));
		}
		
		// Finally connect to master volume
		if (this.volume) {
			output.connect(this.volume);
		}
	}

	private connectSynthesisInstruments(): void {
		logger.debug('synthesis', 'Connecting synthesis instruments through effects to master output');

		for (const [instrumentName, instrument] of this.instruments) {
			const volume = this.instrumentVolumes.get(instrumentName);
			const effects = this.instrumentEffects.get(instrumentName);
			
			if (!volume || !effects) {
				logger.warn('synthesis', `Missing volume or effects for instrument: ${instrumentName}`);
				continue;
			}

			// Start with volume output
			let output = volume;

			// Connect through enabled effects in order: reverb → chorus → filter
			const reverb = effects.get('reverb');
			const chorus = effects.get('chorus');
			const filter = effects.get('filter');

			if (reverb) {
				output = output.connect(reverb);
			}
			
			if (chorus) {
				output = output.connect(chorus);
			}
			
			if (filter) {
				output = output.connect(filter);
			}

			// Finally connect to master volume
			if (this.volume) {
				output.connect(this.volume);
				logger.debug('synthesis', `Connected ${instrumentName} through effects to master output`);
			}
		}
	}

	private async initializeInstruments(): Promise<void> {
		const configs = this.getSamplerConfigs();
		
		// In synthesis mode, use synthesizers for all instruments instead of trying to load samples
		if (this.settings.audioFormat === 'synthesis') {
			logger.info('instruments', 'Synthesis mode - creating synthesizers for all instruments');
			
			// Create synthesizers for the manually configured instruments
			const manualInstruments = ['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone'];
			manualInstruments.forEach(instrumentName => {
				// Create basic polyphonic synthesizer
				const synth = new PolySynth(FMSynth, {
					oscillator: { type: 'sine' },
					envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.0 }
				});
				
				// Create volume control
				const volume = new Volume(-6);
				this.instrumentVolumes.set(instrumentName, volume);
				
				// Connect synth → volume → master
				synth.connect(volume);
				if (this.volume) {
					volume.connect(this.volume);
				}
				
				// Add to instruments map
				this.instruments.set(instrumentName, synth);
				
				logger.debug('instruments', `Created synthesis instrument: ${instrumentName}`);
			});
			
			// Connect synthesis instruments through effects (effects already initialized)
			this.connectSynthesisInstruments();
			this.applyEffectSettings();
			this.initializeMissingInstruments();
			this.applyInstrumentSettings();
			return;
		}
		
		// Sample-based initialization for non-synthesis mode
		// Piano - using Sampler with high-quality samples, fallback to basic synthesis
		const pianoSampler = new Sampler({
			...configs.piano,
			onload: () => {
				logger.debug('samples', 'Piano samples loaded successfully');
			},
			onerror: (error) => {
				logger.warn('samples', 'Piano samples failed to load, using basic synthesis', { error });
			}
		});
		const pianoVolume = new Volume(-6);
		this.instrumentVolumes.set('piano', pianoVolume);
		
		let pianoOutput = pianoSampler.connect(pianoVolume);
		
		// Connect piano to its specific effects based on settings
		const pianoEffects = this.instrumentEffects.get('piano');
		if (pianoEffects && this.settings.instruments.piano.effects) {
			if (this.settings.instruments.piano.effects.reverb.enabled) {
				const reverb = pianoEffects.get('reverb');
				if (reverb) pianoOutput = pianoOutput.connect(reverb);
			}
			if (this.settings.instruments.piano.effects.chorus.enabled) {
				const chorus = pianoEffects.get('chorus');
				if (chorus) pianoOutput = pianoOutput.connect(chorus);
			}
			if (this.settings.instruments.piano.effects.filter.enabled) {
				const filter = pianoEffects.get('filter');
				if (filter) pianoOutput = pianoOutput.connect(filter);
			}
		}
		pianoOutput.connect(this.volume);
		this.instruments.set('piano', pianoSampler);

		// Organ - using Sampler with harmonium samples, fallback to basic synthesis
		const organSampler = new Sampler({
			...configs.organ,
			onload: () => {
				logger.debug('samples', 'Organ samples loaded successfully');
			},
			onerror: (error) => {
				logger.warn('samples', 'Organ samples failed to load, using basic synthesis', { error });
			}
		});
		const organVolume = new Volume(-6);
		this.instrumentVolumes.set('organ', organVolume);
		
		let organOutput = organSampler.connect(organVolume);
		
		// Connect organ to its specific effects based on settings
		const organEffects = this.instrumentEffects.get('organ');
		if (organEffects && this.settings.instruments.organ.effects) {
			if (this.settings.instruments.organ.effects.reverb.enabled) {
				const reverb = organEffects.get('reverb');
				if (reverb) organOutput = organOutput.connect(reverb);
			}
			if (this.settings.instruments.organ.effects.chorus.enabled) {
				const chorus = organEffects.get('chorus');
				if (chorus) organOutput = organOutput.connect(chorus);
			}
			if (this.settings.instruments.organ.effects.filter.enabled) {
				const filter = organEffects.get('filter');
				if (filter) organOutput = organOutput.connect(filter);
			}
		}
		organOutput.connect(this.volume);
		this.instruments.set('organ', organSampler);

		// Strings - using Sampler with violin samples, fallback to basic synthesis
		const stringsSampler = new Sampler({
			...configs.strings,
			onload: () => {
				logger.debug('samples', 'Strings samples loaded successfully');
			},
			onerror: (error) => {
				logger.warn('samples', 'Strings samples failed to load, using basic synthesis', { error });
			}
		});
		const stringsVolume = new Volume(-6);
		this.instrumentVolumes.set('strings', stringsVolume);
		
		let stringsOutput = stringsSampler.connect(stringsVolume);
		
		// Connect strings to its specific effects based on settings
		const stringsEffects = this.instrumentEffects.get('strings');
		if (stringsEffects && this.settings.instruments.strings.effects) {
			if (this.settings.instruments.strings.effects.reverb.enabled) {
				const reverb = stringsEffects.get('reverb');
				if (reverb) stringsOutput = stringsOutput.connect(reverb);
			}
			if (this.settings.instruments.strings.effects.chorus.enabled) {
				const chorus = stringsEffects.get('chorus');
				if (chorus) stringsOutput = stringsOutput.connect(chorus);
			}
			if (this.settings.instruments.strings.effects.filter.enabled) {
				const filter = stringsEffects.get('filter');
				if (filter) stringsOutput = stringsOutput.connect(filter);
			}
		}
		stringsOutput.connect(this.volume);
		this.instruments.set('strings', stringsSampler);

		// Choir - using Sampler with choir samples
		const choirSampler = new Sampler(configs.choir);
		const choirVolume = new Volume(-6);
		this.instrumentVolumes.set('choir', choirVolume);
		
		let choirOutput = choirSampler.connect(choirVolume);
		
		// Connect choir to its specific effects based on settings
		const choirEffects = this.instrumentEffects.get('choir');
		if (choirEffects && this.settings.instruments.choir.effects) {
			if (this.settings.instruments.choir.effects.reverb.enabled) {
				const reverb = choirEffects.get('reverb');
				if (reverb) choirOutput = choirOutput.connect(reverb);
			}
			if (this.settings.instruments.choir.effects.chorus.enabled) {
				const chorus = choirEffects.get('chorus');
				if (chorus) choirOutput = choirOutput.connect(chorus);
			}
			if (this.settings.instruments.choir.effects.filter.enabled) {
				const filter = choirEffects.get('filter');
				if (filter) choirOutput = choirOutput.connect(filter);
			}
		}
		choirOutput.connect(this.volume);
		this.instruments.set('choir', choirSampler);

		// Vocal Pads - using Sampler with vocal pad samples
		const vocalPadsSampler = new Sampler(configs.vocalPads);
		const vocalPadsVolume = new Volume(-6);
		this.instrumentVolumes.set('vocalPads', vocalPadsVolume);
		
		let vocalPadsOutput = vocalPadsSampler.connect(vocalPadsVolume);
		
		// Connect vocal pads to its specific effects based on settings
		const vocalPadsEffects = this.instrumentEffects.get('vocalPads');
		if (vocalPadsEffects && this.settings.instruments.vocalPads.effects) {
			if (this.settings.instruments.vocalPads.effects.reverb.enabled) {
				const reverb = vocalPadsEffects.get('reverb');
				if (reverb) vocalPadsOutput = vocalPadsOutput.connect(reverb);
			}
			if (this.settings.instruments.vocalPads.effects.chorus.enabled) {
				const chorus = vocalPadsEffects.get('chorus');
				if (chorus) vocalPadsOutput = vocalPadsOutput.connect(chorus);
			}
			if (this.settings.instruments.vocalPads.effects.filter.enabled) {
				const filter = vocalPadsEffects.get('filter');
				if (filter) vocalPadsOutput = vocalPadsOutput.connect(filter);
			}
		}
		vocalPadsOutput.connect(this.volume);
		this.instruments.set('vocalPads', vocalPadsSampler);

		// Pad - using Sampler with synthetic pad samples
		const padSampler = new Sampler(configs.pad);
		const padVolume = new Volume(-6);
		this.instrumentVolumes.set('pad', padVolume);
		
		let padOutput = padSampler.connect(padVolume);
		
		// Connect pad to its specific effects based on settings
		const padEffects = this.instrumentEffects.get('pad');
		if (padEffects && this.settings.instruments.pad.effects) {
			if (this.settings.instruments.pad.effects.reverb.enabled) {
				const reverb = padEffects.get('reverb');
				if (reverb) padOutput = padOutput.connect(reverb);
			}
			if (this.settings.instruments.pad.effects.chorus.enabled) {
				const chorus = padEffects.get('chorus');
				if (chorus) padOutput = padOutput.connect(chorus);
			}
			if (this.settings.instruments.pad.effects.filter.enabled) {
				const filter = padEffects.get('filter');
				if (filter) padOutput = padOutput.connect(filter);
			}
		}
		padOutput.connect(this.volume);
		this.instruments.set('pad', padSampler);

		// Flute - using Sampler with flute samples
		const fluteSampler = new Sampler(configs.flute);
		const fluteVolume = new Volume(-6);
		this.instrumentVolumes.set('flute', fluteVolume);
		
		let fluteOutput = fluteSampler.connect(fluteVolume);
		
		// Connect flute to its specific effects based on settings
		const fluteEffects = this.instrumentEffects.get('flute');
		if (fluteEffects && this.settings.instruments.flute.effects) {
			if (this.settings.instruments.flute.effects.reverb.enabled) {
				const reverb = fluteEffects.get('reverb');
				if (reverb) fluteOutput = fluteOutput.connect(reverb);
			}
			if (this.settings.instruments.flute.effects.chorus.enabled) {
				const chorus = fluteEffects.get('chorus');
				if (chorus) fluteOutput = fluteOutput.connect(chorus);
			}
			if (this.settings.instruments.flute.effects.filter.enabled) {
				const filter = fluteEffects.get('filter');
				if (filter) fluteOutput = fluteOutput.connect(filter);
			}
		}
		fluteOutput.connect(this.volume);
		this.instruments.set('flute', fluteSampler);

		// Clarinet - using Sampler with clarinet samples
		const clarinetSampler = new Sampler(configs.clarinet);
		const clarinetVolume = new Volume(-6);
		this.instrumentVolumes.set('clarinet', clarinetVolume);
		
		let clarinetOutput = clarinetSampler.connect(clarinetVolume);
		
		// Connect clarinet to its specific effects based on settings
		const clarinetEffects = this.instrumentEffects.get('clarinet');
		if (clarinetEffects && this.settings.instruments.clarinet.effects) {
			if (this.settings.instruments.clarinet.effects.reverb.enabled) {
				const reverb = clarinetEffects.get('reverb');
				if (reverb) clarinetOutput = clarinetOutput.connect(reverb);
			}
			if (this.settings.instruments.clarinet.effects.chorus.enabled) {
				const chorus = clarinetEffects.get('chorus');
				if (chorus) clarinetOutput = clarinetOutput.connect(chorus);
			}
			if (this.settings.instruments.clarinet.effects.filter.enabled) {
				const filter = clarinetEffects.get('filter');
				if (filter) clarinetOutput = clarinetOutput.connect(filter);
			}
		}
		clarinetOutput.connect(this.volume);
		this.instruments.set('clarinet', clarinetSampler);

		// Saxophone - using Sampler with saxophone samples
		const saxophoneSampler = new Sampler(configs.saxophone);
		const saxophoneVolume = new Volume(-6);
		this.instrumentVolumes.set('saxophone', saxophoneVolume);
		
		let saxophoneOutput = saxophoneSampler.connect(saxophoneVolume);
		
		// Connect saxophone to its specific effects based on settings
		const saxophoneEffects = this.instrumentEffects.get('saxophone');
		if (saxophoneEffects && this.settings.instruments.saxophone.effects) {
			if (this.settings.instruments.saxophone.effects.reverb.enabled) {
				const reverb = saxophoneEffects.get('reverb');
				if (reverb) saxophoneOutput = saxophoneOutput.connect(reverb);
			}
			if (this.settings.instruments.saxophone.effects.chorus.enabled) {
				const chorus = saxophoneEffects.get('chorus');
				if (chorus) saxophoneOutput = saxophoneOutput.connect(chorus);
			}
			if (this.settings.instruments.saxophone.effects.filter.enabled) {
				const filter = saxophoneEffects.get('filter');
				if (filter) saxophoneOutput = saxophoneOutput.connect(filter);
			}
		}
		saxophoneOutput.connect(this.volume);
		this.instruments.set('saxophone', saxophoneSampler);

		// Phase 6B: Extended Keyboard Family - Electric Piano
		const electricPianoSampler = new Sampler(configs.electricPiano);
		const electricPianoVolume = new Volume(-6);
		this.instrumentVolumes.set('electricPiano', electricPianoVolume);
		
		let electricPianoOutput = electricPianoSampler.connect(electricPianoVolume);
		
		// Connect electric piano to its specific effects based on settings
		const electricPianoEffects = this.instrumentEffects.get('electricPiano');
		if (electricPianoEffects && this.settings.instruments.electricPiano.effects) {
			if (this.settings.instruments.electricPiano.effects.reverb.enabled) {
				const reverb = electricPianoEffects.get('reverb');
				if (reverb) electricPianoOutput = electricPianoOutput.connect(reverb);
			}
			if (this.settings.instruments.electricPiano.effects.chorus.enabled) {
				const chorus = electricPianoEffects.get('chorus');
				if (chorus) electricPianoOutput = electricPianoOutput.connect(chorus);
			}
			if (this.settings.instruments.electricPiano.effects.filter.enabled) {
				const filter = electricPianoEffects.get('filter');
				if (filter) electricPianoOutput = electricPianoOutput.connect(filter);
			}
		}
		electricPianoOutput.connect(this.volume);
		this.instruments.set('electricPiano', electricPianoSampler);

		// Harpsichord - using Sampler with harpsichord samples
		const harpsichordSampler = new Sampler(configs.harpsichord);
		const harpsichordVolume = new Volume(-6);
		this.instrumentVolumes.set('harpsichord', harpsichordVolume);
		
		let harpsichordOutput = harpsichordSampler.connect(harpsichordVolume);
		
		// Connect harpsichord to its specific effects based on settings
		const harpsichordEffects = this.instrumentEffects.get('harpsichord');
		if (harpsichordEffects && this.settings.instruments.harpsichord.effects) {
			if (this.settings.instruments.harpsichord.effects.reverb.enabled) {
				const reverb = harpsichordEffects.get('reverb');
				if (reverb) harpsichordOutput = harpsichordOutput.connect(reverb);
			}
			if (this.settings.instruments.harpsichord.effects.chorus.enabled) {
				const chorus = harpsichordEffects.get('chorus');
				if (chorus) harpsichordOutput = harpsichordOutput.connect(chorus);
			}
			if (this.settings.instruments.harpsichord.effects.filter.enabled) {
				const filter = harpsichordEffects.get('filter');
				if (filter) harpsichordOutput = harpsichordOutput.connect(filter);
			}
		}
		harpsichordOutput.connect(this.volume);
		this.instruments.set('harpsichord', harpsichordSampler);

		// Accordion - using Sampler with accordion samples
		const accordionSampler = new Sampler(configs.accordion);
		const accordionVolume = new Volume(-6);
		this.instrumentVolumes.set('accordion', accordionVolume);
		
		let accordionOutput = accordionSampler.connect(accordionVolume);
		
		// Connect accordion to its specific effects based on settings
		const accordionEffects = this.instrumentEffects.get('accordion');
		if (accordionEffects && this.settings.instruments.accordion.effects) {
			if (this.settings.instruments.accordion.effects.reverb.enabled) {
				const reverb = accordionEffects.get('reverb');
				if (reverb) accordionOutput = accordionOutput.connect(reverb);
			}
			if (this.settings.instruments.accordion.effects.chorus.enabled) {
				const chorus = accordionEffects.get('chorus');
				if (chorus) accordionOutput = accordionOutput.connect(chorus);
			}
			if (this.settings.instruments.accordion.effects.filter.enabled) {
				const filter = accordionEffects.get('filter');
				if (filter) accordionOutput = accordionOutput.connect(filter);
			}
		}
		accordionOutput.connect(this.volume);
		this.instruments.set('accordion', accordionSampler);

		// Celesta - using Sampler with celesta samples
		const celestaSampler = new Sampler(configs.celesta);
		const celestaVolume = new Volume(-6);
		this.instrumentVolumes.set('celesta', celestaVolume);
		
		let celestaOutput = celestaSampler.connect(celestaVolume);
		
		// Connect celesta to its specific effects based on settings
		const celestaEffects = this.instrumentEffects.get('celesta');
		if (celestaEffects && this.settings.instruments.celesta.effects) {
			if (this.settings.instruments.celesta.effects.reverb.enabled) {
				const reverb = celestaEffects.get('reverb');
				if (reverb) celestaOutput = celestaOutput.connect(reverb);
			}
			if (this.settings.instruments.celesta.effects.chorus.enabled) {
				const chorus = celestaEffects.get('chorus');
				if (chorus) celestaOutput = celestaOutput.connect(chorus);
			}
			if (this.settings.instruments.celesta.effects.filter.enabled) {
				const filter = celestaEffects.get('filter');
				if (filter) celestaOutput = celestaOutput.connect(filter);
			}
		}
		celestaOutput.connect(this.volume);
		this.instruments.set('celesta', celestaSampler);

		// Phase 7: Strings & Brass Completion - Violin
		const violinSampler = new Sampler(configs.violin);
		const violinVolume = new Volume(-6);
		this.instrumentVolumes.set('violin', violinVolume);
		
		let violinOutput = violinSampler.connect(violinVolume);
		
		// Connect violin to its specific effects based on settings
		const violinEffects = this.instrumentEffects.get('violin');
		if (violinEffects && this.settings.instruments.violin.effects) {
			if (this.settings.instruments.violin.effects.reverb.enabled) {
				const reverb = violinEffects.get('reverb');
				if (reverb) violinOutput = violinOutput.connect(reverb);
			}
			if (this.settings.instruments.violin.effects.chorus.enabled) {
				const chorus = violinEffects.get('chorus');
				if (chorus) violinOutput = violinOutput.connect(chorus);
			}
			if (this.settings.instruments.violin.effects.filter.enabled) {
				const filter = violinEffects.get('filter');
				if (filter) violinOutput = violinOutput.connect(filter);
			}
		}
		violinOutput.connect(this.volume);
		this.instruments.set('violin', violinSampler);

		// Cello - using Sampler with cello samples
		const celloSampler = new Sampler(configs.cello);
		const celloVolume = new Volume(-6);
		this.instrumentVolumes.set('cello', celloVolume);
		
		let celloOutput = celloSampler.connect(celloVolume);
		
		// Connect cello to its specific effects based on settings
		const celloEffects = this.instrumentEffects.get('cello');
		if (celloEffects && this.settings.instruments.cello.effects) {
			if (this.settings.instruments.cello.effects.reverb.enabled) {
				const reverb = celloEffects.get('reverb');
				if (reverb) celloOutput = celloOutput.connect(reverb);
			}
			if (this.settings.instruments.cello.effects.chorus.enabled) {
				const chorus = celloEffects.get('chorus');
				if (chorus) celloOutput = celloOutput.connect(chorus);
			}
			if (this.settings.instruments.cello.effects.filter.enabled) {
				const filter = celloEffects.get('filter');
				if (filter) celloOutput = celloOutput.connect(filter);
			}
		}
		celloOutput.connect(this.volume);
		this.instruments.set('cello', celloSampler);

		// Guitar - using Sampler with guitar samples
		const guitarSampler = new Sampler(configs.guitar);
		const guitarVolume = new Volume(-6);
		this.instrumentVolumes.set('guitar', guitarVolume);
		
		let guitarOutput = guitarSampler.connect(guitarVolume);
		
		// Connect guitar to its specific effects based on settings
		const guitarEffects = this.instrumentEffects.get('guitar');
		if (guitarEffects && this.settings.instruments.guitar.effects) {
			if (this.settings.instruments.guitar.effects.reverb.enabled) {
				const reverb = guitarEffects.get('reverb');
				if (reverb) guitarOutput = guitarOutput.connect(reverb);
			}
			if (this.settings.instruments.guitar.effects.chorus.enabled) {
				const chorus = guitarEffects.get('chorus');
				if (chorus) guitarOutput = guitarOutput.connect(chorus);
			}
			if (this.settings.instruments.guitar.effects.filter.enabled) {
				const filter = guitarEffects.get('filter');
				if (filter) guitarOutput = guitarOutput.connect(filter);
			}
		}
		guitarOutput.connect(this.volume);
		this.instruments.set('guitar', guitarSampler);

		// Harp - using Sampler with harp samples
		const harpSampler = new Sampler(configs.harp);
		const harpVolume = new Volume(-6);
		this.instrumentVolumes.set('harp', harpVolume);
		
		let harpOutput = harpSampler.connect(harpVolume);
		
		// Connect harp to its specific effects based on settings
		const harpEffects = this.instrumentEffects.get('harp');
		if (harpEffects && this.settings.instruments.harp.effects) {
			if (this.settings.instruments.harp.effects.reverb.enabled) {
				const reverb = harpEffects.get('reverb');
				if (reverb) harpOutput = harpOutput.connect(reverb);
			}
			if (this.settings.instruments.harp.effects.chorus.enabled) {
				const chorus = harpEffects.get('chorus');
				if (chorus) harpOutput = harpOutput.connect(chorus);
			}
			if (this.settings.instruments.harp.effects.filter.enabled) {
				const filter = harpEffects.get('filter');
				if (filter) harpOutput = harpOutput.connect(filter);
			}
		}
		harpOutput.connect(this.volume);
		this.instruments.set('harp', harpSampler);

		// Trumpet - using Sampler with trumpet samples
		const trumpetSampler = new Sampler(configs.trumpet);
		const trumpetVolume = new Volume(-6);
		this.instrumentVolumes.set('trumpet', trumpetVolume);
		
		let trumpetOutput = trumpetSampler.connect(trumpetVolume);
		
		// Connect trumpet to its specific effects based on settings
		const trumpetEffects = this.instrumentEffects.get('trumpet');
		if (trumpetEffects && this.settings.instruments.trumpet.effects) {
			if (this.settings.instruments.trumpet.effects.reverb.enabled) {
				const reverb = trumpetEffects.get('reverb');
				if (reverb) trumpetOutput = trumpetOutput.connect(reverb);
			}
			if (this.settings.instruments.trumpet.effects.chorus.enabled) {
				const chorus = trumpetEffects.get('chorus');
				if (chorus) trumpetOutput = trumpetOutput.connect(chorus);
			}
			if (this.settings.instruments.trumpet.effects.filter.enabled) {
				const filter = trumpetEffects.get('filter');
				if (filter) trumpetOutput = trumpetOutput.connect(filter);
			}
		}
		trumpetOutput.connect(this.volume);
		this.instruments.set('trumpet', trumpetSampler);

		// French Horn - using Sampler with french horn samples
		const frenchHornSampler = new Sampler(configs.frenchHorn);
		const frenchHornVolume = new Volume(-6);
		this.instrumentVolumes.set('frenchHorn', frenchHornVolume);
		
		let frenchHornOutput = frenchHornSampler.connect(frenchHornVolume);
		
		// Connect french horn to its specific effects based on settings
		const frenchHornEffects = this.instrumentEffects.get('frenchHorn');
		if (frenchHornEffects && this.settings.instruments.frenchHorn.effects) {
			if (this.settings.instruments.frenchHorn.effects.reverb.enabled) {
				const reverb = frenchHornEffects.get('reverb');
				if (reverb) frenchHornOutput = frenchHornOutput.connect(reverb);
			}
			if (this.settings.instruments.frenchHorn.effects.chorus.enabled) {
				const chorus = frenchHornEffects.get('chorus');
				if (chorus) frenchHornOutput = frenchHornOutput.connect(chorus);
			}
			if (this.settings.instruments.frenchHorn.effects.filter.enabled) {
				const filter = frenchHornEffects.get('filter');
				if (filter) frenchHornOutput = frenchHornOutput.connect(filter);
			}
		}
		frenchHornOutput.connect(this.volume);
		this.instruments.set('frenchHorn', frenchHornSampler);

		// Trombone - using Sampler with trombone samples
		const tromboneSampler = new Sampler(configs.trombone);
		const tromboneVolume = new Volume(-6);
		this.instrumentVolumes.set('trombone', tromboneVolume);
		
		let tromboneOutput = tromboneSampler.connect(tromboneVolume);
		
		// Connect trombone to its specific effects based on settings
		const tromboneEffects = this.instrumentEffects.get('trombone');
		if (tromboneEffects && this.settings.instruments.trombone.effects) {
			if (this.settings.instruments.trombone.effects.reverb.enabled) {
				const reverb = tromboneEffects.get('reverb');
				if (reverb) tromboneOutput = tromboneOutput.connect(reverb);
			}
			if (this.settings.instruments.trombone.effects.chorus.enabled) {
				const chorus = tromboneEffects.get('chorus');
				if (chorus) tromboneOutput = tromboneOutput.connect(chorus);
			}
			if (this.settings.instruments.trombone.effects.filter.enabled) {
				const filter = tromboneEffects.get('filter');
				if (filter) tromboneOutput = tromboneOutput.connect(filter);
			}
		}
		tromboneOutput.connect(this.volume);
		this.instruments.set('trombone', tromboneSampler);

		// Tuba - using Sampler with tuba samples
		const tubaSampler = new Sampler(configs.tuba);
		const tubaVolume = new Volume(-6);
		this.instrumentVolumes.set('tuba', tubaVolume);
		
		let tubaOutput = tubaSampler.connect(tubaVolume);
		
		// Connect tuba to its specific effects based on settings
		const tubaEffects = this.instrumentEffects.get('tuba');
		if (tubaEffects && this.settings.instruments.tuba.effects) {
			if (this.settings.instruments.tuba.effects.reverb.enabled) {
				const reverb = tubaEffects.get('reverb');
				if (reverb) tubaOutput = tubaOutput.connect(reverb);
			}
			if (this.settings.instruments.tuba.effects.chorus.enabled) {
				const chorus = tubaEffects.get('chorus');
				if (chorus) tubaOutput = tubaOutput.connect(chorus);
			}
			if (this.settings.instruments.tuba.effects.filter.enabled) {
				const filter = tubaEffects.get('filter');
				if (filter) tubaOutput = tubaOutput.connect(filter);
			}
		}
		tubaOutput.connect(this.volume);
		this.instruments.set('tuba', tubaSampler);

		// Initialize persistent whale synthesizer for environmental sounds
		this.initializeWhaleSynthesizer();

		// Initialize any missing instruments dynamically (for instruments not manually coded above)
		this.initializeMissingInstruments();

		// Apply initial volume settings from plugin settings
		this.applyInstrumentSettings();

		logger.debug('instruments', 'All sampled instruments initialized', {
			instrumentCount: this.instruments.size,
			instruments: Array.from(this.instruments.keys()),
			volumeControls: Array.from(this.instrumentVolumes.keys())
		});
	}

	/**
	 * Initialize persistent whale synthesizer for environmental sounds
	 */
	private initializeWhaleSynthesizer(): void {
		logger.debug('environmental', 'Initializing persistent whale synthesizer');

		// Create persistent whale synthesizer with FM synthesis
		const whaleSynth = new PolySynth(FMSynth, {
			harmonicity: 0.5,
			modulationIndex: 12,
			oscillator: { type: 'sine' },
			modulation: { type: 'sine' },
			envelope: {
				attack: 0.3 + (Math.random() * 0.4), // 0.3-0.7 second attack
				decay: 0.5,
				sustain: 0.9,
				release: 2.0 + (Math.random() * 3.0) // 2-5 second release
			},
			modulationEnvelope: {
				attack: 1.0,
				decay: 0.5,
				sustain: 0.6,
				release: 4.0
			}
		});

		// Create volume control for whale
		const whaleVolume = new Volume(-6);
		this.instrumentVolumes.set('whaleHumpback', whaleVolume);

		// Create persistent effects for whale
		const whaleReverb = new Reverb({
			decay: 8.0, // Very long reverb for oceanic effect
			wet: 0.4
		});
		
		const whaleChorus = new Chorus({
			frequency: 0.3, // Very slow chorus for underwater movement
			depth: 0.8,
			delayTime: 8,
			feedback: 0.1
		});

		// Generate reverb and connect chain
		whaleReverb.generate().then(() => {
			// Connect: whale -> reverb -> chorus -> volume -> master
			whaleSynth.connect(whaleReverb).connect(whaleChorus).connect(whaleVolume).connect(this.volume);
			logger.debug('environmental', 'Whale synthesizer effects chain connected');
		}).catch((error) => {
			logger.warn('environmental', 'Failed to generate whale reverb, using fallback', error);
			// Fallback without reverb
			whaleSynth.connect(whaleChorus).connect(whaleVolume).connect(this.volume);
		});

		// Store persistent synthesizer and effects
		this.instruments.set('whaleHumpback', whaleSynth);
		
		// Store effects for potential later control
		if (!this.instrumentEffects.has('whaleHumpback')) {
			this.instrumentEffects.set('whaleHumpback', new Map());
		}
		const whaleEffects = this.instrumentEffects.get('whaleHumpback');
		if (whaleEffects) {
			whaleEffects.set('reverb', whaleReverb);
			whaleEffects.set('chorus', whaleChorus);
		}

		logger.info('environmental', 'Persistent whale synthesizer initialized successfully');
	}

	/**
	 * Initialize any instruments that exist in SAMPLER_CONFIGS but weren't manually created above
	 */
	private initializeMissingInstruments(): void {
		const configs = this.getSamplerConfigs();
		const configKeys = Object.keys(configs);
		const initializedKeys = Array.from(this.instruments.keys());
		const missingKeys = configKeys.filter(key => !initializedKeys.includes(key));

		logger.debug('instruments', 'Initializing missing instruments', {
			totalConfigs: configKeys.length,
			alreadyInitialized: initializedKeys.length,
			missing: missingKeys.length,
			missingInstruments: missingKeys,
			audioFormat: this.settings.audioFormat,
			synthesisMode: this.settings.audioFormat === 'synthesis'
		});

		// In synthesis mode, create basic synthesizers instead of loading samples
		if (this.settings.audioFormat === 'synthesis') {
			logger.info('instruments', 'Synthesis-only mode - creating basic synthesizers');
			missingKeys.forEach(instrumentName => {
				// Create basic polyphonic synthesizer
				const synth = new PolySynth(FMSynth, {
					oscillator: { type: 'sine' },
					envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.0 }
				});
				
				// Create volume control
				const volume = new Volume(-6);
				this.instrumentVolumes.set(instrumentName, volume);
				
				// Connect synth → volume → master
				synth.connect(volume);
				if (this.volume) {
					volume.connect(this.volume);
				}
				
				// Add to instruments map
				this.instruments.set(instrumentName, synth);
				
				logger.debug('instruments', `Created synthesis instrument: ${instrumentName}`);
			});
			return;
		}

		// Continue with sample-based initialization for non-synthesis mode

		missingKeys.forEach(instrumentName => {
			try {
				// Environmental instruments prefer synthesis over samples until sample downloading is implemented
				if (this.isEnvironmentalInstrument(instrumentName)) {
					logger.debug('instruments', `Environmental instrument ${instrumentName} will use synthesis - samples can be downloaded later`);
					
					// Create volume control for environmental instruments
					const volume = new Volume(-6);
					this.instrumentVolumes.set(instrumentName, volume);
					logger.debug('instruments', `Created volume control for environmental instrument: ${instrumentName}`);
					return;
				}
				
				const config = configs[instrumentName as keyof typeof configs];
				
				// Create sampler with error handling
				const sampler = new Sampler({
					...config,
					onload: () => {
						logger.debug('samples', `${instrumentName} samples loaded successfully`);
					},
					onerror: (error) => {
						logger.warn('samples', `${instrumentName} samples failed to load, using basic synthesis`, { error });
					}
				});

				// Create volume control
				const volume = new Volume(-6);
				this.instrumentVolumes.set(instrumentName, volume);

				// Connect to effects if available
				let output = sampler.connect(volume);
				const effects = this.instrumentEffects.get(instrumentName);
				const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];

				if (effects && instrumentSettings?.effects) {
					if (instrumentSettings.effects.reverb?.enabled) {
						const reverb = effects.get('reverb');
						if (reverb) output = output.connect(reverb);
					}
					if (instrumentSettings.effects.chorus?.enabled) {
						const chorus = effects.get('chorus');
						if (chorus) output = output.connect(chorus);
					}
					if (instrumentSettings.effects.filter?.enabled) {
						const filter = effects.get('filter');
						if (filter) output = output.connect(filter);
					}
				}

				// Connect to master volume
				output.connect(this.volume);
				
				// Register the instrument
				this.instruments.set(instrumentName, sampler);
				
				logger.debug('instruments', `Dynamically initialized ${instrumentName}`);
			} catch (error) {
				logger.error('instruments', `Failed to initialize ${instrumentName}`, { error });
			}
		});
	}

	async playSequence(sequence: MusicalMapping[]): Promise<void> {
		if (!this.isInitialized || !this.instruments.size) {
			logger.warn('playback', 'AudioEngine not initialized, initializing now');
			await this.initialize();
		}

		if (this.isPlaying) {
			logger.info('playback', 'Stopping current sequence before starting new one');
			this.stop();
		}

		// Detailed sequence validation
		if (sequence.length === 0) {
			logger.error('playback', 'Empty sequence provided');
			throw new Error('No musical sequence to play');
		}

		// Check for valid musical data
		const invalidNotes = sequence.filter(note => 
			!note.pitch || !note.duration || note.pitch <= 0 || note.duration <= 0
		);
		
		if (invalidNotes.length > 0) {
			logger.error('playback', 'Invalid notes in sequence', {
				invalidCount: invalidNotes.length,
				examples: invalidNotes.slice(0, 3)
			});
		}

		logger.info('playback', 'Starting sequence playback', {
			noteCount: sequence.length,
			totalDuration: this.getSequenceDuration(sequence),
			pitchRange: {
				min: Math.min(...sequence.map(n => n.pitch)),
				max: Math.max(...sequence.map(n => n.pitch))
			},
			durationRange: {
				min: Math.min(...sequence.map(n => n.duration)),
				max: Math.max(...sequence.map(n => n.duration))
			}
		});

		try {
			logger.debug('playback', 'Processing musical sequence', { noteCount: sequence.length });

			// Process sequence directly without harmonic engine for now
			const processedSequence = sequence;

			this.currentSequence = processedSequence;
			this.isPlaying = true;
			this.scheduledEvents = [];

			// Ensure Transport is stopped and reset
			if (getTransport().state === 'started') {
				getTransport().stop();
				getTransport().cancel(); // Clear all scheduled events
			}

			// Set a reasonable loop length for the transport
			const sequenceDuration = this.getSequenceDuration(processedSequence);
			getTransport().loopEnd = sequenceDuration + 2; // Add buffer

			logger.info('debug', 'Starting sequence playback', { 
				sequenceDuration: sequenceDuration.toFixed(2),
				transportState: getTransport().state,
				currentTime: getContext().currentTime.toFixed(3)
			});

			// Real-time scheduling - start playback timer
			this.startRealtimePlayback(processedSequence);

			logger.info('playback', 'Real-time playback system started', {
				noteCount: processedSequence.length,
				sequenceDuration: sequenceDuration.toFixed(2),
				audioContextState: getContext().state
			});

			// Test audio connection with immediate tone
			const testSynth = this.instruments.get('piano');
			if (testSynth) {
				logger.info('test', 'Playing immediate test tone to verify audio connection');
				testSynth.triggerAttackRelease(440, '8n', '+0.1');
			}
		} catch (error) {
			logger.error('playback', 'Error processing sequence', {
				error: error instanceof Error ? {
					name: error.name,
					message: error.message,
					stack: error.stack
				} : error,
				sequenceLength: sequence?.length || 0,
				isInitialized: this.isInitialized,
				instrumentCount: this.instruments.size,
				audioContextState: getContext().state
			});
			throw error;
		}
	}

	private startRealtimePlayback(sequence: MusicalMapping[]): void {
		logger.info('playback', 'Starting real-time playback system', {
			noteCount: sequence.length,
			maxDuration: Math.max(...sequence.map(n => n.timing + n.duration))
		});

		// Clear any existing timer
		if (this.realtimeTimer !== null) {
			clearInterval(this.realtimeTimer);
		}

		// Record start time
		this.realtimeStartTime = getContext().currentTime;
		
		// Start the audio context if suspended
		if (getContext().state === 'suspended') {
			getContext().resume();
			logger.debug('context', 'Resumed suspended audio context for real-time playback');
		}

		// Use a 50ms interval for smooth playback timing
		this.realtimeTimer = setInterval(() => {
			if (!this.isPlaying) {
				if (this.realtimeTimer !== null) {
					clearInterval(this.realtimeTimer);
					this.realtimeTimer = null;
				}
				return;
			}

			const currentTime = getContext().currentTime;
			const elapsedTime = currentTime - this.realtimeStartTime;

			// Find notes that should play now (within the next 100ms)
			const notesToPlay = sequence.filter(note => 
				note.timing <= elapsedTime + 0.1 && 
				note.timing > elapsedTime - 0.05 && 
				!note.hasBeenTriggered
			);

			for (const mapping of notesToPlay) {
				// Mark as triggered to prevent re-triggering
				mapping.hasBeenTriggered = true;

				const frequency = mapping.pitch;
				const duration = mapping.duration;
				const velocity = mapping.velocity;

				logger.debug('trigger', `Real-time trigger at ${elapsedTime.toFixed(3)}s: ${frequency.toFixed(1)}Hz for ${duration.toFixed(2)}s`);

				// Determine which instrument to use
				const instrumentName = mapping.instrument || this.getDefaultInstrument(mapping);

				// Check if instrument is enabled in settings
				const instrumentKey = instrumentName as keyof typeof this.settings.instruments;
				const instrumentSettings = this.settings.instruments[instrumentKey];
				if (!instrumentSettings?.enabled) {
					logger.debug('playback', 'Skipping disabled instrument', { 
						instrumentName, 
						enabled: instrumentSettings?.enabled 
					});
					continue;
				}

				// Log the note trigger for debugging
				logger.debug('playback', 'Note triggered in real-time', {
					nodeId: mapping.nodeId,
					instrument: instrumentName,
					frequency: frequency.toFixed(2),
					duration: duration.toFixed(2),
					velocity: velocity.toFixed(2),
					elapsedTime: elapsedTime.toFixed(3)
				});

				// Use specialized synthesis engines if available
				if (this.percussionEngine && this.isPercussionInstrument(instrumentName)) {
					this.triggerAdvancedPercussion(instrumentName, frequency, duration, velocity, currentTime);
				} else if (this.electronicEngine && this.isElectronicInstrument(instrumentName)) {
					this.triggerAdvancedElectronic(instrumentName, frequency, duration, velocity, currentTime);
				} else if (this.isEnvironmentalInstrument(instrumentName)) {
					this.triggerEnvironmentalSound(instrumentName, frequency, duration, velocity, currentTime);
				} else {
					const synth = this.instruments.get(instrumentName);
					if (synth) {
						synth.triggerAttackRelease(frequency, duration, currentTime, velocity);
					}
				}
			}

			// Check if sequence is complete
			const maxEndTime = Math.max(...sequence.map(n => n.timing + n.duration));
			if (elapsedTime > maxEndTime + 1.0) { // Add 1 second buffer
				logger.info('playback', 'Real-time sequence completed');
				this.stop();
			}
		}, 50); // Check every 50ms for smooth timing
	}

	stop(): void {
		if (!this.isPlaying) {
			logger.debug('playback', 'Stop called but no sequence is playing');
			return;
		}

		logger.info('playback', 'Stopping sequence playback');

		this.isPlaying = false;

		// Clear real-time timer
		if (this.realtimeTimer !== null) {
			clearInterval(this.realtimeTimer);
			this.realtimeTimer = null;
		}

		// Stop and reset transport
		if (getTransport().state === 'started') {
			getTransport().stop();
		}
		getTransport().cancel(); // Clear all scheduled events

		// Clear our tracked scheduled events
		this.scheduledEvents.forEach(eventId => {
			getTransport().clear(eventId);
		});
		this.scheduledEvents = [];

		// Release all synth voices
		this.instruments.forEach((synth, instrumentName) => {
			synth.releaseAll();
		});

		this.currentSequence = [];

		logger.info('playback', 'Sequence stopped and Transport reset');
	}

	updateSettings(settings: SonigraphSettings): void {
		this.settings = settings;
		this.updateVolume();
		
		// Apply effect settings if engine is initialized
		if (this.isInitialized) {
			this.applyEffectSettings();
		}
		
		logger.debug('settings', 'Audio settings updated', {
			volume: settings.volume,
			tempo: settings.tempo,
			effectsApplied: this.isInitialized
		});
	}

	/**
	 * Update reverb effect parameters for a specific instrument
	 */
	updateReverbSettings(settings: { decay?: number; preDelay?: number; wet?: number }, instrument: string): void {
		const instrumentEffects = this.instrumentEffects.get(instrument);
		const reverb = instrumentEffects?.get('reverb');
		if (reverb) {
			if (settings.decay !== undefined) {
				reverb.decay = settings.decay;
			}
			if (settings.preDelay !== undefined) {
				reverb.preDelay = settings.preDelay;
			}
			if (settings.wet !== undefined) {
				reverb.wet.value = settings.wet;
			}
			logger.debug('effects', `Reverb settings updated for ${instrument}`, settings);
		} else {
			logger.warn('effects', `Reverb effect not found for instrument: ${instrument}`);
		}
	}

	/**
	 * Update chorus effect parameters for a specific instrument
	 */
	updateChorusSettings(settings: { frequency?: number; delayTime?: number; depth?: number; feedback?: number; spread?: number }, instrument: string): void {
		const instrumentEffects = this.instrumentEffects.get(instrument);
		const chorus = instrumentEffects?.get('chorus');
		if (chorus) {
			if (settings.frequency !== undefined) {
				chorus.frequency.value = settings.frequency;
			}
			if (settings.delayTime !== undefined) {
				chorus.delayTime = settings.delayTime;
			}
			if (settings.depth !== undefined) {
				chorus.depth = settings.depth;
			}
			if (settings.feedback !== undefined) {
				chorus.feedback.value = settings.feedback;
			}
			if (settings.spread !== undefined) {
				chorus.spread = settings.spread;
			}
			logger.debug('effects', `Chorus settings updated for ${instrument}`, settings);
		} else {
			logger.warn('effects', `Chorus effect not found for instrument: ${instrument}`);
		}
	}

	/**
	 * Update filter effect parameters for a specific instrument
	 */
	updateFilterSettings(settings: { frequency?: number; Q?: number; type?: 'lowpass' | 'highpass' | 'bandpass' }, instrument: string): void {
		const instrumentEffects = this.instrumentEffects.get(instrument);
		const filter = instrumentEffects?.get('filter');
		if (filter) {
			if (settings.frequency !== undefined) {
				filter.frequency.value = settings.frequency;
			}
			if (settings.Q !== undefined) {
				filter.Q.value = settings.Q;
			}
			if (settings.type !== undefined) {
				filter.type = settings.type;
			}
			logger.debug('effects', `Filter settings updated for ${instrument}`, settings);
		} else {
			logger.warn('effects', `Filter effect not found for instrument: ${instrument}`);
		}
	}

	/**
	 * Enable or disable reverb effect for a specific instrument
	 */
	setReverbEnabled(enabled: boolean, instrument: string): void {
		const instrumentEffects = this.instrumentEffects.get(instrument);
		const reverb = instrumentEffects?.get('reverb');
		if (reverb) {
			const instrumentSettings = (this.settings.instruments as any)[instrument];
			const wetLevel = instrumentSettings?.effects?.reverb?.params?.wet as number || 0.25;
			reverb.wet.value = enabled ? wetLevel : 0;
			logger.debug('effects', `Reverb ${enabled ? 'enabled' : 'disabled'} for ${instrument}`);
		} else {
			logger.warn('effects', `Reverb effect not found for instrument: ${instrument}`);
		}
	}

	/**
	 * Enable or disable chorus effect for a specific instrument
	 */
	setChorusEnabled(enabled: boolean, instrument: string): void {
		const instrumentEffects = this.instrumentEffects.get(instrument);
		const chorus = instrumentEffects?.get('chorus');
		if (chorus) {
			chorus.wet.value = enabled ? 1 : 0; // Full wet when enabled, dry when disabled
			logger.debug('effects', `Chorus ${enabled ? 'enabled' : 'disabled'} for ${instrument}`);
		} else {
			logger.warn('effects', `Chorus effect not found for instrument: ${instrument}`);
		}
	}

	/**
	 * Enable or disable filter effect for a specific instrument
	 */
	setFilterEnabled(enabled: boolean, instrument: string): void {
		const instrumentEffects = this.instrumentEffects.get(instrument);
		const filter = instrumentEffects?.get('filter');
		if (filter) {
			// For filters, we can't use wet/dry, so we bypass by setting frequency very high or very low
			if (enabled) {
				const instrumentSettings = (this.settings.instruments as any)[instrument];
				const cutoffFreq = instrumentSettings?.effects?.filter?.params?.frequency as number || 3500;
				filter.frequency.value = cutoffFreq; // Restore saved cutoff
			} else {
				filter.frequency.value = 20000; // Effectively bypass (above audible range)
			}
			logger.debug('effects', `Filter ${enabled ? 'enabled' : 'disabled'} for ${instrument}`);
		} else {
			logger.warn('effects', `Filter effect not found for instrument: ${instrument}`);
		}
	}

	/**
	 * Get current effect states for all instruments
	 */
	getEffectStates(): { [instrument: string]: { reverb: boolean; chorus: boolean; filter: boolean } } {
		const states: { [instrument: string]: { reverb: boolean; chorus: boolean; filter: boolean } } = {};
		
		this.instrumentEffects.forEach((effectMap, instrumentName) => {
			const reverb = effectMap.get('reverb');
			const chorus = effectMap.get('chorus');
			const filter = effectMap.get('filter');

			states[instrumentName] = {
				reverb: reverb ? reverb.wet.value > 0 : false,
				chorus: chorus ? chorus.wet.value > 0 : false,
				filter: filter ? filter.frequency.value < 15000 : false // Consider enabled if cutoff is reasonable
			};
		});

		return states;
	}

	/**
	 * Update individual instrument volume
	 */
	updateInstrumentVolume(instrumentKey: string, volume: number): void {
		const instrumentVolume = this.instrumentVolumes.get(instrumentKey);
		if (instrumentVolume) {
			const previousVolume = instrumentVolume.volume.value;
			const dbVolume = Math.log10(Math.max(0.01, volume)) * 20; // Convert to dB
			instrumentVolume.volume.value = dbVolume;
			logger.debug('instrument-control', `Updated ${instrumentKey} volume: ${volume} (${dbVolume.toFixed(1)}dB), previous: ${previousVolume.toFixed(1)}dB`);
		} else {
			logger.error('instrument-control', `No volume control found for ${instrumentKey} in updateInstrumentVolume`);
		}
	}

	/**
	 * Update instrument voice limit
	 */
	updateInstrumentVoices(instrumentKey: string, maxVoices: number): void {
		const instrument = this.instruments.get(instrumentKey);
		if (instrument) {
			// Only PolySynth has maxPolyphony property, Samplers handle polyphony internally
			if ('maxPolyphony' in instrument) {
				instrument.maxPolyphony = maxVoices;
				logger.debug('instrument-control', `Updated ${instrumentKey} max voices to ${maxVoices}`);
			} else {
				logger.debug('instrument-control', `${instrumentKey} is a Sampler - polyphony handled internally`);
			}
		}
	}

	/**
	 * Enable or disable an instrument
	 */
	setInstrumentEnabled(instrumentKey: string, enabled: boolean): void {
		const instrumentVolume = this.instrumentVolumes.get(instrumentKey);
		if (instrumentVolume) {
			if (enabled) {
				// Re-enable instrument by setting volume to stored settings
				const instrumentSettings = this.settings.instruments[instrumentKey as 'piano' | 'organ' | 'strings'];
				if (instrumentSettings) {
					logger.debug('instrument-control', `Re-enabling ${instrumentKey} with volume ${instrumentSettings.volume}`);
					this.updateInstrumentVolume(instrumentKey, instrumentSettings.volume);
					logger.debug('instrument-control', `${instrumentKey} volume after re-enable: ${instrumentVolume.volume.value}`);
				} else {
					logger.warn('instrument-control', `No settings found for ${instrumentKey}`);
				}
			} else {
				// Disable by setting volume to -Infinity (mute)
				logger.debug('instrument-control', `Disabling ${instrumentKey}, setting volume to -Infinity`);
				instrumentVolume.volume.value = -Infinity;
				logger.debug('instrument-control', `${instrumentKey} volume after disable: ${instrumentVolume.volume.value}`);
			}
			logger.debug('instrument-control', `${enabled ? 'Enabled' : 'Disabled'} ${instrumentKey}`);
		} else {
			logger.error('instrument-control', `No volume control found for ${instrumentKey}`);
		}
	}

	/**
	 * Apply initial instrument settings from plugin configuration
	 */
	private applyInstrumentSettings(): void {
		logger.debug('instrument-settings', 'Applying initial instrument settings', this.settings.instruments);
		
		Object.entries(this.settings.instruments).forEach(([instrumentKey, instrumentSettings]) => {
			logger.debug('instrument-settings', `Processing ${instrumentKey}:`, instrumentSettings);
			
			// Apply volume setting
			this.updateInstrumentVolume(instrumentKey, instrumentSettings.volume);
			
			// Apply voice limit
			this.updateInstrumentVoices(instrumentKey, instrumentSettings.maxVoices);
			
			// Apply enabled/disabled state
			this.setInstrumentEnabled(instrumentKey, instrumentSettings.enabled);
		});
		
		logger.debug('instrument-settings', 'Applied initial instrument settings', this.settings.instruments);
	}

	/**
	 * Update volume setting
	 */
	updateVolume(): void {
		if (this.isInitialized && this.volume) {
			// Convert from 0-1 range to decibels (Tone.js expects dB values)
			const dbValue = this.settings.volume === 0 ? -Infinity : 20 * Math.log10(this.settings.volume);
			this.volume.volume.value = dbValue;
			logger.debug('audio', 'Master volume updated', { 
				rawValue: this.settings.volume, 
				dbValue 
			});
		}
	}

	private getSequenceDuration(sequence: MusicalMapping[]): number {
		if (sequence.length === 0) return 0;
		
		return Math.max(...sequence.map(mapping => mapping.timing + mapping.duration));
	}

	private handleSequenceComplete(): void {
		logger.info('playback', 'Sequence playback completed');
		this.isPlaying = false;
		this.currentSequence = [];
		this.scheduledEvents = [];
	}

	private getDefaultInstrument(mapping: MusicalMapping): string {
		const enabledInstruments = this.getEnabledInstruments();
		
		if (enabledInstruments.length === 0) {
			return 'piano'; // Fallback if no instruments enabled
		}
		
		if (enabledInstruments.length === 1) {
			return enabledInstruments[0];
		}
		
		// Implement different voice assignment strategies
		switch (this.settings.voiceAssignmentStrategy) {
			case 'frequency':
				return this.assignByFrequency(mapping, enabledInstruments);
			
			case 'round-robin':
				return this.assignByRoundRobin(mapping, enabledInstruments);
			
			case 'connection-based':
				return this.assignByConnections(mapping, enabledInstruments);
			
			default:
				return this.assignByFrequency(mapping, enabledInstruments);
		}
	}

	private getEnabledInstruments(): string[] {
		const enabled: string[] = [];
		Object.entries(this.settings.instruments).forEach(([instrumentKey, settings]) => {
			if (settings.enabled) {
				enabled.push(instrumentKey);
			}
		});
		return enabled;
	}

	private assignByFrequency(mapping: MusicalMapping, enabledInstruments: string[]): string {
		// Distribute based on pitch ranges, but only among enabled instruments
		// Updated for 34 total instruments (Phase 8B: Complete Orchestral Vision + Environmental Sounds)
		const sortedInstruments = enabledInstruments.sort();
		
		if (mapping.pitch > 1600) {
			// Ultra high pitch - prefer flute, xylophone if available
			if (enabledInstruments.includes('flute')) return 'flute';
			if (enabledInstruments.includes('xylophone')) return 'xylophone';
			if (enabledInstruments.includes('celesta')) return 'celesta';
			return enabledInstruments.includes('piano') ? 'piano' : sortedInstruments[0];
		} else if (mapping.pitch > 1400) {
			// Very high pitch - prefer piano, celesta, xylophone if available
			if (enabledInstruments.includes('piano')) return 'piano';
			if (enabledInstruments.includes('celesta')) return 'celesta';
			if (enabledInstruments.includes('xylophone')) return 'xylophone';
			return sortedInstruments[0];
		} else if (mapping.pitch > 1200) {
			// High-mid pitch - prefer soprano, clarinet, violin, oboe if available
			if (enabledInstruments.includes('soprano')) return 'soprano';
			if (enabledInstruments.includes('clarinet')) return 'clarinet';
			if (enabledInstruments.includes('violin')) return 'violin';
			if (enabledInstruments.includes('oboe')) return 'oboe';
			return enabledInstruments.includes('choir') ? 'choir' : sortedInstruments[0];
		} else if (mapping.pitch > 1000) {
			// High pitch - prefer choir, alto, vibraphone if available
			if (enabledInstruments.includes('choir')) return 'choir';
			if (enabledInstruments.includes('alto')) return 'alto';
			if (enabledInstruments.includes('vibraphone')) return 'vibraphone';
			return enabledInstruments.includes('clarinet') ? 'clarinet' : sortedInstruments[0];
		} else if (mapping.pitch > 800) {
			// Mid-high pitch - prefer vocalPads, guitar, tenor if available
			if (enabledInstruments.includes('vocalPads')) return 'vocalPads';
			if (enabledInstruments.includes('guitar')) return 'guitar';
			if (enabledInstruments.includes('tenor')) return 'tenor';
			return enabledInstruments.includes('organ') ? 'organ' : sortedInstruments[0];
		} else if (mapping.pitch > 600) {
			// Mid pitch - prefer organ, accordion, frenchHorn if available
			if (enabledInstruments.includes('organ')) return 'organ';
			if (enabledInstruments.includes('accordion')) return 'accordion';
			if (enabledInstruments.includes('frenchHorn')) return 'frenchHorn';
			return sortedInstruments[0];
		} else if (mapping.pitch > 400) {
			// Mid-low pitch - prefer saxophone, harpsichord, trumpet if available
			if (enabledInstruments.includes('saxophone')) return 'saxophone';
			if (enabledInstruments.includes('harpsichord')) return 'harpsichord';
			if (enabledInstruments.includes('trumpet')) return 'trumpet';
			return enabledInstruments.includes('organ') ? 'organ' : sortedInstruments[0];
		} else if (mapping.pitch > 300) {
			// Low-mid pitch - prefer pad, electricPiano, cello, trombone if available
			if (enabledInstruments.includes('pad')) return 'pad';
			if (enabledInstruments.includes('electricPiano')) return 'electricPiano';
			if (enabledInstruments.includes('cello')) return 'cello';
			if (enabledInstruments.includes('trombone')) return 'trombone';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		} else if (mapping.pitch > 200) {
			// Low pitch - prefer strings, harp, timpani, bassSynth, whaleHumpback if available
			if (enabledInstruments.includes('strings')) return 'strings';
			if (enabledInstruments.includes('harp')) return 'harp';
			if (enabledInstruments.includes('timpani')) return 'timpani';
			if (enabledInstruments.includes('bassSynth')) return 'bassSynth';
			if (enabledInstruments.includes('whaleHumpback')) return 'whaleHumpback';
			return sortedInstruments[0];
		} else if (mapping.pitch > 100) {
			// Very low pitch - prefer bass voice, tuba, bassSynth, whaleHumpback if available
			if (enabledInstruments.includes('bass')) return 'bass';
			if (enabledInstruments.includes('tuba')) return 'tuba';
			if (enabledInstruments.includes('bassSynth')) return 'bassSynth';
			if (enabledInstruments.includes('whaleHumpback')) return 'whaleHumpback';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		} else {
			// Ultra low pitch - prefer gongs, whaleHumpback, tuba, bass if available
			if (enabledInstruments.includes('gongs')) return 'gongs';
			if (enabledInstruments.includes('whaleHumpback')) return 'whaleHumpback';
			if (enabledInstruments.includes('leadSynth')) return 'leadSynth';
			if (enabledInstruments.includes('tuba')) return 'tuba';
			if (enabledInstruments.includes('bass')) return 'bass';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		}
	}

	private assignByRoundRobin(mapping: MusicalMapping, enabledInstruments: string[]): string {
		// Cycle through enabled instruments
		const instrumentIndex = this.voiceAssignments.size % enabledInstruments.length;
		return enabledInstruments[instrumentIndex];
	}

	private assignByConnections(mapping: MusicalMapping, enabledInstruments: string[]): string {
		// For now, use a hash of the nodeId to distribute consistently
		// This could be enhanced to use actual graph connection data
		const hash = this.simpleHash(mapping.nodeId);
		const instrumentIndex = hash % enabledInstruments.length;
		return enabledInstruments[instrumentIndex];
	}

	private simpleHash(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}

	/**
	 * Get current playback status
	 */
	getStatus(): {
		isInitialized: boolean;
		isPlaying: boolean;
		currentNotes: number;
		audioContext: string;
		volume: number;
	} {
		return {
			isInitialized: this.isInitialized,
			isPlaying: this.isPlaying,
			currentNotes: this.currentSequence.length,
			audioContext: getContext().state,
			volume: this.settings.volume
		};
	}

	/**
	 * Play a single test note
	 */
	async playTestNote(frequency: number = 440): Promise<void> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		if (this.instruments.size > 0) {
			logger.debug('test', 'Playing test note', { frequency });
			this.instruments.forEach((synth, instrumentName) => {
				if (instrumentName === 'piano') {
					synth.triggerAttackRelease(frequency, '4n');
				}
			});
		}
	}

	/**
	 * Clean up resources
	 */
	dispose(): void {
		logger.info('cleanup', 'Disposing AudioEngine');

		this.stop();

		this.instruments.forEach((synth, instrumentName) => {
			synth.dispose();
		});
		this.instruments.clear();

		this.instrumentVolumes.forEach((volume, instrumentName) => {
			volume.dispose();
		});
		this.instrumentVolumes.clear();

		if (this.volume) {
			this.volume.dispose();
			this.volume = null;
		}

		this.instrumentEffects.forEach((effect, instrumentName) => {
			effect.forEach((effectInstance, effectName) => {
				effectInstance.dispose();
			});
		});
		this.instrumentEffects.clear();

		this.isInitialized = false;

		logger.info('cleanup', 'AudioEngine disposed');
	}

	private applyEffectSettings(): void {
		if (!this.settings.instruments || !this.isInitialized) return;

		try {
			// Apply effect settings for each instrument
			Object.keys(this.settings.instruments).forEach(instrumentName => {
				const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
				if (!instrumentSettings?.effects) return;

				// Apply reverb settings
				const reverbSettings = instrumentSettings.effects.reverb;
				if (reverbSettings) {
					this.setReverbEnabled(reverbSettings.enabled, instrumentName);
					if (reverbSettings.params.decay) {
						this.updateReverbSettings({ decay: reverbSettings.params.decay as number }, instrumentName);
					}
					if (reverbSettings.params.preDelay) {
						this.updateReverbSettings({ preDelay: reverbSettings.params.preDelay as number }, instrumentName);
					}
					if (reverbSettings.params.wet) {
						this.updateReverbSettings({ wet: reverbSettings.params.wet as number }, instrumentName);
					}
				}

				// Apply chorus settings
				const chorusSettings = instrumentSettings.effects.chorus;
				if (chorusSettings) {
					this.setChorusEnabled(chorusSettings.enabled, instrumentName);
					if (chorusSettings.params.frequency) {
						this.updateChorusSettings({ frequency: chorusSettings.params.frequency as number }, instrumentName);
					}
					if (chorusSettings.params.depth) {
						this.updateChorusSettings({ depth: chorusSettings.params.depth as number }, instrumentName);
					}
					if (chorusSettings.params.delayTime) {
						this.updateChorusSettings({ delayTime: chorusSettings.params.delayTime as number }, instrumentName);
					}
					if (chorusSettings.params.feedback) {
						this.updateChorusSettings({ feedback: chorusSettings.params.feedback as number }, instrumentName);
					}
				}

				// Apply filter settings
				const filterSettings = instrumentSettings.effects.filter;
				if (filterSettings) {
					this.setFilterEnabled(filterSettings.enabled, instrumentName);
					if (filterSettings.params.frequency) {
						this.updateFilterSettings({ frequency: filterSettings.params.frequency as number }, instrumentName);
					}
					if (filterSettings.params.Q) {
						this.updateFilterSettings({ Q: filterSettings.params.Q as number }, instrumentName);
					}
					if (filterSettings.params.type) {
						this.updateFilterSettings({ type: filterSettings.params.type as 'lowpass' | 'highpass' | 'bandpass' }, instrumentName);
					}
				}
			});

			logger.debug('effects', 'Applied per-instrument effect settings from plugin settings', {
				instruments: Object.keys(this.settings.instruments)
			});

		} catch (error) {
			logger.error('effects', 'Failed to apply effect settings', error);
		}
	}

	/**
	 * Apply an effect preset to a specific instrument
	 */
	applyEffectPreset(presetKey: string, instrumentName: string): void {
		const preset = EFFECT_PRESETS[presetKey];
		if (!preset) {
			console.warn(`Effect preset '${presetKey}' not found`);
			return;
		}

		if (!this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']]) {
			console.warn(`Instrument '${instrumentName}' not found in settings`);
			return;
		}

		// Apply preset to settings
		const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
		if (instrumentSettings) {
			// Update settings with preset values - types now match perfectly
			instrumentSettings.effects.reverb.enabled = preset.effects.reverb.enabled;
			instrumentSettings.effects.reverb.params = { ...preset.effects.reverb.params };
			
			instrumentSettings.effects.chorus.enabled = preset.effects.chorus.enabled;
			instrumentSettings.effects.chorus.params = { ...preset.effects.chorus.params };
			
			instrumentSettings.effects.filter.enabled = preset.effects.filter.enabled;
			instrumentSettings.effects.filter.params = { ...preset.effects.filter.params };

			// Apply to audio engine if initialized
			if (this.isInitialized) {
				// Apply reverb
				this.setReverbEnabled(preset.effects.reverb.enabled, instrumentName);
				if (preset.effects.reverb.enabled) {
					this.updateReverbSettings(preset.effects.reverb.params, instrumentName);
				}

				// Apply chorus
				this.setChorusEnabled(preset.effects.chorus.enabled, instrumentName);
				if (preset.effects.chorus.enabled) {
					this.updateChorusSettings(preset.effects.chorus.params, instrumentName);
				}

				// Apply filter  
				this.setFilterEnabled(preset.effects.filter.enabled, instrumentName);
				if (preset.effects.filter.enabled) {
					this.updateFilterSettings(preset.effects.filter.params, instrumentName);
				}
			}
		}
	}

	/**
	 * Apply an effect preset to all enabled instruments
	 */
	applyEffectPresetToAll(presetKey: string): void {
		const preset = EFFECT_PRESETS[presetKey];
		if (!preset) {
			console.warn(`Effect preset '${presetKey}' not found`);
			return;
		}

		// Apply to all enabled instruments
		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
			if (instrumentSettings?.enabled) {
				this.applyEffectPreset(presetKey, instrumentName);
			}
		});
	}

	/**
	 * Create a custom preset from current instrument settings
	 */
	createCustomPreset(instrumentName: string, presetName: string, description: string): EffectPreset | null {
		const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
		if (!instrumentSettings) {
			console.warn(`Instrument '${instrumentName}' not found in settings`);
			return null;
		}

		return {
			name: presetName,
			description: description,
			category: 'custom',
			effects: {
				reverb: { ...instrumentSettings.effects.reverb },
				chorus: { ...instrumentSettings.effects.chorus },
				filter: { ...instrumentSettings.effects.filter }
			}
		};
	}

	/**
	 * Reset instrument effects to default settings
	 */
	resetInstrumentEffects(instrumentName: string): void {
		// Find the default settings for this instrument
		const defaultInstrumentSettings = DEFAULT_SETTINGS.instruments[instrumentName as keyof SonigraphSettings['instruments']];
		if (!defaultInstrumentSettings) {
			console.warn(`Default settings for instrument '${instrumentName}' not found`);
			return;
		}

		// Apply default settings
		const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
		if (instrumentSettings) {
			// Reset to defaults - types now match perfectly
			instrumentSettings.effects.reverb.enabled = defaultInstrumentSettings.effects.reverb.enabled;
			instrumentSettings.effects.reverb.params = { ...defaultInstrumentSettings.effects.reverb.params };
			
			instrumentSettings.effects.chorus.enabled = defaultInstrumentSettings.effects.chorus.enabled;
			instrumentSettings.effects.chorus.params = { ...defaultInstrumentSettings.effects.chorus.params };
			
			instrumentSettings.effects.filter.enabled = defaultInstrumentSettings.effects.filter.enabled;
			instrumentSettings.effects.filter.params = { ...defaultInstrumentSettings.effects.filter.params };

			// Apply to audio engine if initialized
			if (this.isInitialized) {
				// Apply reverb
				this.setReverbEnabled(defaultInstrumentSettings.effects.reverb.enabled, instrumentName);
				if (defaultInstrumentSettings.effects.reverb.enabled) {
					this.updateReverbSettings(defaultInstrumentSettings.effects.reverb.params, instrumentName);
				}

				// Apply chorus
				this.setChorusEnabled(defaultInstrumentSettings.effects.chorus.enabled, instrumentName);
				if (defaultInstrumentSettings.effects.chorus.enabled) {
					this.updateChorusSettings(defaultInstrumentSettings.effects.chorus.params, instrumentName);
				}

				// Apply filter  
				this.setFilterEnabled(defaultInstrumentSettings.effects.filter.enabled, instrumentName);
				if (defaultInstrumentSettings.effects.filter.enabled) {
					this.updateFilterSettings(defaultInstrumentSettings.effects.filter.params, instrumentName);
				}
			}
		}
	}

	/**
	 * Enable real-time parameter preview mode
	 */
	enableParameterPreview(instrumentName: string): void {
		this.isPreviewMode = true;
		this.previewInstrument = instrumentName;
		
		// Play a sustained preview note for this instrument
		this.startPreviewNote(instrumentName);
	}

	/**
	 * Disable real-time parameter preview mode
	 */
	disableParameterPreview(): void {
		this.isPreviewMode = false;
		this.previewInstrument = null;
		
		// Stop the preview note
		this.stopPreviewNote();
	}

	/**
	 * Start a sustained preview note for parameter testing
	 */
	private startPreviewNote(instrumentName: string): void {
		if (!this.isInitialized || this.previewNote) return;

		try {
			const synth = this.instruments.get(instrumentName);
			if (synth) {
				// Play a middle C for 10 seconds as preview
				this.previewNote = synth.triggerAttack('C4');
				
				// Auto-stop after 10 seconds
				setTimeout(() => {
					this.stopPreviewNote();
				}, 10000);
			}
		} catch (error) {
			console.warn('Failed to start preview note:', error);
		}
	}

	/**
	 * Stop the preview note
	 */
	private stopPreviewNote(): void {
		if (this.previewNote && this.previewInstrument) {
			try {
				const synth = this.instruments.get(this.previewInstrument);
				if (synth) {
					synth.triggerRelease('C4');
				}
			} catch (error) {
				console.warn('Failed to stop preview note:', error);
			}
		}
		this.previewNote = null;
	}

	/**
	 * Apply parameter change with real-time preview
	 */
	previewParameterChange(instrumentName: string, effectType: string, paramName: string, value: number, delay: number = 50): void {
		// Clear existing timeout for this parameter
		const timeoutKey = `${instrumentName}-${effectType}-${paramName}`;
		const existingTimeout = this.previewTimeouts.get(timeoutKey);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		// Apply change immediately for real-time feedback
		this.applyParameterChangeImmediate(instrumentName, effectType, paramName, value);

		// Set debounced timeout for final commit
		const timeout = window.setTimeout(() => {
			this.commitParameterChange(instrumentName, effectType, paramName, value);
			this.previewTimeouts.delete(timeoutKey);
		}, delay);

		this.previewTimeouts.set(timeoutKey, timeout);
	}

	/**
	 * Apply parameter change immediately (for preview)
	 */
	private applyParameterChangeImmediate(instrumentName: string, effectType: string, paramName: string, value: number): void {
		if (!this.isInitialized) return;

		try {
			const effectMap = this.instrumentEffects.get(instrumentName);
			if (!effectMap) return;

			const effect = effectMap.get(effectType);
			if (!effect) return;

			// Apply parameter change based on effect type
			switch (effectType) {
				case 'reverb':
					if (paramName === 'decay') effect.decay = value;
					else if (paramName === 'preDelay') effect.preDelay = value;
					else if (paramName === 'wet') effect.wet.value = value;
					break;
				case 'chorus':
					if (paramName === 'frequency') effect.frequency.value = value;
					else if (paramName === 'depth') effect.depth.value = value;
					else if (paramName === 'delayTime') effect.delayTime.value = value;
					else if (paramName === 'feedback') effect.feedback.value = value;
					break;
				case 'filter':
					if (paramName === 'frequency') effect.frequency.value = value;
					else if (paramName === 'Q') effect.Q.value = value;
					else if (paramName === 'type') effect.type = value;
					break;
			}
		} catch (error) {
			console.warn('Failed to apply immediate parameter change:', error);
		}
	}

	/**
	 * Commit parameter change (for settings persistence)
	 */
	private commitParameterChange(instrumentName: string, effectType: string, paramName: string, value: number): void {
		// This would typically save to settings - handled by the UI layer
		console.debug(`Parameter committed: ${instrumentName}.${effectType}.${paramName} = ${value}`);
	}

	/**
	 * Toggle effect bypass for A/B comparison
	 */
	toggleEffectBypass(instrumentName: string, effectType: string): boolean {
		if (!this.bypassStates.has(instrumentName)) {
			this.bypassStates.set(instrumentName, new Map());
		}

		const instrumentBypasses = this.bypassStates.get(instrumentName)!;
		const currentBypass = instrumentBypasses.get(effectType) || false;
		const newBypass = !currentBypass;
		
		instrumentBypasses.set(effectType, newBypass);

		// Apply bypass state to audio engine
		this.applyEffectBypass(instrumentName, effectType, newBypass);

		return newBypass;
	}

	/**
	 * Apply effect bypass state
	 */
	private applyEffectBypass(instrumentName: string, effectType: string, bypassed: boolean): void {
		if (!this.isInitialized) return;

		try {
			const effectMap = this.instrumentEffects.get(instrumentName);
			if (!effectMap) return;

			const effect = effectMap.get(effectType);
			if (!effect) return;

			// Bypass by setting wet to 0 or restoring original wet value
			if (effectType === 'reverb' || effectType === 'chorus') {
				if (bypassed) {
					effect.wet.value = 0;
				} else {
					// Restore from settings
					const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
					if (instrumentSettings?.effects[effectType as keyof typeof instrumentSettings.effects]) {
						const effectSettings = instrumentSettings.effects[effectType as keyof typeof instrumentSettings.effects];
						if ('wet' in effectSettings.params) {
							effect.wet.value = effectSettings.params.wet as number;
						}
					}
				}
			} else if (effectType === 'filter') {
				// For filter, bypass by setting frequency very high or restoring
				if (bypassed) {
					effect.frequency.value = 20000; // Effectively no filtering
				} else {
					const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
					if (instrumentSettings?.effects.filter) {
						effect.frequency.value = instrumentSettings.effects.filter.params.frequency as number;
					}
				}
			}
		} catch (error) {
			console.warn('Failed to apply effect bypass:', error);
		}
	}

	/**
	 * Get effect bypass state
	 */
	isEffectBypassed(instrumentName: string, effectType: string): boolean {
		const instrumentBypasses = this.bypassStates.get(instrumentName);
		return instrumentBypasses?.get(effectType) || false;
	}


	/**
	 * Update performance metrics
	 */
	private updatePerformanceMetrics(): void {
		if (!this.isInitialized) return;

		try {
			// Get current audio context state - handle missing properties safely
			const audioContext = getContext() as any;
			const baseLatency = audioContext.baseLatency || 0;
			const outputLatency = audioContext.outputLatency || 0;
			const currentLatency = baseLatency + outputLatency;
			
			// Estimate CPU usage based on active voices and effects
			let estimatedCPU = 0;
			
			this.instruments.forEach((synth, instrumentName) => {
				const activeVoices = (synth as any).activeVoices || 0;
				estimatedCPU += activeVoices * 5; // 5% per voice estimate
				
				// Add effect overhead
				const effectMap = this.instrumentEffects.get(instrumentName);
				if (effectMap) {
					effectMap.forEach((effect, effectType) => {
						if (effectType === 'reverb' && effect.wet.value > 0) estimatedCPU += 10;
						if (effectType === 'chorus' && effect.wet.value > 0) estimatedCPU += 5;
						if (effectType === 'filter') estimatedCPU += 2;
					});
				}
			});

			// Cap at 100%
			estimatedCPU = Math.min(estimatedCPU, 100);

			this.performanceMetrics.set('overall', {
				cpuUsage: estimatedCPU,
				latency: currentLatency * 1000 // Convert to milliseconds
			});
		} catch (error) {
			console.warn('Failed to update performance metrics:', error);
		}
	}

	/**
	 * Get current performance metrics
	 */
	getPerformanceMetrics(): { cpuUsage: number; latency: number } {
		return this.performanceMetrics.get('overall') || { cpuUsage: 0, latency: 0 };
	}

	// Phase 3.5: Enhanced Effect Routing API Methods

	/**
	 * Enable enhanced effect routing for the audio engine
	 */
	async enableEnhancedRouting(): Promise<void> {
		if (this.enhancedRouting) {
			logger.warn('enhanced-routing', 'Enhanced routing already enabled');
			return;
		}

		// Migrate settings and reinitialize
		this.settings = migrateToEnhancedRouting(this.settings);
		this.settings.enhancedRouting!.enabled = true;

		// Reinitialize with enhanced routing
		await this.initializeEnhancedRouting();
		
		logger.info('enhanced-routing', 'Enhanced routing enabled successfully');
	}

	/**
	 * Disable enhanced effect routing and revert to classic mode
	 */
	async disableEnhancedRouting(): Promise<void> {
		if (!this.enhancedRouting) {
			logger.warn('enhanced-routing', 'Enhanced routing already disabled');
			return;
		}

		this.enhancedRouting = false;
		this.settings.enhancedRouting!.enabled = false;

		// Clear enhanced routing data
		this.effectChains.clear();
		this.sendBuses.clear();
		this.returnBuses.clear();
		this.masterEffectsNodes.clear();
		this.effectNodeInstances.clear();

		// Reinitialize with classic effects
		await this.initializeEffects();
		this.applyEffectSettings();

		logger.info('enhanced-routing', 'Enhanced routing disabled, reverted to classic mode');
	}

	/**
	 * Get the current effect chain for an instrument
	 */
	getEffectChain(instrumentName: string): EffectNode[] | null {
		if (!this.enhancedRouting) {
			logger.warn('enhanced-routing', 'Enhanced routing not enabled');
			return null;
		}

		return this.effectChains.get(instrumentName) || null;
	}

	/**
	 * Reorder effects in an instrument's effect chain
	 */
	async reorderEffectChain(instrumentName: string, newOrder: string[]): Promise<void> {
		if (!this.enhancedRouting) {
			throw new Error('Enhanced routing not enabled');
		}

		const effectChain = this.effectChains.get(instrumentName);
		if (!effectChain) {
			throw new Error(`No effect chain found for instrument: ${instrumentName}`);
		}

		// Create new ordered chain
		const reorderedChain: EffectNode[] = [];
		const effectMap = new Map(effectChain.map(node => [node.id, node]));

		for (let i = 0; i < newOrder.length; i++) {
			const effectId = newOrder[i];
			const effect = effectMap.get(effectId);
			if (effect) {
				effect.order = i;
				reorderedChain.push(effect);
			}
		}

		// Update the chain
		this.effectChains.set(instrumentName, reorderedChain);

		// Reconnect the instrument with new order
		await this.reconnectInstrument(instrumentName);

		logger.debug('enhanced-routing', `Effect chain reordered for ${instrumentName}`, {
			newOrder
		});
	}

	/**
	 * Add a new effect to an instrument's effect chain
	 */
	async addEffectToChain(instrumentName: string, effectType: 'reverb' | 'chorus' | 'filter' | 'delay' | 'distortion' | 'compressor', position?: number): Promise<string> {
		if (!this.enhancedRouting) {
			throw new Error('Enhanced routing not enabled');
		}

		const effectChain = this.effectChains.get(instrumentName) || [];
		const effectId = `${instrumentName}-${effectType}-${Date.now()}`;

		// Create default settings for the effect type
		const defaultSettings = this.getDefaultEffectSettings(effectType);
		
		const newEffect: EffectNode = {
			id: effectId,
			type: effectType,
			enabled: true,
			order: position !== undefined ? position : effectChain.length,
			settings: defaultSettings,
			bypass: false
		};

		// Create the effect instance
		const effectInstance = await this.createEffectInstance(newEffect);
		if (effectInstance) {
			this.effectNodeInstances.set(effectId, effectInstance);
		}

		// Add to chain
		if (position !== undefined) {
			// Reorder existing effects
			effectChain.forEach(effect => {
				if (effect.order >= position) {
					effect.order++;
				}
			});
			effectChain.splice(position, 0, newEffect);
		} else {
			effectChain.push(newEffect);
		}

		this.effectChains.set(instrumentName, effectChain);

		// Reconnect the instrument
		await this.reconnectInstrument(instrumentName);

		logger.debug('enhanced-routing', `Added ${effectType} effect to ${instrumentName}`, {
			effectId,
			position
		});

		return effectId;
	}

	/**
	 * Remove an effect from an instrument's effect chain
	 */
	async removeEffectFromChain(instrumentName: string, effectId: string): Promise<void> {
		if (!this.enhancedRouting) {
			throw new Error('Enhanced routing not enabled');
		}

		const effectChain = this.effectChains.get(instrumentName);
		if (!effectChain) {
			throw new Error(`No effect chain found for instrument: ${instrumentName}`);
		}

		const effectIndex = effectChain.findIndex(effect => effect.id === effectId);
		if (effectIndex === -1) {
			throw new Error(`Effect ${effectId} not found in ${instrumentName} chain`);
		}

		// Remove the effect
		effectChain.splice(effectIndex, 1);

		// Reorder remaining effects
		effectChain.forEach((effect, index) => {
			effect.order = index;
		});

		// Cleanup effect instance
		const effectInstance = this.effectNodeInstances.get(effectId);
		if (effectInstance) {
			effectInstance.dispose();
			this.effectNodeInstances.delete(effectId);
		}

		this.effectChains.set(instrumentName, effectChain);

		// Reconnect the instrument
		await this.reconnectInstrument(instrumentName);

		logger.debug('enhanced-routing', `Removed effect ${effectId} from ${instrumentName}`);
	}

	/**
	 * Toggle an effect's enabled state
	 */
	async toggleEffect(instrumentName: string, effectId: string): Promise<void> {
		if (!this.enhancedRouting) {
			throw new Error('Enhanced routing not enabled');
		}

		const effectChain = this.effectChains.get(instrumentName);
		if (!effectChain) {
			throw new Error(`No effect chain found for instrument: ${instrumentName}`);
		}

		const effect = effectChain.find(e => e.id === effectId);
		if (!effect) {
			throw new Error(`Effect ${effectId} not found in ${instrumentName} chain`);
		}

		effect.enabled = !effect.enabled;

		// Reconnect the instrument to apply the change
		await this.reconnectInstrument(instrumentName);

		logger.debug('enhanced-routing', `Toggled effect ${effectId} for ${instrumentName}`, {
			enabled: effect.enabled
		});
	}

	/**
	 * Toggle an effect's bypass state in enhanced routing mode
	 */
	async toggleEnhancedEffectBypass(instrumentName: string, effectId: string): Promise<void> {
		if (!this.enhancedRouting) {
			throw new Error('Enhanced routing not enabled');
		}

		const effectChain = this.effectChains.get(instrumentName);
		if (!effectChain) {
			throw new Error(`No effect chain found for instrument: ${instrumentName}`);
		}

		const effect = effectChain.find(e => e.id === effectId);
		if (!effect) {
			throw new Error(`Effect ${effectId} not found in ${instrumentName} chain`);
		}

		effect.bypass = !effect.bypass;

		// Reconnect the instrument to apply the change
		await this.reconnectInstrument(instrumentName);

		logger.debug('enhanced-routing', `Toggled bypass for effect ${effectId} on ${instrumentName}`, {
			bypass: effect.bypass
		});
	}

	/**
	 * Update effect parameters
	 */
	updateEffectParameters(instrumentName: string, effectId: string, parameters: any): void {
		if (!this.enhancedRouting) {
			throw new Error('Enhanced routing not enabled');
		}

		const effectInstance = this.effectNodeInstances.get(effectId);
		if (!effectInstance) {
			throw new Error(`Effect instance ${effectId} not found`);
		}

		// Update the effect instance parameters
		Object.keys(parameters).forEach(paramName => {
			if (effectInstance[paramName] !== undefined) {
				effectInstance[paramName].value = parameters[paramName];
			}
		});

		// Update the stored settings
		const effectChain = this.effectChains.get(instrumentName);
		if (effectChain) {
			const effect = effectChain.find(e => e.id === effectId);
			if (effect) {
				effect.settings.params = { ...effect.settings.params, ...parameters };
			}
		}

		logger.debug('enhanced-routing', `Updated parameters for effect ${effectId}`, {
			instrumentName,
			parameters
		});
	}

	/**
	 * Get default effect settings for a given effect type
	 */
	private getDefaultEffectSettings(effectType: string): any {
		switch (effectType) {
			case 'reverb':
				return {
					enabled: true,
					params: { decay: 1.8, preDelay: 0.02, wet: 0.25 }
				};
			case 'chorus':
				return {
					enabled: true,
					params: { frequency: 0.8, delayTime: 4.0, depth: 0.5, feedback: 0.05 }
				};
			case 'filter':
				return {
					enabled: true,
					params: { frequency: 3500, type: 'lowpass', Q: 0.8 }
				};
			case 'delay':
				return {
					enabled: true,
					params: { delayTime: 0.25, feedback: 0.3, wet: 0.2, maxDelay: 1.0 }
				};
			case 'distortion':
				return {
					enabled: true,
					params: { distortion: 0.4, oversample: '2x', wet: 0.5 }
				};
			case 'compressor':
				return {
					enabled: true,
					params: { threshold: -18, ratio: 4, attack: 0.003, release: 0.1, knee: 30 }
				};
			default:
				throw new Error(`Unknown effect type: ${effectType}`);
		}
	}

	/**
	 * Reconnect an instrument with its current effect chain
	 */
	private async reconnectInstrument(instrumentName: string): Promise<void> {
		const instrument = this.instruments.get(instrumentName);
		const volume = this.instrumentVolumes.get(instrumentName);
		const effectNodes = this.effectChains.get(instrumentName);

		if (!instrument || !volume || !effectNodes) {
			logger.warn('enhanced-routing', `Cannot reconnect ${instrumentName}: missing components`);
			return;
		}

		// Disconnect existing connections
		instrument.disconnect();

		// Reconnect through the effect chain
		let output = instrument.connect(volume);

		// Process effects in order
		const sortedNodes = [...effectNodes].sort((a, b) => a.order - b.order);
		for (const node of sortedNodes) {
			if (node.enabled && !node.bypass) {
				const effect = this.effectNodeInstances.get(node.id);
				if (effect) {
					output = output.connect(effect);
				}
			}
		}

		// Connect to master chain
		this.connectToMasterChain(output);

		logger.debug('enhanced-routing', `Reconnected ${instrumentName} with updated effect chain`);
	}

	/**
	 * Get current enhanced routing status
	 */
	isEnhancedRoutingEnabled(): boolean {
		return this.enhancedRouting;
	}

	/**
	 * Get all available send buses
	 */
	getSendBuses(): Map<string, SendBus> {
		return new Map(this.sendBuses);
	}

	/**
	 * Get all available return buses
	 */
	getReturnBuses(): Map<string, ReturnBus> {
		return new Map(this.returnBuses);
	}

	// Phase 8: Advanced Percussion Methods
	
	/**
	 * Check if an instrument is a percussion instrument
	 */
	private isPercussionInstrument(instrumentName: string): boolean {
		return ['timpani', 'xylophone', 'vibraphone', 'gongs'].includes(instrumentName);
	}

	private isElectronicInstrument(instrumentName: string): boolean {
		return ['leadSynth', 'bassSynth', 'arpSynth'].includes(instrumentName);
	}

	private isEnvironmentalInstrument(instrumentName: string): boolean {
		return ['whaleHumpback'].includes(instrumentName);
	}

	/**
	 * Trigger advanced percussion with specialized synthesis
	 */
	private triggerAdvancedPercussion(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): void {
		if (!this.percussionEngine) return;

		// Convert frequency to note name for percussion engines
		const note = this.frequencyToNoteName(frequency);
		
		try {
			switch (instrumentName) {
				case 'timpani':
					// Add slight pitch bend for realistic timpani tuning
					const pitchBend = (Math.random() - 0.5) * 0.1; // ±0.05 semitones
					this.percussionEngine.triggerTimpani(note, velocity, duration, pitchBend);
					break;
					
				case 'xylophone':
					// Use harder mallets for brighter attack
					const hardness = Math.min(velocity * 1.2, 1.0);
					this.percussionEngine.triggerMallet('xylophone', note, velocity, duration, hardness);
					break;
					
				case 'vibraphone':
					// Softer mallets with motor enabled for sustained notes
					const motorEnabled = duration > 2.0; // Enable motor for long notes
					if (motorEnabled) {
						this.percussionEngine.setVibraphoneMotorEnabled(true);
					}
					this.percussionEngine.triggerMallet('vibraphone', note, velocity, duration, velocity * 0.7);
					break;
					
				case 'gongs':
					// Resonance based on velocity
					const resonance = Math.min(velocity * 1.5, 1.0);
					this.percussionEngine.triggerGong(note, velocity, duration, resonance);
					break;
			}
			
			logger.debug('advanced-percussion', `Triggered ${instrumentName}: ${note}, vel: ${velocity}, dur: ${duration}`);
		} catch (error) {
			logger.error('advanced-percussion', `Failed to trigger ${instrumentName}`, error);
			// Fall back to regular synthesis
			const synth = this.instruments.get(instrumentName);
			if (synth) {
				synth.triggerAttackRelease(frequency, duration, time, velocity);
			}
		}
	}

	/**
	 * Trigger advanced electronic synthesis with specialized modulation
	 */
	private triggerAdvancedElectronic(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): void {
		if (!this.electronicEngine) return;

		// Convert frequency to note name for electronic engines
		const note = this.frequencyToNoteName(frequency);
		
		try {
			switch (instrumentName) {
				case 'leadSynth':
					// Dynamic filter modulation based on frequency
					const filterMod = Math.min(frequency / 2000, 1.0); // Higher frequencies = more filter opening
					this.electronicEngine.triggerLeadSynth(note, velocity, duration, filterMod);
					break;
					
				case 'bassSynth':
					// Sub-oscillator level based on velocity and low frequencies
					const subLevel = frequency < 200 ? Math.min(velocity * 1.5, 1.0) : velocity * 0.5;
					this.electronicEngine.triggerBassSynth(note, velocity, duration, subLevel);
					break;
					
				case 'arpSynth':
					// Arpeggiator pattern based on note position in scale
					const patterns = ['up', 'down', 'updown'] as const;
					const patternIndex = Math.floor((frequency / 100) % patterns.length);
					this.electronicEngine.triggerArpSynth(note, velocity, duration, patterns[patternIndex]);
					break;
			}
			
			logger.debug('advanced-electronic', `Triggered ${instrumentName}: ${note}, vel: ${velocity}, dur: ${duration}`);
		} catch (error) {
			logger.error('advanced-electronic', `Failed to trigger ${instrumentName}`, error);
			// Fall back to regular synthesis
			const synth = this.instruments.get(instrumentName);
			if (synth) {
				synth.triggerAttackRelease(frequency, duration, time, velocity);
			}
		}
	}

	/**
	 * Trigger environmental sounds with specialized synthesis
	 */
	private triggerEnvironmentalSound(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): void {
		try {
			switch (instrumentName) {
				case 'whaleHumpback':
					// Use persistent whale synthesizer
					const whaleSynth = this.instruments.get('whaleHumpback') as PolySynth;
					if (!whaleSynth) {
						logger.warn('environmental-sound', 'Persistent whale synthesizer not found');
						return;
					}

					// Whale songs are often in very low frequencies with slow pitch bends
					const whaleFreq = Math.max(frequency * 0.5, 40); // Lower the frequency, minimum 40Hz
					whaleSynth.triggerAttackRelease(whaleFreq, duration, time, velocity * 0.8); // Match sequence duration, slightly quieter
					
					logger.debug('environmental-sound', `Whale sound triggered: ${whaleFreq.toFixed(1)}Hz, vel: ${(velocity * 0.8).toFixed(3)}, dur: ${duration.toFixed(3)}`);
					
					break;
			}
			
			logger.debug('environmental-sound', `Triggered ${instrumentName}: ${frequency.toFixed(1)}Hz, vel: ${velocity}, dur: ${duration}`);
		} catch (error) {
			logger.error('environmental-sound', `Failed to trigger ${instrumentName}`, error);
			// No fallback - environmental sounds should be silent if they fail
		}
	}

	/**
	 * Convert frequency to closest note name
	 */
	private frequencyToNoteName(frequency: number): string {
		const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		const referenceFreq = 440; // A4
		const semitoneRatio = Math.pow(2, 1/12);
		
		// Calculate semitones from A4
		const semitones = Math.round(12 * Math.log2(frequency / referenceFreq));
		
		// Calculate octave and note
		const octave = Math.floor((semitones + 9) / 12) + 4; // A4 is reference
		const noteIndex = ((semitones + 9) % 12 + 12) % 12;
		
		return `${noteNames[noteIndex]}${octave}`;
	}

	/**
	 * Dispose of advanced synthesis engines
	 */
	private disposeAdvancedSynthesis(): void {
		if (this.percussionEngine) {
			this.percussionEngine.dispose();
			this.percussionEngine = null;
		}
		
		if (this.electronicEngine) {
			this.electronicEngine.dispose();
			this.electronicEngine = null;
		}
	}

	/**
	 * Master effects controls for orchestral processing
	 */
	setMasterReverbDecay(decay: number): void {
		logger.debug('master-effects', `Setting master reverb decay: ${decay}s`);
		// Apply to all enabled instruments' reverb effects
		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			if (instrumentSettings?.enabled && instrumentSettings.effects.reverb.enabled) {
				instrumentSettings.effects.reverb.params.decay = decay;
				this.updateReverbSettings({ decay }, instrumentName);
			}
		});
	}

	setMasterBassBoost(boost: number): void {
		logger.debug('master-effects', `Setting master bass boost: ${boost}dB`);
		if (this.masterEQ) {
			this.masterEQ.low.value = boost;
		}
	}

	setMasterTrebleBoost(boost: number): void {
		logger.debug('master-effects', `Setting master treble boost: ${boost}dB`);
		if (this.masterEQ) {
			this.masterEQ.high.value = boost;
		}
	}

	setMasterCompression(ratio: number): void {
		logger.debug('master-effects', `Setting master compression: ${ratio}`);
		if (this.masterCompressor) {
			// Convert 0-1 range to compression parameters
			this.masterCompressor.threshold.value = -20 + (ratio * 15); // -20dB to -5dB
			this.masterCompressor.ratio.value = 2 + (ratio * 8); // 2:1 to 10:1
		}
	}

	private initializeMasterEffects(): void {
		logger.debug('master-effects', 'Initializing master effects chain');
		
		try {
			// Master reverb for orchestral hall simulation
			this.masterReverb = new Reverb({
				decay: 5.0,
				preDelay: 0.1,
				wet: 0.2 // Subtle by default
			});

			// Master 3-band EQ for tonal shaping
			this.masterEQ = new EQ3({
				low: 0,
				mid: 0, 
				high: 0,
				lowFrequency: 200,
				highFrequency: 3000
			});

			// Master compressor for dynamic control
			this.masterCompressor = new Compressor({
				threshold: -12,
				ratio: 3,
				attack: 0.003,
				release: 0.1
			});

			// Chain master effects to output
			if (this.volume) {
				// Create the master effects chain: EQ -> Compressor -> Reverb -> Output
				this.masterEQ.chain(this.masterCompressor, this.masterReverb, this.volume);
				
				// Reroute all instruments through master effects
				this.routeInstrumentsThroughMasterEffects();
			}

			logger.info('master-effects', 'Master effects chain initialized');
		} catch (error) {
			logger.error('master-effects', 'Failed to initialize master effects', error);
		}
	}

	private routeInstrumentsThroughMasterEffects(): void {
		if (!this.masterEQ) return;

		// Reroute all existing instruments through master effects
		this.instruments.forEach((instrument, instrumentName) => {
			// Disconnect from direct output and connect to master chain
			try {
				instrument.disconnect();
				instrument.connect(this.masterEQ!);
				logger.debug('master-effects', `Routed ${instrumentName} through master effects`);
			} catch (error) {
				logger.warn('master-effects', `Failed to route ${instrumentName} through master effects`, error);
			}
		});
	}

	private disposeMasterEffects(): void {
		if (this.masterReverb) {
			this.masterReverb.dispose();
			this.masterReverb = null;
		}
		
		if (this.masterEQ) {
			this.masterEQ.dispose();
			this.masterEQ = null;
		}
		
		if (this.masterCompressor) {
			this.masterCompressor.dispose();
			this.masterCompressor = null;
		}
		
		logger.debug('master-effects', 'Master effects disposed');
	}

	/**
	 * Performance optimization methods for 34-instrument orchestral load
	 */
	private initializePerformanceOptimization(): void {
		logger.debug('performance', 'Initializing performance optimization systems');
		
		// Pre-allocate voice pools for enabled instruments
		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			if (instrumentSettings?.enabled) {
				this.createVoicePool(instrumentName, instrumentSettings.maxVoices || 4);
			}
		});

		// Start adaptive quality monitoring
		this.startPerformanceMonitoring();
		
		logger.info('performance', 'Performance optimization initialized');
	}

	private createVoicePool(instrumentName: string, poolSize: number): void {
		const pool: any[] = [];
		for (let i = 0; i < poolSize; i++) {
			// Pre-allocate voice instances (simplified for now)
			pool.push({ available: true, lastUsed: 0 });
		}
		this.voicePool.set(instrumentName, pool);
		logger.debug('performance', `Created voice pool for ${instrumentName}: ${poolSize} voices`);
	}

	private startPerformanceMonitoring(): void {
		// Monitor performance every 5 seconds
		setInterval(() => {
			this.checkPerformanceAndAdapt();
		}, 5000);
	}

	private checkPerformanceAndAdapt(): void {
		if (!this.adaptiveQuality) return;

		const now = performance.now();
		const cpuUsage = this.estimateCPUUsage();
		const latency = (getContext() as any).baseLatency ? (getContext() as any).baseLatency * 1000 : 5; // Convert to ms or use 5ms default

		// Update metrics
		this.performanceMetrics.set('system', { cpuUsage, latency });

		// Adaptive quality adjustment
		if (cpuUsage > 80 && this.currentQualityLevel !== 'low') {
			this.reduceQuality();
		} else if (cpuUsage < 40 && this.currentQualityLevel !== 'high') {
			this.increaseQuality();
		}

		this.lastCPUCheck = now;
		logger.debug('performance', `CPU: ${cpuUsage.toFixed(1)}%, Latency: ${latency.toFixed(1)}ms, Quality: ${this.currentQualityLevel}`);
	}

	private estimateCPUUsage(): number {
		// Estimate CPU usage based on active voices and effects
		let activeVoices = 0;
		let activeEffects = 0;

		this.instruments.forEach((instrument, name) => {
			const instrumentSettings = this.settings.instruments[name as keyof typeof this.settings.instruments];
			if (instrumentSettings?.enabled) {
				activeVoices += instrumentSettings.maxVoices || 4;
				
				// Count active effects
				if (instrumentSettings.effects.reverb.enabled) activeEffects++;
				if (instrumentSettings.effects.chorus.enabled) activeEffects++;
				if (instrumentSettings.effects.filter.enabled) activeEffects++;
			}
		});

		// Simple heuristic: base load + voice load + effect load
		const baseLoad = 10; // Base system overhead
		const voiceLoad = activeVoices * 1.5; // ~1.5% per voice
		const effectLoad = activeEffects * 2; // ~2% per effect

		return Math.min(baseLoad + voiceLoad + effectLoad, 100);
	}

	private reduceQuality(): void {
		switch (this.currentQualityLevel) {
			case 'high':
				this.currentQualityLevel = 'medium';
				this.applyMediumQuality();
				break;
			case 'medium':
				this.currentQualityLevel = 'low';
				this.applyLowQuality();
				break;
		}
		logger.info('performance', `Reduced quality to ${this.currentQualityLevel} due to high CPU usage`);
	}

	private increaseQuality(): void {
		switch (this.currentQualityLevel) {
			case 'low':
				this.currentQualityLevel = 'medium';
				this.applyMediumQuality();
				break;
			case 'medium':
				this.currentQualityLevel = 'high';
				this.applyHighQuality();
				break;
		}
		logger.info('performance', `Increased quality to ${this.currentQualityLevel} due to low CPU usage`);
	}

	private applyHighQuality(): void {
		// Full quality: All effects enabled, full voice counts
		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			if (instrumentSettings?.enabled) {
				// Restore full voice count
				const instrument = this.instruments.get(instrumentName);
				if (instrument && 'maxPolyphony' in instrument) {
					(instrument as any).maxPolyphony = instrumentSettings.maxVoices || 8;
				}
			}
		});
	}

	private applyMediumQuality(): void {
		// Medium quality: Reduce voices, keep essential effects
		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			if (instrumentSettings?.enabled) {
				// Reduce voice count
				const instrument = this.instruments.get(instrumentName);
				if (instrument && 'maxPolyphony' in instrument) {
					(instrument as any).maxPolyphony = Math.max(Math.floor((instrumentSettings.maxVoices || 4) * 0.75), 2);
				}
			}
		});
	}

	private applyLowQuality(): void {
		// Low quality: Minimal voices, disable non-essential effects
		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			if (instrumentSettings?.enabled) {
				// Minimize voice count
				const instrument = this.instruments.get(instrumentName);
				if (instrument && 'maxPolyphony' in instrument) {
					(instrument as any).maxPolyphony = Math.max(Math.floor((instrumentSettings.maxVoices || 4) * 0.5), 1);
				}

				// Temporarily disable chorus and filter effects for performance
				if (instrumentSettings.effects.chorus.enabled) {
					this.setChorusEnabled(false, instrumentName);
				}
				if (instrumentSettings.effects.filter.enabled) {
					this.setFilterEnabled(false, instrumentName);
				}
			}
		});
	}

	/**
	 * Memory management for 34-instrument load
	 */
	private optimizeMemoryUsage(): void {
		// Clean up unused voice allocations
		this.voicePool.forEach((pool, instrumentName) => {
			const now = Date.now();
			pool.forEach(voice => {
				if (voice.lastUsed && (now - voice.lastUsed) > 30000) { // 30 seconds
					voice.available = true;
				}
			});
		});

		// Force garbage collection hint if supported
		if ('gc' in window && typeof (window as any).gc === 'function') {
			(window as any).gc();
		}

		logger.debug('performance', 'Memory optimization completed');
	}

	/**
	 * Public performance monitoring API
	 */
	getDetailedPerformanceMetrics(): {
		totalInstruments: number;
		enabledInstruments: number;
		activeVoices: number;
		activeEffects: number;
		cpuUsage: number;
		latency: number;
		qualityLevel: string;
		memoryEstimate: string;
	} {
		let enabledCount = 0;
		let totalVoices = 0;
		let totalEffects = 0;

		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			if (instrumentSettings?.enabled) {
				enabledCount++;
				totalVoices += instrumentSettings.maxVoices || 4;
				if (instrumentSettings.effects.reverb.enabled) totalEffects++;
				if (instrumentSettings.effects.chorus.enabled) totalEffects++;
				if (instrumentSettings.effects.filter.enabled) totalEffects++;
			}
		});

		const metrics = this.performanceMetrics.get('system') || { cpuUsage: 0, latency: 0 };
		
		return {
			totalInstruments: Object.keys(this.settings.instruments).length,
			enabledInstruments: enabledCount,
			activeVoices: totalVoices,
			activeEffects: totalEffects,
			cpuUsage: metrics.cpuUsage,
			latency: metrics.latency,
			qualityLevel: this.currentQualityLevel,
			memoryEstimate: this.estimateMemoryUsage()
		};
	}

	private estimateMemoryUsage(): string {
		// Rough memory estimation
		const enabledInstruments = Object.values(this.settings.instruments).filter(i => i?.enabled).length;
		const estimatedMB = enabledInstruments * 2 + 10; // ~2MB per instrument + 10MB base
		return `~${estimatedMB}MB`;
	}

	/**
	 * Emergency performance recovery
	 */
	enablePerformanceEmergencyMode(): void {
		logger.warn('performance', 'Activating emergency performance mode');
		
		// Disable all non-essential instruments (keep only the 5 defaults)
		const essentialInstruments = ['piano', 'strings', 'flute', 'clarinet', 'saxophone'];
		
		Object.keys(this.settings.instruments).forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			if (instrumentSettings && !essentialInstruments.includes(instrumentName)) {
				instrumentSettings.enabled = false;
			}
		});

		// Apply low quality settings
		this.currentQualityLevel = 'low';
		this.applyLowQuality();

		// Disable adaptive quality to prevent thrashing
		this.adaptiveQuality = false;

		logger.info('performance', 'Emergency performance mode activated - disabled non-essential instruments');
	}

	disablePerformanceEmergencyMode(): void {
		this.adaptiveQuality = true;
		this.currentQualityLevel = 'high';
		this.applyHighQuality();
		logger.info('performance', 'Emergency performance mode deactivated');
	}
} 