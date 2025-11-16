import { 
    VoiceAssignment, 
    VoiceConfig, 
    VoicePool, 
    VoiceMetrics, 
    PerformanceMetrics,
    QualityLevel,
    VoiceAssignmentStrategy,
    MusicalMapping
} from './types';
import { getLogger } from '../../logging';

const logger = getLogger('voice-manager');

export class VoiceManager {
    private voiceAssignments: Map<string, VoiceAssignment> = new Map();
    private voicePool: Map<string, VoicePool[]> = new Map();
    private voiceConfigs: Map<string, VoiceConfig> = new Map();
    
    // Performance tracking
    private maxVoicesPerInstrument = 8;
    private currentQualityLevel: QualityLevel = 'high';
    private adaptiveQuality: boolean = true;
    private lastCleanup: number = Date.now();
    
    // Voice assignment strategy
    private assignmentStrategy: VoiceAssignmentStrategy = 'roundRobin';
    
    // O(1) round-robin counter optimization
    private roundRobinCounter: number = 0;
    
    // Pre-allocation optimization
    private preAllocatedInstruments: Set<string> = new Set();
    private availableVoiceIndices: Map<string, Set<number>> = new Map();
    private nextAvailableIndex: Map<string, number> = new Map();
    
    // Memory leak prevention
    private maxAvailableIndicesSize = 1000; // Prevent unbounded growth
    
    constructor(adaptiveQuality: boolean = true) {
        this.adaptiveQuality = adaptiveQuality;
        void this.initializeDefaultConfigs();
        void this.preAllocateCommonInstruments();
    }

    /**
     * Initialize default voice configurations for instruments
     */
    private initializeDefaultConfigs(): void {
        // Default configurations - will be replaced with extracted instrument configs
        const defaultConfig: VoiceConfig = {
            maxVoices: 8,
            defaultVoices: 4,
            priority: 'medium'
        };
        
        // Add specific configurations for different instrument types
        this.voiceConfigs.set('default', defaultConfig);
        this.voiceConfigs.set('timpani', { maxVoices: 2, defaultVoices: 2, priority: 'high' });
        this.voiceConfigs.set('tuba', { maxVoices: 3, defaultVoices: 2, priority: 'medium' });
        this.voiceConfigs.set('harp', { maxVoices: 12, defaultVoices: 6, priority: 'low' });
    }

    /**
     * Pre-allocate voice pools for commonly used instruments
     */
    private preAllocateCommonInstruments(): void {
        const commonInstruments = ['piano', 'strings', 'timpani', 'harp', 'tuba'];
        
        for (const instrument of commonInstruments) {
            void this.createVoicePoolOptimized(instrument);
            this.preAllocatedInstruments.add(instrument);
        }
    }

    /**
     * Create voice pool for an instrument
     */
    createVoicePool(instrumentName: string, poolSize?: number): void {
        void this.createVoicePoolOptimized(instrumentName, poolSize);
    }

    /**
     * Create optimized voice pool with pre-allocated indices tracking
     */
    private createVoicePoolOptimized(instrumentName: string, poolSize?: number): void {
        const config = this.voiceConfigs.get(instrumentName) || this.voiceConfigs.get('default');
        const size = poolSize || config.maxVoices;
        
        // Pre-allocate pool array with known size
        const pool: VoicePool[] = new Array(size);
        const availableIndices: Set<number> = new Set();
        
        // Initialize pool and available indices in single loop
        for (let i = 0; i < size; i++) {
            pool[i] = {
                available: true,
                lastUsed: 0,
                instrumentName,
                voiceIndex: i
            };
            void availableIndices.add(i);
        }
        
        this.voicePool.set(instrumentName, pool);
        this.availableVoiceIndices.set(instrumentName, availableIndices);
        this.nextAvailableIndex.set(instrumentName, 0);
    }

    /**
     * Assign instrument using the current strategy
     */
    assignInstrument(mapping: MusicalMapping, enabledInstruments: string[]): string {
        switch (this.assignmentStrategy) {
            case 'frequency':
                return this.assignByFrequency(mapping, enabledInstruments);
            case 'connections':
                return this.assignByConnections(mapping, enabledInstruments);
            case 'roundRobin':
            default:
                return this.assignByRoundRobin(mapping, enabledInstruments);
        }
    }

