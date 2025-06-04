// Import Tone.js with ESM-compatible approach
import { start, Volume, PolySynth, Synth, FMSynth, AMSynth, context, now, Transport, Reverb, Chorus, Filter } from 'tone';
import { MusicalMapping } from '../graph/types';
import { SonigraphSettings } from '../utils/constants';
import { getLogger } from '../logging';
import { HarmonicEngine, HarmonicSettings } from './harmonic-engine';

const logger = getLogger('audio-engine');

// Instrument voice configurations
const INSTRUMENT_CONFIGS = {
	piano: {
		synth: Synth,
		options: {
			oscillator: { type: 'triangle' as const },
			envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 1.2 }
		},
		effects: ['reverb']
	},
	organ: {
		synth: FMSynth,
		options: {
			harmonicity: 3,
			modulationIndex: 10,
			oscillator: { type: 'sine' as const },
			envelope: { attack: 0.01, decay: 0.01, sustain: 1, release: 0.5 },
			modulation: { type: 'square' as const },
			modulationEnvelope: { attack: 0.5, decay: 0.2, sustain: 0.2, release: 0.2 }
		},
		effects: ['chorus', 'reverb']
	},
	strings: {
		synth: AMSynth,
		options: {
			oscillator: { type: 'sawtooth' as const },
			envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 2.0 },
			modulation: { type: 'sine' as const },
			modulationEnvelope: { attack: 0.5, decay: 0.2, sustain: 0.2, release: 0.1 }
		},
		effects: ['reverb', 'filter']
	}
};

export interface VoiceAssignment {
	nodeId: string;
	instrument: keyof typeof INSTRUMENT_CONFIGS;
	voiceIndex: number;
}

export class AudioEngine {
	private instruments: Map<string, PolySynth> = new Map();
	private effects: Map<string, any> = new Map();
	private harmonicEngine: HarmonicEngine;
	private isInitialized = false;
	private isPlaying = false;
	private currentSequence: MusicalMapping[] = [];
	private scheduledEvents: number[] = [];
	private volume: Volume | null = null;
	private voiceAssignments: Map<string, VoiceAssignment> = new Map();
	private maxVoicesPerInstrument = 8;

	constructor(private settings: SonigraphSettings) {
		logger.debug('initialization', 'AudioEngine created');
		
		// Initialize harmonic engine with default settings
		this.harmonicEngine = new HarmonicEngine({
			maxSimultaneousNotes: 6,
			enableChordProgression: true,
			consonanceStrength: 0.7,
			voiceSpreadMin: 2
		});
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			logger.debug('initialization', 'AudioEngine already initialized');
			return;
		}

		const startTime = logger.time('audio-initialization');

