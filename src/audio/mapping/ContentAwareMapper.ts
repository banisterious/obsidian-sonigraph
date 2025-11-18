/**
 * ContentAwareMapper - Phase 4.1: Advanced File Type Mapping
 * 
 * Provides sophisticated mapping based on file characteristics beyond just extension.
 * Analyzes metadata like image dimensions, PDF page count, audio duration, note complexity
 * and maps these characteristics to musical properties.
 */

import { TFile, App } from 'obsidian';
import { EnhancedGraphNode, AudioMappingConfig, MusicalContext } from '../../graph/types';
import { InstrumentConfig, getAllInstruments, getInstrumentsByCategory } from '../configs';
import { FileTypeAnalyzer, FileCharacteristics } from './FileTypeAnalyzer';
import { InstrumentSelector, InstrumentSelectionCriteria } from './InstrumentSelector';
import { TagSemanticMapper, TagSemanticMapperConfig, SemanticMappingResult } from './TagSemanticMapper';
import { TagMappingConfig } from './SemanticMappingConfig';
import { FolderHierarchyMapper, FolderCharacteristics, InstrumentFamily } from './FolderHierarchyMapper';
import { getLogger } from '../../logging';

const logger = getLogger('content-aware-mapper');

/**
 * Musical properties derived from file characteristics
 */
export interface MusicalProperties {
    pitchRange: [number, number]; // MIDI note numbers
    noteDuration: number; // Duration multiplier (0.1 to 3.0)
    velocity: number; // Velocity/intensity (0.0 to 1.0)
    instrumentRichness: number; // Complexity factor (0.0 to 1.0)
    spatialPosition: { pan: number; reverb: number; delay: number };
    rhythmicComplexity: number; // Rhythm pattern complexity (0.0 to 1.0)
    harmonicDensity: number; // Harmonic complexity (0.0 to 1.0)
}

/**
 * Content-aware mapping result with detailed analysis
 */
export interface ContentAwareMappingResult {
    characteristics: FileCharacteristics;
    musicalProperties: MusicalProperties;
    selectedInstrument: string;
    instrumentConfig: InstrumentConfig;
    confidence: number;
    reasoning: string[];
    fallbackInstruments: string[];
    analysisTime: number;
}

/**
 * Advanced configuration for content-aware mapping
 */
export interface ContentAwareMappingConfig extends AudioMappingConfig {
    enhancedMapping: {
        analyzeImageMetadata: boolean;
        analyzeAudioDuration: boolean;
        analyzePdfStructure: boolean;
        analyzeNoteComplexity: boolean;
        enableFileSystemAnalysis: boolean;
        enableSemanticAnalysis: boolean;
        useAdvancedHeuristics: boolean;
        weightings: {
            fileSize: number;
            contentStructure: number;
            metadata: number;
            semantics: number;
            relationships: number;
        };
    };
    tagSemantics: {
        enabled: boolean;
        weightings: {
            emotional: number;
            functional: number;
            topical: number;
            complexity: number;
            temporal: number;
        };
        enableComplexityMapping: boolean;
        enableTemporalAnalysis: boolean;
        customTagMappings?: Partial<TagMappingConfig>;
    };
    folderHierarchy: {
        enabled: boolean;
        weightings: {
            pathDepth: number;
            thematicMapping: number;
            instrumentFamily: number;
            pitchModulation: number;
            timbreModulation: number;
        };
        customFolderMappings?: Record<string, Partial<{ instrumentFamily: InstrumentFamily }>>;
        maxDepthConsideration?: number;
        pitchDepthSensitivity?: number;
        timbreDepthSensitivity?: number;
    };
}

export class ContentAwareMapper {
    private app: App;
    private config: ContentAwareMappingConfig;
    private fileTypeAnalyzer: FileTypeAnalyzer;
    private instrumentSelector: InstrumentSelector;
    private tagSemanticMapper: TagSemanticMapper | null;
    private folderHierarchyMapper: FolderHierarchyMapper | null;
    private availableInstruments: Map<string, InstrumentConfig>;
    private mappingCache: Map<string, ContentAwareMappingResult>;
    private readonly CACHE_TTL = 600000; // 10 minutes
    private cacheTimestamps: Map<string, number>;

    constructor(app: App, config: ContentAwareMappingConfig) {
        this.app = app;
        this.config = config;
        this.fileTypeAnalyzer = new FileTypeAnalyzer(app);
        this.instrumentSelector = new InstrumentSelector();
        this.availableInstruments = new Map(Object.entries(getAllInstruments()));
        this.mappingCache = new Map();
        this.cacheTimestamps = new Map();

        // Initialize TagSemanticMapper if semantic analysis is enabled
        this.tagSemanticMapper = (config.enhancedMapping.enableSemanticAnalysis && config.tagSemantics?.enabled) 
            ? new TagSemanticMapper(app, config as TagSemanticMapperConfig)
            : null;

        // Initialize FolderHierarchyMapper if folder hierarchy analysis is enabled
        this.folderHierarchyMapper = (config.folderHierarchy?.enabled) 
            ? new FolderHierarchyMapper()
            : null;

        logger.info('content-aware-mapper-init', 'ContentAwareMapper initialized', {
            availableInstruments: this.availableInstruments.size,
            configEnabled: config.contentAwareMapping.enabled,
            enhancedMappingEnabled: config.enhancedMapping?.analyzeImageMetadata || false,
            semanticAnalysisEnabled: !!this.tagSemanticMapper,
            folderHierarchyEnabled: !!this.folderHierarchyMapper
        });
    }

    /**
     * Analyze file characteristics using advanced content-aware techniques
     */
    async analyzeFileCharacteristics(node: EnhancedGraphNode): Promise<FileCharacteristics> {
        const startTime = performance.now();

        try {
            // Get the TFile object from the node
            const file = this.app.vault.getAbstractFileByPath(node.path);
            if (!file || !(file instanceof TFile)) {
                logger.warn('file-not-found', `File not found for analysis: ${node.path}`);
                return this.createDefaultCharacteristics(node);
            }

            // Delegate to FileTypeAnalyzer for detailed analysis
            const characteristics = await this.fileTypeAnalyzer.analyzeFile(file, node);
            
            const analysisTime = performance.now() - startTime;
            logger.debug('file-characteristics-analysis', `Analyzed characteristics for ${node.path}`, {
                analysisTime: analysisTime.toFixed(2) + 'ms',
                fileType: characteristics.fileType,
                complexity: characteristics.complexity,
                hasMetadata: characteristics.metadata.hasAdvancedMetadata
            });

            return characteristics;
        } catch (error) {
            logger.error('characteristics-analysis-error', `Failed to analyze ${node.path}`, { error: error.message });
            return this.createDefaultCharacteristics(node);
        }
    }

    /**
     * Select instrument based on file characteristics using intelligent mapping
     */
    selectInstrumentFromCharacteristics(characteristics: FileCharacteristics): InstrumentConfig {
        const startTime = performance.now();

        try {
            // Create selection criteria from characteristics
            const criteria: InstrumentSelectionCriteria = {
                fileType: characteristics.fileType,
                complexity: characteristics.complexity,
                size: characteristics.fileSize,
                structure: characteristics.structure,
                metadata: characteristics.metadata,
                relationships: characteristics.relationships,
                temporal: characteristics.temporal
            };

            // Use InstrumentSelector to get the best instrument
            const instrumentName = this.instrumentSelector.selectInstrument(criteria, this.config);

            // Get the instrument configuration
            const instrumentConfig = this.availableInstruments.get(instrumentName);
            if (!instrumentConfig) {
                logger.warn('instrument-not-found', `Instrument ${instrumentName} not found, using default`);
                return this.getDefaultInstrument();
            }

            const selectionTime = performance.now() - startTime;
            logger.debug('instrument-selection', `Selected ${instrumentName} for ${characteristics.fileType}`, {
                selectionTime: selectionTime.toFixed(2) + 'ms',
                complexity: characteristics.complexity,
                reasoning: `${characteristics.fileType} with complexity ${characteristics.complexity}`
            });

            return instrumentConfig;
        } catch (error) {
            logger.error('instrument-selection-error', 'Failed to select instrument', { error: error.message });
            return this.getDefaultInstrument();
        }
    }

