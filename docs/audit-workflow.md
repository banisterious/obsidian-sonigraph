# Audit Workflow Documentation

This document explains the automated code quality audit system implemented to prevent Obsidian PR review issues from resurfacing.

## Overview

Based on [PR review #8036](https://github.com/obsidianmd/obsidian-releases/pull/8036), we've implemented an automated audit system that prevents critical security and code quality issues from being committed.

## Components

### 1. ESLint Configuration (`eslint.config.mjs`)

**Updated to ESLint v9.x with flat config format**

Enforces TypeScript best practices and Obsidian plugin requirements:

#### TypeScript Rules
- **`@typescript-eslint/no-explicit-any`** (error) - Blocks `as any` type casts
- **`@typescript-eslint/no-non-null-assertion`** (error) - Blocks unsafe `!` assertions
- **`@typescript-eslint/no-unsafe-*`** (warn) - Detects unsafe type operations
- **`no-console`** (error) - Blocks console.log/debug/info (except in `logging.ts`)

#### Obsidian Plugin Rules (via `eslint-plugin-obsidianmd`)

The official [@obsidian/eslint-plugin](https://github.com/obsidianmd/eslint-plugin) provides 30+ Obsidian-specific linting rules:

**UI & Styling**
- **`obsidianmd/no-static-styles-assignment`** (error) - Prevents direct style assignments (use CSS classes or `setCssProps`)
- **`obsidianmd/ui/sentence-case`** (error) - Enforces sentence case for UI text
- **`obsidianmd/no-forbidden-elements`** (error) - Blocks problematic HTML elements

**Code Quality**
- **`obsidianmd/no-tfile-tfolder-cast`** (error) - Prevents unsafe TFile/TFolder type casts
- **`obsidianmd/platform`** (error) - Ensures proper platform detection
- **`obsidianmd/prefer-file-manager-trash-file`** (warn) - Recommends using FileManager.trashFile over vault.delete

**Commands & Settings**
- **`obsidianmd/commands/no-command-in-command-id`** (error) - Enforces proper command ID format
- **`obsidianmd/settings-tab/no-manual-html-headings`** (error) - Prevents manual HTML headings in settings
- And 20+ more rules for best practices

### 2. Pre-commit Hooks (`.husky/pre-commit`)

Automatically runs before every commit via `lint-staged`:

1. `npm run audit:innerHTML` - Blocks innerHTML/outerHTML usage
2. `npm run audit:console` - Blocks console statements
3. `eslint --fix` - Lints and auto-fixes TypeScript issues

**Result:** Commits are blocked if critical issues are detected.

### 3. NPM Scripts

#### Quick Checks (exit on first failure)

```bash
# Run comprehensive PR requirements audit
npm run audit:pr

# Run all checks (innerHTML + console + lint)
npm run audit:check

# Check innerHTML/outerHTML only
npm run audit:innerHTML

# Check console statements only
npm run audit:console

# Lint TypeScript files
npm run lint
npm run lint:fix  # Auto-fix issues
```

#### Comprehensive Report

```bash
# Generate full audit report with colored output
npm run audit:report
```

Output example:
```
════════════════════════════════════════════════════════
  Obsidian PR Compliance Audit
════════════════════════════════════════════════════════

📋 [1/3] Checking innerHTML/outerHTML usage...
   ✓ Found: 0 instances (target: 0)

📋 [2/3] Checking console.log/debug/info statements...
   ✓ Found: 0 instances (target: 0)

📋 [3/3] Checking 'as any' type casts...
   ⚠ Found: 81 instances (target: <50, acceptable: <85)
```

### 4. VS Code Integration (`.vscode/settings.json`)

Provides real-time feedback in the editor:

- ESLint integration with auto-fix on save
- Search exclusions for node_modules and build artifacts
- TypeScript integration

## Workflow

### For Developers

1. **Write code** - VS Code shows ESLint warnings in real-time
2. **Stage changes** - `git add <files>`
3. **Commit** - `git commit -m "message"`
   - Pre-commit hook automatically runs audit checks
   - If issues found, commit is blocked with error message
   - Fix issues and try again
4. **Push** - `git push`

### For Code Reviews

Before approving a PR, verify audit compliance:

```bash
npm run audit:report
```

All critical checks must pass (innerHTML: 0, console: 0).

### Monthly Maintenance

Run comprehensive audit to track progress on `as any` reduction:

```bash
npm run audit:report
```

Goal: Reduce `as any` count from 81 to <50 over time.

## Bypassing Hooks (Emergency Only)

In rare cases where you need to bypass pre-commit hooks:

```bash
git commit --no-verify -m "message"
```

**⚠️ WARNING:** Only use in emergencies. Bypassed commits may be rejected by Obsidian plugin review.

## Troubleshooting

### Pre-commit hook not running

```bash
# Reinstall hooks
npm run prepare
```

### ESLint not working in VS Code

1. Reload VS Code window
2. Check output panel: View > Output > ESLint
3. Verify `.eslintrc.json` exists in project root

### Audit script fails with "command not found"

```bash
# Make script executable
chmod +x scripts/audit-report.sh
```

## Compliance Targets

| Issue | Target | Current | Status |
|-------|--------|---------|--------|
| innerHTML/outerHTML | 0 | 0 | ✅ |
| console statements | 0 | 0 | ✅ |
| `as any` casts | 0 | 0 | ✅ |
| Non-null assertions | 0 | 0 | ✅ |

## Related Documentation

- [contributing.md](../contributing.md) - Code quality standards for contributors
- [audit-report.md](../audit-report.md) - Detailed audit findings
- [claude.md](../claude.md) - Project guidelines and standards

## Future Enhancements

Potential improvements to consider:

1. **GitHub Actions CI/CD** - Run audits on all PRs
2. **Automated monthly reports** - Track progress on Obsidian-specific issues
3. **Badge in README** - Show audit compliance status
4. **Fix Obsidian plugin warnings** - Address 606 issues identified by `eslint-plugin-obsidianmd` (448 UI sentence case, 155 style assignments, 3 other)

---

**Last updated:** 2025-11-12
**Audit System Version:** 2.1.0

## Version 2.1.0 Updates (2025-11-12)

- Integrated official `eslint-plugin-obsidianmd` for Obsidian-specific linting
- Upgraded to ESLint v9.x with flat config format (`eslint.config.mjs`)
- Upgraded TypeScript from 4.7.4 to 5.7.2 for compatibility
- Upgraded typescript-eslint from 5.29.0 to 8.46.4
- Added 30+ Obsidian-specific rules covering UI, commands, settings, and code quality
- Identified 606 Obsidian-specific issues for future cleanup (non-blocking)

## Version 2.0.0 Updates (2025-11-12)

- Upgraded ESLint rules from warnings to errors for `no-explicit-any` and added `no-non-null-assertion`
- All PR review requirements now at 100% compliance (0 instances of all issues)
- Added `npm run audit:pr` comprehensive check script
- Updated pre-commit hooks to block all critical issues
