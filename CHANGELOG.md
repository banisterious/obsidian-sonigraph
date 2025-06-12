# Changelog

All notable changes to the Obsidian Sonigraph Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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