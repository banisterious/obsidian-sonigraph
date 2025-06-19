# Sonigraph Instruments Catalog

**Purpose**: Comprehensive specifications for all Sonigraph instruments  
**Audience**: Developers, contributors, and detailed planning  
**Last Updated**: 2025-06-19

## Table of Contents

- [1. Current Instruments (34 Instruments)](#1-current-instruments-34-instruments)
  - [1.1. Complete Orchestral System](#11-complete-orchestral-system)
  - [1.2. Frequency Range Distribution](#12-frequency-range-distribution)
  - [1.3. Implementation Approaches by Family](#13-implementation-approaches-by-family)
- [2. Future Expansion Plans (55+ Instruments)](#2-future-expansion-plans-55-instruments)
  - [2.1. Natural Soundscapes](#21-natural-soundscapes)
  - [2.2. Advanced Features](#22-advanced-features)

---

## 1. Current Instruments (34 Instruments)

### 1.1. Complete Orchestral System

| Family | Instrument | Status | Synthesis Approach | Frequency Range | Key Features | Default |
|--------|------------|--------|-------------------|----------------|-------------|---------|
| **🎤 Vocal** | Choir | ✅ Complete | Sample-based + reverb | High (1000-1400Hz) | Layered SATB voices | ✅ Enabled |
| | Vocal Pads | ✅ Complete | Sample-based + formant filtering | Mid-High (600-1000Hz) | Ethereal sustained textures | ✅ Enabled |
| | Soprano | ✅ Complete | Sample-based + formant filtering | High-Mid (800-1200Hz) | High female voice | Disabled |
| | Alto | ✅ Complete | Sample-based + breath noise | High (1000-1400Hz) | Lower female voice | Disabled |
| | Tenor | ✅ Complete | Sample-based + vocal expression | Mid-High (600-1000Hz) | High male voice | Disabled |
| | Bass | ✅ Complete | Sample-based + chest resonance | Very Low (<100Hz) | Low male voice | Disabled |
| **🎹 Keyboard** | Piano | ✅ Complete | Sample-based | Very High (1400-1600Hz) | Acoustic piano dynamics | ✅ Enabled |
| | Organ | ✅ Complete | Additive synthesis | Mid (400-800Hz) | Hammond-style drawbars | ✅ Enabled |
| | Electric Piano | ✅ Complete | AM + tremolo | Mid-Low (200-400Hz) | Rhodes/Wurlitzer character | Disabled |
| | Harpsichord | ✅ Complete | Sharp envelope + filtering | Low-Mid (300-600Hz) | Baroque plucked attack | Disabled |
| | Accordion | ✅ Complete | AM + vibrato | Mid (400-800Hz) | Bellows breath simulation | Disabled |
| | Celesta | ✅ Complete | Triangle + decay | Very High (1400-1600Hz) | Bell-like ethereal tones | Disabled |
| **🎻 Strings** | Strings | ✅ Complete | Sample-based | Low (100-200Hz) | Orchestral string ensemble | ✅ Enabled |
| | Violin | ✅ Complete | Sawtooth + filter sweeps | High-Mid (800-1200Hz) | Bowed texture, vibrato | Disabled |
| | Cello | ✅ Complete | Complex harmonics + bow noise | Mid-Low (200-400Hz) | Rich low harmonics | Disabled |
| | Guitar | ✅ Complete | Karplus-Strong synthesis | Mid-High (600-1000Hz) | Plucked/strummed articulation | Disabled |
| | Harp | ✅ Complete | Pluck + long decay | Low (100-200Hz) | Cascading arpeggios | Disabled |
| **🎺 Brass** | Trumpet | ✅ Complete | Square + brass formants | Low-Mid (300-600Hz) | Bright attack, brass timbre | Disabled |
| | French Horn | ✅ Complete | Sine + slight distortion | Mid (400-800Hz) | Warm middle register | Disabled |
| | Trombone | ✅ Complete | Sawtooth + portamento | Mid-Low (200-400Hz) | Sliding pitch capability | Disabled |
| | Tuba | ✅ Complete | Sub-bass + breath | Very Low (<100Hz) | Deep foundation, breath noise | Disabled |
| **🎷 Woodwinds** | Flute | ✅ Complete | Sample-based + noise | Ultra-High (>1600Hz) | Breathy pure tone | Disabled |
| | Clarinet | ✅ Complete | Sample-based + odd harmonics | High-Mid (800-1200Hz) | Hollow timbre | Disabled |
| | Saxophone | ✅ Complete | Sample-based + distortion | Low-Mid (300-600Hz) | Reedy richness | Disabled |
| | Oboe | ✅ Complete | Complex formants + reed simulation | High-Mid (800-1200Hz) | Nasal quality, double reed | Disabled |
| **🥁 Percussion** | Timpani | ✅ Complete | Sine burst + pitch bend | Low (100-200Hz) | Tuned drums, pitch bending | Disabled |
| | Xylophone | ✅ Complete | Triangle + sharp attack | Very High (1400-1600Hz) | Mallet percussion, bright attack | Disabled |
| | Vibraphone | ✅ Complete | Sine + tremolo | High (1000-1400Hz) | Metallic shimmer, tremolo | Disabled |
| | Gongs | ✅ Complete | Noise burst + long decay | Very Low (<100Hz) | Sustained crash, metallic resonance | Disabled |
| **🌟 Electronic** | Pad | ✅ Complete | Sample-based | Mid-Low (200-400Hz) | Ambient synthetic textures | ✅ Enabled |
| | Lead Synth | ✅ Complete | Sawtooth + filter + resonance | Variable (200-8000Hz) | Cutting synth, filter modulation | Disabled |
| | Bass Synth | ✅ Complete | Square + sub-oscillator | Low (100-200Hz) | Electronic foundation | Disabled |
| | Arp Synth | ✅ Complete | Various waves + envelope + sequencer | Variable (Pattern-dependent) | Sequenced patterns, graph-synced | Disabled |
| **🌊 Environmental** | Whale Song | ✅ Complete | Scientific recordings + oceanic effects | Low-Mid (20-1000Hz) | Humpback whale calls, underwater acoustics | ✅ Enabled |

### 1.2. Frequency Range Distribution

**Current Implementation (34 Instruments):**
- **Ultra-High (>1600Hz)**: Flute, Piccolo effects
- **Very High (1400-1600Hz)**: Piano treble, Celesta, Xylophone
- **High-Mid (800-1200Hz)**: Clarinet, Violin, Soprano, Oboe  
- **High (1000-1400Hz)**: Choir blend, Alto, Vibraphone
- **Mid-High (600-1000Hz)**: Vocal Pads, Guitar, Tenor
- **Mid (400-800Hz)**: Organ, French Horn, Accordion
- **Low-Mid (300-600Hz)**: Saxophone, Trumpet, Harpsichord
- **Mid-Low (200-400Hz)**: Pad, Cello, Trombone, Electric Piano
- **Low (100-200Hz)**: Strings, Harp, Timpani, Bass synth
- **Very Low (<100Hz)**: Tuba, Bass vocal, Gongs, Lead synth fundamentals
- **Environmental (20-1000Hz)**: Whale Song - Wide spectrum natural sounds

### 1.3. Implementation Approaches by Family

**🎤 Vocal Family**
- **Core Technology**: Formant filtering for vowel sounds, breath noise mixing
- **Expression Systems**: Vibrato/tremolo, dynamic formant shifting
- **Graph Integration**: Formant shifts based on graph relationships
- **Sample Sources**: High-quality vocal recordings with acoustic processing

**🎹 Keyboard Family**
- **Synthesis Techniques**: AM/FM synthesis, additive harmonics
- **Articulation Models**: Instrument-specific envelopes and modulation
- **Authentic Character**: Historical instrument emulation (Hammond, Rhodes, Baroque)
- **Performance Features**: Velocity sensitivity, sustained textures

**🎻 Strings Family**
- **Modeling Approach**: Advanced string physics, bowing/plucking simulation
- **Synthesis Methods**: Karplus-Strong synthesis, filter sweeps
- **Realistic Elements**: Bow noise, resonance, vibrato
- **Ensemble Features**: Individual sections with orchestral blend

**🎺 Brass Family**
- **Timbre Generation**: Brass formant filtering for metallic character
- **Performance Techniques**: Breath/valve noise, mute effects
- **Dynamic Response**: Attack envelopes, articulation systems
- **Range Coverage**: Complete brass choir from Tuba to Trumpet

**🎷 Woodwinds Family**
- **Reed Simulation**: Authentic breath noise integration
- **Formant Processing**: Woodwind-specific harmonic content
- **Character Definition**: Hollow (Clarinet), reedy (Saxophone), pure (Flute)
- **Extended Techniques**: Breathy textures, overtone emphasis

**🥁 Percussion Family**
- **Physics Modeling**: Transient-focused synthesis, pitch bending
- **Material Simulation**: Metallic resonance, wood characteristics
- **Temporal Features**: Sharp attacks, complex decay patterns
- **Specialized Processing**: Timpani pitch control, vibraphone tremolo

**🌟 Electronic Family**
- **Analog Emulation**: Classic synthesis techniques
- **Modulation Systems**: Filter sweeps, LFO control, envelope shaping
- **Creative Features**: Sequencer integration, pattern generation
- **Professional Quality**: Studio-grade electronic sound design

**🌊 Environmental Family**
- **Scientific Accuracy**: Authentic natural sound recordings
- **Specialized Processing**: Oceanic effects, ultra-long sustains
- **Frequency Coverage**: Wide-spectrum natural soundscapes
- **Acoustic Modeling**: Environmental acoustics and spatial processing

---

## 2. Future Expansion Plans (55+ Instruments)

### 2.1. Natural Soundscapes

**Animal Sounds Collection**:
- **Birds** (800-3000Hz): Dawn chorus, songbirds, birds of prey
- **Mammals**: Cats (400-2000Hz), Dogs (200-1500Hz), Wolves (100-800Hz)
- **Marine Life**: Dolphins (1000-8000Hz), additional whale species
- **Large Animals**: Elephants (5-200Hz), Big Cats (50-600Hz), Bears (80-400Hz)

**Environmental Atmospheres**:
- **Weather**: Rain (20-8000Hz), Wind (200-6000Hz), Thunder (10-200Hz)
- **Natural Elements**: Ocean Waves (20-4000Hz), Fire (100-6000Hz)
- **Insects**: Crickets (2000-8000Hz), Bees (200-4000Hz), Frogs (300-2000Hz)

**Experimental & World Instruments**:
- **Electronic**: Theremin (50-4000Hz), Mechanical (50-2000Hz), Cosmic (10-8000Hz)
- **Acoustic**: Glass Harmonics (400-4000Hz), Singing Bowls (200-3000Hz)
- **Cultural**: Didgeridoo (30-300Hz), Hang Drum (200-1000Hz), Kalimba (400-2000Hz)

### 2.2. Advanced Features

- **Sample Manager**: Comprehensive sample management with storage control
- **Audio Export**: Multi-format export (MP3, WAV, OGG, MIDI)
- **Cloud Integration**: Direct upload to SoundCloud, YouTube, cloud storage
- **Timeline Integration**: Synchronized graph timeline and audio playback
- **Content Filtering**: Folder/file exclusion, pattern-based filtering
- **AI Orchestration**: Machine learning for intelligent instrument assignment

---

*This catalog serves as the comprehensive reference for all Sonigraph instruments and specifications. For strategic planning and development priorities, see [Development Roadmap](development-roadmap.md) and [Feature Catalog](feature-catalog.md).*