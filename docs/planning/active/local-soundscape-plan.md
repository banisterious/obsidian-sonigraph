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
User opens Local Soundscape for one note, listens to its soundscape, then opens Local Soundscape for a different note (which updates the view). By listening to both soundscapes sequentially, they can compare how different notes are positioned in the knowledge graph - one might be a dense hub, the other a quiet leaf.

### 3. Structure Exploration
User is trying to understand a complex topic area. They open Local Soundscape for the main topic note, increase depth to 3, and enable groups. The immersive audio-visual environment reveals clusters and sub-topics.

### 4. Visual Note-Taking
User keeps Local Soundscape open while writing. As they add new links to the current note, the view updates (when refreshed), showing and sonifying how the note's connections are growing.

---

## Technical Architecture

### Custom Graph Rendering

Since we can't use Obsidian's graph, we build our own using the same proven technology as Sonic Graph.

**Rendering Approach: D3.js + SVG**

We will use the same rendering technology as the existing Sonic Graph feature:
- **D3.js** for graph layout and manipulation
- **SVG** for rendering nodes and links
- **Radial layout** (center node in middle, depth rings around it) instead of force-directed
- Reuse existing `GraphRenderer` class or extend it for Local Soundscape-specific needs

**Why D3 + SVG:**
1. ✅ **Proven in codebase** - Sonic Graph already uses this successfully
2. ✅ **Code reuse** - Can leverage existing GraphRenderer, ContentAwarePositioning, SmartClustering
3. ✅ **Interactive by default** - SVG elements naturally support hover, click, etc.
4. ✅ **Performance optimizations already implemented** - Viewport culling, adaptive detail, frame skipping
5. ✅ **Handles 50-100+ nodes** with existing optimizations (adaptive filtering, debouncing)
6. ✅ **Consistent UX** - Users familiar with Sonic Graph will understand Local Soundscape

**Implementation Strategy:**
- Extend or adapt existing `GraphRenderer` class
- Replace force-directed simulation with simpler radial layout algorithm
- Reuse viewport culling, adaptive detail, and performance optimizations
- Keep same zoom/pan behavior users are familiar with

**No need for Canvas or WebGL** - SVG implementation already handles the scale and performance requirements.

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
│ Status: Up-to-date                                 │
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
- Depth slider/selector (1-5, default: 2)
- Filter button (opens filter menu)
- Groups toggle
- Refresh button (re-extract graph data)
- Settings gear
- Staleness indicator text line ("Up-to-date" or "Graph data is stale")

**Graph Canvas:**
- Interactive nodes with multiple interaction modes:
  - Hover: Show basic node info
  - Left-click: Display tooltip with detailed note information
  - Right-click: Open context menu with actions (Open note, Re-center soundscape, etc.)
- Zoom/pan controls (mouse wheel, drag)
- Visual indicators (depth rings, link arrows, node sizes, playing node pulse effects)

**Bottom Audio Panel:**
- Standard playback controls
- Volume slider
- Voice count indicator
- Mapping mode selector
- Minimal, collapsible

---

## Musical Mapping Architecture

### Foundation for Note Journey

Local Soundscape will establish the musical mapping engine that Note Journey will later reuse:

- **Local Soundscape:** Mapping updates when user adjusts depth/filters/refresh (implemented first)
- **Note Journey:** Will reuse this mapping, triggered when user navigates (implemented later)

### Core Concept: Depth-Based Layered Mapping

Unlike existing mapping approaches (content-aware, cluster-based, spatial), this new system maps notes based on their **graph distance (depth)** from a center node and their **link direction**.

**Key Innovation:** Creates an immersive "soundscape" where the sonic environment reflects the structure around a focal note.

### Technical Architecture

#### New Component: `DepthBasedMapper`

A new mapper class that extends/integrates with the existing `MusicalMapper`:

