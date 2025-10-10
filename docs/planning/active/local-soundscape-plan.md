# Local Soundscape - Implementation Plan

- **Document Version:** 1.0
- **Date:** October 10, 2025
- **Status:** Planning / Design Phase
- **Target Version:** v0.17.0 or v0.18.0 (Before Note Journey)

**Background:** Original plan was to integrate with Obsidian's native Local Graph view, but Obsidian does not expose Graph APIs. This plan describes a custom visualization designed specifically for creating an immersive audio-visual "soundscape" around a note.

---

## Overview

Create **Local Soundscape** - a dedicated Sonigraph visualization pane that displays a note's connections with built-in sonification controls. This is our own graph rendering, designed from the ground up for synchronized audio-visual exploration of a note's local neighborhood.

## Core Concept

A standalone view that can be opened for any note, creating an immersive soundscape:
- Visual graph of connections (custom rendering using Canvas or SVG)
- Interactive depth control
- Filters (tags, folders, file types)
- Integrated play/pause/stop controls
- Visual indicators synchronized with audio

**Think of it as:** An immersive audio-visual environment centered on a single note

---

## Differences from Note Journey

| Feature | Note Journey | Local Soundscape |
|---------|--------------|------------------|
| **Purpose** | Navigation/exploration | Immersive analysis of single note |
| **Dynamic vs Static** | Follows you as you navigate | Focused soundscape around one note |
| **Update Trigger** | Clicking between notes | User manually adjusts view |
| **Visualization** | Creates graph on the fly | Deliberate, controlled soundscape |
| **UI** | Controls in Control Center | Dedicated view pane with own controls |
| **Use Case** | "Follow my journey through vault" | "Immerse myself in this note's soundscape" |

**Analogy:**
- **Note Journey** = Walking through a city, music changes as you move
- **Local Soundscape** = Standing at one location, experiencing the complete sonic environment around you

**Both are complementary:**
- Use Note Journey for exploration
- Open Local Soundscape when you want to deeply experience a specific note's audio-visual neighborhood

---

## Use Cases

### 1. Note Analysis
User right-clicks a note and selects "Open in Local Soundscape." A pane opens showing all connections at depth 2. User adjusts depth, filters, and plays sonification to experience the note's sonic neighborhood and understand its role in their vault.

### 2. Comparison
User opens Local Soundscape for two different notes (in split panes). By listening to both soundscapes, they can compare how different notes are positioned in the knowledge graph - one might be a dense hub, the other a quiet leaf.

### 3. Structure Exploration
User is trying to understand a complex topic area. They open Local Soundscape for the main topic note, increase depth to 3, and enable groups. The immersive audio-visual environment reveals clusters and sub-topics.

### 4. Visual Note-Taking
User keeps Local Soundscape open while writing. As they add new links to the current note, the view updates (when refreshed), showing and sonifying how the note's connections are growing.

---

## Technical Architecture

### Custom Graph Rendering

Since we can't use Obsidian's graph, we build our own.

**Rendering Options:**
1. **HTML Canvas** (preferred for performance)
2. **SVG** (easier manipulation, slower with many nodes)
3. **Force-directed layout** using D3.js or similar
4. **Simple radial layout** (center node in middle, depth rings around it)

**Recommended Approach:** Start with simple radial layout using Canvas, optimize later.

### Data Extraction

We have full access to note metadata through Obsidian's API:

```typescript
// Get links from MetadataCache
const file = app.vault.getAbstractFileByPath(notePath);
if (file instanceof TFile) {
  const cache = app.metadataCache.getFileCache(file);

  // Outgoing links
  const outgoing = cache.links?.map(link => link.link) || [];

  // Incoming links (backlinks)
  const incoming = app.metadataCache.getBacklinksForFile(file)
    .data.keys();
}
```

**Depth Traversal:**
- Depth 1: Direct connections of center note
- Depth 2: Connections of depth 1 notes
- Depth 3: Connections of depth 2 notes
- etc.

### View Registration

```typescript
this.registerView(
  'sonigraph-local-soundscape',
  (leaf) => new LocalSoundscapeView(leaf, this.app, this.plugin)
);
```

### Command Integration

```typescript
this.addCommand({
  id: 'open-local-soundscape',
  name: 'Open Local Soundscape for current note',
  callback: async () => {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      await this.openLocalSoundscape(activeFile);
    }
  }
});

// Context menu
this.registerEvent(
  this.app.workspace.on('file-menu', (menu, file) => {
    menu.addItem((item) => {
      item
        .setTitle('Open in Local Soundscape')
        .setIcon('radio-tower')
        .onClick(() => this.openLocalSoundscape(file));
    });
  })
);
```

