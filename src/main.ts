import { Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, SonigraphSettings } from './utils/constants';
import { SonigraphSettingTab } from './ui/settings';
import { MaterialControlPanelModal } from './ui/control-panel';
import { TestSuiteModal } from './testing/TestSuiteModal';
import { SonicGraphView, VIEW_TYPE_SONIC_GRAPH } from './ui/SonicGraphView';
import { AudioEngine } from './audio/engine';
import { GraphParser } from './graph/parser';
import { MusicalMapper } from './graph/musical-mapper';
import { getLogger, LoggerFactory } from './logging';
import { initializeWhaleIntegration, getWhaleIntegration } from './external/whale-integration';
import { FreesoundSampleLoader } from './audio/layers/FreesoundSampleLoader';

const logger = getLogger('main');

export default class SonigraphPlugin extends Plugin {
	settings: SonigraphSettings;
	public audioEngine: AudioEngine | null = null;
	private graphParser: GraphParser | null = null;
	public musicalMapper: MusicalMapper | null = null;
	private currentGraphData: any = null;

	async onload() {
		logger.info('lifecycle', 'Sonigraph plugin loading...');

		// Load settings
		await this.loadSettings();

		// Initialize logging level from settings
		this.initializeLoggingLevel();

		// Initialize components
		this.initializeComponents();

		// Whale integration temporarily disabled due to CORS download issues
		// TODO: Re-enable when we have a reliable sample delivery method (bundled samples or backend)
		// await this.initializeWhaleIntegration();

		// Register Sonic Graph view
		this.registerView(
			VIEW_TYPE_SONIC_GRAPH,
			(leaf) => new SonicGraphView(leaf, this)
		);

		// Add ribbon icon - opens Sonic Graph view
		this.addRibbonIcon('chart-network', 'Sonigraph: Open Sonic Graph', () => {
			this.activateSonicGraphView();
		});

		// Add command to open Sonic Graph view
		this.addCommand({
			id: 'open-sonic-graph-view',
			name: 'Open Sonic Graph',
			callback: () => {
				this.activateSonicGraphView();
			}
		});

		// Add legacy modal command (temporary during transition)
		this.addCommand({
			id: 'open-sonic-graph-modal',
			name: 'Open Sonic Graph (Modal - Legacy)',
			callback: () => {
				this.openSonicGraph();
			}
		});

		// Add command to open Control Panel
		this.addCommand({
			id: 'open-control-panel',
			name: 'Open Control Panel',
			callback: () => {
				this.openControlPanel();
			}
		});

		// Add test suite command
		this.addCommand({
			id: 'open-test-suite',
			name: 'Open Audio Engine Test Suite',
			callback: () => {
				this.openTestSuite();
			}
		});

		// Add setting tab
		this.addSettingTab(new SonigraphSettingTab(this.app, this));

		logger.info('lifecycle', 'Sonigraph plugin loaded successfully', {
			settingsLoaded: true,
			componentsInitialized: true,
			whaleIntegrationEnabled: !!getWhaleIntegration()
		});
	}

	async onunload() {
		logger.info('lifecycle', 'Sonigraph plugin unloading...');

		// Note: We don't detach leaves here - Obsidian handles that automatically
		// See: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Don't+detach+leaves+in+%60onunload%60

		try {
			// Clean up whale integration
			logger.debug('lifecycle', 'Cleaning up whale integration...');
			const whaleIntegration = getWhaleIntegration();
			if (whaleIntegration) {
				whaleIntegration.cleanup();
			}
			logger.debug('lifecycle', 'Whale integration cleaned up');
		} catch (error) {
			logger.error('lifecycle', 'Error cleaning up whale integration:', error);
		}

		try {
			// Clean up audio engine
			logger.debug('lifecycle', 'Disposing audio engine...');
			if (this.audioEngine) {
				this.audioEngine.dispose();
				this.audioEngine = null;
			}
			logger.debug('lifecycle', 'Audio engine disposed');
		} catch (error) {
			logger.error('lifecycle', 'Error disposing audio engine:', error);
		}

		// Clean up other components
		this.graphParser = null;
		this.musicalMapper = null;
		this.currentGraphData = null;

		logger.info('lifecycle', 'Sonigraph plugin unloaded successfully');
	}

