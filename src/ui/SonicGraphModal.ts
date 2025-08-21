/**
 * SonicGraphModal
 * 
 * A large modal for displaying and interacting with the temporal graph animation.
 * Features static graph view by default with play button to trigger animation.
 * Includes timeline controls, settings panel, and cross-navigation to Control Center.
 */

import { App, Modal, ButtonComponent, Notice, setTooltip, Setting } from 'obsidian';
import { GraphDataExtractor, GraphNode } from '../graph/GraphDataExtractor';
import { GraphRenderer } from '../graph/GraphRenderer';
import { TemporalGraphAnimator } from '../graph/TemporalGraphAnimator';
import { MusicalMapper } from '../graph/musical-mapper';
import { AdaptiveDetailManager, FilteredGraphData } from '../graph/AdaptiveDetailManager';
import { createLucideIcon } from './lucide-icons';
import { getLogger, LoggerFactory } from '../logging';
import { SonicGraphSettings } from '../utils/constants';
import * as d3 from 'd3';
import type SonigraphPlugin from '../main';
import { ContinuousLayerManager } from '../audio/layers/ContinuousLayerManager';

const logger = getLogger('SonicGraphModal');

export class SonicGraphModal extends Modal {
    private plugin: SonigraphPlugin;
    private graphDataExtractor: GraphDataExtractor;
    private graphRenderer: GraphRenderer | null = null;
    private temporalAnimator: TemporalGraphAnimator | null = null;
    private musicalMapper: MusicalMapper | null = null;
    private adaptiveDetailManager: AdaptiveDetailManager | null = null;
    private continuousLayerManager: ContinuousLayerManager | null = null;
    private isAnimating: boolean = false;
    private isTimelineView: boolean = false; // false = Static View, true = Timeline View
    
    // Performance optimization: Event listener management
    private eventListeners: Array<{ element: Element | Document | Window, event: string, handler: EventListener }> = [];
    
    // Performance optimization: Settings debouncing
    private pendingSettingsUpdates = new Map<string, any>();
    private settingsUpdateTimeout: NodeJS.Timeout | null = null;
    
    // Performance optimization: Progress indicator
    private progressIndicator: HTMLElement | null = null;
    
    // Responsive sizing: Resize observer for dynamic graph sizing
    private resizeObserver: ResizeObserver | null = null;
    
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
    
    // Audio density tracking for even distribution
    private nodeAppearanceCounter: number = 0;
    private lastAudioNodeIndex: number = -1;

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
            
            // Let Obsidian handle the close button naturally - no modal header interference
            
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

    /**
     * Initialize continuous layers for Phase 3
     */
    private async initializeContinuousLayers(): Promise<void> {
        try {
            logger.info('continuous-layers', 'Initializing continuous layers');
            
            if (!this.continuousLayerManager) {
                this.continuousLayerManager = new ContinuousLayerManager(
                    this.plugin.settings
                );
            }
            
            // Initialize and start the continuous layers
            await this.continuousLayerManager.initialize();
            await this.continuousLayerManager.start();
            
            // Update vault state with initial values
            const totalNodes = this.app.vault.getMarkdownFiles().length;
            this.continuousLayerManager.updateVaultState({
                totalNodes,
                visibleNodes: new Set<string>(),
                maxNodes: totalNodes,
                currentAnimationProgress: 0,
                vaultActivityLevel: 0
            });
            
            logger.info('continuous-layers', 'Continuous layers initialized successfully');
        } catch (error) {
            logger.error('continuous-layers', 'Failed to initialize continuous layers', error);
            new Notice('Failed to initialize continuous audio layers');
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
        
        // Cleanup continuous layers
        if (this.continuousLayerManager) {
            this.continuousLayerManager.stop();
            this.continuousLayerManager = null;
        }
        
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
        
        // Cleanup resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
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
        
        // Title on the left with icon
        const titleContainer = this.headerContainer.createDiv({ cls: 'sonic-graph-title-container' });
        const titleIcon = createLucideIcon('chart-network', 20);
        titleContainer.appendChild(titleIcon);
        titleContainer.createEl('h1', { text: 'Sonic Graph', cls: 'sonic-graph-title' });
        
        // Button group container on the right
        const buttonGroup = this.headerContainer.createDiv({ cls: 'sonic-graph-header-button-group' });
        
        // Plugin Settings button
        const pluginSettingsBtn = buttonGroup.createEl('button', { 
            cls: 'sonic-graph-header-btn sonic-graph-plugin-settings-btn',
            text: 'Plugin Settings'
        });
        const pluginSettingsIcon = createLucideIcon('cog', 16);
        pluginSettingsBtn.insertBefore(pluginSettingsIcon, pluginSettingsBtn.firstChild);
        pluginSettingsBtn.addEventListener('click', () => this.openPluginSettings());
        
        // Control Center button
        const controlCenterBtn = buttonGroup.createEl('button', { 
            cls: 'sonic-graph-header-btn sonic-graph-control-center-btn',
            text: 'Control Center'
        });
        const controlCenterIcon = createLucideIcon('keyboard-music', 16);
        controlCenterBtn.insertBefore(controlCenterIcon, controlCenterBtn.firstChild);
        controlCenterBtn.addEventListener('click', () => this.openControlCenter());
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
            
            // Initialize adaptive detail manager
            logger.info('sonic-graph-adaptive', 'Initializing adaptive detail manager');
            const adaptiveSettings = this.getSonicGraphSettings().adaptiveDetail;
            this.adaptiveDetailManager = new AdaptiveDetailManager(adaptiveSettings);
            this.adaptiveDetailManager.setGraphData(graphData.nodes, graphData.links);
            logger.info('sonic-graph-adaptive', 'Adaptive detail manager initialized', {
                enabled: adaptiveSettings.enabled,
                mode: adaptiveSettings.mode,
                nodeCount: graphData.nodes.length,
                linkCount: graphData.links.length
            });
            
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
                // Use container dimensions instead of fixed 800x600
                const width = canvasElement.clientWidth || canvasElement.offsetWidth || 800;
                const height = canvasElement.clientHeight || canvasElement.offsetHeight || 600;
                
                logger.info('sonic-graph-responsive', 'Using responsive dimensions', {
                    width, height,
                    clientWidth: canvasElement.clientWidth,
                    clientHeight: canvasElement.clientHeight
                });
                
                return new GraphRenderer(canvasElement, {
                    width: width,
                    height: height,
                    enableZoom: true,
                    showLabels: false
                });
            });
            logger.info('sonic-graph-renderer', 'GraphRenderer created successfully');
            
            // Set up adaptive detail zoom change callback
            logger.info('sonic-graph-adaptive', 'Setting up zoom change callback for adaptive detail');
            
            // Set up callback for debounced detail level changes
            this.adaptiveDetailManager.setDetailLevelChangedCallback((filteredData) => {
                this.applyFilteredData(filteredData);
                logger.debug('sonic-graph-adaptive', 'Detail level changed via callback', {
                    level: filteredData.level,
                    visibleNodes: filteredData.nodes.length,
                    visibleLinks: filteredData.links.length
                });
            });
            
            this.graphRenderer.setOnZoomChangeCallback((zoomLevel: number) => {
                if (this.adaptiveDetailManager) {
                    const filteredData = this.adaptiveDetailManager.handleZoomChange(zoomLevel);
                    this.applyFilteredData(filteredData);
                    logger.debug('sonic-graph-adaptive', 'Zoom change processed', {
                        zoomLevel,
                        level: filteredData.level,
                        visibleNodes: filteredData.nodes.length,
                        visibleLinks: filteredData.links.length
                    });
                }
            });
            
            // Set up responsive resizing
            this.setupResizeObserver(canvasElement);
            
            // Phase 3.8: Apply layout settings to renderer
            this.showProgressIndicator('Applying layout settings...');
            try {
                logger.info('sonic-graph-layout', 'Getting layout settings');
                const layoutSettings = this.getSonicGraphSettings().layout;
                logger.info('sonic-graph-layout', 'Applying layout settings to renderer', layoutSettings);
                await this.executeWhenIdle(() => {
                    this.graphRenderer!.updateLayoutSettings(layoutSettings);
                    this.graphRenderer!.updateContentAwareSettings(this.getSonicGraphSettings().contentAwarePositioning);
                    this.graphRenderer!.updateSmartClusteringSettings(this.getSonicGraphSettings().smartClustering);
                });
                logger.info('sonic-graph-layout', 'Layout settings applied successfully');
            } catch (layoutError) {
                logger.error('sonic-graph-layout', 'Failed to apply layout settings:', (layoutError as Error).message);
                logger.error('sonic-graph-layout', 'Layout error stack:', (layoutError as Error).stack);
                throw new Error(`Layout configuration failed: ${(layoutError as Error).message}`);
            }
            
            // Apply initial adaptive detail filtering based on initial zoom level
            logger.info('sonic-graph-adaptive', 'Applying initial adaptive detail filtering');
            const initialZoom = 0.3; // This matches the zoom level set below
            const filteredData = this.adaptiveDetailManager.handleZoomChange(initialZoom);
            logger.info('sonic-graph-adaptive', 'Initial filtering applied', {
                level: filteredData.level,
                originalNodes: graphData.nodes.length,
                filteredNodes: filteredData.nodes.length,
                originalLinks: graphData.links.length,
                filteredLinks: filteredData.links.length,
                filterReason: filteredData.stats.filterReason
            });
            
