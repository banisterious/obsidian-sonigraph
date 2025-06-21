/**
 * Whale Audio Manager
 * Integrates Freesound API with Sonigraph's audio engine for whale sounds
 */

import { FreesoundAPIClient } from './client';
import { 
    WhaleIntegrationSettings, 
    WhaleSpecies, 
    SampleDiscoveryResult,
    FreesoundSample,
    WhaleSearchQuery
} from './types';
import { getLogger } from '../../logging';

const logger = getLogger('whale-audio-manager');

export class WhaleAudioManager {
    private freesoundClient: FreesoundAPIClient;
    private sampleUrls: Map<WhaleSpecies, string[]> = new Map();
    private settings: WhaleIntegrationSettings;
    private lastDiscoveryTime: number = 0;
    
    // Seed collection from our research - Enhanced with NOAA Fisheries MP3s
    private readonly SEED_COLLECTION: Record<WhaleSpecies, string[]> = {
        humpback: [
            // Caribbean field recording by listeningtowhales
            'https://freesound.org/people/listeningtowhales/sounds/[ID]/download/',
            // Alaska NOAA PMEL recording  
            'https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/akhumphi1x.wav',
            // NOAA Pennsylvania Group humpback song
            'https://www.fisheries.noaa.gov/s3/2023-04/Meno-song-NOAA-PAGroup-13-humpback-clip.mp3'
        ],
        blue: [
            // MBARI_MARS Monterey Bay hydrophone
            'https://freesound.org/people/MBARI_MARS/sounds/[ID]/download/',
            // Cornell/NOAA Long Island blue whale
            'https://www.fisheries.noaa.gov/s3/2023-04/Cornell-NY-LongIsland-20090123-000000-LPfilter20-amplified-x8speed-blue-clip.mp3'
        ],
        orca: [
            // MBARI_MARS deep-sea observatory
            'https://freesound.org/people/MBARI_MARS/sounds/[ID]/download/'
        ],
        gray: [
            // MBARI_MARS oceanic soundscape project
            'https://freesound.org/people/MBARI_MARS/sounds/[ID]/download/'
        ],
        sperm: [
            // MBARI_MARS cachalot echolocation
            'https://freesound.org/people/MBARI_MARS/sounds/[ID]/download/',
            // Newfoundland field recording by smithereens
            'https://freesound.org/people/smithereens/sounds/[ID]/download/'
        ],
        minke: [
            // NOAA PMEL Atlantic minke
            'https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlmin_512_64_0-50_10x.wav',
            // NOAA Pennsylvania Group minke pulse trains
            'https://www.fisheries.noaa.gov/s3/2023-04/Baac-pulsetrains-NOAA-PAGroup-25-minke-clip.mp3'
        ],
        fin: [
            // NOAA Pennsylvania Group fin whale song
            'https://www.fisheries.noaa.gov/s3/2023-04/Baph-song-NOAA-PAGroup-05-x5speed-fin-clip.mp3'
        ],
        right: [
            // Right whale upcalls (critically endangered)
            'https://www.fisheries.noaa.gov/s3/2023-04/Eugl-upcall-NOAA-PAGroup-01-right-clip-1.mp3',
            // Right whale multi-sound patterns
            'https://www.fisheries.noaa.gov/s3/2023-04/Eugl-multisound-NOAA-PAGroup-01-right-whale-clip.mp3'
        ],
        sei: [
            // Sei whale downsweeps
            'https://www.fisheries.noaa.gov/s3/2023-04/Babo-downsweep-NOAA-PAGroup-06-x2speed-sei-whale-clip.mp3'
        ],
        pilot: [
            // Pilot whale multi-sound (toothed whale)
            'https://www.fisheries.noaa.gov/s3/2023-04/Glsp-Multisound-NOAA-PAGroup-01-pilot-whale-clip.mp3'
        ],
        mixed: [
            // Fallback to humpback for mixed requests
            'https://freesound.org/people/listeningtowhales/sounds/[ID]/download/'
        ]
    };

    constructor(
        settings: WhaleIntegrationSettings,
        clientId?: string,
        clientSecret?: string
    ) {
        this.settings = settings;
        this.freesoundClient = new FreesoundAPIClient(clientId, clientSecret);
        this.initializeSeedCollection();
    }

    /**
     * Initialize with manually curated seed collection (Phase 1)
     */
    private initializeSeedCollection(): void {
        Object.entries(this.SEED_COLLECTION).forEach(([species, urls]) => {
            this.sampleUrls.set(species as WhaleSpecies, urls);
        });
        
        logger.info('init', 'Initialized whale audio manager with seed collection');
    }

