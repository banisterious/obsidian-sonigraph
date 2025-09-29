import { GraphData, GraphNode, MusicalMapping, GraphStats, EnhancedGraphNode, AudioMappingConfig } from './types';
import { GraphNode as GDEGraphNode, GraphLink } from './GraphDataExtractor';
import { SonigraphSettings } from '../utils/constants';
import { MUSICAL_SCALES } from '../utils/constants';
import { getLogger } from '../logging';
import { App, TFile } from 'obsidian';
import {
    ObsidianMetadataMapper,
    MetadataMappingRules,
    VaultMappingOptimizer,
    InstrumentDistributor,
    MetadataListener,
    MetadataAnalysisResult,
    VaultMappingAnalysis
} from '../audio/mapping';
import { ClusterAudioMapper, ClusterAudioSettings } from '../audio/clustering';
import { Cluster, SmartClusteringAlgorithms } from './SmartClusteringAlgorithms';
import {
	DynamicOrchestrationManager,
	DynamicOrchestrationSettings
} from '../audio/orchestration';

const logger = getLogger('musical-mapper');

export class MusicalMapper {
	private settings: SonigraphSettings;
	private scale: number[] = [];
	private rootNoteFreq: number = 261.63; // C4 in Hz

	// Phase 2: Metadata-driven mapping components
	private app: App | null = null;
	private metadataMapper: ObsidianMetadataMapper | null = null;
	private mappingRules: MetadataMappingRules | null = null;
	private vaultOptimizer: VaultMappingOptimizer | null = null;
	private instrumentDistributor: InstrumentDistributor | null = null;
	private metadataListener: MetadataListener | null = null;
	private isPhase2Enabled = false;
	private lastVaultAnalysis: VaultMappingAnalysis | null = null;

	// Phase 5: Cluster-based audio mapping
	private clusterAudioMapper: ClusterAudioMapper | null = null;
	private isClusterAudioEnabled = false;

	// Phase 6.2: Dynamic orchestration
	private dynamicOrchestrationManager: DynamicOrchestrationManager | null = null;
	private isDynamicOrchestrationEnabled = false;

	constructor(settings: SonigraphSettings, app?: App) {
		this.settings = settings;
		this.app = app || null;
		this.updateMusicalParams();

		// Initialize Phase 2 components if app is provided
		if (this.app && this.settings.contentAwareMapping?.enabled) {
			this.initializePhase2Components();
		}

		// Initialize Phase 5 cluster audio if enabled
		if (this.settings.clusterAudio?.enabled) {
			this.initializeClusterAudio();
		}

		// Initialize Phase 6.2 dynamic orchestration if enabled
		if (this.settings.dynamicOrchestration?.enabled) {
			this.initializeDynamicOrchestration();
		}
	}

	updateSettings(settings: SonigraphSettings): void {
		this.settings = settings;
		this.updateMusicalParams();

		// Phase 2: Update metadata mapping components if enabled
		if (this.app && this.settings.contentAwareMapping?.enabled) {
			if (!this.isPhase2Enabled) {
				this.initializePhase2Components();
			} else {
				this.updatePhase2Components();
			}
		} else if (this.isPhase2Enabled) {
			this.disablePhase2Components();
		}

		// Phase 5: Update cluster audio components if enabled
		if (this.settings.clusterAudio?.enabled) {
			if (!this.isClusterAudioEnabled) {
				this.initializeClusterAudio();
			} else {
				this.updateClusterAudioSettings();
			}
		} else if (this.isClusterAudioEnabled) {
			this.disableClusterAudio();
		}

		// Phase 6.2: Update dynamic orchestration if enabled
		if (this.settings.dynamicOrchestration?.enabled) {
			if (!this.isDynamicOrchestrationEnabled) {
				this.initializeDynamicOrchestration();
			} else {
				this.updateDynamicOrchestrationSettings();
			}
		} else if (this.isDynamicOrchestrationEnabled) {
			this.disableDynamicOrchestration();
		}
	}

	/**
	 * Phase 2: Initialize metadata-driven mapping components
	 */
	private initializePhase2Components(): void {
		if (!this.app || this.isPhase2Enabled) return;

		logger.info('phase2-init', 'Initializing Phase 2 metadata-driven mapping components');

		try {
			// Initialize metadata mapper with audio mapping config
			const audioConfig: AudioMappingConfig = this.getAudioMappingConfig();
			this.metadataMapper = new ObsidianMetadataMapper(this.app, audioConfig);

			// Initialize mapping rules
			this.mappingRules = new MetadataMappingRules();

			// Initialize vault optimizer
			this.vaultOptimizer = new VaultMappingOptimizer(
				this.app, 
				this.metadataMapper, 
				this.mappingRules, 
				audioConfig
			);

			// Initialize instrument distributor
			this.instrumentDistributor = new InstrumentDistributor({
				maxClusterSize: 8,
				diversityWeight: 0.3,
				enableSpatialDistribution: true
			});

			// Initialize metadata listener
			this.metadataListener = new MetadataListener(
				this.app,
				this.metadataMapper,
				this.mappingRules,
				this.vaultOptimizer,
				{
					enableMetadataChanges: true,
					debounceDelay: 500,
					batchUpdateThreshold: 5
				}
			);

			// Start listening for metadata changes
			this.metadataListener.startListening();

			this.isPhase2Enabled = true;
			logger.info('phase2-enabled', 'Phase 2 metadata-driven mapping enabled successfully');

		} catch (error) {
			logger.error('phase2-init-error', 'Failed to initialize Phase 2 components', error as Error);
			this.disablePhase2Components();
		}
	}

