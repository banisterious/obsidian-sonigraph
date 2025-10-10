## Export Feature - Implementation Plan

- **Document Version:** 2.0
- **Date:** October 2, 2025
- **Status:** Phase 1 & 2 Complete ✅ — Phase 3 (Video) Pending
- **Based On:** export-feature-specification.md
- **Implemented Version:** v0.12.2

---

## ✅ FINALIZED DECISIONS SUMMARY

All implementation decisions have been made and approved by the user:

| Decision Area | User Choice |
|--------------|-------------|
| **File Organization** | Hybrid approach (Option 4) - Group related exports in dated folders |
| **Export Button Priority** | Timeline controls = PRIMARY (CTA style), others = secondary |
| **Settings Location** | Both plugin settings AND modal (remember last used settings) |
| **Phase 1 Scope** | Approved - 2-3 weeks for basic WAV export |
| **Export Naming Template** | `sonigraph-YYYY-MM-DD-HHmmss.wav` (approved) |
| **File Collision Default** | Cancel export (prompt user for action) |
| **Progress Modal Style** | Either/both depending on export length |

**Implementation Status:** Phase 1 & 2 complete and merged into main branch (v0.12.2). Phase 3 (video export) remains for future implementation on a separate branch.

---

## ✅ IMPLEMENTATION STATUS (v0.12.2)

### Phase 1: Foundation — ✅ COMPLETE
- ✅ Export Modal with card-based UI
- ✅ Core Export Pipeline (AudioExporter, OfflineRenderer, WavEncoder)
- ✅ Timeline Animation Export with temporal animator integration
- ✅ Progress & Cancellation with real-time feedback
- ✅ UI Integration (timeline controls export button)
- ✅ File collision handling (cancel/overwrite/rename)

### Phase 2: Enhanced Audio — ✅ COMPLETE
- ✅ Compressed audio formats (M4A/AAC, WebM/Opus, OGG/Vorbis via MediaRecorder)
- ✅ Custom time range selection (MM:SS or seconds format)
- ✅ Metadata support (title, artist, album, year, genre, comment)
- ✅ Export presets (quick presets + save custom)
- ✅ Vault integration (automatic export notes with comprehensive settings)
- ✅ Polished UI with proper CSS prefixing (`sonigraph-*`)

### Phase 2: Intentionally Skipped
- ⏭️ Additional UI locations (Control Center, context menu) — deemed unnecessary for UX
- ⏭️ Instrument selection checkboxes — redundant with Control Center
- ⏭️ Separate OGG/FLAC encoders — MediaRecorder provides native codec selection

### Phase 3: Video Export — ⏸️ NOT STARTED
- ❌ Canvas capture
- ❌ Video encoding (MP4/WebM)
- ❌ Audio + video synchronization
- ❌ Video-specific settings tab

---

## Overview

This document provides the approved implementation plan for the Sonigraph export feature based on user decisions. The feature was built in progressive phases, with Phase 1 & 2 now complete (v0.12.2). Phase 3 (video export) will be implemented on a separate branch in the future.

---

## User Requirements Summary

### Confirmed Decisions

**When can users export?**
- ✅ Anytime (pre-render entire animation)
- ✅ Does not require active playback

**Export button locations:**
- ✅ Timeline controls (primary) — **IMPLEMENTED**
- ⏭️ Control Center (settings/advanced) — **SKIPPED** (unnecessary)
- ⏭️ Sonic Graph header — **SKIPPED** (unnecessary)
- ⏭️ Context menu (right-click on graph) — **SKIPPED** (unnecessary)

**Export scope:**
- ✅ Full timeline animation — **IMPLEMENTED**
- ✅ Custom time range (user selects start/end) — **IMPLEMENTED**
- ⏭️ Static graph state (all nodes at once) — **DEFERRED** (Phase 3)
- ⏭️ Selected nodes only — **DEFERRED** (future)

**Audio content:**
- ⏭️ Selected instruments only (user can choose which) — **SKIPPED** (redundant with Control Center)
- ✅ Continuous layers included — **IMPLEMENTED**
- ✅ Master volume/effects applied — **IMPLEMENTED**
- ✅ Spatial audio panning preserved — **IMPLEMENTED**

