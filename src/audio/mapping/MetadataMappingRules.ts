/**
 * MetadataMappingRules - Phase 2.1: User-Defined Frontmatter Properties
 * 
 * Provides flexible rule system for mapping metadata properties to musical characteristics.
 * Supports user-defined frontmatter properties and dynamic rule evaluation.
 */

import { CachedMetadata } from 'obsidian';
import { InstrumentMapping } from '../../graph/types';
import { getLogger } from '../../logging';

const logger = getLogger('metadata-mapping-rules');

/**
 * Rule condition types for metadata evaluation
 */
export interface MetadataCondition {
    type: 'tag' | 'frontmatter' | 'fileExtension' | 'pathPattern' | 'fileSize' | 'fileAge';
    operator: 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan' | 'between';
    value: any;
    caseSensitive?: boolean;
}

/**
 * Musical property assignment
 */
export interface MusicalProperty {
    instrument?: string;
    instrumentFamily?: string;
    velocity?: number;
    duration?: number;
    pitch?: number;
    reverb?: number;
    pan?: number;
    priority: number;
}

/**
 * Complete mapping rule
 */
export interface MappingRule {
    id: string;
    name: string;
    description: string;
    conditions: MetadataCondition[];
    properties: MusicalProperty;
    enabled: boolean;
    created: number;
    modified: number;
}

/**
 * Rule evaluation result
 */
export interface RuleEvaluationResult {
    ruleId: string;
    matched: boolean;
    properties?: MusicalProperty;
    matchReason?: string;
    evaluationTime: number;
}

/**
 * Frontmatter property schema for documentation
 */
export interface FrontmatterSchema {
    [property: string]: {
        type: 'string' | 'number' | 'boolean' | 'array';
        description: string;
        examples: any[];
        defaultValue?: any;
        validation?: (value: any) => boolean;
    };
}

export class MetadataMappingRules {
    private rules: Map<string, MappingRule>;
    private evaluationCache: Map<string, RuleEvaluationResult[]>;
    private frontmatterSchema: FrontmatterSchema;
    private readonly CACHE_TTL = 300000; // 5 minutes
    private cacheTimestamps: Map<string, number>;

    constructor() {
        this.rules = new Map();
        this.evaluationCache = new Map();
        this.cacheTimestamps = new Map();
        this.frontmatterSchema = {};
        
        this.initializeDefaultRules();
        this.initializeFrontmatterSchema();
        
        logger.info('mapping-rules-init', 'MetadataMappingRules initialized');
    }

    /**
     * Add or update a mapping rule
     */
    addRule(rule: Omit<MappingRule, 'id' | 'created' | 'modified'>): string {
        const id = this.generateRuleId();
        const now = Date.now();
        
        const fullRule: MappingRule = {
            ...rule,
            id,
            created: now,
            modified: now
        };

        this.rules.set(id, fullRule);
        this.clearEvaluationCache(); // Rules changed, invalidate cache
        
        logger.info('rule-added', `Added mapping rule: ${rule.name}`, {
            ruleId: id,
            conditions: rule.conditions.length,
            instrument: rule.properties.instrument
        });

        return id;
    }

    /**
     * Update an existing mapping rule
     */
    updateRule(id: string, updates: Partial<MappingRule>): boolean {
        const existingRule = this.rules.get(id);
        if (!existingRule) {
            logger.warn('rule-update-failed', `Rule not found: ${id}`);
            return false;
        }

        const updatedRule: MappingRule = {
            ...existingRule,
            ...updates,
            id, // Preserve ID
            created: existingRule.created, // Preserve creation time
            modified: Date.now()
        };

        this.rules.set(id, updatedRule);
        this.clearEvaluationCache(); // Rules changed, invalidate cache
        
        logger.info('rule-updated', `Updated mapping rule: ${updatedRule.name}`, { ruleId: id });
        return true;
    }

    /**
     * Remove a mapping rule
     */
    removeRule(id: string): boolean {
        const removed = this.rules.delete(id);
        if (removed) {
            this.clearEvaluationCache();
            logger.info('rule-removed', `Removed mapping rule: ${id}`);
        }
        return removed;
    }

    /**
     * Get all mapping rules
     */
    getAllRules(): MappingRule[] {
        return Array.from(this.rules.values()).sort((a, b) => b.properties.priority - a.properties.priority);
    }

    /**
     * Get enabled mapping rules only
     */
    getEnabledRules(): MappingRule[] {
        return this.getAllRules().filter(rule => rule.enabled);
    }

