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

## [Unreleased]

### Added
- **Structured Logging System**: Global log level filtering with options: Off, Errors Only, Warnings, Info, Debug (default: Warnings)
- **Log Export Feature**: Export all plugin logs as timestamped JSON files (`osp-logs-YYYYMMDD-HHMMSS.json`)
- **Audio Format Selection**: Choose between MP3 (smaller size, recommended) and WAV (higher quality) for sampled instruments
- **Onboarding Section**: Dismissible welcome message in Settings with quick access to Control Center
- **Volume Control in Control Center**: Moved volume slider from Settings to Control Center header for better accessibility

### Changed
- **Settings UI Streamlined**: Removed duplicate controls (tempo, volume, musical scale, root note) that are available in Control Center
- **Consistent Naming**: Renamed "Control Panel" to "Control Center" throughout the interface
- **Sentence Case Labels**: All settings labels now use sentence case for better readability
- **Cleaner Settings Layout**: Removed redundant "Sonigraph Settings" header and improved visual hierarchy

### Improved
- **User Experience**: Better separation of concerns between Settings (configuration) and Control Center (real-time controls)
- **Visual Design**: Added bordered styling to onboarding section for better visual distinction
- **Code Architecture**: Made audio engine methods public where needed for UI integration
- **Developer Experience**: Enhanced logging system with structured output and export capabilities

### Technical
- Exported `LoggerFactory` class for direct access to static log level methods
- Made `AudioEngine.updateVolume()` method public for UI integration
- Added log collection functionality to support export feature
- Enhanced audio format handling with dynamic placeholder replacement 