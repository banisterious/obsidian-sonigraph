/**
 * Cache optimization strategies for intelligent sample management
 * Implements various caching algorithms and optimization techniques
 */

import { getLogger } from '../../logging';
import { MusicalGenre } from './FreesoundSampleManager';
import { CacheStatistics } from './SampleCache';

export type CacheEvictionStrategy = 'lru' | 'lfu' | 'fifo' | 'adaptive' | 'predictive';
export type CachePriority = 'critical' | 'high' | 'medium' | 'low';

export interface CacheItem {
    soundId: number;
    genre: MusicalGenre;
    priority: CachePriority;
    accessCount: number;
    lastAccessed: number;
    addedTime: number;
    sizeBytes: number;
    predictedNextUse?: number; // Predicted timestamp for next access
}

export interface CacheStrategyConfig {
    evictionStrategy: CacheEvictionStrategy;
    maxMemoryCacheSize: number; // In MB
    maxDiskCacheSize: number; // In MB
    minAccessCountForPromotion: number;
    staleThresholdMs: number; // Consider item stale after this time
    predictiveWindowMs: number; // Look-ahead window for prediction
    priorityWeights: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

export interface EvictionCandidate {
    soundId: number;
    score: number; // Lower score = more likely to evict
    reason: string;
}

export interface CacheOptimizationResult {
    itemsEvicted: number;
    spaceFreedMB: number;
    itemsPromoted: number;
    itemsDemoted: number;
    duration: number;
}

export class CacheStrategy {
    private config: CacheStrategyConfig;
    private cacheItems: Map<number, CacheItem>;
    private genreFrequency: Map<MusicalGenre, number>;
    private logger = getLogger('cache-strategy');

    // Adaptive learning
    private accessHistory: Array<{ soundId: number; timestamp: number }> = [];
    private maxHistorySize: number = 1000;

    constructor(config?: Partial<CacheStrategyConfig>) {
        this.config = {
            evictionStrategy: 'adaptive',
            maxMemoryCacheSize: 50,
            maxDiskCacheSize: 500,
            minAccessCountForPromotion: 3,
            staleThresholdMs: 30 * 24 * 60 * 60 * 1000, // 30 days
            predictiveWindowMs: 5 * 60 * 1000, // 5 minutes look-ahead
            priorityWeights: {
                critical: 10.0,
                high: 5.0,
                medium: 2.0,
                low: 1.0
            },
            ...config
        };

        this.cacheItems = new Map();
        this.genreFrequency = new Map();
    }

    /**
     * Register cache item for tracking
     */
    registerItem(item: CacheItem): void {
        this.cacheItems.set(item.soundId, item);

        // Update genre frequency
        const currentFreq = this.genreFrequency.get(item.genre) || 0;
        this.genreFrequency.set(item.genre, currentFreq + 1);

        this.logger.debug('cache-strategy', `Cache item registered - soundId: ${item.soundId}, genre: ${item.genre}, priority: ${item.priority}`);
    }

    /**
     * Update item access statistics
     */
    recordAccess(soundId: number): void {
        const item = this.cacheItems.get(soundId);
        if (!item) return;

        item.accessCount++;
        item.lastAccessed = Date.now();

        // Add to access history
        this.accessHistory.push({ soundId, timestamp: Date.now() });
        if (this.accessHistory.length > this.maxHistorySize) {
            this.accessHistory.shift();
        }

        // Predict next access time for adaptive strategy
        if (this.config.evictionStrategy === 'adaptive' || this.config.evictionStrategy === 'predictive') {
            item.predictedNextUse = this.predictNextAccessTime(soundId);
        }

        this.logger.debug('cache-strategy', `Access recorded - soundId: ${soundId}, count: ${item.accessCount}`);
    }

    /**
     * Remove item from tracking
     */
    unregisterItem(soundId: number): void {
        const item = this.cacheItems.get(soundId);
        if (item) {
            // Update genre frequency
            const currentFreq = this.genreFrequency.get(item.genre) || 0;
            this.genreFrequency.set(item.genre, Math.max(0, currentFreq - 1));

            this.cacheItems.delete(soundId);
            this.logger.debug('cache-strategy', 'Cache item unregistered - ' + JSON.stringify({ soundId }));
        }
    }

    /**
     * Get eviction candidates based on current strategy
     */
    getEvictionCandidates(count: number): EvictionCandidate[] {
        const items = Array.from(this.cacheItems.values());

        switch (this.config.evictionStrategy) {
            case 'lru':
                return this.getLRUCandidates(items, count);
            case 'lfu':
                return this.getLFUCandidates(items, count);
            case 'fifo':
                return this.getFIFOCandidates(items, count);
            case 'adaptive':
                return this.getAdaptiveCandidates(items, count);
            case 'predictive':
                return this.getPredictiveCandidates(items, count);
            default:
                return this.getLRUCandidates(items, count);
        }
    }

