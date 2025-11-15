import { Synth, PolySynth, Filter, LFO, Envelope, Volume, Oscillator, AMSynth, FMSynth, now, Sampler } from 'tone';
import { getLogger } from '../logging';

const logger = getLogger('electronic-engine');

export interface ElectronicNote {
	instrument: 'leadSynth' | 'bassSynth' | 'arpSynth';
	pitch: number;
	velocity: number;
	duration: number;
	timestamp: number;
}

export interface LeadSynthSettings {
	oscillatorType: 'sawtooth' | 'square' | 'triangle' | 'sine';
	filterCutoff: number; // Hz
	filterResonance: number; // Q factor
	filterEnvelope: EnvelopeSettings;
	lfoRate: number; // Hz
	lfoDepth: number; // 0-1
	distortionAmount: number; // 0-1
}

export interface BassSynthSettings {
	oscillatorType: 'square' | 'sawtooth' | 'pulse';
	subOscillatorLevel: number; // 0-1
	filterCutoff: number; // Hz
	filterResonance: number; // Q factor
	compressorThreshold: number; // dB
	compressorRatio: number; // ratio
}

export interface ArpSynthSettings {
	pattern: 'up' | 'down' | 'updown' | 'random';
	rate: number; // Hz
	gateTime: number; // 0-1 (note length ratio)
	filterSweep: boolean;
	sweepRate: number; // Hz
	sweepDepth: number; // 0-1
}

export interface EnvelopeSettings {
	attack: number;
	decay: number;
	sustain: number;
	release: number;
}

export class ElectronicEngine {
	private leadSynths: Map<string, PolySynth> = new Map();
	private bassSynths: Map<string, PolySynth> = new Map();
	private arpSynths: Map<string, PolySynth> = new Map();
	
	// Advanced modulation sources
	private filterLFOs: Map<string, LFO> = new Map();
	private modulationEnvelopes: Map<string, Envelope> = new Map();
	private filterInstances: Map<string, Filter> = new Map();
	
	// Arpeggiator sequencing
	private arpSequencers: Map<string, NodeJS.Timeout> = new Map();
	private arpPatterns: Map<string, number[]> = new Map();
	
	private masterVolume: Volume;
	
	constructor(masterVolume: Volume) {
		this.masterVolume = masterVolume;
		logger.debug('initialization', 'ElectronicEngine created');
	}

	async initializeElectronic(): Promise<void> {
		logger.info('initialization', 'Initializing advanced electronic synthesis');
		
		try {
			this.initializeLeadSynth();
			this.initializeBassSynth();
			this.initializeArpSynth();

			logger.info('initialization', 'Advanced electronic synthesis ready');
		} catch (error) {
			logger.error('initialization', 'Failed to initialize electronic synthesis', error);
			throw error;
		}
	}

	private initializeLeadSynth(): void {
		// Create lead synth with advanced filter modulation
		// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
		const leadSynth = new PolySynth({
			voice: Synth,
			maxPolyphony: 6, // Lead synths typically need medium polyphony
			options: {
				oscillator: {
					type: 'sawtooth'
				},
				envelope: {
					attack: 0.01,
					decay: 0.3,
					sustain: 0.6,
					release: 0.8
				}
			}
		}).set({ volume: -12 });

		// Advanced filter with LFO modulation
		const leadFilter = new Filter({
			frequency: 1200,
			type: 'lowpass',
			Q: 8.0 // High resonance for sweeps
		});

		// Filter modulation LFO
		const filterLFO = new LFO({
			frequency: 0.25, // Slow filter sweeps
			type: 'sine',
			min: 300,
			max: 3000
		}).start();

		// Connect LFO to filter cutoff
		filterLFO.connect(leadFilter.frequency);

		// Distortion for aggressive lead sound
		const distortion = new Volume(-6); // Simple gain staging for mild distortion

		// Chain: Synth -> Filter -> Distortion -> Master
		leadSynth.chain(leadFilter, distortion, this.masterVolume);
		
		this.leadSynths.set('main', leadSynth);
		this.filterLFOs.set('lead', filterLFO);
		this.filterInstances.set('lead', leadFilter);

		logger.debug('lead-synth', 'Lead synth initialization complete');
	}

