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
    private formatDropdown?: DropdownComponent;
    private qualityDropdown?: DropdownComponent;
    private locationTypeDropdown?: DropdownComponent;
    private locationInput?: TextComponent;
    private filenameInput?: TextComponent;
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
        this.exporter = new AudioExporter(app, audioEngine);

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
        this.createScopeSection(contentEl);
        this.createFormatSection(contentEl);
        this.createLocationSection(contentEl);
        this.createFilenameSection(contentEl);
        this.createEstimateDisplay(contentEl);
        this.createAdvancedSection(contentEl);
        this.createActionButtons(contentEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
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
                        this.updateEstimate();
                    });
            });

        // TODO: Add custom range inputs when custom-range is selected
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
            .setDesc('Audio file format')
            .addDropdown(dropdown => {
                this.formatDropdown = dropdown;

                dropdown
                    .addOption('wav', 'WAV (Lossless Audio)')
                    // Phase 2:
                    // .addOption('mp3', 'MP3 (Compressed Audio)')
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
                includeSettingsSummary: this.config.includeSettingsSummary!
            };

            logger.info('export-modal', 'Starting export with config:', exportConfig);

            // Close this modal
            this.close();

            // Open progress modal
            const progressModal = new ExportProgressModal(this.app, this.exporter, exportConfig);
            progressModal.open();

        } catch (error) {
            logger.error('export-modal', 'Export start failed:', error);
            new Notice(`Export failed: ${error.message}`);
        }
    }

    /**
     * Update quality dropdown options based on selected format
     */
    private updateQualityOptions(): void {
        // For Phase 1, WAV only, so no changes needed
        // Phase 2 will add format-specific quality options
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
        const sampleRate = quality?.sampleRate || 48000;
        const bitDepth = quality?.bitDepth || 16;
        const numChannels = 2; // Stereo

        // Calculate raw PCM size
        const bytesPerSample = bitDepth / 8;
        const dataSize = duration * sampleRate * numChannels * bytesPerSample;

        // Add WAV header (44 bytes)
        return dataSize + 44;
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
}
