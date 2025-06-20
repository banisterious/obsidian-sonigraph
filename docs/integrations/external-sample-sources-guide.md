# External Sample Sources Integration Guide

**Status:** 📋 **PLANNING**  
**Priority:** Medium  
**Component:** Audio Engine / Sample Management  
**Last Updated:** 2025-06-19

---

## Table of Contents

- [Overview](#overview)
- [Sample Source Architecture](#sample-source-architecture)
  - [Priority System](#priority-system)
  - [Integration Framework](#integration-framework)
- [API-Enabled Sample Sources](#api-enabled-sample-sources)
  - [Freesound.org](#freesoundorg)
  - [Soundstripe](#soundstripe)
  - [Storyblocks](#storyblocks)
  - [ElevenLabs AI Generator](#elevenlabs-ai-generator)
- [Manual Integration Sources](#manual-integration-sources)
  - [BBC Sound Effects Archive](#bbc-sound-effects-archive)
  - [Archive.org Audio Collection](#archiveorg-audio-collection)
  - [Commercial Sample Libraries](#commercial-sample-libraries)
  - [Field Recording Communities](#field-recording-communities)
- [Technical Implementation](#technical-implementation)
  - [Unified Sample Manager](#unified-sample-manager)
  - [Source Adapter Pattern](#source-adapter-pattern)
  - [Caching & Storage Strategy](#caching--storage-strategy)
- [Legal & Licensing Framework](#legal--licensing-framework)
  - [License Classification](#license-classification)
  - [Attribution Management](#attribution-management)
  - [Commercial Compliance](#commercial-compliance)
- [Implementation Phases](#implementation-phases)
- [Performance Considerations](#performance-considerations)
- [Monitoring & Analytics](#monitoring--analytics)
- [Security Considerations](#security-considerations)

---

## Overview

This document outlines the comprehensive strategy for integrating external sample sources into Sonigraph's audio engine. By leveraging multiple sample libraries, APIs, and CDN services, my aim is to dramatically expand the plugin's audio palette while maintaining performance, legal compliance, and user experience standards.

**Integration Goals:**
- Expand sample diversity across all 34 instrument families
- Create redundant fallback systems for reliable sample delivery
- Enable dynamic sample discovery based on musical and graph context
- Maintain strict licensing compliance across all sources
- Provide seamless user experience regardless of sample origin

**Source Categories:**
1. **Primary CDN Sources:** Current nbrosowsky-tonejs-instruments GitHub CDN
2. **API-Enabled Sources:** Real-time programmatic access with search capabilities
3. **Manual Integration Sources:** High-quality curated collections requiring pre-processing
4. **AI-Generated Sources:** On-demand synthesis for unique sounds
5. **Community Sources:** User-contributed and field recording collections

### Current CDN Analysis (nbrosowsky-tonejs-instruments)

**Status:** Currently integrated as primary sample source  
**Format:** OGG Vorbis (899 files total)  
**Coverage:** 23 orchestral instruments with varying note coverage

**Available Instruments & Sample Counts:**
- **piano**: 86 samples (A1-G7, comprehensive coverage)
- **organ**: 20 samples (A1-Fs5, selective coverage)  
- **harp**: 20 samples (E1-G5, harp-specific note selection)
- **violin**: 15 samples (A3-G6, violin range)
- **cello**: 40 samples (C2-Gs4, comprehensive cello range)
- **guitar-acoustic**: 38 samples (D2-Gs4, guitar tuning)
- **guitar-electric**: 16 samples (A2-Fs5, electric-specific)
- **guitar-nylon**: 26 samples (B1-Gs5, classical guitar)
- **bass-electric**: 17 samples (As1-G4, bass range)
- **contrabass**: 13 samples (G1-Gs3, double bass)
- **harmonium**: 33 samples (A2-Gs4, harmonium range)
- **trumpet**: 11 samples (F3-C6, trumpet range)
- **trombone**: 17 samples (As1-Gs3, trombone range)
- **tuba**: 9 samples (F1-F3, tuba range)
- **french-horn**: 10 samples (A1-F5, horn range)
- **flute**: 10 samples (A4-E6, flute range)
- **clarinet**: 11 samples (As3-Fs6, clarinet range)
- **saxophone**: 33 samples (A4-Gs5, saxophone range)
- **bassoon**: 10 samples (A2-G4, bassoon range)
- **xylophone**: **8 samples only** (G4, C5-C8, G5-G7)

**Notable Gaps & Issues:**
- **Missing Percussion**: No timpani, vibraphone, or gongs directories
- **Missing Vocal**: No choir, soprano, alto, tenor, or bass samples
- **Missing Electronic**: No synthesizer or electronic instrument samples
- **Limited Xylophone**: Only 8 notes available (C and G notes)
- **Format Limitation**: Only OGG format available (no MP3 or WAV)

**Licensing:**
- **Source**: Creative Commons and MIT licensed samples
- **Attribution Required**: Full attribution metadata included
- **Commercial Use**: Permitted under license terms

---

## Sample Source Architecture

### Priority System

The sample loading system follows a cascading priority model for reliability and performance:

```typescript
interface SampleSourcePriority {
  primary: 'nbrosowsky-cdn';        // nbrosowsky-tonejs-instruments GitHub CDN  
  secondary: 'freesound-api';       // Real-time API access for missing instruments
  tertiary: 'cached-external';     // Pre-downloaded external samples (BBC, Archive.org)
  fallback: 'synthesis-engine';    // Built-in synthesis
}
```

### Integration Framework

**Unified Sample Manager:**
```typescript
interface ExternalSampleManager {
  sources: Map<string, SampleSourceAdapter>;
  loadSample(instrumentKey: InstrumentKey): Promise<AudioBuffer>;
  discoverSamples(criteria: SearchCriteria): Promise<SampleMetadata[]>;
  validateLicense(sample: SampleMetadata): Promise<boolean>;
}
```

---

## API-Enabled Sample Sources

### Freesound.org

**Overview:** Collaborative database with 500,000+ Creative Commons audio samples
**API Version:** v2
**Primary Use Cases:** Percussion, experimental sounds, vocal textures

**Authentication:**
```typescript
interface FreesoundConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  baseUrl: 'https://freesound.org/apiv2';
  rateLimitPerHour: 2000;
}
```

**Sample Discovery Strategy:**
```typescript
const instrumentQueries = {
  // Percussion Family
  timpani: 'tag:timpani OR tag:kettle-drum duration:[1.0 TO 5.0]',
  xylophone: 'tag:xylophone OR tag:marimba duration:[0.1 TO 3.0]',
  vibraphone: 'tag:vibraphone OR tag:vibes duration:[0.5 TO 4.0]',
  gongs: 'tag:gong OR tag:singing-bowl duration:[2.0 TO 10.0]',
  
  // Experimental/Environmental
  whaleHumpback: 'tag:whale OR tag:ocean OR tag:marine duration:[5.0 TO 30.0]',
  atmospheric: 'tag:ambient OR tag:soundscape duration:[10.0 TO 60.0]',
  
  // Vocal Families
  choir: 'tag:choir OR tag:chorus duration:[2.0 TO 15.0]',
  soprano: 'tag:soprano OR tag:female-voice duration:[1.0 TO 10.0]',
  alto: 'tag:alto OR tag:contralto duration:[1.0 TO 10.0]',
  tenor: 'tag:tenor OR tag:male-voice duration:[1.0 TO 10.0]',
  bass: 'tag:bass-voice OR tag:male-voice duration:[1.0 TO 10.0]'
};
```

**Quality Filters:**
- Minimum sample rate: 44.1kHz
- Minimum duration: 0.1 seconds for percussion, 1.0 seconds for sustained instruments
- License filter: `CC0 OR CC BY OR CC BY-SA` (avoid NC restrictions)
- File format preference: WAV > OGG > MP3

### Soundstripe

**Overview:** Professional royalty-free music and sound effects library
**API Access:** Commercial subscription required
**Primary Use Cases:** High-quality orchestral samples, professional SFX

**Integration Profile:**
```typescript
interface SoundstripeConfig {
  apiKey: string;
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
  baseUrl: 'https://api.soundstripe.com/v1';
  rateLimitPerMinute: 100;
}

interface SoundstripeSearch {
  categories: ['orchestral', 'ambient', 'percussion', 'vocal'];
  duration: { min: number; max: number };
  tempo: { min: number; max: number };
  mood: string[];
  instruments: string[];
}
```

**Advantages:**
- Professional quality and pre-cleared commercial licensing
- Consistent audio levels and mastering
- Rich metadata for intelligent matching
- CDN delivery infrastructure

**Considerations:**
- Subscription costs for API access
- More "produced" sounds vs. raw instrument samples
- Commercial licensing terms require review

### Storyblocks

**Overview:** Comprehensive stock media platform with extensive audio library
**API Access:** Subscription-based with unlimited downloads
**Primary Use Cases:** Diverse SFX, background textures, unusual instruments

**Integration Strategy:**
```typescript
interface StoryblocksConfig {
  apiKey: string;
  accountType: 'unlimited' | 'subscription';
  baseUrl: 'https://api.storyblocks.com/v1';
  downloadFormats: ['wav', 'mp3'];
}

class StoryblocksAdapter implements SampleSourceAdapter {
  async searchSamples(query: InstrumentSearchQuery): Promise<SampleMetadata[]> {
    const results = await this.api.search({
      query: query.keywords,
      category: this.mapInstrumentToCategory(query.instrument),
      duration_min: query.minDuration,
      duration_max: query.maxDuration,
      license: 'royalty_free'
    });
    
    return results.map(this.transformToSampleMetadata);
  }
}
```

### ElevenLabs AI Generator

**Overview:** AI-powered text-to-sound effect generator for unique audio creation
**API Access:** Credit-based usage model
**Primary Use Cases:** Experimental sounds, unique textures, custom sound design

**Implementation Approach:**
```typescript
interface ElevenLabsConfig {
  apiKey: string;
  model: 'sound-generation-v1';
  baseUrl: 'https://api.elevenlabs.io/v1';
  creditsPerGeneration: number;
}

class ElevenLabsGenerator implements SampleSourceAdapter {
  async generateSample(prompt: SoundPrompt): Promise<AudioBuffer> {
    const response = await this.api.generateSound({
      text: prompt.description,
      duration_seconds: prompt.duration,
      quality: 'high'
    });
    
    return await this.audioContext.decodeAudioData(response.audioData);
  }
  
  // Example prompts for Sonigraph instruments
  generateInstrumentSample(instrument: InstrumentKey): Promise<AudioBuffer> {
    const prompts = {
      whaleHumpback: 'Deep, haunting whale song with oceanic reverb, lasting 15 seconds',
      experimentalPad: 'Ethereal atmospheric pad with subtle movement and organic texture',
      percussiveGong: 'Large bronze gong strike with long metallic decay and shimmer'
    };
    
    return this.generateSample({
      description: prompts[instrument] || `Sound of ${instrument}`,
      duration: this.getOptimalDuration(instrument)
    });
  }
}
```

**Usage Considerations:**
- Generation costs per sample (monitor usage)
- Variable quality and controllability
- Best for experimental/ambient sounds rather than realistic instruments
- Cache generated samples to avoid regeneration costs

---

## Manual Integration Sources

### nbrosowsky-tonejs-instruments (Primary CDN)

**Overview:** Open-source Tone.js instrument sample library serving as Sonigraph's primary sample CDN
**Repository:** https://github.com/nbrosowsky/tonejs-instruments  
**Access Method:** Direct HTTPS CDN access to GitHub Pages  
**Primary Use Cases:** Core instrumental samples across all orchestral families

**Current Integration Status:**
```typescript
interface NbrosowskyConfig {
  baseUrl: 'https://nbrosowsky.github.io/tonejs-instruments/samples/';
  primaryFormat: 'ogg';        // 899 OGG files available
  fallbackFormat: 'wav';       // Not available (documentation discrepancy)
  unsupportedFormat: 'mp3';    // Only 16 MP3 references (mostly documentation)
  totalInstruments: 23;        // Piano, strings, brass, woodwinds, etc.
  licenseType: 'MIT/CC-by-3.0'; // Code: MIT, Samples: CC-by-3.0
}
```

**Complete Sample Repository Structure (899 OGG files):**
```
samples/
├── bass-electric/     # 17 OGG samples (As1-G4)
├── bassoon/          # 10 OGG samples (A2-G4)  
├── cello/            # 40 OGG samples (A2-Gs4)
├── clarinet/         # 11 OGG samples (As3-Fs6)
├── contrabass/       # 13 OGG samples (As1-Gs3)
├── flute/            # 10 OGG samples (A4-E6)
├── french-horn/      # 10 OGG samples (A1-F5)
├── guitar-acoustic/  # 38 OGG samples (D2-Gs4)
├── guitar-electric/  # 16 OGG samples (A2-Fs5)
├── guitar-nylon/     # 26 OGG samples (B1-Gs5)
├── harmonium/        # 33 OGG samples (A2-Gs4)
├── harp/             # 20 OGG samples (E1-G5)
├── organ/            # 20 OGG samples (A1-Fs5)
├── piano/            # 86 OGG samples (A1-Gs7)
├── saxophone/        # 33 OGG samples (A4-Gs5)
├── trombone/         # 17 OGG samples (As1-Gs3)
├── trumpet/          # 11 OGG samples (F3-C6)
├── tuba/             # 9 OGG samples (F1-F3)
├── violin/           # 15 OGG samples (A3-G6)
└── xylophone/        # 8 OGG samples (G4, C5-C8, G5-G7)
```

**Detailed File Inventory by Instrument:**

**Strings Family:**
- **violin/**: 15 samples (A3.ogg, A4.ogg, A5.ogg, A6.ogg, C4.ogg, C5.ogg, C6.ogg, C7.ogg, E4.ogg, E5.ogg, E6.ogg, G3.ogg, G4.ogg, G5.ogg, G6.ogg)
- **cello/**: 40 samples (A2.ogg-Gs4.ogg range with comprehensive chromatic coverage plus variants)
- **contrabass/**: 13 samples (As1.ogg, A2.ogg, B3.ogg, C2.ogg, Cs3.ogg, D2.ogg, E2.ogg, E3.ogg, Fs1.ogg, Fs2.ogg, G1.ogg, Gs2.ogg, Gs3.ogg)
- **harp/**: 20 samples (A2.ogg, A4.ogg, A6.ogg, B1.ogg, B3.ogg, B5.ogg, B6.ogg, C3.ogg, C5.ogg, D2.ogg, D4.ogg, D6.ogg, D7.ogg, E1.ogg, E3.ogg, E5.ogg, F2.ogg, F4.ogg, F6.ogg, F7.ogg, G1.ogg, G3.ogg, G5.ogg)

**Guitar Family:**
- **guitar-acoustic/**: 38 samples (A2.ogg-Gs4.ogg comprehensive coverage)
- **guitar-electric/**: 16 samples (A2.ogg-Fs5.ogg selective coverage)  
- **guitar-nylon/**: 26 samples (B1.ogg-Gs5.ogg classical guitar range)
- **bass-electric/**: 17 samples (As1.ogg-G4.ogg electric bass range)

**Keyboard Family:**
- **piano/**: 86 samples (A1.ogg-Gs7.ogg near-complete piano range)
- **organ/**: 20 samples (A1.ogg-Fs5.ogg church organ range)
- **harmonium/**: 33 samples (A2.ogg-Gs4.ogg complete harmonium range)

**Brass Family:**
- **trumpet/**: 11 samples (A3.ogg, A5.ogg, As4.ogg, C4.ogg, C6.ogg, D5.ogg, Ds4.ogg, F3.ogg, F4.ogg, F5.ogg, G4.ogg)
- **french-horn/**: 10 samples (A1.ogg, A3.ogg, C2.ogg, C4.ogg, D3.ogg, D5.ogg, Ds2.ogg, F3.ogg, F5.ogg, G2.ogg)
- **trombone/**: 17 samples (As1.ogg-Gs3.ogg comprehensive trombone range)
- **tuba/**: 9 samples (As1.ogg, As2.ogg, As3.ogg, D3.ogg, D4.ogg, Ds2.ogg, F1.ogg, F2.ogg, F3.ogg)

**Woodwind Family:**
- **flute/**: 10 samples (A4.ogg-E6.ogg flute range)
- **clarinet/**: 11 samples (As3.ogg-Fs6.ogg clarinet range)
- **saxophone/**: 33 samples (A4.ogg-Gs5.ogg complete saxophone range)
- **bassoon/**: 10 samples (A2.ogg-G4.ogg bassoon range)

**Percussion Family:**
- **xylophone/**: 8 samples only (C5.ogg, C6.ogg, C7.ogg, C8.ogg, G4.ogg, G5.ogg, G6.ogg, G7.ogg)

**Missing Instruments (Gap Analysis):**
- **Timpani**: No directory exists (requires synthesis fallback)
- **Vibraphone**: No directory exists (requires synthesis fallback)  
- **Gongs**: No directory exists (requires synthesis fallback)
- **Choir/Vocals**: No vocal samples available
- **Electronic Synths**: No electronic/synthesizer samples

**Format Reality vs. Documentation:**
- **Library Claims:** Supports `.[mp3|ogg]` with MP3 as primary, OGG as fallback
- **Actual Repository:** 899 OGG files, 44 WAV files, only 16 MP3 references
- **Sonigraph Usage:** Currently requests MP3 files that don't exist, causing 404 errors
- **Recommended Format:** OGG (primary) with WAV fallback for maximum compatibility

**Integration Patterns:**
```typescript
class NbrosowskyAdapter implements SampleSourceAdapter {
  sourceId = 'nbrosowsky-cdn';
  priority = 1; // Primary source
  
  private readonly BASE_URL = 'https://nbrosowsky.github.io/tonejs-instruments/samples/';
  private readonly FORMAT_PREFERENCE = ['ogg', 'wav']; // Avoid MP3
  
  async loadSample(instrumentKey: string, note: string): Promise<AudioBuffer> {
    // Use actual available formats instead of documented ones
    for (const format of this.FORMAT_PREFERENCE) {
      try {
        const url = `${this.BASE_URL}${instrumentKey}/${note}.${format}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return await this.audioContext.decodeAudioData(arrayBuffer);
        }
      } catch (error) {
        console.warn(`Failed to load ${instrumentKey}/${note}.${format}:`, error);
        continue; // Try next format
      }
    }
    
    throw new Error(`No available format found for ${instrumentKey}/${note}`);
  }
  
  // Map Sonigraph instruments to nbrosowsky repository structure
  private mapSonigraphToNbrosowsky(sonigraphInstrument: string): string {
    const mapping = {
      'piano': 'piano',
      'organ': 'organ', 
      'strings': 'violin',     // Default string sound
      'violin': 'violin',
      'cello': 'cello',
      'guitar': 'guitar-acoustic',
      'harp': 'harp',
      'trumpet': 'trumpet',
      'frenchHorn': 'french-horn',
      'trombone': 'trombone',
      'tuba': 'tuba',
      'flute': 'flute',
      'clarinet': 'clarinet',
      'saxophone': 'saxophone',
      'bassoon': 'bassoon',
      'electricGuitar': 'guitar-electric',
      'electricBass': 'bass-electric',
      'contrabass': 'contrabass',
      'harmonium': 'harmonium',
      'nylonGuitar': 'guitar-nylon'
    };
    
    return mapping[sonigraphInstrument] || sonigraphInstrument;
  }
}
```

**Current Issues (Issue #005):**
- **Configuration Sync Bug:** AudioEngine.updateSettings() doesn't update InstrumentConfigLoader format
- **Hard-coded MP3:** PercussionEngine uses hard-coded `.mp3` extensions
- **404 Errors:** Requesting MP3 files that don't exist (e.g., `timpani/Bb2.mp3`)
- **Format Mismatch:** Library expects MP3 but repository contains OGG

**Resolution Strategy:**
```typescript
// Fix 1: Proper format synchronization in AudioEngine.updateSettings()
if (settings.audioFormat !== this.settings.audioFormat) {
    this.instrumentConfigLoader.updateAudioFormat(settings.audioFormat);
    await this.reinitializeSampleBasedInstruments();
}

// Fix 2: Use OGG as default format instead of MP3
const DEFAULT_AUDIO_FORMAT = 'ogg'; // Change from 'mp3'

// Fix 3: Remove hard-coded MP3 extensions in PercussionEngine
// Use InstrumentConfigLoader for all sample URL generation
```

**Advantages:**
- ✅ **Currently Integrated:** Already serving as primary sample source
- ✅ **Comprehensive Coverage:** 19 instruments across orchestral families  
- ✅ **High Quality:** Professional samples with consistent levels
- ✅ **Open License:** MIT code license, CC-by-3.0 sample license
- ✅ **CDN Performance:** GitHub Pages provides reliable global CDN
- ✅ **No API Limits:** Direct file access without rate limiting

**Limitations:**
- ❌ **Limited Percussion:** Missing timpani, xylophone, vibraphone, gongs
- ❌ **No Experimental Sounds:** No whale song, atmospheric, or electronic synthesis
- ❌ **Format Documentation Gap:** Claims MP3 support but provides OGG
- ❌ **Static Library:** No dynamic sample discovery or search capabilities
- ❌ **Coverage Gaps:** Missing some Sonigraph instrument categories

**Performance Optimization Features:**
```typescript
// Intelligent Sample Minification Algorithm (from nbrosowsky library)
interface MinificationStrategy {
  samples_17_32: 'load_every_2nd';    // 50% reduction
  samples_33_48: 'load_every_4th';    // 75% reduction  
  samples_49_plus: 'load_every_6th';  // ~83% reduction
}

// Implementation for Sonigraph adaptation
class PerformanceOptimizer {
  minifySampleSet(sampleUrls: string[], enable: boolean = false): string[] {
    if (!enable) return sampleUrls;
    
    const sampleCount = sampleUrls.length;
    let reductionFactor = 1;
    
    if (sampleCount >= 17) reductionFactor = 2;
    if (sampleCount >= 33) reductionFactor = 4;
    if (sampleCount >= 49) reductionFactor = 6;
    
    return sampleUrls.filter((_, index) => index % reductionFactor === 0);
  }
}
```

**Legal Compliance Requirements:**
```typescript
interface LicenseCompliance {
  code: {
    license: 'MIT';
    copyright: '2018 Nicholaus P. Brosowsky';
    allowsCommercialUse: true;
    requiresAttribution: false;
  };
  samples: {
    license: 'CC-BY-3.0';
    requiresAttribution: true;
    allowsCommercialUse: true;
    allowsDerivativeWorks: true;
    attribution: {
      VSO2: 'Versilian Studios Community Orchestra - bassoon, contrabass, flute, french horn, harp, organ, piano, trombone, trumpet, tuba, violin, xylophone';
      Karoryfer: 'Karoryfer.com - bass-electric, guitar-electric, saxophone';
      Freesound: 'Freesound.org - cello (12408), guitar-nylon (11573), harmonium (330410)';
      Iowa: 'University of Iowa - guitar-acoustic samples';
    };
  };
}
```

**Sample Processing Standards:**
- **Professional Editing:** All samples trimmed, volume-matched, normalized, noise-removed, pitch-corrected
- **Consistent Quality:** Uniform levels and characteristics across all instruments
- **Format Optimization:** OGG compression for web delivery with quality preservation

**Advanced Configuration Options:**
```typescript
interface NbrosowskyAdvancedConfig {
  // Global minification for performance
  enableMinification: boolean;
  
  // Custom extension management  
  formatPreference: string[]; // ['ogg', 'wav', 'mp3']
  
  // Dynamic base URL switching
  cdnEndpoints: {
    primary: 'https://nbrosowsky.github.io/tonejs-instruments/samples/';
    fallback: 'https://alternative-cdn.com/samples/';
  };
  
  // Selective instrument loading
  instrumentSubset: string[]; // Load only specified instruments
  
  // Callback-based loading
  onLoadComplete: (instrument: string, sampler: Tone.Sampler) => void;
  onLoadError: (instrument: string, error: Error) => void;
}
```

**Recommended Enhancements:**
1. **Format Alignment:** Update Sonigraph to use OGG as primary format
2. **Performance Integration:** Implement nbrosowsky's minification algorithm for optimization
3. **Attribution System:** Add automatic CC-BY-3.0 compliance with proper source attribution
4. **Percussion Supplementation:** Add Freesound.org integration for missing percussion
5. **Experimental Expansion:** Integrate ElevenLabs for whale song and atmospheric sounds
6. **Fallback Strategy:** Implement proper synthesis fallback for missing instruments

### BBC Sound Effects Archive

**Overview:** 33,000+ professional sound effects under RemArc license
**Access Method:** Manual download from BBC website
**Primary Use Cases:** Historical recordings, unique environmental sounds, professional SFX

**Integration Strategy:**
```typescript
interface BBCArchiveMetadata {
  soundId: string;
  title: string;
  description: string;
  duration: number;
  recordingDate: Date;
  location?: string;
  recordingContext: string;
  license: 'RemArc';
  attribution: string;
}

class BBCArchiveManager {
  private preSelectedSamples: BBCArchiveMetadata[] = [
    // Curated list of samples relevant to Sonigraph instruments
    {
      soundId: 'BBC-07032023',
      title: 'Church Organ - Cathedral Ambience',
      description: 'Large cathedral organ with natural reverb',
      duration: 12.5,
      license: 'RemArc',
      attribution: 'BBC Sound Effects Library'
    }
    // ... additional curated samples
  ];
}
```

**Implementation Phases:**
1. **Curation Phase:** Manually review and select relevant samples
2. **Download Phase:** Batch download selected samples
3. **Processing Phase:** Normalize, catalog, and integrate into sample cache
4. **Attribution Phase:** Implement proper BBC license attribution

### Archive.org Audio Collection

**Overview:** Millions of public domain and Creative Commons audio recordings
**Access Method:** Internet Archive API with manual curation
**Primary Use Cases:** Historical recordings, unusual instruments, cultural music

**Search Strategy:**
```typescript
interface ArchiveOrgSearch {
  collection: 'opensource_audio' | 'audio_music' | 'audio_tech';
  format: 'wav' | 'mp3' | 'flac';
  licenseurl: string[]; // Filter for permissive licenses
  subject: string[];   // Instrument-related keywords
}

const archiveSearchQueries = {
  historicalInstruments: {
    collection: 'opensource_audio',
    subject: ['medieval music', 'baroque instruments', 'historical recording'],
    licenseurl: ['http://creativecommons.org/licenses/by/4.0/']
  },
  
  experimentalSounds: {
    collection: 'audio_tech',
    subject: ['electronic music', 'sound art', 'experimental'],
    format: 'wav'
  }
};
```

### Commercial Sample Libraries

**Overview:** Specialized high-quality sample packs from commercial producers
**Access Method:** Direct purchase and manual integration
**Primary Use Cases:** Professional instrument recordings, extended techniques, genre-specific sounds

**Recommended Sources:**
- **Spitfire Audio:** Orchestral libraries with extended techniques
- **Native Instruments:** Diverse instrument collections
- **Splice:** Collaborative sample library with API access
- **Loopmasters:** Electronic and experimental sound libraries

**Integration Framework:**
```typescript
interface CommercialLibrarySpec {
  vendor: string;
  libraryName: string;
  instrumentCoverage: InstrumentKey[];
  licenseType: 'royalty_free' | 'sync_license' | 'commercial_license';
  sampleCount: number;
  fileFormat: AudioFormat[];
  integrationPriority: number;
}

const prioritizedLibraries: CommercialLibrarySpec[] = [
  {
    vendor: 'Spitfire Audio',
    libraryName: 'BBC Symphony Orchestra',
    instrumentCoverage: ['strings', 'brass', 'woodwinds', 'percussion'],
    licenseType: 'commercial_license',
    sampleCount: 2500,
    fileFormat: ['wav', '48khz', '24bit'],
    integrationPriority: 1
  }
  // ... additional libraries
];
```

### Field Recording Communities

**Overview:** Authentic environmental and location-specific recordings from recordist communities
**Primary Sources:** FreeSound contributors, Reddit communities, specialized forums
**Primary Use Cases:** Authentic environmental sounds, unique textures, location-specific audio

**Community Integration Strategy:**
```typescript
interface FieldRecordingSource {
  community: string;
  contactMethod: 'freesound_message' | 'email' | 'forum_post';
  specialization: string[];
  licenseFlexibility: 'strict_cc' | 'negotiable' | 'public_domain';
  qualityLevel: 'amateur' | 'semi_professional' | 'professional';
}

const targetCommunities = [
  {
    community: 'Cities and Memory (sound map project)',
    specialization: ['urban environments', 'cultural sounds', 'location audio'],
    qualityLevel: 'professional',
    licenseFlexibility: 'strict_cc'
  },
  {
    community: 'Quiet American (nature recording)',
    specialization: ['nature sounds', 'wildlife', 'environmental'],
    qualityLevel: 'professional',
    licenseFlexibility: 'negotiable'
  }
];
```

---

## Technical Implementation

### Unified Sample Manager

**Core Architecture:**
```typescript
interface SampleSourceAdapter {
  sourceId: string;
  priority: number;
  isAvailable(): Promise<boolean>;
  searchSamples(criteria: SearchCriteria): Promise<SampleMetadata[]>;
  loadSample(sampleId: string): Promise<AudioBuffer>;
  validateLicense(sampleId: string): Promise<LicenseValidation>;
}

class UnifiedSampleManager {
  private sources: Map<string, SampleSourceAdapter> = new Map();
  private cache: SampleCache;
  private licenseManager: LicenseManager;
  
  async loadSample(instrumentKey: InstrumentKey): Promise<AudioBuffer> {
    // 1. Check local cache
    const cached = await this.cache.get(instrumentKey);
    if (cached) return cached;
    
    // 2. Try sources in priority order
    const sortedSources = Array.from(this.sources.values())
      .sort((a, b) => a.priority - b.priority);
    
    for (const source of sortedSources) {
      try {
        if (await source.isAvailable()) {
          const sample = await this.loadFromSource(source, instrumentKey);
          if (sample) {
            await this.cache.store(instrumentKey, sample);
            return sample;
          }
        }
      } catch (error) {
        console.warn(`Source ${source.sourceId} failed:`, error);
        continue; // Try next source
      }
    }
    
    // 3. Fallback to synthesis
    return await this.synthesisEngine.generateFallback(instrumentKey);
  }
  
  private async loadFromSource(
    source: SampleSourceAdapter, 
    instrumentKey: InstrumentKey
  ): Promise<AudioBuffer | null> {
    const criteria = this.buildSearchCriteria(instrumentKey);
    const candidates = await source.searchSamples(criteria);
    
    if (candidates.length === 0) return null;
    
    // Select best candidate based on quality metrics
    const selectedSample = this.selectBestCandidate(candidates, criteria);
    
    // Validate license before loading
    const licenseValid = await source.validateLicense(selectedSample.id);
    if (!licenseValid.isValid) {
      console.warn(`License validation failed for ${selectedSample.id}`);
      return null;
    }
    
    // Load and return the sample
    return await source.loadSample(selectedSample.id);
  }
}
```

### Source Adapter Pattern

**Freesound Adapter Implementation:**
```typescript
class FreesoundAdapter implements SampleSourceAdapter {
  sourceId = 'freesound';
  priority = 2; // Secondary after CDN
  
  private api: FreesoundAPI;
  private rateLimiter: RateLimiter;
  
  async isAvailable(): Promise<boolean> {
    try {
      await this.api.ping();
      return !this.rateLimiter.isLimited();
    } catch {
      return false;
    }
  }
  
  async searchSamples(criteria: SearchCriteria): Promise<SampleMetadata[]> {
    const query = this.buildFreesoundQuery(criteria);
    const response = await this.rateLimiter.execute(() => 
      this.api.search(query)
    );
    
    return response.results.map(this.transformToMetadata);
  }
  
  async loadSample(sampleId: string): Promise<AudioBuffer> {
    const downloadUrl = await this.api.getDownloadUrl(sampleId);
    const audioBlob = await fetch(downloadUrl).then(r => r.blob());
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }
  
  private buildFreesoundQuery(criteria: SearchCriteria): FreesoundQuery {
    return {
      query: criteria.keywords.join(' OR '),
      filter: `duration:[${criteria.minDuration} TO ${criteria.maxDuration}]`,
      sort: 'rating_desc',
      fields: 'id,name,description,duration,license,download',
      page_size: 50
    };
  }
}
```

### Caching & Storage Strategy

**Multi-Level Caching System:**
```typescript
interface CacheLevel {
  memory: LRUCache<string, AudioBuffer>;     // Hot samples
  indexedDB: IDBObjectStore;                 // Browser persistence
  fileSystem: FileSystemAccess;              // Local downloads
}

class SampleCache {
  private levels: CacheLevel;
  private metadata: Map<string, CacheMetadata>;
  
  async store(key: string, sample: AudioBuffer, source: string): Promise<void> {
    const metadata: CacheMetadata = {
      key,
      source,
      size: sample.length * sample.numberOfChannels * 4, // bytes
      lastAccessed: Date.now(),
      accessCount: 0,
      license: await this.licenseManager.getLicense(key)
    };
    
    // Store in memory for immediate access
    this.levels.memory.set(key, sample);
    
    // Persist to IndexedDB for browser sessions
    await this.storeInIndexedDB(key, sample, metadata);
    
    // Optionally download for offline access
    if (this.shouldCacheLocally(metadata)) {
      await this.downloadLocally(key, sample, metadata);
    }
  }
  
  async get(key: string): Promise<AudioBuffer | null> {
    // Try memory first
    let sample = this.levels.memory.get(key);
    if (sample) {
      this.updateAccessMetrics(key);
      return sample;
    }
    
    // Try IndexedDB
    sample = await this.getFromIndexedDB(key);
    if (sample) {
      this.levels.memory.set(key, sample); // Promote to memory
      this.updateAccessMetrics(key);
      return sample;
    }
    
    // Try local file system
    sample = await this.getFromFileSystem(key);
    if (sample) {
      this.levels.memory.set(key, sample);
      this.updateAccessMetrics(key);
      return sample;
    }
    
    return null;
  }
  
  private shouldCacheLocally(metadata: CacheMetadata): boolean {
    // Cache locally if:
    // - High access frequency
    // - Large file that's expensive to re-download
    // - User has opted for offline capability
    return metadata.accessCount > 5 || 
           metadata.size > 1024 * 1024 || // > 1MB
           this.userPreferences.enableOfflineCache;
  }
}
```

---

## Legal & Licensing Framework

### License Classification

**License Categories:**
```typescript
enum LicenseType {
  PUBLIC_DOMAIN = 'public_domain',
  CC0 = 'cc0',
  CC_BY = 'cc_by',
  CC_BY_SA = 'cc_by_sa',
  ROYALTY_FREE = 'royalty_free',
  COMMERCIAL = 'commercial',
  RESTRICTED = 'restricted'
}

interface LicenseMetadata {
  type: LicenseType;
  attributionRequired: boolean;
  commercialUse: boolean;
  derivativeWorks: boolean;
  shareAlike: boolean;
  attribution: string;
  sourceUrl: string;
  expirationDate?: Date;
}

class LicenseClassifier {
  classify(licenseText: string, source: string): LicenseMetadata {
    // Analyze license text and determine classification
    if (licenseText.includes('CC0')) {
      return {
        type: LicenseType.CC0,
        attributionRequired: false,
        commercialUse: true,
        derivativeWorks: true,
        shareAlike: false,
        attribution: '',
        sourceUrl: source
      };
    }
    
    // ... additional classification logic
  }
}
```

### Attribution Management

**Automated Attribution System:**
```typescript
class AttributionManager {
  private attributions: Map<string, AttributionData> = new Map();
  
  async addAttribution(sampleId: string, metadata: LicenseMetadata): Promise<void> {
    if (metadata.attributionRequired) {
      this.attributions.set(sampleId, {
        sampleId,
        text: metadata.attribution,
        sourceUrl: metadata.sourceUrl,
        licenseType: metadata.type,
        dateAdded: new Date()
      });
    }
  }
  
  generateCreditsDocument(): string {
    const credits = Array.from(this.attributions.values())
      .sort((a, b) => a.text.localeCompare(b.text));
    
    let document = '# Sonigraph Plugin - Audio Sample Credits\n\n';
    document += 'This plugin uses audio samples from the following sources:\n\n';
    
    for (const credit of credits) {
      document += `## ${credit.text}\n`;
      document += `- License: ${credit.licenseType}\n`;
      document += `- Source: ${credit.sourceUrl}\n`;
      document += `- Sample ID: ${credit.sampleId}\n\n`;
    }
    
    return document;
  }
  
  async exportCredits(format: 'markdown' | 'json' | 'txt'): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.generateCreditsDocument();
      case 'json':
        return JSON.stringify(Array.from(this.attributions.values()), null, 2);
      case 'txt':
        return this.generatePlainTextCredits();
    }
  }
}
```

### Commercial Compliance

**License Validation Pipeline:**
```typescript
class LicenseValidator {
  async validateForCommercialUse(
    sampleMetadata: SampleMetadata
  ): Promise<ValidationResult> {
    const license = await this.licenseManager.getLicense(sampleMetadata.id);
    
    const checks: ValidationCheck[] = [
      {
        name: 'Commercial Use Permitted',
        passed: license.commercialUse,
        message: license.commercialUse ? 
          'Commercial use allowed' : 
          'Commercial use restricted'
      },
      {
        name: 'Attribution Requirements',
        passed: true, // Always pass, but note requirements
        message: license.attributionRequired ?
          `Attribution required: ${license.attribution}` :
          'No attribution required'
      },
      {
        name: 'Share-Alike Compatibility',
        passed: !license.shareAlike || this.isCompatibleWithPlugin(license),
        message: license.shareAlike ?
          'Share-alike license - verify plugin compatibility' :
          'No share-alike restrictions'
      }
    ];
    
    return {
      isValid: checks.every(check => check.passed),
      checks,
      license,
      recommendations: this.generateRecommendations(checks, license)
    };
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Immediate - 2-4 weeks)
- [ ] Create unified sample manager architecture
- [ ] Implement Freesound.org adapter (highest priority)
- [ ] Set up basic caching system with IndexedDB
- [ ] Create license tracking and attribution system
- [ ] Integrate with existing AudioEngine fallback system

### Phase 2: API Integration (Short-term - 1-2 months)
- [ ] Add Soundstripe adapter for professional samples
- [ ] Implement Storyblocks integration for diverse content
- [ ] Create ElevenLabs generator for experimental sounds
- [ ] Develop advanced search and filtering capabilities
- [ ] Add real-time license validation

### Phase 3: Manual Source Integration (Medium-term - 2-3 months)
- [ ] Curate and integrate BBC Sound Effects Archive samples
- [ ] Process Archive.org collections for relevant content
- [ ] Evaluate and integrate selected commercial libraries
- [ ] Build field recording community relationships
- [ ] Create batch processing tools for manual sources

### Phase 4: Optimization & Enhancement (Long-term - 3-6 months)
- [ ] Implement intelligent sample recommendation system
- [ ] Add user preference learning and adaptation
- [ ] Create sample preview and audition capabilities
- [ ] Build community sample sharing features
- [ ] Develop advanced caching and preloading strategies

### Phase 5: Production & Monitoring (Ongoing)
- [ ] Deploy comprehensive monitoring and analytics
- [ ] Implement automated license compliance checking
- [ ] Create user feedback and rating systems
- [ ] Establish regular sample library updates
- [ ] Build administrative tools for sample management

---

## Performance Considerations

### Network Optimization
```typescript
interface NetworkOptimization {
  // Request batching for multiple samples
  batchSize: 5;
  
  // Concurrent download limits
  maxConcurrentDownloads: 3;
  
  // Compression preferences
  preferredFormats: ['ogg', 'mp3', 'wav'];
  
  // Progressive loading
  loadOrder: 'priority-based'; // Load most likely samples first
  
  // CDN utilization
  useSourceCDN: true; // Prefer source CDNs over direct API
}

class PerformanceOptimizer {
  async optimizeSampleLoading(requests: SampleRequest[]): Promise<AudioBuffer[]> {
    // Group by source for batch processing
    const bySource = this.groupBySource(requests);
    
    // Process in parallel with concurrency limits
    const results = await Promise.allSettled(
      Object.entries(bySource).map(([source, requests]) =>
        this.processBatch(source, requests)
      )
    );
    
    return this.combineResults(results);
  }
  
  private async processBatch(
    sourceId: string, 
    requests: SampleRequest[]
  ): Promise<AudioBuffer[]> {
    const adapter = this.sampleManager.getSource(sourceId);
    const semaphore = new Semaphore(this.networkOptimization.maxConcurrentDownloads);
    
    return await Promise.all(
      requests.map(request =>
        semaphore.acquire(() => adapter.loadSample(request.sampleId))
      )
    );
  }
}
```

### Caching Strategy
- **Memory Cache:** 50MB limit for frequently accessed samples
- **IndexedDB Cache:** 500MB limit for browser persistence
- **Local Storage:** 2GB limit for offline-capable samples
- **Intelligent Eviction:** LRU with access frequency weighting

### Quality Adaptation
```typescript
class QualityAdapter {
  adaptSampleQuality(connectionSpeed: NetworkSpeed): SampleQuality {
    switch (connectionSpeed) {
      case 'slow':
        return {
          format: 'mp3',
          bitrate: 128,
          sampleRate: 22050,
          channels: 'mono'
        };
      case 'medium':
        return {
          format: 'ogg',
          bitrate: 192,
          sampleRate: 44100,
          channels: 'stereo'
        };
      case 'fast':
        return {
          format: 'wav',
          bitrate: 'lossless',
          sampleRate: 48000,
          channels: 'stereo'
        };
    }
  }
}
```

---

## Monitoring & Analytics

### Success Metrics
```typescript
interface SampleSourceMetrics {
  // Availability metrics
  uptime: number;
  responseTime: number;
  successRate: number;
  
  // Usage metrics
  samplesServed: number;
  cacheHitRate: number;
  userSatisfaction: number;
  
  // Quality metrics
  averageLoadTime: number;
  errorRate: number;
  licenseComplianceRate: number;
}

class MetricsCollector {
  private metrics: Map<string, SampleSourceMetrics> = new Map();
  
  recordSampleLoad(source: string, loadTime: number, success: boolean): void {
    const sourceMetrics = this.metrics.get(source) || this.createDefaultMetrics();
    
    sourceMetrics.samplesServed++;
    sourceMetrics.averageLoadTime = this.updateAverage(
      sourceMetrics.averageLoadTime,
      loadTime,
      sourceMetrics.samplesServed
    );
    
    if (!success) {
      sourceMetrics.errorRate = this.calculateErrorRate(sourceMetrics);
    }
    
    this.metrics.set(source, sourceMetrics);
  }
  
  generateReport(): SourcePerformanceReport {
    return {
      timestamp: new Date(),
      sources: Array.from(this.metrics.entries()).map(([source, metrics]) => ({
        sourceId: source,
        ...metrics,
        healthScore: this.calculateHealthScore(metrics)
      })),
      recommendations: this.generateOptimizationRecommendations()
    };
  }
}
```

### Error Handling & Recovery
```typescript
class ErrorRecoveryManager {
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  
  async handleSourceError(
    source: string, 
    error: Error, 
    context: RequestContext
  ): Promise<RecoveryAction> {
    // Log error for analysis
    this.logError(source, error, context);
    
    // Identify error pattern
    const pattern = this.identifyErrorPattern(error);
    
    // Determine recovery strategy
    switch (pattern.type) {
      case 'rate_limit':
        return this.handleRateLimit(source, pattern);
      case 'auth_failure':
        return this.handleAuthFailure(source, pattern);
      case 'network_error':
        return this.handleNetworkError(source, pattern);
      case 'license_violation':
        return this.handleLicenseViolation(source, pattern);
      default:
        return this.handleGenericError(source, pattern);
    }
  }
  
  private async handleRateLimit(
    source: string, 
    pattern: ErrorPattern
  ): Promise<RecoveryAction> {
    // Implement exponential backoff
    const backoffTime = this.calculateBackoff(pattern.frequency);
    
    return {
      action: 'retry_with_delay',
      delay: backoffTime,
      fallbackSources: this.getAlternativeSources(source),
      recommendation: `Rate limited on ${source}. Retrying in ${backoffTime}ms.`
    };
  }
}
```

---

## Security Considerations

### API Key Management
```typescript
class SecureCredentialManager {
  private encryptedStorage: EncryptedStorage;
  
  async storeCredentials(source: string, credentials: SourceCredentials): Promise<void> {
    const encrypted = await this.encrypt(credentials);
    await this.encryptedStorage.set(`${source}_credentials`, encrypted);
  }
  
  async getCredentials(source: string): Promise<SourceCredentials | null> {
    const encrypted = await this.encryptedStorage.get(`${source}_credentials`);
    if (!encrypted) return null;
    
    return await this.decrypt(encrypted);
  }
  
  async rotateApiKey(source: string): Promise<void> {
    const adapter = this.getSourceAdapter(source);
    const newCredentials = await adapter.requestNewCredentials();
    
    // Test new credentials before storing
    if (await this.validateCredentials(source, newCredentials)) {
      await this.storeCredentials(source, newCredentials);
      this.notifyCredentialRotation(source);
    }
  }
}
```

### Data Privacy
- **No User Data Transmission:** Sample requests contain no personal information
- **Local-Only Caching:** All downloaded samples stored locally
- **Minimal Metadata:** Only essential metadata transmitted to external services
- **Audit Trail:** All external requests logged for transparency

### License Compliance Monitoring
```typescript
class ComplianceMonitor {
  async performLicenseAudit(): Promise<ComplianceReport> {
    const allSamples = await this.sampleCache.getAllCachedSamples();
    const violations: LicenseViolation[] = [];
    
    for (const sample of allSamples) {
      const license = await this.licenseManager.getLicense(sample.id);
      const validation = await this.validateLicense(license);
      
      if (!validation.isCompliant) {
        violations.push({
          sampleId: sample.id,
          licenseType: license.type,
          violation: validation.violationType,
          severity: validation.severity,
          recommendation: validation.recommendation
        });
      }
    }
    
    return {
      auditDate: new Date(),
      totalSamples: allSamples.length,
      compliantSamples: allSamples.length - violations.length,
      violations,
      overallCompliance: violations.length === 0,
      nextAuditDate: this.calculateNextAuditDate()
    };
  }
}
```

---

**This comprehensive integration framework will transform Sonigraph into a powerful, legally compliant, and highly diverse audio synthesis platform capable of delivering exceptional musical experiences across all 34 instrument families.**
