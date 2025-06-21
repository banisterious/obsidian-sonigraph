# Issue #012: Vocal Instrument Silence in High Quality Mode

**Date Created:** 2025-06-21  
**Status:** Open  
**Priority:** High  
**Type:** Bug  

## Summary

Individual vocal instruments (soprano, alto, tenor, bass) produce no sound when "Use High Quality Samples" mode is enabled, due to failed CDN sample loading that doesn't fall back to synthesis.

## Background

Following Issue #011 CDN Sample Loading Diagnosis, we identified that while most instruments gracefully fall back to synthesis when CDN samples are unavailable, the vocal instruments fail silently, resulting in no audio output.

## Technical Details

### Affected Instruments
- `soprano` - trying to load from `samples/soprano/` (doesn't exist)
- `alto` - trying to load from `samples/alto/` (doesn't exist) 
- `tenor` - trying to load from `samples/tenor/` (doesn't exist)
- `bass` - trying to load from `samples/bass-voice/` (doesn't exist)

### Error Pattern
From logs: `"buffer is either not set or not loaded"` when `triggerAttackRelease` is called.

### Root Cause
The audio engine creates `Sampler` instances for these instruments when `useHighQualitySamples` is enabled, but when the CDN samples fail to load, the Samplers remain in an invalid state instead of falling back to synthesis.

## Expected Behavior

When CDN samples fail to load, vocal instruments should:
1. Log the loading failure  
2. Automatically fall back to synthesis mode
3. Continue to produce sound using synthesized voices

## Current Behavior

When CDN samples fail to load, vocal instruments:
1. Log loading errors
2. Remain as invalid Sampler instances
3. Produce no sound when triggered

## Impact

- **User Experience:** Silent playback for 4 vocal instruments in high quality mode
- **Musical Quality:** Missing vocal elements in orchestral compositions
- **Trust:** Users may think the plugin is broken when vocals don't sound

## Resolution Plan

1. **Add Error Handling:** Implement CDN loading failure detection in audio engine
2. **Synthesis Fallback:** Create synthesis instances when sample loading fails
3. **User Feedback:** Provide clear logging about fallback mode activation
4. **Testing:** Verify all instruments produce sound in both modes

## Acceptance Criteria

- [ ] All vocal instruments produce sound in high quality mode
- [ ] Failed CDN loading automatically falls back to synthesis  
- [ ] Clear diagnostic logging for fallback activation
- [ ] No regression in synthesis-only mode
- [ ] No regression in working CDN sample instruments

## Related Issues

- **Issue #011:** CDN Sample Loading Diagnosis (parent issue)
- **Future Issue #013:** Complete CDN sample coverage expansion

## Test Cases

1. Enable "Use High Quality Samples" 
2. Play sequence with soprano, alto, tenor, bass instruments enabled
3. Verify all vocals produce audible sound
4. Check logs for proper fallback messaging
5. Disable "Use High Quality Samples"
6. Verify vocals still work in synthesis mode