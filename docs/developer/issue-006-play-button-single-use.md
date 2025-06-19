# Issue #006: Play Button Single-Use Problem

**Status:** 🔍 ACTIVE  
**Priority:** High  
**Component:** UI Components / Audio Engine  
**Last Updated:** 2025-06-19

**Configuration:** ✅ **FUNCTIONAL** - Play button triggers correctly on first use  
**Repeat Usage:** ❌ **BROKEN** - Button becomes non-functional after first use

## Table of Contents

- [Overview](#overview)
- [Problem Analysis](#problem-analysis)
  - [Current Behavior](#current-behavior)
  - [Expected Behavior](#expected-behavior)
  - [User Impact](#user-impact)
- [Technical Investigation](#technical-investigation)
  - [Event Handler Lifecycle](#event-handler-lifecycle)
  - [AudioEngine State Management](#audioengine-state-management)
  - [UI State Synchronization](#ui-state-synchronization)
- [Reproduction Steps](#reproduction-steps)
- [Debugging Strategy](#debugging-strategy)
- [Next Steps](#next-steps)

---

## Overview

The Play button in Sonigraph's Control Center becomes completely non-functional after the first use within an Obsidian session. Users must reload the entire Obsidian application to regain Play button functionality, severely impacting workflow and testing capabilities.

**Key Challenge:** Core user interaction is broken after first use, making the plugin effectively single-use per session and blocking iterative audio testing workflows.

---

## Problem Analysis

### Current Behavior

**First Use:**
- ✅ Play button responds to clicks
- ✅ Audio processing begins correctly
- ✅ Sequence generation and playback function normally
- ✅ Stop functionality works as expected

**Subsequent Uses:**
- ❌ Play button becomes completely unresponsive
- ❌ No visible feedback when clicked
- ❌ No audio processing initiated
- ❌ No console errors or visible state changes

### Expected Behavior

**Every Use:**
- ✅ Play button should respond consistently to clicks
- ✅ Audio processing should initiate reliably
- ✅ Multiple play/stop cycles should work seamlessly
- ✅ UI state should reset properly between sessions

### User Impact

**Workflow Disruption:**
- Users cannot iterate on audio settings without Obsidian restart
- Testing instrument configurations becomes extremely cumbersome
- Development and debugging processes are severely hindered
- User experience is fundamentally broken for core functionality

**Severity:** **HIGH** - This blocks the primary use case of the plugin

---

## Technical Investigation

### Event Handler Lifecycle

**Potential Issues:**
1. **Event Listener Removal**: Click handlers may be getting unbound after first use
2. **DOM State Corruption**: Button element state may become corrupted
3. **Event Propagation**: Event handling chain may break after initial trigger
4. **Memory Leaks**: Event handlers accumulating without proper cleanup

### AudioEngine State Management

**State Persistence Issues:**
1. **Initialization Flags**: `isInitialized` or similar flags not resetting properly
2. **Resource Cleanup**: Audio resources not being properly disposed between uses
3. **Context State**: Web Audio API context may enter invalid state
4. **Transport State**: Tone.js Transport not resetting correctly

### UI State Synchronization

**Interface Problems:**
1. **Button State**: Play button UI state not syncing with functionality
2. **Loading States**: Button may be stuck in "loading" or "playing" state
3. **Class Management**: CSS classes not updating correctly
4. **Component Lifecycle**: React/UI component not re-rendering properly

---

## Reproduction Steps

### Reliable Reproduction

**Setup:**
1. Fresh Obsidian session with Sonigraph loaded
2. Open Control Center modal
3. Enable any instrument family

**Test Sequence:**
1. **First Use**: Click Play button → ✅ Works correctly
2. **Wait**: Let sequence complete naturally OR click Stop
3. **Second Use**: Click Play button → ❌ No response
4. **Verification**: Try multiple additional clicks → ❌ Still no response
5. **Recovery**: Reload Obsidian → ✅ Play button works again (once)

**Consistency:** Issue occurs 100% of the time across all tested scenarios

### Isolation Testing

**Component Testing:**
- [ ] Test with different instrument combinations
- [ ] Test with manual stop vs automatic completion
- [ ] Test with different sequence lengths
- [ ] Test with Control Center close/reopen between uses

---

## Debugging Strategy

### Browser Console Analysis

**Event Handler Inspection:**
```javascript
// Check if click listeners are still attached
console.log('Play button element:', document.querySelector('.play-button'));
console.log('Event listeners:', getEventListeners(document.querySelector('.play-button')));
```

**AudioEngine State Checking:**
```javascript
// Verify AudioEngine state
console.log('AudioEngine initialized:', this.plugin.audioEngine.isInitialized);
console.log('AudioEngine playing:', this.plugin.audioEngine.isPlaying);
console.log('Transport state:', Tone.getTransport().state);
```

**UI Component State:**
```javascript
// Check component state
console.log('Control panel instance:', this.plugin.controlPanel);
console.log('Button disabled state:', document.querySelector('.play-button').disabled);
```

### Code Path Tracing

**Critical Methods to Investigate:**
1. **Play Button Handler**: `src/ui/control-panel-md.ts` - Click event binding and handling
2. **AudioEngine.playSequence()**: `src/audio/engine.ts` - Main playback initiation
3. **AudioEngine.stop()**: `src/audio/engine.ts` - Cleanup and state reset
4. **Component Lifecycle**: UI component mounting/unmounting patterns

### Logging Strategy

**Instrument Key Methods:**
```typescript
// Add debug logging to critical paths
private handlePlayClick(): void {
    console.log('🎵 Play button clicked - handler executing');
    console.log('🎵 AudioEngine state:', {
        initialized: this.audioEngine.isInitialized,
        playing: this.audioEngine.isPlaying
    });
    // ... rest of method
}
```

---

## Next Steps

### Investigation Priority

**Phase 1: Event Handler Analysis** (IMMEDIATE)
- [ ] Verify click event listeners remain attached after first use
- [ ] Check for event handler removal or rebinding issues
- [ ] Test DOM element state and accessibility

**Phase 2: AudioEngine State Debugging** (HIGH)
- [ ] Monitor AudioEngine state transitions during play/stop cycles
- [ ] Verify proper cleanup of audio resources
- [ ] Check Tone.js Transport state management

**Phase 3: UI Component Lifecycle** (HIGH)
- [ ] Investigate component re-rendering and state management
- [ ] Check for CSS class conflicts or UI state corruption
- [ ] Verify button disabled/enabled state transitions

**Phase 4: Resource Management Audit** (MEDIUM)
- [ ] Review memory management and cleanup patterns
- [ ] Check for resource leaks preventing reuse
- [ ] Verify proper disposal of audio contexts and handlers

### Success Criteria

**Resolution Validation:**
- ✅ Play button responds reliably to multiple uses per session
- ✅ No Obsidian restart required between audio sessions
- ✅ AudioEngine state management works consistently
- ✅ UI state synchronization remains stable across uses
- ✅ No memory leaks or resource accumulation

### Related Issues

- **Issue #003**: Resolved - Instrument family playback now working (provides reliable test environment)
- **Testing Framework**: Enhanced test suite can validate button reliability
- **User Experience**: Critical for iterative workflow and development

### Test Cases

**Reliability Testing:**
1. **Rapid Click Test**: Multiple Play clicks in quick succession
2. **Long Session Test**: 10+ play/stop cycles without restart
3. **Mixed Usage Test**: Play + stop + instrument changes + play again
4. **Recovery Test**: Verify button works after any error conditions

**Performance Testing:**
1. **Memory Usage**: Monitor memory consumption over multiple uses
2. **Event Handler Count**: Track event listener accumulation
3. **AudioEngine Performance**: Verify no performance degradation

---

*This document tracks the investigation and resolution of the critical Play button single-use limitation affecting core Sonigraph usability.*