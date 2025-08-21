/**
 * MetadataListener - Phase 2.1: Real-Time Metadata Listening
 * 
 * Provides real-time metadata change detection using Obsidian's event system
 * without polling. Updates mapping engine when files are modified.
 */

import { App, TFile, EventRef } from 'obsidian';
import { ObsidianMetadataMapper } from './ObsidianMetadataMapper';
import { MetadataMappingRules } from './MetadataMappingRules';
import { VaultMappingOptimizer } from './VaultMappingOptimizer';
import { AudioMappingConfig } from '../../graph/types';
import { getLogger } from '../../logging';

const logger = getLogger('metadata-listener');

/**
 * Metadata change event data
 */
export interface MetadataChangeEvent {
    file: TFile;
    type: 'metadata' | 'rename' | 'create' | 'delete';
    timestamp: number;
    oldPath?: string;
    changes: {
        frontmatter?: boolean;
        tags?: boolean;
        links?: boolean;
        headings?: boolean;
    };
}

/**
 * Change handler callback
 */
export type MetadataChangeHandler = (event: MetadataChangeEvent) => void | Promise<void>;

/**
 * Listener configuration
 */
export interface ListenerConfig {
    enableMetadataChanges: boolean;
    enableFileRenames: boolean;
    enableFileCreation: boolean;
    enableFileDeletion: boolean;
    debounceDelay: number;          // Milliseconds to debounce rapid changes
    batchUpdateThreshold: number;    // Number of changes to trigger batch update
    maxBatchDelay: number;          // Maximum time to wait for batch (ms)
}

/**
 * Change statistics for monitoring
 */
export interface ChangeStats {
    totalChanges: number;
    metadataChanges: number;
    fileRenames: number;
    fileCreations: number;
    fileDeletions: number;
    batchUpdates: number;
    lastChangeTime: number;
    avgProcessingTime: number;
}

export class MetadataListener {
    private app: App;
    private metadataMapper: ObsidianMetadataMapper;
    private mappingRules: MetadataMappingRules;
    private vaultOptimizer: VaultMappingOptimizer;
    private config: ListenerConfig;
    
    private eventRefs: EventRef[] = [];
    private changeHandlers: MetadataChangeHandler[] = [];
    private pendingChanges: Map<string, MetadataChangeEvent> = new Map();
    private debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private batchTimeout: NodeJS.Timeout | null = null;
    private stats: ChangeStats;
    private isActive = false;

    constructor(
        app: App, 
        metadataMapper: ObsidianMetadataMapper,
        mappingRules: MetadataMappingRules,
        vaultOptimizer: VaultMappingOptimizer,
        config?: Partial<ListenerConfig>
    ) {
        this.app = app;
        this.metadataMapper = metadataMapper;
        this.mappingRules = mappingRules;
        this.vaultOptimizer = vaultOptimizer;
        
        this.config = {
            enableMetadataChanges: true,
            enableFileRenames: true,
            enableFileCreation: true,
            enableFileDeletion: true,
            debounceDelay: 500,      // 500ms debounce
            batchUpdateThreshold: 5,  // 5 changes trigger batch
            maxBatchDelay: 2000,     // 2 second max batch delay
            ...config
        };

        this.stats = {
            totalChanges: 0,
            metadataChanges: 0,
            fileRenames: 0,
            fileCreations: 0,
            fileDeletions: 0,
            batchUpdates: 0,
            lastChangeTime: 0,
            avgProcessingTime: 0
        };

        logger.info('metadata-listener-init', 'MetadataListener initialized', {
            debounceDelay: this.config.debounceDelay,
            batchThreshold: this.config.batchUpdateThreshold
        });
    }

    /**
     * Start listening for metadata changes
     */
    startListening(): void {
        if (this.isActive) {
            logger.warn('listener-already-active', 'MetadataListener is already active');
            return;
        }

        this.registerEventHandlers();
        this.isActive = true;
        
        logger.info('listener-started', 'MetadataListener started listening for changes');
    }

