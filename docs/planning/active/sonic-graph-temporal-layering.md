# Sonic Graph Temporal Layering Enhancement

- **Document Version:** 1.0
- **Date:** October 11, 2025
- **Status:** Planning / Design Phase
- **Target Version:** v0.17.0 or v0.18.0
- **Priority:** High - Significant UX improvement

**Background:** Local Soundscape (v0.16.0) introduced depth-based harmonic layering that creates beautiful, sustained soundscapes. Sonic Graph currently uses shorter, percussive notes that don't achieve the same musical beauty. This plan applies Local Soundscape's principles to Sonic Graph while preserving its temporal narrative.

---

## Problem Statement

### Current Sonic Graph Audio Characteristics
- **Short note durations** (0.1-2.0 seconds) - Percussive, minimal overlap
- **No layering concept** - All nodes treated equally regardless of temporal position
- **Uniform volume** - Everything competes at same level
- **Content-based mapping only** - Tags, word count, modification date
- **Result:** Rhythmic but not harmonically rich

### Local Soundscape Audio Characteristics
- **Sustained durations** (2-6 seconds) - Rich harmonic overlap
- **Depth-based layering** - Lead/harmony/bass/ambient structure
- **Volume attenuation** - Natural mixing (100% → 40% by depth)
- **Directional panning** - Spatial positioning based on graph topology
- **Result:** Beautiful, immersive, harmonically satisfying

### User Feedback
> "We haven't come close to making the Sonic Graph sound anywhere near as beautiful as the Local Soundscape."

---

## Solution: Temporal Layering (Option C - Hybrid Approach)

**Core Concept:** Apply depth-based layering principles to Sonic Graph, but use **temporal recency** instead of graph depth as the layering dimension.

### Musical Metaphor
- **Foreground (Recent):** Newly appeared nodes = Lead melody (prominent, clear)
- **Midground (Medium age):** Older visible nodes = Harmony (supportive, blended)
- **Background (Ancient):** Long-visible nodes = Ambient texture (quiet, atmospheric)

This creates an evolving soundscape where:
- New information arrives as prominent melody
- Recent information supports as harmony
- Older context fades into ambient background
- Animation drives continuous harmonic evolution

---

## Technical Architecture

### New Component: `TemporalLayerMapper`

Extends or replaces current musical mapping logic in Sonic Graph's animation callback.

