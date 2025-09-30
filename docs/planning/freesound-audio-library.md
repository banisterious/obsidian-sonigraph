# Freesound Audio Library for Continuous Layers

**Document Version:** 1.0  
**Date:** July 4, 2025  
**Purpose:** Curated collection of Freesound.org audio samples for Sonic Graph continuous layer genres

**Related Documents:**
- **Main Specification:** [Sonic Graph Audio Enhancement Specification](../sonic-graph-audio-enhancement-specification.md) - Overall enhancement design and technical implementation
- **Implementation Plan:** [Sonic Graph Audio Enhancement Implementation Plan](completed/sonic-graph-audio-enhancement-implementation-plan.md) - Detailed development roadmap and integration strategy

---

## Overview

This document maintains a curated collection of high-quality audio samples from Freesound.org for use in the Sonic Graph continuous layer system described in the [main specification](../sonic-graph-audio-enhancement-specification.md). Each entry includes the web URL, API download URL, license information, and usage notes for integration with the enhanced audio engine.

## URL Structure Reference

**Web URL Format:** `https://freesound.org/people/{username}/sounds/{id}/`  
**API Download URL:** `https://freesound.org/apiv2/sounds/{id}/download/`

---

## Audio Library Structure with Multi-Category Support

The audio library has been restructured to support samples in multiple categories with enhanced search capabilities. Each sample can belong to multiple categories while maintaining a primary category for organization.

### Enhanced Sample Interface

```typescript
interface AudioSample {
  id: string;
  url: string;
  title: string;
  license: string;
  attribution: string;
  attributionRequired: boolean;
  duration: number;
  
  // Multi-category support
  categories: string[];           // All applicable categories
  primaryCategory: string;        // Main category for organization
  
  // Enhanced search metadata
  searchKeywords: string[];       // Additional search terms
  tags: string[];
  description?: string;
  
  // Categorization metadata
  category: string;               // For existing compatibility
  fadeSettings: FadeSettings;
  
  // Optional contextual data
  geographicInfo?: GeographicInfo;
  recordingEquipment?: RecordingEquipment;
  specialFeatures?: Record<string, boolean>;
  atmosphericQualities?: string[];
}

interface AudioLibraryStructure {
  samples: Record<string, AudioSample>;           // All samples by ID
  categories: Record<string, CategoryInfo>;       // Category definitions
  crossReferences: Record<string, string[]>;     // Category cross-references
  searchIndex: SearchIndex;                       // Search optimization
}
```

### Sample Search Interface

```typescript
interface AudioSampleSearchModal extends FuzzySuggestModal<AudioSample> {
  // Search filters
  categoryFilters: string[];          // Multi-select categories
  durationRange: [number, number];    // Duration filtering
  licenseFilters: string[];           // License type filtering
  geographicFilters: string[];        // Geographic region filtering
  qualityFilters: string[];           // Audio quality indicators
  
  // Search capabilities
  searchFields: (keyof AudioSample)[];  // Fields to search across
  fuzzySearchEnabled: boolean;
  previewEnabled: boolean;            // Audio preview functionality
}
```

### Cross-Category Sample Examples

The following samples demonstrate multi-category placement:

```typescript
// Example: Broken Transmission Pads
broken_transmission_pads: {
  // ... existing sample data
  categories: ['ambient', 'sci-fi', 'experimental'],
  primaryCategory: 'ambient',
  searchKeywords: ['alien', 'transmission', 'communication', 'extraterrestrial', 'space'],
  description: 'Experimental ambient pad simulating broken alien transmission'
}

// Example: Whale Samples  
cornell_longisland_blue: {
  // ... existing sample data
  categories: ['oceanic', 'ambient', 'nature-sounds'],
  primaryCategory: 'oceanic',
  searchKeywords: ['whale', 'blue-whale', 'ocean', 'marine', 'scientific', 'research'],
  description: 'Blue whale vocalizations from Cornell/NOAA Long Island research'
}

// Example: Fantasy Sci-Fi City Forest
fantasy_scifi_city_forest: {
  // ... existing sample data  
  categories: ['sci-fi', 'ambient', 'atmospheric-music'],
  primaryCategory: 'sci-fi',
  searchKeywords: ['fantasy', 'futuristic', 'urban', 'nature', 'hybrid-environment'],
  description: 'Atmospheric soundscape blending sci-fi, fantasy, city and forest elements'
}
```

## Audio Sample Search Implementation

Based on Obsidian's search capabilities, the audio library will implement sophisticated search using `FuzzySuggestModal` and `SearchComponent`:

### Search Modal Implementation

```typescript
export class AudioSampleSearchModal extends FuzzySuggestModal<AudioSample> {
  private samples: AudioSample[];
  private filters: AudioSearchFilters;
  private onChooseSample: (sample: AudioSample) => void;
  
  constructor(app: App, samples: AudioSample[], onChooseSample: (sample: AudioSample) => void) {
    super(app);
    this.samples = samples;
    this.onChooseSample = onChooseSample;
    this.setPlaceholder('Search audio samples by genre, location, mood, or description...');
    this.setInstructions([
      { command: '↑↓', purpose: 'navigate samples' },
      { command: '↵', purpose: 'select sample' },
      { command: 'ctrl/cmd + f', purpose: 'focus search' },
      { command: 'esc', purpose: 'close search' },
    ]);
  }
  
  getItems(): AudioSample[] {
    return this.samples.filter(sample => this.applyFilters(sample));
  }
  
  getItemText(sample: AudioSample): string {
    // Multi-field search across all searchable content
    return [
      sample.title,
      sample.description || '',
      sample.tags.join(' '),
      sample.searchKeywords.join(' '),
      sample.categories.join(' '),
      sample.atmosphericQualities?.join(' ') || '',
      sample.geographicInfo?.country || '',
      sample.geographicInfo?.region || ''
    ].join(' ').toLowerCase();
  }
  
  renderSuggestion(sample: FuzzyMatch<AudioSample>, el: HTMLElement) {
    const container = el.createDiv({ cls: 'audio-sample-suggestion' });
    
    // Title with match highlighting
    const titleEl = container.createDiv({ cls: 'sample-title' });
    renderMatches(titleEl, sample.item.title, sample.match.matches);
    
    // Categories badges
    const categoriesEl = container.createDiv({ cls: 'sample-categories' });
    sample.item.categories.forEach(category => {
      categoriesEl.createSpan({ 
        cls: `category-badge category-${category}`,
        text: category 
      });
    });
    
    // Metadata row
    const metaEl = container.createDiv({ cls: 'sample-metadata' });
    metaEl.createSpan({ cls: 'duration', text: `${sample.item.duration}s` });
    metaEl.createSpan({ cls: 'license', text: sample.item.license });
    
    if (sample.item.geographicInfo?.country) {
      metaEl.createSpan({ cls: 'location', text: sample.item.geographicInfo.country });
    }
    
    // Quality indicators
    const qualityEl = container.createDiv({ cls: 'sample-quality' });
    if (sample.item.specialFeatures?.professionalRecording) {
      qualityEl.createSpan({ cls: 'quality-professional', text: '🎤 Professional' });
    }
    if (sample.item.specialFeatures?.highResolutionAudio) {
      qualityEl.createSpan({ cls: 'quality-hires', text: '🔊 Hi-Res' });
    }
    
    // Preview button
    const previewBtn = container.createDiv({ cls: 'sample-preview-btn' });
    previewBtn.createSpan({ text: '▶️ Preview' });
    previewBtn.onclick = (e) => {
      e.stopPropagation();
      this.previewSample(sample.item);
    };
  }
  
  onChooseItem(sample: AudioSample): void {
    this.onChooseSample(sample);
  }
  
  private applyFilters(sample: AudioSample): boolean {
    // Category filtering
    if (this.filters.categories.length > 0) {
      const hasMatchingCategory = this.filters.categories.some(category => 
        sample.categories.includes(category)
      );
      if (!hasMatchingCategory) return false;
    }
    
    // Duration filtering
    if (sample.duration < this.filters.durationRange[0] || 
        sample.duration > this.filters.durationRange[1]) {
      return false;
    }
    
    // License filtering
    if (this.filters.licenses.length > 0 && 
        !this.filters.licenses.includes(sample.license)) {
      return false;
    }
    
    // Geographic filtering
    if (this.filters.geographic.length > 0 && sample.geographicInfo) {
      const hasMatchingGeo = this.filters.geographic.some(geo =>
        sample.geographicInfo?.country?.toLowerCase().includes(geo.toLowerCase()) ||
        sample.geographicInfo?.region?.toLowerCase().includes(geo.toLowerCase())
      );
      if (!hasMatchingGeo) return false;
    }
    
    return true;
  }
  
  private previewSample(sample: AudioSample): void {
    // Implement audio preview functionality
    // Could integrate with existing AudioEngine for sample playback
  }
}

interface AudioSearchFilters {
  categories: string[];           // ['ambient', 'sci-fi', 'oceanic']
  durationRange: [number, number]; // [0, 300] seconds
  licenses: string[];            // ['CC0', 'CC BY 4.0']
  geographic: string[];          // ['Germany', 'Japan', 'Africa']
  quality: string[];             // ['professional', 'hi-res']
}
```

### Search Features

1. **Multi-Field Fuzzy Search**: Searches across title, description, tags, keywords, categories, and geographic data
2. **Category Filtering**: Filter by one or more categories (ambient, sci-fi, oceanic, etc.)
3. **Duration Range**: Find samples within specific duration ranges
4. **Geographic Search**: Search by country, region, or location
5. **Quality Indicators**: Filter by professional recordings, hi-res audio, etc.
6. **License Filtering**: Filter by license type for attribution requirements
7. **Preview Functionality**: Audio preview before selection
8. **Match Highlighting**: Visual highlighting of search matches
9. **Keyboard Navigation**: Full keyboard support following Obsidian patterns

### Integration with UI Settings

The search modal would integrate with the planned audio settings UI from Phase 6.1:

```typescript
// In SonicGraphModal.ts - Sample Library Integration section
private createSampleLibraryControls(container: HTMLElement): void {
  const sampleSection = container.createDiv('sample-library-section');
  sampleSection.createEl('h3', { text: 'Audio Sample Library' });
  
  // Search button
  new ButtonComponent(sampleSection)
    .setButtonText('Browse & Search Samples')
    .onClick(() => {
      new AudioSampleSearchModal(
        this.app,
        this.audioLibrary.getAllSamples(),
        (sample) => this.selectSample(sample)
      ).open();
    });
    
  // Quick category filters
  const quickFilters = sampleSection.createDiv('quick-category-filters');
  ['ambient', 'oceanic', 'sci-fi', 'drone'].forEach(category => {
    new ButtonComponent(quickFilters)
      .setButtonText(category.charAt(0).toUpperCase() + category.slice(1))
      .onClick(() => this.filterByCategory(category));
  });
}
```

---

## Sample Library Data Structure

### Restructured Categories with Cross-References

```typescript
const audioLibrary: AudioLibraryStructure = {
  samples: {
    // All 75 samples with enhanced metadata...
  },
  
  categories: {
    ambient: {
      name: 'Ambient',
      description: 'Atmospheric textures and natural soundscapes',
      primarySamples: [/* samples where primaryCategory === 'ambient' */],
      allSamples: [/* all samples with 'ambient' in categories array */]
    },
    'sci-fi': {
      name: 'Sci-Fi',
      description: 'Futuristic, space, and technological atmospheres',
      primarySamples: [/* sci-fi primary samples */],
      allSamples: [/* all sci-fi tagged samples */]
    },
    oceanic: {
      name: 'Oceanic',
      description: 'Whale songs, ocean sounds, and marine environments',
      primarySamples: [/* oceanic primary samples */],
      allSamples: [/* all oceanic/marine samples */]
    }
  },
  
  crossReferences: {
    'nature-documentary': ['ambient', 'oceanic'], // Samples good for nature docs
    'space-exploration': ['sci-fi', 'ambient'],   // Space-themed samples
    'meditation': ['ambient', 'drone'],           // Meditative samples
    'professional-recording': [/* samples with professional equipment */]
  }
};
```

---

## Drone Genre

### Atmospheric Drones

#### Electronic Minute No 152 - The Drone
- **Web URL:** https://freesound.org/people/gis_sweden/sounds/437386/
- **API URL:** https://freesound.org/apiv2/sounds/437386/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gis_sweden (not required for CC0)
- **Duration:** 5:46.906 (346.906 seconds)
- **Description:** Electronic drone track, part of Electronic Minute series
- **Tags:** drone, electronic, atmospheric
- **Usage Notes:** Excellent for sustained atmospheric background, no attribution required. Long duration ideal for extended continuous layers.

#### Modulated Drone (Key of G)
- **Web URL:** https://freesound.org/people/subtletransmissions/sounds/479059/
- **API URL:** https://freesound.org/apiv2/sounds/479059/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Modulated Drone (Key of G) by subtletransmissions -- https://freesound.org/s/479059/ -- License: Attribution 3.0`
- **Duration:** 1:02.000 (62.000 seconds)
- **Description:** Modulated drone in the key of G
- **Tags:** drone, modulated, key-g, tonal
- **Usage Notes:** Tonal drone with modulation, perfect for musical key-based continuous layers. Medium duration ideal for musical looping.

#### Lost Ark Drone
- **Web URL:** https://freesound.org/people/eardeer/sounds/400062/
- **API URL:** https://freesound.org/apiv2/sounds/400062/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Lost Ark Drone.wav by eardeer -- https://freesound.org/s/400062/ -- License: Attribution 4.0`
- **Duration:** 0:44.587 (44.587 seconds)
- **Description:** Lost Ark themed atmospheric drone
- **Tags:** drone, atmospheric, ambient, ark
- **Usage Notes:** Atmospheric drone with thematic elements, good for immersive continuous layers. Medium duration perfect for looping.

#### Drone 08
- **Web URL:** https://freesound.org/people/myluckyfeet/sounds/277372/
- **API URL:** https://freesound.org/apiv2/sounds/277372/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** myluckyfeet (not required for CC0)
- **Duration:** 0:45.098 (45.098 seconds)
- **Description:** Atmospheric drone, part of drone series
- **Tags:** drone, atmospheric
- **Usage Notes:** Excellent for sustained atmospheric background, no attribution required. Similar duration to Lost Ark Drone, good for alternating loops.

#### Atonal Drone 03
- **Web URL:** https://freesound.org/people/Skjor1/sounds/321761/
- **API URL:** https://freesound.org/apiv2/sounds/321761/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** Skjor1 (not required for CC0)
- **Duration:** 5:40.000 (340.000 seconds)
- **Description:** Atonal drone, part of atonal drone series
- **Tags:** drone, atonal, atmospheric, ambient
- **Usage Notes:** Excellent long-form atonal drone, no attribution required. Perfect companion to Electronic Minute No 152 for extended atmospheric layers.

#### Tinnito - Drone - Eau Tuyau Low
- **Web URL:** https://freesound.org/people/rombart/sounds/440688/
- **API URL:** https://freesound.org/apiv2/sounds/440688/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** rombart (not required for CC0)
- **Duration:** 0:34.304 (34.304 seconds)
- **Description:** Low water pipe drone with unique tonal character
- **Tags:** drone, low, water, pipe, tonal
- **Usage Notes:** Unique tonal drone with water/pipe characteristics, no attribution required. Shortest drone in collection, good for rapid cycling or layering.

#### Broken Hum
- **Web URL:** https://freesound.org/people/subtletransmissions/sounds/496216/
- **API URL:** https://freesound.org/apiv2/sounds/496216/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Broken Hum by subtletransmissions -- https://freesound.org/s/496216/ -- License: Attribution 3.0`
- **Duration:** 2:56.000 (176.000 seconds)
- **Description:** Broken hum with atmospheric qualities
- **Tags:** drone, hum, broken, atmospheric
- **Usage Notes:** Medium-length atmospheric drone with "broken" character, perfect for adding texture variation to continuous layers.

#### Tascam 246 (Buzz) 1
- **Web URL:** https://freesound.org/people/subtletransmissions/sounds/441987/
- **API URL:** https://freesound.org/apiv2/sounds/441987/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Tascam 246 (Buzz) 1.wav by subtletransmissions -- https://freesound.org/s/441987/ -- License: Attribution 3.0`
- **Duration:** 1:33.542 (93.542 seconds)
- **Description:** Atmospheric buzz from Tascam 246 equipment
- **Tags:** drone, buzz, tascam, equipment, lo-fi
- **Usage Notes:** Equipment-generated atmospheric buzz with vintage character. Perfect for adding analog texture to continuous layers.

#### Anglepoise Lamp
- **Web URL:** https://freesound.org/people/subtletransmissions/sounds/431903/
- **API URL:** https://freesound.org/apiv2/sounds/431903/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Anglepoise Lamp.wav by subtletransmissions -- https://freesound.org/s/431903/ -- License: Attribution 3.0`
- **Duration:** 1:38.353 (98.353 seconds)
- **Description:** Atmospheric drone from anglepoise lamp electrical hum
- **Tags:** drone, lamp, electrical, hum, ambient
- **Usage Notes:** Electrical lamp hum with ambient character. Unique everyday object drone perfect for organic/domestic atmospheric layers.

#### Drone at the 21th
- **Web URL:** https://freesound.org/people/gis_sweden/sounds/371518/
- **API URL:** https://freesound.org/apiv2/sounds/371518/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gis_sweden (not required for CC0)
- **Duration:** 0:11.888 (11.888 seconds)
- **Description:** Short atmospheric drone, part of Electronic Minute series
- **Tags:** drone, atmospheric, electronic, short
- **Usage Notes:** Very short atmospheric drone, no attribution required. Perfect for rapid cycling, transitions, or layering with longer drones.

#### Evolving Drone Pad
- **Web URL:** https://freesound.org/people/brogenhogan/sounds/360425/
- **API URL:** https://freesound.org/apiv2/sounds/360425/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** brogenhogan (not required for CC0)
- **Duration:** 2:05.522 (125.522 seconds)
- **Description:** Evolving drone pad with dynamic character
- **Tags:** drone, pad, evolving, atmospheric, dynamic
- **Usage Notes:** Evolving atmospheric pad with natural progression, no attribution required. Perfect for continuous layers that need internal development and variation.

#### Friday Lunch Drone
- **Web URL:** https://freesound.org/people/gis_sweden/sounds/346427/
- **API URL:** https://freesound.org/apiv2/sounds/346427/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gis_sweden (not required for CC0)
- **Duration:** 1:26.936 (86.936 seconds)
- **Description:** Atmospheric drone with casual, everyday character
- **Tags:** drone, atmospheric, casual, ambient
- **Usage Notes:** Casual atmospheric drone with relaxed character, no attribution required. Perfect for comfortable, non-intensive vault exploration sessions.

#### Drone, Rain, Fade Out
- **Web URL:** https://freesound.org/people/gerainsan/sounds/345779/
- **API URL:** https://freesound.org/apiv2/sounds/345779/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gerainsan (not required for CC0)
- **Duration:** 0:27.695 (27.695 seconds)
- **Description:** Atmospheric drone with rain elements and natural fade out
- **Tags:** drone, rain, fade, atmospheric, natural
- **Usage Notes:** Natural atmospheric drone with rain texture and fade-out ending, no attribution required. Perfect for transitions, nature-themed sessions, or gentle layer endings.

#### Derived Low Drone
- **Web URL:** https://freesound.org/people/gis_sweden/sounds/349030/
- **API URL:** https://freesound.org/apiv2/sounds/349030/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gis_sweden (not required for CC0)
- **Duration:** 2:19.319 (139.319 seconds)
- **Description:** Low-frequency derived atmospheric drone
- **Tags:** drone, low, derived, atmospheric, bass
- **Usage Notes:** Deep low-frequency atmospheric drone, no attribution required. Perfect for adding bass foundation to continuous layers or creating deep, contemplative atmospheres.

#### Drone Loop
- **Web URL:** https://freesound.org/people/stixthule/sounds/379515/
- **API URL:** https://freesound.org/apiv2/sounds/379515/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** stixthule (not required for CC0)
- **Duration:** 0:38.399 (38.399 seconds)
- **Description:** Atmospheric drone specifically designed for looping
- **Tags:** drone, loop, atmospheric, seamless
- **Usage Notes:** Purpose-built loop drone, no attribution required. Designed for seamless continuous playback, perfect for sustained atmospheric layers.

#### Synth Drone 3
- **Web URL:** https://freesound.org/people/apotter1992/sounds/239039/
- **API URL:** https://freesound.org/apiv2/sounds/239039/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Synth Drone 3 by apotter1992 -- https://freesound.org/s/239039/ -- License: Attribution 4.0`
- **Duration:** 10:14.000 (614.000 seconds)
- **Description:** Synthesized atmospheric drone, part of synth drone series
- **Tags:** drone, synth, synthesized, atmospheric, electronic
- **Usage Notes:** Clean synthesized drone with electronic character, attribution required. Extended duration perfect for very long vault exploration sessions or as primary background layer.

#### Electronic Minute No 226 - Minimal Drone 2 VCO
- **Web URL:** https://freesound.org/people/gis_sweden/sounds/457598/
- **API URL:** https://freesound.org/apiv2/sounds/457598/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gis_sweden (not required for CC0)
- **Duration:** 3:29.389 (209.389 seconds)
- **Description:** Minimal drone using 2 VCO (Voltage Controlled Oscillators) in VCV-Rack modular synth
- **Tags:** drone, minimal, electronic, modular, vcv-rack, vco
- **Usage Notes:** Minimal modular synth drone with 2 oscillators, no attribution required. Perfect for clean, minimal electronic atmospheres with precise oscillator control.

#### Electronic Minute No 224 - 3rd After 13 Drone
- **Web URL:** https://freesound.org/people/gis_sweden/sounds/457453/
- **API URL:** https://freesound.org/apiv2/sounds/457453/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gis_sweden (not required for CC0)
- **Duration:** 10:55.083 (655.083 seconds)
- **Description:** "A drone resting in chaos and ring modulator circuits" - complex electronic drone with ring modulation
- **Tags:** drone, chaos, ring-modulator, electronic, complex, experimental
- **Usage Notes:** Complex experimental drone with chaos and ring modulation, no attribution required. Perfect for deep, immersive vault exploration with evolving electronic textures. Longest drone in collection.

#### Electronic Minute No 218 - Algorithmic Drone Music Program
- **Web URL:** https://freesound.org/people/gis_sweden/sounds/456758/
- **API URL:** https://freesound.org/apiv2/sounds/456758/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** gis_sweden (not required for CC0)
- **Duration:** 10:27.594 (627.594 seconds)
- **Description:** "Algorithmic drone music program. The computer is my analog modular synth." - AI/algorithmic generated drone
- **Tags:** drone, algorithmic, generative, electronic, computational, modular
- **Usage Notes:** Algorithmically generated drone using computer as modular synth, no attribution required. Perfect for AI-themed vaults or computational music exploration. Second longest drone in collection.

#### 60bpm - Air Drone
- **Web URL:** https://freesound.org/people/Wilii89/sounds/456036/
- **API URL:** https://freesound.org/apiv2/sounds/456036/download/
- **License:** CC BY-NC 3.0 (Creative Commons Attribution NonCommercial 3.0)
- **Attribution Required:** `60bpm - air drone by Wilii89 -- https://freesound.org/s/456036/ -- License: Attribution NonCommercial 3.0`
- **Duration:** 1:52.000 (112.000 seconds)
- **Description:** Atmospheric air drone at 60 BPM tempo
- **Tags:** drone, air, atmospheric, 60bpm, tempo-specific
- **Usage Notes:** Tempo-specific air drone at 60 BPM, attribution required, non-commercial use only. Perfect for synchronized atmospheric layers with defined tempo.

#### Drone2.aif
- **Web URL:** https://freesound.org/people/LogicMoon/sounds/169013/
- **API URL:** https://freesound.org/apiv2/sounds/169013/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** LogicMoon (not required for CC0)
- **Duration:** 0:52.000 (52.000 seconds)
- **Description:** Atmospheric drone, part of drone series
- **Tags:** drone, atmospheric
- **Usage Notes:** Clean atmospheric drone with medium duration, no attribution required. Perfect for looping and layering with other atmospheric elements.

#### Artillery Drone Burnt Orange
- **Web URL:** https://freesound.org/people/Jovica/sounds/177016/
- **API URL:** https://freesound.org/apiv2/sounds/177016/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Artillery Drone Burnt Orange.wav by Jovica -- https://freesound.org/s/177016/ -- License: Attribution 4.0`
- **Duration:** 0:14.000 (14.000 seconds)
- **Description:** Short artillery-themed atmospheric drone with burnt orange character
- **Tags:** drone, artillery, burnt-orange, short, atmospheric
- **Usage Notes:** Very short atmospheric drone with unique artillery character, attribution required. Perfect for rapid cycling, transitions, or as accent layer with longer drones.

#### Cinematic Drone 1
- **Web URL:** https://freesound.org/people/jordivburgel/sounds/222610/
- **API URL:** https://freesound.org/apiv2/sounds/222610/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** jordivburgel (not required for CC0)
- **Duration:** 1:03.405 (63.405 seconds)
- **Description:** Cinematic atmospheric drone designed for film/media use
- **Tags:** drone, cinematic, atmospheric, film, media
- **Usage Notes:** Medium-length cinematic drone with professional film quality, no attribution required. Perfect for dramatic atmospheric layers and cinematic vault exploration experiences.

