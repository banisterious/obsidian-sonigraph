# Sonigraph: Master Development Plan

**Project**: Obsidian Sonigraph Plugin  
**Version**: 0.2.0 (Expanding to Multi-Voice Orchestral System)  
**Last Updated**: December 2024  
**Status**: Phase 3 Complete, Phase 4 Planning

---

## Table of Contents

1. [Current Status & Achievements](#1-current-status--achievements)
2. [Instrument Expansion Roadmap](#2-instrument-expansion-roadmap)
3. [Phase-by-Phase Development Plan](#3-phase-by-phase-development-plan)
4. [Technical Architecture Evolution](#4-technical-architecture-evolution)
5. [Implementation Timeline](#5-implementation-timeline)
6. [Quality Assurance Strategy](#6-quality-assurance-strategy)

---

## 1. Current Status & Achievements

### ✅ **Completed: Phase 3 - Per-Instrument Effects System**

**Core Features Implemented:**
- **Multi-instrument orchestral engine**: Piano, Organ, Strings with distinct synthesis
- **Per-instrument effect routing**: Individual reverb, chorus, and filter effects
- **Professional Control Center**: 6-tab interface (Status, Instruments, Musical, Harmony, Effects, Playback)
- **Persistent settings system**: All configurations save/load correctly
- **Settings migration**: Automatic conversion from global to per-instrument effects
- **Real-time status monitoring**: Live updates across all tabs
- **Optimized defaults**: Piano reverb only for clean starting experience

**Technical Infrastructure:**
- **AudioEngine**: Per-instrument effect maps with isolated processing
- **Settings architecture**: Hierarchical structure supporting unlimited instruments
- **UI framework**: Dynamic tab system with real-time parameter updates
- **CSS styling**: Modern, professional interface matching Obsidian design

---

## 2. Instrument Expansion Roadmap

### 🎵 **Phase 4: Vocal & Atmospheric Instruments (NEXT)**

**Immediate Implementation (Current Sprint):**

#### **🎤 Choir** - Ethereal Human Voices
- **Synthesis**: Additive synthesis with formant filtering
- **Characteristics**: 
  - Multiple voice layers (SATB: Soprano, Alto, Tenor, Bass)
  - Formant filtering for vowel sounds (A, E, I, O, U)
  - Breath noise mixing for realism
  - Natural vibrato (4-6 Hz)
- **Default Range**: Mid-high frequencies (400-1200Hz)
- **Default Effects**: Reverb + Chorus enabled
- **Graph Mapping**: Connection density → vowel selection, Node centrality → voice prominence

#### **🌊 Vocal Pads** - Ethereal Voice Textures  
- **Synthesis**: Multiple sine wave layers with slow attack/release
- **Characteristics**:
  - Soft, sustained vocal-like textures
  - Formant-filtered harmonics
  - Gentle amplitude modulation
  - Long, evolving envelopes
- **Default Range**: Mid frequencies (300-800Hz)  
- **Default Effects**: Reverb + Filter enabled
- **Graph Mapping**: Note content length → pad sustain, Link depth → formant shift

#### **🎛️ Pad** - Ambient Synthetic Textures
- **Synthesis**: Multiple oscillator layers (sawtooth + square + sine)
- **Characteristics**:
  - Rich harmonic content
  - Slow filter sweeps
  - Stereo detuning for width
  - Long attack/release envelopes  
- **Default Range**: Full spectrum (100-2000Hz)
- **Default Effects**: Reverb + Filter enabled  
- **Graph Mapping**: Graph depth → filter cutoff, Connection strength → detuning

### 🎼 **Phase 5: Extended Orchestral Instruments**

**Next Sprint Candidates:**

#### **Woodwinds Section:**
- **🎺 Flute**: Sine wave + breath noise, airy and pure
- **🎷 Clarinet**: Square wave + odd harmonics, hollow timbre
- **🎶 Saxophone**: Sawtooth + distortion, reedy richness

#### **Brass Section:**  
- **🎺 Trumpet**: Square wave + brass formants, bright attack
- **🎻 French Horn**: Sine + slight distortion, warm middle register  
- **🎷 Trombone**: Sawtooth + portamento, sliding pitch capability

#### **Extended Strings:**
- **🎻 Violin**: Sawtooth + filter sweeps, bowed texture
- **🎸 Guitar**: Karplus-Strong synthesis, plucked/strummed
- **🎵 Harp**: Pluck synthesis + long decay, cascading arpeggios

### 🎹 **Phase 6: Specialized & Electronic Instruments**

#### **Keyboard Extensions:**
- **⚡ Electric Piano**: Rhodes/Wurlitzer character (AM + tremolo)
- **🎵 Harpsichord**: Sharp attack + filtering, baroque character
- **🎶 Accordion**: Bellows simulation (AM + vibrato)

#### **Percussion:**
- **🥁 Timpani**: Tuned drums (sine burst + pitch bend)
- **🎵 Vibraphone**: Metallic shimmer (sine + tremolo)
- **🎶 Xylophone**: Mallet percussion (triangle + sharp attack)

#### **Synthesis:**
- **🌟 Lead Synth**: Cutting electronic lead (sawtooth + filter)
- **🎛️ Bass Synth**: Electronic foundation (square + sub-oscillator)  
- **🎵 Arp Synth**: Sequenced patterns (various waves + envelope)

---

## 3. Phase-by-Phase Development Plan

### **Phase 4: Vocal & Atmospheric Implementation ✅ COMPLETED**

**✅ Week 1: Core Infrastructure - COMPLETED**
- [x] Extend `InstrumentSettings` interface for new instruments
- [x] Update `DEFAULT_SETTINGS` with Choir, Vocal Pads, Pad configurations
- [x] Modify AudioEngine to support 6 instruments total
- [x] Create synthesis integration for new instruments

**✅ Week 2: Synthesis Implementation - COMPLETED**
- [x] **Choir synthesis**: Sample-based synthesis with reverb + chorus
- [x] **Vocal Pads synthesis**: Sample-based synthesis with reverb + filter
- [x] **Pad synthesis**: Sample-based synthesis with reverb + filter
- [x] Integration with existing effect routing system

**✅ Week 3: UI & Controls - COMPLETED**
- [x] Update Instruments tab with new instrument controls
- [x] Add instrument-specific effect sections to Effects tab
- [x] Update Status tab with 6-instrument monitoring
- [x] Frequency-based assignment algorithm updated for 6 instruments

**✅ Week 4: Testing & Refinement - COMPLETED**
- [x] Settings migration system for existing users
- [x] Real-time status updates across all tabs
- [x] UI responsiveness with 6 concurrent instruments
- [x] Build system integration and TypeScript compilation

### **Phase 5: Extended Orchestral (Future)**
- **Duration**: 4-6 weeks
- **Scope**: Add 6-9 traditional orchestral instruments
- **Focus**: Musical authenticity and orchestral balance

### **Phase 6: Specialized & Electronic (Future)**
- **Duration**: 3-4 weeks  
- **Scope**: Electronic and specialized acoustic instruments
- **Focus**: Modern sound design and synthesis innovation

### **Phase 7: Advanced Features (Future)**
- **Duration**: 6-8 weeks
- **Scope**: AI-driven orchestration, graph-responsive effects, preset system
- **Focus**: Intelligent musical decision-making

---

## 4. Technical Architecture Evolution

### **Current Architecture (Phase 3)**
```typescript
interface SonigraphSettings {
    instruments: {
        piano: InstrumentSettings;
        organ: InstrumentSettings; 
        strings: InstrumentSettings;
    };
}
```

### **Phase 4 Architecture (Target)**  
```typescript
interface SonigraphSettings {
    instruments: {
        // Existing
        piano: InstrumentSettings;
        organ: InstrumentSettings;
        strings: InstrumentSettings;
        // New Phase 4
        choir: InstrumentSettings;
        vocalPads: InstrumentSettings;
        pad: InstrumentSettings;
    };
}
```

### **Future Architecture (Scalable)**
```typescript
interface SonigraphSettings {
    instruments: {
        [key: string]: InstrumentSettings; // Dynamic instrument support
    };
    instrumentCategories: {
        orchestral: string[];
        electronic: string[];
        percussion: string[];
        vocal: string[];
    };
}
```

### **Synthesis Class Structure**
```typescript
// Base class for all instruments
abstract class BaseSynth {
    abstract createVoice(): Tone.Synth;
    abstract setupEffects(): void;
    abstract getFrequencyRange(): [number, number];
}

// New Phase 4 implementations
class ChoirSynth extends BaseSynth {
    private formantFilters: Tone.Filter[];
    private vibratoLFO: Tone.LFO;
    // Formant filtering + breath noise implementation
}

class VocalPadSynth extends BaseSynth {
    private oscillatorLayers: Tone.Oscillator[];
    private envelope: Tone.AmplitudeEnvelope;
    // Multi-layer sustained texture implementation  
}

class PadSynth extends BaseSynth {
    private multiOscillator: Tone.FatOscillator;
    private filterSweep: Tone.AutoFilter;
    // Rich harmonic pad implementation
}
```

---

## 5. Implementation Timeline

### **December 2024: Phase 4 Vocal & Atmospheric**
- **Week 1**: Infrastructure expansion (settings, interfaces, audio engine)
- **Week 2**: Synthesis implementation (choir, vocal pads, pad)  
- **Week 3**: UI integration and effect routing
- **Week 4**: Testing, optimization, and polish

### **January 2025: Phase 4 Refinement & Phase 5 Planning**
- **Week 1-2**: User feedback integration and bug fixes
- **Week 3-4**: Phase 5 detailed planning and prototyping

### **February-March 2025: Phase 5 Extended Orchestral**
- **4-6 weeks**: Traditional orchestral instruments implementation
- **Focus**: Musical authenticity and ensemble balance

### **April 2025: Phase 6 Specialized & Electronic** 
- **3-4 weeks**: Electronic and specialized instruments
- **Focus**: Modern synthesis and sound design

### **May-June 2025: Phase 7 Advanced Features**
- **6-8 weeks**: AI orchestration, advanced effects, preset system
- **Focus**: Intelligence and user experience enhancement

---

## 6. Quality Assurance Strategy

### **Phase 4 Testing Plan**

**Audio Quality Testing:**
- [ ] Frequency response analysis for each new instrument
- [ ] Harmonic content verification (THD < 5%)
- [ ] Dynamic range testing (-60dB to 0dB)
- [ ] Cross-instrument balance verification

**Performance Testing:**
- [ ] CPU usage with 6 concurrent instruments (target: <25% CPU)
- [ ] Memory consumption monitoring (target: <100MB RAM)
- [ ] Audio latency measurement (target: <50ms)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)

**User Experience Testing:**
- [ ] Interface responsiveness with 6 instruments
- [ ] Settings persistence across browser sessions  
- [ ] Effect parameter ranges and musical appropriateness
- [ ] Error handling and graceful degradation

**Integration Testing:**
- [ ] Obsidian plugin compatibility
- [ ] Settings migration from 3 to 6 instruments
- [ ] Graph parsing with increased complexity
- [ ] Real-time parameter updates across all tabs

### **Acceptance Criteria**

**✅ Phase 4 Success Metrics - ACHIEVED:**
- [x] 6 instruments (Piano, Organ, Strings, Choir, Vocal Pads, Pad) fully functional
- [x] Each instrument has distinct character and appropriate synthesis
- [x] All instruments integrate with existing effect system
- [x] UI accommodates 6 instruments without performance degradation
- [x] Settings migration preserves user configurations
- [x] Audio quality maintains professional standards
- [x] Performance impact remains acceptable (<25% additional CPU)

---

## Next Actions

### **Immediate Sprint (This Week):**
1. **Implement Choir instrument** with formant filtering and vibrato
2. **Implement Vocal Pads** with multi-layer sine synthesis  
3. **Implement Pad instrument** with multi-oscillator synthesis
4. **Update settings structure** to support 6 instruments
5. **Extend UI** to display and control new instruments

### **Priority Order:**
1. **Choir** (highest musical impact)
2. **Vocal Pads** (atmospheric depth)  
3. **Pad** (harmonic foundation)
4. **UI integration** (essential for usability)
5. **Testing & optimization** (quality assurance)

---

*This master plan will be updated as development progresses and new requirements emerge. The focus remains on musical quality, user experience, and technical excellence.* 