# Sonigraph User Guide

**Transform your knowledge graph into immersive orchestral soundscapes.**

This comprehensive guide will help you master all of Sonigraph's features, from basic playback to advanced musical customization.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Control Center](#control-center)
3. [Sonic Graph Visualization](#sonic-graph-visualization)
4. [Continuous Audio Layers](#continuous-audio-layers)
5. [Freesound Integration](#freesound-integration)
6. [Content-Aware Mapping](#content-aware-mapping)
7. [Audio Export](#audio-export)
8. [Advanced Features](#advanced-features)
9. [Performance & Optimization](#performance--optimization)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

1. Open Obsidian and go to **Settings → Community Plugins**
2. Disable **Safe Mode** if needed
3. Click **Browse** and search for "Sonigraph"
4. Click **Install** and then **Enable**
5. A music note icon (🎵) will appear in your left sidebar

### First Playback

1. **Open Control Center**: Click the music note icon in the left sidebar
2. **Open a note**: Any note in your vault
3. **Click Play**: Press the ▶ button in the Control Center
4. **Listen**: Sonigraph will analyze your note's connections and generate music

**What you'll hear:**
- Connected notes trigger instrument voices
- The number of connections influences musical intensity
- Note relationships create harmonic progressions
- Your graph structure becomes an orchestral composition

### Basic Concepts

**Sonification**: The process of converting data (your knowledge graph) into sound

**Instruments**: Sonigraph features 34 orchestral instruments organized by family:
- Strings (violin, cello, harp)
- Woodwinds (flute, oboe, clarinet)
- Brass (trumpet, trombone, french horn)
- Percussion (timpani, xylophone, marimba)
- Vocals (choir, voice)
- Electronic (synthesizers, pads)

**Graph Structure → Music**:
- **Notes** = Individual musical events
- **Connections** = Harmonic relationships
- **Clusters** = Chord progressions
- **Hubs** = Emphasized instruments

---

## Control Center

The Control Center is your main interface for orchestrating your knowledge graph.

### Opening the Control Center

- Click the **music note icon (🎵)** in the left sidebar
- Or use the command palette: `Ctrl/Cmd + P` → "Sonigraph: Open Control Center"

### Main Controls

#### Playback Controls
- **Play (▶)**: Start sonification of the current note
- **Stop (⏹)**: Stop all audio playback
- **Current Note Display**: Shows which note is being sonified

#### Master Volume
- **Volume Slider**: Control overall output level (0-100%)
- **Mute Button**: Quick mute/unmute toggle
- Tip: Start at 50% and adjust to your preference

### Instrument Families

Instruments are organized into collapsible family sections:

#### Strings Family
- **Violin**: Bright, singing melodies for highly connected notes
- **Cello**: Warm, rich bass tones for foundational notes
- **Harp**: Crystalline arpeggios for tag relationships
- **Guitar**: Acoustic picking for casual connections

**Controls per instrument:**
- **Enable/Disable**: Toggle checkbox to activate/deactivate
- **Volume**: Individual volume control (0-100%)
- **Preview**: Click speaker icon to hear a sample note

#### Woodwinds Family
- **Flute**: Ethereal, airy tones for delicate connections
- **Oboe**: Expressive, pastoral melodies
- **Clarinet**: Smooth, warm mid-range voices
- **Bassoon**: Deep, resonant bass support

#### Brass Family
- **Trumpet**: Bold, brilliant fanfares for important hubs
- **Trombone**: Powerful, sustained harmonies
- **French Horn**: Noble, warm orchestral foundation
- **Tuba**: Deep bass reinforcement

#### Percussion Family
- **Timpani**: Dramatic emphasis on cluster changes
- **Xylophone**: Bright, percussive melodic accents
- **Marimba**: Warm, wooden-toned melodies
- **Vibraphone**: Shimmering, bell-like sustain

#### Vocals Family
- **Choir**: Ethereal human voices for emotional depth
- **Voice**: Solo vocal expressions for featured notes

#### Electronic Family
- **Synth Lead**: Modern, cutting synthesis
- **Synth Pad**: Atmospheric, sustained textures
- **Synth Bass**: Deep electronic foundation

### Effects Section

#### Master Effects
Available for the entire mix:

**Reverb Hall**
- Simulates orchestral concert hall acoustics
- **Mix**: Wet/dry balance (0-100%)
- **Decay**: Reverb tail length (0.1-10 seconds)
- **Preset**: Cathedral, Concert Hall, Jazz Club, Studio, etc.

**3-Band EQ**
- **Low**: Boost/cut bass frequencies (-12 to +12 dB)
- **Mid**: Adjust midrange clarity (-12 to +12 dB)
- **High**: Control treble brightness (-12 to +12 dB)

**Compressor**
- **Threshold**: Level where compression begins (-60 to 0 dB)
- **Ratio**: Amount of compression (1:1 to 20:1)
- **Attack**: Response time (0-100ms)
- **Release**: Recovery time (10-1000ms)

#### Per-Instrument Effects
Each instrument has individual processing:

- **Reverb**: Individual spatial placement
- **Chorus**: Thickness and width enhancement
- **Filter**: Tone shaping and brightness control

### Effect Presets

Quick-load professionally crafted effect chains:

1. **Concert Hall**: Classical orchestral reverb
2. **Jazz Club**: Intimate, warm ambience
3. **Cathedral**: Large, spiritual space
4. **Studio Dry**: Minimal processing, clear and direct
5. **Cinematic**: Film score-style depth
6. **Electronic Club**: Modern, energetic processing
7. **Nature Ambience**: Organic, outdoor feeling
8. **Intimate Chamber**: Small ensemble closeness
9. **Epic Orchestral**: Grand, powerful presence
10. **Minimalist**: Clean, subtle enhancement
11. **Experimental**: Creative, unusual processing

**To load a preset:**
1. Click **Effect Presets** dropdown
2. Select your desired preset
3. All effect parameters update automatically

### Settings Panel

Access advanced configuration:

#### Audio Quality
- **Sample Rate**: 44100 Hz (CD quality) or 48000 Hz (pro audio)
- **Polyphony Limit**: Maximum simultaneous voices (8-128)
- **CPU Usage**: Monitor real-time processing load

#### Performance
- **Voice Pooling**: Reuse voices for efficiency (recommended: on)
- **Adaptive Quality**: Reduce quality when CPU is stressed
- **Preload Samples**: Load instrument samples at startup

---

## Sonic Graph Visualization

The Sonic Graph provides a visual representation of your vault with synchronized audio playback.

### Opening Sonic Graph

**Method 1: Command Palette**
1. Press `Ctrl/Cmd + P`
2. Type "Sonigraph: Open Sonic Graph"
3. Press Enter

**Method 2: Ribbon Icon**
- Click the graph icon in the left ribbon (if enabled)

**Method 3: From Control Center**
- Click "Open Sonic Graph" button in Control Center

### Graph Modes

#### Static Graph View
- **What it shows**: All notes and connections in your vault
- **Visualization**: D3.js force simulation
- **Interaction**: Click, drag, and zoom nodes
- **Best for**: Exploring overall vault structure

**Controls:**
- **Zoom**: Mouse wheel or pinch gesture
- **Pan**: Click and drag background
- **Select node**: Click any node
- **View note**: Double-click to open in Obsidian

#### Timeline Animation Mode
- **What it shows**: Chronological appearance of notes
- **Visualization**: Notes appear based on creation/modification dates
- **Audio**: Synchronized musical playback as nodes appear
- **Best for**: Understanding how your vault evolved over time

**Playback Controls:**
- **Play (▶)**: Start timeline animation
- **Pause (⏸)**: Pause at current position
- **Stop (⏹)**: Stop and reset to beginning
- **Seek Bar**: Jump to any point in timeline
- **Speed Control**: 0.5x, 1x, 2x, 5x playback speed

### Timeline Settings

#### Granularity Control
How nodes are grouped by time:

- **Year**: Show one node per year (high-level overview)
- **Month**: Monthly grouping (good for long-term vaults)
- **Week**: Weekly grouping (balanced detail)
- **Day**: Daily grouping (detailed timelines)
- **Hour**: Hourly grouping (very detailed, short periods)
- **Custom**: Set your own interval

**Choosing granularity:**
- Large vault (1000+ notes): Start with Month or Year
- Medium vault (100-1000 notes): Week or Month
- Small vault (<100 notes): Day or Week
- Recent activity: Hour or Day

#### Time Window Filtering
Focus on specific time periods:

- **All time**: Show entire vault history
- **Past year**: Last 365 days only
- **Past month**: Last 30 days only
- **Past week**: Last 7 days only
- **Custom range**: Set specific start/end dates

**Example workflow:**
1. Set window to "Past year"
2. Set granularity to "Week"
3. See your vault's evolution week-by-week over the last year

#### Event Spacing
Prevent audio crackling from simultaneous notes:

**Simultaneous Event Limit**
- **What it does**: Prevents too many notes from playing at once
- **Range**: 1-20 simultaneous events
- **Recommended**: 4-8 for most vaults
- **Lower values**: Cleaner audio, less crackling
- **Higher values**: More musical density, potential glitches

**Intelligent Spreading Modes**
- **None**: No spreading (may cause crackling)
- **Gentle**: Slight spacing (5-10ms delays)
- **Aggressive**: Strong spacing (10-50ms delays)
- **Recommended**: Gentle for most uses

### Smart Clustering

Automatic grouping of related notes with visual enhancement:

#### Cluster Types
- **Tag-based**: Group by shared tags (green)
- **Temporal**: Group by creation date (blue)
- **Link-dense**: Group by connection density (purple)
- **Community**: Detect graph communities (orange)

#### Multi-Factor Weights
Fine-tune how clusters are detected:

- **Link Strength** (40%): Connection density
- **Shared Tags** (30%): Common tag relationships
- **Folder Hierarchy** (20%): Directory structure
- **Temporal Proximity** (10%): Time-based grouping

**Adjusting weights:**
1. Open "Smart Clustering" section
2. Use sliders to change weight percentages
3. Click "Recompute Clusters"
4. See updated visualization

#### Cluster Parameters
- **Minimum cluster size**: 3-20 notes (smaller = more clusters)
- **Maximum cluster size**: 10-100 notes (larger = fewer clusters)
- **Resolution**: 0.1-2.0 (higher = more granular clustering)

### Filtering & Exclusions

#### Content Exclusions
Exclude files and folders from visualization:

1. Click **Add Exclusion**
2. Start typing folder or file name
3. Use Obsidian's native autocomplete
4. Select item to exclude
5. Click **Apply Filters**

**Common exclusions:**
- Template folders
- Daily notes folder
- Archive directories
- System files

**Exclude by file type:**
- Images: `*.png`, `*.jpg`
- PDFs: `*.pdf`
- Specific extensions: `*.canvas`

### Performance Optimization

#### Rendering Modes
- **Full Quality**: All visual effects (small vaults)
- **Balanced**: Moderate quality (medium vaults)
- **Performance**: Minimal effects (large vaults)

**Automatic optimization:**
- Sonigraph detects vault size
- Adjusts rendering quality automatically
- Override in settings if needed

#### Data Processing
Uses Obsidian's MetadataCache for instant loading:

- **Pre-computed links**: No expensive graph traversal
- **Cached metadata**: Instant access to note data
- **Batch processing**: Efficient large vault handling

**Performance metrics:**
- Small vault (<500 notes): <100ms load time
- Medium vault (500-2000 notes): <500ms load time
- Large vault (2000+ notes): <2s load time

---

## Continuous Audio Layers

Continuous layers provide ambient soundscapes that evolve with your vault's state.

### What are Continuous Layers?

Three independent audio layers that run alongside node sonification:

1. **Ambient Layer**: Atmospheric textures and drone tones
2. **Rhythmic Layer**: Percussion patterns and tempo-based elements
3. **Harmonic Layer**: Chord progressions and tonal harmony

**Key features:**
- Play independently or together
- React to vault size and activity
- Based on musical genres
- Use Freesound.org samples

### Enabling Continuous Layers

**In Control Center:**
1. Scroll to **Continuous Layers** section
2. Toggle individual layer switches:
   - ☑ **Ambient layer**
   - ☑ **Rhythmic layer**
   - ☑ **Harmonic layer**
3. Adjust master **Layer Volume** (0-100%)

**In Settings:**
1. Open **Settings → Sonigraph**
2. Navigate to **Continuous Layers** tab
3. Configure detailed layer parameters

### Musical Genres

Choose the overall musical style for all layers:

#### Available Genres

1. **Ambient Drone** - Minimal, sustained textures
2. **Cinematic Orchestral** - Epic, film score-style
3. **Jazz Lounge** - Smooth, sophisticated atmosphere
4. **Electronic Pulse** - Modern, rhythmic synthesis
5. **Nature Soundscape** - Organic environmental sounds
6. **Minimal Piano** - Sparse, contemplative keys
7. **Dark Atmospheric** - Moody, suspenseful tones
8. **World Ethnic** - Global instrumental traditions
9. **Retro Synth** - Vintage electronic nostalgia
10. **Classical Chamber** - Intimate ensemble music
11. **Industrial Noise** - Mechanical, textured layers
12. **Meditation Zen** - Peaceful, calming ambience
13. **Experimental Glitch** - Abstract, unpredictable sounds

**Choosing a genre:**
1. Open **Continuous Layers** settings
2. Select **Musical Genre** dropdown
3. Choose your preferred style
4. All three layers update automatically

**Genre affects:**
- Sample selection from Freesound library
- Rhythmic pattern complexity
- Harmonic chord voicings
- Overall musical mood

### Layer Tonality

Set the musical scale and key for all continuous layers:

#### Scale Selection
- **Major** - Bright, happy (C-D-E-F-G-A-B)
- **Minor** - Dark, melancholic (C-D-Eb-F-G-Ab-Bb)
- **Dorian** - Modal, jazzy (C-D-Eb-F-G-A-Bb)
- **Phrygian** - Spanish, exotic (C-Db-Eb-F-G-Ab-Bb)
- **Lydian** - Dreamy, ethereal (C-D-E-F#-G-A-B)
- **Mixolydian** - Folk, bluesy (C-D-E-F-G-A-Bb)
- **Pentatonic** - Asian, simple (C-D-E-G-A)
- **Chromatic** - All notes (C-C#-D-D#-E-F-F#-G-G#-A-A#-B)

#### Key Selection
Choose the root note (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)

**Musical tip:**
- Major scales: Uplifting, energetic work
- Minor scales: Reflective, deep thinking
- Modal scales: Creative, exploratory writing

**Note:** These settings are independent of node-based synthesis. For node musical theory, see Advanced Features.

### Ambient Layer

Sustained atmospheric textures that create sonic environment.

#### Settings

**Density** (0-100%)
- How many simultaneous ambient sounds play
- Lower: Sparse, minimal ambience
- Higher: Rich, layered atmosphere
- Recommended: 30-50%

**Texture Complexity** (0-100%)
- Harmonic richness of ambient sounds
- Lower: Simple, pure tones
- Higher: Complex, evolving textures
- Recommended: 50-70%

#### Behavior
- Responds to vault size (more files = richer textures)
- Evolves slowly over time
- Crossfades smoothly when changing genres
- Loops seamlessly with fade settings

### Rhythmic Layer

Percussion patterns and tempo-based elements.

#### Settings

**Base Tempo** (60-180 BPM)
- Sets the underlying pulse
- 60-80 BPM: Slow, meditative
- 80-120 BPM: Moderate, focused
- 120-180 BPM: Fast, energetic
- Default: 120 BPM

**Percussion Intensity** (0-100%)
- Volume and prominence of drum sounds
- Lower: Subtle, barely noticeable
- Higher: Bold, driving rhythm
- Recommended: 50-70%

**Pattern Complexity** (Simple/Medium/Complex)
- **Simple**: Basic kick and hi-hat patterns
- **Medium**: Add snare, variations
- **Complex**: Full kit with fills and embellishments

#### Behavior
- Adapts to vault activity (quieter during busy moments)
- Syncs with timeline animation if playing
- Responds to note creation/modification
- Transitions smoothly between patterns

### Harmonic Layer

Chord progressions and tonal harmony.

#### Settings

**Chord Complexity** (2-6 voices)
- Number of notes in each chord
- 2-3: Simple, clear harmony
- 4-5: Rich, jazz-like voicings
- 6: Dense, orchestral textures
- Default: 3

**Progression Speed** (Slow/Medium/Fast)
- How quickly chords change
- **Slow**: 8-16 beats per chord (meditative)
- **Medium**: 4-8 beats per chord (balanced)
- **Fast**: 2-4 beats per chord (dynamic)

**Voice Leading** (Smooth/Balanced/Wide)
- How chord tones move
- **Smooth**: Minimal note movement (classical)
- **Balanced**: Moderate motion (versatile)
- **Wide**: Large leaps (dramatic)

#### Behavior
- Based on graph cluster detection
- Changes chords when clusters shift
- Follows selected scale and key
- Sustains with smooth crossfades

### Adaptive Behavior

Continuous layers automatically adjust based on context:

**When enabled, layers respond to:**

1. **Vault Size**
   - More files = richer textures
   - Ambient density increases with vault growth
   - Harmonic complexity scales with graph size

2. **Animation Progress**
   - Layers evolve through timeline
   - Intensity builds toward timeline end
   - Rhythmic patterns develop over time

3. **Node Activity**
   - Quieter during busy note playback
   - Avoid competing with node sonification
   - Duck volume when many notes trigger

**Toggle adaptive behavior:**
- **Settings → Continuous Layers → Adaptive Behavior**
- Enable/disable adaptive intensity

---

## Freesound Integration

Access high-quality environmental and musical samples from Freesound.org.

### What is Freesound?

Freesound (freesound.org) is a collaborative database of Creative Commons licensed sounds:

- 500,000+ audio samples
- Professional recordings
- Free to use with attribution
- Community-driven content

Sonigraph integrates Freesound for continuous layer samples and environmental sounds.

### Getting an API Token

**Required for Freesound features:**

1. **Create Freesound Account**
   - Go to freesound.org
   - Click "Register" in top-right
   - Fill out registration form
   - Verify your email

2. **Generate API Key**
   - Log into Freesound
   - Go to your profile
   - Click "API Keys" or "Apply for API Key"
   - Create a new API key for "Sonigraph"
   - Copy the token (long string of letters/numbers)

3. **Add Token to Sonigraph**
   - Open Sonigraph Control Center
   - Scroll to **Freesound Integration**
   - Paste token in **API Token** field
   - Click **Verify Token**
   - See "✓ Token verified" confirmation

**Token security:**
- Stored locally in Obsidian settings
- Never shared or transmitted except to Freesound API
- Can be revoked anytime from Freesound.org

### Sample Browser

Manage your curated Freesound sample library.

#### Opening Sample Browser

**From Control Center:**
1. Scroll to **Freesound Integration** section
2. Click **Browse Sample Library**

**From Command Palette:**
1. Press `Ctrl/Cmd + P`
2. Type "Sonigraph: Browse Freesound Samples"

#### Curated Library

Sonigraph includes 114 hand-selected Freesound samples:

- **Ambient**: Drones, pads, atmospheres
- **Nature**: Rain, wind, ocean, forest
- **Percussion**: Drums, shakers, bells
- **Melodic**: Keys, strings, synths
- **Textures**: Noise, granular, abstract

**All samples include:**
- Full metadata (author, license, tags)
- Freesound ID for reference
- License type (CC0, CC-BY, CC-BY-NC)
- Preview capability

#### Table Interface

**Columns:**
- **Name**: Sample filename and description
- **Author / License**: Creator and usage terms
- **Tags**: Categorization keywords
- **Enabled**: Checkbox to activate sample

**Sorting:**
- Click any column header to sort
- Click again to reverse order
- Multi-column sorting available

**Filtering:**
1. **Search box**: Filter by name or tags
2. **License filter**: Show specific licenses only
3. **Enabled filter**: Show only enabled/disabled samples
4. **Tag filter**: Select multiple tags to narrow results

#### Previewing Samples

**Listen before enabling:**
1. Find sample in table
2. Click **Preview** (speaker icon)
3. Audio plays directly from Freesound CDN
4. Click again to stop playback

**Preview features:**
- No download required
- Instant playback
- Real-time streaming
- Works with API token only

#### Managing Samples

**Enable/Disable Samples:**
- Check/uncheck the **Enabled** column
- Only enabled samples used in continuous layers
- Default: All samples disabled (user choice)

**Tag Editing:**
1. Click **Edit Tags** (pencil icon)
2. Add custom tags for organization
3. Use autocomplete for common tags
4. Remove tags with × button
5. Click **Save** to apply changes

**Bulk Operations:**
- **Enable All**: Activate all visible samples
- **Disable All**: Deactivate all visible samples
- **Reset Filters**: Clear all filter selections

### Searching Freesound (Unreleased)

*Note: This feature is in development and not yet released.*

Search the entire Freesound database:

1. Open Search modal
2. Enter search terms (e.g., "rain", "piano C4")
3. Filter by:
   - License type
   - File format
   - Sample rate
   - Duration
4. Preview results
5. Download to library
6. Add to continuous layers

### Sample Caching

**Automatic caching system:**

**Cache Location:**
- `.sonigraph-cache/` in vault root
- Excluded from sync by .gitignore
- Safe to delete (redownloads as needed)

**Caching Behavior:**
1. First play: Downloads sample
2. Stores in cache
3. Future plays: Loads from cache
4. Offline mode: Uses cached samples only

**Cache Settings:**

**Predictive Preloading**
- Automatically preload frequently used samples
- Based on your genre preferences
- Happens on Obsidian startup
- Reduces playback delays

**Preload on Startup**
- Download all enabled samples at launch
- Best for offline workflows
- Increases startup time
- Recommended for presentations

**Clear Cache:**
1. Go to **Settings → Sonigraph → Freesound**
2. Click **Clear Sample Cache**
3. Confirms before deleting
4. Samples redownload when needed

### Offline Mode

**Working without internet:**

1. Enable **Preload on Startup** (while online)
2. Wait for all samples to cache
3. Disconnect from internet
4. Sonigraph uses cached samples
5. Preview feature unavailable offline

**Best practices:**
- Preload before traveling
- Keep cache size reasonable
- Test offline before presentation
- Re-enable network for updates

### Attribution

**License compliance:**

Freesound samples have different licenses:

- **CC0 (Public Domain)**: No attribution required
- **CC-BY**: Attribution required
- **CC-BY-NC**: Attribution required, non-commercial only

**How Sonigraph handles attribution:**
1. Displays license in Sample Browser
2. Includes author info in metadata
3. Provides Freesound links for reference

**When using exported audio commercially:**
- Review licenses of included samples
- Provide attribution as required
- Use only CC0 or CC-BY for commercial work
- Avoid CC-BY-NC for commercial projects

---

## Content-Aware Mapping

Sonigraph intelligently assigns instruments based on note content and relationships.

### What is Content-Aware Mapping?

Instead of random instrument assignment, Sonigraph analyzes:

1. **File type** (markdown, image, PDF, etc.)
2. **Tags** in note content
3. **Folder location** in vault hierarchy
4. **Frontmatter** metadata
5. **Link type** (wikilink, embed, tag)

Then selects instruments and musical parameters accordingly.

### File Type Intelligence

Different file types trigger different instruments:

#### Note Types → Instruments

**Markdown Notes** (`.md`)
- Primary: String instruments (violin, cello)
- Reasoning: Core content, melodic focus
- Musical style: Singing, expressive lines

**Images** (`.png`, `.jpg`, `.gif`)
- Primary: Harp, bells, vibraphone
- Reasoning: Visual = crystalline, bright
- Musical style: Arpeggios, chimes

**PDFs** (`.pdf`)
- Primary: Brass (trumpet, trombone)
- Reasoning: Formal documents, bold presence
- Musical style: Fanfares, sustained tones

**Code Files** (`.js`, `.ts`, `.py`)
- Primary: Electronic synths
- Reasoning: Technical, systematic
- Musical style: Precise, rhythmic

**Audio Files** (`.mp3`, `.wav`)
- Primary: Choir, voice
- Reasoning: Already sonic, human connection
- Musical style: Smooth, vocal-like

**Video Files** (`.mp4`, `.mov`)
- Primary: Full orchestra
- Reasoning: Rich multimedia, cinematic
- Musical style: Layered, dramatic

### Tag-Based Semantics

Tags in your notes influence musical characteristics:

#### Mood Tags → Musical Parameters

**Emotional Tags:**
- `#happy`, `#joy`, `#excited` → Major scales, bright timbres
- `#sad`, `#melancholic`, `#somber` → Minor scales, dark tones
- `#calm`, `#peaceful`, `#serene` → Slow tempo, soft dynamics
- `#energetic`, `#intense`, `#powerful` → Fast tempo, loud dynamics

**Activity Tags:**
- `#work`, `#project`, `#task` → Rhythmic, driving patterns
- `#idea`, `#thought`, `#reflection` → Flowing, contemplative
- `#question`, `#inquiry` → Rising melodic contours
- `#answer`, `#solution` → Resolving harmonic progressions

**Instrument Override Tags:**
- `#piano` → Force piano instrument
- `#strings` → Use string section
- `#brass` → Employ brass instruments
- `#electronic` → Electronic synthesis

**Examples:**
```markdown
---
tags: [happy, energetic, project]
---
# My Exciting New Project

This note will use:
- Major scale (happy)
- Fast tempo (energetic)
- Rhythmic patterns (project)
```

### Folder Hierarchy Mapping

Vault folder structure influences orchestration:

#### Folder Depth → Orchestral Sections

**Top-level folders** (root directory)
- Instruments: Full orchestra, bold presence
- Dynamics: Forte (loud)
- Reasoning: Main topics, important content

**Mid-level folders** (2-3 deep)
- Instruments: Chamber ensembles, balanced
- Dynamics: Mezzo-forte (moderate)
- Reasoning: Subtopics, supporting material

**Deep folders** (4+ levels)
- Instruments: Solo instruments, intimate
- Dynamics: Piano (soft)
- Reasoning: Detailed notes, specialized content

#### Folder Names → Musical Styles

**Folder name patterns:**
- `Projects/` → Organized, rhythmic, brass
- `Ideas/` → Free-flowing, strings, woodwinds
- `Reference/` → Steady, bass, foundation
- `Personal/` → Warm, intimate, vocals
- `Archive/` → Muted, background, minimal

**Example vault structure:**
```
vault/
├── Projects/           → Full brass, energetic
│   ├── Work/          → Organized, steady
│   └── Personal/      → Warm, expressive
├── Knowledge/         → Balanced, strings
│   ├── Science/       → Precise, crystalline
│   └── Arts/          → Flowing, vocal
└── Daily Notes/       → Minimal, ambient
```

### Frontmatter Control

Explicit instrument and mood specification:

#### Frontmatter Fields

**Instrument assignment:**
```yaml
---
sonigraph-instrument: piano
sonigraph-family: strings
---
```

**Musical parameters:**
```yaml
---
sonigraph-scale: minor
sonigraph-key: A
sonigraph-tempo: slow
sonigraph-dynamics: soft
---
```

**Mood override:**
```yaml
---
sonigraph-mood: contemplative
sonigraph-energy: low
---
```

**Example note:**
```markdown
---
title: My Meditation Notes
tags: [mindfulness, calm]
sonigraph-instrument: harp
sonigraph-scale: pentatonic
sonigraph-key: C
sonigraph-tempo: slow
---

# Meditation Practice

This note will play as:
- Harp (frontmatter override)
- Pentatonic scale (simple, calming)
- C key (pure, centered)
- Slow tempo (meditative pace)
```

### Connection Type Audio

Different link types produce distinct musical elements:

#### Link Types → Musical Events

**Wikilinks** `[[note]]`
- Sound: Full note playback
- Instrument: Primary instrument assignment
- Duration: Complete phrase
- Reasoning: Strong, explicit connection

**Embeds** `![[note]]`
- Sound: Embedded voice, layered
- Instrument: Complementary to parent note
- Duration: Sustained, background
- Reasoning: Integrated content, harmony

**Tags** `#tag`
- Sound: Quick accent, chime
- Instrument: Harp, bells, vibraphone
- Duration: Short, percussive
- Reasoning: Categorical, organizational

**Backlinks** (implicit)
- Sound: Ghost note, subtle
- Instrument: Muted version of instrument
- Duration: Very brief
- Reasoning: Passive relationship

**Example:**
```markdown
# Project Overview

This note has [[detailed-analysis]] (full playback)

![[background-research]] (sustained background layer)

Tags: #project (bright accent) #work (bright accent)

Backlinked from "Weekly Review" (subtle ghost note)
```

### Hub Emphasis

Highly connected notes (hubs) receive special treatment:

#### Hub Detection
- Counts incoming and outgoing links
- Calculates centrality metrics
- Identifies graph influencers

#### Musical Emphasis
- **Louder dynamics**: Hubs play at higher volume
- **Richer harmony**: More complex chord voicings
- **Featured instruments**: Spotlight brass, vocals
- **Longer sustain**: Extended note durations

**Centrality types:**
1. **Degree centrality**: Simple connection count
2. **Betweenness**: Bridge between clusters
3. **Closeness**: Central to overall graph
4. **Eigenvector**: Connected to other important notes

**Configurable in Advanced Settings:**
- Hub threshold (minimum connections)
- Emphasis amount (volume boost)
- Centrality weights
- Transition behavior

---

## Audio Export

Export timeline animations as high-quality audio files.

### Opening Export Modal

**From Sonic Graph:**
1. Open timeline animation mode
2. Click **Export Audio** button (💾 icon)

**From Command Palette:**
1. Press `Ctrl/Cmd + P`
2. Type "Sonigraph: Export Timeline Audio"

### Export Formats

#### WAV (Lossless)
- **Quality**: Uncompressed, perfect quality
- **File size**: Large (10 MB/minute)
- **Use case**: Professional editing, mastering
- **Compatibility**: Universal
- **Recommended for**: Archival, further processing

#### M4A / AAC (Compressed)
- **Quality**: High-quality lossy compression
- **File size**: Small (1-3 MB/minute at 256 kbps)
- **Use case**: Sharing, streaming
- **Compatibility**: Apple devices, modern players
- **Recommended for**: Podcasts, mobile playback

#### WebM / Opus (Compressed)
- **Quality**: Efficient modern codec
- **File size**: Very small (0.5-2 MB/minute at 128 kbps)
- **Use case**: Web streaming
- **Compatibility**: Modern browsers
- **Recommended for**: Web embedding, bandwidth-limited

#### OGG / Vorbis (Compressed)
- **Quality**: Open-source compression
- **File size**: Small (1-2 MB/minute at 192 kbps)
- **Use case**: Open-source projects
- **Compatibility**: Linux, open platforms
- **Recommended for**: FLOSS workflows

### Quality Presets

#### High Quality
- **WAV**: 44100 Hz, 16-bit
- **Compressed**: 256-320 kbps
- **File size**: Larger
- **Use when**: Quality is priority

#### Standard Quality
- **WAV**: 44100 Hz, 16-bit
- **Compressed**: 192 kbps
- **File size**: Balanced
- **Use when**: General sharing

#### Small Size
- **WAV**: 22050 Hz, 16-bit
- **Compressed**: 128 kbps
- **File size**: Minimal
- **Use when**: Storage/bandwidth limited

### Time Range Selection

**Full Timeline**
- Export entire animation from start to end
- Duration matches timeline settings

**Custom Range**
1. Enable "Custom time range"
2. Set **Start time** (HH:MM:SS)
3. Set **End time** (HH:MM:SS)
4. Preview with timeline seek bar

**Use cases:**
- Export specific chapter/section
- Create multiple segments
- Skip intro/outro periods
- Focus on interesting portions

### Metadata

Add information embedded in audio file:

**Available fields:**
- **Title**: Name of export
- **Artist**: Your name or "Sonigraph"
- **Album**: Collection/vault name
- **Year**: Creation year
- **Genre**: Music genre (default: "Experimental")
- **Comments**: Additional notes

**Metadata support by format:**
- ✅ M4A: Full support
- ✅ OGG: Full support
- ⚠️ WebM: Limited support
- ❌ WAV: No embedded metadata

**Example:**
```
Title: My Vault Evolution - 2025
Artist: John Doe
Album: Knowledge Graph Soundscapes
Year: 2025
Genre: Ambient / Experimental
Comments: Generated with Sonigraph timeline animation
```

### Export Presets

**Save configurations for reuse:**

#### Creating a Preset
1. Configure all export settings
2. Click **Save as Preset**
3. Enter preset name
4. Confirm

#### Using a Preset
1. Click **Load Preset** dropdown
2. Select saved preset
3. All settings load instantly

#### Managing Presets
- **Edit**: Load preset, modify, save again
- **Delete**: Remove unused presets
- **Rename**: Save with new name

**Example presets:**
- "Podcast Episodes" - M4A, 128 kbps, full metadata
- "Social Media" - WebM, 128 kbps, small size
- "Archive Master" - WAV, high quality, full range
- "Quick Shares" - M4A, 192 kbps, standard quality

### Export Process

#### Starting Export
1. Review all settings
2. Click **Export Audio**
3. Choose save location in vault
4. Confirm filename
5. Export begins

#### Progress Tracking
- **Progress bar**: Visual completion indicator
- **Status text**: Current operation
- **Time estimate**: Remaining duration
- **Cancel button**: Abort if needed

**Export steps:**
1. Initializing audio context
2. Loading samples and instruments
3. Rendering timeline events
4. Processing audio effects
5. Encoding to selected format
6. Writing file to vault
7. Creating documentation note

#### Documentation Note

Sonigraph automatically creates a markdown note with export details:

**Note includes:**
- Export date and time
- File location and format
- Duration and file size
- All export settings used
- Timeline configuration
- Quality settings
- Metadata values

**Example documentation:**
```markdown
# Audio Export - My Vault Timeline

Exported: 2025-06-21 14:30:00

## File Details
- **Location**: exports/my-vault-timeline.m4a
- **Format**: M4A (AAC)
- **Duration**: 5:32
- **File Size**: 10.5 MB

## Settings
- Quality: High (256 kbps)
- Time Range: Full timeline
- Granularity: Week
- Instruments: 18 enabled

## Metadata
- Title: My Vault Timeline
- Artist: Sonigraph User
- Genre: Ambient
```

### File Management

#### Save Location
- Default: `exports/` folder in vault root
- Customizable per export
- Organized by date/name

#### Collision Handling
If file exists:
1. **Overwrite**: Replace existing file
2. **Keep Both**: Add number suffix (file-1.m4a)
3. **Cancel**: Abort export

#### Vault Organization
- Audio files appear in file explorer
- Can be linked from notes: `![[export.m4a]]`
- Playable in Obsidian if supported format
- Can be moved/renamed after export

### Troubleshooting Export

**Export fails:**
- Check disk space
- Verify write permissions
- Reduce quality preset
- Shorten time range

**File too large:**
- Use compressed format (M4A, WebM, OGG)
- Lower bitrate preset
- Export smaller time range
- Disable continuous layers

**Audio glitches in export:**
- Increase "Simultaneous Event Limit"
- Use "Aggressive" event spreading
- Reduce polyphony limit
- Disable some instruments

**Missing instruments:**
- Ensure instruments enabled
- Check volume levels
- Verify sample loading
- Test playback before export

---

## Advanced Features

Powerful customization for experienced users.

### Musical Theory Engine

Apply music theory principles to node sonification.

#### Accessing Musical Theory Settings

**Settings Path:**
1. Open **Settings → Sonigraph**
2. Navigate to **Advanced Features** tab
3. Find **Musical Theory** section

#### Scale & Key (Node-Based)

**Note:** This is separate from Continuous Layer tonality.

**Scale Selection:**
- Same options as continuous layers
- Applies to node sonification only
- Affects melodic contours
- Influences harmonic relationships

**Key Selection:**
- Choose root note (C-B)
- Affects all node pitches
- Consistent tonal center

**Use cases:**
- Maintain key consistency across vault
- Match existing musical content
- Create specific emotional atmosphere
- Ensure harmonic compatibility

#### Chord Progression System

**Automatic chord changes based on:**

**Cluster Detection**
- Each graph cluster gets a chord
- Transitions when playback moves to new cluster
- Smooth voice leading between chords

**Time-Based Progression**
- Changes every N seconds
- Follows common progressions (I-IV-V-I)
- Configurable progression speed

**Manual Progression**
- Define custom chord sequence
- Roman numeral notation (I, ii, iii, IV, V, vi, vii°)
- Repeats throughout playback

**Progression settings:**
- **Mode**: Cluster / Time / Manual
- **Speed**: Slow (8s) / Medium (4s) / Fast (2s)
- **Complexity**: Triads / Seventh chords / Extended

#### Melodic Contour Rules

Shape of melodic lines based on graph structure:

**Connection patterns → Melodies**
- **Linear chains**: Stepwise melodic motion
- **Hub nodes**: Arpeggio-like patterns
- **Isolates**: Static or repeated notes
- **Bidirectional**: Contrary motion

**Interval constraints:**
- Maximum leap size (2-12 semitones)
- Prefer steps vs leaps
- Return to tonal center

**Rhythmic quantization:**
- Snap to beat grid
- Swing feel (0-100%)
- Syncopation amount

### Hub Orchestration

Special treatment for highly connected notes.

#### Hub Detection Settings

**Minimum connections to qualify as hub:**
- Range: 3-50 connections
- Lower: More hubs, more emphasis
- Higher: Fewer hubs, selective emphasis

**Centrality metrics:**
Configure how hub importance is calculated:

**Degree Centrality** (weight: 0-100%)
- Simple connection count
- High weight: Favor quantity of connections

**Betweenness Centrality** (weight: 0-100%)
- Bridges between clusters
- High weight: Emphasize structural connectors

**Closeness Centrality** (weight: 0-100%)
- Average distance to all nodes
- High weight: Favor central location

**Eigenvector Centrality** (weight: 0-100%)
- Connected to other important nodes
- High weight: "Influence of influencers"

**Total weights must equal 100%**

#### Hub Musical Treatment

**Volume boost:**
- 0-200% amplification
- Makes hubs stand out
- Configurable per-hub

**Instrument assignment:**
- **Featured**: Brass, vocals (bold)
- **Supporting**: Strings, woodwinds (balanced)
- **Background**: Minimal change

**Harmonic richness:**
- Simple hubs: Triads (3 notes)
- Important hubs: Seventh chords (4 notes)
- Major hubs: Extended chords (5-6 notes)

**Sustain length:**
- Normal notes: 500ms-1s
- Minor hubs: 1-2s
- Major hubs: 2-4s

#### Hub Transitions

**Smooth transitions between hubs:**

**Transition types:**
- **Cut**: Immediate change
- **Crossfade**: Overlapping fade (100-1000ms)
- **Morph**: Gradual timbral shift

**Voice leading:**
- Maintain common tones between hubs
- Smooth bass motion
- Avoid parallel fifths/octaves

**Transition timing:**
- Synchronize with musical beats
- Wait for phrase endings
- Respect rhythmic grid

### Connection Type Mapping

Customize how different link types sound.

#### Accessing Connection Mapping

**Settings Path:**
1. **Settings → Sonigraph**
2. **Advanced Features** tab
3. **Connection Type Mapping** section

#### Presets

Quick-load professional configurations:

1. **Cinematic**: Film score-style, dramatic
2. **Minimal**: Subtle, understated
3. **Jazz**: Smooth, sophisticated
4. **Electronic**: Modern, synthetic
5. **Classical**: Traditional orchestral
6. **Experimental**: Unusual, creative

#### Global Settings

**Polyphony management:**
- Max simultaneous connection events
- Prevents overcrowding
- 4-32 voices

**Event spacing:**
- Minimum time between connection events
- Prevents audio glitches
- 10-100ms

#### Per-Connection-Type Settings

**Wikilinks**
- **Instrument category**: Strings, brass, etc.
- **Volume**: 0-100%
- **Duration**: 100-5000ms
- **Stereo width**: -100 to +100 (L/R positioning)
- **Reverb mix**: 0-100%

**Embeds**
- Separate settings from wikilinks
- Typically more subtle, sustained
- Background presence

**Tags**
- Quick, accent sounds
- Higher pitch instruments
- Short duration

**Backlinks**
- Very subtle
- Minimal presence
- Ghost notes

#### Advanced Audio Features

**Per-connection-type:**

**Spatial Audio**
- Pan position (-100 = left, +100 = right)
- Stereo width (narrow to wide)
- Distance attenuation

**Filter Modulation**
- Low-pass/high-pass filtering
- Cutoff frequency (20-20000 Hz)
- Resonance amount

**Envelope Shaping**
- Attack time (0-1000ms)
- Decay time (0-5000ms)
- Sustain level (0-100%)
- Release time (0-2000ms)

#### Link Strength Analysis

**Link weight affects volume:**

**Strength factors:**
- Explicit links: 100% weight
- Mentioned links: 75% weight
- Tag connections: 50% weight
- Backlinks: 25% weight

**Volume scaling:**
- Weak links: -12dB (quieter)
- Normal links: 0dB (reference)
- Strong links: +6dB (louder)

#### Contextual Modifiers

**Real-time adjustments based on:**

**Graph density:**
- Sparse graph: Fuller, richer sounds
- Dense graph: Minimal, spacious sounds

**Playback position:**
- Timeline start: Simple textures
- Timeline middle: Full complexity
- Timeline end: Grand finale

**Cluster membership:**
- Same cluster: Harmonic consonance
- Different clusters: Contrasting timbres
- Cluster boundaries: Transition effects

### Performance Monitoring

Real-time system metrics and optimization.

#### Performance Panel

**Access:**
1. Control Center → Performance section
2. Shows real-time statistics

**Metrics displayed:**

**CPU Usage**
- Current audio processing load
- 0-100% utilization
- Warning if >80%

**Active Voices**
- Number of currently playing notes
- Maximum: polyphony limit
- Updates in real-time

**Memory Usage**
- Sample buffer memory
- Cached audio data
- Growth over session

**Latency**
- Audio buffer latency (ms)
- Lower = more responsive
- Higher = safer, less glitches

#### Auto-Optimization

**Adaptive Quality System:**

When CPU exceeds threshold:
1. Reduce polyphony limit
2. Simplify effect processing
3. Disable non-essential features
4. Return to normal when CPU recovers

**Enable/disable:**
- Settings → Performance → Adaptive Quality

**Thresholds:**
- Warning: 70% CPU
- Reduce: 80% CPU
- Emergency: 90% CPU

---

## Performance & Optimization

Configure Sonigraph for optimal performance in your vault.

### Vault Size Considerations

#### Small Vaults (<500 notes)
**Recommended settings:**
- Polyphony limit: 32-64 voices
- Quality: High
- Preload samples: Yes
- All features enabled

**Expected performance:**
- Instant graph loading
- Smooth animation
- No audio glitches

#### Medium Vaults (500-2000 notes)
**Recommended settings:**
- Polyphony limit: 16-32 voices
- Quality: Balanced
- Preload samples: Selected genres only
- Smart clustering: Moderate resolution

**Optimizations:**
- Use content exclusions
- Limit time window
- Reduce simultaneous event limit

#### Large Vaults (2000+ notes)
**Recommended settings:**
- Polyphony limit: 8-16 voices
- Quality: Performance mode
- Preload samples: No
- Smart clustering: Low resolution

**Required optimizations:**
- Aggressive content exclusions
- Limited time windows
- Coarse timeline granularity
- Fewer enabled instruments

### Quality vs Performance

#### Audio Quality Settings

**Sample Rate**
- **44100 Hz**: CD quality, balanced (recommended)
- **48000 Hz**: Professional, higher CPU

**Bit Depth**
- **16-bit**: Standard, efficient (recommended)
- **24-bit**: Professional, higher memory

**Buffer Size**
- **Small (128-256)**: Low latency, higher CPU
- **Medium (512-1024)**: Balanced (recommended)
- **Large (2048-4096)**: High latency, lower CPU

**Choose based on:**
- Small buffer: Live performance, real-time playback
- Large buffer: Export, background listening

#### Visual Quality Settings

**Rendering Mode**
- **Full**: All effects, smooth animations
- **Balanced**: Selective effects (recommended)
- **Performance**: Minimal effects, faster

**Node rendering:**
- **Full detail**: Shadows, gradients, glow
- **Simplified**: Basic shapes, solid colors
- **Minimal**: Circles only

**Edge rendering:**
- **Curved**: Smooth bezier curves
- **Straight**: Direct lines (faster)
- **Hidden**: No edges (fastest)

### Memory Management

#### Sample Caching

**Cache strategy:**
- **Aggressive**: Cache everything (high memory)
- **Moderate**: Cache frequently used (balanced)
- **Conservative**: Cache minimal (low memory)

**Cache limits:**
- Maximum cache size: 100-1000 MB
- Auto-clear when limit reached
- Manual clear in settings

#### Voice Pooling

**What it does:**
- Reuses audio voices instead of creating new ones
- Dramatically reduces memory allocation
- Prevents memory leaks

**Settings:**
- **Pool size**: 16-128 voices
- **Automatic**: Matches polyphony limit
- **Always recommended**: Keep enabled

### CPU Optimization

#### Instrument Selection

**CPU impact per family:**
- **Low**: Piano, synth, simple percussion
- **Medium**: Strings, woodwinds, brass
- **High**: Complex percussion, vocals with processing
- **Very High**: Everything with heavy effects

**Optimization strategy:**
1. Enable only needed instruments
2. Prefer low-CPU instruments
3. Disable unused effects
4. Use effect presets wisely

#### Effect Processing

**CPU cost:**
- **Reverb**: High CPU cost
- **Chorus**: Medium CPU cost
- **Filter**: Low CPU cost
- **EQ**: Very low CPU cost

**Reduce CPU:**
1. Use simpler reverb algorithms
2. Reduce reverb decay time
3. Disable per-instrument reverb
4. Use master effects only

#### Background Processing

**When Sonigraph runs in background:**
- Reduces processing priority
- Lowers quality if needed
- Pauses non-essential updates

**Settings:**
- Auto-pause when window inactive
- Reduce quality in background
- Maintain full quality (high CPU)

### Export Optimization

#### Faster Exports

**Tips for speed:**
1. Use WAV format (no encoding)
2. Reduce polyphony limit
3. Disable continuous layers
4. Simplify effects chains
5. Export shorter time ranges

**Typical export times:**
- 1 minute audio: 30-60s export
- 5 minute audio: 2-5min export
- 10 minute audio: 5-10min export

*Times vary with CPU, settings, complexity*

#### Quality vs Speed

**Export presets:**
- **Fast Draft**: Low quality, quick
- **Standard**: Balanced
- **High Quality**: Slow, best quality

**Rendering:**
- Real-time (1:1): Playback speed
- Faster than real-time: If CPU allows
- Slower than real-time: Complex scenes

### Troubleshooting Performance

#### Audio Glitches

**Symptoms:**
- Clicks, pops, crackles
- Dropouts, silence gaps
- Distortion

**Solutions:**
1. Increase buffer size
2. Reduce polyphony limit
3. Enable event spreading (Gentle/Aggressive)
4. Lower simultaneous event limit
5. Disable some instruments
6. Close other apps

#### Slow Loading

**Symptoms:**
- Long startup time
- Delayed graph rendering
- Slow animation start

**Solutions:**
1. Disable "Preload on Startup"
2. Use content exclusions
3. Increase granularity (coarser)
4. Limit time window
5. Clear sample cache
6. Reduce enabled instruments

#### High CPU Usage

**Symptoms:**
- Fan noise, heat
- System slowdown
- Battery drain

**Solutions:**
1. Enable adaptive quality
2. Use performance rendering mode
3. Reduce polyphony limit
4. Simplify effect chains
5. Disable continuous layers
6. Close Sonic Graph when not in use

#### Memory Issues

**Symptoms:**
- Obsidian crashes
- Out of memory errors
- Sluggish performance

**Solutions:**
1. Clear sample cache
2. Reduce cache size limit
3. Disable predictive preloading
4. Use conservative caching
5. Reduce pool size
6. Restart Obsidian periodically

---

## Troubleshooting

Common issues and their solutions.

### Installation & Setup

#### Plugin Not Appearing

**Check:**
1. Community plugins enabled?
   - Settings → Community Plugins
   - Safe Mode must be OFF
2. Plugin installed?
   - Check installed plugins list
3. Plugin enabled?
   - Toggle must be ON

**Solution:**
- Restart Obsidian
- Reinstall plugin
- Check for error messages in Developer Console (Ctrl/Cmd+Shift+I)

#### No Sound Output

**Check:**
1. System volume (OS level)
2. Sonigraph master volume
3. Individual instrument volumes
4. Audio output device selected
5. Browser/system permissions

**Solution:**
- Increase volumes
- Check system sound settings
- Try different audio device
- Reload Obsidian
- Check browser audio permissions

#### Freesound Token Issues

**"Invalid token" error:**
1. Verify token copied correctly (no extra spaces)
2. Check token hasn't expired on Freesound.org
3. Confirm internet connection
4. Try regenerating token

**"Rate limit exceeded":**
- Freesound limits API calls
- Wait 1 hour and try again
- Reduce search frequency

### Playback Issues

#### Nothing Plays When I Click Play

**Check:**
1. Current note has connections?
   - Open graph view, verify links exist
2. Instruments enabled?
   - At least one must be checked
3. Instrument volumes above 0%?
4. Master volume above 0%?
5. Note excluded by filters?

**Solution:**
- Choose note with connections
- Enable instruments
- Increase volumes
- Check exclusion settings

#### Notes Play But Sound Weird

**Possible causes:**

**Too many simultaneous notes:**
- Reduce polyphony limit
- Enable event spreading
- Lower simultaneous event limit

**Wrong instruments for content:**
- Check content-aware mapping
- Override with frontmatter
- Manually select instruments

**Effect processing issues:**
- Reset effects to defaults
- Try different effect preset
- Reduce reverb amount
- Disable per-instrument effects

#### Audio Cuts Out / Crackling

**Solutions:**
1. Increase audio buffer size
2. Reduce polyphony limit (try 8-16)
3. Enable "Aggressive" event spreading
4. Lower simultaneous event limit (try 4)
5. Close other audio apps
6. Disable browser extensions
7. Update audio drivers

**Advanced:**
- Disable hardware acceleration in Obsidian
- Change sample rate (try 44100 Hz)
- Clear sample cache and reload

### Continuous Layers

#### Continuous Layers Not Playing

**Check:**
1. Layers enabled?
   - Toggle switches ON
2. Layer volume above 0%?
3. Freesound token configured?
4. Samples cached/downloaded?
5. Internet connection (first play)?

**Solution:**
- Enable desired layers
- Increase layer volume
- Add Freesound API token
- Wait for sample downloads
- Check network connection

#### Sample Download Failures

**"Failed to download sample" error:**

**Causes:**
- Network interruption
- Freesound.org downtime
- Invalid API token
- Rate limiting

**Solutions:**
- Check internet connection
- Verify API token
- Wait and retry
- Clear cache and reload
- Try different sample

#### Wrong Genre/Mood

**Check:**
1. Correct genre selected?
2. Scale/key settings appropriate?
3. Adaptive behavior interfering?

**Solution:**
- Change genre in settings
- Adjust scale to match mood
- Disable adaptive behavior if unwanted
- Use frontmatter overrides

### Sonic Graph

#### Graph Doesn't Load

**Check:**
1. Vault has notes?
2. Notes have creation dates?
3. Content exclusions too aggressive?
4. Time window too narrow?

**Solution:**
- Verify vault contains notes
- Expand time window to "All time"
- Clear content exclusions
- Reset graph settings to defaults
- Check developer console for errors

#### Timeline Animation Laggy

**Performance optimization:**
1. Reduce granularity (Year instead of Day)
2. Narrow time window
3. Use Performance rendering mode
4. Disable continuous layers during animation
5. Reduce enabled instruments
6. Lower polyphony limit

#### Clusters Look Wrong

**Check:**
1. Cluster resolution too high/low?
2. Weights balanced appropriately?
3. Minimum/maximum sizes appropriate?

**Solution:**
- Adjust resolution (try 0.5-1.5)
- Reset weights to defaults
- Increase minimum cluster size
- Recompute clusters

### Export Issues

#### Export Fails

**Common causes:**

**Disk space:**
- Check available storage
- WAV files are large (10MB/min)

**Permissions:**
- Verify write access to vault
- Try different export location

**Memory:**
- Reduce export duration
- Use compressed format
- Lower quality preset

**Timeout:**
- Long exports may timeout
- Export shorter segments
- Combine files externally

#### Exported File Sounds Different

**Potential reasons:**

**Real-time vs rendered:**
- Export renders precisely
- Playback may skip events
- Export is always accurate

**Effects processing:**
- Verify effects enabled during export
- Check effect preset loaded
- Confirm continuous layers state

**Missing instruments:**
- Ensure all desired instruments enabled
- Check volume levels
- Verify sample loading

**Solution:**
- Test playback before export
- Review export settings carefully
- Enable "detailed logging" to diagnose

#### File Won't Play

**Format compatibility:**

**WAV**: Universal, should always work
**M4A**: Requires AAC codec (most systems)
**WebM**: Modern browsers only
**OGG**: Needs Vorbis support

**Solutions:**
- Try WAV format for maximum compatibility
- Install codecs if needed
- Use VLC media player (plays everything)
- Convert format externally

### Advanced Features

#### Musical Theory Not Working

**Check:**
1. Musical theory enabled?
2. Scale/key set correctly?
3. Overriding frontmatter?
4. Using correct settings tab (not continuous layers)?

**Solution:**
- Enable musical theory in Advanced Features
- Verify scale and key settings
- Remove frontmatter overrides if unwanted
- Ensure using "Advanced Features" tab, not "Continuous Layers"

#### Hub Detection Missing Hubs

**Check:**
1. Hub threshold too high?
   - Lower minimum connections
2. Centrality weights appropriate?
   - Try equal weights (25% each)
3. Notes actually connected?
   - Verify in graph view

**Solution:**
- Lower hub threshold (try 5-8 connections)
- Adjust centrality weights
- Use degree centrality primarily
- Check graph structure

#### Connection Mapping Not Applying

**Check:**
1. Connection mapping enabled?
2. Correct preset loaded?
3. Overrides in frontmatter?
4. Link types in notes?

**Solution:**
- Enable connection type mapping
- Load or create preset
- Remove frontmatter overrides
- Verify notes contain target link types

### Performance Issues

#### High CPU Usage

**Normal during:**
- Active playback
- Timeline animation
- Continuous layers
- Sample downloads

**Reduce CPU:**
1. Enable adaptive quality
2. Reduce polyphony (8-16)
3. Disable continuous layers
4. Use performance rendering
5. Close Sonic Graph when idle
6. Reduce effect complexity

#### Memory Leaks

**Symptoms:**
- Memory grows over time
- Slowdown after long sessions
- Eventual crashes

**Solutions:**
1. Enable voice pooling
2. Clear sample cache periodically
3. Restart Obsidian daily
4. Reduce cache size limit
5. Disable predictive preloading
6. Report issue with logs

#### Obsidian Freezes

**Causes:**
- Processing very large vaults
- Too many simultaneous samples
- Corrupted cache files

**Solutions:**
1. Use more aggressive content exclusions
2. Reduce polyphony drastically (4-8)
3. Clear sample cache
4. Disable all continuous layers
5. Restart Obsidian
6. Increase buffer size

### Getting Help

#### Built-in Resources

**In-app help:**
- Hover tooltips on all settings
- Info buttons (ℹ️) for detailed explanations
- Preset descriptions

**Documentation:**
- This user guide
- README.md in plugin folder
- Feature guides in `/docs/features/`

#### Community Support

**GitHub Issues:**
- github.com/banisterious/obsidian-sonigraph/issues
- Search existing issues first
- Provide detailed bug reports
- Include system info

**Obsidian Community:**
- Obsidian Discord server
- Obsidian forum plugin discussions
- Community plugin showcase

#### Bug Reports

**Include in report:**
1. Obsidian version
2. Sonigraph version
3. Operating system
4. Vault size (note count)
5. Steps to reproduce
6. Error messages
7. Developer console logs (Ctrl/Cmd+Shift+I)

**How to get console logs:**
1. Open Developer Tools (Ctrl/Cmd+Shift+I)
2. Go to Console tab
3. Reproduce issue
4. Copy error messages
5. Include in bug report

---

## Appendices

### Keyboard Shortcuts

**Playback:**
- None by default (configure in Settings → Hotkeys)

**Suggested mappings:**
- `Ctrl/Cmd + Shift + P`: Play/Pause
- `Ctrl/Cmd + Shift + S`: Stop
- `Ctrl/Cmd + Shift + G`: Open Sonic Graph
- `Ctrl/Cmd + Shift + C`: Open Control Center

### Instrument Reference

**Complete list of 34 instruments:**

**Strings:**
1. Violin
2. Viola
3. Cello
4. Double Bass
5. Harp
6. Acoustic Guitar
7. Electric Guitar

**Woodwinds:**
8. Flute
9. Piccolo
10. Oboe
11. English Horn
12. Clarinet
13. Bass Clarinet
14. Bassoon
15. Saxophone

**Brass:**
16. Trumpet
17. Trombone
18. French Horn
19. Tuba

**Percussion:**
20. Timpani
21. Xylophone
22. Marimba
23. Vibraphone
24. Glockenspiel
25. Chimes
26. Gong

**Vocals:**
27. Choir
28. Voice (Solo)

**Electronic:**
29. Synth Lead
30. Synth Pad
31. Synth Bass
32. FM Synth
33. Organ
34. Electric Piano

### Effect Parameters Reference

**Reverb:**
- Mix: 0-100% (wet/dry)
- Decay: 0.1-10s (tail length)
- Pre-delay: 0-100ms (early reflections)
- Damping: 0-100% (high frequency absorption)

**Chorus:**
- Mix: 0-100% (wet/dry)
- Depth: 0-100% (modulation amount)
- Rate: 0.1-10 Hz (LFO speed)
- Feedback: 0-100% (resonance)

**Filter:**
- Type: Low-pass, High-pass, Band-pass
- Cutoff: 20-20000 Hz (frequency)
- Resonance: 0-100% (emphasis)
- Envelope: 0-100% (modulation depth)

**EQ:**
- Low: -12 to +12 dB (80 Hz)
- Mid: -12 to +12 dB (1000 Hz)
- High: -12 to +12 dB (8000 Hz)

**Compressor:**
- Threshold: -60 to 0 dB
- Ratio: 1:1 to 20:1
- Attack: 0-100ms
- Release: 10-1000ms
- Knee: 0-40 dB (soft/hard)

### Musical Scales Reference

**Scale formulas (in semitones from root):**

- **Major**: 0, 2, 4, 5, 7, 9, 11
- **Minor**: 0, 2, 3, 5, 7, 8, 10
- **Dorian**: 0, 2, 3, 5, 7, 9, 10
- **Phrygian**: 0, 1, 3, 5, 7, 8, 10
- **Lydian**: 0, 2, 4, 6, 7, 9, 11
- **Mixolydian**: 0, 2, 4, 5, 7, 9, 10
- **Pentatonic**: 0, 2, 4, 7, 9
- **Chromatic**: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

### Changelog

See plugin releases for version history:
- github.com/banisterious/obsidian-sonigraph/releases

### Credits

**Sonigraph Plugin:**
- Developed by banisterious
- Built with Obsidian API
- Audio engine: Tone.js
- Visualization: D3.js

**Audio Samples:**
- Freesound.org community
- Creative Commons licensed
- Individual sample attribution in Sample Browser

**Special Thanks:**
- Obsidian development team
- Plugin community
- Beta testers
- Freesound contributors

---

**End of User Guide**

*Last updated: 2025-06-21*
*Sonigraph version: 0.14.2*
*For latest documentation, visit: github.com/banisterious/obsidian-sonigraph*
