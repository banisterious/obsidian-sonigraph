# Sonigraph: Master Development Plan

**Project**: Obsidian Sonigraph Plugin  
**Version**: 0.2.0 (Expanding to Multi-Voice Orchestral System)  
**Status**: Phase 4 Complete, Phase 5 Planning

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

### 🎵 **Current Status: 9 Instruments Implemented**

**✅ Phase 4: Vocal & Atmospheric - COMPLETED**
- **🎤 Choir**: Layered voices (sample-based synthesis + reverb)
- **🌊 Vocal Pads**: Ethereal voice textures (sample-based synthesis + formant filtering)
- **🎛️ Pad**: Ambient synthetic textures (sample-based synthesis + filter sweeps)

**✅ Phase 5: Woodwinds Section - COMPLETED**
- **🎺 Flute**: Breathy pure tone (sample-based synthesis + noise)
- **🎵 Clarinet**: Hollow timbre (sample-based synthesis + odd harmonics)
- **🎷 Saxophone**: Reedy richness (sample-based synthesis + distortion)

**✅ Foundation Instruments (Phase 1-3) - COMPLETED**
- **🎹 Piano**: Acoustic piano (sample-based synthesis)
- **🎹 Organ**: Hammond-style organ (additive synthesis)
- **🎻 Strings**: Orchestral strings (sample-based synthesis)

---

### 🎼 **Complete Orchestral Vision: 31 Total Instruments**

#### **🎤 Vocal Instruments (6 total - 2 implemented, 4 remaining)**

**✅ Implemented:**
- **Choir** - Layered voices (Multiple oscillators + reverb)
- **Vocal Pads** - Ethereal voice textures (Additive synthesis)

**🔄 Phase 6A: Individual Vocal Sections (4 remaining)**
- **Soprano** - High female voice (AM synthesis + formant filtering)
- **Alto** - Lower female voice (Rich harmonics + breath noise)
- **Tenor** - High male voice (FM synthesis + vocal fry)
- **Bass** - Low male voice (Sub-harmonics + chest resonance)

*Voice implementation approach:*
- Formant filtering for vowel sounds (A, E, I, O, U)
- Breath noise mixed with tonal content for realism
- Vibrato/tremolo for natural expression
- Different vocal ranges mapped to graph frequency bands
- Dynamic formant shifting based on graph relationships

#### **🎹 Keyboard Instruments (5 total - 1 implemented, 4 remaining)**

**✅ Implemented:**
- **Piano** - Acoustic piano (sample-based synthesis)

**🔄 Phase 6B: Extended Keyboard Family (4 remaining)**
- **Electric Piano** - Rhodes/Wurlitzer (AM synthesis + tremolo)
- **Harpsichord** - Plucked attack (Sharp envelope + filtering)
- **Accordion** - Bellows breath (AM synthesis + vibrato)
- **Celesta** - Bell-like piano (Triangle wave + decay)

#### **🎻 String Instruments (5 total - 1 implemented, 4 remaining)**

**✅ Implemented:**
- **Strings** - Orchestral strings (sample-based synthesis)

**🔄 Phase 7A: Individual String Sections (4 remaining)**
- **Violin** - Bowed texture (Sawtooth + filter sweeps)
- **Cello** - Rich lows (Complex harmonics + bow noise)
- **Guitar** - Plucked/strummed (Karplus-Strong synthesis)
- **Harp** - Cascading arpeggios (Pluck synthesis + long decay)

#### **🎺 Brass Instruments (4 total - 0 implemented, 4 remaining)**

**🔄 Phase 7B: Complete Brass Section (4 remaining)**
- **Trumpet** - Bright attack (Square wave + brass formants)
- **French Horn** - Warm middle (Sine wave + slight distortion)
- **Trombone** - Sliding pitch (Sawtooth + portamento)
- **Tuba** - Deep foundation (Sub-bass + breath)

*Brass implementation approach:*
- Brass formant filtering for metallic timbre
- Dynamic attack envelopes for different playing styles
- Breath noise and valve noise for realism
- Mute effects and brass-specific articulations
- Range-appropriate frequency mapping

#### **🎷 Woodwinds (4 total - 3 implemented, 1 remaining)**

**✅ Implemented:**
- **Flute** - Breathy pure tone (sample-based + noise)
- **Clarinet** - Hollow timbre (sample-based + odd harmonics)  
- **Saxophone** - Reedy richness (sample-based + distortion)

