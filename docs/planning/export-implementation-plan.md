## Export Feature - Implementation Plan

**Document Version:** 1.1
**Date:** January 15, 2025
**Status:** Decisions Finalized - Ready for Phase 1 Implementation
**Based On:** export-feature-specification.md

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

**Ready for implementation:** All architectural questions resolved. Phase 1 can begin immediately.

---

## Overview

This document provides the approved implementation plan for the Sonigraph export feature based on user decisions. The feature will be built in progressive phases, with each phase adding more capabilities while maintaining backward compatibility.

---

## User Requirements Summary

### Confirmed Decisions

**When can users export?**
- ✅ Anytime (pre-render entire animation)
- ✅ Does not require active playback

**Export button locations:**
- ✅ Timeline controls (primary)
- ✅ Control Center (settings/advanced)
- ✅ Sonic Graph header
- ✅ Context menu (right-click on graph)

**Export scope:**
- ✅ Full timeline animation
- ✅ Custom time range (user selects start/end)
- ✅ Static graph state (all nodes at once)
- 🔄 Selected nodes only (future)

**Audio content:**
- ✅ Selected instruments only (user can choose which)
- ✅ Continuous layers included
- ✅ Master volume/effects applied
- ✅ Spatial audio panning preserved

**Visual content (video):**
- ✅ Graph visualization
- ✅ Timeline scrubber visible
- 🔄 Optional UI overlay (future)

**Formats:**
- ✅ User chooses from all available formats
- Audio: WAV, MP3, OGG, FLAC (progressive rollout)
- Video: MP4, WebM (Phase 3)

**Quality:**
- ✅ Full quality control exposed to user
- Sample rates: 44.1kHz, 48kHz, 96kHz
- Bit depths: 16-bit, 24-bit, 32-bit float
- MP3 bitrates: 128, 192, 256, 320 kbps
- Video: 720p, 1080p, 1440p, 4K @ 30/60fps

**File handling:**
- ✅ Both vault folder and system location picker
- ✅ Remember last location
- ✅ Auto-generated filename with user edit before export
- ✅ Prompt on overwrite (collision handling)

**User experience:**
- ✅ Full export dialog with progressive disclosure
- ✅ User sets duration limit per export
- ✅ Cancel option during export
- ✅ Comprehensive progress indication

**Integration:**
- ✅ Auto-create note linking to export
- ✅ Remember metadata across sessions
- ✅ Settings in export modal

---

## Implementation Phases

### Phase 1: Foundation (2-3 weeks)

**Goal:** Basic working export with WAV format and essential features

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

### Phase 2: Enhanced Audio (2-3 weeks)

**Goal:** Multiple audio formats, advanced options, metadata

#### Features
1. **Additional Audio Formats**
   - MP3 support (lamejs)
   - OGG support (optional)
   - FLAC support (optional)

2. **Advanced Export Options**
   - Custom time range selection
   - Quality settings (sample rate, bit depth, bitrate)
   - Instrument selection checkboxes
   - Effects on/off toggle
   - Rendering method choice (offline/real-time)

3. **Metadata Support**
   - User-editable metadata fields
   - ID3 tags for MP3
   - Vorbis comments for OGG
   - Remember metadata across sessions

4. **Export Presets**
   - Quick presets: "High Quality", "Standard", "Small Size"
   - Save custom presets
   - Preset management UI

5. **Vault Integration**
   - Auto-create note linking to export
   - Include settings summary in note
   - Optional: Add to daily note

6. **Additional UI Locations** ✅ **SECONDARY STYLING**
   - Export option in Control Center (secondary button)
   - Right-click context menu (standard menu item)

#### Deliverables
- MP3/OGG/FLAC export
- Full quality control UI
- Metadata editing
- Export presets
- Vault note creation
- Export history log

#### Technical Components
```typescript
// New files
src/export/Mp3Encoder.ts
src/export/OggEncoder.ts (optional)
src/export/FlacEncoder.ts (optional)
src/export/ExportPresets.ts
src/export/ExportHistory.ts
src/export/NoteCreator.ts

// Modified files
src/export/ExportModal.ts - Add advanced options
src/ui/control-panel.ts - Add export section
```

---

### Phase 3: Video Export (3-4 weeks)

**Goal:** Video export with graph visualization

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

## Next Steps

### Immediate Actions (This Week)

1. ✅ **Review & approve this plan** - Get feedback on approach
2. ⏳ **Create Phase 1 task breakdown** - Break Phase 1 into smaller tasks
3. ⏳ **Set up project structure** - Create new folders/files
4. ⏳ **Design ExportModal component** - Create UI mockup in Figma/code
5. ⏳ **Prototype offline rendering** - Proof of concept for timeline rendering

### Phase 1 Kickoff (Week 1-2)

**Week 1:**
- Set up export folder structure (`src/export/`)
- Implement basic `AudioExporter` class
- Implement `WavEncoder`
- Create basic `ExportModal` UI

**Week 2:**
- Implement `OfflineRenderer`
- Add export button to SonicGraphView
- Progress modal implementation
- Testing & bug fixes

**Week 3:**
- File handling & collision detection
- Error handling
- Settings integration
- Polish & documentation

### Success Criteria for Phase 1

- [ ] User can export full timeline animation to WAV
- [ ] Export button visible in timeline controls
- [ ] Export modal shows with format selection
- [ ] Filename is auto-generated and editable
- [ ] User can choose vault folder or system location
- [ ] Progress modal shows during export
- [ ] Export can be cancelled
- [ ] File collision prompts for overwrite
- [ ] Success notification shows with file path
- [ ] Exported audio matches playback quality
- [ ] All basic errors handled gracefully

---

**Document Status:** Approved - Ready for Implementation
**Next Review:** After Phase 1 completion
**Primary Developer:** TBD
