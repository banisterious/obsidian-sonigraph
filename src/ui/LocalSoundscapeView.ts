/**
 * LocalSoundscapeView
 *
 * An ItemView for displaying and interacting with local graph soundscapes.
 * Shows connections around a center note in a radial layout with depth-based audio mapping.
 *
 * Phase 1: Basic view and rendering with radial layout
 * Phase 2: Audio integration with depth-based mapping
 */

import { ItemView, WorkspaceLeaf, TFile, Notice, Setting } from 'obsidian';
import { getLogger } from '../logging';
import {
	LocalSoundscapeExtractor,
	LocalSoundscapeData
} from '../graph/LocalSoundscapeExtractor';
import { LocalSoundscapeRenderer, RendererConfig } from '../graph/LocalSoundscapeRenderer';
import { ForceDirectedLayout } from '../graph/ForceDirectedLayout';
import { DepthBasedMapper, DepthMapping } from '../audio/mapping/DepthBasedMapper';
import { NoteCentricMapper, NoteCentricMapping } from '../audio/mapping/NoteCentricMapper';
import { NoteCentricPlayer } from '../audio/playback/NoteCentricPlayer';
import { LocalSoundscapeFilterModal, LocalSoundscapeFilters } from './LocalSoundscapeFilterModal';
import { NoteVisualizationManager, VisualizationMode } from '../visualization/NoteVisualizationManager';
import { createLucideIcon } from './lucide-icons';
import { stringToMusicalKey, ROOT_NOTES } from '../utils/constants';
import type SonigraphPlugin from '../main';

const logger = getLogger('LocalSoundscapeView');

export const VIEW_TYPE_LOCAL_SOUNDSCAPE = 'local-soundscape-view';

/**
 * State interface for Local Soundscape view persistence
 */
export interface LocalSoundscapeViewState {
	centerFilePath: string | null;
	currentDepth: number;
	isPlaying: boolean;
}

export class LocalSoundscapeView extends ItemView {
	private plugin: SonigraphPlugin;
	private centerFile: TFile | null = null;
	private currentDepth: number = 2; // Default depth
	private graphData: LocalSoundscapeData | null = null;
	private extractor: LocalSoundscapeExtractor;
	private renderer: LocalSoundscapeRenderer | null = null;

