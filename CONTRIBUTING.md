# Contributing to Sonigraph

Thank you for your interest in contributing to Sonigraph! This document outlines the code quality standards and development workflow for this project.

## Code Quality Standards

### Critical Rules (Will Block Commits)

These rules are enforced by pre-commit hooks and must be followed:

1. **❌ NEVER use `innerHTML` or `outerHTML`**
   - **Reason:** Security vulnerability flagged in Obsidian plugin review
   - **Instead:** Use Obsidian DOM helpers
   ```typescript
   // ❌ BAD
   element.innerHTML = '<strong>Hello</strong>';

   // ✅ GOOD
   element.createEl('strong', { text: 'Hello' });
   ```

2. **❌ NEVER use `console.log`, `console.debug`, or `console.info`**
   - **Reason:** Pollutes user console, flagged in Obsidian plugin review
   - **Instead:** Use structured logging
   ```typescript
   // ❌ BAD
   console.log('Loading sample:', filename);

   // ✅ GOOD
   logger.info('sample-loading', 'Loading sample', { filename });
   ```

3. **⚠️ MINIMIZE `as any` type casts**
   - **Reason:** Reduces type safety, flagged in Obsidian plugin review
   - **Target:** Keep total count under 50 instances project-wide
   - **Instead:** Add proper type definitions or use type guards
   ```typescript
   // ❌ BAD
   const value = (settings as any)[key];

   // ✅ GOOD
   function getSetting<K extends keyof Settings>(key: K): Settings[K] {
       return settings[key];
   }
   ```

### Recommended Patterns

**DOM Manipulation:**
- ✅ `createEl()` - Create elements with attributes
- ✅ `appendText()` - Add text content safely
- ✅ `createDiv()`, `createSpan()` - Create common elements
- ✅ `createLucideIcon()` - Create SVG icons

**Logging:**
- ✅ `logger.debug()` - Development information
- ✅ `logger.info()` - User-facing events
- ✅ `logger.warn()` - Non-critical issues
- ✅ `logger.error()` - Critical errors

## Development Workflow

### Initial Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. The pre-commit hooks will be automatically installed via husky

### Before Committing

Pre-commit hooks will automatically run these checks:
- `npm run audit:innerHTML` - Check for innerHTML/outerHTML usage
- `npm run audit:console` - Check for console statements
- `eslint --fix` - Lint and auto-fix TypeScript issues

If any check fails, the commit will be blocked. Fix the issues and try again.

### Manual Audit

You can manually run the full audit at any time:

```bash
# Quick check (fast, exits on first failure)
npm run audit:check

# Full report (comprehensive, shows all violations)
npm run audit:report
```

### Building

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Deployment (for maintainers)

```bash
# Deploy to local vault for testing
npm run deploy
```

## Audit Score Targets

The project maintains these compliance targets based on [PR review #8036](https://github.com/obsidianmd/obsidian-releases/pull/8036):

| Issue | Target | Current |
|-------|--------|---------|
| innerHTML/outerHTML | 0 | 0 ✅ |
| console statements | 0 | 0 ✅ |
| `as any` casts | <50 | 81 ⚠️ |

## Need Help?

- Check [CLAUDE.md](CLAUDE.md) for project guidelines
- Review [docs/architecture/overview.md](docs/architecture/overview.md) for architectural patterns
- See existing code examples for recommended patterns
- Open an issue if you're unsure about a specific pattern

## Pull Request Process

1. Ensure all audit checks pass (`npm run audit:check`)
2. Build successfully (`npm run build`)
3. Test your changes in a live Obsidian vault
4. Update documentation if needed
5. Write clear, concise commit messages (see [CLAUDE.md](CLAUDE.md) for guidelines)

Thank you for helping maintain code quality! 🎵