	private initializeBassSynth(): void {
		// Create bass synth with sub-oscillator and compression
		// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
		const bassSynth = new PolySynth({
			voice: Synth,
			maxPolyphony: 4, // Bass synths need lower polyphony
			options: {
				oscillator: {
					type: 'square'
				},
				envelope: {
					attack: 0.01,
					decay: 0.2,
					sustain: 0.8,
					release: 0.4
				}
			}
		}).set({ volume: -8 });

		// Sub-bass oscillator
		// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
		const subOsc = new PolySynth({
			voice: Synth,
			maxPolyphony: 2, // Sub-bass needs very low polyphony
			options: {
				oscillator: {
					type: 'sine'
				},
				envelope: {
					attack: 0.01,
					decay: 0.15,
					sustain: 0.9,
					release: 0.3
				}
			}
		}).set({ volume: -15 });

		// Bass filter for punch
		const bassFilter = new Filter({
			frequency: 120,
			type: 'lowpass',
			Q: 2.0
		});

		// Simple compression simulation via volume control
		const compressor = new Volume(-3);

		// Chain both oscillators
		bassSynth.chain(bassFilter, compressor, this.masterVolume);
		subOsc.chain(compressor, this.masterVolume);
		
		this.bassSynths.set('main', bassSynth);
		this.bassSynths.set('sub', subOsc);
		this.filterInstances.set('bass', bassFilter);

		logger.debug('bass-synth', 'Bass synth initialization complete');
	}

	private initializeArpSynth(): void {
		// Create arp synth with sequencing capabilities
		// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
		const arpSynth = new PolySynth({
			voice: Synth,
			maxPolyphony: 8, // Arpeggiators need higher polyphony for complex patterns
			options: {
				oscillator: {
					type: 'triangle'
				},
				envelope: {
					attack: 0.001,
					decay: 0.1,
					sustain: 0.3,
					release: 0.2
				}
			}
		}).set({ volume: -10 });

		// Filter sweep for arpeggiator
		const arpFilter = new Filter({
			frequency: 1500,
			type: 'bandpass',
			Q: 4.0
		});

		// Filter sweep LFO
		const sweepLFO = new LFO({
			frequency: 0.5, // Medium sweep rate
			type: 'triangle',
			min: 500,
			max: 4000
		}).start();

		// Connect sweep to filter
		sweepLFO.connect(arpFilter.frequency);

		// Reverb for space
		const reverb = new Volume(0); // Placeholder for reverb processing

		// Chain: Synth -> Filter -> Reverb -> Master
		arpSynth.chain(arpFilter, reverb, this.masterVolume);
		
		this.arpSynths.set('main', arpSynth);
		this.filterLFOs.set('arp', sweepLFO);
		this.filterInstances.set('arp', arpFilter);

		logger.debug('arp-synth', 'Arp synth initialization complete');
	}

	// Advanced lead synth with filter modulation
	triggerLeadSynth(note: string, velocity: number, duration: number, filterMod?: number): void {
		const synth = this.leadSynths.get('main');
		const filter = this.filterInstances.get('lead');
		
		if (!synth || !filter) {
			logger.warn('lead-synth', 'Lead synth not initialized');
			return;
		}

		// Apply filter modulation if specified
		if (filterMod !== undefined) {
			const modFreq = 300 + (filterMod * 2700); // 300-3000 Hz range
			filter.frequency.value = modFreq;
		}

		// Dynamic velocity mapping for expressive playing
		const expressiveVelocity = Math.pow(velocity, 0.8); // Slight compression
		synth.triggerAttackRelease(note, duration, now(), expressiveVelocity);

		logger.debug('lead-synth', `Triggered lead: ${note}, vel: ${velocity}, filter: ${filterMod || 'auto'}`);
	}

	// Bass synth with sub-oscillator control
	triggerBassSynth(note: string, velocity: number, duration: number, subLevel?: number): void {
		const mainSynth = this.bassSynths.get('main');
		const subSynth = this.bassSynths.get('sub');
		
		if (!mainSynth || !subSynth) {
			logger.warn('bass-synth', 'Bass synth not initialized');
			return;
		}

		// Trigger main bass
		const bassVelocity = Math.min(velocity * 1.3, 1.0); // Boost bass dynamics
		mainSynth.triggerAttackRelease(note, duration, now(), bassVelocity);

		// Trigger sub-oscillator (one octave down)
		if (subLevel !== undefined && subLevel > 0) {
			const subNote = this.transposeNote(note, -12); // One octave down
			const subVelocity = velocity * subLevel * 0.8; // Controlled sub level
			subSynth.triggerAttackRelease(subNote, duration, now(), subVelocity);
		}

		logger.debug('bass-synth', `Triggered bass: ${note}, vel: ${velocity}, sub: ${subLevel || 0}`);
	}

