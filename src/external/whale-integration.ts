/**
 * Whale Integration Layer
 * Connects Freesound whale samples with the existing audio engine
 */

import { WhaleAudioManager, WhaleIntegrationSettings } from './freesound';
import { getLogger } from '../logging';

const logger = getLogger('whale-integration');

export class WhaleIntegration {
    private whaleManager: WhaleAudioManager | null = null;
    private isEnabled: boolean = false;
    private settings: WhaleIntegrationSettings;

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

    constructor(userSettings?: Partial<WhaleIntegrationSettings>) {
        this.settings = {
            ...WhaleIntegration.DEFAULT_SETTINGS,
            ...userSettings
        };
    }

    /**
     * Initialize whale integration (Phase 1: Seed Collection)
     */
    async initialize(): Promise<void> {
        if (!this.settings.useWhaleExternal) {
            logger.info('init', 'Whale external samples disabled in settings');
            return;
        }

        try {
            // Initialize with seed collection only (no API credentials needed for Phase 1)
            this.whaleManager = new WhaleAudioManager(this.settings);
            this.isEnabled = true;
            
            logger.info('init', 'Whale integration initialized with seed collection');
        } catch (error) {
            logger.error('init', 'Failed to initialize whale integration:', error);
            this.isEnabled = false;
        }
    }

    /**
     * Enhanced instrument loader that handles external whale samples
     */
    async loadInstrumentSample(instrumentName: string, note: string, frequency?: number): Promise<AudioBuffer | null> {
        if (!this.isEnabled || !this.whaleManager) {
            return null;
        }

        // Check if this is a whale instrument with external samples
        if (this.isWhaleInstrument(instrumentName)) {
            const species = this.extractWhaleSpecies(instrumentName);
            
            try {
                const audioBuffer = await this.whaleManager.loadWhaleSample(frequency, species);
                if (audioBuffer) {
                    logger.debug('loading', `Loaded external whale sample for ${instrumentName}`);
                    return audioBuffer;
                }
            } catch (error) {
                logger.warn('loading', `Failed to load external whale sample for ${instrumentName}:`, error);
            }
        }

        return null; // Fallback to regular instrument loading
    }

    /**
     * Check if instrument uses external whale samples
     */
    private isWhaleInstrument(instrumentName: string): boolean {
        const whaleInstruments = [
            'whaleBlue',
            'whaleOrca', 
            'whaleGray',
            'whaleSperm',
            'whaleMinke',
            'whaleFin',
            'whaleHumpbackExternal'
        ];
        
        return whaleInstruments.includes(instrumentName);
    }

    /**
     * Extract whale species from instrument name
     */
    private extractWhaleSpecies(instrumentName: string): 'humpback' | 'blue' | 'orca' | 'gray' | 'sperm' | 'minke' | 'fin' {
        const mapping = {
            'whaleBlue': 'blue',
            'whaleOrca': 'orca',
            'whaleGray': 'gray', 
            'whaleSperm': 'sperm',
            'whaleMinke': 'minke',
            'whaleFin': 'fin',
            'whaleHumpbackExternal': 'humpback'
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
export async function initializeWhaleIntegration(settings?: Partial<WhaleIntegrationSettings>): Promise<void> {
    whaleIntegration = new WhaleIntegration(settings);
    await whaleIntegration.initialize();
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
    if (!whaleIntegration) return null;
    
    return await whaleIntegration.loadInstrumentSample(instrumentName, note, frequency);
}