```typescript
// src/audio/mapping/DepthBasedMapper.ts

export interface DepthMappingConfig {
  // Instrument assignment by depth
  instrumentsByDepth: {
    center: string[];       // Lead instruments (piano, organ, leadSynth)
    depth1: string[];       // Harmony (strings, electricPiano, pad)
    depth2: string[];       // Rhythm/Bass (bass, timpani, cello)
    depth3Plus: string[];   // Ambient (pad, drone, atmosphericSynth)
  };

  // Volume attenuation by depth
  volumeByDepth: {
    center: number;      // 1.0 (100%)
    depth1: number;      // 0.8 (80%)
    depth2: number;      // 0.6 (60%)
    depth3Plus: number;  // 0.4 (40%)
  };

  // Pitch ranges by depth (in semitones relative to root)
  pitchRangesByDepth: {
    center: { min: 0, max: 12 };      // Middle register (1 octave)
    depth1: { min: -5, max: 7 };      // Surrounding center
    depth2: { min: -12, max: 0 };     // Lower register
    depth3Plus: { min: -24, max: -12 }; // Very low (ambient)
  };

  // Directional panning based on link type
  directionalPanning: {
    enabled: boolean;
    incomingLinks: number;   // -0.7 (left channel)
    outgoingLinks: number;   // +0.7 (right channel)
    bidirectional: number;   // 0.0 (center)
  };

  // Transition behavior when re-centering
  transitionSettings: {
    enabled: boolean;
    fadeOutTime: number;  // ms to fade out old center
    fadeInTime: number;   // ms to fade in new center
    crossfadeOverlap: number; // ms of overlap
  };

  // Maximum nodes per depth (performance)
  maxNodesPerDepth: number; // Default: 20-30
}

export class DepthBasedMapper {
  private config: DepthMappingConfig;
  private musicalMapper: MusicalMapper; // Reuse existing mapper
  private currentCenterNodeId: string | null = null;
  private currentMapping: Map<string, DepthMapping> = new Map();

  constructor(config: DepthMappingConfig, musicalMapper: MusicalMapper) {
    this.config = config;
    this.musicalMapper = musicalMapper;
  }

  /**
   * Create depth-based mapping from a center node
   */
  mapFromCenterNode(
    centerNodeId: string,
    graph: ConnectionGraph,
    maxDepth: number
  ): DepthMapping[] {
    // 1. Traverse graph from center, collecting nodes at each depth
    const nodesByDepth = this.traverseByDepth(centerNodeId, graph, maxDepth);

    // 2. Classify links as incoming/outgoing for directionality
    const linkDirections = this.classifyLinkDirections(centerNodeId, graph);

    // 3. Create mappings for each node based on depth and direction
    const mappings: DepthMapping[] = [];

    for (const [depth, nodes] of nodesByDepth) {
      // Limit nodes per depth for performance
      const limitedNodes = this.selectMostImportantNodes(
        nodes,
        this.config.maxNodesPerDepth
      );

      for (const node of limitedNodes) {
        const mapping = this.createDepthMapping(
          node,
          depth,
          linkDirections.get(node.id),
          graph
        );
        mappings.push(mapping);
      }
    }

    this.currentCenterNodeId = centerNodeId;
    this.updateCurrentMapping(mappings);

    return mappings;
  }

  /**
   * Recalculate mapping with new center node (smooth transition)
   */
  async recenterMapping(newCenterNodeId: string): Promise<DepthMapping[]> {
    if (!this.config.transitionSettings.enabled) {
      // Instant switch
      return this.mapFromCenterNode(newCenterNodeId, ...);
    }

    // Smooth transition:
    // 1. Fade out current mappings
    // 2. Calculate new mappings
    // 3. Crossfade to new mappings
    // 4. Update audio engine

    return newMappings;
  }

  /**
   * Traverse graph by depth using BFS
   */
  private traverseByDepth(
    centerNodeId: string,
    graph: ConnectionGraph,
    maxDepth: number
  ): Map<number, GraphNode[]> {
    const nodesByDepth = new Map<number, GraphNode[]>();
    const visited = new Set<string>();
    const queue: Array<{node: GraphNode, depth: number}> = [];

    // Start with center node at depth 0
    const centerNode = graph.nodes.get(centerNodeId);
    if (!centerNode) return nodesByDepth;

    queue.push({node: centerNode, depth: 0});
    visited.add(centerNodeId);

    while (queue.length > 0) {
      const {node, depth} = queue.shift()!;

      if (depth > maxDepth) continue;

      // Add to depth map
      if (!nodesByDepth.has(depth)) {
        nodesByDepth.set(depth, []);
      }
      nodesByDepth.get(depth)!.push(node);

      // Add connected nodes to queue
      for (const linkId of node.links) {
        const link = graph.links.get(linkId);
        if (!link) continue;

        const nextNodeId = link.source === node.id ? link.target : link.source;
        if (!visited.has(nextNodeId)) {
          const nextNode = graph.nodes.get(nextNodeId);
          if (nextNode) {
            queue.push({node: nextNode, depth: depth + 1});
            visited.add(nextNodeId);
          }
        }
      }
    }

    return nodesByDepth;
  }

  /**
   * Classify each node's relationship to center (incoming/outgoing/both)
   */
  private classifyLinkDirections(
    centerNodeId: string,
    graph: ConnectionGraph
  ): Map<string, 'incoming' | 'outgoing' | 'bidirectional'> {
    // Implementation: Check if node links TO center (incoming/backlink)
    // or center links TO node (outgoing/forward link)
    // or both (bidirectional)
  }

  /**
   * Create musical mapping for a single node based on depth
   */
  private createDepthMapping(
    node: GraphNode,
    depth: number,
    direction: 'incoming' | 'outgoing' | 'bidirectional',
    graph: ConnectionGraph
  ): DepthMapping {
    // 1. Select instrument based on depth
    const instrument = this.selectInstrumentByDepth(depth, node);

    // 2. Calculate pitch based on depth range
    const pitch = this.calculatePitchByDepth(depth, node);

    // 3. Apply volume attenuation by depth
    const volume = this.config.volumeByDepth[this.getDepthKey(depth)];

    // 4. Apply directional panning
    const pan = this.calculateDirectionalPan(direction);

    // 5. Calculate duration (can use existing MusicalMapper logic)
    const duration = this.musicalMapper.mapWordCountToDuration(node.wordCount);

    // 6. Calculate timing
    const timing = this.calculateDepthTiming(depth);

    return {
      nodeId: node.id,
      depth,
      direction,
      instrument,
      pitch,
      volume,
      pan,
      duration,
      timing
    };
  }
}

interface DepthMapping {
  nodeId: string;
  depth: number;
  direction: 'incoming' | 'outgoing' | 'bidirectional';
  instrument: string;
  pitch: number;
  volume: number;
  pan: number;
  duration: number;
  timing: number;
}
```

