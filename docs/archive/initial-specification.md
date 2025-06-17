## Sonigraph: Initial Project Specifications (Revised and Expanded)

Tagline: Sonigraph: Your Notes, Orchestrated.

Description: Sonigraph is an Obsidian plugin that transforms the visual structure of your knowledge graph into music. It maps the visible notes (nodes) and their connections to musical parameters, allowing you to "hear" the relationships and complexity of your ideas, using an open-source JavaScript synth framework.

### 1. Project Goal

The primary goal of Sonigraph is to transform the visual structure of an Obsidian knowledge graph into a unique auditory experience. By mapping visible nodes and their connections to musical parameters, the plugin will allow users to "hear" the relationships and complexity of their notes.

### 2. Core Functionality

- **Graph Data Acquisition:**
    - The plugin will need to access the underlying data of the currently active Obsidian Graph view.
    - Initially, focus on acquiring **all nodes and their direct connections** within the loaded graph data structure. While future enhancements might target _only_ visually visible nodes, for a first iteration, working with the full loaded graph is a more feasible starting point given API limitations.
    - Parse note content to identify internal links (`[[note name]]`) to build the graph's adjacency list.
- **Musical Mapping Engine:**
    - Implement a flexible system to map graph properties to musical parameters.
    - **Nodes to Pitches/Instruments:** Each node will correspond to a musical event.
        - **Pitch Selection:** Map nodes to pitches within a user-selectable musical scale (e.g., C Major, Pentatonic, Chromatic).
        - **Instrument Assignment:** Allow for different node properties (e.g., number of incoming links, specific tags, or just a round-robin assignment) to determine which instrument plays the note.
    - **Connections to Rhythm/Duration:**
        - The presence and perhaps the number of connections from a node will influence its duration or rhythmic pattern.
        - Consider basic mapping: more connections = shorter duration (more active), or fewer connections = longer duration (sustained).
    - **Graph Traversal/Playback Logic:**
        - Implement a method to "traverse" the graph and trigger musical events.
        - **Initial Approach:** A simple, sequential traversal (e.g., breadth-first or depth-first from a selected root node, or simply iterating through all loaded nodes).
        - **Playback Control:** Start, Stop, Pause functionality.
- **Audio Output:**
    - Utilize an open-source JavaScript synth framework, with **Tone.js** being the recommended choice due to its comprehensive features for scheduling, synthesis, and effects.
    - Generate audible sounds directly within the Obsidian environment.

### 3. User Interface (UI)

- **Ribbon Icon/Command Palette Entry:** A dedicated button or command to open the Sonigraph control panel.
- **Control Panel (Modal or Pane):**
    - **Playback Controls:** Play, Stop, and Pause buttons.
    - **Basic Musical Parameters:**
        - **Tempo (BPM):** Slider to adjust the overall speed of the music.
        - **Musical Scale Selection:** Dropdown for common scales.
        - **Root Note Selection:** Dropdown for the tonic of the chosen scale.
    - **Mapping Configuration (Initial Simple Version):**
        - Simple toggle for "Enable Sonification."
        - Perhaps a dropdown to select the "starting node" for traversal (if applicable).
- **Feedback:** Visual indication when music is playing (e.g., button state change).

### 4. Technical Considerations

- **Obsidian Plugin API:** Leverage `obsidian.d.ts` for plugin development.
- **JavaScript & TypeScript:** Develop using TypeScript for better code maintainability and type safety.
- **Web Audio API:** Tone.js builds on this, so understanding its fundamentals is beneficial.
- **Performance Optimization:**
    - Be mindful of CPU usage, especially with large graphs.
    - Optimize audio processing and DOM manipulation.
    - Consider strategies for efficient graph data parsing and updates, especially for vaults with thousands of notes and connections.
    - Evaluate the need for Web Workers to offload heavy computation and maintain UI responsiveness during complex graph traversals and audio scheduling.
