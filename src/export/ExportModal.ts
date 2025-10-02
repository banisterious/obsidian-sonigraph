/**
 * Export Modal - User interface for configuring exports
 *
 * Provides a comprehensive export configuration UI with progressive disclosure.
 * Phase 1: Basic options (scope, format, quality, location, filename)
 * Phase 2: Advanced options (instruments, effects, metadata, presets)
 */

import { App, Modal, Setting, DropdownComponent, TextComponent, Notice } from 'obsidian';
import { AudioEngine } from '../audio/engine';
import { TemporalGraphAnimator } from '../graph/TemporalGraphAnimator';
import { AudioExporter } from './AudioExporter';
import { ExportConfig, ExportScope, AudioFormat, QualityPreset, ExportLocationType } from './types';
import { ExportProgressModal } from './ExportProgressModal';
import { CollisionResolution } from './FileCollisionModal';
import { getLogger } from '../logging';

const logger = getLogger('export-modal');
import ObsidianSonigraphPlugin from '../main';

/**
 * Main export configuration modal
 */
export class ExportModal extends Modal {
    private plugin: ObsidianSonigraphPlugin;
    private audioEngine: AudioEngine;
    private animator: TemporalGraphAnimator | null;
    private exporter: AudioExporter;

    // Configuration state
    private config: Partial<ExportConfig> = {};

    // UI elements
    private scopeDropdown?: DropdownComponent;
    private customRangeContainer?: HTMLElement;
    private startTimeInput?: TextComponent;
    private endTimeInput?: TextComponent;
    private formatDropdown?: DropdownComponent;
    private qualityDropdown?: DropdownComponent;
    private locationTypeDropdown?: DropdownComponent;
    private locationInput?: TextComponent;
    private filenameInput?: TextComponent;
    private metadataContainer?: HTMLElement;
    private metadataInputs: {
        title?: TextComponent;
        artist?: TextComponent;
        album?: TextComponent;
        comment?: TextComponent;
        year?: TextComponent;
        genre?: TextComponent;
    } = {};
    private advancedContainer?: HTMLElement;
    private estimateDisplay?: HTMLElement;

