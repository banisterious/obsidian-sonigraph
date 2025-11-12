/**
 * Extended Obsidian type definitions
 *
 * This file extends the Obsidian API types with additional properties
 * that exist at runtime but are not documented in the official API.
 */

import { App } from 'obsidian';

/**
 * Extended App interface with undocumented properties
 */
declare module 'obsidian' {
	interface App {
		/**
		 * Settings manager (undocumented)
		 * Used to programmatically open settings
		 */
		setting: {
			open(): void;
			openTabById(id: string): void;
		};
	}
}

/**
 * Pending state for view restoration
 */
export interface ViewPendingState {
	timelinePosition?: number;
	animationSpeed?: number;
}

/**
 * Extended view with pending state
 */
export interface ViewWithPendingState {
	_pendingState?: ViewPendingState;
}

/**
 * Window with requestIdleCallback support
 * Part of the standard API but may not be in all TypeScript lib versions
 */
declare global {
	interface Window {
		requestIdleCallback(callback: () => void): number;
	}
}

/**
 * Helper type for dynamic property access on settings objects
 * Used when updating settings with string keys
 */
export type DynamicSettings = Record<string, unknown>;
