# Sonic Graph Modal to View Migration Plan

**Document Version:** 1.0
**Date:** September 29, 2025
**Status:** Planning

---

## 1. Overview

### 1.1 Purpose
Migrate the Sonic Graph from a modal-based interface (`SonicGraphModal`) to a persistent workspace view (`SonicGraphView`) using Obsidian's `ItemView` architecture.

### 1.2 Motivation
**Current Limitations (Modal):**
- Dismissed on click-away or Escape key
- Fixed size, limited resizing capability
- Cannot be docked or split into panes
- No workspace persistence across sessions
- Limited multi-tasking (blocks other interactions)

**Benefits of View (ItemView):**
- Persistent view that stays open
- Full workspace integration (resize, split, dock)
- Can work alongside other views and files
- State persistence with workspace layout
- Better multi-tasking experience
- Professional workflow integration

### 1.3 Scope
- Convert `SonicGraphModal` class to `SonicGraphView` extending `ItemView`
- Update plugin registration and activation logic
- Implement view state persistence
- Adjust UI styling for leaf container
- Maintain all existing functionality (graph, timeline, audio, settings)

---

## 2. Technical Architecture

### 2.1 Class Structure Changes

#### Current: SonicGraphModal
```typescript
export class SonicGraphModal extends Modal {
    constructor(app: App, plugin: SonigraphPlugin) {
        super(app);
        // ...
    }

    onOpen() {
        const { contentEl } = this;
        // Build UI in contentEl
    }

    onClose() {
        // Cleanup
    }
}
```

#### Target: SonicGraphView
```typescript
export const VIEW_TYPE_SONIC_GRAPH = 'sonic-graph-view';

export class SonicGraphView extends ItemView {
    private plugin: SonigraphPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: SonigraphPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_SONIC_GRAPH;
    }

    getDisplayText(): string {
        return 'Sonic Graph';
    }

    getIcon(): string {
        return 'chart-network';
    }

    async onOpen() {
        const container = this.containerEl;
        const content = this.contentEl;
        // Build UI in content
    }

    async onClose() {
        // Cleanup resources
    }

    // State persistence
    async setState(state: any, result: ViewStateResult): Promise<void> {
        // Restore view state
    }

    getState(): any {
        // Save view state
    }
}
```

### 2.2 Container Hierarchy

**Modal Structure:**
```
Modal
└── contentEl (direct content container)
    └── [all UI elements]
```

**ItemView Structure:**
```
ItemView
├── containerEl (outer container with Obsidian chrome)
│   ├── [tab UI, view header, etc.]
│   └── contentEl (main content area)
│       └── [all UI elements]
```

### 2.3 Key API Differences

| Aspect | Modal | ItemView |
|--------|-------|----------|
| Base class | `Modal` | `ItemView` |
| Constructor param | `App` | `WorkspaceLeaf` |
| Access to app | `this.app` | `this.app` (inherited) |
| Content container | `this.contentEl` | `this.contentEl` |
| Outer container | N/A | `this.containerEl` |
| Lifecycle | `onOpen()`, `onClose()` | `onOpen()`, `onClose()` |
| State persistence | N/A | `setState()`, `getState()` |
| Display name | N/A (title in modal) | `getDisplayText()` |
| Unique identifier | N/A | `getViewType()` |
| Icon | N/A | `getIcon()` (optional) |

---

## 3. Implementation Plan

### Phase 1: Core Migration (Week 1) ✅ **COMPLETED** (September 29, 2025)

**Status:** Successfully implemented and tested. View renders correctly with all functionality working.

#### Task 1.1: Create SonicGraphView Class ✅
- **File to Create:** `src/ui/SonicGraphView.ts`
- **Actions:**
  - Copy `SonicGraphModal.ts` as starting point
  - Change class to extend `ItemView`
  - Update constructor signature
  - Implement required methods: `getViewType()`, `getDisplayText()`, `getIcon()`
  - Adjust `onOpen()` to work with ItemView container structure
  - Keep all existing functionality intact

