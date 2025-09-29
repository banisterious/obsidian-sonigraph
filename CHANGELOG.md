# Changelog

All notable changes to the Obsidian Sonigraph Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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