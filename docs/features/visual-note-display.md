# Visual Note Display Feature

**Status**: 📋 Specification
**Target Version**: TBD
**Priority**: Accessibility Enhancement

## Table of Contents

- [1. Overview](#1-overview)
- [2. User Benefits](#2-user-benefits)
- [3. Feature Scope](#3-feature-scope)
  - [3.1. Core Visualization](#31-core-visualization)
  - [3.2. Display Modes](#32-display-modes)
  - [3.3. Configuration Options](#33-configuration-options)
- [4. Technical Approach](#4-technical-approach)
  - [4.1. Architecture](#41-architecture)
  - [4.2. Data Flow](#42-data-flow)
  - [4.3. Performance Considerations](#43-performance-considerations)
- [5. UI/UX Design](#5-uiux-design)
  - [5.1. Display Location](#51-display-location)
  - [5.2. Visual Elements](#52-visual-elements)
  - [5.3. Color Coding](#53-color-coding)
- [6. Implementation Phases](#6-implementation-phases)
  - [6.1. Phase 1: Basic Piano Roll](#61-phase-1-basic-piano-roll)
  - [6.2. Phase 2: Graph Integration](#62-phase-2-graph-integration)
  - [6.3. Phase 3: Advanced Features](#63-phase-3-advanced-features)
- [7. Settings Integration](#7-settings-integration)
- [8. Accessibility Considerations](#8-accessibility-considerations)
- [9. Future Enhancements](#9-future-enhancements)
- [10. Open Questions](#10-open-questions)

## 1. Overview

The Visual Note Display feature provides real-time visual feedback of musical notes being played during timeline animation playback. This accessibility feature enables hearing-impaired users to experience the musical representation of their knowledge graph while also enhancing the experience for all users by creating a direct visual-audio mapping.

## 2. User Benefits

### Primary Benefits

- **Accessibility**: Enables hearing-impaired users to experience the musical sonification of their graph
- **Learning**: Helps all users understand how graph structure maps to musical parameters
- **Debugging**: Provides visual confirmation that audio is playing as expected
- **Silent Environments**: Allows use of the plugin in libraries, offices, or other quiet spaces
- **Enhanced Understanding**: Creates a multi-sensory experience connecting visual graph structure to musical output

### Use Cases

1. **Hearing-Impaired Users**: Experience musical representation through visual feedback
2. **Audio Troubleshooting**: Verify that notes are triggering correctly without sound
3. **Educational**: Learn how graph relationships translate to musical patterns
4. **Presentations**: Demonstrate the plugin in environments where audio may not be appropriate
5. **Multi-Modal Learning**: Reinforce understanding through both visual and auditory channels

## 3. Feature Scope

### 3.1. Core Visualization

The feature displays real-time visual representations of:

- **Active Notes**: Which notes are currently playing
- **Note Pitch**: Visual representation of note frequency/pitch
- **Note Duration**: How long each note sustains
- **Instrument/Layer**: Which audio layer is producing the sound
- **Intensity**: Note velocity or volume

### 3.2. Display Modes

#### Piano Roll Display
- Horizontal scrolling timeline with notes as bars
- Vertical axis represents pitch (low to high)
- Bar length represents duration
- Color represents instrument/layer

#### Graph Node Highlighting
- Graph nodes pulse or glow when their associated notes play
- Edge lines animate when connection-based notes trigger
- Intensity of glow corresponds to note volume
- Color corresponds to instrument/layer

#### Spectrum Analyzer
- Real-time frequency spectrum visualization
- Shows amplitude across frequency range
- Responsive to actual audio output
- Useful for understanding overall sonic texture

#### Musical Staff Notation
- Traditional musical staff showing notes in real-time
- Displays melody line (primary layer)
- Shows chord symbols for harmonic content
- Educational value for users familiar with music notation

### 3.3. Configuration Options

**Visual Display Settings:**
- Toggle visual display on/off
- Select display mode (piano roll, graph highlighting, spectrum, staff)
- Position preference (bottom panel, overlay, sidebar)
- Opacity/transparency controls
- Size/scale adjustments

**Color and Style:**
- Color scheme selection (layer-based, pitch-based, custom)
- Animation style (smooth, discrete, pulsing)
- Trail/decay effects for note visualization
- High contrast mode for accessibility

**Performance:**
- Frame rate limiting
- Detail level (simple vs. complex visuals)
- Enable/disable effects for performance

## 4. Technical Approach

### 4.1. Architecture

**Components:**

```
NoteVisualizationManager
├── VisualizationRenderer (base class)
│   ├── PianoRollRenderer
│   ├── GraphHighlightRenderer
│   ├── SpectrumRenderer
│   └── StaffNotationRenderer
├── NoteEventCollector
├── VisualizationSettingsManager
└── PerformanceMonitor
```

**Integration Points:**
- Hook into Tone.js Transport for timing synchronization
- Subscribe to note trigger events from audio engine
- Access graph node data for highlighting
- Integrate with timeline animation system

### 4.2. Data Flow

1. **Note Event Capture**:
   - Audio engine triggers note events
   - Events include: pitch, velocity, duration, instrument, timestamp
   - Events queued in NoteEventCollector

2. **Synchronization**:
   - Sync with Tone.js Transport time
   - Account for audio latency/buffer offset
   - Maintain frame-accurate timing

3. **Rendering**:
   - VisualizationRenderer processes event queue
   - Updates visual display at configurable frame rate
   - Handles animation states (attack, sustain, release)
   - Cleans up completed note visualizations

4. **Graph Integration**:
   - Map note events to source graph nodes
   - Apply visual effects to corresponding DOM elements
   - Coordinate with D3.js graph rendering

### 4.3. Performance Considerations

**Optimization Strategies:**

- **Event Pooling**: Reuse visualization objects to minimize garbage collection
- **Frame Rate Limiting**: Cap at 30-60 fps based on user preference
- **Level of Detail**: Simplify visuals when many notes play simultaneously
- **Canvas vs. SVG**: Use canvas for high-frequency updates, SVG for graph integration
- **Lazy Rendering**: Only render visible portion of timeline in piano roll mode
- **Throttling**: Limit update frequency during intensive playback

**Performance Budgets:**
- Target: <5ms per frame for visualization updates
- Maximum: 100 active note visualizations simultaneously
- Fallback: Disable effects if frame rate drops below threshold

## 5. UI/UX Design

### 5.1. Display Location

**Selected Approach: Split View with Resizable Bottom Panel**

The visual note display will integrate directly into the existing Sonic Graph View as a resizable bottom panel:

**Layout:**
- **Top Section**: Existing graph view (maintains full functionality)
- **Resizable Divider**: Draggable separator between graph and visualization
- **Bottom Panel**: Visual note display (piano roll, spectrum, etc.)
- **Default Height**: 250px (adjustable from 150px to 400px)

**Benefits:**
- Users see graph structure AND musical visualization simultaneously
- Graph nodes can pulse/glow while piano roll shows detailed timeline
- No context switching - everything visible at once
- Maintains existing Sonic Graph View behavior
- Familiar split-panel UX pattern

**Behavior:**
- Panel auto-shows when timeline playback starts (if enabled in settings)
- Panel can be manually toggled via toolbar button
- Panel height preference saved per-user
- Panel can be collapsed to just show header bar
- Smooth slide-in/out animations

### 5.2. Visual Elements

**Piano Roll Display:**
- Timeline grid with measure markers
- Horizontal scrolling synchronized to playback position
- Note bars with rounded corners and subtle shadows
- Playhead indicator (vertical line) showing current time
- Pitch labels on vertical axis (C4, D4, E4, etc.)

**Graph Highlighting:**
- Pulsing glow effect around active nodes
- Color intensity fades during note decay
- Edge animation with traveling particles
- Subtle scale transformation (1.0 → 1.1) during note attack

**Spectrum Analyzer:**
- Bar graph or filled waveform
- Smoothed amplitude transitions
- Frequency bands with logarithmic spacing
- Peak indicators for dominant frequencies

**Staff Notation:**
- Treble clef staff with flowing notes
- Notes appear ahead of playback position
- Highlight current note being played
- Auto-scroll to keep playback position centered

### 5.3. Color Coding

**Instrument/Layer-Based (Default):**
- Rhythmic layer: Orange (#FF6B35)
- Harmonic layer: Blue (#4ECDC4)
- Melodic layer: Purple (#A78BFA)
- Ambient layer: Green (#10B981)
- Percussion: Red (#EF4444)

**Pitch-Based:**
- Low frequencies: Deep blue
- Mid frequencies: Green to yellow
- High frequencies: Orange to red
- Creates rainbow effect across pitch range

**Intensity-Based:**
- Louder notes: Brighter, more saturated colors
- Quieter notes: Desaturated, pastel colors
- Creates dynamic visual expression

**High Contrast:**
- Black background
- White notes with colored borders
- Enhanced visibility for accessibility

## 6. Implementation Phases

### 6.1. Phase 1: Basic Split View Panel

**Goals:**
- Implement resizable split view in Sonic Graph View
- Create basic piano roll visualization
- Synchronize with timeline playback
- Basic note rendering (pitch, duration, layer)

**Tasks:**
1. Add resizable bottom panel to SonicGraphView.ts
   - Create panel container with header and content areas
   - Implement draggable divider with height constraints
   - Save/restore panel height in settings
   - Add collapse/expand functionality
2. Create NoteVisualizationManager class
   - Initialize on view load
   - Manage lifecycle (start/stop with playback)
   - Handle settings updates
3. Implement PianoRollRenderer
   - Canvas-based rendering for performance
   - Pitch axis with note labels
   - Timeline with measure markers
   - Note bars with color coding
4. Hook into audio engine note events
   - Subscribe to note trigger events
   - Capture pitch, velocity, duration, layer, timestamp
   - Queue events for rendering
5. Implement basic color coding by layer
   - Rhythmic: Orange (#FF6B35)
   - Harmonic: Blue (#4ECDC4)
   - Melodic: Purple (#A78BFA)
   - Ambient: Green (#10B981)
6. Add toggle in Control Center settings
   - Enable/disable visual display
   - Auto-show on playback option
   - Display mode selector

**Deliverables:**
- Resizable split view panel in Sonic Graph View
- Working piano roll display
- Synchronized note visualization
- Basic configuration options

**Success Criteria:**
- Panel resizes smoothly without lag
- Notes appear in sync with audio (±50ms)
- Smooth animation at 30+ fps
- Correct pitch and duration display
- Panel height persists across sessions

### 6.2. Phase 2: Graph Node Highlighting

**Goals:**
- Implement graph node highlighting in top panel
- Map notes to source graph nodes
- Create visual connection between graph and piano roll
- Simultaneous visualization in both panels

**Tasks:**
1. Implement GraphHighlightRenderer
   - Apply CSS classes to graph nodes for glow effects
   - Coordinate with existing D3.js graph rendering
   - Handle node activation/deactivation timing
2. Create note-to-node mapping system
   - Map audio events to source graph nodes
   - Handle connections/edges for link-based notes
   - Support multiple simultaneous highlights
3. Add pulsing/glow effects to graph nodes
   - CSS transitions for smooth animations
   - Layer-based color coding
   - Scale transformation on activation
4. Implement edge animation for connections
   - Traveling particles along edge paths
   - Synchronize with connection-based note events
5. Coordinate dual visualization
   - Piano roll in bottom panel shows timeline
   - Graph nodes in top panel pulse simultaneously
   - Visual coherence between both displays

**Deliverables:**
- Graph node highlighting synchronized to audio
- Edge animations for connection events
- Dual visualization (graph + piano roll)
- Settings for graph highlighting intensity

**Success Criteria:**
- Accurate node-to-note mapping
- Visually appealing highlight effects
- No performance degradation to graph rendering
- Smooth coordination between top and bottom panels

### 6.3. Phase 3: Advanced Features

**Goals:**
- Add spectrum analyzer
- Implement staff notation display
- Add advanced customization options

**Tasks:**
1. Implement SpectrumRenderer using Web Audio API
2. Implement StaffNotationRenderer
3. Add multi-visualization support (show multiple modes)
4. Create advanced color scheme options
5. Add export capability (screenshot/video of visualization)
6. Implement performance optimizations

**Deliverables:**
- Spectrum analyzer display
- Musical staff notation display
- Enhanced customization options
- Export functionality

**Success Criteria:**
- All display modes working correctly
- User can customize appearance extensively
- Export produces high-quality output

## 7. Settings Integration

**Control Center Settings Panel:**

**Visual Display Section:**
```
┌─ Visual Note Display ────────────────────────────┐
│                                                   │
│ ☑ Enable Visual Display                          │
│                                                   │
│ Display Mode: [Piano Roll ▼]                     │
│   • Piano Roll - Timeline view                   │
│   • Graph Highlighting - Node illumination       │
│   • Spectrum Analyzer - Frequency display        │
│   • Staff Notation - Musical score               │
│                                                   │
│ Position: [Bottom Panel ▼]                       │
│                                                   │
│ Color Scheme: [By Layer ▼]                       │
│   • By Layer - Different color per instrument    │
│   • By Pitch - Rainbow across frequency range    │
│   • By Intensity - Brightness based on volume    │
│   • High Contrast - Enhanced visibility          │
│                                                   │
│ Opacity: [░░░░░░▓▓▓▓] 75%                        │
│                                                   │
│ ☑ Show Note Labels                               │
│ ☑ Show Timeline Grid                             │
│ ☐ Enable Trail Effects                           │
│                                                   │
│ Performance:                                      │
│   Frame Rate: [30 fps ▼]                         │
│   Detail Level: [Normal ▼]                       │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Quick Toggle:**
- Add visual display icon to Control Center toolbar
- Keyboard shortcut for quick enable/disable
- Remember last used mode and settings

## 8. Accessibility Considerations

### Visual Accessibility

**High Contrast Mode:**
- Maximum contrast between foreground and background
- Clear, bold visual elements
- Reduced reliance on color alone for information

**Customizable Colors:**
- Allow users to define custom color schemes
- Support for colorblind-friendly palettes
- Adjustable brightness and saturation

**Scalability:**
- Support for different display sizes
- Zoom functionality for detailed viewing
- Adjustable text size for labels

### Alternative Text and Labels

**Descriptive Elements:**
- ARIA labels for all interactive elements
- Tooltip descriptions for visualization modes
- Clear status messages (e.g., "Playing C4 on harmonic layer")

**Screen Reader Support:**
- Announce significant note events
- Provide text alternative describing current visualization state
- Ensure all controls are keyboard accessible

### Reduced Motion

**Motion Sensitivity:**
- Option to disable animations entirely
- Static display mode showing current active notes
- Configurable animation speed/intensity

## 9. Future Enhancements

### Advanced Visualizations

**3D Visualization:**
- Three-dimensional note space
- WebGL-based rendering for performance
- Camera controls for different perspectives

**Particle Systems:**
- Notes trigger particle emissions
- Particles represent note energy/timbre
- Create organic, flowing visualizations

**Heat Map:**
- Show note density over time
- Highlight frequently played pitches
- Reveal patterns in graph-to-music mapping

### Export and Sharing

**Video Export:**
- Render visualization alongside audio export
- Support for different video formats (MP4, WebM)
- Customizable resolution and quality

**Screenshot Mode:**
- Capture current visualization state
- High-resolution output for presentations
- Automatic annotation with timestamp

**Live Streaming:**
- WebRTC support for sharing visualization
- Collaborative viewing of graph sonification
- Screen sharing integration

### Integration Enhancements

**MIDI Visualization:**
- Display external MIDI input alongside graph notes
- Compare generated patterns with live performance
- Support for MIDI file import/export

**Multi-Track View:**
- Separate piano rolls for each layer
- Vertical stacking of instrument tracks
- DAW-style mixer view with visual feedback

## 10. Open Questions

### Design Decisions

1. **Default Display Mode**: Which visualization mode should be enabled by default?
   - Recommendation: Piano roll for simplicity, with prominent option to try graph highlighting

2. **Performance vs. Visual Fidelity**: Where should we draw the line on visual effects?
   - Need to test on various hardware configurations
   - Consider adaptive quality based on detected performance

3. **Screen Real Estate**: How much space should the visualization occupy?
   - Should it auto-hide when not in playback?
   - Collapsible with animation?

4. **Mobile Support**: Should this feature be available on mobile devices?
   - Touchscreen interaction considerations
   - Performance constraints on mobile hardware

### Technical Considerations

1. **Timing Precision**: How do we handle audio latency and ensure perfect sync?
   - Need to measure and compensate for system audio latency
   - Consider lookahead buffering for visual elements

2. **Event Throttling**: How many simultaneous note visualizations can we support?
   - Need benchmarking with complex graphs
   - Determine fallback strategies for high-density playback

3. **Graph Integration**: How do we efficiently map notes to graph nodes?
   - Maintain note-to-node mapping cache
   - Handle dynamic graph updates during playback

4. **Export Quality**: What rendering approach for video export?
   - Offline rendering for higher quality
   - Real-time capture for faster processing

### User Experience

1. **Discovery**: How do users find and enable this feature?
   - Tutorial/onboarding for new feature
   - Contextual hint on first playback

2. **Customization Complexity**: How many options are too many?
   - Balance between flexibility and overwhelm
   - Consider presets for common configurations

3. **Learning Curve**: Do we need dedicated documentation/tutorial?
   - Interactive tutorial showing different modes
   - Example visualizations in documentation

## Related Features

- [Timeline Animation System](../planning/timeline-animation.md) - Synchronization with playback
- [Audio Export Feature](./export-feature.md) - Potential video export integration
- [Control Center](../architecture/control-center.md) - Settings and controls integration
- [Graph Rendering](../architecture/graph-renderer.md) - Graph highlighting integration

---

**Next Steps:**
1. Review and validate specification with stakeholders
2. Create UI mockups for different display modes
3. Prototype basic piano roll implementation
4. Conduct accessibility review
5. Plan implementation timeline
