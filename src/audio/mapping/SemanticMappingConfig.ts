/**
 * SemanticMappingConfig - Phase 4.2: Tag-Based Musical Semantics Configuration
 * 
 * Provides configuration interfaces and default mappings for semantic tag analysis.
 * Maps semantic tags to musical characteristics including emotional, functional, 
 * and topical tag mappings with complexity analysis.
 */

// import { InstrumentConfig } from '../configs';

/**
 * Emotional mapping from tags to musical characteristics
 */
export interface EmotionalMapping {
    positiveInstruments: string[]; // Bright, uplifting instruments
    negativeInstruments: string[]; // Dark, introspective instruments
    neutralInstruments: string[]; // Balanced, versatile instruments
    intensityScale: {
        low: { velocity: number; harmonicComplexity: number };
        medium: { velocity: number; harmonicComplexity: number };
        high: { velocity: number; harmonicComplexity: number };
    };
    moodModifiers: {
        happy: { pitch: number; brightness: number };
        sad: { pitch: number; darkness: number };
        excited: { velocity: number; rhythmicComplexity: number };
        calm: { velocity: number; spatialReverb: number };
        angry: { dissonance: number; velocity: number };
        peaceful: { harmonicDensity: number; spatialDelay: number };
    };
}

/**
 * Functional mapping from purpose-based tags to musical characteristics  
 */
export interface FunctionalMapping {
    ideationInstruments: string[]; // Creative, bright instruments for ideas
    organizationalInstruments: string[]; // Structured, rhythmic instruments
    reflectiveInstruments: string[]; // Soft, contemplative instruments
    analyticalInstruments: string[]; // Precise, electronic instruments
    creativeInstruments: string[]; // Experimental, complex instruments
    taskInstruments: string[]; // Steady, reliable instruments
    researchInstruments: string[]; // Investigative, layered instruments
    purposeModifiers: {
        brainstorming: { harmonicDensity: number; rhythmicComplexity: number };
        planning: { rhythmicComplexity: number; structure: number };
        execution: { velocity: number; consistency: number };
        review: { spatialPosition: number; depth: number };
        documentation: { clarity: number; precision: number };
        learning: { progression: number; development: number };
    };
}

/**
 * Topical mapping from content-based tags to musical characteristics
 */
export interface TopicalMapping {
    technicalInstruments: string[]; // Electronic, synthetic instruments
    humanitiesInstruments: string[]; // Acoustic, organic instruments
    scientificInstruments: string[]; // Precise, mathematical instruments
    artisticInstruments: string[]; // Expressive, rich instruments
    businessInstruments: string[]; // Professional, structured instruments
    personalInstruments: string[]; // Intimate, emotional instruments
    topicModifiers: {
        technology: { electronic: number; precision: number };
        nature: { organic: number; spatialReverb: number };
        science: { mathematical: number; structure: number };
        art: { expressiveness: number; complexity: number };
        philosophy: { depth: number; contemplation: number };
        history: { gravitas: number; temporal: number };
    };
}

/**
 * Tag complexity analysis configuration
 */
export interface TagComplexityConfig {
    chordComplexityMapping: {
        singleTag: number; // Base chord complexity (0.0-1.0)
        multipleTags: number; // Chord complexity multiplier per additional tag
        maxComplexity: number; // Maximum chord complexity cap
        semanticRelationshipBonus: number; // Bonus for related tags
    };
    velocityIntensityMapping: {
        baseVelocity: number; // Base velocity (0.0-1.0)
        tagCountMultiplier: number; // Velocity increase per tag
        maxVelocity: number; // Maximum velocity cap
        urgencyTagBonus: number; // Bonus for urgent/priority tags
    };
    harmonicIntervalMapping: {
        relatedTags: number[]; // Harmonic intervals for related tags (semitones)
        opposingTags: number[]; // Intervals for opposing tags (dissonant)
        neutralTags: number[]; // Intervals for unrelated tags
        intervalComplexity: number; // Base interval complexity
    };
    temporalMapping: {
        pastTags: { delay: number; reverb: number }; // Historical context
        presentTags: { immediacy: number; clarity: number }; // Current focus
        futureTags: { anticipation: number; development: number }; // Planning
    };
}

