# Sonigraph Feature Catalog

**Purpose**: Comprehensive specifications for all Sonigraph features
**Audience**: Developers, contributors, and detailed planning
**Last Updated**: 2025-10-10 (v0.16.0)

## Table of Contents

- [Feature Status Summary](#feature-status-summary)
- [1. Audio Engine Features](#1-audio-engine-features)
- [2. User Interface Features](#2-user-interface-features)
- [3. Performance Features](#3-performance-features)
- [4. Integration Features](#4-integration-features)
- [5. Advanced Features](#5-advanced-features)
- [6. Visualization Features](#6-visualization-features)
- [7. Upcoming Features](#7-upcoming-features)

---

## Feature Status Summary

### ✅ Complete & Production Ready (v0.16.0)
- **Timeline Mode**: Chronological playback through vault history
- **30 Active Instruments**: Full orchestral palette (keyboard, strings, woodwinds, brass, percussion, synths)
- **Continuous Layers**: Genre-based ambient, rhythmic, and harmonic background layers
- **Sonic Graph Visualization**: Interactive graph with temporal animation, timeline controls, and granularity system
- **Visual Note Display**: Piano Roll, Spectrum Analyzer, and Staff Notation modes
- **Audio Export**: Multi-format export (WAV, M4A, WebM, OGG, FLAC) with metadata
- **Freesound Integration**: Professional sample browser with 114 curated samples
- **Content-Aware Mapping**: File type, tag, folder, and frontmatter-based instrument assignment
- **Effect Presets**: 11 professional acoustic environment presets
- **Master Effects Bus**: Reverb, 3-band EQ, compression, limiting

### 🔄 In Stabilization
- **Continuous Layers System**: Performance tuning and refinement

### 📋 Planned (v0.17-19)
- **Local Soundscape** (v0.17-18): Immersive audio-visual note connection analysis
- **Note Journey** (v0.18-19): Dynamic navigation-based sonification mode

**Instrument Specifications**: For comprehensive details on all instruments, see [Instruments Catalog](instruments-catalog.md).

## 1. Audio Engine Features

### 1.1. Synthesis Engines
- **Harmonic Engine**: Advanced harmonic processing and analysis
- **Percussion Engine**: Physics-based percussion synthesis
- **Electronic Engine**: Professional analog-style synthesis
- **Environmental Engine**: Natural sound processing and spatialization

### 1.2. Effects Processing
- **Per-Instrument Effects**: Individual reverb, chorus, filter chains
- **Master Effects Bus**: Global reverb, 3-band EQ, compressor, limiter
- **Effect Presets System**: 11 professional acoustic environment presets
  - **Venue Presets**: Concert Hall, Cathedral, Studio, Jazz Club, Arena
  - **Genre Presets**: Ambient, Classical, Electronic, Cinematic
  - **Utility Presets**: Dry (minimal effects), Lush (maximum richness)
  - **Application Modes**: Family-level, global, and per-instrument presets
  - **Custom Presets**: User-created preset saving and management
- **Real-Time Control**: Parameter preview, A/B bypass, performance monitoring

### 1.3. Voice Management
- **Adaptive Voice Allocation**: Intelligent voice stealing and pooling
- **Performance Optimization**: CPU monitoring with automatic quality adjustment
- **Memory Management**: Efficient voice reuse and cleanup
- **Quality Scaling**: High/Medium/Low quality modes based on system performance

---

## 2. User Interface Features

### 2.1. Control Center (Material Design)
- **10-Tab Interface**: Status, Musical, Master, plus 7 instrument family tabs
- **Real-Time Updates**: Live performance metrics and status monitoring
- **Professional Workflow**: Intuitive controls with visual feedback
- **Responsive Design**: Adaptive layouts for different screen sizes

### 2.2. Settings Management
- **Persistent Configuration**: Cross-session settings retention
- **Migration System**: Automatic upgrade path for expanding instrument count
- **User-Friendly Defaults**: 5 core instruments enabled, conservative settings
- **Hierarchical Structure**: Organized settings supporting unlimited expansion

### 2.3. Advanced Controls
- **Effect Parameter Control**: Precise adjustment with musical context
- **Effect Presets UI**: One-click acoustic environment transformation
  - **Dropdown Integration**: Seamless integration with existing family tabs
  - **Visual Feedback**: Clear indication of applied presets vs custom settings
  - **Hierarchical Control**: Global > Family > Instrument preset hierarchy
  - **Preset Categories**: Organized by venue, genre, and utility types
- **Performance Monitoring**: Real-time CPU, memory, and latency display
- **Smart Suggestions**: Context-aware parameter recommendations

---

## 3. Performance Features

### 3.1. Optimization Systems
- **Adaptive Quality**: Automatic performance scaling based on system load
- **Voice Pooling**: Efficient voice reuse and memory management
- **Sample Caching**: Intelligent preloading and browser caching
- **CPU Monitoring**: Real-time performance tracking with quality adjustment

### 3.2. Resource Management
- **Memory Efficiency**: ~30-40MB total footprint for complete instrument library
- **Network Optimization**: CDN-based sample delivery with compression
- **Emergency Mode**: Automatic activation when CPU > 90%
- **Graceful Degradation**: Fallback to synthesis when samples unavailable

---

## 4. Integration Features

### 4.1. Obsidian Integration
- **Plugin API Compatibility**: Full integration with Obsidian's plugin system
- **Graph Data Processing**: Real-time vault analysis and musical mapping
- **Settings Persistence**: Integration with Obsidian's settings system
- **Performance Considerations**: Minimal impact on Obsidian's core functionality

### 5.2. External Integrations
- **Freesound.org API**: OAuth2 integration for expanded sample library
- **CDN Sample Delivery**: Global content delivery for optimal performance
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge support
- **Cross-Platform**: Windows, macOS, Linux compatibility

---

## 6. Future Expansion Plans

### 6.1. Natural Soundscapes (55+ Instruments)
**Animal Sounds Collection**:
- **Birds** (800-3000Hz): Dawn chorus, songbirds, birds of prey
- **Mammals**: Cats (400-2000Hz), Dogs (200-1500Hz), Wolves (100-800Hz)
- **Marine Life**: Dolphins (1000-8000Hz), additional whale species
- **Large Animals**: Elephants (5-200Hz), Big Cats (50-600Hz), Bears (80-400Hz)

**Environmental Atmospheres**:
- **Weather**: Rain (20-8000Hz), Wind (200-6000Hz), Thunder (10-200Hz)
- **Natural Elements**: Ocean Waves (20-4000Hz), Fire (100-6000Hz)
- **Insects**: Crickets (2000-8000Hz), Bees (200-4000Hz), Frogs (300-2000Hz)

**Experimental & World Instruments**:
- **Electronic**: Theremin (50-4000Hz), Mechanical (50-2000Hz), Cosmic (10-8000Hz)
- **Acoustic**: Glass Harmonics (400-4000Hz), Singing Bowls (200-3000Hz)
- **Cultural**: Didgeridoo (30-300Hz), Hang Drum (200-1000Hz), Kalimba (400-2000Hz)

### 6.2. Planned UI Features

#### Sample Manager
**Purpose**: Comprehensive sample management with intelligent storage control
**Features**:
- **Family-Based Organization**: Sample library organized by instrument families
- **Smart Background Downloading**: Automatic download when instruments first enabled
- **Cross-Origin Solutions**: CDN integration with CORS handling
- **Storage Management**: Usage display, cache controls, selective cleanup
- **Quality Selection**: MP3/WAV/OGG format support with bandwidth optimization
- **Progress Indicators**: Real-time download progress and status feedback

#### Audio Export & Recording
**Purpose**: Multi-format export with cloud integration and real-time recording
**Features**:
- **Export Formats**: MP3, WAV, OGG, MIDI with quality settings
- **Real-Time Recording**: Live sonification session capture
- **Cloud Integration**: Direct upload to SoundCloud, YouTube, Google Drive
- **Metadata Embedding**: Custom metadata with graph visualization thumbnails
- **Batch Operations**: Multiple format export and bulk processing
- **Session Replay**: Save and replay exact sonification sequences

#### Sequence Controls
**Purpose**: Flexible sequence duration and artistic note distribution controls
**Features**:
- **Duration Presets**: 30s, 1min, 2min, 5min, 10min, Custom
- **Distribution Patterns**: Linear, Crescendo, Diminuendo, Random, Custom curves
- **Adaptive Scaling**: Duration adjustment based on vault complexity
- **Per-Session Overrides**: Temporary settings without changing global defaults
- **Preview Mode**: Real-time preview of sequence changes
- **Musical Context**: Tempo-aware duration calculations

#### Instrument Search
**Purpose**: Fuzzy search for quick instrument location with real-time filtering
**Technical Implementation**:
- **Search Engine**: Obsidian's `prepareFuzzySearch()` API integration
- **UI Integration**: Search field in Control Center modal header
- **Real-Time Filtering**: Live filtering of tabs and cards during typing
- **Highlight Rendering**: `SearchResult.matches` for text highlighting
- **Keyboard Navigation**: Arrow keys, Enter to enable/configure instruments
- **Search Scope**: Instrument names, family names, aliases, descriptions
- **Performance**: Optimized for 34+ instruments with sub-100ms response

#### Effect Presets System
**Purpose**: One-click acoustic environment transformation with professional presets
**Features**:
- **11 Professional Presets**: Concert Hall, Jazz Club, Cathedral, Studio, etc.
- **Family-Level Application**: Apply presets to entire instrument families
- **Global Transformation**: One-click acoustic environment change for all instruments
- **Custom Preset Creation**: Save and manage user-defined effect combinations
- **Preset Categories**: Venue-based, genre-based, and utility presets
- **Real-Time Preview**: Hear preset effects before applying
- **Preset Blending**: Combine multiple presets with custom weighting

#### Export Options
**Purpose**: Enhanced log export with folder memory and custom naming
**Features**:
- **Folder Memory**: Remember last export location across sessions
- **Format Filtering**: Export specific log types or date ranges
- **Naming Templates**: Dynamic variables (date, vault name, instrument count)
- **Batch Export**: Multiple format export with compression options
- **Metadata Inclusion**: Export settings and configuration alongside logs

### 6.3. Advanced Features

#### Timeline Integration
**Purpose**: Visual-audio synchronization with temporal sonification
**Features**:
- **Synchronized Playback**: Graph timeline animation matched to audio sequence
- **Temporal Sonification**: Node birth sounds, connection chimes, edge traversal audio
- **Timeline Controls**: Play/pause/scrub affecting both visual and audio
- **Era-Based Instruments**: Historical instrument selection based on content dates
- **Visual Feedback**: Audio progress indicators on graph visualization
- **Bidirectional Control**: Audio playback position drives graph animation

#### Content Filtering
**Purpose**: Folder exclusion and file filtering with real-time preview
**Features**:
- **Pattern Matching**: Glob patterns and regex for folder/file exclusion
- **Filter Types**: File type, size, tags, creation/modification dates
- **Topology Filtering**: Exclude isolated nodes, minimum connection thresholds
- **Real-Time Preview**: Live graph updates showing included/excluded content
- **Save Presets**: Named filter configurations for different use cases
- **Performance Impact**: Efficient filtering with minimal graph recalculation

#### AI Orchestration
**Purpose**: ML-based instrument assignment with adaptive harmony
**Features**:
- **Graph Analysis**: ML models analyzing node relationships for musical decisions
- **Instrument Suggestions**: Context-aware instrument assignment recommendations
- **Harmony Detection**: Automatic chord progression and key detection
- **Orchestral Templates**: Professional arrangement patterns and presets
- **Learning System**: User preference learning and adaptation over time
- **Real-Time Adaptation**: Dynamic orchestration adjustments during playback

#### Graph-Responsive Effects
**Purpose**: Dynamic effects responding to graph topology and real-time changes
**Features**:
- **Connection-Based Modulation**: Effect parameters driven by node connection count
- **Spatial Effects**: 3D positioning based on graph layout coordinates
- **Traversal Synchronization**: Effects timed to graph traversal patterns
- **Topology Awareness**: Effect intensity based on local graph density
- **Real-Time Adaptation**: Effects respond to live vault structure changes
- **Visual Feedback**: Effect parameters visualized on graph elements

#### Performance Monitoring
**Purpose**: Historical performance analysis with visual metrics dashboard
**Features**:
- **Trend Analysis**: CPU, memory, and latency tracking over time
- **Regression Testing**: Automated performance benchmark comparisons
- **Budget Enforcement**: Performance thresholds with automatic quality adjustment
- **Visual Dashboard**: Real-time and historical metrics with charts
- **Alert System**: Performance degradation notifications and recommendations
- **Optimization Suggestions**: Automated recommendations for performance improvement

#### Natural Soundscapes
**Purpose**: Expand to 55+ instruments with animal sounds, environmental atmospheres, and world instruments
**Features**:
- **Animal Sounds**: Whale songs, bird calls, wolf howls, dolphin clicks
- **Environmental Atmospheres**: Ocean waves, forest ambience, rain, wind
- **World Instruments**: Traditional instruments from diverse cultures
- **Seasonal Variations**: Different sounds for seasons and times of day
- **Ecosystem Integration**: Layered natural soundscapes with multiple species
- **Geographic Themes**: Sounds organized by biome (forest, ocean, desert, arctic)
- **Dynamic Environments**: Responsive natural sounds based on graph topology

#### Conductor Interface
**Purpose**: Ensemble control with intelligent orchestration and real-time arrangement
**Features**:
- **Ensemble Management**: Coordinate multiple instrument groups simultaneously
- **Orchestration Suggestions**: AI-driven recommendations for instrument combinations
- **Real-Time Arrangement**: Dynamic musical arrangement adaptation during playback
- **Section Control**: Independent control of strings, brass, woodwinds, percussion
- **Musical Direction**: Tempo, dynamics, and expression control across all instruments
- **Score Visualization**: Visual representation of orchestral arrangement
- **Performance Recording**: Capture and replay conductor decisions

#### Obsidian Integration
**Purpose**: Plugin compatibility improvements and better metadata integration
**Features**:
- **Plugin Compatibility**: Enhanced compatibility with popular Obsidian plugins
- **Metadata Integration**: Leverage Obsidian's metadata for musical decisions
- **Performance Optimization**: Reduced impact on Obsidian's core functionality
- **Theme Integration**: Respect user's chosen Obsidian theme in OSP interfaces
- **Hotkey Integration**: Custom hotkeys for quick OSP actions
- **Workspace Integration**: OSP controls integrated into Obsidian's workspace
- **Plugin API**: Expose OSP functionality for other plugin developers

---

## 6. Visualization Features

### 6.1. Sonic Graph (✅ Complete v0.15.0)
**Purpose**: Interactive graph visualization with temporal animation and professional settings
**Status**: Production ready

**Features**:
- **Static Graph View**: D3.js force simulation with all vault files and connections
- **Timeline Animation**: Audio-synchronized chronological node appearance
- **Timeline Granularity**: Multi-level time controls (Year, Month, Week, Day, Hour, Custom)
- **Time Window Filtering**: Focus on specific periods (All time, Past year, Past month, etc.)
- **Smart Event Spacing**: Intelligent audio distribution to prevent crackling
- **Performance Optimization**: MetadataCache integration for instant loading
- **Advanced Filtering**: Content exclusion with Obsidian autocomplete
- **Professional Settings**: 21+ configuration options with tooltips
- **Cross-Modal Navigation**: Seamless integration with Control Center

### 6.2. Visual Note Display (✅ Complete v0.15.0)
**Purpose**: Multiple visualization modes for note playback and analysis
**Status**: Production ready

**Modes**:
- **Piano Roll**: Timeline-based scrolling display
  - Real-time note highlighting with glow effects
  - Adaptive grid (octave horizontal, time vertical)
  - Dynamic pitch labels (C0, C1, C2...)
  - Layer-based color coding (rhythmic, harmonic, melodic, ambient, percussion)

- **Spectrum Analyzer**: Real-time frequency visualization
  - 64 frequency bars with logarithmic spacing
  - Web Audio API AnalyserNode integration
  - 60fps smooth animation
  - Color gradient from red (low) to blue (high)

- **Staff Notation**: Traditional musical staff display
  - Treble and bass clefs with proper positioning
  - MIDI pitch to staff line mapping
  - Note heads with stems
  - Layer-based color coding

**UI Integration**:
- Resizable split-view panel below graph
- Tab switching between modes
- Drag handle for height adjustment
- Timeline synchronization with audio
- Graph node highlighting synchronized with playback

### 6.3. Audio Export (✅ Complete v0.14.0)
**Purpose**: Professional audio export with multiple formats and metadata
**Status**: Production ready

**Features**:
- **Multiple Formats**: WAV (lossless), M4A/AAC, WebM/Opus, OGG/Vorbis, FLAC
- **Quality Presets**: High Quality, Standard, Small Size (128-320 kbps)
- **Custom Time Ranges**: Export specific timeline portions
- **Metadata Support**: Title, artist, album, year, genre, comments
- **Export Presets**: Save and load custom configurations
- **Automatic Documentation**: Generate markdown notes with all settings
- **Progress Tracking**: Real-time feedback with cancellation
- **File Management**: Intelligent collision handling and vault organization

---

## 7. Upcoming Features

### 7.1. Local Soundscape (📋 Planned v0.17-18)
**Purpose**: Immersive audio-visual note connection analysis
**Effort**: 7-9 weeks | **Priority**: High | **User Impact**: Very High

**Features**:
- **Custom Graph Visualization**: Canvas/SVG rendering of note connections
- **Context Menu Integration**: Right-click → "Open in Local Soundscape"
- **Interactive Controls**: Depth slider, filters (tags, folders, file types), groups
- **Layout Options**: Radial, force-directed, hierarchical
- **Integrated Sonification**: Built-in play/pause/stop controls
- **Visual Feedback**: Playing nodes pulse, audio activity indicators
- **Musical Mapping Foundation**: Establishes architecture for Note Journey
- **Node Interaction**: Hover for details, click to re-center or open note
- **Export Capabilities**: Save graph as image or audio file

**Technical Details**:
- Dedicated view pane (can be opened in sidebar or splits)
- Uses Obsidian's MetadataCache for link extraction
- Depth traversal algorithm (1-5 levels configurable)
- Max nodes per depth to control complexity
- Smooth transitions when graph updates

👉 [Full Implementation Plan](active/local-soundscape-plan.md)

### 7.2. Note Journey (📋 Planned v0.18-19)
**Purpose**: Dynamic sonification that follows link-based navigation
**Effort**: 6-8 weeks | **Priority**: High | **User Impact**: Very High

**Features**:
- **Navigation-Based Updates**: Music changes as you click between notes
- **Real-Time Connection Analysis**: Continuous assessment of note relationships
- **Smooth Transitions**: Audio crossfades between note contexts (500-800ms)
- **Depth-Based Layering**: Similar to Local Soundscape but updates automatically
- **Directional Mapping**: Incoming vs outgoing links affect audio characteristics
- **Tag/Folder Integration**: Optional content-aware instrument selection
- **Three Mapping Modes**: Structure-only, Tag-influenced, Hybrid
- **Performance Optimized**: Debouncing, voice limits, smart updates

**User Experience**:
- Click "Start Note Journey" in Control Center
- Navigate vault by clicking links in notes
- Music smoothly transitions with each click
- Visual indicators show current note's connections
- Stop anytime or switch to different mode

**Technical Details**:
- Reuses Local Soundscape's musical mapping engine
- Active note change detection via Obsidian API
- Update throttle (100-200ms) to prevent audio stuttering
- Voice pooling for efficient transitions
- Compatible with existing timeline and continuous layer systems

👉 [Full Implementation Plan](active/note-journey-plan.md)

---

*This catalog serves as the comprehensive reference for all Sonigraph features and specifications. For strategic planning and development priorities, see [Development Roadmap](development-roadmap.md).*
