# Known Issues Registry

## Table of Contents

1. [Audio Crackling and Musical Density Trade-off](#issue-001-audio-crackling-and-musical-density-trade-off)

---

## Issue Tracking

| Issue # | Status | Priority | Component | Summary | Details |
|---------|--------|----------|-----------|---------|---------|
| 001 | In Progress | High | Audio Engine | Audio crackling vs musical density trade-off | [Technical Analysis](./issue-001-audio-crackling-solution.md) |

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

*Last Updated: 2025-06-17*  
*Next Review: TBD based on user feedback*