            // Render the graph with filtered data
            try {
                logger.info('sonic-graph-render', 'Starting graph render process');
                logger.info('sonic-graph-render', 'Render data summary', {
                    nodeCount: filteredData.nodes.length,
                    linkCount: filteredData.links.length,
                    detailLevel: filteredData.level,
                    sampleNodes: filteredData.nodes.slice(0, 3).map(n => ({ id: n.id, type: n.type })),
                    sampleLinks: filteredData.links.slice(0, 3).map(l => ({ source: l.source, target: l.target, type: l.type }))
                });
                
                this.graphRenderer.render(filteredData.nodes, filteredData.links);
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
            
            // Reset audio density counters for even distribution
            this.nodeAppearanceCounter = 0;
            this.lastAudioNodeIndex = -1;
            
            // Start animation
            this.playButton.setButtonText('Pause Animation');
            this.timelineContainer.classList.remove('timeline-hidden');
            this.timelineContainer.classList.add('timeline-visible');
            
            // Show current position indicator during animation
            const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator') as HTMLElement;
            if (currentIndicator) {
                currentIndicator.style.display = 'block';
            }
            
            // Initialize and start continuous layers if enabled
            if (this.plugin.settings.audioEnhancement?.continuousLayers?.enabled) {
                await this.initializeContinuousLayers();
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
            
            // Stop continuous layers if running
            if (this.continuousLayerManager) {
                this.continuousLayerManager.stop();
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
     * Open Plugin Settings
     */
    private openPluginSettings(): void {
        this.close(); // Close this modal first
        
        // Open Plugin Settings
        (this.app as any).setting.open();
        (this.app as any).setting.openTabById(this.plugin.manifest.id);
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
        
        // 2. Groups section
        this.createGroupsSettings(settingsContent);
        
        // 3. Visual section
        this.createVisualSettings(settingsContent);
        
        // 4. Layout section
        this.createLayoutSettings(settingsContent);
        
        // 4.5. Adaptive Detail Override (Quick Override)
        this.createAdaptiveDetailOverride(settingsContent);
        
        // 4.6. Content-Aware Positioning section
        this.createContentAwarePositioningSettings(settingsContent);
        
        // 4.7. Smart Clustering Algorithms section
        this.createSmartClusteringSettings(settingsContent);
        
        // 5. Timeline section
        this.createTimelineSettings(settingsContent);
        
        // 6. Audio section
        this.createAudioSettings(settingsContent);
        
        // 7. Navigation section
        this.createNavigationSettings(settingsContent);
        
        // 8. Advanced section
        this.createAdvancedSettings(settingsContent);
    }

    /**
     * Create adaptive detail override section (Quick Override)
     */
    private createAdaptiveDetailOverride(container: HTMLElement): void {
        const adaptiveSettings = this.getSonicGraphSettings().adaptiveDetail;
        
        // Only show if adaptive detail is enabled in main settings
        if (!adaptiveSettings || !adaptiveSettings.enabled) {
            return;
        }

        const section = container.createDiv({ cls: 'sonic-graph-settings-section adaptive-detail-override' });
        section.createEl('div', { text: 'ADAPTIVE DETAIL', cls: 'sonic-graph-settings-section-title' });
        
        // Session override toggle using Obsidian Setting API
        new Setting(section)
            .setName('Disable for this session')
            .setDesc('The Adaptive Detail system automatically hides nodes and links based on zoom level to improve performance. Disable this to see all nodes/links regardless of zoom, but expect slower performance on large graphs.')
            .addToggle(toggle => toggle
                .setValue(false) // Start with adaptive detail enabled
                .onChange((isOverridden) => {
            
            // Update adaptive detail manager if it exists
            if (this.adaptiveDetailManager) {
                this.adaptiveDetailManager.setSessionOverride(isOverridden);
                
                // Immediately apply the change if graph renderer exists
                if (this.graphRenderer) {
                    const currentZoom = this.graphRenderer.getCurrentZoom();
                    const filteredData = this.adaptiveDetailManager.handleZoomChange(currentZoom);
                    this.applyFilteredData(filteredData);
                }
            }
            
            logger.info('adaptive-detail-override', 'Session override toggled', { 
                overridden: isOverridden,
                meaning: isOverridden ? 'Show all (disabled)' : 'Adaptive filtering (enabled)'
            });
                })
            );

        // Status indicator
        const statusItem = section.createDiv({ cls: 'sonic-graph-setting-item adaptive-detail-status' });
        statusItem.createEl('label', { text: 'Current mode', cls: 'sonic-graph-setting-label' });
        const statusText = statusItem.createEl('div', { 
            text: `${adaptiveSettings.mode} (${adaptiveSettings.enabled ? 'enabled' : 'disabled'})`, 
            cls: 'sonic-graph-setting-status' 
        });
        
        // Add note about main settings
        const noteItem = section.createDiv({ cls: 'sonic-graph-setting-item adaptive-detail-note' });
        noteItem.createEl('div', { 
            text: 'Configure adaptive detail settings in Plugin Settings > Sonic Graph Settings', 
            cls: 'sonic-graph-setting-note sonic-graph-small-text' 
        });
    }

    /**
     * Apply filtered graph data from adaptive detail manager
     */
    private applyFilteredData(filteredData: FilteredGraphData): void {
        if (!this.graphRenderer) {
            logger.warn('adaptive-detail', 'Cannot apply filtered data: GraphRenderer not initialized');
            return;
        }

        try {
            // Update the graph renderer with filtered nodes and links
            this.graphRenderer.render(filteredData.nodes, filteredData.links);
            
            // Update stats to reflect the filtering
            this.updateStatsWithFilteredData(filteredData);
            
            logger.debug('adaptive-detail', 'Filtered data applied successfully', {
                level: filteredData.level,
                visibleNodes: filteredData.stats.visibleNodes,
                totalNodes: filteredData.stats.totalNodes,
                visibleLinks: filteredData.stats.visibleLinks,
                totalLinks: filteredData.stats.totalLinks,
                filterReason: filteredData.stats.filterReason
            });
        } catch (error) {
            logger.error('adaptive-detail', 'Failed to apply filtered data', { 
                error: (error as Error).message,
                level: filteredData.level 
            });
        }
    }

    /**
     * Update stats display with filtered data information
     */
    private updateStatsWithFilteredData(filteredData: FilteredGraphData): void {
        if (!this.statsContainer) return;

        // Create adaptive detail stats info if it doesn't exist
        let adaptiveStatsEl = this.statsContainer.querySelector('.adaptive-detail-stats') as HTMLElement;
        if (!adaptiveStatsEl) {
            adaptiveStatsEl = this.statsContainer.createDiv({ cls: 'adaptive-detail-stats' });
        }

        // Update the adaptive detail stats
        const { stats } = filteredData;
        const nodeReduction = ((stats.totalNodes - stats.visibleNodes) / stats.totalNodes * 100).toFixed(0);
        const linkReduction = ((stats.totalLinks - stats.visibleLinks) / stats.totalLinks * 100).toFixed(0);

        adaptiveStatsEl.innerHTML = `
            <div class="adaptive-detail-level sonic-graph-small-text">Detail: ${filteredData.level}</div>
            <div class="adaptive-detail-nodes sonic-graph-small-text">Nodes: ${stats.visibleNodes}/${stats.totalNodes} (-${nodeReduction}%)</div>
            <div class="adaptive-detail-links sonic-graph-small-text">Links: ${stats.visibleLinks}/${stats.totalLinks} (-${linkReduction}%)</div>
        `;
    }

    /**
     * Create content-aware positioning settings section
     */
    private createContentAwarePositioningSettings(container: HTMLElement): void {
        const settings = this.getSonicGraphSettings().contentAwarePositioning;
        
        // Only show if content-aware positioning is enabled in main settings
        if (!settings || !settings.enabled) {
            return;
        }

        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'CONTENT-AWARE POSITIONING', cls: 'sonic-graph-settings-section-title' });
        
        // Tag Influence Weight
        const tagWeightItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        tagWeightItem.createEl('label', { text: 'Tag influence weight', cls: 'sonic-graph-setting-label' });
        tagWeightItem.createEl('div', { 
            text: 'How strongly shared tags attract nodes together', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const tagWeightContainer = tagWeightItem.createDiv({ cls: 'sonic-graph-weight-slider-container' });
        const tagWeightSlider = tagWeightContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-weight-slider'
        });
        tagWeightSlider.min = '0';
        tagWeightSlider.max = '1';
        tagWeightSlider.step = '0.1';
        tagWeightSlider.value = settings.tagInfluence.weight.toString();
        
        // Add value display for the slider
        const tagWeightValueDisplay = tagWeightContainer.createEl('span', {
            text: Math.round(settings.tagInfluence.weight * 100) + '%',
            cls: 'sonic-graph-weight-value'
        });

        // Add tooltip to tag influence slider
        setTooltip(tagWeightSlider, 'Controls how strongly notes with shared tags are attracted to each other. Higher values create tighter tag-based clusters. Files with common tags will group together, making it easier to see thematic relationships in your vault.', {
            placement: 'top'
        });
        
        // Add event handler for tag weight changes with real-time preview
        tagWeightSlider.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const weight = parseFloat(target.value);
            tagWeightValueDisplay.textContent = Math.round(weight * 100) + '%';
            
            // Real-time preview: Apply immediately to graph
            this.applyContentAwareWeightPreview('tagInfluence', weight);
            
            // Save settings with debounce
            this.updateTagInfluenceWeight(weight);
        });
        
        const tagWeightLabels = tagWeightContainer.createDiv({ cls: 'sonic-graph-weight-labels' });
        tagWeightLabels.createEl('span', { text: 'Weak', cls: 'sonic-graph-weight-label' });
        tagWeightLabels.createEl('span', { text: 'Strong', cls: 'sonic-graph-weight-label' });
        
