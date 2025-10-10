# Note Journey - Implementation Plan

**Document Version:** 1.1
**Date:** October 4, 2025
**Updated:** October 10, 2025
**Status:** Planning / Design Phase
**Target Phase:** 7 or 8 (Post-Continuous Layers Stabilization)

---

## Overview

Extend Sonigraph to support real-time sonification through **Note Journey mode**, providing an alternative to timeline-based animation. This feature will allow users to hear the structure and relationships around individual notes as they navigate their vault by following links and exploring connections.

## Core Concept

Instead of animating the entire vault chronologically, **Note Journey mode** sonifies the immediate network of connections around the currently active note. The music updates dynamically as users navigate between notes, creating an interactive, exploration-driven audio experience that follows your path through your knowledge graph.

---

## Key Design Decisions (User-Approved)

### Mode Type
**Alternative view** to timeline animation
- Separate playback mode (not replacement)
- Switchable via UI control
- Independent settings/configuration

### Trigger Behavior
**User-initiated with real-time updates**
- User presses "Play" while viewing local graph
- Playback continues as they navigate between notes
- Graph changes (center note, depth, filters) reflected in real-time
- Stops when user explicitly stops or switches modes

### Link Direction Handling
**Both directions matter**
- **Outgoing links:** Notes that the current note references
- **Incoming links:** Notes that reference the current note
- Each direction can map to different musical characteristics:
  - Pitch (outgoing = higher, incoming = lower)
  - Stereo position (outgoing = right, incoming = left)
  - Timbre (different instrument families)
  - Rhythm (different note durations/patterns)

### Tag/Folder Influence
**Optional and configurable**
- Settings toggle: "Use tag-based instruments in Note Journey mode"
- When enabled: Uses existing instrument mapping system
- When disabled: Pure structure-based sonification (link count, depth, etc.)
- Maintains consistency with timeline mode when enabled

---

## User Experience Flow

### 1. Activation
```
User opens a note in their vault
  ↓
User clicks "Start Note Journey" button (new)
  ↓
Music begins based on connections around current note
  ↓
User navigates to different note (clicks link)
  ↓
Music smoothly transitions to reflect new note's connections
```

### 2. Real-Time Navigation
- **Center note changes** → Melody/lead instrument shifts
- **Depth adjustment** → Layers fade in/out
- **Filter changes** → Instruments added/removed
- **Link expansion** → New harmonic elements introduced
- **Note selection** → Visual + audio highlight

### 3. Stopping
- Explicit stop button
- Switching to timeline mode
- Configurable auto-stop options

---

## Technical Architecture

### Data Flow
```
Active Note Detection
  ↓
Connection Graph Extraction
  ↓
Musical Mapping Engine
  ↓
Real-Time Audio Rendering
  ↓
Dynamic Updates on Navigation
```

### Key Components

#### 1. Note Journey Data Extractor
**Purpose:** Extract connection graph structure around the active note

**Responsibilities:**
- Get currently active note
- Get linked notes at each depth level
- Track link directions (incoming/outgoing)
- Monitor note changes in real-time

**Data Structure:**
```typescript
interface NoteJourneyState {
  currentNote: GraphNode;
  depthLayers: Map<number, GraphNode[]>; // depth → nodes at that depth
  incomingLinks: Map<string, GraphNode[]>; // noteId → notes linking to it
  outgoingLinks: Map<string, GraphNode[]>; // noteId → notes it links to
  maxDepth: number;
  totalNodes: number;
}
```

#### 2. Note Journey Musical Mapper
**Purpose:** Map graph structure to musical parameters

**Mapping Strategies:**
- **Current note** → Lead melody/primary instrument
- **Depth levels** → Layered harmony (closer = louder/brighter)
- **Incoming links** → Bass/foundational elements
- **Outgoing links** → Melodic/harmonic extensions
- **Link count** → Chord complexity/density
- **Graph density** → Texture/reverb amount

**Configurable Options:**
```typescript
interface NoteJourneySettings {
  mode: 'structure-only' | 'tag-influenced' | 'hybrid';
  linkDirectionMapping: {
    incoming: InstrumentCategory;
    outgoing: InstrumentCategory;
  };
  depthMapping: 'volume' | 'brightness' | 'rhythm' | 'layered';
  transitionDuration: number; // Smooth transitions between notes
  highlightActiveNote: boolean;
}
```

#### 3. Real-Time Navigation Listener
**Purpose:** Monitor note navigation and update audio

**Events to Handle:**
- Active note changed (user clicked a link)
- Graph depth changed
- Filters applied/removed
- Link relationships added/removed
- Note metadata updated

