/**
 * ObsidianMetadataMapper - Phase 2.1: Metadata-Driven Mapping Engine
 * 
 * Leverages Obsidian's two-tier metadata system (TFile + MetadataCache) for 
 * zero-latency vault analysis without file I/O operations.
 */

import { TFile, CachedMetadata, App } from 'obsidian';
import { EnhancedGraphNode, InstrumentMapping, AudioMappingConfig } from '../../graph/types';
import { getLogger } from '../../logging';

const logger = getLogger('obsidian-metadata-mapper');

/**
 * File metadata mapping derived from TFile properties
 */
export interface FileMetadataMapping {
    age: InstrumentSuggestion;
    size: ComplexityMapping;
    depth: DistanceMapping;
    extension: InstrumentFamilyMapping;
}

/**
 * Content metadata mapping derived from MetadataCache
 */
export interface ContentMetadataMapping {
    frontmatterInstrument?: string;
    frontmatterMood?: string;
    tagMappings: InstrumentMapping[];
    linkDensity: HarmonyMapping;
    structure: RhythmMapping;
}

/**
 * Instrument suggestion with priority and reasoning
 */
export interface InstrumentSuggestion {
    instrument: string;
    priority: number;
    reason: string;
    fallbacks: string[];
}

/**
 * Complexity mapping for audio parameters
 */
export interface ComplexityMapping {
    velocity: number;
    duration: number;
    richness: number;
}

/**
 * Distance mapping for spatial/pitch relationships
 */
export interface DistanceMapping {
    pitch: number;
    pan: number;
    reverb: number;
}

/**
 * Instrument family mapping
 */
export interface InstrumentFamilyMapping {
    family: 'strings' | 'brass' | 'woodwinds' | 'percussion' | 'keyboard' | 'electronic' | 'world';
    instruments: string[];
    priority: number;
}

/**
 * Harmony mapping for link relationships
 */
export interface HarmonyMapping {
    consonance: number;
    complexity: number;
    density: number;
}

/**
 * Rhythm mapping for structure analysis
 */
export interface RhythmMapping {
    tempo: number;
    pattern: 'simple' | 'complex' | 'irregular';
    emphasis: number;
}

/**
 * Combined metadata analysis result
 */
export interface MetadataAnalysisResult {
    fileMetadata: FileMetadataMapping;
    contentMetadata: ContentMetadataMapping;
    combinedScore: number;
    finalInstrument: string;
    confidence: number;
    analysisTime: number;
}

export class ObsidianMetadataMapper {
    private app: App;
    private config: AudioMappingConfig;
    private instrumentFamilyMap: Map<string, InstrumentFamilyMapping>;
    private ageMappings: Map<string, InstrumentSuggestion>;
    private analysisCache: Map<string, MetadataAnalysisResult>;
    private readonly CACHE_TTL = 300000; // 5 minutes
    private cacheTimestamps: Map<string, number>;

    constructor(app: App, config: AudioMappingConfig) {
        this.app = app;
        this.config = config;
        this.instrumentFamilyMap = new Map();
        this.ageMappings = new Map();
        this.analysisCache = new Map();
        this.cacheTimestamps = new Map();
        
        this.initializeInstrumentMappings();
        this.initializeAgeMappings();
        
        logger.info('metadata-mapper-init', 'ObsidianMetadataMapper initialized');
    }

    /**
     * Analyze file metadata using TFile properties (file system metadata)
     */
    analyzeFileMetadata(file: TFile): FileMetadataMapping {
        const startTime = performance.now();

        const result: FileMetadataMapping = {
            age: this.mapAgeToInstrument(file.stat.ctime, file.stat.mtime),
            size: this.mapSizeToComplexity(file.stat.size),
            depth: this.mapPathDepthToDistance(file.path),
            extension: this.mapExtensionToFamily(file.extension)
        };

        const analysisTime = performance.now() - startTime;
        logger.debug('file-metadata-analysis', `Analyzed file metadata for ${file.path}`, {
            analysisTime: analysisTime.toFixed(2) + 'ms',
            age: result.age.reason,
            sizeBytes: file.stat.size,
            depth: result.depth.pitch,
            extension: file.extension,
            family: result.extension.family
        });

        return result;
    }