### Integration with Existing Systems

**Leverages:**
- Existing `MusicalMapper` for base calculations (pitch, duration, velocity)
- Existing instrument selection logic (respects enabled instruments)
- Existing spatial audio system (can combine with depth-based panning)
- Existing `AudioEngine` for playback

**Extends:**
- Adds depth-based layer concept (new)
- Adds directional panning based on graph topology (new)
- Adds smooth re-centering transitions (new)

### Mapping Strategy Details

**Center Node (Depth 0):**
- **Role:** Lead melody, focal point of soundscape
- **Instruments:** Piano, organ, leadSynth (clear, prominent timbres)
- **Pitch Range:** Middle register (C4-C5), most prominent
- **Volume:** 100% (relative to master)
- **Pan:** Center (0.0)
- **Character:** Clear, sustained, attention-grabbing

**Depth 1 (Direct Connections):**
- **Role:** Harmonic support, immediate context
- **Instruments:** Strings, electricPiano, pad (harmonic, blending timbres)
- **Pitch Range:** Surrounding center (G3-G4), creates harmonic bed
- **Volume:** 80%
- **Pan:** Directional (-0.7 for incoming, +0.7 for outgoing)
- **Character:** Supportive, harmonic, contextual

**Depth 2 (Secondary Connections):**
- **Role:** Rhythmic/bass foundation
- **Instruments:** Bass, timpani, cello (low, rhythmic timbres)
- **Pitch Range:** Lower register (C2-C3), foundational
- **Volume:** 60%
- **Pan:** Directional based on relationship to center
- **Character:** Grounding, rhythmic pulse, structural