	/**
	 * Initialize logging level from saved settings
	 */
	private initializeLoggingLevel(): void {
		if (this.settings.logLevel) {
			LoggerFactory.setLogLevel(this.settings.logLevel);
			logger.info('initialization', 'Logging level initialized from settings', {
				level: this.settings.logLevel
			});
		} else {
			// Use default level if not set
			const defaultLevel = 'warn';
			LoggerFactory.setLogLevel(defaultLevel);
			logger.info('initialization', 'Using default logging level', {
				level: defaultLevel
			});
		}
	}

	private initializeComponents(): void {
		logger.debug('initialization', 'Initializing plugin components');

		// Initialize audio engine
		this.audioEngine = new AudioEngine(this.settings);

		// Initialize graph parser
		this.graphParser = new GraphParser(this.app.vault, this.app.metadataCache);

		// Initialize musical mapper
		this.musicalMapper = new MusicalMapper(this.settings);

		logger.debug('initialization', 'All components initialized');
	}

	/**
	 * Initialize whale integration for high-quality external samples
	 */
	private async initializeWhaleIntegration(): Promise<void> {
		try {
			// Initialize whale integration with current settings
			const whaleSettings = {
				useWhaleExternal: this.settings.instruments.whaleHumpback?.enabled && this.settings.instruments.whaleHumpback?.useHighQuality,
				autoDiscovery: false, // Phase 1: Seed collection only
				discoveryFrequency: 'never' as const,
				qualityThreshold: 'strict' as const,
				allowBackgroundFetch: false,
				speciesPreference: 'humpback' as const,
				sampleUrls: [] as string[], // Will be populated from seed collection
				trustedInstitutions: ['MBARI_MARS', 'NOAA_fisheries', 'listeningtowhales'],
				maxSamples: 50
			};

			// Get plugin directory path for cache storage
			const pluginDir = `${this.app.vault.configDir}/plugins/${this.manifest.id}`;
			
			await initializeWhaleIntegration(whaleSettings, this.app.vault, pluginDir);
			
			logger.info('whale-integration', 'Whale integration initialized for per-instrument quality control', {
				enabled: whaleSettings.useWhaleExternal,
				whaleUseHighQuality: this.settings.instruments.whaleHumpback?.useHighQuality,
				whaleEnabled: this.settings.instruments.whaleHumpback?.enabled
			});
		} catch (error) {
			logger.warn('whale-integration', 'Failed to initialize whale integration', error);
		}
	}

	public openControlPanel(): void {
		logger.info('ui', 'Opening Sonigraph Control Center');

		const modal = new MaterialControlPanelModal(this.app, this);
		modal.open();
	}

	/**
	 * Activate Sonic Graph view (new default method)
	 */
	async activateSonicGraphView(): Promise<void> {
		logger.info('ui', 'Activating Sonic Graph view');

		const { workspace } = this.app;

		// Check if view already exists
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_SONIC_GRAPH);

