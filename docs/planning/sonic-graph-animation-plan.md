# Sonic Graph Feature with Temporal Animation

## Table of Contents

1. [Overview](#overview)
2. [Project Goals](#project-goals)
   - [Primary Objectives](#primary-objectives)
   - [Secondary Objectives](#secondary-objectives)
3. [Refined Requirements](#refined-requirements)
   - [Control Center Integration](#control-center-integration)
   - [Modal Design](#modal-design)
   - [User Experience Flow](#user-experience-flow)
3. [Technical Architecture](#technical-architecture)
   - [Core Components](#core-components)
     - [Graph Data Extractor](#1-graph-data-extractor-srcgraphgraphdataextractorts)
     - [Temporal Graph Animator](#2-temporal-graph-animator-srcgraphtemporalgraphanimatorts)
     - [Audio-Visual Synchronizer](#3-audio-visual-synchronizer-srcgraphaudiovisualsyncsts)
     - [Graph Renderer](#4-graph-renderer-srcgraphgraphrendererts)
     - [Timeline UI Controller](#5-timeline-ui-controller-srcuitimelinemodaltts)
4. [Implementation Phases](#implementation-phases)
   - [Phase 1: Foundation](#phase-1-foundation-week-1) ✅ **COMPLETED**
   - [Phase 2: Temporal Animation](#phase-2-temporal-animation-week-2) ✅ **COMPLETED**
   - [Phase 3: Enhanced Visualization](#phase-3-enhanced-visualization-week-3) 🚧 **IN PROGRESS**
   - [Phase 4: Advanced Audio Mapping](#phase-4-advanced-audio-mapping-week-4) ⏳ **PLANNED**
   - [Phase 5: Content Filtering and Exclusion](#phase-5-content-filtering-and-exclusion-completed) ✅ **COMPLETED**
5. [Technical Specifications](#technical-specifications)
   - [Dependencies](#dependencies)
   - [File Structure](#file-structure)
   - [Performance Targets](#performance-targets)
   - [Visual Design Guidelines](#visual-design-guidelines)
6. [Integration Points](#integration-points)
   - [Existing Sonigraph Systems](#existing-sonigraph-systems)
   - [Obsidian API Usage](#obsidian-api-usage)
7. [Risk Assessment](#risk-assessment)
   - [Technical Risks](#technical-risks)
   - [Mitigation Strategies](#mitigation-strategies)
8. [Success Metrics](#success-metrics)
   - [User Experience](#user-experience)
   - [Technical Performance](#technical-performance)
9. [Future Enhancements](#future-enhancements)
   - [Potential Extensions](#potential-extensions)
   - [Integration Opportunities](#integration-opportunities)
10. [Next Steps](#next-steps)

---

## Overview

This document outlines the implementation plan for adding a "Sonic Graph" feature to the Sonigraph plugin using D3-force simulation. The feature provides a static knowledge graph visualization that can be animated over time based on file creation dates, synchronized with musical sonification from the existing audio engine.

## Project Goals

### Primary Objectives
- **Static Graph Visualization**: Show complete knowledge graph with all vault files and connections
- **Temporal Animation**: Optional time-based animation showing graph evolution using file creation dates
- **Audio-Visual Sync**: Synchronize graph animations with musical events from the existing audio engine
- **Multi-Media Support**: Include both notes and attachments (images, PDFs, etc.) as graph nodes
- **Control Center Integration**: Seamless integration with existing Sonigraph interface

### Secondary Objectives
- **Interactive Timeline**: Allow users to scrub through time and control animation playback
- **Performance Optimization**: Smooth 60fps animation even with large graphs (1000+ nodes)
- **Customizable Visualization**: User-configurable visual styles and animation parameters
- **Export Capabilities**: Save timeline animations as video or audio files

## Refined Requirements

Based on design discussions and mockup creation, the following requirements have been established:

### Control Center Integration

#### **New "Sonic Graph" Tab**
- **Tab Placement**: Added to existing Control Center navigation drawer after "Experimental" tab
- **Tab Structure**: Follows existing family-based tab pattern with drawer navigation
- **Compact Preview**: Shows static graph visualization in Control Center tab
- **Launch Button**: "🌐 Open Full Sonic Graph" button to open dedicated modal
- **Play Integration**: "▶️ Play Sonic Graph" button to start temporal animation with audio

#### **Audio Engine Integration**
- **Instrument Respect**: Uses currently enabled instruments from Control Center
- **Real-time Updates**: If user changes instruments while modal is open, audio mapping updates
- **Audio Status**: Shows "Audio: X instruments" status reflecting current enabled instruments
- **Graceful Fallback**: If no instruments enabled, shows appropriate guidance to user

### Modal Design

#### **Two-Modal Strategy**
1. **Control Center Modal**: Existing modal with new Sonic Graph tab
2. **Dedicated Sonic Graph Modal**: Larger modal for full graph exploration

#### **Sonic Graph Modal Features**
- **Modal Header**: 
  - Title: "🌐 Sonic Graph"
  - Control Center button: "🎛️ Control Center" (opens Control Center modal)
  - Settings button: "⚙️ Settings" (future modal configuration)
  - Close button: "×"
- **CSS Sizing**: Uses `:has()` selector for appropriate modal dimensions
- **Static by Default**: Opens with complete static graph showing all files
- **Play-Triggered Animation**: Timeline and animation only activate when user clicks Play

### User Experience Flow

#### **Discovery Path**
1. User opens Control Center for normal Sonigraph usage
2. Notices new "Sonic Graph" tab in navigation drawer
3. Clicks tab to see compact graph preview with vault overview
4. Sees static graph representing all files and connections
5. Can click "Play Sonic Graph" for temporal animation + audio
6. Can click "Open Full Sonic Graph" for detailed exploration

#### **Modal Interaction**
1. **Static Mode** (default):
   - Complete knowledge graph visible
   - All files and connections shown
   - No timeline visible
   - Mode indicator: "📊 Static Mode"
   
2. **Animated Mode** (after clicking Play):
   - Timeline appears and becomes active
   - Temporal animation begins with audio sonification
   - Mode indicator: "🎵 Animated Mode - Playing" 
   - User can pause/stop to return to static mode

#### **Cross-Modal Navigation**
- **From Sonic Graph Modal**: "🎛️ Control Center" button opens Control Center
- **From Control Center**: User can return to Sonic Graph tab or launch full modal
- **Consistent State**: Both modals respect same instrument settings and preferences

#### **Audio Behavior**
- **Static Mode**: No audio (graph is silent)
- **Play Button**: Starts temporal animation with musical sonification
- **Instrument Mapping**: 
  - Notes (markdown) → Piano/Keyboard instruments
  - Images → String instruments  
  - PDFs → Brass instruments
  - Audio files → Woodwind instruments
  - Other files → Electronic/Experimental instruments
- **Note Duration**: Based on content length for markdown files, fixed short durations for attachments
- **Timeline Synchronization**: Music plays as nodes appear chronologically

#### **Naming and Branding**
- **Feature Name**: "Sonic Graph" (not "Timelapse")
- **Clear Distinction**: Differentiated from Obsidian's standard Graph view
- **Sonigraph Context**: Obviously part of the audio plugin ecosystem
- **Temporal Aspect**: Animation and timeline are secondary features, not primary branding

## Technical Architecture

### Core Components

#### 1. Graph Data Extractor (`src/graph/GraphDataExtractor.ts`)
```typescript
interface GraphNode {
  id: string;
  type: 'note' | 'image' | 'pdf' | 'audio' | 'video';
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

interface GraphLink {
  source: string;
  target: string;
  type: 'reference' | 'attachment' | 'tag';
  strength: number;
}
```

**Responsibilities**:
- Extract all notes and attachments from Obsidian vault
- Detect connections between files (links, embeds, references)
- Parse file metadata for enhanced visualization
- Cache graph data for performance

#### 2. Temporal Graph Animator (`src/graph/TemporalGraphAnimator.ts`)
```typescript
class TemporalGraphAnimator {
  private simulation: d3.ForceSimulation<GraphNode, GraphLink>;
  private timeScale: d3.ScaleTime<number, number>;
  private currentTime: number = 0;
  private animationSpeed: number = 1.0;
  private isPlaying: boolean = false;
}
```

**Responsibilities**:
- Manage D3-force simulation lifecycle
- Control timeline playback (play/pause/scrub)
- Handle node appearance/disappearance based on creation dates
- Emit events for audio synchronization

#### 3. Audio-Visual Synchronizer (`src/graph/AudioVisualSync.ts`)
```typescript
class AudioVisualSync {
  private audioEngine: AudioEngine;
  private animator: TemporalGraphAnimator;
  private eventQueue: TimelineEvent[];
}
```

**Responsibilities**:
- Synchronize graph events with audio engine
- Queue and trigger musical events based on timeline
- Handle audio-visual timing coordination
- Manage different sound mappings for node types

#### 4. Graph Renderer (`src/graph/GraphRenderer.ts`)
```typescript
class GraphRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private nodeGroups: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>;
  private linkGroups: d3.Selection<SVGGElement, GraphLink, SVGGElement, unknown>;
}
```

**Responsibilities**:
- Render SVG-based graph visualization
- Handle visual styling and theming
- Manage zoom/pan interactions
- Render node thumbnails for images
- Apply visual effects and transitions

#### 5. Timeline UI Controller (`src/ui/TimelineModal.ts`)
```typescript
class TimelineModal extends Modal {
  private renderer: GraphRenderer;
  private animator: TemporalGraphAnimator;
  private audioSync: AudioVisualSync;
  private controls: TimelineControls;
}
```

**Responsibilities**:
- Provide full-screen timeline interface
- Timeline scrubber and playback controls
- Settings panel for animation parameters
- Export functionality

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅ **COMPLETED**
**Goal**: Basic D3-force integration with static graph

#### Tasks Completed:
1. **Setup Dependencies** ✅
   - Added D3.js dependencies to package.json (`d3@^7.9.0`)
   - Configured TypeScript types for D3 (`@types/d3@^7.4.3`)
   - Updated build configuration for D3 integration

2. **Basic Data Extraction** ✅
   - Implemented `GraphDataExtractor` for all file types (notes, images, PDFs, audio, video)
   - Extract file creation dates and modification dates
   - Created comprehensive node/link data structures with metadata

3. **Static Force Simulation** ✅
   - Complete D3-force simulation setup with multiple forces
   - Circle nodes with file-type styling and tooltips
   - Advanced force-directed layout with centering, collision, clustering, and jitter

4. **UI Integration** ✅
   - Created `SonicGraphModal` for graph display
   - Added "Sonic Graph" tab to Control Center with launch button
   - Full zoom/pan functionality with reset controls

#### Deliverables: ✅ **ALL COMPLETED**
- ✅ Working static graph visualization
- ✅ Modal interface with comprehensive controls
- ✅ Note-to-note and file-to-file connection detection

### Phase 2: Temporal Animation (Week 2) ✅ **COMPLETED**
**Goal**: Time-based node appearance with basic audio sync

#### Tasks Completed:
1. **Timeline Implementation** ✅
   - Created `TemporalGraphAnimator` with comprehensive timeline management
   - Time scale creation based on file creation dates (30-second default duration)
   - Smooth node appearance animation with D3 transitions
   - Interactive timeline scrubber UI component with real-time position updates

2. **Basic Audio Integration** ✅
   - Connected to existing AudioEngine with proper initialization
   - Musical note triggers when nodes appear (real audio playback)
   - Sophisticated file-type to instrument mapping:
     - Notes → Piano, Images → Violin, PDFs → Trumpet
     - Audio → Flute, Videos → Cello, Other → Synth
   - Musical properties mapped to file characteristics (size, connections, hash)

3. **Playback Controls** ✅
   - Full play/pause/stop functionality
   - Variable speed control (0.5x to 5x) with UI slider
   - Real-time timeline position indicator and seek functionality
   - Progress bar with click-to-seek capability

4. **Attachment Support** ✅
   - Complete support for all file types (images, PDFs, audio, video, notes)
   - Distinct visual styles for each file type with color coding
   - Comprehensive metadata extraction (size, dates, connections, type)

#### Deliverables: ✅ **ALL COMPLETED**
- ✅ Animated timeline showing graph evolution over time
- ✅ Real-time audio synchronization with musical mapping
- ✅ Support for all Obsidian file types with distinct styling

### Phase 3: Enhanced Visualization (Week 3) 🚧 **IN PROGRESS**
**Goal**: Rich visual styling and advanced interactions

#### Tasks:
1. **Visual Enhancements** ✅ **COMPLETED**
   - ✅ Custom node styling per file type with distinct colors and shapes
   - ⏳ Image thumbnails for image nodes (planned for future enhancement)
   - ✅ Color coding and size mapping based on file properties
   - ✅ Smooth transitions and effects using D3 animations

2. **Advanced Force Simulation** ✅ **COMPLETED**
   - ✅ Custom forces for file type clustering with organic positioning
   - ✅ Link strength based on connection types and file relationships
   - ✅ Dynamic force parameters with collision detection and jitter
   - ✅ Optimized force parameters for natural, non-overlapping layout

3. **Interactive Features** 🚧 **PARTIALLY COMPLETED**
   - ⏳ Node selection and highlighting (basic hover implemented)
   - ✅ Tooltip information on hover showing file details
   - ⏳ Click to open files in Obsidian (planned)
   - ✅ Search and filter functionality via exclusion system

4. **Performance Optimization** 🚧 **PARTIALLY COMPLETED**
   - ✅ Efficient rendering for medium-sized graphs
   - ⏳ Level-of-detail for distant nodes (planned optimization)
   - ⏳ Canvas fallback for performance (SVG currently used)

#### Deliverables:
- ✅ Polished visual interface with file-type styling
- 🚧 Smooth performance with large datasets (optimized for medium datasets)
- 🚧 Rich interactive features (basic interactions implemented)

### Phase 4: Advanced Audio Mapping (Week 4)
**Goal**: Sophisticated audio-visual correlations

#### Tasks:
1. **Enhanced Audio Mapping**
   - File size to note duration mapping
   - Image colors to harmonic content
   - Connection strength to volume
   - Cluster detection for chord progressions

2. **Advanced Timeline Features**
   - Multiple timeline tracks (notes, images, etc.)
   - Timeline bookmarks and annotations
   - Custom time ranges and loops

3. **Export and Sharing**
   - Export timeline as video
   - Audio-only export of sonification
   - Save/load timeline configurations
   - Share timeline settings

4. **Integration Polish**
   - Settings integration with main plugin
   - Keyboard shortcuts
   - Accessibility features
   - Documentation and help system

#### Deliverables:
- Complete feature with advanced audio mapping
- Export capabilities
- Full integration with plugin ecosystem

### Phase 5: Content Filtering and Exclusion (Completed)
**Goal**: User control over which files and folders appear in the graph

#### Tasks Completed:
1. **Settings Integration**
   - Added `sonicGraphExcludeFolders` and `sonicGraphExcludeFiles` arrays to plugin settings
   - Integrated with existing settings system for persistence

2. **Autocomplete Modal Implementation**
   - Created `FolderSuggestModal.ts` extending Obsidian's `FuzzySuggestModal<TFolder>`
   - Created `FileSuggestModal.ts` extending Obsidian's `FuzzySuggestModal<TFile>`
   - Both modals use native Obsidian fuzzy search with proper instructions

3. **Control Center UI Enhancement**
   - Added exclusion fields to Sonic Graph Controls Card
   - Implemented "Exclude folders" and "Exclude files" sections
   - Each section includes:
     - Descriptive labels and help text
     - Container for displaying current exclusions
     - "Add" button to open selection modal
     - Individual remove buttons for each exclusion

4. **Graph Data Filtering**
   - Modified `GraphDataExtractor` constructor to accept exclusion options
   - Added `shouldExcludeFile()` method for filtering logic
   - Updated `extractNodes()` to skip excluded files and folders
   - All instantiations updated to pass exclusion settings

5. **Auto-Refresh Functionality**
   - Implemented `refreshGraphWithExclusions()` for real-time updates
   - Graph preview and statistics refresh when exclusions change
   - Maintains user's current view state during updates

6. **UI Styling and Polish**
   - Added comprehensive CSS in `styles/controls.css`
   - Styled exclusion containers, items, and buttons
   - Proper hover effects and empty state messaging
   - Consistent with Obsidian design patterns

#### Technical Implementation:
```typescript
// Settings interface extension
interface SonigraphSettings {
  sonicGraphExcludeFolders?: string[];
  sonicGraphExcludeFiles?: string[];
  // ... existing settings
}

// Graph filtering logic
class GraphDataExtractor {
  constructor(
    private app: App,
    private excludeFolders: string[] = [],
    private excludeFiles: string[] = []
  ) {}

  private shouldExcludeFile(file: TFile): boolean {
    // Check if file itself is excluded
    if (this.excludeFiles.includes(file.path)) return true;
    
    // Check if file is in excluded folder
    return this.excludeFolders.some(folder => 
      file.path.startsWith(folder + '/')
    );
  }
}
```

#### User Experience:
- **Discovery**: Users find exclusion controls in Sonic Graph tab
- **Selection**: Native Obsidian autocomplete for familiar UX
- **Management**: Clear display of current exclusions with easy removal
- **Feedback**: Real-time graph updates show filtering effects
- **Persistence**: Settings saved automatically across sessions

#### Deliverables:
- ✅ Folder exclusion with autocomplete selection
- ✅ File exclusion with autocomplete selection  
- ✅ Real-time graph filtering and refresh
- ✅ Persistent settings storage
- ✅ Professional UI integration
- ✅ Modal structure fixes for proper header display

## Current Implementation Status (v0.8.1-alpha)

### 🎉 **Major Milestones Achieved**
- **✅ Phases 1 & 2 Complete**: Full temporal graph animation system with audio synchronization
- **✅ Phase 5 Complete**: Comprehensive content filtering and exclusion system
- **🚧 Phase 3 In Progress**: Enhanced visualization with partial interactive features

### 🏗️ **Files Created/Modified**

#### New Files Created:
- `src/graph/TemporalGraphAnimator.ts` - Complete timeline animation system
- `src/ui/FolderSuggestModal.ts` - Folder selection autocomplete
- `src/ui/FileSuggestModal.ts` - File selection autocomplete

#### Major Files Enhanced:
- `src/graph/GraphRenderer.ts` - Advanced force simulation with organic clustering
- `src/ui/SonicGraphModal.ts` - Audio integration and timeline controls
- `src/graph/GraphDataExtractor.ts` - Exclusion filtering and comprehensive metadata
- `src/ui/control-panel.ts` - Exclusion UI and graph controls
- `styles/sonic-graph.css` - Sonic Graph visualization and temporal animation styling
- `styles/controls.css` - Exclusion system styling

### 🎵 **Audio System Status**
- **Real Musical Playback**: Notes actually play when nodes appear
- **Instrument Mapping**: Different file types trigger different instruments
- **Musical Properties**: File characteristics mapped to pitch, duration, velocity
- **Audio Engine Integration**: Fully connected to existing plugin audio system

### 🎮 **Interactive Features Status**
- **✅ Timeline Controls**: Play/pause/stop with speed control (0.5x-5x)
- **✅ Seek Functionality**: Click timeline to jump to specific moments
- **✅ Real-time Updates**: Graph and audio sync during playback
- **✅ Exclusion System**: Real-time filtering with native Obsidian autocomplete
- **✅ Zoom/Pan Controls**: Full graph navigation with reset button
- **⏳ File Opening**: Click-to-open files in Obsidian (planned for Phase 3)

### 🎨 **Visual System Status**
- **✅ File Type Styling**: Distinct colors and visual treatment per file type
- **✅ Organic Layout**: Natural clustering with jitter for realistic positioning
- **✅ Smooth Animations**: D3-powered transitions for node appearances
- **✅ Responsive Design**: Proper scaling and layout adaptation
- **⏳ Thumbnails**: Image previews for image nodes (planned enhancement)

### 🚀 **Next Development Priorities**
1. **Complete Phase 3**: Add click-to-open file functionality
2. **Performance Optimization**: Canvas rendering for large graphs
3. **Phase 4 Features**: Advanced audio mapping and export capabilities
4. **User Testing**: Gather feedback on current temporal animation system

#### Additional Improvements:
1. **Icon Enhancement**
   - Changed Sonic Graph button icon from 'activity' to 'chart-network'
   - Provides better visual representation of network/graph functionality
   - Maintains consistency with graph visualization theme

2. **Modal Structure Fixes**
   - **Issue**: Sonic Graph modal header was covering the close button
   - **Solution**: Adopted Control Center modal pattern:
     - Close button positioned outside main container with absolute positioning
     - Header includes right padding (56px) to avoid close button overlap
     - Proper z-index layering (close button: 1002, header: 1001)
     - Container structure matches proven Control Center approach
   - **Result**: Professional modal interface with accessible close button

3. **Code Quality Improvements**
   - Enhanced error handling and user feedback throughout exclusion system
   - Comprehensive logging for debugging exclusion operations
   - Proper async/await patterns for modal interactions
   - TypeScript type safety for all new components

## Technical Specifications

### Dependencies
```json
{
  "d3": "^7.8.5",
  "d3-force": "^3.0.0",
  "d3-selection": "^3.0.0",
  "d3-transition": "^3.0.1",
  "d3-scale": "^4.0.2",
  "d3-zoom": "^3.0.0"
}
```

### File Structure
```
src/
├── graph/
│   ├── GraphDataExtractor.ts      # Vault data extraction (✅ Enhanced with exclusion filtering)
│   ├── TemporalGraphAnimator.ts   # D3-force animation controller
│   ├── AudioVisualSync.ts         # Audio-visual synchronization
│   ├── GraphRenderer.ts           # SVG rendering and styling
│   ├── TimelineController.ts      # Timeline playback logic
│   └── types.ts                   # Graph-related type definitions
├── ui/
│   ├── SonicGraphModal.ts         # ✅ Main sonic graph interface (implemented)
│   ├── FolderSuggestModal.ts      # ✅ Folder selection autocomplete (implemented)
│   ├── FileSuggestModal.ts        # ✅ File selection autocomplete (implemented)
│   ├── control-panel.ts           # ✅ Enhanced with exclusion controls (implemented)
│   ├── TimelineModal.ts           # Main timeline interface
│   ├── TimelineControls.ts        # Playback controls component
│   └── GraphSettingsPanel.ts     # Configuration interface
├── utils/
│   ├── constants.ts               # ✅ Enhanced with exclusion settings (implemented)
│   ├── GraphUtils.ts              # Graph analysis utilities
│   └── ColorExtraction.ts         # Image color analysis
└── styles/
    ├── controls.css               # ✅ Enhanced with exclusion styling (implemented)
    ├── sonic-graph.css            # ✅ Enhanced with modal fixes (implemented)
    └── ...                        # Other style files
```

### Performance Targets
- **Graph Size**: Support up to 5,000 nodes smoothly
- **Animation**: Maintain 60fps during playback
- **Load Time**: Graph extraction under 2 seconds for typical vaults
- **Memory**: Keep under 100MB for large graphs

### Visual Design Guidelines
- **Node Sizes**: 8-24px radius based on importance/connections
- **Colors**: File type based with customizable themes
- **Animation**: Smooth easing with configurable duration
- **Typography**: Readable labels with collision avoidance

## Integration Points

### Existing Sonigraph Systems
1. **AudioEngine**: Direct integration for sound triggering
2. **Settings System**: Timeline preferences and visual options
3. **Control Panel**: Launch button and basic controls
4. **Plugin Architecture**: Modal system and event handling

### Obsidian API Usage
1. **Vault.getFiles()**: File enumeration and metadata
2. **MetadataCache**: Link and reference detection
3. **FileManager**: File operations and watching
4. **Workspace**: Modal management and UI integration

## Risk Assessment

### Technical Risks
- **Performance**: Large graphs may impact animation smoothness
- **Memory**: D3 simulations can be memory intensive
- **Compatibility**: D3 version conflicts with other plugins

### Mitigation Strategies
- Implement level-of-detail rendering for performance
- Add memory usage monitoring and cleanup
- Use specific D3 module imports to avoid conflicts
- Provide fallback canvas rendering for complex graphs

## Success Metrics

### User Experience
- Users can visualize their knowledge evolution over time
- Smooth, intuitive timeline controls
- Clear audio-visual correlation
- Minimal learning curve for basic features

### Technical Performance
- 60fps animation on typical hardware
- Sub-2-second load times for average vaults
- Stable memory usage during extended sessions
- No conflicts with existing plugin functionality

## Future Enhancements

### Phase 5: Custom Instrument Assignment
**Goal**: User-controlled instrument mapping for personalized sonification

#### Node-Level Assignment
- **Manual assignment** - Right-click context menu to assign instruments to specific files
- **Bulk assignment tools** - Assign by tags, folders, date ranges, or file types
- **Visual indicators** - Node colors/shapes reflect assigned instruments in graph
- **Assignment storage** - Multiple options: frontmatter, plugin settings, or sidecar files
- **Smart defaults** - Fallback hierarchy: custom → file type → default mapping
- **Conflict resolution** - Handle overlapping assignment rules gracefully
- **Import/export** - Share instrument assignment sets between vaults
- **Conditional assignments** - Dynamic rules based on file properties or content
- **Real-time modification** - Change instrument assignments during playback

#### Line-Level Assignment (Advanced)
**Goal**: Granular instrument control within individual documents

##### Content-Based Automatic Assignment
- **Markdown structure mapping**:
  - Headers (`# ## ###`) → Brass instruments (announcements/fanfares)
  - Lists (`- * +`) → Percussion (rhythmic elements)
  - Code blocks (```) → Electronic/synthetic instruments
  - Quotes (`>`) → Strings (contemplative/flowing)
  - Bold/Italic → Accent instruments or volume changes
  - Links → Transition sounds or chord changes
- **Semantic analysis**:
  - Sentiment detection → Major/minor key selection
  - Topic modeling → Technical vs. expressive instrument choices
  - Writing style → Formal (classical) vs. casual (modern) instruments
  - Emotional intensity → Soft vs. powerful instrument selection

##### Manual Assignment Interface
- **In-editor integration**:
  - Line gutters with small instrument icons
  - Right-click context menus for any line
  - Keyboard shortcuts for quick assignment
  - Command palette integration
- **Bulk assignment tools**:
  - Pattern matching with regex support
  - Selection-based multi-line assignment
  - Tag-based automatic assignment
  - Template-based patterns for document types

##### Storage and Data Management
- **Frontmatter approach**:
  ```yaml
  sonic-graph:
    line-instruments:
      1: "piano"
      5: "violin"
      12-15: "flute"
      "h1": "trumpet"  # All H1 headers
      "code": "synth"  # All code blocks
  ```
- **Sidecar file approach**: `.sonic-assignments.json` files
- **Plugin settings**: Global rules and per-vault customizations
- **Performance optimization**:
  - Incremental parsing of changed lines only
  - Caching with file modification timestamps
  - Lazy loading during playback
  - Background processing during idle time

##### Musical Implementation
- **Timing and rhythm**:
  - Line duration based on content length
  - Phrase grouping for related lines
  - Breathing space between sections
  - Tempo mapping based on document flow
- **Harmonic considerations**:
  - Chord progressions within paragraphs
  - Key relationship maintenance
  - Smooth voice leading between instruments
  - Counterpoint for simultaneous instruments

##### Progressive Implementation
1. **Foundation**: Basic line parsing, manual assignment UI, fallback systems
2. **Automation**: Markdown structure detection, pattern-based rules, bulk tools
3. **Intelligence**: Semantic analysis, context-aware suggestions, learning patterns
4. **Advanced**: Real-time assignment, collaborative sharing, composition tools

### Potential Extensions
- **Collaborative Timelines**: Show multiple users' contributions
- **Semantic Analysis**: Group nodes by topic or content similarity
- **Advanced Layouts**: Tree, radial, or hierarchical arrangements
- **Real-time Mode**: Live updates as vault changes
- **VR/AR Support**: 3D timeline visualization

### Integration Opportunities
- **Git Integration**: Show commit history in timeline
- **Calendar Sync**: Correlate with external events
- **Social Features**: Share and compare timelines
- **Academic Tools**: Citation and reference tracking

---

## Next Steps

1. **Review and Approval**: Stakeholder review of this plan
2. **Environment Setup**: Configure development environment
3. **Phase 1 Kickoff**: Begin foundation implementation
4. **Regular Check-ins**: Weekly progress reviews and adjustments

This plan provides a comprehensive roadmap for implementing temporal graph animation with D3-force integration, ensuring a smooth development process and high-quality end result. 