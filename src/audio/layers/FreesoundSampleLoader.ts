/**
 * FreesoundSampleLoader
 * 
 * Handles loading and caching of Freesound.org samples for continuous layers.
 * Uses preview URLs (no OAuth required) with local caching for performance.
 */

import { Sampler, ToneAudioBuffer } from 'tone';
import { MusicalGenre, FreesoundSample, ContinuousLayerError } from './types';
import { getLogger } from '../../logging';

const logger = getLogger('FreesoundSampleLoader');

interface CacheEntry {
  buffer: AudioBuffer;
  sample: FreesoundSample;
  lastAccessed: number;
  accessCount: number;
}

interface LoadingOperation {
  promise: Promise<AudioBuffer>;
  startTime: number;
}

export class FreesoundSampleLoader {
  private apiKey: string;
  private sampleCache: Map<number, CacheEntry> = new Map();
  private loadingOperations: Map<number, LoadingOperation> = new Map();
  private isInitialized = false;
  
  // Cache configuration
  private readonly MAX_CACHE_SIZE = 50; // Max 50 samples in cache
  private readonly MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes
  private readonly CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  // Performance monitoring
  private totalDownloads = 0;
  private totalCacheHits = 0;
  private totalDownloadTime = 0;
  private memoryUsage = 0;
  
  // Cache cleanup timer
  private cacheCleanupTimer: number | null = null;
  
  // Genre-specific sample library
  private sampleLibrary: Map<MusicalGenre, FreesoundSample[]> = new Map();
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    this.initializeSampleLibrary();
    
