# Rhythmic Percussion Accent Layer

- **Status:** In Development
- **Branch:** `feature/rhythmic-percussion`
- **Goal:** Add synthesized drum sounds as an accent layer that supplements melodic instruments

---

## Overview

Add rhythmic percussion (kick, snare, hi-hat, tom) as an **accent layer** that triggers alongside regular note events. This provides rhythmic emphasis and texture without replacing melodic instruments.

## Key Principles

1. **Supplemental, not replacement** - Percussion adds to music, doesn't take voice slots
2. **Synthesized sounds** - Use Tone.js synthesis (no samples needed)
3. **User control** - Density, per-drum toggles, separate volume
4. **Intelligent mapping** - Percussion type chosen based on note properties

---

## Implementation Plan

### Phase 1: Percussion Synthesis (Current)

**Goal:** Create synthesized drum sounds using Tone.js

#### Drum Synths to Implement

1. **Kick Drum** - MembraneSynth (low frequency, quick decay)
2. **Snare Drum** - NoiseSynth + tone (bright attack, short decay)
3. **Hi-Hat** - MetalSynth (high frequency, very short)
4. **Tom** - MembraneSynth (mid frequency, medium decay)

#### Technical Approach

- Create `PercussionEngine` class in `src/audio/percussion-engine.ts`
- Each drum type has dedicated synth instance
- All percussion routes through single output channel
- Separate volume control (doesn't affect other instruments)

### Phase 2: Accent Layer System

**Goal:** Integrate percussion with note triggering system

#### Trigger Logic

When a note event fires:
1. Regular instrument plays (as normal)
2. If percussion enabled AND probability check passes:
   - Select drum type based on note properties
   - Trigger percussion synth
   - Mix with regular audio

#### Mapping Strategy

Map note properties to drum selection:
- **Velocity** → Drum type intensity (soft hi-hat, medium snare, hard kick)
- **Pitch range** → Drum type (low notes → kick, mid → snare/tom, high → hi-hat)
- **Random variation** → Add unpredictability for musicality

#### Configuration

- **Density slider** (0-100%) - Probability of percussion trigger
- **Per-drum toggles** - Enable/disable individual drums
- **Volume control** - Overall percussion level
- **Accent mode** - How drums are selected (velocity-based, pitch-based, random)

### Phase 3: UI Integration

**Goal:** Add controls to Percussion tab in Control Center

#### UI Layout

```
┌─ Percussion ──────────────────────────────┐
│                                            │
│ Melodic Percussion:                        │
│ ☑ Timpani          ☑ Xylophone            │
│ ☑ Vibraphone       ☑ Gongs                │
│                                            │
│ ──────────────────────────────────────────│
│                                            │
│ Rhythmic Percussion (Accent Layer):        │
│ ☑ Enable Drum Accents                     │
│                                            │
│ Density: [===========-------] 60%         │
│                                            │
│ Active Drums:                              │
│ ☑ Kick Drum                                │
│ ☑ Snare Drum                               │
│ ☑ Hi-Hat                                   │
│ ☐ Tom                                      │
│                                            │
│ Accent Mode:                               │
│ ● Velocity-based  ○ Pitch-based  ○ Random │
│                                            │
│ Volume: [========--------] -6 dB          │
└────────────────────────────────────────────┘
```

#### Settings Integration

Add to plugin settings:
```typescript
percussionAccents: {
    enabled: boolean;
    density: number; // 0-100
    activeDrums: {
        kick: boolean;
        snare: boolean;
        hihat: boolean;
        tom: boolean;
    };
    accentMode: 'velocity' | 'pitch' | 'random';
    volume: number; // dB
}
```

---

## Technical Details

### File Structure

```
src/audio/percussion/
  ├── PercussionEngine.ts       (main engine class)
  ├── DrumSynths.ts             (synth definitions)
  ├── AccentMapper.ts           (note → drum mapping logic)
  └── types.ts                  (percussion types)

src/ui/settings/
  └── PercussionSettings.ts     (UI controls - extend existing)
```

### Integration Points

1. **AudioEngine** - Add PercussionEngine instance
2. **VoiceManager** - Trigger percussion on note events (doesn't consume voices)
3. **ControlPanel** - Add percussion accent controls to Percussion tab
4. **Settings** - Add percussion accent settings

### Percussion Engine API

```typescript
class PercussionEngine {
    constructor(audioContext: AudioContext);

    // Initialize drum synths
    initialize(): void;

    // Trigger drum based on note properties
    triggerAccent(note: NoteEvent, config: PercussionConfig): void;

    // Enable/disable individual drums
    setDrumEnabled(drum: DrumType, enabled: boolean): void;

    // Set overall percussion volume
    setVolume(db: number): void;

    // Set density (0-1 probability)
    setDensity(density: number): void;

    // Cleanup
    dispose(): void;
}
```

---

## Success Criteria

- [ ] Four drum types synthesize correctly (kick, snare, hi-hat, tom)
- [ ] Percussion triggers alongside notes (doesn't replace them)
- [ ] Density control adjusts trigger probability
- [ ] Per-drum toggles work correctly
- [ ] Volume control affects only percussion
- [ ] Accent mode selection changes mapping behavior
- [ ] UI integrated into existing Percussion tab
- [ ] Settings persist across sessions
- [ ] No performance degradation
- [ ] Sounds musical and enhances composition

---

## Future Enhancements

- Additional drum types (shaker, tambourine, cowbell, etc.)
- Drum patterns/sequences (not just accents)
- Velocity variation (not just on/off)
- Custom synthesis parameters per drum
- MIDI-style drum mapping
- Export percussion as separate audio track

---

**Next Step:** Implement drum synthesis in PercussionEngine class