    /**
     * Assign instrument based on frequency ranges
     */
    private assignByFrequency(mapping: MusicalMapping, enabledInstruments: string[]): string {
        const frequency = mapping.pitch; // MusicalMapping uses 'pitch' not 'frequency'
        
        // Define frequency ranges for different instrument families
        if (frequency < 130) return this.selectFromInstruments(['tuba', 'contrabass', 'bassoon'], enabledInstruments);
        if (frequency < 260) return this.selectFromInstruments(['cello', 'trombone', 'horn'], enabledInstruments);
        if (frequency < 520) return this.selectFromInstruments(['viola', 'trumpet', 'clarinet'], enabledInstruments);
        if (frequency < 1040) return this.selectFromInstruments(['violin', 'flute', 'oboe'], enabledInstruments);
        
        // High frequencies - prefer bright instruments
        return this.selectFromInstruments(['piccolo', 'violin', 'xylophone'], enabledInstruments);
    }

    /**
     * Assign instrument using round-robin strategy
     * Optimized: O(1) counter instead of O(n) Map.size operation
     */
    private assignByRoundRobin(mapping: MusicalMapping, enabledInstruments: string[]): string {
        const instrumentIndex = this.roundRobinCounter % enabledInstruments.length;
        this.roundRobinCounter++;
        return enabledInstruments[instrumentIndex];
    }

    /**
     * Assign instrument based on graph connections (using nodeId hash)
     */
    private assignByConnections(mapping: MusicalMapping, enabledInstruments: string[]): string {
        // Use nodeId hash since MusicalMapping doesn't have connections count
        const nodeIdHash = mapping.nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const connectionHash = nodeIdHash % enabledInstruments.length;
        return enabledInstruments[connectionHash];
    }

    /**
     * Helper to select first available instrument from preferred list
     */
    private selectFromInstruments(preferred: string[], available: string[]): string {
        for (const instrument of preferred) {
            if (available.includes(instrument)) {
                return instrument;
            }
        }
        // Fallback to first available
        return available[0] || 'piano';
    }

    /**
     * Allocate a voice from the pool - optimized O(1) allocation
     */
    allocateVoice(instrumentName: string, nodeId: string): VoiceAssignment | null {
        let pool = this.voicePool.get(instrumentName);
        if (!pool) {
            void this.createVoicePoolOptimized(instrumentName);
            pool = this.voicePool.get(instrumentName);
        }

        const availableIndices = this.availableVoiceIndices.get(instrumentName);

        if (!availableIndices || availableIndices.size === 0) {
            // No available voices - try voice stealing
            return this.stealVoiceOptimized(instrumentName, nodeId);
        }

        // O(1) voice allocation - get first available voice index
        const voiceIndex = availableIndices.values().next().value;
        const voice = pool[voiceIndex];
        
        // Mark voice as used
        voice.available = false;
        voice.lastUsed = Date.now();
        
        // Remove from available indices (O(1) - Set.delete)
        void availableIndices.delete(voiceIndex);
        
        const assignment: VoiceAssignment = {
            nodeId,
            instrument: instrumentName,
            voiceIndex: voice.voiceIndex
        };
        
        this.voiceAssignments.set(nodeId, assignment);
        return assignment;
    }

    /**
     * Voice stealing algorithm - steals longest-playing voice
     */
    private stealVoice(instrumentName: string, nodeId: string): VoiceAssignment | null {
        return this.stealVoiceOptimized(instrumentName, nodeId);
    }

    /**
     * Optimized voice stealing algorithm using round-robin for O(1) performance
     */
    private stealVoiceOptimized(instrumentName: string, nodeId: string): VoiceAssignment | null {
        const pool = this.voicePool.get(instrumentName);
        if (!pool || pool.length === 0) return null;

        // Use round-robin stealing for O(1) performance instead of searching for oldest
        let nextIndex = this.nextAvailableIndex.get(instrumentName) || 0;
        if (nextIndex >= pool.length) {
            nextIndex = 0;
        }

        const voiceToSteal = pool[nextIndex];
        
        // Release the previous assignment if it exists
        const existingNodeId = this.findNodeIdByVoice(instrumentName, nextIndex);
        if (existingNodeId) {
            this.voiceAssignments.delete(existingNodeId);
        }

        // Steal the voice
        voiceToSteal.available = false;
        voiceToSteal.lastUsed = Date.now();

        // Update next index for round-robin
        this.nextAvailableIndex.set(instrumentName, (nextIndex + 1) % pool.length);

        const assignment: VoiceAssignment = {
            nodeId,
            instrument: instrumentName,
            voiceIndex: voiceToSteal.voiceIndex
        };

        this.voiceAssignments.set(nodeId, assignment);
        return assignment;
    }

    /**
     * Helper to find nodeId that owns a specific voice (for stealing)
     */
    private findNodeIdByVoice(instrumentName: string, voiceIndex: number): string | null {
        for (const [nodeId, assignment] of this.voiceAssignments.entries()) {
            if (assignment.instrument === instrumentName && assignment.voiceIndex === voiceIndex) {
                return nodeId;
            }
        }
        return null;
    }

