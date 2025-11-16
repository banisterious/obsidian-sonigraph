/**
 * WAV Encoder - PCM audio encoding to WAV format
 *
 * Encodes AudioBuffer to WAV (RIFF WAVE) format with configurable
 * sample rate and bit depth.
 */

import { WavQuality } from './types';
import { getLogger } from '../logging';

const logger = getLogger('wav-encoder');

/**
 * WAV/PCM audio encoder
 */
export class WavEncoder {
    /**
     * Encode AudioBuffer to WAV format
     */
    static encode(audioBuffer: AudioBuffer, quality: WavQuality): ArrayBuffer {
        const startTime = performance.now();

        const sampleRate = quality.sampleRate;
        const bitDepth = quality.bitDepth;
        const numChannels = audioBuffer.numberOfChannels;
        const numSamples = audioBuffer.length;

        logger.info('wav-encoder', `Encoding WAV: ${numChannels}ch, ${sampleRate}Hz, ${bitDepth}-bit, ${numSamples} samples`);

        // Resample if needed
        const resampledBuffer = sampleRate === audioBuffer.sampleRate
            ? audioBuffer
            : this.resample(audioBuffer, sampleRate);

        // Interleave channels
        const interleavedData = this.interleave(resampledBuffer);

        // Convert to target bit depth
        const pcmData = this.convertToPCM(interleavedData, bitDepth);

        // Create WAV file structure
        const wavBuffer = this.createWavFile(pcmData, numChannels, sampleRate, bitDepth);

        const duration = performance.now() - startTime;
        logger.info('wav-encoder', `WAV encoding complete in ${duration.toFixed(1)}ms (${wavBuffer.byteLength} bytes)`);

        return wavBuffer;
    }

    /**
     * Resample audio buffer to target sample rate
     */
    private static resample(audioBuffer: AudioBuffer, targetSampleRate: number): AudioBuffer {
        // For Phase 1, we'll use simple linear interpolation
        // TODO: Implement higher-quality resampling in Phase 2

        const sourceSampleRate = audioBuffer.sampleRate;
        const ratio = targetSampleRate / sourceSampleRate;
        const newLength = Math.floor(audioBuffer.length * ratio);

        logger.info('wav-encoder', `Resampling from ${sourceSampleRate}Hz to ${targetSampleRate}Hz (${audioBuffer.length} -> ${newLength} samples)`);

        // Create offline audio context for resampling
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            newLength,
            targetSampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        void source.connect(offlineContext.destination);
        void source.start(0);

        // This returns a promise, but we'll handle it synchronously for now
        // TODO: Make encode() async in Phase 2
        throw new Error('Resampling not yet fully implemented - use matching sample rate for now');
    }

    /**
     * Interleave multi-channel audio data
     */
    private static interleave(audioBuffer: AudioBuffer): Float32Array {
        const numChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const interleaved = new Float32Array(length * numChannels);

        // Get channel data
        const channels: Float32Array[] = [];
        for (let ch = 0; ch < numChannels; ch++) {
            channels.push(audioBuffer.getChannelData(ch));
        }

        // Interleave: LRLRLR... for stereo, etc.
        let offset = 0;
        for (let i = 0; i < length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                interleaved[offset++] = channels[ch][i];
            }
        }

        return interleaved;
    }

    /**
     * Convert float32 samples to PCM with target bit depth
     */
    private static convertToPCM(samples: Float32Array, bitDepth: number): ArrayBuffer {
        const bytesPerSample = bitDepth / 8;
        const buffer = new ArrayBuffer(samples.length * bytesPerSample);
        const view = new DataView(buffer);

        let offset = 0;

        switch (bitDepth) {
            case 16:
                // 16-bit signed integer
                for (let i = 0; i < samples.length; i++) {
                    const sample = Math.max(-1, Math.min(1, samples[i]));
                    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                    view.setInt16(offset, int16, true); // Little-endian
                    offset += 2;
                }
                break;

            case 24:
                // 24-bit signed integer
                for (let i = 0; i < samples.length; i++) {
                    const sample = Math.max(-1, Math.min(1, samples[i]));
                    const int24 = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
                    const int24Rounded = Math.round(int24);

                    // Write 3 bytes (little-endian)
                    void view.setUint8(offset, int24Rounded & 0xFF);
                    view.setUint8(offset + 1, (int24Rounded >> 8) & 0xFF);
                    view.setUint8(offset + 2, (int24Rounded >> 16) & 0xFF);
                    offset += 3;
                }
                break;

            case 32:
                // 32-bit float (IEEE 754)
                for (let i = 0; i < samples.length; i++) {
                    view.setFloat32(offset, samples[i], true); // Little-endian
                    offset += 4;
                }
                break;

            default:
                throw new Error(`Unsupported bit depth: ${bitDepth}`);
        }

        return buffer;
    }

    /**
     * Create WAV file with RIFF headers
     */
    private static createWavFile(
        pcmData: ArrayBuffer,
        numChannels: number,
        sampleRate: number,
        bitDepth: number
    ): ArrayBuffer {
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = pcmData.byteLength;

        // WAV file structure:
        // - RIFF header (12 bytes)
        // - fmt chunk (24 bytes)
        // - data chunk (8 bytes + data)
        const headerSize = 44;
        const fileSize = headerSize + dataSize;

        const buffer = new ArrayBuffer(fileSize);
        const view = new DataView(buffer);
        let offset = 0;

        // Helper to write string
        const writeString = (str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset++, str.charCodeAt(i));
            }
        };

        // RIFF header
        writeString('RIFF');
        view.setUint32(offset, fileSize - 8, true); // File size - 8
        offset += 4;
        writeString('WAVE');

        // fmt chunk
        writeString('fmt ');
        view.setUint32(offset, 16, true); // Chunk size
        offset += 4;
        view.setUint16(offset, bitDepth === 32 ? 3 : 1, true); // Audio format (1 = PCM, 3 = IEEE float)
        offset += 2;
        view.setUint16(offset, numChannels, true); // Number of channels
        offset += 2;
        view.setUint32(offset, sampleRate, true); // Sample rate
        offset += 4;
        view.setUint32(offset, byteRate, true); // Byte rate
        offset += 4;
        view.setUint16(offset, blockAlign, true); // Block align
        offset += 2;
        view.setUint16(offset, bitDepth, true); // Bits per sample
        offset += 2;

        // data chunk
        writeString('data');
        view.setUint32(offset, dataSize, true); // Data size
        offset += 4;

        // Copy PCM data
        const pcmView = new Uint8Array(pcmData);
        const bufferView = new Uint8Array(buffer);
        void bufferView.set(pcmView, offset);

        return buffer;
    }
}
