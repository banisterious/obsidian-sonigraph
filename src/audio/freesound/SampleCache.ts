/**
 * Sample caching system with IndexedDB persistence and memory cache
 * Implements LRU eviction for efficient memory management
 */

import { getLogger } from '../../logging';

export interface CachedSample {
    soundId: number;
    audioBuffer: AudioBuffer;
    metadata: {
        name: string;
        duration: number;
        tags: string[];
        license: string;
        username: string;
    };
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
}

export interface CacheStatistics {
    memorySize: number;
    diskSize: number;
    memoryCacheCount: number;
    diskCacheCount: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
}

interface IndexedDBSample {
    soundId: number;
    audioData: ArrayBuffer;
    metadata: CachedSample['metadata'];
    timestamp: number;
}

export class SampleCache {
    private memoryCache: Map<number, CachedSample>;
    private accessOrder: number[]; // For LRU tracking
    private maxMemoryCacheSize: number;
    private db: IDBDatabase | null = null;
    private dbName: string = 'sonigraph-sample-cache';
    private dbVersion: number = 1;
    private storeName: string = 'samples';

    // Statistics
    private hits: number = 0;
    private misses: number = 0;
    private evictions: number = 0;

    private logger = getLogger('sample-cache');

    constructor(maxMemoryCacheSize: number = 50) {
        this.memoryCache = new Map();
        this.accessOrder = [];
        this.maxMemoryCacheSize = maxMemoryCacheSize;
    }

