import { Sampler, Filter, Volume, LFO, Envelope, PitchShift, Reverb, Delay, now, PolySynth, AMSynth } from 'tone';
import { getLogger } from '../logging';

const logger = getLogger('percussion-engine');

export interface PercussionNote {
	instrument: 'timpani' | 'xylophone' | 'vibraphone' | 'gongs';
	pitch: number;
	velocity: number;
	duration: number;
	timestamp: number;
}

export interface TimpanieSettings {
	pitchBendRange: number; // Semitones
	pitchBendTime: number; // Seconds
	hallSize: number; // 0-1
	drumSize: 'small' | 'medium' | 'large';
}

export interface MalletSettings {
	attackSharpness: number; // 0-1
	resonanceDecay: number; // Seconds
	materialHardness: number; // 0-1 (soft mallets to hard)
	strikePosition: number; // 0-1 (center to edge)
}

export interface VibratomSettings {
	motorSpeed: number; // Hz
	motorDepth: number; // 0-1
	motorEnabled: boolean;
	pedalDamping: number; // 0-1
}

export class PercussionEngine {
	private timpaniSamplers: Map<string, Sampler> = new Map();
	private xylophoneSamplers: Map<string, Sampler> = new Map();
	private vibraphoneSamplers: Map<string, Sampler> = new Map();
	private gongSamplers: Map<string, Sampler> = new Map();
	
	// Specialized processors
	private timpaniPitchShifters: Map<string, PitchShift> = new Map();
	private vibraphoneMotors: Map<string, LFO> = new Map();
	private malletEnvelopes: Map<string, Envelope> = new Map();
	private gongResonators: Map<string, Filter> = new Map();
	
	private masterVolume: Volume;
	private audioFormat: 'wav' | 'ogg' | 'mp3';
	
	constructor(masterVolume: Volume, audioFormat: 'wav' | 'ogg' | 'mp3' = 'wav') {
		this.masterVolume = masterVolume;
		this.audioFormat = audioFormat;
		void logger.debug('initialization', 'PercussionEngine created');
	}

	initializePercussion(): void {
		void logger.info('initialization', 'Initializing advanced percussion synthesis');

		try {
			void this.initializeTimpani();
			void this.initializeXylophone();
			void this.initializeVibraphone();
			void this.initializeGongs();

			void logger.info('initialization', 'Advanced percussion synthesis ready');
		} catch (error) {
			void logger.error('initialization', 'Failed to initialize percussion', error);
			throw error;
		}
	}

	private initializeTimpani(): void {
		// NOTE: Timpani is a synth-only instrument (no samples in nbrosowsky collection)
		void logger.debug('timpani', 'Initializing timpani with synthesis');
		
		// Create synthetic timpani using FMSynth for deep, resonant tones
		const timpaniSizes = ['small', 'medium', 'large'];
		
		for (const size of timpaniSizes) {
			// Use synthesis instead of samples since timpani directory doesn't exist on CDN
			const synth = new PolySynth({
				voice: AMSynth,
				options: {
					oscillator: { type: 'sine' },
					envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 2.0 },
					volume: -12 // Lower volume for timpani character
				}
			});
			
			// Store as sampler for compatibility (PolySynth has same interface)
			this.timpaniSamplers.set(size, synth as unknown as Sampler);

			// Advanced pitch shifting for timpani tuning
			const pitchShifter = new PitchShift({
				pitch: 0, // Will be modulated in real-time
				windowSize: 0.1
			});

			// Hall acoustics simulation
			const hallReverb = new Reverb({
				decay: 4.5,
				preDelay: 0.08,
				wet: 0.6
			});

			// Chain: Synth -> PitchShift -> Reverb -> Master
			void synth.chain(pitchShifter, hallReverb, this.masterVolume);

			this.timpaniSamplers.set(size, synth as unknown as Sampler);
			this.timpaniPitchShifters.set(size, pitchShifter);
		}