    /**
     * Stop listening for metadata changes
     */
    stopListening(): void {
        if (!this.isActive) {
            logger.warn('listener-not-active', 'MetadataListener is not active');
            return;
        }

        this.unregisterEventHandlers();
        this.clearPendingChanges();
        this.isActive = false;
        
        logger.info('listener-stopped', 'MetadataListener stopped listening');
    }

    /**
     * Register Obsidian event handlers
     */
    private registerEventHandlers(): void {
        // Listen for metadata changes
        if (this.config.enableMetadataChanges) {
            const metadataRef = this.app.metadataCache.on('changed', (file: TFile) => {
                this.handleMetadataChange(file);
            });
            this.eventRefs.push(metadataRef);
        }

        // Listen for file renames
        if (this.config.enableFileRenames) {
            const renameRef = this.app.vault.on('rename', (file: TFile, oldPath: string) => {
                this.handleFileRename(file, oldPath);
            });
            this.eventRefs.push(renameRef);
        }

        // Listen for file creation
        if (this.config.enableFileCreation) {
            const createRef = this.app.vault.on('create', (file: TFile) => {
                this.handleFileCreate(file);
            });
            this.eventRefs.push(createRef);
        }

        // Listen for file deletion
        if (this.config.enableFileDeletion) {
            const deleteRef = this.app.vault.on('delete', (file: TFile) => {
                this.handleFileDelete(file);
            });
            this.eventRefs.push(deleteRef);
        }

        logger.debug('event-handlers-registered', `Registered ${this.eventRefs.length} event handlers`);
    }

    /**
     * Unregister all event handlers
     */
    private unregisterEventHandlers(): void {
        for (const ref of this.eventRefs) {
            this.app.metadataCache.offref(ref);
        }
        this.eventRefs = [];
        
        logger.debug('event-handlers-unregistered', 'All event handlers unregistered');
    }

    /**
     * Handle metadata change event
     */
    private handleMetadataChange(file: TFile): void {
        const startTime = performance.now();
        
        logger.debug('metadata-change', `Metadata changed for: ${file.path}`);

        // Get current and previous metadata to detect specific changes
        const currentCache = this.app.metadataCache.getFileCache(file);
        const changes = this.detectSpecificChanges(file, currentCache);

        const changeEvent: MetadataChangeEvent = {
            file,
            type: 'metadata',
            timestamp: Date.now(),
            changes
        };

        this.queueChange(file.path, changeEvent);
        this.updateStats('metadata', performance.now() - startTime);
    }

    /**
     * Handle file rename event
     */
    private handleFileRename(file: TFile, oldPath: string): void {
        const startTime = performance.now();
        
        logger.debug('file-rename', `File renamed: ${oldPath} -> ${file.path}`);

        const changeEvent: MetadataChangeEvent = {
            file,
            type: 'rename',
            timestamp: Date.now(),
            oldPath,
            changes: {}
        };

        this.queueChange(file.path, changeEvent);
        this.updateStats('rename', performance.now() - startTime);
    }

    /**
     * Handle file creation event
     */
    private handleFileCreate(file: TFile): void {
        const startTime = performance.now();
        
        logger.debug('file-create', `File created: ${file.path}`);

        const changeEvent: MetadataChangeEvent = {
            file,
            type: 'create',
            timestamp: Date.now(),
            changes: {}
        };

        this.queueChange(file.path, changeEvent);
        this.updateStats('create', performance.now() - startTime);
    }

    /**
     * Handle file deletion event
     */
    private handleFileDelete(file: TFile): void {
        const startTime = performance.now();
        
        logger.debug('file-delete', `File deleted: ${file.path}`);

        const changeEvent: MetadataChangeEvent = {
            file,
            type: 'delete',
            timestamp: Date.now(),
            changes: {}
        };

        this.queueChange(file.path, changeEvent);
        this.updateStats('delete', performance.now() - startTime);
    }

    /**
     * Detect specific changes in metadata
     */
    private detectSpecificChanges(file: TFile, currentCache: any): MetadataChangeEvent['changes'] {
        // This would require storing previous state to compare
        // For now, assume all types of changes are possible
        return {
            frontmatter: true,
            tags: true,
            links: true,
            headings: true
        };
    }

