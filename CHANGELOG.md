# Changelog

All notable changes to the Obsidian Sonigraph Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.17.4] - 2025-11-12

### Fixed
- **Code Quality**: Obsidian plugin review compliance
  - Removed console logging (1 instance eliminated)
  - Fixed non-null assertion safety (137 instances across 32 files)
  - Improved type safety (81 `as any` casts eliminated across 9 files)
  - Created proper TypeScript definitions for Obsidian API extensions
  - Added type definitions for Tone.js internals and musical settings

### Changed
- **Default Instruments**: Changed default enabled instruments to flute and acoustic guitar (sample-based) for simpler initial user experience

## [0.17.3] - 2025-11-11

### Fixed
- **Instrument Selection**: All enabled instruments now properly used across all playback modes
  - Fixed Timeline/Sonic Graph view to use 70/30 distribution instead of frequency-range selection
  - Fixed Local Soundscape graph-centric mode to distribute instruments across depth layers
  - Fixed Local Soundscape note-centric mode to use round-robin selection across phrases
  - Ensures all enabled instrument combinations (not just default orchestral presets) are audible during playback

## [0.17.2] - 2025-11-11

### Fixed
- **Security**: Eliminated all unsafe `innerHTML`/`outerHTML` usage (26 instances) - replaced with safe Obsidian DOM helpers
- **Type Safety**: Resolved ~70 TypeScript compilation errors
  - Added missing `chordFusion` and `noteCentricMusicality` properties to `AudioMappingConfig` interface
  - Implemented type-safe helper functions for instrument settings access
  - Added public `getWhaleManager()` getter for whale integration
- **Code Quality**: Reduced unsafe `as any` type casts from 83 to 81 instances
- **Logging**: Removed debug console.log statement from production code

### Technical
- Added AUDIT-REPORT.md documenting compliance with Obsidian plugin review requirements
- Overall compliance score: 6/7 categories (86%)
- Build now passes with 0 TypeScript errors

## [0.17.1] - 2025-11-10

### Added
- **Note-Centric Musicality Settings**: Configurable controls for prose-based musical generation
  - Three presets: Conservative, Balanced (default), Adventurous
  - Six individual parameters: timing humanization (50-250ms), harmonic adventurousness (0-100%), dynamic range, polyphonic density, melodic independence (0-100%), voice leading style
  - Access via Control Center > Local Soundscape > Note-centric musicality
  - Settings apply immediately to subsequent playback

### Documentation
- Updated Local Soundscape user guide with complete musicality preset documentation
- Added implementation status section to design document with technical details

## [0.17.0] - 2025-11-08

### Planned - Local Soundscape Aesthetic Enhancements 🎼

A comprehensive set of musical enhancements to transform Local Soundscape into a fully musical experience. See [docs/design/local-soundscape-aesthetic-enhancements.md](docs/design/local-soundscape-aesthetic-enhancements.md) for complete design.

**Eight Proposed Enhancements:**
1. **Scale Quantization** - Harmonic consonance through musical theory integration
2. **Chord Voicing System** - Polyphonic richness with depth-based harmony layers
3. **Melodic Arc & Tension Tracking** - Musical narrative with emotional contours
4. **Smart Instrument Selection** - Timbral consistency through depth-layer assignment
5. **Rhythmic Pattern System** - Temporal organization with musical patterns (arpeggios, ostinatos, pulses)
6. **Dynamic Panning Enhancements** - Sophisticated spatial audio positioning
7. **Adaptive Pitch Ranges** - Key-relative depth ranges for harmonic integration
8. **Instrument Turn-Taking** - Call-and-response patterns for musical dialogue and textural clarity

**Implementation Phases:**
- Phase 1: Scale Quantization + Instrument Selection (6-10 hours)
- Phase 2: Chord Voicing + Adaptive Pitch (12-18 hours)
- Phase 3: Tension Arc + Rhythm + Panning + Turn-Taking (40-54 hours)

**Total Estimated Effort:** 58-82 hours of development

## [0.17.0] - 2025-11-08

### Added - Local Soundscape 🌊

**Complete Audio-Visual Exploration System**
- **Dedicated View**: Right-click any note → "Open in Local Soundscape" or use Command Palette
- **Radial Graph Visualization**: D3.js + SVG rendering with depth-based rings
  - Center note in middle, connections radiating outward by depth (1-5 levels)
  - Color-coded by direction: incoming (pink), outgoing (cyan), bidirectional (purple)
  - Interactive zoom/pan with automatic fit-to-content
  - Hover tooltips with note metadata
  - Click to open note, right-click for context menu

**Depth-Based Musical Mapping**
- **Layered Instrumentation**: Different instrument pools per depth
  - Center (depth 0): Piano, organ, lead synth (prominent melody)
  - Depth 1: Strings, electric piano (harmonic support)
  - Depth 2: Bass synth, timpani, cello (rhythmic foundation)
  - Depth 3+: Arp synth, vibraphone, pads (ambient atmosphere)
- **Spatial Audio**: Directional panning based on link direction
  - Incoming links pan left (-0.7)
  - Outgoing links pan right (+0.7)
  - Bidirectional centered (0.0)
- **Volume Attenuation**: Depth-based volume (center 100% → depth 3+ 40%)
- **Pitch Ranges**: Depth-specific registers (center: C4-C5, depth 3+: C2-C3)
- **Dynamic Duration**: Note length based on content (word count, headings, links)
- **Recency-Based Velocity**: Recently modified notes play louder

**Musical Variation System**
- **Seeded Randomization**: Reproducible variations per center note
  - ±2 semitone pitch variation
  - Instrument selection randomization
  - ±50ms timing jitter
- **Variation History**: Up to 10 variations per note with Re-roll button
- **Previous/Next Navigation**: Cycle through variation history

**Interactive Controls**
- **Depth Adjustment**: Slider (1-5) with real-time graph update
- **Filtering System**: Comprehensive modal with:
  - Tag filters (include/exclude with tag cloud)
  - Folder filters (include/exclude with folder cloud)
  - File type filters (markdown, PDF, image, audio, video)
  - Link direction filters (incoming, outgoing, bidirectional)
- **Clustering Modes**: Four algorithms with visual cluster rendering
  - Folder-based clustering
  - Tag-based clustering
  - Depth-based clustering
  - Community detection (Louvain-like algorithm)
- **Node Size Modes**: Three display options
  - Uniform size
  - By link count (hub emphasis)
  - By content length (substance emphasis)
- **Refresh Button**: Manual graph update with staleness indicator

**Context-Aware Modifiers** 🌤️
- **Environmental Influence**: Four context dimensions affect sound
  - **Season**: Spring (bright +2), Summer (energetic +3), Fall (mellow -2), Winter (cold -4)
  - **Time of Day**: Dawn (+1), Day (neutral), Dusk (-1), Night (-2, reverb)
  - **Weather**: Clear (bright), Cloudy (muted), Rain (rhythmic), Storm (dramatic +2), Snow (crystalline +3)
  - **Theme**: Light mode (+2, bright), Dark mode (-2, warm)
- **Modulation Modes**:
  - "Influenced" (blend note properties with environment)
  - "Context-only" (pure environmental, ignore note structure)
- **Adjustable Influence**: Weight slider (0-100%) to control blend amount
- **Individual Toggles**: Enable/disable each context factor independently

**Musical Key Selection** 🎹
- **Six Determination Modes**:
  - Vault name hash
  - Root folder name
  - Folder path (with depth slider 0-5)
  - Full file path
  - File name
  - Custom manual selection
- **Deterministic Mapping**: String-to-key hashing covers all 12 keys
- **Real-Time Display**: Shows current key with automatic updates

**Auto-Play Features**
- **Auto-Start Audio**: Optional auto-play when opening soundscape
- **Auto-Play Active Note**: Monitors active file and updates soundscape automatically
  - Manual "Play Active Note" button with Lucide music icon
  - Optional auto-play setting (opt-in, default disabled)
  - Smart duplicate prevention

**Visual Effects**
- **Playing Node Pulse**: CSS-based glow animation with enable/disable toggle
- **Smooth Transitions**: Fluid animations for all interactions
  - Hover: 200ms with easeBackOut (bouncy)
  - Playing highlights: 150ms easeBackOut on, 200ms easeCubicOut off
  - Zoom/pan: 750ms easeCubicInOut
  - Node updates: 500ms easeCubicInOut
- **Layout Options**: Radial (default) and force-directed algorithms
- **Export**: PNG image export of current graph view

**Settings Integration**
- **Three Control Center Cards**:
  - Audio Settings (auto-play, musical key)
  - Display Settings (node size, clustering, visual effects)
  - Advanced Settings (depth limits, context-aware modifiers)
- **Obsidian-Style Toggles**: Native toggle switches throughout
- **Lucide Icons**: Consistent icon system integration

**Performance Optimization**
- **Configurable Node Limits**: maxNodesPerDepth (10-200 or 'all')
- **Enabled Instrument Filtering**: Only uses instruments enabled in Control Center
- **Efficient BFS Traversal**: MetadataCache-optimized graph extraction
- **Timeout Management**: Proper cleanup on pause/stop

### Technical Architecture
- **New Files**:
  - `src/ui/LocalSoundscapeView.ts` - Main view class
  - `src/graph/LocalSoundscapeExtractor.ts` - BFS graph traversal
  - `src/graph/LocalSoundscapeRenderer.ts` - D3/SVG visualization
  - `src/audio/mapping/DepthBasedMapper.ts` - Musical parameter mapping
  - `src/audio/mapping/ContextualModifier.ts` - Environmental context detection
- **Integration**: Extends existing AudioEngine, MusicalMapper, and settings systems
- **Reusable Components**: Foundation for future Note Journey feature

## [0.15.0] - 2025-10-06

### Added - Visual Note Display System 🎵

**Three Visualization Modes**
- **Piano Roll**: Timeline-based scrolling display with moving playhead
  - Notes positioned by timestamp (X-axis) and MIDI pitch (Y-axis)
  - Real-time note highlighting with glow effects during playback
  - Adaptive grid system (octave-based horizontal, time-based vertical)
  - Dynamic pitch labels (C0, C1, C2...) and timeline markers (MM:SS format)
  - Layer-based color coding (rhythmic, harmonic, melodic, ambient, percussion)

- **Spectrum Analyzer**: Real-time frequency visualization
  - 64 frequency bars with logarithmic spacing
  - Web Audio API AnalyserNode integration
  - Smooth 60fps animation
  - Color gradient from red (low) to blue (high frequencies)
  - Connected to Tone.js master output

- **Staff Notation**: Traditional musical staff display
  - Treble and bass clefs with proper note positioning
  - MIDI pitch to staff line position mapping
  - Note heads with stems for quarter notes
  - Layer-based color coding matching other modes
  - Supports both MIDI numbers and string note names (e.g., "C4", "G#5")

**UI Integration**
- Resizable split-view panel below graph visualization
- Tab switching between Piano Roll, Spectrum, and Staff modes
- Divider drag handle for height adjustment
- Timeline position synchronization with audio playback
- Graph node highlighting synchronized with note playback
- Proper z-index layering with timeline controls

**Architecture**
- `NoteVisualizationManager` for centralized coordination
- `VisualizationRenderer` interface for extensibility
- Real-time event collection from audio engine
- Performance-optimized rendering loops (30-60fps)
- Proper lifecycle management and cleanup
- Smart resize handling when toggling panel visibility

### Changed - UI Streamlining

**Header Reorganization**
- Moved Play/Pause button to header (centered play controls section)
- Moved Speed control to header (next to Play/Pause)
- Moved Settings (⚙️) button to header button group
- Consolidated all primary controls in top header

**Bottom Controls Simplification**
- Removed redundant Export arrow button (Export already in header)
- Removed Timeline View button (replaced by Visual Note Display)
- Removed Reset View button (less frequently used)
- Reduced to single centered stats line only
- Reduced height from 52px to 36px for more compact layout

**Timeline Polish**
- Reduced timeline height from 115px to 85px
- Refined scrubber styling with smoother transitions
- Smaller, more polished thumb handle (14px, grows to 16px on hover)
- Improved timeline track with subtle gradient and inset shadow
- Lighter grid lines (30% opacity) for cleaner appearance
- Optimized spacing and typography throughout (11px labels, 10px markers)
- Better current time indicator styling with compact tooltip

