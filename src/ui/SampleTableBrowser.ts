/**
 * Table-based Sample Browser Component
 *
 * Provides a professional data table UI for browsing, filtering, and managing
 * Freesound samples with sortable columns, search, and tag filtering.
 */

import { App, Notice, requestUrl, Modal, setIcon } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger } from '../logging';
import { FreesoundSample } from '../audio/layers/types';

const logger = getLogger('SampleTableBrowser');

/**
 * Extended FreesoundSample with additional optional fields used in the UI
 */
interface ExtendedFreesoundSample extends FreesoundSample {
	name?: string;
	author?: string;
	tags?: string[];
	description?: string;
}

interface TableSortState {
	column: string;
	direction: 'asc' | 'desc';
}

interface TableFilters {
	search: string;
	tag: string;
	license: string;
	showDisabled: boolean;
}

export class SampleTableBrowser {
	private app: App;
	private plugin: SonigraphPlugin;
	private container: HTMLElement;

	private sortState: TableSortState = { column: 'name', direction: 'asc' };
	private filters: TableFilters = { search: '', tag: '', license: '', showDisabled: true };

	private currentPreviewAudio: HTMLAudioElement | null = null;
	private currentPreviewButton: HTMLButtonElement | null = null;

	constructor(app: App, plugin: SonigraphPlugin, container: HTMLElement) {
		this.app = app;
		this.plugin = plugin;
		this.container = container;
	}

	/**
	 * Render the complete table browser
	 */
	render(): void {
		this.container.empty();

		// Header with title and actions
		void this.renderHeader();

		// Filter controls
		void this.renderFilters();

		// Sample table
		void this.renderTable();
	}

	/**
	 * Render header with title and search button
	 */
	private renderHeader(): void {
		const header = this.container.createDiv({ cls: 'sonigraph-sample-table-header' });

		const titleRow = header.createDiv({ cls: 'sonigraph-sample-table-title-row' });
		titleRow.createEl('h4', { text: 'Sample library', cls: 'sonigraph-sample-table-title' });

		const searchBtn = titleRow.createEl('button', {
			text: 'Search Freesound',
			cls: 'sonigraph-sample-table-search-btn'
		});
		searchBtn.addEventListener('click', () => void this.openFreesoundSearch());
	}

	/**
	 * Render filter controls
	 */
	private renderFilters(): void {
		const filterRow = this.container.createDiv({ cls: 'sonigraph-sample-table-filters' });

		// Search input
		const searchInput = filterRow.createEl('input', {
			type: 'text',
			placeholder: 'Search samples...',
			cls: 'sonigraph-sample-table-filter-search'
		});
		searchInput.value = this.filters.search;
		searchInput.addEventListener('input', (e) => {
			this.filters.search = (e.target as HTMLInputElement).value;
			void this.renderTable();
		});

		// Tag filter
		const tagFilter = filterRow.createEl('select', { cls: 'sonigraph-sample-table-filter-tag' });
		void this.populateTagFilter(tagFilter);
		tagFilter.value = this.filters.tag;
		tagFilter.addEventListener('change', (e) => {
			this.filters.tag = (e.target as HTMLSelectElement).value;
			void this.renderTable();
		});

		// License filter
		const licenseFilter = filterRow.createEl('select', { cls: 'sonigraph-sample-table-filter-license' });
		void this.populateLicenseFilter(licenseFilter);
		licenseFilter.value = this.filters.license;
		licenseFilter.addEventListener('change', (e) => {
			this.filters.license = (e.target as HTMLSelectElement).value;
			void this.renderTable();
		});

		// Show disabled toggle
		const toggleLabel = filterRow.createEl('label', { cls: 'sonigraph-sample-table-filter-toggle' });
		const toggleCheck = toggleLabel.createEl('input', { type: 'checkbox' });
		toggleCheck.checked = this.filters.showDisabled;
		toggleCheck.addEventListener('change', (e) => {
			this.filters.showDisabled = (e.target as HTMLInputElement).checked;
			void this.renderTable();
		});
		void toggleLabel.appendText(' Show disabled');
	}