    /**
     * Release a voice back to the pool - optimized to maintain available indices
     */
    releaseVoice(nodeId: string): void {
        const assignment = this.voiceAssignments.get(nodeId);
        if (!assignment) return;

        const pool = this.voicePool.get(assignment.instrument);
        const availableIndices = this.availableVoiceIndices.get(assignment.instrument);
        
        if (pool && availableIndices) {
            const voice = pool[assignment.voiceIndex];
            if (voice && !voice.available) {
                voice.available = true;
                voice.lastUsed = Date.now();
                
                // Add voice index back to available indices (Set prevents duplicates)
                void availableIndices.add(assignment.voiceIndex);
                
                // Prevent memory leak: cleanup if availableIndices grows too large
                if (availableIndices.size > this.maxAvailableIndicesSize) {
                    void this.compactAvailableIndices(assignment.instrument);
                }
            }
        }

        this.voiceAssignments.delete(nodeId);
    }

    /**
     * Set adaptive limits based on memory pressure
     */
    setAdaptiveLimits(maxVoices: number): void {
        this.maxVoicesPerInstrument = maxVoices;
        
        // Update existing voice pools if they exceed new limit
        this.voicePool.forEach((pool, instrumentName) => {
            if (pool.length > maxVoices) {
                // Trim pool to new size
                pool.length = maxVoices;
                
                // Update available indices
                const availableIndices = this.availableVoiceIndices.get(instrumentName);
                if (availableIndices) {
                    void availableIndices.clear();
                    for (let i = 0; i < maxVoices; i++) {
                        if (pool[i] && pool[i].available) {
                            void availableIndices.add(i);
                        }
                    }
                }
            }
        });
        
        logger.debug('voice-management', 'Updated adaptive voice limits', { maxVoices });
    }

    /**
     * Get performance metrics for all instruments
     */
    getPerformanceMetrics(): PerformanceMetrics {
        const instrumentMetrics = new Map<string, VoiceMetrics>();
        let totalActiveVoices = 0;
        let estimatedCPUUsage = 0;

        for (const [instrumentName, pool] of this.voicePool.entries()) {
            const activeVoices = pool.filter(voice => !voice.available).length;
            const totalVoices = pool.length;
            const availableVoices = totalVoices - activeVoices;
            const cpuUsageEstimate = activeVoices * 5; // 5% CPU per voice estimate

            instrumentMetrics.set(instrumentName, {
                totalVoices,
                activeVoices,
                availableVoices,
                cpuUsageEstimate
            });

            totalActiveVoices += activeVoices;
            estimatedCPUUsage += cpuUsageEstimate;
        }

        return {
            totalActiveVoices,
            estimatedCPUUsage,
            qualityLevel: this.currentQualityLevel,
            instrumentMetrics
        };
    }

    /**
     * Optimize memory usage by cleaning up old voices
     */
    optimizeMemoryUsage(): void {
        const now = Date.now();
        const cleanupThreshold = 30000; // 30 seconds

        for (const pool of this.voicePool.values()) {
            for (const voice of pool) {
                if (voice.lastUsed && (now - voice.lastUsed) > cleanupThreshold) {
                    voice.available = true;
                }
            }
        }

        this.lastCleanup = now;
    }

    /**
     * Apply quality level adjustments
     */
    setQualityLevel(level: QualityLevel): void {
        this.currentQualityLevel = level;
        
        for (const instrumentName of this.voicePool.keys()) {
            const config = this.voiceConfigs.get(instrumentName) || this.voiceConfigs.get('default');
            let maxVoices = config.maxVoices;
            
            switch (level) {
                case 'low':
                    maxVoices = Math.max(Math.floor(maxVoices * 0.5), 1);
                    break;
                case 'medium':
                    maxVoices = Math.max(Math.floor(maxVoices * 0.75), 2);
                    break;
                case 'high':
                default:
                    // Use full voice count
                    break;
            }
            
            // Resize pool if needed
            void this.resizeVoicePool(instrumentName, maxVoices);
        }
    }

