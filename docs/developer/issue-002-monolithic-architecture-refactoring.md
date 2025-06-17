# Issue #002: Monolithic Audio Engine Architecture - Refactoring Plan

**Status:** Identified  
**Priority:** High  
**Component:** Audio Engine  
**Affected Files:** `src/audio/engine.ts` (3,765 lines)  
**Last Updated:** 2025-06-17

## Problem Description

The main audio engine file (`src/audio/engine.ts`) has grown to 3,765 lines and handles multiple complex responsibilities in a single monolithic structure. This architectural debt is a **direct blocker** for implementing the performance optimizations needed to solve Issue #001 (audio crackling).

## Code Audit Results

### Critical Finding: `src/audio/engine.ts` (3,765 lines)
**Status:** 🚨 **CRITICAL - MONOLITHIC**

#### Current Responsibilities:
- 48 different instrument configurations (SAMPLER_CONFIGS)
- Audio context initialization and management
- Voice assignment and polyphony management
- Effect routing and processing chains
- Real-time playbook scheduling
- Performance optimization and CPU management
- Master volume and dynamics control
- Integration with Tone.js audio library
- Enhanced routing system management
- Advanced synthesis engine coordination

#### Critical Issues:
1. **Massive monolithic structure** - Single file handling multiple complex concerns
2. **Mixed abstraction levels** - Low-level audio routing mixed with high-level orchestration
3. **Huge data structures** - 48 instrument configs embedded directly in code
4. **Complex state management** - Multiple maps and state variables scattered throughout
5. **Performance bottlenecks** - Cannot implement Issue #001 solutions with current structure

### Other Audio Files (Well-Structured):
- `harmonic-engine.ts` (329 lines) - ✅ Good separation of concerns
- `percussion-engine.ts` (358 lines) - ✅ Clear modular design  
- `electronic-engine.ts` (391 lines) - ✅ Appropriate organization

## Impact on Issue #001

The monolithic architecture **prevents** implementing the performance optimizations identified in Issue #001:

- **Voice Management**: Cannot implement proper voice pools and stealing algorithms
- **Centralized Effects**: Shared effect buses require architectural separation
- **Web Worker Integration**: Mixed concerns make worker threading impossible
- **Performance Profiling**: CPU bottlenecks obscured by tangled responsibilities
- **Detuning System**: Frequency conflict resolution needs isolated voice management

## Refactoring Strategy

### Phase 1: Core Extractions (Immediate Priority)

#### 1. Extract Instrument Configurations
**Target:** `/src/audio/configs/`
```
/src/audio/configs/
├── keyboard-instruments.ts    (Piano, Harpsichord, Organ)
├── string-instruments.ts      (Violin, Viola, Cello, etc.)
├── brass-instruments.ts       (Trumpet, Horn, Trombone, etc.) 
├── vocal-instruments.ts       (Choir variants)
├── InstrumentConfig.ts        (Type definitions and validation)
└── index.ts                   (Barrel exports)
```

**Benefits:**
- Removes 1,000+ lines of embedded data from engine.ts
- Enables dynamic instrument loading
- Improves maintainability and testing
- Allows instrument-specific optimizations

#### 2. Create Voice Management System
**Target:** `/src/audio/voice-management/`
```
/src/audio/voice-management/
├── VoiceManager.ts           (Main orchestrator)
├── VoicePool.ts             (Pre-allocated voice instances)
├── VoiceAssignment.ts       (Assignment algorithms)
├── VoiceStealing.ts         (Stealing strategies)
└── types.ts                 (Voice-related types)
```

**Core Features:**
- Pre-allocated voice pools (32-64 voices)
- Voice stealing algorithms (longest-playing or lowest-gain priority)
- Polyphony limit enforcement
- Voice state management
- **Direct solution for Issue #001 CPU spikes**

#### 3. Build Effect Bus Architecture
**Target:** `/src/audio/effects/`
```
/src/audio/effects/
├── EffectBusManager.ts      (Central effect routing)
├── SendBus.ts              (Send/auxiliary buses)
├── ReturnBus.ts            (Return/master buses)
├── EffectChain.ts          (Effect processing chains)
└── EffectTypes.ts          (Effect configurations)
```

**Architecture:**
- Master reverb and chorus buses
- Auxiliary buses for instrument groups
- Replace per-instrument effects with Tone.Send routing
- **Direct solution for Issue #001 effect node overhead**

#### 4. Separate Audio Context Management
**Target:** `/src/audio/AudioContextManager.ts`
```typescript
class AudioContextManager {
  private context: Tone.Context;
  private transport: Tone.Transport;
  
  async initialize(): Promise<void>
  suspend(): Promise<void>
  resume(): Promise<void>
  dispose(): void
}
```

**Responsibilities:**
- Tone.js context lifecycle
- Transport management
- Audio context state tracking
- Device change handling

### Phase 2: Performance & Scheduling (Short-term)

#### 5. Extract Performance Management
**Target:** `/src/audio/PerformanceManager.ts`
```typescript
class PerformanceManager {
  private cpuUsage: number;
  private qualityMode: 'smooth' | 'balanced' | 'dense';
  
  monitor(): void
  adaptQuality(): void
  getRecommendedSettings(): AudioSettings
}
```

