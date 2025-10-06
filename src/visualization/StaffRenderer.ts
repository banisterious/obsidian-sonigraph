/**
 * Staff Notation Renderer for Visual Note Display
 *
 * Displays notes on a traditional musical staff with treble and bass clefs
 */

import { VisualizationRenderer, VisualizationConfig, NoteEvent } from './NoteVisualizationManager';
import { getLogger } from '../logging';

const logger = getLogger('StaffRenderer');

/**
 * Staff configuration
 */
interface StaffConfig {
    staffLineSpacing: number;
    noteSize: number;
    timeWindow: number; // seconds to display
    staffTopMargin: number;
    staffBottomMargin: number;
}

export class StaffRenderer implements VisualizationRenderer {
    private container: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private config: VisualizationConfig;
    private staffConfig: StaffConfig;

    constructor() {
        this.config = {
            mode: 'staff',
            enabled: true,
            frameRate: 30,
            colorScheme: 'layer',
            showLabels: true,
            showGrid: true,
            enableTrails: false
        };

        this.staffConfig = {
            staffLineSpacing: 10,
            noteSize: 8,
            timeWindow: 10,
            staffTopMargin: 60,
            staffBottomMargin: 20
        };

        logger.debug('initialization', 'StaffRenderer created');
    }

    /**
     * Initialize the renderer with container element
     */
    public initialize(container: HTMLElement): void {
        this.container = container;
        this.container.empty();
        this.container.addClass('staff-notation-container');

        // Create canvas for staff
        this.canvas = this.container.createEl('canvas', {
            cls: 'staff-notation-canvas'
        });

        // Get 2D context
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            logger.error('initialization', 'Failed to get 2D context');
            return;
        }
        this.ctx = ctx;

