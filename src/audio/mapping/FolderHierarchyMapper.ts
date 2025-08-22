/**
 * FolderHierarchyMapper - Maps folder paths to instrument families and musical properties
 * Part of Phase 4.3: Folder Hierarchy and Path Mapping
 */

import { PathAnalyzer, PathAnalysis, FolderMetrics } from './PathAnalyzer';
import { InstrumentKey as InstrumentType } from '../../utils/constants';

export interface FolderCharacteristics {
    path: string;
    depth: number;
    primaryFamily: InstrumentFamily;
    secondaryFamily?: InstrumentFamily;
    semanticCategory: 'personal' | 'work' | 'creative' | 'technical' | 'archival' | 'general';
    complexity: number;
    musicalProperties: {
        pitchModifier: number; // -1.0 to 1.0 (lower to higher)
        timbreRichness: number; // 0.0 to 1.0
        noteDurationMultiplier: number; // 0.5 to 2.0
        velocityModifier: number; // 0.0 to 1.0
        spatialDepth: number; // 0.0 to 1.0 (reverb/delay amount)
    };
}

export interface InstrumentFamily {
    name: string;
    category: 'brass' | 'vocals' | 'electronic' | 'strings' | 'woodwinds' | 'percussion' | 'keyboard' | 'general';
    instruments: InstrumentType[];
    characteristics: {
        warmth: number; // 0.0 to 1.0
        brightness: number; // 0.0 to 1.0
        complexity: number; // 0.0 to 1.0
        expressiveness: number; // 0.0 to 1.0
    };
}

export interface PitchModification {
    octaveShift: number; // -2 to +2
    pitchBendRange: number; // 0 to 12 semitones
    baseNote: number; // MIDI note number
}

export class FolderHierarchyMapper {
    private pathAnalyzer: PathAnalyzer;
    
    // Define instrument families
    private static readonly INSTRUMENT_FAMILIES: Record<string, InstrumentFamily> = {
        brass: {
            name: 'Brass Family',
            category: 'brass',
            instruments: ['trumpet', 'frenchHorn', 'trombone', 'tuba'],
            characteristics: {
                warmth: 0.7,
                brightness: 0.8,
                complexity: 0.6,
                expressiveness: 0.7
            }
        },
        vocals: {
            name: 'Vocals Family',
            category: 'vocals',
            instruments: ['organ', 'accordion', 'flute'], // Using organ/accordion/flute as vocal substitutes for now
            characteristics: {
                warmth: 0.9,
                brightness: 0.6,
                complexity: 0.7,
                expressiveness: 0.95
            }
        },
        electronic: {
            name: 'Electronic Family',
            category: 'electronic',
            instruments: ['leadSynth', 'bassSynth', 'arpSynth', 'electricPiano'], // Removed padSynth and synthBrass
            characteristics: {
                warmth: 0.4,
                brightness: 0.8,
                complexity: 0.8,
                expressiveness: 0.6
            }
        },
        strings: {
            name: 'Strings Family',
            category: 'strings',
            instruments: ['violin', 'cello', 'contrabass', 'harp', 'guitar', 'strings'], // Removed viola, added strings
            characteristics: {
                warmth: 0.8,
                brightness: 0.7,
                complexity: 0.8,
                expressiveness: 0.85
            }
        },
        woodwinds: {
            name: 'Woodwinds Family',
            category: 'woodwinds',
            instruments: ['flute', 'oboe', 'clarinet', 'bassoon', 'saxophone'],
            characteristics: {
                warmth: 0.7,
                brightness: 0.7,
                complexity: 0.6,
                expressiveness: 0.8
            }
        },
        percussion: {
            name: 'Percussion Family',
            category: 'percussion',
            instruments: ['xylophone', 'vibraphone', 'timpani', 'gongs'], // Replaced marimba with gongs
            characteristics: {
                warmth: 0.5,
                brightness: 0.9,
                complexity: 0.4,
                expressiveness: 0.5
            }
        },
        keyboard: {
            name: 'Keyboard Family',
            category: 'keyboard',
            instruments: ['piano', 'electricPiano', 'organ', 'celesta'],
            characteristics: {
                warmth: 0.6,
                brightness: 0.7,
                complexity: 0.7,
                expressiveness: 0.8
            }
        }
    };

