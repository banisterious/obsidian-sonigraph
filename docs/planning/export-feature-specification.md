## Sonic Graph Export Feature Specification

**Document Version:** 1.0
**Date:** January 15, 2025
**Status:** Planning / Discussion Phase

---

### 1. Introduction

This document outlines the design and implementation plan for adding audio and video export capabilities to the Sonigraph plugin. The goal is to enable users to capture and save their Sonic Graph timeline animations as audio files (WAV, MP3) and eventually video files (MP4), allowing them to share vault sonifications, create presentations, or maintain archives of their work.

### 2. Goals

* **Enable Audio Export:** Allow users to export timeline animations as audio files
* **Multiple Format Support:** Support WAV (lossless) and MP3 (compressed) formats
* **Seamless Integration:** Integrate export controls naturally into existing UI
* **Offline Rendering:** Render exports faster than real-time when possible
* **Vault Integration:** Save exports within vault for easy linking and embedding
* **Future Video Support:** Lay groundwork for future video export (graph visualization + audio)
* **User Control:** Provide sensible defaults while allowing customization

### 3. Scope

#### Phase 1: Basic Audio Export (MVP)
- WAV export of timeline animations
- Offline rendering for faster-than-realtime export
- Auto-save to vault folder
- Simple progress indication
- Export button in timeline controls

#### Phase 2: Enhanced Audio Export
- MP3 format support
- Quality settings (sample rate, bit rate)
- Custom filename/location selection
- Export metadata (ID3 tags, settings info)
- Export presets

#### Phase 3: Video Export
- Canvas capture of graph visualization
- MP4 export with audio + video
- Frame rate and resolution options
- Optional timeline/UI overlay

#### Out of Scope (for now)
- Real-time recording during playback
- Batch export of multiple animations
- Cloud/external service uploads
- Live streaming capabilities
- Custom audio post-processing

### 4. Technical Architecture

#### 4.1 Export Pipeline Overview

```
User Triggers Export
       ↓
[Export Configuration]
       ↓
[Offline Audio Rendering]
  - Create OfflineAudioContext
  - Recreate audio graph
  - Render timeline events
  - Generate AudioBuffer
       ↓
[Format Conversion]
  - WAV: Direct PCM encoding
  - MP3: Use lamejs encoder
       ↓
[File Writing]
  - Use Obsidian vault API
  - Save to configured location
       ↓
[User Notification]
```

#### 4.2 Key Components

**New Files to Create:**
- `src/export/AudioExporter.ts` - Main export orchestrator
- `src/export/OfflineRenderer.ts` - Offline audio rendering
- `src/export/FormatEncoder.ts` - WAV/MP3 encoding
- `src/export/ExportSettings.ts` - Export configuration types
- `src/export/ExportModal.ts` - Export UI dialog (Phase 2)

**Existing Files to Modify:**
- `src/ui/SonicGraphView.ts` - Add export button to timeline controls
- `src/ui/control-panel.ts` - Add export settings/tab (Phase 2)
- `src/utils/constants.ts` - Add export default settings

#### 4.3 Offline Rendering Strategy

**Challenge:** Current `AudioEngine` and `TemporalGraphAnimator` are designed for real-time playback with Web Audio API.

**Solution:** Create parallel rendering path that:
1. Creates `OfflineAudioContext` instead of real-time `AudioContext`
2. Pre-calculates all timeline events at precise sample positions
3. Schedules all note triggers with exact timing
4. Renders entire timeline in one `startRendering()` call
5. Converts resulting `AudioBuffer` to file format

**Key Differences from Real-Time:**
- No animation frame loop needed
- All events scheduled upfront
- Much faster than real-time (no waiting)
- More precise timing (sample-accurate)
- No user interaction during render

#### 4.4 File Format Details

**WAV Format:**
- Container: RIFF/WAVE
- Audio format: PCM (uncompressed)
- Sample rate: 48kHz (configurable: 44.1kHz, 48kHz, 96kHz)
- Bit depth: 16-bit (configurable: 16-bit, 24-bit, 32-bit float)
- Channels: Stereo (2 channels)
- File size: ~10 MB per minute at 48kHz/16-bit stereo
- Implementation: Pure JavaScript conversion from AudioBuffer