```typescript
// src/audio/mapping/TemporalLayerMapper.ts

export interface TemporalLayerConfig {
  // Layer definitions based on time since appearance
  layers: {
    lead: {
      timeRange: [number, number];      // [0, 2] seconds since appearance
      instruments: string[];             // ['piano', 'organ', 'leadSynth']
      volume: number;                    // 1.0 (100%)
      pitchRange: { min: number, max: number }; // [0, 12] semitones
      durationRange: [number, number];   // [3, 6] seconds
    };
    harmony: {
      timeRange: [number, number];      // [2, 5] seconds
      instruments: string[];             // ['strings', 'electricPiano']
      volume: number;                    // 0.8 (80%)
      pitchRange: { min: number, max: number }; // [-5, 7] semitones
      durationRange: [number, number];   // [4, 8] seconds
    };
    bass: {
      timeRange: [number, number];      // [5, 10] seconds
      instruments: string[];             // ['bassSynth', 'cello']
      volume: number;                    // 0.6 (60%)
      pitchRange: { min: number, max: number }; // [-12, 0] semitones
      durationRange: [number, number];   // [5, 10] seconds
    };
    ambient: {
      timeRange: [number, number];      // [10, Infinity] seconds
      instruments: string[];             // ['pad', 'atmosphericSynth']
      volume: number;                    // 0.4 (40%)
      pitchRange: { min: number, max: number }; // [-24, -12] semitones
      durationRange: [number, number];   // [8, 15] seconds
    };
  };

  // Crossfade between layers
  crossfadeDuration: number; // Smooth transitions between layers (seconds)

  // Volume attenuation curve
  attenuationCurve: 'linear' | 'exponential' | 'logarithmic';

  // Spatial positioning
  spatialPositioning: {
    enabled: boolean;
    spreadByAge: boolean; // Older nodes spread wider in stereo field
    panningRange: [number, number]; // [-1, 1] for full stereo
  };
}

export class TemporalLayerMapper {
  private config: TemporalLayerConfig;
  private nodeAppearanceTimes: Map<string, number> = new Map(); // nodeId -> timestamp
  private musicalMapper: MusicalMapper; // Reuse existing mapper for base calculations

  constructor(config: TemporalLayerConfig, musicalMapper: MusicalMapper) {
    this.config = config;
    this.musicalMapper = musicalMapper;
  }

  /**
   * Track when a node appears in the animation
   */
  onNodeAppeared(nodeId: string, appearanceTime: number): void {
    this.nodeAppearanceTimes.set(nodeId, appearanceTime);
  }

  /**
   * Calculate musical parameters for a node based on temporal layer
   */
  mapNodeToMusic(
    node: GraphNode,
    currentTime: number
  ): TemporalMapping {
    // Calculate time since node appeared
    const appearanceTime = this.nodeAppearanceTimes.get(node.id) || currentTime;
    const timeSinceAppearance = currentTime - appearanceTime;

    // Determine which layer this node belongs to
    const layer = this.determineLayer(timeSinceAppearance);

    // Calculate base parameters using existing MusicalMapper
    const baseMapping = this.musicalMapper.mapNodeToParameters(node);

    // Apply temporal layer modifications
    return {
      nodeId: node.id,
      layer: layer.name,
      timeSinceAppearance,

      // Instrument selection from layer
      instrument: this.selectInstrumentFromLayer(layer, node),

      // Pitch adjusted for layer range
      pitch: this.calculateLayeredPitch(baseMapping.pitch, layer, node),

      // Duration from layer range (longer than current Sonic Graph)
      duration: this.calculateLayeredDuration(layer, node),

      // Volume attenuated by layer
      volume: this.calculateLayeredVolume(baseMapping.volume, layer, timeSinceAppearance),

      // Velocity from base mapping (content-aware)
      velocity: baseMapping.velocity,

      // Spatial positioning based on age
      panning: this.calculateSpatialPanning(timeSinceAppearance, node),

      // Timing immediate (triggered by animation)
      timing: 0,
      delay: 0
    };
  }

  /**
   * Determine which temporal layer a node belongs to
   */
  private determineLayer(timeSinceAppearance: number): LayerDefinition {
    if (timeSinceAppearance <= this.config.layers.lead.timeRange[1]) {
      return { name: 'lead', ...this.config.layers.lead };
    } else if (timeSinceAppearance <= this.config.layers.harmony.timeRange[1]) {
      return { name: 'harmony', ...this.config.layers.harmony };
    } else if (timeSinceAppearance <= this.config.layers.bass.timeRange[1]) {
      return { name: 'bass', ...this.config.layers.bass };
    } else {
      return { name: 'ambient', ...this.config.layers.ambient };
    }
  }

  /**
   * Calculate volume with smooth crossfade between layers
   */
  private calculateLayeredVolume(
    baseVolume: number,
    layer: LayerDefinition,
    timeSinceAppearance: number
  ): number {
    const layerVolume = layer.volume;

    // Apply crossfade if near layer boundary
    const crossfadeFactor = this.calculateCrossfade(timeSinceAppearance, layer);

    return baseVolume * layerVolume * crossfadeFactor;
  }

  /**
   * Calculate smooth crossfade between layers
   */
  private calculateCrossfade(
    timeSinceAppearance: number,
    layer: LayerDefinition
  ): number {
    const [rangeStart, rangeEnd] = layer.timeRange;
    const crossfadeDuration = this.config.crossfadeDuration;

    // Fade in at layer start
    if (timeSinceAppearance < rangeStart + crossfadeDuration) {
      return (timeSinceAppearance - rangeStart) / crossfadeDuration;
    }

    // Fade out at layer end
    if (timeSinceAppearance > rangeEnd - crossfadeDuration) {
      return (rangeEnd - timeSinceAppearance) / crossfadeDuration;
    }

    // Full volume in middle of layer
    return 1.0;
  }

  /**
   * Calculate spatial panning based on temporal age
   */
  private calculateSpatialPanning(
    timeSinceAppearance: number,
    node: GraphNode
  ): number {
    if (!this.config.spatialPositioning.enabled) {
      return 0; // Center
    }

    if (!this.config.spatialPositioning.spreadByAge) {
      return 0; // Center
    }

    // Older nodes spread wider in stereo field
    const maxAge = this.config.layers.ambient.timeRange[1];
    const ageNormalized = Math.min(timeSinceAppearance / maxAge, 1.0);

    // Use node ID as seed for consistent positioning
    const seed = this.hashNodeId(node.id);
    const panDirection = seed % 2 === 0 ? 1 : -1;

    const [minPan, maxPan] = this.config.spatialPositioning.panningRange;
    return panDirection * (minPan + (ageNormalized * (maxPan - minPan)));
  }

  /**
   * Clean up disappeared nodes
   */
  onNodeDisappeared(nodeId: string): void {
    this.nodeAppearanceTimes.delete(nodeId);
  }
}

interface TemporalMapping {
  nodeId: string;
  layer: 'lead' | 'harmony' | 'bass' | 'ambient';
  timeSinceAppearance: number;
  instrument: string;
  pitch: number;
  duration: number;
  volume: number;
  velocity: number;
  panning: number;
  timing: number;
  delay: number;
}
```

