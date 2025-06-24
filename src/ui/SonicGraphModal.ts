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
    private spacingSelect: HTMLSelectElement;
    private detectedSpacing: 'dense' | 'balanced' | 'sparse' = 'balanced';

    constructor(app: App, plugin: SonigraphPlugin) {
        super(app);
        this.plugin = plugin;
        this.graphDataExtractor = new GraphDataExtractor(app.vault, app.metadataCache, {
            excludeFolders: plugin.settings.sonicGraphExcludeFolders || [],
            excludeFiles: plugin.settings.sonicGraphExcludeFiles || []
        });
        
        // Load settings
        // (removed showFileNames setting)
    }

    onOpen() {
        try {
            const { contentEl } = this;
            contentEl.empty();
            
            logger.debug('ui', 'Opening Sonic Graph modal');
            
            // Add modal-specific classes
            this.modalEl.addClass('sonic-graph-modal');
            
            // Create close button (positioned outside main container like Control Center)
            const closeButton = contentEl.createDiv({ cls: 'modal-close-button' });
            closeButton.addEventListener('click', () => this.close());
            
            // Create main modal container
            const modalContainer = contentEl.createDiv({ cls: 'sonic-graph-modal-container' });
            
            // Create modal structure inside container
            this.createHeader(modalContainer);
            this.createGraphArea(modalContainer);
            this.createTimelineArea(modalContainer);
            this.createControlsArea(modalContainer);
            
            // Initialize graph
            this.initializeGraph();
            
        } catch (error) {
            logger.error('Error opening Sonic Graph modal', (error as Error).message);
            new Notice('Failed to open Sonic Graph modal');
        }
    }

    onClose() {
        logger.debug('ui', 'Closing Sonic Graph modal');
        
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
     * Create main graph visualization area
     */
    private createGraphArea(container: HTMLElement): void {
        this.graphContainer = container.createDiv({ cls: 'sonic-graph-container' });
        
        // Graph canvas
        const graphCanvas = this.graphContainer.createDiv({ cls: 'sonic-graph-canvas' });
        graphCanvas.id = 'sonic-graph-canvas';
        
        // Loading indicator
        const loadingIndicator = this.graphContainer.createDiv({ cls: 'sonic-graph-loading' });
        const loadingIcon = createLucideIcon('loader-2', 24);
        loadingIcon.addClass('sonic-graph-loading-icon');
        loadingIndicator.appendChild(loadingIcon);
        loadingIndicator.createSpan({ text: 'Loading graph...', cls: 'sonic-graph-loading-text' });
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
        this.timelineScrubber.addEventListener('input', () => this.handleTimelineScrub());
        
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
        this.speedSelect.addEventListener('change', () => this.handleSpeedChange());
        
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
        this.viewModeBtn.addEventListener('click', () => this.toggleViewMode());
        
        
        // Reset view button
        const resetViewBtn = viewControls.createEl('button', { 
            cls: 'sonic-graph-control-btn' 
        });
        const resetIcon = createLucideIcon('maximize-2', 16);
        resetViewBtn.appendChild(resetIcon);
        resetViewBtn.appendText('Reset View');
        resetViewBtn.addEventListener('click', () => this.resetGraphView());
        
        // Control Center button
        const controlCenterBtn = viewControls.createEl('button', { 
            cls: 'sonic-graph-control-btn sonic-graph-control-btn--secondary' 
        });
        const controlCenterIcon = createLucideIcon('settings', 16);
        controlCenterBtn.appendChild(controlCenterIcon);
        controlCenterBtn.appendText('Control Center');
        controlCenterBtn.addEventListener('click', () => this.openControlCenter());
        
        // Settings button
        const settingsBtn = viewControls.createEl('button', { 
            cls: 'sonic-graph-control-btn sonic-graph-control-btn--secondary' 
        });
        const settingsIcon = createLucideIcon('sliders', 16);
        settingsBtn.appendChild(settingsIcon);
        settingsBtn.appendText('Settings');
        settingsBtn.addEventListener('click', () => this.toggleSettings());
    }

    /**
     * Initialize the graph visualization
     */
    private async initializeGraph(): Promise<void> {
        try {
            logger.debug('ui', 'Initializing Sonic Graph');
            
            // Extract graph data
            const graphData = await this.graphDataExtractor.extractGraphData();
            logger.debug('ui', `Extracted ${graphData.nodes.length} nodes and ${graphData.links.length} links`);
            
            // Create graph renderer
            const canvasElement = document.getElementById('sonic-graph-canvas');
            if (!canvasElement) {
                throw new Error('Graph canvas element not found');
            }
            
            this.graphRenderer = new GraphRenderer(canvasElement, {
                enableZoom: true,
                showLabels: false
            });
            
            // Render the graph
            this.graphRenderer.render(graphData.nodes, graphData.links);
            
            // Hide loading indicator
            const loadingIndicator = this.graphContainer.querySelector('.sonic-graph-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            // Update stats
            this.updateStats();
            
            // Initialize view mode (starts in Static View)
            this.updateViewMode();
            
            logger.debug('ui', 'Sonic Graph initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize Sonic Graph', (error as Error).message);
            new Notice('Failed to load graph data');
            
            // Show error state
            this.showErrorState();
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
                    // Check if enabled instruments match what's loaded in audio engine
                    const enabledInstruments = this.getEnabledInstruments();
                    const audioEngineInstruments = Array.from(this.plugin.audioEngine['instruments']?.keys() || []);
                    
                    const missingInstruments = enabledInstruments.filter(inst => !audioEngineInstruments.includes(inst));
                    const extraInstruments = audioEngineInstruments.filter(inst => !enabledInstruments.includes(inst));
                    
                    if (missingInstruments.length > 0 || extraInstruments.length > 0) {
                        logger.info('audio', 'Instrument configuration changed - reinitializing audio engine', {
                            enabledInstruments,
                            audioEngineInstruments,
                            missingInstruments,
                            extraInstruments
                        });
                        
                        // Force reinitialization to load new instrument configuration
                        await this.plugin.audioEngine.initialize();
                        new Notice('Audio engine updated with new instruments');
                    } else {
                        logger.info('audio', 'Audio engine already initialized with correct instruments', {
                            audioContext: status.audioContext,
                            volume: status.volume,
                            instruments: audioEngineInstruments
                        });
                    }
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
            // Static View - show all nodes, hide animation controls
            this.viewModeBtn.innerHTML = '';
            const staticIcon = createLucideIcon('eye', 16);
            this.viewModeBtn.appendChild(staticIcon);
            this.viewModeBtn.appendText('Static View');
            
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
            // Reset zoom to initial view
            this.graphRenderer.setZoomTransform(d3.zoomIdentity.scale(0.6));
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
     * Toggle settings panel (placeholder)
     */
    private toggleSettings(): void {
        // TODO: Implement settings panel
        new Notice('Settings panel coming soon');
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

        // Add temporal spacing control
        this.createTemporalSpacingControl();
    }

    /**
     * Create temporal spacing control with auto-detection
     */
    private async createTemporalSpacingControl(): Promise<void> {
        if (!this.statsContainer) return;

        try {
            // Get graph data for detection
            const graphData = await this.graphDataExtractor.extractGraphData();
            const detection = this.detectTemporalClustering(graphData.nodes);
            this.detectedSpacing = detection.type;

            // Create spacing container (inline)
            const spacingContainer = this.statsContainer.createDiv({ 
                cls: 'sonic-graph-spacing-container' 
            });

            // Label
            spacingContainer.createEl('label', { 
                text: 'Timeline:', 
                cls: 'sonic-graph-spacing-label' 
            });

            // Dropdown
            this.spacingSelect = spacingContainer.createEl('select', { 
                cls: 'sonic-graph-spacing-select' 
            });

            // Shortened options
            const options = [
                { value: 'auto', label: `Auto (${detection.type})` },
                { value: 'dense', label: 'Dense' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'sparse', label: 'Sparse' }
            ];

            options.forEach(option => {
                const optionEl = this.spacingSelect.createEl('option', { 
                    value: option.value,
                    text: option.label
                });
                if (option.value === 'auto') {
                    optionEl.selected = true;
                }
            });

            // Event listener
            this.spacingSelect.addEventListener('change', () => {
                logger.debug('temporal-spacing', 'User changed spacing setting', {
                    value: this.spacingSelect.value,
                    detectedSpacing: this.detectedSpacing
                });
            });

            logger.debug('temporal-spacing', 'Created spacing control', {
                detectedType: detection.type,
                confidence: detection.confidence,
                reason: detection.reason
            });

        } catch (error) {
            logger.warn('temporal-spacing', 'Failed to create spacing control', (error as Error).message);
        }
    }

    /**
     * Get spacing configuration based on user selection
     */
    private getSpacingConfiguration(): { enableIntelligentSpacing: boolean, simultaneousThreshold: number, maxSpacingWindow: number, minEventSpacing: number } {
        const selectedValue = this.spacingSelect?.value || 'auto';
        const actualSpacing = selectedValue === 'auto' ? this.detectedSpacing : selectedValue;

        logger.debug('temporal-spacing', 'Getting spacing configuration', {
            selectedValue,
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
     * Show error state
     */
    private showErrorState(): void {
        const errorContainer = this.graphContainer.createDiv({ cls: 'sonic-graph-error' });
        const errorIcon = createLucideIcon('alert-circle', 48);
        errorContainer.appendChild(errorIcon);
        errorContainer.createEl('p', { 
            text: 'Failed to load graph data',
            cls: 'sonic-graph-error-text'
        });
        
        const retryBtn = errorContainer.createEl('button', { 
            text: 'Retry',
            cls: 'sonic-graph-error-retry'
        });
        retryBtn.addEventListener('click', () => {
            errorContainer.remove();
            this.initializeGraph();
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
        logger.info('audio', 'handleNodeAppearance called', { 
            nodeId: node.id, 
            nodeTitle: node.title,
            hasAudioEngine: !!this.plugin.audioEngine 
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
            
            logger.debug('audio', 'About to play note for node appearance', { 
                nodeId: node.id, 
                nodeTitle: node.title,
                pitch: mapping.pitch,
                instrument: mapping.instrument,
                audioEngineStatus: this.plugin.audioEngine.getStatus()
            });
            
            // Play the note using the selected instrument through the sequence method
            try {
                await this.plugin.audioEngine.playSequence([mapping]);
                logger.debug('audio', 'Instrument note played successfully', { instrument: mapping.instrument });
            } catch (playError) {
                logger.warn('Instrument playback failed', (playError as Error).message);
                
                // Fallback: try basic test note
                try {
                    await this.plugin.audioEngine.playTestNote(mapping.pitch);
                    logger.debug('audio', 'Fallback test note played');
                } catch (testError) {
                    logger.error('Both instrument and test note playback failed', (testError as Error).message);
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
        // Get enabled instruments from user's settings
        const enabledInstruments = this.getEnabledInstruments();
        
        if (enabledInstruments.length === 0) {
            logger.warn('audio', 'No instruments enabled for temporal animation');
            // Fallback to piano if nothing is enabled
            return this.createFallbackMapping(node, 'piano');
        }
        
        // Map file type to instrument categories, then select from user's enabled instruments
        const selectedInstrument = this.selectInstrumentForFileType(node.type, enabledInstruments);
        
        // Calculate pitch based on node properties
        const baseFreq = 261.63; // C4
        const fileNameHash = this.hashString(node.title);
        const pitchOffset = (fileNameHash % 24) - 12; // ±12 semitones
        const pitch = baseFreq * Math.pow(2, pitchOffset / 12);
        
        // Duration based on file size (logarithmic scale)
        const baseDuration = 0.3;
        const sizeFactor = Math.log10(Math.max(node.fileSize, 1)) / 10;
        const duration = Math.min(baseDuration + sizeFactor, 1.0);
        
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
        
        logger.debug('audio', 'Found enabled instruments', { 
            count: enabled.length, 
            instruments: enabled 
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
} 