**Visual content (video):**
- ❌ Graph visualization — **DEFERRED** (Phase 3)
- ❌ Timeline scrubber visible — **DEFERRED** (Phase 3)
- ❌ Optional UI overlay — **DEFERRED** (future)

**Formats:**
- ✅ Audio: WAV (lossless) — **IMPLEMENTED**
- ✅ Audio: M4A/AAC, WebM/Opus, OGG/Vorbis (compressed) — **IMPLEMENTED** (via MediaRecorder)
- ❌ Video: MP4, WebM — **DEFERRED** (Phase 3)

**Quality:**
- ✅ WAV: Sample rates (44.1/48/96 kHz), Bit depths (16/24-bit) — **IMPLEMENTED**
- ✅ Compressed: Bitrates (128/192/320 kbps) — **IMPLEMENTED**
- ✅ Quality presets: High Quality, Standard, Small Size — **IMPLEMENTED**
- ❌ Video: 720p, 1080p, 1440p, 4K @ 30/60fps — **DEFERRED** (Phase 3)

**File handling:**
- ✅ Vault folder location — **IMPLEMENTED**
- ⏭️ System location picker — **DEFERRED** (requires Electron fs integration)
- ✅ Auto-generated filename with user edit before export — **IMPLEMENTED**
- ✅ Prompt on overwrite (cancel/overwrite/rename) — **IMPLEMENTED**

**User experience:**
- ✅ Full export dialog with card-based UI — **IMPLEMENTED**
- ✅ User sets max duration limit per export — **IMPLEMENTED**
- ✅ Cancel option during export — **IMPLEMENTED**
- ✅ Comprehensive progress indication with stages — **IMPLEMENTED**
- ✅ Real-time file size and render time estimates — **IMPLEMENTED**

**Integration:**
- ✅ Auto-create export notes with comprehensive settings — **IMPLEMENTED**
- ✅ Remember metadata across sessions — **IMPLEMENTED**
- ✅ Export presets (save/load custom configurations) — **IMPLEMENTED**
- ✅ Settings in export modal — **IMPLEMENTED**

---

## Implementation Phases

### Phase 1: Foundation — ✅ COMPLETE (v0.12.2)

**Goal:** Basic working export with WAV format and essential features

**Status:** ✅ All features implemented and merged into main branch

#### Features
1. **Export Modal**
   - Basic UI with format selection
   - Filename input (auto-generated, editable)
   - Location picker (vault folder or browse)
   - Simple quality presets
   - Export/Cancel buttons

2. **Core Export Pipeline**
   - `AudioExporter` class
   - `OfflineRenderer` for timeline pre-rendering
   - `WavEncoder` for PCM encoding
   - File writer with Obsidian vault API

3. **Timeline Animation Export**
   - Full animation export
   - Offline rendering (faster than real-time)
   - Selected instruments support

4. **Progress & Cancellation** ✅ **ADAPTIVE STYLE**
   - Progress modal with percentage
   - Cancel button (cleanup partial files)
   - Basic error handling
   - Style adapts to export length (simple for short, detailed for long)

5. **UI Integration** ✅ **PRIMARY IN TIMELINE**
   - Export button in timeline controls (PRIMARY - larger, CTA styling)
   - Export button in Sonic Graph header (secondary - smaller, outlined)

#### Deliverables
- Working WAV export
- Export modal UI (basic version)
- Progress indication
- File collision handling (prompt to overwrite)
- Basic error messages

#### Technical Components
```typescript
// New files
src/export/AudioExporter.ts
src/export/OfflineRenderer.ts
src/export/WavEncoder.ts
src/export/ExportModal.ts
src/export/ExportProgress.ts
src/export/types.ts

// Modified files
src/ui/SonicGraphView.ts - Add export button
src/utils/constants.ts - Add export settings
```

---

### Phase 2: Enhanced Audio — ✅ COMPLETE (v0.12.2)

**Goal:** Multiple audio formats, advanced options, metadata

**Status:** ✅ All core features implemented (some features intentionally skipped based on user feedback)

#### Features (Implementation Status)

1. **Additional Audio Formats** — ✅ IMPLEMENTED (via MediaRecorder)
   - ✅ Compressed audio (M4A/AAC, WebM/Opus, OGG/Vorbis) using native browser codecs
   - ⏭️ MP3 support (lamejs) — replaced with MediaRecorder approach
   - ⏭️ OGG/FLAC separate encoders — MediaRecorder handles codec selection