    /**
     * Perform complete content-aware mapping analysis
     */
    async performContentAwareMapping(node: EnhancedGraphNode, context?: MusicalContext): Promise<ContentAwareMappingResult> {
        const cacheKey = `${node.path}-${node.modified}`;
        
        // Check cache first
        if (this.isMappingCached(cacheKey)) {
            logger.debug('cache-hit', `Using cached mapping for ${node.path}`);
            return this.mappingCache.get(cacheKey);
        }

        const overallStartTime = performance.now();
        const reasoning: string[] = [];

        try {
            // Step 1: Analyze file characteristics
            void reasoning.push('Analyzing file characteristics');
            const characteristics = await this.analyzeFileCharacteristics(node);

            // Step 2: Perform semantic analysis if enabled
            let semanticResult: SemanticMappingResult | null = null;
            if (this.tagSemanticMapper && this.config.enhancedMapping.weightings.semantics > 0) {
                void reasoning.push('Performing semantic tag analysis');
                semanticResult = this.tagSemanticMapper.performSemanticMapping(node, context);
            }

            // Step 3: Perform folder hierarchy analysis if enabled
            let folderResult: FolderCharacteristics | null = null;
            if (this.folderHierarchyMapper && this.config.folderHierarchy?.enabled) {
                void reasoning.push('Analyzing folder hierarchy and path mapping');
                folderResult = this.folderHierarchyMapper.analyzeFolderPath(node.path);
            }

            // Step 4: Combine all analysis results
            void reasoning.push('Combining content, semantic, and hierarchy analysis');
            const { finalInstrument, finalConfig, combinedConfidence, combinedProperties } = 
                void this.combineAllAnalysisResults(characteristics, semanticResult, folderResult, node, context);

            // Step 5: Generate fallbacks from combined analysis
            void reasoning.push('Generating fallback options');
            const fallbackInstruments = this.generateAllAnalysisFallbacks(characteristics, semanticResult, folderResult, finalInstrument);

            const analysisTime = performance.now() - overallStartTime;

            const result: ContentAwareMappingResult = {
                characteristics,
                musicalProperties: combinedProperties,
                selectedInstrument: finalInstrument,
                instrumentConfig: finalConfig,
                confidence: combinedConfidence,
                reasoning,
                fallbackInstruments,
                analysisTime
            };

            // Cache the result
            this.mappingCache.set(cacheKey, result);
            this.cacheTimestamps.set(cacheKey, Date.now());

            logger.debug('complete-content-mapping', `Content-aware mapping complete for ${node.path}`, {
                analysisTime: analysisTime.toFixed(2) + 'ms',
                selectedInstrument: finalInstrument,
                confidence: combinedConfidence.toFixed(2),
                fileType: characteristics.fileType,
                complexity: characteristics.complexity
            });

            return result;
        } catch (error) {
            logger.error('content-mapping-error', `Content-aware mapping failed for ${node.path}`, { error: error.message });
            return this.createFallbackMapping(node, overallStartTime);
        }
    }

    /**
     * Derive musical properties from file characteristics
     */
    private deriveMusicalProperties(characteristics: FileCharacteristics, node: EnhancedGraphNode): MusicalProperties {
        const properties: MusicalProperties = {
            pitchRange: this.derivePitchRange(characteristics),
            noteDuration: this.deriveNoteDuration(characteristics),
            velocity: this.deriveVelocity(characteristics),
            instrumentRichness: this.deriveInstrumentRichness(characteristics),
            spatialPosition: this.deriveSpatialPosition(characteristics, node),
            rhythmicComplexity: this.deriveRhythmicComplexity(characteristics),
            harmonicDensity: this.deriveHarmonicDensity(characteristics)
        };

        logger.debug('musical-properties-derived', 'Musical properties derived from characteristics', {
            pitchRange: properties.pitchRange,
            noteDuration: properties.noteDuration.toFixed(2),
            velocity: properties.velocity.toFixed(2),
            richness: properties.instrumentRichness.toFixed(2)
        });

        return properties;
    }

    /**
     * Derive pitch range from file characteristics
     * Maps file metadata to MIDI note range
     */
    private derivePitchRange(characteristics: FileCharacteristics): [number, number] {
        let baseNote = 60; // Middle C
        let range = 12; // One octave

        switch (characteristics.fileType) {
            case 'image': {
                // Image dimensions influence pitch range
                if (characteristics.metadata.imageMetadata) {
                    const { width, height } = characteristics.metadata.imageMetadata;
                    const aspectRatio = width / height;

                    if (aspectRatio > 1.5) { // Wide images
                        baseNote = 48; // Lower pitch
                        range = 24; // Wider range
                    } else if (aspectRatio < 0.7) { // Tall images
                        baseNote = 72; // Higher pitch
                        range = 18; // Medium range
                    }
                }
                break;
            }

            case 'audio':
            case 'video': {
                // Audio duration influences pitch range
                if (characteristics.metadata.mediaDuration) {
                    const minutes = characteristics.metadata.mediaDuration / 60;
                    if (minutes > 10) { // Long files
                        baseNote = 36; // Very low
                        range = 36; // Wide range
                    } else if (minutes < 1) { // Short files
                        baseNote = 84; // High pitch
                        range = 12; // Narrow range
                    }
                }
                break;
            }

            case 'document': {
                // PDF page count influences pitch
                if (characteristics.metadata.pageCount) {
                    const pages = characteristics.metadata.pageCount;
                    baseNote = Math.max(36, 72 - pages * 2); // More pages = lower pitch
                    range = Math.min(24, pages + 8); // More pages = wider range
                }
                break;
            }

            case 'text': {
                // Word count and heading structure influence pitch
                const wordCount = characteristics.metadata.wordCount || 0;
                const headingCount = characteristics.structure.headingCount || 0;
                
                if (wordCount > 2000) { // Long documents
                    baseNote = 48; // Lower
                    range = 24; // Wide
                } else if (headingCount > 5) { // Well-structured
                    baseNote = 60; // Medium
                    range = 18; // Medium-wide
                } else if (wordCount < 200) { // Short notes
                    baseNote = 72; // Higher
                    range = 12; // Narrow
                }
                break;
                }
        }

        // Apply complexity modifier
        const complexityModifier = (characteristics.complexity - 0.5) * 12; // ±6 semitones
        baseNote = Math.max(24, Math.min(84, baseNote + complexityModifier));

        return [baseNote, baseNote + range];
    }

    /**
     * Derive note duration from file characteristics
     */
    private deriveNoteDuration(characteristics: FileCharacteristics): number {
        let baseDuration = 1.0; // Base duration multiplier

        // File size influences duration
        const sizeMB = characteristics.fileSize / (1024 * 1024);
        if (sizeMB > 10) {
            baseDuration = 2.0; // Larger files = longer notes
        } else if (sizeMB < 0.1) {
            baseDuration = 0.3; // Small files = shorter notes
        }

        // File type specific adjustments
        switch (characteristics.fileType) {
            case 'audio':
            case 'video':
                if (characteristics.metadata.mediaDuration) {
                    const minutes = characteristics.metadata.mediaDuration / 60;
                    baseDuration *= Math.min(2.5, 0.5 + minutes * 0.2);
                }
                break;

            case 'document':
                if (characteristics.metadata.pageCount) {
                    baseDuration *= Math.min(2.0, 0.7 + characteristics.metadata.pageCount * 0.1);
                }
                break;

            case 'text': {
                const wordCount = characteristics.metadata.wordCount || 0;
                baseDuration *= Math.min(1.8, 0.4 + wordCount / 1000);
                break;
            }

            case 'image':
                // Images typically have shorter durations unless very complex
                baseDuration *= 0.6;
                if (characteristics.metadata.imageMetadata?.fileSize && characteristics.metadata.imageMetadata.fileSize > 1024 * 1024) {
                    baseDuration *= 1.4; // Large images get a bit longer
                }
                break;
        }

        // Complexity adjustment
        baseDuration *= (0.7 + characteristics.complexity * 0.6);

        return Math.max(0.1, Math.min(3.0, baseDuration));
    }

    /**
     * Derive velocity/intensity from file characteristics
     */
    private deriveVelocity(characteristics: FileCharacteristics): number {
        let velocity = 0.7; // Base velocity

        // Recent files are more "energetic"
        if (characteristics.temporal.daysSinceModified < 7) {
            velocity += 0.2;
        } else if (characteristics.temporal.daysSinceModified > 180) {
            velocity -= 0.2;
        }

        // Connection count influences intensity
        const connections = characteristics.relationships.connectionCount;
        if (connections > 10) {
            velocity += 0.15; // Well-connected files are more intense
        } else if (connections === 0) {
            velocity -= 0.2; // Isolated files are quieter
        }

        // File type adjustments
        switch (characteristics.fileType) {
            case 'audio':
            case 'video':
                velocity += 0.1; // Media files are naturally dynamic
                break;
            case 'image':
                velocity -= 0.05; // Images are more subtle
                break;
            case 'document':
                velocity += 0.05; // Documents are authoritative
                break;
        }

        // Complexity influences velocity
        velocity *= (0.6 + characteristics.complexity * 0.8);

        return Math.max(0.1, Math.min(1.0, velocity));
    }

    /**
     * Derive instrument richness from file characteristics
     */
    private deriveInstrumentRichness(characteristics: FileCharacteristics): number {
        let richness = characteristics.complexity; // Start with base complexity

        // Metadata richness contributes
        if (characteristics.metadata.hasAdvancedMetadata) {
            richness += 0.2;
        }

        // Structure complexity contributes
        if (characteristics.structure.hasComplexStructure) {
            richness += 0.15;
        }

        // File type adjustments
        switch (characteristics.fileType) {
            case 'audio':
            case 'video':
                richness += 0.15; // Media files are inherently rich
                break;
            case 'document':
                richness += 0.1; // Documents have structured richness
                break;
            case 'text': {
                // Text richness depends on content structure
                const wordCount = characteristics.metadata.wordCount || 0;
                if (wordCount > 1000) richness += 0.1;
                break;
            }
        }

        // Relationship richness
        if (characteristics.relationships.connectionCount > 5) {
            richness += 0.1;
        }

        return Math.max(0.0, Math.min(1.0, richness));
    }

