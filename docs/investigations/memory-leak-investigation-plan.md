# Memory Leak Investigation Plan

## Issue Summary
Obsidian RAM usage increases from ~800MB to 2.6-2.7GB during Sonic Graph timeline animation and does not decrease after animation completes or view closes.

**Date Identified:** 2025-09-29
**Status:** Cleanup implemented, investigating GC behavior
**Priority:** High

---

## Current State (As of 2025-09-29)

### What We've Fixed
1. ✅ **TemporalGraphAnimator.destroy()** - Now clears timeline, nodes, links arrays
2. ✅ **GraphRenderer.destroy()** - Now clears nodes, links, and simulation data
3. ✅ **AdaptiveDetailManager.destroy()** - Added method to clear allNodes, allLinks, pending timeouts
4. ✅ **MusicalMapper.dispose()** - Now being called in SonicGraphView.onClose()
5. ✅ **All cleanup methods verified** - Log analysis confirms all destroy() methods ARE executing

### Memory Behavior Observed
```
Baseline (Obsidian only):        ~800 MB
Plugin enabled + view open:      1.1 GB  (+300 MB)
Timeline animation peak:         2.7 GB  (+1.6 GB)
After animation completes:       2.7 GB  (no change)
After view closes:               2.7 GB  (no change)
After manual GC attempt:         Not tested yet
```

### Key Finding
All cleanup logs appear correctly in console:
- "TemporalGraphAnimator destroyed and memory released" ✓
- "GraphRenderer destroyed and memory released" ✓
- "AdaptiveDetailManager destroyed and memory released" ✓
- "Disposing musical mapper" ✓
- "Disposing cluster audio mapper" ✓

**This suggests the issue is NOT missing cleanup code, but rather:**
1. JavaScript garbage collector not running (lazy GC)
2. Chromium/Electron holding memory for browser optimizations
3. Web Audio API decoded audio buffers not being released
4. Some circular reference preventing GC (despite cleanup)

---

## Investigation Plan for Tomorrow

### Test 1: Lazy Garbage Collection
**Goal:** Determine if memory is reclaimable but just not being collected

**Steps:**
1. Open Sonic Graph → note RAM
2. Run animation to peak → note RAM
3. Close view → note RAM
4. Wait 5 minutes idle → note RAM
5. Open/close another note → note RAM (might trigger GC)
6. Force GC via DevTools Performance tab → note RAM

**Expected if lazy GC:** Memory eventually drops after step 4, 5, or 6
**Expected if true leak:** Memory never drops

---

### Test 2: Isolation Testing
**Goal:** Identify which component is holding memory

**Test 2a: Graph Data Only**
```
1. Open Sonic Graph (don't start animation)
2. Note RAM increase from baseline
3. Close view immediately
4. Wait 1 minute
5. Check if RAM dropped
```
**If drops:** Graph data is being released properly
**If stays:** Leak in GraphRenderer/GraphDataExtractor

**Test 2b: Timeline Without Animation**
```
1. Open Sonic Graph
2. Switch to Timeline View (don't press play)
3. Note RAM
4. Close view
5. Check RAM
```
**If drops:** Timeline structure itself is clean
**If stays:** Leak in timeline initialization

**Test 2c: Animation Data Only**
```
1. Open Sonic Graph
2. Start animation, let it run 5 seconds
3. Stop animation manually
4. Note RAM
5. Close view
6. Check RAM after 1 minute
```
**If drops after stop:** Animation data is being cleared on stop()
**If stays:** Leak in animation loop or audio mapping

---

### Test 3: Audio Context Investigation
**Goal:** Check if Web Audio API is holding decoded buffers

**Steps:**
1. In DevTools Console, run:
   ```javascript
   // Check audio context state
   const audioContext = window.AudioContext || window.webkitAudioContext;
   console.log('Active contexts:', audioContext);

   // Get plugin's audio engine reference
   const plugin = app.plugins.plugins['sonigraph'];
   if (plugin && plugin.audioEngine) {
       console.log('Audio engine state:', plugin.audioEngine.getState());
       console.log('Active voices:', plugin.audioEngine.getActiveVoices());
   }
   ```
2. Before animation: note active voices/nodes
3. After animation completes: check if voices dropped to 0
4. After view closes: check if audio context is suspended

**If voices > 0 after close:** Audio engine not cleaning up properly
**If context still running:** Need to suspend/close audio context

---

### Test 4: Circular Reference Detection
**Goal:** Check if callbacks are preventing garbage collection

**Method:** Use Chrome DevTools Memory Profiler
1. Open DevTools → Memory tab
2. Take heap snapshot before opening Sonic Graph
3. Open Sonic Graph
4. Take snapshot after opening
5. Run animation to completion
6. Take snapshot after animation
7. Close view
8. Take snapshot after close
9. Compare snapshots looking for:
   - Detached DOM nodes
   - Event listeners still attached
   - Large arrays/objects retained
   - "TemporalGraphAnimator" instances still in memory

**Specifically look for:**
- `onVisibilityChanged` callbacks retaining `this` reference
- `onTimeChanged` callbacks retaining `this` reference
- `onAnimationEnded` callbacks retaining `this` reference
- `onNodeAppeared` callbacks retaining `this` reference

---

### Test 5: Force Graph (D3) Simulation Investigation
**Goal:** Check if D3 force simulation is holding references

**In Console after closing view:**
```javascript
// Check for lingering D3 simulations
d3.selectAll('canvas').nodes(); // Should be empty
d3.selectAll('svg').nodes(); // Should be empty

// Check GraphRenderer state (if accessible)
const plugin = app.plugins.plugins['sonigraph'];
// Try to access any views
app.workspace.getLeavesOfType('sonic-graph-view').length; // Should be 0
```

