# Sonigraph

**Transform your knowledge graph into music.**

Sonigraph is an Obsidian plugin that maps the visual structure of your knowledge graph to musical parameters, allowing you to "hear" the relationships and complexity of your ideas through audio synthesis.

## 🎵 Features

- **Graph Sonification**: Convert your note connections into musical patterns
- **Real-time Audio**: Generate music directly within Obsidian using Tone.js
- **Configurable Mappings**: Customize how nodes and connections translate to musical elements
- **Multiple Scales**: Support for major, minor, pentatonic, and chromatic scales
- **Intuitive Controls**: Simple play/pause interface with tempo and volume controls

## 🚧 Development Status

**Current Version**: 0.1.0 (In Development)

This plugin is currently in active development. The basic plugin structure is complete, and we're working through the core functionality phases.

### What's Working
- ✅ Plugin structure and build system
- ✅ Settings management with Obsidian integration
- ✅ Basic UI components (control panel, settings tab)
- ✅ Audio engine foundation with Tone.js

### In Progress
- 🔄 Graph data extraction and parsing
- 🔄 Musical mapping algorithms
- 🔄 Audio synthesis implementation

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Obsidian (for testing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/banisterious/obsidian-sonigraph.git
   cd obsidian-sonigraph
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. For development with auto-rebuild:
   ```bash
   npm run dev
   ```

### Testing the Plugin

1. Copy the built files (`main.js`, `manifest.json`, `styles.css`) to your Obsidian vault's plugins folder:
   ```
   YOUR_VAULT/.obsidian/plugins/obsidian-sonigraph/
   ```

2. Enable the plugin in Obsidian Settings → Community Plugins

3. Look for the music note icon in the ribbon or use the command palette to open Sonigraph

## 📁 Project Structure

```
src/
├── main.ts                 # Plugin entry point
├── logging.ts              # Logging utilities
├── graph/
│   ├── parser.ts          # Graph data extraction
│   ├── traversal.ts       # Graph traversal algorithms (planned)
│   └── types.ts           # Graph data types
├── audio/
│   ├── engine.ts          # Audio synthesis engine
│   ├── mapping.ts         # Musical mapping logic (planned)
│   └── instruments.ts     # Instrument definitions (planned)
├── ui/
│   ├── control-panel.ts   # Main control interface
│   ├── settings.ts        # Settings tab
│   └── components.ts      # Reusable UI components (planned)
├── templates/
│   └── ui/                # Reference templates for complex modals
└── utils/
    ├── helpers.ts         # Utility functions (planned)
    └── constants.ts       # Application constants
```

## 🎯 Development Phases

### Phase 1: Foundation ✅
- [x] Project setup and build system
- [x] Basic plugin structure
- [x] Settings management
- [x] UI scaffolding

### Phase 2: Graph Processing 🔄
- [ ] Vault parsing for note connections
- [ ] Graph data structure implementation
- [ ] Connection analysis and metrics

### Phase 3: Audio Engine 🔄
- [ ] Tone.js integration and synthesis
- [ ] Musical scale implementation
- [ ] Basic note scheduling and playback

### Phase 4: Musical Mapping
- [ ] Node-to-pitch mapping algorithms
- [ ] Connection-to-rhythm mapping
- [ ] Traversal pattern implementation

### Phase 5: Polish & Release
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] Documentation and examples
- [ ] Community plugin store submission

## 🎼 Planned Musical Mappings

- **Nodes → Pitches**: Map notes to musical pitches based on configurable scales
- **Connections → Rhythm**: Connection density influences note duration and timing
- **Graph Traversal → Sequence**: Different algorithms for musical progression through the graph
- **Node Properties → Instruments**: Use tags, backlinks, or other properties to select instruments

## 🤝 Contributing

This project is in early development. Contributions, feedback, and suggestions are welcome!

1. Check the [implementation plan](docs/planning/implementation-plan.md)
2. Review the [technical specification](docs/planning/specification.md)
3. Open an issue or submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built for [Obsidian](https://obsidian.md)
- Audio synthesis powered by [Tone.js](https://tonejs.github.io/)
- Inspired by data sonification and knowledge visualization research

---

**Note**: This plugin is not affiliated with or endorsed by Obsidian.md. 