**🔄 Phase 5B: Complete Woodwind Section (1 remaining)**
- **Oboe** - Nasal quality (Complex formants + reed simulation)

#### **🥁 Percussion Instruments (4 total - 0 implemented, 4 remaining)**

**🔄 Phase 8A: Tuned Percussion Section (4 remaining)**
- **Timpani** - Tuned drums (Sine burst + pitch bend)
- **Xylophone** - Mallet percussion (Triangle + sharp attack)
- **Vibraphone** - Metallic shimmer (Sine + tremolo)
- **Gongs** - Sustained crash (Noise burst + long decay)

*Percussion implementation approach:*
- Transient-focused synthesis with sharp attacks
- Pitch bending for timpani rolls and effects
- Metallic resonance modeling for mallet instruments
- Noise-based synthesis for unpitched elements
- Dynamic response to graph activity intensity

#### **🌟 Synthetic/Electronic Instruments (4 total - 1 implemented, 3 remaining)**

**✅ Implemented:**
- **Pad** - Ambient textures (sample-based synthesis)

**🔄 Phase 8B: Electronic Synthesis Suite (3 remaining)**
- **Lead** - Cutting synth (Sawtooth + filter + resonance)
- **Bass** - Electronic low-end (Square + sub-oscillator)
- **Arp** - Sequenced patterns (Various waves + envelope + sequencer)

*Electronic implementation approach:*
- Classic analog synthesis techniques (subtractive synthesis)
- Filter modulation and resonance for expressiveness  
- LFO and envelope modulation for movement
- Arpeggiator patterns synchronized to graph traversal
- Modern digital effects processing

---

### 🎯 **Implementation Phases Breakdown**

#### **✅ Phases 1-5: Foundation Complete (9/31 instruments)**
- Core infrastructure established
- Basic orchestral palette functional
- Per-instrument effects system operational
- UI framework scalable to full orchestral scope

#### **🔄 Phase 6: Vocal & Keyboard Extensions (6 new instruments)**
**Target**: 15/31 total instruments
- Individual vocal sections (Soprano, Alto, Tenor, Bass)
- Extended keyboard family (Electric Piano, Harpsichord, Accordion, Celesta)
- Advanced formant synthesis implementation
- Vocal expression and keyboard articulation systems

#### **🔄 Phase 7: Strings & Brass Completion (8 new instruments)**  
**Target**: 23/31 total instruments
- Individual string sections (Violin, Cello, Guitar, Harp)
- Complete brass section (Trumpet, French Horn, Trombone, Tuba) 
- Advanced string modeling and brass formant synthesis
- Articulation systems (bowing, plucking, breath control)

#### **🔄 Phase 8: Percussion & Electronic Finale (8 new instruments)**
**Target**: 31/31 total instruments - **COMPLETE ORCHESTRAL VISION**
- Complete percussion section (Timpani, Xylophone, Vibraphone, Gongs)
- Electronic synthesis suite (Lead, Bass, Arp)
- Final Oboe implementation for complete woodwind section
- Advanced percussion modeling and electronic synthesis

#### **🔄 Phase 9: Orchestral Intelligence & Polish**
- AI-driven orchestration suggestions
- Advanced inter-instrument harmony detection
- Graph-responsive orchestral arrangements
- Master conductor interface for ensemble control
- Professional orchestral templates and presets

---

### 🎼 **Frequency Range Distribution (31 Instruments)**

**Ultra-High (>1600Hz)**: Flute, Piccolo effects
**Very High (1400-1600Hz)**: Piano treble, Celesta, Xylophone
**High-Mid (800-1200Hz)**: Clarinet, Violin, Soprano, Oboe  
**High (1000-1400Hz)**: Choir blend, Alto, Vibraphone
**Mid-High (600-1000Hz)**: Vocal Pads, Guitar, Tenor
**Mid (400-800Hz)**: Organ, French Horn, Accordion
**Low-Mid (300-600Hz)**: Saxophone, Trumpet, Harpsichord
**Mid-Low (200-400Hz)**: Pad, Cello, Trombone, Electric Piano
**Low (100-200Hz)**: Strings, Harp, Timpani, Bass synth
**Very Low (<100Hz)**: Tuba, Bass vocal, Gongs, Lead synth fundamentals

*This distribution ensures optimal frequency separation and prevents masking between instruments while maintaining musical authenticity.*

---

## 3. Phase-by-Phase Development Plan

### **Phase 3 Refinements: Advanced Effects & UX (Identified)**

