import { getLogger } from '../../logging';

const logger = getLogger('memory-monitor');

export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    usagePercentage: number;
    pressure: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Monitors memory usage and provides pressure indicators
 * Helps adapt behavior based on available memory
 */
export class MemoryMonitor {
    private lastGC: number = Date.now();
    private gcInterval: number = 30000; // 30 seconds
    private memoryHistory: MemoryMetrics[] = [];
    private maxHistorySize: number = 10;
    
    // Memory pressure thresholds (percentage of heap limit)
    private readonly thresholds = {
        low: 0.5,      // < 50%
        medium: 0.7,   // 50-70%
        high: 0.85,    // 70-85%
        critical: 0.95 // > 85%
    };
    
    /**
     * Get current memory metrics
     */
    getCurrentMetrics(): MemoryMetrics {
        interface PerformanceWithMemory {
            memory?: {
                usedJSHeapSize: number;
                totalJSHeapSize: number;
                jsHeapSizeLimit: number;
            };
        }
        const memory = (performance as unknown as PerformanceWithMemory).memory || {
            usedJSHeapSize: 0,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0
        };
        
        const heapUsed = memory.usedJSHeapSize;
        const heapTotal = memory.totalJSHeapSize;
        const heapLimit = memory.jsHeapSizeLimit;
        const usagePercentage = heapLimit > 0 ? (heapUsed / heapLimit) : 0;
        
        let pressure: MemoryMetrics['pressure'] = 'low';
        if (usagePercentage >= this.thresholds.critical) {
            pressure = 'critical';
        } else if (usagePercentage >= this.thresholds.high) {
            pressure = 'high';
        } else if (usagePercentage >= this.thresholds.medium) {
            pressure = 'medium';
        }
        
        const metrics: MemoryMetrics = {
            heapUsed,
            heapTotal,
            heapLimit,
            usagePercentage,
            pressure
        };
        
        // Track history
        this.memoryHistory.push(metrics);
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }
        
        return metrics;
    }
    
    /**
     * Check if we should trigger garbage collection
     */
    shouldTriggerGC(): boolean {
        const now = Date.now();
        const timeSinceLastGC = now - this.lastGC;
        
        if (timeSinceLastGC < this.gcInterval) {
            return false;
        }
        
        const metrics = this.getCurrentMetrics();
        
        // Trigger GC if memory pressure is high
        if (metrics.pressure === 'high' || metrics.pressure === 'critical') {
            this.lastGC = now;
            return true;
        }
        
        // Also trigger if we've seen consistent growth
        if (this.hasConsistentGrowth()) {
            this.lastGC = now;
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if memory has been consistently growing
     */
    private hasConsistentGrowth(): boolean {
        if (this.memoryHistory.length < 3) return false;
        
        let growthCount = 0;
        for (let i = 1; i < this.memoryHistory.length; i++) {
            if (this.memoryHistory[i].heapUsed > this.memoryHistory[i - 1].heapUsed) {
                growthCount++;
            }
        }
        
        // If 80% of samples show growth, we have consistent growth
        return growthCount / (this.memoryHistory.length - 1) > 0.8;
    }
    
    /**
     * Get memory pressure level for adaptive behavior
     */
    getMemoryPressure(): MemoryMetrics['pressure'] {
        return this.getCurrentMetrics().pressure;
    }
    
    /**
     * Get recommended limits based on memory pressure
     */
    getRecommendedLimits(): {
        maxVoices: number;
        maxEffects: number;
        bufferSize: number;
        updateInterval: number;
    } {
        const pressure = this.getMemoryPressure();
        
        switch (pressure) {
            case 'critical':
                return {
                    maxVoices: 2,
                    maxEffects: 1,
                    bufferSize: 256,
                    updateInterval: 1000 // Slower updates
                };
            case 'high':
                return {
                    maxVoices: 4,
                    maxEffects: 2,
                    bufferSize: 512,
                    updateInterval: 500
                };
            case 'medium':
                return {
                    maxVoices: 6,
                    maxEffects: 3,
                    bufferSize: 1024,
                    updateInterval: 200
                };
            case 'low':
            default:
                return {
                    maxVoices: 8,
                    maxEffects: 4,
                    bufferSize: 2048,
                    updateInterval: 100
                };
        }
    }
    
    /**
     * Log memory statistics
     */
    logStats(): void {
        const metrics = this.getCurrentMetrics();
        const stats = {
            heapUsedMB: (metrics.heapUsed / 1024 / 1024).toFixed(2),
            heapTotalMB: (metrics.heapTotal / 1024 / 1024).toFixed(2),
            heapLimitMB: (metrics.heapLimit / 1024 / 1024).toFixed(2),
            usagePercentage: (metrics.usagePercentage * 100).toFixed(1),
            pressure: metrics.pressure
        };
        
        void logger.info('memory-stats', 'Current memory usage', stats);
    }
    
    /**
     * Force garbage collection if available (requires --expose-gc flag)
     */
    forceGarbageCollection(): boolean {
        interface GlobalWithGC {
            gc?: () => void;
        }
        const globalWithGC = global as unknown as GlobalWithGC;
        if (typeof globalWithGC.gc === 'function') {
            void globalWithGC.gc();
            void logger.debug('garbage-collection', 'Manual GC triggered');
            return true;
        }
        return false;
    }
    
    /**
     * Clear history to free memory
     */
    clearHistory(): void {
        this.memoryHistory = [];
    }
}