	/**
	 * Populate tag filter dropdown with unique tags
	 */
	private populateTagFilter(select: HTMLSelectElement): void {
		select.createEl('option', { text: 'All tags', value: '' });

		const samples = this.plugin.settings.freesoundSamples || [];
		const tags = new Set<string>();

		samples.forEach(sample => {
			const extendedSample = sample as ExtendedFreesoundSample;
			if (extendedSample.tags && Array.isArray(extendedSample.tags)) {
				extendedSample.tags.forEach((tag: string) => tags.add(tag));
			}
		});

		Array.from(tags).sort().forEach(tag => {
			select.createEl('option', { text: tag, value: tag });
		});
	}

	/**
	 * Populate license filter dropdown
	 */
	private populateLicenseFilter(select: HTMLSelectElement): void {
		select.createEl('option', { text: 'All licenses', value: '' });

		const samples = this.plugin.settings.freesoundSamples || [];
		const licenses = new Set<string>();

		samples.forEach(sample => {
			if (sample.license) licenses.add(sample.license);
		});

		Array.from(licenses).sort().forEach(license => {
			select.createEl('option', { text: license, value: license });
		});
	}

	/**
	 * Render the sample table
	 */
	private renderTable(): void {
		// Remove existing table
		const existingTable = this.container.querySelector('.sonigraph-sample-table-wrapper');
		if (existingTable) existingTable.remove();

		const samples = this.getFilteredSamples();

		if (samples.length === 0) {
			this.container.createEl('p', {
				text: 'No samples match your filters.',
				cls: 'sonigraph-sample-table-empty'
			});
			return;
		}

		const tableWrapper = this.container.createDiv({ cls: 'sonigraph-sample-table-wrapper' });
		const table = tableWrapper.createEl('table', { cls: 'sonigraph-sample-table' });

		// Table header
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');

		void this.renderColumnHeader(headerRow, 'name', 'Sample');
		void this.renderColumnHeader(headerRow, 'author', 'Author / license');
		void this.renderColumnHeader(headerRow, 'tags', 'Tags');
		headerRow.createEl('th', { text: 'Actions' });

		// Table body
		const tbody = table.createEl('tbody');
		samples.forEach(sample => {
			this.renderSampleRow(tbody, sample);
		});
	}

	/**
	 * Render a sortable column header
	 */
	private renderColumnHeader(row: HTMLElement, column: string, title: string): void {
		const th = row.createEl('th', { cls: 'sortable' });
		void th.setText(title);

		if (this.sortState.column === column) {
			const arrow = th.createSpan({ cls: 'sort-arrow' });
			arrow.setText(this.sortState.direction === 'asc' ? ' ▲' : ' ▼');
		}

		th.addEventListener('click', () => {
			if (this.sortState.column === column) {
				this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
			} else {
				this.sortState.column = column;
				this.sortState.direction = 'asc';
			}
			void this.renderTable();
		});
	}

