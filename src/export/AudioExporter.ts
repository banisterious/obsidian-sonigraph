/**
 * Audio Exporter - Main export orchestration class
 *
 * Coordinates the export process: validation, rendering, encoding, and file writing.
 */

import { App, Notice, TFile } from 'obsidian';
import { AudioEngine } from '../audio/engine';
import { TemporalGraphAnimator } from '../graph/TemporalGraphAnimator';
import {
    ExportConfig,
    ExportResult,
    ExportProgress,
    ExportError,
    AudioFormat
} from './types';
import { WavEncoder } from './WavEncoder';
import { OfflineRenderer } from './OfflineRenderer';
import { getLogger } from '../logging';

const logger = getLogger('export');

/**
 * Main audio export orchestrator
 */
export class AudioExporter {
    private app: App;
    private audioEngine: AudioEngine;
    private animator: TemporalGraphAnimator | null = null;
    private isCancelled = false;
    private progressCallback?: (progress: ExportProgress) => void;
    private currentRenderer?: OfflineRenderer;
    private pluginSettings?: any;

    constructor(app: App, audioEngine: AudioEngine, pluginSettings?: any) {
        this.app = app;
        this.audioEngine = audioEngine;
        this.pluginSettings = pluginSettings;
    }

    /**
     * Set the temporal graph animator for timeline exports
     */
    setAnimator(animator: TemporalGraphAnimator): void {
        this.animator = animator;
    }

    /**
     * Set progress callback for real-time updates
     */
    setProgressCallback(callback: (progress: ExportProgress) => void): void {
        this.progressCallback = callback;
    }

    /**
     * Main export method
     */
    async export(config: ExportConfig): Promise<ExportResult> {
        this.isCancelled = false;

        try {
            // Stage 1: Validation
            this.updateProgress('validating', 0, 'Validating export configuration');
            await this.validate(config);

            // Stage 2: Rendering
            this.updateProgress('rendering', 10, 'Rendering audio');
            const audioBuffer = await this.render(config);

            if (this.isCancelled) {
                return { success: false, error: this.createCancelError() };
            }

            // Stage 3: Encoding
            this.updateProgress('encoding', 60, `Encoding to ${config.format.toUpperCase()}`);
            const encodedData = await this.encode(audioBuffer, config);

            if (this.isCancelled) {
                return { success: false, error: this.createCancelError() };
            }

            // Stage 4: Writing
            this.updateProgress('writing', 90, 'Writing file');
            const filePath = await this.writeFile(encodedData, config);

            if (this.isCancelled) {
                await this.cleanup(filePath);
                return { success: false, error: this.createCancelError() };
            }

            // Stage 5: Vault integration (if enabled)
            let notePath: string | undefined;
            if (config.createNote) {
                notePath = await this.createExportNote(config, filePath);
            }

            this.updateProgress('complete', 100, 'Export complete');

            return {
                success: true,
                filePath,
                fileSize: encodedData.byteLength,
                duration: audioBuffer.duration,
                notePath
            };

        } catch (error) {
            logger.error('export', 'Export failed:', error);
            return {
                success: false,
                error: this.createError('unknown', error.message, error)
            };
        }
    }

    /**
     * Cancel ongoing export
     */
    cancel(): void {
        this.isCancelled = true;

        // Cancel the renderer if it's currently running
        if (this.currentRenderer) {
            this.currentRenderer.cancel();
        }

        logger.info('export', 'Export cancelled by user');
    }

    /**
     * Validate export configuration
     */
    private async validate(config: ExportConfig): Promise<void> {
        // Check if audio engine is initialized
        const masterVolume = this.audioEngine.getMasterVolume();
        if (!masterVolume) {
            logger.info('export', 'Audio engine not initialized, initializing now');
            try {
                await this.audioEngine.initialize();
            } catch (error) {
                throw new Error(`Failed to initialize audio engine: ${error.message}`);
            }

            // Verify initialization succeeded
            if (!this.audioEngine.getMasterVolume()) {
                throw new Error('Audio engine initialization did not create master volume');
            }
        }

        // Check if animator is set for timeline exports
        if (config.scope === 'full-timeline' || config.scope === 'custom-range') {
            if (!this.animator) {
                throw new Error('Animator not set for timeline export');
            }
        }

        // Check custom range validity
        if (config.scope === 'custom-range') {
            if (!config.customRange) {
                throw new Error('Custom range not specified');
            }
            if (config.customRange.end <= config.customRange.start) {
                throw new Error('Invalid time range: end must be after start');
            }
        }

        // Check duration limit
        const estimatedDuration = this.estimateDuration(config);
        if (estimatedDuration > config.maxDurationMinutes * 60) {
            throw new Error(`Export duration (${Math.ceil(estimatedDuration / 60)}min) exceeds limit (${config.maxDurationMinutes}min)`);
        }

        // Check if export location exists and is writable
        if (config.locationType === 'vault') {
            const folder = this.app.vault.getAbstractFileByPath(config.location);
            if (!folder) {
                // Try to create folder
                await this.app.vault.createFolder(config.location);
            }
        }

        // Check for file collision
        const fullPath = this.getFullPath(config);
        const exists = await this.fileExists(fullPath);
        if (exists && config.onCollision === 'cancel') {
            throw new Error(`File already exists: ${fullPath}`);
        }

        logger.info('export', 'Export configuration validated');
    }