**MP3 Format (Phase 2):**
- Container: MP3
- Audio format: MPEG-1 Audio Layer III
- Bit rate: 192 kbps (configurable: 128, 192, 256, 320 kbps)
- Sample rate: 48kHz
- Channels: Stereo
- File size: ~1.4 MB per minute at 192 kbps
- Implementation: Use `lamejs` library (~100KB)

### 5. User Experience

#### 5.1 Export Button Placement (Phase 1)

**Primary Location: Timeline Controls**
```
[<< Rewind] [Play ▶] [Pause ⏸] [Stop ⏹] [Export ⬇] | Progress: [=====>    ] 45% | Speed: 1x
```

Add export button in timeline controls section, visible when timeline is active.

**Button Behavior:**
- Click → Shows simple dialog or starts immediate export with defaults
- Disabled when no animation loaded or already exporting
- Shows loading spinner during export

#### 5.2 Basic Export Flow (Phase 1)

```
User clicks Export button
         ↓
Show confirmation dialog:
  ┌────────────────────────────────────────┐
  │ Export Sonic Graph Animation          │
  ├────────────────────────────────────────┤
  │ Format: WAV (Lossless)                │
  │ Duration: 60 seconds                   │
  │ Quality: 48kHz, 16-bit Stereo         │
  │                                        │
  │ Save to: Sonigraph Exports/           │
  │ Filename: sonigraph-2025-01-15.wav    │
  │                                        │
  │          [Cancel]  [Export]           │
  └────────────────────────────────────────┘
         ↓
Export starts (show progress)
         ↓
Export completes (show notification)
         ↓
"Export complete! Saved to Sonigraph Exports/sonigraph-2025-01-15.wav"
[Open File] [Open Folder]
```

#### 5.3 Progress Indication

**During Export:**
```
┌────────────────────────────────────────┐
│ Exporting Animation...                │
├────────────────────────────────────────┤
│ [████████████░░░░░░░░░░░░] 60%        │
│                                        │
│ Rendering audio: 36 / 60 seconds      │
│ Estimated time remaining: 8 seconds    │
│                                        │
│              [Cancel]                  │
└────────────────────────────────────────┘
```

**Features:**
- Real-time progress bar
- Current position / total duration
- Time remaining estimate
- Cancel button (cleanup partial files)

#### 5.4 Advanced Export Dialog (Phase 2)

**Control Center Export Tab:**
```
┌─────────────────────────────────────────────────┐
│ Export Settings                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Format                                          │
│ ○ WAV (Lossless)                               │
│ ● MP3 (192 kbps)                               │
│                                                 │
│ Quality                                         │
│ Sample Rate:  [48kHz ▼]                        │
│ Bit Rate:     [192 kbps ▼] (for MP3)          │
│                                                 │
│ File Options                                    │
│ Location:     [Sonigraph Exports/ ▼] [Browse] │
│ Filename:     [sonigraph-YYYY-MM-DD] [Auto]   │
│                                                 │
│ Metadata (Optional)                             │
│ Title:        [Vault Timeline Animation]       │
│ Artist:       [Sonigraph]                      │
│ Comment:      [Settings: gentle, 60s...]       │
│                                                 │
│ Include JSON Settings File: [✓]                │
│                                                 │
│                        [Export Now]            │
└─────────────────────────────────────────────────┘
```

### 6. Implementation Details

#### 6.1 AudioExporter Class API

```typescript
export interface ExportConfig {
    format: 'wav' | 'mp3';
    sampleRate: 44100 | 48000 | 96000;
    bitDepth: 16 | 24 | 32; // For WAV
    bitRate: 128 | 192 | 256 | 320; // For MP3
    channels: 1 | 2;
    filename?: string;
    location?: string;
    metadata?: ExportMetadata;
}

export interface ExportMetadata {
    title?: string;
    artist?: string;
    album?: string;
    comment?: string;
    year?: number;
}

export interface ExportProgress {
    stage: 'preparing' | 'rendering' | 'encoding' | 'writing' | 'complete';
    progress: number; // 0-1
    currentTime: number; // Current render position in seconds
    totalTime: number; // Total duration in seconds
    estimatedTimeRemaining: number; // Seconds
}

export class AudioExporter {
    constructor(
        private app: App,
        private plugin: SonigraphPlugin,
        private audioEngine: AudioEngine
    ) {}

    /**
     * Export timeline animation as audio file
     */
    async exportAnimation(
        config: ExportConfig,
        onProgress?: (progress: ExportProgress) => void,
        cancelToken?: CancellationToken
    ): Promise<string> {
        // Returns path to exported file
    }

    /**
     * Get estimated file size before export
     */
    estimateFileSize(duration: number, config: ExportConfig): number {
        // Returns bytes
    }

    /**
     * Validate export configuration
     */
    validateConfig(config: ExportConfig): ValidationResult {
        // Check disk space, duration limits, etc.
    }
}
```