**Depth 3+ (Distant Connections):**
- **Role:** Atmospheric textures, ambient environment
- **Instruments:** Pad, drone, atmosphericSynth (sustained, textural)
- **Pitch Range:** Very low (C1-C2), subliminal
- **Volume:** 40% (fades further with each additional depth)
- **Pan:** Wide stereo field for spatial depth
- **Character:** Ambient, atmospheric, environmental

**Directional Panning:**
- **Incoming links** (backlinks) → Pan left (-0.7), slightly lower pitch
  - *Semantic meaning:* "What references this note"
  - *Sonic character:* Bass-heavy, supportive foundation
- **Outgoing links** (forward links) → Pan right (+0.7), slightly higher pitch
  - *Semantic meaning:* "What this note references"
  - *Sonic character:* Melodic, exploratory, forward-moving
- **Bidirectional** → Center pan (0.0)
  - *Semantic meaning:* Mutual references
  - *Sonic character:* Balanced, integrated

### Re-Centering Behavior

When user clicks a node or selects "Re-center soundscape":

1. **Fade out current soundscape** (config: `fadeOutTime`)
2. **Calculate new depth mappings** from new center
3. **Cross-fade to new soundscape** (config: `crossfadeOverlap`)
4. **Update visual indicators** (graph re-centers, new depth rings)

**Transition smoothness:** Prevents jarring audio cuts, creates fluid exploration experience

### Settings Integration

Add to `SonigraphSettings`:

```typescript
depthBasedMapping: {
  enabled: boolean;
  defaultDepth: number; // 2
  maxDepth: number; // 5
  instrumentsByDepth: {...};
  volumeByDepth: {...};
  pitchRangesByDepth: {...};
  directionalPanning: {...};
  transitionSettings: {...};
  maxNodesPerDepth: number; // 20-30
}
```

---

## Implementation Phases

### Phase 1: Basic View & Rendering ✅ COMPLETE
**Goal:** Can open view and see basic graph

- [x] Register custom view type (`LocalSoundscapeView`)
- [x] Implement basic graph data extraction (depth 1-2) using `MetadataCache`
- [x] Create `LocalSoundscapeRenderer` (standalone D3 + SVG renderer)
- [x] Implement radial layout algorithm (replace force-directed)
- [x] Add depth control in UI
- [x] Command to open for active note (Command Palette)
- [x] Context menu integration (right-click note)

**Deliverable:** ✅ Can open view, see connections visually in radial layout

**Implementation Notes:**
- Used D3.js + SVG (same as Sonic Graph) for rendering
- Created standalone renderer (simpler than extending GraphRenderer)
- BFS traversal for depth-based extraction with MetadataCache
- Radial layout separates incoming (left) and outgoing (right) spatially
- Color-coded nodes: pink (incoming), cyan (outgoing), purple (bidirectional)
- Zoom/pan functionality with automatic fit-to-content

### Phase 2: Sonification Integration ✅ COMPLETE
**Goal:** Audio works with visualization

- [x] Integrate with existing AudioEngine
- [x] Create DepthBasedMapper for depth-based musical mapping
- [x] Add play/pause/stop controls
- [x] Sync audio with visible nodes (setTimeout + playNoteImmediate pattern)
- [x] Volume and voice count display
- [x] Control Center integration with three settings cards
- [x] Configurable maxNodesPerDepth performance setting (10-200 or 'all')
- [x] Instrument mapping by depth with enabled instrument filtering
- [x] Volume attenuation and directional panning controls
- [x] Sustained note durations (2-6 seconds) for harmonic texture

**Deliverable:** ✅ Can play audio based on visible graph with Control Center configuration

**Implementation Notes:**
- Switched from playSequence() to setTimeout + playNoteImmediate() for reliable triggering
- DepthBasedMapper queries AudioEngine for enabled instruments dynamically
- Frequency conversion from semitone offsets to Hz for proper playback
- 0.4 second intervals for smooth, flowing soundscape
- Default maxNodesPerDepth increased to 100 (was 30), supports unlimited with 'all'
- Proper timeout cleanup on pause/stop for resource management

### Phase 3: Interactive Controls (2 weeks)
**Goal:** User can manipulate view and audio updates