    constructor(
        app: App,
        plugin: ObsidianSonigraphPlugin,
        audioEngine: AudioEngine,
        animator: TemporalGraphAnimator | null
    ) {
        super(app);
        this.plugin = plugin;
        this.audioEngine = audioEngine;
        this.animator = animator;
        this.exporter = new AudioExporter(app, audioEngine, plugin.settings);

        if (animator) {
            this.exporter.setAnimator(animator);
        }

        // Initialize config with defaults
        this.initializeConfig();
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('sonigraph-export-modal');

        // Header
        contentEl.createEl('h2', { text: 'Export Sonic Graph' });

        // Create form sections
        this.createPresetsSection(contentEl);
        this.createScopeSection(contentEl);
        this.createFormatSection(contentEl);
        this.createLocationSection(contentEl);
        this.createFilenameSection(contentEl);
        this.createMetadataSection(contentEl);
        this.createEstimateDisplay(contentEl);
        this.createAdvancedSection(contentEl);
        this.createActionButtons(contentEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    /**
     * Create presets section
     */
    private createPresetsSection(container: HTMLElement): void {
        const section = container.createDiv('export-section');
        section.createEl('h3', { text: 'Quick Presets' });

        const presetButtons = section.createDiv('export-preset-buttons');

        // Get presets from settings
        const presets = this.plugin.settings.exportSettings?.exportPresets || [];

        if (presets.length === 0) {
            // Show default presets
            this.createPresetButton(presetButtons, {
                id: 'high-quality-wav',
                name: 'High Quality WAV',
                format: 'wav',
                quality: { sampleRate: 48000, bitDepth: 16 }
            });

            this.createPresetButton(presetButtons, {
                id: 'compressed-audio',
                name: 'Compressed Audio',
                format: 'mp3',
                quality: { sampleRate: 48000, bitRate: 192 }
            });

            this.createPresetButton(presetButtons, {
                id: 'lossless',
                name: 'Lossless',
                format: 'wav',
                quality: { sampleRate: 48000, bitDepth: 24 }
            });
        } else {
            // Show custom presets
            presets.forEach(preset => {
                this.createPresetButton(presetButtons, preset);
            });
        }

        // Save current as preset button
        const savePresetBtn = presetButtons.createEl('button', {
            text: '💾 Save Current as Preset',
            cls: 'export-preset-save'
        });
        savePresetBtn.addEventListener('click', () => this.saveCurrentAsPreset());
    }

    /**
     * Create a preset button
     */
    private createPresetButton(container: HTMLElement, preset: any): void {
        const btn = container.createEl('button', {
            text: preset.name,
            cls: 'export-preset-btn'
        });

        btn.addEventListener('click', () => {
            this.loadPreset(preset);
        });
    }

    /**
     * Load a preset
     */
    private loadPreset(preset: any): void {
        // Update config
        this.config.format = preset.format;
        this.config.quality = preset.quality;

        if (preset.metadata) {
            this.config.metadata = preset.metadata;
        }

        // Update UI
        if (this.formatDropdown) {
            this.formatDropdown.setValue(preset.format);
        }

        this.updateQualityOptions();
        this.updateEstimate();

        // Update metadata inputs if present
        if (preset.metadata && this.metadataInputs) {
            if (this.metadataInputs.title) this.metadataInputs.title.setValue(preset.metadata.title || '');
            if (this.metadataInputs.artist) this.metadataInputs.artist.setValue(preset.metadata.artist || '');
            if (this.metadataInputs.album) this.metadataInputs.album.setValue(preset.metadata.album || '');
            if (this.metadataInputs.year) this.metadataInputs.year.setValue(preset.metadata.year?.toString() || '');
            if (this.metadataInputs.genre) this.metadataInputs.genre.setValue(preset.metadata.genre || '');
            if (this.metadataInputs.comment) this.metadataInputs.comment.setValue(preset.metadata.comment || '');
        }

        new Notice(`Loaded preset: ${preset.name}`);
    }

    /**
     * Save current settings as a preset
     */
    private async saveCurrentAsPreset(): Promise<void> {
        // Prompt for preset name
        const name = await this.promptForPresetName();
        if (!name) return;

        const preset = {
            id: `preset-${Date.now()}`,
            name,
            format: this.config.format!,
            quality: this.config.quality!,
            metadata: this.config.metadata
        };

        // Save to settings
        if (!this.plugin.settings.exportSettings) {
            this.plugin.settings.exportSettings = {} as any;
        }
        if (!this.plugin.settings.exportSettings.exportPresets) {
            this.plugin.settings.exportSettings.exportPresets = [];
        }

        this.plugin.settings.exportSettings.exportPresets.push(preset);
        await this.plugin.saveSettings();

        new Notice(`Saved preset: ${name}`);

        // Refresh presets section
        this.close();
        // Would need to reopen or refresh, but for now just notify
    }

    /**
     * Prompt user for preset name
     */
    private async promptForPresetName(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Save Preset');

            const content = modal.contentEl;
            content.createEl('p', { text: 'Enter a name for this preset:' });

            let nameInput: TextComponent;
            new Setting(content)
                .setName('Preset name')
                .addText(text => {
                    nameInput = text;
                    text.setPlaceholder('My Preset');
                });

            const buttonContainer = content.createDiv('modal-button-container');
            buttonContainer.createEl('button', { text: 'Cancel' })
                .addEventListener('click', () => {
                    modal.close();
                    resolve(null);
                });

            buttonContainer.createEl('button', { text: 'Save', cls: 'mod-cta' })
                .addEventListener('click', () => {
                    const name = nameInput.getValue().trim();
                    if (name) {
                        modal.close();
                        resolve(name);
                    } else {
                        new Notice('Please enter a preset name');
                    }
                });

            modal.open();
        });
    }