### Fixed

- **Visual Display Resize**: Fixed canvas sizing when toggling modes while panel collapsed
  - Added `forceResize()` method to all visualization renderers
  - Proper resize trigger when expanding collapsed panel
  - Fixed pitch labels appearing outside display area

- **Control References**: Removed orphaned `viewModeBtn` references after UI cleanup
  - Fixed "Cannot read properties of undefined" error on initialization

- **Container Dimensions**: Changed error to debug log for collapsed panel state
  - Container having 0 dimensions on init is expected when panel starts collapsed
  - Visualization properly resizes when panel is expanded

## [0.14.1] - 2025-10-04

### Fixed
- **Continuous Layers Playback**: Fixed CORS issues preventing continuous layers from playing
  - Sample playback now uses Freesound API to fetch fresh preview URLs (matching Preview button approach)
  - Downloads samples via `requestUrl()` and creates blob URLs to bypass CORS restrictions
  - Proper blob URL cleanup on audio end and stop to prevent memory leaks
- **Sample Toggle Persistence**: Fixed toggle state not persisting when switching settings tabs
  - Now properly initializes `continuousLayers` object when missing
- **Sample Enable/Disable Logic**: Fixed toggle to properly handle undefined state for curated samples
  - First click enables (undefined → true)
  - Subsequent clicks toggle between enabled/disabled
- **Settings Architecture**: Pass settings to `MusicalGenreEngine` for API key access
- **Logging Improvements**: Reduced noisy warnings from `FreesoundSampleLoader`
  - Disabled connection test to avoid 404 errors
  - Downgraded "No samples found" message to debug level

### Changed
- Increased baseVolume from -10dB to 0dB for better continuous layer audibility during testing

## [0.14.0] - 2025-10-03

### Added - Freesound Sample Browser 🎵

**Professional Sample Library Management**
- Complete table-based sample browser UI with search, filter, and sort capabilities
- 114 professionally curated Freesound samples automatically imported (disabled by default)
- Tag-based organization: atmospheric (56), ambient (41), drone (33), electronic (29), and more
- License distribution: 57 CC0, 29 CC BY 4.0, 18 CC BY-NC, 10 CC BY 3.0

**Sample Browser Features**
- Compact table layout with sortable columns: Sample, Author/License, Tags, Actions
- Real-time preview with working audio playback
- Tag editor modal for organizing samples with autocomplete suggestions
- Enable/disable toggle for selective sample activation
- Search across sample names, authors, and descriptions
- Filter by tags and license type
- Show/hide disabled samples toggle

**User Experience**
- Curated samples start disabled - users opt-in to samples they want
- License names displayed in friendly format (CC-BY-NC instead of URLs)
- Combined Author/License column for space efficiency
- Icon-based action buttons: Preview (▶), Info (ℹ), Edit Tags (🏷), On/Off, Remove (🗑)

### Changed - UI Consistency & Organization

**Control Center Improvements**
- Converted all section titles and settings labels to sentence case for consistency
- Split Advanced Features tab into 3 focused tabs: Smart Clustering, Musical Features, and Spatial Audio
- Reorganized spatial audio settings into 5 separate cards for better clarity
- Removed all phase references from UI text and comments
- Updated sample browser subtitle to reflect library management capabilities

**Code Quality**
- Moved inline styles to CSS classes for collapsible sections, group visualizations, and control center button
- Replaced console.warn with structured logger.warn calls in audio engine
- Improved code organization and maintainability
- Removed genre-based sample organization in favor of flat tag-based system

## [0.13.0] - 2025-10-03

### Added - Musical Theory Integration & Enhanced Musicality 🎵

#### Overview
Complete overhaul of note generation system to create musically coherent melodies instead of random pitch sequences. Timeline animations now feature proper chord progressions, melodic contour, phrase structure, rhythmic patterns, and dynamic expression.

#### Core Musical Enhancements

**1. Scale-Degree Melodic Progression**
- **Step-wise motion**: 70% of notes move by ±1 or ±2 scale degrees for smooth melodies
- **Chord tone anchoring**: 30% of notes land on harmonically important chord tones
- **Melodic memory**: Tracks previous scale degree to create voice leading
- **Replaces**: Hash-based chromatic pitch generation (which created random jumps)

**2. Chord Progression System**
- **Traditional progressions**: I-IV-V-I for major, i-iv-v-i for minor
- **Scale-specific patterns**: Custom progressions for dorian, pentatonic, blues, and modal scales
- **Harmonic rhythm**: Chord changes every 4-8 notes for tonal movement
- **4-chord cycles**: Creates tension and resolution through classic cadential patterns

**3. Musical Phrase Boundaries**
- **8-note phrases**: Clear beginning/middle/end structure
- **Phrase starts**: Begin on tonic (chord root) for stability
- **Phrase ends**: Cadential motion resolving to tonic on final chord
- **Melodic contour**: Arch shape with higher pitches in phrase middle (notes 2-5)

**4. Rhythmic Variation**
- **Phrase-based patterns**: Long notes on phrase starts (3x), very long on ends (4x)
- **Weak beat shortening**: Odd positions are shorter (0.3x) for rhythmic variety
- **Syncopation**: 5% chance of very short notes for interest
- **Musical rests**: 10% chance of silence for "breathing"

**5. Dynamic Expression**
- **Crescendo/diminuendo**: Arch-shaped volume curve over each phrase
- **Accent patterns**: Strong accents on downbeats (+0.5) and cadences (+0.6)
- **Weak beat softening**: Odd positions are quieter (-0.3)
- **Humanization**: ±5% random variation per note

**6. Enhanced Node Property Mapping**
- **File size** → Octave/register (larger files = higher pitches)
- **Connection count** → Octave/register (more connections = lower/foundational)
- **Folder depth** → Octave/register (deeper nesting = lower register)
- **Phrase position** → Melodic contour (arch shape for natural phrasing)

#### Technical Implementation

**Files Modified**:
- `src/ui/SonicGraphView.ts`: Added 6 new musical state variables, 3 new methods (~200 lines)
  - `calculateScaleAwarePitch()`: Melodic progression with phrase boundaries
  - `calculateRhythmicDuration()`: Phrase-based rhythmic patterns
  - `calculateDynamicVelocity()`: Expression curves and accents
  - `generateChordProgression()`: Scale-specific chord progressions

**Musical State Tracking**:
```typescript
private lastScaleDegree: number = 0;           // For melodic continuity
private currentChordIndex: number = 0;          // Position in progression
private currentChordProgression: number[][];    // I-IV-V-I pattern
private notesInCurrentPhrase: number = 0;       // Phrase position (0-7)
private phraseLengthInNotes: number = 8;        // Phrase length
```

**Chord Progressions**:
- Major: I-IV-V-I (tonic-subdominant-dominant-tonic)
- Minor: i-iv-v-i (natural minor progression)
- Dorian: i-II-V-i (modal progression)
- Pentatonic Major: I-IV-V-I (pentatonic degrees)
- Pentatonic Minor: i-iv-v-i (pentatonic degrees)
- Blues: I-IV-V-I (blues scale degrees)

#### Musical Results

**Before**: Random chromatic jumps, uniform rhythm, flat dynamics
**After**: Smooth melodies, phrase structure, rhythmic patterns, expressive dynamics

Users will now hear:
- ✅ Recognizable melodies with step-wise motion
- ✅ Clear musical phrases with natural cadences
- ✅ Harmonic progression creating tension/resolution
- ✅ Rhythmic variety (long-short-short patterns)
- ✅ Dynamic expression (crescendo/diminuendo)
- ✅ Tonal coherence with strong sense of key

### Fixed

**Hot-Swapping for Instrument Settings**
- Fixed issue where toggling instruments on/off or changing quality settings required plugin reload
- `updateSettings()` now properly clears InstrumentConfigLoader cache
- Instruments dynamically add/remove/reinitialize when settings change
- No reload required for any instrument configuration changes

**Timeline Animation Background Playback**
- Fixed issue where timeline animation stopped when switching tabs/windows
- Implemented hybrid scheduling: `requestAnimationFrame` when visible, `setTimeout` when hidden
- Added visibility change handlers to maintain playback in background
- Animation now continues seamlessly when tab loses focus

**InstrumentConfigLoader Cache Management**
- `onInstrumentSettingsChanged()` now calls `instrumentConfigLoader.clearCache()`
- Ensures fresh configs are loaded after settings updates
- Fixes stale cache preventing hot-swapping from working

## [0.12.2] - 2025-10-02

### Added - Audio Export Feature (Phase 1 & 2) ✅

#### Overview
Professional audio export system enabling users to export Sonic Graph timeline animations as high-quality audio files with comprehensive configuration options, metadata support, and automatic documentation.

#### Core Components (8 new files, ~2,500 lines)

**AudioExporter** (`src/export/AudioExporter.ts` - ~350 lines)
- **Export Orchestration**: Validates config, renders audio, encodes, writes files, generates notes
- **Progress Tracking**: Real-time progress callbacks mapped to 0-100% with stage indicators
- **Cancellation Support**: User can cancel export at any stage with proper cleanup
- **Error Handling**: Comprehensive error detection with user-friendly messages
- **Audio Engine Integration**: Initializes audio engine if needed, accesses master volume
- **Public API**: `export()`, `cancel()`, `setProgressCallback()`

**OfflineRenderer** (`src/export/OfflineRenderer.ts` - ~200 lines)
- **Real-time Audio Capture**: Uses MediaRecorder to capture Tone.js master volume output
- **Timeline Synchronization**: Plays timeline animation while recording audio
- **Progress Feedback**: Reports rendering progress during timeline playback
- **Cancellation**: Stops recording and cleans up when cancelled
- **Custom Range Support**: Renders specific time ranges when configured

**WavEncoder** (`src/export/WavEncoder.ts` - ~150 lines)
- **WAV Format**: Creates proper WAV headers with RIFF/WAVE structure
- **Quality Options**: Configurable sample rate (44.1/48/96 kHz) and bit depth (16/24-bit)
- **Audio Conversion**: Converts Float32Array to Int16/Int32 for WAV format
- **Efficient Encoding**: Direct buffer manipulation for performance

**Mp3Encoder** (`src/export/Mp3Encoder.ts` - ~150 lines)
- **Native Codec Support**: Uses MediaRecorder with platform-native audio encoders
- **Automatic Codec Selection**: Chooses best available (M4A/AAC, WebM/Opus, OGG/Vorbis)
- **Quality Presets**: Configurable bitrate (128-320 kbps)
- **Progress Tracking**: Real-time encoding progress based on elapsed time vs. duration
- **Better Than MP3**: AAC and Opus provide superior quality-to-size ratios

**ExportModal** (`src/export/ExportModal.ts` - ~1,000 lines)
- **Card-Based UI**: Each settings group in visual card with borders and shadows
- **Quick Presets Section**: Three defaults + save custom presets functionality
- **What to Export Section**: Full timeline, custom time range (MM:SS or seconds), static graph
- **Format & Quality Section**: WAV or compressed audio with dynamic quality dropdown
- **Save Location Section**: Vault folder or system location (vault only for now)
- **Filename Section**: Name input + three useful toggles (create note, include settings, max duration)
- **Metadata Section**: Collapsible optional metadata (title, artist, album, year, genre, comment)
- **Estimate Display**: Real-time file size and render time with emoji icons (📦 ⏱️)
- **Preset Management**: Save/load presets with name prompt modal
- **Dynamic Updates**: Real-time estimation as settings change
- **Proper CSS Prefixing**: All classes prefixed with `sonigraph-` to prevent conflicts

**ExportProgressModal** (`src/export/ExportProgressModal.ts` - ~250 lines)
- **Real-time Progress**: Animated progress bar with percentage display
- **Stage Indicators**: Shows current stage (validating, rendering, encoding, writing, complete)
- **Cancellation Button**: User can cancel at any time with proper cleanup
- **Success/Error States**: Visual feedback for completion or failure
- **Auto-close**: Closes automatically on success after brief display

**FileCollisionModal** (`src/export/FileCollisionModal.ts` - ~200 lines)
- **Collision Detection**: Checks if file exists before export
- **Three Resolution Strategies**: Cancel, Overwrite, or Rename
- **Rename UI**: Text input with preview of full filename + extension
- **File Information**: Shows existing file details (size, modified date)
- **Radio Button Selection**: Clear visual indication of chosen action