/**
 * Complete tag mapping configuration
 */
export interface TagMappingConfig {
    emotionalTags: Record<string, EmotionalMapping>;
    functionalTags: Record<string, FunctionalMapping>;  
    topicalTags: Record<string, TopicalMapping>;
    complexityConfig: TagComplexityConfig;
    semanticRelationships: Record<string, string[]>; // Tag relationships for complexity analysis
    priorityTags: string[]; // High-priority tags that influence intensity
    temporalTags: {
        past: string[];
        present: string[];
        future: string[];
    };
}

/**
 * Default semantic tag mappings as specified in Phase 4.2
 */
export const DEFAULT_TAG_MAPPINGS: TagMappingConfig = {
    emotionalTags: {
        default: {
            positiveInstruments: ['celesta', 'flute', 'harp', 'vibraphone'],
            negativeInstruments: ['cello', 'contrabass', 'bassoon', 'organ'],
            neutralInstruments: ['piano', 'electricPiano', 'guitar', 'violin'],
            intensityScale: {
                low: { velocity: 0.4, harmonicComplexity: 0.3 },
                medium: { velocity: 0.6, harmonicComplexity: 0.5 },
                high: { velocity: 0.8, harmonicComplexity: 0.7 }
            },
            moodModifiers: {
                happy: { pitch: 12, brightness: 0.8 },
                sad: { pitch: -12, darkness: 0.7 },
                excited: { velocity: 0.3, rhythmicComplexity: 0.4 },
                calm: { velocity: -0.2, spatialReverb: 0.3 },
                angry: { dissonance: 0.6, velocity: 0.4 },
                peaceful: { harmonicDensity: 0.6, spatialDelay: 0.2 }
            }
        }
    },

    functionalTags: {
        default: {
            // #idea, #insight → Bright instruments  
            ideationInstruments: ['celesta', 'flute', 'leadSynth', 'vibraphone', 'harp'],
            
            // #project, #task → Structured instruments
            organizationalInstruments: ['electricPiano', 'vibraphone', 'xylophone', 'piano'],
            
            // #journal, #daily → Reflective instruments
            reflectiveInstruments: ['harp', 'organ', 'piano', 'cello'],
            
            // #research → Electronic/analytical instruments  
            analyticalInstruments: ['leadSynth', 'arpSynth', 'electricPiano', 'bassSynth'],
            
            // #creative → Experimental/electronic instruments
            creativeInstruments: ['leadSynth', 'arpSynth', 'guitar', 'trumpet'],
            
            // Task-oriented instruments
            taskInstruments: ['electricPiano', 'piano', 'guitar', 'violin'],
            
            // Research and investigation
            researchInstruments: ['leadSynth', 'arpSynth', 'vibraphone', 'electricPiano'],
            
            purposeModifiers: {
                brainstorming: { harmonicDensity: 0.7, rhythmicComplexity: 0.6 },
                planning: { rhythmicComplexity: 0.5, structure: 0.8 },
                execution: { velocity: 0.4, consistency: 0.7 },
                review: { spatialPosition: 0.3, depth: 0.6 },
                documentation: { clarity: 0.8, precision: 0.7 },
                learning: { progression: 0.6, development: 0.5 }
            }
        }
    },

    topicalTags: {
        default: {
            technicalInstruments: ['leadSynth', 'arpSynth', 'bassSynth', 'electricPiano'],
            humanitiesInstruments: ['piano', 'violin', 'cello', 'flute', 'harp'],
            scientificInstruments: ['vibraphone', 'vibraphone', 'leadSynth', 'electricPiano'],
            artisticInstruments: ['harp', 'organ', 'violin', 'flute', 'guitar'],
            businessInstruments: ['electricPiano', 'piano', 'trumpet', 'vibraphone'],
            personalInstruments: ['piano', 'harp', 'organ', 'cello', 'guitar'],
            
            topicModifiers: {
                technology: { electronic: 0.8, precision: 0.7 },
                nature: { organic: 0.8, spatialReverb: 0.4 },
                science: { mathematical: 0.7, structure: 0.8 },
                art: { expressiveness: 0.8, complexity: 0.7 },
                philosophy: { depth: 0.7, contemplation: 0.6 },
                history: { gravitas: 0.6, temporal: 0.5 }
            }
        }
    },

    complexityConfig: {
        chordComplexityMapping: {
            singleTag: 0.3, // Base complexity for single tag
            multipleTags: 0.2, // +0.2 complexity per additional tag
            maxComplexity: 0.9, // Maximum chord complexity
            semanticRelationshipBonus: 0.1 // Bonus for related tags
        },
        velocityIntensityMapping: {
            baseVelocity: 0.5, // Base velocity for tagged files
            tagCountMultiplier: 0.1, // +0.1 velocity per tag
            maxVelocity: 1.0, // Maximum velocity
            urgencyTagBonus: 0.2 // Bonus for urgent tags
        },
        harmonicIntervalMapping: {
            relatedTags: [3, 4, 7], // Major 3rd, Perfect 4th, Perfect 5th
            opposingTags: [1, 6, 11], // Minor 2nd, Tritone, Major 7th (dissonant)
            neutralTags: [5, 9], // Perfect 4th, Major 6th
            intervalComplexity: 0.4 // Base interval complexity
        },
        temporalMapping: {
            pastTags: { delay: 0.3, reverb: 0.4 }, // Historical context with echo
            presentTags: { immediacy: 0.8, clarity: 0.9 }, // Clear and immediate
            futureTags: { anticipation: 0.6, development: 0.5 } // Forward-looking
        }
    },

    // Semantic relationships between tags for complexity analysis
    semanticRelationships: {
        'idea': ['insight', 'creative', 'brainstorm'],
        'project': ['task', 'planning', 'execution'],
        'research': ['analysis', 'investigation', 'study'],
        'journal': ['daily', 'personal', 'reflection'],
        'creative': ['art', 'design', 'writing'],
        'technical': ['programming', 'development', 'code'],
        'business': ['strategy', 'planning', 'meeting'],
        'learning': ['education', 'study', 'knowledge'],
        'health': ['wellness', 'fitness', 'medical'],
        'finance': ['money', 'budget', 'investment']
    },

    // High-priority tags that increase intensity
    priorityTags: [
        'urgent', 'important', 'deadline', 'critical', 'priority',
        'milestone', 'goal', 'target', 'focus', 'key'
    ],

    // Temporal context tags  
    temporalTags: {
        past: ['archive', 'history', 'retrospective', 'completed', 'done'],
        present: ['today', 'current', 'active', 'now', 'working'],
        future: ['plan', 'goal', 'future', 'todo', 'upcoming', 'schedule']
    }
};

/**
 * Tag semantic analysis result
 */
export interface TagSemanticAnalysis {
    emotionalContext: {
        valence: number; // Positive/negative (-1 to 1)
        intensity: number; // Emotional intensity (0 to 1)
        dominantEmotion?: string;
    };
    functionalContext: {
        primaryFunction: string; // Main purpose/function
        complexity: number; // Task complexity (0 to 1)
        urgency: number; // Priority/urgency (0 to 1)
    };
    topicalContext: {
        primaryTopic: string; // Main topic/domain
        specificity: number; // Topic specificity (0 to 1)
        interdisciplinary: boolean; // Multiple topics
    };
    complexity: {
        tagCount: number; // Total number of tags
        semanticRelationships: number; // Number of related tag pairs
        chordComplexity: number; // Derived chord complexity
        velocityMultiplier: number; // Derived velocity multiplier
        harmonicIntervals: number[]; // Recommended harmonic intervals
    };
    temporalContext: {
        timeframe: 'past' | 'present' | 'future' | 'mixed';
        temporalModifiers: {
            delay?: number;
            reverb?: number;
            immediacy?: number;
            clarity?: number;
            anticipation?: number;
            development?: number;
        };
    };
}