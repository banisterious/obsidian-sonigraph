# Known Issues Registry

## Table of Contents

1. [Audio Crackling and Musical Density Trade-off](#issue-001-audio-crackling-and-musical-density-trade-off)
2. [Monolithic Audio Engine Architecture](#issue-002-monolithic-audio-engine-architecture)

---

## Issue Tracking

| Issue # | Status | Priority | Component | Summary | Details |
|---------|--------|----------|-----------|---------|---------|
| 001 | In Progress | High | Audio Engine | Audio crackling vs musical density trade-off | [Technical Analysis](./issue-001-audio-crackling-solution.md) |
| 002 | Identified | High | Audio Engine | Monolithic audio engine architecture | [Refactoring Plan](./issue-002-monolithic-architecture-refactoring.md) |

---

## Issue #001: Audio Crackling and Musical Density Trade-off

**Status:** In Progress  
**Priority:** High  
**Component:** Audio Engine  
**Affected Files:** `src/audio/engine.ts`, `src/graph/musical-mapper.ts`

### Summary

Audio crackling occurs during real-time synthesis playback when multiple notes trigger close together. Current workaround uses sparse timing (1.5s gaps, 0.2-0.8s durations) which eliminates crackling but severely reduces musical density.

### Root Causes
- Tone.js PolySynth complexity causing CPU spikes
- Same-frequency interference (multiple 261.6Hz notes)
- Note overlap from original 3+ second durations
- WebAudio performance limits in Electron

### Current Status
- **Workaround**: Sparse timing prevents crackling but limits musical richness
- **Next Phase**: Implement voice management, centralized effects, and frequency detuning
- **Target**: Rich musical density without audio artifacts

### Detailed Analysis
👉 **[Complete Technical Analysis & Implementation Plan](./issue-001-audio-crackling-solution.md)**

### Related Issues

- Real-time scheduling implementation (resolved)
- Synthesis instrument routing (resolved)
- Transport.schedule() timing bugs (resolved)

### Test Cases

**Crackling Test:**
1. Enable all default instruments
2. Play for 60+ seconds
3. Listen for audio artifacts

**Density Test:**
1. Compare note frequency with original approach
2. Measure musical expressiveness
3. User subjective experience rating

---

## Issue #002: Monolithic Audio Engine Architecture

**Status:** Identified  
**Priority:** High  
**Component:** Audio Engine  
**Affected Files:** `src/audio/engine.ts` (3,765 lines)

### Summary

The main audio engine file has grown to 3,765 lines handling instrument configs, voice management, effects, and scheduling in a single monolithic structure. This prevents implementing the performance optimizations needed for Issue #001.

### Root Causes
- Mixed abstraction levels and responsibilities
- 48 instrument configurations embedded directly in code  
- Complex state management scattered throughout
- Cannot implement proper voice management or centralized effects

### Current Status
- **Blocker**: Prevents Issue #001 performance solutions
- **Next Phase**: Extract voice management, effect buses, and instrument configs
- **Target**: Modular architecture enabling performance optimizations

### Refactoring Plan
1. Extract instrument configurations to `/src/audio/configs/`
2. Create voice management system in `/src/audio/voice-management/`  
3. Build effect bus architecture in `/src/audio/effects/`
4. Separate audio context management
5. Target: 6-8 focused modules (~300-600 lines each)

---

*Last Updated: 2025-06-17*  
*Next Review: After refactoring plan approval*