# Local Graph Sonification - Implementation Plan

**Document Version:** 1.0
**Date:** October 4, 2025
**Status:** Planning / Design Phase
**Target Phase:** 7 or 8 (Post-Continuous Layers Stabilization)

---

## Overview

Extend Sonigraph to support real-time sonification of Obsidian's local graph view, providing an alternative to timeline-based animation. This feature will allow users to hear the structure and relationships around individual notes as they navigate their vault.

## Core Concept

Instead of animating the entire vault chronologically, sonify the **local graph** - the immediate network of connections around the currently active note. The music updates dynamically as users navigate between notes, creating an interactive, exploration-driven audio experience.

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
- Settings toggle: "Use tag-based instruments in local graph mode"
- When enabled: Uses existing instrument mapping system
- When disabled: Pure structure-based sonification (link count, depth, etc.)
- Maintains consistency with timeline mode when enabled

---

## User Experience Flow

### 1. Activation
```
User opens local graph for a note
  ↓
User clicks "Sonify Local Graph" button (new)
  ↓
Music begins based on current graph structure
  ↓
User navigates to different note
  ↓
Music smoothly transitions to new local graph context
```

### 2. Real-Time Navigation
- **Center note changes** → Melody/lead instrument shifts
- **Depth adjustment** → Layers fade in/out
- **Filter changes** → Instruments added/removed
- **Link expansion** → New harmonic elements introduced
- **Note selection** → Visual + audio highlight

### 3. Stopping
- Explicit stop button
- Switching to different view/mode
- Closing graph view (configurable)

---

## Technical Architecture

### Data Flow
```
Local Graph View
  ↓
Graph Data Extraction
  ↓
Musical Mapping Engine
  ↓
Real-Time Audio Rendering
  ↓
Dynamic Updates on Navigation
```

### Key Components

#### 1. Local Graph Data Extractor
**Purpose:** Extract graph structure from Obsidian's local graph API

**Responsibilities:**
- Get center note
- Get linked notes at each depth level
- Track link directions (incoming/outgoing)
- Monitor graph changes in real-time

**Data Structure:**
```typescript
interface LocalGraphState {
  centerNote: GraphNode;
  depthLayers: Map<number, GraphNode[]>; // depth → nodes at that depth
  incomingLinks: Map<string, GraphNode[]>; // noteId → notes linking to it
  outgoingLinks: Map<string, GraphNode[]>; // noteId → notes it links to
  maxDepth: number;
  totalNodes: number;
}
```

#### 2. Local Graph Musical Mapper
**Purpose:** Map graph structure to musical parameters

**Mapping Strategies:**
- **Center note** → Lead melody/primary instrument
- **Depth levels** → Layered harmony (closer = louder/brighter)
- **Incoming links** → Bass/foundational elements
- **Outgoing links** → Melodic/harmonic extensions
- **Link count** → Chord complexity/density
- **Graph density** → Texture/reverb amount

**Configurable Options:**
```typescript
interface LocalGraphSonificationSettings {
  mode: 'structure-only' | 'tag-influenced' | 'hybrid';
  linkDirectionMapping: {
    incoming: InstrumentCategory;
    outgoing: InstrumentCategory;
  };
  depthMapping: 'volume' | 'brightness' | 'rhythm' | 'layered';
  transitionDuration: number; // Smooth transitions between graphs
  highlightActiveNote: boolean;
}
```

#### 3. Real-Time Graph Listener
**Purpose:** Monitor navigation and update audio

**Events to Handle:**
- Active note changed
- Local graph depth changed
- Graph filters applied/removed
- Node visibility toggled
- Link relationships added/removed

**Update Strategy:**
- Debounce rapid changes (avoid audio glitches)
- Smooth transitions between states
- Maintain musical coherence during navigation

#### 4. UI Integration Points

**New Controls:**
- "Sonify Local Graph" button in graph view
- Mode switcher: Timeline | Local Graph
- Depth-to-layer visualization
- Link direction indicator

**Settings Panel:**
- Local graph sonification section
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
**Goal:** Basic local graph sonification working

- [ ] Local graph data extraction from Obsidian API
- [ ] Basic musical mapping (center + depth layers)
- [ ] Simple playback (start/stop)
- [ ] UI button in graph view
- [ ] Settings integration

**Deliverable:** Can press play on a local graph and hear the structure

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
- [ ] Visual feedback in graph

**Deliverable:** Expressive, configurable sonification

### Phase 4: Polish & Integration (1 week)
**Goal:** Production-ready feature

- [ ] UI/UX refinement
- [ ] Documentation
- [ ] Performance testing with large graphs
- [ ] User testing & feedback
- [ ] Release preparation

**Deliverable:** Shippable feature in release

---

## Performance Considerations

