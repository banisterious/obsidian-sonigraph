/**
 * ConnectionTypeMapper - Phase 4.4: Connection Type Audio Differentiation
 *
 * Core mapping logic that analyzes different types of connections between files
 * and maps them to distinct audio characteristics. Handles wikilinks, embeds,
 * markdown links, tag connections, and more with configurable instrument assignments.
 */

import { TFile, CachedMetadata, App, LinkCache, EmbedCache } from 'obsidian';
import {
    ConnectionType,
    ConnectionTypeMappingConfig,
    ConnectionTypeMapping,
    ConnectionTypeMappingResult,
    ConnectionTypeMappingMetrics,
    InstrumentFamily,
    ConnectionAudioCharacteristics,
    DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG
} from './ConnectionTypeMappingConfig';
import { InstrumentConfig, getAllInstruments, getInstrumentsByCategory } from '../configs';
import { EnhancedGraphNode } from '../../graph/types';
import { getLogger } from '../../logging';

const logger = getLogger('connection-type-mapper');

/**
 * Simple interface for graph links/connections
 */
export interface GraphLink {
    source: string;
    target: string;
    type?: string;
}

/**
 * Connection analysis result for internal processing
 */
interface ConnectionAnalysis {
    type: ConnectionType;
    strength: number;
    isRecent: boolean;
    isSameFolder: boolean;
    frequency: number;
    isBidirectional: boolean;
    isResolved: boolean;
}

/**
 * Cached analysis result to improve performance
 */
interface CachedConnectionResult {
    result: ConnectionTypeMappingResult;
    timestamp: number;
    expiryTime: number;
}

/**
 * Link strength calculation context
 */
interface LinkStrengthContext {
    sourceFile: TFile;
    targetFile: TFile | null;
    linkText: string;
    linkPath: string;
    metadata: CachedMetadata | null;
    creationTime: number;
}

export class ConnectionTypeMapper {
    private app: App;
    private config: ConnectionTypeMappingConfig;
    private instrumentConfigs: Map<string, InstrumentConfig>;
    private analysisCache: Map<string, CachedConnectionResult>;
    private linkFrequencyCache: Map<string, number>;
    private metrics: ConnectionTypeMappingMetrics;
    private lastCacheCleanup: number;

    constructor(app: App, config?: Partial<ConnectionTypeMappingConfig>) {
        this.app = app;
        this.config = { ...DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG, ...config };
        this.instrumentConfigs = new Map();
        this.analysisCache = new Map();
        this.linkFrequencyCache = new Map();
        this.lastCacheCleanup = Date.now();

        this.metrics = {
            totalConnections: 0,
            mappedConnections: 0,
            cachedResults: 0,
            averageAnalysisTime: 0,
            connectionTypeDistribution: {} as Record<ConnectionType, number>,
            instrumentFamilyDistribution: {} as Record<InstrumentFamily, number>,
            linkStrengthDistribution: { weak: 0, moderate: 0, strong: 0 }
        };

        void this.initializeInstrumentConfigs();
        logger.info('connection-type-mapper', 'ConnectionTypeMapper initialized', {
            enabled: this.config.enabled,
            independentFromContentAware: this.config.independentFromContentAware,
            enabledConnectionTypes: Object.entries(this.config.mappings)
                .filter(([, mapping]) => mapping.enabled)
                .map(([type]) => type)
        });
    }

    /**
     * Initialize instrument configurations from available instruments
     */
    private initializeInstrumentConfigs(): void {
        try {
            const allInstruments = getAllInstruments();
            Object.entries(allInstruments).forEach(([name, instrument]) => {
                this.instrumentConfigs.set(name, instrument);
            });

            // Populate instrument names for each connection type mapping
            Object.entries(this.config.mappings).forEach(([type, mapping]) => {
                if (mapping.instrumentNames.length === 0) {
                    const familyInstruments = getInstrumentsByCategory(mapping.instrumentFamily);
                    mapping.instrumentNames = Object.keys(familyInstruments);
                }
            });

            logger.debug('connection-type-mapper', 'Instrument configurations initialized', {
                totalInstruments: this.instrumentConfigs.size,
                familyMappings: Object.entries(this.config.mappings).map(([type, mapping]) => ({
                    type,
                    family: mapping.instrumentFamily,
                    instruments: mapping.instrumentNames.length
                }))
            });
        } catch (error) {
            logger.error('connection-type-mapper', 'Failed to initialize instrument configurations', {
                error: (error as Error).message
            });
        }
    }

