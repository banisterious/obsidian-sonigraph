# Changelog

All notable changes to the Obsidian Sonigraph Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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