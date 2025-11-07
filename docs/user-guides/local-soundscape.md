# Local Soundscape User Guide

## Overview

**Local Soundscape** is an immersive audio-visual feature that creates an interactive graph of notes surrounding a central note, with each note sonified based on its depth and relationship to the center.

## Opening Local Soundscape

There are two ways to open a note in Local Soundscape:

### Method 1: Context Menu
1. Right-click on any note in your vault (in the file explorer or editor)
2. Select **"Open in Local Soundscape"** from the context menu
3. The Local Soundscape view will open with that note as the center

### Method 2: Command Palette
1. Open the Command Palette (`Ctrl/Cmd + P`)
2. Search for **"Local Soundscape: Open for active note"**
3. The currently active note will be opened in Local Soundscape

## Interface Overview

The Local Soundscape view consists of three main sections:

### Header Controls
- **Depth Slider** - Control how many levels of connections to show (1-5)
- **Filter Button** (funnel icon) - Open the filter modal to focus on specific content
- **Group Dropdown** - Choose clustering method (None, Folder, Tag, Depth, Community)
- **Layout Dropdown** - Switch between Radial and Force-Directed layouts
- **Refresh Button** (circular arrows) - Reload the graph with current vault data
- **Export Button** (download arrow) - Save the graph as a PNG image
- **Up-to-date Indicator** - Shows whether the graph reflects latest vault changes

### Graph Visualization (Left Panel)
The interactive graph shows:
- **Center Node** (largest) - Your selected note
- **Connected Nodes** - Notes at various depths from the center
- **Links** - Visual connections between notes
- **Clusters** (optional) - Colored background regions grouping related notes

### Sidebar (Right Panel)
Two tabs:
- **Playback** - Audio controls and statistics
- **Settings** - View configuration options

## Core Features

### 1. Depth Control

The depth slider determines how many levels of connections to explore:

- **Depth 1**: Only direct connections (one link away)
- **Depth 2**: Connections and their connections (default)
- **Depth 3-5**: Extended network exploration

**Tip**: Higher depths show more context but may become overwhelming. Start with depth 2.

### 2. Filtering

Click the filter button to focus on specific content:

#### Include Tags
- Only show notes with specified tags
- Useful for focusing on a topic

#### Exclude Tags
- Hide notes with specified tags
- Remove noise from your graph

#### Include Folders
- Only show notes from specified folders
- Great for project-specific views

#### Exclude Folders
- Hide notes from specified folders
- Filter out archived or template content

#### Include File Types
- Limit to specific file types (notes, images, PDFs, etc.)
- Default: all types

#### Link Directions
- **Incoming**: Notes that link TO the center
- **Outgoing**: Notes the center links TO
- **Bidirectional**: Notes with links in both directions
- Default: all directions

### 3. Clustering (Grouping)

Visualize relationships by grouping nodes into colored regions:

#### None
- Default view with no clustering
- Clean, minimal layout

#### Folder
- Groups notes by their parent folder
- Each folder gets a unique color
- Useful for project organization

#### Tag
- Groups notes by their primary tag (first tag found)
- Helps visualize topical connections

#### Depth
- Groups notes by their distance from the center
- Shows network layers clearly

#### Community
- Algorithmic clustering based on link density
- Finds tightly-connected groups of notes

**Tip**: Try different clustering methods to discover hidden patterns in your knowledge graph!

### 4. Layout Options

Choose how the graph is arranged:

#### Radial (Default)
- Nodes arranged in concentric circles around the center
- Depth-based positioning
- Clear hierarchical structure
- Best for understanding note relationships

#### Force-Directed
- Physics-based simulation
- Nodes naturally repel each other
- Links pull connected nodes together
- More organic, less structured
- Best for discovering unexpected connections

**Tip**: Switch layouts to see your graph from different perspectives!

### 5. Audio Playback

Local Soundscape creates a unique soundscape for your graph:

#### Playing Audio
1. Ensure you have instruments enabled in Control Center
2. Click the **Play** button in the Playback tab
3. Notes will play sequentially based on their position in the graph
4. Playing nodes **pulse and glow** on the graph

#### Audio Mapping
- **Depth 0 (Center)**: Lead instruments (piano, organ, lead synth)
- **Depth 1**: Harmony instruments (strings, electric piano, pad)
- **Depth 2**: Rhythm/bass (bass, timpani, cello)
- **Depth 3+**: Ambient (pad, drone, atmospheric synth)

**Note properties affect the sound:**
- **Word count** → Note duration
- **Link count** → Pitch variation
- **Modified date** → Velocity (volume/brightness)
- **Direction** → Panning (spatial positioning)

#### Playback Controls
- **Play** - Start the soundscape
- **Stop** - Stop playback and reset
- **Active Voices** - Number of notes currently playing
- **Volume** - Average playback volume

### 6. Visual Feedback

#### Node Colors
- **Green**: Incoming links (notes that link TO the center)
- **Blue**: Outgoing links (notes the center links TO)
- **Purple**: Bidirectional links
- **Orange**: Center node

#### Node Sizes
- Center node is largest (1.5x)
- Other nodes are standard size
- Playing nodes temporarily enlarge

