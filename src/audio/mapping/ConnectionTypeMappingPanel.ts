/**
 * ConnectionTypeMappingPanel - Phase 4.4: Connection Type Audio Differentiation UI
 *
 * Provides a comprehensive UI panel for configuring connection type audio mappings.
 * Integrated into the Sonic Graph View settings panel with collapsible sections,
 * preset management, and real-time preview capabilities.
 */

import { Setting, DropdownComponent, SliderComponent, ToggleComponent } from 'obsidian';
import {
    ConnectionType,
    ConnectionTypeMappingConfig,
    ConnectionTypeMapping,
    InstrumentFamily,
    ConnectionTypePreset,
    BUILT_IN_PRESETS,
    DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG
} from './ConnectionTypeMappingConfig';
import { getInstrumentsByCategory } from '../configs';
import { ConnectionTypeMapper } from './ConnectionTypeMapper';
import { getLogger } from '../../logging';

const logger = getLogger('connection-type-mapping-panel');

/**
 * Callback functions for panel interactions
 */
export interface ConnectionTypeMappingPanelCallbacks {
    onConfigChange: (config: ConnectionTypeMappingConfig) => void;
    onPresetLoad: (preset: ConnectionTypePreset) => void;
    onPresetSave: (name: string, description: string) => void;
    onPreviewConnection: (connectionType: ConnectionType) => void;
    onValidateConfig: (config: Partial<ConnectionTypeMappingConfig>) => { valid: boolean; errors: string[] };
}

/**
 * Panel state for managing UI elements
 */
interface PanelState {
    isExpanded: boolean;
    activeSection: string | null;
    selectedConnectionType: ConnectionType | null;
    isDirty: boolean;
    validationErrors: string[];
}

export class ConnectionTypeMappingPanel {
    private container: HTMLElement;
    private config: ConnectionTypeMappingConfig;
    private callbacks: ConnectionTypeMappingPanelCallbacks;
    private mapper: ConnectionTypeMapper | null;
    private state: PanelState;

    // UI element references
    private masterToggle: ToggleComponent | null = null;
    private independentToggle: ToggleComponent | null = null;
    private presetDropdown: DropdownComponent | null = null;
    private connectionTypeSections: Map<ConnectionType, HTMLElement> = new Map();
    private validationDisplay: HTMLElement | null = null;

    constructor(
        container: HTMLElement,
        config: ConnectionTypeMappingConfig,
        callbacks: ConnectionTypeMappingPanelCallbacks,
        mapper?: ConnectionTypeMapper
    ) {
        this.container = container;
        this.config = { ...config };
        this.callbacks = callbacks;
        this.mapper = mapper || null;

        this.state = {
            isExpanded: false,
            activeSection: null,
            selectedConnectionType: null,
            isDirty: false,
            validationErrors: []
        };

        this.render();
        logger.debug('connection-type-mapping-panel', 'Panel initialized', {
            enabled: this.config.enabled,
            mappingsCount: Object.keys(this.config.mappings).length
        });
    }

    /**
     * Render the complete panel
     */
    public render(): void {
        this.container.empty();

        // Create collapsible section header
        this.createSectionHeader();

        // Create collapsible content
        const contentContainer = this.container.createDiv({
            cls: `sonic-graph-settings-section connection-type-mapping ${this.state.isExpanded ? 'expanded' : 'collapsed'}`
        });

        if (this.state.isExpanded) {
            this.renderContent(contentContainer);
        }
    }

    /**
     * Create the collapsible section header
     */
    private createSectionHeader(): void {
        const headerContainer = this.container.createDiv({
            cls: 'sonic-graph-settings-section-header connection-type-mapping-header'
        });

        // Header title with expand/collapse button
        const titleContainer = headerContainer.createDiv({ cls: 'connection-type-mapping-title-container' });

        const expandButton = titleContainer.createEl('button', {
            cls: 'connection-type-mapping-expand-btn',
            text: this.state.isExpanded ? '▼' : '▶'
        });

        titleContainer.createEl('span', {
            text: 'CONNECTION TYPE AUDIO DIFFERENTIATION',
            cls: 'sonic-graph-settings-section-title'
        });

        // Status indicator
        const statusIndicator = titleContainer.createEl('span', {
            cls: `connection-type-mapping-status ${this.config.enabled ? 'enabled' : 'disabled'}`,
            text: this.config.enabled ? 'ENABLED' : 'DISABLED'
        });

        // Add click handler for expand/collapse
        expandButton.addEventListener('click', () => {
            this.state.isExpanded = !this.state.isExpanded;
            this.render();
        });

        // Phase 4.4 identifier
        const phaseTag = headerContainer.createEl('div', {
            text: 'Phase 4.4',
            cls: 'connection-type-mapping-phase-tag'
        });
    }

