/**
 * ConnectionTypeMappingConfig - Phase 4.4: Connection Type Audio Differentiation Configuration
 *
 * Provides configuration interfaces for mapping different types of connections
 * (wikilinks, embeds, markdown links, tag connections) to distinct audio characteristics.
 * Each connection type can be mapped to specific instrument families with configurable
 * intensity and advanced audio parameters.
 */

// import { InstrumentConfig } from '../configs';

/**
 * Types of connections that can be mapped to different audio characteristics
 */
export type ConnectionType =
    | 'wikilink'        // [[Link to File]]
    | 'embed'           // ![[Embedded File]]
    | 'markdown'        // [Link Text](path/to/file.md)
    | 'tag'             // Connections through shared tags
    | 'backlink'        // Reverse connections (bidirectional)
    | 'unresolved'      // Broken/unresolved links
    | 'external'        // External URLs and web links
    | 'alias';          // Connections through file aliases

/**
 * Instrument families available for connection type mapping
 */
export type InstrumentFamily =
    | 'strings'         // Violin, Cello, Guitar, etc.
    | 'brass'           // Trumpet, Trombone, French Horn, etc.
    | 'woodwinds'       // Flute, Clarinet, Saxophone, etc.
    | 'percussion'      // Drums, Cymbals, Timpani, etc.
    | 'keyboards'       // Piano, Electric Piano, Organ, etc.
    | 'electronic'      // Synthesizers, Digital instruments
    | 'world'           // Traditional and ethnic instruments
    | 'vocals'          // Choir, Voice synths, etc.
    | 'ambient'         // Pads, Drones, Atmospheric sounds
    | 'organic';        // Natural, recorded sounds

/**
 * Audio characteristics specific to connection types
 */
export interface ConnectionAudioCharacteristics {
    // Volume and dynamics
    baseVolume: number;                 // Base volume level (0.0-1.0)
    volumeVariation: number;            // Random volume variation (0.0-0.5)

    // Timing and rhythm
    noteDuration: number;               // Duration multiplier (0.1-3.0)
    attackTime: number;                 // Note attack time in seconds (0.01-1.0)
    releaseTime: number;                // Note release time in seconds (0.1-5.0)

    // Spatial positioning
    spatialSpread: number;              // Stereo spread width (0.0-1.0)
    reverbAmount: number;               // Reverb send level (0.0-1.0)
    delayAmount: number;                // Delay send level (0.0-1.0)

    // Harmonic content
    harmonicRichness: number;           // Harmonic complexity (0.0-1.0)
    dissonanceLevel: number;            // Dissonance for broken links (0.0-1.0)
    chordsEnabled: boolean;             // Enable chord progressions

    // Link strength modulation
    strengthToVolumeEnabled: boolean;   // Map link frequency to volume
    strengthToVolumeAmount: number;     // Strength of volume modulation (0.0-1.0)
    bidirectionalHarmony: boolean;      // Use harmony for bidirectional links
    brokenLinkDissonance: boolean;      // Add dissonance for unresolved links
}

/**
 * Configuration for a specific connection type mapping
 */
export interface ConnectionTypeMapping {
    enabled: boolean;                   // Enable this connection type mapping
    instrumentFamily: InstrumentFamily; // Assigned instrument family
    instrumentNames: string[];          // Specific instruments from the family
    intensity: number;                  // Overall intensity/sensitivity (0.0-1.0)
    audioCharacteristics: ConnectionAudioCharacteristics;
    priority: number;                   // Priority when multiple types match (1-10)

    // Advanced link analysis
    linkStrengthAnalysis: {
        enabled: boolean;               // Analyze link frequency/importance
        frequencyThreshold: number;     // Min frequency to consider "strong" (0-10)
        volumeBoost: number;           // Volume boost for strong links (1.0-2.0)
        harmonicBoost: number;         // Harmonic boost for strong links (1.0-2.0)
    };

    // Contextual modifiers
    contextualModifiers: {
        sameFolderBoost: number;        // Boost for same-folder connections (1.0-1.5)
        crossFolderReduction: number;   // Reduction for cross-folder (0.5-1.0)
        recentConnectionBoost: number;  // Boost for recently created links (1.0-1.3)
        timeDecayDays: number;          // Days for recency boost to decay (1-365)
    };
}