**ExportNoteCreator** (`src/export/ExportNoteCreator.ts` - ~300 lines)
- **Automatic Documentation**: Generates comprehensive markdown notes
- **Export Metadata**: Timestamp, duration, format, quality, file size, location
- **Audio Settings**: Sample rate, bit depth/bitrate, active instruments, enabled effects
- **Timeline Information**: Scope, time range, granularity settings
- **Comprehensive Settings**: All Sonic Graph settings from Control Center
- **User Metadata**: Title, artist, album, year, genre, comment if provided
- **Vault Organization**: Saved alongside audio file or in specified note folder

**Type Definitions** (`src/export/types.ts` - ~200 lines)
- **ExportConfig**: Complete export configuration with all options
- **ExportResult**: Success/failure with file paths and error details
- **ExportProgress**: Progress tracking with stage and percentage
- **AudioFormat**: 'wav' | 'mp3' | 'ogg' | 'flac'
- **Quality Types**: WavQuality, Mp3Quality, OggQuality, FlacQuality
- **Export Scope**: 'full-timeline' | 'custom-range' | 'static-graph'
- **AudioMetadata**: Optional metadata fields
- **ExportPreset**: Saved preset configuration

#### UI Integration

**SonicGraphView Export Button** (`src/ui/SonicGraphView.ts`)
- **Export Button**: Added to timeline controls with download icon
- **Auto-initialization**: Initializes temporal animator if not present
- **Modal Opening**: Passes audio engine and animator to export modal
- **Error Handling**: User-friendly notices for missing prerequisites

#### Styling (`styles/export.css` - ~600 lines)

**Export Modal Styles**
- **Card-Based Layout**: All sections in visual cards with elevation
- **Preset Button Styling**: Hover effects with color change and lift animation
- **Save Preset Button**: Distinctive dashed border style
- **Estimate Box**: Highlighted with accent border, emoji icons for size/time
- **Collapsible Headers**: Hover states for metadata/advanced sections
- **Custom Range Container**: Visual separator with dashed border
- **Proper Prefixing**: All classes use `sonigraph-` prefix

**Progress Modal Styles**
- **Progress Bar**: Smooth animated fill with accent color
- **Stage Text**: Clear typography with success/error states
- **Cancellation Button**: Warning style with hover effects

**File Collision Modal Styles**
- **Radio Options**: Card-based selection with hover and checked states
- **File Information**: Highlighted box with file details
- **Rename Input**: Inline text input with extension label

#### Features Summary

**Phase 1: Core Audio Export**
- ✅ WAV export with quality settings (sample rate, bit depth)
- ✅ Export progress modal with real-time feedback
- ✅ File collision handling (cancel, overwrite, rename)
- ✅ Export notes with comprehensive settings documentation
- ✅ Timeline animation export with temporal animator integration
- ✅ Cancellation support at all stages

**Phase 2: Advanced Features**
- ✅ Compressed audio export (M4A/AAC, WebM/Opus, OGG/Vorbis)
- ✅ Dynamic quality presets (High 320kbps, Standard 192kbps, Small 128kbps)
- ✅ Custom time range selection (flexible MM:SS or seconds input)
- ✅ Metadata editing (title, artist, album, year, genre, comment)
- ✅ Export presets with save/load functionality
- ✅ Progress feedback during encoding stage
- ✅ Polished card-based UI with proper CSS prefixing

**Skipped Features**
- ⏭️ Instrument selection checkboxes (redundant with Control Center)
- ⏭️ Additional UI locations (unnecessary for good UX)
- ⏭️ OGG/FLAC formats (MediaRecorder handles compressed audio)

**Known Limitations**
- Metadata tags not written to audio files (browser MediaRecorder limitation)
- Export speed tied to playback speed (real-time rendering)
- Vault folder only (system location requires Electron fs integration)

**Phase 3: Video Export** (Future - Separate Branch)
- Canvas/WebGL frame capture
- Video encoding with audio track
- WebCodecs API integration

#### Integration Points

- **Settings Integration**: Export settings structure in plugin settings
- **Audio Engine**: getMasterVolume() public method added
- **Temporal Animator**: Lazy initialization for exports
- **File System**: Vault file creation and collision detection
- **Progress System**: Reusable progress modal pattern

#### Documentation

- **Feature Documentation**: `docs/features/export-feature.md` (comprehensive guide)
- **Updated README.md**: Added "Audio Export" section to production features
- **Updated CHANGELOG.md**: Complete Phase 1 & 2 implementation details

### Changed
- Version bumped to 0.12.1
- Updated current status in README to include audio export

## [0.12.0] - 2025-09-29

### Added - Phase 8.1: Sonic Graph Settings Panel UI Polish ✅

#### Overview
Comprehensive UI reorganization that moves Sonic Graph settings from cramped modal panel to spacious Control Center with horizontal tab navigation. Creates 4 organized tabs housing all Phase 1-7 settings with improved discoverability and usability.

#### Core Components (2,420 lines, 5 new files)

**SonicGraphSettingsTabs** (`src/ui/settings/SonicGraphSettingsTabs.ts` - 240 lines)
- **Horizontal Tab Navigation**: 4-tab system with icons and descriptions
- **Tab IDs**: 'core', 'layers', 'advanced', 'freesound'
- **Active State Management**: Visual highlighting of current tab
- **Tab Switching**: Smooth content transitions with event handling
- **Public API**: `showTab()`, `getActiveTab()`, `destroy()`

**SonicGraphCoreSettings** (`src/ui/settings/SonicGraphCoreSettings.ts` - 243 lines)
- **Graph & Layout Section**: Show file names, group separation, timeline settings (4 settings)
- **Audio Core Section**: Audio detection, density, duration, animation, event spreading (5 settings)
- **Content-Aware Mapping Section**: Placeholder for Phase 2 expansion
- **Material Design Cards**: Consistent styling with elevation and icons

**SonicGraphLayersSettings** (`src/ui/settings/SonicGraphLayersSettings.ts` - 569 lines)
- **Continuous Layers Section**: Enable toggle, genre selection (13 genres), fade settings
- **Ambient Layer Section**: Enable toggle, volume, intensity, evolution controls
- **Rhythmic Layer Section**: Enable toggle with collapsible detailed settings (tempo, percussion, arpeggios, activity sensitivity)
- **Harmonic Layer Section**: Enable toggle with collapsible detailed settings (chord progression, harmonic rhythm, voice leading)
- **Layer Tonality Section**: Global scale and root note settings for continuous layers
- **Dynamic Re-rendering**: Per-card re-render on toggle for instant feedback
- **Proper Initialization**: Creates default configs when enabling layers

**SonicGraphAdvancedSettings** (`src/ui/settings/SonicGraphAdvancedSettings.ts` - 1,078 lines)
- **Smart Clustering Section**: Cluster audio enable, cluster type volumes (5 types), transition effects
- **Hub Orchestration Section**: Hub orchestration enable, mode selection, transitions, centrality weights, prominence settings
- **Community Detection Section**: Community detection enable, theme settings, evolution controls
- **Musical Theory Section**: Enable toggle, scale/root note, harmony enforcement, chromaticism, dissonance, quantization, chord progressions (9 settings)
- **Dynamic Orchestration Section**: Enable toggle, complexity tiers, temporal influence, activity mapping, transition smoothness (6 settings)
- **Spatial Audio Section**: Enable toggle, panning mode, intensity, smoothing, update throttle, depth mapping (6 settings)
- **Per-Section Re-rendering**: Optimized updates without full tab reload

**SonicGraphFreesoundSettings** (`src/ui/settings/SonicGraphFreesoundSettings.ts` - 290 lines)
- **Freesound API Section**: API key input with test button (uses FreesoundAuthManager), enable toggle, info about Freesound.org
- **Caching Section**: Predictive preload, preload on startup, background loading, cache strategy dropdown (5 options), max storage slider
- **Preset Management Section**: Current preset display, custom preset count, note about full management in modal

#### UI Simplification

**SonicGraphModal Changes** (`src/ui/SonicGraphModal.ts` - Modified)
- **Removed 8 Advanced Sections**: Audio, audio enhancement, continuous layers, cluster audio, community detection, navigation, advanced, groups
- **Kept 4 Essential Sections**: Filters, visual, layout, timeline
- **Added Control Center Link**: Prominent info box explaining settings migration + large button to open Control Center
- **Event Integration**: Button closes modal and triggers 'sonigraph:open-control-center' event

**SonicGraphView Changes** (`src/ui/settings/SonicGraphView.ts` - Modified)
- **Same Simplification Applied**: Removed same 8 advanced sections from view panel
- **Same Control Center Link**: Identical info box and button as modal
- **Consistent Experience**: Both modal and view panels now streamlined

#### Control Center Integration

**Control Panel Enhancements** (`src/ui/control-panel.ts` - +40 lines)
- **Tab System Integration**: Instantiates SonicGraphSettingsTabs in Sonic Graph tab
- **Replaces Old Content**: Removes previous simple settings list
- **Event Listener**: 'sonigraph:open-control-center' opens Control Center and switches to Sonic Graph tab

#### CSS Styling

**Tab Navigation Styles** (`styles/controlcenter.css` - +142 lines)
- **Horizontal Tab Bar**: Flex layout with row direction, gap spacing
- **Tab Buttons**: Icon + label layout, hover effects, active state highlighting
- **Active Tab**: Blue accent color, bold text, bottom border indicator
- **Tab Content Area**: Proper scrolling, padding, responsive layout
- **Control Center Button**: Large, prominent styling for "Open Control Center" button
- **Info Box**: Blue left border, clear messaging about settings migration

#### Key Features
- ✅ **Organized Settings**: All Phase 1-7 settings logically grouped in 4 tabs
- ✅ **Improved Discoverability**: Clear tab labels and section headers with descriptions
- ✅ **Streamlined Modal**: Essential visualization controls only, no advanced clutter
- ✅ **Instant Feedback**: Per-card re-rendering for responsive settings changes
- ✅ **Material Design**: Consistent card-based layout with proper elevation and spacing
- ✅ **Clear Guidance**: Prominent info boxes and links to advanced settings
- ✅ **100% Feature Parity**: No functionality lost in migration
- ✅ **Dual Simplification**: Both SonicGraphModal and SonicGraphView panels updated

#### Architecture Improvements
- **Modular Tab System**: Each tab in separate file for maintainability
- **Reusable Components**: MaterialCard pattern used consistently
- **State Management**: Proper settings persistence via plugin.saveSettings()
- **Event-Driven**: Control Center navigation via workspace events
- **Performance Optimized**: Per-card rendering reduces unnecessary re-renders

#### Files Modified
- `src/ui/control-panel.ts` - Tab system integration
- `src/ui/SonicGraphModal.ts` - Simplified to essentials + Control Center link
- `src/ui/SonicGraphView.ts` - Simplified to essentials + Control Center link
- `src/graph/types.ts` - Extended AudioMappingConfig with full MusicalTheoryConfig
- `src/graph/musical-mapper.ts` - Updated initialization for expanded interface
- `styles/controlcenter.css` - Tab navigation and button styling

#### Files Created
- `src/ui/settings/SonicGraphSettingsTabs.ts` - Tab navigation system
- `src/ui/settings/SonicGraphCoreSettings.ts` - Core settings tab
- `src/ui/settings/SonicGraphLayersSettings.ts` - Audio layers tab
- `src/ui/settings/SonicGraphAdvancedSettings.ts` - Advanced features tab
- `src/ui/settings/SonicGraphFreesoundSettings.ts` - Freesound & presets tab

---

### Added - Phase 7.3: Caching and Preloading ✅

#### Overview
Comprehensive intelligent preloading and cache optimization system for Freesound samples. Features 4 preload strategies, 5 cache eviction algorithms, predictive preloading based on usage patterns, offline support with graceful degradation, and background loading during idle time.

#### Core Components (1,219 lines, 2 files)

