/**
 * FreesoundSearchModal
 *
 * Modal for searching Freesound.org and previewing samples.
 * Allows users to search, filter, preview, and add samples to their library.
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import { getLogger } from '../logging';
import { MusicalGenre, FreesoundSample } from '../audio/layers/types';

const logger = getLogger('FreesoundSearchModal');

interface FreesoundSearchResult {
	id: number;
	name: string;
	description: string;
	previews: {
		'preview-lq-mp3': string;
		'preview-hq-mp3': string;
	};
	duration: number;
	license: string;
	username: string;
	tags: string[];
}

interface SearchFilters {
	query: string;
	license: string;
	minDuration: number;
	maxDuration: number;
}

export class FreesoundSearchModal extends Modal {
	private apiKey: string;
	private onAddSample: (sample: FreesoundSample) => void;

	private filters: SearchFilters = {
		query: '',
		license: 'any',
		minDuration: 10,
		maxDuration: 300
	};

	private searchResults: FreesoundSearchResult[] = [];
	private isSearching = false;
	private currentAudio: HTMLAudioElement | null = null;
	private currentPreviewButton: HTMLButtonElement | null = null;

	// UI elements
	private searchInput: HTMLInputElement | null = null;
	private resultsContainer: HTMLElement | null = null;
	private filtersSection: HTMLElement | null = null;
	private filtersCollapsed = false;
	private activeFilterCount = 0;
	private currentGenre: MusicalGenre = 'ambient'; // Default genre for suggestions

	constructor(
		app: App,
		apiKey: string,
		onAddSample: (sample: FreesoundSample) => void
	) {
		super(app);
		this.apiKey = apiKey;
		this.onAddSample = onAddSample;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('freesound-search-modal');

		// Modal header
		contentEl.createEl('h2', {
			text: 'Search Freesound',
			cls: 'freesound-search-title'
		});

		// Search section
		this.createSearchSection(contentEl);

		// Filters section
		this.createFiltersSection(contentEl);

		// Results section
		this.createResultsSection(contentEl);
	}

	private createSearchSection(container: HTMLElement): void {
		const searchSection = container.createDiv({ cls: 'freesound-search-section' });

		// Search input with clear button
		const searchContainer = searchSection.createDiv({ cls: 'freesound-search-input-container' });

		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search for sounds (e.g. ambient pad, ocean waves)',
			cls: 'freesound-search-input',
			attr: {
				'aria-label': 'Search Freesound',
				'autocomplete': 'off'
			}
		});

		// Debounced input for live suggestions
		let inputTimeout: NodeJS.Timeout;
		this.searchInput.addEventListener('input', () => {
			clearTimeout(inputTimeout);
			inputTimeout = setTimeout(() => {
				this.updateClearButton();
			}, 150);
		});

		this.searchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				this.performSearch();
			}
		});

		// Clear button
		const clearButton = searchContainer.createEl('button', {
			cls: 'freesound-clear-btn',
			attr: {
				'aria-label': 'Clear search',
				'style': 'display: none;'
			}
		});
		clearButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
		clearButton.addEventListener('click', () => {
			if (this.searchInput) {
				this.searchInput.value = '';
				this.searchInput.focus();
				this.updateClearButton();
			}
		});

		// Search button with loading state
		const searchButton = searchContainer.createEl('button', {
			cls: 'freesound-search-button',
			attr: { 'aria-label': 'Search' }
		});

		searchButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg><span>Search</span>`;
		searchButton.addEventListener('click', () => this.performSearch());

		// Quick search suggestions
		const suggestionsEl = searchSection.createDiv({ cls: 'freesound-search-suggestions' });
		suggestionsEl.createEl('span', { text: 'Quick searches: ', cls: 'freesound-suggestions-label' });

		const suggestions = this.getGenreSuggestions(this.currentGenre);
		suggestions.forEach((suggestion, index) => {
			const suggestionBtn = suggestionsEl.createEl('button', {
				text: suggestion,
				cls: 'freesound-suggestion-btn',
				attr: { 'aria-label': `Search for ${suggestion}` }
			});

			// Add icon based on suggestion type
			const icon = this.getSearchIcon(suggestion);
			if (icon) {
				suggestionBtn.innerHTML = `${icon}<span>${suggestion}</span>`;
			}

			suggestionBtn.addEventListener('click', () => {
				suggestionBtn.addClass('freesound-suggestion-active');
				setTimeout(() => suggestionBtn.removeClass('freesound-suggestion-active'), 300);

				if (this.searchInput) {
					this.searchInput.value = suggestion;
					this.performSearch();
				}
			});
		});
	}

	private updateClearButton(): void {
		const clearBtn = this.contentEl.querySelector('.freesound-clear-btn') as HTMLElement;
		if (clearBtn && this.searchInput) {
			clearBtn.style.display = this.searchInput.value ? 'flex' : 'none';
		}
	}

	private getSearchIcon(suggestion: string): string {
		const iconMap: Record<string, string> = {
			'ambient': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
			'pad': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
			'texture': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
			'ocean': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M2 12c3.667-3 7.333-3 11 0s7.333 3 11 0"></path></svg>',
			'water': '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
		};

		// Return icon if exact match, otherwise return generic music icon
		return iconMap[suggestion.toLowerCase()] || '';
	}

	private createFiltersSection(container: HTMLElement): void {
		this.filtersSection = container.createDiv({ cls: 'freesound-filters-section' });

		const filtersHeader = this.filtersSection.createDiv({ cls: 'freesound-filters-header' });

		// Collapsible header with chevron
		const headerButton = filtersHeader.createEl('button', {
			cls: 'freesound-filters-toggle',
			attr: { 'aria-expanded': 'true', 'aria-label': 'Toggle filters' }
		});

		headerButton.innerHTML = `
			<svg class="freesound-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
			<h3>Filters</h3>
			<span class="freesound-filter-badge" style="display: none;">0</span>
		`;

		headerButton.addEventListener('click', () => {
			this.filtersCollapsed = !this.filtersCollapsed;
			const filtersGrid = this.filtersSection?.querySelector('.freesound-filters-grid') as HTMLElement;

			if (filtersGrid) {
				if (this.filtersCollapsed) {
					filtersGrid.style.display = 'none';
					this.filtersSection?.addClass('freesound-filters-collapsed');
					headerButton.setAttribute('aria-expanded', 'false');
				} else {
					filtersGrid.style.display = 'grid';
					this.filtersSection?.removeClass('freesound-filters-collapsed');
					headerButton.setAttribute('aria-expanded', 'true');
				}
			}
		});

		// Clear filters button
		const clearFiltersBtn = filtersHeader.createEl('button', {
			text: 'Clear',
			cls: 'freesound-clear-filters-btn',
			attr: { 'aria-label': 'Clear all filters' }
		});
		clearFiltersBtn.addEventListener('click', () => this.clearFilters());

		const filtersGrid = this.filtersSection.createDiv({ cls: 'freesound-filters-grid' });

		// License filter
		new Setting(filtersGrid)
			.setName('License')
			.setDesc('Filter by Creative Commons license')
			.addDropdown(dropdown => dropdown
				.addOption('any', 'Any license')
				.addOption('cc0', 'CC0 (Public Domain)')
				.addOption('cc-by', 'CC BY (Attribution)')
				.addOption('cc-by-sa', 'CC BY-SA (ShareAlike)')
				.setValue(this.filters.license)
				.onChange(value => {
					this.filters.license = value;
					this.updateFilterCount();
				})
			);

		// Duration filters
		new Setting(filtersGrid)
			.setName('Min duration')
			.setDesc('Minimum sample length in seconds')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(String(this.filters.minDuration))
				.onChange(value => {
					this.filters.minDuration = parseInt(value) || 10;
					this.updateFilterCount();
				})
			);

		new Setting(filtersGrid)
			.setName('Max duration')
			.setDesc('Maximum sample length in seconds')
			.addText(text => text
				.setPlaceholder('300')
				.setValue(String(this.filters.maxDuration))
				.onChange(value => {
					this.filters.maxDuration = parseInt(value) || 300;
					this.updateFilterCount();
				})
			);
	}

	private updateFilterCount(): void {
		let count = 0;
		if (this.filters.license !== 'any') count++;
		if (this.filters.minDuration !== 10) count++;
		if (this.filters.maxDuration !== 300) count++;

		this.activeFilterCount = count;

		const badge = this.contentEl.querySelector('.freesound-filter-badge') as HTMLElement;
		if (badge) {
			if (count > 0) {
				badge.textContent = String(count);
				badge.style.display = 'flex';
			} else {
				badge.style.display = 'none';
			}
		}
	}

	private clearFilters(): void {
		this.filters = {
			query: this.filters.query, // Keep search query
			license: 'any',
			minDuration: 10,
			maxDuration: 300
		};

		// Update UI
		const licenseDropdown = this.contentEl.querySelector('.freesound-filters-grid select') as HTMLSelectElement;
		if (licenseDropdown) licenseDropdown.value = 'any';

		const durationInputs = this.contentEl.querySelectorAll('.freesound-filters-grid input[type="text"]');
		if (durationInputs[0]) (durationInputs[0] as HTMLInputElement).value = '10';
		if (durationInputs[1]) (durationInputs[1] as HTMLInputElement).value = '300';

		this.updateFilterCount();
		new Notice('Filters cleared');
	}

	private createResultsSection(container: HTMLElement): void {
		const resultsSection = container.createDiv({ cls: 'freesound-results-section' });

		resultsSection.createEl('h3', { text: 'Search Results' });

		this.resultsContainer = resultsSection.createDiv({ cls: 'freesound-results-container' });
		this.resultsContainer.createEl('p', {
			text: 'Enter a search query above to find samples',
			cls: 'freesound-results-placeholder'
		});
	}

	private async performSearch(): Promise<void> {
		if (!this.searchInput || !this.resultsContainer) return;

		const query = this.searchInput.value.trim();
		if (!query) {
			new Notice('Please enter a search query');
			return;
		}

		this.filters.query = query;
		this.isSearching = true;
		this.updateSearchButton('Searching...');

		// Show loading skeleton
		this.showLoadingSkeleton();

		try {
			logger.info('search', `Searching Freesound for: ${query}`);

			// Build API request
			const url = this.buildSearchUrl();
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Freesound API error: ${response.status}`);
			}

			const data = await response.json();
			this.searchResults = data.results || [];

			logger.info('search', `Found ${this.searchResults.length} results`);
			this.displayResults();

		} catch (error) {
			logger.error('search', 'Search failed', error);
			new Notice('Search failed. Check your API key and connection.');
			this.displayError(error);
		} finally {
			this.isSearching = false;
			this.updateSearchButton('Search');
		}
	}

	private buildSearchUrl(): string {
		const baseUrl = 'https://freesound.org/apiv2/search/text/';
		const params = new URLSearchParams({
			query: this.filters.query,
			token: this.apiKey,
			fields: 'id,name,description,previews,duration,license,username,tags',
			page_size: '20'
		});

		// Add license filter
		if (this.filters.license !== 'any') {
			params.append('filter', `license:${this.filters.license.toUpperCase().replace(/-/g, ' ')}`);
		}

		// Add duration filter
		params.append('filter', `duration:[${this.filters.minDuration} TO ${this.filters.maxDuration}]`);

		return `${baseUrl}?${params.toString()}`;
	}

	private displayResults(): void {
		if (!this.resultsContainer) return;

		this.resultsContainer.empty();

		if (this.searchResults.length === 0) {
			// Enhanced empty state
			const emptyState = this.resultsContainer.createDiv({ cls: 'freesound-empty-state' });
			emptyState.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
				<p>No results found</p>
				<span>Try different search terms or adjust your filters</span>
			`;
			return;
		}

		this.searchResults.forEach(result => {
			const resultItem = this.resultsContainer!.createDiv({ cls: 'freesound-result-item' });

			// Waveform/Thumbnail placeholder (visual indicator)
			const thumbnail = resultItem.createDiv({ cls: 'freesound-result-thumbnail' });
			thumbnail.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
					<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
					<path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
				</svg>
			`;

			// Result content
			const contentSection = resultItem.createDiv({ cls: 'freesound-result-content' });

			// Title and metadata
			const headerSection = contentSection.createDiv({ cls: 'freesound-result-header' });
			headerSection.createEl('h4', { text: result.name, cls: 'freesound-result-title' });

			// Badges for license and duration
			const badgesEl = headerSection.createDiv({ cls: 'freesound-result-badges' });

			const durationBadge = badgesEl.createDiv({ cls: 'freesound-badge freesound-badge-duration' });
			durationBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${result.duration.toFixed(1)}s</span>`;

			const licenseBadge = badgesEl.createDiv({ cls: 'freesound-badge freesound-badge-license' });
			licenseBadge.textContent = this.formatLicense(result.license);

			// Description
			if (result.description) {
				const descEl = contentSection.createDiv({ cls: 'freesound-result-description' });
				descEl.textContent = result.description.substring(0, 120) + (result.description.length > 120 ? '...' : '');
			}

			// Tags
			if (result.tags && result.tags.length > 0) {
				const tagsEl = contentSection.createDiv({ cls: 'freesound-result-tags' });
				result.tags.slice(0, 5).forEach(tag => {
					const tagEl = tagsEl.createEl('span', { cls: 'freesound-tag', text: tag });
				});
				if (result.tags.length > 5) {
					tagsEl.createEl('span', { cls: 'freesound-tag-more', text: `+${result.tags.length - 5}` });
				}
			}

			// Footer with attribution
			const footerEl = contentSection.createDiv({ cls: 'freesound-result-footer' });
			footerEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span>by ${result.username}</span>`;

			// Action buttons
			const actionsSection = resultItem.createDiv({ cls: 'freesound-result-actions' });

			// Preview button
			const previewBtn = actionsSection.createEl('button', {
				cls: 'freesound-action-btn freesound-preview-btn',
				attr: { 'aria-label': `Preview ${result.name}` }
			});
			previewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Preview</span>`;
			previewBtn.addEventListener('click', () => this.previewSample(result, previewBtn));

			// Add to library button
			const addBtn = actionsSection.createEl('button', {
				cls: 'freesound-action-btn freesound-add-btn',
				attr: { 'aria-label': `Add ${result.name} to library` }
			});
			addBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span>Add to Library</span>`;
			addBtn.addEventListener('click', () => this.addSampleToLibrary(result));
		});
	}

	private formatLicense(license: string): string {
		// Handle URL-based licenses from Freesound API
		if (license.startsWith('http')) {
			// Extract license type from URL
			const url = license.toLowerCase();
			if (url.includes('/publicdomain/zero/') || url.includes('cc0')) return 'CC0';
			if (url.includes('/by-nc-sa/')) return 'CC BY-NC-SA';
			if (url.includes('/by-nc-nd/')) return 'CC BY-NC-ND';
			if (url.includes('/by-nc/')) return 'CC BY-NC';
			if (url.includes('/by-sa/')) return 'CC BY-SA';
			if (url.includes('/by-nd/')) return 'CC BY-ND';
			if (url.includes('/by/')) return 'CC BY';
			if (url.includes('sampling')) return 'Sampling+';
			return 'CC';
		}

		// Handle text-based licenses
		const licenseMap: Record<string, string> = {
			'Attribution': 'CC BY',
			'Attribution Noncommercial': 'CC BY-NC',
			'Creative Commons 0': 'CC0',
			'Attribution Share Alike': 'CC BY-SA',
			'Attribution Noncommercial Share Alike': 'CC BY-NC-SA',
			'Attribution No Derivatives': 'CC BY-ND',
			'Attribution Noncommercial No Derivatives': 'CC BY-NC-ND'
		};
		return licenseMap[license] || license;
	}

	private async previewSample(result: FreesoundSearchResult, button: HTMLButtonElement): Promise<void> {
		// If already playing this sample, stop it
		if (button.querySelector('.freesound-stop-icon')) {
			this.stopPreview();
			return;
		}

		// Stop any currently playing preview
		if (this.currentAudio) {
			this.stopPreview();
		}

		const playIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
		const stopIcon = '<svg class="freesound-stop-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12"></rect></svg>';
		const loadingIcon = '<svg class="freesound-loading-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>';

		try {
			// Show loading
			button.innerHTML = `${loadingIcon}<span>Loading...</span>`;
			button.disabled = true;
			button.addClass('freesound-btn-loading');

			// Create and play audio
			const audio = new Audio(result.previews['preview-lq-mp3']);
			this.currentAudio = audio;
			this.currentPreviewButton = button;

			await new Promise<void>((resolve, reject) => {
				audio.addEventListener('canplay', () => resolve(), { once: true });
				audio.addEventListener('error', (e) => reject(e), { once: true });
				audio.load();
			});

			await audio.play();

			button.innerHTML = `${stopIcon}<span>Stop</span>`;
			button.disabled = false;
			button.removeClass('freesound-btn-loading');
			button.addClass('freesound-btn-playing');

			audio.addEventListener('ended', () => {
				if (this.currentPreviewButton) {
					this.currentPreviewButton.innerHTML = `${playIcon}<span>Preview</span>`;
					this.currentPreviewButton.removeClass('freesound-btn-playing');
				}
				this.currentAudio = null;
				this.currentPreviewButton = null;
			});

		} catch (error) {
			logger.error('preview', `Failed to preview sample ${result.id}`, error);
			button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><span>Error</span>`;
			button.addClass('freesound-btn-error');

			setTimeout(() => {
				button.innerHTML = `${playIcon}<span>Preview</span>`;
				button.disabled = false;
				button.removeClass('freesound-btn-loading');
				button.removeClass('freesound-btn-error');
			}, 2000);
			this.currentAudio = null;
			this.currentPreviewButton = null;
		}
	}

	private stopPreview(): void {
		const playIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';

		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio.currentTime = 0;
			this.currentAudio = null;
		}

		if (this.currentPreviewButton) {
			this.currentPreviewButton.innerHTML = `${playIcon}<span>Preview</span>`;
			this.currentPreviewButton.removeClass('freesound-btn-playing');
			this.currentPreviewButton = null;
		}
	}

	private addSampleToLibrary(result: FreesoundSearchResult): void {
		const sample: FreesoundSample = {
			id: result.id,
			title: result.name,
			previewUrl: result.previews['preview-hq-mp3'],
			duration: result.duration,
			license: result.license,
			attribution: result.username,
			fadeIn: 2,  // Default fade settings
			fadeOut: 3
		};

		this.onAddSample(sample);
		new Notice(`Added "${result.name}" to library`);
		logger.info('library', `Added sample ${result.id} to library`);
	}

	private displayError(error: any): void {
		if (!this.resultsContainer) return;

		this.resultsContainer.empty();

		const errorState = this.resultsContainer.createDiv({ cls: 'freesound-error-state' });
		errorState.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="8" x2="12" y2="12"></line>
				<line x1="12" y1="16" x2="12.01" y2="16"></line>
			</svg>
			<p>Search Error</p>
			<span>${error.message || 'Failed to search Freesound. Please check your API key and connection.'}</span>
		`;

		const retryBtn = errorState.createEl('button', {
			text: 'Try Again',
			cls: 'freesound-retry-btn'
		});
		retryBtn.addEventListener('click', () => this.performSearch());
	}

	private updateSearchButton(text: string): void {
		const button = this.contentEl.querySelector('.freesound-search-button') as HTMLButtonElement;
		if (button) {
			const searchIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';
			const loadingIcon = '<svg class="freesound-loading-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>';

			if (this.isSearching) {
				button.innerHTML = `${loadingIcon}<span>${text}</span>`;
				button.addClass('freesound-btn-loading');
			} else {
				button.innerHTML = `${searchIcon}<span>${text}</span>`;
				button.removeClass('freesound-btn-loading');
			}
			button.disabled = this.isSearching;
		}
	}

	private showLoadingSkeleton(): void {
		if (!this.resultsContainer) return;

		this.resultsContainer.empty();

		// Create 3 skeleton cards
		for (let i = 0; i < 3; i++) {
			const skeleton = this.resultsContainer.createDiv({ cls: 'freesound-result-skeleton' });
			skeleton.innerHTML = `
				<div class="freesound-skeleton-thumbnail"></div>
				<div class="freesound-skeleton-content">
					<div class="freesound-skeleton-title"></div>
					<div class="freesound-skeleton-badges"></div>
					<div class="freesound-skeleton-description"></div>
					<div class="freesound-skeleton-tags"></div>
				</div>
			`;
		}
	}

	private getGenreSuggestions(genre: MusicalGenre): string[] {
		const suggestions: Record<MusicalGenre, string[]> = {
			'ambient': ['ambient pad', 'atmosphere', 'ethereal'],
			'drone': ['drone', 'bass drone', 'harmonic drone'],
			'electronic': ['synth pad', 'electronic texture', 'digital'],
			'industrial': ['factory', 'machinery', 'industrial'],
			'orchestral': ['strings', 'orchestra', 'cinematic'],
			'minimal': ['minimal', 'sparse', 'quiet'],
			'oceanic': ['ocean', 'water', 'waves'],
			'sci-fi': ['space', 'futuristic', 'alien'],
			'experimental': ['abstract', 'glitch', 'experimental'],
			'urban': ['city', 'traffic', 'urban'],
			'nature': ['forest', 'birds', 'rain'],
			'mechanical': ['motor', 'machine', 'mechanical'],
			'organic': ['acoustic', 'wood', 'natural']
		};

		return suggestions[genre] || ['ambient', 'pad', 'texture'];
	}

	onClose() {
		// Stop any playing audio
		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio = null;
		}

		const { contentEl } = this;
		contentEl.empty();
	}
}
