## Sonic Graph Audio Enhancement Specification

**Document Version:** 1.1
**Date:** July 4, 2025
**Author:** John Banister

---

### 1. Introduction

This document outlines proposed enhancements to the Sonic Graph feature's audio generation, aiming to move beyond simple one-to-one note-to-file mappings. The goal is to create a richer, more continuous, and semantically meaningful soundscape that dynamically reflects the evolution and structure of the Obsidian vault. This will address current challenges such as sparse audio content during inactive periods and potential musical clashes during periods of high vault activity.

### 2. Goals

* **Enhance Musicality:** Improve the overall aesthetic and musical quality of the Sonic Graph's audio output.
* **Reduce Sparseness & Clutter:** Introduce continuous ambient layers to provide consistent sound, and refine event handling to prevent sonic overload.
* **Increase Semantic Meaning:** Establish stronger and more nuanced auditory correlations with vault content types, relationships, and structural elements.
* **Improve User Experience:** Provide more diverse and engaging auditory feedback, allowing for deeper immersion and insight into vault growth.
* **Leverage Existing Architecture:** Integrate new features seamlessly with existing `AudioEngine` and `Sonic Graph System` components.
* **Expose User Options with Sensible Defaults:** Ensure that new audio features are configurable by the user, with some beneficial options enabled by default to showcase capabilities and provide a good out-of-the-box experience.

### 3. Scope

This specification covers new musical mapping rules, instrument assignment logic, and dynamic parameter modulation within the `musical-mapper.ts` component, integrating with `GraphDataExtractor.ts`, `TemporalGraphAnimator.ts`, `ContentAwarePositioning.ts`, `SmartClusteringAlgorithms.ts`, and the core `AudioEngine`. It also includes considerations for UI exposure of new settings.

### 4. Detailed Features

#### 4.1 Continuous Ambient/Background Layers

**Description:** Introduce one or more continuously playing instruments or sound textures that evolve with the overall state or timeline of the vault, rather than only triggering on discrete events. This provides a constant aural "glue" for the soundscape.

**Justification:** The vault, as a whole, always "exists" and grows. Continuous sound layers can represent this underlying presence, overall activity level, or historical progression.

**Proposed Mappings:**

* **Vault Size/Density:** The total number of nodes in the graph at the current animation timestamp (derived from `GraphDataExtractor` and `TemporalGraphAnimator`) can control:
    * **Volume/Density:** A low-volume pad or drone whose volume increases with more active nodes.
    * **Filter Cutoff/Brightness:** A brighter sound for denser graphs.
    * **LFO Speed:** Modulating a parameter more rapidly as graph density increases.
* **Vault "Age" / Animation Progression:** The current progress (`TemporalGraphAnimator` progress tracking) through the vault's history can drive:
    * **Pitch/Key/Mode Shifts:** Slow evolution of the musical key or mode of a pad.
    * **Timbre Evolution:** Gradual morphing of instrument timbre (e.g., from clean to distorted, or acoustic to electronic) over the full timeline duration.
* **Overall Activity Level:** A rolling average of `nodeAppearance` events from `TemporalGraphAnimator` over a short time window can modulate:
    * **Arpeggiator Speed:** Faster arpeggios for periods of high event frequency.
    * **Rhythmic Density:** Control of subtle background percussion patterns.

**Instruments:** Utilize existing `Electronic` (Pad, Lead Synth, Bass Synth, Arp Synth) or `Brass` instruments from the `AudioEngine`, or experiment with `Vocal Pads`.

**User Exposure:**
* **Toggle:** Enable/disable continuous ambient layers (e.g., "Enable Ambient Drone").
* **Default:** Recommend enabling a subtle ambient layer by default to enrich the soundscape.
* **Controls:** Sliders or dropdowns for adjusting parameters like base volume, initial pitch, and mapping intensity to vault metrics.

#### 4.2 Enhanced Content-Aware Instrument & Property Mapping

Expand the `musical-mapper.ts` to utilize more granular data from `GraphNode` metadata and `GraphDataExtractor` insights, moving beyond simple `fileTypePreferences`.

**Proposed Mappings:**

* **File Type Preferences (Deepened):**
    * **Images (`.png`, `.jpg`):** Beyond current preferences, explore `Harp`, `Xylophone` (for sharp, clear images), or ethereal `Electronic Pads`.
    * **Audio/Video Attachments (`.mp3`, `.mp4`, `.wav`):** Use `Percussion` elements (Timpani, Xylophone, Vibraphone, Gongs) or a short, impactful `Electronic` sound.
