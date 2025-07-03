/**
 * Whale Integration Layer
 * Connects Freesound whale samples with the existing audio engine
 */

import { WhaleAudioManager, WhaleIntegrationSettings } from './freesound';
import { getLogger } from '../logging';
import { Vault } from 'obsidian';

const logger = getLogger('whale-integration');

export class WhaleIntegration {
    private whaleManager: WhaleAudioManager | null = null;
    private isEnabled: boolean = false;
    private settings: WhaleIntegrationSettings;
    private vault: Vault | null = null;
    private pluginDir: string | null = null;

    // Default settings based on the integration plan
    private static readonly DEFAULT_SETTINGS: WhaleIntegrationSettings = {
        useWhaleExternal: false, // User must explicitly enable
        autoDiscovery: false,
        discoveryFrequency: 'never',
        qualityThreshold: 'strict',
        allowBackgroundFetch: false,
        speciesPreference: 'humpback',
        sampleUrls: [],
        trustedInstitutions: ['MBARI_MARS', 'NOAA_fisheries', 'listeningtowhales'],
        maxSamples: 50
    };

    constructor(userSettings?: Partial<WhaleIntegrationSettings>, vault?: Vault, pluginDir?: string) {
        this.settings = {
            ...WhaleIntegration.DEFAULT_SETTINGS,
            ...userSettings
        };
        this.vault = vault;
        this.pluginDir = pluginDir;
    }

    /**
     * Initialize whale integration (Phase 1: Seed Collection)
     */
    async initialize(): Promise<void> {
        logger.info('init', 'Starting whale integration initialization', {
            useWhaleExternal: this.settings.useWhaleExternal,
            settings: this.settings
        });

        if (!this.settings.useWhaleExternal) {
            logger.info('init', 'Whale external samples disabled in settings');
            return;
        }

        try {
            // Initialize with seed collection only (no API credentials needed for Phase 1)
            this.whaleManager = new WhaleAudioManager(this.settings, undefined, undefined, this.vault, this.pluginDir);
            this.isEnabled = true;
            
            logger.info('init', 'Whale integration initialized with seed collection', {
                isEnabled: this.isEnabled,
                hasManager: !!this.whaleManager
            });
        } catch (error) {
            logger.error('init', 'Failed to initialize whale integration:', error);
            this.isEnabled = false;
        }
    }