    /**
     * Calculate item priority score
     * Higher score = keep in cache, Lower score = evict
     */
    calculatePriorityScore(item: CacheItem): number {
        const now = Date.now();
        const timeSinceAccess = now - item.lastAccessed;
        const age = now - item.addedTime;

        // Base score from priority weight
        let score = this.config.priorityWeights[item.priority];

        // Factor 1: Access frequency (more accesses = higher score)
        const accessFrequency = item.accessCount / Math.max(1, age / (24 * 60 * 60 * 1000)); // Accesses per day
        score += accessFrequency * 2;

        // Factor 2: Recency (more recent = higher score)
        const recencyFactor = Math.max(0, 1 - (timeSinceAccess / this.config.staleThresholdMs));
        score += recencyFactor * 3;

        // Factor 3: Genre popularity (popular genres get bonus)
        const genreFreq = this.genreFrequency.get(item.genre) || 0;
        const maxGenreFreq = Math.max(...Array.from(this.genreFrequency.values()));
        const genrePopularity = maxGenreFreq > 0 ? genreFreq / maxGenreFreq : 0;
        score += genrePopularity * 2;

        // Factor 4: Predicted next use (adaptive/predictive strategies)
        if (item.predictedNextUse !== undefined) {
            const timeUntilNextUse = item.predictedNextUse - now;
            if (timeUntilNextUse < this.config.predictiveWindowMs) {
                score += 5; // Big bonus if predicted to be used soon
            }
        }

        return score;
    }

    /**
     * Optimize cache based on current strategy
     */
    optimizeCache(currentStats: CacheStatistics): CacheOptimizationResult {
        const startTime = Date.now();
        let itemsEvicted = 0;
        let spaceFreedMB = 0;
        let itemsPromoted = 0;
        let itemsDemoted = 0;

        this.logger.info('cache-strategy', 'Starting cache optimization - ' + JSON.stringify({
            strategy: this.config.evictionStrategy,
            itemCount: this.cacheItems.size
        }));

        // Step 1: Identify stale items
        const staleItems = this.identifyStaleItems();
        for (const item of staleItems) {
            void this.unregisterItem(item.soundId);
            itemsEvicted++;
            spaceFreedMB += item.sizeBytes / (1024 * 1024);
        }

        // Step 2: Identify promotion/demotion candidates
        const promotionCandidates = this.identifyPromotionCandidates();
        const demotionCandidates = this.identifyDemotionCandidates();

        itemsPromoted = promotionCandidates.length;
        itemsDemoted = demotionCandidates.length;

        // Step 3: Apply priority adjustments
        for (const item of promotionCandidates) {
            void this.promotePriority(item);
        }

        for (const item of demotionCandidates) {
            void this.demotePriority(item);
        }

        const duration = Date.now() - startTime;

        this.logger.info('cache-strategy', 'Cache optimization completed - ' + JSON.stringify({
            itemsEvicted,
            spaceFreedMB: spaceFreedMB.toFixed(2),
            itemsPromoted,
            itemsDemoted,
            durationMs: duration
        }));

        return {
            itemsEvicted,
            spaceFreedMB,
            itemsPromoted,
            itemsDemoted,
            duration
        };
    }

    /**
     * Get cache statistics and recommendations
     */
    getRecommendations(): string[] {
        const recommendations: string[] = [];
        const items = Array.from(this.cacheItems.values());

        // Check for over-representation of low-priority items
        const lowPriorityCount = items.filter(item => item.priority === 'low').length;
        const totalCount = items.length;

        if (lowPriorityCount / totalCount > 0.5) {
            void recommendations.push('Consider evicting low-priority items to free up space');
        }

        // Check for stale items
        const staleItems = this.identifyStaleItems();
        if (staleItems.length > 0) {
            recommendations.push(`${staleItems.length} stale items detected - consider pruning`);
        }

        // Check genre diversity
        const genreCount = this.genreFrequency.size;
        if (genreCount < 3) {
            void recommendations.push('Cache has low genre diversity - consider preloading more genres');
        }

        // Check access patterns
        const recentlyAccessed = items.filter(item => {
            const timeSinceAccess = Date.now() - item.lastAccessed;
            return timeSinceAccess < 60 * 60 * 1000; // Last hour
        });

        if (recentlyAccessed.length / totalCount < 0.2) {
            void recommendations.push('Low cache hit rate - consider different preloading strategy');
        }

        return recommendations;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<CacheStrategyConfig>): void {
        this.config = { ...this.config, ...config };
        this.logger.info('cache-strategy', 'Configuration updated - ' + JSON.stringify(config));
    }

    /**
     * Clear all tracking data
     */
    clear(): void {
        this.cacheItems.clear();
        this.genreFrequency.clear();
        this.accessHistory = [];
        this.logger.info('cache-strategy', 'Cache strategy cleared');
    }

    /**
     * Private: LRU eviction candidates
     */
    private getLRUCandidates(items: CacheItem[], count: number): EvictionCandidate[] {
        return items
            .sort((a, b) => a.lastAccessed - b.lastAccessed)
            .slice(0, count)
            .map(item => ({
                soundId: item.soundId,
                score: item.lastAccessed,
                reason: 'Least recently used'
            }));
    }