    /**
     * Initialize configuration with defaults from plugin settings
     */
    private initializeConfig(): void {
        const exportSettings = this.plugin.settings.exportSettings;

        this.config = {
            scope: 'full-timeline',
            format: exportSettings?.defaultFormat || 'wav',
            quality: this.getQualityForFormat(exportSettings?.defaultFormat || 'wav', exportSettings),
            locationType: exportSettings?.lastExportType || 'vault',
            location: exportSettings?.exportFolder || 'Sonigraph Exports',
            filename: this.generateFilename(),
            onCollision: 'cancel',
            includeContinuousLayers: true,
            applyMasterVolume: true,
            applyEffects: true,
            preserveSpatialAudio: true,
            renderingMethod: exportSettings?.renderingMethod || 'offline',
            maxDurationMinutes: exportSettings?.maxDurationMinutes || 10,
            createNote: exportSettings?.createExportNote !== false,
            includeSettingsSummary: exportSettings?.includeSettingsSummary !== false
        };
    }

    /**
     * Create export scope section
     */
    private createScopeSection(container: HTMLElement): void {
        const section = container.createDiv('export-section');
        section.createEl('h3', { text: 'What to export' });

        new Setting(section)
            .setName('Export scope')
            .setDesc('Choose what portion of the timeline to export')
            .addDropdown(dropdown => {
                this.scopeDropdown = dropdown;

                dropdown
                    .addOption('full-timeline', `Full Timeline Animation (${this.animator?.config.duration || 60}s)`)
                    .addOption('custom-range', 'Custom Time Range')
                    .addOption('static-graph', 'Current Static Graph')
                    .setValue(this.config.scope || 'full-timeline')
                    .onChange(value => {
                        this.config.scope = value as ExportScope;
                        this.updateCustomRangeVisibility();
                        this.updateEstimate();
                    });
            });

        // Custom range inputs (initially hidden)
        this.customRangeContainer = section.createDiv('custom-range-container');
        this.customRangeContainer.style.display = 'none';

        new Setting(this.customRangeContainer)
            .setName('Start time')
            .setDesc('Start time in seconds (e.g., 5 or 0:05)')
            .addText(text => {
                this.startTimeInput = text;
                text.setPlaceholder('0')
                    .setValue('0')
                    .onChange(value => {
                        this.updateCustomRange();
                    });
            });

        new Setting(this.customRangeContainer)
            .setName('End time')
            .setDesc('End time in seconds (e.g., 30 or 0:30)')
            .addText(text => {
                this.endTimeInput = text;
                const maxDuration = this.animator?.config.duration || 60;
                text.setPlaceholder(maxDuration.toString())
                    .setValue(maxDuration.toString())
                    .onChange(value => {
                        this.updateCustomRange();
                    });
            });
    }

    /**
     * Create format and quality section
     */
    private createFormatSection(container: HTMLElement): void {
        const section = container.createDiv('export-section');
        section.createEl('h3', { text: 'Format & Quality' });

        // Format
        new Setting(section)
            .setName('Format')
            .setDesc('Audio file format. Compressed audio uses native platform codecs (M4A/AAC, WebM/Opus, or OGG/Vorbis).')
            .addDropdown(dropdown => {
                this.formatDropdown = dropdown;

                dropdown
                    .addOption('wav', 'WAV (Lossless Audio)')
                    .addOption('mp3', 'Compressed Audio (M4A/WebM/OGG)')
                    // Phase 2 (optional):
                    // .addOption('ogg', 'OGG Vorbis')
                    // .addOption('flac', 'FLAC (Lossless Compressed)')
                    .setValue(this.config.format || 'wav')
                    .onChange(value => {
                        this.config.format = value as AudioFormat;
                        this.updateQualityOptions();
                        this.updateEstimate();
                    });
            });

        // Quality preset
        new Setting(section)
            .setName('Quality preset')
            .setDesc('Audio quality settings')
            .addDropdown(dropdown => {
                this.qualityDropdown = dropdown;

                dropdown
                    .addOption('high', 'High Quality (48kHz, 16-bit)')
                    .addOption('lossless', 'Lossless (48kHz, 24-bit)')
                    .addOption('standard', 'Standard (44.1kHz, 16-bit)')
                    .setValue('high')
                    .onChange(value => {
                        this.config.quality = this.getQualityFromPreset(value as QualityPreset);
                        this.updateEstimate();
                    });
            });
    }

