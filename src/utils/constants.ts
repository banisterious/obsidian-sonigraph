import { AudioMappingConfig } from '../graph/types';
import { PanningMode, PanningCurve } from '../audio/spatial/types';

export interface InstrumentSettings {
	enabled: boolean;
	volume: number;
	maxVoices: number;
	useHighQuality?: boolean; // For instruments that support both synthesis and recordings
	effects: {
		reverb: ReverbSettings;
		chorus: ChorusSettings;
		filter: FilterSettings;
	};
}

export type InstrumentKey = keyof typeof DEFAULT_SETTINGS.instruments;

export type InstrumentName = 
	| 'piano' | 'organ' | 'strings' 
	| 'flute' | 'clarinet' | 'saxophone'
	| 'electricPiano' | 'harpsichord' | 'accordion' | 'celesta'
	| 'violin' | 'cello' | 'contrabass' | 'guitar' | 'guitarElectric' | 'guitarNylon' | 'bassElectric' | 'harp' | 'trumpet' | 'frenchHorn' | 'trombone' | 'tuba'
	| 'bassoon' | 'oboe' | 'timpani' | 'xylophone' | 'vibraphone' | 'gongs'
	| 'leadSynth' | 'bassSynth' | 'arpSynth' 
	| 'whaleHumpback' | 'whaleBlue' | 'whaleOrca' | 'whaleGray' | 'whaleSperm' | 'whaleMinke' | 'whaleFin' | 'whaleRight' | 'whaleSei' | 'whalePilot';

export interface ReverbSettings {
	enabled: boolean;
	params: {
		decay: number;
		preDelay: number;
		wet: number;
	};
}

export interface ChorusSettings {
	enabled: boolean;
	params: {
		frequency: number;
		depth: number;
		delayTime: number;
		feedback: number;
	};
}

export interface FilterSettings {
	enabled: boolean;
	params: {
		frequency: number;
		Q: number;
		type: 'lowpass' | 'highpass' | 'bandpass';
	};
}

// Legacy interface for backward compatibility (if needed)
export interface EffectSettings {
	enabled: boolean;
	params: {
		[key: string]: number | string;
	};
}

// Phase 3.5: Enhanced Effect Routing Architecture
export interface EffectNode {
	id: string;
	type: 'reverb' | 'chorus' | 'filter' | 'delay' | 'distortion' | 'compressor';
	enabled: boolean;
	order: number;
	settings: ReverbSettings | ChorusSettings | FilterSettings | DelaySettings | DistortionSettings | CompressorSettings;
	bypass: boolean; // For A/B testing
}

export interface EffectChain {
	instrumentName: string;
	routing: 'serial' | 'parallel' | 'custom';
	nodes: EffectNode[];
	wetDryMix?: number; // For parallel routing
	sendLevels?: Map<string, number>; // Send levels to buses
}

export interface SendBus {
	id: string;
	name: string;
	type: 'reverb' | 'delay' | 'custom';
	effects: EffectNode[];
	returnLevel: number;
	prePost: 'pre' | 'post'; // Pre or post-fader send
}

export interface ReturnBus {
	id: string;
	name: string;
	inputLevel: number;
	effects: EffectNode[];
	panPosition: number; // -1 (left) to 1 (right)
}

export interface InstrumentGroup {
	id: string;
	name: string;
	instruments: string[];
	groupEffects: EffectNode[];
	groupVolume: number;
	groupMute: boolean;
	groupSolo: boolean;
}

export interface MasterEffects {
	reverb: MasterReverbSettings;
	eq: MasterEQSettings;
	compressor: MasterCompressorSettings;
	limiter: MasterLimiterSettings;
	enabled: boolean;
}

export interface MasterReverbSettings extends ReverbSettings {
	roomSize: number;
	damping: number;
}

export interface MasterEQSettings {
	enabled: boolean;
	params: {
		lowGain: number;
		midGain: number;
		highGain: number;
		lowFreq: number;
		midFreq: number;
		highFreq: number;
	};
}

export interface MasterCompressorSettings {
	enabled: boolean;
	params: {
		threshold: number;
		ratio: number;
		attack: number;
		release: number;
		makeupGain: number;
	};
}

export interface MasterLimiterSettings {
	enabled: boolean;
	params: {
		threshold: number;
		lookAhead: number;
		release: number;
	};
}

// Additional effect types for enhanced routing
export interface DelaySettings {
	enabled: boolean;
	params: {
		delayTime: number;
		feedback: number;
		wet: number;
		maxDelay: number;
	};
}

export interface DistortionSettings {
	enabled: boolean;
	params: {
		distortion: number;
		oversample: '2x' | '4x' | 'none';
		wet: number;
	};
}

export interface CompressorSettings {
	enabled: boolean;
	params: {
		threshold: number;
		ratio: number;
		attack: number;
		release: number;
		knee: number;
	};
}

export interface EffectAutomation {
	effectId: string;
	parameter: string;
	modulation: 'lfo' | 'envelope' | 'random' | 'expression';
	amount: number;
	rate?: number; // For LFO modulation
	shape?: 'sine' | 'triangle' | 'square' | 'sawtooth'; // For LFO
	sync?: boolean; // Sync to tempo
}

export interface RoutingMatrix {
	sends: Map<string, SendBus[]>; // instrument -> send buses
	returns: Map<string, ReturnBus>; // bus name -> return bus
	groups: Map<string, InstrumentGroup>; // group name -> instruments
	masterEffects: MasterEffects;
	automations: EffectAutomation[];
}

