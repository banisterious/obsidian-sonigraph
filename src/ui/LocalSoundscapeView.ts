/**
 * LocalSoundscapeView
 *
 * An ItemView for displaying and interacting with local graph soundscapes.
 * Shows connections around a center note in a radial layout with depth-based audio mapping.
 *
 * Phase 1: Basic view and rendering with radial layout
 * Phase 2: Audio integration with depth-based mapping
 */

import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { getLogger } from '../logging';
import { LocalSoundscapeExtractor, LocalSoundscapeData } from '../graph/LocalSoundscapeExtractor';
import { LocalSoundscapeRenderer, RendererConfig } from '../graph/LocalSoundscapeRenderer';
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

	// Audio state
	private isPlaying: boolean = false;
	private currentVoiceCount: number = 0;
	private currentVolume: number = 0;

	// UI containers
	private containerEl: HTMLElement;
	private headerContainer: HTMLElement;
	private graphContainer: HTMLElement;
	private sidebarContainer: HTMLElement;
	private playbackContentContainer: HTMLElement | null = null;

	// Playback controls
	private playButton: HTMLButtonElement | null = null;
	private stopButton: HTMLButtonElement | null = null;
	private voiceCountDisplay: HTMLElement | null = null;
	private volumeDisplay: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: SonigraphPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.extractor = new LocalSoundscapeExtractor(this.app);

		logger.info('view-init', 'LocalSoundscapeView initialized');
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
		logger.info('view-open', 'Opening Local Soundscape view');

		const container = this.containerEl;
		container.empty();
		container.addClass('local-soundscape-view');

		// Create main layout structure
		this.createLayout();

		// Initialize with active file if available
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			await this.setCenterFile(activeFile);
		} else {
			this.showPlaceholder();
		}
	}

	async onClose(): Promise<void> {
		logger.info('view-close', 'Closing Local Soundscape view');

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

		// Header section (top bar with controls)
		this.headerContainer = mainContainer.createDiv({ cls: 'local-soundscape-header' });
		this.createHeader();

		// Content area (graph + sidebar)
		const contentContainer = mainContainer.createDiv({ cls: 'local-soundscape-content' });

		// Graph canvas area
		this.graphContainer = contentContainer.createDiv({ cls: 'local-soundscape-graph' });

		// Sidebar panel
		this.sidebarContainer = contentContainer.createDiv({ cls: 'local-soundscape-sidebar' });
		this.createSidebar();

		logger.debug('layout-created', 'Layout structure created');
	}

	/**
	 * Create header with title and controls
	 */
	private createHeader(): void {
		const header = this.headerContainer;

		// Title section
		const titleSection = header.createDiv({ cls: 'header-title-section' });
		const title = titleSection.createEl('h3', {
			text: 'Local Soundscape',
			cls: 'header-title'
		});

		// Center note name (will be updated dynamically)
		const centerNoteName = titleSection.createDiv({
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
			this.setDepth(newDepth);
		});

		// Refresh button
		const refreshButton = controlsSection.createEl('button', {
			cls: 'header-button refresh-button',
			attr: { 'aria-label': 'Refresh graph' }
		});
		refreshButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>';
		refreshButton.addEventListener('click', () => {
			this.refresh();
		});

		logger.debug('header-created', 'Header created with controls');
	}

	/**
	 * Create sidebar with tabs
	 */
	private createSidebar(): void {
		const sidebar = this.sidebarContainer;

		// Tab navigation
		const tabsContainer = sidebar.createDiv({ cls: 'sidebar-tabs' });

		const playbackTab = tabsContainer.createEl('button', {
			text: 'Playback',
			cls: 'sidebar-tab active',
			attr: { 'data-tab': 'playback' }
		});

		const settingsTab = tabsContainer.createEl('button', {
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
		this.createPlaybackControls(playbackContent as HTMLElement);

		// Populate settings tab (placeholder for now)
		settingsContent.createDiv({
			cls: 'placeholder-message',
			text: 'Settings will appear here'
		});

		logger.debug('sidebar-created', 'Sidebar created with tabs');
	}

	/**
	 * Create playback controls in sidebar
	 */
	private createPlaybackControls(container: HTMLElement): void {
		// Playback buttons section
		const buttonSection = container.createDiv({ cls: 'playback-buttons' });

		// Play/Pause button
		this.playButton = buttonSection.createEl('button', {
			cls: 'playback-button play-button',
			attr: { 'aria-label': 'Play soundscape' }
		});
		this.playButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polygon points="5 3 19 12 5 21 5 3"></polygon>
			</svg>
			<span>Play</span>
		`;
		this.playButton.addEventListener('click', () => this.togglePlayback());

		// Stop button
		this.stopButton = buttonSection.createEl('button', {
			cls: 'playback-button stop-button',
			attr: { 'aria-label': 'Stop soundscape', 'disabled': '' }
		});
		this.stopButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="18" height="18"></rect>
			</svg>
			<span>Stop</span>
		`;
		this.stopButton.addEventListener('click', () => this.stopPlayback());

		// Voice count and volume display
		const statsSection = container.createDiv({ cls: 'playback-stats' });

		const voiceCountContainer = statsSection.createDiv({ cls: 'stat-item' });
		voiceCountContainer.createSpan({ text: 'Active Voices:', cls: 'stat-label' });
		this.voiceCountDisplay = voiceCountContainer.createSpan({
			text: '0',
			cls: 'stat-value voice-count'
		});

		const volumeContainer = statsSection.createDiv({ cls: 'stat-item' });
		volumeContainer.createSpan({ text: 'Volume:', cls: 'stat-label' });
		this.volumeDisplay = volumeContainer.createSpan({
			text: '0%',
			cls: 'stat-value volume-level'
		});

		logger.debug('playback-controls-created', 'Playback controls initialized');
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

		this.centerFile = file;

		// Update title
		const centerNoteName = this.headerContainer.querySelector('.center-note-name');
		if (centerNoteName) {
			centerNoteName.textContent = file.basename;
		}

		// Extract and render graph (Phase 1 task - to be implemented)
		await this.extractAndRenderGraph();
	}

	/**
	 * Set the depth level
	 */
	private setDepth(depth: number): void {
		if (depth === this.currentDepth) return;

		logger.info('set-depth', 'Setting depth', { oldDepth: this.currentDepth, newDepth: depth });
		this.currentDepth = depth;

		// Dispose renderer so it gets recreated with new data
		if (this.renderer) {
			this.renderer.dispose();
			this.renderer = null;
		}

		// Re-extract and render graph with new depth
		if (this.centerFile) {
			this.extractAndRenderGraph();
		}
	}

	/**
	 * Refresh the graph
	 */
	private refresh(): void {
		logger.info('refresh', 'Refreshing graph');

		if (this.centerFile) {
			this.extractAndRenderGraph();
		} else {
			new Notice('No note selected');
		}
	}

	/**
	 * Extract graph data and render visualization
	 * Phase 1: Placeholder - will implement graph extraction and rendering
	 */
	private async extractAndRenderGraph(): Promise<void> {
		if (!this.centerFile) {
			logger.warn('extract-graph', 'No center file set');
			return;
		}

		logger.info('extract-graph', 'Extracting graph data', {
			center: this.centerFile.path,
			depth: this.currentDepth
		});

		// Clear existing graph
		this.graphContainer.empty();

		// Show loading indicator
		const loadingIndicator = this.graphContainer.createDiv({ cls: 'loading-indicator' });
		loadingIndicator.createEl('p', { text: 'Extracting graph data...' });

		try {
			// Extract graph data using MetadataCache
			this.graphData = await this.extractor.extractFromCenter(
				this.centerFile,
				this.currentDepth
			);

			// Clear loading indicator
			this.graphContainer.empty();

			// Display extraction stats in sidebar
			this.displayGraphStats();

			// Initialize renderer if not already created
			if (!this.renderer) {
				const rendererConfig: Partial<RendererConfig> = {
					width: this.graphContainer.clientWidth || 800,
					height: this.graphContainer.clientHeight || 600,
					nodeRadius: 8,
					showLabels: true,
					enableZoom: true
				};
				this.renderer = new LocalSoundscapeRenderer(this.graphContainer, rendererConfig);
			}

			// Render the graph
			this.renderer.render(this.graphData);

			logger.info('extract-complete', 'Graph extraction and rendering complete');

		} catch (error) {
			logger.error('extract-error', 'Failed to extract graph', error as Error);

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
		if (!this.graphData || !this.playbackContentContainer) return;

		// Find or create stats section (don't clear the whole playback content!)
		let statsSection = this.playbackContentContainer.querySelector('.stats-section') as HTMLElement;

		if (!statsSection) {
			// Create stats section if it doesn't exist
			statsSection = this.playbackContentContainer.createDiv({ cls: 'stats-section' });
		} else {
			// Clear existing stats
			statsSection.empty();
		}

		statsSection.createEl('h4', { text: 'Graph Statistics' });

		const statsList = statsSection.createEl('ul', { cls: 'stats-list' });
		statsList.createEl('li', { text: `Nodes: ${this.graphData.stats.totalNodes}` });
		statsList.createEl('li', { text: `Links: ${this.graphData.stats.totalLinks}` });
		statsList.createEl('li', { text: `Incoming: ${this.graphData.stats.incomingCount}` });
		statsList.createEl('li', { text: `Outgoing: ${this.graphData.stats.outgoingCount}` });
	}

	/**
	 * Toggle playback state
	 */
	private async togglePlayback(): Promise<void> {
		if (!this.graphData || !this.centerFile) {
			logger.warn('toggle-playback', 'No graph data or center file');
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
		logger.info('playback-start', 'Starting soundscape playback');

		// TODO: Implement audio integration in next step
		// For now, just update UI state

		this.isPlaying = true;
		this.updatePlaybackUI();

		logger.info('playback-started', 'Soundscape playback started');
	}

	/**
	 * Pause audio playback
	 */
	private async pausePlayback(): Promise<void> {
		logger.info('playback-pause', 'Pausing soundscape playback');

		// TODO: Implement audio integration in next step

		this.isPlaying = false;
		this.updatePlaybackUI();

		logger.info('playback-paused', 'Soundscape playback paused');
	}

	/**
	 * Stop audio playback
	 */
	private async stopPlayback(): Promise<void> {
		logger.info('playback-stop', 'Stopping soundscape playback');

		// TODO: Implement audio integration in next step

		this.isPlaying = false;
		this.currentVoiceCount = 0;
		this.currentVolume = 0;
		this.updatePlaybackUI();

		logger.info('playback-stopped', 'Soundscape playback stopped');
	}

	/**
	 * Update playback UI based on current state
	 */
	private updatePlaybackUI(): void {
		if (!this.playButton || !this.stopButton) return;

		if (this.isPlaying) {
			// Update play button to show pause icon
			this.playButton.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="6" y="4" width="4" height="16"></rect>
					<rect x="14" y="4" width="4" height="16"></rect>
				</svg>
				<span>Pause</span>
			`;
			this.playButton.classList.add('playing');
			this.stopButton.removeAttribute('disabled');
		} else {
			// Update play button to show play icon
			this.playButton.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="5 3 19 12 5 21 5 3"></polygon>
				</svg>
				<span>Play</span>
			`;
			this.playButton.classList.remove('playing');

			if (this.currentVoiceCount === 0) {
				this.stopButton.setAttribute('disabled', '');
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
	async getState(): Promise<LocalSoundscapeViewState> {
		return {
			centerFilePath: this.centerFile?.path || null,
			currentDepth: this.currentDepth,
			isPlaying: false // Will be implemented in Phase 2
		};
	}

	/**
	 * Restore view state from persistence
	 */
	async setState(state: LocalSoundscapeViewState, result: any): Promise<void> {
		logger.info('set-state', 'Restoring view state', state);

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
}
