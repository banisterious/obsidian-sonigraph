/**
 * SonicGraphModal
 * 
 * A large modal for displaying and interacting with the temporal graph animation.
 * Features static graph view by default with play button to trigger animation.
 * Includes timeline controls, settings panel, and cross-navigation to Control Center.
 */

import { App, Modal, ButtonComponent, Notice } from 'obsidian';
import { GraphDataExtractor, GraphNode } from '../graph/GraphDataExtractor';
import { GraphRenderer } from '../graph/GraphRenderer';
import { TemporalGraphAnimator } from '../graph/TemporalGraphAnimator';
import { MusicalMapper } from '../graph/musical-mapper';
import { createLucideIcon } from './lucide-icons';
import { getLogger } from '../logging';
import { SonicGraphSettings } from '../utils/constants';
import * as d3 from 'd3';
import type SonigraphPlugin from '../main';

const logger = getLogger('SonicGraphModal');

export class SonicGraphModal extends Modal {
    private plugin: SonigraphPlugin;
    private graphDataExtractor: GraphDataExtractor;
    private graphRenderer: GraphRenderer | null = null;
    private temporalAnimator: TemporalGraphAnimator | null = null;
    private musicalMapper: MusicalMapper | null = null;
    private isAnimating: boolean = false;
    private isTimelineView: boolean = false; // false = Static View, true = Timeline View
    
    // Performance optimization: Event listener management
    private eventListeners: Array<{ element: Element | Document | Window, event: string, handler: EventListener }> = [];
    
    // Performance optimization: Settings debouncing
    private pendingSettingsUpdates = new Map<string, any>();
    private settingsUpdateTimeout: NodeJS.Timeout | null = null;
    
    // Performance optimization: Progress indicator
    private progressIndicator: HTMLElement | null = null;
    
    // UI elements
    private headerContainer: HTMLElement;
    private graphContainer: HTMLElement;
    private timelineContainer: HTMLElement;
    private controlsContainer: HTMLElement;
    private playButton: ButtonComponent;
    private statsContainer: HTMLElement;
    private speedSelect: HTMLSelectElement;
    private timelineScrubber: HTMLInputElement;
    private timelineInfo: HTMLElement;
    private viewModeBtn: HTMLButtonElement;
    private detectedSpacing: 'dense' | 'balanced' | 'sparse' = 'balanced';
    private settingsPanel: HTMLElement;
    private settingsButton: HTMLButtonElement;
    private isSettingsVisible: boolean = false;

    constructor(app: App, plugin: SonigraphPlugin) {
        super(app);
        logger.debug('ui', 'SonicGraphModal constructor started');
        
        this.plugin = plugin;
        logger.debug('ui', 'Plugin assigned');
        
        try {
            const excludeFolders = plugin.settings.sonicGraphExcludeFolders || [];
            const excludeFiles = plugin.settings.sonicGraphExcludeFiles || [];
            const filterSettings = this.getSonicGraphSettings().layout.filters;
            logger.debug('ui', 'Creating GraphDataExtractor with exclusions and filters:', { excludeFolders, excludeFiles, filterSettings });
            
            this.graphDataExtractor = new GraphDataExtractor(app.vault, app.metadataCache, {
                excludeFolders,
                excludeFiles,
                filterSettings
            });
            logger.debug('ui', 'GraphDataExtractor created successfully');
        } catch (error) {
            logger.error('ui', 'Failed to create GraphDataExtractor:', (error as Error).message);
            logger.error('ui', 'GraphDataExtractor error stack:', (error as Error).stack);
            throw error;
        }
        
        logger.debug('ui', 'SonicGraphModal constructor completed');
    }

    onOpen() {
        logger.info('sonic-graph-init', 'Modal onOpen() started');
        
        try {
            const { contentEl } = this;
            logger.info('sonic-graph-init', 'ContentEl acquired, emptying');
            contentEl.empty();
            logger.info('sonic-graph-init', 'ContentEl emptied successfully');
            
            // Add modal-specific classes
            logger.info('sonic-graph-init', 'Adding modal CSS classes');
            this.modalEl.addClass('sonic-graph-modal');
            
            // Create close button (positioned outside main container like Control Center)
            logger.info('sonic-graph-init', 'Creating close button');
            const closeButton = contentEl.createDiv({ cls: 'modal-close-button' });
            this.addEventListener(closeButton, 'click', () => this.close());
            
            // Create main modal container
            logger.info('sonic-graph-init', 'Creating modal container');
            const modalContainer = contentEl.createDiv({ cls: 'sonic-graph-modal-container' });
            
            // Create modal structure inside container
            logger.info('sonic-graph-init', 'Creating header');
            this.createHeader(modalContainer);
            logger.info('sonic-graph-init', 'Header created successfully');
            
            logger.info('sonic-graph-init', 'Creating main content');
            this.createMainContent(modalContainer);
            logger.info('sonic-graph-init', 'Main content created successfully');
            
            logger.info('sonic-graph-init', 'Creating timeline area');
            this.createTimelineArea(modalContainer);
            logger.info('sonic-graph-init', 'Timeline area created successfully');
            
            logger.info('sonic-graph-init', 'Creating controls area');
            this.createControlsArea(modalContainer);
            logger.info('sonic-graph-init', 'Controls area created successfully');
            
            // Initialize graph
            logger.info('sonic-graph-init', 'Starting graph initialization - THIS IS THE CRITICAL STEP');
            this.initializeGraph().catch(error => {
                logger.error('sonic-graph-init', 'Graph initialization failed:', error);
                new Notice('Failed to initialize Sonic Graph: ' + error.message);
            });
            
        } catch (error) {
            logger.error('ui', 'Error opening Sonic Graph modal:', (error as Error).message);
            logger.error('ui', 'Error stack:', (error as Error).stack);
            new Notice('Failed to open Sonic Graph modal: ' + (error as Error).message);
        }
    }

    onClose() {
        logger.debug('ui', 'Closing Sonic Graph modal');
        
        // Performance optimization: Cleanup all event listeners
        this.removeAllEventListeners();
        
        // Performance optimization: Clear any pending settings updates
        if (this.settingsUpdateTimeout) {
            clearTimeout(this.settingsUpdateTimeout);
            this.settingsUpdateTimeout = null;
        }
        this.pendingSettingsUpdates.clear();
        
        // Cleanup temporal animator
        if (this.temporalAnimator) {
            this.temporalAnimator.destroy();
            this.temporalAnimator = null;
        }
        
        // Cleanup graph renderer
        if (this.graphRenderer) {
            this.graphRenderer.destroy();
            this.graphRenderer = null;
        }
        
        // Reset animation state
        this.isAnimating = false;
        
        // Hide progress indicator
        this.hideProgressIndicator();
        
        const { contentEl } = this;
        contentEl.empty();
    }

    /**
     * Create modal header with title only (sticky)
     */
    private createHeader(container: HTMLElement): void {
        this.headerContainer = container.createDiv({ cls: 'sonic-graph-header' });
        
        // Simple title only
        const titleContainer = this.headerContainer.createDiv({ cls: 'sonic-graph-title-container' });
        titleContainer.createEl('h1', { text: 'Sonic Graph', cls: 'sonic-graph-title' });
    }

    /**
     * Create main content area with graph and settings panel
     */
    private createMainContent(container: HTMLElement): void {
        const mainContent = container.createDiv({ cls: 'sonic-graph-main-content' });
        
        // Graph area (left side)
        this.graphContainer = mainContent.createDiv({ cls: 'sonic-graph-container' });
        
        // Graph canvas
        const graphCanvas = this.graphContainer.createDiv({ cls: 'sonic-graph-canvas' });
        graphCanvas.id = 'sonic-graph-canvas';
        
        // Loading indicator
        const loadingIndicator = this.graphContainer.createDiv({ cls: 'sonic-graph-loading' });
        const loadingIcon = createLucideIcon('loader-2', 24);
        loadingIcon.addClass('sonic-graph-loading-icon');
        loadingIndicator.appendChild(loadingIcon);
        loadingIndicator.createSpan({ text: 'Loading graph...', cls: 'sonic-graph-loading-text' });
        
        // Settings panel (right side, initially hidden)
        this.settingsPanel = mainContent.createDiv({ cls: 'sonic-graph-settings-panel hidden' });
        this.createSettingsContent();
    }

    /**
     * Create timeline area (initially hidden)
     */
    private createTimelineArea(container: HTMLElement): void {
        this.timelineContainer = container.createDiv({ cls: 'sonic-graph-timeline' });
        		this.timelineContainer.classList.add('timeline-hidden'); // Hidden until animation starts
        
        // Timeline scrubber
        const scrubberContainer = this.timelineContainer.createDiv({ cls: 'sonic-graph-scrubber-container' });
        scrubberContainer.createEl('label', { text: 'Timeline', cls: 'sonic-graph-scrubber-label' });
        
        this.timelineScrubber = scrubberContainer.createEl('input', { 
            type: 'range',
            cls: 'sonic-graph-scrubber'
        });
        this.timelineScrubber.min = '0';
        this.timelineScrubber.max = '100';
        this.timelineScrubber.value = '0';
        this.addEventListener(this.timelineScrubber, 'input', () => this.handleTimelineScrub());
        
        // Unified timeline info with single timeline bar
        this.timelineInfo = this.timelineContainer.createDiv({ cls: 'sonic-graph-timeline-info' });
        
        // Single unified timeline track
        const timelineTrack = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-track-unified' });
        const timelineLine = timelineTrack.createDiv({ cls: 'sonic-graph-timeline-line-unified' });
        
        // Unified markers container that spans the timeline
        const markersContainer = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-markers' });
        // Markers will be populated dynamically
        
        // Current position indicator (spans both tracks) - hidden by default
        const currentIndicator = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-current-indicator' });
        currentIndicator.createEl('div', { cls: 'sonic-graph-timeline-current-line' });
        const currentLabel = currentIndicator.createEl('div', { cls: 'sonic-graph-timeline-current-label' });
        currentLabel.createSpan({ text: 'Current: —', cls: 'sonic-graph-timeline-current-year' });
        currentLabel.createSpan({ text: '0s', cls: 'sonic-graph-timeline-current-time' });
        
        // Hide current indicator by default - only show during animation
        currentIndicator.style.display = 'none';
    }

