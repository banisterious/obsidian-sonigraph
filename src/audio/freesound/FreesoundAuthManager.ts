/**
 * FreesoundAuthManager
 *
 * Manages authentication and connection testing for the Freesound API.
 * Uses simple token-based authentication with API keys - no OAuth2 flow required
 * for preview URL access.
 *
 * Security Note: API keys are stored in plain text in plugin settings.
 * This is transparent to users and follows Obsidian plugin standards.
 */

import { requestUrl } from 'obsidian';
import { getLogger } from '../../logging';

const logger = getLogger('freesound-auth');

export interface FreesoundAuthConfig {
	apiKey: string;
	baseUrl?: string;
}

export interface FreesoundConnectionTestResult {
	success: boolean;
	message: string;
	username?: string;
	error?: string;
}

/**
 * Manages Freesound API authentication and connection testing
 */
export class FreesoundAuthManager {
	private apiKey: string;
	private baseUrl: string;
	private lastTestResult: FreesoundConnectionTestResult | null = null;

	constructor(config: FreesoundAuthConfig) {
		this.apiKey = config.apiKey;
		this.baseUrl = config.baseUrl || 'https://freesound.org/apiv2';
	}

	/**
	 * Update the API key
	 */
	setApiKey(apiKey: string): void {
		this.apiKey = apiKey;
		this.lastTestResult = null; // Invalidate cached test result
	}

	/**
	 * Get the current API key
	 */
	getApiKey(): string {
		return this.apiKey;
	}

	/**
	 * Check if an API key is configured
	 */
	hasApiKey(): boolean {
		return this.apiKey && this.apiKey.length > 0;
	}

	/**
	 * Get authentication headers for API requests
	 */
	getAuthHeaders(): Record<string, string> {
		// Freesound API uses "Token" authentication (not "Bearer")
		// Format: Authorization: Token YOUR_API_KEY
		const trimmedKey = this.apiKey.trim();
		return {
			'Authorization': `Token ${trimmedKey}`
		};
	}

	/**
	 * Test the API connection and validate the API key
	 * Returns connection status and user information if successful
	 */
	async testConnection(): Promise<FreesoundConnectionTestResult> {
		if (!this.hasApiKey()) {
			return {
				success: false,
				message: 'No API key configured',
				error: 'API_KEY_MISSING'
			};
		}

		try {
			// Test the API key by performing a simple search
			// Note: /me/ requires OAuth2, but search endpoints work with Token auth
			const url = `${this.baseUrl}/search/text/?query=test&page_size=1`;
			const trimmedKey = this.apiKey.trim();

			logger.info('freesound-auth', `Testing connection to: ${url}`);
			logger.debug('freesound-auth', `API key length: ${trimmedKey.length} characters`);
			logger.debug('freesound-auth', `API key first 8 chars: ${trimmedKey.substring(0, 8)}...`);
			logger.debug('freesound-auth', `API key last 4 chars: ...${trimmedKey.substring(trimmedKey.length - 4)}`);

			const response = await requestUrl({
				url,
				method: 'GET',
				headers: this.getAuthHeaders()
			});

			logger.info('freesound-auth', `Response status: ${response.status}`);

			// Parse search results to verify API key works
			const searchResults = response.json;
			logger.info('freesound-auth', `Search successful, found ${searchResults.count} results`);
			logger.debug('freesound-auth', `Search response: ${JSON.stringify(searchResults)}`);

			// API key is valid if we got results
			this.lastTestResult = {
				success: true,
				message: `API key is valid and working`,
				username: undefined // We can't get username without OAuth2
			};

			return this.lastTestResult;

		} catch (error) {
			logger.error('freesound-auth', `Connection test exception: ${error.message}`);
			logger.debug('freesound-auth', `Error stack: ${error.stack}`);

			this.lastTestResult = {
				success: false,
				message: `Network error: ${error.message}`,
				error: 'NETWORK_ERROR'
			};

			return this.lastTestResult;
		}
	}

	/**
	 * Get the last connection test result (cached)
	 */
	getLastTestResult(): FreesoundConnectionTestResult | null {
		return this.lastTestResult;
	}

	/**
	 * Clear cached test result
	 */
	clearTestResult(): void {
		this.lastTestResult = null;
	}

	/**
	 * Validate API key format (basic check)
	 * Freesound API keys are typically 32-character alphanumeric strings
	 */
	validateApiKeyFormat(apiKey: string): boolean {
		if (!apiKey || apiKey.length === 0) {
			return false;
		}

		// Basic validation: should be alphanumeric and reasonable length
		// Freesound keys are typically 32 characters but can vary
		const isValidFormat = /^[a-zA-Z0-9]{20,64}$/.test(apiKey);

		return isValidFormat;
	}

	/**
	 * Get the base URL for API requests
	 */
	getBaseUrl(): string {
		return this.baseUrl;
	}

	/**
	 * Set a custom base URL (useful for testing or proxy scenarios)
	 */
	setBaseUrl(baseUrl: string): void {
		this.baseUrl = baseUrl;
	}
}