    /**
     * Derive spatial position from file characteristics and node position
     */
    private deriveSpatialPosition(characteristics: FileCharacteristics, node: EnhancedGraphNode): { pan: number; reverb: number; delay: number } {
        let pan = 0; // Center by default
        let reverb = 0.3; // Base reverb
        let delay = 0.1; // Base delay

        // Folder depth influences spatial placement
        const depth = node.folderDepth;
        pan = Math.max(-0.8, Math.min(0.8, (depth - 3) * 0.2)); // Deeper = more to the right
        reverb = Math.min(0.7, 0.2 + depth * 0.05); // Deeper = more reverb

        // File age influences reverb (older = more reverberant)
        const age = characteristics.temporal.daysSinceModified;
        if (age > 30) {
            reverb += Math.min(0.3, age / 365 * 0.2);
        }

        // File size influences delay
        const sizeMB = characteristics.fileSize / (1024 * 1024);
        delay = Math.min(0.4, 0.05 + Math.log10(sizeMB + 1) * 0.1);

        // Connection count influences spatial spread
        const connections = characteristics.relationships.connectionCount;
        if (connections > 10) {
            // Well-connected files get wider spatial placement
            pan *= 1.2;
            reverb += 0.1;
        }

        return {
            pan: Math.max(-1, Math.min(1, pan)),
            reverb: Math.max(0, Math.min(1, reverb)),
            delay: Math.max(0, Math.min(0.5, delay))
        };
    }

    /**
     * Derive rhythmic complexity from file characteristics
     */
    private deriveRhythmicComplexity(characteristics: FileCharacteristics): number {
        let complexity = characteristics.structure.hasComplexStructure ? 0.7 : 0.3;

        // Heading structure influences rhythm
        const headingCount = characteristics.structure.headingCount || 0;
        if (headingCount > 0) {
            complexity += Math.min(0.3, headingCount / 10);
        }

        // Connection patterns influence rhythm
        const connections = characteristics.relationships.connectionCount;
        if (connections > 0) {
            complexity += Math.min(0.2, connections / 20);
        }

        // File type adjustments
        switch (characteristics.fileType) {
            case 'audio':
            case 'video':
                complexity += 0.2; // Media files have inherent rhythm
                break;
            case 'code':
                complexity += 0.15; // Code has structured rhythm
                break;
        }

        return Math.max(0.0, Math.min(1.0, complexity));
    }

    /**
     * Derive harmonic density from file characteristics
     */
    private deriveHarmonicDensity(characteristics: FileCharacteristics): number {
        let density = characteristics.complexity * 0.8;

        // Metadata richness contributes to harmonic density
        if (characteristics.metadata.hasAdvancedMetadata) {
            density += 0.2;
        }

        // Connection density influences harmony
        const connections = characteristics.relationships.connectionCount;
        if (connections > 5) {
            density += Math.min(0.3, connections / 15);
        }

        // File type influences harmonic approach
        switch (characteristics.fileType) {
            case 'text': {
                // Rich text content creates harmonic complexity
                const wordCount = characteristics.metadata.wordCount || 0;
                if (wordCount > 500) {
                    density += 0.1;
                }
                break;
            }
            case 'document':
                density += 0.1; // Documents tend to be harmonically rich
                break;
        }

        return Math.max(0.0, Math.min(1.0, density));
    }

    /**
     * Calculate confidence in the mapping result
     */
    private calculateMappingConfidence(
        characteristics: FileCharacteristics, 
        instrumentConfig: InstrumentConfig, 
        node: EnhancedGraphNode
    ): number {
        let confidence = 0.6; // Base confidence

        // Higher confidence for files with rich metadata
        if (characteristics.metadata.hasAdvancedMetadata) {
            confidence += 0.15;
        }

        // Higher confidence for well-structured files
        if (characteristics.structure.hasComplexStructure) {
            confidence += 0.1;
        }

        // Higher confidence for connected files
        if (characteristics.relationships.connectionCount > 0) {
            confidence += 0.1;
        }

        // Instrument category match confidence
        if (instrumentConfig.category && this.isInstrumentCategoryAppropriate(characteristics.fileType, instrumentConfig.category)) {
            confidence += 0.15;
        }

        // Recent files get higher confidence (user is actively working with them)
        if (characteristics.temporal.daysSinceModified < 7) {
            confidence += 0.05;
        }

        return Math.max(0.3, Math.min(1.0, confidence));
    }

    /**
     * Check if instrument category is appropriate for file type
     */
    private isInstrumentCategoryAppropriate(fileType: string, category: string): boolean {
        const appropriateMapping: Record<string, string[]> = {
            'image': ['strings', 'keyboard', 'woodwind'],
            'audio': ['electronic', 'keyboard', 'percussion'],
            'video': ['electronic', 'brass', 'percussion'],
            'document': ['brass', 'keyboard', 'strings'],
            'text': ['keyboard', 'strings', 'woodwind'],
            'code': ['electronic', 'keyboard'],
            'unknown': ['keyboard', 'electronic']
        };

        return appropriateMapping[fileType]?.includes(category) || false;
    }

    /**
     * Generate fallback instrument suggestions
     */
    private generateFallbackInstruments(characteristics: FileCharacteristics, primaryInstrument: string): string[] {
        const fallbacks: string[] = [];
        
        // Category-based fallbacks
        const categoryInstruments = getInstrumentsByCategory(this.getCategoryForFileType(characteristics.fileType));
        Object.keys(categoryInstruments).forEach(name => {
            if (name !== primaryInstrument && fallbacks.length < 3) {
                void fallbacks.push(name);
            }
        });

        // General fallbacks if we don't have enough
        const generalFallbacks = ['piano', 'electricPiano', 'violin', 'flute', 'pad'];
        generalFallbacks.forEach(name => {
            if (name !== primaryInstrument && !fallbacks.includes(name) && fallbacks.length < 3) {
                void fallbacks.push(name);
            }
        });

        return fallbacks;
    }

    /**
     * Get appropriate instrument category for file type
     */
    private getCategoryForFileType(fileType: string): string {
        const categoryMapping: Record<string, string> = {
            'image': 'strings',
            'audio': 'electronic',
            'video': 'electronic',
            'document': 'brass',
            'text': 'keyboard',
            'code': 'electronic',
            'unknown': 'keyboard'
        };

        return categoryMapping[fileType] || 'keyboard';
    }

    /**
     * Find instrument name by configuration object
     */
    private findInstrumentNameByConfig(config: InstrumentConfig): string {
        for (const [name, instrumentConfig] of this.availableInstruments.entries()) {
            if (instrumentConfig === config) {
                return name;
            }
        }
        return 'piano'; // Default fallback
    }

    /**
     * Create default characteristics for files that can't be analyzed
     */
    private createDefaultCharacteristics(node: EnhancedGraphNode): FileCharacteristics {
        const extension = node.path.split('.').pop()?.toLowerCase() || '';
        
        return {
            fileType: this.getFileTypeFromExtension(extension),
            fileSize: 1024, // Assume 1KB default
            complexity: 0.5,
            metadata: {
                hasAdvancedMetadata: false,
                wordCount: node.wordCount
            },
            structure: {
                hasComplexStructure: (node.headings?.length || 0) > 3,
                headingCount: node.headings?.length || 0,
                sectionCount: 1
            },
            relationships: {
                connectionCount: node.connectionCount,
                linkTypes: ['basic']
            },
            temporal: {
                daysSinceCreated: Math.floor((Date.now() - node.created) / (1000 * 60 * 60 * 24)),
                daysSinceModified: Math.floor((Date.now() - node.modified) / (1000 * 60 * 60 * 24))
            }
        };
    }

    /**
     * Get file type from extension
     */
    private getFileTypeFromExtension(extension: string): FileCharacteristics['fileType'] {
        const typeMap: Record<string, FileCharacteristics['fileType']> = {
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'svg': 'image', 'webp': 'image',
            'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'flac': 'audio', 'm4a': 'audio',
            'mp4': 'video', 'avi': 'video', 'mov': 'video', 'webm': 'video', 'mkv': 'video',
            'pdf': 'document', 'doc': 'document', 'docx': 'document', 'rtf': 'document',
            'md': 'text', 'txt': 'text',
            'js': 'code', 'ts': 'code', 'py': 'code', 'java': 'code', 'cpp': 'code', 'html': 'code', 'css': 'code'
        };

        return typeMap[extension] || 'unknown';
    }

