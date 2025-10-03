/**
 * Table-based Sample Browser Component
 *
 * Provides a professional data table UI for browsing, filtering, and managing
 * Freesound samples with sortable columns, search, and tag filtering.
 */

import { App, Notice, requestUrl } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger } from '../logging';
import { FreesoundSample } from '../audio/layers/types';

const logger = getLogger('SampleTableBrowser');

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
		this.renderHeader();

		// Filter controls
		this.renderFilters();

		// Sample table
		this.renderTable();
	}

	/**
	 * Render header with title and search button
	 */
	private renderHeader(): void {
		const header = this.container.createDiv({ cls: 'sample-table-header' });

		const titleRow = header.createDiv({ cls: 'sample-table-title-row' });
		titleRow.createEl('h4', { text: 'Sample Library', cls: 'sample-table-title' });

		const searchBtn = titleRow.createEl('button', {
			text: 'Search Freesound',
			cls: 'sample-table-search-btn'
		});
		searchBtn.addEventListener('click', () => this.openFreesoundSearch());
	}

	/**
	 * Render filter controls
	 */
	private renderFilters(): void {
		const filterRow = this.container.createDiv({ cls: 'sample-table-filters' });

		// Search input
		const searchInput = filterRow.createEl('input', {
			type: 'text',
			placeholder: 'Search samples...',
			cls: 'sample-table-filter-search'
		});
		searchInput.value = this.filters.search;
		searchInput.addEventListener('input', (e) => {
			this.filters.search = (e.target as HTMLInputElement).value;
			this.renderTable();
		});

		// Tag filter
		const tagFilter = filterRow.createEl('select', { cls: 'sample-table-filter-tag' });
		this.populateTagFilter(tagFilter);
		tagFilter.value = this.filters.tag;
		tagFilter.addEventListener('change', (e) => {
			this.filters.tag = (e.target as HTMLSelectElement).value;
			this.renderTable();
		});

		// License filter
		const licenseFilter = filterRow.createEl('select', { cls: 'sample-table-filter-license' });
		this.populateLicenseFilter(licenseFilter);
		licenseFilter.value = this.filters.license;
		licenseFilter.addEventListener('change', (e) => {
			this.filters.license = (e.target as HTMLSelectElement).value;
			this.renderTable();
		});

		// Show disabled toggle
		const toggleLabel = filterRow.createEl('label', { cls: 'sample-table-filter-toggle' });
		const toggleCheck = toggleLabel.createEl('input', { type: 'checkbox' });
		toggleCheck.checked = this.filters.showDisabled;
		toggleCheck.addEventListener('change', (e) => {
			this.filters.showDisabled = (e.target as HTMLInputElement).checked;
			this.renderTable();
		});
		toggleLabel.appendText(' Show disabled');
	}

	/**
	 * Populate tag filter dropdown with unique tags
	 */
	private populateTagFilter(select: HTMLSelectElement): void {
		select.createEl('option', { text: 'All Tags', value: '' });

		const samples = this.plugin.settings.freesoundSamples || [];
		const tags = new Set<string>();

		samples.forEach(sample => {
			if (sample.tags && Array.isArray(sample.tags)) {
				sample.tags.forEach(tag => tags.add(tag));
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
		select.createEl('option', { text: 'All Licenses', value: '' });

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
		const existingTable = this.container.querySelector('.sample-table-wrapper');
		if (existingTable) existingTable.remove();

		const samples = this.getFilteredSamples();

		if (samples.length === 0) {
			this.container.createEl('p', {
				text: 'No samples match your filters.',
				cls: 'sample-table-empty'
			});
			return;
		}

		const tableWrapper = this.container.createDiv({ cls: 'sample-table-wrapper' });
		const table = tableWrapper.createEl('table', { cls: 'sample-table' });

		// Table header
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');

		this.renderColumnHeader(headerRow, 'name', 'Sample Name');
		this.renderColumnHeader(headerRow, 'author', 'Author');
		this.renderColumnHeader(headerRow, 'duration', 'Duration');
		this.renderColumnHeader(headerRow, 'description', 'Description');
		this.renderColumnHeader(headerRow, 'license', 'License');
		headerRow.createEl('th', { text: 'Preview' });
		headerRow.createEl('th', { text: 'Info' });
		this.renderColumnHeader(headerRow, 'tags', 'Tags');
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
		th.setText(title);

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
			this.renderTable();
		});
	}

	/**
	 * Render a single sample row
	 */
	private renderSampleRow(tbody: HTMLElement, sample: any): void {
		const row = tbody.createEl('tr', {
			cls: sample.enabled === false ? 'disabled' : ''
		});

		// Name
		row.createEl('td', { text: sample.title || sample.name || 'Untitled', cls: 'sample-name' });

		// Author
		row.createEl('td', { text: sample.attribution || 'Unknown' });

		// Duration
		const duration = Math.round(sample.duration || 0);
		row.createEl('td', { text: `${duration}s` });

		// Description
		const desc = sample.description || sample.usageNotes || '';
		row.createEl('td', { text: desc.substring(0, 50) + (desc.length > 50 ? '...' : '') });

		// License
		row.createEl('td', { text: sample.license || 'Unknown' });

		// Preview button
		const previewCell = row.createEl('td');
		const previewBtn = previewCell.createEl('button', { text: '▶', cls: 'preview-btn' });
		previewBtn.addEventListener('click', () => this.previewSample(sample, previewBtn));

		// Info button
		const infoCell = row.createEl('td');
		const infoBtn = infoCell.createEl('button', { text: '🔗', cls: 'info-btn' });
		infoBtn.addEventListener('click', () => {
			window.open(`https://freesound.org/s/${sample.id}/`, '_blank');
		});

		// Tags
		const tagsCell = row.createEl('td', { cls: 'sample-tags' });
		if (sample.tags && Array.isArray(sample.tags)) {
			sample.tags.slice(0, 3).forEach(tag => {
				tagsCell.createSpan({ text: tag, cls: 'tag-badge' });
			});
			if (sample.tags.length > 3) {
				tagsCell.createSpan({ text: `+${sample.tags.length - 3}`, cls: 'tag-more' });
			}
		}

		// Actions
		const actionsCell = row.createEl('td', { cls: 'sample-actions' });

		// Enable/Disable toggle
		const toggleBtn = actionsCell.createEl('button', {
			text: sample.enabled === false ? 'Enable' : 'Disable',
			cls: sample.enabled === false ? 'enable-btn' : 'disable-btn'
		});
		toggleBtn.addEventListener('click', async () => {
			await this.toggleSampleEnabled(sample.id);
		});

		// Remove button
		const removeBtn = actionsCell.createEl('button', { text: 'Remove', cls: 'remove-btn' });
		removeBtn.addEventListener('click', async () => {
			await this.removeSample(sample.id);
		});
	}

	/**
	 * Get filtered and sorted samples
	 */
	private getFilteredSamples(): any[] {
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
	private async previewSample(sample: any, button: HTMLButtonElement): Promise<void> {
		// Stop if already playing
		if (button.textContent === 'Stop') {
			this.stopPreview();
			return;
		}

		// Stop any currently playing preview
		if (this.currentPreviewAudio) {
			this.stopPreview();
		}

		const originalText = button.textContent || '▶';

		try {
			button.textContent = '...';
			button.disabled = true;

			// Fetch fresh preview URL from Freesound API
			const apiKey = this.plugin.settings.freesoundApiKey;
			if (!apiKey) {
				throw new Error('Freesound API key not configured');
			}

			const soundUrl = `https://freesound.org/apiv2/sounds/${sample.id}/?token=${apiKey}&fields=previews`;
			const soundResponse = await requestUrl({ url: soundUrl, method: 'GET' });
			const soundData = JSON.parse(soundResponse.text);
			const previewUrl = soundData.previews['preview-hq-mp3'] || soundData.previews['preview-lq-mp3'];

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
				audio.load();
			});

			await audio.play();

			this.currentPreviewAudio = audio;
			this.currentPreviewButton = button;

			button.textContent = 'Stop';
			button.disabled = false;

			// Auto-stop when done
			audio.addEventListener('ended', () => {
				URL.revokeObjectURL(blobUrl);
				if (this.currentPreviewButton) {
					this.currentPreviewButton.textContent = originalText;
				}
				this.currentPreviewAudio = null;
				this.currentPreviewButton = null;
			});

		} catch (error) {
			logger.error('preview', 'Failed to preview sample', error);
			button.textContent = 'Error';
			button.disabled = false;
			setTimeout(() => {
				button.textContent = originalText;
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
				URL.revokeObjectURL(this.currentPreviewAudio.src);
			}
			this.currentPreviewButton.textContent = '▶';
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

		sample.enabled = sample.enabled === false ? true : false;
		await this.plugin.saveSettings();
		this.renderTable();

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
		samples.splice(index, 1);
		await this.plugin.saveSettings();
		this.renderTable();

		new Notice(`Removed "${sample.title || sample.name}"`);
	}

	/**
	 * Open Freesound search modal
	 */
	private openFreesoundSearch(): void {
		const apiKey = this.plugin.settings.freesoundApiKey;
		if (!apiKey) {
			new Notice('Please configure your Freesound API key in settings');
			return;
		}

		const modal = new (require('./FreesoundSearchModal').FreesoundSearchModal)(
			this.app,
			apiKey,
			async (sample: FreesoundSample) => {
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
			}
		);

		modal.open();
	}
}
