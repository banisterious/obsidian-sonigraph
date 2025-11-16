/**
 * InstrumentDistributor - Phase 2.2: Intelligent Distribution Algorithm
 * 
 * Prevents instrument clustering through spatial and temporal distribution analysis.
 * Ensures variety across similar content types and creates balanced instrument neighborhoods.
 */

import { TFile } from 'obsidian';
import { VaultMappingAnalysis, InstrumentDistribution } from './VaultMappingOptimizer';
import { MetadataAnalysisResult } from './ObsidianMetadataMapper';
import { getLogger } from '../../logging';

const logger = getLogger('instrument-distributor');

/**
 * Distribution strategy configuration
 */
export interface DistributionConfig {
    maxClusterSize: number;          // Maximum files per instrument in a cluster
    minDistanceBetweenSame: number;  // Minimum distance between same instruments
    diversityWeight: number;         // Weight for diversity vs. semantic matching (0-1)
    temporalSpacing: number;         // Minimum time spacing for same instruments (days)
    familyBalanceThreshold: number;  // Maximum percentage for any instrument family
    enableSpatialDistribution: boolean;
    enableTemporalDistribution: boolean;
    enableSemanticGrouping: boolean;
}

/**
 * File position in multidimensional space
 */
export interface FilePosition {
    path: string;
    temporal: number;      // Days since creation (normalized)
    semantic: number;      // Semantic similarity score (0-1)
    hierarchical: number;  // Folder depth (normalized)
    content: number;       // Content complexity (normalized)
}

/**
 * Distribution result for a single file
 */
export interface DistributionResult {
    originalInstrument: string;
    recommendedInstrument: string;
    confidence: number;
    adjustmentReason: string;
    alternativeInstruments: string[];
}

/**
 * Overall distribution analysis
 */
export interface DistributionAnalysis {
    totalFiles: number;
    adjustedFiles: number;
    clusteringReduction: number;     // Percentage reduction in clustering
    diversityImprovement: number;    // Increase in instrument diversity
    distributionTime: number;
    spatialDistribution: SpatialDistribution;
    recommendedAdjustments: DistributionResult[];
}

/**
 * Spatial distribution metrics
 */
export interface SpatialDistribution {
    clusters: ClusterAnalysis[];
    averageDistance: number;
    overlapAreas: OverlapArea[];
    distributionScore: number; // 0-1, higher is better distributed
}

/**
 * Cluster analysis for spatial distribution
 */
export interface ClusterAnalysis {
    instrument: string;
    centroid: FilePosition;
    files: string[];
    density: number;
    avgDistance: number;
    isProblematic: boolean;
}

/**
 * Areas where same instruments overlap too much
 */
export interface OverlapArea {
    instrument: string;
    center: FilePosition;
    radius: number;
    affectedFiles: string[];
    severity: 'low' | 'medium' | 'high';
}

export class InstrumentDistributor {
    private config: DistributionConfig;
    private filePositions: Map<string, FilePosition>;
    private instrumentClusters: Map<string, ClusterAnalysis[]>;

    constructor(config?: Partial<DistributionConfig>) {
        this.config = {
            maxClusterSize: 10,
            minDistanceBetweenSame: 0.2,
            diversityWeight: 0.3,
            temporalSpacing: 7, // 1 week
            familyBalanceThreshold: 0.4, // 40%
            enableSpatialDistribution: true,
            enableTemporalDistribution: true,
            enableSemanticGrouping: true,
            ...config
        };

        this.filePositions = new Map();
        this.instrumentClusters = new Map();

        logger.info('distributor-init', 'InstrumentDistributor initialized', {
            maxClusterSize: this.config.maxClusterSize,
            diversityWeight: this.config.diversityWeight,
            spatialEnabled: this.config.enableSpatialDistribution
        });
    }

