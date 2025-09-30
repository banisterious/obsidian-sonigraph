/**
 * Intelligent sample preloading system
 * Handles predictive preloading, priority management, and background loading
 */

import { getLogger } from '../../logging';
import { FreesoundSampleManager, MusicalGenre } from './FreesoundSampleManager';
import { CacheStatistics } from './SampleCache';

export interface PreloadStrategy {
    type: 'immediate' | 'progressive' | 'idle' | 'manual';
    priority: 'critical' | 'high' | 'medium' | 'low';
    maxConcurrentDownloads: number;
    backgroundThrottleMs: number;
}

export interface UsageMetrics {
    genrePlayCount: Map<MusicalGenre, number>;
    genreLastUsed: Map<MusicalGenre, number>;
    recentGenres: MusicalGenre[];
    mostUsedGenre: MusicalGenre | null;
}

export interface PreloadConfig {
    enabled: boolean;
    strategy: PreloadStrategy;
    preloadOnStartup: boolean;
    predictivePreloading: boolean;
    maxStorageQuotaMB: number;
    backgroundLoadingEnabled: boolean;
    networkThrottling: boolean;
}

export interface PreloadStatus {
    isPreloading: boolean;
    currentGenre: MusicalGenre | null;
    queuedGenres: MusicalGenre[];
    progress: number; // 0-100
    estimatedTimeRemainingMs: number;
}

export class SamplePreloader {
    private sampleManager: FreesoundSampleManager;
    private config: PreloadConfig;
    private usageMetrics: UsageMetrics;
    private logger = getLogger('sample-preloader');
    private audioContext: AudioContext;

    // Preload state
    private isPreloading: boolean = false;
    private currentGenre: MusicalGenre | null = null;
    private preloadQueue: MusicalGenre[] = [];
    private preloadStartTime: number = 0;
    private samplesPreloaded: number = 0;
    private totalSamplesToPreload: number = 0;

    // Idle detection
    private idleTimer: NodeJS.Timeout | null = null;
    private lastActivityTime: number = Date.now();
    private idleThresholdMs: number = 5000; // 5 seconds of inactivity

    // Storage quota tracking
    private currentStorageUsageMB: number = 0;
    private storageQuotaExceeded: boolean = false;

    constructor(
        sampleManager: FreesoundSampleManager,
        audioContext: AudioContext,
        config?: Partial<PreloadConfig>
    ) {
        this.sampleManager = sampleManager;
        this.audioContext = audioContext;
        this.config = {
            enabled: true,
            strategy: {
                type: 'progressive',
                priority: 'medium',
                maxConcurrentDownloads: 3,
                backgroundThrottleMs: 500
            },
            preloadOnStartup: false,
            predictivePreloading: true,
            maxStorageQuotaMB: 100, // 100MB default limit
            backgroundLoadingEnabled: true,
            networkThrottling: true,
            ...config
        };

        this.usageMetrics = {
            genrePlayCount: new Map(),
            genreLastUsed: new Map(),
            recentGenres: [],
            mostUsedGenre: null
        };

        this.startIdleDetection();
    }

    /**
     * Preload samples for a specific genre
     */
    async preloadForGenre(genre: MusicalGenre): Promise<void> {
        if (!this.config.enabled) {
            this.logger.debug('preloader', 'Preloading disabled, skipping - ' + JSON.stringify({ genre }));
            return;
        }

        if (this.storageQuotaExceeded) {
            this.logger.warn('preloader', 'Storage quota exceeded, cannot preload - ' + JSON.stringify({ genre }));
            return;
        }

        // Check if already in queue
        if (this.preloadQueue.includes(genre)) {
            this.logger.debug('preloader', 'Genre already in preload queue - ' + JSON.stringify({ genre }));
            return;
        }

        // Add to queue
        this.preloadQueue.push(genre);
        this.logger.info('preloader', `Genre added to preload queue - genre: ${genre}, queueLength: ${this.preloadQueue.length}`);

        // Start processing if not already running
        if (!this.isPreloading) {
            await this.processPreloadQueue();
        }
    }

    /**
     * Preload critical samples immediately
     * These are samples that are likely to be used soon
     */
    async preloadCriticalSamples(): Promise<void> {
        if (!this.config.enabled) return;

        this.logger.info('preloader', 'Preloading critical samples');

        // Identify critical genres based on usage metrics
        const criticalGenres = this.identifyCriticalGenres();

        // Preload in priority order
        for (const genre of criticalGenres) {
            await this.preloadForGenre(genre);
        }
    }

    /**
     * Update preload priority based on usage patterns
     */
    updatePreloadPriority(usage: UsageMetrics): void {
        this.usageMetrics = usage;

        if (!this.config.predictivePreloading) return;

        // Predict next likely genres
        const predictedGenres = this.predictNextGenres();

        // Reorder preload queue based on predictions
        this.reorderPreloadQueue(predictedGenres);

        // Trigger background preloading for predicted genres
        if (this.config.backgroundLoadingEnabled && !this.isPreloading) {
            this.backgroundPreload(predictedGenres);
        }

        this.logger.debug('preloader', 'Preload priority updated - ' + JSON.stringify({
            predictedGenres,
            queueLength: this.preloadQueue.length
        }));
    }

