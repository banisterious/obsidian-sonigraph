# Sonigraph Architecture

## Table of Contents

- [1. System Overview](#1-system-overview)
  - [1.1. Core Components](#11-core-components)
  - [1.2. Technology Stack](#12-technology-stack)
  - [1.3. Module Structure](#13-module-structure)
- [2. Audio Engine](#2-audio-engine)
  - [2.1. Architecture](#21-architecture)
  - [2.2. Instrument Implementation](#22-instrument-implementation)
  - [2.3. Effects Processing](#23-effects-processing)
  - [2.4. Voice Management](#24-voice-management)
  - [2.5. Performance Optimization](#25-performance-optimization)
- [3. Logging System](#3-logging-system)
  - [3.1. Architecture](#31-architecture)
  - [3.2. Components](#32-components)
  - [3.3. Usage Patterns](#33-usage-patterns)
  - [3.4. Configuration](#34-configuration)
- [4. UI Components](#4-ui-components)
  - [4.1. Component System](#41-component-system)
  - [4.2. Obsidian Integration](#42-obsidian-integration)
  - [4.3. Material Design Implementation](#43-material-design-implementation)
- [5. Graph Processing](#5-graph-processing)
  - [5.1. Data Acquisition](#51-data-acquisition)
  - [5.2. Musical Mapping](#52-musical-mapping)
  - [5.3. Sequence Generation](#53-sequence-generation)
- [6. Performance & Monitoring](#6-performance--monitoring)
  - [6.1. Performance Considerations](#61-performance-considerations)
  - [6.2. Monitoring Systems](#62-monitoring-systems)
  - [6.3. Optimization Strategies](#63-optimization-strategies)
- [7. API Reference](#7-api-reference)
  - [7.1. AudioEngine API](#71-audioengine-api)
  - [7.2. Logging API](#72-logging-api)
  - [7.3. UI Components API](#73-ui-components-api)

---

## 1. System Overview

### 1.1. Core Components

Sonigraph is built on a modular architecture designed for scalability and maintainability:

- **AudioEngine**: Orchestral audio synthesis with 34 instruments
- **Graph Parser**: Obsidian vault data extraction and processing
- **Musical Mapper**: Graph-to-music parameter conversion
- **Control Center**: Professional 6-tab Material Design interface
- **Logging System**: Enterprise-grade logging with multiple adapters
- **Effects Engine**: Per-instrument effects processing with master bus

### 1.2. Technology Stack

**Core Technologies:**
- **Language**: TypeScript with strict type checking
- **Audio Framework**: Tone.js v14.8.49 for Web Audio synthesis
- **Build System**: ESBuild for fast compilation and bundling
- **Plugin API**: Obsidian Plugin API with full type definitions
- **UI Framework**: Custom Material Design components

**Dependencies:**
- `tone`: Advanced audio synthesis and effects
- `obsidian`: Plugin API types and utilities
- Build tools: ESBuild configuration for production builds

### 1.3. Module Structure

```
src/
├── main.ts                 # Plugin entry point and lifecycle
├── graph/
│   ├── parser.ts          # Vault data extraction
│   ├── musical-mapper.ts  # Graph-to-music mapping
│   └── types.ts           # Graph data interfaces
├── audio/
│   ├── engine.ts          # Main orchestral audio engine
│   ├── harmonic-engine.ts # Harmonic processing
│   ├── percussion-engine.ts # Advanced percussion synthesis
│   └── electronic-engine.ts # Electronic synthesis suite
├── ui/
│   ├── control-panel-md.ts # Material Design control center
│   ├── settings.ts        # Settings management
│   ├── components.ts      # Reusable UI components
│   ├── lucide-icons.ts    # Icon system integration
│   └── material-components.ts # Material Design components
├── utils/
│   ├── constants.ts       # Configuration and defaults
│   └── [utilities]
└── logging.ts             # Logging system
```

---

## 2. Audio Engine

### 2.1. Architecture

The AudioEngine serves as the central orchestrator for all audio operations, managing 34 instruments across 7 orchestral families.

**Core Components:**
- **Instrument Management**: Dynamic instrument initialization and voice allocation
- **Effects Processing**: Per-instrument effects chains with master bus
- **Synthesis Engines**: Specialized engines for different instrument types
- **Performance Monitoring**: Real-time CPU and memory tracking

**File Structure:**
```
src/audio/
├── engine.ts           # Main AudioEngine class
├── harmonic-engine.ts  # Harmonic processing
├── percussion-engine.ts # Physics-based percussion synthesis
└── electronic-engine.ts # Analog-style electronic synthesis
```

### 2.2. Instrument Implementation

**34-Instrument Orchestral System:**

| Family | Instruments | Synthesis Approach | Key Features |
|--------|-------------|-------------------|-------------|
| **Keyboard** | Piano, Organ, Electric Piano, Harpsichord, Accordion, Celesta | Sample-based + specialized synthesis | Authentic articulation, velocity sensitivity |
| **Strings** | Strings, Violin, Cello, Guitar, Harp | Sample-based + string modeling | Bowing simulation, Karplus-Strong synthesis |
| **Brass** | Trumpet, French Horn, Trombone, Tuba | Sample-based + brass formants | Metallic timbre, breath control |
| **Woodwinds** | Flute, Clarinet, Saxophone, Oboe | Sample-based + breath modeling | Reed simulation, formant filtering |
| **Vocals** | Choir, Vocal Pads, Soprano, Alto, Tenor, Bass | Sample-based + formant synthesis | Vowel morphing, breath patterns |
| **Percussion** | Timpani, Xylophone, Vibraphone, Gongs | Physics modeling + transient synthesis | Pitch bending, metallic resonance |
| **Electronic** | Pad, Lead Synth, Bass Synth, Arp Synth | Classic analog synthesis | Filter modulation, LFO control |
| **Environmental** | Whale Song | Scientific recordings + oceanic effects | Ultra-long sustains, wide spectrum |

**Sample Loading Strategy:**
- External CDN samples for high-quality realistic sounds
- Browser caching for performance optimization
- Graceful fallback to synthesis when samples unavailable
- One-time download (~30-40MB total) with persistent caching

**Voice Assignment Strategies:**
1. **Frequency-based**: Assigns instruments based on pitch ranges
2. **Round-robin**: Cycles through enabled instruments
3. **Connection-based**: Uses graph connectivity for consistent assignment

### 2.3. Effects Processing

**Per-Instrument Effects System:**
Each instrument supports individual effects chains with real-time parameter control.

**Available Effects:**
- **Reverb**: Spatial depth and realism (configurable decay, pre-delay, wet/dry)
- **Chorus**: Movement and richness (rate, depth, delay time, feedback)
- **Filter**: Tonal shaping (frequency, Q, type: lowpass/highpass/bandpass)

**Master Effects Bus:**
- **Orchestral Reverb**: Global spatial processing
- **3-Band EQ**: Master frequency shaping
- **Compressor**: Dynamic range control
- **Limiter**: Peak limiting for safe output levels

**Effect Configuration Examples:**
```typescript
// Piano: Clean, precise sound
piano: {
  reverb: { decay: 1.8, preDelay: 0.02, wet: 0.25 },
  chorus: { enabled: false },
  filter: { enabled: false }
}

// Strings: Lush, sustained processing
strings: {
  reverb: { decay: 3.5, preDelay: 0.01, wet: 0.4 },
  chorus: { enabled: false },
  filter: { frequency: 3500, type: 'lowpass' }
}

// Organ: Rich, church-like character
organ: {
  reverb: { decay: 2.8, preDelay: 0.02, wet: 0.3 },
  chorus: { frequency: 0.8, depth: 0.5, delayTime: 4, feedback: 0.2 },
  filter: { enabled: false }
}
```

### 2.4. Voice Management

**Polyphonic Voice System:**
- **Default Voice Limit**: 4-8 voices per instrument
- **Total System Limit**: Dynamic based on performance monitoring
- **Voice Stealing**: Intelligent allocation when limits exceeded
- **Resource Pooling**: Efficient voice reuse and cleanup

**Adaptive Quality System:**
```typescript
interface QualityLevel {
  high: { voices: 8, effects: 'full', sampleRate: 44100 },
  medium: { voices: 6, effects: 'essential', sampleRate: 44100 },
  low: { voices: 4, effects: 'minimal', sampleRate: 22050 }
}
```

### 2.5. Performance Optimization

**Memory Management:**
- Sample caching with intelligent preloading
- Automatic garbage collection for unused voices
- Resource pooling for effects and synthesis components
- Total memory footprint: ~30-40MB when fully loaded

**CPU Optimization:**
- Hardware-accelerated Web Audio processing
- Polyphony limits to prevent overload
- Performance monitoring with automatic quality adjustment
- Target: <25% CPU usage under normal operation

**Network Optimization:**
- One-time sample downloads with persistent browser caching
- CDN-based sample delivery for global performance
- Compression and efficient sample formats

---

## 3. Logging System

### 3.1. Architecture

The logging system provides enterprise-grade logging capabilities with flexibility, performance, and extensibility.

**Core Principles:**
- **Flexibility**: Multiple output targets (console, file, notices)
- **Performance**: Minimal overhead, especially for disabled log levels
- **Testability**: Easy to mock and verify in tests
- **Defensive Coding**: Built with reliability in mind
- **Extensibility**: Easy to add new outputs or formatters

### 3.2. Components

**Core Components:**
- **LogManager**: Central singleton managing all loggers and adapters
- **Logger**: Implementation of the ILogger interface
- **LoggerFactory**: Creates and configures loggers
- **SafeLogger**: Simple logger for early initialization

**Adapters:**
- **ConsoleAdapter**: Logs to the browser console
- **FileAdapter**: Logs to files with rotation
- **NoticeAdapter**: Shows logs as Obsidian notices
- **NullAdapter**: No-op adapter for testing

**Formatters:**
- **StandardFormatter**: Default text formatting
- **JSONFormatter**: Structured JSON output for analysis

**Interfaces:**
```typescript
interface ILogger {
  debug(category: string, message: string, data?: any): void;
  info(category: string, message: string, data?: any): void;
  warn(category: string, message: string, data?: any): void;
  error(category: string, message: string, error?: Error): void;
  time(operation: string): () => void;
  enrichError(error: Error, context: any): Error;
  withContext(context: any): ContextualLogger;
}
```

### 3.3. Usage Patterns

**Basic Usage:**
```typescript
import { getLogger } from 'src/logging';

const logger = getLogger('AudioEngine');

// Standard logging
logger.debug('initialization', 'Starting audio engine setup');
logger.info('playback', 'Sequence started successfully');
logger.warn('performance', 'High CPU usage detected');
logger.error('audio', 'Failed to initialize synthesizer', error);
```

**Contextual Logging:**
```typescript
const userLogger = logger.withContext({ 
  userId: user.id, 
  sessionId: session.id 
});

// All logs include context automatically
userLogger.info('login', 'User logged in successfully');
```

**Performance Timing:**
```typescript
function expensiveOperation() {
  const endTimer = logger.time('expensiveOperation');
  // ... do work
  endTimer(); // Logs duration automatically
}
```

### 3.4. Configuration

```typescript
interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath: string;
  maxSize: number;
  maxBackups: number;
  enableNotices: boolean;
}

// Initialize with configuration
loggerFactory.initialize({
  level: 'debug',
  enableConsole: true,
  enableFile: true,
  logFilePath: 'logs/debug.log',
  maxSize: 1024 * 1024, // 1MB
  maxBackups: 3,
  enableNotices: true
});
```

---

## 4. UI Components

### 4.1. Component System

The UI system provides standardized Obsidian-compatible components that ensure perfect visual consistency with the native interface.

**Component Architecture:**
- **Material Design Foundation**: Monochrome styling using Obsidian's color scheme
- **Lucide Icons**: Consistent iconography via Obsidian's built-in icon system
- **Reusable Components**: Modular components for consistent interface elements
- **Responsive Design**: Adaptive layouts for different screen sizes

### 4.2. Obsidian Integration

**Toggle Components:**

**`createObsidianToggle()`** - Full settings-style toggle:
```typescript
const checkbox = createObsidianToggle(
  container,
  true, // initial value
  (value) => console.log('Toggle changed:', value),
  {
    name: 'Enable Feature',
    description: 'Turn this feature on or off',
    disabled: false
  }
);
```

**DOM Structure:**
```html
<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Setting Name</div>
    <div class="setting-item-description">Setting description</div>
  </div>
  <div class="setting-item-control">
    <div class="checkbox-container is-enabled">
      <input type="checkbox" tabindex="0" checked>
    </div>
  </div>
</div>
```

**State Management:**
- `checkbox-container` - Base container class
- `is-enabled` - Added when toggle is ON
- `is-disabled` - Added when toggle is disabled

### 4.3. Material Design Implementation

**Control Center Modal Structure:**
```typescript
class MaterialControlPanelModal extends Modal {
  private activeTab: string = 'status';
  private tabContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private appBar: HTMLElement;
  private drawer: HTMLElement;
  private playButton: HTMLElement;
  private instrumentToggles: Map<string, HTMLElement> = new Map();
}
```

**Family-Based Tab Architecture:**
- **Navigation Drawer**: Left sidebar with 10-tab navigation organized by family
- **Content Area**: Dynamic content switching based on active tab
- **Sticky Header**: Fixed header with title and global action buttons
- **Material Design**: Monochrome styling using Obsidian's native color scheme

**Ten-Tab Interface System:**

**Core Tabs (3 tabs):**
1. **Status Tab**: Real-time system diagnostics and performance metrics
2. **Musical Tab**: Scale selection, root note, tempo, traversal methods
3. **Master Tab**: Global controls, master effects, and bulk operations

**Instrument Family Tabs (7 tabs):**
1. **Strings Tab**: String family instruments (violin, cello, guitar, harp, piano, strings)
2. **Woodwinds Tab**: Woodwind family (flute, clarinet, saxophone, oboe)
3. **Brass Tab**: Brass family (trumpet, french horn, trombone, tuba)
4. **Vocals Tab**: Vocal family (choir, vocal pads, soprano, alto, tenor, bass)
5. **Percussion Tab**: Percussion family (timpani, xylophone, vibraphone, gongs)
6. **Electronic Tab**: Electronic family (pad, lead synth, bass synth, arp synth)
7. **Experimental Tab**: Experimental/environmental sounds (whale song)

**Material Components:**
- **MaterialCard**: Standardized card components with elevation
- **StatCard**: Real-time status display cards
- **InstrumentCard**: Individual instrument control interface
- **EffectSection**: Effects parameter controls
- **ActionChip**: Interactive action buttons
- **MaterialSlider**: Consistent slider controls
- **MaterialButton**: Standardized button components

**CSS Integration:**
```css
:root {
  --md-surface: var(--background-secondary);
  --md-surface-variant: var(--background-modifier-border);
  --md-primary: var(--interactive-accent);
  --md-on-surface: var(--text-normal);
  --md-outline: var(--background-modifier-border);
}
```

---

## 5. Graph Processing

### 5.1. Data Acquisition

**Graph Data Sources:**
- Obsidian vault files via `app.vault.getFiles()`
- Internal link parsing from markdown content
- Metadata extraction from frontmatter
- Plugin compatibility (Extended Graph, Folders to Graph)

**Processing Pipeline:**
1. **File Discovery**: Enumerate all markdown files in vault
2. **Link Extraction**: Parse `[[note name]]` syntax and resolve connections
3. **Metadata Processing**: Extract frontmatter and file statistics
4. **Graph Construction**: Build weighted adjacency list representation
5. **Analysis**: Calculate node properties (degree, centrality, clustering)

### 5.2. Musical Mapping

**Parameter Mapping System:**
```typescript
interface MusicalMapping {
  nodeId: string;
  instrument: string;
  frequency: number;    // Derived from connections/position
  duration: number;     // Derived from content length
  velocity: number;     // Derived from importance/centrality
  timing: number;       // Derived from creation/modification time
}
```

**Mapping Strategies:**
- **Node Connections → Pitch**: More connections = higher pitch
- **Word Count → Duration**: More content = longer notes
- **Node Importance → Velocity**: More important = louder
- **Modification Time → Timing**: Recently modified = plays sooner

### 5.3. Sequence Generation

**Sequence Processing:**
1. **Graph Analysis**: Calculate statistical properties for mapping
2. **Scale Application**: Apply selected musical scale constraints
3. **Instrument Assignment**: Distribute notes across enabled instruments
4. **Timing Calculation**: Generate precise timing for audio scheduling
5. **Harmonic Processing**: Apply consonance rules and chord detection
6. **Audio Scheduling**: Queue events in Tone.js Transport system

---

## 6. Performance & Monitoring

### 6.1. Performance Considerations

**Memory Usage:**
- **Sample Caching**: ~30-40MB for complete instrument library
- **Voice Management**: Dynamic allocation with automatic cleanup
- **Effect Processing**: Hardware-accelerated where available
- **Graph Data**: Efficient structures with incremental updates

**CPU Usage:**
- **Target Performance**: <25% CPU under normal operation
- **Adaptive Quality**: Automatic performance scaling based on system load
- **Voice Limits**: Polyphony restrictions to prevent overload
- **Scheduling Optimization**: Efficient audio event scheduling

### 6.2. Monitoring Systems

**Real-Time Performance Monitoring:**
```typescript
interface PerformanceMetrics {
  cpuUsage: number;        // Percentage of CPU utilization
  latency: number;         // Audio latency in milliseconds
  activeVoices: number;    // Currently playing voices
  memoryUsage: number;     // Estimated memory consumption
  qualityLevel: 'high' | 'medium' | 'low';
}
```

**Performance Tracking:**
- CPU usage monitoring every 5 seconds
- Audio latency measurement and reporting
- Active voice counting across all instruments
- Memory usage estimation and tracking
- Quality level automatic adjustment

### 6.3. Optimization Strategies

**Adaptive Performance Scaling:**
```typescript
class PerformanceOptimizer {
  private checkPerformanceAndAdapt(): void {
    const metrics = this.gatherMetrics();
    
    if (metrics.cpuUsage > 80) {
      this.reduceQuality('high' → 'medium');
    } else if (metrics.cpuUsage > 90) {
      this.reduceQuality('medium' → 'low');
    }
  }
  
  private reduceQuality(level: QualityLevel): void {
    // Reduce voice limits, disable non-essential effects
    // Lower sample rates, simplify processing
  }
}
```

**Emergency Performance Mode:**
- Automatic activation when CPU > 90%
- Reduced voice limits and simplified effects
- Minimal processing for essential functionality
- Graceful degradation without audio dropouts

---

## 7. API Reference

### 7.1. AudioEngine API

```typescript
class AudioEngine {
  // Initialization
  async initialize(): Promise<void>
  
  // Playback Control
  async playSequence(sequence: MusicalMapping[]): Promise<void>
  stop(): void
  async playTestNote(frequency?: number): Promise<void>
  
  // Configuration
  updateSettings(settings: SonigraphSettings): void
  updateInstrumentVolume(instrument: string, volume: number): void
  setInstrumentEnabled(instrument: string, enabled: boolean): void
  
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
```

### 7.2. Logging API

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

### 7.3. UI Components API

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

*This document provides the complete architectural overview of the Sonigraph plugin. For development roadmap and implementation status, see [Development Roadmap](planning/development-roadmap.md).*
