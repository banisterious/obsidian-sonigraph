# Sonigraph Instrument Sources Reference

**Document Version**: 2.0  
**Last Updated**: June 16, 2025  
**Total Instruments**: 34  
**Coverage**: Complete Orchestral Vision + Environmental Sounds

---

## Table of Contents

1. [Overview](#overview)
2. [Default Enabled Instruments](#default-enabled-instruments)
3. [🎤 Vocal Family (6 Instruments)](#-vocal-family-6-instruments)
4. [🎹 Keyboard Family (6 Instruments)](#-keyboard-family-6-instruments)
5. [🎻 Strings Family (5 Instruments)](#-strings-family-5-instruments)
6. [🎺 Brass Family (4 Instruments)](#-brass-family-4-instruments)
7. [🎷 Woodwinds Family (4 Instruments)](#-woodwinds-family-4-instruments)
8. [🥁 Percussion Family (4 Instruments)](#-percussion-family-4-instruments)
9. [🌟 Electronic Family (4 Instruments)](#-electronic-family-4-instruments)
10. [🌊 Environmental Family (1 Instrument)](#-environmental-family-1-instrument)
11. [Technical Implementation Details](#technical-implementation-details)
12. [External Dependencies](#external-dependencies)
13. [Future Expansion Considerations](#future-expansion-considerations)

---

## Overview

This document provides a comprehensive catalog of all sample sources, synthesis approaches, and technical specifications for each of the 34 instruments implemented in the Sonigraph plugin. Each entry includes the synthesis method, sample library sources, effects processing, and technical details.

## Default Enabled Instruments

For optimal user experience, **5 core instruments** are enabled by default:

| Instrument | Family | Reason |
|------------|--------|--------|
| ✅ **Piano** | Keyboard | Essential keyboard instrument with professional grand piano samples |
| ✅ **Strings** | Strings | Orchestral foundation with rich string ensemble sounds |
| ✅ **Flute** | Woodwinds | Clean, crystalline woodwind representative |
| ✅ **Clarinet** | Woodwinds | Warm, expressive woodwind with hollow timbre |
| ✅ **Saxophone** | Woodwinds | Distinctive reedy character for musical variety |

All other instruments are **disabled by default** to avoid overwhelming new users while maintaining excellent performance. Users can easily enable additional instruments through the Control Center interface.

---

## 🎤 Vocal Family (6 Instruments)

| Instrument | Synthesis | Source | Sample Range | Release | Effects | Frequency | Status |
|------------|-----------|--------|--------------|---------|---------|-----------|--------|
| **Choir** | Sample-based + reverb | [ToneJS Choir](https://nbrosowsky.github.io/tonejs-instruments/samples/choir/) | C3-D#6 (15 samples) | 3.0s | Reverb, Chorus | High (1000-1400Hz) | Default |
| **Vocal Pads** | Sample-based + formant filtering | [ToneJS Vocal Pads](https://nbrosowsky.github.io/tonejs-instruments/samples/vocal-pads/) | C2-A5 (12 samples) | 4.0s | Reverb, Filter | Mid-High (600-1000Hz) | Default |
| **Soprano** | Sample-based + formant filtering | ToneJS library (high female voice) | High female range | 2.5s | Reverb, Formant | High-Mid (800-1200Hz) | Disabled |
| **Alto** | Sample-based + breath noise | ToneJS library (lower female voice) | Mid female range | 2.5s | Breath noise, Reverb | High (1000-1400Hz) | Disabled |
| **Tenor** | Sample-based + vocal expression | ToneJS library (high male voice) | Male vocal range | 2.5s | Vocal expression | Mid-High (600-1000Hz) | Disabled |
| **Bass (Vocal)** | Sample-based + chest resonance | ToneJS library (deep male voice) | Low male range | 3.0s | Chest resonance | Very Low (<100Hz) | Disabled |

**Notes**: 
- Layered SATB voices for full choir texture
- Ethereal sustained voice textures for pads
- Individual vocal sections provide precise voice control

---

## 🎹 Keyboard Family (6 Instruments)

| Instrument | Synthesis | Source | Sample Range | Release | Effects | Frequency | Status |
|------------|-----------|--------|--------------|---------|---------|-----------|--------|
| **Piano** | Sample-based | [Salamander Grand](https://tonejs.github.io/audio/salamander/) | A0-C8 (88 keys) | 1.0s | Reverb | Very High (1400-1600Hz) | ✅ **ENABLED** |
| **Organ** | Additive synthesis | [ToneJS Harmonium](https://github.com/nbrosowsky/tonejs-instruments/tree/master/samples/harmonium) | C2-G6 (21 samples) | 0.8s | Chorus, Reverb | Mid (400-800Hz) | Disabled |
| **Electric Piano** | AM synthesis + tremolo | Rhodes/Wurlitzer samples | Electric piano range | 1.2s | Tremolo, AM | Mid-Low (200-400Hz) | Disabled |
| **Harpsichord** | Sharp envelope + filtering | Baroque harpsichord samples | Historical range | 0.3s | Sharp attack, Filter | Low-Mid (300-600Hz) | Disabled |
| **Accordion** | AM synthesis + vibrato | Bellows accordion samples | Traditional range | 1.5s | Bellows, Vibrato | Mid (400-800Hz) | Disabled |
| **Celesta** | Triangle waves + decay | Bell-like percussion samples | Mallet range | 2.0s | Triangle synthesis | Very High (1400-1600Hz) | Disabled |

**Notes**: 
- Salamander Grand Piano samples are industry standard
- Hammond organ character with drawbar simulation
- Keyboard instruments span the complete frequency spectrum

---

## 🎻 Strings Family (5 Instruments)

| Instrument | Synthesis | Source | Sample Range | Release | Effects | Frequency | Status |
|------------|-----------|--------|--------------|---------|---------|-----------|--------|
| **Strings (Ensemble)** | Sample-based | [ToneJS Violin](https://nbrosowsky.github.io/tonejs-instruments/samples/violin/) | C3-A6 (16 samples) | 2.0s | Reverb | Low (100-200Hz) | ✅ **ENABLED** |
| **Violin** | Sawtooth + filter sweeps | Solo violin samples | Violin range | 2.2s | Filter sweeps, Vibrato | High-Mid (800-1200Hz) | Disabled |
| **Cello** | Complex harmonics + bow noise | Solo cello samples | Cello range | 2.8s | Bow noise, Harmonics | Mid-Low (200-400Hz) | Disabled |
| **Guitar** | Karplus-Strong synthesis | Acoustic guitar samples | Guitar fretboard | 1.8s | Pluck modeling | Mid-High (600-1000Hz) | Disabled |
| **Harp** | Pluck + long decay | Concert harp samples | Full harp range | 3.5s | Pluck, Arpeggios | Low (100-200Hz) | Disabled |

**Notes**: 
- Orchestral string ensemble forms the foundation
- Bowing and plucking articulations simulated
- Individual string instruments provide solo capabilities

---

## 🎺 Brass Family (4 Instruments)

| Instrument | Synthesis | Source | Sample Range | Release | Effects | Frequency | Status |
|------------|-----------|--------|--------------|---------|---------|-----------|--------|
| **Trumpet** | Square waves + brass formants | Orchestral trumpet samples | Trumpet range | 1.0s | Brass formants, Bright attack | Low-Mid (300-600Hz) | Disabled |
| **French Horn** | Sine waves + slight distortion | French horn samples | Horn range | 1.5s | Warm processing | Mid (400-800Hz) | Disabled |
| **Trombone** | Sawtooth + portamento | Trombone samples | Trombone range | 1.2s | Portamento, Slide | Mid-Low (200-400Hz) | Disabled |
| **Tuba** | Sub-bass + breath noise | Orchestral tuba samples | Deep tuba range | 2.0s | Sub-bass, Breath | Very Low (<100Hz) | Disabled |

**Notes**: 
- Brass formant filtering creates metallic timbre
- Portamento capabilities for realistic slide effects
- Complete brass section from high trumpet to low tuba

---

## 🎷 Woodwinds Family (4 Instruments)

| Instrument | Synthesis | Source | Sample Range | Release | Effects | Frequency | Status |
|------------|-----------|--------|--------------|---------|---------|-----------|--------|
| **Flute** | Sample-based + noise | [ToneJS Flute](https://nbrosowsky.github.io/tonejs-instruments/samples/flute/) | C4-E6 (17 samples) | 1.5s | Reverb | Ultra-High (>1600Hz) | ✅ **ENABLED** |
| **Clarinet** | Sample-based + odd harmonics | [ToneJS Clarinet](https://nbrosowsky.github.io/tonejs-instruments/samples/clarinet/) | Clarinet range | 1.8s | Reverb | High-Mid (800-1200Hz) | ✅ **ENABLED** |
| **Saxophone** | Sample-based + distortion | [ToneJS Saxophone](https://nbrosowsky.github.io/tonejs-instruments/samples/saxophone/) | Saxophone range | 1.5s | Reverb | Low-Mid (300-600Hz) | ✅ **ENABLED** |
| **Oboe** | Complex formants + reed simulation | [ToneJS Oboe](https://nbrosowsky.github.io/tonejs-instruments/samples/oboe/) | Bb3-F5 (oboe range) | 2.2s | Reed simulation, Formants | High-Mid (800-1200Hz) | Disabled |

**Notes**: 
- Breathy pure tone with noise texture for flute
- Characteristic hollow clarinet sound
- Rich saxophone timbre with reed character
- Double reed character with nasal quality for oboe

---

## 🥁 Percussion Family (4 Instruments)

| Instrument | Synthesis | Source | Sample Range | Release | Effects | Frequency | Status |
|------------|-----------|--------|--------------|---------|---------|-----------|--------|
| **Timpani** | Sine burst + pitch bending | [ToneJS Timpani](https://nbrosowsky.github.io/tonejs-instruments/samples/timpani/) | Timpani range | 3.5s | Pitch bending, Hall acoustics | Low (100-200Hz) | Disabled |
| **Xylophone** | Triangle waves + sharp attack | [ToneJS Xylophone](https://nbrosowsky.github.io/tonejs-instruments/samples/xylophone/) | Mallet range | 0.8s | Sharp attack, Wooden resonance | Very High (1400-1600Hz) | Disabled |
| **Vibraphone** | Sine waves + tremolo | [ToneJS Vibraphone](https://nbrosowsky.github.io/tonejs-instruments/samples/vibraphone/) | Vibraphone range | 4.0s | Tremolo motor, Metallic shimmer | High (1000-1400Hz) | Disabled |
| **Gongs** | Noise burst + long decay | [ToneJS Gongs](https://nbrosowsky.github.io/tonejs-instruments/samples/gongs/) | Various gong sizes | 8.0s | Sustained crash, Metallic resonance | Very Low (<100Hz) | Disabled |

**Notes**: 
- Tuned drums with dynamic pitch control for timpani
- Bright mallet percussion for xylophone
- Characteristic vibraphone tremolo effect
- Long-sustaining metallic crashes for gongs

---

## 🌟 Electronic Family (4 Instruments)

| Instrument | Synthesis | Source | Sample Range | Release | Effects | Frequency | Status |
|------------|-----------|--------|--------------|---------|---------|-----------|--------|
| **Pad** | Sample-based synthetic textures | [ToneJS Synth Pad](https://nbrosowsky.github.io/tonejs-instruments/samples/synth-pad/) | C1-C6 (11 samples) | 5.0s | Reverb, Filter | Mid-Low (200-400Hz) | Default |
| **Lead Synth** | Sawtooth + filter + resonance | [ToneJS Synth Lead](https://nbrosowsky.github.io/tonejs-instruments/samples/synth-lead/) | C2-C6 (5 samples) | 0.2s | Filter modulation, Distortion, Delay | Variable (200-8000Hz) | Disabled |
| **Bass Synth** | Square waves + sub-oscillator | [ToneJS Synth Bass](https://nbrosowsky.github.io/tonejs-instruments/samples/synth-bass/) | C1-C3 (5 samples) | 0.5s | Filter, Compressor | Low (100-200Hz) | Disabled |
| **Arp Synth** | Various waves + envelope + sequencer | [ToneJS Synth Arp](https://nbrosowsky.github.io/tonejs-instruments/samples/synth-arp/) | C3-C6 (4 samples) | 0.1s | Filter, Delay, Reverb | Variable (Pattern-dependent) | Disabled |

**Notes**: 
- Ambient synthetic sustained textures for pad
- Cutting synthesizer lead with filter sweeps
- Electronic bass foundation with sub-bass
- Sequenced patterns with graph synchronization for arp

---

## 🌊 Environmental Family (1 Instrument)

### Whale Song (Humpback)

| Property | Details |
|----------|---------|
| **Synthesis** | Public domain scientific recordings + oceanic effects processing |
| **Primary Source** | [NOAA Whale Song (Internet Archive)](https://archive.org/download/WhaleSong_928/whale_song.mp3) |
| **Secondary Source** | [National Park Service Humpback Recordings](https://archive.org/details/HumpbackWhalesSongsSoundsVocalizations) |
| **Sample Configuration** | C1-F3 (8 samples across whale vocal range) |
| **Release Time** | 12.0s (ultra-long sustains) |
| **Effects** | Deep reverb (8.0s decay), ultra-slow chorus (0.3Hz), oceanic filtering |
| **Frequency Range** | Low-Mid (20-1000Hz) - Wide spectrum natural sounds |
| **Status** | Disabled by default |

**Sample Sources**:

| Source | Type | License | Quality | URL |
|--------|------|---------|---------|-----|
| **NOAA Whale Song** | Scientific recording | Public Domain (U.S. Federal Government) | 9.0M MP3, High quality | https://archive.org/download/WhaleSong_928/ |
| **NPS Humpback Songs** | Hydrophone recordings | Public Domain (U.S. Federal Government) | Multiple recordings, Glacier Bay, Alaska | https://archive.org/details/HumpbackWhalesSongsSoundsVocalizations |
| **Ocean Alliance Library** | Marine mammal sounds | Scientific archive | 2,400+ recordings (1950s-1990s) | https://whale.org/whale-acoustic-library/ |
| **Watkins Collection** | Historical recordings | Scientific research | 7 decades of recordings | https://cis.whoi.edu/science/B/whalesounds/ |

**Current Implementation**:
- **Synthesis Mode**: Environmental sounds use FM synthesis when samples are not available
- **Sample Mode**: When sample downloading feature is implemented, authentic NOAA recordings will be used
- **Effects Processing**: Specialized oceanic effects (8.0s reverb, ultra-slow chorus, underwater filtering)
- **Musical Integration**: Single whale recording mapped to multiple pitches for musical use

**Technical Notes**:
- Authentic humpback whale calls with specialized underwater acoustics processing
- Bass calls with squeals from NOAA scientific recordings
- Hydrophone recordings from Glacier Bay National Park monitoring
- All sources are explicitly public domain (U.S. federal government works)

---

## Technical Implementation Details

### Sample Format Support

| Format | Usage | Notes |
|--------|-------|-------|
| **MP3** | Primary | Optimized for web delivery |
| **WAV** | Fallback | When specified for higher quality |
| **OGG** | Alternative | Browser compatibility |
| **Format Selection** | Configurable | Via `audioFormat` setting |

### Effects Processing

| Effect Type | Parameters | Application |
|-------------|------------|-------------|
| **Reverb** | Decay, pre-delay, wet/dry mix | All acoustic instruments |
| **Chorus** | Frequency, depth, delay time, feedback | Sustained instruments |
| **Filter** | Frequency, Q factor, type (lowpass/highpass/bandpass) | Synthesizers and tonal shaping |

### Performance Optimization

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| **Voice Limiting** | Configurable max voices per instrument (4-8) | Prevents CPU overload |
| **Lazy Loading** | Samples loaded on-demand | Faster initial load |
| **Memory Management** | Automatic cleanup of unused buffers | Optimal RAM usage |

### Quality Assurance

| Aspect | Standard | Verification |
|--------|----------|-------------|
| **Source Verification** | All URLs tested | Regular validation |
| **Latency Testing** | Sub-50ms response | Real-time performance |
| **Cross-Platform** | Windows, macOS, Linux | Multi-OS testing |
| **Browser Compatibility** | Chrome, Firefox, Safari, Edge | Universal support |

---

## External Dependencies

### Primary Sample Libraries

| Library | Purpose | Coverage | Quality |
|---------|---------|----------|---------|
| **[ToneJS Instruments](https://nbrosowsky.github.io/tonejs-instruments/)** | Comprehensive orchestral samples | 25+ instruments | High-quality, consistent formatting |
| **[Tone.js Salamander Piano](https://tonejs.github.io/audio/salamander/)** | Professional grand piano | Full 88-key range | Industry-standard quality |
| **[Internet Archive - NOAA](https://archive.org/details/WhaleSong_928)** | Scientific whale recordings | Environmental sounds | Research-grade, public domain |
| **[National Park Service](https://archive.org/details/HumpbackWhalesSongsSoundsVocalizations)** | Natural sound monitoring | Hydrophone recordings | Scientific accuracy |

### Scientific Audio Archives

| Archive | Institution | Content | Access |
|---------|-------------|---------|---------|
| **Ocean Alliance** | Marine research | 2,400+ whale recordings | Scientific community |
| **Watkins Collection** | Woods Hole Oceanographic | 7 decades of recordings | Research archive |
| **Discovery of Sound in the Sea** | University partnerships | Marine acoustics gallery | Educational access |

### Synthesis Engine

| Component | Version | Features |
|-----------|---------|----------|
| **Tone.js** | 14.x+ compatible | Real-time synthesis, effects, sample playback |
| **Web Audio API** | Browser native | Low-latency audio processing |
| **ESM Modules** | Modern standards | Optimized loading and tree-shaking |

---

## Future Expansion Considerations

### Phase 9+ Instrument Sources

| Category | Potential Sources | Implementation |
|----------|------------------|----------------|
| **AI-Generated Samples** | Machine learning synthesis | Custom neural models |
| **User Sample Upload** | Custom library support | Local storage integration |
| **Regional Instruments** | World music expansion | Ethnomusicology archives |
| **Extended Environmental** | Natural soundscapes | Field recording libraries |

### Source Quality Improvements

| Enhancement | Target | Benefit |
|-------------|--------|---------|
| **Higher Sample Rates** | 48kHz/96kHz support | Audiophile quality |
| **Extended Range** | More sample points | Smoother interpolation |
| **Dynamic Samples** | Velocity-sensitive layers | Expressive performance |
| **Articulation Variants** | Multiple techniques | Realistic playing styles |

### Sample Management System

| Feature | Purpose | Timeline |
|---------|---------|----------|
| **Download Manager** | Optional sample downloading | Phase 10 |
| **Quality Selection** | MP3/WAV/OGG choice | Phase 10 |
| **Cache Management** | Storage optimization | Phase 10 |
| **Offline Support** | Local sample storage | Phase 10 |

---

**Document Maintained By**: Sonigraph Development Team  
**Source Verification Date**: June 17, 2025  
**Next Review**: Phase 9 Implementation
