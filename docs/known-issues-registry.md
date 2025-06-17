# Known Issues Registry

## Table of Contents

1. [Audio Crackling and Musical Density Trade-off](#issue-001-audio-crackling-and-musical-density-trade-off)

---

## Issue Tracking

| Issue # | Status | Priority | Component | Summary |
|---------|--------|----------|-----------|---------|
| 001 | Open | High | Audio Engine | Audio crackling vs musical density trade-off |

---

## Issue #001: Audio Crackling and Musical Density Trade-off

**Status:** Open  
**Priority:** High  
**Component:** Audio Engine  
**Affected Files:** `src/audio/engine.ts`, `src/graph/musical-mapper.ts`

### Problem Description

Audio crackling occurs during real-time synthesis playback, particularly when multiple notes trigger close together or overlap. Current solution eliminates crackling by enforcing sparse timing (1.5s minimum gaps, 0.2-0.8s durations), but this severely reduces musical density and may not meet user expectations for rich musical experiences.

### Root Cause Analysis

1. **Tone.js PolySynth Complexity**: Complex synthesis algorithms cause CPU spikes
2. **Same-frequency Interference**: Multiple notes at 261.6Hz (C4) create phase conflicts  
3. **Note Overlap**: Original 3+ second durations with 0.5s spacing created heavy overlap
4. **Electron WebAudio Limitations**: Browser-based synthesis hitting performance limits

### Current Workaround

- **1.5 second minimum spacing** between notes
- **0.2-0.8 second maximum durations**
- **Effects bypassed** (reverb, chorus, filter disabled)
- **400ms timer intervals** with single note per tick
- **Monophonic synthesis** (maxPolyphony: 1)

**Result:** Clean audio but sparse musical experience

### Technical Details

**Before Fix:**
```
Note timing: 0.8s, 1.6s, 2.4s (0.8s gaps)
Note duration: 3+ seconds
Result: Heavy overlap → crackling
```

**After Fix:**
```
Note timing: 0s, 1.5s, 3.0s (1.5s gaps)  
Note duration: 0.2-0.8s
Result: No overlap → clean but sparse
```

### Decision Points Required

#### 1. User Experience Philosophy
- **Option A**: Prioritize audio quality (current sparse approach)
- **Option B**: Prioritize musical richness (accept some crackling)
- **Option C**: Provide user choice via settings

#### 2. Technical Approach
- **Option A**: Keep current Tone.js with performance settings
- **Option B**: Replace with native WebAudio oscillators
- **Option C**: Implement hybrid approach (simple synthesis + effects)

#### 3. Configuration Strategy
- **Option A**: Hard-coded optimal settings
- **Option B**: User-configurable performance modes:
  - `smooth`: Sparse timing, no crackling
  - `balanced`: Moderate density, minimal crackling  
  - `dense`: Original density, accept crackling
- **Option C**: Advanced per-parameter controls

### Proposed Solutions

#### Solution 1: Performance Mode Settings
```typescript
audioPerformance: 'smooth' | 'balanced' | 'dense'
```
- **Smooth**: Current sparse approach (1.5s gaps, 0.8s max duration)
- **Balanced**: Medium density (0.8s gaps, 1.5s max duration)  
- **Dense**: Original approach (0.5s gaps, 3s+ duration)

#### Solution 2: Native WebAudio Synthesis
Replace Tone.js PolySynth with native oscillators:
```javascript
// Simple, efficient synthesis
const osc = context.createOscillator();
const gain = context.createGain();
// Direct connection: osc → gain → destination
```

#### Solution 3: Frequency Distribution
Instead of many 261.6Hz notes, spread across musical scale:
- Reduce same-frequency conflicts
- Maintain musical density
- Preserve harmonic relationships

### Impact Assessment

| Approach | Audio Quality | Musical Density | CPU Usage | User Complexity |
|----------|---------------|-----------------|-----------|-----------------|
| Current (Sparse) | Excellent | Poor | Low | Low |
| Performance Modes | Variable | Variable | Variable | Medium |
| Native WebAudio | Good | Excellent | Low | Low |
| Frequency Distribution | Good | Good | Medium | Low |

### Next Steps

**Immediate:**
1. Test current sparse approach with users
2. Gather feedback on musical density requirements
3. Decide on user experience priority

**Short-term:**
1. Implement chosen approach based on feedback
2. Add configuration options if needed
3. Update documentation

**Long-term:**
1. Consider alternative synthesis libraries
2. Evaluate pre-rendered sample approach
3. Optimize for different hardware capabilities

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