2. **Advanced Export Options** — ✅ PARTIALLY IMPLEMENTED
   - ✅ Custom time range selection (MM:SS or seconds format)
   - ✅ Quality settings (sample rate, bit depth, bitrate)
   - ⏭️ Instrument selection checkboxes — SKIPPED (redundant with Control Center)
   - ⏭️ Effects on/off toggle — SKIPPED (redundant with Control Center)
   - ⏭️ Rendering method choice — SKIPPED (offline rendering only)

3. **Metadata Support** — ✅ IMPLEMENTED
   - ✅ User-editable metadata fields (title, artist, album, year, genre, comment)
   - ✅ Metadata saved in export notes (browser limitation prevents writing to audio files)
   - ✅ Remember metadata across sessions

4. **Export Presets** — ✅ IMPLEMENTED
   - ✅ Quick presets: "High Quality WAV", "Standard MP3", "Small Size"
   - ✅ Save custom presets with name prompt
   - ✅ Preset management UI

5. **Vault Integration** — ✅ IMPLEMENTED
   - ✅ Auto-create export notes with comprehensive settings
   - ✅ Include full settings summary in note (human-readable markdown format)
   - ⏭️ Add to daily note — DEFERRED (future enhancement)

6. **Additional UI Locations** — ⏭️ SKIPPED
   - ⏭️ Export option in Control Center — SKIPPED (unnecessary for UX)
   - ⏭️ Right-click context menu — SKIPPED (unnecessary for UX)

#### Deliverables — ✅ COMPLETE
- ✅ Compressed audio export (M4A/AAC, WebM/Opus, OGG/Vorbis)
- ✅ Full quality control UI with presets
- ✅ Metadata editing with session persistence
- ✅ Export presets (quick + custom)
- ✅ Vault note creation with comprehensive settings
- ⏭️ Export history log — DEFERRED (future enhancement)

#### Technical Components — ✅ IMPLEMENTED
```typescript
// New files (all implemented)
✅ src/export/Mp3Encoder.ts (uses MediaRecorder, not lamejs)
✅ src/export/ExportNoteCreator.ts (was NoteCreator.ts)
⏭️ src/export/OggEncoder.ts — SKIPPED (MediaRecorder handles)
⏭️ src/export/FlacEncoder.ts — SKIPPED (MediaRecorder handles)
⏭️ src/export/ExportPresets.ts — SKIPPED (presets managed in ExportModal)
⏭️ src/export/ExportHistory.ts — DEFERRED (future enhancement)

// Modified files
✅ src/export/ExportModal.ts - Card-based UI, presets, metadata, all features
✅ src/export/types.ts - Added ExportPreset interface
⏭️ src/ui/control-panel.ts - SKIPPED (no additional UI locations)
```

---

### Phase 3: Video Export — ⏸️ NOT STARTED

**Goal:** Video export with graph visualization

**Status:** ❌ Deferred to separate branch for future implementation

#### Features
1. **Canvas Capture**
   - Capture graph visualization frames
   - Configurable frame rate (30/60 fps)
   - Resolution selection

2. **Video Encoding**
   - MP4 support (H.264)
   - WebM support
   - Audio + video synchronization

3. **Video Options**
   - Timeline scrubber visibility toggle
   - Graph zoom/pan during export
   - Optional title overlay

4. **Enhanced Export Modal**
   - Video-specific settings tab
   - Preview thumbnail
   - Estimated file size

#### Deliverables
- MP4 video export
- WebM video export
- Synchronized audio + video
- Video quality settings

#### Technical Components
```typescript
// New files
src/export/VideoExporter.ts
src/export/CanvasRecorder.ts
src/export/VideoEncoder.ts
src/export/FrameCapture.ts

// Modified files
src/export/ExportModal.ts - Add video tab
src/graph/GraphRenderer.ts - Add frame capture hooks
```

---

## Export Modal Design (Progressive Disclosure)

### Basic View (Phase 1)

