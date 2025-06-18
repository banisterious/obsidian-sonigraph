export interface VoiceAssignment {
    nodeId: string;
    instrument: string; // Fixed type - should be string instrument name
    voiceIndex: number;
}

export interface VoiceConfig {
    maxVoices: number;
    defaultVoices: number;
    priority: 'low' | 'medium' | 'high';
}

export interface VoicePool {
    available: boolean;
    lastUsed: number;
    instrumentName: string;
    voiceIndex: number;
}

export interface VoiceMetrics {
    totalVoices: number;
    activeVoices: number;
    availableVoices: number;
    cpuUsageEstimate: number;
}

export interface PerformanceMetrics {
    totalActiveVoices: number;
    estimatedCPUUsage: number;
    qualityLevel: QualityLevel;
    instrumentMetrics: Map<string, VoiceMetrics>;
}

export type QualityLevel = 'high' | 'medium' | 'low';

export type VoiceAssignmentStrategy = 'frequency' | 'roundRobin' | 'connections';

// Import the actual MusicalMapping from graph types
import { MusicalMapping as GraphMusicalMapping } from '../../graph/types';

// Re-export for convenience
export type MusicalMapping = GraphMusicalMapping;