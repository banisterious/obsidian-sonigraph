import { Sampler, Filter, Volume, LFO, Envelope, PitchShift, Reverb, Delay, Oscillator, now } from 'tone';
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
	
	constructor(masterVolume: Volume) {
		this.masterVolume = masterVolume;
		logger.debug('initialization', 'PercussionEngine created');
	}

	async initializePercussion(): Promise<void> {
		logger.info('initialization', 'Initializing advanced percussion synthesis');
		
		try {
			await this.initializeTimpani();
			await this.initializeXylophone();
			await this.initializeVibraphone();
			await this.initializeGongs();
			
			logger.info('initialization', 'Advanced percussion synthesis ready');
		} catch (error) {
			logger.error('initialization', 'Failed to initialize percussion', error);
			throw error;
		}
	}

	private async initializeTimpani(): Promise<void> {
		// Create timpani with advanced pitch bending capabilities
		const timpaniSizes = ['small', 'medium', 'large'];
		
		for (const size of timpaniSizes) {
			const sampler = new Sampler({
				urls: {
					"C2": "C2.mp3", "F2": "F2.mp3", "Bb2": "Bb2.mp3", "D3": "D3.mp3"
				},
				baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/timpani/",
				release: 4.0
			});

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

			// Chain: Sampler -> PitchShift -> Reverb -> Master
			sampler.chain(pitchShifter, hallReverb, this.masterVolume);
			
			this.timpaniSamplers.set(size, sampler);
			this.timpaniPitchShifters.set(size, pitchShifter);
		}

		logger.debug('timpani', 'Timpani initialization complete');
	}

	private async initializeXylophone(): Promise<void> {
		// Xylophone with advanced mallet articulation
		const sampler = new Sampler({
			urls: {
				"C4": "C4.mp3", "D4": "D4.mp3", "E4": "E4.mp3", "F4": "F4.mp3",
				"G4": "G4.mp3", "A4": "A4.mp3", "B4": "B4.mp3", "C5": "C5.mp3",
				"D5": "D5.mp3", "E5": "E5.mp3", "F5": "F5.mp3", "G5": "G5.mp3",
				"A5": "A5.mp3", "B5": "B5.mp3", "C6": "C6.mp3", "D6": "D6.mp3"
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

		sampler.chain(resonanceFilter, brightReverb, this.masterVolume);
		
		this.xylophoneSamplers.set('main', sampler);
		this.malletEnvelopes.set('xylophone', attackEnvelope);

		logger.debug('xylophone', 'Xylophone initialization complete');
	}

	private async initializeVibraphone(): Promise<void> {
		// Vibraphone with motor tremolo simulation
		const sampler = new Sampler({
			urls: {
				"F3": "F3.mp3", "A3": "A3.mp3", "C4": "C4.mp3",
				"E4": "E4.mp3", "G4": "G4.mp3", "B4": "B4.mp3",
				"D5": "D5.mp3", "F5": "F5.mp3", "A5": "A5.mp3"
			},
			baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/vibraphone/",
			release: 6.0
		});

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
		motorLFO.connect(motorGain.volume);

		// Warm reverb for metallic sustain
		const metallicReverb = new Reverb({
			decay: 3.5,
			preDelay: 0.05,
			wet: 0.5
		});

		sampler.chain(motorGain, metallicFilter, metallicReverb, this.masterVolume);
		
		this.vibraphoneSamplers.set('main', sampler);
		this.vibraphoneMotors.set('main', motorLFO);

		logger.debug('vibraphone', 'Vibraphone initialization complete');
	}

	private async initializeGongs(): Promise<void> {
		// Gongs with massive resonance and shimmer
		const sampler = new Sampler({
			urls: {
				"C2": "C2.mp3", "F2": "F2.mp3", "C3": "C3.mp3"
			},
			baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/gong/",
			release: 12.0
		});

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

		sampler.chain(resonator, shimmerDelay, massiveReverb, this.masterVolume);
		
		this.gongSamplers.set('main', sampler);
		this.gongResonators.set('main', resonator);

		logger.debug('gongs', 'Gongs initialization complete');
	}

	// Advanced timpani with pitch bending
	triggerTimpani(note: string, velocity: number, duration: number, pitchBend?: number): void {
		const sampler = this.timpaniSamplers.get('medium'); // Default to medium size
		const pitchShifter = this.timpaniPitchShifters.get('medium');
		
		if (!sampler || !pitchShifter) {
			logger.warn('timpani', 'Timpani sampler not initialized');
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

		// Adjust attack based on mallet hardness
		const attackTime = hardness ? (1 - hardness) * 0.01 + 0.001 : 0.001;
		
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
			logger.warn('gongs', 'Gong sampler not initialized');
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
				motor.start();
			} else {
				motor.stop();
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
			for (const [key, sampler] of samplerMap) {
				if (sampler.volume) {
					sampler.volume.value = -20 + (dynamics * 20); // -20dB to 0dB range
				}
			}
		}

		logger.debug('dynamics', `Adjusted percussion dynamics: ${dynamics}`);
	}

	dispose(): void {
		// Clean up all percussion resources
		[this.timpaniSamplers, this.xylophoneSamplers, this.vibraphoneSamplers, this.gongSamplers]
			.forEach(map => {
				for (const [key, sampler] of map) {
					sampler.dispose();
				}
				map.clear();
			});

		[this.timpaniPitchShifters, this.vibraphoneMotors, this.malletEnvelopes, this.gongResonators]
			.forEach(map => {
				for (const [key, processor] of map) {
					if (processor.dispose) processor.dispose();
				}
				map.clear();
			});

		logger.debug('cleanup', 'PercussionEngine disposed');
	}
}