/**
 * Preset configurations for different use cases
 */
export interface ConnectionTypePreset {
    name: string;
    description: string;
    author?: string;
    version?: string;
    mappings: Partial<Record<ConnectionType, ConnectionTypeMapping>>;
}

/**
 * Main configuration interface for connection type mapping
 */
export interface ConnectionTypeMappingConfig {
    enabled: boolean;                   // Master toggle for connection type mapping
    independentFromContentAware: boolean; // Independent of Phase 4.1 content-aware mapping

    // Connection type mappings
    mappings: Record<ConnectionType, ConnectionTypeMapping>;

    // Global settings
    globalSettings: {
        // Audio mixing
        connectionVolumeMix: number;    // Overall volume for connection audio (0.0-1.0)
        maxSimultaneousConnections: number; // Max concurrent connection sounds (5-50)
        connectionAudioFadeTime: number;    // Fade in/out time in seconds (0.1-2.0)

        // Performance optimization
        enableCaching: boolean;         // Cache connection analysis results
        maxCacheSize: number;          // Max cache entries (100-5000)
        selectiveProcessing: boolean;  // Only process visible connections

        // Link strength calculation
        linkStrengthMetrics: {
            useFrequency: boolean;      // Count link frequency
            useRecency: boolean;        // Factor in link creation time
            useBidirectionality: boolean; // Boost bidirectional links
            useContentSimilarity: boolean; // Use content similarity (CPU intensive)
        };

        // Audio quality
        highQualityMode: boolean;       // Use high-quality synthesis
        antiAliasingEnabled: boolean;   // Enable audio anti-aliasing
        compressionEnabled: boolean;    // Enable dynamic compression
    };

    // Preset management
    currentPreset: string | null;       // Currently active preset name
    customPresets: ConnectionTypePreset[]; // User-defined presets

    // Advanced features
    advancedFeatures: {
        connectionChords: boolean;      // Enable chord progressions for connections
        contextualHarmony: boolean;     // Harmonize based on connected content
        dynamicInstrumentation: boolean; // Change instruments based on context
        velocityModulation: boolean;    // Modulate velocity based on connection strength
        temporalSpacing: boolean;       // Space connection sounds temporally
        crossfadeConnections: boolean;  // Crossfade between connection types
    };
}

/**
 * Default audio characteristics for each connection type
 */