**Status**: 📋 Identified for Future Implementation  
**Priority**: High Quality-of-Life Improvements  
**Scope**: Enhance existing 6-instrument system with advanced features

#### **1. Effect Presets & Templates**
- **Instrument-specific presets**: "Piano: Concert Hall", "Organ: Cathedral", "Strings: Cinematic"
- **Genre templates**: "Ambient", "Classical", "Electronic", "Jazz", "Rock"
- **One-click reset**: Return to optimal defaults instantly
- **Save/load custom presets**: User-defined effect combinations
- **Preset sharing**: Import/export preset files between users

#### **2. Real-Time Audio Feedback**
- **Parameter preview**: Hear changes as you drag sliders (not just on release)
- **Effect bypass button**: A/B compare with/without effects instantly
- **Visual waveform**: Real-time display showing effect processing
- **CPU usage indicator**: Per-effect performance monitoring
- **Latency monitoring**: Real-time audio latency display

#### **3. Smart Parameter Ranges**
- **Context-aware limits**: Filter frequencies optimized per instrument range
- **Musical parameter mapping**: Reverb "room size" instead of raw decay values
- **Auto-scaling**: Parameters adapt to current tempo/key signatures
- **Intelligent defaults**: Better starting values based on vault content analysis
- **Parameter constraints**: Prevent musically inappropriate settings

#### **4. Enhanced Effect Routing**
- **Effect chain reordering**: Drag-and-drop effect order per instrument
- **Parallel routing**: Split signal for complex textures and processing
- **Cross-instrument routing**: Piano reverb sent to Strings for cohesion
- **Master effect bus**: Global effects affecting final mix output
- **Send/return system**: Flexible routing for creative processing

#### **5. Graph-Responsive Effects**
- **Dynamic modulation**: Effect intensity based on node connections
- **Spatial effects**: Pan/reverb based on graph position and clustering
- **Temporal effects**: Delay time sync'd to graph traversal speed
- **Harmonic effects**: Chorus depth based on note relationships
- **Adaptive processing**: Effects respond to vault structure changes

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

### **Phase 5: Woodwind Completion ✅ COMPLETED**
- **Duration**: 2 weeks (completed)
- **Scope**: Complete woodwind section (Flute, Clarinet, Saxophone) 
- **Achievement**: 9/31 total instruments operational

### **Phase 6: Vocal & Keyboard Extensions (Future)**
- **Duration**: 4-5 weeks
- **Scope**: Individual vocal sections + extended keyboard family (6 new instruments)
- **Target**: 15/31 total instruments
- **Focus**: Advanced formant synthesis and keyboard articulation

### **Phase 7: Strings & Brass Completion (Future)**  
- **Duration**: 5-6 weeks
- **Scope**: Individual strings + complete brass section (8 new instruments)
- **Target**: 23/31 total instruments  
- **Focus**: String modeling and brass formant synthesis

### **Phase 8: Percussion & Electronic Finale (Future)**
- **Duration**: 4-5 weeks
- **Scope**: Complete percussion + electronic synthesis + final Oboe (8 new instruments)
- **Target**: 31/31 total instruments - **COMPLETE ORCHESTRAL VISION**
- **Focus**: Percussion modeling and advanced electronic synthesis

### **Phase 9: Orchestral Intelligence & Polish (Future)**
- **Duration**: 6-8 weeks
- **Scope**: AI orchestration, graph-responsive arrangements, conductor interface
- **Focus**: Intelligent musical decision-making and professional workflow

---

## 4. Technical Architecture Evolution

### **Previous Architecture (Phase 3)**
```typescript
interface SonigraphSettings {
    instruments: {
        piano: InstrumentSettings;
        organ: InstrumentSettings; 
        strings: InstrumentSettings;
    };
}
```

### **Current Architecture (Phase 4 - Implemented)**  
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

### **✅ Phase 4 Vocal & Atmospheric - COMPLETED**
- **Week 1**: ✅ Infrastructure expansion (settings, interfaces, audio engine)
- **Week 2**: ✅ Synthesis implementation (choir, vocal pads, pad)  
- **Week 3**: ✅ UI integration and effect routing
- **Week 4**: ✅ Testing, optimization, and polish

### **✅ Phase 5 Woodwind Completion - COMPLETED**
- **Week 1**: ✅ Woodwind synthesis implementation (flute, clarinet, saxophone)
- **Week 2**: ✅ 9-instrument UI scaling and frequency range optimization