#### 6.2 OfflineRenderer Implementation

```typescript
export class OfflineRenderer {
    /**
     * Render timeline animation to audio buffer
     */
    async renderTimeline(
        animator: TemporalGraphAnimator,
        audioEngine: AudioEngine,
        config: RenderConfig,
        onProgress?: (progress: number) => void
    ): Promise<AudioBuffer> {
        const duration = animator.getConfig().duration;
        const sampleRate = config.sampleRate;
        const totalSamples = sampleRate * duration;

        // Create offline context
        const offlineCtx = new OfflineAudioContext(
            config.channels,
            totalSamples,
            sampleRate
        );

        // Recreate audio graph in offline context
        const offlineEngine = this.createOfflineAudioEngine(
            offlineCtx,
            audioEngine
        );

        // Get all timeline events
        const events = animator.getTimeline();

        // Schedule all events at precise sample positions
        for (const event of events) {
            const time = event.timestamp;
            const node = animator.getNodeById(event.nodeId);

            if (event.type === 'appear') {
                // Trigger note in offline context at exact time
                offlineEngine.playNote(node, time);
            }
        }

        // Start rendering
        const buffer = await offlineCtx.startRendering();

        return buffer;
    }

    /**
     * Create offline version of audio engine
     */
    private createOfflineAudioEngine(
        offlineCtx: OfflineAudioContext,
        sourceEngine: AudioEngine
    ): OfflineAudioEngine {
        // Create parallel audio engine that uses offline context
        // Copy all settings, instruments, effects from source
        // Return engine that can schedule notes at precise times
    }
}
```

#### 6.3 Format Encoding

**WAV Encoder:**
```typescript
export class WavEncoder {
    /**
     * Convert AudioBuffer to WAV file bytes
     */
    encode(buffer: AudioBuffer, bitDepth: 16 | 24 | 32): ArrayBuffer {
        const numChannels = buffer.numberOfChannels;
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;

        // Calculate sizes
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = length * blockAlign;
        const fileSize = 44 + dataSize; // 44 = WAV header size

        // Create buffer for entire file
        const arrayBuffer = new ArrayBuffer(fileSize);
        const view = new DataView(arrayBuffer);

        // Write RIFF header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, fileSize - 8, true);
        this.writeString(view, 8, 'WAVE');

        // Write fmt chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);

        // Write data chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write audio samples
        this.writeSamples(view, 44, buffer, bitDepth);

        return arrayBuffer;
    }

    private writeSamples(
        view: DataView,
        offset: number,
        buffer: AudioBuffer,
        bitDepth: number
    ): void {
        // Interleave channels and write samples
        // Handle bit depth conversion (float32 → int16/int24/int32)
    }
}
```

**MP3 Encoder (Phase 2):**
```typescript
import lamejs from 'lamejs';

export class Mp3Encoder {
    /**
     * Convert AudioBuffer to MP3 file bytes
     */
    encode(buffer: AudioBuffer, bitRate: number): Uint8Array {
        const sampleRate = buffer.sampleRate;
        const numChannels = buffer.numberOfChannels;

        // Initialize lame encoder
        const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitRate);

        // Convert float samples to int16
        const leftChannel = this.float32ToInt16(buffer.getChannelData(0));
        const rightChannel = numChannels > 1
            ? this.float32ToInt16(buffer.getChannelData(1))
            : leftChannel;

        // Encode
        const mp3Data: Uint8Array[] = [];
        const sampleBlockSize = 1152; // MPEG1 Layer 3 frame size

        for (let i = 0; i < leftChannel.length; i += sampleBlockSize) {
            const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
            const rightChunk = rightChannel.subarray(i, i + sampleBlockSize);
            const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        // Flush encoder
        const mp3buf = encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        // Combine all chunks
        return this.concatUint8Arrays(mp3Data);
    }
}
```

