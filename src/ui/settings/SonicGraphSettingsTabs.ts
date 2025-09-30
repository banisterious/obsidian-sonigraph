/**
 * Sonic Graph Settings Tabs - Phase 8.1
 *
 * Horizontal tab navigation system for organizing Sonic Graph settings
 * in the Control Center. Provides 4 main tabs:
 * - Core Settings: Essential graph, audio, and content mapping
 * - Audio Layers: Phase 3 continuous layers
 * - Advanced Features: Phases 5-6 clustering, theory, orchestration, spatial
 * - Freesound & Presets: Phase 7 integration and preset management
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { createLucideIcon, LucideIconName } from '../lucide-icons';
import { getLogger } from '../../logging';
import { MaterialCard } from '../material-components';

const logger = getLogger('SonicGraphSettingsTabs');

export interface SonicGraphTabConfig {
	id: 'core' | 'layers' | 'advanced' | 'freesound';
	label: string;
	icon: LucideIconName;
	description: string;
	renderContent: (container: HTMLElement) => void;
}

/**
 * Tab Manager for Sonic Graph Settings
 * Handles tab navigation and content rendering
 */
export class SonicGraphSettingsTabs {
	private app: App;
	private plugin: SonigraphPlugin;
	private container: HTMLElement;
	private tabNavigation: HTMLElement;
	private tabContent: HTMLElement;
	private activeTabId: 'core' | 'layers' | 'advanced' | 'freesound' = 'core';
	private tabs: SonicGraphTabConfig[];

	constructor(app: App, plugin: SonigraphPlugin, container: HTMLElement) {
		this.app = app;
		this.plugin = plugin;
		this.container = container;

		// Define tab configurations
		this.tabs = [
			{
				id: 'core',
				label: 'Core Settings',
				icon: 'settings',
				description: 'Essential graph, audio, and content mapping settings',
				renderContent: (container) => this.renderCoreSettings(container)
			},
			{
				id: 'layers',
				label: 'Audio Layers',
				icon: 'layers',
				description: 'Continuous ambient, rhythmic, and harmonic layers',
				renderContent: (container) => this.renderAudioLayersSettings(container)
			},
			{
				id: 'advanced',
				label: 'Advanced Features',
				icon: 'sparkles',
				description: 'Clustering, musical theory, orchestration, and spatial audio',
				renderContent: (container) => this.renderAdvancedSettings(container)
			},
			{
				id: 'freesound',
				label: 'Freesound & Presets',
				icon: 'package',
				description: 'Sample integration and preset management',
				renderContent: (container) => this.renderFreesoundSettings(container)
			}
		];

		this.render();
	}

	/**
	 * Main render method - creates tab navigation and content area
	 */
	private render(): void {
		// Create tab navigation
		this.tabNavigation = this.container.createDiv({ cls: 'osp-sonic-tabs-nav' });

		// Create tab buttons
		this.tabs.forEach(tab => {
			const tabButton = this.tabNavigation.createDiv({
				cls: `osp-sonic-tab-button ${tab.id === this.activeTabId ? 'active' : ''}`,
				attr: { 'data-tab-id': tab.id }
			});

			// Tab icon
			const icon = createLucideIcon(tab.icon);
			icon.addClass('osp-sonic-tab-icon');
			tabButton.appendChild(icon);

			// Tab label
			const label = tabButton.createSpan({
				cls: 'osp-sonic-tab-label',
				text: tab.label
			});

			// Click handler
			tabButton.addEventListener('click', () => this.switchTab(tab.id));
		});

		// Create content container
		this.tabContent = this.container.createDiv({ cls: 'osp-sonic-tabs-content' });

		// Render initial tab
		this.renderActiveTab();
	}

	/**
	 * Switch to a different tab
	 */
	private switchTab(tabId: 'core' | 'layers' | 'advanced' | 'freesound'): void {
		if (tabId === this.activeTabId) return;

		logger.debug('tabs', `Switching from ${this.activeTabId} to ${tabId}`);

		// Update active state in navigation
		this.tabNavigation.querySelectorAll('.osp-sonic-tab-button').forEach(button => {
			const buttonTabId = button.getAttribute('data-tab-id');
			if (buttonTabId === tabId) {
				button.addClass('active');
			} else {
				button.removeClass('active');
			}
		});

		// Update active tab
		this.activeTabId = tabId;

		// Re-render content
		this.renderActiveTab();
	}

	/**
	 * Render the currently active tab's content
	 */
	private renderActiveTab(): void {
		// Clear existing content
		this.tabContent.empty();

		// Find active tab config
		const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
		if (!activeTab) {
			logger.error('tabs', `Tab config not found for ${this.activeTabId}`);
			return;
		}

		// Add tab description header
		const header = this.tabContent.createDiv({ cls: 'osp-sonic-tab-header' });
		header.createEl('h3', { text: activeTab.label });
		header.createEl('p', {
			text: activeTab.description,
			cls: 'osp-sonic-tab-description'
		});

		// Create scrollable content area
		const contentScroll = this.tabContent.createDiv({ cls: 'osp-sonic-tab-content-scroll' });

		// Render tab-specific content
		activeTab.renderContent(contentScroll);
	}

	/**
	 * Core Settings Tab Content
	 */
	private renderCoreSettings(container: HTMLElement): void {
		logger.debug('tabs', 'Rendering Core Settings tab');

		// Placeholder - will be implemented in separate file
		const placeholder = container.createDiv({ cls: 'osp-settings-placeholder' });
		placeholder.innerHTML = `
			<p style="color: var(--text-muted); text-align: center; padding: 2rem;">
				Core Settings content will be implemented next.
			</p>
		`;
	}

	/**
	 * Audio Layers Tab Content
	 */
	private renderAudioLayersSettings(container: HTMLElement): void {
		logger.debug('tabs', 'Rendering Audio Layers tab');

		// Placeholder
		const placeholder = container.createDiv({ cls: 'osp-settings-placeholder' });
		placeholder.innerHTML = `
			<p style="color: var(--text-muted); text-align: center; padding: 2rem;">
				Audio Layers content will be implemented next.
			</p>
		`;
	}

	/**
	 * Advanced Features Tab Content
	 */
	private renderAdvancedSettings(container: HTMLElement): void {
		logger.debug('tabs', 'Rendering Advanced Features tab');

		// Placeholder
		const placeholder = container.createDiv({ cls: 'osp-settings-placeholder' });
		placeholder.innerHTML = `
			<p style="color: var(--text-muted); text-align: center; padding: 2rem;">
				Advanced Features content will be implemented next.
			</p>
		`;
	}

	/**
	 * Freesound & Presets Tab Content
	 */
	private renderFreesoundSettings(container: HTMLElement): void {
		logger.debug('tabs', 'Rendering Freesound & Presets tab');

		// Placeholder
		const placeholder = container.createDiv({ cls: 'osp-settings-placeholder' });
		placeholder.innerHTML = `
			<p style="color: var(--text-muted); text-align: center; padding: 2rem;">
				Freesound & Presets content will be implemented next.
			</p>
		`;
	}

	/**
	 * Public API: Switch to a specific tab programmatically
	 */
	public showTab(tabId: 'core' | 'layers' | 'advanced' | 'freesound'): void {
		this.switchTab(tabId);
	}

	/**
	 * Public API: Get current active tab
	 */
	public getActiveTab(): string {
		return this.activeTabId;
	}

	/**
	 * Cleanup method
	 */
	public destroy(): void {
		logger.debug('tabs', 'Destroying SonicGraphSettingsTabs');
		this.container.empty();
	}
}