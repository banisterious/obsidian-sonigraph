/**
 * Type definitions for spatial audio and panning system
 * Phase 6.3: Spatial Audio and Panning
 */

/**
 * Stereo pan position (-1 = full left, 0 = center, 1 = full right)
 */
export type PanPosition = number;

/**
 * Normalized graph coordinates (0-1 range)
 */
export interface NormalizedPosition {
    x: number; // 0 = left edge, 1 = right edge
    y: number; // 0 = top edge, 1 = bottom edge
}

/**
 * Raw graph coordinates in viewport space
 */
export interface GraphPosition {
    x: number;
    y: number;
}

/**
 * Bounding box for graph visualization
 */
export interface GraphBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
}

/**
 * Node spatial audio state
 */
export interface NodeSpatialState {
    nodeId: string;
    position: GraphPosition;
    normalizedPosition: NormalizedPosition;
    panPosition: PanPosition;
    folderBasedPan?: PanPosition;
    clusterPan?: PanPosition;
    finalPan: PanPosition;
    lastUpdated: number;
}

/**
 * Folder-based panning configuration
 */
export interface FolderPanMapping {
    folderPath: string;
    panPosition: PanPosition;
    priority: number; // Higher priority takes precedence for nested folders
}

/**
 * Cluster spatial positioning configuration
 */
export interface ClusterSpatialConfig {
    clusterId: string;
    centerPosition: GraphPosition;
    panPosition: PanPosition;
    spread: number; // How much nodes can vary from center pan (0-1)
}

/**
 * Spatial audio panning mode
 */
export enum PanningMode {
    /** Graph X-position directly maps to stereo pan */
    GraphPosition = 'graph-position',

    /** Folder hierarchy determines pan position */
    FolderBased = 'folder-based',

    /** Cluster centroid determines pan position */
    ClusterBased = 'cluster-based',

    /** Weighted combination of graph position and folder */
    Hybrid = 'hybrid',

    /** Disabled - all audio centered */
    Disabled = 'disabled'
}

/**
 * Panning curve types for different spatial mapping behaviors
 */
export enum PanningCurve {
    /** Linear mapping: direct proportion */
    Linear = 'linear',

    /** Exponential: emphasizes extremes */
    Exponential = 'exponential',

    /** Sigmoid: smooth S-curve with center bias */
    Sigmoid = 'sigmoid',

    /** Logarithmic: compresses extremes */
    Logarithmic = 'logarithmic'
}

/**
 * Spatial audio configuration settings
 */
export interface SpatialAudioConfig {
    enabled: boolean;
    mode: PanningMode;

    /** Graph position mode settings */
    graphPositionSettings: {
        curve: PanningCurve;
        intensity: number; // 0-1: How extreme the panning can be
        smoothingFactor: number; // 0-1: Smooths position changes over time
        updateThrottleMs: number; // Minimum ms between position updates
    };

    /** Folder-based panning settings */
    folderSettings: {
        enabled: boolean;
        customMappings: FolderPanMapping[];
        autoDetectTopLevel: boolean; // Automatically assign pan to top-level folders
        spreadFactor: number; // 0-1: How much nested files vary from folder pan
    };

    /** Cluster-based panning settings */
    clusterSettings: {
        enabled: boolean;
        useCentroid: boolean; // Use cluster center for pan calculation
        individualSpread: number; // 0-1: How much individual nodes vary
        clusterSeparation: number; // 0-1: Force clusters to occupy different pan positions
    };

    /** Hybrid mode weights */
    hybridWeights: {
        graphPosition: number; // 0-1
        folderBased: number; // 0-1
        clusterBased: number; // 0-1
    };

    /** Advanced settings */
    advanced: {
        enableDepthMapping: boolean; // Use Y-axis for future surround sound
        depthInfluence: number; // 0-1: How much depth affects volume
        boundaryPadding: number; // 0-1: Padding from pan extremes
        velocityDamping: boolean; // Smooth rapid position changes
        dampingFactor: number; // 0-1: Damping strength
    };
}

/**
 * Spatial audio update event
 */
export interface SpatialAudioEvent {
    type: 'position-update' | 'pan-change' | 'mode-change' | 'bounds-update';
    nodeId?: string;
    oldPan?: PanPosition;
    newPan?: PanPosition;
    timestamp: number;
}

/**
 * Spatial audio statistics
 */
export interface SpatialAudioStats {
    totalNodes: number;
    trackedNodes: number;
    averagePan: PanPosition;
    panDistribution: {
        left: number; // Count of nodes < -0.33
        center: number; // Count of nodes -0.33 to 0.33
        right: number; // Count of nodes > 0.33
    };
    updateFrequency: number; // Updates per second
    lastBoundsUpdate: number;
}

/**
 * Default folder pan mappings
 */
export const DEFAULT_FOLDER_MAPPINGS: FolderPanMapping[] = [
    { folderPath: 'Projects', panPosition: 0.5, priority: 1 },
    { folderPath: 'Journal', panPosition: -0.5, priority: 1 },
    { folderPath: 'Archive', panPosition: -0.8, priority: 2 },
    { folderPath: 'Research', panPosition: 0.3, priority: 1 },
    { folderPath: 'Ideas', panPosition: -0.3, priority: 1 },
    { folderPath: 'Notes', panPosition: 0.0, priority: 0 },
];

/**
 * Default spatial audio configuration
 */
export const DEFAULT_SPATIAL_CONFIG: SpatialAudioConfig = {
    enabled: false, // Disabled by default (opt-in feature)
    mode: PanningMode.Hybrid,

    graphPositionSettings: {
        curve: PanningCurve.Sigmoid,
        intensity: 0.7,
        smoothingFactor: 0.5,
        updateThrottleMs: 100,
    },

    folderSettings: {
        enabled: true,
        customMappings: DEFAULT_FOLDER_MAPPINGS,
        autoDetectTopLevel: true,
        spreadFactor: 0.3,
    },

    clusterSettings: {
        enabled: true,
        useCentroid: true,
        individualSpread: 0.2,
        clusterSeparation: 0.5,
    },

    hybridWeights: {
        graphPosition: 0.5,
        folderBased: 0.3,
        clusterBased: 0.2,
    },

    advanced: {
        enableDepthMapping: false, // Future feature
        depthInfluence: 0.3,
        boundaryPadding: 0.1,
        velocityDamping: true,
        dampingFactor: 0.7,
    },
};