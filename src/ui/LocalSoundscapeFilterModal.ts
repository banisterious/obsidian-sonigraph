import { App, Modal, Setting, TFolder } from 'obsidian';
import { getLogger } from '../logging';

const logger = getLogger('LocalSoundscapeFilterModal');

export interface LocalSoundscapeFilters {
	includeTags: string[];
	excludeTags: string[];
	includeFolders: string[];
	excludeFolders: string[];
	includeFileTypes: string[];
	linkDirections: ('incoming' | 'outgoing' | 'bidirectional')[];
}

export class LocalSoundscapeFilterModal extends Modal {
	private filters: LocalSoundscapeFilters;
	private onApply: (filters: LocalSoundscapeFilters) => void;
	private allTags: string[];
	private allFolders: string[];

	constructor(
		app: App,
		currentFilters: LocalSoundscapeFilters,
		onApply: (filters: LocalSoundscapeFilters) => void
	) {
		super(app);
		this.filters = { ...currentFilters };
		this.onApply = onApply;

		// Collect all tags and folders from vault
		this.allTags = this.getAllTags();
		this.allFolders = this.getAllFolders();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('local-soundscape-filter-modal');

		contentEl.createEl('h2', { text: 'Filter Local Soundscape' });

		// Tag filters section
		this.createTagFiltersSection(contentEl);

		// Folder filters section
		this.createFolderFiltersSection(contentEl);

		// File type filters section
		this.createFileTypeFiltersSection(contentEl);

		// Link direction filters section
		this.createLinkDirectionFiltersSection(contentEl);

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

		const clearButton = buttonContainer.createEl('button', { text: 'Clear All' });
		clearButton.addEventListener('click', () => {
			this.clearAllFilters();
		});

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		const applyButton = buttonContainer.createEl('button', {
			text: 'Apply',
			cls: 'mod-cta'
		});
		applyButton.addEventListener('click', () => {
			this.applyFilters();
		});
	}

