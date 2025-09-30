# User Experience Improvements Plan

- **Document Version:** 1.0
- **Date:** September 30, 2025
- **Status:** Planning

**Related Documents:**
- **Main Specification:** [Sonic Graph Audio Enhancement Specification](../sonic-graph-audio-enhancement-specification.md)
- **Implementation Plan:** [Sonic Graph Audio Enhancement Implementation Plan](sonic-graph-audio-enhancement-implementation-plan.md)

---

## Overview

This plan focuses on improving the user experience for Sonigraph through documentation, tutorials, and preset management. These phases were originally part of Phase 8 in the audio enhancement plan but have been separated to focus specifically on UX improvements.

---

## Implementation Phases

### Phase 1: User Documentation
**Goal:** Create comprehensive documentation for audio enhancement features

**Status:** ❌ Not Started

#### 1.1 Feature Documentation
**Objective:** Document all major features with clear explanations and examples

**Documentation to Create:**

1. **Continuous Layers User Guide**
   - Overview of ambient, rhythmic, and harmonic layers
   - Genre selection and customization
   - Intensity and evolution settings
   - Integration with vault state
   - Performance considerations

2. **Content-Aware Mapping Explanation**
   - How file types map to instruments
   - Tag-based musical semantics
   - Folder hierarchy mapping
   - Connection type audio differentiation
   - Custom mapping rules

3. **Musical Theory Settings Guide**
   - Scale selection and chord progressions
   - Key modulation and harmony
   - Musical mood system
   - Advanced theory parameters

4. **Freesound Integration Setup**
   - Getting API token
   - Sample browsing and preview
   - Download management and caching
   - Offline mode
   - Troubleshooting common issues

**Files to Create:**
- `docs/user-guide/audio-enhancements.md` - Overview of all audio features
- `docs/user-guide/continuous-layers.md` - Detailed layer documentation
- `docs/user-guide/content-aware-mapping.md` - Mapping system guide
- `docs/user-guide/musical-theory.md` - Theory integration guide
- `docs/user-guide/freesound-setup.md` - Freesound integration guide
- `docs/user-guide/troubleshooting.md` - Common issues and solutions

#### 1.2 Quick Start Guides
**Objective:** Provide concise getting-started guides for common use cases

**Guides to Create:**

1. **Getting Started with Audio Enhancements**
   - First-time setup checklist
   - Recommended initial settings
   - Quick wins for immediate results
   - Next steps after setup

2. **Setting Up Your First Musical Theme**
   - Choosing a genre
   - Understanding intensity settings
   - Basic customization
   - Testing and refining

3. **Customizing Mappings for Your Vault**
   - Analyzing vault structure
   - Creating custom tag mappings
   - Folder-based organization
   - Iterative refinement

4. **Performance Optimization**
   - Understanding performance settings
   - Vault size considerations
   - Adaptive quality configuration
   - Troubleshooting performance issues

**Files to Create:**
- `docs/quick-start/getting-started.md`
- `docs/quick-start/first-theme.md`
- `docs/quick-start/custom-mappings.md`
- `docs/quick-start/performance.md`

#### 1.3 Advanced Documentation
**Objective:** Provide in-depth documentation for power users

**Topics to Cover:**

1. **Creating Custom Presets**
   - Preset file format
   - Configuration options
   - Sharing and importing
   - Best practices

2. **Advanced Mapping Rules**
   - Complex tag hierarchies
   - Multi-factor mapping strategies
   - Edge case handling
   - Performance implications

3. **API Integration Guide**
   - Freesound API details
   - Rate limiting and caching
   - Error handling
   - Advanced usage patterns

4. **Architecture and Extensibility**
   - Plugin architecture overview
   - Extension points
   - Custom audio engines
   - Contributing guidelines

**Files to Create:**
- `docs/advanced/custom-presets.md`
- `docs/advanced/mapping-rules.md`
- `docs/advanced/api-integration.md`
- `docs/advanced/architecture.md`

**Success Criteria:**
- ✅ All major features documented with examples
- ✅ Quick start guides for common workflows
- ✅ Advanced documentation for power users
- ✅ Clear troubleshooting resources
- ✅ Easy navigation and searchability

---

### Phase 2: Tutorial System
**Goal:** Interactive tutorials for new users

**Status:** ❌ Not Started

