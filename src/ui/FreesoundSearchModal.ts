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

		// Search input
		const searchContainer = searchSection.createDiv({ cls: 'freesound-search-input-container' });

		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search for sounds (e.g., "ambient pad", "ocean waves")...',
			cls: 'freesound-search-input'
		});

		this.searchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				this.performSearch();
			}
		});

		// Search button
		const searchButton = searchContainer.createEl('button', {
			text: 'Search',
			cls: 'freesound-search-button'
		});
		searchButton.addEventListener('click', () => this.performSearch());

		// Quick search suggestions
		const suggestionsEl = searchSection.createDiv({ cls: 'freesound-search-suggestions' });
		suggestionsEl.createEl('span', { text: 'Quick searches: ', cls: 'freesound-suggestions-label' });

		const suggestions = this.getGenreSuggestions(this.currentGenre);
		suggestions.forEach((suggestion, index) => {
			const suggestionBtn = suggestionsEl.createEl('button', {
				text: suggestion,
				cls: 'freesound-suggestion-btn'
			});
			suggestionBtn.addEventListener('click', () => {
				if (this.searchInput) {
					this.searchInput.value = suggestion;
					this.performSearch();
				}
			});
		});
	}

	private createFiltersSection(container: HTMLElement): void {
		const filtersSection = container.createDiv({ cls: 'freesound-filters-section' });

		const filtersHeader = filtersSection.createDiv({ cls: 'freesound-filters-header' });
		filtersHeader.createEl('h3', { text: 'Filters' });

		const filtersGrid = filtersSection.createDiv({ cls: 'freesound-filters-grid' });

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
				})
			);
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
			this.resultsContainer.createEl('p', {
				text: 'No results found. Try a different search query.',
				cls: 'freesound-no-results'
			});
			return;
		}

		this.searchResults.forEach(result => {
			const resultItem = this.resultsContainer!.createDiv({ cls: 'freesound-result-item' });

			// Result info
			const infoSection = resultItem.createDiv({ cls: 'freesound-result-info' });

			infoSection.createEl('h4', { text: result.name, cls: 'freesound-result-title' });

			const metaEl = infoSection.createDiv({ cls: 'freesound-result-meta' });
			metaEl.createEl('span', { text: `${result.duration.toFixed(1)}s`, cls: 'freesound-result-duration' });
			metaEl.createEl('span', { text: ` • ${result.license}`, cls: 'freesound-result-license' });
			metaEl.createEl('span', { text: ` • by ${result.username}`, cls: 'freesound-result-username' });

			if (result.description) {
				const descEl = infoSection.createDiv({ cls: 'freesound-result-description' });
				descEl.textContent = result.description.substring(0, 100) + (result.description.length > 100 ? '...' : '');
			}

			// Action buttons
			const actionsSection = resultItem.createDiv({ cls: 'freesound-result-actions' });

			// Preview button
			const previewBtn = actionsSection.createEl('button', {
				text: 'Preview',
				cls: 'freesound-action-btn freesound-preview-btn'
			});
			previewBtn.addEventListener('click', () => this.previewSample(result, previewBtn));

			// Add to library button
			const addBtn = actionsSection.createEl('button', {
				text: 'Add to Library',
				cls: 'freesound-action-btn freesound-add-btn'
			});
			addBtn.addEventListener('click', () => this.addSampleToLibrary(result));
		});
	}

	private async previewSample(result: FreesoundSearchResult, button: HTMLButtonElement): Promise<void> {
		// If already playing this sample, stop it
		if (button.textContent === 'Stop') {
			this.stopPreview();
			return;
		}

		// Stop any currently playing preview
		if (this.currentAudio) {
			this.stopPreview();
		}

		const originalText = button.textContent || 'Preview';

		try {
			// Show loading
			button.textContent = 'Loading...';
			button.disabled = true;

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

			button.textContent = 'Stop';
			button.disabled = false;

			audio.addEventListener('ended', () => {
				if (this.currentPreviewButton) {
					this.currentPreviewButton.textContent = originalText;
				}
				this.currentAudio = null;
				this.currentPreviewButton = null;
			});

		} catch (error) {
			logger.error('preview', `Failed to preview sample ${result.id}`, error);
			button.textContent = 'Error';
			setTimeout(() => {
				button.textContent = originalText;
				button.disabled = false;
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
			this.currentPreviewButton.textContent = 'Preview';
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
		this.resultsContainer.createEl('p', {
			text: `Error: ${error.message || 'Unknown error'}`,
			cls: 'freesound-error-message'
		});
	}

	private updateSearchButton(text: string): void {
		const button = this.contentEl.querySelector('.freesound-search-button');
		if (button) {
			button.textContent = text;
			(button as HTMLButtonElement).disabled = this.isSearching;
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
