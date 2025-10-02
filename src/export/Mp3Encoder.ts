/**
 * MP3 Encoder - Encodes audio data to MP3 format
 *
 * Uses lamejs library for MP3 encoding with configurable bitrate and quality.
 */

// @ts-ignore
import lamejs from 'lamejs';
import { Mp3Quality } from './types';
import { getLogger } from '../logging';

const logger = getLogger('mp3-encoder');

/**
 * Encodes audio buffer to MP3 format
 */
export class Mp3Encoder {
    /**
     * Encode AudioBuffer to MP3
     */
    static encode(audioBuffer: AudioBuffer, quality: Mp3Quality): ArrayBuffer {
        logger.info('mp3-encoder', 'Starting MP3 encoding', {
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration,
            channels: audioBuffer.numberOfChannels,
            targetBitrate: quality.bitRate
        });

        const startTime = performance.now();

        // Get channel data
        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = audioBuffer.numberOfChannels > 1
            ? audioBuffer.getChannelData(1)
            : leftChannel;

        // Resample if needed
        const targetSampleRate = quality.sampleRate;
        const needsResampling = audioBuffer.sampleRate !== targetSampleRate;

        let leftSamples: Int16Array;
        let rightSamples: Int16Array;

        if (needsResampling) {
            logger.debug('mp3-encoder', 'Resampling audio', {
                from: audioBuffer.sampleRate,
                to: targetSampleRate
            });

            leftSamples = this.resampleAndConvert(leftChannel, audioBuffer.sampleRate, targetSampleRate);
            rightSamples = this.resampleAndConvert(rightChannel, audioBuffer.sampleRate, targetSampleRate);
        } else {
            leftSamples = this.convertToInt16(leftChannel);
            rightSamples = this.convertToInt16(rightChannel);
        }

        // Initialize MP3 encoder
        const mp3encoder = new lamejs.Mp3Encoder(
            audioBuffer.numberOfChannels,
            targetSampleRate,
            quality.bitRate
        );

        // Encode in chunks
        const sampleBlockSize = 1152; // Standard MP3 frame size
        const mp3Data: Int8Array[] = [];

        for (let i = 0; i < leftSamples.length; i += sampleBlockSize) {
            const leftChunk = leftSamples.subarray(i, i + sampleBlockSize);
            const rightChunk = rightSamples.subarray(i, i + sampleBlockSize);

            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        // Flush remaining data
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        // Concatenate all chunks
        const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Int8Array(totalLength);
        let offset = 0;

        for (const chunk of mp3Data) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        const endTime = performance.now();
        const encodingTime = endTime - startTime;

        logger.info('mp3-encoder', 'MP3 encoding complete', {
            outputSize: result.byteLength,
            encodingTime: `${encodingTime.toFixed(2)}ms`,
            compressionRatio: (audioBuffer.length * audioBuffer.numberOfChannels * 2 / result.byteLength).toFixed(2)
        });

        return result.buffer;
    }

    /**
     * Convert Float32Array to Int16Array
     */
    private static convertToInt16(float32Array: Float32Array): Int16Array {
        const int16Array = new Int16Array(float32Array.length);

        for (let i = 0; i < float32Array.length; i++) {
            // Clamp to [-1, 1] range
            const sample = Math.max(-1, Math.min(1, float32Array[i]));
            // Convert to 16-bit integer
            int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        return int16Array;
    }

    /**
     * Resample and convert audio data
     */
    private static resampleAndConvert(
        sourceData: Float32Array,
        sourceSampleRate: number,
        targetSampleRate: number
    ): Int16Array {
        const ratio = sourceSampleRate / targetSampleRate;
        const targetLength = Math.ceil(sourceData.length / ratio);
        const result = new Int16Array(targetLength);

        for (let i = 0; i < targetLength; i++) {
            const sourceIndex = i * ratio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;

            // Linear interpolation
            const sample1 = sourceData[index] || 0;
            const sample2 = sourceData[index + 1] || sample1;
            const interpolated = sample1 + (sample2 - sample1) * fraction;

            // Clamp and convert to 16-bit
            const clamped = Math.max(-1, Math.min(1, interpolated));
            result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
        }

        return result;
    }
}
