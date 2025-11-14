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
import { Mp3Encoder } from './Mp3Encoder';
import { OfflineRenderer } from './OfflineRenderer';
import { NoteCentricMapping } from '../audio/mapping/NoteCentricMapper';
import { NoteCentricPlayer } from '../audio/playback/NoteCentricPlayer';
import { getLogger } from '../logging';
import type { SonigraphSettings } from '../utils/constants';

const logger = getLogger('export');

/**
 * Main audio export orchestrator
 */
export class AudioExporter {
    private app: App;
    private audioEngine: AudioEngine;
    private animator: TemporalGraphAnimator | null = null;
    private noteCentricMapping: NoteCentricMapping | null = null;
    private isCancelled = false;
    private progressCallback?: (progress: ExportProgress) => void;
    private currentRenderer?: OfflineRenderer;
    private pluginSettings?: SonigraphSettings;
    private pluginVersion: string;

    constructor(app: App, audioEngine: AudioEngine, pluginSettings?: SonigraphSettings, pluginVersion: string = '0.14.2') {
        this.app = app;
        this.audioEngine = audioEngine;
        this.pluginSettings = pluginSettings;
        this.pluginVersion = pluginVersion;
    }

    /**
     * Set the temporal graph animator for timeline exports
     */
    setAnimator(animator: TemporalGraphAnimator): void {
        this.animator = animator;
    }

