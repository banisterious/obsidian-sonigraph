# Sample Expansion Plan: Synthesis-Only Instruments & New Voices

**Status**: Planning Phase
**Last Updated**: 2025-11-16
**Target**: Replace synthesis with real samples for 6 instruments + add human voice instruments

---

## Current Synthesis-Only Instruments

1. **Oboe** (woodwind)
2. **Electric Piano** (keyboard)
3. **Harpsichord** (keyboard)
4. **Accordion** (keyboard)
5. **Celesta** (keyboard)
6. **Strings** (string ensemble)

## New Instrument Category: Human Voices

7. **Choir/Vocal Ensemble** (new family)
8. **Solo Voice** - male/female variants (new family)

---

## Phase 1: Oboe (PRIORITY: HIGH, EFFORT: LOW)

### Source
- **Library**: VSCO2 Community Edition
- **License**: Free, open-source
- **URL**: https://versilian-studios.com/vsco-community/
- **Format**: WAV samples + SFZ mapping
- **Size**: ~1.9 GB (full library)

### Implementation Steps
1. Download VSCO2 CE from Versilian Studios
2. Extract oboe samples from the library
3. Convert to OGG format (for web compatibility)
4. Host samples (similar to tonejs-instruments setup)
5. Update `src/audio/configs/woodwind-instruments.ts`:
   - Replace synthesis-only comment with sample URLs
   - Define note mapping (determine range from samples)
   - Configure baseUrl and effects
6. Test in Control Center
7. Commit and document

### Notes
- VSCO2 CE is well-documented and widely used
- Includes other instruments we might use later
- Professional quality recordings

---

## Phase 2: Electric Piano (PRIORITY: HIGH, EFFORT: MEDIUM)

### Sources (Pick One)

#### Option A: HEDSound Wurlitzer
- **URL**: https://www.hedsound.com/2019/09/wurlitzer-electronic-piano-hedsound.html
- **Format**: SF2 soundfont
- **Size**: 980KB (zipped)
- **Quality**: Good for Wurlitzer sound

#### Option B: jRhodes
- **URL**: Via Musical Artifacts or Bedroom Producers Blog
- **Format**: SF2 soundfont
- **Focus**: Rhodes Mark I sound
- **Size**: TBD

### Implementation Steps
1. Download chosen soundfont (SF2 file)
2. Extract samples using SF2 conversion tool:
   - Option 1: `polyphone` (free, cross-platform)
   - Option 2: `sf2-parser` (JavaScript library)
   - Option 3: Manual extraction with Audacity + sfz player
3. Convert extracted WAV to OGG
4. Organize samples by note
5. Host samples
6. Update `src/audio/configs/keyboard-instruments.ts`
7. Test and commit

### Required Tools
- SF2 extraction tool (to be determined)
- Audio conversion (ffmpeg or similar)

---

## Phase 3: Harpsichord (PRIORITY: MEDIUM, EFFORT: MEDIUM)

### Sources (Pick One)

#### Option A: Campbell's Harpsichord
- **URL**: https://www.hedsound.com/ or Musical Artifacts
- **Format**: SF2 (13MB) or SF3 (4MB)
- **Features**: Double manual harpsichord, multiple presets

#### Option B: Historic Harpsichord Collection
- **URL**: MuseScore community
- **Format**: SF2 soundfonts
- **Features**: 7 historic instruments (Venetian, Italian, French, German, English)
- **Tuning**: A=440 Hz, equal temperament

### Implementation Steps
1. Download soundfont
2. Extract samples (same process as electric piano)
3. Convert and host
4. Update keyboard-instruments.ts
5. Test and commit

---

## Phase 4: Accordion (PRIORITY: MEDIUM, EFFORT: LOW-MEDIUM)

### Source
- **Library**: Musical Artifacts SFZ
- **URL**: https://musical-artifacts.com/artifacts/615
- **Format**: SFZ with 61 WAV samples
- **Quality**: 44.1kHz, 24-bit
- **Size**: 63.7MB (uncompressed)

### Implementation Steps
1. Download accordion SFZ pack
2. Extract WAV samples (already in individual files)
3. Convert to OGG if needed
4. Parse SFZ mapping to understand note assignments
5. Host samples
6. Update keyboard-instruments.ts
7. Test and commit

### Notes
- Easier than SF2 extraction since samples are already separate files
- SFZ mapping file tells us which sample goes to which note

---

## Phase 5: Celesta (PRIORITY: MEDIUM, EFFORT: MEDIUM)

### Sources (Pick One)

#### Option A: Neil Bickford's Sampled Celesta
- **URL**: https://gitlab.com/Nbickford/a-sampled-celesta
- **Format**: Soundfont + Sforzando files
- **License**: Open source (check GitLab repo)
- **Features**: Fully-sampled virtual celesta

