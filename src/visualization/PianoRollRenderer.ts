/**
 * PianoRollRenderer
 *
 * Canvas-based renderer for piano roll visualization.
 * Displays notes as horizontal bars on a scrolling timeline with pitch on Y-axis.
 */

import { getLogger } from '../logging';
import type { NoteEvent, VisualizationRenderer, VisualizationConfig } from './NoteVisualizationManager';

const logger = getLogger('PianoRollRenderer');

/**
 * Layer color scheme - matches specification colors
 */
const LAYER_COLORS = {
    rhythmic: '#FF6B35',
    harmonic: '#4ECDC4',
    melodic: '#A78BFA',
    ambient: '#10B981',
    percussion: '#EF4444'
} as const;

/**
 * Piano roll configuration
 */
interface PianoRollConfig {
    /** Pitch range to display */
    minPitch: number;
    maxPitch: number;

    /** Time window in seconds */
    timeWindow: number;

    /** Pixels per second for horizontal scale */
    pixelsPerSecond: number;

    /** Height of each pitch row in pixels */
    pitchRowHeight: number;

    /** Width of pitch label area */
    pitchLabelWidth: number;

    /** Height of timeline area */
    timelineHeight: number;
}

/**
 * PianoRollRenderer
 *
 * Renders a scrolling piano roll visualization using HTML5 Canvas.
 * Features:
 * - Horizontal scrolling timeline synchronized with playback
 * - Vertical pitch axis with note labels
 * - Color-coded notes by layer
 * - Grid lines for measures and pitches
 * - Playhead indicator
 */
export class PianoRollRenderer implements VisualizationRenderer {
    private container: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private config: VisualizationConfig;
    private pianoRollConfig: PianoRollConfig;

    // UI elements
    private pitchLabelsContainer: HTMLElement | null = null;
    private timelineContainer: HTMLElement | null = null;
    private legendContainer: HTMLElement | null = null;

    constructor() {
        this.config = {
            mode: 'piano-roll',
            enabled: true,
            frameRate: 30,
            colorScheme: 'layer',
            showLabels: true,
            showGrid: true,
            enableTrails: false
        };

        this.pianoRollConfig = {
            minPitch: 36, // C2
            maxPitch: 84, // C6
            timeWindow: 10, // Show 10 seconds of timeline
            pixelsPerSecond: 80, // 80 pixels = 1 second
            pitchRowHeight: 16, // Height per pitch
            pitchLabelWidth: 40, // Width of pitch label column
            timelineHeight: 25 // Height of timeline row
        };

        logger.debug('initialization', 'PianoRollRenderer created');
    }

    /**
     * Initialize the renderer with container element
     */
    public initialize(container: HTMLElement): void {
        this.container = container;
        this.container.empty();
        this.container.addClass('piano-roll-container');

        // Create canvas for main piano roll
        this.canvas = this.container.createEl('canvas', {
            cls: 'piano-roll-canvas'
        });

        // Get 2D context
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            logger.error('initialization', 'Failed to get 2D context');
            return;
        }
        this.ctx = ctx;

        // Create pitch labels
        this.createPitchLabels();

        // Create timeline
        this.createTimeline();

        // Create legend
        this.createLegend();

