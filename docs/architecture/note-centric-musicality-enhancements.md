# Note-Centric Musicality Enhancements

**Status**: Phase 1 (Implemented) + Phase 2 (Proposed)
**Last Updated**: 2025-11-09
**Related Files**:
- [src/audio/mapping/NoteCentricMapper.ts](../../src/audio/mapping/NoteCentricMapper.ts)
- [src/audio/playback/NoteCentricPlayer.ts](../../src/audio/playback/NoteCentricPlayer.ts)
- [docs/user-guides/local-soundscape.md](../user-guides/local-soundscape.md)

---

## Overview

This document describes the evolution of the note-centric playback system from basic prose-to-music mapping to sophisticated, human-like musical composition. The goal is to make generated music sound less "algorithmic/random" and more like something a human composer or improviser would create.

## Phase 1: Implemented Refinements (v0.17.0)

These enhancements have been implemented and are active in the current system.

### 1.1 Harmonic Sophistication

**Problem Solved**: Original harmony was too simple and predictable (basic I-IV-V progressions).

**Implementation** ([NoteCentricMapper.ts:370-538](../../src/audio/mapping/NoteCentricMapper.ts#L370-L538)):

```typescript
// Extremely adventurous harmony with low thresholds
- Expressiveness threshold: 0.1 (was 0.3) - triggers exotic colors much more frequently
- 10+ harmonic color options per chord position:
  * Original chord
  * Added 9th extensions
  * V7 dominant seventh
  * Secondary dominants (IV becomes V/V)
  * Modal interchange (I ↔ bVI, I ↔ III)
  * Lydian color (#IVdim)
  * Sus4/Sus2 chromatic neighbors
  * Tritone substitutions
  * More...

- Chromatic voice leading (threshold 0.2, was 0.4):
  * Passing chords on intervals > 2 semitones (was > 3)
  * Chromatic approach from above/below
  * Frequent tritone substitutions (5% frequency)
  * Augmented sixth chords (6% frequency)

- Strong cadential motion:
  * Half cadences at phrase ends (V)
  * Perfect authentic cadences at final phrase (V → I)
```

**Musical Result**: Rich jazz-influenced harmony with unexpected chromatic colors, modal interchange, and sophisticated voice leading.

### 1.2 Dynamic Expression

**Problem Solved**: Velocity was too uniform, lacking the dramatic dynamic range of human performance.

**Implementation** ([NoteCentricMapper.ts:645-729](../../src/audio/mapping/NoteCentricMapper.ts#L645-L729)):

```typescript
// Expanded velocity range: 0.08 - 0.99 (was 0.25 - 0.85)
- Base velocity: 0.20 + (expressiveness × 0.7)

- Forced dynamic extremes:
  * Every 10th note: forced pianissimo (≤ 0.12)
  * Every 8th note: forced fortissimo (≥ 0.95)
  * Every 12th note: forced mezzo-piano (≤ 0.40)

- Dramatic phrase shaping:
  * Ultra dramatic arcs (0.25-1.0 range)
  * Complex micro-dynamics (±0.35 variation)
  * Strong beat accents (×1.25 on downbeats, ×1.12 on backbeats)

- Embellishment contrasts:
  * Harmonic response: 0.35× (whispers) to 1.15× (accents)
  * Rhythmic counterpoint: 0.40× (pedal tones) to 1.25× (bass thunder)
  * Ambient texture: constant 0.35 (atmospheric layer)
```

**Musical Result**: Dramatically varied dynamics from pianissimo whispers to fortissimo accents, creating emotional depth and expressiveness.

### 1.3 Temporal Characteristics

**Problem Solved**: Timing was too mechanical and grid-locked.

**Implementation** ([NoteCentricPlayer.ts:163-167](../../src/audio/playback/NoteCentricPlayer.ts#L163-L167)):

```typescript
// Extreme micro-timing humanization: ±100-150ms per note
const humanization = (Math.random() * 150 - 75) + (Math.random() * 150 - 75);
const humanizedTime = currentTime + humanization;

- "Falling off the piano bench" effect
- Very noticeable timing imperfections
- Creates organic, improvisational feel
```

**Embellishment Timing** ([NoteCentricPlayer.ts:276-309](../../src/audio/playback/NoteCentricPlayer.ts#L276-L309)):

```typescript
// Immediate overlap for rich polyphonic density
- Harmonic response: 1-2s delays (overlaps immediately)
- Rhythmic counterpoint: 2.5-4s delays
- Ambient texture: 0-0.3s delays (essentially simultaneous)

// Stagger delays for dense layering
- Harmonic response: +1.5-2.5s per additional voice
- Rhythmic counterpoint: +2-3s per additional voice
- Ambient texture: +1-1.5s per additional voice
```

**Musical Result**: Very loose, human-like timing with rich polyphonic texture from overlapping voices.

### 1.4 Melodic Independence

**Problem Solved**: Embellishments were too tightly coupled to center melody, sounding derivative rather than conversational.

**Implementation** ([NoteCentricMapper.ts:790-878](../../src/audio/mapping/NoteCentricMapper.ts#L790-L878)):

```typescript
// Harmonic Response: Only 20% center influence (was 50%)
- Loose inversion: invertedPitch × 0.2 + centerPitch × 0.2
- HUGE random variations: ±8 semitones (was ±5)
- Strong melodic direction:
  * 40% ascending motion (increased from 30%)
  * 40% descending motion (increased from 30%)
  * More frequent leaps (every 3rd note, was every 5th)
  * New: Octave leaps every 7th note for drama
```

**Rhythmic Counterpoint** ([NoteCentricMapper.ts:880-979](../../src/audio/mapping/NoteCentricMapper.ts#L880-L979)):

```typescript
// Chromatic walking bass line
- More chromatic approach tones
- Tritone substitutions for jazz flavor (7% frequency)
- Scalar approaches mixed with chromatic
- Three bass motif patterns for variety
```

**Musical Result**: Embellishments sound like independent voices having a musical conversation, not just echoes of the center.

### 1.5 Musical Context

**Problem Solved**: Music didn't adapt to different types of prose content.

**Implementation** ([NoteCentricMapper.ts:159-189](../../src/audio/mapping/NoteCentricMapper.ts#L159-L189)):

```typescript
// Prose-driven variation
- Content-type awareness:
  * meeting-notes: Quick tempo (120 BPM), ascending contours
  * research: Slow tempo (80 BPM), contemplative arcs
  * creative: Moderate tempo (90 BPM), dynamic shapes
  * technical: Steady tempo (100 BPM), methodical patterns
  * journal: Reflective tempo (85 BPM), valley contours
  * outline: Organized tempo (110 BPM), static patterns

- Reproducible randomness: Same prose → same music
- Phrase-based structure: 4-8 note phrases
- Natural cadences: Harmonic resolution at phrase ends
```

**Musical Result**: Music that reflects the character and emotional tone of the prose content.

---

## Phase 2: Proposed Enhancements (Not Yet Implemented)

These improvements address the remaining "algorithmic/random" qualities by adding musical memory, coherence, and compositional structure.

### 2.1 Motivic Development System

**Problem**: Each phrase is generated independently with no melodic memory or development.

**Proposed Solution**: Extract and develop short musical motifs throughout the composition.

#### Design

```typescript
interface MusicalMotif {
    // 3-5 note melodic pattern
    pitchPattern: number[];      // Relative intervals (e.g., [0, 2, 4] = major third)
    rhythmPattern: number[];     // Durations (e.g., [1.0, 0.5, 2.0])

    // Motif identity
    id: string;                  // 'motif-A', 'motif-B', etc.
    sourcePhrase: number;        // Which phrase it came from
}

interface MusicalMemory {
    // Primary motifs extracted from initial phrase
    primaryMotifs: MusicalMotif[];     // 2-3 core ideas

    // Transformation history
    usageCount: Map<string, number>;   // How many times each motif used
    lastTransform: Map<string, string>; // Last transformation applied
}
```

#### Implementation Plan

**Step 1: Motif Extraction** (in `generatePhraseFromProse`):
```typescript
// After generating first phrase, extract 2-3 motifs
private extractMotifs(melody: number[], rhythm: number[]): MusicalMotif[] {
    const motifs: MusicalMotif[] = [];

    // Motif A: First 3-5 notes
    motifs.push({
        pitchPattern: this.toIntervals(melody.slice(0, 4)),
        rhythmPattern: rhythm.slice(0, 4),
        id: 'motif-A',
        sourcePhrase: 0
    });

    // Motif B: Most distinctive contour (largest leap or turn)
    const motifB = this.findMostDistinctiveGesture(melody, rhythm);
    motifs.push(motifB);

    return motifs;
}

// Convert absolute pitches to intervals
private toIntervals(pitches: number[]): number[] {
    const intervals = [0]; // First note is reference
    for (let i = 1; i < pitches.length; i++) {
        intervals.push(pitches[i] - pitches[0]);
    }
    return intervals;
}
```

**Step 2: Motif Development** (replace random phrase generation):
```typescript
private developMotif(
    motif: MusicalMotif,
    transformation: 'repeat' | 'transpose' | 'invert' | 'augment' | 'fragment',
    memory: MusicalMemory
): { melody: number[], rhythm: number[] } {

    switch (transformation) {
        case 'repeat':
            // Exact repetition at new pitch level
            return this.transposeMotif(motif, randomInterval);

        case 'transpose':
            // Move to new key area
            return this.transposeMotif(motif, +7); // Up a fifth

        case 'invert':
            // Mirror intervals (ascending becomes descending)
            return this.invertMotif(motif);

        case 'augment':
            // Stretch rhythm (2x slower)
            return {
                melody: motif.pitchPattern,
                rhythm: motif.rhythmPattern.map(d => d * 2)
            };

        case 'fragment':
            // Use only first 2-3 notes
            return {
                melody: motif.pitchPattern.slice(0, 3),
                rhythm: motif.rhythmPattern.slice(0, 3)
            };
    }
}
```

**Step 3: Phrase Generation with Memory**:
```typescript
private generatePhraseWithMemory(
    prose: ProseAnalysis,
    memory: MusicalMemory,
    phraseIndex: number
): MusicalPhrase {
    const melody: number[] = [];
    const rhythm: number[] = [];

    // Choose development strategy based on phrase position
    if (phraseIndex % 3 === 0) {
        // Every 3rd phrase: Introduce new material (variation)
        const newMaterial = this.generateNewMelody(prose, 8);
        melody.push(...newMaterial.melody);
        rhythm.push(...newMaterial.rhythm);
    } else {
        // Other phrases: Develop existing motifs
        const motifChoice = memory.primaryMotifs[phraseIndex % memory.primaryMotifs.length];
        const transformation = this.chooseTransformation(memory, motifChoice);
        const developed = this.developMotif(motifChoice, transformation, memory);

        melody.push(...developed.melody);
        rhythm.push(...developed.rhythm);

        // Track usage
        memory.usageCount.set(motifChoice.id,
            (memory.usageCount.get(motifChoice.id) || 0) + 1);
        memory.lastTransform.set(motifChoice.id, transformation);
    }

    // Continue building phrase to target length...
}
```

**Musical Result**: Composition has thematic unity - ideas stated, developed, and returned to. Much more like human composition.

### 2.2 True Call-and-Response

**Problem**: Embellishments don't actually respond to specific melodic gestures from the center.

**Proposed Solution**: Embellishments quote and answer center melody motifs.

#### Design

```typescript
private generateHarmonicResponseWithQuotation(
    centerPhrase: MusicalPhrase,
    memory: MusicalMemory,
    prose: ProseAnalysis
): MusicalPhrase {
    const melody: number[] = [];
    const rhythm: number[] = [];

    // Step 1: Quote a motif from center phrase
    const motifToQuote = memory.primaryMotifs[0]; // Use motif A

    // Delayed quotation (wait 2-4 notes)
    melody.push(...this.generateRest(2)); // Rest for 2 notes

    // Step 2: Quote the motif (transposed up a third for harmonic support)
    const quotation = this.transposeMotif(motifToQuote, 4); // Up major third
    melody.push(...quotation.melody);
    rhythm.push(...quotation.rhythm);

    // Step 3: "Answer" with inversion or variation
    const answer = this.invertMotif(motifToQuote);
    melody.push(...answer.melody);
    rhythm.push(...answer.rhythm);

    // Step 4: Fill remaining length with complementary material
    // ...

    return { melody, rhythm, harmony, velocities, tempo, totalBeats };
}
```

**Example Musical Conversation**:
```
Time:    0s      1s      2s      3s      4s      5s
Center:  [C-D-E----F-G-A---G-F-E-D-C-----------]
                  ↓ quote ↓
Response: [--------E-F-G---G-F-E---C-B-A-------]
                          ↑ answer (inversion) ↑
```

**Musical Result**: Voices "listen" to each other and respond musically, creating genuine dialogue.

### 2.3 Phrase Repetition Structure

**Problem**: Too much new material - no repetition or familiarity for the listener.

**Proposed Solution**: Generate fewer unique phrases, repeat with variation.

#### Design

```typescript
interface PhraseStructure {
    sections: {
        type: 'A' | 'B' | 'A-varied' | 'B-varied' | 'bridge';
        startBar: number;
        phrasesToGenerate: number;
    }[];
}

// Example structure for 60-second composition
const structure: PhraseStructure = {
    sections: [
        { type: 'A', startBar: 0, phrasesToGenerate: 4 },        // Introduce theme A
        { type: 'A-varied', startBar: 4, phrasesToGenerate: 4 }, // Repeat with variation
        { type: 'B', startBar: 8, phrasesToGenerate: 3 },        // Contrasting material
        { type: 'A-varied', startBar: 11, phrasesToGenerate: 3 }, // Return to A
        { type: 'A', startBar: 14, phrasesToGenerate: 2 }        // Final statement
    ]
};
```

**Variation Techniques**:
```typescript
private varyPhrase(
    originalPhrase: MusicalPhrase,
    variationType: 'ornament' | 'dynamics' | 'rhythm' | 'register'
): MusicalPhrase {
    switch (variationType) {
        case 'ornament':
            // Add passing tones and neighbor notes
            return this.addOrnaments(originalPhrase);

        case 'dynamics':
            // Same notes, different velocity contour
            return {
                ...originalPhrase,
                velocities: this.generateNewVelocityCurve(originalPhrase)
            };

        case 'rhythm':
            // Same pitches, different rhythm
            return {
                ...originalPhrase,
                rhythm: this.generateNewRhythm(originalPhrase)
            };

        case 'register':
            // Transpose to different octave
            return {
                ...originalPhrase,
                melody: originalPhrase.melody.map(p => p + 12)
            };
    }
}
```

**Musical Result**: Listener hears familiar themes return, creating sense of structure and completion. Music feels intentional rather than random stream.

### 2.4 Harmonic Anchors (Tonal Centers)

**Problem**: Harmony wanders without returning home - no tension/resolution cycles.

**Proposed Solution**: Establish "home key" and return to it periodically.

#### Design

```typescript
private generateHarmonyWithAnchors(
    prose: ProseAnalysis,
    length: number,
    phraseIndex: number,
    totalPhrases: number
): number[] {
    const harmony: number[] = [];

    // Determine if this phrase should anchor to tonic
    const shouldAnchor = (
        phraseIndex === 0 ||                    // First phrase: establish home
        phraseIndex === totalPhrases - 1 ||     // Last phrase: return home
        phraseIndex % 4 === 0                   // Every 4th phrase: touch base
    );

    if (shouldAnchor) {
        // Start and end on tonic (0)
        harmony.push(0); // I chord

        // Middle can adventure away
        const middleProgression = this.generateAdventurousProgression(length - 2);
        harmony.push(...middleProgression);

        // Return home with authentic cadence (V → I)
        harmony.push(7);  // V
        harmony.push(0);  // I
    } else {
        // Non-anchor phrases can explore distant keys
        harmony.push(...this.generateExploratoryProgression(length));
    }

    return harmony;
}
```

**Musical Result**: Harmonic journey with departure and return creates satisfying narrative arc. Tension (away from home) → Resolution (return to tonic).

### 2.5 Duration Extension Options

**Problem**: Fixed duration based on mathematical formula - can't control output length.

**Proposed Solutions**:

#### Option A: Musical Form Structure (Recommended)

```typescript
interface MusicalForm {
    intro: number;         // Bars for introduction
    themeA: number;        // Bars for primary theme
    themeB: number;        // Bars for contrasting theme
    development: number;   // Bars for development section
    recapitulation: number; // Bars for return of themes
    coda: number;          // Bars for ending
}

// Example: Generate 90-second composition (vs. current ~30s)
const extendedForm: MusicalForm = {
    intro: 4,              // 8 seconds
    themeA: 8,             // 16 seconds
    themeB: 6,             // 12 seconds
    development: 12,       // 24 seconds (motif variations)
    recapitulation: 8,     // 16 seconds (themes return)
    coda: 4                // 8 seconds
    // Total: 42 bars × ~2 seconds = ~84 seconds
};
```

**Implementation**:
```typescript
private generateExtendedComposition(
    prose: ProseAnalysis,
    form: MusicalForm
): NoteCentricMapping {
    const memory: MusicalMemory = {
        primaryMotifs: [],
        usageCount: new Map(),
        lastTransform: new Map()
    };

    // Intro: Establish atmosphere
    const introPhrases = this.generateIntro(prose, form.intro);

    // Theme A: State primary motifs
    const themeAPhrases = this.generateTheme(prose, form.themeA, 'A');
    memory.primaryMotifs = this.extractMotifs(themeAPhrases[0]);

    // Theme B: Contrasting material
    const themeBPhrases = this.generateTheme(prose, form.themeB, 'B');

    // Development: Vary and combine motifs
    const devPhrases = this.generateDevelopment(
        prose,
        form.development,
        memory
    );

    // Recapitulation: Return themes in original form
    const recapPhrases = this.recapitulateThemes(themeAPhrases, themeBPhrases);

    // Coda: Strong ending
    const codaPhrases = this.generateCoda(prose, form.coda, memory);

    // Combine all sections
    return this.assembleComposition([
        ...introPhrases,
        ...themeAPhrases,
        ...themeBPhrases,
        ...devPhrases,
        ...recapPhrases,
        ...codaPhrases
    ]);
}
```

**Musical Result**: Longer compositions with clear beginning, middle, and end. Natural musical form creates satisfying arc.

#### Option B: User-Controlled Duration Setting

```typescript
// In plugin settings
interface NoteCentricSettings {
    targetExportDuration: number; // Seconds (30, 60, 120, 180, 300)
    compositionStyle: 'concise' | 'extended' | 'epic';
}

// Map style to form
const formTemplates: Record<string, MusicalForm> = {
    'concise': {  // ~30 seconds
        intro: 2, themeA: 4, themeB: 3,
        development: 3, recapitulation: 3, coda: 1
    },
    'extended': { // ~90 seconds
        intro: 4, themeA: 8, themeB: 6,
        development: 12, recapitulation: 8, coda: 4
    },
    'epic': {     // ~3 minutes
        intro: 8, themeA: 16, themeB: 12,
        development: 24, recapitulation: 16, coda: 8
    }
};
```

**Musical Result**: User controls output length while maintaining musical coherence. No random padding - all material is compositionally justified.

---

## Implementation Roadmap

### Phase 2.1: Core Musical Memory (Highest Priority)
- [ ] Add `MusicalMemory` interface and motif extraction
- [ ] Implement motif transformations (transpose, invert, augment, fragment)
- [ ] Replace random phrase generation with memory-based development
- **Estimated Effort**: 4-6 hours
- **Impact**: HIGH - Addresses core "random" feeling

### Phase 2.2: Call-and-Response Quotation
- [ ] Modify embellishment generation to quote center motifs
- [ ] Add delayed quotation timing
- [ ] Implement answer/response patterns
- **Estimated Effort**: 2-3 hours
- **Impact**: MEDIUM - Makes voices "listen" to each other

### Phase 2.3: Phrase Repetition Structure
- [ ] Define phrase structure patterns (ABA, ABAB, etc.)
- [ ] Implement phrase variation techniques
- [ ] Add section-based composition assembly
- **Estimated Effort**: 3-4 hours
- **Impact**: HIGH - Creates recognizable form

### Phase 2.4: Harmonic Anchors
- [ ] Add tonal center tracking
- [ ] Implement anchor-based progression generation
- [ ] Add cadential returns to tonic
- **Estimated Effort**: 2-3 hours
- **Impact**: MEDIUM - Improves harmonic narrative

### Phase 2.5: Duration Extension
- [ ] Design musical form templates
- [ ] Implement extended composition generation
- [ ] Add user settings for duration control
- **Estimated Effort**: 3-4 hours
- **Impact**: HIGH - Solves duration request

**Total Estimated Effort**: 14-20 hours of focused development

---

## Testing Strategy

### Subjective Musical Evaluation
1. **Thematic Unity Test**: Can you hum/remember a melody after hearing it?
2. **Conversation Test**: Do embellishments sound like they're responding to the center?
3. **Structure Test**: Can you identify when themes return?
4. **Completeness Test**: Does the piece feel finished (not abruptly cut off)?

### Technical Validation
1. **Motif Tracking**: Log when motifs are stated vs. developed
2. **Repetition Analysis**: Count how many times each unique phrase appears
3. **Harmonic Analysis**: Verify cadences occur at expected points
4. **Duration Accuracy**: Ensure extended compositions hit target lengths

### A/B Comparison
- Export same note with current system (Phase 1)
- Export same note with Phase 2 enhancements
- Compare musicality, coherence, and memorability

---

## Expected Musical Outcomes

**Before Phase 2** (Current State):
- Rich harmony and dynamics ✓
- Organic timing ✓
- Polyphonic texture ✓
- BUT: Sounds like "sophisticated randomness"

**After Phase 2** (Proposed):
- All Phase 1 qualities ✓
- PLUS: Memorable themes that develop
- PLUS: Musical conversation between voices
- PLUS: Clear beginning, middle, and end
- PLUS: User-controlled duration
- **Result**: Sounds like intentional composition/improvisation

---

## References

- **Current Implementation**: [NoteCentricMapper.ts](../../src/audio/mapping/NoteCentricMapper.ts)
- **Playback System**: [NoteCentricPlayer.ts](../../src/audio/playback/NoteCentricPlayer.ts)
- **User Documentation**: [local-soundscape.md](../user-guides/local-soundscape.md#note-centric-playback-refinements)
- **Harmonic Theory**: Jazz harmony, chromatic voice leading, modal interchange
- **Compositional Techniques**: Motivic development, ABA form, call-and-response

---

**Document Owner**: Development Team
**Review Cycle**: After each phase implementation
**Next Review**: After Phase 2.1 completion
