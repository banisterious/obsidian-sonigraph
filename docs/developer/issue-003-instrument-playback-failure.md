# Issue #003: Instrument Family Playback Failure

**Status:** 🔍 ACTIVE  
**Priority:** High  
**Component:** Audio Engine  
**Last Updated:** 2025-06-18

## Table of Contents

- [Overview](#overview)
- [Problem Analysis](#problem-analysis)
  - [Affected Families](#affected-families)
  - [Current Behavior](#current-behavior)
  - [Expected Behavior](#expected-behavior)
- [Investigation Plan](#investigation-plan)
  - [Root Cause Analysis](#root-cause-analysis)
  - [Diagnostic Steps](#diagnostic-steps)
- [Technical Details](#technical-details)
  - [Voice Allocation](#voice-allocation)
  - [Sample Loading](#sample-loading)
  - [Synthesis Engine](#synthesis-engine)
- [Test Cases](#test-cases)
- [Next Steps](#next-steps)

---

## Overview

Multiple instrument families within the 34-instrument orchestral system are completely silent during playback despite being properly enabled and configured in the Control Center. This affects approximately 50% of the available instruments across major orchestral families.

**Key Challenge:** Core functionality is broken for major instrument categories, severely limiting the musical richness and orchestral capabilities of Sonigraph.

---

## Problem Analysis

### Affected Families

| Family | Affected Instruments | Status | Expected Synthesis |
|--------|---------------------|--------|-------------------|
| **🎤 Vocals** | Soprano, Alto, Tenor, Bass, Choir, Vocal Pads | Silent | Sample-based + formant filtering |
| **🥁 Percussion** | Timpani, Xylophone, Vibraphone, Gongs | Silent | Physics modeling + transient synthesis |
| **🌟 Electronic** | Lead Synth, Bass Synth, Arp Synth, Pad | Silent | Classic analog synthesis |
| **🌊 Experimental** | Whale Song, environmental sounds | Silent | Scientific recordings + oceanic effects |

### Current Behavior

**Symptoms:**
- Instruments appear enabled in Control Center tabs
- No audio output when sequences should be playing these instruments
- No visible errors in Control Center interface
- Other families (Strings, Brass, Woodwinds, Keyboard) work correctly

**Working Families:**
- ✅ **Keyboard**: Piano, Organ, Electric Piano, Harpsichord, Accordion, Celesta
- ✅ **Strings**: Strings, Violin, Cello, Guitar, Harp  
- ✅ **Brass**: Trumpet, French Horn, Trombone, Tuba
- ✅ **Woodwinds**: Flute, Clarinet, Saxophone, Oboe

### Expected Behavior

**Target State:**
- All enabled instruments should produce audio during playback
- Family-specific synthesis characteristics should be audible
- Instrument assignment should distribute across all enabled families
- Audio quality should match synthesis approach specifications

---

## Investigation Plan

### Root Cause Analysis

**Primary Investigation Areas:**

1. **Sample Loading Failures**
   - CDN connectivity for family-specific samples
   - CORS policy issues for specific domains
   - Missing sample files for affected families
   - Audio format compatibility issues

2. **Voice Allocation Logic**
   - Instrument assignment algorithm excluding certain families
   - Voice distribution not reaching affected instruments
   - Round-robin or frequency-based assignment bias

3. **Synthesis Engine Initialization**
   - Family-specific synthesis engines not initializing
   - Specialized engines (percussion, electronic) failing silently
   - Audio context problems for specific synthesis types

4. **Settings Configuration**
   - Family settings not properly loaded/applied
   - Instrument enable/disable state inconsistencies
   - Effect routing blocking audio for specific families

### Diagnostic Steps

**Phase 1: Browser Console Analysis**
```javascript
// Check for loading errors during playback
// Look for 404s, CORS errors, synthesis failures
// Examine Web Audio API error messages
```

**Phase 2: Voice Allocation Testing**
```javascript
// Test voice assignment for each family
// Verify instrument selection logic
// Check enabled instruments list for each family
```

**Phase 3: Synthesis Engine Testing**  
```javascript
// Test each synthesis engine independently
// Verify audio context state for each family
// Check effect routing for silent families
```

**Phase 4: Sample CDN Verification**
```javascript
// Direct sample URL testing
// Network request analysis
// Audio decoding verification
```

---

## Technical Details

### Voice Allocation

**Current System:**
- **Voice Assignment Strategies**: Frequency-based, round-robin, connection-based
- **Round-Robin Counter**: Cycles through enabled instruments
- **Frequency Ranges**: Each family targets specific frequency ranges

**Potential Issues:**
- Enabled instruments list not including affected families
- Voice assignment algorithm bias toward working families
- Frequency range conflicts excluding certain families

### Sample Loading

**CDN Structure:**
- External CDN samples for high-quality realistic sounds
- Browser caching for performance optimization  
- Graceful fallback to synthesis when samples unavailable

**Investigation Points:**
- Family-specific CDN paths and availability
- Audio format support for different families
- Sample loading timeout and error handling

### Synthesis Engine

**Architecture:**
- **Main Engine**: `src/audio/engine.ts` - Central orchestrator
- **Harmonic Engine**: `src/audio/harmonic-engine.ts` - Harmonic processing
- **Percussion Engine**: `src/audio/percussion-engine.ts` - Physics-based percussion
- **Electronic Engine**: `src/audio/electronic-engine.ts` - Analog-style synthesis

**Investigation Focus:**
- Specialized engine initialization for affected families
- Audio context compatibility with different synthesis approaches
- Effect processing pipeline for each family type

---

## Test Cases

### Playback Verification Tests

**Test Case 1: Individual Family Testing**
1. Enable only Vocal family instruments
2. Play sequence and verify audio output
3. Repeat for Percussion, Electronic, Experimental families
4. Compare with known working families (Strings, Brass)

**Test Case 2: Cross-Family Assignment**
1. Enable mix of working and non-working families
2. Monitor voice allocation distribution
3. Verify assignment reaches all enabled families

**Test Case 3: Browser Console Monitoring**
1. Open browser developer tools
2. Monitor Console and Network tabs during playback
3. Document all errors, warnings, and failed requests

**Test Case 4: Audio Context Analysis**
1. Inspect Web Audio API node connections
2. Verify audio routing for each family
3. Check for silent or disconnected nodes

---

## Next Steps

### Investigation Priority

**Phase 1: Console Error Analysis** (IMMEDIATE)
- Monitor browser console during affected family playback
- Document all error messages and failed network requests
- Identify primary failure mode (samples vs synthesis vs routing)

**Phase 2: Voice Allocation Testing** (HIGH)
- Test voice assignment logic for affected families
- Verify enabled instruments lists include all families
- Check round-robin distribution and frequency assignment

**Phase 3: Synthesis Engine Debugging** (HIGH)
- Test specialized engines (percussion, electronic) independently
- Verify audio context initialization for each family
- Check Web Audio API node creation and routing

**Phase 4: Sample CDN Investigation** (MEDIUM)
- Verify CDN availability for affected family samples
- Test direct sample URL access and audio decoding
- Document any missing or inaccessible sample files

### Success Criteria

**Resolution Validation:**
- ✅ All enabled instruments produce audible output
- ✅ Family-specific synthesis characteristics clearly audible
- ✅ Voice allocation distributes across all enabled families
- ✅ No console errors during multi-family playback
- ✅ Audio quality matches synthesis approach specifications

### Related Issues

- **Issue #005**: MP3 sample loading may be related to family-specific sample issues
- **Phase 3 Optimization**: Voice allocation improvements may have affected family distribution
- **CDN Configuration**: Sample loading architecture may need family-specific fixes

---

*This document tracks the investigation and resolution of critical instrument family playback failures affecting the core Sonigraph orchestral experience.*