/**
 * Export Progress Modal - Real-time export progress display
 *
 * Shows export progress with percentage, current stage, and cancel option.
 * Adapts display based on export length (simple for short, detailed for long).
 */

import { App, Modal, Notice } from 'obsidian';
import { AudioExporter } from './AudioExporter';
import { ExportConfig, ExportProgress, ExportResult } from './types';
import { getLogger } from '../logging';

const logger = getLogger('export-progress');

/**
 * Progress modal for active exports
 */
export class ExportProgressModal extends Modal {
    private exporter: AudioExporter;
    private config: ExportConfig;
    private isCancelled = false;

    // UI elements
    private progressBar?: HTMLElement;
    private progressFill?: HTMLElement;
    private percentageText?: HTMLElement;
    private stageText?: HTMLElement;
    private detailsContainer?: HTMLElement;
    private cancelButton?: HTMLButtonElement;

    constructor(app: App, exporter: AudioExporter, config: ExportConfig) {
        super(app);
        this.exporter = exporter;
        this.config = config;
    }

    onOpen() {
        const { contentEl } = this;
        void contentEl.empty();
        void contentEl.addClass('sonigraph-export-progress-modal');

        // Header
        contentEl.createEl('h2', { text: 'Exporting...' });

        // Progress bar
        const progressContainer = contentEl.createDiv('export-progress-container');
        this.progressBar = progressContainer.createDiv('export-progress-bar');
        this.progressFill = this.progressBar.createDiv('export-progress-fill');

        // Percentage display
        this.percentageText = contentEl.createDiv('export-progress-percentage');
        this.percentageText.textContent = '0%';

        // Stage/step display
        this.stageText = contentEl.createDiv('export-progress-stage');
        this.stageText.textContent = 'Preparing export...';

        // Details container (optional, for longer exports)
        this.detailsContainer = contentEl.createDiv('export-progress-details');

        // Cancel button
        const buttonContainer = contentEl.createDiv('export-progress-buttons');
        this.cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        });
        this.cancelButton.addEventListener('click', () => {
            void this.cancelExport();
        });

        // Start export
        void this.startExport();
    }

    onClose() {
        const { contentEl } = this;
        void contentEl.empty();
    }

    /**
     * Start the export process
     */
    private async startExport(): Promise<void> {
        try {
            // Set progress callback
            this.exporter.setProgressCallback((progress: ExportProgress) => {
                void this.updateProgress(progress);
            });

            // Execute export
            const result = await this.exporter.export(this.config);

            // Handle result
            if (this.isCancelled) {
                new Notice('Export cancelled');
                void logger.info('export-progress', 'Export cancelled by user');
            } else if (result.success) {
                void this.showSuccess(result);
            } else {
                void this.showError(result);
            }

        } catch (error) {
            void logger.error('export-progress', 'Export failed:', error);
            new Notice(`Export failed: ${error.message}`);
        } finally {
            // Close modal after a short delay
            setTimeout(() => {
                if (!this.isCancelled) {
                    void this.close();
                }
            }, 2000);
        }
    }

    /**
     * Update progress display
     */
    private updateProgress(progress: ExportProgress): void {
        // Update percentage
        if (this.percentageText) {
            this.percentageText.textContent = `${Math.round(progress.percentage)}%`;
        }

        // Update progress bar
        if (this.progressFill) {
            this.progressFill.style.width = `${progress.percentage}%`;
        }

        // Update stage text
        if (this.stageText) {
            this.stageText.textContent = progress.currentStep;
        }

        // Show details for longer exports (> 30 seconds estimated)
        if (progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 30) {
            if (this.detailsContainer) {
                this.detailsContainer.addClass('export-progress-details--visible');
                this.detailsContainer.empty();

                // Stage indicator
                const stageIndicator = this.detailsContainer.createDiv('export-progress-stage-indicator');
                stageIndicator.createEl('strong', { text: 'Stage: ' });
                stageIndicator.createEl('span', { text: this.formatStage(progress.stage) });

                // Time remaining
                if (progress.estimatedTimeRemaining) {
                    const timeRemaining = this.detailsContainer.createDiv('export-progress-time');
                    timeRemaining.createEl('strong', { text: 'Time remaining: ' });
                    timeRemaining.createEl('span', {
                        text: this.formatTime(progress.estimatedTimeRemaining)
                    });
                }
            }
        }
    }

    /**
     * Show success message
     */
    private showSuccess(result: ExportResult): void {
        if (!this.stageText || !this.percentageText) return;

        this.percentageText.textContent = '100%';
        this.stageText.textContent = 'Export complete!';
        this.stageText.addClass('export-success');

        if (this.cancelButton) {
            this.cancelButton.disabled = true;
        }

        // Show success notice with file info
        const fileSizeMB = result.fileSize ? (result.fileSize / (1024 * 1024)).toFixed(1) : '?';
        new Notice(`Export complete: ${result.filePath} (${fileSizeMB} MB)`);

        logger.info('export-progress', `Export successful: ${result.filePath}`, {
            fileSize: result.fileSize,
            duration: result.duration,
            notePath: result.notePath
        });
    }

    /**
     * Show error message
     */
    private showError(result: ExportResult): void {
        if (!this.stageText) return;

        this.stageText.textContent = `Export failed: ${result.error?.message || 'Unknown error'}`;
        this.stageText.addClass('export-error');

        if (this.cancelButton) {
            this.cancelButton.textContent = 'Close';
            this.cancelButton.classList.remove('mod-warning');
        }

        new Notice(`Export failed: ${result.error?.message || 'Unknown error'}`);

        void logger.error('export-progress', 'Export failed:', result.error);
    }

    /**
     * Cancel export
     */
    private cancelExport(): void {
        if (this.isCancelled) return;

        this.isCancelled = true;
        this.exporter.cancel();

        if (this.stageText) {
            this.stageText.textContent = 'Cancelling...';
        }

        if (this.cancelButton) {
            this.cancelButton.disabled = true;
            this.cancelButton.textContent = 'Cancelling...';
        }

        void logger.info('export-progress', 'User requested export cancellation');
    }

    /**
     * Format stage name for display
     */
    private formatStage(stage: ExportProgress['stage']): string {
        switch (stage) {
            case 'validating':
                return 'Validating configuration';
            case 'rendering':
                return 'Rendering audio';
            case 'encoding':
                return 'Encoding to format';
            case 'writing':
                return 'Writing file';
            case 'complete':
                return 'Complete';
            case 'error':
                return 'Error';
            default:
                return stage;
        }
    }

    /**
     * Format time in seconds to human-readable string
     */
    private formatTime(seconds: number): string {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);

        if (minutes < 60) {
            return `${minutes}m ${remainingSeconds}s`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
}