#### Piano Drone
- **Web URL:** https://freesound.org/people/laserlife/sounds/191167/
- **API URL:** https://freesound.org/apiv2/sounds/191167/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** laserlife (not required for CC0)
- **Duration:** 0:14.860 (14.860 seconds)
- **Description:** Piano-based atmospheric drone with acoustic character
- **Tags:** drone, piano, acoustic, atmospheric, instrumental
- **Usage Notes:** Short piano-based drone with organic acoustic character, no attribution required. Perfect for adding warmth and acoustic texture to continuous layers, ideal for musical or creative-themed vaults.

#### MonotonousDrone5_1
- **Web URL:** https://freesound.org/people/Sclolex/sounds/180495/
- **API URL:** https://freesound.org/apiv2/sounds/180495/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** Sclolex (not required for CC0)
- **Duration:** 1:01.230 (61.230 seconds)
- **Description:** Monotonous atmospheric drone, part of drone series
- **Tags:** drone, monotonous, atmospheric, sustained
- **Usage Notes:** Medium-length monotonous drone with consistent character, no attribution required. Perfect for sustained background atmosphere with minimal variation, ideal for focused work sessions or meditative vault exploration.

#### FX Background Drone Spaceship
- **Web URL:** https://freesound.org/people/Karma-Ron/sounds/182047/
- **API URL:** https://freesound.org/apiv2/sounds/182047/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** Karma-Ron (not required for CC0)
- **Duration:** 0:15.879 (15.879 seconds)
- **Description:** FX background drone with spaceship theme, created by request
- **Tags:** drone, fx, background, spaceship, sci-fi, atmospheric
- **Usage Notes:** Short spaceship-themed FX drone, no attribution required. Perfect for sci-fi atmospheric layers and space-themed continuous backgrounds.

#### Big Space Drone 8
- **Web URL:** https://freesound.org/people/Speedenza/sounds/207376/
- **API URL:** https://freesound.org/apiv2/sounds/207376/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `Big Space Drone 8 by Speedenza -- https://freesound.org/s/207376/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 3:22.292 (202.292 seconds)
- **Description:** Extended space-themed atmospheric drone, part of space drone series
- **Tags:** drone, space, atmospheric, big, extended, sci-fi
- **Usage Notes:** Extended space drone with substantial duration, attribution required, non-commercial use only. Perfect for long-form sci-fi atmospheric layers and extended space-themed vault exploration sessions.

#### Airy Layered Drone
- **Web URL:** https://freesound.org/people/Speedenza/sounds/203923/
- **API URL:** https://freesound.org/apiv2/sounds/203923/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `Airy Layered Drone by Speedenza -- https://freesound.org/s/203923/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 3:28.421 (208.421 seconds)
- **Description:** Airy atmospheric drone with layered textures
- **Tags:** drone, airy, layered, atmospheric, extended
- **Usage Notes:** Extended airy drone with layered composition, attribution required, non-commercial use only. Perfect for light, atmospheric continuous layers with textural complexity.

#### Ibrkr01 Drone
- **Web URL:** https://freesound.org/people/Diboz/sounds/220894/
- **API URL:** https://freesound.org/apiv2/sounds/220894/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** Diboz (not required for CC0)
- **Duration:** 1:05.976 (65.976 seconds)
- **Description:** Atmospheric drone from ibrkr series
- **Tags:** drone, atmospheric, ibrkr
- **Usage Notes:** Medium-length atmospheric drone, no attribution required. Perfect for sustained continuous layers with good loop duration.

#### Heavy Industrial Elevator
- **Web URL:** https://freesound.org/people/peter5992/sounds/197395/
- **API URL:** https://freesound.org/apiv2/sounds/197395/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Heavy industrial elevator (CMS).wav by peter5992 -- https://freesound.org/s/197395/ -- License: Attribution 3.0`
- **Duration:** 0:42.349 (42.349 seconds)
- **Description:** Sound of the 100 year old industrial elevator in the iconic Cotton Mill Studios in Oakland, California. Heavy duty industrial type with old school call buttons and secured by two gates. Recorded with Zoom H4 at 96kHz/24bit
- **Tags:** drone, mechanical, industrial, elevator, vintage, oakland, cotton-mill, historical, machinery
- **Usage Notes:** Authentic industrial mechanical drone from historic building, attribution required. Perfect for industrial atmospheres, mechanical environments, or vintage machinery soundscapes.

---

## Oceanic Genre

### Whale Sounds

#### Humpback Whales

##### Alaska Humpback - NOAA PMEL
- **Web URL:** https://www.pmel.noaa.gov/acoustics/whales/sounds/sounds_akhump.html
- **Archive URL:** https://web.archive.org/web/20250507121520/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/akhumphi1x.wav
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA Pacific Marine Environmental Laboratory (not required for public domain)
- **Duration:** Variable (10x speed increase applied)
- **Description:** Alaska humpback whale winter 1999 recordings with moans, grunts, and complex songs
- **Tags:** whale, humpback, alaska, noaa, pmel, winter, songs
- **Usage Notes:** Government research recording with geographic variation from Alaska population, no attribution required. Perfect for northern oceanic atmosphere themes.

##### American Samoa Humpback with Snapping Shrimp
- **Web URL:** https://pmel.noaa.gov/acoustics/multimedia/
- **Archive URL:** https://web.archive.org/web/20250501011939/https://pmel.noaa.gov/acoustics/multimedia/HB-ship-AMSNP.wav
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA PMEL (not required for public domain)
- **Duration:** Variable
- **Description:** Humpback whale vocalizations with natural snapping shrimp background from American Samoa
- **Tags:** whale, humpback, american-samoa, snapping-shrimp, natural-soundscape
- **Usage Notes:** Unique recording with natural marine ecosystem sounds, no attribution required. Perfect for authentic oceanic soundscape with biological diversity.

##### Pennsylvania Group Humpback Song
- **Web URL:** https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-mammals
- **Archive URL:** https://web.archive.org/web/20250421195559/https://www.fisheries.noaa.gov/s3/2023-04/Meno-song-NOAA-PAGroup-13-humpback-clip.mp3
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA Pennsylvania Group (not required for public domain)
- **Duration:** Variable
- **Description:** Scientific song analysis and classification of humpback whale vocalizations
- **Tags:** whale, humpback, song, pennsylvania, scientific, classification
- **Usage Notes:** Research-grade song recordings with scientific verification, no attribution required. Perfect for complex musical oceanic themes.

##### Historic "Songs of the Humpback Whale" 1970 - Side 1
- **Web URL:** https://archive.org/details/songsofhumpbackw00payn
- **Archive URL:** https://archive.org/download/songsofhumpbackw00payn/Side%201.mp3
- **License:** Public Domain (Historic Archive)
- **Attribution:** Roger S. Payne, Bermuda 1970 (not required for public domain)
- **Duration:** Full album side
- **Description:** Groundbreaking 1970 recordings from Bermuda that launched whale conservation movement
- **Tags:** whale, humpback, historic, 1970, bermuda, conservation, payne
- **Usage Notes:** Historic significance as first widespread public whale song exposure, no attribution required. Perfect for contemplative, conservation-themed oceanic atmosphere.

##### Historic "Songs of the Humpback Whale" 1970 - Side 2
- **Web URL:** https://archive.org/details/songsofhumpbackw00payn
- **Archive URL:** https://archive.org/download/songsofhumpbackw00payn/Side%202.mp3
- **License:** Public Domain (Historic Archive)
- **Attribution:** Roger S. Payne, Bermuda 1970 (not required for public domain)
- **Duration:** Full album side
- **Description:** Continuation of groundbreaking 1970 humpback whale recordings from Bermuda
- **Tags:** whale, humpback, historic, 1970, bermuda, conservation, payne
- **Usage Notes:** Historic whale conservation landmark, no attribution required. Perfect for extended oceanic exploration sessions with cultural significance.

##### Alaska Ocean Explorer Humpback
- **Web URL:** https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/
- **Archive URL:** https://web.archive.org/web/20250316052243/https://oceanexplorer.noaa.gov/explorations/sound01/background/seasounds/media/akhumphi1x.mp3
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA Ocean Explorer (not required for public domain)
- **Duration:** Variable (speed adjusted for audibility)
- **Description:** Alaska humpback whale from Ocean Explorer "Sounds in the Sea 2001" series
- **Tags:** whale, humpback, alaska, ocean-explorer, sounds-in-sea
- **Usage Notes:** Part of systematic ocean sound documentation, no attribution required. Perfect for scientific oceanic exploration themes.

#### Blue Whales

##### Cornell/NOAA Long Island Blue Whale
- **Web URL:** https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-mammals
- **Archive URL:** https://web.archive.org/web/20250420204702/https://www.fisheries.noaa.gov/s3/2023-04/Cornell-NY-LongIsland-20090123-000000-LPfilter20-amplified-x8speed-blue-clip.mp3
- **License:** Public Domain (U.S. Government/Cornell Collaboration)
- **Attribution:** Cornell University/NOAA (not required for public domain)
- **Duration:** Variable (8x speed increase, low-pass filtered, amplified)
- **Description:** Blue whale recording from Long Island, New York (January 23, 2009)
- **Tags:** whale, blue, cornell, long-island, 2009, filtered, amplified
- **Usage Notes:** University/government collaboration with processing for audibility, no attribution required. Perfect for East Coast oceanic themes.

##### Northeast Pacific Blue Whale - PMEL
- **Web URL:** https://www.pmel.noaa.gov/acoustics/whales/sounds/sounds_whales_blue.html
- **Archive URL:** https://web.archive.org/web/20250526025156/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/nepblue24s10x.wav
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA PMEL (not required for public domain)
- **Duration:** 24 seconds (10x speed increase)
- **Description:** Northeast Pacific blue whale calls with professional spectral analysis
- **Tags:** whale, blue, northeast-pacific, pmel, spectrogram
- **Usage Notes:** Professional research with frequency analysis, no attribution required. Perfect for Pacific oceanic atmospheric layers.

##### West Pacific Blue Whale - PMEL
- **Web URL:** https://www.pmel.noaa.gov/acoustics/whales/sounds/sounds_whales_blue.html
- **Archive URL:** https://web.archive.org/web/20250313112719/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/wblue26s10x.wav
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA PMEL (not required for public domain)
- **Duration:** 26 seconds (10x speed increase)
- **Description:** West Pacific blue whale population calls
- **Tags:** whale, blue, west-pacific, pmel, population
- **Usage Notes:** Geographic variation from West Pacific population, no attribution required. Perfect for diverse Pacific oceanic themes.

##### Atlantic Blue Whale - PMEL
- **Web URL:** https://www.pmel.noaa.gov/acoustics/whales/sounds/sounds_whales_blue.html
- **Archive URL:** https://web.archive.org/web/20250430204620/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlblue_512_64_0-50_10x.wav
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA PMEL (not required for public domain)
- **Duration:** Variable (10x speed increase)
- **Description:** Atlantic blue whale calls with frequency range 0-50Hz
- **Tags:** whale, blue, atlantic, pmel, low-frequency
- **Usage Notes:** Atlantic population with ultra-low frequency calls, no attribution required. Perfect for deep, bass-heavy oceanic atmosphere.

##### 52 Hz "Loneliest Whale"
- **Web URL:** https://www.pmel.noaa.gov/acoustics/whales/sounds/sounds_whales_blue.html
- **Archive URL:** https://web.archive.org/web/20250309152144/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/ak52_10x.wav
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA PMEL (not required for public domain)
- **Duration:** Variable (10x speed increase)
- **Description:** The famous 52 Hz whale calls - unique frequency pattern
- **Tags:** whale, blue, 52hz, loneliest, unique, alaska
- **Usage Notes:** Famous "loneliest whale" with unique 52Hz frequency, no attribution required. Perfect for unique, solitary oceanic themes with cultural significance.

##### Monterey Bay Blue Whale - SanctSound
- **Web URL:** https://sanctsound.ioos.us/sounds.html
- **Archive URL:** https://web.archive.org/web/20250413110747/https://sanctsound.ioos.us/files/SanctSound_MB01_01_bluewhale_20181123T203257Z_6xSpeed.wav.mp3
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA SanctSound Program (not required for public domain)
- **Duration:** Variable (6x speed increase)
- **Description:** Blue whale from Monterey Bay monitoring station MB01 (November 23, 2018)
- **Tags:** whale, blue, monterey-bay, sanctsound, 2018, monitoring
- **Usage Notes:** Modern marine sanctuary monitoring with timestamp, no attribution required. Perfect for contemporary California oceanic themes.

#### Baleen Whales - Other Species

##### Atlantic Minke Whale - PMEL
- **Web URL:** https://www.pmel.noaa.gov/acoustics/whales/sounds/sounds_atlminke.html
- **Archive URL:** https://web.archive.org/web/20250430135640/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlmin_512_64_0-50_10x.wav
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA PMEL (not required for public domain)
- **Duration:** Variable (10x speed increase)
- **Description:** Atlantic minke whale 50-35Hz frequency-modulated downsweeps with "thump trains, ratchets, clicks and grunts"
- **Tags:** whale, minke, atlantic, downsweeps, thumps, ratchets
- **Usage Notes:** Distinctive Atlantic minke calls with detailed acoustic analysis, no attribution required. Perfect for mid-frequency oceanic textures.

##### Fin Whale - Pennsylvania Group
- **Web URL:** https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-mammals
- **Archive URL:** https://web.archive.org/web/20250501031730/https://www.fisheries.noaa.gov/s3/2023-04/Baph-song-NOAA-PAGroup-05-x5speed-fin-clip.mp3
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA Pennsylvania Group (not required for public domain)
- **Duration:** Variable (5x speed increase)
- **Description:** Fin whale song recordings with scientific classification
- **Tags:** whale, fin, song, pennsylvania, scientific, classification
- **Usage Notes:** Research-grade fin whale song analysis, no attribution required. Perfect for rhythmic oceanic pulse patterns.

##### Right Whale Upcalls - Pennsylvania Group
- **Web URL:** https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-mammals
- **Archive URL:** https://web.archive.org/web/20250430145142/https://www.fisheries.noaa.gov/s3/2023-04/Eugl-upcall-NOAA-PAGroup-01-right-clip-1.mp3
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA Pennsylvania Group (not required for public domain)
- **Duration:** Variable
- **Description:** North Atlantic right whale upcalls - critically endangered species documentation
- **Tags:** whale, right, upcalls, endangered, conservation, atlantic
- **Usage Notes:** Critically endangered species with signature upcall vocalizations, no attribution required. Perfect for conservation-themed oceanic atmosphere with environmental significance.

##### Sei Whale Downsweeps - Pennsylvania Group
- **Web URL:** https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-mammals
- **Archive URL:** https://web.archive.org/web/20250420230007/https://www.fisheries.noaa.gov/s3/2023-04/Babo-downsweep-NOAA-PAGroup-06-x2speed-sei-whale-clip.mp3
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA Pennsylvania Group (not required for public domain)
- **Duration:** Variable (2x speed increase)
- **Description:** Sei whale characteristic downsweep vocalizations
- **Tags:** whale, sei, downsweeps, pennsylvania, research
- **Usage Notes:** Distinctive sei whale downsweep patterns, no attribution required. Perfect for descending oceanic musical phrases.

#### Toothed Whales

##### Pilot Whale Multi-sound - Pennsylvania Group
- **Web URL:** https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-mammals
- **Archive URL:** https://web.archive.org/web/20250617094506/https://www.fisheries.noaa.gov/s3/2023-04/Glsp-Multisound-NOAA-PAGroup-01-pilot-whale-clip.mp3
- **License:** Public Domain (U.S. Government)
- **Attribution:** NOAA Pennsylvania Group (not required for public domain)
- **Duration:** Variable
- **Description:** Pilot whale multi-sound vocalizations - toothed whale family
- **Tags:** whale, pilot, toothed, multi-sound, vocalizations
- **Usage Notes:** Toothed whale vocalizations different from baleen whales, no attribution required. Perfect for complex oceanic communication themes.

##### Gray Whale - MBARI Deep-Sea Observatory
- **Web URL:** https://freesound.org/people/MBARI_MARS/sounds/413377/
- **API URL:** https://freesound.org/apiv2/sounds/413377/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Gray whale vocalizations by MBARI_MARS -- https://freesound.org/s/413377/ -- License: Attribution 4.0`
- **Duration:** Variable
- **Description:** Gray whale (Eschrichtius robustus) vocalizations from California deep-sea cabled observatory, recorded August 18, 2015
- **Tags:** whale, gray, mbari, deep-sea, observatory, california, 2015
- **Usage Notes:** Professional research institution recording from deep-sea observatory, attribution required. Perfect for California coastal oceanic themes with migration context.

### Ocean Ambience

*[Awaiting entries - ocean waves, underwater soundscapes, marine environments]*

---

## Sci-Fi Genre

### Space Atmospheres

#### Dark Texture 1 (Square Wave)
- **Web URL:** https://freesound.org/people/subtletransmissions/sounds/479068/
- **API URL:** https://freesound.org/apiv2/sounds/479068/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Dark Texture 1 (Square Wave) by subtletransmissions -- https://freesound.org/s/479068/ -- License: Attribution 3.0`
- **Duration:** 2:00.000 (120.000 seconds)
- **Description:** Dark atmospheric texture using square wave synthesis
- **Tags:** sci-fi, atmospheric, dark, square-wave, texture
- **Usage Notes:** Perfect for sci-fi continuous layers with dark, electronic character. Medium duration ideal for atmospheric loops in space-themed environments.

### Technological Sounds

#### Lazer 1
- **Web URL:** https://freesound.org/people/subtletransmissions/sounds/484060/
- **API URL:** https://freesound.org/apiv2/sounds/484060/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Lazer 1 by subtletransmissions -- https://freesound.org/s/484060/ -- License: Attribution 3.0`
- **Duration:** 0:10.000 (10.000 seconds)
- **Description:** Sci-fi laser effect sound
- **Tags:** sci-fi, laser, effect, technological
- **Usage Notes:** Perfect for discrete node events, transitions, or special effects in sci-fi themed continuous layers. Short duration ideal for event triggers.

#### Sci-Fi Computing Transmission 01
- **Web URL:** https://freesound.org/people/cabled_mess/sounds/757449/
- **API URL:** https://freesound.org/apiv2/sounds/757449/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** cabled_mess (not required for CC0)
- **Duration:** 1:00.000 (60.000 seconds)
- **Description:** Retro Sci-Fi analogue computing or communication sound effects created on a Doepfer Eurorack system
- **Tags:** sci-fi, computing, transmission, retro, analogue, communication, eurorack, modular, technological
- **Usage Notes:** Perfect atmospheric computing/transmission sound for sci-fi continuous layers, no attribution required. Modular synth-based texture ideal for technological atmospheres and data transmission themes.

#### Synthetic Watery Bubbles 01
- **Web URL:** https://freesound.org/people/cabled_mess/sounds/756472/
- **API URL:** https://freesound.org/apiv2/sounds/756472/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** cabled_mess (not required for CC0)
- **Duration:** 1:00.000 (60.000 seconds)
- **Description:** Bubble water sounds created on an analogue modular synthesizer
- **Tags:** sci-fi, synthetic, water, bubbles, modular, analogue, liquid, technological, texture
- **Usage Notes:** Synthetic liquid texture perfect for sci-fi underwater or alien liquid environments, no attribution required. Modular synth-based bubbling ideal for technological aquatic atmospheres.

#### Bizarre Radio Noise
- **Web URL:** https://freesound.org/people/alienistcog/sounds/123708/
- **API URL:** https://freesound.org/apiv2/sounds/123708/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** alienistcog (not required for CC0)
- **Duration:** 5:11.134 (311.134 seconds)
- **Description:** Strange radio interference picked up between radio channels at 3AM one morning. Strange EM phenomenon rather than broadcast
- **Tags:** sci-fi, radio, interference, electromagnetic, noise, strange, atmospheric, technological, mysterious, extended
- **Usage Notes:** Extended 5+ minute atmospheric radio interference, no attribution required. Perfect for alien communications, technological mysteries, or dystopian sci-fi atmospheres. Natural EM phenomenon adds authentic strangeness.

#### Basic Spaceship Engine (Bass)
- **Web URL:** https://freesound.org/people/clif_creates/sounds/725828/
- **API URL:** https://freesound.org/apiv2/sounds/725828/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** clif_creates (not required for CC0)
- **Duration:** 0:25.557 (25.557 seconds)
- **Description:** A very basic spaceship hum. Created from a random feedback wav that happened one day when soundflower crashed. This is pitched down and EQd to work as a bass-heavy Sci-fi background
- **Tags:** sci-fi, spaceship, engine, bass, hum, technological, feedback, layer
- **Usage Notes:** Bass-heavy spaceship engine hum, no attribution required. Perfect as a layer to beef up any sci-fi atmosphere. Short duration ideal for looping. Created from accidental feedback, adding organic quality to synthetic sound.

#### ILH Space Noise - Nostromo
- **Web URL:** https://freesound.org/people/voxlab/sounds/516327/
- **API URL:** https://freesound.org/apiv2/sounds/516327/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `ILH Space Noise | Spaceship - Alien - Nostromo by voxlab -- https://freesound.org/s/516327/ -- License: Attribution 4.0`
- **Duration:** 0:16.302 (16.302 seconds)
- **Description:** Spaceship Noise-SFX made with IL Harmor. Reminiscent of the Nostromo spaceship from Alien 1. Sounds human-like when pitched up; 4 octaves up becomes VOX Sound/Synth Choir
- **Tags:** sci-fi, spaceship, alien, nostromo, technological, harmor, pitch-shift, versatile
- **Usage Notes:** Iconic spaceship atmosphere inspired by Alien franchise, attribution required. Short loop with pitch-shifting versatility - can transform from spaceship drone to choir sound. Perfect for creating ominous sci-fi atmospheres.

#### Nostromo Room Tone
- **Web URL:** https://freesound.org/people/fectoper/sounds/59/
- **API URL:** https://freesound.org/apiv2/sounds/59/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `nostromo.wav by fectoper -- https://freesound.org/s/59/ -- License: Attribution 4.0`
- **Duration:** 0:14.362 (14.362 seconds)
- **Description:** Inspired by the ambient background heard "in silence" on the Nostromo spaceship from Alien. Created using Roland JD-800 synthesizer to recreate similar "room tone"
- **Tags:** sci-fi, spaceship, alien, nostromo, room-tone, roland-jd800, technological, ambient
- **Usage Notes:** Classic spaceship room tone atmosphere, attribution required. Short loop perfect for creating subtle background presence. Roland JD-800 synthesis provides vintage digital character. Complements other Nostromo-inspired samples.

#### Deep Space Ship Effect
- **Web URL:** https://freesound.org/people/hykenfreak/sounds/214663/
- **API URL:** https://freesound.org/apiv2/sounds/214663/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Deep Space Ship Effect by hykenfreak -- https://freesound.org/s/214663/ -- License: Attribution 4.0`
- **Duration:** 0:10.473 (10.473 seconds)
- **Description:** Sound created using white noise generator then pitched down and EQ low pass with lots of deep reverb. Normalized for subtle ambient use, not loud playback. For spaceship background noise, distant rocket/jet takeoffs, and suspense drones
- **Tags:** sci-fi, spaceship, deep-space, white-noise, drone, subtle, ambient, loop, technological
- **Usage Notes:** Designed for subtle background presence, attribution required. Very short loop explicitly created for DAW looping and crossfading. Use proper speakers/headphones for full deep frequency effect. Perfect for continuous spaceship ambience.

#### Static Error 1
- **Web URL:** https://freesound.org/people/dotY21/sounds/275646/
- **API URL:** https://freesound.org/apiv2/sounds/275646/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** dotY21 (not required for CC0)
- **Duration:** 0:05.504 (5.504 seconds)
- **Description:** A static error sound. Glitch sounds
- **Tags:** sci-fi, static, error, glitch, technological, malfunction, digital, interference
- **Usage Notes:** Very short glitch loop, no attribution required. Best used for technological malfunction atmospheres or layered with other samples for digital interference effects. Can create unsettling technological environments when looped.

#### Cyborg/Machine Breath 2
- **Web URL:** https://freesound.org/people/dotY21/sounds/369826/
- **API URL:** https://freesound.org/apiv2/sounds/369826/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** dotY21 (not required for CC0)
- **Duration:** 0:13.300 (13.300 seconds)
- **Description:** Another cyborg breath noise
- **Tags:** sci-fi, cyborg, machine, breath, technological, biomechanical, rhythmic, loop
- **Usage Notes:** Short rhythmic cyborg breathing loop, no attribution required. Perfect for creating biomechanical atmospheres or machine-life environments. Can add organic rhythm to technological soundscapes when looped.

#### Corrupted Static Noise Loopable
- **Web URL:** https://freesound.org/people/dotY21/sounds/371183/
- **API URL:** https://freesound.org/apiv2/sounds/371183/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** dotY21 (not required for CC0)
- **Duration:** 0:06.494 (6.494 seconds)
- **Description:** A static noise. Glitch sounds
- **Tags:** sci-fi, static, corrupted, noise, glitch, loopable, technological, interference, experimental
- **Usage Notes:** Very short loopable static texture, no attribution required. Explicitly designed for seamless looping. Perfect for creating corrupted data streams or technological interference layers.

#### High Intense Beam Morphing
- **Web URL:** https://freesound.org/people/clif_creates/sounds/747181/
- **API URL:** https://freesound.org/apiv2/sounds/747181/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** clif_creates (not required for CC0)
- **Duration:** 0:13.234 (13.234 seconds)
- **Description:** A harmonious/resonant beaming laser-type of sound. Pretty sure it's in C, but haven't checked to be sure
- **Tags:** sci-fi, beam, laser, morphing, resonant, harmonious, technological, energy, possibly-c
- **Usage Notes:** Short resonant beam loop, no attribution required. Tonal quality (possibly in C) makes it musically compatible. Perfect for energy weapon atmospheres or technological scanning environments. From creator of Basic Spaceship Engine sample.