#### Animations
- **Pulse effect**: Nodes glow while their audio is playing
- **Smooth transitions**: Graph elements animate when the view updates
- **Cluster animations**: Clustering regions fade in/out smoothly

### 7. Node Interactions

#### Left-Click
- **Single click**: Opens the note in a new tab
- Useful for quickly navigating to related content

#### Right-Click
- Opens context menu with options:
  - **Open note** - Open in new tab
  - **Re-center on this node** - Make this note the new center
  - **Show in file explorer** - Reveal in vault

#### Hover
- Shows tooltip with node information:
  - Note name
  - Depth from center
  - Link direction
  - Number of connections
  - Word count

### 8. Exporting

Save your graph as an image:

1. Click the **Export** button (download arrow icon)
2. Graph is saved as PNG with filename:
   - `local-soundscape-{note-name}-{timestamp}.png`
3. White background is automatically added
4. Current zoom and pan position is preserved
5. File is saved to your downloads folder

**Use cases:**
- Documentation and presentations
- Visualizing project structure
- Sharing knowledge graph insights
- Creating visual notes

## Settings Panel

Access the Settings tab in the sidebar to configure the view:

### Display
- **Show node labels**: Toggle visibility of note names below nodes

### Visual Effects
- **Pulse playing nodes**: Enable/disable the pulse animation for playing notes

### About
- Feature description
- Quick tips
- Link to open global Sonigraph settings

## Tips & Best Practices

### Performance Optimization
- **Limit depth** for large vaults (stick to 2-3)
- **Use filters** to reduce node count
- **Close other views** if experiencing lag

### Discovery Workflows
1. **Topic Exploration**:
   - Use "Include Tags" filter
   - Enable "Tag" clustering
   - Discover connections within a topic

2. **Project Review**:
   - Use "Include Folders" filter
   - Enable "Folder" clustering
   - See project structure at a glance

3. **Finding Hidden Connections**:
   - Set depth to 3-4
   - Enable "Community" clustering
   - Switch to Force layout
   - Look for unexpected bridges between clusters

4. **Content Audit**:
   - Use "Exclude Tags" or "Exclude Folders"
   - Find orphaned or under-connected notes
   - Identify areas needing more links

### Audio Best Practices
- **Enable 3-4 instruments** in Control Center (not all 20+)
- **Mix instrument types** (lead + harmony + bass + ambient)
- **Adjust depth** if you hear "Max polyphony exceeded" errors
- **Use filters** to reduce simultaneous notes

### Workflow Integration
- **Daily Review**: Open your daily note in Local Soundscape to see what you're connecting to
- **Writing**: Open your current draft to discover related content
- **Research**: Explore depth 3-4 to find unexpected source material
- **Refactoring**: Identify highly-connected "hub" notes that might need splitting

## Troubleshooting

### Graph doesn't appear
- Check that the note has links
- Try refreshing with the refresh button
- Increase depth if graph is too small
- Check filter settings aren't excluding everything

### "Max polyphony exceeded" error
- Too many notes playing simultaneously
- **Solution 1**: Reduce depth
- **Solution 2**: Apply filters to reduce node count
- **Solution 3**: Disable some instruments in Control Center
- **Solution 4**: Use "Include Folders" to focus on smaller area

### Graph looks cluttered
- Reduce depth to 1-2
- Apply filters (tags, folders, file types)
- Enable clustering to organize visually
- Try different layout (Force layout may spread things out)

### Audio doesn't play
- Check that Audio Engine is initialized in Control Center
- Ensure at least one instrument is enabled
- Check browser console for errors
- Try refreshing the graph

### Export doesn't work
- Ensure graph is fully rendered (wait for animations)
- Check browser permissions (allow downloads)
- Try again after refreshing the graph

## Keyboard Shortcuts

Currently, Local Soundscape doesn't have dedicated keyboard shortcuts. You can:
- Use Obsidian's command palette (`Ctrl/Cmd + P`) to open Local Soundscape
- Use standard Obsidian shortcuts for navigation

## Comparison with Sonic Graph

| Feature | Local Soundscape | Sonic Graph |
|---------|------------------|-------------|
| **Scope** | One note + connections | Entire vault |
| **Layout** | Radial or Force | Force-directed |
| **Depth Control** | Yes (1-5) | No (shows all) |
| **Filtering** | Advanced | Basic |
| **Clustering** | Yes (5 methods) | No |
| **Audio** | Depth-based mapping | Various modes |
| **Export** | PNG | PNG + Audio |
| **Performance** | Optimized for subgraphs | Handles full vault |

**When to use Local Soundscape:**
- Exploring a specific note's context
- Focused work on a topic or project
- Need depth control and filtering
- Want clustering visualization

**When to use Sonic Graph:**
- Analyzing entire vault structure
- Finding global patterns
- Need animation timeline
- Export audio recordings

## Related Features

- **Control Center**: Configure instruments, audio settings, and global plugin settings
- **Sonic Graph**: Visualize and sonify your entire vault
- **Note Journey** (coming soon): Guided audio tours through note sequences

## Feedback & Support

Found a bug or have a feature request?
- Report issues at: https://github.com/anthropics/sonigraph/issues
- Check documentation: https://docs.sonigraph.com

---

**Happy exploring! 🎵📊**
