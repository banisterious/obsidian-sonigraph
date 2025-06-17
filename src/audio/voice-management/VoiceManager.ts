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
    
    constructor(adaptiveQuality: boolean = true) {
        this.adaptiveQuality = adaptiveQuality;
        this.initializeDefaultConfigs();
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
     * Create voice pool for an instrument
     */
    createVoicePool(instrumentName: string, poolSize?: number): void {
        const config = this.voiceConfigs.get(instrumentName) || this.voiceConfigs.get('default')!;
        const size = poolSize || config.maxVoices;
        
        const pool: VoicePool[] = [];
        for (let i = 0; i < size; i++) {
            pool.push({
                available: true,
                lastUsed: 0,
                instrumentName,
                voiceIndex: i
            });
        }
        
        this.voicePool.set(instrumentName, pool);
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
     */
    private assignByRoundRobin(mapping: MusicalMapping, enabledInstruments: string[]): string {
        const instrumentIndex = this.voiceAssignments.size % enabledInstruments.length;
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
     * Allocate a voice from the pool
     */
    allocateVoice(instrumentName: string, nodeId: string): VoiceAssignment | null {
        const pool = this.voicePool.get(instrumentName);
        if (!pool) {
            this.createVoicePool(instrumentName);
            return this.allocateVoice(instrumentName, nodeId);
        }

        // Find available voice
        const availableVoice = pool.find(voice => voice.available);
        if (availableVoice) {
            availableVoice.available = false;
            availableVoice.lastUsed = Date.now();
            
            const assignment: VoiceAssignment = {
                nodeId,
                instrument: instrumentName as keyof any,
                voiceIndex: availableVoice.voiceIndex
            };
            
            this.voiceAssignments.set(nodeId, assignment);
            return assignment;
        }

        // No available voices - try voice stealing
        return this.stealVoice(instrumentName, nodeId);
    }

    /**
     * Voice stealing algorithm - steals longest-playing voice
     */
    private stealVoice(instrumentName: string, nodeId: string): VoiceAssignment | null {
        const pool = this.voicePool.get(instrumentName);
        if (!pool) return null;

        // Find voice with oldest lastUsed time
        let oldestVoice = pool[0];
        let oldestTime = oldestVoice.lastUsed;

        for (const voice of pool) {
            if (voice.lastUsed < oldestTime) {
                oldestTime = voice.lastUsed;
                oldestVoice = voice;
            }
        }

        // Steal the oldest voice
        oldestVoice.available = false;
        oldestVoice.lastUsed = Date.now();

        const assignment: VoiceAssignment = {
            nodeId,
            instrument: instrumentName as keyof any,
            voiceIndex: oldestVoice.voiceIndex
        };

        this.voiceAssignments.set(nodeId, assignment);
        return assignment;
    }

    /**
     * Release a voice back to the pool
     */
    releaseVoice(nodeId: string): void {
        const assignment = this.voiceAssignments.get(nodeId);
        if (!assignment) return;

        const pool = this.voicePool.get(assignment.instrument);
        if (pool) {
            const voice = pool[assignment.voiceIndex];
            if (voice) {
                voice.available = true;
                voice.lastUsed = Date.now();
            }
        }

        this.voiceAssignments.delete(nodeId);
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

        for (const [instrumentName, pool] of this.voicePool.entries()) {
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
        
        for (const [instrumentName, pool] of this.voicePool.entries()) {
            const config = this.voiceConfigs.get(instrumentName) || this.voiceConfigs.get('default')!;
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
            this.resizeVoicePool(instrumentName, maxVoices);
        }
    }

    /**
     * Resize voice pool for an instrument
     */
    private resizeVoicePool(instrumentName: string, newSize: number): void {
        const pool = this.voicePool.get(instrumentName);
        if (!pool) return;

        if (newSize > pool.length) {
            // Expand pool
            for (let i = pool.length; i < newSize; i++) {
                pool.push({
                    available: true,
                    lastUsed: 0,
                    instrumentName,
                    voiceIndex: i
                });
            }
        } else if (newSize < pool.length) {
            // Shrink pool - remove excess voices
            pool.splice(newSize);
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
            for (const voice of pool) {
                voice.available = true;
                voice.lastUsed = 0;
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
    }
}