# Sonigraph Settings Organization Analysis

## Executive Summary

The plugin has **significant redundancy and organizational issues** with settings split across multiple locations:
- **3 major locations** for Local Soundscape settings (control panel, view sidebar, constants)
- **4 major tabs** for different feature groups (Sonic Graph, Local Soundscape, Layers, Instrument Families)
- **Inconsistent naming and grouping** leading to user confusion

---

## 1. Settings Tab (src/ui/settings.ts)

### What's Here
This is the **Obsidian Plugin Settings Tab** - the main entry point for users.

**Current Content:**
- Onboarding section directing users to Control Center
- "Control Center" button to open the Control Panel Modal
- Note about where Sonic Graph settings have moved

**Issues:**
- Almost entirely empty - just redirects to Control Center
- The description says settings are "now available" in Control Center, implying they used to be here
- Creates confusion about whether this is the right place to configure the plugin

---

## 2. Control Center > Sonic Graph Tab (src/ui/control-panel.ts + src/ui/settings/)

Located in: `MaterialControlPanelModal.createSonicGraphTab()`

Uses dedicated settings classes:
- `SonicGraphCoreSettings.ts` - Core graph & audio
- `SonicGraphAdvancedSettings.ts` - Advanced features  
- `SonicGraphVisualDisplaySettings.ts` - Visual display
- `SonicGraphLayersSettings.ts` - Continuous layers
- `SonicGraphSettingsTabs.ts` - Tab navigation

### What's Here

**Core Tab:**
- Graph & Layout
  - Show file names
  - Journal gravity
  - Clustering strength
  - Adaptive detail levels (toggle + sub-settings)
  - Content-aware positioning (toggle + sub-settings)
  - Group separation
- Audio Core
  - Audio detection (override auto-detection: auto/dense/balanced/sparse)
  - Note duration
  - Animation duration
  - Loop animation
  - Event spreading (none/gentle/aggressive)
  - Simultaneous event limit
  - Event batch size
  - Max event spacing
- Content-Aware Mapping
  - Enable content-aware mapping (master toggle)
  - Instrument frontmatter property
  - Musical mood property
  - Instrument distribution strategy

**Visual Display Tab:**
- Master toggle for visual note display
- Visualization mode (piano-roll/spectrum/staff/graph-highlight)
- Frame rate (15-60 fps)
- Color scheme (layer/pitch/intensity/high-contrast)
- Show labels toggle
- Show grid toggle
- Enable trails toggle
- Panel height

**Smart Clustering Tab:**
- Enable smart clustering algorithms
- Clustering algorithm selection
- Link strength weight
- Shared tags weight
- Folder hierarchy weight
- Temporal proximity weight
- Min cluster size
- Max clusters
- Clustering resolution
- Visualization settings (boundaries, colors)
- Integration settings
- Debug mode

**Musical Features Tab:**
- Musical theory integration
- Dynamic orchestration settings
- Harmonic constraints
- Chord inversions
- Melodic range
- Rhythmic complexity

**Spatial Audio Tab:**
- Spatial audio settings
- Panning mode & curve
- HRTF settings
- Binaural rendering
- 3D positional audio

---

## 3. Control Center > Local Soundscape Tab (src/ui/control-panel.ts)

Located in: `MaterialControlPanelModal.createLocalSoundscapeTab()`

### What's Here

**Instrument Mapping by Depth Card:**
- Center (Depth 0) - Lead instruments (text input: comma-separated)
- Depth 1 - Harmony instruments
- Depth 2 - Rhythm/bass instruments
- Depth 3+ - Ambient instruments

**Volume & Panning Card:**
- Volume by Depth section:
  - Center volume
  - Depth 1 volume
  - Depth 2 volume
  - Depth 3+ volume
- Directional Panning section:
  - Enable directional panning toggle
  - Incoming links panning
  - Outgoing links panning
  - Bidirectional panning

**Performance Settings Card:**
- Max nodes per depth (slider: 10-200)
- Include all nodes toggle

---

## 4. Local Soundscape View Settings Panel (src/ui/LocalSoundscapeView.ts)

Located in: `LocalSoundscapeView.createSettingsPanel()`

**This is a SEPARATE settings panel in the view's sidebar.**