    /**
     * Create fallback mapping for error cases
     */
    private createFallbackMapping(node: EnhancedGraphNode, startTime: number): ContentAwareMappingResult {
        const characteristics = this.createDefaultCharacteristics(node);
        const instrumentConfig = this.getDefaultInstrument();
        
        return {
            characteristics,
            musicalProperties: {
                pitchRange: [60, 72],
                noteDuration: 1.0,
                velocity: 0.7,
                instrumentRichness: 0.5,
                spatialPosition: { pan: 0, reverb: 0.3, delay: 0.1 },
                rhythmicComplexity: 0.3,
                harmonicDensity: 0.4
            },
            selectedInstrument: 'piano',
            instrumentConfig,
            confidence: 0.3,
            reasoning: ['Fallback mapping due to analysis error'],
            fallbackInstruments: ['electricPiano', 'violin', 'flute'],
            analysisTime: performance.now() - startTime
        };
    }

    /**
     * Get default instrument configuration
     */
    private getDefaultInstrument(): InstrumentConfig {
        return this.availableInstruments.get('piano') || {
            urls: {},
            release: 1.0,
            baseUrl: '',
            effects: ['reverb'],
            category: 'keyboard'
        };
    }

    /**
     * Check if mapping is cached and still valid
     */
    private isMappingCached(cacheKey: string): boolean {
        if (!this.mappingCache.has(cacheKey) || !this.cacheTimestamps.has(cacheKey)) {
            return false;
        }

        const timestamp = this.cacheTimestamps.get(cacheKey);
        return (Date.now() - timestamp) < this.CACHE_TTL;
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; avgAnalysisTime: number; hitRate: number } {
        const results = Array.from(this.mappingCache.values());
        const avgAnalysisTime = results.length > 0 
            ? results.reduce((sum, r) => sum + r.analysisTime, 0) / results.length 
            : 0;

        return {
            size: this.mappingCache.size,
            avgAnalysisTime,
            hitRate: 0 // Would need to track hits/misses to calculate
        };
    }

    /**
     * Combine content-aware and semantic analysis results - Phase 4.2 Integration
     */
    private combineAnalysisResults(
        characteristics: FileCharacteristics,
        semanticResult: SemanticMappingResult | null,
        node: EnhancedGraphNode,
        _context?: MusicalContext
    ): {
        finalInstrument: string;
        finalConfig: InstrumentConfig;
        combinedConfidence: number;
        combinedProperties: MusicalProperties;
    } {
        // If no semantic analysis, fall back to content-aware only
        if (!semanticResult) {
            const contentProperties = this.deriveMusicalProperties(characteristics, node);
            const contentInstrument = this.selectInstrumentFromCharacteristicsSync(characteristics);
            const contentConfig = this.availableInstruments.get(contentInstrument) || this.getDefaultInstrument();
            const contentConfidence = this.calculateMappingConfidence(characteristics, contentConfig, node);

            return {
                finalInstrument: contentInstrument,
                finalConfig: contentConfig,
                combinedConfidence: contentConfidence,
                combinedProperties: contentProperties
            };
        }

        // Combine both analyses using weighted approach
        const contentWeight = 1 - this.config.enhancedMapping.weightings.semantics;
        const semanticWeight = this.config.enhancedMapping.weightings.semantics;

        // Determine final instrument selection based on confidence and weights
        let finalInstrument: string;
        let finalConfig: InstrumentConfig;
        let combinedConfidence: number;

        const contentInstrument = this.selectInstrumentFromCharacteristicsSync(characteristics);
        const contentConfig = this.availableInstruments.get(contentInstrument) || this.getDefaultInstrument();
        const contentConfidence = this.calculateMappingConfidence(characteristics, contentConfig, node);

        // Choose instrument based on weighted confidence
        const weightedContentConfidence = contentConfidence * contentWeight;
        const weightedSemanticConfidence = semanticResult.confidence * semanticWeight;

        if (weightedSemanticConfidence > weightedContentConfidence) {
            finalInstrument = semanticResult.selectedInstrument;
            finalConfig = semanticResult.instrumentConfig;
            combinedConfidence = (semanticResult.confidence * semanticWeight) + (contentConfidence * contentWeight);
        } else {
            finalInstrument = contentInstrument;
            finalConfig = contentConfig;
            combinedConfidence = (contentConfidence * contentWeight) + (semanticResult.confidence * semanticWeight);
        }

        // Combine musical properties
        const contentProperties = this.deriveMusicalProperties(characteristics, node);
        const combinedProperties = this.combineMusicalProperties(contentProperties, semanticResult.musicalProperties, semanticWeight);

        logger.debug('combined-analysis', `Combined content and semantic analysis for ${node.path}`, {
            contentInstrument,
            semanticInstrument: semanticResult.selectedInstrument,
            finalInstrument,
            contentConfidence: contentConfidence.toFixed(2),
            semanticConfidence: semanticResult.confidence.toFixed(2),
            combinedConfidence: combinedConfidence.toFixed(2),
            contentWeight,
            semanticWeight
        });

        return {
            finalInstrument,
            finalConfig,
            combinedConfidence: Math.max(0.3, Math.min(1.0, combinedConfidence)),
            combinedProperties
        };
    }

    /**
     * Combine musical properties from content and semantic analysis
     */
    private combineMusicalProperties(
        contentProperties: MusicalProperties,
        semanticProperties: MusicalProperties,
        semanticWeight: number
    ): MusicalProperties {
        const contentWeight = 1 - semanticWeight;

        // Blend numerical properties
        const blendedPitchRange: [number, number] = [
            Math.round(contentProperties.pitchRange[0] * contentWeight + semanticProperties.pitchRange[0] * semanticWeight),
            Math.round(contentProperties.pitchRange[1] * contentWeight + semanticProperties.pitchRange[1] * semanticWeight)
        ];

        const blendedProperties: MusicalProperties = {
            pitchRange: blendedPitchRange,
            noteDuration: contentProperties.noteDuration * contentWeight + semanticProperties.noteDuration * semanticWeight,
            velocity: contentProperties.velocity * contentWeight + semanticProperties.velocity * semanticWeight,
            instrumentRichness: contentProperties.instrumentRichness * contentWeight + semanticProperties.instrumentRichness * semanticWeight,
            spatialPosition: {
                pan: contentProperties.spatialPosition.pan * contentWeight + semanticProperties.spatialPosition.pan * semanticWeight,
                reverb: contentProperties.spatialPosition.reverb * contentWeight + semanticProperties.spatialPosition.reverb * semanticWeight,
                delay: contentProperties.spatialPosition.delay * contentWeight + semanticProperties.spatialPosition.delay * semanticWeight
            },
            rhythmicComplexity: contentProperties.rhythmicComplexity * contentWeight + semanticProperties.rhythmicComplexity * semanticWeight,
            harmonicDensity: contentProperties.harmonicDensity * contentWeight + semanticProperties.harmonicDensity * semanticWeight
        };

        // Clamp all values to appropriate ranges
        return {
            pitchRange: blendedPitchRange,
            noteDuration: Math.max(0.1, Math.min(3.0, blendedProperties.noteDuration)),
            velocity: Math.max(0.1, Math.min(1.0, blendedProperties.velocity)),
            instrumentRichness: Math.max(0.0, Math.min(1.0, blendedProperties.instrumentRichness)),
            spatialPosition: {
                pan: Math.max(-1, Math.min(1, blendedProperties.spatialPosition.pan)),
                reverb: Math.max(0, Math.min(1, blendedProperties.spatialPosition.reverb)),
                delay: Math.max(0, Math.min(0.5, blendedProperties.spatialPosition.delay))
            },
            rhythmicComplexity: Math.max(0.0, Math.min(1.0, blendedProperties.rhythmicComplexity)),
            harmonicDensity: Math.max(0.0, Math.min(1.0, blendedProperties.harmonicDensity))
        };
    }

    /**
     * Synchronous version of instrument selection for internal use
     */
    private selectInstrumentFromCharacteristicsSync(characteristics: FileCharacteristics): string {
        // Simplified synchronous selection based on file type
        const categoryMapping: Record<string, string> = {
            'image': 'violin',
            'audio': 'leadSynth',
            'video': 'synthBrass',
            'document': 'electricPiano',
            'text': 'piano',
            'code': 'leadSynth',
            'unknown': 'piano'
        };

        return categoryMapping[characteristics.fileType] || 'piano';
    }

    /**
     * Generate combined fallback instruments from both analyses
     */
    private generateCombinedFallbacks(
        characteristics: FileCharacteristics,
        semanticResult: SemanticMappingResult | null,
        primaryInstrument: string
    ): string[] {
        const fallbacks = new Set<string>();

        // Add content-aware fallbacks
        const contentFallbacks = this.generateFallbackInstruments(characteristics, primaryInstrument);
        contentFallbacks.forEach(instrument => fallbacks.add(instrument));

        // Add semantic fallbacks if available
        if (semanticResult) {
            semanticResult.alternativeInstruments.forEach(instrument => fallbacks.add(instrument));
        }

        // Remove primary instrument and convert to array
        void fallbacks.delete(primaryInstrument);
        
        // Return up to 5 fallbacks
        return Array.from(fallbacks).slice(0, 5);
    }

