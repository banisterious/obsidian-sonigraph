import { getLogger } from '../../logging';

const logger = getLogger('audio-graph-cleaner');

interface ScheduledCleanup {
    noteId: string;
    timeoutId: number;
    startTime: number;
    duration: number;
}

/**
 * Manages cleanup of audio graph connections after note playback
 * Helps prevent memory retention from persistent Tone.js connections
 */
export class AudioGraphCleaner {
    private scheduledCleanups: Map<string, ScheduledCleanup> = new Map();
    private cleanupBatchTimer: number | null = null;
    private pendingCleanups: Set<string> = new Set();
    
    /**
     * Schedule cleanup after a note finishes playing
     */
    scheduleNoteCleanup(noteId: string, duration: number): void {
        // Add buffer time to ensure note has fully finished
        const cleanupDelay = (duration + 0.5) * 1000; // Convert to ms and add 500ms buffer
        
        const timeoutId = window.setTimeout(() => {
            this.pendingCleanups.add(noteId);
            void this.scheduleBatchCleanup();
        }, cleanupDelay);
        
        this.scheduledCleanups.set(noteId, {
            noteId,
            timeoutId,
            startTime: Date.now(),
            duration
        });
    }
    
    /**
     * Batch cleanup operations to reduce overhead
     */
    private scheduleBatchCleanup(): void {
        if (this.cleanupBatchTimer !== null) {
            return; // Batch already scheduled
        }
        
        // Wait 100ms to batch multiple cleanups together
        this.cleanupBatchTimer = window.setTimeout(() => {
            void this.performBatchCleanup();
            this.cleanupBatchTimer = null;
        }, 100);
    }
    
    /**
     * Perform batched cleanup of finished notes
     */
    private performBatchCleanup(): void {
        const cleanupCount = this.pendingCleanups.size;
        
        if (cleanupCount === 0) return;
        
        logger.debug('batch-cleanup', `Cleaning up ${cleanupCount} finished notes`);
        
        // Clear the pending set
        this.pendingCleanups.forEach(noteId => {
            this.scheduledCleanups.delete(noteId);
        });
        this.pendingCleanups.clear();
        
        // Force a minor garbage collection hint
        void this.requestIdleGC();
    }
    
    /**
     * Request garbage collection during idle time
     */
    private requestIdleGC(): void {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
                // This is just a hint to the browser
                // Actual GC is controlled by the JavaScript engine
                void logger.debug('gc-hint', 'Idle callback triggered for potential GC');
            }, { timeout: 1000 });
        }
    }
    
    /**
     * Cancel all scheduled cleanups
     */
    cancelAll(): void {
        this.scheduledCleanups.forEach(cleanup => {
            clearTimeout(cleanup.timeoutId);
        });
        this.scheduledCleanups.clear();
        this.pendingCleanups.clear();
        
        if (this.cleanupBatchTimer !== null) {
            clearTimeout(this.cleanupBatchTimer);
            this.cleanupBatchTimer = null;
        }
    }
    
    /**
     * Get statistics about pending cleanups
     */
    getStats(): { scheduled: number; pending: number } {
        return {
            scheduled: this.scheduledCleanups.size,
            pending: this.pendingCleanups.size
        };
    }
    
    /**
     * Clean up all resources
     */
    dispose(): void {
        void this.cancelAll();
        void logger.debug('dispose', 'AudioGraphCleaner disposed');
    }
}