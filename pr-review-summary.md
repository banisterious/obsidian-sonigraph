# PR Review Summary - Quick Reference

**Source**: obsidian-pr-review-comment-3534727051.md
**Reviewing Commit**: 7eee82a (2025-11-14)
**Current Branch**: fix/eslint-directive-descriptions @ eb7eb7b

---

## Issues by Category

Based on manual analysis of the Required section (lines 3-226):

| Category | Count | Status | Files/Notes |
|----------|-------|--------|-------------|
| **Directive Comments** | 197 | ✅ FIXED (eb7eb7b) | All 17 files - descriptions added |
| **Case Block Lexical** | 62 | ❌ TODO | Wrap `const`/`let` in braces in switch cases |
| **Async No-Await** | ~53 | ❌ TODO | Remove `async` from methods without await |
| **Direct Style Manipulation** | 17 | ❌ TODO | Replace `.style.X =` with CSS classes |
| **Object Stringification** | 5 | ❌ TODO | Fix template literals with objects |
| **Promise-in-Void** | 2 | ❌ TODO | Wrap with `void` or return Promise |
| **Node.js Imports** | 2 | ❌ TODO | Replace fs/path with Obsidian APIs |
| **Deprecated APIs** | 2 | ❌ TODO | Transport → getTransport(), substr → slice() |
| **No prompt/confirm** | 2 | ❌ TODO | Replace with Obsidian Notice |
| **Use requestUrl** | 1 | ❌ TODO | Replace fetch() with requestUrl() |
| **Require Import** | 1 | ❌ TODO | Use ES6 import |
| **Console Statement** | 1 | ❌ TODO | Remove or use allowed methods |
| **UI Text Casing** | 1 | ❌ TODO | Use sentence case |
| **Missing Break** | 1 | ❌ TODO | Add break before case |
| **Unnecessary Escape** | 1 | ❌ TODO | Remove escape char |
| **Other** | ~20 | ❌ TODO | Misc issues (assertions, template types, etc.) |

**Total**: ~370 individual instances across ~110 distinct issue types
**Fixed**: 197 (directive comments)
**Remaining**: ~173

---

## Priority Order for Fixes

### High Priority (Blocking)
1. **Case Block Lexical** (62) - Wrap declarations in braces
2. **Async No-Await** (~53) - Remove unnecessary async keywords
3. **Direct Style** (17) - Use CSS classes instead of inline styles
4. **Node.js Imports** (2) - Replace with Obsidian APIs
5. **Use requestUrl** (1) - Required for Obsidian compatibility

### Medium Priority (Quality)
6. **Object Stringification** (5) - Fix template literal types
7. **Promise-in-Void** (2) - Proper Promise handling
8. **Deprecated APIs** (2) - Update to current APIs

### Low Priority (Polish)
9. **No prompt/confirm** (2) - Use Obsidian UI patterns
10. **Console/Require/Casing/Break/Escape** (5) - Minor issues

---

## Fix Patterns

### Case Block Lexical Declaration
```typescript
// Before:
switch (type) {
  case 'foo':
    const x = 1;  // ❌ Error
    break;
}

// After:
switch (type) {
  case 'foo': {
    const x = 1;  // ✅ Fixed
    break;
  }
}
```

### Async No-Await
```typescript
// Before:
async method() { return value; }  // ❌ No await inside

// After:
method() { return value; }  // ✅ Removed async
```

### Direct Style Manipulation
```typescript
// Before:
element.style.color = 'red';  // ❌ Direct style

// After:
element.addClass('color-red');  // ✅ CSS class
// OR
setCssProps(element, { color: 'red' });  // ✅ Helper function
```

### Node.js Imports
```typescript
// Before:
import * as fs from 'fs';  // ❌ Node.js module

// After:
import { TFile } from 'obsidian';  // ✅ Obsidian API
// Use app.vault methods instead
```

### Use requestUrl
```typescript
// Before:
const response = await fetch(url);  // ❌ fetch()

// After:
import { requestUrl } from 'obsidian';
const response = await requestUrl({ url });  // ✅ requestUrl()
```

---

## Notes

- This PR review is from commit `7eee82a` (before our directive comment fixes)
- Current branch `fix/eslint-directive-descriptions` @ `eb7eb7b` has directive comments fixed
- Next step: Create new branch for remaining ~173 fixes
- File reuses [[N]] reference numbers for each issue group
- Each group of [[N]] links shares one description line

---

## Template for Next PR Review

When next PR review arrives:

1. Count link groups (each starts with [[1]])
2. Each group = one issue type with N instances
3. Parse description line after each group
4. Categorize by fix pattern
5. Prioritize by: blocking > quality > polish
6. Create focused fix branches per category