    /**
     * Create location section
     */
    private createLocationSection(container: HTMLElement): void {
        const section = container.createDiv('export-section');
        section.createEl('h3', { text: 'Save Location' });

        // Location type
        new Setting(section)
            .setName('Location type')
            .setDesc('Save to vault or system location')
            .addDropdown(dropdown => {
                this.locationTypeDropdown = dropdown;

                dropdown
                    .addOption('vault', 'Vault Folder')
                    .addOption('system', 'System Location')
                    .setValue(this.config.locationType || 'vault')
                    .onChange(value => {
                        this.config.locationType = value as ExportLocationType;
                        this.updateLocationInput();
                    });
            });

        // Location path
        new Setting(section)
            .setName('Location')
            .setDesc('Folder path for exported file')
            .addText(text => {
                this.locationInput = text;

                text
                    .setPlaceholder('Sonigraph Exports')
                    .setValue(this.config.location || 'Sonigraph Exports')
                    .onChange(value => {
                        this.config.location = value;
                    });
            });
            // TODO: Add browse button for Phase 1.5
    }

    /**
     * Create filename section
     */
    private createFilenameSection(container: HTMLElement): void {
        const section = container.createDiv('export-section');
        section.createEl('h3', { text: 'Filename' });

        new Setting(section)
            .setName('Filename')
            .setDesc('Name for the exported file (without extension)')
            .addText(text => {
                this.filenameInput = text;

                text
                    .setPlaceholder('sonigraph-export')
                    .setValue(this.config.filename || this.generateFilename())
                    .onChange(value => {
                        this.config.filename = value;
                        this.updateEstimate();
                    });
            });

        // Remember settings checkbox
        new Setting(section)
            .setName('Remember settings')
            .setDesc('Save these settings as defaults for future exports')
            .addToggle(toggle => {
                toggle
                    .setValue(false)
                    .onChange(value => {
                        // Will be implemented when export starts
                    });
            });
    }

    /**
     * Create estimate display
     */
    private createEstimateDisplay(container: HTMLElement): void {
        this.estimateDisplay = container.createDiv('export-estimate');
        this.updateEstimate();
    }