* **Frontmatter Tags & Properties (`metadata.tags`):**
    * **Specific Tags:**
        * `#idea`, `#insight`: Bright, clear instruments (e.g., `Celesta`, `Flute`, `Lead Synth`).
        * `#project`, `#task`: More structured, perhaps percussive or rhythmic instruments (e.g., `Electric Piano`, `Vibraphone`).
        * `#journal`, `#daily`: Softer, reflective instruments (e.g., `Harp`, `Vocal Pads`, `Acoustic Piano`).
    * **Number of Tags:** A higher count of tags on a note could influence:
        * **Velocity:** Louder or more intense sound.
        * **Chord Complexity:** Trigger a more complex chord instead of a single note.
        * **Timbre Density:** Use a richer patch for the assigned instrument.
* **Folder Hierarchy/Path (`file.path`):**
    * Map entire folders or parts of the path to specific instrument families or themes. E.g., notes in `/Projects/` -> `Brass`, `/Journal/` -> `Vocals`, `/Research/` -> `Electronic`.
    * Depth of folder nesting could influence pitch (deeper = lower pitch).
* **File Size (`fileSize`):**
    * Already used for duration. Can also modulate:
        * **Pitch:** Larger file size = lower base pitch for the note.
        * **Timbre:** Use a "heavier" or "fuller" instrument/patch.
* **Connections (`connections.length` / Hub Centrality):**
    * `connections.length` already affects `velocity`.
    * **Hub Centrality (from `ContentAwarePositioning`):** Highly connected "hub" nodes could trigger unique, more prominent sounds. This could be a dedicated percussive hit, a specific motif, or a dynamic increase in volume/brightness for its assigned instrument.
    * **Link Type:** Differentiate between `Wikilinks` (`[[link]]`), `Markdown Links` (`[text](path)`), `Embeds` (`![[embed]]`), and `Tag Connections` (`#tag`).
        * **Wikilinks:** "Strings for strings" (Violin, Cello, Guitar, Harp) to represent connections. A new link could trigger a string pluck or short swell.
        * **Embeds:** More abrupt or percussive sounds (e.g., `MetalSynth`, `MembraneSynth`) since they bring in external content.
        * **Tag Connections:** Perhaps a subtle `Woodwind` or `Celesta` sound, distinct from direct links.
* **Smart Clustering (`SmartClusteringAlgorithms.ts`):**
    * **Cluster Type (`tag-based`, `temporal`, `link-dense`, `community`):**
        * Assign a unique sonic "flavor" to nodes within different cluster types.
        * `Tag-based clusters`: Harmonious chords or arpeggios.
        * `Temporal clusters`: Emphasize rhythmic patterns.
        * `Link-dense clusters`: Dense, rich, or complex sounds.
    * **Cluster Strength:** A more cohesive cluster could result in a louder or more harmonically rich sound when one of its nodes appears.
    * **Cluster Transition Events:** When a node *joins* or *leaves* a significant cluster during the animation, trigger a subtle musical transition (e.g., a short glissando or a filter sweep).

**User Exposure:**
* **Pre-defined Mappings:** Offer a few default mapping presets (e.g., "Default," "Rhythmic," "Ambient").
* **Customization Options:** Allow users to define their own rules for mapping content characteristics (file type, tags, folder, link type) to instrument types or specific instruments.
* **Default:** The "Default" mapping could include "Strings for strings" and perhaps different instrument families for common file types (notes, images) to provide immediate variety.

#### 4.3 Advanced Musicality & Orchestration

* **Rhythmic Layers & Tempo Mapping:**
    * **Overall Vault Activity Rate:** The frequency of new file/folder creations (determined by `TemporalGraphAnimator`) can control the tempo of a continuous percussion track or a background arpeggiator.
    * **Density Thresholds:** If a burst of (e.g., 5+) files appear within a very short simulated time (as identified by `Intelligent Spacing`), trigger a single, more musically complex event (a full chord, a drum fill, a short motif) rather than rapid individual notes.
* **Pitch Mapping Strategies:**
    * **Lexical Mapping:** The first letter of a note's title (or a hash of the content) can deterministically map to a specific pitch within a chosen scale, ensuring a consistent pitch for a given file name.
    * **Folder Depth:** Deeper nested files get lower pitches, shallower files get higher pitches.
    * **Musical Scales & Modes:** Constrain all generated pitches to specific musical scales (e.g., C Major, A Minor, Pentatonic) or even shift modes based on global vault properties (e.g., vault complexity, creation frequency).