**SamplePreloader** (`src/audio/freesound/SamplePreloader.ts` - 545 lines)
- **4 Preload Strategies**: Immediate (load now), Progressive (incremental loading), Idle (background loading), Manual (user-triggered)
- **Predictive Preloading**: Analyzes usage patterns to predict next likely genres
- **Usage Metrics Tracking**: Genre play count, last used timestamp, recent genres list (last 10), most used genre calculation
- **Pattern Detection**: Identifies genre rotation patterns (2-3 genre cycles)
- **Priority Queue Management**: Reorders preload queue based on predictions
- **Idle Detection**: 5-second inactivity threshold with background loading
- **Storage Quota Management**: Configurable max storage (default 100MB) with quota checks
- **Preload Status API**: Real-time progress tracking (current genre, queued genres, progress percentage, estimated time remaining)
- **Configuration API**: Update preload strategy, enable/disable features, adjust settings
- **Activity Recording**: Tracks user activity to determine idle periods
- **Genre Usage Recording**: Records every genre use for prediction algorithms

**CacheStrategy** (`src/audio/freesound/CacheStrategy.ts` - 674 lines)
- **5 Eviction Strategies**: LRU (time-based), LFU (frequency-based), FIFO (queue-based), Adaptive (multi-factor, recommended), Predictive (future access prediction)
- **Adaptive Scoring System** (4 factors):
  - Access frequency (accesses per day) - weight: 2.0
  - Recency (time since last access vs stale threshold) - weight: 3.0
  - Genre popularity (relative to most popular) - weight: 2.0
  - Priority level (critical/high/medium/low) - base weights: 10.0/5.0/2.0/1.0
- **Predictive Access Time**: Calculates average interval between accesses to predict next use
- **Priority Management**: Automatic promotion (high usage) and demotion (low usage) of cache items
- **Stale Item Detection**: Identifies items not accessed within threshold (default 30 days)
- **Cache Optimization**: Evicts stale items, promotes/demotes based on usage, provides recommendations
- **Recommendations Engine**: Analyzes cache health and suggests optimizations (evict low-priority, prune stale, improve diversity, different strategy)
- **Access History Tracking**: Maintains last 1,000 access events for prediction algorithms
- **Cache Item Registration**: Tracks soundId, genre, priority, access count, timestamps, size
- **Configuration API**: Update eviction strategy, cache size limits, thresholds

#### Integration & Features

**FreesoundSampleManager Enhancements** (+159 lines)
- **Preloader Integration**: Creates and manages SamplePreloader instance
- **Cache Strategy Integration**: Creates and manages CacheStrategy instance
- **Network Monitoring**: Automatic online/offline detection with event listeners
- **Offline Mode API**: `isInOfflineMode()` method for status checking
- **Graceful Degradation**: `getSampleWithOfflineFallback()` returns cached samples when offline, null otherwise
- **Configuration Methods**: `updatePreloaderConfig()`, `updateCacheStrategyConfig()`
- **Status Methods**: `getPreloaderStatus()`, `getUsageMetrics()`
- **Usage Tracking**: `recordGenreUsage()` for predictive preloading
- **Cache Operations**: `optimizeCache()`, `getCacheRecommendations()`
- **Internal Tracking**: `registerCacheItem()`, `recordCacheAccess()` for strategy management

**Control Center UI** (+73 lines to `control-panel.ts`)
- **Predictive Preloading Toggle**: Enable/disable predictive algorithms (default: enabled)
- **Preload on Startup Toggle**: Auto-preload frequent genres on Obsidian startup (default: disabled)
- **Background Loading Toggle**: Download during idle time (default: enabled)
- **Cache Strategy Dropdown**: 5 options (Adaptive recommended, LRU, LFU, Predictive, FIFO)
- **Max Storage Input**: Configurable quota in MB (default: 100)
- **Settings Persistence**: All settings saved to plugin data.json

**Settings Interface** (+10 lines to `constants.ts`)
- `freesoundPredictivePreload: boolean` (default: true)
- `freesoundPreloadOnStartup: boolean` (default: false)
- `freesoundBackgroundLoading: boolean` (default: true)
- `freesoundCacheStrategy: 'lru' | 'lfu' | 'fifo' | 'adaptive' | 'predictive'` (default: 'adaptive')
- `freesoundMaxStorageMB: number` (default: 100)

#### Key Features
- ✅ **Intelligent Preloading**: Predicts which genres users will need next based on usage patterns
- ✅ **Offline Support**: Gracefully handles network unavailability with cached samples
- ✅ **Background Loading**: Downloads during idle time without impacting performance
- ✅ **Multiple Cache Strategies**: Users can choose their preferred eviction algorithm
- ✅ **Storage Quota Management**: Prevents exceeding disk space limits
- ✅ **Usage Metrics**: Tracks genre usage for predictive optimization
- ✅ **Pattern Recognition**: Detects genre rotation patterns for better predictions
- ✅ **Zero-Impact Loading**: 5-second idle threshold, 500ms throttling

#### Performance
- Idle detection: 5-second threshold
- Background throttle: 500ms between downloads
- Storage quota: Configurable (default 100MB)
- Cache eviction: Minimal CPU overhead
- Preload queue: Priority-based processing
- Access history: Last 1,000 events tracked

#### Files Created
- `src/audio/freesound/SamplePreloader.ts` (545 lines)
- `src/audio/freesound/CacheStrategy.ts` (674 lines)

#### Files Modified
- `src/audio/freesound/FreesoundSampleManager.ts` (+159 lines)
- `src/audio/freesound/index.ts` (+18 lines)
- `src/ui/control-panel.ts` (+73 lines)
- `src/utils/constants.ts` (+10 lines)

#### Testing
- ✅ TypeScript compilation successful
- ✅ Build passing with no errors
- ✅ All 4 preload strategies implemented
- ✅ All 5 cache eviction algorithms implemented
- ✅ Offline mode with network simulation
- Ready for user testing

**Status**: Phase 7: Freesound Integration fully complete. All three phases (Authentication, Sample Management, Caching & Preloading) implemented and tested.

---

### Added - Phase 6.3: Spatial Audio and Panning ✅

#### Overview
Comprehensive spatial audio system that maps graph node positions to stereo field for immersive audio experience. Features 5 panning modes, 4 mathematical curves, velocity damping, and hybrid weighted combination of graph position, folder hierarchy, and cluster membership.

#### Core Components (1,065 lines, 4 files)

**PanningSystem** (`src/audio/spatial/PanningSystem.ts` - 364 lines)
- **4 Panning Curves**: Linear (direct proportion), Exponential (emphasizes extremes), Sigmoid (smooth S-curve with center bias, recommended), Logarithmic (compresses extremes)
- **Velocity Damping**: Smooth position changes during force simulation with configurable damping factor (0-1)
- **Boundary Padding**: Keeps pan away from extremes with configurable padding (0-1)
- **Position Normalization**: Converts graph coordinates to 0-1 range for consistent panning
- **Folder-Based Panning**: Calculates pan from folder path with priority system and spread factor
- **Cluster Panning**: Blends cluster center pan with individual node position based on spread setting
- **Hybrid Weighted Calculation**: Combines graph position, folder, and cluster pan with configurable weights
- **Depth Volume Calculation**: Future-ready volume adjustment based on Y-position for surround sound
- **Path Hash Variation**: Consistent variation from folder/file path for natural spread
- **State Management**: Per-node velocity state tracking for smooth transitions

**SpatialAudioManager** (`src/audio/spatial/SpatialAudioManager.ts` - 437 lines)
- **5 Panning Modes**: Graph Position (direct X-mapping), Folder Based (hierarchy-driven), Cluster Based (centroid positioning), Hybrid (weighted combination, recommended), Disabled (centered audio)
- **Node Tracking**: Complete node state management with position, pan, and update timestamps
- **Tone.js Integration**: Creates and manages Panner nodes for each tracked node
- **Real-Time Updates**: Position updates with configurable throttling (default 100ms)
- **Graph Bounds Management**: Automatic bounds updates for position normalization
- **Cluster Configuration**: Per-cluster spatial config with centroid position and spread
- **Event System**: Emits events for position updates, pan changes, mode changes, bounds updates
- **Statistics Tracking**: Total nodes, tracked nodes, average pan, distribution (left/center/right), update frequency
- **Performance Optimization**: Throttled updates, efficient state caching, minimal overhead when disabled
- **Lifecycle Management**: Proper initialization, update, enable/disable, and disposal with cleanup

**Type System** (`src/audio/spatial/types.ts` - 237 lines)
- **PanningMode Enum**: 5 modes (GraphPosition, FolderBased, ClusterBased, Hybrid, Disabled)
- **PanningCurve Enum**: 4 curves (Linear, Exponential, Sigmoid, Logarithmic)
- **Comprehensive Interfaces**: PanPosition, NormalizedPosition, GraphPosition, GraphBounds, NodeSpatialState, FolderPanMapping, ClusterSpatialConfig, SpatialAudioConfig, SpatialAudioEvent, SpatialAudioStats
- **Default Folder Mappings**: Projects (+0.5), Journal (-0.5), Archive (-0.8), Research (+0.3), Ideas (-0.3), Notes (0.0)
- **Default Configuration**: Disabled by default, Hybrid mode, Sigmoid curve, 70% intensity, 50% smoothing, 100ms throttle
- **Advanced Settings**: Depth mapping (future surround sound), velocity damping, boundary padding, hybrid weights

**Module Exports** (`src/audio/spatial/index.ts` - 27 lines)
- Clean module interface with all components and types exported

#### Integration (504 lines added)

**MusicalMapper** (`src/graph/musical-mapper.ts` +182 lines)
- **Phase 6.3 Lifecycle**: Full initialization, update, disable, and disposal methods
- **Public API**: `updateSpatialAudio()`, `registerNodeForSpatialAudio()`, `unregisterNodeFromSpatialAudio()`, `getPannerForNode()`
- **Configuration Management**: Settings integration with proper enum types
- **Error Handling**: Comprehensive try-catch with detailed logging
- **Backward Compatibility**: Graceful degradation when disabled

**Settings Interface** (`src/utils/constants.ts` +84 lines)
- **SonigraphSettings Extension**: Full `spatialAudio` configuration object
- **Enum Integration**: PanningMode and PanningCurve enums properly imported
- **Default Values**: Complete default configuration with all settings
- **Type Safety**: Proper TypeScript typing throughout

**UI Settings Panel** (`src/ui/SonicGraphView.ts` +238 lines)
- **Enable Toggle**: Main on/off switch with settings initialization
- **Panning Mode Dropdown**: 5 modes with descriptions (Graph Position, Folder Based, Cluster Based, Hybrid recommended, Disabled)
- **Pan Intensity Slider**: 0-100% control over panning extremeness with real-time feedback
- **Panning Curve Dropdown**: 4 mathematical curves (Linear, Exponential, Sigmoid recommended, Logarithmic)
- **Velocity Damping Toggle**: Enable/disable smooth position change damping
- **Dynamic Settings Display**: Settings panel shows/hides based on enable state
- **Real-Time Updates**: All changes immediately saved and applied
- **Settings Refresh**: Proper section recreation on toggle changes

#### Key Features

**5 Panning Modes:**
- **Graph Position**: Node X-position directly maps to stereo pan (-1 to 1)
- **Folder Based**: Pan determined by folder hierarchy with priority system
- **Cluster Based**: Pan calculated from cluster centroid position with configurable spread
- **Hybrid** (Recommended): Weighted combination (50% graph position, 30% folder, 20% cluster)
- **Disabled**: All audio centered (mono)

**4 Panning Curves:**
- **Linear**: Direct proportion from position to pan
- **Exponential**: Emphasizes extremes (y = sign(x) * |x|^2)
- **Sigmoid** (Recommended): Smooth S-curve with center bias for natural positioning
- **Logarithmic**: Compresses extremes for subtle panning

**Advanced Features:**
- **Velocity Damping**: Smooths rapid position changes during force simulation
- **Boundary Padding**: Prevents extreme left/right panning (configurable 0-1)
- **Update Throttling**: Limits position updates to prevent performance issues (default 100ms)
- **Folder Spread**: Nested files vary from folder pan by configurable factor (default 30%)
- **Cluster Spread**: Individual nodes vary from cluster center (default 20%)
- **Future Surround Sound**: Depth mapping infrastructure for Y-axis volume control

**Default Folder Mappings:**
- Projects → +0.5 (center-right)
- Journal → -0.5 (center-left)
- Archive → -0.8 (far left)
- Research → +0.3 (slightly right)
- Ideas → -0.3 (slightly left)
- Notes → 0.0 (center)

