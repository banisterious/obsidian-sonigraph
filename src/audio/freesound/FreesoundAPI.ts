/**
 * FreesoundAPI
 *
 * Wrapper for Freesound API v2 with focus on preview URL access.
 * Provides methods for searching sounds and retrieving preview URLs.
 *
 * Preview Strategy:
 * - Uses preview-hq-mp3 URLs (128kbps MP3)
 * - No OAuth2 required for preview access
 * - Token authentication only
 * - Suitable for continuous layer backgrounds
 *
 * API Documentation: https://freesound.org/docs/api/
 */

import { requestUrl } from 'obsidian';
import { FreesoundAuthManager } from './FreesoundAuthManager';

/**
 * Sound search filters
 */
export interface FreesoundSearchFilters {
	query?: string;
	filter?: string; // Advanced filter query (e.g., "tag:ambient duration:[10.0 TO 30.0]")
	sort?: 'score' | 'duration_desc' | 'duration_asc' | 'created_desc' | 'created_asc' | 'downloads_desc' | 'downloads_asc' | 'rating_desc' | 'rating_asc';
	page?: number;
	pageSize?: number; // Max 150
	fields?: string; // Comma-separated list of fields to return
}

/**
 * Sound preview information
 */
export interface FreesoundPreview {
	previewHqMp3: string;
	previewHqOgg: string;
	previewLqMp3: string;
	previewLqOgg: string;
}

/**
 * Basic sound information from Freesound API
 */
export interface FreesoundSound {
	id: number;
	name: string;
	tags: string[];
	description: string;
	username: string;
	duration: number;
	previews: FreesoundPreview;
	download: string; // Requires OAuth2 for full quality
	license: string;
	type: string; // e.g., "wav", "mp3"
	filesize: number;
	bitrate: number;
	bitdepth: number;
	samplerate: number;
	pack?: string;
	pack_name?: string;
	num_downloads: number;
	avg_rating: number;
	num_ratings: number;
	url: string; // Freesound page URL
}

/**
 * Search results from Freesound API
 */
export interface FreesoundSearchResults {
	count: number;
	next: string | null;
	previous: string | null;
	results: FreesoundSound[];
}

/**
 * Error response from Freesound API
 */
export interface FreesoundError {
	detail?: string;
	error?: string;
	message?: string;
}

/**
 * Wrapper for Freesound API v2
 */
export class FreesoundAPI {
	private authManager: FreesoundAuthManager;
	private baseUrl: string;

	constructor(authManager: FreesoundAuthManager) {
		this.authManager = authManager;
		this.baseUrl = authManager.getBaseUrl();
	}

	/**
	 * Search for sounds on Freesound
	 */
	async searchSounds(filters: FreesoundSearchFilters): Promise<FreesoundSearchResults> {
		if (!this.authManager.hasApiKey()) {
			throw new Error('No API key configured. Please set your Freesound API key in settings.');
		}

		// Build query parameters
		const params = new URLSearchParams();

		if (filters.query) {
			void params.append('query', filters.query);
		}

		if (filters.filter) {
			void params.append('filter', filters.filter);
		}

		if (filters.sort) {
			void params.append('sort', filters.sort);
		}

		if (filters.page) {
			params.append('page', filters.page.toString());
		}

		if (filters.pageSize) {
			params.append('page_size', Math.min(filters.pageSize, 150).toString());
		}

		// Request preview URLs and other essential fields
		const defaultFields = 'id,name,tags,description,username,duration,previews,license,type,url,num_downloads,avg_rating';
		void params.append('fields', filters.fields || defaultFields);

		try {
			const response = await requestUrl({
				url: `${this.baseUrl}/search/text/?${params.toString()}`,
				method: 'GET',
				headers: this.authManager.getAuthHeaders()
			});

			const results: FreesoundSearchResults = response.json;
			return results;

		} catch (error) {
			throw new Error(`Freesound search error: ${error.message}`);
		}
	}

	/**
	 * Get detailed information about a specific sound
	 */
	async getSound(soundId: number): Promise<FreesoundSound> {
		if (!this.authManager.hasApiKey()) {
			throw new Error('No API key configured. Please set your Freesound API key in settings.');
		}

		try {
			const response = await requestUrl({
				url: `${this.baseUrl}/sounds/${soundId}/`,
				method: 'GET',
				headers: this.authManager.getAuthHeaders()
			});

			const sound: FreesoundSound = response.json;
			return sound;

		} catch (error) {
			throw new Error(`Freesound API error: ${error.message}`);
		}
	}

	/**
	 * Get preview URL for a sound (high quality MP3)
	 * This is the preferred method for continuous layer samples
	 */
	async getPreviewUrl(soundId: number): Promise<string> {
		const sound = await this.getSound(soundId);
		return sound.previews.previewHqMp3;
	}

	/**
	 * Search for sounds by tags
	 * Convenience method for tag-based searches
	 */
	async searchByTags(tags: string[], options?: Partial<FreesoundSearchFilters>): Promise<FreesoundSearchResults> {
		const tagFilter = tags.map(tag => `tag:${tag}`).join(' ');

		return await this.searchSounds({
			filter: tagFilter,
			sort: options?.sort || 'rating_desc',
			page: options?.page || 1,
			pageSize: options?.pageSize || 15,
			fields: options?.fields
		});
	}

	/**
	 * Search for sounds by duration range
	 * Useful for finding samples of appropriate length
	 */
	async searchByDuration(minDuration: number, maxDuration: number, options?: Partial<FreesoundSearchFilters>): Promise<FreesoundSearchResults> {
		const durationFilter = `duration:[${minDuration} TO ${maxDuration}]`;
		const combinedFilter = options?.filter
			? `${options.filter} ${durationFilter}`
			: durationFilter;

		return await this.searchSounds({
			...options,
			filter: combinedFilter
		});
	}

	/**
	 * Get similar sounds to a given sound ID
	 * Uses Freesound's similarity endpoint
	 */
	async getSimilarSounds(soundId: number, limit: number = 15): Promise<FreesoundSound[]> {
		if (!this.authManager.hasApiKey()) {
			throw new Error('No API key configured. Please set your Freesound API key in settings.');
		}

		try {
			const params = new URLSearchParams();
			params.append('page_size', Math.min(limit, 150).toString());

			const response = await requestUrl({
				url: `${this.baseUrl}/sounds/${soundId}/similar/?${params.toString()}`,
				method: 'GET',
				headers: this.authManager.getAuthHeaders()
			});

			const results = response.json;
			return results.results || [];

		} catch (error) {
			throw new Error(`Freesound API error: ${error.message}`);
		}
	}

	/**
	 * Update the auth manager (useful if API key changes)
	 */
	setAuthManager(authManager: FreesoundAuthManager): void {
		this.authManager = authManager;
		this.baseUrl = authManager.getBaseUrl();
	}

	/**
	 * Get the current auth manager
	 */
	getAuthManager(): FreesoundAuthManager {
		return this.authManager;
	}
}