    // Define folder-to-family mappings
    private static readonly FOLDER_MAPPINGS: Record<string, string> = {
        // Primary mappings from specification
        'projects': 'brass',
        'project': 'brass',
        'journal': 'vocals',
        'journals': 'vocals',
        'daily': 'vocals',
        'research': 'electronic',
        'studies': 'electronic',
        'archive': 'strings',
        'archives': 'strings',
        'old': 'strings',
        'ideas': 'woodwinds',
        'thoughts': 'woodwinds',
        'brainstorm': 'woodwinds',
        
        // Additional semantic mappings
        'tasks': 'brass',
        'todo': 'brass',
        'work': 'brass',
        'personal': 'vocals',
        'private': 'vocals',
        'notes': 'keyboard',
        'documentation': 'keyboard',
        'reference': 'keyboard',
        'creative': 'woodwinds',
        'art': 'woodwinds',
        'music': 'woodwinds',
        'code': 'electronic',
        'dev': 'electronic',
        'technical': 'electronic',
        'media': 'percussion',
        'images': 'percussion',
        'attachments': 'percussion'
    };

    constructor() {
        this.pathAnalyzer = new PathAnalyzer();
    }

    /**
     * Analyze a folder path and return its characteristics
     */
    public analyzeFolderPath(filePath: string): FolderCharacteristics {
        const pathAnalysis = this.pathAnalyzer.analyzePath(filePath);
        const folderMetrics = this.pathAnalyzer.calculateFolderMetrics(pathAnalysis);
        const semantics = this.pathAnalyzer.extractPathSemantics(pathAnalysis.components);
        
        // Map path components to instrument family
        const { primary, secondary } = this.mapPathToInstrumentFamily(pathAnalysis.components);
        
        // Calculate musical properties based on folder metrics
        const musicalProperties = this.calculateMusicalProperties(pathAnalysis, folderMetrics);
        
        return {
            path: filePath,
            depth: pathAnalysis.depth,
            primaryFamily: primary,
            secondaryFamily: secondary,
            semanticCategory: semantics.category,
            complexity: folderMetrics.nestingComplexity,
            musicalProperties
        };
    }

    /**
     * Map path components to instrument families
     */
    public mapPathToInstrumentFamily(pathComponents: string[]): {
        primary: InstrumentFamily;
        secondary?: InstrumentFamily;
    } {
        const foundFamilies: string[] = [];
        const lowerComponents = pathComponents.map(c => c.toLowerCase());
        
        // Check each component against mappings
        for (const component of lowerComponents) {
            // Direct match
            if (FolderHierarchyMapper.FOLDER_MAPPINGS[component]) {
                foundFamilies.push(FolderHierarchyMapper.FOLDER_MAPPINGS[component]);
            }
            
            // Partial match
            for (const [folder, family] of Object.entries(FolderHierarchyMapper.FOLDER_MAPPINGS)) {
                if (component.includes(folder) || folder.includes(component)) {
                    foundFamilies.push(family);
                    break;
                }
            }
        }
        
        // Deduplicate and prioritize
        const uniqueFamilies = [...new Set(foundFamilies)];
        
        if (uniqueFamilies.length === 0) {
            // Default based on path characteristics
            return { primary: this.getDefaultFamily(pathComponents) };
        }
        
        // Primary is the most common or first found
        const primary = FolderHierarchyMapper.INSTRUMENT_FAMILIES[uniqueFamilies[0]];
        const secondary = uniqueFamilies.length > 1 
            ? FolderHierarchyMapper.INSTRUMENT_FAMILIES[uniqueFamilies[1]]
            : undefined;
        
        return { primary, secondary };
    }