    /**
     * Queue a change with debouncing
     */
    private queueChange(filePath: string, changeEvent: MetadataChangeEvent): void {
        // Clear existing debounce timeout for this file
        const existingTimeout = this.debounceTimeouts.get(filePath);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Store the latest change
        this.pendingChanges.set(filePath, changeEvent);

        // Set new debounce timeout
        const timeout = setTimeout(() => {
            this.processChange(filePath);
            this.debounceTimeouts.delete(filePath);
        }, this.config.debounceDelay);

        this.debounceTimeouts.set(filePath, timeout);

        // Check if we should trigger batch processing
        if (this.pendingChanges.size >= this.config.batchUpdateThreshold) {
            this.triggerBatchUpdate();
        } else if (!this.batchTimeout) {
            // Set maximum batch delay timeout
            this.batchTimeout = setTimeout(() => {
                this.triggerBatchUpdate();
            }, this.config.maxBatchDelay);
        }

        logger.debug('change-queued', `Change queued for ${filePath}`, {
            pendingChanges: this.pendingChanges.size,
            debounceDelay: this.config.debounceDelay
        });
    }

    /**
     * Process a single change after debouncing
     */
    private async processChange(filePath: string): Promise<void> {
        const changeEvent = this.pendingChanges.get(filePath);
        if (!changeEvent) return;

        this.pendingChanges.delete(filePath);

        const startTime = performance.now();

        try {
            // Update metadata mapper cache for this file
            if (changeEvent.type === 'metadata' || changeEvent.type === 'create') {
                // Invalidate cache and re-analyze
                this.metadataMapper.clearCaches(); // Would need selective clearing
                
                // Re-analyze the file
                if (changeEvent.file.extension === 'md') {
                    const analysis = this.metadataMapper.analyzeFile(changeEvent.file);
                    logger.debug('file-reanalyzed', `Re-analyzed ${filePath}`, {
                        instrument: analysis.finalInstrument,
                        confidence: analysis.confidence.toFixed(2)
                    });
                }
            } else if (changeEvent.type === 'delete') {
                // Clear caches for deleted file
                this.metadataMapper.clearCaches();
                this.vaultOptimizer.clearCache();
            } else if (changeEvent.type === 'rename') {
                // Update path references and clear caches
                this.metadataMapper.clearCaches();
                this.vaultOptimizer.clearCache();
            }

            // Notify change handlers
            await this.notifyHandlers(changeEvent);

            const processingTime = performance.now() - startTime;
            logger.debug('change-processed', `Processed change for ${filePath}`, {
                type: changeEvent.type,
                processingTime: processingTime.toFixed(1) + 'ms'
            });

        } catch (error) {
            logger.error('change-processing-error', `Failed to process change for ${filePath}`, error as Error);
        }
    }

    /**
     * Trigger batch update of multiple changes
     */
    private async triggerBatchUpdate(): Promise<void> {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        const changes = Array.from(this.pendingChanges.values());
        if (changes.length === 0) return;

        const startTime = performance.now();
        
        logger.info('batch-update', `Processing batch update for ${changes.length} changes`);

        try {
            // Clear all debounce timeouts
            for (const timeout of this.debounceTimeouts.values()) {
                clearTimeout(timeout);
            }
            this.debounceTimeouts.clear();

            // Process all changes
            const promises = Array.from(this.pendingChanges.keys()).map(filePath => 
                this.processChange(filePath)
            );
            await Promise.all(promises);

            // Trigger vault-wide re-analysis if many changes
            if (changes.length > 10) {
                logger.info('vault-reanalysis', 'Triggering vault-wide re-analysis due to many changes');
                this.vaultOptimizer.clearCache();
            }

            this.stats.batchUpdates++;
            const batchTime = performance.now() - startTime;
            
            logger.info('batch-complete', `Batch update completed in ${batchTime.toFixed(1)}ms`, {
                changesProcessed: changes.length,
                avgTimePerChange: (batchTime / changes.length).toFixed(1) + 'ms'
            });

        } catch (error) {
            logger.error('batch-update-error', 'Batch update failed', error as Error);
        }

        this.pendingChanges.clear();
    }