	/**
	 * Phase 2: Update existing components with new settings
	 */
	private updatePhase2Components(): void {
		if (!this.isPhase2Enabled) return;

		logger.debug('phase2-update', 'Updating Phase 2 component configurations');

		try {
			const audioConfig = this.getAudioMappingConfig();

			// Update configurations
			this.metadataMapper?.updateConfig(audioConfig);
			this.vaultOptimizer?.updateConfig(audioConfig);

			logger.debug('phase2-updated', 'Phase 2 components updated successfully');

		} catch (error) {
			logger.error('phase2-update-error', 'Failed to update Phase 2 components', error as Error);
		}
	}

	/**
	 * Phase 2: Disable and cleanup metadata-driven mapping
	 */
	private disablePhase2Components(): void {
		if (!this.isPhase2Enabled) return;

		logger.info('phase2-disable', 'Disabling Phase 2 metadata-driven mapping');

		try {
			// Stop metadata listener
			this.metadataListener?.stopListening();

			// Clear references
			this.metadataMapper = null;
			this.mappingRules = null;
			this.vaultOptimizer = null;
			this.instrumentDistributor = null;
			this.metadataListener = null;
			this.lastVaultAnalysis = null;

			this.isPhase2Enabled = false;
			logger.info('phase2-disabled', 'Phase 2 components disabled and cleaned up');

		} catch (error) {
			logger.error('phase2-disable-error', 'Error during Phase 2 cleanup', error as Error);
		}
	}

	/**
	 * Phase 2: Extract audio mapping config from settings
	 */
	private getAudioMappingConfig(): AudioMappingConfig {
		return {
			contentAwareMapping: {
				enabled: this.settings.contentAwareMapping?.enabled || false,
				fileTypePreferences: this.settings.contentAwareMapping?.fileTypePreferences || {},
				tagMappings: this.settings.contentAwareMapping?.tagMappings || {},
				folderMappings: this.settings.contentAwareMapping?.folderMappings || {},
				connectionTypeMappings: this.settings.contentAwareMapping?.connectionTypeMappings || {}
			},
			continuousLayers: {
				enabled: false, // Phase 3 feature
				ambientDrone: null,
				rhythmicLayer: null,
				harmonicPad: null
			},
			musicalTheory: {
				scale: this.settings.scale,
				key: this.settings.rootNote,
				mode: 'major', // Default mode
				constrainToScale: true
			},
			externalServices: {
				freesoundApiKey: this.settings.freesoundApiKey || '',
				enableFreesoundSamples: false // Phase 7 feature
			}
		};
	}

	private updateMusicalParams(): void {
		// Set the musical scale
		this.scale = MUSICAL_SCALES[this.settings.scale as keyof typeof MUSICAL_SCALES] || MUSICAL_SCALES.major;
		
		// Set root note frequency
		this.rootNoteFreq = this.getRootNoteFrequency(this.settings.rootNote);
		
		logger.debug('params-update', 'Musical parameters updated', {
			scale: this.settings.scale,
			rootNote: this.settings.rootNote,
			rootFreq: this.rootNoteFreq,
			scaleNotes: this.scale.length
		});
	}

	/**
	 * Phase 5: Initialize cluster audio mapping components
	 */
	private async initializeClusterAudio(): Promise<void> {
		if (!this.settings.clusterAudio || this.isClusterAudioEnabled) return;

		logger.info('phase5-init', 'Initializing Phase 5 cluster audio mapping components');

		try {
			// Convert settings to ClusterAudioSettings
			const clusterAudioSettings: ClusterAudioSettings = {
				enabled: this.settings.clusterAudio.enabled,
				globalVolume: this.settings.clusterAudio.globalVolume,
				clusterTypeEnabled: this.settings.clusterAudio.clusterTypeEnabled,
				clusterTypeVolumes: this.settings.clusterAudio.clusterTypeVolumes,
				transitionsEnabled: this.settings.clusterAudio.transitionsEnabled,
				transitionVolume: this.settings.clusterAudio.transitionVolume,
				transitionSpeed: this.settings.clusterAudio.transitionSpeed,
				realTimeUpdates: this.settings.clusterAudio.realTimeUpdates,
				strengthModulation: this.settings.clusterAudio.strengthModulation,
				strengthSensitivity: this.settings.clusterAudio.strengthSensitivity,
				spatialAudio: this.settings.clusterAudio.spatialAudio,
				maxSimultaneousClusters: this.settings.clusterAudio.maxSimultaneousClusters,
				updateThrottleMs: this.settings.clusterAudio.updateThrottleMs
			};

			// Initialize cluster audio mapper
			this.clusterAudioMapper = new ClusterAudioMapper(clusterAudioSettings);
			await this.clusterAudioMapper.initialize();

			this.isClusterAudioEnabled = true;
			logger.info('phase5-init', 'Phase 5 cluster audio components initialized successfully');

		} catch (error) {
			logger.error('phase5-init-error', 'Error initializing Phase 5 cluster audio', error as Error);
			this.isClusterAudioEnabled = false;
		}
	}