#### 6.4 File Writing (Obsidian Integration)

```typescript
export class ExportFileWriter {
    constructor(private app: App) {}

    /**
     * Write audio file to vault
     */
    async writeToVault(
        audioData: ArrayBuffer | Uint8Array,
        filename: string,
        folder: string = 'Sonigraph Exports'
    ): Promise<string> {
        // Ensure export folder exists
        await this.ensureFolderExists(folder);

        // Generate unique filename if collision
        const finalPath = await this.resolveFilePath(folder, filename);

        // Write file using Obsidian API
        await this.app.vault.adapter.writeBinary(
            finalPath,
            audioData instanceof ArrayBuffer
                ? audioData
                : audioData.buffer
        );

        return finalPath;
    }

    /**
     * Write export metadata JSON
     */
    async writeMetadata(
        metadata: ExportSessionMetadata,
        audioFilePath: string
    ): Promise<void> {
        const jsonPath = audioFilePath.replace(/\.(wav|mp3)$/, '.json');
        const jsonContent = JSON.stringify(metadata, null, 2);

        await this.app.vault.adapter.write(jsonPath, jsonContent);
    }

    /**
     * Handle filename collisions
     */
    private async resolveFilePath(
        folder: string,
        filename: string
    ): Promise<string> {
        let path = `${folder}/${filename}`;
        let counter = 1;

        while (await this.app.vault.adapter.exists(path)) {
            const base = filename.replace(/\.(wav|mp3)$/, '');
            const ext = filename.match(/\.(wav|mp3)$/)?.[0] || '';
            path = `${folder}/${base}-${counter}${ext}`;
            counter++;
        }

        return path;
    }
}
```

### 7. Data Structures

#### 7.1 Export Session Metadata

```typescript
export interface ExportSessionMetadata {
    // Export info
    exportDate: string; // ISO 8601
    exportVersion: string; // Plugin version
    format: 'wav' | 'mp3';

    // Audio specs
    duration: number; // seconds
    sampleRate: number;
    bitDepth?: number; // WAV only
    bitRate?: number; // MP3 only
    channels: number;
    fileSizeBytes: number;

    // Vault info
    vaultName: string;
    totalNodes: number;
    nodesInAnimation: number;

    // Timeline settings
    timelineSettings: {
        timeWindow: string;
        granularity: string;
        dateRange: {
            start: string;
            end: string;
        };
        eventSpreadingMode: string;
        simultaneousEventLimit: number;
        eventBatchSize: number;
    };

    // Audio settings
    audioSettings: {
        activeInstruments: string[];
        masterVolume: number;
        effectsEnabled: boolean;
        audioDensity: number;
        noteDuration: number;
    };

    // User metadata
    customMetadata?: {
        title?: string;
        artist?: string;
        comment?: string;
    };
}
```

### 8. User Settings

#### 8.1 Plugin Settings Extension

```typescript
export interface SonigraphSettings {
    // ... existing settings ...

    exportSettings?: {
        // Defaults
        defaultFormat: 'wav' | 'mp3';
        defaultSampleRate: 44100 | 48000 | 96000;
        defaultBitDepth: 16 | 24 | 32;
        defaultBitRate: 128 | 192 | 256 | 320;

        // File handling
        exportFolder: string; // Default: "Sonigraph Exports"
        autoNumbering: boolean; // Auto-increment on collision
        includeMetadataFile: boolean; // Save .json alongside audio

        // Notifications
        showProgressModal: boolean;
        notifyOnComplete: boolean;
        openFolderOnComplete: boolean;

        // Limits
        maxDurationMinutes: number; // Warn if exceeded
    };
}
```

#### 8.2 Default Settings

```typescript
const DEFAULT_EXPORT_SETTINGS = {
    defaultFormat: 'wav',
    defaultSampleRate: 48000,
    defaultBitDepth: 16,
    defaultBitRate: 192,
    exportFolder: 'Sonigraph Exports',
    autoNumbering: true,
    includeMetadataFile: true,
    showProgressModal: true,
    notifyOnComplete: true,
    openFolderOnComplete: false,
    maxDurationMinutes: 10
};
```

### 9. Error Handling

#### 9.1 Validation Errors