        // Setup canvas sizing
        this.resizeCanvas();

        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());

        logger.info('initialization', 'PianoRollRenderer initialized');
    }

    /**
     * Create pitch labels on left side
     */
    private createPitchLabels(): void {
        if (!this.container) return;

        this.pitchLabelsContainer = this.container.createDiv({
            cls: 'piano-roll-pitch-labels'
        });

        const pitchCount = this.pianoRollConfig.maxPitch - this.pianoRollConfig.minPitch + 1;
        const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        for (let i = 0; i < pitchCount; i++) {
            const pitch = this.pianoRollConfig.maxPitch - i;
            const octave = Math.floor(pitch / 12) - 1;
            const note = noteName[pitch % 12];

            // Only show C notes and octave markers for clarity
            if (pitch % 12 === 0 || i % 4 === 0) {
                const label = this.pitchLabelsContainer.createDiv({
                    cls: 'piano-roll-pitch-label',
                    text: `${note}${octave}`
                });

                const topPosition = i * this.pianoRollConfig.pitchRowHeight;
                label.style.top = `${topPosition}px`;
            }
        }
    }

    /**
     * Create timeline with time markers
     */
    private createTimeline(): void {
        if (!this.container) return;

        this.timelineContainer = this.container.createDiv({
            cls: 'piano-roll-timeline'
        });

        // Timeline markers will be drawn on canvas
    }

    /**
     * Create legend showing layer colors
     */
    private createLegend(): void {
        if (!this.container) return;

        this.legendContainer = this.container.createDiv({
            cls: 'piano-roll-legend'
        });

        Object.entries(LAYER_COLORS).forEach(([layer, color]) => {
            const legendItem = this.legendContainer!.createDiv({
                cls: 'piano-roll-legend-item'
            });

            const colorDot = legendItem.createDiv({
                cls: 'piano-roll-legend-color'
            });
            colorDot.setCssStyles({ '--legend-color': color });

            legendItem.createSpan({
                text: layer.charAt(0).toUpperCase() + layer.slice(1),
                cls: 'piano-roll-legend-text'
            });
        });
    }

    /**
     * Resize canvas to match container
     */
    private resizeCanvas(): void {
        if (!this.canvas || !this.container) return;

        const containerRect = this.container.getBoundingClientRect();
        const pitchCount = this.pianoRollConfig.maxPitch - this.pianoRollConfig.minPitch + 1;

        // Set canvas size
        this.canvas.width = containerRect.width - this.pianoRollConfig.pitchLabelWidth;
        this.canvas.height = pitchCount * this.pianoRollConfig.pitchRowHeight;

        logger.debug('resize', 'Canvas resized', {
            width: this.canvas.width,
            height: this.canvas.height
        });
    }

    /**
     * Render note events
     */
    public render(events: NoteEvent[], currentTime: number): void {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid if enabled
        if (this.config.showGrid) {
            this.drawGrid();
        }

        // Draw notes
        this.drawNotes(events, currentTime);

        // Draw playhead
        this.drawPlayhead(currentTime);
    }

    /**
     * Draw grid lines
     */
    private drawGrid(): void {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const pitchCount = this.pianoRollConfig.maxPitch - this.pianoRollConfig.minPitch + 1;

        // Horizontal pitch lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i <= pitchCount; i++) {
            const y = i * this.pianoRollConfig.pitchRowHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Vertical time lines (every second)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        const secondWidth = this.pianoRollConfig.pixelsPerSecond;

        for (let i = 0; i < this.canvas.width / secondWidth; i++) {
            const x = i * secondWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
    }

    /**
     * Draw note bars
     */
    private drawNotes(events: NoteEvent[], currentTime: number): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const scrollOffset = currentTime * this.pianoRollConfig.pixelsPerSecond;

        events.forEach(event => {
            // Calculate position
            const x = (event.timestamp * this.pianoRollConfig.pixelsPerSecond) - scrollOffset;
            const width = (event.duration * this.pianoRollConfig.pixelsPerSecond);

            // Skip if outside visible area
            if (x + width < 0 || x > this.canvas!.width) return;

            // Get pitch (convert MIDI number or note name to pitch)
            const pitch = typeof event.pitch === 'number' ? event.pitch : this.noteToPitch(event.pitch);
            const pitchIndex = this.pianoRollConfig.maxPitch - pitch;
            const y = pitchIndex * this.pianoRollConfig.pitchRowHeight;
            const height = this.pianoRollConfig.pitchRowHeight - 2; // 2px gap

            // Skip if pitch is out of range
            if (pitchIndex < 0 || pitchIndex > (this.pianoRollConfig.maxPitch - this.pianoRollConfig.minPitch)) {
                return;
            }

            // Get color based on layer
            const color = LAYER_COLORS[event.layer] || '#888888';

            // Draw note bar with gradient
            const gradient = ctx.createLinearGradient(x, y, x + width, y);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.adjustBrightness(color, -20));

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y + 1, width, height);

            // Add border
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y + 1, width, height);

            // Highlight if currently playing
            if (event.isPlaying) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(x, y + 1, width, height);
            }
        });
    }

    /**
     * Draw playhead indicator
     */
    private drawPlayhead(currentTime: number): void {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const x = this.canvas.width / 4; // Playhead at 25% from left

        // Draw playhead line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvas.height);
        ctx.stroke();

        // Draw playhead triangle at top
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 5, 8);
        ctx.lineTo(x + 5, 8);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Convert note name to MIDI pitch number
     */
    private noteToPitch(note: string): number {
        const noteMap: Record<string, number> = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        // Parse note name (e.g., "C4", "F#5")
        const match = note.match(/^([A-G][#b]?)(\d+)$/);
        if (!match) return 60; // Default to middle C

        const noteName = match[1];
        const octave = parseInt(match[2]);

        return (octave + 1) * 12 + (noteMap[noteName] || 0);
    }

    /**
     * Adjust color brightness
     */
    private adjustBrightness(color: string, amount: number): string {
        // Parse hex color
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Update renderer configuration
     */
    public updateConfig(config: Partial<VisualizationConfig>): void {
        this.config = { ...this.config, ...config };
        logger.debug('config', 'Configuration updated', config);
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        logger.info('lifecycle', 'Destroying PianoRollRenderer');

        // Remove event listeners
        window.removeEventListener('resize', () => this.resizeCanvas());

        // Clear canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Clear references
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.pitchLabelsContainer = null;
        this.timelineContainer = null;
        this.legendContainer = null;

        logger.debug('lifecycle', 'PianoRollRenderer destroyed');
    }
}