```
┌──────────────────────────────────────────────────┐
│ Export Sonic Graph                           [×] │
├──────────────────────────────────────────────────┤
│                                                  │
│ What to export                                   │
│ ○ Full Timeline Animation (60 seconds)          │
│ ○ Custom Time Range: [__:__] to [__:__]        │
│ ○ Current Static Graph                          │
│                                                  │
│ ────────────────────────────────────────────────│
│                                                  │
│ Format                                           │
│ [▼ WAV (Lossless Audio)]                        │
│                                                  │
│ Quality Preset                                   │
│ [▼ High Quality (48kHz, 16-bit)]                │
│                                                  │
│ ────────────────────────────────────────────────│
│                                                  │
│ Save Location                                    │
│ ○ Vault Folder: [Sonigraph Exports/  ▼]        │
│ ● System Location: [~/Documents/        Browse] │
│                                                  │
│ Filename                                         │
│ [sonigraph-2025-01-15-142030           ] .wav   │
│                                                  │
│ ☐ Remember these settings                       │
│                                                  │
│ ╔═══════════════════════════════════════════╗  │
│ ║ Estimated size: 11.5 MB                   ║  │
│ ║ Estimated time: ~8 seconds                ║  │
│ ╚═══════════════════════════════════════════╝  │
│                                                  │
│           [Advanced Options ▼]                   │
│                                                  │
│                    [Cancel]  [Export]            │
└──────────────────────────────────────────────────┘
```

### Advanced View (Phase 2 - Expanded)

```
┌──────────────────────────────────────────────────┐
│ Export Sonic Graph                           [×] │
├──────────────────────────────────────────────────┤
│                                                  │
│ What to export                                   │
│ ● Full Timeline Animation (60 seconds)          │
│ ○ Custom Time Range: [00:10] to [00:45]        │
│ ○ Current Static Graph                          │
│                                                  │
│ ────────────────────────────────────────────────│
│                                                  │
│ Format                                           │
│ [▼ MP3 (Compressed Audio)]                      │
│   ├─ WAV (Lossless)                             │
│   ├─ MP3 (Compressed) ✓                         │
│   ├─ OGG Vorbis                                 │
│   └─ FLAC (Lossless Compressed)                 │
│                                                  │
│ Quality Settings                                 │
│ Sample Rate:  [▼ 48 kHz]                        │
│ Bit Rate:     [▼ 192 kbps]                      │
│                                                  │
│ ☐ Use preset: [▼ High Quality]  [Save Preset]  │
│                                                  │
│ ────────────────────────────────────────────────│
│                                                  │
│           [Advanced Options ▲]                   │
│                                                  │
│ ┌─ Audio Content ────────────────────────────┐ │
│ │ Instruments (Select which to include):     │ │
│ │ ☑ Piano          ☑ Strings      ☑ Synths  │ │
│ │ ☑ Flute          ☐ Whale Sounds ☑ Guitar  │ │
│ │                                             │ │
│ │ ☑ Include continuous ambient layers        │ │
│ │ ☑ Apply master volume (0.7)                │ │
│ │ ☑ Apply effects (reverb, chorus)           │ │
│ │ ☑ Preserve spatial audio panning            │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Rendering ─────────────────────────────────┐ │
│ │ Method: ● Offline (faster) ○ Real-time     │ │
│ │                                             │ │
│ │ Maximum Duration: [10] minutes              │ │
│ │ ☑ Warn if export exceeds this limit        │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Metadata ──────────────────────────────────┐ │
│ │ Title:   [Vault Timeline - Past Year]      │ │
│ │ Artist:  [Sonigraph]                        │ │
│ │ Album:   [My Obsidian Vault]               │ │
│ │ Comment: [Generated with gentle spreading] │ │
│ │                                             │ │
│ │ ☑ Remember metadata for future exports     │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Vault Integration ─────────────────────────┐ │
│ │ ☑ Create note linking to this export       │ │
│ │ Location: [Sonigraph Exports/   ▼]         │ │
│ │                                             │ │
│ │ ☐ Add link to today's daily note           │ │
│ │ ☑ Include settings summary in note          │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ────────────────────────────────────────────────│
│                                                  │
│ Save Location                                    │
│ ○ Vault Folder: [Sonigraph Exports/  ▼]        │
│ ● System Location: [~/Music/sonigraph/  Browse] │
│                                                  │
│ Filename                                         │
│ [vault-past-year-gentle                ] .mp3   │
│                                                  │
│ ☑ Remember these settings                       │
│                                                  │
│ ╔═══════════════════════════════════════════╗  │
│ ║ Estimated size: 1.4 MB (192 kbps)        ║  │
│ ║ Estimated time: ~6 seconds (offline)     ║  │
│ ╚═══════════════════════════════════════════╝  │
│                                                  │
│                    [Cancel]  [Export]            │
└──────────────────────────────────────────────────┘
```

