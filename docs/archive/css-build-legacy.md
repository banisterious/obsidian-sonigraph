# Sonigraph CSS Build System (ARCHIVED)

> **⚠️ IMPORTANT: This document has been archived and superseded by the comprehensive CSS System documentation.**
> 
> **For current documentation, please visit:**
> - **[CSS System Architecture](../architecture/css-system.md)** - Complete CSS system documentation including architecture, build system, and development workflow
> 
> **Archived Date:** July 3, 2025  
> **Reason:** Merged with CSS architecture documentation into a single comprehensive guide for better maintainability

---

## Legacy Content (For Historical Reference Only)

This document describes the CSS build system for the Sonigraph Obsidian plugin.

## 📁 Architecture

The CSS is organized into **17 component files** in the `styles/` directory:

### Core Infrastructure
- `variables.css` - CSS custom properties and design tokens
- `base.css` - Base structural elements and typography
- `layout.css` - Grid systems and container layouts
- `utilities.css` - Utility classes and helpers

### UI Components
- `buttons.css` - Button variants and controls
- `controls.css` - Form controls, toggles, switches
- `cards.css` - Card components and containers
- `lists.css` - List components
- `navigation.css` - Navigation and drawer components
- `modals.css` - Modal system and overlays

### Feature Components
- `effects.css` - Effects, presets, and audio components
- `status.css` - Status displays and real-time feedback
- `settings.css` - Settings interface and configuration UI
- `controlcenter.css` - Control Center framework

### System Components
- `animations.css` - Keyframes and transitions
- `responsive.css` - Responsive breakpoints
- `theme.css` - Theme compatibility and accessibility

## 🔧 Build System

### Prerequisites

Install dependencies:
```bash
npm install
```

### Available Commands

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

### Build Pipeline

1. **Format** - Prettier formats all component files
2. **Lint** - Stylelint checks for errors and style issues
3. **Build** - Concatenates components into final `styles.css`

### Component Order

Components are concatenated in dependency order:

1. `variables.css` - Must be first (defines custom properties)
2. `base.css` - Base styles
3. `layout.css` - Layout systems
4. `utilities.css` - Utility classes
5. `buttons.css` - Button components
6. `controls.css` - Form controls
7. `cards.css` - Card components
8. `lists.css` - List components
9. `navigation.css` - Navigation
10. `modals.css` - Modals
11. `settings.css` - Settings UI
12. `effects.css` - Effects system
13. `status.css` - Status displays
14. `controlcenter.css` - Control Center
15. `animations.css` - Animations
16. `responsive.css` - Responsive rules
17. `theme.css` - Theme compatibility (must be last)

## 📝 Code Standards

### CSS Naming Conventions

- **Component classes**: `sonigraph-*`, `ospcc-*`, `osp-*`
- **Custom properties**: `--md-*`, `--osp-*`, `--sonigraph-*`
- **BEM methodology**: `.block__element--modifier`

### Stylelint Rules

- Max nesting depth: 3 levels
- Required generic font families
- Consistent color format (lowercase hex)
- Consistent unit case (lowercase)
- No vendor prefixes (handled by build)

### Prettier Formatting

- Print width: 100 characters
- 2 spaces for indentation
- Double quotes for strings
- No trailing commas
- LF line endings

## 🎯 Development Workflow

### 1. Development Mode
```bash
npm run build:css:watch
```
Automatically rebuilds CSS when component files change.

### 2. Edit Component Files
Edit files in `styles/` directory only. **Never edit `styles.css` directly!**

### 3. Build for Production
```bash
npm run build:css
```
Runs full pipeline and generates optimized `styles.css`.

## 🔍 Troubleshooting

### Common Issues

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

**Orphaned CSS files:**
Check build output for warnings about files not in component order.

### File Structure Issues

**Component not included in build:**
Add to `componentOrder` array in `build-css.js`

**CSS duplication:**
Ensure styles exist in only one component file

## 📊 Build Output

The build system generates detailed statistics:

- Components processed
- Total lines and file size
- Build duration
- Individual component sizes
- Orphaned file warnings

## 🚀 Integration

### Obsidian Plugin Build

The CSS build is integrated into the main plugin build:

```bash
npm run build  # Builds TypeScript + CSS
```

### CI/CD Integration

```bash
# In your CI pipeline
npm ci
npm run lint:css
npm run build:css
```

## 📈 Performance

- **~70% size reduction** from component organization
- **Zero duplication** across components
- **Optimized cascade order** for better CSS performance
- **Development watch mode** for fast iteration