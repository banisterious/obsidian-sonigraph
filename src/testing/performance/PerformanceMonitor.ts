/**
 * PerformanceMonitor - Real-time performance metrics collection
 * 
 * Monitors system and audio performance in real-time during test execution
 * and provides live metrics for display in the test suite UI.
 */

import { PerformanceMetrics } from '../utils/MetricsCollector';

export class PerformanceMonitor {
    private isMonitoring = false;
    private metrics: PerformanceMetrics[] = [];
    private lastSample = 0;
    private sampleInterval = 100; // 100ms
    private intervalId: number | null = null;

    /**
     * Start performance monitoring
     */
    start(): void {
        if (this.isMonitoring) {
            this.stop();
        }

        this.isMonitoring = true;
        this.metrics = [];
        this.lastSample = performance.now();

        this.intervalId = window.setInterval(() => {
            this.collectSample();
        }, this.sampleInterval);
    }

    /**
     * Stop performance monitoring
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isMonitoring = false;
    }

    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): PerformanceMetrics {
        return {
            memory: this.getMemoryMetrics(),
            audio: this.getAudioMetrics(),
            timing: this.getTimingMetrics()
        };
    }

    /**
     * Get historical performance data
     */
    getHistoricalMetrics(): PerformanceMetrics[] {
        return [...this.metrics];
    }

    /**
     * Get performance statistics
     */
    getStatistics(): PerformanceStatistics {
        if (this.metrics.length === 0) {
            return this.getEmptyStatistics();
        }

        return {
            duration: this.metrics.length * this.sampleInterval,
            sampleCount: this.metrics.length,
            memory: this.calculateMemoryStats(),
            audio: this.calculateAudioStats(),
            timing: this.calculateTimingStats()
        };
    }

    /**
     * Clear collected metrics
     */
    clear(): void {
        this.metrics = [];
        this.lastSample = performance.now();
    }

    /**
     * Set sample interval (minimum 50ms)
     */
    setSampleInterval(interval: number): void {
        this.sampleInterval = Math.max(50, interval);
        
        if (this.isMonitoring) {
            this.stop();
            this.start();
        }
    }

    /**
     * Collect a performance sample
     */
    private collectSample(): void {
        const now = performance.now();
        const metrics = this.getCurrentMetrics();
        
        // Add timestamp to metrics
        (metrics as any).timestamp = now;
        (metrics as any).deltaTime = now - this.lastSample;
        
        this.metrics.push(metrics);
        this.lastSample = now;

        // Limit metrics history to prevent memory issues (keep last 1000 samples)
        if (this.metrics.length > 1000) {
            this.metrics.shift();
        }
    }

    /**
     * Get memory performance metrics
     */
    private getMemoryMetrics(): PerformanceMetrics['memory'] {
        const memory = (performance as any).memory;
        
        return {
            heapUsed: memory?.usedJSHeapSize || 0,
            heapTotal: memory?.totalJSHeapSize || 0,
            objectCount: this.estimateObjectCount(memory?.usedJSHeapSize || 0),
            gcCollections: this.estimateGCCollections()
        };
    }