---

## UI Design

### View Layout

```
┌────────────────────────────────────────────────────┐
│ Local Soundscape: "Machine Learning"               │
│ [Depth: 2] [🔍 Filter] [🎨 Groups] [🔄 Refresh]  │
├────────────────────────────────────────────────────┤
│                                                    │
│              ┌─────────────┐                      │
│              │   Neural    │                      │
│              │  Networks   │                      │
│              └─────────────┘                      │
│                      ↑                            │
│                      │                            │
│      ┌──────────────────────────────┐            │
│      │    Machine Learning           │ ← Center  │
│      │      (Current Note)           │           │
│      └──────────────────────────────┘            │
│              ↓                ↓                   │
│      ┌───────────┐    ┌───────────┐             │
│      │ Decision  │    │   Data    │             │
│      │  Trees    │    │Processing │             │
│      └───────────┘    └───────────┘             │
│                                                    │
├────────────────────────────────────────────────────┤
│ 🎵 Audio Controls                                  │
│ [▶ Play] [⏸ Pause] [⏹ Stop]                      │
│ Volume: [========>----] 80%                       │
│ Active Voices: 8 / 16                             │
│ Mode: [Tag-Influenced ▼]                          │
└────────────────────────────────────────────────────┘
```

### Control Elements

**Top Toolbar:**
- Note title (clickable to open note)
- Depth slider/selector (1-5)
- Filter button (opens filter menu)
- Groups toggle
- Refresh button (re-extract graph data)
- Settings gear

**Graph Canvas:**
- Interactive nodes (hover for details, click to open note or re-center)
- Zoom/pan controls
- Visual indicators (depth rings, link arrows, node sizes)

**Bottom Audio Panel:**
- Standard playback controls
- Volume slider
- Voice count indicator
- Mapping mode selector
- Minimal, collapsible

---

## Musical Mapping

### Foundation for Note Journey

Local Soundscape will establish the musical mapping engine that Note Journey will later reuse:

- **Local Soundscape:** Mapping updates when user adjusts depth/filters/refresh (implemented first)
- **Note Journey:** Will reuse this mapping, triggered when user navigates (implemented later)

### Mapping Strategy

**Center Note:**
- Lead melody, most prominent
- Middle pitch range
- 100% volume (relative to master)

**Depth 1:**
- Harmonic support (chords, pads)
- 80% volume
- Surround center note pitch

**Depth 2:**
- Bass/rhythmic foundation
- 60% volume
- Lower register

**Depth 3+:**
- Atmospheric textures
- 40% volume
- Ambient drones

**Directionality:**
- Incoming links → left-panned, lower pitch
- Outgoing links → right-panned, higher pitch

---

## Implementation Phases

### Phase 1: Basic View & Rendering (2-3 weeks)
**Goal:** Can open view and see basic graph

- [ ] Register custom view type
- [ ] Implement basic graph data extraction (depth 1-2)
- [ ] Render simple radial layout (Canvas)
- [ ] Add depth control
- [ ] Command to open for active note
- [ ] Context menu integration

**Deliverable:** Can open view, see connections visually

### Phase 2: Sonification Integration (2 weeks)
**Goal:** Audio works with visualization

- [ ] Integrate with existing AudioEngine
- [ ] Reuse Note Journey musical mapper
- [ ] Add play/pause/stop controls
- [ ] Sync audio with visible nodes
- [ ] Volume and voice count display

**Deliverable:** Can play audio based on visible graph

### Phase 3: Interactive Controls (2 weeks)
**Goal:** User can manipulate view and audio updates

- [ ] Depth adjustment (audio updates)
- [ ] Filter support (tags, folders, file types)
- [ ] Groups/clustering
- [ ] Refresh button
- [ ] Node interaction (hover, click to re-center)

**Deliverable:** Fully interactive graph with synced audio

### Phase 4: Visual Polish & Settings (1-2 weeks)
**Goal:** Production-ready feature

- [ ] Visual indicators (playing nodes pulse)
- [ ] Smooth transitions
- [ ] Settings panel
- [ ] Layout options (radial vs force-directed)
- [ ] Export graph as image/audio
- [ ] Documentation

**Deliverable:** Polished, shippable feature

**Total Estimate:** 7-9 weeks

---

## Challenges & Solutions