### What's Here

**Display Section:**
- Show node labels toggle
- Node size mode selector (uniform/link-count/content-length)

**Audio Section:**
- Auto-play when opening toggle
- Auto-play active note toggle

**Musical Key Section:**
- Key based on dropdown (vault-name/root-folder/folder-path/full-path/file-name/custom)
- Folder depth slider (conditional, shown only for folder-path mode)
- Custom key dropdown (conditional, shown only for custom mode)
- Current key display (read-only)

**Visual Effects Section:**
- Pulse playing nodes toggle

**Context-Aware Modifiers Section:**
- Enable context-aware audio toggle
- Context mode dropdown (influenced/only)
- Influence weight slider (0-100%)
- Season influence toggle
- Time of day influence toggle
- Weather influence toggle
- Theme influence toggle

**About Section:**
- Links to global settings

---

## 5. Main Plugin Settings (src/utils/constants.ts)

Defined in `SonicGraphSettings` interface under `localSoundscape` object:

```typescript
localSoundscape?: {
  autoPlayActiveNote?: boolean;
  keySelection?: {
    mode?: 'vault-name' | 'root-folder' | 'folder-path' | 'full-path' | 'file-name' | 'custom';
    folderDepth?: number;
    customKey?: string;
  };
  instrumentsByDepth?: {
    center?: string[];
    depth1?: string[];
    depth2?: string[];
    depth3Plus?: string[];
  };
  volumeByDepth?: {
    center?: number;
    depth1?: number;
    depth2?: number;
    depth3Plus?: number;
  };
  directionalPanning?: {
    enabled?: boolean;
    incomingLinks?: number;
    outgoingLinks?: number;
    bidirectional?: number;
  };
  maxNodesPerDepth?: number | 'all';
  filters?: { /* tag/folder/file type filtering */ };
  clustering?: { /* clustering settings */ };
  enableRichMetadata?: boolean;
  mappingWeights?: { /* duration, pitch, instrument, velocity weights */ };
  contextAware?: {
    enabled?: boolean;
    mode?: 'influenced' | 'only';
    influenceWeight?: number;
    season?: { enabled?: boolean; override?: string };
    timeOfDay?: { enabled?: boolean; override?: string };
    weather?: { enabled?: boolean; override?: string; apiKey?: string; location?: string };
    theme?: { enabled?: boolean; override?: string };
  };
};
```

---

## Analysis: Redundancy & Overlaps

### CRITICAL OVERLAPS FOUND

1. **Local Soundscape Settings Split Across 2 Locations:**
   - **Control Center > Local Soundscape Tab:**
     - Instrument mapping by depth
     - Volume by depth
     - Directional panning (all settings)
     - Max nodes per depth
   
   - **LocalSoundscapeView Settings Panel:**
     - Auto-play active note (DUPLICATE CONCEPT)
     - Key selection (DIFFERENT LOCATION, SAME FEATURE)
     - Context-aware modifiers (DUPLICATE CONCEPT)
     - Visual effects (node size, pulse)

   **Problem:** Users need to navigate to TWO separate places to configure Local Soundscape. This is fragmented and confusing.

2. **Context-Aware Modifiers in Two Places:**
   - **Constants.ts:** Defines full structure with nested season/timeOfDay/weather/theme
   - **LocalSoundscapeView Settings Panel:** Renders UI controls for all of these
   - **No corresponding UI in Control Center tab**
   
   **Problem:** Context-aware modifiers are ONLY configurable in the view sidebar, but the settings structure suggests they should be in Control Center.

3. **Key Selection Logic:**
   - Only defined/rendered in **LocalSoundscapeView.createSettingsPanel()**
   - Should arguably be in **Control Center > Local Soundscape Tab** for consistency
   
   **Problem:** Important audio feature buried in view sidebar, not discoverable from main settings.

4. **Auto-play Active Note:**
   - Renders in **both** LocalSoundscapeView.createSettingsPanel() AND locally managed in the view
   - Inconsistent with instrument mapping which is Control Center only
   
   **Problem:** Same feature is controlled from two different places.

---

## Single Source of Truth Recommendations

### Recommended Organization

#### Control Center > Local Soundscape Tab Should Contain:

