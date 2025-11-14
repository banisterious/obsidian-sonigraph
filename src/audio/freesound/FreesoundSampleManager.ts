/**
 * Freesound Sample Manager
 * Orchestrates sample downloading, caching, and genre-based preloading
 */

import { getLogger } from '../../logging';
import { FreesoundAPI, FreesoundSearchFilters } from './FreesoundAPI';
import { FreesoundAuthManager } from './FreesoundAuthManager';
import { SampleCache, CacheStatistics } from './SampleCache';
import { DownloadQueue, DownloadResult, DownloadProgress } from './DownloadQueue';
import { SamplePreloader, PreloadConfig, PreloadStatus, UsageMetrics } from './SamplePreloader';
import { CacheStrategy, CacheStrategyConfig, CacheItem, CachePriority, CacheOptimizationResult } from './CacheStrategy';

export type MusicalGenre =
    | 'ambient' | 'drone' | 'orchestral' | 'electronic' | 'minimal'
    | 'oceanic' | 'sci-fi' | 'experimental' | 'industrial' | 'urban'
    | 'nature' | 'mechanical' | 'organic';

export interface GenreSampleCollection {
    genre: MusicalGenre;
    soundIds: number[];
    tags: string[];
    duration?: { min: number; max: number };
}

export interface PreloadProgress {
    genre: MusicalGenre;
    progress: DownloadProgress;
}

export class FreesoundSampleManager {
    private api: FreesoundAPI;
    private cache: SampleCache;
    private downloadQueue: DownloadQueue;
    private preloader: SamplePreloader;
    private cacheStrategy: CacheStrategy;
    private logger = getLogger('sample-manager');
    private initialized: boolean = false;
    private audioContext: AudioContext;

    // Genre collections (will be populated from Freesound Audio Library)
    private genreCollections: Map<MusicalGenre, GenreSampleCollection>;

    // Callbacks
    private onPreloadProgress?: (progress: PreloadProgress) => void;
    private onPreloadComplete?: (genre: MusicalGenre) => void;

    // Offline mode
    private isOffline: boolean = false;

    constructor(apiKey: string, maxConcurrentDownloads: number = 3) {
        const authManager = new FreesoundAuthManager({ apiKey });
        this.api = new FreesoundAPI(authManager);
        this.cache = new SampleCache(50); // Max 50 samples in memory
        this.downloadQueue = new DownloadQueue(this.api, maxConcurrentDownloads);
        this.audioContext = new AudioContext();
        this.preloader = new SamplePreloader(this, this.audioContext);
        this.cacheStrategy = new CacheStrategy();
        this.genreCollections = new Map();

        this.initializeGenreCollections();
        this.setupDownloadCallbacks();
        this.setupNetworkMonitoring();
    }

    /**
     * Initialize the sample manager
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.cache.initialize();
            this.initialized = true;
            this.logger.info('sample-manager', 'FreesoundSampleManager initialized');
        } catch (error) {
            this.logger.error('sample-manager', 'Failed to initialize FreesoundSampleManager - ' + JSON.stringify({ error: error.message }));
            throw error;
        }
    }

    /**
     * Download a specific sample
     */
    async downloadSample(soundId: number): Promise<AudioBuffer> {
        // Check cache first
        const cached = await this.cache.get(soundId);
        if (cached) {
            this.logger.debug('sample-manager', 'Sample retrieved from cache - ' + JSON.stringify({ soundId }));
            return cached;
        }

        // Download sample
        return new Promise((resolve, reject) => {
            let resolved = false;

            this.downloadQueue.setTaskCompleteCallback((result: DownloadResult) => {
                if (result.soundId === soundId && !resolved) {
                    resolved = true;
                    if (result.success && result.audioBuffer && result.metadata) {
                        // Add to cache
                        this.cache.add(soundId, result.audioBuffer, result.metadata)
                            .then(() => resolve(result.audioBuffer))
                            .catch(reject);
                    } else {
                        reject(new Error(result.error || 'Download failed'));
                    }
                }
            });

            this.downloadQueue.addTask(soundId, 10); // High priority
        });
    }

