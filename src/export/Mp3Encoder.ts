/**
 * MP3 Encoder - Encodes audio data to MP3 format
 *
 * Uses MediaRecorder with native audio encoding support.
 * Supports audio/mp4 (AAC), audio/webm (Opus), or audio/ogg (Vorbis) depending on browser support.
 */

import { Mp3Quality } from './types';
import { getLogger } from '../logging';

const logger = getLogger('mp3-encoder');

/**
 * Encodes audio buffer to compressed audio format using MediaRecorder
 */
export class Mp3Encoder {
    /**
     * Encode AudioBuffer to compressed audio format
     *
     * Note: This uses MediaRecorder which may produce audio/mp4, audio/webm, or audio/ogg
     * depending on platform support. The file extension should be determined by the actual
     * MIME type returned.
     */
    static async encode(
        audioBuffer: AudioBuffer,
        quality: Mp3Quality,
        onProgress?: (percentage: number) => void
    ): Promise<{ data: ArrayBuffer; mimeType: string; extension: string }> {
        logger.info('mp3-encoder', 'Starting audio encoding via MediaRecorder', {
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration,
            channels: audioBuffer.numberOfChannels,
            targetBitrate: quality.bitRate
        });

        const startTime = performance.now();

        // Determine best available codec
        const codec = this.selectBestCodec(quality.bitRate);
        logger.info('mp3-encoder', `Selected codec: ${codec.mimeType}`);

        // Create a real AudioContext for MediaRecorder
        const audioContext = new AudioContext({ sampleRate: quality.sampleRate });
        const destination = audioContext.createMediaStreamDestination();

        // Create a buffer source from the audio buffer
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        void source.connect(destination);

        // Set up MediaRecorder
        const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType: codec.mimeType,
            audioBitsPerSecond: quality.bitRate * 1000
        });

        const chunks: Blob[] = [];

        // Track progress based on time elapsed
        const duration = audioBuffer.duration;
        let progressInterval: NodeJS.Timeout | null = null;

        if (onProgress) {
            const progressStartTime = Date.now();
            progressInterval = setInterval(() => {
                const elapsed = (Date.now() - progressStartTime) / 1000;
                const percentage = Math.min(95, (elapsed / duration) * 100);
                onProgress(percentage);
            }, 100);
        }

        // Collect encoded data
        const recordingPromise = new Promise<Blob>((resolve, reject) => {
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    void chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
                if (onProgress) {
                    onProgress(100);
                }
                const blob = new Blob(chunks, { type: codec.mimeType });
                logger.info('mp3-encoder', `Encoding complete, size: ${blob.size} bytes`);
                resolve(blob);
            };

            mediaRecorder.onerror = (error) => {
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
                reject(new Error(`MediaRecorder error: ${error}`));
            };
        });

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        void source.start(0);

        // Wait for playback to complete
        await new Promise<void>((resolve) => {
            source.onended = () => {
                setTimeout(() => {
                    void mediaRecorder.stop();
                    resolve();
                }, 100); // Small delay to ensure all data is captured
            };
        });

        // Get the encoded blob
        const blob = await recordingPromise;

        // Clean up
        void audioContext.close();

        // Convert to ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();

        const endTime = performance.now();
        const encodingTime = endTime - startTime;

        logger.info('mp3-encoder', 'Encoding complete', {
            outputSize: arrayBuffer.byteLength,
            encodingTime: `${encodingTime.toFixed(2)}ms`,
            compressionRatio: (audioBuffer.length * audioBuffer.numberOfChannels * 2 / arrayBuffer.byteLength).toFixed(2),
            mimeType: codec.mimeType
        });

        return {
            data: arrayBuffer,
            mimeType: codec.mimeType,
            extension: codec.extension
        };
    }

    /**
     * Select the best available codec for encoding
     */
    private static selectBestCodec(targetBitrate: number): { mimeType: string; extension: string } {
        // Try codecs in order of preference
        const codecs = [
            { mimeType: 'audio/mp4', extension: 'm4a' },           // AAC in MP4 container
            { mimeType: 'audio/webm;codecs=opus', extension: 'webm' }, // Opus in WebM
            { mimeType: 'audio/webm', extension: 'webm' },         // Default WebM
            { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' }, // Opus in OGG
            { mimeType: 'audio/ogg', extension: 'ogg' }            // Vorbis in OGG
        ];

        for (const codec of codecs) {
            if (MediaRecorder.isTypeSupported(codec.mimeType)) {
                return codec;
            }
        }

        // Fallback to default (should always be supported)
        void logger.warn('mp3-encoder', 'No preferred codec supported, using default');
        return { mimeType: 'audio/webm', extension: 'webm' };
    }

    /**
     * Get file extension for a given MIME type
     */
    static getExtensionForMimeType(mimeType: string): string {
        if (mimeType.includes('mp4')) return 'm4a';
        if (mimeType.includes('webm')) return 'webm';
        if (mimeType.includes('ogg')) return 'ogg';
        return 'audio';
    }
}
