/**
 * Spectrum Analyzer Renderer for Visual Note Display
 *
 * Displays real-time frequency spectrum visualization using Web Audio API
 */

import { VisualizationRenderer, VisualizationConfig, NoteEvent } from './NoteVisualizationManager';
import { getLogger } from '../logging';

const logger = getLogger('SpectrumRenderer');

export class SpectrumRenderer implements VisualizationRenderer {
    private container: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private config: VisualizationConfig;

    // Web Audio API
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private bufferLength: number = 0;

    constructor() {
        this.config = {
            mode: 'spectrum',
            enabled: true,
            frameRate: 60,
            colorScheme: 'layer',
            showLabels: true,
            showGrid: false,
            enableTrails: false
        };

        void logger.debug('initialization', 'SpectrumRenderer created');
    }

    /**
     * Initialize the renderer with container element
     */
    public initialize(container: HTMLElement): void {
        this.container = container;
        this.container.empty();
        this.container.addClass('spectrum-analyzer-container');

        // Create canvas for spectrum
        this.canvas = this.container.createEl('canvas', {
            cls: 'spectrum-analyzer-canvas'
        });

        // Get 2D context
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            void logger.error('initialization', 'Failed to get 2D context');
            return;
        }
        this.ctx = ctx;

        // Setup canvas sizing
        void this.resizeCanvas();

        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());

        void logger.info('initialization', 'SpectrumRenderer initialized');
    }

    /**
     * Connect to Web Audio API for real-time spectrum analysis
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Canvas rendering API uses dynamic types
    public connectToAudioContext(audioContext: AudioContext, sourceNode?: any): void {
        if (!audioContext) {
            void logger.warn('audio', 'No audio context provided for spectrum analyzer');
            return;
        }

        // Create analyser node
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 2048; // FFT size (power of 2)
        this.analyser.smoothingTimeConstant = 0.8; // Smoothing (0-1)

        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        // Connect source to analyser if provided
        // sourceNode might be a Tone.js node, so we need to handle both cases
        if (sourceNode) {
            try {
                // Tone.js nodes have a 'connect' method that works with native Web Audio nodes
                void sourceNode.connect(this.analyser);
                void logger.info('audio', 'Connected source node to spectrum analyzer');
            } catch (error) {
                void logger.error('audio', 'Failed to connect source to analyzer', error);
            }
        }

        logger.info('audio', 'Spectrum analyzer initialized', {
            fftSize: this.analyser.fftSize,
            bufferLength: this.bufferLength,
            hasSourceNode: !!sourceNode
        });
    }

    /**
     * Force resize (public method for when container visibility changes)
     */
    public forceResize(): void {
        void logger.info('resize', 'Force resize requested');
        void this.resizeCanvas();
    }

    /**
     * Resize canvas to match container
     */
    private resizeCanvas(): void {
        if (!this.canvas || !this.container) return;

        const containerRect = this.container.getBoundingClientRect();

        this.canvas.width = Math.max(containerRect.width, 100);
        this.canvas.height = Math.max(containerRect.height, 100);

        logger.info('resize', 'Spectrum canvas resized', {
            width: this.canvas.width,
            height: this.canvas.height
        });
    }

    /**
     * Render spectrum visualization
     * Called by NoteVisualizationManager's render loop
     */
    public render(events: NoteEvent[], currentTime: number): void {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas with dark background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Only draw frequency data if analyser is connected
        if (this.analyser && this.dataArray) {
            // Get frequency data from analyser
            this.analyser.getByteFrequencyData(this.dataArray);

            // Draw frequency bars
            void this.drawFrequencyBars();
        } else {
            // Draw placeholder message if not connected
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('No audio connected', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    /**
     * Draw frequency bars
     */
    private drawFrequencyBars(): void {
        if (!this.ctx || !this.canvas || !this.dataArray) return;

        const barCount = 64; // Number of frequency bars to display
        const barWidth = this.canvas.width / barCount;
        const spacing = 2;

        for (let i = 0; i < barCount; i++) {
            // Map bar index to frequency bin (logarithmic spacing)
            const binIndex = Math.floor((i / barCount) * this.bufferLength);
            const amplitude = this.dataArray[binIndex];

            // Calculate bar height (0-255 amplitude)
            const barHeight = (amplitude / 255) * this.canvas.height;

            // Calculate color based on frequency (low = red, mid = green, high = blue)
            const hue = (i / barCount) * 240; // 0 (red) to 240 (blue)
            const color = `hsl(${hue}, 80%, 50%)`;

            // Draw bar
            const x = i * barWidth;
            const y = this.canvas.height - barHeight;

            this.ctx.fillStyle = color;
            this.ctx.fillRect(x + spacing / 2, y, barWidth - spacing, barHeight);
        }
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<VisualizationConfig>): void {
        this.config = { ...this.config, ...config };
        void logger.debug('config', 'Spectrum analyzer config updated', config);
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        // Disconnect analyser
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        // Clear references
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.dataArray = null;

        void logger.debug('lifecycle', 'SpectrumRenderer destroyed');
    }
}