export const DEFAULT_CONNECTION_CHARACTERISTICS: Record<ConnectionType, ConnectionAudioCharacteristics> = {
    wikilink: {
        baseVolume: 0.7,
        volumeVariation: 0.1,
        noteDuration: 1.0,
        attackTime: 0.05,
        releaseTime: 0.8,
        spatialSpread: 0.3,
        reverbAmount: 0.2,
        delayAmount: 0.1,
        harmonicRichness: 0.6,
        dissonanceLevel: 0.0,
        chordsEnabled: false,
        strengthToVolumeEnabled: true,
        strengthToVolumeAmount: 0.3,
        bidirectionalHarmony: true,
        brokenLinkDissonance: false
    },
    embed: {
        baseVolume: 0.8,
        volumeVariation: 0.15,
        noteDuration: 1.2,
        attackTime: 0.08,
        releaseTime: 1.2,
        spatialSpread: 0.5,
        reverbAmount: 0.3,
        delayAmount: 0.2,
        harmonicRichness: 0.8,
        dissonanceLevel: 0.0,
        chordsEnabled: true,
        strengthToVolumeEnabled: true,
        strengthToVolumeAmount: 0.4,
        bidirectionalHarmony: true,
        brokenLinkDissonance: false
    },
    markdown: {
        baseVolume: 0.6,
        volumeVariation: 0.1,
        noteDuration: 0.8,
        attackTime: 0.03,
        releaseTime: 0.6,
        spatialSpread: 0.2,
        reverbAmount: 0.15,
        delayAmount: 0.05,
        harmonicRichness: 0.4,
        dissonanceLevel: 0.0,
        chordsEnabled: false,
        strengthToVolumeEnabled: true,
        strengthToVolumeAmount: 0.2,
        bidirectionalHarmony: false,
        brokenLinkDissonance: false
    },
    tag: {
        baseVolume: 0.5,
        volumeVariation: 0.2,
        noteDuration: 1.5,
        attackTime: 0.1,
        releaseTime: 2.0,
        spatialSpread: 0.7,
        reverbAmount: 0.4,
        delayAmount: 0.3,
        harmonicRichness: 0.9,
        dissonanceLevel: 0.0,
        chordsEnabled: true,
        strengthToVolumeEnabled: false,
        strengthToVolumeAmount: 0.0,
        bidirectionalHarmony: true,
        brokenLinkDissonance: false
    },
    backlink: {
        baseVolume: 0.65,
        volumeVariation: 0.1,
        noteDuration: 1.1,
        attackTime: 0.04,
        releaseTime: 0.9,
        spatialSpread: 0.4,
        reverbAmount: 0.25,
        delayAmount: 0.15,
        harmonicRichness: 0.7,
        dissonanceLevel: 0.0,
        chordsEnabled: true,
        strengthToVolumeEnabled: true,
        strengthToVolumeAmount: 0.35,
        bidirectionalHarmony: true,
        brokenLinkDissonance: false
    },
    unresolved: {
        baseVolume: 0.4,
        volumeVariation: 0.3,
        noteDuration: 0.5,
        attackTime: 0.02,
        releaseTime: 0.3,
        spatialSpread: 0.1,
        reverbAmount: 0.1,
        delayAmount: 0.0,
        harmonicRichness: 0.2,
        dissonanceLevel: 0.8,
        chordsEnabled: false,
        strengthToVolumeEnabled: false,
        strengthToVolumeAmount: 0.0,
        bidirectionalHarmony: false,
        brokenLinkDissonance: true
    },
    external: {
        baseVolume: 0.3,
        volumeVariation: 0.1,
        noteDuration: 0.6,
        attackTime: 0.01,
        releaseTime: 0.4,
        spatialSpread: 0.0,
        reverbAmount: 0.05,
        delayAmount: 0.0,
        harmonicRichness: 0.1,
        dissonanceLevel: 0.3,
        chordsEnabled: false,
        strengthToVolumeEnabled: false,
        strengthToVolumeAmount: 0.0,
        bidirectionalHarmony: false,
        brokenLinkDissonance: true
    },
    alias: {
        baseVolume: 0.6,
        volumeVariation: 0.15,
        noteDuration: 0.9,
        attackTime: 0.04,
        releaseTime: 0.7,
        spatialSpread: 0.3,
        reverbAmount: 0.2,
        delayAmount: 0.1,
        harmonicRichness: 0.5,
        dissonanceLevel: 0.0,
        chordsEnabled: false,
        strengthToVolumeEnabled: true,
        strengthToVolumeAmount: 0.25,
        bidirectionalHarmony: false,
        brokenLinkDissonance: false
    }
};

/**
 * Default instrument family assignments for each connection type
 */
export const DEFAULT_CONNECTION_INSTRUMENTS: Record<ConnectionType, InstrumentFamily> = {
    wikilink: 'strings',        // Clean, organic connections
    embed: 'keyboards',         // Rich, complex content inclusion
    markdown: 'woodwinds',      // Light, flowing connections
    tag: 'ambient',             // Atmospheric, semantic connections
    backlink: 'brass',          // Strong, prominent reverse connections
    unresolved: 'percussion',   // Sharp, attention-grabbing broken links
    external: 'electronic',     // Synthetic, external connections
    alias: 'world'              // Unique, alternative connections
};

/**
 * Built-in presets for different use cases
 */
