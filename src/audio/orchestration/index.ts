/**
 * Orchestration Module
 *
 * Phase 5.2: Hub Node Orchestration - Central nodes as conductors
 * Phase 6.2: Dynamic Orchestration - Complexity and temporal-based orchestration
 */

// Phase 5.2: Hub Node Orchestration
export { HubCentralityAnalyzer } from './HubCentralityAnalyzer';
export { HubOrchestrationManager } from './HubOrchestrationManager';
export { HubTransitionHandler } from './HubTransitionHandler';

// Phase 6.2: Dynamic Orchestration
export { ComplexityAnalyzer } from './ComplexityAnalyzer';
export { TemporalInfluence } from './TemporalInfluence';
export { DynamicOrchestrationManager } from './DynamicOrchestrationManager';

// Phase 5.2 Types
export type {
  HubMetrics,
  CentralityWeights,
  HubOrchestrationSettings,
  OrchestrationMode,
  OrchestrationDecisions,
  HubTransitionType,
  HubTransitionEvent,
  HubTransitionAudioConfig,
  HubTransitionEffectType,
  HubProminenceTier,
  HubRoleAssignment,
  DistanceScaling,
  HubOrchestrationState,
  ClusterHubAnalysis
} from './types';

// Phase 6.2 Types
export type {
  VaultComplexity,
  ComplexityTier,
  ComplexityThreshold,
  OrchestrationLayer,
  TimeOfDay,
  Season,
  TemporalInfluence as TemporalInfluenceData,
  InstrumentLayer,
  DynamicOrchestrationSettings,
  OrchestrationState
} from './types';