    /**
     * Update configuration including TagSemanticMapper
     */
    updateConfig(config: ContentAwareMappingConfig): void {
        this.config = config;
        
        // Update sub-components
        this.instrumentSelector.updateConfig(config);
        
        // Update or initialize TagSemanticMapper based on new config
        if (config.enhancedMapping.enableSemanticAnalysis && config.tagSemantics?.enabled) {
            if (this.tagSemanticMapper) {
                this.tagSemanticMapper.updateConfig(config as TagSemanticMapperConfig);
            } else {
                this.tagSemanticMapper = new TagSemanticMapper(this.app, config as TagSemanticMapperConfig);
            }
        } else {
            this.tagSemanticMapper = null;
        }

        // Update or initialize FolderHierarchyMapper based on new config
        if (config.folderHierarchy?.enabled) {
            if (!this.folderHierarchyMapper) {
                this.folderHierarchyMapper = new FolderHierarchyMapper();
            }
        } else {
            this.folderHierarchyMapper = null;
        }
        
        // Clear cache when configuration changes
        this.mappingCache.clear();
        this.cacheTimestamps.clear();
        
        logger.info('content-aware-config-update', 'Configuration updated, cache cleared', {
            semanticAnalysisEnabled: !!this.tagSemanticMapper,
            folderHierarchyEnabled: !!this.folderHierarchyMapper
        });
    }

    /**
     * Clear all caches including TagSemanticMapper
     */
    clearCaches(): void {
        this.mappingCache.clear();
        this.cacheTimestamps.clear();
        this.fileTypeAnalyzer.clearCaches();
        this.instrumentSelector.clearCaches();
        
        if (this.tagSemanticMapper) {
            this.tagSemanticMapper.clearCaches();
        }

        // FolderHierarchyMapper doesn't have internal caches
        
        void logger.info('content-aware-cache-clear', 'All caches cleared');
    }

    /**
     * Create FolderHierarchyConfig from ContentAwareMappingConfig
     */
    private createFolderHierarchyConfig(config: ContentAwareMappingConfig): Record<string, unknown> {
        const folderConfig = config.folderHierarchy;
        
        return {
            enableDepthMapping: folderConfig?.enabled || false,
            enableThematicMapping: folderConfig?.enabled || false,
            depthInfluenceWeight: folderConfig?.weightings?.pathDepth || 0.7,
            thematicInfluenceWeight: folderConfig?.weightings?.thematicMapping || 0.8,
            maxDepthConsideration: folderConfig?.maxDepthConsideration || 6,
            customFolderMappings: {},
            pitchDepthSensitivity: folderConfig?.pitchDepthSensitivity || 1.0,
            timbreDepthSensitivity: folderConfig?.timbreDepthSensitivity || 1.0
        };
    }

    /**
     * Combine content-aware, semantic, and folder hierarchy analysis results
     */
    private combineAllAnalysisResults(
        characteristics: FileCharacteristics,
        semanticResult: SemanticMappingResult | null,
        folderResult: FolderCharacteristics | null,
        node: EnhancedGraphNode,
        _context?: MusicalContext
    ): {
        finalInstrument: string;
        finalConfig: InstrumentConfig;
        combinedConfidence: number;
        combinedProperties: MusicalProperties;
    } {
        // Get weights for each analysis type
        const contentWeight = 1 - (this.config.enhancedMapping.weightings?.semantics || 0) - (this.config.folderHierarchy?.weightings?.instrumentFamily || 0);
        const semanticWeight = this.config.enhancedMapping.weightings?.semantics || 0;
        const folderWeight = this.config.folderHierarchy?.weightings?.instrumentFamily || 0;

        // Normalize weights so they sum to 1.0
        const totalWeight = contentWeight + semanticWeight + folderWeight;
        const normalizedContentWeight = totalWeight > 0 ? contentWeight / totalWeight : 0.33;
        const normalizedSemanticWeight = totalWeight > 0 ? semanticWeight / totalWeight : 0.33;
        const normalizedFolderWeight = totalWeight > 0 ? folderWeight / totalWeight : 0.33;

        // Get content-based analysis
        const contentInstrument = this.selectInstrumentFromCharacteristicsSync(characteristics);
        const contentConfig = this.availableInstruments.get(contentInstrument) || this.getDefaultInstrument();
        const contentConfidence = this.calculateMappingConfidence(characteristics, contentConfig, node);
        const contentProperties = this.deriveMusicalProperties(characteristics, node);

        // Prepare candidate instruments with their weights
        const candidateInstruments: Array<{
            instrument: string;
            config: InstrumentConfig;
            confidence: number;
            weight: number;
            properties: MusicalProperties;
        }> = [];

        // Add content-based candidate
        candidateInstruments.push({
            instrument: contentInstrument,
            config: contentConfig,
            confidence: contentConfidence,
            weight: normalizedContentWeight,
            properties: contentProperties
        });

        // Add semantic-based candidate if available
        if (semanticResult) {
            candidateInstruments.push({
                instrument: semanticResult.selectedInstrument,
                config: semanticResult.instrumentConfig,
                confidence: semanticResult.confidence,
                weight: normalizedSemanticWeight,
                properties: semanticResult.musicalProperties
            });
        }

        // Add folder hierarchy candidate if available
        if (folderResult && folderResult.primaryFamily && this.folderHierarchyMapper) {
            const folderInstrument = this.folderHierarchyMapper.selectInstrumentFromFamily(
                folderResult.primaryFamily,
                folderResult
            );
            const folderConfig = this.availableInstruments.get(folderInstrument) || this.getDefaultInstrument();
            const folderProperties = this.applyFolderModificationsToProperties(contentProperties, folderResult);
            
            candidateInstruments.push({
                instrument: folderInstrument,
                config: folderConfig,
                confidence: 0.75 + (folderResult.complexity * 0.25), // Derive confidence from complexity
                weight: normalizedFolderWeight,
                properties: folderProperties
            });
        }

        // Select best candidate based on weighted confidence
        let bestCandidate = candidateInstruments[0];
        let bestWeightedConfidence = candidateInstruments[0].confidence * candidateInstruments[0].weight;

        for (const candidate of candidateInstruments) {
            const weightedConfidence = candidate.confidence * candidate.weight;
            if (weightedConfidence > bestWeightedConfidence) {
                bestCandidate = candidate;
                bestWeightedConfidence = weightedConfidence;
            }
        }

        // Combine musical properties with weights
        const combinedProperties = this.combineMultipleMusicalProperties(
            candidateInstruments.map(c => ({ properties: c.properties, weight: c.weight }))
        );

        // Calculate final confidence as weighted average
        const combinedConfidence = candidateInstruments.reduce((sum, candidate) => 
            sum + (candidate.confidence * candidate.weight), 0
        );

        logger.debug('combined-all-analysis', `Combined all analysis types for ${node.path}`, {
            contentInstrument,
            semanticInstrument: semanticResult?.selectedInstrument || 'none',
            folderInstrument: folderResult && this.folderHierarchyMapper ? 
                this.folderHierarchyMapper.selectInstrumentFromFamily(folderResult.primaryFamily, folderResult) : 'none',
            finalInstrument: bestCandidate.instrument,
            contentWeight: normalizedContentWeight.toFixed(2),
            semanticWeight: normalizedSemanticWeight.toFixed(2),
            folderWeight: normalizedFolderWeight.toFixed(2),
            finalConfidence: combinedConfidence.toFixed(2)
        });

        return {
            finalInstrument: bestCandidate.instrument,
            finalConfig: bestCandidate.config,
            combinedConfidence: Math.max(0.3, Math.min(1.0, combinedConfidence)),
            combinedProperties
        };
    }

    /**
     * Select an instrument from a specific family
     */
    private selectInstrumentFromFamily(family: string): string {
        const familyInstruments = getInstrumentsByCategory(family);
        const instrumentNames = Object.keys(familyInstruments);
        
        if (instrumentNames.length === 0) {
            return 'piano'; // Fallback
        }

        // Return first available instrument from family
        return instrumentNames[0];
    }

    /**
     * Apply folder hierarchy modifications to musical properties
     */
    private applyFolderModificationsToProperties(
        baseProperties: MusicalProperties,
        folderResult: FolderCharacteristics
    ): MusicalProperties {
        const { musicalProperties } = folderResult;

        // Apply pitch modifications based on pitchModifier (-1 to 1)
        const pitchOffset = Math.round(musicalProperties.pitchModifier * 12); // Convert to semitones
        const modifiedPitchRange: [number, number] = [
            Math.max(21, Math.min(108, baseProperties.pitchRange[0] + pitchOffset)),
            Math.max(21, Math.min(108, baseProperties.pitchRange[1] + pitchOffset))
        ];

        return {
            pitchRange: modifiedPitchRange,
            noteDuration: baseProperties.noteDuration * musicalProperties.noteDurationMultiplier,
            velocity: baseProperties.velocity * musicalProperties.velocityModifier,
            instrumentRichness: Math.max(0, Math.min(1, baseProperties.instrumentRichness * musicalProperties.timbreRichness)),
            spatialPosition: {
                pan: baseProperties.spatialPosition.pan,
                reverb: Math.max(0, Math.min(1, baseProperties.spatialPosition.reverb + musicalProperties.spatialDepth * 0.3)),
                delay: Math.max(0, Math.min(1, baseProperties.spatialPosition.delay + musicalProperties.spatialDepth * 0.2))
            },
            rhythmicComplexity: baseProperties.rhythmicComplexity,
            harmonicDensity: baseProperties.harmonicDensity
        };
    }