    /**
     * Record genre usage for predictive preloading
     */
    recordGenreUsage(genre: MusicalGenre): void {
        const currentCount = this.usageMetrics.genrePlayCount.get(genre) || 0;
        this.usageMetrics.genrePlayCount.set(genre, currentCount + 1);
        this.usageMetrics.genreLastUsed.set(genre, Date.now());

        // Update recent genres list (keep last 10)
        this.usageMetrics.recentGenres.unshift(genre);
        if (this.usageMetrics.recentGenres.length > 10) {
            this.usageMetrics.recentGenres = this.usageMetrics.recentGenres.slice(0, 10);
        }

        // Update most used genre
        this.usageMetrics.mostUsedGenre = this.calculateMostUsedGenre();

        this.logger.debug('preloader', `Genre usage recorded - genre: ${genre}, count: ${currentCount + 1}`);

        // Trigger predictive preloading if enabled
        if (this.config.predictivePreloading) {
            this.updatePreloadPriority(this.usageMetrics);
        }
    }

    /**
     * Get current preload status
     */
    getStatus(): PreloadStatus {
        const progress = this.totalSamplesToPreload > 0
            ? (this.samplesPreloaded / this.totalSamplesToPreload) * 100
            : 0;

        const elapsedTime = Date.now() - this.preloadStartTime;
        const samplesRemaining = this.totalSamplesToPreload - this.samplesPreloaded;
        const avgTimePerSample = this.samplesPreloaded > 0 ? elapsedTime / this.samplesPreloaded : 0;
        const estimatedTimeRemaining = avgTimePerSample * samplesRemaining;

        return {
            isPreloading: this.isPreloading,
            currentGenre: this.currentGenre,
            queuedGenres: [...this.preloadQueue],
            progress,
            estimatedTimeRemainingMs: Math.round(estimatedTimeRemaining)
        };
    }

    /**
     * Get usage metrics
     */
    getUsageMetrics(): UsageMetrics {
        return { ...this.usageMetrics };
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<PreloadConfig>): void {
        this.config = { ...this.config, ...config };
        this.logger.info('preloader', 'Configuration updated - ' + JSON.stringify(config));
    }

    /**
     * Check if storage quota is available
     */
    async checkStorageQuota(): Promise<boolean> {
        try {
            const cacheStats = await this.sampleManager.getCacheStatistics();
            const totalSizeMB = (cacheStats.memorySize + cacheStats.diskSize) / (1024 * 1024);

            this.currentStorageUsageMB = totalSizeMB;
            this.storageQuotaExceeded = totalSizeMB >= this.config.maxStorageQuotaMB;

            if (this.storageQuotaExceeded) {
                this.logger.warn('preloader', 'Storage quota exceeded - ' + JSON.stringify({
                    currentUsageMB: totalSizeMB.toFixed(2),
                    quotaMB: this.config.maxStorageQuotaMB
                }));
            }

            return !this.storageQuotaExceeded;
        } catch (error) {
            this.logger.error('preloader', 'Failed to check storage quota - ' + JSON.stringify({ error: error.message }));
            return false;
        }
    }

    /**
     * Clear preload queue
     */
    clearQueue(): void {
        this.preloadQueue = [];
        this.logger.info('preloader', 'Preload queue cleared');
    }

    /**
     * Cancel current preloading
     */
    cancelPreload(): void {
        this.isPreloading = false;
        this.currentGenre = null;
        this.clearQueue();
        this.logger.info('preloader', 'Preloading cancelled');
    }

    /**
     * Private: Process preload queue
     */
    private async processPreloadQueue(): Promise<void> {
        if (this.isPreloading || this.preloadQueue.length === 0) return;

        this.isPreloading = true;
        this.preloadStartTime = Date.now();
        this.samplesPreloaded = 0;

        while (this.preloadQueue.length > 0) {
            // Check storage quota
            const hasQuota = await this.checkStorageQuota();
            if (!hasQuota) {
                this.logger.warn('preloader', 'Storage quota exceeded, stopping preload');
                break;
            }

            // Get next genre
            const genre = this.preloadQueue.shift()!;
            this.currentGenre = genre;

            // Get genre collection
            const collection = this.sampleManager.getGenreCollection(genre);
            if (!collection) {
                this.logger.warn('preloader', 'Genre collection not found - ' + JSON.stringify({ genre }));
                continue;
            }

            this.totalSamplesToPreload = collection.soundIds.length;
            this.logger.info('preloader', `Preloading genre - genre: ${genre}, sampleCount: ${this.totalSamplesToPreload}`);

            // Preload samples
            try {
                await this.sampleManager.preloadGenreSamples(genre);
                this.samplesPreloaded = this.totalSamplesToPreload;
                this.logger.info('preloader', `Genre preload completed - genre: ${genre}`);
            } catch (error) {
                this.logger.error('preloader', `Genre preload failed - genre: ${genre}, error: ${error.message}`);
            }

            // Apply throttling if in background mode
            if (this.config.strategy.type === 'idle' && this.config.backgroundLoadingEnabled) {
                await this.sleep(this.config.strategy.backgroundThrottleMs);
            }
        }

        this.isPreloading = false;
        this.currentGenre = null;
        this.logger.info('preloader', 'Preload queue processing completed');
    }

