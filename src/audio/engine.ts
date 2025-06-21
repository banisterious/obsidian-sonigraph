// Import Tone.js with ESM-compatible approach
import { start, Volume, PolySynth, FMSynth, AMSynth, Sampler, getContext, getTransport, Reverb, Chorus, Filter, Delay, Distortion, Compressor, EQ3 } from 'tone';
import { MusicalMapping } from '../graph/types';
import { SonigraphSettings, EFFECT_PRESETS, EffectPreset, DEFAULT_SETTINGS, EffectNode, SendBus, ReturnBus, migrateToEnhancedRouting } from '../utils/constants';
import { PercussionEngine } from './percussion-engine';
import { ElectronicEngine } from './electronic-engine';
import { VoiceManager } from './voice-management';
import { EffectBusManager } from './effects';
import { InstrumentConfigLoader, LoadedInstrumentConfig } from './configs/InstrumentConfigLoader';
import { getLogger, LoggerFactory } from '../logging';
import { PlaybackEventEmitter, PlaybackEventType, PlaybackEventData, PlaybackProgressData, PlaybackErrorData } from './playback-events';

const logger = getLogger('audio-engine');

// Instrument configurations now managed by modular system in ./configs/

// VoiceAssignment interface moved to voice-management/types.ts

export class AudioEngine {
	private instruments: Map<string, PolySynth | Sampler> = new Map();
	private instrumentVolumes: Map<string, Volume> = new Map();
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

	// Real-time feedback properties
	private previewTimeouts: Map<string, number> = new Map();
	private bypassStates: Map<string, Map<string, boolean>> = new Map(); // instrument -> effect -> bypassed
	private performanceMetrics: Map<string, { cpuUsage: number; latency: number }> = new Map();
	private isPreviewMode: boolean = false;
	private previewInstrument: string | null = null;
	private previewNote: any = null;

	// Performance optimization properties - moved to VoiceManager
	// Effect routing properties - moved to EffectBusManager
	
	// Phase 2.2: Integration layer optimization - cached enabled instruments
	private cachedEnabledInstruments: string[] = [];
	private instrumentCacheValid: boolean = false;

	// Phase 8: Advanced Synthesis Engines
	private percussionEngine: PercussionEngine | null = null;
	
	// Phase 3: Frequency detuning for phase conflict resolution
	private frequencyHistory: Map<number, number> = new Map(); // frequency -> last used time
	private electronicEngine: ElectronicEngine | null = null;

	// Enhanced Play Button: Playback event system
	private eventEmitter: PlaybackEventEmitter = new PlaybackEventEmitter();
	private sequenceStartTime: number = 0;
	private sequenceProgressTimer: number | null = null;
	
	// Master Effects Processing - moved to EffectBusManager