// Phase 3.7: Sonic Graph settings panel controls interface
export interface SonicGraphSettings {
	timeline: {
		duration: number;           // Animation duration in seconds (15, 30, 60, 120, or custom)
		spacing: 'auto' | 'dense' | 'even' | 'custom'; // Timeline spacing mode
		loop: boolean;              // Automatically restart animation when complete
		showMarkers: boolean;       // Show year markers on timeline
		// Time window filtering
		timeWindow: 'all-time' | 'past-year' | 'past-month' | 'past-week' | 'past-day' | 'past-hour'; // Which files to include
		// Timeline granularity controls
		granularity: 'year' | 'month' | 'week' | 'day' | 'hour' | 'custom'; // Animation pacing granularity
		customRange: {
			value: number;          // Custom range value (e.g., 3 for "3 months")
			unit: 'years' | 'months' | 'weeks' | 'days' | 'hours'; // Custom range unit
		};
		// Smart event spreading for clustered events
		eventSpreadingMode: 'none' | 'gentle' | 'aggressive'; // How to handle clustered events
		maxEventSpacing: number;    // Maximum time window for spreading events (seconds)
		// Audio crackling prevention
		simultaneousEventLimit: number; // Maximum concurrent audio events
		eventBatchSize: number;     // Events to process per animation frame
	};
	audio: {
		density: number;            // Audio density (0-100, controls note frequency)
		noteDuration: number;       // Base note duration multiplier (0.1-2.0)
		enableEffects: boolean;     // Enable/disable audio effects during animation
		autoDetectionOverride?: 'auto' | 'dense' | 'balanced' | 'sparse'; // Override auto-detection
	};
	visual: {
		showLabels: boolean;        // Show file labels on nodes
		showFileNames: boolean;     // Show file names in small text beneath each node
		animationStyle: 'fade' | 'scale' | 'slide' | 'pop'; // How nodes appear during animation
		nodeScaling: number;        // Node size scaling factor (0.5-2.0)
		connectionOpacity: number;  // Connection line opacity (0.1-1.0)
		timelineMarkersEnabled: boolean; // Enable timeline year markers
		loopAnimation: boolean;     // Enable loop animation
	};
	navigation: {
		enableControlCenter: boolean; // Show Control Center button
		enableReset: boolean;         // Show Reset View button
		enableExport: boolean;        // Show Export Timeline button (future)
	};
	// Adaptive Detail Levels - Smart zoom-based filtering
	adaptiveDetail: {
		enabled: boolean;           // Main toggle for adaptive detail functionality
		mode: 'automatic' | 'performance' | 'manual'; // How adaptive details work
		thresholds: {
			overview: number;       // Zoom level for overview mode (default: 0.5)
			standard: number;       // Zoom level for standard mode (default: 1.5)
			detail: number;         // Zoom level for detail mode (default: 3.0)
		};
		overrides: {
			alwaysShowLabels: boolean;    // Override: always show labels regardless of zoom
			minimumVisibleNodes: number;  // Override: minimum nodes to always show
			maximumVisibleNodes: number;  // Override: maximum nodes for performance (-1 = no limit)
		};
	};
	// Phase 3.9: Content-Aware Positioning - Semantic layout forces
	contentAwarePositioning: {
		enabled: boolean;                   // Main toggle for content-aware positioning
		tagInfluence: {
			strength: 'subtle' | 'moderate' | 'strong'; // Preset strength levels
			weight: number;                 // Fine-tuning weight (0.0-0.5, default 0.3)
		};
		temporalPositioning: {
			enabled: boolean;               // Enable temporal zones
			weight: number;                 // Temporal influence weight (0.0-0.3, default 0.1)
			recentThresholdDays: number;    // Days to consider "recent" (default 30)
		};
		hubCentrality: {
			enabled: boolean;               // Pull important nodes to center
			weight: number;                 // Hub centrality weight (0.0-0.4, default 0.2)
			minimumConnections: number;     // Minimum connections to be considered a hub (default 5)
		};
		debugVisualization: boolean;       // Show force visualization for debugging
	};
	// Phase 3.8: Graph Layout Optimization Settings
	layout: {
		clusteringStrength: number;         // Slider for link-based attraction intensity (0.0-0.3)
		groupSeparation: number;            // Control spacing between distinct clusters (0.0-0.2)
		pathBasedGrouping: {
			enabled: boolean;               // Enable path-based grouping instead of file type clustering
			groups: Array<{
				id: string;                    // Unique identifier for the group
				name: string;                   // Display name for the group
				path: string;                   // Folder path (e.g., "Projects", "Journal")
				color: string;                  // Hex color for nodes in this group
			}>;
		};
		filters: {
			showTags: boolean;              // Enable/disable tag-based links in the graph
			showOrphans: boolean;           // Show/hide files with few or no connections
		};
		temporalClustering: boolean;        // Enable time-based clustering with recency weighting
		journalGravity: number;             // Adjust gravitational strength of high-connection nodes (0.0-0.5)
		layoutPreset: 'loose' | 'balanced' | 'tight' | 'very-tight'; // Quick layout options
		adaptiveScaling: boolean;           // Enable automatic performance scaling based on graph size
	};
	// Smart Clustering Algorithms - Intelligent grouping of related nodes
	smartClustering: {
		enabled: boolean;                   // Main toggle for smart clustering functionality
		algorithm: 'louvain' | 'modularity' | 'hybrid'; // Clustering algorithm selection
		weights: {
			linkStrength: number;           // Weight for direct connections (0.0-1.0, default 0.4)
			sharedTags: number;             // Weight for common tags (0.0-1.0, default 0.3)
			folderHierarchy: number;        // Weight for folder organization (0.0-1.0, default 0.2)
			temporalProximity: number;      // Weight for temporal proximity (0.0-1.0, default 0.1)
		};
		clustering: {
			minClusterSize: number;         // Minimum nodes per cluster (default 3)
			maxClusters: number;            // Maximum number of clusters (default 12)
			resolution: number;             // Clustering granularity (0.1-2.0, default 1.0)
		};
		visualization: {
			enableVisualization: boolean;   // Show cluster boundaries and colors
			showClusterLabels: boolean;     // Display auto-generated cluster labels
			clusterBoundaries: 'none' | 'subtle' | 'visible' | 'prominent'; // Boundary style
			colorScheme: 'type-based' | 'strength-based' | 'rainbow' | 'monochrome'; // Color coding
		};
		integration: {
			respectExistingGroups: boolean; // Honor manual path-based groups
			hybridMode: boolean;            // Combine manual and automatic clustering
			overrideThreshold: number;      // Manual group override strength (0.0-1.0)
		};
		debugging: {
			debugMode: boolean;             // Enable debug information overlay
			showStatistics: boolean;        // Display clustering quality metrics
			logClusteringDetails: boolean;  // Log clustering decisions for analysis
		};
	};
	// Phase 4.4: Connection Type Audio Differentiation
	connectionTypeMapping: {
		enabled: boolean;                   // Master toggle for connection type mapping
		independentFromContentAware: boolean; // Independent of Phase 4.1 content-aware mapping

		// Connection type mappings
		mappings: {
			wikilink: {
				enabled: boolean;
				instrumentFamily: string;
				intensity: number;
				audioCharacteristics: {
					baseVolume: number;
					volumeVariation: number;
					noteDuration: number;
					attackTime: number;
					releaseTime: number;
					spatialSpread: number;
					reverbAmount: number;
					delayAmount: number;
					harmonicRichness: number;
					dissonanceLevel: number;
					chordsEnabled: boolean;
					strengthToVolumeEnabled: boolean;
					strengthToVolumeAmount: number;
					bidirectionalHarmony: boolean;
					brokenLinkDissonance: boolean;
				};
				linkStrengthAnalysis: {
					enabled: boolean;
					frequencyThreshold: number;
					volumeBoost: number;
					harmonicBoost: number;
				};
				contextualModifiers: {
					sameFolderBoost: number;
					crossFolderReduction: number;
					recentConnectionBoost: number;
					timeDecayDays: number;
				};
			};
			embed: {
				enabled: boolean;
				instrumentFamily: string;
				intensity: number;
				audioCharacteristics: {
					baseVolume: number;
					volumeVariation: number;
					noteDuration: number;
					attackTime: number;
					releaseTime: number;
					spatialSpread: number;
					reverbAmount: number;
					delayAmount: number;
					harmonicRichness: number;
					dissonanceLevel: number;
					chordsEnabled: boolean;
					strengthToVolumeEnabled: boolean;
					strengthToVolumeAmount: number;
					bidirectionalHarmony: boolean;
					brokenLinkDissonance: boolean;
				};
				linkStrengthAnalysis: {
					enabled: boolean;
					frequencyThreshold: number;
					volumeBoost: number;
					harmonicBoost: number;
				};
				contextualModifiers: {
					sameFolderBoost: number;
					crossFolderReduction: number;
					recentConnectionBoost: number;
					timeDecayDays: number;
				};
			};
			markdown: {
				enabled: boolean;
				instrumentFamily: string;
				intensity: number;
				audioCharacteristics: {
					baseVolume: number;
					volumeVariation: number;
					noteDuration: number;
					attackTime: number;
					releaseTime: number;
					spatialSpread: number;
					reverbAmount: number;
					delayAmount: number;
					harmonicRichness: number;
					dissonanceLevel: number;
					chordsEnabled: boolean;
					strengthToVolumeEnabled: boolean;
					strengthToVolumeAmount: number;
					bidirectionalHarmony: boolean;
					brokenLinkDissonance: boolean;
				};
				linkStrengthAnalysis: {
					enabled: boolean;
					frequencyThreshold: number;
					volumeBoost: number;
					harmonicBoost: number;
				};
				contextualModifiers: {
					sameFolderBoost: number;
					crossFolderReduction: number;
					recentConnectionBoost: number;
					timeDecayDays: number;
				};
			};
			tag: {
				enabled: boolean;
				instrumentFamily: string;
				intensity: number;
				audioCharacteristics: {
					baseVolume: number;
					volumeVariation: number;
					noteDuration: number;
					attackTime: number;
					releaseTime: number;
					spatialSpread: number;
					reverbAmount: number;
					delayAmount: number;
					harmonicRichness: number;
					dissonanceLevel: number;
					chordsEnabled: boolean;
					strengthToVolumeEnabled: boolean;
					strengthToVolumeAmount: number;
					bidirectionalHarmony: boolean;
					brokenLinkDissonance: boolean;
				};
				linkStrengthAnalysis: {
					enabled: boolean;
					frequencyThreshold: number;
					volumeBoost: number;
					harmonicBoost: number;
				};
				contextualModifiers: {
					sameFolderBoost: number;
					crossFolderReduction: number;
					recentConnectionBoost: number;
					timeDecayDays: number;
				};
			};
		};

		// Global settings
		globalSettings: {
			connectionVolumeMix: number;    // Overall volume for connection audio (0.0-1.0)
			maxSimultaneousConnections: number; // Max concurrent connection sounds (5-50)
			connectionAudioFadeTime: number;    // Fade in/out time in seconds (0.1-2.0)
			enableCaching: boolean;         // Cache connection analysis results
			maxCacheSize: number;          // Max cache entries (100-5000)
			selectiveProcessing: boolean;  // Only process visible connections
			highQualityMode: boolean;       // Use high-quality synthesis
			antiAliasingEnabled: boolean;   // Enable audio anti-aliasing
			compressionEnabled: boolean;    // Enable dynamic compression
		};

		// Preset management
		currentPreset: string | null;       // Currently active preset name
		customPresets: Array<{
			name: string;
			description: string;
			author?: string;
			version?: string;
			mappings: Record<string, any>;
		}>;

		// Advanced features
		advancedFeatures: {
			connectionChords: boolean;      // Enable chord progressions for connections
			contextualHarmony: boolean;     // Harmonize based on connected content
			dynamicInstrumentation: boolean; // Change instruments based on context
			velocityModulation: boolean;    // Modulate velocity based on connection strength
			temporalSpacing: boolean;       // Space connection sounds temporally
			crossfadeConnections: boolean;  // Crossfade between connection types
		};
	};
}

export interface SonigraphSettings {
	tempo: number;
	volume: number;
	scale: string;
	rootNote: string;
	traversalMethod: string;
	isEnabled: boolean;
	microtuning?: boolean;
	antiCracklingDetuning?: number; // Issue #010 Future-Proof Fix: Configurable micro-detuning amount in cents (±)
	logLevel?: 'off' | 'error' | 'warn' | 'info' | 'debug'; // Persistent logging level
	sonicGraphShowFileNames?: boolean; // Show file names in Sonic Graph visualization
	sonicGraphExcludeFolders?: string[]; // Folders to exclude from Sonic Graph
	sonicGraphExcludeFiles?: string[]; // Files to exclude from Sonic Graph
	sonicGraphAnimationDuration?: number; // Base animation duration in seconds (default 60)
	sonicGraphAnimationSpeed?: number; // Animation speed multiplier (default 1.0)
	sonicGraphSettings?: SonicGraphSettings; // Phase 3.7: Comprehensive settings panel controls
	audioEnhancement?: AudioMappingConfig; // Phase 1: Audio enhancement settings
	effects?: {
		[key: string]: {
			enabled: boolean;
			[param: string]: any;
		};
	};
	instruments: {
		piano: InstrumentSettings;
		organ: InstrumentSettings;
		strings: InstrumentSettings;
		flute: InstrumentSettings;
		clarinet: InstrumentSettings;
		saxophone: InstrumentSettings;
		// Phase 6B: Extended Keyboard Family
		electricPiano: InstrumentSettings;
		harpsichord: InstrumentSettings;
		accordion: InstrumentSettings;
		celesta: InstrumentSettings;
		// Phase 7: Strings & Brass Completion
		violin: InstrumentSettings;
		cello: InstrumentSettings;
		contrabass: InstrumentSettings;
		guitar: InstrumentSettings;
		guitarElectric: InstrumentSettings;
		guitarNylon: InstrumentSettings;
		bassElectric: InstrumentSettings;
		harp: InstrumentSettings;
		trumpet: InstrumentSettings;
		frenchHorn: InstrumentSettings;
		trombone: InstrumentSettings;
		tuba: InstrumentSettings;
		// Phase 8: Percussion & Electronic Finale (8 instruments → 33/33 total)
		bassoon: InstrumentSettings;
		oboe: InstrumentSettings;
		timpani: InstrumentSettings;
		xylophone: InstrumentSettings;
		vibraphone: InstrumentSettings;
		gongs: InstrumentSettings;
		leadSynth: InstrumentSettings;
		bassSynth: InstrumentSettings;
		arpSynth: InstrumentSettings;
		// Phase 8B: Environmental & Natural Sounds
		whaleHumpback: InstrumentSettings;
		// High-quality whale species (only available in high-quality mode)
		whaleBlue: InstrumentSettings;
		whaleOrca: InstrumentSettings;
		whaleGray: InstrumentSettings;
		whaleSperm: InstrumentSettings;
		whaleMinke: InstrumentSettings;
		whaleFin: InstrumentSettings;
		whaleRight: InstrumentSettings;
		whaleSei: InstrumentSettings;
		whalePilot: InstrumentSettings;
	};
	voiceAssignmentStrategy: 'frequency' | 'round-robin' | 'connection-based';
	
	// Phase 3: Performance Mode Settings
	performanceMode?: {
		mode: 'low' | 'medium' | 'high' | 'ultra';
		enableFrequencyDetuning: boolean;
		maxConcurrentVoices: number;
		processingQuality: 'fast' | 'balanced' | 'high-quality';
		enableAudioOptimizations: boolean;
	};
	
	// Phase 3.5: Enhanced Effect Routing
	enhancedRouting?: {
		enabled: boolean;
		effectChains: Map<string, EffectChain>; // instrument -> effect chain
		routingMatrix: RoutingMatrix;
		version: string; // For migration compatibility
	};
	
	// Phase 7.1: Freesound API integration settings
	freesoundApiKey?: string;
	enableFreesoundSamples?: boolean;
	
	// Phase 2: Content-aware mapping settings
	contentAwareMapping?: {
		enabled: boolean;
		fileTypePreferences: Record<string, string[]>;
		tagMappings: Record<string, any>;
		folderMappings: Record<string, any>;
		connectionTypeMappings: Record<string, any>;
		frontmatterPropertyName?: string;
		moodPropertyName?: string;
		distributionStrategy?: string;
	};