#### 2.1 Tutorial Architecture
**Objective:** Create framework for in-app tutorials

**Implementation Tasks:**

1. **Tutorial Manager**
   ```typescript
   interface TutorialStep {
     id: string;
     title: string;
     description: string;
     highlightElement?: string; // CSS selector
     position: 'top' | 'bottom' | 'left' | 'right';
     action?: () => void;
     nextButtonText: string;
     skipable: boolean;
   }

   class AudioTutorialManager {
     private tutorialSteps: TutorialStep[];
     private currentStep: number;
     private activeTutorial: string | null;
     private overlay: HTMLElement | null;

     startTutorial(tutorialName: string): void;
     showNextStep(): void;
     showPreviousStep(): void;
     skipTutorial(): void;
     completeTutorial(): void;
     private highlightElement(selector: string): void;
     private showTooltip(step: TutorialStep): void;
   }
   ```

2. **Tutorial State Persistence**
   ```typescript
   interface TutorialProgress {
     completed: string[]; // Tutorial IDs
     skipped: string[];
     inProgress?: {
       tutorialId: string;
       stepIndex: number;
     };
     neverShowAgain: boolean;
   }
   ```

3. **Visual Components**
   - Overlay system for highlighting
   - Tooltip/popover for instructions
   - Progress indicator
   - Navigation controls (next, previous, skip)
   - Animation and transitions

**Files to Create:**
- `src/ui/tutorials/AudioTutorialManager.ts` - Core tutorial system
- `src/ui/tutorials/TutorialStep.ts` - Step interface and rendering
- `src/ui/tutorials/TutorialOverlay.ts` - UI overlay components
- `styles/tutorials.css` - Tutorial styling

#### 2.2 Tutorial Content
**Objective:** Create engaging, helpful tutorial sequences

**Tutorials to Create:**

1. **First-Time Setup Walkthrough** (8 steps)
   - Welcome message
   - Overview of Sonic Graph
   - Enabling audio enhancements
   - Choosing initial genre
   - Testing audio playback
   - Exploring Control Center
   - Customization overview
   - Where to get help

2. **Musical Theme Selection Guide** (5 steps)
   - What are musical themes/genres?
   - Previewing different genres
   - Understanding genre characteristics
   - Choosing theme for your vault
   - Fine-tuning intensity

3. **Mapping Customization Tutorial** (6 steps)
   - What is content-aware mapping?
   - Exploring your vault structure
   - Creating your first tag mapping
   - Testing the mapping
   - Folder-based organization
   - Advanced mapping tips

4. **Freesound Integration Tutorial** (7 steps)
   - What is Freesound?
   - Getting your API token
   - Browsing sample library
   - Previewing and downloading samples
   - Managing cache and storage
   - Offline mode
   - Troubleshooting tips

5. **Performance Optimization Tutorial** (4 steps)
   - Understanding performance settings
   - Adaptive quality overview
   - Recommended settings by vault size
   - Monitoring performance

**Files to Create:**
- `src/ui/tutorials/steps/FirstTimeSetup.ts`
- `src/ui/tutorials/steps/ThemeSelection.ts`
- `src/ui/tutorials/steps/MappingCustomization.ts`
- `src/ui/tutorials/steps/FreesoundIntegration.ts`
- `src/ui/tutorials/steps/PerformanceOptimization.ts`

#### 2.3 Tutorial Triggers and Discoverability
**Objective:** Make tutorials easy to discover and access

**Implementation:**

1. **Automatic Triggers**
   - First plugin load → First-Time Setup
   - First Control Center open → Quick tour
   - First Freesound settings → Integration tutorial

2. **Manual Access**
   - Help menu in Control Center
   - Tutorial list in settings
   - "Show me how" buttons contextually
   - Keyboard shortcut for help

3. **Smart Recommendations**
   - Suggest relevant tutorials based on usage
   - Re-offer skipped tutorials after time period
   - Context-sensitive help tips

4. **Dismissal and Preferences**
   - "Don't show this again" option
   - Tutorial progress tracking
   - Reset tutorial progress option
   - Tutorial preferences in settings

**Files to Modify:**
- `src/main.ts` - Tutorial triggers on plugin load
- `src/ui/control-panel.ts` - Tutorial menu and access
- `src/utils/constants.ts` - Tutorial settings interface