    /**
     * Load whale sample for playback
     * Implements the frequency-based species selection from the plan
     */
    async loadWhaleSample(frequency?: number, species?: WhaleSpecies): Promise<AudioBuffer | null> {
        try {
            // Determine species based on frequency mapping if not specified
            const targetSpecies = species || this.mapFrequencyToSpecies(frequency);
            
            // Get sample URL for species
            const urls = this.sampleUrls.get(targetSpecies) || [];
            if (urls.length === 0) {
                logger.warn('loading', `No sample URLs available for ${targetSpecies}`);
                return null;
            }

            // Select random sample from available URLs
            const selectedUrl = urls[Math.floor(Math.random() * urls.length)];
            
            // Load and decode audio
            return await this.loadAudioFromUrl(selectedUrl);
            
        } catch (error) {
            logger.error('loading', `Failed to load whale sample:`, error);
            return null;
        }
    }

    /**
     * Map graph node frequency to whale species
     * Enhanced with new NOAA Fisheries species based on acoustic signatures
     */
    private mapFrequencyToSpecies(frequency?: number): WhaleSpecies {
        if (!frequency) return 'humpback'; // Default fallback
        
        // Ultra-low frequency nodes → Blue whale (10-40Hz infrasonic calls)
        if (frequency <= 30) return 'blue';
        
        // Ultra-low frequency nodes → Atlantic Fin whale (15-30Hz pulse sequences)  
        if (frequency <= 50) return 'fin';
        
        // Low frequency nodes → Atlantic Minke whale (35-50Hz downsweeps)
        if (frequency <= 100) return 'minke';
        
        // Low-mid frequency nodes → Right whale (50-500Hz upcalls)
        if (frequency <= 500) return 'right';
        
        // Mid frequency nodes → Sei whale (200-600Hz downsweeps)
        if (frequency <= 600) return 'sei';
        
        // Low frequency nodes → Gray whale (100-2000Hz migration calls)
        if (frequency <= 2000) return 'gray';
        
        // Mid frequency nodes → Humpback whale (20-4000Hz complex songs)
        if (frequency <= 4000) return 'humpback';
        
        // High frequency nodes → Pilot whale (300-8000Hz toothed whale)
        if (frequency <= 8000) return 'pilot';
        
        // High frequency nodes → Orca (500-25000Hz clicks and calls)
        if (frequency <= 25000) return 'orca';
        
        // Ultra-high frequency nodes → Sperm whale (100-30000Hz echolocation)
        return 'sperm';
    }

    /**
     * Load and decode audio from URL
     */
    private async loadAudioFromUrl(url: string): Promise<AudioBuffer> {
        // Handle different URL types
        if (url.includes('freesound.org')) {
            return await this.loadFreesoundSample(url);
        } else if (url.includes('pmel.noaa.gov')) {
            return await this.loadDirectUrl(url);
        } else if (url.includes('fisheries.noaa.gov')) {
            return await this.loadDirectUrl(url);
        } else {
            throw new Error(`Unsupported URL format: ${url}`);
        }
    }

    /**
     * Load sample from Freesound.org
     */
    private async loadFreesoundSample(url: string): Promise<AudioBuffer> {
        // Extract sample ID from URL pattern
        const idMatch = url.match(/sounds\/(\d+)\//);
        if (!idMatch) {
            throw new Error(`Cannot extract sample ID from URL: ${url}`);
        }
        
        const sampleId = parseInt(idMatch[1]);
        const audioData = await this.freesoundClient.downloadSample(sampleId);
        
        // Decode audio data using Web Audio API
        const audioContext = new AudioContext();
        return await audioContext.decodeAudioData(audioData);
    }

    /**
     * Load sample from direct URL (NOAA PMEL, etc.)
     */
    private async loadDirectUrl(url: string): Promise<AudioBuffer> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        return await audioContext.decodeAudioData(arrayBuffer);
    }

    /**
     * Discover new whale samples (Phase 2 - Manual Discovery)
     */
    async discoverNewSamples(species: WhaleSpecies, manual: boolean = true): Promise<SampleDiscoveryResult> {
        if (!manual && !this.settings.autoDiscovery) {
            throw new Error('Automated discovery is disabled in settings');
        }

        // Check discovery frequency limits
        if (!manual && !this.shouldRunDiscovery()) {
            logger.info('discovery', 'Skipping discovery due to frequency limits');
            return {
                samples: [],
                validated: [],
                rejected: [],
                statistics: { totalFound: 0, validationRate: 0, averageQuality: 0 }
            };
        }

        const query: WhaleSearchQuery = {
            species,
            duration: [5, 120],
            quality: this.settings.qualityThreshold,
            excludeTerms: [],
            licenseFilter: 'cc',
            trustedSources: true
        };

        logger.info('discovery', `Starting ${manual ? 'manual' : 'automatic'} discovery for ${species}`);
        
        const result = await this.freesoundClient.searchWhaleContent(query);
        this.lastDiscoveryTime = Date.now();
        
        return result;
    }

