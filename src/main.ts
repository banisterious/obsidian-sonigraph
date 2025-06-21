import { Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, SonigraphSettings } from './utils/constants';
import { SonigraphSettingTab } from './ui/settings';
import { MaterialControlPanelModal } from './ui/control-panel-md';
import { TestSuiteModal } from './testing/TestSuiteModal';
import { AudioEngine } from './audio/engine';
import { GraphParser } from './graph/parser';
import { MusicalMapper } from './graph/musical-mapper';
import { getLogger, LoggerFactory } from './logging';

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

		// Initialize components
		this.initializeComponents();

		// Add ribbon icon
		this.addRibbonIcon('music', 'Sonigraph: Open Control Panel', () => {
			this.openControlPanel();
		});

		// Add command
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
			componentsInitialized: true
		});
	}

	async onunload() {
		logger.info('lifecycle', 'Sonigraph plugin unloading...');

		// Clean up audio engine
		if (this.audioEngine) {
			this.audioEngine.dispose();
			this.audioEngine = null;
		}

		// Clean up other components
		this.graphParser = null;
		this.musicalMapper = null;
		this.currentGraphData = null;

		logger.info('lifecycle', 'Sonigraph plugin unloaded');
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

	public openControlPanel(): void {
		logger.info('ui', 'Opening Sonigraph Control Center');

		const modal = new MaterialControlPanelModal(this.app, this);
		modal.open();
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
				pitch: note.pitch,
				duration: note.duration,
				velocity: note.velocity,
				timing: note.timing
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

		// Save settings
		await this.saveSettings();

		logger.info('settings', 'Settings updated successfully');
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
				(merged as any)[key] = saved[key];
			}
		});
		
		return merged;
	}

	/**
	 * Migrate settings from old structure to new per-instrument effects structure
	 */
	private migrateSettings(): void {
		let migrationNeeded = false;

		// Check if we have old global effects structure
		if ('effects' in this.settings && !(this.settings as any).effects?.piano) {
			logger.info('settings', 'Migrating old effects structure to per-instrument structure');
			migrationNeeded = true;
			
			const oldEffects = (this.settings as any).effects;
			
			// Remove old global effects
			delete (this.settings as any).effects;
			
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
		// Ensure new instruments exist (for users upgrading from 3 to 6 instruments)
		if (!this.settings.instruments.choir) {
			logger.info('settings', 'Adding missing Choir instrument');
			migrationNeeded = true;
			this.settings.instruments.choir = {
				enabled: true, 
				volume: 0.7, 
				maxVoices: 8,
				effects: {
					reverb: { enabled: true, params: { decay: 3.2, preDelay: 0.05, wet: 0.6 } },
					chorus: { enabled: true, params: { frequency: 0.4, depth: 0.6, delayTime: 5.0, feedback: 0.08 } },
					filter: { enabled: false, params: { frequency: 2000, Q: 0.7, type: 'lowpass' } }
				}
			};
		}
		
		if (!this.settings.instruments.vocalPads) {
			logger.info('settings', 'Adding missing Vocal Pads instrument');
			migrationNeeded = true;
			this.settings.instruments.vocalPads = {
				enabled: true, 
				volume: 0.5, 
				maxVoices: 8,
				effects: {
					reverb: { enabled: true, params: { decay: 4.0, preDelay: 0.06, wet: 0.7 } },
					chorus: { enabled: false, params: { frequency: 0.3, depth: 0.4, delayTime: 6.0, feedback: 0.05 } },
					filter: { enabled: true, params: { frequency: 1500, Q: 1.2, type: 'lowpass' } }
				}
			};
		}
		
		if (!this.settings.instruments.pad) {
			logger.info('settings', 'Adding missing Pad instrument');
			migrationNeeded = true;
			this.settings.instruments.pad = {
				enabled: true, 
				volume: 0.4, 
				maxVoices: 8,
				effects: {
					reverb: { enabled: true, params: { decay: 3.5, preDelay: 0.08, wet: 0.8 } },
					chorus: { enabled: false, params: { frequency: 0.2, depth: 0.7, delayTime: 8.0, feedback: 0.1 } },
					filter: { enabled: true, params: { frequency: 1200, Q: 1.5, type: 'lowpass' } }
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
		
		// Ensure individual vocal instruments exist (for users upgrading from 9 to 13 instruments - Phase 6A)
		if (!this.settings.instruments.soprano) {
			logger.info('settings', 'Adding missing Soprano instrument (Phase 6A)');
			migrationNeeded = true;
			this.settings.instruments.soprano = {
				enabled: false, // Disabled by default to avoid overwhelming users
				volume: 0.6, 
				maxVoices: 4,
				effects: {
					reverb: { enabled: true, params: { decay: 2.8, preDelay: 0.03, wet: 0.5 } },
					chorus: { enabled: true, params: { frequency: 0.8, depth: 0.3, delayTime: 2.5, feedback: 0.04 } },
					filter: { enabled: true, params: { frequency: 4000, Q: 1.2, type: 'lowpass' } }
				}
			};
		}
		
		if (!this.settings.instruments.alto) {
			logger.info('settings', 'Adding missing Alto instrument (Phase 6A)');
			migrationNeeded = true;
			this.settings.instruments.alto = {
				enabled: false, // Disabled by default
				volume: 0.5, 
				maxVoices: 4,
				effects: {
					reverb: { enabled: true, params: { decay: 3.0, preDelay: 0.04, wet: 0.55 } },
					chorus: { enabled: true, params: { frequency: 0.6, depth: 0.35, delayTime: 3.0, feedback: 0.05 } },
					filter: { enabled: true, params: { frequency: 3200, Q: 1.0, type: 'lowpass' } }
				}
			};
		}
		
		if (!this.settings.instruments.tenor) {
			logger.info('settings', 'Adding missing Tenor instrument (Phase 6A)');
			migrationNeeded = true;
			this.settings.instruments.tenor = {
				enabled: false, // Disabled by default
				volume: 0.5, 
				maxVoices: 4,
				effects: {
					reverb: { enabled: true, params: { decay: 2.5, preDelay: 0.03, wet: 0.45 } },
					chorus: { enabled: false, params: { frequency: 0.7, depth: 0.25, delayTime: 2.8, feedback: 0.03 } },
					filter: { enabled: true, params: { frequency: 2800, Q: 0.9, type: 'lowpass' } }
				}
			};
		}
		
		if (!this.settings.instruments.bass) {
			logger.info('settings', 'Adding missing Bass instrument (Phase 6A)');
			migrationNeeded = true;
			this.settings.instruments.bass = {
				enabled: false, // Disabled by default
				volume: 0.7, 
				maxVoices: 4,
				effects: {
					reverb: { enabled: true, params: { decay: 3.5, preDelay: 0.05, wet: 0.6 } },
					chorus: { enabled: false, params: { frequency: 0.4, depth: 0.4, delayTime: 4.0, feedback: 0.06 } },
					filter: { enabled: false, params: { frequency: 1500, Q: 0.8, type: 'lowpass' } }
				}
			};
		}
		
		// Save migrated settings if any changes were made
		if (migrationNeeded) {
			this.saveSettings();
			logger.info('settings', 'Settings migration completed');
		}
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