* **Dynamic Orchestration & Themes:**
    * **Time of Day/Real-World Season (from `creationDate`):** Influence the *overall* instrument palette. E.g., morning creations = brighter instruments (flutes, bells); evening creations = darker synths, low brass.
    * **Vault Complexity Thresholds:** As the total number of nodes/links crosses predefined thresholds, introduce entirely new musical layers or sections (e.g., `after 1000 nodes, add a bass line` using a `Bass Synth`).
    * **Adaptive Quality System Integration:** Potentially link instrument complexity/polyphony to the `QualityLevel` (`high`, `medium`, `low`) settings to ensure performance.
* **Spatialization (Panning):**
    * If a custom D3.js visual graph is rendered by Sonigraph, map a node's X-position on the graph to its assigned sound's stereo pan (`PanVol` component in `AudioEngine`).
    * Alternatively, notes from specific high-level folders could be panned left/right.

**User Exposure:**
* **Musical Scale/Mode Selection:** Dropdown for choosing the musical scale/mode.
* **Tempo Modulation Toggle:** Enable/disable mapping vault activity to tempo.
* **Thematic Presets:** Offer pre-configured "musical themes" (e.g., "Orchestral Journey," "Ambient Flow," "Percussive Drive") that combine various settings for instrument mappings, continuous layers, and rhythmic elements. One or two themes could be active by default, providing a rich starting experience.

### 5. Technical Implementation Details

* **`musical-mapper.ts` (Core Logic):**
    * This class will be significantly expanded to house all the new mapping rules.
    * It will need to receive comprehensive `GraphNode` objects (including `metadata.tags`, `connections`, `fileSize`), and potentially overall graph context (e.g., `totalNodes`, `maxNodes`, `clusterAssignments`, `currentAnimationProgress`).
    * The `createMusicalMappingForNode` function will become more sophisticated, incorporating multiple factors to determine `pitch`, `duration`, `velocity`, and `instrument`.
* **`GraphDataExtractor.ts`:**
    * Ensure all necessary metadata (file types, `fileSize`, `connections`, `metadata.tags`) is reliably extracted and included in the `GraphNode` objects.
    * If `ContentAwarePositioning` or `SmartClusteringAlgorithms` generate additional properties for nodes (e.g., `centralityScore`, `clusterId`), these should be passed to the `musical-mapper`.
* **`TemporalGraphAnimator.ts`:**
    * The `onNodeAppeared` callback will provide the `GraphNode` to the `musical-mapper`.
    * It can provide the `currentAnimationTime` or `progress` to influence continuous background layers.
    * Its "Intelligent Spacing" and "Batch Processing" will be crucial to control when individual notes are triggered versus when a batched musical event should occur.
* **`AudioEngine.ts`:**
    * The `playNoteImmediate()` method is suitable for direct, real-time triggering of individual notes based on `musical-mapper`'s output.
    * For continuous layers, new `Tone.js` instruments will be instantiated and their parameters continuously modulated by the `AudioEngine` or directly within the `SonicGraphModal`'s update loop.
    * Utilize existing effects (Reverb, Chorus, Filter) and master bus effects for sound design of these layers and individual notes.
* **UI/Settings Integration (`src/ui/settings.ts`, `SonicGraphModal.ts`):**
    * Expand the "Comprehensive Settings Enhancement System" to expose new controls for these mappings.
    * **Mapping Rules UI:** A section where users can define rules (e.g., "If Tag = #idea, Instrument = Flute"). This could be a list of configurable conditions and assigned instruments/musical properties.
    * **Continuous Layer Controls:** Toggles and sliders for activating ambient layers and controlling their base parameters.
    * **Musical Theme Presets:** Allow users to select pre-defined musical themes (e.g., "Orchestral," "Ambient," "Percussive") that apply a set of these mapping rules and continuous layer configurations.

### 6. Future Considerations

* **User-Defined Scales/Modes:** Allow users to select the musical scale or key the Sonic Graph operates within.
* **MIDI Export:** Export the generated musical sequence as a MIDI file, allowing users to import it into a DAW.
* **Semantic Content Analysis (Deeper):** Integration with more advanced text analysis (beyond just tags/keywords) to infer mood or topic and influence musical parameters accordingly.
* **External Data Sources:** Allow mapping of external data (e.g., task management, calendar events) that are linked to notes, to influence the graph and music.