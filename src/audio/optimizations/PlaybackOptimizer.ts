import { MusicalMapping } from '../../graph/types';
import { PlaybackProgressData } from '../playback-events';
import { getLogger } from '../../logging';

const logger = getLogger('playback-optimizer');

/**
 * Optimized data structure for efficient note lookup during playback
 * Reduces memory allocations by pre-processing sequence into time buckets
 */
export class PlaybackOptimizer {
    private timeBuckets: Map<number, MusicalMapping[]> = new Map();
    private bucketSize: number = 0.1; // 100ms buckets
    private sortedBucketKeys: number[] = [];
    private currentBucketIndex: number = 0;
    private totalNotes: number = 0;
    private maxEndTime: number = 0;
    
    // Use WeakSet to track triggered notes without modifying them
    private triggeredNotes: WeakSet<MusicalMapping> = new WeakSet();
    
    // Pre-allocated arrays to avoid garbage collection
    private readonly notesToPlayBuffer: MusicalMapping[] = [];
    private readonly progressData = {
        currentIndex: 0,
        totalNotes: 0,
        elapsedTime: 0,
        estimatedTotalTime: 0,
        percentComplete: 0
    };
    
    constructor(bucketSize: number = 0.1) {
        this.bucketSize = bucketSize;
    }
    
    /**
     * Pre-process sequence into time-indexed buckets for O(1) lookup
     */
    preprocessSequence(sequence: MusicalMapping[]): void {
        // Clear previous data
        this.timeBuckets.clear();
        this.sortedBucketKeys = [];
        this.currentBucketIndex = 0;
        this.totalNotes = sequence.length;
        this.maxEndTime = 0;
        
        // Process each note into appropriate time bucket
        for (const note of sequence) {
            const bucketKey = Math.floor(note.timing / this.bucketSize) * this.bucketSize;
            
            if (!this.timeBuckets.has(bucketKey)) {
                this.timeBuckets.set(bucketKey, []);
            }
            
            this.timeBuckets.get(bucketKey)!.push(note);
            
            // Track max end time
            const noteEndTime = note.timing + note.duration;
            if (noteEndTime > this.maxEndTime) {
                this.maxEndTime = noteEndTime;
            }
        }
        
        // Sort bucket keys for efficient traversal
        this.sortedBucketKeys = Array.from(this.timeBuckets.keys()).sort((a, b) => a - b);
        
        logger.debug('preprocessed-sequence', 'Sequence preprocessed into time buckets', {
            totalNotes: this.totalNotes,
            bucketCount: this.sortedBucketKeys.length,
            bucketSize: this.bucketSize,
            maxEndTime: this.maxEndTime.toFixed(2)
        });
    }
    
    /**
     * Get notes that should be played within the given time window
     * Uses pre-processed buckets for efficient lookup without array filtering
     */
    getNotesToPlay(elapsedTime: number, lookAheadTime: number = 0.6, lookBehindTime: number = 0.4): MusicalMapping[] {
        // Clear the buffer instead of creating new array
        this.notesToPlayBuffer.length = 0;
        
        const minTime = elapsedTime - lookBehindTime;
        const maxTime = elapsedTime + lookAheadTime;
        
        // Find relevant buckets
        const minBucket = Math.floor(minTime / this.bucketSize) * this.bucketSize;
        const maxBucket = Math.floor(maxTime / this.bucketSize) * this.bucketSize;
        
        // Iterate only through relevant buckets
        for (let bucket = minBucket; bucket <= maxBucket; bucket += this.bucketSize) {
            const notes = this.timeBuckets.get(bucket);
            if (!notes) continue;
            
            // Check each note in the bucket
            for (const note of notes) {
                if (note.timing <= maxTime && 
                    note.timing > minTime && 
                    !this.triggeredNotes.has(note)) {
                    this.notesToPlayBuffer.push(note);
                }
            }
        }
        
        return this.notesToPlayBuffer;
    }
    
    /**
     * Get current playback progress without filtering entire sequence
     * Uses bucket index to efficiently calculate progress
     */
    getProgress(elapsedTime: number): PlaybackProgressData {
        // Count triggered notes using bucket traversal
        let triggeredCount = 0;
        
        // Only count buckets up to current time
        const currentBucket = Math.floor(elapsedTime / this.bucketSize) * this.bucketSize;
        
        for (const bucketKey of this.sortedBucketKeys) {
            if (bucketKey > currentBucket) break;
            
            const notes = this.timeBuckets.get(bucketKey)!;
            for (const note of notes) {
                if (note.timing <= elapsedTime && this.triggeredNotes.has(note)) {
                    triggeredCount++;
                }
            }
        }
        
        // Update reusable progress object instead of creating new one
        this.progressData.currentIndex = triggeredCount;
        this.progressData.totalNotes = this.totalNotes;
        this.progressData.elapsedTime = elapsedTime;
        this.progressData.estimatedTotalTime = this.maxEndTime;
        this.progressData.percentComplete = Math.min((elapsedTime / this.maxEndTime) * 100, 100);
        
        return this.progressData;
    }
    
    /**
     * Mark a note as triggered without modifying the original object
     */
    markNoteTriggered(note: MusicalMapping): void {
        this.triggeredNotes.add(note);
    }
    
    /**
     * Reset all notes to untriggered state
     */
    reset(): void {
        // Clear triggered notes tracking
        this.triggeredNotes = new WeakSet();
        this.currentBucketIndex = 0;
    }
    
    /**
     * Clear all data to free memory
     */
    dispose(): void {
        // Clear all references to allow garbage collection
        this.timeBuckets.clear();
        this.sortedBucketKeys = [];
        this.notesToPlayBuffer.length = 0;
        this.triggeredNotes = new WeakSet();
        this.currentBucketIndex = 0;
        this.totalNotes = 0;
        this.maxEndTime = 0;
    }
    
    /**
     * Get statistics about the optimizer
     */
    getStats(): { bucketCount: number; totalNotes: number; avgNotesPerBucket: number } {
        const bucketCount = this.timeBuckets.size;
        return {
            bucketCount,
            totalNotes: this.totalNotes,
            avgNotesPerBucket: bucketCount > 0 ? this.totalNotes / bucketCount : 0
        };
    }
}