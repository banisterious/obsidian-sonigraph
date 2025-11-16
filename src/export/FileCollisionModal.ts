/**
 * File Collision Modal - Handle existing file conflicts
 *
 * Shows when attempting to export to a filename that already exists.
 * Allows user to choose: cancel, overwrite, or rename.
 */

import { App, Modal, Notice, TFile } from 'obsidian';
import { CollisionBehavior } from './types';
import { getLogger } from '../logging';

const logger = getLogger('file-collision');

/**
 * Result from file collision resolution
 */
export interface CollisionResolution {
    action: CollisionBehavior;
    newFilename?: string; // If action is 'rename'
}

/**
 * Modal for resolving file collisions
 */
export class FileCollisionModal extends Modal {
    private filePath: string;
    private existingFile: TFile | null;
    private resolveCallback: (resolution: CollisionResolution | null) => void;
    private suggestedName: string;

    constructor(
        app: App,
        filePath: string,
        resolveCallback: (resolution: CollisionResolution | null) => void
    ) {
        super(app);
        this.filePath = filePath;
        this.resolveCallback = resolveCallback;
        const file = this.app.vault.getAbstractFileByPath(filePath);
        this.existingFile = (file && file instanceof TFile) ? file : null;

        // Generate suggested alternative filename
        this.suggestedName = this.generateAlternativeName(filePath);
    }