    /**
     * Create metadata section (collapsed by default)
     */
    private createMetadataSection(container: HTMLElement): void {
        const section = container.createDiv('export-section');

        const header = section.createDiv('export-metadata-header');
        header.createEl('span', { text: 'Metadata (Optional) ▼' });
        header.addClass('clickable');

        this.metadataContainer = section.createDiv('export-metadata-content');
        this.metadataContainer.style.display = 'none';

        // Toggle metadata section
        header.addEventListener('click', () => {
            const isVisible = this.metadataContainer!.style.display !== 'none';
            this.metadataContainer!.style.display = isVisible ? 'none' : 'block';
            header.textContent = isVisible ? 'Metadata (Optional) ▼' : 'Metadata (Optional) ▲';
        });

        // Load last used metadata if available
        const lastMetadata = this.plugin.settings.exportSettings?.lastMetadata;

        // Title
        new Setting(this.metadataContainer)
            .setName('Title')
            .setDesc('Song or export title')
            .addText(text => {
                this.metadataInputs.title = text;
                text.setPlaceholder('Sonic Graph Export')
                    .setValue(lastMetadata?.title || '')
                    .onChange(value => {
                        if (!this.config.metadata) this.config.metadata = {};
                        this.config.metadata.title = value.trim() || undefined;
                    });
            });

        // Artist
        new Setting(this.metadataContainer)
            .setName('Artist')
            .setDesc('Artist or creator name')
            .addText(text => {
                this.metadataInputs.artist = text;
                text.setPlaceholder('Your Name')
                    .setValue(lastMetadata?.artist || '')
                    .onChange(value => {
                        if (!this.config.metadata) this.config.metadata = {};
                        this.config.metadata.artist = value.trim() || undefined;
                    });
            });

        // Album
        new Setting(this.metadataContainer)
            .setName('Album')
            .setDesc('Album or collection name')
            .addText(text => {
                this.metadataInputs.album = text;
                text.setPlaceholder('Vault Soundscapes')
                    .setValue(lastMetadata?.album || '')
                    .onChange(value => {
                        if (!this.config.metadata) this.config.metadata = {};
                        this.config.metadata.album = value.trim() || undefined;
                    });
            });

        // Year
        new Setting(this.metadataContainer)
            .setName('Year')
            .setDesc('Year of creation')
            .addText(text => {
                this.metadataInputs.year = text;
                const currentYear = new Date().getFullYear();
                text.setPlaceholder(currentYear.toString())
                    .setValue(lastMetadata?.year?.toString() || '')
                    .onChange(value => {
                        if (!this.config.metadata) this.config.metadata = {};
                        const year = parseInt(value.trim(), 10);
                        this.config.metadata.year = isNaN(year) ? undefined : year;
                    });
            });

        // Genre
        new Setting(this.metadataContainer)
            .setName('Genre')
            .setDesc('Musical genre or category')
            .addText(text => {
                this.metadataInputs.genre = text;
                text.setPlaceholder('Ambient, Generative')
                    .setValue(lastMetadata?.genre || '')
                    .onChange(value => {
                        if (!this.config.metadata) this.config.metadata = {};
                        this.config.metadata.genre = value.trim() || undefined;
                    });
            });

        // Comment
        new Setting(this.metadataContainer)
            .setName('Comment')
            .setDesc('Additional notes or description')
            .addTextArea(text => {
                this.metadataInputs.comment = text as any;
                text.setPlaceholder('Generated from Obsidian vault using Sonigraph plugin')
                    .setValue(lastMetadata?.comment || '')
                    .onChange(value => {
                        if (!this.config.metadata) this.config.metadata = {};
                        this.config.metadata.comment = value.trim() || undefined;
                    });
                (text.inputEl as HTMLTextAreaElement).rows = 3;
            });
    }

    /**
     * Create advanced options section (collapsed by default)
     */
    private createAdvancedSection(container: HTMLElement): void {
        const section = container.createDiv('export-section');

        const header = section.createDiv('export-advanced-header');
        header.createEl('span', { text: 'Advanced Options ▼' });
        header.addClass('clickable');

        this.advancedContainer = section.createDiv('export-advanced-content');
        this.advancedContainer.style.display = 'none';

        // Toggle advanced options
        header.addEventListener('click', () => {
            const isVisible = this.advancedContainer!.style.display !== 'none';
            this.advancedContainer!.style.display = isVisible ? 'none' : 'block';
            header.textContent = isVisible ? 'Advanced Options ▼' : 'Advanced Options ▲';
        });

        // TODO: Phase 2 - Add advanced options:
        // - Instrument selection
        // - Effects toggles
        // - Metadata fields
        // - Rendering method
        // - Max duration
    }

