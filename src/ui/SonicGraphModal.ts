/**
 * SonicGraphModal
 * 
 * A large modal for displaying and interacting with the temporal graph animation.
 * Features static graph view by default with play button to trigger animation.
 * Includes timeline controls, settings panel, and cross-navigation to Control Center.
 */

import { App, Modal, ButtonComponent, Notice } from 'obsidian';
import { GraphDataExtractor } from '../graph/GraphDataExtractor';
import { GraphRenderer } from '../graph/GraphRenderer';
import { createLucideIcon } from './lucide-icons';
import { getLogger } from '../logging';
import * as d3 from 'd3';
import type SonigraphPlugin from '../main';

const logger = getLogger('SonicGraphModal');

export class SonicGraphModal extends Modal {
    private plugin: SonigraphPlugin;
    private graphDataExtractor: GraphDataExtractor;
    private graphRenderer: GraphRenderer | null = null;
    private isAnimating: boolean = false;
    private showFileNames: boolean = false;
    
    // UI elements
    private headerContainer: HTMLElement;
    private graphContainer: HTMLElement;
    private timelineContainer: HTMLElement;
    private controlsContainer: HTMLElement;
    private playButton: ButtonComponent;
    private statsContainer: HTMLElement;

    constructor(app: App, plugin: SonigraphPlugin) {
        super(app);
        this.plugin = plugin;
        this.graphDataExtractor = new GraphDataExtractor(app.vault, app.metadataCache);
        
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
            contentEl.addClass('sonic-graph-content');
            
            // Create modal structure
            this.createHeader();
            this.createGraphArea();
            this.createTimelineArea();
            this.createControlsArea();
            
            // Initialize graph
            this.initializeGraph();
            
        } catch (error) {
            logger.error('Error opening Sonic Graph modal', (error as Error).message);
            new Notice('Failed to open Sonic Graph modal');
        }
    }

    onClose() {
        logger.debug('ui', 'Closing Sonic Graph modal');
        
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
    private createHeader(): void {
        this.headerContainer = this.contentEl.createDiv({ cls: 'sonic-graph-header' });
        
        // Simple title only
        const titleContainer = this.headerContainer.createDiv({ cls: 'sonic-graph-title-container' });
        titleContainer.createEl('h1', { text: 'Sonic Graph', cls: 'sonic-graph-title' });
    }

    /**
     * Create main graph visualization area
     */
    private createGraphArea(): void {
        this.graphContainer = this.contentEl.createDiv({ cls: 'sonic-graph-container' });
        
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
    private createTimelineArea(): void {
        this.timelineContainer = this.contentEl.createDiv({ cls: 'sonic-graph-timeline' });
        this.timelineContainer.style.display = 'none'; // Hidden until animation starts
        
        // Timeline scrubber
        const scrubberContainer = this.timelineContainer.createDiv({ cls: 'sonic-graph-scrubber-container' });
        scrubberContainer.createEl('label', { text: 'Timeline', cls: 'sonic-graph-scrubber-label' });
        
        const scrubber = scrubberContainer.createEl('input', { 
            type: 'range',
            cls: 'sonic-graph-scrubber'
        });
        scrubber.min = '0';
        scrubber.max = '100';
        scrubber.value = '0';
        
        // Timeline info
        const timelineInfo = this.timelineContainer.createDiv({ cls: 'sonic-graph-timeline-info' });
        timelineInfo.createSpan({ text: 'Start', cls: 'sonic-graph-timeline-start' });
        timelineInfo.createSpan({ text: 'Current: 2024', cls: 'sonic-graph-timeline-current' });
        timelineInfo.createSpan({ text: 'End', cls: 'sonic-graph-timeline-end' });
    }

    /**
     * Create controls area with play button, stats, and navigation
     */
    private createControlsArea(): void {
        this.controlsContainer = this.contentEl.createDiv({ cls: 'sonic-graph-controls' });
        
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
        const speedSelect = speedContainer.createEl('select', { cls: 'sonic-graph-speed-select' });
        ['0.5x', '1x', '2x', '3x', '5x'].forEach(speed => {
            const option = speedSelect.createEl('option', { text: speed, value: speed });
            if (speed === '1x') option.selected = true;
        });
        
        // Center - Stats
        const statsControls = this.controlsContainer.createDiv({ cls: 'sonic-graph-stats-controls' });
        this.statsContainer = statsControls.createDiv({ cls: 'sonic-graph-stats' });
        this.updateStats();
        
        // Right side - View controls and navigation
        const viewControls = this.controlsContainer.createDiv({ cls: 'sonic-graph-view-controls' });
        
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
    private toggleAnimation(): void {
        if (!this.graphRenderer) {
            new Notice('Graph not ready');
            return;
        }
        
        this.isAnimating = !this.isAnimating;
        
        if (this.isAnimating) {
            // Start animation
            this.playButton.setButtonText('Pause Animation');
            this.timelineContainer.style.display = 'block';
            
            // TODO: Implement actual animation logic
            logger.debug('ui', 'Starting Sonic Graph animation');
            new Notice('Animation started (placeholder)');
            
        } else {
            // Stop animation
            this.playButton.setButtonText('Play Sonic Graph');
            
            // TODO: Implement pause logic
            logger.debug('ui', 'Pausing Sonic Graph animation');
            new Notice('Animation paused (placeholder)');
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
} 