	/**
	 * Render a single sample row
	 */
	private renderSampleRow(tbody: HTMLElement, sample: ExtendedFreesoundSample): void {
		const row = tbody.createEl('tr', {
			cls: sample.enabled === false ? 'disabled' : ''
		});

		// Sample Name with duration
		const nameCell = row.createEl('td', { cls: 'sonigraph-sample-name' });
		const nameDiv = nameCell.createDiv({ cls: 'sonigraph-sample-name-text' });
		void nameDiv.setText(sample.title || sample.name || 'Untitled');
		const durationDiv = nameCell.createDiv({ cls: 'sonigraph-sample-duration' });
		const duration = Math.round(sample.duration || 0);
		durationDiv.setText(`${duration}s`);

		// Author / License combined
		const authorCell = row.createEl('td', { cls: 'sonigraph-sample-author-license' });
		const authorDiv = authorCell.createDiv({ cls: 'sonigraph-author-text' });
		void authorDiv.setText(sample.attribution || 'Unknown');
		const licenseDiv = authorCell.createDiv({ cls: 'sonigraph-license-text' });
		licenseDiv.setText(this.formatLicense(sample.license));

		// Tags
		const tagsCell = row.createEl('td', { cls: 'sonigraph-sample-tags' });
		if (sample.tags && Array.isArray(sample.tags)) {
			sample.tags.slice(0, 2).forEach((tag: string) => {
				tagsCell.createSpan({ text: tag, cls: 'sonigraph-tag-badge' });
			});
			if (sample.tags.length > 2) {
				tagsCell.createSpan({ text: `+${sample.tags.length - 2}`, cls: 'sonigraph-tag-more' });
			}
		}

		// Actions - all inline
		const actionsCell = row.createEl('td', { cls: 'sonigraph-sample-actions' });

		// Preview button
		const previewBtn = actionsCell.createEl('button', { cls: 'sonigraph-preview-btn', attr: { 'aria-label': 'Preview sample' } });
		setIcon(previewBtn, 'play');
		previewBtn.addEventListener('click', () => void this.previewSample(sample, previewBtn));

		// Info button
		const infoBtn = actionsCell.createEl('button', { cls: 'sonigraph-info-btn', attr: { 'aria-label': 'View on Freesound' } });
		setIcon(infoBtn, 'info');
		infoBtn.addEventListener('click', () => {
			window.open(`https://freesound.org/s/${sample.id}/`, '_blank');
		});

		// Edit Tags button
		const editTagsBtn = actionsCell.createEl('button', { cls: 'sonigraph-edit-tags-btn', attr: { 'aria-label': 'Edit tags' } });
		setIcon(editTagsBtn, 'tag');
		editTagsBtn.addEventListener('click', () => {
			void this.openTagEditor(sample);
		});

		// Enable/Disable toggle
		const toggleBtn = actionsCell.createEl('button', {
			cls: sample.enabled === false ? 'sonigraph-enable-btn' : 'sonigraph-disable-btn',
			attr: { 'aria-label': sample.enabled === false ? 'Enable' : 'Disable' }
		});
		setIcon(toggleBtn, sample.enabled === false ? 'toggle-left' : 'toggle-right');
		toggleBtn.addEventListener('click', () => {
			void this.toggleSampleEnabled(sample.id);
		});

		// Remove button
		const removeBtn = actionsCell.createEl('button', { cls: 'sonigraph-remove-btn', attr: { 'aria-label': 'Remove sample' } });
		setIcon(removeBtn, 'trash-2');
		removeBtn.addEventListener('click', () => {
			void this.removeSample(sample.id);
		});
	}

	/**
	 * Format license URL to friendly name
	 */
	private formatLicense(license: string | undefined): string {
		if (!license) return 'Unknown';

		// If it's already a short name (not a URL), return as-is
		if (!license.includes('http')) return license;

		// Convert common Creative Commons URLs to short names
		const licenseMap: { [key: string]: string } = {
			'creativecommons.org/licenses/by/': 'CC-BY',
			'creativecommons.org/licenses/by-nc/': 'CC-BY-NC',
			'creativecommons.org/licenses/by-sa/': 'CC-BY-SA',
			'creativecommons.org/licenses/by-nd/': 'CC-BY-ND',
			'creativecommons.org/licenses/by-nc-sa/': 'CC-BY-NC-SA',
			'creativecommons.org/licenses/by-nc-nd/': 'CC-BY-NC-ND',
			'creativecommons.org/publicdomain/zero/': 'CC0',
			'creativecommons.org/publicdomain/mark/': 'Public Domain'
		};

		// Find matching license
		for (const [urlPart, name] of Object.entries(licenseMap)) {
			if (license.includes(urlPart)) {
				return name;
			}
		}

		// If no match, extract domain or return "Other"
		try {
			const url = new URL(license);
			return url.hostname.replace('www.', '');
		} catch {
			return 'Other';
		}
	}

	/**
	 * Get filtered and sorted samples
	 */
	private getFilteredSamples(): ExtendedFreesoundSample[] {
		let samples = this.plugin.settings.freesoundSamples || [];

		// Apply filters
		if (!this.filters.showDisabled) {
			samples = samples.filter(s => s.enabled !== false);
		}

		if (this.filters.search) {
			const search = this.filters.search.toLowerCase();
			samples = samples.filter(s =>
				(s.title?.toLowerCase().includes(search)) ||
				(s.name?.toLowerCase().includes(search)) ||
				(s.author?.toLowerCase().includes(search)) ||
				(s.attribution?.toLowerCase().includes(search)) ||
				(s.description?.toLowerCase().includes(search))
			);
		}

		if (this.filters.tag) {
			samples = samples.filter(s =>
				s.tags && Array.isArray(s.tags) && s.tags.includes(this.filters.tag)
			);
		}

		if (this.filters.license) {
			samples = samples.filter(s => s.license === this.filters.license);
		}

		// Apply sorting
		samples.sort((a, b) => {
			let aVal = a[this.sortState.column];
			let bVal = b[this.sortState.column];

			// Handle arrays (tags)
			if (Array.isArray(aVal)) aVal = aVal.join(', ');
			if (Array.isArray(bVal)) bVal = bVal.join(', ');

			// Handle numbers
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return this.sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
			}

			// Handle strings
			const aStr = String(aVal || '').toLowerCase();
			const bStr = String(bVal || '').toLowerCase();

			if (this.sortState.direction === 'asc') {
				return aStr.localeCompare(bStr);
			} else {
				return bStr.localeCompare(aStr);
			}
		});