**Features:**
- CPU usage monitoring
- Adaptive quality modes (from Issue #001)
- Performance metrics collection
- Dynamic optimization triggers

#### 6. Separate Real-time Scheduling
**Target:** `/src/audio/AudioScheduler.ts`
```typescript
class AudioScheduler {
  private worker: Worker;
  private scheduleQueue: ScheduledEvent[];
  
  scheduleNote(note: NoteEvent): void
  scheduleSequence(events: NoteEvent[]): void
  startWorker(): void
}
```

**Features:**
- Web Worker integration for scheduling logic
- Non-blocking event queue management
- Precise timing coordination
- **Enables Issue #001 Web Worker solution**

### Phase 3: Refactored Core Engine

#### Target AudioEngine Class
**Target Size:** ~500-800 lines maximum
```typescript
class AudioEngine {
  private voiceManager: VoiceManager;
  private effectBusManager: EffectBusManager;
  private contextManager: AudioContextManager;
  private performanceManager: PerformanceManager;
  private scheduler: AudioScheduler;
  
  // High-level orchestration only
  async initialize(): Promise<void>
  playNote(note: NoteData): void
  setInstrument(id: string, config: InstrumentConfig): void
  dispose(): void
}
```

**Responsibilities (Orchestration Only):**
- Coordinate between specialized managers
- Maintain public API compatibility
- Handle high-level state management
- Delegate specific concerns to appropriate managers

## Implementation Sequence

### Priority 1: Voice Management (Highest Impact)
1. Create `VoiceManager` class with basic pooling
2. Extract voice assignment logic from engine.ts
3. Implement voice stealing algorithm
4. **Expected Impact:** Eliminate CPU spikes from object creation/destruction

### Priority 2: Effect Bus Architecture
1. Create `EffectBusManager` with shared reverb/chorus
2. Refactor instrument routing to use Tone.Send
3. Extract effect initialization from engine.ts
4. **Expected Impact:** Massive reduction in active effect nodes

### Priority 3: Instrument Configuration Extraction
1. Move `SAMPLER_CONFIGS` to separate files
2. Create `InstrumentConfig` validation system
3. Update engine.ts to load from external configs
4. **Expected Impact:** ~1,000 line reduction in engine.ts

### Priority 4: Context & Performance Management
1. Extract audio context lifecycle management
2. Create performance monitoring system
3. Implement adaptive quality modes
4. **Expected Impact:** Enable Issue #001 performance modes

## Migration Strategy

### Backward Compatibility
- Maintain existing public API during refactoring
- Use adapter pattern for gradual migration
- Comprehensive test coverage before extraction
- Incremental rollout with feature flags

### Testing Approach
```
/src/audio/__tests__/
├── VoiceManager.test.ts
├── EffectBusManager.test.ts
├── AudioContextManager.test.ts
├── integration/
│   ├── engine-integration.test.ts
│   └── performance.test.ts
└── fixtures/
    └── instrument-configs.ts
```

### Risk Mitigation
- Extract one component at a time
- Maintain full test coverage
- Performance benchmarking at each step
- Rollback plan for each extraction

## Success Metrics

### Code Quality Metrics
| Current State | Target State |
|---------------|--------------|
| 3,765-line monolith | 6-8 focused modules (~300-600 lines each) |
| Mixed concerns | Clear separation of responsibilities |
| Untestable complexity | Unit testable components |
| Scattered state | Centralized, managed state |

### Performance Metrics (Enables Issue #001 Solutions)
- Voice management CPU optimization
- Effect bus overhead reduction
- Memory allocation improvements
- Audio latency consistency

### Development Metrics
- Reduced time to implement new features
- Easier debugging and profiling
- Improved onboarding for new developers
- Better code review process

## Dependencies & Blockers

### Blocks Issue #001 Solutions
- Cannot implement voice management without extraction
- Centralized effects require architectural separation
- Web Worker integration impossible with current structure
- Performance profiling obscured by monolithic design

### Prerequisites
- Comprehensive test coverage of existing functionality
- Performance baseline measurements
- Development environment setup for modular testing

## Timeline Estimate

### Phase 1 (Core Extractions): 2-3 weeks
- Week 1: Voice management system
- Week 2: Effect bus architecture  
- Week 3: Instrument configuration extraction

### Phase 2 (Performance & Scheduling): 1-2 weeks
- Performance management extraction
- Audio scheduler implementation

### Phase 3 (Integration & Testing): 1 week
- Final integration testing
- Performance validation
- Documentation updates

**Total Estimated Time:** 4-6 weeks

## Next Steps

### Immediate Actions Required:
1. **Approval of refactoring plan**
2. **Create comprehensive test coverage** for existing engine.ts functionality
3. **Establish performance baselines** for comparison
4. **Begin Voice Management extraction** (highest impact for Issue #001)

### Development Sequence:
1. Create modular directory structure
2. Extract VoiceManager with basic functionality
3. Update engine.ts to use VoiceManager
4. Validate performance improvements
5. Continue with remaining extractions

## Related Issues

- **Issue #001**: Audio crackling - **BLOCKED** by this refactoring
- Future instrument expansion - **ENABLED** by modular configs
- Web Worker integration - **ENABLED** by separated concerns
- Performance optimization - **ENABLED** by focused profiling

---

*This refactoring is essential for solving Issue #001 and establishing a maintainable foundation for future audio engine development.*