    /**
     * Check if automated discovery should run based on frequency settings
     */
    private shouldRunDiscovery(): boolean {
        if (this.settings.discoveryFrequency === 'never') return false;
        
        const now = Date.now();
        const timeSinceLastDiscovery = now - this.lastDiscoveryTime;
        
        const intervals = {
            weekly: 7 * 24 * 60 * 60 * 1000,
            monthly: 30 * 24 * 60 * 60 * 1000
        };
        
        const requiredInterval = intervals[this.settings.discoveryFrequency];
        return timeSinceLastDiscovery >= requiredInterval;
    }

    /**
     * Add approved samples to collection (Phase 2)
     */
    async addApprovedSamples(species: WhaleSpecies, samples: FreesoundSample[]): Promise<void> {
        const currentUrls = this.sampleUrls.get(species) || [];
        const maxSamples = this.settings.maxSamples || 50;
        
        // Convert samples to URLs
        const newUrls = samples.map(sample => 
            `https://freesound.org/people/${sample.username}/sounds/${sample.id}/download/`
        );
        
        // Add new URLs, respecting max limit
        const allUrls = [...currentUrls, ...newUrls];
        const limitedUrls = allUrls.slice(0, maxSamples);
        
        this.sampleUrls.set(species, limitedUrls);
        
        logger.info('samples', `Added ${newUrls.length} new samples for ${species}, total: ${limitedUrls.length}`);
    }

    /**
     * Get current sample collection statistics
     */
    getCollectionStats(): Record<WhaleSpecies, number> {
        const stats: Record<WhaleSpecies, number> = {} as any;
        
        Object.values(['humpback', 'blue', 'orca', 'gray', 'sperm', 'minke', 'fin', 'right', 'sei', 'pilot', 'mixed'] as WhaleSpecies[]).forEach(species => {
            stats[species] = this.sampleUrls.get(species)?.length || 0;
        });
        
        return stats;
    }

    /**
     * Clear sample URLs for a species
     */
    clearSpeciesSamples(species: WhaleSpecies): void {
        this.sampleUrls.delete(species);
        logger.info('samples', `Cleared samples for ${species}`);
    }

    /**
     * Reset to seed collection
     */
    resetToSeedCollection(): void {
        this.sampleUrls.clear();
        this.initializeSeedCollection();
        logger.info('samples', 'Reset to seed collection');
    }

    /**
     * Export sample URLs for storage in plugin settings
     */
    exportSampleUrls(): Record<WhaleSpecies, string[]> {
        const exported: Record<WhaleSpecies, string[]> = {} as any;
        
        this.sampleUrls.forEach((urls, species) => {
            exported[species] = [...urls]; // Clone arrays
        });
        
        return exported;
    }

    /**
     * Import sample URLs from plugin settings
     */
    importSampleUrls(data: Record<WhaleSpecies, string[]>): void {
        this.sampleUrls.clear();
        
        Object.entries(data).forEach(([species, urls]) => {
            this.sampleUrls.set(species as WhaleSpecies, urls);
        });
        
        logger.info('settings', 'Imported sample URLs from settings');
    }

    /**
     * Update settings
     */
    updateSettings(newSettings: Partial<WhaleIntegrationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Get attribution information for currently loaded samples
     */
    getAttributionInfo(): Record<WhaleSpecies, string[]> {
        const attribution: Record<WhaleSpecies, string[]> = {} as any;
        
        // Map our known sources to attribution strings
        const SOURCE_ATTRIBUTION = {
            'MBARI_MARS': 'Monterey Bay Aquarium Research Institute (MBARI_MARS)',
            'listeningtowhales': 'Caribbean whale recordings by listeningtowhales',
            'smithereens': 'Newfoundland field recordings by smithereens',
            'pmel.noaa.gov': 'NOAA Pacific Marine Environmental Laboratory (PMEL)'
        };
        
        this.sampleUrls.forEach((urls, species) => {
            const sources = urls.map(url => {
                // Extract source from URL
                for (const [source, attr] of Object.entries(SOURCE_ATTRIBUTION)) {
                    if (url.includes(source)) return attr;
                }
                return 'External source';
            });
            
            attribution[species] = [...new Set(sources)]; // Remove duplicates
        });
        
        return attribution;
    }
}