### Challenge 1: Graph Layout Performance
**Problem:** Force-directed layouts can be slow with 50+ nodes

**Solutions:**
- Start with simple radial layout (faster)
- Offer force-directed as advanced option
- Limit max nodes per depth
- Use Canvas for rendering (faster than SVG)
- Implement viewport culling (only render visible area)

**Risk Level:** Medium

### Challenge 2: Overlap with Note Journey
**Problem:** Users might be confused about when to use each feature

**Solutions:**
- Clear naming and descriptions
- Different UI locations (Note Journey in Control Center, Local Soundscape in its own pane)
- Documentation explaining use cases
- Different visual metaphors (journey vs analysis)

**Risk Level:** Low - They serve different purposes

### Challenge 3: Graph Update Frequency
**Problem:** When to refresh graph data (note changes, new links added)?

**Solutions:**
- Manual refresh button (user controls when to update)
- Optional auto-refresh on metadata change (setting)
- Show staleness indicator if data is old
- Smooth transitions when graph updates

**Risk Level:** Low

### Challenge 4: Complex Graphs
**Problem:** Hub notes with 100+ connections at depth 3

**Solutions:**
- Max depth limit (default 3, up to 5)
- Max nodes per depth (e.g., 20 most important)
- Importance scoring (link count, recent edits, tags)
- Progressive disclosure (load more nodes on demand)

**Risk Level:** Medium

---

## Integration with Existing Systems

### Leverages
- **AudioEngine:** Same playback system
- **Musical Mapper:** Same mapping logic as Note Journey
- **MetadataCache:** For extracting links
- **Settings System:** Extend with Local Soundscape section
- **Instrument Mappings:** Tag/folder mappings apply

### New Components
- **LocalSoundscapeView:** Custom view class
- **SoundscapeRenderer:** Canvas-based rendering engine
- **ConnectionExtractor:** Traverses vault for connections
- **LayoutEngine:** Positions nodes (radial or force-directed)
- **SoundscapeAudioSync:** Keeps audio synchronized with visual state

---

## Settings

```typescript
localSoundscape: {
  // Display
  defaultDepth: number; // Default depth when opening (1-5)
  maxDepth: number; // Maximum allowed depth
  layout: 'radial' | 'force-directed' | 'hierarchical';

  // Node appearance
  nodeSize: 'uniform' | 'link-count' | 'content-length';
  showNodeLabels: boolean;
  labelTruncateLength: number;

  // Link appearance
  showLinkDirection: boolean; // Arrows on links
  linkColorMode: 'uniform' | 'by-depth' | 'by-type';

  // Filters
  defaultFilters: {
    includedFileTypes: string[];
    excludedFolders: string[];
    includedTags: string[];
  };

  // Audio
  autoStartAudio: boolean; // Play when view opens
  mappingMode: 'structure-only' | 'tag-influenced' | 'hybrid';
  maxVoices: number; // Default: 16

  // Visual feedback
  pulsePlayingNodes: boolean;
  highlightActiveDepth: boolean;
  showAudioActivityIndicator: boolean;

  // Performance
  maxNodesPerDepth: number; // Limit complexity
  autoRefresh: boolean; // Update when vault changes
  refreshDebounce: number; // ms to wait before auto-refresh

  // UI
  showToolbar: boolean;
  showAudioPanel: boolean;
  compactMode: boolean;
}
```

---

## User Experience Flow

### Scenario 1: Quick Analysis
```
1. User right-clicks note "Machine Learning"
2. Selects "Open in Local Soundscape"
3. View opens in new pane, shows depth 2 by default
4. Graph displays: center node + 12 connected notes
5. User clicks [Play]
6. Music reflects structure: piano (center) + strings (depth 1) + bass (depth 2)
7. User closes view when done
```

### Scenario 2: Deep Dive
```
1. User opens Local Soundscape for "Quantum Physics"
2. Starts at depth 2, plays audio - moderately complex
3. Increases depth to 3 - more nodes appear, audio adds atmospheric layer
4. Applies filter: "Only show notes tagged #paper"
5. Graph simplifies, audio becomes more focused
6. User clicks on "Wave-Particle Duality" node in graph
7. Graph re-centers on that note
8. Audio smoothly transitions to new center's structure
9. User explores several nodes this way
```

### Scenario 3: Comparison
```
1. User splits workspace vertically
2. Opens Local Soundscape for "Classical Physics" (left pane)
3. Opens Local Soundscape for "Quantum Physics" (right pane)
4. Plays audio in left pane - simple, sparse connections
5. Plays audio in right pane (mutes left) - complex, dense connections
6. User understands: quantum physics note is more central/connected
```