1. **Auto-play Settings** (consolidate)
   - Auto-play when opening this view
   - Auto-play when active note changes

2. **Musical Key Settings** (move here)
   - Key based on (dropdown)
   - Folder depth (conditional slider)
   - Custom key (conditional dropdown)
   - Current key display (read-only)

3. **Depth-Based Mapping** (already here - good)
   - Instrument mapping by depth
   - Volume by depth
   - (no change needed)

4. **Directional Panning** (already here - good)
   - Enable toggle
   - Incoming/outgoing/bidirectional panning
   - (no change needed)

5. **Context-Aware Modifiers** (move here from view)
   - Master enable toggle
   - Context mode (influenced/only)
   - Influence weight
   - Individual context factors (season, time, weather, theme)
   - (remove from view sidebar)

6. **Performance Settings** (already here - good)
   - Max nodes per depth
   - Include all nodes toggle
   - (no change needed)

#### LocalSoundscapeView Settings Panel Should Contain:

1. **Display & Visual Effects Only** (these are view-specific, not global settings)
   - Show node labels
   - Node size mode
   - Pulse playing nodes

2. **Quick Links** (for discoverability)
   - Link to Control Center > Local Soundscape Tab for audio configuration
   - Link to Control Center for instrument setup

#### Remove from View Sidebar:

- Auto-play settings (move to Control Center)
- Key selection (move to Control Center)
- Context-aware modifiers (move to Control Center)

---

## Scope Classification

### GLOBAL SETTINGS (belong in Control Center)
- Instrument selection by depth
- Volume by depth
- Panning directions
- Context-aware modifiers
- Musical key determination
- Auto-play behavior
- Performance limits
- Filters and clustering

### LOCAL/VIEW SETTINGS (belong in view sidebar)
- Show/hide node labels
- Node size visualization
- Visual effects (pulse)
- Currently playing node highlights
- Temporary filter toggles (for current session)

---

## Implementation Impact

### What Needs to Move

1. **From LocalSoundscapeView to Control Center:**
   - Key selection UI and state management
   - Auto-play UI (but keep state in localSoundscape settings)
   - Context-aware modifiers UI and state management

2. **From LocalSoundscapeView to View Sidebar (minimal mode):**
   - Keep only visual display and effect toggles

### Files to Modify

1. `src/ui/LocalSoundscapeView.ts` - Remove relocated settings from createSettingsPanel()
2. `src/ui/control-panel.ts` - Expand createLocalSoundscapeTab() to add relocated settings
3. Possibly create `src/ui/settings/LocalSoundscapeSettings.ts` - Similar to SonicGraphCoreSettings pattern

---

## UX Consistency Improvements

1. **All audio configuration** should be in Control Center tabs
2. **All view-specific UI options** should be in sidebar panels
3. **Settings that affect how audio sounds** belong in Control Center
4. **Settings that affect visualization only** belong in view sidebar
5. Use consistent Material Design cards and Setting components everywhere

---

## Duplicate Setting Keywords Found

- `autoPlayActiveNote` - in view, should consolidate
- `keySelection` - in view, should move to Control Center
- `contextAware.*` - in constants but UI only in view
- Instrument/volume/panning - properly in Control Center (good)

---

## Conclusion

**Current State:** Fragmented and confusing
**Recommended State:** Consolidate all Local Soundscape audio settings to Control Center > Local Soundscape Tab, keep only visual toggles in view sidebar

**Complexity:** Moderate - involves moving UI code and state management logic, but doesn't require architecture changes

**Priority:** High - improves discoverability and reduces user confusion about where to configure features

---

## Appendix A: Settings Location Quick Reference Table

