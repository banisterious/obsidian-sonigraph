/**
 * InstrumentSelector - Phase 4.1: Metadata-Driven Instrument Selection
 * 
 * Provides sophisticated instrument selection based on file characteristics.
 * Maps metadata dimensions, audio duration, PDF pages, and note complexity
 * to specific musical instruments with intelligent fallback strategies.
 */

import { AudioMappingConfig } from '../../graph/types';
import { InstrumentConfig, getAllInstruments, getInstrumentsByCategory } from '../configs';
import { FileCharacteristics } from './FileTypeAnalyzer';
import { getLogger } from '../../logging';

const logger = getLogger('instrument-selector');

/**
 * Criteria for instrument selection based on file characteristics
 */
export interface InstrumentSelectionCriteria {
    fileType: string;
    complexity: number;
    size: number;
    structure: {
        hasComplexStructure: boolean;
        headingCount: number;
        sectionCount: number;
    };
    metadata: {
        hasAdvancedMetadata: boolean;
        imageMetadata?: { aspectRatio?: number; imageType?: string; fileSize?: number; width?: number; height?: number };
        mediaDuration?: number;
        pageCount?: number;
        wordCount?: number;
        textMetadata?: { contentType?: string };
        codeMetadata?: { complexity?: string };
    };
    relationships: {
        connectionCount: number;
        isHub?: boolean;
        isLeaf?: boolean;
    };
    temporal: {
        daysSinceModified: number;
        isRecent?: boolean;
        isStale?: boolean;
    };
}

/**
 * Instrument selection result with reasoning
 */
export interface InstrumentSelectionResult {
    instrument: string;
    confidence: number;
    reasoning: string[];
    musicalProperties: {
        pitchRange: [number, number];
        velocity: number;
        timbre: string;
        expressiveness: number;
    };
    fallbacks: string[];
}

/**
 * Musical mapping rules for different file characteristics
 */
interface MappingRule {
    name: string;
    condition: (criteria: InstrumentSelectionCriteria) => boolean;
    instruments: string[];
    priority: number;
    reasoning: string;
    musicalProperties?: Partial<InstrumentSelectionResult['musicalProperties']>;
}

export class InstrumentSelector {
    private availableInstruments: Map<string, InstrumentConfig>;
    private mappingRules: MappingRule[];
    private selectionCache: Map<string, InstrumentSelectionResult>;
    private cacheTimestamps: Map<string, number>;
    private readonly CACHE_TTL = 300000; // 5 minutes

    constructor() {
        this.availableInstruments = new Map(Object.entries(getAllInstruments()));
        this.mappingRules = [];
        this.selectionCache = new Map();
        this.cacheTimestamps = new Map();
        
        void this.initializeMappingRules();
        
        logger.info('instrument-selector-init', 'InstrumentSelector initialized', {
            availableInstruments: this.availableInstruments.size,
            mappingRules: this.mappingRules.length
        });
    }

    /**
     * Select the best instrument based on file characteristics
     */
    async selectInstrument(criteria: InstrumentSelectionCriteria, config: AudioMappingConfig): Promise<string> {
        const cacheKey = this.createCacheKey(criteria);
        
        // Check cache first
        if (this.isSelectionCached(cacheKey)) {
            const cached = this.selectionCache.get(cacheKey);
            logger.debug('cache-hit', `Using cached instrument selection: ${cached.instrument}`);
            return cached.instrument;
        }

        const startTime = performance.now();
        
        try {
            // Apply mapping rules to find the best instrument
            const result = this.applyMappingRules(criteria, config);

            // Cache the result
            this.selectionCache.set(cacheKey, result);
            this.cacheTimestamps.set(cacheKey, Date.now());
            
            const selectionTime = performance.now() - startTime;
            logger.debug('instrument-selected', `Selected ${result.instrument}`, {
                selectionTime: selectionTime.toFixed(2) + 'ms',
                confidence: result.confidence.toFixed(2),
                fileType: criteria.fileType,
                complexity: criteria.complexity.toFixed(2),
                reasoning: result.reasoning.join(', ')
            });
            
            return result.instrument;
        } catch (error) {
            logger.error('instrument-selection-error', 'Failed to select instrument', { error: error.message });
            return this.getFallbackInstrument();
        }
    }

