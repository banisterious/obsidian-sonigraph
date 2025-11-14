/**
 * FreesoundSearchModal
 *
 * Modal for searching Freesound.org and previewing samples.
 * Allows users to search, filter, preview, and add samples to their library.
 */

import { App, Modal, Setting, Notice, setIcon } from 'obsidian';
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
				'aria-label': 'Clear search'
			}
		});
		setIcon(clearButton, 'x');
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

		setIcon(searchButton, 'search');
		searchButton.createSpan({ text: 'Search' });
		searchButton.addEventListener('click', () => void this.performSearch());

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
			const iconName = this.getSearchIconName(suggestion);
			if (iconName) {
				setIcon(suggestionBtn, iconName);
			}
			suggestionBtn.createSpan({ text: suggestion });

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
		const clearBtn = this.contentEl.querySelector('.freesound-clear-btn');
		if (clearBtn && this.searchInput) {
			if (this.searchInput.value) {
				clearBtn.addClass('freesound-clear-btn--visible');
			} else {
				clearBtn.removeClass('freesound-clear-btn--visible');
			}
		}
	}

	private getSearchIconName(suggestion: string): string | null {
		const iconMap: Record<string, string> = {
			'ambient': 'music',
			'pad': 'music',
			'texture': 'square',
			'ocean': 'waves',
			'water': 'droplet',
		};

		// Return icon name if exact match
		return iconMap[suggestion.toLowerCase()] || null;
	}

	private createFiltersSection(container: HTMLElement): void {
		this.filtersSection = container.createDiv({ cls: 'freesound-filters-section' });

		const filtersHeader = this.filtersSection.createDiv({ cls: 'freesound-filters-header' });

		// Collapsible header with chevron
		const headerButton = filtersHeader.createEl('button', {
			cls: 'freesound-filters-toggle',
			attr: { 'aria-expanded': 'true', 'aria-label': 'Toggle filters' }
		});

		const chevronIcon = headerButton.createDiv({ cls: 'freesound-chevron' });
		setIcon(chevronIcon, 'chevron-down');
		headerButton.createEl('h3', { text: 'Filters' });
		headerButton.createSpan({ text: '0', cls: 'freesound-filter-badge' });

		headerButton.addEventListener('click', () => {
			this.filtersCollapsed = !this.filtersCollapsed;
			const filtersGrid = this.filtersSection?.querySelector('.freesound-filters-grid');

			if (filtersGrid) {
				if (this.filtersCollapsed) {
					filtersGrid.addClass('freesound-filters-grid--hidden');
					this.filtersSection?.addClass('freesound-filters-collapsed');
					headerButton.setAttribute('aria-expanded', 'false');
				} else {
					filtersGrid.removeClass('freesound-filters-grid--hidden');
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

		const badge = this.contentEl.querySelector('.freesound-filter-badge');
		if (badge) {
			badge.textContent = String(count);
			if (count > 0) {
				badge.addClass('freesound-filter-badge--visible');
			} else {
				badge.removeClass('freesound-filter-badge--visible');
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
		const licenseDropdown = this.contentEl.querySelector('.freesound-filters-grid select');
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
			setIcon(emptyState, 'search');
			emptyState.createEl('p', { text: 'No results found' });
			emptyState.createEl('span', { text: 'Try different search terms or adjust your filters' });
			return;
		}

		if (!this.resultsContainer) return;

		this.searchResults.forEach(result => {
			const resultItem = this.resultsContainer.createDiv({ cls: 'freesound-result-item' });

			// Waveform/Thumbnail placeholder (visual indicator)
			const thumbnail = resultItem.createDiv({ cls: 'freesound-result-thumbnail' });
			setIcon(thumbnail, 'volume-2');

			// Result content
			const contentSection = resultItem.createDiv({ cls: 'freesound-result-content' });

			// Title and metadata
			const headerSection = contentSection.createDiv({ cls: 'freesound-result-header' });
			headerSection.createEl('h4', { text: result.name, cls: 'freesound-result-title' });

			// Badges for license and duration
			const badgesEl = headerSection.createDiv({ cls: 'freesound-result-badges' });

			const durationBadge = badgesEl.createDiv({ cls: 'freesound-badge freesound-badge-duration' });
			setIcon(durationBadge, 'clock');
			durationBadge.createSpan({ text: `${result.duration.toFixed(1)}s` });

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
			setIcon(footerEl, 'user');
			footerEl.createSpan({ text: `by ${result.username}` });

			// Action buttons
			const actionsSection = resultItem.createDiv({ cls: 'freesound-result-actions' });

			// Preview button
			const previewBtn = actionsSection.createEl('button', {
				cls: 'freesound-action-btn freesound-preview-btn',
				attr: { 'aria-label': `Preview ${result.name}` }
			});
			setIcon(previewBtn, 'play');
			previewBtn.createSpan({ text: 'Preview' });
			previewBtn.addEventListener('click', () => void this.previewSample(result, previewBtn));

			// Add to library button
			const addBtn = actionsSection.createEl('button', {
				cls: 'freesound-action-btn freesound-add-btn',
				attr: { 'aria-label': `Add ${result.name} to library` }
			});
			setIcon(addBtn, 'plus');
			addBtn.createSpan({ text: 'Add to Library' });
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

	private updatePreviewButton(button: HTMLButtonElement, state: 'play' | 'stop' | 'loading' | 'error'): void {
		button.empty();

		switch (state) {
			case 'play':
				setIcon(button, 'play');
				button.createSpan({ text: 'Preview' });
				button.disabled = false;
				button.removeClass('freesound-btn-loading');
				button.removeClass('freesound-btn-playing');
				button.removeClass('freesound-btn-error');
				break;
			case 'stop':
				setIcon(button, 'square');
				button.createSpan({ text: 'Stop' });
				button.disabled = false;
				button.removeClass('freesound-btn-loading');
				button.addClass('freesound-btn-playing');
				break;
			case 'loading':
				setIcon(button, 'loader-2');
				button.createSpan({ text: 'Loading...' });
				button.disabled = true;
				button.addClass('freesound-btn-loading');
				break;
			case 'error':
				setIcon(button, 'alert-circle');
				button.createSpan({ text: 'Error' });
				button.addClass('freesound-btn-error');
				break;
		}
	}

	private async previewSample(result: FreesoundSearchResult, button: HTMLButtonElement): Promise<void> {
		// If already playing this sample, stop it
		if (button.hasClass('freesound-btn-playing')) {
			this.stopPreview();
			return;
		}

		// Stop any currently playing preview
		if (this.currentAudio) {
			this.stopPreview();
		}

		try {
			// Show loading
			this.updatePreviewButton(button, 'loading');

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

			this.updatePreviewButton(button, 'stop');

			audio.addEventListener('ended', () => {
				if (this.currentPreviewButton) {
					this.updatePreviewButton(this.currentPreviewButton, 'play');
				}
				this.currentAudio = null;
				this.currentPreviewButton = null;
			});

		} catch (error) {
			logger.error('preview', `Failed to preview sample ${result.id}`, error);
			this.updatePreviewButton(button, 'error');

			setTimeout(() => {
				this.updatePreviewButton(button, 'play');
			}, 2000);
			this.currentAudio = null;
			this.currentPreviewButton = null;
		}
	}

	private stopPreview(): void {
		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio.currentTime = 0;
			this.currentAudio = null;
		}

		if (this.currentPreviewButton) {
			this.updatePreviewButton(this.currentPreviewButton, 'play');
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

	private displayError(error: unknown): void {
		if (!this.resultsContainer) return;

		this.resultsContainer.empty();

		const errorState = this.resultsContainer.createDiv({ cls: 'freesound-error-state' });
		setIcon(errorState, 'alert-circle');
		errorState.createEl('p', { text: 'Search Error' });
		const errorMessage = error instanceof Error ? error.message : 'Failed to search Freesound. Please check your API key and connection.';
		errorState.createEl('span', {
			text: errorMessage
		});

		const retryBtn = errorState.createEl('button', {
			text: 'Try Again',
			cls: 'freesound-retry-btn'
		});
		retryBtn.addEventListener('click', () => void this.performSearch());
	}

	private updateSearchButton(text: string): void {
		const button = this.contentEl.querySelector('.freesound-search-button');
		if (button) {
			button.empty();

			if (this.isSearching) {
				setIcon(button, 'loader-2');
				button.createSpan({ text });
				button.addClass('freesound-btn-loading');
			} else {
				setIcon(button, 'search');
				button.createSpan({ text });
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
			skeleton.createDiv({ cls: 'freesound-skeleton-thumbnail' });
			const content = skeleton.createDiv({ cls: 'freesound-skeleton-content' });
			content.createDiv({ cls: 'freesound-skeleton-title' });
			content.createDiv({ cls: 'freesound-skeleton-badges' });
			content.createDiv({ cls: 'freesound-skeleton-description' });
			content.createDiv({ cls: 'freesound-skeleton-tags' });
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
