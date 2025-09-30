/**
 * Download queue manager for Freesound samples
 * Handles parallel downloads with throttling and progress tracking
 */

import { getLogger } from '../../logging';
import { FreesoundAPI, FreesoundSound } from './FreesoundAPI';

export interface DownloadTask {
    soundId: number;
    priority: number; // Higher = more important
    retryCount: number;
    maxRetries: number;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress: number; // 0-100
    error?: string;
}

export interface DownloadResult {
    soundId: number;
    success: boolean;
    audioBuffer?: AudioBuffer;
    metadata?: {
        name: string;
        duration: number;
        tags: string[];
        license: string;
        username: string;
    };
    error?: string;
}

export interface DownloadProgress {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    pending: number;
    percentComplete: number;
}

export class DownloadQueue {
    private queue: Map<number, DownloadTask>;
    private maxConcurrent: number;
    private activeDownloads: Set<number>;
    private api: FreesoundAPI;
    private logger = getLogger('download-queue');
    private audioContext: AudioContext;

    // Callbacks
    private onProgress?: (progress: DownloadProgress) => void;
    private onTaskComplete?: (result: DownloadResult) => void;
    private onQueueComplete?: () => void;

    // Throttling
    private minDelayMs: number = 200; // Minimum delay between requests
    private lastRequestTime: number = 0;

    constructor(api: FreesoundAPI, maxConcurrent: number = 3) {
        this.queue = new Map();
        this.maxConcurrent = maxConcurrent;
        this.activeDownloads = new Set();
        this.api = api;
        this.audioContext = new AudioContext();
    }

    /**
     * Add download task to queue
     */
    addTask(soundId: number, priority: number = 0, maxRetries: number = 3): void {
        if (this.queue.has(soundId)) {
            this.logger.debug('download-queue', 'Download task already in queue - ' + JSON.stringify({ soundId }));
            return;
        }

        const task: DownloadTask = {
            soundId,
            priority,
            retryCount: 0,
            maxRetries,
            status: 'pending',
            progress: 0
        };

        this.queue.set(soundId, task);
        this.logger.debug('download-queue', `Download task added to queue - soundId: ${soundId}, priority: ${priority}`);
        this.processQueue();
    }

    /**
     * Add multiple tasks to queue
     */
    addBulkTasks(soundIds: number[], priority: number = 0): void {
        for (const soundId of soundIds) {
            this.addTask(soundId, priority);
        }
        this.logger.info('download-queue', 'Bulk download tasks added - ' + JSON.stringify({ count: soundIds.length }));
    }

    /**
     * Remove task from queue
     */
    removeTask(soundId: number): void {
        const task = this.queue.get(soundId);
        if (task && task.status === 'pending') {
            this.queue.delete(soundId);
            this.logger.debug('download-queue', 'Download task removed from queue - ' + JSON.stringify({ soundId }));
            this.notifyProgress();
        }
    }

    /**
     * Clear entire queue (except active downloads)
     */
    clearQueue(): void {
        const pendingTasks = Array.from(this.queue.values())
            .filter(task => task.status === 'pending');

        for (const task of pendingTasks) {
            this.queue.delete(task.soundId);
        }

        this.logger.info('download-queue', 'Download queue cleared - ' + JSON.stringify({ clearedCount: pendingTasks.length }));
        this.notifyProgress();
    }

    /**
     * Get queue progress
     */
    getProgress(): DownloadProgress {
        const tasks = Array.from(this.queue.values());
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const failed = tasks.filter(t => t.status === 'failed').length;
        const inProgress = tasks.filter(t => t.status === 'downloading').length;
        const pending = tasks.filter(t => t.status === 'pending').length;

        return {
            total,
            completed,
            failed,
            inProgress,
            pending,
            percentComplete: total > 0 ? (completed / total) * 100 : 0
        };
    }

    /**
     * Check if queue is empty
     */
    isEmpty(): boolean {
        return this.queue.size === 0;
    }

    /**
     * Check if queue is processing
     */
    isProcessing(): boolean {
        return this.activeDownloads.size > 0;
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback: (progress: DownloadProgress) => void): void {
        this.onProgress = callback;
    }

    /**
     * Set task complete callback
     */
    setTaskCompleteCallback(callback: (result: DownloadResult) => void): void {
        this.onTaskComplete = callback;
    }

    /**
     * Set queue complete callback
     */
    setQueueCompleteCallback(callback: () => void): void {
        this.onQueueComplete = callback;
    }