    /**
     * Analyze content metadata using MetadataCache (content metadata)
     */
    analyzeContentMetadata(file: TFile, cache: CachedMetadata | null): ContentMetadataMapping {
        const startTime = performance.now();

        const result: ContentMetadataMapping = {
            frontmatterInstrument: cache?.frontmatter?.instrument,
            frontmatterMood: cache?.frontmatter?.['musical-mood'],
            tagMappings: this.mapTagsToInstruments(cache?.tags),
            linkDensity: this.mapLinkDensityToHarmony(cache?.links),
            structure: this.mapHeadingsToRhythm(cache?.headings)
        };

        const analysisTime = performance.now() - startTime;
        logger.debug('content-metadata-analysis', `Analyzed content metadata for ${file.path}`, {
            analysisTime: analysisTime.toFixed(2) + 'ms',
            hasFrontmatter: !!cache?.frontmatter,
            tags: cache?.tags?.length || 0,
            links: cache?.links?.length || 0,
            headings: cache?.headings?.length || 0,
            frontmatterInstrument: result.frontmatterInstrument,
            frontmatterMood: result.frontmatterMood
        });

        return result;
    }

    /**
     * Perform comprehensive metadata analysis for a file
     */
    analyzeFile(file: TFile): MetadataAnalysisResult {
        const cacheKey = `${file.path}-${file.stat.mtime}`;
        
        // Check cache first
        if (this.isAnalysisCached(cacheKey)) {
            logger.debug('cache-hit', `Using cached analysis for ${file.path}`);
            return this.analysisCache.get(cacheKey)!;
        }

        const overallStartTime = performance.now();
        
        // Get cached metadata (zero I/O)
        const cache = this.app.metadataCache.getFileCache(file);
        
        // Analyze both metadata types
        const fileMetadata = this.analyzeFileMetadata(file);
        const contentMetadata = this.analyzeContentMetadata(file, cache);
        
        // Combine results
        const combinedScore = this.calculateCombinedScore(fileMetadata, contentMetadata);
        const finalInstrument = this.selectFinalInstrument(fileMetadata, contentMetadata);
        const confidence = this.calculateConfidence(fileMetadata, contentMetadata);
        
        const analysisTime = performance.now() - overallStartTime;

        const result: MetadataAnalysisResult = {
            fileMetadata,
            contentMetadata,
            combinedScore,
            finalInstrument,
            confidence,
            analysisTime
        };

        // Cache the result
        this.analysisCache.set(cacheKey, result);
        this.cacheTimestamps.set(cacheKey, Date.now());

        logger.debug('complete-analysis', `Complete metadata analysis for ${file.path}`, {
            totalAnalysisTime: analysisTime.toFixed(2) + 'ms',
            finalInstrument,
            confidence: confidence.toFixed(2),
            combinedScore: combinedScore.toFixed(2),
            cacheKey
        });

        return result;
    }

    /**
     * Map file age (creation/modification time) to instrument suggestions
     */
    private mapAgeToInstrument(ctime: number, mtime: number): InstrumentSuggestion {
        const now = Date.now();
        const age = (now - mtime) / (1000 * 60 * 60 * 24); // Days since modification
        const totalAge = (now - ctime) / (1000 * 60 * 60 * 24); // Days since creation

        // Recently modified files (within week) - energetic instruments
        if (age <= 7) {
            return {
                instrument: 'leadSynth',
                priority: 0.9,
                reason: 'recently-modified',
                fallbacks: ['arpSynth', 'flute', 'violin']
            };
        }

        // Moderately aged files (1 week - 1 month) - balanced instruments
        if (age <= 30) {
            return {
                instrument: 'piano',
                priority: 0.7,
                reason: 'moderately-aged',
                fallbacks: ['electricPiano', 'guitar', 'strings']
            };
        }

        // Older files (1-6 months) - stable instruments
        if (age <= 180) {
            return {
                instrument: 'organ',
                priority: 0.6,
                reason: 'aged',
                fallbacks: ['pad', 'harp', 'cello']
            };
        }

        // Archive files (6+ months) - deep, sustained instruments
        return {
            instrument: 'bassSynth',
            priority: 0.5,
            reason: 'archived',
            fallbacks: ['bass', 'tuba', 'timpani']
        };
    }

