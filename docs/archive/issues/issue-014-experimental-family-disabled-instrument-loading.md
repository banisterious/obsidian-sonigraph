# Issue #014: Disabled Instruments Still Load When Using Family Toggles with High Quality Samples

**Status**: ✅ **RESOLVED** - Fixed in commit [pending]  
**Priority**: High  
**Category**: Audio Engine / Family Settings  
**Affects**: Sample loading mode with family toggles

## Problem Description

When using the Control Center with family toggles (e.g., only "Experimental" family enabled) and "Use High Quality Samples" turned on, disabled instruments still attempt to load samples from the CDN, causing 404 errors in the browser console.

### Original Error Example
```
GET https://nbrosowsky.github.io/tonejs-instruments/samples/bass-synth/C3.ogg 404 (Not Found)
GET https://nbrosowsky.github.io/tonejs-instruments/samples/clarinet/C3.ogg 404 (Not Found)
GET https://nbrosowsky.github.io/tonejs-instruments/samples/flute/C3.ogg 404 (Not Found)
```

## Root Cause Analysis

**Primary Issue**: Family toggle settings were ignored by sample loading logic in both:
1. Main initialization path (`initializeInstruments()` method)
2. FAST-PATH initialization path (`initializeMissingInstruments()` method)

**Secondary Issue**: Many instruments attempt to load from non-existent CDN directories (see CDN Analysis below).

## Technical Details

### Code Locations
- **File**: `src/audio/engine.ts`
- **Main Path**: Lines 943+ in `initializeInstruments()` method
- **FAST-PATH**: Lines 1866+ in `initializeMissingInstruments()` method

### Problem Pattern
```typescript
// BEFORE (problematic)
const pianoSampler = new Sampler(configs.piano); // Always loads regardless of enabled status

// AFTER (fixed)
if (this.settings.instruments.piano?.enabled === true) {
    const pianoSampler = new Sampler(configs.piano); // Only loads if enabled
}
```

## CDN Analysis

Investigation of `docs/integrations/nbrosowsky-tree.md` revealed that only **20 of 34+ instruments** actually exist on the nbrosowsky CDN:

### ✅ Available on CDN (20 instruments)
- bass-electric, bassoon, cello, clarinet, contrabass, flute, french-horn, guitar-acoustic
- guitar-electric, guitar-nylon, harp, harmonium, organ, piano, saxophone, trombone
- trumpet, tuba, violin, xylophone

### ❌ Missing from CDN (14+ instruments)  
- accordion, bass-synth, celesta, choir, drums, gongs, harpsichord, marimba
- oboe, strings, vibraphone, vocal-pads, and others

### Error Classification
- **Type 1**: Pure family toggle bugs (instruments disabled but still loading)
- **Type 2**: Compound issues (disabled + missing CDN files)

## Resolution

### Fix Applied
Added enabled checks to both initialization paths:

#### Main Initialization Path
```typescript
// Issue #014 Fix: Only initialize instruments that are enabled in family settings
if (this.settings.instruments.piano?.enabled === true) {
    // Initialize piano sampler
}
```

#### FAST-PATH Initialization  
```typescript
// Issue #014 Fix: Check if instrument is enabled before initializing
if (settings.instruments[instrumentName]?.enabled !== true) {
    logger.info('issue-014-fix', `🔧 FAST-PATH: Skipping disabled instrument: ${instrumentName}`);
    return;
}
```

### Verification Results
- ✅ **Before Fix**: 34 instruments attempting to initialize
- ✅ **After Fix**: Only 2 instruments initializing (experimental family only)
- ✅ **404 Errors**: Completely eliminated
- ✅ **Console Logs**: Show proper filtering with detailed logging

### Test Results
```
Configuration gaps detected: Volume controls: 34/2, Effects configurations: 34/2
```
This confirms only 2 enabled instruments are being initialized instead of all 34.

## Files Modified
- `src/audio/engine.ts` - Added enabled checks to both initialization paths
- `docs/archive/issues/issue-014-experimental-family-disabled-instrument-loading.md` - This documentation

## Testing Recommendations
1. Enable only "Experimental" family in Control Center
2. Turn on "Use High Quality Samples"
3. Verify no 404 errors in browser console
4. Confirm only experimental instruments load (xylophone, etc.)
5. Check initialization logs show proper filtering

## Related Issues
- **Issue #010**: Audio crackling (FAST-PATH initialization)
- **Issue #011**: CDN sample loading diagnostics
- **Issue #013**: Family-based instrument loading (original scope)

---
**Resolution Date**: 2025-06-22  
**Resolved By**: Issue #014 fix implementation  
**Verification**: Console errors eliminated, proper instrument filtering confirmed 