#### Task 1.2: Update Plugin Registration ✅
- **File to Modify:** `src/main.ts`
- **Completed Actions:**
  - ✅ Imported `SonicGraphView` and `VIEW_TYPE_SONIC_GRAPH`
  - ✅ Added view registration in `onload()`
  - ✅ Created `activateSonicGraphView()` method with single-instance pattern
  - ✅ Updated ribbon icon to call `activateSonicGraphView()`
  - ✅ Added new command: "Open Sonic Graph" (opens view)
  - ✅ View opens in main workspace area (not sidebar)

#### Task 1.3: Maintain Modal Support (Temporary) ✅
- **Approach:** Keep both modal and view options during transition
- **Completed Implementation:**
  - ✅ Kept `SonicGraphModal.ts` for legacy support
  - ✅ Added command: "Open Sonic Graph (Modal - Legacy)"
  - ✅ Ribbon icon uses new view by default
  - ✅ Modal accessible via command palette for testing

---

### Phase 1 Implementation Summary

**Completed on September 29, 2025**

**Files Created:**
- `src/ui/SonicGraphView.ts` (5911 lines) - Complete ItemView implementation

**Files Modified:**
- `src/main.ts` - View registration and activation logic
- `styles/sonic-graph.css` - Added view container styles

**Key Achievements:**
- ✅ Full Modal → ItemView conversion
- ✅ All functionality preserved (graph, animation, audio, settings)
- ✅ Single-instance view pattern implemented
- ✅ Opens in main workspace area
- ✅ CSS properly configured for view containers
- ✅ Legacy modal support maintained
- ✅ No TypeScript compilation errors
- ✅ Successfully tested: graph renders, animation works, audio plays

**Technical Details:**
- Constructor changed: `App` → `WorkspaceLeaf`
- Added required methods: `getViewType()`, `getDisplayText()`, `getIcon()`
- Added state persistence placeholders: `setState()`, `getState()`
- Removed modal-specific code (modalEl references)
- Updated CSS classes: `.sonic-graph-modal` → `.sonic-graph-view`
- Added flex container styles for proper 100% height/width rendering

**Critical Fix:**
Added CSS for `.sonic-graph-view` and `.sonic-graph-view-container` with:
```css
.sonic-graph-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
```
This ensures the view container has proper dimensions for graph rendering.

**Testing Results:**
- Graph renders correctly in main area
- Timeline animation runs smoothly
- Settings panel functions properly
- Audio playback operational
- View can be resized and repositioned
- Single instance pattern works (reopening focuses existing view)

**Ready for Phase 2:** State persistence implementation.

---

### Phase 2: State Persistence (Week 2)

#### Task 2.1: Define View State Interface
```typescript
interface SonicGraphViewState {
  // Timeline state
  isTimelineView: boolean;
  isAnimating: boolean;
  currentTimelinePosition: number;
  animationSpeed: number;

  // Settings panel state
  isSettingsVisible: boolean;
  selectedSettingsTab?: string;

  // View configuration
  detectedSpacing: 'dense' | 'balanced' | 'sparse';

  // Filter state (if applicable)
  activeFilters?: any;
}
```

#### Task 2.2: Implement State Persistence
- **Methods to Implement:**
  - `getState()`: Capture current view state
  - `setState(state, result)`: Restore view state
- **Persistence Scope:**
  - Timeline position and animation state
  - Settings panel visibility and selected tab
  - View mode (static vs timeline)
  - Graph filters and layout preferences

#### Task 2.3: Workspace Layout Integration
- **Goal:** View state saved with workspace layout
- **Obsidian Feature:** Automatic via `getState()`/`setState()`
- **Testing:**
  - Close and reopen workspace
  - Switch between workspaces
  - Verify state restoration

### Phase 3: UI and Styling Adjustments (Week 2-3)

#### Task 3.1: Container Styling Updates
- **File to Modify:** `styles.css`
- **Changes Needed:**
  - Replace `.modal` selectors with `.view-content` or view-specific classes
  - Adjust for `containerEl` vs `contentEl` hierarchy
  - Ensure proper sizing within leaf container
  - Handle responsive sizing for split panes

#### Task 3.2: Header and Controls
- **Current:** Modal has custom header with close button
- **Target:** ItemView has Obsidian's native tab header
- **Actions:**
  - Remove custom modal header/close button
  - Move essential controls to appropriate locations
  - Utilize native view header for actions if needed
  - Adjust header container styling

