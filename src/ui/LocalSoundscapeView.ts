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
import { DepthBasedMapper, DepthMapping } from '../audio/mapping/DepthBasedMapper';
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
	private currentMappings: DepthMapping[] = [];

	// Audio state
	private isPlaying: boolean = false;
	private currentVoiceCount: number = 0;
	private currentVolume: number = 0;
	private scheduledTimeouts: number[] = []; // Store timeout IDs for cleanup

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

	// Staleness tracking
	private lastExtractionTime: number = 0;
	private isStale: boolean = false;
	private stalenessIndicator: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: SonigraphPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.extractor = new LocalSoundscapeExtractor(this.app);

		// Initialize DepthBasedMapper if we have a musical mapper
		if (this.plugin.musicalMapper) {
			this.depthMapper = new DepthBasedMapper(
				this.plugin.settings.localSoundscape || {}, // Use settings from Control Center
				this.plugin.musicalMapper,
				this.app,
				this.plugin.audioEngine // Pass audio engine for enabled instruments
			);
			logger.info('view-init', 'DepthBasedMapper initialized with Control Center settings and enabled instruments');
		} else {
			logger.warn('view-init', 'MusicalMapper not available, audio will not work');
		}

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

		// Ensure container has height (ItemView sometimes doesn't set this automatically)
		if (!container.style.height) {
			container.style.height = '100%';
		}

		// Create main layout structure
		this.createLayout();

		// Register metadata change listener for staleness detection
		this.registerEvent(
			this.app.metadataCache.on('changed', () => {
				this.markAsStale();
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
			this.showPlaceholder();
		}
	}

	async onClose(): Promise<void> {
		logger.info('view-close', 'Closing Local Soundscape view');

		// Stop audio playback
		if (this.isPlaying && this.plugin.audioEngine) {
			this.plugin.audioEngine.stop();
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

		// Staleness indicator
		this.stalenessIndicator = controlsSection.createDiv({
			cls: 'staleness-indicator up-to-date',
			text: 'Up-to-date'
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
		logger.info('create-playback-controls', 'Creating playback controls', {
			containerExists: !!container,
			containerClass: container.className
		});

		// Playback buttons section
		const buttonSection = container.createDiv({ cls: 'playback-buttons' });
		logger.debug('playback-buttons-created', 'Button section created');

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

		logger.warn('leaf-timeout', 'Workspace leaf not ready after timeout');
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
			logger.info('set-depth', 'Stopping playback for depth change');
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
		logger.info('refresh', 'Refreshing graph');

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
				this.markAsUpToDate();

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
	 * Mark graph as stale (vault data has changed)
	 */
	private markAsStale(): void {
		// Only mark as stale if we have graph data and enough time has passed since extraction
		if (!this.graphData || !this.lastExtractionTime) {
			logger.debug('staleness', 'Skipping stale mark - no graph data or extraction time');
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
			this.updateStalenessIndicator();
			logger.info('staleness', 'Graph marked as stale', {
				timeSinceExtraction: `${(timeSinceExtraction / 1000).toFixed(1)}s`
			});
		}
	}

	/**
	 * Mark graph as up-to-date (just refreshed)
	 */
	private markAsUpToDate(): void {
		this.isStale = false;
		this.lastExtractionTime = Date.now();
		this.updateStalenessIndicator();
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
			this.app.workspace.getLeaf(false).openFile(file);
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
			logger.warn('extract-graph', 'No center file set');
			return;
		}

		logger.info('extract-graph', 'Extracting graph data', {
			center: this.centerFile.path,
			depth: this.currentDepth
		});

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

			// Clear loading indicator
			this.graphContainer.empty();

			// Display extraction stats in sidebar
			this.displayGraphStats();

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
				enableZoom: true
			};

			logger.info('renderer-init', 'Initializing renderer', { width, height });
			this.renderer = new LocalSoundscapeRenderer(this.graphContainer, rendererConfig);

			// Set up node interaction callbacks
			this.renderer.setCallbacks(
				(node) => this.handleNodeOpen(node),
				(node) => this.handleNodeRecenter(node)
			);

			// Render the graph
			logger.info('render-start', 'Starting graph render');
			this.renderer.render(this.graphData);
			logger.info('render-complete', 'Graph render complete');

			// Mark as up-to-date after successful extraction
			this.markAsUpToDate();

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
		console.log('🔵 PLAY BUTTON CLICKED - togglePlayback called');
		logger.info('toggle-playback', 'Play button clicked', {
			hasGraphData: !!this.graphData,
			hasCenterFile: !!this.centerFile,
			isPlaying: this.isPlaying
		});

		if (!this.graphData || !this.centerFile) {
			logger.warn('toggle-playback', 'No graph data or center file');
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
		if (!this.graphData || !this.depthMapper || !this.plugin.audioEngine) {
			logger.warn('playback-start', 'Cannot start playback - missing required components', {
				hasGraphData: !!this.graphData,
				hasDepthMapper: !!this.depthMapper,
				hasAudioEngine: !!this.plugin.audioEngine
			});
			new Notice('Audio engine not available');
			return;
		}

		logger.info('playback-start', 'Starting soundscape playback');

		try {
			// Initialize audio engine first
			const audioStatus = this.plugin.audioEngine.getStatus();
			if (!audioStatus.isInitialized) {
				logger.info('audio-init', 'Initializing audio engine for playback');
				await this.plugin.audioEngine.initialize();
				logger.info('audio-init', 'Audio engine initialized successfully');
			}

			// Create depth-based musical mappings
			this.currentMappings = await this.depthMapper.mapSoundscapeToMusic(this.graphData);

			logger.info('mappings-created', 'Created depth-based musical mappings', {
				count: this.currentMappings.length,
				instruments: [...new Set(this.currentMappings.map(m => m.instrument))].join(', ')
			});

			if (this.currentMappings.length === 0) {
				new Notice('No mappings created - check that instruments are enabled in Control Center');
				logger.warn('playback-start', 'No mappings created from graph data');
				return;
			}

			// Play notes individually using setTimeout (like Sonic Graph does)
			// This bypasses the playback optimizer which was causing timing issues
			this.isPlaying = true;
			this.currentVoiceCount = this.currentMappings.length;
			this.currentVolume = 0.7; // Average volume

			this.updatePlaybackUI();

			logger.info('playback-started', 'Soundscape playback started - scheduling notes', {
				voices: this.currentVoiceCount,
				totalDuration: this.currentMappings[this.currentMappings.length - 1].timing + 's',
				firstNoteTiming: this.currentMappings[0].timing + 's',
				lastNoteTiming: this.currentMappings[this.currentMappings.length - 1].timing + 's'
			});

			new Notice(`Playing ${this.currentVoiceCount} notes`);

			// Schedule each note to play at its designated time
			for (let i = 0; i < this.currentMappings.length; i++) {
				const mapping = this.currentMappings[i];
				const timeoutId = window.setTimeout(async () => {
					if (!this.isPlaying) {
						logger.debug('note-skip', 'Skipping note - playback stopped', { index: i, nodeId: mapping.nodeId });
						return;
					}

					logger.debug('note-play', 'Playing note', {
						index: i,
						total: this.currentMappings.length,
						nodeId: mapping.nodeId,
						timing: mapping.timing,
						instrument: mapping.instrument,
						pitch: mapping.pitch.toFixed(2)
					});

					try {
						await this.plugin.audioEngine.playNoteImmediate({
							pitch: mapping.pitch,
							duration: mapping.duration,
							velocity: mapping.velocity,
							instrument: mapping.instrument
						}, mapping.timing, mapping.nodeId);
					} catch (error) {
						logger.warn('note-playback-error', 'Failed to play note', {
							index: i,
							nodeId: mapping.nodeId,
							error: (error as Error).message
						});
					}
				}, mapping.timing * 1000); // Convert seconds to milliseconds

				this.scheduledTimeouts.push(timeoutId);
			}

			logger.info('notes-scheduled', `Scheduled ${this.scheduledTimeouts.length} notes for playback`);

		} catch (error) {
			logger.error('playback-error', 'Failed to start playback', error as Error);
			new Notice(`Failed to start audio: ${error.message}`);
			this.isPlaying = false;
			this.updatePlaybackUI();
		}
	}

	/**
	 * Pause audio playback
	 */
	private async pausePlayback(): Promise<void> {
		if (!this.plugin.audioEngine) {
			logger.warn('playback-pause', 'Cannot pause - audio engine not available');
			return;
		}

		logger.info('playback-pause', 'Pausing soundscape playback');

		// Clear all scheduled timeouts
		for (const timeoutId of this.scheduledTimeouts) {
			window.clearTimeout(timeoutId);
		}
		this.scheduledTimeouts = [];

		// Stop the audio engine (AudioEngine doesn't have a pause method, so we stop)
		this.plugin.audioEngine.stop();
		this.isPlaying = false;
		this.updatePlaybackUI();

		logger.info('playback-paused', 'Soundscape playback paused');
	}

	/**
	 * Stop audio playback
	 */
	private async stopPlayback(): Promise<void> {
		if (!this.plugin.audioEngine) {
			logger.warn('playback-stop', 'Cannot stop - audio engine not available');
			return;
		}

		logger.info('playback-stop', 'Stopping soundscape playback');

		// Clear all scheduled timeouts
		for (const timeoutId of this.scheduledTimeouts) {
			window.clearTimeout(timeoutId);
		}
		this.scheduledTimeouts = [];

		// Stop audio engine playback
		this.plugin.audioEngine.stop();

		// Clear mappings and reset state
		this.currentMappings = [];
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
