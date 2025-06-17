/**
 * InstrumentConfigLoader - Dynamic instrument configuration management
 * 
 * This class provides dynamic loading and management of modular instrument configurations,
 * replacing the monolithic SAMPLER_CONFIGS object in the audio engine.
 */

import { InstrumentFamily, InstrumentCollection, InstrumentConfig, FORMAT_PLACEHOLDER } from './types';
import { 
    instrumentFamilies, 
    getAllInstruments, 
    getInstrumentsByCategory,
    getInstrumentFamily 
} from './index';

export interface LoadedInstrumentConfig extends InstrumentConfig {
    family?: string;
    loadedAt: number;
}

export interface LoaderOptions {
    audioFormat: 'mp3' | 'wav' | 'ogg';
    enabledCategories?: string[];
    maxInstrumentsPerCategory?: number;
    preloadFamilies?: boolean;
}

export class InstrumentConfigLoader {
    private loadedInstruments: Map<string, LoadedInstrumentConfig> = new Map();
    private familyCache: Map<string, InstrumentFamily> = new Map();
    private options: LoaderOptions;
    private loadedAt: number;

    constructor(options: LoaderOptions = { audioFormat: 'mp3' }) {
        this.options = {
            audioFormat: 'mp3',
            enabledCategories: ['keyboard', 'strings', 'brass', 'vocals', 'woodwind', 'percussion', 'world'],
            maxInstrumentsPerCategory: 50,
            preloadFamilies: true,
            ...options
        };
        this.loadedAt = Date.now();
        
        if (this.options.preloadFamilies) {
            this.preloadFamilies();
        }
    }

    /**
     * Preload all instrument families into cache
     */
    private preloadFamilies(): void {
        instrumentFamilies.forEach(family => {
            this.familyCache.set(family.name.toLowerCase(), family);
        });
    }

    /**
     * Load all instruments from all families
     */
    public loadAllInstruments(): InstrumentCollection {
        const instruments = getAllInstruments();
        return this.processInstrumentCollection(instruments);
    }

    /**
     * Load instruments from specific families
     */
    public loadInstrumentFamilies(familyNames: string[]): InstrumentCollection {
        const instruments: InstrumentCollection = {};
        
        familyNames.forEach(familyName => {
            const family = getInstrumentFamily(familyName);
            if (family) {
                Object.assign(instruments, family.instruments);
            }
        });
        
        return this.processInstrumentCollection(instruments);
    }

    /**
     * Load instruments by category
     */
    public loadInstrumentsByCategory(categories: string[]): InstrumentCollection {
        const instruments: InstrumentCollection = {};
        
        categories.forEach(category => {
            if (this.options.enabledCategories?.includes(category)) {
                const categoryInstruments = getInstrumentsByCategory(category);
                Object.assign(instruments, categoryInstruments);
            }
        });
        
        return this.processInstrumentCollection(instruments);
    }

    /**
     * Load a specific instrument by name
     */
    public loadInstrument(instrumentName: string): LoadedInstrumentConfig | null {
        // Check cache first
        if (this.loadedInstruments.has(instrumentName)) {
            return this.loadedInstruments.get(instrumentName)!;
        }

        // Search through all families
        for (const family of instrumentFamilies) {
            if (family.instruments[instrumentName]) {
                const config = this.processInstrumentConfig(
                    family.instruments[instrumentName], 
                    family.name
                );
                this.loadedInstruments.set(instrumentName, config);
                return config;
            }
        }

        return null;
    }

    /**
     * Get loaded instrument from cache
     */
    public getLoadedInstrument(instrumentName: string): LoadedInstrumentConfig | null {
        return this.loadedInstruments.get(instrumentName) || null;
    }

    /**
     * Check if an instrument is loaded
     */
    public isInstrumentLoaded(instrumentName: string): boolean {
        return this.loadedInstruments.has(instrumentName);
    }

    /**
     * Get all loaded instruments
     */
    public getLoadedInstruments(): Map<string, LoadedInstrumentConfig> {
        return new Map(this.loadedInstruments);
    }