    /**
     * Get detailed selection result with reasoning
     */
    selectInstrumentWithDetails(criteria: InstrumentSelectionCriteria, config: AudioMappingConfig): InstrumentSelectionResult {
        const cacheKey = this.createCacheKey(criteria);

        // Check cache first
        if (this.isSelectionCached(cacheKey)) {
            return this.selectionCache.get(cacheKey);
        }

        return this.applyMappingRules(criteria, config);
    }

    /**
     * Apply mapping rules to select the best instrument
     */
    private applyMappingRules(criteria: InstrumentSelectionCriteria, config: AudioMappingConfig): InstrumentSelectionResult {
        const reasoning: string[] = [];
        let bestMatch: { rule: MappingRule; score: number } | null = null;
        let highestScore = 0;

        // Evaluate all mapping rules
        for (const rule of this.mappingRules) {
            if (rule.condition(criteria)) {
                const score = this.calculateRuleScore(rule, criteria);
                reasoning.push(`Rule "${rule.name}" matches with score ${score.toFixed(2)}`);
                
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = { rule, score };
                }
            }
        }

        // If no rules matched, use default selection
        if (!bestMatch) {
            void reasoning.push('No specific rules matched, using default selection');
            bestMatch = {
                rule: this.getDefaultRule(criteria),
                score: 0.5
            };
        }

        // Select instrument from the best matching rule
        const selectedInstrument = this.selectFromRule(bestMatch.rule, criteria);
        const confidence = this.calculateSelectionConfidence(bestMatch, criteria, config);
        const musicalProperties = this.deriveMusicalProperties(bestMatch.rule, criteria);
        const fallbacks = this.generateFallbacks(selectedInstrument, criteria);

        reasoning.push(`Selected "${selectedInstrument}" from rule "${bestMatch.rule.name}"`);