	// Phase 5.1: Smart clustering audio integration
	clusterAudio?: {
		enabled: boolean;
		globalVolume: number;
		clusterTypeEnabled: {
			'tag-based': boolean;
			'folder-based': boolean;
			'link-dense': boolean;
			'temporal': boolean;
			'community': boolean;
		};
		clusterTypeVolumes: {
			'tag-based': number;
			'folder-based': number;
			'link-dense': number;
			'temporal': number;
			'community': number;
		};
		transitionsEnabled: boolean;
		transitionVolume: number;
		transitionSpeed: number;
		realTimeUpdates: boolean;
		strengthModulation: boolean;
		strengthSensitivity: number;
		spatialAudio: boolean;
		maxSimultaneousClusters: number;
		updateThrottleMs: number;
	};

	// Phase 5.2: Hub Node Orchestration
	hubOrchestration?: {
		enabled: boolean;
		hubThreshold: number; // 0-1, minimum composite score to be hub
		prominenceMultiplier: number; // 1-5, how much louder hubs are
		orchestrationMode: 'hub-led' | 'democratic' | 'balanced';
		transitionsEnabled: boolean;
		centralityWeights: {
			degree: number; // 0-1, weight for degree centrality
			betweenness: number; // 0-1, weight for betweenness centrality
			eigenvector: number; // 0-1, weight for eigenvector centrality
			pageRank: number; // 0-1, weight for PageRank
		};
		hubInstrumentPreference: string[]; // Preferred instruments for hub nodes
	};

	// Phase 6.1: Musical Theory Integration
	musicalTheory?: {
		enabled: boolean;
		scale: string; // 'major', 'minor', 'dorian', 'pentatonic-major', etc.
		rootNote: string; // 'C', 'C#', 'D', etc.
		enforceHarmony: boolean; // Constrain all notes to scale
		allowChromaticPassing: boolean; // Allow chromatic passing tones
		dissonanceThreshold: number; // 0-1, maximum allowed dissonance
		quantizationStrength: number; // 0-1, how strongly to quantize pitches
		preferredChordProgression: string; // 'I-IV-V-I', 'ii-V-I', etc.
		dynamicScaleModulation: boolean; // Change scale based on vault state
	};

	// Phase 6.2: Dynamic Orchestration
	dynamicOrchestration?: {
		enabled: boolean;
		customThresholds: boolean; // Use custom complexity thresholds
		temporalInfluenceEnabled: boolean; // Enable time-of-day and seasonal effects
		timeOfDayInfluence: number; // 0-1, strength of time-of-day effect
		seasonalInfluence: number; // 0-1, strength of seasonal effect
		transitionDuration: number; // Seconds, duration of tier transitions
		autoAdjust: boolean; // Auto-adjust based on vault changes
	};

	// Phase 6.3: Spatial Audio and Panning
	spatialAudio?: {
		enabled: boolean;
		mode: PanningMode;
		graphPositionSettings: {
			curve: PanningCurve;
			intensity: number; // 0-1, how extreme panning can be
			smoothingFactor: number; // 0-1, smooths position changes
			updateThrottleMs: number; // Min ms between updates
		};
		folderSettings: {
			enabled: boolean;
			customMappings: Array<{
				folderPath: string;
				panPosition: number; // -1 to 1
				priority: number;
			}>;
			autoDetectTopLevel: boolean;
			spreadFactor: number; // 0-1, variation for nested files
		};
		clusterSettings: {
			enabled: boolean;
			useCentroid: boolean;
			individualSpread: number; // 0-1
			clusterSeparation: number; // 0-1
		};
		hybridWeights: {
			graphPosition: number; // 0-1
			folderBased: number; // 0-1
			clusterBased: number; // 0-1
		};
		advanced: {
			enableDepthMapping: boolean; // Future surround sound
			depthInfluence: number; // 0-1
			boundaryPadding: number; // 0-1
			velocityDamping: boolean;
			dampingFactor: number; // 0-1
		};
	};

	// Phase 5.3: Community Detection Audio
	communityDetection?: {
		enabled: boolean;
		largeCommunitySizeThreshold: number;
		hierarchyAnalysis: boolean;
		hierarchyContainmentThreshold: number;
		themeIntensity: number;
		communityTypeEnabled: {
			'large-stable': boolean;
			'small-dynamic': boolean;
			'bridge': boolean;
			'isolated': boolean;
			'hierarchical': boolean;
		};
		communityTypeVolumes: {
			'large-stable': number;
			'small-dynamic': number;
			'bridge': number;
			'isolated': number;
			'hierarchical': number;
		};
		spatialAudio: boolean;
		spatialWidth: number;
	};

	// Phase 5.3: Community Evolution Audio
	communityEvolution?: {
		enabled: boolean;
		growthThreshold: number;
		declineThreshold: number;
		eventAudioEnabled: boolean;
		enabledEventTypes: {
			'merge': boolean;
			'split': boolean;
			'growth': boolean;
			'decline': boolean;
			'bridging': boolean;
			'formation': boolean;
			'dissolution': boolean;
		};
		eventVolumes: {
			'merge': number;
			'split': number;
			'growth': number;
			'decline': number;
			'bridging': number;
			'formation': number;
			'dissolution': number;
		};
		eventThrottleMs: number;
	};
}

