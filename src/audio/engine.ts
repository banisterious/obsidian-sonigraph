// Import Tone.js with ESM-compatible approach
import { start, Volume, PolySynth, FMSynth, AMSynth, Sampler, Player, getContext, getTransport, Reverb, Chorus, Filter, Delay, Distortion, Compressor, EQ3, Frequency } from 'tone';
import { App } from 'obsidian';
import { MusicalMapping } from '../graph/types';
import { SonigraphSettings, EFFECT_PRESETS, EffectPreset, DEFAULT_SETTINGS, EffectNode, SendBus, ReturnBus, migrateToEnhancedRouting } from '../utils/constants';
import { PercussionEngine } from './percussion-engine';
import { ElectronicEngine } from './electronic-engine';
import { RhythmicPercussionEngine } from './percussion';
import { VoiceManager } from './voice-management';
import { EffectBusManager } from './effects';
import { InstrumentConfigLoader, LoadedInstrumentConfig } from './configs/InstrumentConfigLoader';
import type { InstrumentConfig } from './configs/types';
import { getLogger, LoggerFactory } from '../logging';
import { PlaybackEventEmitter, PlaybackEventType, PlaybackEventData, PlaybackProgressData, PlaybackErrorData } from './playback-events';
import { PlaybackOptimizer } from './optimizations/PlaybackOptimizer';
import { MemoryMonitor } from './optimizations/MemoryMonitor';
import { AudioGraphCleaner } from './optimizations/AudioGraphCleaner';
import { MusicalTheoryEngine } from './theory/MusicalTheoryEngine';
import { MusicalTheoryConfig, NoteName, ScaleType } from './theory/types';
import { ChordFusionEngine, NoteEvent as ChordNoteEvent, ChordGroup } from './ChordFusionEngine';

const logger = getLogger('audio-engine');

/**
 * Type definitions for Tone.js musical notes
 */
type MusicalNote = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
type MusicalScale = 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'pentatonic-major' | 'pentatonic-minor';

/**
 * Extended Tone.js instrument interface with polyphony control
 * Tone.js PolySynth and Sampler have maxPolyphony but it's not in their public types
 */
interface InstrumentWithPolyphony {
	maxPolyphony: number;
	[key: string]: unknown;
}

/**
 * Extended Tone.js Sampler interface with internal buffer access
 * Used for checking if samples are actually loaded
 */
interface SamplerWithBuffers {
	_buffers?: {
		_buffers?: Record<string, ToneBuffer>;
	};
}

interface ToneBuffer {
	loaded?: boolean;
}

/**
 * Extended Tone.js synth interface with active voice tracking
 * Used for performance monitoring
 */
interface SynthWithVoiceTracking {
	activeVoices?: number;
}

// Instrument configurations now managed by modular system in ./configs/

// VoiceAssignment interface moved to voice-management/types.ts

export class AudioEngine {
	private instruments: Map<string, PolySynth | Sampler> = new Map();
	private instrumentVolumes: Map<string, Volume> = new Map();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tone.js effects have heterogeneous types that don't share a common interface
	private instrumentEffects: Map<string, Map<string, any>> = new Map(); // Per-instrument effects
	private isInitialized = false;
	private isPlaying = false;
	private isMinimalMode = false; // Issue #010 Fix: Track if we're in minimal initialization mode
	private currentSequence: MusicalMapping[] = [];
	private scheduledEvents: number[] = [];
	private realtimeTimer: ReturnType<typeof setInterval> | null = null;
	private realtimeStartTime: number = 0;
	private lastTriggerTime: number = 0;
	private volume: Volume | null = null;
	private voiceManager: VoiceManager;
	private effectBusManager: EffectBusManager;
	private instrumentConfigLoader: InstrumentConfigLoader;
	private musicalTheoryEngine: MusicalTheoryEngine | null = null;

	// Real-time feedback properties
	private previewTimeouts: Map<string, number> = new Map();
	private bypassStates: Map<string, Map<string, boolean>> = new Map(); // instrument -> effect -> bypassed
	private performanceMetrics: Map<string, { cpuUsage: number; latency: number }> = new Map();
	private isPreviewMode: boolean = false;
	private previewInstrument: string | null = null;
	private previewNote: MusicalMapping | null = null;

	// Performance optimization properties - moved to VoiceManager
	// Effect routing properties - moved to EffectBusManager

	// Phase 2.2: Integration layer optimization - cached enabled instruments
	private cachedEnabledInstruments: string[] = [];
	private instrumentCacheValid: boolean = false;

	// Memory optimization properties
	private playbackOptimizer: PlaybackOptimizer;
	private memoryMonitor: MemoryMonitor;
	private audioGraphCleaner: AudioGraphCleaner;
	private progressThrottleCounter: number = 0;
	private readonly PROGRESS_THROTTLE_INTERVAL = 5; // Emit progress every 5th tick
	private performanceMonitoringInterval: ReturnType<typeof setInterval> | null = null;
	private noteCounter: number = 0; // For generating unique note IDs

	// Phase 8: Advanced Synthesis Engines
	private percussionEngine: PercussionEngine | null = null;

	// Rhythmic percussion accent layer
	private rhythmicPercussion: RhythmicPercussionEngine | null = null;

	// Phase 3: Frequency detuning for phase conflict resolution
	private frequencyHistory: Map<number, number> = new Map(); // frequency -> last used time

	// Chord Fusion Engine
	private chordFusionEngine: ChordFusionEngine | null = null;

	// Real-time chord fusion buffer
	private chordBuffer: Array<{ mapping: MusicalMapping; timestamp: number; elapsedTime?: number; nodeId?: string }> = [];
	private chordFlushTimer: number | null = null;
	private temporalChordBuckets: Map<string, Array<{ mapping: MusicalMapping; timestamp: number; nodeId?: string }>> = new Map();

	// Active note tracking for polyphony management (per-instrument)
	private activeNotesPerInstrument: Map<string, number> = new Map();
	private readonly MAX_NOTES_PER_INSTRUMENT = 3; // Match Tone.js maxPolyphony limit
	private electronicEngine: ElectronicEngine | null = null;

	// Enhanced Play Button: Playback event system
	private eventEmitter: PlaybackEventEmitter = new PlaybackEventEmitter();
	private sequenceStartTime: number = 0;
	private sequenceProgressTimer: number | null = null;
	
	// Master Effects Processing - moved to EffectBusManager

	constructor(private settings: SonigraphSettings, private app?: App) {
		logger.debug('initialization', 'AudioEngine created', {
			hasApp: !!app
		});
		this.voiceManager = new VoiceManager(true); // Enable adaptive quality by default
		this.effectBusManager = new EffectBusManager();
		this.instrumentConfigLoader = new InstrumentConfigLoader({
			audioFormat: 'ogg', // Use OGG since it's the only format available on nbrosowsky CDN
			preloadFamilies: true
		});
		
		// Phase 2.2: Initialize enabled instruments cache - start valid for immediate use
		this.instrumentCacheValid = false; // Will be built on first access
		
		// Initialize memory optimization tools
		this.playbackOptimizer = new PlaybackOptimizer();
		this.memoryMonitor = new MemoryMonitor();
		this.audioGraphCleaner = new AudioGraphCleaner();

		// Initialize chord fusion engine
		this.chordFusionEngine = new ChordFusionEngine(settings);
	}

	// === DELEGATE METHODS FOR EFFECT MANAGEMENT ===
	
	/**
	 * Enhanced routing delegates - methods implemented later in file
	 */

	isEnhancedRoutingEnabled(): boolean {
		return this.effectBusManager.isEnhancedRoutingEnabled();
	}

	/**
	 * Effect chain management delegates
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tone.js effect instances lack common type interface
	getEffectChain(instrumentName: string): any[] {
		return this.effectBusManager.getEffectChain(instrumentName);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tone.js effect types are heterogeneous constructor functions
	addEffectToChain(instrumentName: string, effectType: any, position?: number): string {
		return this.effectBusManager.addEffectToChain(instrumentName, effectType, position);
	}

	removeEffectFromChain(instrumentName: string, effectId: string): boolean {
		return this.effectBusManager.removeEffectFromChain(instrumentName, effectId);
	}

	toggleEffect(instrumentName: string, effectId: string): boolean {
		return this.effectBusManager.toggleEffect(instrumentName, effectId);
	}

	toggleEnhancedEffectBypass(instrumentName: string, effectId: string): boolean {
		return this.effectBusManager.toggleEffectBypass(instrumentName, effectId);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Effect parameters vary by effect type without unified schema
	updateEffectParameters(instrumentName: string, effectId: string, parameters: any): void {
		return this.effectBusManager.updateEffectParameters(instrumentName, effectId, parameters);
	}

	/**
	 * Bus management delegates
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Bus instances include various Tone.js audio nodes without common interface
	getSendBuses(): Map<string, any> {
		return this.effectBusManager.getSendBuses();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Return buses contain heterogeneous Tone.js audio node types
	getReturnBuses(): Map<string, any> {
		return this.effectBusManager.getReturnBuses();
	}

	/**
	 * Legacy property getters for backward compatibility
	 */
	get enhancedRouting(): boolean {
		return this.effectBusManager.isEnhancedRoutingEnabled();
	}

	set enhancedRouting(value: boolean) {
		if (value) {
			this.effectBusManager.enableEnhancedRouting();
		} else {
			this.effectBusManager.disableEnhancedRouting();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: effect chains contain heterogeneous Tone.js types
	get effectChains(): Map<string, any[]> {
		// Convert EffectBusManager chains to legacy format
		const legacyChains = new Map();
		// Implementation would go here if needed
		return legacyChains;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: send buses use mixed Tone.js audio node types
	get sendBuses(): Map<string, any> {
		return this.effectBusManager.getSendBuses();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: return buses use mixed Tone.js audio node types
	get returnBuses(): Map<string, any> {
		return this.effectBusManager.getReturnBuses();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: master effects collection contains various effect types
	get masterEffectsNodes(): Map<string, any> {
		// Legacy access to master effects - could be implemented if needed
		return new Map();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: effect instances are heterogeneous Tone.js objects
	get effectNodeInstances(): Map<string, any> {
		// Legacy access to effect instances - could be implemented if needed
		return new Map();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: reverb effect instance type varies
	get masterReverb(): any {
		return null; // Legacy property access
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: accepts various reverb effect configurations
	set masterReverb(value: any) {
		// Legacy setter - no-op since master effects are handled by EffectBusManager
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: EQ effect instance type varies
	get masterEQ(): any {
		return null; // Legacy property access
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: accepts various EQ effect configurations
	set masterEQ(value: any) {
		// Legacy setter - no-op since master effects are handled by EffectBusManager
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: compressor effect instance type varies
	get masterCompressor(): any {
		return null; // Legacy property access
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API: accepts various compressor configurations
	set masterCompressor(value: any) {
		// Legacy setter - no-op since master effects are handled by EffectBusManager
	}

	// === DELEGATE METHODS FOR VOICE MANAGEMENT ===

	/**
	 * Legacy voice management property getters
	 */
	get voicePool(): Map<string, unknown[]> {
		// Legacy access - could delegate to VoiceManager if needed
		return new Map();
	}

	get adaptiveQuality(): boolean {
		return this.voiceManager.shouldAdaptQuality();
	}

	set adaptiveQuality(value: boolean) {
		// Legacy setter - adaptive quality is managed by VoiceManager
	}

	get currentQualityLevel(): string {
		const metrics = this.voiceManager.getPerformanceMetrics();
		return metrics.qualityLevel;
	}

	set currentQualityLevel(level: string) {
		type QualityLevel = 'low' | 'medium' | 'high';
		this.voiceManager.setQualityLevel(level as QualityLevel);
	}

	get lastCPUCheck(): number {
		// Legacy property - return current time as placeholder
		return Date.now();
	}

	set lastCPUCheck(value: number) {
		// Legacy setter - no-op since we don't track this anymore
	}

	/**
	 * Enhanced Play Button: Event emitter access methods
	 */
	
	/**
	 * Add listener for playback events
	 */
	on(event: PlaybackEventType, listener: (data?: PlaybackEventData) => void): void {
		this.eventEmitter.on(event, listener);
	}

	/**
	 * Remove listener for playback events
	 */
	off(event: PlaybackEventType, listener: (data?: PlaybackEventData) => void): void {
		this.eventEmitter.off(event, listener);
	}

	/**
	 * Remove all listeners for an event or all events
	 */
	removeAllListeners(event?: PlaybackEventType): void {
		this.eventEmitter.removeAllListeners(event);
	}

	private getSamplerConfigs() {
		// Use the new modular InstrumentConfigLoader to load all available instruments
		// Individual instruments will decide whether to use samples or synthesis based on their useHighQuality setting
		const loadedInstruments = this.instrumentConfigLoader.loadAllInstruments();

		// Return the loaded instruments for compatibility
		return loadedInstruments;
	}

	/**
	 * Get the master volume node for audio export/recording
	 */
	public getMasterVolume(): Volume | null {
		return this.volume;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			logger.warn('audio-engine', 'AudioEngine already initialized');
			return;
		}

		// Issue #011: Generate comprehensive CDN sample loading diagnostic report
		this.generateCDNDiagnosticReport();

		try {
			logger.debug('audio', 'Initializing AudioEngine');
			
			// Start Tone.js
			await start();
			logger.debug('audio', 'Tone.js started successfully');

			// Create master volume control
			this.volume = new Volume(this.settings.volume).toDestination();
			logger.debug('audio', 'Master volume created');

			// Initialize effects first to ensure volume/effects maps are populated
			await this.initializeEffects();

			// Initialize instruments
			await this.initializeInstruments();

			// Initialize advanced synthesis engines
			await this.initializeAdvancedSynthesis();

			// Initialize musical theory engine for harmonic constraints
			this.initializeMusicalTheory();

			// Check if enhanced routing is enabled
			if (this.settings.enhancedRouting?.enabled) {
				await this.initializeEnhancedRouting();
			} else {
				this.applyEffectSettings();
			}

			this.isInitialized = true;
			
			// Issue #007 Fix: Generate comprehensive initialization report
			this.generateInitializationReport();
			
			logger.info('audio', 'AudioEngine initialized successfully');
		} catch (error) {
			logger.error('audio', 'Failed to initialize AudioEngine', error);
			throw error;
		}
	}

	/**
	 * Issue #007 Fix: Generate comprehensive initialization report
	 */
	private generateInitializationReport(): void {
		const report = {
			totalInstruments: this.instruments.size,
			configuredVolumes: this.instrumentVolumes.size,
			configuredEffects: this.instrumentEffects.size,
			enabledInstruments: this.getEnabledInstrumentsForTesting().length,
			percussionEngine: !!this.percussionEngine,
			electronicEngine: !!this.electronicEngine,
			voiceManager: !!this.voiceManager,
			effectBusManager: !!this.effectBusManager,
			enhancedRouting: this.settings.enhancedRouting?.enabled ?? false,
			perInstrumentQuality: 'Individual instrument control',
			performanceMode: this.settings.performanceMode?.mode ?? 'medium'
		};
		
		// Generate status summary
		const status = 'Optimal';
		const quality = report.percussionEngine && report.electronicEngine ? 'Full Advanced Synthesis' : 'Standard Synthesis';
		
		logger.info('initialization-report', 'Audio Engine Initialization Summary', {
			status,
			quality,
			instruments: {
				total: report.totalInstruments,
				enabled: report.enabledInstruments,
				volumeControls: report.configuredVolumes,
				effectsChains: report.configuredEffects
			},
			engines: {
				percussion: report.percussionEngine ? 'Ready' : 'Disabled',
				electronic: report.electronicEngine ? 'Ready' : 'Disabled',
				voiceManager: report.voiceManager ? 'Ready' : 'Missing',
				effectBus: report.effectBusManager ? 'Ready' : 'Missing'
			},
			configuration: {
				audioMode: 'Per-instrument quality control',
				performanceMode: report.performanceMode,
				enhancedRouting: report.enhancedRouting ? 'Enabled' : 'Disabled'
			}
		});
	}

	private async initializeAdvancedSynthesis(): Promise<void> {
		logger.info('advanced-synthesis', 'Initializing Phase 8 advanced synthesis engines');
		
		try {
			// Issue #010 Fix: Only initialize percussion engine if percussion instruments are enabled
			const hasPercussionEnabled = this.hasPercussionInstrumentsEnabled();
			logger.debug('percussion', '🚀 ISSUE #010 DEBUG: Percussion initialization check', {
				hasPercussionEnabled,
				enabledInstruments: Object.keys(this.settings.instruments).filter(name => 
					this.settings.instruments[name as keyof typeof this.settings.instruments]?.enabled
				),
				percussionInstruments: ['timpani', 'xylophone', 'vibraphone', 'gongs'].filter(name =>
					this.settings.instruments[name as keyof typeof this.settings.instruments]?.enabled
				)
			});
			
			if (this.volume && hasPercussionEnabled) {
				logger.debug('percussion', 'Percussion instruments enabled, initializing percussion engine');
				this.percussionEngine = new PercussionEngine(this.volume, 'ogg');
				await this.percussionEngine.initializePercussion();
				logger.debug('percussion', 'Advanced percussion synthesis initialized');
			} else {
				logger.info('percussion', '🚀 ISSUE #010 FIX: Skipping percussion engine initialization (no percussion instruments enabled)');
			}
			
			// Initialize electronic synthesis engine only if electronic instruments are enabled
			const hasElectronicEnabled = this.hasElectronicInstrumentsEnabled();
			if (this.volume && hasElectronicEnabled) {
				logger.debug('electronic', 'Electronic instruments enabled, initializing electronic engine');
				this.electronicEngine = new ElectronicEngine(this.volume);
				await this.electronicEngine.initializeElectronic();
				logger.debug('electronic', 'Advanced electronic synthesis initialized');
			} else {
				logger.info('electronic', 'Skipping electronic engine initialization (no electronic instruments enabled)');
			}

			// Initialize rhythmic percussion accent layer
			if (this.volume && this.settings.percussionAccents?.enabled) {
				logger.debug('rhythmic-percussion', 'Initializing rhythmic percussion accent layer');
				this.rhythmicPercussion = new RhythmicPercussionEngine(this.settings.percussionAccents);
				await this.rhythmicPercussion.initialize(this.volume);
				logger.debug('rhythmic-percussion', 'Rhythmic percussion initialized');
			} else {
				logger.info('rhythmic-percussion', 'Skipping rhythmic percussion initialization (disabled in settings)');
			}
			
			// Initialize master effects
			await this.initializeMasterEffects();
			
			// Initialize performance optimization
			this.initializePerformanceOptimization();
			
			logger.info('advanced-synthesis', 'Advanced synthesis engines ready');
		} catch (error) {
			logger.error('advanced-synthesis', 'Failed to initialize advanced synthesis', error);
			// Don't throw - fall back to basic synthesis
		}
	}

	/**
	 * Initialize Musical Theory Engine for harmonic constraints
	 */
	private initializeMusicalTheory(): void {
		try {
			if (!this.settings.audioEnhancement?.musicalTheory) {
				logger.warn('musical-theory', 'Musical theory settings not found, skipping initialization');
				return;
			}

			const theorySettings = this.settings.audioEnhancement.musicalTheory;

			// Create config from settings
			const config: MusicalTheoryConfig = {
				enabled: theorySettings.enforceHarmony ?? true,
				rootNote: (theorySettings.rootNote as NoteName) || 'C',
				scale: (theorySettings.scale as ScaleType) || 'major',
				enforceHarmony: theorySettings.enforceHarmony ?? true,
				quantizationStrength: theorySettings.quantizationStrength ?? 0.8,
				dissonanceThreshold: theorySettings.dissonanceThreshold ?? 0.5,
				allowChromaticPassing: theorySettings.allowChromaticPassing ?? false,
				dynamicScaleModulation: theorySettings.dynamicScaleModulation ?? false,
				preferredChordProgression: theorySettings.preferredChordProgression
			};

			this.musicalTheoryEngine = new MusicalTheoryEngine(config);

			logger.info('musical-theory', 'Musical Theory Engine initialized', {
				scale: config.scale,
				rootNote: config.rootNote,
				enforceHarmony: config.enforceHarmony,
				quantizationStrength: config.quantizationStrength
			});
		} catch (error) {
			logger.error('musical-theory', 'Failed to initialize Musical Theory Engine', error);
			// Don't throw - continue without harmonic constraints
		}
	}

	/**
	 * Quantize a frequency to the current musical scale
	 * @param frequency The input frequency in Hz
	 * @returns The quantized frequency that fits the scale
	 */
	private quantizeFrequency(frequency: number): number {
		// If musical theory engine not initialized or enforce harmony disabled, return original
		if (!this.musicalTheoryEngine || !this.settings.audioEnhancement?.musicalTheory?.enforceHarmony) {
			return frequency;
		}

		try {
			// Use the musical theory engine to constrain to scale
			const quantized = this.musicalTheoryEngine.constrainPitchToScale(frequency);

			const cents = 1200 * Math.log2(quantized / frequency);
			logger.info('musical-theory', 'Frequency quantized', {
				original: frequency.toFixed(2),
				quantized: quantized.toFixed(2),
				shift: cents.toFixed(1) + ' cents',
				scale: this.settings.audioEnhancement.musicalTheory.scale,
				rootNote: this.settings.audioEnhancement.musicalTheory.rootNote
			});

			return quantized;
		} catch (error) {
			logger.warn('musical-theory', 'Failed to quantize frequency, using original', error);
			return frequency;
		}
	}

	private async initializeEffects(): Promise<void> {
		// Initialize per-instrument effects and volume controls - Phase 8B: Now supporting 49 instruments (Complete Orchestral Vision + Environmental Sounds + New String Instruments + All 10 Whale Species + Bassoon)
		const instruments = ['piano', 'organ', 'strings', 'flute', 'clarinet', 'saxophone', 'electricPiano', 'harpsichord', 'accordion', 'celesta', 'violin', 'cello', 'guitar', 'contrabass', 'guitarElectric', 'guitarNylon', 'bassElectric', 'harp', 'trumpet', 'frenchHorn', 'trombone', 'tuba', 'oboe', 'bassoon', 'timpani', 'xylophone', 'vibraphone', 'gongs', 'leadSynth', 'bassSynth', 'arpSynth', 'whaleHumpback', 'whaleBlue', 'whaleOrca', 'whaleGray', 'whaleSperm', 'whaleMinke', 'whaleFin', 'whaleRight', 'whaleSei', 'whalePilot'];
		
		for (const instrumentName of instruments) {
			// Create volume control with settings from constants or default
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			const volumeLevel = instrumentSettings?.volume ?? DEFAULT_SETTINGS.instruments[instrumentName as keyof typeof DEFAULT_SETTINGS.instruments]?.volume ?? 0.7;
			const volume = new Volume(volumeLevel);
			this.instrumentVolumes.set(instrumentName, volume);
			
			// Create effects with settings from constants or defaults
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Effect map stores heterogeneous Tone.js effect instances
			const effectMap = new Map<string, any>();
			const effectSettings = instrumentSettings?.effects ?? DEFAULT_SETTINGS.instruments[instrumentName as keyof typeof DEFAULT_SETTINGS.instruments]?.effects;
			
			// Create reverb for this instrument
			const reverbSettings = effectSettings?.reverb?.params ?? { decay: 1.8, preDelay: 0.02, wet: 0.25 };
			const reverb = new Reverb({
				decay: reverbSettings.decay,      
				preDelay: reverbSettings.preDelay,  
				wet: reverbSettings.wet        
			});
			await reverb.generate();
			effectMap.set('reverb', reverb);

			// Create chorus for this instrument
			const chorusSettings = effectSettings?.chorus?.params ?? { frequency: 0.8, delayTime: 4.0, depth: 0.5, feedback: 0.05 };
			const chorus = new Chorus({
				frequency: chorusSettings.frequency,   
				delayTime: chorusSettings.delayTime,   
				depth: chorusSettings.depth,       
				feedback: chorusSettings.feedback,   
				spread: 120       
			});
			chorus.start();
			effectMap.set('chorus', chorus);

			// Create filter for this instrument
			const filterSettings = effectSettings?.filter?.params ?? { frequency: 3500, type: 'lowpass' as const, Q: 0.8 };
			const filter = new Filter({
				frequency: filterSettings.frequency,  
				type: filterSettings.type,
				rolloff: -24,     
				Q: filterSettings.Q           
			});
			effectMap.set('filter', filter);
			
			this.instrumentEffects.set(instrumentName, effectMap);
		}

		// Validate configuration coverage
		this.validateInstrumentConfigurations(instruments);
		
		logger.info('initialization', 'Per-instrument volume controls and effects initialized', {
			instrumentCount: instruments.length,
			effectsPerInstrument: 3,
			volumeControlsCreated: instruments.length
		});
	}
	
	/**
	 * Issue #007 Fix: Validate that all instruments have complete configuration
	 */
	private validateInstrumentConfigurations(instruments: string[]): void {
		const missingConfigurations: string[] = [];
		const defaultsApplied: string[] = [];
		
		for (const instrumentName of instruments) {
			const hasVolume = this.instrumentVolumes.has(instrumentName);
			const hasEffects = this.instrumentEffects.has(instrumentName);
			const hasSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			const hasDefaults = DEFAULT_SETTINGS.instruments[instrumentName as keyof typeof DEFAULT_SETTINGS.instruments];
			
			if (!hasVolume || !hasEffects) {
				missingConfigurations.push(instrumentName);
			}
			
			if (!hasSettings && hasDefaults) {
				defaultsApplied.push(instrumentName);
			}
		}
		
		if (missingConfigurations.length > 0) {
			logger.error('configuration', 'Instruments missing volume or effects configuration', {
				instruments: missingConfigurations,
				count: missingConfigurations.length
			});
		}
		
		if (defaultsApplied.length > 0) {
			logger.debug('configuration', 'Applied default configuration for instruments', {
				instruments: defaultsApplied,
				count: defaultsApplied.length
			});
		}
		
		logger.info('configuration', 'Configuration validation completed', {
			totalInstruments: instruments.length,
			fullyConfigured: instruments.length - missingConfigurations.length,
			missingConfiguration: missingConfigurations.length,
			defaultsApplied: defaultsApplied.length
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

	private async createEffectInstance(node: EffectNode): Promise<unknown> {
		interface EffectSettings {
			params: Record<string, unknown>;
		}

		try {
			switch (node.type) {
				case 'reverb':
					const reverbSettings = node.settings as EffectSettings;
					const reverb = new Reverb(reverbSettings.params);
					await reverb.generate();
					return reverb;

				case 'chorus':
					const chorusSettings = node.settings as EffectSettings;
					const chorus = new Chorus(chorusSettings.params);
					chorus.start();
					return chorus;

				case 'filter':
					const filterSettings = node.settings as EffectSettings;
					const filter = new Filter(filterSettings.params);
					return filter;

				case 'delay':
					const delaySettings = node.settings as EffectSettings;
					const delay = new Delay(delaySettings.params);
					return delay;

				case 'distortion':
					const distortionSettings = node.settings as EffectSettings;
					const distortion = new Distortion(distortionSettings.params);
					return distortion;

				case 'compressor':
					const compressorSettings = node.settings as EffectSettings;
					const compressor = new Compressor(compressorSettings.params);
					return compressor;
					
				default:
					logger.warn('enhanced-routing', `Unknown effect type: ${node.type as string}`);
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accepts any Tone.js audio node as instrument output
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
		logger.debug('synthesis', 'Connecting synthesis instruments to master output');

		for (const [instrumentName, instrument] of this.instruments) {
			const volume = this.instrumentVolumes.get(instrumentName);
			
			if (!volume) {
				logger.error('synthesis', `Missing volume for instrument: ${instrumentName} - this indicates an initialization order problem`);
				continue;
			}

			// In synthesis mode, connect directly to master for clean audio path
			// Effects processing can be added later as needed
			if (this.volume) {
				volume.connect(this.volume);
				logger.debug('synthesis', `Connected ${instrumentName} directly to master output (synthesis mode)`);
			} else {
				logger.error('synthesis', `Master volume not available when connecting ${instrumentName}`);
			}
		}
	}

	private async initializeInstruments(): Promise<void> {
		const configs = this.getSamplerConfigs();
		
		// Per-instrument quality control - each instrument decides synthesis vs samples individually
		logger.info('instruments', 'Initializing instruments with per-instrument quality control');
		
		// Get all instruments that are enabled in settings
		const allInstruments = [
			'piano', 'organ', 'strings', 'flute', 'clarinet', 'saxophone', 
			'electricPiano', 'harpsichord', 'accordion', 'celesta', 
			'violin', 'cello', 'guitar', 'contrabass', 'guitarElectric', 'guitarNylon', 'bassElectric', 'harp', 
			'trumpet', 'frenchHorn', 'trombone', 'tuba', 'bassoon', 'oboe', 
			'timpani', 'xylophone', 'vibraphone', 'gongs', 'leadSynth', 'bassSynth', 'arpSynth', 'whaleHumpback'
		];
		
		const enabledInstruments = allInstruments.filter(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			return instrumentSettings?.enabled === true;
		});
		
		logger.info('instruments', `Initializing ${enabledInstruments.length} enabled instruments with individual quality control`);
		
		// Initialize each enabled instrument based on its individual useHighQuality setting
		for (const instrumentName of enabledInstruments) {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			const useHighQuality = instrumentSettings?.useHighQuality ?? false;

			const config = configs[instrumentName];
			const hasSamples = config && config.urls && Object.keys(config.urls).length > 0;

			// Debug logging for instrument config resolution
			if (instrumentName === 'frenchHorn' || instrumentName === 'trumpet' || instrumentName === 'saxophone') {
				logger.info('instruments', `${instrumentName} config check`, {
					configExists: !!config,
					hasUrls: config?.urls ? Object.keys(config.urls).length : 0,
					baseUrl: config?.baseUrl,
					sampleUrls: config?.urls ? Object.keys(config.urls) : [],
					useHighQuality,
					hasSamples
				});
			}

			if (useHighQuality && hasSamples) {
				// Use high-quality samples if available and requested
				await this.initializeInstrumentWithSamples(instrumentName, config);
			} else {
				// Use synthesis (either by choice, as fallback, or no samples available)
				if (useHighQuality && !hasSamples) {
					logger.warn('instruments', `${instrumentName} requested high-quality samples but none available, using synthesis`);
				}
				this.initializeInstrumentWithSynthesis(instrumentName);
			}
		}
		
		// Apply instrument settings and connect effects
		this.applyInstrumentSettings();
		
		logger.info('instruments', `Successfully initialized ${enabledInstruments.length} instruments with per-instrument quality control`);
	}
	
	private async initializeInstrumentWithSamples(instrumentName: string, config: Record<string, unknown>): Promise<void> {
		try {
			logger.debug('instruments', `Initializing ${instrumentName} with high-quality samples`);
			
			// Use Promise-based loading for better error handling
			const sampler = await new Promise<Sampler>((resolve, reject) => {
				const samplerInstance = new Sampler({
					...config,
					onload: () => {
						logger.debug('samples', `${instrumentName} samples loaded successfully`);
						resolve(samplerInstance);
					},
					onerror: (error: unknown) => {
						logger.error('samples', `${instrumentName} samples failed to load`, { 
							error: error?.message || error,
							config: {
								baseUrl: config.baseUrl,
								sampleCount: Object.keys(config.urls || {}).length
							}
						});
						reject(new Error(`Sample loading failed: ${error?.message || error}`));
					}
				});
				
				// Timeout after 10 seconds
				setTimeout(() => {
					reject(new Error('Sample loading timeout'));
				}, 10000);
			});
			
			// Create volume control
			const volume = new Volume(-6);
			this.instrumentVolumes.set(instrumentName, volume);
			
			// Connect to effects
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
			
			output.connect(this.volume);
			this.instruments.set(instrumentName, sampler);
			
			logger.info('instruments', `Successfully initialized ${instrumentName} with samples`);
			
		} catch (error) {
			logger.error('instruments', `Failed to initialize ${instrumentName} with samples, falling back to synthesis`, {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				errorType: error?.constructor?.name,
				config: {
					baseUrl: config.baseUrl,
					sampleCount: Object.keys(config.urls || {}).length,
					firstSample: Object.keys(config.urls || {})[0]
				}
			});
			this.initializeInstrumentWithSynthesis(instrumentName);
		}
	}
	
	private initializeInstrumentWithSynthesis(instrumentName: string): void {
		logger.debug('instruments', `Initializing ${instrumentName} with synthesis`);
		
		let synth: PolySynth;
		const maxVoices = this.getInstrumentPolyphonyLimit(instrumentName);
		
		// Use specialized synthesis based on instrument type for better sound quality
		switch (instrumentName) {
			case 'timpani':
				synth = new PolySynth({
					voice: AMSynth,
					maxPolyphony: maxVoices,
					options: {
						oscillator: { type: 'sine' },
						envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 2.0 },
						volume: -12
					}
				});
				break;
			
			case 'xylophone':
			case 'vibraphone':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 4,
						modulationIndex: 2,
						oscillator: { type: 'triangle' },
						envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.5 },
						volume: -10
					}
				});
				break;
			
			case 'strings':
			case 'violin':
			case 'cello':
			case 'contrabass':
			case 'guitar':
			case 'guitarElectric':
			case 'guitarNylon':
			case 'bassElectric':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 1.5,
						modulationIndex: 3,
						oscillator: { type: 'sawtooth' },
						envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 1.5 },
						volume: -8
					}
				});
				break;
			
			case 'flute':
			case 'oboe':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 2,
						modulationIndex: 1,
						oscillator: { type: 'sine' },
						envelope: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 1.0 },
						volume: -6
					}
				});
				break;
			
			case 'clarinet':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 3,
						modulationIndex: 4,
						oscillator: { type: 'square' },
						envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 1.0 },
						volume: -9
					}
				});
				break;
			
