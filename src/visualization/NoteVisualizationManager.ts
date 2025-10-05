/**
 * NoteVisualizationManager
 *
 * Central coordinator for visual note display functionality.
 * Manages visualization renderers, note event collection, and synchronization
 * with audio playback.
 */

import { getLogger } from '../logging';

const logger = getLogger('NoteVisualizationManager');

/**
 * Note event data captured from audio engine
 */
export interface NoteEvent {
    /** Note pitch (MIDI number or note name) */
    pitch: string | number;

    /** Note velocity/volume (0-1) */
    velocity: number;

    /** Note duration in seconds */
    duration: number;

    /** Audio layer/instrument identifier */
    layer: 'rhythmic' | 'harmonic' | 'melodic' | 'ambient' | 'percussion';

    /** Timestamp when note was triggered (in seconds from timeline start) */
    timestamp: number;

    /** Graph node ID associated with this note (optional) */
    nodeId?: string;

    /** Whether this note is currently playing */
    isPlaying?: boolean;
}

/**
 * Visualization mode types
 */
export type VisualizationMode = 'piano-roll' | 'spectrum' | 'staff' | 'graph-highlight';

/**
 * Configuration for visualization manager
 */
export interface VisualizationConfig {
    /** Current visualization mode */
    mode: VisualizationMode;

    /** Whether visualization is enabled */
    enabled: boolean;

    /** Target frame rate for rendering (fps) */
    frameRate: number;

    /** Color scheme for notes */
    colorScheme: 'layer' | 'pitch' | 'intensity' | 'high-contrast';

    /** Show note labels */
    showLabels: boolean;

    /** Show timeline grid */
    showGrid: boolean;

    /** Enable trail effects */
    enableTrails: boolean;
}

/**
 * Base interface for visualization renderers
 */
export interface VisualizationRenderer {
    /** Initialize the renderer with container element */
    initialize(container: HTMLElement): void;

    /** Render note events */
    render(events: NoteEvent[], currentTime: number): void;

    /** Update renderer configuration */
    updateConfig(config: Partial<VisualizationConfig>): void;

    /** Clean up renderer resources */
    destroy(): void;
}

/**
 * NoteVisualizationManager
 *
 * Manages the visual note display system:
 * - Collects note events from audio engine
 * - Coordinates visualization renderers
 * - Synchronizes with timeline playback
 * - Handles performance optimization
 */
export class NoteVisualizationManager {
    private config: VisualizationConfig;
    private container: HTMLElement | null = null;
    private renderer: VisualizationRenderer | null = null;
    private noteEvents: NoteEvent[] = [];
    private activeNotes: Set<string> = new Set();
    private animationFrameId: number | null = null;
    private lastRenderTime: number = 0;
    private currentPlaybackTime: number = 0;
    private isRunning: boolean = false;

    constructor(config?: Partial<VisualizationConfig>) {
        this.config = {
            mode: 'piano-roll',
            enabled: true,
            frameRate: 30,
            colorScheme: 'layer',
            showLabels: true,
            showGrid: true,
            enableTrails: false,
            ...config
        };

        logger.debug('initialization', 'NoteVisualizationManager created', this.config);
    }

    /**
     * Initialize the visualization manager with container element
     */
    public initialize(container: HTMLElement): void {
        if (this.container) {
            logger.warn('initialization', 'Manager already initialized, cleaning up first');
            this.destroy();
        }

        this.container = container;
        logger.info('initialization', 'Manager initialized with container');

        // Initialize renderer based on mode
        this.initializeRenderer();
    }

    /**
     * Initialize the appropriate renderer based on current mode
     */
    private initializeRenderer(): void {
        if (!this.container) {
            logger.error('initialization', 'Cannot initialize renderer without container');
            return;
        }

        // Clean up existing renderer
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }

        // TODO: Initialize specific renderer based on mode
        // For now, we'll just log the mode
        logger.info('renderer', `Initializing ${this.config.mode} renderer`);

