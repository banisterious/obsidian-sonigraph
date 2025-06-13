// Import Tone.js with ESM-compatible approach
import { start, Volume, PolySynth, Synth, FMSynth, AMSynth, Sampler, context, now, Transport, Reverb, Chorus, Filter } from 'tone';
import { MusicalMapping } from '../graph/types';
import { SonigraphSettings, EFFECT_PRESETS, EffectPreset, DEFAULT_SETTINGS } from '../utils/constants';
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

	constructor(private settings: SonigraphSettings) {
		logger.debug('initialization', 'AudioEngine created');
	}

	private getSamplerConfigs(): typeof SAMPLER_CONFIGS {
		// Replace [format] placeholder with actual format
		const format = this.settings.audioFormat;
		const configs = JSON.parse(JSON.stringify(SAMPLER_CONFIGS)) as typeof SAMPLER_CONFIGS;
		
		Object.values(configs).forEach(config => {
			Object.keys(config.urls).forEach(note => {
				const noteKey = note as keyof typeof config.urls;
				config.urls[noteKey] = config.urls[noteKey].replace('[format]', format);
			});
		});
		
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
			this.initializeEffects();
			this.applyEffectSettings();

			this.isInitialized = true;
			
			// Start performance monitoring
			this.startPerformanceMonitoring();
			
			logger.info('audio', 'AudioEngine initialized successfully');
		} catch (error) {
			logger.error('audio', 'Failed to initialize AudioEngine', error);
			throw error;
		}
	}

	private async initializeEffects(): Promise<void> {
		// Initialize per-instrument effects
		const instruments = ['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone'];
		
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

	private async initializeInstruments(): Promise<void> {
		const configs = this.getSamplerConfigs();
		
		// Piano - using Sampler with high-quality samples
		const pianoSampler = new Sampler(configs.piano);
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

		// Organ - using Sampler with harmonium samples
		const organSampler = new Sampler(configs.organ);
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

		// Strings - using Sampler with violin samples
		const stringsSampler = new Sampler(configs.strings);
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

		// Apply initial volume settings from plugin settings
		this.applyInstrumentSettings();

		logger.debug('instruments', 'All sampled instruments initialized', {
			instrumentCount: this.instruments.size,
			instruments: Array.from(this.instruments.keys()),
			volumeControls: Array.from(this.instrumentVolumes.keys())
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
			if (Transport.state === 'started') {
				Transport.stop();
				Transport.cancel(); // Clear all scheduled events
			}

			// Set a reasonable loop length for the transport
			const sequenceDuration = this.getSequenceDuration(processedSequence);
			Transport.loopEnd = sequenceDuration + 2; // Add buffer

			logger.info('debug', 'Starting sequence playback', { 
				sequenceDuration: sequenceDuration.toFixed(2),
				transportState: Transport.state,
				currentTime: context.currentTime.toFixed(3)
			});

			// Schedule all notes in the sequence
			for (const mapping of processedSequence) {
				const playTime = mapping.timing;
				const frequency = mapping.pitch;
				const duration = mapping.duration;
				const velocity = mapping.velocity;

				logger.debug('schedule', `Scheduling note: freq=${frequency.toFixed(1)}Hz, dur=${duration.toFixed(2)}s, vel=${velocity.toFixed(2)}, time=${playTime.toFixed(2)}s`);

				// Schedule note using Transport time
				const eventId = Transport.schedule((time: number) => {
					if (this.instruments.size > 0 && this.isPlaying) {
						logger.debug('trigger', `Triggering note at ${time.toFixed(3)}s: ${frequency.toFixed(1)}Hz for ${duration.toFixed(2)}s`);
						
						// Determine which instrument to use
						const instrumentName = mapping.instrument || this.getDefaultInstrument(mapping);
						const synth = this.instruments.get(instrumentName);
						
						if (synth) {
							synth.triggerAttackRelease(frequency, duration, time, velocity);
							logger.debug('playback', 'Note triggered', {
								nodeId: mapping.nodeId,
								instrument: instrumentName,
								frequency: frequency.toFixed(2),
								duration: duration.toFixed(2),
								velocity: velocity.toFixed(2),
								scheduledTime: playTime.toFixed(3),
								actualTime: time.toFixed(3)
							});
						} else {
							logger.warn('trigger', `Instrument ${instrumentName} not found, using piano`);
							const pianoSynth = this.instruments.get('piano');
							if (pianoSynth) {
								pianoSynth.triggerAttackRelease(frequency, duration, time, velocity);
							}
						}
					} else {
						logger.warn('trigger', 'Skipping note - instruments unavailable or stopped');
					}
				}, playTime);

				this.scheduledEvents.push(eventId);
			}

			// Schedule sequence end cleanup
			Transport.schedule(() => {
				logger.info('playback', 'Sequence completed via scheduler');
				this.handleSequenceComplete();
			}, sequenceDuration + 1); // Add 1 second buffer

			// Start transport
			logger.info('transport', 'Starting Tone.js Transport from time 0');
			Transport.start('+0.1'); // Start with small delay to ensure all events are scheduled

			logger.info('playback', 'Sequence scheduled and playing', {
				eventsScheduled: this.scheduledEvents.length,
				sequenceDuration: sequenceDuration.toFixed(2),
				transportState: Transport.state,
				audioContextState: context.state
			});

			// Play immediate test note to verify audio is working
			logger.info('test', 'Playing immediate test note to verify audio');
			if (this.instruments.size > 0) {
				this.instruments.forEach((synth, instrumentName) => {
					if (instrumentName === 'piano') {
						synth.triggerAttackRelease(440, '8n', '+0.05');
					}
				});
			}
		} catch (error) {
			logger.error('playback', 'Error processing sequence', error);
			throw error;
		}
	}

	stop(): void {
		if (!this.isPlaying) {
			logger.debug('playback', 'Stop called but no sequence is playing');
			return;
		}

		logger.info('playback', 'Stopping sequence playback');

		this.isPlaying = false;

		// Stop and reset transport
		if (Transport.state === 'started') {
			Transport.stop();
		}
		Transport.cancel(); // Clear all scheduled events

		// Clear our tracked scheduled events
		this.scheduledEvents.forEach(eventId => {
			Transport.clear(eventId);
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
		// Updated for 13 total instruments (9 existing + 4 new vocal sections)
		const sortedInstruments = enabledInstruments.sort();
		
		if (mapping.pitch > 1600) {
			// Ultra high pitch - prefer flute if available
			if (enabledInstruments.includes('flute')) return 'flute';
			return enabledInstruments.includes('piano') ? 'piano' : sortedInstruments[0];
		} else if (mapping.pitch > 1400) {
			// Very high pitch - prefer piano if available
			return enabledInstruments.includes('piano') ? 'piano' : sortedInstruments[0];
		} else if (mapping.pitch > 1200) {
			// High-mid pitch - prefer soprano, clarinet if available
			if (enabledInstruments.includes('soprano')) return 'soprano';
			if (enabledInstruments.includes('clarinet')) return 'clarinet';
			return enabledInstruments.includes('choir') ? 'choir' : sortedInstruments[0];
		} else if (mapping.pitch > 1000) {
			// High pitch - prefer choir, alto if available
			if (enabledInstruments.includes('choir')) return 'choir';
			if (enabledInstruments.includes('alto')) return 'alto';
			return enabledInstruments.includes('clarinet') ? 'clarinet' : sortedInstruments[0];
		} else if (mapping.pitch > 800) {
			// Mid-high pitch - prefer organ if available
			return enabledInstruments.includes('organ') ? 'organ' : sortedInstruments[0];
		} else if (mapping.pitch > 600) {
			// Mid-high pitch - prefer vocal pads, tenor if available
			if (enabledInstruments.includes('vocalPads')) return 'vocalPads';
			if (enabledInstruments.includes('tenor')) return 'tenor';
			return enabledInstruments.includes('organ') ? 'organ' : sortedInstruments[0];
		} else if (mapping.pitch > 400) {
			// Medium pitch - prefer organ if available
			return enabledInstruments.includes('organ') ? 'organ' : sortedInstruments[0];
		} else if (mapping.pitch > 300) {
			// Mid-low pitch - prefer saxophone if available
			if (enabledInstruments.includes('saxophone')) return 'saxophone';
			return enabledInstruments.includes('organ') ? 'organ' : sortedInstruments[0];
		} else if (mapping.pitch > 200) {
			// Low-medium pitch - prefer pad if available
			if (enabledInstruments.includes('pad')) return 'pad';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		} else if (mapping.pitch > 100) {
			// Low pitch - prefer strings if available
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		} else {
			// Very low pitch - prefer bass voice if available
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
			audioContext: context.state,
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
	 * Start performance monitoring
	 */
	startPerformanceMonitoring(): void {
		setInterval(() => {
			this.updatePerformanceMetrics();
		}, 1000); // Update every second
	}

	/**
	 * Update performance metrics
	 */
	private updatePerformanceMetrics(): void {
		if (!this.isInitialized) return;

		try {
			// Get current audio context state - handle missing properties safely
			const audioContext = context as any;
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
} 