### **Phase 6 Vocal & Keyboard Extensions (Next Priority)**
- **4-5 weeks**: Individual vocal sections + extended keyboard family
- **Target**: 15/31 total instruments (6 new instruments)
- **Focus**: Advanced formant synthesis and keyboard articulation systems

### **Phase 7 Strings & Brass Completion (Future)**
- **5-6 weeks**: Individual strings + complete brass section  
- **Target**: 23/31 total instruments (8 new instruments)
- **Focus**: String modeling, brass formant synthesis, and articulation systems

### **Phase 8 Percussion & Electronic Finale (Future)**
- **4-5 weeks**: Complete percussion + electronic synthesis + final Oboe
- **Target**: 31/31 total instruments - **COMPLETE ORCHESTRAL VISION**
- **Focus**: Percussion modeling and advanced electronic synthesis

### **Phase 9 Orchestral Intelligence & Polish (Future)**
- **6-8 weeks**: AI orchestration, graph-responsive arrangements, conductor interface
- **Focus**: Intelligence, automation, and professional workflow enhancement

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

**✅ Phase 5 Success Metrics - ACHIEVED:**
- [x] 9 instruments total with woodwind section complete (Flute, Clarinet, Saxophone)
- [x] UI successfully scales to 9 instruments across all tabs
- [x] Frequency range distribution optimized for 9-instrument orchestral balance
- [x] Settings migration handles 3→6→9 instrument upgrades seamlessly
- [x] Performance maintains professional standards with increased complexity

### **🎯 Complete Orchestral Vision Success Metrics (31 Total Instruments)**

**Phase 6 Target (15/31 instruments):**
- [ ] Individual vocal sections (Soprano, Alto, Tenor, Bass) with advanced formant synthesis
- [ ] Extended keyboard family (Electric Piano, Harpsichord, Accordion, Celesta) with authentic articulation
- [ ] Advanced formant filtering and breath noise modeling for vocal realism
- [ ] Keyboard-specific synthesis techniques (AM, FM, additive)

**Phase 7 Target (23/31 instruments):**
- [ ] Individual string sections (Violin, Cello, Guitar, Harp) with bowing/plucking simulation
- [ ] Complete brass section (Trumpet, French Horn, Trombone, Tuba) with brass formants
- [ ] Advanced string modeling (Karplus-Strong, filter sweeps, bow noise)
- [ ] Brass articulation systems (muting, breath control, valve noise)

**Phase 8 Target (31/31 instruments - COMPLETE ORCHESTRAL VISION):**
- [ ] Complete percussion section (Timpani, Xylophone, Vibraphone, Gongs) with transient modeling
- [ ] Electronic synthesis suite (Lead, Bass, Arp) with classic analog techniques
- [ ] Final Oboe implementation completing woodwind section
- [ ] Advanced percussion modeling with pitch bending and metallic resonance

---

## Next Actions

### **Phase 6: Vocal & Keyboard Extensions (Next Sprint)**
1. **Individual Vocal Sections**: Soprano, Alto, Tenor, Bass with formant synthesis
2. **Extended Keyboard Family**: Electric Piano, Harpsichord, Accordion, Celesta
3. **Advanced Synthesis**: Formant filtering, AM/FM synthesis, breath noise modeling
4. **UI Scaling**: Support for 15 total instruments
5. **Vocal Expression**: Vowel morphing, vibrato, and natural breath patterns

### **Phase 3 Refinements (Parallel High-Impact UX)**
1. **Effect Presets System** (huge usability improvement for 9+ instruments)
2. **Real-Time Audio Feedback** (professional workflow with large orchestral palette)
3. **Smart Parameter Ranges** (musical intelligence across instrument families)
4. **Enhanced Effect Routing** (creative flexibility for orchestral arrangements)
5. **Graph-Responsive Effects** (unique innovation with full orchestral response)

### **Long-term Orchestral Vision Priority:**
1. **Phase 6 Vocal & Keyboard** (advanced synthesis + articulation → 15/31 instruments)
2. **Phase 7 Strings & Brass** (individual sections + brass formants → 23/31 instruments)
3. **Phase 8 Percussion & Electronic** (complete percussion + synthesis → 31/31 instruments)
4. **Phase 9 Orchestral Intelligence** (AI orchestration + conductor interface)
5. **Phase 3 Refinements** (polish and professional workflow enhancement)

---

*This master plan will be updated as development progresses and new requirements emerge. The focus remains on musical quality, user experience, and technical excellence.* 