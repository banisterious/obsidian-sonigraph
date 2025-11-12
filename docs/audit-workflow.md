# Audit Workflow Documentation

This document explains the automated code quality audit system implemented to prevent Obsidian PR review issues from resurfacing.

## Overview

Based on [PR review #8036](https://github.com/obsidianmd/obsidian-releases/pull/8036), we've implemented an automated audit system that prevents critical security and code quality issues from being committed.

## Components

### 1. ESLint Configuration (`.eslintrc.json`)

Enforces TypeScript best practices and Obsidian plugin requirements:

- **`@typescript-eslint/no-explicit-any`** (warn) - Flags `as any` type casts
- **`@typescript-eslint/no-unsafe-*`** (warn) - Detects unsafe type operations
- **`no-console`** (error) - Blocks console.log/debug/info (except in `logging.ts`)

### 2. Pre-commit Hooks (`.husky/pre-commit`)

Automatically runs before every commit via `lint-staged`:

1. `npm run audit:innerHTML` - Blocks innerHTML/outerHTML usage
2. `npm run audit:console` - Blocks console statements
3. `eslint --fix` - Lints and auto-fixes TypeScript issues

**Result:** Commits are blocked if critical issues are detected.

### 3. NPM Scripts

#### Quick Checks (exit on first failure)

```bash
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
| `as any` casts | <50 | 81 | ⚠️ (acceptable: <85) |

## Related Documentation

- [contributing.md](../contributing.md) - Code quality standards for contributors
- [audit-report.md](../audit-report.md) - Detailed audit findings
- [claude.md](../claude.md) - Project guidelines and standards

## Future Enhancements

Potential improvements to consider:

1. **GitHub Actions CI/CD** - Run audits on all PRs
2. **Automated monthly reports** - Track `as any` reduction progress
3. **Custom ESLint rules** - Block specific Obsidian antipatterns
4. **Badge in README** - Show audit compliance status

---

**Last updated:** 2025-11-11
**Audit System Version:** 1.0.0