        return {
            instrument: selectedInstrument,
            confidence,
            reasoning,
            musicalProperties,
            fallbacks
        };
    }

    /**
     * Initialize comprehensive mapping rules
     */
    private initializeMappingRules(): void {
        // Image-based mappings
        this.mappingRules.push({
            name: 'Large High-Resolution Images',
            condition: (c) => c.fileType === 'image' && c.size > 5 * 1024 * 1024,
            instruments: ['harp', 'violin', 'flute'],
            priority: 0.9,
            reasoning: 'High-resolution images deserve delicate, detailed instruments',
            musicalProperties: {
                pitchRange: [72, 96], // Higher register
                velocity: 0.6,
                timbre: 'bright',
                expressiveness: 0.8
            }
        });

        this.mappingRules.push({
            name: 'Wide Aspect Ratio Images',
            condition: (c) => c.fileType === 'image' && c.metadata.imageMetadata?.aspectRatio > 1.5,
            instruments: ['piano', 'electricPiano', 'strings'],
            priority: 0.8,
            reasoning: 'Wide images suggest expansive, panoramic instruments',
            musicalProperties: {
                pitchRange: [48, 72], // Lower, wider range
                velocity: 0.7,
                timbre: 'warm',
                expressiveness: 0.7
            }
        });

        this.mappingRules.push({
            name: 'Portrait/Tall Images',
            condition: (c) => c.fileType === 'image' && c.metadata.imageMetadata?.aspectRatio < 0.7,
            instruments: ['cello', 'contrabass', 'oboe'],
            priority: 0.8,
            reasoning: 'Tall images suggest vertical, ascending instruments',
            musicalProperties: {
                pitchRange: [60, 84], // Medium-high range
                velocity: 0.8,
                timbre: 'focused',
                expressiveness: 0.9
            }
        });

        this.mappingRules.push({
            name: 'Screenshots and Diagrams',
            condition: (c) => c.fileType === 'image' && (
                c.metadata.imageMetadata?.imageType === 'screenshot' || 
                c.metadata.imageMetadata?.imageType === 'diagram'
            ),
            instruments: ['arpSynth', 'leadSynth', 'electricPiano'],
            priority: 0.9,
            reasoning: 'Technical images call for precise, digital instruments',
            musicalProperties: {
                pitchRange: [60, 84],
                velocity: 0.8,
                timbre: 'digital',
                expressiveness: 0.6
            }
        });

        // Audio/Video-based mappings
        this.mappingRules.push({
            name: 'Long Audio/Video Files',
            condition: (c) => (c.fileType === 'audio' || c.fileType === 'video') && (c.metadata.mediaDuration || 0) > 600,
            instruments: ['organ', 'pad', 'bassSynth'],
            priority: 0.9,
            reasoning: 'Long media files deserve sustained, evolving instruments',
            musicalProperties: {
                pitchRange: [36, 60], // Lower register for sustained content
                velocity: 0.6,
                timbre: 'sustained',
                expressiveness: 0.5
            }
        });

        this.mappingRules.push({
            name: 'Short Audio/Video Clips',
            condition: (c) => (c.fileType === 'audio' || c.fileType === 'video') && (c.metadata.mediaDuration || 0) < 60,
            instruments: ['timpani', 'xylophone', 'vibraphone'],
            priority: 0.8,
            reasoning: 'Short clips suggest percussive, immediate instruments',
            musicalProperties: {
                pitchRange: [72, 96],
                velocity: 0.9,
                timbre: 'percussive',
                expressiveness: 0.7
            }
        });

        this.mappingRules.push({
            name: 'High Quality Media',
            condition: (c) => (c.fileType === 'audio' || c.fileType === 'video') && 
                c.metadata.hasAdvancedMetadata && c.size > 10 * 1024 * 1024,
            instruments: ['strings', 'violin', 'cello', 'piano'],
            priority: 0.8,
            reasoning: 'High quality media deserves rich, expressive instruments',
            musicalProperties: {
                pitchRange: [48, 84],
                velocity: 0.7,
                timbre: 'rich',
                expressiveness: 0.9
            }
        });

        // Document-based mappings  
        this.mappingRules.push({
            name: 'Large Documents',
            condition: (c) => c.fileType === 'document' && (c.metadata.pageCount || 0) > 20,
            instruments: ['trumpet', 'trombone', 'frenchHorn'],
            priority: 0.9,
            reasoning: 'Large documents call for authoritative brass instruments',
            musicalProperties: {
                pitchRange: [48, 72],
                velocity: 0.8,
                timbre: 'authoritative',
                expressiveness: 0.6
            }
        });

        this.mappingRules.push({
            name: 'Medium Documents',
            condition: (c) => c.fileType === 'document' && (c.metadata.pageCount || 0) >= 5 && (c.metadata.pageCount || 0) <= 20,
            instruments: ['trumpet', 'horn', 'clarinet'],
            priority: 0.8,
            reasoning: 'Medium documents suit balanced wind instruments',
            musicalProperties: {
                pitchRange: [60, 84],
                velocity: 0.7,
                timbre: 'balanced',
                expressiveness: 0.7
            }
        });

        this.mappingRules.push({
            name: 'Short Documents',
            condition: (c) => c.fileType === 'document' && (c.metadata.pageCount || 0) < 5,
            instruments: ['flute', 'piccolo', 'oboe'],
            priority: 0.7,
            reasoning: 'Short documents suit light, agile instruments',
            musicalProperties: {
                pitchRange: [72, 96],
                velocity: 0.6,
                timbre: 'light',
                expressiveness: 0.8
            }
        });

        // Text/Note complexity mappings
        this.mappingRules.push({
            name: 'Complex Structured Text',
            condition: (c) => c.fileType === 'text' && c.structure.hasComplexStructure && (c.metadata.wordCount || 0) > 2000,
            instruments: ['organ', 'piano', 'harpsichord'],
            priority: 0.9,
            reasoning: 'Complex structured text calls for sophisticated keyboard instruments',
            musicalProperties: {
                pitchRange: [48, 84],
                velocity: 0.7,
                timbre: 'sophisticated',
                expressiveness: 0.8
            }
        });

        this.mappingRules.push({
            name: 'Journal Entries',
            condition: (c) => c.fileType === 'text' && c.metadata.textMetadata?.contentType === 'journal',
            instruments: ['harp', 'guitar', 'violin'],
            priority: 0.8,
            reasoning: 'Journal entries deserve intimate, personal instruments',
            musicalProperties: {
                pitchRange: [60, 84],
                velocity: 0.6,
                timbre: 'intimate',
                expressiveness: 0.9
            }
        });

        this.mappingRules.push({
            name: 'Technical Articles',
            condition: (c) => c.fileType === 'text' && c.metadata.textMetadata?.contentType === 'article' && 
                (c.metadata.wordCount || 0) > 1000,
            instruments: ['clarinet', 'bassoon', 'cello'],
            priority: 0.8,
            reasoning: 'Technical articles call for analytical, structured instruments',
            musicalProperties: {
                pitchRange: [48, 72],
                velocity: 0.7,
                timbre: 'analytical',
                expressiveness: 0.6
            }
        });

        this.mappingRules.push({
            name: 'Quick Notes',
            condition: (c) => c.fileType === 'text' && (c.metadata.wordCount || 0) < 200,
            instruments: ['flute', 'piccolo', 'violin'],
            priority: 0.7,
            reasoning: 'Quick notes suit light, agile instruments',
            musicalProperties: {
                pitchRange: [72, 96],
                velocity: 0.8,
                timbre: 'light',
                expressiveness: 0.7
            }
        });

        // Code-based mappings
        this.mappingRules.push({
            name: 'Complex Code Files',
            condition: (c) => c.fileType === 'code' && c.metadata.codeMetadata?.complexity === 'complex',
            instruments: ['arpSynth', 'leadSynth', 'bassSynth'],
            priority: 0.9,
            reasoning: 'Complex code deserves sophisticated electronic instruments',
            musicalProperties: {
                pitchRange: [48, 96],
                velocity: 0.8,
                timbre: 'digital',
                expressiveness: 0.7
            }
        });

        this.mappingRules.push({
            name: 'Simple Scripts',
            condition: (c) => c.fileType === 'code' && c.metadata.codeMetadata?.complexity === 'simple',
            instruments: ['electricPiano', 'pad', 'leadSynth'],
            priority: 0.8,
            reasoning: 'Simple code suits clean, straightforward electronic instruments',
            musicalProperties: {
                pitchRange: [60, 84],
                velocity: 0.7,
                timbre: 'clean',
                expressiveness: 0.6
            }
        });

        // Connection-based mappings (hub/leaf patterns)
        this.mappingRules.push({
            name: 'Hub Files',
            condition: (c) => c.relationships.isHub || c.relationships.connectionCount > 15,
            instruments: ['piano', 'organ', 'strings'],
            priority: 0.9,
            reasoning: 'Hub files are central and deserve prominent instruments',
            musicalProperties: {
                pitchRange: [48, 84],
                velocity: 0.8,
                timbre: 'prominent',
                expressiveness: 0.8
            }
        });

        this.mappingRules.push({
            name: 'Isolated Files',
            condition: (c) => c.relationships.isLeaf || c.relationships.connectionCount === 0,
            instruments: ['harp', 'flute', 'guitar'],
            priority: 0.7,
            reasoning: 'Isolated files suit delicate, standalone instruments',
            musicalProperties: {
                pitchRange: [72, 96],
                velocity: 0.5,
                timbre: 'delicate',
                expressiveness: 0.8
            }
        });

        // Temporal mappings
        this.mappingRules.push({
            name: 'Recently Active Files',
            condition: (c) => c.temporal.isRecent || c.temporal.daysSinceModified < 3,
            instruments: ['leadSynth', 'arpSynth', 'electricPiano'],
            priority: 0.8,
            reasoning: 'Recently active files deserve energetic, bright instruments',
            musicalProperties: {
                pitchRange: [60, 96],
                velocity: 0.8,
                timbre: 'bright',
                expressiveness: 0.8
            }
        });

        this.mappingRules.push({
            name: 'Archive Files',
            condition: (c) => c.temporal.isStale || c.temporal.daysSinceModified > 365,
            instruments: ['organ', 'pad', 'bassSynth'],
            priority: 0.7,
            reasoning: 'Archive files suit deep, sustained instruments',
            musicalProperties: {
                pitchRange: [36, 60],
                velocity: 0.5,
                timbre: 'deep',
                expressiveness: 0.5
            }
        });

        // Complexity-based mappings
        this.mappingRules.push({
            name: 'Highly Complex Files',
            condition: (c) => c.complexity > 0.8,
            instruments: ['strings', 'piano', 'organ'],
            priority: 0.8,
            reasoning: 'Highly complex files deserve rich, layered instruments',
            musicalProperties: {
                pitchRange: [36, 96], // Full range
                velocity: 0.8,
                timbre: 'complex',
                expressiveness: 0.9
            }
        });

        this.mappingRules.push({
            name: 'Simple Files',
            condition: (c) => c.complexity < 0.3,
            instruments: ['flute', 'guitar', 'electricPiano'],
            priority: 0.6,
            reasoning: 'Simple files suit clean, straightforward instruments',
            musicalProperties: {
                pitchRange: [60, 84],
                velocity: 0.6,
                timbre: 'simple',
                expressiveness: 0.6
            }
        });

        // Sort rules by priority (highest first)
        this.mappingRules.sort((a, b) => b.priority - a.priority);

        logger.debug('mapping-rules-initialized', `Initialized ${this.mappingRules.length} mapping rules`);
    }

    /**
     * Calculate rule matching score
     */
    private calculateRuleScore(rule: MappingRule, criteria: InstrumentSelectionCriteria): number {
        let score = rule.priority;

        // Boost score for very specific matches
        if (rule.name.includes('Large') && criteria.size > 10 * 1024 * 1024) score += 0.1;
        if (rule.name.includes('Complex') && criteria.complexity > 0.7) score += 0.1;
        if (rule.name.includes('Hub') && criteria.relationships.connectionCount > 20) score += 0.1;
        if (rule.name.includes('Recent') && criteria.temporal.daysSinceModified < 1) score += 0.1;

        return Math.min(1.0, score);
    }

    /**
     * Select instrument from a matched rule
     */
    private selectFromRule(rule: MappingRule, criteria: InstrumentSelectionCriteria): string {
        // Check if preferred instruments are available
        for (const instrument of rule.instruments) {
            if (this.availableInstruments.has(instrument)) {
                return instrument;
            }
        }

        // Fallback to first available instrument
        return rule.instruments[0] || this.getFallbackInstrument();
    }

    /**
     * Get default rule for unmatched cases
     */
    private getDefaultRule(criteria: InstrumentSelectionCriteria): MappingRule {
        const categoryMap: Record<string, string[]> = {
            'image': ['violin', 'harp', 'flute'],
            'audio': ['leadSynth', 'arpSynth', 'pad'],
            'video': ['leadSynth', 'electricPiano', 'pad'],
            'document': ['trumpet', 'clarinet', 'piano'],
            'text': ['piano', 'electricPiano', 'violin'],
            'code': ['arpSynth', 'leadSynth', 'electricPiano'],
            'unknown': ['piano', 'electricPiano', 'violin']
        };

        return {
            name: 'Default Rule',
            condition: () => true,
            instruments: categoryMap[criteria.fileType] || categoryMap['unknown'],
            priority: 0.3,
            reasoning: `Default mapping for ${criteria.fileType} files`
        };
    }

    /**
     * Calculate selection confidence
     */
    private calculateSelectionConfidence(
        bestMatch: { rule: MappingRule; score: number }, 
        criteria: InstrumentSelectionCriteria,
        config: AudioMappingConfig
    ): number {
        let confidence = bestMatch.score;

        // Boost confidence for files with rich metadata
        if (criteria.metadata.hasAdvancedMetadata) {
            confidence += 0.1;
        }

        // Boost confidence for well-connected files
        if (criteria.relationships.connectionCount > 5) {
            confidence += 0.05;
        }

        // Boost confidence for recent files
        if (criteria.temporal.isRecent) {
            confidence += 0.05;
        }

        // Boost confidence if content-aware mapping is explicitly enabled
        if (config.contentAwareMapping?.enabled) {
            confidence += 0.1;
        }

        return Math.max(0.3, Math.min(1.0, confidence));
    }

    /**
     * Derive musical properties from rule and criteria
     */
    private deriveMusicalProperties(rule: MappingRule, criteria: InstrumentSelectionCriteria): InstrumentSelectionResult['musicalProperties'] {
        const baseProperties: InstrumentSelectionResult['musicalProperties'] = rule.musicalProperties ? {
            pitchRange: rule.musicalProperties.pitchRange || [60, 72],
            velocity: rule.musicalProperties.velocity || 0.7,
            timbre: rule.musicalProperties.timbre || 'neutral',
            expressiveness: rule.musicalProperties.expressiveness || 0.7
        } : {
            pitchRange: [60, 72] as [number, number],
            velocity: 0.7,
            timbre: 'neutral',
            expressiveness: 0.7
        };

        // Adjust based on file characteristics
        const adjustedProperties = { ...baseProperties };

        // Complexity influences expressiveness and velocity
        if (criteria.complexity > 0.7) {
            adjustedProperties.velocity = Math.min(1.0, adjustedProperties.velocity * 1.2);
            adjustedProperties.expressiveness = Math.min(1.0, adjustedProperties.expressiveness * 1.1);
        } else if (criteria.complexity < 0.3) {
            adjustedProperties.velocity *= 0.8;
            adjustedProperties.expressiveness *= 0.9;
        }

        // Size influences pitch range
        const sizeMB = criteria.size / (1024 * 1024);
        if (sizeMB > 10) {
            // Large files get wider pitch range
            const center = (adjustedProperties.pitchRange[0] + adjustedProperties.pitchRange[1]) / 2;
            const expansion = 6; // Semitones
            adjustedProperties.pitchRange = [
                Math.max(24, center - expansion),
                Math.min(108, center + expansion)
            ];
        }

        // Connections influence velocity
        if (criteria.relationships.connectionCount > 10) {
            adjustedProperties.velocity = Math.min(1.0, adjustedProperties.velocity * 1.1);
        }

        return adjustedProperties;
    }

    /**
     * Generate fallback instruments
     */
    private generateFallbacks(selectedInstrument: string, criteria: InstrumentSelectionCriteria): string[] {
        const fallbacks: string[] = [];
        
        // Get instruments from same category
        const selectedConfig = this.availableInstruments.get(selectedInstrument);
        if (selectedConfig?.category) {
            const categoryInstruments = getInstrumentsByCategory(selectedConfig.category);
            Object.keys(categoryInstruments).forEach(name => {
                if (name !== selectedInstrument && fallbacks.length < 2) {
                    void fallbacks.push(name);
                }
            });
        }

        // Add general fallbacks
        const generalFallbacks = ['piano', 'electricPiano', 'violin', 'flute'];
        generalFallbacks.forEach(name => {
            if (name !== selectedInstrument && !fallbacks.includes(name) && fallbacks.length < 3) {
                void fallbacks.push(name);
            }
        });

        return fallbacks;
    }

    /**
     * Create cache key from criteria
     */
    private createCacheKey(criteria: InstrumentSelectionCriteria): string {
        return `${criteria.fileType}-${criteria.complexity.toFixed(2)}-${criteria.size}-${criteria.relationships.connectionCount}`;
    }

    /**
     * Check if selection is cached and valid
     */
    private isSelectionCached(cacheKey: string): boolean {
        if (!this.selectionCache.has(cacheKey) || !this.cacheTimestamps.has(cacheKey)) {
            return false;
        }

        const timestamp = this.cacheTimestamps.get(cacheKey);
        return (Date.now() - timestamp) < this.CACHE_TTL;
    }

    /**
     * Get fallback instrument for error cases
     */
    private getFallbackInstrument(): string {
        return 'piano';
    }

    /**
     * Update configuration
     */
    updateConfig(config: AudioMappingConfig): void {
        // Clear cache when configuration changes
        this.selectionCache.clear();
        this.cacheTimestamps.clear();
        
        void logger.info('instrument-selector-config-update', 'Configuration updated, cache cleared');
    }

    /**
     * Get selection statistics
     */
    getSelectionStats(): { cacheSize: number; rulesCount: number; instrumentCount: number } {
        return {
            cacheSize: this.selectionCache.size,
            rulesCount: this.mappingRules.length,
            instrumentCount: this.availableInstruments.size
        };
    }

    /**
     * Clear all caches
     */
    clearCaches(): void {
        this.selectionCache.clear();
        this.cacheTimestamps.clear();
        
        void logger.info('instrument-selector-cache-clear', 'Selection cache cleared');
    }

    /**
     * Get mapping rules for debugging/inspection
     */
    getMappingRules(): MappingRule[] {
        return [...this.mappingRules];
    }
}