- [x] Depth adjustment (audio updates)
- [x] Refresh button
- [x] Staleness indicator
- [x] Node interaction:
  - [x] Hover tooltips (basic info)
  - [x] Left-click opens note
  - [x] Right-click context menu (Open note, Re-center soundscape)
- [x] Filter support:
  - [x] Tag filters (include/exclude)
  - [x] Folder filters (include/exclude)
  - [x] File type filters (md, pdf, image, audio, video)
  - [x] Link direction filters (incoming, outgoing, bidirectional)
- [ ] Groups/clustering

**Deliverable:** Fully interactive graph with synced audio

**Progress:**
- ✅ Depth adjustment: Dynamic re-extraction and audio restart
- ✅ Refresh button: Manual graph update with audio stop
- ✅ Staleness detection: Tracks metadata changes, visual indicator with pulse animation
- ✅ Node interaction: Hover tooltips, click to open, context menu with re-center option
- ✅ Filter system: Comprehensive filtering with modal UI
  - Filter button in header opens modal
  - Tag filters (include/exclude with tag cloud)
  - Folder filters (include/exclude with folder cloud)
  - File type checkboxes (md, pdf, image, audio, video)
  - Link direction checkboxes (incoming, outgoing, bidirectional)
  - Applied during graph extraction in real-time
- ✅ Fixed rendering lifecycle issues:
  - Tooltip/context menu now visible (document.body level, z-index 10000)
  - Graph renders consistently on file switch (renderer dispose/create cycle)
  - Container dimensions properly awaited (workspace leaf ready check)
  - Staleness indicator correctly initialized and timed (2s grace period)

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
**Problem:** Rendering can be slow with 100+ nodes

**Solutions:**
- Use radial layout (simpler than force-directed, no physics simulation)
- Reuse existing performance optimizations from Sonic Graph:
  - Viewport culling (only render visible nodes)
  - Adaptive detail filtering (reduce nodes at lower zoom)
  - Frame skipping for dense graphs
  - Update debouncing
- Limit max nodes per depth (e.g., 20-30 per depth)
- D3 + SVG proven to handle 50-100+ nodes in Sonic Graph

**Risk Level:** Low (solutions already implemented in Sonic Graph)

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
- **LocalSoundscapeView:** Custom view class (extends `ItemView`)
- **LocalSoundscapeRenderer:** Extends or adapts `GraphRenderer` with radial layout
- **ConnectionExtractor:** Traverses vault for connections (uses `MetadataCache`)
- **RadialLayoutAlgorithm:** Positions nodes in concentric circles by depth
- **SoundscapeAudioSync:** Keeps audio synchronized with visual state

### Reused Components
- **GraphRenderer:** Base rendering engine (D3 + SVG)
- **ContentAwarePositioning:** Intelligent node positioning (from Sonic Graph)
- **SmartClusteringAlgorithms:** Community detection (from Sonic Graph)
- **AdaptiveDetailManager:** Dynamic filtering based on zoom (from Sonic Graph)
- **GraphDataExtractor:** Core graph data extraction utilities

---

## Settings

**Note:** Local Soundscape settings are independent from Note Journey settings.

```typescript
localSoundscape: {
  // Display
  defaultDepth: number; // Default depth when opening (default: 2, range: 1-5)
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
  autoStartAudio: boolean; // Play when view opens (default: TBD)
  mappingMode: 'structure-only' | 'tag-influenced' | 'hybrid';
  maxVoices: number; // Default: 16

  // Visual feedback
  pulsePlayingNodes: boolean;
  highlightActiveDepth: boolean;
  showAudioActivityIndicator: boolean;

  // Performance
  maxNodesPerDepth: number; // Limit complexity
  autoRefresh: boolean; // Update when vault changes (default: true)
  refreshDebounce: number; // ms to wait before auto-refresh
  showStalenessIndicator: boolean; // Show "Up-to-date" / "Graph data is stale" (default: true)

  // UI
  showToolbar: boolean;
  showAudioPanel: boolean;
  compactMode: boolean;
}
```

**Behavior Notes:**
- Only one Local Soundscape view is supported at a time
- Opening a Local Soundscape for a different note updates the existing view (rather than creating a new one)
- Staleness indicator appears when vault metadata has changed since graph was last rendered

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