    /**
     * Private: LFU eviction candidates
     */
    private getLFUCandidates(items: CacheItem[], count: number): EvictionCandidate[] {
        return items
            .sort((a, b) => a.accessCount - b.accessCount)
            .slice(0, count)
            .map(item => ({
                soundId: item.soundId,
                score: item.accessCount,
                reason: 'Least frequently used'
            }));
    }

    /**
     * Private: FIFO eviction candidates
     */
    private getFIFOCandidates(items: CacheItem[], count: number): EvictionCandidate[] {
        return items
            .sort((a, b) => a.addedTime - b.addedTime)
            .slice(0, count)
            .map(item => ({
                soundId: item.soundId,
                score: item.addedTime,
                reason: 'First in, first out'
            }));
    }

    /**
     * Private: Adaptive eviction candidates
     */
    private getAdaptiveCandidates(items: CacheItem[], count: number): EvictionCandidate[] {
        return items
            .map(item => ({
                soundId: item.soundId,
                score: this.calculatePriorityScore(item),
                reason: 'Adaptive scoring'
            }))
            .sort((a, b) => a.score - b.score)
            .slice(0, count);
    }

    /**
     * Private: Predictive eviction candidates
     */
    private getPredictiveCandidates(items: CacheItem[], count: number): EvictionCandidate[] {
        const now = Date.now();

        return items
            .map(item => {
                const score = this.calculatePriorityScore(item);
                const predictedNextUse = item.predictedNextUse || now + this.config.staleThresholdMs;
                const timeUntilNextUse = predictedNextUse - now;

                // Penalize items not predicted to be used soon
                const adjustedScore = timeUntilNextUse > this.config.predictiveWindowMs
                    ? score * 0.5
                    : score;

                return {
                    soundId: item.soundId,
                    score: adjustedScore,
                    reason: 'Predictive scoring'
                };
            })
            .sort((a, b) => a.score - b.score)
            .slice(0, count);
    }

    /**
     * Private: Identify stale items
     */
    private identifyStaleItems(): CacheItem[] {
        const now = Date.now();
        const staleItems: CacheItem[] = [];

        for (const item of this.cacheItems.values()) {
            const timeSinceAccess = now - item.lastAccessed;
            if (timeSinceAccess > this.config.staleThresholdMs) {
                void staleItems.push(item);
            }
        }

        return staleItems;
    }

    /**
     * Private: Identify promotion candidates
     */
    private identifyPromotionCandidates(): CacheItem[] {
        const candidates: CacheItem[] = [];

        for (const item of this.cacheItems.values()) {
            // Promote if access count exceeds threshold and not already critical
            if (item.accessCount >= this.config.minAccessCountForPromotion &&
                item.priority !== 'critical') {

                const score = this.calculatePriorityScore(item);
                if (score > 5) { // Arbitrary threshold
                    void candidates.push(item);
                }
            }
        }

        return candidates;
    }

    /**
     * Private: Identify demotion candidates
     */
    private identifyDemotionCandidates(): CacheItem[] {
        const now = Date.now();
        const candidates: CacheItem[] = [];

        for (const item of this.cacheItems.values()) {
            // Demote if not accessed recently and priority is high
            const timeSinceAccess = now - item.lastAccessed;
            if (timeSinceAccess > this.config.staleThresholdMs / 2 &&
                (item.priority === 'critical' || item.priority === 'high')) {

                void candidates.push(item);
            }
        }

        return candidates;
    }

    /**
     * Private: Promote item priority
     */
    private promotePriority(item: CacheItem): void {
        const priorityOrder: CachePriority[] = ['low', 'medium', 'high', 'critical'];
        const currentIndex = priorityOrder.indexOf(item.priority);

        if (currentIndex < priorityOrder.length - 1) {
            item.priority = priorityOrder[currentIndex + 1];
            this.logger.debug('cache-strategy', `Item priority promoted - soundId: ${item.soundId}, newPriority: ${item.priority}`);
        }
    }

    /**
     * Private: Demote item priority
     */
    private demotePriority(item: CacheItem): void {
        const priorityOrder: CachePriority[] = ['low', 'medium', 'high', 'critical'];
        const currentIndex = priorityOrder.indexOf(item.priority);

        if (currentIndex > 0) {
            item.priority = priorityOrder[currentIndex - 1];
            this.logger.debug('cache-strategy', `Item priority demoted - soundId: ${item.soundId}, newPriority: ${item.priority}`);
        }
    }

    /**
     * Private: Predict next access time for a sound
     */
    private predictNextAccessTime(soundId: number): number {
        // Find all previous accesses of this sound
        const accesses = this.accessHistory
            .filter(entry => entry.soundId === soundId)
            .map(entry => entry.timestamp);

        if (accesses.length < 2) {
            // Not enough data, return far future
            return Date.now() + this.config.staleThresholdMs;
        }

        // Calculate average time between accesses
        const intervals: number[] = [];
        for (let i = 1; i < accesses.length; i++) {
            intervals.push(accesses[i] - accesses[i - 1]);
        }

        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

        // Predict next access time
        const lastAccess = accesses[accesses.length - 1];
        return lastAccess + avgInterval;
    }
}