**Before Export:**
- Check animation loaded and valid
- Verify duration within limits (< 10 minutes warning)
- Check disk space available
- Validate export folder exists/writable

**Error Messages:**
```
"No animation loaded. Please start a timeline animation first."
"Export duration exceeds recommended limit (10 minutes). Continue anyway?"
"Insufficient disk space. Need 100 MB, only 50 MB available."
"Cannot write to export folder. Check permissions."
```

#### 9.2 Runtime Errors

**During Export:**
- Rendering failures
- Memory errors (large exports)
- User cancellation
- File write errors

**Error Handling:**
```typescript
try {
    await exporter.exportAnimation(config, onProgress);
} catch (error) {
    if (error instanceof ExportCancelledError) {
        // Clean up partial files
        await this.cleanupPartialExport(config.filename);
        new Notice('Export cancelled');
    } else if (error instanceof OutOfMemoryError) {
        new Notice('Export failed: Insufficient memory. Try shorter duration.');
    } else if (error instanceof DiskFullError) {
        new Notice('Export failed: Disk full');
    } else {
        logger.error('export', 'Export failed:', error);
        new Notice('Export failed: ' + error.message);
    }
}
```

### 10. Performance Considerations

#### 10.1 Memory Management

**Challenge:** Large exports (10+ minutes) can use significant memory

**Strategies:**
- Stream encoding where possible (chunk-based processing)
- Clear AudioBuffer after encoding to free memory
- Show memory warnings for large exports
- Implement cancellation to free resources

#### 10.2 Rendering Performance

**Offline Context Performance:**
- Much faster than real-time (typically 5-10x)
- 60-second animation renders in ~6-12 seconds
- Longer animations may take proportionally longer

**Progress Updates:**
- Update progress bar every 100ms
- Calculate ETA from current render rate
- Show current timestamp being rendered

### 11. Testing Strategy

#### 11.1 Unit Tests

```typescript
describe('AudioExporter', () => {
    test('exports 10-second animation to WAV', async () => {
        const config: ExportConfig = {
            format: 'wav',
            sampleRate: 48000,
            bitDepth: 16,
            channels: 2
        };

        const path = await exporter.exportAnimation(config);

        expect(path).toContain('.wav');
        expect(await fileExists(path)).toBe(true);
    });

    test('estimates file size correctly', () => {
        const size = exporter.estimateFileSize(60, {
            format: 'wav',
            sampleRate: 48000,
            bitDepth: 16,
            channels: 2
        });

        // 48000 samples/s * 60s * 2 channels * 2 bytes = 11,520,000 bytes
        expect(size).toBeCloseTo(11520000, -3);
    });

    test('handles cancellation gracefully', async () => {
        const cancelToken = new CancellationToken();

        const promise = exporter.exportAnimation(config, null, cancelToken);

        setTimeout(() => cancelToken.cancel(), 100);

        await expect(promise).rejects.toThrow(ExportCancelledError);
    });
});
```

#### 11.2 Integration Tests

- Export with different timeline configurations
- Export with various instrument combinations
- Export with effects enabled/disabled
- Verify exported audio playback correctly
- Test filename collision handling
- Test disk space handling

#### 11.3 Manual Testing Checklist

- [ ] Export 10-second animation (fast test)
- [ ] Export 60-second animation (typical use)
- [ ] Export 5-minute animation (stress test)
- [ ] Verify audio quality matches playback
- [ ] Test cancellation mid-export
- [ ] Test with no disk space
- [ ] Test with read-only vault
- [ ] Verify metadata JSON accuracy
- [ ] Test filename collisions
- [ ] Verify embedded ID3 tags (MP3)

### 12. Documentation Requirements

#### 12.1 User Documentation

**README Update:**
- Add "Export Features" section
- Document supported formats
- Show export button location
- Explain basic export workflow

**Export Guide (New Document):**
```markdown
# Exporting Your Sonic Graph Animations

## Quick Start

1. Load a timeline animation in Sonic Graph
2. Click the **Export** button in timeline controls
3. Choose format (WAV or MP3)
4. Click **Export Now**
5. Find your file in `Sonigraph Exports/`

## File Formats

### WAV (Lossless)
- High quality, large files
- ~10 MB per minute
- Best for archival

### MP3 (Compressed)
- Good quality, smaller files
- ~1.4 MB per minute at 192 kbps
- Best for sharing

## Advanced Options

[Document quality settings, custom locations, metadata, etc.]
```

