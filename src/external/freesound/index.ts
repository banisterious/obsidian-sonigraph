/**
 * Freesound.org integration module
 * Exports all whale audio functionality for Sonigraph
 */

export * from './types';
export { FreesoundAPIClient } from './client';
export { WhaleAudioManager } from './whale-audio-manager';

// Re-export key types for convenience
export type { 
    WhaleSpecies, 
    WhaleIntegrationSettings, 
    SampleDiscoveryResult 
} from './types';