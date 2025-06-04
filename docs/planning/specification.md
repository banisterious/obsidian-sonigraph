# Sonigraph: Technical Specification

**Tagline**: Your Notes, Orchestrated  
**Version**: 0.1.0  

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Core Functionality](#2-core-functionality)
  - [2.1 Graph Data Acquisition](#21-graph-data-acquisition)
  - [2.2 Musical Mapping Engine](#22-musical-mapping-engine)
  - [2.3 Audio Output System](#23-audio-output-system)
- [3. User Interface Requirements](#3-user-interface-requirements)
  - [3.1 Control Panel](#31-control-panel)
  - [3.2 Settings Management](#32-settings-management)
- [4. Technical Architecture](#4-technical-architecture)
  - [4.1 Technology Stack](#41-technology-stack)
  - [4.2 Module Structure](#42-module-structure)
  - [4.3 Performance Requirements](#43-performance-requirements)
- [5. Data Flow & Processing](#5-data-flow--processing)
  - [5.1 Graph Data Processing](#51-graph-data-processing)
  - [5.2 Musical Parameter Mapping](#52-musical-parameter-mapping)
  - [5.3 Audio Generation Pipeline](#53-audio-generation-pipeline)
- [6. Quality & Reliability](#6-quality--reliability)
  - [6.1 Error Handling](#61-error-handling)
  - [6.2 Testing Strategy](#62-testing-strategy)
  - [6.3 Security Considerations](#63-security-considerations)
- [7. User Experience](#7-user-experience)
  - [7.1 Onboarding](#71-onboarding)
  - [7.2 Accessibility](#72-accessibility)
- [8. Future Enhancements](#8-future-enhancements)
  - [8.1 Timelapse Integration](#81-timelapse-integration)
  - [8.2 Audio Export Features](#82-audio-export-features)
  - [8.3 Advanced Musical Mappings](#83-advanced-musical-mappings)

---

## 1. Project Overview

Sonigraph is an Obsidian plugin that transforms the visual structure of your knowledge graph into music. It maps the visible notes (nodes) and their connections to musical parameters, allowing users to "hear" the relationships and complexity of their ideas through an open-source JavaScript synthesis framework.

### 1.1 Primary Goal
Transform the visual structure of an Obsidian knowledge graph into a unique auditory experience by mapping visible nodes and their connections to musical parameters.

### 1.2 Target Users
- Obsidian users interested in alternative ways to explore their knowledge graphs
- Users seeking creative or meditative approaches to note review
- Researchers looking for pattern recognition through auditory feedback
- Musicians and audio enthusiasts working with knowledge management

### 1.3 Success Criteria
- Seamless integration with Obsidian's existing graph view
- Real-time audio generation without performance degradation
- Intuitive musical mappings that reflect graph structure meaningfully
- Stable performance across various vault sizes (100-10,000+ notes)

## 2. Core Functionality

### 2.1 Graph Data Acquisition

**Primary Requirement**: Access and parse the currently active Obsidian Graph view's underlying data structure.

**Specifications**:
- Extract all nodes and their direct connections from the loaded graph
- Parse note content to identify internal links (`[[note name]]`)
- Build adjacency list representation of the graph
- Handle dynamic updates when graph data changes

**Plugin Compatibility Requirements**:
- **Extended Graph Plugin**: Support enhanced graph features and extended node/edge data
- **Folders to Graph Plugin**: Recognize and process folder structures as graph nodes
- **Graceful Degradation**: Function normally when these plugins are not installed
- **API Integration**: Detect and utilize extended graph APIs when available

**Initial Scope**: Work with full loaded graph data rather than only visually visible nodes (due to API limitations).

### 2.2 Musical Mapping Engine

**Core Mapping Rules**:

**Nodes → Musical Events**:
- Each node corresponds to a musical note/event
- Pitch selection based on user-configurable musical scales
- Instrument assignment based on node properties (connection count, tags, or round-robin)

**Connections → Rhythmic Properties**:
- Connection count influences note duration or rhythmic patterns
- More connections = shorter duration (more active)
- Fewer connections = longer duration (sustained)

**Graph Traversal**:
- Implement configurable traversal methods (breadth-first, depth-first, sequential)
- Support for starting from selected root node or automatic selection
- Playback control integration (Start, Stop, Pause)

### 2.3 Audio Output System

**Technology**: Tone.js JavaScript synthesis framework

**Requirements**:
- Real-time audio generation within Obsidian environment
- Support for multiple synthesis methods (oscillators, samples, FM synthesis)
- Efficient audio scheduling and timing
- Volume and audio quality controls

## 3. User Interface Requirements

### 3.1 Control Panel

**Access Methods**:
- Ribbon icon for quick access
- Command palette entry: "Sonigraph: Open Control Panel"

**Control Panel Components**:
- **Playback Controls**: Play, Stop, Pause buttons with visual state feedback
- **Tempo Control**: BPM slider (range: 60-200 BPM, default: 120)
- **Musical Parameters**:
  - Scale selection dropdown (Major, Minor, Pentatonic, Chromatic, etc.)
  - Root note selection (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- **Graph Traversal Options**:
  - Starting node selection (dropdown or auto-select)
  - Traversal method selection
- **Enable/Disable Toggle**: Master switch for sonification

### 3.2 Settings Management

**Persistent Settings**:
- All user preferences saved using Obsidian's settings API
- Settings tab integration for advanced configuration
- Import/export of setting profiles

**Default Configuration**:
- Scale: C Major
- Tempo: 120 BPM
- Traversal: Breadth-first from most connected node
- Volume: 50%

## 4. Technical Architecture

### 4.1 Technology Stack

**Core Technologies**:
- **Language**: TypeScript
- **Audio Framework**: Tone.js
- **Build System**: Rollup/Webpack (as per Obsidian plugin standards)
- **Testing**: Jest for unit testing
- **API**: Obsidian Plugin API (`obsidian.d.ts`)

### 4.2 Module Structure

**Required Modules**:
```
src/
├── main.ts                 # Plugin entry point
├── graph/
│   ├── parser.ts          # Graph data extraction and parsing
│   ├── traversal.ts       # Graph traversal algorithms
│   └── types.ts           # Graph data type definitions
├── audio/
│   ├── engine.ts          # Audio synthesis and scheduling
│   ├── mapping.ts         # Musical parameter mapping logic
│   └── instruments.ts     # Instrument definitions and management
├── ui/
│   ├── control-panel.ts   # Main control interface
│   ├── settings.ts        # Settings management
│   └── components.ts      # Reusable UI components
└── utils/
    ├── helpers.ts         # Utility functions
    └── constants.ts       # Application constants
```

### 4.3 Performance Requirements

**Benchmarks**:
- Plugin initialization: < 500ms
- Graph parsing for 1000 notes: < 2 seconds
- Audio latency: < 100ms from trigger to sound
- Memory usage: < 50MB for typical vaults
- CPU usage during playback: < 10% on modern systems

**Optimization Strategies**:
- Lazy loading of audio samples and synthesis engines
- Efficient graph data structures and caching
- Web Workers for heavy computation (if needed)
- Debounced UI updates and graph reprocessing

## 5. Data Flow & Processing

### 5.1 Graph Data Processing

**Input**: Obsidian vault with notes and internal links  
**Processing**: 
1. Extract all markdown files from vault
2. Parse internal links (`[[note name]]` format)
3. Build adjacency list with connection weights
4. Calculate node properties (degree, centrality, etc.)

**Output**: Structured graph representation ready for musical mapping

### 5.2 Musical Parameter Mapping

**Input**: Graph data structure  
**Processing**:
1. Apply selected musical scale to assign pitches
2. Map node properties to instrument selection
3. Calculate timing and duration based on connections
4. Generate sequence of musical events

**Output**: Timed sequence of musical events ready for synthesis

### 5.3 Audio Generation Pipeline

**Input**: Musical event sequence  
**Processing**:
1. Initialize Tone.js synthesizers and effects
2. Schedule events according to tempo and timing
3. Apply real-time audio processing
4. Route to system audio output

**Output**: Real-time audio stream

## 6. Quality & Reliability

### 6.1 Error Handling

**Critical Error Scenarios**:
- Empty or disconnected graphs
- Invalid audio device/permissions
- Corrupted vault data
- Plugin API changes

**Error Handling Strategy**:
- Graceful degradation rather than crashes
- Clear user feedback through Obsidian's notification system
- Fallback to default settings when configuration is invalid
- Comprehensive logging for debugging

### 6.2 Testing Strategy

**Unit Testing**:
- Graph parsing logic
- Musical mapping algorithms
- Audio scheduling functions
- Settings persistence

**Integration Testing**:
- Plugin lifecycle management
- Obsidian API interactions
- Audio system integration

**Manual Testing**:
- Cross-platform compatibility (Windows, macOS, Linux)
- Various vault sizes and structures
- Different Obsidian versions

### 6.3 Security Considerations

**Current Scope**:
- Secure settings storage using Obsidian's encrypted storage
- Input validation for all user-provided data
- Safe handling of file system access

**Future Considerations**:
- OAuth 2.0 implementation for cloud integrations
- Secure token storage for external APIs
- Prevention of XSS in custom UI components

## 7. User Experience

### 7.1 Onboarding

**First-Time User Experience**:
- Welcome modal with basic instructions
- Default settings that work immediately
- Sample vault with pre-configured examples
- Tooltips for all major features

**Documentation**:
- Comprehensive README with installation guide
- Video tutorials for basic usage
- FAQ for common issues
- Community forum integration

### 7.2 Accessibility

**Requirements**:
- Keyboard navigation for all controls
- Screen reader compatibility for UI elements
- Visual indicators for audio playback state
- Customizable color schemes and UI scaling

## 8. Future Enhancements

### 8.1 Timelapse Integration

**Advanced Features**:
- Sonification of node appearance/disappearance during timelapse
- Musical representation of connection formation over time
- Temporal mapping of graph evolution to musical progression
- Synchronized visual-audio playback controls

### 8.2 Audio Export Features

**Export Formats**:
- WAV (uncompressed audio)
- MP3 (compressed audio)
- MIDI (musical data)
- SoundCloud direct upload integration

### 8.3 Advanced Musical Mappings

**Sophisticated Algorithms**:
- Centrality measures influencing volume/prominence
- Link types affecting timbre and articulation
- Topological features (cycles, paths) creating musical structures
- User-defined custom mapping rules
- Multiple instrument orchestration based on graph clustering

---

**Document Status**: Draft  
**Next Steps**: Review and create implementation plan 