---

## Integration with Sonic Graph

### Current Animation Callback (SonicGraphView.ts)

```typescript
// Current implementation in onNodeAppeared callback
private onNodeAppeared(node: GraphNode): void {
  const mapping = this.plugin.musicalMapper.mapNodeToParameters(node);
  await this.plugin.audioEngine.playNoteImmediate(mapping, ...);
}
```

### Enhanced with Temporal Layering

```typescript
// Enhanced implementation
private temporalLayerMapper: TemporalLayerMapper;

private async onNodeAppeared(node: GraphNode): Promise<void> {
  // Track appearance time
  const currentTime = this.temporalAnimator.getState().currentTime;
  this.temporalLayerMapper.onNodeAppeared(node.id, currentTime);

  // Get temporally-layered mapping
  const mapping = this.temporalLayerMapper.mapNodeToMusic(node, currentTime);

  // Play with enhanced parameters
  await this.plugin.audioEngine.playNoteImmediate(mapping, currentTime, node.id);
}

private onNodeDisappeared(node: GraphNode): void {
  // Clean up tracking
  this.temporalLayerMapper.onNodeDisappeared(node.id);
}
```

---

## Visual Integration

### Layer Indicators

Add visual feedback showing which temporal layer each node is in:

```typescript
// Color nodes by temporal layer
private updateNodeVisuals(): void {
  const currentTime = this.temporalAnimator.getState().currentTime;

  this.visibleNodes.forEach(node => {
    const timeSinceAppearance = currentTime - nodeAppearanceTimes.get(node.id);
    const layer = this.determineLayer(timeSinceAppearance);

    // Color coding
    const layerColors = {
      lead: '#FFD700',      // Gold - prominent
      harmony: '#87CEEB',   // Sky blue - supportive
      bass: '#9370DB',      // Purple - foundational
      ambient: '#708090'    // Slate gray - atmospheric
    };

    node.element.style.fill = layerColors[layer];
    node.element.style.opacity = layer === 'lead' ? 1.0 : 0.7;
  });
}
```

### Animation Speed Considerations

Temporal layering works best with moderate animation speeds:
- **Too fast:** Nodes don't stay in lead layer long enough
- **Too slow:** Takes too long to build harmonic texture
- **Sweet spot:** 30-60 second total animation duration for medium vaults

---

## Settings Integration

Add to Sonic Graph settings (Control Center → Sonic Graph tab):

```typescript
sonicGraph: {
  audio: {
    // New mode selector
    audioMode: 'percussive' | 'temporal-layering' | 'hybrid';

    // Temporal layering settings (when mode = 'temporal-layering')
    temporalLayering: {
      enabled: boolean;
      leadDuration: [number, number];      // [3, 6] seconds
      harmonyDuration: [number, number];   // [4, 8] seconds
      bassDuration: [number, number];      // [5, 10] seconds
      ambientDuration: [number, number];   // [8, 15] seconds

      // Layer timing
      leadTimeWindow: number;    // 2 seconds
      harmonyTimeWindow: number; // 3 seconds (2-5s)
      bassTimeWindow: number;    // 5 seconds (5-10s)
      // ambient is everything after

      // Volume attenuation
      leadVolume: number;     // 1.0
      harmonyVolume: number;  // 0.8
      bassVolume: number;     // 0.6
      ambientVolume: number;  // 0.4

      crossfadeDuration: number; // 0.5 seconds

      // Spatial
      spatialSpread: boolean;
      spatialSpreadAmount: number; // 0.0 to 1.0
    };
  };
}
```