---

## Success Metrics

### Technical
- [ ] Renders 50+ node graphs at 60 FPS
- [ ] Graph data extraction < 100ms for depth 3
- [ ] Audio sync delay < 200ms when adjusting view
- [ ] Smooth transitions between graph states

### User Experience
- [ ] Users understand when to use vs Note Journey
- [ ] Visual and audio feel synchronized
- [ ] Graph is readable and navigable
- [ ] Helps users understand note connections

### Adoption
- [ ] 15%+ of Sonigraph users try Local Soundscape
- [ ] Positive feedback on analysis capabilities
- [ ] Users incorporate into workflow (not just novelty)

---

## Future Enhancements

### Advanced Layouts
- Tree layout (hierarchical)
- Circular layout (all nodes on circle)
- Timeline layout (by note creation date)
- Custom layouts (user-defined positions)

### Advanced Features
- **Path finding:** Highlight shortest path between two notes
- **Cluster detection:** Auto-group related notes
- **Diff mode:** Compare graph changes over time
- **Export:** Save graph as image or audio file
- **Annotations:** Add comments/notes to graph

### Visual Enhancements
- **Animated transitions:** Smooth node movement
- **3D mode:** Three-dimensional graph rendering
- **Minimap:** Overview of large graphs
- **Search:** Find nodes by name/tag

### Audio Enhancements
- **Per-node playback:** Click node to hear just that note
- **Path sonification:** Play audio following a specific path
- **Temporal mode:** Hear how graph evolved over time

---

## Open Questions

### Design
1. Should Local Soundscape and Note Journey share settings or be independent?
2. Default depth: 2 or 3?
3. Auto-refresh on vault changes: enabled or disabled by default?
4. Should clicking a node in the graph re-center, open the note, or both (with modifier key)?

### Technical
1. Canvas vs SVG vs WebGL for rendering?
2. Simple radial layout vs force-directed as default?
3. How to handle very large graphs (100+ nodes)?
4. Should we cache rendered graphs for performance?

### User Experience
1. Should Local Soundscape be available from ribbon icon or just context menu?
2. How to indicate when graph data is stale (vault has changed)?
3. Support multiple Local Soundscapes open simultaneously?
4. Should audio auto-start when view opens?

---

## Dependencies

### Required Before Implementation
- [ ] Continuous layers stabilized (Phase 3 complete)
- [ ] Graph rendering library chosen (D3.js, vis.js, or custom)
- [ ] Performance baseline established
- [ ] User feedback on desired features
- [ ] Musical mapping architecture designed (will be reused by Note Journey)

### External Dependencies
- MetadataCache API (official)
- Workspace leaf API (official)
- Canvas API (web standard)
- Optional: Graph layout library (D3, etc.)

---

## Risk Assessment

### High Risk
None identified - all APIs are official and stable

### Medium Risk
- **Performance with large graphs:** Mitigation via limits, optimization
- **User confusion vs Note Journey:** Mitigation via clear documentation

### Low Risk
- **Graph layout quality:** Mitigation via multiple layout options
- **Visual clutter:** Mitigation via filters, compact mode

---

## Timeline Estimate

**Total:** 7-9 weeks

- Phase 1 (Basic View): 2-3 weeks
- Phase 2 (Sonification): 2 weeks
- Phase 3 (Interactive): 2 weeks
- Phase 4 (Polish): 1-2 weeks

**Recommended Start:** After continuous layers are stable (v0.17.0 timeframe)
**Note:** This will be implemented BEFORE Note Journey, as it establishes the foundational musical mapping system

---

## Notes

- This feature provides a **complementary** experience to Note Journey
- Unlike the original Local Graph Integration plan, this is **fully feasible** (doesn't require accessing Obsidian's internal graph)
- Can serve as a testbed for advanced musical mappings before applying them to other features
- Provides unique value: a dedicated, audio-aware graph analysis tool

---

**Next Steps:**
1. Stabilize continuous layers (Phase 3)
2. User research: is this feature desired?
3. Choose graph rendering approach (Canvas + simple layout vs D3.js)
4. Create UI/UX mockup
5. Design musical mapping architecture (will be foundation for Note Journey)
6. Prototype basic rendering
7. Integrate with audio engine
8. User testing with prototype
9. Full implementation
10. Use learnings to implement Note Journey later