### Atmospheric Soundscapes

#### Fantasy Sci-Fi City Forest Atmosphere
- **Web URL:** https://freesound.org/people/szegvari/sounds/593692/
- **API URL:** https://freesound.org/apiv2/sounds/593692/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** szegvari (not required for CC0)
- **Duration:** 3:54.901 (234.901 seconds)
- **Description:** Fantasy sci-fi city forest atmospheric soundscape
- **Tags:** sci-fi, fantasy, city, forest, atmospheric, soundscape, ambient
- **Usage Notes:** Extended atmospheric soundscape blending fantasy, sci-fi, and natural forest elements, no attribution required. Perfect for complex sci-fi continuous layers with organic and technological fusion themes.

#### Sci-Fi Soundscape - Wind - 200
- **Web URL:** https://freesound.org/people/GregorQuendel/sounds/743075/
- **API URL:** https://freesound.org/apiv2/sounds/743075/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `Sci-Fi Soundscape - Wind - 200 by GregorQuendel -- https://freesound.org/s/743075/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 1:09.267 (69.267 seconds)
- **Description:** A collection of sci-fi soundscapes that were not selected for the release of the sound effects library "Designed Atmospheres". Synthetic/artificial wind soundscape
- **Tags:** sci-fi, soundscape, wind, synthetic, artificial, atmospheric, designed
- **Usage Notes:** Professional synthetic wind atmosphere from unused sound library content, attribution required, non-commercial use only. Perfect for alien planet atmospheres or technological wind simulations.

#### Deep Space Sound
- **Web URL:** https://freesound.org/people/cliploop/sounds/743472/
- **API URL:** https://freesound.org/apiv2/sounds/743472/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** cliploop (not required for CC0)
- **Duration:** 0:07.559 (7.559 seconds)
- **Description:** Deep spheric sound, synthetic/artificial space atmosphere
- **Tags:** sci-fi, space, deep, spheric, synthetic, atmospheric, short, loop
- **Usage Notes:** Very short deep space atmosphere, no attribution required. Best used as a looped texture for continuous space ambience. Deep spheric quality ideal for void or deep space environments.

#### Transfer into the Other Dimension
- **Web URL:** https://freesound.org/people/harpoyume/sounds/86072/
- **API URL:** https://freesound.org/apiv2/sounds/86072/download/
- **License:** CC BY-NC 3.0 (Creative Commons Attribution NonCommercial 3.0)
- **Attribution Required:** `Transfer into the other dimension_1-2.aif by harpoyume -- https://freesound.org/s/86072/ -- License: Attribution NonCommercial 3.0`
- **Duration:** 0:07.006 (7.006 seconds)
- **Description:** Transferring sound into the other dimension. Synthetic/artificial dimensional transfer effect
- **Tags:** sci-fi, dimensional, transfer, otherworldly, synthetic, atmospheric, short, portal
- **Usage Notes:** Very short dimensional transfer atmosphere, attribution required, non-commercial use only. Ideal for portal/transition effects or looped for continuous interdimensional ambience. Perfect for representing phase shifts or reality transitions.

---

## Ambient Genre

### Nature Sounds

#### Frog Chorus Ambience
- **Web URL:** https://freesound.org/people/soundshmyak/sounds/697832/
- **API URL:** https://freesound.org/apiv2/sounds/697832/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `Frog Chorus Ambience Nature Animals.wav by soundshmyak -- https://freesound.org/s/697832/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 0:08.897 (8.897 seconds)
- **Description:** Natural frog chorus ambience with animal sounds
- **Tags:** ambient, nature, frog, chorus, animals, natural, soundscape
- **Usage Notes:** Short natural ambience with frog chorus, attribution required, non-commercial use only. Perfect for natural ambient layers and organic atmospheric backgrounds.

#### Melancholic Nature Soundscape
- **Web URL:** https://freesound.org/people/Universfield/sounds/776043/
- **API URL:** https://freesound.org/apiv2/sounds/776043/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Melancholic Nature Soundscape by Universfield -- https://freesound.org/s/776043/ -- License: Attribution 4.0`
- **Duration:** 1:38.460 (98.460 seconds)
- **Description:** Ambient and melancholic atmosphere perfect for nature documentaries and scenes with misty forests, fields, mountains, or rainy seasons, evoking solitude and reflection
- **Tags:** ambient, melancholic, nature, documentary, misty, forest, mountains, rain, solitude, reflection
- **Usage Notes:** Extended melancholic nature soundscape with documentary quality, attribution required. Perfect for contemplative ambient layers and reflective vault exploration sessions.

#### Morning Cicada and Bird Chorus – 17-Year Brood Field Recording
- **Web URL:** https://freesound.org/people/clawback/sounds/811163/
- **API URL:** https://freesound.org/apiv2/sounds/811163/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** clawback (not required for CC0)
- **Duration:** 25:38.279 (1538.279 seconds)
- **Description:** Vivid and immersive early morning field recording captured during the 2025 emergence of the 17-year cicada brood. Dense cicada drone forms a shimmering sonic backdrop, punctuated by calls from robins, cardinals, wrens, mourning doves, and blue jays. A neighbor's rooster adds rural charm to the natural chorus of millions of cicadas chittering, clicking, and droning.
- **Tags:** ambient, nature, cicada, birds, chorus, field-recording, 17-year-brood, 2025, dawn, rural, rare-biological-event
- **Usage Notes:** Exceptional 25+ minute nature recording capturing rare 17-year cicada emergence, no attribution required. Perfect for extended ambient layers with authentic biological soundscape, ideal for nature-themed vaults or immersive exploration sessions. Longest ambient sample in collection.

#### Forest Atmosphere 005 (Poland)
- **Web URL:** https://freesound.org/people/AudioPapkin/sounds/813283/
- **API URL:** https://freesound.org/apiv2/sounds/813283/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** AudioPapkin (not required for CC0)
- **Duration:** 3:42.209 (222.209 seconds)
- **Description:** Ambient soundscape of a Polish forest with various birdsong and natural background sounds typical for European forest environments. Pure field recording with no human noise or mechanical sounds, capturing authentic forest atmosphere.
- **Tags:** ambient, nature, forest, poland, birdsong, field-recording, european, pristine, natural-soundscape
- **Usage Notes:** Clean Polish forest recording with authentic European birdsong, no attribution required. Perfect for natural ambient layers and European forest-themed atmospheric backgrounds. Extended duration ideal for immersive nature sessions.

#### Berlin Birds - Nightingale & Great Tit with Urban Ambience
- **Web URL:** https://freesound.org/people/MichiJung/sounds/772101/
- **API URL:** https://freesound.org/apiv2/sounds/772101/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Berlin Birds - Nightingale & Great Tit with Urban Ambience by MichiJung -- https://freesound.org/s/772101/ -- License: Attribution 4.0`
- **Duration:** 1:33.758 (93.758 seconds)
- **Description:** Unedited summer 2024 Berlin field recording capturing the interplay of natural and urban soundscapes. Nightingale and great tit bird calls contrast with construction site activity and city traffic, creating a layered urban-natural atmosphere. Recorded with Sony PCM-D100 with minimal editing.
- **Tags:** ambient, urban, berlin, nightingale, great-tit, birds, traffic, construction, urban-biodiversity, summer-2024, sony-pcm-d100
- **Usage Notes:** Unique urban-natural soundscape blending bird calls with city sounds, attribution required. Perfect for urban biodiversity themes, documentary-style ambient layers, and explorations of nature-city intersections. Professional field recording quality.

#### Midnight Ambiance in KwaZulu-Natal
- **Web URL:** https://freesound.org/people/DonnyDB/sounds/765399/
- **API URL:** https://freesound.org/apiv2/sounds/765399/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `Midnight Ambiance in KwaZulu-Natal (Recorded with Zoom H6) by DonnyDB -- https://freesound.org/s/765399/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 2:56.217 (176.217 seconds)
- **Description:** Serene nighttime environment of KwaZulu-Natal, South Africa, capturing the African wilderness after dark. Features distant animal calls, soft winds, and occasional rustling vegetation recorded with professional Zoom H6 equipment.
- **Tags:** ambient, africa, kwazulu-natal, south-africa, midnight, night, wilderness, animal-calls, wind, vegetation, zoom-h6
- **Usage Notes:** Authentic African wilderness nighttime atmosphere, attribution required, non-commercial use only. Perfect for immersive nature soundscapes, relaxation themes, and African wildlife ambient layers. Professional field recording quality.

#### Suburban Rain & Light Thunder
- **Web URL:** https://freesound.org/people/TheFieldRecordist/sounds/789045/
- **API URL:** https://freesound.org/apiv2/sounds/789045/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `THUN-NTSF1 Zoom F6_Suburban Rain & Light Thunder FREE_TFR RNajmeddine_Suburban Rain FREE_20250127 by TheFieldRecordist -- https://freesound.org/s/789045/ -- License: Attribution 4.0`
- **Duration:** 6:00.000 (360.000 seconds)
- **Description:** Rich atmospheric recording capturing the essence of a sudden, fleeting thunderstorm in a suburban environment. Features calming rain patter, distant thunder rumbles, with layered suburban life sounds including birds chirping, dog barking, and occasional cars passing on wet roads.
- **Tags:** ambient, rain, thunder, suburban, thunderstorm, weather, birds, cars, atmospheric, zoom-f6, 2025
- **Usage Notes:** Extended 6-minute atmospheric thunderstorm with suburban life layers, attribution required. Perfect for weather-themed ambient layers, relaxation soundscapes, and immersive storm atmosphere. Professional Zoom F6 field recording quality.

#### Rain and Thunder 4
- **Web URL:** https://freesound.org/people/FlatHill/sounds/237729/
- **API URL:** https://freesound.org/apiv2/sounds/237729/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** FlatHill (not required for CC0)
- **Duration:** 0:32.875 (32.875 seconds)
- **Description:** Rain and thunder natural weather recording
- **Tags:** ambient, rain, thunder, weather, storm, natural, atmospheric
- **Usage Notes:** Medium-duration rain and thunder atmosphere, no attribution required. Perfect for weather-themed ambient layers and storm soundscapes.

#### Rain Fall Through Trees
- **Web URL:** https://freesound.org/people/acollier123/sounds/242956/
- **API URL:** https://freesound.org/apiv2/sounds/242956/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** acollier123 (not required for CC0)
- **Duration:** 1:18.686 (78.686 seconds)
- **Description:** Rain recorded under a tree using Zoom H2. Splashing on a nearby shed can be heard. Some mastering and editing done using Cool Edit Pro. 19th July 2014, UK
- **Tags:** ambient, rain, trees, nature, forest, shed, splashing, zoom-h2, uk, 2014, weather, atmospheric
- **Usage Notes:** Natural rain through trees with environmental texture, no attribution required. Perfect for forest rain atmospheres and nature-based weather soundscapes. Includes authentic splashing sounds for added realism.

#### Wind Howling Nighttime
- **Web URL:** https://freesound.org/people/Dynamicell/sounds/17553/
- **API URL:** https://freesound.org/apiv2/sounds/17553/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Wind_Howling_NIghttime.aif by Dynamicell -- https://freesound.org/s/17553/ -- License: Attribution 3.0`
- **Duration:** 0:58.666 (58.666 seconds)
- **Description:** Recordings of the wind as it passes window. Recorded with SM 57 + MK319 Condenser Mic. Mixed and mastered in Logic 7 Pro
- **Tags:** ambient, wind, howling, nighttime, weather, atmospheric, sm57, mk319, logic-pro
- **Usage Notes:** Atmospheric wind recording with professional mixing, attribution required. Perfect for nighttime weather atmospheres and windswept ambient layers.

#### Wind Through Trees 3b
- **Web URL:** https://freesound.org/people/spoonbender/sounds/244942/
- **API URL:** https://freesound.org/apiv2/sounds/244942/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Wind Through Trees 3b by spoonbender -- https://freesound.org/s/244942/ -- License: Attribution 4.0`
- **Duration:** 0:58.154 (58.154 seconds)
- **Description:** Recorded on a windy day in Thrunton woods, Northumberland, UK. Zoom H2n, recorded near a tree that was falling over and rubbing against other trees. Light processing in RX3 to clean boom sound from muscle tension
- **Tags:** ambient, wind, trees, forest, creaking, northumberland, uk, zoom-h2n, nature, atmospheric, thrunton-woods
- **Usage Notes:** Unique forest wind recording with natural tree creaking sounds, attribution required. Perfect for mysterious forest atmospheres and windswept woodland soundscapes.

#### Wolves Howling
- **Web URL:** https://freesound.org/people/Paresh/sounds/158780/
- **API URL:** https://freesound.org/apiv2/sounds/158780/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** Paresh (not required for CC0)
- **Duration:** 0:33.299 (33.299 seconds)
- **Description:** Wolves howling - recorded at Wolf Haven International, a wolf sanctuary in Washington State
- **Tags:** ambient, wolves, howling, wildlife, nature, sanctuary, washington, wolf-haven, animal-sounds
- **Usage Notes:** Authentic wolf sanctuary recording, no attribution required. Perfect for wilderness atmospheres, nature documentaries, and primal ambient soundscapes.

#### Countryside Dawn
- **Web URL:** https://freesound.org/people/brunoboselli/sounds/458113/
- **API URL:** https://freesound.org/apiv2/sounds/458113/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** brunoboselli (not required for CC0)
- **Duration:** 0:58.000 (58.000 seconds)
- **Description:** Recording of a countryside natural ambience at dawn. Pretty heavy cicadas and crickets activity, birds, nearby farm animals and a mild wind background
- **Tags:** ambient, countryside, dawn, cicadas, crickets, birds, farm, uruguay, piriapolis, nature, rural, morning
- **Usage Notes:** Rich layered countryside atmosphere from Uruguay, no attribution required. Perfect for rural dawn atmospheres with authentic South American biodiversity. Multiple natural sound layers create immersive environment.

#### Desert at Night
- **Web URL:** https://freesound.org/people/kangaroovindaloo/sounds/138288/
- **API URL:** https://freesound.org/apiv2/sounds/138288/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Desert at Night by kangaroovindaloo -- https://freesound.org/s/138288/ -- License: Attribution 4.0`
- **Duration:** 3:52.080 (232.080 seconds)
- **Description:** The Australian Desert at night. Recorded in Tanami, Northern Territory, Australia
- **Tags:** ambient, desert, night, australia, tanami, northern-territory, nature, nocturnal, outback, wildlife
- **Usage Notes:** Extended Australian desert nightscape, attribution required. Nearly 4-minute authentic outback atmosphere perfect for creating remote, isolated environments. Captures unique Australian desert nocturnal soundscape.

#### Magpie
- **Web URL:** https://freesound.org/people/kangaroovindaloo/sounds/584903/
- **API URL:** https://freesound.org/apiv2/sounds/584903/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** kangaroovindaloo (not required for CC0)
- **Duration:** 0:11.711 (11.711 seconds)
- **Description:** The sound of a magpie in Fryers Forest. Recorded with a mid-side configuration using a Sennheiser MKH 416 paired with a MKH 30 into my Zoom F4.
- **Tags:** ambient, nature, magpie, bird, forest, fryers-forest, australia, wildlife, field-recording, mid-side, professional
- **Usage Notes:** Short professional field recording of Australian magpie, no attribution required. High-quality recording using professional equipment captures authentic bird vocalization. Perfect for natural ambient layers or as accent in Australian nature soundscapes.

#### Thunder Clap
- **Web URL:** https://freesound.org/people/kangaroovindaloo/sounds/585077/
- **API URL:** https://freesound.org/apiv2/sounds/585077/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** kangaroovindaloo (not required for CC0)
- **Duration:** 0:25.500 (25.500 seconds)
- **Description:** Thunder.
- **Tags:** ambient, nature, thunder, weather, storm, atmospheric, natural-elements, meteorological, powerful
- **Usage Notes:** Natural thunder clap recording, no attribution required. Short but impactful weather sound effect perfect for storm atmospheres and dramatic natural ambience. Can be used as punctuation in weather-based soundscapes.

#### Texture of Water
- **Web URL:** https://freesound.org/people/kangaroovindaloo/sounds/588652/
- **API URL:** https://freesound.org/apiv2/sounds/588652/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Texture of Water by kangaroovindaloo -- https://freesound.org/s/588652/ -- License: Attribution 4.0`
- **Duration:** 7:06.810 (426.810 seconds)
- **Description:** A close perspective of a flowing stream with some birds in the background. Recorded in Pomonal, Victoria, Australia.
- **Tags:** ambient, nature, water, stream, flowing, birds, pomonal, victoria, australia, soundscape, natural, aquatic
- **Usage Notes:** Extended 7+ minute water texture recording with bird ambience, attribution required. Perfect for peaceful water-based atmospheres and natural meditation soundscapes. Close-mic technique captures intimate stream details while maintaining environmental context.

#### Waves Ambience, Brittany
- **Web URL:** https://freesound.org/people/Moulaythami/sounds/535582/
- **API URL:** https://freesound.org/apiv2/sounds/535582/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Waves Ambience, Brittany, A by Moulaythami -- https://freesound.org/s/535582/ -- License: Attribution 4.0`
- **Duration:** 10:03.115 (603.115 seconds)
- **Description:** Professional waves crashing soundscape from Brittany coast, recorded with dual-microphone setup: Beyerdynamic MCE 85 BA facing the waves and Superlux S241 buried in sand. The innovative recording technique creates heavy, natural sub-bass frequencies mixed with clear wave sounds.
- **Tags:** ambient, waves, ocean, brittany, france, coast, dual-mic, professional, sub-bass, natural, beyerdynamic, superlux
- **Usage Notes:** Extended 10+ minute professional ocean recording with innovative dual-mic technique, attribution required. Perfect for oceanic ambient layers, meditation soundscapes, and coastal atmosphere. Heavy natural sub-bass provides rich low-frequency foundation.

#### Crickets at Night in Mezos
- **Web URL:** https://freesound.org/people/Guillaume.Capsowl.Voisin/sounds/523454/
- **API URL:** https://freesound.org/apiv2/sounds/523454/download/
- **License:** CC BY-NC 3.0 (Creative Commons Attribution NonCommercial 3.0)
- **Attribution Required:** `Crikets at night in Mezos 2.wav by Guillaume.Capsowl.Voisin -- https://freesound.org/s/523454/ -- License: Attribution NonCommercial 3.0`
- **Duration:** 2:15.500 (135.500 seconds)
- **Description:** Crickets soundscape at night in French Landes nature, capturing the natural evening chorus of crickets in the rural Mezos region of southwestern France.
- **Tags:** ambient, crickets, night, mezos, france, landes, nature, evening, rural, insects, soundscape
- **Usage Notes:** Authentic French countryside cricket soundscape, attribution required, non-commercial use only. Perfect for nighttime ambient layers, rural atmosphere, and peaceful evening soundscapes. Natural insect chorus ideal for contemplative vault exploration.

#### Forest Soundscape (Thuringian Forest)
- **Web URL:** https://freesound.org/people/Porphyr/sounds/240339/
- **API URL:** https://freesound.org/apiv2/sounds/240339/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Forest Soundscape (Thuringian Forest) by Porphyr -- https://freesound.org/s/240339/ -- License: Attribution 4.0`
- **Duration:** 2:38.628 (158.628 seconds)
- **Description:** Summer forest soundscape recorded at 'Lange Bahn' near Suhl, Thuringia, Germany on June 9, 2014. Captured on a characteristic summer day at 32°C with minimal wind, featuring predominantly bird songs and insect fly-bys typical of German temperate forest environments.
- **Tags:** ambient, forest, thuringia, germany, summer, birdsong, insects, temperate-forest, suhl, 2014, european
- **Usage Notes:** Authentic German temperate forest summer atmosphere, attribution required. Perfect for European forest ambient layers, summer nature soundscapes, and temperate woodland exploration themes. Clean recording with natural bird and insect diversity.

#### Forest Soundscape Contaminated by Urban Noise
- **Web URL:** https://freesound.org/people/ricardoemfield/sounds/785125/
- **API URL:** https://freesound.org/apiv2/sounds/785125/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `Forest soundscape contaminated by urban noise by ricardoemfield -- https://freesound.org/s/785125/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 2:30.000 (150.000 seconds)
- **Description:** Forest soundscape from Itapoá, southern Brazil, documenting the intersection of natural and urban environments with motorcycle and dog sounds contaminating the natural forest atmosphere. Recorded at 22:00 (10 PM) on January 10, 2025, using Zoom H1N in Santa Catarina state.
- **Tags:** ambient, forest, brazil, itapoa, santa-catarina, urban-contamination, motorcycle, dog, nighttime, 2025, zoom-h1n, south-america
- **Usage Notes:** Authentic Brazilian urban-forest intersection soundscape, attribution required, non-commercial use only. Perfect for documenting environmental impact themes, urban sprawl effects on nature, and realistic modern forest environments. Nighttime recording with contemporary urban-nature conflict.

#### Rural Soundscape Snippet - Bouriège
- **Web URL:** https://freesound.org/people/Sadiquecat/sounds/737197/
- **API URL:** https://freesound.org/apiv2/sounds/737197/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** Sadiquecat (not required for CC0)
- **Duration:** 0:09.575 (9.575 seconds)
- **Description:** Short rural soundscape from Bouriège, Aude, France, recorded on May 24, 2024, around 19:20. Features scientifically identified bird species: Eurasian Collared Dove (owl-like background), Common Grasshopper Warbler (loud cricket sound), and Great Tit (squeaking bicycle pump sound), plus authentic tractor sounds. Recorded with Zoom H2n in ambisonic mode.
- **Tags:** ambient, rural, bouriege, aude, france, eurasian-collared-dove, grasshopper-warbler, great-tit, tractor, evening, zoom-h2n, ambisonic, merlin-bird-id
- **Usage Notes:** Scientifically documented short rural French soundscape, no attribution required. Perfect for brief rural transitions, authentic French countryside snippets, and ornithologically accurate bird identification themes. Professional ambisonic field recording with species verification.

#### Nature is Losing the War
- **Web URL:** https://freesound.org/people/dibko/sounds/652794/
- **API URL:** https://freesound.org/apiv2/sounds/652794/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Nature is losing the war.wav by dibko -- https://freesound.org/s/652794/ -- License: Attribution 4.0`
- **Duration:** 3:31.981 (211.981 seconds)
- **Description:** Environmental commentary recording documenting the overwhelming of natural bird sounds by human industrial noise including cars, people, manufacturing, and factories. Captured with Zoom H5 + MSH-6, this recording illustrates the spreading impact of civilization on natural soundscapes and the growing rarity of quiet natural spaces.
- **Tags:** ambient, environmental-commentary, birds, cars, manufacturing, factories, civilization-impact, zoom-h5, msh-6, nature-vs-industry
- **Usage Notes:** Powerful environmental documentary soundscape, attribution required. Perfect for themes exploring environmental impact, urbanization effects on nature, and the tension between natural and industrial worlds. Professional recording highlighting contemporary environmental challenges.

### Synthetic Atmospheres

#### Abstract Ambient JD-800
- **Web URL:** https://freesound.org/people/fectoper/sounds/58/
- **API URL:** https://freesound.org/apiv2/sounds/58/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `ambient1.wav by fectoper -- https://freesound.org/s/58/ -- License: Attribution 4.0`
- **Duration:** 0:59.815 (59.815 seconds)
- **Description:** A kind of abstract ambient patch programmed with a Roland JD-800 synth
- **Tags:** ambient, abstract, synthesizer, roland-jd800, patch, atmospheric, synthetic
- **Usage Notes:** Abstract ambient texture from classic digital synthesizer, attribution required. Nearly one-minute duration ideal for atmospheric loops. Roland JD-800's distinctive digital character adds unique texture to ambient layers.

#### Misty Limbo
- **Web URL:** https://freesound.org/people/CosmicD/sounds/133015/
- **API URL:** https://freesound.org/apiv2/sounds/133015/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Misty Limbo by CosmicD -- https://freesound.org/s/133015/ -- License: Attribution 4.0`
- **Duration:** 1:22.103 (82.103 seconds)
- **Description:** "We are in limbo" - Resonators From Hell series. Misty, ethereal synthetic atmosphere
- **Tags:** ambient, limbo, misty, ethereal, resonators, synthetic, otherworldly, atmospheric
- **Usage Notes:** Extended ethereal atmosphere evoking liminal spaces, attribution required. Perfect for creating mysterious, suspended atmospheres. Part of "Resonators From Hell" series adds dark undertones to misty ambience.

#### Otherworldly Ambience
- **Web URL:** https://freesound.org/people/dotY21/sounds/370164/
- **API URL:** https://freesound.org/apiv2/sounds/370164/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** dotY21 (not required for CC0)
- **Duration:** 0:39.269 (39.269 seconds)
- **Description:** A looping ambience track with otherworldly character
- **Tags:** ambient, otherworldly, loop, atmospheric, mysterious, synthetic
- **Usage Notes:** Medium-duration loop designed for continuous playback, no attribution required. Perfect for creating alien or supernatural atmospheres. From same creator as Static Error sample.

### Electronic Textures

*[Awaiting entries]*

---

## Orchestral Genre

### String Sections