	private createTagFiltersSection(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'filter-section' });
		section.createEl('h3', { text: 'Tag Filters' });

		// Include tags
		new Setting(section)
			.setName('Include tags')
			.setDesc('Only show notes with these tags (leave empty for all)')
			.addText(text => {
				text.setPlaceholder('tag1, tag2, tag3')
					.setValue(this.filters.includeTags.join(', '))
					.onChange(value => {
						this.filters.includeTags = value
							.split(',')
							.map(t => t.trim())
							.filter(t => t.length > 0);
					});
				text.inputEl.style.width = '100%';
			});

		// Exclude tags
		new Setting(section)
			.setName('Exclude tags')
			.setDesc('Hide notes with these tags')
			.addText(text => {
				text.setPlaceholder('exclude1, exclude2')
					.setValue(this.filters.excludeTags.join(', '))
					.onChange(value => {
						this.filters.excludeTags = value
							.split(',')
							.map(t => t.trim())
							.filter(t => t.length > 0);
					});
				text.inputEl.style.width = '100%';
			});

		// Show available tags
		if (this.allTags.length > 0) {
			const tagList = section.createDiv({ cls: 'filter-tag-list' });
			tagList.createEl('div', { text: 'Available tags:', cls: 'filter-list-label' });
			const tagCloud = tagList.createDiv({ cls: 'filter-tag-cloud' });
			this.allTags.slice(0, 20).forEach(tag => {
				const tagEl = tagCloud.createEl('span', { text: tag, cls: 'filter-tag' });
				tagEl.addEventListener('click', () => {
					if (!this.filters.includeTags.includes(tag)) {
						this.filters.includeTags.push(tag);
						this.refresh();
					}
				});
			});
			if (this.allTags.length > 20) {
				tagCloud.createEl('span', {
					text: `+${this.allTags.length - 20} more...`,
					cls: 'filter-tag-more'
				});
			}
		}
	}

	private createFolderFiltersSection(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'filter-section' });
		section.createEl('h3', { text: 'Folder Filters' });

		// Include folders
		new Setting(section)
			.setName('Include folders')
			.setDesc('Only show notes from these folders (leave empty for all)')
			.addText(text => {
				text.setPlaceholder('folder1, folder2/subfolder')
					.setValue(this.filters.includeFolders.join(', '))
					.onChange(value => {
						this.filters.includeFolders = value
							.split(',')
							.map(f => f.trim())
							.filter(f => f.length > 0);
					});
				text.inputEl.style.width = '100%';
			});

		// Exclude folders
		new Setting(section)
			.setName('Exclude folders')
			.setDesc('Hide notes from these folders')
			.addText(text => {
				text.setPlaceholder('archive, templates')
					.setValue(this.filters.excludeFolders.join(', '))
					.onChange(value => {
						this.filters.excludeFolders = value
							.split(',')
							.map(f => f.trim())
							.filter(f => f.length > 0);
					});
				text.inputEl.style.width = '100%';
			});

		// Show available folders
		if (this.allFolders.length > 0) {
			const folderList = section.createDiv({ cls: 'filter-folder-list' });
			folderList.createEl('div', { text: 'Available folders:', cls: 'filter-list-label' });
			const folderCloud = folderList.createDiv({ cls: 'filter-folder-cloud' });
			this.allFolders.slice(0, 10).forEach(folder => {
				const folderEl = folderCloud.createEl('span', { text: folder, cls: 'filter-folder' });
				folderEl.addEventListener('click', () => {
					if (!this.filters.includeFolders.includes(folder)) {
						this.filters.includeFolders.push(folder);
						this.refresh();
					}
				});
			});
			if (this.allFolders.length > 10) {
				folderCloud.createEl('span', {
					text: `+${this.allFolders.length - 10} more...`,
					cls: 'filter-folder-more'
				});
			}
		}
	}

	private createFileTypeFiltersSection(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'filter-section' });
		section.createEl('h3', { text: 'File Type Filters' });

		const fileTypes = ['md', 'pdf', 'image', 'audio', 'video'];

		new Setting(section)
			.setName('Include file types')
			.setDesc('Only show these file types (leave empty for all)');

		const checkboxContainer = section.createDiv({ cls: 'filter-checkbox-group' });
		fileTypes.forEach(type => {
			const label = checkboxContainer.createEl('label', { cls: 'filter-checkbox-label' });
			const checkbox = label.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.filters.includeFileTypes.includes(type);
			checkbox.addEventListener('change', () => {
				if (checkbox.checked) {
					this.filters.includeFileTypes.push(type);
				} else {
					this.filters.includeFileTypes = this.filters.includeFileTypes.filter(t => t !== type);
				}
			});
			label.createSpan({ text: ` ${type}` });
		});
	}

	private createLinkDirectionFiltersSection(container: HTMLElement): void {
		const section = container.createDiv({ cls: 'filter-section' });
		section.createEl('h3', { text: 'Link Direction Filters' });

		new Setting(section)
			.setName('Show link directions')
			.setDesc('Which link types to display');

		const checkboxContainer = section.createDiv({ cls: 'filter-checkbox-group' });

		const directions: Array<{value: 'incoming' | 'outgoing' | 'bidirectional', label: string}> = [
			{ value: 'incoming', label: 'Incoming links' },
			{ value: 'outgoing', label: 'Outgoing links' },
			{ value: 'bidirectional', label: 'Bidirectional links' }
		];

		directions.forEach(({ value, label }) => {
			const labelEl = checkboxContainer.createEl('label', { cls: 'filter-checkbox-label' });
			const checkbox = labelEl.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.filters.linkDirections.includes(value);
			checkbox.addEventListener('change', () => {
				if (checkbox.checked) {
					this.filters.linkDirections.push(value);
				} else {
					this.filters.linkDirections = this.filters.linkDirections.filter(d => d !== value);
				}
			});
			labelEl.createSpan({ text: ` ${label}` });
		});
	}

	private getAllTags(): string[] {
		const tags = new Set<string>();
		const files = this.app.vault.getMarkdownFiles();

		files.forEach(file => {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache?.tags) {
				cache.tags.forEach(tagCache => {
					// Remove the # prefix from tags
					const tag = tagCache.tag.startsWith('#') ? tagCache.tag.slice(1) : tagCache.tag;
					tags.add(tag);
				});
			}
			// Also check frontmatter tags
			if (cache?.frontmatter?.tags) {
				const fmTags = cache.frontmatter.tags;
				if (Array.isArray(fmTags)) {
					fmTags.forEach(tag => tags.add(tag));
				} else if (typeof fmTags === 'string') {
					tags.add(fmTags);
				}
			}
		});

		return Array.from(tags).sort();
	}

	private getAllFolders(): string[] {
		const folders: string[] = [];
		const rootFolder = this.app.vault.getRoot();

		const collectFolders = (folder: TFolder) => {
			if (folder.path !== '/') {
				folders.push(folder.path);
			}
			folder.children.forEach(child => {
				if (child instanceof TFolder) {
					collectFolders(child);
				}
			});
		};

		collectFolders(rootFolder);
		return folders.sort();
	}

	private clearAllFilters(): void {
		this.filters = {
			includeTags: [],
			excludeTags: [],
			includeFolders: [],
			excludeFolders: [],
			includeFileTypes: [],
			linkDirections: []
		};
		this.refresh();
	}

	private refresh(): void {
		this.close();
		this.open();
	}

	private applyFilters(): void {
		logger.info('filters-applied', 'Applying filters', this.filters);
		this.onApply(this.filters);
		this.close();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