		return samples;
	}

	/**
	 * Preview a sample
	 */
	private async previewSample(sample: ExtendedFreesoundSample, button: HTMLButtonElement): Promise<void> {
		// Stop if already playing (check if button has stop icon)
		if (this.currentPreviewButton === button && this.currentPreviewAudio) {
			void this.stopPreview();
			return;
		}

		// Stop any currently playing preview
		if (this.currentPreviewAudio) {
			void this.stopPreview();
		}

		try {
			void button.empty();
			button.createSpan({ text: '...' });
			button.disabled = true;

			// Fetch fresh preview URL from Freesound API
			const apiKey = this.plugin.settings.freesoundApiKey;
			if (!apiKey) {
				throw new Error('Freesound API key not configured');
			}

			// Note: Removed &fields=previews as it might be causing 404
			const soundUrl = `https://freesound.org/apiv2/sounds/${sample.id}/?token=${apiKey}`;
			const soundResponse = await requestUrl({ url: soundUrl, method: 'GET' });
			const soundData = JSON.parse(soundResponse.text);
			const previewUrl = soundData.previews?.['preview-hq-mp3'] || soundData.previews?.['preview-lq-mp3'];

			if (!previewUrl) {
				throw new Error('No preview URL available');
			}

			// Download via requestUrl to bypass CORS
			const response = await requestUrl({ url: previewUrl, method: 'GET' });
			const blob = new Blob([response.arrayBuffer], { type: 'audio/mpeg' });
			const blobUrl = URL.createObjectURL(blob);

			// Create and play audio
			const audio = new Audio(blobUrl);
			await new Promise<void>((resolve, reject) => {
				audio.addEventListener('canplay', () => resolve(), { once: true });
				audio.addEventListener('error', reject, { once: true });
				void audio.load();
			});

			await audio.play();

			this.currentPreviewAudio = audio;
			this.currentPreviewButton = button;

			void button.empty();
			setIcon(button, 'square');
			button.disabled = false;

			// Auto-stop when done
			audio.addEventListener('ended', () => {
				void URL.revokeObjectURL(blobUrl);
				if (this.currentPreviewButton) {
					this.currentPreviewButton.empty();
					setIcon(this.currentPreviewButton, 'play');
				}
				this.currentPreviewAudio = null;
				this.currentPreviewButton = null;
			});

		} catch (error) {
			void logger.error('preview', 'Failed to preview sample', error);
			void button.empty();
			button.createSpan({ text: 'Error' });
			button.disabled = false;
			setTimeout(() => {
				void button.empty();
				setIcon(button, 'play');
			}, 2000);
		}
	}

	/**
	 * Stop current preview
	 */
	private stopPreview(): void {
		if (this.currentPreviewAudio && this.currentPreviewButton) {
			this.currentPreviewAudio.pause();
			if (this.currentPreviewAudio.src.startsWith('blob:')) {
				void URL.revokeObjectURL(this.currentPreviewAudio.src);
			}
			this.currentPreviewButton.empty();
			setIcon(this.currentPreviewButton, 'play');
			this.currentPreviewAudio = null;
			this.currentPreviewButton = null;
		}
	}

	/**
	 * Toggle sample enabled/disabled
	 */
	private async toggleSampleEnabled(sampleId: number): Promise<void> {
		const samples = this.plugin.settings.freesoundSamples;
		if (!samples) return;

		const sample = samples.find(s => s.id === sampleId);
		if (!sample) return;

		// Toggle logic:
		// - undefined (default) → true (enable on first click)
		// - true → false (disable)
		// - false → true (re-enable)
		if (sample.enabled === undefined) {
			sample.enabled = true;
		} else {
			sample.enabled = !sample.enabled;
		}
		await this.plugin.saveSettings();
		void this.renderTable();

		new Notice(`Sample ${sample.enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Remove sample from library
	 */
	private async removeSample(sampleId: number): Promise<void> {
		const samples = this.plugin.settings.freesoundSamples;
		if (!samples) return;

		const index = samples.findIndex(s => s.id === sampleId);
		if (index === -1) return;

		const sample = samples[index];
		void samples.splice(index, 1);
		await this.plugin.saveSettings();
		void this.renderTable();

		new Notice(`Removed "${sample.title || sample.name}"`);
	}

	/**
	 * Open Freesound search modal
	 */
	private async openFreesoundSearch(): Promise<void> {
		const apiKey = this.plugin.settings.freesoundApiKey;
		if (!apiKey) {
			new Notice('Please configure your Freesound API key in settings');
			return;
		}

		const { FreesoundSearchModal } = await import('./FreesoundSearchModal');
		const modal = new FreesoundSearchModal(
			this.app,
			apiKey,
			(sample: FreesoundSample) => void (async () => {
				// Add sample to library
				if (!this.plugin.settings.freesoundSamples) {
					this.plugin.settings.freesoundSamples = [];
				}

				// Check if already exists
				const exists = this.plugin.settings.freesoundSamples.some(s => s.id === sample.id);
				if (exists) {
					new Notice(`Sample "${sample.title}" is already in your library`);
					return;
				}

				// Add with enabled flag
				const sampleWithEnabled = { ...sample, enabled: true };
				this.plugin.settings.freesoundSamples.push(sampleWithEnabled);
				await this.plugin.saveSettings();
				this.render(); // Refresh table

				new Notice(`Added "${sample.title}" to library`);
			})()
		);

		void modal.open();
	}

	/**
	 * Open tag editor modal
	 */
	private openTagEditor(sample: ExtendedFreesoundSample): void {
		const modal = new TagEditorModal(
			this.app,
			this.plugin,
			sample,
			async (updatedTags: string[]) => {
				// Update sample tags
				const samples = this.plugin.settings.freesoundSamples;
				if (!samples) return;

				const sampleToUpdate = samples.find(s => s.id === sample.id);
				if (sampleToUpdate) {
					sampleToUpdate.tags = updatedTags;
					await this.plugin.saveSettings();
					this.render(); // Refresh table
				}
			}
		);
		void modal.open();
	}
}

/**
 * Modal for editing sample tags
 */
class TagEditorModal extends Modal {
	private plugin: SonigraphPlugin;
	private sample: ExtendedFreesoundSample;
	private onSave: (tags: string[]) => Promise<void>;
	private tagInput: HTMLInputElement | null = null;
	private tagListEl: HTMLElement | null = null;
	private currentTags: string[] = [];

	// Available tag suggestions from curated samples and other samples
	private availableTags: Set<string> = new Set([
		'drone', 'ambient', 'atmospheric', 'electronic', 'oceanic', 'nature',
		'sci-fi', 'orchestral', 'minimal', 'experimental', 'urban', 'industrial',
		'rhythmic', 'jazz', 'tonal', 'atonal', 'modulated', 'lo-fi', 'water',
		'space', 'cinematic', 'synth', 'pad', 'texture', 'field-recording'
	]);

	constructor(app: App, plugin: SonigraphPlugin, sample: ExtendedFreesoundSample, onSave: (tags: string[]) => Promise<void>) {
		super(app);
		this.plugin = plugin;
		this.sample = sample;
		this.onSave = onSave;
		this.currentTags = [...(sample.tags || [])];

		// Add tags from other samples
		const allSamples = plugin.settings.freesoundSamples || [];
		allSamples.forEach(s => {
			const extendedSample = s as ExtendedFreesoundSample;
			if (extendedSample.tags && Array.isArray(extendedSample.tags)) {
				extendedSample.tags.forEach((tag: string) => this.availableTags.add(tag));
			}
		});
	}

	onOpen() {
		const { contentEl } = this;
		void contentEl.empty();

		contentEl.createEl('h3', { text: 'Edit tags' });
		contentEl.createEl('p', {
			text: `Sample: ${this.sample.title || this.sample.name}`,
			cls: 'sonigraph-tag-editor-sample-name'
		});

		// Tag input with suggestions
		const inputContainer = contentEl.createDiv({ cls: 'sonigraph-tag-editor-input-container' });

		this.tagInput = inputContainer.createEl('input', {
			type: 'text',
			placeholder: 'Type to add tags...',
			cls: 'sonigraph-tag-editor-input'
		});

		const suggestionsEl = inputContainer.createDiv({ cls: 'sonigraph-tag-suggestions' });

		// Show suggestions as user types
		this.tagInput.addEventListener('input', () => {
			if (!this.tagInput) return;
			const value = this.tagInput.value.toLowerCase().trim();
			void suggestionsEl.empty();

			if (value.length > 0) {
				const matches = Array.from(this.availableTags)
					.filter(tag => tag.toLowerCase().includes(value) && !this.currentTags.includes(tag))
					.slice(0, 10);

				matches.forEach(tag => {
					const suggestion = suggestionsEl.createDiv({
						text: tag,
						cls: 'sonigraph-tag-suggestion'
					});
					suggestion.addEventListener('click', () => {
						void this.addTag(tag);
						if (this.tagInput) this.tagInput.value = '';
						void suggestionsEl.empty();
					});
				});
			}
		});

		// Add tag on Enter
		this.tagInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && this.tagInput) {
				void e.preventDefault();
				const value = this.tagInput.value.trim().toLowerCase();
				if (value) {
					void this.addTag(value);
					this.tagInput.value = '';
					void suggestionsEl.empty();
				}
			}
		});

		// Current tags display
		contentEl.createEl('h4', { text: 'Current tags' });
		this.tagListEl = contentEl.createDiv({ cls: 'sonigraph-tag-editor-list' });
		void this.renderTags();

		// Common tags section
		const commonSection = contentEl.createDiv({ cls: 'sonigraph-tag-common-section' });
		commonSection.createEl('h4', { text: 'Common tags' });
		const commonTagsEl = commonSection.createDiv({ cls: 'sonigraph-tag-common-grid' });

		const commonTags = ['drone', 'ambient', 'atmospheric', 'electronic', 'oceanic',
			'nature', 'sci-fi', 'orchestral', 'minimal', 'experimental'];

		commonTags.forEach(tag => {
			const tagBtn = commonTagsEl.createEl('button', {
				text: tag,
				cls: this.currentTags.includes(tag) ? 'sonigraph-tag-common-btn added' : 'sonigraph-tag-common-btn'
			});
			tagBtn.addEventListener('click', () => {
				if (!this.currentTags.includes(tag)) {
					void this.addTag(tag);
				}
			});
		});

		// Save/Cancel buttons
		const btnContainer = contentEl.createDiv({ cls: 'sonigraph-tag-editor-buttons' });

		const saveBtn = btnContainer.createEl('button', {
			text: 'Save',
			cls: 'mod-cta'
		});
		saveBtn.addEventListener('click', () => {
			void (async () => {
				await this.onSave(this.currentTags);
				new Notice('Tags updated');
				this.close();
			})();
		});

		const cancelBtn = btnContainer.createEl('button', {
			text: 'Cancel'
		});
		cancelBtn.addEventListener('click', () => {
			void this.close();
		});
	}

	private addTag(tag: string) {
		const normalized = tag.toLowerCase().trim();
		if (normalized && !this.currentTags.includes(normalized)) {
			this.currentTags.push(normalized);
			void this.renderTags();
			this.availableTags.add(normalized);
		}
	}

	private removeTag(tag: string) {
		const index = this.currentTags.indexOf(tag);
		if (index > -1) {
			this.currentTags.splice(index, 1);
			void this.renderTags();
		}
	}

	private renderTags() {
		if (!this.tagListEl) return;
		this.tagListEl.empty();

		if (this.currentTags.length === 0) {
			this.tagListEl.createEl('p', {
				text: 'No tags yet. add some above.',
				cls: 'sonigraph-tag-editor-empty'
			});
			return;
		}

		this.currentTags.forEach(tag => {
			if (!this.tagListEl) return;
			const tagEl = this.tagListEl.createDiv({ cls: 'sonigraph-tag-editor-item' });
			tagEl.createSpan({ text: tag, cls: 'sonigraph-tag-editor-item-text' });

			const removeBtn = tagEl.createEl('button', {
				text: '×',
				cls: 'sonigraph-tag-editor-item-remove'
			});
			removeBtn.addEventListener('click', () => {
				void this.removeTag(tag);
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		void contentEl.empty();
	}
}