    /**
     * Initialize IndexedDB connection
     */
    initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                this.logger.error('cache', 'Failed to open IndexedDB', request.error);
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.logger.info('cache', 'IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'soundId' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    this.logger.info('cache', 'Created IndexedDB object store');
                }
            };
        });
    }

    /**
     * Get sample from cache (memory first, then disk)
     */
    async get(soundId: number): Promise<AudioBuffer | null> {
        // Check memory cache first
        const memorySample = this.memoryCache.get(soundId);
        if (memorySample) {
            this.hits++;
            void this.updateAccessOrder(soundId);
            memorySample.accessCount++;
            memorySample.lastAccessed = Date.now();
            this.logger.debug('cache', 'Sample retrieved from memory cache - ' + JSON.stringify({ soundId }));
            return memorySample.audioBuffer;
        }

        // Check IndexedDB
        const diskSample = await this.getFromDisk(soundId);
        if (diskSample) {
            this.hits++;
            // Promote to memory cache
            await this.addToMemoryCache(soundId, diskSample.audioData, diskSample.metadata);
            this.logger.debug('cache', 'Sample retrieved from disk cache and promoted to memory - ' + JSON.stringify({ soundId }));
            return this.memoryCache.get(soundId)?.audioBuffer || null;
        }

        this.misses++;
        this.logger.debug('cache', 'Sample cache miss - ' + JSON.stringify({ soundId }));
        return null;
    }

    /**
     * Add sample to cache (both memory and disk)
     */
    async add(
        soundId: number,
        audioBuffer: AudioBuffer,
        metadata: CachedSample['metadata']
    ): Promise<void> {
        // Add to memory cache
        const sample: CachedSample = {
            soundId,
            audioBuffer,
            metadata,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now()
        };

        this.memoryCache.set(soundId, sample);
        void this.updateAccessOrder(soundId);
        void this.enforceLRU();

        // Add to disk cache
        await this.addToDisk(soundId, audioBuffer, metadata);

        this.logger.debug('cache', 'Sample added to cache - ' + JSON.stringify({ soundId, name: metadata.name }));
    }

    /**
     * Check if sample exists in cache
     */
    async has(soundId: number): Promise<boolean> {
        if (this.memoryCache.has(soundId)) {
            return true;
        }
        return await this.existsOnDisk(soundId);
    }

    /**
     * Remove sample from cache
     */
    async remove(soundId: number): Promise<void> {
        this.memoryCache.delete(soundId);
        this.accessOrder = this.accessOrder.filter(id => id !== soundId);
        await this.removeFromDisk(soundId);
        this.logger.debug('cache', 'Sample removed from cache - ' + JSON.stringify({ soundId }));
    }

    /**
     * Clear entire cache
     */
    async clear(): Promise<void> {
        this.memoryCache.clear();
        this.accessOrder = [];
        await this.clearDisk();
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
        this.logger.info('cache', 'Cache cleared');
    }

    /**
     * Get cache statistics
     */
    async getStatistics(): Promise<CacheStatistics> {
        const diskCount = await this.getDiskCacheCount();
        const totalRequests = this.hits + this.misses;

        return {
            memorySize: this.getMemoryCacheSize(),
            diskSize: await this.getDiskCacheSize(),
            memoryCacheCount: this.memoryCache.size,
            diskCacheCount: diskCount,
            hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
            missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
            evictionCount: this.evictions
        };
    }

    /**
     * Prune old samples from disk cache
     */
    pruneOldSamples(maxAgeMs: number): Promise<number> {
        if (!this.db) return Promise.resolve(0);

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');

        const cutoffTime = Date.now() - maxAgeMs;
        const request = index.openCursor();
        let prunedCount = 0;

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const sample = cursor.value as IndexedDBSample;
                    if (sample.timestamp < cutoffTime) {
                        void cursor.delete();
                        prunedCount++;
                    }
                    void cursor.continue();
                } else {
                    this.logger.info('cache', 'Pruned old samples from disk cache - ' + JSON.stringify({ count: prunedCount }));
                    resolve(prunedCount);
                }
            };

            request.onerror = () => reject(new Error('Failed to prune old samples'));
        });
    }

    /**
     * Private: Add sample to memory cache with LRU management
     */
    private async addToMemoryCache(
        soundId: number,
        audioData: ArrayBuffer,
        metadata: CachedSample['metadata']
    ): Promise<void> {
        // Decode audio data
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));

        const sample: CachedSample = {
            soundId,
            audioBuffer,
            metadata,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now()
        };

        this.memoryCache.set(soundId, sample);
        void this.updateAccessOrder(soundId);
        void this.enforceLRU();
    }

    /**
     * Private: Update access order for LRU
     */
    private updateAccessOrder(soundId: number): void {
        this.accessOrder = this.accessOrder.filter(id => id !== soundId);
        this.accessOrder.push(soundId);
    }

    /**
     * Private: Enforce LRU eviction policy
     */
    private enforceLRU(): void {
        while (this.memoryCache.size > this.maxMemoryCacheSize) {
            const lruId = this.accessOrder.shift();
            if (lruId !== undefined) {
                this.memoryCache.delete(lruId);
                this.evictions++;
                this.logger.debug('cache', 'Evicted sample from memory cache (LRU) - ' + JSON.stringify({ soundId: lruId }));
            }
        }
    }

    /**
     * Private: Get sample from disk
     */
    private getFromDisk(soundId: number): Promise<IndexedDBSample | null> {
        if (!this.db) return Promise.resolve(null);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(soundId);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                this.logger.error('cache', 'Failed to retrieve sample from disk - ' + JSON.stringify({ soundId, error: request.error }));
                reject(new Error('Failed to retrieve sample from disk'));
            };
        });
    }

    /**
     * Private: Add sample to disk
     */
    private addToDisk(
        soundId: number,
        audioBuffer: AudioBuffer,
        metadata: CachedSample['metadata']
    ): Promise<void> {
        if (!this.db) return Promise.resolve();

        // Convert AudioBuffer to ArrayBuffer
        const audioData = this.audioBufferToArrayBuffer(audioBuffer);

        const sample: IndexedDBSample = {
            soundId,
            audioData,
            metadata,
            timestamp: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(sample);

            request.onsuccess = () => {
                this.logger.debug('cache', 'Sample added to disk cache - ' + JSON.stringify({ soundId }));
                resolve();
            };

            request.onerror = () => {
                this.logger.error('cache', 'Failed to add sample to disk - ' + JSON.stringify({ soundId, error: request.error }));
                reject(new Error('Failed to add sample to disk'));
            };
        });
    }

    /**
     * Private: Check if sample exists on disk
     */
    private existsOnDisk(soundId: number): Promise<boolean> {
        if (!this.db) return Promise.resolve(false);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count(soundId);

            request.onsuccess = () => {
                resolve(request.result > 0);
            };

            request.onerror = () => {
                reject(new Error('Failed to check sample existence'));
            };
        });
    }

    /**
     * Private: Remove sample from disk
     */
    private removeFromDisk(soundId: number): Promise<void> {
        if (!this.db) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(soundId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to remove sample from disk'));
        });
    }

    /**
     * Private: Clear disk cache
     */
    private clearDisk(): Promise<void> {
        if (!this.db) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to clear disk cache'));
        });
    }

    /**
     * Private: Get disk cache count
     */
    private getDiskCacheCount(): Promise<number> {
        if (!this.db) return Promise.resolve(0);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to get disk cache count'));
        });
    }

    /**
     * Private: Get disk cache size (approximate)
     */
    private getDiskCacheSize(): Promise<number> {
        if (!this.db) return Promise.resolve(0);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const samples = request.result as IndexedDBSample[];
                const totalSize = samples.reduce((sum, sample) => sum + sample.audioData.byteLength, 0);
                resolve(totalSize);
            };

            request.onerror = () => reject(new Error('Failed to calculate disk cache size'));
        });
    }

    /**
     * Private: Get memory cache size (approximate)
     */
    private getMemoryCacheSize(): number {
        let totalSize = 0;
        for (const sample of this.memoryCache.values()) {
            const buffer = sample.audioBuffer;
            totalSize += buffer.length * buffer.numberOfChannels * 4; // 32-bit float
        }
        return totalSize;
    }

    /**
     * Private: Convert AudioBuffer to ArrayBuffer
     */
    private audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;

        // Create interleaved buffer
        const interleavedLength = numberOfChannels * length;
        const interleavedBuffer = new Float32Array(interleavedLength);

        // Interleave channels
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                interleavedBuffer[i * numberOfChannels + channel] = channelData[i];
            }
        }

        // Store metadata in the first few bytes (hacky but works)
        const metadataView = new DataView(interleavedBuffer.buffer, 0, 8);
        void metadataView.setUint32(0, numberOfChannels, true);
        void metadataView.setUint32(4, sampleRate, true);

        return interleavedBuffer.buffer;
    }

    /**
     * Dispose of cache resources
     */
    dispose(): void {
        this.memoryCache.clear();
        this.accessOrder = [];
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}