    /**
     * Set note-centric mapping for static graph exports
     */
    setNoteCentricMapping(mapping: NoteCentricMapping): void {
        this.noteCentricMapping = mapping;
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
            const encodeResult = await this.encode(audioBuffer, config);

            if (this.isCancelled) {
                return { success: false, error: this.createCancelError() };
            }

            // Update config with actual extension if encoder provided one
            // (e.g., MP3 may become M4A, WebM, or OGG depending on platform support)
            if (encodeResult.extension) {
                config.format = encodeResult.extension as AudioFormat;
            }

            // Stage 4: Writing
            this.updateProgress('writing', 90, 'Writing file');
            const filePath = await this.writeFile(encodeResult.data, config);

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
                fileSize: encodeResult.data.byteLength,
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
        } else {
            // System location - ensure directory exists
            const fs = require('fs');
            const path = require('path');
            const dirPath = path.isAbsolute(config.location) ? config.location : path.resolve(config.location);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
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
     * Render static graph state using note-centric playback
     */
    private async renderStaticGraph(config: ExportConfig): Promise<AudioBuffer> {
        if (!this.noteCentricMapping) {
            throw new Error('Note-centric mapping not set for static graph export');
        }

        logger.info('offline-renderer', 'Starting note-centric static graph render');

        // Import NoteCentricPlayer
        const { NoteCentricPlayer } = require('../audio/playback/NoteCentricPlayer');
        const player = new NoteCentricPlayer(this.audioEngine, this.pluginSettings);

        // Calculate total duration from note-centric mapping
        const duration = this.estimateNoteCentricDuration(this.noteCentricMapping);

        const qualitySettings = config.quality as { sampleRate?: number };
        const sampleRate = qualitySettings.sampleRate || 48000;

        logger.info('offline-renderer', `Rendering note-centric audio: ${duration.toFixed(1)}s at ${sampleRate}Hz`);

        try {
            // Record the note-centric playback in real-time
            const audioBuffer = await this.recordNoteCentricPlayback(
                player,
                this.noteCentricMapping,
                duration,
                sampleRate
            );

            logger.info('offline-renderer', 'Note-centric render complete');
            return audioBuffer;
        } catch (error) {
            logger.error('offline-renderer', 'Note-centric render failed:', error);
            throw error;
        }
    }

    /**
     * Estimate duration of note-centric mapping in seconds
     */
    private estimateNoteCentricDuration(mapping: NoteCentricMapping): number {
        // Calculate center phrase duration with validation
        const centerBeats = mapping.centerPhrase.totalBeats || 0;
        const centerTempo = mapping.centerPhrase.tempo || 120;
        const centerDuration = (centerBeats / centerTempo) * 60;

        // Validate center duration
        if (isNaN(centerDuration) || centerDuration <= 0) {
            logger.warn('duration-estimate', 'Invalid center phrase duration, using default', {
                totalBeats: centerBeats,
                tempo: centerTempo
            });
            return 10; // Fallback to 10 seconds
        }

        // Find longest embellishment duration
        let maxEmbellishmentDuration = 0;
        for (const embellishment of mapping.embellishments) {
            const beats = embellishment.phrase.totalBeats || 0;
            const tempo = embellishment.phrase.tempo || 120;
            const duration = (beats / tempo) * 60;

            if (!isNaN(duration) && duration > 0) {
                maxEmbellishmentDuration = Math.max(maxEmbellishmentDuration, duration);
            }
        }

        // Total duration is the longer of the two, plus 2s buffer for reverb tails
        const totalDuration = Math.max(centerDuration, maxEmbellishmentDuration) + 2;

        logger.info('duration-estimate', 'Estimated note-centric duration', {
            centerDuration: centerDuration.toFixed(1),
            maxEmbellishmentDuration: maxEmbellishmentDuration.toFixed(1),
            totalDuration: totalDuration.toFixed(1)
        });

        return totalDuration;
    }

    /**
     * Record note-centric playback using MediaRecorder
     */
    private async recordNoteCentricPlayback(
        player: NoteCentricPlayer,
        mapping: NoteCentricMapping,
        duration: number,
        targetSampleRate: number
    ): Promise<AudioBuffer> {
        // Get Tone.js audio context
        const { getContext } = require('tone');
        const audioContext = getContext().rawContext as BaseAudioContext;

        if (!audioContext) {
            throw new Error('Audio context not available');
        }

        if (!('createMediaStreamDestination' in audioContext)) {
            throw new Error('Audio context does not support MediaStream recording');
        }

        const webAudioContext = audioContext as AudioContext;

        // Access the audio engine's master volume node
        const masterVolume = this.audioEngine.getMasterVolume();
        if (!masterVolume) {
            throw new Error('Could not access audio engine master volume');
        }

        // Create MediaStreamDestination to capture audio
        const destination = webAudioContext.createMediaStreamDestination();

        // Connect master volume to recording destination
        const volumeNode = masterVolume.output;
        volumeNode.connect(destination);

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        // Track recording state
        const recordingPromise = new Promise<Blob>((resolve, reject) => {
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                logger.info('offline-renderer', `Recording stopped, captured ${blob.size} bytes`);
                resolve(blob);
            };

            mediaRecorder.onerror = (error) => {
                reject(new Error(`MediaRecorder error: ${error}`));
            };
        });

        // Start recording
        mediaRecorder.start(100);
        logger.info('offline-renderer', 'Recording started');

        // Progress tracking
        const progressStartTime = Date.now();
        const progressInterval = setInterval(() => {
            if (this.isCancelled) {
                clearInterval(progressInterval);
                return;
            }
            const elapsed = (Date.now() - progressStartTime) / 1000;
            // Ensure duration is valid to prevent NaN
            const validDuration = Math.max(1, duration || 10);
            const progress = Math.min(95, (elapsed / validDuration) * 50);
            if (!isNaN(progress)) {
                this.updateProgress('rendering', 10 + progress, 'Recording audio');
            }
        }, 100);

        // Start playback
        await player.play(mapping);
        logger.info('offline-renderer', 'Note-centric playback started');

        // Wait for playback to complete or cancellation
        await new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
                // Check for cancellation
                if (this.isCancelled) {
                    clearInterval(checkInterval);
                    player.stop();
                    logger.info('offline-renderer', 'Render cancelled by user');
                    reject(new Error('Export cancelled by user'));
                    return;
                }

                // Check if playback finished
                if (!player.getIsPlaying()) {
                    clearInterval(checkInterval);
                    logger.info('offline-renderer', 'Note-centric playback complete');
                    resolve();
                }
            }, 100);

            // Fallback timeout
            setTimeout(() => {
                if (!this.isCancelled) {
                    clearInterval(checkInterval);
                    logger.info('offline-renderer', 'Playback timeout reached');
                    resolve();
                }
            }, (duration + 2) * 1000);
        });

        // Stop recording
        clearInterval(progressInterval);
        logger.info('offline-renderer', 'Stopping recording...');
        mediaRecorder.stop();

        // Wait for recording to finish
        const blob = await recordingPromise;

        // Disconnect from destination
        volumeNode.disconnect(destination);

        // Update progress
        this.updateProgress('rendering', 70, 'Converting audio format');

        // Convert blob to ArrayBuffer
        logger.info('offline-renderer', 'Converting recorded audio to AudioBuffer');
        const arrayBuffer = await blob.arrayBuffer();

        this.updateProgress('rendering', 80, 'Decoding audio data');

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        logger.info('offline-renderer', `Audio decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz`);

        // Resample if needed
        if (audioBuffer.sampleRate !== targetSampleRate) {
            logger.info('offline-renderer', `Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz`);
            return await this.resampleBuffer(audioBuffer, targetSampleRate);
        }

        return audioBuffer;
    }

    /**
     * Resample audio buffer to target sample rate
     */
    private async resampleBuffer(sourceBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
        // Create offline context with target sample rate
        const offlineContext = new OfflineAudioContext(
            sourceBuffer.numberOfChannels,
            Math.ceil(sourceBuffer.duration * targetSampleRate),
            targetSampleRate
        );

        // Create buffer source
        const source = offlineContext.createBufferSource();
        source.buffer = sourceBuffer;
        source.connect(offlineContext.destination);
        source.start(0);

        // Render
        const resampled = await offlineContext.startRendering();
        logger.info('offline-renderer', 'Resampling complete');

        return resampled;
    }

    /**
     * Encode audio buffer to target format
     * Returns encoded data and actual format info (since MP3 may become M4A/WebM/OGG)
     */
    private async encode(audioBuffer: AudioBuffer, config: ExportConfig): Promise<{ data: ArrayBuffer; extension?: string }> {
        switch (config.format) {
            case 'wav':
                return { data: WavEncoder.encode(audioBuffer, config.quality as { sampleRate: number; bitDepth: number }) };

            case 'mp3': {
                const result = await Mp3Encoder.encode(
                    audioBuffer,
                    config.quality as { sampleRate: number; bitRate: number },
                    (percentage) => {
                        // Map encoding progress to 60-90% of total progress
                        const mappedPercentage = 60 + (percentage * 0.3);
                        this.updateProgress('encoding', mappedPercentage, 'Encoding to compressed audio');
                    }
                );
                return { data: result.data, extension: result.extension };
            }

            case 'ogg':
                // TODO: Phase 2 (optional)
                throw new Error('OGG encoding not yet implemented');

            case 'flac':
                // TODO: Phase 2 (optional)
                throw new Error('FLAC encoding not yet implemented');

            default:
                throw new Error(`Unsupported format: ${config.format as string}`);
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
            // Write to system location using Node.js fs
            const uint8Array = new Uint8Array(data);
            const fs = require('fs');
            const path = require('path');

            // Ensure directory exists
            const dirPath = path.dirname(fullPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Write file
            await new Promise<void>((resolve, reject) => {
                fs.writeFile(fullPath, uint8Array, (err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
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
            const noteCreator = new ExportNoteCreator(this.app, this.pluginVersion);

            // Build result object for note creation
            const result: ExportResult = {
                success: true,
                filePath,
                duration: this.estimateDuration(config)
            };

            // Get file size from written file
            if (config.locationType === 'system') {
                // System location - use fs.statSync
                try {
                    const fs = require('fs');
                    const stats = fs.statSync(filePath);
                    result.fileSize = stats.size;
                } catch (error) {
                    logger.warn('export', 'Could not get file size from system location', error);
                }
            } else {
                // Vault location - use Obsidian API
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile) {
                    result.fileSize = file.stat.size;
                }
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
                await this.app.fileManager.trashFile(file);
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

        // Use path.join for system paths to handle path separators correctly
        if (config.locationType === 'system') {
            const path = require('path');
            return path.join(config.location, `${config.filename}.${extension}`);
        }

        // Vault paths use forward slash
        return `${config.location}/${config.filename}.${extension}`;
    }

    /**
     * Check if file exists (supports both vault and system paths)
     */
    private async fileExists(path: string): Promise<boolean> {
        // Check if it's a vault path (relative) or system path (absolute)
        const isSystemPath = require('path').isAbsolute(path);

        if (isSystemPath) {
            // System path - use fs
            const fs = require('fs');
            return fs.existsSync(path);
        } else {
            // Vault path - use Obsidian API
            const file = this.app.vault.getAbstractFileByPath(path);
            return file !== null;
        }
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

        // Use note-centric mapping duration if available
        if (this.noteCentricMapping) {
            return this.estimateNoteCentricDuration(this.noteCentricMapping);
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
    private createError(errorType: string, message: string, originalError?: unknown): ExportError {
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
