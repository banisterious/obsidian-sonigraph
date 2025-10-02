/**
 * Export Feature - Type Definitions
 *
 * Defines all types and interfaces for the audio/video export system.
 */

/**
 * Audio format options for export
 */
export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'flac';

/**
 * Video format options for export (Phase 3)
 */
export type VideoFormat = 'mp4' | 'webm';

/**
 * Quality preset levels
 */
export type QualityPreset = 'low' | 'standard' | 'high' | 'lossless';

/**
 * Export scope - what to export
 */
export type ExportScope = 'full-timeline' | 'custom-range' | 'static-graph' | 'selected-nodes';

/**
 * Rendering method
 */
export type RenderingMethod = 'offline' | 'realtime';

/**
 * File collision behavior
 */
export type CollisionBehavior = 'cancel' | 'overwrite' | 'rename';

/**
 * Export location type
 */
export type ExportLocationType = 'vault' | 'system';

/**
 * WAV audio quality settings
 */
export interface WavQuality {
    sampleRate: 44100 | 48000 | 96000;
    bitDepth: 16 | 24 | 32;
}

/**
 * MP3 audio quality settings
 */
export interface Mp3Quality {
    sampleRate: 44100 | 48000;
    bitRate: 128 | 192 | 256 | 320;
}

/**
 * OGG audio quality settings
 */
export interface OggQuality {
    sampleRate: 44100 | 48000;
    quality: number; // 0.0 - 1.0
}

/**
 * FLAC audio quality settings
 */
export interface FlacQuality {
    sampleRate: 44100 | 48000 | 96000;
    compressionLevel: number; // 0-8
}

/**
 * Video quality settings (Phase 3)
 */
export interface VideoQuality {
    resolution: '720p' | '1080p' | '1440p' | '4k';
    frameRate: 30 | 60;
    bitRate: number;
}

/**
 * Audio metadata for export files
 */
export interface AudioMetadata {
    title?: string;
    artist?: string;
    album?: string;
    comment?: string;
    year?: number;
    genre?: string;
}

/**
 * Main export configuration
 */
export interface ExportConfig {
    // What to export
    scope: ExportScope;
    customRange?: {
        start: number; // Timestamp
        end: number;   // Timestamp
    };

    // Format and quality
    format: AudioFormat;
    quality: WavQuality | Mp3Quality | OggQuality | FlacQuality;

    // Audio content
    selectedInstruments?: string[]; // Instrument IDs to include
    includeContinuousLayers: boolean;
    applyMasterVolume: boolean;
    applyEffects: boolean;
    preserveSpatialAudio: boolean;

    // Audio configuration details (for note generation)
    masterVolume?: number; // Actual master volume value in dB
    enabledEffects?: string[]; // List of enabled effect names

    // File handling
    locationType: ExportLocationType;
    location: string; // Vault folder path or system path
    filename: string; // Without extension
    onCollision: CollisionBehavior;

    // Rendering
    renderingMethod: RenderingMethod;
    maxDurationMinutes: number;

    // Metadata
    metadata?: AudioMetadata;

    // Vault integration
    createNote: boolean;
    noteFolder?: string;
    includeSettingsSummary: boolean;
}

/**
 * Export progress information
 */
export interface ExportProgress {
    stage: 'validating' | 'rendering' | 'encoding' | 'writing' | 'complete' | 'error';
    percentage: number; // 0-100
    currentStep: string;
    estimatedTimeRemaining?: number; // Seconds
}

/**
 * Export result
 */
export interface ExportResult {
    success: boolean;
    filePath?: string;
    fileSize?: number;
    duration?: number; // Export duration in seconds
    notePath?: string; // Path to created note if applicable
    error?: ExportError;
}

/**
 * Export error information
 */
export interface ExportError {
    timestamp: string;
    stage: 'validation' | 'rendering' | 'encoding' | 'writing';
    errorType: string;
    message: string;
    config?: ExportConfig;
    stackTrace?: string;
}

/**
 * Export preset for quick access
 */
export interface ExportPreset {
    id: string;
    name: string;
    format: AudioFormat;
    quality: WavQuality | Mp3Quality | OggQuality | FlacQuality;
    metadata?: AudioMetadata;
    instruments?: string[];
}

/**
 * Export settings stored in plugin settings
 */
export interface ExportSettings {
    // Defaults
    defaultFormat: AudioFormat;
    defaultVideoFormat?: VideoFormat;
    defaultQuality: QualityPreset;

    // Quality settings per format
    audioQuality: {
        wav: WavQuality;
        mp3: Mp3Quality;
        ogg: OggQuality;
        flac: FlacQuality;
    };

    // Video settings (Phase 3)
    videoQuality?: VideoQuality;

    // File handling
    lastExportLocation: string;
    lastExportType: ExportLocationType;
    exportFolder: string; // Vault folder path
    fileNamingTemplate: string; // e.g. "sonigraph-{date}-{time}"

    // Export options
    renderingMethod: RenderingMethod;
    maxDurationMinutes: number;
    warnOnLongExport: boolean;
    includeMetadata: boolean;
    rememberMetadata: boolean;

    // Last used metadata
    lastMetadata?: AudioMetadata;

    // Vault integration
    createExportNote: boolean;
    exportNoteFolder: string;
    exportNoteTemplate: string;
    addToDailyNote: boolean;
    includeSettingsSummary: boolean;

    // Instrument selection memory
    lastInstrumentSelection?: string[];

    // Presets
    exportPresets: ExportPreset[];
}