#### 12.2 Developer Documentation

**Architecture Documentation:**
- Export pipeline flow diagram
- Offline rendering explanation
- Format encoding details
- API reference for AudioExporter

### 13. Implementation Phases

#### Phase 1: MVP (Basic WAV Export)
**Timeline: 1-2 weeks**

Tasks:
1. Create `AudioExporter` class skeleton
2. Implement `OfflineRenderer` for timeline rendering
3. Implement `WavEncoder` for PCM encoding
4. Add export button to `SonicGraphView`
5. Implement basic progress modal
6. Add file writing with Obsidian API
7. Basic error handling
8. Testing and bug fixes

**Deliverables:**
- Working WAV export from timeline
- Progress indication
- Files saved to vault
- Basic error handling

#### Phase 2: Enhanced Audio (MP3 + Settings)
**Timeline: 1-2 weeks**

Tasks:
1. Integrate `lamejs` library
2. Implement `Mp3Encoder`
3. Add export settings to plugin settings
4. Create advanced export dialog in Control Center
5. Implement custom filename/location picker
6. Add quality presets
7. Implement metadata embedding (ID3 tags)
8. Generate metadata JSON files
9. Add export history/log

**Deliverables:**
- MP3 export support
- Quality settings UI
- Custom naming and locations
- Metadata support

#### Phase 3: Video Export
**Timeline: 2-3 weeks**

Tasks:
1. Research canvas capture API
2. Implement frame capture from graph renderer
3. Integrate video encoding (WebM/MP4)
4. Synchronize video frames with audio timeline
5. Add video export UI
6. Add resolution/framerate options
7. Optional UI overlay rendering

**Deliverables:**
- Video export (MP4 or WebM)
- Graph visualization in video
- Synchronized audio + video

### 14. Dependencies

#### Phase 1 (MVP)
- **None** - Pure JavaScript/TypeScript

#### Phase 2 (MP3)
- **lamejs** - MP3 encoder (~100 KB)
  - License: LGPL
  - Pure JavaScript, works in Electron
  - Mature, well-tested library

#### Phase 3 (Video)
- **Canvas API** - Built into browser
- **MediaRecorder API** - Built into browser
- **FFmpeg.wasm** (optional) - For MP4 encoding
  - Large library (~30 MB)
  - May be optional if WebM is acceptable

### 15. Open Questions

These questions should be answered during the planning phase:

#### User Experience
1. Should export button be always visible or only during animation?
2. Should we support exporting current "static" graph state (all nodes playing)?
3. Should we allow custom time range export (e.g., seconds 10-30)?
4. Should we auto-create a note linking to exports?

#### Technical Implementation
5. Should we create a separate OfflineAudioEngine class or modify existing AudioEngine to support both modes?
6. How should we handle continuous layers during offline rendering?
7. Should we support streaming/chunked encoding for very long exports?
8. What's the maximum reasonable export duration (5 min? 10 min? unlimited)?

#### File Management
9. Should export folder be configurable in plugin settings or always `Sonigraph Exports/`?
10. Should we organize exports by date (subfolders: 2025/01/)?
11. Should we support exporting directly to system locations outside vault?
12. Should we maintain an export history/registry?

#### Metadata & Integration
13. What metadata should be included in JSON files?
14. Should we support custom metadata fields (user-defined)?
15. Should we auto-link exports in daily notes or index note?
16. Should we support export templates (presets with names)?

#### Advanced Features (Future)
17. Should we support batch export (multiple time ranges)?
18. Should we support scheduled/automated exports?
19. Should we add waveform visualization of exported audio?
20. Should we support audio post-processing (normalization, fade in/out)?

---

## Next Steps

1. **Review & Discuss:** Team reviews this specification and answers open questions
2. **Prioritize:** Decide which phases to implement and in what order
3. **Prototype:** Create small proof-of-concept for offline rendering
4. **Design UI:** Finalize export button placement and dialog design
5. **Implement Phase 1:** Build MVP with WAV export
6. **User Testing:** Get feedback from early users
7. **Iterate:** Refine based on feedback before moving to Phase 2

---

**Document Status:** Draft for Review
**Next Review Date:** TBD
**Assigned To:** TBD