        // Setup canvas sizing
        this.resizeCanvas();

        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());

        logger.info('initialization', 'StaffRenderer initialized');
    }

    /**
     * Resize canvas to match container
     */
    private resizeCanvas(): void {
        if (!this.canvas || !this.container) return;

        const containerRect = this.container.getBoundingClientRect();

        this.canvas.width = Math.max(containerRect.width, 100);
        this.canvas.height = Math.max(containerRect.height, 200);

        logger.info('resize', 'Staff canvas resized', {
            width: this.canvas.width,
            height: this.canvas.height
        });
    }

    /**
     * Render staff notation
     */
    public render(events: NoteEvent[], currentTime: number): void {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw staff lines
        this.drawStaffLines();

        // Draw clefs
        this.drawClefs();

        // Draw notes
        this.drawNotes(events, currentTime);

        // Draw playhead
        this.drawPlayhead(currentTime, events);
    }

    /**
     * Draw treble and bass staff lines
     */
    private drawStaffLines(): void {
        if (!this.ctx || !this.canvas) return;

        const lineSpacing = this.staffConfig.staffLineSpacing;
        const topMargin = this.staffConfig.staffTopMargin;

        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;

        // Treble staff (5 lines)
        const trebleY = topMargin;
        for (let i = 0; i < 5; i++) {
            const y = trebleY + (i * lineSpacing);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Bass staff (5 lines) - positioned below treble with gap
        const bassY = trebleY + (6 * lineSpacing) + 20;
        for (let i = 0; i < 5; i++) {
            const y = bassY + (i * lineSpacing);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw treble and bass clefs
     */
    private drawClefs(): void {
        if (!this.ctx || !this.canvas) return;

        const topMargin = this.staffConfig.staffTopMargin;
        const lineSpacing = this.staffConfig.staffLineSpacing;

        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = 'bold 40px serif';

        // Treble clef (G clef) - Unicode character
        const trebleY = topMargin + (2 * lineSpacing);
        this.ctx.fillText('𝄞', 10, trebleY + 8);

        // Bass clef (F clef) - Unicode character
        const bassY = topMargin + (6 * lineSpacing) + 20 + (2 * lineSpacing);
        this.ctx.fillText('𝄢', 10, bassY + 8);
    }

    /**
     * Draw notes on the staff
     */
    private drawNotes(events: NoteEvent[], currentTime: number): void {
        if (!this.ctx || !this.canvas) return;

        const maxTimestamp = Math.max(...events.map(e => e.timestamp), currentTime);
        const timelineDuration = Math.max(maxTimestamp, currentTime + this.staffConfig.timeWindow);

        // Layer colors
        const layerColors: Record<string, string> = {
            'rhythmic': '#FF6B35',
            'harmonic': '#4ECDC4',
            'melodic': '#A78BFA',
            'ambient': '#10B981',
            'percussion': '#EF4444'
        };

        events.forEach(event => {
            const x = (event.timestamp / timelineDuration) * this.canvas!.width;
            const y = this.getStaffYPosition(event.pitch);

            // Get color based on layer
            const color = layerColors[event.layer] || '#888888';

            // Check if note is currently playing
            const noteEndTime = event.timestamp + event.duration;
            const isPlaying = currentTime >= event.timestamp && currentTime <= noteEndTime;

            // Draw note head (filled circle)
            this.ctx!.fillStyle = isPlaying ? this.adjustBrightness(color, 40) : color;
            this.ctx!.beginPath();
            this.ctx!.arc(x, y, this.staffConfig.noteSize / 2, 0, Math.PI * 2);
            this.ctx!.fill();

            // Add glow effect if playing
            if (isPlaying) {
                this.ctx!.shadowColor = color;
                this.ctx!.shadowBlur = 10;
                this.ctx!.beginPath();
                this.ctx!.arc(x, y, this.staffConfig.noteSize / 2, 0, Math.PI * 2);
                this.ctx!.fill();
                this.ctx!.shadowBlur = 0;
            }

            // Draw note stem (for quarter notes)
            if (event.duration >= 0.25) {
                this.ctx!.strokeStyle = color;
                this.ctx!.lineWidth = 2;
                this.ctx!.beginPath();
                this.ctx!.moveTo(x + this.staffConfig.noteSize / 2, y);
                this.ctx!.lineTo(x + this.staffConfig.noteSize / 2, y - 30);
                this.ctx!.stroke();
            }
        });
    }

    /**
     * Get Y position on staff for a given pitch
     * Maps MIDI pitch numbers to staff positions
     */
    private getStaffYPosition(pitch: number | string): number {
        if (!this.canvas) return 0;

        // Convert to MIDI pitch number if string
        let midiPitch: number;
        if (typeof pitch === 'string') {
            // Simple conversion for note names like "C4", "G#5"
            const noteMatch = pitch.match(/([A-G][#b]?)(\d+)/);
            if (noteMatch) {
                const noteName = noteMatch[1];
                const octave = parseInt(noteMatch[2]);
                const noteValues: Record<string, number> = {
                    'C': 0, 'C#': 1, 'Db': 1,
                    'D': 2, 'D#': 3, 'Eb': 3,
                    'E': 4,
                    'F': 5, 'F#': 6, 'Gb': 6,
                    'G': 7, 'G#': 8, 'Ab': 8,
                    'A': 9, 'A#': 10, 'Bb': 10,
                    'B': 11
                };
                midiPitch = (octave + 1) * 12 + (noteValues[noteName] || 0);
            } else {
                midiPitch = 60; // Default to middle C
            }
        } else {
            midiPitch = pitch;
        }

        const topMargin = this.staffConfig.staffTopMargin;
        const lineSpacing = this.staffConfig.staffLineSpacing;

        // Middle C (MIDI 60) is between treble and bass staves
        // Each half-step is half a line space
        const middleC = 60;
        const stepsFromMiddleC = midiPitch - middleC;

        // Position middle C between the staves
        const middleCY = topMargin + (5 * lineSpacing) + 10;

        // Each semitone is half a line spacing
        const y = middleCY - (stepsFromMiddleC * (lineSpacing / 2));

        return y;
    }

    /**
     * Draw playhead indicator
     */
    private drawPlayhead(currentTime: number, events: NoteEvent[]): void {
        if (!this.ctx || !this.canvas) return;

        const maxTimestamp = Math.max(...events.map(e => e.timestamp), currentTime);
        const timelineDuration = Math.max(maxTimestamp, currentTime + this.staffConfig.timeWindow);

        const x = (currentTime / timelineDuration) * this.canvas.width;

        // Draw vertical line
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();

        // Draw triangle at top
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x - 5, 10);
        this.ctx.lineTo(x + 5, 10);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Adjust color brightness
     */
    private adjustBrightness(color: string, percent: number): string {
        // Simple brightness adjustment for hex colors
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + percent / 100));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + percent / 100));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + percent / 100));
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<VisualizationConfig>): void {
        this.config = { ...this.config, ...config };
        logger.debug('config', 'Staff renderer config updated', config);
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        this.container = null;
        this.canvas = null;
        this.ctx = null;

        logger.debug('lifecycle', 'StaffRenderer destroyed');
    }
}
