/**
 * Audio Mapping Module - Phase 2-4: Content-Aware Mapping Foundation & Enhanced File Type Mapping
 * 
 * Exports all components of the metadata-driven mapping system, including
 * Phase 4.1 advanced file type mapping with sophisticated characteristics analysis.
 */

// Phase 2: Content-Aware Mapping Foundation
export { ObsidianMetadataMapper } from './ObsidianMetadataMapper';
export { MetadataMappingRules } from './MetadataMappingRules';
export { VaultMappingOptimizer } from './VaultMappingOptimizer';
export { InstrumentDistributor } from './InstrumentDistributor';
export { MetadataListener } from './MetadataListener';

// Phase 4.1: Advanced File Type Mapping
export { ContentAwareMapper } from './ContentAwareMapper';
export { FileTypeAnalyzer } from './FileTypeAnalyzer';
export { InstrumentSelector } from './InstrumentSelector';

// Phase 4.2: Tag-Based Musical Semantics
export { TagSemanticMapper } from './TagSemanticMapper';
export { DEFAULT_TAG_MAPPINGS } from './SemanticMappingConfig';

// Phase 4.3: Folder Hierarchy and Path Mapping
export { FolderHierarchyMapper } from './FolderHierarchyMapper';
export { PathAnalyzer } from './PathAnalyzer';

// Phase 4.4: Connection Type Audio Differentiation
export { ConnectionTypeMapper } from './ConnectionTypeMapper';
export { ConnectionTypeMappingPanel } from './ConnectionTypeMappingPanel';
export { ConnectionTypePresetManager } from './ConnectionTypePresetManager';
export {
    DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG,
    DEFAULT_CONNECTION_CHARACTERISTICS,
    DEFAULT_CONNECTION_INSTRUMENTS,
    BUILT_IN_PRESETS
} from './ConnectionTypeMappingConfig';

// Local Soundscape / Note Journey: Depth-Based Mapping
export { DepthBasedMapper } from './DepthBasedMapper';
export type { DepthMappingConfig, DepthMapping } from './DepthBasedMapper';

// Re-export types for external use
export type {
    FileMetadataMapping,
    ContentMetadataMapping,
    InstrumentSuggestion,
    ComplexityMapping,
    DistanceMapping,
    InstrumentFamilyMapping,
    HarmonyMapping,
    RhythmMapping,
    MetadataAnalysisResult
} from './ObsidianMetadataMapper';

export type {
    MetadataCondition,
    MusicalProperty,
    MappingRule,
    RuleEvaluationResult,
    FrontmatterSchema
} from './MetadataMappingRules';

export type {
    VaultMappingAnalysis,
    InstrumentDistribution,
    ClusterInfo,
    PerformanceMetrics,
    OptimizationRecommendation,
    BatchProcessingConfig
} from './VaultMappingOptimizer';

export type {
    DistributionConfig,
    FilePosition,
    DistributionResult,
    DistributionAnalysis,
    SpatialDistribution,
    ClusterAnalysis,
    OverlapArea
} from './InstrumentDistributor';

export type {
    MetadataChangeEvent,
    MetadataChangeHandler,
    ListenerConfig,
    ChangeStats
} from './MetadataListener';

// Phase 4.1: Advanced File Type Mapping Types
export type {
    ContentAwareMappingResult,
    ContentAwareMappingConfig,
    MusicalProperties
} from './ContentAwareMapper';

export type {
    FileCharacteristics,
    FileTypeAnalysisConfig
} from './FileTypeAnalyzer';

export type {
    InstrumentSelectionCriteria,
    InstrumentSelectionResult
} from './InstrumentSelector';

// Phase 4.2: Tag-Based Musical Semantics Types
export type {
    TagMappingConfig,
    TagSemanticAnalysis,
    EmotionalMapping,
    FunctionalMapping,
    TopicalMapping,
    TagComplexityConfig
} from './SemanticMappingConfig';

export type {
    SemanticMappingResult,
    TagSemanticMapperConfig
} from './TagSemanticMapper';

// Phase 4.3: Folder Hierarchy and Path Mapping Types
export type {
    FolderCharacteristics,
    InstrumentFamily,
    PitchModification
} from './FolderHierarchyMapper';

export type {
    PathAnalysis,
    FolderMetrics
} from './PathAnalyzer';

// Phase 4.4: Connection Type Audio Differentiation Types
export type {
    ConnectionType,
    ConnectionTypeMappingConfig,
    ConnectionTypeMapping,
    ConnectionTypeMappingResult,
    ConnectionTypeMappingMetrics,
    ConnectionAudioCharacteristics,
    ConnectionTypePreset
} from './ConnectionTypeMappingConfig';

export type {
    ConnectionTypeMappingPanelCallbacks
} from './ConnectionTypeMappingPanel';

export type {
    PresetOperationResult,
    PresetValidationResult
} from './ConnectionTypePresetManager';