export const DEFAULT_SETTINGS: SonigraphSettings = {
	tempo: 120,
	volume: 0.5,
	scale: 'major',
	rootNote: 'C',
	traversalMethod: 'breadth-first',
	isEnabled: true,
	microtuning: false,
	antiCracklingDetuning: 2.0, // Issue #010 Future-Proof Fix: Default ±2 cents detuning to prevent phase interference
	logLevel: 'warn', // Default to warn level to capture important initialization issues
	sonicGraphShowFileNames: false, // Default to hiding file names for cleaner visualization
	sonicGraphExcludeFolders: [], // No folders excluded by default
	sonicGraphExcludeFiles: [], // No files excluded by default
	sonicGraphAnimationDuration: 60, // Default 60 seconds for more contemplative pacing
	sonicGraphAnimationSpeed: 1.0, // Default to normal speed
	sonicGraphSettings: {
		timeline: {
			duration: 60,
			spacing: 'auto',
			loop: false,
			showMarkers: true,
			// Time window default
			timeWindow: 'all-time',
			// Timeline granularity defaults
			granularity: 'year',
			customRange: {
				value: 1,
				unit: 'years'
			},
			// Event spreading defaults
			eventSpreadingMode: 'gentle',
			maxEventSpacing: 5.0,
			// Audio crackling prevention defaults
			simultaneousEventLimit: 3,
			eventBatchSize: 5
		},
		audio: {
			density: 30,
			noteDuration: 0.3,
			enableEffects: true,
			autoDetectionOverride: 'auto'
		},
		visual: {
			showLabels: false,
			showFileNames: false,
			animationStyle: 'fade',
			nodeScaling: 1.0,
			connectionOpacity: 0.6,
			timelineMarkersEnabled: true,
			loopAnimation: false
		},
		navigation: {
			enableControlCenter: true,
			enableReset: true,
			enableExport: false
		},
		// Adaptive Detail Levels - Default Settings
		adaptiveDetail: {
			enabled: false,                  // Disabled by default for backward compatibility
			mode: 'automatic',              // Automatic mode when enabled
			thresholds: {
				overview: 0.5,              // Show hubs only when zoomed out < 0.5x
				standard: 1.5,              // Standard view at 0.5x - 1.5x zoom
				detail: 3.0                 // Detail view at 1.5x - 3.0x zoom
			},
			overrides: {
				alwaysShowLabels: false,    // Respect zoom-based label visibility
				minimumVisibleNodes: 10,    // Always show at least 10 nodes for orientation
				maximumVisibleNodes: -1     // No maximum limit by default
			}
		},
		// Phase 3.9: Content-Aware Positioning - Default Settings
		contentAwarePositioning: {
			enabled: false,                 // Disabled by default for experimentation
			tagInfluence: {
				strength: 'moderate',       // Balanced default strength
				weight: 0.3                 // 30% influence for tag attraction
			},
			temporalPositioning: {
				enabled: true,              // Enabled when content-aware is on
				weight: 0.1,                // 10% influence for temporal positioning
				recentThresholdDays: 30     // 30 days considered "recent"
			},
			hubCentrality: {
				enabled: true,              // Enabled when content-aware is on
				weight: 0.2,                // 20% influence for hub centrality
				minimumConnections: 5       // 5+ connections makes a hub
			},
			debugVisualization: false      // Debug visualization off by default
		},
		// Phase 3.8: Graph Layout Optimization Default Settings
		layout: {
			clusteringStrength: 0.15,           // Moderate clustering strength
			groupSeparation: 0.08,              // Good spacing between groups
			pathBasedGrouping: {
				enabled: false,                 // Disabled by default
				groups: [
					{
						id: 'journals',
						name: 'Journals',
						path: 'Journal',
						color: '#4f46e5'           // Indigo
					},
					{
						id: 'projects', 
						name: 'Projects',
						path: 'Projects',
						color: '#059669'           // Emerald
					}
				]
			},
			filters: {
				showTags: true,                 // Show tag-based links by default
				showOrphans: true               // Show orphan files by default
			},
			temporalClustering: false,          // Disable by default for performance
			journalGravity: 0.3,                // Moderate journal gravity
			layoutPreset: 'balanced',           // Balanced layout by default
			adaptiveScaling: true               // Enable automatic scaling
		},
		// Smart Clustering Algorithms - Default Settings
		smartClustering: {
			enabled: false,                     // Disabled by default for experimentation
			algorithm: 'hybrid',                // Hybrid algorithm combines best of both worlds
			weights: {
				linkStrength: 0.4,              // 40% weight for direct connections
				sharedTags: 0.3,                // 30% weight for common tags
				folderHierarchy: 0.2,           // 20% weight for folder organization
				temporalProximity: 0.1          // 10% weight for temporal proximity
			},
			clustering: {
				minClusterSize: 3,              // Minimum 3 nodes per cluster
				maxClusters: 12,                // Maximum 12 clusters for manageable visualization
				resolution: 1.0                 // Standard granularity
			},
			visualization: {
				enableVisualization: true,      // Show cluster boundaries when enabled
				showClusterLabels: true,        // Show auto-generated labels
				clusterBoundaries: 'subtle',    // Subtle boundaries by default
				colorScheme: 'type-based'       // Color by cluster type
			},
			integration: {
				respectExistingGroups: true,    // Honor manual path-based groups
				hybridMode: true,               // Combine manual and automatic clustering
				overrideThreshold: 0.7          // Strong manual group preference
			},
			debugging: {
				debugMode: false,               // Debug mode off by default
				showStatistics: false,          // Statistics off by default
				logClusteringDetails: false     // Logging off by default
			}
		},
		// Phase 4.4: Connection Type Audio Differentiation - Default Settings
		connectionTypeMapping: {
			enabled: false,                     // Disabled by default for optional feature
			independentFromContentAware: true, // Independent operation by default

			// Connection type mappings with defaults from Phase 4.4 config
			mappings: {
				wikilink: {
					enabled: true,              // Enable core wikilinks by default
					instrumentFamily: 'strings',
					intensity: 0.7,
					audioCharacteristics: {
						baseVolume: 0.7,
						volumeVariation: 0.1,
						noteDuration: 1.0,
						attackTime: 0.05,
						releaseTime: 0.8,
						spatialSpread: 0.3,
						reverbAmount: 0.2,
						delayAmount: 0.1,
						harmonicRichness: 0.6,
						dissonanceLevel: 0.0,
						chordsEnabled: false,
						strengthToVolumeEnabled: true,
						strengthToVolumeAmount: 0.3,
						bidirectionalHarmony: true,
						brokenLinkDissonance: false
					},
					linkStrengthAnalysis: {
						enabled: true,
						frequencyThreshold: 3,
						volumeBoost: 1.3,
						harmonicBoost: 1.2
					},
					contextualModifiers: {
						sameFolderBoost: 1.1,
						crossFolderReduction: 0.9,
						recentConnectionBoost: 1.15,
						timeDecayDays: 30
					}
				},
				embed: {
					enabled: true,              // Enable core embeds by default
					instrumentFamily: 'keyboards',
					intensity: 0.7,
					audioCharacteristics: {
						baseVolume: 0.8,
						volumeVariation: 0.15,
						noteDuration: 1.2,
						attackTime: 0.08,
						releaseTime: 1.2,
						spatialSpread: 0.5,
						reverbAmount: 0.3,
						delayAmount: 0.2,
						harmonicRichness: 0.8,
						dissonanceLevel: 0.0,
						chordsEnabled: true,
						strengthToVolumeEnabled: true,
						strengthToVolumeAmount: 0.4,
						bidirectionalHarmony: true,
						brokenLinkDissonance: false
					},
					linkStrengthAnalysis: {
						enabled: true,
						frequencyThreshold: 3,
						volumeBoost: 1.3,
						harmonicBoost: 1.2
					},
					contextualModifiers: {
						sameFolderBoost: 1.1,
						crossFolderReduction: 0.9,
						recentConnectionBoost: 1.15,
						timeDecayDays: 30
					}
				},
				markdown: {
					enabled: false,             // Disabled by default for minimal setup
					instrumentFamily: 'woodwinds',
					intensity: 0.7,
					audioCharacteristics: {
						baseVolume: 0.6,
						volumeVariation: 0.1,
						noteDuration: 0.8,
						attackTime: 0.03,
						releaseTime: 0.6,
						spatialSpread: 0.2,
						reverbAmount: 0.15,
						delayAmount: 0.05,
						harmonicRichness: 0.4,
						dissonanceLevel: 0.0,
						chordsEnabled: false,
						strengthToVolumeEnabled: true,
						strengthToVolumeAmount: 0.2,
						bidirectionalHarmony: false,
						brokenLinkDissonance: false
					},
					linkStrengthAnalysis: {
						enabled: true,
						frequencyThreshold: 3,
						volumeBoost: 1.3,
						harmonicBoost: 1.2
					},
					contextualModifiers: {
						sameFolderBoost: 1.1,
						crossFolderReduction: 0.9,
						recentConnectionBoost: 1.15,
						timeDecayDays: 30
					}
				},
				tag: {
					enabled: false,             // Disabled by default for minimal setup
					instrumentFamily: 'ambient',
					intensity: 0.7,
					audioCharacteristics: {
						baseVolume: 0.5,
						volumeVariation: 0.2,
						noteDuration: 1.5,
						attackTime: 0.1,
						releaseTime: 2.0,
						spatialSpread: 0.7,
						reverbAmount: 0.4,
						delayAmount: 0.3,
						harmonicRichness: 0.9,
						dissonanceLevel: 0.0,
						chordsEnabled: true,
						strengthToVolumeEnabled: false,
						strengthToVolumeAmount: 0.0,
						bidirectionalHarmony: true,
						brokenLinkDissonance: false
					},
					linkStrengthAnalysis: {
						enabled: false,         // Disabled for tags by default
						frequencyThreshold: 3,
						volumeBoost: 1.0,
						harmonicBoost: 1.0
					},
					contextualModifiers: {
						sameFolderBoost: 1.0,
						crossFolderReduction: 1.0,
						recentConnectionBoost: 1.0,
						timeDecayDays: 30
					}
				}
			},

			// Global settings - Conservative defaults for performance
			globalSettings: {
				connectionVolumeMix: 0.6,
				maxSimultaneousConnections: 15,    // Conservative default for performance
				connectionAudioFadeTime: 0.3,
				enableCaching: true,
				maxCacheSize: 500,                 // Moderate cache size
				selectiveProcessing: true,         // Performance optimization enabled
				highQualityMode: false,            // Standard quality by default
				antiAliasingEnabled: true,
				compressionEnabled: true
			},

			// Preset management
			currentPreset: 'Default',
			customPresets: [],                     // No custom presets by default

			// Advanced features - All disabled by default for stability
			advancedFeatures: {
				connectionChords: false,
				contextualHarmony: false,
				dynamicInstrumentation: false,
				velocityModulation: true,          // Only velocity modulation enabled by default
				temporalSpacing: false,
				crossfadeConnections: false
			}
		}
	},
	effects: {
		orchestralreverbhall: { enabled: true },
		'3bandeq': { enabled: true },
		dynamiccompressor: { enabled: false }
	},
	instruments: {
		piano: { 
			enabled: true, 
			volume: 0.8, 
			maxVoices: 8,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
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
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.2, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: true, 
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
					enabled: true, 
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
		flute: { 
			enabled: true, 
			volume: 0.6, 
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.2, 
						preDelay: 0.02, 
						wet: 0.4 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.8, 
						depth: 0.2, 
						delayTime: 2.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 6000, 
						Q: 0.5, 
						type: 'lowpass' 
					} 
				}
			}
		},
		clarinet: { 
			enabled: true, 
			volume: 0.5, 
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.5, 
						depth: 0.25, 
						delayTime: 2.5, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 4500, 
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		saxophone: { 
			enabled: false, 
			volume: 0.7, 
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.8, 
						preDelay: 0.04, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.6, 
						depth: 0.4, 
						delayTime: 3.5, 
						feedback: 0.06 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 3000, 
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		// Phase 6B: Extended Keyboard Family
		electricPiano: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.0, 
						preDelay: 0.025, 
						wet: 0.3 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 1.2, 
						depth: 0.4, 
						delayTime: 3.0, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 5000,
						Q: 0.7, 
						type: 'lowpass' 
					} 
				}
			}
		},
		harpsichord: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 1.5, 
						preDelay: 0.02, 
						wet: 0.25 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.2, 
						delayTime: 2.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 4500,
						Q: 1.0, 
						type: 'lowpass' 
					} 
				}
			}
		},
		accordion: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.2, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.8, 
						depth: 0.5, 
						delayTime: 4.0, 
						feedback: 0.06 
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
		celesta: { 
			enabled: false,
			volume: 0.5, 
			maxVoices: 6,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.0, 
						preDelay: 0.04, 
						wet: 0.5 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.4, 
						depth: 0.3, 
						delayTime: 3.5, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 6000,
						Q: 0.6, 
						type: 'lowpass' 
					} 
				}
			}
		},
		// Phase 7: Strings & Brass Completion
		violin: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.4 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.3, 
						delayTime: 2.5, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 5000,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		cello: { 
			enabled: false,
			volume: 0.8, 
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.2, 
						preDelay: 0.04, 
						wet: 0.5 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.4, 
						depth: 0.4, 
						delayTime: 3.5, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 3000,
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		contrabass: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 3,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.5, 
						preDelay: 0.04, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.3, 
						depth: 0.2, 
						delayTime: 4.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 2000,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		guitar: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 8,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.0, 
						preDelay: 0.02, 
						wet: 0.3 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.8, 
						depth: 0.3, 
						delayTime: 2.0, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 4000,
						Q: 0.7, 
						type: 'lowpass' 
					} 
				}
			}
		},
		guitarElectric: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
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
					enabled: true, 
					params: { 
						frequency: 1.2, 
						depth: 0.4, 
						delayTime: 2.5, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 5000,
						Q: 0.6, 
						type: 'lowpass' 
					} 
				}
			}
		},
		guitarNylon: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.4 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.2, 
						delayTime: 3.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 4500,
						Q: 0.5, 
						type: 'lowpass' 
					} 
				}
			}
		},
		bassElectric: { 
			enabled: false,
			volume: 0.8, 
			maxVoices: 2,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 1.5, 
						preDelay: 0.01, 
						wet: 0.2 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.5, 
						depth: 0.3, 
						delayTime: 2.0, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 2500,
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		harp: { 
			enabled: false,
			volume: 0.5, 
			maxVoices: 12,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 4.0, 
						preDelay: 0.05, 
						wet: 0.6 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.3, 
						depth: 0.2, 
						delayTime: 4.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 6000,
						Q: 0.5, 
						type: 'lowpass' 
					} 
				}
			}
		},
		trumpet: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 4,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.2, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.7, 
						depth: 0.2, 
						delayTime: 2.5, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 4500,
						Q: 1.0, 
						type: 'lowpass' 
					} 
				}
			}
		},
		frenchHorn: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 4,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.8, 
						preDelay: 0.04, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.5, 
						depth: 0.3, 
						delayTime: 3.0, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 3500,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		trombone: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 4,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.4 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.3, 
						delayTime: 3.0, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 2500,
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		tuba: { 
			enabled: false,
			volume: 0.8, 
			maxVoices: 3,
			useHighQuality: false, // Default to synthesis (user can opt-in to samples)
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.5, 
						preDelay: 0.05, 
						wet: 0.5 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.3, 
						depth: 0.4, 
						delayTime: 4.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 1500,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		// Phase 8: Percussion & Electronic Finale (8 instruments → 33/33 total)
		bassoon: {
			enabled: false,
			volume: 0.7,
			maxVoices: 4,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 2.8,
						preDelay: 0.04,
						wet: 0.4
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.9,
						depth: 0.4,
						delayTime: 3.0,
						feedback: 0.08
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 2000,
						Q: 1.0,
						type: 'lowpass'
					}
				}
			}
		},
		oboe: {
			enabled: false,
			volume: 0.7,
			maxVoices: 4,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 2.5,
						preDelay: 0.03,
						wet: 0.35
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 1.2,
						depth: 0.3,
						delayTime: 2.5,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 2500,
						Q: 1.2,
						type: 'bandpass'
					}
				}
			}
		},
		timpani: {
			enabled: true,
			volume: 0.9,
			maxVoices: 2,
			useHighQuality: false, // Synth-only - no samples available
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 6.0,
						preDelay: 0.08,
						wet: 0.6
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.1,
						depth: 0.2,
						delayTime: 8.0,
						feedback: 0.02
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 800,
						Q: 0.5,
						type: 'highpass'
					}
				}
			}
		},
		xylophone: {
			enabled: true,
			volume: 0.8,
			maxVoices: 6,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 2.0,
						preDelay: 0.02,
						wet: 0.3
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 2.0,
						depth: 0.2,
						delayTime: 1.5,
						feedback: 0.05
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 8000,
						Q: 0.8,
						type: 'lowpass'
					}
				}
			}
		},
		vibraphone: {
			enabled: false,
			volume: 0.7,
			maxVoices: 4,
			useHighQuality: false, // Synth-only - no samples available
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 4.5,
						preDelay: 0.04,
						wet: 0.4
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 6.0,
						depth: 0.3,
						delayTime: 2.0,
						feedback: 0.08
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 4000,
						Q: 1.0,
						type: 'lowpass'
					}
				}
			}
		},
		gongs: {
			enabled: false,
			volume: 0.9,
			maxVoices: 2,
			useHighQuality: false, // Synth-only - no samples available
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 12.0,
						preDelay: 0.1,
						wet: 0.7
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.05,
						depth: 0.4,
						delayTime: 15.0,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 200,
						Q: 2.0,
						type: 'bandpass'
					}
				}
			}
		},
		leadSynth: {
			enabled: true,
			volume: 0.6,
			maxVoices: 4,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 1.5,
						preDelay: 0.02,
						wet: 0.2
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 1.5,
						depth: 0.3,
						delayTime: 3.0,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 2000,
						Q: 4.0,
						type: 'lowpass'
					}
				}
			}
		},
		bassSynth: {
			enabled: true,
			volume: 0.8,
			maxVoices: 2,
			effects: {
				reverb: {
					enabled: false,
					params: {
						decay: 1.0,
						preDelay: 0.01,
						wet: 0.1
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.8,
						depth: 0.2,
						delayTime: 4.0,
						feedback: 0.05
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 300,
						Q: 1.5,
						type: 'lowpass'
					}
				}
			}
		},
		arpSynth: {
			enabled: false,
			volume: 0.6,
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
					enabled: true,
					params: {
						frequency: 2.0,
						depth: 0.2,
						delayTime: 2.0,
						feedback: 0.06
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 3000,
						Q: 1.2,
						type: 'lowpass'
					}
				}
			}
		},
		// Phase 8B: Environmental & Natural Sounds
		whaleHumpback: {
			enabled: true,
			volume: 0.7,
			maxVoices: 4,
			useHighQuality: false, // This is synthesis, not recordings
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 8.0,
						preDelay: 0.15,
						wet: 0.85
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.1,
						depth: 0.8,
						delayTime: 12.0,
						feedback: 0.15
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 800,
						Q: 0.4,
						type: 'lowpass'
					}
				}
			}
		},
		// High-quality whale species (disabled by default, only available in high-quality mode)
		whaleBlue: {
			enabled: false,
			volume: 0.8,
			maxVoices: 1,
			useHighQuality: false, // Default to synthesis (user can switch to recordings)
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 12.0,
						preDelay: 0.2,
						wet: 0.9
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.05,
						depth: 0.3,
						delayTime: 8.0,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 100,
						Q: 0.3,
						type: 'lowpass'
					}
				}
			}
		},
		whaleOrca: {
			enabled: false,
			volume: 0.7,
			maxVoices: 2,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 6.0,
						preDelay: 0.1,
						wet: 0.7
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.2,
						depth: 0.4,
						delayTime: 6.0,
						feedback: 0.08
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 8000,
						Q: 0.5,
						type: 'lowpass'
					}
				}
			}
		},
		whaleGray: {
			enabled: false,
			volume: 0.6,
			maxVoices: 1,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 10.0,
						preDelay: 0.18,
						wet: 0.8
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.08,
						depth: 0.6,
						delayTime: 10.0,
						feedback: 0.12
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 1200,
						Q: 0.4,
						type: 'lowpass'
					}
				}
			}
		},
		whaleSperm: {
			enabled: false,
			volume: 0.7,
			maxVoices: 1,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 5.0,
						preDelay: 0.08,
						wet: 0.6
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.3,
						depth: 0.2,
						delayTime: 4.0,
						feedback: 0.05
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 15000,
						Q: 0.6,
						type: 'lowpass'
					}
				}
			}
		},
		whaleMinke: {
			enabled: false,
			volume: 0.6,
			maxVoices: 1,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 9.0,
						preDelay: 0.12,
						wet: 0.75
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.06,
						depth: 0.5,
						delayTime: 8.0,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 150,
						Q: 0.3,
						type: 'lowpass'
					}
				}
			}
		},
		whaleFin: {
			enabled: false,
			volume: 0.8,
			maxVoices: 1,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 11.0,
						preDelay: 0.16,
						wet: 0.85
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.04,
						depth: 0.7,
						delayTime: 14.0,
						feedback: 0.12
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 80,
						Q: 0.2,
						type: 'lowpass'
					}
				}
			}
		},
		whaleRight: {
			enabled: false,
			volume: 0.7,
			maxVoices: 1,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 7.0,
						preDelay: 0.14,
						wet: 0.8
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.12,
						depth: 0.6,
						delayTime: 9.0,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 600,
						Q: 0.4,
						type: 'lowpass'
					}
				}
			}
		},
		whaleSei: {
			enabled: false,
			volume: 0.6,
			maxVoices: 1,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 8.5,
						preDelay: 0.13,
						wet: 0.75
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.1,
						depth: 0.5,
						delayTime: 7.0,
						feedback: 0.08
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 500,
						Q: 0.35,
						type: 'lowpass'
					}
				}
			}
		},
		whalePilot: {
			enabled: false,
			volume: 0.7,
			maxVoices: 2,
			useHighQuality: false, // Default to synthesis
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 6.5,
						preDelay: 0.1,
						wet: 0.7
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.15,
						depth: 0.4,
						delayTime: 5.0,
						feedback: 0.07
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 6000,
						Q: 0.5,
						type: 'lowpass'
					}
				}
			}
		}
	},
	voiceAssignmentStrategy: 'frequency',

	// Phase 7.1: Freesound API integration defaults
	freesoundApiKey: '',
	enableFreesoundSamples: false,

	// Phase 3: Performance Mode Settings
	performanceMode: {
		mode: 'medium',
		enableFrequencyDetuning: true,
		maxConcurrentVoices: 32,
		processingQuality: 'balanced',
		enableAudioOptimizations: true
	},
	
	// Phase 3.5: Enhanced Effect Routing (disabled by default for backward compatibility)
	enhancedRouting: {
		enabled: false,
		effectChains: new Map(),
		routingMatrix: {
			sends: new Map(),
			returns: new Map(),
			groups: new Map(),
			masterEffects: {
				reverb: {
					enabled: false,
					roomSize: 0.8,
					damping: 0.5,
					params: {
						decay: 3.0,
						preDelay: 0.05,
						wet: 0.3
					}
				},
				eq: {
					enabled: false,
					params: {
						lowGain: 0,
						midGain: 0,
						highGain: 0,
						lowFreq: 100,
						midFreq: 1000,
						highFreq: 8000
					}
				},
				compressor: {
					enabled: false,
					params: {
						threshold: -18,
						ratio: 4,
						attack: 0.003,
						release: 0.1,
						makeupGain: 2
					}
				},
				limiter: {
					enabled: false,
					params: {
						threshold: -0.5,
						lookAhead: 0.005,
						release: 0.01
					}
				},
				enabled: false
			},
			automations: []
		},
		version: '3.5.0'
	},

	// Phase 5.1: Default cluster audio settings (disabled by default)
	clusterAudio: {
		enabled: false,
		globalVolume: 0.3,
		clusterTypeEnabled: {
			'tag-based': true,
			'folder-based': true,
			'link-dense': true,
			'temporal': true,
			'community': true
		},
		clusterTypeVolumes: {
			'tag-based': 0.6,
			'folder-based': 0.7,
			'link-dense': 0.5,
			'temporal': 0.6,
			'community': 0.8
		},
		transitionsEnabled: true,
		transitionVolume: 0.4,
		transitionSpeed: 1.0,
		realTimeUpdates: true,
		strengthModulation: true,
		strengthSensitivity: 1.0,
		spatialAudio: true,
		maxSimultaneousClusters: 5,
		updateThrottleMs: 200
	},

	// Phase 5.2: Default hub orchestration settings (disabled by default)
	hubOrchestration: {
		enabled: false,
		hubThreshold: 0.6, // Nodes with composite score > 0.6 are hubs
		prominenceMultiplier: 2.0, // Hubs are 2x louder in balanced mode
		orchestrationMode: 'balanced',
		transitionsEnabled: true,
		centralityWeights: {
			degree: 0.3, // Basic connectivity
			betweenness: 0.3, // Bridge importance
			eigenvector: 0.2, // Network influence
			pageRank: 0.2 // Authority score
		},
		hubInstrumentPreference: ['piano', 'trumpet', 'violin', 'lead-synth']
	},

	// Phase 6.1: Default musical theory settings (disabled by default)
	musicalTheory: {
		enabled: false,
		scale: 'major', // Start with C major
		rootNote: 'C',
		enforceHarmony: true, // Constrain notes to scale
		allowChromaticPassing: false, // No chromatic notes by default
		dissonanceThreshold: 0.3, // Low dissonance tolerance
		quantizationStrength: 0.8, // Strong quantization to scale
		preferredChordProgression: 'I-IV-V-I', // Classic progression
		dynamicScaleModulation: false // Static scale by default
	},

	// Phase 6.2: Default dynamic orchestration settings (disabled by default)
	dynamicOrchestration: {
		enabled: false,
		customThresholds: false, // Use default thresholds
		temporalInfluenceEnabled: true, // Time-of-day and seasonal effects
		timeOfDayInfluence: 0.5, // Moderate time-of-day influence
		seasonalInfluence: 0.3, // Subtle seasonal influence
		transitionDuration: 3.0, // 3 second transitions
		autoAdjust: true // Automatically adjust to vault changes
	},

	// Phase 6.3: Default spatial audio settings (disabled by default)
	spatialAudio: {
		enabled: false,
		mode: PanningMode.Hybrid,
		graphPositionSettings: {
			curve: PanningCurve.Sigmoid,
			intensity: 0.7, // 70% pan intensity
			smoothingFactor: 0.5, // Moderate smoothing
			updateThrottleMs: 100 // Update every 100ms
		},
		folderSettings: {
			enabled: true,
			customMappings: [
				{ folderPath: 'Projects', panPosition: 0.5, priority: 1 },
				{ folderPath: 'Journal', panPosition: -0.5, priority: 1 },
				{ folderPath: 'Archive', panPosition: -0.8, priority: 2 },
				{ folderPath: 'Research', panPosition: 0.3, priority: 1 },
				{ folderPath: 'Ideas', panPosition: -0.3, priority: 1 },
				{ folderPath: 'Notes', panPosition: 0.0, priority: 0 }
			],
			autoDetectTopLevel: true,
			spreadFactor: 0.3 // 30% variation
		},
		clusterSettings: {
			enabled: true,
			useCentroid: true,
			individualSpread: 0.2, // 20% node variation
			clusterSeparation: 0.5 // Moderate cluster separation
		},
		hybridWeights: {
			graphPosition: 0.5, // 50% graph position
			folderBased: 0.3, // 30% folder
			clusterBased: 0.2 // 20% cluster
		},
		advanced: {
			enableDepthMapping: false, // Future feature
			depthInfluence: 0.3,
			boundaryPadding: 0.1, // 10% padding from extremes
			velocityDamping: true,
			dampingFactor: 0.7 // Strong damping
		}
	},

	// Phase 5.3: Default community detection audio settings (disabled by default)
	communityDetection: {
		enabled: false,
		largeCommunitySizeThreshold: 15,
		hierarchyAnalysis: true,
		hierarchyContainmentThreshold: 0.7,
		themeIntensity: 1.0,
		communityTypeEnabled: {
			'large-stable': true,
			'small-dynamic': true,
			'bridge': true,
			'isolated': true,
			'hierarchical': true
		},
		communityTypeVolumes: {
			'large-stable': 0.8,
			'small-dynamic': 0.6,
			'bridge': 0.7,
			'isolated': 0.5,
			'hierarchical': 0.75
		},
		spatialAudio: true,
		spatialWidth: 0.8
	},

	// Phase 5.3: Default community evolution audio settings (disabled by default)
	communityEvolution: {
		enabled: false,
		growthThreshold: 0.3,
		declineThreshold: 0.3,
		eventAudioEnabled: true,
		enabledEventTypes: {
			'merge': true,
			'split': true,
			'growth': true,
			'decline': true,
			'bridging': true,
			'formation': true,
			'dissolution': true
		},
		eventVolumes: {
			'merge': 0.7,
			'split': 0.6,
			'growth': 0.5,
			'decline': 0.5,
			'bridging': 0.6,
			'formation': 0.65,
			'dissolution': 0.65
		},
		eventThrottleMs: 500
	}
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