    /**
     * Evaluate metadata against all enabled rules
     */
    evaluateMetadata(filePath: string, metadata: CachedMetadata | null, fileStats: { size: number; ctime: number; mtime: number; extension: string }): RuleEvaluationResult[] {
        const cacheKey = this.generateCacheKey(filePath, metadata, fileStats);
        
        // Check cache first
        if (this.isEvaluationCached(cacheKey)) {
            logger.debug('cache-hit', `Using cached rule evaluation for ${filePath}`);
            return this.evaluationCache.get(cacheKey)!;
        }

        const startTime = performance.now();
        const results: RuleEvaluationResult[] = [];
        const enabledRules = this.getEnabledRules();

        for (const rule of enabledRules) {
            const result = this.evaluateRule(rule, filePath, metadata, fileStats);
            results.push(result);
        }

        const evaluationTime = performance.now() - startTime;
        
        // Cache results
        this.evaluationCache.set(cacheKey, results);
        this.cacheTimestamps.set(cacheKey, Date.now());

        logger.debug('rules-evaluation', `Evaluated ${enabledRules.length} rules for ${filePath}`, {
            evaluationTime: evaluationTime.toFixed(2) + 'ms',
            matchedRules: results.filter(r => r.matched).length,
            totalRules: enabledRules.length
        });

        return results;
    }

    /**
     * Get the highest priority matching rule result
     */
    getBestMatch(filePath: string, metadata: CachedMetadata | null, fileStats: { size: number; ctime: number; mtime: number; extension: string }): RuleEvaluationResult | null {
        const results = this.evaluateMetadata(filePath, metadata, fileStats);
        const matchedResults = results.filter(r => r.matched);
        
        if (matchedResults.length === 0) {
            return null;
        }

        // Sort by priority and return the best match
        matchedResults.sort((a, b) => (b.properties?.priority || 0) - (a.properties?.priority || 0));
        return matchedResults[0];
    }

    /**
     * Evaluate a single rule against metadata
     */
    private evaluateRule(rule: MappingRule, filePath: string, metadata: CachedMetadata | null, fileStats: { size: number; ctime: number; mtime: number; extension: string }): RuleEvaluationResult {
        const startTime = performance.now();
        let matched = true;
        let matchReason = '';

        // All conditions must be true for rule to match
        for (const condition of rule.conditions) {
            const conditionResult = this.evaluateCondition(condition, filePath, metadata, fileStats);
            if (!conditionResult.matched) {
                matched = false;
                matchReason = `Condition failed: ${conditionResult.reason}`;
                break;
            }
        }

        const evaluationTime = performance.now() - startTime;

        if (matched && rule.conditions.length > 0) {
            matchReason = `All ${rule.conditions.length} conditions matched`;
        }

        return {
            ruleId: rule.id,
            matched,
            properties: matched ? rule.properties : undefined,
            matchReason,
            evaluationTime
        };
    }

    /**
     * Evaluate a single condition
     */
    private evaluateCondition(condition: MetadataCondition, filePath: string, metadata: CachedMetadata | null, fileStats: { size: number; ctime: number; mtime: number; extension: string }): { matched: boolean; reason: string } {
        switch (condition.type) {
            case 'tag':
                return this.evaluateTagCondition(condition, metadata);
            
            case 'frontmatter':
                return this.evaluateFrontmatterCondition(condition, metadata);
            
            case 'fileExtension':
                return this.evaluateFileExtensionCondition(condition, fileStats.extension);
            
            case 'pathPattern':
                return this.evaluatePathPatternCondition(condition, filePath);
            
            case 'fileSize':
                return this.evaluateFileSizeCondition(condition, fileStats.size);
            
            case 'fileAge':
                return this.evaluateFileAgeCondition(condition, fileStats.ctime, fileStats.mtime);
            
            default:
                return { matched: false, reason: `Unknown condition type: ${condition.type}` };
        }
    }

    /**
     * Evaluate tag-based condition
     */
    private evaluateTagCondition(condition: MetadataCondition, metadata: CachedMetadata | null): { matched: boolean; reason: string } {
        const tags = metadata?.tags?.map(t => t.tag) || [];
        
        switch (condition.operator) {
            case 'equals':
                const hasTag = tags.includes(condition.value);
                return { matched: hasTag, reason: hasTag ? `Has tag ${condition.value}` : `Missing tag ${condition.value}` };
            
            case 'contains':
                const hasPartialTag = tags.some(tag => 
                    condition.caseSensitive ? 
                    tag.includes(condition.value) : 
                    tag.toLowerCase().includes(condition.value.toLowerCase())
                );
                return { matched: hasPartialTag, reason: hasPartialTag ? `Tag contains ${condition.value}` : `No tag contains ${condition.value}` };
            
            default:
                return { matched: false, reason: `Unsupported operator for tags: ${condition.operator}` };
        }
    }