    onOpen() {
        const { contentEl } = this;
        void contentEl.empty();
        void contentEl.addClass('sonigraph-file-collision-modal');

        // Header
        contentEl.createEl('h2', { text: 'File Already Exists' });

        // File info
        const infoContainer = contentEl.createDiv('collision-info');
        infoContainer.createEl('p', {
            text: 'The file already exists:',
            cls: 'collision-message'
        });

        const fileInfoBox = infoContainer.createDiv('collision-file-info');
        fileInfoBox.createEl('div', {
            text: this.getFileName(this.filePath),
            cls: 'collision-filename'
        });

        // Show existing file details if available
        if (this.existingFile) {
            const stats = this.existingFile.stat;
            const modified = new Date(stats.mtime);
            const size = this.formatFileSize(stats.size);

            fileInfoBox.createEl('div', {
                text: `Last modified: ${modified.toLocaleString()}`,
                cls: 'collision-file-detail'
            });
            fileInfoBox.createEl('div', {
                text: `Size: ${size}`,
                cls: 'collision-file-detail'
            });
        }

        // Options
        const optionsContainer = contentEl.createDiv('collision-options');
        optionsContainer.createEl('p', {
            text: 'What would you like to do?',
            cls: 'collision-prompt'
        });

        // Radio button group
        const radioGroup = optionsContainer.createDiv('collision-radio-group');

        // Option 1: Cancel (default)
        this.createRadioOption(
            radioGroup,
            'cancel',
            'Cancel export',
            'Do not export the file',
            true // Default selected
        );

        // Option 2: Overwrite
        this.createRadioOption(
            radioGroup,
            'overwrite',
            'Overwrite existing file',
            'Replace the existing file with the new export'
        );

        // Option 3: Rename
        const renameContainer = radioGroup.createDiv('collision-option');
        const renameRadio = renameContainer.createEl('input', {
            type: 'radio',
            attr: { name: 'collision-action', value: 'rename' }
        });
        renameRadio.id = 'collision-rename';

        const renameLabel = renameContainer.createEl('label', {
            attr: { for: 'collision-rename' }
        });
        renameLabel.createEl('strong', { text: 'Rename new file' });

        // Filename input
        const renameInputContainer = renameContainer.createDiv('collision-rename-input-container');
        const renameInput = renameInputContainer.createEl('input', {
            type: 'text',
            value: this.getFileNameWithoutExtension(this.suggestedName),
            cls: 'collision-rename-input'
        });

        const extension = this.getFileExtension(this.filePath);
        renameInputContainer.createEl('span', {
            text: `.${extension}`,
            cls: 'collision-extension'
        });

        // Enable/disable input based on radio selection
        renameInput.disabled = true;
        renameRadio.addEventListener('change', () => {
            renameInput.disabled = !renameRadio.checked;
            if (renameRadio.checked) {
                void renameInput.focus();
                void renameInput.select();
            }
        });

        // Clicking input selects radio
        renameInput.addEventListener('focus', () => {
            renameRadio.checked = true;
            renameRadio.dispatchEvent(new Event('change'));
        });

        // Action buttons
        const buttonContainer = contentEl.createDiv('collision-buttons');

        // Cancel button
        buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-cancel'
        }).addEventListener('click', () => {
            void this.resolve(null);
        });

        // Continue button
        const continueBtn = buttonContainer.createEl('button', {
            text: 'Continue',
            cls: 'mod-cta'
        });
        continueBtn.addEventListener('click', () => {
            const selectedRadio = radioGroup.querySelector('input[name="collision-action"]:checked');

            if (!selectedRadio) {
                new Notice('Please select an option');
                return;
            }

            const action = selectedRadio.value as CollisionBehavior;

            if (action === 'rename') {
                const newName = renameInput.value.trim();
                if (!newName) {
                    new Notice('Please enter a filename');
                    void renameInput.focus();
                    return;
                }

                // Validate filename
                if (this.containsInvalidCharacters(newName)) {
                    new Notice('Filename contains invalid characters');
                    void renameInput.focus();
                    return;
                }

                this.resolve({
                    action: 'rename',
                    newFilename: `${newName}.${extension}`
                });
            } else {
                this.resolve({ action });
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        void contentEl.empty();
    }

    /**
     * Create a radio button option
     */
    private createRadioOption(
        container: HTMLElement,
        value: string,
        label: string,
        description: string,
        defaultChecked = false
    ): HTMLInputElement {
        const optionDiv = container.createDiv('collision-option');

        const radio = optionDiv.createEl('input', {
            type: 'radio',
            attr: {
                name: 'collision-action',
                value,
                ...(defaultChecked && { checked: '' })
            }
        });
        radio.id = `collision-${value}`;

        const labelEl = optionDiv.createEl('label', {
            attr: { for: `collision-${value}` }
        });

        labelEl.createEl('strong', { text: label });
        labelEl.createEl('div', {
            text: description,
            cls: 'collision-option-description'
        });

        return radio;
    }

    /**
     * Resolve the collision
     */
    private resolve(resolution: CollisionResolution | null): void {
        logger.info('file-collision', 'Collision resolved', { resolution });
        void this.resolveCallback(resolution);
        void this.close();
    }

    /**
     * Generate alternative filename by appending number
     */
    private generateAlternativeName(filePath: string): string {
        const nameWithoutExt = this.getFileNameWithoutExtension(filePath);
        const extension = this.getFileExtension(filePath);
        const directory = this.getDirectory(filePath);

        let counter = 1;
        let newPath: string;

        do {
            const newName = `${nameWithoutExt}-${counter}`;
            newPath = directory ? `${directory}/${newName}.${extension}` : `${newName}.${extension}`;
            counter++;
        } while (this.app.vault.getAbstractFileByPath(newPath));

        return newPath;
    }

    /**
     * Get filename from path
     */
    private getFileName(filePath: string): string {
        return filePath.split('/').pop() || filePath;
    }

    /**
     * Get filename without extension
     */
    private getFileNameWithoutExtension(filePath: string): string {
        const filename = this.getFileName(filePath);
        return filename.substring(0, filename.lastIndexOf('.')) || filename;
    }

    /**
     * Get file extension
     */
    private getFileExtension(filePath: string): string {
        const filename = this.getFileName(filePath);
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    /**
     * Get directory from path
     */
    private getDirectory(filePath: string): string {
        const parts = filePath.split('/');
        void parts.pop();
        return parts.join('/');
    }

    /**
     * Check if filename contains invalid characters
     */
    private containsInvalidCharacters(filename: string): boolean {
        // Obsidian/filesystem invalid characters
        const invalidChars = /[\\/:*?"<>|]/;
        return invalidChars.test(filename);
    }

    /**
     * Format file size for display
     */
    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