---

## Implementation Phases

### Phase 1: Core Temporal Layer Engine (1 week)
- [ ] Create `TemporalLayerMapper` class
- [ ] Implement layer determination logic
- [ ] Add appearance time tracking
- [ ] Calculate layered volume/duration/pitch
- [ ] Unit tests for layer calculations

**Deliverable:** Working temporal layer engine (not yet integrated)

### Phase 2: Sonic Graph Integration (1 week)
- [ ] Integrate `TemporalLayerMapper` into `SonicGraphView`
- [ ] Track node appearance/disappearance in animation callbacks
- [ ] Pass temporal mappings to `AudioEngine`
- [ ] Handle layer transitions during animation
- [ ] Test with various animation speeds

**Deliverable:** Sonic Graph plays with temporal layering

### Phase 3: Visual Feedback (3-5 days)
- [ ] Color-code nodes by temporal layer
- [ ] Add opacity changes as nodes age
- [ ] Visual indicators for current layer
- [ ] Optional: Glow/pulse effects for lead layer

**Deliverable:** Visual representation of temporal layers

### Phase 4: Settings & Polish (3-5 days)
- [ ] Add Control Center settings card
- [ ] Audio mode selector (percussive/temporal-layering/hybrid)
- [ ] Duration range sliders for each layer
- [ ] Volume attenuation controls
- [ ] Spatial positioning toggle
- [ ] Presets (Gentle, Balanced, Dramatic)

**Deliverable:** Fully configurable temporal layering

### Phase 5: Hybrid Mode (Optional, 3-5 days)
- [ ] Blend percussive + temporal layering
- [ ] Configurable mix ratio
- [ ] Short attack with long sustain
- [ ] Best of both worlds

**Deliverable:** Maximum flexibility for user preference

**Total Estimate:** 3-4 weeks

---

## Expected Musical Results

### Before (Current Sonic Graph)
- Percussive, rhythmic
- Short notes (0.1-2.0s)
- Uniform presence
- Content drives all parameters
- **Character:** "Musical typewriter"

### After (Temporal Layering)
- Harmonic, evolving
- Sustained notes (3-15s)
- Layered by recency
- Temporal position drives layering, content drives details
- **Character:** "Cinematic soundscape"

### Specific Improvements
1. **Harmonic richness** - Overlapping sustained notes create chords
2. **Musical structure** - Clear foreground/midground/background
3. **Natural mixing** - Volume attenuation prevents mud
4. **Spatial depth** - Stereo spread creates immersion
5. **Evolving texture** - Continuously changing as animation progresses
6. **Emotional impact** - Sustained harmonies are inherently more moving

---

## Comparisons

### vs Local Soundscape
- **Local Soundscape:** Spatial depth (graph distance from center)
- **Sonic Graph Temporal Layering:** Temporal depth (time since appearance)
- **Both:** Sustained notes, layered structure, volume attenuation, spatial positioning
- **Unique to Temporal:** Dynamic evolution as animation progresses

### vs Current Sonic Graph
- **Preserves:** Temporal narrative, animation-driven playback, content-aware details
- **Enhances:** Note durations, harmonic structure, mixing, spatial positioning
- **Adds:** Layer-based instrument selection, smooth crossfades, visual layer indicators

---

## Risk Assessment

### Low Risk
- **Code reuse** - Leverages proven patterns from Local Soundscape's `DepthBasedMapper`
- **Non-breaking** - Can be optional mode, doesn't remove existing functionality
- **Incremental** - Can implement/test in phases

### Medium Risk
- **Performance** - Longer note durations = more simultaneous voices
  - **Mitigation:** Voice limiting, adaptive layer mixing
- **Animation speed dependency** - Works best at certain speeds
  - **Mitigation:** Auto-adjust layer timings based on animation duration
- **User expectation** - Some users may prefer current percussive style
  - **Mitigation:** Make it a selectable mode, preserve original as option

### Technical Challenges
- **Layer transitions** - Need smooth crossfades as nodes age
- **Voice management** - Potentially many long notes playing simultaneously
- **Animation pause/resume** - Need to handle time tracking correctly

---

## Success Metrics