    /**
     * Combine multiple musical properties with weights
     */
    private combineMultipleMusicalProperties(
        propertiesWithWeights: Array<{ properties: MusicalProperties; weight: number }>
    ): MusicalProperties {
        if (propertiesWithWeights.length === 0) {
            // Return default properties
            return {
                pitchRange: [60, 72],
                noteDuration: 1.0,
                velocity: 0.7,
                instrumentRichness: 0.5,
                spatialPosition: { pan: 0, reverb: 0.3, delay: 0.1 },
                rhythmicComplexity: 0.3,
                harmonicDensity: 0.4
            };
        }

        if (propertiesWithWeights.length === 1) {
            return propertiesWithWeights[0].properties;
        }

        // Normalize weights
        const totalWeight = propertiesWithWeights.reduce((sum, item) => sum + item.weight, 0);
        const normalizedItems = propertiesWithWeights.map(item => ({
            properties: item.properties,
            weight: totalWeight > 0 ? item.weight / totalWeight : 1 / propertiesWithWeights.length
        }));

        // Blend properties
        const blended: MusicalProperties = {
            pitchRange: [0, 0],
            noteDuration: 0,
            velocity: 0,
            instrumentRichness: 0,
            spatialPosition: { pan: 0, reverb: 0, delay: 0 },
            rhythmicComplexity: 0,
            harmonicDensity: 0
        };

        // Weighted average for numerical properties
        for (const item of normalizedItems) {
            const props = item.properties;
            const weight = item.weight;

            blended.pitchRange[0] += props.pitchRange[0] * weight;
            blended.pitchRange[1] += props.pitchRange[1] * weight;
            blended.noteDuration += props.noteDuration * weight;
            blended.velocity += props.velocity * weight;
            blended.instrumentRichness += props.instrumentRichness * weight;
            blended.spatialPosition.pan += props.spatialPosition.pan * weight;
            blended.spatialPosition.reverb += props.spatialPosition.reverb * weight;
            blended.spatialPosition.delay += props.spatialPosition.delay * weight;
            blended.rhythmicComplexity += props.rhythmicComplexity * weight;
            blended.harmonicDensity += props.harmonicDensity * weight;
        }

        // Clamp values to appropriate ranges
        return {
            pitchRange: [
                Math.round(Math.max(21, Math.min(108, blended.pitchRange[0]))),
                Math.round(Math.max(21, Math.min(108, blended.pitchRange[1])))
            ],
            noteDuration: Math.max(0.1, Math.min(5.0, blended.noteDuration)),
            velocity: Math.max(0.1, Math.min(1.0, blended.velocity)),
            instrumentRichness: Math.max(0.0, Math.min(1.0, blended.instrumentRichness)),
            spatialPosition: {
                pan: Math.max(-1, Math.min(1, blended.spatialPosition.pan)),
                reverb: Math.max(0, Math.min(1, blended.spatialPosition.reverb)),
                delay: Math.max(0, Math.min(0.5, blended.spatialPosition.delay))
            },
            rhythmicComplexity: Math.max(0.0, Math.min(1.0, blended.rhythmicComplexity)),
            harmonicDensity: Math.max(0.0, Math.min(1.0, blended.harmonicDensity))
        };
    }

    /**
     * Generate fallbacks from all analysis types
     */
    private generateAllAnalysisFallbacks(
        characteristics: FileCharacteristics,
        semanticResult: SemanticMappingResult | null,
        folderResult: FolderCharacteristics | null,
        primaryInstrument: string
    ): string[] {
        const fallbacks = new Set<string>();

        // Add content-aware fallbacks
        const contentFallbacks = this.generateFallbackInstruments(characteristics, primaryInstrument);
        contentFallbacks.forEach(instrument => fallbacks.add(instrument));

        // Add semantic fallbacks if available
        if (semanticResult) {
            semanticResult.alternativeInstruments.forEach(instrument => fallbacks.add(instrument));
        }

        // Add folder hierarchy fallbacks if available
        if (folderResult && folderResult.primaryFamily) {
            const familyInstruments = getInstrumentsByCategory(folderResult.primaryFamily.category);
            Object.keys(familyInstruments).slice(0, 3).forEach(instrument => fallbacks.add(instrument));
        }

        // Remove primary instrument and convert to array
        void fallbacks.delete(primaryInstrument);
        
        // Return up to 5 fallbacks
        return Array.from(fallbacks).slice(0, 5);
    }