### Challenges
- **Rapid navigation:** User might switch notes quickly
- **Large local graphs:** Some notes have 50+ connections
- **Real-time updates:** Must maintain smooth audio

### Solutions
- **Debouncing:** Wait 100-200ms before updating audio on navigation
- **Voice pooling:** Reuse existing voices when possible
- **Fade transitions:** Smooth crossfades between graph states (500ms-1s)
- **Lazy loading:** Only load instruments for visible nodes
- **Max polyphony limits:** Enforce stricter limits in local graph mode

### Optimization Targets
- Navigation transition: < 300ms latency
- Graph update: < 100ms processing time
- Memory usage: No increase beyond timeline mode
- CPU usage: Similar to timeline animation

---

## Integration with Existing Systems

### Leverages Current Features
- **Genre Engines:** Can use ambient/atmospheric for local graph mode
- **Continuous Layers:** Perfect for graph background atmosphere
- **Instrument Mapping:** Tag-based instruments when enabled
- **Voice Manager:** Existing polyphony management
- **Settings System:** Extend with local graph options

### New Components Required
- Local graph data extractor
- Real-time graph change listener
- Transition manager (smooth audio crossfades)
- Mode switcher UI
- Local graph-specific settings panel

---

## User Settings

### Local Graph Sonification Settings
```typescript
localGraphSonification: {
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
- [ ] Can sonify graphs with 50+ nodes without performance issues
- [ ] Navigation transitions < 300ms
- [ ] No audio glitches during rapid navigation
- [ ] Memory usage comparable to timeline mode

### User Experience Success
- [ ] Clear musical difference between sparse/dense graphs
- [ ] Intuitive mapping between graph structure and sound
- [ ] Smooth, non-jarring transitions
- [ ] Useful for exploring vault structure

### Feature Adoption
- [ ] 30%+ of active users try local graph mode
- [ ] 10%+ use it regularly alongside timeline
- [ ] Positive feedback on exploration/navigation

---

## Future Enhancements (Post-Initial Release)

### Potential Additions
- **Collaborative graphs:** Sonify shared notes across vaults
- **Historical view:** Hear how a note's connections evolved
- **Path finding:** Sonify the shortest path between two notes
- **Cluster detection:** Musical highlighting of tight clusters
- **Export:** Save local graph sonification as audio
- **Presets:** Different musical styles for different graph types

### Advanced Musical Features
- **Leitmotifs:** Recurring melodies for specific notes
- **Harmonic progression:** Graph structure drives chord changes
- **Rhythmic patterns:** Link count drives rhythm complexity
- **Adaptive tempo:** Follows user's navigation speed
- **Dynamic range:** Depth controls volume envelope

---

## Open Questions

### To Research
1. **Obsidian API:** How to access local graph data programmatically?
2. **Event system:** What events fire when navigating in graph view?
3. **Performance:** Can we handle real-time updates for 100+ node graphs?
4. **UI placement:** Best location for local graph sonification controls?

### To Decide Later
1. Should graph filters (tags, folders) affect music even in structure-only mode?
2. How to handle orphaned notes (no connections)?
3. Should we support custom depth limits (1-10)?
4. Export functionality for local graph audio?

### To Test with Users
1. Is directional mapping (incoming/outgoing) intuitive?
2. Preferred transition duration (fast vs smooth)?
3. Most useful mapping strategies for exploration?
4. Should music stop when closing graph view?

---

## Dependencies

### Required Before Implementation
- [ ] Continuous layers fully stable (Phase 3 complete)
- [ ] Performance optimizations proven with large vaults
- [ ] Genre engines tested and refined
- [ ] Settings architecture ready for new sections

### External Dependencies
- Obsidian API for local graph access
- Graph view event system
- Active note tracking API

---

## Documentation Requirements

### User Documentation
- Local graph sonification guide
- Mapping strategy explanations
- Settings reference
- Best practices for exploration
- Troubleshooting common issues

### Developer Documentation
- Local graph data extraction API
- Musical mapping algorithms
- Transition system architecture
- Performance optimization guide
- Testing strategies

---

## Risk Assessment

### High Risk
- **Performance with large graphs:** Mitigation via throttling, voice limits
- **API stability:** Obsidian local graph API may change

### Medium Risk
- **User confusion:** Which mode to use? Mitigation via clear documentation
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
- Particularly useful for users who navigate their vault through notes rather than chronologically
- Could become the primary mode for smaller vaults or focused work sessions
- Opens door for other graph-based sonification (global graph, backlinks, etc.)
- Performance benefits from bounded graph size (vs entire vault)

---

**Next Steps:**
1. Complete v0.14.1 release (continuous layers fixes)
2. Stabilize Phase 3 continuous layers
3. Research Obsidian local graph API
4. Create proof-of-concept for basic sonification
5. User testing with prototype
6. Full implementation in dedicated branch
