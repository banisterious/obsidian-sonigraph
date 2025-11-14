/**
 * VaultMappingOptimizer - Phase 2.2: Vault-Wide Mapping Optimization
 * 
 * Provides instant vault-wide analysis using cached data only (zero file I/O).
 * Target: <100ms for 10,000 file vault analysis.
 */

import { App, TFile } from 'obsidian';
import { ObsidianMetadataMapper, MetadataAnalysisResult } from './ObsidianMetadataMapper';
import { MetadataMappingRules } from './MetadataMappingRules';
import { EnhancedGraphNode, AudioMappingConfig } from '../../graph/types';
import { getLogger } from '../../logging';

const logger = getLogger('vault-mapping-optimizer');

/**
 * Instrument distribution analysis for the entire vault
 */
export interface VaultMappingAnalysis {
    totalFiles: number;
    processedFiles: number;
    instrumentDistribution: Map<string, InstrumentDistribution>;
    familyDistribution: Map<string, number>;
    averageConfidence: number;
    analysisTime: number;
    performanceMetrics: PerformanceMetrics;
    recommendations: OptimizationRecommendation[];
}

/**
 * Distribution data for a specific instrument
 */
export interface InstrumentDistribution {
    instrument: string;
    count: number;
    percentage: number;
    avgConfidence: number;
    files: string[];
    clusters: ClusterInfo[];
}

/**
 * Cluster information for spatial distribution
 */
export interface ClusterInfo {
    centroid: { x: number; y: number };
    files: string[];
    avgDistance: number;
    density: number;
}

/**
 * Performance metrics for optimization analysis
 */
export interface PerformanceMetrics {
    filesPerSecond: number;
    avgAnalysisTimePerFile: number;
    cacheHitRate: number;
    memoryUsage: number;
    bottlenecks: string[];
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
    type: 'clustering' | 'distribution' | 'performance' | 'diversity';
    priority: 'high' | 'medium' | 'low';
    description: string;
    affectedInstruments: string[];
    suggestedActions: string[];
}

/**
 * Batch processing configuration
 */
export interface BatchProcessingConfig {
    batchSize: number;
    maxProcessingTime: number;
    prioritizeRecentFiles: boolean;
    enableParallelProcessing: boolean;
    memoryThreshold: number;
}

export class VaultMappingOptimizer {
    private app: App;
    private metadataMapper: ObsidianMetadataMapper;
    private mappingRules: MetadataMappingRules;
    private config: AudioMappingConfig;
    private batchConfig: BatchProcessingConfig;
    private analysisCache: Map<string, VaultMappingAnalysis>;
    private readonly CACHE_TTL = 600000; // 10 minutes for vault-wide analysis
    private cacheTimestamp: number = 0;

    constructor(app: App, metadataMapper: ObsidianMetadataMapper, mappingRules: MetadataMappingRules, config: AudioMappingConfig) {
        this.app = app;
        this.metadataMapper = metadataMapper;
        this.mappingRules = mappingRules;
        this.config = config;
        this.analysisCache = new Map();
        
        this.batchConfig = {
            batchSize: 500, // Process 500 files at a time
            maxProcessingTime: 100, // 100ms target for vault analysis
            prioritizeRecentFiles: true,
            enableParallelProcessing: false, // Keep sequential for predictable performance
            memoryThreshold: 50 * 1024 * 1024 // 50MB memory threshold
        };

        logger.info('vault-optimizer-init', 'VaultMappingOptimizer initialized', {
            batchSize: this.batchConfig.batchSize,
            maxProcessingTime: this.batchConfig.maxProcessingTime
        });
    }