export const INSTRUMENT_FAMILIES = {
	keyboard: ['piano', 'organ', 'electricPiano', 'harpsichord', 'accordion', 'celesta'],
	strings: ['strings', 'violin', 'cello', 'contrabass', 'guitar', 'guitarElectric', 'guitarNylon', 'bassElectric', 'harp'],
	woodwinds: ['flute', 'clarinet', 'saxophone', 'bassoon', 'oboe'],
	brass: ['trumpet', 'frenchHorn', 'trombone', 'tuba'],

	percussion: ['timpani', 'xylophone', 'vibraphone', 'gongs'],
	electronic: ['leadSynth', 'bassSynth', 'arpSynth'],
	experimental: ['whaleHumpback', 'whaleBlue', 'whaleOrca', 'whaleGray', 'whaleSperm', 'whaleMinke', 'whaleFin', 'whaleRight', 'whaleSei', 'whalePilot'],
	pads: ['pad']
} as const;

export function isValidInstrumentKey(key: string): key is InstrumentKey {
	return key in DEFAULT_SETTINGS.instruments;
}

export function getAllInstrumentKeys(): InstrumentKey[] {
	return Object.keys(DEFAULT_SETTINGS.instruments) as InstrumentKey[];
}

export function getInstrumentFamily(instrumentKey: InstrumentKey): keyof typeof INSTRUMENT_FAMILIES | null {
	for (const [family, instruments] of Object.entries(INSTRUMENT_FAMILIES)) {
		if ((instruments as readonly string[]).includes(instrumentKey)) {
			return family as keyof typeof INSTRUMENT_FAMILIES;
		}
	}
	return null;
}