    /**
     * Private: Process queue
     */
    private async processQueue(): Promise<void> {
        // Check if we can start more downloads
        while (this.activeDownloads.size < this.maxConcurrent) {
            const nextTask = this.getNextTask();
            if (!nextTask) break;

            this.activeDownloads.add(nextTask.soundId);
            nextTask.status = 'downloading';
            this.notifyProgress();

            // Start download (don't await - process in parallel)
            this.downloadTask(nextTask).then(() => {
                this.activeDownloads.delete(nextTask.soundId);
                this.processQueue(); // Continue processing
            });
        }

        // Check if queue is complete
        if (this.activeDownloads.size === 0 && this.getPendingTaskCount() === 0) {
            this.notifyQueueComplete();
        }
    }

    /**
     * Private: Get next task by priority
     */
    private getNextTask(): DownloadTask | null {
        const pendingTasks = Array.from(this.queue.values())
            .filter(task => task.status === 'pending')
            .sort((a, b) => b.priority - a.priority);

        return pendingTasks[0] || null;
    }

    /**
     * Private: Download task
     */
    private async downloadTask(task: DownloadTask): Promise<void> {
        try {
            // Throttle requests
            await this.throttleRequest();

            // Get sound details
            const sound = await this.api.getSound(task.soundId);
            if (!sound) {
                throw new Error('Sound not found');
            }

            // Download audio
            const previewUrl = sound.previews.previewHqMp3;
            if (!previewUrl) {
                throw new Error('Preview URL not available');
            }

            const audioBuffer = await this.downloadAudio(previewUrl, (progress) => {
                task.progress = progress;
                this.notifyProgress();
            });

            // Task complete
            task.status = 'completed';
            task.progress = 100;

            const result: DownloadResult = {
                soundId: task.soundId,
                success: true,
                audioBuffer,
                metadata: {
                    name: sound.name,
                    duration: sound.duration,
                    tags: sound.tags,
                    license: sound.license,
                    username: sound.username
                }
            };

            this.logger.info('download-queue', 'Sample downloaded successfully - ' + JSON.stringify({ soundId: task.soundId, name: sound.name }));
            this.notifyTaskComplete(result);

        } catch (error) {
            task.retryCount++;

            if (task.retryCount < task.maxRetries) {
                // Retry
                task.status = 'pending';
                task.progress = 0;
                this.logger.warn('download-queue', `Download failed, retrying - soundId: ${task.soundId}, attempt: ${task.retryCount}, error: ${error.message}`);
            } else {
                // Failed permanently
                task.status = 'failed';
                task.error = error.message;

                const result: DownloadResult = {
                    soundId: task.soundId,
                    success: false,
                    error: error.message
                };

                this.logger.error('download-queue', `Download failed permanently - soundId: ${task.soundId}, error: ${error.message}`);
                this.notifyTaskComplete(result);
            }
        }

        this.notifyProgress();
    }

    /**
     * Private: Download audio from URL
     */
    private async downloadAudio(
        url: string,
        onProgress?: (progress: number) => void
    ): Promise<AudioBuffer> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';

            xhr.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            };

            xhr.onload = async () => {
                if (xhr.status === 200) {
                    try {
                        const audioBuffer = await this.audioContext.decodeAudioData(xhr.response);
                        resolve(audioBuffer);
                    } catch (error) {
                        reject(new Error('Failed to decode audio data'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error('Network error during download'));
            };

            xhr.send();
        });
    }

    /**
     * Private: Throttle requests
     */
    private async throttleRequest(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minDelayMs) {
            const delayNeeded = this.minDelayMs - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delayNeeded));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Private: Get pending task count
     */
    private getPendingTaskCount(): number {
        return Array.from(this.queue.values())
            .filter(task => task.status === 'pending').length;
    }

    /**
     * Private: Notify progress
     */
    private notifyProgress(): void {
        if (this.onProgress) {
            this.onProgress(this.getProgress());
        }
    }

    /**
     * Private: Notify task complete
     */
    private notifyTaskComplete(result: DownloadResult): void {
        if (this.onTaskComplete) {
            this.onTaskComplete(result);
        }
    }

    /**
     * Private: Notify queue complete
     */
    private notifyQueueComplete(): void {
        if (this.onQueueComplete) {
            this.logger.info('download-queue', 'Download queue completed');
            this.onQueueComplete();
        }
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.clearQueue();
        this.activeDownloads.clear();
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}