    /**
     * Perform instant vault-wide analysis using cached data only
     */
    async analyzeVault(forceRefresh: boolean = false): Promise<VaultMappingAnalysis> {
        // Check cache first
        if (!forceRefresh && this.isAnalysisCached()) {
            logger.info('cache-hit', 'Using cached vault analysis');
            return this.analysisCache.get('vault');
        }

        const overallStartTime = performance.now();
        logger.info('vault-analysis-start', 'Starting vault-wide mapping analysis');

        try {
            // Get all markdown files (primary target for audio mapping)
            const files = this.app.vault.getMarkdownFiles();
            logger.debug('files-collected', `Collected ${files.length} markdown files for analysis`);

            // Initialize analysis result
            const analysis: VaultMappingAnalysis = {
                totalFiles: files.length,
                processedFiles: 0,
                instrumentDistribution: new Map(),
                familyDistribution: new Map(),
                averageConfidence: 0,
                analysisTime: 0,
                performanceMetrics: {
                    filesPerSecond: 0,
                    avgAnalysisTimePerFile: 0,
                    cacheHitRate: 0,
                    memoryUsage: 0,
                    bottlenecks: []
                },
                recommendations: []
            };

            // Process files in batches for performance
            const results = await this.processBatches(files);
            
            // Aggregate results
            this.aggregateResults(results, analysis);
            
            // Calculate performance metrics
            const totalTime = performance.now() - overallStartTime;
            analysis.analysisTime = totalTime;
            this.calculatePerformanceMetrics(analysis, results, totalTime);

            // Generate optimization recommendations
            analysis.recommendations = this.generateRecommendations(analysis);

            // Cache the result
            this.analysisCache.set('vault', analysis);
            this.cacheTimestamp = Date.now();

            logger.info('vault-analysis-complete', 'Vault analysis completed', {
                totalTime: totalTime.toFixed(1) + 'ms',
                filesProcessed: analysis.processedFiles,
                uniqueInstruments: analysis.instrumentDistribution.size,
                avgConfidence: analysis.averageConfidence.toFixed(2),
                meetsTarget: totalTime < this.batchConfig.maxProcessingTime
            });

            return analysis;

        } catch (error) {
            logger.error('vault-analysis-error', 'Vault analysis failed', error as Error);
            throw error;
        }
    }

    /**
     * Process files in optimized batches
     */
    private async processBatches(files: TFile[]): Promise<MetadataAnalysisResult[]> {
        const results: MetadataAnalysisResult[] = [];
        const batchSize = this.batchConfig.batchSize;
        
        // Sort files for optimal processing if enabled
        if (this.batchConfig.prioritizeRecentFiles) {
            files.sort((a, b) => b.stat.mtime - a.stat.mtime);
        }

        let processedCount = 0;
        const startTime = performance.now();

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchStartTime = performance.now();

            logger.debug('batch-processing', `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`, {
                batchSize: batch.length,
                startIndex: i
            });

            // Process batch
            const batchResults = this.processBatch(batch);
            results.push(...batchResults);
            processedCount += batch.length;

            const batchTime = performance.now() - batchStartTime;
            const totalTime = performance.now() - startTime;

            // Check if we're exceeding time target
            if (totalTime > this.batchConfig.maxProcessingTime && i + batchSize < files.length) {
                logger.warn('time-limit-exceeded', 'Vault analysis exceeding time target, processing remaining files with reduced analysis', {
                    processedFiles: processedCount,
                    remainingFiles: files.length - processedCount,
                    totalTime: totalTime.toFixed(1) + 'ms'
                });
                
                // Switch to fast mode for remaining files
                const remainingBatchResults = this.processBatchFast(files.slice(i + batchSize));
                results.push(...remainingBatchResults);
                processedCount = files.length;
                break;
            }

            logger.debug('batch-complete', `Batch completed in ${batchTime.toFixed(1)}ms`, {
                batchIndex: Math.floor(i / batchSize) + 1,
                filesInBatch: batch.length,
                totalProcessed: processedCount
            });
        }

