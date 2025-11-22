/**
 * TagSemanticMapper - Phase 4.2: Tag-Based Musical Semantics
 * 
 * Provides sophisticated mapping of semantic tags to musical characteristics.
 * Analyzes emotional, functional, and topical tags to determine optimal 
 * instrument selection and musical parameters with complexity analysis.
 */

import { App } from 'obsidian';
import { EnhancedGraphNode, MusicalContext } from '../../graph/types';
import { InstrumentConfig, getAllInstruments } from '../configs';
import {
    TagMappingConfig,
    TagSemanticAnalysis,
    DEFAULT_TAG_MAPPINGS
} from './SemanticMappingConfig';
import { MusicalProperties, ContentAwareMappingConfig } from './ContentAwareMapper';
import { getLogger } from '../../logging';

const logger = getLogger('tag-semantic-mapper');

/**
 * Semantic mapping result with detailed tag analysis
 */
export interface SemanticMappingResult {
    analysis: TagSemanticAnalysis;
    selectedInstrument: string;
    instrumentConfig: InstrumentConfig;
    musicalProperties: MusicalProperties;
    confidence: number;
    reasoning: string[];
    alternativeInstruments: string[];
    semanticMatches: {
        emotional: string[];
        functional: string[];
        topical: string[];
    };
    complexityFactors: {
        tagComplexity: number;
        semanticRelationships: number;
        temporalInfluence: number;
    };
    analysisTime: number;
}

/**
 * Tag semantic mapper configuration
 */
export interface TagSemanticMapperConfig extends ContentAwareMappingConfig {
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
}

export class TagSemanticMapper {
    private app: App;
    private config: TagSemanticMapperConfig;
    private tagMappings: TagMappingConfig;
    private availableInstruments: Map<string, InstrumentConfig>;
    private mappingCache: Map<string, SemanticMappingResult>;
    private readonly CACHE_TTL = 300000; // 5 minutes
    private cacheTimestamps: Map<string, number>;

    constructor(app: App, config: TagSemanticMapperConfig) {
        this.app = app;
        this.config = config;
        this.tagMappings = this.mergeTagMappings(DEFAULT_TAG_MAPPINGS, config.tagSemantics.customTagMappings);
        this.availableInstruments = new Map(Object.entries(getAllInstruments()));
        this.mappingCache = new Map();
        this.cacheTimestamps = new Map();

        logger.info('tag-semantic-mapper-init', 'TagSemanticMapper initialized', {
            availableInstruments: this.availableInstruments.size,
            semanticMappingEnabled: config.tagSemantics.enabled,
            customTagMappings: !!config.tagSemantics.customTagMappings
        });
    }

    /**
     * Perform complete semantic analysis of tags and generate musical mapping
     */
    performSemanticMapping(node: EnhancedGraphNode, context?: MusicalContext): SemanticMappingResult {
        if (!this.config.tagSemantics.enabled) {
            return this.createFallbackMapping(node);
        }

        const cacheKey = this.generateCacheKey(node, context);
        if (this.isMappingCached(cacheKey)) {
            logger.debug('semantic-cache-hit', `Using cached semantic mapping for ${node.path}`);
            return this.mappingCache.get(cacheKey);
        }

        const startTime = performance.now();
        const reasoning: string[] = [];

        try {
            // Step 1: Extract and normalize tags
            void reasoning.push('Extracting and normalizing tags');
            const tags = this.extractTags(node);
            
            if (tags.length === 0) {
                logger.debug('no-tags-found', `No tags found for ${node.path}, using fallback`);
                return this.createFallbackMapping(node);
            }

            // Step 2: Perform semantic analysis
            void reasoning.push('Performing semantic tag analysis');
            const analysis = this.performSemanticAnalysis(tags, node, context);

            // Step 3: Select instrument based on semantic analysis
            void reasoning.push('Selecting instrument based on semantic analysis');
            const { instrument, instrumentConfig, confidence, alternativeInstruments } =
                this.selectInstrumentFromSemantics(analysis, tags);

            // Step 4: Generate musical properties
            void reasoning.push('Generating musical properties from semantic analysis');
            const musicalProperties = this.generateMusicalPropertiesFromSemantics(analysis, node, context);

            // Step 5: Identify semantic matches
            const semanticMatches = this.identifySemanticMatches(tags, analysis);

            // Step 6: Calculate complexity factors
            const complexityFactors = this.calculateComplexityFactors(analysis, tags);

            const analysisTime = performance.now() - startTime;

            const result: SemanticMappingResult = {
                analysis,
                selectedInstrument: instrument,
                instrumentConfig,
                musicalProperties,
                confidence,
                reasoning,
                alternativeInstruments,
                semanticMatches,
                complexityFactors,
                analysisTime
            };

            // Cache the result
            this.mappingCache.set(cacheKey, result);
            this.cacheTimestamps.set(cacheKey, Date.now());

            logger.debug('semantic-mapping-complete', `Semantic mapping complete for ${node.path}`, {
                analysisTime: analysisTime.toFixed(2) + 'ms',
                selectedInstrument: instrument,
                confidence: confidence.toFixed(2),
                tagCount: tags.length,
                emotionalValence: analysis.emotionalContext.valence.toFixed(2),
                functionalComplexity: analysis.functionalContext.complexity.toFixed(2)
            });

            return result;

        } catch (error) {
            logger.error('semantic-mapping-error', `Semantic mapping failed for ${node.path}`, { 
                error: error.message, 
                tags: this.extractTags(node) 
            });
            return this.createFallbackMapping(node, startTime);
        }
    }

