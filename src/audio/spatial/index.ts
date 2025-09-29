/**
 * Spatial audio module exports
 * Phase 6.3: Spatial Audio and Panning
 */

export { SpatialAudioManager } from './SpatialAudioManager';
export { PanningSystem } from './PanningSystem';

export type {
    PanPosition,
    NormalizedPosition,
    GraphPosition,
    GraphBounds,
    NodeSpatialState,
    FolderPanMapping,
    ClusterSpatialConfig,
    SpatialAudioConfig,
    SpatialAudioEvent,
    SpatialAudioStats,
} from './types';

export {
    PanningMode,
    PanningCurve,
    DEFAULT_FOLDER_MAPPINGS,
    DEFAULT_SPATIAL_CONFIG,
} from './types';