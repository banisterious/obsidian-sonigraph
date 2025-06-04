# UI Components Implementation

## Standardized Obsidian Components

### Overview

This document describes the standardized UI components that ensure perfect visual consistency with Obsidian's native interface. All components are reverse-engineered from Obsidian's actual DOM structure using browser Inspector tools.

### Toggle Components

#### `createObsidianToggle()`

Creates a full settings-style toggle that matches Obsidian's native implementation exactly.

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

**Usage:**
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

#### `createSimpleToggle()`

Creates a minimal toggle without the setting item wrapper, useful for inline toggles.

**DOM Structure:**
```html
<div class="checkbox-container is-enabled">
  <input type="checkbox" tabindex="0" checked>
</div>
```

**Usage:**
```typescript
const checkbox = createSimpleToggle(
  container,
  false, // initial value
  (value) => console.log('Toggle changed:', value),
  {
    disabled: false,
    ariaLabel: 'Toggle notification'
  }
);
```

### State Management

#### CSS Classes

- `checkbox-container` - Base container class
- `is-enabled` - Added when toggle is ON
- `is-disabled` - Added when toggle is disabled

#### Helper Functions

- `updateToggleValue(checkbox, value)` - Update toggle programmatically
- `setToggleDisabled(checkbox, disabled)` - Enable/disable toggle

### Implementation Notes

1. **Exact DOM Match**: Structure matches Obsidian's native toggles pixel-perfectly
2. **Theme Compatibility**: Works with all Obsidian themes automatically
3. **Accessibility**: Includes proper `tabindex` and `aria-label` support
4. **State Consistency**: Visual state always matches logical state
5. **Event Handling**: Proper change event listeners with callbacks

### Integration

Currently integrated in:
- **Settings Tab** (`src/ui/settings.ts`) - Main plugin enable/disable toggle
- **Future**: Control Panel modal toggles (Phase 2)

### Testing

Verified to work with:
- Light theme
- Dark theme
- Custom themes
- Keyboard navigation
- Screen readers (basic support)

### Reverse Engineering Process

1. Used browser Inspector to examine Obsidian's native settings toggles
2. Captured exact DOM structure and CSS classes
3. Analyzed state change behavior (`is-enabled` class toggling)
4. Tested with different themes to ensure compatibility
5. Verified keyboard and accessibility features work correctly 