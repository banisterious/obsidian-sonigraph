/**
 * Freesound API Integration Module
 *
 * Phase 7.1: Token-Based Authentication
 * - API key authentication (token-based, no OAuth2)
 * - Preview URL access for continuous layer samples
 * - Connection testing and validation
 *
 * Phase 7.2: Sample Management System
 * - Download queue with throttling and progress tracking
 * - IndexedDB-based persistent caching with LRU eviction
 * - Genre-based sample collections and preloading
 * - Memory and disk cache management
 *
 * Phase 7.3: Caching and Preloading
 * - Intelligent preloading system with predictive algorithms
 * - Cache optimization strategies (LRU, LFU, adaptive, predictive)
 * - Offline support with graceful degradation
 * - Background loading during idle time
 *
 * This module provides Freesound.org API integration for downloading
 * high-quality ambient audio samples to enhance continuous layers.
 */

// Phase 7.1: Authentication
export { FreesoundAuthManager, FreesoundAuthConfig, FreesoundConnectionTestResult } from './FreesoundAuthManager';
export {
	FreesoundAPI,
	FreesoundSearchFilters,
	FreesoundPreview,
	FreesoundSound,
	FreesoundSearchResults,
	FreesoundError
} from './FreesoundAPI';

// Phase 7.2: Sample Management
export { SampleCache, CachedSample, CacheStatistics } from './SampleCache';
export { DownloadQueue, DownloadTask, DownloadResult, DownloadProgress } from './DownloadQueue';
export {
	FreesoundSampleManager,
	MusicalGenre,
	GenreSampleCollection,
	PreloadProgress
} from './FreesoundSampleManager';

// Phase 7.3: Caching and Preloading
export {
	SamplePreloader,
	PreloadStrategy,
	UsageMetrics,
	PreloadConfig,
	PreloadStatus
} from './SamplePreloader';

export {
	CacheStrategy,
	CacheStrategyConfig,
	CacheItem,
	CachePriority,
	CacheEvictionStrategy,
	EvictionCandidate,
	CacheOptimizationResult
} from './CacheStrategy';