    /**
     * Map a connection between two files to audio characteristics
     */
    public async mapConnection(
        sourceNode: EnhancedGraphNode,
        targetNode: EnhancedGraphNode | null,
        link: GraphLink
    ): Promise<ConnectionTypeMappingResult | null> {
        if (!this.config.enabled) {
            return null;
        }

        const startTime = performance.now();

        try {
            // Check cache first
            const cacheKey = this.getCacheKey(sourceNode.id, link);
            if (this.config.globalSettings.enableCaching) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    this.metrics.cachedResults++;
                    return cached;
                }
            }

            // Analyze the connection
            const analysis = await this.analyzeConnection(sourceNode, targetNode, link);
            if (!analysis) {
                return null;
            }

            // Get mapping configuration for this connection type
            const mapping = this.config.mappings[analysis.type];
            if (!mapping || !mapping.enabled) {
                logger.debug('connection-type-mapper', 'Connection type mapping disabled', {
                    type: analysis.type,
                    source: sourceNode.id
                });
                return null;
            }

            // Select appropriate instrument
            const selectedInstrument = this.selectInstrument(mapping, analysis);
            if (!selectedInstrument) {
                logger.warn('connection-type-mapper', 'Failed to select instrument for connection', {
                    type: analysis.type,
                    family: mapping.instrumentFamily
                });
                return null;
            }

            // Calculate contextual modifiers
            const contextualModifiers = this.calculateContextualModifiers(mapping, analysis);

            // Apply link strength modulation to audio characteristics
            const audioCharacteristics = this.applyLinkStrengthModulation(
                mapping.audioCharacteristics,
                analysis,
                contextualModifiers
            );

            // Create result
            const result: ConnectionTypeMappingResult = {
                connectionType: analysis.type,
                sourceFile: sourceNode.id,
                targetFile: targetNode?.id || link.target,
                linkStrength: analysis.strength,
                instrumentFamily: mapping.instrumentFamily,
                selectedInstrument,
                audioCharacteristics,
                confidence: this.calculateConfidence(mapping, analysis),
                reasoning: this.generateReasoning(mapping, analysis),
                contextualModifiers: {
                    sameFolderBoost: contextualModifiers.sameFolderBoost,
                    recencyBoost: contextualModifiers.recencyBoost,
                    strengthBoost: contextualModifiers.strengthBoost
                },
                analysisTime: performance.now() - startTime
            };

            // Cache the result
            if (this.config.globalSettings.enableCaching) {
                void this.cacheResult(cacheKey, result);
            }

            // Update metrics
            void this.updateMetrics(result);

            logger.debug('connection-type-mapper', 'Connection mapped successfully', {
                type: analysis.type,
                instrument: selectedInstrument,
                strength: analysis.strength,
                confidence: result.confidence
            });