		if (leaves.length > 0) {
			// View already exists, use it
			leaf = leaves[0];
			logger.debug('ui', 'Sonic Graph view already exists, revealing it');
		} else {
			// Create new leaf in main area (center)
			leaf = workspace.getLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_SONIC_GRAPH,
					active: true
				});
				logger.debug('ui', 'Created new Sonic Graph view in main area');
			}
		}

		// Reveal the leaf
		if (leaf) {
			workspace.revealLeaf(leaf);
			logger.info('ui', 'Sonic Graph view activated and revealed');
		}
	}

	/**
	 * Open Sonic Graph modal (legacy method, kept for transition)
	 */
	public openSonicGraph(): void {
		logger.info('ui', 'Opening Sonic Graph modal (legacy)');

		import('./ui/SonicGraphModal').then(({ SonicGraphModal }) => {
			const modal = new SonicGraphModal(this.app, this);
			modal.open();
		}).catch(error => {
			logger.error('ui', 'Failed to open Sonic Graph modal:', error);
		});
	}

	public openTestSuite(): void {
		logger.info('ui', 'Opening Audio Engine Test Suite');

		if (!this.audioEngine) {
			logger.error('ui', 'Cannot open test suite: Audio engine not initialized');
			return;
		}

		const modal = new TestSuiteModal(this.app, this.audioEngine);
		modal.open();
	}


	/**
	 * Parse the current vault and generate musical data
	 */
	async processVault(): Promise<void> {
		if (!this.graphParser || !this.musicalMapper) {
			logger.error('processing', 'Components not initialized');
			throw new Error('Plugin components not initialized');
		}

		logger.info('processing', 'Starting vault processing');

		try {
			// Parse vault to get graph data
			const graphData = await this.graphParser.parseVault();
			
			// Get graph statistics
			const stats = this.graphParser.getGraphStats(graphData);
			
			// Generate musical mappings
			const mappings = this.musicalMapper.mapGraphToMusic(graphData, stats);
			
			// Generate sequence
			const sequence = this.musicalMapper.generateSequence(mappings, graphData);

			// Store current data
			this.currentGraphData = {
				graphData,
				stats,
				mappings,
				sequence
			};

			logger.info('processing', 'Vault processing complete', {
				nodes: stats.totalNodes,
				edges: stats.totalEdges,
				mappings: mappings.length,
				sequenceLength: sequence.length
			});

		} catch (error) {
			logger.error('processing', 'Failed to process vault', error);
			throw error;
		}
	}

	/**
	 * Play the current musical sequence
	 */
	async playSequence(): Promise<void> {
		if (!this.audioEngine) {
			logger.error('playback', 'Audio engine not initialized');
			throw new Error('Audio engine not initialized');
		}

		if (!this.currentGraphData?.sequence) {
			logger.info('playback', 'No sequence available, processing vault first');
			await this.processVault();
		}

		if (!this.currentGraphData?.sequence) {
			logger.error('playback', 'Failed to generate sequence');
			throw new Error('No musical sequence available');
		}

		logger.info('playback', 'Starting sequence playback', {
			sequenceLength: this.currentGraphData.sequence.length,
			firstNote: this.currentGraphData.sequence[0],
			lastNote: this.currentGraphData.sequence[this.currentGraphData.sequence.length - 1]
		});

		// Debug the sequence data
		logger.info('debug', 'Sequence details', {
			totalNotes: this.currentGraphData.sequence.length,
			sampleNotes: this.currentGraphData.sequence.slice(0, 3).map((note: any) => ({
				pitch: (note as any).pitch,
				duration: (note as any).duration,
				velocity: (note as any).velocity,
				timing: (note as any).timing
			}))
		});

		// Update audio engine with current settings before playing
		this.audioEngine.updateSettings(this.settings);
		logger.debug('playback', 'Audio engine settings updated before playback');

		try {
			await this.audioEngine.playSequence(this.currentGraphData.sequence);
		} catch (error) {
			logger.error('playback', 'Failed to play sequence', error);
			throw error;
		}
	}

	/**
	 * Stop current playback
	 */
	stopPlayback(): void {
		if (this.audioEngine) {
			this.audioEngine.stop();
			logger.info('playback', 'Playback stopped');
		}
	}

	/**
	 * Get current status for UI display
	 */
	getStatus(): {
		plugin: {
			enabled: boolean;
			hasGraphData: boolean;
			lastProcessed: string | null;
		};
		audio: any;
		graph: any;
	} {
		const audioStatus = this.audioEngine?.getStatus() || {
			isInitialized: false,
			isPlaying: false,
			currentNotes: 0,
			audioContext: 'suspended',
			volume: 0
		};

		const graphStatus = this.currentGraphData?.stats || {
			totalNodes: 0,
			totalEdges: 0,
			avgConnections: 0
		};

		return {
			plugin: {
				enabled: this.settings.isEnabled,
				hasGraphData: !!this.currentGraphData,
				lastProcessed: this.currentGraphData ? new Date().toISOString() : null
			},
			audio: audioStatus,
			graph: graphStatus
		};
	}

	/**
	 * Update settings and refresh components
	 */
	async updateSettings(newSettings: Partial<SonigraphSettings>): Promise<void> {
		logger.debug('settings', 'Updating plugin settings', newSettings);

		// Merge with existing settings
		this.settings = { ...this.settings, ...newSettings };

		// Update components
		if (this.audioEngine) {
			this.audioEngine.updateSettings(this.settings);
		}

		if (this.musicalMapper) {
			this.musicalMapper.updateSettings(this.settings);
		}

		// Update whale integration if high-quality settings or whale instrument settings changed
		if ('useHighQualitySamples' in newSettings || 
			(newSettings.instruments && 'whaleHumpback' in newSettings.instruments)) {
			await this.updateWhaleIntegration();
		}

		// Save settings
		await this.saveSettings();

		logger.info('settings', 'Settings updated successfully', {
			whaleIntegrationUpdated: 'useHighQualitySamples' in newSettings || 
				(newSettings.instruments && 'whaleHumpback' in newSettings.instruments)
		});
	}

	/**
	 * Update whale integration when settings change
	 */
	private async updateWhaleIntegration(): Promise<void> {
		try {
			const whaleIntegration = getWhaleIntegration();
			if (whaleIntegration) {
				// Update whale integration settings
				const whaleSettings = {
					useWhaleExternal: this.settings.instruments.whaleHumpback?.enabled && this.settings.instruments.whaleHumpback?.useHighQuality,
					autoDiscovery: false,
					discoveryFrequency: 'never' as const,
					qualityThreshold: 'strict' as const,
					allowBackgroundFetch: false,
					speciesPreference: 'humpback' as const,
					sampleUrls: [] as string[],
					trustedInstitutions: ['MBARI_MARS', 'NOAA_fisheries', 'listeningtowhales'],
					maxSamples: 50
				};
				
				whaleIntegration.updateSettings(whaleSettings);
				
				logger.info('whale-integration', 'Whale integration settings updated', {
					enabled: whaleSettings.useWhaleExternal,
					whaleUseHighQuality: this.settings.instruments.whaleHumpback?.useHighQuality,
					whaleEnabled: this.settings.instruments.whaleHumpback?.enabled
				});
			}
		} catch (error) {
			logger.warn('whale-integration', 'Failed to update whale integration settings', error);
		}
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData();
		
		// Issue #006 Fix: Deep merge to preserve user-enabled instrument states
		this.settings = this.deepMergeSettings(DEFAULT_SETTINGS, data);
		
		// Migrate old settings structure if needed
		this.migrateSettings();
		
		logger.debug('settings', 'Settings loaded', { settings: this.settings });
	}

	/**
	 * Deep merge settings to preserve user configurations while adding new defaults
	 * Issue #006: Prevents corruption of user-enabled instrument states
	 */
	private deepMergeSettings(defaults: SonigraphSettings, saved: any): SonigraphSettings {
		// Start with a copy of defaults
		const merged = JSON.parse(JSON.stringify(defaults)) as SonigraphSettings;
		
		if (!saved) return merged;
		
		// Merge top-level properties
		Object.keys(saved).forEach(key => {
			if (key === 'instruments' && saved.instruments) {
				// Special handling for instruments to preserve enabled states
				Object.keys(saved.instruments).forEach(instrumentKey => {
					if (merged.instruments[instrumentKey as keyof typeof merged.instruments]) {
						// Preserve user's enabled state and other user settings
						const userInstrument = saved.instruments[instrumentKey];
						const defaultInstrument = merged.instruments[instrumentKey as keyof typeof merged.instruments];
						
						// Merge instrument settings, giving priority to saved enabled state
						merged.instruments[instrumentKey as keyof typeof merged.instruments] = {
							...defaultInstrument,
							...userInstrument,
							// Ensure effects structure is preserved
							effects: {
								...defaultInstrument.effects,
								...(userInstrument.effects || {})
							}
						};
						
						logger.debug('settings-merge', `Merged instrument ${instrumentKey}`, {
							defaultEnabled: defaultInstrument.enabled,
							userEnabled: userInstrument.enabled,
							finalEnabled: merged.instruments[instrumentKey as keyof typeof merged.instruments].enabled
						});
					}
				});
			} else if (key !== 'instruments') {
				// For non-instrument settings, use saved value
				(merged as Record<string, unknown>)[key] = saved[key];
			}
		});
		
		return merged;
	}

	/**
	 * Migrate settings from old structure to new per-instrument effects structure
	 */
	private migrateSettings(): void {
		logger.info('migration', 'migrateSettings() called - checking for needed migrations');
		let migrationNeeded = false;

		// Check if we have old global effects structure
		const settingsRecord = this.settings as Record<string, unknown>;
		if ('effects' in this.settings && !(settingsRecord.effects as any)?.piano) {
			logger.info('settings', 'Migrating old effects structure to per-instrument structure');
			migrationNeeded = true;

			const oldEffects = settingsRecord.effects as Record<string, unknown>;

			// Remove old global effects
			delete settingsRecord.effects;
			
			// Ensure instruments have effect settings
			if (!this.settings.instruments.piano.effects) {
				this.settings.instruments.piano.effects = {
					reverb: { 
						enabled: oldEffects?.reverb?.enabled || true, 
						params: { decay: 1.8, preDelay: 0.02, wet: oldEffects?.reverb?.wetness || 0.25 }
					},
					chorus: { 
						enabled: false, 
						params: { frequency: 0.8, depth: 0.5, delayTime: 4.0, feedback: 0.05 }
					},
					filter: { 
						enabled: false, 
						params: { frequency: 3500, Q: 0.8, type: 'lowpass' }
					}
				};
			}
			
			if (!this.settings.instruments.organ.effects) {
				this.settings.instruments.organ.effects = {
					reverb: { 
						enabled: oldEffects?.reverb?.enabled || true, 
						params: { decay: 2.2, preDelay: 0.03, wet: oldEffects?.reverb?.wetness || 0.35 }
					},
					chorus: { 
						enabled: oldEffects?.chorus?.enabled || true, 
						params: { frequency: 0.8, depth: 0.5, delayTime: 4.0, feedback: 0.05 }
					},
					filter: { 
						enabled: false, 
						params: { frequency: 4000, Q: 0.6, type: 'lowpass' }
					}
				};
			}
			
			if (!this.settings.instruments.strings.effects) {
				this.settings.instruments.strings.effects = {
					reverb: { 
						enabled: oldEffects?.reverb?.enabled || true, 
						params: { decay: 2.8, preDelay: 0.04, wet: oldEffects?.reverb?.wetness || 0.45 }
					},
					chorus: { 
						enabled: false, 
						params: { frequency: 0.6, depth: 0.3, delayTime: 3.0, feedback: 0.03 }
					},
					filter: { 
						enabled: oldEffects?.filter?.enabled || true, 
						params: { frequency: oldEffects?.filter?.frequency || 3500, Q: oldEffects?.filter?.Q || 0.8, type: oldEffects?.filter?.type || 'lowpass' }
					}
				};
			}
		}

		// ALWAYS check for missing instruments (for users upgrading instrument versions)
		// Ensure core keyboard instruments exist (piano & organ should always be available)
		if (!this.settings.instruments.piano) {
			logger.info('settings', 'Adding missing Piano instrument (core keyboard)');
			migrationNeeded = true;
			this.settings.instruments.piano = {
				enabled: true,
				volume: 0.8,
				maxVoices: 12,
				useHighQuality: false, // Default to synthesis (user can switch to recordings)
				effects: {
					reverb: { enabled: true, params: { decay: 1.8, preDelay: 0.02, wet: 0.25 } },
					chorus: { enabled: false, params: { frequency: 0.8, depth: 0.5, delayTime: 4.0, feedback: 0.05 } },
					filter: { enabled: false, params: { frequency: 3500, Q: 0.8, type: 'lowpass' } }
				}
			};
		}

		if (!this.settings.instruments.organ) {
			logger.info('settings', 'Adding missing Organ instrument (core keyboard)');
			migrationNeeded = true;
			this.settings.instruments.organ = {
				enabled: true,
				volume: 0.7,
				maxVoices: 8,
				useHighQuality: false, // Default to synthesis (user can switch to recordings)
				effects: {
					reverb: { enabled: true, params: { decay: 2.2, preDelay: 0.03, wet: 0.35 } },
					chorus: { enabled: true, params: { frequency: 0.8, depth: 0.5, delayTime: 4.0, feedback: 0.05 } },
					filter: { enabled: false, params: { frequency: 4000, Q: 0.6, type: 'lowpass' } }
				}
			};
		}


		
		// Ensure woodwind instruments exist (for users upgrading from 6 to 9 instruments)
		if (!this.settings.instruments.flute) {
			logger.info('settings', 'Adding missing Flute instrument');
			migrationNeeded = true;
			this.settings.instruments.flute = {
				enabled: true, 
				volume: 0.6, 
				maxVoices: 6,
				effects: {
					reverb: { enabled: true, params: { decay: 2.2, preDelay: 0.02, wet: 0.4 } },
					chorus: { enabled: false, params: { frequency: 0.8, depth: 0.2, delayTime: 2.0, feedback: 0.02 } },
					filter: { enabled: true, params: { frequency: 6000, Q: 0.5, type: 'lowpass' } }
				}
			};
		}
		
		if (!this.settings.instruments.clarinet) {
			logger.info('settings', 'Adding missing Clarinet instrument');
			migrationNeeded = true;
			this.settings.instruments.clarinet = {
				enabled: true, 
				volume: 0.5, 
				maxVoices: 6,
				effects: {
					reverb: { enabled: true, params: { decay: 2.5, preDelay: 0.03, wet: 0.35 } },
					chorus: { enabled: false, params: { frequency: 0.5, depth: 0.25, delayTime: 2.5, feedback: 0.03 } },
					filter: { enabled: true, params: { frequency: 4500, Q: 0.8, type: 'lowpass' } }
				}
			};
		}
		
		if (!this.settings.instruments.saxophone) {
			logger.info('settings', 'Adding missing Saxophone instrument');
			migrationNeeded = true;
			this.settings.instruments.saxophone = {
				enabled: true, 
				volume: 0.7, 
				maxVoices: 6,
				effects: {
					reverb: { enabled: true, params: { decay: 2.8, preDelay: 0.04, wet: 0.45 } },
					chorus: { enabled: true, params: { frequency: 0.6, depth: 0.4, delayTime: 3.5, feedback: 0.06 } },
					filter: { enabled: false, params: { frequency: 3000, Q: 0.9, type: 'lowpass' } }
				}
			};
		}
		


		// Ensure new string instruments exist (for users upgrading to include new nbrosowsky instruments)
		if (!this.settings.instruments.contrabass) {
			logger.info('settings', 'Adding missing Contrabass instrument (new string instrument)');
			migrationNeeded = true;
			this.settings.instruments.contrabass = {
				enabled: false, // Disabled by default to avoid overwhelming users
				volume: 0.8,
				maxVoices: 4,
				useHighQuality: false, // Default to synthesis (user can switch to recordings)
				effects: {
					reverb: { enabled: true, params: { decay: 3.2, preDelay: 0.05, wet: 0.5 } },
					chorus: { enabled: false, params: { frequency: 0.4, depth: 0.3, delayTime: 4.0, feedback: 0.04 } },
					filter: { enabled: true, params: { frequency: 1200, Q: 0.8, type: 'lowpass' } }
				}
			};
		}

		if (!this.settings.instruments.guitarElectric) {
			logger.info('settings', 'Adding missing Electric Guitar instrument (new string instrument)');
			migrationNeeded = true;
			this.settings.instruments.guitarElectric = {
				enabled: false, // Disabled by default
				volume: 0.7,
				maxVoices: 6,
				useHighQuality: false, // Default to synthesis (user can switch to recordings)
				effects: {
					reverb: { enabled: true, params: { decay: 2.0, preDelay: 0.02, wet: 0.3 } },
					chorus: { enabled: true, params: { frequency: 1.2, depth: 0.5, delayTime: 2.5, feedback: 0.06 } },
					filter: { enabled: false, params: { frequency: 4000, Q: 0.7, type: 'lowpass' } }
				}
			};
		}

		if (!this.settings.instruments.guitarNylon) {
			logger.info('settings', 'Adding missing Nylon Guitar instrument (new string instrument)');
			migrationNeeded = true;
			this.settings.instruments.guitarNylon = {
				enabled: false, // Disabled by default
				volume: 0.6,
				maxVoices: 6,
				useHighQuality: false, // Default to synthesis (user can switch to recordings)
				effects: {
					reverb: { enabled: true, params: { decay: 2.5, preDelay: 0.03, wet: 0.4 } },
					chorus: { enabled: false, params: { frequency: 0.8, depth: 0.3, delayTime: 3.0, feedback: 0.04 } },
					filter: { enabled: true, params: { frequency: 3500, Q: 0.6, type: 'lowpass' } }
				}
			};
		}

		if (!this.settings.instruments.bassElectric) {
			logger.info('settings', 'Adding missing Electric Bass instrument (new string instrument)');
			migrationNeeded = true;
			this.settings.instruments.bassElectric = {
				enabled: false, // Disabled by default
				volume: 0.8,
				maxVoices: 4,
				useHighQuality: false, // Default to synthesis (user can switch to recordings)
				effects: {
					reverb: { enabled: true, params: { decay: 2.2, preDelay: 0.02, wet: 0.25 } },
					chorus: { enabled: false, params: { frequency: 0.6, depth: 0.4, delayTime: 3.5, feedback: 0.05 } },
					filter: { enabled: true, params: { frequency: 1800, Q: 0.9, type: 'lowpass' } }
				}
			};
		}

		// Ensure bassoon exists (new woodwind instrument)
		if (!this.settings.instruments.bassoon) {
			logger.info('settings', 'Adding missing Bassoon instrument (new woodwind instrument)');
			migrationNeeded = true;
			this.settings.instruments.bassoon = {
				enabled: false, // Disabled by default
				volume: 0.7,
				maxVoices: 4,
				useHighQuality: false, // Default to synthesis (user can switch to recordings)
				effects: {
					reverb: { enabled: true, params: { decay: 2.8, preDelay: 0.04, wet: 0.4 } },
					chorus: { enabled: true, params: { frequency: 0.9, depth: 0.4, delayTime: 3.0, feedback: 0.08 } },
					filter: { enabled: true, params: { frequency: 2000, Q: 1.0, type: 'lowpass' } }
				}
			};
		}
		
		// Migrate from genre-based to flat sample array (Option 3 refactor)
		if (this.settings.freesoundSamples && typeof this.settings.freesoundSamples === 'object' && !Array.isArray(this.settings.freesoundSamples)) {
			logger.info('migration', 'Migrating from genre-based samples to flat array');
			this.flattenGenreBasedSamples();
			migrationNeeded = true;
		}

		// NOTE: Placeholder migration disabled after Option 3 refactor (flat sample array)
		// Users will add their own samples via Freesound Search
		// const needsPlaceholderMigration = this.checkPlaceholderMigrationNeeded();
		// if (needsPlaceholderMigration) {
		//   this.addPlaceholderSamplesToLibrary();
		//   migrationNeeded = true;
		// }

		// Import curated Freesound samples if user has no samples yet
		if (!this.settings.freesoundSamples || this.settings.freesoundSamples.length === 0) {
			logger.info('settings', 'No Freesound samples found - importing curated library');
			migrationNeeded = true;
			this.settings.freesoundSamples = this.getCuratedSamples();
			logger.info('settings', `Imported ${this.settings.freesoundSamples.length} curated samples`);
		}

		// Save migrated settings if any changes were made
		if (migrationNeeded) {
			this.saveSettings();
			logger.info('settings', 'Settings migration completed');
		}
	}

	/**
	 * Flatten genre-based samples ({genre: sample[]}) to flat array (sample[])
	 * Part of Option 3 refactor to remove genre organization
	 */
	private flattenGenreBasedSamples(): void {
		const oldFormat = this.settings.freesoundSamples as Record<string, unknown[]>;
		const flatArray: unknown[] = [];

		// Iterate through each genre and collect all samples
		Object.keys(oldFormat).forEach(genre => {
			const samples = oldFormat[genre];
			if (Array.isArray(samples)) {
				flatArray.push(...samples);
			}
		});

		// Replace with flat array
		this.settings.freesoundSamples = flatArray;

		logger.info('migration', `Flattened ${flatArray.length} samples from genre-based format to flat array`);
	}

	/**
	 * Check if placeholder migration is needed by counting actual placeholder samples in library
	 */
	private checkPlaceholderMigrationNeeded(): boolean {
		const sampleCount = Array.isArray(this.settings.freesoundSamples) ?
			this.settings.freesoundSamples.length : 0;

		logger.info('migration-check', 'Checking placeholder migration status', {
			sampleCount,
			needsMigration: sampleCount < 39
		});

		// Simple check: if we have fewer than 39 samples, we need migration
		if (sampleCount < 39) {
			logger.info('migration-check', `Migration needed - only have ${sampleCount} samples, need 39`);
			return true;
		}

		logger.info('migration-check', `Already complete - have ${sampleCount} samples`);
		return false;
	}

	/**
	 * Add all 39 placeholder samples to user's library as disabled samples
	 */
	private addPlaceholderSamplesToLibrary(): void {
		// Create a temporary sample loader to get all placeholder samples
		const sampleLoader = new FreesoundSampleLoader();
		const allGenres = sampleLoader.getAllGenres();

		logger.info('migration', `Starting placeholder migration for ${allGenres.length} genres`);
		logger.info('migration', 'Genres: ' + allGenres.map(g => `${g.genre}(${g.sampleCount})`).join(', '));

		// Initialize freesoundSamples if it doesn't exist
		if (!this.settings.freesoundSamples) {
			this.settings.freesoundSamples = {};
		}

		let totalAdded = 0;

		// Add all placeholder samples as disabled (merge with existing user samples)
		allGenres.forEach(({ genre, sampleCount }) => {
			const genreSamples = sampleLoader.getSamplesForGenre(genre);

			logger.info('migration', `Processing ${genre}: expected=${sampleCount}, actual=${genreSamples.length}`);

			if (genreSamples && genreSamples.length > 0) {
				// Get existing user samples for this genre
				const existingUserSamples = this.settings.freesoundSamples[genre] || [];

				// Set enabled: false for all placeholder samples
				const disabledPlaceholders = genreSamples.map(sample => ({
					...sample,
					enabled: false
				}));

				// Merge: keep user samples first, then add placeholder samples
				// Only add placeholders that don't already exist (by ID)
				const existingIds = new Set(existingUserSamples.map(s => s.id));
				const newPlaceholders = disabledPlaceholders.filter(s => !existingIds.has(s.id));

				this.settings.freesoundSamples[genre] = [...existingUserSamples, ...newPlaceholders];

				totalAdded += newPlaceholders.length;

				logger.info('migration', `${genre}: added ${newPlaceholders.length} new, ${existingUserSamples.length} existing, ${this.settings.freesoundSamples[genre].length} total`);
			}
		});

		logger.info('migration', `Complete: added ${totalAdded} samples across ${allGenres.length} genres`);
	}

	/**
	 * Get curated Freesound samples for initial library
	 */
	private getCuratedSamples(): any[] {
		// Import the transformed curated samples
		const curatedSamples = require('../curated-samples-transformed.json');
		return curatedSamples;
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		logger.debug('settings', 'Settings saved');
	}

	getLogs(): any[] {
		// Return all collected logs
		return LoggerFactory.getLogs();
	}
} 