#### Performance

- **Update Throttle**: 100ms minimum between position updates per node
- **Velocity State Caching**: Efficient per-node state management
- **Minimal Overhead**: Zero performance impact when disabled
- **Smooth Integration**: Works seamlessly with force simulation
- **Build Performance**: TypeScript compilation successful, no errors

#### User Experience

- **Opt-In Feature**: Disabled by default to avoid surprising users
- **Intuitive Settings**: Clear labels, descriptions, and recommended options
- **Real-Time Feedback**: Pan intensity slider shows percentage value
- **Hybrid Mode Recommended**: Best balance of all positioning methods
- **Sigmoid Curve Recommended**: Most natural-sounding stereo positioning

---

### Added - Phase 6.2: Dynamic Orchestration ✅

#### Overview
Comprehensive vault complexity and temporal influence system that evolves instrumentation dynamically based on vault size, structure, time of day, and season. Provides 5-tier complexity scaling with automatic layer activation and intelligent instrument selection.

#### Core Components (1,022 lines, 3 files)

**Complexity Analyzer** (`src/audio/orchestration/ComplexityAnalyzer.ts` - 269 lines)
- **5 Complexity Tiers**: Minimal (0-100 nodes), Simple (100-500), Moderate (500-1000), Complex (1000-5000), Extensive (5000+)
- **Multi-Factor Scoring**: Weighted complexity calculation (40% nodes, 30% links, 20% clusters, 10% folder depth)
- **Logarithmic Scaling**: Handles large vaults gracefully with log10(nodes) normalization
- **Dynamic Thresholds**: Configurable tier thresholds with custom user settings
- **Tier Change Detection**: Intelligent detection of complexity increases/decreases
- **Instrument Count Recommendations**: 3 to 16 instruments based on tier and complexity score
- **Performance Optimized**: O(n) complexity calculation with minimal overhead

**Temporal Influence Engine** (`src/audio/orchestration/TemporalInfluence.ts` - 329 lines)
- **6 Time-of-Day Periods**: Early morning (5-8am), morning (8-12pm), afternoon (12-5pm), evening (5-9pm), night (9pm-12am), late-night (12-5am)
- **4 Seasonal Periods**: Spring (Mar-May), summer (Jun-Aug), autumn (Sep-Nov), winter (Dec-Feb)
- **Instrument Brightness Calculation**: Time and season affect overall brightness (0-1 scale)
- **Orchestral Density Control**: Dynamic instrument count modulation based on temporal context
- **Preferred Instrument Selection**: Time/season-appropriate instrument recommendations for each period
- **Timbre Adjustment**: -1 to +1 adjustment for darker (negative) to brighter (positive) sounds
- **Real-Time Detection**: System time-based automatic period detection
- **Configurable Strength**: Independent control over time-of-day (0-1) and seasonal (0-1) influence strength
- **Temporal Descriptions**: Human-readable descriptions of current temporal context

**Dynamic Orchestration Manager** (`src/audio/orchestration/DynamicOrchestrationManager.ts` - 424 lines)
- **7 Orchestration Layers**: basic-melody (always active), rhythmic (simple+), harmonic-pad (moderate+), bass-line (moderate+), counter-melody (complex+), orchestral-fills (complex+), ambient-texture (extensive only)
- **Complexity-Driven Activation**: Layers automatically enable as vault grows through complexity tiers
- **Temporal Modulation**: Time-of-day and seasonal influences on instrument selection and density
- **Instrument Density Control**: Recommended instrument count for each complexity tier (3-16 instruments)
- **Smooth Tier Transitions**: Configurable transition duration (0.5-10 seconds) for seamless orchestration changes
- **Auto-Adjustment Mode**: Real-time orchestration updates when vault structure changes
- **State Tracking**: Current complexity, active tier, previous tier, active layers, temporal influence, transition progress
- **Orchestration State Management**: Comprehensive state interface for monitoring and debugging

#### Integration (156 lines added)

**MusicalMapper** (`src/graph/musical-mapper.ts`)
- **Phase 6.2 Integration**: Full dynamic orchestration system integration
- **Manager Initialization**: DynamicOrchestrationManager created with user settings
- **Public Methods**: updateOrchestration(nodes, links, clusters) and getOrchestrationState()
- **Settings Updates**: Real-time configuration changes via updateSettings
- **Proper Disposal**: Manager cleanup on mapper disposal

**Type System** (`src/audio/orchestration/types.ts`)
- **124 Lines of Phase 6.2 Types**: VaultComplexity, ComplexityTier, ComplexityThreshold, OrchestrationLayer
- **Temporal Types**: TimeOfDay, Season, TemporalInfluence
- **Configuration Types**: InstrumentLayer, DynamicOrchestrationSettings, OrchestrationState

**Settings & Constants** (`src/utils/constants.ts`)
- **Configuration Interface**: dynamicOrchestration settings with 7 parameters
- **Sensible Defaults**: Disabled by default, temporal influence enabled, 0.5/0.3 strengths, 3s transitions, auto-adjust on

#### User Interface (219 lines)

**Settings Panel** (`src/ui/SonicGraphView.ts`)
- **Enable Toggle**: Master switch for dynamic orchestration system
- **Custom Thresholds Toggle**: Use custom vs default complexity thresholds
- **Temporal Influence Toggle**: Enable/disable time-of-day and seasonal effects
- **Time-of-Day Influence Slider**: 0-100% control over time-based instrument selection
- **Seasonal Influence Slider**: 0-100% control over season-based timbre adjustment
- **Transition Duration Slider**: 0.5-10 seconds for tier change smoothness
- **Auto-Adjust Toggle**: Automatic orchestration updates when vault changes
- **Real-Time Updates**: All settings apply immediately to orchestration engine
- **Collapsible Details**: Settings expand/collapse for clean interface with 6 detail controls
- **Dynamic Visibility**: Detail settings only shown when dynamic orchestration is enabled

#### Complexity Tiers

**Minimal (0-100 nodes)**
- Layers: basic-melody only
- Instrument Density: 30%
- Harmony Complexity: 30%
- Recommended Instruments: 3

**Simple (100-500 nodes)**
- Layers: basic-melody, rhythmic
- Instrument Density: 50%
- Harmony Complexity: 50%
- Recommended Instruments: 5

**Moderate (500-1000 nodes)**
- Layers: basic-melody, rhythmic, harmonic-pad, bass-line
- Instrument Density: 70%
- Harmony Complexity: 70%
- Recommended Instruments: 8

**Complex (1000-5000 nodes)**
- Layers: basic-melody, rhythmic, harmonic-pad, bass-line, counter-melody, orchestral-fills
- Instrument Density: 85%
- Harmony Complexity: 85%
- Recommended Instruments: 12

**Extensive (5000+ nodes)**
- Layers: All 7 layers including ambient-texture
- Instrument Density: 100%
- Harmony Complexity: 100%
- Recommended Instruments: 16

#### Time-of-Day Characteristics

**Early Morning (5-8am)**: Bright, awakening sounds
- Instruments: flute, celesta, harp, vibraphone
- Brightness: +30%, Density: -20%, Timbre: +0.3 (brighter)

**Morning (8-12pm)**: Energetic, clear tones
- Instruments: flute, violin, trumpet, piano
- Brightness: +40%, Density: +20%, Timbre: +0.4 (brightest)

**Afternoon (12-5pm)**: Warm, balanced
- Instruments: piano, guitar, cello, clarinet
- Brightness: +20%, Density: +30%, Timbre: +0.1

**Evening (5-9pm)**: Mellow, reflective
- Instruments: cello, french horn, oboe, piano
- Brightness: -20%, Density: +10%, Timbre: -0.2 (warmer)

**Night (9pm-12am)**: Darker, atmospheric
- Instruments: bass, synth pad, vocal pad, electric piano
- Brightness: -30%, Density: -20%, Timbre: -0.4 (darker)

**Late Night (12-5am)**: Minimal, ambient
- Instruments: synth pad, bass, ambient drone, vocal pad
- Brightness: -40%, Density: -40%, Timbre: -0.5 (darkest)

#### Seasonal Characteristics

**Spring (Mar-May)**: Bright, light instruments
- Instruments: flute, violin, harp, celesta, clarinet
- Brightness: +20%, Density: +10%, Timbre: +0.2

**Summer (Jun-Aug)**: Full, rich orchestration
- Instruments: trumpet, guitar, vibraphone, saxophone, marimba
- Brightness: +30%, Density: +30%, Timbre: +0.1

**Autumn (Sep-Nov)**: Warm, reflective tones
- Instruments: cello, oboe, french horn, bassoon, piano
- Brightness: -10%, Density: +20%, Timbre: -0.1

**Winter (Dec-Feb)**: Cool, crystalline sounds
- Instruments: celesta, vibraphone, synth pad, bells, ambient drone
- Brightness: -20%, Density: -10%, Timbre: -0.2

#### Performance
- **Efficient Algorithms**: O(n) complexity calculation where n = node count
- **Minimal Overhead**: System only processes when enabled
- **Real-Time Safe**: All operations suitable for live orchestration updates
- **Memory Efficient**: Threshold data cached, no dynamic allocations in hot paths

#### Configuration Options
- **enabled**: Master toggle (default: false)
- **customThresholds**: Use custom vs default tier thresholds (default: false)
- **temporalInfluenceEnabled**: Enable time/season effects (default: true)
- **timeOfDayInfluence**: Time-based influence strength 0-1 (default: 0.5)
- **seasonalInfluence**: Season-based influence strength 0-1 (default: 0.3)
- **transitionDuration**: Tier change smoothness in seconds (default: 3.0)
- **autoAdjust**: Auto-update on vault changes (default: true)

#### Testing
- Ready for validation via Test Suite Modal
- Recommended tests: Complexity tier detection, temporal influence accuracy, UI responsiveness
- Performance profiling: Overhead measurement with/without orchestration enabled

#### Files Modified
- **Created**: 3 files (1,022 lines in `src/audio/orchestration/`)
- **Modified**: 4 files (+502 lines across orchestration types, audio, config, UI)
- **Total Impact**: ~1,500 lines, fully integrated system

---

### Added - Phase 6.1: Musical Theory Integration ✅

#### Overview
Comprehensive musical theory system constraining audio output to proper musical scales and harmonies. Supports 17 scales/modes with pitch quantization, harmonic validation, and configurable constraints for musically coherent sonification.

#### Core Components (1,553 lines, 3 commits)

**Musical Type System** (`src/audio/theory/types.ts` - 232 lines)
- **27 Interfaces and Types**: Complete type definitions for all musical concepts
- **Scale Types**: Major, minor (natural/harmonic/melodic), pentatonic (major/minor), blues, chromatic, whole-tone, diminished
- **Modal Scales**: 7 church modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian)
- **Interval Types**: 13 intervals from unison to octave with frequency ratios
- **Chord Qualities**: 10 chord types (major, minor, diminished, augmented, 7ths, suspended)
- **Configuration Types**: MusicalTheoryConfig, HarmonicConstraints, QuantizedPitch, MusicalContext

**Scale Definitions** (`src/audio/theory/ScaleDefinitions.ts` - 467 lines)
- **17 Complete Scales**: Semitone intervals and characteristics for all scales/modes
- **A440 Tuning**: Standard concert pitch frequencies for all 12 notes
- **Interval Definitions**: Just intonation frequency ratios for all intervals
- **Chord Definitions**: 10 chord qualities with semitone interval formulas
- **5 Chord Progressions**: Common progressions (I-IV-V-I, ii-V-I, I-V-vi-IV, etc.)
- **Helper Functions**: calculateFrequency, getClosestNoteName, generateScaleFrequencies/Notes

**Harmonic Rules** (`src/audio/theory/HarmonicRules.ts` - 365 lines)
- **Consonance Ratings**: 0-1 ratings for all intervals (perfect fifth: 0.95, tritone: 0.1)
- **5 Voice Leading Rules**: Classical harmony rules (no parallel 5ths/8ves, contrary motion, voice crossing, leading tone resolution)
- **Plomp-Levelt Model**: Psychoacoustic dissonance calculation
- **Harmonic Analysis**: calculateDissonance, calculateHarmonicTension, validateVoiceLeading
- **Chord Functions**: Harmonic function detection (tonic, dominant, subdominant, predominant)
- **Constraint Enforcement**: applyHarmonicConstraints, isIntervalAvoided, getSuggestedIntervals