		void logger.debug('timpani', 'Timpani initialization complete');
	}

	private initializeXylophone(): void {
		// Xylophone with advanced mallet articulation
		// Note: Only using notes that actually exist on nbrosowsky CDN
		const sampler = new Sampler({
			urls: {
				"G4": `G4.${this.audioFormat}`, "C5": `C5.${this.audioFormat}`, "G5": `G5.${this.audioFormat}`, 
				"C6": `C6.${this.audioFormat}`, "G6": `G6.${this.audioFormat}`, "C7": `C7.${this.audioFormat}`, "G7": `G7.${this.audioFormat}`, "C8": `C8.${this.audioFormat}`
			},
			baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/xylophone/",
			release: 2.5
		});

		// Sharp attack envelope for mallet strikes
		const attackEnvelope = new Envelope({
			attack: 0.001, // Extremely fast attack
			decay: 0.1,
			sustain: 0.8,
			release: 2.0
		});

		// Wooden resonance filter
		const resonanceFilter = new Filter({
			frequency: 2000,
			type: 'bandpass',
			Q: 3.0 // High Q for wooden resonance
		});

		// Bright hall acoustics
		const brightReverb = new Reverb({
			decay: 1.8,
			preDelay: 0.02,
			wet: 0.35
		});

		void sampler.chain(resonanceFilter, brightReverb, this.masterVolume);
		
		this.xylophoneSamplers.set('main', sampler);
		this.malletEnvelopes.set('xylophone', attackEnvelope);

		void logger.debug('xylophone', 'Xylophone initialization complete');
	}

	private initializeVibraphone(): void {
		// NOTE: Vibraphone is a synth-only instrument (no samples in nbrosowsky collection)
		void logger.debug('vibraphone', 'Initializing vibraphone with synthesis');
		
		// Create synthetic vibraphone using metallic synthesis
		const synth = new PolySynth({
			voice: AMSynth,
			options: {
				oscillator: { type: 'triangle' },
				envelope: { attack: 0.001, decay: 0.2, sustain: 0.8, release: 3.0 },
				volume: -8 // Moderate volume for vibraphone character
			}
		});

		// Store as sampler for compatibility
		this.vibraphoneSamplers.set('main', synth as unknown as Sampler);

		// Motor tremolo LFO
		const motorLFO = new LFO({
			frequency: 6.0, // 6 Hz motor speed
			type: 'sine',
			min: 0.3,
			max: 1.0
		}).start();

		// Metallic resonance
		const metallicFilter = new Filter({
			frequency: 1200,
			type: 'highpass',
			Q: 1.5
		});

		// Connect motor to volume for tremolo effect
		const motorGain = new Volume(0);
		void motorLFO.connect(motorGain.volume);

		// Warm reverb for metallic sustain
		const metallicReverb = new Reverb({
			decay: 3.5,
			preDelay: 0.05,
			wet: 0.5
		});

		void synth.chain(motorGain, metallicFilter, metallicReverb, this.masterVolume);
		this.vibraphoneMotors.set('main', motorLFO);

		void logger.debug('vibraphone', 'Vibraphone initialization complete');
	}

	private initializeGongs(): void {
		// NOTE: Gongs is a synth-only instrument (no samples in nbrosowsky collection)
		void logger.debug('gongs', 'Initializing gongs with synthesis');
		
		// Create synthetic gongs using complex metallic synthesis
		const synth = new PolySynth({
			voice: AMSynth,
			options: {
				oscillator: { type: 'square' },
				envelope: { attack: 0.01, decay: 1.0, sustain: 0.3, release: 8.0 },
				volume: -6 // Higher volume for gong character
			}
		});

		// Store as sampler for compatibility
		this.gongSamplers.set('main', synth as unknown as Sampler);

		// Complex resonance filter for metallic shimmer
		const resonator = new Filter({
			frequency: 200,
			type: 'peaking',
			Q: 8.0, // Very high Q for metallic ringing
			gain: 6
		});

		// Massive hall reverb
		const massiveReverb = new Reverb({
			decay: 8.0,
			preDelay: 0.15,
			wet: 0.8
		});

		// Shimmer delay for metallic texture
		const shimmerDelay = new Delay(0.3);

		void synth.chain(resonator, shimmerDelay, massiveReverb, this.masterVolume);
		this.gongResonators.set('main', resonator);

		void logger.debug('gongs', 'Gongs initialization complete');
	}

	// Advanced timpani with pitch bending
	triggerTimpani(note: string, velocity: number, duration: number, pitchBend?: number): void {
		const sampler = this.timpaniSamplers.get('medium'); // Default to medium size
		const pitchShifter = this.timpaniPitchShifters.get('medium');
		
		if (!sampler || !pitchShifter) {
			void logger.warn('timpani', 'Timpani sampler not initialized');
			return;
		}

		// Apply pitch bend if specified
		if (pitchBend) {
			pitchShifter.pitch = pitchBend; // Semitones
		}

		// Trigger with dynamic velocity mapping
		const dynamicVelocity = Math.min(velocity * 1.2, 1.0); // Boost timpani dynamics
		sampler.triggerAttackRelease(note, duration, now(), dynamicVelocity);

		logger.debug('timpani', `Triggered timpani: ${note}, vel: ${velocity}, bend: ${pitchBend || 0}`);
	}

	// Mallet instruments with articulation control
	triggerMallet(instrument: 'xylophone' | 'vibraphone', note: string, velocity: number, duration: number, hardness?: number): void {
		const samplerMap = instrument === 'xylophone' ? this.xylophoneSamplers : this.vibraphoneSamplers;
		const sampler = samplerMap.get('main');
		
		if (!sampler) {
			logger.warn('mallet', `${instrument} sampler not initialized`);
			return;
		}

		// Adjust attack based on mallet hardness (not currently used)
		// const attackTime = hardness ? (1 - hardness) * 0.01 + 0.001 : 0.001;

		// Modify velocity for mallet character
		const malletVelocity = instrument === 'xylophone' ? 
			Math.min(velocity * 1.5, 1.0) : // Xylophone - brighter
			velocity * 0.9; // Vibraphone - softer

		sampler.triggerAttackRelease(note, duration, now(), malletVelocity);

		logger.debug('mallet', `Triggered ${instrument}: ${note}, vel: ${velocity}, hardness: ${hardness || 0.5}`);
	}

	// Gongs with resonance control
	triggerGong(note: string, velocity: number, duration: number, resonance?: number): void {
		const sampler = this.gongSamplers.get('main');
		const resonator = this.gongResonators.get('main');
		
		if (!sampler || !resonator) {
			void logger.warn('gongs', 'Gong sampler not initialized');
			return;
		}

		// Adjust resonance based on strike intensity
		if (resonance) {
			resonator.Q.value = resonance * 10 + 2; // Q range: 2-12
		}

		// Gongs have massive dynamic range
		const gongVelocity = Math.pow(velocity, 0.7); // Compress velocity curve
		sampler.triggerAttackRelease(note, duration, now(), gongVelocity);

		logger.debug('gongs', `Triggered gong: ${note}, vel: ${velocity}, resonance: ${resonance || 0.5}`);
	}

	// Motor control for vibraphone
	setVibraphoneMotorSpeed(speed: number): void {
		const motor = this.vibraphoneMotors.get('main');
		if (motor) {
			motor.frequency.value = Math.max(0.5, Math.min(speed, 12)); // 0.5-12 Hz range
		}
	}

	setVibraphoneMotorEnabled(enabled: boolean): void {
		const motor = this.vibraphoneMotors.get('main');
		if (motor) {
			if (enabled) {
				void motor.start();
			} else {
				void motor.stop();
			}
		}
	}

	// Dynamic percussion control
	adjustPercussionDynamics(instrument: string, dynamics: number): void {
		// Adjust overall dynamics for orchestral balance
		const samplerMaps = [
			this.timpaniSamplers,
			this.xylophoneSamplers, 
			this.vibraphoneSamplers,
			this.gongSamplers
		];

		for (const samplerMap of samplerMaps) {
			for (const sampler of samplerMap.values()) {
				if (sampler.volume) {
					sampler.volume.value = -20 + (dynamics * 20); // -20dB to 0dB range
				}
			}
		}

		logger.debug('dynamics', `Adjusted percussion dynamics: ${dynamics}`);
	}

	/**
	 * Update audio format and re-initialize all percussion instruments
	 * Issue #005 Fix: Ensures percussion engines use correct sample format
	 */
	updateAudioFormat(format: 'wav' | 'ogg' | 'mp3'): void {
		if (this.audioFormat === format) {
			return; // No change needed
		}

		logger.debug('format-update', `Updating percussion audio format from ${this.audioFormat} to ${format}`);
		
		// Store the new format
		this.audioFormat = format;
		
		// Dispose existing samplers
		[this.timpaniSamplers, this.xylophoneSamplers, this.vibraphoneSamplers, this.gongSamplers]
			.forEach(map => {
				for (const sampler of map.values()) {
					void sampler.dispose();
				}
				void map.clear();
			});

		// Clear processors that depend on samplers
		[this.timpaniPitchShifters, this.vibraphoneMotors, this.malletEnvelopes, this.gongResonators]
			.forEach(map => {
				for (const processor of map.values()) {
					if (processor.dispose) processor.dispose();
				}
				void map.clear();
			});

		// Re-initialize all instruments with new format
		try {
			void this.initializeTimpani();
			void this.initializeXylophone();
			void this.initializeVibraphone();
			void this.initializeGongs();
			
			logger.info('format-update', `Successfully updated percussion engine to ${format} format`);
		} catch (error) {
			logger.error('format-update', `Failed to re-initialize percussion with ${format} format`, error);
			throw error;
		}
	}

	dispose(): void {
		// Clean up all percussion resources
		[this.timpaniSamplers, this.xylophoneSamplers, this.vibraphoneSamplers, this.gongSamplers]
			.forEach(map => {
				for (const sampler of map.values()) {
					void sampler.dispose();
				}
				void map.clear();
			});

		[this.timpaniPitchShifters, this.vibraphoneMotors, this.malletEnvelopes, this.gongResonators]
			.forEach(map => {
				for (const processor of map.values()) {
					if (processor.dispose) processor.dispose();
				}
				void map.clear();
			});

		void logger.debug('cleanup', 'PercussionEngine disposed');
	}
}