	// Audio components
	private depthMapper: DepthBasedMapper | null = null;
	private noteCentricMapper: NoteCentricMapper | null = null;
	private noteCentricPlayer: NoteCentricPlayer | null = null;
	private currentNoteCentricMapping: NoteCentricMapping | null = null;
	private currentMappings: DepthMapping[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic type required for flexible API
	private continuousLayerManager: any = null; // ContinuousLayerManager (lazily loaded)

	// Audio state
	private isPlaying: boolean = false;
	private currentVoiceCount: number = 0;
	private currentVolume: number = 0;

	// Real-time playback system (single polling loop pattern like main Sonic Graph)
	private realtimeTimer: NodeJS.Timeout | null = null;
	private realtimeStartTime: number = 0;
	private nextNoteIndex: number = 0; // Track which notes have been triggered

	// Track active highlights for cleanup (no setTimeout needed!)
	private activeHighlights: Map<string, number> = new Map(); // nodeId -> end time

	// Music variation history (re-roll feature)
	private variationHistory: Map<string, number[]> = new Map(); // centerNodePath -> [seed1, seed2, ...]
	private currentVariationIndex: number = 0;
	private maxVariationHistory: number = 10; // Keep last 10 variations

	// Filters
	private filters: LocalSoundscapeFilters = {
		includeTags: [],
		excludeTags: [],
		includeFolders: [],
		excludeFolders: [],
		includeFileTypes: [],
		linkDirections: []
	};

	// Clustering
	private clusteringMethod: 'none' | 'folder' | 'tag' | 'depth' | 'community' = 'none';

	// Layout
	private layoutType: 'radial' | 'force' = 'force';

	// UI containers
	private containerEl: HTMLElement;
	private headerContainer: HTMLElement;
	private graphContainer: HTMLElement;
	private sidebarContainer: HTMLElement;
	private playbackContentContainer: HTMLElement | null = null;

	// Playback controls
	private playButton: HTMLButtonElement | null = null;
	private stopButton: HTMLButtonElement | null = null;
	private exportAudioButton: HTMLButtonElement | null = null;
	private prevVariationButton: HTMLButtonElement | null = null;
	private rerollButton: HTMLButtonElement | null = null;
	private variationDisplay: HTMLElement | null = null;
	private voiceCountDisplay: HTMLElement | null = null;
	private volumeDisplay: HTMLElement | null = null;

	// Visualization
	private visualizationManager: NoteVisualizationManager | null = null;
	private visualizationContainer: HTMLElement | null = null;
	private visualizationMode: VisualizationMode = 'piano-roll';

	// Staleness tracking
	private lastExtractionTime: number = 0;
	private isStale: boolean = false;
	private stalenessIndicator: HTMLElement | null = null;

	// View settings
	private pulsePlayingNodes: boolean = true;
	private nodeSizeMode: 'uniform' | 'link-count' | 'content-length' = 'uniform';

	constructor(leaf: WorkspaceLeaf, plugin: SonigraphPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.extractor = new LocalSoundscapeExtractor(this.app);

		// Initialize DepthBasedMapper if we have a musical mapper
		if (this.plugin.musicalMapper) {
			// Use settings from Control Center, cast to Partial<DepthMappingConfig> for compatibility
			const mappingConfig = this.plugin.settings.localSoundscape as Partial<import('../audio/mapping/DepthBasedMapper').DepthMappingConfig> || {};
			this.depthMapper = new DepthBasedMapper(
				mappingConfig,
				this.plugin.musicalMapper,
				this.app,
				this.plugin.audioEngine, // Pass audio engine for enabled instruments
				this.plugin.settings // Pass full settings for context-aware modifiers
			);
			void logger.info('view-init', 'DepthBasedMapper initialized with Control Center settings and enabled instruments');
		} else {
			void logger.warn('view-init', 'MusicalMapper not available, audio will not work');
		}

		void logger.info('view-init', 'LocalSoundscapeView initialized');
	}

	getViewType(): string {
		return VIEW_TYPE_LOCAL_SOUNDSCAPE;
	}

	getDisplayText(): string {
		if (this.centerFile) {
			return `Local Soundscape: ${this.centerFile.basename}`;
		}
		return 'Local Soundscape';
	}

	getIcon(): string {
		return 'radio-tower';
	}

	async onOpen(): Promise<void> {
		void logger.info('view-open', 'Opening Local Soundscape view');

		const container = this.containerEl;
		void container.empty();
		void container.addClass('local-soundscape-view');

		// Ensure container has height (ItemView sometimes doesn't set this automatically)
		if (!container.style.height) {
			container.setCssProps({ height: '100%' });
		}

		// Create main layout structure
		void this.createLayout();

		// Register metadata change listener for staleness detection
		this.registerEvent(
			this.app.metadataCache.on('changed', () => {
				void this.markAsStale();
			})
		);

		// Register active file change listener for auto-play feature
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				void this.handleActiveFileChange();
			})
		);

		// Wait for the workspace leaf to have dimensions before proceeding
		// The leaf container needs to be sized before our flex layout can work
		await this.waitForLeafReady();

		// Initialize with active file if available
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			await this.setCenterFile(activeFile);
		} else {
			void this.showPlaceholder();
		}
	}

	async onClose(): Promise<void> {
		void logger.info('view-close', 'Closing Local Soundscape view');

		// Stop audio playback
		if (this.isPlaying && this.plugin.audioEngine) {
			this.plugin.audioEngine.stop();
		}

		// Stop and cleanup continuous layers
		void this.stopContinuousLayers();
		if (this.continuousLayerManager) {
			try {
				await this.continuousLayerManager.dispose();
			} catch (error) {
				void logger.warn('view-close', 'Error disposing layer manager', error as Error);
			}
			this.continuousLayerManager = null;
		}

		// Cleanup renderer
		if (this.renderer) {
			this.renderer.dispose();
			this.renderer = null;
		}

		this.containerEl.empty();
	}

	/**
	 * Create the main layout structure
	 */
	private createLayout(): void {
		const container = this.containerEl;

		// Main container with flex layout
		const mainContainer = container.createDiv({ cls: 'local-soundscape-main' });

		// Header section (top bar with controls - only depth and filter now)
		this.headerContainer = mainContainer.createDiv({ cls: 'local-soundscape-header' });
		void this.createHeader();

		// Single sidebar container (no left/right split)
		this.sidebarContainer = mainContainer.createDiv({ cls: 'local-soundscape-sidebar-fullwidth' });
		void this.createSidebar();

		void logger.debug('layout-created', 'Layout structure created');
	}

	/**
	 * Create header with title and controls
	 */
	private createHeader(): void {
		const header = this.headerContainer;

		// Title section
		const titleSection = header.createDiv({ cls: 'header-title-section' });
		titleSection.createEl('h3', {
			text: 'Local Soundscape',
			cls: 'header-title'
		});

		// Center note name (will be updated dynamically)
		titleSection.createDiv({
			cls: 'center-note-name',
			text: 'No note selected'
		});

		// Controls section
		const controlsSection = header.createDiv({ cls: 'header-controls' });

		// Depth control
		const depthControl = controlsSection.createDiv({ cls: 'depth-control' });
		depthControl.createSpan({ text: 'Depth: ', cls: 'control-label' });

		const depthSlider = depthControl.createEl('input', {
			type: 'range',
			cls: 'depth-slider',
			attr: {
				min: '1',
				max: '5',
				value: this.currentDepth.toString(),
				step: '1'
			}
		});

		const depthValue = depthControl.createSpan({
			text: this.currentDepth.toString(),
			cls: 'depth-value'
		});

		depthSlider.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			const newDepth = parseInt(target.value);
			depthValue.textContent = newDepth.toString();
			void this.setDepth(newDepth);
		});

		// Filter button
		const filterButton = controlsSection.createEl('button', {
			cls: 'header-button filter-button',
			attr: { 'aria-label': 'Filter graph' }
		});
		void this.createFilterIcon(filterButton);
		filterButton.addEventListener('click', () => {
			void this.openFilterModal();
		});

		// Control Center button
		const controlCenterButton = controlsSection.createEl('button', {
			cls: 'header-button control-center-button',
			attr: { 'aria-label': 'Open Control Center' }
		});
		const controlCenterIcon = createLucideIcon('keyboard-music', 16);
		void controlCenterButton.appendChild(controlCenterIcon);
		controlCenterButton.addEventListener('click', () => {
			void this.openControlCenter();
		});

		void logger.debug('header-created', 'Header created with depth and filter controls');
	}

	/**
	 * Create sidebar with collapsible graph section and tabs
	 */
	private createSidebar(): void {
		const sidebar = this.sidebarContainer;

		// ===== COLLAPSIBLE GRAPH SECTION =====
		const graphSection = sidebar.createDiv({ cls: 'graph-section' });

		// Graph section header (clickable to collapse/expand)
		const graphHeader = graphSection.createDiv({ cls: 'graph-section-header' });
		graphHeader.createEl('h3', { text: 'Graph' });

		const toggleButton = graphHeader.createEl('button', {
			cls: 'graph-section-toggle',
			attr: { 'aria-label': 'Toggle graph section' }
		});
		toggleButton.textContent = '▼'; // Down arrow (collapsed state)

		// Graph section content (collapsed by default)
		const graphContent = graphSection.createDiv({ cls: 'graph-section-content collapsed' });

		// Graph canvas container
		this.graphContainer = graphContent.createDiv({ cls: 'local-soundscape-graph' });

		// Graph controls container
		const graphControls = graphContent.createDiv({ cls: 'local-soundscape-graph-controls' });

		// Group dropdown
		const clusteringContainer = graphControls.createDiv({ cls: 'clustering-control' });
		clusteringContainer.createSpan({ text: 'Group:', cls: 'clustering-label' });
		const clusteringSelect = clusteringContainer.createEl('select', { cls: 'clustering-select' });

		const clusterOptions: Array<{value: typeof this.clusteringMethod, label: string}> = [
			{ value: 'none', label: 'None' },
			{ value: 'folder', label: 'Folder' },
			{ value: 'tag', label: 'Tag' },
			{ value: 'depth', label: 'Depth' },
			{ value: 'community', label: 'Community' }
		];

		clusterOptions.forEach(option => {
			const optionEl = clusteringSelect.createEl('option', {
				value: option.value,
				text: option.label
			});
			if (option.value === this.clusteringMethod) {
				optionEl.selected = true;
			}
		});

		clusteringSelect.addEventListener('change', (e) => {
			const target = e.target as HTMLSelectElement;
			this.clusteringMethod = target.value as typeof this.clusteringMethod;
			void this.onClusteringMethodChanged();
		});

		// Layout dropdown
		const layoutContainer = graphControls.createDiv({ cls: 'layout-control' });
		layoutContainer.createSpan({ text: 'Layout:', cls: 'layout-label' });
		const layoutSelect = layoutContainer.createEl('select', { cls: 'layout-select' });

		const layoutOptions: Array<{value: typeof this.layoutType, label: string}> = [
			{ value: 'radial', label: 'Radial' },
			{ value: 'force', label: 'Force' }
		];

		layoutOptions.forEach(option => {
			const optionEl = layoutSelect.createEl('option', {
				value: option.value,
				text: option.label
			});
			if (option.value === this.layoutType) {
				optionEl.selected = true;
			}
		});

		layoutSelect.addEventListener('change', (e) => {
			const target = e.target as HTMLSelectElement;
			this.layoutType = target.value as typeof this.layoutType;
			void this.onLayoutTypeChanged();
		});

		// Graph action buttons
		const graphActions = graphControls.createDiv({ cls: 'local-soundscape-graph-actions' });

		// Refresh button
		const refreshButton = graphActions.createEl('button', {
			cls: 'local-soundscape-graph-button refresh-button',
			attr: { 'aria-label': 'Refresh graph' }
		});
		void this.createRefreshIcon(refreshButton);
		refreshButton.addEventListener('click', () => {
			void this.refresh();
		});

		// Export button
		const exportButton = graphActions.createEl('button', {
			cls: 'local-soundscape-graph-button export-button',
			attr: { 'aria-label': 'Export graph as image' }
		});
		void this.createExportIcon(exportButton);
		exportButton.addEventListener('click', () => {
			void this.exportGraph();
		});

		// Staleness indicator
		this.stalenessIndicator = graphControls.createDiv({
			cls: 'staleness-indicator up-to-date',
			text: 'Up-to-date'
		});

		// Graph statistics (will be populated by displayGraphStats)
		graphContent.createDiv({ cls: 'sidebar-stats-container' });

		// Toggle collapse/expand
		graphHeader.addEventListener('click', (e) => {
			void e.stopPropagation();
			const isCollapsed = graphContent.classList.contains('collapsed');
			logger.debug('graph-toggle', `Toggle clicked. Currently collapsed: ${isCollapsed}`);

			if (isCollapsed) {
				graphContent.classList.remove('collapsed');
				toggleButton.textContent = '▲'; // Up arrow (expanded state)
				void logger.debug('graph-toggle', 'Graph section expanded');
			} else {
				graphContent.classList.add('collapsed');
				toggleButton.textContent = '▼'; // Down arrow (collapsed state)
				void logger.debug('graph-toggle', 'Graph section collapsed');
			}
		});

		// ===== PLAYBACK/SETTINGS TABS =====
		// Tab navigation
		const tabsContainer = sidebar.createDiv({ cls: 'sidebar-tabs' });

		tabsContainer.createEl('button', {
			text: 'Playback',
			cls: 'sidebar-tab active',
			attr: { 'data-tab': 'playback' }
		});

		tabsContainer.createEl('button', {
			text: 'Settings',
			cls: 'sidebar-tab',
			attr: { 'data-tab': 'settings' }
		});

		// Tab content containers
		const playbackContent = sidebar.createDiv({
			cls: 'sidebar-content active',
			attr: { 'data-content': 'playback' }
		});

		const settingsContent = sidebar.createDiv({
			cls: 'sidebar-content',
			attr: { 'data-content': 'settings' }
		});

		// Tab switching
		tabsContainer.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (!target.classList.contains('sidebar-tab')) return;

			const tabName = target.getAttribute('data-tab');

			// Update active states
			sidebar.querySelectorAll('.sidebar-tab').forEach(tab => tab.classList.remove('active'));
			sidebar.querySelectorAll('.sidebar-content').forEach(content => content.classList.remove('active'));

			target.classList.add('active');
			const content = sidebar.querySelector(`[data-content="${tabName}"]`);
			if (content) content.classList.add('active');
		});

		// Store playback content container for later updates
		this.playbackContentContainer = playbackContent as HTMLElement;

		// Create playback controls
		void this.createPlaybackControls(playbackContent as HTMLElement);

		// Create settings panel
		void this.createSettingsPanel(settingsContent as HTMLElement);

		void logger.debug('sidebar-created', 'Sidebar created with tabs');
	}

	/**
	 * Create settings panel in sidebar
	 */
	private createSettingsPanel(container: HTMLElement): void {
		// Display Settings
		const displaySection = container.createDiv({ cls: 'settings-section' });
		displaySection.createEl('h4', { text: 'Display', cls: 'settings-heading' });

		// Show node labels toggle
		new Setting(displaySection)
			.setName('Show node labels')
			.addToggle(toggle => toggle
				.setValue(true)
				.onChange((value) => {
					if (this.renderer) {
						this.renderer.updateConfig({ showLabels: value });
					}
				}));

		// Node size mode selector
		const nodeSizeControl = displaySection.createDiv({ cls: 'setting-item' });
		nodeSizeControl.createSpan({ text: 'Node size mode', cls: 'setting-label' });
		const nodeSizeSelect = nodeSizeControl.createEl('select', { cls: 'setting-select' });

		const sizeOptions: Array<{value: typeof this.nodeSizeMode, label: string}> = [
			{ value: 'uniform', label: 'Uniform' },
			{ value: 'link-count', label: 'By link count' },
			{ value: 'content-length', label: 'By content length' }
		];

		sizeOptions.forEach(option => {
			const optionEl = nodeSizeSelect.createEl('option', {
				value: option.value,
				text: option.label
			});
			if (option.value === this.nodeSizeMode) {
				optionEl.selected = true;
			}
		});

		nodeSizeSelect.addEventListener('change', () => {
			this.nodeSizeMode = nodeSizeSelect.value as typeof this.nodeSizeMode;
			logger.info('setting-node-size', 'Node size mode changed', { mode: this.nodeSizeMode });

			// Re-render graph with new node sizes
			if (this.graphData && this.renderer) {
				this.renderer.render(this.graphData);
			}
		});

		// Visual Effects Settings
		const effectsSection = container.createDiv({ cls: 'settings-section' });
		effectsSection.createEl('h4', { text: 'Visual effects', cls: 'settings-heading' });

		// Pulse playing nodes toggle
		new Setting(effectsSection)
			.setName('Pulse playing nodes')
			.addToggle(toggle => toggle
				.setValue(this.pulsePlayingNodes)
				.onChange((value) => {
					this.pulsePlayingNodes = value;
					logger.info('setting-pulse', 'Pulse playing nodes setting changed', { enabled: value });

					// Update currently playing nodes if any
					if (!value && this.renderer) {
						// Remove pulse from all playing nodes
						this.renderer.clearAllPlayingHighlights();
					}
				}));

		// Info Section
		const infoSection = container.createDiv({ cls: 'settings-section' });
		infoSection.createEl('h4', { text: 'About', cls: 'settings-heading' });

		const infoText = infoSection.createDiv({ cls: 'setting-info' });
		infoText.createEl('p', {
			text: 'Local Soundscape creates an immersive audio-visual environment centered on a note.',
			cls: 'setting-description'
		});
		infoText.createEl('p', {
			text: 'Use depth control to explore connections. Apply filters to focus on specific content. Enable clustering to visualize groups.',
			cls: 'setting-description'
		});

		// Audio Settings Link
		const audioSettingsInfo = infoSection.createDiv({ cls: 'setting-item' });
		audioSettingsInfo.createEl('p', {
			text: 'Audio settings (auto-play, musical key, context-aware modifiers) are configured in the Control Center.',
			cls: 'setting-description'
		});
		const linkButton = audioSettingsInfo.createEl('button', {
			text: 'Open Control Center',
			cls: 'setting-button'
		});
		linkButton.addEventListener('click', () => {
			// Open Control Center modal via ribbon icon command
			this.plugin.openControlCenter();
		});

		void logger.debug('settings-panel-created', 'Settings panel populated');
	}

	/**
	 * Create playback controls in sidebar
	 */
	private createPlaybackControls(container: HTMLElement): void {
		logger.info('create-playback-controls', 'Creating playback controls', {
			containerExists: !!container,
			containerClass: container.className
		});

		// Playback buttons section
		const buttonSection = container.createDiv({ cls: 'playback-buttons' });
		void logger.debug('playback-buttons-created', 'Button section created');

		// Play/Pause button
		this.playButton = buttonSection.createEl('button', {
			cls: 'playback-button play-button',
			attr: { 'aria-label': 'Play soundscape', 'disabled': '' }
		});
		const playIcon = createLucideIcon('play', 20);
		this.playButton.appendChild(playIcon);
		this.playButton.appendChild(createSpan({ text: 'Play' }));
		this.playButton.addEventListener('click', () => void this.togglePlayback());

		// Stop button
		this.stopButton = buttonSection.createEl('button', {
			cls: 'playback-button stop-button',
			attr: { 'aria-label': 'Stop soundscape', 'disabled': '' }
		});
		const stopIcon = createLucideIcon('square', 20);
		this.stopButton.appendChild(stopIcon);
		this.stopButton.appendChild(createSpan({ text: 'Stop' }));
		this.stopButton.addEventListener('click', () => void this.stopPlayback());

		// Export Audio button
		this.exportAudioButton = buttonSection.createEl('button', {
			cls: 'playback-button export-audio-button',
			attr: { 'aria-label': 'Export soundscape as audio file', 'disabled': '' }
		});
		const exportIcon = createLucideIcon('download', 20);
		this.exportAudioButton.appendChild(exportIcon);
		this.exportAudioButton.appendChild(createSpan({ text: 'Export audio' }));
		this.exportAudioButton.addEventListener('click', () => void this.exportSoundscapeAudio());

		// Play Active Note button
		const playActiveNoteButton = buttonSection.createEl('button', {
			cls: 'playback-button play-active-note-button',
			attr: { 'aria-label': 'Play the currently active note' }
		});
		const playActiveNoteIcon = createLucideIcon('music', 20);
		void playActiveNoteButton.appendChild(playActiveNoteIcon);
		playActiveNoteButton.appendChild(createSpan({ text: 'Play active note' }));
		playActiveNoteButton.addEventListener('click', () => void this.playActiveNote());

		// Variation controls (Re-roll feature) - aligned as a button in the same row
		const variationSection = buttonSection.createDiv({ cls: 'variation-controls' });

		// Previous variation button
		this.prevVariationButton = variationSection.createEl('button', {
			cls: 'playback-button variation-button prev-variation',
			attr: { 'aria-label': 'Previous musical variation', 'disabled': '' }
		});
		const prevIcon = createLucideIcon('chevron-left', 16);
		this.prevVariationButton.appendChild(prevIcon);
		this.prevVariationButton.addEventListener('click', () => void this.previousVariation());

		// Variation display
		this.variationDisplay = variationSection.createSpan({
			cls: 'variation-display',
			text: 'Variation 1/1'
		});

		// Re-roll button
		this.rerollButton = variationSection.createEl('button', {
			cls: 'playback-button variation-button reroll-button',
			attr: { 'aria-label': 'Re-roll musical variation', 'disabled': '' }
		});
		const rerollIcon = createLucideIcon('rotate-cw', 16);
		this.rerollButton.appendChild(rerollIcon);
		this.rerollButton.addEventListener('click', () => void this.rerollVariation());

		// Voice count and volume display
		const statsSection = container.createDiv({ cls: 'playback-stats' });

		const voiceCountContainer = statsSection.createDiv({ cls: 'stat-item' });
		const voiceLabel = voiceCountContainer.createSpan({ cls: 'stat-label' });
		const voiceIcon = createLucideIcon('music', 14);
		void voiceIcon.addClass('stat-icon');
		void voiceLabel.appendChild(voiceIcon);
		voiceLabel.appendChild(createSpan({ text: 'Active Voices' }));
		this.voiceCountDisplay = voiceCountContainer.createSpan({
			text: '0',
			cls: 'stat-value voice-count'
		});

		const volumeContainer = statsSection.createDiv({ cls: 'stat-item' });
		const volumeLabel = volumeContainer.createSpan({ cls: 'stat-label' });
		const volumeIcon = createLucideIcon('volume-2', 14);
		void volumeIcon.addClass('stat-icon');
		void volumeLabel.appendChild(volumeIcon);
		volumeLabel.appendChild(createSpan({ text: 'Volume' }));
		this.volumeDisplay = volumeContainer.createSpan({
			text: '0%',
			cls: 'stat-value volume-level'
		});

		// Musical settings now configured in Control Center > Local Soundscape > Musical Enhancements
		// (Scale Quantization, Adaptive Pitch, Chord Voicing moved to centralized settings)

		// Visualization section
		const visualizationSection = container.createDiv({ cls: 'local-soundscape-visualization-section' });

		// Visualization mode selector
		const modeSelector = visualizationSection.createDiv({ cls: 'visualization-mode-selector' });
		modeSelector.createSpan({ text: 'Visualization:', cls: 'mode-label' });

		const modeSelect = modeSelector.createEl('select', { cls: 'mode-select' });
		const modes: Array<{value: VisualizationMode, label: string}> = [
			{ value: 'piano-roll', label: 'Piano Roll' },
			{ value: 'spectrum', label: 'Spectrum' },
			{ value: 'staff', label: 'Staff' }
		];

		modes.forEach(mode => {
			const option = modeSelect.createEl('option', {
				value: mode.value,
				text: mode.label
			});
			if (mode.value === this.visualizationMode) {
				option.selected = true;
			}
		});

		modeSelect.addEventListener('change', (e) => {
			const target = e.target as HTMLSelectElement;
			this.visualizationMode = target.value as VisualizationMode;
			void this.updateVisualizationMode();
		});

		// Visualization container
		this.visualizationContainer = visualizationSection.createDiv({
			cls: 'local-soundscape-visualization-container'
		});

		// Initialize visualization manager
		void this.initializeVisualization();

		void logger.debug('playback-controls-created', 'Playback controls initialized with visualization');
	}

	/**
	 * Create musical scale quantization controls
	 */
	private createMusicalScaleControls(container: HTMLElement): void {
		// Section header
		const header = container.createDiv({ cls: 'musical-settings-header' });
		header.createSpan({ text: 'Musical Scale Settings', cls: 'settings-header-text' });

		// Enable/disable toggle
		const enableToggle = container.createDiv({ cls: 'musical-setting-row' });
		enableToggle.createSpan({ text: 'Scale Quantization:', cls: 'setting-label' });

		const enableCheckbox = enableToggle.createEl('input', {
			type: 'checkbox',
			cls: 'musical-setting-checkbox'
		});
		enableCheckbox.checked = this.depthMapper?.getConfig().musicalTheory?.enabled || false;
		enableCheckbox.addEventListener('change', () => {
			void this.toggleScaleQuantization(enableCheckbox.checked);
		});

		// Root note selector
		const rootNoteRow = container.createDiv({ cls: 'musical-setting-row' });
		rootNoteRow.createSpan({ text: 'Root Note:', cls: 'setting-label' });

		const rootNoteSelect = rootNoteRow.createEl('select', { cls: 'musical-setting-select' });
		const rootNotes: Array<{value: string, label: string}> = [
			{ value: 'C', label: 'C' },
			{ value: 'C#', label: 'C# / D♭' },
			{ value: 'D', label: 'D' },
			{ value: 'D#', label: 'D# / E♭' },
			{ value: 'E', label: 'E' },
			{ value: 'F', label: 'F' },
			{ value: 'F#', label: 'F# / G♭' },
			{ value: 'G', label: 'G' },
			{ value: 'G#', label: 'G# / A♭' },
			{ value: 'A', label: 'A' },
			{ value: 'A#', label: 'A# / B♭' },
			{ value: 'B', label: 'B' }
		];

		rootNotes.forEach(note => {
			const option = rootNoteSelect.createEl('option', {
				value: note.value,
				text: note.label
			});
			if (note.value === (this.depthMapper?.getConfig().musicalTheory?.rootNote || 'C')) {
				option.selected = true;
			}
		});

		rootNoteSelect.addEventListener('change', () => {
			void this.updateMusicalScale(rootNoteSelect.value as 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B', undefined);
		});

		// Scale type selector
		const scaleTypeRow = container.createDiv({ cls: 'musical-setting-row' });
		scaleTypeRow.createSpan({ text: 'Scale Type:', cls: 'setting-label' });

		const scaleTypeSelect = scaleTypeRow.createEl('select', { cls: 'musical-setting-select' });
		const scaleTypes: Array<{value: string, label: string, description: string}> = [
			{ value: 'major', label: 'Major', description: 'Bright, happy' },
			{ value: 'minor', label: 'Natural Minor', description: 'Dark, melancholic' },
			{ value: 'harmonic-minor', label: 'Harmonic Minor', description: 'Exotic, dramatic' },
			{ value: 'melodic-minor', label: 'Melodic Minor', description: 'Bright minor' },
			{ value: 'pentatonic-major', label: 'Pentatonic Major', description: 'Simple, folk' },
			{ value: 'pentatonic-minor', label: 'Pentatonic Minor', description: 'Blues, rock' },
			{ value: 'blues', label: 'Blues', description: 'Blues with blue notes' },
			{ value: 'dorian', label: 'Dorian', description: 'Jazz, modern' },
			{ value: 'phrygian', label: 'Phrygian', description: 'Spanish, dark' },
			{ value: 'lydian', label: 'Lydian', description: 'Dreamy, floating' },
			{ value: 'mixolydian', label: 'Mixolydian', description: 'Folk, bluegrass' }
		];

		scaleTypes.forEach(scale => {
			const option = scaleTypeSelect.createEl('option', {
				value: scale.value,
				text: `${scale.label} (${scale.description})`
			});
			if (scale.value === (this.depthMapper?.getConfig().musicalTheory?.scale || 'major')) {
				option.selected = true;
			}
		});

		scaleTypeSelect.addEventListener('change', () => {
			void this.updateMusicalScale(undefined, scaleTypeSelect.value as 'major' | 'minor' | 'harmonic-minor' | 'melodic-minor' | 'pentatonic-major' | 'pentatonic-minor' | 'blues' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian');
		});

		// Quantization strength slider
		const quantStrengthRow = container.createDiv({ cls: 'musical-setting-row slider-row' });
		quantStrengthRow.createSpan({ text: 'Quantization Strength:', cls: 'setting-label' });

		const sliderContainer = quantStrengthRow.createDiv({ cls: 'slider-container' });
		const quantStrengthSlider = sliderContainer.createEl('input', {
			type: 'range',
			cls: 'musical-setting-slider',
			attr: {
				min: '0',
				max: '100',
				step: '5'
			}
		});
		const currentStrength = (this.depthMapper?.getConfig().musicalTheory?.quantizationStrength || 0.8) * 100;
		quantStrengthSlider.value = currentStrength.toString();

		const strengthValue = sliderContainer.createSpan({
			text: `${currentStrength}%`,
			cls: 'slider-value'
		});

		quantStrengthSlider.addEventListener('input', () => {
			const value = parseInt(quantStrengthSlider.value);
			strengthValue.textContent = `${value}%`;
			void this.updateQuantizationStrength(value / 100);
		});

		// Adaptive Pitch Ranges toggle (Phase 2)
		const adaptivePitchRow = container.createDiv({ cls: 'musical-setting-row' });
		adaptivePitchRow.createSpan({ text: 'Adaptive Pitch Ranges:', cls: 'setting-label' });

		const adaptivePitchCheckbox = adaptivePitchRow.createEl('input', {
			type: 'checkbox',
			cls: 'musical-setting-checkbox'
		});
		adaptivePitchCheckbox.checked = this.depthMapper?.getConfig().adaptivePitch?.enabled || false;
		adaptivePitchCheckbox.addEventListener('change', () => {
			void this.toggleAdaptivePitch(adaptivePitchCheckbox.checked);
		});

		container.createDiv({
			cls: 'musical-setting-description',
			text: 'Pitch ranges adapt to selected key for better harmonic integration'
		});

		// Chord Voicing toggle (Phase 2)
		const chordVoicingRow = container.createDiv({ cls: 'musical-setting-row' });
		chordVoicingRow.createSpan({ text: 'Chord Voicing:', cls: 'setting-label' });

		const chordVoicingCheckbox = chordVoicingRow.createEl('input', {
			type: 'checkbox',
			cls: 'musical-setting-checkbox'
		});
		chordVoicingCheckbox.checked = this.depthMapper?.getConfig().chordVoicing?.enabled || false;
		chordVoicingCheckbox.addEventListener('change', () => {
			void this.toggleChordVoicing(chordVoicingCheckbox.checked);
		});

		container.createDiv({
			cls: 'musical-setting-description',
			text: 'Add harmonic richness with depth-based polyphonic voicing'
		});

		// Voicing density slider (only shown when chord voicing enabled)
		const densityRow = container.createDiv({ cls: 'musical-setting-row slider-row' });
		densityRow.createSpan({ text: 'Voicing Density:', cls: 'setting-label' });

		const densitySliderContainer = densityRow.createDiv({ cls: 'slider-container' });
		const densitySlider = densitySliderContainer.createEl('input', {
			type: 'range',
			cls: 'musical-setting-slider',
			attr: {
				min: '0',
				max: '100',
				step: '10'
			}
		});
		const currentDensity = (this.depthMapper?.getConfig().chordVoicing?.voicingDensity || 0.5) * 100;
		densitySlider.value = currentDensity.toString();

		const densityValue = densitySliderContainer.createSpan({
			text: `${currentDensity}%`,
			cls: 'slider-value'
		});

		densitySlider.addEventListener('input', () => {
			const value = parseInt(densitySlider.value);
			densityValue.textContent = `${value}%`;
			void this.updateVoicingDensity(value / 100);
		});

		// Show/hide density slider based on chord voicing state
		densityRow.style.display = chordVoicingCheckbox.checked ? 'flex' : 'none';
		chordVoicingCheckbox.addEventListener('change', () => {
			densityRow.style.display = chordVoicingCheckbox.checked ? 'flex' : 'none';
		});

		void logger.debug('musical-controls-created', 'Musical scale controls initialized');
	}

	/**
	 * Toggle scale quantization on/off
	 */
	private async toggleScaleQuantization(enabled: boolean): Promise<void> {
		if (!this.depthMapper) {
			void logger.warn('toggle-quantization', 'No depth mapper available');
			return;
		}

		const config = this.depthMapper.getConfig();
		this.depthMapper.updateConfig({
			musicalTheory: {
				...config.musicalTheory,
				enabled: enabled
			}
		});

		// Regenerate mappings if we have graph data
		if (this.graphData) {
			await this.generateMappingsFromGraph();
		}

		new Notice(`Scale quantization ${enabled ? 'enabled' : 'disabled'}`);
		logger.info('toggle-quantization', `Scale quantization ${enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Update musical scale (root note and/or scale type)
	 */
	private async updateMusicalScale(
		rootNote?: 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B',
		scaleType?: 'major' | 'minor' | 'harmonic-minor' | 'melodic-minor' | 'pentatonic-major' | 'pentatonic-minor' | 'blues' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian'
	): Promise<void> {
		if (!this.depthMapper) {
			void logger.warn('update-scale', 'No depth mapper available');
			return;
		}

		const config = this.depthMapper.getConfig();
		this.depthMapper.updateConfig({
			musicalTheory: {
				...config.musicalTheory,
				rootNote: rootNote || config.musicalTheory?.rootNote || 'C',
				scale: scaleType || config.musicalTheory?.scale || 'major'
			}
		});

		// Regenerate mappings if we have graph data
		if (this.graphData) {
			await this.generateMappingsFromGraph();
		}

		const newConfig = this.depthMapper.getConfig();
		new Notice(`Scale changed to ${newConfig.musicalTheory?.rootNote} ${newConfig.musicalTheory?.scale}`);
		logger.info('update-scale', 'Musical scale updated', {
			rootNote: newConfig.musicalTheory?.rootNote,
			scaleType: newConfig.musicalTheory?.scale
		});
	}

	/**
	 * Update quantization strength
	 */
	private async updateQuantizationStrength(strength: number): Promise<void> {
		if (!this.depthMapper) {
			void logger.warn('update-quantization-strength', 'No depth mapper available');
			return;
		}

		const config = this.depthMapper.getConfig();
		this.depthMapper.updateConfig({
			musicalTheory: {
				...config.musicalTheory,
				quantizationStrength: strength
			}
		});

		// Regenerate mappings if we have graph data
		if (this.graphData) {
			await this.generateMappingsFromGraph();
		}

		logger.debug('update-quantization-strength', `Quantization strength updated to ${strength}`);
	}

	/**
	 * Toggle adaptive pitch ranges on/off (Phase 2)
	 */
	private async toggleAdaptivePitch(enabled: boolean): Promise<void> {
		if (!this.depthMapper) {
			void logger.warn('toggle-adaptive-pitch', 'No depth mapper available');
			return;
		}

		const config = this.depthMapper.getConfig();
		this.depthMapper.updateConfig({
			adaptivePitch: {
				...config.adaptivePitch,
				enabled: enabled
			}
		});

		// Regenerate mappings if we have graph data
		if (this.graphData) {
			await this.generateMappingsFromGraph();
		}

		new Notice(`Adaptive pitch ranges ${enabled ? 'enabled' : 'disabled'}`);
		logger.info('toggle-adaptive-pitch', `Adaptive pitch ranges ${enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Toggle chord voicing on/off (Phase 2)
	 */
	private async toggleChordVoicing(enabled: boolean): Promise<void> {
		if (!this.depthMapper) {
			void logger.warn('toggle-chord-voicing', 'No depth mapper available');
			return;
		}

		const config = this.depthMapper.getConfig();
		this.depthMapper.updateConfig({
			chordVoicing: {
				...config.chordVoicing,
				enabled: enabled
			}
		});

		// Regenerate mappings if we have graph data
		if (this.graphData) {
			await this.generateMappingsFromGraph();
		}

		new Notice(`Chord voicing ${enabled ? 'enabled' : 'disabled'}`);
		logger.info('toggle-chord-voicing', `Chord voicing ${enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Update voicing density (Phase 2)
	 */
	private async updateVoicingDensity(density: number): Promise<void> {
		if (!this.depthMapper) {
			void logger.warn('update-voicing-density', 'No depth mapper available');
			return;
		}

		const config = this.depthMapper.getConfig();
		this.depthMapper.updateConfig({
			chordVoicing: {
				...config.chordVoicing,
				voicingDensity: density
			}
		});

		// Regenerate mappings if we have graph data
		if (this.graphData) {
			await this.generateMappingsFromGraph();
		}

		logger.debug('update-voicing-density', `Voicing density updated to ${density}`);
	}

	/**
	 * Initialize visualization manager
	 */
	private initializeVisualization(): void {
		if (!this.visualizationContainer) {
			void logger.warn('init-visualization', 'No visualization container available');
			return;
		}

		try {
			// Create visualization manager
			this.visualizationManager = new NoteVisualizationManager({
				mode: this.visualizationMode,
				enabled: true,
				frameRate: 30,
				colorScheme: 'layer',
				showLabels: true,
				showGrid: true,
				enableTrails: false
			});

			// Initialize with container
			this.visualizationManager.initialize(this.visualizationContainer);

			// Connect spectrum analyzer if in spectrum mode
			if (this.visualizationMode === 'spectrum') {
				const audioContext = this.plugin.audioEngine.getTestAudioContext();
				const masterVolume = this.plugin.audioEngine.getMasterVolume();

				if (audioContext && masterVolume) {
					this.visualizationManager.connectSpectrumToAudio(audioContext, masterVolume);
					void logger.info('init-visualization', 'Connected spectrum analyzer to audio');
				}
			}

			// Setup audio engine integration
			void this.setupVisualizationAudioIntegration();

			// Start visualization render loop immediately (even when not playing, shows grid/empty state)
			this.visualizationManager.start(0);

			// Force resize to ensure proper canvas sizing after initialization
			setTimeout(() => {
				if (this.visualizationManager) {
					this.visualizationManager.forceResize();
					void logger.debug('init-visualization', 'Forced visualization resize after initialization');
				}
			}, 100);

			void logger.info('init-visualization', 'Visualization manager initialized and started');
		} catch (error) {
			void logger.error('init-visualization', 'Failed to initialize visualization', error);
			new Notice('Failed to initialize visualization');
		}
	}

	/**
	 * Update visualization mode
	 */
	private updateVisualizationMode(): void {
		if (!this.visualizationManager) {
			void logger.warn('update-visualization', 'No visualization manager available');
			return;
		}

		try {
			// Update mode in manager
			this.visualizationManager.updateConfig({
				mode: this.visualizationMode
			});

			// Connect spectrum analyzer if switching to spectrum mode
			if (this.visualizationMode === 'spectrum') {
				const audioContext = this.plugin.audioEngine.getTestAudioContext();
				const masterVolume = this.plugin.audioEngine.getMasterVolume();

				if (audioContext && masterVolume) {
					this.visualizationManager.connectSpectrumToAudio(audioContext, masterVolume);
					void logger.info('update-visualization', 'Connected spectrum analyzer for spectrum mode');
				}
			}

			// Restart visualization (always restart to show the new mode)
			this.visualizationManager.start(0);

			logger.info('update-visualization', 'Visualization mode updated', {
				mode: this.visualizationMode
			});
		} catch (error) {
			void logger.error('update-visualization', 'Failed to update visualization mode', error);
		}
	}

	/**
	 * Setup audio engine integration for visualization
	 */
	private setupVisualizationAudioIntegration(): void {
		if (!this.visualizationManager) {
			void logger.warn('setup-audio-integration', 'No visualization manager available');
			return;
		}

		// Listen to note events from audio engine
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic type required for flexible API
		this.plugin.audioEngine.on('note-triggered', (noteData: any) => {
			logger.debug('viz-note-received', 'Received note-triggered event', {
				pitch: noteData.pitch,
				layer: noteData.layer,
				instrument: noteData.instrument,
				isPlaying: this.isPlaying,
				hasVizManager: !!this.visualizationManager
			});

			if (this.visualizationManager && this.isPlaying) {
				this.visualizationManager.addNoteEvent({
					pitch: noteData.pitch,
					velocity: noteData.velocity || 0.5,
					duration: noteData.duration || 1.0,
					layer: noteData.layer || 'harmonic',
					timestamp: noteData.timestamp,
					nodeId: noteData.nodeId,
					isPlaying: true
				});
				logger.debug('viz-note-added', 'Note added to visualization', {
					pitch: noteData.pitch,
					timestamp: noteData.timestamp
				});
			}
		});

		void logger.info('setup-audio-integration', 'Audio engine integration setup complete');
	}

	/**
	 * Show placeholder when no file is selected
	 */
	private showPlaceholder(): void {
		this.graphContainer.empty();

		const placeholder = this.graphContainer.createDiv({ cls: 'placeholder-container' });
		placeholder.createEl('div', {
			cls: 'placeholder-icon',
			text: '🎵'
		});
		placeholder.createEl('p', {
			text: 'Select a note to visualize its local soundscape',
			cls: 'placeholder-text'
		});
		placeholder.createEl('p', {
			text: 'Right-click a note and select "Open in Local Soundscape"',
			cls: 'placeholder-hint'
		});
	}

	/**
	 * Set the center file for the soundscape
	 */
	async setCenterFile(file: TFile): Promise<void> {
		logger.info('set-center', 'Setting center file', { file: file.path });

		// Stop any playing audio when switching to a new center file
		if (this.isPlaying) {
			await this.stopPlayback();
		}

		this.centerFile = file;

		// Update title
		const centerNoteName = this.headerContainer.querySelector('.center-note-name');
		if (centerNoteName) {
			centerNoteName.textContent = file.basename;
		}

		try {
			// Wait for container to have dimensions (fixes first-load issue)
			await this.waitForContainerReady();

			// Extract and render graph
			await this.extractAndRenderGraph();
		} catch (error) {
			logger.error('set-center-error', 'Failed to set center file', { error: String(error) });
			new Notice('Failed to load graph. Please try again or reload Obsidian.');

			// Show error in graph container
			this.graphContainer.empty();
			const errorDiv = this.graphContainer.createDiv({ cls: 'error-message' });
			errorDiv.createEl('p', { text: 'Failed to load graph. Container not ready.' });
			errorDiv.createEl('p', { text: 'Please try connecting again.' });
		}
	}

	/**
	 * Wait for the workspace leaf to be sized by Obsidian
	 * This must happen before our flex containers can calculate their dimensions
	 */
	private async waitForLeafReady(): Promise<void> {
		const maxAttempts = 50;
		const delayMs = 100;

		for (let i = 0; i < maxAttempts; i++) {
			const leafContainer = this.containerEl.parentElement;
			const width = leafContainer?.clientWidth || 0;
			const height = leafContainer?.clientHeight || 0;

			if (width > 0 && height > 0) {
				logger.info('leaf-ready', 'Workspace leaf ready', { width, height, attempts: i + 1 });
				return;
			}

			if (i === 0 || i % 10 === 0) {
				logger.debug('leaf-wait', 'Waiting for workspace leaf dimensions', {
					attempt: i + 1,
					leafWidth: width,
					leafHeight: height,
					containerElWidth: this.containerEl.clientWidth,
					containerElHeight: this.containerEl.clientHeight
				});
			}

			await new Promise(resolve => setTimeout(resolve, delayMs));
		}

		void logger.warn('leaf-timeout', 'Workspace leaf not ready after timeout');
		// Don't throw - allow view to try anyway
	}

	/**
	 * Wait for graph container to have valid dimensions
	 * Fixes issue where graph doesn't appear on first load
	 */
	private async waitForContainerReady(): Promise<void> {
		const maxAttempts = 50;
		const delayMs = 100;

		for (let i = 0; i < maxAttempts; i++) {
			const width = this.graphContainer.clientWidth;
			const height = this.graphContainer.clientHeight;

			// Check if container is actually visible and has dimensions
			if (width > 0 && height > 0) {
				// Additional check: make sure parent chain is visible
				const computedStyle = window.getComputedStyle(this.graphContainer);
				const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';

				if (isVisible) {
					logger.info('container-ready', 'Container ready', { width, height, attempts: i + 1 });
					return;
				}
			}

			// On first few attempts, force layout reflow to help flex containers calculate
			if (i < 5) {
				// Force a reflow by reading offsetHeight
				void this.containerEl.offsetHeight;
			}

			if (i === 0 || i % 10 === 0) {
				// Log parent container dimensions for debugging
				const contentContainer = this.graphContainer.parentElement;
				const mainContainer = contentContainer?.parentElement;
				const viewContainer = this.containerEl;
				const leafContainer = viewContainer.parentElement;

				logger.debug('container-wait', 'Waiting for container dimensions', {
					attempt: i + 1,
					graphWidth: width,
					graphHeight: height,
					graphDisplay: window.getComputedStyle(this.graphContainer).display,
					contentWidth: contentContainer?.clientWidth || 0,
					contentHeight: contentContainer?.clientHeight || 0,
					contentDisplay: contentContainer ? window.getComputedStyle(contentContainer).display : 'N/A',
					mainWidth: mainContainer?.clientWidth || 0,
					mainHeight: mainContainer?.clientHeight || 0,
					mainDisplay: mainContainer ? window.getComputedStyle(mainContainer).display : 'N/A',
					containerElWidth: viewContainer.clientWidth,
					containerElHeight: viewContainer.clientHeight,
					containerElDisplay: window.getComputedStyle(viewContainer).display,
					leafWidth: leafContainer?.clientWidth || 0,
					leafHeight: leafContainer?.clientHeight || 0
				});
			}

			await new Promise(resolve => setTimeout(resolve, delayMs));
		}

		logger.error('container-timeout', 'Container dimensions not ready after timeout', {
			width: this.graphContainer.clientWidth,
			height: this.graphContainer.clientHeight,
			display: window.getComputedStyle(this.graphContainer).display,
			visibility: window.getComputedStyle(this.graphContainer).visibility
		});

		// Throw error so caller knows container isn't ready
		throw new Error('Container not ready after timeout');
	}

	/**
	 * Set the depth level
	 */
	private async setDepth(depth: number): Promise<void> {
		if (depth === this.currentDepth) return;

		logger.info('set-depth', 'Setting depth', { oldDepth: this.currentDepth, newDepth: depth });

		// Stop audio playback if currently playing
		const wasPlaying = this.isPlaying;
		if (this.isPlaying) {
			void logger.info('set-depth', 'Stopping playback for depth change');
			await this.stopPlayback();
		}

		this.currentDepth = depth;

		// Show user feedback
		new Notice(`Updating to depth ${depth}...`);

		// Re-extract and render graph with new depth
		// (extractAndRenderGraph will dispose the old renderer automatically)
		if (this.centerFile) {
			await this.extractAndRenderGraph();

			// If audio was playing before depth change, restart it with new depth
			if (wasPlaying && this.graphData) {
				logger.info('set-depth', 'Restarting playback with new depth', {
					newNodeCount: this.graphData.stats.totalNodes
				});
				await this.startPlayback();
			}

			// Show completion feedback
			new Notice(`Depth ${depth}: ${this.graphData?.stats.totalNodes || 0} nodes`);
		}
	}

	/**
	 * Refresh the graph
	 */
	private async refresh(): Promise<void> {
		void logger.info('refresh', 'Refreshing graph');

		if (this.centerFile) {
			// Stop audio if playing
			if (this.isPlaying) {
				await this.stopPlayback();
			}

			try {
				// Wait for container to be ready (in case view was resized or hidden)
				await this.waitForContainerReady();

				// Re-extract and render
				await this.extractAndRenderGraph();

				// Mark as up-to-date
				void this.markAsUpToDate();

				new Notice('Graph refreshed');
			} catch (error) {
				logger.error('refresh-error', 'Failed to refresh graph', { error: String(error) });
				new Notice('Failed to refresh graph. Please try again.');
			}
		} else {
			new Notice('No note selected');
		}
	}

	/**
	 * Handle clustering method change
	 */
	private async onClusteringMethodChanged(): Promise<void> {
		logger.info('clustering-changed', 'Clustering method changed', { method: this.clusteringMethod });

		if (this.centerFile) {
			await this.extractAndRenderGraph();
			new Notice(`Clustering: ${this.clusteringMethod}`);
		}
	}

	/**
	 * Handle layout type change
	 */
	private async onLayoutTypeChanged(): Promise<void> {
		logger.info('layout-changed', 'Layout type changed', { layout: this.layoutType });

		if (this.centerFile) {
			await this.extractAndRenderGraph();
			new Notice(`Layout: ${this.layoutType === 'radial' ? 'Radial' : 'Force-Directed'}`);
		}
	}

	/**
	 * Export soundscape audio
	 */
	private exportSoundscapeAudio(): void {
		// Check if we have either playback mode's data
		const hasGraphCentricData = this.currentMappings && this.currentMappings.length > 0;
		const hasNoteCentricData = this.currentNoteCentricMapping !== null;

		if (!hasGraphCentricData && !hasNoteCentricData) {
			new Notice('No soundscape to export. Please play the soundscape first.');
			return;
		}

		// Determine export mode
		const mode = hasNoteCentricData ? 'note-centric' : 'graph-centric';

		logger.info('audio-export', 'Opening export modal for Local Soundscape', {
			mode,
			nodeCount: hasGraphCentricData ? this.currentMappings.length : 0,
			centerNote: this.centerFile?.basename,
			hasNoteCentricData,
			hasGraphCentricData
		});

		// Use the existing export modal - pass null for animator since Local Soundscape is static
		const { ExportModal } = require('../export/ExportModal');
		const modal = new ExportModal(
			this.app,
			this.plugin,
			this.plugin.audioEngine,
			null,  // No temporal animator for Local Soundscape (static graph)
			this.currentNoteCentricMapping  // Pass note-centric mapping if available
		);
		void modal.open();
	}

	/**
	 * Re-roll musical variation
	 * Generates a new random seed and re-maps audio with randomization
	 */
	private async rerollVariation(): Promise<void> {
		if (!this.centerFile || !this.graphData) {
			void logger.warn('reroll', 'Cannot re-roll - no center file or graph data');
			return;
		}

		// Add animation class
		if (this.rerollButton) {
			this.rerollButton.addClass('rerolling');
			setTimeout(() => {
				this.rerollButton?.removeClass('rerolling');
			}, 1000);
		}

		// Generate new random seed
		const newSeed = Date.now();

		// Get or create variation history for this center note
		const centerPath = this.centerFile.path;
		if (!this.variationHistory.has(centerPath)) {
			// Initialize with original (no seed = null, represented as 0)
			this.variationHistory.set(centerPath, [0]);
		}

		const history = this.variationHistory.get(centerPath);

		// If we're not at the end of history, truncate everything after current index
		if (this.currentVariationIndex < history.length - 1) {
			void history.splice(this.currentVariationIndex + 1);
		}

		// Add new seed to history
		void history.push(newSeed);

		// Limit history size
		if (history.length > this.maxVariationHistory) {
			void history.shift();
			// Adjust index if we removed the first item
			if (this.currentVariationIndex > 0) {
				this.currentVariationIndex--;
			}
		}

		// Move to new variation
		this.currentVariationIndex = history.length - 1;

		// Remap and replay with new seed
		await this.remapAndPlay(newSeed);

		logger.info('reroll', 'Re-rolled musical variation', {
			seed: newSeed,
			variationIndex: this.currentVariationIndex + 1,
			totalVariations: history.length
		});
	}

	/**
	 * Go to previous musical variation
	 */
	private async previousVariation(): Promise<void> {
		if (!this.centerFile || !this.graphData) {
			void logger.warn('prev-variation', 'Cannot go to previous - no center file or graph data');
			return;
		}

		const centerPath = this.centerFile.path;
		const history = this.variationHistory.get(centerPath);

		if (!history || this.currentVariationIndex <= 0) {
			void logger.debug('prev-variation', 'Already at first variation');
			return;
		}

		// Move to previous variation
		this.currentVariationIndex--;
		const seed = history[this.currentVariationIndex];

		// Remap and replay with previous seed (0 means original/no seed)
		await this.remapAndPlay(seed === 0 ? undefined : seed);

		logger.info('prev-variation', 'Moved to previous variation', {
			variationIndex: this.currentVariationIndex + 1,
			totalVariations: history.length,
			seed: seed
		});
	}

	/**
	 * Remap audio with a specific seed and start playback
	 */
	private async remapAndPlay(seed?: number): Promise<void> {
		if (!this.graphData || !this.depthMapper || !this.plugin.audioEngine) {
			void logger.warn('remap-play', 'Cannot remap - missing required components');
			return;
		}

		// Stop current playback if playing
		const wasPlaying = this.isPlaying;
		if (wasPlaying) {
			void this.stopPlayback();
		}

		try {
			// Re-map with new seed
			this.currentMappings = await this.depthMapper.mapSoundscapeToMusic(this.graphData, seed);

			logger.info('remap-complete', 'Remapped with seed', {
				seed: seed ?? 'none (original)',
				mappingCount: this.currentMappings.length
			});

			// Update variation display
			void this.updateVariationDisplay();

			// If was playing, restart playback
			if (wasPlaying) {
				await this.startPlayback();
			}

			new Notice(`Variation ${this.currentVariationIndex + 1}`);
		} catch (error) {
			void logger.error('remap-error', 'Error remapping with seed', error as Error);
			new Notice('Failed to generate variation');
		}
	}

	/**
	 * Update variation display in UI
	 */
	private updateVariationDisplay(): void {
		if (!this.variationDisplay || !this.centerFile) return;

		const history = this.variationHistory.get(this.centerFile.path);
		const totalVariations = history?.length ?? 1;
		const currentVariation = this.currentVariationIndex + 1;

		this.variationDisplay.textContent = `Variation ${currentVariation}/${totalVariations}`;

		// Update button states
		if (this.prevVariationButton) {
			if (this.currentVariationIndex > 0) {
				this.prevVariationButton.removeAttribute('disabled');
			} else {
				this.prevVariationButton.setAttribute('disabled', '');
			}
		}
	}

	/**
	 * Initialize variation history for current center note
	 */
	private initializeVariationHistory(): void {
		if (!this.centerFile) return;

		const centerPath = this.centerFile.path;
		if (!this.variationHistory.has(centerPath)) {
			// Initialize with original variation (seed = 0)
			this.variationHistory.set(centerPath, [0]);
			this.currentVariationIndex = 0;
		} else {
			// Restore to last used variation for this note
			const history = this.variationHistory.get(centerPath);
			this.currentVariationIndex = history.length - 1;
		}

		void this.updateVariationDisplay();
	}

	/**
	 * Export graph as PNG image
	 */
	private exportGraph(): void {
		if (!this.graphData || !this.centerFile) {
			new Notice('No graph to export');
			return;
		}

		void logger.info('export-start', 'Exporting graph as image');

		try {
			// Find the SVG element
			const svgElement = this.graphContainer.querySelector('svg');
			if (!svgElement) {
				throw new Error('No SVG element found');
			}

			// Clone the SVG to avoid modifying the original
			const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

			// Get SVG dimensions
			const bbox = svgElement.getBoundingClientRect();
			const width = bbox.width;
			const height = bbox.height;

			// Set explicit dimensions on cloned SVG
			clonedSvg.setAttribute('width', width.toString());
			clonedSvg.setAttribute('height', height.toString());

			// Convert SVG to data URL
			const svgData = new XMLSerializer().serializeToString(clonedSvg);
			const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
			const svgUrl = URL.createObjectURL(svgBlob);

			// Create an image element to render the SVG
			const img = new Image();
			img.width = width;
			img.height = height;

			img.onload = () => {
				// Create canvas to convert to PNG
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					throw new Error('Failed to get canvas context');
				}

				// Draw white background
				ctx.fillStyle = '#ffffff';
				void ctx.fillRect(0, 0, width, height);

				// Draw the SVG image
				void ctx.drawImage(img, 0, 0);

				// Convert to PNG blob
				canvas.toBlob((blob) => {
					if (!blob) {
						throw new Error('Failed to create PNG blob');
					}

					// Create download link
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;

					// Generate filename from center note name and timestamp
					const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
					const noteName = this.centerFile?.basename || 'unknown';
					a.download = `local-soundscape-${noteName}-${timestamp}.png`;

					// Trigger download
					void a.click();

					// Cleanup
					void URL.revokeObjectURL(url);
					void URL.revokeObjectURL(svgUrl);

					logger.info('export-complete', 'Graph exported successfully', { filename: a.download });
					new Notice('Graph exported successfully!');
				}, 'image/png');
			};

			img.onerror = () => {
				throw new Error('Failed to load SVG image');
			};

			img.src = svgUrl;

		} catch (error) {
			void logger.error('export-error', 'Failed to export graph', error as Error);
			new Notice('Failed to export graph. Please try again.');
		}
	}

	/**
	 * Open filter modal
	 */
	private openFilterModal(): void {
		const modal = new LocalSoundscapeFilterModal(
			this.plugin.app,
			this.filters,
			(newFilters) => {
				void (async () => {
					this.filters = newFilters;
					void logger.info('filters-changed', 'Filters updated', newFilters);

					// Re-extract and render with new filters
					if (this.centerFile) {
						await this.extractAndRenderGraph();
						new Notice('Filters applied');
					}
				})();
			}
		);
		void modal.open();
	}

	/**
	 * Open Control Center
	 */
	private openControlCenter(): void {
		void import('./control-panel').then(({ MaterialControlPanelModal }) => {
			const controlCenter = new MaterialControlPanelModal(this.app, this.plugin);
			void controlCenter.open();
		});
	}

	/**
	 * Mark graph as stale (vault data has changed)
	 */
	private markAsStale(): void {
		// Only mark as stale if we have graph data and enough time has passed since extraction
		if (!this.graphData || !this.lastExtractionTime) {
			void logger.debug('staleness', 'Skipping stale mark - no graph data or extraction time');
			return;
		}

		// Don't mark stale if extracted very recently (< 2 seconds ago)
		// This prevents marking stale due to metadata changes triggered by the extraction itself
		const timeSinceExtraction = Date.now() - this.lastExtractionTime;
		if (timeSinceExtraction < 2000) {
			logger.debug('staleness', 'Skipping stale mark - extraction too recent', {
				timeSinceExtraction: `${(timeSinceExtraction / 1000).toFixed(1)}s`
			});
			return;
		}

		if (!this.isStale) {
			this.isStale = true;
			void this.updateStalenessIndicator();
			logger.info('staleness', 'Graph marked as stale', {
				timeSinceExtraction: `${(timeSinceExtraction / 1000).toFixed(1)}s`
			});
		}
	}

	/**
	 * Handle active file change for auto-play feature
	 */
	private async handleActiveFileChange(): Promise<void> {
		// Check if auto-play is enabled in settings
		const autoPlay = this.plugin.settings.localSoundscape?.autoPlayActiveNote ?? false;
		if (!autoPlay) {
			return;
		}

		// Get the currently active file
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			return;
		}

		// Don't trigger if the active file is already the center file
		if (this.centerFile?.path === activeFile.path) {
			return;
		}

		logger.info('auto-play-trigger', 'Auto-playing active note', {
			activeFile: activeFile.basename
		});

		// Set the active file as center and start playing
		await this.setCenterFile(activeFile);

		// Auto-start playback
		if (this.graphData && !this.isPlaying) {
			await this.startPlayback();
		}
	}

	/**
	 * Play the currently active note's soundscape manually
	 */
	async playActiveNote(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active note to play');
			return;
		}

		logger.info('manual-play-active', 'Manually playing active note', {
			activeFile: activeFile.basename
		});

		// Set the active file as center
		await this.setCenterFile(activeFile);

		// Start playback
		if (this.graphData && !this.isPlaying) {
			await this.startPlayback();
		}
	}

	/**
	 * Determine the musical key based on the key selection settings
	 */
	private determineMusicalKey(): string {
		const keySettings = this.plugin.settings.localSoundscape?.keySelection;
		const mode = keySettings?.mode || 'vault-name';

		if (!this.centerFile) {
			return 'C'; // Default if no center file
		}

		switch (mode) {
			case 'vault-name': {
				const vaultName = this.app.vault.getName();
				return stringToMusicalKey(vaultName);
			}

			case 'root-folder': {
				const pathParts = this.centerFile.path.split('/');
				const rootFolder = pathParts.length > 1 ? pathParts[0] : '';
				return stringToMusicalKey(rootFolder || 'root');
			}

			case 'folder-path': {
				const depth = keySettings?.folderDepth ?? 0;
				const pathParts = this.centerFile.path.split('/');
				const folderAtDepth = depth < pathParts.length - 1 ? pathParts[depth] : pathParts[pathParts.length - 2] || '';
				return stringToMusicalKey(folderAtDepth || 'root');
			}

			case 'full-path': {
				const folderPath = this.centerFile.parent?.path || '';
				return stringToMusicalKey(folderPath || 'root');
			}

			case 'file-name': {
				return stringToMusicalKey(this.centerFile.basename);
			}

			case 'custom': {
				const customKey = keySettings?.customKey || 'C';
				// Validate that it's a valid root note
				return ROOT_NOTES.includes(customKey) ? customKey : 'C';
			}

			default:
				return 'C';
		}
	}


	/**
	 * Mark graph as up-to-date (just refreshed)
	 */
	private markAsUpToDate(): void {
		this.isStale = false;
		this.lastExtractionTime = Date.now();
		void this.updateStalenessIndicator();
	}

	/**
	 * Update staleness indicator UI
	 */
	private updateStalenessIndicator(): void {
		if (!this.stalenessIndicator) return;

		if (this.isStale) {
			this.stalenessIndicator.textContent = 'Graph data is stale';
			this.stalenessIndicator.addClass('stale');
			this.stalenessIndicator.removeClass('up-to-date');
		} else {
			this.stalenessIndicator.textContent = 'Up-to-date';
			this.stalenessIndicator.removeClass('stale');
			this.stalenessIndicator.addClass('up-to-date');
		}
	}

	/**
	 * Handle node open (left-click or context menu)
	 */
	private handleNodeOpen(node: LocalSoundscapeNode): void {
		logger.info('node-open', 'Opening note', { path: node.path });

		// Open the note in a new leaf
		const file = this.app.vault.getAbstractFileByPath(node.path);
		if (file instanceof TFile) {
			void this.app.workspace.getLeaf(false).openFile(file);
		}
	}

	/**
	 * Handle node re-center (context menu option)
	 */
	private async handleNodeRecenter(node: LocalSoundscapeNode): Promise<void> {
		logger.info('node-recenter', 'Re-centering soundscape', { path: node.path });

		const file = this.app.vault.getAbstractFileByPath(node.path);
		if (file instanceof TFile) {
			await this.setCenterFile(file);
		}
	}

	/**
	 * Extract graph data and render visualization
	 * Phase 1: Placeholder - will implement graph extraction and rendering
	 */
	private async extractAndRenderGraph(): Promise<void> {
		if (!this.centerFile) {
			void logger.warn('extract-graph', 'No center file set');
			return;
		}

		logger.info('extract-graph', 'Extracting graph data', {
			center: this.centerFile.path,
			depth: this.currentDepth,
			filtersActive: Object.values(this.filters).some(f => f && f.length > 0),
			clusteringMethod: this.clusteringMethod
		});

		// Apply filters and clustering to extractor
		this.extractor.setFilters(this.filters);
		this.extractor.setClusteringMethod(this.clusteringMethod);

		// Dispose existing renderer if it exists (we'll create a new one)
		if (this.renderer) {
			this.renderer.dispose();
			this.renderer = null;
		}

		// Clear existing graph
		this.graphContainer.empty();

		// Show loading indicator
		const loadingIndicator = this.graphContainer.createDiv({ cls: 'loading-indicator' });
		loadingIndicator.createEl('p', { text: 'Extracting graph data...' });

		try {
			// Configure rich metadata extraction if enabled in settings
			const enableRichMetadata = this.plugin.settings.localSoundscape?.enableRichMetadata ?? false;
			this.extractor.setRichMetadataExtraction(enableRichMetadata);

			// Extract graph data using MetadataCache
			this.graphData = await this.extractor.extractFromCenter(
				this.centerFile,
				this.currentDepth
			);

			logger.info('extract-success', 'Graph data extracted successfully', {
				totalNodes: this.graphData.stats.totalNodes,
				maxDepth: this.graphData.stats.maxDepth,
				centerNode: this.graphData.centerNode.basename
			});

			// Initialize variation history for this center note
			void this.initializeVariationHistory();

			// Clear loading indicator
			this.graphContainer.empty();

			// Display extraction stats in sidebar
			void this.displayGraphStats();

			// Get container dimensions - must be valid at this point
			const width = this.graphContainer.clientWidth;
			const height = this.graphContainer.clientHeight;

			if (width === 0 || height === 0) {
				logger.error('render-error', 'Container has no dimensions, cannot render', { width, height });
				const errorDiv = this.graphContainer.createDiv({ cls: 'error-message' });
				errorDiv.createEl('p', { text: 'Error: Container not ready. Please try connecting again.' });
				return;
			}

			// Always create a new renderer for each graph
			const rendererConfig: Partial<RendererConfig> = {
				width,
				height,
				nodeRadius: 8,
				showLabels: true,
				enableZoom: true,
				nodeSizeMode: this.nodeSizeMode
			};

			logger.info('renderer-init', 'Initializing renderer', { width, height });
			this.renderer = new LocalSoundscapeRenderer(this.graphContainer, rendererConfig);

			// Set up node interaction callbacks
			this.renderer.setCallbacks(
				(node) => this.handleNodeOpen(node),
				(node) => void this.handleNodeRecenter(node)
			);

			// Apply layout based on selected type
			if (this.layoutType === 'force') {
				void logger.info('apply-layout', 'Applying force-directed layout');
				const forceLayout = new ForceDirectedLayout({
					width,
					height,
					centerX: width / 2,
					centerY: height / 2
				});
				void forceLayout.applyLayout(this.graphData);
			}
			// Radial layout is applied by the renderer by default

			// Render the graph
			void logger.info('render-start', 'Starting graph render');
			this.renderer.render(this.graphData);
			void logger.info('render-complete', 'Graph render complete');

			// Mark as up-to-date after successful extraction
			void this.markAsUpToDate();

			// Update playback UI to enable Play button
			void this.updatePlaybackUI();

			// Auto-start audio if enabled
			if (this.plugin.settings.localSoundscape?.autoPlay && !this.isPlaying) {
				void logger.info('auto-start', 'Auto-starting audio playback');
				// Small delay to let rendering complete
				setTimeout(() => {
					void this.startPlayback();
				}, 500);
			}

			void logger.info('extract-complete', 'Graph extraction and rendering complete');

		} catch (error) {
			void logger.error('extract-error', 'Failed to extract graph', error as Error);

			this.graphContainer.empty();
			const errorDiv = this.graphContainer.createDiv({ cls: 'error-message' });
			errorDiv.createEl('p', { text: 'Failed to extract graph data' });
			errorDiv.createEl('p', {
				text: (error as Error).message,
				cls: 'error-details'
			});

			new Notice('Failed to extract graph data');
		}
	}

	/**
	 * Display graph statistics in sidebar
	 */
	private displayGraphStats(): void {
		if (!this.graphData) return;

		// Find the stats container (created in createSidebar)
		const statsContainer = this.sidebarContainer.querySelector('.sidebar-stats-container');
		if (!statsContainer) return;

		// Clear existing stats
		void statsContainer.empty();

		// Create collapsible section
		const statsHeader = statsContainer.createDiv({ cls: 'stats-header' });
		statsHeader.createEl('h4', { text: 'Graph Statistics' });

		const toggleButton = statsHeader.createEl('button', {
			cls: 'stats-toggle',
			attr: { 'aria-label': 'Toggle statistics' }
		});
		toggleButton.textContent = '▼'; // Down arrow (collapsed state)

		const statsContent = statsContainer.createDiv({ cls: 'stats-content collapsed' });

		const statsList = statsContent.createEl('ul', { cls: 'stats-list' });
		statsList.createEl('li', { text: `Nodes: ${this.graphData.stats.totalNodes}` });
		statsList.createEl('li', { text: `Links: ${this.graphData.stats.totalLinks}` });
		statsList.createEl('li', { text: `Incoming: ${this.graphData.stats.incomingCount}` });
		statsList.createEl('li', { text: `Outgoing: ${this.graphData.stats.outgoingCount}` });

		// Toggle collapse/expand
		statsHeader.addEventListener('click', () => {
			const isCollapsed = statsContent.classList.contains('collapsed');
			if (isCollapsed) {
				statsContent.classList.remove('collapsed');
				toggleButton.textContent = '▲'; // Up arrow (expanded state)
			} else {
				statsContent.classList.add('collapsed');
				toggleButton.textContent = '▼'; // Down arrow (collapsed state)
			}
		});
	}

	/**
	 * Toggle playback state
	 */
	private async togglePlayback(): Promise<void> {
		void logger.debug('ui-interaction', 'Play button clicked, toggling playback');
		logger.info('toggle-playback', 'Play button clicked', {
			hasGraphData: !!this.graphData,
			hasCenterFile: !!this.centerFile,
			isPlaying: this.isPlaying
		});

		if (!this.graphData || !this.centerFile) {
			void logger.warn('toggle-playback', 'No graph data or center file');
			new Notice('Please open a note in Local Soundscape first');
			return;
		}

		if (this.isPlaying) {
			await this.pausePlayback();
		} else {
			await this.startPlayback();
		}
	}

	/**
	 * Start audio playback
	 */
	private async startPlayback(): Promise<void> {
		if (!this.graphData || !this.plugin.audioEngine) {
			logger.warn('playback-start', 'Cannot start playback - missing required components', {
				hasGraphData: !!this.graphData,
				hasAudioEngine: !!this.plugin.audioEngine
			});
			new Notice('Audio engine not available');
			return;
		}

		// Determine playback mode
		const playbackMode = this.plugin.settings.localSoundscape?.playbackMode || 'note-centric';

		logger.info('playback-start', 'Starting soundscape playback', { mode: playbackMode });

		try {
			// Initialize audio engine first
			const audioStatus = this.plugin.audioEngine.getStatus();
			if (!audioStatus.isInitialized) {
				void logger.info('audio-init', 'Initializing audio engine for playback');
				await this.plugin.audioEngine.initialize();
				void logger.info('audio-init', 'Audio engine initialized successfully');
			}

			// Route to appropriate playback system
			if (playbackMode === 'note-centric') {
				await this.startNoteCentricPlayback();
			} else {
				await this.startGraphCentricPlayback();
			}

		} catch (error) {
			void logger.error('playback-error', 'Failed to start playback', error as Error);
			new Notice(`Failed to start audio: ${error.message}`);
			this.isPlaying = false;
			void this.updatePlaybackUI();
		}
	}

	/**
	 * Start note-centric playback (generates musical phrases from prose)
	 */
	private async startNoteCentricPlayback(): Promise<void> {
		// Initialize note-centric mapper if needed
		if (!this.noteCentricMapper) {
			this.noteCentricMapper = new NoteCentricMapper(this.app, this.plugin.settings);
		}

		// Initialize player if needed
		if (!this.noteCentricPlayer) {
			this.noteCentricPlayer = new NoteCentricPlayer(this.plugin.audioEngine, this.plugin.settings);
		}

		// Generate note-centric mapping
		this.currentNoteCentricMapping = await this.noteCentricMapper.map(this.graphData);

		if (!this.currentNoteCentricMapping) {
			new Notice('Could not analyze center note for playback');
			void logger.warn('note-centric-playback', 'Failed to create note-centric mapping');
			return;
		}

		logger.info('note-centric-mapping-created', 'Created note-centric mapping', {
			phraseLength: this.currentNoteCentricMapping.centerPhrase.melody.length,
			embellishments: this.currentNoteCentricMapping.embellishments.length,
			contentType: this.currentNoteCentricMapping.proseAnalysis.contentType,
			tempo: this.currentNoteCentricMapping.centerPhrase.tempo
		});

		// Start playback
		this.isPlaying = true;
		void this.updatePlaybackUI();

		// Play the note-centric mapping
		await this.noteCentricPlayer.play(this.currentNoteCentricMapping);

		// Start continuous layers if enabled
		await this.startContinuousLayers();

		// Start UI update loop for voice count tracking
		void this.startNoteCentricUIUpdateLoop();

		new Notice(`Playing note-centric soundscape (${this.currentNoteCentricMapping.centerPhrase.melody.length} notes)`);
	}

	/**
	 * Start UI update loop for note-centric playback
	 */
	private startNoteCentricUIUpdateLoop(): void {
		void logger.debug('ui-update-loop', 'Starting UI update loop for note-centric playback');

		// Poll voice count every 100ms to keep UI synchronized
		const updateInterval = setInterval(() => {
			if (!this.isPlaying || !this.noteCentricPlayer) {
				logger.debug('ui-update-loop', 'Stopping UI update loop (not playing or no player)');
				clearInterval(updateInterval);
				return;
			}

			// Update voice count from player
			this.currentVoiceCount = this.noteCentricPlayer.getActiveVoiceCount();

			// Update visualization playback time
			if (this.visualizationManager) {
				const elapsedTime = this.noteCentricPlayer.getElapsedTime();
				this.visualizationManager.updatePlaybackTime(elapsedTime);
			}

			// Log periodically for debugging
			if (Math.random() < 0.1) {  // 10% of the time
				logger.debug('ui-update-poll', 'UI update poll', {
					voiceCount: this.currentVoiceCount,
					isPlaying: this.noteCentricPlayer.getIsPlaying()
				});
			}

			// Update UI
			if (this.voiceCountDisplay) {
				this.voiceCountDisplay.textContent = this.currentVoiceCount.toString();
			}

			// Check if playback finished (no more playing notes and player stopped)
			if (this.currentVoiceCount === 0 && !this.noteCentricPlayer.getIsPlaying()) {
				void logger.info('note-centric-complete', 'Note-centric playback completed naturally');
				clearInterval(updateInterval);
				this.isPlaying = false;
				void this.updatePlaybackUI();
			}
		}, 100);
	}

	/**
	 * Start graph-centric playback (traditional multi-node approach)
	 */
	private async startGraphCentricPlayback(): Promise<void> {
		if (!this.depthMapper) {
			void logger.warn('graph-centric-playback', 'Depth mapper not initialized');
			new Notice('Graph-centric playback not available');
			return;
		}

		// Create depth-based musical mappings
		this.currentMappings = await this.depthMapper.mapSoundscapeToMusic(this.graphData);

		// Debug: Log detailed timing information
		const timingDistribution = new Map<string, number>();
		this.currentMappings.forEach(m => {
			const roundedTiming = m.timing.toFixed(1);
			timingDistribution.set(roundedTiming, (timingDistribution.get(roundedTiming) || 0) + 1);
		});

		logger.info('mappings-created', 'Created depth-based musical mappings', {
			count: this.currentMappings.length,
			instruments: [...new Set(this.currentMappings.map(m => m.instrument))].join(', '),
			firstTenTimings: this.currentMappings.slice(0, 10).map(m => m.timing.toFixed(3)).join(', '),
			firstTenPitches: this.currentMappings.slice(0, 10).map(m => m.pitch.toFixed(2)).join(', '),
			timingDistribution: Array.from(timingDistribution.entries()).slice(0, 10).map(([t, count]) => `${t}s:${count}`).join(', ')
		});

		if (this.currentMappings.length === 0) {
			new Notice('No mappings created - check that instruments are enabled in Control Center');
			void logger.warn('playback-start', 'No mappings created from graph data');
			return;
		}

		// Play notes individually using setTimeout (like Sonic Graph does)
		// This bypasses the playback optimizer which was causing timing issues
		this.isPlaying = true;
		this.currentVoiceCount = this.currentMappings.length;
		this.currentVolume = 0.7; // Average volume

		void this.updatePlaybackUI();

		// Start visualization and time tracking
		Date.now();
		if (this.visualizationManager) {
			// Start visualization at time 0 - playback time will be updated in the polling loop
			this.visualizationManager.start(0);
			this.visualizationManager.updatePlaybackTime(0);

			logger.debug('playback-start', 'Visualization started at time 0 (will track elapsed time in polling loop)');
		}

		logger.info('playback-started', 'Soundscape playback started - using real-time polling loop', {
			voices: this.currentVoiceCount,
			totalDuration: this.currentMappings[this.currentMappings.length - 1].timing + 's',
			firstNoteTiming: this.currentMappings[0].timing + 's',
			lastNoteTiming: this.currentMappings[this.currentMappings.length - 1].timing + 's'
		});

		new Notice(`Playing ${this.currentVoiceCount} notes`);

		// Start real-time playback using single polling loop (memory-efficient pattern like main Sonic Graph)
		void this.startRealtimePlayback();

		// Start continuous layers if enabled
		await this.startContinuousLayers();
	}

	/**
	 * Pause audio playback
	 */
	private pausePlayback(): void {
		if (!this.plugin.audioEngine) {
			void logger.warn('playback-pause', 'Cannot pause - audio engine not available');
			return;
		}

		void logger.info('playback-pause', 'Pausing soundscape playback');

		// Clear the realtime polling loop
		if (this.realtimeTimer !== null) {
			clearInterval(this.realtimeTimer);
			this.realtimeTimer = null;
		}

		// Clear active highlight tracking (no timeouts to clear!)
		this.activeHighlights.clear();

		// Clear visual highlights
		if (this.renderer) {
			this.renderer.clearAllPlayingHighlights();
		}

		// Stop the audio engine (AudioEngine doesn't have a pause method, so we stop)
		this.plugin.audioEngine.stop();
		this.isPlaying = false;
		void this.updatePlaybackUI();

		void logger.info('playback-paused', 'Soundscape playback paused');
	}

	/**
	 * Stop audio playback
	 */
	private stopPlayback(): void {
		if (!this.plugin.audioEngine) {
			void logger.warn('playback-stop', 'Cannot stop - audio engine not available');
			return;
		}

		void logger.info('playback-stop', 'Stopping soundscape playback');

		// Stop note-centric player if active
		if (this.noteCentricPlayer && this.noteCentricPlayer.getIsPlaying()) {
			this.noteCentricPlayer.stop();
		}

		// Clear the realtime polling loop (for graph-centric mode)
		if (this.realtimeTimer !== null) {
			clearInterval(this.realtimeTimer);
			this.realtimeTimer = null;
		}

		// Clear active highlight tracking (no timeouts to clear!)
		this.activeHighlights.clear();

		// Clear visual highlights
		if (this.renderer) {
			this.renderer.clearAllPlayingHighlights();
		}

		// Stop audio engine playback
		this.plugin.audioEngine.stop();

		// Stop continuous layers if running
		void this.stopContinuousLayers();

		// Clear mappings and reset state
		this.currentMappings = [];
		this.isPlaying = false;
		this.currentVoiceCount = 0;
		this.currentVolume = 0;
		this.nextNoteIndex = 0; // Reset note tracking
		void this.updatePlaybackUI();

		// Stop visualization
		if (this.visualizationManager) {
			this.visualizationManager.stop();
			void logger.debug('playback-stop', 'Visualization stopped');
		}

		void logger.info('playback-stopped', 'Soundscape playback stopped');
	}

	/**
	 * Start continuous audio layers if enabled in settings
	 */
	private async startContinuousLayers(): Promise<void> {
		// Check if continuous layers are enabled
		const layersEnabled = this.plugin.settings.localSoundscape?.continuousLayers?.enabled;
		if (!layersEnabled) {
			void logger.debug('layers', 'Continuous layers disabled in settings');
			return;
		}

		void logger.info('layers', 'Starting continuous layers for Local Soundscape');

		try {
			// Lazy-load ContinuousLayerManager
			if (!this.continuousLayerManager) {
				const { ContinuousLayerManager } = await import('../audio/layers/ContinuousLayerManager');

				// Build config from Local Soundscape settings
				const layerSettings = this.plugin.settings.localSoundscape.continuousLayers;
				const musicalEnhancements = this.plugin.settings.localSoundscape.musicalEnhancements;

				const layerConfig = {
					enabled: layerSettings.enabled,
					genre: 'ambient' as const, // Default to ambient for Local Soundscape
					intensity: layerSettings.intensity || 0.5,
					evolutionRate: 0.3,
					baseVolume: layerSettings.volume || -12,
					adaptiveIntensity: false, // Don't adapt to vault size for Local Soundscape
					rhythmicEnabled: layerSettings.rhythmicEnabled || false,
					harmonicEnabled: layerSettings.harmonicEnabled !== false, // Default true
					ambientEnabled: layerSettings.ambientEnabled !== false, // Default true
					// Pass musical context from Musical Enhancements
					scale: musicalEnhancements?.scaleQuantization?.scale || 'major',
					key: musicalEnhancements?.scaleQuantization?.rootNote || 'C'
				};

				this.continuousLayerManager = new ContinuousLayerManager(
					this.plugin.settings,
					layerConfig
				);

				await this.continuousLayerManager.initialize();
				void logger.info('layers', 'ContinuousLayerManager initialized', layerConfig);
			}

			// Start playback
			await this.continuousLayerManager.start();
			void logger.info('layers', 'Continuous layers started successfully');

		} catch (error) {
			void logger.error('layers', 'Failed to start continuous layers', error as Error);
			// Don't block main playback if layers fail
		}
	}

	/**
	 * Stop continuous audio layers
	 */
	private stopContinuousLayers(): void {
		if (!this.continuousLayerManager) {
			return;
		}

		try {
			void this.continuousLayerManager.stop();
			void logger.info('layers', 'Continuous layers stopped');
		} catch (error) {
			void logger.error('layers', 'Error stopping continuous layers', error as Error);
		}
	}

	/**
	 * Start real-time playback using single polling loop (memory-efficient pattern)
	 * This replaces the previous approach of creating 187 setTimeout callbacks upfront
	 */
	private startRealtimePlayback(): void {
		const { getContext } = require('tone');

		logger.info('playback', 'Starting real-time polling loop for Local Soundscape', {
			noteCount: this.currentMappings.length,
			maxDuration: this.currentMappings.length > 0
				? Math.max(...this.currentMappings.map(m => m.timing + m.duration))
				: 0
		});

		// Clear any existing timer
		if (this.realtimeTimer !== null) {
			clearInterval(this.realtimeTimer);
		}

		// Reset playback tracking
		this.nextNoteIndex = 0;
		this.realtimeStartTime = getContext().currentTime;

		// Start the audio context if suspended
		if (getContext().state === 'suspended') {
			getContext().resume();
			void logger.debug('context', 'Resumed suspended audio context for Local Soundscape playback');
		}

		// Use 100ms polling interval for responsive note triggering
		// (400ms works for main Sonic Graph with dense sequences, 100ms better for Local Soundscape with sparser notes)
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

			// Update visualization playback time to track current audio time
			if (this.visualizationManager) {
				this.visualizationManager.updatePlaybackTime(elapsedTime);
			}

			// Find notes that should play NOW (trigger when their time has arrived)
			while (this.nextNoteIndex < this.currentMappings.length) {
				const mapping = this.currentMappings[this.nextNoteIndex];

				// Check if this note's time has arrived (with small tolerance for timing precision)
				const tolerance = 0.05; // 50ms tolerance
				if (mapping.timing <= elapsedTime + tolerance) {
					// Move to next note FIRST to prevent re-triggering on next poll
					const noteIndex = this.nextNoteIndex;
					this.nextNoteIndex++;

					logger.debug('note-play', 'Triggering note from polling loop', {
						index: noteIndex,
						total: this.currentMappings.length,
						nodeId: mapping.nodeId,
						scheduledTiming: mapping.timing.toFixed(3),
						actualElapsed: elapsedTime.toFixed(3),
						timingDiff: (elapsedTime - mapping.timing).toFixed(3),
						instrument: mapping.instrument,
						pitch: mapping.pitch.toFixed(2)
					});

					// Trigger the note immediately (polling loop ensures we trigger "just in time")
					void this.playNoteFromPollingLoop(mapping, currentTime, elapsedTime);
				} else {
					// No more notes ready to play yet, break until next poll
					break;
				}
			}

			// Clean up expired highlights (replaces setTimeout approach!)
			if (this.renderer && this.pulsePlayingNodes) {
				for (const [nodeId, endTime] of this.activeHighlights.entries()) {
					if (currentTime >= endTime) {
						this.renderer.unhighlightPlayingNode(nodeId);
						this.activeHighlights.delete(nodeId);
					}
				}
			}

			// Check if playback is complete
			if (this.nextNoteIndex >= this.currentMappings.length) {
				// All notes triggered, check if we should stop
				const lastNote = this.currentMappings[this.currentMappings.length - 1];
				const playbackComplete = elapsedTime > (lastNote.timing + lastNote.duration + 0.5); // Add 0.5s buffer

				if (playbackComplete) {
					void logger.info('playback-complete', 'Local Soundscape playback completed');
					void this.stopPlayback();
				}
			}
		}, 100); // 100ms polling interval

		void logger.info('playback-loop-started', 'Real-time polling loop started');
	}

	/**
	 * Play a single note from the polling loop (triggers immediately)
	 * No setTimeout needed - polling loop handles unhighlighting!
	 */
	private async playNoteFromPollingLoop(mapping: DepthMapping, currentTime: number, elapsedTime: number): Promise<void> {
		try {
			// Highlight node as playing (only if pulse is enabled)
			if (this.renderer && this.pulsePlayingNodes) {
				this.renderer.highlightPlayingNode(mapping.nodeId);

				// Track when this highlight should end (polling loop will clean it up)
				const endTime = currentTime + mapping.duration;
				this.activeHighlights.set(mapping.nodeId, endTime);
			}

			// Use the note's scheduled timing for visualization so notes appear at their intended position
			const visualTimestamp = mapping.timing;

			logger.debug('viz-timestamp', 'Note timestamp', {
				mappingTiming: mapping.timing.toFixed(3),
				elapsedTime: elapsedTime.toFixed(3),
				visualTimestamp: visualTimestamp.toFixed(3),
				pitch: mapping.pitch.toFixed(1)
			});

			// Check if this mapping has chord voicing (Phase 2)
			if (mapping.isChordVoiced && mapping.chordFrequencies && mapping.chordFrequencies.length > 1) {
				// Play all voices in the chord
				const voiceVelocity = mapping.velocity * 0.8; // Reduce per-voice volume to prevent clipping

				for (const voiceFrequency of mapping.chordFrequencies) {
					await this.plugin.audioEngine.playNoteImmediate({
						pitch: voiceFrequency,
						duration: mapping.duration,
						velocity: voiceVelocity,
						instrument: mapping.instrument
					}, visualTimestamp, mapping.nodeId);
				}

				logger.debug('polyphonic-playback', `Played chord with ${mapping.voiceCount} voices`, {
					nodeId: mapping.nodeId,
					rootPitch: mapping.pitch.toFixed(2),
					voices: mapping.chordFrequencies.map(f => f.toFixed(2)).join(', ')
				});
			} else {
				// Play single note (monophonic fallback)
				await this.plugin.audioEngine.playNoteImmediate({
					pitch: mapping.pitch,
					duration: mapping.duration,
					velocity: mapping.velocity,
					instrument: mapping.instrument
				}, visualTimestamp, mapping.nodeId);
			}

		} catch (error) {
			logger.warn('note-playback-error', 'Failed to play note from polling loop', {
				nodeId: mapping.nodeId,
				error: (error as Error).message
			});
		}
	}

	/**
	 * Update playback UI based on current state
	 */
	private updatePlaybackUI(): void {
		if (!this.playButton || !this.stopButton) return;

		if (this.isPlaying) {
			// Update play button to show pause icon
			this.playButton.empty();
			const pauseIcon = createLucideIcon('pause', 20);
			this.playButton.appendChild(pauseIcon);
			this.playButton.appendChild(createSpan({ text: 'Pause' }));
			this.playButton.classList.add('playing');
			this.stopButton.removeAttribute('disabled');

			// Enable export button when playing (so user can export current soundscape)
			if (this.exportAudioButton) {
				this.exportAudioButton.removeAttribute('disabled');
			}
		} else {
			// Update play button to show play icon
			this.playButton.empty();
			const playIcon = createLucideIcon('play', 20);
			this.playButton.appendChild(playIcon);
			this.playButton.appendChild(createSpan({ text: 'Play' }));
			this.playButton.classList.remove('playing');

			// Enable Play button if we have graph data with nodes, disable if no data
			if (this.graphData && this.graphData.allNodes.length > 0) {
				this.playButton.removeAttribute('disabled');
			} else {
				this.playButton.setAttribute('disabled', '');
			}

			// Stop button should be disabled when not playing
			this.stopButton.setAttribute('disabled', '');

			// Export button enabled if we have mappings from either playback mode
			if (this.exportAudioButton) {
				const hasGraphCentricData = this.currentMappings && this.currentMappings.length > 0;
				const hasNoteCentricData = this.currentNoteCentricMapping !== null;

				if (hasGraphCentricData || hasNoteCentricData) {
					this.exportAudioButton.removeAttribute('disabled');
				} else {
					this.exportAudioButton.setAttribute('disabled', '');
				}
			}

			// Variation buttons enabled if we have graph data
			if (this.rerollButton) {
				if (this.graphData && this.graphData.allNodes.length > 0) {
					this.rerollButton.removeAttribute('disabled');
				} else {
					this.rerollButton.setAttribute('disabled', '');
				}
			}
			if (this.prevVariationButton) {
				if (this.graphData && this.graphData.allNodes.length > 0 && this.currentVariationIndex > 0) {
					this.prevVariationButton.removeAttribute('disabled');
				} else {
					this.prevVariationButton.setAttribute('disabled', '');
				}
			}
		}

		// Update voice count and volume displays
		if (this.voiceCountDisplay) {
			this.voiceCountDisplay.textContent = this.currentVoiceCount.toString();
		}
		if (this.volumeDisplay) {
			this.volumeDisplay.textContent = `${Math.round(this.currentVolume * 100)}%`;
		}
	}

	/**
	 * Get current view state for persistence
	 */
	getState(): LocalSoundscapeViewState {
		return {
			centerFilePath: this.centerFile?.path || null,
			currentDepth: this.currentDepth,
			isPlaying: false // Will be implemented in Phase 2
		};
	}

	/**
	 * Restore view state from persistence
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic type required for flexible API
	async setState(state: LocalSoundscapeViewState, result: any): Promise<void> {
		void logger.info('set-state', 'Restoring view state', state);

		if (state.currentDepth) {
			this.currentDepth = state.currentDepth;
		}

		if (state.centerFilePath) {
			const file = this.app.vault.getAbstractFileByPath(state.centerFilePath);
			if (file instanceof TFile) {
				await this.setCenterFile(file);
			}
		}
	}

	/**
	 * Create filter icon using safe DOM API
	 */
	private createFilterIcon(container: HTMLElement): void {
		const svg = container.createSvg('svg', {
			attr: {
				xmlns: 'http://www.w3.org/2000/svg',
				width: '16',
				height: '16',
				viewBox: '0 0 24 24',
				fill: 'none',
				stroke: 'currentColor',
				'stroke-width': '2',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round'
			}
		});
		svg.createSvg('polygon', {
			attr: { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' }
		});
	}

	/**
	 * Create refresh icon using safe DOM API
	 */
	private createRefreshIcon(container: HTMLElement): void {
		const svg = container.createSvg('svg', {
			attr: {
				xmlns: 'http://www.w3.org/2000/svg',
				width: '16',
				height: '16',
				viewBox: '0 0 24 24',
				fill: 'none',
				stroke: 'currentColor',
				'stroke-width': '2',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round'
			}
		});
		svg.createSvg('path', {
			attr: { d: 'M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2' }
		});
	}

	/**
	 * Create export icon using safe DOM API
	 */
	private createExportIcon(container: HTMLElement): void {
		const svg = container.createSvg('svg', {
			attr: {
				xmlns: 'http://www.w3.org/2000/svg',
				width: '16',
				height: '16',
				viewBox: '0 0 24 24',
				fill: 'none',
				stroke: 'currentColor',
				'stroke-width': '2',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round'
			}
		});
		svg.createSvg('path', {
			attr: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }
		});
		svg.createSvg('polyline', {
			attr: { points: '7 10 12 15 17 10' }
		});
		svg.createSvg('line', {
			attr: { x1: '12', y1: '15', x2: '12', y2: '3' }
		});
	}
}