- **Persistence:** Store user settings (tempo, scale, mapping preferences) using `this.addSettingTab()` and `this.saveData()`.
- **Dependencies Management:** Clearly define and manage external dependencies (e.g., Tone.js, any MP3 encoders) using `package.json`. Ensure they are correctly bundled for distribution.

### 5. Architectural Requirements

- **Modularity:** The codebase _must_ be structured using modules (e.g., separate `.ts` files for distinct functionalities like data parsing, audio engine, UI components, settings management). Avoid maintaining all code within a single large `main.ts` file. This promotes code organization, reusability, testability, and easier collaboration.
- **Security Considerations:**
    - Implement secure practices, especially for future integrations like SoundCloud authentication (e.g., OAuth 2.0). Ensure user tokens are stored securely.
    - Prevent common web vulnerabilities (e.g., XSS) in the plugin's UI or data handling.

### 6. Quality & Maintenance

- **Error Handling and User Feedback:**
    - Implement robust error handling for various scenarios (e.g., empty graph, disconnected nodes, invalid settings, API errors).
    - Provide clear and actionable feedback to the user through Obsidian's notification system (e.g., `Notice.succeed()`, `Notice.fail()`) or dedicated UI elements within the plugin.
    - Gracefully degrade functionality rather than crashing.
- **Testing Strategy:**
    - **Unit Tests:** Develop unit tests for critical modules and functions (e.g., graph data parsing logic, musical mapping algorithms, audio scheduling).
    - **Integration Tests:** (If feasible within the Obsidian plugin ecosystem) Test the interaction between different plugin components and with the Obsidian API.
    - **Manual Testing:** Conduct thorough manual testing across different Obsidian versions, operating systems, and vault sizes.
- **Robustness for Graph Data Edge Cases:**
    - Design the graph traversal logic to handle potential edge cases gracefully:
        - Circular links (avoid infinite loops).
        - Links to non-existent notes.
        - Empty notes or notes with only non-text content (images, embeds).
        - Isolated nodes without any connections.
- **Obsidian API Changes:**
    - Acknowledge that the Obsidian API is evolving. Plan to monitor API changes and adapt the plugin to potential breaking changes in future Obsidian versions.

### 7. User Experience & Community

- **User Onboarding & Documentation:**
    - Create comprehensive `README.md` on GitHub with clear installation instructions, usage guide, and examples.
    - Consider in-app onboarding elements for first-time users (e.g., a welcome modal, tooltips for key features).
    - Explain complex musical mapping options in an accessible way, even for users without musical backgrounds.
- **Community & Feedback Loop:**
    - Establish channels for user feedback (e.g., GitHub Issues for bug reports/feature requests).
    - Consider fostering a community (e.g., Obsidian forum thread, Discord channel) for discussion, sharing Sonigraphs, and gathering insights.

### 8. Future Enhancements

These are ambitious ideas for future iterations after the core functionality is stable.

- **Leveraging Obsidian's Graph Timelapse:**
    - **Sonifying Node Appearance/Disappearance:** Trigger specific sounds or musical phrases as nodes appear or disappear during the timelapse animation, by constantly monitoring graph data changes.
    - **Sonifying Connection Changes:** Play distinct sounds (e.g., percussive hits, short motifs) when new links are formed between nodes as the timelapse progresses.
    - **Overall Graph Density/Complexity as Continuous Sound:** Map the overall "busyness" or density of the graph at any given point in the timelapse to continuous musical parameters like volume, tempo, harmony, or texture.
    - **Date-Based Musical Progression:** Align musical progression (e.g., chord changes, mode shifts, or thematic elements) with the temporal progression of the timelapse, mapping time itself to musical structure.
