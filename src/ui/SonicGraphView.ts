/**
 * SonicGraphView
 *
 * An ItemView for displaying and interacting with the temporal graph animation.
 * Features static graph view by default with play button to trigger animation.
 * Includes timeline controls, settings panel, and cross-navigation to Control Center.
 */

import { ItemView, WorkspaceLeaf, ButtonComponent, Notice, setTooltip, Setting, setIcon, Platform } from 'obsidian';
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
import { NoteVisualizationManager } from '../visualization/NoteVisualizationManager';
import { ViewPendingState, ViewWithPendingState, DynamicSettings } from '../obsidian-extended';
import { PanningMode, PanningCurve } from '../audio/spatial/types';

const logger = getLogger('SonicGraphView');

export const VIEW_TYPE_SONIC_GRAPH = 'sonic-graph-view';

/**
 * State interface for Sonic Graph view persistence
 */
export interface SonicGraphViewState {
    // Timeline state
    isTimelineView: boolean;
    isAnimating: boolean;
    currentTimelinePosition: number;
    animationSpeed: number;

    // Settings panel state
    isSettingsVisible: boolean;

    // View configuration
    detectedSpacing: 'dense' | 'balanced' | 'sparse';

    // Visual display state
    isVisualDisplayVisible: boolean;
    visualDisplayHeight: number;
}

export class SonicGraphView extends ItemView implements ViewWithPendingState {
    // Pending state for view restoration
    _pendingState?: ViewPendingState;

    private plugin: SonigraphPlugin;
    private graphDataExtractor: GraphDataExtractor;
    private graphRenderer: GraphRenderer | null = null;
    private temporalAnimator: TemporalGraphAnimator | null = null;
    private musicalMapper: MusicalMapper | null = null;
    private adaptiveDetailManager: AdaptiveDetailManager | null = null;
    private continuousLayerManager: ContinuousLayerManager | null = null;
    private visualizationManager: NoteVisualizationManager | null = null;
    private isAnimating: boolean = false;
    private isTimelineView: boolean = false; // false = Static View, true = Timeline View
    
    // Performance optimization: Event listener management
    private eventListeners: Array<{ element: Element | Document | Window, event: string, handler: EventListener }> = [];

    // Performance optimization: Settings debouncing
    private pendingSettingsUpdates = new Map<string, unknown>();
    private settingsUpdateTimeout: NodeJS.Timeout | null = null;
    private scrubSaveTimeout: NodeJS.Timeout | null = null;

    // Performance optimization: Progress indicator
    private progressIndicator: HTMLElement | null = null;

    // Responsive sizing: Resize observer for dynamic graph sizing
    private resizeObserver: ResizeObserver | null = null;

    // Background state handling: Track if view is in foreground
    private isViewActive = true;
    private wasAnimatingBeforeBackground = false;

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
    private detectedSpacing: 'dense' | 'balanced' | 'sparse' = 'balanced';
    private settingsPanel: HTMLElement;
    private settingsButton: HTMLButtonElement;
    private isSettingsVisible: boolean = false;

    // Visual display panel elements
    private visualDisplaySection: HTMLElement | null = null;
    private visualDisplayContent: HTMLElement | null = null;
    private visualDivider: HTMLElement | null = null;
    private isVisualDisplayVisible: boolean = false;
    private visualDisplayHeight: number = 250; // Default height in pixels
    private isDraggingDivider: boolean = false;
    
    // Audio density tracking for even distribution
    private nodeAppearanceCounter: number = 0;
    private lastAudioNodeIndex: number = -1;

    // Musical progression tracking for melodic continuity
    private lastScaleDegree: number = 0;
    private currentChordIndex: number = 0;
    private currentChordProgression: number[][] = [];
    private notesInCurrentPhrase: number = 0;
    private phraseLengthInNotes: number = 8; // Musical phrase length

    constructor(leaf: WorkspaceLeaf, plugin: SonigraphPlugin) {
        super(leaf);
        void logger.debug('ui', 'SonicGraphView constructor started');
        
        this.plugin = plugin;
        void logger.debug('ui', 'Plugin assigned');
        
        try {
            const excludeFolders = plugin.settings.sonicGraphExcludeFolders || [];
            const excludeFiles = plugin.settings.sonicGraphExcludeFiles || [];
            const filterSettings = this.getSonicGraphSettings().layout.filters;
            logger.debug('ui', 'Creating GraphDataExtractor with exclusions and filters:', { excludeFolders, excludeFiles, filterSettings });
            
            this.graphDataExtractor = new GraphDataExtractor(this.app.vault, this.app.metadataCache, {
                excludeFolders,
                excludeFiles,
                filterSettings
            });
            void logger.debug('ui', 'GraphDataExtractor created successfully');
        } catch (error) {
            logger.error('ui', 'Failed to create GraphDataExtractor:', (error as Error).message);
            logger.error('ui', 'GraphDataExtractor error stack:', (error as Error).stack);
            throw error;
        }
        
        void logger.debug('ui', 'SonicGraphView constructor completed');
    }

    getViewType(): string {
        return VIEW_TYPE_SONIC_GRAPH;
    }

    getDisplayText(): string {
        return 'Sonic Graph';
    }

    getIcon(): string {
        return 'chart-network';
    }

    async setState(state: unknown, result: unknown): Promise<void> {
        void logger.debug('state', 'Restoring view state', state);

        // Call parent implementation first
        await super.setState(state, result);

        // Type guard to ensure we have valid state
        if (!state || typeof state !== 'object') {
            void logger.debug('state', 'No valid state to restore');
            return;
        }

        const viewState = state as Partial<SonicGraphViewState>;

        // Restore timeline state after view is initialized
        // These will be applied when UI elements are created in onOpen()
        if (viewState.isTimelineView !== undefined) {
            this.isTimelineView = viewState.isTimelineView;
            void logger.debug('state', 'Restored isTimelineView', this.isTimelineView);
        }

        if (viewState.isAnimating !== undefined) {
            // Note: We don't auto-start animation on restore, just preserve the flag
            // The user can manually restart if desired
            void logger.debug('state', 'Animation state was', viewState.isAnimating);
        }

        if (viewState.detectedSpacing !== undefined) {
            this.detectedSpacing = viewState.detectedSpacing;
            void logger.debug('state', 'Restored detectedSpacing', this.detectedSpacing);
        }

        if (viewState.isSettingsVisible !== undefined) {
            this.isSettingsVisible = viewState.isSettingsVisible;
            void logger.debug('state', 'Restored isSettingsVisible', this.isSettingsVisible);
        }

        if (viewState.isVisualDisplayVisible !== undefined) {
            this.isVisualDisplayVisible = viewState.isVisualDisplayVisible;
            void logger.debug('state', 'Restored isVisualDisplayVisible', this.isVisualDisplayVisible);
        } else {
            // Initialize from plugin settings if no saved state
            this.isVisualDisplayVisible = this.plugin.settings.sonicGraphSettings?.visualDisplay?.enabled ?? true;
            void logger.debug('state', 'Initialized isVisualDisplayVisible from settings', this.isVisualDisplayVisible);
        }

        if (viewState.visualDisplayHeight !== undefined) {
            this.visualDisplayHeight = viewState.visualDisplayHeight;
            void logger.debug('state', 'Restored visualDisplayHeight', this.visualDisplayHeight);
        } else {
            // Initialize from plugin settings if no saved state
            this.visualDisplayHeight = this.plugin.settings.sonicGraphSettings?.visualDisplay?.height ?? 250;
            void logger.debug('state', 'Initialized visualDisplayHeight from settings', this.visualDisplayHeight);
        }

        // Update visual display section if it's already been created (setState called after onOpen)
        void this.updateVisualDisplayState();

        // Store timeline position and speed for restoration after graph initialization
        if (viewState.currentTimelinePosition !== undefined || viewState.animationSpeed !== undefined) {
            // We'll apply these values after the UI is fully initialized
            // Store them temporarily for use in onOpen()
            this._pendingState = {
                timelinePosition: viewState.currentTimelinePosition,
                animationSpeed: viewState.animationSpeed
            };
            void logger.debug('state', 'Stored pending timeline state for post-initialization');
        }

        void logger.info('state', 'View state restoration complete');
    }

    getState(): unknown {
        logger.info('state', 'getState() called - capturing view state', {
            isTimelineView: this.isTimelineView,
            hasScrubber: !!this.timelineScrubber,
            hasAnimator: !!this.temporalAnimator,
            scrubberValue: this.timelineScrubber?.value,
            hasGraphRenderer: !!this.graphRenderer,
            callStack: new Error().stack?.split('\n').slice(1, 4).join(' | ')
        });

        // Get current timeline position from scrubber if available
        let currentTimelinePosition = 0;
        if (this.timelineScrubber) {
            currentTimelinePosition = parseFloat(this.timelineScrubber.value) || 0;
            logger.info('state', 'Captured timeline position from scrubber', { currentTimelinePosition });
        } else if (this.isTimelineView) {
            void logger.warn('state', 'isTimelineView is true but scrubber does not exist - cannot capture position');
        }

        // Get animation speed from select if available
        let animationSpeed = 1;
        if (this.speedSelect) {
            animationSpeed = parseFloat(this.speedSelect.value) || 1;
        }

        const state: SonicGraphViewState = {
            // Timeline state
            isTimelineView: this.isTimelineView,
            isAnimating: this.isAnimating,
            currentTimelinePosition,
            animationSpeed,

            // Settings panel state
            isSettingsVisible: this.isSettingsVisible,

            // View configuration
            detectedSpacing: this.detectedSpacing,

            // Visual display state
            isVisualDisplayVisible: this.isVisualDisplayVisible,
            visualDisplayHeight: this.visualDisplayHeight
        };

        logger.info('state', 'Final state being returned from getState()', state);
        return state;
    }

    onOpen(): void {
        logger.info('sonic-graph-init', 'View onOpen() started');

        try {
            // Initialize visual display settings from plugin settings if not already set by setState
            if (!this.isVisualDisplayVisible && this.plugin.settings.sonicGraphSettings?.visualDisplay?.enabled) {
                this.isVisualDisplayVisible = true;
                void logger.debug('sonic-graph-init', 'Initialized visual display from settings in onOpen');
            }

            const { contentEl } = this;
            void logger.info('sonic-graph-init', 'ContentEl acquired, emptying');
            void contentEl.empty();
            void logger.info('sonic-graph-init', 'ContentEl emptied successfully');

            // Add view-specific classes
            void logger.info('sonic-graph-init', 'Adding view CSS classes');
            void contentEl.addClass('sonic-graph-view');

            // Create main view container
            void logger.info('sonic-graph-init', 'Creating view container');
            const viewContainer = contentEl.createDiv({ cls: 'sonic-graph-view-container' });
            
            // Create view structure inside container
            void logger.info('sonic-graph-init', 'Creating header');
            void this.createHeader(viewContainer);
            void logger.info('sonic-graph-init', 'Header created successfully');
            
            logger.info('sonic-graph-init', 'Creating main content (includes timeline)');
            void this.createMainContent(viewContainer);
            void logger.info('sonic-graph-init', 'Main content created successfully');

            void logger.info('sonic-graph-init', 'Creating controls area');
            void this.createControlsArea(viewContainer);
            void logger.info('sonic-graph-init', 'Controls area created successfully');
            
            // Initialize graph
            void logger.info('sonic-graph-init', 'Starting graph initialization - THIS IS THE CRITICAL STEP');
            this.initializeGraph().catch(error => {
                void logger.error('sonic-graph-init', 'Graph initialization failed:', error);
                new Notice('Failed to initialize Sonic Graph: ' + error.message);
            });

            // Register workspace event listener for background state handling
            void this.registerWorkspaceListener();

        } catch (error) {
            logger.error('ui', 'Error opening Sonic Graph view:', (error as Error).message);
            logger.error('ui', 'Error stack:', (error as Error).stack);
            new Notice('Failed to open Sonic Graph view: ' + (error as Error).message);
        }
    }

