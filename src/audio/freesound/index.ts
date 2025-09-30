/**
 * Freesound API Integration Module
 *
 * Phase 7.1: OAuth Implementation
 * - API key authentication (token-based, no OAuth2)
 * - Preview URL access for continuous layer samples
 * - Connection testing and validation
 *
 * This module provides Freesound.org API integration for downloading
 * high-quality ambient audio samples to enhance continuous layers.
 */

export { FreesoundAuthManager, FreesoundAuthConfig, FreesoundConnectionTestResult } from './FreesoundAuthManager';
export {
	FreesoundAPI,
	FreesoundSearchFilters,
	FreesoundPreview,
	FreesoundSound,
	FreesoundSearchResults,
	FreesoundError
} from './FreesoundAPI';