    /**
     * Get audio context performance metrics
     */
    private getAudioMetrics(): PerformanceMetrics['audio'] {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            return {
                cpuUsage: this.estimateCPUUsage(),
                latency: this.calculateLatency(audioContext),
                activeVoices: this.estimateActiveVoices(),
                sampleRate: audioContext.sampleRate,
                bufferSize: this.getBufferSize(audioContext)
            };
        } catch (error) {
            return {
                cpuUsage: 0,
                latency: 0,
                activeVoices: 0,
                sampleRate: 44100,
                bufferSize: 256
            };
        }
    }

    /**
     * Get timing performance metrics
     */
    private getTimingMetrics(): PerformanceMetrics['timing'] {
        return {
            instrumentLoadTime: this.measureInstrumentLoadTime(),
            voiceAllocationTime: this.measureVoiceAllocationTime(),
            effectProcessingTime: this.measureEffectProcessingTime(),
            configLoadTime: this.measureConfigLoadTime()
        };
    }

    /**
     * Estimate object count from heap size
     */
    private estimateObjectCount(heapSize: number): number {
        // Rough estimate: assume average object size of 100 bytes
        return Math.floor(heapSize / 100);
    }

    /**
     * Estimate garbage collection frequency
     */
    private estimateGCCollections(): number {
        // This is a rough estimate - real implementation would track GC events
        const memory = (performance as any).memory;
        if (memory?.usedJSHeapSize && memory?.totalJSHeapSize) {
            const ratio = memory.usedJSHeapSize / memory.totalJSHeapSize;
            return ratio > 0.8 ? 1 : 0; // Likely GC if heap is >80% full
        }
        return 0;
    }

    /**
     * Estimate CPU usage
     */
    private estimateCPUUsage(): number {
        // Simplified CPU estimation based on timing
        const startTime = performance.now();
        
        // Perform a small computational task
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
            sum += Math.random();
        }
        
        const endTime = performance.now();
        const taskTime = endTime - startTime;
        
        // Convert to rough CPU percentage (this is very approximate)
        return Math.min(taskTime * 10, 100);
    }

    /**
     * Calculate audio latency
     */
    private calculateLatency(audioContext: AudioContext): number {
        const baseLatency = audioContext.baseLatency || 0;
        const outputLatency = (audioContext as any).outputLatency || 0;
        return (baseLatency + outputLatency) * 1000; // Convert to milliseconds
    }

    /**
     * Estimate active voices (placeholder)
     */
    private estimateActiveVoices(): number {
        // This would be provided by the actual audio engine
        return 0;
    }

    /**
     * Get audio buffer size
     */
    private getBufferSize(audioContext: AudioContext): number {
        // Try to get buffer size, default to 256
        try {
            const processor = audioContext.createScriptProcessor(256, 1, 1);
            const bufferSize = processor.bufferSize;
            processor.disconnect();
            return bufferSize;
        } catch (error) {
            return 256;
        }
    }

    /**
     * Measure instrument loading time (placeholder)
     */
    private measureInstrumentLoadTime(): number {
        // This would be provided by actual audio engine measurements
        return 0;
    }

    /**
     * Measure voice allocation time (placeholder)
     */
    private measureVoiceAllocationTime(): number {
        // This would be provided by actual audio engine measurements
        return 0;
    }

    /**
     * Measure effect processing time (placeholder)
     */
    private measureEffectProcessingTime(): number {
        // This would be provided by actual audio engine measurements
        return 0;
    }

    /**
     * Measure config loading time (placeholder)
     */
    private measureConfigLoadTime(): number {
        // This would be provided by actual config loader measurements
        return 0;
    }

    /**
     * Calculate memory statistics
     */
    private calculateMemoryStats(): StatRange {
        const heapValues = this.metrics.map(m => m.memory.heapUsed);
        return this.calculateRange(heapValues);
    }

    /**
     * Calculate audio statistics
     */
    private calculateAudioStats(): {
        cpuUsage: StatRange;
        latency: StatRange;
        activeVoices: StatRange;
    } {
        return {
            cpuUsage: this.calculateRange(this.metrics.map(m => m.audio.cpuUsage)),
            latency: this.calculateRange(this.metrics.map(m => m.audio.latency)),
            activeVoices: this.calculateRange(this.metrics.map(m => m.audio.activeVoices))
        };
    }

    /**
     * Calculate timing statistics
     */
    private calculateTimingStats(): {
        instrumentLoadTime: StatRange;
        voiceAllocationTime: StatRange;
        effectProcessingTime: StatRange;
    } {
        return {
            instrumentLoadTime: this.calculateRange(this.metrics.map(m => m.timing.instrumentLoadTime)),
            voiceAllocationTime: this.calculateRange(this.metrics.map(m => m.timing.voiceAllocationTime)),
            effectProcessingTime: this.calculateRange(this.metrics.map(m => m.timing.effectProcessingTime))
        };
    }

    /**
     * Calculate statistical range for values
     */
    private calculateRange(values: number[]): StatRange {
        if (values.length === 0) {
            return { min: 0, max: 0, avg: 0, stdDev: 0 };
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return { min, max, avg, stdDev };
    }

    /**
     * Get empty statistics template
     */
    private getEmptyStatistics(): PerformanceStatistics {
        const emptyRange = { min: 0, max: 0, avg: 0, stdDev: 0 };
        
        return {
            duration: 0,
            sampleCount: 0,
            memory: emptyRange,
            audio: {
                cpuUsage: emptyRange,
                latency: emptyRange,
                activeVoices: emptyRange
            },
            timing: {
                instrumentLoadTime: emptyRange,
                voiceAllocationTime: emptyRange,
                effectProcessingTime: emptyRange
            }
        };
    }
}

// Supporting interfaces
interface StatRange {
    min: number;
    max: number;
    avg: number;
    stdDev: number;
}

interface PerformanceStatistics {
    duration: number;
    sampleCount: number;
    memory: StatRange;
    audio: {
        cpuUsage: StatRange;
        latency: StatRange;
        activeVoices: StatRange;
    };
    timing: {
        instrumentLoadTime: StatRange;
        voiceAllocationTime: StatRange;
        effectProcessingTime: StatRange;
    };
}