        // Renderer initialization will be added in next phase
        // this.renderer = new PianoRollRenderer();
        // this.renderer.initialize(this.container);
    }

    /**
     * Add a note event to the visualization
     */
    public addNoteEvent(event: NoteEvent): void {
        this.noteEvents.push(event);

        // Track active notes
        const noteKey = this.getNoteKey(event);
        this.activeNotes.add(noteKey);

        logger.debug('events', 'Note event added', {
            pitch: event.pitch,
            layer: event.layer,
            timestamp: event.timestamp,
            totalEvents: this.noteEvents.length,
            activeNotes: this.activeNotes.size
        });

        // Schedule note end
        if (event.duration > 0) {
            setTimeout(() => {
                this.activeNotes.delete(noteKey);
                logger.debug('events', 'Note ended', { noteKey, activeNotes: this.activeNotes.size });
            }, event.duration * 1000);
        }
    }

    /**
     * Generate unique key for a note event
     */
    private getNoteKey(event: NoteEvent): string {
        return `${event.layer}-${event.pitch}-${event.timestamp}`;
    }

    /**
     * Start visualization rendering loop
     */
    public start(initialTime: number = 0): void {
        if (this.isRunning) {
            logger.warn('lifecycle', 'Visualization already running');
            return;
        }

        this.isRunning = true;
        this.currentPlaybackTime = initialTime;
        this.lastRenderTime = performance.now();

        logger.info('lifecycle', 'Starting visualization', {
            initialTime,
            frameRate: this.config.frameRate,
            mode: this.config.mode
        });

        this.renderLoop();
    }

    /**
     * Stop visualization rendering
     */
    public stop(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        logger.info('lifecycle', 'Visualization stopped');
    }

    /**
     * Update current playback time
     */
    public updatePlaybackTime(time: number): void {
        this.currentPlaybackTime = time;
    }

    /**
     * Main rendering loop
     */
    private renderLoop = (): void => {
        if (!this.isRunning || !this.config.enabled) {
            return;
        }

        const now = performance.now();
        const deltaTime = now - this.lastRenderTime;
        const targetFrameTime = 1000 / this.config.frameRate;

        // Frame rate limiting
        if (deltaTime >= targetFrameTime) {
            this.render();
            this.lastRenderTime = now - (deltaTime % targetFrameTime);
        }

        this.animationFrameId = requestAnimationFrame(this.renderLoop);
    };

    /**
     * Render current frame
     */
    private render(): void {
        if (!this.renderer || !this.container) {
            return;
        }

        try {
            // Get visible note events (within current time window)
            const visibleEvents = this.getVisibleEvents();

            // Render with current renderer
            this.renderer.render(visibleEvents, this.currentPlaybackTime);

        } catch (error) {
            logger.error('rendering', 'Render error', error);
        }
    }

    /**
     * Get note events visible in current time window
     */
    private getVisibleEvents(): NoteEvent[] {
        // Calculate time window (e.g., show events within 10 seconds)
        const timeWindow = 10;
        const startTime = Math.max(0, this.currentPlaybackTime - 2);
        const endTime = this.currentPlaybackTime + timeWindow;

        return this.noteEvents.filter(event => {
            const eventEndTime = event.timestamp + event.duration;
            return event.timestamp <= endTime && eventEndTime >= startTime;
        });
    }

    /**
     * Update visualization configuration
     */
    public updateConfig(config: Partial<VisualizationConfig>): void {
        const oldMode = this.config.mode;
        this.config = { ...this.config, ...config };

        logger.info('config', 'Configuration updated', config);

        // Reinitialize renderer if mode changed
        if (config.mode !== undefined && config.mode !== oldMode) {
            logger.info('config', 'Visualization mode changed, reinitializing renderer');
            this.initializeRenderer();
        }

        // Update renderer config
        if (this.renderer) {
            this.renderer.updateConfig(this.config);
        }
    }

    /**
     * Clear all note events
     */
    public clearEvents(): void {
        this.noteEvents = [];
        this.activeNotes.clear();
        logger.debug('events', 'All note events cleared');
    }

    /**
     * Get current configuration
     */
    public getConfig(): VisualizationConfig {
        return { ...this.config };
    }

    /**
     * Get current note events
     */
    public getEvents(): NoteEvent[] {
        return [...this.noteEvents];
    }

    /**
     * Get active note count
     */
    public getActiveNoteCount(): number {
        return this.activeNotes.size;
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        logger.info('lifecycle', 'Destroying visualization manager');

        this.stop();

        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }

        this.clearEvents();
        this.container = null;

        logger.debug('lifecycle', 'Visualization manager destroyed');
    }
}