            return result;

        } catch (error) {
            logger.error('connection-type-mapper', 'Failed to map connection', {
                source: sourceNode.id,
                target: link.target,
                error: (error as Error).message
            });
            return null;
        }
    }

    /**
     * Analyze a connection to determine its type and characteristics
     */
    private async analyzeConnection(
        sourceNode: EnhancedGraphNode,
        targetNode: EnhancedGraphNode | null,
        link: GraphLink
    ): Promise<ConnectionAnalysis | null> {
        try {
            const sourceFile = this.app.vault.getAbstractFileByPath(sourceNode.id);
            if (!sourceFile || !(sourceFile instanceof TFile)) {
                return null;
            }

            const targetFile = targetNode ?
                this.app.vault.getAbstractFileByPath(targetNode.id) : null;
            if (targetFile && !(targetFile instanceof TFile)) {
                return null;
            }

            const metadata = this.app.metadataCache.getFileCache(sourceFile);
            if (!metadata) {
                return null;
            }

            // Determine connection type
            const connectionType = this.determineConnectionType(link, metadata, sourceFile, targetFile);

            // Calculate link strength
            const strength = await this.calculateLinkStrength({
                sourceFile,
                targetFile,
                linkText: link.source || '',
                linkPath: link.target,
                metadata,
                creationTime: sourceFile.stat.ctime
            });

            // Check if link is recent
            const isRecent = this.isRecentConnection(sourceFile.stat.ctime);

            // Check if same folder
            const isSameFolder = this.isSameFolder(sourceFile, targetFile);

            // Get frequency from cache
            const frequency = this.getLinkFrequency(link.target);

            // Check if bidirectional
            const isBidirectional = this.isBidirectionalLink(sourceFile, targetFile);

            // Check if resolved
            const isResolved = targetFile !== null;

            return {
                type: connectionType,
                strength,
                isRecent,
                isSameFolder,
                frequency,
                isBidirectional,
                isResolved
            };

        } catch (error) {
            logger.error('connection-type-mapper', 'Failed to analyze connection', {
                source: sourceNode.id,
                error: (error as Error).message
            });
            return null;
        }
    }

    /**
     * Determine the type of connection based on link characteristics
     */
    private determineConnectionType(
        link: GraphLink,
        metadata: CachedMetadata,
        sourceFile: TFile,
        targetFile: TFile | null
    ): ConnectionType {
        // Check for unresolved links first
        if (!targetFile) {
            // Check if it's an external URL
            if (link.target.startsWith('http://') || link.target.startsWith('https://')) {
                return 'external';
            }
            return 'unresolved';
        }

        // Check embeds
        if (metadata.embeds) {
            const embedMatch = metadata.embeds.find(embed =>
                embed.link === link.target ||
                this.normalizeLink(embed.link) === this.normalizeLink(link.target)
            );
            if (embedMatch) {
                return 'embed';
            }
        }

        // Check wikilinks
        if (metadata.links) {
            const wikilinkMatch = metadata.links.find(wikilink =>
                wikilink.link === link.target ||
                this.normalizeLink(wikilink.link) === this.normalizeLink(link.target)
            );
            if (wikilinkMatch) {
                // Check if it's an alias
                if (wikilinkMatch.displayText && wikilinkMatch.displayText !== wikilinkMatch.link) {
                    return 'alias';
                }
                return 'wikilink';
            }
        }

        // Check for tag-based connections
        if (this.isTagBasedConnection(sourceFile, targetFile)) {
            return 'tag';
        }

        // Check for backlinks
        if (this.isBacklinkConnection(sourceFile, targetFile)) {
            return 'backlink';
        }

        // Check for markdown links (external format but internal target)
        if (link.target.includes('://') || link.target.startsWith('http')) {
            return 'external';
        }

        // Default to markdown link
        return 'markdown';
    }

    /**
     * Calculate link strength based on various metrics
     */
    private async calculateLinkStrength(context: LinkStrengthContext): Promise<number> {
        let strength = 0.5; // Base strength

        const metrics = this.config.globalSettings.linkStrengthMetrics;

        // Frequency-based strength
        if (metrics.useFrequency) {
            const frequency = this.getLinkFrequency(context.linkPath);
            strength += Math.min(frequency * 0.1, 0.3); // Cap at +0.3
        }

        // Recency-based strength
        if (metrics.useRecency) {
            const daysSinceCreation = (Date.now() - context.creationTime) / (1000 * 60 * 60 * 24);
            const recencyBoost = Math.max(0, (30 - daysSinceCreation) / 30) * 0.2; // Recent links get boost
            strength += recencyBoost;
        }

        // Bidirectionality boost
        if (metrics.useBidirectionality && context.targetFile) {
            const isBidirectional = this.isBidirectionalLink(context.sourceFile, context.targetFile);
            if (isBidirectional) {
                strength += 0.15;
            }
        }

        // Content similarity (CPU intensive, optional)
        if (metrics.useContentSimilarity && context.targetFile) {
            const similarity = await this.calculateContentSimilarity(context.sourceFile, context.targetFile);
            strength += similarity * 0.2;
        }

        return Math.min(Math.max(strength, 0.0), 1.0); // Clamp to 0.0-1.0
    }

    /**
     * Select appropriate instrument from the family for this connection
     */
    private selectInstrument(mapping: ConnectionTypeMapping, analysis: ConnectionAnalysis): string | null {
        const availableInstruments = mapping.instrumentNames.filter(name =>
            this.instrumentConfigs.has(name)
        );

        if (availableInstruments.length === 0) {
            return null;
        }

        // Simple selection based on connection strength and type
        if (availableInstruments.length === 1) {
            return availableInstruments[0];
        }

        // Select based on strength - stronger connections get richer instruments
        const strengthIndex = Math.floor(analysis.strength * availableInstruments.length);
        const index = Math.min(strengthIndex, availableInstruments.length - 1);

        return availableInstruments[index];
    }

    /**
     * Calculate contextual modifiers based on connection characteristics
     */
    private calculateContextualModifiers(mapping: ConnectionTypeMapping, analysis: ConnectionAnalysis) {
        const modifiers = mapping.contextualModifiers;

        return {
            sameFolderBoost: analysis.isSameFolder ? modifiers.sameFolderBoost : modifiers.crossFolderReduction,
            recencyBoost: analysis.isRecent ? modifiers.recentConnectionBoost : 1.0,
            strengthBoost: mapping.linkStrengthAnalysis.enabled && analysis.strength > (mapping.linkStrengthAnalysis.frequencyThreshold / 10) ?
                mapping.linkStrengthAnalysis.volumeBoost : 1.0
        };
    }

    /**
     * Apply link strength modulation to audio characteristics
     */
    private applyLinkStrengthModulation(
        baseCharacteristics: ConnectionAudioCharacteristics,
        analysis: ConnectionAnalysis,
        contextualModifiers: { sameFolderBoost: number; recencyBoost: number; strengthBoost: number }
    ): ConnectionAudioCharacteristics {
        const modulated = { ...baseCharacteristics };

        // Apply strength-based volume modulation
        if (baseCharacteristics.strengthToVolumeEnabled) {
            const volumeModulation = analysis.strength * baseCharacteristics.strengthToVolumeAmount;
            modulated.baseVolume = Math.min(modulated.baseVolume * (1 + volumeModulation), 1.0);
        }

        // Apply contextual modifiers
        modulated.baseVolume *= contextualModifiers.sameFolderBoost * contextualModifiers.recencyBoost * contextualModifiers.strengthBoost;

        // Add dissonance for broken links
        if (!analysis.isResolved && baseCharacteristics.brokenLinkDissonance) {
            modulated.dissonanceLevel = Math.max(modulated.dissonanceLevel, 0.7);
            modulated.harmonicRichness *= 0.3; // Reduce harmonic richness
        }

        // Enhance bidirectional harmony
        if (analysis.isBidirectional && baseCharacteristics.bidirectionalHarmony) {
            modulated.harmonicRichness = Math.min(modulated.harmonicRichness * 1.2, 1.0);
            modulated.reverbAmount = Math.min(modulated.reverbAmount * 1.1, 1.0);
        }

        // Clamp all values to valid ranges
        return this.clampAudioCharacteristics(modulated);
    }

    /**
     * Clamp audio characteristics to valid ranges
     */
    private clampAudioCharacteristics(characteristics: ConnectionAudioCharacteristics): ConnectionAudioCharacteristics {
        return {
            ...characteristics,
            baseVolume: Math.min(Math.max(characteristics.baseVolume, 0.0), 1.0),
            volumeVariation: Math.min(Math.max(characteristics.volumeVariation, 0.0), 0.5),
            noteDuration: Math.min(Math.max(characteristics.noteDuration, 0.1), 3.0),
            attackTime: Math.min(Math.max(characteristics.attackTime, 0.01), 1.0),
            releaseTime: Math.min(Math.max(characteristics.releaseTime, 0.1), 5.0),
            spatialSpread: Math.min(Math.max(characteristics.spatialSpread, 0.0), 1.0),
            reverbAmount: Math.min(Math.max(characteristics.reverbAmount, 0.0), 1.0),
            delayAmount: Math.min(Math.max(characteristics.delayAmount, 0.0), 1.0),
            harmonicRichness: Math.min(Math.max(characteristics.harmonicRichness, 0.0), 1.0),
            dissonanceLevel: Math.min(Math.max(characteristics.dissonanceLevel, 0.0), 1.0)
        };
    }

    /**
     * Calculate confidence score for the mapping
     */
    private calculateConfidence(mapping: ConnectionTypeMapping, analysis: ConnectionAnalysis): number {
        let confidence = 0.7; // Base confidence

        // Higher confidence for resolved links
        if (analysis.isResolved) {
            confidence += 0.1;
        }

        // Higher confidence for frequent links
        if (analysis.frequency > 1) {
            confidence += Math.min(analysis.frequency * 0.05, 0.15);
        }

        // Higher confidence for bidirectional links
        if (analysis.isBidirectional) {
            confidence += 0.1;
        }

        // Higher confidence for same-folder links
        if (analysis.isSameFolder) {
            confidence += 0.05;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Generate human-readable reasoning for the mapping decision
     */
    private generateReasoning(mapping: ConnectionTypeMapping, analysis: ConnectionAnalysis): string[] {
        const reasoning: string[] = [];

        reasoning.push(`Detected ${analysis.type} connection type`);
        reasoning.push(`Assigned to ${mapping.instrumentFamily} family (${mapping.instrumentNames.join(', ')})`);
        reasoning.push(`Link strength: ${(analysis.strength * 100).toFixed(0)}%`);

        if (analysis.frequency > 1) {
            reasoning.push(`Frequent connection (${analysis.frequency} occurrences)`);
        }

        if (analysis.isBidirectional) {
            void reasoning.push('Bidirectional connection detected');
        }

        if (analysis.isSameFolder) {
            void reasoning.push('Same folder connection');
        }

        if (analysis.isRecent) {
            void reasoning.push('Recent connection');
        }

        if (!analysis.isResolved) {
            void reasoning.push('Unresolved/broken link');
        }

        return reasoning;
    }

    /**
     * Helper methods for connection analysis
     */
    private normalizeLink(link: string): string {
        return link.replace(/\.md$/, '').replace(/^\//, '');
    }

    private isTagBasedConnection(sourceFile: TFile, targetFile: TFile): boolean {
        // Simplified tag-based connection detection
        // In a real implementation, this would check shared tags
        return false; // Placeholder
    }

    private isBacklinkConnection(sourceFile: TFile, targetFile: TFile): boolean {
        // Check if targetFile links back to sourceFile
        const targetMetadata = this.app.metadataCache.getFileCache(targetFile);
        if (!targetMetadata?.links) return false;

        return targetMetadata.links.some(link =>
            this.normalizeLink(link.link) === this.normalizeLink(sourceFile.path)
        );
    }

    private isRecentConnection(creationTime: number): boolean {
        const daysSinceCreation = (Date.now() - creationTime) / (1000 * 60 * 60 * 24);
        return daysSinceCreation <= 7; // Consider connections from last week as recent
    }

    private isSameFolder(sourceFile: TFile, targetFile: TFile | null): boolean {
        if (!targetFile) return false;

        const sourcePath = sourceFile.path;
        const targetPath = targetFile.path;

        const sourceFolder = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
        const targetFolder = targetPath.substring(0, targetPath.lastIndexOf('/'));

        return sourceFolder === targetFolder;
    }

    private isBidirectionalLink(sourceFile: TFile, targetFile: TFile): boolean {
        const targetMetadata = this.app.metadataCache.getFileCache(targetFile);
        if (!targetMetadata?.links) return false;

        const sourceBasename = sourceFile.basename;
        return targetMetadata.links.some(link =>
            this.normalizeLink(link.link) === sourceBasename ||
            this.normalizeLink(link.link) === this.normalizeLink(sourceFile.path)
        );
    }

    private getLinkFrequency(linkTarget: string): number {
        return this.linkFrequencyCache.get(linkTarget) || 1;
    }

    private async calculateContentSimilarity(sourceFile: TFile, targetFile: TFile): Promise<number> {
        // Simplified content similarity - in practice this would use more sophisticated NLP
        try {
            const sourceContent = await this.app.vault.read(sourceFile);
            const targetContent = await this.app.vault.read(targetFile);

            // Very basic word overlap similarity
            const sourceWords = new Set(sourceContent.toLowerCase().split(/\s+/));
            const targetWords = new Set(targetContent.toLowerCase().split(/\s+/));

            const intersection = new Set([...sourceWords].filter(word => targetWords.has(word)));
            const union = new Set([...sourceWords, ...targetWords]);

            return intersection.size / union.size;
        } catch (error) {
            return 0.0;
        }
    }

    /**
     * Cache management methods
     */
    private getCacheKey(sourceId: string, link: GraphLink): string {
        return `${sourceId}:${link.target}:${link.source || ''}`;
    }

    private getFromCache(cacheKey: string): ConnectionTypeMappingResult | null {
        const cached = this.analysisCache.get(cacheKey);
        if (!cached) return null;

        if (Date.now() > cached.expiryTime) {
            this.analysisCache.delete(cacheKey);
            return null;
        }

        return cached.result;
    }

    private cacheResult(cacheKey: string, result: ConnectionTypeMappingResult): void {
        const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes
        this.analysisCache.set(cacheKey, {
            result,
            timestamp: Date.now(),
            expiryTime
        });

        // Periodic cache cleanup
        if (Date.now() - this.lastCacheCleanup > 60000) { // Every minute
            void this.cleanupCache();
        }
    }

    private cleanupCache(): void {
        const now = Date.now();
        for (const [key, cached] of this.analysisCache.entries()) {
            if (now > cached.expiryTime) {
                this.analysisCache.delete(key);
            }
        }

        // Enforce max cache size
        if (this.analysisCache.size > this.config.globalSettings.maxCacheSize) {
            const entries = Array.from(this.analysisCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toRemove = entries.slice(0, entries.length - this.config.globalSettings.maxCacheSize);
            toRemove.forEach(([key]) => this.analysisCache.delete(key));
        }

        this.lastCacheCleanup = now;
    }

    /**
     * Metrics and monitoring
     */
    private updateMetrics(result: ConnectionTypeMappingResult): void {
        this.metrics.totalConnections++;
        this.metrics.mappedConnections++;

        // Update type distribution
        if (!this.metrics.connectionTypeDistribution[result.connectionType]) {
            this.metrics.connectionTypeDistribution[result.connectionType] = 0;
        }
        this.metrics.connectionTypeDistribution[result.connectionType]++;

        // Update instrument family distribution
        if (!this.metrics.instrumentFamilyDistribution[result.instrumentFamily]) {
            this.metrics.instrumentFamilyDistribution[result.instrumentFamily] = 0;
        }
        this.metrics.instrumentFamilyDistribution[result.instrumentFamily]++;

        // Update link strength distribution
        if (result.linkStrength <= 0.3) {
            this.metrics.linkStrengthDistribution.weak++;
        } else if (result.linkStrength <= 0.7) {
            this.metrics.linkStrengthDistribution.moderate++;
        } else {
            this.metrics.linkStrengthDistribution.strong++;
        }

        // Update average analysis time
        this.metrics.averageAnalysisTime =
            (this.metrics.averageAnalysisTime * (this.metrics.mappedConnections - 1) + result.analysisTime) /
            this.metrics.mappedConnections;
    }

    /**
     * Public API methods
     */

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<ConnectionTypeMappingConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Clear cache when config changes
        this.analysisCache.clear();
        void this.initializeInstrumentConfigs();

        logger.info('connection-type-mapper', 'Configuration updated', {
            enabled: this.config.enabled,
            changedKeys: Object.keys(newConfig)
        });
    }

    /**
     * Get current configuration
     */
    public getConfig(): ConnectionTypeMappingConfig {
        return { ...this.config };
    }

    /**
     * Get performance metrics
     */
    public getMetrics(): ConnectionTypeMappingMetrics {
        return { ...this.metrics };
    }

    /**
     * Clear all caches
     */
    public clearCaches(): void {
        this.analysisCache.clear();
        this.linkFrequencyCache.clear();
        void logger.info('connection-type-mapper', 'Caches cleared');
    }

    /**
     * Update link frequency cache (called externally)
     */
    public updateLinkFrequency(linkTarget: string, frequency: number): void {
        this.linkFrequencyCache.set(linkTarget, frequency);
    }

    /**
     * Batch update link frequencies
     */
    public updateLinkFrequencies(frequencies: Map<string, number>): void {
        for (const [target, freq] of frequencies.entries()) {
            this.linkFrequencyCache.set(target, freq);
        }

        logger.debug('connection-type-mapper', 'Link frequencies updated', {
            count: frequencies.size
        });
    }

    /**
     * Validate connection type mapping configuration
     */
    public validateConfig(config: Partial<ConnectionTypeMappingConfig>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (config.globalSettings?.maxSimultaneousConnections !== undefined) {
            if (config.globalSettings.maxSimultaneousConnections < 1 || config.globalSettings.maxSimultaneousConnections > 100) {
                void errors.push('maxSimultaneousConnections must be between 1 and 100');
            }
        }

        if (config.globalSettings?.connectionVolumeMix !== undefined) {
            if (config.globalSettings.connectionVolumeMix < 0 || config.globalSettings.connectionVolumeMix > 1) {
                void errors.push('connectionVolumeMix must be between 0.0 and 1.0');
            }
        }

        if (config.mappings) {
            Object.entries(config.mappings).forEach(([type, mapping]) => {
                if (mapping.intensity < 0 || mapping.intensity > 1) {
                    errors.push(`${type} intensity must be between 0.0 and 1.0`);
                }
                if (mapping.priority < 1 || mapping.priority > 10) {
                    errors.push(`${type} priority must be between 1 and 10`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}