    /**
     * Notify registered change handlers
     */
    private async notifyHandlers(changeEvent: MetadataChangeEvent): Promise<void> {
        if (this.changeHandlers.length === 0) return;

        const promises = this.changeHandlers.map(async handler => {
            try {
                await handler(changeEvent);
            } catch (error) {
                logger.error('handler-error', 'Change handler failed', error as Error);
            }
        });

        await Promise.all(promises);
    }

    /**
     * Update statistics
     */
    private updateStats(type: string, processingTime: number): void {
        this.stats.totalChanges++;
        this.stats.lastChangeTime = Date.now();
        
        switch (type) {
            case 'metadata':
                this.stats.metadataChanges++;
                break;
            case 'rename':
                this.stats.fileRenames++;
                break;
            case 'create':
                this.stats.fileCreations++;
                break;
            case 'delete':
                this.stats.fileDeletions++;
                break;
        }

        // Update average processing time
        const totalTime = this.stats.avgProcessingTime * (this.stats.totalChanges - 1) + processingTime;
        this.stats.avgProcessingTime = totalTime / this.stats.totalChanges;
    }

    /**
     * Clear all pending changes
     */
    private clearPendingChanges(): void {
        // Clear debounce timeouts
        for (const timeout of this.debounceTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.debounceTimeouts.clear();

        // Clear batch timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        this.pendingChanges.clear();
        
        logger.debug('pending-changes-cleared', 'All pending changes cleared');
    }

    /**
     * Register a change handler
     */
    addChangeHandler(handler: MetadataChangeHandler): void {
        this.changeHandlers.push(handler);
        logger.debug('handler-added', `Added change handler, total: ${this.changeHandlers.length}`);
    }

    /**
     * Unregister a change handler
     */
    removeChangeHandler(handler: MetadataChangeHandler): void {
        const index = this.changeHandlers.indexOf(handler);
        if (index !== -1) {
            this.changeHandlers.splice(index, 1);
            logger.debug('handler-removed', `Removed change handler, total: ${this.changeHandlers.length}`);
        }
    }

    /**
     * Update listener configuration
     */
    updateConfig(config: Partial<ListenerConfig>): void {
        const wasActive = this.isActive;
        
        if (wasActive) {
            this.stopListening();
        }

        this.config = { ...this.config, ...config };

        if (wasActive) {
            this.startListening();
        }

        logger.info('config-updated', 'MetadataListener configuration updated', {
            debounceDelay: this.config.debounceDelay,
            batchThreshold: this.config.batchUpdateThreshold
        });
    }

    /**
     * Get listener configuration
     */
    getConfig(): ListenerConfig {
        return { ...this.config };
    }

    /**
     * Get change statistics
     */
    getStats(): ChangeStats {
        return { ...this.stats };
    }

    /**
     * Get current listener status
     */
    getStatus(): {
        isActive: boolean;
        pendingChanges: number;
        activeTimeouts: number;
        totalHandlers: number;
        lastActivity: string;
    } {
        return {
            isActive: this.isActive,
            pendingChanges: this.pendingChanges.size,
            activeTimeouts: this.debounceTimeouts.size,
            totalHandlers: this.changeHandlers.length,
            lastActivity: this.stats.lastChangeTime > 0 
                ? new Date(this.stats.lastChangeTime).toISOString() 
                : 'never'
        };
    }

    /**
     * Force process all pending changes immediately
     */
    async flush(): Promise<void> {
        if (this.pendingChanges.size === 0) {
            logger.debug('flush-empty', 'No pending changes to flush');
            return;
        }

        logger.info('flush-started', `Flushing ${this.pendingChanges.size} pending changes`);
        await this.triggerBatchUpdate();
        logger.info('flush-complete', 'All pending changes flushed');
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = {
            totalChanges: 0,
            metadataChanges: 0,
            fileRenames: 0,
            fileCreations: 0,
            fileDeletions: 0,
            batchUpdates: 0,
            lastChangeTime: 0,
            avgProcessingTime: 0
        };

        logger.info('stats-reset', 'MetadataListener statistics reset');
    }
}