    /**
     * Map file size to complexity parameters
     */
    private mapSizeToComplexity(size: number): ComplexityMapping {
        // Logarithmic scaling for file size to avoid extreme values
        const logSize = Math.log10(Math.max(size, 1));
        
        // Size ranges: 1B-1KB (0-3), 1KB-1MB (3-6), 1MB+ (6+)
        const normalizedSize = Math.min(logSize / 6, 1);

        return {
            velocity: 0.3 + (normalizedSize * 0.7), // 0.3 to 1.0
            duration: 0.2 + (normalizedSize * 0.6), // 0.2 to 0.8 seconds
            richness: normalizedSize // 0.0 to 1.0 (affects filter cutoff, reverb)
        };
    }

    /**
     * Map folder path depth to distance/spatial parameters
     */
    private mapPathDepthToDistance(path: string): DistanceMapping {
        const components = path.split('/').filter(comp => comp !== '');
        const depth = Math.max(0, components.length - 1); // Exclude filename
        
        // Normalize depth (cap at 10 levels)
        const normalizedDepth = Math.min(depth / 10, 1);

        return {
            pitch: 1 - (normalizedDepth * 0.5), // Deeper files = lower pitch (0.5 to 1.0)
            pan: (normalizedDepth - 0.5) * 0.3, // Slight pan based on depth (-0.15 to 0.15)
            reverb: normalizedDepth * 0.4 // Deeper files = more reverb (0.0 to 0.4)
        };
    }

    /**
     * Map file extension to instrument family
     */
    private mapExtensionToFamily(extension: string): InstrumentFamilyMapping {
        const ext = extension.toLowerCase();
        
        // Use cached mapping or default
        if (this.instrumentFamilyMap.has(ext)) {
            return this.instrumentFamilyMap.get(ext)!;
        }

        // Default mapping for unknown extensions
        return {
            family: 'electronic',
            instruments: ['pad', 'electricPiano', 'bassSynth'],
            priority: 0.3
        };
    }

    /**
     * Map tags to instrument suggestions
     */
    private mapTagsToInstruments(tags?: Array<{ tag: string; position: any }>): InstrumentMapping[] {
        if (!tags || !this.config.contentAwareMapping.enabled) {
            return [];
        }

        const mappings: InstrumentMapping[] = [];

        for (const tagObj of tags) {
            const tag = tagObj.tag.replace('#', ''); // Remove # prefix
            
            // Check user-defined tag mappings first
            if (this.config.contentAwareMapping.tagMappings[tag]) {
                mappings.push(this.config.contentAwareMapping.tagMappings[tag]);
            } else {
                // Apply default semantic mappings
                const defaultMapping = this.getDefaultTagMapping(tag);
                if (defaultMapping) {
                    mappings.push(defaultMapping);
                }
            }
        }

        return mappings;
    }

    /**
     * Map link density to harmony characteristics
     */
    private mapLinkDensityToHarmony(links?: Array<any>): HarmonyMapping {
        const linkCount = links?.length || 0;
        
        // Logarithmic scaling for link density
        const density = Math.min(Math.log10(linkCount + 1) / 2, 1); // 0 to 1

        return {
            consonance: Math.max(0.3, 1 - (density * 0.4)), // More links = less consonant
            complexity: density, // More links = more complex harmonies
            density: density // Direct mapping
        };
    }

