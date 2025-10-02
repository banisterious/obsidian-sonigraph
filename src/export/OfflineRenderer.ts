/**
 * Offline Renderer - Real-time audio recording
 *
 * Phase 1: Records timeline animation in real-time using MediaRecorder
 * Phase 2: Will implement true offline rendering for faster-than-realtime export
 */

import { AudioEngine } from '../audio/engine';
import { TemporalGraphAnimator } from '../graph/TemporalGraphAnimator';
import { ExportConfig } from './types';
import { getLogger } from '../logging';
import { getContext } from 'tone';

const logger = getLogger('offline-renderer');

/**
 * Audio renderer for timeline exports
 */
export class OfflineRenderer {
    private audioEngine: AudioEngine;
    private animator: TemporalGraphAnimator;
    private progressCallback?: (percentage: number) => void;

    constructor(audioEngine: AudioEngine, animator: TemporalGraphAnimator) {
        this.audioEngine = audioEngine;
        this.animator = animator;
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback: (percentage: number) => void): void {
        this.progressCallback = callback;
    }

    /**
     * Render timeline animation to audio buffer
     *
     * Phase 1: Real-time recording approach
     * - Plays animation normally and records audio output
     * - 1:1 realtime speed (60s animation = 60s render time)
     * - Works with existing audio engine without modifications
     */
    async render(config: ExportConfig): Promise<AudioBuffer> {
        const startTime = performance.now();

        // Determine render duration
        const duration = this.calculateDuration(config);
        const sampleRate = (config.quality as any).sampleRate || 48000;

        logger.info('offline-renderer', `Starting real-time render: ${duration}s at ${sampleRate}Hz`);
        logger.info('offline-renderer', 'Phase 1: Using real-time recording (1:1 speed)');

        try {
            // Record the animation in real-time
            const audioBuffer = await this.recordRealtime(duration, sampleRate);

            const renderTime = performance.now() - startTime;
            logger.info('offline-renderer',
                `Render complete: ${duration}s in ${(renderTime / 1000).toFixed(1)}s`
            );

            return audioBuffer;
        } catch (error) {
            logger.error('offline-renderer', 'Render failed:', error);
            throw error;
        }
    }

    /**
     * Record animation in real-time using MediaRecorder
     */
    private async recordRealtime(duration: number, targetSampleRate: number): Promise<AudioBuffer> {
        logger.info('offline-renderer', 'Setting up real-time recording');

        // Get the Tone.js audio context (as BaseAudioContext/AudioContext)
        const audioContext = getContext().rawContext as BaseAudioContext;
        if (!audioContext) {
            throw new Error('Audio context not available');
        }

        // Verify we have an AudioContext with MediaStream support
        if (!('createMediaStreamDestination' in audioContext)) {
            throw new Error('Audio context does not support MediaStream recording');
        }

        const webAudioContext = audioContext as AudioContext;

        // Access the audio engine's master volume node (Tone.js Volume)
        const masterVolume = (this.audioEngine as any).volume;
        if (!masterVolume) {
            throw new Error('Could not access audio engine master volume');
        }

        // Create MediaStreamDestination to capture audio
        const destination = webAudioContext.createMediaStreamDestination();

        // Connect master volume to our recording destination
        // Tone.js Volume extends ToneAudioNode which has _nativeNode
        const volumeNode = masterVolume.output;
        volumeNode.connect(destination);

        // Create MediaRecorder to record the stream
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
        mediaRecorder.start(100); // Collect data every 100ms
        logger.info('offline-renderer', 'Recording started');

        // Reset animator to beginning (use stop then play)
        this.animator.stop();

        // Progress tracking
        const progressStartTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = (Date.now() - progressStartTime) / 1000;
            const progress = Math.min(95, (elapsed / duration) * 50); // Use 0-50% for recording
            if (this.progressCallback) {
                this.progressCallback(10 + progress); // Offset by 10% (validation already done)
            }
        }, 100);

        // Start the animation
        this.animator.play();
        logger.info('offline-renderer', 'Animation started');

        // Wait for animation to complete
        await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                // Access animator config duration through public interface
                const animDuration = duration;

                // Check if animation completed by watching for pause
                // The animator will auto-pause when complete
                const isStillPlaying = (this.animator as any).isPlaying;

                if (!isStillPlaying) {
                    clearInterval(checkInterval);
                    logger.info('offline-renderer', 'Animation playback complete');
                    resolve();
                }
            }, 100);

            // Fallback timeout in case animation doesn't auto-pause
            setTimeout(() => {
                logger.info('offline-renderer', 'Animation timeout reached');
                resolve();
            }, (duration + 2) * 1000); // Add 2s buffer
        });

        // Stop recording
        clearInterval(progressInterval);
        this.animator.pause();

        logger.info('offline-renderer', 'Stopping recording...');
        mediaRecorder.stop();

        // Wait for recording to finish processing
        const blob = await recordingPromise;

        // Disconnect from destination
        volumeNode.disconnect(destination);

        // Update progress
        if (this.progressCallback) {
            this.progressCallback(70);
        }

        // Convert blob to ArrayBuffer
        logger.info('offline-renderer', 'Converting recorded audio to AudioBuffer');
        const arrayBuffer = await blob.arrayBuffer();

        if (this.progressCallback) {
            this.progressCallback(80);
        }

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
     * Calculate render duration based on export scope
     */
    private calculateDuration(config: ExportConfig): number {
        if (config.scope === 'custom-range' && config.customRange) {
            return (config.customRange.end - config.customRange.start) / 1000;
        }

        // Access animator duration through config
        const animConfig = (this.animator as any).config;
        return animConfig ? animConfig.duration : 60;
    }
}
