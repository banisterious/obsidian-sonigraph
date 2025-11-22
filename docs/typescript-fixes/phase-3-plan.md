# TypeScript Error Fixes - Phase 3 Plan

**Date:** 2025-01-21
**Branch:** `fix/typescript-errors`
**Starting Errors:** 295 (down from 639)
**Errors Fixed (Phases 1-2):** 344 (54%)

## Error Breakdown by Type

| Error Code | Count | Description | Priority |
|------------|-------|-------------|----------|
| TS2339 | 194 | Property does not exist on type | HIGH |
| TS2345 | 33 | Argument type not assignable | HIGH |
| TS2322 | 14 | Type not assignable | MEDIUM |
| TS2559 | 8 | Type has no properties in common | MEDIUM |
| TS2353 | 8 | Object literal unknown properties | MEDIUM |
| TS2341 | 6 | Only public/protected accessible | LOW |
| TS2304 | 5 | Cannot find name | LOW |
| Other | 27 | Various | LOW |

## Error Breakdown by File

### High Error Files (>10 errors)
1. **src/audio/engine.ts** - 88 errors (mostly TS2339)
2. **src/audio/effects/EffectBusManager.ts** - 26 errors
3. **src/export/ExportNoteCreator.ts** - 22 errors
4. **src/ui/settings/SonicGraphLayersSettings.ts** - 18 errors
5. **src/ui/GraphDemoModal.ts** - 18 errors
6. **src/ui/settings/LocalSoundscapeSettings.ts** - 12 errors
7. **src/audio/layers/MusicalGenreEngine.ts** - 12 errors
8. **src/ui/SampleTableBrowser.ts** - 10 errors

### Medium Error Files (5-9 errors)
- src/ui/material-components.ts - 9 errors
- src/export/ExportModal.ts - 9 errors
- src/audio/clustering/ClusterAudioMapper.ts - 9 errors

### Low Error Files (1-4 errors)
- 29 files with 1-4 errors each

## Phase 3 Strategy

### Step 1: Focus on TS2339 (194 errors)
**"Property does not exist on type"**

Primary cause: Type assertions to `unknown` or accessing properties on `any`

**Approach:**
1. Identify patterns in audio/engine.ts (88 errors)
2. Fix type definitions for common interfaces
3. Apply fixes to similar patterns across codebase

**Target:** Reduce by 150+ errors

### Step 2: Fix TS2345 (33 errors)
**"Argument type not assignable"**

Primary cause: Function calls with incompatible argument types

**Approach:**
1. Review function signatures
2. Add proper type guards or conversions
3. Update function definitions if needed

**Target:** Reduce by 25+ errors

### Step 3: Fix TS2322 (14 errors)
**"Type not assignable"**

Primary cause: Variable assignments with type mismatches

**Approach:**
1. Add type annotations
2. Fix type definitions
3. Use proper type guards

**Target:** Reduce by 10+ errors

### Step 4: Cleanup Remaining Errors (54 errors)
Handle smaller error categories case-by-case

**Target:** Reduce by 30+ errors

## Expected Outcome

**Goal:** Reduce from 295 to <80 errors (~73% reduction)
**Total Progress:** 639 → <80 errors (~87% reduction overall)

## Next Actions

1. Start with src/audio/engine.ts (88 errors) - largest concentration
2. Identify common patterns in TS2339 errors
3. Create type definitions or fix existing ones
4. Apply systematic fixes across similar code patterns