export const BUILT_IN_PRESETS: ConnectionTypePreset[] = [
    {
        name: 'Default',
        description: 'Balanced mapping for general use with distinct sounds for each connection type',
        author: 'Sonigraph',
        version: '1.0.0',
        mappings: Object.fromEntries(
            Object.entries(DEFAULT_CONNECTION_INSTRUMENTS).map(([type, family]) => [
                type,
                {
                    enabled: true,
                    instrumentFamily: family,
                    instrumentNames: [], // Will be populated by the mapper
                    intensity: 0.7,
                    audioCharacteristics: DEFAULT_CONNECTION_CHARACTERISTICS[type as ConnectionType],
                    priority: 5,
                    linkStrengthAnalysis: {
                        enabled: true,
                        frequencyThreshold: 3,
                        volumeBoost: 1.3,
                        harmonicBoost: 1.2
                    },
                    contextualModifiers: {
                        sameFolderBoost: 1.1,
                        crossFolderReduction: 0.9,
                        recentConnectionBoost: 1.15,
                        timeDecayDays: 30
                    }
                }
            ])
        ) as Partial<Record<ConnectionType, ConnectionTypeMapping>>
    },
    {
        name: 'Minimal',
        description: 'Simple mapping with basic audio differentiation for performance',
        author: 'Sonigraph',
        version: '1.0.0',
        mappings: {
            wikilink: {
                enabled: true,
                instrumentFamily: 'keyboards',
                instrumentNames: ['grand-piano'],
                intensity: 0.5,
                audioCharacteristics: {
                    ...DEFAULT_CONNECTION_CHARACTERISTICS.wikilink,
                    chordsEnabled: false,
                    harmonicRichness: 0.3,
                    reverbAmount: 0.1
                },
                priority: 5,
                linkStrengthAnalysis: {
                    enabled: false,
                    frequencyThreshold: 1,
                    volumeBoost: 1.0,
                    harmonicBoost: 1.0
                },
                contextualModifiers: {
                    sameFolderBoost: 1.0,
                    crossFolderReduction: 1.0,
                    recentConnectionBoost: 1.0,
                    timeDecayDays: 7
                }
            },
            embed: {
                enabled: true,
                instrumentFamily: 'strings',
                instrumentNames: ['violin'],
                intensity: 0.6,
                audioCharacteristics: {
                    ...DEFAULT_CONNECTION_CHARACTERISTICS.embed,
                    chordsEnabled: false,
                    harmonicRichness: 0.4,
                    reverbAmount: 0.15
                },
                priority: 6,
                linkStrengthAnalysis: {
                    enabled: false,
                    frequencyThreshold: 1,
                    volumeBoost: 1.0,
                    harmonicBoost: 1.0
                },
                contextualModifiers: {
                    sameFolderBoost: 1.0,
                    crossFolderReduction: 1.0,
                    recentConnectionBoost: 1.0,
                    timeDecayDays: 7
                }
            }
        }
    },
    {
        name: 'Rich Orchestral',
        description: 'Full orchestral mapping with complex harmonies and rich textures',
        author: 'Sonigraph',
        version: '1.0.0',
        mappings: {
            wikilink: {
                enabled: true,
                instrumentFamily: 'strings',
                instrumentNames: ['violin', 'viola', 'cello'],
                intensity: 0.8,
                audioCharacteristics: {
                    ...DEFAULT_CONNECTION_CHARACTERISTICS.wikilink,
                    chordsEnabled: true,
                    harmonicRichness: 0.9,
                    reverbAmount: 0.4
                },
                priority: 5,
                linkStrengthAnalysis: {
                    enabled: true,
                    frequencyThreshold: 2,
                    volumeBoost: 1.5,
                    harmonicBoost: 1.4
                },
                contextualModifiers: {
                    sameFolderBoost: 1.2,
                    crossFolderReduction: 0.8,
                    recentConnectionBoost: 1.3,
                    timeDecayDays: 60
                }
            },
            embed: {
                enabled: true,
                instrumentFamily: 'brass',
                instrumentNames: ['trumpet', 'french-horn'],
                intensity: 0.9,
                audioCharacteristics: {
                    ...DEFAULT_CONNECTION_CHARACTERISTICS.embed,
                    chordsEnabled: true,
                    harmonicRichness: 1.0,
                    reverbAmount: 0.5
                },
                priority: 7,
                linkStrengthAnalysis: {
                    enabled: true,
                    frequencyThreshold: 2,
                    volumeBoost: 1.6,
                    harmonicBoost: 1.5
                },
                contextualModifiers: {
                    sameFolderBoost: 1.3,
                    crossFolderReduction: 0.7,
                    recentConnectionBoost: 1.4,
                    timeDecayDays: 90
                }
            },
            tag: {
                enabled: true,
                instrumentFamily: 'woodwinds',
                instrumentNames: ['flute', 'clarinet', 'oboe'],
                intensity: 0.7,
                audioCharacteristics: {
                    ...DEFAULT_CONNECTION_CHARACTERISTICS.tag,
                    chordsEnabled: true,
                    harmonicRichness: 0.8,
                    reverbAmount: 0.6
                },
                priority: 4,
                linkStrengthAnalysis: {
                    enabled: true,
                    frequencyThreshold: 4,
                    volumeBoost: 1.2,
                    harmonicBoost: 1.3
                },
                contextualModifiers: {
                    sameFolderBoost: 1.0,
                    crossFolderReduction: 1.0,
                    recentConnectionBoost: 1.1,
                    timeDecayDays: 45
                }
            }
        }
    }
];