**Success Criteria:**
- ✅ Smooth, non-intrusive tutorial experience
- ✅ Clear visual guidance with highlighting
- ✅ Easy to skip or dismiss
- ✅ Tutorials cover all major features
- ✅ Progress is saved and restorable
- ✅ Helpful for both new and returning users

---

### Phase 3: Preset Library
**Goal:** Expand and polish the preset system

**Status:** ❌ Not Started

#### 3.1 Preset Architecture Enhancement
**Objective:** Robust preset management system

**Implementation Tasks:**

1. **Preset Data Structure**
   ```typescript
   interface Preset {
     id: string;
     name: string;
     description: string;
     author?: string;
     version: string;
     tags: string[];
     category: PresetCategory;
     difficulty: 'beginner' | 'intermediate' | 'advanced';
     settings: SonigraphSettings;
     preview?: {
       audioUrl?: string;
       screenshotUrl?: string;
       demoVaultSize?: string;
     };
     metadata: {
       created: string;
       modified: string;
       downloads?: number;
       rating?: number;
       featured?: boolean;
     };
   }

   type PresetCategory =
     | 'genre'           // Genre-specific settings
     | 'use-case'        // Research, writing, journaling
     | 'mood'            // Energetic, calm, focused
     | 'seasonal'        // Spring, summer, autumn, winter
     | 'community'       // User-contributed
     | 'experimental';   // Advanced/testing

   class PresetLibrary {
     private presets: Map<string, Preset>;
     private favorites: Set<string>;

     loadPresets(): Promise<void>;
     getPreset(id: string): Preset | undefined;
     getPresetsByCategory(category: PresetCategory): Preset[];
     searchPresets(query: string): Preset[];
     getFavorites(): Preset[];
     addFavorite(presetId: string): void;
     removeFavorite(presetId: string): void;
     importPreset(json: string): Promise<Preset>;
     exportPreset(presetId: string): string;
   }
   ```

2. **Preset Storage and Loading**
   - Built-in preset files (JSON)
   - User preset directory
   - Import/export functionality
   - Version compatibility checking
   - Migration for settings updates

**Files to Create:**
- `src/audio/presets/PresetLibrary.ts` - Core preset management
- `src/audio/presets/PresetValidator.ts` - Validation and migration
- `presets/` - Directory for built-in presets (JSON files)

#### 3.2 Expanded Preset Collection
**Objective:** Comprehensive preset library covering diverse use cases

**Preset Categories to Create:**

1. **Genre-Specific Presets** (13 presets)
   - One for each continuous layer genre
   - Optimized settings for each style
   - Example: "Ambient Drone", "Jazz Lounge", "Electronic Pulse"

2. **Use-Case Presets** (8 presets)
   - Research & Analysis: Clean, minimal, focused
   - Creative Writing: Inspiring, dynamic
   - Journaling: Calm, reflective
   - Brainstorming: Energetic, varied
   - Reading & Review: Subtle, non-intrusive
   - Project Management: Structured, rhythmic
   - Learning & Study: Balanced, steady
   - Meditation & Reflection: Minimal, spacious

3. **Mood-Based Presets** (6 presets)
   - Energetic: Upbeat, driving rhythms
   - Calm: Gentle, soothing pads
   - Focused: Minimal distraction
   - Contemplative: Rich harmonies
   - Playful: Varied, surprising
   - Serious: Grounded, stable

4. **Seasonal Themes** (4 presets)
   - Spring: Fresh, growing
   - Summer: Warm, expansive
   - Autumn: Reflective, rich
   - Winter: Cool, crystalline

5. **Experimental Presets** (4 presets)
   - Generative Evolution: Constantly changing
   - Vault Mirroring: Exact audio reflection of structure
   - Chaos Mode: Random, unpredictable
   - Silence Study: Extreme minimalism

**Total: ~35 Presets**

**Preset Files to Create:**
- `presets/genre/*.json` (13 files)
- `presets/use-case/*.json` (8 files)
- `presets/mood/*.json` (6 files)
- `presets/seasonal/*.json` (4 files)
- `presets/experimental/*.json` (4 files)

#### 3.3 Preset Browser UI
**Objective:** Visual, intuitive preset browsing and management

**Implementation Tasks:**