	constructor(private settings: SonigraphSettings) {
		logger.debug('initialization', 'AudioEngine created');
		this.voiceManager = new VoiceManager(true); // Enable adaptive quality by default
		this.effectBusManager = new EffectBusManager();
		this.instrumentConfigLoader = new InstrumentConfigLoader({
			audioFormat: 'ogg', // Use OGG since it's the only format available on nbrosowsky CDN
			preloadFamilies: true
		});
		
		// Phase 2.2: Initialize enabled instruments cache - start valid for immediate use
		this.instrumentCacheValid = false; // Will be built on first access
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
	getEffectChain(instrumentName: string): any[] {
		return this.effectBusManager.getEffectChain(instrumentName);
	}

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

	updateEffectParameters(instrumentName: string, effectId: string, parameters: any): void {
		return this.effectBusManager.updateEffectParameters(instrumentName, effectId, parameters);
	}

	/**
	 * Bus management delegates
	 */
	getSendBuses(): Map<string, any> {
		return this.effectBusManager.getSendBuses();
	}

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

	get effectChains(): Map<string, any[]> {
		// Convert EffectBusManager chains to legacy format
		const legacyChains = new Map();
		// Implementation would go here if needed
		return legacyChains;
	}

	get sendBuses(): Map<string, any> {
		return this.effectBusManager.getSendBuses();
	}

	get returnBuses(): Map<string, any> {
		return this.effectBusManager.getReturnBuses();
	}

	get masterEffectsNodes(): Map<string, any> {
		// Legacy access to master effects - could be implemented if needed
		return new Map();
	}

	get effectNodeInstances(): Map<string, any> {
		// Legacy access to effect instances - could be implemented if needed
		return new Map();
	}

	get masterReverb(): any {
		return null; // Legacy property access
	}

	set masterReverb(value: any) {
		// Legacy setter - no-op since master effects are handled by EffectBusManager
	}

	get masterEQ(): any {
		return null; // Legacy property access
	}

	set masterEQ(value: any) {
		// Legacy setter - no-op since master effects are handled by EffectBusManager
	}

	get masterCompressor(): any {
		return null; // Legacy property access
	}

	set masterCompressor(value: any) {
		// Legacy setter - no-op since master effects are handled by EffectBusManager
	}

	// === DELEGATE METHODS FOR VOICE MANAGEMENT ===

	/**
	 * Legacy voice management property getters
	 */
	get voicePool(): Map<string, any[]> {
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
		this.voiceManager.setQualityLevel(level as any);
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
		// Use the new modular InstrumentConfigLoader instead of the monolithic SAMPLER_CONFIGS
		// Skip format replacement in synthesis-only mode - the loader handles format processing
		if (!this.settings.useHighQualitySamples) {
			// In synthesis-only mode, return empty configs since we use synthesizers
			return {};
		}
		
		// Load all instruments using the modular config system
		const loadedInstruments = this.instrumentConfigLoader.loadAllInstruments();
		
		// Return the loaded instruments for compatibility
		return loadedInstruments;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.warn('AudioEngine already initialized');
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
			useHighQualitySamples: this.settings.useHighQualitySamples,
			performanceMode: this.settings.performanceMode?.mode ?? 'medium'
		};
		
		// Check for any configuration gaps
		const configurationGaps = [];
		if (report.totalInstruments !== report.configuredVolumes) {
			configurationGaps.push(`Volume controls: ${report.configuredVolumes}/${report.totalInstruments}`);
		}
		if (report.totalInstruments !== report.configuredEffects) {
			configurationGaps.push(`Effects configurations: ${report.configuredEffects}/${report.totalInstruments}`);
		}
		
		// Generate status summary
		const status = configurationGaps.length === 0 ? 'Optimal' : 'Minor Issues';
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
				audioMode: report.useHighQualitySamples ? 'High Quality Samples (OGG)' : 'Synthesis Only',
				performanceMode: report.performanceMode,
				enhancedRouting: report.enhancedRouting ? 'Enabled' : 'Disabled',
				gaps: configurationGaps.length > 0 ? configurationGaps : 'None'
			}
		});
		
		if (configurationGaps.length > 0) {
			logger.warn('initialization-report', 'Configuration gaps detected', {
				issues: configurationGaps,
				impact: 'Some instruments may not have proper volume/effects control'
			});
		}
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

	private async initializeEffects(): Promise<void> {
		// Initialize per-instrument effects and volume controls - Phase 8B: Now supporting 34 instruments (Complete Orchestral Vision + Environmental Sounds)
		const instruments = ['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone', 'soprano', 'alto', 'tenor', 'bass', 'electricPiano', 'harpsichord', 'accordion', 'celesta', 'violin', 'cello', 'guitar', 'harp', 'trumpet', 'frenchHorn', 'trombone', 'tuba', 'oboe', 'timpani', 'xylophone', 'vibraphone', 'gongs', 'leadSynth', 'bassSynth', 'arpSynth', 'whaleHumpback'];
		
		for (const instrumentName of instruments) {
			// Create volume control with settings from constants or default
			const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
			const volumeLevel = instrumentSettings?.volume ?? DEFAULT_SETTINGS.instruments[instrumentName as keyof typeof DEFAULT_SETTINGS.instruments]?.volume ?? 0.7;
			const volume = new Volume(volumeLevel);
			this.instrumentVolumes.set(instrumentName, volume);
			
			// Create effects with settings from constants or defaults
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
		
		// In synthesis mode, use synthesizers for all instruments instead of trying to load samples
		if (!this.settings.useHighQualitySamples) {
			logger.info('instruments', 'Synthesis mode - creating synthesizers for all instruments');
			
			// Create synthesizers only for enabled instruments based on user settings
			const allInstruments = [
				'piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone', 
				'soprano', 'alto', 'tenor', 'bass', 'electricPiano', 'harpsichord', 'accordion', 'celesta', 
				'violin', 'cello', 'guitar', 'harp', 'trumpet', 'frenchHorn', 'trombone', 'tuba', 'oboe', 
				'timpani', 'xylophone', 'vibraphone', 'gongs', 'leadSynth', 'bassSynth', 'arpSynth', 'whaleHumpback'
			];
			
			// Filter to only include instruments that are enabled in settings
			const enabledInstruments = allInstruments.filter(instrumentName => {
				const instrumentSettings = this.settings.instruments[instrumentName as keyof typeof this.settings.instruments];
				return instrumentSettings?.enabled === true;
			});
			
			logger.info('instruments', `Creating synthesizers for ${enabledInstruments.length} enabled instruments: ${enabledInstruments.join(', ')}`);
			
			enabledInstruments.forEach(instrumentName => {
				// Create specialized synthesizers using proven synthesis from initializeLightweightSynthesis
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
						// Default for any remaining instruments
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
				
				// Connect synth → volume → master (direct routing for synthesis mode)
				synth.connect(volume);
				if (this.volume) {
					volume.connect(this.volume);
					logger.debug('instruments', `Connected ${instrumentName}: synth → volume → master`);
				} else {
					logger.warn('instruments', `Master volume not available for ${instrumentName} connection`);
				}
				
				// Add to instruments map
				this.instruments.set(instrumentName, synth);
				
				logger.debug('instruments', `Created specialized synthesis instrument: ${instrumentName}`);
			});
			
			// Synthesis instruments are now fully connected: synth → volume → master
			logger.debug('instruments', 'All synthesis instruments connected directly to master output');
			this.applyInstrumentSettings();
			return;
		}
		
		// Sample-based initialization for non-synthesis mode
		// Piano - using Sampler with high-quality samples, fallback to basic synthesis
		
		// Issue #011: Enhanced CDN sample loading diagnostics
		logger.info('cdn-diagnosis', 'Initializing piano sampler with CDN sample loading', {
			instrument: 'piano',
			baseUrl: configs.piano.baseUrl,
			sampleCount: Object.keys(configs.piano.urls).length,
			format: this.settings.useHighQualitySamples ? 'ogg' : 'synthesis',
			effectiveFormat: 'ogg', // From Issue #005 resolution
			urls: configs.piano.urls
		});
		
		const pianoSampler = new Sampler({
			...configs.piano,
			onload: () => {
				logger.info('cdn-diagnosis', 'Piano samples loaded successfully from CDN', {
					instrument: 'piano',
					baseUrl: configs.piano.baseUrl,
					loadedSampleCount: Object.keys(configs.piano.urls).length,
					status: 'success'
				});
			},
			onerror: (error) => {
				logger.error('cdn-diagnosis', 'Piano samples failed to load from CDN - investigating for Issue #011', { 
					instrument: 'piano',
					baseUrl: configs.piano.baseUrl,
					sampleCount: Object.keys(configs.piano.urls).length,
					error: error?.toString() || 'Unknown error',
					fallbackMode: 'synthesis',
					troubleshooting: 'Check network tab for 404/CORS errors'
				});
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
		
		// Issue #011: Enhanced CDN sample loading diagnostics for harmonium/organ
		logger.info('cdn-diagnosis', 'Initializing organ sampler with CDN sample loading', {
			instrument: 'organ',
			baseUrl: configs.organ.baseUrl,
			sampleCount: Object.keys(configs.organ.urls).length,
			expectedCDNPath: 'harmonium/', // Maps to nbrosowsky harmonium directory
			availableOnCDN: true // Confirmed: 33 OGG samples available
		});
		
		const organSampler = new Sampler({
			...configs.organ,
			onload: () => {
				logger.info('cdn-diagnosis', 'Organ samples loaded successfully from CDN', {
					instrument: 'organ',
					baseUrl: configs.organ.baseUrl,
					status: 'success'
				});
			},
			onerror: (error) => {
				logger.error('cdn-diagnosis', 'Organ samples failed to load from CDN - investigating for Issue #011', { 
					instrument: 'organ',
					baseUrl: configs.organ.baseUrl,
					error: error?.toString() || 'Unknown error',
					cdnStatus: 'harmonium directory exists with 33 OGG files',
					troubleshooting: 'Check if harmonium path is correctly mapped'
				});
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

		// Soprano - using Sampler with soprano samples (Issue #012: with synthesis fallback)
		const sopranoSampler = this.createSamplerWithFallback(configs.soprano, 'soprano');
		const sopranoVolume = new Volume(-6);
		this.instrumentVolumes.set('soprano', sopranoVolume);
		
		let sopranoOutput = sopranoSampler.connect(sopranoVolume);
		
		// Connect soprano to its specific effects based on settings
		const sopranoEffects = this.instrumentEffects.get('soprano');
		if (sopranoEffects && this.settings.instruments.soprano.effects) {
			if (this.settings.instruments.soprano.effects.reverb.enabled) {
				const reverb = sopranoEffects.get('reverb');
				if (reverb) sopranoOutput = sopranoOutput.connect(reverb);
			}
			if (this.settings.instruments.soprano.effects.chorus.enabled) {
				const chorus = sopranoEffects.get('chorus');
				if (chorus) sopranoOutput = sopranoOutput.connect(chorus);
			}
			if (this.settings.instruments.soprano.effects.filter.enabled) {
				const filter = sopranoEffects.get('filter');
				if (filter) sopranoOutput = sopranoOutput.connect(filter);
			}
		}
		sopranoOutput.connect(this.volume);
		this.instruments.set('soprano', sopranoSampler);

		// Alto - using Sampler with alto samples (Issue #012: with synthesis fallback)
		const altoSampler = this.createSamplerWithFallback(configs.alto, 'alto');
		const altoVolume = new Volume(-6);
		this.instrumentVolumes.set('alto', altoVolume);
		
		let altoOutput = altoSampler.connect(altoVolume);
		
		// Connect alto to its specific effects based on settings
		const altoEffects = this.instrumentEffects.get('alto');
		if (altoEffects && this.settings.instruments.alto.effects) {
			if (this.settings.instruments.alto.effects.reverb.enabled) {
				const reverb = altoEffects.get('reverb');
				if (reverb) altoOutput = altoOutput.connect(reverb);
			}
			if (this.settings.instruments.alto.effects.chorus.enabled) {
				const chorus = altoEffects.get('chorus');
				if (chorus) altoOutput = altoOutput.connect(chorus);
			}
			if (this.settings.instruments.alto.effects.filter.enabled) {
				const filter = altoEffects.get('filter');
				if (filter) altoOutput = altoOutput.connect(filter);
			}
		}
		altoOutput.connect(this.volume);
		this.instruments.set('alto', altoSampler);

		// Tenor - using Sampler with tenor samples (Issue #012: with synthesis fallback)
		const tenorSampler = this.createSamplerWithFallback(configs.tenor, 'tenor');
		const tenorVolume = new Volume(-6);
		this.instrumentVolumes.set('tenor', tenorVolume);
		
		let tenorOutput = tenorSampler.connect(tenorVolume);
		
		// Connect tenor to its specific effects based on settings
		const tenorEffects = this.instrumentEffects.get('tenor');
		if (tenorEffects && this.settings.instruments.tenor.effects) {
			if (this.settings.instruments.tenor.effects.reverb.enabled) {
				const reverb = tenorEffects.get('reverb');
				if (reverb) tenorOutput = tenorOutput.connect(reverb);
			}
			if (this.settings.instruments.tenor.effects.chorus.enabled) {
				const chorus = tenorEffects.get('chorus');
				if (chorus) tenorOutput = tenorOutput.connect(chorus);
			}
			if (this.settings.instruments.tenor.effects.filter.enabled) {
				const filter = tenorEffects.get('filter');
				if (filter) tenorOutput = tenorOutput.connect(filter);
			}
		}
		tenorOutput.connect(this.volume);
		this.instruments.set('tenor', tenorSampler);

		// Bass - using Sampler with bass voice samples (Issue #012: with synthesis fallback)
		const bassSampler = this.createSamplerWithFallback(configs.bass, 'bass');
		const bassVolume = new Volume(-6);
		this.instrumentVolumes.set('bass', bassVolume);
		
		let bassOutput = bassSampler.connect(bassVolume);
		
		// Connect bass to its specific effects based on settings
		const bassEffects = this.instrumentEffects.get('bass');
		if (bassEffects && this.settings.instruments.bass.effects) {
			if (this.settings.instruments.bass.effects.reverb.enabled) {
				const reverb = bassEffects.get('reverb');
				if (reverb) bassOutput = bassOutput.connect(reverb);
			}
			if (this.settings.instruments.bass.effects.chorus.enabled) {
				const chorus = bassEffects.get('chorus');
				if (chorus) bassOutput = bassOutput.connect(chorus);
			}
			if (this.settings.instruments.bass.effects.filter.enabled) {
				const filter = bassEffects.get('filter');
				if (filter) bassOutput = bassOutput.connect(filter);
			}
		}
		bassOutput.connect(this.volume);
		this.instruments.set('bass', bassSampler);

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
		// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
		const maxVoices = this.getInstrumentPolyphonyLimit('whaleHumpback');
		const whaleSynth = new PolySynth({
			voice: FMSynth,
			maxPolyphony: maxVoices,
			options: {
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
			useHighQualitySamples: this.settings.useHighQualitySamples,
			synthesisMode: !this.settings.useHighQualitySamples
		});

		// In synthesis mode, create basic synthesizers instead of loading samples
		if (!this.settings.useHighQualitySamples) {
			logger.info('instruments', 'Synthesis-only mode - creating basic synthesizers');
			missingKeys.forEach(instrumentName => {
				// Create basic polyphonic synthesizer
				// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
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
			return;
		}

		// Continue with sample-based initialization for non-synthesis mode

		missingKeys.forEach(instrumentName => {
			try {
				// Environmental instruments prefer synthesis over samples until sample downloading is implemented
				if (this.isEnvironmentalInstrument(instrumentName)) {
					logger.debug('instruments', `Environmental instrument ${instrumentName} will use synthesis - samples can be downloaded later`);
					
					// Create synthesizer for environmental instruments
					// Issue #010 Fix: Set appropriate polyphony limits to prevent crackling
					const maxVoices = this.getInstrumentPolyphonyLimit(instrumentName);
					const synth = new PolySynth({
						voice: FMSynth,
						maxPolyphony: maxVoices,
						options: {
							oscillator: { type: 'sine' },
							envelope: { attack: 0.5, decay: 1.0, sustain: 0.8, release: 2.0 } // Longer envelope for ambient sounds
						}
					});
					
					// Create volume control for environmental instruments
					const volume = new Volume(-6);
					this.instrumentVolumes.set(instrumentName, volume);
					
					// Connect synth → volume → master
					synth.connect(volume);
					if (this.volume) {
						volume.connect(this.volume);
					}
					
					// Add to instruments map
					this.instruments.set(instrumentName, synth);
					
					logger.debug('instruments', `Created synthesis instrument for environmental: ${instrumentName}`);
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

				// Re-create the specific instrument based on current mode (synthesis vs samples)
				if (!this.settings.useHighQualitySamples) {
					// Synthesis mode - create PolySynth like in original initialization
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
				} else if (configs[instrumentName]) {
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
						useHighQualitySamples: this.settings.useHighQualitySamples,
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
			hasBeenTriggeredCount: sequence.filter(n => n.hasBeenTriggered).length,
			action: 'play-sequence-init'
		});
		
		if (!this.isInitialized || !this.instruments.size) {
			logger.warn('playback', '🚀 ISSUE #010 FIX: AudioEngine not initialized, using FAST-PATH initialization!');
			await this.initializeEssentials();
		}

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
			const hasPercussion = this.hasPercussionInstrumentsEnabled();
			const hasElectronic = this.hasElectronicInstrumentsEnabled();
			const isSynthesisMode = !this.settings.useHighQualitySamples;
			
			logger.debug('playback', '🚀 ISSUE #010 DEBUG: Upgrade analysis', {
				currentInstrumentCount: this.instruments.size,
				currentInstruments: Array.from(this.instruments.keys()),
				hasPercussionEnabled: hasPercussion,
				hasElectronicEnabled: hasElectronic,
				willSkipPercussion: !hasPercussion,
				willSkipElectronic: !hasElectronic,
				isSynthesisMode,
				useHighQualitySamples: this.settings.useHighQualitySamples,
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
				await this.forceFullInitialization();
			}
			
			// Issue #010 Fix: Log state after upgrade to confirm instruments are loaded
			logger.info('playback', '🚀 ISSUE #010 FIX: Upgrade completed - verifying instruments', {
				instrumentsAfterUpgrade: this.instruments.size,
				instrumentsList: Array.from(this.instruments.keys()),
				isInitialized: this.isInitialized,
				isMinimalMode: this.isMinimalMode
			});
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
		} else {
			logger.info('issue-006-debug', 'All enabled instruments have healthy volume nodes', {
				enabledCount: enabledInstrumentsList.length,
				action: 'volume-nodes-healthy'
			});
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

			// Issue #006 Fix: Reset hasBeenTriggered flags for all notes to allow replay
			processedSequence.forEach(note => {
				if (note.hasBeenTriggered) {
					delete note.hasBeenTriggered;
				}
			});
			logger.debug('playback', 'Reset note trigger flags for replay', {
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

			// Find notes that should play now (within the next 600ms for 400ms timer)
			const notesToPlay = sequence.filter(note => 
				note.timing <= elapsedTime + 0.6 && 
				note.timing > elapsedTime - 0.4 && 
				!note.hasBeenTriggered
			);

			// Issue #006 Debug: Log note filtering results
			if (notesToPlay.length > 0 || elapsedTime < 5) { // Log for first 5 seconds or when notes found
				const totalNotes = sequence.length;
				const triggeredNotes = sequence.filter(n => n.hasBeenTriggered).length;
				logger.debug('issue-006-debug', 'Note filtering completed', {
					totalNotes,
					triggeredNotes,
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
			mapping.hasBeenTriggered = true;

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
			let instrumentName;
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
			} else if (this.electronicEngine && this.isElectronicInstrument(instrumentName)) {
				this.triggerAdvancedElectronic(instrumentName, frequency, duration, velocity, currentTime);
			} else if (this.isEnvironmentalInstrument(instrumentName)) {
				this.triggerEnvironmentalSound(instrumentName, frequency, duration, velocity, currentTime);
			} else {
				const synth = this.instruments.get(instrumentName);
				
				if (synth) {
					try {
						// Phase 3: Apply frequency detuning for phase conflict resolution
						const detunedFrequency = this.applyFrequencyDetuning(frequency);
						
						// Add pre-trigger audio context state logging
						const audioContext = getContext();
						
						synth.triggerAttackRelease(detunedFrequency, duration, currentTime, velocity);
						
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

			// Enhanced Play Button: Emit progress update
			const maxEndTime = Math.max(...sequence.map(n => n.timing + n.duration));
			const progressData: PlaybackProgressData = {
				currentIndex: sequence.filter(n => n.timing <= elapsedTime).length,
				totalNotes: sequence.length,
				elapsedTime: elapsedTime,
				estimatedTotalTime: maxEndTime,
				percentComplete: Math.min((elapsedTime / maxEndTime) * 100, 100)
			};
			this.eventEmitter.emit('sequence-progress', progressData);

			// Check if sequence is complete
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

		// Release all synth voices
		this.instruments.forEach((synth, instrumentName) => {
			synth.releaseAll();
		});

		this.currentSequence = [];

		logger.info('playback', 'Sequence stopped and Transport reset');
	}

	updateSettings(settings: SonigraphSettings): void {
		this.settings = settings;
		
		// Issue #006 Fix: Invalidate instruments cache when settings change
		// This ensures that instrument enable/disable changes are reflected in playback
		this.onInstrumentSettingsChanged();
		
		// Issue #005 Fix: Update InstrumentConfigLoader with new audio format
		// This ensures that format changes are propagated to the sample loading system
		// Only update if format is sample-based (not synthesis-only)
		if (settings.useHighQualitySamples) {
			// Convert to ogg since that's the only format that actually exists on nbrosowsky CDN
			const effectiveFormat = 'ogg';
			this.instrumentConfigLoader.updateAudioFormat(effectiveFormat as 'mp3' | 'wav' | 'ogg');
			
			// Also update PercussionEngine format if it exists
			if (this.percussionEngine) {
				this.percussionEngine.updateAudioFormat(effectiveFormat as 'wav' | 'ogg' | 'mp3');
			}
		}
		
		this.updateVolume();
		
		// Apply effect settings if engine is initialized
		if (this.isInitialized) {
			this.applyEffectSettings();
		}
		
		logger.debug('settings', 'Audio settings updated', {
			volume: settings.volume,
			tempo: settings.tempo,
			useHighQualitySamples: settings.useHighQualitySamples,
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
		// Phase 2.2: Optimized with caching to eliminate O(n) operation on every note trigger
		if (this.instrumentCacheValid) {
			// O(1) cache hit - this should be the common path after Phase 2.2 optimization
			return this.cachedEnabledInstruments;
		}
		
		// O(n) cache miss - rebuild cache
		logger.debug('optimization', 'Building enabled instruments cache - should be rare after first call');
		const enabled: string[] = [];
		Object.entries(this.settings.instruments).forEach(([instrumentKey, settings]) => {
			if (settings.enabled) {
				enabled.push(instrumentKey);
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
			
			// Initialize only basic piano for test notes (no CDN samples)
			await this.initializeBasicPiano();
			
			// Initialize lightweight synthesis for common instruments (no CDN samples)
			await this.initializeLightweightSynthesis();
			
			// Mark as initialized but keep it minimal
			this.isInitialized = true;
			this.isMinimalMode = true;
			logger.warn('audio', '🚀 ISSUE #010 FIX: Essential components initialized (minimal mode) with lightweight percussion');
			
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
				}
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
				options: {
					oscillator: { type: 'sine' },
					envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 2.0 },
					volume: -12 // Lower volume for timpani character
				}
			});

			// Xylophone - Bright, percussive synthesis
			const xylophonePoly = new PolySynth({
				voice: FMSynth,
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
				options: {
					oscillator: { type: 'sawtooth' },
					envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 1.5 },
					volume: -8
				}
			});

			// Flute - Airy, crystalline synthesis (Issue #010 Fix: Replaces CDN samples)
			const flutePoly = new PolySynth({
				voice: FMSynth,
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
				options: {
					oscillator: { type: 'sawtooth' },
					envelope: { attack: 0.08, decay: 0.2, sustain: 0.8, release: 1.2 },
					volume: -8
				}
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
			
			logger.debug('audio', 'Lightweight synthesis initialized', {
				useHighQualitySamples: this.settings.useHighQualitySamples,
				instrumentsCreated: this.instruments.size,
				synthesisMode: !this.settings.useHighQualitySamples
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

	// Legacy isEnhancedRoutingEnabled, getSendBuses, getReturnBuses methods removed - now delegated to EffectBusManager

	// Phase 8: Advanced Percussion Methods
	
	/**
	 * Check if an instrument is a percussion instrument
	 */
	private isPercussionInstrument(instrumentName: string): boolean {
		return ['timpani', 'xylophone', 'vibraphone', 'gongs'].includes(instrumentName);
	}

	private isElectronicInstrument(instrumentName: string): boolean {
		return ['pad', 'leadSynth', 'bassSynth', 'arpSynth'].includes(instrumentName);
	}

	private isEnvironmentalInstrument(instrumentName: string): boolean {
		return ['whaleHumpback'].includes(instrumentName);
	}

	/**
	 * Issue #010 Fix: Get default voice limits to avoid require() in methods
	 */
	private getDefaultVoiceLimits() {
		return {
			DEFAULT_VOICE_LIMITS: {
				piano: 8,
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
				tuba: 2,
				flute: 3,
				oboe: 3,
				clarinet: 3,
				bassoon: 3,
				piccolo: 3,
				soprano: 4,
				alto: 4,
				tenor: 4,
				bass: 4,
				choir: 8,
				timpani: 2,
				xylophone: 6,
				vibraphone: 6,
				gongs: 4,
				default: 4
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
		
		// Use default based on instrument category
		if (['piano', 'organ', 'harpsichord', 'harp', 'choir'].includes(instrumentName)) {
			return 8; // High polyphony for keyboard and choral instruments
		} else if (['strings', 'violin', 'viola', 'cello', 'contrabass'].includes(instrumentName)) {
			return 4; // Medium polyphony for strings
		} else if (['trumpet', 'horn', 'trombone', 'flute', 'oboe', 'clarinet', 'bassoon'].includes(instrumentName)) {
			return 3; // Lower polyphony for wind instruments
		} else if (['timpani', 'tuba'].includes(instrumentName)) {
			return 2; // Very low polyphony for bass instruments
		} else {
			return 4; // Default safe limit
		}
	}

	/**
	 * Issue #012: Create Sampler with synthesis fallback for failed CDN loading
	 */
	private createSamplerWithFallback(config: any, instrumentName: string): PolySynth | Sampler {
		try {
			const sampler = new Sampler(config);
			
			// Set up a timeout to check if samples loaded successfully
			setTimeout(() => {
				// Check if any buffers are actually loaded
				const buffers = (sampler as any)._buffers;
				let hasValidBuffers = false;
				
				if (buffers && buffers._buffers) {
					for (const [note, buffer] of Object.entries(buffers._buffers)) {
						if (buffer && (buffer as any).loaded) {
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
		
		// Create vocal-specific synthesis based on voice type
		switch (instrumentName) {
			case 'soprano':
				return new PolySynth({
					voice: AMSynth,
					maxPolyphony: maxVoices,
					options: {
						oscillator: { type: 'sine' },
						envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 2.0 },
						volume: -8 // Soprano - higher, clearer
					}
				});
			
			case 'alto':
				return new PolySynth({
					voice: AMSynth,
					maxPolyphony: maxVoices,
					options: {
						oscillator: { type: 'triangle' },
						envelope: { attack: 0.12, decay: 0.4, sustain: 0.7, release: 2.2 },
						volume: -10 // Alto - warmer, mid-range
					}
				});
			
			case 'tenor':
				return new PolySynth({
					voice: AMSynth,
					maxPolyphony: maxVoices,
					options: {
						oscillator: { type: 'sawtooth' },
						envelope: { attack: 0.15, decay: 0.5, sustain: 0.6, release: 2.5 },
						volume: -12 // Tenor - fuller, male range
					}
				});
			
			case 'bass':
				return new PolySynth({
					voice: FMSynth,
					maxPolyphony: maxVoices,
					options: {
						harmonicity: 1.5,
						modulationIndex: 2,
						oscillator: { type: 'square' },
						envelope: { attack: 0.2, decay: 0.6, sustain: 0.5, release: 3.0 },
						volume: -14 // Bass - deep, rich
					}
				});
			
			default:
				// Generic vocal synthesis
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
	}

	/**
	 * Issue #012: Reconnect instrument to effects chain after fallback creation
	 */
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
			// Issue #007 Fix: Convert error to debug level for environmental sounds
			logger.debug('environmental-sound', `Environmental sound failed for ${instrumentName}`, { 
				error: error instanceof Error ? error.message : String(error),
				frequency
			});
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
		if ('gc' in window && typeof (window as any).gc === 'function') {
			(window as any).gc();
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
				choir: { status: 'MISSING', path: 'choir/', reason: 'Directory does not exist on nbrosowsky CDN' },
				vocalPads: { status: 'MISSING', path: 'vocal-pads/', reason: 'Directory does not exist on nbrosowsky CDN' },
				soprano: { status: 'MISSING', path: 'soprano/', reason: 'Directory does not exist on nbrosowsky CDN' },
				alto: { status: 'MISSING', path: 'alto/', reason: 'Directory does not exist on nbrosowsky CDN' },
				tenor: { status: 'MISSING', path: 'tenor/', reason: 'Directory does not exist on nbrosowsky CDN' },
				bass: { status: 'MISSING', path: 'bass/', reason: 'Directory does not exist on nbrosowsky CDN' },
				
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
		
		logger.error('cdn-diagnosis', '🔍 ISSUE #011: Comprehensive CDN Sample Loading Diagnostic Report', {
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
				userSelection: this.settings.useHighQualitySamples ? 'High Quality Samples' : 'Synthesis Only',
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