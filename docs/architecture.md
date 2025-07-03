# Sonigraph Architecture

## Table of Contents

- [1. System Overview](#1-system-overview)
  - [1.1. Core Components](#11-core-components)
  - [1.2. Technology Stack](#12-technology-stack)
  - [1.3. Module Structure](#13-module-structure)
- [2. Audio Engine](#2-audio-engine)
  - [2.1. Architecture](#21-architecture)
  - [2.2. Instrument Implementation](#22-instrument-implementation)
  - [2.3. Effects Processing](#23-effects-processing)
  - [2.4. Voice Management](#24-voice-management)
  - [2.5. Performance Optimization](#25-performance-optimization)
- [3. Sonic Graph System](#3-sonic-graph-system)
  - [3.1. Architecture Overview](#31-architecture-overview)
  - [3.2. Temporal Graph Animation](#32-temporal-graph-animation)
  - [3.3. Graph Data Extraction](#33-graph-data-extraction)
  - [3.4. Dynamic Instrument Selection](#34-dynamic-instrument-selection)
  - [3.5. Content Filtering & Exclusion](#35-content-filtering--exclusion)
  - [3.6. Visual Rendering](#36-visual-rendering)
- [4. Logging System](#4-logging-system)
  - [4.1. Architecture](#41-architecture)
  - [4.2. Components](#42-components)
  - [4.3. Usage Patterns](#43-usage-patterns)
  - [4.4. Configuration](#44-configuration)
- [5. UI Components](#5-ui-components)
  - [5.1. Component System](#51-component-system)
  - [5.2. Obsidian Integration](#52-obsidian-integration)
  - [5.3. Material Design Implementation](#53-material-design-implementation)
- [6. Graph Processing](#6-graph-processing)
  - [6.1. Data Acquisition](#61-data-acquisition)
  - [6.2. Musical Mapping](#62-musical-mapping)
  - [6.3. Sequence Generation](#63-sequence-generation)
- [7. Performance & Monitoring](#7-performance--monitoring)
  - [7.1. Performance Considerations](#71-performance-considerations)
  - [7.2. Monitoring Systems](#72-monitoring-systems)
  - [7.3. Optimization Strategies](#73-optimization-strategies)
- [8. External Integrations](#8-external-integrations)
  - [8.1. External Sample Sources Integration](#81-external-sample-sources-integration)
- [9. API Reference](#9-api-reference)
  - [9.1. AudioEngine API](#91-audioengine-api)
  - [9.2. Logging API](#92-logging-api)
  - [9.3. UI Components API](#93-ui-components-api)

---

## 1. System Overview

### 1.1. Core Components

Sonigraph is built on a modular architecture designed for scalability and maintainability:

- **AudioEngine**: Orchestral audio synthesis with 34 instruments
- **Graph Parser**: Obsidian vault data extraction and processing
- **Musical Mapper**: Graph-to-music parameter conversion
- **Control Center**: Professional 6-tab Material Design interface
- **Logging System**: Enterprise-grade logging with multiple adapters
- **Effects Engine**: Per-instrument effects processing with master bus
- **Sonic Graph System**: Dynamic graph visualization and interaction

### 1.2. Technology Stack

**Core Technologies:**
- **Language**: TypeScript with strict type checking
- **Audio Framework**: Tone.js v14.8.49 for Web Audio synthesis
- **Build System**: ESBuild for fast compilation and bundling
- **Plugin API**: Obsidian Plugin API with full type definitions
- **UI Framework**: Custom Material Design components

**Dependencies:**
- `tone`: Advanced audio synthesis and effects
- `obsidian`: Plugin API types and utilities
- Build tools: ESBuild configuration for production builds

### 1.3. Module Structure

```
src/
├── main.ts                 # Plugin entry point and lifecycle
├── graph/
│   ├── parser.ts          # Vault data extraction
│   ├── musical-mapper.ts  # Graph-to-music mapping
│   ├── GraphDataExtractor.ts # Sonic Graph data extraction and filtering
│   ├── GraphRenderer.ts   # D3.js-based visualization
│   ├── TemporalGraphAnimator.ts # Timeline animation system
│   └── types.ts           # Graph data interfaces
├── audio/
│   ├── engine.ts          # Main orchestral audio engine
│   ├── harmonic-engine.ts # Harmonic processing
│   ├── percussion-engine.ts # Advanced percussion synthesis
│   └── electronic-engine.ts # Electronic synthesis suite
├── ui/
│   ├── control-panel.ts   # Control Center with Sonic Graph integration
│   ├── SonicGraphModal.ts # Main Sonic Graph interface
│   ├── FolderSuggestModal.ts # Folder exclusion autocomplete
│   ├── FileSuggestModal.ts # File exclusion autocomplete
│   ├── settings.ts        # Settings management
│   ├── components.ts      # Reusable UI components
│   ├── lucide-icons.ts    # Icon system integration
│   └── material-components.ts # Material Design components
├── utils/
│   ├── constants.ts       # Configuration and defaults
│   └── [utilities]
└── logging.ts             # Logging system
```

---

## 2. Audio Engine

### 2.1. Architecture

The AudioEngine serves as the central orchestrator for all audio operations, managing 34 instruments across 7 orchestral families.

**Core Components:**
- **Instrument Management**: Dynamic instrument initialization and voice allocation
- **Effects Processing**: Per-instrument effects chains with master bus
- **Synthesis Engines**: Specialized engines for different instrument types
- **Performance Monitoring**: Real-time CPU and memory tracking

**File Structure:**
```
src/audio/
├── engine.ts           # Main AudioEngine class
├── harmonic-engine.ts  # Harmonic processing
├── percussion-engine.ts # Physics-based percussion synthesis
└── electronic-engine.ts # Analog-style electronic synthesis
```

### 2.2. Instrument Implementation

**34-Instrument Orchestral System:**

| Family | Instruments | Synthesis Approach | Key Features |
|--------|-------------|-------------------|-------------|
| **Keyboard** | Piano, Organ, Electric Piano, Harpsichord, Accordion, Celesta | Sample-based + specialized synthesis | Authentic articulation, velocity sensitivity |
| **Strings** | Strings, Violin, Cello, Guitar, Harp | Sample-based + string modeling | Bowing simulation, Karplus-Strong synthesis |
| **Brass** | Trumpet, French Horn, Trombone, Tuba | Sample-based + brass formants | Metallic timbre, breath control |
| **Woodwinds** | Flute, Clarinet, Saxophone, Oboe | Sample-based + breath modeling | Reed simulation, formant filtering |
| **Vocals** | Choir, Vocal Pads, Soprano, Alto, Tenor, Bass | Sample-based + formant synthesis | Vowel morphing, breath patterns |
| **Percussion** | Timpani, Xylophone, Vibraphone, Gongs | Physics modeling + transient synthesis | Pitch bending, metallic resonance |
| **Electronic** | Pad, Lead Synth, Bass Synth, Arp Synth | Classic analog synthesis | Filter modulation, LFO control |
| **Environmental** | Whale Song | Scientific recordings + oceanic effects | Ultra-long sustains, wide spectrum |

**Sample Loading Strategy (Issue #011 Resolution):**
- **Hybrid Sample/Synthesis System**: 19/34 instruments use external CDN samples, 15 use synthesis fallback
- **User Control**: "Use High Quality Samples" toggle (OFF by default for safe, synthesis-only operation)
- **Automatic Format Selection**: OGG format chosen automatically (resolved format confusion from Issue #005)
- **CDN Coverage**: 56% sample coverage with graceful synthesis fallback for missing instruments
- **Comprehensive Diagnostics**: Real-time CDN loading status with detailed error reporting
- **Browser Caching**: Performance optimization with persistent sample caching (~20-30MB)

**Voice Assignment Strategies:**
1. **Frequency-based**: Assigns instruments based on pitch ranges
2. **Round-robin**: Cycles through enabled instruments
3. **Connection-based**: Uses graph connectivity for consistent assignment

### 2.3. Effects Processing

**Per-Instrument Effects System:**
Each instrument supports individual effects chains with real-time parameter control.

**Available Effects:**
- **Reverb**: Spatial depth and realism (configurable decay, pre-delay, wet/dry)
- **Chorus**: Movement and richness (rate, depth, delay time, feedback)
- **Filter**: Tonal shaping (frequency, Q, type: lowpass/highpass/bandpass)

**Master Effects Bus:**
- **Orchestral Reverb**: Global spatial processing
- **3-Band EQ**: Master frequency shaping
- **Compressor**: Dynamic range control
- **Limiter**: Peak limiting for safe output levels

**Effect Configuration Examples:**
```typescript
// Piano: Clean, precise sound
piano: {
  reverb: { decay: 1.8, preDelay: 0.02, wet: 0.25 },
  chorus: { enabled: false },
  filter: { enabled: false }
}

// Strings: Lush, sustained processing
strings: {
  reverb: { decay: 3.5, preDelay: 0.01, wet: 0.4 },
  chorus: { enabled: false },
  filter: { frequency: 3500, type: 'lowpass' }
}

// Organ: Rich, church-like character
organ: {
  reverb: { decay: 2.8, preDelay: 0.02, wet: 0.3 },
  chorus: { frequency: 0.8, depth: 0.5, delayTime: 4, feedback: 0.2 },
  filter: { enabled: false }
}
```

### 2.4. Voice Management

**Polyphonic Voice System:**
- **Default Voice Limit**: 4-8 voices per instrument
- **Total System Limit**: Dynamic based on performance monitoring
- **Voice Stealing**: Intelligent allocation when limits exceeded
- **Resource Pooling**: Efficient voice reuse and cleanup

**Adaptive Quality System:**
```typescript
interface QualityLevel {
  high: { voices: 8, effects: 'full', sampleRate: 44100 },
  medium: { voices: 6, effects: 'essential', sampleRate: 44100 },
  low: { voices: 4, effects: 'minimal', sampleRate: 22050 }
}
```

### 2.5. Performance Optimization

**Phase 3 Performance Enhancements (Issue #001 Resolution):**
- **Processing Stability**: 100% stability achieved (target: >85%)
- **Voice Allocation**: 0.036ms average (1,600x improvement from pre-optimization)
- **Frequency Detuning**: ±0.1% randomization for phase conflict resolution
- **Cached Instrument Optimization**: O(1) enabled instruments lookup
- **Memory Leak Prevention**: Set-based cleanup with proper resource management

**Frequency Detuning System:**
```typescript
// Phase conflict resolution with ±0.1% frequency randomization
private applyFrequencyDetuning(frequency: number): number {
  if (!this.settings.performanceMode?.enableFrequencyDetuning) {
    return frequency;
  }
  const conflictWindowMs = 50;
  const baseFrequency = Math.round(frequency * 10) / 10;
  const lastUsedTime = this.frequencyHistory.get(baseFrequency);
  
  if (lastUsedTime && (performance.now() - lastUsedTime) < conflictWindowMs) {
    const detuneAmount = (Math.random() - 0.5) * 0.002; // ±0.1%
    return frequency * (1 + detuneAmount);
  }
  return frequency;
}
```

**Performance Mode Settings:**
```typescript
interface PerformanceMode {
  mode: 'low' | 'medium' | 'high' | 'ultra';
  enableFrequencyDetuning: boolean;
  maxConcurrentVoices: number;
  processingQuality: 'fast' | 'balanced' | 'high-quality';
  enableAudioOptimizations: boolean;
}
```

**Memory Management:**
- Sample caching with intelligent preloading
- Automatic garbage collection for unused voices
- Resource pooling for effects and synthesis components
- Total memory footprint: ~30-40MB when fully loaded
- Cached enabled instruments for O(1) lookup performance

**CPU Optimization:**
- Hardware-accelerated Web Audio processing
- Polyphony limits to prevent overload
- Performance monitoring with automatic quality adjustment
- **Current Performance**: <1% CPU usage under normal operation (optimized from 25% target)
- Ultra-consistent processing times (0.003ms average, 0.1ms max)

**Network Optimization:**
- One-time sample downloads with persistent browser caching
- CDN-based sample delivery for global performance
- Compression and efficient sample formats

**Issue #011: CDN Diagnostic System:**
- Comprehensive 34-instrument sample availability analysis
- Real-time loading status reporting with structured logging
- Missing instrument detection and fallback mode activation
- Performance impact assessment for hybrid sample/synthesis operation
- Developer-friendly diagnostic reports for troubleshooting sample loading issues

**Issue #012: CDN Loading Fallback System:**
- Automatic synthesis fallback for failed CDN sample loading
- Vocal instrument silence prevention with specialized vocal synthesis
- Graceful degradation maintaining audio output for all instruments
- Real-time fallback detection and replacement within 5 seconds
- Specialized synthesis voices for soprano, alto, tenor, bass with distinct timbres

---

## 3. Sonic Graph System

### 3.1. Architecture Overview

The Sonic Graph System provides a comprehensive temporal graph visualization with real-time audio synchronization, enabling users to experience their knowledge graph evolution through both visual and auditory channels.

**Core Architecture:**
```
src/graph/
├── GraphDataExtractor.ts     # Vault data extraction and filtering
├── GraphRenderer.ts          # D3.js-based visualization
├── TemporalGraphAnimator.ts  # Timeline animation system
├── musical-mapper.ts         # Graph-to-audio mapping
└── types.ts                  # Graph data interfaces

src/ui/
├── SonicGraphModal.ts        # Main graph interface
├── FolderSuggestModal.ts     # Folder exclusion autocomplete
├── FileSuggestModal.ts       # File exclusion autocomplete
└── control-panel.ts          # Control Center integration
```

**Key Features:**
- **Temporal Animation**: Time-based node appearance with intelligent spacing
- **Dynamic Audio Mapping**: Respects user's Control Center instrument selections
- **Content Filtering**: Advanced exclusion system with native Obsidian autocomplete
- **Force-Directed Layout**: D3.js simulation with organic clustering
- **Real-time Synchronization**: Visual and audio events perfectly synchronized

### 3.2. Temporal Graph Animation

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

### 3.3. Graph Data Extraction

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

### 3.4. Dynamic Instrument Selection

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

### 3.5. Content Filtering & Exclusion

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

### 3.6. Audio Integration & Timing Synchronization

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

### 3.7. Visual Rendering

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

### 3.8. Adaptive Detail Levels System

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

---

## 4. Logging System

### 4.1. Architecture

The logging system provides enterprise-grade logging capabilities with flexibility, performance, and extensibility.

**Core Principles:**
- **Flexibility**: Multiple output targets (console, file, notices)
- **Performance**: Minimal overhead, especially for disabled log levels
- **Testability**: Easy to mock and verify in tests
- **Defensive Coding**: Built with reliability in mind
- **Extensibility**: Easy to add new outputs or formatters

### 4.2. Components

**Core Components:**
- **LogManager**: Central singleton managing all loggers and adapters
- **Logger**: Implementation of the ILogger interface
- **LoggerFactory**: Creates and configures loggers
- **SafeLogger**: Simple logger for early initialization

**Adapters:**
- **ConsoleAdapter**: Logs to the browser console
- **FileAdapter**: Logs to files with rotation
- **NoticeAdapter**: Shows logs as Obsidian notices
- **NullAdapter**: No-op adapter for testing

**Formatters:**
- **StandardFormatter**: Default text formatting
- **JSONFormatter**: Structured JSON output for analysis

**Interfaces:**
```typescript
interface ILogger {
  debug(category: string, message: string, data?: any): void;
  info(category: string, message: string, data?: any): void;
  warn(category: string, message: string, data?: any): void;
  error(category: string, message: string, error?: Error): void;
  time(operation: string): () => void;
  enrichError(error: Error, context: any): Error;
  withContext(context: any): ContextualLogger;
}
```

### 4.3. Usage Patterns

**Basic Usage:**
```typescript
import { getLogger } from 'src/logging';

const logger = getLogger('AudioEngine');

// Standard logging
logger.debug('initialization', 'Starting audio engine setup');
logger.info('playback', 'Sequence started successfully');
logger.warn('performance', 'High CPU usage detected');
logger.error('audio', 'Failed to initialize synthesizer', error);
```

**Contextual Logging:**
```typescript
const userLogger = logger.withContext({ 
  userId: user.id, 
  sessionId: session.id 
});

// All logs include context automatically
userLogger.info('login', 'User logged in successfully');
```

**Performance Timing:**
```typescript
function expensiveOperation() {
  const endTimer = logger.time('expensiveOperation');
  // ... do work
  endTimer(); // Logs duration automatically
}
```

### 4.4. Configuration

```typescript
interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath: string;
  maxSize: number;
  maxBackups: number;
  enableNotices: boolean;
}

// Initialize with configuration
loggerFactory.initialize({
  level: 'debug',
  enableConsole: true,
  enableFile: true,
  logFilePath: 'logs/debug.log',
  maxSize: 1024 * 1024, // 1MB
  maxBackups: 3,
  enableNotices: true
});
```

---

## 5. UI Components

### 5.1. Component System

The UI system provides standardized Obsidian-compatible components that ensure perfect visual consistency with the native interface.

**Component Architecture:**
- **Material Design Foundation**: Monochrome styling using Obsidian's color scheme
- **Lucide Icons**: Consistent iconography via Obsidian's built-in icon system
- **Reusable Components**: Modular components for consistent interface elements
- **Responsive Design**: Adaptive layouts for different screen sizes

### 5.2. Obsidian Integration

**Toggle Components:**

**`createObsidianToggle()`** - Full settings-style toggle:
```typescript
const checkbox = createObsidianToggle(
  container,
  true, // initial value
  (value) => console.log('Toggle changed:', value),
  {
    name: 'Enable Feature',
    description: 'Turn this feature on or off',
    disabled: false
  }
);
```

**DOM Structure:**
```html
<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Setting Name</div>
    <div class="setting-item-description">Setting description</div>
  </div>
  <div class="setting-item-control">
    <div class="checkbox-container is-enabled">
      <input type="checkbox" tabindex="0" checked>
    </div>
  </div>
</div>
```

**State Management:**
- `checkbox-container` - Base container class
- `is-enabled` - Added when toggle is ON
- `is-disabled` - Added when toggle is disabled

### 5.3. Material Design Implementation

**Control Center Modal Structure:**
```typescript
class MaterialControlPanelModal extends Modal {
  private activeTab: string = 'status';
  private tabContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private appBar: HTMLElement;
  private drawer: HTMLElement;
  private playButton: HTMLElement;
  private instrumentToggles: Map<string, HTMLElement> = new Map();
}
```

**Family-Based Tab Architecture:**
- **Navigation Drawer**: Left sidebar with 10-tab navigation organized by family
- **Content Area**: Dynamic content switching based on active tab
- **Sticky Header**: Fixed header with title and global action buttons
- **Material Design**: Monochrome styling using Obsidian's native color scheme

**Ten-Tab Interface System:**

**Core Tabs (3 tabs):**
1. **Status Tab**: Real-time system diagnostics, performance metrics, and Audio System controls
2. **Musical Tab**: Scale selection, root note, tempo, traversal methods
3. **Master Tab**: Global controls, master effects, and bulk operations

**Audio System Controls (Status Tab):**
- **"Use High Quality Samples" Toggle**: Primary control for CDN sample loading (Issue #011 resolution)
- **Real-time Audio Mode Display**: Immediate feedback showing "High Quality Samples" vs "Synthesis Only"
- **System Information**: Sample rate, buffer size, and audio context status

**Sonic Graph Modal Enhancements (Phase 3.7-3.9):**
- **Audio Density Slider**: Real-time value display (e.g., "100%", "5%") with immediate visual feedback
- **Settings Panel**: Comprehensive configuration with sliding panel animation
- **Real-time Updates**: All settings changes apply immediately without requiring restart
- **Structured Logging Integration**: Enhanced debugging with detailed audio density filtering logs
- **Enhanced Header Design (Phase 3.9)**: Title with chart-network icon positioned on left, Control Center button on right
- **Adaptive Detail Stats**: Real-time display showing current detail level and node/link filtering percentages
- **Improved Layout**: Flexbox-based header alignment ensuring perfect vertical centering of all elements

**Instrument Family Tabs (7 tabs):**
1. **Strings Tab**: String family instruments (violin, cello, guitar, harp, piano, strings)
2. **Woodwinds Tab**: Woodwind family (flute, clarinet, saxophone, oboe)
3. **Brass Tab**: Brass family (trumpet, french horn, trombone, tuba)
4. **Vocals Tab**: Vocal family (choir, vocal pads, soprano, alto, tenor, bass)
5. **Percussion Tab**: Percussion family (timpani, xylophone, vibraphone, gongs)
6. **Electronic Tab**: Electronic family (pad, lead synth, bass synth, arp synth)
7. **Experimental Tab**: Experimental/environmental sounds (whale song)

**Material Components:**
- **MaterialCard**: Standardized card components with elevation
- **StatCard**: Real-time status display cards
- **InstrumentCard**: Individual instrument control interface
- **EffectSection**: Effects parameter controls
- **ActionChip**: Interactive action buttons
- **MaterialSlider**: Consistent slider controls
- **MaterialButton**: Standardized button components
- **High Quality Samples Toggle**: User-friendly control for CDN sample loading (Issue #011 resolution)

**CSS Integration:**
```css
:root {
  --md-surface: var(--background-secondary);
  --md-surface-variant: var(--background-modifier-border);
  --md-primary: var(--interactive-accent);
  --md-on-surface: var(--text-normal);
  --md-outline: var(--background-modifier-border);
}
```

---

## 6. Graph Processing

### 6.1. Data Acquisition

**Graph Data Sources:**
- Obsidian vault files via `app.vault.getFiles()`
- Internal link parsing from markdown content
- Metadata extraction from frontmatter
- Plugin compatibility (Extended Graph, Folders to Graph)

**Processing Pipeline:**
1. **File Discovery**: Enumerate all markdown files in vault
2. **Link Extraction**: Parse `[[note name]]` syntax and resolve connections
3. **Metadata Processing**: Extract frontmatter and file statistics
4. **Graph Construction**: Build weighted adjacency list representation
5. **Analysis**: Calculate node properties (degree, centrality, clustering)

### 6.2. Musical Mapping

**Parameter Mapping System:**
```typescript
interface MusicalMapping {
  nodeId: string;
  instrument: string;
  frequency: number;    // Derived from connections/position
  duration: number;     // Derived from content length
  velocity: number;     // Derived from importance/centrality
  timing: number;       // Derived from creation/modification time
}
```

**Mapping Strategies:**
- **Node Connections → Pitch**: More connections = higher pitch
- **Word Count → Duration**: More content = longer notes
- **Node Importance → Velocity**: More important = louder
- **Modification Time → Timing**: Recently modified = plays sooner

### 6.3. Sequence Generation

**Sequence Processing:**
1. **Graph Analysis**: Calculate statistical properties for mapping
2. **Scale Application**: Apply selected musical scale constraints
3. **Instrument Assignment**: Distribute notes across enabled instruments
4. **Timing Calculation**: Generate precise timing for audio scheduling
5. **Harmonic Processing**: Apply consonance rules and chord detection
6. **Audio Scheduling**: Queue events in Tone.js Transport system

---

## 7. Performance & Monitoring

### 7.1. Performance Considerations

**Memory Usage:**
- **Sample Caching**: ~30-40MB for complete instrument library
- **Voice Management**: Dynamic allocation with automatic cleanup
- **Effect Processing**: Hardware-accelerated where available
- **Graph Data**: Efficient structures with incremental updates
- **Optimization**: Cached enabled instruments for O(1) performance

**CPU Usage (Post-Phase 3 Optimization):**
- **Achieved Performance**: <1% CPU under normal operation (164x improvement)
- **Processing Stability**: 100% consistency (was 72.9%)
- **Voice Allocation**: 0.036ms average (was 4.81ms)
- **Adaptive Quality**: Automatic performance scaling based on system load
- **Voice Limits**: Polyphony restrictions to prevent overload
- **Scheduling Optimization**: Ultra-efficient audio event scheduling
- **Frequency Detuning**: Phase conflict resolution with minimal overhead

### 7.2. Monitoring Systems

**Real-Time Performance Monitoring:**
```typescript
interface PerformanceMetrics {
  cpuUsage: number;        // Percentage of CPU utilization
  latency: number;         // Audio latency in milliseconds
  activeVoices: number;    // Currently playing voices
  memoryUsage: number;     // Estimated memory consumption
  qualityLevel: 'high' | 'medium' | 'low';
  processingStability: number;  // Phase 3: Processing consistency (0-1)
  cracklingRisk: 'LOW' | 'MEDIUM' | 'HIGH';  // Audio quality assessment
  frequencyDetuningActive: boolean;  // Phase conflict resolution status
}
```

**Performance Tracking:**
- CPU usage monitoring every 5 seconds
- Audio latency measurement and reporting
- Active voice counting across all instruments
- Memory usage estimation and tracking
- Quality level automatic adjustment
- **Phase 3 Enhancements:**
  - Processing stability monitoring (coefficient of variation)
  - Crackling risk assessment (LOW/MEDIUM/HIGH)
  - Frequency detuning conflict detection
  - Voice allocation performance metrics
  - Memory leak detection and prevention

### 7.3. Optimization Strategies

**Adaptive Performance Scaling:**
```typescript
class PerformanceOptimizer {
  private checkPerformanceAndAdapt(): void {
    const metrics = this.gatherMetrics();
    
    // Phase 3: Enhanced thresholds after optimization
    if (metrics.cpuUsage > 80) {
      this.reduceQuality('high' → 'medium');
    } else if (metrics.cpuUsage > 90) {
      this.reduceQuality('medium' → 'low');
    }
    
    // Phase 3: Processing stability monitoring
    if (metrics.processingStability < 0.85) {
      this.enableFrequencyDetuning();
    }
    
    // Phase 3: Crackling prevention
    if (metrics.cracklingRisk === 'HIGH') {
      this.activateStabilityMode();
    }
  }
  
  private reduceQuality(level: QualityLevel): void {
    // Reduce voice limits, disable non-essential effects
    // Lower sample rates, simplify processing
    // Phase 3: Maintain frequency detuning for stability
  }
}
```

**Emergency Performance Mode:**
- Automatic activation when CPU > 90%
- Reduced voice limits and simplified effects
- Minimal processing for essential functionality
- Graceful degradation without audio dropouts
- **Phase 3 Enhancements:**
  - Frequency detuning remains active for stability
  - Cached instrument optimization maintained
  - Processing stability monitoring continues
  - Memory leak prevention systems remain active

---

## 8. External Integrations

### 8.1. External Sample Sources Integration

**Primary CDN Integration (Issue #011 Resolution):**
Sonigraph uses the nbrosowsky.github.io CDN as its primary sample source, providing 19/34 instruments with high-quality OGG samples. The system includes comprehensive diagnostic reporting and graceful synthesis fallback for missing samples.

**CDN Sample Coverage:**
- **Available (19 instruments)**: Piano, organ, strings, choir, vocal pads, flute, clarinet, saxophone, electric piano, harpsichord, accordion, celesta, violin, cello, guitar, harp, trumpet, french horn, trombone, tuba, oboe, xylophone, lead synth, bass synth, arp synth
- **Synthesis Fallback (15 instruments)**: Soprano, alto, tenor, bass, timpani, vibraphone, gongs, pad, whale song (environmental)

**User Control System:**
- **"Use High Quality Samples" Toggle**: User-friendly control (OFF by default for safe operation)
- **Automatic Format Selection**: OGG format chosen automatically (resolved Issue #005 format confusion)
- **Real-time Diagnostics**: Comprehensive CDN loading status with detailed error reporting
- **Graceful Degradation**: Seamless fallback to synthesis when samples unavailable

**Future Sample Sources Integration:**
The architecture supports expansion to additional sample sources while maintaining the current hybrid system:

- **Freesound.org:** 500,000+ Creative Commons samples for percussion, experimental, and vocal content
- **Soundstripe:** Professional royalty-free orchestral samples and sound effects
- **Storyblocks:** Diverse content library with unlimited downloads for subscribers
- **ElevenLabs AI:** On-demand sound generation for unique textures and experimental sounds
- **BBC Sound Effects Archive:** 33,000+ professional historical recordings
- **Archive.org:** Millions of public domain and Creative Commons audio recordings
- **Commercial Libraries:** Curated high-quality sample packs from specialized producers
- **Field Recording Communities:** Authentic environmental and location-specific recordings

**For detailed implementation guidelines:** [External Sample Sources Integration Guide](integrations/external-sample-sources-guide.md)

---

## 9. API Reference

### 9.1. AudioEngine API

```typescript
class AudioEngine {
  // Initialization
  async initialize(): Promise<void>
  
  // Playback Control
  async playSequence(sequence: MusicalMapping[]): Promise<void>
  stop(): void
  async playTestNote(frequency?: number): Promise<void>
  async playNoteImmediate(mapping: { pitch: number; duration: number; velocity: number; instrument: string }): Promise<void>  // Phase 3.7: Real-time note triggering
  
  // Configuration
  updateSettings(settings: SonigraphSettings): void
  updateInstrumentVolume(instrument: string, volume: number): void
  setInstrumentEnabled(instrument: string, enabled: boolean): void
  
  // Issue #011: CDN sample management
  generateCDNDiagnosticReport(): void  // Comprehensive sample loading analysis
  
  // Phase 3: Performance optimization methods
  getEnabledInstrumentsForTesting(): string[]
  getDefaultInstrumentForTesting(frequency: number): string
  onInstrumentSettingsChanged(): void  // Invalidates cache
  
  // Effects Management
  updateEffectSettings(instrument: string, effect: string, settings: any): void
  toggleEffect(instrument: string, effect: string, enabled: boolean): void
  
  // Status and Monitoring
  getStatus(): AudioStatus
  getPerformanceMetrics(): PerformanceMetrics
  
  // Resource Management
  dispose(): void
}
```

**Configuration Interfaces:**
```typescript
interface SamplerConfig {
  urls: Record<string, string>;    // Note → filename mapping
  release: number;                 // Release time in seconds
  baseUrl: string;                // CDN base URL
  effects: string[];              // Applied effect names
}

interface InstrumentSettings {
  enabled: boolean;
  volume: number;
  maxVoices: number;
  effects: {
    reverb: ReverbSettings;
    chorus: ChorusSettings;
    filter: FilterSettings;
  };
}

// Phase 3: Performance mode configuration
// Issue #011: Updated settings interface
interface SonigraphSettings {
  // ... existing settings
  useHighQualitySamples: boolean; // Replaces audioFormat enum
  performanceMode?: {
    mode: 'low' | 'medium' | 'high' | 'ultra';
    enableFrequencyDetuning: boolean;
    maxConcurrentVoices: number;
    processingQuality: 'fast' | 'balanced' | 'high-quality';
    enableAudioOptimizations: boolean;
  };
}
```

### 9.2. Logging API

```typescript
// Logger Factory
function getLogger(component: string): ILogger

// Core Logger Interface
interface ILogger {
  debug(category: string, message: string, data?: any): void;
  info(category: string, message: string, data?: any): void;
  warn(category: string, message: string, data?: any): void;
  error(category: string, message: string, error?: Error): void;
  time(operation: string): () => void;
  enrichError(error: Error, context: any): Error;
  withContext(context: any): ContextualLogger;
}

// Configuration
interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath: string;
  maxSize: number;
  maxBackups: number;
  enableNotices: boolean;
}
```

### 9.3. UI Components API

```typescript
// Toggle Components
function createObsidianToggle(
  container: HTMLElement,
  initialValue: boolean,
  onChange: (value: boolean) => void,
  options: ToggleOptions
): HTMLElement

function createSimpleToggle(
  container: HTMLElement,
  initialValue: boolean,
  onChange: (value: boolean) => void,
  options: SimpleToggleOptions
): HTMLElement

// Material Design Components
class MaterialControlPanelModal extends Modal {
  constructor(app: App, plugin: SonigraphPlugin)
  onOpen(): void
  onClose(): void
  private showTab(tabId: string): void
  private updateStatus(): void
}

// Helper Functions
function updateToggleValue(checkbox: HTMLElement, value: boolean): void
function setToggleDisabled(checkbox: HTMLElement, disabled: boolean): void
```

---

*This document provides the complete architectural overview of the Sonigraph plugin. For development roadmap and implementation status, see [Development Roadmap](planning/development-roadmap.md).*
