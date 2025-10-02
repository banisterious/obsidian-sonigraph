# Audio Export Feature

**Status**: ✅ Complete (Phase 1 & 2)
**Version**: 0.12.1
**Branch**: `feature/export-audio-video`

## Overview

The audio export feature allows users to export their Sonic Graph timeline animations as audio files with comprehensive configuration options and automatic documentation.

## Features Implemented

### Phase 1: Core Audio Export ✅

- **WAV Export**: Lossless audio export with configurable quality settings
  - Sample rates: 44.1kHz, 48kHz, 96kHz
  - Bit depths: 16-bit, 24-bit

- **Real-time Rendering**: Captures actual audio output from Tone.js
  - Uses MediaRecorder API for accurate reproduction
  - Progress feedback during export process

- **Export Progress Modal**: Real-time status updates
  - Progress bar with percentage
  - Stage indicators (validating, rendering, encoding, writing)
  - Cancellation support

- **File Collision Handling**: Three resolution strategies
  - Cancel: Abort export if file exists
  - Overwrite: Replace existing file
  - Rename: Prompt for new filename

- **Export Notes**: Automatic markdown documentation
  - Export timestamp and duration
  - Audio settings (format, quality, sample rate, bit depth)
  - Active instruments and effects
  - Comprehensive Sonic Graph settings
  - File location and size

### Phase 2: Advanced Features ✅

- **Compressed Audio Export**: Native codec support
  - M4A/AAC: Best quality, wide compatibility
  - WebM/Opus: Good quality, smaller files
  - OGG/Vorbis: Fallback option
  - Automatic codec selection based on platform
  - Bitrate options: 128, 192, 256, 320 kbps
  - Progress feedback during encoding

- **Custom Time Range Selection**: Export specific portions
  - Flexible input formats (seconds or MM:SS)
  - Automatic validation (start < end, within timeline)
  - Real-time duration and size estimation

- **Metadata Editing**: Add descriptive information
  - Title, Artist, Album, Year, Genre, Comment
  - Saved in export notes (browser MediaRecorder limitation)
  - Remembers last used metadata for convenience

- **Export Presets**: Quick configuration options
  - Three default presets (High Quality WAV, Compressed Audio, Lossless)
  - Save custom presets with format, quality, and metadata
  - One-click loading of saved presets

- **Polished Card-Based UI**: Modern interface design
  - Visual cards for each settings group
  - Collapsible metadata section
  - Hover effects and visual feedback
  - Estimated file size and render time with icons

### Export Configuration Options

**Quick Presets**
- High Quality WAV (48kHz, 16-bit)
- Compressed Audio (M4A/WebM, 192kbps)
- Lossless (48kHz, 24-bit WAV)
- Save Current as Preset

**What to Export**
- Full Timeline Animation
- Custom Time Range (with start/end inputs)
- Current Static Graph (planned)

**Format & Quality**
- WAV: Lossless audio with bitDepth/sampleRate options
- Compressed Audio: Native codec (M4A/WebM/OGG) with bitrate options

**Save Location**
- Vault Folder: Save to a folder in your vault
- System Location: Save to any location on disk (planned)

**Filename Options**
- Custom filename (without extension)
- Create export note toggle
- Include full settings in note toggle
- Max export duration safety limit

**Metadata (Optional)**
- Title, Artist, Album, Year, Genre, Comment
- Collapsible section
- Saved for next export

## Technical Architecture

### Key Components

1. **AudioExporter** (`src/export/AudioExporter.ts`)
   - Orchestrates the export process
   - Handles validation, rendering, encoding, file writing
   - Provides progress callbacks
   - Supports cancellation

2. **OfflineRenderer** (`src/export/OfflineRenderer.ts`)
   - Captures audio from Tone.js master volume
   - Real-time MediaRecorder-based rendering
   - Timeline animation synchronization
   - Cancellation support

3. **WavEncoder** (`src/export/WavEncoder.ts`)
   - Converts AudioBuffer to WAV format
   - Handles sample rate and bit depth conversion
   - Generates proper WAV headers

4. **Mp3Encoder** (`src/export/Mp3Encoder.ts`)
   - Uses MediaRecorder with native platform codecs
   - Automatic codec selection (M4A/AAC, WebM/Opus, OGG/Vorbis)
   - Configurable bitrate
   - Progress feedback

5. **ExportModal** (`src/export/ExportModal.ts`)
   - User interface for export configuration
   - Card-based layout with collapsible sections
   - Preset management
   - Real-time file size/duration estimates

6. **ExportProgressModal** (`src/export/ExportProgressModal.ts`)
   - Shows export progress in real-time
   - Stage-based progress tracking
   - Cancellation button
   - Success/error notifications