    /**
     * Extract and normalize tags from node
     */
    private extractTags(node: EnhancedGraphNode): string[] {
        const tags = new Set<string>();
        
        // Extract from metadata tags
        if (node.metadata?.tags) {
            node.metadata.tags.forEach(tag => tags.add(this.normalizeTag(tag)));
        }

        // Extract from legacy tags array  
        if (node.tags) {
            node.tags.forEach(tag => tags.add(this.normalizeTag(tag)));
        }

        // Extract from frontmatter tags
        if (node.metadata?.frontmatter?.tags) {
            const frontmatterTags = Array.isArray(node.metadata.frontmatter.tags) 
                ? node.metadata.frontmatter.tags 
                : [node.metadata.frontmatter.tags];
            frontmatterTags.forEach(tag => tags.add(this.normalizeTag(String(tag))));
        }

        return Array.from(tags);
    }

    /**
     * Normalize tag by removing # prefix and converting to lowercase
     */
    private normalizeTag(tag: string): string {
        return tag.replace(/^#/, '').toLowerCase().trim();
    }

    /**
     * Perform comprehensive semantic analysis of tags
     */
    private performSemanticAnalysis(
        tags: string[], 
        node: EnhancedGraphNode, 
        context?: MusicalContext
    ): TagSemanticAnalysis {
        const emotionalContext = this.analyzeEmotionalContext(tags);
        const functionalContext = this.analyzeFunctionalContext(tags);
        const topicalContext = this.analyzeTopicalContext(tags);
        const complexity = this.analyzeTagComplexity(tags);
        const temporalContext = this.analyzeTemporalContext(tags);

        return {
            emotionalContext,
            functionalContext,
            topicalContext,
            complexity,
            temporalContext
        };
    }

    /**
     * Analyze emotional context from tags
     */
    private analyzeEmotionalContext(tags: string[]): TagSemanticAnalysis['emotionalContext'] {
        let valence = 0; // -1 (negative) to 1 (positive)
        let intensity = 0; // 0 to 1
        let dominantEmotion: string | undefined;

        // Define emotional tag categories with weights
        const emotionalTags = {
            positive: { tags: ['happy', 'joy', 'excited', 'success', 'achievement', 'love', 'hope'], weight: 1 },
            negative: { tags: ['sad', 'angry', 'frustrated', 'failure', 'problem', 'issue', 'concern'], weight: -1 },
            high_intensity: { tags: ['urgent', 'critical', 'important', 'deadline', 'crisis', 'breakthrough'], weight: 0.8 },
            low_intensity: { tags: ['calm', 'peaceful', 'routine', 'maintenance', 'casual', 'background'], weight: 0.2 }
        };

        let emotionCounts: Record<string, number> = {};
        let totalEmotionalWeight = 0;

        tags.forEach(tag => {
            Object.entries(emotionalTags).forEach(([category, config]) => {
                if (config.tags.some(emotionalTag => tag.includes(emotionalTag))) {
                    emotionCounts[category] = (emotionCounts[category] || 0) + 1;
                    if (category === 'positive' || category === 'negative') {
                        valence += config.weight;
                        totalEmotionalWeight++;
                    }
                    if (category === 'high_intensity' || category === 'low_intensity') {
                        intensity += config.weight;
                    }
                }
            });
        });

        // Normalize valence
        if (totalEmotionalWeight > 0) {
            valence = Math.max(-1, Math.min(1, valence / totalEmotionalWeight));
        }

        // Determine dominant emotion
        const maxEmotionCount = Math.max(...Object.values(emotionCounts));
        if (maxEmotionCount > 0) {
            dominantEmotion = Object.entries(emotionCounts)
                .find(([, count]) => count === maxEmotionCount)?.[0];
        }

        // Normalize intensity
        intensity = Math.max(0, Math.min(1, intensity));

        return {
            valence,
            intensity: intensity || 0.5, // Default to medium intensity
            dominantEmotion
        };
    }

    /**
     * Analyze functional context from tags
     */
    private analyzeFunctionalContext(tags: string[]): TagSemanticAnalysis['functionalContext'] {
        const functionalCategories = {
            ideation: ['idea', 'insight', 'brainstorm', 'creative', 'inspiration'],
            organization: ['project', 'task', 'planning', 'structure', 'organize'],
            reflection: ['journal', 'daily', 'retrospective', 'review', 'reflection'],
            analysis: ['research', 'analysis', 'investigation', 'study', 'examination'],
            creation: ['creative', 'design', 'writing', 'development', 'build'],
            execution: ['implementation', 'execution', 'action', 'work', 'doing']
        };

        let primaryFunction = 'general';
        let maxMatches = 0;
        let complexity = 0.5; // Base complexity
        let urgency = 0.3; // Base urgency

        // Find dominant functional category
        Object.entries(functionalCategories).forEach(([category, categoryTags]) => {
            const matches = tags.filter(tag => 
                categoryTags.some(funcTag => tag.includes(funcTag))
            ).length;

            if (matches > maxMatches) {
                maxMatches = matches;
                primaryFunction = category;
            }
        });

        // Calculate complexity based on functional patterns
        const complexityIndicators = ['complex', 'advanced', 'detailed', 'comprehensive', 'thorough'];
        const urgencyIndicators = ['urgent', 'priority', 'critical', 'deadline', 'asap'];

        tags.forEach(tag => {
            if (complexityIndicators.some(indicator => tag.includes(indicator))) {
                complexity += 0.2;
            }
            if (urgencyIndicators.some(indicator => tag.includes(indicator))) {
                urgency += 0.3;
            }
        });

        return {
            primaryFunction,
            complexity: Math.min(1, complexity),
            urgency: Math.min(1, urgency)
        };
    }

    /**
     * Analyze topical context from tags
     */
    private analyzeTopicalContext(tags: string[]): TagSemanticAnalysis['topicalContext'] {
        const topicalCategories = {
            technical: ['programming', 'code', 'software', 'tech', 'development', 'algorithm'],
            humanities: ['literature', 'history', 'philosophy', 'language', 'culture', 'society'],
            scientific: ['science', 'research', 'experiment', 'data', 'analysis', 'hypothesis'],
            artistic: ['art', 'design', 'creative', 'visual', 'aesthetic', 'beauty'],
            business: ['business', 'strategy', 'market', 'finance', 'management', 'corporate'],
            personal: ['personal', 'journal', 'diary', 'thoughts', 'feelings', 'life']
        };

        let primaryTopic = 'general';
        let maxMatches = 0;
        let matchedCategories = 0;
        let specificity = 0.5;

        // Find dominant topical category and count matches
        Object.entries(topicalCategories).forEach(([category, categoryTags]) => {
            const matches = tags.filter(tag => 
                categoryTags.some(topicTag => tag.includes(topicTag))
            ).length;

            if (matches > 0) {
                matchedCategories++;
                if (matches > maxMatches) {
                    maxMatches = matches;
                    primaryTopic = category;
                }
            }
        });

        // Calculate specificity - more specific tags in fewer categories = higher specificity
        if (matchedCategories > 0) {
            specificity = maxMatches / (matchedCategories + tags.length * 0.1);
            specificity = Math.max(0, Math.min(1, specificity));
        }

        return {
            primaryTopic,
            specificity,
            interdisciplinary: matchedCategories > 1
        };
    }

    /**
     * Analyze tag complexity for musical mapping
     */
    private analyzeTagComplexity(tags: string[]): TagSemanticAnalysis['complexity'] {
        const config = this.tagMappings.complexityConfig;
        const tagCount = tags.length;
        
        // Calculate semantic relationships
        let semanticRelationships = 0;
        tags.forEach(tag => {
            const relationships = this.tagMappings.semanticRelationships[tag] || [];
            const relatedTags = tags.filter(t => relationships.includes(t));
            semanticRelationships += relatedTags.length;
        });

        // Calculate chord complexity
        let chordComplexity = config.chordComplexityMapping.singleTag;
        if (tagCount > 1) {
            chordComplexity += (tagCount - 1) * config.chordComplexityMapping.multipleTags;
            chordComplexity += semanticRelationships * config.chordComplexityMapping.semanticRelationshipBonus;
        }
        chordComplexity = Math.min(config.chordComplexityMapping.maxComplexity, chordComplexity);

        // Calculate velocity multiplier
        let velocityMultiplier = config.velocityIntensityMapping.baseVelocity;
        velocityMultiplier += tagCount * config.velocityIntensityMapping.tagCountMultiplier;
        
        // Check for priority/urgency tags
        const urgentTags = tags.filter(tag => 
            this.tagMappings.priorityTags.some(priorityTag => tag.includes(priorityTag))
        ).length;
        velocityMultiplier += urgentTags * config.velocityIntensityMapping.urgencyTagBonus;
        velocityMultiplier = Math.min(config.velocityIntensityMapping.maxVelocity, velocityMultiplier);

        // Generate harmonic intervals based on tag relationships
        const harmonicIntervals: number[] = [];
        if (semanticRelationships > 0) {
            void harmonicIntervals.push(...config.harmonicIntervalMapping.relatedTags);
        } else {
            void harmonicIntervals.push(...config.harmonicIntervalMapping.neutralTags);
        }

        return {
            tagCount,
            semanticRelationships,
            chordComplexity,
            velocityMultiplier,
            harmonicIntervals
        };
    }

    /**
     * Analyze temporal context from tags
     */
    private analyzeTemporalContext(tags: string[]): TagSemanticAnalysis['temporalContext'] {
        const { past, present, future } = this.tagMappings.temporalTags;
        const config = this.tagMappings.complexityConfig.temporalMapping;

        let pastCount = 0, presentCount = 0, futureCount = 0;

        tags.forEach(tag => {
            if (past.some(t => tag.includes(t))) pastCount++;
            if (present.some(t => tag.includes(t))) presentCount++;
            if (future.some(t => tag.includes(t))) futureCount++;
        });

        // Determine dominant timeframe
        let timeframe: 'past' | 'present' | 'future' | 'mixed' = 'present'; // Default
        let temporalModifiers: TagSemanticAnalysis['temporalContext']['temporalModifiers'] = {};

        if (pastCount > presentCount && pastCount > futureCount) {
            timeframe = 'past';
            temporalModifiers = config.pastTags;
        } else if (futureCount > presentCount && futureCount > pastCount) {
            timeframe = 'future';
            temporalModifiers = config.futureTags;
        } else if (presentCount > 0 || (pastCount === 0 && futureCount === 0)) {
            timeframe = 'present';
            temporalModifiers = config.presentTags;
        } else if (pastCount > 0 && futureCount > 0) {
            timeframe = 'mixed';
            // Blend modifiers for mixed timeframe
            temporalModifiers = {
                ...config.presentTags,
                delay: config.pastTags.delay * 0.5,
                reverb: config.pastTags.reverb * 0.5,
                anticipation: config.futureTags.anticipation * 0.5
            };
        }

        return { timeframe, temporalModifiers };
    }

    /**
     * Select instrument based on semantic analysis
     */
    private selectInstrumentFromSemantics(
        analysis: TagSemanticAnalysis,
        tags: string[]
    ): {
        instrument: string;
        instrumentConfig: InstrumentConfig;
        confidence: number;
        alternativeInstruments: string[];
    } {
        const weightings = this.config.tagSemantics.weightings;
        let candidateInstruments: string[] = [];
        let confidence = 0.5; // Base confidence

        // Get instruments based on emotional context
        if (weightings.emotional > 0) {
            const emotionalInstruments = this.getEmotionalInstruments(analysis.emotionalContext);
            void candidateInstruments.push(...emotionalInstruments);
            confidence += weightings.emotional * 0.8;
        }

        // Get instruments based on functional context  
        if (weightings.functional > 0) {
            const functionalInstruments = this.getFunctionalInstruments(analysis.functionalContext);
            void candidateInstruments.push(...functionalInstruments);
            confidence += weightings.functional * 0.9;
        }

        // Get instruments based on topical context
        if (weightings.topical > 0) {
            const topicalInstruments = this.getTopicalInstruments(analysis.topicalContext);
            void candidateInstruments.push(...topicalInstruments);
            confidence += weightings.topical * 0.7;
        }

        // Remove duplicates and select the best instrument
        candidateInstruments = [...new Set(candidateInstruments)];
        
        if (candidateInstruments.length === 0) {
            candidateInstruments = ['piano', 'electricPiano', 'violin']; // Fallback
            confidence = 0.3;
        }

        // Select primary instrument (most frequently suggested or first)
        const instrumentCounts: Record<string, number> = {};
        candidateInstruments.forEach(instrument => {
            instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
        });

        const sortedInstruments = Object.entries(instrumentCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([instrument]) => instrument);

        const selectedInstrument = sortedInstruments[0];
        const instrumentConfig = this.availableInstruments.get(selectedInstrument);

        if (!instrumentConfig) {
            throw new Error(`Instrument ${selectedInstrument} not found in available instruments`);
        }

        // Generate alternatives
        const alternativeInstruments = sortedInstruments.slice(1, 4);

        // Adjust confidence based on analysis quality
        if (analysis.complexity.tagCount > 3) confidence += 0.1;
        if (analysis.complexity.semanticRelationships > 0) confidence += 0.1;
        if (analysis.emotionalContext.valence !== 0) confidence += 0.05;

        return {
            instrument: selectedInstrument,
            instrumentConfig,
            confidence: Math.min(1, confidence),
            alternativeInstruments
        };
    }

    /**
     * Get instrument recommendations based on emotional context
     */
    private getEmotionalInstruments(emotional: TagSemanticAnalysis['emotionalContext']): string[] {
        const mapping = this.tagMappings.emotionalTags.default;
        
        if (emotional.valence > 0.3) {
            return mapping.positiveInstruments;
        } else if (emotional.valence < -0.3) {
            return mapping.negativeInstruments;
        } else {
            return mapping.neutralInstruments;
        }
    }

    /**
     * Get instrument recommendations based on functional context
     */
    private getFunctionalInstruments(functional: TagSemanticAnalysis['functionalContext']): string[] {
        const mapping = this.tagMappings.functionalTags.default;
        
        switch (functional.primaryFunction) {
            case 'ideation':
                return mapping.ideationInstruments;
            case 'organization':
                return mapping.organizationalInstruments;
            case 'reflection':
                return mapping.reflectiveInstruments;
            case 'analysis':
                return mapping.analyticalInstruments;
            case 'creation':
                return mapping.creativeInstruments;
            case 'execution':
                return mapping.taskInstruments;
            default:
                return mapping.taskInstruments; // Default to task instruments
        }
    }

    /**
     * Get instrument recommendations based on topical context  
     */
    private getTopicalInstruments(topical: TagSemanticAnalysis['topicalContext']): string[] {
        const mapping = this.tagMappings.topicalTags.default;
        
        switch (topical.primaryTopic) {
            case 'technical':
                return mapping.technicalInstruments;
            case 'humanities':
                return mapping.humanitiesInstruments;
            case 'scientific':
                return mapping.scientificInstruments;
            case 'artistic':
                return mapping.artisticInstruments;
            case 'business':
                return mapping.businessInstruments;
            case 'personal':
                return mapping.personalInstruments;
            default:
                return mapping.personalInstruments; // Default to personal instruments
        }
    }

    /**
     * Generate musical properties from semantic analysis
     */
    private generateMusicalPropertiesFromSemantics(
        analysis: TagSemanticAnalysis,
        node: EnhancedGraphNode,
        context?: MusicalContext
    ): MusicalProperties {
        // Base properties
        let pitchRange: [number, number] = [60, 72]; // Middle C octave
        let noteDuration = 1.0;
        let velocity = 0.7;
        let instrumentRichness = 0.5;
        let spatialPosition = { pan: 0, reverb: 0.3, delay: 0.1 };
        let rhythmicComplexity = 0.4;
        let harmonicDensity = 0.5;

        // Apply emotional modifiers
        if (analysis.emotionalContext.valence > 0) {
            pitchRange = [66, 84]; // Higher for positive emotions
            velocity += 0.1;
        } else if (analysis.emotionalContext.valence < 0) {
            pitchRange = [48, 66]; // Lower for negative emotions
            velocity -= 0.1;
        }

        velocity += analysis.emotionalContext.intensity * 0.3;

        // Apply functional modifiers
        switch (analysis.functionalContext.primaryFunction) {
            case 'ideation':
                harmonicDensity += 0.2;
                rhythmicComplexity += 0.1;
                instrumentRichness += 0.2;
                break;
            case 'organization':
                rhythmicComplexity += 0.3;
                noteDuration *= 0.8; // Shorter, more structured
                break;
            case 'reflection':
                spatialPosition.reverb += 0.2;
                noteDuration *= 1.3; // Longer, more contemplative
                velocity -= 0.1;
                break;
            case 'analysis':
                pitchRange = [54, 72]; // Mid-range for clarity
                harmonicDensity += 0.3;
                break;
        }

        // Apply complexity modifiers
        harmonicDensity += analysis.complexity.chordComplexity * 0.4;
        velocity *= analysis.complexity.velocityMultiplier;
        rhythmicComplexity += Math.min(0.3, analysis.complexity.tagCount * 0.05);

        // Apply temporal modifiers
        if (analysis.temporalContext.temporalModifiers.delay) {
            spatialPosition.delay += analysis.temporalContext.temporalModifiers.delay;
        }
        if (analysis.temporalContext.temporalModifiers.reverb) {
            spatialPosition.reverb += analysis.temporalContext.temporalModifiers.reverb;
        }

        // Apply topical modifiers
        switch (analysis.topicalContext.primaryTopic) {
            case 'technical':
                pitchRange = [60, 84]; // Higher range for tech
                instrumentRichness += 0.2;
                break;
            case 'artistic':
                harmonicDensity += 0.3;
                instrumentRichness += 0.3;
                break;
            case 'scientific':
                rhythmicComplexity += 0.2;
                harmonicDensity += 0.2;
                break;
        }

        // Clamp all values to appropriate ranges
        return {
            pitchRange,
            noteDuration: Math.max(0.1, Math.min(3.0, noteDuration)),
            velocity: Math.max(0.1, Math.min(1.0, velocity)),
            instrumentRichness: Math.max(0.0, Math.min(1.0, instrumentRichness)),
            spatialPosition: {
                pan: Math.max(-1, Math.min(1, spatialPosition.pan)),
                reverb: Math.max(0, Math.min(1, spatialPosition.reverb)),
                delay: Math.max(0, Math.min(0.5, spatialPosition.delay))
            },
            rhythmicComplexity: Math.max(0.0, Math.min(1.0, rhythmicComplexity)),
            harmonicDensity: Math.max(0.0, Math.min(1.0, harmonicDensity))
        };
    }

    /**
     * Identify semantic matches for detailed analysis
     */
    private identifySemanticMatches(tags: string[], analysis: TagSemanticAnalysis): {
        emotional: string[];
        functional: string[];
        topical: string[];
    } {
        // This is a simplified implementation - could be expanded with more sophisticated matching
        return {
            emotional: tags.filter(tag => 
                ['happy', 'sad', 'excited', 'calm', 'urgent', 'peaceful'].some(emotion => 
                    tag.includes(emotion)
                )
            ),
            functional: tags.filter(tag => 
                ['idea', 'project', 'task', 'journal', 'research', 'creative'].some(func => 
                    tag.includes(func)
                )
            ),
            topical: tags.filter(tag => 
                ['tech', 'art', 'science', 'business', 'personal', 'philosophy'].some(topic => 
                    tag.includes(topic)
                )
            )
        };
    }

    /**
     * Calculate complexity factors for analysis
     */
    private calculateComplexityFactors(analysis: TagSemanticAnalysis, tags: string[]): {
        tagComplexity: number;
        semanticRelationships: number;
        temporalInfluence: number;
    } {
        return {
            tagComplexity: Math.min(1, analysis.complexity.tagCount / 10), // Normalize to 0-1
            semanticRelationships: Math.min(1, analysis.complexity.semanticRelationships / 5),
            temporalInfluence: analysis.temporalContext.timeframe === 'mixed' ? 0.8 : 0.4
        };
    }

    /**
     * Generate cache key for semantic mapping
     */
    private generateCacheKey(node: EnhancedGraphNode, context?: MusicalContext): string {
        const contextKey = context ? `${context.currentAnimationProgress}-${context.vaultActivityLevel}` : 'no-context';
        return `${node.path}-${node.modified}-${contextKey}`;
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
     * Merge default tag mappings with custom configuration
     */
    private mergeTagMappings(
        defaultMappings: TagMappingConfig, 
        customMappings?: Partial<TagMappingConfig>
    ): TagMappingConfig {
        if (!customMappings) return defaultMappings;

        return {
            emotionalTags: { ...defaultMappings.emotionalTags, ...customMappings.emotionalTags },
            functionalTags: { ...defaultMappings.functionalTags, ...customMappings.functionalTags },
            topicalTags: { ...defaultMappings.topicalTags, ...customMappings.topicalTags },
            complexityConfig: { ...defaultMappings.complexityConfig, ...customMappings.complexityConfig },
            semanticRelationships: { ...defaultMappings.semanticRelationships, ...customMappings.semanticRelationships },
            priorityTags: customMappings.priorityTags || defaultMappings.priorityTags,
            temporalTags: { ...defaultMappings.temporalTags, ...customMappings.temporalTags }
        };
    }

    /**
     * Create fallback mapping when semantic analysis is disabled or fails
     */
    private createFallbackMapping(node: EnhancedGraphNode, startTime?: number): SemanticMappingResult {
        const analysisTime = startTime ? performance.now() - startTime : 0;
        const defaultInstrument = 'piano';
        const defaultConfig = this.availableInstruments.get(defaultInstrument);

        return {
            analysis: {
                emotionalContext: { valence: 0, intensity: 0.5 },
                functionalContext: { primaryFunction: 'general', complexity: 0.5, urgency: 0.3 },
                topicalContext: { primaryTopic: 'general', specificity: 0.5, interdisciplinary: false },
                complexity: { 
                    tagCount: 0, 
                    semanticRelationships: 0, 
                    chordComplexity: 0.3, 
                    velocityMultiplier: 0.7, 
                    harmonicIntervals: [3, 7] 
                },
                temporalContext: { timeframe: 'present', temporalModifiers: {} }
            },
            selectedInstrument: defaultInstrument,
            instrumentConfig: defaultConfig,
            musicalProperties: {
                pitchRange: [60, 72],
                noteDuration: 1.0,
                velocity: 0.7,
                instrumentRichness: 0.5,
                spatialPosition: { pan: 0, reverb: 0.3, delay: 0.1 },
                rhythmicComplexity: 0.4,
                harmonicDensity: 0.5
            },
            confidence: 0.3,
            reasoning: ['Semantic analysis disabled or no tags found', 'Using fallback mapping'],
            alternativeInstruments: ['electricPiano', 'violin', 'flute'],
            semanticMatches: { emotional: [], functional: [], topical: [] },
            complexityFactors: { tagComplexity: 0, semanticRelationships: 0, temporalInfluence: 0 },
            analysisTime
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config: TagSemanticMapperConfig): void {
        this.config = config;
        this.tagMappings = this.mergeTagMappings(DEFAULT_TAG_MAPPINGS, config.tagSemantics.customTagMappings);
        
        // Clear cache when configuration changes
        this.mappingCache.clear();
        this.cacheTimestamps.clear();
        
        void logger.info('tag-semantic-config-update', 'Configuration updated, cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; avgAnalysisTime: number } {
        const results = Array.from(this.mappingCache.values());
        const avgAnalysisTime = results.length > 0 
            ? results.reduce((sum, r) => sum + r.analysisTime, 0) / results.length 
            : 0;

        return {
            size: this.mappingCache.size,
            avgAnalysisTime
        };
    }

    /**
     * Clear all caches
     */
    clearCaches(): void {
        this.mappingCache.clear();
        this.cacheTimestamps.clear();
        void logger.info('tag-semantic-cache-clear', 'Cache cleared');
    }
}