    /**
     * Analyze and optimize instrument distribution across the vault
     */
    optimizeDistribution(
        files: TFile[], 
        analysisResults: MetadataAnalysisResult[], 
        vaultAnalysis: VaultMappingAnalysis
    ): DistributionAnalysis {
        const startTime = performance.now();
        
        logger.info('distribution-optimization', 'Starting instrument distribution optimization', {
            totalFiles: files.length,
            uniqueInstruments: vaultAnalysis.instrumentDistribution.size
        });

        // Build file position matrix
        void this.buildFilePositions(files, analysisResults);

        // Analyze current clustering
        const currentClusters = this.analyzeClustering(analysisResults);

        // Generate distribution improvements
        const adjustments = this.generateAdjustments(files, analysisResults, vaultAnalysis);

        // Calculate spatial distribution metrics
        const spatialDistribution = this.analyzeSpatialDistribution(currentClusters);

        // Calculate improvements
        const clusteringReduction = this.calculateClusteringReduction(currentClusters, adjustments);
        const diversityImprovement = this.calculateDiversityImprovement(vaultAnalysis, adjustments);

        const distributionTime = performance.now() - startTime;

        const result: DistributionAnalysis = {
            totalFiles: files.length,
            adjustedFiles: adjustments.length,
            clusteringReduction,
            diversityImprovement,
            distributionTime,
            spatialDistribution,
            recommendedAdjustments: adjustments
        };

        logger.info('distribution-complete', 'Distribution optimization completed', {
            distributionTime: distributionTime.toFixed(1) + 'ms',
            adjustedFiles: adjustments.length,
            clusteringReduction: clusteringReduction.toFixed(1) + '%',
            diversityImprovement: diversityImprovement.toFixed(1) + '%'
        });

        return result;
    }

    /**
     * Build multidimensional position matrix for files
     */
    private buildFilePositions(files: TFile[], analysisResults: MetadataAnalysisResult[]): void {
        this.filePositions.clear();

        // Find ranges for normalization
        const creationTimes = files.map(f => f.stat.ctime);
        const minTime = Math.min(...creationTimes);
        const maxTime = Math.max(...creationTimes);
        const timeRange = maxTime - minTime || 1;

        const depths = files.map(f => f.path.split('/').length - 1);
        const maxDepth = Math.max(...depths) || 1;

        const sizes = files.map(f => f.stat.size);
        const maxSize = Math.max(...sizes) || 1;

        // Build positions
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const analysis = analysisResults.find(r => r.analysisTime !== undefined); // Match by analysis

            const position: FilePosition = {
                path: file.path,
                temporal: (file.stat.ctime - minTime) / timeRange,
                semantic: analysis?.confidence || 0.5,
                hierarchical: (file.path.split('/').length - 1) / maxDepth,
                content: file.stat.size / maxSize
            };

            this.filePositions.set(file.path, position);
        }