    /**
     * Render audio based on export scope
     */
    private async render(config: ExportConfig): Promise<AudioBuffer> {
        switch (config.scope) {
            case 'full-timeline':
                return this.renderTimeline(config);

            case 'custom-range':
                return this.renderTimeline(config);

            case 'static-graph':
                return this.renderStaticGraph(config);

            default:
                throw new Error(`Unsupported export scope: ${config.scope}`);
        }
    }

    /**
     * Render timeline animation
     */
    private async renderTimeline(config: ExportConfig): Promise<AudioBuffer> {
        if (!this.animator) {
            throw new Error('Animator not set');
        }

        const renderer = new OfflineRenderer(this.audioEngine, this.animator);
        this.currentRenderer = renderer;

        // Set progress callback for rendering stage
        renderer.setProgressCallback((percentage: number) => {
            // Map rendering progress to 10-60% of total progress
            const mappedPercentage = 10 + (percentage * 0.5);
            this.updateProgress('rendering', mappedPercentage, 'Rendering audio');
        });

        return renderer.render(config);
    }

    /**
     * Render static graph state
     */
    private async renderStaticGraph(config: ExportConfig): Promise<AudioBuffer> {
        // TODO: Implement static graph rendering
        // This will trigger all visible nodes at once
        throw new Error('Static graph export not yet implemented');
    }

    /**
     * Encode audio buffer to target format
     */
    private async encode(audioBuffer: AudioBuffer, config: ExportConfig): Promise<ArrayBuffer> {
        switch (config.format) {
            case 'wav':
                return WavEncoder.encode(audioBuffer, config.quality as any);

            case 'mp3':
                // TODO: Phase 2
                throw new Error('MP3 encoding not yet implemented');

            case 'ogg':
                // TODO: Phase 2
                throw new Error('OGG encoding not yet implemented');

            case 'flac':
                // TODO: Phase 2
                throw new Error('FLAC encoding not yet implemented');

            default:
                throw new Error(`Unsupported format: ${config.format}`);
        }
    }

    /**
     * Write encoded data to file
     */
    private async writeFile(data: ArrayBuffer, config: ExportConfig): Promise<string> {
        const fullPath = this.getFullPath(config);

        // Handle collision
        if (await this.fileExists(fullPath)) {
            switch (config.onCollision) {
                case 'cancel':
                    throw new Error(`File already exists: ${fullPath}`);

                case 'overwrite':
                    // Continue with write
                    break;

                case 'rename':
                    // TODO: Implement auto-rename logic
                    throw new Error('Auto-rename not yet implemented');
            }
        }

        if (config.locationType === 'vault') {
            // Write to vault
            const uint8Array = new Uint8Array(data);
            await this.app.vault.createBinary(fullPath, uint8Array);
        } else {
            // Write to system location
            // TODO: Implement system file writing using Electron's fs
            throw new Error('System location export not yet implemented');
        }

        logger.info('export', `File written: ${fullPath} (${data.byteLength} bytes)`);
        return fullPath;
    }

    /**
     * Create export note in vault
     */
    private async createExportNote(config: ExportConfig, filePath: string): Promise<string> {
        try {
            const { ExportNoteCreator } = require('./ExportNoteCreator');
            const noteCreator = new ExportNoteCreator(this.app);

            // Build result object for note creation
            const result: ExportResult = {
                success: true,
                filePath,
                duration: this.estimateDuration(config)
            };

            // Get file size from written file
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (file && 'stat' in file) {
                result.fileSize = (file as any).stat.size;
            }

            // Create the note with full plugin settings
            const notePath = await noteCreator.createNote(config, result, this.animator, this.pluginSettings);
            logger.info('export', `Export note created: ${notePath}`);
            return notePath;

        } catch (error) {
            logger.error('export', 'Failed to create export note:', error);
            // Don't fail the export if note creation fails
            return '';
        }
    }

    /**
     * Cleanup partial files on cancel/error
     */
    private async cleanup(filePath?: string): Promise<void> {
        if (!filePath) return;

        try {
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (file instanceof TFile) {
                await this.app.vault.delete(file);
                logger.info('export', `Cleaned up partial file: ${filePath}`);
            }
        } catch (error) {
            logger.error('export', `Failed to cleanup file: ${filePath}`, error);
        }
    }

    /**
     * Get full file path with extension
     */
    private getFullPath(config: ExportConfig): string {
        const extension = config.format;
        return `${config.location}/${config.filename}.${extension}`;
    }

    /**
     * Check if file exists
     */
    private async fileExists(path: string): Promise<boolean> {
        const file = this.app.vault.getAbstractFileByPath(path);
        return file !== null;
    }

    /**
     * Estimate export duration in seconds
     */
    private estimateDuration(config: ExportConfig): number {
        if (config.scope === 'custom-range' && config.customRange) {
            return (config.customRange.end - config.customRange.start) / 1000;
        }

        if (this.animator) {
            return this.animator.config.duration;
        }

        // Default estimate for static graph
        return 10;
    }

    /**
     * Update progress
     */
    private updateProgress(stage: ExportProgress['stage'], percentage: number, currentStep: string): void {
        if (this.progressCallback) {
            this.progressCallback({
                stage,
                percentage,
                currentStep
            });
        }
    }

    /**
     * Create error object
     */
    private createError(errorType: string, message: string, originalError?: any): ExportError {
        return {
            timestamp: new Date().toISOString(),
            stage: 'rendering',
            errorType,
            message,
            stackTrace: originalError?.stack
        };
    }

    /**
     * Create cancellation error
     */
    private createCancelError(): ExportError {
        return {
            timestamp: new Date().toISOString(),
            stage: 'rendering',
            errorType: 'cancelled',
            message: 'Export cancelled by user'
        };
    }
}