### Subjective
- [ ] User feedback: "Sonic Graph sounds as beautiful as Local Soundscape"
- [ ] Emotional impact increased
- [ ] Users keep animations running longer to enjoy audio

### Objective
- [ ] Average note duration: 3-10 seconds (was 0.5-2.0s)
- [ ] Simultaneous voices: 8-16 (need to monitor performance)
- [ ] Smooth layer transitions (no pops/clicks)
- [ ] Animation plays smoothly at 60 FPS with temporal layering

### Adoption
- [ ] Users enable temporal layering mode
- [ ] Positive feedback on musical quality
- [ ] Feature becomes defining characteristic of Sonic Graph

---

## Open Questions

### Design
1. Should temporal layering be:
   - **Default mode** (replacing percussive)?
   - **Optional mode** (selectable in settings)?
   - **Additive** (hybrid with percussive)?
   - **Recommendation:** Optional mode first, default after user testing

2. Layer time windows:
   - Are 2/5/10 second windows appropriate?
   - Should they auto-adjust based on animation duration?
   - **Recommendation:** Fixed windows, add auto-adjust if needed

3. Visual feedback:
   - Color-code nodes by layer?
   - Add layer indicators to UI?
   - Subtle or prominent?
   - **Recommendation:** Subtle color coding, optional indicators

### Technical
1. Voice limiting strategy:
   - Hard limit (16 voices max)?
   - Adaptive (reduce ambient layer first)?
   - Per-layer limits?
   - **Recommendation:** Adaptive limiting, preserve lead layer

2. Animation pause handling:
   - Freeze layer calculations?
   - Continue aging nodes?
   - Reset on resume?
   - **Recommendation:** Freeze calculations during pause

3. Integration with existing features:
   - Chord fusion system?
   - Continuous layers?
   - Audio density control?
   - **Recommendation:** Work alongside, not replace

---

## Future Enhancements

### Advanced Temporal Modes
- **Reverse temporal layering** - Oldest = lead, newest = ambient
- **Cyclical layers** - Nodes cycle through layers repeatedly
- **Dynamic layer timing** - Adjust based on node importance

### Intelligent Mixing
- **Content-aware layer assignment** - Hub nodes stay in lead longer
- **Musical key detection** - Ensure harmonically compatible layering
- **Adaptive voice allocation** - Prioritize interesting notes

### Visual-Audio Sync
- **Layer-based animation effects** - Lead nodes glow/pulse
- **Audio-reactive sizing** - Node size reflects current volume
- **Waveform visualization** - Show audio activity per layer

---

## Dependencies

### Required Before Implementation
- [x] Local Soundscape complete (provides `DepthBasedMapper` reference)
- [x] Audio engine stabilized
- [ ] Sonic Graph animation system reviewed for time tracking

### External Dependencies
- Tone.js (already integrated)
- Existing `MusicalMapper` (reuse for base calculations)
- `TemporalGraphAnimator` (provides time tracking)
- `AudioEngine.playNoteImmediate()` (already implemented)

---

## Timeline

**Recommended Start:** After Local Soundscape Phase 3 complete

**Target Version:** v0.17.0 or v0.18.0

**Priority:** High - Significant user experience improvement

**Effort:** 3-4 weeks total
- Phase 1 (Core Engine): 1 week
- Phase 2 (Integration): 1 week
- Phase 3 (Visual): 3-5 days
- Phase 4 (Settings): 3-5 days
- Phase 5 (Hybrid - Optional): 3-5 days

---

## Notes

- This enhancement applies Local Soundscape's proven harmonic layering principles to Sonic Graph's temporal narrative
- Preserves what makes Sonic Graph unique (temporal animation) while adding what makes Local Soundscape beautiful (sustained harmonies)
- Creates a third distinct sonic aesthetic: neither static spatial soundscape nor percussive temporal sequence, but **evolving temporal soundscape**
- Can coexist with current percussive mode as user preference
- Relatively low implementation risk due to code reuse from Local Soundscape

---

**Next Steps:**
1. User validation: Is temporal layering the right approach?
2. Prototype layer calculation algorithm
3. Test with sample animation to verify layer timing
4. Create `TemporalLayerMapper` class
5. Integrate with one Sonic Graph animation as proof-of-concept
6. User testing with prototype
7. Full implementation if validated
8. Consider making it default if overwhelmingly preferred
