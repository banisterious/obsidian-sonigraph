# API Reference

## Table of Contents

- [1. AudioEngine API](#1-audioengine-api)
- [2. Logging API](#2-logging-api)
- [3. UI Components API](#3-ui-components-api)

---

## 1. AudioEngine API

```typescript
class AudioEngine {
  // Initialization
  async initialize(): Promise<void>
  
  // Playback Control
  async playSequence(sequence: MusicalMapping[]): Promise<void>
  stop(): void
  async playTestNote(frequency?: number): Promise<void>
  async playNoteImmediate(mapping: { pitch: number; duration: number; velocity: number; instrument: string }): Promise<void>  // Phase 3.7: Real-time note triggering
  
  // Configuration
  updateSettings(settings: SonigraphSettings): void
  updateInstrumentVolume(instrument: string, volume: number): void
  setInstrumentEnabled(instrument: string, enabled: boolean): void
  
  // Issue #011: CDN sample management
  generateCDNDiagnosticReport(): void  // Comprehensive sample loading analysis
  
  // Phase 3: Performance optimization methods
  getEnabledInstrumentsForTesting(): string[]
  getDefaultInstrumentForTesting(frequency: number): string
  onInstrumentSettingsChanged(): void  // Invalidates cache
  
  // Effects Management
  updateEffectSettings(instrument: string, effect: string, settings: any): void
  toggleEffect(instrument: string, effect: string, enabled: boolean): void
  
  // Status and Monitoring
  getStatus(): AudioStatus
  getPerformanceMetrics(): PerformanceMetrics
  
  // Resource Management
  dispose(): void
}
```

**Configuration Interfaces:**
```typescript
interface SamplerConfig {
  urls: Record<string, string>;    // Note → filename mapping
  release: number;                 // Release time in seconds
  baseUrl: string;                // CDN base URL
  effects: string[];              // Applied effect names
}

interface InstrumentSettings {
  enabled: boolean;
  volume: number;
  maxVoices: number;
  effects: {
    reverb: ReverbSettings;
    chorus: ChorusSettings;
    filter: FilterSettings;
  };
}

// Phase 3: Performance mode configuration
// Issue #011: Updated settings interface
interface SonigraphSettings {
  // ... existing settings
  useHighQualitySamples: boolean; // Replaces audioFormat enum
  performanceMode?: {
    mode: 'low' | 'medium' | 'high' | 'ultra';
    enableFrequencyDetuning: boolean;
    maxConcurrentVoices: number;
    processingQuality: 'fast' | 'balanced' | 'high-quality';
    enableAudioOptimizations: boolean;
  };
}
```

## 2. Logging API

```typescript
// Logger Factory
function getLogger(component: string): ILogger

// Core Logger Interface
interface ILogger {
  debug(category: string, message: string, data?: any): void;
  info(category: string, message: string, data?: any): void;
  warn(category: string, message: string, data?: any): void;
  error(category: string, message: string, error?: Error): void;
  time(operation: string): () => void;
  enrichError(error: Error, context: any): Error;
  withContext(context: any): ContextualLogger;
}

// Configuration
interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath: string;
  maxSize: number;
  maxBackups: number;
  enableNotices: boolean;
}
```

## 3. UI Components API

```typescript
// Toggle Components
function createObsidianToggle(
  container: HTMLElement,
  initialValue: boolean,
  onChange: (value: boolean) => void,
  options: ToggleOptions
): HTMLElement

function createSimpleToggle(
  container: HTMLElement,
  initialValue: boolean,
  onChange: (value: boolean) => void,
  options: SimpleToggleOptions
): HTMLElement

// Material Design Components
class MaterialControlPanelModal extends Modal {
  constructor(app: App, plugin: SonigraphPlugin)
  onOpen(): void
  onClose(): void
  private showTab(tabId: string): void
  private updateStatus(): void
}

// Helper Functions
function updateToggleValue(checkbox: HTMLElement, value: boolean): void
function setToggleDisabled(checkbox: HTMLElement, disabled: boolean): void
```

---

*For related documentation, see:*
- [Audio Engine](audio-engine.md) - AudioEngine implementation details
- [Logging System](logging-system.md) - Logging implementation details
- [UI Components](ui-components.md) - UI Components implementation details
- [Overview](overview.md) - System integration