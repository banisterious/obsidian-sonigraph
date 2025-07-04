# Sonic Graph System Architecture

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
- [2. Temporal Graph Animation](#2-temporal-graph-animation)
- [3. Graph Data Extraction](#3-graph-data-extraction)
- [4. Dynamic Instrument Selection](#4-dynamic-instrument-selection)
- [5. Content Filtering & Exclusion](#5-content-filtering--exclusion)
- [6. Smart Clustering System](#6-smart-clustering-system)
- [7. Audio Integration & Timing Synchronization](#7-audio-integration--timing-synchronization)
- [8. Visual Rendering](#8-visual-rendering)
- [9. Content-Aware Positioning System](#9-content-aware-positioning-system)
- [10. Adaptive Detail Levels System](#10-adaptive-detail-levels-system)

---

## 1. Architecture Overview

The Sonic Graph System provides a comprehensive temporal graph visualization with real-time audio synchronization, enabling users to experience their knowledge graph evolution through both visual and auditory channels.

**Core Architecture:**
```
src/graph/
├── GraphDataExtractor.ts     # Vault data extraction and filtering
├── GraphRenderer.ts          # D3.js-based visualization
├── TemporalGraphAnimator.ts  # Timeline animation system
├── ContentAwarePositioning.ts # Semantic force positioning system
├── SmartClusteringAlgorithms.ts # Community detection and clustering
├── musical-mapper.ts         # Graph-to-audio mapping
└── types.ts                  # Graph data interfaces

src/ui/
├── SonicGraphModal.ts        # Main graph interface
├── FolderSuggestModal.ts     # Folder exclusion autocomplete
├── FileSuggestModal.ts       # File exclusion autocomplete
└── control-panel.ts          # Control Center integration
```

**Key Features:**
- **Multi-Level Timeline Granularity**: Configurable time scales (Year, Month, Week, Day, Hour, Custom)
- **Time Window Filtering**: Focus on specific time periods independent of granularity
- **Advanced Event Spreading**: Intelligent audio distribution to prevent crackling from simultaneous events
- **Dynamic Audio Mapping**: Respects user's Control Center instrument selections
- **Content-Aware Positioning**: Semantic forces based on tags, time, and hub centrality
- **Smart Clustering**: Automatic grouping using community detection algorithms
- **Content Filtering**: Advanced exclusion system with native Obsidian autocomplete
- **Force-Directed Layout**: D3.js simulation with organic clustering
- **Comprehensive Settings UI**: 21+ settings with detailed tooltips and Obsidian-style consistency
- **Real-time Synchronization**: Visual and audio events perfectly synchronized

## 2. Timeline Granularity System

**Multi-Level Time Controls (January 2025 Enhancement):**

The timeline granularity system provides comprehensive control over temporal visualization, addressing both visual clutter and audio crackling from simultaneous file creation events.

### Granularity Levels
```typescript
interface TimelineGranularityConfig {
  granularity: 'year' | 'month' | 'week' | 'day' | 'hour' | 'custom';
  customRange: {
    value: number;
    unit: 'years' | 'months' | 'weeks' | 'days' | 'hours';
  };
  timeWindow: 'all-time' | 'past-year' | 'past-month' | 'past-week' | 'past-day' | 'past-hour';
}
```

### Advanced Event Spreading
- **None Mode**: Events play exactly when files were created (may cause crackling)
- **Gentle Mode**: Light spreading with 100ms threshold and 2-second maximum window
- **Aggressive Mode**: Strong spreading with 50ms threshold and full spacing window
- **Batch Processing**: Handles large event clusters (>5 simultaneous events) efficiently

### Intelligent Date Range Calculation
```typescript
private calculateDateRangeFromGranularity(): void {
  // 1. Extract actual file dates from vault
  // 2. Apply time window filtering (independent of granularity)
  // 3. Respect actual date boundaries (never extend beyond file dates)
  // 4. Update animation timeline with intelligent event spacing
}
```

## 3. Temporal Graph Animation

**TemporalGraphAnimator Class:**
```typescript
export class TemporalGraphAnimator {
  private nodes: GraphNode[] = [];
  private timeline: TimelineEvent[] = [];
  private config: AnimationConfig;
  
  // Intelligent spacing configuration
  enableIntelligentSpacing: boolean = true;
  simultaneousThreshold: number = 0.1; // 100ms threshold
  maxSpacingWindow: number = 2.0; // Spread over max 2 seconds
  minEventSpacing: number = 0.05; // Minimum 50ms between events
}
```

**Timeline Building Process:**
1. **Initial Mapping**: Map file creation dates to animation timeline
2. **Cluster Detection**: Identify simultaneous events (within 100ms threshold)
3. **Intelligent Spacing**: Spread clustered events over configurable time window
4. **Consistent Ordering**: Use file hash for reproducible event ordering
5. **Final Sorting**: Ensure chronological timeline integrity

**Intelligent Spacing Algorithm:**
```typescript
private addIntelligentSpacing(events: TimelineEvent[]): TimelineEvent[] {
  const simultaneousEvents: TimelineEvent[] = [];
  
  // Collect simultaneous events
  while (Math.abs(events[i].timestamp - currentTime) <= threshold) {
    simultaneousEvents.push(events[i]);
  }
  
  // Spread them over time window
  const spacing = spacingWindow / (simultaneousEvents.length - 1);
  simultaneousEvents.forEach((event, index) => {
    event.timestamp = currentTime + (spacing * index);
  });
}
```

**Animation Controls:**
- **Play/Pause/Stop**: Full playback control with state management
- **Speed Control**: Variable speed (0.5x to 5x) with real-time adjustment
- **Seek Functionality**: Click-to-seek on timeline scrubber
- **Progress Tracking**: Real-time progress updates and completion callbacks

## 3. Graph Data Extraction

**Phase 3.9 Performance Optimization (July 2025):**
The graph data extraction system was completely overhauled to leverage Obsidian's built-in MetadataCache infrastructure for performance matching the core Graph plugin.

**GraphDataExtractor Class:**
```typescript
export class GraphDataExtractor {
  constructor(
    private app: App,
    private excludeFolders: string[] = [],
    private excludeFiles: string[] = []
  ) {}
  
  async extractGraphData(): Promise<GraphData> {
    const nodes = await this.extractNodes();
    const links = await this.extractLinks(nodes);
    return { nodes, links };
  }
}
```

**Optimized Data Processing:**
- **MetadataCache Integration**: Uses pre-computed `resolvedLinks` and `unresolvedLinks` for instant link access
- **Eliminated File Parsing**: No more regex-based content scanning or manual link resolution
- **Batch Metadata Access**: Pre-caches all metadata lookups to reduce API calls
- **Optimized Indexing**: Tag and folder relationships built with O(n) complexity
- **Performance Monitoring**: Detailed timing metrics for each extraction phase

**Node Extraction Process:**
1. **File Discovery**: Scan all vault files (notes, images, PDFs, audio, video)
2. **Optimized Metadata Extraction**: Batch-cached metadata access with timing metrics
3. **Exclusion Filtering**: Apply user-defined folder/file exclusions
4. **Type Classification**: Categorize files for appropriate visual/audio treatment

**Link Extraction Optimization:**
- **Pre-computed Links**: Direct access to `MetadataCache.resolvedLinks` (instant performance)
- **Link Strength Calculation**: Uses actual link frequency from MetadataCache
- **Intelligent Tag Connections**: O(n) tag indexing for shared tag relationships
- **Selective Folder Hierarchy**: Optimized sibling connections for smaller graphs only

**Supported File Types:**
```typescript
interface GraphNode {
  id: string;
  type: 'note' | 'image' | 'pdf' | 'audio' | 'video' | 'other';
  title: string;
  creationDate: Date;
  modificationDate: Date;
  fileSize: number;
  connections: string[];
  metadata?: {
    dimensions?: { width: number; height: number };
    dominantColors?: string[];
    tags?: string[];
  };
}
```

**Link Detection:**
- **Wikilinks**: `[[Internal Links]]` between notes
- **Markdown Links**: `[Text](path)` references
- **Embeds**: `![[Embedded Content]]` relationships
- **Tag Connections**: Shared tag relationships
- **Folder Hierarchies**: Parent-child folder relationships

## 4. Dynamic Instrument Selection

**Intelligent Instrument Mapping:**
The system dynamically selects instruments based on user's Control Center settings rather than hardcoded mappings.

**Selection Algorithm:**
```typescript
private selectInstrumentForFileType(fileType: string, enabledInstruments: string[]): string {
  // Define instrument categories
  const instrumentCategories = {
    keyboard: ['piano', 'organ', 'electricPiano', 'harpsichord'],
    strings: ['violin', 'cello', 'guitar', 'harp'],
    brass: ['trumpet', 'frenchHorn', 'trombone', 'tuba'],
    woodwinds: ['flute', 'clarinet', 'saxophone', 'oboe'],
    electronic: ['leadSynth', 'bassSynth', 'arpSynth'],
    experimental: ['whaleHumpback', 'whaleBlue', 'whaleOrca']
  };

  // File type preferences
  const fileTypePreferences = {
    'note': ['keyboard', 'strings'],
    'image': ['strings', 'woodwinds'], 
    'pdf': ['brass', 'keyboard'],
    'audio': ['woodwinds', 'electronic'],
    'video': ['strings', 'brass'],
    'other': ['electronic', 'experimental']
  };
}
```

**Fallback Hierarchy:**
1. **Preferred Categories**: Select from user's enabled instruments in preferred categories
2. **Uncategorized Instruments**: Use any enabled instruments not in predefined categories
3. **Any Enabled**: Final fallback to any enabled instrument
4. **Default**: Piano fallback if no instruments enabled

**Musical Property Mapping:**
```typescript
private createMusicalMappingForNode(node: GraphNode) {
  return {
    pitch: baseFreq * Math.pow(2, pitchOffset / 12), // File hash → pitch
    duration: Math.min(baseDuration + sizeFactor, 1.0), // File size → duration
    velocity: baseVelocity + connectionFactor, // Connections → velocity
    instrument: selectedInstrument // Dynamic selection
  };
}
```

## 5. Content Filtering & Exclusion

**Advanced Exclusion System:**
The system provides granular control over which content appears in the graph visualization.

**Exclusion Types:**
- **Folder Exclusion**: Exclude entire folders and their contents
- **File Exclusion**: Exclude specific files by path
- **Real-time Filtering**: Immediate graph updates when exclusions change

**Native Obsidian Integration:**
```typescript
// Folder selection with native autocomplete
export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
  getItems(): TFolder[] {
    return this.app.vault.getAllLoadedFiles()
      .filter(file => file instanceof TFolder) as TFolder[];
  }
  
  getItemText(folder: TFolder): string {
    return folder.path;
  }
}

// File selection with native autocomplete  
export class FileSuggestModal extends FuzzySuggestModal<TFile> {
  getItems(): TFile[] {
    return this.app.vault.getFiles();
  }
}
```

**UI Integration:**
- **Exclusion Lists**: Visual display of current exclusions with remove buttons
- **Add Buttons**: Native Obsidian autocomplete for adding exclusions
- **Real-time Updates**: Graph preview refreshes automatically
- **Persistent Settings**: Exclusions saved to plugin settings

**Filtering Logic:**
```typescript
private shouldExcludeFile(file: TFile): boolean {
  // Check direct file exclusion
  if (this.excludeFiles.includes(file.path)) return true;
  
  // Check folder exclusion
  return this.excludeFolders.some(folder => 
    file.path.startsWith(folder + '/')
  );
}
```

## 6. Smart Clustering System

**Phase 3 Implementation (July 2025):**
The Smart Clustering System provides intelligent automatic grouping of related nodes based on content relationships using community detection algorithms and multi-factor clustering weights.

**SmartClusteringAlgorithms Class:**
```typescript
export class SmartClusteringAlgorithms {
  constructor(settings: SmartClusteringSettings) {
    this.settings = { ...settings };
  }

  async clusterGraph(nodes: GraphNode[], links: GraphLink[]): Promise<ClusteringResult> {
    // Choose clustering algorithm based on settings
    switch (this.settings.algorithm) {
      case 'louvain':
        return await this.louvainClustering();
      case 'modularity':
        return await this.modularityClustering();
      case 'hybrid':
        return await this.hybridClustering();
    }
  }
}
```

**Community Detection Algorithms:**
- **Louvain Algorithm**: Fast, high-quality clustering for most use cases with modularity optimization
- **Modularity Optimization**: Alternative approach for different graph structures
- **Hybrid Clustering**: Combines multiple approaches for optimal results

**Multi-Factor Clustering Weights:**
```typescript
interface ClusteringWeights {
  linkStrength: number;    // 40% - Direct connections between files
  sharedTags: number;      // 30% - Files with common tags
  folderHierarchy: number; // 20% - Folder-based organization
  temporalProximity: number; // 10% - Recently created/modified files
}
```

**Cluster Types and Visual Treatment:**
- **Tag-based clusters** (Green): Files sharing common tags
- **Temporal clusters** (Blue): Files created/modified around the same time
- **Link-dense clusters** (Purple): Areas with high connectivity
- **Community clusters** (Orange): Natural groupings detected through link analysis

**Visual Implementation:**
```typescript
interface Cluster {
  id: string;
  nodes: GraphNode[];
  centroid: { x: number; y: number };
  radius: number;
  color: string;
  type: 'tag-based' | 'folder-based' | 'link-dense' | 'temporal' | 'community';
  strength: number; // 0-1, how cohesive the cluster is
  label?: string;
}
```

**Real-time Positioning:**
- **Dynamic Updates**: Clusters recalculate their position during force simulation
- **Centroid Calculation**: Uses actual node positions for accurate cluster boundaries
- **Radius Determination**: Based on node spread and cluster density
- **Layer Ordering**: Clusters render on top of nodes for proper visibility

**Performance Optimizations:**
- **Efficient Algorithms**: O(n log n) complexity for community detection
- **Cached Calculations**: Cluster assignments cached until graph changes
- **Threshold Controls**: Minimum cluster size and maximum cluster count limits
- **Resolution Parameter**: Controls cluster granularity for fine-tuning

**Settings Integration:**
- **Main Toggle**: Available in Plugin Settings alongside other core features
- **Algorithm Selection**: Choose between Louvain, Modularity, or Hybrid approaches
- **Weight Adjustment**: Fine-tune multi-factor clustering weights
- **Visualization Controls**: Enable/disable cluster boundaries and debug mode

## 7. Audio Integration & Timing Synchronization

**Critical Learnings from Phase 3.7 Implementation:**

The Sonic Graph audio integration revealed important architectural insights about real-time audio triggering vs. sequence-based playback systems.

**Timing Window Filtering Issue:**
```typescript
// AudioEngine sequence filtering logic (problematic for real-time triggering)
const notesToPlay = sequence.filter(note => 
  note.timing <= elapsedTime + 0.6 && 
  note.timing > elapsedTime - 0.4 && 
  !note.hasBeenTriggered
);
```

**Root Cause Analysis:**
- **Sequence System Design**: Audio engine's `playSequence()` was designed for pre-calculated musical sequences with precise timing
- **Timing Window Filter**: Notes with `timing: 0` were blocked after `elapsedTime > 0.4` seconds
- **Real-time Incompatibility**: Sonic Graph node appearances need immediate triggering, not sequence scheduling

**Solution Architecture:**
```typescript
// New playNoteImmediate() method bypasses timing restrictions
async playNoteImmediate(mapping: { pitch: number; duration: number; velocity: number; instrument: string }): Promise<void> {
  const synth = this.instruments.get(mapping.instrument);
  const detunedFrequency = this.applyFrequencyDetuning(mapping.pitch);
  synth.triggerAttackRelease(detunedFrequency, mapping.duration, undefined, mapping.velocity);
}
```

**Implementation Strategy:**
- **Direct Synthesis Triggering**: Bypass sequence timing system entirely
- **Frequency Detuning**: Maintain existing phase conflict resolution
- **Instrument Fallback**: Graceful degradation to piano when requested instrument unavailable
- **Structured Logging**: Comprehensive debugging for audio density filtering

**Performance Impact:**
- **Before Fix**: 99.7% of notes blocked by timing filter (only 7 of 3890 notes played)
- **After Fix**: All density-filtered notes play successfully
- **Audio Density Control**: Now enables precise control over note frequency (e.g., 5% = ~200 notes over 60 seconds)

**Design Principles Learned:**
1. **Separation of Concerns**: Real-time triggering vs. sequence playback require different audio paths
2. **Timing Models**: Animation timing != audio sequence timing
3. **Fallback Systems**: Always provide graceful degradation paths
4. **Debugging Infrastructure**: Structured logging essential for timing-related issues

## 8. Visual Rendering

**D3.js Force Simulation:**
The system uses D3.js for sophisticated force-directed graph layout with organic positioning.

**GraphRenderer Class:**
```typescript
export class GraphRenderer {
  private simulation: d3.ForceSimulation<GraphNode, GraphLink>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  
  initializeSimulation() {
    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links).distance(25))
      .force('charge', d3.forceManyBody().strength(-60))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(12))
      .force('x', d3.forceX().strength(0.1))
      .force('y', d3.forceY().strength(0.1));
  }
}
```

**Organic Clustering:**
- **File Type Forces**: Cluster similar file types together
- **Jitter Force**: Continuous small movements for natural appearance
- **Collision Detection**: Prevent node overlap with proper spacing
- **Adaptive Positioning**: Dynamic layout based on graph structure

**Visual Styling:**
```typescript
// File type color mapping
const fileTypeColors = {
  'note': '#4f46e5',      // Indigo for notes
  'image': '#059669',     // Emerald for images  
  'pdf': '#dc2626',       // Red for PDFs
  'audio': '#7c3aed',     // Violet for audio
  'video': '#ea580c',     // Orange for videos
  'other': '#6b7280'      // Gray for other files
};

// Node sizing based on connections
const nodeRadius = Math.max(4, Math.min(12, Math.sqrt(node.connections.length) * 2));
```

**Interactive Features:**
- **Zoom & Pan**: Full D3.js zoom behavior with reset controls
- **Node Tooltips**: Hover information showing file details
- **Timeline Scrubber**: Interactive timeline with click-to-seek
- **Speed Controls**: Real-time animation speed adjustment
- **File Name Toggle**: Show/hide file labels on nodes

**Performance Optimizations:**
- **Efficient Rendering**: SVG-based rendering for medium-sized graphs
- **Force Simulation Tuning**: Optimized force parameters for smooth animation
- **Memory Management**: Proper cleanup of D3.js resources
- **Responsive Design**: Adaptive layout for different screen sizes

**Modal Integration:**
```typescript
export class SonicGraphModal extends Modal {
  private graphRenderer: GraphRenderer;
  private temporalAnimator: TemporalGraphAnimator;
  private musicalMapper: MusicalMapper;
  
  async initializeGraph() {
    // Extract graph data with exclusions
    const graphData = await this.graphDataExtractor.extractGraphData();
    
    // Initialize renderer
    this.graphRenderer = new GraphRenderer(this.graphContainer, graphData);
    
    // Initialize temporal animator
    this.temporalAnimator = new TemporalGraphAnimator(
      graphData.nodes, 
      graphData.links,
      { duration: 30, enableIntelligentSpacing: true }
    );
    
    // Set up audio synchronization
    this.temporalAnimator.onNodeAppeared((node) => {
      this.handleNodeAppearance(node);
    });
  }
}
```

## 9. Content-Aware Positioning System

**Phase 3.8 Implementation (July 2025):**
The Content-Aware Positioning system enhances the force-directed graph layout by incorporating semantic relationships to create more meaningful node positioning that reflects the actual structure and relationships within your knowledge graph.

**ContentAwarePositioning Class:**
```typescript
export class ContentAwarePositioning {
  constructor(
    private nodes: GraphNode[],
    private settings: ContentAwarePositioningSettings
  ) {}

  applyForcesToSimulation(simulation: d3.Simulation<GraphNode, any>): void {
    if (!this.settings.enabled) return;

    // Apply semantic forces on top of standard physics
    this.applyTagInfluenceForce(simulation);     // Pull tagged files together
    this.applyTemporalPositioningForce(simulation); // Organize by creation time
    this.applyHubCentralityForce(simulation);    // Hub nodes toward center
  }
}
```

**Three Semantic Force Types:**

1. **Tag Influence Force**: Creates virtual connections between files sharing tags, with strength proportional to tag overlap percentage
2. **Temporal Positioning Force**: Organizes nodes along temporal axis - recent files gravitate toward center, older files toward periphery
3. **Hub Centrality Force**: Pulls highly connected nodes toward the graph center, creating natural hub-and-spoke patterns

**Real-time Control Interface:**
```typescript
// Fine-tuning sliders in Sonic Graph Modal settings panel
interface ContentAwareControls {
  tagInfluenceWeight: number;      // 0.0 - 1.0 (default: 0.3)
  temporalPositioningWeight: number; // 0.0 - 0.3 (default: 0.1) 
  hubCentralityWeight: number;     // 0.0 - 0.5 (default: 0.2)
  debugVisualization: boolean;     // Visual debugging overlay
}
```

**Debug Visualization System:**
When enabled, displays real-time visual indicators of force influences:
- **Temporal Zones**: Colored circles showing recent/established/archive areas (green/blue/gray)
- **Tag Connections**: Orange dashed lines between nodes with shared tags
- **Hub Indicators**: Red circles around highly connected nodes scaled by centrality

**Integration Points:**
- **Plugin Settings**: Main toggle alongside Adaptive Detail Levels and other core features
- **Sonic Graph Modal**: Fine-tuning controls with real-time preview in settings panel
- **GraphRenderer**: Force application and debug visualization rendering during simulation ticks
- **Performance**: Optimized algorithms that maintain smooth 60fps rendering performance

## 10. Adaptive Detail Levels System

**Phase 3.9 Enhancement (July 2025):**
The Adaptive Detail Levels system automatically adjusts graph complexity based on zoom level to maintain performance and visual clarity.

**AdaptiveDetailManager Class:**
```typescript
export class AdaptiveDetailManager {
  private settings: SonicGraphSettings['adaptiveDetail'];
  private currentState: AdaptiveDetailState;
  
  // Enhanced stability parameters
  private zoomChangeDebounceMs: number = 250; // Increased for panning stability
  private hysteresisMargin: number = 0.2; // 20% margin to prevent oscillation
  private minimumLevelChangeInterval: number = 500; // Minimum 500ms between changes
  
  handleZoomChange(zoomLevel: number): FilteredGraphData {
    // Intelligent processing: immediate for large changes, debounced for small ones
    const zoomDifference = Math.abs(zoomLevel - (this.lastProcessedZoom || zoomLevel));
    
    if (zoomDifference > 0.75) { // Large zoom changes
      return this.processZoomChangeImmediately(zoomLevel);
    } else { // Small changes during panning
      return this.processZoomChangeDebounced(zoomLevel);
    }
  }
}
```

**Four-Tier Detail System:**
- **Overview Mode** (< 0.5x zoom): Major hubs only (≥5 connections), strongest 20% of links
- **Standard Mode** (0.5x - 1.5x zoom): Connected nodes (≥2 connections), strongest 60% of links  
- **Detail Mode** (1.5x - 3.0x zoom): All connected nodes (≥1 connection), strongest 90% of links
- **Ultra-Detail Mode** (> 3.0x zoom): Everything including orphan nodes, all links

**Stability Enhancements:**
- **Hysteresis System**: 20% margin prevents rapid oscillation between levels
- **Debounced Processing**: 250ms delay for small zoom changes during panning
- **Minimum Change Interval**: 500ms cooldown between any level changes
- **Intelligent Thresholds**: 75% zoom difference required for immediate processing

**Performance Impact:**
- Reduces node count by 60-95% in overview modes
- Dramatically improves rendering performance for large graphs (>1000 nodes)
- Maintains smooth interaction during zoom and pan operations

**Integration Points:**
- `src/graph/GraphRenderer.ts`: Zoom change callbacks and filtered data rendering
- `src/ui/SonicGraphModal.ts`: Settings panel integration and real-time stats display
- `src/ui/settings.ts`: Main plugin settings with conditional sub-options

## 11. Comprehensive Settings Enhancement System

**Enhanced User Experience (January 2025):**

The settings enhancement system provides comprehensive guidance and improved UI consistency across all Sonic Graph controls.

### Tooltip System
```typescript
// Enhanced tooltip implementation using Obsidian's native API
setTooltip(element, 'Detailed explanation of feature purpose and usage guidance', {
    placement: 'left' | 'right' | 'top' | 'bottom'
});
```

**Coverage**: 21+ settings now include detailed tooltips explaining:
- Feature purpose and behavior
- Practical usage guidance
- Performance implications
- Recommended settings for different use cases

### UI Consistency Improvements
- **Obsidian-Style Toggles**: Converted custom toggles to native `Setting` API components
- **Enhanced Dropdown Controls**: Replaced radio buttons with accessible dropdown menus
- **Weight Slider Enhancement**: Extended clustering weight sliders with comprehensive tooltip support
- **Visual Hierarchy**: Improved settings organization with better grouping and labeling

### Settings Categories Enhanced
1. **Timeline Controls**: Granularity, time windows, event spreading with detailed explanations
2. **Clustering Parameters**: Algorithm selection, weights, and cluster limits with practical guidance
3. **Visual Options**: Animation styles, layouts, and display toggles with usage recommendations
4. **Audio Settings**: Density controls, spreading modes, and quality parameters with audio guidance
5. **Filter Controls**: Content inclusion/exclusion with scope explanations

### Technical Implementation
```typescript
// Enhanced weight slider with tooltip support
private createWeightSlider(container: HTMLElement, name: string, description: string, 
                          currentValue: number, min: number, max: number, step: number,
                          onChange: (value: number) => void, tooltipText?: string): void {
    // Create slider with comprehensive tooltip if provided
    if (tooltipText) {
        setTooltip(weightSlider, tooltipText, { placement: 'top' });
    }
}
```

**Integration Points:**
- `src/ui/SonicGraphModal.ts`: Enhanced settings panel with comprehensive tooltips
- All clustering, timeline, visual, and audio settings sections
- Native Obsidian `Setting` API integration for consistency

---

*For related documentation, see:*
- [Audio Engine Architecture](audio-engine.md)
- [UI Components Architecture](ui-components.md)
- [Performance & Monitoring](performance.md)