    /**
     * Create action buttons
     */
    private createActionButtons(container: HTMLElement): void {
        const buttonContainer = container.createDiv('export-buttons');

        // Cancel button
        buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-cancel'
        }).addEventListener('click', () => {
            this.close();
        });

        // Export button (CTA)
        buttonContainer.createEl('button', {
            text: 'Export',
            cls: 'mod-cta'
        }).addEventListener('click', () => {
            this.startExport();
        });
    }

    /**
     * Start the export process
     */
    private async startExport(): Promise<void> {
        try {
            // Validate configuration
            if (!this.config.filename || this.config.filename.trim() === '') {
                new Notice('Please enter a filename');
                return;
            }

            // Build complete export config
            const exportConfig: ExportConfig = {
                scope: this.config.scope!,
                format: this.config.format!,
                quality: this.config.quality!,
                locationType: this.config.locationType!,
                location: this.config.location!,
                filename: this.config.filename!,
                onCollision: this.config.onCollision!,
                includeContinuousLayers: this.config.includeContinuousLayers!,
                applyMasterVolume: this.config.applyMasterVolume!,
                applyEffects: this.config.applyEffects!,
                preserveSpatialAudio: this.config.preserveSpatialAudio!,
                renderingMethod: this.config.renderingMethod!,
                maxDurationMinutes: this.config.maxDurationMinutes!,
                createNote: this.config.createNote!,
                includeSettingsSummary: this.config.includeSettingsSummary!,
                // Capture actual audio engine state for note generation
                masterVolume: this.plugin.settings.volume,
                enabledEffects: this.getEnabledEffects(),
                selectedInstruments: this.getEnabledInstruments(),
                // Include metadata if provided
                metadata: this.config.metadata
            };

            // Save metadata for next time if user wants to remember it
            if (this.config.metadata && Object.keys(this.config.metadata).length > 0) {
                if (!this.plugin.settings.exportSettings) {
                    this.plugin.settings.exportSettings = {} as any;
                }
                this.plugin.settings.exportSettings.lastMetadata = this.config.metadata;
                await this.plugin.saveSettings();
            }

            // Check for file collision before starting export
            const extension = exportConfig.format;
            const fullPath = `${exportConfig.location}/${exportConfig.filename}.${extension}`;
            const fileExists = this.app.vault.getAbstractFileByPath(fullPath);

            if (fileExists) {
                // Show collision modal
                logger.info('export-modal', 'File collision detected, showing resolution modal');

                const { FileCollisionModal } = require('./FileCollisionModal');
                const collisionModal = new FileCollisionModal(
                    this.app,
                    fullPath,
                    (resolution: CollisionResolution | null) => {
                        if (!resolution) {
                            // User cancelled
                            logger.info('export-modal', 'Export cancelled by user (file collision)');
                            return;
                        }

                        // Update config based on resolution
                        if (resolution.action === 'rename' && resolution.newFilename) {
                            // Remove extension from new filename
                            const nameWithoutExt = resolution.newFilename.substring(
                                0,
                                resolution.newFilename.lastIndexOf('.')
                            );
                            exportConfig.filename = nameWithoutExt;
                            exportConfig.onCollision = 'cancel'; // After rename, don't allow collision
                        } else {
                            exportConfig.onCollision = resolution.action;
                        }

                        logger.info('export-modal', 'File collision resolved', { resolution, newFilename: exportConfig.filename });

                        // Start export with resolved config
                        this.proceedWithExport(exportConfig);
                    }
                );
                collisionModal.open();
                return; // Don't close this modal yet
            }

            // No collision, proceed directly
            await this.proceedWithExport(exportConfig);

        } catch (error) {
            logger.error('export-modal', 'Export start failed:', error);
            new Notice(`Export failed: ${error.message}`);
        }
    }

    /**
     * Proceed with export after collision resolution (if any)
     */
    private async proceedWithExport(exportConfig: ExportConfig): Promise<void> {
        logger.info('export-modal', 'Starting export with config:', exportConfig);

        // Close this modal
        this.close();

        // Open progress modal
        const progressModal = new ExportProgressModal(this.app, this.exporter, exportConfig);
        progressModal.open();
    }

    /**
     * Update quality dropdown options based on selected format
     */
    private updateQualityOptions(): void {
        if (!this.qualityDropdown) return;

        // Clear existing options
        this.qualityDropdown.selectEl.empty();

        const format = this.config.format || 'wav';

        if (format === 'wav') {
            this.qualityDropdown
                .addOption('high', 'High Quality (48kHz, 16-bit)')
                .addOption('lossless', 'Lossless (48kHz, 24-bit)')
                .addOption('standard', 'Standard (44.1kHz, 16-bit)')
                .setValue('high');
            this.config.quality = this.getQualityFromPreset('high');
        } else if (format === 'mp3') {
            this.qualityDropdown
                .addOption('high', 'High Quality (320 kbps)')
                .addOption('standard', 'Standard (192 kbps)')
                .addOption('small', 'Small Size (128 kbps)')
                .setValue('high');
            this.config.quality = this.getQualityFromPreset('high');
        }

        this.updateEstimate();
    }

    /**
     * Update location input based on location type
     */
    private updateLocationInput(): void {
        if (this.locationInput) {
            if (this.config.locationType === 'vault') {
                this.locationInput.setValue(this.config.location || 'Sonigraph Exports');
            } else {
                // System location
                this.locationInput.setValue(''); // User will need to browse
            }
        }
    }

    /**
     * Update estimate display
     */
    private updateEstimate(): void {
        if (!this.estimateDisplay) return;

        const duration = this.estimateDuration();
        const fileSize = this.estimateFileSize(duration);
        const renderTime = this.estimateRenderTime(duration);

        this.estimateDisplay.empty();
        const box = this.estimateDisplay.createDiv('export-estimate-box');
        box.createEl('div', { text: `Estimated size: ${this.formatBytes(fileSize)}` });
        box.createEl('div', { text: `Estimated time: ~${renderTime} seconds` });
    }

    /**
     * Generate default filename
     */
    private generateFilename(): string {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
        return `sonigraph-${date}-${time}`;
    }

    /**
     * Get quality settings for format from plugin settings
     */
    private getQualityForFormat(format: AudioFormat, exportSettings: any): any {
        if (!exportSettings?.audioQuality) {
            return { sampleRate: 48000, bitDepth: 16 };
        }
        return exportSettings.audioQuality[format] || { sampleRate: 48000, bitDepth: 16 };
    }

    /**
     * Get quality settings from preset
     */
    private getQualityFromPreset(preset: QualityPreset): any {
        const format = this.config.format || 'wav';

        if (format === 'wav') {
            switch (preset) {
                case 'high':
                    return { sampleRate: 48000, bitDepth: 16 };
                case 'lossless':
                    return { sampleRate: 48000, bitDepth: 24 };
                case 'standard':
                    return { sampleRate: 44100, bitDepth: 16 };
                default:
                    return { sampleRate: 48000, bitDepth: 16 };
            }
        } else if (format === 'mp3') {
            switch (preset) {
                case 'high':
                    return { sampleRate: 48000, bitRate: 320 };
                case 'standard':
                    return { sampleRate: 48000, bitRate: 192 };
                case 'small':
                    return { sampleRate: 44100, bitRate: 128 };
                default:
                    return { sampleRate: 48000, bitRate: 192 };
            }
        }

        return { sampleRate: 48000, bitDepth: 16 };
    }

    /**
     * Estimate export duration in seconds
     */
    private estimateDuration(): number {
        if (this.config.scope === 'custom-range' && this.config.customRange) {
            return (this.config.customRange.end - this.config.customRange.start) / 1000;
        }
        return this.animator?.config.duration || 60;
    }

    /**
     * Estimate file size in bytes
     */
    private estimateFileSize(duration: number): number {
        const quality = this.config.quality as any;
        const format = this.config.format || 'wav';

        if (format === 'wav') {
            const sampleRate = quality?.sampleRate || 48000;
            const bitDepth = quality?.bitDepth || 16;
            const numChannels = 2; // Stereo

            // Calculate raw PCM size
            const bytesPerSample = bitDepth / 8;
            const dataSize = duration * sampleRate * numChannels * bytesPerSample;

            // Add WAV header (44 bytes)
            return dataSize + 44;
        } else if (format === 'mp3') {
            const bitRate = quality?.bitRate || 192;
            // MP3 file size = (bitrate in kbps * duration in seconds * 1000) / 8
            return (bitRate * duration * 1000) / 8;
        }

        // Default estimate (WAV)
        return duration * 48000 * 2 * 2 + 44;
    }

    /**
     * Estimate render time in seconds
     */
    private estimateRenderTime(duration: number): number {
        // Offline rendering is typically 5-10x faster than realtime
        // Conservative estimate: 8x realtime
        return Math.ceil(duration / 8);
    }

    /**
     * Format bytes to human-readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Get list of enabled effects for note generation
     */
    private getEnabledEffects(): string[] {
        const effects: string[] = [];
        const settingsEffects = this.plugin.settings.effects;

        if (!settingsEffects) {
            return effects;
        }

        // Check each effect
        for (const [effectName, effectConfig] of Object.entries(settingsEffects)) {
            if (effectConfig?.enabled) {
                // Capitalize first letter of effect name
                const displayName = effectName.charAt(0).toUpperCase() + effectName.slice(1);
                effects.push(displayName);
            }
        }

        return effects;
    }

    /**
     * Get list of enabled instruments for note generation
     */
    private getEnabledInstruments(): string[] {
        const instruments: string[] = [];
        const settings = this.plugin.settings.instruments;

        // Check each individual instrument
        for (const [instrumentKey, instrumentConfig] of Object.entries(settings)) {
            if (instrumentConfig?.enabled) {
                // Get display name from config or format the key
                const displayName = this.formatInstrumentName(instrumentKey);
                instruments.push(displayName);
            }
        }

        return instruments.sort(); // Sort alphabetically
    }

    /**
     * Format instrument key to display name
     */
    private formatInstrumentName(key: string): string {
        // Handle special cases
        const specialNames: Record<string, string> = {
            'frenchHorn': 'French Horn',
            'electricPiano': 'Electric Piano',
            'guitarElectric': 'Electric Guitar',
            'guitarNylon': 'Nylon Guitar',
            'bassElectric': 'Electric Bass',
            'leadSynth': 'Lead Synth',
            'bassSynth': 'Bass Synth',
            'arpSynth': 'Arp Synth',
            'whaleHumpback': 'Humpback Whale',
            'whaleBlue': 'Blue Whale',
            'whaleOrca': 'Orca',
            'whaleGray': 'Gray Whale',
            'whaleSperm': 'Sperm Whale',
            'whaleMinke': 'Minke Whale',
            'whaleFin': 'Fin Whale',
            'whaleRight': 'Right Whale',
            'whaleSei': 'Sei Whale',
            'whalePilot': 'Pilot Whale'
        };

        if (specialNames[key]) {
            return specialNames[key];
        }

        // Default: capitalize first letter
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    /**
     * Show/hide custom range inputs based on scope selection
     */
    private updateCustomRangeVisibility(): void {
        if (!this.customRangeContainer) return;

        if (this.config.scope === 'custom-range') {
            this.customRangeContainer.style.display = 'block';
        } else {
            this.customRangeContainer.style.display = 'none';
        }
    }

    /**
     * Update custom range in config based on input values
     */
    private updateCustomRange(): void {
        if (!this.startTimeInput || !this.endTimeInput) return;

        const startValue = this.startTimeInput.getValue().trim();
        const endValue = this.endTimeInput.getValue().trim();

        // Parse time values (support both seconds and MM:SS format)
        const start = this.parseTimeInput(startValue);
        const end = this.parseTimeInput(endValue);

        // Validate
        const maxDuration = this.animator?.config.duration || 60;
        const validStart = Math.max(0, Math.min(start, maxDuration));
        const validEnd = Math.max(validStart + 1, Math.min(end, maxDuration));

        // Update config
        this.config.customRange = {
            start: validStart * 1000, // Convert to milliseconds
            end: validEnd * 1000
        };

        // Update estimate
        this.updateEstimate();
    }

    /**
     * Parse time input (supports seconds or MM:SS format)
     */
    private parseTimeInput(value: string): number {
        if (!value) return 0;

        // Check if it's in MM:SS format
        if (value.includes(':')) {
            const parts = value.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0], 10) || 0;
                const seconds = parseInt(parts[1], 10) || 0;
                return minutes * 60 + seconds;
            }
        }

        // Otherwise, treat as seconds
        return parseFloat(value) || 0;
    }
}