#### Orchestral Tremolo Strings Bed
- **Web URL:** https://freesound.org/people/james_longley/sounds/433935/
- **API URL:** https://freesound.org/apiv2/sounds/433935/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `ORCHESTRAL_TREM_BED2.aif by james_longley -- https://freesound.org/s/433935/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 7:20.000 (440.000 seconds)
- **Description:** Tremolo orchestral strings in a large reverberant space, created with Vienna Symphonic in Apple Logic. Designed as an atmospheric orchestral bed.
- **Tags:** orchestral, strings, tremolo, bed, atmospheric, reverberant, vienna-symphonic, background, cinematic
- **Usage Notes:** Extended 7+ minute duration perfect for long ambient sessions, tremolo technique adds subtle movement without being distracting, large reverb creates spacious atmosphere, non-commercial use only.

#### Orchestral Tremolo Strings Bed 1
- **Web URL:** https://freesound.org/people/james_longley/sounds/433936/
- **API URL:** https://freesound.org/apiv2/sounds/433936/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `ORCHESTRAL_TREM_BED1.aif by james_longley -- https://freesound.org/s/433936/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 7:20.000 (440.000 seconds)
- **Description:** Tremolo orchestral strings in a large reverberant space, created with Vienna Symphonic in Apple Logic. Neutral mood suitable for variety of situations.
- **Tags:** orchestral, strings, tremolo, bed, atmospheric, reverberant, vienna-symphonic, neutral, versatile
- **Usage Notes:** Matching duration to BED2 provides variation options, neutral mood makes it highly versatile, professional orchestral samples with spacious reverb, non-commercial use only.

#### Orchestral Layers Improvisation
- **Web URL:** https://freesound.org/people/james_longley/sounds/433810/
- **API URL:** https://freesound.org/apiv2/sounds/433810/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `onetwothree.aif by james_longley -- https://freesound.org/s/433810/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 4:14.769 (254.769 seconds)
- **Description:** Layers of orchestral samples from Vienna Symphonic in an improvisational track intended for temp film scoring use. Atmospheric orchestral texture.
- **Tags:** orchestral, strings, layers, improvisational, temp-music, film-scoring, vienna-symphonic, atmospheric
- **Usage Notes:** Medium duration complements the 7+ minute beds, improvisational nature creates organic atmosphere, designed for non-intrusive film temp use, non-commercial only.

#### Orchestral Ambient Floating Chord
- **Web URL:** https://freesound.org/people/james_longley/sounds/433809/
- **API URL:** https://freesound.org/apiv2/sounds/433809/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `orchestral_ambient2.aif by james_longley -- https://freesound.org/s/433809/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 2:36.000 (156.000 seconds)
- **Description:** Orchestral sound created in Logic, centered around a single floating chord. Ambient orchestral texture with sustained harmonic focus.
- **Tags:** orchestral, strings, ambient, floating, chord, sustained, atmospheric, logic
- **Usage Notes:** Shorter duration option for variety, single chord focus provides harmonic stability, floating quality perfect for background use, non-commercial only.

#### String Ensemble Soundscape
- **Web URL:** https://freesound.org/people/LogicMoon/sounds/540841/
- **API URL:** https://freesound.org/apiv2/sounds/540841/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `string_ensemble.wav by LogicMoon -- https://freesound.org/s/540841/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 1:28.000 (88.000 seconds)
- **Description:** String ensemble and soundscape improvisation. Atmospheric string texture created through improvisational performance.
- **Tags:** orchestral, strings, ensemble, soundscape, improvisation, atmospheric, ambient
- **Usage Notes:** Adds creator diversity beyond james_longley samples, shorter duration fills gap in collection, improvisational nature creates organic texture, non-commercial only.

#### Solo Contrabass Sustain F#1
- **Web URL:** https://freesound.org/people/sgossner/sounds/373153/
- **API URL:** https://freesound.org/apiv2/sounds/373153/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:11.283 (11.283 seconds)
- **Description:** Solo contrabass vibrato sustain on F#1 from VSCO 2 CE. Professional recording with spaced pair and close mic setup in Boston classroom.
- **Tags:** orchestral, strings, contrabass, bass, sustain, vibrato, F#1, VSCO, professional
- **Usage Notes:** Adds deep bass register to string collection, vibrato adds organic movement, short duration requires looping, CC0 license allows free use, professional sample library quality.

#### Cello Section Sustain E2
- **Web URL:** https://freesound.org/people/sgossner/sounds/372835/
- **API URL:** https://freesound.org/apiv2/sounds/372835/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:11.641 (11.641 seconds)
- **Description:** Cello section vibrato sustain on E2 from VSCO 2 CE. Professional recording of three cellists with spaced pair and ribbon mic in Boston classroom.
- **Tags:** orchestral, strings, cello, section, sustain, vibrato, E2, VSCO, professional
- **Usage Notes:** Mid-low register complements contrabass F#1, section sound fuller than solo, vibrato adds warmth, pairs well with other VSCO samples, CC0 license.

#### Violin Section Sustain B3
- **Web URL:** https://freesound.org/people/sgossner/sounds/374590/
- **API URL:** https://freesound.org/apiv2/sounds/374590/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:13.454 (13.454 seconds)
- **Description:** Violin section vibrato sustain on B3 from VSCO 2 CE. Professional recording of five violinists with spaced pair and ribbon mic in Boston classroom.
- **Tags:** orchestral, strings, violin, section, sustain, vibrato, B3, VSCO, professional
- **Usage Notes:** Higher register balances low strings, creates harmonic triad with bass F#1 and cello E2, five-player section for rich sound, CC0 license.

#### Viola Section Sustain F#3
- **Web URL:** https://freesound.org/people/sgossner/sounds/374463/
- **API URL:** https://freesound.org/apiv2/sounds/374463/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:13.746 (13.746 seconds)
- **Description:** Viola section vibrato sustain on F#3 from VSCO 2 CE. Professional recording of four violists with spaced pair and close mic in Boston classroom.
- **Tags:** orchestral, strings, viola, section, sustain, vibrato, F#3, VSCO, professional
- **Usage Notes:** Completes string quartet with violin/cello/bass, F#3 octave relationship with bass F#1, fills mid-range perfectly, CC0 license.

#### Solo Violin Sustain F#4
- **Web URL:** https://freesound.org/people/sgossner/sounds/373775/
- **API URL:** https://freesound.org/apiv2/sounds/373775/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:13.412 (13.412 seconds)
- **Description:** Solo violin vibrato sustain on F#4 from VSCO 2 CE. Professional recording in living room setting with spaced pair mics.
- **Tags:** orchestral, strings, violin, solo, sustain, vibrato, F#4, VSCO, professional
- **Usage Notes:** Adds highest F# completing three-octave spread (F#1-F#3-F#4), solo timbre contrasts with sections, intimate living room recording, CC0 license.

### Brass Pads

#### Soft Brass and Pad Atmosphere
- **Web URL:** https://freesound.org/people/3ag1e/sounds/748227/
- **API URL:** https://freesound.org/apiv2/sounds/748227/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 1:56.569 (116.569 seconds)
- **Description:** Soft brass textures with dark low strings in C minor at 140 BPM. Atmospheric brass pad designed to be loopable with subtle string support.
- **Tags:** orchestral, brass, pad, soft, atmosphere, C-minor, 140bpm, dark, strings, loopable
- **Usage Notes:** Nearly 2-minute duration excellent for continuous ambience, soft brass avoids typical fanfare dramatics, C minor tonality with tempo sync at 140 BPM, CC0 license allows unrestricted use.

---

## Electronic Genre

### Synthesized Pads

#### String Pad (Buzzy Electronic Texture)
- **Web URL:** https://freesound.org/people/johnnypanic/sounds/361843/
- **API URL:** https://freesound.org/apiv2/sounds/361843/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `String Pad.wav by johnnypanic -- https://freesound.org/s/361843/ -- License: Attribution 4.0`
- **Duration:** 0:17.813 (17.813 seconds)
- **Description:** Electronic pad created by layering strings, effects and samples, centered on C notes. Features a clean string pad texture with a quiet buzzy sound low in the mix, creating a hybrid electronic-orchestral atmosphere.
- **Tags:** electronic, pad, synthesized, strings, bass, buzzy, layered, c-note, texture
- **Usage Notes:** Short duration ideal for looping, harmonic center on C makes it compatible with various keys, buzzy undertone adds electronic character while maintaining string-like warmth.

#### Dance String Loop
- **Web URL:** https://freesound.org/people/mkoenig/sounds/78462/
- **API URL:** https://freesound.org/apiv2/sounds/78462/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `Dance String 126.wav 36397.wav by mkoenig -- https://freesound.org/s/78462/ -- License: Attribution 3.0`
- **Duration:** 0:07.619 (7.619 seconds)
- **Description:** Soft and dainty dance string/pad loop at 126 BPM. Electronic string texture designed for dance music production, featuring a gentle, delicate character suitable for ambient layering.
- **Tags:** electronic, pad, dance, string, loop, 126bpm, soft, dainty, synthesized
- **Usage Notes:** Very short loop perfect for continuous cycling, tempo-synced at 126 BPM for rhythmic integration, delicate texture complements heavier pads.

#### String Pad Chill
- **Web URL:** https://freesound.org/people/Thalamus_Lab/sounds/250946/
- **API URL:** https://freesound.org/apiv2/sounds/250946/download/
- **License:** CC BY 3.0 (Creative Commons Attribution 3.0)
- **Attribution Required:** `String Pad Chill by Thalamus_Lab -- https://freesound.org/s/250946/ -- License: Attribution 3.0`
- **Duration:** 0:16.000 (16.000 seconds)
- **Description:** Atmospheric guitar pads with pitch shifting and heavy reverb, layered with synth pad and percussive echo effects. Part of the Xperimental Sound Lab collection, blending processed acoustic and electronic elements.
- **Tags:** electronic, pad, guitar, atmospheric, pitch-shift, reverb, synth, percussive-echo, experimental, chill
- **Usage Notes:** Hybrid acoustic-electronic texture ideal for ambient atmospheres, heavy processing creates spacious feel, percussive elements add rhythmic interest.

#### Voice Pad 140 BPM
- **Web URL:** https://freesound.org/people/Elmo_cookies/sounds/275178/
- **API URL:** https://freesound.org/apiv2/sounds/275178/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:41.142 (41.142 seconds)
- **Description:** Synthesized voice pad created using StringZ2 ROMpler, arranged to fit 140 BPM tempo. Vocal-style electronic pad texture suitable for ambient and electronic music production.
- **Tags:** electronic, pad, voice, voicepad, 140bpm, synthesized, rompler, stringz2, tempo-synced
- **Usage Notes:** Longer duration pad with vocal characteristics, tempo-synced at 140 BPM for electronic music integration, no attribution required (CC0).

#### Analog Strings Synth Loop
- **Web URL:** https://freesound.org/people/orangefreesounds/sounds/245756/
- **API URL:** https://freesound.org/apiv2/sounds/245756/download/
- **License:** CC BY-NC 3.0 (Creative Commons Attribution NonCommercial 3.0)
- **Attribution Required:** `Analog Strings Synth Loop by orangefreesounds -- https://freesound.org/s/245756/ -- License: Attribution NonCommercial 3.0`
- **Duration:** 0:18.508 (18.508 seconds)
- **Description:** Analog strings synthesizer loop created with Waldorf analog synthesizer. Classic hardware synth sound with warm analog character and string-like timbre.
- **Tags:** electronic, pad, analog, synthesizer, waldorf, strings, loop, hardware-synth, warm
- **Usage Notes:** Classic analog warmth from hardware synthesizer, loop format ideal for continuous playback, non-commercial use only due to NC license.

#### Ethereal Pad
- **Web URL:** https://freesound.org/people/XHALE303/sounds/528768/
- **API URL:** https://freesound.org/apiv2/sounds/528768/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `ETHERIAL PAD by XHALE303 -- https://freesound.org/s/528768/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 1:02.895 (62.895 seconds)
- **Description:** Ethereal pad combining Roland JD-800 synthesizer with Ethera vocal samples at 137 BPM. Classic digital synthesis blended with processed vocals for atmospheric texture.
- **Tags:** electronic, pad, ethereal, jd-800, roland, ethera, vocals, 137bpm, atmospheric, digital-synth
- **Usage Notes:** Extended duration perfect for ambient layers, tempo-synced at 137 BPM, combines classic digital synthesis with modern vocal processing, non-commercial use only.

#### Thin Strings C2
- **Web URL:** https://freesound.org/people/AlienXXX/sounds/170696/
- **API URL:** https://freesound.org/apiv2/sounds/170696/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `ThinStrings_1_C2.wav by AlienXXX -- https://freesound.org/s/170696/ -- License: Attribution 4.0`
- **Duration:** 0:16.410 (16.410 seconds)
- **Description:** Thin string pad synthesized in Reason's Maelstrom with high-pass filtering, designed specifically to sit well in a mix without dominating. Root note C2.
- **Tags:** electronic, pad, synthesized, strings, thin, maelstrom, reason, C2, high-pass, layering
- **Usage Notes:** Purposefully designed for background layering, high-pass filtered for non-intrusive presence, low C2 provides bass foundation without muddiness.

#### Ambient Strings
- **Web URL:** https://freesound.org/people/thisusernameis/sounds/432837/
- **API URL:** https://freesound.org/apiv2/sounds/432837/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:44.009 (44.009 seconds)
- **Description:** Background synth string ambience designed for mystical mysteries. Atmospheric synthesized strings perfect for creating mysterious ambient backgrounds.
- **Tags:** electronic, pad, ambient, strings, synthesized, mystical, mystery, background, atmospheric
- **Usage Notes:** Explicitly designed as background ambience, extended duration ideal for seamless looping, CC0 license requires no attribution, mystical atmosphere adds intrigue.

#### Synth String Orchestral Atmosphere
- **Web URL:** https://freesound.org/people/ERH/sounds/261032/
- **API URL:** https://freesound.org/apiv2/sounds/261032/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `string cbn2 b1 2.wav by ERH -- https://freesound.org/s/261032/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 1:40.536 (100.536 seconds)
- **Description:** Synth string orchestral sound designed for atmospheric use in films and games. Extended synthesized string pad with cinematic character.
- **Tags:** electronic, pad, synthesized, strings, orchestral, atmospheric, cinematic, film, game, ambient
- **Usage Notes:** Extended duration over 1.5 minutes perfect for continuous ambience, cinematic quality suitable for dramatic atmospheres, non-commercial use only.

#### Intro Synth Strings
- **Web URL:** https://freesound.org/people/JMARTI_oficial/sounds/657016/
- **API URL:** https://freesound.org/apiv2/sounds/657016/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:15.432 (15.432 seconds)
- **Description:** Synth strings with various notes, processed through stereo imaging, dual EQ, flanger, and reverb for atmospheric texture.
- **Tags:** electronic, pad, synth, strings, flanger, reverb, processed, intro, atmospheric, stereo
- **Usage Notes:** Flanger effect adds movement to the pad, multiple processing creates spacious atmosphere, CC0 license allows unrestricted use.

#### String Synth Pad
- **Web URL:** https://freesound.org/people/Mick Gibbs/sounds/204613/
- **API URL:** https://freesound.org/apiv2/sounds/204613/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `String Synth Pad.wav by Mick Gibbs -- https://freesound.org/s/204613/ -- License: Attribution 4.0`
- **Duration:** 0:18.000 (18.000 seconds)
- **Description:** Synth pad created in Mix Craft and edited in Cool Edit Pro. Features string-like synthesis with bell curve envelope shaping.
- **Tags:** electronic, pad, synth, strings, bell-curve, mixcraft, synthesized, ambient
- **Usage Notes:** Bell curve envelope provides smooth attack and release, straightforward pad suitable for layering, 18-second duration ideal for looping.

#### Beautiful Bed in D Minor
- **Web URL:** https://freesound.org/people/Vospi/sounds/639568/
- **API URL:** https://freesound.org/apiv2/sounds/639568/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `beautiful bed in dm . wav by Vospi -- https://freesound.org/s/639568/ -- License: Attribution 4.0`
- **Duration:** 1:28.225 (88.225 seconds)
- **Description:** Pad bed atmosphere in D minor, created with synths, strings, delay, distortion, and resampling. Features detuned quality perfect for mystical and cinematic backgrounds.
- **Tags:** electronic, pad, bed, D-minor, atmospheric, mystical, cinematic, detuned, synth, strings
- **Usage Notes:** Extended duration ideal for scene dressing, detuned character adds depth without prominence, explicitly designed as background atmosphere.

#### Simple D Minor Pad/Drone
- **Web URL:** https://freesound.org/people/cabled_mess/sounds/366013/
- **API URL:** https://freesound.org/apiv2/sounds/366013/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 1:46.989 (106.989 seconds)
- **Description:** Simple D minor pad created by layering two minimalistic Waldorf Blofeld patches with faint Korg Monotribe. Features U-He Satin tape emulation for warmth.
- **Tags:** electronic, pad, drone, D-minor, waldorf-blofeld, korg-monotribe, tape-emulation, loop, layered, minimalistic
- **Usage Notes:** Designed as loop for continuous playback, tape emulation adds analog warmth, minimalistic approach ensures non-intrusive texture, CC0 license allows free use.

#### Phaedra (Tangerine Dream Inspired)
- **Web URL:** https://freesound.org/people/fectoper/sounds/60/
- **API URL:** https://freesound.org/apiv2/sounds/60/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `phaedra.wav by fectoper -- https://freesound.org/s/60/ -- License: Attribution 4.0`
- **Duration:** 0:18.495 (18.495 seconds)
- **Description:** A sound that is reminiscent from Tangerine Dream's Phaedra sonorities (1974). Classic Berlin School electronic music style
- **Tags:** electronic, pad, tangerine-dream, phaedra, berlin-school, 1970s, vintage, sequencer, atmospheric
- **Usage Notes:** Classic 1970s Berlin School electronic atmosphere, attribution required. Short loop capturing vintage analog sequencer aesthetics. Perfect for retro-futuristic or cosmic electronic atmospheres.

### Electronic Textures

#### Countdown
- **Web URL:** https://freesound.org/people/xkeril/sounds/632741/
- **API URL:** https://freesound.org/apiv2/sounds/632741/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 1:06.133 (66.133 seconds)
- **Description:** Pulsing signal over strings, heavily inspired by Alan Hawkshaw's countdown theme. Electronic texture combining rhythmic pulsing elements with string backing for retro-futuristic atmosphere.
- **Tags:** electronic, texture, pulsing, signal, strings, countdown, hawkshaw-inspired, retro, rhythmic
- **Usage Notes:** Extended duration with rhythmic pulse provides movement and tension, CC0 license allows unrestricted use, perfect for sci-fi or retro-tech atmospheres.

#### Bow Regain
- **Web URL:** https://freesound.org/people/sherlock/sounds/22644/
- **API URL:** https://freesound.org/apiv2/sounds/22644/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `bow regain.wav by sherlock -- https://freesound.org/s/22644/ -- License: Attribution 4.0`
- **Duration:** 0:06.628 (6.628 seconds)
- **Description:** Electronic texture with "touching frequencies" - cryptic but intriguing sonic element from the synths/electronic category.
- **Tags:** electronic, texture, frequencies, synth, brief, experimental, abstract
- **Usage Notes:** Very brief texture suitable for rapid cycling or accent moments, mysterious sonic character adds intrigue, requires attribution.

#### Synthesizer Effects Texture
- **Web URL:** https://freesound.org/people/gmortizwavs/sounds/658000/
- **API URL:** https://freesound.org/apiv2/sounds/658000/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:12.861 (12.861 seconds)
- **Description:** Synthesizer texture featuring E5-G5-B5-E6 note sequence with slide, processed through compression, EQ, filter, vocodex, reverb, and delay for atmospheric effect.
- **Tags:** electronic, texture, synthesizer, vocoder, effects, processed, slide, atmospheric, stereo
- **Usage Notes:** Complex effects chain creates unique texture, note sequence with slide adds movement, CC0 license requires no attribution, vocoder adds distinctive character.

#### Dark Pluck Texture
- **Web URL:** https://freesound.org/people/gmortizwavs/sounds/655544/
- **API URL:** https://freesound.org/apiv2/sounds/655544/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:08.575 (8.575 seconds)
- **Description:** Dark plucked texture on C1 (low bass frequency), heavily processed with stereo imaging, master smoothing, dual low-frequency EQ, quadruple reverb, and distortion.
- **Tags:** electronic, texture, dark, pluck, bass, C1, distorted, reverb, processed, low-frequency
- **Usage Notes:** Deep bass texture with heavy atmospheric processing, multiple reverbs create spatial depth, CC0 license allows free use, brief duration ideal for dark accents.

#### Morphed Choir Atmosphere
- **Web URL:** https://freesound.org/people/ERH/sounds/29593/
- **API URL:** https://freesound.org/apiv2/sounds/29593/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `choir a.wav by ERH -- https://freesound.org/s/29593/ -- License: Attribution 4.0`
- **Duration:** 0:10.736 (10.736 seconds)
- **Description:** Angelic voices, strings, and synthesized sounds morphed together creating a strange plaintive texture. Designed as ethereal atmosphere/background for music and film.
- **Tags:** electronic, texture, morphed, choir, voices, strings, ethereal, atmospheric, plaintive, background
- **Usage Notes:** Hybrid texture combining organic and synthetic elements, explicitly designed for background use, unique morphed character adds otherworldly atmosphere.

#### Cinematic Layer Texture
- **Web URL:** https://freesound.org/people/johnnypanic/sounds/141675/
- **API URL:** https://freesound.org/apiv2/sounds/141675/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Cin1.wav by johnnypanic -- https://freesound.org/s/141675/ -- License: Attribution 4.0`
- **Duration:** 0:10.000 (10.000 seconds)
- **Description:** Layered strings texture with reverb and delay processing. Despite description mentioning bells and birds, actual sound is atmospheric string layers.
- **Tags:** electronic, texture, cinematic, strings, layered, reverb, delay, atmospheric, processed
- **Usage Notes:** Brief atmospheric texture with processed string layers, suitable for short ambient accents, deamplified for subtle presence.

#### Strings Pad with LFO Modulation
- **Web URL:** https://freesound.org/people/martinbeltov/sounds/614220/
- **API URL:** https://freesound.org/apiv2/sounds/614220/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:28.270 (28.270 seconds)
- **Description:** String pad with intense LFO modulations on filters, creating dynamic movement and texture through synthesis modulation.
- **Tags:** electronic, texture, strings, pad, LFO, modulation, filters, crazy, movement, synthesized
- **Usage Notes:** Heavy LFO modulation creates rhythmic movement and interest, filter sweeps add dynamic texture, CC0 license requires no attribution.

#### Glowing Pad
- **Web URL:** https://freesound.org/people/staticpony1/sounds/249612/
- **API URL:** https://freesound.org/apiv2/sounds/249612/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:11.181 (11.181 seconds)
- **Description:** Experimental glowing pad texture created with U-he VST synthesizer, designed as atmospheric ambience.
- **Tags:** electronic, texture, glowing, pad, experimental, ambience, u-he, vst, synth, atmospheric
- **Usage Notes:** Brief luminous texture ideal for accent moments, experimental nature adds unique character, CC0 license allows free use.

---

## Minimal Genre

### Sparse Elements

#### Resonant Bass Flute and Viola
- **Web URL:** https://freesound.org/people/milo/sounds/184194/
- **API URL:** https://freesound.org/apiv2/sounds/184194/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:55.205 (55.205 seconds)
- **Description:** Airy drone pad created with bass flute and viola da gamba. Resonant acoustic instruments producing minimal, sparse atmospheric texture.
- **Tags:** minimal, sparse, bass-flute, viola-da-gamba, airy, drone, pad, acoustic, resonant, atmospheric
- **Usage Notes:** Extended acoustic drone with natural resonance, sparse instrumentation creates contemplative space, CC0 license allows unrestricted use.

#### Water-phoney Sparse
- **Web URL:** https://freesound.org/people/Timbre/sounds/536287/
- **API URL:** https://freesound.org/apiv2/sounds/536287/download/
- **License:** CC BY-NC 4.0 (Creative Commons Attribution NonCommercial 4.0)
- **Attribution Required:** `water-phoney (sparse).flac by Timbre -- https://freesound.org/s/536287/ -- License: Attribution NonCommercial 4.0`
- **Duration:** 1:27.379 (87.379 seconds)
- **Description:** Synthesized sound somewhat like WaterPhone, creating sparse ethereal textures. Synthetic interpretation of the haunting waterphone instrument.
- **Tags:** minimal, sparse, waterphone, synthesized, ethereal, haunting, atmospheric, synthetic
- **Usage Notes:** Waterphone-like textures create otherworldly atmosphere, explicitly sparse design fits minimal aesthetic, synthetic nature adds modern edge, non-commercial use only.

#### Drippy Faucet
- **Web URL:** https://freesound.org/people/zmadyun/sounds/343797/
- **API URL:** https://freesound.org/apiv2/sounds/343797/download/
- **License:** CC0 (Creative Commons 0 - Public Domain)
- **Attribution:** zmadyun (not required for CC0)
- **Duration:** 0:08.173 (8.173 seconds)
- **Description:** Leaky faucet dripping slowly
- **Tags:** minimal, sparse, water, drip, faucet, rhythmic, meditative, percussive, repetitive
- **Usage Notes:** Short loop of water drips creates rhythmic minimal texture, no attribution required. Perfect for meditative sparse soundscapes or rhythmic minimal layers. Loop for extended use.

### Contemplative Sounds