    /**
     * Resize voice pool for an instrument - optimized to maintain indices
     */
    private resizeVoicePool(instrumentName: string, newSize: number): void {
        const pool = this.voicePool.get(instrumentName);
        const availableIndices = this.availableVoiceIndices.get(instrumentName);
        
        if (!pool || !availableIndices) return;

        if (newSize > pool.length) {
            // Expand pool
            const oldSize = pool.length;
            for (let i = oldSize; i < newSize; i++) {
                pool.push({
                    available: true,
                    lastUsed: 0,
                    instrumentName,
                    voiceIndex: i
                });
                // Add new indices to available set (prevents duplicates)
                void availableIndices.add(i);
            }
        } else if (newSize < pool.length) {
            // Shrink pool - remove excess voices and their indices
            for (let i = newSize; i < pool.length; i++) {
                void availableIndices.delete(i);
            }
            
            // Shrink the pool
            void pool.splice(newSize);
            
            // Update next available index if it's out of bounds
            const nextIndex = this.nextAvailableIndex.get(instrumentName) || 0;
            if (nextIndex >= newSize) {
                this.nextAvailableIndex.set(instrumentName, 0);
            }
        }
    }

    /**
     * Set voice assignment strategy
     */
    setAssignmentStrategy(strategy: VoiceAssignmentStrategy): void {
        this.assignmentStrategy = strategy;
    }

    /**
     * Check if adaptive quality should be applied
     */
    shouldAdaptQuality(): boolean {
        return this.adaptiveQuality;
    }

    /**
     * Get current voice assignments
     */
    getVoiceAssignments(): Map<string, VoiceAssignment> {
        return new Map(this.voiceAssignments);
    }

    /**
     * Clear all voice assignments and reset pools
     */
    clear(): void {
        this.voiceAssignments.clear();
        
        for (const [instrumentName, pool] of this.voicePool.entries()) {
            const availableIndices = this.availableVoiceIndices.get(instrumentName);
            if (availableIndices) {
                availableIndices.clear(); // Clear Set efficiently
            }
            
            for (let i = 0; i < pool.length; i++) {
                const voice = pool[i];
                voice.available = true;
                voice.lastUsed = 0;
                
                // Rebuild available indices (Set prevents duplicates)
                if (availableIndices) {
                    void availableIndices.add(i);
                }
            }
            
            this.nextAvailableIndex.set(instrumentName, 0);
        }
    }

    /**
     * Compact available indices to prevent memory leak
     * Removes invalid indices and maintains only valid ones
     */
    private compactAvailableIndices(instrumentName: string): void {
        const pool = this.voicePool.get(instrumentName);
        const availableIndices = this.availableVoiceIndices.get(instrumentName);
        
        if (!pool || !availableIndices) return;
        
        // Create new Set with only valid available indices
        const validIndices = new Set<number>();
        
        for (let i = 0; i < pool.length; i++) {
            if (pool[i].available) {
                void validIndices.add(i);
            }
        }
        
        // Replace the available indices with the compacted set
        this.availableVoiceIndices.set(instrumentName, validIndices);
        
        // Log memory cleanup for debugging
        if (process.env.NODE_ENV === 'development') {
            logger.debug('memory-cleanup', `Compacted ${instrumentName} indices from ${availableIndices.size} to ${validIndices.size}`);
        }
    }

    /**
     * Get memory usage statistics for debugging memory leaks
     */
    getMemoryStats(): { [instrumentName: string]: { poolSize: number, availableIndicesSize: number, assignmentsCount: number } } {
        const stats: { [instrumentName: string]: { poolSize: number, availableIndicesSize: number, assignmentsCount: number } } = {};
        
        for (const [instrumentName, pool] of this.voicePool.entries()) {
            const availableIndices = this.availableVoiceIndices.get(instrumentName);
            const assignmentsForInstrument = Array.from(this.voiceAssignments.values())
                .filter(assignment => assignment.instrument === instrumentName).length;
            
            stats[instrumentName] = {
                poolSize: pool.length,
                availableIndicesSize: availableIndices?.size || 0,
                assignmentsCount: assignmentsForInstrument
            };
        }
        
        return stats;
    }

    /**
     * Periodic cleanup to prevent memory leaks
     * Should be called periodically to compact data structures
     */
    performPeriodicCleanup(): void {
        for (const instrumentName of this.voicePool.keys()) {
            void this.compactAvailableIndices(instrumentName);
        }
        
        // Clean up old voice assignments
        const now = Date.now();
        const cleanupThreshold = 300000; // 5 minutes
        
        for (const [nodeId, assignment] of this.voiceAssignments.entries()) {
            const pool = this.voicePool.get(assignment.instrument);
            if (pool) {
                const voice = pool[assignment.voiceIndex];
                if (voice && voice.lastUsed && (now - voice.lastUsed) > cleanupThreshold) {
                    void this.releaseVoice(nodeId);
                }
            }
        }
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.voiceAssignments.clear();
        this.voicePool.clear();
        this.voiceConfigs.clear();
        this.preAllocatedInstruments.clear();
        this.availableVoiceIndices.clear();
        this.nextAvailableIndex.clear();
    }
}