    /**
     * Register workspace event listener to detect when view becomes active/inactive
     */
    private registerWorkspaceListener(): void {
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (leaf?.view === this) {
                    // This view just became active
                    void this.handleViewActivated();
                } else if (this.isViewActive) {
                    // This view just became inactive
                    void this.handleViewDeactivated();
                }
            })
        );
        void logger.debug('background-state', 'Workspace listener registered for background state handling');
    }

    /**
     * Handle view becoming active (brought to foreground)
     */
    private handleViewActivated(): void {
        if (this.isViewActive) {
            return; // Already active
        }

        void logger.info('background-state', 'View activated - resuming operations');
        this.isViewActive = true;

        // Resume animation if it was running before backgrounding
        if (this.wasAnimatingBeforeBackground && this.temporalAnimator) {
            void logger.debug('background-state', 'Resuming animation');
            this.temporalAnimator.play();
            this.isAnimating = true;
            this.wasAnimatingBeforeBackground = false;
        }

        // Audio automatically continues when view is active
        void logger.debug('background-state', 'View activation complete');
    }

    /**
     * Handle view becoming inactive (moved to background)
     */
    private handleViewDeactivated(): void {
        if (!this.isViewActive) {
            return; // Already inactive
        }

        void logger.info('background-state', 'View deactivated - pausing operations for performance');
        this.isViewActive = false;

        // Pause animation if it's running
        if (this.isAnimating && this.temporalAnimator) {
            void logger.debug('background-state', 'Pausing animation');
            this.temporalAnimator.pause();
            this.wasAnimatingBeforeBackground = true;
        }

        // Note: We keep audio playing since continuous layers should persist
        // Users can manually stop audio if desired via the controls
        logger.debug('background-state', 'View deactivation complete (audio continues)');
    }

    /**
     * Apply pending state after view initialization
     */
    private async applyPendingState(): Promise<void> {
        const pendingState = this._pendingState;
        if (!pendingState) {
            void logger.debug('state', 'No pending state to apply');
            return;
        }

        void logger.debug('state', 'Applying pending state', pendingState);

        try {
            // First, ensure temporal animator exists if we're in timeline view
            // This is needed because the animator initializes asynchronously
            if (this.isTimelineView && !this.temporalAnimator) {
                void logger.debug('state', 'Timeline view is active but animator not initialized yet - waiting');
                await this.waitForTemporalAnimator();
            }

            // Restore timeline position (after timeline is visible and animator is ready)
            if (pendingState.timelinePosition !== undefined && this.timelineScrubber && this.temporalAnimator) {
                const position = pendingState.timelinePosition;
                this.timelineScrubber.value = position.toString();

                // Calculate time from position (position is 0-100, time is in seconds)
                const timelineInfo = this.temporalAnimator.getTimelineInfo();
                const time = (position / 100) * timelineInfo.duration;

                // Seek animator to the position
                this.temporalAnimator.seekTo(time);

                logger.debug('state', 'Restored timeline position to', { position, time });
            }

            // Restore animation speed
            if (pendingState.animationSpeed !== undefined && this.speedSelect) {
                this.speedSelect.value = pendingState.animationSpeed.toString();
                // Update animator speed if available
                if (this.temporalAnimator) {
                    this.temporalAnimator.setSpeed(pendingState.animationSpeed);
                }
                void logger.debug('state', 'Restored animation speed', pendingState.animationSpeed);
            }

            // Restore settings panel visibility
            if (this.isSettingsVisible && this.settingsPanel) {
                this.settingsPanel.removeClass('hidden');
                if (this.settingsButton) {
                    this.settingsButton.addClass('active');
                }
                void logger.debug('state', 'Restored settings panel visibility');
            }

            void logger.info('state', 'Pending state applied successfully');
        } catch (error) {
            void logger.error('state', 'Failed to apply pending state', error);
        } finally {
            // Clear pending state
            delete this._pendingState;
        }
    }

    /**
     * Wait for temporal animator to be initialized
     * Used during state restoration to ensure animator is ready before seeking
     */
    private async waitForTemporalAnimator(): Promise<void> {
        const maxWaitTime = 5000; // 5 seconds max wait
        const checkInterval = 100; // Check every 100ms
        const startTime = Date.now();

        while (!this.temporalAnimator) {
            if (Date.now() - startTime > maxWaitTime) {
                void logger.error('state', 'Timeout waiting for temporal animator initialization');
                throw new Error('Temporal animator initialization timeout');
            }
            // Wait 100ms before checking again
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        void logger.debug('state', 'Temporal animator is ready');
    }

    /**
     * Initialize continuous layers for Phase 3
     */
    private async initializeContinuousLayers(): Promise<void> {
        try {
            void logger.info('continuous-layers', 'Initializing continuous layers');

            // Check if continuous layers are actually enabled before creating the manager
            const layerConfig = this.plugin.settings.audioEnhancement?.continuousLayers;
            if (!layerConfig?.enabled) {
                void logger.info('continuous-layers', 'Continuous layers disabled, skipping initialization');
                return;
            }

            if (!this.continuousLayerManager) {
                logger.info('continuous-layers', 'Layer config', {
                    enabled: layerConfig?.enabled,
                    genre: layerConfig?.genre,
                    hasConfig: !!layerConfig
                });

                this.continuousLayerManager = new ContinuousLayerManager(
                    this.plugin.settings,
                    layerConfig
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
            
            void logger.info('continuous-layers', 'Continuous layers initialized successfully');
        } catch (error) {
            void logger.error('continuous-layers', 'Failed to initialize continuous layers', error);
            new Notice('Failed to initialize continuous audio layers');
        }
    }

    /**
     * Setup divider drag functionality for resizing visual display panel
     */
    private setupDividerDrag(): void {
        if (!this.visualDivider) {
            void logger.warn('visual-display', 'Cannot setup divider drag - visualDivider is null');
            return;
        }

        void logger.info('visual-display', 'Setting up divider drag handlers');

        const onMouseDown = (e: MouseEvent) => {
            void logger.debug('visual-display', 'Divider mousedown event triggered');
            this.isDraggingDivider = true;
            document.body.setCssProps({
                cursor: 'ns-resize',
                userSelect: 'none'
            });
            void e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!this.isDraggingDivider || !this.visualDisplaySection) return;

            const container = this.visualDisplaySection.parentElement;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const newHeight = containerRect.bottom - e.clientY;

            // Constrain height between 150px and 400px
            const constrainedHeight = Math.max(150, Math.min(400, newHeight));

            this.visualDisplayHeight = constrainedHeight;

            // Update via CSS custom property using DOM API directly
            (this.visualDisplaySection).style.setProperty('--visual-display-height', `${constrainedHeight}px`);

            // Verify the property was set
            const appliedValue = (this.visualDisplaySection).style.getPropertyValue('--visual-display-height');

            logger.debug('visual-display', 'Divider dragged - new height', {
                requested: constrainedHeight,
                applied: appliedValue,
                computedMinHeight: getComputedStyle(this.visualDisplaySection).minHeight,
                computedMaxHeight: getComputedStyle(this.visualDisplaySection).maxHeight
            });
        };

        const onMouseUp = () => {
            if (this.isDraggingDivider) {
                this.isDraggingDivider = false;
                document.body.setCssProps({
                    cursor: '',
                    userSelect: ''
                });

                // Save height preference
                void logger.info('visual-display', 'Saved visual display height', this.visualDisplayHeight);
            }
        };

        void this.registerDomEvent(this.visualDivider, 'mousedown', onMouseDown);
        void this.registerDomEvent(document, 'mousemove', onMouseMove);
        void this.registerDomEvent(document, 'mouseup', onMouseUp);

        void logger.info('visual-display', 'Divider drag handlers registered successfully');
    }

    /**
     * Toggle visual display panel visibility
     */
    private toggleVisualDisplay(collapseBtn: HTMLButtonElement): void {
        if (!this.visualDisplaySection) return;

        this.isVisualDisplayVisible = !this.isVisualDisplayVisible;

        if (this.isVisualDisplayVisible) {
            this.visualDisplaySection.removeClass('collapsed');
            void collapseBtn.setText('▼');
            void logger.debug('visual-display', 'Visual display expanded');

            // Force resize of visualization after expanding (fixes sizing issues when toggling modes while collapsed)
            if (this.visualizationManager) {
                // Use requestAnimationFrame to ensure DOM has updated before resizing
                requestAnimationFrame(() => {
                    this.visualizationManager?.forceResize();
                    void logger.debug('visual-display', 'Forced visualization resize after expand');
                });
            }
        } else {
            this.visualDisplaySection.addClass('collapsed');
            void collapseBtn.setText('▲');
            void logger.debug('visual-display', 'Visual display collapsed');
        }
    }

    /**
     * Switch visualization mode (piano-roll, spectrum, staff)
     */
    private switchVisualizationMode(mode: 'piano-roll' | 'spectrum' | 'staff', tabs: HTMLButtonElement[]): void {
        if (!this.visualizationManager) return;

        logger.info('visual-display', `Switching visualization mode to ${mode}`);

        // Update tab active states
        tabs.forEach(tab => tab.removeClass('active'));
        const activeTabIndex = mode === 'piano-roll' ? 0 : mode === 'spectrum' ? 1 : 2;
        tabs[activeTabIndex].addClass('active');

        // Update visualization manager mode
        this.visualizationManager.updateConfig({ mode });

        // If switching to spectrum mode, connect to audio
        if (mode === 'spectrum') {
            const audioContext = this.plugin.audioEngine.getTestAudioContext();
            const masterVolume = this.plugin.audioEngine.getMasterVolume();

            if (audioContext && masterVolume) {
                this.visualizationManager.connectSpectrumToAudio(audioContext, masterVolume);
                void logger.info('visual-display', 'Connected spectrum analyzer to audio after mode switch');
            }
        }
    }

    /**
     * Update visual display section state after setState() restores values
     */
    private updateVisualDisplayState(): void {
        if (!this.visualDisplaySection) {
            void logger.debug('visual-display', 'Visual display section not yet created, skipping state update');
            return;
        }

        logger.info('visual-display', 'Updating visual display state after setState', {
            isVisible: this.isVisualDisplayVisible,
            height: this.visualDisplayHeight
        });

        // Update collapsed state
        if (this.isVisualDisplayVisible) {
            this.visualDisplaySection.removeClass('collapsed');
            void logger.debug('visual-display', 'Removed collapsed class after setState');
        } else {
            this.visualDisplaySection.addClass('collapsed');
            void logger.debug('visual-display', 'Added collapsed class after setState');
        }

        // Update height via CSS custom property using DOM API
        (this.visualDisplaySection).style.setProperty('--visual-display-height', `${this.visualDisplayHeight}px`);

        // Update visualization manager config if it exists
        if (this.visualizationManager) {
            void logger.debug('visual-display', 'Updating visualization manager enabled state', this.isVisualDisplayVisible);
            this.visualizationManager.updateConfig({
                enabled: this.isVisualDisplayVisible
            });

            // If now visible, start it (start() will check if already running)
            if (this.isVisualDisplayVisible) {
                void logger.debug('visual-display', 'Starting visualization after setState');
                this.visualizationManager.start(0);
            }
        }
    }

    /**
     * Initialize the visual note display manager
     */
    private initializeVisualizationManager(): void {
        if (!this.visualDisplayContent) {
            void logger.warn('visual-display', 'Cannot initialize visualization manager without content container');
            return;
        }

        try {
            void logger.info('visual-display', 'Initializing visualization manager');

            // Get settings for visual display
            const visualSettings = this.plugin.settings.sonicGraphSettings?.visualDisplay;

            // Create visualization manager with settings or defaults
            this.visualizationManager = new NoteVisualizationManager({
                mode: visualSettings?.mode || 'piano-roll',
                enabled: this.isVisualDisplayVisible,
                frameRate: visualSettings?.frameRate || 30,
                colorScheme: visualSettings?.colorScheme || 'layer',
                showLabels: visualSettings?.showLabels ?? true,
                showGrid: visualSettings?.showGrid ?? true,
                enableTrails: visualSettings?.enableTrails ?? false
            });

            // Initialize with content container
            this.visualizationManager.initialize(this.visualDisplayContent);

            // Connect spectrum analyzer to audio if in spectrum mode
            const visualConfig = this.visualizationManager.getConfig();
            if (visualConfig.mode === 'spectrum') {
                const audioContext = this.plugin.audioEngine.getTestAudioContext();
                const masterVolume = this.plugin.audioEngine.getMasterVolume();

                if (audioContext && masterVolume) {
                    this.visualizationManager.connectSpectrumToAudio(audioContext, masterVolume);
                    void logger.info('visual-display', 'Connected spectrum analyzer to audio');
                }
            }

            // Connect to audio engine note events
            void this.setupAudioEngineIntegration();

            // Trigger initial render to show empty piano roll
            if (this.isVisualDisplayVisible) {
                this.visualizationManager.start(0);
                void logger.debug('visual-display', 'Started visualization for initial render');
            }

            void logger.info('visual-display', 'Visualization manager initialized successfully');
        } catch (error) {
            void logger.error('visual-display', 'Failed to initialize visualization manager', error);
            new Notice('Failed to initialize visual note display');
        }
    }

    /**
     * Setup audio engine integration for visual display
     * Listens to note-triggered events from the audio engine
     */
    private setupAudioEngineIntegration(): void {
        if (!this.visualizationManager) {
            void logger.warn('visual-display', 'Cannot setup audio integration - no visualization manager');
            return;
        }

        // Listen for note-triggered events from audio engine
        this.plugin.audioEngine.on('note-triggered', (data: unknown) => {
            if (!this.visualizationManager) {
                void logger.warn('visual-display', 'Received note event but no visualization manager');
                return;
            }

            logger.info('visual-display', 'Received note-triggered event from audio engine', {
                pitch: data.pitch,
                layer: data.layer,
                timestamp: data.timestamp,
                instrument: data.instrument,
                nodeId: data.nodeId,
                nodeTitle: data.nodeTitle
            });

            // Add note to piano roll visualization
            this.visualizationManager.addNoteEvent({
                pitch: data.pitch,
                velocity: data.velocity,
                duration: data.duration,
                layer: data.layer,
                timestamp: data.timestamp, // Use timestamp from audio engine
                isPlaying: false
            });

            // Highlight graph node if node ID is provided
            if (data.nodeId && this.graphRenderer) {
                const highlightDuration = data.duration * 1000; // Convert to milliseconds
                this.graphRenderer.highlightNode(data.nodeId, data.layer, highlightDuration);
            }
        });

        // Listen for playback-started to reset visualization
        this.plugin.audioEngine.on('playback-started', () => {
            if (!this.visualizationManager) return;
            void logger.debug('visual-display', 'Playback started - resetting visualization');
            this.visualizationManager.clearNotes();
            this.visualizationManager.updatePlaybackTime(0); // Reset playback time to 0
        });

        void logger.info('visual-display', 'Audio engine integration setup complete');
    }

    onClose(): void {
        void logger.info('ui', 'Closing Sonic Graph view - starting cleanup');

        try {
            // Performance optimization: Cleanup all event listeners
            void logger.debug('ui', 'Removing event listeners');
            void this.removeAllEventListeners();
        } catch (error) {
            void logger.error('ui', 'Error removing event listeners:', error);
        }

        try {
            // Performance optimization: Clear any pending settings updates
            void logger.debug('ui', 'Clearing timeouts');
            if (this.settingsUpdateTimeout) {
                clearTimeout(this.settingsUpdateTimeout);
                this.settingsUpdateTimeout = null;
            }
            if (this.scrubSaveTimeout) {
                clearTimeout(this.scrubSaveTimeout);
                this.scrubSaveTimeout = null;
            }
            this.pendingSettingsUpdates.clear();
        } catch (error) {
            void logger.error('ui', 'Error clearing timeouts:', error);
        }

        try {
            // Cleanup continuous layers
            void logger.debug('ui', 'Stopping continuous layers');
            if (this.continuousLayerManager) {
                void this.continuousLayerManager.stop();
                this.continuousLayerManager = null;
            }
        } catch (error) {
            void logger.error('ui', 'Error stopping continuous layers:', error);
        }

        try {
            // Cleanup temporal animator
            void logger.debug('ui', 'Destroying temporal animator');
            if (this.temporalAnimator) {
                this.temporalAnimator.destroy();
                this.temporalAnimator = null;
            }
        } catch (error) {
            void logger.error('ui', 'Error destroying temporal animator:', error);
        }

        try {
            // Cleanup musical mapper
            void logger.debug('ui', 'Disposing musical mapper');
            if (this.musicalMapper) {
                this.musicalMapper.dispose();
                this.musicalMapper = null;
            }
        } catch (error) {
            void logger.error('ui', 'Error disposing musical mapper:', error);
        }

        try {
            // Cleanup graph renderer
            void logger.debug('ui', 'Destroying graph renderer');
            if (this.graphRenderer) {
                this.graphRenderer.destroy();
                this.graphRenderer = null;
            }
        } catch (error) {
            void logger.error('ui', 'Error destroying graph renderer:', error);
        }

        try {
            // Cleanup adaptive detail manager
            void logger.debug('ui', 'Destroying adaptive detail manager');
            if (this.adaptiveDetailManager) {
                this.adaptiveDetailManager.destroy();
                this.adaptiveDetailManager = null;
            }
        } catch (error) {
            void logger.error('ui', 'Error destroying adaptive detail manager:', error);
        }

        try {
            // Cleanup visualization manager
            void logger.debug('ui', 'Destroying visualization manager');
            if (this.visualizationManager) {
                this.visualizationManager.destroy();
                this.visualizationManager = null;
            }
        } catch (error) {
            void logger.error('ui', 'Error destroying visualization manager:', error);
        }

        try {
            // Cleanup resize observer
            void logger.debug('ui', 'Disconnecting resize observer');
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        } catch (error) {
            void logger.error('ui', 'Error disconnecting resize observer:', error);
        }

        try {
            // Reset animation state
            this.isAnimating = false;

            // Hide progress indicator
            void this.hideProgressIndicator();

            // Clear content
            const { contentEl } = this;
            void contentEl.empty();
        } catch (error) {
            void logger.error('ui', 'Error clearing content:', error);
        }

        void logger.info('ui', 'Sonic Graph view closed successfully');
    }

    /**
     * Create view header with title only (sticky)
     */
    private createHeader(container: HTMLElement): void {
        this.headerContainer = container.createDiv({ cls: 'sonic-graph-header' });

        // Title on the left with icon
        const titleContainer = this.headerContainer.createDiv({ cls: 'sonic-graph-title-container' });
        const titleIcon = createLucideIcon('chart-network', 20);
        void titleContainer.appendChild(titleIcon);
        titleContainer.createEl('h1', { text: 'Sonic Graph', cls: 'sonic-graph-title' });

        // Middle section - Play controls
        const playControlsGroup = this.headerContainer.createDiv({ cls: 'sonic-graph-header-play-controls' });

        // Play/Pause button
        const playButtonContainer = playControlsGroup.createDiv({ cls: 'sonic-graph-play-button-container' });
        this.playButton = new ButtonComponent(playButtonContainer);
        this.playButton
            .setButtonText('Play')
            .onClick(() => this.toggleAnimation());

        // Speed control
        const speedContainer = playControlsGroup.createDiv({ cls: 'sonic-graph-speed-container' });
        speedContainer.createEl('label', { text: 'Speed:', cls: 'sonic-graph-speed-label' });
        this.speedSelect = speedContainer.createEl('select', { cls: 'sonic-graph-speed-select' });
        const savedSpeed = this.plugin.settings.sonicGraphAnimationSpeed || 1.0;
        const savedSpeedString = `${savedSpeed}x`;
        ['0.1x', '0.25x', '0.5x', '1x', '2x', '5x', '10x', '20x', '50x'].forEach(speed => {
            const option = this.speedSelect.createEl('option', { text: speed, value: speed });
            if (speed === savedSpeedString) option.selected = true;
        });
        this.registerDomEvent(this.speedSelect, 'change', () => this.handleSpeedChange());

        // Right side - Button group
        const buttonGroup = this.headerContainer.createDiv({ cls: 'sonic-graph-header-button-group' });

        // Settings button
        this.settingsButton = buttonGroup.createEl('button', {
            cls: 'sonic-graph-header-btn sonic-graph-settings-btn',
            text: 'Settings'
        });
        const settingsIcon = createLucideIcon('sliders', 16);
        this.settingsButton.insertBefore(settingsIcon, this.settingsButton.firstChild);
        this.settingsButton.addEventListener('click', () => this.toggleSettings());

        // Plugin Settings button
        const pluginSettingsBtn = buttonGroup.createEl('button', {
            cls: 'sonic-graph-header-btn sonic-graph-plugin-settings-btn',
            text: 'Plugin settings'
        });
        const pluginSettingsIcon = createLucideIcon('cog', 16);
        void pluginSettingsBtn.insertBefore(pluginSettingsIcon, pluginSettingsBtn.firstChild);
        pluginSettingsBtn.addEventListener('click', () => this.openPluginSettings());

        // Control Center button
        const controlCenterBtn = buttonGroup.createEl('button', {
            cls: 'sonic-graph-header-btn sonic-graph-control-center-btn',
            text: 'Control center'
        });
        const controlCenterIcon = createLucideIcon('keyboard-music', 16);
        void controlCenterBtn.insertBefore(controlCenterIcon, controlCenterBtn.firstChild);
        controlCenterBtn.addEventListener('click', () => this.openControlCenter());

        // Export button (secondary)
        const exportBtn = buttonGroup.createEl('button', {
            cls: 'sonic-graph-header-btn sonic-graph-export-btn',
            text: 'Export'
        });
        const exportIcon = createLucideIcon('download', 16);
        void exportBtn.insertBefore(exportIcon, exportBtn.firstChild);
        exportBtn.addEventListener('click', () => this.openExportModal());
    }

    /**
     * Create main content area with graph and settings panel
     */
    private createMainContent(container: HTMLElement): void {
        const mainContent = container.createDiv({ cls: 'sonic-graph-main-content' });

        // Create split container for graph and visual display
        const splitContainer = mainContent.createDiv({ cls: 'sonic-graph-split-container' });

        // Top section: Graph area
        const graphSection = splitContainer.createDiv({ cls: 'sonic-graph-section' });
        this.graphContainer = graphSection.createDiv({ cls: 'sonic-graph-container' });

        // Graph canvas
        const graphCanvas = this.graphContainer.createDiv({ cls: 'sonic-graph-canvas' });
        graphCanvas.id = 'sonic-graph-canvas';

        // Loading indicator
        const loadingIndicator = this.graphContainer.createDiv({ cls: 'sonic-graph-loading' });
        const loadingIcon = createLucideIcon('loader-2', 24);
        void loadingIcon.addClass('sonic-graph-loading-icon');
        void loadingIndicator.appendChild(loadingIcon);
        loadingIndicator.createSpan({ text: 'Loading graph...', cls: 'sonic-graph-loading-text' });

        // Settings panel (right side, initially hidden)
        this.settingsPanel = graphSection.createDiv({ cls: 'sonic-graph-settings-panel hidden' });
        void this.createSettingsContent();

        // Timeline area (between graph and visual display)
        void this.createTimelineArea(splitContainer);

        // Resizable divider
        this.visualDivider = splitContainer.createDiv({ cls: 'sonic-graph-visual-divider' });
        this.visualDivider.createDiv({ cls: 'sonic-graph-visual-divider-handle' });

        // Setup divider drag handlers
        void this.setupDividerDrag();

        // Bottom section: Visual display panel
        this.visualDisplaySection = splitContainer.createDiv({ cls: 'sonic-graph-visual-display-section' });
        // Explicitly set collapsed state based on visibility
        if (!this.isVisualDisplayVisible) {
            this.visualDisplaySection.addClass('collapsed');
            void logger.debug('visual-display', 'Visual display section created as collapsed');
        } else {
            this.visualDisplaySection.removeClass('collapsed');
            void logger.debug('visual-display', 'Visual display section created as expanded');
        }
        // Set height via CSS custom property using DOM API
        (this.visualDisplaySection).style.setProperty('--visual-display-height', `${this.visualDisplayHeight}px`);

        // Visual display header
        const visualHeader = this.visualDisplaySection.createDiv({ cls: 'sonic-graph-visual-display-header' });

        const visualTitle = visualHeader.createDiv({ cls: 'sonic-graph-visual-display-title' });
        visualTitle.createSpan({ text: '📊 visual note display' });

        const visualHeaderControls = visualHeader.createDiv({ cls: 'sonic-graph-visual-display-controls' });

        // Mode tabs
        const modeTabs = visualHeaderControls.createDiv({ cls: 'sonic-graph-visual-mode-tabs' });

        const pianoRollTab = modeTabs.createEl('button', {
            text: 'Piano roll',
            cls: 'sonic-graph-visual-mode-tab active'
        });

        const spectrumTab = modeTabs.createEl('button', {
            text: 'Spectrum',
            cls: 'sonic-graph-visual-mode-tab'
        });

        const staffTab = modeTabs.createEl('button', {
            text: 'Staff',
            cls: 'sonic-graph-visual-mode-tab'
        });

        // Mode switching handlers
        this.registerDomEvent(pianoRollTab, 'click', () => {
            this.switchVisualizationMode('piano-roll', [pianoRollTab, spectrumTab, staffTab]);
        });

        this.registerDomEvent(spectrumTab, 'click', () => {
            this.switchVisualizationMode('spectrum', [pianoRollTab, spectrumTab, staffTab]);
        });

        this.registerDomEvent(staffTab, 'click', () => {
            this.switchVisualizationMode('staff', [pianoRollTab, spectrumTab, staffTab]);
        });

        // Collapse button
        const collapseBtn = visualHeaderControls.createEl('button', {
            text: this.isVisualDisplayVisible ? '▼' : '▲',
            cls: 'sonic-graph-visual-collapse-btn'
        });
        this.registerDomEvent(collapseBtn, 'click', () => this.toggleVisualDisplay(collapseBtn));

        // Visual display content area
        this.visualDisplayContent = this.visualDisplaySection.createDiv({
            cls: 'sonic-graph-visual-display-content'
        });

        // Placeholder content (will be replaced with actual visualization)
        const placeholder = this.visualDisplayContent.createDiv({ cls: 'sonic-graph-visual-placeholder' });
        placeholder.createSpan({ text: 'Visual note display will appear here during playback' });

        // Initialize visualization manager
        void this.initializeVisualizationManager();
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
        this.registerDomEvent(this.timelineScrubber, 'input', () => this.handleTimelineScrub());
        
        // Unified timeline info with single timeline bar
        this.timelineInfo = this.timelineContainer.createDiv({ cls: 'sonic-graph-timeline-info' });
        
        // Single unified timeline track
        const timelineTrack = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-track-unified' });
        timelineTrack.createDiv({ cls: 'sonic-graph-timeline-line-unified' });
        
        // Unified markers container that spans the timeline
        this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-markers' });
        // Markers will be populated dynamically
        
        // Current position indicator (spans both tracks) - hidden by default
        const currentIndicator = this.timelineInfo.createDiv({ cls: 'sonic-graph-timeline-current-indicator' });
        currentIndicator.createEl('div', { cls: 'sonic-graph-timeline-current-line' });
        const currentLabel = currentIndicator.createEl('div', { cls: 'sonic-graph-timeline-current-label' });
        currentLabel.createSpan({ text: 'Current: —', cls: 'sonic-graph-timeline-current-year' });
        currentLabel.createSpan({ text: '0s', cls: 'sonic-graph-timeline-current-time' });
        
        // Hide current indicator by default - only show during animation
        void currentIndicator.addClass('sonigraph-current-indicator');
    }

    /**
     * Create controls area with play button, stats, and navigation
     */
    private createControlsArea(container: HTMLElement): void {
        this.controlsContainer = container.createDiv({ cls: 'sonic-graph-controls' });

        // Single centered stats line
        this.statsContainer = this.controlsContainer.createDiv({ cls: 'sonic-graph-stats' });
        void this.updateStats();
    }

    /**
     * Initialize the graph visualization
     */
    private async initializeGraph(): Promise<void> {
        try {
            void logger.info('sonic-graph-data', 'Starting graph initialization');
            
            // Performance optimization: Show progress and use non-blocking operations
            void this.showProgressIndicator('Extracting graph data...');
            
            // Extract graph data using idle time
            void logger.info('sonic-graph-data', 'Beginning graph data extraction');
            logger.debug('ui', 'GraphDataExtractor configuration:', {
                excludeFolders: this.graphDataExtractor['excludeFolders'],
                excludeFiles: this.graphDataExtractor['excludeFiles']
            });
            
            const graphData = await this.executeWhenIdle(async () => {
                return this.graphDataExtractor.extractGraphData();
            });
            logger.info('sonic-graph-data', `Graph extraction completed: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);
            
            if (graphData.nodes.length === 0) {
                void logger.warn('ui', 'No nodes found in graph data - possibly all files excluded');
                throw new Error('No graph data found. Check your exclusion settings.');
            }
            
            // Initialize adaptive detail manager
            void logger.info('sonic-graph-adaptive', 'Initializing adaptive detail manager');
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
            void logger.info('sonic-graph-clustering', 'Starting temporal clustering detection');
            const detection = this.detectTemporalClustering(graphData.nodes);
            this.detectedSpacing = detection.type;
            logger.info('sonic-graph-clustering', 'Temporal clustering detected', {
                type: detection.type,
                confidence: detection.confidence,
                reason: detection.reason
            });
            
            // Create graph renderer
            void logger.info('sonic-graph-renderer', 'Looking for canvas element');
            const canvasElement = document.getElementById('sonic-graph-canvas');
            if (!canvasElement) {
                void logger.error('sonic-graph-renderer', 'Graph canvas element not found');
                throw new Error('Graph canvas element not found');
            }
            logger.info('sonic-graph-renderer', 'Canvas element found', {
                width: canvasElement.clientWidth,
                height: canvasElement.clientHeight,
                offsetWidth: canvasElement.offsetWidth,
                offsetHeight: canvasElement.offsetHeight
            });
            
            // Performance optimization: Show progress for renderer initialization
            void this.showProgressIndicator('Initializing renderer...');
            
            void logger.info('sonic-graph-renderer', 'Creating GraphRenderer instance');
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
            void logger.info('sonic-graph-renderer', 'GraphRenderer created successfully');
            
            // Set up adaptive detail zoom change callback
            void logger.info('sonic-graph-adaptive', 'Setting up zoom change callback for adaptive detail');
            
            // Set up callback for debounced detail level changes
            this.adaptiveDetailManager.setDetailLevelChangedCallback((filteredData) => {
                void this.applyFilteredData(filteredData);
                logger.debug('sonic-graph-adaptive', 'Detail level changed via callback', {
                    level: filteredData.level,
                    visibleNodes: filteredData.nodes.length,
                    visibleLinks: filteredData.links.length
                });
            });
            
            this.graphRenderer.setOnZoomChangeCallback((zoomLevel: number) => {
                if (this.adaptiveDetailManager) {
                    const filteredData = this.adaptiveDetailManager.handleZoomChange(zoomLevel);
                    void this.applyFilteredData(filteredData);
                    logger.debug('sonic-graph-adaptive', 'Zoom change processed', {
                        zoomLevel,
                        level: filteredData.level,
                        visibleNodes: filteredData.nodes.length,
                        visibleLinks: filteredData.links.length
                    });
                }
            });
            
            // Set up responsive resizing
            void this.setupResizeObserver(canvasElement);
            
            // Phase 3.8: Apply layout settings to renderer
            void this.showProgressIndicator('Applying layout settings...');
            try {
                void logger.info('sonic-graph-layout', 'Getting layout settings');
                const layoutSettings = this.getSonicGraphSettings().layout;
                void logger.info('sonic-graph-layout', 'Applying layout settings to renderer', layoutSettings);
                await this.executeWhenIdle(() => {
                    if (this.graphRenderer) {
                        this.graphRenderer.updateLayoutSettings(layoutSettings);
                        this.graphRenderer.updateContentAwareSettings(this.getSonicGraphSettings().contentAwarePositioning);
                        this.graphRenderer.updateSmartClusteringSettings(this.getSonicGraphSettings().smartClustering);
                    }
                });
                void logger.info('sonic-graph-layout', 'Layout settings applied successfully');
            } catch (layoutError) {
                logger.error('sonic-graph-layout', 'Failed to apply layout settings:', (layoutError as Error).message);
                logger.error('sonic-graph-layout', 'Layout error stack:', (layoutError as Error).stack);
                throw new Error(`Layout configuration failed: ${(layoutError as Error).message}`);
            }
            
            // Apply initial adaptive detail filtering based on initial zoom level
            void logger.info('sonic-graph-adaptive', 'Applying initial adaptive detail filtering');
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
                void logger.info('sonic-graph-render', 'Starting graph render process');
                logger.info('sonic-graph-render', 'Render data summary', {
                    nodeCount: filteredData.nodes.length,
                    linkCount: filteredData.links.length,
                    detailLevel: filteredData.level,
                    sampleNodes: filteredData.nodes.slice(0, 3).map(n => ({ id: n.id, type: n.type })),
                    sampleLinks: filteredData.links.slice(0, 3).map(l => ({ source: l.source, target: l.target, type: l.type }))
                });
                
                this.graphRenderer.render(filteredData.nodes, filteredData.links);
                void logger.info('sonic-graph-render', 'Graph render completed successfully');
                
                // Apply better spacing with delay to avoid blocking UI
                setTimeout(() => {
                    void logger.info('sonic-graph-spacing', 'Applying improved node spacing');
                    this.graphRenderer.applyBetterSpacing();
                    void logger.info('sonic-graph-spacing', 'Improved node spacing applied');
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
            
            // Hide loading indicator - remove all instances to be safe
            const loadingIndicators = this.graphContainer.querySelectorAll('.sonic-graph-loading');
            loadingIndicators.forEach(indicator => indicator.remove());
            
            // Performance optimization: Hide progress indicator
            void this.hideProgressIndicator();
            
            // Update stats
            void this.updateStats();
            
            // Initialize view mode (starts in Static View)
            void this.updateViewMode();

            void logger.debug('ui', 'Sonic Graph initialized successfully');

            // Apply pending state if available (from setState restoration)
            void this.applyPendingState();
            
        } catch (error) {
            logger.error('ui', 'Failed to initialize Sonic Graph:', (error as Error).message);
            logger.error('ui', 'Initialization error stack:', (error as Error).stack);
            
            // Performance optimization: Hide progress indicator on error
            void this.hideProgressIndicator();
            
            // Clear loading indicator - remove all instances to be safe
            const loadingIndicators = this.graphContainer.querySelectorAll('.sonic-graph-loading');
            loadingIndicators.forEach(indicator => indicator.remove());
            
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
            void this.updateViewMode();
        }
        
        this.isAnimating = !this.isAnimating;
        
        if (this.isAnimating) {
            // Check audio engine status and handle instrument changes BEFORE starting animation
            try {
                const status = this.plugin.audioEngine.getStatus();
                
                if (!status.isInitialized) {
                    void logger.info('audio', 'Audio engine not initialized - initializing for animation');
                    await this.plugin.audioEngine.initialize();
                    new Notice('Audio engine initialized');
                } else {
                    // Always reinitialize audio engine to ensure fresh state for animation
                    void logger.info('audio', 'Reinitializing audio engine for animation to ensure fresh state');
                    await this.plugin.audioEngine.initialize();
                    
                    const enabledInstruments = this.getEnabledInstruments();
                    logger.info('audio', 'Audio engine reinitialized for animation', {
                        enabledInstruments: enabledInstruments,
                        enabledCount: enabledInstruments.length,
                        audioContext: this.plugin.audioEngine.getStatus().audioContext
                    });
                    
                    new Notice('Audio engine ready for animation');
                }
                
                void logger.info('audio', 'Audio engine ready for Sonic Graph animation');
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
            this.playButton.setButtonText('Pause animation');
            this.timelineContainer.classList.remove('timeline-hidden');
            this.timelineContainer.classList.add('timeline-visible');
            
            // Show current position indicator during animation
            const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator');
            if (currentIndicator) {
                void currentIndicator.addClass('sonigraph-current-indicator--visible');
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

            // Start visual note display if enabled
            if (this.visualizationManager && this.isVisualDisplayVisible) {
                this.visualizationManager.start(0);
                void logger.debug('visual-display', 'Visualization started');
            }

            void logger.info('ui', 'Starting Sonic Graph temporal animation');
            new Notice('Sonic Graph animation started');

        } else {
            // Pause animation
            this.playButton.setButtonText('Play');

            // Hide current position indicator when animation stops
            const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator');
            if (currentIndicator) {
                void currentIndicator.removeClass('sonigraph-current-indicator--visible');
            }

            if (this.temporalAnimator) {
                this.temporalAnimator.pause();
            }

            // Stop visual note display
            if (this.visualizationManager) {
                this.visualizationManager.stop();
                void logger.debug('visual-display', 'Visualization stopped');
            }
            
            // Stop continuous layers if running
            if (this.continuousLayerManager) {
                void this.continuousLayerManager.stop();
            }
            
            void logger.info('ui', 'Pausing Sonic Graph animation');
            new Notice('Animation paused');
        }
    }

    /**
     * Open export modal
     */
    private async openExportModal(): Promise<void> {
        // Ensure temporal animator is initialized
        if (!this.temporalAnimator) {
            void logger.debug('ui', 'Initializing temporal animator for export');
            try {
                await this.initializeTemporalAnimator();
            } catch (error) {
                void logger.error('Failed to initialize temporal animator for export', error);
                new Notice('Failed to initialize timeline for export. Please try switching to Timeline View first.');
                return;
            }
        }

        if (!this.temporalAnimator) {
            new Notice('Export requires Timeline View to be initialized. Please switch to Timeline View and try again.');
            return;
        }

        const modal = await import('../export/ExportModal').then(m => new m.ExportModal(
            this.app,
            this.plugin,
            this.plugin.audioEngine,
            this.temporalAnimator
        ));
        void modal.open();
        void logger.info('ui', 'Opened export modal');
    }

    /**
     * Toggle between Static View and Timeline View
     */
    private toggleViewMode(): void {
        this.isTimelineView = !this.isTimelineView;
        void this.updateViewMode();
        logger.debug('ui', `View mode toggled: ${this.isTimelineView ? 'Timeline' : 'Static'}`);

        // Request workspace save to persist the view mode change
        void this.requestSave();
    }

    /**
     * Request Obsidian to save the workspace state
     * This ensures view state persistence when important changes occur
     */
    private requestSave(): void {
        // Obsidian will call getState() to capture current state
        this.app.workspace.requestSaveLayout();
        void logger.debug('state', 'Requested workspace save');
    }

    /**
     * Update UI based on current view mode
     */
    private updateViewMode(): void {
        if (this.isTimelineView) {
            // Timeline View - show animation controls, hide all nodes initially

            // Show timeline controls
            this.timelineContainer.classList.remove('timeline-hidden');
            this.timelineContainer.classList.add('timeline-visible');

            // Initialize temporal animator if needed
            if (!this.temporalAnimator) {
                this.initializeTemporalAnimator().catch(error => {
                    void logger.error('Failed to initialize temporal animator for timeline view', error);
                    // Fall back to static view
                    this.isTimelineView = false;
                    void this.updateViewMode();
                });
            } else {
                // Reset to beginning and hide all nodes
                this.temporalAnimator.stop();
                if (this.graphRenderer) {
                    this.graphRenderer.updateVisibleNodes(new Set());
                }
            }

        } else {
            // Static View

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
            const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator');
            if (currentIndicator) {
                void currentIndicator.removeClass('sonigraph-current-indicator--visible');
            }
            
            // Show all nodes
            if (this.graphRenderer) {
                // Get all node IDs to show them all
                void this.graphDataExtractor.extractGraphData().then(graphData => {
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
            void logger.debug('ui', 'Graph view reset');
        }
    }

    /**
     * Open Control Center modal
     */
    private openControlCenter(): void {
        // Note: Views don't need to be closed when opening other UI elements

        // Open Control Center
        void import('./control-panel').then(({ MaterialControlPanelModal }) => {
            const controlCenter = new MaterialControlPanelModal(this.app, this.plugin);
            void controlCenter.open();
        });
    }

    /**
     * Open Plugin Settings
     */
    private openPluginSettings(): void {
        // Note: Views don't need to be closed when opening other UI elements

        // Open Plugin Settings (using extended App interface)
        this.app.setting.open();
        this.app.setting.openTabById(this.plugin.manifest.id);
    }

    /**
     * Create settings panel content
     */
    private createSettingsContent(): void {
        // Settings header
        const settingsHeader = this.settingsPanel.createDiv({ cls: 'sonic-graph-settings-header' });
        settingsHeader.createEl('h3', {
            text: '⚙️ timeline settings',
            cls: 'sonic-graph-settings-title'
        });

        const closeButton = settingsHeader.createEl('button', {
            cls: 'sonic-graph-settings-close'
        });
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => this.toggleSettings());

        // Settings content (scrollable area)
        const settingsContent = this.settingsPanel.createDiv({ cls: 'sonic-graph-settings-content' });

        // Phase 8.1: Simplified settings panel - only essential visualization controls
        // All advanced settings moved to Control Center > Sonic Graph tab

        // Essential visualization controls only
        void this.createFiltersSettings(settingsContent);
        void this.createVisualSettings(settingsContent);
        void this.createLayoutSettings(settingsContent);
        void this.createTimelineSettings(settingsContent);

        // Control Center quick link (at bottom)
        void this.createControlCenterLink(settingsContent);
    }

    /**
     * Phase 8.1: Create Control Center link for advanced settings
     */
    private createControlCenterLink(container: HTMLElement): void {
        const linkSection = container.createDiv({ cls: 'sonic-graph-settings-section control-center-link-section' });

        // Section heading
        linkSection.createEl('div', { text: 'Advanced settings', cls: 'sonic-graph-settings-section-title' });

        // Descriptive paragraph
        const description = linkSection.createEl('p', { cls: 'sonic-graph-settings-description sonic-graph-small-text' });
        description.textContent = 'Audio layers, musical theory, spatial audio, and other advanced features are available in the Control Center for a better experience with organized tabs.';

        // Large button to open Control Center
        const button = linkSection.createEl('button', {
            cls: 'sonic-graph-control-center-button'
        });
        setIcon(button, 'layout-panel-left');
        void button.appendText('Control Center');

        button.addEventListener('click', () => {
            // Close the settings panel
            void this.toggleSettings();
            // Open Control Center
            this.plugin.openControlPanel();
        });
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
        section.createEl('div', { text: 'Adaptive detAIL', cls: 'sonic-graph-settings-section-title' });
        
        // Session override toggle using Obsidian Setting API
        new Setting(section)
            .setName('Disable for this session')
            .setDesc('The adaptive detail system automatically hides nodes and links based on zoom level to improve performance. disable this to see all nodes/links regardless of zoom, but expect slower performance on large graphs.')
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
                    void this.applyFilteredData(filteredData);
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
        statusItem.createEl('div', { 
            text: `${adaptiveSettings.mode} (${adaptiveSettings.enabled ? 'enabled' : 'disabled'})`, 
            cls: 'sonic-graph-setting-status' 
        });
        
        // Add note about main settings
        const noteItem = section.createDiv({ cls: 'sonic-graph-setting-item adaptive-detail-note' });
        noteItem.createEl('div', { 
            text: 'Configure adaptive detail settings in plugin settings > Sonic Graph settings', 
            cls: 'sonic-graph-setting-note sonic-graph-small-text' 
        });
    }

    /**
     * Apply filtered graph data from adaptive detail manager
     */
    private applyFilteredData(filteredData: FilteredGraphData): void {
        if (!this.graphRenderer) {
            void logger.warn('adaptive-detail', 'Cannot apply filtered data: GraphRenderer not initialized');
            return;
        }

        try {
            // Update the graph renderer with filtered nodes and links
            this.graphRenderer.render(filteredData.nodes, filteredData.links);
            
            // Update stats to reflect the filtering
            void this.updateStatsWithFilteredData(filteredData);
            
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
        let adaptiveStatsEl = this.statsContainer.querySelector('.adaptive-detail-stats');
        if (!adaptiveStatsEl) {
            adaptiveStatsEl = this.statsContainer.createDiv({ cls: 'adaptive-detail-stats' });
        }

        // Update the adaptive detail stats
        const { stats } = filteredData;
        const nodeReduction = ((stats.totalNodes - stats.visibleNodes) / stats.totalNodes * 100).toFixed(0);
        const linkReduction = ((stats.totalLinks - stats.visibleLinks) / stats.totalLinks * 100).toFixed(0);

        void adaptiveStatsEl.empty();
        adaptiveStatsEl.createDiv({
            cls: 'adaptive-detail-level sonic-graph-small-text',
            text: `Detail: ${filteredData.level}`
        });
        adaptiveStatsEl.createDiv({
            cls: 'adaptive-detail-nodes sonic-graph-small-text',
            text: `Nodes: ${stats.visibleNodes}/${stats.totalNodes} (-${nodeReduction}%)`
        });
        adaptiveStatsEl.createDiv({
            cls: 'adaptive-detail-links sonic-graph-small-text',
            text: `Links: ${stats.visibleLinks}/${stats.totalLinks} (-${linkReduction}%)`
        });
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
        section.createEl('div', { text: 'Content-aware positioning', cls: 'sonic-graph-settings-section-title' });
        
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
            void this.applyContentAwareWeightPreview('tagInfluence', weight);
            
            // Save settings with debounce
            void this.updateTagInfluenceWeight(weight);
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
                void this.applyContentAwareWeightPreview('temporalPositioning', weight);
                
                // Save settings with debounce
                void this.updateTemporalPositioningWeight(weight);
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
                void this.applyContentAwareWeightPreview('hubCentrality', weight);
                
                // Save settings with debounce
                void this.updateHubCentralityWeight(weight);
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
            void debugSwitch.addClass('active');
        }
        debugSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });

        // Add tooltip to debug visualization toggle
        setTooltip(debugSwitch, 'Shows visual debugging overlays: temporal zones (green/blue/gray circles), tag connections (orange dashed lines), and hub indicators (red circles). Useful for understanding how content-aware forces affect node positioning.', {
            placement: 'left'
        });
        
        debugSwitch.addEventListener('click', () => {
            const isActive = debugSwitch.hasClass('active');
            void debugSwitch.toggleClass('active', !isActive);
            
            // Real-time preview: Apply immediately to graph
            void this.applyContentAwareDebugPreview(!isActive);
            
            // Save settings with debounce
            void this.updateDebugVisualization(!isActive);
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
        section.createEl('div', { text: 'Smart clustering', cls: 'sonic-graph-settings-section-title' });
        
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
            void this.updateClusteringAlgorithm(algorithm);
        });
        
        // Multi-Factor Weights Section
        const weightsHeader = section.createDiv({ cls: 'sonic-graph-weights-header' });
        weightsHeader.createEl('h4', { text: 'Multi-factor weights', cls: 'sonic-graph-weights-title' });
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
        parametersHeader.createEl('h4', { text: 'Clustering parameters', cls: 'sonic-graph-parameters-title' });
        
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
            void this.updateClusteringParameter('minClusterSize', minSize);
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
            void this.updateClusteringParameter('maxClusters', maxClusters);
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
            .setDesc('Display auto-generated names for each cluster. labels help identify the content theme of each group, such as "projects", "daily notes", or topic-based clusters.')
            .addToggle(toggle => toggle
                .setValue(settings.visualization.showClusterLabels)
                .onChange((value) => {
                    void this.updateClusteringVisualization('showClusterLabels', value);
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
            void this.updateClusteringVisualization('clusterBoundaries', style);
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
                void this.updateClusteringDebugging('showStatistics', !isActive);
            });
        }
    }

    /**
     * Create connection type audio differentiation settings section (Phase 4.4)
     */
    private createConnectionTypeMappingSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'sonic-graph-settings-section connection-type-mapping-section' });

        // Create collapsible header
        const header = section.createDiv({ cls: 'sonic-graph-collapsible-header' });

        header.createEl('div', {
            text: 'Connection type audio differentiation (phase 4.4)',
            cls: 'sonic-graph-settings-section-title'
        });

        const toggleIcon = header.createEl('span', {
            text: '▶', // Start collapsed by default
            cls: 'sonic-graph-collapsible-toggle'
        });

        // Create collapsible content container (collapsed by default)
        const content = section.createDiv({
            cls: 'sonic-graph-collapsible-content is-collapsed'
        });

        // Make header clickable to toggle content
        header.addEventListener('click', () => {
            const isExpanded = content.hasClass('is-expanded');
            if (isExpanded) {
                void content.removeClass('is-expanded');
                void content.addClass('is-collapsed');
                toggleIcon.textContent = '▶';
            } else {
                void content.removeClass('is-collapsed');
                void content.addClass('is-expanded');
                toggleIcon.textContent = '▼';
            }
        });

        // Get connection type mapping settings (will use defaults from constants.ts if not set)
        const settings = this.getSonicGraphSettings().connectionTypeMapping;

        // Main enable toggle (inside the collapsible content)
        new Setting(content)
            .setName('Enable connection type audio differentiation')
            .setDesc('Map different types of connections (wikilinks, embeds, etc.) to distinct audio characteristics')
            .addToggle(toggle => toggle
                .setValue(settings.enabled || false)
                .onChange(async (value) => {
                    try {
                        const currentSettings = this.getSonicGraphSettings();
                        if (!currentSettings.connectionTypeMapping) {
                            // Initialize with the default config from constants if it doesn't exist
                            const { DEFAULT_SETTINGS } = await import('../utils/constants');
                            currentSettings.connectionTypeMapping = {
                                ...DEFAULT_SETTINGS.sonicGraphSettings.connectionTypeMapping,
                                enabled: value
                            };
                        } else {
                            currentSettings.connectionTypeMapping.enabled = value;
                        }
                        await this.plugin.saveSettings();

                        logger.info('connection-type-mapping', 'Connection type mapping toggled', {
                            enabled: value
                        });
                    } catch (error) {
                        void logger.error('connection-type-mapping', 'Failed to toggle connection type mapping', error);
                    }
                })
            );

        // Independence toggle
        new Setting(content)
            .setName('Independent from content-aware mapping')
            .setDesc('Operate independently of phase 4.1 content-aware mapping system')
            .addToggle(toggle => toggle
                .setValue(settings.independentFromContentAware)
                .onChange(value => {
                    this.updateConnectionTypeMappingConfig('independentFromContentAware', value);
                })
            );

        // Global volume mix
        new Setting(content)
            .setName('Connection volume mix')
            .setDesc('Overall volume level for connection audio')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(settings.globalSettings.connectionVolumeMix * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    this.updateConnectionTypeMappingGlobalSetting('connectionVolumeMix', value / 100);
                })
            );

        // Max simultaneous connections
        new Setting(content)
            .setName('Maximum simultaneous connections')
            .setDesc('Limit concurrent connection sounds for performance')
            .addSlider(slider => slider
                .setLimits(5, 50, 1)
                .setValue(settings.globalSettings.maxSimultaneousConnections)
                .setDynamicTooltip()
                .onChange(value => {
                    this.updateConnectionTypeMappingGlobalSetting('maxSimultaneousConnections', value);
                })
            );

        // Connection type toggles
        const connectionTypesSection = content.createDiv({ cls: 'connection-types-toggles' });
        connectionTypesSection.createEl('h5', { text: 'Connection types', cls: 'connection-type-subsection-title' });

        // Wikilinks
        new Setting(connectionTypesSection)
            .setName('Wikilinks ([[internal links]])')
            .setDesc(`${settings.mappings.wikilink.instrumentFamily} family - ${settings.mappings.wikilink.enabled ? 'ENABLED' : 'DISABLED'}`)
            .addToggle(toggle => toggle
                .setValue(settings.mappings.wikilink.enabled)
                .onChange(value => {
                    this.updateConnectionTypeMapping('wikilink', 'enabled', value);
                })
            );

        // Embeds
        new Setting(connectionTypesSection)
            .setName('Embeds (![[embedded content]])')
            .setDesc(`${settings.mappings.embed.instrumentFamily} family - ${settings.mappings.embed.enabled ? 'ENABLED' : 'DISABLED'}`)
            .addToggle(toggle => toggle
                .setValue(settings.mappings.embed.enabled)
                .onChange(value => {
                    this.updateConnectionTypeMapping('embed', 'enabled', value);
                })
            );

        // Markdown links (if enabled)
        if (settings.mappings.markdown) {
            new Setting(connectionTypesSection)
                .setName('Markdown links ([link](path))')
                .setDesc(`${settings.mappings.markdown.instrumentFamily} family - ${settings.mappings.markdown.enabled ? 'ENABLED' : 'DISABLED'}`)
                .addToggle(toggle => toggle
                    .setValue(settings.mappings.markdown.enabled)
                    .onChange(value => {
                        this.updateConnectionTypeMapping('markdown', 'enabled', value);
                    })
                );
        }

        // Tag connections (if enabled)
        if (settings.mappings.tag) {
            new Setting(connectionTypesSection)
                .setName('Tag connections (shared tags)')
                .setDesc(`${settings.mappings.tag.instrumentFamily} family - ${settings.mappings.tag.enabled ? 'ENABLED' : 'DISABLED'}`)
                .addToggle(toggle => toggle
                    .setValue(settings.mappings.tag.enabled)
                    .onChange(value => {
                        this.updateConnectionTypeMapping('tag', 'enabled', value);
                    })
                );
        }

        // Performance settings
        const performanceSection = section.createDiv({ cls: 'connection-type-performance' });
        performanceSection.createEl('h5', { text: 'Performance', cls: 'connection-type-subsection-title' });

        new Setting(performanceSection)
            .setName('Enable caching')
            .setDesc('Cache connection analysis results for better performance')
            .addToggle(toggle => toggle
                .setValue(settings.globalSettings.enableCaching)
                .onChange(value => {
                    this.updateConnectionTypeMappingGlobalSetting('enableCaching', value);
                })
            );

        new Setting(performanceSection)
            .setName('Selective processing')
            .setDesc('Only process visible connections to improve performance')
            .addToggle(toggle => toggle
                .setValue(settings.globalSettings.selectiveProcessing)
                .onChange(value => {
                    this.updateConnectionTypeMappingGlobalSetting('selectiveProcessing', value);
                })
            );

        // Note about full configuration
        const noteSection = section.createDiv({ cls: 'connection-type-note' });
        noteSection.createEl('div', {
            text: 'For detailed connection type configuration, audio characteristics, and preset management, use the plugin settings > Sonic Graph settings panel.',
            cls: 'sonic-graph-setting-note sonic-graph-small-text'
        });
    }

    /**
     * Update connection type mapping configuration
     */
    private updateConnectionTypeMappingConfig(key: string, value: unknown): void {
        const settings = this.getSonicGraphSettings();
        if (!settings.connectionTypeMapping) return;

        // Dynamic property access for settings updates
        (settings.connectionTypeMapping as DynamicSettings)[key] = value;

        // Save to plugin settings
        this.plugin.settings.sonicGraphSettings = settings;
        void this.plugin.saveSettings();

        logger.debug('connection-type-mapping', `Updated config: ${key} = ${String(value)}`);
    }

    /**
     * Update connection type mapping global setting
     */
    private updateConnectionTypeMappingGlobalSetting(key: string, value: unknown): void {
        const settings = this.getSonicGraphSettings();
        if (!settings.connectionTypeMapping?.globalSettings) return;

        // Dynamic property access for settings updates
        (settings.connectionTypeMapping.globalSettings as DynamicSettings)[key] = value;

        // Save to plugin settings
        this.plugin.settings.sonicGraphSettings = settings;
        void this.plugin.saveSettings();

        logger.debug('connection-type-mapping', `Updated global setting: ${key} = ${String(value)}`);
    }

    /**
     * Update specific connection type mapping
     */
    private updateConnectionTypeMapping(connectionType: string, key: string, value: unknown): void {
        const settings = this.getSonicGraphSettings();
        if (!settings.connectionTypeMapping?.mappings) return;

        const mapping = (settings.connectionTypeMapping.mappings as DynamicSettings)[connectionType] as DynamicSettings;
        if (!mapping) return;

        mapping[key] = value;

        // Save to plugin settings
        this.plugin.settings.sonicGraphSettings = settings;
        void this.plugin.saveSettings();

        logger.debug('connection-type-mapping', `Updated ${connectionType} mapping: ${key} = ${String(value)}`);
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
            void this.updateAudioDensity(density);
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
            void this.updateAnimationDuration(duration);
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
            void toggleSwitch.addClass('active');
        }
        toggleSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        toggleSwitch.addEventListener('click', () => {
            const isActive = toggleSwitch.hasClass('active');
            void toggleSwitch.toggleClass('active', !isActive);
            void this.updateLoopAnimation(!isActive);
        });

        // Add tooltip to loop animation toggle
        setTooltip(toggleSwitch, 'When enabled, the timeline animation automatically restarts from the beginning when it completes. Useful for continuous visualization during presentations.', {
            placement: 'left'
        });

        // Time Window Setting
        const timeWindowItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        timeWindowItem.createDiv({ cls: 'sonic-graph-setting-label', text: 'Time window' });
        timeWindowItem.createDiv({ 
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
            void this.updateTimeWindow(timeWindowSelect.value as 'all-time' | 'past-year' | 'past-month' | 'past-week' | 'past-day' | 'past-hour');
        });

        // Add tooltip to time window select
        setTooltip(timeWindowSelect, 'Filter which files appear in the timeline. "All time" shows your complete file history (default). Past options filter to recent files only for focused analysis.', {
            placement: 'top'
        });

        // Timeline Granularity Setting
        const granularityItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        granularityItem.createDiv({ cls: 'sonic-graph-setting-label', text: 'Timeline granularity' });
        granularityItem.createDiv({ 
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
            { value: 'custom', text: 'Custom range' }
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
            void this.updateTimelineGranularity(granularitySelect.value as 'year' | 'month' | 'week' | 'day' | 'hour' | 'custom');
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
        customRangeItem.createDiv({ 
            cls: 'sonic-graph-setting-label', 
            text: 'Custom range' 
        });
        customRangeItem.createDiv({ 
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
            this.updateCustomRange(parseInt(customValueInput.value) || 1, customUnitSelect.value as 'years' | 'months' | 'weeks' | 'days' | 'hours');
        });

        customUnitSelect.addEventListener('change', () => {
            this.updateCustomRange(parseInt(customValueInput.value) || 1, customUnitSelect.value as 'years' | 'months' | 'weeks' | 'days' | 'hours');
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
        spreadingItem.createDiv({ cls: 'sonic-graph-setting-label', text: 'Event spreading' });
        spreadingItem.createDiv({ 
            cls: 'sonic-graph-setting-description', 
            text: 'How to handle clustered events to prevent audio crackling'
        });

        const spreadingControl = spreadingItem.createDiv({ cls: 'sonic-graph-setting-control' });
        const spreadingSelect = spreadingControl.createEl('select', {
            cls: 'sonic-graph-select'
        });

        const spreadingModes = [
            { value: 'none', text: 'None - no spreading', desc: 'Events play exactly when files were created. May cause audio crackling if many files were created simultaneously.' },
            { value: 'gentle', text: 'Gentle - light spreading', desc: 'Slightly separates clustered events over a small time window. Recommended for most users.' },
            { value: 'aggressive', text: 'Aggressive - strong spreading', desc: 'Spreads clustered events over a larger time window. Use when experiencing audio crackling with many simultaneous file creations.' }
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
            void this.updateEventSpreadingMode(spreadingSelect.value as 'none' | 'gentle' | 'aggressive');
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
            void this.updateNoteDuration(value);
        });

        // Phase 1.3: Audio Enhancement Settings
        void this.createAudioEnhancementSettings(section);

        // Phase 5.1: Cluster Audio Settings
        void this.createClusterAudioSettings(section);

        // Phase 5.2: Hub Orchestration Settings
        void this.createHubOrchestrationSettings(section);

        // Phase 5.3: Community Detection Audio Settings
        void this.createCommunityDetectionSettings(section);

        // Phase 5.3: Community Evolution Audio Settings
        void this.createCommunityEvolutionSettings(section);

        // Phase 6.1: Musical Theory Settings
        void this.createMusicalTheorySettings(section);

        // Phase 6.2: Dynamic Orchestration Settings
        void this.createDynamicOrchestrationSettings(section);

        // Phase 6.3: Spatial Audio and Panning Settings
        void this.createSpatialAudioSettings(section);
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
            text: 'Audio enhancement (phase 1 & 2)', 
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
        void this.createContinuousLayersSettings(container);
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
            text: 'Continuous audio layers (phase 3)', 
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
                    void this.refreshContinuousLayerSettings();
                })
            );

        // Only show additional controls if continuous layers are enabled
        if (this.plugin.settings.audioEnhancement?.continuousLayers?.enabled) {
            void this.createContinuousLayerControls(container);
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
            text: 'Continuous layers target <5% additional cpu usage and work alongside existing node-based audio', 
            cls: 'sonic-graph-setting-description sonic-graph-info' 
        });
    }

    /**
     * Phase 5: Create cluster audio settings section
     */
    private createClusterAudioSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });

        // Cluster Audio Header
        const clusterHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        clusterHeader.createEl('label', {
            text: 'Smart clustering audio (phase 5)',
            cls: 'sonic-graph-setting-label sonic-graph-setting-header'
        });
        clusterHeader.createEl('div', {
            text: 'Generate unique audio themes for different cluster types with dynamic transitions',
            cls: 'sonic-graph-setting-description'
        });

        // Main Cluster Audio Toggle
        new Setting(container)
            .setName('Enable cluster audio')
            .setDesc('Generate unique sonic characteristics for tag-based, temporal, link-dense, and community clusters')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.clusterAudio?.enabled || false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.clusterAudio) {
                        this.plugin.settings.clusterAudio = {
                            enabled: false,
                            globalVolume: 0.3,
                            clusterTypeEnabled: {
                                'tag-based': true,
                                'folder-based': true,
                                'link-dense': true,
                                'temporal': true,
                                'community': true
                            },
                            clusterTypeVolumes: {
                                'tag-based': 0.6,
                                'folder-based': 0.7,
                                'link-dense': 0.5,
                                'temporal': 0.6,
                                'community': 0.8
                            },
                            transitionsEnabled: true,
                            transitionVolume: 0.4,
                            transitionSpeed: 1.0,
                            realTimeUpdates: true,
                            strengthModulation: true,
                            strengthSensitivity: 1.0,
                            spatialAudio: true,
                            maxSimultaneousClusters: 5,
                            updateThrottleMs: 200
                        };
                    }
                    this.plugin.settings.clusterAudio.enabled = value;
                    await this.plugin.saveSettings();
                    void this.refreshClusterAudioSettings();
                })
            );

        // Show additional settings only when cluster audio is enabled
        if (this.plugin.settings.clusterAudio?.enabled) {
            void this.createClusterAudioDetailSettings(container);
        }
    }

    /**
     * Phase 5: Create detailed cluster audio settings
     */
    private createClusterAudioDetailSettings(container: HTMLElement): void {
        const settings = this.plugin.settings.clusterAudio;

        // Global Volume Slider
        new Setting(container)
            .setName('Global cluster volume')
            .setDesc('Master volume for all cluster audio themes')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(settings.globalVolume)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.globalVolume = value;
                    await this.plugin.saveSettings();
                })
            );

        // Cluster Type Toggles and Volume Controls
        const clusterTypesHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        clusterTypesHeader.createEl('h4', {
            text: 'Cluster type audio themes',
            cls: 'sonic-graph-setting-label'
        });
        clusterTypesHeader.createEl('div', {
            text: 'Configure unique audio characteristics for each cluster type',
            cls: 'sonic-graph-setting-description'
        });

        // Tag-based clusters (Green theme - Harmonious chords)
        this.createClusterTypeSettings(container, 'tag-based', 'Tag-based Clusters',
            'Harmonious chords representing semantic tag relationships (Green theme)', settings);

        // Folder-based clusters (Blue theme - Architectural sounds)
        this.createClusterTypeSettings(container, 'folder-based', 'Folder-based Clusters',
            'Structured tones reflecting organizational hierarchy (Blue theme)', settings);

        // Link-dense clusters (Pink theme - Dense harmonies)
        this.createClusterTypeSettings(container, 'link-dense', 'Link-dense Clusters',
            'Dense, complex harmonies for highly connected nodes (Pink theme)', settings);

        // Temporal clusters (Yellow theme - Rhythmic patterns)
        this.createClusterTypeSettings(container, 'temporal', 'Temporal Clusters',
            'Rhythmic patterns reflecting time-based relationships (Yellow theme)', settings);

        // Community clusters (Purple theme - Orchestral sections)
        this.createClusterTypeSettings(container, 'community', 'Community Clusters',
            'Rich orchestral harmonies representing community structures (Purple theme)', settings);

        // Transition Settings
        const transitionHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        transitionHeader.createEl('h4', {
            text: 'Cluster transition audio',
            cls: 'sonic-graph-setting-label'
        });
        transitionHeader.createEl('div', {
            text: 'Audio effects when nodes join, leave, or clusters form/dissolve',
            cls: 'sonic-graph-setting-description'
        });

        // Transitions Toggle
        new Setting(container)
            .setName('Enable transitions')
            .setDesc('Play audio effects during cluster changes (join, leave, formation, dissolution)')
            .addToggle(toggle => toggle
                .setValue(settings.transitionsEnabled)
                .onChange(async (value) => {
                    settings.transitionsEnabled = value;
                    await this.plugin.saveSettings();
                })
            );

        if (settings.transitionsEnabled) {
            // Transition Volume
            new Setting(container)
                .setName('Transition volume')
                .setDesc('Volume level for cluster transition effects')
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(settings.transitionVolume)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.transitionVolume = value;
                        await this.plugin.saveSettings();
                    })
                );

            // Transition Speed
            new Setting(container)
                .setName('Transition speed')
                .setDesc('Speed of cluster transition effects (higher = faster)')
                .addSlider(slider => slider
                    .setLimits(0.1, 5.0, 0.1)
                    .setValue(settings.transitionSpeed)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.transitionSpeed = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        // Advanced Settings
        const advancedHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        advancedHeader.createEl('h4', {
            text: 'Advanced settings',
            cls: 'sonic-graph-setting-label'
        });

        // Real-time Updates
        new Setting(container)
            .setName('Real-time updates')
            .setDesc('Update cluster audio immediately as clusters change during animation')
            .addToggle(toggle => toggle
                .setValue(settings.realTimeUpdates)
                .onChange(async (value) => {
                    settings.realTimeUpdates = value;
                    await this.plugin.saveSettings();
                })
            );

        // Strength Modulation
        new Setting(container)
            .setName('Strength modulation')
            .setDesc('Modulate audio based on cluster strength (cohesion)')
            .addToggle(toggle => toggle
                .setValue(settings.strengthModulation)
                .onChange(async (value) => {
                    settings.strengthModulation = value;
                    await this.plugin.saveSettings();
                })
            );

        if (settings.strengthModulation) {
            // Strength Sensitivity
            new Setting(container)
                .setName('Strength sensitivity')
                .setDesc('How responsive cluster audio is to strength changes')
                .addSlider(slider => slider
                    .setLimits(0.1, 2.0, 0.1)
                    .setValue(settings.strengthSensitivity)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.strengthSensitivity = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        // Spatial Audio
        new Setting(container)
            .setName('Spatial audio')
            .setDesc('Use cluster positions for stereo panning')
            .addToggle(toggle => toggle
                .setValue(settings.spatialAudio)
                .onChange(async (value) => {
                    settings.spatialAudio = value;
                    await this.plugin.saveSettings();
                })
            );

        // Performance Settings
        const performanceHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        performanceHeader.createEl('h4', {
            text: 'Performance settings',
            cls: 'sonic-graph-setting-label'
        });

        // Max Simultaneous Clusters
        new Setting(container)
            .setName('Max simultaneous clusters')
            .setDesc('Limit concurrent cluster audio for performance')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(settings.maxSimultaneousClusters)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.maxSimultaneousClusters = value;
                    await this.plugin.saveSettings();
                })
            );

        // Update Throttle
        new Setting(container)
            .setName('Update throttle (ms)')
            .setDesc('Throttle cluster updates to prevent audio crackling')
            .addSlider(slider => slider
                .setLimits(50, 1000, 50)
                .setValue(settings.updateThrottleMs)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.updateThrottleMs = value;
                    await this.plugin.saveSettings();
                })
            );

        // Performance note
        const performanceNote = container.createDiv({ cls: 'sonic-graph-setting-item' });
        performanceNote.createEl('div', {
            text: 'Cluster audio uses efficient synthesis and automatic voice management to minimize performance impact',
            cls: 'sonic-graph-setting-description sonic-graph-info'
        });
    }

    /**
     * Phase 5.2: Create hub orchestration settings section
     */
    private createHubOrchestrationSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });

        // Hub Orchestration Header
        const headerContainer = container.createDiv({ cls: 'sonic-graph-setting-item' });
        headerContainer.createEl('h3', {
            text: 'Phase 5.2: hub node orchestration',
            cls: 'sonic-graph-section-header'
        });
        headerContainer.createEl('div', {
            text: 'Hub nodes act as "conductors" to drive orchestration decisions based on centrality metrics',
            cls: 'sonic-graph-setting-description'
        });

        // Enable Hub Orchestration Toggle
        const enabledItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        enabledItem.createEl('label', {
            text: 'Enable hub orchestration',
            cls: 'sonic-graph-setting-label'
        });
        enabledItem.createEl('div', {
            text: 'Hub nodes with high centrality get prominent lead instruments while peripheral nodes provide accompaniment',
            cls: 'sonic-graph-setting-description'
        });

        const enabledToggle = enabledItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        enabledToggle.checked = this.plugin.settings.hubOrchestration?.enabled || false;
        enabledToggle.addEventListener('change', () => {
            void (async () => {
                if (!this.plugin.settings.hubOrchestration) {
                    this.plugin.settings.hubOrchestration = {
                        enabled: enabledToggle.checked,
                        hubThreshold: 0.6,
                        prominenceMultiplier: 2.0,
                        orchestrationMode: 'balanced',
                        transitionsEnabled: true,
                        centralityWeights: {
                            degree: 0.3,
                            betweenness: 0.3,
                            eigenvector: 0.2,
                            pageRank: 0.2
                        },
                        hubInstrumentPreference: ['piano', 'trumpet', 'violin', 'lead-synth']
                    };
                } else {
                    this.plugin.settings.hubOrchestration.enabled = enabledToggle.checked;
                }
                await this.plugin.saveSettings();
                void this.refreshHubOrchestrationSettings();
            })();
        });

        // Show detailed settings if enabled
        if (this.plugin.settings.hubOrchestration?.enabled) {
            void this.createHubOrchestrationDetailSettings(container);
        }
    }

    /**
     * Phase 5.2: Create detailed hub orchestration settings
     */
    private createHubOrchestrationDetailSettings(container: HTMLElement): void {
        const settings = this.plugin.settings.hubOrchestration;

        // Orchestration Mode Dropdown
        const modeItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        modeItem.createEl('label', {
            text: 'Orchestration mode',
            cls: 'sonic-graph-setting-label'
        });
        modeItem.createEl('div', {
            text: 'Controls how hub prominence affects audio mixing',
            cls: 'sonic-graph-setting-description'
        });

        const modeSelect = modeItem.createEl('select', {
            cls: 'sonic-graph-select'
        });
        ['hub-led', 'democratic', 'balanced'].forEach(mode => {
            const option = modeSelect.createEl('option', {
                text: mode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                value: mode
            });
            if (mode === settings.orchestrationMode) {
                option.selected = true;
            }
        });
        modeSelect.addEventListener('change', () => {
            void (async () => {
                settings.orchestrationMode = modeSelect.value as 'hub-led' | 'democratic' | 'balanced';
                await this.plugin.saveSettings();
            })();
        });

        // Hub Threshold Slider
        const thresholdItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        thresholdItem.createEl('label', {
            text: 'Hub threshold',
            cls: 'sonic-graph-setting-label'
        });
        thresholdItem.createEl('div', {
            text: 'Minimum centrality score for a node to be considered a hub',
            cls: 'sonic-graph-setting-description'
        });

        const thresholdContainer = thresholdItem.createDiv({ cls: 'sonic-graph-slider-container' });
        const thresholdSlider = thresholdContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider'
        });
        thresholdSlider.min = '0.4';
        thresholdSlider.max = '0.9';
        thresholdSlider.step = '0.05';
        thresholdSlider.value = settings.hubThreshold.toString();

        const thresholdValue = thresholdContainer.createEl('span', {
            text: `${(settings.hubThreshold * 100).toFixed(0)}%`,
            cls: 'sonic-graph-slider-value'
        });

        thresholdSlider.addEventListener('input', () => {
            void (async () => {
                const value = parseFloat(thresholdSlider.value);
                thresholdValue.textContent = `${(value * 100).toFixed(0)}%`;
                settings.hubThreshold = value;
                await this.plugin.saveSettings();
            })();
        });

        // Prominence Multiplier Slider
        const prominenceItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        prominenceItem.createEl('label', {
            text: 'Hub prominence',
            cls: 'sonic-graph-setting-label'
        });
        prominenceItem.createEl('div', {
            text: 'How much louder hubs are compared to peripheral nodes',
            cls: 'sonic-graph-setting-description'
        });

        const prominenceContainer = prominenceItem.createDiv({ cls: 'sonic-graph-slider-container' });
        const prominenceSlider = prominenceContainer.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider'
        });
        prominenceSlider.min = '1.0';
        prominenceSlider.max = '5.0';
        prominenceSlider.step = '0.5';
        prominenceSlider.value = settings.prominenceMultiplier.toString();

        const prominenceValue = prominenceContainer.createEl('span', {
            text: `${settings.prominenceMultiplier.toFixed(1)}x`,
            cls: 'sonic-graph-slider-value'
        });

        prominenceSlider.addEventListener('input', () => {
            void (async () => {
                const value = parseFloat(prominenceSlider.value);
                prominenceValue.textContent = `${value.toFixed(1)}x`;
                settings.prominenceMultiplier = value;
                await this.plugin.saveSettings();
            })();
        });

        // Centrality Weights Header
        const weightsHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        weightsHeader.createEl('h4', {
            text: 'Centrality algorithm weights',
            cls: 'sonic-graph-subsection-header'
        });
        weightsHeader.createEl('div', {
            text: 'Adjust how different centrality metrics contribute to hub scoring',
            cls: 'sonic-graph-setting-description'
        });

        // Degree Centrality Weight
        this.createWeightSlider(container, 'Degree Centrality',
            'Based on direct connection count',
            settings.centralityWeights.degree, 0, 1, 0.05,
            (value) => {
                void (async () => {
                    settings.centralityWeights.degree = value;
                    await this.plugin.saveSettings();
                })();
            }
        );

        // Betweenness Centrality Weight
        this.createWeightSlider(container, 'Betweenness Centrality',
            'Based on how often node appears on shortest paths',
            settings.centralityWeights.betweenness, 0, 1, 0.05,
            (value) => {
                void (async () => {
                    settings.centralityWeights.betweenness = value;
                    await this.plugin.saveSettings();
                })();
            }
        );

        // Eigenvector Centrality Weight
        this.createWeightSlider(container, 'Eigenvector Centrality',
            'Based on connections to well-connected nodes',
            settings.centralityWeights.eigenvector, 0, 1, 0.05,
            (value) => {
                void (async () => {
                    settings.centralityWeights.eigenvector = value;
                    await this.plugin.saveSettings();
                })();
            }
        );

        // PageRank Weight
        this.createWeightSlider(container, 'PageRank',
            'Based on Google\'s authority algorithm',
            settings.centralityWeights.pageRank, 0, 1, 0.05,
            (value) => {
                void (async () => {
                    settings.centralityWeights.pageRank = value;
                    await this.plugin.saveSettings();
                })();
            }
        );

        // Hub Transitions Toggle
        const transitionsItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        transitionsItem.createEl('label', {
            text: 'Hub transition audio',
            cls: 'sonic-graph-setting-label'
        });
        transitionsItem.createEl('div', {
            text: 'Play audio effects when nodes become or lose hub status',
            cls: 'sonic-graph-setting-description'
        });

        const transitionsToggle = transitionsItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        transitionsToggle.checked = settings.transitionsEnabled;
        transitionsToggle.addEventListener('change', () => {
            void (async () => {
                settings.transitionsEnabled = transitionsToggle.checked;
                await this.plugin.saveSettings();
            })();
        });

        // Performance note
        const performanceNote = container.createDiv({ cls: 'sonic-graph-setting-item' });
        performanceNote.createEl('div', {
            text: 'Hub orchestration uses efficient centrality caching and audio pooling for optimal performance',
            cls: 'sonic-graph-setting-description sonic-graph-info'
        });
    }

    /**
     * Phase 5.2: Refresh hub orchestration settings when enabled/disabled
     */
    private refreshHubOrchestrationSettings(): void {
        // Find the settings panel and recreate the audio section
        const settingsContent = this.settingsPanel?.querySelector('.sonic-graph-settings-content');
        if (!settingsContent) {
            return;
        }

        // Find and remove existing audio sections
        const sections = settingsContent.querySelectorAll('.sonic-graph-setting-item, .sonic-graph-settings-divider');
        let removeNext = false;
        for (const section of Array.from(sections)) {
            if (section.textContent?.includes('Phase 5.2: Hub Node Orchestration')) {
                removeNext = true;
            }
            if (removeNext) {
                void section.remove();
                if (section.textContent?.includes('Phase 5.3: Community Detection')) {
                    break;
                }
            }
        }

        // Recreate hub orchestration section
        void this.createHubOrchestrationSettings(settingsContent as HTMLElement);
    }

    /**
     * Phase 5.3: Create community detection audio settings section
     */
    private createCommunityDetectionSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });

        // Community Detection Header
        const communityHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        communityHeader.createEl('label', {
            text: 'Community detection audio (phase 5.3)',
            cls: 'sonic-graph-setting-label sonic-graph-setting-header'
        });
        communityHeader.createEl('div', {
            text: 'Generate distinct audio themes for detected community structures with evolution tracking',
            cls: 'sonic-graph-setting-description'
        });

        // Main Community Detection Toggle
        new Setting(container)
            .setName('Enable community detection audio')
            .setDesc('Generate audio themes for large stable, small dynamic, bridge, isolated, and hierarchical communities')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.communityDetection?.enabled || false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.communityDetection) {
                        this.plugin.settings.communityDetection = {
                            enabled: false,
                            largeCommunitySizeThreshold: 15,
                            hierarchyAnalysis: true,
                            hierarchyContainmentThreshold: 0.7,
                            themeIntensity: 1.0,
                            communityTypeEnabled: {
                                'large-stable': true,
                                'small-dynamic': true,
                                'bridge': true,
                                'isolated': true,
                                'hierarchical': true
                            },
                            communityTypeVolumes: {
                                'large-stable': 0.8,
                                'small-dynamic': 0.6,
                                'bridge': 0.7,
                                'isolated': 0.5,
                                'hierarchical': 0.75
                            },
                            spatialAudio: true,
                            spatialWidth: 0.8
                        };
                    }
                    this.plugin.settings.communityDetection.enabled = value;
                    await this.plugin.saveSettings();
                    void this.refreshCommunityDetectionSettings();
                })
            );

        // Show additional settings only when community detection is enabled
        if (this.plugin.settings.communityDetection?.enabled) {
            void this.createCommunityDetectionDetailSettings(container);
        }
    }

    /**
     * Phase 5.3: Create detailed community detection audio settings
     */
    private createCommunityDetectionDetailSettings(container: HTMLElement): void {
        const settings = this.plugin.settings.communityDetection;

        // Theme Intensity Slider
        new Setting(container)
            .setName('Theme intensity')
            .setDesc('Overall intensity of community audio themes')
            .addSlider(slider => slider
                .setLimits(0, 2, 0.1)
                .setValue(settings.themeIntensity)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.themeIntensity = value;
                    await this.plugin.saveSettings();
                })
            );

        // Community Type Toggles and Volume Controls
        const communityTypesHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        communityTypesHeader.createEl('h4', {
            text: 'Community type audio themes',
            cls: 'sonic-graph-setting-label'
        });
        communityTypesHeader.createEl('div', {
            text: 'Configure unique audio characteristics for each community type',
            cls: 'sonic-graph-setting-description'
        });

        // Large Stable Communities
        this.createCommunityTypeSettings(container, 'large-stable', 'Large Stable Communities',
            'Rich, sustained harmonies for well-established communities (>15 nodes)', settings);

        // Small Dynamic Communities
        this.createCommunityTypeSettings(container, 'small-dynamic', 'Small Dynamic Communities',
            'Lighter, evolving patterns for agile communities (<15 nodes)', settings);

        // Bridge Communities
        this.createCommunityTypeSettings(container, 'bridge', 'Bridge Communities',
            'Transitional themes connecting different community structures', settings);

        // Isolated Communities
        this.createCommunityTypeSettings(container, 'isolated', 'Isolated Communities',
            'Sparse, minimal textures for disconnected groups', settings);

        // Hierarchical Communities
        this.createCommunityTypeSettings(container, 'hierarchical', 'Hierarchical Communities',
            'Layered, structured harmonies reflecting containment relationships', settings);

        // Community Analysis Settings
        const analysisHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        analysisHeader.createEl('h4', {
            text: 'Community analysis',
            cls: 'sonic-graph-setting-label'
        });
        analysisHeader.createEl('div', {
            text: 'Configure how communities are detected and classified',
            cls: 'sonic-graph-setting-description'
        });

        // Large Community Size Threshold
        new Setting(container)
            .setName('Large community threshold')
            .setDesc('Minimum size for a community to be considered "large" (default: 15 nodes)')
            .addSlider(slider => slider
                .setLimits(5, 30, 1)
                .setValue(settings.largeCommunitySizeThreshold)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.largeCommunitySizeThreshold = value;
                    await this.plugin.saveSettings();
                })
            );

        // Hierarchy Analysis Toggle
        new Setting(container)
            .setName('Hierarchy analysis')
            .setDesc('Detect nested community structures for hierarchical themes')
            .addToggle(toggle => toggle
                .setValue(settings.hierarchyAnalysis)
                .onChange(async (value) => {
                    settings.hierarchyAnalysis = value;
                    await this.plugin.saveSettings();
                })
            );

        if (settings.hierarchyAnalysis) {
            // Hierarchy Containment Threshold
            new Setting(container)
                .setName('Containment threshold')
                .setDesc('Minimum overlap ratio to consider nested hierarchy (0-1)')
                .addSlider(slider => slider
                    .setLimits(0.3, 1.0, 0.05)
                    .setValue(settings.hierarchyContainmentThreshold)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.hierarchyContainmentThreshold = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        // Spatial Audio Settings
        const spatialHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        spatialHeader.createEl('h4', {
            text: 'Spatial audio',
            cls: 'sonic-graph-setting-label'
        });

        // Spatial Audio Toggle
        new Setting(container)
            .setName('Enable spatial audio')
            .setDesc('Position community themes in stereo field based on community centroid')
            .addToggle(toggle => toggle
                .setValue(settings.spatialAudio)
                .onChange(async (value) => {
                    settings.spatialAudio = value;
                    await this.plugin.saveSettings();
                })
            );

        if (settings.spatialAudio) {
            // Spatial Width
            new Setting(container)
                .setName('Spatial width')
                .setDesc('Width of stereo field for spatial positioning (0 = mono, 1 = full stereo)')
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(settings.spatialWidth)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.spatialWidth = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        // Info note
        const infoNote = container.createDiv({ cls: 'sonic-graph-setting-item' });
        infoNote.createEl('div', {
            text: 'Community detection uses graph algorithms to identify natural groupings and generate thematic audio for each community type',
            cls: 'sonic-graph-setting-description sonic-graph-info'
        });
    }

    /**
     * Phase 5.3: Create community evolution audio settings section
     */
    private createCommunityEvolutionSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });

        // Community Evolution Header
        const evolutionHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        evolutionHeader.createEl('label', {
            text: 'Community evolution audio (phase 5.3)',
            cls: 'sonic-graph-setting-label sonic-graph-setting-header'
        });
        evolutionHeader.createEl('div', {
            text: 'Audio feedback for community evolution events (merge, split, growth, decline, etc.)',
            cls: 'sonic-graph-setting-description'
        });

        // Main Community Evolution Toggle
        new Setting(container)
            .setName('Enable evolution audio')
            .setDesc('Play audio events when communities merge, split, grow, decline, or change structure')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.communityEvolution?.enabled || false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.communityEvolution) {
                        this.plugin.settings.communityEvolution = {
                            enabled: false,
                            growthThreshold: 0.3,
                            declineThreshold: 0.3,
                            eventAudioEnabled: true,
                            enabledEventTypes: {
                                'merge': true,
                                'split': true,
                                'growth': true,
                                'decline': true,
                                'bridging': true,
                                'formation': true,
                                'dissolution': true
                            },
                            eventVolumes: {
                                'merge': 0.7,
                                'split': 0.6,
                                'growth': 0.5,
                                'decline': 0.5,
                                'bridging': 0.6,
                                'formation': 0.65,
                                'dissolution': 0.65
                            },
                            eventThrottleMs: 500
                        };
                    }
                    this.plugin.settings.communityEvolution.enabled = value;
                    await this.plugin.saveSettings();
                    void this.refreshCommunityEvolutionSettings();
                })
            );

        // Show additional settings only when evolution audio is enabled
        if (this.plugin.settings.communityEvolution?.enabled) {
            void this.createCommunityEvolutionDetailSettings(container);
        }
    }

    /**
     * Phase 5.3: Create detailed community evolution audio settings
     */
    private createCommunityEvolutionDetailSettings(container: HTMLElement): void {
        const settings = this.plugin.settings.communityEvolution;

        // Evolution Event Types Header
        const eventTypesHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        eventTypesHeader.createEl('h4', {
            text: 'Evolution event types',
            cls: 'sonic-graph-setting-label'
        });
        eventTypesHeader.createEl('div', {
            text: 'Enable or disable specific evolution event audio',
            cls: 'sonic-graph-setting-description'
        });

        // Community Merge
        this.createEvolutionEventSettings(container, 'merge', 'Community Merge',
            'Audio when two communities combine into one', settings);

        // Community Split
        this.createEvolutionEventSettings(container, 'split', 'Community Split',
            'Audio when a community divides into multiple parts', settings);

        // Community Growth
        this.createEvolutionEventSettings(container, 'growth', 'Community Growth',
            'Audio when a community expands significantly', settings);

        // Community Decline
        this.createEvolutionEventSettings(container, 'decline', 'Community Decline',
            'Audio when a community shrinks significantly', settings);

        // Community Bridging
        this.createEvolutionEventSettings(container, 'bridging', 'Community Bridging',
            'Audio when new connections form between communities', settings);

        // Community Formation
        this.createEvolutionEventSettings(container, 'formation', 'Community Formation',
            'Audio when a new community is detected', settings);

        // Community Dissolution
        this.createEvolutionEventSettings(container, 'dissolution', 'Community Dissolution',
            'Audio when a community completely dissolves', settings);

        // Evolution Thresholds Header
        const thresholdsHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        thresholdsHeader.createEl('h4', {
            text: 'Evolution thresholds',
            cls: 'sonic-graph-setting-label'
        });
        thresholdsHeader.createEl('div', {
            text: 'Configure sensitivity for detecting growth and decline',
            cls: 'sonic-graph-setting-description'
        });

        // Growth Threshold
        new Setting(container)
            .setName('Growth threshold')
            .setDesc('Minimum size increase to trigger growth event (0-1, default: 0.3 = 30%)')
            .addSlider(slider => slider
                .setLimits(0.1, 1.0, 0.05)
                .setValue(settings.growthThreshold)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.growthThreshold = value;
                    await this.plugin.saveSettings();
                })
            );

        // Decline Threshold
        new Setting(container)
            .setName('Decline threshold')
            .setDesc('Minimum size decrease to trigger decline event (0-1, default: 0.3 = 30%)')
            .addSlider(slider => slider
                .setLimits(0.1, 1.0, 0.05)
                .setValue(settings.declineThreshold)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.declineThreshold = value;
                    await this.plugin.saveSettings();
                })
            );

        // Performance Settings
        const performanceHeader = container.createDiv({ cls: 'sonic-graph-setting-item' });
        performanceHeader.createEl('h4', {
            text: 'Performance settings',
            cls: 'sonic-graph-setting-label'
        });

        // Event Throttle
        new Setting(container)
            .setName('Event throttle (ms)')
            .setDesc('Minimum time between evolution events to prevent audio overload')
            .addSlider(slider => slider
                .setLimits(100, 2000, 100)
                .setValue(settings.eventThrottleMs)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    settings.eventThrottleMs = value;
                    await this.plugin.saveSettings();
                })
            );

        // Info note
        const infoNote = container.createDiv({ cls: 'sonic-graph-setting-item' });
        infoNote.createEl('div', {
            text: 'Evolution events track changes over time to provide real-time audio feedback as your vault structure evolves',
            cls: 'sonic-graph-setting-description sonic-graph-info'
        });
    }

    /**
     * Phase 6.1: Create musical theory settings section
     */
    private createMusicalTheorySettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });

        // Musical Theory Header
        const headerContainer = container.createDiv({ cls: 'sonic-graph-setting-item' });
        headerContainer.createEl('h3', {
            text: 'Phase 6.1: musical theory integration',
            cls: 'sonic-graph-section-header'
        });
        headerContainer.createEl('div', {
            text: 'Constrain audio to musical scales and harmonic principles for musically coherent soundscapes',
            cls: 'sonic-graph-setting-description'
        });

        // Enable Musical Theory Toggle
        const enabledItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        enabledItem.createEl('label', {
            text: 'Enable musical theory',
            cls: 'sonic-graph-setting-label'
        });
        enabledItem.createEl('div', {
            text: 'All generated frequencies will be quantized to the selected musical scale',
            cls: 'sonic-graph-setting-description'
        });

        const enabledToggle = enabledItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        enabledToggle.checked = this.plugin.settings.musicalTheory?.enabled || false;
        enabledToggle.addEventListener('change', () => {
            void (async () => {
                if (!this.plugin.settings.musicalTheory) {
                    this.plugin.settings.musicalTheory = {
                        enabled: enabledToggle.checked,
                        scale: 'major',
                        rootNote: 'C',
                        enforceHarmony: true,
                        allowChromaticPassing: false,
                        dissonanceThreshold: 0.3,
                        quantizationStrength: 0.8,
                        preferredChordProgression: 'I-IV-V-I',
                        dynamicScaleModulation: false
                    };
                } else {
                    this.plugin.settings.musicalTheory.enabled = enabledToggle.checked;
                }
                await this.plugin.saveSettings();
                void this.refreshMusicalTheorySettings();
            })();
        });

        // Show detailed settings if enabled
        if (this.plugin.settings.musicalTheory?.enabled) {
            void this.createMusicalTheoryDetailSettings(container);
        }
    }

    /**
     * Phase 6.1: Create detailed musical theory settings
     */
    private createMusicalTheoryDetailSettings(container: HTMLElement): void {
        const settings = this.plugin.settings.musicalTheory;

        // Root Note Dropdown
        const rootNoteItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        rootNoteItem.createEl('label', {
            text: 'Root note',
            cls: 'sonic-graph-setting-label'
        });
        rootNoteItem.createEl('div', {
            text: 'The root note of the musical scale',
            cls: 'sonic-graph-setting-description'
        });

        const rootNoteSelect = rootNoteItem.createEl('select', {
            cls: 'sonic-graph-select'
        });
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach(note => {
            const option = rootNoteSelect.createEl('option', {
                text: note,
                value: note
            });
            if (note === settings.rootNote) {
                option.selected = true;
            }
        });
        rootNoteSelect.addEventListener('change', () => {
            void (async () => {
                settings.rootNote = rootNoteSelect.value;
                await this.plugin.saveSettings();
            })();
        });

        // Scale Type Dropdown
        const scaleItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        scaleItem.createEl('label', {
            text: 'Scale type',
            cls: 'sonic-graph-setting-label'
        });
        scaleItem.createEl('div', {
            text: 'The musical scale or mode to use for quantization',
            cls: 'sonic-graph-setting-description'
        });

        const scaleSelect = scaleItem.createEl('select', {
            cls: 'sonic-graph-select'
        });
        const scales = [
            { value: 'major', label: 'Major' },
            { value: 'minor', label: 'Natural Minor' },
            { value: 'harmonic-minor', label: 'Harmonic Minor' },
            { value: 'melodic-minor', label: 'Melodic Minor' },
            { value: 'pentatonic-major', label: 'Pentatonic Major' },
            { value: 'pentatonic-minor', label: 'Pentatonic Minor' },
            { value: 'blues', label: 'Blues' },
            { value: 'dorian', label: 'Dorian' },
            { value: 'phrygian', label: 'Phrygian' },
            { value: 'lydian', label: 'Lydian' },
            { value: 'mixolydian', label: 'Mixolydian' },
            { value: 'whole-tone', label: 'Whole Tone' },
            { value: 'diminished', label: 'Diminished' }
        ];
        scales.forEach(scale => {
            const option = scaleSelect.createEl('option', {
                text: scale.label,
                value: scale.value
            });
            if (scale.value === settings.scale) {
                option.selected = true;
            }
        });
        scaleSelect.addEventListener('change', () => {
            void (async () => {
                settings.scale = scaleSelect.value;
                await this.plugin.saveSettings();
            })();
        });

        // Quantization Strength Slider
        const quantStrengthItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        quantStrengthItem.createEl('label', {
            text: 'Quantization strength',
            cls: 'sonic-graph-setting-label'
        });
        quantStrengthItem.createEl('div', {
            text: 'How strongly to snap pitches to scale notes (0 = free, 1 = strict)',
            cls: 'sonic-graph-setting-description'
        });

        const quantStrengthValue = quantStrengthItem.createEl('span', {
            text: settings.quantizationStrength.toFixed(2),
            cls: 'sonic-graph-slider-value'
        });

        const quantStrengthSlider = quantStrengthItem.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider',
            attr: {
                min: '0',
                max: '1',
                step: '0.05',
                value: settings.quantizationStrength.toString()
            }
        });

        quantStrengthSlider.addEventListener('input', () => {
            const value = parseFloat(quantStrengthSlider.value);
            quantStrengthValue.textContent = value.toFixed(2);
        });

        quantStrengthSlider.addEventListener('change', () => {
            void (async () => {
                settings.quantizationStrength = parseFloat(quantStrengthSlider.value);
                await this.plugin.saveSettings();
            })();
        });

        // Dissonance Threshold Slider
        const dissonanceItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        dissonanceItem.createEl('label', {
            text: 'Dissonance threshold',
            cls: 'sonic-graph-setting-label'
        });
        dissonanceItem.createEl('div', {
            text: 'Maximum allowed dissonance level (0 = consonant only, 1 = allow all)',
            cls: 'sonic-graph-setting-description'
        });

        const dissonanceValue = dissonanceItem.createEl('span', {
            text: settings.dissonanceThreshold.toFixed(2),
            cls: 'sonic-graph-slider-value'
        });

        const dissonanceSlider = dissonanceItem.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider',
            attr: {
                min: '0',
                max: '1',
                step: '0.05',
                value: settings.dissonanceThreshold.toString()
            }
        });

        dissonanceSlider.addEventListener('input', () => {
            const value = parseFloat(dissonanceSlider.value);
            dissonanceValue.textContent = value.toFixed(2);
        });

        dissonanceSlider.addEventListener('change', () => {
            void (async () => {
                settings.dissonanceThreshold = parseFloat(dissonanceSlider.value);
                await this.plugin.saveSettings();
            })();
        });

        // Enforce Harmony Toggle
        const enforceHarmonyItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        enforceHarmonyItem.createEl('label', {
            text: 'Enforce scale harmony',
            cls: 'sonic-graph-setting-label'
        });
        enforceHarmonyItem.createEl('div', {
            text: 'Strictly constrain all notes to the selected scale',
            cls: 'sonic-graph-setting-description'
        });

        const enforceHarmonyToggle = enforceHarmonyItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        enforceHarmonyToggle.checked = settings.enforceHarmony;
        enforceHarmonyToggle.addEventListener('change', () => {
            void (async () => {
                settings.enforceHarmony = enforceHarmonyToggle.checked;
                await this.plugin.saveSettings();
            })();
        });

        // Allow Chromatic Passing Toggle
        const chromaticItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        chromaticItem.createEl('label', {
            text: 'Allow chromatic passing tones',
            cls: 'sonic-graph-setting-label'
        });
        chromaticItem.createEl('div', {
            text: 'Allow notes outside the scale as passing tones',
            cls: 'sonic-graph-setting-description'
        });

        const chromaticToggle = chromaticItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        chromaticToggle.checked = settings.allowChromaticPassing;
        chromaticToggle.addEventListener('change', () => {
            void (async () => {
                settings.allowChromaticPassing = chromaticToggle.checked;
                await this.plugin.saveSettings();
            })();
        });

        // Dynamic Scale Modulation Toggle
        const modulationItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        modulationItem.createEl('label', {
            text: 'Dynamic scale modulation',
            cls: 'sonic-graph-setting-label'
        });
        modulationItem.createEl('div', {
            text: 'Automatically change scales based on vault state (experimental)',
            cls: 'sonic-graph-setting-description'
        });

        const modulationToggle = modulationItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        modulationToggle.checked = settings.dynamicScaleModulation;
        modulationToggle.addEventListener('change', () => {
            void (async () => {
                settings.dynamicScaleModulation = modulationToggle.checked;
                await this.plugin.saveSettings();
            })();
        });
    }

    /**
     * Phase 6.1: Refresh musical theory settings display
     */
    private refreshMusicalTheorySettings(): void {
        const settingsContent = this.settingsPanel?.querySelector('.sonic-graph-settings-content');
        if (!settingsContent) {
            return;
        }

        // Find and remove existing musical theory settings (last section, so remove to end)
        const sections = settingsContent.querySelectorAll('.sonic-graph-setting-item, .sonic-graph-settings-divider');
        let removeNext = false;
        for (const section of Array.from(sections)) {
            if (section.textContent?.includes('Phase 6.1: Musical Theory')) {
                removeNext = true;
            }
            if (removeNext) {
                void section.remove();
            }
        }

        // Recreate musical theory section
        void this.createMusicalTheorySettings(settingsContent as HTMLElement);
    }

    /**
     * Phase 6.2: Create dynamic orchestration settings
     */
    private createDynamicOrchestrationSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });

        // Header
        const headerItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        headerItem.createEl('label', {
            text: 'Phase 6.2: dynamic orchestration',
            cls: 'sonic-graph-setting-label sonic-graph-setting-header'
        });
        headerItem.createEl('div', {
            text: 'Complexity-based and temporal orchestration that evolves with your vault',
            cls: 'sonic-graph-setting-description'
        });

        // Enable toggle
        const enabledItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        enabledItem.createEl('label', {
            text: 'Enable dynamic orchestration',
            cls: 'sonic-graph-setting-label'
        });
        enabledItem.createEl('div', {
            text: 'Automatically adjust instrumentation based on vault complexity and time of day',
            cls: 'sonic-graph-setting-description'
        });

        const enabledToggle = enabledItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        enabledToggle.checked = this.plugin.settings.dynamicOrchestration?.enabled || false;
        enabledToggle.addEventListener('change', () => {
            void (async () => {
                if (!this.plugin.settings.dynamicOrchestration) {
                    this.plugin.settings.dynamicOrchestration = {
                        enabled: enabledToggle.checked,
                        customThresholds: false,
                        temporalInfluenceEnabled: true,
                        timeOfDayInfluence: 0.5,
                        seasonalInfluence: 0.3,
                        transitionDuration: 3.0,
                        autoAdjust: true
                    };
                } else {
                    this.plugin.settings.dynamicOrchestration.enabled = enabledToggle.checked;
                }
                await this.plugin.saveSettings();
                void this.refreshDynamicOrchestrationSettings();
            })();
        });

        // Show detailed settings if enabled
        if (this.plugin.settings.dynamicOrchestration?.enabled) {
            void this.createDynamicOrchestrationDetailSettings(container);
        }
    }

    /**
     * Phase 6.2: Create detailed dynamic orchestration settings
     */
    private createDynamicOrchestrationDetailSettings(container: HTMLElement): void {
        const settings = this.plugin.settings.dynamicOrchestration;

        // Temporal Influence Enable
        const temporalItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        temporalItem.createEl('label', {
            text: 'Temporal influence',
            cls: 'sonic-graph-setting-label'
        });
        temporalItem.createEl('div', {
            text: 'Adjust instrumentation based on time of day and season',
            cls: 'sonic-graph-setting-description'
        });

        const temporalToggle = temporalItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        temporalToggle.checked = settings.temporalInfluenceEnabled;
        temporalToggle.addEventListener('change', () => {
            void (async () => {
                settings.temporalInfluenceEnabled = temporalToggle.checked;
                await this.plugin.saveSettings();
            })();
        });

        // Time of Day Influence Slider
        const timeOfDayItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        timeOfDayItem.createEl('label', {
            text: 'Time of day influence',
            cls: 'sonic-graph-setting-label'
        });
        timeOfDayItem.createEl('div', {
            text: `Strength of time-based adjustments: ${(settings.timeOfDayInfluence * 100).toFixed(0)}%`,
            cls: 'sonic-graph-setting-description'
        });

        const timeSlider = timeOfDayItem.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider',
            attr: {
                min: '0',
                max: '1',
                step: '0.1'
            }
        });
        timeSlider.value = settings.timeOfDayInfluence.toString();
        timeSlider.addEventListener('input', () => {
            void (async () => {
                settings.timeOfDayInfluence = parseFloat(timeSlider.value);
                const descriptionEl = timeOfDayItem.querySelector('.sonic-graph-setting-description');
                if (descriptionEl) {
                    descriptionEl.textContent = `Strength of time-based adjustments: ${(settings.timeOfDayInfluence * 100).toFixed(0)}%`;
                }
                await this.plugin.saveSettings();
            })();
        });

        // Seasonal Influence Slider
        const seasonalItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        seasonalItem.createEl('label', {
            text: 'Seasonal influence',
            cls: 'sonic-graph-setting-label'
        });
        seasonalItem.createEl('div', {
            text: `Strength of seasonal adjustments: ${(settings.seasonalInfluence * 100).toFixed(0)}%`,
            cls: 'sonic-graph-setting-description'
        });

        const seasonSlider = seasonalItem.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider',
            attr: {
                min: '0',
                max: '1',
                step: '0.1'
            }
        });
        seasonSlider.value = settings.seasonalInfluence.toString();
        seasonSlider.addEventListener('input', () => {
            void (async () => {
                settings.seasonalInfluence = parseFloat(seasonSlider.value);
                const descriptionEl = seasonalItem.querySelector('.sonic-graph-setting-description');
                if (descriptionEl) {
                    descriptionEl.textContent = `Strength of seasonal adjustments: ${(settings.seasonalInfluence * 100).toFixed(0)}%`;
                }
                await this.plugin.saveSettings();
            })();
        });

        // Transition Duration Slider
        const transitionItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        transitionItem.createEl('label', {
            text: 'Transition duration',
            cls: 'sonic-graph-setting-label'
        });
        transitionItem.createEl('div', {
            text: `Duration of tier transitions: ${settings.transitionDuration.toFixed(1)}s`,
            cls: 'sonic-graph-setting-description'
        });

        const transitionSlider = transitionItem.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider',
            attr: {
                min: '1',
                max: '10',
                step: '0.5'
            }
        });
        transitionSlider.value = settings.transitionDuration.toString();
        transitionSlider.addEventListener('input', () => {
            void (async () => {
                settings.transitionDuration = parseFloat(transitionSlider.value);
                const descriptionEl = transitionItem.querySelector('.sonic-graph-setting-description');
                if (descriptionEl) {
                    descriptionEl.textContent = `Duration of tier transitions: ${settings.transitionDuration.toFixed(1)}s`;
                }
                await this.plugin.saveSettings();
            })();
        });

        // Auto Adjust Toggle
        const autoAdjustItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        autoAdjustItem.createEl('label', {
            text: 'Auto-adjust',
            cls: 'sonic-graph-setting-label'
        });
        autoAdjustItem.createEl('div', {
            text: 'Automatically update orchestration as vault changes',
            cls: 'sonic-graph-setting-description'
        });

        const autoAdjustToggle = autoAdjustItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        autoAdjustToggle.checked = settings.autoAdjust;
        autoAdjustToggle.addEventListener('change', () => {
            void (async () => {
                settings.autoAdjust = autoAdjustToggle.checked;
                await this.plugin.saveSettings();
            })();
        });
    }

    /**
     * Phase 6.2: Refresh dynamic orchestration settings display
     */
    private refreshDynamicOrchestrationSettings(): void {
        const settingsContent = this.settingsPanel?.querySelector('.sonic-graph-settings-content');
        if (!settingsContent) {
            return;
        }

        // Find and remove existing dynamic orchestration settings
        const sections = settingsContent.querySelectorAll('.sonic-graph-setting-item, .sonic-graph-settings-divider');
        let removeNext = false;
        for (const section of Array.from(sections)) {
            if (section.textContent?.includes('Phase 6.2: Dynamic Orchestration')) {
                removeNext = true;
            }
            if (removeNext) {
                void section.remove();
            }
        }

        // Recreate dynamic orchestration section
        void this.createDynamicOrchestrationSettings(settingsContent as HTMLElement);
    }

    /**
     * Phase 6.3: Create spatial audio and panning settings
     */
    private createSpatialAudioSettings(container: HTMLElement): void {
        // Divider
        container.createEl('hr', { cls: 'sonic-graph-settings-divider' });

        // Header
        const headerItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        headerItem.createEl('label', {
            text: 'Phase 6.3: spatial audio & panning',
            cls: 'sonic-graph-setting-label sonic-graph-setting-header'
        });
        headerItem.createEl('div', {
            text: 'Map graph positions to stereo field for immersive spatial audio experience',
            cls: 'sonic-graph-setting-description'
        });

        // Enable toggle
        const enabledItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        enabledItem.createEl('label', {
            text: 'Enable spatial audio',
            cls: 'sonic-graph-setting-label'
        });
        enabledItem.createEl('div', {
            text: 'Position notes in stereo field based on graph location, folder, and clusters',
            cls: 'sonic-graph-setting-description'
        });

        const enabledToggle = enabledItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        enabledToggle.checked = this.plugin.settings.spatialAudio?.enabled || false;
        enabledToggle.addEventListener('change', () => {
            void (async () => {
                if (!this.plugin.settings.spatialAudio) {
                    this.plugin.settings.spatialAudio = {
                        enabled: enabledToggle.checked,
                        mode: PanningMode.Hybrid,
                        graphPositionSettings: {
                            curve: PanningCurve.Sigmoid,
                            intensity: 0.7,
                            smoothingFactor: 0.5,
                            updateThrottleMs: 100
                        },
                        folderSettings: {
                            enabled: true,
                            customMappings: [],
                            autoDetectTopLevel: true,
                            spreadFactor: 0.3
                        },
                        clusterSettings: {
                            enabled: true,
                            useCentroid: true,
                            individualSpread: 0.2,
                            clusterSeparation: 0.5
                        },
                        hybridWeights: {
                            graphPosition: 0.5,
                            folderBased: 0.3,
                            clusterBased: 0.2
                        },
                        advanced: {
                            enableDepthMapping: false,
                            depthInfluence: 0.3,
                            boundaryPadding: 0.1,
                            velocityDamping: true,
                            dampingFactor: 0.7
                        }
                    };
                } else {
                    this.plugin.settings.spatialAudio.enabled = enabledToggle.checked;
                }
                await this.plugin.saveSettings();
                void this.refreshSpatialAudioSettings();
            })();
        });

        // Show detailed settings if enabled
        if (this.plugin.settings.spatialAudio?.enabled) {
            void this.createSpatialAudioDetailSettings(container);
        }
    }

    /**
     * Phase 6.3: Create detailed spatial audio settings
     */
    private createSpatialAudioDetailSettings(container: HTMLElement): void {
        const settings = this.plugin.settings.spatialAudio;

        // Panning Mode
        const modeItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        modeItem.createEl('label', {
            text: 'Panning mode',
            cls: 'sonic-graph-setting-label'
        });
        modeItem.createEl('div', {
            text: 'Choose how node positions map to stereo panning',
            cls: 'sonic-graph-setting-description'
        });

        const modeSelect = modeItem.createEl('select', {
            cls: 'sonic-graph-dropdown'
        });
        const modes = [
            { value: 'graph-position', label: 'Graph Position' },
            { value: 'folder-based', label: 'Folder Based' },
            { value: 'cluster-based', label: 'Cluster Based' },
            { value: 'hybrid', label: 'Hybrid (Recommended)' },
            { value: 'disabled', label: 'Disabled' }
        ];
        modes.forEach(mode => {
            const option = modeSelect.createEl('option', {
                value: mode.value,
                text: mode.label
            });
            if (settings.mode === mode.value) {
                option.selected = true;
            }
        });
        modeSelect.addEventListener('change', () => {
            void (async () => {
                settings.mode = modeSelect.value as PanningMode;
                await this.plugin.saveSettings();
            })();
        });

        // Pan Intensity
        const intensityItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        intensityItem.createEl('label', {
            text: 'Pan intensity',
            cls: 'sonic-graph-setting-label'
        });
        intensityItem.createEl('div', {
            text: `How extreme panning can be: ${(settings.graphPositionSettings.intensity * 100).toFixed(0)}%`,
            cls: 'sonic-graph-setting-description'
        });

        const intensitySlider = intensityItem.createEl('input', {
            type: 'range',
            cls: 'sonic-graph-slider',
            attr: {
                min: '0',
                max: '1',
                step: '0.05'
            }
        });
        intensitySlider.value = settings.graphPositionSettings.intensity.toString();
        intensitySlider.addEventListener('input', () => {
            void (async () => {
                settings.graphPositionSettings.intensity = parseFloat(intensitySlider.value);
                const descriptionEl = intensityItem.querySelector('.sonic-graph-setting-description');
                if (descriptionEl) {
                    descriptionEl.textContent = `How extreme panning can be: ${(settings.graphPositionSettings.intensity * 100).toFixed(0)}%`;
                }
                await this.plugin.saveSettings();
            })();
        });

        // Panning Curve
        const curveItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        curveItem.createEl('label', {
            text: 'Panning curve',
            cls: 'sonic-graph-setting-label'
        });
        curveItem.createEl('div', {
            text: 'Mapping curve from position to pan',
            cls: 'sonic-graph-setting-description'
        });

        const curveSelect = curveItem.createEl('select', {
            cls: 'sonic-graph-dropdown'
        });
        const curves = [
            { value: 'linear', label: 'Linear' },
            { value: 'exponential', label: 'Exponential' },
            { value: 'sigmoid', label: 'Sigmoid (Recommended)' },
            { value: 'logarithmic', label: 'Logarithmic' }
        ];
        curves.forEach(curve => {
            const option = curveSelect.createEl('option', {
                value: curve.value,
                text: curve.label
            });
            if (settings.graphPositionSettings.curve === curve.value) {
                option.selected = true;
            }
        });
        curveSelect.addEventListener('change', () => {
            void (async () => {
                settings.graphPositionSettings.curve = curveSelect.value as PanningCurve;
                await this.plugin.saveSettings();
            })();
        });

        // Velocity Damping Toggle
        const dampingItem = container.createDiv({ cls: 'sonic-graph-setting-item' });
        dampingItem.createEl('label', {
            text: 'Velocity damping',
            cls: 'sonic-graph-setting-label'
        });
        dampingItem.createEl('div', {
            text: 'Smooth rapid position changes during graph animation',
            cls: 'sonic-graph-setting-description'
        });

        const dampingToggle = dampingItem.createEl('input', {
            type: 'checkbox',
            cls: 'sonic-graph-toggle'
        });
        dampingToggle.checked = settings.advanced.velocityDamping;
        dampingToggle.addEventListener('change', () => {
            void (async () => {
                settings.advanced.velocityDamping = dampingToggle.checked;
                await this.plugin.saveSettings();
            })();
        });
    }

    /**
     * Phase 6.3: Refresh spatial audio settings display
     */
    private refreshSpatialAudioSettings(): void {
        // Find the settings section
        const settingsContent = document.querySelector('.sonic-graph-modal-content');
        if (!settingsContent) return;

        // Find and remove existing spatial audio settings
        let removeNext = false;
        for (const section of Array.from(settingsContent.children)) {
            if (removeNext) {
                void section.remove();
                break;
            }
            if (section.textContent?.includes('Phase 6.3: Spatial Audio')) {
                removeNext = true;
            }
            if (removeNext) {
                void section.remove();
            }
        }

        // Recreate spatial audio section
        void this.createSpatialAudioSettings(settingsContent as HTMLElement);
    }

    /**
     * Phase 5.3: Create settings for individual community types
     */
    private createCommunityTypeSettings(
        container: HTMLElement,
        communityType: keyof typeof this.plugin.settings.communityDetection.communityTypeEnabled,
        displayName: string,
        description: string,
        settings: unknown
    ): void {
        const communityContainer = container.createDiv({ cls: 'sonic-graph-cluster-type-container' });

        // Toggle for this community type
        new Setting(communityContainer)
            .setName(displayName)
            .setDesc(description)
            .addToggle(toggle => toggle
                .setValue(settings.communityTypeEnabled[communityType])
                .onChange(async (value) => {
                    settings.communityTypeEnabled[communityType] = value;
                    await this.plugin.saveSettings();
                })
            );

        // Volume control (only shown if enabled)
        if (settings.communityTypeEnabled[communityType]) {
            new Setting(communityContainer)
                .setName(`${displayName} volume`)
                .setDesc(`Volume level for ${displayName.toLowerCase()}`)
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(settings.communityTypeVolumes[communityType])
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.communityTypeVolumes[communityType] = value;
                        await this.plugin.saveSettings();
                    })
                );
        }
    }

    /**
     * Phase 5.3: Create settings for individual evolution event types
     */
    private createEvolutionEventSettings(
        container: HTMLElement,
        eventType: keyof typeof this.plugin.settings.communityEvolution.enabledEventTypes,
        displayName: string,
        description: string,
        settings: unknown
    ): void {
        const eventContainer = container.createDiv({ cls: 'sonic-graph-cluster-type-container' });

        // Toggle for this event type
        new Setting(eventContainer)
            .setName(displayName)
            .setDesc(description)
            .addToggle(toggle => toggle
                .setValue(settings.enabledEventTypes[eventType])
                .onChange(async (value) => {
                    settings.enabledEventTypes[eventType] = value;
                    await this.plugin.saveSettings();
                })
            );

        // Volume control (only shown if enabled)
        if (settings.enabledEventTypes[eventType]) {
            new Setting(eventContainer)
                .setName(`${displayName} volume`)
                .setDesc(`Volume level for ${displayName.toLowerCase()} events`)
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(settings.eventVolumes[eventType])
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.eventVolumes[eventType] = value;
                        await this.plugin.saveSettings();
                    })
                );
        }
    }

    /**
     * Phase 5.3: Refresh community detection settings when enabled/disabled
     */
    private refreshCommunityDetectionSettings(): void {
        // Find the settings panel and recreate the audio section
        const settingsContent = this.settingsPanel?.querySelector('.sonic-graph-settings-content');
        if (!settingsContent) {
            return;
        }

        // Find and refresh the audio section
        const audioSection = settingsContent.querySelector('.sonic-graph-settings-section:has(.sonic-graph-settings-section-title)');
        if (audioSection) {
            // Clear and recreate the audio section content
            const existingContent = audioSection.querySelector('.sonic-graph-settings-section-content');
            if (existingContent) {
                void existingContent.empty();
                void this.createAudioSettings(existingContent as HTMLElement);
            }
        }
    }

    /**
     * Phase 5.3: Refresh community evolution settings when enabled/disabled
     */
    private refreshCommunityEvolutionSettings(): void {
        // Find the settings panel and recreate the audio section
        const settingsContent = this.settingsPanel?.querySelector('.sonic-graph-settings-content');
        if (!settingsContent) {
            return;
        }

        // Find and refresh the audio section
        const audioSection = settingsContent.querySelector('.sonic-graph-settings-section:has(.sonic-graph-settings-section-title)');
        if (audioSection) {
            // Clear and recreate the audio section content
            const existingContent = audioSection.querySelector('.sonic-graph-settings-section-content');
            if (existingContent) {
                void existingContent.empty();
                void this.createAudioSettings(existingContent as HTMLElement);
            }
        }
    }

    /**
     * Phase 5: Create settings for individual cluster types
     */
    private createClusterTypeSettings(
        container: HTMLElement,
        clusterType: keyof typeof this.plugin.settings.clusterAudio.clusterTypeEnabled,
        displayName: string,
        description: string,
        settings: unknown
    ): void {
        const clusterContainer = container.createDiv({ cls: 'sonic-graph-cluster-type-container' });

        // Toggle for this cluster type
        new Setting(clusterContainer)
            .setName(displayName)
            .setDesc(description)
            .addToggle(toggle => toggle
                .setValue(settings.clusterTypeEnabled[clusterType])
                .onChange(async (value) => {
                    settings.clusterTypeEnabled[clusterType] = value;
                    await this.plugin.saveSettings();
                })
            );

        // Volume control (only shown if enabled)
        if (settings.clusterTypeEnabled[clusterType]) {
            new Setting(clusterContainer)
                .setName(`${displayName} volume`)
                .setDesc(`Volume level for ${displayName.toLowerCase()}`)
                .addSlider(slider => slider
                    .setLimits(0, 1, 0.1)
                    .setValue(settings.clusterTypeVolumes[clusterType])
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        settings.clusterTypeVolumes[clusterType] = value;
                        await this.plugin.saveSettings();
                    })
                );
        }
    }

    /**
     * Phase 5: Refresh cluster audio settings when enabled/disabled
     */
    private refreshClusterAudioSettings(): void {
        // Find the settings panel and recreate the audio section
        const settingsContent = this.settingsPanel?.querySelector('.sonic-graph-settings-content');
        if (!settingsContent) {
            return;
        }

        // Find and refresh the audio section
        const audioSection = settingsContent.querySelector('.sonic-graph-settings-section:has(.sonic-graph-settings-section-title)');
        if (audioSection) {
            // Clear and recreate the audio section content
            const existingContent = audioSection.querySelector('.sonic-graph-settings-section-content');
            if (existingContent) {
                void existingContent.empty();
                void this.createAudioSettings(existingContent as HTMLElement);
            }
        }
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
            void audioSection.empty();
            void this.createAudioSettings(audioSection as HTMLElement);
        }
    }

    /**
     * Get default audio enhancement settings
     */
    private getDefaultAudioEnhancementSettings(): unknown {
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
            void markersSwitch.addClass('active');
        }
        markersSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        markersSwitch.addEventListener('click', () => {
            const isActive = markersSwitch.hasClass('active');
            void markersSwitch.toggleClass('active', !isActive);
            void this.updateTimelineMarkersVisibility(!isActive);
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
            void this.updateAnimationStyle(style);
        });
        
        // Loop Animation Toggle
        const loopItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        loopItem.createEl('label', { text: 'Loop animation', cls: 'sonic-graph-setting-label' });
        
        const loopToggle = loopItem.createDiv({ cls: 'sonic-graph-setting-toggle' });
        const loopSwitch = loopToggle.createDiv({ cls: 'sonic-graph-toggle-switch' });
        if (this.getSonicGraphSettings().visual.loopAnimation) {
            void loopSwitch.addClass('active');
        }
        loopSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        loopSwitch.addEventListener('click', () => {
            const isActive = loopSwitch.hasClass('active');
            void loopSwitch.toggleClass('active', !isActive);
            void this.updateLoopAnimation(!isActive);
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
            void fileNamesSwitch.addClass('active');
        }
        fileNamesSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        // Add tooltip to show file names toggle
        setTooltip(fileNamesSwitch, 'Shows or hides file names as text labels on each node. Useful for identifying specific files, but may create visual clutter on large graphs. Consider using with zoom for better readability.', {
            placement: 'left'
        });

        fileNamesSwitch.addEventListener('click', () => {
            const isActive = fileNamesSwitch.hasClass('active');
            void fileNamesSwitch.toggleClass('active', !isActive);
            void this.updateShowFileNames(!isActive);
        });
    }

    /**
     * Create navigation settings section
     */
    private createNavigationSettings(_container: HTMLElement): void {
        // Navigation settings section removed - Control Center button moved to header
        // This method kept for future navigation-related settings if needed
    }

    /**
     * Create advanced settings section with logging controls
     */
    private createAdvancedSettings(container: HTMLElement): void {
        // Create collapsible Advanced section
        const advancedSection = container.createEl('details', { cls: 'sonic-graph-advanced-settings' });
        advancedSection.createEl('summary', {
            text: 'ADVANCED',
            cls: 'sonic-graph-settings-section-title sonic-graph-advanced-summary'
        });
        
        // Create the content container
        const section = advancedSection.createDiv({ cls: 'sonic-graph-settings-section' });

        // Logging Level Setting
        const loggingItem = section.createDiv({ cls: 'sonic-graph-setting-item' });
        loggingItem.createEl('label', { text: 'Logging level', cls: 'sonic-graph-setting-label' });
        loggingItem.createEl('div', { 
            text: 'Control the verbosity of plugin logs. default is "warnings".', 
            cls: 'sonic-graph-setting-description' 
        });
        
        const loggingSelect = loggingItem.createEl('select', { cls: 'sonic-graph-setting-select' });
        const logLevels = [
            { value: 'off', text: 'Off' },
            { value: 'error', text: 'Errors only' },
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
            void LoggerFactory.setLogLevel(value);
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
            text: 'Export logs',
            cls: 'sonic-graph-export-logs-btn' 
        });

        exportButton.addEventListener('click', () => {
            void (async () => {
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
                void a.click();
                document.body.removeChild(a);
                void URL.revokeObjectURL(url);
                logger.info('export', 'Logs exported', { filename });
            })();
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
            void this.updateLayoutSetting('clusteringStrength', value);
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
            void this.updateLayoutSetting('groupSeparation', value);
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
            void tagsSwitch.addClass('active');
        }
        tagsSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        tagsSwitch.addEventListener('click', () => {
            const isActive = tagsSwitch.hasClass('active');
            void tagsSwitch.toggleClass('active', !isActive);
            void this.updateFilterSetting('showTags', !isActive);
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
            void orphansSwitch.addClass('active');
        }
        orphansSwitch.createDiv({ cls: 'sonic-graph-toggle-handle' });
        
        orphansSwitch.addEventListener('click', () => {
            const isActive = orphansSwitch.hasClass('active');
            void orphansSwitch.toggleClass('active', !isActive);
            void this.updateFilterSetting('showOrphans', !isActive);
        });
    }

    /**
     * Phase 3.8: Update layout setting and apply to renderer
     */
    private updateLayoutSetting(key: keyof SonicGraphSettings['layout'], value: unknown): void {
        // Performance optimization: Use debounced settings updates
        this.scheduleSettingsUpdate(`layout.${String(key)}`, value);

        logger.debug('layout-setting', `Scheduled layout setting update: ${String(key)} = ${String(value)}`);
    }

    /**
     * Update filter setting
     */
    private updateFilterSetting(key: keyof SonicGraphSettings['layout']['filters'], value: boolean): void {
        const currentSettings = this.getSonicGraphSettings();
        currentSettings.layout.filters[key] = value;
        
        // Save to plugin settings
        this.plugin.settings.sonicGraphSettings = currentSettings;
        void this.plugin.saveSettings();

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
        
        void this.createPathGroupsSettings(section);
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

            // Colored dot
            const colorDot = groupItem.createEl('div', { cls: 'sonic-graph-group-color-dot' });
            colorDot.style.backgroundColor = group.color;
            
            // Group label (type:name format)
            const groupLabel = groupItem.createEl('span', {
                text: this.formatGroupLabel(group),
                cls: 'sonic-graph-group-label'
            });
            void groupLabel.addClass('sonigraph-group-label');
            groupLabel.setCssProps({
                flex: '1',
                fontSize: '12px'
            });
            
            // Remove button
            const removeButton = groupItem.createEl('button', {
                text: '×',
                cls: 'sonic-graph-group-remove-btn sonigraph-group-remove-btn'
            });
            removeButton.setCssProps({
                background: 'none',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer'
            });
            
            // Event listeners
            colorDot.addEventListener('click', () => {
                void this.showColorPicker(index, colorDot);
            });
            
            removeButton.addEventListener('click', () => {
                void this.removeGroup(index);
                void this.refreshPathGroupsSettings();
            });
        });
        
        // Search input for adding new groups
        const searchInput = container.createEl('input', {
            type: 'text',
            placeholder: 'Enter query...',
            cls: 'sonic-graph-group-search-input'
        });
        void searchInput.addClass('sonigraph-group-search-input');
        void searchInput.addClass('sonigraph-group-search-input--highlighted');
        searchInput.setCssProps({
            border: '1px solid #fbbf24', // Yellow border
            borderRadius: '4px',
            fontSize: '12px'
        });
        
        // Add tooltip to groups search input
        setTooltip(searchInput, 'Create custom groups by entering folder paths, file patterns, or search queries. Groups visually cluster related nodes together using colored boundaries. Examples: "Projects/", "*.md", "#tag"', {
            placement: 'top'
        });
        
        // Show search options overlay on focus
        searchInput.addEventListener('focus', () => {
            void this.showSearchOptionsOverlay(searchInput);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                void this.addGroupFromSearch(searchInput.value);
                searchInput.value = '';
                void this.refreshPathGroupsSettings();
            }
        });
    }

    /**
     * Format group label in type:name format
     */
    private formatGroupLabel(group: unknown): string {
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

        void colorInput.addClass('sonigraph-color-picker');
        colorInput.setCssProps({
            left: `${dotRect.left - modalRect.left}px`,
            top: `${dotRect.bottom - modalRect.top + 4}px`, // 4px gap below the dot
            pointerEvents: 'auto' // Enable pointer events for interaction while keeping it visually hidden
        });
        
        // Find the view container to append to
        const viewContainerEl = this.contentEl;
        void viewContainerEl.appendChild(colorInput);

        // Use requestAnimationFrame to ensure positioning is applied before clicking
        requestAnimationFrame(() => {
            void colorInput.click();
        });

        colorInput.addEventListener('input', () => {
            const newColor = colorInput.value;
            void this.updateGroupProperty(groupIndex, 'color', newColor);
            colorDot.style.backgroundColor = newColor;
        });

        // Remove color picker when clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            // Don't dismiss if clicking on the color input itself or the color dot
            if (e.target === colorInput || e.target === colorDot) {
                return;
            }

            // Remove the color picker
            if (viewContainerEl.contains(colorInput)) {
                void viewContainerEl.removeChild(colorInput);
            }

            // Remove the event listener
            void document.removeEventListener('click', handleClickOutside);
        };

        colorInput.addEventListener('change', () => {
            if (viewContainerEl.contains(colorInput)) {
                void viewContainerEl.removeChild(colorInput);
            }
            // Also remove the click outside handler when change event fires
            void document.removeEventListener('click', handleClickOutside);
        });

        // Prevent the color picker from being dismissed by other click handlers
        colorInput.addEventListener('click', (e) => {
            void e.stopPropagation();
        });

        // Add the click outside handler after a brief delay to avoid immediate dismissal
        setTimeout(() => {
            void document.addEventListener('click', handleClickOutside);
        }, 100);

        // Fallback cleanup in case click outside handler fails
        setTimeout(() => {
            if (viewContainerEl.contains(colorInput)) {
                void viewContainerEl.removeChild(colorInput);
                void document.removeEventListener('click', handleClickOutside);
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
            void existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'sonic-graph-search-overlay';
        void overlay.addClass('sonigraph-autocomplete-overlay');
        overlay.setCssProps({
            top: (searchInput.offsetTop + searchInput.offsetHeight + 4) + 'px',
            left: searchInput.offsetLeft + 'px',
            width: searchInput.offsetWidth + 'px',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: '1000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        });
        
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
            void optionEl.addClass('sonigraph-autocomplete-option');
            optionEl.textContent = option;
            optionEl.setCssProps({
                cursor: 'pointer',
                borderRadius: '2px'
            });
            
            optionEl.addEventListener('click', () => {
                const prefix = option.split(':')[0];
                (searchInput as HTMLInputElement).value = prefix + ':';
                (searchInput as HTMLInputElement).focus();
                void overlay.remove();
            });
            
            void overlay.appendChild(optionEl);
        });

        if (searchInput.parentElement) {
            searchInput.parentElement.appendChild(overlay);
        }
        
        // Remove overlay when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function handleClickOutside(e) {
                if (!overlay.contains(e.target as Node) && e.target !== searchInput) {
                    void overlay.remove();
                    void document.removeEventListener('click', handleClickOutside);
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
        void this.plugin.saveSettings();

        if (this.graphRenderer) {
            this.graphRenderer.updateLayoutSettings(currentSettings.layout);
            this.graphRenderer.updateContentAwareSettings(currentSettings.contentAwarePositioning);
        }

        void logger.debug('path-grouping', 'Added new group from search:', newGroup);
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
        // Dynamic property access for group settings updates
        (currentSettings.layout.pathBasedGrouping.groups[groupIndex] as DynamicSettings)[property] = value;

        this.plugin.settings.sonicGraphSettings = currentSettings;
        void this.plugin.saveSettings();

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
        void this.plugin.saveSettings();

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
        const groupsContainer = document.querySelector('.sonic-graph-groups-list');
        if (groupsContainer) {
            void groupsContainer.empty();
            void this.createPathGroupsSettings(groupsContainer.parentElement);
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
            void existingError.remove();
        }
        
        const errorContainer = this.graphContainer.createDiv({ cls: 'sonic-graph-error' });
        const errorIcon = createLucideIcon('alert-circle', 48);
        void errorContainer.appendChild(errorIcon);
        
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
        
        retryBtn.addEventListener('click', () => {
            void (async () => {
                void logger.debug('ui', 'Retry button clicked - attempting to reinitialize graph');

                try {
                    // Show loading state
                    retryBtn.textContent = 'Retrying...';
                    retryBtn.disabled = true;

                    // Clear current error
                    void errorContainer.remove();

                    // Add loading indicator back
                    const loadingIndicator = this.graphContainer.createDiv({ cls: 'sonic-graph-loading' });
                    const loadingIcon = createLucideIcon('loader-2', 24);
                    void loadingIcon.addClass('sonic-graph-loading-icon');
                    void loadingIndicator.appendChild(loadingIcon);
                    loadingIndicator.createSpan({ text: 'Retrying...', cls: 'sonic-graph-loading-text' });

                    // Attempt to reinitialize
                    await this.initializeGraph();

                } catch (retryError) {
                    logger.error('ui', 'Retry failed:', (retryError as Error).message);
                    // The initializeGraph catch block will handle showing error state again
                }
            })();
        });
        
        // Add debug information button
        const debugBtn = errorContainer.createEl('button', { 
            text: 'Copy debug info',
            cls: 'sonic-graph-error-debug'
        });
        
        debugBtn.addEventListener('click', () => {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                error: errorMessage,
                excludeFolders: this.graphDataExtractor['excludeFolders'] || [],
                excludeFiles: this.graphDataExtractor['excludeFiles'] || [],
                vaultFileCount: this.app.vault.getFiles().length,
                platform: Platform
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
            void logger.debug('ui', 'Initializing temporal animator');
            
            // Extract graph data if not already done
            const graphData = this.graphDataExtractor.extractGraphData();
            
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
            void this.setAnimatorLoggingContext();
            
            // Set up callbacks
            this.temporalAnimator.onVisibilityChanged((visibleNodeIds) => {
                if (this.graphRenderer) {
                    this.graphRenderer.updateVisibleNodes(visibleNodeIds);
                }
            });
            
            this.temporalAnimator.onTimeChanged((currentTime, progress) => {
                void this.updateTimelineUI(currentTime, progress);
            });
            
            this.temporalAnimator.onAnimationEnded(() => {
                void this.handleAnimationEnd();
            });
            
            this.temporalAnimator.onNodeAppeared((node) => {
                logger.debug('temporal-callback', 'onNodeAppeared callback invoked', { 
                    nodeId: node.id,
                    nodeTitle: node.title,
                    nodeType: node.type,
                    callbackRegistered: true
                });
                void this.handleNodeAppearance(node);
            });
            
            void logger.info('ui', 'Temporal animator callbacks registered');
            
            // Initialize timeline markers
            void this.updateTimelineMarkers();
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
            
            void logger.info('ui', 'Temporal animator initialized successfully');
            
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
        void this.plugin.saveSettings();

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

        // Request workspace save to persist the timeline position
        // Debounce to avoid excessive saves during scrubbing
        if (this.scrubSaveTimeout) {
            clearTimeout(this.scrubSaveTimeout);
        }
        this.scrubSaveTimeout = setTimeout(() => {
            void this.requestSave();
            this.scrubSaveTimeout = null;
        }, 500); // Save 500ms after user stops scrubbing
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
            void this.updateTimelineMarkers();
            void this.updateCurrentPosition(currentTime, progress);
        }

        // Update visualization playback time
        if (this.visualizationManager) {
            this.visualizationManager.updatePlaybackTime(currentTime);
        }
    }

    /**
     * Update timeline markers for years and time
     */
    private updateTimelineMarkers(): void {
        if (!this.temporalAnimator) return;
        
        const timelineInfo = this.temporalAnimator.getTimelineInfo();
        
        // Only update time markers - years shown on current position indicator
        void this.updateTimeMarkers(timelineInfo);
    }

    /**
     * Update time markers along the timeline
     */
    private updateTimeMarkers(timelineInfo: unknown): void {
        const markersContainer = this.timelineInfo.querySelector('.sonic-graph-timeline-markers');
        if (!markersContainer) return;

        // Clear all existing markers (both time and year markers)
        void markersContainer.empty();
        
        // Check if markers should be shown
        const showMarkers = this.getSonicGraphSettings().visual.timelineMarkersEnabled;
        if (!showMarkers) {
            (markersContainer as HTMLElement).removeClass('sonigraph-timeline-markers--visible');
            return;
        }
        
        (markersContainer as HTMLElement).addClass('sonigraph-timeline-markers--visible');
        const duration = timelineInfo.duration;
        
        // Generate time markers based on duration
        const timeIntervals: number[] = [];
        
        if (duration <= 30) {
            // For short durations, show every 5 seconds
            for (let t = 0; t <= duration; t += 5) {
                void timeIntervals.push(t);
            }
        } else if (duration <= 120) {
            // For medium durations, show every 10 seconds
            for (let t = 0; t <= duration; t += 10) {
                void timeIntervals.push(t);
            }
        } else {
            // For long durations, show every 30 seconds
            for (let t = 0; t <= duration; t += 30) {
                void timeIntervals.push(t);
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
        const currentIndicator = this.timelineInfo.querySelector('.sonic-graph-timeline-current-indicator');
        if (currentIndicator instanceof HTMLElement) {
            currentIndicator.setCssProps({ display: 'none' });
        }
        
        void logger.info('ui', 'Sonic Graph animation completed');
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
            void logger.warn('audio', 'No audio engine available for node appearance');
            return;
        }
        
        try {
            // Ensure audio engine is initialized
            const status = this.plugin.audioEngine.getStatus();
            if (!status.isInitialized) {
                void logger.debug('audio', 'Initializing audio engine for node appearance');
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
            
            // Get current timeline elapsed time for visualization
            const currentTime = this.temporalAnimator ? this.temporalAnimator.getState().currentTime : 0;

            // Play the note immediately using the new immediate playback method
            try {
                await this.plugin.audioEngine.playNoteImmediate(mapping, currentTime, node.id, node.title);
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
            void logger.warn('audio-playback', 'Audio playback failed:', error);
        }
    }

    /**
     * Create a musical mapping for a graph node
     */
    private createMusicalMappingForNode(node: GraphNode): unknown {
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
            void logger.warn('audio', 'No instruments enabled for temporal animation');
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
        
        // Calculate pitch using scale-aware generation for more musical results
        const pitch = this.calculateScaleAwarePitch(node, settings);

        // Calculate rhythmic duration with phrase-aware patterns
        const duration = this.calculateRhythmicDuration(node, settings);

        // Calculate dynamic velocity with phrase expression
        const velocity = this.calculateDynamicVelocity(node, settings);

        // Increment phrase counter AFTER all calculations use current position
        const currentPosition = this.notesInCurrentPhrase % this.phraseLengthInNotes;
        this.notesInCurrentPhrase++;

        logger.info('musical-structure', '🎵 Note generated with full musical context', {
            nodeId: node.id,
            nodeTitle: node.title,
            nodeType: node.type,
            instrument: selectedInstrument,
            pitch: pitch.toFixed(2),
            duration: duration.toFixed(3),
            velocity: velocity.toFixed(3),
            positionInPhrase: currentPosition,
            phraseNumber: Math.floor((this.notesInCurrentPhrase - 1) / this.phraseLengthInNotes),
            chordIndex: this.currentChordIndex,
            totalNotesPlayed: this.notesInCurrentPhrase
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
     * Calculate scale-aware pitch for a node
     * Uses scale degrees instead of chromatic hashing for more musical results
     */
    private calculateScaleAwarePitch(node: GraphNode, settings: unknown): number {
        // Get musical theory settings
        const theorySettings = this.plugin.settings.audioEnhancement?.musicalTheory;
        const scale = theorySettings?.scale || 'major';
        const rootNote = theorySettings?.rootNote || 'C';

        // Define scale intervals in semitones from root
        const scaleIntervals: { [key: string]: number[] } = {
            'major': [0, 2, 4, 5, 7, 9, 11],           // Major scale
            'minor': [0, 2, 3, 5, 7, 8, 10],           // Natural minor
            'dorian': [0, 2, 3, 5, 7, 9, 10],          // Dorian mode
            'phrygian': [0, 1, 3, 5, 7, 8, 10],        // Phrygian mode
            'lydian': [0, 2, 4, 6, 7, 9, 11],          // Lydian mode
            'mixolydian': [0, 2, 4, 5, 7, 9, 10],      // Mixolydian mode
            'aeolian': [0, 2, 3, 5, 7, 8, 10],         // Aeolian (natural minor)
            'locrian': [0, 1, 3, 5, 6, 8, 10],         // Locrian mode
            'pentatonic-major': [0, 2, 4, 7, 9],       // Major pentatonic
            'pentatonic-minor': [0, 3, 5, 7, 10],      // Minor pentatonic
            'blues': [0, 3, 5, 6, 7, 10],              // Blues scale
            'whole-tone': [0, 2, 4, 6, 8, 10],         // Whole tone
            'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // Chromatic
        };

        // Root note frequencies (C4 = 261.63 Hz)
        const rootFrequencies: { [key: string]: number } = {
            'C': 261.63,
            'C#': 277.18,
            'D': 293.66,
            'D#': 311.13,
            'E': 329.63,
            'F': 349.23,
            'F#': 369.99,
            'G': 392.00,
            'G#': 415.30,
            'A': 440.00,
            'A#': 466.16,
            'B': 493.88
        };

        // Get scale intervals for current scale
        const intervals = scaleIntervals[scale] || scaleIntervals['major'];
        const baseFreq = rootFrequencies[rootNote] || rootFrequencies['C'];

        // Initialize chord progression if needed
        if (this.currentChordProgression.length === 0) {
            this.currentChordProgression = this.generateChordProgression(intervals, scale);
        }

        // Get current chord tones for harmonic foundation
        const currentChord = this.currentChordProgression[this.currentChordIndex];

        // Track position in musical phrase
        const positionInPhrase = this.notesInCurrentPhrase % this.phraseLengthInNotes;
        const isStartOfPhrase = positionInPhrase === 0;
        const isEndOfPhrase = positionInPhrase === this.phraseLengthInNotes - 1;

        // Generate melodic scale degree with context-aware logic
        let scaleDegree: number;

        // Use file hash as a seed for deterministic but varied results
        const fileNameHash = this.hashString(node.title);
        const hashSeed = fileNameHash % 100; // 0-99

        // Phrase boundary logic for musical structure
        if (isStartOfPhrase) {
            // Start phrase on tonic (root note of current chord)
            scaleDegree = currentChord[0];
            logger.debug('phrase-boundary', 'Starting new phrase on tonic', {
                scaleDegree,
                chordIndex: this.currentChordIndex,
                phraseNumber: Math.floor(this.notesInCurrentPhrase / this.phraseLengthInNotes)
            });
        } else if (isEndOfPhrase) {
            // End phrase with cadential motion (resolve to chord tone or approach tonic)
            const isFinalChord = this.currentChordIndex === this.currentChordProgression.length - 1;
            if (isFinalChord) {
                // Final chord - resolve to tonic
                scaleDegree = 0; // Scale degree 0 = tonic
            } else {
                // Other chords - end on chord root or fifth
                scaleDegree = currentChord[hashSeed % 2 === 0 ? 0 : 2]; // Root or fifth
            }
            logger.debug('phrase-boundary', 'Ending phrase with cadence', {
                scaleDegree,
                isFinalChord,
                chordIndex: this.currentChordIndex
            });
        } else {
            // Middle of phrase - use melodic logic
            // 70% chance of step-wise motion (±1 or ±2 scale degrees)
            // 30% chance of chord tone or larger interval
            if (hashSeed < 70 && this.lastScaleDegree !== null) {
                // Prefer step-wise motion from last note
                const stepOptions = [-2, -1, 1, 2]; // Step up or down by 1 or 2 scale degrees
                const stepIndex = hashSeed % stepOptions.length;
                scaleDegree = (this.lastScaleDegree + stepOptions[stepIndex] + intervals.length) % intervals.length;
            } else {
                // Use chord tones for harmonic anchoring
                scaleDegree = currentChord[hashSeed % currentChord.length];
            }
        }

        const semitones = intervals[scaleDegree];

        // Determine octave with more musical mapping
        // Map node properties to octave/register more thoughtfully
        const sizeScore = Math.log10(Math.max(node.fileSize, 1)) / 10; // 0-1
        const connectionScore = Math.min(node.connections.length / 20, 1); // 0-1

        // Folder depth affects register (deeper files = lower octave)
        const folderDepth = (node.path.match(/\//g) || []).length;
        const depthScore = Math.min(folderDepth / 5, 1); // 0-1

        // Combine factors: size up, connections down, depth down
        const octaveScore = sizeScore - connectionScore * 0.5 - depthScore * 0.3;

        // Map to octave range: -1 to +2 (spans 3 octaves, centered on base)
        let octaveOffset = Math.floor(octaveScore * 3) - 1;

        // Phrase contour: higher at middle, lower at ends for arch shape
        if (positionInPhrase >= 2 && positionInPhrase <= 5) {
            octaveOffset += 1; // Peak in middle of phrase
        }

        // Calculate final frequency
        const pitch = baseFreq * Math.pow(2, (semitones + (octaveOffset * 12)) / 12);

        // Update musical state for next note
        this.lastScaleDegree = scaleDegree;

        // Advance chord progression every 4-8 notes
        const notesInChord = 4 + (fileNameHash % 5); // 4-8 notes per chord
        if (this.nodeAppearanceCounter % notesInChord === 0) {
            this.currentChordIndex = (this.currentChordIndex + 1) % this.currentChordProgression.length;
        }

        logger.debug('scale-aware-pitch', 'Generated melodic pitch with musical structure', {
            nodeId: node.id,
            scale,
            rootNote,
            scaleDegree,
            lastScaleDegree: this.lastScaleDegree,
            currentChordIndex: this.currentChordIndex,
            currentChord: currentChord,
            positionInPhrase,
            isStartOfPhrase,
            isEndOfPhrase,
            phraseNumber: Math.floor(this.notesInCurrentPhrase / this.phraseLengthInNotes),
            stepwiseMotion: hashSeed < 70 && !isStartOfPhrase && !isEndOfPhrase,
            folderDepth,
            semitones,
            octaveOffset,
            pitch: pitch.toFixed(2)
        });

        return pitch;
    }

    /**
     * Calculate rhythmic duration with phrase-aware patterns
     * Creates rhythmic variety through phrase position and file properties
     */
    private calculateRhythmicDuration(node: GraphNode, settings: unknown): number {
        const baseDuration = settings.audio.noteDuration || 0.3;

        // Position in current phrase (0-7 for 8-note phrases)
        const positionInPhrase = this.notesInCurrentPhrase % this.phraseLengthInNotes;
        const isStartOfPhrase = positionInPhrase === 0;
        const isEndOfPhrase = positionInPhrase === this.phraseLengthInNotes - 1;

        // File size factor (larger files = longer notes)
        const sizeFactor = Math.log10(Math.max(node.fileSize, 1)) / 10; // 0-0.3

        // Phrase-based rhythmic patterns (DRAMATIC contrasts for clear audibility)
        let rhythmMultiplier = 1.0;

        if (isStartOfPhrase) {
            // Phrase starts: MUCH longer notes for emphasis (downbeat)
            rhythmMultiplier = 3.0;
        } else if (isEndOfPhrase) {
            // Phrase ends: LONGEST notes for cadence/resolution
            rhythmMultiplier = 4.0;
        } else if (positionInPhrase % 2 === 1) {
            // Odd positions (weak beats): VERY short notes for rhythmic contrast
            rhythmMultiplier = 0.3;
        } else if (positionInPhrase === 4) {
            // Middle of phrase: Medium length
            rhythmMultiplier = 1.5;
        }

        // Add occasional syncopation (5% chance for very short notes)
        const fileNameHash = this.hashString(node.title);
        const syncopationChance = fileNameHash % 100;
        if (syncopationChance < 5 && !isStartOfPhrase && !isEndOfPhrase) {
            rhythmMultiplier = 0.4; // Short, syncopated note
        }

        // Calculate final duration
        let duration = baseDuration * rhythmMultiplier + sizeFactor;

        // Add rest/silence probability (10% chance, never on phrase boundaries)
        const restChance = (fileNameHash >> 8) % 100;
        if (restChance < 10 && !isStartOfPhrase && !isEndOfPhrase) {
            duration = 0.05; // Very short "rest" note
            logger.debug('rhythm', 'Inserted musical rest', {
                nodeId: node.id,
                positionInPhrase,
                restChance
            });
        }

        // Clamp to reasonable range
        duration = Math.min(Math.max(duration, 0.05), 3.0);

        logger.debug('rhythm', 'Calculated rhythmic duration', {
            nodeId: node.id,
            baseDuration,
            positionInPhrase,
            isStartOfPhrase,
            isEndOfPhrase,
            rhythmMultiplier,
            sizeFactor,
            finalDuration: duration.toFixed(3)
        });

        return duration;
    }

    /**
     * Calculate dynamic velocity with phrase expression curves
     * Creates musical dynamics through crescendo/diminuendo and accents
     */
    private calculateDynamicVelocity(node: GraphNode, settings: unknown): number {
        const baseVelocity = 0.5;

        // Position in current phrase
        const positionInPhrase = this.notesInCurrentPhrase % this.phraseLengthInNotes;
        const isStartOfPhrase = positionInPhrase === 0;
        const isEndOfPhrase = positionInPhrase === this.phraseLengthInNotes - 1;

        // Phrase expression curve (arch shape: DRAMATIC crescendo then diminuendo)
        let phraseDynamics = 0.0;
        if (positionInPhrase <= 3) {
            // First half: STRONG Crescendo (0.0 -> 0.4)
            phraseDynamics = (positionInPhrase / 3) * 0.4;
        } else {
            // Second half: STRONG Diminuendo (0.4 -> 0.0)
            phraseDynamics = ((this.phraseLengthInNotes - 1 - positionInPhrase) / 4) * 0.4;
        }

        // Accent patterns (MUCH more dramatic)
        let accentBoost = 0.0;

        if (isStartOfPhrase) {
            // VERY strong accent on phrase start (downbeat)
            accentBoost = 0.5;
        } else if (positionInPhrase === 4) {
            // Strong accent at phrase middle
            accentBoost = 0.3;
        } else if (isEndOfPhrase && this.currentChordIndex === this.currentChordProgression.length - 1) {
            // VERY strong accent on final cadence
            accentBoost = 0.6;
        } else if (positionInPhrase % 2 === 1) {
            // Weak beats are MUCH softer
            accentBoost = -0.3;
        }

        // Connection factor (more connections = slightly louder, implies importance)
        const connectionFactor = Math.min(node.connections.length / 20, 0.2);

        // File type factor (certain file types get emphasis)
        let fileTypeBoost = 0.0;
        if (node.type === 'md' || node.type === 'txt') {
            fileTypeBoost = 0.1; // Emphasize note files
        }

        // Combine all factors
        let velocity = baseVelocity + phraseDynamics + accentBoost + connectionFactor + fileTypeBoost;

        // Add subtle random variation (±5%) for humanization
        const fileNameHash = this.hashString(node.title);
        const randomVariation = ((fileNameHash % 10) - 5) / 100; // -0.05 to +0.05
        velocity += randomVariation;

        // Clamp to valid MIDI velocity range (0.1 - 1.0)
        velocity = Math.min(Math.max(velocity, 0.1), 1.0);

        logger.debug('dynamics', 'Calculated dynamic velocity', {
            nodeId: node.id,
            baseVelocity,
            positionInPhrase,
            isStartOfPhrase,
            isEndOfPhrase,
            phraseDynamics: phraseDynamics.toFixed(3),
            accentBoost: accentBoost.toFixed(3),
            connectionFactor: connectionFactor.toFixed(3),
            fileTypeBoost: fileTypeBoost.toFixed(3),
            finalVelocity: velocity.toFixed(3)
        });

        return velocity;
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
                maxEventSpacing: 3.0,
                simultaneousEventLimit: 8,
                eventBatchSize: 10
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
            },
            // Phase 4.4: Connection Type Audio Differentiation - Default Settings
            connectionTypeMapping: {
                enabled: false,
                independentFromContentAware: true,
                mappings: {
                    wikilink: {
                        enabled: true,
                        instrumentFamily: 'strings',
                        intensity: 0.7,
                        audioCharacteristics: {
                            baseVolume: 0.7,
                            volumeVariation: 0.1,
                            noteDuration: 1.0,
                            attackTime: 0.05,
                            releaseTime: 0.8,
                            spatialSpread: 0.3,
                            reverbAmount: 0.2,
                            delayAmount: 0.1,
                            harmonicRichness: 0.6,
                            dissonanceLevel: 0.0,
                            chordsEnabled: false,
                            strengthToVolumeEnabled: true,
                            strengthToVolumeAmount: 0.3,
                            bidirectionalHarmony: true,
                            brokenLinkDissonance: false
                        },
                        linkStrengthAnalysis: {
                            enabled: true,
                            frequencyThreshold: 3,
                            volumeBoost: 1.3,
                            harmonicBoost: 1.2
                        },
                        contextualModifiers: {
                            sameFolderBoost: 1.1,
                            crossFolderReduction: 0.9,
                            recentConnectionBoost: 1.15,
                            timeDecayDays: 30
                        }
                    },
                    embed: {
                        enabled: true,
                        instrumentFamily: 'keyboards',
                        intensity: 0.7,
                        audioCharacteristics: {
                            baseVolume: 0.8,
                            volumeVariation: 0.15,
                            noteDuration: 1.2,
                            attackTime: 0.08,
                            releaseTime: 1.2,
                            spatialSpread: 0.5,
                            reverbAmount: 0.3,
                            delayAmount: 0.2,
                            harmonicRichness: 0.8,
                            dissonanceLevel: 0.0,
                            chordsEnabled: true,
                            strengthToVolumeEnabled: true,
                            strengthToVolumeAmount: 0.4,
                            bidirectionalHarmony: true,
                            brokenLinkDissonance: false
                        },
                        linkStrengthAnalysis: {
                            enabled: true,
                            frequencyThreshold: 3,
                            volumeBoost: 1.3,
                            harmonicBoost: 1.2
                        },
                        contextualModifiers: {
                            sameFolderBoost: 1.1,
                            crossFolderReduction: 0.9,
                            recentConnectionBoost: 1.15,
                            timeDecayDays: 30
                        }
                    },
                    markdown: {
                        enabled: false,
                        instrumentFamily: 'woodwinds',
                        intensity: 0.7,
                        audioCharacteristics: {
                            baseVolume: 0.6,
                            volumeVariation: 0.1,
                            noteDuration: 0.8,
                            attackTime: 0.03,
                            releaseTime: 0.6,
                            spatialSpread: 0.2,
                            reverbAmount: 0.15,
                            delayAmount: 0.05,
                            harmonicRichness: 0.4,
                            dissonanceLevel: 0.0,
                            chordsEnabled: false,
                            strengthToVolumeEnabled: true,
                            strengthToVolumeAmount: 0.2,
                            bidirectionalHarmony: false,
                            brokenLinkDissonance: false
                        },
                        linkStrengthAnalysis: {
                            enabled: true,
                            frequencyThreshold: 3,
                            volumeBoost: 1.3,
                            harmonicBoost: 1.2
                        },
                        contextualModifiers: {
                            sameFolderBoost: 1.1,
                            crossFolderReduction: 0.9,
                            recentConnectionBoost: 1.15,
                            timeDecayDays: 30
                        }
                    },
                    tag: {
                        enabled: false,
                        instrumentFamily: 'ambient',
                        intensity: 0.7,
                        audioCharacteristics: {
                            baseVolume: 0.5,
                            volumeVariation: 0.2,
                            noteDuration: 1.5,
                            attackTime: 0.1,
                            releaseTime: 2.0,
                            spatialSpread: 0.7,
                            reverbAmount: 0.4,
                            delayAmount: 0.3,
                            harmonicRichness: 0.9,
                            dissonanceLevel: 0.0,
                            chordsEnabled: true,
                            strengthToVolumeEnabled: false,
                            strengthToVolumeAmount: 0.0,
                            bidirectionalHarmony: true,
                            brokenLinkDissonance: false
                        },
                        linkStrengthAnalysis: {
                            enabled: false,
                            frequencyThreshold: 3,
                            volumeBoost: 1.0,
                            harmonicBoost: 1.0
                        },
                        contextualModifiers: {
                            sameFolderBoost: 1.0,
                            crossFolderReduction: 1.0,
                            recentConnectionBoost: 1.0,
                            timeDecayDays: 30
                        }
                    }
                },
                globalSettings: {
                    connectionVolumeMix: 0.6,
                    maxSimultaneousConnections: 15,
                    connectionAudioFadeTime: 0.3,
                    enableCaching: true,
                    maxCacheSize: 500,
                    selectiveProcessing: true,
                    highQualityMode: false,
                    antiAliasingEnabled: true,
                    compressionEnabled: true
                },
                currentPreset: 'Default',
                customPresets: [] as Array<{
                    name: string;
                    description: string;
                    author?: string;
                    version?: string;
                    mappings: Record<string, unknown>;
                }>,
                advancedFeatures: {
                    connectionChords: false,
                    contextualHarmony: false,
                    dynamicInstrumentation: false,
                    velocityModulation: true,
                    temporalSpacing: false,
                    crossfadeConnections: false
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
            smartClustering: { ...defaultSettings.smartClustering, ...settings.smartClustering },
            connectionTypeMapping: { ...defaultSettings.connectionTypeMapping, ...settings.connectionTypeMapping }
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
        void this.plugin.saveSettings();

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
        void this.plugin.saveSettings();

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
        void this.plugin.saveSettings();

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
        void this.plugin.saveSettings();

        logger.debug('settings', 'Updated timeline markers visibility', { show });
        
        // Update the timeline markers display
        const markersContainer = this.timelineInfo?.querySelector('.sonic-graph-timeline-markers');
        if (markersContainer) {
            if (show) {
                void markersContainer.addClass('sonigraph-timeline-markers--visible');
            } else {
                void markersContainer.removeClass('sonigraph-timeline-markers--visible');
            }
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
        void this.plugin.saveSettings();

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
        void this.plugin.saveSettings();

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
        void this.plugin.saveSettings();

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
        void this.plugin.saveSettings();

        logger.debug('settings', 'Updated time window', { timeWindow });
        
        // Update temporal animator with new time window
        if (this.temporalAnimator) {
            void this.applyTimeWindowChange(timeWindow);
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
        void this.plugin.saveSettings();

        logger.debug('settings', 'Updated timeline granularity', { granularity });
        
        // Show/hide custom range controls based on selection
        const customRangeElement = this.settingsPanel?.querySelector('.sonic-graph-custom-range');
        if (customRangeElement) {
            if (granularity === 'custom') {
                void customRangeElement.addClass('sonigraph-custom-range--visible');
            } else {
                void customRangeElement.removeClass('sonigraph-custom-range--visible');
            }
        }
        
        // Update temporal animator if available
        if (this.temporalAnimator) {
            void this.applyTimelineGranularityChange(granularity);
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
        void this.plugin.saveSettings();

        logger.debug('settings', 'Updated custom range', { value, unit });
        
        // Update temporal animator if using custom granularity
        if (this.temporalAnimator && this.plugin.settings.sonicGraphSettings.timeline.granularity === 'custom') {
            void this.applyTimelineGranularityChange('custom');
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
        void this.plugin.saveSettings();

        logger.debug('settings', 'Updated event spreading mode', { mode });
        
        // Update temporal animator with new spreading mode
        if (this.temporalAnimator) {
            void this.applyEventSpreadingChange(mode);
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
        void this.setAnimatorLoggingContext();

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
        void this.setAnimatorLoggingContext();

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
                    .filter(([_, config]: [string, unknown]) => config.enabled)
                    .map(([name, _]) => name);
            }
        } catch (error) {
            void logger.debug('ui', 'Could not get active instruments', error);
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
                void enabled.push(instrumentName);
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
    private createFallbackMapping(node: GraphNode, fallbackInstrument: string): unknown {
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

    /**
     * Generate a musically-coherent chord progression
     * Returns array of chord tone arrays (scale degrees)
     */
    private generateChordProgression(scaleIntervals: number[], scaleName: string): number[][] {
        // Common chord progressions based on scale type
        const progressions: { [key: string]: number[][] } = {
            // Major scales use I-IV-V-I or I-V-vi-IV progressions
            'major': [
                [0, 2, 4],      // I (tonic triad)
                [3, 5, 0],      // IV (subdominant)
                [4, 6, 1],      // V (dominant)
                [0, 2, 4]       // I (tonic return)
            ],
            'minor': [
                [0, 2, 4],      // i (tonic minor)
                [3, 5, 0],      // iv (subdominant)
                [4, 6, 1],      // v (dominant minor)
                [0, 2, 4]       // i (tonic return)
            ],
            'dorian': [
                [0, 2, 4],      // i (minor tonic)
                [1, 3, 5],      // ii (major)
                [4, 6, 1],      // V (major)
                [0, 2, 4]       // i (return)
            ],
            'pentatonic-major': [
                [0, 1, 2],      // Pentatonic I
                [2, 3, 4],      // Pentatonic IV
                [1, 2, 3],      // Pentatonic V
                [0, 1, 2]       // Return
            ],
            'pentatonic-minor': [
                [0, 1, 2],      // Minor pentatonic i
                [1, 2, 3],      // Minor pentatonic iv
                [2, 3, 4],      // Minor pentatonic v
                [0, 1, 2]       // Return
            ],
            'blues': [
                [0, 2, 4],      // Blues tonic
                [3, 4, 5],      // Blues IV
                [4, 5, 0],      // Blues V
                [0, 2, 4]       // Return
            ]
        };

        // Get progression for this scale, or use major as default
        let progression = progressions[scaleName] || progressions['major'];

        // Validate scale degrees are within the scale length
        progression = progression.map(chord =>
            chord.map(degree => degree % scaleIntervals.length)
        );

        logger.debug('chord-progression', 'Generated chord progression', {
            scale: scaleName,
            progressionLength: progression.length,
            chords: progression
        });

        return progression;
    }

    // Performance optimization: Event listener management
    private addEventListener(element: Element | Document | Window, event: string, handler: EventListener): void {
        void element.addEventListener(event, handler);
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
        
        void logger.debug('responsive-setup', 'Resize observer set up for responsive graph sizing');
    }

    private scheduleSettingsUpdate(key: string, value: unknown): void {
        this.pendingSettingsUpdates.set(key, value);
        
        if (this.settingsUpdateTimeout) {
            clearTimeout(this.settingsUpdateTimeout);
        }
        
        this.settingsUpdateTimeout = setTimeout(() => {
            void this.flushSettingsUpdates();
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
                // Dynamic property access for layout settings updates
                (currentSettings.layout as DynamicSettings)[layoutKey] = value;
                needsRendererUpdate = true;
            } else {
                // Dynamic property access for settings updates
                (currentSettings as DynamicSettings)[key] = value;
            }
        });
        
        // Single save operation
        void this.plugin.saveSettings();

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
                // Use requestIdleCallback if available (defined in extended types)
                window.requestIdleCallback(() => resolve(callback()));
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
        }
        
        this.progressIndicator.empty();

        const spinner = this.progressIndicator.createDiv({ cls: 'sonic-graph-spinner' });
        spinner.setCssProps({
            width: '20px',
            height: '20px',
            border: '2px solid var(--background-modifier-border)',
            borderTop: '2px solid var(--interactive-accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        });

        this.progressIndicator.createSpan({ text: message });
        this.progressIndicator.addClass('sonigraph-progress-indicator--visible');
    }

    private hideProgressIndicator(): void {
        if (this.progressIndicator) {
            this.progressIndicator.removeClass('sonigraph-progress-indicator--visible');
            // Clear content to stop animations and free memory
            this.progressIndicator.empty();
            // Remove from DOM completely
            this.progressIndicator.remove();
            this.progressIndicator = null;
        }
    }

    /**
     * Update tag influence weight and save to plugin settings
     */
    private updateTagInfluenceWeight(weight: number): void {
        // Performance optimization: Use debounced settings updates
        void this.scheduleSettingsUpdate('contentAwarePositioning.tagInfluence.weight', weight);
        
        logger.debug('content-aware-positioning', 'Tag influence weight updated', { weight });
    }

    /**
     * Update temporal positioning weight and save to plugin settings
     */
    private updateTemporalPositioningWeight(weight: number): void {
        // Performance optimization: Use debounced settings updates
        void this.scheduleSettingsUpdate('contentAwarePositioning.temporalPositioning.weight', weight);
        
        logger.debug('content-aware-positioning', 'Temporal positioning weight updated', { weight });
    }

    /**
     * Update hub centrality weight and save to plugin settings
     */
    private updateHubCentralityWeight(weight: number): void {
        // Performance optimization: Use debounced settings updates
        void this.scheduleSettingsUpdate('contentAwarePositioning.hubCentrality.weight', weight);
        
        logger.debug('content-aware-positioning', 'Hub centrality weight updated', { weight });
    }

    /**
     * Update debug visualization setting and save to plugin settings
     */
    private updateDebugVisualization(enabled: boolean): void {
        // Performance optimization: Use debounced settings updates
        void this.scheduleSettingsUpdate('contentAwarePositioning.debugVisualization', enabled);
        
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
        void this.scheduleSettingsUpdate('smartClustering.algorithm', algorithm);
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
    private updateClusteringVisualization(vizType: 'showClusterLabels' | 'clusterBoundaries' | 'colorScheme', value: unknown): void {
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