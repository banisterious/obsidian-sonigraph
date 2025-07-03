# UI Components Architecture

## Table of Contents

- [1. Component System](#1-component-system)
- [2. Obsidian Integration](#2-obsidian-integration)
- [3. Material Design Implementation](#3-material-design-implementation)

---

## 1. Component System

The UI system provides standardized Obsidian-compatible components that ensure perfect visual consistency with the native interface.

**Component Architecture:**
- **Material Design Foundation**: Monochrome styling using Obsidian's color scheme
- **Lucide Icons**: Consistent iconography via Obsidian's built-in icon system
- **Reusable Components**: Modular components for consistent interface elements
- **Responsive Design**: Adaptive layouts for different screen sizes

## 2. Obsidian Integration

**Toggle Components:**

**`createObsidianToggle()`** - Full settings-style toggle:
```typescript
const checkbox = createObsidianToggle(
  container,
  true, // initial value
  (value) => console.log('Toggle changed:', value),
  {
    name: 'Enable Feature',
    description: 'Turn this feature on or off',
    disabled: false
  }
);
```

**DOM Structure:**
```html
<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Setting Name</div>
    <div class="setting-item-description">Setting description</div>
  </div>
  <div class="setting-item-control">
    <div class="checkbox-container is-enabled">
      <input type="checkbox" tabindex="0" checked>
    </div>
  </div>
</div>
```

**State Management:**
- `checkbox-container` - Base container class
- `is-enabled` - Added when toggle is ON
- `is-disabled` - Added when toggle is disabled

## 3. Material Design Implementation

**Control Center Modal Structure:**
```typescript
class MaterialControlPanelModal extends Modal {
  private activeTab: string = 'status';
  private tabContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private appBar: HTMLElement;
  private drawer: HTMLElement;
  private playButton: HTMLElement;
  private instrumentToggles: Map<string, HTMLElement> = new Map();
}
```

**Family-Based Tab Architecture:**
- **Navigation Drawer**: Left sidebar with 10-tab navigation organized by family
- **Content Area**: Dynamic content switching based on active tab
- **Sticky Header**: Fixed header with title and global action buttons
- **Material Design**: Monochrome styling using Obsidian's native color scheme

**Ten-Tab Interface System:**

**Core Tabs (3 tabs):**
1. **Status Tab**: Real-time system diagnostics, performance metrics, and Audio System controls
2. **Musical Tab**: Scale selection, root note, tempo, traversal methods
3. **Master Tab**: Global controls, master effects, and bulk operations

**Audio System Controls (Status Tab):**
- **"Use High Quality Samples" Toggle**: Primary control for CDN sample loading (Issue #011 resolution)
- **Real-time Audio Mode Display**: Immediate feedback showing "High Quality Samples" vs "Synthesis Only"
- **System Information**: Sample rate, buffer size, and audio context status

**Sonic Graph Modal Enhancements (Phase 3.7-3.9):**
- **Audio Density Slider**: Real-time value display (e.g., "100%", "5%") with immediate visual feedback
- **Settings Panel**: Comprehensive configuration with sliding panel animation
- **Real-time Updates**: All settings changes apply immediately without requiring restart
- **Structured Logging Integration**: Enhanced debugging with detailed audio density filtering logs
- **Enhanced Header Design (Phase 3.9)**: Title with chart-network icon positioned on left, Control Center button on right
- **Adaptive Detail Stats**: Real-time display showing current detail level and node/link filtering percentages
- **Improved Layout**: Flexbox-based header alignment ensuring perfect vertical centering of all elements

**Instrument Family Tabs (7 tabs):**
1. **Strings Tab**: String family instruments (violin, cello, guitar, harp, piano, strings)
2. **Woodwinds Tab**: Woodwind family (flute, clarinet, saxophone, oboe)
3. **Brass Tab**: Brass family (trumpet, french horn, trombone, tuba)
4. **Vocals Tab**: Vocal family (choir, vocal pads, soprano, alto, tenor, bass)
5. **Percussion Tab**: Percussion family (timpani, xylophone, vibraphone, gongs)
6. **Electronic Tab**: Electronic family (pad, lead synth, bass synth, arp synth)
7. **Experimental Tab**: Experimental/environmental sounds (whale song)

**Material Components:**
- **MaterialCard**: Standardized card components with elevation
- **StatCard**: Real-time status display cards
- **InstrumentCard**: Individual instrument control interface
- **EffectSection**: Effects parameter controls
- **ActionChip**: Interactive action buttons
- **MaterialSlider**: Consistent slider controls
- **MaterialButton**: Standardized button components
- **High Quality Samples Toggle**: User-friendly control for CDN sample loading (Issue #011 resolution)

**CSS Integration:**
```css
:root {
  --md-surface: var(--background-secondary);
  --md-surface-variant: var(--background-modifier-border);
  --md-primary: var(--interactive-accent);
  --md-on-surface: var(--text-normal);
  --md-outline: var(--background-modifier-border);
}
```

---

*For related documentation, see:*
- [Audio Engine](audio-engine.md) - Control Center integration
- [Sonic Graph System](sonic-graph-system.md) - Modal interfaces
- [CSS System](css-system.md) - Component styling and build system
- [Overview](overview.md) - System integration