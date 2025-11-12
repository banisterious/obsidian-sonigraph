# Sonigraph Feature List

Complete feature documentation for the Sonigraph plugin.

## Core Sonification

### Graph-to-Music Mapping
- Convert note connections into orchestral compositions
- Intelligent musical mapping algorithms translate graph structure to musical elements
- Real-time audio synthesis using Tone.js Web Audio API
- 34-instrument orchestral palette

### Musical Mapping System
- **Nodes → Instruments**: Map vault notes to orchestral instruments based on content analysis
- **Connections → Harmony**: Link relationships create harmonic progressions and chord structures
- **Graph Traversal → Composition**: Different algorithms generate musical sequences through connected notes
- **Node Properties → Articulation**: Tags, metadata, and content influence playing style and dynamics

## Continuous Audio Layers (v0.12.0)

### Layer System
- **Ambient Layer**: Genre-based continuous background soundscapes that evolve with vault state
- **Rhythmic Layer**: Activity-responsive percussion patterns that sync with vault interactions
- **Harmonic Pad Layer**: Cluster-based harmony generation with chord progressions and musical theory

### Musical Genres (13 Total)
Ambient Drone, Cinematic Orchestral, Jazz Lounge, Electronic Pulse, Nature Soundscape, Industrial Minimal, Neo-Classical, World Fusion, Retro Synthwave, Lo-Fi Hip Hop, Experimental Glitch, Post-Rock Ambient, Chillwave Dream Pop

### Freesound.org Integration
- Curated high-quality audio samples with token-based API authentication
- Sample Management System with intelligent caching, preloading, and offline mode support
- Professional Sample Library with 114+ curated samples
- Complete metadata and license information (CC0, CC-BY, CC-BY-NC)

## Content-Aware Mapping

### Intelligent Assignment
- **File Type Intelligence**: Automatic instrument assignment based on note types (markdown, images, PDFs, audio, video)
- **Tag-Based Semantics**: Musical mood and instrument selection driven by vault tags
- **Folder Hierarchy Mapping**: Folder structure influences orchestral arrangement and grouping
- **Frontmatter Support**: Explicit instrument and mood control via note metadata
- **Connection Type Audio**: Different link types (wikilinks, embeds, tags) produce distinct musical elements

### Distribution Strategies
- Frequency-based assignment distributes instruments across pitch ranges
- Dynamic voice allocation based on graph complexity and content type
- Temporal mapping where connection strength influences note duration and rhythmic patterns
- Spatial audio with graph layout translating to stereo positioning and reverb

## Orchestral Instruments (34 Total)

### Keyboard Family (6)
Piano, Organ, Electric Piano, Harpsichord, Accordion, Celesta

### String Family (6)
Violin, Cello, Guitar, Harp, Strings (full section), Contrabass

### Woodwind Family (5)
Flute, Clarinet, Saxophone, Oboe, Bassoon

### Brass Family (4)
Trumpet, French Horn, Trombone, Tuba

### Vocal Family (7)
Soprano, Alto, Tenor, Bass, Choir, Vocal Pads, Pad (ambient synthesis)

### Percussion Family (4)
Timpani (physics-modeled), Xylophone, Vibraphone, Gongs, plus Rhythmic Percussion (kick, snare, hi-hat)

### Electronic Family (3)
Lead Synth (filter-swept with modulation), Bass Synth (sub-oscillator with envelope), Arp Synth (arpeggiated patterns)

## Audio Engine & Effects

### Advanced Synthesis
- **Sample-Based Orchestral**: High-quality samples with realistic articulation
- **Advanced Percussion**: Physics-modeled timpani, mallet instruments, resonant gongs
- **Electronic Suite**: Professional filter modulation, LFO control, envelope shaping

### Master Effects Processing
- **Orchestral Reverb Hall**: Simulated concert hall acoustics with adjustable decay
- **3-Band EQ**: Bass boost, mid-range clarity, treble enhancement
- **Dynamic Compressor**: Automatic level control for orchestral balance

### Per-Instrument Effects
- Individual reverb, chorus, and filter processing for each of 34 instruments
- 11 Professional Presets (Concert Hall, Jazz Club, Cathedral, Studio Dry, etc.)
- Smart parameter ranges that adapt to musical content
- Enhanced signal flow with send/return busses and parallel processing

## Performance Optimization

- **Adaptive Quality System**: Automatically adjusts audio quality based on CPU load
- **Voice Pooling**: Efficient voice management for complex orchestral arrangements
- **Emergency Performance Mode**: Fallback mode for resource-constrained systems
- **CPU Monitoring**: Real-time performance tracking

## Sonic Graph Visualization

### Performance Features
- **Instant Loading**: Optimized data processing using Obsidian's MetadataCache infrastructure
- **Static Graph View**: D3.js force simulation displaying all vault files and connections
- **Timeline Animation Mode**: Audio-synchronized chronological node appearance