	/**
	 * Phase 5: Update cluster audio settings
	 */
	private updateClusterAudioSettings(): void {
		if (!this.clusterAudioMapper || !this.settings.clusterAudio) return;

		logger.debug('phase5-update', 'Updating cluster audio settings');

		const clusterAudioSettings: ClusterAudioSettings = {
			enabled: this.settings.clusterAudio.enabled,
			globalVolume: this.settings.clusterAudio.globalVolume,
			clusterTypeEnabled: this.settings.clusterAudio.clusterTypeEnabled,
			clusterTypeVolumes: this.settings.clusterAudio.clusterTypeVolumes,
			transitionsEnabled: this.settings.clusterAudio.transitionsEnabled,
			transitionVolume: this.settings.clusterAudio.transitionVolume,
			transitionSpeed: this.settings.clusterAudio.transitionSpeed,
			realTimeUpdates: this.settings.clusterAudio.realTimeUpdates,
			strengthModulation: this.settings.clusterAudio.strengthModulation,
			strengthSensitivity: this.settings.clusterAudio.strengthSensitivity,
			spatialAudio: this.settings.clusterAudio.spatialAudio,
			maxSimultaneousClusters: this.settings.clusterAudio.maxSimultaneousClusters,
			updateThrottleMs: this.settings.clusterAudio.updateThrottleMs
		};

		this.clusterAudioMapper.updateSettings(clusterAudioSettings);
	}

	/**
	 * Phase 5: Disable cluster audio and clean up
	 */
	private disableClusterAudio(): void {
		if (!this.isClusterAudioEnabled) return;

		logger.info('phase5-cleanup', 'Disabling Phase 5 cluster audio components');

		try {
			if (this.clusterAudioMapper) {
				this.clusterAudioMapper.dispose();
				this.clusterAudioMapper = null;
			}

			this.isClusterAudioEnabled = false;
			logger.info('phase5-disabled', 'Phase 5 cluster audio components disabled and cleaned up');

		} catch (error) {
			logger.error('phase5-disable-error', 'Error during Phase 5 cleanup', error as Error);
		}
	}

	/**
	 * Phase 5: Process clusters for audio mapping
	 */
	public async processClustersForAudio(clusters: Cluster[]): Promise<void> {
		if (!this.isClusterAudioEnabled || !this.clusterAudioMapper) return;

		await this.clusterAudioMapper.processClusters(clusters);
	}

	/**
	 * Phase 6.2: Initialize dynamic orchestration manager
	 */
	private initializeDynamicOrchestration(): void {
		if (this.isDynamicOrchestrationEnabled) return;

		logger.info('phase6.2-init', 'Initializing Phase 6.2 dynamic orchestration');

		try {
			const orchestrationSettings: DynamicOrchestrationSettings = {
				enabled: true,
				complexityThresholds: [],
				customThresholds: this.settings.dynamicOrchestration?.customThresholds || false,
				temporalInfluenceEnabled: this.settings.dynamicOrchestration?.temporalInfluenceEnabled !== false,
				timeOfDayInfluence: this.settings.dynamicOrchestration?.timeOfDayInfluence || 0.5,
				seasonalInfluence: this.settings.dynamicOrchestration?.seasonalInfluence || 0.3,
				transitionDuration: this.settings.dynamicOrchestration?.transitionDuration || 3.0,
				autoAdjust: this.settings.dynamicOrchestration?.autoAdjust !== false
			};

			this.dynamicOrchestrationManager = new DynamicOrchestrationManager(orchestrationSettings);

			// Start auto-update if enabled
			if (orchestrationSettings.autoAdjust) {
				this.dynamicOrchestrationManager.startAutoUpdate();
			}

			this.isDynamicOrchestrationEnabled = true;
			logger.info('phase6.2-initialized', 'Phase 6.2 dynamic orchestration initialized successfully');

		} catch (error) {
			logger.error('phase6.2-init-error', 'Error initializing Phase 6.2 dynamic orchestration', error as Error);
			this.isDynamicOrchestrationEnabled = false;
		}
	}

	/**
	 * Phase 6.2: Update dynamic orchestration settings
	 */
	private updateDynamicOrchestrationSettings(): void {
		if (!this.dynamicOrchestrationManager || !this.settings.dynamicOrchestration) return;

		logger.debug('phase6.2-update', 'Updating Phase 6.2 dynamic orchestration settings');

		const orchestrationSettings: Partial<DynamicOrchestrationSettings> = {
			customThresholds: this.settings.dynamicOrchestration.customThresholds,
			temporalInfluenceEnabled: this.settings.dynamicOrchestration.temporalInfluenceEnabled,
			timeOfDayInfluence: this.settings.dynamicOrchestration.timeOfDayInfluence,
			seasonalInfluence: this.settings.dynamicOrchestration.seasonalInfluence,
			transitionDuration: this.settings.dynamicOrchestration.transitionDuration,
			autoAdjust: this.settings.dynamicOrchestration.autoAdjust
		};

		this.dynamicOrchestrationManager.updateSettings(orchestrationSettings);
	}

	/**
	 * Phase 6.2: Disable dynamic orchestration and clean up
	 */
	private disableDynamicOrchestration(): void {
		if (!this.isDynamicOrchestrationEnabled) return;

		logger.info('phase6.2-cleanup', 'Disabling Phase 6.2 dynamic orchestration');

		try {
			if (this.dynamicOrchestrationManager) {
				this.dynamicOrchestrationManager.dispose();
				this.dynamicOrchestrationManager = null;
			}

			this.isDynamicOrchestrationEnabled = false;
			logger.info('phase6.2-disabled', 'Phase 6.2 dynamic orchestration disabled and cleaned up');

		} catch (error) {
			logger.error('phase6.2-disable-error', 'Error during Phase 6.2 cleanup', error as Error);
		}
	}