#### Lowkey String Loop
- **Web URL:** https://freesound.org/people/visual/sounds/400601/
- **API URL:** https://freesound.org/apiv2/sounds/400601/download/
- **License:** CC0 (Public Domain)
- **Attribution Required:** No
- **Duration:** 0:16.000 (16.000 seconds)
- **Description:** Slow, understated string loop with delay effect at 120 BPM. Minimal and contemplative texture perfect for reflective atmospheres.
- **Tags:** minimal, contemplative, strings, loop, delay, 120bpm, lowkey, understated, ambient
- **Usage Notes:** Short loop ideal for continuous playback, delay effect adds spatial depth, tempo-synced at 120 BPM, CC0 license requires no attribution.

#### Balalaika Swell
- **Web URL:** https://freesound.org/people/zacnie/sounds/646300/
- **API URL:** https://freesound.org/apiv2/sounds/646300/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `balalaika swell by zacnie -- https://freesound.org/s/646300/ -- License: Attribution 4.0`
- **Duration:** 0:20.062 (20.062 seconds)
- **Description:** Dreamy orchestral swell featuring balalaikas, designed for minimalist ambient use. Gentle dynamics with ethnic string character.
- **Tags:** minimal, contemplative, balalaika, swell, dreamy, orchestral, ambient, ethnic, strings
- **Usage Notes:** Unique ethnic string texture adds distinctive character, gradual swell perfect for contemplative moments, described as ideal for minimalist ambient.

#### Accordion Pad C Minor
- **Web URL:** https://freesound.org/people/juskiddink/sounds/120931/
- **API URL:** https://freesound.org/apiv2/sounds/120931/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Accordion pad1.wav by juskiddink -- https://freesound.org/s/120931/ -- License: Attribution 4.0`
- **Duration:** 0:21.412 (21.412 seconds)
- **Description:** Accordion C minor chord with filter modulation effects. Sustained pad texture with organic accordion character enhanced by electronic processing.
- **Tags:** minimal, contemplative, accordion, pad, C-minor, filter-modulation, organic, nostalgic, hybrid
- **Usage Notes:** Accordion brings warm organic texture, filter modulation adds subtle movement, C minor tonality for melancholic atmosphere, unique instrumental choice.

#### Heartbeat of Venus
- **Web URL:** https://freesound.org/people/Dave_Girtsman/sounds/805342/
- **API URL:** https://freesound.org/apiv2/sounds/805342/download/
- **License:** CC BY 4.0 (Creative Commons Attribution 4.0)
- **Attribution Required:** `Heartbeat of Venus by Dave_Girtsman -- https://freesound.org/s/805342/ -- License: Attribution 4.0`
- **Duration:** 2:48.750 (168.750 seconds)
- **Description:** Drifts between dream and memory in slow, hypnotic waves. Ethereal textures and reverb-soaked atmospheres create weightlessness with subtle melancholic undertones. Minimal but emotionally resonant.
- **Tags:** minimal, contemplative, ethereal, hypnotic, dreamlike, weightless, melancholic, atmospheric, reverb
- **Usage Notes:** Extended duration perfect for introspective moments, hypnotic waves provide gentle movement, minimal approach ensures non-intrusive presence, emotionally evocative without being prominent.

---

## Implementation Reference