export function validateInstrumentSettings(settings: any): settings is Record<InstrumentKey, InstrumentSettings> {
	const requiredKeys = getAllInstrumentKeys();
	const providedKeys = Object.keys(settings);
	
	const missingKeys = requiredKeys.filter(key => !providedKeys.includes(key));
	const extraKeys = providedKeys.filter(key => !isValidInstrumentKey(key));
	
	if (missingKeys.length > 0) {
		console.warn('Missing instrument settings for:', missingKeys);
		return false;
	}
	
	if (extraKeys.length > 0) {
		console.warn('Unknown instrument keys found:', extraKeys);
	}
	
	return true;
}

export const INSTRUMENT_INFO = {
	piano: {
		name: 'Piano',
		icon: '🎹',
		description: 'Triangle waves with quick attack/decay for percussive clarity',
		defaultFrequencyRange: 'Very High (>1400Hz)'
	},
	organ: {
		name: 'Organ', 
		icon: '🎛️',
		description: 'FM synthesis with chorus effect for rich, sustained tones',
		defaultFrequencyRange: 'Medium (400-800Hz)'
	},
	strings: {
		name: 'String ensemble',
		icon: '🎻',
		description: 'AM synthesis with filtering for warm, flowing sounds',
		defaultFrequencyRange: 'Very Low (<200Hz)'
	},

	flute: {
		name: 'Flute',
		icon: '🎺',
		description: 'Pure sine waves with breath noise for airy, crystalline tones',
		defaultFrequencyRange: 'Ultra High (>1600Hz)'
	},
	clarinet: {
		name: 'Clarinet',
		icon: '🎵',
		description: 'Square wave harmonics for warm, hollow woodwind character',
		defaultFrequencyRange: 'High-Mid (800-1200Hz)'
	},
	saxophone: {
		name: 'Saxophone',
		icon: '🎷',
		description: 'Sawtooth waves with reedy harmonics for rich, expressive tone',
		defaultFrequencyRange: 'Mid (300-600Hz)'
	},
	// Phase 6B: Extended Keyboard Family
	electricPiano: {
		name: 'Electric piano',
		icon: '🎹',
		description: 'AM synthesis with tremolo for vintage Rhodes/Wurlitzer character',
		defaultFrequencyRange: 'Mid-Low (200-400Hz)'
	},
	harpsichord: {
		name: 'Harpsichord',
		icon: '🎼',
		description: 'Sharp envelope with filtering for baroque plucked attack',
		defaultFrequencyRange: 'Low-Mid (300-600Hz)'
	},
	accordion: {
		name: 'Accordion',
		icon: '🪗',
		description: 'AM synthesis with vibrato for bellows breath simulation',
		defaultFrequencyRange: 'Mid (400-800Hz)'
	},
	celesta: {
		name: 'Celesta',
		icon: '🔔',
		description: 'Triangle waves with decay for bell-like ethereal tones',
		defaultFrequencyRange: 'Very High (1400-1600Hz)'
	},
	// Phase 7: Strings & Brass Completion
	violin: {
		name: 'Violin',
		icon: '🎻',
		description: 'Sawtooth waves with filter sweeps and vibrato for expressive bowing',
		defaultFrequencyRange: 'High-Mid (800-1200Hz)'
	},
	cello: {
		name: 'Cello',
		icon: '🎻',
		description: 'Complex harmonics with bow noise for rich low register character',
		defaultFrequencyRange: 'Mid-Low (200-400Hz)'
	},
	contrabass: {
		name: 'Contrabass',
		icon: '🎻',
		description: 'Deep string foundation with rich low harmonics and bow articulation',
		defaultFrequencyRange: 'Very Low (<100Hz)'
	},
	guitar: {
		name: 'Guitar (acoustic)',
		icon: '🎸',
		description: 'Karplus-Strong synthesis for authentic plucked string physics',
		defaultFrequencyRange: 'Mid-High (600-1000Hz)'
	},
	guitarElectric: {
		name: 'Guitar (electric)',
		icon: '🎸',
		description: 'Amplified electric guitar with pickup simulation and effects processing',
		defaultFrequencyRange: 'High (1000-1400Hz)'
	},
	guitarNylon: {
		name: 'Guitar (nylon)',
		icon: '🎸',
		description: 'Classical nylon-string guitar with warm, mellow fingerpicked tones',
		defaultFrequencyRange: 'Mid-High (600-1000Hz)'
	},
	bassElectric: {
		name: 'Electric bass',
		icon: '🎸',
		description: 'Electric bass guitar with deep fundamentals and punchy attack',
		defaultFrequencyRange: 'Low (100-200Hz)'
	},
	harp: {
		name: 'Harp',
		icon: '🪄',
		description: 'Sharp pluck envelope with long decay for cascading arpeggios',
		defaultFrequencyRange: 'Low (100-200Hz)'
	},
	trumpet: {
		name: 'Trumpet',
		icon: '🎺',
		description: 'Square waves with brass formants for bright metallic timbre',
		defaultFrequencyRange: 'Low-Mid (300-600Hz)'
	},
	frenchHorn: {
		name: 'French horn',
		icon: '🎯',
		description: 'Sine waves with slight distortion for warm middle register',
		defaultFrequencyRange: 'Mid (400-800Hz)'
	},
	trombone: {
		name: 'Trombone',
		icon: '🎺',
		description: 'Sawtooth waves with portamento for characteristic sliding pitch',
		defaultFrequencyRange: 'Mid-Low (200-400Hz)'
	},
	tuba: {
		name: 'Tuba',
		icon: '🎺',
		description: 'Sub-bass frequencies with breath noise for deep foundation',
		defaultFrequencyRange: 'Very Low (<100Hz)'
	},
	// Phase 8: Percussion & Electronic Finale
	bassoon: {
		name: 'Bassoon',
		icon: '🎵',
		description: 'Deep woodwind with rich double reed harmonics and warm low register',
		defaultFrequencyRange: 'Low-Mid (200-400Hz)'
	},
	oboe: {
		name: 'Oboe',
		icon: '🎼',
		description: 'Nasal quality with double reed simulation and formant filtering',
		defaultFrequencyRange: 'High-Mid (800-1200Hz)'
	},
	timpani: {
		name: 'Timpani',
		icon: '🥁',
		description: 'Tuned drums with pitch bending and hall acoustics',
		defaultFrequencyRange: 'Low (100-200Hz)'
	},
	xylophone: {
		name: 'Xylophone',
		icon: '🎵',
		description: 'Bright mallet percussion with wooden resonance',
		defaultFrequencyRange: 'Very High (1400-1600Hz)'
	},
	vibraphone: {
		name: 'Vibraphone',
		icon: '🎼',
		description: 'Metallic shimmer with tremolo motor and long sustain',
		defaultFrequencyRange: 'High (1000-1400Hz)'
	},
	gongs: {
		name: 'Gongs',
		icon: '🥁',
		description: 'Sustained crash with metallic resonance and massive reverb',
		defaultFrequencyRange: 'Very Low (<100Hz)'
	},
	leadSynth: {
		name: 'Lead synth',
		icon: '🎛️',
		description: 'Cutting synth lead with filter modulation and resonance',
		defaultFrequencyRange: 'Variable (200-8000Hz)'
	},
	bassSynth: {
		name: 'Bass synth',
		icon: '🎛️',
		description: 'Electronic foundation with sub-oscillator and tight filtering',
		defaultFrequencyRange: 'Low (100-200Hz)'
	},
	arpSynth: {
		name: 'Arp synth',
		icon: '🎛️',
		description: 'Sequenced patterns with graph-sync capability and delay',
		defaultFrequencyRange: 'Variable (Pattern-dependent)'
	},

	// Phase 8B: Environmental & Natural Sounds
	whaleHumpback: {
		name: 'Humpback whale (synthesis)',
		icon: '🐋',
		description: 'Synthesized whale-like sounds with oceanic processing and deep resonance',
		defaultFrequencyRange: 'Low-Mid (20-1000Hz)'
	},
	// High-quality whale species (real NOAA recordings, only available in high-quality mode)
	whaleBlue: {
		name: 'Blue whale',
		icon: '🐋',
		description: 'Authentic blue whale infrasonic calls from NOAA hydrophone recordings',
		defaultFrequencyRange: 'Infrasonic (10-40Hz)'
	},
	whaleOrca: {
		name: 'Orca whale',
		icon: '🐋',
		description: 'Authentic orca pod communications with clicks and calls',
		defaultFrequencyRange: 'Wide Spectrum (500-25000Hz)'
	},
	whaleGray: {
		name: 'Gray whale',
		icon: '🐋',
		description: 'Authentic gray whale migration calls from oceanic soundscape recordings',
		defaultFrequencyRange: 'Low-Mid (100-2000Hz)'
	},
	whaleSperm: {
		name: 'Sperm whale',
		icon: '🐋',
		description: 'Authentic sperm whale echolocation clicks from deep-sea recordings',
		defaultFrequencyRange: 'Ultra-Wide (100-30000Hz)'
	},
	whaleMinke: {
		name: 'Minke whale',
		icon: '🐋',
		description: 'Authentic Atlantic minke whale downsweeps from NOAA PMEL recordings',
		defaultFrequencyRange: 'Infrasonic (35-50Hz)'
	},
	whaleFin: {
		name: 'Fin whale',
		icon: '🐋',
		description: 'Authentic fin whale pulse sequences from NOAA Pennsylvania Group',
		defaultFrequencyRange: 'Infrasonic (15-30Hz)'
	},
	whaleRight: {
		name: 'Right whale',
		icon: '🐋',
		description: 'Authentic North Atlantic right whale upcalls from NOAA Fisheries',
		defaultFrequencyRange: 'Low-Mid (50-500Hz)'
	},
	whaleSei: {
		name: 'Sei whale',
		icon: '🐋',
		description: 'Authentic sei whale downsweeps from NOAA Pennsylvania Group',
		defaultFrequencyRange: 'Mid (200-600Hz)'
	},
	whalePilot: {
		name: 'Pilot whale',
		icon: '🐋',
		description: 'Authentic pilot whale multi-sound communications from NOAA Fisheries',
		defaultFrequencyRange: 'Wide (300-8000Hz)'
	}
};