#### Option B: Musical Artifacts
- **URL**: https://musical-artifacts.com/artifacts?tags=celesta
- **Format**: Various (SF2, WAV)
- **Options**: Multiple celesta soundfonts available

### Implementation Steps
1. Download from chosen source
2. Extract samples
3. Convert and host
4. Update keyboard-instruments.ts
5. Test and commit

---

## Phase 6: Strings (PRIORITY: LOW, EFFORT: HIGH)

### Challenge
String ensemble requires careful mixing of multiple sections (violins, violas, cellos, bass)

### Options

#### Option A: Keep Synthesis
- Current synthesis may be adequate for ensemble sound
- We already have individual string instruments (violin, cello, contrabass)
- Users can enable multiple string instruments for ensemble effect

#### Option B: Use VSCO2 CE String Sections
- Download VSCO2 CE string ensemble samples
- Create blended ensemble patches
- Significant effort to mix properly

### Recommendation
**Defer this until later** - Focus on instruments where synthesis is less adequate

---

## Technical Requirements

### Tools Needed
1. **SF2 → WAV Extraction**
   - Polyphone (https://www.polyphone-soundfonts.com/)
   - OR sf2-parser JavaScript library
   - OR Sforzando player + recording

2. **Audio Conversion**
   - ffmpeg (WAV → OGG conversion)
   - Batch processing scripts

3. **Sample Hosting**
   - Decision needed: Self-host or use CDN?
   - Follow tonejs-instruments pattern (GitHub Pages?)

### File Organization
```
samples/
├── oboe/
│   ├── C3.ogg
│   ├── D3.ogg
│   └── ...
├── electric-piano/
│   ├── C2.ogg
│   ├── C3.ogg
│   └── ...
├── harpsichord/
├── accordion/
└── celesta/
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Research SF2 extraction tools
- [ ] Set up audio conversion pipeline (ffmpeg)
- [ ] Decide on sample hosting location
- [ ] Create sample directory structure

### Phase 1: Oboe
- [ ] Download VSCO2 CE
- [ ] Extract oboe samples
- [ ] Convert to OGG
- [ ] Host samples
- [ ] Update woodwind-instruments.ts
- [ ] Test in Control Center
- [ ] Commit changes

### Phase 2: Electric Piano
- [ ] Choose source (Wurlitzer vs Rhodes)
- [ ] Download SF2
- [ ] Extract samples
- [ ] Convert and host
- [ ] Update keyboard-instruments.ts
- [ ] Test and commit

### Phase 3: Harpsichord
- [ ] Choose source
- [ ] Download and extract
- [ ] Convert and host
- [ ] Update configuration
- [ ] Test and commit

### Phase 4: Accordion
- [ ] Download SFZ pack
- [ ] Convert samples
- [ ] Host
- [ ] Update configuration
- [ ] Test and commit

### Phase 5: Celesta
- [ ] Choose source
- [ ] Download and extract
- [ ] Convert and host
- [ ] Update configuration
- [ ] Test and commit

### Phase 6: Strings (DEFERRED)
- [ ] Re-evaluate necessity
- [ ] If needed, plan implementation

---

## Phase 7: Human Voices - Choir (PRIORITY: MEDIUM, EFFORT: HIGH)

### Challenge
Adding human voice instruments is complex due to:
- Need for chromatic samples across vocal range
- Multiple vowel sounds (ah, oh, ee, oo, etc.)
- Male/female voice differences
- Ensemble vs solo considerations
- Licensing requirements for voice samples

### Potential Sources

#### Option A: Freesound.org Curation (RECOMMENDED FOR NOW)
- **URL**: https://freesound.org/
- **Already integrated**: You have Freesound API integration
- **Format**: Various (WAV, OGG, MP3)
- **License**: Creative Commons (varies by sample)
- **Approach**: Curate specific vocal samples
- **Effort**: MEDIUM - Requires manual curation

**Search Terms:**
- "choir sustain C4" (or other specific notes)
- "vocal ah chromatic"
- "male voice sustained"
- "female voice drone"
- "choir single note"

**Implementation:**
1. Use existing Freesound integration
2. Create curated list of voice samples by pitch
3. Download and organize by note
4. Create new "Voices" instrument family
5. Configure multiple voice instruments:
   - Choir (mixed)
   - Male Choir
   - Female Choir
   - Solo Male
   - Solo Female

#### Option B: LABS Choir by Spitfire Audio
- **URL**: https://labs.spitfireaudio.com/packs/choir
- **Quality**: Professional, recorded with Eric Whitacre Singers
- **Format**: Kontakt/VST (not web-ready)
- **License**: May have redistribution restrictions
- **Effort**: HIGH - Requires VST sampling and conversion

**Challenges:**
1. Need to sample each note from VST
2. Record output manually or use MIDI routing
3. Convert to web format
4. Potential licensing issues for redistribution

#### Option C: SoundFont Conversion
- **Sources**: Musical Artifacts, various free choir SF2s
- **Format**: SF2 soundfonts
- **Effort**: HIGH - SF2 extraction + potential quality issues

**Available Soundfonts:**
- Chamber choir samples (uair01 on Freesound)
- Choir of Voices single chords
- Various Creative Commons choir recordings

#### Option D: Create Your Own Sample Set
- **Approach**: Record or commission vocal samples
- **Effort**: VERY HIGH
- **Quality**: Can be tailored exactly to needs
- **License**: Full control

**Requirements:**
- Multiple vocalists or one vocalist with range
- Professional recording equipment
- Multiple vowel sounds per pitch
- Full chromatic range (typically C3-C5 for choir)

### Recommended Approach: Phased Implementation

**Phase 7A: Proof of Concept (Freesound)**
1. Curate 12 chromatic samples (1 octave) from Freesound
2. Create single "Choir" instrument
3. Test with one vowel sound (probably "ah")
4. Implement in experimental family first
5. Gather user feedback

**Phase 7B: Expansion**
1. Extend to 2-3 octaves if Phase 7A successful
2. Add multiple vowel sounds
3. Consider male/female variants
4. Move to permanent instrument family

### Implementation Checklist

#### Phase 7A: Choir Proof of Concept
- [ ] Research Freesound for chromatic vocal samples
- [ ] Curate 12-24 samples (C3-C4 or C4-C5)
- [ ] Download and organize by pitch
- [ ] Convert to consistent format (OGG)
- [ ] Normalize volume levels
- [ ] Create new "voices" instrument family config
- [ ] Add "choir" instrument configuration
- [ ] Test in Control Center
- [ ] Document in experimental features
- [ ] Gather user feedback

#### Phase 7B: Expansion (if successful)
- [ ] Extend chromatic range
- [ ] Add vowel variations (ah, oh, ee)
- [ ] Create male/female choir variants
- [ ] Add solo voice instruments
- [ ] Move from experimental to main family
- [ ] Update documentation

### Technical Considerations

**Voice Range Targets:**
- **Soprano**: C4 to C6
- **Alto**: G3 to G5
- **Tenor**: C3 to C5
- **Bass**: E2 to E4
- **Mixed Choir**: C3 to C5 (practical range)

**Vowel Priorities:**
1. "Ah" (most versatile)
2. "Oh" (warm, rich)
3. "Ee" (bright)
4. "Oo" (dark)

**Sample Requirements per Instrument:**
- Minimum: 12 samples (1 octave)
- Good: 24 samples (2 octaves)
- Ideal: 36+ samples (3 octaves)

### Licensing Notes
- Freesound: Check individual sample licenses (CC0, CC-BY, CC-BY-NC)
- Always attribute properly in documentation
- Keep licensing info with samples
- Document usage terms for each source

---

## Success Criteria

### Synthesis-Only Replacement
- [ ] All 5 target instruments have real samples (oboe, e-piano, harpsichord, accordion, celesta)
- [ ] Samples load correctly in Control Center
- [ ] Audio quality is acceptable
- [ ] No licensing issues
- [ ] Documentation updated
- [ ] Total added download size is reasonable (<50MB compressed)

### Human Voices (Phase 7A - Proof of Concept)
- [ ] Choir instrument with 12-24 chromatic samples implemented
- [ ] Samples are Creative Commons licensed with proper attribution
- [ ] Voice quality is acceptable for musical use
- [ ] Instrument appears in experimental family
- [ ] User feedback collected
- [ ] Decision made on Phase 7B expansion

---

## Resources

### Sample Libraries
- VSCO2 CE: https://versilian-studios.com/vsco-community/
- Musical Artifacts: https://musical-artifacts.com/
- HEDSound: https://www.hedsound.com/
- Polyphone Soundfonts: https://www.polyphone-soundfonts.com/
- Freesound: https://freesound.org/
- LABS Choir: https://labs.spitfireaudio.com/packs/choir

### Tools
- Polyphone SF2 Editor: https://www.polyphone-soundfonts.com/
- ffmpeg: https://ffmpeg.org/
- Audacity: https://www.audacityteam.org/

### Reference
- tonejs-instruments: https://github.com/nbrosowsky/tonejs-instruments
- Tone.js Sampler docs: https://tonejs.github.io/docs/Sampler

---

## Notes
- Keep synthesis as fallback if samples fail to load
- Consider lazy-loading samples to reduce initial load time
- Maintain consistent sample quality across all instruments
- Document licensing for each sample source used
