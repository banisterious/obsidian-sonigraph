# Local Soundscape Aesthetic Enhancement Design Document

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Current System Analysis](#2-current-system-analysis)
- [3. Enhancement Proposals](#3-enhancement-proposals)
  - [3.1. Scale Quantization](#31-scale-quantization)
  - [3.2. Chord Voicing System](#32-chord-voicing-system)
  - [3.3. Melodic Arc and Tension Tracking](#33-melodic-arc-and-tension-tracking)
  - [3.4. Instrument Selection Improvements](#34-instrument-selection-improvements)
  - [3.5. Rhythmic Pattern System](#35-rhythmic-pattern-system)
  - [3.6. Dynamic Panning Enhancements](#36-dynamic-panning-enhancements)
  - [3.7. Adaptive Pitch Ranges](#37-adaptive-pitch-ranges)
  - [3.8. Instrument Turn-Taking System](#38-instrument-turn-taking-system)
- [4. Implementation Roadmap](#4-implementation-roadmap)
- [5. Technical Specifications](#5-technical-specifications)
- [6. Testing Strategy](#6-testing-strategy)
- [7. Performance Considerations](#7-performance-considerations)

---

## 1. Executive Summary

This document outlines a comprehensive plan to enhance the musicality and aesthetic quality of the Local Soundscape feature in Sonigraph. The current system generates sonifications based on note graph structure using a depth-based mapping approach, but lacks harmonic coherence, melodic structure, and rhythmic organization.

### Current Limitations

1. **No harmonic consonance** - Pitches are not constrained to musical scales
2. **Monophonic output** - No chord structures or harmonic support
3. **No melodic narrative** - Sequence lacks tension/release arc
4. **Random timing** - No rhythmic patterns or grouping
5. **Abrupt timbral changes** - Instruments change per note
6. **Binary panning** - Directional audio lacks spatial nuance
7. **No textural organization** - All instruments play simultaneously, creating potential sonic congestion

### Proposed Solutions

This design proposes **eight interconnected enhancements** that transform Local Soundscape from a data sonification tool into a musically coherent experience:

1. **Scale Quantization** - Harmonic consonance through musical theory integration
2. **Chord Voicing** - Depth-based harmonic layers for richer texture
3. **Melodic Arc** - Tension tracking for emotional narrative
4. **Smart Instrument Selection** - Depth-layer consistency for timbral cohesion
5. **Rhythmic Patterns** - Temporal organization for forward momentum
6. **Dynamic Panning** - Smooth spatial transitions
7. **Adaptive Pitch Ranges** - Key-relative depth ranges
8. **Instrument Turn-Taking** - Call-and-response patterns for musical dialogue

### Implementation Priority

**Phase 1 (High Impact, Low Risk):**
- Scale Quantization (leverages existing `MusicalTheoryEngine`)
- Instrument Selection Improvements

**Phase 2 (Medium Complexity):**
- Chord Voicing System
- Adaptive Pitch Ranges

**Phase 3 (Advanced Features):**
- Melodic Arc and Tension Tracking
- Rhythmic Pattern System
- Dynamic Panning Enhancements

---

## 2. Current System Analysis

### 2.1. Architecture Overview

**Key Files:**
- [DepthBasedMapper.ts](../../src/audio/mapping/DepthBasedMapper.ts) - Primary music generation logic
- [MusicalTheoryEngine.ts](../../src/audio/theory/MusicalTheoryEngine.ts) - Existing but unused harmonic system
- [LocalSoundscapeView.ts](../../src/ui/LocalSoundscapeView.ts) - Playback and visualization
- [ContextualModifier.ts](../../src/audio/mapping/ContextualModifier.ts) - Environmental influence

### 2.2. Current Musical Parameter Generation

**Pitch Generation:**
```typescript
// Current approach (DepthBasedMapper.ts:430-478)
const pitchRange = getPitchRangeForDepth(depth);
// Fixed semitone ranges per depth:
// - Center: 0 to +12 (C4 to C5)
// - Depth 1: -5 to +7 (G3 to G4)
// - Depth 2: -12 to 0 (C3 to C4)
// - Depth 3+: -24 to -12 (C2 to C3)

// Weighted calculation
const pitchOffset = calculatePitchOffset(node, pitchRange);
// Factors: wordCount (30%), charCount (20%), headingLevel (25%), linkDensity (25%)

// Convert to frequency
const frequency = 261.63 * Math.pow(2, pitchOffset / 12);
```

**Problem:** Pitches are not quantized to any musical scale, resulting in dissonant clashes.

**Instrument Selection:**
```typescript
// Current approach (DepthBasedMapper.ts:496-541)
const instruments = getInstrumentsForDepth(depth);
// Pools per depth:
// - Center: piano, organ, leadSynth
// - Depth 1: strings, electricPiano
// - Depth 2: bassSynth, timpani, cello
// - Depth 3+: arpSynth, vibraphone

const instrument = selectInstrument(node, instruments);
// Selected PER NODE using hash function
```

**Problem:** Each note uses a different instrument, creating timbral chaos.

**Timing:**
```typescript
// Current approach (DepthBasedMapper.ts:299-344)
const noteInterval = Math.max(0.5, maxDuration / 6);
mapping.timing = index * noteInterval + jitter;
```

**Problem:** Linear spacing with random jitter, no rhythmic organization.

### 2.3. Existing Musical Theory Capabilities

The project already includes a fully-featured `MusicalTheoryEngine` that is **NOT currently used** by Local Soundscape:

**Available Methods:**
- `quantizePitch(frequency)` - Snap to nearest scale degree
- `generateChord(rootFrequency, chordDef)` - Create chord voicings
- `harmonizeMelody(frequency, numVoices)` - Add harmony voices
- `validateHarmony(frequencies)` - Check dissonance/tension
- `calculateHarmonicTension(frequencies, root)` - Measure tension level
- `updateContext(recentFrequencies)` - Track musical context

**Opportunity:** Integrate this existing infrastructure into Local Soundscape.

---

## 3. Enhancement Proposals

### 3.1. Scale Quantization

**Objective:** Constrain all pitches to the user-selected musical key/scale for harmonic consonance.

#### 3.1.1. Design

**Integration Point:**
[DepthBasedMapper.ts:430-478](../../src/audio/mapping/DepthBasedMapper.ts#L430-L478) - `calculatePitchOffset()`

**Approach:**
```typescript
// New approach (with MusicalTheoryEngine integration)
private calculatePitchOffset(
  node: LocalSoundscapeNode,
  range: { min: number; max: number },
  contextModifiers?: ContextModifiers
): number {
  // Calculate raw pitch offset (existing logic)
  const rawOffset = /* existing weighted calculation */;
  const rawFrequency = 261.63 * Math.pow(2, rawOffset / 12);

  // Quantize to scale if MusicalTheoryEngine is enabled
  if (this.musicalTheoryEngine?.getConfig().enabled) {
    const quantizedFrequency = this.musicalTheoryEngine.constrainPitchToScale(rawFrequency);

    // Convert back to semitone offset
    const quantizedOffset = 12 * Math.log2(quantizedFrequency / 261.63);
    return quantizedOffset;
  }

  return rawOffset;
}
```

#### 3.1.2. Configuration

**New Settings:**
```typescript
interface LocalSoundscapeSettings {
  quantization: {
    enabled: boolean;              // Default: true
    strength: number;              // 0-1, how strictly to snap (default: 0.9)
    allowChromatic: boolean;       // Allow passing tones (default: false)
  };
}
```

#### 3.1.3. User Experience

**Before:** Dissonant, clashing pitches
**After:** All notes harmonically related to chosen key

**UI Location:** Local Soundscape settings panel, toggle "Harmonic Quantization"

#### 3.1.4. Implementation Complexity

**Effort:** Low (2-4 hours)
**Risk:** Low (leverages existing `MusicalTheoryEngine`)
**Dependencies:** Requires `MusicalTheoryEngine` instance in `DepthBasedMapper`

---

### 3.2. Chord Voicing System

**Objective:** Generate polyphonic chord structures based on depth layers for harmonic richness.

#### 3.2.1. Design

**Concept:**
Instead of playing one note per node, generate chord voicings where:
- **Center node** plays the root melody (top voice)
- **Depth 1 nodes** contribute harmonic support (middle voices)
- **Depth 2-3 nodes** provide bass foundation (bottom voices)

**Approach:**
```typescript
interface ChordVoicingConfig {
  enabled: boolean;
  strategy: 'depth-based' | 'harmonic-function' | 'disabled';

  voicesPerDepth: {
    center: number;     // 1 (melody only)
    depth1: number;     // 2-3 (harmony)
    depth2: number;     // 1-2 (bass)
    depth3Plus: number; // 0-1 (optional drone)
  };

  voiceLeading: {
    enabled: boolean;           // Validate smooth voice movement
    maxLeap: number;            // Max semitones between consecutive notes
    preferContraryMotion: boolean;
  };
}
```

**Integration Point:**
New method in `DepthBasedMapper`: `generateChordVoicing(node, depth)`

```typescript
private generateChordVoicing(
  node: LocalSoundscapeNode,
  depth: number,
  rootFrequency: number
): number[] {
  const config = this.config.chordVoicing;
  const numVoices = config.voicesPerDepth[`depth${depth}`] || 1;

  if (!this.musicalTheoryEngine || numVoices === 1) {
    return [rootFrequency]; // Monophonic fallback
  }

  // Use MusicalTheoryEngine to harmonize
  const voices = this.musicalTheoryEngine.harmonizeMelody(rootFrequency, numVoices);

  // Validate voice leading if enabled
  if (config.voiceLeading.enabled && this.previousChordVoices) {
    const validation = this.musicalTheoryEngine.validateVoiceLeading(
      this.previousChordVoices,
      voices
    );

    if (!validation.valid) {
      // Adjust voices to satisfy voice leading rules
      return this.adjustForVoiceLeading(voices, this.previousChordVoices);
    }
  }

  this.previousChordVoices = voices;
  return voices;
}
```

#### 3.2.2. Playback Modification

**Current:** Single `audioEngine.playNoteImmediate()` call per node

**New:** Multiple simultaneous calls for chord tones
```typescript
// In LocalSoundscapeView.ts
const voices = mapping.voices || [mapping.pitch]; // Support both mono and poly

for (const voiceFrequency of voices) {
  await this.plugin.audioEngine.playNoteImmediate({
    pitch: voiceFrequency,
    duration: mapping.duration,
    velocity: mapping.velocity * 0.8, // Reduce per-voice volume
    instrument: mapping.instrument,
  }, timestamp, nodeId);
}
```

#### 3.2.3. Chord Quality Selection

**Strategy:** Choose chord quality based on node properties

```typescript
private selectChordQuality(node: LocalSoundscapeNode): ChordQuality {
  // Use node properties to determine chord flavor
  const hasPositiveSentiment = node.tags?.some(tag =>
    ['happy', 'success', 'achievement'].includes(tag)
  );

  const hasNegativeSentiment = node.tags?.some(tag =>
    ['problem', 'issue', 'todo'].includes(tag)
  );

  if (hasPositiveSentiment) return 'major';
  if (hasNegativeSentiment) return 'minor';

  // Default to modal ambiguity (suspended chords)
  return 'suspended-fourth';
}
```

#### 3.2.4. Implementation Complexity

**Effort:** Medium (8-12 hours)
**Risk:** Medium (requires playback system modification)
**Dependencies:** Scale Quantization, `MusicalTheoryEngine`

---

### 3.3. Melodic Arc and Tension Tracking

**Objective:** Create musical narrative through harmonic tension and release patterns.

#### 3.3.1. Design

**Concept:**
Track harmonic tension throughout the sequence and shape the soundscape to follow a dramatic arc (exposition → development → climax → resolution).

**Tension Sources:**
1. **Dissonance** - Interval consonance (from `HarmonicRules.ts`)
2. **Distance from tonic** - How far from key center
3. **Voice leading complexity** - Size of melodic leaps
4. **Polyphonic density** - Number of simultaneous voices

**Arc Shapes:**
```typescript
type ArcShape =
  | 'rising'      // Builds to climax at end
  | 'falling'     // Releases tension toward end
  | 'arch'        // Builds to middle, then resolves
  | 'valley'      // Tense at start/end, calm in middle
  | 'natural';    // Follow inherent graph structure

interface TensionTrackingConfig {
  enabled: boolean;
  arcShape: ArcShape;

  // Tension target ranges (0-1)
  startTension: number;     // Default: 0.3
  peakTension: number;      // Default: 0.8
  endTension: number;       // Default: 0.2

  // How to modulate tension
  modulationMethods: {
    dissonance: boolean;    // Vary chord dissonance
    register: boolean;      // Higher = more tension
    velocity: boolean;      // Louder = more tension
    polyphony: boolean;     // More voices = more tension
  };
}
```

#### 3.3.2. Implementation

**New Class:** `TensionArcController`

```typescript
class TensionArcController {
  private config: TensionTrackingConfig;
  private musicalTheoryEngine: MusicalTheoryEngine;

  /**
   * Calculate target tension level for a position in sequence
   * @param position - 0-1, position in overall sequence
   * @returns tension - 0-1, target tension level
   */
  calculateTargetTension(position: number): number {
    const { arcShape, startTension, peakTension, endTension } = this.config;

    switch (arcShape) {
      case 'rising':
        return startTension + (peakTension - startTension) * position;

      case 'falling':
        return peakTension - (peakTension - endTension) * position;

      case 'arch':
        // Parabolic arc peaking at midpoint
        const archHeight = peakTension - Math.min(startTension, endTension);
        return startTension + archHeight * Math.sin(position * Math.PI);

      case 'valley':
        // Inverted arch
        const valleyDepth = Math.min(startTension, endTension);
        return peakTension - (peakTension - valleyDepth) * Math.sin(position * Math.PI);

      case 'natural':
      default:
        return this.calculateNaturalTension(position);
    }
  }

  /**
   * Adjust musical parameters to match target tension
   */
  applyTensionModulation(
    mapping: DepthMapping,
    currentTension: number,
    targetTension: number
  ): DepthMapping {
    const tensionDelta = targetTension - currentTension;

    // Modulate parameters based on configuration
    if (this.config.modulationMethods.dissonance) {
      // Increase/decrease dissonance in chord voicing
      mapping.chordQuality = this.adjustChordQuality(mapping.chordQuality, tensionDelta);
    }

    if (this.config.modulationMethods.register) {
      // Shift pitch up/down (higher = more tension)
      mapping.pitch *= Math.pow(2, tensionDelta * 0.1); // ±10% shift
    }

    if (this.config.modulationMethods.velocity) {
      // Adjust volume
      mapping.velocity = Math.max(0.3, Math.min(1.0,
        mapping.velocity + tensionDelta * 0.3
      ));
    }

    if (this.config.modulationMethods.polyphony) {
      // Add/remove voices
      const targetVoices = Math.round(1 + tensionDelta * 3); // 1-4 voices
      mapping.numVoices = targetVoices;
    }

    return mapping;
  }

  /**
   * Calculate natural tension from graph structure
   */
  private calculateNaturalTension(position: number): number {
    // Use graph properties to determine inherent tension
    // e.g., highly connected areas = high tension
    // isolated notes = low tension
    return 0.5; // Placeholder - implement based on graph analysis
  }
}
```

#### 3.3.3. Integration

**Modified Flow:**
```typescript
// In DepthBasedMapper.mapSoundscapeToMusic()
const tensionController = new TensionArcController(config.tensionTracking, this.musicalTheoryEngine);

mappings.forEach((mapping, index) => {
  const position = index / mappings.length;
  const currentTension = this.musicalTheoryEngine.getContext().harmonicTension;
  const targetTension = tensionController.calculateTargetTension(position);

  // Adjust mapping to match target tension
  mappings[index] = tensionController.applyTensionModulation(
    mapping,
    currentTension,
    targetTension
  );

  // Update musical context
  this.musicalTheoryEngine.updateContext([mapping.pitch]);
});
```

#### 3.3.4. User Experience

**Before:** Random sequence, no sense of direction
**After:** Musical journey with clear narrative arc

**UI Controls:**
- Arc shape selector (dropdown)
- Tension intensity slider (0-100%)
- Start/peak/end tension sliders

#### 3.3.5. Implementation Complexity

**Effort:** High (12-16 hours)
**Risk:** Medium
**Dependencies:** Scale Quantization, Chord Voicing, `MusicalTheoryEngine`

---

### 3.4. Instrument Selection Improvements

**Objective:** Maintain timbral consistency by assigning instruments per depth layer, not per note.

#### 3.4.1. Current Problem

```typescript
// Current: Each note gets its own instrument
const instrument = selectInstrument(node, instruments); // PER NODE
```

**Result:** Chaotic, constantly changing timbre

#### 3.4.2. Proposed Solution

**Depth-Layer Assignment:**
```typescript
interface InstrumentSelectionConfig {
  mode: 'per-note' | 'per-depth' | 'per-phrase';

  perDepthConfig: {
    center: string;      // Single instrument for all center notes
    depth1: string;      // Single instrument for depth 1
    depth2: string;      // Single instrument for depth 2
    depth3Plus: string;  // Single instrument for depth 3+
  };

  perPhraseConfig: {
    phraseLength: number; // Notes per phrase (default: 8)
    allowRepeat: boolean; // Can same instrument be used in adjacent phrases
  };
}
```

**Implementation:**
```typescript
// New approach: Assign instruments at start of mapping
private assignInstrumentsToDepths(data: LocalSoundscapeData): Map<number, string> {
  const config = this.config.instrumentSelection;
  const depthToInstrument = new Map<number, string>();

  if (config.mode === 'per-depth') {
    // Assign one instrument per depth level
    depthToInstrument.set(0, config.perDepthConfig.center);
    depthToInstrument.set(1, config.perDepthConfig.depth1);
    depthToInstrument.set(2, config.perDepthConfig.depth2);
    depthToInstrument.set(3, config.perDepthConfig.depth3Plus);
  } else if (config.mode === 'per-phrase') {
    // Assign instruments to phrases (groups of notes)
    this.assignInstrumentsToPhrases(data, depthToInstrument);
  }

  return depthToInstrument;
}

// Use in mapNode()
private async mapNode(
  node: LocalSoundscapeNode,
  depth: number,
  depthInstruments: Map<number, string>
): Promise<DepthMapping | null> {
  const instrument = depthInstruments.get(depth) || this.selectInstrument(node, instruments);
  // ... rest of mapping logic
}
```

#### 3.4.3. Smart Selection Criteria

**Enhanced Selection:**
```typescript
private selectInstrumentForDepth(
  depth: number,
  nodesAtDepth: LocalSoundscapeNode[],
  context: MusicalContext
): string {
  const instruments = this.getInstrumentsForDepth(depth);

  // Analyze aggregate properties of all nodes at this depth
  const avgWordCount = nodesAtDepth.reduce((sum, n) => sum + n.wordCount, 0) / nodesAtDepth.length;
  const avgRecency = nodesAtDepth.reduce((sum, n) => sum + (Date.now() - n.modified), 0) / nodesAtDepth.length;

  // Select instrument based on aggregate character
  if (avgWordCount > 500) {
    // Substantial content = rich, sustained instruments
    return instruments.includes('strings') ? 'strings' : instruments[0];
  } else if (avgRecency < 7 * 24 * 60 * 60 * 1000) {
    // Recent notes = bright, articulate instruments
    return instruments.includes('piano') ? 'piano' : instruments[0];
  }

  // Default to first instrument in pool
  return instruments[0];
}
```

#### 3.4.4. Implementation Complexity

**Effort:** Low (4-6 hours)
**Risk:** Low
**Dependencies:** None (independent enhancement)

---

### 3.5. Rhythmic Pattern System

**Objective:** Organize note timing into musical patterns rather than random spacing.

#### 3.5.1. Design

**Concept:**
Group notes at the same depth into rhythmic patterns (arpeggios, ostinatos, pulses) that create forward momentum.

**Pattern Types:**
```typescript
type RhythmicPattern =
  | 'sequential'     // Even spacing (current default)
  | 'arpeggio'       // Ascending/descending rapid notes
  | 'ostinato'       // Repeating rhythmic figure
  | 'pulse'          // Rhythmic accent pattern
  | 'cluster'        // Simultaneous or near-simultaneous
  | 'decay'          // Fast → slow timing
  | 'accelerando';   // Slow → fast timing

interface RhythmicConfig {
  enabled: boolean;
  patternPerDepth: Map<number, RhythmicPattern>;

  tempo: number;           // BPM (default: 60)
  timeSignature: [number, number]; // e.g., [4, 4]

  patterns: {
    arpeggio: {
      direction: 'ascending' | 'descending' | 'alternating';
      noteValue: '16th' | '8th' | 'triplet';
    };

    ostinato: {
      pattern: number[];   // Rhythmic pattern [1, 0.5, 0.5, 1] = quarter, eighth, eighth, quarter
      repeat: number;      // How many times to repeat
    };

    pulse: {
      accentPattern: number[]; // [1, 0, 0, 0] = accent every 4th note
      accentMultiplier: number; // Volume boost for accented notes
    };
  };
}
```

#### 3.5.2. Implementation

**New Class:** `RhythmicPatternGenerator`

```typescript
class RhythmicPatternGenerator {
  private config: RhythmicConfig;

  /**
   * Generate timing values for a group of nodes
   */
  generateTimings(
    nodes: LocalSoundscapeNode[],
    pattern: RhythmicPattern,
    startTime: number
  ): number[] {
    const beatDuration = 60 / this.config.tempo;
    const timings: number[] = [];

    switch (pattern) {
      case 'arpeggio':
        return this.generateArpeggio(nodes.length, startTime, beatDuration);

      case 'ostinato':
        return this.generateOstinato(nodes.length, startTime, beatDuration);

      case 'pulse':
        return this.generatePulse(nodes.length, startTime, beatDuration);

      case 'cluster':
        // All notes at nearly the same time
        return nodes.map((_, i) => startTime + (i * 0.05)); // 50ms spacing

      case 'decay':
        // Exponential decay from fast to slow
        return this.generateDecay(nodes.length, startTime, beatDuration);

      case 'accelerando':
        // Exponential acceleration from slow to fast
        return this.generateAccelerando(nodes.length, startTime, beatDuration);

      case 'sequential':
      default:
        // Even spacing (current default)
        return nodes.map((_, i) => startTime + (i * beatDuration));
    }
  }

  private generateArpeggio(count: number, start: number, beat: number): number[] {
    const config = this.config.patterns.arpeggio;
    const noteValue = config.noteValue === '16th' ? beat / 4 :
                      config.noteValue === 'triplet' ? beat / 3 : beat / 2;

    return Array.from({ length: count }, (_, i) => start + (i * noteValue));
  }

  private generateOstinato(count: number, start: number, beat: number): number[] {
    const pattern = this.config.patterns.ostinato.pattern;
    const timings: number[] = [];
    let currentTime = start;

    for (let i = 0; i < count; i++) {
      const patternIndex = i % pattern.length;
      timings.push(currentTime);
      currentTime += pattern[patternIndex] * beat;
    }

    return timings;
  }

  // Additional pattern generators...
}
```

#### 3.5.3. Integration

```typescript
// In DepthBasedMapper.calculateTimingForMappings()
private calculateTimingForMappings(mappings: DepthMapping[]): void {
  const rhythmicGen = new RhythmicPatternGenerator(this.config.rhythmic);

  // Group mappings by depth
  const byDepth = new Map<number, DepthMapping[]>();
  mappings.forEach(m => {
    const group = byDepth.get(m.depth) || [];
    group.push(m);
    byDepth.set(m.depth, group);
  });

  let globalTime = 0;

  // Generate timings per depth layer
  byDepth.forEach((group, depth) => {
    const pattern = this.config.rhythmic.patternPerDepth.get(depth) || 'sequential';
    const timings = rhythmicGen.generateTimings(
      group.map(m => /* extract node data */),
      pattern,
      globalTime
    );

    group.forEach((mapping, i) => {
      mapping.timing = timings[i];
    });

    // Advance global time for next depth
    globalTime = Math.max(...timings) + 1.0; // 1 second gap between depths
  });

  // Sort all mappings by final timing
  mappings.sort((a, b) => a.timing - b.timing);
}
```

#### 3.5.4. User Experience

**Before:** Random, uncoordinated timing
**After:** Rhythmic organization with clear patterns

**UI Controls:**
- Tempo slider (30-180 BPM)
- Pattern selector per depth (dropdown)
- Pattern-specific parameters (collapsible panels)

#### 3.5.5. Implementation Complexity

**Effort:** Medium-High (10-14 hours)
**Risk:** Low (isolated timing logic)
**Dependencies:** None (can work independently)

---

### 3.6. Dynamic Panning Enhancements

**Objective:** Create smooth, context-aware spatial audio instead of binary left/right panning.

#### 3.6.1. Current Limitation

```typescript
// Current panning (DepthBasedMapper.ts:546-563)
switch (node.direction) {
  case 'incoming': return -0.7; // Hard left
  case 'outgoing': return 0.7;  // Hard right
  case 'bidirectional': return 0.0; // Center
}
```

**Problem:** Abrupt, binary positioning with no nuance.

#### 3.6.2. Proposed Enhancements

**Dynamic Panning Modes:**
```typescript
type PanningMode =
  | 'directional'      // Current (incoming=left, outgoing=right)
  | 'circular'         // Rotate around listener based on graph position
  | 'distance'         // Pan based on depth (closer=center, far=wide)
  | 'semantic'         // Pan based on content similarity
  | 'animated';        // Smoothly move during playback

interface DynamicPanningConfig {
  mode: PanningMode;

  directional: {
    incomingPan: number;      // -1 to 0 (default: -0.7)
    outgoingPan: number;      // 0 to 1 (default: 0.7)
    bidirectionalPan: number; // -1 to 1 (default: 0.0)
    smoothing: number;        // 0-1, blend factor for gradual transitions
  };

  circular: {
    radius: number;           // Stereo width (0-1)
    rotationSpeed: number;    // Degrees per second
  };

  distance: {
    centerWidth: number;      // Pan range at depth 0 (e.g., ±0.2)
    peripheryWidth: number;   // Pan range at depth 3+ (e.g., ±1.0)
  };

  semantic: {
    enabled: boolean;
    similarityThreshold: number; // 0-1
  };

  animated: {
    enabled: boolean;
    duration: number;         // Seconds to move from start to end pan
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
}
```

#### 3.6.3. Implementation

**Enhanced Panning Calculation:**
```typescript
private calculateDynamicPanning(
  node: LocalSoundscapeNode,
  depth: number,
  position: number // 0-1, position in sequence
): number {
  const config = this.config.dynamicPanning;

  switch (config.mode) {
    case 'circular':
      return this.calculateCircularPan(position, config.circular);

    case 'distance':
      return this.calculateDistancePan(depth, config.distance);

    case 'semantic':
      return this.calculateSemanticPan(node, config.semantic);

    case 'animated':
      return this.calculateAnimatedPan(position, config.animated);

    case 'directional':
    default:
      return this.calculateDirectionalPan(node, config.directional);
  }
}

private calculateCircularPan(position: number, config: CircularConfig): number {
  // Rotate around listener in circular pattern
  const angle = position * 2 * Math.PI; // 0 to 2π
  return Math.sin(angle) * config.radius;
}

private calculateDistancePan(depth: number, config: DistanceConfig): number {
  // Wider stereo for distant notes, narrow for close notes
  const t = Math.min(depth / 3, 1.0); // Normalize depth 0-3 to 0-1
  const width = config.centerWidth + (config.peripheryWidth - config.centerWidth) * t;

  // Random position within width
  const hash = this.hashString(node.id) / 1000;
  return (hash * 2 - 1) * width; // -width to +width
}

private calculateSemanticPan(node: LocalSoundscapeNode, config: SemanticConfig): number {
  if (!config.enabled || !this.currentCenterNodePath) {
    return 0;
  }

  // Calculate content similarity to center note
  const similarity = this.calculateContentSimilarity(node, this.currentCenterNodePath);

  if (similarity > config.similarityThreshold) {
    // Similar content = closer to center
    return (1 - similarity) * 0.5 * (Math.random() > 0.5 ? 1 : -1);
  } else {
    // Dissimilar content = pushed to periphery
    return (Math.random() > 0.5 ? 1 : -1) * 0.7;
  }
}
```

#### 3.6.4. Animated Panning

**Challenge:** Panning values are set at note creation, but animation requires changing pan during playback.

**Solution:** Modify playback to support pan modulation

```typescript
// In AudioEngine.ts - add pan modulation support
async playNoteImmediate(
  params: NoteParams,
  timestamp: number,
  nodeId: string,
  panModulation?: { start: number; end: number; duration: number; easing: string }
): Promise<void> {
  const synth = this.getInstrumentSynth(params.instrument);

  // Apply initial pan
  synth.set({ pan: panModulation?.start || 0 });

  // Trigger note
  synth.triggerAttackRelease(params.pitch, params.duration, undefined, params.velocity);

  // Animate pan if modulation provided
  if (panModulation) {
    const panParam = synth.get().pan;
    panParam.rampTo(panModulation.end, panModulation.duration, timestamp);
  }
}
```

#### 3.6.5. Implementation Complexity

**Effort:** Medium (8-10 hours)
**Risk:** Low (isolated panning logic)
**Dependencies:** None (can work independently)

---

### 3.7. Adaptive Pitch Ranges

**Objective:** Make depth-based pitch ranges relative to the selected musical key instead of fixed semitone values.

#### 3.7.1. Current Problem

```typescript
// Current: Fixed semitone ranges (DepthBasedMapper.ts:181-186)
pitchRangesByDepth: {
  center: { min: 0, max: 12 },      // Always C4 to C5
  depth1: { min: -5, max: 7 },      // Always G3 to G4
  depth2: { min: -12, max: 0 },     // Always C3 to C4
  depth3Plus: { min: -24, max: -12 } // Always C2 to C3
}
```

**Problem:** If user selects key of D major, ranges don't start from D.

#### 3.7.2. Proposed Solution

**Key-Relative Ranges:**
```typescript
interface AdaptivePitchConfig {
  enabled: boolean;

  // Define ranges as scale degrees instead of semitones
  rangesByDepth: {
    center: { minDegree: number; maxDegree: number };     // 0 to 7 (root to octave)
    depth1: { minDegree: number; maxDegree: number };     // -2 to 5 (below root to fifth)
    depth2: { minDegree: number; maxDegree: number };     // -7 to 0 (octave below to root)
    depth3Plus: { minDegree: number; maxDegree: number }; // -14 to -7 (two octaves down)
  };

  // How ranges adapt when key changes
  adaptationMode: 'transpose' | 'recompute';
}
```

**Implementation:**
```typescript
private calculateAdaptivePitchRange(depth: number): { min: number; max: number } {
  if (!this.config.adaptivePitch.enabled) {
    return this.getPitchRangeForDepth(depth); // Fall back to fixed ranges
  }

  const scale = this.musicalTheoryEngine.getCurrentScale();
  const rootFrequency = scale.frequencies[0];
  const degreeRanges = this.config.adaptivePitch.rangesByDepth;

  const range = depth === 0 ? degreeRanges.center :
                depth === 1 ? degreeRanges.depth1 :
                depth === 2 ? degreeRanges.depth2 : degreeRanges.depth3Plus;

  // Convert scale degrees to semitone offsets
  const minSemitones = this.scaleDegreesToSemitones(range.minDegree, scale);
  const maxSemitones = this.scaleDegreesToSemitones(range.maxDegree, scale);

  return { min: minSemitones, max: maxSemitones };
}

private scaleDegreesToSemitones(degree: number, scale: MusicalScale): number {
  const octaves = Math.floor(degree / scale.definition.intervals.length);
  const degreeInOctave = degree % scale.definition.intervals.length;

  const semitones = scale.definition.intervals[degreeInOctave] + (octaves * 12);
  return semitones;
}
```

#### 3.7.3. User Experience

**Before:** Pitch ranges ignore selected key
**After:** Pitch ranges adapt to key, maintaining harmonic coherence

**UI:** Automatic (no user controls needed, just works with key selection)

#### 3.7.4. Implementation Complexity

**Effort:** Low-Medium (4-6 hours)
**Risk:** Low
**Dependencies:** Scale Quantization, `MusicalTheoryEngine`

---

### 3.8. Instrument Turn-Taking System

**Objective:** Create musical dialogue and textural clarity by organizing instruments into conversational patterns rather than playing simultaneously.

#### 3.8.1. Design

**Concept:**
Instead of all instruments playing at once (creating potential cacophony), organize them into turn-taking patterns that create call-and-response musical dialogue. This adds:
- **Textural clarity** - Less sonic congestion
- **Musical interest** - Conversational back-and-forth
- **Attention guidance** - Listener follows the "dialogue"
- **Rhythmic variety** - Natural ebb and flow

**Musical Precedents:**
- Jazz solos (trading fours, eights)
- Baroque concerto grosso (ripieno vs. concertino)
- Call-and-response in African music traditions
- Question-answer phrasing in classical composition

#### 3.8.2. Turn-Taking Patterns

```typescript
type TurnTakingPattern =
  | 'none'              // All instruments together (current behavior)
  | 'sequential'        // One instrument at a time, rotate through all
  | 'call-response'     // Alternating groups (e.g., center vs. periphery)
  | 'solos'             // Feature one instrument per phrase, others provide accompaniment
  | 'layered-entry'     // Instruments enter one by one, building texture
  | 'conversation'      // Dynamic turn-taking based on graph structure
  | 'fugue'             // Imitative entries with staggered timing
  | 'antiphonal';       // Spatial alternation (left vs. right channels)

interface TurnTakingConfig {
  enabled: boolean;
  pattern: TurnTakingPattern;

  // How turns are divided
  turnDivision: {
    method: 'by-depth' | 'by-instrument' | 'by-group' | 'by-time';
    turnLength: number;      // Beats or seconds per turn (default: 4 beats)
    overlapDuration: number; // Seconds of overlap between turns (default: 0.5s)
  };

  // Which instruments participate
  participatingInstruments: {
    mode: 'all' | 'selected' | 'by-depth';
    selection?: string[];    // Specific instruments if mode='selected'
    depthLimits?: {          // If mode='by-depth'
      soloDepths: number[];     // Which depths get solo turns
      accompanyDepths: number[]; // Which depths provide accompaniment
    };
  };

  // Accompaniment behavior
  accompaniment: {
    enabled: boolean;
    volumeReduction: number;  // 0-1, how much to reduce non-solo instruments (default: 0.6)
    filterCutoff: number;     // Hz, low-pass filter for accompaniment (default: 800Hz)
    onlyBass: boolean;        // Only use bass instruments for accompaniment
  };

  // Transition smoothness
  transitions: {
    fadeInDuration: number;   // ms to fade in new instrument (default: 300ms)
    fadeOutDuration: number;  // ms to fade out previous instrument (default: 400ms)
    crossfade: boolean;       // Overlap fades for smooth transitions
  };
}
```

#### 3.8.3. Pattern Implementations

**Sequential Pattern:**
```typescript
// Instruments take turns one at a time
// Example: Piano → Strings → Cello → Piano → ...

class SequentialTurnTaking {
  private currentInstrumentIndex = 0;
  private instruments: string[];

  assignTurns(mappings: DepthMapping[], config: TurnTakingConfig): DepthMapping[] {
    const turnLength = config.turnDivision.turnLength;
    const instrumentsByTurn = this.groupByTurns(mappings, turnLength);

    instrumentsByTurn.forEach((turnMappings, turnIndex) => {
      const activeInstrument = this.instruments[turnIndex % this.instruments.length];

      turnMappings.forEach(mapping => {
        if (mapping.instrument !== activeInstrument) {
          // Mute or reduce non-active instruments
          mapping.velocity *= config.accompaniment.volumeReduction;
          mapping.isAccompaniment = true;
        } else {
          mapping.isSolo = true;
        }
      });
    });

    return mappings;
  }
}
```

**Call-Response Pattern:**
```typescript
// Alternating groups create dialogue
// Example: Center (call) → Depth 1-2 (response) → Center (call) → ...

class CallResponseTurnTaking {
  assignTurns(mappings: DepthMapping[], config: TurnTakingConfig): DepthMapping[] {
    const callGroup = mappings.filter(m => m.depth === 0); // Center = "call"
    const responseGroup = mappings.filter(m => m.depth > 0); // Periphery = "response"

    const turnLength = config.turnDivision.turnLength;
    let currentTime = 0;
    let isCallTurn = true;

    while (currentTime < this.getTotalDuration(mappings)) {
      const activeGroup = isCallTurn ? callGroup : responseGroup;
      const silentGroup = isCallTurn ? responseGroup : callGroup;

      // Active group plays normally
      activeGroup
        .filter(m => m.timing >= currentTime && m.timing < currentTime + turnLength)
        .forEach(m => m.isSolo = true);

      // Silent group is reduced or muted
      silentGroup
        .filter(m => m.timing >= currentTime && m.timing < currentTime + turnLength)
        .forEach(m => {
          m.velocity *= config.accompaniment.volumeReduction;
          m.isAccompaniment = true;
        });

      currentTime += turnLength;
      isCallTurn = !isCallTurn;
    }

    return mappings;
  }
}
```

**Solos Pattern:**
```typescript
// Feature one instrument per phrase with subtle accompaniment
// Example: Piano solo (bars 1-4) with string pad → Strings solo (bars 5-8) with bass → ...

class SolosTurnTaking {
  assignTurns(mappings: DepthMapping[], config: TurnTakingConfig): DepthMapping[] {
    const instrumentGroups = this.groupMappingsByInstrument(mappings);
    const phraseLength = config.turnDivision.turnLength;
    const instruments = Array.from(instrumentGroups.keys());

    let currentTime = 0;
    let soloInstrumentIndex = 0;

    while (currentTime < this.getTotalDuration(mappings)) {
      const soloInstrument = instruments[soloInstrumentIndex % instruments.length];

      mappings
        .filter(m => m.timing >= currentTime && m.timing < currentTime + phraseLength)
        .forEach(mapping => {
          if (mapping.instrument === soloInstrument) {
            // Solo instrument - full volume, prominent
            mapping.isSolo = true;
            mapping.velocity = Math.min(1.0, mapping.velocity * 1.2); // Slight boost
          } else {
            // Accompaniment - reduced volume, supportive role
            mapping.isAccompaniment = true;
            mapping.velocity *= config.accompaniment.volumeReduction;

            // Optionally filter to only bass instruments
            if (config.accompaniment.onlyBass && !this.isBassInstrument(mapping.instrument)) {
              mapping.velocity = 0; // Mute non-bass accompaniment
            }
          }
        });

      currentTime += phraseLength;
      soloInstrumentIndex++;
    }

    return mappings;
  }

  private isBassInstrument(instrument: string): boolean {
    return ['bassSynth', 'cello', 'timpani', 'contrabass'].includes(instrument);
  }
}
```

**Layered Entry Pattern:**
```typescript
// Instruments enter progressively, building texture
// Example: Start with piano alone → add strings → add cello → full ensemble

class LayeredEntryTurnTaking {
  assignTurns(mappings: DepthMapping[], config: TurnTakingConfig): DepthMapping[] {
    const instrumentGroups = this.groupMappingsByInstrument(mappings);
    const instruments = Array.from(instrumentGroups.keys());
    const entryInterval = config.turnDivision.turnLength;

    instruments.forEach((instrument, index) => {
      const entryTime = index * entryInterval;

      instrumentGroups.get(instrument)?.forEach(mapping => {
        if (mapping.timing < entryTime) {
          // Before this instrument's entry time - mute
          mapping.velocity = 0;
          mapping.delayedEntry = true;
        } else {
          // After entry - apply fade-in
          const timeSinceEntry = mapping.timing - entryTime;
          const fadeDuration = config.transitions.fadeInDuration / 1000; // Convert ms to seconds

          if (timeSinceEntry < fadeDuration) {
            // Still fading in - scale velocity
            const fadeProgress = timeSinceEntry / fadeDuration;
            mapping.velocity *= fadeProgress;
            mapping.isFadingIn = true;
          }
        }
      });
    });

    return mappings;
  }
}
```

**Conversation Pattern:**
```typescript
// Dynamic turn-taking based on graph structure
// Nodes with bidirectional links "respond" to each other

class ConversationTurnTaking {
  assignTurns(mappings: DepthMapping[], data: LocalSoundscapeData): DepthMapping[] {
    // Build conversation pairs from bidirectional links
    const conversationPairs = this.identifyConversationPairs(mappings, data);

    conversationPairs.forEach(({ callNode, responseNode }) => {
      const callMapping = mappings.find(m => m.nodeId === callNode.id);
      const responseMapping = mappings.find(m => m.nodeId === responseNode.id);

      if (callMapping && responseMapping) {
        // Call plays first
        callMapping.isSolo = true;

        // Response plays after call completes (with slight overlap)
        const responseTiming = callMapping.timing + callMapping.duration * 0.8;
        responseMapping.timing = responseTiming;
        responseMapping.isSolo = true;

        // Other instruments during this conversation are reduced
        mappings
          .filter(m =>
            m.nodeId !== callNode.id &&
            m.nodeId !== responseNode.id &&
            m.timing >= callMapping.timing &&
            m.timing < responseMapping.timing + responseMapping.duration
          )
          .forEach(m => {
            m.velocity *= 0.4; // Heavy reduction during conversation
            m.isAccompaniment = true;
          });
      }
    });

    return mappings;
  }

  private identifyConversationPairs(
    mappings: DepthMapping[],
    data: LocalSoundscapeData
  ): Array<{ callNode: LocalSoundscapeNode; responseNode: LocalSoundscapeNode }> {
    const pairs: Array<{ callNode: LocalSoundscapeNode; responseNode: LocalSoundscapeNode }> = [];

    // Find bidirectional links in the graph
    data.nodesByDepth.forEach(nodes => {
      nodes.forEach(node => {
        if (node.direction === 'bidirectional') {
          // This node has mutual connections - it's part of a conversation
          const partnerNode = this.findConversationPartner(node, data);
          if (partnerNode) {
            pairs.push({ callNode: node, responseNode: partnerNode });
          }
        }
      });
    });

    return pairs;
  }
}
```

**Fugue Pattern:**
```typescript
// Imitative entries with staggered timing (baroque-style)
// Each instrument enters with same melodic material, offset in time

class FugueTurnTaking {
  assignTurns(mappings: DepthMapping[], config: TurnTakingConfig): DepthMapping[] {
    const instrumentGroups = this.groupMappingsByInstrument(mappings);
    const instruments = Array.from(instrumentGroups.keys());
    const entryDelay = config.turnDivision.turnLength; // Time between entries

    instruments.forEach((instrument, voiceIndex) => {
      instrumentGroups.get(instrument)?.forEach(mapping => {
        // Offset timing by voice index * entry delay
        mapping.timing += voiceIndex * entryDelay;

        // Apply imitative melodic transformation (optional)
        // E.g., transpose each voice to create harmonic structure
        if (voiceIndex > 0) {
          const transposition = this.getFugalTransposition(voiceIndex);
          mapping.pitch *= Math.pow(2, transposition / 12);
        }
      });
    });

    return this.sortByTiming(mappings);
  }

  private getFugalTransposition(voiceIndex: number): number {
    // Traditional fugue: Answer at fifth above/below
    const transpositions = [0, 7, 0, 7]; // Tonic, Dominant, Tonic, Dominant
    return transpositions[voiceIndex % transpositions.length];
  }
}
```

**Antiphonal Pattern:**
```typescript
// Spatial alternation between left and right channels
// Creates stereo "ping-pong" effect

class AntiphonalTurnTaking {
  assignTurns(mappings: DepthMapping[], config: TurnTakingConfig): DepthMapping[] {
    const leftGroup = mappings.filter(m => m.pan < -0.3); // Left channel
    const rightGroup = mappings.filter(m => m.pan > 0.3); // Right channel
    const centerGroup = mappings.filter(m => Math.abs(m.pan) <= 0.3);

    const turnLength = config.turnDivision.turnLength;
    let currentTime = 0;
    let isLeftTurn = true;

    while (currentTime < this.getTotalDuration(mappings)) {
      const activeGroup = isLeftTurn ? leftGroup : rightGroup;
      const silentGroup = isLeftTurn ? rightGroup : leftGroup;

      // Active side plays prominently
      activeGroup
        .filter(m => m.timing >= currentTime && m.timing < currentTime + turnLength)
        .forEach(m => m.isSolo = true);

      // Opposite side is reduced
      silentGroup
        .filter(m => m.timing >= currentTime && m.timing < currentTime + turnLength)
        .forEach(m => {
          m.velocity *= 0.3;
          m.isAccompaniment = true;
        });

      // Center always provides subtle foundation
      centerGroup
        .filter(m => m.timing >= currentTime && m.timing < currentTime + turnLength)
        .forEach(m => {
          m.velocity *= 0.5;
          m.isAccompaniment = true;
        });

      currentTime += turnLength;
      isLeftTurn = !isLeftTurn;
    }

    return mappings;
  }
}
```

#### 3.8.4. Integration with Existing Systems

**Modified Mapping Flow:**
```typescript
// In DepthBasedMapper.mapSoundscapeToMusic()
async mapSoundscapeToMusic(data: LocalSoundscapeData, seed?: number): Promise<DepthMapping[]> {
  // ... existing mapping logic ...

  let mappings: DepthMapping[] = /* created mappings */;

  // Calculate timing (existing)
  this.calculateTimingForMappings(mappings);

  // NEW: Apply turn-taking pattern if enabled
  if (this.config.turnTaking.enabled) {
    const turnTakingEngine = new TurnTakingEngine(this.config.turnTaking);
    mappings = turnTakingEngine.applyPattern(mappings, data);
  }

  return mappings;
}
```

**Extended DepthMapping Interface:**
```typescript
interface DepthMapping extends MusicalMapping {
  // ... existing properties ...

  // NEW: Turn-taking metadata
  isSolo?: boolean;           // This note is featured/prominent
  isAccompaniment?: boolean;  // This note is background support
  turnIndex?: number;         // Which turn this note belongs to
  isFadingIn?: boolean;       // Currently fading in
  isFadingOut?: boolean;      // Currently fading out
  delayedEntry?: boolean;     // Entry delayed for layered build
}
```

#### 3.8.5. Playback Modifications

**Transition Handling:**
```typescript
// In LocalSoundscapeView.ts
private async playNoteFromMapping(mapping: DepthMapping): Promise<void> {
  let velocity = mapping.velocity;
  const instrument = mapping.instrument;

  // Apply turn-taking volume adjustments
  if (mapping.isAccompaniment && this.settings.turnTaking.accompaniment.enabled) {
    velocity *= this.settings.turnTaking.accompaniment.volumeReduction;
  }

  if (mapping.isSolo) {
    // Slight boost for solo passages
    velocity = Math.min(1.0, velocity * 1.1);
  }

  // Apply fade transitions if needed
  if (mapping.isFadingIn || mapping.isFadingOut) {
    await this.applyDynamicFade(mapping, velocity);
  } else {
    await this.plugin.audioEngine.playNoteImmediate({
      pitch: mapping.pitch,
      duration: mapping.duration,
      velocity: velocity,
      instrument: instrument,
    }, this.currentPlaybackTimestamp, mapping.nodeId);
  }
}

private async applyDynamicFade(mapping: DepthMapping, baseVelocity: number): Promise<void> {
  const config = this.settings.turnTaking.transitions;

  if (mapping.isFadingIn) {
    // Ramp velocity from 0 to target over fade duration
    // Use Tone.js volume automation
    const synth = await this.plugin.audioEngine.getInstrumentSynth(mapping.instrument);
    synth.volume.rampTo(
      this.velocityToDb(baseVelocity),
      config.fadeInDuration / 1000,
      '+0'
    );
  }

  // Trigger note
  await this.plugin.audioEngine.playNoteImmediate({
    pitch: mapping.pitch,
    duration: mapping.duration,
    velocity: mapping.isFadingIn ? 0 : baseVelocity,
    instrument: mapping.instrument,
  }, this.currentPlaybackTimestamp, mapping.nodeId);
}
```

#### 3.8.6. User Experience

**Before:** All instruments playing simultaneously, potential sonic congestion
**After:** Clear musical dialogue with featured instruments and supporting textures

**UI Controls:**
```
Turn-Taking Settings:
┌─────────────────────────────────────────┐
│ Enable Turn-Taking: [✓]                 │
│                                         │
│ Pattern: [Call-Response ▼]             │
│   • None (all together)                 │
│   • Sequential (one at a time)          │
│   • Call-Response (alternating groups) ✓│
│   • Solos (featured instrument)         │
│   • Layered Entry (progressive build)   │
│   • Conversation (graph-based dialogue) │
│   • Fugue (imitative entries)           │
│   • Antiphonal (stereo alternation)     │
│                                         │
│ Turn Length: [4] beats                  │
│ Turn Overlap: [0.5] seconds            │
│                                         │
│ Accompaniment:                          │
│   Volume Reduction: [====>-----] 40%    │
│   [✓] Bass instruments only             │
│                                         │
│ Transitions:                            │
│   Fade In: [300] ms                     │
│   Fade Out: [400] ms                    │
│   [✓] Crossfade                         │
└─────────────────────────────────────────┘
```

**Visual Feedback:**
- Highlight "solo" nodes with brighter pulse
- Dim "accompaniment" nodes slightly
- Show turn indicator in status bar: "Turn 2/8 - Strings"

#### 3.8.7. Musical Examples

**Call-Response (Center ↔ Periphery):**
```
Time:  0s     2s     4s     6s     8s
       ┌─────┐       ┌─────┐
Center │ 🎹  │       │ 🎹  │       (Piano - "call")
       └─────┘       └─────┘
              ┌─────┐       ┌─────┐
Depth 1       │ 🎻  │       │ 🎻  │ (Strings - "response")
              └─────┘       └─────┘
       (Quiet)       (Quiet)
```

**Solos Pattern:**
```
Phrase 1 (0-4s): Piano solo + bass pad
Phrase 2 (4-8s): Strings solo + bass pad
Phrase 3 (8-12s): Cello solo + bass pad
Phrase 4 (12-16s): Full ensemble (climax)
```

**Layered Entry:**
```
0-2s:   Piano only
2-4s:   Piano + Strings
4-6s:   Piano + Strings + Cello
6-8s:   Piano + Strings + Cello + Bass (full texture)
```

#### 3.8.8. Advanced Features

**Adaptive Turn Length:**
```typescript
// Vary turn length based on graph density
interface AdaptiveTurnConfig {
  enabled: boolean;
  densityThreshold: number; // Nodes per depth
  sparseTurnLength: number; // Longer turns for sparse areas (e.g., 8 beats)
  denseTurnLength: number;  // Shorter turns for dense areas (e.g., 2 beats)
}

private calculateAdaptiveTurnLength(mappingsInTurn: DepthMapping[]): number {
  const density = mappingsInTurn.length;

  if (density < this.config.adaptive.densityThreshold) {
    return this.config.adaptive.sparseTurnLength; // Give sparse material more time
  } else {
    return this.config.adaptive.denseTurnLength; // Quick turns for dense material
  }
}
```

**Context-Aware Pattern Selection:**
```typescript
// Automatically choose pattern based on graph structure
private selectPatternFromGraphStructure(data: LocalSoundscapeData): TurnTakingPattern {
  const centerNode = data.centerNode;
  const depth1Count = data.nodesByDepth.get(1)?.length || 0;
  const bidirectionalCount = this.countBidirectionalLinks(data);

  if (bidirectionalCount > 5) {
    return 'conversation'; // Lots of mutual connections = dialogue
  } else if (depth1Count > 10) {
    return 'layered-entry'; // Many connections = progressive build
  } else if (this.hasSymmetricStructure(data)) {
    return 'antiphonal'; // Symmetric = spatial alternation
  } else {
    return 'call-response'; // Default: center vs. periphery
  }
}
```

#### 3.8.9. Implementation Complexity

**Effort:** Medium (10-14 hours)
- Core turn-taking engine: 4-6 hours
- Pattern implementations: 4-6 hours
- UI controls: 2 hours
- Testing and refinement: 2 hours

**Risk:** Medium
- Timing complexity for overlapping turns
- Audio fade coordination with playback
- Pattern selection for different graph structures

**Dependencies:**
- Rhythmic Pattern System (for turn length alignment with beats)
- Instrument Selection Improvements (for consistent instrument pools)
- None (can work independently otherwise)

#### 3.8.10. Testing Strategy

**Unit Tests:**
```typescript
describe('TurnTakingEngine', () => {
  it('should assign sequential turns correctly', () => {
    const mappings = createTestMappings(12); // 12 notes
    const config = { pattern: 'sequential', turnLength: 4 };
    const result = engine.applyPattern(mappings, config);

    // Verify only one instrument is "solo" at any time
    expect(getSoloInstrumentsAt(result, 2)).toHaveLength(1);
  });

  it('should create call-response alternation', () => {
    const mappings = createDepthMappings([0, 1, 0, 1, 0, 1]);
    const result = engine.applyCallResponse(mappings, config);

    // Verify center and periphery alternate
    expect(getActiveGroupAt(result, 0)).toBe('center');
    expect(getActiveGroupAt(result, 4)).toBe('periphery');
  });

  it('should apply volume reduction to accompaniment', () => {
    const mappings = createTestMappings(8);
    const config = { accompaniment: { volumeReduction: 0.6 } };
    const result = engine.applySolos(mappings, config);

    // Verify accompaniment is quieter
    const accomp = result.filter(m => m.isAccompaniment)[0];
    expect(accomp.velocity).toBeLessThan(result.filter(m => m.isSolo)[0].velocity);
  });
});
```

**Perceptual Tests:**
- A/B comparison: all-together vs. turn-taking
- Pattern preference: which patterns sound most musical?
- Clarity rating: can you hear individual instruments better?

---

## 4. Implementation Roadmap

### Phase 1: Foundation (Quick Wins)

**Priority:** High Impact, Low Risk

**Enhancements:**
1. **Scale Quantization** (3.1)
   - Effort: 2-4 hours
   - Impact: Immediate harmonic improvement
   - Dependencies: Add `MusicalTheoryEngine` to `DepthBasedMapper`

2. **Instrument Selection Improvements** (3.4)
   - Effort: 4-6 hours
   - Impact: Timbral consistency
   - Dependencies: None

**Total Effort:** 6-10 hours
**Deliverable:** Harmonically consonant soundscape with consistent instrumentation

---

### Phase 2: Harmonic Enrichment

**Priority:** Medium Complexity, High Musical Value

**Enhancements:**
3. **Chord Voicing System** (3.2)
   - Effort: 8-12 hours
   - Impact: Harmonic richness
   - Dependencies: Phase 1

4. **Adaptive Pitch Ranges** (3.7)
   - Effort: 4-6 hours
   - Impact: Better key integration
   - Dependencies: Phase 1

**Total Effort:** 12-18 hours
**Deliverable:** Polyphonic soundscape with key-aware ranges

---

### Phase 3: Advanced Musicality

**Priority:** High Complexity, Maximum Aesthetic Value

**Enhancements:**
5. **Melodic Arc and Tension Tracking** (3.3)
   - Effort: 12-16 hours
   - Impact: Musical narrative
   - Dependencies: Phase 1, Phase 2

6. **Rhythmic Pattern System** (3.5)
   - Effort: 10-14 hours
   - Impact: Rhythmic organization
   - Dependencies: None (independent)

7. **Dynamic Panning Enhancements** (3.6)
   - Effort: 8-10 hours
   - Impact: Spatial immersion
   - Dependencies: None (independent)

8. **Instrument Turn-Taking System** (3.8)
   - Effort: 10-14 hours
   - Impact: Textural clarity and musical dialogue
   - Dependencies: Rhythmic Patterns (for beat alignment), Instrument Selection (for consistent pools)

**Total Effort:** 40-54 hours
**Deliverable:** Fully musical soundscape with narrative arc, rhythm, spatial depth, and conversational texture

---

### Complete Roadmap Timeline

| Phase | Enhancements | Effort | Cumulative | Milestones |
|-------|-------------|--------|------------|------------|
| 1 | Scale Quantization + Instrument Selection | 6-10h | 6-10h | Harmonic coherence |
| 2 | Chord Voicing + Adaptive Pitch | 12-18h | 18-28h | Polyphonic richness |
| 3 | Tension Arc + Rhythm + Panning + Turn-Taking | 40-54h | 58-82h | Complete musicality |

**Estimated Total:** 58-82 hours of development time

---

## 5. Technical Specifications

### 5.1. Architecture Integration

**Modified Components:**

| Component | Changes | Reason |
|-----------|---------|--------|
| `DepthBasedMapper` | Add `MusicalTheoryEngine` instance | Scale quantization |
| `DepthBasedMapper` | Add `TensionArcController` | Melodic arc |
| `DepthBasedMapper` | Add `RhythmicPatternGenerator` | Rhythmic patterns |
| `DepthBasedMapper` | Add `TurnTakingEngine` | Instrument turn-taking |
| `DepthBasedMapper` | Modify `calculatePitchOffset()` | Quantization |
| `DepthBasedMapper` | Modify `selectInstrument()` | Per-depth selection |
| `DepthBasedMapper` | Add `generateChordVoicing()` | Chord voicing |
| `LocalSoundscapeView` | Modify playback loop | Polyphonic playback + turn-taking |
| `AudioEngine` | Add pan modulation support | Animated panning |

**New Components:**

| Component | Purpose | Location |
|-----------|---------|----------|
| `TensionArcController` | Melodic tension tracking | `src/audio/mapping/` |
| `RhythmicPatternGenerator` | Rhythmic timing | `src/audio/mapping/` |
| `ChordVoicingStrategy` | Chord generation | `src/audio/mapping/` |
| `TurnTakingEngine` | Instrument turn-taking patterns | `src/audio/mapping/` |

### 5.2. Configuration Schema

**Extended `LocalSoundscapeSettings`:**
```typescript
interface LocalSoundscapeSettings {
  // Existing settings...
  depth: number;
  autoPlay: boolean;
  contextAware: ContextAwareSettings;

  // NEW: Musical enhancements
  musicalEnhancements: {
    quantization: {
      enabled: boolean;
      strength: number;
      allowChromatic: boolean;
    };

    chordVoicing: ChordVoicingConfig;
    tensionTracking: TensionTrackingConfig;
    instrumentSelection: InstrumentSelectionConfig;
    rhythmicPatterns: RhythmicConfig;
    dynamicPanning: DynamicPanningConfig;
    adaptivePitch: AdaptivePitchConfig;
    turnTaking: TurnTakingConfig;
  };
}
```

### 5.3. Data Flow

```
User selects note
  ↓
LocalSoundscapeExtractor.extractFromCenter()
  ↓
DepthBasedMapper.mapSoundscapeToMusic()
  ↓
  ├─ MusicalTheoryEngine.getCurrentScale()
  ├─ calculateAdaptivePitchRange() [NEW]
  ├─ calculatePitchOffset() → quantizePitch() [NEW]
  ├─ generateChordVoicing() [NEW]
  ├─ TensionArcController.applyTensionModulation() [NEW]
  ├─ assignInstrumentsToDepths() [NEW]
  ├─ RhythmicPatternGenerator.generateTimings() [NEW]
  └─ TurnTakingEngine.applyPattern() [NEW]
  ↓
DepthMapping[] with enhanced musical parameters
  ↓
LocalSoundscapeView.playback()
  ↓
AudioEngine.playNoteImmediate() (potentially multiple times for chords)
```

### 5.4. Performance Considerations

**Computational Cost:**
- Scale quantization: ~O(n × m) where n = notes, m = scale degrees (typically ~7)
- Chord voicing: ~O(n × v) where v = voices per note (1-4)
- Tension tracking: ~O(n) for sequential analysis
- Rhythmic patterns: ~O(n) for timing generation

**Total overhead:** Estimated 10-20% increase in `mapSoundscapeToMusic()` execution time

**Memory Impact:**
- Chord voicing: 2-4x memory for polyphonic mappings
- Tension tracking: Negligible (single context object)
- Rhythmic patterns: Negligible (timing array)

**Mitigation:**
- Lazy initialization of optional features
- Disable enhancements for very large graphs (>500 nodes)
- Progressive enhancement (graceful degradation)

---

## 6. Testing Strategy

### 6.1. Unit Tests

**Test Coverage:**

| Component | Test Cases |
|-----------|-----------|
| `MusicalTheoryEngine.quantizePitch()` | Input frequency → correct scale note |
| `TensionArcController.calculateTargetTension()` | Arc shapes produce correct curves |
| `RhythmicPatternGenerator.generateArpeggio()` | Correct timing intervals |
| `ChordVoicingStrategy.generateChordVoicing()` | Correct voice leading |
| `DepthBasedMapper.calculateAdaptivePitchRange()` | Key-relative ranges |

### 6.2. Integration Tests

**Test Scenarios:**

1. **Scale Quantization:**
   - Given: Random frequencies, C Major scale
   - Expected: All frequencies snap to C Major notes

2. **Chord Voicing:**
   - Given: Single melody note, depth=0
   - Expected: 3-voice chord (root, third, fifth)

3. **Tension Arc:**
   - Given: 'arch' shape, 10 notes
   - Expected: Tension peaks at note 5

4. **Rhythmic Patterns:**
   - Given: 'arpeggio' pattern, 8 notes
   - Expected: Evenly spaced 16th notes

5. **Instrument Selection:**
   - Given: 'per-depth' mode, 3 depths
   - Expected: Same instrument for all nodes at each depth

### 6.3. Perceptual Testing

**Listening Tests:**

1. **A/B Comparison:**
   - Play same soundscape with/without enhancements
   - User rates aesthetic quality (1-10)

2. **Feature Isolation:**
   - Enable one enhancement at a time
   - Identify which features have highest impact

3. **Musical Context:**
   - Test with different keys (C Major, D Minor, etc.)
   - Test with different arc shapes
   - Test with different rhythmic patterns

**Success Criteria:**
- Users rate enhanced soundscape ≥7/10 vs. <5/10 for current
- Harmonic dissonance reduced by ≥60%
- User reports "more musical" in >80% of tests

### 6.4. Performance Testing

**Benchmarks:**

| Metric | Current | Target | Max Acceptable |
|--------|---------|--------|----------------|
| Mapping time (100 nodes) | ~50ms | <100ms | <200ms |
| Mapping time (500 nodes) | ~250ms | <500ms | <1000ms |
| Memory usage | ~5MB | <10MB | <20MB |
| Playback latency | ~10ms | <50ms | <100ms |

**Profiling:**
- Use `performance.now()` for timing critical sections
- Chrome DevTools Memory Profiler for memory analysis
- Tone.js performance monitoring for audio latency

---

## 7. Performance Considerations

### 7.1. Optimization Strategies

**Lazy Initialization:**
```typescript
// Only create musical theory engine when needed
private getMusicalTheoryEngine(): MusicalTheoryEngine {
  if (!this._musicalTheoryEngine && this.config.musicalEnhancements.quantization.enabled) {
    this._musicalTheoryEngine = new MusicalTheoryEngine(/* config */);
  }
  return this._musicalTheoryEngine;
}
```

**Caching:**
```typescript
// Cache scale frequencies for repeated lookups
private scaleFrequencyCache = new Map<string, number[]>();

private getCachedScaleFrequencies(key: string): number[] {
  if (!this.scaleFrequencyCache.has(key)) {
    const frequencies = this.musicalTheoryEngine.getCurrentScale().frequencies;
    this.scaleFrequencyCache.set(key, frequencies);
  }
  return this.scaleFrequencyCache.get(key)!;
}
```

**Batch Processing:**
```typescript
// Process all nodes at a depth together
private processDepthLayer(nodes: LocalSoundscapeNode[], depth: number): DepthMapping[] {
  // Select instrument once for entire depth
  const instrument = this.selectInstrumentForDepth(depth, nodes);

  // Map all nodes with same instrument
  return nodes.map(node => this.mapNode(node, depth, instrument));
}
```

### 7.2. Progressive Enhancement

**Graceful Degradation:**
```typescript
// Disable expensive features for large graphs
private shouldEnableEnhancement(feature: string, nodeCount: number): boolean {
  const thresholds = {
    quantization: 1000,    // Very cheap, always enable
    chordVoicing: 500,     // Moderate cost
    tensionTracking: 300,  // Expensive analysis
    rhythmicPatterns: 1000 // Cheap timing calculation
  };

  return nodeCount <= (thresholds[feature] || 500);
}
```

### 7.3. User Feedback

**Progress Indicators:**
```typescript
// Show progress during expensive operations
async mapSoundscapeToMusic(data: LocalSoundscapeData): Promise<DepthMapping[]> {
  const progressModal = new ProgressModal(this.app, 'Generating soundscape...');
  progressModal.open();

  try {
    // Step 1: Extract data (20%)
    progressModal.updateProgress(20, 'Extracting graph data...');

    // Step 2: Calculate pitch ranges (40%)
    progressModal.updateProgress(40, 'Calculating pitches...');

    // Step 3: Generate chord voicings (60%)
    progressModal.updateProgress(60, 'Creating harmonies...');

    // Step 4: Apply tension modulation (80%)
    progressModal.updateProgress(80, 'Shaping melodic arc...');

    // Step 5: Generate rhythms (100%)
    progressModal.updateProgress(100, 'Organizing rhythms...');

    return mappings;
  } finally {
    progressModal.close();
  }
}
```

---

## Appendix A: Configuration Examples

### A.1. Gentle Enhancement (Minimal Changes)

**Use Case:** User wants slight improvement without radical changes

```typescript
{
  musicalEnhancements: {
    quantization: {
      enabled: true,
      strength: 0.5,  // Only 50% quantization
      allowChromatic: true
    },
    chordVoicing: {
      enabled: false  // Keep monophonic
    },
    instrumentSelection: {
      mode: 'per-depth'  // Consistency without complexity
    },
    tensionTracking: {
      enabled: false
    },
    rhythmicPatterns: {
      enabled: false
    },
    dynamicPanning: {
      mode: 'directional'  // Keep current behavior
    }
  }
}
```

### A.2. Full Musical Experience (All Features)

**Use Case:** User wants maximum aesthetic quality

```typescript
{
  musicalEnhancements: {
    quantization: {
      enabled: true,
      strength: 0.95,
      allowChromatic: false
    },
    chordVoicing: {
      enabled: true,
      strategy: 'depth-based',
      voicesPerDepth: {
        center: 3,
        depth1: 2,
        depth2: 1,
        depth3Plus: 0
      },
      voiceLeading: {
        enabled: true,
        maxLeap: 7,
        preferContraryMotion: true
      }
    },
    tensionTracking: {
      enabled: true,
      arcShape: 'arch',
      startTension: 0.3,
      peakTension: 0.85,
      endTension: 0.15,
      modulationMethods: {
        dissonance: true,
        register: true,
        velocity: true,
        polyphony: true
      }
    },
    instrumentSelection: {
      mode: 'per-depth',
      perDepthConfig: {
        center: 'piano',
        depth1: 'strings',
        depth2: 'cello',
        depth3Plus: 'pad'
      }
    },
    rhythmicPatterns: {
      enabled: true,
      patternPerDepth: new Map([
        [0, 'sequential'],
        [1, 'arpeggio'],
        [2, 'pulse'],
        [3, 'cluster']
      ]),
      tempo: 72
    },
    dynamicPanning: {
      mode: 'circular',
      circular: {
        radius: 0.8,
        rotationSpeed: 15
      }
    },
    adaptivePitch: {
      enabled: true
    }
  }
}
```

### A.3. Ambient Soundscape (Peaceful, Atmospheric)

**Use Case:** User wants calm, meditative background music

```typescript
{
  musicalEnhancements: {
    quantization: {
      enabled: true,
      strength: 1.0,
      allowChromatic: false
    },
    chordVoicing: {
      enabled: true,
      strategy: 'depth-based',
      voicesPerDepth: {
        center: 1,
        depth1: 2,
        depth2: 2,
        depth3Plus: 1
      }
    },
    tensionTracking: {
      enabled: true,
      arcShape: 'valley',  // Low tension throughout
      startTension: 0.2,
      peakTension: 0.4,
      endTension: 0.15
    },
    instrumentSelection: {
      mode: 'per-depth',
      perDepthConfig: {
        center: 'pad',
        depth1: 'strings',
        depth2: 'bassSynth',
        depth3Plus: 'atmosphericSynth'
      }
    },
    rhythmicPatterns: {
      enabled: true,
      patternPerDepth: new Map([
        [0, 'cluster'],    // Simultaneous notes
        [1, 'decay'],      // Slow emergence
        [2, 'pulse'],      // Subtle pulse
        [3, 'ostinato']    // Repeating pattern
      ]),
      tempo: 40  // Very slow
    },
    dynamicPanning: {
      mode: 'distance',
      distance: {
        centerWidth: 0.3,
        peripheryWidth: 0.9
      }
    }
  }
}
```

---

## Appendix B: API Reference

### B.1. New Public Methods

**DepthBasedMapper:**
```typescript
class DepthBasedMapper {
  /**
   * Enable/disable musical enhancements
   */
  setMusicalEnhancements(config: MusicalEnhancementsConfig): void;

  /**
   * Get current musical theory engine (if enabled)
   */
  getMusicalTheoryEngine(): MusicalTheoryEngine | null;

  /**
   * Generate chord voicing for a frequency
   */
  generateChordVoicing(frequency: number, depth: number): number[];

  /**
   * Calculate harmonic tension at current point
   */
  getCurrentHarmonicTension(): number;
}
```

**TensionArcController:**
```typescript
class TensionArcController {
  constructor(config: TensionTrackingConfig, musicalEngine: MusicalTheoryEngine);

  /**
   * Calculate target tension for position in sequence
   */
  calculateTargetTension(position: number): number;

  /**
   * Apply tension modulation to mapping
   */
  applyTensionModulation(
    mapping: DepthMapping,
    currentTension: number,
    targetTension: number
  ): DepthMapping;
}
```

**RhythmicPatternGenerator:**
```typescript
class RhythmicPatternGenerator {
  constructor(config: RhythmicConfig);

  /**
   * Generate timing values for nodes using specified pattern
   */
  generateTimings(
    nodes: LocalSoundscapeNode[],
    pattern: RhythmicPattern,
    startTime: number
  ): number[];

  /**
   * Get beat duration in seconds
   */
  getBeatDuration(): number;

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm: number): void;
}
```

### B.2. Extended Interfaces

**DepthMapping (extended):**
```typescript
interface DepthMapping extends MusicalMapping {
  depth: number;
  direction: 'center' | 'incoming' | 'outgoing' | 'bidirectional';

  // NEW: Polyphonic support
  voices?: number[];           // Multiple frequencies for chords
  numVoices: number;          // Number of simultaneous voices

  // NEW: Musical context
  chordQuality?: ChordQuality;
  harmonicTension: number;    // 0-1

  // NEW: Rhythmic info
  beatPosition?: number;      // Position in measure
  accentLevel?: number;       // 0-1, rhythmic accent strength

  // NEW: Spatial
  panStart?: number;          // For animated panning
  panEnd?: number;
}
```

---

## Conclusion

This design document provides a comprehensive roadmap for transforming Local Soundscape from a data sonification tool into a musically sophisticated experience. By leveraging the existing `MusicalTheoryEngine` infrastructure and adding targeted enhancements, we can achieve:

- **Harmonic consonance** through scale quantization
- **Polyphonic richness** through chord voicing
- **Emotional narrative** through tension tracking
- **Rhythmic organization** through pattern generation
- **Timbral consistency** through smart instrument selection
- **Spatial immersion** through dynamic panning

The phased implementation approach allows for incremental value delivery, with Phase 1 providing immediate improvements in just 6-10 hours of development time.

**Next Steps:**
1. Review and approve this design document
2. Implement Phase 1 enhancements
3. Conduct perceptual testing
4. Iterate based on user feedback
5. Proceed to Phase 2 and 3 as resources permit