### JavaScript Structure
```javascript
const FREESOUND_LIBRARY = {
  // Global fade settings for all samples
  globalFadeSettings: {
    defaultFadeInDuration: 2000,    // milliseconds
    defaultFadeOutDuration: 3000,   // milliseconds
    defaultCrossfadeDuration: 1500, // overlap time between samples
    enableAutoFade: true,           // automatic fade detection
    fadeInCurve: 'exponential',     // 'linear', 'exponential', 'logarithmic'
    fadeOutCurve: 'exponential',    // fade curve types
    preventAudioPops: true          // anti-click protection
  },
  drone: {
    electronic_minute_152: {
      url: 'https://freesound.org/apiv2/sounds/437386/download/',
      title: 'Electronic Minute No 152 - The Drone',
      license: 'CC0',
      attribution: 'gis_sweden',
      attributionRequired: false,
      duration: 346.906, // seconds (5:46.906)
      tags: ['drone', 'electronic', 'atmospheric'],
      fadeSettings: {
        customFadeIn: null,      // null = use global default
        customFadeOut: null,     // null = use global default
        hasNaturalFadeOut: false, // sample has built-in fade
        loopable: true,          // seamless loop capability
        crossfadeCompatible: true // works well in crossfades
      }
    },
    modulated_drone_g: {
      url: 'https://freesound.org/apiv2/sounds/479059/download/',
      title: 'Modulated Drone (Key of G)',
      license: 'CC BY 3.0',
      attribution: 'Modulated Drone (Key of G) by subtletransmissions -- https://freesound.org/s/479059/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 62.000, // seconds (1:02.000)
      tags: ['drone', 'modulated', 'key-g', 'tonal'],
      musicalKey: 'G'
    },
    lost_ark_drone: {
      url: 'https://freesound.org/apiv2/sounds/400062/download/',
      title: 'Lost Ark Drone',
      license: 'CC BY 4.0',
      attribution: 'Lost Ark Drone.wav by eardeer -- https://freesound.org/s/400062/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 44.587, // seconds
      tags: ['drone', 'atmospheric', 'ambient', 'ark']
    },
    drone_08: {
      url: 'https://freesound.org/apiv2/sounds/277372/download/',
      title: 'Drone 08',
      license: 'CC0',
      attribution: 'myluckyfeet',
      attributionRequired: false,
      duration: 45.098, // seconds
      tags: ['drone', 'atmospheric']
    },
    atonal_drone_03: {
      url: 'https://freesound.org/apiv2/sounds/321761/download/',
      title: 'Atonal Drone 03',
      license: 'CC0',
      attribution: 'Skjor1',
      attributionRequired: false,
      duration: 340.000, // seconds (5:40.000)
      tags: ['drone', 'atonal', 'atmospheric', 'ambient']
    },
    tinnito_drone_eau_tuyau: {
      url: 'https://freesound.org/apiv2/sounds/440688/download/',
      title: 'Tinnito - Drone - Eau Tuyau Low',
      license: 'CC0',
      attribution: 'rombart',
      attributionRequired: false,
      duration: 34.304, // seconds
      tags: ['drone', 'low', 'water', 'pipe', 'tonal']
    },
    broken_hum: {
      url: 'https://freesound.org/apiv2/sounds/496216/download/',
      title: 'Broken Hum',
      license: 'CC BY 3.0',
      attribution: 'Broken Hum by subtletransmissions -- https://freesound.org/s/496216/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 176.000, // seconds (2:56.000)
      tags: ['drone', 'hum', 'broken', 'atmospheric']
    },
    tascam_246_buzz: {
      url: 'https://freesound.org/apiv2/sounds/441987/download/',
      title: 'Tascam 246 (Buzz) 1',
      license: 'CC BY 3.0',
      attribution: 'Tascam 246 (Buzz) 1.wav by subtletransmissions -- https://freesound.org/s/441987/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 93.542, // seconds (1:33.542)
      tags: ['drone', 'buzz', 'tascam', 'equipment', 'lo-fi']
    },
    anglepoise_lamp: {
      url: 'https://freesound.org/apiv2/sounds/431903/download/',
      title: 'Anglepoise Lamp',
      license: 'CC BY 3.0',
      attribution: 'Anglepoise Lamp.wav by subtletransmissions -- https://freesound.org/s/431903/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 98.353, // seconds (1:38.353)
      tags: ['drone', 'lamp', 'electrical', 'hum', 'ambient']
    },
    drone_at_21th: {
      url: 'https://freesound.org/apiv2/sounds/371518/download/',
      title: 'Drone at the 21th',
      license: 'CC0',
      attribution: 'gis_sweden',
      attributionRequired: false,
      duration: 11.888, // seconds
      tags: ['drone', 'atmospheric', 'electronic', 'short']
    },
    evolving_drone_pad: {
      url: 'https://freesound.org/apiv2/sounds/360425/download/',
      title: 'Evolving Drone Pad',
      license: 'CC0',
      attribution: 'brogenhogan',
      attributionRequired: false,
      duration: 125.522, // seconds (2:05.522)
      tags: ['drone', 'pad', 'evolving', 'atmospheric', 'dynamic']
    },
    friday_lunch_drone: {
      url: 'https://freesound.org/apiv2/sounds/346427/download/',
      title: 'Friday Lunch Drone',
      license: 'CC0',
      attribution: 'gis_sweden',
      attributionRequired: false,
      duration: 86.936, // seconds (1:26.936)
      tags: ['drone', 'atmospheric', 'casual', 'ambient']
    },
    drone_rain_fade_out: {
      url: 'https://freesound.org/apiv2/sounds/345779/download/',
      title: 'Drone, Rain, Fade Out',
      license: 'CC0',
      attribution: 'gerainsan',
      attributionRequired: false,
      duration: 27.695, // seconds
      tags: ['drone', 'rain', 'fade', 'atmospheric', 'natural'],
      fadeSettings: {
        customFadeIn: null,
        customFadeOut: 500,        // shorter fade since natural fade exists
        hasNaturalFadeOut: true,   // sample has built-in fade-out ending
        loopable: false,           // natural ending prevents seamless looping
        crossfadeCompatible: true  // good for transitional use
      }
    },
    derived_low_drone: {
      url: 'https://freesound.org/apiv2/sounds/349030/download/',
      title: 'Derived Low Drone',
      license: 'CC0',
      attribution: 'gis_sweden',
      attributionRequired: false,
      duration: 139.319, // seconds (2:19.319)
      tags: ['drone', 'low', 'derived', 'atmospheric', 'bass']
    },
    drone_loop: {
      url: 'https://freesound.org/apiv2/sounds/379515/download/',
      title: 'Drone Loop',
      license: 'CC0',
      attribution: 'stixthule',
      attributionRequired: false,
      duration: 38.399, // seconds
      tags: ['drone', 'loop', 'atmospheric', 'seamless'],
      fadeSettings: {
        customFadeIn: 1000,        // quick fade-in for loop start
        customFadeOut: 1000,       // quick fade-out for loop end
        hasNaturalFadeOut: false,
        loopable: true,            // purpose-built for seamless looping
        crossfadeCompatible: true,
        seamlessLoop: true         // designed for perfect loop transitions
      }
    },
    synth_drone_3: {
      url: 'https://freesound.org/apiv2/sounds/239039/download/',
      title: 'Synth Drone 3',
      license: 'CC BY 4.0',
      attribution: 'Synth Drone 3 by apotter1992 -- https://freesound.org/s/239039/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 614.000, // seconds (10:14.000)
      tags: ['drone', 'synth', 'synthesized', 'atmospheric', 'electronic']
    },
    electronic_minute_226: {
      url: 'https://freesound.org/apiv2/sounds/457598/download/',
      title: 'Electronic Minute No 226 - Minimal Drone 2 VCO',
      license: 'CC0',
      attribution: 'gis_sweden',
      attributionRequired: false,
      duration: 209.389, // seconds (3:29.389)
      tags: ['drone', 'minimal', 'electronic', 'modular', 'vcv-rack', 'vco']
    },
    electronic_minute_224: {
      url: 'https://freesound.org/apiv2/sounds/457453/download/',
      title: 'Electronic Minute No 224 - 3rd After 13 Drone',
      license: 'CC0',
      attribution: 'gis_sweden',
      attributionRequired: false,
      duration: 655.083, // seconds (10:55.083)
      tags: ['drone', 'chaos', 'ring-modulator', 'electronic', 'complex', 'experimental']
    },
    electronic_minute_218: {
      url: 'https://freesound.org/apiv2/sounds/456758/download/',
      title: 'Electronic Minute No 218 - Algorithmic Drone Music Program',
      license: 'CC0',
      attribution: 'gis_sweden',
      attributionRequired: false,
      duration: 627.594, // seconds (10:27.594)
      tags: ['drone', 'algorithmic', 'generative', 'electronic', 'computational', 'modular']
    },
    air_drone_60bpm: {
      url: 'https://freesound.org/apiv2/sounds/456036/download/',
      title: '60bpm - Air Drone',
      license: 'CC BY-NC 3.0',
      attribution: '60bpm - air drone by Wilii89 -- https://freesound.org/s/456036/ -- License: Attribution NonCommercial 3.0',
      attributionRequired: true,
      duration: 112.000, // seconds (1:52.000)
      tags: ['drone', 'air', 'atmospheric', '60bpm', 'tempo-specific'],
      bpm: 60
    },
    drone2_aif: {
      url: 'https://freesound.org/apiv2/sounds/169013/download/',
      title: 'Drone2.aif',
      license: 'CC0',
      attribution: 'LogicMoon',
      attributionRequired: false,
      duration: 52.000, // seconds
      tags: ['drone', 'atmospheric']
    },
    artillery_drone_burnt_orange: {
      url: 'https://freesound.org/apiv2/sounds/177016/download/',
      title: 'Artillery Drone Burnt Orange',
      license: 'CC BY 4.0',
      attribution: 'Artillery Drone Burnt Orange.wav by Jovica -- https://freesound.org/s/177016/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 14.000, // seconds
      tags: ['drone', 'artillery', 'burnt-orange', 'short', 'atmospheric']
    },
    cinematic_drone_1: {
      url: 'https://freesound.org/apiv2/sounds/222610/download/',
      title: 'Cinematic Drone 1',
      license: 'CC0',
      attribution: 'jordivburgel',
      attributionRequired: false,
      duration: 63.405, // seconds (1:03.405)
      tags: ['drone', 'cinematic', 'atmospheric', 'film', 'media']
    },
    piano_drone: {
      url: 'https://freesound.org/apiv2/sounds/191167/download/',
      title: 'Piano Drone',
      license: 'CC0',
      attribution: 'laserlife',
      attributionRequired: false,
      duration: 14.860, // seconds
      tags: ['drone', 'piano', 'acoustic', 'atmospheric', 'instrumental']
    },
    monotonous_drone5_1: {
      url: 'https://freesound.org/apiv2/sounds/180495/download/',
      title: 'MonotonousDrone5_1',
      license: 'CC0',
      attribution: 'Sclolex',
      attributionRequired: false,
      duration: 61.230, // seconds (1:01.230)
      tags: ['drone', 'monotonous', 'atmospheric', 'sustained']
    },
    fx_background_drone_spaceship: {
      url: 'https://freesound.org/apiv2/sounds/182047/download/',
      title: 'FX Background Drone Spaceship',
      license: 'CC0',
      attribution: 'Karma-Ron',
      attributionRequired: false,
      duration: 15.879, // seconds
      tags: ['drone', 'fx', 'background', 'spaceship', 'sci-fi', 'atmospheric']
    },
    big_space_drone_8: {
      url: 'https://freesound.org/apiv2/sounds/207376/download/',
      title: 'Big Space Drone 8',
      license: 'CC BY-NC 4.0',
      attribution: 'Big Space Drone 8 by Speedenza -- https://freesound.org/s/207376/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 202.292, // seconds (3:22.292)
      tags: ['drone', 'space', 'atmospheric', 'big', 'extended', 'sci-fi']
    },
    airy_layered_drone: {
      url: 'https://freesound.org/apiv2/sounds/203923/download/',
      title: 'Airy Layered Drone',
      license: 'CC BY-NC 4.0',
      attribution: 'Airy Layered Drone by Speedenza -- https://freesound.org/s/203923/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 208.421, // seconds (3:28.421)
      tags: ['drone', 'airy', 'layered', 'atmospheric', 'extended']
    },
    ibrkr01_drone: {
      url: 'https://freesound.org/apiv2/sounds/220894/download/',
      title: 'Ibrkr01 Drone',
      license: 'CC0',
      attribution: 'Diboz',
      attributionRequired: false,
      duration: 65.976, // seconds (1:05.976)
      tags: ['drone', 'atmospheric', 'ibrkr']
    },
    heavy_industrial_elevator: {
      url: 'https://freesound.org/apiv2/sounds/197395/download/',
      title: 'Heavy Industrial Elevator',
      license: 'CC BY 3.0',
      attribution: 'Heavy industrial elevator (CMS).wav by peter5992 -- https://freesound.org/s/197395/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 42.349, // seconds (0:42.349)
      tags: ['drone', 'mechanical', 'industrial', 'elevator', 'vintage', 'oakland', 'cotton-mill', 'historical', 'machinery'],
      category: 'mechanical-drone'
    },
    ambient_drone_hybrid: {
      url: 'https://freesound.org/apiv2/sounds/435147/download/',
      title: 'Ambient Drone 21.07.2018',
      license: 'CC0',
      attribution: 'kickhat',
      attributionRequired: false,
      duration: 116.570, // seconds (1:56.570)
      tags: ['drone', 'ambient', 'hybrid', 'strings', 'drums', 'synth', 'level', 'atmospheric']
    },
    tambura_drone_stretched: {
      url: 'https://freesound.org/apiv2/sounds/25015/download/',
      title: 'TanburaA2-FourStrings',
      license: 'CC BY-NC 4.0',
      attribution: 'TanburaA2-FourStrings.aif by loofa -- https://freesound.org/s/25015/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 30.777, // seconds
      tags: ['drone', 'tambura', 'indian', 'stretched', 'granularized', 'metasynth', 'A2', 'ethnic'],
      musicalKey: 'A2'
    },
    guitar_drone_a_minor: {
      url: 'https://freesound.org/apiv2/sounds/683509/download/',
      title: 'Guitar Drone 03 (a-minor)',
      license: 'CC BY-NC 4.0',
      attribution: 'Guitar Drone 03 (a-minor) by LogicMoon -- https://freesound.org/s/683509/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 159.000, // seconds (2:39.000)
      tags: ['drone', 'guitar', 'ambient', 'a-minor', 'atmospheric', 'organic'],
      musicalKey: 'A minor'
    }
    // Additional entries...
  },
  oceanic: {
    // Humpback Whales
    alaska_humpback_pmel: {
      url: 'https://web.archive.org/web/20250507121520/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/akhumphi1x.wav',
      title: 'Alaska Humpback - NOAA PMEL',
      license: 'Public Domain',
      attribution: 'NOAA Pacific Marine Environmental Laboratory',
      attributionRequired: false,
      duration: null, // Variable (10x speed increase applied)
      tags: ['whale', 'humpback', 'alaska', 'noaa', 'pmel', 'winter', 'songs'],
      species: 'Megaptera novaeangliae',
      location: 'Alaska'
    },
    american_samoa_humpback_shrimp: {
      url: 'https://web.archive.org/web/20250501011939/https://pmel.noaa.gov/acoustics/multimedia/HB-ship-AMSNP.wav',
      title: 'American Samoa Humpback with Snapping Shrimp',
      license: 'Public Domain',
      attribution: 'NOAA PMEL',
      attributionRequired: false,
      duration: null, // Variable
      tags: ['whale', 'humpback', 'american-samoa', 'snapping-shrimp', 'natural-soundscape'],
      species: 'Megaptera novaeangliae',
      location: 'American Samoa'
    },
    humpback_song_pennsylvania: {
      url: 'https://web.archive.org/web/20250421195559/https://www.fisheries.noaa.gov/s3/2023-04/Meno-song-NOAA-PAGroup-13-humpback-clip.mp3',
      title: 'Pennsylvania Group Humpback Song',
      license: 'Public Domain',
      attribution: 'NOAA Pennsylvania Group',
      attributionRequired: false,
      duration: null, // Variable
      tags: ['whale', 'humpback', 'song', 'pennsylvania', 'scientific', 'classification'],
      species: 'Megaptera novaeangliae',
      location: 'Pennsylvania Group Research'
    },
    historic_humpback_1970_side1: {
      url: 'https://archive.org/download/songsofhumpbackw00payn/Side%201.mp3',
      title: 'Historic "Songs of the Humpback Whale" 1970 - Side 1',
      license: 'Public Domain',
      attribution: 'Roger S. Payne, Bermuda 1970',
      attributionRequired: false,
      duration: null, // Full album side
      tags: ['whale', 'humpback', 'historic', '1970', 'bermuda', 'conservation', 'payne'],
      species: 'Megaptera novaeangliae',
      location: 'Bermuda',
      historic: true
    },
    historic_humpback_1970_side2: {
      url: 'https://archive.org/download/songsofhumpbackw00payn/Side%202.mp3',
      title: 'Historic "Songs of the Humpback Whale" 1970 - Side 2',
      license: 'Public Domain',
      attribution: 'Roger S. Payne, Bermuda 1970',
      attributionRequired: false,
      duration: null, // Full album side
      tags: ['whale', 'humpback', 'historic', '1970', 'bermuda', 'conservation', 'payne'],
      species: 'Megaptera novaeangliae',
      location: 'Bermuda',
      historic: true
    },
    // Blue Whales
    cornell_longisland_blue: {
      url: 'https://web.archive.org/web/20250420204702/https://www.fisheries.noaa.gov/s3/2023-04/Cornell-NY-LongIsland-20090123-000000-LPfilter20-amplified-x8speed-blue-clip.mp3',
      title: 'Cornell/NOAA Long Island Blue Whale',
      license: 'Public Domain',
      attribution: 'Cornell University/NOAA',
      attributionRequired: false,
      duration: null, // Variable (8x speed increase, low-pass filtered, amplified)
      tags: ['whale', 'blue', 'cornell', 'long-island', '2009', 'filtered', 'amplified'],
      species: 'Balaenoptera musculus',
      location: 'Long Island, NY',
      recordingDate: '2009-01-23'
    },
    northeast_pacific_blue_pmel: {
      url: 'https://web.archive.org/web/20250526025156/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/nepblue24s10x.wav',
      title: 'Northeast Pacific Blue Whale - PMEL',
      license: 'Public Domain',
      attribution: 'NOAA PMEL',
      attributionRequired: false,
      duration: 24, // seconds (10x speed increase)
      tags: ['whale', 'blue', 'northeast-pacific', 'pmel', 'spectrogram'],
      species: 'Balaenoptera musculus',
      location: 'Northeast Pacific'
    },
    atlantic_blue_pmel: {
      url: 'https://web.archive.org/web/20250430204620/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlblue_512_64_0-50_10x.wav',
      title: 'Atlantic Blue Whale - PMEL',
      license: 'Public Domain',
      attribution: 'NOAA PMEL',
      attributionRequired: false,
      duration: null, // Variable (10x speed increase)
      tags: ['whale', 'blue', 'atlantic', 'pmel', 'low-frequency'],
      species: 'Balaenoptera musculus',
      location: 'Atlantic Ocean',
      frequencyRange: '0-50Hz'
    },
    loneliest_whale_52hz: {
      url: 'https://web.archive.org/web/20250309152144/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/ak52_10x.wav',
      title: '52 Hz "Loneliest Whale"',
      license: 'Public Domain',
      attribution: 'NOAA PMEL',
      attributionRequired: false,
      duration: null, // Variable (10x speed increase)
      tags: ['whale', 'blue', '52hz', 'loneliest', 'unique', 'alaska'],
      species: 'Balaenoptera musculus',
      location: 'Alaska',
      uniqueFrequency: '52Hz'
    },
    monterey_bay_blue_sanctsound: {
      url: 'https://web.archive.org/web/20250413110747/https://sanctsound.ioos.us/files/SanctSound_MB01_01_bluewhale_20181123T203257Z_6xSpeed.wav.mp3',
      title: 'Monterey Bay Blue Whale - SanctSound',
      license: 'Public Domain',
      attribution: 'NOAA SanctSound Program',
      attributionRequired: false,
      duration: null, // Variable (6x speed increase)
      tags: ['whale', 'blue', 'monterey-bay', 'sanctsound', '2018', 'monitoring'],
      species: 'Balaenoptera musculus',
      location: 'Monterey Bay, CA',
      recordingDate: '2018-11-23'
    },
    // Other Baleen Whales
    atlantic_minke_pmel: {
      url: 'https://web.archive.org/web/20250430135640/https://www.pmel.noaa.gov/acoustics/whales/sounds/whalewav/atlmin_512_64_0-50_10x.wav',
      title: 'Atlantic Minke Whale - PMEL',
      license: 'Public Domain',
      attribution: 'NOAA PMEL',
      attributionRequired: false,
      duration: null, // Variable (10x speed increase)
      tags: ['whale', 'minke', 'atlantic', 'downsweeps', 'thumps', 'ratchets'],
      species: 'Balaenoptera acutorostrata',
      location: 'Atlantic Ocean',
      frequencyRange: '50-35Hz'
    },
    fin_whale_pennsylvania: {
      url: 'https://web.archive.org/web/20250501031730/https://www.fisheries.noaa.gov/s3/2023-04/Baph-song-NOAA-PAGroup-05-x5speed-fin-clip.mp3',
      title: 'Fin Whale - Pennsylvania Group',
      license: 'Public Domain',
      attribution: 'NOAA Pennsylvania Group',
      attributionRequired: false,
      duration: null, // Variable (5x speed increase)
      tags: ['whale', 'fin', 'song', 'pennsylvania', 'scientific', 'classification'],
      species: 'Balaenoptera physalus',
      location: 'Pennsylvania Group Research'
    },
    right_whale_upcalls: {
      url: 'https://web.archive.org/web/20250430145142/https://www.fisheries.noaa.gov/s3/2023-04/Eugl-upcall-NOAA-PAGroup-01-right-clip-1.mp3',
      title: 'Right Whale Upcalls - Pennsylvania Group',
      license: 'Public Domain',
      attribution: 'NOAA Pennsylvania Group',
      attributionRequired: false,
      duration: null, // Variable
      tags: ['whale', 'right', 'upcalls', 'endangered', 'conservation', 'atlantic'],
      species: 'Eubalaena glacialis',
      location: 'North Atlantic',
      conservationStatus: 'Critically Endangered'
    },
    sei_whale_downsweeps: {
      url: 'https://web.archive.org/web/20250420230007/https://www.fisheries.noaa.gov/s3/2023-04/Babo-downsweep-NOAA-PAGroup-06-x2speed-sei-whale-clip.mp3',
      title: 'Sei Whale Downsweeps - Pennsylvania Group',
      license: 'Public Domain',
      attribution: 'NOAA Pennsylvania Group',
      attributionRequired: false,
      duration: null, // Variable (2x speed increase)
      tags: ['whale', 'sei', 'downsweeps', 'pennsylvania', 'research'],
      species: 'Balaenoptera borealis',
      location: 'Pennsylvania Group Research'
    },
    // Toothed Whales
    pilot_whale_multisound: {
      url: 'https://web.archive.org/web/20250617094506/https://www.fisheries.noaa.gov/s3/2023-04/Glsp-Multisound-NOAA-PAGroup-01-pilot-whale-clip.mp3',
      title: 'Pilot Whale Multi-sound - Pennsylvania Group',
      license: 'Public Domain',
      attribution: 'NOAA Pennsylvania Group',
      attributionRequired: false,
      duration: null, // Variable
      tags: ['whale', 'pilot', 'toothed', 'multi-sound', 'vocalizations'],
      species: 'Globicephala species',
      location: 'Pennsylvania Group Research',
      whaleType: 'toothed'
    },
    gray_whale_mbari: {
      url: 'https://freesound.org/apiv2/sounds/413377/download/',
      title: 'Gray Whale - MBARI Deep-Sea Observatory',
      license: 'CC BY 4.0',
      attribution: 'Gray whale vocalizations by MBARI_MARS -- https://freesound.org/s/413377/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: null, // Variable
      tags: ['whale', 'gray', 'mbari', 'deep-sea', 'observatory', 'california', '2015'],
      species: 'Eschrichtius robustus',
      location: 'California Deep-Sea Observatory',
      recordingDate: '2015-08-18'
    }
  },
  'sci-fi': {
    dark_texture_1: {
      url: 'https://freesound.org/apiv2/sounds/479068/download/',
      title: 'Dark Texture 1 (Square Wave)',
      license: 'CC BY 3.0',
      attribution: 'Dark Texture 1 (Square Wave) by subtletransmissions -- https://freesound.org/s/479068/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 120.000, // seconds (2:00.000)
      tags: ['sci-fi', 'atmospheric', 'dark', 'square-wave', 'texture'],
      category: 'space-atmosphere'
    },
    lazer_1: {
      url: 'https://freesound.org/apiv2/sounds/484060/download/',
      title: 'Lazer 1',
      license: 'CC BY 3.0',
      attribution: 'Lazer 1 by subtletransmissions -- https://freesound.org/s/484060/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 10.000, // seconds
      tags: ['sci-fi', 'laser', 'effect', 'technological'],
      category: 'technological-effect'
    },
    scifi_computing_transmission_01: {
      url: 'https://freesound.org/apiv2/sounds/757449/download/',
      title: 'Sci-Fi Computing Transmission 01',
      license: 'CC0',
      attribution: 'cabled_mess',
      attributionRequired: false,
      duration: 60.000, // seconds (1:00.000)
      tags: ['sci-fi', 'computing', 'transmission', 'retro', 'analogue', 'communication', 'eurorack', 'modular', 'technological'],
      category: 'technological-sounds'
    },
    synthetic_watery_bubbles_01: {
      url: 'https://freesound.org/apiv2/sounds/756472/download/',
      title: 'Synthetic Watery Bubbles 01',
      license: 'CC0',
      attribution: 'cabled_mess',
      attributionRequired: false,
      duration: 60.000, // seconds (1:00.000)
      tags: ['sci-fi', 'synthetic', 'water', 'bubbles', 'modular', 'analogue', 'liquid', 'technological', 'texture'],
      category: 'technological-sounds'
    },
    bizarre_radio_noise: {
      url: 'https://freesound.org/apiv2/sounds/123708/download/',
      title: 'Bizarre Radio Noise',
      license: 'CC0',
      attribution: 'alienistcog',
      attributionRequired: false,
      duration: 311.134, // seconds (5:11.134)
      tags: ['sci-fi', 'radio', 'interference', 'electromagnetic', 'noise', 'strange', 'atmospheric', 'technological', 'mysterious', 'extended'],
      category: 'technological-sounds'
    },
    basic_spaceship_engine_bass: {
      url: 'https://freesound.org/apiv2/sounds/725828/download/',
      title: 'Basic Spaceship Engine (Bass)',
      license: 'CC0',
      attribution: 'clif_creates',
      attributionRequired: false,
      duration: 25.557, // seconds (0:25.557)
      tags: ['sci-fi', 'spaceship', 'engine', 'bass', 'hum', 'technological', 'feedback', 'layer'],
      category: 'technological-sounds'
    },
    ilh_space_noise_nostromo: {
      url: 'https://freesound.org/apiv2/sounds/516327/download/',
      title: 'ILH Space Noise - Nostromo',
      license: 'CC BY 4.0',
      attribution: 'ILH Space Noise | Spaceship - Alien - Nostromo by voxlab -- https://freesound.org/s/516327/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 16.302, // seconds (0:16.302)
      tags: ['sci-fi', 'spaceship', 'alien', 'nostromo', 'technological', 'harmor', 'pitch-shift', 'versatile'],
      category: 'technological-sounds'
    },
    nostromo_room_tone: {
      url: 'https://freesound.org/apiv2/sounds/59/download/',
      title: 'Nostromo Room Tone',
      license: 'CC BY 4.0',
      attribution: 'nostromo.wav by fectoper -- https://freesound.org/s/59/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 14.362, // seconds (0:14.362)
      tags: ['sci-fi', 'spaceship', 'alien', 'nostromo', 'room-tone', 'roland-jd800', 'technological', 'ambient'],
      category: 'technological-sounds'
    },
    deep_space_ship_effect: {
      url: 'https://freesound.org/apiv2/sounds/214663/download/',
      title: 'Deep Space Ship Effect',
      license: 'CC BY 4.0',
      attribution: 'Deep Space Ship Effect by hykenfreak -- https://freesound.org/s/214663/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 10.473, // seconds (0:10.473)
      tags: ['sci-fi', 'spaceship', 'deep-space', 'white-noise', 'drone', 'subtle', 'ambient', 'loop', 'technological'],
      category: 'technological-sounds'
    },
    static_error_1: {
      url: 'https://freesound.org/apiv2/sounds/275646/download/',
      title: 'Static Error 1',
      license: 'CC0',
      attribution: 'dotY21',
      attributionRequired: false,
      duration: 5.504, // seconds (0:05.504)
      tags: ['sci-fi', 'static', 'error', 'glitch', 'technological', 'malfunction', 'digital', 'interference'],
      category: 'technological-sounds'
    },
    cyborg_machine_breath_2: {
      url: 'https://freesound.org/apiv2/sounds/369826/download/',
      title: 'Cyborg/Machine Breath 2',
      license: 'CC0',
      attribution: 'dotY21',
      attributionRequired: false,
      duration: 13.300, // seconds (0:13.300)
      tags: ['sci-fi', 'cyborg', 'machine', 'breath', 'technological', 'biomechanical', 'rhythmic', 'loop'],
      category: 'technological-sounds'
    },
    corrupted_static_noise_loopable: {
      url: 'https://freesound.org/apiv2/sounds/371183/download/',
      title: 'Corrupted Static Noise Loopable',
      license: 'CC0',
      attribution: 'dotY21',
      attributionRequired: false,
      duration: 6.494, // seconds (0:06.494)
      tags: ['sci-fi', 'static', 'corrupted', 'noise', 'glitch', 'loopable', 'technological', 'interference', 'experimental'],
      category: 'technological-sounds'
    },
    high_intense_beam_morphing: {
      url: 'https://freesound.org/apiv2/sounds/747181/download/',
      title: 'High Intense Beam Morphing',
      license: 'CC0',
      attribution: 'clif_creates',
      attributionRequired: false,
      duration: 13.234, // seconds (0:13.234)
      tags: ['sci-fi', 'beam', 'laser', 'morphing', 'resonant', 'harmonious', 'technological', 'energy', 'possibly-c'],
      category: 'technological-sounds'
    },
    fantasy_scifi_city_forest: {
      url: 'https://freesound.org/apiv2/sounds/593692/download/',
      title: 'Fantasy Sci-Fi City Forest Atmosphere',
      license: 'CC0',
      attribution: 'szegvari',
      attributionRequired: false,
      duration: 234.901, // seconds (3:54.901)
      tags: ['sci-fi', 'fantasy', 'city', 'forest', 'atmospheric', 'soundscape', 'ambient'],
      category: 'atmospheric-soundscape'
    },
    scifi_soundscape_wind_200: {
      url: 'https://freesound.org/apiv2/sounds/743075/download/',
      title: 'Sci-Fi Soundscape - Wind - 200',
      license: 'CC BY-NC 4.0',
      attribution: 'Sci-Fi Soundscape - Wind - 200 by GregorQuendel -- https://freesound.org/s/743075/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 69.267, // seconds (1:09.267)
      tags: ['sci-fi', 'soundscape', 'wind', 'synthetic', 'artificial', 'atmospheric', 'designed'],
      category: 'atmospheric-soundscape'
    },
    deep_space_sound: {
      url: 'https://freesound.org/apiv2/sounds/743472/download/',
      title: 'Deep Space Sound',
      license: 'CC0',
      attribution: 'cliploop',
      attributionRequired: false,
      duration: 7.559, // seconds (0:07.559)
      tags: ['sci-fi', 'space', 'deep', 'spheric', 'synthetic', 'atmospheric', 'short', 'loop'],
      category: 'atmospheric-soundscape'
    },
    transfer_other_dimension: {
      url: 'https://freesound.org/apiv2/sounds/86072/download/',
      title: 'Transfer into the Other Dimension',
      license: 'CC BY-NC 3.0',
      attribution: 'Transfer into the other dimension_1-2.aif by harpoyume -- https://freesound.org/s/86072/ -- License: Attribution NonCommercial 3.0',
      attributionRequired: true,
      duration: 7.006, // seconds (0:07.006)
      tags: ['sci-fi', 'dimensional', 'transfer', 'otherworldly', 'synthetic', 'atmospheric', 'short', 'portal'],
      category: 'atmospheric-soundscape'
    },
    scifi_tense_strings: {
      url: 'https://freesound.org/apiv2/sounds/635682/download/',
      title: 'Scifi Tense Strings',
      license: 'CC0',
      attribution: 'LaurenPonder',
      attributionRequired: false,
      duration: 19.227, // seconds (0:19.227)
      tags: ['sci-fi', 'tense', 'strings', 'atmospheric', 'suspense', 'space', 'texture'],
      category: 'space-atmosphere'
    },
    space_sound_atmospheric: {
      url: 'https://freesound.org/apiv2/sounds/261031/download/',
      title: 'Space Sound Ph Sny B6 7',
      license: 'CC BY-NC 4.0',
      attribution: 'space sound ph sny b6 7.wav by ERH -- https://freesound.org/s/261031/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 119.950, // seconds (1:59.950)
      tags: ['sci-fi', 'space', 'atmospheric', 'synth', 'futuristic', 'ambient', 'film', 'game'],
      category: 'space-atmosphere'
    },
    shimmer_ethereal_scifi: {
      url: 'https://freesound.org/apiv2/sounds/163534/download/',
      title: 'Shimmer Ph Sny 1b14 2',
      license: 'CC BY-NC 4.0',
      attribution: 'shimmer ph Sny 1b14 2.wav by ERH -- https://freesound.org/s/163534/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 45.817, // seconds (0:45.817)
      tags: ['sci-fi', 'shimmer', 'ethereal', 'atmospheric', 'synth', 'futuristic', 'background', 'film'],
      category: 'space-atmosphere'
    },
    space_sound_zen: {
      url: 'https://freesound.org/apiv2/sounds/163481/download/',
      title: 'Space Sound Zen 1',
      license: 'CC BY-NC 4.0',
      attribution: 'space sound zen 1.wav by ERH -- https://freesound.org/s/163481/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 63.055, // seconds (1:03.055)
      tags: ['sci-fi', 'space', 'zen', 'ethereal', 'atmospheric', 'alien-signal', 'peaceful', 'ambient'],
      category: 'space-atmosphere'
    },
    outer_space_atmosphere: {
      url: 'https://freesound.org/apiv2/sounds/163480/download/',
      title: 'Outer Space AE',
      license: 'CC BY-NC 4.0',
      attribution: 'outer space ae.wav by ERH -- https://freesound.org/s/163480/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 187.500, // seconds (3:07.500)
      tags: ['sci-fi', 'outer-space', 'ethereal', 'atmospheric', 'synth', 'background', 'film', 'extended'],
      category: 'space-atmosphere'
    },
    space_string_pad: {
      url: 'https://freesound.org/apiv2/sounds/62359/download/',
      title: 'Space String',
      license: 'CC0',
      attribution: 'fons',
      attributionRequired: false,
      duration: 29.355, // seconds (0:29.355)
      tags: ['sci-fi', 'space', 'string', 'pad', 'spacey', 'atmospheric', 'electronic', 'favorite'],
      category: 'space-atmosphere'
    },
    space_string_void: {
      url: 'https://freesound.org/apiv2/sounds/719401/download/',
      title: 'Space String',
      license: 'CC BY-NC 4.0',
      attribution: 'Space String by Lamp_ -- https://freesound.org/s/719401/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 72.331, // seconds (1:12.331)
      tags: ['sci-fi', 'space', 'string', 'void', 'atmospheric', 'synthetic', 'processed'],
      category: 'space-atmosphere',
      sourceAttribution: 'Uses LCCPTL_140_Synth_C_Pad_Fx.wav by Loop_Cult'
    },
    c_space_trumpet: {
      url: 'https://freesound.org/apiv2/sounds/501029/download/',
      title: 'C Space Trumpet',
      license: 'CC0',
      attribution: 'Kurlyjoe',
      attributionRequired: false,
      duration: 10.847, // seconds (0:10.847)
      tags: ['sci-fi', 'space', 'trumpet', 'experimental', 'C-tuned', 'horn', 'texture'],
      category: 'space-atmosphere'
    },
    moonlight_on_mars: {
      url: 'https://freesound.org/apiv2/sounds/803848/download/',
      title: 'Moonlight on Mars',
      license: 'CC BY 4.0',
      attribution: 'Moonlight on Mars by Dave_Girtsman -- https://freesound.org/s/803848/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 102.000, // seconds (1:42.000)
      tags: ['sci-fi', 'mars', 'space', 'minimal', 'atmospheric', 'eerie', 'otherworldly', 'drone', 'synth', 'tension'],
      category: 'space-atmosphere'
    }
  },
  ambient: {
    frog_chorus_ambience: {
      url: 'https://freesound.org/apiv2/sounds/697832/download/',
      title: 'Frog Chorus Ambience',
      license: 'CC BY-NC 4.0',
      attribution: 'Frog Chorus Ambience Nature Animals.wav by soundshmyak -- https://freesound.org/s/697832/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 8.897, // seconds
      tags: ['ambient', 'nature', 'frog', 'chorus', 'animals', 'natural', 'soundscape'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 1500,        // gentle fade-in for nature sounds
        customFadeOut: 2000,       // longer fade-out for natural ending
        hasNaturalFadeOut: false,
        loopable: true,            // can be looped for extended ambience
        crossfadeCompatible: true
      }
    },
    melancholic_nature_soundscape: {
      url: 'https://freesound.org/apiv2/sounds/776043/download/',
      title: 'Melancholic Nature Soundscape',
      license: 'CC BY 4.0',
      attribution: 'Melancholic Nature Soundscape by Universfield -- https://freesound.org/s/776043/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 98.460, // seconds (1:38.460)
      tags: ['ambient', 'melancholic', 'nature', 'documentary', 'misty', 'forest', 'mountains', 'rain', 'solitude', 'reflection'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 3000,        // slow fade-in for contemplative mood
        customFadeOut: 4000,       // extended fade-out for reflection
        hasNaturalFadeOut: false,
        loopable: true,            // suitable for extended contemplative sessions
        crossfadeCompatible: true,
        documentaryQuality: true   // professional nature documentary sound
      }
    },
    morning_cicada_bird_chorus_17year: {
      url: 'https://freesound.org/apiv2/sounds/811163/download/',
      title: 'Morning Cicada and Bird Chorus – 17-Year Brood Field Recording',
      license: 'CC0',
      attribution: 'clawback',
      attributionRequired: false,
      duration: 1538.279, // seconds (25:38.279)
      tags: ['ambient', 'nature', 'cicada', 'birds', 'chorus', 'field-recording', '17-year-brood', '2025', 'dawn', 'rural', 'rare-biological-event'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 4000,        // extended fade-in for immersive nature entry
        customFadeOut: 5000,       // long fade-out for natural ending
        hasNaturalFadeOut: false,
        loopable: true,            // extended duration perfect for long sessions
        crossfadeCompatible: true,
        rareBiologicalEvent: true, // documents once-in-17-years emergence
        fieldRecordingQuality: true // authentic field recording
      },
      specialNotes: {
        recordingYear: 2025,
        biologicalEvent: '17-year cicada brood emergence',
        longestInCollection: true,
        multiSpeciesRecording: ['cicadas', 'robins', 'cardinals', 'wrens', 'mourning doves', 'blue jays', 'rooster']
      }
    },
    forest_atmosphere_005_poland: {
      url: 'https://freesound.org/apiv2/sounds/813283/download/',
      title: 'Forest Atmosphere 005 (Poland)',
      license: 'CC0',
      attribution: 'AudioPapkin',
      attributionRequired: false,
      duration: 222.209, // seconds (3:42.209)
      tags: ['ambient', 'nature', 'forest', 'poland', 'birdsong', 'field-recording', 'european', 'pristine', 'natural-soundscape'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2500,        // gentle fade-in for forest entry
        customFadeOut: 3000,       // natural fade-out for forest atmosphere
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for looping
        crossfadeCompatible: true,
        pristineRecording: true,   // no human or mechanical noise
        fieldRecordingQuality: true // authentic field recording
      },
      geographicInfo: {
        country: 'Poland',
        region: 'European forest',
        ecosystem: 'temperate forest',
        recordingEnvironment: 'pristine natural habitat'
      }
    },
    berlin_birds_nightingale_urban: {
      url: 'https://freesound.org/apiv2/sounds/772101/download/',
      title: 'Berlin Birds - Nightingale & Great Tit with Urban Ambience',
      license: 'CC BY 4.0',
      attribution: 'Berlin Birds - Nightingale & Great Tit with Urban Ambience by MichiJung -- https://freesound.org/s/772101/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 93.758, // seconds (1:33.758)
      tags: ['ambient', 'urban', 'berlin', 'nightingale', 'great-tit', 'birds', 'traffic', 'construction', 'urban-biodiversity', 'summer-2024', 'sony-pcm-d100'],
      category: 'urban-nature',
      fadeSettings: {
        customFadeIn: 2000,        // fade-in for urban environment entry
        customFadeOut: 2500,       // fade-out for layered soundscape
        hasNaturalFadeOut: false,
        loopable: true,            // good loop duration
        crossfadeCompatible: true,
        documentaryQuality: true,  // professional field recording
        urbanNatureMix: true       // unique nature-city blend
      },
      geographicInfo: {
        city: 'Berlin',
        country: 'Germany',
        recordingDate: 'Summer 2024',
        equipment: 'Sony PCM-D100',
        environment: 'urban-natural intersection'
      },
      birdSpecies: ['nightingale', 'great tit'],
      urbanElements: ['construction site', 'city traffic']
    },
    midnight_kwazulu_natal: {
      url: 'https://freesound.org/apiv2/sounds/765399/download/',
      title: 'Midnight Ambiance in KwaZulu-Natal',
      license: 'CC BY-NC 4.0',
      attribution: 'Midnight Ambiance in KwaZulu-Natal (Recorded with Zoom H6) by DonnyDB -- https://freesound.org/s/765399/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 176.217, // seconds (2:56.217)
      tags: ['ambient', 'africa', 'kwazulu-natal', 'south-africa', 'midnight', 'night', 'wilderness', 'animal-calls', 'wind', 'vegetation', 'zoom-h6'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 3000,        // slow fade-in for nighttime immersion
        customFadeOut: 3500,       // extended fade-out for serene ending
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for extended night ambience
        crossfadeCompatible: true,
        nighttimeAtmosphere: true, // captures after-dark environment
        wildernessQuality: true    // authentic African wilderness
      },
      geographicInfo: {
        region: 'KwaZulu-Natal',
        country: 'South Africa',
        continent: 'Africa',
        timeOfRecording: 'midnight',
        equipment: 'Zoom H6',
        environment: 'African wilderness'
      },
      wildlifeElements: ['distant animal calls', 'soft winds', 'rustling vegetation'],
      atmosphericQualities: ['serene', 'natural', 'immersive']
    },
    suburban_rain_thunder: {
      url: 'https://freesound.org/apiv2/sounds/789045/download/',
      title: 'Suburban Rain & Light Thunder',
      license: 'CC BY 4.0',
      attribution: 'THUN-NTSF1 Zoom F6_Suburban Rain & Light Thunder FREE_TFR RNajmeddine_Suburban Rain FREE_20250127 by TheFieldRecordist -- https://freesound.org/s/789045/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 360.000, // seconds (6:00.000)
      tags: ['ambient', 'rain', 'thunder', 'suburban', 'thunderstorm', 'weather', 'birds', 'cars', 'atmospheric', 'zoom-f6', '2025'],
      category: 'weather-sounds',
      fadeSettings: {
        customFadeIn: 2000,        // gentle fade-in for storm arrival
        customFadeOut: 4000,       // extended fade-out for storm departure
        hasNaturalFadeOut: false,
        loopable: true,            // 6-minute duration excellent for extended sessions
        crossfadeCompatible: true,
        weatherAtmosphere: true,   // captures storm dynamics
        layeredSoundscape: true    // multiple environmental elements
      },
      weatherElements: ['rain patter', 'distant thunder', 'wet road sounds'],
      suburbanElements: ['birds chirping', 'dog barking', 'cars passing'],
      recordingInfo: {
        equipment: 'Zoom F6',
        recordingDate: '2025-01-27',
        environment: 'suburban neighborhood',
        weatherCondition: 'fleeting thunderstorm'
      },
      atmosphericQualities: ['calming', 'rich', 'textured', 'tranquil']
    },
    rain_thunder_4: {
      url: 'https://freesound.org/apiv2/sounds/237729/download/',
      title: 'Rain and Thunder 4',
      license: 'CC0',
      attribution: 'FlatHill',
      attributionRequired: false,
      duration: 32.875, // seconds (0:32.875)
      tags: ['ambient', 'rain', 'thunder', 'weather', 'storm', 'natural', 'atmospheric'],
      category: 'weather-sounds'
    },
    rain_fall_through_trees: {
      url: 'https://freesound.org/apiv2/sounds/242956/download/',
      title: 'Rain Fall Through Trees',
      license: 'CC0',
      attribution: 'acollier123',
      attributionRequired: false,
      duration: 78.686, // seconds (1:18.686)
      tags: ['ambient', 'rain', 'trees', 'nature', 'forest', 'shed', 'splashing', 'zoom-h2', 'uk', '2014', 'weather', 'atmospheric'],
      category: 'weather-sounds'
    },
    wind_howling_nighttime: {
      url: 'https://freesound.org/apiv2/sounds/17553/download/',
      title: 'Wind Howling Nighttime',
      license: 'CC BY 3.0',
      attribution: 'Wind_Howling_NIghttime.aif by Dynamicell -- https://freesound.org/s/17553/ -- License: Attribution 3.0',
      attributionRequired: true,
      duration: 58.666, // seconds (0:58.666)
      tags: ['ambient', 'wind', 'howling', 'nighttime', 'weather', 'atmospheric', 'sm57', 'mk319', 'logic-pro'],
      category: 'weather-sounds'
    },
    wind_through_trees_3b: {
      url: 'https://freesound.org/apiv2/sounds/244942/download/',
      title: 'Wind Through Trees 3b',
      license: 'CC BY 4.0',
      attribution: 'Wind Through Trees 3b by spoonbender -- https://freesound.org/s/244942/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 58.154, // seconds (0:58.154)
      tags: ['ambient', 'wind', 'trees', 'forest', 'creaking', 'northumberland', 'uk', 'zoom-h2n', 'nature', 'atmospheric', 'thrunton-woods'],
      category: 'weather-sounds'
    },
    wolves_howling: {
      url: 'https://freesound.org/apiv2/sounds/158780/download/',
      title: 'Wolves Howling',
      license: 'CC0',
      attribution: 'Paresh',
      attributionRequired: false,
      duration: 33.299, // seconds (0:33.299)
      tags: ['ambient', 'wolves', 'howling', 'wildlife', 'nature', 'sanctuary', 'washington', 'wolf-haven', 'animal-sounds'],
      category: 'nature-sounds'
    },
    countryside_dawn: {
      url: 'https://freesound.org/apiv2/sounds/458113/download/',
      title: 'Countryside Dawn',
      license: 'CC0',
      attribution: 'brunoboselli',
      attributionRequired: false,
      duration: 58.000, // seconds (0:58.000)
      tags: ['ambient', 'countryside', 'dawn', 'cicadas', 'crickets', 'birds', 'farm', 'uruguay', 'piriapolis', 'nature', 'rural', 'morning'],
      category: 'nature-sounds'
    },
    abstract_ambient_jd800: {
      url: 'https://freesound.org/apiv2/sounds/58/download/',
      title: 'Abstract Ambient JD-800',
      license: 'CC BY 4.0',
      attribution: 'ambient1.wav by fectoper -- https://freesound.org/s/58/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 59.815, // seconds (0:59.815)
      tags: ['ambient', 'abstract', 'synthesizer', 'roland-jd800', 'patch', 'atmospheric', 'synthetic'],
      category: 'synthetic-atmospheres'
    },
    misty_limbo: {
      url: 'https://freesound.org/apiv2/sounds/133015/download/',
      title: 'Misty Limbo',
      license: 'CC BY 4.0',
      attribution: 'Misty Limbo by CosmicD -- https://freesound.org/s/133015/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 82.103, // seconds (1:22.103)
      tags: ['ambient', 'limbo', 'misty', 'ethereal', 'resonators', 'synthetic', 'otherworldly', 'atmospheric'],
      category: 'synthetic-atmospheres'
    },
    otherworldly_ambience: {
      url: 'https://freesound.org/apiv2/sounds/370164/download/',
      title: 'Otherworldly Ambience',
      license: 'CC0',
      attribution: 'dotY21',
      attributionRequired: false,
      duration: 39.269, // seconds (0:39.269)
      tags: ['ambient', 'otherworldly', 'loop', 'atmospheric', 'mysterious', 'synthetic'],
      category: 'synthetic-atmospheres'
    },
    desert_at_night: {
      url: 'https://freesound.org/apiv2/sounds/138288/download/',
      title: 'Desert at Night',
      license: 'CC BY 4.0',
      attribution: 'Desert at Night by kangaroovindaloo -- https://freesound.org/s/138288/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 232.080, // seconds (3:52.080)
      tags: ['ambient', 'desert', 'night', 'australia', 'tanami', 'northern-territory', 'nature', 'nocturnal', 'outback', 'wildlife'],
      category: 'nature-sounds'
    },
    magpie: {
      url: 'https://freesound.org/apiv2/sounds/584903/download/',
      title: 'Magpie',
      license: 'CC0',
      attribution: 'kangaroovindaloo',
      attributionRequired: false,
      duration: 11.711, // seconds (0:11.711)
      tags: ['ambient', 'nature', 'magpie', 'bird', 'forest', 'fryers-forest', 'australia', 'wildlife', 'field-recording', 'mid-side', 'professional'],
      category: 'nature-sounds'
    },
    thunder_clap: {
      url: 'https://freesound.org/apiv2/sounds/585077/download/',
      title: 'Thunder Clap',
      license: 'CC0',
      attribution: 'kangaroovindaloo',
      attributionRequired: false,
      duration: 25.500, // seconds (0:25.500)
      tags: ['ambient', 'nature', 'thunder', 'weather', 'storm', 'atmospheric', 'natural-elements', 'meteorological', 'powerful'],
      category: 'nature-sounds'
    },
    texture_of_water: {
      url: 'https://freesound.org/apiv2/sounds/588652/download/',
      title: 'Texture of Water',
      license: 'CC BY 4.0',
      attribution: 'Texture of Water by kangaroovindaloo -- https://freesound.org/s/588652/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 426.810, // seconds (7:06.810)
      tags: ['ambient', 'nature', 'water', 'stream', 'flowing', 'birds', 'pomonal', 'victoria', 'australia', 'soundscape', 'natural', 'aquatic'],
      category: 'nature-sounds'
    },
    waves_brittany: {
      url: 'https://freesound.org/apiv2/sounds/535582/download/',
      title: 'Waves Ambience, Brittany',
      license: 'CC BY 4.0',
      attribution: 'Waves Ambience, Brittany, A by Moulaythami -- https://freesound.org/s/535582/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 603.115, // seconds (10:03.115)
      tags: ['ambient', 'waves', 'ocean', 'brittany', 'france', 'coast', 'dual-mic', 'professional', 'sub-bass', 'natural', 'beyerdynamic', 'superlux'],
      category: 'ocean-sounds',
      fadeSettings: {
        customFadeIn: 3000,        // slow fade-in for ocean immersion
        customFadeOut: 4000,       // extended fade-out for waves departure
        hasNaturalFadeOut: false,
        loopable: true,            // 10+ minute duration perfect for extended sessions
        crossfadeCompatible: true,
        naturalSubBass: true,      // heavy natural low frequencies
        professionalRecording: true // dual-mic professional technique
      },
      recordingTechnique: {
        primaryMic: 'Beyerdynamic MCE 85 BA (facing waves)',
        secondaryMic: 'Superlux S241 (buried in sand)',
        technique: 'dual-microphone setup',
        result: 'heavy natural sub-bass frequencies'
      },
      geographicInfo: {
        region: 'Brittany',
        country: 'France',
        environment: 'coastal waves',
        recordingType: 'crashing waves soundscape'
      },
      atmosphericQualities: ['immersive', 'natural', 'heavy', 'rich', 'meditative'],
      specialFeatures: {
        longestOceanSample: true,  // longest ocean recording in collection
        innovativeRecording: true, // unique dual-mic buried technique
        subBassEnhanced: true      // natural heavy low frequencies
      }
    },
    crickets_mezos_night: {
      url: 'https://freesound.org/apiv2/sounds/523454/download/',
      title: 'Crickets at Night in Mezos',
      license: 'CC BY-NC 3.0',
      attribution: 'Crikets at night in Mezos 2.wav by Guillaume.Capsowl.Voisin -- https://freesound.org/s/523454/ -- License: Attribution NonCommercial 3.0',
      attributionRequired: true,
      duration: 135.500, // seconds (2:15.500)
      tags: ['ambient', 'crickets', 'night', 'mezos', 'france', 'landes', 'nature', 'evening', 'rural', 'insects', 'soundscape'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2000,        // gentle fade-in for nighttime entry
        customFadeOut: 2500,       // natural fade-out for cricket chorus
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for cricket ambience loops
        crossfadeCompatible: true,
        nighttimeAtmosphere: true, // captures evening/night environment
        insectChorus: true         // natural cricket soundscape
      },
      geographicInfo: {
        location: 'Mezos',
        region: 'Landes',
        country: 'France',
        area: 'southwestern France',
        environment: 'rural countryside',
        timeOfRecording: 'night'
      },
      naturalElements: ['cricket chorus', 'evening insects', 'rural nature'],
      atmosphericQualities: ['peaceful', 'rural', 'authentic', 'contemplative', 'nighttime']
    },
    thuringian_forest_summer: {
      url: 'https://freesound.org/apiv2/sounds/240339/download/',
      title: 'Forest Soundscape (Thuringian Forest)',
      license: 'CC BY 4.0',
      attribution: 'Forest Soundscape (Thuringian Forest) by Porphyr -- https://freesound.org/s/240339/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 158.628, // seconds (2:38.628)
      tags: ['ambient', 'forest', 'thuringia', 'germany', 'summer', 'birdsong', 'insects', 'temperate-forest', 'suhl', '2014', 'european'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2500,        // gentle fade-in for forest entry
        customFadeOut: 3000,       // natural fade-out for forest atmosphere
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for temperate forest loops
        crossfadeCompatible: true,
        summerAtmosphere: true,    // captures warm summer day environment
        temperateForest: true      // central European forest ecosystem
      },
      geographicInfo: {
        location: 'Lange Bahn near Suhl',
        region: 'Thuringia',
        country: 'Germany',
        area: 'central Germany',
        environment: 'temperate forest',
        recordingDate: '2014-06-09',
        weatherConditions: '32°C, minimal wind'
      },
      naturalElements: ['bird songs', 'insect fly-bys', 'summer forest'],
      atmosphericQualities: ['warm', 'peaceful', 'natural', 'summer', 'temperate'],
      recordingDetails: {
        season: 'summer',
        temperature: '32°C',
        windCondition: 'minimal',
        timeOfDay: 'daytime',
        forestType: 'temperate deciduous'
      }
    },
    brazilian_forest_urban_contaminated: {
      url: 'https://freesound.org/apiv2/sounds/785125/download/',
      title: 'Forest Soundscape Contaminated by Urban Noise',
      license: 'CC BY-NC 4.0',
      attribution: 'Forest soundscape contaminated by urban noise by ricardoemfield -- https://freesound.org/s/785125/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 150.000, // seconds (2:30.000)
      tags: ['ambient', 'forest', 'brazil', 'itapoa', 'santa-catarina', 'urban-contamination', 'motorcycle', 'dog', 'nighttime', '2025', 'zoom-h1n', 'south-america'],
      category: 'urban-nature',
      fadeSettings: {
        customFadeIn: 2000,        // fade-in for mixed environment entry
        customFadeOut: 2500,       // fade-out for contaminated soundscape
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for urban-nature intersection
        crossfadeCompatible: true,
        urbanContamination: true,  // documents environmental impact
        realisticEnvironment: true // authentic modern forest conditions
      },
      geographicInfo: {
        city: 'Itapoá',
        state: 'Santa Catarina',
        country: 'Brazil',
        continent: 'South America',
        region: 'southern Brazil',
        environment: 'forest with urban encroachment',
        recordingDate: '2025-01-10',
        timeOfRecording: '22:00 (10 PM)'
      },
      recordingEquipment: {
        device: 'Zoom H1N',
        recordingQuality: 'field recording',
        recordingContext: 'environmental documentation'
      },
      environmentalElements: {
        naturalSounds: ['forest atmosphere', 'nighttime forest'],
        urbanContaminants: ['motorcycle', 'dog barking'],
        documentaryValue: 'urban impact on natural environments'
      },
      atmosphericQualities: ['realistic', 'contemporary', 'conflicted', 'documentary', 'environmental'],
      specialFeatures: {
        firstSouthAmericanSample: true,    // adds South American continent
        environmentalDocumentation: true,   // documents urban sprawl impact
        contemporaryRecording: true,        // very recent (January 2025)
        urbanNatureConflict: true          // authentic environmental pressure
      }
    },
    rural_bouriege_snippet: {
      url: 'https://freesound.org/apiv2/sounds/737197/download/',
      title: 'Rural Soundscape Snippet - Bouriège',
      license: 'CC0',
      attribution: 'Sadiquecat',
      attributionRequired: false,
      duration: 9.575, // seconds (0:09.575)
      tags: ['ambient', 'rural', 'bouriege', 'aude', 'france', 'eurasian-collared-dove', 'grasshopper-warbler', 'great-tit', 'tractor', 'evening', 'zoom-h2n', 'ambisonic', 'merlin-bird-id'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 1000,        // quick fade-in for short snippet
        customFadeOut: 1000,       // quick fade-out for short snippet
        hasNaturalFadeOut: false,
        loopable: true,            // very short, excellent for rapid cycling
        crossfadeCompatible: true,
        shortSnippet: true,        // shortest ambient sample in collection
        scientificAccuracy: true   // bird species verified with Merlin Bird ID
      },
      geographicInfo: {
        village: 'Bouriège',
        department: 'Aude',
        country: 'France',
        region: 'southern France',
        environment: 'rural countryside',
        recordingDate: '2024-05-24',
        timeOfRecording: '19:20 (evening)'
      },
      recordingEquipment: {
        device: 'Zoom H2n',
        recordingMode: 'ambisonic',
        windProtection: 'deadcat wind muffler',
        processing: 'Audacity (trim, denoise, EQ, normalization)'
      },
      scientificIdentification: {
        method: 'Merlin Bird ID app',
        identifiedBy: 'Klankbeeld',
        species: [
          {
            commonName: 'Eurasian Collared Dove',
            scientificName: 'Streptopelia decaocto',
            soundDescription: 'owl-like background sound'
          },
          {
            commonName: 'Common Grasshopper Warbler',
            scientificName: 'Locustella naevia',
            soundDescription: 'loud cricket-like sound'
          },
          {
            commonName: 'Great Tit',
            scientificName: 'Parus major',
            soundDescription: 'squeaking bicycle pump sound'
          }
        ]
      },
      environmentalElements: ['scientifically identified birds', 'tractor sounds', 'rural evening atmosphere'],
      atmosphericQualities: ['scientific', 'rural', 'authentic', 'brief', 'evening'],
      specialFeatures: {
        shortestAmbientSample: true,       // shortest sample in collection
        scientificVerification: true,      // bird species verified
        ambisonicRecording: true,          // spatial audio technique
        extractFromLongerRecording: true   // snippet from longer recording
      }
    },
    nature_losing_war: {
      url: 'https://freesound.org/apiv2/sounds/652794/download/',
      title: 'Nature is Losing the War',
      license: 'CC BY 4.0',
      attribution: 'Nature is losing the war.wav by dibko -- https://freesound.org/s/652794/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 211.981, // seconds (3:31.981)
      tags: ['ambient', 'environmental-commentary', 'birds', 'cars', 'manufacturing', 'factories', 'civilization-impact', 'zoom-h5', 'msh-6', 'nature-vs-industry'],
      category: 'urban-nature',
      fadeSettings: {
        customFadeIn: 2000,        // fade-in for environmental documentary
        customFadeOut: 3000,       // extended fade-out for contemplative ending
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for environmental themes
        crossfadeCompatible: true,
        environmentalCommentary: true, // documents civilization impact
        documentaryPower: true     // powerful environmental message
      },
      recordingEquipment: {
        device: 'Zoom H5',
        microphone: 'MSH-6',
        recordingQuality: 'professional',
        recordingContext: 'environmental documentation'
      },
      environmentalElements: {
        naturalSounds: ['bird songs', 'natural soundscape'],
        industrialSounds: ['cars', 'people', 'manufacturing', 'factories'],
        commentary: 'nature overwhelmed by civilization',
        documentaryValue: 'spreading impact of industrialization'
      },
      atmosphericQualities: ['contemplative', 'documentary', 'environmental', 'sobering', 'realistic'],
      thematicContent: {
        environmentalMessage: 'nature vs industrialization',
        artistCommentary: 'birds drowned out by surroundings',
        socialCommentary: 'spreading industrial influence',
        hopeNote: 'still spots in nature with little noise'
      },
      specialFeatures: {
        environmentalActivism: true,       // carries environmental message
        artisticCommentary: true,          // personal environmental reflection
        contemporaryRelevance: true,       // addresses current environmental crisis
        balancedPerspective: true          // acknowledges remaining quiet spots
      }
    },
    rye_harbour_nature_reserve: {
      url: 'https://freesound.org/apiv2/sounds/487617/download/',
      title: 'Rye Harbour Nature Reserve (North Section Ken Halpin Hide)',
      license: 'CC BY 4.0',
      attribution: 'Rye Harbour Nature Reserve (North Section Ken Halpin Hide) 1627hrs 07102019.wav by cwwright -- https://freesound.org/s/487617/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 504.523, // seconds (8:24.523)
      tags: ['ambient', 'nature-reserve', 'rye-harbour', 'england', 'sussex', 'professional-recording', 'zoom-h4n-pro', 'ken-halpin-hide', '2019', 'nature-documentation', 'rycote-windshield'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 3000,        // extended fade-in for nature reserve immersion
        customFadeOut: 4000,       // longer fade-out for peaceful ending
        hasNaturalFadeOut: false,
        loopable: true,            // 8+ minute duration excellent for extended sessions
        crossfadeCompatible: true,
        professionalQuality: true, // professional field recording equipment
        conservationArea: true     // recorded in protected nature reserve
      },
      geographicInfo: {
        location: 'North Section Ken Halpin Hide',
        reserve: 'Rye Harbour Nature Reserve',
        county: 'East Sussex',
        country: 'England',
        region: 'United Kingdom',
        environment: 'protected nature reserve',
        recordingDate: '2019-10-07',
        timeOfRecording: '16:27 (4:27 PM)'
      },
      recordingEquipment: {
        device: 'Zoom H4N Pro',
        windProtection: 'Rycote windshield',
        recordingQuality: 'professional field recording',
        recordingContext: 'nature reserve documentation'
      },
      environmentalElements: {
        naturalSounds: ['coastal reserve atmosphere', 'bird activity', 'natural soundscape'],
        protectedHabitat: 'established nature reserve',
        documentaryValue: 'conservation area audio documentation'
      },
      atmosphericQualities: ['peaceful', 'protected', 'natural', 'coastal', 'documentary'],
      specialFeatures: {
        firstUKNatureReserve: true,        // first protected reserve recording
        professionalEquipment: true,       // high-quality recording setup
        conservationDocumentation: true,   // documents protected habitat
        extendedDuration: true,            // 8+ minutes for immersive experience
        coastalHabitat: true               // unique coastal reserve environment
      }
    },
    natural_water_puddle_dommel: {
      url: 'https://freesound.org/apiv2/sounds/649392/download/',
      title: 'Natural Water Puddle - Oude Dommel Arm',
      license: 'CC BY 4.0',
      attribution: 'Natural water puddle 236PM 220618_0409.wav by klankbeeld -- https://freesound.org/s/649392/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 69.238, // seconds (1:09.238)
      tags: ['ambient', 'water', 'puddle', 'dommel', 'netherlands', 'holland', 'summer', 'birds', 'dragonflies', 'butterflies', 'wind', 'trees', 'nature-reserve', 'sennheiser', 'ms-recording', 'rycote', 'sound-devices'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2000,        // gentle fade-in for water ambience
        customFadeOut: 2500,       // natural fade-out for tranquil ending
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for water atmosphere loops
        crossfadeCompatible: true,
        professionalMSRecording: true, // Mid-Side stereo technique
        waterAmbience: true        // natural water soundscape
      },
      geographicInfo: {
        location: 'Oude Dommel arm, De Waaistap',
        city: 'Gemonde',
        province: 'Noord-Brabant',
        country: 'Netherlands (Holland)',
        continent: 'Europe',
        coordinates: 'GPS 51.61862, 5.34298',
        environment: 'tranquil nature reserve',
        waterBody: 'dead arm of small river Dommel',
        recordingDate: '2018-06-22',
        timeOfRecording: '2:36 PM'
      },
      recordingEquipment: {
        microphones: 'Sennheiser MKH30/50 MS',
        windProtection: 'Rycote Cyclone Small with windjammer',
        preamp: 'Sound Devices 302',
        recorder: 'Tascam DR-100 MkII',
        technique: 'Mid-Side recording decoded to stereo',
        recordingQuality: 'professional broadcast standard'
      },
      environmentalElements: {
        waterFeatures: ['natural water puddle', 'dead river arm', 'gentle water sounds'],
        wildlife: ['birds singing', 'dragonflies', 'butterflies'],
        naturalSounds: ['friendly wind in trees', 'summer atmosphere'],
        habitatType: 'protected wetland reserve'
      },
      weatherConditions: {
        season: 'summer',
        temperature: 'hot summer day',
        windCondition: 'friendly breeze',
        timeOfYear: 'June',
        atmosphericCondition: 'tranquil'
      },
      atmosphericQualities: ['tranquil', 'peaceful', 'summer', 'natural', 'professional'],
      specialFeatures: {
        firstNetherlandsSample: true,      // first Dutch recording in collection
        professionalMSRecording: true,     // Mid-Side stereo technique
        wetlandHabitat: true,              // unique wetland ecosystem
        summerAtmosphere: true,            // captures warm summer day
        wildlifeRich: true,                // documents dragonflies, butterflies, birds
        professionalGearChain: true,       // broadcast-quality recording equipment
        gpsDocumented: true                // precise location coordinates provided
      }
    },
    pond_soundscape_dreissbachtal: {
      url: 'https://freesound.org/apiv2/sounds/240342/download/',
      title: 'Pond Soundscape (Frogs and Birds) - Dreißbachtal',
      license: 'CC BY 4.0',
      attribution: 'Pond Soundscape (Frogs and Birds) by Porphyr -- https://freesound.org/s/240342/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 133.834, // seconds (2:13.834)
      tags: ['ambient', 'pond', 'frogs', 'croaking', 'birds', 'insects', 'summer', 'dreissbachtal', 'suhl', 'thuringia', 'germany', 'zoom-h6', 'wetland', 'valley'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2000,        // gentle fade-in for pond atmosphere
        customFadeOut: 2500,       // natural fade-out for wetland ambience
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for pond ecosystem loops
        crossfadeCompatible: true,
        frogChorus: true,          // prominent frog croaking sounds
        pondEcosystem: true        // complete wetland soundscape
      },
      geographicInfo: {
        location: 'Dreißbachtal (valley)',
        nearestCity: 'Suhl',
        region: 'Thuringia',
        country: 'Germany',
        continent: 'Europe',
        environment: 'valley pond ecosystem',
        recordingDate: '2014-06-09',
        dayOfWeek: 'Monday',
        timeOfRecording: 'daytime'
      },
      recordingEquipment: {
        device: 'Zoom H6',
        microphones: 'XY microphone (built-in)',
        postProcessing: 'Sound Forge Pro (slight editing)',
        recordingQuality: 'professional field recording'
      },
      environmentalElements: {
        primarySounds: ['croaking frogs (dominant feature)'],
        secondarySounds: ['various bird species', 'insect activity'],
        habitatType: 'pond ecosystem in valley',
        ecosystemType: 'temperate wetland'
      },
      weatherConditions: {
        season: 'summer',
        temperature: '32°C (characteristic summer day)',
        windCondition: 'not much wind',
        timeOfYear: 'June',
        atmosphericCondition: 'calm summer day'
      },
      atmosphericQualities: ['natural', 'peaceful', 'biodiverse', 'summer', 'wetland'],
      wildlifeDocumentation: {
        amphibians: ['croaking frogs (main characteristic)'],
        birds: ['various bird species'],
        insects: ['occasional insect sounds'],
        ecosystemActivity: 'active summer pond life'
      },
      specialFeatures: {
        frogChorusDominant: true,          // prominent amphibian soundscape
        companionToForestSample: true,     // same recordist as Thuringian Forest
        germanValleyEcosystem: true,       // documents valley pond habitat
        summerPondLife: true,              // captures active summer ecosystem
        temperateWetland: true,            // central European pond environment
        multiSpeciesRecording: true        // frogs, birds, and insects
      }
    },
    maasai_camp_kenya: {
      url: 'https://freesound.org/apiv2/sounds/504694/download/',
      title: 'Maasai Camp Nature Sounds Africa',
      license: 'CC0',
      attribution: 'selcukartut',
      attributionRequired: false,
      duration: 82.045, // seconds (1:22.045)
      tags: ['ambient', 'africa', 'kenya', 'maasai-mara', 'maasai-camp', 'savanna', 'nature-sounds', 'african-wildlife', 'cultural', 'traditional-camp'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2000,        // gentle fade-in for African atmosphere
        customFadeOut: 2500,       // natural fade-out for savanna ambience
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for African savanna loops
        crossfadeCompatible: true,
        africanSavanna: true,      // authentic African ecosystem
        culturalHeritage: true     // traditional Maasai camp setting
      },
      geographicInfo: {
        location: 'Maasai Camp',
        region: 'Maasai Mara',
        country: 'Kenya',
        continent: 'Africa',
        environment: 'African savanna grasslands',
        ecosystem: 'East African savanna',
        culturalContext: 'traditional Maasai pastoral area'
      },
      environmentalElements: {
        habitatType: 'African savanna camp setting',
        naturalSounds: ['African nature sounds', 'savanna atmosphere'],
        culturalElements: ['traditional Maasai camp environment'],
        ecosystemType: 'East African grasslands'
      },
      atmosphericQualities: ['authentic', 'cultural', 'natural', 'african', 'traditional'],
      culturalSignificance: {
        indigenousPeople: 'Maasai',
        traditionalLifestyle: 'pastoral nomadic culture',
        culturalLandscape: 'traditional camp in natural environment',
        heritageValue: 'documents indigenous relationship with land'
      },
      specialFeatures: {
        firstKenyaSample: true,            // first recording from Kenya
        firstMaasaiCulture: true,          // first Maasai cultural context
        africanSavannaEcosystem: true,     // East African grassland environment
        culturalNatureIntersection: true,  // traditional camp in natural setting
        indigenousHeritage: true,          // documents Maasai pastoral culture
        eastAfricanWildlife: true          // Maasai Mara nature sounds
      }
    },
    atmosphere_music_nature_movies: {
      url: 'https://freesound.org/apiv2/sounds/711018/download/',
      title: 'Atmosphere Music For Nature Movies',
      license: 'CC BY 4.0',
      attribution: 'Atmosphere Music For Nature Movies by Muyo5438 -- https://freesound.org/s/711018/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 83.214, // seconds (1:23.214)
      tags: ['ambient', 'atmospheric-music', 'nature-documentary', 'meditation', 'relaxation', 'serene', 'documentary', 'contemplative', 'composed-music'],
      category: 'atmospheric-music',
      fadeSettings: {
        customFadeIn: 3000,        // slow fade-in for meditation atmosphere
        customFadeOut: 4000,       // extended fade-out for contemplative ending
        hasNaturalFadeOut: false,
        loopable: true,            // designed for continuous atmospheric use
        crossfadeCompatible: true,
        meditativeQuality: true,   // suitable for meditation and relaxation
        documentaryScore: true     // composed for nature documentary use
      },
      musicalCharacteristics: {
        style: 'atmospheric ambient music',
        mood: 'serene and contemplative',
        purpose: 'nature documentaries, relaxation, meditation',
        tonalQuality: 'peaceful and reflective',
        instrumentalTexture: 'ambient soundscape'
      },
      usageContexts: {
        primaryUse: 'nature documentaries',
        secondaryUses: ['relaxation', 'meditation', 'contemplative projects'],
        atmosphericFunction: 'serene background atmosphere',
        emotionalImpact: 'calming and peaceful'
      },
      atmosphericQualities: ['serene', 'meditative', 'peaceful', 'contemplative', 'atmospheric'],
      specialFeatures: {
        firstComposedMusic: true,          // first composed atmospheric music (not field recording)
        documentaryQuality: true,          // specifically designed for nature documentaries
        meditationSuitable: true,          // appropriate for meditation and relaxation
        versatileAtmosphere: true,         // suitable for multiple contemplative contexts
        professionalComposition: true      // purpose-built atmospheric music
      }
    },
    countryside_cicadas_japan: {
      url: 'https://freesound.org/apiv2/sounds/482920/download/',
      title: 'Countryside Soundscape with Cicadas - Japan',
      license: 'CC0',
      attribution: 'fabiopx',
      attributionRequired: false,
      duration: 144.394, // seconds (2:24.394)
      tags: ['ambient', 'countryside', 'cicadas', 'japan', 'field-recording', 'rural', 'insects', 'vehicles', 'h4n', 'high-resolution', '24-96', 'asian'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2000,        // gentle fade-in for countryside atmosphere
        customFadeOut: 3000,       // natural fade-out for cicada chorus
        hasNaturalFadeOut: false,
        loopable: true,            // good duration for Japanese countryside loops
        crossfadeCompatible: true,
        cicadaChorus: true,        // prominent cicada soundscape
        ruralAtmosphere: true      // authentic countryside environment
      },
      geographicInfo: {
        country: 'Japan',
        continent: 'Asia',
        environment: 'countryside/rural area',
        ecosystem: 'Japanese rural landscape',
        culturalContext: 'traditional Japanese countryside'
      },
      recordingEquipment: {
        device: 'Zoom H4N',
        microphones: 'internal microphone',
        fileFormat: 'WAV',
        quality: '24-bit/96kHz (high resolution)',
        recordingQuality: 'professional field recording'
      },
      environmentalElements: {
        primarySounds: ['loud cicada chant (dominant feature)'],
        backgroundSounds: ['vehicle sounds in distance'],
        habitatType: 'Japanese rural countryside',
        ecosystemType: 'temperate Asian countryside'
      },
      soundscapeCharacteristics: {
        dominantFeature: 'cicada chorus',
        ambientLayer: 'rural countryside atmosphere',
        humanElements: 'distant vehicle sounds',
        naturalBalance: 'insects with subtle human presence'
      },
      atmosphericQualities: ['rural', 'natural', 'authentic', 'asian', 'countryside'],
      culturalGeography: {
        region: 'Japanese countryside',
        landscape: 'traditional rural environment',
        seasonalContext: 'cicada season (summer)',
        culturalLandscape: 'Japanese rural soundscape'
      },
      specialFeatures: {
        firstJapanSample: true,            // first recording from Japan
        firstAsianCountryside: true,       // first Asian rural environment
        highResolutionAudio: true,         // 24-bit/96kHz quality
        cicadaDominant: true,              // prominent insect soundscape
        japaneseRuralCulture: true,        // documents Japanese countryside
        seasonalDocumentation: true        // captures summer cicada season
      }
    },
    windy_autumn_forest_einemhofer: {
      url: 'https://freesound.org/apiv2/sounds/209339/download/',
      title: 'Windy Autumn Forest Soundscape 2 - Einemhofer Forst',
      license: 'CC BY 4.0',
      attribution: 'Windy Autumn Forest Soundscape 2 by Porphyr -- https://freesound.org/s/209339/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 180.856, // seconds (3:00.856)
      tags: ['ambient', 'autumn', 'forest', 'windy', 'einemhofer-forst', 'luneburg', 'lower-saxony', 'germany', 'oak-leaves', 'raindrops', 'wind', 'rustling', 'zoom-h6', 'cloudy-morning'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 2500,        // gentle fade-in for forest atmosphere
        customFadeOut: 3000,       // natural fade-out for windy forest
        hasNaturalFadeOut: false,
        loopable: true,            // 3-minute duration excellent for autumn loops
        crossfadeCompatible: true,
        autumnAtmosphere: true,    // captures seasonal autumn character
        windyForest: true          // prominent wind through trees
      },
      geographicInfo: {
        location: 'Einemhofer Forst (forest)',
        district: 'Lüneburg',
        state: 'Lower Saxony (Niedersachsen)',
        country: 'Germany',
        continent: 'Europe',
        environment: 'temperate deciduous forest',
        recordingDate: '2013-12-01',
        dayOfWeek: 'Sunday',
        timeOfRecording: 'morning'
      },
      recordingEquipment: {
        device: 'Zoom H6',
        microphones: 'XY microphone (built-in)',
        postProcessing: 'Sound Forge Pro (editing)',
        recordingQuality: 'professional field recording'
      },
      environmentalElements: {
        primarySounds: ['wind through forest', 'rustling leaves'],
        secondarySounds: ['raindrops hitting leaves', 'young oak tree sounds'],
        forestType: 'temperate deciduous forest',
        treeSpecies: 'oak (Quercus species) mentioned specifically'
      },
      weatherConditions: {
        season: 'autumn (late autumn - December 1st)',
        skyCondition: 'cloudy',
        windCondition: 'windy (characteristic feature)',
        precipitation: 'light rain (subtle raindrops)',
        timeOfDay: 'morning',
        atmosphericCondition: 'characteristic cloudy and windy autumn morning'
      },
      seasonalCharacteristics: {
        autumnFeatures: ['rustling dry leaves', 'late autumn atmosphere'],
        leafCondition: 'autumn leaves on trees and ground',
        seasonalTransition: 'early winter approach (December)',
        weatherPattern: 'typical autumn storm weather'
      },
      atmosphericQualities: ['atmospheric', 'seasonal', 'natural', 'windy', 'autumnal'],
      specialFeatures: {
        thirdPorphyrSample: true,          // third recording from same trusted recordist
        autumnSeasonal: true,              // first autumn-specific recording
        windDominant: true,                // prominent wind soundscape
        germanForestCollection: true,      // adds to German forest documentation
        lateAutumnCapture: true,           // captures late autumn/early winter transition
        oakTreeSpecific: true,             // specifically mentions oak tree sounds
        rainyWeatherElements: true         // includes subtle rain sounds
      }
    },
    timeless_ambient_pad_progression: {
      url: 'https://freesound.org/apiv2/sounds/807232/download/',
      title: 'Timeless Ambient Pad Progression 110bpm',
      license: 'CC0',
      attribution: 'CVLTIV8R',
      attributionRequired: false,
      duration: 64.909, // seconds (1:04.909)
      tags: ['ambient', 'pad-progression', 'synthesizers', 'chord-progression', '110bpm', 'spacey', 'washy', 'chill', 'electronic', 'composed-music'],
      category: 'atmospheric-music',
      fadeSettings: {
        customFadeIn: 2000,        // smooth fade-in for pad progression
        customFadeOut: 3000,       // extended fade-out for ambient ending
        hasNaturalFadeOut: false,
        loopable: true,            // designed for continuous ambient use
        crossfadeCompatible: true,
        ambientPadQuality: true,   // specifically designed as ambient pad
        tempoSynced: true          // 110bpm for rhythm synchronization
      },
      musicalCharacteristics: {
        tempo: '110 BPM',
        style: 'ambient pad progression',
        harmonic: 'chord progression',
        timbre: 'chill, spacey, washy',
        synthesis: 'various synthesizers',
        mood: 'timeless and ethereal'
      },
      technicalSpecs: {
        instruments: 'various synthesizers',
        musicTheory: 'chord progression',
        rhythmicStructure: '110 BPM tempo base',
        soundDesign: 'spacey and washy textures',
        productionStyle: 'ambient electronic music'
      },
      usageContexts: {
        primaryUse: 'ambient background pad',
        continuousLayer: 'perfect for continuous ambient layers',
        rhythmSync: 'tempo-synced for percussion integration',
        atmosphericFunction: 'ethereal harmonic foundation'
      },
      atmosphericQualities: ['chill', 'spacey', 'washy', 'timeless', 'ethereal'],
      specialFeatures: {
        perfectForContinuousLayers: true,  // ideal for planned continuous layer system
        tempoSpecified: true,              // 110bpm enables rhythm synchronization
        synthesizedPads: true,             // complements synthesized instrument approach
        chordProgression: true,            // provides harmonic structure
        spaceyAtmosphere: true,            // sci-fi/space aesthetic compatibility
        professionalSynthesis: true        // purpose-built synthesizer composition
      }
    },
    microfreak_pad_19: {
      url: 'https://freesound.org/apiv2/sounds/528399/download/',
      title: 'Microfreak Pad 19',
      license: 'CC0',
      attribution: 'deleted_user_6725533',
      attributionRequired: false,
      duration: 9.599, // seconds (0:09.599)
      tags: ['ambient', 'pad', 'microfreak', 'arturia', 'synthesizer', 'electronic', 'short-texture', 'wavetable', 'analog-modeling'],
      category: 'atmospheric-music',
      fadeSettings: {
        customFadeIn: 1000,        // quick fade-in for short pad
        customFadeOut: 1500,       // gentle fade-out for pad texture
        hasNaturalFadeOut: true,   // likely has natural decay
        loopable: true,            // short duration excellent for rapid cycling
        crossfadeCompatible: true,
        shortTexture: true,        // brief ambient texture
        synthPad: true             // pure synthesizer pad sound
      },
      synthesizer: {
        brand: 'Arturia',
        model: 'MicroFreak',
        type: 'wavetable/analog modeling hybrid',
        category: 'modern digital synthesizer',
        soundEngine: 'wavetable oscillator + analog filter'
      },
      technicalSpecs: {
        patchType: 'pad sound (preset #19)',
        synthesis: 'wavetable/analog modeling',
        textureType: 'ambient pad',
        duration: 'short texture (under 10 seconds)',
        usage: 'building block for layered compositions'
      },
      usageContexts: {
        primaryUse: 'short ambient texture',
        layering: 'building block for complex ambient compositions',
        rapidCycling: 'excellent for quick atmospheric changes',
        textureLayer: 'adds synthesized texture to natural soundscapes'
      },
      atmosphericQualities: ['electronic', 'synthesized', 'textural', 'brief', 'modern'],
      specialFeatures: {
        shortestSynthPad: true,            // shortest synthesized pad in collection
        modernSynthesizer: true,           // contemporary digital synthesizer
        wavetableSynthesis: true,          // modern wavetable technology
        rapidTextureChange: true,          // ideal for quick atmospheric shifts
        layeringBuilding: true,            // perfect for building complex ambient layers
        arturia Hardware: true             // professional synthesizer hardware
      }
    },
    broken_transmission_pads: {
      url: 'https://freesound.org/apiv2/sounds/215933/download/',
      title: 'Broken Transmission Pads',
      license: 'CC0',
      attribution: 'SpankMyFilth',
      attributionRequired: false,
      duration: 8.602, // seconds (0:08.602)
      tags: ['ambient', 'broken-transmission', 'alien', 'sci-fi', 'absynth', 'modulated', 'garbled', 'experimental', 'c2-note', 'vocal-textures', 'atmospheric'],
      category: 'atmospheric-music',
      fadeSettings: {
        customFadeIn: 1000,        // quick fade-in for experimental texture
        customFadeOut: 1500,       // gentle fade-out for alien atmosphere
        hasNaturalFadeOut: true,   // likely has natural decay
        loopable: true,            // short duration excellent for cycling
        crossfadeCompatible: true,
        alienAtmosphere: true,     // extraterrestrial/sci-fi character
        experimentalTexture: true   // unconventional sound design
      },
      musicalCharacteristics: {
        rootNote: 'C2',
        style: 'experimental ambient pad',
        texture: 'broken transmission/alien communication',
        modulation: 'random gabbled modulated sounds',
        vocalElements: 'processed vocal textures for alien effect'
      },
      productionSpecs: {
        primarySynthesis: 'Native Instruments Absynth 5',
        daw: 'Ableton Live',
        compression: 'PSP Compressor2',
        warmth: 'PSP Warmer',
        processing: 'effects and compression',
        concept: 'garbled transmission/alien communication'
      },
      soundDesign: {
        concept: 'broken/garbled transmission',
        alienCharacter: 'extraterrestrial communication attempt',
        vocalProcessing: 'heavily processed vocal elements',
        randomModulation: 'chaotic modulated textures',
        sciFiAesthetic: 'futuristic/space communication theme'
      },
      usageContexts: {
        primaryUse: 'alien/sci-fi atmospheric texture',
        experimentalLayer: 'unconventional ambient element',
        transmissionEffect: 'broken communication simulation',
        alienPresence: 'extraterrestrial atmosphere'
      },
      atmosphericQualities: ['alien', 'experimental', 'broken', 'modulated', 'sci-fi'],
      specialFeatures: {
        alienTransmission: true,           // unique extraterrestrial concept
        experimentalSoundDesign: true,     // unconventional approach
        vocalProcessing: true,             // processed vocal elements
        musicallyTuned: true,              // specific note (C2) for harmonic integration
        sciFiAtmosphere: true,             // perfect for space/alien themes
        shortExperimentalTexture: true     // brief but impactful sound design
      }
    },
    southern_cricket_frog_marathon: {
      url: 'https://freesound.org/apiv2/sounds/685552/download/',
      title: 'Southern Cricket Frog April 2023 SMNWR',
      license: 'CC BY-NC 4.0',
      attribution: 'Southern Cricket Frog April 2023 SMNWR by KevinSonger -- https://freesound.org/s/685552/ -- License: Attribution NonCommercial 4.0',
      attributionRequired: true,
      duration: 7142.199, // seconds (119:02.199 - nearly 2 hours!)
      tags: ['ambient', 'nature', 'frog', 'cricket-frog', 'acrus-gryllus', 'pond', 'freshwater', 'florida', 'field-recording', 'marathon', 'epic-duration'],
      category: 'nature-sounds',
      fadeSettings: {
        customFadeIn: 5000,        // extended fade-in for epic recording
        customFadeOut: 6000,       // very long fade-out for natural ending
        hasNaturalFadeOut: false,
        loopable: true,            // 2-hour duration perfect for endless ambience
        crossfadeCompatible: true,
        epicDuration: true,        // longest recording in entire collection
        professionalFieldRecording: true // Sony PCM D10 quality
      },
      geographicInfo: {
        location: 'St. Marks National Wildlife Refuge (SMNWR)',
        city: 'Crawfordville',
        state: 'Florida',
        country: 'United States',
        ecosystem: 'shallow freshwater pond',
        recordingDate: 'April 2023'
      },
      recordingEquipment: {
        recorder: 'Sony PCM D10',
        microphones: 'stereo plug-in microphones',
        protection: 'windscreens and drybags',
        recordingQuality: 'professional field recording'
      },
      biologicalInfo: {
        species: 'Southern Cricket Frog',
        scientificName: 'Acrus gryllus',
        behavior: 'advertisement calls',
        habitat: 'shallow freshwater pond'
      },
      specialFeatures: {
        longestRecording: true,     // 119 minutes - longest in entire collection
        marathonDuration: true,     // nearly 2 hours of continuous recording
        speciesSpecific: true,      // focused on single species calls
        wildlifeRefuge: true,       // recorded in protected habitat
        professionalEquipment: true, // high-end recording gear
        recentRecording: true       // April 2023
      }
    },
    ambient_float_atmosphere: {
      url: 'https://freesound.org/apiv2/sounds/720339/download/',
      title: 'Ambient 20_Float',
      license: 'CC BY 4.0',
      attribution: 'Ambient 20_Float by PodcastAC -- https://freesound.org/s/720339/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 152.332, // seconds (2:32.332)
      tags: ['ambient', 'float', 'atmospheric', 'drifting', 'ethereal', 'background'],
      category: 'atmospheric-music',
      fadeSettings: {
        customFadeIn: 3000,        // slow fade-in for floating entry
        customFadeOut: 3500,       // extended fade-out for smooth exit
        hasNaturalFadeOut: false,
        loopable: true,            // 2.5 minute duration good for looping
        crossfadeCompatible: true,
        floatingQuality: true,     // drifting atmospheric character
        ambientDesign: true        // purpose-built ambient texture
      },
      atmosphericQualities: ['floating', 'drifting', 'ethereal', 'spacious', 'ambient'],
      specialFeatures: {
        explicitlyAmbient: true,   // "Ambient" in title
        floatingTexture: true,     // "Float" suggests drifting quality
        mediumDuration: true       // 2.5 minutes good for continuous use
      }
    }
  },
  
  // Percussion samples for rhythmic layers
  percussion: {
    shaman_hand_frame_drum: {
      url: 'https://freesound.org/apiv2/sounds/257157/download/',
      title: 'Shaman Hand Frame Drum 03_02',
      license: 'CC BY 4.0',
      attribution: 'Shaman Hand Frame Drum 03_02 by Jagadamba -- https://freesound.org/s/257157/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 4.971, // seconds
      tags: ['percussion', 'drum', 'frame-drum', 'shaman', 'hand-drum', 'tribal', 'ethnic'],
      category: 'percussion',
      fadeSettings: {
        customFadeIn: 50,           // quick attack for percussion
        customFadeOut: 100,         // short fade for rhythmic precision
        hasNaturalFadeOut: false,
        loopable: false,            // one-shot percussion hit
        crossfadeCompatible: false,
        percussiveAttack: true
      },
      percussionInfo: {
        instrumentType: 'frame drum',
        playingStyle: 'hand',
        tonalQualities: ['warm', 'resonant', 'organic'],
        rhythmicUse: 'accent beats, tribal patterns'
      }
    },
    shaman_frame_drum_long: {
      url: 'https://freesound.org/apiv2/sounds/387716/download/',
      title: 'Shaman Frame Drum',
      license: 'CC BY 4.0',
      attribution: 'Shaman Frame Drum by Jagadamba -- https://freesound.org/s/387716/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 11.839, // seconds
      tags: ['percussion', 'drum', 'frame-drum', 'shaman', 'rhythm', 'tribal', 'ethnic', 'pattern'],
      category: 'percussion',
      fadeSettings: {
        customFadeIn: 100,          // slightly longer for pattern
        customFadeOut: 500,         // fade out the pattern
        hasNaturalFadeOut: true,
        loopable: true,             // rhythmic pattern can loop
        crossfadeCompatible: true,
        rhythmicPattern: true
      },
      percussionInfo: {
        instrumentType: 'frame drum',
        playingStyle: 'hand pattern',
        tonalQualities: ['warm', 'hypnotic', 'meditative'],
        rhythmicUse: 'continuous rhythm, ceremonial patterns'
      }
    },
    shamans_drum_resonant: {
      url: 'https://freesound.org/apiv2/sounds/321131/download/',
      title: "Shaman's drum - resonant",
      license: 'CC BY-NC 3.0',
      attribution: "Shaman's drum - resonant by meisterjaan -- https://freesound.org/s/321131/ -- License: Attribution NonCommercial 3.0",
      attributionRequired: true,
      duration: 3.500, // seconds
      tags: ['percussion', 'drum', 'shaman', 'resonant', 'deep', 'tribal', 'ceremonial'],
      category: 'percussion',
      fadeSettings: {
        customFadeIn: 50,           // quick attack
        customFadeOut: 200,         // let resonance decay
        hasNaturalFadeOut: true,    // natural resonance
        loopable: false,            // one-shot
        crossfadeCompatible: false,
        resonantDecay: true
      },
      percussionInfo: {
        instrumentType: 'ceremonial drum',
        playingStyle: 'single hit',
        tonalQualities: ['deep', 'resonant', 'powerful'],
        rhythmicUse: 'accent hits, ceremonial beats'
      }
    },
    buben_tambourine: {
      url: 'https://freesound.org/apiv2/sounds/419772/download/',
      title: 'Buben3.wav',
      license: 'CC0',
      attribution: 'Buben3.wav by deleted_user_5215506 -- https://freesound.org/s/419772/ -- License: Creative Commons 0',
      attributionRequired: false, // CC0 = public domain
      duration: 0.420, // seconds
      tags: ['percussion', 'tambourine', 'buben', 'jingles', 'shake', 'bright', 'metallic'],
      category: 'percussion',
      fadeSettings: {
        customFadeIn: 10,           // very quick attack
        customFadeOut: 50,          // short decay
        hasNaturalFadeOut: false,
        loopable: false,            // very short one-shot
        crossfadeCompatible: false,
        brightAccent: true
      },
      percussionInfo: {
        instrumentType: 'tambourine/buben',
        playingStyle: 'shake/hit',
        tonalQualities: ['bright', 'metallic', 'jingling'],
        rhythmicUse: 'hi-hat substitute, accent decoration'
      }
    }
  },
  'minimal': {
    drippy_faucet: {
      url: 'https://freesound.org/apiv2/sounds/343797/download/',
      title: 'Drippy Faucet',
      license: 'CC0',
      attribution: 'zmadyun',
      attributionRequired: false,
      duration: 8.173, // seconds (0:08.173)
      tags: ['minimal', 'sparse', 'water', 'drip', 'faucet', 'rhythmic', 'meditative', 'percussive', 'repetitive'],
      category: 'sparse-elements'
    }
    // Additional minimal samples to be added...
  },
  'electronic': {
    phaedra_tangerine_dream: {
      url: 'https://freesound.org/apiv2/sounds/60/download/',
      title: 'Phaedra (Tangerine Dream Inspired)',
      license: 'CC BY 4.0',
      attribution: 'phaedra.wav by fectoper -- https://freesound.org/s/60/ -- License: Attribution 4.0',
      attributionRequired: true,
      duration: 18.495, // seconds (0:18.495)
      tags: ['electronic', 'pad', 'tangerine-dream', 'phaedra', 'berlin-school', '1970s', 'vintage', 'sequencer', 'atmospheric'],
      category: 'synthesized-pads'
    }
    // Additional electronic samples to be added...
  }
  // Additional genres...
};
```

