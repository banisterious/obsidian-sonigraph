# Audio Engine Implementation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [File Structure](#file-structure)
- [Instrument Implementation](#instrument-implementation)
  - [Current Implementation: Sampled Instruments (v0.1.0)](#current-implementation-sampled-instruments-v010)
  - [Sample Loading Strategy](#sample-loading-strategy)
  - [Voice Assignment Strategies](#voice-assignment-strategies)
- [Effects Processing](#effects-processing)
  - [Reverb](#reverb)
  - [Chorus](#chorus)
  - [Low-pass Filter](#low-pass-filter)
- [Configuration](#configuration)
  - [Instrument Settings](#instrument-settings)
  - [Global Settings](#global-settings)
- [Performance Considerations](#performance-considerations)
  - [Memory Usage](#memory-usage)
  - [CPU Usage](#cpu-usage)
  - [Network Usage](#network-usage)
- [Future Development](#future-development)
  - [TODO: Bundled Samples Option](#todo-bundled-samples-option)
  - [TODO: Advanced Features](#todo-advanced-features)
- [API Reference](#api-reference)
  - [AudioEngine Class](#audioengine-class)
  - [Configuration Types](#configuration-types)
- [Debugging](#debugging)
  - [Logging Categories](#logging-categories)
  - [Common Issues](#common-issues)
- [Dependencies](#dependencies)

## Overview

The Sonigraph Audio Engine is responsible for converting graph data into immersive audio experiences. It uses Tone.js as the underlying Web Audio framework and supports multiple instrument types with realistic sound synthesis.

## Architecture

### Core Components

- **AudioEngine**: Main orchestrator for audio playback
- **HarmonicEngine**: Handles harmonic processing and chord generation
- **Instrument System**: Manages multiple instrument voices
- **Effects Chain**: Applies spatial and tonal effects

### File Structure

```
src/audio/
├── engine.ts           # Main AudioEngine class
├── harmonic-engine.ts  # Harmonic processing
└── types.ts           # Audio-related type definitions
```

## Instrument Implementation

### Current Implementation: Sampled Instruments (v0.1.0)

As of the latest implementation, all instruments use high-quality audio samples loaded from CDN sources:

#### Piano 🎹
- **Technology**: Tone.js Sampler
- **Samples**: Salamander Grand Piano (29 samples, A0-C8)
- **Source**: `https://tonejs.github.io/audio/salamander/`
- **Characteristics**: Realistic percussive attack, natural decay and resonance
- **Effects**: Reverb

#### Organ 🎺
- **Technology**: Tone.js Sampler  
- **Samples**: Harmonium (20 samples, C2-G6)
- **Source**: `https://nbrosowsky.github.io/tonejs-instruments/samples/harmonium/`
- **Characteristics**: Sustained tones with natural breath and vibrato
- **Effects**: Chorus, Reverb

#### Strings 🎻
- **Technology**: Tone.js Sampler
- **Samples**: Violin recordings (16 samples, C3-A6)
- **Source**: `https://nbrosowsky.github.io/tonejs-instruments/samples/violin/`
- **Characteristics**: Authentic bowed attack and sustain
- **Effects**: Reverb, Low-pass filter

### Sample Loading Strategy

**Advantages:**
- ✅ Realistic instrument sounds
- ✅ Small plugin bundle size
- ✅ Browser caching for performance
- ✅ No licensing issues (CC-BY 3.0)

**Considerations:**
- ⚠️ Requires internet connection for first use
- ⚠️ Initial loading delay (~30-40MB total)
- ⚠️ CDN dependency

### Voice Assignment Strategies

The engine supports multiple strategies for distributing notes across instruments:

1. **Frequency-based**: Assigns instruments based on pitch ranges
2. **Round-robin**: Cycles through enabled instruments
3. **Connection-based**: Uses graph connectivity for consistent assignment

## Effects Processing

### Reverb
- **Purpose**: Spatial depth and realism
- **Settings**: 1.8s decay, 0.02s pre-delay, 25% wet
- **Applied to**: All instruments

### Chorus
- **Purpose**: Organ richness and movement
- **Settings**: 0.8Hz rate, 4.0ms delay, 50% depth
- **Applied to**: Organ only

### Low-pass Filter
- **Purpose**: String warmth and smoothness
- **Settings**: 3.5kHz cutoff, -24dB/octave rolloff
- **Applied to**: Strings only

## Configuration

### Instrument Settings

Each instrument supports:
- **Volume control**: Individual volume levels
- **Enable/disable**: Toggle instruments on/off
- **Voice limits**: Maximum simultaneous notes (PolySynth only)

### Global Settings

- **Master volume**: Overall output level
- **Voice assignment strategy**: How notes are distributed
- **Harmonic processing**: Chord generation and consonance

## Performance Considerations

### Memory Usage
- Samples are cached in browser memory after first load
- Total memory footprint: ~30-40MB when all instruments loaded
- Automatic garbage collection for unused voices

### CPU Usage
- Tone.js uses Web Audio API for efficient processing
- Effects processing is hardware-accelerated where available
- Polyphony limits prevent CPU overload

### Network Usage
- One-time download per instrument on first use
- Subsequent sessions use cached samples
- Graceful degradation if CDN unavailable

## Future Development

### TODO: Bundled Samples Option

**Goal**: Provide offline-capable instrument samples bundled with the plugin

**Approaches to explore:**

1. **Minimal Sample Set**
   - Bundle 3-4 key samples per instrument
   - Total size: ~2-3MB
   - Covers essential pitch ranges
   - Fallback for offline use

2. **Hybrid Loading**
   - Bundle basic samples for immediate use
   - Load full sample set on demand
   - Best of both worlds approach

3. **Local Sample Hosting**
   - Allow users to provide their own sample libraries
   - Support for custom instrument definitions
   - Advanced user customization

4. **Compressed Samples**
   - Investigate audio compression techniques
   - Balance quality vs. bundle size
   - Consider WebM/OGG alternatives

**Implementation Considerations:**
- Plugin size limits in Obsidian ecosystem
- User preference for offline vs. online operation
- Quality vs. size trade-offs
- Licensing requirements for bundled samples

### TODO: Advanced Features

- **Custom instrument support**: User-provided sample libraries
- **Real-time effects**: Dynamic effect parameter modulation
- **Spatial audio**: 3D positioning based on graph layout
- **MIDI export**: Save sonifications as MIDI files
- **Performance optimization**: Web Workers for sample processing

## API Reference

### AudioEngine Class

```typescript
class AudioEngine {
  // Initialization
  async initialize(): Promise<void>
  
  // Playback control
  async playSequence(sequence: MusicalMapping[]): Promise<void>
  stop(): void
  async playTestNote(frequency?: number): Promise<void>
  
  // Configuration
  updateSettings(settings: SonigraphSettings): void
  updateInstrumentVolume(instrument: string, volume: number): void
  setInstrumentEnabled(instrument: string, enabled: boolean): void
  
  // Status
  getStatus(): AudioStatus
  
  // Cleanup
  dispose(): void
}
```

### Configuration Types

```typescript
interface SamplerConfig {
  urls: Record<string, string>    // Note -> filename mapping
  release: number                 // Release time in seconds
  baseUrl: string                // CDN base URL
  effects: string[]              // Applied effect names
}
```

## Debugging

### Logging Categories

- `audio-engine`: General engine operations
- `initialization`: Startup and setup
- `playback`: Sequence playback events
- `instrument-control`: Volume and enable/disable
- `effects`: Effect processing
- `test`: Test note functionality

### Common Issues

1. **Samples not loading**: Check network connectivity and CDN availability
2. **No audio output**: Verify Web Audio context is started (requires user interaction)
3. **Performance issues**: Check polyphony limits and CPU usage
4. **Timing problems**: Verify Transport synchronization

## Dependencies

- **Tone.js**: Web Audio framework
- **tonejs-instruments**: Sample library (external CDN)
- **Salamander Piano**: High-quality piano samples (external CDN)

---

*Last updated: January 2025*  
*Implementation version: v0.1.0 - Sampled Instruments* 