    /**
     * Create controls area with play button, stats, and navigation
     */
    private createControlsArea(container: HTMLElement): void {
        this.controlsContainer = container.createDiv({ cls: 'sonic-graph-controls' });
        
        // Left side - Play controls
        const playControls = this.controlsContainer.createDiv({ cls: 'sonic-graph-play-controls' });
        
        // Main play button
        const playButtonContainer = playControls.createDiv({ cls: 'sonic-graph-play-button-container' });
        this.playButton = new ButtonComponent(playButtonContainer);
        this.playButton
            .setButtonText('Play')
            .onClick(() => this.toggleAnimation());
        
        // Speed control
        const speedContainer = playControls.createDiv({ cls: 'sonic-graph-speed-container' });
        speedContainer.createEl('label', { text: 'Speed:', cls: 'sonic-graph-speed-label' });
        this.speedSelect = speedContainer.createEl('select', { cls: 'sonic-graph-speed-select' });
        const savedSpeed = this.plugin.settings.sonicGraphAnimationSpeed || 1.0;
        const savedSpeedString = `${savedSpeed}x`;
        ['0.1x', '0.25x', '0.5x', '1x', '2x', '5x', '10x', '20x', '50x'].forEach(speed => {
            const option = this.speedSelect.createEl('option', { text: speed, value: speed });
            if (speed === savedSpeedString) option.selected = true;
        });
        this.addEventListener(this.speedSelect, 'change', () => this.handleSpeedChange());
        
        // Center - Stats
        const statsControls = this.controlsContainer.createDiv({ cls: 'sonic-graph-stats-controls' });
        this.statsContainer = statsControls.createDiv({ cls: 'sonic-graph-stats' });
        this.updateStats();
        
        // Right side - View controls and navigation
        const viewControls = this.controlsContainer.createDiv({ cls: 'sonic-graph-view-controls' });
        
        // View mode toggle (Static/Timeline)
        const viewModeContainer = viewControls.createDiv({ cls: 'sonic-graph-view-mode-container' });
        this.viewModeBtn = viewModeContainer.createEl('button', { 
            cls: 'sonic-graph-control-btn sonic-graph-view-mode-btn' 
        });
        const viewModeIcon = createLucideIcon('eye', 16);
        this.viewModeBtn.appendChild(viewModeIcon);
        this.viewModeBtn.appendText('Static View');
        this.addEventListener(this.viewModeBtn, 'click', () => this.toggleViewMode());
        
        // Reset view button
        const resetViewBtn = viewControls.createEl('button', { 
            cls: 'sonic-graph-control-btn' 
        });
        const resetIcon = createLucideIcon('maximize-2', 16);
        resetViewBtn.appendChild(resetIcon);
        resetViewBtn.appendText('Reset View');
        resetViewBtn.addEventListener('click', () => this.resetGraphView());
        
        // Settings button
        this.settingsButton = viewControls.createEl('button', { 
            cls: 'sonic-graph-control-btn sonic-graph-control-btn--secondary' 
        });
        const settingsIcon = createLucideIcon('sliders', 16);
        this.settingsButton.appendChild(settingsIcon);
        this.settingsButton.appendText('Settings');
        this.settingsButton.addEventListener('click', () => this.toggleSettings());
    }