### License Types Reference
- **CC0**: Public domain, no attribution required
- **CC BY**: Attribution required
- **CC BY-SA**: Attribution + Share Alike
- **CC BY-NC**: Attribution + Non-Commercial

---

## Contribution Guidelines

When adding new entries:

1. **Verify License:** Check the sound's license on Freesound.org
2. **Test Download:** Confirm the API download URL works
3. **Quality Check:** Ensure audio quality is suitable for continuous playback
4. **Duration Check:** Note if suitable for looping or one-shot use
5. **Tag Appropriately:** Add relevant genre and usage tags

---

## Implementation Integration

This audio library is designed to integrate with the continuous ambient layers system described in [Section 4.1](../sonic-graph-audio-enhancement-specification.md#41-continuous-ambientbackground-layers) and [Section 6](../sonic-graph-audio-enhancement-specification.md#6-audio-sample-library-integration) of the main specification. Implementation details are covered in [Phase 2.1](sonic-graph-audio-enhancement-implementation-plan.md#phase-21-continuous-background-layer-system) of the implementation plan. Key integration points include:

- **Thematic Presets:** Samples support [preset themes](sonic-graph-audio-enhancement-implementation-plan.md#default-theme-presets) including "Drone Meditation," "Space Station," and "Ocean Depths"
- **Genre Selection:** UI dropdown maps to organized genre sections (Drone, Sci-Fi, Oceanic, etc.) as detailed in [Phase 6.1](sonic-graph-audio-enhancement-implementation-plan.md#phase-61-advanced-audio-settings-panel)
- **License Compliance:** Automatic attribution display for CC BY samples via [FreesoundSampleLoader](sonic-graph-audio-enhancement-implementation-plan.md#files-to-create)
- **Duration Optimization:** Range from 10-second effects to 10+ minute atmospheric layers for seamless looping
- **Musical Key Support:** Tonal samples like "Modulated Drone (Key of G)" for harmonic integration with [Musical Theory Engine](sonic-graph-audio-enhancement-implementation-plan.md#phase-51-musical-theory-integration)

## API Integration and Authentication Findings

### Freesound API v2 Authentication Requirements

Through implementation testing, we've discovered important constraints regarding Freesound API authentication:

#### Token Authentication (API Key)
- **Scope**: Limited to metadata retrieval and preview URLs
- **Cannot**: Download full original audio files
- **Can**: Access sound information, preview URLs, and metadata
- **Implementation**: Simple - just append `?token=API_KEY` to API endpoints

#### OAuth2 Authentication
- **Required for**: Downloading full original audio files via `/download/` endpoint
- **Documentation**: https://freesound.org/docs/api/resources_apiv2.html#download-sound-oauth2-required
- **Flow**: Full OAuth2 authorization code flow with redirect
- **Complexity**: Requires external browser interaction and callback handling

#### Current Implementation Strategy
1. **Using Preview URLs**: We're leveraging the preview URLs (preview-hq-mp3, preview-lq-mp3) which don't require any authentication
2. **Fallback Quality**: Preview files are typically lower quality than originals but sufficient for ambient backgrounds
3. **Future Enhancement**: OAuth2 support could be added for users who need full-quality downloads

#### Preview URL Formats Available
- `preview-hq-mp3`: High quality MP3 preview (usually 128kbps)
- `preview-lq-mp3`: Low quality MP3 preview (usually 64kbps)  
- `preview-hq-ogg`: High quality OGG preview
- `preview-lq-ogg`: Low quality OGG preview

These preview URLs are:
- Publicly accessible (no authentication required)
- Direct download links
- Suitable for streaming and caching
- Generally good enough quality for ambient/background use

## Notes

- All entries should be verified for licensing compatibility
- Priority on CC0 (public domain) sounds when possible
- Consider loop-ability for continuous layer usage
- Aim for high audio quality (preferably 44.1kHz+)
- Document any specific usage recommendations
- Samples complement synthesized instruments from the existing AudioEngine
- When implementing downloads, use preview URLs to avoid OAuth2 complexity

---

*Please share additional Freesound.org links and I'll add them to the appropriate genre sections with proper metadata.*