**If D3 nodes exist after close:** DOM not being cleaned properly
**If simulation is still in memory:** D3 force simulation not stopped

---

### Test 6: Memory Profiling Over Time
**Goal:** Create detailed memory profile

**Steps:**
1. Enable Chrome Performance Monitor:
   - DevTools → More tools → Performance monitor
   - Watch "JS heap size" metric
2. Run full workflow while watching graph:
   ```
   Open view → JS heap increases
   Start animation → JS heap spikes
   Animation ends → Does heap drop?
   Close view → Does heap drop?
   Wait 2 minutes → Does heap eventually drop?
   ```
3. Screenshot the graph for documentation

---

## Potential Solutions (Based on Investigation Results)

### If Lazy GC (Most Likely):
**Solution:** Accept this as browser behavior, but optimize memory usage:
- Reduce timeline event array size with aggressive filtering
- Implement streaming animation (don't pre-compute all events)
- Clear data in chunks during animation instead of only at end
- Add manual GC hint: `setTimeout(() => {}, 0)` after cleanup to hint GC

### If Web Audio Buffers:
**Solution:** Explicitly disconnect and clean audio nodes
```typescript
// In AudioEngine or voice management
voice.stop();
voice.disconnect(); // Make sure all nodes disconnect
voice.buffer = null; // Clear buffer reference
```

### If Circular References:
**Solution:** Break callback chains more aggressively
```typescript
// In TemporalGraphAnimator destroy()
this.onVisibilityChange = null; // Already doing this
this.onTimeUpdate = null;
this.onAnimationEnd = null;
this.onNodeAppear = null;

// Additionally break any closures
this.visibleNodes.clear();
this.visibleNodes = null; // Set to null, not just clear
```

### If D3 Force Simulation:
**Solution:** More aggressive D3 cleanup
```typescript
// In GraphRenderer.destroy()
this.simulation.stop();
this.simulation.nodes([]);
this.simulation.force('link', null);
this.simulation.force('charge', null);
this.simulation.force('center', null);
this.simulation = null; // Nullify the reference
```

---

## Code Changes to Consider

### Option 1: Incremental Timeline Cleanup
Instead of holding all events until destroy(), clear processed events:
```typescript
// In TemporalGraphAnimator animate loop
private processEvents(currentTime: number) {
  // Process events for current time
  const processed = this.timeline.filter(e => e.timestamp <= currentTime);

  // Remove processed events from array (free memory incrementally)
  this.timeline = this.timeline.filter(e => e.timestamp > currentTime);
}
```

### Option 2: Explicit Memory Release Hint
Add a helper to hint GC after cleanup:
```typescript
// In SonicGraphView.onClose()
async onClose() {
  // ... existing cleanup ...

  // Hint garbage collector
  await this.hintGarbageCollection();
}

private async hintGarbageCollection(): Promise<void> {
  // Multiple microtasks to give GC chances to run
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

### Option 3: Streaming Timeline Animation
Don't pre-compute all events, compute them on-demand:
```typescript
// Instead of building full timeline array
private generateTimelineEvents() {
  // Current: Creates 10,000+ events upfront
  this.timeline = this.nodes.map(/* ... */); // 1GB+ of data
}

// Proposed: Generate events on-demand
private getEventsForTimeRange(startTime: number, endTime: number) {
  // Only compute events needed for current window
  // Max 100 events in memory at once
}
```

---

## Success Criteria

### Minimum Acceptable:
- Memory drops within 5 minutes after view close
- Peak memory during animation < 2GB (currently 2.7GB)
- Memory returns to baseline + 100MB after GC runs

### Ideal:
- Memory drops within 30 seconds after view close
- Peak memory during animation < 1.5GB
- Memory returns to baseline immediately after close

---

## Notes & References

### Related Files
- `src/ui/SonicGraphView.ts` - View lifecycle and cleanup
- `src/graph/TemporalGraphAnimator.ts` - Timeline event storage
- `src/graph/GraphRenderer.ts` - D3 force simulation
- `src/graph/AdaptiveDetailManager.ts` - Filtered graph data
- `src/graph/musical-mapper.ts` - Audio mapping and managers

### Useful DevTools Commands
```javascript
// Force GC (if exposed)
if (global.gc) global.gc();

// Check memory usage
console.log(process.memoryUsage());

// Find all Sonic Graph views
app.workspace.getLeavesOfType('sonic-graph-view');

// Check plugin state
app.plugins.plugins['sonigraph'];
```

### Log Analysis Queries
```bash
# Check cleanup execution
grep -i "destroyed and memory released" logs.json

# Check for errors during cleanup
grep -i "error.*cleanup" logs.json

# Check animation lifecycle
grep -i "animation.*started\|stopped\|ended" logs.json
```

---

## Next Steps

1. **Tomorrow morning:** Run Test 1 (Lazy GC test) first
2. If memory doesn't drop → Run Test 4 (Circular reference detection)
3. If memory does drop → Run Test 6 (Memory profiling over time)
4. Document findings in this file
5. Implement appropriate solution from "Potential Solutions" section

---

## Investigation Log

### 2025-09-29 Evening
- Implemented cleanup methods for 4 major components
- Verified cleanup is executing via log analysis
- Memory still high after cleanup (2.7GB)
- All destroy() methods confirmed working
- Created this investigation plan for systematic debugging

### [Date TBD] - Investigation Results
[To be filled in after running tests tomorrow]