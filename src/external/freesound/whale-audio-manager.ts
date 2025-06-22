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
    private cachedSamples: Map<WhaleSpecies, AudioBuffer[]> = new Map();
    private settings: WhaleIntegrationSettings;
    private lastDiscoveryTime: number = 0;
    private initializationPromise: Promise<void> | null = null;
    
    // Seed collection from our research - Enhanced with NOAA Fisheries MP3s
    private readonly SEED_COLLECTION: Record<WhaleSpecies, string[]> = {
        humpback: [
            // Alaska NOAA PMEL recording (Archive.org mirror)
            'https://web.archive.org/web/20250507121520/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/akhumphi1x.wav',
            // Alaska humpback whale - NOAA Ocean Explorer Sea Sounds (Archive.org mirror)
            'https://web.archive.org/web/20250316052243/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/akhumphi1x.mp3',
            // American Samoa humpback with snapping shrimp (Archive.org mirror)
            'https://web.archive.org/web/20250501011939/https://pmel.noaa.gov/acoustics/multimedia/HB-ship-AMSNP.wav',
            // NOAA Pennsylvania Group humpback song (Archive.org mirror)
            'https://web.archive.org/web/20250421195559/https://www.fisheries.noaa.gov/s3/2023-04/Meno-song-NOAA-PAGroup-13-humpback-clip.mp3',
            // Historic "Songs of the Humpback Whale" 1970 - Side 1 (Roger S. Payne, Bermuda)
            'https://archive.org/download/songsofhumpbackw00payn/Side%201.mp3',
            // Historic "Songs of the Humpback Whale" 1970 - Side 2 (Roger S. Payne, Bermuda)
            'https://archive.org/download/songsofhumpbackw00payn/Side%202.mp3'
        ],
        blue: [
            // Cornell/NOAA Long Island blue whale (Archive.org mirror)
            'https://web.archive.org/web/20250420204702/https://www.fisheries.noaa.gov/s3/2023-04/Cornell-NY-LongIsland-20090123-000000-LPfilter20-amplified-x8speed-blue-clip.mp3',
            // Northeast Pacific blue whale (Archive.org mirror)
            'https://web.archive.org/web/20250507125154/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/nepblue.mp3',
            // Northeast Pacific blue whale - PMEL recording (Archive.org mirror)
            'https://web.archive.org/web/20250526025156/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/nepblue24s10x.wav',
            // West Pacific blue whale - PMEL recording (Archive.org mirror)
            'https://web.archive.org/web/20250313112719/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/wblue26s10x.wav',
            // South Pacific blue whale - PMEL recording (Archive.org mirror)
            'https://web.archive.org/web/20250313112756/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/etpb3_10xc-BlueWhaleSouthPacific-10x.wav',
            // Atlantic blue whale - PMEL recording (Archive.org mirror)
            'https://web.archive.org/web/20250430204620/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlblue_512_64_0-50_10x.wav',
            // 52 Hz whale call - "World's loneliest whale" (Archive.org mirror)
            'https://web.archive.org/web/20250309152144/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/ak52_10x.wav',
            // NOAA Ocean Explorer blue whale - Lewis & Clark expedition (Archive.org mirror)
            'https://web.archive.org/web/20250507052906/https://oceanexplorer.noaa.gov/explorations/lewis_clark01/background/hydroacoustics/media/bluewhale24s10x.mp3',
            // Channel Islands blue whale - SanctSound project (Archive.org mirror)
            'https://web.archive.org/web/20250413110747/https://sanctsound.ioos.us/files/SanctSound_MB01_01_bluewhale_20181123T203257Z_6xSpeed.wav.mp3',
            // Channel Islands blue whale - SanctSound CI05 station (Archive.org mirror)
            'https://web.archive.org/web/20250413110745/https://sanctsound.ioos.us/files/SanctSound_CI05_03_bluewhale_20190926T230959Z_41dBgain_4xSpeed.wav',
            // Olympic Coast blue whale - SanctSound OC02 station (Archive.org mirror)
            'https://web.archive.org/web/20250413110747/https://sanctsound.ioos.us/files/SanctSound_OC02_02_bluewhale_20191028T005013Z_45dBgain_6xSpeed.wav',
            // Santa Barbara blue and fin whales - SanctSound SB02 station (Archive.org mirror)
            'https://web.archive.org/web/20250413110747/https://sanctsound.ioos.us/files/SanctSound_SB02_06_blueandfinwhales_20191025T050452Z_10xSpeed.wav'
        ],
        orca: [
            // No suitable recordings found - placeholder for future API integration
        ],
        gray: [
            // MBARI_MARS oceanic soundscape project - Gray whale (Eschrichtius robustus) from deep-sea cabled observatory
            'https://freesound.org/people/MBARI_MARS/sounds/413377/download/'
        ],
        sperm: [
            // No suitable recordings found - placeholder for future API integration
        ],
        minke: [
            // NOAA PMEL Atlantic minke (Archive.org mirror)
            'https://web.archive.org/web/20250430135640/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlmin_512_64_0-50_10x.wav',
            // NOAA Ocean Explorer Atlantic minke - Sea Sounds collection (Archive.org mirror)
            'https://web.archive.org/web/20250507045438/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/atlminke10x.mp3',
            // NOAA Pennsylvania Group minke pulse trains (Archive.org mirror)
            'https://web.archive.org/web/20250420205440/https://www.fisheries.noaa.gov/s3/2023-04/Baac-pulsetrains-NOAA-PAGroup-25-minke-clip.mp3'
        ],
        fin: [
            // NOAA Pennsylvania Group fin whale song (Archive.org mirror)
            'https://web.archive.org/web/20250501031730/https://www.fisheries.noaa.gov/s3/2023-04/Baph-song-NOAA-PAGroup-05-x5speed-fin-clip.mp3',
            // NOAA Ocean Explorer Atlantic fin whale - Sea Sounds collection (Archive.org mirror)
            'https://web.archive.org/web/20250507061824/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/atlfin.mp3',
            // NOAA Ocean Explorer fin whale - Lewis & Clark expedition (Archive.org mirror)
            'https://web.archive.org/web/20250507062125/https://oceanexplorer.noaa.gov/explorations/lewis_clark01/background/hydroacoustics/media/finwhale15s10x.mp3',
            // Channel Islands fin whale - SanctSound CI05 station (Archive.org mirror)
            'https://web.archive.org/web/20250413110750/https://sanctsound.ioos.us/files/SanctSound_CI05_04_finwhale_20191228T134133Z_6xSpeed.wav',
            // Monterey Bay fin whale - SanctSound MB01 station (Archive.org mirror)
            'https://web.archive.org/web/20250413110752/https://sanctsound.ioos.us/files/SanctSound_MB01_05_finwhale_20200417T214135Z_53dBgain_8xSpeed.wav',
            // Olympic Coast fin whale - SanctSound OC02 station (Archive.org mirror)
            'https://web.archive.org/web/20250413110752/https://sanctsound.ioos.us/files/SanctSound_OC02_02_finwhale_20190905T020206Z_48dBGain_6xSpeed.wav'
        ],
        right: [
            // Right whale upcalls (critically endangered) (Archive.org mirror)
            'https://web.archive.org/web/20250430145142/https://www.fisheries.noaa.gov/s3/2023-04/Eugl-upcall-NOAA-PAGroup-01-right-clip-1.mp3',
            // Right whale multi-sound patterns (Archive.org mirror)
            'https://web.archive.org/web/20250421074258/https://www.fisheries.noaa.gov/s3/2023-04/Eugl-multisound-NOAA-PAGroup-01-right-whale-clip.mp3'
        ],
        sei: [
            // Sei whale downsweeps (Archive.org mirror)
            'https://web.archive.org/web/20250420230007/https://www.fisheries.noaa.gov/s3/2023-04/Babo-downsweep-NOAA-PAGroup-06-x2speed-sei-whale-clip.mp3'
        ],
        pilot: [
            // Pilot whale multi-sound (toothed whale) (Archive.org mirror)
            'https://web.archive.org/web/20250617094506/https://www.fisheries.noaa.gov/s3/2023-04/Glsp-Multisound-NOAA-PAGroup-01-pilot-whale-clip.mp3'
        ],
        mixed: [
            // No suitable recordings found - placeholder for future API integration
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
        
        // Start downloading and caching samples asynchronously
        this.initializationPromise = this.downloadAndCacheSamples();
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
     * Download and cache whale samples locally for better performance
     */
    private async downloadAndCacheSamples(): Promise<void> {
        logger.info('cache-init', 'Starting whale sample caching process', {
            totalSpecies: this.sampleUrls.size,
            totalUrls: Array.from(this.sampleUrls.values()).reduce((sum, urls) => sum + urls.length, 0)
        });

        const downloadPromises: Promise<void>[] = [];

        for (const [species, urls] of this.sampleUrls.entries()) {
            // Filter to only direct audio file URLs that we can cache
            const directUrls = urls.filter(url => 
                url.includes('.wav') || url.includes('.mp3') || url.includes('.ogg')
            );

            if (directUrls.length === 0) {
                logger.debug('cache-init', 'No direct audio URLs found for species', {
                    species,
                    totalUrls: urls.length
                });
                continue;
            }

            // Download samples for this species
            const speciesPromise = this.downloadSpeciesSamples(species, directUrls);
            downloadPromises.push(speciesPromise);
        }

        try {
            await Promise.allSettled(downloadPromises);
            
            const totalCached = Array.from(this.cachedSamples.values())
                .reduce((sum, buffers) => sum + buffers.length, 0);
                
            logger.info('cache-init', 'Whale sample caching completed', {
                totalCached,
                speciesCached: this.cachedSamples.size,
                cacheStatus: Object.fromEntries(
                    Array.from(this.cachedSamples.entries())
                        .map(([species, buffers]) => [species, buffers.length])
                )
            });
        } catch (error) {
            logger.error('cache-init', 'Error during sample caching', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Download samples for a specific species
     */
    private async downloadSpeciesSamples(species: WhaleSpecies, urls: string[]): Promise<void> {
        const buffers: AudioBuffer[] = [];
        
        logger.debug('cache-download', 'Downloading samples for species', {
            species,
            urlCount: urls.length
        });

        for (const url of urls) {
            try {
                logger.debug('cache-download', 'Downloading sample', {
                    species,
                    url: url.substring(0, 60) + '...'
                });

                const audioBuffer = await this.downloadAndDecodeAudio(url);
                if (audioBuffer) {
                    buffers.push(audioBuffer);
                    
                    logger.debug('cache-download', 'Successfully cached sample', {
                        species,
                        bufferLength: audioBuffer.length,
                        sampleRate: audioBuffer.sampleRate,
                        duration: audioBuffer.length / audioBuffer.sampleRate
                    });
                }
            } catch (error) {
                logger.warn('cache-download', 'Failed to download sample', {
                    species,
                    url: url.substring(0, 60) + '...',
                    error: error instanceof Error ? error.message : String(error)
                });
                // Continue with other samples
            }
        }

        if (buffers.length > 0) {
            this.cachedSamples.set(species, buffers);
            logger.info('cache-download', 'Cached samples for species', {
                species,
                sampleCount: buffers.length,
                requestedCount: urls.length
            });
        } else {
            logger.warn('cache-download', 'No samples successfully cached for species', {
                species,
                attemptedUrls: urls.length
            });
        }
    }

    /**
     * Download and decode audio from URL with proper error handling
     */
    private async downloadAndDecodeAudio(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'audio/*',
                    'User-Agent': 'Sonigraph-Obsidian-Plugin/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            
            // Use Web Audio API to decode
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            return audioBuffer;
        } catch (error) {
            logger.debug('download', 'Failed to download/decode audio', {
                url: url.substring(0, 60) + '...',
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    /**
     * Load whale sample for playback from local cache
     * Implements the frequency-based species selection from the plan
     */
    async loadWhaleSample(frequency?: number, species?: WhaleSpecies): Promise<AudioBuffer | null> {
        const targetSpecies = species || this.mapFrequencyToSpecies(frequency);
        
        logger.info('whale-manager', 'Loading whale sample from cache', {
            requestedSpecies: species,
            frequency,
            targetSpecies,
            hasFrequency: !!frequency
        });

        // Wait for initialization to complete if still in progress
        if (this.initializationPromise) {
            try {
                await this.initializationPromise;
            } catch (error) {
                logger.warn('whale-manager', 'Initialization not complete, proceeding with available cache', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        try {
            // Get cached samples for species
            const cachedBuffers = this.cachedSamples.get(targetSpecies) || [];
            if (cachedBuffers.length === 0) {
                logger.warn('whale-manager', 'No cached samples available for species', {
                    species: targetSpecies,
                    availableSpecies: Array.from(this.cachedSamples.keys()),
                    totalCached: Array.from(this.cachedSamples.values()).reduce((sum, arr) => sum + arr.length, 0)
                });
                return null;
            }

            // Select random sample from cached buffers
            const selectedIndex = Math.floor(Math.random() * cachedBuffers.length);
            const selectedBuffer = cachedBuffers[selectedIndex];
            
            logger.info('whale-manager', 'Successfully loaded whale sample from cache', {
                species: targetSpecies,
                selectedIndex,
                totalCached: cachedBuffers.length,
                bufferLength: selectedBuffer.length,
                sampleRate: selectedBuffer.sampleRate,
                channels: selectedBuffer.numberOfChannels,
                duration: selectedBuffer.length / selectedBuffer.sampleRate
            });
            
            return selectedBuffer;
            
        } catch (error) {
            logger.error('whale-manager', 'Failed to load whale sample from cache', {
                species: targetSpecies,
                frequency,
                error: error instanceof Error ? error.message : String(error)
            });
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
     * Get current sample collection statistics (cached samples)
     */
    getCollectionStats(): Record<WhaleSpecies, number> {
        const stats: Record<WhaleSpecies, number> = {} as any;
        
        Object.values(['humpback', 'blue', 'orca', 'gray', 'sperm', 'minke', 'fin', 'right', 'sei', 'pilot', 'mixed'] as WhaleSpecies[]).forEach(species => {
            stats[species] = this.cachedSamples.get(species)?.length || 0;
        });
        
        return stats;
    }

    /**
     * Get cache status information for UI display
     */
    getCacheStatus(): {
        isInitialized: boolean;
        totalCached: number;
        speciesCached: number;
        cacheBySpecies: Record<string, number>;
    } {
        const totalCached = Array.from(this.cachedSamples.values())
            .reduce((sum, buffers) => sum + buffers.length, 0);
            
        const cacheBySpecies: Record<string, number> = {};
        this.cachedSamples.forEach((buffers, species) => {
            cacheBySpecies[species] = buffers.length;
        });

        return {
            isInitialized: this.initializationPromise === null,
            totalCached,
            speciesCached: this.cachedSamples.size,
            cacheBySpecies
        };
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