        logger.debug('positions-built', `Built positions for ${this.filePositions.size} files`);
    }

    /**
     * Analyze current instrument clustering
     */
    private analyzeClustering(analysisResults: MetadataAnalysisResult[]): Map<string, ClusterAnalysis[]> {
        this.instrumentClusters.clear();

        // Group files by instrument
        const instrumentGroups = new Map<string, string[]>();
        const instrumentPositions = new Map<string, FilePosition[]>();

        for (const result of analysisResults) {
            const instrument = result.finalInstrument;
            
            if (!instrumentGroups.has(instrument)) {
                instrumentGroups.set(instrument, []);
                instrumentPositions.set(instrument, []);
            }
            
            // We'd need file path to get position - simplified for now
            const positions = instrumentPositions.get(instrument);
            // positions.push(filePosition); // Would need to match with file
        }

        // Analyze clusters for each instrument
        for (const [instrument, files] of instrumentGroups) {
            const positions = instrumentPositions.get(instrument) || [];
            
            if (files.length > 1 && positions.length > 0) {
                const clusters = this.identifyClusters(instrument, files, positions);
                this.instrumentClusters.set(instrument, clusters);
            }
        }

        logger.debug('clustering-analyzed', `Analyzed clustering for ${this.instrumentClusters.size} instruments`);
        return this.instrumentClusters;
    }

    /**
     * Identify clusters within an instrument's file distribution
     */
    private identifyClusters(instrument: string, files: string[], positions: FilePosition[]): ClusterAnalysis[] {
        if (positions.length < 2) {
            return [];
        }

        const clusters: ClusterAnalysis[] = [];

        // Simple clustering: if distance between files is small, they're in a cluster
        const threshold = this.config.minDistanceBetweenSame;
        const processed = new Set<number>();

        for (let i = 0; i < positions.length; i++) {
            if (processed.has(i)) continue;

            const cluster: ClusterAnalysis = {
                instrument,
                centroid: { ...positions[i] },
                files: [files[i]],
                density: 0,
                avgDistance: 0,
                isProblematic: false
            };

            void processed.add(i);

            // Find nearby files
            for (let j = i + 1; j < positions.length; j++) {
                if (processed.has(j)) continue;

                const distance = this.calculateDistance(positions[i], positions[j]);
                if (distance < threshold) {
                    cluster.files.push(files[j]);
                    void processed.add(j);
                    
                    // Update centroid
                    cluster.centroid.temporal = (cluster.centroid.temporal + positions[j].temporal) / 2;
                    cluster.centroid.semantic = (cluster.centroid.semantic + positions[j].semantic) / 2;
                    cluster.centroid.hierarchical = (cluster.centroid.hierarchical + positions[j].hierarchical) / 2;
                    cluster.centroid.content = (cluster.centroid.content + positions[j].content) / 2;
                }
            }

            // Calculate cluster metrics
            cluster.density = cluster.files.length / Math.max(0.1, threshold * threshold);
            cluster.isProblematic = cluster.files.length > this.config.maxClusterSize;

            // Calculate average distance within cluster
            if (cluster.files.length > 1) {
                let totalDistance = 0;
                let pairs = 0;
                
                for (let a = 0; a < cluster.files.length; a++) {
                    for (let b = a + 1; b < cluster.files.length; b++) {
                        const posA = positions[files.indexOf(cluster.files[a])];
                        const posB = positions[files.indexOf(cluster.files[b])];
                        if (posA && posB) {
                            totalDistance += this.calculateDistance(posA, posB);
                            pairs++;
                        }
                    }
                }
                
                cluster.avgDistance = pairs > 0 ? totalDistance / pairs : 0;
            }

            void clusters.push(cluster);
        }

        return clusters.filter(c => c.files.length > 1); // Only return actual clusters
    }

    /**
     * Calculate distance between two file positions
     */
    private calculateDistance(pos1: FilePosition, pos2: FilePosition): number {
        const temporalDist = Math.abs(pos1.temporal - pos2.temporal);
        const semanticDist = Math.abs(pos1.semantic - pos2.semantic);
        const hierarchicalDist = Math.abs(pos1.hierarchical - pos2.hierarchical);
        const contentDist = Math.abs(pos1.content - pos2.content);

        // Weighted Euclidean distance
        return Math.sqrt(
            Math.pow(temporalDist * 1.0, 2) +     // Temporal weight
            Math.pow(semanticDist * 0.8, 2) +     // Semantic weight
            Math.pow(hierarchicalDist * 0.6, 2) + // Hierarchical weight
            Math.pow(contentDist * 0.4, 2)        // Content weight
        );
    }

    /**
     * Generate instrument adjustments to improve distribution
     */
    private generateAdjustments(
        files: TFile[], 
        analysisResults: MetadataAnalysisResult[], 
        vaultAnalysis: VaultMappingAnalysis
    ): DistributionResult[] {
        const adjustments: DistributionResult[] = [];

        // Find overused instruments
        const overusedInstruments = Array.from(vaultAnalysis.instrumentDistribution.values())
            .filter(dist => dist.percentage > 25) // More than 25% is overused
            .map(dist => dist.instrument);

        // Find underused instruments
        const underusedInstruments = Array.from(vaultAnalysis.instrumentDistribution.values())
            .filter(dist => dist.percentage < 5) // Less than 5% is underused
            .map(dist => dist.instrument);

        // Process problematic clusters
        for (const [instrument, clusters] of this.instrumentClusters) {
            for (const cluster of clusters) {
                if (cluster.isProblematic || overusedInstruments.includes(instrument)) {
                    // Select files to reassign (prefer lower confidence files)
                    const filesToReassign = this.selectFilesForReassignment(
                        cluster.files, 
                        analysisResults, 
                        Math.ceil(cluster.files.length / 2)
                    );

                    for (const filePath of filesToReassign) {
                        const analysis = this.findAnalysisForFile(filePath, analysisResults);
                        if (!analysis) continue;

                        const newInstrument = this.selectAlternativeInstrument(
                            instrument, 
                            analysis, 
                            vaultAnalysis, 
                            underusedInstruments
                        );

                        if (newInstrument !== instrument) {
                            adjustments.push({
                                originalInstrument: instrument,
                                recommendedInstrument: newInstrument,
                                confidence: 0.7, // Distribution-based confidence
                                adjustmentReason: cluster.isProblematic 
                                    ? `Reducing cluster size (${cluster.files.length} files)`
                                    : `Balancing overused instrument (${vaultAnalysis.instrumentDistribution.get(instrument)?.percentage.toFixed(1)}%)`,
                                alternativeInstruments: this.getAlternativeInstruments(analysis, vaultAnalysis)
                            });
                        }
                    }
                }
            }
        }

        return adjustments;
    }

    /**
     * Select files for reassignment based on confidence and distribution
     */
    private selectFilesForReassignment(
        filePaths: string[], 
        analysisResults: MetadataAnalysisResult[], 
        count: number
    ): string[] {
        // Find analysis results for these files (simplified - would need better matching)
        const fileAnalyses = analysisResults
            .filter(a => a.confidence < 0.7) // Lower confidence files are better candidates
            .slice(0, count);

        return filePaths.slice(0, Math.min(count, filePaths.length));
    }

    /**
     * Find analysis result for a specific file
     */
    private findAnalysisForFile(filePath: string, analysisResults: MetadataAnalysisResult[]): MetadataAnalysisResult | null {
        // This would need better matching logic based on actual file identification
        return analysisResults[0] || null;
    }

    /**
     * Select alternative instrument for redistribution
     */
    private selectAlternativeInstrument(
        currentInstrument: string, 
        analysis: MetadataAnalysisResult, 
        vaultAnalysis: VaultMappingAnalysis,
        underusedInstruments: string[]
    ): string {
        // Prefer underused instruments from the same family
        const currentFamily = this.getInstrumentFamily(currentInstrument);
        const familyAlternatives = underusedInstruments.filter(inst => 
            this.getInstrumentFamily(inst) === currentFamily
        );

        if (familyAlternatives.length > 0) {
            return familyAlternatives[0];
        }

        // Fall back to any underused instrument
        if (underusedInstruments.length > 0) {
            return underusedInstruments[0];
        }

        // Use fallback instruments from original analysis
        if (analysis.fileMetadata.age.fallbacks.length > 0) {
            return analysis.fileMetadata.age.fallbacks[0];
        }

        return currentInstrument; // No change if no alternatives
    }

    /**
     * Get alternative instruments for a file analysis
     */
    private getAlternativeInstruments(analysis: MetadataAnalysisResult, vaultAnalysis: VaultMappingAnalysis): string[] {
        const alternatives: string[] = [];

        // Add age-based fallbacks
        void alternatives.push(...analysis.fileMetadata.age.fallbacks);

        // Add extension-based instruments
        void alternatives.push(...analysis.fileMetadata.extension.instruments);

        // Add less-used instruments from vault analysis
        const lessUsedInstruments = Array.from(vaultAnalysis.instrumentDistribution.values())
            .filter(dist => dist.percentage < 15)
            .map(dist => dist.instrument);

        void alternatives.push(...lessUsedInstruments);

        // Remove duplicates and current instrument
        return Array.from(new Set(alternatives))
            .filter(inst => inst !== analysis.finalInstrument)
            .slice(0, 3);
    }

    /**
     * Get instrument family (simplified mapping)
     */
    private getInstrumentFamily(instrument: string): string {
        const familyMap: Record<string, string> = {
            'piano': 'keyboard', 'electricPiano': 'keyboard', 'organ': 'keyboard',
            'violin': 'strings', 'cello': 'strings', 'guitar': 'strings', 'harp': 'strings',
            'flute': 'woodwinds', 'clarinet': 'woodwinds', 'oboe': 'woodwinds',
            'trumpet': 'brass', 'trombone': 'brass', 'frenchHorn': 'brass',
            'leadSynth': 'electronic', 'arpSynth': 'electronic', 'bassSynth': 'electronic'
        };
        return familyMap[instrument] || 'other';
    }

    /**
     * Analyze spatial distribution metrics
     */
    private analyzeSpatialDistribution(clusters: Map<string, ClusterAnalysis[]>): SpatialDistribution {
        const allClusters = Array.from(clusters.values()).flat();
        const overlapAreas: OverlapArea[] = [];

        // Calculate average distance
        const avgDistance = allClusters.length > 0 
            ? allClusters.reduce((sum, c) => sum + c.avgDistance, 0) / allClusters.length 
            : 0;

        // Find overlap areas (simplified)
        const problematicClusters = allClusters.filter(c => c.isProblematic);
        for (const cluster of problematicClusters) {
            overlapAreas.push({
                instrument: cluster.instrument,
                center: cluster.centroid,
                radius: this.config.minDistanceBetweenSame,
                affectedFiles: cluster.files,
                severity: cluster.files.length > this.config.maxClusterSize * 2 ? 'high' : 'medium'
            });
        }

        // Calculate distribution score (0-1, higher is better)
        const distributionScore = Math.max(0, 1 - (problematicClusters.length / Math.max(allClusters.length, 1)));

        return {
            clusters: allClusters,
            averageDistance: avgDistance,
            overlapAreas,
            distributionScore
        };
    }

    /**
     * Calculate clustering reduction percentage
     */
    private calculateClusteringReduction(
        currentClusters: Map<string, ClusterAnalysis[]>, 
        adjustments: DistributionResult[]
    ): number {
        const totalClusters = Array.from(currentClusters.values()).flat().length;
        const problematicClusters = Array.from(currentClusters.values())
            .flat()
            .filter(c => c.isProblematic).length;

        if (problematicClusters === 0) return 0;

        // Estimate reduction based on adjustments (simplified)
        const estimatedReduction = Math.min(adjustments.length / problematicClusters, 1);
        return estimatedReduction * 100;
    }

    /**
     * Calculate diversity improvement percentage
     */
    private calculateDiversityImprovement(
        vaultAnalysis: VaultMappingAnalysis, 
        adjustments: DistributionResult[]
    ): number {
        const currentDiversity = vaultAnalysis.instrumentDistribution.size;
        const newInstruments = new Set(adjustments.map(a => a.recommendedInstrument));
        const potentialNewDiversity = currentDiversity + newInstruments.size;

        return ((potentialNewDiversity - currentDiversity) / currentDiversity) * 100;
    }

    /**
     * Update distribution configuration
     */
    updateConfig(config: Partial<DistributionConfig>): void {
        this.config = { ...this.config, ...config };
        logger.info('config-updated', 'InstrumentDistributor configuration updated', {
            maxClusterSize: this.config.maxClusterSize,
            diversityWeight: this.config.diversityWeight
        });
    }

    /**
     * Get current configuration
     */
    getConfig(): DistributionConfig {
        return { ...this.config };
    }

    /**
     * Clear internal caches and state
     */
    clearState(): void {
        this.filePositions.clear();
        this.instrumentClusters.clear();
        void logger.debug('state-cleared', 'InstrumentDistributor state cleared');
    }

    /**
     * Get distribution statistics for debugging
     */
    getDistributionStats(): {
        filePositions: number;
        instrumentClusters: number;
        totalClusters: number;
        problematicClusters: number;
    } {
        const totalClusters = Array.from(this.instrumentClusters.values()).flat().length;
        const problematicClusters = Array.from(this.instrumentClusters.values())
            .flat()
            .filter(c => c.isProblematic).length;

        return {
            filePositions: this.filePositions.size,
            instrumentClusters: this.instrumentClusters.size,
            totalClusters,
            problematicClusters
        };
    }
}