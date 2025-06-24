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
    private showFileNames: boolean = false;
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

    constructor(app: App, plugin: SonigraphPlugin) {
        super(app);
        this.plugin = plugin;
        this.graphDataExtractor = new GraphDataExtractor(app.vault, app.metadataCache, {
            excludeFolders: plugin.settings.sonicGraphExcludeFolders || [],
            excludeFiles: plugin.settings.sonicGraphExcludeFiles || []
        });
        
        // Load settings
        this.showFileNames = this.plugin.settings.sonicGraphShowFileNames || false;
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
        this.timelineContainer.style.display = 'none'; // Hidden until animation starts
        
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
        
        // Enhanced timeline info with dual tracks
        this.timelineInfo = this.timelineContainer.createDiv({ cls: 'sonic-graph-timeline-info' });
        
        // Years track
        const yearsTrack = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-track sonic-graph-timeline-years' });
        yearsTrack.createEl('div', { text: 'Years:', cls: 'sonic-graph-timeline-track-label' });
        const yearsLine = yearsTrack.createDiv({ cls: 'sonic-graph-timeline-line' });
        
        // Years markers container
        const yearsMarkers = yearsLine.createDiv({ cls: 'sonic-graph-timeline-markers sonic-graph-timeline-years-markers' });
        // Markers will be populated dynamically
        
        // Time track  
        const timeTrack = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-track sonic-graph-timeline-time' });
        timeTrack.createEl('div', { text: 'Time:', cls: 'sonic-graph-timeline-track-label' });
        const timeLine = timeTrack.createDiv({ cls: 'sonic-graph-timeline-line' });
        
        // Time markers container
        const timeMarkers = timeLine.createDiv({ cls: 'sonic-graph-timeline-markers sonic-graph-timeline-time-markers' });
        // Markers will be populated dynamically
        
        // Current position indicator (spans both tracks)
        const currentIndicator = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-current-indicator' });
        currentIndicator.createEl('div', { cls: 'sonic-graph-timeline-current-line' });
        const currentLabel = currentIndicator.createEl('div', { cls: 'sonic-graph-timeline-current-label' });
        currentLabel.createSpan({ text: 'Current: 2024', cls: 'sonic-graph-timeline-current-year' });
        currentLabel.createSpan({ text: '0s', cls: 'sonic-graph-timeline-current-time' });
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
            .setButtonText('Play Sonic Graph')
            .setCta()
            .onClick(() => this.toggleAnimation());
        
        // Speed control
        const speedContainer = playControls.createDiv({ cls: 'sonic-graph-speed-container' });
        speedContainer.createEl('label', { text: 'Speed:', cls: 'sonic-graph-speed-label' });
        this.speedSelect = speedContainer.createEl('select', { cls: 'sonic-graph-speed-select' });
        const savedSpeed = this.plugin.settings.sonicGraphAnimationSpeed || 1.0;
        const savedSpeedString = `${savedSpeed}x`;
        ['0.1x', '0.25x', '0.5x', '1x', '2x', '3x', '5x'].forEach(speed => {
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
        
        // Show file names toggle
        const fileNamesContainer = viewControls.createDiv({ cls: 'sonic-graph-toggle-container' });
        const fileNamesToggle = fileNamesContainer.createEl('input', { 
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        fileNamesToggle.checked = this.showFileNames;
        fileNamesToggle.addEventListener('change', () => this.handleShowFileNamesToggle());
        fileNamesContainer.createEl('label', { text: 'Show file names', cls: 'sonic-graph-toggle-label' });
        
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
                showLabels: this.showFileNames
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
            this.timelineContainer.style.display = 'block';
            
            // Initialize audio engine before starting animation
            try {
                const status = this.plugin.audioEngine.getStatus();
                if (!status.isInitialized) {
                    logger.info('audio', 'Initializing audio engine for animation');
                    await this.plugin.audioEngine.initialize();
                    new Notice('Audio engine initialized');
                }
                
                // Enable some basic instruments if none are enabled
                const audioStatus = this.plugin.audioEngine.getStatus();
                if (audioStatus.currentNotes === 0) {
                    logger.info('audio', 'Enabling basic instruments for animation');
                    // This would typically be done through settings, but for testing:
                    new Notice('Audio ready for animation');
                }
            } catch (audioError) {
                logger.warn('Failed to initialize audio for animation', (audioError as Error).message);
                new Notice('Audio initialization failed - animation will be silent');
            }
            
            // Start temporal animation
            this.temporalAnimator.play();
            
            logger.info('ui', 'Starting Sonic Graph temporal animation');
            new Notice('Sonic Graph animation started');
            
        } else {
            // Pause animation
            this.playButton.setButtonText('Play Sonic Graph');
            
            if (this.temporalAnimator) {
                this.temporalAnimator.pause();
            }
            
            logger.info('ui', 'Pausing Sonic Graph animation');
            new Notice('Animation paused');
        }
    }

    /**
     * Handle file names toggle
     */
    private handleShowFileNamesToggle(): void {
        this.showFileNames = !this.showFileNames;
        
        // Save setting
        this.plugin.settings.sonicGraphShowFileNames = this.showFileNames;
        this.plugin.saveSettings();
        
        // Update graph renderer
        if (this.graphRenderer) {
            this.graphRenderer.updateConfig({ showLabels: this.showFileNames });
        }
        
        logger.debug('ui', `File names visibility toggled: ${this.showFileNames}`);
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
            this.timelineContainer.style.display = 'block';
            
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
            this.timelineContainer.style.display = 'none';
            
            // Stop any animation
            if (this.temporalAnimator) {
                this.temporalAnimator.stop();
            }
            this.isAnimating = false;
            this.playButton.setButtonText('Play Sonic Graph');
            
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
            
            // Create temporal animator
            this.temporalAnimator = new TemporalGraphAnimator(
                graphData.nodes,
                graphData.links,
                {
                    duration: this.plugin.settings.sonicGraphAnimationDuration || 60, // Use user setting or default to 60 seconds
                    speed: 1.0
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
            
            // Initialize timeline markers
            this.updateTimelineMarkers();
            this.updateCurrentPosition(0, 0); // Initialize at start position
            
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
        
        // Update years markers
        this.updateYearsMarkers(timelineInfo);
        
        // Update time markers
        this.updateTimeMarkers(timelineInfo);
    }

    /**
     * Update years markers along the timeline
     */
    private updateYearsMarkers(timelineInfo: any): void {
        const yearsMarkersContainer = this.timelineInfo.querySelector('.sonic-graph-timeline-years-markers');
        if (!yearsMarkersContainer) return;
        
        // Clear existing markers
        yearsMarkersContainer.innerHTML = '';
        
        const startYear = timelineInfo.startDate.getFullYear();
        const endYear = timelineInfo.endDate.getFullYear();
        const yearRange = endYear - startYear;
        
        // Generate year markers - show more years for better granularity
        const years: number[] = [];
        
        if (yearRange <= 1) {
            // For short ranges, show months
            const startMonth = timelineInfo.startDate.getMonth();
            const endMonth = timelineInfo.endDate.getMonth();
            for (let month = startMonth; month <= endMonth + 12; month += 3) {
                const date = new Date(startYear, month);
                if (date >= timelineInfo.startDate && date <= timelineInfo.endDate) {
                    years.push(date.getFullYear() + date.getMonth() / 12);
                }
            }
        } else if (yearRange <= 5) {
            // For medium ranges, show every year
            for (let year = startYear; year <= endYear; year++) {
                years.push(year);
            }
        } else if (yearRange <= 10) {
            // For longer ranges, show every 2 years
            for (let year = startYear; year <= endYear; year += 2) {
                years.push(year);
            }
        } else {
            // For very long ranges, show every 5 years
            const step = Math.max(1, Math.floor(yearRange / 8));
            for (let year = startYear; year <= endYear; year += step) {
                years.push(year);
            }
        }
        
        // Create markers
        years.forEach(year => {
            const yearProgress = (year - startYear) / yearRange;
            const marker = yearsMarkersContainer.createEl('div', { cls: 'sonic-graph-timeline-marker' });
            marker.style.left = `${yearProgress * 100}%`;
            
            // Vertical line
            marker.createEl('div', { cls: 'sonic-graph-timeline-marker-line' });
            
            // Label
            const label = marker.createEl('div', { cls: 'sonic-graph-timeline-marker-label' });
            label.textContent = Math.floor(year).toString();
        });
    }

    /**
     * Update time markers along the timeline
     */
    private updateTimeMarkers(timelineInfo: any): void {
        const timeMarkersContainer = this.timelineInfo.querySelector('.sonic-graph-timeline-time-markers');
        if (!timeMarkersContainer) return;
        
        // Clear existing markers
        timeMarkersContainer.innerHTML = '';
        
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
            const marker = timeMarkersContainer.createEl('div', { cls: 'sonic-graph-timeline-marker' });
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
        this.playButton.setButtonText('Play Sonic Graph');
        
        logger.info('ui', 'Sonic Graph animation completed');
        new Notice('Animation completed');
    }

    /**
     * Handle node appearance for audio synchronization
     */
    private async handleNodeAppearance(node: GraphNode): Promise<void> {
        if (!this.plugin.audioEngine) return;
        
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
            
            // Try to play a simple test note first
            try {
                await this.plugin.audioEngine.playTestNote(mapping.pitch);
                logger.debug('audio', 'Test note played successfully');
            } catch (testError) {
                logger.warn('Test note failed', (testError as Error).message);
                
                // Fallback: try to play through the sequence method
                await this.plugin.audioEngine.playSequence([mapping]);
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