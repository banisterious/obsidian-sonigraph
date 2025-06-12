// Import Tone.js with ESM-compatible approach
import { start, Volume, PolySynth, Synth, FMSynth, AMSynth, Sampler, context, now, Transport, Reverb, Chorus, Filter } from 'tone';
import { MusicalMapping } from '../graph/types';
import { SonigraphSettings } from '../utils/constants';
import { getLogger } from '../logging';
import { HarmonicEngine, HarmonicSettings } from './harmonic-engine';

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
		// Reverb for spatial depth - optimized for instrument realism
		const reverb = new Reverb({
			decay: 1.8,      // Slightly shorter for clarity
			preDelay: 0.02,  // Small pre-delay for natural space
			wet: 0.25        // Reduced wetness to maintain definition
		});
		await reverb.generate();
		this.effects.set('reverb', reverb);

		// Chorus for organ richness - classic organ effect
		const chorus = new Chorus({
			frequency: 0.8,   // Slower rate for more musical effect
			delayTime: 4.0,   // Slightly longer delay
			depth: 0.5,       // Moderate depth to avoid seasickness
			feedback: 0.05,   // Minimal feedback for cleaner sound
			spread: 120       // Narrower spread for focus
		});
		chorus.start();
		this.effects.set('chorus', chorus);

		// Low-pass filter for strings - warmer, more natural
		const filter = new Filter({
			frequency: 3500,  // Higher cutoff to preserve brightness
			type: 'lowpass',
			rolloff: -24,     // Steeper rolloff for smoother sound
			Q: 0.8           // Slight resonance for character
		});
		this.effects.set('filter', filter);

		logger.debug('effects', 'Audio effects initialized', {
			effectCount: this.effects.size
		});
	}

	private async initializeInstruments(): Promise<void> {
		const configs = this.getSamplerConfigs();
		
		// Piano - using Sampler with high-quality samples
		const pianoSampler = new Sampler(configs.piano);
		const pianoVolume = new Volume(-6); // Individual volume control
		this.instrumentVolumes.set('piano', pianoVolume);
		
		let pianoOutput = pianoSampler.connect(pianoVolume);
		for (const effectName of configs.piano.effects) {
			const effect = this.effects.get(effectName);
			if (effect) {
				pianoOutput = pianoOutput.connect(effect);
			}
		}
		pianoOutput.connect(this.volume);
		this.instruments.set('piano', pianoSampler);

		// Organ - using Sampler with harmonium samples
		const organSampler = new Sampler(configs.organ);
		const organVolume = new Volume(-6); // Individual volume control
		this.instrumentVolumes.set('organ', organVolume);
		
		let organOutput = organSampler.connect(organVolume);
		for (const effectName of configs.organ.effects) {
			const effect = this.effects.get(effectName);
			if (effect) {
				organOutput = organOutput.connect(effect);
			}
		}
		organOutput.connect(this.volume);
		this.instruments.set('organ', organSampler);

		// Strings - using Sampler with violin samples
		const stringsSampler = new Sampler(configs.strings);
		const stringsVolume = new Volume(-6); // Individual volume control
		this.instrumentVolumes.set('strings', stringsVolume);
		
		let stringsOutput = stringsSampler.connect(stringsVolume);
		for (const effectName of configs.strings.effects) {
			const effect = this.effects.get(effectName);
			if (effect) {
				stringsOutput = stringsOutput.connect(effect);
			}
		}
		stringsOutput.connect(this.volume);
		this.instruments.set('strings', stringsSampler);

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

	public updateVolume(): void {
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
		const sortedInstruments = enabledInstruments.sort();
		
		if (mapping.pitch > 800) {
			// High pitch - prefer piano if available
			return enabledInstruments.includes('piano') ? 'piano' : sortedInstruments[0];
		} else if (mapping.pitch > 300) {
			// Medium pitch - prefer organ if available
			return enabledInstruments.includes('organ') ? 'organ' : sortedInstruments[0];
		} else {
			// Low pitch - prefer strings if available
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

		this.effects.forEach((effect, effectName) => {
			effect.dispose();
		});
		this.effects.clear();

		this.isInitialized = false;

		logger.info('cleanup', 'AudioEngine disposed');
	}
} 