1. **Preset Browser Interface**
   ```typescript
   class PresetBrowser {
     private presetLibrary: PresetLibrary;
     private currentCategory: PresetCategory | 'all' | 'favorites';
     private searchQuery: string;
     private sortBy: 'name' | 'rating' | 'recent' | 'popular';

     render(container: HTMLElement): void;
     private renderCategoryFilter(): HTMLElement;
     private renderSearchBar(): HTMLElement;
     private renderPresetGrid(): HTMLElement;
     private renderPresetCard(preset: Preset): HTMLElement;
     private renderPresetDetails(preset: Preset): void;
     private applyPreset(preset: Preset): void;
   }
   ```

2. **Visual Components**
   - Category filter tabs/pills
   - Search bar with instant filtering
   - Grid or list view toggle
   - Preset cards with:
     - Name and description
     - Category badge
     - Difficulty indicator
     - Favorite star button
     - Preview button (if available)
     - Apply button
   - Preset detail modal:
     - Full description
     - Settings preview
     - Apply/Cancel buttons
     - Export button
     - More info link

3. **Preview Functionality**
   - Audio preview (if sample available)
   - Settings diff view (compare to current)
   - Visual mockup/screenshot
   - Dry-run mode (apply temporarily)

4. **Management Features**
   - Import custom preset (JSON upload)
   - Export current settings as preset
   - Duplicate and modify preset
   - Delete user presets
   - Reset to defaults

**Files to Create:**
- `src/ui/audio/PresetBrowser.ts` - Main browser interface
- `src/ui/audio/PresetCard.ts` - Individual preset card component
- `src/ui/audio/PresetDetails.ts` - Detailed preset modal
- `styles/presets.css` - Preset browser styling

**Files to Modify:**
- `src/ui/control-panel.ts` - Add preset browser tab or button
- `src/main.ts` - Initialize preset library on plugin load

#### 3.4 Community Presets (Future)
**Objective:** Enable community sharing (phase 2 of preset system)

**Future Considerations:**
- Preset submission system
- Community rating and reviews
- Curator approval process
- Preset update notifications
- Installation statistics
- Preset dependencies

**Not Implementing Yet:**
- Wait for user feedback on built-in presets
- Assess demand for community features
- Consider hosting/infrastructure needs

**Success Criteria:**
- ✅ 35+ high-quality presets covering diverse use cases
- ✅ Intuitive visual preset browser
- ✅ Easy preset switching and comparison
- ✅ Import/export functionality working
- ✅ Favorites and search working smoothly
- ✅ Preview functionality helpful
- ✅ Positive user feedback on preset quality

---

## Implementation Timeline

### Phase 1: User Documentation (2 weeks)
- Week 1: Feature documentation and quick start guides
- Week 2: Advanced documentation and polish

### Phase 2: Tutorial System (2 weeks)
- Week 1: Tutorial framework and architecture
- Week 2: Tutorial content and polish

### Phase 3: Preset Library (2 weeks)
- Week 1: Preset architecture and built-in presets
- Week 2: Browser UI and management features

**Total Estimated Time:** 6 weeks

---

## Success Metrics

### Documentation Success
- User reports decreased confusion and support requests
- High engagement with quick start guides
- Positive feedback on documentation clarity

### Tutorial Success
- High tutorial completion rates (>70%)
- Low skip rates for core tutorials
- Positive user feedback on tutorial quality
- Reduced time-to-first-value for new users

### Preset Success
- Users regularly browse and try presets
- Multiple presets used per user
- Custom preset creation and sharing
- Positive feedback on preset quality and variety

---

## Dependencies

**Documentation:**
- All Phases 1-7 features must be complete
- UI must be stable and finalized
- Settings structure must be locked

**Tutorials:**
- Documentation must be complete
- UI elements must have stable selectors
- Core workflows must be well-established

**Presets:**
- Settings system must be finalized
- All features must have stable APIs
- Import/export must be working

---

## Notes

This plan represents the "polish" phase of Sonigraph development, focusing on user experience rather than core functionality. The goal is to make the plugin accessible, learnable, and enjoyable for users of all skill levels.

Community feedback will heavily influence the priority and scope of these features. We may adjust based on:
- User support requests
- Community forum discussions
- Feature request patterns
- Usage analytics (if available)


The preset system in particular is designed to be extensible - we start with built-in presets but leave the door open for community contributions in the future.