    /**
     * Render the main panel content
     */
    private renderContent(container: HTMLElement): void {
        // Master controls section
        this.createMasterControls(container);

        // Preset management section
        this.createPresetManagement(container);

        // Global settings section
        this.createGlobalSettings(container);

        // Connection type mappings section
        this.createConnectionTypeMappings(container);

        // Advanced features section
        this.createAdvancedFeatures(container);

        // Validation and status section
        this.createValidationSection(container);

        // Action buttons
        this.createActionButtons(container);
    }

    /**
     * Create master control toggles
     */
    private createMasterControls(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'connection-type-mapping-master-controls' });

        // Master enable toggle
        new Setting(section)
            .setName('Enable Connection Type Audio Differentiation')
            .setDesc('Map different connection types (wikilinks, embeds, tags) to distinct audio characteristics')
            .addToggle(toggle => {
                this.masterToggle = toggle;
                return toggle
                    .setValue(this.config.enabled)
                    .onChange(value => {
                        this.config.enabled = value;
                        this.markDirty();
                        this.callbacks.onConfigChange(this.config);
                        this.updateStatusIndicator();
                    });
            });

        // Independence from content-aware mapping
        new Setting(section)
            .setName('Independent from Content-Aware Mapping')
            .setDesc('Operate independently of Phase 4.1 content-aware mapping system')
            .addToggle(toggle => {
                this.independentToggle = toggle;
                return toggle
                    .setValue(this.config.independentFromContentAware)
                    .onChange(value => {
                        this.config.independentFromContentAware = value;
                        this.markDirty();
                        this.callbacks.onConfigChange(this.config);
                    });
            });
    }

    /**
     * Create preset management section
     */
    private createPresetManagement(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'connection-type-mapping-presets' });
        section.createEl('h4', { text: 'Presets', cls: 'connection-type-mapping-subsection-title' });

        // Preset selection dropdown
        new Setting(section)
            .setName('Active Preset')
            .setDesc('Load pre-configured connection type mappings')
            .addDropdown(dropdown => {
                this.presetDropdown = dropdown;

                // Add built-in presets
                BUILT_IN_PRESETS.forEach(preset => {
                    dropdown.addOption(preset.name, `${preset.name} - ${preset.description}`);
                });

                // Add custom presets
                this.config.customPresets.forEach(preset => {
                    dropdown.addOption(`custom:${preset.name}`, `${preset.name} (Custom) - ${preset.description}`);
                });

                return dropdown
                    .setValue(this.config.currentPreset || 'Default')
                    .onChange(value => {
                        this.loadPreset(value);
                    });
            });

        // Preset action buttons
        const presetActions = section.createDiv({ cls: 'connection-type-mapping-preset-actions' });

        const savePresetBtn = presetActions.createEl('button', {
            text: 'Save as Custom Preset',
            cls: 'connection-type-mapping-btn preset-save-btn'
        });
        savePresetBtn.addEventListener('click', () => this.showSavePresetDialog());

        const resetBtn = presetActions.createEl('button', {
            text: 'Reset to Defaults',
            cls: 'connection-type-mapping-btn preset-reset-btn'
        });
        resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    /**
     * Create global settings section
     */
    private createGlobalSettings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'connection-type-mapping-global-settings' });
        section.createEl('h4', { text: 'Global Settings', cls: 'connection-type-mapping-subsection-title' });

        // Connection volume mix
        new Setting(section)
            .setName('Connection Volume Mix')
            .setDesc('Overall volume level for connection audio (0% - 100%)')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(this.config.globalSettings.connectionVolumeMix * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    this.config.globalSettings.connectionVolumeMix = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Max simultaneous connections
        new Setting(section)
            .setName('Maximum Simultaneous Connections')
            .setDesc('Limit concurrent connection sounds for performance (5-50)')
            .addSlider(slider => slider
                .setLimits(5, 50, 1)
                .setValue(this.config.globalSettings.maxSimultaneousConnections)
                .setDynamicTooltip()
                .onChange(value => {
                    this.config.globalSettings.maxSimultaneousConnections = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Audio fade time
        new Setting(section)
            .setName('Connection Audio Fade Time')
            .setDesc('Fade in/out time for connection sounds (0.1-2.0 seconds)')
            .addSlider(slider => slider
                .setLimits(0.1, 2.0, 0.1)
                .setValue(this.config.globalSettings.connectionAudioFadeTime)
                .setDynamicTooltip()
                .onChange(value => {
                    this.config.globalSettings.connectionAudioFadeTime = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Performance settings subsection
        const perfSection = section.createDiv({ cls: 'connection-type-mapping-performance' });
        perfSection.createEl('h5', { text: 'Performance', cls: 'connection-type-mapping-minor-title' });

        new Setting(perfSection)
            .setName('Enable Caching')
            .setDesc('Cache connection analysis results for better performance')
            .addToggle(toggle => toggle
                .setValue(this.config.globalSettings.enableCaching)
                .onChange(value => {
                    this.config.globalSettings.enableCaching = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(perfSection)
            .setName('Selective Processing')
            .setDesc('Only process visible connections to improve performance')
            .addToggle(toggle => toggle
                .setValue(this.config.globalSettings.selectiveProcessing)
                .onChange(value => {
                    this.config.globalSettings.selectiveProcessing = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));
    }

    /**
     * Create connection type mappings section
     */
    private createConnectionTypeMappings(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'connection-type-mapping-types' });
        section.createEl('h4', { text: 'Connection Type Mappings', cls: 'connection-type-mapping-subsection-title' });

        // Create tabs for each connection type
        const tabContainer = section.createDiv({ cls: 'connection-type-tabs' });
        const contentContainer = section.createDiv({ cls: 'connection-type-content' });

        Object.entries(this.config.mappings).forEach(([type, mapping]) => {
            this.createConnectionTypeTab(tabContainer, contentContainer, type as ConnectionType, mapping);
        });

        // Select first enabled type by default
        const firstEnabledType = Object.entries(this.config.mappings).find(([, mapping]) => mapping.enabled);
        if (firstEnabledType && !this.state.selectedConnectionType) {
            this.selectConnectionType(firstEnabledType[0] as ConnectionType);
        }
    }

    /**
     * Create a tab for a specific connection type
     */
    private createConnectionTypeTab(
        tabContainer: HTMLElement,
        contentContainer: HTMLElement,
        connectionType: ConnectionType,
        mapping: ConnectionTypeMapping
    ): void {
        // Tab button
        const tabBtn = tabContainer.createEl('button', {
            text: this.getConnectionTypeDisplayName(connectionType),
            cls: `connection-type-tab ${mapping.enabled ? 'enabled' : 'disabled'} ${this.state.selectedConnectionType === connectionType ? 'active' : ''}`
        });

        tabBtn.addEventListener('click', () => {
            this.selectConnectionType(connectionType);
        });

        // Tab content (only visible when selected)
        const contentDiv = contentContainer.createDiv({
            cls: `connection-type-content-panel ${this.state.selectedConnectionType === connectionType ? 'active' : 'hidden'}`
        });

        this.connectionTypeSections.set(connectionType, contentDiv);
        this.renderConnectionTypeContent(contentDiv, connectionType, mapping);
    }

    /**
     * Render content for a specific connection type
     */
    private renderConnectionTypeContent(
        container: HTMLElement,
        connectionType: ConnectionType,
        mapping: ConnectionTypeMapping
    ): void {
        // Enable toggle
        new Setting(container)
            .setName(`Enable ${this.getConnectionTypeDisplayName(connectionType)}`)
            .setDesc(this.getConnectionTypeDescription(connectionType))
            .addToggle(toggle => toggle
                .setValue(mapping.enabled)
                .onChange(value => {
                    mapping.enabled = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                    this.updateConnectionTypeTab(connectionType);
                }));

        // Instrument family selection
        new Setting(container)
            .setName('Instrument Family')
            .setDesc('Choose the family of instruments for this connection type')
            .addDropdown(dropdown => {
                const families: InstrumentFamily[] = [
                    'strings', 'brass', 'woodwinds', 'percussion', 'keyboards',
                    'electronic', 'world', 'vocals', 'ambient', 'organic'
                ];

                families.forEach(family => {
                    dropdown.addOption(family, this.capitalizeFirst(family));
                });

                return dropdown
                    .setValue(mapping.instrumentFamily)
                    .onChange(value => {
                        mapping.instrumentFamily = value as InstrumentFamily;
                        this.updateInstrumentNames(mapping);
                        this.markDirty();
                        this.callbacks.onConfigChange(this.config);
                    });
            });

        // Intensity slider
        new Setting(container)
            .setName('Intensity/Sensitivity')
            .setDesc('Overall intensity and sensitivity for this connection type (0% - 100%)')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(mapping.intensity * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    mapping.intensity = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Audio characteristics subsection
        this.createAudioCharacteristicsSection(container, mapping);

        // Link strength analysis subsection
        this.createLinkStrengthAnalysisSection(container, mapping);

        // Contextual modifiers subsection
        this.createContextualModifiersSection(container, mapping);

        // Preview button
        const previewBtn = container.createEl('button', {
            text: 'Preview Audio',
            cls: 'connection-type-mapping-btn preview-btn'
        });
        previewBtn.addEventListener('click', () => {
            this.callbacks.onPreviewConnection(connectionType);
        });
    }

    /**
     * Create audio characteristics section
     */
    private createAudioCharacteristicsSection(container: HTMLElement, mapping: ConnectionTypeMapping): void {
        const section = container.createDiv({ cls: 'connection-type-audio-characteristics' });
        section.createEl('h5', { text: 'Audio Characteristics', cls: 'connection-type-mapping-minor-title' });

        const characteristics = mapping.audioCharacteristics;

        // Base volume
        new Setting(section)
            .setName('Base Volume')
            .setDesc('Base volume level for this connection type')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(characteristics.baseVolume * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    characteristics.baseVolume = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Note duration
        new Setting(section)
            .setName('Note Duration')
            .setDesc('Duration multiplier for notes (0.1x - 3.0x)')
            .addSlider(slider => slider
                .setLimits(0.1, 3.0, 0.1)
                .setValue(characteristics.noteDuration)
                .setDynamicTooltip()
                .onChange(value => {
                    characteristics.noteDuration = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Harmonic richness
        new Setting(section)
            .setName('Harmonic Richness')
            .setDesc('Complexity of harmonic content (0% - 100%)')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(characteristics.harmonicRichness * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    characteristics.harmonicRichness = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Spatial settings
        const spatialSection = section.createDiv({ cls: 'connection-type-spatial-settings' });
        spatialSection.createEl('h6', { text: 'Spatial Audio', cls: 'connection-type-mapping-micro-title' });

        new Setting(spatialSection)
            .setName('Reverb Amount')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(characteristics.reverbAmount * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    characteristics.reverbAmount = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(spatialSection)
            .setName('Stereo Spread')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(characteristics.spatialSpread * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    characteristics.spatialSpread = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        // Advanced toggles
        const advancedSection = section.createDiv({ cls: 'connection-type-advanced-audio' });
        advancedSection.createEl('h6', { text: 'Advanced Audio Features', cls: 'connection-type-mapping-micro-title' });

        new Setting(advancedSection)
            .setName('Enable Chords')
            .setDesc('Use chord progressions for this connection type')
            .addToggle(toggle => toggle
                .setValue(characteristics.chordsEnabled)
                .onChange(value => {
                    characteristics.chordsEnabled = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(advancedSection)
            .setName('Bidirectional Harmony')
            .setDesc('Use enhanced harmony for bidirectional links')
            .addToggle(toggle => toggle
                .setValue(characteristics.bidirectionalHarmony)
                .onChange(value => {
                    characteristics.bidirectionalHarmony = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(advancedSection)
            .setName('Broken Link Dissonance')
            .setDesc('Add dissonance for unresolved/broken links')
            .addToggle(toggle => toggle
                .setValue(characteristics.brokenLinkDissonance)
                .onChange(value => {
                    characteristics.brokenLinkDissonance = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));
    }

    /**
     * Create link strength analysis section
     */
    private createLinkStrengthAnalysisSection(container: HTMLElement, mapping: ConnectionTypeMapping): void {
        const section = container.createDiv({ cls: 'connection-type-link-strength' });
        section.createEl('h5', { text: 'Link Strength Analysis', cls: 'connection-type-mapping-minor-title' });

        const linkStrength = mapping.linkStrengthAnalysis;

        new Setting(section)
            .setName('Enable Link Strength Analysis')
            .setDesc('Analyze link frequency and importance for audio modulation')
            .addToggle(toggle => toggle
                .setValue(linkStrength.enabled)
                .onChange(value => {
                    linkStrength.enabled = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(section)
            .setName('Frequency Threshold')
            .setDesc('Minimum link frequency to consider "strong" (0-10 occurrences)')
            .addSlider(slider => slider
                .setLimits(0, 10, 1)
                .setValue(linkStrength.frequencyThreshold)
                .setDynamicTooltip()
                .onChange(value => {
                    linkStrength.frequencyThreshold = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(section)
            .setName('Volume Boost for Strong Links')
            .setDesc('Volume multiplier for strong links (100% - 200%)')
            .addSlider(slider => slider
                .setLimits(100, 200, 5)
                .setValue(linkStrength.volumeBoost * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    linkStrength.volumeBoost = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));
    }

    /**
     * Create contextual modifiers section
     */
    private createContextualModifiersSection(container: HTMLElement, mapping: ConnectionTypeMapping): void {
        const section = container.createDiv({ cls: 'connection-type-contextual-modifiers' });
        section.createEl('h5', { text: 'Contextual Modifiers', cls: 'connection-type-mapping-minor-title' });

        const modifiers = mapping.contextualModifiers;

        new Setting(section)
            .setName('Same Folder Boost')
            .setDesc('Volume boost for connections within the same folder')
            .addSlider(slider => slider
                .setLimits(100, 150, 5)
                .setValue(modifiers.sameFolderBoost * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    modifiers.sameFolderBoost = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(section)
            .setName('Recent Connection Boost')
            .setDesc('Volume boost for recently created connections')
            .addSlider(slider => slider
                .setLimits(100, 130, 2)
                .setValue(modifiers.recentConnectionBoost * 100)
                .setDynamicTooltip()
                .onChange(value => {
                    modifiers.recentConnectionBoost = value / 100;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(section)
            .setName('Recency Time Decay')
            .setDesc('Days for recency boost to decay (1-365 days)')
            .addSlider(slider => slider
                .setLimits(1, 365, 7)
                .setValue(modifiers.timeDecayDays)
                .setDynamicTooltip()
                .onChange(value => {
                    modifiers.timeDecayDays = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));
    }

    /**
     * Create advanced features section
     */
    private createAdvancedFeatures(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'connection-type-mapping-advanced-features' });
        section.createEl('h4', { text: 'Advanced Features', cls: 'connection-type-mapping-subsection-title' });

        const features = this.config.advancedFeatures;

        new Setting(section)
            .setName('Connection Chords')
            .setDesc('Enable chord progressions for connections (CPU intensive)')
            .addToggle(toggle => toggle
                .setValue(features.connectionChords)
                .onChange(value => {
                    features.connectionChords = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(section)
            .setName('Contextual Harmony')
            .setDesc('Harmonize based on connected content similarity')
            .addToggle(toggle => toggle
                .setValue(features.contextualHarmony)
                .onChange(value => {
                    features.contextualHarmony = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(section)
            .setName('Dynamic Instrumentation')
            .setDesc('Change instruments based on connection context')
            .addToggle(toggle => toggle
                .setValue(features.dynamicInstrumentation)
                .onChange(value => {
                    features.dynamicInstrumentation = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));

        new Setting(section)
            .setName('Velocity Modulation')
            .setDesc('Modulate velocity based on connection strength')
            .addToggle(toggle => toggle
                .setValue(features.velocityModulation)
                .onChange(value => {
                    features.velocityModulation = value;
                    this.markDirty();
                    this.callbacks.onConfigChange(this.config);
                }));
    }

    /**
     * Create validation and status section
     */
    private createValidationSection(container: HTMLElement): void {
        this.validationDisplay = container.createDiv({ cls: 'connection-type-mapping-validation' });

        if (this.state.validationErrors.length > 0) {
            this.validationDisplay.createEl('h5', {
                text: 'Configuration Issues',
                cls: 'connection-type-mapping-validation-title error'
            });

            const errorList = this.validationDisplay.createEl('ul', { cls: 'connection-type-mapping-error-list' });
            this.state.validationErrors.forEach(error => {
                errorList.createEl('li', { text: error, cls: 'connection-type-mapping-error' });
            });
        }

        // Performance metrics if mapper is available
        if (this.mapper) {
            const metrics = this.mapper.getMetrics();
            if (metrics.totalConnections > 0) {
                const metricsSection = this.validationDisplay.createDiv({ cls: 'connection-type-mapping-metrics' });
                metricsSection.createEl('h5', { text: 'Performance Metrics', cls: 'connection-type-mapping-metrics-title' });

                const metricsGrid = metricsSection.createDiv({ cls: 'connection-type-mapping-metrics-grid' });

                metricsGrid.createEl('div', {
                    text: `Total: ${metrics.totalConnections}`,
                    cls: 'connection-type-mapping-metric'
                });

                metricsGrid.createEl('div', {
                    text: `Mapped: ${metrics.mappedConnections}`,
                    cls: 'connection-type-mapping-metric'
                });

                metricsGrid.createEl('div', {
                    text: `Cached: ${metrics.cachedResults}`,
                    cls: 'connection-type-mapping-metric'
                });

                metricsGrid.createEl('div', {
                    text: `Avg Time: ${metrics.averageAnalysisTime.toFixed(1)}ms`,
                    cls: 'connection-type-mapping-metric'
                });
            }
        }
    }

    /**
     * Create action buttons
     */
    private createActionButtons(container: HTMLElement): void {
        const actions = container.createDiv({ cls: 'connection-type-mapping-actions' });

        const applyBtn = actions.createEl('button', {
            text: 'Apply Changes',
            cls: `connection-type-mapping-btn apply-btn ${this.state.isDirty ? 'dirty' : ''}`
        });
        applyBtn.addEventListener('click', () => {
            this.applyChanges();
        });

        const revertBtn = actions.createEl('button', {
            text: 'Revert Changes',
            cls: 'connection-type-mapping-btn revert-btn'
        });
        revertBtn.addEventListener('click', () => {
            this.revertChanges();
        });

        const exportBtn = actions.createEl('button', {
            text: 'Export Configuration',
            cls: 'connection-type-mapping-btn export-btn'
        });
        exportBtn.addEventListener('click', () => {
            this.exportConfiguration();
        });
    }

    /**
     * Helper methods
     */

    private getConnectionTypeDisplayName(type: ConnectionType): string {
        const displayNames: Record<ConnectionType, string> = {
            wikilink: 'Wikilinks',
            embed: 'Embeds',
            markdown: 'Markdown Links',
            tag: 'Tag Connections',
            backlink: 'Backlinks',
            unresolved: 'Broken Links',
            external: 'External URLs',
            alias: 'Aliases'
        };
        return displayNames[type];
    }

    private getConnectionTypeDescription(type: ConnectionType): string {
        const descriptions: Record<ConnectionType, string> = {
            wikilink: 'Internal [[wiki-style]] links between notes',
            embed: 'Embedded content using ![[embed]] syntax',
            markdown: 'Standard [markdown](links) with paths',
            tag: 'Connections through shared tags and semantics',
            backlink: 'Reverse connections from linked files',
            unresolved: 'Broken or missing link targets',
            external: 'External web URLs and resources',
            alias: 'Alternative names and display text for files'
        };
        return descriptions[type];
    }

    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private updateInstrumentNames(mapping: ConnectionTypeMapping): void {
        const familyInstruments = getInstrumentsByCategory(mapping.instrumentFamily);
        mapping.instrumentNames = Object.keys(familyInstruments);
    }

    private selectConnectionType(connectionType: ConnectionType): void {
        this.state.selectedConnectionType = connectionType;

        // Update tab active states
        const tabs = this.container.querySelectorAll('.connection-type-tab');
        tabs.forEach((tab, index) => {
            const types = Object.keys(this.config.mappings);
            if (types[index] === connectionType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update content panel visibility
        this.connectionTypeSections.forEach((element, type) => {
            if (type === connectionType) {
                element.classList.remove('hidden');
                element.classList.add('active');
            } else {
                element.classList.add('hidden');
                element.classList.remove('active');
            }
        });
    }

    private updateConnectionTypeTab(connectionType: ConnectionType): void {
        const tabs = this.container.querySelectorAll('.connection-type-tab');
        const types = Object.keys(this.config.mappings);
        const index = types.indexOf(connectionType);

        if (index >= 0 && tabs[index]) {
            const mapping = this.config.mappings[connectionType];
            if (mapping.enabled) {
                tabs[index].classList.add('enabled');
                tabs[index].classList.remove('disabled');
            } else {
                tabs[index].classList.remove('enabled');
                tabs[index].classList.add('disabled');
            }
        }
    }

    private updateStatusIndicator(): void {
        const statusIndicator = this.container.querySelector('.connection-type-mapping-status');
        if (statusIndicator) {
            statusIndicator.textContent = this.config.enabled ? 'ENABLED' : 'DISABLED';
            statusIndicator.className = `connection-type-mapping-status ${this.config.enabled ? 'enabled' : 'disabled'}`;
        }
    }

    private markDirty(): void {
        this.state.isDirty = true;
        this.validateConfiguration();
    }

    private validateConfiguration(): void {
        const validation = this.callbacks.onValidateConfig(this.config);
        this.state.validationErrors = validation.errors;

        if (this.validationDisplay) {
            this.createValidationSection(this.validationDisplay.parentElement);
        }
    }

    private loadPreset(presetName: string): void {
        let preset: ConnectionTypePreset | null = null;

        if (presetName.startsWith('custom:')) {
            const customName = presetName.substring(7);
            preset = this.config.customPresets.find(p => p.name === customName) || null;
        } else {
            preset = BUILT_IN_PRESETS.find(p => p.name === presetName) || null;
        }

        if (preset) {
            // Apply preset mappings
            Object.entries(preset.mappings).forEach(([type, mapping]) => {
                if (mapping && this.config.mappings[type as ConnectionType]) {
                    this.config.mappings[type as ConnectionType] = { ...mapping };
                }
            });

            this.config.currentPreset = presetName;
            this.markDirty();
            this.callbacks.onConfigChange(this.config);
            this.callbacks.onPresetLoad(preset);

            // Re-render to reflect changes
            this.render();

            logger.info('connection-type-mapping-panel', 'Preset loaded', {
                presetName,
                mappingsCount: Object.keys(preset.mappings).length
            });
        }
    }

    private showSavePresetDialog(): void {
        // In a real implementation, this would show a modal dialog
        // For now, we'll use a simple prompt
        const name = prompt('Enter preset name:');
        const description = prompt('Enter preset description:');

        if (name && description) {
            this.callbacks.onPresetSave(name, description);
        }
    }

    private resetToDefaults(): void {
        if (confirm('Reset all connection type mappings to default values? This cannot be undone.')) {
            this.config = { ...DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG };
            this.markDirty();
            this.callbacks.onConfigChange(this.config);
            this.render();
        }
    }

    private applyChanges(): void {
        this.state.isDirty = false;
        this.callbacks.onConfigChange(this.config);

        // Update apply button state
        const applyBtn = this.container.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.classList.remove('dirty');
        }

        logger.info('connection-type-mapping-panel', 'Changes applied', {
            enabled: this.config.enabled,
            activePreset: this.config.currentPreset
        });
    }

    private revertChanges(): void {
        if (confirm('Revert all unsaved changes? This cannot be undone.')) {
            // In a real implementation, this would revert to the last saved state
            this.state.isDirty = false;
            this.render();
        }
    }

    private exportConfiguration(): void {
        const configJson = JSON.stringify(this.config, null, 2);

        // Create a blob and download link
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `connection-type-mapping-config-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();

        URL.revokeObjectURL(url);

        logger.info('connection-type-mapping-panel', 'Configuration exported');
    }

    /**
     * Public API methods
     */

    public updateConfig(newConfig: ConnectionTypeMappingConfig): void {
        this.config = { ...newConfig };
        this.render();
    }

    public getConfig(): ConnectionTypeMappingConfig {
        return { ...this.config };
    }

    public collapse(): void {
        this.state.isExpanded = false;
        this.render();
    }

    public expand(): void {
        this.state.isExpanded = true;
        this.render();
    }

    public isDirty(): boolean {
        return this.state.isDirty;
    }

    public hasValidationErrors(): boolean {
        return this.state.validationErrors.length > 0;
    }

    public getValidationErrors(): string[] {
        return [...this.state.validationErrors];
    }
}