		try {
			// Initialize Tone.js audio context
			await start();
			logger.debug('initialization', 'Tone.js audio context started');

			// Create master volume control
			this.volume = new Volume(-6); // Start at -6dB
			this.volume.toDestination();

			// Initialize effects
			await this.initializeEffects();

			// Initialize instruments
			await this.initializeInstruments();

			// Apply volume setting
			this.updateVolume();

			this.isInitialized = true;
			startTime();

			logger.info('initialization', 'Multi-instrument AudioEngine initialized', {
				instruments: Array.from(this.instruments.keys()),
				effects: Array.from(this.effects.keys()),
				audioContext: context.state
			});

		} catch (error) {
			logger.error('initialization', 'Failed to initialize AudioEngine', error);
			throw new Error('Failed to initialize audio engine: ' + error.message);
		}
	}

	private async initializeEffects(): Promise<void> {
		// Reverb for spatial depth
		const reverb = new Reverb({
			decay: 2.0,
			preDelay: 0.01,
			wet: 0.3
		});
		await reverb.generate();
		this.effects.set('reverb', reverb);

		// Chorus for richness
		const chorus = new Chorus({
			frequency: 1.5,
			delayTime: 3.5,
			depth: 0.7,
			feedback: 0.1,
			spread: 180
		});
		chorus.start();
		this.effects.set('chorus', chorus);

		// Low-pass filter for strings
		const filter = new Filter({
			frequency: 2000,
			type: 'lowpass',
			rolloff: -12
		});
		this.effects.set('filter', filter);

		logger.debug('effects', 'Audio effects initialized', {
			effectCount: this.effects.size
		});
	}

	private async initializeInstruments(): Promise<void> {
		// Piano - using basic Synth
		const pianoSynth = new PolySynth(Synth, INSTRUMENT_CONFIGS.piano.options);
		pianoSynth.maxPolyphony = this.maxVoicesPerInstrument;
		let pianoOutput = pianoSynth;
		for (const effectName of INSTRUMENT_CONFIGS.piano.effects) {
			const effect = this.effects.get(effectName);
			if (effect) {
				pianoOutput = pianoOutput.connect(effect);
			}
		}
		pianoOutput.connect(this.volume);
		this.instruments.set('piano', pianoSynth);

		// Organ - using FMSynth
		const organSynth = new PolySynth(FMSynth, INSTRUMENT_CONFIGS.organ.options);
		organSynth.maxPolyphony = this.maxVoicesPerInstrument;
		let organOutput = organSynth;
		for (const effectName of INSTRUMENT_CONFIGS.organ.effects) {
			const effect = this.effects.get(effectName);
			if (effect) {
				organOutput = organOutput.connect(effect);
			}
		}
		organOutput.connect(this.volume);
		this.instruments.set('organ', organSynth);

		// Strings - using AMSynth
		const stringsSynth = new PolySynth(AMSynth, INSTRUMENT_CONFIGS.strings.options);
		stringsSynth.maxPolyphony = this.maxVoicesPerInstrument;
		let stringsOutput = stringsSynth;
		for (const effectName of INSTRUMENT_CONFIGS.strings.effects) {
			const effect = this.effects.get(effectName);
			if (effect) {
				stringsOutput = stringsOutput.connect(effect);
			}
		}
		stringsOutput.connect(this.volume);
		this.instruments.set('strings', stringsSynth);

		logger.debug('instruments', 'All instruments initialized', {
			instrumentCount: this.instruments.size,
			instruments: Array.from(this.instruments.keys())
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

		// Apply harmonic processing to improve musical quality
		logger.info('harmonization', 'Applying harmonic processing');
		const harmonizedSequence = this.harmonicEngine.harmonizeSequence(sequence);
		
		logger.info('harmonization', 'Harmonic processing complete', {
			originalNotes: sequence.length,
			harmonizedNotes: harmonizedSequence.length,
			reduction: ((sequence.length - harmonizedSequence.length) / sequence.length * 100).toFixed(1) + '%'
		});

		this.currentSequence = harmonizedSequence;
		this.isPlaying = true;
		this.scheduledEvents = [];

		// Ensure Transport is stopped and reset
		if (Transport.state === 'started') {
			Transport.stop();
			Transport.cancel(); // Clear all scheduled events
		}

		// Set a reasonable loop length for the transport
		const sequenceDuration = this.getSequenceDuration(harmonizedSequence);
		Transport.loopEnd = sequenceDuration + 2; // Add buffer

		logger.info('debug', 'Starting sequence playback', { 
			sequenceDuration: sequenceDuration.toFixed(2),
			transportState: Transport.state,
			currentTime: context.currentTime.toFixed(3)
		});

		// Schedule all notes in the sequence
		for (const mapping of harmonizedSequence) {
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
		
		logger.debug('settings', 'Audio settings updated', {
			volume: settings.volume,
			tempo: settings.tempo
		});
	}

	/**
	 * Update harmonic engine settings
	 */
	updateHarmonicSettings(harmonicSettings: Partial<HarmonicSettings>): void {
		this.harmonicEngine.updateSettings(harmonicSettings);
		logger.debug('harmonic-settings', 'Harmonic settings updated', harmonicSettings);
	}

	private updateVolume(): void {
		if (this.volume) {
			// Convert 0-100 range to decibels (-20dB to 0dB)
			const volumeDb = (this.settings.volume / 100) * 20 - 20;
			this.volume.volume.value = volumeDb;
			
			logger.debug('volume', 'Volume updated', {
				settingValue: this.settings.volume,
				decibelValue: volumeDb.toFixed(1)
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
		// Simple assignment based on pitch range for now
		// Higher pitches = piano, medium = organ, lower = strings
		if (mapping.pitch > 800) {
			return 'piano';
		} else if (mapping.pitch > 300) {
			return 'organ';
		} else {
			return 'strings';
		}
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

		if (this.volume) {
			this.volume.dispose();
			this.volume = null;
		}

		this.effects.forEach((effect, effectName) => {
			effect.dispose();
		});
		this.effects.clear();

		this.isInitialized = false;

		logger.info('cleanup', 'AudioEngine disposed');
	}
} 