        // Temporal Positioning Weight (only if enabled)
        if (settings.temporalPositioning.enabled) {
            const temporalWeightItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
            temporalWeightItem.createEl('label', { text: 'Temporal positioning weight', cls: 'sonic-graph-setting-label' });
            temporalWeightItem.createEl('div', { 
                text: 'How strongly creation time influences node positioning', 
                cls: 'sonic-graph-setting-description' 
            });
            
            const temporalWeightContainer = temporalWeightItem.createDiv({ cls: 'sonic-graph-weight-slider-container' });
            const temporalWeightSlider = temporalWeightContainer.createEl('input', {
                type: 'range',
                cls: 'sonic-graph-weight-slider'
            });
            temporalWeightSlider.min = '0';
            temporalWeightSlider.max = '1';
            temporalWeightSlider.step = '0.05';
            temporalWeightSlider.value = settings.temporalPositioning.weight.toString();
            
            const temporalWeightValueDisplay = temporalWeightContainer.createEl('span', {
                text: Math.round(settings.temporalPositioning.weight * 100) + '%',
                cls: 'sonic-graph-weight-value'
            });

            // Add tooltip to temporal positioning slider
            setTooltip(temporalWeightSlider, 'Controls how creation time influences node positioning. Higher values organize nodes along a temporal axis - newer files gravitate toward center, older files toward periphery. Helps visualize the evolution of your knowledge over time.', {
                placement: 'top'
            });
            
            temporalWeightSlider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const weight = parseFloat(target.value);
                temporalWeightValueDisplay.textContent = Math.round(weight * 100) + '%';
                
                // Real-time preview: Apply immediately to graph
                this.applyContentAwareWeightPreview('temporalPositioning', weight);
                
                // Save settings with debounce
                this.updateTemporalPositioningWeight(weight);
            });
            
            const temporalWeightLabels = temporalWeightContainer.createDiv({ cls: 'sonic-graph-weight-labels' });
            temporalWeightLabels.createEl('span', { text: 'Weak', cls: 'sonic-graph-weight-label' });
            temporalWeightLabels.createEl('span', { text: 'Strong', cls: 'sonic-graph-weight-label' });
        }
        
        // Hub Centrality Weight (only if enabled)
        if (settings.hubCentrality.enabled) {
            const hubWeightItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
            hubWeightItem.createEl('label', { text: 'Hub centrality weight', cls: 'sonic-graph-setting-label' });
            hubWeightItem.createEl('div', { 
                text: 'How strongly highly connected nodes pull toward center', 
                cls: 'sonic-graph-setting-description' 
            });
            
            const hubWeightContainer = hubWeightItem.createDiv({ cls: 'sonic-graph-weight-slider-container' });
            const hubWeightSlider = hubWeightContainer.createEl('input', {
                type: 'range',
                cls: 'sonic-graph-weight-slider'
            });
            hubWeightSlider.min = '0';
            hubWeightSlider.max = '1';
            hubWeightSlider.step = '0.05';
            hubWeightSlider.value = settings.hubCentrality.weight.toString();
            
            const hubWeightValueDisplay = hubWeightContainer.createEl('span', {
                text: Math.round(settings.hubCentrality.weight * 100) + '%',
                cls: 'sonic-graph-weight-value'
            });

            // Add tooltip to hub centrality slider
            setTooltip(hubWeightSlider, 'Controls how strongly highly connected nodes are pulled toward the graph center. Higher values make hub notes (with many links) more prominent by positioning them centrally. Creates natural hub-and-spoke patterns.', {
                placement: 'top'
            });
            
            hubWeightSlider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const weight = parseFloat(target.value);
                hubWeightValueDisplay.textContent = Math.round(weight * 100) + '%';
                
                // Real-time preview: Apply immediately to graph
                this.applyContentAwareWeightPreview('hubCentrality', weight);
                
                // Save settings with debounce
                this.updateHubCentralityWeight(weight);
            });
            
            const hubWeightLabels = hubWeightContainer.createDiv({ cls: 'sonic-graph-weight-labels' });
            hubWeightLabels.createEl('span', { text: 'Weak', cls: 'sonic-graph-weight-label' });
            hubWeightLabels.createEl('span', { text: 'Strong', cls: 'sonic-graph-weight-label' });
        }
        
        // Debug Visualization Toggle
        const debugItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        debugItem.createEl('label', { text: 'Debug visualization', cls: 'sonic-graph-setting-label' });
        debugItem.createEl('div', { 
            text: 'Show visual indicators for force influences', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const debugToggle = debugItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const debugSwitch = debugToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (settings.debugVisualization) {
            debugSwitch.addClass('active');
        }
        const debugHandle = debugSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });

        // Add tooltip to debug visualization toggle
        setTooltip(debugSwitch, 'Shows visual debugging overlays: temporal zones (green/blue/gray circles), tag connections (orange dashed lines), and hub indicators (red circles). Useful for understanding how content-aware forces affect node positioning.', {
            placement: 'left'
        });
        
        debugSwitch.addEventListener('click', () => {
            const isActive = debugSwitch.hasClass('active');
            debugSwitch.toggleClass('active', !isActive);
            
            // Real-time preview: Apply immediately to graph
            this.applyContentAwareDebugPreview(!isActive);
            
            // Save settings with debounce
            this.updateDebugVisualization(!isActive);
        });
    }

    /**
     * Create smart clustering settings section
     */
    private createSmartClusteringSettings(container: HTMLElement): void {
        const settings = this.getSonicGraphSettings().smartClustering;
        
        // Only show if smart clustering is enabled in main settings
        if (!settings || !settings.enabled) {
            return;
        }

        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'SMART CLUSTERING', cls: 'sonic-graph-settings-section-title' });
        
        // Algorithm Selection
        const algorithmItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        algorithmItem.createEl('label', { text: 'Clustering algorithm', cls: 'sonic-graph-setting-label' });
        algorithmItem.createEl('div', { 
            text: 'Algorithm used for automatic cluster detection', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const algorithmSelect = algorithmItem.createEl('select', {
            cls: 'sonic-graph-algorithm-select'
        });
        
        ['louvain', 'modularity', 'hybrid'].forEach(algorithm => {
            const option = algorithmSelect.createEl('option');
            option.value = algorithm;
            option.textContent = algorithm === 'louvain' ? 'Louvain (Fast)' : 
                               algorithm === 'modularity' ? 'Modularity (Quality)' : 
                               'Hybrid (Recommended)';
            if (algorithm === settings.algorithm) {
                option.selected = true;
            }
        });
        
        // Add tooltip to clustering algorithm dropdown
        setTooltip(algorithmSelect, 'Choose the clustering algorithm for automatic group detection. Louvain (Fast) prioritizes speed for large graphs, Modularity (Quality) emphasizes cluster quality, and Hybrid (Recommended) balances both speed and quality for optimal results.', {
            placement: 'top'
        });
        
        algorithmSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const algorithm = target.value as 'louvain' | 'modularity' | 'hybrid';
            this.updateClusteringAlgorithm(algorithm);
        });
        
        // Multi-Factor Weights Section
        const weightsHeader = section.createDiv({ cls: 'sonic-graph-weights-header' });
        weightsHeader.createEl('h4', { text: 'Multi-Factor Weights', cls: 'sonic-graph-weights-title' });
        weightsHeader.createEl('div', { 
            text: 'Adjust the relative importance of different clustering factors', 
            cls: 'sonic-graph-setting-description' 
        });
        
        // Link Strength Weight
        this.createWeightSlider(section, 'Link strength', 
            'Direct connections between files', 
            settings.weights.linkStrength, 0, 1, 0.05,
            (weight) => this.updateClusteringWeight('linkStrength', weight),
            'Controls how much direct wikilinks and references between files influence clustering. Higher values group strongly linked files together more aggressively.');
        
        // Shared Tags Weight
        this.createWeightSlider(section, 'Shared tags', 
            'Files with common tags cluster together', 
            settings.weights.sharedTags, 0, 1, 0.05,
            (weight) => this.updateClusteringWeight('sharedTags', weight),
            'Controls how much shared tags between files influence clustering. Higher values group files with similar tags more strongly, creating topic-based clusters.');
        
        // Folder Hierarchy Weight
        this.createWeightSlider(section, 'Folder hierarchy', 
            'Files in similar folder structures', 
            settings.weights.folderHierarchy, 0, 1, 0.05,
            (weight) => this.updateClusteringWeight('folderHierarchy', weight),
            'Controls how much folder organization influences clustering. Higher values group files from the same or related folders together, respecting your existing folder structure.');
        
        // Temporal Proximity Weight
        this.createWeightSlider(section, 'Temporal proximity', 
            'Files created around the same time', 
            settings.weights.temporalProximity, 0, 1, 0.05,
            (weight) => this.updateClusteringWeight('temporalProximity', weight),
            'Controls how much creation and modification dates influence clustering. Higher values group files created or modified around the same time periods together.');
        
        // Clustering Parameters Section
        const parametersHeader = section.createDiv({ cls: 'sonic-graph-parameters-header' });
        parametersHeader.createEl('h4', { text: 'Clustering Parameters', cls: 'sonic-graph-parameters-title' });
        
        // Minimum Cluster Size
        const minSizeItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        minSizeItem.createEl('label', { text: 'Minimum cluster size', cls: 'sonic-graph-setting-label' });
        minSizeItem.createEl('div', { 
            text: 'Minimum number of nodes required to form a cluster', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const minSizeContainer = minSizeItem.createDiv({ cls: 'sonic-graph-number-container' });
        const minSizeInput = minSizeContainer.createEl('input', {
            type: 'number',
            cls: 'sonic-graph-number-input'
        });
        minSizeInput.min = '2';
        minSizeInput.max = '10';
        minSizeInput.value = settings.clustering.minClusterSize.toString();
        
        minSizeInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            const minSize = parseInt(target.value);
            this.updateClusteringParameter('minClusterSize', minSize);
        });

        // Add tooltip to minimum cluster size input
        setTooltip(minSizeInput, 'Set the minimum number of files required to form a cluster. Higher values (8-10) create fewer, larger clusters suitable for broad topic groupings. Lower values (2-4) allow more granular clustering but may create many small groups.', {
            placement: 'top',
            delay: 500
        });
        
        // Maximum Clusters
        const maxClustersItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        maxClustersItem.createEl('label', { text: 'Maximum clusters', cls: 'sonic-graph-setting-label' });
        maxClustersItem.createEl('div', { 
            text: 'Maximum number of clusters to create', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const maxClustersContainer = maxClustersItem.createDiv({ cls: 'sonic-graph-number-container' });
        const maxClustersInput = maxClustersContainer.createEl('input', {
            type: 'number',
            cls: 'sonic-graph-number-input'
        });
        maxClustersInput.min = '3';
        maxClustersInput.max = '25';
        maxClustersInput.value = settings.clustering.maxClusters.toString();
        
        maxClustersInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            const maxClusters = parseInt(target.value);
            this.updateClusteringParameter('maxClusters', maxClusters);
        });

        // Add tooltip to maximum clusters input
        setTooltip(maxClustersInput, 'Limit the total number of clusters created. Lower values (3-8) force broader groupings suitable for high-level organization. Higher values (15-25) allow more detailed clustering but may create too many small groups to manage effectively.', {
            placement: 'top',
            delay: 500
        });
        
        // Visualization Options Section
        const visualizationHeader = section.createDiv({ cls: 'sonic-graph-visualization-header' });
        visualizationHeader.createEl('h4', { text: 'Visualization', cls: 'sonic-graph-visualization-title' });
        
        // Show Cluster Labels Toggle using Obsidian Setting API
        new Setting(section)
            .setName('Show cluster labels')
            .setDesc('Display auto-generated names for each cluster. Labels help identify the content theme of each group, such as "Projects", "Daily Notes", or topic-based clusters.')
            .addToggle(toggle => toggle
                .setValue(settings.visualization.showClusterLabels)
                .onChange((value) => {
                    this.updateClusteringVisualization('showClusterLabels', value);
                })
            );
        
        // Cluster Boundaries Style
        const boundariesItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        boundariesItem.createEl('label', { text: 'Cluster boundaries', cls: 'sonic-graph-setting-label' });
        boundariesItem.createEl('div', { 
            text: 'Visual style for cluster boundaries', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const boundariesSelect = boundariesItem.createEl('select', {
            cls: 'sonic-graph-boundaries-select'
        });
        
        ['none', 'subtle', 'visible', 'prominent'].forEach(style => {
            const option = boundariesSelect.createEl('option');
            option.value = style;
            option.textContent = style.charAt(0).toUpperCase() + style.slice(1);
            if (style === settings.visualization.clusterBoundaries) {
                option.selected = true;
            }
        });
        
        boundariesSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const style = target.value as 'none' | 'subtle' | 'visible' | 'prominent';
            this.updateClusteringVisualization('clusterBoundaries', style);
        });
        
        // Debug Mode Toggle (if debugging is enabled)
        if (settings.debugging.debugMode) {
            const debugItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
            debugItem.createEl('label', { text: 'Show statistics', cls: 'sonic-graph-setting-label' });
            debugItem.createEl('div', { 
                text: 'Display clustering quality metrics and debug information', 
                cls: 'sonic-graph-setting-description' 
            });
            
            const debugToggle = debugItem.createEl('button', {
                cls: `sonic-graph-toggle ${settings.debugging.showStatistics ? 'active' : ''}`,
                text: settings.debugging.showStatistics ? 'ON' : 'OFF'
            });
            
            debugToggle.addEventListener('click', () => {
                const isActive = debugToggle.classList.contains('active');
                debugToggle.classList.toggle('active');
                debugToggle.textContent = isActive ? 'OFF' : 'ON';
                this.updateClusteringDebugging('showStatistics', !isActive);
            });
        }
    }

    /**
     * Helper method to create weight sliders for clustering factors
     */
    private createWeightSlider(container: HTMLElement, name: string, description: string, 
                              currentValue: number, min: number, max: number, step: number,
                              onChange: (value: number) => void, tooltipText?: string): void {
        const weightItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        weightItem.createEl('label', { text: name, cls: 'sonic-graph-setting-label' });
        weightItem.createEl('div', { 
            text: description, 
            cls: 'sonic-graph-setting-description' 
        });
        
        const weightContainer = weightItem.createDiv({ cls: 'sonic-graph-weight-slider-container' });
        const weightSlider = weightContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-weight-slider'
        });
        weightSlider.min = min.toString();
        weightSlider.max = max.toString();
        weightSlider.step = step.toString();
        weightSlider.value = currentValue.toString();
        
        // Add value display for the slider
        const weightValueDisplay = weightContainer.createEl('span', {
            text: Math.round(currentValue * 100) + '%',
            cls: 'sonic-graph-weight-value'
        });
        
        // Add tooltip if provided
        if (tooltipText) {
            setTooltip(weightSlider, tooltipText, {
                placement: 'top'
            });
        }
        
        // Add event handler with real-time preview
        weightSlider.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const weight = parseFloat(target.value);
            weightValueDisplay.textContent = Math.round(weight * 100) + '%';
            
            // Call the provided onChange handler
            onChange(weight);
        });
        
        const weightLabels = weightContainer.createDiv({ cls: 'sonic-graph-weight-labels' });
        weightLabels.createEl('span', { text: 'Low', cls: 'sonic-graph-weight-label' });
        weightLabels.createEl('span', { text: 'High', cls: 'sonic-graph-weight-label' });
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

        // Add tooltip to audio density slider
        setTooltip(densitySlider, 'Controls how frequently notes play during timeline animation. 100% = every file plays audio, 5% = only 5% of files play audio. Use lower values for large graphs to prevent audio overload.', {
            placement: 'top'
        });
        
        const densityLabels = densityContainer.createDiv({ cls: 'sonic-graph-density-labels' });
        densityLabels.createEl('span', { text: 'Sparse', cls: 'sonic-graph-density-label' });
        densityLabels.createEl('span', { text: 'Dense', cls: 'sonic-graph-density-label' });
        
        // Animation Duration
        const durationItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        durationItem.createEl('label', { text: 'Animation duration', cls: 'sonic-graph-setting-label' });
        durationItem.createEl('div', { 
            text: 'Control how long the timeline animation lasts', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const durationContainer = durationItem.createDiv({ cls: 'sonic-graph-density-slider-container' });
        const durationSlider = durationContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-density-slider'
        });
        durationSlider.min = '10';
        durationSlider.max = '420';
        durationSlider.step = '5';
        durationSlider.value = (this.plugin.settings.sonicGraphAnimationDuration || 60).toString();
        
        // Add value display for the slider
        const durationValueDisplay = durationContainer.createEl('span', {
            text: (this.plugin.settings.sonicGraphAnimationDuration || 60) + ' seconds',
            cls: 'sonic-graph-density-value'
        });
        
        // Add event handler for animation duration changes
        durationSlider.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const duration = parseInt(target.value);
            durationValueDisplay.textContent = duration + ' seconds';
            this.updateAnimationDuration(duration);
        });

        // Add tooltip to animation duration slider
        setTooltip(durationSlider, 'Controls how long the timeline animation lasts. Shorter durations make the animation faster, longer durations make it more contemplative. Range: 10-300 seconds.', {
            placement: 'top'
        });
        
        const durationLabels = durationContainer.createDiv({ cls: 'sonic-graph-density-labels' });
        durationLabels.createEl('span', { text: 'Fast', cls: 'sonic-graph-density-label' });
        durationLabels.createEl('span', { text: 'Slow', cls: 'sonic-graph-density-label' });
        
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
        
        toggleSwitch.addEventListener('click', () => {
            const isActive = toggleSwitch.hasClass('active');
            toggleSwitch.toggleClass('active', !isActive);
            this.updateLoopAnimation(!isActive);
        });

        // Add tooltip to loop animation toggle
        setTooltip(toggleSwitch, 'When enabled, the timeline animation automatically restarts from the beginning when it completes. Useful for continuous visualization during presentations.', {
            placement: 'left'
        });

        // Time Window Setting
        const timeWindowItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        const timeWindowLabel = timeWindowItem.createDiv({ cls: 'sonic-graph-setting-label', text: 'Time window' });
        const timeWindowDesc = timeWindowItem.createDiv({ 
            cls: 'sonic-graph-setting-description', 
            text: 'Choose which files to include in the timeline'
        });

        const timeWindowControl = timeWindowItem.createDiv({ cls: 'sonic-graph-setting-control' });
        const timeWindowSelect = timeWindowControl.createEl('select', { cls: 'sonic-graph-select' });
        
        // Add time window options
        const timeWindowOptions = [
            { value: 'all-time', text: 'All time' },
            { value: 'past-year', text: 'Past year' },
            { value: 'past-month', text: 'Past month' },
            { value: 'past-week', text: 'Past week' },
            { value: 'past-day', text: 'Past day' },
            { value: 'past-hour', text: 'Past hour' }
        ];
        
        timeWindowOptions.forEach(option => {
            const optionElement = timeWindowSelect.createEl('option', {
                value: option.value,
                text: option.text
            });
            if (option.value === this.getSonicGraphSettings().timeline.timeWindow) {
                optionElement.selected = true;
            }
        });
        
        timeWindowSelect.addEventListener('change', () => {
            this.updateTimeWindow(timeWindowSelect.value as any);
        });

        // Add tooltip to time window select
        setTooltip(timeWindowSelect, 'Filter which files appear in the timeline. "All time" shows your complete file history (default). Past options filter to recent files only for focused analysis.', {
            placement: 'top'
        });

        // Timeline Granularity Setting
        const granularityItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        const granularityLabel = granularityItem.createDiv({ cls: 'sonic-graph-setting-label', text: 'Timeline granularity' });
        const granularityDesc = granularityItem.createDiv({ 
            cls: 'sonic-graph-setting-description', 
            text: 'Choose the time range for timeline animation'
        });

        const granularityControl = granularityItem.createDiv({ cls: 'sonic-graph-setting-control' });
        const granularitySelect = granularityControl.createEl('select', { cls: 'sonic-graph-select' });
        
        // Add granularity options
        const granularityOptions = [
            { value: 'year', text: 'Year' },
            { value: 'month', text: 'Month' },
            { value: 'week', text: 'Week' },
            { value: 'day', text: 'Day' },
            { value: 'hour', text: 'Hour' },
            { value: 'custom', text: 'Custom Range' }
        ];

        granularityOptions.forEach(option => {
            const optionEl = granularitySelect.createEl('option', { 
                value: option.value, 
                text: option.text 
            });
            if (this.getSonicGraphSettings().timeline.granularity === option.value) {
                optionEl.selected = true;
            }
        });

        granularitySelect.addEventListener('change', () => {
            this.updateTimelineGranularity(granularitySelect.value as any);
        });

        // Add tooltip to granularity select
        setTooltip(granularitySelect, 'Select animation granularity for the timeline. All files are shown, but granularity affects pacing: Hour = fast progression through time, Year = slower, broader view. Helps prevent audio crackling from simultaneous events.', {
            placement: 'top'
        });

        // Custom Range Controls (initially hidden)
        const customRangeItem = section.createDiv({ 
            cls: 'sonic-graph-setting-item sonic-graph-custom-range',
            attr: { style: this.getSonicGraphSettings().timeline.granularity === 'custom' ? '' : 'display: none;' }
        });
        const customRangeLabel = customRangeItem.createDiv({ 
            cls: 'sonic-graph-setting-label', 
            text: 'Custom range' 
        });
        const customRangeDesc = customRangeItem.createDiv({ 
            cls: 'sonic-graph-setting-description', 
            text: 'Specify custom time range value and unit'
        });

        const customRangeControl = customRangeItem.createDiv({ cls: 'sonic-graph-setting-control' });
        const customRangeContainer = customRangeControl.createDiv({ cls: 'sonic-graph-custom-range-container' });
        
        const customValueInput = customRangeContainer.createEl('input', {
            type: 'number',
            cls: 'sonic-graph-number-input',
            attr: { 
                min: '1', 
                max: '999', 
                value: this.getSonicGraphSettings().timeline.customRange.value.toString() 
            }
        });

        const customUnitSelect = customRangeContainer.createEl('select', { cls: 'sonic-graph-select' });
        const unitOptions = [
            { value: 'years', text: 'Years' },
            { value: 'months', text: 'Months' },
            { value: 'weeks', text: 'Weeks' },
            { value: 'days', text: 'Days' },
            { value: 'hours', text: 'Hours' }
        ];

        unitOptions.forEach(option => {
            const optionEl = customUnitSelect.createEl('option', { 
                value: option.value, 
                text: option.text 
            });
            if (this.getSonicGraphSettings().timeline.customRange.unit === option.value) {
                optionEl.selected = true;
            }
        });

        customValueInput.addEventListener('input', () => {
            this.updateCustomRange(parseInt(customValueInput.value) || 1, customUnitSelect.value as any);
        });

        customUnitSelect.addEventListener('change', () => {
            this.updateCustomRange(parseInt(customValueInput.value) || 1, customUnitSelect.value as any);
        });

        // Add tooltips to custom range controls
        setTooltip(customValueInput, 'Enter a number for your custom time range (e.g., 3 for "3 months"). Only used when Custom Range is selected.', {
            placement: 'top'
        });
        setTooltip(customUnitSelect, 'Select the time unit for your custom range (years, months, weeks, days, or hours).', {
            placement: 'top'
        });

        // Event Spreading Mode Setting
        const spreadingItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        const spreadingLabel = spreadingItem.createDiv({ cls: 'sonic-graph-setting-label', text: 'Event spreading' });
        const spreadingDesc = spreadingItem.createDiv({ 
            cls: 'sonic-graph-setting-description', 
            text: 'How to handle clustered events to prevent audio crackling'
        });

        const spreadingControl = spreadingItem.createDiv({ cls: 'sonic-graph-setting-control' });
        const spreadingSelect = spreadingControl.createEl('select', {
            cls: 'sonic-graph-select'
        });

        const spreadingModes = [
            { value: 'none', text: 'None - No spreading', desc: 'Events play exactly when files were created. May cause audio crackling if many files were created simultaneously.' },
            { value: 'gentle', text: 'Gentle - Light spreading', desc: 'Slightly separates clustered events over a small time window. Recommended for most users.' },
            { value: 'aggressive', text: 'Aggressive - Strong spreading', desc: 'Spreads clustered events over a larger time window. Use when experiencing audio crackling with many simultaneous file creations.' }
        ];

        spreadingModes.forEach(mode => {
            const option = spreadingSelect.createEl('option', {
                value: mode.value,
                text: mode.text
            });
            if (this.getSonicGraphSettings().timeline.eventSpreadingMode === mode.value) {
                option.selected = true;
            }
        });

        spreadingSelect.addEventListener('change', () => {
            this.updateEventSpreadingMode(spreadingSelect.value as any);
        });

        // Add tooltip to event spreading dropdown (moved to left as requested)
        setTooltip(spreadingSelect, 'Choose how to handle simultaneous file creation events to prevent audio crackling. None plays all events at once, Gentle spreads them slightly, Aggressive spreads them more widely over time.', {
            placement: 'left'
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

        // Add tooltip to auto-detection dropdown
        setTooltip(detectionSelect, 'The temporal clustering system automatically detects patterns in your timeline data (Dense=frequent events, Balanced=moderate spacing, Sparse=infrequent events). Override this to force a specific audio rhythm regardless of your data patterns.', {
            placement: 'top'
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
        
        // Add tooltip to note duration slider
        setTooltip(durationSlider, 'Controls how long each synthesized note plays when a node appears during animation. Shorter durations (0.1s) create staccato effects, longer durations (2.0s) create sustained tones that overlap and build harmonies.', {
            placement: 'top'
        });

        durationSlider.addEventListener('input', () => {
            const value = parseInt(durationSlider.value) / 10;
            durationValue.textContent = `${value.toFixed(1)}s`;
            this.updateNoteDuration(value);
        });

        // Phase 1.3: Audio Enhancement Settings
        this.createAudioEnhancementSettings(section);
    }

    /**
     * Phase 1.3: Create audio enhancement settings
     */
    private createAudioEnhancementSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });
        
        // Audio Enhancement Header
        const enhancementHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        enhancementHeader.createEl('label', { 
            text: 'Audio Enhancement (Phase 1 & 2)', 
            cls: 'sonic-graph-setting-label sonic-graph-setting-header' 
        });
        enhancementHeader.createEl('div', { 
            text: 'Advanced audio mapping features for richer soundscapes', 
            cls: 'sonic-graph-setting-description' 
        });

        // Note: Freesound API Key has been moved to Control Center > Sonic Graph settings

        // Content-Aware Mapping Toggle
        new Setting(container)
            .setName('Enable content-aware mapping')
            .setDesc('Use file types, tags, and folder structure to select instruments')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.enabled || false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement) {
                        this.plugin.settings.audioEnhancement = this.getDefaultAudioEnhancementSettings();
                    }
                    
                    this.plugin.settings.audioEnhancement.contentAwareMapping.enabled = value;
                    await this.plugin.saveSettings();
                    
                    logger.info('audio-enhancement', 'Content-aware mapping toggled', { 
                        enabled: value 
                    });
                })
            );

        // Phase 2: Metadata-Driven Mapping Settings
        if (this.plugin.settings.audioEnhancement?.contentAwareMapping?.enabled) {
            // Frontmatter Property Name
            new Setting(container)
                .setName('Instrument frontmatter property')
                .setDesc('Frontmatter property name for instrument selection (e.g., "instrument: piano")')
                .addText(text => text
                    .setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.frontmatterPropertyName || 'instrument')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.audioEnhancement.contentAwareMapping.frontmatterPropertyName) {
                            this.plugin.settings.audioEnhancement.contentAwareMapping.frontmatterPropertyName = 'instrument';
                        }
                        this.plugin.settings.audioEnhancement.contentAwareMapping.frontmatterPropertyName = value;
                        await this.plugin.saveSettings();
                    })
                );

            // Musical Mood Property
            new Setting(container)
                .setName('Musical mood property')
                .setDesc('Frontmatter property for musical mood (e.g., "musical-mood: contemplative")')
                .addText(text => text
                    .setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.moodPropertyName || 'musical-mood')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.audioEnhancement.contentAwareMapping.moodPropertyName) {
                            this.plugin.settings.audioEnhancement.contentAwareMapping.moodPropertyName = 'musical-mood';
                        }
                        this.plugin.settings.audioEnhancement.contentAwareMapping.moodPropertyName = value;
                        await this.plugin.saveSettings();
                    })
                );

            // Instrument Distribution Strategy
            new Setting(container)
                .setName('Instrument distribution')
                .setDesc('How to distribute instruments across similar files')
                .addDropdown(dropdown => dropdown
                    .addOption('balanced', 'Balanced - Prevent clustering')
                    .addOption('random', 'Random - Natural variation')
                    .addOption('semantic', 'Semantic - Based on content')
                    .setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.distributionStrategy || 'balanced')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.audioEnhancement.contentAwareMapping.distributionStrategy) {
                            this.plugin.settings.audioEnhancement.contentAwareMapping.distributionStrategy = 'balanced';
                        }
                        this.plugin.settings.audioEnhancement.contentAwareMapping.distributionStrategy = value;
                        await this.plugin.saveSettings();
                    })
                );

            // Performance Info
            const performanceInfo = container.createDiv({ cls: 'sonic-graph-setting-item' });
            performanceInfo.createEl('div', { 
                text: 'Phase 2 uses Obsidian\'s metadata cache for zero-latency analysis', 
                cls: 'sonic-graph-setting-description sonic-graph-info' 
            });
        }

        // Phase 3: Continuous Layers Settings
        this.createContinuousLayersSettings(container);
    }

    /**
     * Phase 3: Create continuous layers settings
     */
    private createContinuousLayersSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });
        
        // Continuous Layers Header
        const layersHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        layersHeader.createEl('label', { 
            text: 'Continuous Audio Layers (Phase 3)', 
            cls: 'sonic-graph-setting-label sonic-graph-setting-header' 
        });
        layersHeader.createEl('div', { 
            text: 'Ambient background layers that evolve with your vault structure and activity', 
            cls: 'sonic-graph-setting-description' 
        });

        // Enable Continuous Layers Toggle
        new Setting(container)
            .setName('Enable continuous layers')
            .setDesc('Add ambient background audio that responds to vault size, activity, and animation progress')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.enabled || false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement) {
                        this.plugin.settings.audioEnhancement = this.getDefaultAudioEnhancementSettings();
                    }
                    
                    this.plugin.settings.audioEnhancement.continuousLayers.enabled = value;
                    await this.plugin.saveSettings();
                    
                    logger.info('continuous-layers', 'Continuous layers toggled', { enabled: value });
                    
                    // Refresh the settings panel to show/hide dependent controls
                    this.refreshContinuousLayerSettings();
                })
            );

        // Only show additional controls if continuous layers are enabled
        if (this.plugin.settings.audioEnhancement?.continuousLayers?.enabled) {
            this.createContinuousLayerControls(container);
        }
    }

    /**
     * Phase 3: Create continuous layer control settings
     */
    private createContinuousLayerControls(container: HTMLElement): void {
        // Musical Genre Selection
        new Setting(container)
            .setName('Musical genre')
            .setDesc('Choose the ambient genre for continuous layers')
            .addDropdown(dropdown => dropdown
                .addOption('ambient', 'Ambient - Gentle evolving textures')
                .addOption('drone', 'Drone - Sustained atmospheric tones')
                .addOption('orchestral', 'Orchestral - Classical instruments in sustained arrangements')
                .addOption('electronic', 'Electronic - Synthesized pads and evolving textures')
                .addOption('minimal', 'Minimal - Sparse, contemplative elements')
                .addOption('oceanic', 'Oceanic - Whale songs and ocean sounds')
                .addOption('sci-fi', 'Sci-Fi - Futuristic atmospheric sounds')
                .addOption('experimental', 'Experimental - Unconventional sound design')
                .addOption('industrial', 'Industrial - Mechanical drones and factory ambience')
                .addOption('urban', 'Urban - City soundscapes and human activity')
                .addOption('nature', 'Nature - Forest ambience, rain, wind')
                .addOption('mechanical', 'Mechanical - Machine hums and motor drones')
                .addOption('organic', 'Organic - Acoustic instruments with natural processing')
                .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.genre || 'ambient')
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                        return;
                    }
                    this.plugin.settings.audioEnhancement.continuousLayers.genre = value;
                    await this.plugin.saveSettings();
                    logger.info('continuous-layers', 'Genre changed', { genre: value });
                })
            );

        // Layer Intensity Slider
        new Setting(container)
            .setName('Layer intensity')
            .setDesc('Control the volume and prominence of continuous layers')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.intensity || 0.5)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                        return;
                    }
                    this.plugin.settings.audioEnhancement.continuousLayers.intensity = value;
                    await this.plugin.saveSettings();
                })
            );

        // Adaptive Intensity Toggle
        new Setting(container)
            .setName('Adaptive intensity')
            .setDesc('Layer intensity responds to vault size and activity level')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.adaptiveIntensity || true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                        return;
                    }
                    this.plugin.settings.audioEnhancement.continuousLayers.adaptiveIntensity = value;
                    await this.plugin.saveSettings();
                })
            );

        // Evolution Rate Slider
        new Setting(container)
            .setName('Evolution rate')
            .setDesc('How quickly the ambient layers change and evolve')
            .addSlider(slider => slider
                .setLimits(0.1, 1.0, 0.1)
                .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.evolutionRate || 0.3)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                        return;
                    }
                    this.plugin.settings.audioEnhancement.continuousLayers.evolutionRate = value;
                    await this.plugin.saveSettings();
                })
            );

        // Rhythmic Layer Toggle
        new Setting(container)
            .setName('Enable rhythmic layer')
            .setDesc('Add subtle percussion that responds to vault activity')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicEnabled || false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                        return;
                    }
                    this.plugin.settings.audioEnhancement.continuousLayers.rhythmicEnabled = value;
                    await this.plugin.saveSettings();
                })
            );

        // Harmonic Layer Toggle
        new Setting(container)
            .setName('Enable harmonic layer')
            .setDesc('Add evolving chord progressions based on vault structure')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicEnabled || false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                        return;
                    }
                    this.plugin.settings.audioEnhancement.continuousLayers.harmonicEnabled = value;
                    await this.plugin.saveSettings();
                })
            );

        // Musical Scale Selection (for harmonic layer)
        if (this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicEnabled) {
            new Setting(container)
                .setName('Musical scale')
                .setDesc('Scale for harmonic progressions')
                .addDropdown(dropdown => dropdown
                    .addOption('major', 'Major - Bright and uplifting')
                    .addOption('minor', 'Minor - Contemplative and introspective') 
                    .addOption('dorian', 'Dorian - Medieval and mysterious')
                    .addOption('pentatonic_major', 'Pentatonic Major - Simple and peaceful')
                    .addOption('pentatonic_minor', 'Pentatonic Minor - Eastern and meditative')
                    .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.scale || 'major')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                            return;
                        }
                        this.plugin.settings.audioEnhancement.continuousLayers.scale = value;
                        await this.plugin.saveSettings();
                    })
                );

            new Setting(container)
                .setName('Musical key')
                .setDesc('Root key for harmonic progressions')
                .addDropdown(dropdown => dropdown
                    .addOption('C', 'C')
                    .addOption('C#', 'C#')
                    .addOption('D', 'D')
                    .addOption('D#', 'D#')
                    .addOption('E', 'E')
                    .addOption('F', 'F')
                    .addOption('F#', 'F#')
                    .addOption('G', 'G')
                    .addOption('G#', 'G#')
                    .addOption('A', 'A')
                    .addOption('A#', 'A#')
                    .addOption('B', 'B')
                    .setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.key || 'C')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.audioEnhancement?.continuousLayers) {
                            return;
                        }
                        this.plugin.settings.audioEnhancement.continuousLayers.key = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        // Performance note
        const performanceNote = container.createDiv({ cls: 'sonic-graph-setting-item' });
        performanceNote.createEl('div', { 
            text: 'Continuous layers target <5% additional CPU usage and work alongside existing node-based audio', 
            cls: 'sonic-graph-setting-description sonic-graph-info' 
        });
    }

    /**
     * Phase 3: Refresh continuous layer settings when enabled/disabled
     */
    private refreshContinuousLayerSettings(): void {
        // Find the settings panel and recreate the continuous layers section
        const settingsContent = this.settingsPanel?.querySelector('.sonic-graph-settings-content');
        if (!settingsContent) {
            return;
        }

        // Find the audio section and recreate it
        const audioSection = settingsContent.querySelector('.sonic-graph-settings-section:has(.sonic-graph-settings-section-title:contains("AUDIO"))');
        if (audioSection) {
            // Clear and recreate the audio section
            audioSection.empty();
            this.createAudioSettings(audioSection as HTMLElement);
        }
    }

    /**
     * Get default audio enhancement settings
     */
    private getDefaultAudioEnhancementSettings(): any {
        return {
            contentAwareMapping: {
                enabled: false,
                fileTypePreferences: {},
                tagMappings: {},
                folderMappings: {},
                connectionTypeMappings: {},
                frontmatterPropertyName: 'instrument',
                moodPropertyName: 'musical-mood',
                distributionStrategy: 'balanced'
            },
            continuousLayers: {
                enabled: false,
                genre: 'ambient',
                intensity: 0.5,
                evolutionRate: 0.3,
                adaptiveIntensity: true,
                rhythmicEnabled: false,
                harmonicEnabled: false,
                scale: 'major',
                key: 'C'
            },
            musicalTheory: {
                scale: 'major',
                key: 'C',
                mode: 'ionian',
                constrainToScale: false
            },
            externalServices: {
                freesoundApiKey: '',
                enableFreesoundSamples: false
            }
        };
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
        
        markersSwitch.addEventListener('click', () => {
            const isActive = markersSwitch.hasClass('active');
            markersSwitch.toggleClass('active', !isActive);
            this.updateTimelineMarkersVisibility(!isActive);
        });

        // Add tooltip to timeline markers toggle
        setTooltip(markersSwitch, 'Shows or hides time markers on the timeline scrubber. Markers help you see the timeline scale and navigate to specific time periods during animation.', {
            placement: 'left'
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
        
        // Add tooltip to animation style dropdown
        setTooltip(styleSelect, 'Choose how nodes appear during timeline animation: Fade gradually appears, Scale grows from center, Slide moves in from edge, Pop appears with bounce effect. Different styles create different visual feels for your presentation.', {
            placement: 'top'
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
        
        // Add tooltip to loop animation toggle
        setTooltip(loopSwitch, 'Automatically restart the timeline animation when it reaches the end. Perfect for continuous presentations or meditative viewing of your knowledge graph evolution.', {
            placement: 'left'
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
        
        // Add tooltip to show file names toggle
        setTooltip(fileNamesSwitch, 'Shows or hides file names as text labels on each node. Useful for identifying specific files, but may create visual clutter on large graphs. Consider using with zoom for better readability.', {
            placement: 'left'
        });

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
        // Navigation settings section removed - Control Center button moved to header
        // This method kept for future navigation-related settings if needed
    }

    /**
     * Create advanced settings section with logging controls
     */
    private createAdvancedSettings(container: HTMLElement): void {
        // Create collapsible Advanced section
        const advancedSection = container.createEl('details', { cls: 'sonic-graph-advanced-settings' });
        const summary = advancedSection.createEl('summary', { 
            text: 'ADVANCED', 
            cls: 'sonic-graph-settings-section-title sonic-graph-advanced-summary' 
        });
        
        // Create the content container
        const section = advancedSection.createDiv({ cls: 'sonic-graph-settings-section' });

        // Logging Level Setting
        const loggingItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        loggingItem.createEl('label', { text: 'Logging level', cls: 'sonic-graph-setting-label' });
        loggingItem.createEl('div', { 
            text: 'Control the verbosity of plugin logs. Default is "Warnings".', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const loggingSelect = loggingItem.createEl('select', { cls: 'sonic-graph-setting-select' });
        const logLevels = [
            { value: 'off', text: 'Off' },
            { value: 'error', text: 'Errors Only' },
            { value: 'warn', text: 'Warnings' },
            { value: 'info', text: 'Info' },
            { value: 'debug', text: 'Debug' }
        ];
        
        const currentLevel = LoggerFactory.getLogLevel();
        logLevels.forEach(level => {
            const option = loggingSelect.createEl('option', { 
                text: level.text, 
                value: level.value 
            });
            if (level.value === currentLevel) {
                option.selected = true;
            }
        });
        
        loggingSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const value = target.value as 'off' | 'error' | 'warn' | 'info' | 'debug';
            LoggerFactory.setLogLevel(value);
            logger.info('settings-change', 'Log level changed', { level: value });
        });

        // Export Logs Button
        const exportItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        exportItem.createEl('label', { text: 'Export logs', cls: 'sonic-graph-setting-label' });
        exportItem.createEl('div', { 
            text: 'Download all plugin logs as a JSON file for support or debugging.', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const exportButton = exportItem.createEl('button', { 
            text: 'Export Logs',
            cls: 'sonic-graph-export-logs-btn' 
        });
        
        exportButton.addEventListener('click', async () => {
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const filename = `osp-logs-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
            const logs = this.plugin.getLogs ? this.plugin.getLogs() : [];
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            logger.info('export', 'Logs exported', { filename });
        });
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
        
        // Add tooltip to layout density slider
        setTooltip(densitySlider, 'Adjusts the overall spacing and compactness of the graph layout. Loose creates more space between nodes, while Very Tight creates a more compact visualization. Choose based on your graph size and visual preference.', {
            placement: 'top'
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
        
        // Add tooltip to clustering strength slider
        setTooltip(clusteringSlider, 'Controls the attractive force between connected files in the graph. Higher values pull linked files closer together, creating tighter clusters. Lower values allow more spread-out, organic layouts.', {
            placement: 'top'
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
        
        // Add tooltip to group separation slider
        setTooltip(separationSlider, 'Controls the spacing between distinct groups of files in the graph. Higher values push different clusters further apart, creating clearer visual separation. Lower values allow groups to overlap more naturally.', {
            placement: 'top'
        });
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
        tagsSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        tagsSwitch.addEventListener('click', () => {
            const isActive = tagsSwitch.hasClass('active');
            tagsSwitch.toggleClass('active', !isActive);
            this.updateFilterSetting('showTags', !isActive);
        });

        // Add tooltip to show tags toggle
        setTooltip(tagsSwitch, 'Include nodes representing tags in the graph visualization. Tags appear as nodes that connect to all files containing those tags, helping visualize topical relationships.', {
            placement: 'left'
        });
        
        // Show Orphans Toggle
        const orphansItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        orphansItem.createEl('label', { text: 'Show orphans', cls: 'sonic-graph-setting-label' });
        
        const orphansToggle = orphansItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const orphansSwitch = orphansToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        
        // Add tooltip to show orphans toggle
        setTooltip(orphansSwitch, 'Include isolated nodes with no connections to other files. Orphan nodes can represent standalone notes, unused media files, or content that hasn\'t been linked yet.', {
            placement: 'left'
        });
        if (this.getSonicGraphSettings().layout.filters.showOrphans) {
            orphansSwitch.addClass('active');
        }
        orphansSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
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
            this.graphRenderer.updateContentAwareSettings(currentSettings.contentAwarePositioning);
            this.graphRenderer.updateSmartClusteringSettings(currentSettings.smartClustering);
        }
        
        logger.debug('filter-setting', `Updated filter setting: ${String(key)} = ${value}`);
    }

    /**
     * Create groups settings section
     */
    private createGroupsSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section' });
        section.createEl('div', { text: 'GROUPS', cls: 'sonic-graph-settings-section-title' });
        
        this.createPathGroupsSettings(section);
    }

    /**
     * Create path groups settings interface - New design
     */
    private createPathGroupsSettings(container: HTMLElement): void {
        
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
        
        // Add tooltip to groups search input
        setTooltip(searchInput, 'Create custom groups by entering folder paths, file patterns, or search queries. Groups visually cluster related nodes together using colored boundaries. Examples: "Projects/", "*.md", "#tag"', {
            placement: 'top'
        });
        
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
        colorInput.className = 'sonic-graph-hidden-color-picker';
        
        // Position the input right beneath the color dot
        const dotRect = colorDot.getBoundingClientRect();
        const modalRect = this.contentEl.getBoundingClientRect();
        
        colorInput.style.position = 'absolute';
        colorInput.style.left = `${dotRect.left - modalRect.left}px`;
        colorInput.style.top = `${dotRect.bottom - modalRect.top + 4}px`; // 4px gap below the dot
        // Enable pointer events for interaction while keeping it visually hidden
        colorInput.style.pointerEvents = 'auto';
        
        // Find the modal container to append to
        const modalContainer = this.contentEl;
        modalContainer.appendChild(colorInput);
        
        // Use requestAnimationFrame to ensure positioning is applied before clicking
        requestAnimationFrame(() => {
            colorInput.click();
        });
        
        colorInput.addEventListener('input', () => {
            const newColor = colorInput.value;
            this.updateGroupProperty(groupIndex, 'color', newColor);
            colorDot.style.backgroundColor = newColor;
        });
        
        // Remove color picker when clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            // Don't dismiss if clicking on the color input itself or the color dot
            if (e.target === colorInput || e.target === colorDot) {
                return;
            }
            
            // Remove the color picker
            if (modalContainer.contains(colorInput)) {
                modalContainer.removeChild(colorInput);
            }
            
            // Remove the event listener
            document.removeEventListener('click', handleClickOutside);
        };
        
        colorInput.addEventListener('change', () => {
            if (modalContainer.contains(colorInput)) {
                modalContainer.removeChild(colorInput);
            }
            // Also remove the click outside handler when change event fires
            document.removeEventListener('click', handleClickOutside);
        });
        
        // Prevent the color picker from being dismissed by other click handlers
        colorInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Add the click outside handler after a brief delay to avoid immediate dismissal
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
        
        // Fallback cleanup in case click outside handler fails
        setTimeout(() => {
            if (modalContainer.contains(colorInput)) {
                modalContainer.removeChild(colorInput);
                document.removeEventListener('click', handleClickOutside);
            }
        }, 120000); // 2 minute fallback
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
        
        // Parse the query to determine name and path
        let name = query;
        let path = query;
        
        if (query.includes(':')) {
            const parts = query.split(':', 2);
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
            this.graphRenderer.updateContentAwareSettings(currentSettings.contentAwarePositioning);
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
            this.graphRenderer.updateContentAwareSettings(currentSettings.contentAwarePositioning);
            this.graphRenderer.updateSmartClusteringSettings(currentSettings.smartClustering);
        }
        
        logger.debug('path-grouping', `Updated group ${groupIndex} ${property}:`, value);
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
            this.graphRenderer.updateContentAwareSettings(currentSettings.contentAwarePositioning);
            this.graphRenderer.updateSmartClusteringSettings(currentSettings.smartClustering);
        }
        
        logger.debug('path-grouping', `Removed group at index ${groupIndex}`);
    }

    /**
     * Refresh the path groups settings UI
     */
    private refreshPathGroupsSettings(): void {
        const groupsContainer = document.querySelector('.sonic-graph-groups-list') as HTMLElement;
        if (groupsContainer) {
            groupsContainer.empty();
            this.createPathGroupsSettings(groupsContainer.parentElement as HTMLElement);
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
        
        errorContainer.createEl('h3', { 
            text: 'Failed to load graph data',
            cls: 'sonic-graph-error-title'
        });
        
        if (errorMessage) {
            errorContainer.createEl('p', { 
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
            
            // Set logging context for comprehensive timelapse analytics
            this.setAnimatorLoggingContext();
            
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
            
            // Initialize musical mapper for audio with app instance for Phase 2
            this.musicalMapper = new MusicalMapper(this.plugin.settings, this.plugin.app);
            
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
        
        // Increment the node appearance counter
        this.nodeAppearanceCounter++;
        
        // Audio density with even spacing (0-100)
        const density = settings.audio.density;
        
        // Calculate interval between audio events based on density
        // At 100% density, every node plays (interval = 1)
        // At 50% density, every 2nd node plays (interval = 2)
        // At 25% density, every 4th node plays (interval = 4)
        // At 10% density, every 10th node plays (interval = 10)
        const interval = Math.max(1, Math.round(100 / density));
        
        // Calculate nodes since last audio
        const nodesSinceLastAudio = this.nodeAppearanceCounter - this.lastAudioNodeIndex - 1;
        
        // Determine if this node should play audio
        const shouldPlay = nodesSinceLastAudio >= interval || this.lastAudioNodeIndex === -1;
        
        logger.debug('audio-density', 'Audio density filtering (even spacing)', {
            nodeId: node.id,
            densitySetting: density,
            interval,
            nodeAppearanceCounter: this.nodeAppearanceCounter,
            lastAudioNodeIndex: this.lastAudioNodeIndex,
            nodesSinceLastAudio,
            shouldPlay
        });
        
        if (!shouldPlay) {
            // Skip this note to maintain even spacing
            logger.debug('audio-density', 'Note skipped due to audio density', {
                nodeId: node.id,
                nodesSinceLastAudio,
                requiredInterval: interval
            });
            return null;
        }
        
        // Update last audio node index
        this.lastAudioNodeIndex = this.nodeAppearanceCounter;

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
        const instruments = this.plugin.settings.instruments;
        const instrumentConfig = instruments[selectedInstrument as keyof typeof instruments];
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
                showMarkers: true,
                timeWindow: 'all-time' as const,
                granularity: 'year' as const,
                customRange: {
                    value: 1,
                    unit: 'years' as const
                },
                eventSpreadingMode: 'gentle' as const,
                maxEventSpacing: 5.0,
                simultaneousEventLimit: 3,
                eventBatchSize: 5
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
            // Adaptive Detail Levels - Default Settings
            adaptiveDetail: {
                enabled: false,                  // Disabled by default for backward compatibility
                mode: 'automatic' as const,     // Automatic mode when enabled
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
            },
            // Content-Aware Positioning - Default Settings
            contentAwarePositioning: {
                enabled: false,
                tagInfluence: {
                    strength: 'moderate' as const,
                    weight: 0.3
                },
                temporalPositioning: {
                    enabled: true,
                    weight: 0.1,
                    recentThresholdDays: 30
                },
                hubCentrality: {
                    enabled: true,
                    weight: 0.2,
                    minimumConnections: 5
                },
                debugVisualization: false
            },
            // Smart Clustering - Default Settings
            smartClustering: {
                enabled: false,
                algorithm: 'hybrid' as const,
                weights: {
                    linkStrength: 0.4,
                    sharedTags: 0.3,
                    folderHierarchy: 0.2,
                    temporalProximity: 0.1
                },
                clustering: {
                    minClusterSize: 3,
                    maxClusters: 12,
                    resolution: 1.0
                },
                visualization: {
                    enableVisualization: true,
                    showClusterLabels: true,
                    clusterBoundaries: 'subtle' as const,
                    colorScheme: 'type-based' as const
                },
                integration: {
                    respectExistingGroups: true,
                    hybridMode: true,
                    overrideThreshold: 0.7
                },
                debugging: {
                    debugMode: false,
                    showStatistics: false,
                    logClusteringDetails: false
                }
            }
        };
        
        if (!settings) {
            // Return default settings if not configured
            return defaultSettings;
        }
        
        // Merge with defaults to ensure all properties exist (especially new adaptive detail and layout settings)
        return {
            timeline: { ...defaultSettings.timeline, ...settings.timeline },
            audio: { ...defaultSettings.audio, ...settings.audio },
            visual: { ...defaultSettings.visual, ...settings.visual },
            navigation: { ...defaultSettings.navigation, ...settings.navigation },
            adaptiveDetail: { ...defaultSettings.adaptiveDetail, ...settings.adaptiveDetail },
            layout: { ...defaultSettings.layout, ...settings.layout },
            contentAwarePositioning: { ...defaultSettings.contentAwarePositioning, ...settings.contentAwarePositioning },
            smartClustering: { ...defaultSettings.smartClustering, ...settings.smartClustering }
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
     * Update animation duration setting and save to plugin settings
     */
    private updateAnimationDuration(duration: number): void {
        // Save to plugin settings
        this.plugin.settings.sonicGraphAnimationDuration = duration;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated animation duration', { duration });
        
        // The animator will pick up the new duration from settings when it runs
    }

    /**
     * Update time window setting
     */
    private updateTimeWindow(timeWindow: 'all-time' | 'past-year' | 'past-month' | 'past-week' | 'past-day' | 'past-hour'): void {
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.timeline.timeWindow = timeWindow;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated time window', { timeWindow });
        
        // Update temporal animator with new time window
        if (this.temporalAnimator) {
            this.applyTimeWindowChange(timeWindow);
        }
    }

    /**
     * Update timeline granularity setting
     */
    private updateTimelineGranularity(granularity: 'year' | 'month' | 'week' | 'day' | 'hour' | 'custom'): void {
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.timeline.granularity = granularity;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated timeline granularity', { granularity });
        
        // Show/hide custom range controls based on selection
        const customRangeElement = this.settingsPanel?.querySelector('.sonic-graph-custom-range') as HTMLElement;
        if (customRangeElement) {
            customRangeElement.style.display = granularity === 'custom' ? '' : 'none';
        }
        
        // Update temporal animator if available
        if (this.temporalAnimator) {
            this.applyTimelineGranularityChange(granularity);
        }
    }

    /**
     * Update custom range setting
     */
    private updateCustomRange(value: number, unit: 'years' | 'months' | 'weeks' | 'days' | 'hours'): void {
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.timeline.customRange = { value, unit };
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated custom range', { value, unit });
        
        // Update temporal animator if using custom granularity
        if (this.temporalAnimator && this.plugin.settings.sonicGraphSettings.timeline.granularity === 'custom') {
            this.applyTimelineGranularityChange('custom');
        }
    }

    /**
     * Update event spreading mode setting
     */
    private updateEventSpreadingMode(mode: 'none' | 'gentle' | 'aggressive'): void {
        if (!this.plugin.settings.sonicGraphSettings) {
            this.plugin.settings.sonicGraphSettings = this.getSonicGraphSettings();
        }
        
        this.plugin.settings.sonicGraphSettings.timeline.eventSpreadingMode = mode;
        this.plugin.saveSettings();
        
        logger.debug('settings', 'Updated event spreading mode', { mode });
        
        // Update temporal animator with new spreading mode
        if (this.temporalAnimator) {
            this.applyEventSpreadingChange(mode);
        }
    }

    /**
     * Apply time window changes to temporal animator
     */
    private applyTimeWindowChange(timeWindow: 'all-time' | 'past-year' | 'past-month' | 'past-week' | 'past-day' | 'past-hour'): void {
        if (!this.temporalAnimator) {
            logger.debug('timeline', 'No temporal animator available for time window change', { timeWindow });
            return;
        }

        const settings = this.getSonicGraphSettings();
        this.temporalAnimator.updateTimelineSettings(settings.timeline);
        
        // Update logging context with new settings
        this.setAnimatorLoggingContext();

        // Log the setting change during playback
        if (this.isAnimating) {
            logger.info('timelapse-interaction', 'Settings modified during playback', {
                setting: 'timeWindow',
                from: 'previous',
                to: timeWindow,
                reason: 'User adjusted time window filter'
            });
        }
    }

    /**
     * Apply timeline granularity changes to temporal animator
     */
    private applyTimelineGranularityChange(granularity: 'year' | 'month' | 'week' | 'day' | 'hour' | 'custom'): void {
        if (!this.temporalAnimator) {
            logger.debug('timeline', 'No temporal animator available for granularity change', { granularity });
            return;
        }

        const settings = this.getSonicGraphSettings();
        this.temporalAnimator.updateTimelineSettings(settings.timeline);

        logger.info('timeline', 'Timeline granularity change applied to temporal animator', { 
            granularity,
            customRange: settings.timeline.customRange,
            eventSpreadingMode: settings.timeline.eventSpreadingMode
        });
    }

    /**
     * Apply event spreading changes to temporal animator
     */
    private applyEventSpreadingChange(mode: 'none' | 'gentle' | 'aggressive'): void {
        if (!this.temporalAnimator) {
            logger.debug('timeline', 'No temporal animator available for event spreading change', { mode });
            return;
        }

        const previousMode = this.getSonicGraphSettings().timeline.eventSpreadingMode;
        const settings = this.getSonicGraphSettings();
        this.temporalAnimator.updateTimelineSettings(settings.timeline);
        
        // Update logging context with new settings
        this.setAnimatorLoggingContext();

        // Log the setting change during playback
        if (this.isAnimating) {
            logger.info('timelapse-interaction', 'Settings modified during playback', {
                setting: 'eventSpreadingMode',
                from: previousMode,
                to: mode,
                reason: 'User adjusted for better audio clarity'
            });
        }
    }

    /**
     * Gather and set comprehensive logging context for the temporal animator
     */
    private setAnimatorLoggingContext(): void {
        if (!this.temporalAnimator) return;

        const sonicGraphSettings = this.getSonicGraphSettings();
        
        // Gather audio settings from Control Center (via plugin settings)
        const audioSettings = {
            density: sonicGraphSettings.audio.density,
            effectsEnabled: sonicGraphSettings.audio.enableEffects,
            masterVolume: this.plugin.settings.volume || 0.3,
            activeInstruments: this.getActiveInstruments()
        };

        // Gather visual and performance settings
        const visualSettings = {
            adaptiveDetail: sonicGraphSettings.adaptiveDetail,
            temporalClustering: sonicGraphSettings.layout.temporalClustering,
            showLabels: sonicGraphSettings.visual.showLabels,
            animationStyle: sonicGraphSettings.visual.animationStyle
        };

        // Set the logging context
        this.temporalAnimator.setLoggingContext({
            pluginSettings: {
                animationDuration: this.plugin.settings.sonicGraphAnimationDuration,
                excludeFolders: this.plugin.settings.sonicGraphExcludeFolders,
                excludeFiles: this.plugin.settings.sonicGraphExcludeFiles
            },
            audioSettings,
            visualSettings
        });
    }

    /**
     * Get list of active instruments from plugin settings
     */
    private getActiveInstruments(): string[] {
        try {
            // Get enabled instruments from plugin settings
            const instruments = this.plugin.settings.instruments;
            if (instruments) {
                return Object.entries(instruments)
                    .filter(([_, config]: [string, any]) => config.enabled)
                    .map(([name, _]) => name);
            }
        } catch (error) {
            logger.debug('ui', 'Could not get active instruments', error);
        }
        return ['unknown'];
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

    // Responsive sizing: Set up resize observer for dynamic graph sizing
    private setupResizeObserver(canvasElement: HTMLElement): void {
        if (!this.graphRenderer) return;
        
        // Clean up existing observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // Create new resize observer
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newWidth = entry.contentRect.width;
                const newHeight = entry.contentRect.height;
                
                // Only resize if dimensions actually changed and are valid
                if (newWidth > 0 && newHeight > 0 && this.graphRenderer) {
                    logger.debug('responsive-resize', 'Container resized, updating graph', {
                        newWidth,
                        newHeight,
                        previousWidth: this.graphRenderer.getZoomTransform().k,
                        previousHeight: this.graphRenderer.getZoomTransform().k
                    });
                    
                    this.graphRenderer.resize(newWidth, newHeight);
                }
            }
        });
        
        // Start observing the canvas container
        this.resizeObserver.observe(canvasElement);
        
        logger.debug('responsive-setup', 'Resize observer set up for responsive graph sizing');
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
            this.graphRenderer.updateContentAwareSettings(currentSettings.contentAwarePositioning);
            this.graphRenderer.updateSmartClusteringSettings(currentSettings.smartClustering);
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

    /**
     * Update tag influence weight and save to plugin settings
     */
    private updateTagInfluenceWeight(weight: number): void {
        // Performance optimization: Use debounced settings updates
        this.scheduleSettingsUpdate('contentAwarePositioning.tagInfluence.weight', weight);
        
        logger.debug('content-aware-positioning', 'Tag influence weight updated', { weight });
    }

    /**
     * Update temporal positioning weight and save to plugin settings
     */
    private updateTemporalPositioningWeight(weight: number): void {
        // Performance optimization: Use debounced settings updates
        this.scheduleSettingsUpdate('contentAwarePositioning.temporalPositioning.weight', weight);
        
        logger.debug('content-aware-positioning', 'Temporal positioning weight updated', { weight });
    }

    /**
     * Update hub centrality weight and save to plugin settings
     */
    private updateHubCentralityWeight(weight: number): void {
        // Performance optimization: Use debounced settings updates
        this.scheduleSettingsUpdate('contentAwarePositioning.hubCentrality.weight', weight);
        
        logger.debug('content-aware-positioning', 'Hub centrality weight updated', { weight });
    }

    /**
     * Update debug visualization setting and save to plugin settings
     */
    private updateDebugVisualization(enabled: boolean): void {
        // Performance optimization: Use debounced settings updates
        this.scheduleSettingsUpdate('contentAwarePositioning.debugVisualization', enabled);
        
        logger.debug('content-aware-positioning', 'Debug visualization updated', { enabled });
    }

    /**
     * Apply content-aware weight changes immediately for real-time preview
     */
    private applyContentAwareWeightPreview(weightType: 'tagInfluence' | 'temporalPositioning' | 'hubCentrality', weight: number): void {
        if (!this.graphRenderer) {
            return;
        }

        // Get current settings and apply the preview change
        const currentSettings = this.getSonicGraphSettings().contentAwarePositioning;
        const previewSettings = JSON.parse(JSON.stringify(currentSettings)); // Deep clone
        
        // Update the specific weight
        if (weightType === 'tagInfluence') {
            previewSettings.tagInfluence.weight = weight;
        } else if (weightType === 'temporalPositioning') {
            previewSettings.temporalPositioning.weight = weight;
        } else if (weightType === 'hubCentrality') {
            previewSettings.hubCentrality.weight = weight;
        }
        
        // Apply the preview settings immediately to the renderer
        this.graphRenderer.updateContentAwareSettings(previewSettings);
        
        logger.debug('content-aware-preview', 'Real-time weight preview applied', {
            weightType,
            weight,
            immediate: true
        });
    }

    /**
     * Apply debug visualization changes immediately for real-time preview
     */
    private applyContentAwareDebugPreview(enabled: boolean): void {
        if (!this.graphRenderer) {
            return;
        }

        // Get current settings and apply the preview change
        const currentSettings = this.getSonicGraphSettings().contentAwarePositioning;
        const previewSettings = JSON.parse(JSON.stringify(currentSettings)); // Deep clone
        previewSettings.debugVisualization = enabled;
        
        // Apply the preview settings immediately to the renderer
        this.graphRenderer.updateContentAwareSettings(previewSettings);
        
        logger.debug('content-aware-preview', 'Real-time debug visualization preview applied', {
            enabled,
            immediate: true
        });
    }

    /**
     * Update clustering algorithm and save to plugin settings
     */
    private updateClusteringAlgorithm(algorithm: 'louvain' | 'modularity' | 'hybrid'): void {
        this.scheduleSettingsUpdate('smartClustering.algorithm', algorithm);
        logger.debug('smart-clustering', 'Clustering algorithm updated', { algorithm });
    }

    /**
     * Update clustering weight and save to plugin settings
     */
    private updateClusteringWeight(weightType: 'linkStrength' | 'sharedTags' | 'folderHierarchy' | 'temporalProximity', weight: number): void {
        this.scheduleSettingsUpdate(`smartClustering.weights.${weightType}`, weight);
        logger.debug('smart-clustering', 'Clustering weight updated', { weightType, weight });
    }

    /**
     * Update clustering parameter and save to plugin settings
     */
    private updateClusteringParameter(paramType: 'minClusterSize' | 'maxClusters' | 'resolution', value: number): void {
        this.scheduleSettingsUpdate(`smartClustering.clustering.${paramType}`, value);
        logger.debug('smart-clustering', 'Clustering parameter updated', { paramType, value });
    }

    /**
     * Update clustering visualization setting and save to plugin settings
     */
    private updateClusteringVisualization(vizType: 'showClusterLabels' | 'clusterBoundaries' | 'colorScheme', value: any): void {
        this.scheduleSettingsUpdate(`smartClustering.visualization.${vizType}`, value);
        logger.debug('smart-clustering', 'Clustering visualization updated', { vizType, value });
    }

    /**
     * Update clustering debugging setting and save to plugin settings
     */
    private updateClusteringDebugging(debugType: 'showStatistics' | 'logClusteringDetails', value: boolean): void {
        this.scheduleSettingsUpdate(`smartClustering.debugging.${debugType}`, value);
        logger.debug('smart-clustering', 'Clustering debugging updated', { debugType, value });
    }
} 