	/**
	 * Phase 6.2: Update orchestration based on current graph state
	 */
	public updateOrchestration(
		nodes: GDEGraphNode[],
		links: GraphLink[],
		clusters?: Cluster[]
	): void {
		if (!this.isDynamicOrchestrationEnabled || !this.dynamicOrchestrationManager) return;

		this.dynamicOrchestrationManager.updateOrchestration(nodes, links, clusters);
	}

	/**
	 * Phase 6.2: Get current orchestration state
	 */
	public getOrchestrationState() {
		if (!this.isDynamicOrchestrationEnabled || !this.dynamicOrchestrationManager) {
			return null;
		}

		return this.dynamicOrchestrationManager.getState();
	}

	/**
	 * Map graph nodes to musical parameters
	 * Phase 2: Enhanced with metadata-driven mapping
	 */
	mapGraphToMusic(graphData: GraphData, stats: GraphStats): MusicalMapping[] {
		const startTime = logger.time('musical-mapping');
		
		logger.info('mapping', 'Starting musical mapping', {
			nodeCount: stats.totalNodes,
			edgeCount: stats.totalEdges,
			phase2Enabled: this.isPhase2Enabled
		});

		const mappings: MusicalMapping[] = [];
		const nodes = Array.from(graphData.nodes.values());

		// Phase 2: Use metadata-driven mapping if enabled
		if (this.isPhase2Enabled && this.app) {
			const enhancedMappings = this.createEnhancedMappings(nodes, stats);
			startTime();
			return enhancedMappings;
		}

		// Legacy mapping (Phase 1)
		// Sort nodes by connection count for consistent mapping
		nodes.sort((a, b) => b.connectionCount - a.connectionCount);

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const mapping = this.createNodeMapping(node, i, nodes.length, stats);
			mappings.push(mapping);
		}

		startTime();

		logger.info('mapping', 'Musical mapping complete', {
			mappingsCreated: mappings.length,
			avgPitch: mappings.reduce((sum, m) => sum + m.pitch, 0) / mappings.length,
			totalDuration: mappings.reduce((sum, m) => sum + m.duration, 0)
		});