			case 'trumpet':
			case 'frenchHorn':
			case 'trombone':
			case 'tuba':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 2,
						modulationIndex: 8,
						oscillator: { type: 'sawtooth' },
						envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 },
						volume: -7
					}
				});
				break;
			
			case 'saxophone':
				synth = new PolySynth({
					voice: AMSynth,
					maxPolyphony: maxVoices,
					options: {
						oscillator: { type: 'sawtooth' },
						envelope: { attack: 0.08, decay: 0.2, sustain: 0.8, release: 1.2 },
						volume: -8
					}
				});
				break;
			
			case 'piano':
			case 'electricPiano':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 1,
						modulationIndex: 1.5,
						oscillator: { type: 'sine' },
						envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 2.0 },
						volume: -6
					}
				});
				break;
			
			case 'organ':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 1,
						modulationIndex: 0.5,
						oscillator: { type: 'square' },
						envelope: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.3 },
						volume: -8
					}
				});
				break;
			
			case 'leadSynth':
			case 'bassSynth':
			case 'arpSynth':
			case 'pad':
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 2,
						modulationIndex: 6,
						oscillator: { type: 'sawtooth' },
						envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.5 },
						volume: -8
					}
				});
				break;
			
			default:
				// Default for any remaining instruments (vocals, etc.)
				synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 1,
						modulationIndex: 2,
						oscillator: { type: 'sine' },
						envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.0 },
						volume: -8
					}
				});
				break;
		}
		
		// Create volume control
		const volume = new Volume(-6);
		this.instrumentVolumes.set(instrumentName, volume);
		
		// Connect synth to volume and effects
		let output = synth.connect(volume);
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
		
		output.connect(this.volume);
		this.instruments.set(instrumentName, synth);
	}

	/**
	 * Initialize persistent whale synthesizer for environmental sounds
	 */
	/**
	 * Issue #015 Fix: Initialize all whale species with proper volume controls and effects
	 * Enhanced whale initialization to handle all whale instruments consistently
	 */
	private initializeWhaleSynthesizer(): void {
		logger.debug('environmental', 'Initializing whale synthesizers for all species');

		// Define all whale instruments that need initialization
		const whaleInstruments = [
			'whaleHumpback', 'whaleBlue', 'whaleOrca', 
			'whaleGray', 'whaleSperm', 'whaleMinke',
			'whaleFin', 'whaleRight', 'whaleSei', 'whalePilot'
		];

		let initializedWhales = 0;

		whaleInstruments.forEach(whaleType => {
			// Issue #015 Fix: Check if whale instrument is enabled before creating
			const instrumentSettings = this.settings.instruments[whaleType as keyof SonigraphSettings['instruments']];
			if (!instrumentSettings?.enabled) {
				logger.debug('environmental', `Skipping disabled whale instrument: ${whaleType}`);
				return;
			}

			logger.info('issue-015-fix', `🐋 WHALE SYNTHESIS: Initializing ${whaleType}`, {
				whaleType,
				enabled: instrumentSettings.enabled,
				action: 'whale-initialization'
			});

			try {
				// Create species-specific synthesizer
				const whaleSynth = this.createWhaleSpecificSynth(whaleType);
				
				// Create volume control - Issue #015 Fix: This was missing for non-humpback whales
				const whaleVolume = new Volume(-6);
				this.instrumentVolumes.set(whaleType, whaleVolume);

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
					logger.debug('environmental', `${whaleType} synthesizer effects chain connected`);
				}).catch((error) => {
					logger.warn('environmental', `Failed to generate ${whaleType} reverb, using fallback`, error);
					// Fallback without reverb
					whaleSynth.connect(whaleChorus).connect(whaleVolume).connect(this.volume);
				});

				// Store persistent synthesizer and effects
				this.instruments.set(whaleType, whaleSynth);
				
				// Store effects for potential later control
				if (!this.instrumentEffects.has(whaleType)) {
					this.instrumentEffects.set(whaleType, new Map());
				}
				const whaleEffects = this.instrumentEffects.get(whaleType);
				if (whaleEffects) {
					whaleEffects.set('reverb', whaleReverb);
					whaleEffects.set('chorus', whaleChorus);
				}

				initializedWhales++;
				logger.info('issue-015-fix', `✅ Successfully initialized ${whaleType}`, {
					whaleType,
					hasVolumeControl: this.instrumentVolumes.has(whaleType),
					hasSynthesizer: this.instruments.has(whaleType),
					action: 'whale-initialization-success'
				});

			} catch (error) {
				logger.error('issue-015-fix', `❌ Failed to initialize ${whaleType}`, {
					whaleType,
					error: error.message,
					action: 'whale-initialization-failure'
				});
			}
		});

		logger.info('environmental', `Whale synthesizers initialized successfully`, {
			totalWhaleTypes: whaleInstruments.length,
			initializedWhales,
			skippedDisabled: whaleInstruments.length - initializedWhales
		});
	}

	/**
	 * Issue #015 Fix: Create whale-specific synthesizers with unique characteristics
	 */
	private createWhaleSpecificSynth(whaleType: string): PolySynth {
		const maxVoices = this.getInstrumentPolyphonyLimit(whaleType);

		// Define whale-specific synthesis characteristics based on species
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Whale synthesis config varies by species without unified type
		let config: any;
		
		switch (whaleType) {
			case 'whaleBlue':
				// Blue whale - infrasonic characteristics
				config = {
					harmonicity: 0.1,
					modulationIndex: 20,
					oscillator: { type: 'sine' },
					modulation: { type: 'sine' },
					envelope: {
						attack: 2.0,
						decay: 1.0,
						sustain: 0.95,
						release: 8.0 // Very long release for infrasonic calls
					},
					modulationEnvelope: {
						attack: 3.0,
						decay: 2.0,
						sustain: 0.8,
						release: 10.0
					}
				};
				break;
			case 'whaleOrca':
				// Orca - high-frequency clicks and calls
				config = {
					harmonicity: 2.0,
					modulationIndex: 6,
					oscillator: { type: 'square' },
					modulation: { type: 'sawtooth' },
					envelope: {
						attack: 0.1,
						decay: 0.3,
						sustain: 0.7,
						release: 2.0
					},
					modulationEnvelope: {
						attack: 0.05,
						decay: 0.2,
						sustain: 0.5,
						release: 1.5
					}
				};
				break;
			case 'whaleGray':
				// Gray whale - migration calls
				config = {
					harmonicity: 0.8,
					modulationIndex: 15,
					oscillator: { type: 'sine' },
					modulation: { type: 'triangle' },
					envelope: {
						attack: 1.0,
						decay: 0.8,
						sustain: 0.85,
						release: 7.0
					},
					modulationEnvelope: {
						attack: 1.5,
						decay: 1.0,
						sustain: 0.7,
						release: 5.0
					}
				};
				break;
			case 'whaleSperm':
				// Sperm whale - echolocation clicks
				config = {
					harmonicity: 3.0,
					modulationIndex: 4,
					oscillator: { type: 'square' },
					modulation: { type: 'pulse' },
					envelope: {
						attack: 0.05,
						decay: 0.1,
						sustain: 0.3,
						release: 1.0
					},
					modulationEnvelope: {
						attack: 0.02,
						decay: 0.1,
						sustain: 0.2,
						release: 0.8
					}
				};
				break;
			case 'whaleHumpback':
			default:
				// Original humpback whale configuration (complex songs) - also fallback
				config = {
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
				};
				break;
		}

		const whaleSynth = new PolySynth({
			voice: FMSynth,
			maxPolyphony: maxVoices,
			options: config
		});

		logger.debug('environmental', `Created ${whaleType} synthesizer with specific characteristics`, {
			whaleType,
			maxVoices,
			harmonicity: config.harmonicity,
			modulationIndex: config.modulationIndex
		});

		return whaleSynth;
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
			perInstrumentQuality: 'Individual instrument control'
		});

		// Create synthesizers for missing instruments (per-instrument quality control)
		logger.info('instruments', 'Creating synthesizers for missing instruments');
		// Issue #014 Fix: Only initialize instruments that are enabled in family settings
		const settings = this.settings; // Capture for arrow function
			
			logger.info('issue-014-fix', '🔧 FAST-PATH SYNTHESIS: Applying enabled instrument filter', {
				totalMissingInstruments: missingKeys.length,
				missingInstruments: missingKeys
			});
			
			missingKeys.forEach(instrumentName => {
							// Issue #014 Fix: Check if instrument is enabled before initializing
			if (settings.instruments[instrumentName as keyof typeof settings.instruments]?.enabled !== true) {
				logger.info('issue-014-fix', `🔧 FAST-PATH SYNTHESIS: Skipping disabled instrument: ${instrumentName}`, {
					instrumentName,
					enabled: settings.instruments[instrumentName as keyof typeof settings.instruments]?.enabled,
					reason: 'disabled-in-family-settings'
				});
				return;
			}
			
			logger.info('issue-014-fix', `🔧 FAST-PATH SYNTHESIS: Initializing enabled instrument: ${instrumentName}`, {
				instrumentName,
				enabled: settings.instruments[instrumentName as keyof typeof settings.instruments]?.enabled
			});
			
			// Check if instrument prefers samples and they're available
			const instrumentSettings = settings.instruments[instrumentName as keyof typeof settings.instruments];
			const useHighQuality = instrumentSettings?.useHighQuality ?? false;
			const config = configs[instrumentName];
			
			if (useHighQuality && config) {
				// Use samples if requested and available
				try {
					const sampler = new Sampler({
						...config,
						onload: () => {
							logger.debug('samples', `${instrumentName} samples loaded successfully`);
						},
						onerror: (error: unknown) => {
							logger.warn('samples', `${instrumentName} samples failed to load, falling back to synthesis`, { error });
							// Fallback handled by synthesis creation below
						}
					});
					
					const volume = new Volume(-6);
					this.instrumentVolumes.set(instrumentName, volume);
					
					sampler.connect(volume);
					if (this.volume) {
						volume.connect(this.volume);
					}
					
					this.instruments.set(instrumentName, sampler);
					logger.debug('instruments', `Created sample-based instrument: ${instrumentName}`);
					return;
				} catch (error) {
					logger.warn('instruments', `Failed to create sampler for ${instrumentName}, using synthesis`, { error });
				}
			}
			
			// Create synthesis instrument (default or fallback)
			const maxVoices = this.getInstrumentPolyphonyLimit(instrumentName);
			const synth = new PolySynth({
				voice: FMSynth,
				maxPolyphony: maxVoices,
				options: {
					oscillator: { type: 'sine' },
					envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.0 }
				}
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
	}

	/**
	 * Re-initialize specific instruments that have corrupted volume nodes
	 * Issue #006 Fix: Targeted re-initialization to avoid affecting healthy instruments
	 */
	private async reinitializeSpecificInstruments(instrumentNames: string[]): Promise<void> {
		logger.info('issue-006-debug', 'Starting targeted instrument re-initialization', {
			instrumentCount: instrumentNames.length,
			instruments: instrumentNames,
			action: 'targeted-reinit-start'
		});

		const configs = this.getSamplerConfigs();

		for (const instrumentName of instrumentNames) {
			try {
				logger.info('issue-006-debug', `Re-initializing ${instrumentName}`, {
					instrumentName,
					configExists: !!configs[instrumentName],
					action: 'individual-reinit-start'
				});

				// Remove existing references (already done in calling code, but ensure cleanup)
				if (this.instruments.has(instrumentName)) {
					const existingInstrument = this.instruments.get(instrumentName);
					existingInstrument?.dispose();
					this.instruments.delete(instrumentName);
				}
				if (this.instrumentVolumes.has(instrumentName)) {
					this.instrumentVolumes.delete(instrumentName);
				}

				// Re-create the specific instrument using synthesis (per-instrument quality control)
				// For now, use synthesis for re-initialization to ensure stability
				logger.info('issue-006-debug', `Re-creating synthesizer for ${instrumentName}`, {
					instrumentName,
					mode: 'synthesis',
					action: 'synth-reinit-start'
				});
				
				// Use same synthesis logic as original initialization
				let synthConfig;
				if (this.isEnvironmentalInstrument(instrumentName)) {
					synthConfig = {
						oscillator: { type: 'sine' as const },
						envelope: { attack: 0.5, decay: 1.0, sustain: 0.8, release: 2.0 }
					};
				} else if (this.isPercussionInstrument(instrumentName)) {
					synthConfig = {
						oscillator: { type: 'triangle' as const },
						envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 }
					};
				} else if (this.isElectronicInstrument(instrumentName)) {
					synthConfig = {
						oscillator: { type: 'sawtooth' as const },
						envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.5 }
					};
				} else {
					synthConfig = {
						oscillator: { type: 'sine' as const },
						envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.0 }
					};
				}
				
				// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
				const maxVoices = this.getInstrumentPolyphonyLimit(instrumentName);
				const synth = new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: synthConfig
				});
				const volume = new Volume(-6);
				
				// Connect synth → volume → master
				synth.connect(volume);
				volume.connect(this.volume);
				
				// Store references
				this.instruments.set(instrumentName, synth);
				this.instrumentVolumes.set(instrumentName, volume);
				
				logger.info('issue-006-debug', `Successfully re-initialized synthesizer for ${instrumentName}`, {
					instrumentName,
					synthType: 'PolySynth',
					finalVolumeValue: volume.volume.value,
					finalVolumeMuted: volume.mute,
					instrumentExists: this.instruments.has(instrumentName),
					volumeNodeExists: this.instrumentVolumes.has(instrumentName),
					action: 'synth-reinit-success'
				});
				
				// Alternative: Sample-based instrument (if needed in future)
				if (false && configs[instrumentName]) {
					// Sample-based instrument
					logger.info('issue-006-debug', `Re-creating sampler for ${instrumentName}`, {
						instrumentName,
						mode: 'samples',
						action: 'sampler-reinit-start'
					});
					
					const sampler = new Sampler(configs[instrumentName]);
					const volume = new Volume(-6);
					
					// Connect sampler to volume
					sampler.connect(volume);
					
					// Connect to master volume
					volume.connect(this.volume);
					
					// Store references
					this.instruments.set(instrumentName, sampler);
					this.instrumentVolumes.set(instrumentName, volume);
					
					logger.info('issue-006-debug', `Successfully re-initialized sampler for ${instrumentName}`, {
						instrumentName,
						finalVolumeValue: volume.volume.value,
						finalVolumeMuted: volume.mute,
						instrumentExists: this.instruments.has(instrumentName),
						volumeNodeExists: this.instrumentVolumes.has(instrumentName),
						action: 'sampler-reinit-success'
					});
				} else {
					logger.error('issue-006-debug', `No valid initialization method for ${instrumentName}`, {
						instrumentName,
						hasSamplerConfig: !!configs[instrumentName],
						perInstrumentQuality: 'Individual instrument control',
						action: 'no-valid-init-method'
					});
				}
			} catch (error) {
				logger.error('issue-006-debug', `Failed to re-initialize ${instrumentName}`, {
					instrumentName,
					error: error.message,
					action: 'individual-reinit-error'
				});
			}
		}

		// Re-apply instrument settings for the re-initialized instruments
		instrumentNames.forEach(instrumentName => {
			const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
			if (instrumentSettings) {
				this.updateInstrumentVolume(instrumentName, instrumentSettings.volume);
				this.setInstrumentEnabled(instrumentName, instrumentSettings.enabled);
			}
		});

		logger.info('issue-006-debug', 'Targeted instrument re-initialization completed', {
			instrumentCount: instrumentNames.length,
			instruments: instrumentNames,
			action: 'targeted-reinit-complete'
		});
	}

	async playSequence(sequence: MusicalMapping[]): Promise<void> {
		try {
			// Issue #006 Comprehensive Debug: Log initial state for this play attempt
			const enabledInstrumentsList = this.getEnabledInstruments();
			logger.info('issue-006-debug', 'PlaySequence initiated - complete state snapshot', {
				sequenceLength: sequence.length,
				isInitialized: this.isInitialized,
				isPlaying: this.isPlaying,
				instrumentMapSize: this.instruments.size,
				enabledInstrumentsCount: enabledInstrumentsList.length,
				enabledInstruments: enabledInstrumentsList,
				audioContextState: getContext().state,
				transportState: getTransport().state,
				currentTime: getContext().currentTime.toFixed(3),
				hasBeenTriggeredCount: 0, // No longer tracking this way
				action: 'play-sequence-init'
			});
			
			logger.info('debug', 'Step 1: Checking initialization state', {
				isInitialized: this.isInitialized,
				instrumentsSize: this.instruments.size
			});
			
			if (!this.isInitialized || !this.instruments.size) {
				logger.warn('playback', '🚀 ISSUE #010 FIX: AudioEngine not initialized, using FAST-PATH initialization!');
				await this.initializeEssentials();
				logger.info('debug', 'Step 2: FAST-PATH initialization completed', {
					isInitialized: this.isInitialized,
					isMinimalMode: this.isMinimalMode,
					instrumentsSize: this.instruments.size
				});
			}

			logger.info('debug', 'Step 3: Checking upgrade conditions', {
				isMinimalMode: this.isMinimalMode,
				shouldUpgrade: this.isMinimalMode
			});

			// Issue #010 Fix: For sequence playback, upgrade to full initialization if needed
			logger.debug('playback', '🚀 ISSUE #010 DEBUG: Checking upgrade conditions', {
				isMinimalMode: this.isMinimalMode,
				instrumentsSize: this.instruments.size,
				hasPiano: this.instruments.has('piano'),
				instrumentsList: Array.from(this.instruments.keys())
			});
			
			// Future-proof upgrade logic: Any time we're in minimal mode during playback, upgrade to full mode
			// This is independent of the number of instruments currently loaded and will work with any minimal initialization strategy
			if (this.isMinimalMode) {
				logger.info('playback', '🚀 ISSUE #010 FIX: Upgrading from minimal to full initialization for sequence playback');
				
				// Check if any enabled instruments require high quality samples
				const requiresSamples = enabledInstrumentsList.some(instrumentName => {
					const settings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
					return settings?.useHighQuality === true;
				});
				
				logger.info('debug', 'Step 4: Sample requirements analysis', {
					enabledInstruments: enabledInstrumentsList,
					requiresSamples,
					pianoUseHighQuality: this.settings.instruments.piano?.useHighQuality,
					pianoEnabled: this.settings.instruments.piano?.enabled
				});
				
				const hasPercussion = this.hasPercussionInstrumentsEnabled();
				const hasElectronic = this.hasElectronicInstrumentsEnabled();
				const isSynthesisMode = false; // Per-instrument quality control - no global synthesis mode
				
				logger.debug('playback', '🚀 ISSUE #010 DEBUG: Upgrade analysis', {
					currentInstrumentCount: this.instruments.size,
					currentInstruments: Array.from(this.instruments.keys()),
					hasPercussionEnabled: hasPercussion,
					hasElectronicEnabled: hasElectronic,
					willSkipPercussion: !hasPercussion,
					willSkipElectronic: !hasElectronic,
					isSynthesisMode,
					requiresSamples,
					perInstrumentQuality: 'Individual instrument control',
					enabledInstruments: Object.keys(this.settings.instruments).filter(name => 
						this.settings.instruments[name as keyof typeof this.settings.instruments]?.enabled
					)
				});

				// Issue #010 Critical Fix: In synthesis mode, skip CDN sample loading entirely
				if (isSynthesisMode) {
					logger.warn('playbook', '🚀 ISSUE #010 FIX: Synthesis mode detected - initializing full synthesis for all enabled instruments');
					
					// Ensure master volume exists before synthesis initialization
					if (!this.volume) {
						logger.debug('playbook', 'Creating master volume for synthesis mode');
						this.volume = new Volume(this.settings.volume).toDestination();
					}
					
					// Clear existing minimal instruments to prevent conflicts
					logger.debug('playbook', 'Clearing minimal mode instruments before full initialization', {
						instrumentsToDispose: Array.from(this.instruments.keys())
					});
					this.instruments.forEach(instrument => instrument.dispose());
					this.instruments.clear();
					
					// Initialize full synthesis for all 34 instruments (skip CDN loading)
					await this.initializeInstruments(); // This method handles synthesis mode and routing
					await this.initializeEffects();
					
					// NOTE: Synthesis instruments are already connected during initializeInstruments()
					// No additional routing needed - direct synthesis: synth → volume → master
					
					await this.initializeAdvancedSynthesis();
					
					// Mark as fully initialized
					this.isMinimalMode = false;
					this.isInitialized = true;
					
					logger.info('playbook', '🚀 ISSUE #010 FIX: Full synthesis initialization completed', {
						instrumentsCreated: this.instruments.size,
						instrumentsList: Array.from(this.instruments.keys())
					});
				} else {
					// Sample-based mode: use CDN samples
					logger.info('debug', 'Step 5: Upgrading to full initialization with samples');
					await this.forceFullInitialization();
					logger.info('debug', 'Step 6: Full initialization completed');
				}
				
				// Issue #010 Fix: Log state after upgrade to confirm instruments are loaded
				logger.info('playback', '🚀 ISSUE #010 FIX: Upgrade completed - verifying instruments', {
					instrumentsAfterUpgrade: this.instruments.size,
					instrumentsList: Array.from(this.instruments.keys()),
					isInitialized: this.isInitialized,
					isMinimalMode: this.isMinimalMode
				});
			} else {
				logger.info('debug', 'Step 3: No upgrade needed - not in minimal mode');
			}

			// Issue #010 Fix: Debug sequence instrument requirements vs available instruments
			const sequenceInstruments = [...new Set(sequence.map(note => note.instrument))];
			logger.info('playback', '🚀 ISSUE #010 DEBUG: Sequence instrument analysis', {
				sequenceInstruments,
				availableInstruments: Array.from(this.instruments.keys()),
				enabledInstruments: enabledInstrumentsList,
				sequenceLength: sequence.length,
				instrumentMapSize: this.instruments.size
			});

			logger.info('debug', 'Step 7: Starting volume node inspection');

			// Issue #006 Fix: Ensure enabled instruments have properly functioning volume nodes
			// Check for both missing volume nodes and corrupted volume nodes (null value, muted)
			const corruptedVolumeInstruments = enabledInstrumentsList.filter(instrumentName => {
				const hasInstrument = this.instruments.has(instrumentName);
				const volumeNode = this.instrumentVolumes.get(instrumentName);
				
				// Log detailed volume node state for each enabled instrument
				logger.info('issue-006-debug', 'Volume node inspection for enabled instrument', {
					instrumentName,
					hasInstrument,
					volumeNodeExists: !!volumeNode,
					volumeValue: volumeNode?.volume?.value ?? 'no-volume-property',
					volumeMuted: volumeNode?.mute ?? 'no-mute-property',
					volumeConstructor: volumeNode?.constructor?.name || 'no-constructor',
					action: 'volume-node-inspection'
				});
				
				// Missing volume node entirely
				if (hasInstrument && !volumeNode) {
					logger.warn('issue-006-debug', 'Missing volume node detected', {
						instrumentName,
						action: 'missing-volume-node'
					});
					return true;
				}
				
				// Check for volume node corruption (null value indicates corruption)
				// Note: After Issue #006 fix, mute=true is normal for disabled instruments
				if (volumeNode && volumeNode.volume.value === null) {
					logger.error('issue-006-debug', 'Corrupted volume node detected (null value)', {
						instrumentName,
						volumeValue: volumeNode.volume.value,
						volumeMuted: volumeNode.mute,
						action: 'corrupted-volume-node'
					});
					return true;
				}
				
				// Check if instrument should be enabled but is muted (potential inconsistency)
				const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
				if (hasInstrument && volumeNode && instrumentSettings?.enabled && volumeNode.mute === true) {
					// Issue #009 Fix: Convert to debug level to reduce log noise
					logger.debug('issue-006-debug', 'Enabled instrument is muted - potential state inconsistency', {
						instrumentName,
						instrumentEnabled: instrumentSettings.enabled,
						volumeMuted: volumeNode.mute,
						action: 'enabled-but-muted'
					});
					return true;
				}
				
				return false;
			});

			logger.info('debug', 'Step 8: Volume node inspection completed', {
				corruptedCount: corruptedVolumeInstruments.length,
				corruptedInstruments: corruptedVolumeInstruments
			});

			if (corruptedVolumeInstruments.length > 0) {
				// Issue #009 Fix: Only log as error in debug mode, otherwise use debug level to reduce noise
				const currentLogLevel = LoggerFactory.getLogLevel();
				if (currentLogLevel === 'debug') {
					logger.error('issue-006-debug', 'CRITICAL: Found enabled instruments with corrupted volume nodes - attempting re-initialization', {
						corruptedVolumeInstruments,
						corruptedCount: corruptedVolumeInstruments.length,
						totalEnabledCount: enabledInstrumentsList.length,
						action: 'corrupted-volume-nodes-detected'
					});
				} else {
					logger.debug('issue-006-debug', 'Found enabled instruments with muted volume nodes - attempting re-initialization', {
						corruptedVolumeInstruments,
						corruptedCount: corruptedVolumeInstruments.length,
						totalEnabledCount: enabledInstrumentsList.length,
						action: 'muted-volume-nodes-detected'
					});
				}
				
				// Clear corrupted volume nodes before re-initialization
				corruptedVolumeInstruments.forEach(instrumentName => {
					logger.info('issue-006-debug', 'Clearing corrupted volume node', {
						instrumentName,
						action: 'clear-corrupted-volume'
					});
					this.instrumentVolumes.delete(instrumentName);
				});
				
				// Re-initialize ONLY the corrupted instruments to avoid affecting healthy ones
				logger.info('issue-006-debug', 'Starting targeted re-initialization for corrupted instruments', {
					corruptedInstruments: corruptedVolumeInstruments,
					action: 'start-targeted-reinitialization'
				});
				await this.reinitializeSpecificInstruments(corruptedVolumeInstruments);
				
				// Verify re-initialization success - only check instruments that should be enabled
				const stillCorrupted = corruptedVolumeInstruments.filter(instrumentName => {
					const volumeNode = this.instrumentVolumes.get(instrumentName);
					const instrumentSettings = this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']];
					
					// Only consider it corrupted if the volume node is missing or has null value
					// Don't consider mute=true as corruption since that's the correct state for disabled instruments
					if (!volumeNode || volumeNode.volume.value === null) {
						return true;
					}
					
					// If the instrument should be enabled but is muted, that indicates corruption
					if (instrumentSettings?.enabled && volumeNode.mute === true) {
						// Issue #009 Fix: Convert to debug level to reduce log noise
						logger.debug('issue-006-debug', `Enabled instrument ${instrumentName} is unexpectedly muted`, {
							instrumentName,
							shouldBeEnabled: instrumentSettings.enabled,
							actuallyMuted: volumeNode.mute,
							action: 'unexpected-mute-on-enabled-instrument'
						});
						return true;
					}
					
					return false;
				});
				
				if (stillCorrupted.length > 0) {
					// Issue #009 Fix: Only log as error in debug mode, otherwise use debug level to reduce noise
					if (currentLogLevel === 'debug') {
						logger.error('issue-006-debug', 'CRITICAL: Re-initialization failed to fix corrupted volume nodes', {
							stillCorrupted,
							action: 'reinitialization-failed'
						});
					} else {
						logger.debug('issue-006-debug', 'Re-initialization could not unmute some volume nodes', {
							stillCorrupted,
							action: 'reinitialization-incomplete'
						});
					}
				} else {
					logger.info('issue-006-debug', 'Re-initialization successfully fixed all corrupted volume nodes', {
						fixedInstruments: corruptedVolumeInstruments,
						action: 'reinitialization-success'
					});
				}
			}

			logger.info('debug', 'Step 9: Continuing with playback logic...');

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

				// Apply chord fusion if enabled
				let processedSequence = sequence;
				if (this.chordFusionEngine && this.settings.audioEnhancement?.chordFusion?.enabled) {
					processedSequence = this.applyChordFusion(sequence);
					logger.info('chord-fusion', 'Chord fusion applied to sequence', {
						originalNotes: sequence.length,
						processedNotes: processedSequence.length,
						reduction: sequence.length - processedSequence.length
					});
				}

				// Notes are now tracked in PlaybackOptimizer without modifying original objects
				logger.debug('playback', 'Preparing sequence for playback', {
					noteCount: processedSequence.length
				});

				this.currentSequence = processedSequence;
				this.isPlaying = true;
				this.scheduledEvents = [];
				
				// Enhanced Play Button: Emit playback started event
				this.sequenceStartTime = Date.now();
				this.eventEmitter.emit('playback-started', null);

				// Issue #006 Debug: Log Transport state before reset
				logger.info('issue-006-debug', 'Transport state before reset', {
					state: getTransport().state,
					position: getTransport().position,
					seconds: getTransport().seconds,
					bpm: getTransport().bpm.value,
					action: 'transport-state-before-reset'
				});

				// Ensure Transport is stopped and reset
				if (getTransport().state === 'started') {
					getTransport().stop();
					getTransport().cancel(); // Clear all scheduled events
					logger.info('issue-006-debug', 'Transport stopped and cancelled', {
						action: 'transport-stop-cancel'
					});
				}

				// Issue #006 Debug: Log Transport state after reset
				logger.info('issue-006-debug', 'Transport state after reset', {
					state: getTransport().state,
					position: getTransport().position,
					seconds: getTransport().seconds,
					action: 'transport-state-after-reset'
				});

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

				// Issue #010 Fix: Removed test tone - this was causing the "brief note" the user heard
				// The real sequence should play via the real-time scheduling system
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
				
				// Enhanced Play Button: Emit error event
				const errorData: PlaybackErrorData = {
					error: error instanceof Error ? error : new Error(String(error)),
					context: 'sequence-processing'
				};
				this.eventEmitter.emit('playback-error', errorData);
				
				throw error;
			}
		} catch (error) {
			logger.error('playback', 'CRITICAL: Exception in playSequence method', {
				error: error.message,
				stack: error.stack,
				sequenceLength: sequence?.length,
				isInitialized: this.isInitialized,
				isMinimalMode: this.isMinimalMode,
				instrumentsSize: this.instruments.size
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
		
		// Preprocess sequence for efficient lookup
		this.playbackOptimizer.preprocessSequence(sequence);
		this.progressThrottleCounter = 0;

		// Record start time
		this.realtimeStartTime = getContext().currentTime;
		this.lastTriggerTime = 0;
		
		// Start the audio context if suspended and optimize for latency
		if (getContext().state === 'suspended') {
			getContext().resume();
			logger.debug('context', 'Resumed suspended audio context for real-time playback');
		}
		
		// Set audio context to reduce latency and improve stability
		try {
			if (getContext().latencyHint !== 'playback') {
				logger.debug('context', 'Optimizing audio context for playback latency');
			}
		} catch (e) {
			// Ignore if latencyHint is not supported
		}

		// Use a 400ms interval to minimize timing conflicts
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

			// Issue #006 Debug: Log timing information
			logger.debug('issue-006-debug', 'Realtime timer tick', {
				elapsedTime: elapsedTime.toFixed(3),
				contextTime: currentTime.toFixed(3),
				contextState: getContext().state,
				isPlaying: this.isPlaying,
				instrumentCount: this.instruments.size,
				action: 'timer-tick'
			});

			// Find notes that should play now using optimized lookup
			const notesToPlay = this.playbackOptimizer.getNotesToPlay(elapsedTime);

			// Issue #006 Debug: Log note filtering results
			if (notesToPlay.length > 0 || elapsedTime < 5) { // Log for first 5 seconds or when notes found
				const stats = this.playbackOptimizer.getStats();
				const progress = this.playbackOptimizer.getProgress(elapsedTime);
				logger.debug('issue-006-debug', 'Note filtering completed', {
					totalNotes: stats.totalNotes,
					triggeredNotes: progress.currentIndex,
					notesToPlay: notesToPlay.length,
					sampleTiming: notesToPlay.length > 0 ? notesToPlay[0].timing : 'none',
					elapsedTime: elapsedTime.toFixed(3),
					action: 'note-filtering'
				});
			}

			// Issue #006 Fix: Minimal spacing to prevent overlap while allowing sequence flow
			const timeSinceLastTrigger = elapsedTime - this.lastTriggerTime;
			if (timeSinceLastTrigger < 0.05 && notesToPlay.length > 0) {
				logger.debug('issue-006-debug', 'Note skipped due to spacing constraint', {
					timeSinceLastTrigger: timeSinceLastTrigger.toFixed(3),
					notesToPlay: notesToPlay.length,
					action: 'skip-spacing'
				});
				return; // Skip this timer tick if too soon after last trigger
			}

			// Take only the first note to prevent overload
			if (notesToPlay.length === 0) return;
			
			const mapping = notesToPlay[0];
			this.lastTriggerTime = elapsedTime;

			// Mark as triggered to prevent re-triggering
			this.playbackOptimizer.markNoteTriggered(mapping);

			// Check if this is a chord note (from chord fusion)
			if (mapping.metadata?.isChord && mapping.metadata?.chordNotes) {
				logger.info('chord-fusion', 'Triggering chord', {
					chordSize: mapping.metadata.chordSize,
					chordNotes: mapping.metadata.chordNotes.length
				});

				// Trigger all notes in the chord simultaneously
				const instrumentName = mapping.instrument || this.getDefaultInstrument(mapping);
				const synth = this.instruments.get(instrumentName);

				if (synth) {
					mapping.metadata.chordNotes.forEach((chordNote, index) => {
						// Small micro-delay to prevent phase issues (0-2ms spread)
						const microDelay = index * 0.002;
						const triggerTime = getContext().currentTime + microDelay;

						const quantizedFreq = this.quantizeFrequency(chordNote.pitch);
						const detunedFreq = this.applyFrequencyDetuning(quantizedFreq);

						synth.triggerAttackRelease(detunedFreq, mapping.duration, triggerTime, chordNote.velocity);

						logger.debug('chord-fusion', 'Chord note triggered', {
							pitch: chordNote.pitch,
							index,
							microDelay
						});
					});

					// Emit visualization event for the chord
					this.emitNoteEvent(instrumentName, mapping.pitch, mapping.duration, mapping.velocity, elapsedTime, mapping.nodeId);
				}

				return; // Don't process as single note
			}

			const frequency = mapping.pitch;
			const duration = mapping.duration;
			const velocity = mapping.velocity;

			logger.debug('issue-006-debug', 'About to trigger note - extracting instrument', {
				elapsedTime: elapsedTime.toFixed(3),
				frequency: frequency.toFixed(1),
				duration: duration.toFixed(2),
				mappingInstrument: mapping.instrument || 'none',
				action: 'before-instrument-extraction'
			});

			logger.debug('trigger', `Real-time trigger at ${elapsedTime.toFixed(3)}s: ${frequency.toFixed(1)}Hz for ${duration.toFixed(2)}s`);

			// Determine which instrument to use
			let instrumentName: string;
			try {
				instrumentName = mapping.instrument || this.getDefaultInstrument(mapping);
				logger.debug('issue-006-debug', 'Instrument determined successfully', {
					instrumentName,
					action: 'instrument-determined'
				});
			} catch (error) {
				logger.error('issue-006-debug', 'Failed to determine instrument', {
					error: error.message,
					mapping,
					action: 'instrument-determination-failed'
				});
				return;
			}

			// Issue #006 Debug: Log instrument settings check before potential early return
			
			const instrumentKey = instrumentName as keyof typeof this.settings.instruments;
			
			
			const instrumentSettings = this.settings.instruments[instrumentKey];
			
			
			
			// Check if instrument is enabled in settings
			if (!instrumentSettings?.enabled) {
				return;
			}


			// Use specialized synthesis engines if available
			if (this.percussionEngine && this.isPercussionInstrument(instrumentName)) {
				this.triggerAdvancedPercussion(instrumentName, frequency, duration, velocity, currentTime);
				this.emitNoteEvent(instrumentName, frequency, duration, velocity, elapsedTime);
			} else if (this.electronicEngine && this.isElectronicInstrument(instrumentName)) {
				this.triggerAdvancedElectronic(instrumentName, frequency, duration, velocity, currentTime);
				this.emitNoteEvent(instrumentName, frequency, duration, velocity, elapsedTime);
			} else if (this.isEnvironmentalInstrument(instrumentName)) {
				// Fire and forget - don't block the sequence for external sample loading
				this.triggerEnvironmentalSound(instrumentName, frequency, duration, velocity, currentTime).catch(error => {
					logger.debug('environmental-sound', `Environmental sound failed for ${instrumentName}`, error);
				});
				this.emitNoteEvent(instrumentName, frequency, duration, velocity, elapsedTime);
			} else {
				const synth = this.instruments.get(instrumentName);

				if (synth) {
					try {
						// Quantize frequency to musical scale if harmony enforcement is enabled
						const quantizedFrequency = this.quantizeFrequency(frequency);

						// Phase 3: Apply frequency detuning for phase conflict resolution
						const detunedFrequency = this.applyFrequencyDetuning(quantizedFrequency);

						// Add pre-trigger audio context state logging
						const audioContext = getContext();

						synth.triggerAttackRelease(detunedFrequency, duration, currentTime, velocity);

						// Emit note-triggered event for visualization
						this.emitNoteEvent(instrumentName, detunedFrequency, duration, velocity, elapsedTime);

						// Trigger rhythmic percussion accent if enabled
						if (this.rhythmicPercussion) {
							// Convert frequency to MIDI note number for percussion mapping
							const midiNote = Frequency(frequency, 'hz').toMidi();
							logger.debug('rhythmic-percussion', 'Triggering accent', { frequency, midiNote, velocity });
							this.rhythmicPercussion.triggerAccent({
								pitch: midiNote,
								velocity: velocity,
								duration: duration,
								time: currentTime
							});
						} else {
							logger.debug('rhythmic-percussion', 'No percussion engine available');
						}

						// Schedule cleanup for this note
						const noteId = `note-${this.noteCounter++}`;
						this.audioGraphCleaner.scheduleNoteCleanup(noteId, duration);
						
						// Add post-trigger verification logging
						logger.info('issue-006-debug', 'triggerAttackRelease completed - verifying audio output', {
							instrumentName,
							synthConnected: synth.disposed === false,
							synthLoaded: synth instanceof Sampler ? (synth.loaded || false) : 'not-sampler',
							volumeNodeExists: !!this.instrumentVolumes.get(instrumentName),
							effectsMapExists: !!this.instrumentEffects.get(instrumentName),
							action: 'trigger-attack-release-success'
						});
						
						// Add instrument volume and effects verification
						const volumeNode = this.instrumentVolumes.get(instrumentName);
						const effectsMap = this.instrumentEffects.get(instrumentName);
						logger.info('issue-006-debug', 'Audio pipeline verification', {
							instrumentName,
							volumeNodeExists: !!volumeNode,
							volumeValue: volumeNode?.volume?.value ?? 'no-volume-value',
							volumeMuted: volumeNode?.mute ?? 'no-mute-property',
							volumeConstructor: volumeNode?.constructor?.name || 'no-constructor',
							effectsCount: effectsMap?.size || 0,
							instrumentOutputs: synth.numberOfOutputs,
							masterVolumeValue: this.volume?.volume?.value || 'no-master-volume',
							masterVolumeMuted: this.volume?.mute || false,
							masterVolumeExists: !!this.volume,
							action: 'audio-pipeline-verification'
						});
						
						// Add audio routing verification
						logger.info('issue-006-debug', 'Audio routing verification', {
							instrumentName,
							synthToVolumeConnected: volumeNode ? 'unknown' : 'no-volume-node',
							volumeToDestination: this.volume ? 'unknown' : 'no-master-volume',
							contextDestination: audioContext.destination ? 'exists' : 'missing',
							action: 'audio-routing-verification'
						});
					} catch (error) {
						logger.error('issue-006-debug', 'triggerAttackRelease failed with error', {
							instrumentName,
							error: error.message,
							stack: error.stack,
							action: 'trigger-attack-release-error'
						});
					}
				} else {
					logger.warn('issue-006-debug', 'Instrument not found in instruments map', {
						instrumentName,
						availableInstruments: Array.from(this.instruments.keys()),
						mapSize: this.instruments.size,
						action: 'instrument-not-found'
					});
				}
			}

			// Enhanced Play Button: Emit progress update (throttled)
			this.progressThrottleCounter++;
			if (this.progressThrottleCounter >= this.PROGRESS_THROTTLE_INTERVAL) {
				this.progressThrottleCounter = 0;
				const progressData = this.playbackOptimizer.getProgress(elapsedTime);
				this.eventEmitter.emit('sequence-progress', progressData);
				
				// Check memory pressure and adapt if needed
				if (this.memoryMonitor.shouldTriggerGC()) {
					this.adaptToMemoryPressure();
				}
			}

			// Check if sequence is complete
			const maxEndTime = this.playbackOptimizer.getProgress(elapsedTime).estimatedTotalTime;
			if (elapsedTime > maxEndTime + 1.0) { // Add 1 second buffer
				logger.info('playback', 'Real-time sequence completed');
				
				// Enhanced Play Button: Emit completion before stopping
				this.eventEmitter.emit('playback-ended', null);
				this.stop();
			}
		}, 400); // Check every 400ms to minimize CPU load and timing conflicts
	}

	stop(): void {
		if (!this.isPlaying) {
			logger.debug('playback', 'Stop called but no sequence is playing');
			return;
		}

		logger.info('playback', 'Stopping sequence playback');

		this.isPlaying = false;
		
		// Enhanced Play Button: Emit stopped event
		this.eventEmitter.emit('playback-stopped', null);

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

		// Release all synth voices and disconnect from audio graph
		this.instruments.forEach((synth, instrumentName) => {
			synth.releaseAll();
			// Temporarily disconnect to clean up audio graph
			synth.disconnect();
		});

		this.currentSequence = [];
		
		// Clear frequency history to prevent memory accumulation
		this.frequencyHistory.clear();
		
		// Properly dispose of playback optimizer to release all references
		this.playbackOptimizer.dispose();
		
		// Cancel any pending audio graph cleanups
		this.audioGraphCleaner.cancelAll();
		
		// Reconnect instruments to their volume nodes for future playback
		this.reconnectInstruments();
		
		// Log final memory stats
		this.memoryMonitor.logStats();

		logger.info('playback', 'Sequence stopped and Transport reset');
	}

	async updateSettings(settings: SonigraphSettings): Promise<void> {
		// Deep copy oldSettings to preserve original state for hot-swap comparison
		// Without this, oldSettings and settings point to the same object, preventing change detection
		const oldSettings = this.settings ? JSON.parse(JSON.stringify(this.settings)) : null;
		this.settings = settings;

		// Issue #006 Fix: Invalidate instruments cache when settings change
		// This ensures that instrument enable/disable changes are reflected in playback
		this.onInstrumentSettingsChanged();

		// Hot-swap instruments when enabled/disabled or quality settings change
		if (this.isInitialized && oldSettings) {
			await this.handleInstrumentSettingsChanges(oldSettings, settings);
		}

		// Issue #005 Fix: Update InstrumentConfigLoader with new audio format
		// This ensures that format changes are propagated to the sample loading system
		// Always use ogg format since that's the only format that actually exists on nbrosowsky CDN
		const effectiveFormat = 'ogg';
		this.instrumentConfigLoader.updateAudioFormat(effectiveFormat as 'mp3' | 'wav' | 'ogg');

		// Also update PercussionEngine format if it exists
		if (this.percussionEngine) {
			this.percussionEngine.updateAudioFormat(effectiveFormat as 'wav' | 'ogg' | 'mp3');
		}

		// Update rhythmic percussion engine based on settings
		if (this.volume) {
			if (settings.percussionAccents?.enabled && !this.rhythmicPercussion) {
				// Percussion just enabled - initialize it
				logger.info('rhythmic-percussion', 'Initializing percussion engine from settings update');
				this.rhythmicPercussion = new RhythmicPercussionEngine(settings.percussionAccents);
				await this.rhythmicPercussion.initialize(this.volume);
				logger.info('rhythmic-percussion', 'Percussion engine initialized');
			} else if (!settings.percussionAccents?.enabled && this.rhythmicPercussion) {
				// Percussion just disabled - dispose it
				logger.info('rhythmic-percussion', 'Disposing percussion engine from settings update');
				this.rhythmicPercussion.dispose();
				this.rhythmicPercussion = null;
			} else if (settings.percussionAccents?.enabled && this.rhythmicPercussion) {
				// Percussion still enabled - update configuration
				logger.debug('rhythmic-percussion', 'Updating percussion config', settings.percussionAccents);
				this.rhythmicPercussion.updateConfig(settings.percussionAccents);
			}
		}

		// Update musical theory engine if settings changed
		if (settings.audioEnhancement?.musicalTheory) {
			const theorySettings = settings.audioEnhancement.musicalTheory;

			// Reinitialize if major settings changed
			if (this.musicalTheoryEngine) {
				const config: MusicalTheoryConfig = {
					enabled: theorySettings.enforceHarmony ?? true,
					rootNote: (theorySettings.rootNote as MusicalNote) || 'C',
					scale: (theorySettings.scale as MusicalScale) || 'major',
					enforceHarmony: theorySettings.enforceHarmony ?? true,
					quantizationStrength: theorySettings.quantizationStrength ?? 0.8,
					dissonanceThreshold: theorySettings.dissonanceThreshold ?? 0.5,
					allowChromaticPassing: theorySettings.allowChromaticPassing ?? false,
					dynamicScaleModulation: theorySettings.dynamicScaleModulation ?? false,
					preferredChordProgression: theorySettings.preferredChordProgression
				};

				this.musicalTheoryEngine = new MusicalTheoryEngine(config);
				logger.info('musical-theory', 'Musical Theory Engine updated', {
					scale: config.scale,
					rootNote: config.rootNote,
					enforceHarmony: config.enforceHarmony
				});
			} else if (theorySettings.enforceHarmony) {
				// Initialize if enforce harmony was just enabled
				this.initializeMusicalTheory();
			}
		}

		// Update chord fusion engine if it exists
		if (this.chordFusionEngine) {
			this.chordFusionEngine.updateSettings(settings);
			logger.debug('chord-fusion', 'Chord fusion engine settings updated');
		}

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
	 * Handle hot-swapping of instruments when settings change
	 * Detects enabled/disabled changes and quality setting changes
	 */
	private async handleInstrumentSettingsChanges(oldSettings: SonigraphSettings, newSettings: SonigraphSettings): Promise<void> {
		const instrumentsToAdd: string[] = [];
		const instrumentsToRemove: string[] = [];
		const instrumentsToReinitialize: string[] = [];

		// Check each instrument for changes
		Object.keys(newSettings.instruments).forEach(instrumentName => {
			const oldInstrument = oldSettings.instruments[instrumentName as keyof typeof oldSettings.instruments];
			const newInstrument = newSettings.instruments[instrumentName as keyof typeof newSettings.instruments];

			if (!oldInstrument || !newInstrument) return;

			const wasEnabled = oldInstrument.enabled;
			const isEnabled = newInstrument.enabled;
			const wasHighQuality = oldInstrument.useHighQuality;
			const isHighQuality = newInstrument.useHighQuality;

			// Instrument newly enabled
			if (!wasEnabled && isEnabled) {
				instrumentsToAdd.push(instrumentName);
				logger.info('hot-swap', `Instrument enabled: ${instrumentName}`);
			}
			// Instrument newly disabled
			else if (wasEnabled && !isEnabled) {
				instrumentsToRemove.push(instrumentName);
				logger.info('hot-swap', `Instrument disabled: ${instrumentName}`);
			}
			// Quality setting changed (and instrument is enabled)
			else if (isEnabled && wasHighQuality !== isHighQuality) {
				instrumentsToReinitialize.push(instrumentName);
				logger.info('hot-swap', `Quality changed for ${instrumentName}: ${wasHighQuality} → ${isHighQuality}`);
			}
		});

		// Remove disabled instruments
		for (const instrumentName of instrumentsToRemove) {
			const instrument = this.instruments.get(instrumentName);
			if (instrument) {
				instrument.dispose();
				this.instruments.delete(instrumentName);
				logger.info('hot-swap', `Removed instrument: ${instrumentName}`);
			}
		}

		// Reinitialize instruments with quality changes
		for (const instrumentName of instrumentsToReinitialize) {
			const instrument = this.instruments.get(instrumentName);
			if (instrument) {
				instrument.dispose();
				this.instruments.delete(instrumentName);
			}
			await this.initializeSingleInstrument(instrumentName);
		}

		// Add newly enabled instruments
		for (const instrumentName of instrumentsToAdd) {
			await this.initializeSingleInstrument(instrumentName);
		}

		if (instrumentsToAdd.length > 0 || instrumentsToRemove.length > 0 || instrumentsToReinitialize.length > 0) {
			logger.info('hot-swap', 'Instrument hot-swap complete', {
				added: instrumentsToAdd,
				removed: instrumentsToRemove,
				reinitialized: instrumentsToReinitialize
			});
		}
	}

	/**
	 * Initialize a single instrument (used for hot-swapping)
	 */
	private async initializeSingleInstrument(instrumentName: string): Promise<void> {
		const configs = this.getSamplerConfigs();
		const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];

		if (!instrumentSettings || !instrumentSettings.enabled) {
			logger.debug('hot-swap', `Skipping ${instrumentName} - not enabled`);
			return;
		}

		const useHighQuality = instrumentSettings.useHighQuality ?? false;
		const config = configs[instrumentName];
		const hasSamples = config && config.urls && Object.keys(config.urls).length > 0;

		if (useHighQuality && hasSamples) {
			await this.initializeInstrumentWithSamples(instrumentName, config);
		} else {
			this.initializeInstrumentWithSynthesis(instrumentName);
		}

		logger.info('hot-swap', `Initialized ${instrumentName} successfully`);
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
			const instrumentSettings = (this.settings.instruments as Record<string, unknown>)[instrument] as Record<string, unknown>;
			const effects = instrumentSettings?.effects as Record<string, unknown>;
			const reverbSettings = effects?.reverb as Record<string, unknown>;
			const params = reverbSettings?.params as Record<string, unknown>;
			const wetLevel = params?.wet as number || 0.25;
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
				const instrumentSettings = this.settings.instruments[instrument as keyof typeof this.settings.instruments];
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
		logger.info('issue-006-debug', 'updateInstrumentVolume called', {
			instrumentKey,
			volume,
			volumeNodeExists: !!instrumentVolume,
			previousVolumeValue: instrumentVolume?.volume?.value ?? 'no-volume-node',
			volumeMuted: instrumentVolume?.mute ?? 'no-volume-node',
			action: 'update-volume-start'
		});
		
		if (instrumentVolume) {
			const previousVolume = instrumentVolume.volume.value;
			const dbVolume = Math.log10(Math.max(0.01, volume)) * 20; // Convert to dB
			
			logger.info('issue-006-debug', 'About to set volume value', {
				instrumentKey,
				inputVolume: volume,
				calculatedDbVolume: dbVolume,
				previousVolumeValue: previousVolume,
				action: 'before-volume-assignment'
			});
			
			instrumentVolume.volume.value = dbVolume;
			
			logger.info('issue-006-debug', 'Volume value set', {
				instrumentKey,
				newVolumeValue: instrumentVolume.volume.value,
				dbVolume,
				volumeNodeMuted: instrumentVolume.mute,
				volumeNodeConstructor: instrumentVolume.constructor?.name,
				action: 'after-volume-assignment'
			});
			
			logger.debug('instrument-control', `Updated ${instrumentKey} volume: ${volume} (${dbVolume.toFixed(1)}dB), previous: ${previousVolume?.toFixed(1)}dB`);
		} else {
			logger.error('issue-006-debug', `CRITICAL: No volume control found for ${instrumentKey} in updateInstrumentVolume`, {
				instrumentKey,
				volume,
				volumeMapSize: this.instrumentVolumes.size,
				allVolumeKeys: Array.from(this.instrumentVolumes.keys()),
				action: 'missing-volume-node-error'
			});
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
		// Import validation function at runtime to avoid circular dependency
		const { isValidInstrumentKey } = require('../utils/constants');
		
		if (!isValidInstrumentKey(instrumentKey)) {
			logger.error('instrument-control', `Invalid instrument key: ${instrumentKey}. This may indicate a missing instrument in the settings definition.`);
			return;
		}

		const instrumentVolume = this.instrumentVolumes.get(instrumentKey);
		logger.info('issue-006-debug', 'setInstrumentEnabled called', {
			instrumentKey,
			enabled,
			volumeNodeExists: !!instrumentVolume,
			volumeValue: instrumentVolume?.volume?.value ?? 'no-volume-node',
			volumeMuted: instrumentVolume?.mute ?? 'no-volume-node',
			action: 'set-instrument-enabled-start'
		});
		
		if (instrumentVolume) {
			if (enabled) {
				// Re-enable instrument by unmuting and restoring volume
				logger.info('issue-006-debug', `Re-enabling ${instrumentKey}`, {
					previousMute: instrumentVolume.mute,
					previousVolume: instrumentVolume.volume.value,
					action: 'before-re-enable'
				});
				
				instrumentVolume.mute = false;
				
				const instrumentSettings = this.settings.instruments[instrumentKey as keyof SonigraphSettings['instruments']];
				if (instrumentSettings) {
					this.updateInstrumentVolume(instrumentKey, instrumentSettings.volume);
					logger.info('issue-006-debug', `${instrumentKey} re-enabled successfully`, {
						newMute: instrumentVolume.mute,
						newVolume: instrumentVolume.volume.value,
						targetVolume: instrumentSettings.volume,
						action: 'after-re-enable'
					});
				} else {
					logger.warn('instrument-control', `No settings found for ${instrumentKey} - this indicates a settings/typing mismatch`);
				}
			} else {
				// Issue #006 Fix: Use mute instead of -Infinity volume to prevent corruption
				logger.info('issue-006-debug', `Disabling ${instrumentKey} using mute`, {
					previousMute: instrumentVolume.mute,
					previousVolume: instrumentVolume.volume.value,
					action: 'before-disable'
				});
				
				instrumentVolume.mute = true;
				
				logger.info('issue-006-debug', `${instrumentKey} disabled successfully`, {
					newMute: instrumentVolume.mute,
					newVolume: instrumentVolume.volume.value,
					action: 'after-disable'
				});
			}
			logger.debug('instrument-control', `${enabled ? 'Enabled' : 'Disabled'} ${instrumentKey}`);
		} else {
			logger.error('issue-006-debug', `CRITICAL: No volume control found for ${instrumentKey} during enable/disable`, {
				instrumentKey,
				enabled,
				instrumentExists: this.instruments.has(instrumentKey),
				volumeMapSize: this.instrumentVolumes.size,
				allVolumeKeys: Array.from(this.instrumentVolumes.keys()),
				action: 'missing-volume-node-error'
			});
		}
		
		// Issue #006 Fix: Invalidate cache when instrument enabled state changes
		this.onInstrumentSettingsChanged();
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

	/**
	 * Apply chord fusion to a musical sequence
	 * Groups simultaneous notes into chords based on timing window
	 */
	private applyChordFusion(sequence: MusicalMapping[]): MusicalMapping[] {
		if (!this.chordFusionEngine) {
			return sequence;
		}

		const chordSettings = this.settings.audioEnhancement?.chordFusion;
		if (!chordSettings?.enabled) {
			return sequence;
		}

		logger.debug('chord-fusion', 'Starting chord fusion processing', {
			sequenceLength: sequence.length,
			timingWindow: chordSettings.timingWindow,
			mode: chordSettings.mode
		});

		// Sort sequence by timing
		const sorted = [...sequence].sort((a, b) => a.timing - b.timing);

		// Group notes by timing window
		const groups: MusicalMapping[][] = [];
		let currentGroup: MusicalMapping[] = [];
		let currentGroupStart = -1;

		for (const note of sorted) {
			if (currentGroup.length === 0) {
				// Start new group
				currentGroup = [note];
				currentGroupStart = note.timing;
			} else {
				const timeDiff = Math.abs(note.timing - currentGroupStart) * 1000; // Convert to ms
				const timingWindow = chordSettings.timingWindow || 200;

				if (timeDiff <= timingWindow) {
					// Add to current group
					currentGroup.push(note);
				} else {
					// Save current group and start new one
					groups.push(currentGroup);
					currentGroup = [note];
					currentGroupStart = note.timing;
				}
			}
		}

		// Don't forget the last group
		if (currentGroup.length > 0) {
			groups.push(currentGroup);
		}

		logger.debug('chord-fusion', 'Grouped notes by timing', {
			originalNotes: sequence.length,
			groups: groups.length,
			groupSizes: groups.map(g => g.length)
		});

		// Process each group - combine into chords or keep as individual notes
		const processed: MusicalMapping[] = [];
		const minimumNotes = chordSettings.minimumNotes || 2;

		for (const group of groups) {
			if (group.length < minimumNotes) {
				// Not enough notes for a chord - keep individual notes
				processed.push(...group);
				continue;
			}

			// Check if any note in the group has chord fusion enabled for its layer
			const hasEnabledLayer = group.some(note => {
				const layer = this.getNoteLayer(note);
				return layer && this.isLayerEnabledForChordFusion(layer, chordSettings);
			});

			if (!hasEnabledLayer) {
				// No enabled layers in this group - keep individual notes
				processed.push(...group);
				continue;
			}

			// Create a chord from this group
			const chordNote = this.createChordNote(group, chordSettings);
			processed.push(chordNote);

			logger.debug('chord-fusion', 'Created chord', {
				notesInChord: group.length,
				rootPitch: chordNote.pitch,
				timing: chordNote.timing
			});
		}

		logger.info('chord-fusion', 'Chord fusion complete', {
			originalNotes: sequence.length,
			processedNotes: processed.length,
			chordsCreated: groups.filter(g => g.length >= minimumNotes).length
		});

		return processed;
	}

	/**
	 * Determine the musical layer for a note based on its properties
	 */
	private getNoteLayer(note: MusicalMapping): 'melodic' | 'harmonic' | 'rhythmic' | 'ambient' | null {
		// This is a heuristic - in the future, we might want to add explicit layer tagging
		const instrument = note.instrument || '';
		const pitch = note.pitch;
		const duration = note.duration;

		// Ambient layer: long sustained notes, typically pads/strings
		if (duration > 2.0 && (instrument.includes('pad') || instrument.includes('string'))) {
			return 'ambient';
		}

		// Rhythmic layer: short notes, high velocity
		if (duration < 0.5 && note.velocity > 0.7) {
			return 'rhythmic';
		}

		// Harmonic layer: keyboard/piano instruments with moderate duration
		if ((instrument.includes('piano') || instrument.includes('keyboard')) && duration > 0.5) {
			return 'harmonic';
		}

		// Melodic layer: everything else (leads, woodwinds, brass)
		return 'melodic';
	}

	/**
	 * Check if a layer has chord fusion enabled
	 */
	private isLayerEnabledForChordFusion(layer: string, settings: NonNullable<SonigraphSettings['audioEnhancement']>['chordFusion']): boolean {
		return settings.layerSettings?.[layer] || false;
	}

	/**
	 * Create a single note mapping that represents a chord
	 */
	private createChordNote(notes: MusicalMapping[], settings: NonNullable<SonigraphSettings['audioEnhancement']>['chordFusion']): MusicalMapping {
		// Use the first note as the base
		const baseNote = notes[0];

		// Calculate average pitch (weighted by velocity)
		let totalPitch = 0;
		let totalWeight = 0;
		for (const note of notes) {
			totalPitch += note.pitch * note.velocity;
			totalWeight += note.velocity;
		}
		const averagePitch = totalPitch / totalWeight;

		// Use the longest duration
		const maxDuration = Math.max(...notes.map(n => n.duration));

		// Use the average velocity
		const avgVelocity = notes.reduce((sum, n) => sum + n.velocity, 0) / notes.length;

		// Create the chord note with special metadata
		const chordNote: MusicalMapping = {
			...baseNote,
			pitch: averagePitch,
			duration: maxDuration,
			velocity: avgVelocity,
			// Store original notes as metadata (for visualization)
			metadata: {
				isChord: true,
				chordNotes: notes.map(n => ({
					pitch: n.pitch,
					velocity: n.velocity,
					instrument: n.instrument
				})),
				chordSize: notes.length
			}
		};

		return chordNote;
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

	public getEnabledInstruments(): string[] {
		// Phase 2.2: Optimized with caching to eliminate O(n) operation on every note trigger
		if (this.instrumentCacheValid) {
			// O(1) cache hit - this should be the common path after Phase 2.2 optimization
			return this.cachedEnabledInstruments;
		}

		// O(n) cache miss - rebuild cache
		logger.debug('optimization', 'Building enabled instruments cache - should be rare after first call');
		const enabled: string[] = [];

		// Load all instrument configs to check requiresHighQuality flag
		const allInstrumentConfigs = this.instrumentConfigLoader.loadAllInstruments();

		Object.entries(this.settings.instruments).forEach(([instrumentKey, settings]) => {
			if (settings.enabled) {
				// Check if instrument requires high quality mode
				const instrumentConfig = allInstrumentConfigs[instrumentKey];
				if (instrumentConfig?.requiresHighQuality) {
					// Only enable if useHighQuality is also enabled for this instrument
					if (settings.useHighQuality) {
						enabled.push(instrumentKey);
						logger.debug('optimization', `High-quality instrument enabled: ${instrumentKey}`);
					} else {
						logger.debug('optimization', `High-quality instrument skipped (useHighQuality=false): ${instrumentKey}`);
					}
				} else {
					// Regular instrument - just check enabled flag
					enabled.push(instrumentKey);
				}
			}
		});

		this.cachedEnabledInstruments = enabled;
		this.instrumentCacheValid = true;

		logger.debug('optimization', `Enabled instruments cache built: ${enabled.length} instruments`, enabled);
		return enabled;
	}
	
	/**
	 * Invalidate enabled instruments cache when settings change
	 * Phase 2.2: Performance optimization to prevent O(n) operations per note
	 */
	private invalidateInstrumentCache(): void {
		this.instrumentCacheValid = false;
	}
	
	/**
	 * Public method to invalidate instrument cache when settings are updated externally
	 * Phase 2.2: Call this whenever instrument enabled/disabled state changes
	 */
	public onInstrumentSettingsChanged(): void {
		this.invalidateInstrumentCache();
		// Also clear the InstrumentConfigLoader cache so configs are reloaded
		this.instrumentConfigLoader.clearCache();
		logger.debug('optimization', 'Instrument cache invalidated due to settings change');
	}

	/**
	 * Public method for testing Phase 2.2 cached enabled instruments optimization
	 * This allows tests to exercise the getEnabledInstruments() optimization path
	 */
	public getEnabledInstrumentsForTesting(): string[] {
		logger.debug('test', 'getEnabledInstrumentsForTesting() called');
		const result = this.getEnabledInstruments();
		logger.debug('test', `getEnabledInstrumentsForTesting() returning ${result.length} instruments`, result);
		return result;
	}

	/**
	 * Public method for testing Phase 2.2 optimization - exercises the full path
	 * This simulates the actual code path that calls getDefaultInstrument -> getEnabledInstruments
	 */
	public getDefaultInstrumentForTesting(frequency: number): string {
		logger.debug('test', `getDefaultInstrumentForTesting() called with frequency ${frequency}`);
		const mockMapping: MusicalMapping = {
			nodeId: 'test-node',
			pitch: frequency,
			duration: 1.0,
			velocity: 0.8,
			timing: 0
		};
		const result = this.getDefaultInstrument(mockMapping);
		logger.debug('test', `getDefaultInstrumentForTesting() returning instrument: ${result}`);
		return result;
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
			// High-mid pitch - prefer clarinet, violin, oboe if available
			if (enabledInstruments.includes('clarinet')) return 'clarinet';
			if (enabledInstruments.includes('violin')) return 'violin';
			if (enabledInstruments.includes('oboe')) return 'oboe';
			return sortedInstruments[0];
		} else if (mapping.pitch > 1000) {
			// High pitch - prefer vibraphone, clarinet if available
			if (enabledInstruments.includes('vibraphone')) return 'vibraphone';
			if (enabledInstruments.includes('clarinet')) return 'clarinet';
			return sortedInstruments[0];
		} else if (mapping.pitch > 800) {
			// Mid-high pitch - prefer guitar, organ if available
			if (enabledInstruments.includes('guitar')) return 'guitar';
			if (enabledInstruments.includes('organ')) return 'organ';
			return sortedInstruments[0];
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
			// Low-mid pitch - prefer electricPiano, cello, trombone if available
			if (enabledInstruments.includes('electricPiano')) return 'electricPiano';
			if (enabledInstruments.includes('cello')) return 'cello';
			if (enabledInstruments.includes('trombone')) return 'trombone';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		} else if (mapping.pitch > 200) {
			// Low pitch - prefer whale instruments first for authentic oceanic atmosphere
			// Sei whale (200-600Hz downsweeps)
			if (mapping.pitch <= 600 && enabledInstruments.includes('whaleSei')) return 'whaleSei';
			// Right whale (50-500Hz upcalls)
			if (mapping.pitch <= 500 && enabledInstruments.includes('whaleRight')) return 'whaleRight';
			// Humpback whale (20-4000Hz complex songs)
			if (enabledInstruments.includes('whaleHumpback')) return 'whaleHumpback';
			// Traditional instruments as fallback
			if (enabledInstruments.includes('strings')) return 'strings';
			if (enabledInstruments.includes('harp')) return 'harp';
			if (enabledInstruments.includes('timpani')) return 'timpani';
			if (enabledInstruments.includes('bassSynth')) return 'bassSynth';
			return sortedInstruments[0];
		} else if (mapping.pitch > 50) {
			// Very low pitch - prefer whale species with infrasonic/low frequency calls
			// Minke whale (35-50Hz downsweeps)
			if (mapping.pitch <= 100 && enabledInstruments.includes('whaleMinke')) return 'whaleMinke';
			// Gray whale (100-2000Hz migration calls)
			if (enabledInstruments.includes('whaleGray')) return 'whaleGray';
			// Humpback whale
			if (enabledInstruments.includes('whaleHumpback')) return 'whaleHumpback';
			// Traditional instruments as fallback
			if (enabledInstruments.includes('tuba')) return 'tuba';
			if (enabledInstruments.includes('bassSynth')) return 'bassSynth';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		} else if (mapping.pitch > 20) {
			// Ultra low pitch - infrasonic whale species
			// Blue whale (10-40Hz infrasonic calls)
			if (enabledInstruments.includes('whaleBlue')) return 'whaleBlue';
			// Fin whale (15-30Hz pulse sequences)
			if (enabledInstruments.includes('whaleFin')) return 'whaleFin';
			// Humpback whale
			if (enabledInstruments.includes('whaleHumpback')) return 'whaleHumpback';
			// Traditional instruments as fallback
			if (enabledInstruments.includes('gongs')) return 'gongs';
			if (enabledInstruments.includes('tuba')) return 'tuba';
			if (enabledInstruments.includes('bassSynth')) return 'bassSynth';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		} else {
			// Extremely low pitch (< 20Hz) - deepest whale calls
			if (enabledInstruments.includes('whaleBlue')) return 'whaleBlue';
			if (enabledInstruments.includes('whaleFin')) return 'whaleFin';
			if (enabledInstruments.includes('whaleHumpback')) return 'whaleHumpback';
			if (enabledInstruments.includes('gongs')) return 'gongs';
			if (enabledInstruments.includes('leadSynth')) return 'leadSynth';
			if (enabledInstruments.includes('tuba')) return 'tuba';
			return enabledInstruments.includes('strings') ? 'strings' : sortedInstruments[0];
		}
	}

	private assignByRoundRobin(mapping: MusicalMapping, enabledInstruments: string[]): string {
		// Delegate to VoiceManager
		return this.voiceManager.assignInstrument(mapping, enabledInstruments);
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
	 * Play a note immediately without timing restrictions (for real-time triggering)
	 * @param mapping Note parameters
	 * @param elapsedTime Optional timeline elapsed time for visualization (defaults to audio context time)
	 * @param nodeId Optional node ID for graph highlighting
	 * @param nodeTitle Optional node title for logging
	 */
	async playNoteImmediate(
		mapping: { pitch: number; duration: number; velocity: number; instrument: string },
		elapsedTime?: number,
		nodeId?: string,
		nodeTitle?: string
	): Promise<void> {
		if (!this.isInitialized) {
			logger.warn('audio', 'Audio engine not initialized for immediate note playback');
			await this.initialize();
		}

		// Check if chord fusion is enabled for real-time playback
		if (this.settings.audioEnhancement?.chordFusion?.enabled) {
			this.bufferNoteForChordFusion(mapping, nodeId, nodeTitle, elapsedTime);
			return; // Note will be played when buffer is flushed
		}

		try {
			const { pitch, duration, velocity, instrument } = mapping;

			// CRITICAL: Per-instrument polyphony limiting to prevent Tone.js from dropping notes
			// Initialize counter for this instrument if needed
			if (!this.activeNotesPerInstrument.has(instrument)) {
				this.activeNotesPerInstrument.set(instrument, 0);
			}

			const currentNotes = this.activeNotesPerInstrument.get(instrument) || 0;

			// Let Tone.js handle polyphony limiting with its built-in maxPolyphony
			// Our manual limiting was too aggressive and caused choppy audio

			logger.debug('immediate-playback', 'Playing note immediately', {
				instrument: instrument,
				pitch: pitch.toFixed(2),
				duration: duration,
				velocity: velocity,
				currentInstrumentNotes: currentNotes
			});

			// Get the synthesizer for the specified instrument
			const synth = this.instruments.get(instrument);
			if (!synth) {
				logger.warn('immediate-playback', `Instrument not found: ${instrument}`, {
					availableInstruments: Array.from(this.instruments.keys())
				});
				// Fallback to piano if requested instrument not available
				const pianoSynth = this.instruments.get('piano');
				if (pianoSynth) {
					pianoSynth.triggerAttackRelease(pitch, duration, undefined, velocity);
					return;
				}
				throw new Error(`Instrument ${instrument} not available and piano fallback failed`);
			}

			// Quantize frequency to musical scale if harmony enforcement is enabled
			const quantizedFrequency = this.quantizeFrequency(pitch);

			// Apply frequency detuning for phase conflict resolution (from existing logic)
			const detunedFrequency = this.applyFrequencyDetuning(quantizedFrequency);

			// Increment per-instrument note counter
			this.activeNotesPerInstrument.set(instrument, currentNotes + 1);

			// Add micro-stagger to prevent audio buffer overload when multiple notes trigger simultaneously
			// Each note gets a tiny delay (0-10ms) to spread audio processing load
			const microDelay = Math.random() * 0.01; // 0-10ms random stagger
			const triggerTime = getContext().currentTime + microDelay;

			// Trigger the note with micro-stagger
			synth.triggerAttackRelease(detunedFrequency, duration, triggerTime, velocity);

			// Emit note event for visualization
			// Use provided elapsedTime if available, otherwise fall back to audio context time
			const timestamp = elapsedTime !== undefined ? elapsedTime : getContext().currentTime;
			this.emitNoteEvent(instrument, detunedFrequency, duration, velocity, timestamp, nodeId, nodeTitle);

			// Schedule counter decrement when note ends
			// Convert duration to milliseconds (Tone.js uses seconds)
			const durationMs = typeof duration === 'number' ? duration * 1000 : parseFloat(duration) * 1000;
			setTimeout(() => {
				const current = this.activeNotesPerInstrument.get(instrument) || 0;
				this.activeNotesPerInstrument.set(instrument, Math.max(0, current - 1));
			}, durationMs);

			// Trigger rhythmic percussion accent if enabled
			if (this.rhythmicPercussion) {
				// Convert frequency to MIDI note number for percussion mapping
				const midiNote = Frequency(pitch, 'hz').toMidi();
				logger.debug('rhythmic-percussion', 'Triggering accent (immediate playback)', { pitch, midiNote, velocity });
				this.rhythmicPercussion.triggerAccent({
					pitch: midiNote,
					velocity: velocity,
					duration: duration,
					time: getContext().currentTime
				});
			}

			logger.debug('immediate-playback', 'Note triggered successfully', {
				instrument: instrument,
				detunedFrequency: detunedFrequency.toFixed(2),
				originalFrequency: pitch.toFixed(2)
			});

		} catch (error) {
			logger.error('Failed to play immediate note', (error as Error).message);
			throw error;
		}
	}

	/**
	 * Buffer a note for chord fusion processing in real-time playback
	 * Notes are buffered and grouped based on temporal grouping setting
	 */
	private bufferNoteForChordFusion(
		mapping: { pitch: number; duration: number; velocity: number; instrument: string },
		nodeId?: string,
		nodeTitle?: string,
		elapsedTime?: number
	): void {
		const settings = this.settings.audioEnhancement?.chordFusion;
		if (!settings) return;

		const temporalMode = settings.temporalGrouping || 'realtime';

		// Real-time mode: use millisecond-based buffering
		if (temporalMode === 'realtime') {
			this.bufferNoteRealtime(mapping, nodeId, nodeTitle, elapsedTime);
			return;
		}

		// Temporal mode: group by date buckets
		const bucketKey = this.getTemporalBucketKey(nodeId, temporalMode);
		if (!bucketKey) {
			// Can't determine temporal bucket, play immediately
			logger.debug('chord-fusion', 'Could not determine temporal bucket, playing immediately', {
				nodeId,
				temporalMode,
				hasNodeId: !!nodeId,
				hasApp: !!this.app
			});
			this.playBufferedNote(mapping, elapsedTime);
			return;
		}

		// Add to temporal bucket
		if (!this.temporalChordBuckets.has(bucketKey)) {
			this.temporalChordBuckets.set(bucketKey, []);
		}

		const bucket = this.temporalChordBuckets.get(bucketKey);
		bucket.push({ mapping: { ...mapping, nodeId, nodeTitle }, nodeId, timestamp: Date.now() });

		logger.debug('chord-fusion', 'Note added to temporal bucket', {
			pitch: mapping.pitch,
			instrument: mapping.instrument,
			bucketKey,
			bucketSize: bucket.length,
			temporalMode
		});

		// Check if bucket has enough notes to form a chord
		const maxNotes = settings.maxChordNotes || 6;
		if (bucket.length >= settings.minimumNotes && bucket.length <= maxNotes) {
			logger.info('chord-fusion', 'Temporal bucket ready for chord', {
				bucketKey,
				noteCount: bucket.length,
				temporalMode
			});
			// Trigger chord from this bucket
			this.triggerTemporalChord(bucketKey, elapsedTime);
		} else if (bucket.length === 1) {
			// First note in bucket - play it immediately, more may come
			this.playBufferedNote(bucket[0].mapping, elapsedTime);
		} else if (bucket.length > maxNotes) {
			// Bucket full, trigger chord and clear
			logger.info('chord-fusion', 'Temporal bucket exceeded max size', {
				bucketKey,
				noteCount: bucket.length,
				maxNotes
			});
			this.triggerTemporalChord(bucketKey, elapsedTime);
		}
	}

	/**
	 * Real-time buffering for millisecond-based chord detection
	 */
	private bufferNoteRealtime(
		mapping: { pitch: number; duration: number; velocity: number; instrument: string },
		nodeId?: string,
		nodeTitle?: string,
		elapsedTime?: number
	): void {
		const now = Date.now();

		// Add note to buffer with timestamp
		this.chordBuffer.push({
			mapping: { ...mapping, nodeId, nodeTitle },
			timestamp: now,
			elapsedTime,
			nodeId
		});

		logger.debug('chord-fusion', 'Note buffered for chord detection (realtime)', {
			pitch: mapping.pitch,
			instrument: mapping.instrument,
			bufferSize: this.chordBuffer.length,
			timestamp: now
		});

		// Maximum buffer size to prevent infinite buffering
		const MAX_BUFFER_SIZE = 12;
		if (this.chordBuffer.length >= MAX_BUFFER_SIZE) {
			logger.info('chord-fusion', 'Buffer reached maximum size, flushing immediately', {
				bufferSize: this.chordBuffer.length,
				maxSize: MAX_BUFFER_SIZE
			});
			// Flush immediately without waiting for timer
			if (this.chordFlushTimer !== null) {
				clearTimeout(this.chordFlushTimer);
				this.chordFlushTimer = null;
			}
			this.flushChordBuffer(elapsedTime);
			return;
		}

		// Clear existing timer if present
		if (this.chordFlushTimer !== null) {
			clearTimeout(this.chordFlushTimer);
		}

		// Set new timer based on timing window setting
		const timingWindow = this.settings.audioEnhancement?.chordFusion?.timingWindow || 50;
		this.chordFlushTimer = window.setTimeout(() => {
			this.flushChordBuffer(elapsedTime);
		}, timingWindow);
	}

	/**
	 * Get temporal bucket key for a node based on grouping mode
	 */
	private getTemporalBucketKey(nodeId: string | undefined, mode: string): string | null {
		if (!nodeId || !this.app) {
			logger.debug('chord-fusion', 'Cannot get temporal bucket - missing nodeId or app', {
				hasNodeId: !!nodeId,
				hasApp: !!this.app
			});
			return null;
		}

		const file = this.app.vault.getAbstractFileByPath(nodeId);
		if (!file || !('stat' in file)) {
			logger.debug('chord-fusion', 'Cannot get temporal bucket - file not found or no stats', {
				nodeId,
				hasFile: !!file,
				hasStat: file && 'stat' in file
			});
			return null;
		}

		const stat = file.stat as { mtime: number };
		const date = new Date(stat.mtime);
		logger.debug('chord-fusion', 'Got file modification date', {
			nodeId,
			mtime: stat.mtime,
			date: date.toISOString()
		});

		switch (mode) {
			case 'day':
				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

			case 'week':
				// ISO week number
				const oneJan = new Date(date.getFullYear(), 0, 1);
				const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
				const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
				return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

			case 'month':
				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

			case 'year':
				return `${date.getFullYear()}`;

			default:
				return null;
		}
	}

	/**
	 * Trigger a chord from a temporal bucket
	 */
	private triggerTemporalChord(bucketKey: string, elapsedTime?: number): void {
		const bucket = this.temporalChordBuckets.get(bucketKey);
		if (!bucket || bucket.length === 0) return;

		const settings = this.settings.audioEnhancement?.chordFusion;
		if (!settings) return;

		// Group notes by layer
		const notesByLayer: Map<string, typeof bucket> = new Map();
		bucket.forEach(item => {
			const instrument = item.mapping.instrument.toLowerCase();
			let layer = 'harmonic';

			if (instrument.includes('melodic') || instrument.includes('lead') || instrument.includes('melody')) {
				layer = 'melodic';
			} else if (instrument.includes('bass') || instrument.includes('rhythm')) {
				layer = 'rhythmic';
			} else if (instrument.includes('pad') || instrument.includes('ambient')) {
				layer = 'ambient';
			}

			if (!notesByLayer.has(layer)) {
				notesByLayer.set(layer, []);
			}
			const layerNotes = notesByLayer.get(layer);
			if (layerNotes) {
				layerNotes.push(item);
			}
		});

		// Trigger chord for each layer
		notesByLayer.forEach((notes, layer) => {
			const layerEnabled = settings.layerSettings?.[layer as keyof typeof settings.layerSettings];

			if (!layerEnabled || notes.length < settings.minimumNotes) {
				notes.forEach(item => this.playBufferedNote(item.mapping, elapsedTime));
				return;
			}

			logger.info('chord-fusion', 'Creating temporal chord', {
				bucketKey,
				layer,
				noteCount: notes.length,
				mode: settings.mode
			});

			if (settings.mode === 'smart') {
				this.triggerSmartChord(notes, settings, elapsedTime);
			} else {
				this.triggerDirectChord(notes, elapsedTime);
			}
		});

		// Clear the bucket after triggering
		this.temporalChordBuckets.delete(bucketKey);
	}

	/**
	 * Flush the chord buffer and trigger notes/chords
	 */
	private flushChordBuffer(elapsedTime?: number): void {
		if (this.chordBuffer.length === 0) {
			return;
		}

		const settings = this.settings.audioEnhancement?.chordFusion;
		if (!settings) {
			logger.warn('chord-fusion', 'Chord fusion settings not found during buffer flush');
			this.chordBuffer = [];
			return;
		}

		logger.info('chord-fusion', 'Flushing chord buffer', {
			bufferedNotes: this.chordBuffer.length,
			timingWindow: settings.timingWindow
		});

		// Group notes by layer
		const notesByLayer: Map<string, typeof this.chordBuffer> = new Map();
		this.chordBuffer.forEach(item => {
			// Determine layer from instrument name
			const instrument = item.mapping.instrument.toLowerCase();
			let layer = 'harmonic'; // default

			if (instrument.includes('melodic') || instrument.includes('lead') || instrument.includes('melody')) {
				layer = 'melodic';
			} else if (instrument.includes('bass') || instrument.includes('rhythm')) {
				layer = 'rhythmic';
			} else if (instrument.includes('pad') || instrument.includes('ambient')) {
				layer = 'ambient';
			}

			if (!notesByLayer.has(layer)) {
				notesByLayer.set(layer, []);
			}
			const layerNotes = notesByLayer.get(layer);
			if (layerNotes) {
				layerNotes.push(item);
			}
		});

		// Process each layer
		notesByLayer.forEach((notes, layer) => {
			// Check if this layer has chord fusion enabled
			const layerEnabled = settings.layerSettings?.[layer as keyof typeof settings.layerSettings];

			if (!layerEnabled) {
				// Play notes individually if chord fusion disabled for this layer
				logger.debug('chord-fusion', `Layer ${layer} has chord fusion disabled, playing notes individually`);
				notes.forEach(item => {
					this.playBufferedNote(item.mapping, elapsedTime);
				});
				return;
			}

			// Check minimum notes threshold
			const minimumNotes = settings.minimumNotes || 2;
			if (notes.length < minimumNotes) {
				logger.debug('chord-fusion', `Not enough notes for chord (${notes.length} < ${minimumNotes})`);
				notes.forEach(item => {
					this.playBufferedNote(item.mapping, elapsedTime);
				});
				return;
			}

			// Create chord from buffered notes
			logger.info('chord-fusion', 'Creating chord from buffered notes', {
				layer,
				noteCount: notes.length,
				mode: settings.mode
			});

			if (settings.mode === 'smart') {
				// Smart mode: analyze and harmonize
				this.triggerSmartChord(notes, settings, elapsedTime);
			} else {
				// Direct mode: play all notes as-is
				this.triggerDirectChord(notes, elapsedTime);
			}
		});

		// Clear buffer and timer
		this.chordBuffer = [];
		this.chordFlushTimer = null;
	}

	/**
	 * Play a single buffered note
	 */
	private playBufferedNote(mapping: MusicalMapping, elapsedTime?: number): void {
		try {
			const { pitch, duration, velocity, instrument, nodeId, nodeTitle } = mapping;

			const synth = this.instruments.get(instrument);
			if (!synth) {
				logger.warn('chord-fusion', `Instrument not found for buffered note: ${instrument}`);
				return;
			}

			// Apply same processing as immediate playback
			const quantizedFrequency = this.quantizeFrequency(pitch);
			const detunedFrequency = this.applyFrequencyDetuning(quantizedFrequency);

			// Trigger the note
			synth.triggerAttackRelease(detunedFrequency, duration, undefined, velocity);

			// Emit visualization event
			const timestamp = elapsedTime !== undefined ? elapsedTime : getContext().currentTime;
			this.emitNoteEvent(instrument, detunedFrequency, duration, velocity, timestamp, nodeId, nodeTitle);

			logger.debug('chord-fusion', 'Buffered note played', {
				instrument,
				pitch: detunedFrequency.toFixed(2)
			});
		} catch (error) {
			logger.error('chord-fusion', 'Failed to play buffered note', error);
		}
	}

	/**
	 * Trigger a smart chord with harmonization
	 */
	private triggerSmartChord(notes: typeof this.chordBuffer, settings: NonNullable<SonigraphSettings['audioEnhancement']>['chordFusion'], elapsedTime?: number): void {
		// Extract pitches and find root (lowest pitch)
		const pitches = notes.map(n => n.mapping.pitch).sort((a, b) => a - b);
		const rootPitch = pitches[0];

		// Convert to MIDI for chord analysis
		const midiPitches = pitches.map(p => Frequency(p, 'hz').toMidi());
		const rootMidi = Math.round(midiPitches[0]);

		// Calculate intervals from root
		const intervals = midiPitches.map(p => Math.round(p) - rootMidi);

		// Detect chord type
		const chordType = this.detectChordTypeFromIntervals(intervals);

		logger.info('chord-fusion', 'Smart chord detected', {
			rootPitch: rootPitch.toFixed(2),
			chordType,
			intervals,
			noteCount: notes.length
		});

		// Apply voicing strategy
		const voicedNotes = this.applyVoicingStrategy(notes, settings.voicingStrategy || 'compact');

		// Trigger all notes in the chord
		voicedNotes.forEach((item, index) => {
			const { pitch, duration, velocity, instrument, nodeId, nodeTitle } = item.mapping;
			const synth = this.instruments.get(instrument);

			if (synth) {
				// Micro-delay to prevent phase cancellation (0-2ms per note)
				const microDelay = index * 0.002;
				const triggerTime = getContext().currentTime + microDelay;

				const quantizedFreq = this.quantizeFrequency(pitch);
				const detunedFreq = this.applyFrequencyDetuning(quantizedFreq);

				synth.triggerAttackRelease(detunedFreq, duration, triggerTime, velocity);

				// Emit visualization event
				const timestamp = elapsedTime !== undefined ? elapsedTime : getContext().currentTime;
				this.emitNoteEvent(instrument, detunedFreq, duration, velocity, timestamp, nodeId, nodeTitle);
			}
		});
	}

	/**
	 * Trigger a direct chord (play notes exactly as buffered)
	 */
	private triggerDirectChord(notes: typeof this.chordBuffer, elapsedTime?: number): void {
		logger.info('chord-fusion', 'Triggering direct chord', {
			noteCount: notes.length
		});

		notes.forEach((item, index) => {
			const { pitch, duration, velocity, instrument, nodeId, nodeTitle } = item.mapping;
			const synth = this.instruments.get(instrument);

			if (synth) {
				// Micro-delay to prevent phase cancellation
				const microDelay = index * 0.002;
				const triggerTime = getContext().currentTime + microDelay;

				const quantizedFreq = this.quantizeFrequency(pitch);
				const detunedFreq = this.applyFrequencyDetuning(quantizedFreq);

				synth.triggerAttackRelease(detunedFreq, duration, triggerTime, velocity);

				// Emit visualization event
				const timestamp = elapsedTime !== undefined ? elapsedTime : getContext().currentTime;
				this.emitNoteEvent(instrument, detunedFreq, duration, velocity, timestamp, nodeId, nodeTitle);
			}
		});
	}

	/**
	 * Detect chord type from intervals
	 */
	private detectChordTypeFromIntervals(intervals: number[]): string {
		// Chord patterns (intervals from root)
		const patterns = [
			{ name: 'major', intervals: [0, 4, 7] },
			{ name: 'minor', intervals: [0, 3, 7] },
			{ name: 'diminished', intervals: [0, 3, 6] },
			{ name: 'augmented', intervals: [0, 4, 8] },
			{ name: 'major7', intervals: [0, 4, 7, 11] },
			{ name: 'minor7', intervals: [0, 3, 7, 10] },
			{ name: 'dominant7', intervals: [0, 4, 7, 10] },
			{ name: 'sus2', intervals: [0, 2, 7] },
			{ name: 'sus4', intervals: [0, 5, 7] }
		];

		// Find matching pattern
		for (const pattern of patterns) {
			if (this.intervalsMatch(intervals, pattern.intervals)) {
				return pattern.name;
			}
		}

		return 'unknown';
	}

	/**
	 * Check if intervals match a chord pattern
	 */
	private intervalsMatch(intervals: number[], pattern: number[]): boolean {
		if (intervals.length < pattern.length) return false;

		// Check if all pattern intervals are present
		return pattern.every(p => intervals.includes(p));
	}

	/**
	 * Apply voicing strategy to chord notes
	 */
	private applyVoicingStrategy(notes: typeof this.chordBuffer, strategy: string): typeof this.chordBuffer {
		// Sort by pitch
		const sorted = [...notes].sort((a, b) => a.mapping.pitch - b.mapping.pitch);

		switch (strategy) {
			case 'compact':
				// Keep notes close together (already sorted)
				return sorted;

			case 'spread':
				// Spread notes across octaves
				return sorted.map((note, i) => ({
					...note,
					mapping: {
						...note.mapping,
						pitch: note.mapping.pitch * Math.pow(2, Math.floor(i / 3))
					}
				}));

			case 'drop2':
				// Drop the second-highest note by an octave (jazz voicing)
				if (sorted.length >= 3) {
					const result = [...sorted];
					const secondHighest = result[result.length - 2];
					result[result.length - 2] = {
						...secondHighest,
						mapping: {
							...secondHighest.mapping,
							pitch: secondHighest.mapping.pitch / 2
						}
					};
					return result;
				}
				return sorted;

			case 'drop3':
				// Drop the third-highest note by an octave
				if (sorted.length >= 4) {
					const result = [...sorted];
					const thirdHighest = result[result.length - 3];
					result[result.length - 3] = {
						...thirdHighest,
						mapping: {
							...thirdHighest.mapping,
							pitch: thirdHighest.mapping.pitch / 2
						}
					};
					return result;
				}
				return sorted;

			default:
				return sorted;
		}
	}

	/**
	 * Play a single test note
	 */
	async playTestNote(frequency: number = 440): Promise<void> {
		// Fast-path initialization - only essential components for test notes
		if (!this.isInitialized) {
			await this.initializeEssentials();
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
	 * Fast-path initialization for test notes - Issue #010 Crackling Fix
	 * Only initializes essential components to prevent processing spikes
	 */
	private async initializeEssentials(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		try {
			logger.debug('audio', 'Fast-path initialization for test notes');
			
			// Start Tone.js
			await start();
			
			// Create master volume control
			this.volume = new Volume(this.settings.volume).toDestination();
			
			// Check if any enabled instruments require high-quality samples
			const enabledInstruments = this.getEnabledInstruments();
			const requiresSamples = enabledInstruments.some(instrumentName => {
				const settings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
				return settings?.useHighQuality === true;
			});
			
			logger.info('audio', 'Essential initialization - checking sample requirements', {
				enabledInstruments,
				requiresSamples,
				instrumentsRequiringSamples: enabledInstruments.filter(instrumentName => {
					const settings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
					return settings?.useHighQuality === true;
				})
			});
			
			if (requiresSamples) {
				// Force immediate upgrade to full initialization with samples
				logger.info('audio', '🎵 SAMPLE MODE: High-quality samples required - upgrading to full initialization');
				
				// Initialize effects first to ensure volume/effects maps are populated
				await this.initializeEffects();
				
				// Initialize all instruments with proper sample/synthesis selection
				await this.initializeInstruments();
				
				// Initialize advanced synthesis engines
				await this.initializeAdvancedSynthesis();
				
				// Check if enhanced routing is enabled
				if (this.settings.enhancedRouting?.enabled) {
					await this.initializeEnhancedRouting();
				} else {
					this.applyEffectSettings();
				}
				
				// Generate comprehensive initialization report
				this.generateInitializationReport();
				
				// Mark as fully initialized (not minimal mode)
				this.isInitialized = true;
				this.isMinimalMode = false;
				
				logger.info('audio', '🎵 SAMPLE MODE: Full initialization completed with samples', {
					totalInstruments: this.instruments.size,
					instrumentsList: Array.from(this.instruments.keys()),
					samplesEnabled: true
				});
			} else {
				// No samples required - use minimal synthesis initialization
				logger.info('audio', '🎹 SYNTHESIS MODE: No samples required - using minimal initialization');
				
				// Initialize only basic piano for test notes (no CDN samples)
				await this.initializeBasicPiano();
				
				// Initialize lightweight synthesis for common instruments (no CDN samples)
				await this.initializeLightweightSynthesis();
				
				// Mark as initialized but keep it minimal
				this.isInitialized = true;
				this.isMinimalMode = true;
				
				logger.warn('audio', '🚀 ISSUE #010 FIX: Essential components initialized (minimal mode) with lightweight percussion');
			}
			
		} catch (error) {
			logger.error('audio', 'Failed to initialize essential components', error);
			throw error;
		}
	}

	/**
	 * Force full initialization after minimal initialization - Issue #010 Crackling Fix
	 * This allows upgrading from minimal to full initialization when needed
	 */
	async forceFullInitialization(): Promise<void> {
		try {
			logger.debug('audio', 'Upgrading to full initialization');
			
			// Issue #010 Fix: Store existing working instruments to preserve them
			const existingInstruments = new Map(this.instruments);
			const existingVolumes = new Map(this.instrumentVolumes);
			
			logger.info('audio', '🚀 ISSUE #010 FIX: Preserving existing instruments during upgrade', {
				existingInstruments: Array.from(existingInstruments.keys()),
				existingVolumes: Array.from(existingVolumes.keys())
			});
			
			// Initialize effects first to ensure volume/effects maps are populated
			await this.initializeEffects();
			
			// Initialize instruments (this will create all instruments, but we'll preserve working ones)
			await this.initializeInstruments();
			
			// Issue #010 Fix: Restore working instruments that were overwritten
			existingInstruments.forEach((instrument, instrumentName) => {
				if (instrumentName === 'piano') {
					// Keep the working piano from minimal mode
					logger.info('audio', '🚀 ISSUE #010 FIX: Restoring working piano from minimal mode');
					this.instruments.set(instrumentName, instrument);
					
					// Also restore its volume if it was working
					const existingVolume = existingVolumes.get(instrumentName);
					if (existingVolume) {
						this.instrumentVolumes.set(instrumentName, existingVolume);
					}
				}
			});
			
			// Initialize advanced synthesis engines
			await this.initializeAdvancedSynthesis();
			
			// Check if enhanced routing is enabled
			if (this.settings.enhancedRouting?.enabled) {
				await this.initializeEnhancedRouting();
			} else {
				this.applyEffectSettings();
			}
			
			// Issue #007 Fix: Generate comprehensive initialization report
			this.generateInitializationReport();
			
			// Issue #010 Fix: Clear minimal mode flag after full initialization
			this.isMinimalMode = false;
			
			logger.info('audio', 'Full AudioEngine initialization completed', {
				totalInstruments: this.instruments.size,
				preservedInstruments: Array.from(existingInstruments.keys()),
				finalInstruments: Array.from(this.instruments.keys()),
				instrumentMapSize: this.instruments.size
			});
		} catch (error) {
			logger.error('audio', 'Failed to upgrade to full initialization', error);
			throw error;
		}
	}

	/**
	 * Initialize basic piano synth for test notes - no external samples
	 */
	private async initializeBasicPiano(): Promise<void> {
		try {
			// Create a simple polyphonic synthesizer for piano test notes
			const pianoPoly = new PolySynth({
				voice: FMSynth,
				options: {
					harmonicity: 3,
					modulationIndex: 10,
					oscillator: { type: 'sine' },
					envelope: { attack: 0.001, decay: 1, sustain: 0.3, release: 0.3 },
					modulation: { type: 'square' },
					modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 }
				},
				maxPolyphony: 16 // Increased to handle complex sequences and chords
			});

			// Create volume control
			const pianoVolume = new Volume(this.settings.instruments.piano.volume);
			this.instrumentVolumes.set('piano', pianoVolume);

			// Connect piano directly to master volume (no effects for test notes)
			pianoPoly.connect(pianoVolume);
			pianoVolume.connect(this.volume);
			
			this.instruments.set('piano', pianoPoly);
			
			logger.debug('audio', 'Basic piano synthesizer initialized');
			
		} catch (error) {
			logger.error('audio', 'Failed to initialize basic piano', error);
			throw error;
		}
	}

	/**
	 * Initialize lightweight synthesis for common instruments - no external samples
	 * Issue #010 Fix: Provides clean sounds without CDN sample processing spikes that cause crackling
	 */
	private async initializeLightweightSynthesis(): Promise<void> {
		try {
			// Timpani - Deep, resonant synthetic drums
			const timpaniPoly = new PolySynth({
				voice: AMSynth,
				maxPolyphony: 6, // Added polyphony limit
				options: {
					oscillator: { type: 'sine' },
					envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 2.0 },
					volume: -12 // Lower volume for timpani character
				}
			});

			// Xylophone - Bright, percussive synthesis
			const xylophonePoly = new PolySynth({
				voice: FMSynth,
				maxPolyphony: 8, // Added polyphony limit
				options: {
					harmonicity: 8,
					modulationIndex: 5,
					oscillator: { type: 'triangle' },
					envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 1.0 },
					volume: -6
				}
			});

			// Strings - Warm, flowing synthesis (Issue #010 Fix: Replaces CDN samples)
			const stringsPoly = new PolySynth({
				voice: AMSynth,
				maxPolyphony: 6, // Added polyphony limit
				options: {
					oscillator: { type: 'sawtooth' },
					envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 1.5 },
					volume: -8
				}
			});

			// Flute - Airy, crystalline synthesis (Issue #010 Fix: Replaces CDN samples)
			const flutePoly = new PolySynth({
				voice: FMSynth,
				maxPolyphony: 4, // Added polyphony limit
				options: {
					harmonicity: 1,
					modulationIndex: 2,
					oscillator: { type: 'sine' },
					envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.8 },
					volume: -10
				}
			});

			// Clarinet - Warm woodwind synthesis (Issue #010 Fix: Replaces CDN samples)
			const clarinetPoly = new PolySynth({
				voice: FMSynth,
				maxPolyphony: 4, // Added polyphony limit
				options: {
					harmonicity: 3,
					modulationIndex: 4,
					oscillator: { type: 'square' },
					envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 1.0 },
					volume: -9
				}
			});

			// Trumpet - Bright brass synthesis (Issue #010 Fix: Replaces CDN samples)
			const trumpetPoly = new PolySynth({
				voice: FMSynth,
				maxPolyphony: 4, // Added polyphony limit
				options: {
					harmonicity: 2,
					modulationIndex: 8,
					oscillator: { type: 'sawtooth' },
					envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 },
					volume: -7
				}
			});

			// Saxophone - Rich reed synthesis (Issue #010 Fix: Replaces CDN samples)
			const saxophonePoly = new PolySynth({
				voice: AMSynth,
				maxPolyphony: 4, // Added polyphony limit
				options: {
					oscillator: { type: 'sawtooth' },
					envelope: { attack: 0.08, decay: 0.2, sustain: 0.8, release: 1.2 },
					volume: -8
				}
			});

			// Tuba - Deep brass synthesis (Issue #015 Fix: Replaces CDN samples)
			const tubaPoly = new PolySynth({
				voice: FMSynth,
				options: {
					harmonicity: 1,
					modulationIndex: 3,
					oscillator: { type: 'sawtooth' },
					envelope: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 3.5 },
					volume: -5 // Louder for deep brass character
				},
				maxPolyphony: 8 // Increased from default 32 to handle complex sequences
			});

			// Bassoon - Deep woodwind synthesis (Issue #015 Fix: Replaces CDN samples)
			const bassoonPoly = new PolySynth({
				voice: FMSynth,
				options: {
					harmonicity: 2,
					modulationIndex: 6,
					oscillator: { type: 'triangle' },
					envelope: { attack: 0.08, decay: 0.3, sustain: 0.7, release: 2.2 },
					volume: -7 // Moderate volume for woodwind character
				},
				maxPolyphony: 6 // Increased to handle complex sequences
			});

			// Nylon Guitar - Warm string synthesis (Issue #015 Fix: Replaces CDN samples)
			const guitarNylonPoly = new PolySynth({
				voice: AMSynth,
				options: {
					oscillator: { type: 'triangle' },
					envelope: { attack: 0.02, decay: 1.5, sustain: 0.3, release: 2.0 },
					volume: -8 // Gentle volume for acoustic character
				},
				maxPolyphony: 8 // Increased to handle guitar chords and complex sequences
			});

			// Connect instruments directly to master volume (minimal processing for performance)
			if (this.settings.instruments.timpani?.enabled) {
				const timpaniVolume = new Volume(this.settings.instruments.timpani.volume);
				this.instrumentVolumes.set('timpani', timpaniVolume);
				timpaniPoly.connect(timpaniVolume);
				timpaniVolume.connect(this.volume);
				this.instruments.set('timpani', timpaniPoly);
			}

			if (this.settings.instruments.xylophone?.enabled) {
				const xylophoneVolume = new Volume(this.settings.instruments.xylophone.volume);
				this.instrumentVolumes.set('xylophone', xylophoneVolume);
				xylophonePoly.connect(xylophoneVolume);
				xylophoneVolume.connect(this.volume);
				this.instruments.set('xylophone', xylophonePoly);
			}

			if (this.settings.instruments.strings?.enabled) {
				const stringsVolume = new Volume(this.settings.instruments.strings.volume);
				this.instrumentVolumes.set('strings', stringsVolume);
				stringsPoly.connect(stringsVolume);
				stringsVolume.connect(this.volume);
				this.instruments.set('strings', stringsPoly);
			}

			if (this.settings.instruments.flute?.enabled) {
				const fluteVolume = new Volume(this.settings.instruments.flute.volume);
				this.instrumentVolumes.set('flute', fluteVolume);
				flutePoly.connect(fluteVolume);
				fluteVolume.connect(this.volume);
				this.instruments.set('flute', flutePoly);
			}

			if (this.settings.instruments.clarinet?.enabled) {
				const clarinetVolume = new Volume(this.settings.instruments.clarinet.volume);
				this.instrumentVolumes.set('clarinet', clarinetVolume);
				clarinetPoly.connect(clarinetVolume);
				clarinetVolume.connect(this.volume);
				this.instruments.set('clarinet', clarinetPoly);
			}

			if (this.settings.instruments.trumpet?.enabled) {
				const trumpetVolume = new Volume(this.settings.instruments.trumpet.volume);
				this.instrumentVolumes.set('trumpet', trumpetVolume);
				trumpetPoly.connect(trumpetVolume);
				trumpetVolume.connect(this.volume);
				this.instruments.set('trumpet', trumpetPoly);
			}

			if (this.settings.instruments.saxophone?.enabled) {
				const saxophoneVolume = new Volume(this.settings.instruments.saxophone.volume);
				this.instrumentVolumes.set('saxophone', saxophoneVolume);
				saxophonePoly.connect(saxophoneVolume);
				saxophoneVolume.connect(this.volume);
				this.instruments.set('saxophone', saxophonePoly);
			}

			if (this.settings.instruments.tuba?.enabled) {
				const tubaVolume = new Volume(this.settings.instruments.tuba.volume);
				this.instrumentVolumes.set('tuba', tubaVolume);
				tubaPoly.connect(tubaVolume);
				tubaVolume.connect(this.volume);
				this.instruments.set('tuba', tubaPoly);
			}

			if (this.settings.instruments.bassoon?.enabled) {
				const bassoonVolume = new Volume(this.settings.instruments.bassoon.volume);
				this.instrumentVolumes.set('bassoon', bassoonVolume);
				bassoonPoly.connect(bassoonVolume);
				bassoonVolume.connect(this.volume);
				this.instruments.set('bassoon', bassoonPoly);
			}

			if (this.settings.instruments.guitarNylon?.enabled) {
				const guitarNylonVolume = new Volume(this.settings.instruments.guitarNylon.volume);
				this.instrumentVolumes.set('guitarNylon', guitarNylonVolume);
				guitarNylonPoly.connect(guitarNylonVolume);
				guitarNylonVolume.connect(this.volume);
				this.instruments.set('guitarNylon', guitarNylonPoly);
			}
			
			logger.debug('audio', 'Lightweight synthesis initialized', {
				instrumentsCreated: this.instruments.size,
				synthesisMode: true
			});
			
		} catch (error) {
			logger.error('audio', 'Failed to initialize lightweight percussion', error);
			throw error;
		}
	}

	/**
	 * Issue #010 Fix: Check if any instruments from a specific family are enabled
	 * This is future-proof and will work with instruments added later
	 */
	private hasInstrumentFamilyEnabled(familyType: 'percussion' | 'electronic'): boolean {
		// Get all enabled instruments from settings
		const enabledInstruments = Object.keys(this.settings.instruments).filter(instrumentName => {
			const settings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			return settings?.enabled;
		});

		// Check if any enabled instruments belong to the specified family
		const familyInstruments = enabledInstruments.filter(instrumentName => {
			if (familyType === 'percussion') {
				return this.isPercussionInstrument(instrumentName);
			} else if (familyType === 'electronic') {
				return this.isElectronicInstrument(instrumentName);
			}
			return false;
		});

		logger.debug('family-check', `🚀 ISSUE #010 DEBUG: Family check for ${familyType}`, {
			enabledInstruments,
			familyInstruments,
			hasFamilyInstruments: familyInstruments.length > 0
		});

		return familyInstruments.length > 0;
	}

	/**
	 * Issue #010 Fix: Check if any percussion instruments are enabled
	 */
	private hasPercussionInstrumentsEnabled(): boolean {
		return this.hasInstrumentFamilyEnabled('percussion');
	}

	/**
	 * Issue #010 Fix: Check if any electronic instruments are enabled
	 */
	private hasElectronicInstrumentsEnabled(): boolean {
		return this.hasInstrumentFamilyEnabled('electronic');
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

		// Enhanced Play Button: Cleanup event emitter
		this.eventEmitter.dispose();
		
		// Clean up memory optimization tools
		this.playbackOptimizer.dispose();
		this.memoryMonitor.clearHistory();
		this.audioGraphCleaner.dispose();
		
		// Clear frequency history
		this.frequencyHistory.clear();
		
		// Clear performance monitoring interval
		if (this.performanceMonitoringInterval) {
			clearInterval(this.performanceMonitoringInterval);
			this.performanceMonitoringInterval = null;
		}
		
		// Clear any pending preview timeouts
		this.previewTimeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});
		this.previewTimeouts.clear();

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
				
				// Check if the instrument actually has effects initialized in the audio engine
				const instrumentEffects = this.instrumentEffects.get(instrumentName);
				if (!instrumentEffects) {
					logger.debug('effects', `Skipping effect settings for ${instrumentName} - no effects initialized`);
					return;
				}

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
			logger.warn('audio-engine', `Effect preset '${presetKey}' not found`);
			return;
		}

		if (!this.settings.instruments[instrumentName as keyof SonigraphSettings['instruments']]) {
			logger.warn('audio-engine', `Instrument '${instrumentName}' not found in settings`);
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
			logger.warn('audio-engine', `Effect preset '${presetKey}' not found`);
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
			logger.warn('audio-engine', `Instrument '${instrumentName}' not found in settings`);
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
			logger.warn('audio-engine', `Default settings for instrument '${instrumentName}' not found`);
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
			logger.warn('audio-engine', 'Failed to start preview note:', error);
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
				logger.warn('audio-engine', 'Failed to stop preview note:', error);
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
			logger.warn('audio-engine', 'Failed to apply immediate parameter change:', error);
		}
	}

	/**
	 * Commit parameter change (for settings persistence)
	 */
	private commitParameterChange(instrumentName: string, effectType: string, paramName: string, value: number): void {
		// This would typically save to settings - handled by the UI layer
		logger.debug('parameter-change', `Parameter committed: ${instrumentName}.${effectType}.${paramName} = ${value}`);
	}

	/**
	 * Toggle effect bypass for A/B comparison
	 */
	toggleEffectBypass(instrumentName: string, effectType: string): boolean {
		if (!this.bypassStates.has(instrumentName)) {
			this.bypassStates.set(instrumentName, new Map());
		}

		const instrumentBypasses = this.bypassStates.get(instrumentName);
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
			logger.warn('audio-engine', 'Failed to apply effect bypass:', error);
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
			interface AudioContextWithLatency {
				baseLatency?: number;
				outputLatency?: number;
			}
			const audioContext = getContext() as unknown as AudioContextWithLatency;
			const baseLatency = audioContext.baseLatency || 0;
			const outputLatency = audioContext.outputLatency || 0;
			const currentLatency = baseLatency + outputLatency;
			
			// Estimate CPU usage based on active voices and effects
			let estimatedCPU = 0;

			this.instruments.forEach((synth, instrumentName) => {
				// Access undocumented activeVoices property for performance monitoring
				const synthWithTracking = synth as unknown as SynthWithVoiceTracking;
				const activeVoices = synthWithTracking.activeVoices || 0;
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
			logger.warn('audio-engine', 'Failed to update performance metrics:', error);
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
		if (this.settings.enhancedRouting) {
			this.settings.enhancedRouting.enabled = true;
		}

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
		if (this.settings.enhancedRouting) {
			this.settings.enhancedRouting.enabled = false;
		}

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

	// Legacy getEffectChain method removed - now delegated to EffectBusManager

	// Legacy reorderEffectChain method removed - functionality moved to EffectBusManager

	// Legacy addEffectToChain method removed - now delegated to EffectBusManager

	// Legacy removeEffectFromChain method removed - now delegated to EffectBusManager

	// Legacy toggleEffect method removed - now delegated to EffectBusManager

	// Legacy toggleEnhancedEffectBypass method removed - now delegated to EffectBusManager

	// Legacy updateEffectParameters method removed - now delegated to EffectBusManager

	/**
	 * Get default effect settings for a given effect type
	 */
	private getDefaultEffectSettings(effectType: string): { enabled: boolean; params: Record<string, unknown> } {
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

	// Legacy isEnhancedRoutingEnabled, getSendBuses, getReturnBuses methods removed - now delegated to EffectBusManager

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
	 * Map instrument name to visualization layer
	 * Used for color-coding notes in the visual display
	 */
	private getLayerForInstrument(instrumentName: string): 'rhythmic' | 'harmonic' | 'melodic' | 'ambient' | 'percussion' {
		// Percussion instruments
		if (this.isPercussionInstrument(instrumentName)) {
			return 'percussion';
		}

		// Rhythmic instruments (bass, drums, rhythm section)
		if (['contrabass', 'bassSynth', 'tuba'].includes(instrumentName)) {
			return 'rhythmic';
		}

		// Harmonic instruments (chords, accompaniment)
		if (['piano', 'organ', 'harpsichord', 'harp', 'strings'].includes(instrumentName)) {
			return 'harmonic';
		}

		// Ambient/atmospheric instruments
		if (this.isEnvironmentalInstrument(instrumentName) || this.isElectronicInstrument(instrumentName)) {
			return 'ambient';
		}

		// Melodic instruments (lead, solo instruments)
		// Default for woodwinds, brass, solo strings
		return 'melodic';
	}

	/**
	 * Emit note-triggered event for visualization
	 * Centralized method to ensure all note triggers emit visualization events
	 */
	private emitNoteEvent(
		instrumentName: string,
		frequency: number,
		duration: number,
		velocity: number,
		elapsedTime: number,
		nodeId?: string,
		nodeTitle?: string
	): void {
		try {
			const layer = this.getLayerForInstrument(instrumentName);
			const midiPitch = Frequency(frequency, 'hz').toMidi();

			this.eventEmitter.emit('note-triggered', {
				pitch: midiPitch,
				velocity,
				duration: typeof duration === 'number' ? duration : parseFloat(duration),
				layer,
				timestamp: elapsedTime,
				instrument: instrumentName,
				nodeId,
				nodeTitle
			});
		} catch (error) {
			logger.debug('visualization', 'Failed to emit note event', { error, instrumentName });
		}
	}

	/**
	 * Issue #010 Fix: Get default voice limits to avoid require() in methods
	 */
	private getDefaultVoiceLimits() {
		return {
			DEFAULT_VOICE_LIMITS: {
				piano: 16, // Increased for complex sequences
				organ: 6,
				harpsichord: 8,
				strings: 4,
				violin: 4,
				viola: 4,
				cello: 4,
				contrabass: 3,
				harp: 12,
				trumpet: 3,
				horn: 3,
				trombone: 3,
				tuba: 8, // Increased for complex sequences
				flute: 3,
				oboe: 3,
				clarinet: 3,
				bassoon: 6, // Increased for complex sequences
				piccolo: 3,
				
				timpani: 2,
				xylophone: 6,
				vibraphone: 6,
				gongs: 4,
				guitarNylon: 8, // Added for nylon guitar
				default: 6 // Increased default for better performance
			}
		};
	}

	/**
	 * Issue #010 Fix: Get appropriate polyphony limit for instrument to prevent crackling
	 */
	private getInstrumentPolyphonyLimit(instrumentName: string): number {
		// Use the DEFAULT_VOICE_LIMITS from types
		const { DEFAULT_VOICE_LIMITS } = this.getDefaultVoiceLimits();

		// Check if this instrument has a specific voice limit
		const specificLimit = DEFAULT_VOICE_LIMITS[instrumentName as keyof typeof DEFAULT_VOICE_LIMITS];
		if (specificLimit) {
			return specificLimit;
		}

		// Optimized limits for Local Soundscape (1-3s durations, 0.5s spacing)
		// Max 6 overlapping voices per instrument (3s / 0.5s) to prevent CPU overload
		if (['piano', 'organ', 'harpsichord', 'harp'].includes(instrumentName)) {
			return 8; // High polyphony for keyboard instruments
		} else if (['strings', 'violin', 'viola', 'cello', 'contrabass'].includes(instrumentName)) {
			return 8; // Moderate polyphony with headroom
		} else if (['trumpet', 'horn', 'trombone', 'flute', 'oboe', 'clarinet', 'bassoon'].includes(instrumentName)) {
			return 8; // Sufficient for 6 voices + headroom
		} else if (['timpani', 'tuba'].includes(instrumentName)) {
			return 8; // Consistent limit across all instruments
		} else {
			return 8; // Default with 33% headroom over target (6 → 8)
		}
	}

	/**
	 * Issue #012: Create Sampler with synthesis fallback for failed CDN loading
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sampler configuration accepts heterogeneous Tone.js options
	private createSamplerWithFallback(config: any, instrumentName: string): PolySynth | Sampler {
		try {
			const sampler = new Sampler(config);
			
			// Set up a timeout to check if samples loaded successfully
			setTimeout(() => {
				// Check if any buffers are actually loaded (accessing Tone.js internal structure)
				const samplerWithBuffers = sampler as unknown as SamplerWithBuffers;
				const buffers = samplerWithBuffers._buffers;
				let hasValidBuffers = false;

				if (buffers && buffers._buffers) {
					for (const [note, buffer] of Object.entries(buffers._buffers)) {
						if (buffer && buffer.loaded) {
							hasValidBuffers = true;
							break;
						}
					}
				}
				
				// If no valid buffers loaded, replace with synthesis
				if (!hasValidBuffers) {
					logger.warn('sample-fallback', `CDN samples failed to load for ${instrumentName}, creating synthesis fallback`, {
						instrument: instrumentName,
						cdnPath: config.baseUrl,
						issue: 'Issue #012 - Vocal Instrument Silence'
					});
					
					// Create synthesis replacement
					const synthReplacement = this.createVocalSynthesis(instrumentName);
					const existingVolume = this.instrumentVolumes.get(instrumentName);
					const existingEffects = this.instrumentEffects.get(instrumentName);
					
					// Dispose the failed sampler
					sampler.dispose();
					
					// Replace in instruments map
					this.instruments.set(instrumentName, synthReplacement);
					
					// Reconnect to effects chain
					if (existingVolume && existingEffects) {
						this.reconnectInstrumentToEffects(instrumentName, synthReplacement, existingVolume, existingEffects);
					}
				}
			}, 5000); // Wait 5 seconds for loading
			
			return sampler;
		} catch (error) {
			logger.error('sample-fallback', `Failed to create Sampler for ${instrumentName}, using synthesis fallback`, error);
			return this.createVocalSynthesis(instrumentName);
		}
	}

	/**
	 * Issue #012: Create specialized vocal synthesis for fallback
	 */
	private createVocalSynthesis(instrumentName: string): PolySynth {
		const maxVoices = this.getInstrumentPolyphonyLimit(instrumentName);
		
		// Generic synthesis for remaining instruments
		return new PolySynth({
			voice: AMSynth,
			maxPolyphony: maxVoices,
			options: {
				oscillator: { type: 'sine' },
				envelope: { attack: 0.1, decay: 0.4, sustain: 0.7, release: 2.0 },
				volume: -10
			}
		});
	}

	/**
	 * Issue #012: Reconnect instrument to effects chain after fallback creation
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Instrument can be any Tone.js synth or sampler type
	private reconnectInstrumentToEffects(instrumentName: string, instrument: PolySynth, volume: Volume, effects: Map<string, any>): void {
		let output = instrument.connect(volume);
		
		// Get instrument settings for effects
		const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
		if (!instrumentSettings?.effects) return;
		
		// Reconnect effects chain
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
		
		// Connect to master volume
		output.connect(this.volume);
	}

	/**
	 * Trigger advanced percussion with specialized synthesis
	 */
	private triggerAdvancedPercussion(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): void {
		// Issue #007 Fix: Enhanced percussion validation and error handling
		if (!this.percussionEngine) {
			logger.debug('advanced-percussion', `Percussion engine not initialized, falling back to standard synthesis for ${instrumentName}`);
			this.triggerStandardSynthesisFallback(instrumentName, frequency, duration, velocity, time);
			return;
		}

		// Validate parameters
		if (!this.isValidPercussionParams(frequency, duration, velocity)) {
			logger.debug('advanced-percussion', `Invalid parameters for ${instrumentName}, falling back to standard synthesis`, {
				frequency, duration, velocity
			});
			this.triggerStandardSynthesisFallback(instrumentName, frequency, duration, velocity, time);
			return;
		}

		// Phase 3: Apply frequency detuning for phase conflict resolution
		const detunedFrequency = this.applyFrequencyDetuning(frequency);
		
		// Convert frequency to note name for percussion engines
		const note = this.frequencyToNoteName(detunedFrequency);
		
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
			// Issue #007 Fix: Convert error to debug level since fallback is expected
			logger.debug('advanced-percussion', `Falling back to standard synthesis for ${instrumentName}`, { 
				error: error instanceof Error ? error.message : String(error),
				frequency: detunedFrequency,
				note
			});
			this.triggerStandardSynthesisFallback(instrumentName, frequency, duration, velocity, time);
		}
	}

	/**
	 * Issue #007 Fix: Validate percussion parameters
	 */
	private isValidPercussionParams(frequency: number, duration: number, velocity: number): boolean {
		return frequency > 0 && 
		       frequency < 20000 && 
		       duration > 0 && 
		       duration < 60 && 
		       velocity >= 0 && 
		       velocity <= 1;
	}

	/**
	 * Issue #007 Fix: Standardized fallback for failed advanced synthesis
	 */
	private triggerStandardSynthesisFallback(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): void {
		const synth = this.instruments.get(instrumentName);
		if (synth) {
			try {
				synth.triggerAttackRelease(frequency, duration, time, velocity);
			} catch (fallbackError) {
				logger.warn('synthesis-fallback', `Even standard synthesis failed for ${instrumentName}`, {
					error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
				});
			}
		} else {
			logger.warn('synthesis-fallback', `No synthesizer found for ${instrumentName}`);
		}
	}

	/**
	 * Trigger advanced electronic synthesis with specialized modulation
	 */
	private triggerAdvancedElectronic(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): void {
		// Issue #007 Fix: Enhanced electronic validation and error handling  
		if (!this.electronicEngine) {
			logger.debug('advanced-electronic', `Electronic engine not initialized, falling back to standard synthesis for ${instrumentName}`);
			this.triggerStandardSynthesisFallback(instrumentName, frequency, duration, velocity, time);
			return;
		}
		
		// Validate parameters
		if (!this.isValidPercussionParams(frequency, duration, velocity)) {
			logger.debug('advanced-electronic', `Invalid parameters for ${instrumentName}, falling back to standard synthesis`, {
				frequency, duration, velocity
			});
			this.triggerStandardSynthesisFallback(instrumentName, frequency, duration, velocity, time);
			return;
		}

		// Phase 3: Apply frequency detuning for phase conflict resolution
		const detunedFrequency = this.applyFrequencyDetuning(frequency);
		
		// Convert frequency to note name for electronic engines
		const note = this.frequencyToNoteName(detunedFrequency);
		
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
			// Issue #007 Fix: Convert error to debug level since fallback is expected
			logger.debug('advanced-electronic', `Falling back to standard synthesis for ${instrumentName}`, { 
				error: error instanceof Error ? error.message : String(error),
				frequency: detunedFrequency,
				note
			});
			this.triggerStandardSynthesisFallback(instrumentName, frequency, duration, velocity, time);
		}
	}

	/**
	 * Trigger environmental sounds with specialized synthesis or external samples
	 */
	private async triggerEnvironmentalSound(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): Promise<void> {
		try {
			switch (instrumentName) {
				case 'whaleHumpback':
					// Try external whale samples first if high-quality mode is enabled for this instrument
					const whaleSettings = this.settings.instruments.whaleHumpback;
					if (whaleSettings?.useHighQuality) {
						const externalSample = await this.tryLoadExternalWhaleSample(instrumentName, frequency, duration, velocity, time);
						if (externalSample) {
							logger.debug('environmental-sound', `External whale sample triggered: ${frequency.toFixed(1)}Hz, vel: ${velocity}, dur: ${duration.toFixed(3)}`);
							return; // Successfully used external sample
						}
					}

					// Fallback to persistent whale synthesizer
					const whaleSynth = this.instruments.get('whaleHumpback') as PolySynth;
					if (!whaleSynth) {
						logger.warn('environmental-sound', 'Persistent whale synthesizer not found');
						return;
					}

					// Whale songs are often in very low frequencies with slow pitch bends
					const whaleFreq = Math.max(frequency * 0.5, 40); // Lower the frequency, minimum 40Hz
					whaleSynth.triggerAttackRelease(whaleFreq, duration, time, velocity * 0.8); // Match sequence duration, slightly quieter
					
					logger.debug('environmental-sound', `Whale synthesis triggered: ${whaleFreq.toFixed(1)}Hz, vel: ${(velocity * 0.8).toFixed(3)}, dur: ${duration.toFixed(3)}`);
					
					break;
			}
			
			logger.debug('environmental-sound', `Triggered ${instrumentName}: ${frequency.toFixed(1)}Hz, vel: ${velocity}, dur: ${duration}`);
		} catch (error) {
			// Issue #007 Fix: Convert error to debug level for environmental sounds
			logger.debug('environmental-sound', `Environmental sound failed for ${instrumentName}`, { 
				error: error instanceof Error ? error.message : String(error),
				frequency
			});
			// No fallback - environmental sounds should be silent if they fail
		}
	}

	/**
	 * Try to load and play external whale sample
	 */
	private async tryLoadExternalWhaleSample(instrumentName: string, frequency: number, duration: number, velocity: number, time: number): Promise<boolean> {
		try {
			const { tryLoadExternalWhaleSample } = await import('../external/whale-integration');
			
			// Map frequency to note for whale sample loading
			const note = this.frequencyToNoteName(frequency);
			
			// Try to load external whale sample
			const audioBuffer = await tryLoadExternalWhaleSample(instrumentName, note, frequency);
			
			if (audioBuffer) {
				// Create a one-shot player for the external sample
				const player = new Player(audioBuffer).toDestination();
				
				// Apply volume scaling similar to synthesis
				const volume = new Volume(-6);
				player.connect(volume);
				volume.connect(this.volume);
				
				// Trigger the sample
				player.start(time);
				
				// Clean up after playback
				setTimeout(() => {
					player.dispose();
					volume.dispose();
				}, (duration + 1) * 1000); // Add 1 second buffer for cleanup
				
				logger.debug('whale-external', `External whale sample played: ${instrumentName}, freq: ${frequency.toFixed(1)}Hz`);
				return true;
			}
			
			return false;
		} catch (error) {
			logger.debug('whale-external', `Failed to load external whale sample for ${instrumentName}`, error);
			return false;
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
	 * Phase 3: Apply frequency detuning for phase conflict resolution
	 * Prevents phase cancellation by adding slight frequency variations (±0.1%)
	 */
	private applyFrequencyDetuning(frequency: number): number {
		// Check if frequency detuning is enabled in performance settings
		if (!this.settings.performanceMode?.enableFrequencyDetuning) {
			return frequency;
		}
		
		const currentTime = performance.now();
		const conflictWindowMs = 50; // Reduced to 50ms for faster processing
		
		// Check for recent frequency conflicts
		const baseFrequency = Math.round(frequency * 10) / 10; // Round to 0.1 Hz precision
		const lastUsedTime = this.frequencyHistory.get(baseFrequency);
		
		if (lastUsedTime && (currentTime - lastUsedTime) < conflictWindowMs) {
			// Phase conflict detected - apply detuning
			const detuneAmount = (Math.random() - 0.5) * 0.002; // ±0.1% detuning
			const detunedFrequency = frequency * (1 + detuneAmount);
			
			// Only log in non-test environments to avoid performance impact
			if (typeof window !== 'undefined' && !window.location?.href?.includes('test')) {
				logger.debug('detuning', `Phase conflict resolved: ${frequency.toFixed(2)}Hz → ${detunedFrequency.toFixed(2)}Hz`);
			}
			
			// Update history with detuned frequency
			this.frequencyHistory.set(Math.round(detunedFrequency * 10) / 10, currentTime);
			return detunedFrequency;
		}
		
		// No conflict - update history and return original frequency
		this.frequencyHistory.set(baseFrequency, currentTime);
		
		// Optimized cleanup: only clean up every 10th call to reduce processing overhead
		if (this.frequencyHistory.size % 10 === 0) {
			const staleEntries: number[] = [];
			for (const [freq, time] of this.frequencyHistory.entries()) {
				if (currentTime - time > 200) { // Reduced cleanup threshold to 200ms
					staleEntries.push(freq);
				}
			}
			staleEntries.forEach(freq => this.frequencyHistory.delete(freq));
		}
		
		return frequency;
	}

	/**
	 * Dispose of advanced synthesis engines
	 */
	private disposeAdvancedSynthesis(): void {
		if (this.percussionEngine) {
			this.percussionEngine.dispose();
			this.percussionEngine = null;
		}

		if (this.rhythmicPercussion) {
			this.rhythmicPercussion.dispose();
			this.rhythmicPercussion = null;
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

	private async initializeMasterEffects(): Promise<void> {
		logger.debug('master-effects', 'Initializing master effects chain via EffectBusManager');
		
		try {
			// Initialize master effects through enhanced routing
			await this.effectBusManager.enableEnhancedRouting();
			logger.info('master-effects', 'Master effects chain initialized via EffectBusManager');
		} catch (error) {
			logger.error('master-effects', 'Failed to initialize master effects', { error });
		}
	}

	private routeInstrumentsThroughMasterEffects(): void {
		if (!this.masterEQ) return;

		// Reroute all existing instruments through master effects
		this.instruments.forEach((instrument, instrumentName) => {
			// Disconnect from direct output and connect to master chain
			try {
				instrument.disconnect();
				instrument.connect(this.masterEQ);
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
		const pool: Array<{ available: boolean; lastUsed: number }> = [];
		for (let i = 0; i < poolSize; i++) {
			// Pre-allocate voice instances (simplified for now)
			pool.push({ available: true, lastUsed: 0 });
		}
		this.voicePool.set(instrumentName, pool);
		logger.debug('performance', `Created voice pool for ${instrumentName}: ${poolSize} voices`);
	}

	private startPerformanceMonitoring(): void {
		// Clear any existing interval
		if (this.performanceMonitoringInterval) {
			clearInterval(this.performanceMonitoringInterval);
		}
		
		// Monitor performance every 5 seconds
		this.performanceMonitoringInterval = setInterval(() => {
			this.checkPerformanceAndAdapt();
		}, 5000);
	}

	private checkPerformanceAndAdapt(): void {
		if (!this.adaptiveQuality) return;

		const now = performance.now();
		const cpuUsage = this.estimateCPUUsage();
		interface AudioContextWithLatency {
			baseLatency?: number;
		}
		const ctx = getContext() as unknown as AudioContextWithLatency;
		const latency = ctx.baseLatency ? ctx.baseLatency * 1000 : 5; // Convert to ms or use 5ms default

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
					// Set maxPolyphony (Tone.js internal property not in public types)
					(instrument as unknown as InstrumentWithPolyphony).maxPolyphony = instrumentSettings.maxVoices || 8;
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
					// Set maxPolyphony (Tone.js internal property not in public types)
					(instrument as unknown as InstrumentWithPolyphony).maxPolyphony = Math.max(Math.floor((instrumentSettings.maxVoices || 4) * 0.75), 2);
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
					// Set maxPolyphony (Tone.js internal property not in public types)
					(instrument as unknown as InstrumentWithPolyphony).maxPolyphony = Math.max(Math.floor((instrumentSettings.maxVoices || 4) * 0.5), 1);
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
	 * Adapt to memory pressure by reducing quality settings
	 */
	private adaptToMemoryPressure(): void {
		const pressure = this.memoryMonitor.getMemoryPressure();
		const limits = this.memoryMonitor.getRecommendedLimits();
		
		logger.info('memory-pressure', 'Adapting to memory pressure', {
			pressure,
			recommendedLimits: limits
		});
		
		// Update voice manager limits
		this.voiceManager.setAdaptiveLimits(limits.maxVoices);
		
		// If pressure is high or critical, do more aggressive cleanup
		if (pressure === 'high' || pressure === 'critical') {
			// Clean frequency history more aggressively
			const currentTime = Date.now();
			const staleEntries: number[] = [];
			for (const [freq, time] of this.frequencyHistory.entries()) {
				if (currentTime - time > 100) { // More aggressive - 100ms instead of 200ms
					staleEntries.push(freq);
				}
			}
			staleEntries.forEach(freq => this.frequencyHistory.delete(freq));
			
			// Force voice cleanup
			this.voiceManager.performPeriodicCleanup();
			
			logger.info('memory-pressure', 'Performed aggressive cleanup', {
				frequencyEntriesRemoved: staleEntries.length,
				remainingEntries: this.frequencyHistory.size
			});
		}
		
		// Log memory stats
		this.memoryMonitor.logStats();
		
		// Try manual garbage collection
		this.memoryMonitor.forceGarbageCollection();
	}

	/**
	 * Memory management for 34-instrument load
	 */
	private optimizeMemoryUsage(): void {
		// Phase 2.3: Delegate to VoiceManager for comprehensive memory cleanup
		this.voiceManager.performPeriodicCleanup();
		
		// Clean up unused voice allocations (legacy cleanup for compatibility)
		this.voicePool.forEach((pool) => {
			const now = Date.now();
			pool.forEach(voice => {
				if (voice.lastUsed && (now - voice.lastUsed) > 30000) { // 30 seconds
					voice.available = true;
				}
			});
		});

		// Force garbage collection hint if supported
		interface WindowWithGC extends Window {
			gc?: () => void;
		}
		const winWithGC = window as WindowWithGC;
		if ('gc' in window && typeof winWithGC.gc === 'function') {
			winWithGC.gc();
		}

		// Get memory stats for monitoring
		const memoryStats = this.voiceManager.getMemoryStats();
		logger.debug('performance', 'Memory optimization completed', { voiceManagerStats: memoryStats });
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
	 * Reconnect instruments to their volume nodes after cleanup
	 */
	private reconnectInstruments(): void {
		this.instruments.forEach((synth, instrumentName) => {
			const volume = this.instrumentVolumes.get(instrumentName);
			if (volume && !synth.disposed) {
				try {
					synth.connect(volume);
				} catch (error) {
					logger.debug('reconnect', `Failed to reconnect ${instrumentName}:`, error);
				}
			}
		});
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

	// Public getters for test suite
	get testIsInitialized(): boolean {
		return this.isInitialized;
	}

	getTestSamplerConfigs() {
		return this.getSamplerConfigs();
	}

	getTestAudioContext() {
		return getContext();
	}

	/**
	 * Issue #011: Generate comprehensive CDN sample loading diagnostic report
	 * This provides a complete overview of sample loading status across all 34 instruments
	 */
	private generateCDNDiagnosticReport(): void {
		const logger = getLogger('AudioEngine');
		
		// CDN Analysis from external-sample-sources-guide.md and actual investigation
		const cdnStatus = {
			// Working CDN sources (confirmed in external-sample-sources-guide.md)
			availableInstruments: {
				// Keyboard Family (5/6 available)
				piano: { status: 'AVAILABLE', samples: 86, path: 'piano/', format: 'ogg' },
				organ: { status: 'AVAILABLE', samples: 33, path: 'harmonium/', format: 'ogg' },
				electricPiano: { status: 'AVAILABLE', samples: 15, path: 'electric-piano/', format: 'ogg' },
				harpsichord: { status: 'AVAILABLE', samples: 18, path: 'harpsichord/', format: 'ogg' },
				accordion: { status: 'AVAILABLE', samples: 18, path: 'accordion/', format: 'ogg' },
				
				// Strings Family (6/6 available)
				violin: { status: 'AVAILABLE', samples: 15, path: 'violin/', format: 'ogg' },
				cello: { status: 'AVAILABLE', samples: 40, path: 'cello/', format: 'ogg' },
				guitar: { status: 'AVAILABLE', samples: 38, path: 'guitar-acoustic/', format: 'ogg' },
				harp: { status: 'AVAILABLE', samples: 20, path: 'harp/', format: 'ogg' },
				strings: { status: 'AVAILABLE', samples: 15, path: 'violin/', format: 'ogg' }, // Maps to violin
				
				// Brass Family (4/4 available)  
				trumpet: { status: 'AVAILABLE', samples: 11, path: 'trumpet/', format: 'ogg' },
				frenchHorn: { status: 'AVAILABLE', samples: 10, path: 'french-horn/', format: 'ogg' },
				trombone: { status: 'AVAILABLE', samples: 17, path: 'trombone/', format: 'ogg' },
				tuba: { status: 'AVAILABLE', samples: 9, path: 'tuba/', format: 'ogg' },
				
				// Woodwinds Family (4/5 available)
				flute: { status: 'AVAILABLE', samples: 10, path: 'flute/', format: 'ogg' },
				clarinet: { status: 'AVAILABLE', samples: 11, path: 'clarinet/', format: 'ogg' },
				saxophone: { status: 'AVAILABLE', samples: 33, path: 'saxophone/', format: 'ogg' },
				// oboe: Not available on CDN
				
				// Percussion Family (1/4 available)
				xylophone: { status: 'LIMITED', samples: 8, path: 'xylophone/', format: 'ogg', notes: 'Only C and G notes available' }
			},
			
			// Missing from CDN (confirmed in external-sample-sources-guide.md)
			missingInstruments: {
				// Vocal Family (0/6 available)
				


				
				// Percussion Family (3/4 missing)
				timpani: { status: 'MISSING', path: 'timpani/', reason: 'Directory does not exist on nbrosowsky CDN' },
				vibraphone: { status: 'MISSING', path: 'vibraphone/', reason: 'Directory does not exist on nbrosowsky CDN' },
				gongs: { status: 'MISSING', path: 'gongs/', reason: 'Directory does not exist on nbrosowsky CDN' },
				
				// Electronic Family (0/4 available)
				pad: { status: 'MISSING', path: 'pad/', reason: 'Directory does not exist on nbrosowsky CDN' },
				leadSynth: { status: 'MISSING', path: 'lead-synth/', reason: 'Directory does not exist on nbrosowsky CDN' },
				bassSynth: { status: 'MISSING', path: 'bass-synth/', reason: 'Directory does not exist on nbrosowsky CDN' },
				arpSynth: { status: 'MISSING', path: 'arp-synth/', reason: 'Directory does not exist on nbrosowsky CDN' },
				
				// Environmental Family (0/1 available)
				whaleHumpback: { status: 'MISSING', path: 'whale-song/', reason: 'Directory does not exist on nbrosowsky CDN' },
				
				// Missing woodwind
				oboe: { status: 'MISSING', path: 'oboe/', reason: 'Directory does not exist on nbrosowsky CDN' },
				
				// Missing keyboard
				celesta: { status: 'MISSING', path: 'celesta/', reason: 'Directory does not exist on nbrosowsky CDN' }
			}
		};
		
		// Generate comprehensive diagnostic report
		const totalInstruments = Object.keys(cdnStatus.availableInstruments).length + Object.keys(cdnStatus.missingInstruments).length;
		const availableCount = Object.keys(cdnStatus.availableInstruments).length;
		const missingCount = Object.keys(cdnStatus.missingInstruments).length;
		const coveragePercentage = Math.round((availableCount / totalInstruments) * 100);
		
		logger.debug('cdn-diagnosis', '🔍 ISSUE #011: Comprehensive CDN Sample Loading Diagnostic Report', {
			summary: {
				totalInstruments: totalInstruments,
				availableInstruments: availableCount,
				missingInstruments: missingCount,
				cdnCoverage: `${coveragePercentage}% (${availableCount}/${totalInstruments})`,
				primaryCDN: 'https://nbrosowsky.github.io/tonejs-instruments/samples/',
				effectiveFormat: 'ogg', // From Issue #005 resolution
				fallbackMode: 'synthesis'
			},
			
			workingInstruments: cdnStatus.availableInstruments,
			missingInstruments: cdnStatus.missingInstruments,
			
			formatIssues: {
				resolvedInIssue005: 'MP3→OGG format synchronization fixed',
				currentBehavior: 'AudioEngine automatically uses OGG format',
				userSelection: 'Per-Instrument Quality Control',
				effectiveFormat: 'ogg'
			},
			
			impact: {
				userExperience: `${missingCount} instruments fall back to synthesis`,
				audioQuality: 'Mixed: 19 instruments use high-quality samples, 15 use synthesis',
				networkRequests: `${availableCount} instruments attempt CDN sample loading`,
				errors: `Expected 404 errors for ${missingCount} missing instrument directories`
			},
			
			recommendations: {
				shortTerm: 'Document current CDN limitations for users',
				mediumTerm: 'Implement Freesound.org integration for missing instruments',
				longTerm: 'Create redundant CDN fallback system',
				issue012: 'Add sample loading indicators and error handling'
			},
			
			relatedIssues: {
				issue005: 'RESOLVED - Format synchronization fixed',
				issue011: 'IN PROGRESS - This diagnostic report',
				issue012: 'PENDING - Sample loading indicators',
				issue013: 'PENDING - CDN fallback system'
			}
		});
	}
} 