**Update Strategy:**
- Debounce rapid changes (avoid audio glitches)
- Smooth transitions between states
- Maintain musical coherence during navigation

#### 4. UI Integration Points

**New Controls:**
- "Start Note Journey" button in Control Center
- Mode switcher: Timeline | Note Journey
- Depth-to-layer visualization
- Link direction indicator

**Settings Panel:**
- Note Journey section
- Mapping configuration
- Transition settings
- Tag/folder toggle

---

## Musical Design Patterns

### Pattern 1: Depth-Based Layering
```
Center Note (Depth 0)
  → Lead melody (Piano/Synth)

Direct Links (Depth 1)
  → Harmonic support (Strings/Pads)

Second-Order (Depth 2)
  → Rhythmic foundation (Bass/Percussion)

Third-Order+ (Depth 3+)
  → Ambient atmosphere (Drones/Textures)
```

### Pattern 2: Directional Mapping
```
Outgoing Links
  → Rising melodic motifs
  → Brighter timbres
  → Right-panned

Incoming Links
  → Descending bass lines
  → Darker timbres
  → Left-panned
```

### Pattern 3: Density-Based Texture
```
Few connections (1-3)
  → Sparse, clear textures
  → Simple chords

Medium connections (4-10)
  → Rich harmonies
  → Layered instruments

Many connections (10+)
  → Dense, complex textures
  → Continuous layers active
```

---

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)
**Goal:** Basic Note Journey working

- [ ] Note connection data extraction from Obsidian API
- [ ] Basic musical mapping (current note + depth layers)
- [ ] Simple playback (start/stop)
- [ ] UI button in Control Center
- [ ] Settings integration

**Deliverable:** Can start Note Journey and hear connections around current note

### Phase 2: Real-Time Navigation (1-2 weeks)
**Goal:** Music updates as user navigates

- [ ] Active note change detection
- [ ] Smooth audio transitions
- [ ] Graph depth change handling
- [ ] Performance optimization
- [ ] Debouncing/throttling

**Deliverable:** Music follows user's navigation seamlessly

### Phase 3: Advanced Mapping (2 weeks)
**Goal:** Rich musical representation

- [ ] Directional link mapping
- [ ] Tag/folder influence toggle
- [ ] Multiple mapping strategies
- [ ] Configurable instrument assignments
- [ ] Visual feedback (optional graph overlay)

**Deliverable:** Expressive, configurable Note Journey experience

### Phase 4: Polish & Integration (1 week)
**Goal:** Production-ready feature

- [ ] UI/UX refinement
- [ ] Documentation
- [ ] Performance testing with highly connected notes
- [ ] User testing & feedback
- [ ] Release preparation

**Deliverable:** Shippable Note Journey feature

---

## Performance Considerations

### Challenges
- **Rapid navigation:** User might switch notes quickly
- **Large connection graphs:** Some notes have 50+ connections
- **Real-time updates:** Must maintain smooth audio

### Solutions
- **Debouncing:** Wait 100-200ms before updating audio on navigation
- **Voice pooling:** Reuse existing voices when possible
- **Fade transitions:** Smooth crossfades between note changes (500ms-1s)
- **Lazy loading:** Only load instruments for connected nodes
- **Max polyphony limits:** Enforce stricter limits in Note Journey mode

### Optimization Targets
- Navigation transition: < 300ms latency
- Graph update: < 100ms processing time
- Memory usage: No increase beyond timeline mode
- CPU usage: Similar to timeline animation

---

## Integration with Existing Systems

### Leverages Current Features
- **Genre Engines:** Can use ambient/atmospheric for Note Journey mode
- **Continuous Layers:** Perfect for background atmosphere
- **Instrument Mapping:** Tag-based instruments when enabled
- **Voice Manager:** Existing polyphony management
- **Settings System:** Extend with Note Journey options

### New Components Required
- Note connection data extractor
- Real-time navigation listener
- Transition manager (smooth audio crossfades)
- Mode switcher UI
- Note Journey settings panel

---

## User Settings

### Note Journey Settings
```typescript
noteJourney: {
  enabled: boolean;

  // Mapping strategy
  mappingMode: 'structure-only' | 'tag-influenced' | 'hybrid';

  // Link direction mapping
  incomingLinksAs: InstrumentCategory; // default: 'bass'
  outgoingLinksAs: InstrumentCategory; // default: 'melody'

  // Depth configuration
  maxDepthLayers: number; // default: 3
  depthMappingType: 'volume' | 'brightness' | 'rhythm' | 'layered';

  // Transition settings
  transitionDuration: number; // milliseconds, default: 800
  smoothTransitions: boolean; // default: true

  // Visual feedback
  highlightActiveNote: boolean; // default: true
  showDepthColors: boolean; // default: true

  // Performance
  maxSimultaneousNotes: number; // default: 16 (lower than timeline)
  updateThrottle: number; // milliseconds, default: 150
}
```