		return mappings;
	}

	/**
	 * Phase 2: Create enhanced mappings using metadata-driven analysis
	 */
	private createEnhancedMappings(nodes: GraphNode[], stats: GraphStats): MusicalMapping[] {
		if (!this.app || !this.metadataMapper || !this.vaultOptimizer) {
			logger.warn('enhanced-mapping-unavailable', 'Phase 2 components not available, falling back to legacy mapping');
			return this.createLegacyMappings(nodes, stats);
		}

		const startTime = performance.now();
		const mappings: MusicalMapping[] = [];

		try {
			// Get vault-wide analysis for intelligent distribution (use cached if available)
			let vaultAnalysis = this.lastVaultAnalysis;
			if (!vaultAnalysis) {
				// If no cached analysis, start async analysis but don't wait for it
				this.vaultOptimizer.analyzeVault().then(analysis => {
					this.lastVaultAnalysis = analysis;
					logger.debug('vault-analysis-cached', 'Vault analysis cached for future use');
				}).catch(error => {
					logger.warn('vault-analysis-background-error', 'Background vault analysis failed', error as Error);
				});
				
				// Use simplified analysis for immediate mapping
				vaultAnalysis = this.createSimplifiedVaultAnalysis(nodes);
			}

			// Convert nodes to files for analysis
			const files: TFile[] = [];
			const analysisResults: MetadataAnalysisResult[] = [];

			for (const node of nodes) {
				const file = this.app.vault.getAbstractFileByPath(node.path) as TFile;
				if (file && file instanceof TFile) {
					files.push(file);
					
					// Analyze file metadata
					const analysis = this.metadataMapper.analyzeFile(file);
					analysisResults.push(analysis);
				}
			}

			// Apply intelligent distribution if enabled
			if (this.instrumentDistributor && files.length > 10) {
				const distributionAnalysis = this.instrumentDistributor.optimizeDistribution(
					files, 
					analysisResults, 
					vaultAnalysis
				);

				logger.info('distribution-applied', 'Applied intelligent instrument distribution', {
					adjustedFiles: distributionAnalysis.adjustedFiles,
					clusteringReduction: distributionAnalysis.clusteringReduction.toFixed(1) + '%',
					diversityImprovement: distributionAnalysis.diversityImprovement.toFixed(1) + '%'
				});
			}

			// Create mappings with enhanced metadata
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				const analysisResult = analysisResults.find(r => r.analysisTime !== undefined); // Simplified matching
				
				const mapping = this.createEnhancedNodeMapping(node, analysisResult, i, nodes.length, stats);
				mappings.push(mapping);
			}

			const enhancedTime = performance.now() - startTime;
			
			logger.info('enhanced-mapping-complete', 'Enhanced metadata-driven mapping complete', {
				mappingsCreated: mappings.length,
				analysisTime: enhancedTime.toFixed(1) + 'ms',
				avgConfidence: analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length,
				uniqueInstruments: new Set(mappings.map(m => m.instrument)).size
			});

			return mappings;

		} catch (error) {
			logger.error('enhanced-mapping-error', 'Enhanced mapping failed, falling back to legacy', error as Error);
			return this.createLegacyMappings(nodes, stats);
		}
	}

	/**
	 * Phase 2: Create legacy mappings (fallback method)
	 */
	private createLegacyMappings(nodes: GraphNode[], stats: GraphStats): MusicalMapping[] {
		const mappings: MusicalMapping[] = [];
		
		// Sort nodes by connection count for consistent mapping
		nodes.sort((a, b) => b.connectionCount - a.connectionCount);

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const mapping = this.createNodeMapping(node, i, nodes.length, stats);
			mappings.push(mapping);
		}

		return mappings;
	}

	/**
	 * Phase 2: Create enhanced node mapping using metadata analysis
	 */
	private createEnhancedNodeMapping(
		node: GraphNode, 
		analysis: MetadataAnalysisResult | undefined, 
		index: number, 
		totalNodes: number, 
		stats: GraphStats
	): MusicalMapping {
		// If we have metadata analysis, use enhanced mapping
		if (analysis) {
			return this.createMetadataDrivenMapping(node, analysis, index, totalNodes, stats);
		}

		// Fall back to legacy mapping
		return this.createNodeMapping(node, index, totalNodes, stats);
	}

	/**
	 * Phase 2: Create metadata-driven musical mapping
	 */
	private createMetadataDrivenMapping(
		node: GraphNode, 
		analysis: MetadataAnalysisResult, 
		index: number, 
		totalNodes: number, 
		stats: GraphStats
	): MusicalMapping {
		// Use metadata-driven pitch calculation
		const pitch = this.calculateMetadataDrivenPitch(node, analysis, stats);
		
		// Use enhanced duration calculation
		const duration = this.calculateEnhancedDuration(node, analysis);
		
		// Use confidence-based velocity
		const velocity = this.calculateConfidenceBasedVelocity(analysis, index, totalNodes);
		
		// Use spatial-aware timing
		const timing = this.calculateSpatialTiming(node, analysis);

		// Use metadata-suggested instrument
		const instrument = analysis.finalInstrument;

		logger.debug('metadata-mapping', `Enhanced mapping for node: ${node.name}`, {
			instrument,
			confidence: analysis.confidence.toFixed(2),
			pitch: pitch.toFixed(1),
			duration: duration.toFixed(2),
			velocity: velocity.toFixed(2),
			analysisTime: analysis.analysisTime.toFixed(2) + 'ms'
		});

		return {
			nodeId: node.id,
			pitch,
			duration,
			velocity,
			timing,
			instrument
		};
	}

	/**
	 * Phase 2: Calculate pitch using metadata-driven factors
	 */
	private calculateMetadataDrivenPitch(
		node: GraphNode, 
		analysis: MetadataAnalysisResult, 
		stats: GraphStats
	): number {
		// Base frequency from distance mapping (folder depth affects pitch)
		const baseFrequency = this.rootNoteFreq * Math.pow(2, analysis.fileMetadata.depth.pitch);
		
		// Adjust for complexity (file size affects pitch range)
		const complexityFactor = 1 + (analysis.fileMetadata.size.richness - 0.5) * 0.5;
		
		// Constrain to musical scale
		const scaleConstrainedFreq = this.constrainToScale(baseFrequency * complexityFactor);
		
		// Add micro-detuning for phase interference prevention
		const nodeHash = this.hashString(`${node.id}-${analysis.finalInstrument}`);
		const detuningAmount = this.settings.antiCracklingDetuning || 2.0;
		const detuningCents = ((nodeHash % 100) / 100 - 0.5) * detuningAmount;
		
		return scaleConstrainedFreq * Math.pow(2, detuningCents / 1200);
	}

	/**
	 * Phase 2: Calculate duration using enhanced metadata factors
	 */
	private calculateEnhancedDuration(node: GraphNode, analysis: MetadataAnalysisResult): number {
		// Base duration from size mapping
		const baseDuration = analysis.fileMetadata.size.duration;
		
		// Adjust for content structure
		const structureModifier = 1 + (analysis.contentMetadata.structure.emphasis * 0.3);
		
		// Adjust for link density (more connected files get slightly longer notes)
		const linkModifier = 1 + (analysis.contentMetadata.linkDensity.density * 0.2);
		
		const finalDuration = baseDuration * structureModifier * linkModifier;
		
		// Ensure reasonable bounds
		return Math.max(0.1, Math.min(1.0, finalDuration));
	}

	/**
	 * Phase 2: Calculate velocity based on analysis confidence and importance
	 */
	private calculateConfidenceBasedVelocity(
		analysis: MetadataAnalysisResult, 
		index: number, 
		totalNodes: number
	): number {
		// Base velocity from position importance
		const positionVelocity = 1 - (index / Math.max(totalNodes - 1, 1));
		
		// Weight by analysis confidence
		const confidenceWeight = analysis.confidence;
		
		// Combine factors
		const combinedVelocity = (positionVelocity * 0.7) + (confidenceWeight * 0.3);
		
		// Map to MIDI velocity range
		return 0.3 + (combinedVelocity * 0.7);
	}

	/**
	 * Phase 2: Calculate timing with spatial awareness
	 */
	private calculateSpatialTiming(node: GraphNode, analysis: MetadataAnalysisResult): number {
		// Base timing from file age
		const now = Date.now();
		const daysSinceModified = (now - node.modified) / (1000 * 60 * 60 * 24);
		const ageNormalized = Math.min(daysSinceModified / 365, 1); // 1 year = max
		
		// Adjust for folder depth (deeper files play slightly later)
		const depthDelay = analysis.fileMetadata.depth.reverb * 0.5;
		
		// Combine timing factors
		const totalTiming = (ageNormalized * 3.0) + depthDelay;
		
		return Math.max(0, Math.min(5.0, totalTiming));
	}

	/**
	 * Phase 2: Constrain frequency to musical scale
	 */
	private constrainToScale(frequency: number): number {
		if (this.scale.length === 0) return frequency;
		
		// Convert frequency to MIDI note number
		const midiNote = 12 * Math.log2(frequency / this.rootNoteFreq);
		
		// Find closest scale note
		const octave = Math.floor(midiNote / 12);
		const noteInOctave = midiNote % 12;
		
		// Find closest scale degree
		let closestScaleDegree = this.scale[0];
		let minDistance = Math.abs(noteInOctave - this.scale[0]);
		
		for (const scaleDegree of this.scale) {
			const distance = Math.abs(noteInOctave - scaleDegree);
			if (distance < minDistance) {
				minDistance = distance;
				closestScaleDegree = scaleDegree;
			}
		}
		
		// Convert back to frequency
		const constrainedMidi = (octave * 12) + closestScaleDegree;
		return this.rootNoteFreq * Math.pow(2, constrainedMidi / 12);
	}

	/**
	 * Phase 2: Create simplified vault analysis for immediate use
	 */
	private createSimplifiedVaultAnalysis(nodes: GraphNode[]): VaultMappingAnalysis {
		const instrumentCounts = new Map<string, number>();
		
		// Simple instrument counting based on legacy assignment
		for (let i = 0; i < nodes.length; i++) {
			const instrument = this.assignInstrumentToNode(nodes[i], i, nodes.length);
			instrumentCounts.set(instrument, (instrumentCounts.get(instrument) || 0) + 1);
		}

		const instrumentDistribution = new Map();
		for (const [instrument, count] of instrumentCounts) {
			instrumentDistribution.set(instrument, {
				instrument,
				count,
				percentage: (count / nodes.length) * 100,
				avgConfidence: 0.5,
				files: [],
				clusters: []
			});
		}

		return {
			totalFiles: nodes.length,
			processedFiles: nodes.length,
			instrumentDistribution,
			familyDistribution: new Map(),
			averageConfidence: 0.5,
			analysisTime: 0,
			performanceMetrics: {
				filesPerSecond: 1000,
				avgAnalysisTimePerFile: 0,
				cacheHitRate: 0,
				memoryUsage: 0,
				bottlenecks: []
			},
			recommendations: []
		};
	}

	/**
	 * Phase 2: Get Phase 2 status and statistics
	 */
	getPhase2Status(): {
		enabled: boolean;
		components: {
			metadataMapper: boolean;
			mappingRules: boolean;
			vaultOptimizer: boolean;
			instrumentDistributor: boolean;
			metadataListener: boolean;
		};
		lastAnalysis: {
			available: boolean;
			filesAnalyzed: number;
			analysisTime: string;
			uniqueInstruments: number;
		};
		listenerStats?: any;
	} {
		const status: {
			enabled: boolean;
			components: {
				metadataMapper: boolean;
				mappingRules: boolean;
				vaultOptimizer: boolean;
				instrumentDistributor: boolean;
				metadataListener: boolean;
			};
			lastAnalysis: {
				available: boolean;
				filesAnalyzed: number;
				analysisTime: string;
				uniqueInstruments: number;
			};
			listenerStats?: any;
		} = {
			enabled: this.isPhase2Enabled,
			components: {
				metadataMapper: this.metadataMapper !== null,
				mappingRules: this.mappingRules !== null,
				vaultOptimizer: this.vaultOptimizer !== null,
				instrumentDistributor: this.instrumentDistributor !== null,
				metadataListener: this.metadataListener !== null
			},
			lastAnalysis: {
				available: this.lastVaultAnalysis !== null,
				filesAnalyzed: this.lastVaultAnalysis?.processedFiles || 0,
				analysisTime: this.lastVaultAnalysis?.analysisTime.toFixed(1) + 'ms' || 'N/A',
				uniqueInstruments: this.lastVaultAnalysis?.instrumentDistribution.size || 0
			}
		};

		if (this.metadataListener) {
			status.listenerStats = this.metadataListener.getStats();
		}

		return status;
	}

	/**
	 * Phase 2: Force refresh of vault analysis
	 */
	async refreshVaultAnalysis(): Promise<void> {
		if (!this.isPhase2Enabled || !this.vaultOptimizer) {
			throw new Error('Phase 2 components not enabled');
		}

		logger.info('vault-analysis-refresh', 'Manually refreshing vault analysis');
		this.lastVaultAnalysis = await this.vaultOptimizer.refreshAnalysis();
		logger.info('vault-analysis-refreshed', 'Vault analysis refreshed successfully');
	}

	/**
	 * Phase 2: Cleanup method for proper disposal
	 */
	dispose(): void {
		if (this.isPhase2Enabled) {
			this.disablePhase2Components();
		}
		if (this.isClusterAudioEnabled) {
			this.disableClusterAudio();
		}
		if (this.isDynamicOrchestrationEnabled) {
			this.disableDynamicOrchestration();
		}
		logger.debug('musical-mapper-disposed', 'MusicalMapper disposed');
	}

	private createNodeMapping(
		node: GraphNode, 
		index: number, 
		totalNodes: number, 
		stats: GraphStats
	): MusicalMapping {
		// Map connection count to pitch (more connections = higher pitch)
		const pitch = this.mapConnectionsToPitch(node.connectionCount, stats.maxConnections);
		
		// Map word count to duration (more content = longer notes)
		const duration = this.mapWordCountToDuration(node.wordCount);
		
		// Map node position in sorted list to velocity (importance)
		const velocity = this.mapPositionToVelocity(index, totalNodes);
		
		// Map creation time to timing offset
		const timing = Math.min(this.mapTimestampToTiming(node.created, node.modified), 5.0); // Cap at 5 seconds

		logger.debug('node-mapping', `Mapped node: ${node.name}`, {
			connections: node.connectionCount,
			wordCount: node.wordCount,
			pitch,
			duration,
			velocity,
			timing
		});

		// Issue #010 Fix: Assign instruments to notes to prevent all notes defaulting to same instrument
		// This prevents crackling from overlapping notes on the same instrument
		const instrument = this.assignInstrumentToNode(node, index, totalNodes);

		return {
			nodeId: node.id,
			pitch,
			duration,
			velocity,
			timing,
			instrument
		};
	}

	private mapConnectionsToPitch(connections: number, maxConnections: number): number {
		if (maxConnections === 0) {
			return this.rootNoteFreq;
		}

		// Normalize connection count to scale position
		const normalizedPosition = Math.min(connections / maxConnections, 1);
		
		// Issue #010 Fix: Add frequency diversification to reduce clustering at same pitch
		// Use a power curve to spread low connection counts across more frequencies
		const diversifiedPosition = Math.pow(normalizedPosition, 0.7); // Power curve for better distribution
		
		// Map to scale notes across 4 octaves instead of 3 for more range
		const scalePosition = Math.floor(diversifiedPosition * (this.scale.length * 4));
		const octave = Math.floor(scalePosition / this.scale.length);
		const noteInScale = scalePosition % this.scale.length;
		
		// Calculate base frequency
		const baseFrequency = this.rootNoteFreq * Math.pow(2, (this.scale[noteInScale] + (octave * 12)) / 12);
		
		// Issue #010 Future-Proof Fix: Deterministic micro-detuning to prevent phase interference
		// Use node characteristics for consistent but varied detuning
		const nodeHash = this.hashString(`${connections}-${maxConnections}-freq`);
		const detuningAmount = this.settings.antiCracklingDetuning || 2.0; // Default ±2 cents, configurable
		const detuningCents = ((nodeHash % 100) / 100 - 0.5) * detuningAmount; // Deterministic ±cents
		const detunedFrequency = baseFrequency * Math.pow(2, detuningCents / 1200);

		return detunedFrequency;
	}

	private mapWordCountToDuration(wordCount: number): number {
		// Shorter durations to reduce overlap and crackling
		const baseDuration = 0.3;
		const maxDuration = 0.6;  // Reduced from 0.8
		const minDuration = 0.15; // Reduced from 0.2

		// Enhanced logarithmic scaling for word count with better progression
		const scaleFactor = Math.log10(Math.max(wordCount, 1)) * 0.6; // Reduced scaling
		const scaledDuration = baseDuration + scaleFactor + (wordCount > 100 ? 0.3 : 0); // Reduced bonus
		
		return Math.max(minDuration, Math.min(maxDuration, scaledDuration));
	}

	private mapPositionToVelocity(position: number, totalNodes: number): number {
		// Higher position (more important nodes) = higher velocity
		const normalizedPosition = 1 - (position / Math.max(totalNodes - 1, 1));
		
		// Map to MIDI velocity range (0.3 to 1.0)
		const minVelocity = 0.3;
		const maxVelocity = 1.0;
		
		return minVelocity + (normalizedPosition * (maxVelocity - minVelocity));
	}

	private mapTimestampToTiming(_created: number, modified: number): number {
		// Use recency of modification for timing offset
		const now = Date.now();
		const daysSinceModified = (now - modified) / (1000 * 60 * 60 * 24);
		
		// More recently modified notes play sooner, but with minimal delay
		// Map to 0-3 second range for subtle timing variation
		const maxOffset = 3.0;
		const normalizedAge = Math.min(daysSinceModified / 365, 1); // 1 year = max age
		
		return normalizedAge * maxOffset;
	}

	private getRootNoteFrequency(rootNote: string): number {
		// Frequencies for C4 octave
		const noteFrequencies: Record<string, number> = {
			'C': 261.63,
			'C#': 277.18,
			'D': 293.66,
			'D#': 311.13,
			'E': 329.63,
			'F': 349.23,
			'F#': 369.99,
			'G': 392.00,
			'G#': 415.30,
			'A': 440.00,
			'A#': 466.16,
			'B': 493.88
		};

		return noteFrequencies[rootNote] || noteFrequencies['C'];
	}

	/**
	 * Generate sequence timing based on graph structure
	 */
	generateSequence(mappings: MusicalMapping[], _graphData: GraphData): MusicalMapping[] {
		logger.debug('sequence', 'Generating playback sequence', {
			totalMappings: mappings.length
		});

		// Create a copy for processing
		const sequence = [...mappings];

		// Sort by timing offset for initial ordering
		sequence.sort((a, b) => a.timing - b.timing);

		// Redistribute timing to avoid clustering
		const totalDuration = Math.max(30, Math.min(60, sequence.length * 0.08)); // 30-60 seconds with denser notes
		sequence.forEach((mapping, index) => {
			// Spread notes more evenly across time
			const baseTime = (index / sequence.length) * totalDuration;
			const randomOffset = (Math.random() - 0.5) * 0.5; // ±0.25 second variation
			mapping.timing = Math.max(0, baseTime + randomOffset);
		});

		// Issue #010 Additional Fix: Add micro-jittering to prevent simultaneous note triggers
		// Sort by timing to identify clusters
		sequence.sort((a, b) => a.timing - b.timing);
		const jitterAmount = 0.02; // 20ms jitter window
		
		for (let i = 1; i < sequence.length; i++) {
			const timeDiff = sequence[i].timing - sequence[i-1].timing;
			// If notes are too close (within 50ms), add small jitter
			if (timeDiff < 0.05) {
				const jitter = Math.random() * jitterAmount;
				sequence[i].timing += jitter;
				logger.debug('sequence', `Applied anti-crackling jitter: ${jitter.toFixed(3)}s to note ${i}`);
			}
		}

		// Apply tempo scaling (convert to musical time)
		const beatDuration = 60 / this.settings.tempo; // seconds per beat
		const tempoMultiplier = Math.sqrt(beatDuration / 0.5); // Gentler scaling using square root
		
		sequence.forEach(mapping => {
			mapping.timing = mapping.timing * Math.min(tempoMultiplier, 1.5); // Cap at 1.5x scaling
		});

		// Final sort by timing
		sequence.sort((a, b) => a.timing - b.timing);

		const finalDuration = Math.max(...sequence.map(m => m.timing + m.duration));
		
		logger.info('sequence', 'Sequence generated with improved timing', {
			totalDuration: finalDuration.toFixed(2),
			noteCount: sequence.length,
			firstNote: sequence[0]?.timing.toFixed(2) || 0,
			lastNote: sequence[sequence.length - 1]?.timing.toFixed(2) || 0,
			avgSpacing: (finalDuration / sequence.length).toFixed(2)
		});

		return sequence;
	}

	/**
	 * Get musical information for display
	 */
	getMusicalInfo(): {
		scale: string;
		rootNote: string;
		tempo: number;
		scaleNotes: number[];
	} {
		return {
			scale: this.settings.scale,
			rootNote: this.settings.rootNote,
			tempo: this.settings.tempo,
			scaleNotes: this.scale
		};
	}

	/**
	 * Issue #010 Fix: Assign instruments to notes based on characteristics
	 * This prevents all notes from defaulting to the same instrument and causing crackling
	 * Only suggests enabled instruments to prevent fallback to default
	 */
	private assignInstrumentToNode(node: GraphNode, _index: number, totalNodes: number): string {
		// Get enabled instruments from settings
		const enabledInstruments = Object.keys(this.settings.instruments).filter(instrumentName => 
			this.settings.instruments[instrumentName as keyof typeof this.settings.instruments]?.enabled
		);

		if (enabledInstruments.length === 0) {
			return 'piano'; // Fallback if no instruments enabled
		}

		if (enabledInstruments.length === 1) {
			return enabledInstruments[0]; // Only one option
		}

		// Define instrument families by frequency range and characteristics (corrected names)
		const instrumentsByRange = {
			low: ['bass', 'tuba', 'cello', 'bassSynth', 'timpani'],
			mid: ['piano', 'strings', 'guitar', 'organ', 'pad', 'saxophone', 'trombone', 'frenchHorn'],
					high: ['violin', 'flute', 'clarinet', 'trumpet', 'xylophone', 'vibraphone', 'oboe'],
		very_high: ['leadSynth', 'arpSynth', 'gongs', 'harp']
		};

		// Determine frequency range based on connections (matches our pitch mapping)
		const connectionRatio = node.connectionCount / Math.max(totalNodes, 1);
		let rangeKey: keyof typeof instrumentsByRange;
		
		if (connectionRatio < 0.25) {
			rangeKey = 'low';
		} else if (connectionRatio < 0.5) {
			rangeKey = 'mid';
		} else if (connectionRatio < 0.75) {
			rangeKey = 'high';
		} else {
			rangeKey = 'very_high';
		}

		// Filter candidate instruments to only enabled ones
		const candidateInstruments = instrumentsByRange[rangeKey].filter(instrument => 
			enabledInstruments.includes(instrument)
		);

		// If no enabled instruments in this range, fall back to any enabled instrument
		const finalCandidates = candidateInstruments.length > 0 ? candidateInstruments : enabledInstruments;

		// Use node characteristics to pick a specific instrument
		const nodeHash = this.hashString(node.id + node.name);
		const instrumentIndex = nodeHash % finalCandidates.length;
		const selectedInstrument = finalCandidates[instrumentIndex];

		logger.debug('instrument-assignment', `Assigned ${selectedInstrument} to node ${node.name}`, {
			nodeId: node.id,
			connections: node.connectionCount,
			connectionRatio: connectionRatio.toFixed(3),
			range: rangeKey,
			instrument: selectedInstrument,
			candidateInstruments,
			enabledInstruments: enabledInstruments.length,
			finalCandidates
		});

		return selectedInstrument;
	}

	/**
	 * Simple string hash function for consistent instrument assignment
	 */
	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}
} 