    /**
     * Preload samples for a specific genre
     */
    async preloadGenreSamples(genre: MusicalGenre): Promise<void> {
        const collection = this.genreCollections.get(genre);
        if (!collection) {
            this.logger.warn('sample-manager', 'Genre collection not found - ' + JSON.stringify({ genre }));
            return;
        }

        this.logger.info('sample-manager', `Preloading genre samples - genre: ${genre}, sampleCount: ${collection.soundIds.length}`);

        // Check which samples are already cached
        const uncachedSoundIds: number[] = [];
        for (const soundId of collection.soundIds) {
            const cached = await this.cache.has(soundId);
            if (!cached) {
                uncachedSoundIds.push(soundId);
            }
        }

        if (uncachedSoundIds.length === 0) {
            this.logger.info('sample-manager', 'All genre samples already cached - ' + JSON.stringify({ genre }));
            if (this.onPreloadComplete) {
                this.onPreloadComplete(genre);
            }
            return;
        }

        // Add to download queue
        this.downloadQueue.addBulkTasks(uncachedSoundIds, 5); // Medium priority

        // Monitor progress
        const progressInterval = setInterval(() => {
            const progress = this.downloadQueue.getProgress();
            if (this.onPreloadProgress) {
                this.onPreloadProgress({ genre, progress });
            }

            if (!this.downloadQueue.isProcessing() && this.downloadQueue.isEmpty()) {
                clearInterval(progressInterval);
                this.logger.info('sample-manager', 'Genre preload completed - ' + JSON.stringify({ genre }));
                if (this.onPreloadComplete) {
                    this.onPreloadComplete(genre);
                }
            }
        }, 500);
    }

    /**
     * Get cached sample (returns null if not in cache)
     */
    async getCachedSample(soundId: number): Promise<AudioBuffer | null> {
        return await this.cache.get(soundId);
    }

    /**
     * Check if sample is cached
     */
    async isSampleCached(soundId: number): Promise<boolean> {
        return await this.cache.has(soundId);
    }

    /**
     * Get genre collection
     */
    getGenreCollection(genre: MusicalGenre): GenreSampleCollection | undefined {
        return this.genreCollections.get(genre);
    }