// Effect Presets System
export interface EffectPreset {
	name: string;
	description: string;
	category: 'venue' | 'genre' | 'instrument' | 'custom';
	effects: {
		reverb: ReverbSettings;
		chorus: ChorusSettings;
		filter: FilterSettings;
	};
}

export const EFFECT_PRESETS: { [key: string]: EffectPreset } = {
	// Venue-based presets
	'concert-hall': {
		name: 'Concert Hall',
		description: 'Large reverberant space with natural acoustics',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 3.5, preDelay: 0.08, wet: 0.6 } },
			chorus: { enabled: false, params: { frequency: 0.5, depth: 0.3, delayTime: 3.0, feedback: 0.03 } },
			filter: { enabled: true, params: { frequency: 6000, Q: 0.5, type: 'lowpass' } }
		}
	},
	'cathedral': {
		name: 'Cathedral',
		description: 'Massive stone space with long, ethereal reverb',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 8.0, preDelay: 0.15, wet: 0.8 } },
			chorus: { enabled: true, params: { frequency: 0.3, depth: 0.4, delayTime: 6.0, feedback: 0.08 } },
			filter: { enabled: true, params: { frequency: 4000, Q: 0.6, type: 'lowpass' } }
		}
	},
	'studio': {
		name: 'Studio',
		description: 'Clean, controlled recording environment',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 1.2, preDelay: 0.01, wet: 0.25 } },
			chorus: { enabled: false, params: { frequency: 0.8, depth: 0.2, delayTime: 2.0, feedback: 0.02 } },
			filter: { enabled: false, params: { frequency: 8000, Q: 0.7, type: 'lowpass' } }
		}
	},
	'jazz-club': {
		name: 'Jazz Club',
		description: 'Intimate, warm venue with subtle ambience',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 2.0, preDelay: 0.03, wet: 0.35 } },
			chorus: { enabled: true, params: { frequency: 0.6, depth: 0.3, delayTime: 3.5, feedback: 0.05 } },
			filter: { enabled: true, params: { frequency: 5000, Q: 0.8, type: 'lowpass' } }
		}
	},
	'arena': {
		name: 'Arena',
		description: 'Large venue with powerful, booming acoustics',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 4.5, preDelay: 0.12, wet: 0.7 } },
			chorus: { enabled: true, params: { frequency: 0.4, depth: 0.5, delayTime: 4.0, feedback: 0.06 } },
			filter: { enabled: true, params: { frequency: 3500, Q: 1.0, type: 'lowpass' } }
		}
	},

	// Genre-based presets
	'ambient': {
		name: 'Ambient',
		description: 'Spacious, ethereal soundscape',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 6.0, preDelay: 0.10, wet: 0.75 } },
			chorus: { enabled: true, params: { frequency: 0.2, depth: 0.6, delayTime: 8.0, feedback: 0.1 } },
			filter: { enabled: true, params: { frequency: 2500, Q: 1.2, type: 'lowpass' } }
		}
	},
	'classical': {
		name: 'Classical',
		description: 'Natural, balanced orchestral sound',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 2.8, preDelay: 0.06, wet: 0.5 } },
			chorus: { enabled: false, params: { frequency: 0.5, depth: 0.3, delayTime: 3.0, feedback: 0.03 } },
			filter: { enabled: true, params: { frequency: 7000, Q: 0.6, type: 'lowpass' } }
		}
	},
	'electronic': {
		name: 'Electronic',
		description: 'Clean, precise digital processing',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 1.5, preDelay: 0.02, wet: 0.3 } },
			chorus: { enabled: true, params: { frequency: 1.2, depth: 0.4, delayTime: 2.5, feedback: 0.04 } },
			filter: { enabled: true, params: { frequency: 8000, Q: 1.5, type: 'lowpass' } }
		}
	},
	'cinematic': {
		name: 'Cinematic',
		description: 'Epic, dramatic film score atmosphere',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 5.0, preDelay: 0.09, wet: 0.65 } },
			chorus: { enabled: true, params: { frequency: 0.3, depth: 0.5, delayTime: 5.0, feedback: 0.07 } },
			filter: { enabled: true, params: { frequency: 4500, Q: 0.9, type: 'lowpass' } }
		}
	},

	// Special presets
	'dry': {
		name: 'Dry',
		description: 'Minimal effects for clarity',
		category: 'instrument',
		effects: {
			reverb: { enabled: false, params: { decay: 1.0, preDelay: 0.01, wet: 0.1 } },
			chorus: { enabled: false, params: { frequency: 0.5, depth: 0.2, delayTime: 2.0, feedback: 0.02 } },
			filter: { enabled: false, params: { frequency: 8000, Q: 0.7, type: 'lowpass' } }
		}
	},
	'lush': {
		name: 'Lush',
		description: 'Rich, full processing with all effects',
		category: 'instrument',
		effects: {
			reverb: { enabled: true, params: { decay: 4.0, preDelay: 0.07, wet: 0.6 } },
			chorus: { enabled: true, params: { frequency: 0.5, depth: 0.5, delayTime: 4.0, feedback: 0.06 } },
			filter: { enabled: true, params: { frequency: 6000, Q: 0.8, type: 'lowpass' } }
		}
	}
};

// Smart Parameter Ranges System
export interface ParameterRange {
	min: number;
	max: number;
	step: number;
	defaultValue: number;
	musicalContext: string;
	suggestions?: { value: number; label: string }[];
}

export interface SmartRanges {
	reverb: {
		decay: ParameterRange;
		preDelay: ParameterRange;
		wet: ParameterRange;
	};
	chorus: {
		frequency: ParameterRange;
		depth: ParameterRange;
		delayTime: ParameterRange;
		feedback: ParameterRange;
	};
	filter: {
		frequency: ParameterRange;
		Q: ParameterRange;
	};
}