    /**
     * Enhanced instrument loader that handles external whale samples
     */
    async loadInstrumentSample(instrumentName: string, note: string, frequency?: number): Promise<AudioBuffer | null> {
        logger.debug('sample-loading', 'loadInstrumentSample called', {
            instrumentName,
            note,
            frequency,
            isEnabled: this.isEnabled,
            hasManager: !!this.whaleManager
        });

        if (!this.isEnabled || !this.whaleManager) {
            logger.debug('sample-loading', 'Whale integration not available', {
                isEnabled: this.isEnabled,
                hasManager: !!this.whaleManager
            });
            return null;
        }

        // Check if this is a whale instrument with external samples
        const isWhaleInst = this.isWhaleInstrument(instrumentName);
        logger.debug('sample-loading', 'Checking if whale instrument', {
            instrumentName,
            isWhaleInstrument: isWhaleInst
        });

        if (isWhaleInst) {
            const species = this.extractWhaleSpecies(instrumentName);
            
            logger.info('sample-loading', 'Loading external whale sample', {
                instrumentName,
                species,
                frequency,
                note
            });
            
            try {
                const audioBuffer = await this.whaleManager.loadWhaleSample(frequency, species);
                if (audioBuffer) {
                    logger.info('sample-loading', 'Successfully loaded external whale sample', {
                        instrumentName,
                        species,
                        bufferLength: audioBuffer.length,
                        sampleRate: audioBuffer.sampleRate,
                        channels: audioBuffer.numberOfChannels
                    });
                    return audioBuffer;
                } else {
                    logger.warn('sample-loading', 'No whale sample returned from manager', {
                        instrumentName,
                        species,
                        frequency
                    });
                }
            } catch (error) {
                logger.error('sample-loading', 'Failed to load external whale sample', {
                    instrumentName,
                    species,
                    frequency,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        logger.debug('sample-loading', 'Falling back to regular instrument loading', {
            instrumentName,
            reason: isWhaleInst ? 'whale_sample_failed' : 'not_whale_instrument'
        });
        return null; // Fallback to regular instrument loading
    }

    /**
     * Check if instrument uses external whale samples
     */
    private isWhaleInstrument(instrumentName: string): boolean {
        const whaleInstruments = [
            'whaleHumpback',  // Current whale instrument in the system
            'whaleBlue',
            'whaleOrca', 
            'whaleGray',
            'whaleSperm',
            'whaleMinke',
            'whaleFin'
        ];
        
        return whaleInstruments.includes(instrumentName);
    }

    /**
     * Extract whale species from instrument name
     */
    private extractWhaleSpecies(instrumentName: string): 'humpback' | 'blue' | 'orca' | 'gray' | 'sperm' | 'minke' | 'fin' {
        const mapping = {
            'whaleHumpback': 'humpback',  // Current whale instrument in the system
            'whaleBlue': 'blue',
            'whaleOrca': 'orca',
            'whaleGray': 'gray', 
            'whaleSperm': 'sperm',
            'whaleMinke': 'minke',
            'whaleFin': 'fin'
        } as const;
        
        return mapping[instrumentName as keyof typeof mapping] || 'humpback';
    }

    /**
     * Manual sample discovery (Phase 2)
     */
    async discoverSamples(species: 'humpback' | 'blue' | 'orca' | 'gray' | 'sperm' | 'minke' | 'fin'): Promise<any> {
        if (!this.whaleManager) {
            throw new Error('Whale manager not initialized');
        }

        return await this.whaleManager.discoverNewSamples(species, true);
    }

    /**
     * Get collection statistics for UI display
     */
    getCollectionStats(): Record<string, number> {
        if (!this.whaleManager) return {};
        return this.whaleManager.getCollectionStats();
    }

    /**
     * Get attribution information for current samples
     */
    getAttributionInfo(): Record<string, string[]> {
        if (!this.whaleManager) return {};
        return this.whaleManager.getAttributionInfo();
    }

    /**
     * Update integration settings
     */
    updateSettings(newSettings: Partial<WhaleIntegrationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.whaleManager) {
            this.whaleManager.updateSettings(this.settings);
        }

        // If whale external samples were disabled, clean up
        if (!this.settings.useWhaleExternal) {
            this.cleanup();
        }
    }

    /**
     * Export settings for persistence
     */
    exportSettings(): WhaleIntegrationSettings {
        const baseSettings = { ...this.settings };
        
        // Include current sample URLs if manager exists
        if (this.whaleManager) {
            baseSettings.sampleUrls = Object.values(this.whaleManager.exportSampleUrls()).flat();
        }
        
        return baseSettings;
    }

    /**
     * Import settings from persistence
     */
    importSettings(settings: WhaleIntegrationSettings): void {
        this.settings = settings;
        
        if (this.whaleManager && settings.sampleUrls) {
            // Convert flat URL array back to species mapping (simplified for Phase 1)
            const speciesUrls = {
                humpback: settings.sampleUrls.filter(url => url.includes('humpback') || url.includes('listeningtowhales')),
                blue: settings.sampleUrls.filter(url => url.includes('blue') || url.includes('MBARI_MARS')),
                orca: settings.sampleUrls.filter(url => url.includes('orca')),
                gray: settings.sampleUrls.filter(url => url.includes('gray')),
                sperm: settings.sampleUrls.filter(url => url.includes('sperm') || url.includes('cachalot')),
                minke: settings.sampleUrls.filter(url => url.includes('minke')),
                fin: settings.sampleUrls.filter(url => url.includes('fin')),
                right: settings.sampleUrls.filter(url => url.includes('right') || url.includes('eubalaena')),
                sei: settings.sampleUrls.filter(url => url.includes('sei') || url.includes('borealis')),
                pilot: settings.sampleUrls.filter(url => url.includes('pilot') || url.includes('globicephala')),
                mixed: [] as string[]
            };
            
            this.whaleManager.importSampleUrls(speciesUrls);
        }
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.isEnabled = false;
        this.whaleManager = null;
        logger.info('cleanup', 'Whale integration cleaned up');
    }

    /**
     * Check if whale integration is available and enabled
     */
    isAvailable(): boolean {
        return this.isEnabled && this.whaleManager !== null;
    }

    /**
     * Get current settings
     */
    getSettings(): WhaleIntegrationSettings {
        return { ...this.settings };
    }
}

// Global whale integration instance
let whaleIntegration: WhaleIntegration | null = null;

/**
 * Initialize global whale integration
 */
export async function initializeWhaleIntegration(settings?: Partial<WhaleIntegrationSettings>, vault?: Vault, pluginDir?: string): Promise<void> {
    logger.info('global-init', 'Initializing global whale integration', {
        hasSettings: !!settings,
        settingsKeys: settings ? Object.keys(settings) : [],
        pluginDir
    });
    
    whaleIntegration = new WhaleIntegration(settings, vault, pluginDir);
    await whaleIntegration.initialize();
    
    logger.info('global-init', 'Global whale integration initialization complete', {
        isAvailable: whaleIntegration.isAvailable(),
        settings: whaleIntegration.getSettings()
    });
}

/**
 * Get global whale integration instance
 */
export function getWhaleIntegration(): WhaleIntegration | null {
    return whaleIntegration;
}

/**
 * Check if a sample can be loaded externally
 */
export async function tryLoadExternalWhaleSample(
    instrumentName: string, 
    note: string, 
    frequency?: number
): Promise<AudioBuffer | null> {
    logger.debug('external-loading', 'tryLoadExternalWhaleSample called', {
        instrumentName,
        note,
        frequency,
        hasIntegration: !!whaleIntegration
    });

    if (!whaleIntegration) {
        logger.warn('external-loading', 'No whale integration available');
        return null;
    }
    
    return await whaleIntegration.loadInstrumentSample(instrumentName, note, frequency);
}