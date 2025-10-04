# Audio Engine Architecture

## Table of Contents

- [1. Architecture](#1-architecture)
- [2. Instrument Implementation](#2-instrument-implementation)
- [3. Effects Processing](#3-effects-processing)
- [4. Voice Management](#4-voice-management)
- [5. Performance Optimization](#5-performance-optimization)
- [6. Continuous Layers System](#6-continuous-layers-system)
- [7. Freesound Integration](#7-freesound-integration)
- [8. Musical Theory Engine](#8-musical-theory-engine)
- [9. Hub Orchestration](#9-hub-orchestration)

---

## 1. Architecture

The AudioEngine serves as the central orchestrator for all audio operations, managing 34 instruments across 7 orchestral families.

**Core Components:**
- **Instrument Management**: Dynamic instrument initialization and voice allocation
- **Effects Processing**: Per-instrument effects chains with master bus
- **Synthesis Engines**: Specialized engines for different instrument types
- **Performance Monitoring**: Real-time CPU and memory tracking

**File Structure:**
```
src/audio/
├── engine.ts              # Main AudioEngine class
├── harmonic-engine.ts     # Harmonic processing
├── percussion-engine.ts   # Physics-based percussion synthesis
├── electronic-engine.ts   # Analog-style electronic synthesis
├── playback-events.ts     # Event scheduling and coordination
├── layers/                # Continuous audio layers system
│   ├── ContinuousLayerManager.ts  # Layer orchestration and management
│   ├── MusicalGenreEngine.ts      # 13 musical genres with synthesis parameters
│   ├── RhythmicLayerManager.ts    # Activity-based percussion patterns
│   ├── HarmonicLayerManager.ts    # Cluster-based chord progressions
│   ├── FreesoundSampleLoader.ts   # Freesound sample integration
│   └── types.ts           # Layer type definitions
├── freesound/             # Freesound API integration
│   ├── FreesoundAPI.ts    # API client and authentication
│   ├── FreesoundAuthManager.ts    # Token management
│   ├── FreesoundSampleManager.ts  # Sample library management
│   ├── SampleCache.ts     # Persistent sample caching
│   ├── SamplePreloader.ts # Predictive preloading
│   ├── CacheStrategy.ts   # Cache optimization strategies
│   └── DownloadQueue.ts   # Download queue management
├── theory/                # Musical theory engine
│   ├── MusicalTheoryEngine.ts     # Scale and harmony system
│   ├── ScaleDefinitions.ts        # Musical scale formulas
│   └── HarmonicRules.ts   # Voice leading and progressions
├── orchestration/         # Hub orchestration system
│   ├── HubOrchestrationManager.ts # Hub detection and emphasis
│   ├── HubCentralityAnalyzer.ts   # Centrality metrics
│   ├── HubTransitionHandler.ts    # Smooth hub transitions
│   └── DynamicOrchestrationManager.ts # Real-time orchestration
├── mapping/               # Content-aware mapping
├── effects/               # Effect processors
├── voice-management/      # Voice pooling and allocation
├── percussion/            # Percussion instruments
├── spatial/               # Spatial audio
├── configs/               # Instrument configurations
└── clustering/            # Audio clustering algorithms
```

## 2. Instrument Implementation

**34-Instrument Orchestral System:**

| Family | Instruments | Synthesis Approach | Key Features |
|--------|-------------|-------------------|-------------|
| **Keyboard** | Piano, Organ, Electric Piano, Harpsichord, Accordion, Celesta | Sample-based + specialized synthesis | Authentic articulation, velocity sensitivity |
| **Strings** | Strings, Violin, Cello, Guitar, Harp | Sample-based + string modeling | Bowing simulation, Karplus-Strong synthesis |
| **Brass** | Trumpet, French Horn, Trombone, Tuba | Sample-based + brass formants | Metallic timbre, breath control |
| **Woodwinds** | Flute, Clarinet, Saxophone, Oboe | Sample-based + breath modeling | Reed simulation, formant filtering |
| **Vocals** | Choir, Vocal Pads, Soprano, Alto, Tenor, Bass | Sample-based + formant synthesis | Vowel morphing, breath patterns |
| **Percussion** | Timpani, Xylophone, Vibraphone, Gongs | Physics modeling + transient synthesis | Pitch bending, metallic resonance |
| **Electronic** | Pad, Lead Synth, Bass Synth, Arp Synth | Classic analog synthesis | Filter modulation, LFO control |
| **Environmental** | Whale Song | Scientific recordings + oceanic effects | Ultra-long sustains, wide spectrum |

**Sample Loading Strategy (Issue #011 Resolution):**
- **Hybrid Sample/Synthesis System**: 19/34 instruments use external CDN samples, 15 use synthesis fallback
- **User Control**: "Use High Quality Samples" toggle (OFF by default for safe, synthesis-only operation)
- **Automatic Format Selection**: OGG format chosen automatically (resolved format confusion from Issue #005)
- **CDN Coverage**: 56% sample coverage with graceful synthesis fallback for missing instruments
- **Comprehensive Diagnostics**: Real-time CDN loading status with detailed error reporting
- **Browser Caching**: Performance optimization with persistent sample caching (~20-30MB)

**Voice Assignment Strategies:**
1. **Frequency-based**: Assigns instruments based on pitch ranges
2. **Round-robin**: Cycles through enabled instruments
3. **Connection-based**: Uses graph connectivity for consistent assignment

## 3. Effects Processing

**Per-Instrument Effects System:**
Each instrument supports individual effects chains with real-time parameter control.

**Available Effects:**
- **Reverb**: Spatial depth and realism (configurable decay, pre-delay, wet/dry)
- **Chorus**: Movement and richness (rate, depth, delay time, feedback)
- **Filter**: Tonal shaping (frequency, Q, type: lowpass/highpass/bandpass)

**Master Effects Bus:**
- **Orchestral Reverb**: Global spatial processing
- **3-Band EQ**: Master frequency shaping
- **Compressor**: Dynamic range control
- **Limiter**: Peak limiting for safe output levels

**Effect Configuration Examples:**
```typescript
// Piano: Clean, precise sound
piano: {
  reverb: { decay: 1.8, preDelay: 0.02, wet: 0.25 },
  chorus: { enabled: false },
  filter: { enabled: false }
}

// Strings: Lush, sustained processing
strings: {
  reverb: { decay: 3.5, preDelay: 0.01, wet: 0.4 },
  chorus: { enabled: false },
  filter: { frequency: 3500, type: 'lowpass' }
}

// Organ: Rich, church-like character
organ: {
  reverb: { decay: 2.8, preDelay: 0.02, wet: 0.3 },
  chorus: { frequency: 0.8, depth: 0.5, delayTime: 4, feedback: 0.2 },
  filter: { enabled: false }
}
```

## 4. Voice Management

**Polyphonic Voice System:**
- **Default Voice Limit**: 4-8 voices per instrument
- **Total System Limit**: Dynamic based on performance monitoring
- **Voice Stealing**: Intelligent allocation when limits exceeded
- **Resource Pooling**: Efficient voice reuse and cleanup

**Adaptive Quality System:**
```typescript
interface QualityLevel {
  high: { voices: 8, effects: 'full', sampleRate: 44100 },
  medium: { voices: 6, effects: 'essential', sampleRate: 44100 },
  low: { voices: 4, effects: 'minimal', sampleRate: 22050 }
}
```

## 5. Performance Optimization

**Phase 3 Performance Enhancements (Issue #001 Resolution):**
- **Processing Stability**: 100% stability achieved (target: >85%)
- **Voice Allocation**: 0.036ms average (1,600x improvement from pre-optimization)
- **Frequency Detuning**: ±0.1% randomization for phase conflict resolution
- **Cached Instrument Optimization**: O(1) enabled instruments lookup
- **Memory Leak Prevention**: Set-based cleanup with proper resource management

**Frequency Detuning System:**
```typescript
// Phase conflict resolution with ±0.1% frequency randomization
private applyFrequencyDetuning(frequency: number): number {
  if (!this.settings.performanceMode?.enableFrequencyDetuning) {
    return frequency;
  }
  const conflictWindowMs = 50;
  const baseFrequency = Math.round(frequency * 10) / 10;
  const lastUsedTime = this.frequencyHistory.get(baseFrequency);
  
  if (lastUsedTime && (performance.now() - lastUsedTime) < conflictWindowMs) {
    const detuneAmount = (Math.random() - 0.5) * 0.002; // ±0.1%
    return frequency * (1 + detuneAmount);
  }
  return frequency;
}
```

**Performance Mode Settings:**
```typescript
interface PerformanceMode {
  mode: 'low' | 'medium' | 'high' | 'ultra';
  enableFrequencyDetuning: boolean;
  maxConcurrentVoices: number;
  processingQuality: 'fast' | 'balanced' | 'high-quality';
  enableAudioOptimizations: boolean;
}
```

**Memory Management:**
- Sample caching with intelligent preloading
- Automatic garbage collection for unused voices
- Resource pooling for effects and synthesis components
- Total memory footprint: ~30-40MB when fully loaded
- Cached enabled instruments for O(1) lookup performance

**CPU Optimization:**
- Hardware-accelerated Web Audio processing
- Polyphony limits to prevent overload
- Performance monitoring with automatic quality adjustment
- **Current Performance**: <1% CPU usage under normal operation (optimized from 25% target)
- Ultra-consistent processing times (0.003ms average, 0.1ms max)

**Network Optimization:**
- One-time sample downloads with persistent browser caching
- CDN-based sample delivery for global performance
- Compression and efficient sample formats

**Issue #011: CDN Diagnostic System:**
- Comprehensive 34-instrument sample availability analysis
- Real-time loading status reporting with structured logging
- Missing instrument detection and fallback mode activation
- Performance impact assessment for hybrid sample/synthesis operation
- Developer-friendly diagnostic reports for troubleshooting sample loading issues

**Issue #012: CDN Loading Fallback System:**
- Automatic synthesis fallback for failed CDN sample loading
- Vocal instrument silence prevention with specialized vocal synthesis
- Graceful degradation maintaining audio output for all instruments
- Real-time fallback detection and replacement within 5 seconds
- Specialized synthesis voices for soprano, alto, tenor, bass with distinct timbres

## 6. Continuous Layers System

**Three Independent Audio Layers:**

**Ambient Layer:**
- Genre-based continuous background soundscapes
- Evolves with vault state and graph complexity
- Density and texture complexity controls
- Freesound sample integration

**Rhythmic Layer:**
- Activity-responsive percussion patterns
- Syncs with vault interactions and timeline animation
- Tempo mapping based on vault activity
- Pattern complexity: Simple, Medium, Complex

**Harmonic Layer:**
- Cluster-based harmony generation
- Chord progressions driven by graph structure
- Musical theory integration (scales, keys, voice leading)
- 2-6 voice chord complexity

**Musical Genre Engine (13 Genres):**
1. Ambient Drone
2. Cinematic Orchestral
3. Jazz Lounge
4. Electronic Pulse
5. Nature Soundscape
6. Minimal Piano
7. Dark Atmospheric
8. World Ethnic
9. Retro Synth
10. Classical Chamber
11. Industrial Noise
12. Meditation Zen
13. Experimental Glitch

Each genre includes:
- Curated Freesound sample sets
- Synthesis parameter profiles
- Rhythmic pattern templates
- Harmonic voicing preferences

**Adaptive Behavior:**
- Responds to vault size (more files = richer textures)
- Evolves through timeline animation
- Quieter during busy node playback
- Dynamic volume and intensity adjustment

## 7. Freesound Integration

**Complete API Integration:**

**FreesoundAPI:**
- OAuth2 token-based authentication
- Search with filters (license, tags, duration)
- Sample metadata retrieval
- Preview URL fetching

**Sample Management:**
- 114 curated samples in library
- Tag-based organization
- License tracking (CC0, CC-BY, CC-BY-NC)
- Enable/disable individual samples

**Caching System:**
- Persistent sample cache in `.sonigraph-cache/`
- Predictive preloading based on genre preferences
- Offline mode support
- Cache size management and cleanup

**Download Queue:**
- Prioritized sample downloads
- Retry logic for failed downloads
- Progress tracking
- Bandwidth optimization

## 8. Musical Theory Engine

**Scale System:**
- 8 musical scales (Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Pentatonic, Chromatic)
- 12 key centers (C through B)
- Independent tonality for continuous layers vs. node sonification

**Harmonic Rules:**
- Voice leading algorithms
- Chord progression generation
- Consonance/dissonance management
- Common tone preservation

**Scale Definitions:**
- Interval formulas for each scale
- Pitch mapping utilities
- MIDI note conversion
- Frequency calculation

## 9. Hub Orchestration

**Hub Detection:**

**Centrality Metrics:**
- Degree centrality (connection count)
- Betweenness centrality (bridge nodes)
- Closeness centrality (graph center)
- Eigenvector centrality (influence of influencers)

**Configurable Weights:**
- Each metric has 0-100% weight
- Total weights must equal 100%
- Real-time recalculation

**Musical Emphasis:**

**Hub Treatment:**
- Volume boost (0-200%)
- Extended sustain (2-4s vs. 0.5-1s)
- Richer harmony (extended chords)
- Featured instruments (brass, vocals)

**Transition Handling:**
- Smooth crossfades between hubs
- Voice leading preservation
- Rhythmic synchronization
- Morph timbre gradually

**Dynamic Orchestration:**
- Real-time hub detection during playback
- Automatic emphasis adjustment
- Cluster membership awareness
- Temporal influence modeling

---

*For related documentation, see:*
- [Sonic Graph System](sonic-graph-system.md) - Graph-to-audio mapping
- [External Integrations](external-integrations.md) - CDN sample sources and Freesound
- [Performance & Monitoring](performance.md) - System optimization