    /**
     * Map heading structure to rhythm characteristics
     */
    private mapHeadingsToRhythm(headings?: Array<any>): RhythmMapping {
        const headingCount = headings?.length || 0;
        
        if (headingCount === 0) {
            return {
                tempo: 1.0,
                pattern: 'simple',
                emphasis: 0.3
            };
        }

        // Analyze heading levels for rhythm complexity
        if (!headings || headings.length === 0) {
            return {
                tempo: 1.0,
                pattern: 'simple',
                emphasis: 0.3
            };
        }
        const levels = headings.map(h => h.level);
        const uniqueLevels = new Set(levels).size;
        const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;

        return {
            tempo: Math.min(1 + (headingCount * 0.1), 1.5), // More headings = faster tempo
            pattern: uniqueLevels > 2 ? 'complex' : 'simple',
            emphasis: Math.min(avgLevel / 6, 1) // Deeper headings = more emphasis
        };
    }

    /**
     * Initialize instrument family mappings for file extensions
     */
    private initializeInstrumentMappings(): void {
        // Markdown files - versatile, content-driven
        this.instrumentFamilyMap.set('md', {
            family: 'keyboard',
            instruments: ['piano', 'electricPiano', 'organ'],
            priority: 0.8
        });

        // Image files - visual, bright
        this.instrumentFamilyMap.set('jpg', this.createVisualInstrumentMapping());
        this.instrumentFamilyMap.set('jpeg', this.createVisualInstrumentMapping());
        this.instrumentFamilyMap.set('png', this.createVisualInstrumentMapping());
        this.instrumentFamilyMap.set('svg', this.createVisualInstrumentMapping());

        // Audio files - direct audio representation
        this.instrumentFamilyMap.set('mp3', {
            family: 'electronic',
            instruments: ['leadSynth', 'arpSynth', 'pad'],
            priority: 0.9
        });

        // Documents - structured, professional
        this.instrumentFamilyMap.set('pdf', {
            family: 'brass',
            instruments: ['trumpet', 'trombone', 'frenchHorn'],
            priority: 0.7
        });

        // Code files - precise, technical
        this.instrumentFamilyMap.set('js', this.createTechnicalInstrumentMapping());
        this.instrumentFamilyMap.set('ts', this.createTechnicalInstrumentMapping());
        this.instrumentFamilyMap.set('py', this.createTechnicalInstrumentMapping());
        this.instrumentFamilyMap.set('json', this.createTechnicalInstrumentMapping());

        logger.debug('instrument-mappings', `Initialized ${this.instrumentFamilyMap.size} extension mappings`);
    }

    /**
     * Create visual instrument mapping for images
     */
    private createVisualInstrumentMapping(): InstrumentFamilyMapping {
        return {
            family: 'strings',
            instruments: ['violin', 'harp', 'guitar'],
            priority: 0.8
        };
    }

    /**
     * Create technical instrument mapping for code files
     */
    private createTechnicalInstrumentMapping(): InstrumentFamilyMapping {
        return {
            family: 'electronic',
            instruments: ['arpSynth', 'leadSynth', 'bassSynth'],
            priority: 0.7
        };
    }

    /**
     * Initialize age-based instrument mappings
     */
    private initializeAgeMappings(): void {
        // Age mappings are computed dynamically in mapAgeToInstrument
        // This method reserved for future static age mappings if needed
    }

    /**
     * Get default semantic mapping for a tag
     */
    private getDefaultTagMapping(tag: string): InstrumentMapping | null {
        const lowerTag = tag.toLowerCase();

        // Emotional tags
        if (['idea', 'insight', 'eureka'].includes(lowerTag)) {
            return { instrument: 'flute', priority: 0.8 };
        }

        if (['project', 'task', 'todo'].includes(lowerTag)) {
            return { instrument: 'electricPiano', priority: 0.7 };
        }

        if (['journal', 'daily', 'reflection'].includes(lowerTag)) {
            return { instrument: 'harp', priority: 0.8 };
        }

        if (['research', 'analysis', 'study'].includes(lowerTag)) {
            return { instrument: 'arpSynth', priority: 0.6 };
        }

        if (['creative', 'art', 'design'].includes(lowerTag)) {
            return { instrument: 'pad', priority: 0.7 };
        }

        return null;
    }