    /**
     * Initialize the graph visualization
     */
    private async initializeGraph(): Promise<void> {
        try {
            logger.info('sonic-graph-data', 'Starting graph initialization');
            
            // Performance optimization: Show progress and use non-blocking operations
            this.showProgressIndicator('Extracting graph data...');
            
            // Extract graph data using idle time
            logger.info('sonic-graph-data', 'Beginning graph data extraction');
            logger.debug('ui', 'GraphDataExtractor configuration:', {
                excludeFolders: this.graphDataExtractor['excludeFolders'],
                excludeFiles: this.graphDataExtractor['excludeFiles']
            });
            
            const graphData = await this.executeWhenIdle(async () => {
                return await this.graphDataExtractor.extractGraphData();
            });
            logger.info('sonic-graph-data', `Graph extraction completed: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);
            
            if (graphData.nodes.length === 0) {
                logger.warn('ui', 'No nodes found in graph data - possibly all files excluded');
                throw new Error('No graph data found. Check your exclusion settings.');
            }
            
            // Detect temporal clustering for spacing configuration
            logger.info('sonic-graph-clustering', 'Starting temporal clustering detection');
            const detection = this.detectTemporalClustering(graphData.nodes);
            this.detectedSpacing = detection.type;
            logger.info('sonic-graph-clustering', 'Temporal clustering detected', {
                type: detection.type,
                confidence: detection.confidence,
                reason: detection.reason
            });
            
            // Create graph renderer
            logger.info('sonic-graph-renderer', 'Looking for canvas element');
            const canvasElement = document.getElementById('sonic-graph-canvas');
            if (!canvasElement) {
                logger.error('sonic-graph-renderer', 'Graph canvas element not found');
                throw new Error('Graph canvas element not found');
            }
            logger.info('sonic-graph-renderer', 'Canvas element found', {
                width: canvasElement.clientWidth,
                height: canvasElement.clientHeight,
                offsetWidth: canvasElement.offsetWidth,
                offsetHeight: canvasElement.offsetHeight
            });
            
            // Performance optimization: Show progress for renderer initialization
            this.showProgressIndicator('Initializing renderer...');
            
            logger.info('sonic-graph-renderer', 'Creating GraphRenderer instance');
            this.graphRenderer = await this.executeWhenIdle(() => {
                return new GraphRenderer(canvasElement, {
                    enableZoom: true,
                    showLabels: false
                });
            });
            logger.info('sonic-graph-renderer', 'GraphRenderer created successfully');
            
            // Phase 3.8: Apply layout settings to renderer
            this.showProgressIndicator('Applying layout settings...');
            try {
                logger.info('sonic-graph-layout', 'Getting layout settings');
                const layoutSettings = this.getSonicGraphSettings().layout;
                logger.info('sonic-graph-layout', 'Applying layout settings to renderer', layoutSettings);
                await this.executeWhenIdle(() => {
                    this.graphRenderer!.updateLayoutSettings(layoutSettings);
                });
                logger.info('sonic-graph-layout', 'Layout settings applied successfully');
            } catch (layoutError) {
                logger.error('sonic-graph-layout', 'Failed to apply layout settings:', (layoutError as Error).message);
                logger.error('sonic-graph-layout', 'Layout error stack:', (layoutError as Error).stack);
                throw new Error(`Layout configuration failed: ${(layoutError as Error).message}`);
            }
            
            // Render the graph
            try {
                logger.info('sonic-graph-render', 'Starting graph render process');
                logger.info('sonic-graph-render', 'Render data summary', {
                    nodeCount: graphData.nodes.length,
                    linkCount: graphData.links.length,
                    sampleNodes: graphData.nodes.slice(0, 3).map(n => ({ id: n.id, type: n.type })),
                    sampleLinks: graphData.links.slice(0, 3).map(l => ({ source: l.source, target: l.target, type: l.type }))
                });
                
                this.graphRenderer.render(graphData.nodes, graphData.links);
                logger.info('sonic-graph-render', 'Graph render completed successfully');
                
                // Apply better spacing with delay to avoid blocking UI
                setTimeout(() => {
                    logger.info('sonic-graph-spacing', 'Applying improved node spacing');
                    this.graphRenderer.applyBetterSpacing();
                    logger.info('sonic-graph-spacing', 'Improved node spacing applied');
                }, 100); // Small delay to allow initial render to complete
            } catch (renderError) {
                logger.error('sonic-graph-render', 'Graph rendering failed:', (renderError as Error).message);
                logger.error('sonic-graph-render', 'Render error stack:', (renderError as Error).stack);
                throw new Error(`Graph rendering failed: ${(renderError as Error).message}`);
            }
            
            // Set initial zoom level to be much more zoomed out to show full graph
            const canvasRect = canvasElement.getBoundingClientRect();
            const centerX = canvasRect.width / 2;
            const centerY = canvasRect.height / 2;
            this.graphRenderer.setZoomTransform(
                d3.zoomIdentity
                    .translate(centerX, centerY) // Center properly
                    .scale(0.3) // Better balance - shows full graph but not too tiny
            );
            
            // Hide loading indicator
            const loadingIndicator = this.graphContainer.querySelector('.sonic-graph-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            // Performance optimization: Hide progress indicator
            this.hideProgressIndicator();
            
            // Update stats
            this.updateStats();
            
            // Initialize view mode (starts in Static View)
            this.updateViewMode();
            
            logger.debug('ui', 'Sonic Graph initialized successfully');
            
        } catch (error) {
            logger.error('ui', 'Failed to initialize Sonic Graph:', (error as Error).message);
            logger.error('ui', 'Initialization error stack:', (error as Error).stack);
            
            // Performance optimization: Hide progress indicator on error
            this.hideProgressIndicator();
            
            // Clear loading indicator
            const loadingIndicator = this.graphContainer.querySelector('.sonic-graph-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            new Notice(`Failed to load graph data: ${(error as Error).message}`);
            
            // Show error state with detailed error message
            this.showErrorState((error as Error).message);
        }
    }

    /**
     * Toggle animation playback
     */
    private async toggleAnimation(): Promise<void> {
        if (!this.graphRenderer) {
            new Notice('Graph not ready');
            return;
        }
        
        // Switch to Timeline View if not already there
        if (!this.isTimelineView) {
            this.isTimelineView = true;
            this.updateViewMode();
        }
        
        this.isAnimating = !this.isAnimating;
        
        if (this.isAnimating) {
            // Check audio engine status and handle instrument changes BEFORE starting animation
            try {
                const status = this.plugin.audioEngine.getStatus();
                
                if (!status.isInitialized) {
                    logger.info('audio', 'Audio engine not initialized - initializing for animation');
                    await this.plugin.audioEngine.initialize();
                    new Notice('Audio engine initialized');
                } else {
                    // Always reinitialize audio engine to ensure fresh state for animation
                    logger.info('audio', 'Reinitializing audio engine for animation to ensure fresh state');
                    await this.plugin.audioEngine.initialize();
                    
                    const enabledInstruments = this.getEnabledInstruments();
                    logger.info('audio', 'Audio engine reinitialized for animation', {
                        enabledInstruments: enabledInstruments,
                        enabledCount: enabledInstruments.length,
                        audioContext: this.plugin.audioEngine.getStatus().audioContext
                    });
                    
                    new Notice('Audio engine ready for animation');
                }
                
                logger.info('audio', 'Audio engine ready for Sonic Graph animation');
            } catch (audioError) {
                logger.warn('Failed to check audio engine for animation', (audioError as Error).message);
                new Notice('Audio check failed - animation may be silent');
            }
            
            // Initialize temporal animator if not already done
            if (!this.temporalAnimator) {
                await this.initializeTemporalAnimator();
            }
            
            if (!this.temporalAnimator) {
                new Notice('Failed to initialize animation');
                this.isAnimating = false;
                return;
            }
            
            // Start animation
            this.playButton.setButtonText('Pause Animation');
            this.timelineContainer.classList.remove('timeline-hidden');
            this.timelineContainer.classList.add('timeline-visible');
            
            // Show current position indicator during animation
            const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator') as HTMLElement;
            if (currentIndicator) {
                currentIndicator.style.display = 'block';
            }
            
            // Start temporal animation
            logger.info('ui', 'About to call temporalAnimator.play()', {
                hasTemporalAnimator: !!this.temporalAnimator,
                temporalAnimatorType: this.temporalAnimator?.constructor.name
            });
            
            this.temporalAnimator.play();
            
            logger.info('ui', 'Starting Sonic Graph temporal animation');
            new Notice('Sonic Graph animation started');
            
        } else {
            // Pause animation
            this.playButton.setButtonText('Play');
            
            // Hide current position indicator when animation stops
            const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator') as HTMLElement;
            if (currentIndicator) {
                currentIndicator.style.display = 'none';
            }
            
            if (this.temporalAnimator) {
                this.temporalAnimator.pause();
            }
            
            logger.info('ui', 'Pausing Sonic Graph animation');
            new Notice('Animation paused');
        }
    }


    /**
     * Toggle between Static View and Timeline View
     */
    private toggleViewMode(): void {
        this.isTimelineView = !this.isTimelineView;
        this.updateViewMode();
        logger.debug('ui', `View mode toggled: ${this.isTimelineView ? 'Timeline' : 'Static'}`);
    }

    /**
     * Update UI based on current view mode
     */
    private updateViewMode(): void {
        if (this.isTimelineView) {
            // Timeline View - show animation controls, hide all nodes initially
            this.viewModeBtn.innerHTML = '';
            const timelineIcon = createLucideIcon('play-circle', 16);
            this.viewModeBtn.appendChild(timelineIcon);
            this.viewModeBtn.appendText('Timeline View');
            this.viewModeBtn.style.display = 'inline-flex';
            
            // Show timeline controls
            this.timelineContainer.classList.remove('timeline-hidden');
            this.timelineContainer.classList.add('timeline-visible');
            
            // Initialize temporal animator if needed
            if (!this.temporalAnimator) {
                this.initializeTemporalAnimator().catch(error => {
                    logger.error('Failed to initialize temporal animator for timeline view', error);
                    // Fall back to static view
                    this.isTimelineView = false;
                    this.updateViewMode();
                });
            } else {
                // Reset to beginning and hide all nodes
                this.temporalAnimator.stop();
                if (this.graphRenderer) {
                    this.graphRenderer.updateVisibleNodes(new Set());
                }
            }
            
        } else {
            // Static View - hide view mode button since Play button indicates timeline mode
            this.viewModeBtn.style.display = 'none';
            
            // Hide timeline controls
            this.timelineContainer.classList.add('timeline-hidden');
            this.timelineContainer.classList.remove('timeline-visible');
            
            // Stop any animation
            if (this.temporalAnimator) {
                this.temporalAnimator.stop();
            }
            this.isAnimating = false;
            this.playButton.setButtonText('Play');
            
            // Hide current position indicator in Static View
            const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator') as HTMLElement;
            if (currentIndicator) {
                currentIndicator.style.display = 'none';
            }
            
            // Show all nodes
            if (this.graphRenderer) {
                // Get all node IDs to show them all
                this.graphDataExtractor.extractGraphData().then(graphData => {
                    const allNodeIds = new Set(graphData.nodes.map(node => node.id));
                    this.graphRenderer?.updateVisibleNodes(allNodeIds);
                });
            }
        }
    }

    /**
     * Reset graph view to initial state
     */
    private resetGraphView(): void {
        if (this.graphRenderer) {
            // Reset zoom to initial view (more zoomed out and centered)
            const canvasElement = document.getElementById('sonic-graph-canvas');
            if (canvasElement) {
                const canvasRect = canvasElement.getBoundingClientRect();
                const centerX = canvasRect.width / 2;
                const centerY = canvasRect.height / 2;
                this.graphRenderer.setZoomTransform(
                    d3.zoomIdentity
                        .translate(centerX * 0.6, centerY * 0.6) // Center with some offset
                        .scale(0.4)
                );
            } else {
                // Fallback if canvas not found
                this.graphRenderer.setZoomTransform(d3.zoomIdentity.scale(0.4));
            }
            logger.debug('ui', 'Graph view reset');
        }
    }

    /**
     * Open Control Center modal
     */
    private openControlCenter(): void {
        this.close(); // Close this modal first
        
        // Open Control Center
        import('./control-panel').then(({ MaterialControlPanelModal }) => {
            const controlCenter = new MaterialControlPanelModal(this.app, this.plugin);
            controlCenter.open();
        });
    }

    /**
     * Create settings panel content
     */
    private createSettingsContent(): void {
        // Settings header
        const settingsHeader = this.settingsPanel.createDiv({ cls: 'sonic-graph-settings-header' });
        const headerTitle = settingsHeader.createEl('h3', { 
            text: '⚙️ Timeline Settings', 
            cls: 'sonic-graph-settings-title' 
        });
        
        const closeButton = settingsHeader.createEl('button', { 
            cls: 'sonic-graph-settings-close' 
        });
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => this.toggleSettings());
        
        // Settings content (scrollable area)
        const settingsContent = this.settingsPanel.createDiv({ cls: 'sonic-graph-settings-content' });
        
        // 1. Filters section
        this.createFiltersSettings(settingsContent);
        
        // 2. Visual section
        this.createVisualSettings(settingsContent);
        
        // 3. Layout section
        this.createLayoutSettings(settingsContent);
        
        // 4. Timeline section
        this.createTimelineSettings(settingsContent);
        
        // 5. Audio section
        this.createAudioSettings(settingsContent);
        
        // 6. Navigation section
        this.createNavigationSettings(settingsContent);
    }

    /**
     * Create timeline settings section
     */
    private createTimelineSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'TIMELINE', cls: 'sonic-graph-settings-section-title' });
        
        // Audio Density Slider
        const densityItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        densityItem.createEl('label', { text: 'Audio density', cls: 'sonic-graph-setting-label' });
        densityItem.createEl('div', { 
            text: 'Control how frequently notes play during animation', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const densityContainer = densityItem.createDiv({ cls: 'sonic-graph-density-slider-container' });
        const densitySlider = densityContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-density-slider'
        });
        densitySlider.min = '0';
        densitySlider.max = '100';
        densitySlider.value = this.getSonicGraphSettings().audio.density.toString();
        
        // Add value display for the slider
        const densityValueDisplay = densityContainer.createEl('span', {
            text: this.getSonicGraphSettings().audio.density + '%',
            cls: 'sonic-graph-density-value'
        });
        
        // Add event handler for audio density changes
        densitySlider.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const density = parseInt(target.value);
            densityValueDisplay.textContent = density + '%';
            this.updateAudioDensity(density);
        });
        
        const densityLabels = densityContainer.createDiv({ cls: 'sonic-graph-density-labels' });
        densityLabels.createEl('span', { text: 'Sparse', cls: 'sonic-graph-density-label' });
        densityLabels.createEl('span', { text: 'Dense', cls: 'sonic-graph-density-label' });
        
        // Animation Duration
        const durationItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        durationItem.createEl('label', { text: 'Animation duration', cls: 'sonic-graph-setting-label' });
        
        const durationDisplay = durationItem.createEl('span', { 
            text: '60 seconds',
            cls: 'sonic-graph-setting-value'
        });
        durationDisplay.style.fontSize = '12px';
        durationDisplay.style.color = 'var(--text-muted)';
        durationDisplay.style.padding = '4px 8px';
        durationDisplay.style.backgroundColor = 'var(--background-secondary)';
        durationDisplay.style.borderRadius = '4px';
        
        // Loop Animation
        const loopItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        loopItem.createEl('label', { text: 'Loop animation', cls: 'sonic-graph-setting-label' });
        loopItem.createEl('div', { 
            text: 'Automatically restart animation when complete', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const loopToggle = loopItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const toggleSwitch = loopToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().timeline.loop) {
            toggleSwitch.addClass('active');
        }
        const toggleHandle = toggleSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        loopToggle.createEl('span', { text: 'Enable looping' });
        
        toggleSwitch.addEventListener('click', () => {
            const isActive = toggleSwitch.hasClass('active');
            toggleSwitch.toggleClass('active', !isActive);
            this.updateLoopAnimation(!isActive);
        });
    }

    /**
     * Create audio settings section
     */
    private createAudioSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'AUDIO', cls: 'sonic-graph-settings-section-title' });
        
        // Auto-detection Override
        const detectionItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        detectionItem.createEl('label', { text: 'Auto-detection', cls: 'sonic-graph-setting-label' });
        detectionItem.createEl('div', { 
            text: 'Override automatic temporal clustering detection', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const detectionSelect = detectionItem.createEl('select', { cls: 'sonic-graph-setting-select' });
        [`Auto (${this.detectedSpacing} detected)`, 'Force Dense', 'Force Balanced', 'Force Sparse'].forEach(option => {
            const optionEl = detectionSelect.createEl('option', { text: option });
            if (option.includes('Auto')) optionEl.selected = true;
        });
        
        // Note Duration Slider
        const durationItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        durationItem.createEl('label', { text: 'Note duration', cls: 'sonic-graph-setting-label' });
        
        const durationContainer = durationItem.createDiv({ cls: 'sonic-graph-slider-container' });
        const durationSlider = durationContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider'
        });
        durationSlider.min = '1';
        durationSlider.max = '20';
        durationSlider.step = '1';
        durationSlider.value = (this.getSonicGraphSettings().audio.noteDuration * 10).toString();
        
        const durationValue = durationContainer.createEl('span', { 
            text: `${this.getSonicGraphSettings().audio.noteDuration.toFixed(1)}s`,
            cls: 'sonic-graph-slider-value' 
        });
        
        durationSlider.addEventListener('input', () => {
            const value = parseInt(durationSlider.value) / 10;
            durationValue.textContent = `${value.toFixed(1)}s`;
            this.updateNoteDuration(value);
        });
    }

    /**
     * Create visual settings section
     */
    private createVisualSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'VISUAL', cls: 'sonic-graph-settings-section-title' });
        
        // Timeline Markers
        const markersItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        markersItem.createEl('label', { text: 'Timeline markers', cls: 'sonic-graph-setting-label' });
        markersItem.createEl('div', { 
            text: 'Show year markers on timeline', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const markersToggle = markersItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const markersSwitch = markersToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().visual.timelineMarkersEnabled) {
            markersSwitch.addClass('active');
        }
        const markersHandle = markersSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        markersToggle.createEl('span', { text: 'Show markers' });
        
        markersSwitch.addEventListener('click', () => {
            const isActive = markersSwitch.hasClass('active');
            markersSwitch.toggleClass('active', !isActive);
            this.updateTimelineMarkersVisibility(!isActive);
        });
        
        // Animation Style
        const styleItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        styleItem.createEl('label', { text: 'Animation style', cls: 'sonic-graph-setting-label' });
        
        const styleSelect = styleItem.createEl('select', { cls: 'sonic-graph-setting-select' });
        const styleOptions = [
            { display: 'Fade in', value: 'fade' },
            { display: 'Scale up', value: 'scale' },
            { display: 'Slide in', value: 'slide' },
            { display: 'Pop in', value: 'pop' }
        ];
        
        const currentStyle = this.getSonicGraphSettings().visual.animationStyle;
        styleOptions.forEach(option => {
            const optionEl = styleSelect.createEl('option', { 
                text: option.display, 
                value: option.value 
            });
            if (option.value === currentStyle) {
                optionEl.selected = true;
            }
        });
        
        // Add event handler for animation style changes
        styleSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const style = target.value as 'fade' | 'scale' | 'slide' | 'pop';
            this.updateAnimationStyle(style);
        });
        
        // Loop Animation Toggle
        const loopItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        loopItem.createEl('label', { text: 'Loop animation', cls: 'sonic-graph-setting-label' });
        
        const loopToggle = loopItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const loopSwitch = loopToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().visual.loopAnimation) {
            loopSwitch.addClass('active');
        }
        const loopHandle = loopSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        loopSwitch.addEventListener('click', () => {
            const isActive = loopSwitch.hasClass('active');
            loopSwitch.toggleClass('active', !isActive);
            this.updateLoopAnimation(!isActive);
        });
        
        // Show File Names Toggle
        const fileNamesItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        fileNamesItem.createEl('label', { text: 'Show file names', cls: 'sonic-graph-setting-label' });
        
        const fileNamesToggle = fileNamesItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const fileNamesSwitch = fileNamesToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().visual.showFileNames) {
            fileNamesSwitch.addClass('active');
        }
        const fileNamesHandle = fileNamesSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        fileNamesSwitch.addEventListener('click', () => {
            const isActive = fileNamesSwitch.hasClass('active');
            fileNamesSwitch.toggleClass('active', !isActive);
            this.updateShowFileNames(!isActive);
        });
    }

    /**
     * Create navigation settings section
     */
    private createNavigationSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'NAVIGATION', cls: 'sonic-graph-settings-section-title' });
        
        // Control Center Button
        const controlCenterItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        controlCenterItem.createEl('label', { text: 'Audio control', cls: 'sonic-graph-setting-label' });
        controlCenterItem.createEl('div', { 
            text: 'Open the main audio control interface', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const controlCenterBtn = controlCenterItem.createEl('button', { 
            cls: 'sonic-graph-control-btn sonic-graph-control-btn--secondary',
            text: '🎵 Control Center'
        });
        const controlCenterIcon = createLucideIcon('settings', 16);
        controlCenterBtn.insertBefore(controlCenterIcon, controlCenterBtn.firstChild);
        controlCenterBtn.addEventListener('click', () => this.openControlCenter());
    }

    /**
     * Phase 3.8: Create layout settings section
     */
    private createLayoutSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'LAYOUT', cls: 'sonic-graph-settings-section-title' });
        
        // Layout Density Slider
        const densityItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        densityItem.createEl('label', { text: 'Layout density', cls: 'sonic-graph-setting-label' });
        densityItem.createEl('div', { 
            text: 'Controls overall graph compactness: loose, balanced, tight, or very tight', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const densityContainer = densityItem.createDiv({ cls: 'sonic-graph-slider-container' });
        const densitySlider = densityContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider'
        });
        densitySlider.min = '1';
        densitySlider.max = '4';
        densitySlider.step = '1';
        
        // Map current preset to density value
        const currentPreset = this.getSonicGraphSettings().layout.layoutPreset;
        const presetToDensity: Record<string, number> = {
            'loose': 1,
            'balanced': 2, 
            'tight': 3,
            'very-tight': 4
        };
        densitySlider.value = (presetToDensity[currentPreset] || 2).toString();
        
        const densityLabels = ['', 'Loose', 'Balanced', 'Tight', 'Very Tight'];
        const densityValue = densityContainer.createEl('span', { 
            text: densityLabels[parseInt(densitySlider.value)],
            cls: 'sonic-graph-slider-value' 
        });
        
        densitySlider.addEventListener('input', () => {
            const value = parseInt(densitySlider.value);
            densityValue.textContent = densityLabels[value];
            
            // Map density value back to preset
            const densityToPreset: Record<number, string> = {
                1: 'loose',
                2: 'balanced',
                3: 'tight', 
                4: 'very-tight'
            };
            this.updateLayoutSetting('layoutPreset', densityToPreset[value]);
        });
        
        // Clustering Strength Slider
        const clusteringItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        clusteringItem.createEl('label', { text: 'Clustering strength', cls: 'sonic-graph-setting-label' });
        clusteringItem.createEl('div', { 
            text: 'Controls how strongly connected files attract each other', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const clusteringContainer = clusteringItem.createDiv({ cls: 'sonic-graph-slider-container' });
        const clusteringSlider = clusteringContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider'
        });
        clusteringSlider.min = '0';
        clusteringSlider.max = '30';
        clusteringSlider.step = '1';
        clusteringSlider.value = (this.getSonicGraphSettings().layout.clusteringStrength * 100).toString();
        
        const clusteringValue = clusteringContainer.createEl('span', { 
            text: `${Math.round(this.getSonicGraphSettings().layout.clusteringStrength * 100)}%`,
            cls: 'sonic-graph-slider-value' 
        });
        
        clusteringSlider.addEventListener('input', () => {
            const value = parseInt(clusteringSlider.value) / 100;
            clusteringValue.textContent = `${Math.round(value * 100)}%`;
            this.updateLayoutSetting('clusteringStrength', value);
        });
        
        // Group Separation Slider
        const separationItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        separationItem.createEl('label', { text: 'Group separation', cls: 'sonic-graph-setting-label' });
        separationItem.createEl('div', { 
            text: 'Controls spacing between different groups of files', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const separationContainer = separationItem.createDiv({ cls: 'sonic-graph-slider-container' });
        const separationSlider = separationContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider'
        });
        separationSlider.min = '0';
        separationSlider.max = '20';
        separationSlider.step = '1';
        separationSlider.value = (this.getSonicGraphSettings().layout.groupSeparation * 100).toString();
        
        const separationValue = separationContainer.createEl('span', { 
            text: `${Math.round(this.getSonicGraphSettings().layout.groupSeparation * 100)}%`,
            cls: 'sonic-graph-slider-value' 
        });
        
        separationSlider.addEventListener('input', () => {
            const value = parseInt(separationSlider.value) / 100;
            separationValue.textContent = `${Math.round(value * 100)}%`;
            this.updateLayoutSetting('groupSeparation', value);
        });
        
        // Path-Based Grouping Section
        const groupingItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        groupingItem.createEl('label', { text: 'Path-based grouping', cls: 'sonic-graph-setting-label' });
        
        const groupingToggle = groupingItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const groupingSwitch = groupingToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().layout.pathBasedGrouping.enabled) {
            groupingSwitch.addClass('active');
        }
        const groupingHandle = groupingSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        groupingSwitch.addEventListener('click', () => {
            const isActive = groupingSwitch.hasClass('active');
            groupingSwitch.toggleClass('active', !isActive);
            this.updatePathBasedGroupingSetting('enabled', !isActive);
        });
        
        // Groups Configuration Container
        const groupsContainer = section.createDiv({ cls: 'sonic-graph-groups-container' });
        groupsContainer.style.marginTop = '10px';
        groupsContainer.style.marginLeft = '20px';
        if (!this.getSonicGraphSettings().layout.pathBasedGrouping.enabled) {
            groupsContainer.style.display = 'none';
        }
        
        // Update container visibility when toggle changes
        groupingSwitch.addEventListener('click', () => {
            const isActive = groupingSwitch.hasClass('active');
            groupsContainer.style.display = !isActive ? 'block' : 'none';
        });
        
        this.createPathGroupsSettings(groupsContainer);
    }

    /**
     * Create filters settings section (new section for show tags and show orphans)
     */
    private createFiltersSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'FILTERS', cls: 'sonic-graph-settings-section-title' });
        
        // Show Tags Toggle
        const tagsItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        tagsItem.createEl('label', { text: 'Show tags', cls: 'sonic-graph-setting-label' });
        
        const tagsToggle = tagsItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const tagsSwitch = tagsToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().layout.filters.showTags) {
            tagsSwitch.addClass('active');
        }
        const tagsHandle = tagsSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        tagsSwitch.addEventListener('click', () => {
            const isActive = tagsSwitch.hasClass('active');
            tagsSwitch.toggleClass('active', !isActive);
            this.updateFilterSetting('showTags', !isActive);
        });
        
        // Show Orphans Toggle
        const orphansItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        orphansItem.createEl('label', { text: 'Show orphans', cls: 'sonic-graph-setting-label' });
        
        const orphansToggle = orphansItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const orphansSwitch = orphansToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().layout.filters.showOrphans) {
            orphansSwitch.addClass('active');
        }
        const orphansHandle = orphansSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        orphansSwitch.addEventListener('click', () => {
            const isActive = orphansSwitch.hasClass('active');
            orphansSwitch.toggleClass('active', !isActive);
            this.updateFilterSetting('showOrphans', !isActive);
        });
    }

    /**
     * Phase 3.8: Update layout setting and apply to renderer
     */
    private updateLayoutSetting(key: keyof SonicGraphSettings['layout'], value: any): void {
        // Performance optimization: Use debounced settings updates
        this.scheduleSettingsUpdate(`layout.${String(key)}`, value);
        
        logger.debug('layout-setting', `Scheduled layout setting update: ${String(key)} = ${value}`);
    }

    /**
     * Update path-based grouping setting
     */
    private updatePathBasedGroupingSetting(key: keyof SonicGraphSettings['layout']['pathBasedGrouping'], value: any): void {
        const currentSettings = this.getSonicGraphSettings();
        (currentSettings.layout.pathBasedGrouping as any)[key] = value;
        
        // Save to plugin settings
        this.plugin.settings.sonicGraphSettings = currentSettings;
        this.plugin.saveSettings();
        
        // Apply to renderer if available
        if (this.graphRenderer) {
            this.graphRenderer.updateLayoutSettings(currentSettings.layout);
        }
        
        logger.debug('path-grouping', `Updated path-based grouping setting: ${String(key)} = ${value}`);
    }

    /**
     * Update filter setting
     */
    private updateFilterSetting(key: keyof SonicGraphSettings['layout']['filters'], value: boolean): void {
        const currentSettings = this.getSonicGraphSettings();
        currentSettings.layout.filters[key] = value;
        
        // Save to plugin settings
        this.plugin.settings.sonicGraphSettings = currentSettings;
        this.plugin.saveSettings();
        
        // Apply to renderer if available
        if (this.graphRenderer) {
            this.graphRenderer.updateLayoutSettings(currentSettings.layout);
        }
        
        logger.debug('filter-setting', `Updated filter setting: ${String(key)} = ${value}`);
    }

    /**
     * Create path groups settings interface - New design
     */
    private createPathGroupsSettings(container: HTMLElement): void {
        // Groups header
        const groupsHeader = container.createEl('div', { 
            text: 'Groups', 
            cls: 'sonic-graph-groups-header'
        });
        groupsHeader.style.fontSize = '12px';
        groupsHeader.style.fontWeight = '600';
        groupsHeader.style.color = 'var(--text-normal)';
        groupsHeader.style.marginBottom = '8px';
        
        const settings = this.getSonicGraphSettings();
        const groups = settings.layout.pathBasedGrouping.groups;
        
        // Groups list
        const groupsList = container.createDiv({ cls: 'sonic-graph-groups-list' });
        
        groups.forEach((group, index) => {
            const groupItem = groupsList.createDiv({ cls: 'sonic-graph-group-list-item' });
            groupItem.style.display = 'flex';
            groupItem.style.alignItems = 'center';
            groupItem.style.marginBottom = '6px';
            groupItem.style.padding = '4px 8px';
            groupItem.style.backgroundColor = 'var(--background-secondary)';
            groupItem.style.borderRadius = '4px';
            
            // Colored dot
            const colorDot = groupItem.createEl('div', { cls: 'sonic-graph-group-color-dot' });
            colorDot.style.width = '12px';
            colorDot.style.height = '12px';
            colorDot.style.borderRadius = '50%';
            colorDot.style.backgroundColor = group.color;
            colorDot.style.marginRight = '8px';
            colorDot.style.cursor = 'pointer';
            
            // Group label (type:name format)
            const groupLabel = groupItem.createEl('span', { 
                text: this.formatGroupLabel(group),
                cls: 'sonic-graph-group-label'
            });
            groupLabel.style.flex = '1';
            groupLabel.style.fontSize = '12px';
            groupLabel.style.color = 'var(--text-normal)';
            
            // Remove button
            const removeButton = groupItem.createEl('button', { 
                text: '×',
                cls: 'sonic-graph-group-remove-btn'
            });
            removeButton.style.background = 'none';
            removeButton.style.border = 'none';
            removeButton.style.fontSize = '14px';
            removeButton.style.cursor = 'pointer';
            removeButton.style.color = 'var(--text-muted)';
            removeButton.style.padding = '2px 4px';
            removeButton.style.marginLeft = '8px';
            
            // Event listeners
            colorDot.addEventListener('click', () => {
                this.showColorPicker(index, colorDot);
            });
            
            removeButton.addEventListener('click', () => {
                this.removeGroup(index);
                this.refreshPathGroupsSettings();
            });
        });
        
        // Search input for adding new groups
        const searchInput = container.createEl('input', {
            type: 'text',
            placeholder: 'Enter query...',
            cls: 'sonic-graph-group-search-input'
        });
        searchInput.style.width = '100%';
        searchInput.style.padding = '8px 12px';
        searchInput.style.marginTop = '8px';
        searchInput.style.border = '1px solid #fbbf24'; // Yellow border
        searchInput.style.borderRadius = '4px';
        searchInput.style.backgroundColor = '#fef3c7'; // Light yellow background
        searchInput.style.fontSize = '12px';
        
        // Show search options overlay on focus
        searchInput.addEventListener('focus', () => {
            this.showSearchOptionsOverlay(searchInput);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addGroupFromSearch(searchInput.value);
                searchInput.value = '';
                this.refreshPathGroupsSettings();
            }
        });
    }

    /**
     * Format group label in type:name format
     */
    private formatGroupLabel(group: any): string {
        // Determine type based on group properties
        let type = 'path'; // default
        if (group.name.toLowerCase().includes('file') || group.path.includes('.')) {
            type = 'file';
        } else if (group.name.toLowerCase().includes('tag')) {
            type = 'tag';
        }
        
        return `${type}:${group.name}`;
    }
    
    /**
     * Show color picker for group
     */
    private showColorPicker(groupIndex: number, colorDot: HTMLElement): void {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.getSonicGraphSettings().layout.pathBasedGrouping.groups[groupIndex].color;
        colorInput.style.opacity = '0';
        colorInput.style.position = 'absolute';
        colorInput.style.pointerEvents = 'none';
        document.body.appendChild(colorInput);
        
        colorInput.click();
        
        colorInput.addEventListener('input', () => {
            const newColor = colorInput.value;
            this.updateGroupProperty(groupIndex, 'color', newColor);
            colorDot.style.backgroundColor = newColor;
        });
        
        setTimeout(() => {
            document.body.removeChild(colorInput);
        }, 100);
    }
    
    /**
     * Show search options overlay
     */
    private showSearchOptionsOverlay(searchInput: HTMLElement): void {
        // Remove existing overlay
        const existingOverlay = document.querySelector('.sonic-graph-search-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'sonic-graph-search-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = (searchInput.offsetTop + searchInput.offsetHeight + 4) + 'px';
        overlay.style.left = searchInput.offsetLeft + 'px';
        overlay.style.width = searchInput.offsetWidth + 'px';
        overlay.style.backgroundColor = 'var(--background-primary)';
        overlay.style.border = '1px solid var(--background-modifier-border)';
        overlay.style.borderRadius = '4px';
        overlay.style.padding = '8px';
        overlay.style.fontSize = '12px';
        overlay.style.zIndex = '1000';
        overlay.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        
        const options = [
            'path: match path of the file',
            'file: match file name',
            'tag: search for tags',
            'line: search keywords on same line',
            'section: search keywords under same heading',
            '[property] match property'
        ];
        
        options.forEach(option => {
            const optionEl = document.createElement('div');
            optionEl.textContent = option;
            optionEl.style.padding = '4px 8px';
            optionEl.style.cursor = 'pointer';
            optionEl.style.borderRadius = '2px';
            
            optionEl.addEventListener('mouseenter', () => {
                optionEl.style.backgroundColor = 'var(--background-modifier-hover)';
            });
            
            optionEl.addEventListener('mouseleave', () => {
                optionEl.style.backgroundColor = 'transparent';
            });
            
            optionEl.addEventListener('click', () => {
                const prefix = option.split(':')[0];
                (searchInput as HTMLInputElement).value = prefix + ':';
                (searchInput as HTMLInputElement).focus();
                overlay.remove();
            });
            
            overlay.appendChild(optionEl);
        });
        
        searchInput.parentElement!.appendChild(overlay);
        
        // Remove overlay when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function handleClickOutside(e) {
                if (!overlay.contains(e.target as Node) && e.target !== searchInput) {
                    overlay.remove();
                    document.removeEventListener('click', handleClickOutside);
                }
            });
        }, 100);
    }
    
    /**
     * Add group from search input
     */
    private addGroupFromSearch(query: string): void {
        if (!query.trim()) return;
        
        const currentSettings = this.getSonicGraphSettings();
        
        // Parse the query to determine type and name
        let type = 'path';
        let name = query;
        let path = query;
        
        if (query.includes(':')) {
            const parts = query.split(':', 2);
            type = parts[0].toLowerCase();
            name = parts[1];
            path = parts[1];
        }
        
        const newGroup = {
            id: `group-${Date.now()}`,
            name: name,
            path: path,
            color: this.getRandomGroupColor()
        };
        
        currentSettings.layout.pathBasedGrouping.groups.push(newGroup);
        this.plugin.settings.sonicGraphSettings = currentSettings;
        this.plugin.saveSettings();
        
        if (this.graphRenderer) {
            this.graphRenderer.updateLayoutSettings(currentSettings.layout);
        }
        
        logger.debug('path-grouping', 'Added new group from search:', newGroup);
    }
    
    /**
     * Get random color for new groups
     */
    private getRandomGroupColor(): string {
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Update a specific group property
     */
    private updateGroupProperty(groupIndex: number, property: string, value: string): void {
        const currentSettings = this.getSonicGraphSettings();
        (currentSettings.layout.pathBasedGrouping.groups[groupIndex] as any)[property] = value;
        
        this.plugin.settings.sonicGraphSettings = currentSettings;
        this.plugin.saveSettings();
        
        // Apply to renderer if available
        if (this.graphRenderer) {
            this.graphRenderer.updateLayoutSettings(currentSettings.layout);
        }
        
        logger.debug('path-grouping', `Updated group ${groupIndex} ${property}:`, value);
    }

    /**
     * Add a new group
     */
    private addNewGroup(): void {
        const currentSettings = this.getSonicGraphSettings();
        const newGroup = {
            id: `group-${Date.now()}`,
            name: 'New Group',
            path: '',
            color: '#6366f1'
        };
        
        currentSettings.layout.pathBasedGrouping.groups.push(newGroup);
        
        this.plugin.settings.sonicGraphSettings = currentSettings;
        this.plugin.saveSettings();
        
        logger.debug('path-grouping', 'Added new group:', newGroup);
    }

    /**
     * Remove a group
     */
    private removeGroup(groupIndex: number): void {
        const currentSettings = this.getSonicGraphSettings();
        currentSettings.layout.pathBasedGrouping.groups.splice(groupIndex, 1);
        
        this.plugin.settings.sonicGraphSettings = currentSettings;
        this.plugin.saveSettings();
        
        // Apply to renderer if available
        if (this.graphRenderer) {
            this.graphRenderer.updateLayoutSettings(currentSettings.layout);
        }
        
        logger.debug('path-grouping', `Removed group at index ${groupIndex}`);
    }

    /**
     * Refresh the path groups settings UI
     */
    private refreshPathGroupsSettings(): void {
        const groupsContainer = document.querySelector('.sonic-graph-groups-container') as HTMLElement;
        if (groupsContainer) {
            groupsContainer.empty();
            this.createPathGroupsSettings(groupsContainer);
        }
    }

    /**
     * Toggle settings panel visibility
     */
    private toggleSettings(): void {
        this.isSettingsVisible = !this.isSettingsVisible;
        
        if (this.isSettingsVisible) {
            this.settingsPanel.removeClass('hidden');
            this.settingsButton.addClass('active');
        } else {
            this.settingsPanel.addClass('hidden');
            this.settingsButton.removeClass('active');
        }
        
        logger.debug('ui', 'Settings panel toggled', { 
            visible: this.isSettingsVisible 
        });
    }

    /**
     * Update stats display
     */
    private updateStats(): void {
        if (!this.statsContainer) return;
        
        this.statsContainer.empty();
        
        // Get current stats
        const fileCount = this.app.vault.getMarkdownFiles().length;
        const totalFiles = this.app.vault.getFiles().length;
        
        this.statsContainer.createSpan({ 
            text: `${fileCount} notes • ${totalFiles} total files`,
            cls: 'sonic-graph-stats-text'
        });
    }

    /**
     * Get default spacing configuration (now uses settings panel controls)
     */
    private getSpacingConfiguration(): { enableIntelligentSpacing: boolean, simultaneousThreshold: number, maxSpacingWindow: number, minEventSpacing: number } {
        // Use detected spacing since settings are now in the panel
        const actualSpacing = this.detectedSpacing;

        logger.debug('temporal-spacing', 'Getting spacing configuration', {
            detectedSpacing: this.detectedSpacing,
            actualSpacing
        });

        switch (actualSpacing) {
            case 'dense':
                return {
                    enableIntelligentSpacing: false,
                    simultaneousThreshold: 0.01,
                    maxSpacingWindow: 1,
                    minEventSpacing: 0.05
                };
            
            case 'sparse':
                return {
                    enableIntelligentSpacing: true,
                    simultaneousThreshold: 0.01,
                    maxSpacingWindow: 10,
                    minEventSpacing: 0.2
                };
            
            case 'balanced':
            default:
                return {
                    enableIntelligentSpacing: true,
                    simultaneousThreshold: 0.01,
                    maxSpacingWindow: 5,
                    minEventSpacing: 0.1
                };
        }
    }

    /**
     * Show error state with detailed error message
     */
    private showErrorState(errorMessage?: string): void {
        // Clear any existing error states
        const existingError = this.graphContainer.querySelector('.sonic-graph-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorContainer = this.graphContainer.createDiv({ cls: 'sonic-graph-error' });
        const errorIcon = createLucideIcon('alert-circle', 48);
        errorContainer.appendChild(errorIcon);
        
        const errorTitle = errorContainer.createEl('h3', { 
            text: 'Failed to load graph data',
            cls: 'sonic-graph-error-title'
        });
        
        if (errorMessage) {
            const errorDetails = errorContainer.createEl('p', { 
                text: errorMessage,
                cls: 'sonic-graph-error-details'
            });
        }
        
        const retryBtn = errorContainer.createEl('button', { 
            text: 'Retry',
            cls: 'sonic-graph-error-retry'
        });
        
        retryBtn.addEventListener('click', async () => {
            logger.debug('ui', 'Retry button clicked - attempting to reinitialize graph');
            
            try {
                // Show loading state
                retryBtn.textContent = 'Retrying...';
                retryBtn.disabled = true;
                
                // Clear current error
                errorContainer.remove();
                
                // Add loading indicator back
                const loadingIndicator = this.graphContainer.createDiv({ cls: 'sonic-graph-loading' });
                const loadingIcon = createLucideIcon('loader-2', 24);
                loadingIcon.addClass('sonic-graph-loading-icon');
                loadingIndicator.appendChild(loadingIcon);
                loadingIndicator.createSpan({ text: 'Retrying...', cls: 'sonic-graph-loading-text' });
                
                // Attempt to reinitialize
                await this.initializeGraph();
                
            } catch (retryError) {
                logger.error('ui', 'Retry failed:', (retryError as Error).message);
                // The initializeGraph catch block will handle showing error state again
            }
        });
        
        // Add debug information button
        const debugBtn = errorContainer.createEl('button', { 
            text: 'Copy Debug Info',
            cls: 'sonic-graph-error-debug'
        });
        
        debugBtn.addEventListener('click', () => {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                error: errorMessage,
                excludeFolders: this.graphDataExtractor['excludeFolders'] || [],
                excludeFiles: this.graphDataExtractor['excludeFiles'] || [],
                vaultFileCount: this.app.vault.getFiles().length,
                userAgent: navigator.userAgent
            };
            
            navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                .then(() => new Notice('Debug info copied to clipboard'))
                .catch(() => new Notice('Failed to copy debug info'));
        });
    }

    /**
     * Initialize temporal animator for timeline animation
     */
    private async initializeTemporalAnimator(): Promise<void> {
        try {
            logger.debug('ui', 'Initializing temporal animator');
            
            // Extract graph data if not already done
            const graphData = await this.graphDataExtractor.extractGraphData();
            
            // Get spacing configuration based on user selection
            const spacingConfig = this.getSpacingConfiguration();

            // Create temporal animator with spacing configuration
            this.temporalAnimator = new TemporalGraphAnimator(
                graphData.nodes,
                graphData.links,
                {
                    duration: this.plugin.settings.sonicGraphAnimationDuration || 60, // Use user setting or default to 60 seconds
                    speed: 1.0,
                    loop: this.getSonicGraphSettings().timeline.loop,
                    ...spacingConfig
                }
            );
            
            // Set up callbacks
            this.temporalAnimator.onVisibilityChanged((visibleNodeIds) => {
                if (this.graphRenderer) {
                    this.graphRenderer.updateVisibleNodes(visibleNodeIds);
                }
            });
            
            this.temporalAnimator.onTimeChanged((currentTime, progress) => {
                this.updateTimelineUI(currentTime, progress);
            });
            
            this.temporalAnimator.onAnimationEnded(() => {
                this.handleAnimationEnd();
            });
            
            this.temporalAnimator.onNodeAppeared((node) => {
                logger.debug('temporal-callback', 'onNodeAppeared callback invoked', { 
                    nodeId: node.id,
                    nodeTitle: node.title,
                    nodeType: node.type,
                    callbackRegistered: true
                });
                this.handleNodeAppearance(node);
            });
            
            logger.info('ui', 'Temporal animator callbacks registered');
            
            // Initialize timeline markers
            this.updateTimelineMarkers();
            this.updateCurrentPosition(0, 0); // Initialize at start position
            
            // Log timeline info for debugging
            const timelineInfo = this.temporalAnimator.getTimelineInfo();
            logger.info('ui', 'Temporal animator timeline info', {
                eventCount: timelineInfo.eventCount,
                duration: timelineInfo.duration,
                startDate: timelineInfo.startDate.toISOString(),
                endDate: timelineInfo.endDate.toISOString()
            });
            
            // Initialize musical mapper for audio
            this.musicalMapper = new MusicalMapper(this.plugin.settings);
            
            logger.info('ui', 'Temporal animator initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize temporal animator', (error as Error).message);
            throw error;
        }
    }

    /**
     * Handle speed control change
     */
    private handleSpeedChange(): void {
        const speedValue = this.speedSelect.value;
        const speed = parseFloat(speedValue.replace('x', ''));
        
        // Save setting
        this.plugin.settings.sonicGraphAnimationSpeed = speed;
        this.plugin.saveSettings();
        
        // Update animator if it exists
        if (this.temporalAnimator) {
            this.temporalAnimator.setSpeed(speed);
        }
        
        logger.debug('ui', 'Animation speed changed', { speed });
    }

    /**
     * Handle timeline scrubber input
     */
    private handleTimelineScrub(): void {
        if (!this.temporalAnimator) return;
        
        const progress = parseFloat(this.timelineScrubber.value) / 100;
        const timelineInfo = this.temporalAnimator.getTimelineInfo();
        const targetTime = progress * timelineInfo.duration;
        
        this.temporalAnimator.seekTo(targetTime);
        logger.debug('ui', 'Timeline scrubbed', { progress, targetTime });
    }

    /**
     * Update timeline UI elements
     */
    private updateTimelineUI(currentTime: number, progress: number): void {
        // Update scrubber position
        if (this.timelineScrubber) {
            this.timelineScrubber.value = (progress * 100).toString();
        }
        
        // Update timeline info
        if (this.timelineInfo && this.temporalAnimator) {
            this.updateTimelineMarkers();
            this.updateCurrentPosition(currentTime, progress);
        }
    }

    /**
     * Update timeline markers for years and time
     */
    private updateTimelineMarkers(): void {
        if (!this.temporalAnimator) return;
        
        const timelineInfo = this.temporalAnimator.getTimelineInfo();
        
        // Only update time markers - years shown on current position indicator
        this.updateTimeMarkers(timelineInfo);
    }



    /**
     * Update time markers along the timeline
     */
    private updateTimeMarkers(timelineInfo: any): void {
        const markersContainer = this.timelineInfo.querySelector('.sonic-graph-timeline-markers');
        if (!markersContainer) return;
        
        // Clear all existing markers (both time and year markers)
        markersContainer.innerHTML = '';
        
        // Check if markers should be shown
        const showMarkers = this.getSonicGraphSettings().visual.timelineMarkersEnabled;
        if (!showMarkers) {
            (markersContainer as HTMLElement).style.display = 'none';
            return;
        }
        
        (markersContainer as HTMLElement).style.display = 'block';
        const duration = timelineInfo.duration;
        
        // Generate time markers based on duration
        const timeIntervals: number[] = [];
        
        if (duration <= 30) {
            // For short durations, show every 5 seconds
            for (let t = 0; t <= duration; t += 5) {
                timeIntervals.push(t);
            }
        } else if (duration <= 120) {
            // For medium durations, show every 10 seconds
            for (let t = 0; t <= duration; t += 10) {
                timeIntervals.push(t);
            }
        } else {
            // For long durations, show every 30 seconds
            for (let t = 0; t <= duration; t += 30) {
                timeIntervals.push(t);
            }
        }
        
        // Create markers
        timeIntervals.forEach(time => {
            const timeProgress = time / duration;
            const marker = markersContainer.createEl('div', { cls: 'sonic-graph-timeline-marker time-marker' });
            marker.style.left = `${timeProgress * 100}%`;
            
            // Vertical line
            marker.createEl('div', { cls: 'sonic-graph-timeline-marker-line' });
            
            // Label
            const label = marker.createEl('div', { cls: 'sonic-graph-timeline-marker-label' });
            label.textContent = `${Math.floor(time)}s`;
        });
    }

    /**
     * Update current position indicator
     */
    private updateCurrentPosition(currentTime: number, progress: number): void {
        if (!this.temporalAnimator) return;
        
        const timelineInfo = this.temporalAnimator.getTimelineInfo();
        
        // Update current position indicator
        const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator');
        if (currentIndicator) {
            const indicator = currentIndicator as HTMLElement;
            indicator.style.left = `${progress * 100}%`;
        }
        
        // Update current labels
        const currentYearSpan = this.timelineInfo.querySelector('.sonic-graph-timeline-current-year');
        const currentTimeSpan = this.timelineInfo.querySelector('.sonic-graph-timeline-current-time');
        
        if (currentYearSpan) {
            const currentDate = new Date(
                timelineInfo.startDate.getTime() + 
                (progress * (timelineInfo.endDate.getTime() - timelineInfo.startDate.getTime()))
            );
            currentYearSpan.textContent = `Current: ${currentDate.getFullYear()}`;
        }
        
        if (currentTimeSpan) {
            currentTimeSpan.textContent = `${Math.floor(currentTime)}s`;
        }
    }

    /**
     * Handle animation completion
     */
    private handleAnimationEnd(): void {
        this.isAnimating = false;
        this.playButton.setButtonText('Play');
        
        // Hide current position indicator when animation completes
        const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator') as HTMLElement;
        if (currentIndicator) {
            currentIndicator.style.display = 'none';
        }
        
        logger.info('ui', 'Sonic Graph animation completed');
        new Notice('Animation completed');
    }

    /**
     * Handle node appearance for audio synchronization
     */
    private async handleNodeAppearance(node: GraphNode): Promise<void> {
        logger.debug('audio-sync', 'Node appearance triggered in temporal animation', { 
            nodeId: node.id, 
            nodeTitle: node.title,
            nodeType: node.type,
            hasAudioEngine: !!this.plugin.audioEngine,
            timestamp: Date.now()
        });
        
        if (!this.plugin.audioEngine) {
            logger.warn('audio', 'No audio engine available for node appearance');
            return;
        }
        
        try {
            // Ensure audio engine is initialized
            const status = this.plugin.audioEngine.getStatus();
            if (!status.isInitialized) {
                logger.debug('audio', 'Initializing audio engine for node appearance');
                await this.plugin.audioEngine.initialize();
            }
            
            // Create a musical mapping based on node properties
            const mapping = this.createMusicalMappingForNode(node);
            
            // Check if note should be skipped due to audio density setting
            if (mapping === null) {
                logger.debug('audio', 'Note skipped due to audio density setting', { 
                    nodeId: node.id, 
                    nodeTitle: node.title
                });
                return; // Skip this note entirely
            }
            
            logger.info('audio-playback', 'Attempting to play note for node appearance', { 
                nodeId: node.id, 
                nodeTitle: node.title,
                nodeType: node.type,
                instrument: mapping.instrument,
                pitch: mapping.pitch.toFixed(2),
                duration: mapping.duration,
                velocity: mapping.velocity,
                audioEngineStatus: this.plugin.audioEngine.getStatus(),
                mappingData: mapping
            });
            
            // Verify audio engine is ready before playing
            const audioStatus = this.plugin.audioEngine.getStatus();
            
            logger.info('audio-verification', 'Verifying audio engine readiness before playback', {
                requestedInstrument: mapping.instrument,
                audioEngineInitialized: audioStatus.isInitialized,
                audioContext: audioStatus.audioContext,
                currentNotes: audioStatus.currentNotes,
                volume: audioStatus.volume
            });
            
            // Play the note immediately using the new immediate playback method
            try {
                await this.plugin.audioEngine.playNoteImmediate(mapping);
                logger.info('audio-success', 'Audio note played successfully for node appearance', { 
                    nodeId: node.id,
                    nodeTitle: node.title,
                    instrument: mapping.instrument,
                    pitch: mapping.pitch.toFixed(2),
                    duration: mapping.duration,
                    velocity: mapping.velocity,
                    playbackMethod: 'immediate',
                    timestamp: Date.now()
                });
            } catch (playError) {
                logger.warn('audio-playback-error', 'Immediate playback failed for node appearance', { 
                    nodeId: node.id,
                    nodeTitle: node.title,
                    instrument: mapping.instrument,
                    frequency: mapping.pitch,
                    error: (playError as Error).message,
                    stack: (playError as Error).stack,
                    playbackMethod: 'immediate'
                });
                
                // Fallback: try basic test note
                try {
                    await this.plugin.audioEngine.playTestNote(mapping.pitch);
                    logger.info('audio-fallback-success', 'Fallback test note played successfully', {
                        nodeId: node.id,
                        pitch: mapping.pitch.toFixed(2),
                        playbackMethod: 'test-note',
                        timestamp: Date.now()
                    });
                } catch (testError) {
                    logger.error('audio-complete-failure', 'Both sequence and test note playback failed', {
                        nodeId: node.id,
                        instrument: mapping.instrument,
                        sequenceError: (playError as Error).message,
                        testNoteError: (testError as Error).message,
                        audioEngineStatus: audioStatus,
                        timestamp: Date.now()
                    });
                    
                    // Still throw to indicate complete failure
                    throw testError;
                }
            }
            
            logger.info('audio', 'Successfully played note for node appearance', { 
                nodeId: node.id, 
                nodeTitle: node.title
            });
            
        } catch (error) {
            logger.error('Failed to play audio for node appearance', (error as Error).message);
            // Show user feedback about audio issues
            console.warn('Audio playback failed:', error);
        }
    }

    /**
     * Create a musical mapping for a graph node
     */
    private createMusicalMappingForNode(node: GraphNode): any {
        // Get settings for audio customization
        const settings = this.getSonicGraphSettings();
        
        // Audio density affects the probability of playing a note (0-100)
        const densityProbability = settings.audio.density / 100;
        const randomValue = Math.random();
        
        logger.debug('audio-density', 'Audio density filtering', {
            nodeId: node.id,
            densitySetting: settings.audio.density,
            densityProbability,
            randomValue,
            shouldPlay: randomValue <= densityProbability
        });
        
        if (randomValue > densityProbability) {
            // Skip this note based on density setting
            logger.debug('audio-density', 'Note skipped due to audio density', {
                nodeId: node.id,
                randomValue,
                densityProbability
            });
            return null;
        }

        // Get enabled instruments from user's settings
        const enabledInstruments = this.getEnabledInstruments();
        
        if (enabledInstruments.length === 0) {
            logger.warn('audio', 'No instruments enabled for temporal animation');
            // Fallback to piano if nothing is enabled
            return this.createFallbackMapping(node, 'piano');
        }
        
        // Map file type to instrument categories, then select from user's enabled instruments
        const selectedInstrument = this.selectInstrumentForFileType(node.type, enabledInstruments);
        
        // Check if selected instrument has proper configuration
        const instrumentConfig = this.plugin.settings.instruments[selectedInstrument as keyof typeof this.plugin.settings.instruments];
        logger.debug('instrument-selection', 'Instrument selected for node', {
            nodeId: node.id,
            nodeType: node.type,
            selectedInstrument,
            enabledInstrumentsCount: enabledInstruments.length,
            hasInstrumentConfig: !!instrumentConfig,
            instrumentEnabled: instrumentConfig?.enabled,
            instrumentVolume: instrumentConfig?.volume
        });
        
        // Validate instrument selection - if not properly configured, use fallback
        if (!instrumentConfig || !instrumentConfig.enabled) {
            logger.warn('instrument-fallback', 'Selected instrument not properly configured, using piano fallback', {
                nodeId: node.id,
                selectedInstrument,
                hasConfig: !!instrumentConfig,
                isEnabled: instrumentConfig?.enabled
            });
            return this.createFallbackMapping(node, 'piano');
        }
        
        // Calculate pitch based on node properties
        const baseFreq = 261.63; // C4
        const fileNameHash = this.hashString(node.title);
        const pitchOffset = (fileNameHash % 24) - 12; // ±12 semitones
        const pitch = baseFreq * Math.pow(2, pitchOffset / 12);
        
        // Duration based on file size (logarithmic scale) and note duration setting
        const baseDuration = settings.audio.noteDuration; // Use setting instead of hardcoded 0.3
        const sizeFactor = Math.log10(Math.max(node.fileSize, 1)) / 10;
        const duration = Math.min(baseDuration + sizeFactor, 2.0); // Allow longer notes up to 2 seconds
        
        // Velocity based on connections (if available)
        const baseVelocity = 0.5;
        const connectionFactor = Math.min(node.connections.length / 10, 0.4);
        const velocity = baseVelocity + connectionFactor;
        
        logger.debug('audio', 'Created musical mapping for node', {
            nodeId: node.id,
            nodeType: node.type,
            selectedInstrument,
            enabledInstrumentsCount: enabledInstruments.length,
            pitch: pitch.toFixed(2)
        });
        
        return {
            nodeId: node.id,
            pitch: pitch,
            duration: duration,
            velocity: velocity,
            timing: 0,
            instrument: selectedInstrument
        };
    }

    /**
     * Get Sonic Graph settings with fallback to defaults
     */
    private getSonicGraphSettings() {
        const settings = this.plugin.settings.sonicGraphSettings;
        
        // Default settings structure
        const defaultSettings = {
            timeline: {
                duration: 60,
                spacing: 'auto' as const,
                loop: false,
                showMarkers: true
            },
            audio: {
                density: 100,
                noteDuration: 0.3,
                enableEffects: true,
                autoDetectionOverride: 'auto' as const
            },
            visual: {
                showLabels: false,
                showFileNames: false,
                animationStyle: 'fade' as const,
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
            // Phase 3.8: Layout settings default
            layout: {
                clusteringStrength: 0.15,
                groupSeparation: 0.08,
                pathBasedGrouping: {
                    enabled: false,
                    groups: [
                        {
                            id: 'journals',
                            name: 'Journals',
                            path: 'Journal',
                            color: '#4f46e5'
                        },
                        {
                            id: 'projects',
                            name: 'Projects', 
                            path: 'Projects',
                            color: '#059669'
                        }
                    ]
                },
                filters: {
                    showTags: true,
                    showOrphans: true
                },
                temporalClustering: false,
                journalGravity: 0.3,
                layoutPreset: 'balanced' as const,
                adaptiveScaling: true
            }
        };
        
        if (!settings) {
            // Return default settings if not configured
            return defaultSettings;
        }
        
        // Merge with defaults to ensure all properties exist (especially new Phase 3.8 layout settings)
        return {
            timeline: { ...defaultSettings.timeline, ...settings.timeline },
            audio: { ...defaultSettings.audio, ...settings.audio },
            visual: { ...defaultSettings.visual, ...settings.visual },
            navigation: { ...defaultSettings.navigation, ...settings.navigation },
            layout: { ...defaultSettings.layout, ...settings.layout }
        };
    }

    /**
     * Update audio density setting and save to plugin settings
     */
    private updateAudioDensity(density: number): void {
        // Ensure settings object exists
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.audio.density = density;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated audio density', { density });
    }

    /**
     * Update note duration setting and save to plugin settings
     */
    private updateNoteDuration(duration: number): void {
        // Ensure settings object exists
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.audio.noteDuration = duration;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated note duration', { duration });
    }

    /**
     * Update show file names setting and save to plugin settings
     */
    private updateShowFileNames(show: boolean): void {
        // Ensure settings object exists
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.visual.showFileNames = show;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated show file names', { show });
        
        // Refresh the graph to show/hide file names
        if (this.graphRenderer) {
            this.graphRenderer.updateFileNameVisibility(show);
        }
    }

    /**
     * Update timeline markers visibility and save to plugin settings
     */
    private updateTimelineMarkersVisibility(show: boolean): void {
        // Ensure settings object exists
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.visual.timelineMarkersEnabled = show;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated timeline markers visibility', { show });
        
        // Update the timeline markers display
        const markersContainer = this.timelineInfo?.querySelector('.sonic-graph-timeline-markers') as HTMLElement;
        if (markersContainer) {
            markersContainer.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Update animation style and save to plugin settings
     */
    private updateAnimationStyle(style: 'fade' | 'scale' | 'slide' | 'pop'): void {
        // Ensure settings object exists
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.visual.animationStyle = style;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated animation style', { style });
        
        // Update the renderer's animation style if it exists
        if (this.graphRenderer) {
            this.graphRenderer.setAnimationStyle(style);
        }
    }

    /**
     * Update loop animation setting and save to plugin settings
     */
    private updateLoopAnimation(enabled: boolean): void {
        // Ensure settings object exists
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.visual.loopAnimation = enabled;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated loop animation', { enabled });
        
        // Update the animator's loop setting if it exists
        if (this.temporalAnimator) {
            this.temporalAnimator.setLoop(enabled);
        }
    }

    /**
     * Get list of currently enabled instruments from settings
     */
    private getEnabledInstruments(): string[] {
        const enabled: string[] = [];
        
        // Check all instruments in settings
        Object.entries(this.plugin.settings.instruments).forEach(([instrumentName, settings]) => {
            logger.debug('audio', 'Checking instrument', { 
                instrumentName, 
                enabled: settings?.enabled,
                settings: settings 
            });
            if (settings?.enabled) {
                enabled.push(instrumentName);
            }
        });
        
        logger.debug('instrument-detection', 'Found enabled instruments for temporal animation', { 
            enabledCount: enabled.length, 
            enabledInstruments: enabled,
            totalInstrumentsChecked: Object.keys(this.plugin.settings.instruments).length,
            allInstruments: Object.keys(this.plugin.settings.instruments)
        });
        
        return enabled;
    }

    /**
     * Select appropriate instrument for file type from user's enabled instruments
     */
    private selectInstrumentForFileType(fileType: string, enabledInstruments: string[]): string {
        // Define instrument categories by type
        const instrumentCategories = {
            keyboard: ['piano', 'organ', 'electricPiano', 'harpsichord', 'accordion', 'celesta'],
            strings: ['violin', 'cello', 'contrabass', 'guitar', 'guitarElectric', 'guitarNylon', 'bassElectric', 'harp', 'strings'],
            brass: ['trumpet', 'frenchHorn', 'trombone', 'tuba'],
            woodwinds: ['flute', 'clarinet', 'saxophone', 'bassoon', 'oboe'],
            percussion: ['timpani', 'xylophone', 'vibraphone', 'gongs'],
            electronic: ['leadSynth', 'bassSynth', 'arpSynth'],
            experimental: ['whaleHumpback', 'whaleBlue', 'whaleOrca', 'whaleGray', 'whaleSperm', 'whaleMinke', 'whaleFin', 'whaleRight', 'whaleSei', 'whalePilot']
        };

        // File type to preferred instrument category mapping
        const fileTypePreferences: Record<string, string[]> = {
            'note': ['keyboard', 'strings'], // Notes sound good with keyboard or strings
            'image': ['strings', 'woodwinds'], // Images are visual, strings/woodwinds are expressive
            'pdf': ['brass', 'keyboard'], // PDFs are formal, brass/keyboard are authoritative
            'audio': ['woodwinds', 'electronic'], // Audio files with musical instruments
            'video': ['strings', 'brass'], // Videos with rich, full instruments
            'other': ['electronic', 'experimental'] // Other files with synthetic sounds
        };

        const preferredCategories = fileTypePreferences[fileType] || ['keyboard'];
        
        // Try to find an enabled instrument from preferred categories
        for (const category of preferredCategories) {
            const categoryInstruments = instrumentCategories[category as keyof typeof instrumentCategories] || [];
            const availableInCategory = categoryInstruments.filter(inst => enabledInstruments.includes(inst));
            
            if (availableInCategory.length > 0) {
                // Use consistent selection based on file hash for reproducibility
                const fileHash = this.hashString(fileType + category);
                const selectedIndex = fileHash % availableInCategory.length;
                const selected = availableInCategory[selectedIndex];
                
                logger.debug('audio', 'Selected instrument from preferred category', {
                    fileType,
                    category,
                    availableInCategory,
                    selected
                });
                
                return selected;
            }
        }
        
        // Find any uncategorized instruments (instruments not in any of our categories)
        const allCategorizedInstruments = Object.values(instrumentCategories).flat();
        const uncategorizedInstruments = enabledInstruments.filter(inst => 
            !allCategorizedInstruments.includes(inst)
        );
        
        if (uncategorizedInstruments.length > 0) {
            // Use uncategorized instruments as a fallback
            const fileHash = this.hashString(fileType + 'uncategorized');
            const selectedIndex = fileHash % uncategorizedInstruments.length;
            const selected = uncategorizedInstruments[selectedIndex];
            
            logger.debug('audio', 'Selected uncategorized instrument', {
                fileType,
                uncategorizedInstruments,
                selected,
                note: 'This instrument was not in predefined categories'
            });
            
            return selected;
        }
        
        // Final fallback: select any enabled instrument
        const fileHash = this.hashString(fileType);
        const fallbackIndex = fileHash % enabledInstruments.length;
        const fallback = enabledInstruments[fallbackIndex];
        
        logger.debug('audio', 'Using final fallback instrument selection', {
            fileType,
            enabledInstruments,
            fallback
        });
        
        return fallback;
    }

    /**
     * Create fallback mapping when no instruments are enabled
     */
    private createFallbackMapping(node: GraphNode, fallbackInstrument: string): any {
        const baseFreq = 261.63; // C4
        const fileNameHash = this.hashString(node.title);
        const pitchOffset = (fileNameHash % 24) - 12;
        const pitch = baseFreq * Math.pow(2, pitchOffset / 12);
        
        return {
            nodeId: node.id,
            pitch: pitch,
            duration: 0.3,
            velocity: 0.5,
            timing: 0,
            instrument: fallbackInstrument
        };
    }

    /**
     * Detect temporal clustering in node creation dates to recommend spacing settings
     */
    private detectTemporalClustering(nodes: GraphNode[]): { type: 'dense' | 'balanced' | 'sparse', confidence: number, reason: string } {
        if (nodes.length === 0) {
            return { type: 'balanced', confidence: 0, reason: 'No nodes available' };
        }

        const dates = nodes.map(n => n.creationDate.getTime()).sort((a, b) => a - b);
        const totalSpan = dates[dates.length - 1] - dates[0];
        const oneDay = 24 * 60 * 60 * 1000;

        // Group files by day to detect clustering
        const dayGroups = new Map<string, number>();
        dates.forEach(timestamp => {
            const dayKey = new Date(timestamp).toDateString();
            dayGroups.set(dayKey, (dayGroups.get(dayKey) || 0) + 1);
        });

        const largestDayCluster = Math.max(...dayGroups.values());
        const clusteringRatio = largestDayCluster / nodes.length;
        const spanInDays = Math.max(1, totalSpan / oneDay);
        const averageNodesPerDay = nodes.length / spanInDays;

        logger.debug('temporal-detection', 'Analyzing temporal distribution', {
            totalNodes: nodes.length,
            spanInDays: spanInDays.toFixed(1),
            largestDayCluster,
            clusteringRatio: clusteringRatio.toFixed(3),
            averageNodesPerDay: averageNodesPerDay.toFixed(1),
            uniqueDays: dayGroups.size
        });

        // High clustering: >40% of files created on same day
        if (clusteringRatio > 0.4) {
            return {
                type: 'sparse',
                confidence: Math.min(0.9, clusteringRatio),
                reason: `${Math.round(clusteringRatio * 100)}% of files created on same day - use sparse spacing to avoid audio chaos`
            };
        }

        // Very distributed: files span years with low daily density
        if (spanInDays > 365 && averageNodesPerDay < 2) {
            return {
                type: 'dense',
                confidence: Math.min(0.9, spanInDays / 365 / 10),
                reason: `Files span ${Math.round(spanInDays / 365)} years with natural spacing - use dense audio for better experience`
            };
        }

        // Moderate clustering: some bulk days but not overwhelming
        if (clusteringRatio > 0.2 || averageNodesPerDay > 5) {
            return {
                type: 'balanced',
                confidence: 0.7,
                reason: `Mixed temporal pattern - balanced spacing recommended`
            };
        }

        // Default case
        return {
            type: 'balanced',
            confidence: 0.5,
            reason: `Standard temporal distribution - balanced spacing`
        };
    }

    /**
     * Simple hash function for strings
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

    // Performance optimization: Event listener management
    private addEventListener(element: Element | Document | Window, event: string, handler: EventListener): void {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    private removeAllEventListeners(): void {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    // Performance optimization: Debounced settings updates
    private debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
        let timeoutId: NodeJS.Timeout;
        return ((...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        }) as T;
    }

    private scheduleSettingsUpdate(key: string, value: any): void {
        this.pendingSettingsUpdates.set(key, value);
        
        if (this.settingsUpdateTimeout) {
            clearTimeout(this.settingsUpdateTimeout);
        }
        
        this.settingsUpdateTimeout = setTimeout(() => {
            this.flushSettingsUpdates();
        }, 300);
    }

    private flushSettingsUpdates(): void {
        if (this.pendingSettingsUpdates.size === 0) return;
        
        const currentSettings = this.getSonicGraphSettings();
        let needsRendererUpdate = false;
        
        // Apply all updates at once
        this.pendingSettingsUpdates.forEach((value, key) => {
            if (key.startsWith('layout.')) {
                const layoutKey = key.substring(7);
                (currentSettings.layout as any)[layoutKey] = value;
                needsRendererUpdate = true;
            } else {
                (currentSettings as any)[key] = value;
            }
        });
        
        // Single save operation
        this.plugin.saveSettings();
        
        // Single renderer update if needed
        if (needsRendererUpdate && this.graphRenderer) {
            this.graphRenderer.updateLayoutSettings(currentSettings.layout);
        }
        
        this.pendingSettingsUpdates.clear();
        this.settingsUpdateTimeout = null;
    }

    // Performance optimization: Non-blocking operations
    private executeWhenIdle<T>(callback: () => T): Promise<T> {
        return new Promise((resolve) => {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => resolve(callback()));
            } else {
                setTimeout(() => resolve(callback()), 0);
            }
        });
    }

    // Performance optimization: Progress indicator
    private showProgressIndicator(message: string): void {
        if (!this.progressIndicator) {
            this.progressIndicator = this.contentEl.createDiv({
                cls: 'sonic-graph-progress-indicator'
            });
            this.progressIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 20px;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
        }
        
        this.progressIndicator.innerHTML = `
            <div class="sonic-graph-spinner" style="
                width: 20px;
                height: 20px;
                border: 2px solid var(--background-modifier-border);
                border-top: 2px solid var(--interactive-accent);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <span>${message}</span>
        `;
        this.progressIndicator.style.display = 'flex';
    }

    private hideProgressIndicator(): void {
        if (this.progressIndicator) {
            this.progressIndicator.style.display = 'none';
        }
    }

    // Performance optimization: DOM operations batching
    private batchDOMUpdates(updates: Array<() => void>): void {
        const fragment = document.createDocumentFragment();
        const tempContainer = document.createElement('div');
        fragment.appendChild(tempContainer);
        
        updates.forEach(update => update());
        
        // Single reflow/repaint
        requestAnimationFrame(() => {
            // DOM updates have been batched
        });
    }
} 