### Video Export Tab (Phase 3)

```
┌──────────────────────────────────────────────────┐
│ Export Sonic Graph                           [×] │
├──────────────────────────────────────────────────┤
│                                                  │
│ [Audio] [Video]                                  │
│                                                  │
│ Format                                           │
│ [▼ MP4 (H.264)]                                 │
│   ├─ MP4 (H.264) ✓                              │
│   └─ WebM (VP9)                                 │
│                                                  │
│ Video Quality                                    │
│ Resolution: [▼ 1920x1080 (1080p)]              │
│ Frame Rate: [▼ 30 fps]                          │
│ Bit Rate:   [▼ 8000 kbps (High Quality)]       │
│                                                  │
│ Audio Quality                                    │
│ Format:     [▼ AAC 256 kbps]                    │
│                                                  │
│ ┌─ Video Content ─────────────────────────────┐ │
│ │ ☑ Include graph visualization               │ │
│ │ ☑ Show timeline scrubber                    │ │
│ │ ☐ Show settings panel                       │ │
│ │                                             │ │
│ │ Title Overlay (optional):                   │ │
│ │ [My Vault - Timeline Animation____]         │ │
│ │                                             │ │
│ │ Graph Behavior:                             │ │
│ │ ● Follow animation (default view)           │ │
│ │ ○ Zoom to specific area: [Set...]          │ │
│ │ ○ Slow pan across entire graph              │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ╔═══════════════════════════════════════════╗  │
│ ║ Estimated size: 45 MB                     ║  │
│ ║ Estimated time: ~15 seconds               ║  │
│ ╚═══════════════════════════════════════════╝  │
│                                                  │
│                    [Cancel]  [Export]            │
└──────────────────────────────────────────────────┘
```

---

## File Organization Clarification

You mentioned you weren't sure about file organization. Here are the options:

### Option 1: Flat Structure (Simplest)
```
Sonigraph Exports/
  sonigraph-2025-01-15-142030.wav
  sonigraph-2025-01-15-142030.json
  sonigraph-2025-01-15-150245.mp3
  sonigraph-2025-01-15-150245.json
  vault-timeline-past-year.wav
  ...
```
**Pros:** Simple, all files in one place
**Cons:** Gets messy with many exports

### Option 2: Date-Based Organization
```
Sonigraph Exports/
  2025/
    01/
      15/
        timeline-142030.wav
        timeline-142030.json
        timeline-150245.mp3
    02/
      ...
```
**Pros:** Organized chronologically, easy to find by date
**Cons:** Deep folder structure

### Option 3: Type-Based Organization
```
Sonigraph Exports/
  Audio/
    sonigraph-2025-01-15-142030.wav
    vault-timeline-past-year.mp3
  Video/
    animation-2025-01-15.mp4
  Metadata/
    sonigraph-2025-01-15-142030.json
```
**Pros:** Organized by type
**Cons:** Separates related files (audio + metadata)

### Option 4: Hybrid ✅ **USER SELECTED**
```
Sonigraph Exports/
  2025-01-15-timeline-past-year/
    audio.wav
    audio.mp3
    video.mp4
    metadata.json
    settings.json
    export-note.md
  2025-01-15-custom-range/
    audio.wav
    metadata.json
    export-note.md
```
**Pros:**
- Groups related exports together
- Easy to find exports
- Can have multiple formats of same export
**Cons:**
- More complex structure

**✅ DECISION:** Implement **Hybrid approach** from Phase 1. Use folder naming: `YYYY-MM-DD-descriptive-name/`

---

## Error Handling Strategy

### Error Categories

#### 1. Pre-Export Validation Errors
**When:** Before export starts
**Handling:** Show error dialog, prevent export