    /**
     * Integrated testing method for ContentAwareMapper with Phase 4.3 components
     * Tests the complete content-aware mapping pipeline including folder hierarchy integration
     */
    async runTests(): Promise<void> {
        logger.info('test', '=== ContentAwareMapper Integrated Testing (Phase 4.3) ===');
        
        // Create mock enhanced graph nodes for testing
        const testNodes: EnhancedGraphNode[] = [
            {
                id: 'project-note',
                path: 'Projects/Active Work/Phase4 Development/implementation-notes.md',
                name: 'implementation-notes.md',
                connections: ['note1', 'note2'],
                created: Date.now() - 86400000, // 1 day ago
                modified: Date.now() - 3600000,  // 1 hour ago
                wordCount: 500,
                connectionCount: 8,
                headings: ['Introduction', 'Technical Details', 'Next Steps'],
                tags: ['development', 'phase4', 'urgent'],
                folderDepth: 3,
                pathComponents: ['Projects', 'Active Work', 'Phase4 Development', 'implementation-notes.md'],
                metadata: {
                    tags: ['development', 'phase4', 'urgent'],
                    frontmatter: {},
                    wordCount: 500,
                    headingCount: 3
                },
                connectionDetails: {
                    wikilinks: ['note1', 'note2'],
                    markdownLinks: [],
                    embeds: [],
                    tagConnections: ['development', 'phase4'],
                    totalCount: 8
                }
            },
            {
                id: 'journal-entry',
                path: 'Journal/Personal/2024/January/reflection-on-progress.md',
                name: 'reflection-on-progress.md',
                connections: ['thought1'],
                created: Date.now() - 172800000, // 2 days ago
                modified: Date.now() - 86400000,  // 1 day ago
                wordCount: 300,
                connectionCount: 2,
                headings: ['Morning Thoughts'],
                tags: ['personal', 'reflection'],
                folderDepth: 4,
                pathComponents: ['Journal', 'Personal', '2024', 'January', 'reflection-on-progress.md'],
                metadata: {
                    tags: ['personal', 'reflection'],
                    frontmatter: {},
                    wordCount: 300,
                    headingCount: 1
                },
                connectionDetails: {
                    wikilinks: ['thought1'],
                    markdownLinks: [],
                    embeds: [],
                    tagConnections: ['personal', 'reflection'],
                    totalCount: 2
                }
            },
            {
                id: 'research-paper',
                path: 'Research/AI/Audio Processing/transformer-architectures.pdf',
                name: 'transformer-architectures.pdf',
                connections: ['paper1', 'paper2', 'paper3'],
                created: Date.now() - 604800000, // 1 week ago
                modified: Date.now() - 604800000,
                wordCount: 0,
                connectionCount: 15,
                headings: [],
                tags: ['ai', 'research', 'transformers'],
                folderDepth: 3,
                pathComponents: ['Research', 'AI', 'Audio Processing', 'transformer-architectures.pdf'],
                metadata: {
                    tags: ['ai', 'research', 'transformers'],
                    frontmatter: {},
                    wordCount: 0,
                    headingCount: 0
                },
                connectionDetails: {
                    wikilinks: ['paper1', 'paper2'],
                    markdownLinks: [],
                    embeds: ['paper3'],
                    tagConnections: ['ai', 'research'],
                    totalCount: 15
                }
            },
            {
                id: 'archive-code',
                path: 'Archive/Old Projects/2023/Web App/deprecated-functions.js',
                name: 'deprecated-functions.js',
                connections: ['legacy1'],
                created: Date.now() - 31536000000, // 1 year ago
                modified: Date.now() - 15768000000, // 6 months ago
                wordCount: 0,
                connectionCount: 1,
                headings: [],
                tags: ['archive', 'deprecated', 'javascript'],
                folderDepth: 4,
                pathComponents: ['Archive', 'Old Projects', '2023', 'Web App', 'deprecated-functions.js'],
                metadata: {
                    tags: ['archive', 'deprecated', 'javascript'],
                    frontmatter: {},
                    wordCount: 0,
                    headingCount: 0
                },
                connectionDetails: {
                    wikilinks: ['legacy1'],
                    markdownLinks: [],
                    embeds: [],
                    tagConnections: ['archive'],
                    totalCount: 1
                }
            },
            {
                id: 'creative-ideas',
                path: 'Ideas/Story Concepts/sci-fi-worldbuilding.md',
                name: 'sci-fi-worldbuilding.md',
                connections: ['concept1', 'concept2'],
                created: Date.now() - 259200000, // 3 days ago
                modified: Date.now() - 172800000, // 2 days ago
                wordCount: 750,
                connectionCount: 5,
                headings: ['World Overview', 'Characters', 'Plot Points'],
                tags: ['creative', 'sci-fi', 'worldbuilding'],
                folderDepth: 2,
                pathComponents: ['Ideas', 'Story Concepts', 'sci-fi-worldbuilding.md'],
                metadata: {
                    tags: ['creative', 'sci-fi', 'worldbuilding'],
                    frontmatter: {},
                    wordCount: 750,
                    headingCount: 3
                },
                connectionDetails: {
                    wikilinks: ['concept1', 'concept2'],
                    markdownLinks: [],
                    embeds: [],
                    tagConnections: ['creative', 'sci-fi'],
                    totalCount: 5
                }
            },
            {
                id: 'root-file',
                path: 'quick-notes.md',
                name: 'quick-notes.md',
                connections: [],
                created: Date.now() - 3600000, // 1 hour ago
                modified: Date.now() - 1800000,  // 30 minutes ago
                wordCount: 100,
                connectionCount: 0,
                headings: [],
                tags: ['quick', 'notes'],
                folderDepth: 0,
                pathComponents: ['quick-notes.md'],
                metadata: {
                    tags: ['quick', 'notes'],
                    frontmatter: {},
                    wordCount: 100,
                    headingCount: 0
                },
                connectionDetails: {
                    wikilinks: [],
                    markdownLinks: [],
                    embeds: [],
                    tagConnections: ['quick', 'notes'],
                    totalCount: 0
                }
            }
        ];

        let testsRun = 0;
        let testsPassed = 0;
        const testResults: Array<{
            nodeId: string;
            path: string;
            passed: boolean;
            details: Record<string, unknown>;
            error?: string;
        }> = [];

        // Test each node through the complete mapping pipeline
        for (const node of testNodes) {
            testsRun++;
            logger.info('test', `--- Testing Node: ${node.id} ---`);
            logger.info('test', `Path: ${node.path}`);
            
            try {
                const startTime = performance.now();
                const mappingResult = await this.performContentAwareMapping(node);
                const analysisTime = performance.now() - startTime;
                
                // Validate the complete mapping result
                const validationResults = this.validateContentAwareMappingResult(mappingResult, node);
                
                if (validationResults.isValid) {
                    testsPassed++;
                    logger.info('test', `✅ PASS - Complete mapping in ${analysisTime.toFixed(2)}ms`);
                } else {
                    logger.error('test', `❌ FAIL - Validation errors: ${validationResults.errors.join(', ')}`);
                }

                // Log detailed results including Phase 4.3 folder hierarchy integration
                logger.info('test', `   🎵 Selected Instrument: ${mappingResult.selectedInstrument}`);
                logger.info('test', `   📊 Confidence: ${(mappingResult.confidence * 100).toFixed(1)}%`);
                logger.info('test', `   📁 File Type: ${mappingResult.characteristics.fileType}`);
                logger.info('test', `   🎯 Complexity: ${(mappingResult.characteristics.complexity * 100).toFixed(1)}%`);
                logger.info('test', `   🎼 Pitch Range: ${mappingResult.musicalProperties.pitchRange[0]}-${mappingResult.musicalProperties.pitchRange[1]} MIDI`);
                logger.info('test', `   🕰️ Duration Multiplier: ${mappingResult.musicalProperties.noteDuration.toFixed(2)}x`);
                logger.info('test', `   🔊 Velocity: ${(mappingResult.musicalProperties.velocity * 100).toFixed(1)}%`);
                logger.info('test', `   ✨ Richness: ${(mappingResult.musicalProperties.instrumentRichness * 100).toFixed(1)}%`);
                logger.info('test', `   🎚️ Pan: ${mappingResult.musicalProperties.spatialPosition.pan.toFixed(2)}`);
                logger.info('test', `   🏗️ Fallbacks: [${mappingResult.fallbackInstruments.join(', ')}]`);
                
                testResults.push({
                    nodeId: node.id,
                    path: node.path,
                    passed: validationResults.isValid,
                    details: {
                        selectedInstrument: mappingResult.selectedInstrument,
                        confidence: (mappingResult.confidence * 100).toFixed(1) + '%',
                        fileType: mappingResult.characteristics.fileType,
                        complexity: (mappingResult.characteristics.complexity * 100).toFixed(1) + '%',
                        analysisTime: analysisTime.toFixed(2) + 'ms',
                        pitchRange: `${mappingResult.musicalProperties.pitchRange[0]}-${mappingResult.musicalProperties.pitchRange[1]}`,
                        fallbackCount: mappingResult.fallbackInstruments.length
                    },
                    error: validationResults.isValid ? undefined : validationResults.errors.join('; ')
                });
                
            } catch (error) {
                logger.error('test', `❌ FAIL - Exception: ${error.message}`);
                testResults.push({
                    nodeId: node.id,
                    path: node.path,
                    passed: false,
                    details: {},
                    error: error.message
                });
            }
        }

        // Test Phase 4.3 folder hierarchy integration specifically
        void logger.info('test', '--- Testing Phase 4.3 Folder Hierarchy Integration ---');
        if (this.folderHierarchyMapper) {
            testsRun++;
            try {
                const testPath = 'Projects/Complex/Nested/Structure/test-file.md';
                const folderCharacteristics = this.folderHierarchyMapper.analyzeFolderPath(testPath);

                void logger.info('test', `✅ Folder hierarchy analysis successful`);
                logger.info('test', `   📁 Instrument Family: ${folderCharacteristics.primaryFamily.name}`);
                logger.info('test', `   🎯 Semantic Category: ${folderCharacteristics.semanticCategory}`);
                logger.info('test', `   📊 Complexity: ${(folderCharacteristics.complexity * 100).toFixed(1)}%`);
                logger.info('test', `   🎼 Pitch Modifier: ${folderCharacteristics.musicalProperties.pitchModifier.toFixed(2)}`);
                logger.info('test', `   🎶 Note Duration: ${folderCharacteristics.musicalProperties.noteDurationMultiplier.toFixed(2)}x`);

                testsPassed++;
            } catch (error) {
                logger.error('test', `❌ Folder hierarchy integration failed: ${error.message}`);
            }
        } else {
            void logger.warn('test', '⚠️ Folder hierarchy mapping disabled in configuration');
        }

        // Test tag semantic integration (Phase 4.2)
        void logger.info('test', '--- Testing Phase 4.2 Tag Semantic Integration ---');
        if (this.tagSemanticMapper) {
            testsRun++;
            try {
                const semanticResult = this.tagSemanticMapper.performSemanticMapping(testNodes[0]);

                void logger.info('test', `✅ Tag semantic analysis successful`);
                logger.info('test', `   🎵 Selected Instrument: ${semanticResult.selectedInstrument}`);
                logger.info('test', `   📊 Confidence: ${(semanticResult.confidence * 100).toFixed(1)}%`);
                logger.info('test', `   🏗️ Alternative Instruments: [${semanticResult.alternativeInstruments.join(', ')}]`);

                testsPassed++;
            } catch (error) {
                logger.error('test', `❌ Tag semantic integration failed: ${error.message}`);
            }
        } else {
            void logger.warn('test', '⚠️ Tag semantic mapping disabled in configuration');
        }

        // Test cache functionality
        void logger.info('test', '--- Testing Cache Functionality ---');
        testsRun++;
        try {
            const cacheStats = this.getCacheStats();
            void logger.info('test', `✅ Cache statistics retrieved`);
            logger.info('test', `   📊 Cache Size: ${cacheStats.size}`);
            logger.info('test', `   ⏱️ Avg Analysis Time: ${cacheStats.avgAnalysisTime.toFixed(2)}ms`);

            // Test cache hit by running same analysis again
            const sameNodeStartTime = performance.now();
            await this.performContentAwareMapping(testNodes[0]);
            const sameNodeTime = performance.now() - sameNodeStartTime;

            if (sameNodeTime < 5.0) { // Should be very fast if cached
                logger.info('test', `✅ Cache hit detected (${sameNodeTime.toFixed(2)}ms)`);
                testsPassed++;
            } else {
                logger.warn('test', `⚠️ Expected cache hit but analysis took ${sameNodeTime.toFixed(2)}ms`);
            }
        } catch (error) {
            logger.error('test', `❌ Cache functionality test failed: ${error.message}`);
        }

        // Test configuration integration
        void logger.info('test', '--- Testing Configuration Integration ---');
        testsRun++;
        try {
            const originalConfig = { ...this.config };

            // Update configuration
            const newConfig = {
                ...originalConfig,
                enhancedMapping: {
                    ...originalConfig.enhancedMapping,
                    weightings: {
                        ...originalConfig.enhancedMapping.weightings,
                        semantics: 0.8,
                        relationships: 0.6
                    }
                }
            };

            void this.updateConfig(newConfig);
            void logger.info('test', `✅ Configuration updated successfully`);

            // Restore original configuration
            void this.updateConfig(originalConfig);
            void logger.info('test', `✅ Configuration restored successfully`);

            testsPassed++;
        } catch (error) {
            logger.error('test', `❌ Configuration integration test failed: ${error.message}`);
        }

        // Summary
        logger.info('test', '=== ContentAwareMapper Test Summary ===');
        logger.info('test', `Total Tests: ${testsRun}`);
        logger.info('test', `Passed: ${testsPassed}`);
        logger.info('test', `Failed: ${testsRun - testsPassed}`);
        logger.info('test', `Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

        const cacheStats = this.getCacheStats();
        logger.info('test', `Final Cache Size: ${cacheStats.size}`);

        // Component status
        void logger.info('test', '--- Component Integration Status ---');
        logger.info('test', `📁 Folder Hierarchy Mapper: ${this.folderHierarchyMapper ? '✅ Enabled' : '❌ Disabled'}`);
        logger.info('test', `🏷️ Tag Semantic Mapper: ${this.tagSemanticMapper ? '✅ Enabled' : '❌ Disabled'}`);
        void logger.info('test', `📋 File Type Analyzer: ✅ Enabled`);
        void logger.info('test', `🎯 Instrument Selector: ✅ Enabled`);

        // Detailed results table
        void logger.info('test', '--- Detailed Test Results ---');
        void logger.warn('test-results', JSON.stringify(testResults.map(r => ({
            'Node ID': r.nodeId,
            Status: r.passed ? '✅ PASS' : '❌ FAIL',
            Instrument: r.details.selectedInstrument || 'N/A',
            'File Type': r.details.fileType || 'N/A',
            Confidence: r.details.confidence || 'N/A',
            'Analysis Time': r.details.analysisTime || 'N/A',
            'Fallbacks': r.details.fallbackCount || 'N/A',
            Error: r.error || 'None'
        }))));
        
        return;
    }

    /**
     * Validate complete content-aware mapping result
     */
    private validateContentAwareMappingResult(
        result: ContentAwareMappingResult,
        node: EnhancedGraphNode
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // Basic structure validation
        if (!result.characteristics) errors.push('Missing characteristics');
        if (!result.musicalProperties) errors.push('Missing musicalProperties');
        if (!result.selectedInstrument) errors.push('Missing selectedInstrument');
        if (!result.instrumentConfig) errors.push('Missing instrumentConfig');
        if (!result.reasoning || result.reasoning.length === 0) errors.push('Missing reasoning');
        if (!result.fallbackInstruments || result.fallbackInstruments.length === 0) errors.push('Missing fallbackInstruments');
        
        // Value validation
        if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
            void errors.push('Invalid confidence value');
        }
        
        if (typeof result.analysisTime !== 'number' || result.analysisTime < 0) {
            void errors.push('Invalid analysis time');
        }
        
        // Musical properties validation
        if (result.musicalProperties) {
            const mp = result.musicalProperties;
            
            if (!Array.isArray(mp.pitchRange) || mp.pitchRange.length !== 2) {
                void errors.push('Invalid pitch range');
            } else {
                if (mp.pitchRange[0] < 21 || mp.pitchRange[0] > 108 || 
                    mp.pitchRange[1] < 21 || mp.pitchRange[1] > 108) {
                    errors.push('Pitch range out of MIDI bounds [21, 108]');
                }
                if (mp.pitchRange[0] >= mp.pitchRange[1]) {
                    void errors.push('Invalid pitch range order');
                }
            }
            
            if (mp.noteDuration < 0.1 || mp.noteDuration > 3.0) {
                errors.push('Note duration out of range [0.1, 3.0]');
            }
            
            if (mp.velocity < 0.0 || mp.velocity > 1.0) {
                errors.push('Velocity out of range [0.0, 1.0]');
            }
            
            if (mp.instrumentRichness < 0.0 || mp.instrumentRichness > 1.0) {
                errors.push('Instrument richness out of range [0.0, 1.0]');
            }
            
            if (mp.spatialPosition) {
                if (mp.spatialPosition.pan < -1 || mp.spatialPosition.pan > 1) {
                    errors.push('Pan out of range [-1, 1]');
                }
                if (mp.spatialPosition.reverb < 0 || mp.spatialPosition.reverb > 1) {
                    errors.push('Reverb out of range [0, 1]');
                }
                if (mp.spatialPosition.delay < 0 || mp.spatialPosition.delay > 0.5) {
                    errors.push('Delay out of range [0, 0.5]');
                }
            }
        }
        
        // Logical consistency validation
        if (result.characteristics && result.selectedInstrument) {
            const appropriateCategories = this.getAppropriateCategoriesForFileType(result.characteristics.fileType);
            if (result.instrumentConfig.category &&
                !appropriateCategories.includes(result.instrumentConfig.category)) {
                // This is a warning, not an error - Phase 4.3 folder hierarchy might override this
                logger.warn('validation', `Instrument category ${result.instrumentConfig.category} may not be optimal for file type ${result.characteristics.fileType}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get appropriate instrument categories for a file type
     */
    private getAppropriateCategoriesForFileType(fileType: string): string[] {
        const categoryMapping: Record<string, string[]> = {
            'image': ['strings', 'keyboard', 'woodwind'],
            'audio': ['electronic', 'keyboard', 'percussion'],
            'video': ['electronic', 'brass', 'percussion'],
            'document': ['brass', 'keyboard', 'strings'],
            'text': ['keyboard', 'strings', 'woodwind'],
            'code': ['electronic', 'keyboard'],
            'unknown': ['keyboard', 'electronic']
        };

        return categoryMapping[fileType] || ['keyboard', 'electronic'];
    }

    /**
     * Test specific Phase 4.3 integration scenarios
     */
    async testPhase43Integration(): Promise<void> {
        logger.info('test', '=== Phase 4.3 Integration Specific Tests ===');

        if (!this.folderHierarchyMapper) {
            void logger.warn('test', '⚠️ Phase 4.3 folder hierarchy mapping is disabled');
            return;
        }

        // Test folder hierarchy override scenarios
        const integrationTests = [
            {
                name: 'Project Override - PDF in Projects folder should use brass family',
                node: {
                    id: 'project-pdf',
                    path: 'Projects/Documentation/technical-spec.pdf',
                    name: 'technical-spec.pdf'
                },
                expectedFamilyInfluence: 'brass'
            },
            {
                name: 'Research Override - Image in Research folder should use electronic family',
                node: {
                    id: 'research-image',
                    path: 'Research/Data Visualization/chart.png', 
                    name: 'chart.png'
                },
                expectedFamilyInfluence: 'electronic'
            },
            {
                name: 'Deep Path Pitch Modification',
                node: {
                    id: 'deep-path',
                    path: 'Projects/Complex/Multi/Level/Deep/Structure/nested-file.md',
                    name: 'nested-file.md'
                },
                expectedDepthEffect: true
            }
        ];

        for (const test of integrationTests) {
            logger.info('test', `--- ${test.name} ---`);

            try {
                // Fill in missing required properties
                const completeNode: EnhancedGraphNode = {
                    connections: [],
                    created: Date.now() - 86400000,
                    modified: Date.now() - 3600000,
                    wordCount: 100,
                    connectionCount: 3,
                    folderDepth: test.node.path.split('/').length - 1,
                    pathComponents: test.node.path.split('/'),
                    headings: [],
                    tags: [],
                    metadata: {
                        tags: [],
                        frontmatter: {},
                        wordCount: 100,
                        headingCount: 0
                    },
                    connectionDetails: {
                        wikilinks: [],
                        markdownLinks: [],
                        embeds: [],
                        tagConnections: [],
                        totalCount: 0
                    },
                    ...test.node
                };

                const mappingResult = await this.performContentAwareMapping(completeNode);

                // Analyze folder hierarchy specifically
                const folderAnalysis = this.folderHierarchyMapper.analyzeFolderPath(completeNode.path);

                void logger.info('test', `✅ Integration test completed`);
                logger.info('test', `   📁 Folder Family: ${folderAnalysis.primaryFamily.name}`);
                logger.info('test', `   🎵 Selected Instrument: ${mappingResult.selectedInstrument}`);
                logger.info('test', `   📊 Combined Confidence: ${(mappingResult.confidence * 100).toFixed(1)}%`);
                logger.info('test', `   🎼 Pitch Modifier: ${folderAnalysis.musicalProperties.pitchModifier.toFixed(2)}`);

                if ('expectedFamilyInfluence' in test) {
                    const familyMatch = folderAnalysis.primaryFamily.category === test.expectedFamilyInfluence;
                    logger.info('test', `   ${familyMatch ? '✅' : '⚠️'} Family influence: ${familyMatch ? 'correct' : 'unexpected'}`);
                }

                if ('expectedDepthEffect' in test) {
                    const hasDepthEffect = Math.abs(folderAnalysis.musicalProperties.pitchModifier) > 0.3;
                    logger.info('test', `   ${hasDepthEffect ? '✅' : '⚠️'} Depth effect: ${hasDepthEffect ? 'detected' : 'minimal'}`);
                }

            } catch (error) {
                logger.error('test', `❌ Integration test failed: ${error.message}`);
            }
        }
    }
}