    /**
     * Evaluate frontmatter-based condition
     */
    private evaluateFrontmatterCondition(condition: MetadataCondition, metadata: CachedMetadata | null): { matched: boolean; reason: string } {
        const frontmatter = metadata?.frontmatter;
        if (!frontmatter) {
            return { matched: false, reason: 'No frontmatter found' };
        }

        // Parse condition value as "property:expectedValue" or just "property" for existence check
        const [property, expectedValue] = condition.value.split(':');
        const actualValue = frontmatter[property];

        if (expectedValue === undefined) {
            // Just checking for property existence
            const exists = actualValue !== undefined;
            return { matched: exists, reason: exists ? `Has frontmatter property ${property}` : `Missing frontmatter property ${property}` };
        }

        switch (condition.operator) {
            case 'equals':
                const isEqual = actualValue === expectedValue;
                return { matched: isEqual, reason: isEqual ? `${property} equals ${expectedValue}` : `${property} (${actualValue}) does not equal ${expectedValue}` };
            
            case 'contains':
                if (typeof actualValue === 'string') {
                    const contains = condition.caseSensitive ? 
                        actualValue.includes(expectedValue) : 
                        actualValue.toLowerCase().includes(expectedValue.toLowerCase());
                    return { matched: contains, reason: contains ? `${property} contains ${expectedValue}` : `${property} does not contain ${expectedValue}` };
                }
                return { matched: false, reason: `${property} is not a string` };
            
            default:
                return { matched: false, reason: `Unsupported operator for frontmatter: ${condition.operator}` };
        }
    }

    /**
     * Evaluate file extension condition
     */
    private evaluateFileExtensionCondition(condition: MetadataCondition, extension: string): { matched: boolean; reason: string } {
        switch (condition.operator) {
            case 'equals':
                const matches = extension.toLowerCase() === condition.value.toLowerCase();
                return { matched: matches, reason: matches ? `Extension is ${extension}` : `Extension ${extension} does not match ${condition.value}` };
            
            default:
                return { matched: false, reason: `Unsupported operator for file extension: ${condition.operator}` };
        }
    }

    /**
     * Evaluate path pattern condition
     */
    private evaluatePathPatternCondition(condition: MetadataCondition, filePath: string): { matched: boolean; reason: string } {
        switch (condition.operator) {
            case 'contains':
                const contains = condition.caseSensitive ? 
                    filePath.includes(condition.value) : 
                    filePath.toLowerCase().includes(condition.value.toLowerCase());
                return { matched: contains, reason: contains ? `Path contains ${condition.value}` : `Path does not contain ${condition.value}` };
            
            case 'matches':
                try {
                    const regex = new RegExp(condition.value, condition.caseSensitive ? '' : 'i');
                    const matches = regex.test(filePath);
                    return { matched: matches, reason: matches ? `Path matches pattern ${condition.value}` : `Path does not match pattern ${condition.value}` };
                } catch (error) {
                    return { matched: false, reason: `Invalid regex pattern: ${condition.value}` };
                }
            
            default:
                return { matched: false, reason: `Unsupported operator for path pattern: ${condition.operator}` };
        }
    }

    /**
     * Evaluate file size condition
     */
    private evaluateFileSizeCondition(condition: MetadataCondition, fileSize: number): { matched: boolean; reason: string } {
        switch (condition.operator) {
            case 'greaterThan':
                const isGreater = fileSize > condition.value;
                return { matched: isGreater, reason: isGreater ? `File size ${fileSize} > ${condition.value}` : `File size ${fileSize} <= ${condition.value}` };
            
            case 'lessThan':
                const isLess = fileSize < condition.value;
                return { matched: isLess, reason: isLess ? `File size ${fileSize} < ${condition.value}` : `File size ${fileSize} >= ${condition.value}` };
            
            case 'between':
                const [min, max] = Array.isArray(condition.value) ? condition.value : [0, condition.value];
                const isBetween = fileSize >= min && fileSize <= max;
                return { matched: isBetween, reason: isBetween ? `File size ${fileSize} between ${min}-${max}` : `File size ${fileSize} not between ${min}-${max}` };
            
            default:
                return { matched: false, reason: `Unsupported operator for file size: ${condition.operator}` };
        }
    }