        return results;
    }

    /**
     * Process a single batch of files with full analysis
     */
    private processBatch(files: TFile[]): MetadataAnalysisResult[] {
        const results: MetadataAnalysisResult[] = [];

        for (const file of files) {
            try {
                // Use metadata mapper for zero-I/O analysis
                const result = this.metadataMapper.analyzeFile(file);
                results.push(result);
            } catch (error) {
                logger.warn('file-analysis-error', `Failed to analyze file: ${file.path}`, { error });
                // Continue processing other files
            }
        }

        return results;
    }

    /**
     * Process remaining files with fast, minimal analysis
     */
    private processBatchFast(files: TFile[]): MetadataAnalysisResult[] {
        const results: MetadataAnalysisResult[] = [];

        for (const file of files) {
            try {
                // Minimal analysis - just file metadata, skip content analysis
                const fileMetadata = this.metadataMapper.analyzeFileMetadata(file);
                
                const result: MetadataAnalysisResult = {
                    fileMetadata,
                    contentMetadata: {
                        tagMappings: [],
                        linkDensity: { consonance: 0.5, complexity: 0.3, density: 0.2 },
                        structure: { tempo: 1.0, pattern: 'simple', emphasis: 0.3 }
                    },
                    combinedScore: 0.5,
                    finalInstrument: fileMetadata.age.instrument,
                    confidence: 0.3, // Lower confidence for fast processing
                    analysisTime: 0.1 // Minimal time
                };

                results.push(result);
            } catch (error) {
                logger.warn('fast-analysis-error', `Fast analysis failed for: ${file.path}`, { error });
                // Continue processing
            }
        }

        return results;
    }

    /**
     * Aggregate analysis results into vault-wide statistics
     */
    private aggregateResults(results: MetadataAnalysisResult[], analysis: VaultMappingAnalysis): void {
        analysis.processedFiles = results.length;
        
        let totalConfidence = 0;
        const instrumentCounts = new Map<string, number>();
        const familyCounts = new Map<string, number>();
        const instrumentFiles = new Map<string, string[]>();
        const confidenceSum = new Map<string, number>();

        for (const result of results) {
            totalConfidence += result.confidence;
            
            // Count instruments
            const instrument = result.finalInstrument;
            instrumentCounts.set(instrument, (instrumentCounts.get(instrument) || 0) + 1);
            confidenceSum.set(instrument, (confidenceSum.get(instrument) || 0) + result.confidence);
            
            // Track files per instrument
            if (!instrumentFiles.has(instrument)) {
                instrumentFiles.set(instrument, []);
            }
            // Note: We don't have file path in result, would need to track separately
            
            // Count families (simplified mapping)
            const family = this.getInstrumentFamily(instrument);
            familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
        }

        // Calculate averages and distributions
        analysis.averageConfidence = totalConfidence / results.length;

        // Build instrument distribution
        for (const [instrument, count] of instrumentCounts) {
            const percentage = (count / results.length) * 100;
            const avgConfidence = (confidenceSum.get(instrument) || 0) / count;
            
            analysis.instrumentDistribution.set(instrument, {
                instrument,
                count,
                percentage,
                avgConfidence,
                files: instrumentFiles.get(instrument) || [],
                clusters: [] // Will be calculated separately if needed
            });
        }

        // Set family distribution
        analysis.familyDistribution = familyCounts;
    }

    /**
     * Calculate performance metrics
     */
    private calculatePerformanceMetrics(analysis: VaultMappingAnalysis, results: MetadataAnalysisResult[], totalTime: number): void {
        analysis.performanceMetrics.filesPerSecond = (analysis.processedFiles / totalTime) * 1000;
        analysis.performanceMetrics.avgAnalysisTimePerFile = results.length > 0 
            ? results.reduce((sum, r) => sum + r.analysisTime, 0) / results.length 
            : 0;

        // Estimate memory usage (rough calculation)
        analysis.performanceMetrics.memoryUsage = analysis.processedFiles * 1024; // ~1KB per file estimate

        // Identify bottlenecks
        const bottlenecks: string[] = [];
        if (totalTime > this.batchConfig.maxProcessingTime) {
            bottlenecks.push('total-time-exceeded');
        }
        if (analysis.performanceMetrics.avgAnalysisTimePerFile > 1.0) {
            bottlenecks.push('slow-per-file-analysis');
        }
        if (analysis.instrumentDistribution.size < 5 && analysis.processedFiles > 100) {
            bottlenecks.push('limited-instrument-diversity');
        }

        analysis.performanceMetrics.bottlenecks = bottlenecks;
    }

    /**
     * Generate optimization recommendations based on analysis
     */
    private generateRecommendations(analysis: VaultMappingAnalysis): OptimizationRecommendation[] {
        const recommendations: OptimizationRecommendation[] = [];

        // Check for instrument clustering
        const overusedInstruments = Array.from(analysis.instrumentDistribution.values())
            .filter(dist => dist.percentage > 30) // More than 30% of files
            .map(dist => dist.instrument);

        if (overusedInstruments.length > 0) {
            recommendations.push({
                type: 'clustering',
                priority: 'high',
                description: `Instruments ${overusedInstruments.join(', ')} are overused (>30% of files)`,
                affectedInstruments: overusedInstruments,
                suggestedActions: [
                    'Add more mapping rules to distribute instruments',
                    'Enable content-aware mapping for better variety',
                    'Consider using instrument families instead of specific instruments'
                ]
            });
        }

        // Check for low diversity
        const uniqueInstruments = analysis.instrumentDistribution.size;
        if (uniqueInstruments < Math.min(10, Math.floor(analysis.processedFiles / 50))) {
            recommendations.push({
                type: 'diversity',
                priority: 'medium',
                description: `Low instrument diversity: only ${uniqueInstruments} unique instruments for ${analysis.processedFiles} files`,
                affectedInstruments: [],
                suggestedActions: [
                    'Enable more instrument categories in settings',
                    'Add tag-based mapping rules',
                    'Use folder-based instrument mapping'
                ]
            });
        }

        // Check performance issues
        if (analysis.performanceMetrics.bottlenecks.length > 0) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                description: `Performance issues detected: ${analysis.performanceMetrics.bottlenecks.join(', ')}`,
                affectedInstruments: [],
                suggestedActions: [
                    'Increase batch size for vault analysis',
                    'Enable metadata caching',
                    'Consider reducing analysis depth for large vaults'
                ]
            });
        }

        // Check for low confidence
        if (analysis.averageConfidence < 0.5) {
            recommendations.push({
                type: 'distribution',
                priority: 'low',
                description: `Low average confidence (${analysis.averageConfidence.toFixed(2)}) suggests mapping rules need refinement`,
                affectedInstruments: [],
                suggestedActions: [
                    'Add more specific mapping rules',
                    'Use frontmatter properties for explicit instrument assignment',
                    'Review and adjust existing rules'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Get instrument family for an instrument (simplified mapping)
     */
    private getInstrumentFamily(instrument: string): string {
        const familyMap: Record<string, string> = {
            'piano': 'keyboard',
            'electricPiano': 'keyboard',
            'organ': 'keyboard',
            'violin': 'strings',
            'cello': 'strings',
            'guitar': 'strings',
            'harp': 'strings',
            'flute': 'woodwinds',
            'clarinet': 'woodwinds',
            'oboe': 'woodwinds',
            'saxophone': 'woodwinds',
            'trumpet': 'brass',
            'trombone': 'brass',
            'frenchHorn': 'brass',
            'tuba': 'brass',
            'timpani': 'percussion',
            'xylophone': 'percussion',
            'vibraphone': 'percussion',
            'leadSynth': 'electronic',
            'arpSynth': 'electronic',
            'bassSynth': 'electronic',
            'pad': 'electronic'
        };

        return familyMap[instrument] || 'other';
    }

    /**
     * Check if vault analysis is cached and valid
     */
    private isAnalysisCached(): boolean {
        return this.analysisCache.has('vault') && (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
    }

    /**
     * Get instrument neighborhoods for related files
     */
    createInstrumentNeighborhoods(analysis: VaultMappingAnalysis): Map<string, string[]> {
        const neighborhoods = new Map<string, string[]>();
        
        // Group instruments by family for neighborhood creation
        const familyGroups = new Map<string, string[]>();
        
        for (const [instrument, distribution] of analysis.instrumentDistribution) {
            const family = this.getInstrumentFamily(instrument);
            if (!familyGroups.has(family)) {
                familyGroups.set(family, []);
            }
            const familyInstruments = familyGroups.get(family); if (familyInstruments) familyInstruments.push(instrument);
        }

        // Create neighborhoods within families
        for (const [family, instruments] of familyGroups) {
            if (instruments.length > 1) {
                neighborhoods.set(family, instruments);
            }
        }

        logger.debug('neighborhoods-created', `Created ${neighborhoods.size} instrument neighborhoods`, {
            families: Array.from(neighborhoods.keys()),
            avgNeighborhoodSize: Array.from(neighborhoods.values()).reduce((sum, arr) => sum + arr.length, 0) / neighborhoods.size
        });

        return neighborhoods;
    }

    /**
     * Update configuration and clear cache
     */
    updateConfig(config: AudioMappingConfig): void {
        this.config = config;
        this.clearCache();
        logger.info('config-updated', 'VaultMappingOptimizer configuration updated');
    }

    /**
     * Update batch processing configuration
     */
    updateBatchConfig(config: Partial<BatchProcessingConfig>): void {
        this.batchConfig = { ...this.batchConfig, ...config };
        this.clearCache(); // Configuration change may affect results
        
        logger.info('batch-config-updated', 'Batch processing configuration updated', {
            batchSize: this.batchConfig.batchSize,
            maxProcessingTime: this.batchConfig.maxProcessingTime
        });
    }

    /**
     * Clear analysis cache
     */
    clearCache(): void {
        this.analysisCache.clear();
        this.cacheTimestamp = 0;
        logger.debug('cache-cleared', 'Vault analysis cache cleared');
    }

    /**
     * Get current cache statistics
     */
    getCacheStats(): { cached: boolean; age: number; filesAnalyzed: number } {
        const cached = this.isAnalysisCached();
        const age = cached ? Date.now() - this.cacheTimestamp : 0;
        const filesAnalyzed = cached ? this.analysisCache.get('vault')?.processedFiles || 0 : 0;

        return { cached, age, filesAnalyzed };
    }

    /**
     * Force refresh of vault analysis
     */
    async refreshAnalysis(): Promise<VaultMappingAnalysis> {
        logger.info('force-refresh', 'Forcing vault analysis refresh');
        return this.analyzeVault(true);
    }
}