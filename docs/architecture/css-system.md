# CSS System Architecture

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
- [2. Build System](#2-build-system)
- [3. Development Workflow](#3-development-workflow)
- [4. Design System](#4-design-system)
- [5. Code Standards](#5-code-standards)
- [6. Performance & Optimization](#6-performance--optimization)
- [7. Obsidian Integration](#7-obsidian-integration)
- [8. Accessibility](#8-accessibility)
- [9. Troubleshooting](#9-troubleshooting)

---

## 1. Architecture Overview

The Sonigraph plugin uses a modular CSS architecture with component-based stylesheets that are automatically concatenated into a single `styles.css` file for Obsidian compatibility.

### 1.1. Architecture Principles

**Component-Based Organization**
- Each UI component or functional area has its own CSS file
- Components are self-contained with minimal cross-dependencies
- Clear separation of concerns between structural, visual, and interactive styles

**Build System Integration**
- Automated concatenation of component files into single `styles.css`
- Stylelint for code quality and consistency
- Prettier for consistent formatting
- Watch mode for development workflow

**Obsidian Compatibility**
- Single CSS file requirement (no `@import` support)
- Integration with Obsidian's built-in CSS variables
- Theme-agnostic structural styling

### 1.2. File Structure

The CSS is organized into **17 component files** in the `styles/` directory:

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

### 1.3. Component Order

The build system concatenates files in dependency order:

1. **Foundation Layer**: `variables.css`, `base.css`
2. **Layout Layer**: `layout.css`, `utilities.css`
3. **Component Layer**: `buttons.css`, `controls.css`, `cards.css`, `lists.css`
4. **Feature Layer**: `navigation.css`, `modals.css`, `settings.css`, `effects.css`, `status.css`
5. **Framework Layer**: `controlcenter.css`, `sonic-graph.css`
6. **Enhancement Layer**: `animations.css`, `responsive.css`, `theme.css`

## 2. Build System

### 2.1. Prerequisites

Install dependencies:
```bash
npm install
```

### 2.2. Available Commands

```bash
# Full build pipeline (format → lint → build)
npm run build:css

# Watch mode for development
npm run build:css:watch

# Lint CSS only
npm run lint:css

# Auto-fix CSS lint issues
npm run lint:css:fix

# Format CSS only
npm run format:css

# Clean build artifacts
npm run clean:css
```

### 2.3. Build Pipeline

1. **Format**: Prettier formats all component files
2. **Lint**: Stylelint validates code quality (warnings only in production)
3. **Concatenate**: Components assembled in dependency order
4. **Generate**: Final `styles.css` with build metadata

### 2.4. Build Flags

- `--no-fail-on-lint`: Continue build despite linting warnings
- `--watch`: Monitor files for changes and auto-rebuild

### 2.5. Build Output

The build system generates detailed statistics:

- Components processed
- Total lines and file size
- Build duration
- Individual component sizes
- Orphaned file warnings

## 3. Development Workflow

### 3.1. Development Mode
```bash
npm run build:css:watch
```
Automatically rebuilds CSS when component files change.

### 3.2. Adding New Components
1. Create new `.css` file in `styles/` directory
2. Add to `componentOrder` array in `build-css.js`
3. Follow naming conventions and BEM methodology
4. Run `npm run build:css:watch` for development

### 3.3. Modifying Existing Components
1. Edit component file directly
2. Use `npm run build:css:watch` for live rebuilding
3. Build system automatically concatenates changes

**Important**: Edit files in `styles/` directory only. **Never edit `styles.css` directly!**

### 3.4. Build for Production
```bash
npm run build:css
```
Runs full pipeline and generates optimized `styles.css`.

### 3.5. Integration with Plugin Build

The CSS build is integrated into the main plugin build:

```bash
npm run build  # Builds TypeScript + CSS
```

### 3.6. CI/CD Integration

```bash
# In your CI pipeline
npm ci
npm run lint:css
npm run build:css
```

## 4. Design System

### 4.1. Control Center Framework
Based on Material Design 3 principles:
- Consistent spacing and sizing scales
- Semantic color tokens
- Motion and animation standards
- Accessibility compliance

### 4.2. Design Tokens
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

## 5. Code Standards

### 5.1. CSS Naming Conventions

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

### 5.2. CSS Custom Properties
- **Material Design**: `--md-[property]`
- **OSP Design Tokens**: `--osp-[property]`
- **Sonigraph Specific**: `--sonigraph-[property]`

Examples:
```css
--md-primary
--osp-spacing-md
--sonigraph-waveform-color
```

### 5.3. Stylelint Rules

- Max nesting depth: 3 levels
- Required generic font families
- Consistent color format (lowercase hex)
- Consistent unit case (lowercase)
- No vendor prefixes (handled by build)

### 5.4. Prettier Formatting

- Print width: 100 characters
- 2 spaces for indentation
- Double quotes for strings
- No trailing commas
- LF line endings

### 5.5. Code Quality
- Stylelint enforces naming patterns and best practices
- Prettier ensures consistent formatting
- Build system prevents syntax errors from reaching production

## 6. Performance & Optimization

### 6.1. Bundle Optimization
- Single CSS file reduces HTTP requests
- Gzip-friendly structure with repeated patterns
- Dead code elimination through component isolation
- **~70% size reduction** from component organization
- **Zero duplication** across components

### 6.2. Runtime Performance
- CSS custom properties for dynamic theming
- Hardware-accelerated animations
- Minimal layout thrashing through careful positioning
- **Optimized cascade order** for better CSS performance

## 7. Obsidian Integration

### 7.1. Theme Compatibility
- Structural styling only (no visual overrides)
- Uses Obsidian's built-in CSS variables where possible
- Graceful fallbacks for missing theme variables

### 7.2. Plugin Constraints
- Single CSS file requirement
- No external dependencies
- Reading View and Live Preview compatibility

## 8. Accessibility

### 8.1. Standards Compliance
- WCAG 2.1 AA compliance
- High contrast mode support
- Reduced motion preferences
- Keyboard navigation support

### 8.2. Implementation
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

## 9. Troubleshooting

### 9.1. Common Issues

**Build fails with lint errors:**
```bash
npm run lint:css:fix
```

**Formatting issues:**
```bash
npm run format:css
```

**Missing dependencies:**
```bash
npm install
```

**Build failures**: Check for CSS syntax errors in component files

**Missing styles**: Verify component is added to build order

**Linting errors**: Use `--no-fail-on-lint` for production builds with legacy code

**Orphaned CSS files**: Check build output for warnings about files not in component order

### 9.2. File Structure Issues

**Component not included in build:**
Add to `componentOrder` array in `build-css.js`

**CSS duplication:**
Ensure styles exist in only one component file

### 9.3. Debugging
```bash
# Check specific component for errors
npx stylelint "styles/[component].css"

# Format specific component
npx prettier --write "styles/[component].css"

# Build only (skip linting)
node build-css.js --build-only
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

---

*For related documentation, see:*
- [UI Components](ui-components.md) - Component implementation details
- [Overview](overview.md) - System integration
- [Performance & Monitoring](performance.md) - Runtime performance optimization

*This architecture provides a solid foundation for maintainable, scalable CSS development while meeting Obsidian's unique requirements and constraints.*