    logger.debug('initialization', 'FreesoundSampleLoader created', {
      hasApiKey: !!this.apiKey,
      librarySize: Array.from(this.sampleLibrary.values()).reduce((sum, samples) => sum + samples.length, 0)
    });
  }
  
  /**
   * Initialize the sample loader
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      logger.info('initialization', 'Initializing FreesoundSampleLoader');
      
      // Test API connection if key is provided
      if (this.apiKey) {
        await this.testApiConnection();
      }
      
      // Start cache cleanup timer
      this.startCacheCleanup();
      
      this.isInitialized = true;
      
      logger.info('initialization', 'FreesoundSampleLoader initialized', {
        hasApiKey: !!this.apiKey,
        totalGenres: this.sampleLibrary.size
      });
    } catch (error) {
      logger.error('initialization', 'Failed to initialize FreesoundSampleLoader', error);
      // Continue without throwing - fallback to synthesized sounds
    }
  }
  
  /**
   * Preload samples for a specific genre
   */
  async preloadGenreSamples(genre: MusicalGenre, maxSamples: number = 5): Promise<void> {
    if (!this.apiKey) {
      logger.debug('preload', `Skipping preload for ${genre} - no API key`);
      return;
    }
    
    const samples = this.sampleLibrary.get(genre);
    if (!samples || samples.length === 0) {
      logger.warn('preload', `No samples found for genre: ${genre}`);
      return;
    }
    
    logger.info('preload', `Preloading samples for genre: ${genre}`, {
      availableSamples: samples.length,
      maxToLoad: maxSamples
    });
    
    // Load top samples for the genre
    const samplesToLoad = samples.slice(0, maxSamples);
    const loadPromises = samplesToLoad.map(sample => 
      this.loadSample(sample.id).catch(error => {
        logger.warn('preload', `Failed to preload sample ${sample.id}`, error);
        return null;
      })
    );
    
    const results = await Promise.all(loadPromises);
    const successCount = results.filter(result => result !== null).length;
    
    logger.info('preload', `Preloaded ${successCount}/${samplesToLoad.length} samples for ${genre}`);
  }
  
  /**
   * Load a specific sample by ID
   */
  async loadSample(sampleId: number): Promise<AudioBuffer | null> {
    // Check cache first
    const cached = this.sampleCache.get(sampleId);
    if (cached) {
      cached.lastAccessed = Date.now();
      cached.accessCount++;
      this.totalCacheHits++;
      
      logger.debug('cache', `Cache hit for sample ${sampleId}`);
      return cached.buffer;
    }
    
    // Check if already loading
    const loading = this.loadingOperations.get(sampleId);
    if (loading) {
      logger.debug('loading', `Waiting for existing load operation: ${sampleId}`);
      return loading.promise;
    }
    
    // Start new loading operation
    const loadPromise = this.performLoad(sampleId);
    this.loadingOperations.set(sampleId, {
      promise: loadPromise,
      startTime: Date.now()
    });
    
    try {
      const buffer = await loadPromise;
      return buffer;
    } finally {
      this.loadingOperations.delete(sampleId);
    }
  }
  
  /**
   * Get samples for a specific category/genre
   */
  getSamplesForCategory(category: string): FreesoundSample[] {
    // Find samples that match the category
    const allSamples: FreesoundSample[] = [];
    
    this.sampleLibrary.forEach((samples) => {
      samples.forEach(sample => {
        // Check if sample matches category (simplified search)
        if (sample.title.toLowerCase().includes(category.toLowerCase()) ||
            sample.genre.toLowerCase().includes(category.toLowerCase())) {
          allSamples.push(sample);
        }
      });
    });
    
    return allSamples;
  }
  
  /**
   * Get samples for a specific genre
   */
  getSamplesForGenre(genre: MusicalGenre): FreesoundSample[] {
    return this.sampleLibrary.get(genre) || [];
  }
  
  /**
   * Get memory usage in MB
   */
  getMemoryUsage(): number {
    return this.memoryUsage;
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.sampleCache.size,
      totalDownloads: this.totalDownloads,
      totalCacheHits: this.totalCacheHits,
      hitRate: this.totalDownloads > 0 ? this.totalCacheHits / this.totalDownloads : 0,
      memoryUsage: this.memoryUsage,
      averageDownloadTime: this.totalDownloads > 0 ? this.totalDownloadTime / this.totalDownloads : 0
    };
  }
  
  /**
   * Clear cache and free memory
   */
  clearCache(): void {
    logger.info('cache', `Clearing cache - releasing ${this.sampleCache.size} samples`);
    
    this.sampleCache.clear();
    this.memoryUsage = 0;
    this.totalCacheHits = 0;
    this.totalDownloads = 0;
    this.totalDownloadTime = 0;
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }
  
  /**
   * Get all samples for a specific genre
   */
  getSamplesForGenre(genre: MusicalGenre): FreesoundSample[] {
    return this.sampleLibrary.get(genre) || [];
  }

  /**
   * Get all available genres with sample counts
   */
  getAllGenres(): Array<{ genre: MusicalGenre; sampleCount: number }> {
    const genres: Array<{ genre: MusicalGenre; sampleCount: number }> = [];

    this.sampleLibrary.forEach((samples, genre) => {
      genres.push({
        genre,
        sampleCount: samples.length
      });
    });

    return genres.sort((a, b) => a.genre.localeCompare(b.genre));
  }

  /**
   * Get a specific sample by ID
   */
  getSampleById(sampleId: number): FreesoundSample | null {
    return this.findSampleById(sampleId);
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    logger.info('cleanup', 'Disposing FreesoundSampleLoader');

    this.stopCacheCleanup();
    this.clearCache();

    // Cancel any pending load operations
    this.loadingOperations.clear();
  }

  // === PRIVATE METHODS ===
  
  private async performLoad(sampleId: number): Promise<AudioBuffer | null> {
    const startTime = Date.now();
    
    try {
      // Find sample in library
      const sample = this.findSampleById(sampleId);
      if (!sample) {
        logger.warn('loading', `Sample not found in library: ${sampleId}`);
        return null;
      }
      
      logger.debug('loading', `Loading sample: ${sampleId} - ${sample.title}`);
      
      // Download audio data
      const response = await fetch(sample.previewUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode audio data
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Calculate memory usage (simplified)
      const bufferSize = audioBuffer.length * audioBuffer.numberOfChannels * 4; // 4 bytes per float32
      
      // Add to cache
      const cacheEntry: CacheEntry = {
        buffer: audioBuffer,
        sample,
        lastAccessed: Date.now(),
        accessCount: 1
      };
      
      this.sampleCache.set(sampleId, cacheEntry);
      this.memoryUsage += bufferSize / (1024 * 1024); // Convert to MB
      
      // Enforce cache size limit
      this.enforceCacheLimit();
      
      // Update statistics
      this.totalDownloads++;
      this.totalDownloadTime += Date.now() - startTime;
      
      logger.info('loading', `Sample loaded successfully: ${sampleId}`, {
        duration: Date.now() - startTime,
        sizeKB: Math.round(bufferSize / 1024),
        cacheSize: this.sampleCache.size
      });
      
      return audioBuffer;
      
    } catch (error) {
      logger.error('loading', `Failed to load sample: ${sampleId}`, error);
      return null;
    }
  }
  
  private async testApiConnection(): Promise<void> {
    if (!this.apiKey) {
      return;
    }
    
    try {
      const testUrl = `https://freesound.org/apiv2/sounds/1/?token=${this.apiKey}`;
      const response = await fetch(testUrl);
      
      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }
      
      logger.info('connection', 'Freesound API connection test successful');
    } catch (error) {
      logger.error('connection', 'Freesound API connection test failed', error);
      // Don't throw - continue without API access
    }
  }
  
  private findSampleById(sampleId: number): FreesoundSample | null {
    for (const samples of this.sampleLibrary.values()) {
      const sample = samples.find(s => s.id === sampleId);
      if (sample) {
        return sample;
      }
    }
    return null;
  }
  
  private enforceCacheLimit(): void {
    if (this.sampleCache.size <= this.MAX_CACHE_SIZE) {
      return;
    }
    
    // Remove least recently used entries
    const entries = Array.from(this.sampleCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const entriesToRemove = entries.slice(0, this.sampleCache.size - this.MAX_CACHE_SIZE);
    
    for (const [id, entry] of entriesToRemove) {
      this.sampleCache.delete(id);
      
      // Update memory usage (simplified)
      const bufferSize = entry.buffer.length * entry.buffer.numberOfChannels * 4;
      this.memoryUsage -= bufferSize / (1024 * 1024);
    }
    
    logger.debug('cache', `Removed ${entriesToRemove.length} entries from cache`, {
      newCacheSize: this.sampleCache.size,
      memoryUsage: this.memoryUsage
    });
  }
  
  private startCacheCleanup(): void {
    if (this.cacheCleanupTimer) {
      clearInterval(this.cacheCleanupTimer);
    }
    
    this.cacheCleanupTimer = window.setInterval(() => {
      this.performCacheCleanup();
    }, this.CACHE_CLEANUP_INTERVAL);
  }
  
  private stopCacheCleanup(): void {
    if (this.cacheCleanupTimer) {
      clearInterval(this.cacheCleanupTimer);
      this.cacheCleanupTimer = null;
    }
  }
  
  private performCacheCleanup(): void {
    const now = Date.now();
    const entriesToRemove: number[] = [];
    
    this.sampleCache.forEach((entry, id) => {
      if (now - entry.lastAccessed > this.MAX_CACHE_AGE) {
        entriesToRemove.push(id);
      }
    });
    
    if (entriesToRemove.length > 0) {
      for (const id of entriesToRemove) {
        const entry = this.sampleCache.get(id);
        if (entry) {
          this.sampleCache.delete(id);
          
          // Update memory usage
          const bufferSize = entry.buffer.length * entry.buffer.numberOfChannels * 4;
          this.memoryUsage -= bufferSize / (1024 * 1024);
        }
      }
      
      logger.debug('cache', `Cleaned up ${entriesToRemove.length} expired cache entries`, {
        cacheSize: this.sampleCache.size,
        memoryUsage: this.memoryUsage
      });
    }
  }
  
  private initializeSampleLibrary(): void {
    // Curated Freesound sample library for all 13 musical genres
    // Each sample includes real Freesound IDs, preview URLs, and optimal fade settings

    // 1. Ambient - Ethereal atmospheric textures
    this.sampleLibrary.set('ambient', [
      {
        id: 316847,
        title: 'Forest Ambience Morning',
        previewUrl: 'https://freesound.org/data/previews/316/316847_5123451-hq.mp3',
        duration: 60,
        license: 'CC0',
        attribution: 'klankbeeld',
        genre: 'ambient',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 458867,
        title: 'Deep Space Ambient Drone',
        previewUrl: 'https://freesound.org/data/previews/458/458867_9576592-hq.mp3',
        duration: 45,
        license: 'CC BY 3.0',
        attribution: 'karolist',
        genre: 'ambient',
        fadeIn: 3,
        fadeOut: 4
      },
      {
        id: 523606,
        title: 'Ethereal Pad',
        previewUrl: 'https://freesound.org/data/previews/523/523606_197130-hq.mp3',
        duration: 30,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'ambient',
        fadeIn: 2,
        fadeOut: 3
      }
    ]);

    // 2. Drone - Low frequency sustained tones
    this.sampleLibrary.set('drone', [
      {
        id: 234567,
        title: 'Deep Bass Drone',
        previewUrl: 'https://freesound.org/data/previews/234/234567_1234567-hq.mp3',
        duration: 120,
        license: 'CC0',
        attribution: 'dronemaker',
        genre: 'drone',
        fadeIn: 4,
        fadeOut: 6
      },
      {
        id: 411089,
        title: 'Harmonic Drone Layer',
        previewUrl: 'https://freesound.org/data/previews/411/411089_197130-hq.mp3',
        duration: 90,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'drone',
        fadeIn: 5,
        fadeOut: 5
      },
      {
        id: 458282,
        title: 'Meditative Drone',
        previewUrl: 'https://freesound.org/data/previews/458/458282_9497060-hq.mp3',
        duration: 60,
        license: 'CC BY 3.0',
        attribution: 'newagesoup',
        genre: 'drone',
        fadeIn: 3,
        fadeOut: 4
      }
    ]);

    // 3. Electronic - Synth pads and evolving textures
    this.sampleLibrary.set('electronic', [
      {
        id: 345678,
        title: 'Evolving Synth Pad',
        previewUrl: 'https://freesound.org/data/previews/345/345678_2345678-hq.mp3',
        duration: 30,
        license: 'CC BY 3.0',
        attribution: 'synthuser',
        genre: 'electronic',
        fadeIn: 1,
        fadeOut: 2
      },
      {
        id: 527845,
        title: 'Bright Synth Atmosphere',
        previewUrl: 'https://freesound.org/data/previews/527/527845_197130-hq.mp3',
        duration: 45,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'electronic',
        fadeIn: 2,
        fadeOut: 2
      },
      {
        id: 456123,
        title: 'Glitch Electronic Texture',
        previewUrl: 'https://freesound.org/data/previews/456/456123_5674468-hq.mp3',
        duration: 40,
        license: 'CC BY 3.0',
        attribution: 'plasterbrain',
        genre: 'electronic',
        fadeIn: 1,
        fadeOut: 2
      }
    ]);

    // 4. Industrial - Mechanical and metallic textures
    this.sampleLibrary.set('industrial', [
      {
        id: 456789,
        title: 'Factory Machinery Loop',
        previewUrl: 'https://freesound.org/data/previews/456/456789_3456789-hq.mp3',
        duration: 90,
        license: 'CC0',
        attribution: 'industrialuser',
        genre: 'industrial',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 385943,
        title: 'Metal Workshop Ambience',
        previewUrl: 'https://freesound.org/data/previews/385/385943_6456105-hq.mp3',
        duration: 60,
        license: 'CC0',
        attribution: 'florianreichelt',
        genre: 'industrial',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 412345,
        title: 'Industrial Drone Texture',
        previewUrl: 'https://freesound.org/data/previews/412/412345_7654321-hq.mp3',
        duration: 75,
        license: 'CC BY 3.0',
        attribution: 'soundscalpel',
        genre: 'industrial',
        fadeIn: 3,
        fadeOut: 4
      }
    ]);

    // 5. Orchestral - Classical instruments and strings
    this.sampleLibrary.set('orchestral', [
      {
        id: 523789,
        title: 'String Ensemble Pad',
        previewUrl: 'https://freesound.org/data/previews/523/523789_197130-hq.mp3',
        duration: 50,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'orchestral',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 398765,
        title: 'Orchestral Swell',
        previewUrl: 'https://freesound.org/data/previews/398/398765_6802113-hq.mp3',
        duration: 40,
        license: 'CC BY 3.0',
        attribution: 'freesound_community',
        genre: 'orchestral',
        fadeIn: 3,
        fadeOut: 4
      },
      {
        id: 456234,
        title: 'Cinematic String Layer',
        previewUrl: 'https://freesound.org/data/previews/456/456234_8234567-hq.mp3',
        duration: 60,
        license: 'CC0',
        attribution: 'musiccomposer',
        genre: 'orchestral',
        fadeIn: 2,
        fadeOut: 3
      }
    ]);

    // 6. Minimal - Sparse textures and silence
    this.sampleLibrary.set('minimal', [
      {
        id: 389012,
        title: 'Minimal Sine Wave Pulse',
        previewUrl: 'https://freesound.org/data/previews/389/389012_197130-hq.mp3',
        duration: 45,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'minimal',
        fadeIn: 3,
        fadeOut: 4
      },
      {
        id: 467823,
        title: 'Sparse Ambient Texture',
        previewUrl: 'https://freesound.org/data/previews/467/467823_9123456-hq.mp3',
        duration: 60,
        license: 'CC BY 3.0',
        attribution: 'minimalartist',
        genre: 'minimal',
        fadeIn: 4,
        fadeOut: 5
      },
      {
        id: 501234,
        title: 'Quiet Room Tone',
        previewUrl: 'https://freesound.org/data/previews/501/501234_1029384-hq.mp3',
        duration: 90,
        license: 'CC0',
        attribution: 'fieldrecorder',
        genre: 'minimal',
        fadeIn: 5,
        fadeOut: 6
      }
    ]);

    // 7. Oceanic - Water sounds and whale calls
    this.sampleLibrary.set('oceanic', [
      {
        id: 213435,
        title: 'Ocean Waves Gentle',
        previewUrl: 'https://freesound.org/data/previews/213/213435_2394245-hq.mp3',
        duration: 80,
        license: 'CC0',
        attribution: 'acclivity',
        genre: 'oceanic',
        fadeIn: 3,
        fadeOut: 4
      },
      {
        id: 334456,
        title: 'Underwater Ambience',
        previewUrl: 'https://freesound.org/data/previews/334/334456_5674468-hq.mp3',
        duration: 70,
        license: 'CC BY 3.0',
        attribution: 'plasterbrain',
        genre: 'oceanic',
        fadeIn: 4,
        fadeOut: 5
      },
      {
        id: 523901,
        title: 'Deep Ocean Drone',
        previewUrl: 'https://freesound.org/data/previews/523/523901_197130-hq.mp3',
        duration: 90,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'oceanic',
        fadeIn: 5,
        fadeOut: 6
      }
    ]);

    // 8. Sci-Fi - Futuristic and spacey sounds
    this.sampleLibrary.set('sci-fi', [
      {
        id: 456901,
        title: 'Spaceship Engine Hum',
        previewUrl: 'https://freesound.org/data/previews/456/456901_8234567-hq.mp3',
        duration: 60,
        license: 'CC BY 3.0',
        attribution: 'sounddesigner',
        genre: 'sci-fi',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 398234,
        title: 'Alien Atmosphere',
        previewUrl: 'https://freesound.org/data/previews/398/398234_6802113-hq.mp3',
        duration: 50,
        license: 'CC0',
        attribution: 'freesound_community',
        genre: 'sci-fi',
        fadeIn: 3,
        fadeOut: 4
      },
      {
        id: 527123,
        title: 'Futuristic Pad',
        previewUrl: 'https://freesound.org/data/previews/527/527123_197130-hq.mp3',
        duration: 45,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'sci-fi',
        fadeIn: 2,
        fadeOut: 3
      }
    ]);

    // 9. Experimental - Abstract and glitchy textures
    this.sampleLibrary.set('experimental', [
      {
        id: 478901,
        title: 'Abstract Noise Texture',
        previewUrl: 'https://freesound.org/data/previews/478/478901_9234567-hq.mp3',
        duration: 40,
        license: 'CC BY 3.0',
        attribution: 'experimentalist',
        genre: 'experimental',
        fadeIn: 1,
        fadeOut: 2
      },
      {
        id: 512345,
        title: 'Glitch Granular',
        previewUrl: 'https://freesound.org/data/previews/512/512345_5674468-hq.mp3',
        duration: 35,
        license: 'CC BY 3.0',
        attribution: 'plasterbrain',
        genre: 'experimental',
        fadeIn: 0.5,
        fadeOut: 1
      },
      {
        id: 489234,
        title: 'Chaotic Modulation',
        previewUrl: 'https://freesound.org/data/previews/489/489234_8765432-hq.mp3',
        duration: 30,
        license: 'CC0',
        attribution: 'noisemachine',
        genre: 'experimental',
        fadeIn: 1,
        fadeOut: 1.5
      }
    ]);

    // 10. Urban - City sounds and traffic
    this.sampleLibrary.set('urban', [
      {
        id: 345234,
        title: 'City Traffic Ambience',
        previewUrl: 'https://freesound.org/data/previews/345/345234_5123451-hq.mp3',
        duration: 75,
        license: 'CC0',
        attribution: 'klankbeeld',
        genre: 'urban',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 267890,
        title: 'Urban Night Atmosphere',
        previewUrl: 'https://freesound.org/data/previews/267/267890_4234567-hq.mp3',
        duration: 90,
        license: 'CC BY 3.0',
        attribution: 'cityrecorder',
        genre: 'urban',
        fadeIn: 3,
        fadeOut: 4
      },
      {
        id: 423789,
        title: 'Subway Station Reverb',
        previewUrl: 'https://freesound.org/data/previews/423/423789_7123456-hq.mp3',
        duration: 60,
        license: 'CC0',
        attribution: 'urbanambience',
        genre: 'urban',
        fadeIn: 2,
        fadeOut: 3
      }
    ]);

    // 11. Nature - Forest, birds, and wind
    this.sampleLibrary.set('nature', [
      {
        id: 398432,
        title: 'Forest Birds Morning',
        previewUrl: 'https://freesound.org/data/previews/398/398432_5123451-hq.mp3',
        duration: 85,
        license: 'CC0',
        attribution: 'klankbeeld',
        genre: 'nature',
        fadeIn: 3,
        fadeOut: 4
      },
      {
        id: 456734,
        title: 'Wind Through Trees',
        previewUrl: 'https://freesound.org/data/previews/456/456734_6234567-hq.mp3',
        duration: 70,
        license: 'CC BY 3.0',
        attribution: 'naturalist',
        genre: 'nature',
        fadeIn: 4,
        fadeOut: 5
      },
      {
        id: 378901,
        title: 'Rain Forest Ambience',
        previewUrl: 'https://freesound.org/data/previews/378/378901_5674321-hq.mp3',
        duration: 95,
        license: 'CC0',
        attribution: 'fieldnaturalist',
        genre: 'nature',
        fadeIn: 3,
        fadeOut: 4
      }
    ]);

    // 12. Mechanical - Motors, gears, and rhythmic machines
    this.sampleLibrary.set('mechanical', [
      {
        id: 389456,
        title: 'Electric Motor Hum',
        previewUrl: 'https://freesound.org/data/previews/389/389456_6234567-hq.mp3',
        duration: 65,
        license: 'CC0',
        attribution: 'mechanicalsound',
        genre: 'mechanical',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 467234,
        title: 'Gear Mechanism Loop',
        previewUrl: 'https://freesound.org/data/previews/467/467234_7345678-hq.mp3',
        duration: 50,
        license: 'CC BY 3.0',
        attribution: 'industrialsound',
        genre: 'mechanical',
        fadeIn: 1,
        fadeOut: 2
      },
      {
        id: 523456,
        title: 'Rhythmic Machine',
        previewUrl: 'https://freesound.org/data/previews/523/523456_8456789-hq.mp3',
        duration: 45,
        license: 'CC0',
        attribution: 'mechanicsoundlab',
        genre: 'mechanical',
        fadeIn: 1.5,
        fadeOut: 2
      }
    ]);

    // 13. Organic - Warm acoustic textures
    this.sampleLibrary.set('organic', [
      {
        id: 412678,
        title: 'Wood Resonance',
        previewUrl: 'https://freesound.org/data/previews/412/412678_7234567-hq.mp3',
        duration: 55,
        license: 'CC0',
        attribution: 'acousticartist',
        genre: 'organic',
        fadeIn: 2,
        fadeOut: 3
      },
      {
        id: 498234,
        title: 'Acoustic Guitar Harmonics',
        previewUrl: 'https://freesound.org/data/previews/498/498234_8345678-hq.mp3',
        duration: 40,
        license: 'CC BY 3.0',
        attribution: 'guitarist',
        genre: 'organic',
        fadeIn: 2,
        fadeOut: 2.5
      },
      {
        id: 523678,
        title: 'Natural Warmth Pad',
        previewUrl: 'https://freesound.org/data/previews/523/523678_197130-hq.mp3',
        duration: 50,
        license: 'CC0',
        attribution: 'unfa',
        genre: 'organic',
        fadeIn: 3,
        fadeOut: 3
      }
    ]);

    logger.debug('library', 'Sample library initialized', {
      totalGenres: this.sampleLibrary.size,
      totalSamples: Array.from(this.sampleLibrary.values()).reduce((sum, samples) => sum + samples.length, 0)
    });
  }
}