# Quick Reference: Audit Commands

## Daily Development

```bash
# Start development with watch mode
npm run dev

# Run quick audit before committing
npm run audit:check

# Auto-fix ESLint issues
npm run lint:fix
```

## Pre-Commit (Automatic)

When you run `git commit`, these checks run automatically:
1. ✅ Check for innerHTML/outerHTML
2. ✅ Check for console.log/debug/info
3. ✅ ESLint with auto-fix

**If any check fails, commit is blocked.**

## Manual Audit Commands

```bash
# Full audit report (comprehensive, colored output)
npm run audit:report

# Quick checks (exit on first failure)
npm run audit:check          # All checks
npm run audit:innerHTML      # innerHTML only
npm run audit:console        # console only
npm run lint                 # ESLint only
```

## What Gets Blocked

### ❌ Critical (Blocks Commit)

```typescript
// innerHTML/outerHTML
element.innerHTML = '<div>text</div>';

// console statements (except in logging.ts)
console.log('debug info');
console.debug('verbose');
console.info('information');
```

### ✅ Safe Alternatives

```typescript
// Use Obsidian DOM helpers
element.createEl('div', { text: 'text' });

// Use structured logging
logger.info('category', 'message', { data });
```

### ⚠️ Warnings (Won't Block)

```typescript
// 'as any' casts (try to minimize)
const value = settings as any;
```

## Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit checks (use sparingly!)
git commit --no-verify -m "emergency fix"
```

## Compliance Status

| Check | Target | Current |
|-------|--------|---------|
| innerHTML/outerHTML | 0 | 0 ✅ |
| console statements | 0 | 0 ✅ |
| `as any` casts | <50 | 81 ⚠️ |

## More Information

- [contributing.md](../contributing.md) - Full code quality guidelines
- [audit-workflow.md](audit-workflow.md) - Detailed workflow documentation
- [audit-report.md](../audit-report.md) - Latest audit findings