### Scenario 3: Note Switching
```
1. User opens Local Soundscape for "Classical Physics"
2. Plays audio - simple, sparse connections
3. User right-clicks "Quantum Physics" note and selects "Open in Local Soundscape"
4. View updates to show Quantum Physics (only one Local Soundscape at a time)
5. User plays audio - complex, dense connections
6. User understands: quantum physics note is more central/connected than classical physics
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
1. ~~Should Local Soundscape and Note Journey share settings or be independent?~~
   - **ANSWERED:** Independent settings for each feature
2. ~~Default depth: 2 or 3?~~
   - **ANSWERED:** Default depth 2
3. ~~Auto-refresh on vault changes: enabled or disabled by default?~~
   - **ANSWERED:** Enabled by default
4. ~~Should clicking a node in the graph re-center, open the note, or both (with modifier key)?~~
   - **ANSWERED:** Left-click shows tooltip with note info. Right-click opens context menu with option to open note.

### Technical
1. ~~Canvas vs SVG vs WebGL for rendering?~~
   - **ANSWERED:** D3.js + SVG (same as Sonic Graph) - proven, interactive, good performance
2. ~~Simple radial layout vs force-directed as default?~~
   - **ANSWERED:** Radial layout (simpler, easier to understand depth visualization)
3. How to handle very large graphs (100+ nodes)?
   - **PENDING:** TBD during implementation
4. Should we cache rendered graphs for performance?
   - **PENDING:** TBD based on performance testing

### User Experience
1. ~~Should Local Soundscape be available from ribbon icon or just context menu?~~
   - **ANSWERED:** Context menu and Command Palette only (no ribbon icon)
2. ~~How to indicate when graph data is stale (vault has changed)?~~
   - **ANSWERED:** Display text line indicating staleness ("Graph data is stale" or "Up-to-date")
3. ~~Support multiple Local Soundscapes open simultaneously?~~
   - **ANSWERED:** No - only one Local Soundscape supported. Changes when different note is opened.
4. ~~Should audio auto-start when view opens?~~
   - **ANSWERED:** Setting-controlled with default TBD (see Settings section)

---

## Dependencies

### Required Before Implementation
- [x] Continuous layers stabilized: **Complete (v0.16.0)**
- [x] Graph rendering library chosen: **D3.js** (already in use by Sonic Graph)
- [x] Musical mapping architecture designed: **Complete** (see Musical Mapping Architecture section)
- [ ] Performance baseline established
- [ ] User feedback on desired features

### External Dependencies
- MetadataCache API (official Obsidian API)
- Workspace leaf API (official Obsidian API)
- **D3.js** (already included in project dependencies)
- SVG rendering (web standard)

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

**Recommended Start:** Ready to begin (continuous layers complete in v0.16.0)
**Target Version:** v0.17.0 or v0.18.0
**Note:** This will be implemented BEFORE Note Journey, as it establishes the foundational musical mapping system

---

## Notes

- This feature provides a **complementary** experience to Note Journey
- Unlike the original Local Graph Integration plan, this is **fully feasible** (doesn't require accessing Obsidian's internal graph)
- Can serve as a testbed for advanced musical mappings before applying them to other features
- Provides unique value: a dedicated, audio-aware graph analysis tool

---

**Next Steps:**
1. ✅ ~~Stabilize continuous layers~~ **DONE: Complete in v0.16.0**
2. ✅ ~~Choose graph rendering approach~~ **DONE: D3.js + SVG (same as Sonic Graph)**
3. ✅ ~~Create UI/UX mockup~~ **DONE: [local-soundscape-mockup.html](../ui-mockups/local-soundscape-mockup.html)**
4. ✅ ~~Design musical mapping architecture~~ **DONE: DepthBasedMapper architecture documented**
5. User research: is this feature desired?
6. Prototype radial layout algorithm
7. Create `DepthBasedMapper` class in `src/audio/mapping/`
8. Create `LocalSoundscapeView` and `LocalSoundscapeRenderer`
9. Integrate DepthBasedMapper with AudioEngine
10. User testing with prototype
11. Full implementation
12. Use learnings to implement Note Journey later