    /**
     * Private: Identify critical genres for immediate preloading
     */
    private identifyCriticalGenres(): MusicalGenre[] {
        const criticalGenres: MusicalGenre[] = [];

        // Most used genre
        if (this.usageMetrics.mostUsedGenre) {
            criticalGenres.push(this.usageMetrics.mostUsedGenre);
        }

        // Recently used genres (last 3)
        const recentUnique = [...new Set(this.usageMetrics.recentGenres.slice(0, 3))];
        for (const genre of recentUnique) {
            if (!criticalGenres.includes(genre)) {
                criticalGenres.push(genre);
            }
        }

        return criticalGenres;
    }

    /**
     * Private: Predict next likely genres based on usage patterns
     */
    private predictNextGenres(): MusicalGenre[] {
        const predictions: MusicalGenre[] = [];

        // Strategy 1: Recent trend continuation
        if (this.usageMetrics.recentGenres.length >= 2) {
            const lastGenre = this.usageMetrics.recentGenres[0];
            predictions.push(lastGenre);
        }

        // Strategy 2: Frequently used genres
        const sortedByCount = Array.from(this.usageMetrics.genrePlayCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        for (const genre of sortedByCount) {
            if (!predictions.includes(genre)) {
                predictions.push(genre);
            }
        }

        // Strategy 3: Genre rotation (if user cycles through genres)
        const recentPattern = this.detectGenrePattern();
        if (recentPattern) {
            for (const genre of recentPattern) {
                if (!predictions.includes(genre)) {
                    predictions.push(genre);
                }
            }
        }

        return predictions.slice(0, 5); // Top 5 predictions
    }

    /**
     * Private: Detect genre usage patterns
     */
    private detectGenrePattern(): MusicalGenre[] | null {
        if (this.usageMetrics.recentGenres.length < 4) return null;

        // Check if there's a repeating pattern
        const recent = this.usageMetrics.recentGenres.slice(0, 4);
        const unique = [...new Set(recent)];

        // If user cycles through 2-3 genres
        if (unique.length >= 2 && unique.length <= 3) {
            return unique;
        }

        return null;
    }

    /**
     * Private: Reorder preload queue based on predictions
     */
    private reorderPreloadQueue(predictedGenres: MusicalGenre[]): void {
        if (this.preloadQueue.length === 0) return;

        // Create priority map
        const priorityMap = new Map<MusicalGenre, number>();
        predictedGenres.forEach((genre, index) => {
            priorityMap.set(genre, predictedGenres.length - index);
        });

        // Sort queue by priority
        this.preloadQueue.sort((a, b) => {
            const priorityA = priorityMap.get(a) || 0;
            const priorityB = priorityMap.get(b) || 0;
            return priorityB - priorityA;
        });
    }

    /**
     * Private: Background preload during idle time
     */
    private async backgroundPreload(genres: MusicalGenre[]): Promise<void> {
        if (!this.config.backgroundLoadingEnabled || this.isPreloading) return;

        // Only preload if system has been idle
        const idleTime = Date.now() - this.lastActivityTime;
        if (idleTime < this.idleThresholdMs) return;

        this.logger.info('preloader', 'Starting background preload - ' + JSON.stringify({
            genres,
            idleTimeMs: idleTime
        }));

        // Add genres to queue
        for (const genre of genres) {
            if (!this.preloadQueue.includes(genre)) {
                this.preloadQueue.push(genre);
            }
        }

        // Process queue in background
        await this.processPreloadQueue();
    }

    /**
     * Private: Start idle detection
     */
    private startIdleDetection(): void {
        this.idleTimer = setInterval(() => {
            const idleTime = Date.now() - this.lastActivityTime;

            if (idleTime >= this.idleThresholdMs &&
                this.config.backgroundLoadingEnabled &&
                !this.isPreloading &&
                this.preloadQueue.length > 0) {

                this.processPreloadQueue().catch(error => {
                    this.logger.error('preloader', 'Background preload failed - ' + JSON.stringify({ error: error.message }));
                });
            }
        }, 2000); // Check every 2 seconds
    }

    /**
     * Private: Calculate most used genre
     */
    private calculateMostUsedGenre(): MusicalGenre | null {
        if (this.usageMetrics.genrePlayCount.size === 0) return null;

        let maxCount = 0;
        let mostUsed: MusicalGenre | null = null;

        for (const [genre, count] of this.usageMetrics.genrePlayCount.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostUsed = genre;
            }
        }

        return mostUsed;
    }

    /**
     * Private: Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Record user activity (resets idle timer)
     */
    recordActivity(): void {
        this.lastActivityTime = Date.now();
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        if (this.idleTimer) {
            clearInterval(this.idleTimer);
            this.idleTimer = null;
        }
        this.cancelPreload();
        this.logger.info('preloader', 'SamplePreloader disposed');
    }
}