	// Arpeggiator with pattern sequencing
	triggerArpSynth(note: string, velocity: number, duration: number, pattern?: 'up' | 'down' | 'updown'): void {
		const synth = this.arpSynths.get('main');
		
		if (!synth) {
			logger.warn('arp-synth', 'Arp synth not initialized');
			return;
		}

		// For now, trigger single note - full arpeggiator patterns would require chord input
		const arpVelocity = velocity * 0.8; // Softer attack for sequenced notes
		synth.triggerAttackRelease(note, duration, now(), arpVelocity);

		logger.debug('arp-synth', `Triggered arp: ${note}, vel: ${velocity}, pattern: ${pattern || 'single'}`);
	}

	// Utility: Transpose note by semitones
	private transposeNote(note: string, semitones: number): string {
		const noteMap = {
			'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
			'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
		};
		
		const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		
		// Parse note and octave
		const noteMatch = note.match(/^([A-G][#b]?)(\d+)$/);
		if (!noteMatch) return note;
		
		const noteName = noteMatch[1];
		const octave = parseInt(noteMatch[2]);
		
		// Calculate new pitch
		const currentPitch = noteMap[noteName as keyof typeof noteMap] + (octave * 12);
		const newPitch = currentPitch + semitones;
		
		const newOctave = Math.floor(newPitch / 12);
		const newNoteIndex = ((newPitch % 12) + 12) % 12;
		
		return `${noteNames[newNoteIndex]}${newOctave}`;
	}

	// Filter modulation controls
	setLeadFilterCutoff(frequency: number): void {
		const filter = this.filterInstances.get('lead');
		if (filter) {
			filter.frequency.value = Math.max(100, Math.min(frequency, 8000));
		}
	}

	setLeadFilterResonance(q: number): void {
		const filter = this.filterInstances.get('lead');
		if (filter) {
			filter.Q.value = Math.max(0.1, Math.min(q, 20));
		}
	}

	// LFO controls
	setFilterLFORate(instrument: 'lead' | 'arp', rate: number): void {
		const lfo = this.filterLFOs.get(instrument);
		if (lfo) {
			lfo.frequency.value = Math.max(0.01, Math.min(rate, 20)); // 0.01-20 Hz
		}
	}

	setFilterLFOEnabled(instrument: 'lead' | 'arp', enabled: boolean): void {
		const lfo = this.filterLFOs.get(instrument);
		if (lfo) {
			if (enabled) {
				lfo.start();
			} else {
				lfo.stop();
			}
		}
	}

	// Dynamic control for orchestral integration
	adjustElectronicDynamics(instrument: string, dynamics: number): void {
		const synthMaps = [
			this.leadSynths,
			this.bassSynths,
			this.arpSynths
		];

		for (const synthMap of synthMaps) {
			for (const [key, synth] of synthMap) {
				if (synth.volume) {
					const baseVolume = instrument === 'leadSynth' ? -12 : 
									  instrument === 'bassSynth' ? -8 : -10;
					synth.volume.value = baseVolume + (dynamics * 12); // Up to 0dB
				}
			}
		}

		logger.debug('dynamics', `Adjusted electronic dynamics: ${dynamics}`);
	}

	dispose(): void {
		// Clean up all electronic resources
		[this.leadSynths, this.bassSynths, this.arpSynths].forEach(map => {
			for (const [key, synth] of map) {
				synth.dispose();
			}
			map.clear();
		});

		[this.filterLFOs, this.modulationEnvelopes, this.filterInstances].forEach(map => {
			for (const [key, processor] of map) {
				if (processor.dispose) processor.dispose();
			}
			map.clear();
		});

		// Clear arpeggiator timers
		for (const [key, timer] of this.arpSequencers) {
			clearTimeout(timer);
		}
		this.arpSequencers.clear();

		logger.debug('cleanup', 'ElectronicEngine disposed');
	}
}