    /**
     * Calculate depth influence on pitch
     */
    public calculateDepthInfluence(depth: number): PitchModification {
        // Deeper paths = lower pitch
        // Root level (1) = +1 octave, Deep (6+) = -1 octave
        const normalizedDepth = Math.min(6, Math.max(1, depth));
        const octaveShift = Math.round(2 - (normalizedDepth / 2));
        
        // Pitch bend range increases with depth for more expression
        const pitchBendRange = Math.min(12, 2 + depth);
        
        // Base note shifts lower with depth
        // C4 (60) at root, down to C2 (36) at deep levels
        const baseNote = 60 - (normalizedDepth - 1) * 4;
        
        return {
            octaveShift,
            pitchBendRange,
            baseNote
        };
    }

    /**
     * Calculate musical properties based on folder analysis
     */
    private calculateMusicalProperties(
        pathAnalysis: PathAnalysis,
        folderMetrics: FolderMetrics
    ): FolderCharacteristics['musicalProperties'] {
        const depthInfluence = this.calculateDepthInfluence(pathAnalysis.depth);
        
        // Pitch modifier: deeper = lower (-1 to 1)
        const pitchModifier = 1 - (Math.min(6, pathAnalysis.depth) / 3);
        
        // Timbre richness: nested complexity affects timbre
        const timbreRichness = 0.3 + (folderMetrics.nestingComplexity * 0.7);
        
        // Note duration: path length affects duration
        const pathLength = pathAnalysis.fullPath.length;
        const noteDurationMultiplier = 0.5 + Math.min(1.5, pathLength / 50);
        
        // Velocity: organizational score affects dynamics
        const velocityModifier = 0.4 + (folderMetrics.organizationalScore * 0.6);
        
        // Spatial depth: deeper paths get more reverb/delay
        const spatialDepth = Math.min(1.0, pathAnalysis.depth * 0.15);
        
        return {
            pitchModifier,
            timbreRichness,
            noteDurationMultiplier,
            velocityModifier,
            spatialDepth
        };
    }

    /**
     * Get default instrument family based on path characteristics
     */
    private getDefaultFamily(pathComponents: string[]): InstrumentFamily {
        const semantics = this.pathAnalyzer.extractPathSemantics(pathComponents);
        
        // Map semantic categories to families
        const categoryMappings: Record<string, string> = {
            'personal': 'vocals',
            'work': 'brass',
            'creative': 'woodwinds',
            'technical': 'electronic',
            'archival': 'strings',
            'general': 'keyboard'
        };
        
        const familyKey = categoryMappings[semantics.category] || 'keyboard';
        return FolderHierarchyMapper.INSTRUMENT_FAMILIES[familyKey];
    }

    /**
     * Get a specific instrument from a family based on characteristics
     */
    public selectInstrumentFromFamily(
        family: InstrumentFamily,
        characteristics: FolderCharacteristics
    ): InstrumentType {
        const { musicalProperties } = characteristics;
        
        // Select instrument based on pitch modifier
        const instruments = family.instruments;
        if (instruments.length === 0) return 'piano'; // Fallback
        
        // Map pitch modifier to instrument index
        // Lower pitch = lower instruments in family
        const normalizedPitch = (musicalProperties.pitchModifier + 1) / 2; // 0 to 1
        const index = Math.floor(normalizedPitch * instruments.length);
        
        return instruments[Math.min(index, instruments.length - 1)];
    }

    /**
     * Get musical properties for a given path
     */
    public getMusicalPropertiesForPath(filePath: string): {
        instrument: InstrumentType;
        family: InstrumentFamily;
        properties: FolderCharacteristics['musicalProperties'];
        pitchModification: PitchModification;
    } {
        const characteristics = this.analyzeFolderPath(filePath);
        const instrument = this.selectInstrumentFromFamily(
            characteristics.primaryFamily,
            characteristics
        );
        const pitchModification = this.calculateDepthInfluence(characteristics.depth);
        
        return {
            instrument,
            family: characteristics.primaryFamily,
            properties: characteristics.musicalProperties,
            pitchModification
        };
    }
}