    /**
     * Evaluate file age condition
     */
    private evaluateFileAgeCondition(condition: MetadataCondition, ctime: number, mtime: number): { matched: boolean; reason: string } {
        const now = Date.now();
        const daysSinceCreated = (now - ctime) / (1000 * 60 * 60 * 24);
        const daysSinceModified = (now - mtime) / (1000 * 60 * 60 * 24);
        
        // Use the more recent of creation or modification
        const age = Math.min(daysSinceCreated, daysSinceModified);

        switch (condition.operator) {
            case 'lessThan':
                const isRecent = age < condition.value;
                return { matched: isRecent, reason: isRecent ? `File age ${age.toFixed(1)} days < ${condition.value}` : `File age ${age.toFixed(1)} days >= ${condition.value}` };
            
            case 'greaterThan':
                const isOld = age > condition.value;
                return { matched: isOld, reason: isOld ? `File age ${age.toFixed(1)} days > ${condition.value}` : `File age ${age.toFixed(1)} days <= ${condition.value}` };
            
            default:
                return { matched: false, reason: `Unsupported operator for file age: ${condition.operator}` };
        }
    }

    /**
     * Initialize default mapping rules
     */
    private initializeDefaultRules(): void {
        // Recent files get energetic instruments
        this.addRule({
            name: 'Recent Files',
            description: 'Recently modified files get bright, energetic instruments',
            conditions: [
                { type: 'fileAge', operator: 'lessThan', value: 7 } // Within 7 days
            ],
            properties: {
                instrumentFamily: 'electronic',
                instrument: 'leadSynth',
                priority: 0.8
            },
            enabled: true
        });

        // Journal entries get reflective instruments
        this.addRule({
            name: 'Journal Entries',
            description: 'Files tagged with journal get contemplative instruments',
            conditions: [
                { type: 'tag', operator: 'contains', value: 'journal', caseSensitive: false }
            ],
            properties: {
                instrument: 'harp',
                reverb: 0.3,
                priority: 0.9
            },
            enabled: true
        });

        // Project files get structured instruments
        this.addRule({
            name: 'Project Files',
            description: 'Files in Projects folder get structured instruments',
            conditions: [
                { type: 'pathPattern', operator: 'contains', value: 'Projects/', caseSensitive: false }
            ],
            properties: {
                instrumentFamily: 'brass',
                instrument: 'trumpet',
                priority: 0.7
            },
            enabled: true
        });

        // Ideas get bright, creative instruments
        this.addRule({
            name: 'Creative Ideas',
            description: 'Files tagged with idea or creative get bright instruments',
            conditions: [
                { type: 'tag', operator: 'contains', value: 'idea', caseSensitive: false }
            ],
            properties: {
                instrument: 'flute',
                velocity: 0.8,
                priority: 0.85
            },
            enabled: true
        });

        // Archive files get deep, sustained instruments
        this.addRule({
            name: 'Archive Files',
            description: 'Old files get deep, sustained instruments',
            conditions: [
                { type: 'fileAge', operator: 'greaterThan', value: 180 } // Older than 6 months
            ],
            properties: {
                instrumentFamily: 'strings',
                instrument: 'cello',
                reverb: 0.4,
                priority: 0.6
            },
            enabled: true
        });

        logger.info('default-rules', `Initialized ${this.rules.size} default mapping rules`);
    }

    /**
     * Initialize frontmatter schema for user guidance
     */
    private initializeFrontmatterSchema(): void {
        this.frontmatterSchema = {
            'instrument': {
                type: 'string',
                description: 'Specific instrument name for this file',
                examples: ['piano', 'violin', 'flute', 'leadSynth'],
                validation: (value) => typeof value === 'string' && value.length > 0
            },
            'musical-mood': {
                type: 'string',
                description: 'Musical mood or character',
                examples: ['contemplative', 'energetic', 'mysterious', 'joyful'],
                validation: (value) => typeof value === 'string'
            },
            'audio-priority': {
                type: 'string',
                description: 'Priority level for audio mapping',
                examples: ['high', 'medium', 'low'],
                defaultValue: 'medium',
                validation: (value) => ['high', 'medium', 'low'].includes(value)
            },
            'instrument-family': {
                type: 'string',
                description: 'Instrument family preference',
                examples: ['strings', 'brass', 'woodwinds', 'percussion', 'electronic'],
                validation: (value) => ['strings', 'brass', 'woodwinds', 'percussion', 'keyboard', 'electronic', 'world'].includes(value)
            },
            'musical-tempo': {
                type: 'number',
                description: 'Tempo modifier (0.5-2.0)',
                examples: [0.8, 1.0, 1.2, 1.5],
                defaultValue: 1.0,
                validation: (value) => typeof value === 'number' && value >= 0.5 && value <= 2.0
            },
            'reverb-amount': {
                type: 'number',
                description: 'Reverb amount (0.0-1.0)',
                examples: [0.0, 0.2, 0.5, 0.8],
                defaultValue: 0.3,
                validation: (value) => typeof value === 'number' && value >= 0.0 && value <= 1.0
            }
        };

        logger.debug('schema-init', `Initialized frontmatter schema with ${Object.keys(this.frontmatterSchema).length} properties`);
    }

