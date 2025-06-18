# Issue #006: Play Button Only Works Once Per Session

**Status:** 🟡 **REPORTED**  
**Priority:** High  
**Component:** Audio Engine / UI Interaction  
**Reporter:** User Testing  
**Date Reported:** 2025-06-18

---

## 🚨 **Problem Summary**

The Play button in the Control Center only functions once per plugin session. After the first use, clicking the Play button has no effect. Users must reload the plugin to use the Play button again.

### **Impact**
- **User Experience**: Severely impacts usability, requires frequent plugin reloads
- **Workflow Disruption**: Makes iterative testing and usage impractical
- **Development Testing**: Complicates testing and debugging workflows

---

## 🔍 **Symptoms**

### **Expected Behavior**
- Play button should be clickable multiple times per session
- Each click should trigger audio playback based on current graph state
- Button should remain functional throughout the entire plugin session

### **Actual Behavior**
- First click on Play button works normally
- Subsequent clicks on Play button have no effect
- No visual feedback or error messages
- Only solution is to reload the entire plugin

### **Reproducibility**
- **Frequency**: 100% reproducible
- **Steps to Reproduce**:
  1. Load the Sonigraph plugin
  2. Click the Play button → ✅ Works normally
  3. Click the Play button again → ❌ No effect
  4. Reload plugin
  5. Click Play button → ✅ Works again (once)

---

## 🔧 **Technical Analysis**

### **Potential Root Causes**

1. **Event Listener Removal**
   - Play button event listener may be getting removed after first use
   - Button click handler might be getting unbound

2. **Audio Engine State**
   - AudioEngine may not be properly resetting after playback
   - Audio context might be getting suspended/closed
   - Transport/scheduling system not resetting properly

3. **UI State Management**
   - Button state not properly managed between clicks
   - Modal or component state preventing subsequent interactions
   - React/UI framework state inconsistency

4. **Resource Cleanup**
   - Audio resources not properly cleaned up after playback
   - Memory leaks preventing subsequent playback
   - Web Audio API context issues

### **Investigation Areas**

```typescript
// Areas to investigate:
1. Control Center button event handlers
2. AudioEngine.play() method and state management
3. Tone.js Transport and scheduling cleanup
4. Audio context lifecycle management
5. UI component state management
```

---

## 🧪 **Debugging Strategy**

### **Phase 1: Event Handler Investigation**
- [ ] Check if Play button event listeners remain attached after first use
- [ ] Verify button click events are being fired on subsequent clicks
- [ ] Examine button state management in Control Center

### **Phase 2: Audio Engine Analysis**
- [ ] Add logging to AudioEngine.play() method entry/exit
- [ ] Check audio context state after first playback
- [ ] Verify Tone.js Transport state between plays
- [ ] Examine resource cleanup and disposal

### **Phase 3: UI State Debugging**
- [ ] Check for modal/component state issues
- [ ] Verify button disabled/enabled state management
- [ ] Examine React component lifecycle if applicable

### **Phase 4: Browser Console Analysis**
- [ ] Check for JavaScript errors after first Play
- [ ] Monitor Web Audio API warnings/errors
- [ ] Verify no resource limit errors

---

## 🎯 **Success Criteria**

### **Primary Goals**
- [ ] Play button works reliably multiple times per session
- [ ] No plugin reload required between Play button uses
- [ ] Consistent audio playback behavior

### **Secondary Goals**
- [ ] Proper error handling and user feedback
- [ ] Resource cleanup between playback sessions
- [ ] Performance optimization for repeated plays

---

## 📊 **Priority Justification**

**High Priority** because:
- **Critical UX Issue**: Makes the plugin nearly unusable for regular workflow
- **Testing Blocker**: Severely impacts development and testing processes
- **User Frustration**: Forces frequent plugin reloads, poor user experience
- **Core Functionality**: Play button is primary interaction mechanism

---

## 🔗 **Related Issues**

- **Issue #003**: Instrument playback issues (may be related to audio engine state)
- **Performance monitoring**: May reveal resource cleanup issues

---

## 📝 **Notes**

- This issue appears to be independent of the recent Issue #003 fixes
- May be related to audio engine lifecycle management
- Could be connected to Web Audio API context handling
- Requires investigation of both UI and audio engine components

---

**Next Steps**: Begin Phase 1 debugging to identify whether this is a UI event handling issue or audio engine state management problem.