    /**
     * Calculate combined score from both metadata types
     */
    private calculateCombinedScore(file: FileMetadataMapping, content: ContentMetadataMapping): number {
        // Weight different factors
        const ageWeight = 0.3;
        const sizeWeight = 0.2;
        const contentWeight = 0.4;
        const structureWeight = 0.1;

        const ageScore = file.age.priority;
        const sizeScore = file.size.richness;
        const contentScore = content.frontmatterInstrument ? 1.0 : (content.tagMappings.length > 0 ? 0.7 : 0.3);
        const structureScore = content.structure.emphasis;

        return (ageScore * ageWeight) + 
               (sizeScore * sizeWeight) + 
               (contentScore * contentWeight) + 
               (structureScore * structureWeight);
    }

    /**
     * Select final instrument from analysis results
     */
    private selectFinalInstrument(file: FileMetadataMapping, content: ContentMetadataMapping): string {
        // Priority order:
        // 1. User-defined frontmatter instrument (highest priority)
        // 2. Tag-based mappings (if any)
        // 3. File extension family instruments
        // 4. Age-based suggestions
        // 5. Fallback

        if (content.frontmatterInstrument) {
            return content.frontmatterInstrument;
        }

        if (content.tagMappings.length > 0) {
            // Use highest priority tag mapping
            const bestTagMapping = content.tagMappings.reduce((best, current) => 
                current.priority > best.priority ? current : best
            );
            return bestTagMapping.instrument;
        }

        if (file.extension.instruments.length > 0) {
            // Use first instrument from family mapping
            return file.extension.instruments[0];
        }

        return file.age.instrument;
    }

    /**
     * Calculate confidence in the instrument selection
     */
    private calculateConfidence(file: FileMetadataMapping, content: ContentMetadataMapping): number {
        let confidence = 0.5; // Base confidence

        // Boost confidence for explicit user choices
        if (content.frontmatterInstrument) {
            confidence += 0.4;
        }

        // Boost confidence for tag mappings
        if (content.tagMappings.length > 0) {
            confidence += 0.2 * Math.min(content.tagMappings.length, 3);
        }

        // Boost confidence for clear file type
        confidence += file.extension.priority * 0.2;

        // Boost confidence for recent files (more intentional)
        confidence += file.age.priority * 0.1;

        return Math.min(confidence, 1.0);
    }

    /**
     * Check if analysis is cached and still valid
     */
    private isAnalysisCached(cacheKey: string): boolean {
        if (!this.analysisCache.has(cacheKey) || !this.cacheTimestamps.has(cacheKey)) {
            return false;
        }

        const timestamp = this.cacheTimestamps.get(cacheKey)!;
        return (Date.now() - timestamp) < this.CACHE_TTL;
    }

    /**
     * Update configuration
     */
    updateConfig(config: AudioMappingConfig): void {
        this.config = config;
        
        // Clear cache when configuration changes
        this.analysisCache.clear();
        this.cacheTimestamps.clear();
        
        logger.info('config-update', 'Configuration updated, cache cleared');
    }

    /**
     * Get cache statistics for debugging
     */
    getCacheStats(): { size: number; hitRate: number; avgAnalysisTime: number } {
        const results = Array.from(this.analysisCache.values());
        const avgAnalysisTime = results.length > 0 
            ? results.reduce((sum, r) => sum + r.analysisTime, 0) / results.length 
            : 0;

        return {
            size: this.analysisCache.size,
            hitRate: 0, // Would need to track hits/misses to calculate
            avgAnalysisTime
        };
    }

    /**
     * Clear all caches
     */
    clearCaches(): void {
        this.analysisCache.clear();
        this.cacheTimestamps.clear();
        logger.info('cache-clear', 'All caches cleared');
    }
}