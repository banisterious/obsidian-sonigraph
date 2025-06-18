# Issue #005: MP3 Sample Format Loading Failures

**Status:** 🔍 ACTIVE  
**Priority:** Medium  
**Component:** Audio Engine  
**Last Updated:** 2025-06-18

## Table of Contents

- [Overview](#overview)
- [Problem Analysis](#problem-analysis)
  - [Audio Format Dropdown](#audio-format-dropdown)
  - [Current Behavior](#current-behavior)
  - [Error Analysis](#error-analysis)
- [Technical Investigation](#technical-investigation)
  - [Sample Loading Architecture](#sample-loading-architecture)
  - [CDN Structure](#cdn-structure)
  - [Format Selection Logic](#format-selection-logic)
- [Browser Console Analysis](#browser-console-analysis)
- [Resolution Strategy](#resolution-strategy)
- [Next Steps](#next-steps)

---

## Overview

The Audio Format dropdown in Sonigraph Control Center includes an MP3 option that fails to load samples, causing console errors and falling back to synthesis. While WAV and "Synthesis Only" options work correctly, MP3 format selection results in failed network requests and broken audio experience.

**Key Challenge:** MP3 format promises better compression and faster loading but fails in implementation, limiting user choice and potentially affecting performance on slower connections.

---

## Problem Analysis

### Audio Format Dropdown

**Location:** Sonigraph Control Center → Audio Settings  
**Available Options:**
1. **"Synthesis Only"** - ✅ Works correctly (no sample loading)
2. **"WAV"** - ✅ Works correctly (loads WAV samples)
3. **"MP3"** - ❌ Fails (console errors, fallback to synthesis)

**Purpose:** Controls sample compression format for instrument sounds
- **Quality vs Size**: WAV = higher quality, larger files; MP3 = compressed, smaller files
- **Loading Speed**: MP3 should load faster on slower connections
- **Browser Compatibility**: Different formats for different browser capabilities

### Current Behavior

**When MP3 Selected:**
1. User selects "MP3" from Audio Format dropdown
2. Plugin attempts to load MP3 sample URLs
3. Network requests fail (documented in console)
4. System falls back to synthesis-only mode
5. User receives degraded audio experience without clear error indication

**Expected Behavior:**
1. User selects "MP3" from Audio Format dropdown
2. Plugin loads compressed MP3 samples successfully
3. Audio playback uses high-quality MP3 samples
4. Faster loading and reduced bandwidth usage compared to WAV

### Error Analysis

**Console Error Symptoms:**
- Network request failures during MP3 format selection
- 404 errors for MP3 sample URLs
- CORS policy violations for MP3 CDN requests
- Audio decoding failures for MP3 format

**User Experience Impact:**
- Broken format option creates user confusion
- No clear feedback about format loading failure
- Silent fallback to synthesis may go unnoticed
- Reduced audio quality without user awareness

---

## Technical Investigation

### Sample Loading Architecture

**Current Implementation:**
```typescript
// Sample loading flow (hypothetical)
interface SampleConfig {
  baseUrl: string;
  format: 'mp3' | 'wav' | 'synthesis';
  urls: Record<string, string>;
}

// Format selection affects URL generation
const sampleUrl = `${config.baseUrl}/${instrumentName}.${format}`;
```

**Investigation Points:**
1. **URL Generation**: How format selection affects sample URL construction
2. **CDN Availability**: Whether MP3 versions exist on CDN
3. **Error Handling**: How failed MP3 loads are handled and reported
4. **Fallback Logic**: When and how fallback to synthesis occurs

### CDN Structure

**Expected CDN Organization:**
```
https://cdn.example.com/samples/
├── wav/
│   ├── piano.wav
│   ├── violin.wav
│   └── trumpet.wav
├── mp3/
│   ├── piano.mp3
│   ├── violin.mp3
│   └── trumpet.mp3
└── ogg/
    ├── piano.ogg
    ├── violin.ogg
    └── trumpet.ogg
```

**Investigation Areas:**
- Do MP3 versions actually exist on the CDN?
- Are MP3 URLs correctly constructed?
- Are there CORS policy differences for MP3 vs WAV?
- Is the CDN configuration missing MP3 support?

### Format Selection Logic

**Settings Integration:**
```typescript
// Audio format setting affects sample loading
interface AudioSettings {
  format: 'synthesis' | 'wav' | 'mp3';
  quality: 'low' | 'medium' | 'high';
  enableCDN: boolean;
}

// Format change should trigger sample reload
const onFormatChange = (newFormat: string) => {
  this.reloadSamples(newFormat);
};
```

**Critical Questions:**
1. **Settings Persistence**: Does format selection persist correctly?
2. **Sample Reloading**: Does format change trigger proper sample reload?
3. **URL Construction**: Are MP3 URLs built correctly for all instruments?
4. **Error Recovery**: What happens when MP3 loading fails?

---

## Browser Console Analysis

### Expected Error Patterns

**Network Errors:**
```javascript
// Expected console output during MP3 failure:
GET https://cdn.example.com/samples/mp3/piano.mp3 404 (Not Found)
GET https://cdn.example.com/samples/mp3/violin.mp3 net::ERR_CORS_POLICY
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Audio Decoding Errors:**
```javascript
// Web Audio API errors:
Uncaught (in promise) DOMException: Unable to decode audio data
AudioContext decoding error for MP3 format
```

**Fallback Behavior:**
```javascript
// Expected fallback logging:
[Sonigraph] MP3 loading failed, falling back to synthesis
[AudioEngine] Sample loading timeout, using synthesis for piano
```

### Investigation Protocol

**Console Monitoring Steps:**
1. **Open Developer Tools** → Console tab
2. **Clear console** for clean monitoring
3. **Select MP3 format** in Control Center
4. **Monitor network requests** and error messages
5. **Document all failed requests** and error patterns
6. **Compare with WAV format** behavior for contrast

---

## Resolution Strategy

### Diagnostic Phase

**Step 1: CDN Verification**
- Manually test MP3 sample URLs in browser
- Verify CDN file availability and structure
- Check CORS policy configuration for MP3 files
- Document missing or inaccessible MP3 samples

**Step 2: Code Analysis**
- Locate format selection logic in audio engine
- Examine URL construction for MP3 format
- Review error handling and fallback mechanisms
- Test sample loading pipeline with different formats

**Step 3: Network Analysis**
- Monitor network requests during format switching
- Analyze request headers and response codes
- Check for CORS policy differences between formats
- Document complete request/response cycle for MP3

### Implementation Options

**Option 1: Fix MP3 CDN Issues**
- Upload missing MP3 samples to CDN
- Configure CORS policies for MP3 files
- Ensure proper URL construction and accessibility
- **Pros**: Full MP3 support as intended
- **Cons**: Requires CDN management and file generation

**Option 2: Remove MP3 Option**
- Remove MP3 from Audio Format dropdown
- Update settings to only include working formats
- Simplify format selection to WAV vs Synthesis Only
- **Pros**: Eliminates broken option, reduces confusion
- **Cons**: Loses potential compression benefits

**Option 3: Enhanced Error Handling**
- Improve MP3 loading error detection and reporting
- Provide clear user feedback when MP3 fails
- Implement graceful degradation with user notification
- **Pros**: Better UX even with broken MP3 support
- **Cons**: Still leaves MP3 fundamentally broken

**Option 4: Alternative Compression**
- Replace MP3 with OGG Vorbis format
- Use more reliable open-source compression
- Better browser compatibility and Web Audio support
- **Pros**: Compression benefits without MP3 issues
- **Cons**: Requires new sample encoding and CDN setup

---

## Next Steps

### Investigation Priority

**Phase 1: Console Error Documentation** (IMMEDIATE)
- Reproduce MP3 loading failure with console monitoring
- Document exact error messages and failed requests
- Identify primary failure mode (404, CORS, decoding, etc.)

**Phase 2: CDN Structure Analysis** (HIGH)
- Manually test MP3 sample URLs for existence
- Check CDN configuration and file availability
- Document missing MP3 files or configuration issues

**Phase 3: Code Review** (HIGH)
- Locate format selection and URL generation logic
- Review sample loading pipeline for MP3 handling
- Test error handling and fallback mechanisms

**Phase 4: Resolution Implementation** (MEDIUM)
- Choose optimal resolution strategy based on findings
- Implement fix or remove broken option
- Update user interface and documentation

### Success Criteria

**Resolution Validation:**
- ✅ MP3 format either works correctly or is removed from options
- ✅ No console errors during format selection
- ✅ Clear user feedback about format capabilities
- ✅ Graceful fallback behavior when samples unavailable
- ✅ Consistent behavior across all supported formats

### Related Issues

- **Issue #003**: Instrument family failures may be related to sample loading issues
- **Sample CDN**: Overall sample loading architecture may need review
- **Audio Format Architecture**: Format selection system may need redesign

---

*This document tracks the investigation and resolution of MP3 sample format loading failures affecting user choice and audio quality in Sonigraph.*