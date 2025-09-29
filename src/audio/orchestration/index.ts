/**
 * Phase 5.2: Hub Node Orchestration Module
 *
 * Exports for hub-based orchestration system where central nodes
 * act as "conductors" to drive cluster audio dynamics.
 */

export { HubCentralityAnalyzer } from './HubCentralityAnalyzer';
export { HubOrchestrationManager } from './HubOrchestrationManager';
export { HubTransitionHandler } from './HubTransitionHandler';

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