**Musical Theory Engine** (`src/audio/theory/MusicalTheoryEngine.ts` - 489 lines)
- **Pitch Quantization**: Constrain frequencies to scale with configurable strength (0-1)
- **Scale Management**: Create, switch, and modulate between any supported scale
- **Chord Generation**: Generate chords and progressions with proper voice leading
- **Melody Harmonization**: Add harmony voices below melody using preferred intervals
- **Harmonic Validation**: Check dissonance, tension, and scale conformance
- **Musical Context**: Track recent notes, tension, and progression state
- **Dynamic Modulation**: Optional scale changes based on musical context
- **Performance**: Integrated logging, caching, and efficient algorithms

#### Integration (56 lines added)

**ClusterAudioMapper** (`src/audio/clustering/ClusterAudioMapper.ts`)
- **Musical Theory Engine**: Initialized with user configuration
- **Pitch Constraint**: calculateClusterFrequency applies scale constraints when enabled
- **Settings Updates**: updateMusicalTheorySettings method for runtime configuration
- **Proper Disposal**: Engine cleanup on mapper disposal

**Settings & Constants** (`src/utils/constants.ts`)
- **Configuration Interface**: musicalTheory settings with all 9 parameters
- **Sensible Defaults**: Disabled by default, C major scale, 0.8 quantization strength
- **Full Customization**: All scales, root notes, thresholds, and behaviors configurable

#### User Interface (303 lines)

**Settings Panel** (`src/ui/SonicGraphView.ts`)
- **Enable Toggle**: Master switch for musical theory system
- **Root Note Dropdown**: All 12 chromatic notes (C through B)
- **Scale Type Dropdown**: 13 scales organized by family (major, minor, pentatonic, exotic, modal)
- **Quantization Strength**: Slider (0-100%) controlling how strictly frequencies snap to scale
- **Dissonance Threshold**: Slider (0-100%) setting maximum allowed dissonance
- **Enforce Scale Harmony**: Toggle to constrain all pitches to selected scale
- **Allow Chromatic Passing**: Toggle to permit brief chromatic notes
- **Dynamic Scale Modulation**: Toggle for automatic scale changes based on context
- **Real-Time Updates**: All settings apply immediately to audio engine
- **Collapsible Details**: Settings expand/collapse for clean interface

#### Musical Scales Supported

**Major Family**
- Major (Ionian): Bright, happy, stable [0,2,4,5,7,9,11]

**Minor Family**
- Natural Minor (Aeolian): Dark, sad, melancholic [0,2,3,5,7,8,10]
- Harmonic Minor: Exotic, dramatic, Middle Eastern [0,2,3,5,7,8,11]
- Melodic Minor: Bright minor, versatile [0,2,3,5,7,9,11]

**Pentatonic Family**
- Pentatonic Major: Simple, folk, universal [0,2,4,7,9]
- Pentatonic Minor: Blues, rock, melancholic [0,3,5,7,10]

**Exotic Scales**
- Blues: Bluesy, soulful, expressive [0,3,5,6,7,10]
- Chromatic: All 12 notes - dissonant, atonal, free [0-11]
- Whole Tone: Dreamy, ambiguous, impressionistic [0,2,4,6,8,10]
- Diminished: Tense, symmetrical, jazzy [0,2,3,5,6,8,9,11]

**Church Modes**
- Dorian: Jazzy, sophisticated, versatile [0,2,3,5,7,9,10]
- Phrygian: Spanish, dark, exotic [0,1,3,5,7,8,10]
- Lydian: Dreamy, ethereal, floating [0,2,4,6,7,9,11]
- Mixolydian: Blues-rock, dominant, strong [0,2,4,5,7,9,10]
- Locrian: Unstable, dissonant, theoretical [0,1,3,5,6,8,10]

#### Performance
- **Efficient Algorithms**: O(n) pitch quantization, O(n²) dissonance calculation
- **Minimal Overhead**: Theory engine only processes when enabled
- **Real-Time Safe**: All operations suitable for audio thread
- **Memory Efficient**: Scale data cached, no dynamic allocations in hot paths

#### Configuration Options
- **enabled**: Master toggle (default: false)
- **scale**: Major/minor/pentatonic/exotic/modal (default: 'major')
- **rootNote**: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (default: 'C')
- **enforceHarmony**: Constrain all pitches to scale (default: true)
- **allowChromaticPassing**: Permit brief chromatic notes (default: false)
- **dissonanceThreshold**: Maximum dissonance 0-1 (default: 0.3)
- **quantizationStrength**: Scale snap strength 0-1 (default: 0.8)
- **preferredChordProgression**: Default progression (default: 'I-IV-V-I')
- **dynamicScaleModulation**: Auto scale changes (default: false)

#### Testing
- Ready for validation via Test Suite Modal
- Recommended tests: Scale quantization accuracy, harmonic constraint enforcement, UI responsiveness
- Performance profiling: Overhead measurement with/without theory enabled

#### Files Modified
- **Created**: 5 files (1,553 lines in `src/audio/theory/`)
- **Modified**: 3 files (+385 lines across audio, config, UI)
- **Total Impact**: ~1,900 lines, 3 commits

---

### Added - Phase 5.2: Hub Node Orchestration ✅

#### Overview
Hub nodes now act as "conductors" to drive dynamic orchestration decisions based on centrality metrics. Central nodes get prominent lead instruments while peripheral nodes provide accompaniment.

#### Core Components (2,191 lines, 4 commits)

**Hub Centrality Analysis**
- **Multiple Centrality Algorithms**: 4 sophisticated algorithms working together
  - Degree centrality: Normalized connection count
  - Betweenness centrality: Frequency on shortest paths between nodes
  - Eigenvector centrality: Connections to well-connected nodes
  - PageRank: Google's authority algorithm adapted for knowledge graphs
- **Composite Scoring**: Configurable weights (default: 30% degree, 30% betweenness, 20% eigenvector, 20% PageRank)
- **Performance Caching**: 5-second cache minimizes recalculation overhead
- **Hub Prominence Tiers**: 5 levels (super-hub, hub, near-hub, intermediate, peripheral)

**Orchestration System**
- **3 Orchestration Modes**:
  - Hub-led: Strong hierarchy with clear leader-follower dynamics
  - Democratic: All nodes equal volume (no hub prominence)
  - Balanced: Moderate hub prominence (default)
- **Role-Based Instrument Pools**:
  - Conductor: Piano, trumpet, violin, lead synth
  - Lead: Electric piano, French horn, cello, flute
  - Harmony: Strings, pad synth, vibraphone, clarinet
  - Accompaniment: Guitar, bass, marimba, harp
  - Ambient: Choir, celesta, ambient synth, vocal pad
- **Distance-Based Audio**: Volume scales with graph distance from hub
- **Spatial Positioning**: Pan calculation based on hub distance and angular distribution

**Hub Transition Audio**
- **Hub Emergence**: Crescendo effect with harmonic buildup when node becomes hub
- **Hub Demise**: Decrescendo with graceful fadeout when hub loses centrality
- **Hub Shift**: Frequency sweep with filter modulation for centrality changes
- **Configurable Curves**: Linear, exponential, or logarithmic transition curves

#### Integration
- **GraphDataExtractor**: Optional hub centrality calculation, `hubCentrality` property on nodes
- **ClusterAudioMapper**: Full hub orchestration support with `updateGraphData()` and `updateHubOrchestrationSettings()` methods
- **Settings UI**: Complete panel in Sonic Graph View with real-time controls

#### Configuration
- **Default Settings**: Disabled by default, balanced mode, 0.6 hub threshold, 2.0x prominence
- **User Controls**: Hub threshold (40-90%), prominence multiplier (1-5x), centrality weights, transitions toggle

#### Performance
- **Algorithms**: O(n²) for betweenness, O(n log n) for others
- **Caching**: 5-second cache with automatic invalidation
- **Optimized**: Efficient graph algorithms (Dijkstra, power iteration, PageRank)

#### Files
- **Created**: 5 new files (1,702 lines in `src/audio/orchestration/`)
- **Modified**: 5 files (+403 lines across graph, audio, UI, and config)

---

### Changed - Sonic Graph: Modal to ItemView Migration ✅

#### Major Architecture Update
- **Migrated from Modal to ItemView**: Complete conversion from modal-based interface to persistent workspace view
  - Sonic Graph now integrates seamlessly with Obsidian's workspace system
  - View can be docked in sidebars, split panes, or main area
  - Works alongside other views and files for better multitasking
  - Single-instance pattern prevents duplicate views
  - ItemView is now the **default** interface (ribbon icon, primary command, Control Center button)

#### State Persistence
- **Timeline Position Persistence**: Timeline scrubber position saved across Obsidian restarts
- **Animation Speed Persistence**: Playback speed (0.5x-5x) preserved between sessions
- **View Mode Persistence**: Static vs Timeline view mode restored automatically
- **Settings Panel State**: Settings visibility maintained across restarts
- **Auto-Save on Changes**: Workspace layout automatically saved when state changes
- **Debounced Saving**: Timeline scrubbing triggers save after 500ms of inactivity for performance

#### Performance Optimizations
- **Background Animation Pause**: Animation automatically pauses when view is inactive to save CPU
- **Smart Resume**: Animation seamlessly resumes when returning to Sonic Graph view
- **Audio Continuity**: Continuous layers keep playing in background for uninterrupted experience
- **Resource Management**: Proper cleanup prevents memory leaks and ensures smooth disable/enable cycles

#### Lifecycle Management
- **Robust Cleanup**: Comprehensive error handling in view close and plugin unload
- **Fixed Plugin Disable**: Plugin now properly disables and stays disabled (was re-enabling on restart)
- **Proper Resource Release**: All audio, animation, and UI resources cleaned up correctly
- **Workspace Integration**: View closes automatically when plugin is disabled

#### User Interface
- **Consistent Interface**: View accessible via ribbon icon, command palette, and Control Center
- **Responsive Sizing**: Works correctly in all view positions and sizes
- **Settings Panel**: Fully functional in all contexts (main, sidebar, split panes)
- **Legacy Fallback**: Original modal still available via "Open Sonic Graph (Modal - Legacy)" command

#### Technical Details
- **New File**: `src/ui/SonicGraphView.ts` (6,258 lines) - Complete ItemView implementation
- **Updated**: Control Center button now opens view instead of modal
- **State Interface**: `SonicGraphViewState` with 6 tracked properties
- **CSS Classes**: Separate view classes (`.sonic-graph-view`) with no modal conflicts
- **Event Handling**: Workspace `active-leaf-change` event for background state detection
- **Async Initialization**: Proper handling of async animator initialization during state restoration

#### Migration Status
- **Phase 1**: Core Migration ✅ Complete
- **Phase 2**: State Persistence ✅ Complete
- **Phase 3**: UI and Styling ✅ Complete
- **Phase 4**: Lifecycle Management ✅ Complete
- **Phase 5**: Testing ✅ Substantially Complete
- **Phase 6**: Modal Deprecation ⏸️ Deferred (keeping modal as fallback)

**Status**: PRODUCTION READY - All core functionality tested and working

### Added - Phase 5.3: Community Detection Audio System