/**
 * Default configuration for connection type mapping
 */
export const DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG: ConnectionTypeMappingConfig = {
    enabled: false,
    independentFromContentAware: true,

    mappings: Object.fromEntries(
        Object.entries(DEFAULT_CONNECTION_INSTRUMENTS).map(([type, family]) => [
            type,
            {
                enabled: type === 'wikilink' || type === 'embed', // Enable core types by default
                instrumentFamily: family,
                instrumentNames: [],
                intensity: 0.7,
                audioCharacteristics: DEFAULT_CONNECTION_CHARACTERISTICS[type as ConnectionType],
                priority: 5,
                linkStrengthAnalysis: {
                    enabled: true,
                    frequencyThreshold: 3,
                    volumeBoost: 1.3,
                    harmonicBoost: 1.2
                },
                contextualModifiers: {
                    sameFolderBoost: 1.1,
                    crossFolderReduction: 0.9,
                    recentConnectionBoost: 1.15,
                    timeDecayDays: 30
                }
            }
        ])
    ) as Record<ConnectionType, ConnectionTypeMapping>,

    globalSettings: {
        connectionVolumeMix: 0.6,
        maxSimultaneousConnections: 20,
        connectionAudioFadeTime: 0.3,
        enableCaching: true,
        maxCacheSize: 1000,
        selectiveProcessing: true,
        linkStrengthMetrics: {
            useFrequency: true,
            useRecency: true,
            useBidirectionality: true,
            useContentSimilarity: false
        },
        highQualityMode: false,
        antiAliasingEnabled: true,
        compressionEnabled: true
    },

    currentPreset: 'Default',
    customPresets: [],

    advancedFeatures: {
        connectionChords: false,
        contextualHarmony: false,
        dynamicInstrumentation: false,
        velocityModulation: true,
        temporalSpacing: false,
        crossfadeConnections: false
    }
};

/**
 * Result of connection type analysis and mapping
 */
export interface ConnectionTypeMappingResult {
    connectionType: ConnectionType;
    sourceFile: string;
    targetFile: string;
    linkStrength: number;
    instrumentFamily: InstrumentFamily;
    selectedInstrument: string;
    audioCharacteristics: ConnectionAudioCharacteristics;
    confidence: number;
    reasoning: string[];
    contextualModifiers: {
        sameFolderBoost: number;
        recencyBoost: number;
        strengthBoost: number;
    };
    analysisTime: number;
}

/**
 * Performance metrics for connection type mapping
 */
export interface ConnectionTypeMappingMetrics {
    totalConnections: number;
    mappedConnections: number;
    cachedResults: number;
    averageAnalysisTime: number;
    connectionTypeDistribution: Record<ConnectionType, number>;
    instrumentFamilyDistribution: Record<InstrumentFamily, number>;
    linkStrengthDistribution: {
        weak: number;      // 0.0-0.3
        moderate: number;  // 0.3-0.7
        strong: number;    // 0.7-1.0
    };
}