// Instrument-specific smart parameter ranges
export const INSTRUMENT_SMART_RANGES: { [instrument: string]: SmartRanges } = {
	piano: {
		reverb: {
			decay: {
				min: 0.5, max: 6.0, step: 0.1, defaultValue: 1.8,
				musicalContext: 'Piano benefits from shorter, cleaner reverb tails',
				suggestions: [
					{ value: 1.2, label: 'Intimate' },
					{ value: 1.8, label: 'Studio' },
					{ value: 3.0, label: 'Concert Hall' }
				]
			},
			preDelay: {
				min: 0.005, max: 0.08, step: 0.005, defaultValue: 0.02,
				musicalContext: 'Short pre-delay maintains piano clarity and attack'
			},
			wet: {
				min: 0.1, max: 0.6, step: 0.05, defaultValue: 0.25,
				musicalContext: 'Moderate reverb preserves piano definition'
			}
		},
		chorus: {
			frequency: {
				min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Subtle modulation enhances piano warmth without wobble'
			},
			depth: {
				min: 0.1, max: 0.6, step: 0.05, defaultValue: 0.3,
				musicalContext: 'Light chorus depth maintains piano naturalness'
			},
			delayTime: {
				min: 2.0, max: 8.0, step: 0.5, defaultValue: 4.0,
				musicalContext: 'Medium delay times work best for piano chorus'
			},
			feedback: {
				min: 0.01, max: 0.15, step: 0.01, defaultValue: 0.05,
				musicalContext: 'Low feedback prevents chorus from overwhelming piano tone'
			}
		},
		filter: {
			frequency: {
				min: 2000, max: 8000, step: 100, defaultValue: 3500,
				musicalContext: 'Piano harmonics extend well into higher frequencies',
				suggestions: [
					{ value: 2500, label: 'Warm' },
					{ value: 3500, label: 'Natural' },
					{ value: 5000, label: 'Bright' }
				]
			},
			Q: {
				min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Moderate Q maintains piano frequency balance'
			}
		}
	},
	strings: {
		reverb: {
			decay: {
				min: 1.5, max: 10.0, step: 0.2, defaultValue: 2.8,
				musicalContext: 'Strings thrive with longer, lush reverb tails',
				suggestions: [
					{ value: 2.0, label: 'Chamber' },
					{ value: 2.8, label: 'Orchestral' },
					{ value: 5.0, label: 'Cathedral' }
				]
			},
			preDelay: {
				min: 0.02, max: 0.12, step: 0.01, defaultValue: 0.04,
				musicalContext: 'Longer pre-delay creates spacious string sections'
			},
			wet: {
				min: 0.2, max: 0.8, step: 0.05, defaultValue: 0.45,
				musicalContext: 'Strings can handle more reverb for lush soundscapes'
			}
		},
		chorus: {
			frequency: {
				min: 0.2, max: 1.2, step: 0.05, defaultValue: 0.6,
				musicalContext: 'Slower modulation creates organic string ensemble feel'
			},
			depth: {
				min: 0.1, max: 0.5, step: 0.05, defaultValue: 0.3,
				musicalContext: 'Gentle chorus depth adds string section width'
			},
			delayTime: {
				min: 2.0, max: 6.0, step: 0.5, defaultValue: 3.0,
				musicalContext: 'Shorter delays work better for string textures'
			},
			feedback: {
				min: 0.01, max: 0.08, step: 0.01, defaultValue: 0.03,
				musicalContext: 'Minimal feedback prevents string muddiness'
			}
		},
		filter: {
			frequency: {
				min: 1500, max: 6000, step: 100, defaultValue: 3500,
				musicalContext: 'String frequencies focus in the mid-high range',
				suggestions: [
					{ value: 2000, label: 'Mellow' },
					{ value: 3500, label: 'Balanced' },
					{ value: 4500, label: 'Articulate' }
				]
			},
			Q: {
				min: 0.4, max: 1.5, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Gentle filtering preserves string harmonic richness'
			}
		}
	},
	organ: {
		reverb: {
			decay: {
				min: 2.0, max: 12.0, step: 0.3, defaultValue: 2.2,
				musicalContext: 'Organ reverb simulates large church acoustics',
				suggestions: [
					{ value: 2.2, label: 'Chapel' },
					{ value: 4.0, label: 'Church' },
					{ value: 8.0, label: 'Cathedral' }
				]
			},
			preDelay: {
				min: 0.02, max: 0.15, step: 0.01, defaultValue: 0.03,
				musicalContext: 'Organ pre-delay mimics architectural space'
			},
			wet: {
				min: 0.3, max: 0.9, step: 0.05, defaultValue: 0.35,
				musicalContext: 'Organ traditionally played in reverberant spaces'
			}
		},
		chorus: {
			frequency: {
				min: 0.2, max: 1.5, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Classic organ chorus creates that Hammond-style swirl'
			},
			depth: {
				min: 0.2, max: 0.8, step: 0.05, defaultValue: 0.5,
				musicalContext: 'Rich chorus depth for classic organ character'
			},
			delayTime: {
				min: 3.0, max: 8.0, step: 0.5, defaultValue: 4.0,
				musicalContext: 'Medium-long delays for organ chorus character'
			},
			feedback: {
				min: 0.02, max: 0.12, step: 0.01, defaultValue: 0.05,
				musicalContext: 'Moderate feedback for organ warmth without mud'
			}
		},
		filter: {
			frequency: {
				min: 2000, max: 8000, step: 150, defaultValue: 4000,
				musicalContext: 'Organ harmonics are rich and extend high',
				suggestions: [
					{ value: 3000, label: 'Warm' },
					{ value: 4000, label: 'Classic' },
					{ value: 6000, label: 'Bright' }
				]
			},
			Q: {
				min: 0.3, max: 1.2, step: 0.1, defaultValue: 0.6,
				musicalContext: 'Gentle Q maintains organ harmonic complexity'
			}
		}
	},
	flute: {
		reverb: {
			decay: {
				min: 1.0, max: 8.0, step: 0.2, defaultValue: 2.2,
				musicalContext: 'Flute needs airy, light reverb for natural sound',
				suggestions: [
					{ value: 1.5, label: 'Intimate' },
					{ value: 2.2, label: 'Recital Hall' },
					{ value: 4.0, label: 'Concert Hall' }
				]
			},
			preDelay: {
				min: 0.005, max: 0.06, step: 0.005, defaultValue: 0.02,
				musicalContext: 'Short pre-delay preserves flute attack and breath'
			},
			wet: {
				min: 0.15, max: 0.65, step: 0.05, defaultValue: 0.4,
				musicalContext: 'Moderate reverb enhances flute airiness'
			}
		},
		chorus: {
			frequency: {
				min: 0.4, max: 1.5, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Light, fast modulation for flute shimmer'
			},
			depth: {
				min: 0.05, max: 0.3, step: 0.05, defaultValue: 0.2,
				musicalContext: 'Subtle chorus preserves flute purity'
			},
			delayTime: {
				min: 1.5, max: 4.0, step: 0.5, defaultValue: 2.0,
				musicalContext: 'Short delays work best for wind instruments'
			},
			feedback: {
				min: 0.005, max: 0.05, step: 0.005, defaultValue: 0.02,
				musicalContext: 'Minimal feedback maintains flute clarity'
			}
		},
		filter: {
			frequency: {
				min: 3000, max: 12000, step: 200, defaultValue: 6000,
				musicalContext: 'Flute has strong high-frequency content and harmonics',
				suggestions: [
					{ value: 4000, label: 'Mellow' },
					{ value: 6000, label: 'Natural' },
					{ value: 8000, label: 'Brilliant' }
				]
			},
			Q: {
				min: 0.2, max: 1.0, step: 0.1, defaultValue: 0.5,
				musicalContext: 'Gentle filtering preserves flute breath and harmonics'
			}
		}
	}
};

// Universal smart ranges for instruments not specifically defined
export const DEFAULT_SMART_RANGES: SmartRanges = {
	reverb: {
		decay: {
			min: 0.5, max: 8.0, step: 0.2, defaultValue: 2.5,
			musicalContext: 'General purpose reverb settings'
		},
		preDelay: {
			min: 0.01, max: 0.1, step: 0.005, defaultValue: 0.03,
			musicalContext: 'Balanced pre-delay for most instruments'
		},
		wet: {
			min: 0.1, max: 0.7, step: 0.05, defaultValue: 0.4,
			musicalContext: 'Moderate reverb mix for versatility'
		}
	},
	chorus: {
		frequency: {
			min: 0.2, max: 2.0, step: 0.1, defaultValue: 0.6,
			musicalContext: 'Universal chorus modulation rate'
		},
		depth: {
			min: 0.1, max: 0.6, step: 0.05, defaultValue: 0.3,
			musicalContext: 'Balanced chorus intensity'
		},
		delayTime: {
			min: 2.0, max: 6.0, step: 0.5, defaultValue: 3.5,
			musicalContext: 'Medium delay for general chorus effect'
		},
		feedback: {
			min: 0.01, max: 0.1, step: 0.01, defaultValue: 0.04,
			musicalContext: 'Safe feedback levels for most applications'
		}
	},
	filter: {
		frequency: {
			min: 500, max: 10000, step: 100, defaultValue: 4000,
			musicalContext: 'Wide frequency range for various instruments'
		},
		Q: {
			min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8,
			musicalContext: 'Moderate Q factor for musical filtering'
		}
	}
};

// Utility function to get smart ranges for any instrument
export function getSmartRanges(instrumentName: string): SmartRanges {
	return INSTRUMENT_SMART_RANGES[instrumentName] || DEFAULT_SMART_RANGES;
}

// Utility function to get parameter range for a specific effect and parameter
export function getParameterRange(instrumentName: string, effectName: keyof SmartRanges, paramName: string): ParameterRange | null {
	const ranges = getSmartRanges(instrumentName);
	const effectRanges = ranges[effectName];
	
	if (effectRanges && paramName in effectRanges) {
		return effectRanges[paramName as keyof typeof effectRanges];
	}
	
	return null;
}

// Phase 3.5: Enhanced Effect Routing utility functions
export function createDefaultEffectChain(instrumentName: string): EffectChain {
	const instrumentSettings = DEFAULT_SETTINGS.instruments[instrumentName as keyof typeof DEFAULT_SETTINGS.instruments];
	
	const nodes: EffectNode[] = [
		{
			id: `${instrumentName}-reverb`,
			type: 'reverb',
			enabled: instrumentSettings.effects.reverb.enabled,
			order: 0,
			settings: instrumentSettings.effects.reverb,
			bypass: false
		},
		{
			id: `${instrumentName}-chorus`,
			type: 'chorus',
			enabled: instrumentSettings.effects.chorus.enabled,
			order: 1,
			settings: instrumentSettings.effects.chorus,
			bypass: false
		},
		{
			id: `${instrumentName}-filter`,
			type: 'filter',
			enabled: instrumentSettings.effects.filter.enabled,
			order: 2,
			settings: instrumentSettings.effects.filter,
			bypass: false
		}
	];
	
	return {
		instrumentName,
		routing: 'serial',
		nodes,
		sendLevels: new Map()
	};
}

export function createDefaultSendBus(id: string, name: string, type: 'reverb' | 'delay' | 'custom'): SendBus {
	return {
		id,
		name,
		type,
		effects: [],
		returnLevel: 0.5,
		prePost: 'post'
	};
}

export function createDefaultReturnBus(id: string, name: string): ReturnBus {
	return {
		id,
		name,
		inputLevel: 1.0,
		effects: [],
		panPosition: 0
	};
}

export function createDefaultInstrumentGroup(id: string, name: string, instruments: string[]): InstrumentGroup {
	return {
		id,
		name,
		instruments,
		groupEffects: [],
		groupVolume: 1.0,
		groupMute: false,
		groupSolo: false
	};
}

export function migrateToEnhancedRouting(settings: SonigraphSettings): SonigraphSettings {
	if (settings.enhancedRouting?.enabled) {
		return settings; // Already migrated
	}

	// Create effect chains from existing per-instrument settings
	const effectChains = new Map<string, EffectChain>();
	const instrumentNames = Object.keys(settings.instruments) as (keyof typeof settings.instruments)[];
	
	for (const instrumentName of instrumentNames) {
		effectChains.set(instrumentName, createDefaultEffectChain(instrumentName));
	}

	// Create default routing matrix
	const routingMatrix: RoutingMatrix = {
		sends: new Map(),
		returns: new Map(),
		groups: new Map(),
		masterEffects: DEFAULT_SETTINGS.enhancedRouting!.routingMatrix.masterEffects,
		automations: []
	};

	return {
		...settings,
		enhancedRouting: {
			enabled: false, // User must explicitly enable
			effectChains,
			routingMatrix,
			version: '3.5.0'
		}
	};
} 