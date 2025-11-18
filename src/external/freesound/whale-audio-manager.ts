/**
 * Whale Audio Manager
 * Integrates Freesound API with Sonigraph's audio engine for whale sounds
 */

import { Vault, requestUrl } from 'obsidian';
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
    private vault: Vault | null = null;
    private cacheDir: string = ''; // Will be set from vault.configDir
    private legacyCacheDir: string = '.sonigraph-cache/whale-samples';
    private fileCache: Map<string, string> = new Map(); // URL -> file path mapping
    
    // Seed collection from our research - Enhanced with NOAA Fisheries MP3s
    private readonly SEED_COLLECTION: Record<WhaleSpecies, string[]> = {
        humpback: [
            // Alaska NOAA PMEL recording (Archive.org raw download)
            'https://web.archive.org/web/20250507121520if_/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/akhumphi1x.wav',
            // Alaska humpback whale - NOAA Ocean Explorer Sea Sounds (Archive.org raw download)
            'https://web.archive.org/web/20250316052243if_/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/akhumphi1x.mp3',
            // American Samoa humpback with snapping shrimp (Archive.org raw download)
            'https://web.archive.org/web/20250501011939if_/https://pmel.noaa.gov/acoustics/multimedia/HB-ship-AMSNP.wav',
            // NOAA Pennsylvania Group humpback song (Archive.org raw download)
            'https://web.archive.org/web/20250421195559if_/https://www.fisheries.noaa.gov/s3/2023-04/Meno-song-NOAA-PAGroup-13-humpback-clip.mp3',
            // Historic "Songs of the Humpback Whale" 1970 - Side 1 (Roger S. Payne, Bermuda) - Fixed with Wayback Machine
            'https://web.archive.org/web/20241201120000if_/https://archive.org/download/songsofhumpbackw00payn/Side%201.mp3',
            // Historic "Songs of the Humpback Whale" 1970 - Side 2 (Roger S. Payne, Bermuda) - Fixed with Wayback Machine
            'https://web.archive.org/web/20241201120000if_/https://archive.org/download/songsofhumpbackw00payn/Side%202.mp3'
        ],
        blue: [
            // Cornell/NOAA Long Island blue whale (Archive.org raw download)
            'https://web.archive.org/web/20250420204702if_/https://www.fisheries.noaa.gov/s3/2023-04/Cornell-NY-LongIsland-20090123-000000-LPfilter20-amplified-x8speed-blue-clip.mp3',
            // Northeast Pacific blue whale (Archive.org raw download)
            'https://web.archive.org/web/20250507125154if_/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/nepblue.mp3',
            // Northeast Pacific blue whale - PMEL recording (Archive.org raw download)
            'https://web.archive.org/web/20250526025156if_/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/nepblue24s10x.wav',
            // West Pacific blue whale - PMEL recording (Archive.org raw download)
            'https://web.archive.org/web/20250313112719if_/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/wblue26s10x.wav',
            // South Pacific blue whale - PMEL recording (Archive.org raw download)
            'https://web.archive.org/web/20250313112756if_/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/etpb3_10xc-BlueWhaleSouthPacific-10x.wav',
            // Atlantic blue whale - PMEL recording (Archive.org raw download)
            'https://web.archive.org/web/20250430204620if_/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlblue_512_64_0-50_10x.wav',
            // 52 Hz whale call - "World's loneliest whale" (Archive.org raw download)
            'https://web.archive.org/web/20250309152144if_/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/ak52_10x.wav',
            // NOAA Ocean Explorer blue whale - Lewis & Clark expedition (Archive.org raw download)
            'https://web.archive.org/web/20250507052906if_/https://oceanexplorer.noaa.gov/explorations/lewis_clark01/background/hydroacoustics/media/bluewhale24s10x.mp3',
            // Channel Islands blue whale - SanctSound project (Archive.org raw download)
            'https://web.archive.org/web/20250413110747if_/https://sanctsound.ioos.us/files/SanctSound_MB01_01_bluewhale_20181123T203257Z_6xSpeed.wav.mp3',
            // Channel Islands blue whale - SanctSound CI05 station (Archive.org raw download)
            'https://web.archive.org/web/20250413110745if_/https://sanctsound.ioos.us/files/SanctSound_CI05_03_bluewhale_20190926T230959Z_41dBgain_4xSpeed.wav',
            // Olympic Coast blue whale - SanctSound OC02 station (Archive.org raw download)
            'https://web.archive.org/web/20250413110747if_/https://sanctsound.ioos.us/files/SanctSound_OC02_02_bluewhale_20191028T005013Z_45dBgain_6xSpeed.wav',
            // Santa Barbara blue and fin whales - SanctSound SB02 station (Archive.org raw download)
            'https://web.archive.org/web/20250413110747if_/https://sanctsound.ioos.us/files/SanctSound_SB02_06_blueandfinwhales_20191025T050452Z_10xSpeed.wav'
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
            // NOAA PMEL Atlantic minke (Archive.org raw download)
            'https://web.archive.org/web/20250430135640if_/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlmin_512_64_0-50_10x.wav',
            // NOAA Ocean Explorer Atlantic minke - Sea Sounds collection (Archive.org raw download)
            'https://web.archive.org/web/20250507045438if_/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/atlminke10x.mp3',
            // NOAA Pennsylvania Group minke pulse trains (Archive.org raw download)
            'https://web.archive.org/web/20250420205440if_/https://www.fisheries.noaa.gov/s3/2023-04/Baac-pulsetrains-NOAA-PAGroup-25-minke-clip.mp3'
        ],
        fin: [
            // NOAA Pennsylvania Group fin whale song (Archive.org raw download)
            'https://web.archive.org/web/20250501031730if_/https://www.fisheries.noaa.gov/s3/2023-04/Baph-song-NOAA-PAGroup-05-x5speed-fin-clip.mp3',
            // NOAA Ocean Explorer Atlantic fin whale - Sea Sounds collection (Archive.org raw download)
            'https://web.archive.org/web/20250507061824if_/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/atlfin.mp3',
            // NOAA Ocean Explorer fin whale - Lewis & Clark expedition (Archive.org raw download)
            'https://web.archive.org/web/20250507062125if_/https://oceanexplorer.noaa.gov/explorations/lewis_clark01/background/hydroacoustics/media/finwhale15s10x.mp3',
            // Channel Islands fin whale - SanctSound CI05 station (Archive.org raw download)
            'https://web.archive.org/web/20250413110750if_/https://sanctsound.ioos.us/files/SanctSound_CI05_04_finwhale_20191228T134133Z_6xSpeed.wav',
            // Monterey Bay fin whale - SanctSound MB01 station (Archive.org raw download)
            'https://web.archive.org/web/20250413110752if_/https://sanctsound.ioos.us/files/SanctSound_MB01_05_finwhale_20200417T214135Z_53dBgain_8xSpeed.wav',
            // Olympic Coast fin whale - SanctSound OC02 station (Archive.org raw download)
            'https://web.archive.org/web/20250413110752if_/https://sanctsound.ioos.us/files/SanctSound_OC02_02_finwhale_20190905T020206Z_48dBGain_6xSpeed.wav'
        ],
        right: [
            // Right whale upcalls (critically endangered) (Archive.org raw download)
            'https://web.archive.org/web/20250430145142if_/https://www.fisheries.noaa.gov/s3/2023-04/Eugl-upcall-NOAA-PAGroup-01-right-clip-1.mp3',
            // Right whale multi-sound patterns (Archive.org raw download)
            'https://web.archive.org/web/20250421074258if_/https://www.fisheries.noaa.gov/s3/2023-04/Eugl-multisound-NOAA-PAGroup-01-right-whale-clip.mp3'
        ],
        sei: [
            // Sei whale downsweeps (Archive.org raw download)
            'https://web.archive.org/web/20250420230007if_/https://www.fisheries.noaa.gov/s3/2023-04/Babo-downsweep-NOAA-PAGroup-06-x2speed-sei-whale-clip.mp3'
        ],
        pilot: [
            // Pilot whale multi-sound (toothed whale) (Archive.org raw download)
            'https://web.archive.org/web/20250617094506if_/https://www.fisheries.noaa.gov/s3/2023-04/Glsp-Multisound-NOAA-PAGroup-01-pilot-whale-clip.mp3'
        ],
        mixed: [
            // No suitable recordings found - placeholder for future API integration
        ]
    };

    constructor(
        settings: WhaleIntegrationSettings,
        clientId?: string,
        clientSecret?: string,
        vault?: Vault,
        pluginDir?: string
    ) {
        this.settings = settings;
        this.freesoundClient = new FreesoundAPIClient(clientId, clientSecret);
        this.vault = vault;

        // Use plugin directory if provided, otherwise use vault.configDir
        if (pluginDir) {
            this.cacheDir = `${pluginDir}/cache/whale-samples`;
        } else if (vault) {
            this.cacheDir = `${vault.configDir}/plugins/sonigraph/cache/whale-samples`;
        }
        
        void this.initializeSeedCollection();
        
        // Initialize cache directory if vault is available
        if (this.vault) {
            void this.initializeCacheDirectory();
        }

        // Note: Automatic downloads disabled to reduce console errors on startup
        // Samples will only be downloaded when explicitly requested by user
        // this.initializationPromise = this.downloadAndCacheSamples();
    }

    /**
     * Initialize with manually curated seed collection (Phase 1)
     */
    private initializeSeedCollection(): void {
        Object.entries(this.SEED_COLLECTION).forEach(([species, urls]) => {
            this.sampleUrls.set(species as WhaleSpecies, urls);
        });
        
        void logger.info('init', 'Initialized whale audio manager with seed collection');
    }

    /**
     * Initialize cache directory structure in the user's vault
     */
    private async initializeCacheDirectory(): Promise<void> {
        if (!this.vault) return;

        try {
            // Check for legacy cache and migrate if needed
            await this.migrateLegacyCache();
            
            // Create main cache directory
            if (!await this.vault.adapter.exists(this.cacheDir)) {
                await this.vault.adapter.mkdir(this.cacheDir);
                logger.info('cache-init', 'Created whale sample cache directory', {
                    path: this.cacheDir
                });
            }

            // Create species subdirectories
            const species: WhaleSpecies[] = ['blue', 'humpback', 'fin', 'minke', 'right', 'sei', 'pilot', 'gray', 'orca', 'sperm', 'mixed'];
            for (const speciesName of species) {
                const speciesDir = `${this.cacheDir}/${speciesName}`;
                if (!await this.vault.adapter.exists(speciesDir)) {
                    await this.vault.adapter.mkdir(speciesDir);
                }
            }

            // Load existing cache index
            await this.loadCacheIndex();

            logger.info('cache-init', 'Cache directory structure initialized', {
                cacheDir: this.cacheDir,
                speciesDirectories: species.length
            });
        } catch (error) {
            logger.error('cache-init', 'Failed to initialize cache directory', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Migrate cache from legacy location (.sonigraph-cache) to plugin directory
     */
    private async migrateLegacyCache(): Promise<void> {
        if (!this.vault) return;

        try {
            // Check if legacy cache exists
            if (!await this.vault.adapter.exists(this.legacyCacheDir)) {
                return; // No legacy cache to migrate
            }

            logger.info('cache-migration', 'Legacy cache found, starting migration', {
                from: this.legacyCacheDir,
                to: this.cacheDir
            });

            // Ensure new cache directory exists
            const newCacheParent = this.cacheDir.split('/').slice(0, -1).join('/');
            if (!await this.vault.adapter.exists(newCacheParent)) {
                await this.vault.adapter.mkdir(newCacheParent);
            }

            // Get list of files/folders in legacy cache
            const legacyContents = await this.vault.adapter.list(this.legacyCacheDir);
            
            if (legacyContents.files.length > 0 || legacyContents.folders.length > 0) {
                // Create new cache directory if it doesn't exist
                if (!await this.vault.adapter.exists(this.cacheDir)) {
                    await this.vault.adapter.mkdir(this.cacheDir);
                }

                // Copy files
                for (const file of legacyContents.files) {
                    const fileName = file.split('/').pop() || file;
                    const newPath = `${this.cacheDir}/${fileName}`;
                    
                    const content = await this.vault.adapter.readBinary(file);
                    await this.vault.adapter.writeBinary(newPath, content);
                    
                    logger.debug('cache-migration', 'Migrated file', {
                        from: file,
                        to: newPath
                    });
                }

                // Copy subdirectories and their contents
                for (const folder of legacyContents.folders) {
                    const folderName = folder.split('/').pop() || folder;
                    const newFolderPath = `${this.cacheDir}/${folderName}`;
                    
                    await this.vault.adapter.mkdir(newFolderPath);
                    
                    // Copy folder contents recursively
                    await this.migrateFolderContents(folder, newFolderPath);
                }

                logger.info('cache-migration', 'Cache migration completed successfully', {
                    filesCount: legacyContents.files.length,
                    foldersCount: legacyContents.folders.length
                });
            }

            // Remove legacy cache directory
            await this.vault.adapter.rmdir(this.legacyCacheDir, true);
            
            logger.info('cache-migration', 'Legacy cache directory removed', {
                path: this.legacyCacheDir
            });

        } catch (error) {
            logger.error('cache-migration', 'Failed to migrate legacy cache', {
                error: error instanceof Error ? error.message : String(error),
                from: this.legacyCacheDir,
                to: this.cacheDir
            });
            // Don't throw - continue with normal initialization
        }
    }

    /**
     * Recursively migrate folder contents
     */
    private async migrateFolderContents(sourceFolder: string, targetFolder: string): Promise<void> {
        if (!this.vault) return;

        try {
            const contents = await this.vault.adapter.list(sourceFolder);
            
            // Copy files
            for (const file of contents.files) {
                const fileName = file.split('/').pop() || file;
                const newPath = `${targetFolder}/${fileName}`;
                
                const content = await this.vault.adapter.readBinary(file);
                await this.vault.adapter.writeBinary(newPath, content);
            }

            // Copy subdirectories recursively
            for (const folder of contents.folders) {
                const folderName = folder.split('/').pop() || folder;
                const newFolderPath = `${targetFolder}/${folderName}`;
                
                await this.vault.adapter.mkdir(newFolderPath);
                await this.migrateFolderContents(folder, newFolderPath);
            }
        } catch (error) {
            logger.error('cache-migration', 'Failed to migrate folder contents', {
                error: error instanceof Error ? error.message : String(error),
                sourceFolder,
                targetFolder
            });
        }
    }

    /**
     * Load cache index to map URLs to cached files
     */
    private async loadCacheIndex(): Promise<void> {
        if (!this.vault) return;

        const indexPath = `${this.cacheDir}/cache-index.json`;
        try {
            if (await this.vault.adapter.exists(indexPath)) {
                const indexContent = await this.vault.adapter.read(indexPath);
                const cacheIndex = JSON.parse(indexContent);
                
                // Rebuild file cache mapping
                this.fileCache.clear();
                Object.entries(cacheIndex.urlToFile || {}).forEach(([url, filePath]) => {
                    this.fileCache.set(url, filePath as string);
                });

                logger.info('cache-index', 'Loaded cache index', {
                    cachedFiles: this.fileCache.size,
                    indexPath
                });
            }
        } catch (error) {
            logger.warn('cache-index', 'Failed to load cache index, starting fresh', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Save cache index to persist URL-to-file mappings
     */
    private async saveCacheIndex(): Promise<void> {
        if (!this.vault) return;

        const indexPath = `${this.cacheDir}/cache-index.json`;
        try {
            const cacheIndex = {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                urlToFile: Object.fromEntries(this.fileCache.entries()),
                totalFiles: this.fileCache.size
            };

            await this.vault.adapter.write(indexPath, JSON.stringify(cacheIndex, null, 2));
            
            logger.debug('cache-index', 'Saved cache index', {
                totalFiles: this.fileCache.size,
                indexPath
            });
        } catch (error) {
            logger.error('cache-index', 'Failed to save cache index', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Check if a sample is already cached on disk
     */
    private async isSampleCached(url: string): Promise<boolean> {
        if (!this.vault || !this.fileCache.has(url)) return false;

        const filePath = this.fileCache.get(url);
        return await this.vault.adapter.exists(filePath);
    }

    /**
     * Load cached sample from disk
     */
    private async loadCachedSample(url: string): Promise<AudioBuffer | null> {
        if (!this.vault || !this.fileCache.has(url)) return null;

        const filePath = this.fileCache.get(url);
        try {
            if (await this.vault.adapter.exists(filePath)) {
                const arrayBuffer = await this.vault.adapter.readBinary(filePath);
                interface WindowWithWebkit extends Window {
                    webkitAudioContext?: typeof AudioContext;
                }
                const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
                if (!AudioContextClass) {
                    throw new Error('AudioContext not supported in this browser');
                }
                const audioContext = new AudioContextClass();
                return await audioContext.decodeAudioData(arrayBuffer);
            }
        } catch (error) {
            logger.warn('cache-load', 'Failed to load cached sample', {
                url: url.substring(0, 60) + '...',
                filePath,
                error: error instanceof Error ? error.message : String(error)
            });
        }

        return null;
    }

    /**
     * Save sample to disk cache
     */
    private async cacheSampleToDisk(url: string, arrayBuffer: ArrayBuffer, species: WhaleSpecies): Promise<void> {
        if (!this.vault) return;

        try {
            // Generate unique filename
            const urlHash = this.generateUrlHash(url);
            const extension = this.getFileExtension(url);
            const fileName = `${urlHash}${extension}`;
            const filePath = `${this.cacheDir}/${species}/${fileName}`;

            // Save file to disk
            await this.vault.adapter.writeBinary(filePath, arrayBuffer);

            // Update cache mapping
            this.fileCache.set(url, filePath);

            // Save updated index
            await this.saveCacheIndex();

            logger.info('cache-save', 'Sample cached to disk', {
                species,
                fileName,
                filePath,
                size: `${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`
            });
        } catch (error) {
            logger.error('cache-save', 'Failed to cache sample to disk', {
                url: url.substring(0, 60) + '...',
                species,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Generate a hash for URL to create unique filenames
     */
    private generateUrlHash(url: string): string {
        // Simple hash function for URL
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Extract file extension from URL
     */
    private getFileExtension(url: string): string {
        const match = url.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i);
        return match ? `.${match[1].toLowerCase()}` : '.audio';
    }

    /**
     * Clean up old cache files (LRU-style cleanup)
     */
    async cleanupCache(maxSizeGB: number = 2): Promise<void> {
        if (!this.vault) return;

        try {
            const cacheStats = this.getCacheStats();
            
            if (cacheStats.totalSizeGB > maxSizeGB) {
                logger.info('cache-cleanup', 'Starting cache cleanup', {
                    currentSize: `${cacheStats.totalSizeGB.toFixed(2)}GB`,
                    maxSize: `${maxSizeGB}GB`,
                    totalFiles: cacheStats.totalFiles
                });

                // Implementation would involve sorting files by access time
                // and removing oldest files until under the size limit
                // This is a placeholder for the full implementation
            }
        } catch (error) {
            logger.error('cache-cleanup', 'Failed to cleanup cache', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalFiles: number;
        totalSizeGB: number;
        filesBySpecies: Record<WhaleSpecies, number>;
    } {
        if (!this.vault) {
            return { totalFiles: 0, totalSizeGB: 0, filesBySpecies: {} as Record<WhaleSpecies, number> };
        }

        // Placeholder implementation - would calculate actual file sizes
        return {
            totalFiles: this.fileCache.size,
            totalSizeGB: 0, // Would calculate from actual file sizes
            filesBySpecies: {} as Record<WhaleSpecies, number>
        };
    }

    /**
     * Manually trigger whale sample downloads
     * This is now opt-in to avoid console errors on startup
     */
    async manuallyDownloadSamples(): Promise<void> {
        if (this.initializationPromise === null) {
            void logger.info('manual-download', 'Starting manual whale sample download');

            // Add timeout to prevent hanging
            const downloadPromise = this.downloadAndCacheSamples();
            const timeoutPromise = new Promise<void>((resolve) => {
                setTimeout(() => {
                    void logger.warn('manual-download', 'Download timeout after 60 seconds');
                    resolve();
                }, 60000); // 60 second timeout
            });

            this.initializationPromise = Promise.race([downloadPromise, timeoutPromise]);
        } else {
            void logger.info('manual-download', 'Download already in progress or completed');
        }
        return await this.initializationPromise;
    }

    /**
     * Get the count of cached samples
     */
    getCachedSampleCount(): { speciesCount: number; totalSamples: number } {
        const speciesCount = this.cachedSamples.size;
        const totalSamples = Array.from(this.cachedSamples.values())
            .reduce((sum, arr) => sum + arr.length, 0);
        return { speciesCount, totalSamples };
    }

    /**
     * Check if samples are available for playback
     */
    hasSamples(): boolean {
        return this.cachedSamples.size > 0;
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
            void downloadPromises.push(speciesPromise);
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
     * Download samples for a specific species with rate limiting and persistent caching
     */
    private async downloadSpeciesSamples(species: WhaleSpecies, urls: string[]): Promise<void> {
        const buffers: AudioBuffer[] = [];
        
        logger.debug('cache-download', 'Downloading samples for species', {
            species,
            urlCount: urls.length
        });

        // Process URLs sequentially with delays to avoid rate limiting
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                logger.debug('cache-download', 'Processing sample', {
                    species,
                    url: url.substring(0, 60) + '...',
                    progress: `${i + 1}/${urls.length}`
                });

                // Check if already cached on disk first
                if (await this.isSampleCached(url)) {
                    logger.debug('cache-download', 'Loading from disk cache', {
                        species,
                        url: url.substring(0, 60) + '...'
                    });
                    
                    const cachedBuffer = await this.loadCachedSample(url);
                    if (cachedBuffer) {
                        void buffers.push(cachedBuffer);
                        logger.debug('cache-download', 'Successfully loaded from disk cache', {
                            species,
                            bufferLength: cachedBuffer.length,
                            sampleRate: cachedBuffer.sampleRate
                        });
                        continue;
                    }
                }

                // Download if not cached
                const audioBuffer = await this.downloadAndDecodeAudio(url, species);
                if (audioBuffer) {
                    void buffers.push(audioBuffer);
                    
                    logger.debug('cache-download', 'Successfully downloaded and cached sample', {
                        species,
                        bufferLength: audioBuffer.length,
                        sampleRate: audioBuffer.sampleRate,
                        duration: audioBuffer.length / audioBuffer.sampleRate
                    });
                }

                // Add delay between downloads to avoid overwhelming proxy services
                // Conservative delays to prevent 429 errors
                if (i < urls.length - 1) { // Don't delay after the last URL
                    const delayMs = url.includes('archive.org') ? 3000 : 1500; // Increased delays
                    logger.debug('cache-download', 'Adding delay between downloads', {
                        delayMs,
                        remaining: urls.length - i - 1
                    });
                    await this.delay(delayMs);
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
     * Utility function to add delays between requests
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Download and decode audio from URL with proper error handling and CORS bypass
     */
    private async downloadAndDecodeAudio(url: string, species?: WhaleSpecies): Promise<AudioBuffer | null> {
        logger.debug('download', 'Starting download attempt', {
            url: url.substring(0, 60) + '...'
        });

        // For Archive.org URLs, use CORS proxy approach
        if (url.includes('web.archive.org') || url.includes('archive.org')) {
            return await this.downloadWithCorsProxy(url, species);
        }

        // For other URLs (like Freesound), try direct fetch first
        try {
            const response = await requestUrl({
                url: url,
                method: 'GET',
                headers: {
                    'Accept': 'audio/*'
                }
            });

            if (response.status >= 400) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await this.validateAndDecodeAudio(response.arrayBuffer, url);
            
        } catch (error) {
            logger.debug('download', 'Direct fetch failed, trying CORS proxy fallback', {
                url: url.substring(0, 60) + '...',
                error: error instanceof Error ? error.message : String(error)
            });
            
            // Fallback to CORS proxy for non-Archive.org URLs that also have CORS issues
            return await this.downloadWithCorsProxy(url, species);
        }
    }

    /**
     * Download URLs using CORS proxy services with retry logic
     */
    private async downloadWithCorsProxy(url: string, species?: WhaleSpecies): Promise<AudioBuffer | null> {
        logger.debug('download', 'Using CORS proxy approach', {
            url: url.substring(0, 60) + '...'
        });

        // Use single CORS proxy to reduce console errors
        // allorigins.win is generally most reliable for archive.org
        const corsProxies = [
            {
                name: 'api.allorigins.win',
                url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                headers: { 'Accept': 'audio/*' }
            }
        ];
        
        for (let i = 0; i < corsProxies.length; i++) {
            const proxy = corsProxies[i];
            
            logger.debug('download', `Trying CORS proxy ${i + 1}/${corsProxies.length}`, {
                originalUrl: url.substring(0, 60) + '...',
                proxyService: proxy.name,
                attempt: i + 1
            });
            
            // Try each proxy with retry logic for rate limiting
            const result = await this.fetchWithRetry(proxy.url, proxy.headers, url, i + 1, corsProxies.length, species);
            if (result) {
                return result;
            }
            
            // Add delay between different proxy services to be respectful
            if (i < corsProxies.length - 1) {
                await this.delay(2000); // 2 second delay between proxy services
            }
        }
        
        logger.debug('download', 'All CORS proxy attempts failed', {
            url: url.substring(0, 60) + '...',
            attemptedProxies: corsProxies.length
        });
        
        return null;
    }

    /**
     * Fetch with retry logic for handling rate limiting (429 errors)
     */
    private async fetchWithRetry(
        proxyUrl: string,
        headers: Record<string, string>,
        originalUrl: string, 
        proxyIndex: number, 
        totalProxies: number,
        species?: WhaleSpecies,
        maxRetries: number = 6
    ): Promise<AudioBuffer | null> {
        const proxyService = proxyUrl.split('?')[0];
        
        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                logger.debug('download', `Trying CORS proxy ${proxyIndex}/${totalProxies}`, {
                    originalUrl: originalUrl.substring(0, 60) + '...',
                    proxyService,
                    attempt: proxyIndex,
                    retry: retry + 1
                });

                const proxyResponse = await requestUrl({
                    url: proxyUrl,
                    method: 'GET',
                    headers: headers
                });

                if (proxyResponse.status < 400) {
                    const arrayBuffer = proxyResponse.arrayBuffer;
                    const arrayBufferSize = arrayBuffer.byteLength; // Store size before detachment

                    logger.debug('download', 'CORS proxy response received', {
                        proxy: proxyService,
                        size: arrayBufferSize,
                        status: proxyResponse.status
                    });

                    // Cache to disk BEFORE decoding (which detaches the ArrayBuffer)
                    if (species) {
                        await this.cacheSampleToDisk(originalUrl, arrayBuffer, species);
                    }

                    // Validate and decode the audio
                    const audioBuffer = await this.validateAndDecodeAudio(arrayBuffer, originalUrl);
                    if (audioBuffer) {

                        logger.info('download', 'CORS proxy successful', {
                            proxy: proxyService,
                            size: arrayBufferSize,
                            duration: audioBuffer.length / audioBuffer.sampleRate,
                            channels: audioBuffer.numberOfChannels,
                            retryCount: retry,
                            cached: !!species
                        });
                        return audioBuffer;
                    }
                } else if (proxyResponse.status === 429) {
                    // Rate limited - implement exponential backoff with jitter
                    // For 6 retries: 1s, 2s, 4s, 8s, 16s, 32s (with jitter)
                    const baseBackoff = Math.pow(2, retry) * 1000;
                    const jitter = Math.random() * 500; // Add 0-500ms random jitter
                    const backoffMs = Math.min(baseBackoff + jitter, 30000); // Cap at 30s

                    logger.warn('download', 'CORS proxy rate limited, retrying with backoff', {
                        proxy: proxyService,
                        status: proxyResponse.status,
                        retryAfter: `${Math.round(backoffMs)}ms`,
                        retry: retry + 1,
                        maxRetries,
                        baseBackoff,
                        jitter: Math.round(jitter)
                    });

                    if (retry < maxRetries - 1) {
                        await this.delay(backoffMs);
                        continue; // Retry this proxy
                    } else {
                        logger.warn('download', 'Max retries reached for rate limited proxy', {
                            proxy: proxyService,
                            maxRetries
                        });
                    }
                } else {
                    logger.debug('download', 'CORS proxy returned error status', {
                        proxy: proxyService,
                        status: proxyResponse.status
                    });
                    break; // Don't retry for other HTTP errors
                }
            } catch (proxyError) {
                logger.debug('download', 'CORS proxy failed with exception', {
                    proxy: proxyService,
                    error: proxyError instanceof Error ? proxyError.message : String(proxyError),
                    retry: retry + 1,
                    maxRetries
                });
                
                // Don't retry for network errors, move to next proxy
                break;
            }
        }
        
        logger.debug('download', 'CORS proxy exhausted all retries', {
            proxy: proxyService,
            maxRetries,
            remaining: totalProxies - proxyIndex
        });
        
        return null;
    }

    /**
     * Validate and decode audio buffer
     */
    private async validateAndDecodeAudio(arrayBuffer: ArrayBuffer, originalUrl: string): Promise<AudioBuffer | null> {
        try {
            // Validate that we got audio data, not HTML
            if (arrayBuffer.byteLength < 1000) {
                logger.debug('download', 'Response too small, likely not audio data', {
                    size: arrayBuffer.byteLength,
                    url: originalUrl.substring(0, 60) + '...'
                });
                return null;
            }
            
            // Check for HTML content (common when servers return error pages)
            const firstBytes = new Uint8Array(arrayBuffer.slice(0, 100));
            const textDecoder = new TextDecoder();
            const preview = textDecoder.decode(firstBytes).toLowerCase();
            
            if (preview.includes('<html') || preview.includes('<!doctype')) {
                logger.debug('download', 'Received HTML instead of audio data', {
                    preview: preview.substring(0, 50) + '...',
                    url: originalUrl.substring(0, 60) + '...'
                });
                return null;
            }
            
            // Use Web Audio API to decode
            interface WindowWithWebkit extends Window {
                webkitAudioContext?: typeof AudioContext;
            }
            const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('AudioContext not supported in this browser');
            }
            const audioContext = new AudioContextClass();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            logger.debug('download', 'Audio validation and decode successful', {
                url: originalUrl.substring(0, 60) + '...',
                size: arrayBuffer.byteLength,
                duration: audioBuffer.length / audioBuffer.sampleRate,
                channels: audioBuffer.numberOfChannels,
                sampleRate: audioBuffer.sampleRate
            });
            
            return audioBuffer;
            
        } catch (decodeError) {
            logger.debug('download', 'Audio decode failed', {
                url: originalUrl.substring(0, 60) + '...',
                error: decodeError instanceof Error ? decodeError.message : String(decodeError),
                size: arrayBuffer.byteLength
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
        if (this.initializationPromise !== null) {
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
        const response = await requestUrl({
            url: url,
            method: 'GET'
        });

        if (response.status >= 400) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const audioContext = new AudioContext();
        return await audioContext.decodeAudioData(response.arrayBuffer);
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
            void logger.info('discovery', 'Skipping discovery due to frequency limits');
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
    addApprovedSamples(species: WhaleSpecies, samples: FreesoundSample[]): void {
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
        const stats: Partial<Record<WhaleSpecies, number>> = {};

        Object.values(['humpback', 'blue', 'orca', 'gray', 'sperm', 'minke', 'fin', 'right', 'sei', 'pilot', 'mixed'] as WhaleSpecies[]).forEach(species => {
            stats[species] = this.cachedSamples.get(species)?.length || 0;
        });

        return stats as Record<WhaleSpecies, number>;
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
        void this.initializeSeedCollection();
        void logger.info('samples', 'Reset to seed collection');
    }

    /**
     * Export sample URLs for storage in plugin settings
     */
    exportSampleUrls(): Record<WhaleSpecies, string[]> {
        const exported: Partial<Record<WhaleSpecies, string[]>> = {};

        this.sampleUrls.forEach((urls, species) => {
            exported[species] = [...urls]; // Clone arrays
        });

        return exported as Record<WhaleSpecies, string[]>;
    }

    /**
     * Import sample URLs from plugin settings
     */
    importSampleUrls(data: Record<WhaleSpecies, string[]>): void {
        this.sampleUrls.clear();
        
        Object.entries(data).forEach(([species, urls]) => {
            this.sampleUrls.set(species as WhaleSpecies, urls);
        });
        
        void logger.info('settings', 'Imported sample URLs from settings');
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
        const attribution: Partial<Record<WhaleSpecies, string[]>> = {};

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

        return attribution as Record<WhaleSpecies, string[]>;
    }
}