- **Deeper Integration with Timelapse:**
    - **Direct Control of Timelapse Playback:** Explore possibilities of offering Sonigraph controls to start/stop its own "sonified timelapse," potentially by coordinating with or taking over Obsidian's native animation if API allows.
    - **Synchronized "Playhead" or "Focus":** Implement a visual "playhead" or highlight that moves through the graph during the timelapse, with Sonigraph playing notes associated with the currently highlighted/active nodes/connections.
    - **Custom Graph Rendering with Integrated Sound:** (Most ambitious) Develop a custom graph view within the plugin that includes its own timelapse functionality and direct integration with audio generation, offering absolute control over visual-audio synchronization.
- **Sonigraph Influencing Visuals (Vice Versa):**
    - **Musical "Heatmap" on the Graph:** Visually highlight or adjust the size of nodes in the graph (even during timelapse) based on how frequently they are "played" or trigger musical events in Sonigraph.
- **Audio Export & Sharing:**
    - **MP3 Download:** Allow users to record and download the generated music as an MP3 file.
    - **WAV Export:** Option to download the raw, uncompressed audio as a WAV file.
    - **MIDI Export:** Functionality to export the generated music as a MIDI file for further manipulation in a Digital Audio Workstation (DAW).
    - **SoundCloud Integration:** Enable direct uploading of generated audio to a user's SoundCloud account (requiring user authentication and adherence to SoundCloud API terms). This would streamline sharing.
- **More Sophisticated Musical Mappings:**
    - Node centrality (e.g., degree centrality) influencing volume or prominence.
    - Specific link types (e.g., tags as links, dataview queries) influencing timbre or articulation.
    - Advanced musical structures based on graph topology (e.g., cycles as melodic loops, shortest paths as musical phrases).
- **Multiple Instruments and Complex Voice Allocation:** Allow for a richer orchestration based on more nuanced graph properties.
- **User-Defined Custom Mapping Rules:** A more advanced settings interface to allow users to define their own complex mapping logic.
- **Visual Feedback on the Graph:** Highlight the currently playing node or connection directly on the Obsidian graph view during sonification.

---

### 9. Open Questions & Decisions Needed

These are specific areas that require further investigation, design decisions, or confirmation during development:

- **A. Graph Data Access & Visibility:**
    
    - **Q1:** What is the most reliable and performant method to access the _currently loaded_ graph data structure (nodes and connections) from the Obsidian API?
    - **Q2:** Can the plugin determine which nodes and connections are _visually visible_ in the user's current filtered/zoomed graph view, or will it only have access to the full underlying graph data? (This impacts the initial scope of "visible nodes" in the core functionality).
    - **Q3:** Are there any Obsidian API events or hooks that fire when the graph view's data or visual state changes (e.g., filter applied, zoom level changed, timelapse frame updated)?
- **B. Core Musical Mapping Defaults:**
    
    - **Q4:** What will be the default musical scale and root note? (e.g., C Major, C Pentatonic Minor).
    - **Q5:** What will be the default instrument(s) used for nodes? (e.g., a simple sine wave, a basic synth patch from Tone.js).
    - **Q6:** How will the initial graph traversal path be determined if no root node is selected? (e.g., alphabetical by note name, creation date order).
- **C. User Interface & Settings:**
    
    - **Q7:** Will the Sonigraph control panel be a fixed pane, a modal window, or a combination?
    - **Q8:** What level of detail should the "Mapping Configuration" in the initial UI provide? Just toggles, or simple dropdowns for basic mapping choices?
- **D. Audio Export & Sharing Strategy (Initial):**
    
    - **Q9:** For initial audio export, will the focus be solely on WAV (uncompressed) to simplify implementation, with MP3/MIDI as later additions? (MP3 encoding in JavaScript can add complexity and bundle size).
    - **Q10:** Should the initial SoundCloud integration focus just on generating a file for manual upload by the user, or will direct API integration (requiring OAuth) be pursued from an early stage? (Direct API is a significant effort).
- **E. Performance Benchmarking:**
    
    - **Q11:** What are the target performance metrics for different vault sizes (e.g., for a vault with 1000 notes, what's an acceptable delay for sonification to start)?