    /**
     * Generate unique rule ID
     */
    private generateRuleId(): string {
        return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate cache key for rule evaluation
     */
    private generateCacheKey(filePath: string, metadata: CachedMetadata | null, fileStats: { size: number; ctime: number; mtime: number; extension: string }): string {
        const metadataHash = metadata ? 
            JSON.stringify({ 
                tags: metadata.tags?.map(t => t.tag) || [], 
                frontmatter: metadata.frontmatter || {} 
            }) : 'null';
        
        return `${filePath}-${fileStats.mtime}-${fileStats.size}-${metadataHash}`;
    }

    /**
     * Check if evaluation is cached and valid
     */
    private isEvaluationCached(cacheKey: string): boolean {
        if (!this.evaluationCache.has(cacheKey) || !this.cacheTimestamps.has(cacheKey)) {
            return false;
        }

        const timestamp = this.cacheTimestamps.get(cacheKey)!;
        return (Date.now() - timestamp) < this.CACHE_TTL;
    }

    /**
     * Clear evaluation cache
     */
    private clearEvaluationCache(): void {
        this.evaluationCache.clear();
        this.cacheTimestamps.clear();
        logger.debug('cache-clear', 'Rule evaluation cache cleared');
    }

    /**
     * Get frontmatter schema for UI generation
     */
    getFrontmatterSchema(): FrontmatterSchema {
        return { ...this.frontmatterSchema };
    }

    /**
     * Validate frontmatter property value
     */
    validateFrontmatterProperty(property: string, value: any): { valid: boolean; error?: string } {
        const schema = this.frontmatterSchema[property];
        if (!schema) {
            return { valid: true }; // Unknown properties are allowed
        }

        if (schema.validation) {
            try {
                const isValid = schema.validation(value);
                return { valid: isValid, error: isValid ? undefined : `Invalid value for ${property}` };
            } catch (error) {
                return { valid: false, error: `Validation failed for ${property}: ${error}` };
            }
        }

        return { valid: true };
    }

    /**
     * Get cache and performance statistics
     */
    getStats(): { rules: number; cacheSize: number; cacheHits: number; avgEvaluationTime: number } {
        const allResults = Array.from(this.evaluationCache.values()).flat();
        const avgEvaluationTime = allResults.length > 0 
            ? allResults.reduce((sum, r) => sum + r.evaluationTime, 0) / allResults.length 
            : 0;

        return {
            rules: this.rules.size,
            cacheSize: this.evaluationCache.size,
            cacheHits: 0, // Would need hit/miss tracking
            avgEvaluationTime
        };
    }

    /**
     * Export rules for backup/sharing
     */
    exportRules(): MappingRule[] {
        return this.getAllRules();
    }

    /**
     * Import rules from backup/sharing
     */
    importRules(rules: MappingRule[], replace: boolean = false): { imported: number; errors: string[] } {
        if (replace) {
            this.rules.clear();
        }

        let imported = 0;
        const errors: string[] = [];

        for (const rule of rules) {
            try {
                // Validate rule structure
                if (!rule.name || !rule.conditions || !rule.properties) {
                    errors.push(`Invalid rule structure: ${rule.name || 'unnamed'}`);
                    continue;
                }

                // Generate new ID to avoid conflicts
                const newId = this.generateRuleId();
                const importedRule: MappingRule = {
                    ...rule,
                    id: newId,
                    created: Date.now(),
                    modified: Date.now()
                };

                this.rules.set(newId, importedRule);
                imported++;
            } catch (error) {
                errors.push(`Failed to import rule ${rule.name}: ${error}`);
            }
        }

        if (imported > 0) {
            this.clearEvaluationCache();
            logger.info('rules-imported', `Imported ${imported} rules`, { errors: errors.length });
        }

        return { imported, errors };
    }
}