Examples:
- No animation loaded
- Invalid time range (end before start)
- Duration exceeds user-set limit (show warning, allow override)
- Insufficient disk space (calculate required + buffer)
- Export folder not writable

**UI:**
```
┌────────────────────────────────────┐
│ Cannot Start Export             [×] │
├────────────────────────────────────┤
│                                    │
│ ⚠ Insufficient disk space         │
│                                    │
│ Required:  120 MB                  │
│ Available: 45 MB                   │
│                                    │
│ Please free up disk space or       │
│ choose a different location.       │
│                                    │
│              [OK]                  │
└────────────────────────────────────┘
```

#### 2. Rendering Errors
**When:** During audio/video rendering
**Handling:** Cancel export, cleanup, show error

Examples:
- Out of memory (large export)
- Audio engine failure
- Instrument loading failure
- Timeline corruption

**UI:**
```
┌────────────────────────────────────┐
│ Export Failed                   [×] │
├────────────────────────────────────┤
│                                    │
│ ⚠ Out of Memory                   │
│                                    │
│ The export was too large for       │
│ available system memory.           │
│                                    │
│ Suggestions:                       │
│ • Try a shorter duration           │
│ • Reduce quality settings          │
│ • Close other applications         │
│ • Export in shorter segments       │
│                                    │
│ Partial files have been deleted.   │
│                                    │
│      [View Logs]  [OK]            │
└────────────────────────────────────┘
```

#### 3. Encoding Errors
**When:** During format conversion
**Handling:** Keep raw buffer, offer to retry or save as different format

Examples:
- MP3 encoder failure
- Video codec not supported
- Corrupted encoder library

**UI:**
```
┌────────────────────────────────────┐
│ Encoding Failed                 [×] │
├────────────────────────────────────┤
│                                    │
│ ⚠ MP3 encoding failed             │
│                                    │
│ Audio was rendered successfully,   │
│ but conversion to MP3 failed.      │
│                                    │
│ Would you like to save as WAV      │
│ instead?                           │
│                                    │
│  [Cancel]  [Save as WAV]          │
└────────────────────────────────────┘
```

#### 4. File Writing Errors
**When:** During file save
**Handling:** Keep buffer in memory, offer to retry or choose new location

Examples:
- Disk full (occurred during write)
- Permission denied
- File locked by another process
- Network drive disconnected

**UI:**
```
┌────────────────────────────────────┐
│ Save Failed                     [×] │
├────────────────────────────────────┤
│                                    │
│ ⚠ Permission Denied               │
│                                    │
│ Cannot write to:                   │
│ ~/Music/sonigraph/export.mp3       │
│                                    │
│ The file or folder may be locked   │
│ or you may not have permission.    │
│                                    │
│  [Choose Different Location]       │
│  [Cancel]                          │
└────────────────────────────────────┘
```

#### 5. User Cancellation
**When:** User clicks cancel during export
**Handling:** Stop immediately, cleanup partial files, confirm cancellation

**UI:**
```
┌────────────────────────────────────┐
│ Export Cancelled                   │
├────────────────────────────────────┤
│                                    │
│ Export was stopped at 34%          │
│                                    │
│ Cleaning up partial files...       │
│                                    │
└────────────────────────────────────┘

(auto-closes after cleanup)
```

#### 6. File Collision ✅ **DEFAULT: CANCEL**
**When:** File already exists
**Handling:** Prompt user for action (default to cancel for safety)

**UI:**
```
┌────────────────────────────────────┐
│ File Already Exists             [×] │
├────────────────────────────────────┤
│                                    │
│ The file already exists:           │
│                                    │
│ sonigraph-2025-01-15.wav           │
│ Last modified: Jan 15, 2025 2:30pm │
│ Size: 11.5 MB                      │
│                                    │
│ Would you like to:                 │
│                                    │
│ ○ Overwrite existing file          │
│ ○ Rename new file:                 │
│   [sonigraph-2025-01-15-1] .wav    │
│ ● Cancel export                    │
│                                    │
│              [Continue]            │
└────────────────────────────────────┘
```

**✅ DECISION:** Default selection is "Cancel export" for safety. User must explicitly choose overwrite/rename.

### Error Logging

All errors should be logged with full context:

```typescript
interface ExportError {
    timestamp: string;
    stage: 'validation' | 'rendering' | 'encoding' | 'writing';
    errorType: string;
    message: string;
    config: ExportConfig;
    stackTrace?: string;
    userAction?: string; // What user did after error
}
```

Logs saved to: `Sonigraph Exports/.logs/export-errors.jsonl`

---

## Technical Implementation Details

### Export Settings Storage

Add to plugin settings:

```typescript
export interface ExportSettings {
    // Defaults
    defaultFormat: 'wav' | 'mp3' | 'ogg' | 'flac';
    defaultVideoFormat?: 'mp4' | 'webm';
    defaultQuality: 'low' | 'standard' | 'high' | 'lossless';

    // Quality settings per format
    audioQuality: {
        wav: { sampleRate: number; bitDepth: number };
        mp3: { sampleRate: number; bitRate: number };
        ogg: { sampleRate: number; quality: number };
        flac: { sampleRate: number; compressionLevel: number };
    };

    // Video settings
    videoQuality?: {
        resolution: '720p' | '1080p' | '1440p' | '4k';
        frameRate: 30 | 60;
        bitRate: number;
    };

    // File handling
    lastExportLocation: string;
    lastExportType: 'vault' | 'system';
    exportFolder: string; // Vault folder path
    fileNamingTemplate: string; // e.g. "sonigraph-{date}-{time}"

    // Export options
    renderingMethod: 'offline' | 'realtime';
    maxDurationMinutes: number;
    warnOnLongExport: boolean;
    includeMetadata: boolean;
    rememberMetadata: boolean;

    // Last used metadata
    lastMetadata?: {
        title: string;
        artist: string;
        album: string;
        comment: string;
    };

    // Vault integration
    createExportNote: boolean;
    exportNoteFolder: string;
    exportNoteTemplate: string;
    addToDailyNote: boolean;
    includeSettingsSummary: boolean;

    // Instrument selection memory
    lastInstrumentSelection?: string[]; // Array of enabled instrument IDs

    // Presets
    exportPresets: ExportPreset[];
}

export interface ExportPreset {
    id: string;
    name: string;
    format: string;
    quality: any;
    metadata?: any;
    instruments?: string[];
}
```

### Default Export Settings

```typescript
const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
    defaultFormat: 'wav',
    defaultQuality: 'high',
    audioQuality: {
        wav: { sampleRate: 48000, bitDepth: 16 },
        mp3: { sampleRate: 48000, bitRate: 192 },
        ogg: { sampleRate: 48000, quality: 0.7 },
        flac: { sampleRate: 48000, compressionLevel: 5 }
    },
    lastExportLocation: '',
    lastExportType: 'vault',
    exportFolder: 'Sonigraph Exports',
    fileNamingTemplate: 'sonigraph-{date}-{time}',
    renderingMethod: 'offline',
    maxDurationMinutes: 10,
    warnOnLongExport: true,
    includeMetadata: true,
    rememberMetadata: true,
    createExportNote: true,
    exportNoteFolder: 'Sonigraph Exports',
    exportNoteTemplate: DEFAULT_NOTE_TEMPLATE,
    addToDailyNote: false,
    includeSettingsSummary: true,
    exportPresets: [
        {
            id: 'high-quality',
            name: 'High Quality',
            format: 'wav',
            quality: { sampleRate: 48000, bitDepth: 24 }
        },
        {
            id: 'standard',
            name: 'Standard',
            format: 'mp3',
            quality: { sampleRate: 48000, bitRate: 192 }
        },
        {
            id: 'small-size',
            name: 'Small Size',
            format: 'mp3',
            quality: { sampleRate: 44100, bitRate: 128 }
        }
    ]
};
```

---

## Export Note Template

When "Create note linking to export" is enabled:

```markdown
---
export-date: {{timestamp}}
export-format: {{format}}
export-duration: {{duration}}
export-file: "[[{{filename}}]]"
tags:
  - sonigraph/export
  - audio/{{format}}
---

# Sonigraph Export - {{title}}

## Export Information

**Date:** {{date}}
**Time:** {{time}}
**Duration:** {{duration}} seconds
**Format:** {{format}}
**File Size:** {{fileSize}}

## Audio File

![[{{filename}}]]

## Timeline Settings

- **Time Window:** {{timeWindow}}
- **Date Range:** {{dateStart}} to {{dateEnd}}
- **Granularity:** {{granularity}}
- **Event Spreading:** {{eventSpreadingMode}}

## Audio Configuration

- **Active Instruments:** {{instrumentList}}
- **Master Volume:** {{masterVolume}}
- **Effects:** {{effectsEnabled}}
- **Spatial Audio:** {{spatialAudio}}

## Metadata

{{#if metadata.title}}
- **Title:** {{metadata.title}}
{{/if}}
{{#if metadata.artist}}
- **Artist:** {{metadata.artist}}
{{/if}}
{{#if metadata.comment}}
- **Comment:** {{metadata.comment}}
{{/if}}

## Full Settings

{{#if includeFullSettings}}
```json
{{fullSettingsJson}}
```
{{/if}}

---

*Generated by [Sonigraph](obsidian://show-plugin?id=sonigraph) v{{version}}*
```

---

## Implementation Summary (v0.12.2)

### ✅ Completed Features

**Core Export System (9 files, ~2,500 lines)**
- AudioExporter - Export orchestration with progress tracking
- OfflineRenderer - Real-time audio capture with timeline sync
- WavEncoder - Lossless WAV export
- Mp3Encoder - Compressed audio via native MediaRecorder
- ExportModal - Card-based UI with presets and metadata
- ExportProgressModal - Real-time progress with cancellation
- FileCollisionModal - Cancel/overwrite/rename resolution
- ExportNoteCreator - Comprehensive markdown documentation
- Type definitions - Complete type system for export

**User Features**
- ✅ WAV export (44.1/48/96 kHz, 16/24-bit)
- ✅ Compressed audio (M4A/AAC, WebM/Opus, OGG/Vorbis)
- ✅ Custom time range selection (MM:SS or seconds)
- ✅ Metadata editing (title, artist, album, year, genre, comment)
- ✅ Export presets (quick + custom save/load)
- ✅ Progress tracking with cancellation
- ✅ File collision handling
- ✅ Automatic export notes with comprehensive settings
- ✅ Real-time file size and render time estimates

### ⏭️ Intentionally Skipped

- Additional UI locations (Control Center, context menu) — unnecessary for UX
- Instrument selection checkboxes — redundant with Control Center
- Separate OGG/FLAC encoders — MediaRecorder handles natively
- System location picker — requires Electron fs integration
- Rendering method choice — offline rendering only
- Export history log — deferred to future

### ❌ Deferred to Future

**Phase 3: Video Export (separate branch)**
- Canvas capture for graph visualization
- Video encoding (MP4/WebM)
- Audio + video synchronization
- Video quality settings (resolution, frame rate)
- Video-specific export modal tab

### Success Criteria — ✅ ALL MET

- ✅ User can export full timeline animation to WAV
- ✅ Export button visible in timeline controls
- ✅ Export modal shows with format selection
- ✅ Filename is auto-generated and editable
- ✅ User can choose vault folder location
- ✅ Progress modal shows during export with stages
- ✅ Export can be cancelled at any time
- ✅ File collision prompts for cancel/overwrite/rename
- ✅ Success notification shows with file path
- ✅ Exported audio matches playback quality
- ✅ All basic errors handled gracefully
- ✅ **BONUS:** Compressed audio formats
- ✅ **BONUS:** Metadata support
- ✅ **BONUS:** Export presets
- ✅ **BONUS:** Custom time range
- ✅ **BONUS:** Comprehensive export notes

---

## Next Steps for Phase 3 (Future)

When video export is prioritized:

1. Create new branch `feature/export-video` from main
2. Implement canvas capture system for graph visualization
3. Research video encoding options (MediaRecorder for WebM, or canvas-to-video libraries)
4. Implement audio + video synchronization
5. Add video tab to ExportModal
6. Test across platforms (Electron, web, mobile)
7. Update documentation

**Estimated Effort:** 3-4 weeks for full video export implementation

---

**Document Status:** Phase 1 & 2 Complete — Merged into main (v0.12.2)
**Next Review:** When Phase 3 (video export) is prioritized
**Current Version:** 0.12.2 (October 2, 2025)