#### Task 3.3: Settings Panel Integration
- **Current:** Settings panel within modal, modal-specific styling
- **Target:** Settings panel within view, responsive to view size
- **Actions:**
  - Update settings panel CSS classes
  - Ensure collapsible sections work in view context
  - Adjust positioning for docked/split views
  - Test with various view sizes and positions

### Phase 4: Lifecycle Management (Week 3)

#### Task 4.1: Enhanced Cleanup in onClose()
- **Current:** Modal cleanup is straightforward (modal disappears)
- **Target:** View may persist in background, then close
- **Actions:**
  - Ensure proper audio cleanup (stop all sounds, dispose Tone.js resources)
  - Stop animation and remove event listeners
  - Clear D3 force simulation
  - Dispose of resize observers
  - Clear any pending timeouts/intervals
  - Release large data structures

#### Task 4.2: Background State Handling
- **Consideration:** View may be in background (another leaf focused)
- **Actions:**
  - Detect when view loses focus (optional)
  - Pause animation when view is hidden (optional optimization)
  - Resume animation when view is revealed (optional)
  - Maintain audio state appropriately

#### Task 4.3: Multiple Instance Handling
- **Decision:** Allow single instance or multiple instances?
- **Recommendation:** Single instance (like graph view)
- **Implementation:**
  - In `activateView()`, check for existing leaves
  - Reuse existing leaf if found
  - Focus existing view rather than creating duplicate

### Phase 5: Testing and Validation (Week 3-4)

#### Task 5.1: Functional Testing
- **Test Cases:**
  - Open view via ribbon icon
  - Open view via command palette
  - Close view and reopen
  - Resize view (horizontal, vertical)
  - Split view into multiple panes
  - Dock view in different positions (left, right, main)
  - Timeline animation with view in background
  - Audio playback with view in background
  - Settings panel interactions

#### Task 5.2: State Persistence Testing
- **Test Cases:**
  - Save workspace with view open and timeline running
  - Close and reopen Obsidian
  - Verify timeline position restored
  - Verify settings panel state restored
  - Switch between workspaces
  - Verify view state isolated per workspace

#### Task 5.3: Performance Testing
- **Metrics:**
  - Memory usage in docked view vs modal
  - CPU usage during animation
  - Resource cleanup on view close
  - Large vault performance (1000+ nodes)

#### Task 5.4: Edge Case Testing
- **Scenarios:**
  - Rapid open/close cycles
  - Multiple workspace layouts
  - View in split panes with different sizes
  - Obsidian mobile compatibility (if applicable)
  - Plugin disable/enable with view open

### Phase 6: Migration and Cleanup (Week 4)

#### Task 6.1: Deprecate Modal Version
- **Actions:**
  - Remove "Open Sonic Graph (Modal)" command
  - Remove `SonicGraphModal.ts` file
  - Update all references to use `SonicGraphView`
  - Update documentation

#### Task 6.2: Documentation Updates
- **Files to Update:**
  - README.md - Update screenshots and usage instructions
  - User documentation - Explain view-based interface
  - Developer documentation - Update architecture docs
  - CHANGELOG.md - Document migration

#### Task 6.3: Settings Migration (If Needed)
- **Check:** Do any settings reference modal behavior?
- **Actions:**
  - Update setting descriptions if needed
  - Add migration logic for any modal-specific settings
  - Ensure backward compatibility

---

## 4. Risk Assessment

### 4.1 Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| State persistence bugs | Medium | Thorough testing, graceful fallbacks |
| Audio cleanup issues | High | Comprehensive cleanup in onClose() |
| Styling breaks in different contexts | Medium | Test in multiple dock positions |
| Performance degradation | Low | Existing resize handling should work |
| Breaking existing workflows | Medium | Maintain modal temporarily, user communication |

### 4.2 User Experience Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users accustomed to modal | Low | Better UX overall, provide docs |
| View takes up screen space | Low | User choice to close, Obsidian standard |
| Confusion about view location | Low | Clear activation via ribbon/command |
| Loss of modal "focus" effect | Low | View provides better focus when docked |

---

## 5. Success Criteria