---

## Success Metrics

### Technical Success
- [ ] Can sonify notes with 50+ connections without performance issues
- [ ] Navigation transitions < 300ms
- [ ] No audio glitches during rapid navigation
- [ ] Memory usage comparable to timeline mode

### User Experience Success
- [ ] Clear musical difference between sparse/dense connections
- [ ] Intuitive mapping between connection structure and sound
- [ ] Smooth, non-jarring transitions
- [ ] Useful for exploring vault structure

### Feature Adoption
- [ ] 30%+ of active users try Note Journey mode
- [ ] 10%+ use it regularly alongside timeline
- [ ] Positive feedback on exploration/navigation

---

## Future Enhancements (Post-Initial Release)

### Potential Additions
- **Journey Recording:** Save and replay specific navigation paths
- **Historical view:** Hear how a note's connections evolved over time
- **Path finding:** Sonify the shortest path between two notes
- **Cluster detection:** Musical highlighting of tight clusters
- **Export:** Save Note Journey audio
- **Presets:** Different musical styles for different journey types

### Advanced Musical Features
- **Leitmotifs:** Recurring melodies for specific notes
- **Harmonic progression:** Graph structure drives chord changes
- **Rhythmic patterns:** Link count drives rhythm complexity
- **Adaptive tempo:** Follows user's navigation speed
- **Dynamic range:** Depth controls volume envelope

---

## Open Questions

### To Research
1. **Obsidian API:** How to detect active note changes?
2. **Event system:** What events fire when navigating between notes?
3. **Performance:** Can we handle real-time updates for notes with 100+ connections?
4. **UI placement:** Best location for Note Journey controls?

### To Decide Later
1. Should filters (tags, folders) affect music even in structure-only mode?
2. How to handle orphaned notes (no connections)?
3. Should we support custom depth limits (1-10)?
4. Export functionality for Note Journey audio?

### To Test with Users
1. Is directional mapping (incoming/outgoing) intuitive?
2. Preferred transition duration (fast vs smooth)?
3. Most useful mapping strategies for exploration?
4. Should music auto-stop after being idle on a note?

---

## Dependencies

### Required Before Implementation
- [ ] Continuous layers fully stable (Phase 3 complete)
- [ ] Performance optimizations proven with large vaults
- [ ] Genre engines tested and refined
- [ ] Settings architecture ready for new sections

### External Dependencies
- Obsidian API for note connections/links
- Active file change events
- Metadata cache for link data

---

## Documentation Requirements

### User Documentation
- Note Journey mode guide
- Mapping strategy explanations
- Settings reference
- Best practices for exploration
- Troubleshooting common issues

### Developer Documentation
- Note connection data extraction API
- Musical mapping algorithms
- Transition system architecture
- Performance optimization guide
- Testing strategies

---

## Risk Assessment

### High Risk
- **Performance with highly connected notes:** Mitigation via throttling, voice limits
- **API stability:** Obsidian metadata/link APIs may change

### Medium Risk
- **User confusion:** Which mode to use when? Mitigation via clear documentation
- **Musical coherence:** Transitions might sound jarring. Mitigation via smooth crossfades

### Low Risk
- **Implementation complexity:** Building on solid foundation
- **Browser compatibility:** Uses existing audio architecture

---

## Timeline Estimate

**Total:** 6-8 weeks for complete implementation

- **Phase 1 (Foundation):** 2-3 weeks
- **Phase 2 (Real-Time):** 1-2 weeks
- **Phase 3 (Advanced):** 2 weeks
- **Phase 4 (Polish):** 1 week

**Recommended Start:** After Phase 3 (Continuous Layers) is stable and deployed, likely v0.15.0 or v0.16.0 timeframe.

---

## Notes

- This feature complements timeline animation rather than replacing it
- Particularly useful for users who navigate their vault by following links between notes
- Could become the primary mode for exploration-focused work sessions
- Opens door for other connection-based features (journey recording, path sonification, etc.)
- Performance benefits from bounded connection count (vs entire vault in timeline mode)

---

**Next Steps:**
1. Complete v0.16.0+ releases (continuous layers stabilization)
2. Stabilize Phase 3 continuous layers
3. Research Obsidian note connection/link APIs
4. Create proof-of-concept for basic Note Journey
5. User testing with prototype
6. Full implementation in dedicated branch
