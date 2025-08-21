/**
 * Audio Mapping Module - Phase 2: Content-Aware Mapping Foundation
 * 
 * Exports all components of the metadata-driven mapping system.
 */

export { ObsidianMetadataMapper } from './ObsidianMetadataMapper';
export { MetadataMappingRules } from './MetadataMappingRules';
export { VaultMappingOptimizer } from './VaultMappingOptimizer';
export { InstrumentDistributor } from './InstrumentDistributor';
export { MetadataListener } from './MetadataListener';

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