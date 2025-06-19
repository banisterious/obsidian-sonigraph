# Freesound.org Integration Guide

**Status:** 📋 **PLANNING**  
**Priority:** Medium  
**Component:** Audio Engine / Sample Management  
**Last Updated:** 2025-06-18

---

## Table of Contents

- [Overview](#overview)
- [API Overview & Authentication](#api-overview--authentication)
  - [Authentication Requirements](#authentication-requirements)
  - [Rate Limiting](#rate-limiting)
- [Sound Discovery Strategy](#sound-discovery-strategy)
  - [Search Capabilities](#search-capabilities)
  - [Instrument Family Mapping](#instrument-family-mapping)
- [Integration Architecture](#integration-architecture)
  - [System Integration Points](#system-integration-points)
  - [File Format Preferences](#file-format-preferences)
- [Technical Implementation](#technical-implementation)
  - [API Endpoints](#api-endpoints)
  - [Sample Processing Pipeline](#sample-processing-pipeline)
- [Legal & Licensing Considerations](#legal--licensing-considerations)
  - [Creative Commons Compliance](#creative-commons-compliance)
  - [Attribution Management](#attribution-management)
  - [Legal Safeguards](#legal-safeguards)
- [Implementation Phases](#implementation-phases)
- [Performance Considerations](#performance-considerations)
- [Monitoring & Analytics](#monitoring--analytics)
- [Security Considerations](#security-considerations)

---

## Overview

This document outlines the integration strategy for leveraging Freesound.org's API v2 to expand Sonigraph's audio sample library. The Freesound platform provides access to over 500,000 Creative Commons licensed audio samples, offering significant opportunities to enhance our instrument families with high-quality, diverse sounds.

**Integration Goals:**
- Enhance sample diversity for percussion, experimental, and vocal families
- Provide fallback samples when CDN sources are unavailable
- Enable dynamic sample discovery based on musical context
- Maintain licensing compliance with Creative Commons requirements

---

## API Overview & Authentication

### Authentication Requirements

**OAuth2 Authentication:**
- Required for full API access and sample downloads
- Supports application-level API keys for development
- Token-based authentication for production use

**Implementation Strategy:**
```typescript
interface FreesoundConfig {
    apiKey: string;
    clientId: string;
    clientSecret: string;
    baseUrl: 'https://freesound.org/apiv2';
}
```

### Rate Limiting
- **Request Limits:** Varies by authentication level
- **Page Size:** Maximum 150 results per request
- **Best Practice:** Implement request queuing and caching

---

## Sound Discovery Strategy

### Search Capabilities

**Text-Based Search:**
- Filter by tags, descriptions, and filenames
- Support for complex queries with Boolean operators
- Category-based filtering for instrument families

**Descriptor-Based Search:**
- Technical audio analysis (pitch, spectral content, rhythm)
- Duration and quality filtering
- Geolocation-based discovery

### Instrument Family Mapping

**Percussion Samples:**
```typescript
const percussionQueries = {
    timpani: 'tag:timpani OR tag:kettle-drum duration:[1.0 TO 5.0]',
    xylophone: 'tag:xylophone OR tag:marimba duration:[0.1 TO 3.0]',
    gongs: 'tag:gong OR tag:singing-bowl duration:[2.0 TO 10.0]'
};
```

**Experimental/Ambient:**
```typescript
const experimentalQueries = {
    whaleHumpback: 'tag:whale OR tag:ocean OR tag:marine duration:[5.0 TO 30.0]',
    atmospheric: 'tag:ambient OR tag:soundscape duration:[10.0 TO 60.0]'
};
```

**Vocal Samples:**
```typescript
const vocalQueries = {
    choir: 'tag:choir OR tag:chorus duration:[2.0 TO 15.0]',
    soprano: 'tag:soprano OR tag:female-voice duration:[1.0 TO 10.0]',
    bass: 'tag:bass-voice OR tag:male-voice duration:[1.0 TO 10.0]'
};
```

---

## Integration Architecture

### System Integration Points

**1. Sample Loading Pipeline:**
```typescript
class FreesoundSampleLoader {
    async loadSample(instrumentKey: InstrumentKey): Promise<AudioBuffer> {
        // 1. Check local cache
        // 2. Fallback to Freesound API
        // 3. Download and cache sample
        // 4. Return processed AudioBuffer
    }
}
```

**2. Audio Engine Integration:**
- Extend existing `InstrumentConfigLoader` 
- Add Freesound as secondary sample source
- Maintain compatibility with current CDN system

**3. Caching Strategy:**
```typescript
interface SampleCache {
    localSamples: Map<string, AudioBuffer>;
    freesoundMetadata: Map<string, FreesoundTrackInfo>;
    licenseInfo: Map<string, LicenseData>;
}
```

### File Format Preferences

**Supported Formats:**
1. **Primary:** `.wav` (uncompressed, highest quality)
2. **Secondary:** `.ogg` (good compression, web-friendly)
3. **Fallback:** `.mp3` (widely supported, smaller files)

**Quality Filters:**
- Minimum sample rate: 44.1kHz
- Minimum bit depth: 16-bit
- Prefer stereo for ambient/experimental, mono for percussion

---

## Technical Implementation

### API Endpoints

**Search Endpoint:**
```typescript
interface FreesoundSearchParams {
    query: string;
    filter?: string;
    sort?: 'relevance' | 'downloads' | 'rating' | 'created';
    page_size?: number; // Max 150
    fields?: string; // Specify required fields
}
```

**Download Endpoint:**
```typescript
async downloadSample(soundId: number): Promise<Blob> {
    // Requires OAuth2 authentication
    // Returns audio file blob for local caching
}
```

### Sample Processing Pipeline

**1. Discovery Phase:**
```typescript
async discoverSamples(instrumentFamily: string): Promise<FreesoundTrack[]> {
    const query = this.buildQuery(instrumentFamily);
    const results = await this.freesoundAPI.search(query);
    return this.filterByQuality(results);
}
```

**2. Download & Cache Phase:**
```typescript
async cacheSample(track: FreesoundTrack): Promise<string> {
    const audioBlob = await this.freesoundAPI.download(track.id);
    const localPath = await this.storageManager.cache(audioBlob, track);
    await this.updateLicenseRegistry(track.license);
    return localPath;
}
```

**3. Integration Phase:**
```typescript
async loadFreesoundSample(instrumentKey: InstrumentKey): Promise<AudioBuffer> {
    const cachedPath = this.getCachedSample(instrumentKey);
    if (cachedPath) return await this.audioContext.decodeAudioData(cachedPath);
    
    const samples = await this.discoverSamples(this.getFamily(instrumentKey));
    const selectedSample = this.selectBestMatch(samples, instrumentKey);
    const localPath = await this.cacheSample(selectedSample);
    return await this.audioContext.decodeAudioData(localPath);
}
```

---

## Legal & Licensing Considerations

### Creative Commons Compliance

**License Types to Target:**
- **CC0:** Public domain, no restrictions
- **CC BY:** Attribution required
- **CC BY-SA:** Attribution + share-alike
- **Avoid:** Commercial restrictions (CC BY-NC)

### Attribution Management

**Implementation Strategy:**
```typescript
interface LicenseData {
    soundId: number;
    license: 'CC0' | 'CC BY' | 'CC BY-SA';
    attribution: string;
    author: string;
    sourceUrl: string;
}

class AttributionManager {
    generateCredits(): string {
        // Compile all required attributions
        // Generate credits text for plugin info
    }
}
```

### Legal Safeguards

**Requirements:**
- Store license information for all samples
- Provide attribution mechanism in plugin
- Regular license compliance audits
- User notification of licensing requirements

---

## Implementation Phases

### Phase 1: Infrastructure (Immediate)
- [ ] Set up Freesound API authentication
- [ ] Implement basic search and download capabilities
- [ ] Create sample caching system
- [ ] Add license tracking

### Phase 2: Integration (Short-term)
- [ ] Extend AudioEngine sample loading
- [ ] Add Freesound fallback to existing instruments
- [ ] Implement sample quality filtering
- [ ] Create attribution system

### Phase 3: Enhancement (Medium-term)
- [ ] Dynamic sample discovery based on graph context
- [ ] User-configurable sample preferences
- [ ] Advanced search with audio descriptors
- [ ] Sample preview capabilities

### Phase 4: Optimization (Long-term)
- [ ] Intelligent caching based on usage patterns
- [ ] Background sample pre-loading
- [ ] Community sample sharing features
- [ ] Advanced license management

---

## Performance Considerations

### Caching Strategy
- **Local Storage:** SQLite database for metadata
- **File System:** Organized sample directory structure
- **Memory Management:** Lazy loading with LRU eviction

### Network Optimization
- **Request Batching:** Combine multiple API calls
- **Progressive Loading:** Download samples on-demand
- **Compression:** Use OGG format for bandwidth efficiency

### Fallback Mechanisms
- **Primary:** Current CDN samples
- **Secondary:** Freesound API samples
- **Tertiary:** Embedded synthesis fallbacks

---

## Monitoring & Analytics

### Success Metrics
- Sample loading success rate
- API response times
- Cache hit ratios
- User satisfaction with sample diversity

### Error Handling
- API rate limit handling
- Network failure recovery
- License compliance validation
- Sample quality verification

---

## Security Considerations

### API Key Management
- Secure storage of authentication credentials
- Token refresh mechanisms
- API key rotation procedures

### Data Privacy
- No user data sent to Freesound
- Local-only sample caching
- Compliance with plugin privacy requirements

---

**This integration will significantly enhance Sonigraph's audio capabilities while maintaining our commitment to high-quality, legally compliant audio samples.**