7. **ExportNoteCreator** (`src/export/ExportNoteCreator.ts`)
   - Generates comprehensive markdown documentation
   - Includes all settings and metadata
   - Timeline information
   - Export statistics

8. **FileCollisionModal** (`src/export/FileCollisionModal.ts`)
   - Handles file naming conflicts
   - Three resolution strategies
   - Rename with preview

### Export Flow

```
User clicks Export button
    ↓
ExportModal opens
    ↓
User configures settings (format, quality, scope, etc.)
    ↓
User clicks Export
    ↓
AudioExporter.export() called
    ↓
1. Validation
   - Check audio engine initialized
   - Check animator available (for timeline exports)
   - Validate time range
   - Check duration limit
    ↓
2. Check for file collision
   - Open FileCollisionModal if file exists
   - Get user resolution (cancel/overwrite/rename)
    ↓
3. Open ExportProgressModal
    ↓
4. Render audio (OfflineRenderer)
   - Play timeline animation
   - Capture audio via MediaRecorder
   - Update progress (10-60%)
    ↓
5. Encode audio
   - WAV: WavEncoder (instant)
   - Compressed: Mp3Encoder with progress (60-90%)
    ↓
6. Write file (90-95%)
   - Save to vault or system location
    ↓
7. Create export note (95-100%)
   - Generate markdown documentation
   - Save alongside audio file
    ↓
Export complete!
```

## Known Limitations

1. **Metadata Tags**: Browser MediaRecorder API doesn't support writing ID3 tags or metadata directly to audio files. Metadata is saved in export notes instead.

2. **MP3 Format**: Native MediaRecorder produces M4A/WebM/OGG rather than true MP3. These formats provide better quality-to-size ratios than MP3 anyway.

3. **Real-time Rendering**: Export speed is tied to playback speed. A 60-second export takes approximately 60 seconds to render. Offline (faster-than-realtime) rendering would require complete audio engine refactoring.

4. **System Location Export**: Currently only supports vault folder exports. System location export requires additional Electron filesystem integration.

## Future Enhancements (Phase 3)

### Video Export (Separate Branch)
- Canvas/WebGL frame capture
- Video encoding with audio track
- WebCodecs API integration
- Much larger undertaking than audio-only

### Additional Audio Formats
- FLAC: Lossless compressed format
- OGG Vorbis: Direct OGG encoding (if needed)

### Enhanced Features
- Batch export multiple configurations
- Export queue management
- Cloud storage integration
- Audio post-processing effects

## Usage Examples

### Basic WAV Export

1. Click the Export button in Timeline View
2. Select "High Quality WAV" preset
3. Choose export scope (full timeline or custom range)
4. Click Export
5. Find your audio file and export note in "Sonigraph Exports" folder

### Custom Compressed Audio Export

1. Open export modal
2. Select "Compressed Audio (M4A/WebM/OGG)" format
3. Choose quality preset (High, Standard, or Small)
4. Set custom time range (e.g., 10s to 45s)
5. Expand Metadata section and add title/artist
6. Toggle "Create export note" if desired
7. Click Export

### Saving a Preset

1. Configure your preferred settings (format, quality, metadata)
2. Click "💾 Save Current as Preset"
3. Enter a name (e.g., "My Podcast Settings")
4. Preset will appear in Quick Presets section for future exports

## Testing

Comprehensive testing is available via the Test Suite Modal:
- Phase 1 & 2 export functionality tests
- File collision handling tests
- Progress feedback validation
- Export note generation tests

See `src/testing/TestSuiteModal.ts` for test configuration.

## Changelog

**v0.12.1** - Export Feature Complete (2025-10-02)
- ✅ Phase 1: Core audio export with WAV format
- ✅ Phase 2: Compressed audio, metadata, presets, custom time ranges
- ✅ Polished card-based UI with proper CSS prefixing
- ✅ Comprehensive export notes with all settings
- ✅ Progress feedback for all export stages
- ✅ File collision handling
- ✅ Export cancellation support

## Files Modified/Created

**New Files**:
- `src/export/AudioExporter.ts`
- `src/export/OfflineRenderer.ts`
- `src/export/WavEncoder.ts`
- `src/export/Mp3Encoder.ts`
- `src/export/ExportModal.ts`
- `src/export/ExportProgressModal.ts`
- `src/export/FileCollisionModal.ts`
- `src/export/ExportNoteCreator.ts`
- `src/export/types.ts`
- `styles/export.css`

**Modified Files**:
- `src/ui/SonicGraphView.ts` - Added export button and modal integration
- `src/audio/engine.ts` - Added getMasterVolume() for export access
- `src/settings/constants.ts` - Added export settings structure
- Various type definitions and settings interfaces

---

**Documentation Version**: 1.0
**Last Updated**: 2025-10-02