    /**
     * Clear the loaded instruments cache
     */
    public clearCache(): void {
        this.loadedInstruments.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): {
        loadedInstruments: number;
        cachedFamilies: number;
        memoryEstimate: string;
        uptime: number;
    } {
        const uptime = Date.now() - this.loadedAt;
        const instrumentCount = this.loadedInstruments.size;
        const familyCount = this.familyCache.size;
        
        // Rough memory estimate (each instrument config ~2KB)
        const memoryEstimate = `~${(instrumentCount * 2 + familyCount * 5)}KB`;
        
        return {
            loadedInstruments: instrumentCount,
            cachedFamilies: familyCount,
            memoryEstimate,
            uptime
        };
    }

    /**
     * Process instrument collection - apply format and caching
     */
    private processInstrumentCollection(instruments: InstrumentCollection): InstrumentCollection {
        const processed: InstrumentCollection = {};
        
        Object.entries(instruments).forEach(([name, config]) => {
            processed[name] = this.processInstrumentConfig(config);
            
            // Cache the processed config
            if (!this.loadedInstruments.has(name)) {
                this.loadedInstruments.set(name, processed[name] as LoadedInstrumentConfig);
            }
        });
        
        return processed;
    }

    /**
     * Process individual instrument config - replace format placeholders
     */
    private processInstrumentConfig(config: InstrumentConfig, familyName?: string): LoadedInstrumentConfig {
        const processedConfig: LoadedInstrumentConfig = {
            ...config,
            family: familyName,
            loadedAt: Date.now(),
            urls: {}
        };

        // Replace format placeholders with actual audio format
        Object.entries(config.urls).forEach(([note, url]) => {
            processedConfig.urls[note] = url.replace(FORMAT_PLACEHOLDER, this.options.audioFormat);
        });

        return processedConfig;
    }

    /**
     * Update audio format and reprocess loaded instruments
     */
    public updateAudioFormat(format: 'mp3' | 'wav' | 'ogg'): void {
        this.options.audioFormat = format;
        
        // Reprocess all loaded instruments with new format
        const reprocessed = new Map<string, LoadedInstrumentConfig>();
        this.loadedInstruments.forEach((config, name) => {
            const updated = this.processInstrumentConfig(config, config.family);
            reprocessed.set(name, updated);
        });
        
        this.loadedInstruments = reprocessed;
    }

    /**
     * Get available instrument families
     */
    public getAvailableFamilies(): InstrumentFamily[] {
        return [...instrumentFamilies];
    }

    /**
     * Get available categories
     */
    public getAvailableCategories(): string[] {
        const categories = new Set<string>();
        instrumentFamilies.forEach(family => {
            Object.values(family.instruments).forEach(instrument => {
                if (instrument.category) {
                    categories.add(instrument.category);
                }
            });
        });
        return Array.from(categories).sort();
    }

    /**
     * Get instrument count by category
     */
    public getInstrumentCountByCategory(): Record<string, number> {
        const counts: Record<string, number> = {};
        
        instrumentFamilies.forEach(family => {
            Object.values(family.instruments).forEach(instrument => {
                const category = instrument.category || 'uncategorized';
                counts[category] = (counts[category] || 0) + 1;
            });
        });
        
        return counts;
    }

    /**
     * Validate instrument configuration
     */
    public validateInstrument(instrumentName: string): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const config = this.loadInstrument(instrumentName);
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!config) {
            errors.push(`Instrument '${instrumentName}' not found`);
            return { isValid: false, errors, warnings };
        }
        
        // Validate required properties
        if (!config.urls || Object.keys(config.urls).length === 0) {
            errors.push(`Instrument '${instrumentName}' has no sample URLs`);
        }
        
        if (!config.baseUrl) {
            errors.push(`Instrument '${instrumentName}' missing baseUrl`);
        }
        
        if (config.release < 0) {
            errors.push(`Instrument '${instrumentName}' has negative release time`);
        }
        
        // Validate sample URLs
        Object.entries(config.urls).forEach(([note, url]) => {
            if (!url.includes(this.options.audioFormat)) {
                warnings.push(`Sample URL for ${note} may not match current audio format`);
            }
        });
        
        // Check for reasonable voice limits
        if (config.maxVoices && config.maxVoices > 16) {
            warnings.push(`Instrument '${instrumentName}' has high voice count (${config.maxVoices})`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}