### Timeline Controls
- **Multi-Level Granularity**: Year, Month, Week, Day, Hour, Custom ranges
- **Time Window Filtering**: All time, Past year, Past month, Custom period
- **Smart Event Spreading**: Intelligent audio event distribution prevents crackling from simultaneous triggers
- **Timeline Markers**: MM:SS format time labels for navigation

### Interface
- Professional settings panel with 21+ configuration options
- Advanced filtering with native Obsidian autocomplete
- Content exclusion system for folders and files
- Full-screen overlay with smooth transitions

## Visual Note Display (v0.15.0)

### Piano Roll Visualization
- Timeline-based scrolling display with real-time note tracking
- Moving playhead sweeps across fixed note positions (video-editor style)
- MIDI pitch mapping (C0 to C6+) with dynamic labels
- Layer color coding for rhythmic, harmonic, melodic, ambient, and percussion
- Live note highlighting with brightness increase during playback
- Adaptive grid system with octave lines and time markers

### Spectrum Analyzer
- Real-time frequency visualization of audio output
- 64 frequency bars with logarithmic spacing
- Web Audio AnalyserNode connection to Tone.js master output
- Color gradient from red (low frequencies) to blue (high frequencies)
- 60fps smooth animation

### Staff Notation
- Traditional musical staff with treble and bass clefs
- Automatic MIDI pitch to staff line position mapping
- Note heads with stems for quarter notes
- Middle C reference point between clefs
- Layer color coding matching other visualization modes

### Integration
- Resizable split view with adjustable panel height
- Instant tab switching between Piano Roll, Spectrum, and Staff
- Timeline synchronization across all visualizations
- Graph node highlighting pulses when notes play
- Collapsible panel to maximize graph viewing area

## Audio Export (v0.12.2)

### Export Formats
- **Lossless**: WAV (uncompressed audio)
- **Compressed**: M4A/AAC, WebM/Opus, OGG/Vorbis

### Quality Options
- High Quality preset (256-320 kbps)
- Standard preset (192 kbps)
- Small Size preset (128 kbps)
- Custom bitrate configuration

### Features
- Custom time range selection for partial exports
- Metadata support (title, artist, album, year, genre, comments)
- Export presets for saving configurations
- Automatic documentation generation (markdown notes with all settings)
- Real-time progress tracking with cancellation support
- Intelligent file collision handling
- Automatic vault organization

## Local Soundscape (v0.17.0)

### Context-Aware Exploration
- **Depth-Based Visualization**: Radial layout showing connections at multiple depths (0-3)
- **Force-Directed Layout**: Physics-based graph arrangement with collision detection
- **Smart Clustering**: Automatic grouping by folder, tag, depth, or community detection
- **Rich Filtering**: Include/exclude by tags, folders, file types, link directions
- **Musical Variation System**: Re-roll feature for exploring different sonic interpretations

### Context-Aware Modifiers
Environmental influences on audio playback:

**Season-Based:**
- Spring (bright, +2 semitones)
- Summer (energetic, +3 semitones)
- Fall (mellow, -2 semitones)
- Winter (cold, -4 semitones)

**Time-Based:**
- Dawn (+1 semitone)
- Day (neutral)
- Dusk (-1 semitone)
- Night (-2 semitones, ambient with heavy reverb)

**Weather Modifiers:**
- Clear (bright timbre)
- Cloudy (muted)
- Rain (rhythmic patterns)
- Storm (dramatic intensity)
- Snow (crystalline textures)

**Theme Integration:**
- Light mode (+2 semitones, bright timbres)
- Dark mode (-2 semitones, warm tones)

### Configuration
- Configurable modes: 'Influenced' (blend with note properties) or 'Only' (pure environmental)
- Adjustable influence weight (0-100%)
- Individual factor toggles for granular control
- Auto-play system (on open or focus change)
- Musical key selection (6 modes: vault name, root folder, folder path, full path, file name, custom)

### Advanced Features
- Depth-based audio mapping using node properties and graph structure
- Real-time settings panel with instant updates
- Graph highlighting showing currently playing nodes
- Seamless integration with Sonic Graph view

## Note-Centric Musicality (v0.17.1)

### Preset System
Three configurable presets for prose-based musical generation:
- **Classical**: Traditional voice leading and harmonic structure
- **Jazz**: Complex harmonies with syncopation
- **Experimental**: Avant-garde approaches

### Parameters
- **Timing Humanization**: Add natural variation to note timing (0-100%)
- **Harmonic Adventurousness**: Control chord complexity and dissonance (0-100%)
- **Dynamic Range**: Quiet, Balanced, or Dramatic volume curves
- **Polyphonic Density**: Sparse, Moderate, or Dense note layering
- **Melodic Independence**: Voice leading style (0-100%)
- **Voice Leading Style**: Parallel, Oblique, or Contrary motion

---

For detailed usage instructions, see the [user guide](user/README.md).