    /**
     * Search for samples by tags and duration
     */
    async searchSamples(
        tags: string[],
        minDuration?: number,
        maxDuration?: number,
        limit: number = 20
    ): Promise<number[]> {
        try {
            const searchFilters: FreesoundSearchFilters = {
                query: tags.join(' OR '),
                filter: this.buildDurationFilter(minDuration, maxDuration),
                fields: 'id',
                pageSize: limit
            };

            const results = await this.api.searchSounds(searchFilters);
            return results.results.map(sound => sound.id);
        } catch (error) {
            this.logger.error('sample-manager', 'Sample search failed - ' + JSON.stringify({ error: error.message, tags }));
            return [];
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStatistics(): Promise<CacheStatistics> {
        return await this.cache.getStatistics();
    }

    /**
     * Clear cache
     */
    async clearCache(): Promise<void> {
        await this.cache.clear();
        this.logger.info('sample-manager', 'Sample cache cleared');
    }

    /**
     * Prune old samples from cache
     */
    async pruneOldSamples(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
        const prunedCount = await this.cache.pruneOldSamples(maxAgeMs);
        this.logger.info('sample-manager', 'Pruned old samples from cache - ' + JSON.stringify({ count: prunedCount }));
        return prunedCount;
    }

    /**
     * Set preload progress callback
     */
    setPreloadProgressCallback(callback: (progress: PreloadProgress) => void): void {
        this.onPreloadProgress = callback;
    }

    /**
     * Set preload complete callback
     */
    setPreloadCompleteCallback(callback: (genre: MusicalGenre) => void): void {
        this.onPreloadComplete = callback;
    }

    /**
     * Private: Initialize genre collections
     * These will reference the curated Freesound Audio Library
     */
    private initializeGenreCollections(): void {
        // Note: These are placeholder IDs. In production, these should be populated
        // from the Freesound Audio Library document which contains curated sound IDs

        this.genreCollections.set('ambient', {
            genre: 'ambient',
            soundIds: [], // Will be populated from library
            tags: ['ambient', 'atmosphere', 'pad', 'texture', 'drone'],
            duration: { min: 30, max: 300 }
        });

        this.genreCollections.set('drone', {
            genre: 'drone',
            soundIds: [],
            tags: ['drone', 'sustained', 'deep', 'bass', 'meditation'],
            duration: { min: 60, max: 300 }
        });

        this.genreCollections.set('orchestral', {
            genre: 'orchestral',
            soundIds: [],
            tags: ['orchestral', 'strings', 'brass', 'classical', 'symphony'],
            duration: { min: 10, max: 120 }
        });

        this.genreCollections.set('electronic', {
            genre: 'electronic',
            soundIds: [],
            tags: ['electronic', 'synth', 'synthesizer', 'digital', 'techno'],
            duration: { min: 5, max: 60 }
        });

        this.genreCollections.set('minimal', {
            genre: 'minimal',
            soundIds: [],
            tags: ['minimal', 'sparse', 'simple', 'quiet', 'subtle'],
            duration: { min: 20, max: 180 }
        });

        this.genreCollections.set('oceanic', {
            genre: 'oceanic',
            soundIds: [],
            tags: ['ocean', 'water', 'waves', 'whale', 'underwater', 'marine'],
            duration: { min: 30, max: 300 }
        });

        this.genreCollections.set('sci-fi', {
            genre: 'sci-fi',
            soundIds: [],
            tags: ['sci-fi', 'space', 'futuristic', 'alien', 'technology', 'digital'],
            duration: { min: 5, max: 120 }
        });

        this.genreCollections.set('experimental', {
            genre: 'experimental',
            soundIds: [],
            tags: ['experimental', 'abstract', 'noise', 'glitch', 'avant-garde'],
            duration: { min: 10, max: 180 }
        });

        this.genreCollections.set('industrial', {
            genre: 'industrial',
            soundIds: [],
            tags: ['industrial', 'mechanical', 'factory', 'metal', 'machine'],
            duration: { min: 10, max: 120 }
        });

        this.genreCollections.set('urban', {
            genre: 'urban',
            soundIds: [],
            tags: ['urban', 'city', 'street', 'traffic', 'crowd', 'people'],
            duration: { min: 20, max: 180 }
        });

        this.genreCollections.set('nature', {
            genre: 'nature',
            soundIds: [],
            tags: ['nature', 'forest', 'birds', 'rain', 'wind', 'outdoor'],
            duration: { min: 30, max: 300 }
        });

        this.genreCollections.set('mechanical', {
            genre: 'mechanical',
            soundIds: [],
            tags: ['mechanical', 'motor', 'engine', 'gears', 'machinery'],
            duration: { min: 10, max: 120 }
        });

        this.genreCollections.set('organic', {
            genre: 'organic',
            soundIds: [],
            tags: ['organic', 'acoustic', 'natural', 'wooden', 'breath'],
            duration: { min: 5, max: 60 }
        });

        this.logger.info('sample-manager', `Genre collections initialized - genreCount: ${this.genreCollections.size}`);
    }

    /**
     * Private: Setup download queue callbacks
     */
    private setupDownloadCallbacks(): void {
        this.downloadQueue.setTaskCompleteCallback((result: DownloadResult) => {
            if (result.success && result.audioBuffer && result.metadata) {
                // Add to cache
                this.cache.add(result.soundId, result.audioBuffer, result.metadata)
                    .catch(error => {
                        this.logger.error('sample-manager', `Failed to cache downloaded sample - soundId: ${result.soundId}, error: ${error.message}`);
                    });
            }
        });
    }

    /**
     * Private: Build duration filter for Freesound API
     */
    private buildDurationFilter(minDuration?: number, maxDuration?: number): string | undefined {
        if (!minDuration && !maxDuration) return undefined;

        const filters: string[] = [];
        if (minDuration !== undefined) {
            filters.push(`duration:[${minDuration} TO *]`);
        }
        if (maxDuration !== undefined) {
            filters.push(`duration:[* TO ${maxDuration}]`);
        }

        return filters.join(' AND ');
    }

    /**
     * Private: Setup network monitoring for offline detection
     */
    private setupNetworkMonitoring(): void {
        // Monitor online/offline status
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOffline = false;
                this.logger.info('sample-manager', 'Network connection restored - switching to online mode');
            });

            window.addEventListener('offline', () => {
                this.isOffline = true;
                this.logger.warn('sample-manager', 'Network connection lost - switching to offline mode');
            });

            // Check initial status
            this.isOffline = !navigator.onLine;
        }
    }

    /**
     * Check if manager is in offline mode
     */
    isInOfflineMode(): boolean {
        return this.isOffline;
    }

    /**
     * Update preloader configuration
     */
    updatePreloaderConfig(config: Partial<PreloadConfig>): void {
        this.preloader.updateConfig(config);
        this.logger.info('sample-manager', 'Preloader configuration updated');
    }

    /**
     * Update cache strategy configuration
     */
    updateCacheStrategyConfig(config: Partial<CacheStrategyConfig>): void {
        this.cacheStrategy.updateConfig(config);
        this.logger.info('sample-manager', 'Cache strategy configuration updated');
    }

    /**
     * Get preloader status
     */
    getPreloaderStatus(): PreloadStatus {
        return this.preloader.getStatus();
    }

    /**
     * Get usage metrics
     */
    getUsageMetrics(): UsageMetrics {
        return this.preloader.getUsageMetrics();
    }

    /**
     * Record genre usage for predictive preloading
     */
    recordGenreUsage(genre: MusicalGenre): void {
        this.preloader.recordGenreUsage(genre);
        this.logger.debug('sample-manager', `Genre usage recorded - genre: ${genre}`);
    }

    /**
     * Preload critical samples
     */
    async preloadCriticalSamples(): Promise<void> {
        await this.preloader.preloadCriticalSamples();
    }

    /**
     * Cancel current preloading
     */
    cancelPreload(): void {
        this.preloader.cancelPreload();
    }

    /**
     * Optimize cache using current strategy
     */
    async optimizeCache(): Promise<CacheOptimizationResult> {
        const stats = await this.getCacheStatistics();
        const result = this.cacheStrategy.optimizeCache(stats);
        this.logger.info('sample-manager', 'Cache optimization completed - ' + JSON.stringify({
            itemsEvicted: result.itemsEvicted,
            spaceFreedMB: result.spaceFreedMB.toFixed(2)
        }));
        return result;
    }

    /**
     * Get cache recommendations
     */
    getCacheRecommendations(): string[] {
        return this.cacheStrategy.getRecommendations();
    }

    /**
     * Register cache item for strategy tracking
     */
    private registerCacheItem(soundId: number, genre: MusicalGenre, priority: CachePriority, sizeBytes: number): void {
        const item: CacheItem = {
            soundId,
            genre,
            priority,
            accessCount: 1,
            lastAccessed: Date.now(),
            addedTime: Date.now(),
            sizeBytes
        };
        this.cacheStrategy.registerItem(item);
    }

    /**
     * Record cache access for strategy
     */
    private recordCacheAccess(soundId: number): void {
        this.cacheStrategy.recordAccess(soundId);
    }

    /**
     * Get sample with offline fallback
     * Returns cached sample if available, null if offline and not cached
     */
    async getSampleWithOfflineFallback(soundId: number): Promise<AudioBuffer | null> {
        // Try cache first
        const cached = await this.getCachedSample(soundId);
        if (cached) {
            this.recordCacheAccess(soundId);
            return cached;
        }

        // If offline, return null (graceful degradation)
        if (this.isOffline) {
            this.logger.warn('sample-manager', 'Sample not in cache and offline - returning null - ' + JSON.stringify({ soundId }));
            return null;
        }

        // Try downloading
        try {
            return await this.downloadSample(soundId);
        } catch (error) {
            this.logger.error('sample-manager', `Failed to download sample - soundId: ${soundId}, error: ${error.message}`);
            return null;
        }
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.cache.dispose();
        this.downloadQueue.dispose();
        this.preloader.dispose();
        this.cacheStrategy.clear();
        this.genreCollections.clear();
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.logger.info('sample-manager', 'FreesoundSampleManager disposed');
    }
}