### 5.1 Functional Requirements
- ✅ View opens via ribbon icon and command
- ✅ All graph functionality works (static, timeline, animation)
- ✅ All audio features work (continuous layers, node sounds, cluster audio)
- ✅ Settings panel fully functional
- ✅ View can be resized, split, and docked
- ✅ View state persists across sessions

### 5.2 Performance Requirements
- ✅ No performance regression vs modal version
- ✅ Proper resource cleanup on view close
- ✅ Memory usage stable over time
- ✅ Animation smooth at 60fps in docked view

### 5.3 User Experience Requirements
- ✅ Intuitive activation and usage
- ✅ Responsive to different view sizes
- ✅ Works in split panes
- ✅ Consistent with Obsidian's UI patterns
- ✅ Proper documentation

---

## 6. Timeline

**Total Estimated Duration:** 3-4 weeks

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Core Migration | 1 week | Working SonicGraphView class |
| Phase 2: State Persistence | 3-4 days | State save/restore functional |
| Phase 3: UI/Styling | 3-4 days | View-optimized styling |
| Phase 4: Lifecycle | 2-3 days | Robust cleanup and state management |
| Phase 5: Testing | 5-7 days | Comprehensive test coverage |
| Phase 6: Migration | 2-3 days | Documentation and cleanup |

---

## 7. Future Enhancements

### 7.1 Multi-Instance Support (Optional)
- Allow multiple Sonic Graph views open simultaneously
- Each view could show different vault subsets or time periods
- Useful for comparing different graph states

### 7.2 View Customization (Optional)
- Per-view settings (separate from global plugin settings)
- View-specific filters and layout configurations
- Save/load view presets

### 7.3 Inter-View Communication (Optional)
- Sync animation across multiple views
- Coordinated audio playback
- Shared state for collaborative analysis

---

## 8. Dependencies

### 8.1 Internal Dependencies
- No breaking changes to graph renderer
- No breaking changes to audio engine
- No breaking changes to timeline animator
- Settings system remains compatible

### 8.2 External Dependencies
- Obsidian API: `ItemView`, `WorkspaceLeaf`, view registration
- No additional npm packages required
- Existing D3.js and Tone.js usage unchanged

---

## 9. Rollback Plan

### 9.1 Keeping Modal as Fallback
During transition, maintain both implementations:
- `SonicGraphModal.ts` (legacy)
- `SonicGraphView.ts` (new default)

### 9.2 Rollback Triggers
- Critical bugs affecting user workflows
- Performance issues in view implementation
- State persistence failures causing data loss
- Compatibility issues with other plugins

### 9.3 Rollback Process
1. Revert ribbon icon to open modal
2. Make view command opt-in only
3. Document issues and plan fixes
4. Release patch with modal as default

---

## 10. Communication Plan

### 10.1 User Communication
- **Pre-release:** Blog post/discussion about upcoming change
- **Release:** Clear changelog entry explaining benefits
- **Documentation:** Update all user-facing docs with screenshots
- **Support:** Monitor for issues, provide prompt responses

### 10.2 Developer Notes
- Update architecture documentation
- Document view lifecycle for future maintainers
- Add code comments explaining view-specific patterns
- Update contribution guidelines if needed

---

## 11. Open Questions

1. **Should we support both modal and view long-term?**
   - Recommendation: No, single interface simpler to maintain

2. **Should animation auto-pause when view is in background?**
   - Recommendation: Yes, for performance (optional user setting)

3. **Should we support multiple simultaneous instances?**
   - Recommendation: Start with single instance, add later if requested

4. **What about mobile Obsidian?**
   - Investigation needed: How do views behave on mobile?
   - May need responsive design adjustments

5. **Settings panel: Keep as sidebar or move to separate view?**
   - Recommendation: Keep as collapsible sidebar within view
   - More immediate access, consistent with current design

---

## 12. Conclusion

Migrating from Modal to ItemView is a substantial but worthwhile improvement to the Sonic Graph plugin. The view-based approach aligns better with Obsidian's workspace model, provides better user experience, and enables future enhancements like multi-instance support and state persistence.

The migration is low-risk because:
- Most functionality remains unchanged
- Can be done incrementally with both versions coexisting
- Rollback path is clear
- Benefits significantly outweigh costs

Recommended approach: **Proceed with migration** following this plan.