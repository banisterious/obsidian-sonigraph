# PR Review Issues - Structured Table

**Source**: obsidian-pr-review-comment-3534727051.md
**Generated**: 2025-11-14

---

## How to Use This Document

This table organizes all required fixes from the Obsidian PR review into an actionable format.

- **#**: Sequential issue number
- **File**: Source file containing the issue
- **Line(s)**: Line number(s) where the issue occurs
- **Issue Type**: Category of the issue
- **Description**: Full description of what needs to be fixed
- **Status**: Track progress (❌ Not Fixed | ✅ Fixed)

---

## Required Issues

### Style Manipulation Issues (17 total)

| # | File | Line | Issue Type | Description | Status |
|---|------|------|------------|-------------|--------|
| 1 | src/graph/LocalSoundscapeRenderer.ts | 635 | Direct Style | Avoid setting styles directly via `element.style.position`. Use CSS classes or `setCssProps`. | ❌ |
| 2 | src/graph/LocalSoundscapeRenderer.ts | 636 | Direct Style | Avoid setting styles directly via `element.style.display`. Use CSS classes or `setCssProps`. | ❌ |
| 3 | src/graph/LocalSoundscapeRenderer.ts | 637 | Direct Style | Avoid setting styles directly via `element.style.pointerEvents`. Use CSS classes or `setCssProps`. | ❌ |
| 4 | src/graph/LocalSoundscapeRenderer.ts | 638 | Direct Style | Avoid setting styles directly via `element.style.zIndex`. Use CSS classes or `setCssProps`. | ❌ |
| 5 | src/ui/LocalSoundscapeView.ts | 172 | Direct Style | Avoid setting styles directly via `element.style.height`. Use CSS classes or `setCssProps`. | ❌ |
| 6 | src/ui/SonicGraphView.ts | 541 | Direct Style | Avoid setting styles directly via `element.style.cursor`. Use CSS classes or `setCssProps`. | ❌ |
| 7 | src/ui/SonicGraphView.ts | 542 | Direct Style | Avoid setting styles directly via `element.style.userSelect`. Use CSS classes or `setCssProps`. | ❌ |
| 8 | src/ui/SonicGraphView.ts | 5621 | Direct Style | Avoid setting styles directly via `element.style.flex`. Use CSS classes or `setCssProps`. | ❌ |
| 9 | src/ui/SonicGraphView.ts | 5622 | Direct Style | Avoid setting styles directly via `element.style.fontSize`. Use CSS classes or `setCssProps`. | ❌ |
| 10 | src/ui/SonicGraphView.ts | 5629 | Direct Style | Avoid setting styles directly via `element.style.background`. Use CSS classes or `setCssProps`. | ❌ |
| 11 | src/ui/SonicGraphView.ts | 5630 | Direct Style | Avoid setting styles directly via `element.style.border`. Use CSS classes or `setCssProps`. | ❌ |
| 12 | src/ui/SonicGraphView.ts | 5631 | Direct Style | Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes or `setCssProps`. | ❌ |
| 13 | src/ui/SonicGraphView.ts | 5653 | Direct Style | Avoid setting styles directly via `element.style.boxShadow`. Use CSS classes or `setCssProps`. | ❌ |
| 14 | src/ui/SonicGraphView.ts | 5709 | Direct Style | Avoid setting styles directly via `element.style.width`. Use CSS classes or `setCssProps`. | ❌ |
| 15 | src/ui/SonicGraphView.ts | 5787 | Direct Style | Avoid setting styles directly via `element.style.borderTop`. Use CSS classes or `setCssProps`. | ❌ |
| 16 | src/ui/play-button-manager.ts | 194 | Direct Style | Avoid setting styles directly via `element.style.animation`. Use CSS classes or `setCssProps`. | ❌ |
| 17 | src/ui/control-panel.ts | 739 | Direct Style | Avoid setting styles directly via `element.style.color`. Use CSS classes or `setCssProps`. | ❌ |

### Object Stringification Issues (5 total)

| # | File | Line | Issue Type | Description | Status |
|---|------|------|------------|-------------|--------|
| 18 | src/export/ExportModal.ts | TBD | Object String | 'error' will use Object's default stringification format ('[object Object]') when stringified. | ❌ |
| 19 | src/export/ExportModal.ts | TBD | Object String | 'quality.bitDepth' will use Object's default stringification format ('[object Object]') when stringified. | ❌ |
| 20 | src/export/ExportModal.ts | TBD | Object String | 'quality.bitRate' will use Object's default stringification format ('[object Object]') when stringified. | ❌ |
| 21 | src/ui/SonicGraphView.ts | TBD | Object String | 'value' will use Object's default stringification format ('[object Object]') when stringified. | ❌ |
| 22 | src/ui/control-panel.ts | TBD | Object String | 'status.audio.currentNotes \|\| 0' will use Object's default stringification format ('[object Object]') when stringified. | ❌ |

### Other Required Issues (3 total)

| # | File | Line | Issue Type | Description | Status |
|---|------|------|------------|-------------|--------|
| 23 | TBD | TBD | Switch Case | Expected a 'break' statement before 'case'. | ❌ |
| 24 | TBD | TBD | Promise/Void | Promise-returning function provided to property where a void return was expected. | ❌ |
| 25 | TBD | TBD | Escape Char | Unnecessary escape character: ). | ❌ |

---

## Summary

**Total Required Issues**: 25
**Categories**:
- Direct Style Manipulation: 17
- Object Stringification: 5
- Switch Case: 1
- Promise/Void: 1
- Escape Character: 1

**Progress**: 0/25 (0%)

---

## Notes

1. The directive comment descriptions (197 instances) were fixed in a previous commit on branch `fix/eslint-directive-descriptions`
2. These 25 issues represent the remaining required fixes needed for PR approval
3. Focus on style manipulation issues first (17/25 = 68% of remaining work)
4. Some line numbers marked "TBD" need to be located via grep/search