#### Community Structure Audio Representation
- **5 Community Type Audio Themes**: Orchestral themes representing different community structures
  - **Large Stable Communities**: Deep, rich orchestral foundations (A2, 6 voices) for communities with >15 nodes
  - **Small Dynamic Communities**: Agile chamber music ensembles (D4, 3 voices) for communities with <15 nodes
  - **Bridge Communities**: Harmonic progressions (C4, 4 voices) connecting disparate graph structures
  - **Isolated Communities**: Unique distinctive timbres (F#4, 2 voices) for low-connectivity communities
  - **Hierarchical Communities**: Nested harmonic structures (G3, 5 voices) for communities within communities
- **Louvain Algorithm Integration**: Automatic community detection using graph theory clustering
- **Theme Variations**: Dynamic complexity based on community strength and characteristics

#### Community Evolution Audio Events
- **7 Evolution Event Types**: Real-time audio feedback for community lifecycle changes
  - **Community Merge**: Harmonic convergence with blended themes as communities combine
  - **Community Split**: Divergent harmony with separating voices when communities divide
  - **Community Growth**: Expanding orchestration with additional voices for growing communities
  - **Community Decline**: Fading voices with harmonic simplification for shrinking communities
  - **Community Bridging**: Cross-fade between community themes when connections form
  - **Community Formation**: Rising harmonies with gradual buildup for newly detected communities
  - **Community Dissolution**: Gradual fadeout with harmonic simplification when communities disappear
- **Event Throttling**: Configurable throttle timing (100-2000ms, default 500ms) to prevent audio crackling
- **Evolution Thresholds**: Adjustable sensitivity for growth/decline detection (0.1-1.0, default 0.3)

#### Advanced Community Analysis
- **Hierarchical Community Detection**: Multi-level analysis with containment threshold (0.3-1.0, default 0.7)
- **Community Characteristics Analysis**: Size, stability, connectivity, and betweenness centrality
- **Inter-Community Relationship Tracking**: Bridge detection and cross-community connection analysis
- **Spatial Audio Positioning**: Stereo field placement based on community visual positions
- **Configurable Width**: Spatial audio spread control (0-1, default 0.8)

#### Comprehensive UI Integration
- **Community Detection Settings Section**: Complete settings interface in Sonic Graph Modal
  - Main enable/disable toggle for community detection audio
  - Individual volume controls (0-1) for all 5 community types
  - Large community threshold slider (5-30 nodes, default 15)
  - Hierarchy analysis toggle with containment threshold
  - Spatial audio controls (enable toggle, width slider)
  - Theme intensity slider (0-2, default 1.0)
- **Community Evolution Settings Section**: Dedicated evolution audio controls
  - Main enable/disable toggle for evolution audio events
  - Individual toggles and volume controls for all 7 event types
  - Evolution threshold sliders for growth/decline sensitivity
  - Performance controls with event throttle timing
- **Progressive Disclosure**: Advanced settings shown only when features are enabled
- **Collapsible Sections**: Clean UI organization with expandable/collapsible panels

#### Technical Implementation
- **CommunityAudioAnalyzer** (383 lines): Louvain algorithm integration and community detection
- **CommunityThemeGenerator** (458 lines): Orchestral theme generation with voice management
- **CommunityEvolutionTracker** (574 lines): Lifecycle tracking and evolution event management
- **Performance Optimizations**: Efficient community detection caching and event throttling
- **Type-Safe Architecture**: Comprehensive TypeScript interfaces with 165+ lines of community types
- **Backward Compatible**: All features disabled by default, opt-in activation

### Added - Phase 5.1: Smart Clustering Audio Integration

#### Cluster-Based Musical Themes System
- **5 Unique Cluster Audio Themes**: Distinct sonic characteristics for each cluster type with specialized musical DNA
  - **Tag-based Clusters** (Green): Harmonious major 7th chords (C4) representing semantic tag relationships
  - **Folder-based Clusters** (Blue): Structured architectural sounds (G3) reflecting organizational hierarchy
  - **Link-dense Clusters** (Pink): Dense chromatic harmonies (D4) for highly interconnected nodes
  - **Temporal Clusters** (Yellow): Rhythmic patterns (E4) reflecting time-based relationships
  - **Community Clusters** (Purple): Rich orchestral extended harmonies (A3) for community structures
- **Theme Variations**: Dynamic complexity based on cluster strength - stronger clusters get richer harmonies
- **Fallback System**: Graceful degradation for unknown cluster types

#### Dynamic Cluster Transitions
- **4 Transition Effect Types**: Professional audio transitions for cluster events
  - **Glissando Effects**: Smooth pitch sweeps for node join/leave events
  - **Harmonic Buildup**: Stacked harmonic convergence for cluster formation
  - **Filter Sweep**: Frequency sweeps for cluster strength changes and dissolution
  - **Granular Scatter**: Complex granular effects for sophisticated transitions
- **Real-time Detection**: Automatic cluster change detection with intelligent transition triggering
- **Configurable Parameters**: User control over transition speed, volume, and intensity

#### Advanced Audio Features
- **Real-time Cluster Strength Modulation**: Audio volume and complexity respond to cluster cohesion in real-time
- **Spatial Audio Positioning**: Stereo panning based on cluster visual positions in graph
- **Performance Optimization**: Voice pooling, throttled updates, and concurrent cluster limits
- **Strength-Responsive Themes**: Stronger clusters receive more complex harmonic content automatically

#### Comprehensive UI Integration
- **Smart Clustering Audio Settings Panel**: Complete settings interface in Sonic Graph Modal
- **Progressive Disclosure**: Advanced settings shown only when cluster audio is enabled
- **Individual Cluster Type Controls**: Toggle and volume controls for each of the 5 cluster types
- **Advanced Configuration**: Real-time updates, strength modulation sensitivity, spatial audio toggles
- **Performance Controls**: Max simultaneous clusters, update throttling, and system resource management
- **Color-Coded Descriptions**: UI descriptions match visual cluster color themes (Green, Blue, Pink, Yellow, Purple)

#### Technical Implementation
- **ClusterAudioMapper**: Complete cluster audio management system with transition detection and performance optimization
- **ClusterThemeGenerator**: Sophisticated theme generation with musical theory integration and dynamic variations
- **Enhanced MusicalMapper**: Cluster audio integration within existing musical mapping system
- **Type-Safe Architecture**: Comprehensive TypeScript interfaces and error handling throughout
- **Tone.js Integration**: Professional audio synthesis using Web Audio API with efficient resource management

### Added - Phase 4: Enhanced Content-Aware Mapping System

#### Connection Type Audio Differentiation
- **4 Connection Type Audio Themes**: Unique sonic characteristics for each connection type
  - **Wikilink Connections**: Bright, precise tones for direct note-to-note references
  - **Embed Connections**: Rich, sustained harmonies for embedded content relationships
  - **Markdown Links**: Clean, articulated sounds for external and internal markdown links
  - **Tag Connections**: Ambient, flowing textures for tag-based semantic relationships
- **Advanced Audio Characteristics**: Configurable base volume, note duration, spatial spread, harmonic richness
- **Link Strength Analysis**: Frequency-based connection strength with volume and harmonic boosting
- **Contextual Modifiers**: Same-folder boost, cross-folder reduction, recent connection emphasis

#### Intelligent Audio Configuration
- **Bidirectional Harmony**: Optional harmony generation for reciprocal connections
- **Strength-to-Volume Mapping**: Dynamic volume adjustment based on connection frequency
- **Chord Generation**: Intelligent chord building for harmonic connection types
- **Broken Link Detection**: Dissonance generation for missing or broken references
- **Temporal Decay**: Connection strength decays over time with configurable day thresholds

#### UI Integration & Settings
- **Connection Type Settings Panel**: Dedicated collapsible section in Sonic Graph settings
- **Per-Type Configuration**: Individual toggles and detailed settings for each connection type
- **Real-time Preview**: Immediate audio feedback when adjusting connection type parameters
- **Professional Presets**: Optimized default configurations for different connection types
- **Visual Feedback**: Settings panel styling matches Obsidian's design language

### Added - Phase 3: Continuous Audio Layers System

#### Multi-Genre Ambient Layer Architecture
- **13 Musical Genres**: Complete genre-based continuous layer system
  - **Ambient**: Ethereal pads and atmospheric textures
  - **Classical**: Orchestral strings and refined harmonic progressions
  - **Electronic**: Synthesized pads, arpeggios, and electronic textures
  - **Jazz**: Sophisticated harmony with subtle swing rhythms
  - **Cinematic**: Epic, evolving soundscapes for dramatic atmosphere
  - **Folk**: Acoustic, organic textures with natural instrument timbres
  - **World**: Global music influences with diverse scales and instruments
  - **Minimal**: Sparse, contemplative soundscapes with space and silence
  - **Experimental**: Avant-garde textures and unconventional sonic exploration
  - **Nature**: Environmental sounds integrated with musical elements
  - **Sacred**: Meditative, spiritual atmospheres with reverent tones
  - **Retro**: Vintage synthesizer aesthetics and nostalgic electronic sounds
  - **Cosmic**: Spacey, otherworldly textures for vast sonic landscapes

#### Dynamic Continuous Layer Management
- **Adaptive Intensity**: Layer volume automatically adjusts based on vault size and activity
- **Real-time Genre Switching**: Seamless transitions between different musical genres
- **Evolution Rate Control**: Configurable pace of layer progression and development
- **Musical Theory Integration**: Scale-aware harmonic progressions with key and mode selection
- **Performance Optimization**: CPU usage targeting <5% additional overhead

#### Rhythmic Layer System
- **Activity-Based Tempo Mapping**: Vault activity levels drive rhythmic layer intensity
- **Percussion Integration**: Subtle percussion elements respond to vault interaction
- **Temporal Synchronization**: Rhythmic layers sync with graph animation timeline
- **Configurable Rhythmic Patterns**: Multiple rhythm styles suitable for different work contexts

#### Harmonic Layer System
- **Cluster-Based Harmony**: Chord progressions reflect vault structure and node relationships
- **Musical Scale Integration**: Harmonic layers respect selected musical scales and keys
- **Dynamic Chord Progression**: Evolving harmonic content based on graph state
- **Voice Leading**: Smooth harmonic transitions using music theory principles

### Added - Phase 2: Content-Aware Mapping Foundation (REVISED)

#### Metadata-Driven Mapping Engine
- **Zero-Latency Vault Analysis**: Leverages Obsidian's MetadataCache for instant vault-wide mapping analysis
- **TFile Integration**: Direct integration with Obsidian's file system architecture
- **Batch Metadata Processing**: Efficient processing of large vault metadata sets
- **Real-time Metadata Updates**: Automatic remapping when vault content changes
- **Performance Monitoring**: Detailed timing metrics for mapping operations

#### Vault-Wide Mapping Optimization
- **Pre-computed Link Resolution**: Uses Obsidian's resolvedLinks and unresolvedLinks for instant access
- **Intelligent Caching**: Metadata caching with smart invalidation strategies
- **Batch Update Processing**: Efficient handling of multiple file changes
- **Memory Optimization**: Reduced memory footprint through optimized data structures
- **Cross-Reference Analysis**: Advanced analysis of file relationships and dependencies

#### Advanced Instrument Distribution
- **Content-Aware Assignment**: Intelligent instrument selection based on file content analysis
- **Diversity Weighting**: Balanced instrument distribution across vault content
- **Spatial Distribution**: Geographic-style instrument placement in audio space
- **Semantic Clustering**: Related content receives harmonious instrument pairings
- **Dynamic Rebalancing**: Automatic redistribution when vault structure changes

## [0.11.0] - 2025-01-04

### Added - Timeline Granularity & UI Enhancement System

#### Comprehensive Timeline Controls
- **Multi-Level Granularity**: Choose from Year, Month, Week, Day, Hour, or Custom time ranges for timeline animation
- **Time Window Filtering**: Focus on specific periods (All time, Past year, Past month, Past week, Past day, Past hour)
- **Smart Event Spreading**: Intelligent audio event distribution with None, Gentle, and Aggressive modes to prevent crackling
- **Custom Range Support**: Precise control with configurable value and time unit combinations
- **Intelligent Date Range Calculation**: Respects actual file dates while applying user-selected time windows

#### Audio Quality Improvements
- **Advanced Event Spreading Algorithms**: Sophisticated batch processing for large simultaneous event clusters
- **Simultaneous Event Limiting**: Configurable thresholds to prevent audio system overload
- **Adaptive Frame Rate**: Dynamic animation performance based on graph complexity
- **Crackling Prevention**: Intelligent spacing algorithms eliminate audio distortion from clustered events

#### Comprehensive Settings Enhancement
- **21 Enhanced Tooltips**: Added detailed, helpful tooltips to all Sonic Graph settings explaining features and usage
- **Obsidian-Style UI Consistency**: Converted Adaptive Detail and Show Cluster Labels to native Obsidian Setting API toggles
- **Enhanced Weight Sliders**: Improved clustering weight controls with detailed tooltips for Link Strength, Shared Tags, Folder Hierarchy, and Temporal Proximity
- **Settings Organization**: Better visual hierarchy with comprehensive user guidance throughout the interface

#### User Experience Improvements
- **Event Spreading Dropdown**: Converted radio buttons to dropdown with improved tooltip placement
- **Real-time Setting Updates**: Immediate visual feedback for all timeline and granularity changes
- **Smart Default Values**: Intelligent default settings that work well for most use cases
- **Performance Monitoring**: Enhanced logging system for debugging timeline and audio issues

## [0.10.0] - 2025-07-03

### Major Features Added

This release represents a significant milestone in graph visualization quality, introducing four major enhancement systems that transform how users interact with their knowledge graphs.

### Added - Smart Clustering Algorithms

#### Intelligent Node Grouping
- **Community Detection Algorithms**: Louvain, Modularity, and Hybrid clustering algorithms for automatic grouping of related nodes
- **Multi-factor Clustering Weights**: Intelligent weighting system with Link Strength (40%), Shared Tags (30%), Folder Hierarchy (20%), and Temporal Proximity (10%)
- **Cluster Type Detection**: Automatic identification of tag-based, temporal, link-dense, and community clusters with distinct visual styling
- **Enhanced Detection**: Lowered detection thresholds and improved scoring algorithms for better cluster variety

#### Visual Cluster Representation
- **Real-time Cluster Boundaries**: Dynamic SVG cluster visualization with color-coded boundaries and proper positioning around relevant node groups
- **Obsidian Color Integration**: Color palette using Obsidian's built-in CSS variables for theme consistency (Green, Blue, Purple, Orange)
- **Layer Ordering**: Clusters render on top of nodes for proper visibility with correct z-index management
- **Dynamic Positioning**: Clusters recalculate position during force simulation for accurate boundary representation

#### Settings & Integration
- **Plugin Settings Toggle**: Main "Enable Smart Clustering" toggle alongside other core features
- **Algorithm Selection**: Choose between Louvain, Modularity, or Hybrid clustering approaches in Sonic Graph settings
- **Weight Configuration**: Fine-tune multi-factor clustering weights with real-time preview
- **Visualization Controls**: Enable/disable cluster boundaries and debug modes

#### Technical Implementation
- **SmartClusteringAlgorithms Class**: Complete 1000+ line implementation with community detection and multi-factor clustering
- **Performance Optimized**: O(n log n) complexity algorithms with cached calculations and threshold controls
- **GraphRenderer Integration**: Seamless integration with D3.js force simulation and SVG rendering system
- **Settings Architecture**: Extended SonicGraphSettings interface with comprehensive clustering configuration

### Added - Content-Aware Positioning System

#### Semantic Graph Layout
- **Tag Influence Force**: Files with shared tags are pulled together using configurable semantic attraction forces
- **Temporal Positioning**: Recent files gravitate toward center while older files settle toward archive regions
- **Hub Centrality Force**: Highly connected nodes are pulled toward graph center creating natural hub-and-spoke patterns
- **Real-time Weight Adjustment**: Fine-tuning sliders in Sonic Graph settings panel with immediate preview
- **Debug Visualization**: Optional overlay showing temporal zones (green/blue/gray), tag connections (orange), and hub indicators (red)

#### Integration & Settings
- **Plugin Settings Toggle**: Main "Enable Content-Aware Positioning" toggle alongside Adaptive Detail Levels
- **Modal Controls**: Comprehensive fine-tuning interface in Sonic Graph settings panel
- **Real-time Preview**: All changes apply immediately to graph without restart
- **Performance Optimized**: Semantic forces maintain smooth 60fps rendering performance

#### Technical Implementation
- **ContentAwarePositioning Class**: Core semantic force algorithms with D3.js integration
- **Force Types**: Three configurable force systems working in harmony with physics simulation
- **Debug System**: Real-time visual debugging with SVG overlays and CSS styling
- **Settings Architecture**: Extended SonicGraphSettings interface with comprehensive configuration options

### Enhanced - Sonic Graph Adaptive Detail Levels & Modal Interface

#### Zoom Stability Improvements
- **Enhanced Stability**: Improved zoom stability during panning operations to reduce twitchy behavior
- **Increased Debounce Timing**: Extended debounce from 100ms to 250ms for smoother panning experience
- **Enhanced Hysteresis**: Increased hysteresis margin from 10% to 20% to prevent rapid oscillation between detail levels
- **Minimum Change Interval**: Added 500ms minimum interval between detail level changes to prevent rapid switching
- **Improved Thresholds**: Increased large zoom detection threshold from 50% to 75% to better distinguish intentional zoom vs panning drift

#### Modal Interface Enhancements  
- **Enhanced Header Design**: Added chart-network icon to Sonic Graph title for better visual identification
- **Improved Layout**: Implemented flexbox-based header with perfect vertical alignment of title and Control Center button
- **Better Positioning**: Title with icon on left, Control Center button on right, with proper spacing for Obsidian's close button
- **Visual Polish**: Clean, professional header layout that integrates seamlessly with Obsidian's design language

#### Technical Improvements
- **AdaptiveDetailManager**: Enhanced stability parameters and intelligent processing logic
- **UI Architecture**: Simplified modal header structure with better separation of concerns
- **Performance**: Maintained smooth graph interaction while reducing zoom level switching frequency

## [0.9.0-alpha] - 2025-07-02

### Fixed - Sonic Graph Performance Optimization
- **Major Performance Improvement**: Optimized graph data processing to achieve instant loading performance matching Obsidian's core Graph plugin
- **MetadataCache Integration**: Replaced manual file parsing with Obsidian's pre-computed `resolvedLinks` and `unresolvedLinks` for instant link access
- **Eliminated File System Bottlenecks**: Removed regex-based content scanning and manual link resolution
- **Optimized Data Structures**: Implemented O(n) tag indexing and batch metadata caching for reduced API calls
- **Enhanced Performance Monitoring**: Added detailed timing metrics for each graph extraction phase
- **Intelligent Connection Weighting**: Link strength now based on actual connection frequency from MetadataCache

### Technical
- **Data Processing**: Overhauled GraphDataExtractor with optimized node and link extraction algorithms
- **Architecture**: Leverages Obsidian's battle-tested graph infrastructure for reliability and performance
- **Codebase**: Simplified and more maintainable code without redundant parsing logic

## [0.3.0] - 2024-12-19

### Added - Phase 8: Complete Orchestral System
- **34 Total Instruments**: Complete orchestral families with specialized synthesis engines
- **Advanced Percussion**: Physics-based timpani, xylophone, vibraphone, and gongs with realistic articulation
- **Electronic Synthesis**: Professional lead/bass/arp synths with filter modulation and LFO control
- **Master Effects**: Orchestral reverb, 3-band EQ, and compressor with automatic routing
- **Enhanced UI**: Family-organized effects interface with filtering and quick toggles
- **Performance Optimization**: Adaptive quality system with CPU monitoring and voice pooling

### Changed
- Extended AudioEngine with PercussionEngine and ElectronicEngine
- Redesigned Effects tab for 34-instrument management
- Added professional default configuration (5 core instruments enabled)

## [0.2.0] - 2024-12-19

### Added
- **Per-Instrument Effect Routing**: Individual reverb, chorus, and filter chains for each of 13 instruments
- **Effect Presets**: 11 professional presets (Concert Hall, Cathedral, Studio, Jazz Club, Arena, Ambient, Classical, Electronic, Cinematic, Dry, Lush)
- **Real-Time Audio Feedback**: Parameter preview with sustained notes, A/B bypass comparison, performance monitoring
- **Smart Parameter Ranges**: Instrument-specific intelligent limits with musical context and suggestions
- **Professional UI**: Categorized presets, color-coded performance indicators, comprehensive styling system

### Changed
- **AudioEngine Architecture**: Refactored for per-instrument effect processing with proper type safety
- **Settings Migration**: Automatic upgrade system for existing users from global to per-instrument effects
- **Harmony Tab**: Replaced with placeholder for future development

### Technical
- Complete TypeScript type safety with specific effect interfaces (ReverbSettings, ChorusSettings, FilterSettings)
- 1700+ lines of organized CSS styling
- Clean build system with resolved compilation errors

## [0.6.1] - 2025-06-21

### Added - CDN Sample Integration & UI Improvements
- **"Use High Quality Samples" Toggle**: User-friendly control for CDN sample loading with 19/34 instruments supported
- **Real-time Audio Mode Display**: Immediate feedback showing "High Quality Samples" vs "Synthesis Only" without navigation
- **Comprehensive CDN Diagnostic System**: Real-time loading status reporting with detailed error analysis
- **Automatic Synthesis Fallback**: Vocal instruments (soprano, alto, tenor, bass) now automatically fall back to synthesis when CDN samples fail
- **Issue #012 Resolution**: Created specialized vocal synthesis with distinct timbres for each voice type

### Changed
- **Audio System Controls Location**: Moved "Use High Quality Samples" toggle from Master tab to Audio System section in Status tab
- **Immediate UI Updates**: Audio mode display updates instantly when toggling sample quality without requiring navigation
- **Settings Architecture**: Replaced `audioFormat` enum with `useHighQualitySamples` boolean for clearer user control
- **Hybrid Sample/Synthesis System**: 56% CDN sample coverage with graceful synthesis fallback for remaining instruments

### Fixed
- **Issue #011**: CDN Sample Loading Diagnosis - Comprehensive analysis and resolution of sample availability
- **Issue #012**: Vocal Instrument Silence - Eliminated silent playback for vocal instruments in high quality mode
- **CDN Loading Failures**: Automatic detection and fallback for failed sample loading within 5 seconds
- **User Experience**: Removed confusing audio format selection in favor of simple on/off toggle

### Technical
- Enhanced audio engine with `createSamplerWithFallback()` method for robust CDN loading
- Added specialized vocal synthesis creation with distinct parameters per voice type
- Implemented real-time fallback detection and instrument replacement
- Updated architecture documentation with hybrid sample/synthesis system details
- Comprehensive logging and diagnostic capabilities for troubleshooting sample loading issues

## [0.8.0] - 2025-06-23

### Added - Comprehensive Instrument Configuration & Documentation Restructuring
- **Issue #015 Resolution**: Fixed whale volume controls and missing instrument configurations
- **Complete Instrument Audit**: Corrected sample configurations for all 34 instruments against nbrosowsky CDN availability
- **Enhanced Audio Engine**: Added automatic sample detection and graceful fallback to synthesis for instruments without available samples
- **Synthesis-Only Instruments**: Properly configured electric piano, harpsichord, accordion, celesta, and string ensemble as synthesis-only with UI dropdown removal
- **Guitar Family Reorganization**: Renamed and grouped acoustic, electric, and nylon guitars with consistent naming
- **Effect Presets Implementation Plan**: Added comprehensive technical specifications for 11 professional acoustic environment presets

### Changed
- **Documentation Structure**: Eliminated overlap between development roadmap and feature catalog with clear separation of strategic vs. technical content
- **Development Roadmap**: Streamlined to focus on strategic planning with status tracking and cross-references to detailed specifications
- **Feature Catalog**: Enhanced with comprehensive technical specifications moved from roadmap, including implementation details for all planned features
- **Instrument Configurations**: Updated all woodwind, brass, and string instruments to only include samples that actually exist in the CDN
- **UI Logic**: Improved dropdown visibility logic to hide "Use recording" option for synthesis-only instruments

### Fixed
- **Piano Sample Loading**: Resolved "Use recording" setting being ignored, now properly loads piano samples when enabled
- **Organ Configuration**: Fixed hardcoded synthesis override and updated to use available organ samples instead of non-existent harmonium samples
- **Missing Samples**: Corrected configurations for oboe (synthesis-only), clarinet, flute, saxophone, trumpet, french horn, trombone, harp, and violin
- **Instrument Naming**: Standardized guitar family naming for better user clarity
- **Volume Control Issues**: Resolved whale instrument volume control problems that initiated this fix branch

### Technical
- Enhanced `initializeEssentials` method to automatically detect sample requirements and upgrade to full initialization
- Added `requiresHighQuality` flag and `hasSamples` detection logic for robust sample/synthesis decisions
- Implemented comprehensive error handling for missing sample files with automatic fallback
- Updated audio engine logging for better debugging of sample loading vs. synthesis decisions
- Added Table of Contents to development roadmap for improved navigation

## [Unreleased]

### Planned
- Multiple CDN fallback system
- Browser caching for samples
- User preferences for sample management 