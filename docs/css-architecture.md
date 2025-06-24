# CSS Architecture Documentation

## Overview

The Sonigraph plugin uses a modular CSS architecture with component-based stylesheets that are automatically concatenated into a single `styles.css` file for Obsidian compatibility.

## Architecture Principles

### 1. **Component-Based Organization**
- Each UI component or functional area has its own CSS file
- Components are self-contained with minimal cross-dependencies
- Clear separation of concerns between structural, visual, and interactive styles

### 2. **Build System Integration**
- Automated concatenation of component files into single `styles.css`
- Stylelint for code quality and consistency
- Prettier for consistent formatting
- Watch mode for development workflow

### 3. **Obsidian Compatibility**
- Single CSS file requirement (no `@import` support)
- Integration with Obsidian's built-in CSS variables
- Theme-agnostic structural styling

## File Structure

```
styles/
├── variables.css          # CSS custom properties and design tokens
├── base.css              # Base structural elements and typography
├── layout.css            # Grid systems and container layouts
├── utilities.css         # Utility classes and helpers
├── buttons.css           # Button variants and controls
├── controls.css          # Form controls, toggles, and sliders
├── cards.css            # Card components and containers
├── lists.css            # List components
├── navigation.css       # Navigation and drawer components
├── modals.css           # Modal system and overlays
├── settings.css         # Settings interface and configuration UI
├── effects.css          # Effects, presets, and audio components
├── status.css           # Status displays and real-time feedback
├── controlcenter.css    # Control Center framework (Material Design 3)
├── sonic-graph.css      # Sonic Graph visualization and temporal animation
├── animations.css       # Keyframes and transitions
├── responsive.css       # Responsive breakpoints
└── theme.css           # Theme compatibility and accessibility
```

## Component Order

The build system concatenates files in dependency order:

1. **Foundation Layer**: `variables.css`, `base.css`
2. **Layout Layer**: `layout.css`, `utilities.css`
3. **Component Layer**: `buttons.css`, `controls.css`, `cards.css`, `lists.css`
4. **Feature Layer**: `navigation.css`, `modals.css`, `settings.css`, `effects.css`, `status.css`
5. **Framework Layer**: `controlcenter.css`, `sonic-graph.css`
6. **Enhancement Layer**: `animations.css`, `responsive.css`, `theme.css`

## Naming Conventions

### CSS Classes
We use a hybrid BEM (Block-Element-Modifier) convention with plugin prefixes:

- **Sonigraph components**: `sonigraph-[component]`
- **OSP components**: `osp-[component]`
- **Control Center components**: `ospcc-[component]`

Examples:
```css
/* Block */
.sonigraph-control-panel

/* Element */
.sonigraph-control-panel__header

/* Modifier */
.sonigraph-control-panel--minimized

/* Utility classes */
.osp-d-flex
.osp-justify-center
```

### CSS Custom Properties
- **Material Design**: `--md-[property]`
- **OSP Design Tokens**: `--osp-[property]`
- **Sonigraph Specific**: `--sonigraph-[property]`

Examples:
```css
--md-primary
--osp-spacing-md
--sonigraph-waveform-color
```

## Design System Integration

### Control Center Framework
Based on Material Design 3 principles:
- Consistent spacing and sizing scales
- Semantic color tokens
- Motion and animation standards
- Accessibility compliance

### Design Tokens
```css
/* Spacing Scale */
--md-space-1: 4px
--md-space-2: 8px
--md-space-3: 12px
--md-space-4: 16px

/* Typography Scale */
--md-font-body-small
--md-font-body-medium
--md-font-title-medium

/* Color Tokens */
--md-primary
--md-on-primary
--md-surface
--md-on-surface
```

## Build System

### Commands
```bash
# Full build (used in production)
npm run build:css

# Development with auto-rebuild
npm run build:css:watch

# Linting only
npm run lint:css

# Auto-fix linting issues
npm run lint:css:fix

# Format only
npm run format:css
```

### Build Process
1. **Format**: Prettier formats all component files
2. **Lint**: Stylelint validates code quality (warnings only in production)
3. **Concatenate**: Components assembled in dependency order
4. **Generate**: Final `styles.css` with build metadata

### Build Flags
- `--no-fail-on-lint`: Continue build despite linting warnings
- `--watch`: Monitor files for changes and auto-rebuild

## Development Workflow

### Adding New Components
1. Create new `.css` file in `styles/` directory
2. Add to `componentOrder` array in `build-css.js`
3. Follow naming conventions and BEM methodology
4. Run `npm run build:css:watch` for development

### Modifying Existing Components
1. Edit component file directly
2. Use `npm run build:css:watch` for live rebuilding
3. Build system automatically concatenates changes

### Code Quality
- Stylelint enforces naming patterns and best practices
- Prettier ensures consistent formatting
- Build system prevents syntax errors from reaching production

## Performance Considerations

### Bundle Optimization
- Single CSS file reduces HTTP requests
- Gzip-friendly structure with repeated patterns
- Dead code elimination through component isolation

### Runtime Performance
- CSS custom properties for dynamic theming
- Hardware-accelerated animations
- Minimal layout thrashing through careful positioning

## Obsidian Integration

### Theme Compatibility
- Structural styling only (no visual overrides)
- Uses Obsidian's built-in CSS variables where possible
- Graceful fallbacks for missing theme variables

### Plugin Constraints
- Single CSS file requirement
- No external dependencies
- Reading View and Live Preview compatibility

## Accessibility

### Standards Compliance
- WCAG 2.1 AA compliance
- High contrast mode support
- Reduced motion preferences
- Keyboard navigation support

### Implementation
```css
/* High contrast support */
@media (prefers-contrast: high) {
  .sonigraph-controls-section {
    border: 2px solid var(--background-modifier-border);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .ospcc-switch__track,
  .ospcc-switch__thumb {
    transition: none !important;
  }
}
```

## Future Considerations

### Scalability
- Component library approach allows easy addition of new features
- Design system provides consistency as plugin grows
- Build system can be extended with additional processing steps

### Maintenance
- Clear separation of concerns makes updates safer
- Automated quality checks prevent regressions
- Documentation and naming conventions aid team development

## Troubleshooting

### Common Issues
1. **Build failures**: Check for CSS syntax errors in component files
2. **Missing styles**: Verify component is added to build order
3. **Linting errors**: Use `--no-fail-on-lint` for production builds with legacy code

### Debugging
```bash
# Check specific component for errors
npx stylelint "styles/[component].css"

# Format specific component
npx prettier --write "styles/[component].css"

# Build only (skip linting)
node build-css.js --build-only
```

---

This architecture provides a solid foundation for maintainable, scalable CSS development while meeting Obsidian's unique requirements and constraints.