| Setting | Currently Located In | Should Be | Notes |
|---------|----------------------|-----------|-------|
| **Local Soundscape** | | | |
| Auto-play when opening | View sidebar | Control Center | Move to consolidate |
| Auto-play active note | View sidebar | Control Center | Move to consolidate |
| Key selection mode | View sidebar | Control Center | Move for discoverability |
| Folder depth | View sidebar | Control Center | Move with key selection |
| Custom key | View sidebar | Control Center | Move with key selection |
| Instruments by depth (center) | Control Center | Control Center | Already correct |
| Instruments by depth (depth1) | Control Center | Control Center | Already correct |
| Instruments by depth (depth2) | Control Center | Control Center | Already correct |
| Instruments by depth (depth3+) | Control Center | Control Center | Already correct |
| Volume by depth (all levels) | Control Center | Control Center | Already correct |
| Directional panning (all) | Control Center | Control Center | Already correct |
| Context-aware enabled | View sidebar | Control Center | Move to consolidate |
| Context mode | View sidebar | Control Center | Move with context |
| Context influence weight | View sidebar | Control Center | Move with context |
| Season influence | View sidebar | Control Center | Move with context |
| Time of day influence | View sidebar | Control Center | Move with context |
| Weather influence | View sidebar | Control Center | Move with context |
| Theme influence | View sidebar | Control Center | Move with context |
| Max nodes per depth | Control Center | Control Center | Already correct |
| Include all nodes toggle | Control Center | Control Center | Already correct |
| | | | |
| **View-Specific Settings** | | | |
| Show node labels | View sidebar | View sidebar | Already correct |
| Node size mode | View sidebar | View sidebar | Already correct |
| Pulse playing nodes | View sidebar | View sidebar | Already correct |

---

## Appendix B: File Location Reference

### Settings Definition Files
- **`src/utils/constants.ts`** (lines 856-950)
  - Defines `localSoundscape` interface structure
  - Should be the single source of truth for setting structure

### Settings Rendering Files (UI)
- **`src/ui/settings.ts`** (src/ui/settings/)
  - Obsidian plugin settings tab (mostly empty redirect)
  
- **`src/ui/control-panel.ts`** (lines 331-4600+)
  - Main Control Center modal
  - Contains `createLocalSoundscapeTab()` at line 503
  - Contains `createDepthInstrumentMappingCard()` at line 4283
  - Contains `createDepthVolumeAndPanningCard()` at line 4386
  - Contains `createLocalSoundscapePerformanceCard()` at line 4513
  
- **`src/ui/LocalSoundscapeView.ts`** (lines 498-872)
  - View-specific settings in `createSettingsPanel()` method
  - Contains ALL the settings that should move to Control Center
  
- **`src/ui/settings/SonicGraphCoreSettings.ts`**
  - Example pattern for settings organization (use as template)
  - Well-organized, focused scope

### Proposed New File
- **`src/ui/settings/LocalSoundscapeSettings.ts`** (to be created)
  - Similar to `SonicGraphCoreSettings.ts`
  - Would contain all Local Soundscape audio configuration UI
  - Imported and used by control-panel.ts

---

## Appendix C: Implementation Checklist

### Phase 1: Create LocalSoundscapeSettings Class
- [ ] Create `src/ui/settings/LocalSoundscapeSettings.ts`
- [ ] Copy pattern from `SonicGraphCoreSettings.ts`
- [ ] Add sections for:
  - [ ] Auto-play settings
  - [ ] Musical key settings
  - [ ] Context-aware modifiers (move from view)
  - [ ] Display note about instrument mapping, volume, panning, performance (existing)

### Phase 2: Update Control Panel
- [ ] Modify `createLocalSoundscapeTab()` to use new class
- [ ] Keep existing depth mapping, volume, panning, performance cards
- [ ] Add new LocalSoundscapeSettings content

### Phase 3: Clean Up View Sidebar
- [ ] Remove auto-play settings from `LocalSoundscapeView.createSettingsPanel()`
- [ ] Remove key selection from `LocalSoundscapeView.createSettingsPanel()`
- [ ] Remove context-aware modifiers from `LocalSoundscapeView.createSettingsPanel()`
- [ ] Keep only:
  - [ ] Display section (show labels, node size)
  - [ ] Visual effects section (pulse)
  - [ ] Quick link to Control Center

### Phase 4: Testing
- [ ] Verify all settings persist correctly
- [ ] Verify UI renders properly in Control Center
- [ ] Verify view sidebar is cleaner
- [ ] Verify state management still works
- [ ] Check that existing user settings still load

### Phase 5: Documentation
- [ ] Update any user-facing documentation
- [ ] Add comment in code about settings organization
- [ ] Update architectural overview if applicable
