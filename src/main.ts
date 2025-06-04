import { Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, SonigraphSettings } from './utils/constants';
import { SonigraphSettingTab } from './ui/settings';
import { ControlPanelModal } from './ui/control-panel';
import { AudioEngine } from './audio/engine';
import { GraphParser } from './graph/parser';
import { MusicalMapper } from './graph/musical-mapper';
import { getLogger } from './logging';

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

	private openControlPanel(): void {
		logger.info('ui', 'Opening control panel');

		const modal = new ControlPanelModal(this.app, this);
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
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		logger.debug('settings', 'Settings loaded', { settings: this.settings });
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		logger.debug('settings', 'Settings saved');
	}
} 