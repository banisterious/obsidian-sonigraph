/**
 * Sonic Graph Settings Tabs
 *
 * Horizontal tab navigation system for organizing Sonic Graph settings
 * in the Control Center.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { createLucideIcon, LucideIconName } from '../lucide-icons';
import { getLogger } from '../../logging';
import { MaterialCard } from '../material-components';
import { SonicGraphCoreSettings } from './SonicGraphCoreSettings';
import { SonicGraphLayersSettings } from './SonicGraphLayersSettings';
import { SonicGraphAdvancedSettings } from './SonicGraphAdvancedSettings';
import { SonicGraphFreesoundSettings } from './SonicGraphFreesoundSettings';
import { SonicGraphVisualDisplaySettings } from './SonicGraphVisualDisplaySettings';

const logger = getLogger('SonicGraphSettingsTabs');

export interface SonicGraphTabConfig {
	id: 'core' | 'clustering' | 'musical' | 'spatial' | 'visual-display';
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
	private activeTabId: 'core' | 'clustering' | 'musical' | 'spatial' | 'visual-display' = 'core';
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
				id: 'visual-display',
				label: 'Visual Display',
				icon: 'eye',
				description: 'Accessibility feature for visual note display during playback',
				renderContent: (container) => this.renderVisualDisplaySettings(container)
			},
			{
				id: 'clustering',
				label: 'Smart Clustering',
				icon: 'network',
				description: 'Intelligent note grouping and hub detection',
				renderContent: (container) => this.renderClusteringSettings(container)
			},
			{
				id: 'musical',
				label: 'Musical Features',
				icon: 'music',
				description: 'Musical theory integration and dynamic orchestration',
				renderContent: (container) => this.renderMusicalSettings(container)
			},
			{
				id: 'spatial',
				label: 'Spatial Audio',
				icon: 'radio',
				description: 'Position sounds in stereo space with intelligent panning',
				renderContent: (container) => this.renderSpatialSettings(container)
			}
		];

		void this.render();
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
			void icon.addClass('osp-sonic-tab-icon');
			void tabButton.appendChild(icon);

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
		void this.renderActiveTab();
	}

	/**
	 * Switch to a different tab
	 */
	private switchTab(tabId: 'core' | 'clustering' | 'musical' | 'spatial' | 'visual-display'): void {
		if (tabId === this.activeTabId) return;

		logger.debug('tabs', `Switching from ${this.activeTabId} to ${tabId}`);

		// Update active state in navigation
		this.tabNavigation.querySelectorAll('.osp-sonic-tab-button').forEach(button => {
			const buttonTabId = button.getAttribute('data-tab-id');
			if (buttonTabId === tabId) {
				void button.addClass('active');
			} else {
				void button.removeClass('active');
			}
		});

		// Update active tab
		this.activeTabId = tabId;

		// Re-render content
		void this.renderActiveTab();
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
		void activeTab.renderContent(contentScroll);
	}

	/**
	 * Core Settings Tab Content
	 */
	private renderCoreSettings(container: HTMLElement): void {
		void logger.debug('tabs', 'Rendering Core Settings tab');

		// Render actual core settings
		const coreSettings = new SonicGraphCoreSettings(this.app, this.plugin);
		void coreSettings.render(container);
	}

	/**
	 * Visual Display Tab Content
	 */
	private renderVisualDisplaySettings(container: HTMLElement): void {
		void logger.debug('tabs', 'Rendering Visual Display tab');

		// Render visual display settings
		const visualDisplaySettings = new SonicGraphVisualDisplaySettings(this.app, this.plugin);
		void visualDisplaySettings.render(container);
	}

	/**
	 * Smart Clustering Tab Content
	 */
	private renderClusteringSettings(container: HTMLElement): void {
		void logger.debug('tabs', 'Rendering Smart Clustering tab');

		const advancedSettings = new SonicGraphAdvancedSettings(this.app, this.plugin);
		void advancedSettings.renderClusteringSection(container);
		void advancedSettings.renderHubOrchestrationSection(container);
	}

	/**
	 * Musical Features Tab Content
	 */
	private renderMusicalSettings(container: HTMLElement): void {
		void logger.debug('tabs', 'Rendering Musical Features tab');

		const advancedSettings = new SonicGraphAdvancedSettings(this.app, this.plugin);
		void advancedSettings.renderMusicalTheorySection(container);
		void advancedSettings.renderDynamicOrchestrationSection(container);
	}

	/**
	 * Spatial Audio Tab Content
	 */
	private renderSpatialSettings(container: HTMLElement): void {
		void logger.debug('tabs', 'Rendering Spatial Audio tab');

		const advancedSettings = new SonicGraphAdvancedSettings(this.app, this.plugin);
		void advancedSettings.renderSpatialAudioSection(container);
	}

	/**
	 * Public API: Switch to a specific tab programmatically
	 */
	public showTab(tabId: 'core' | 'clustering' | 'musical' | 'spatial' | 'visual-display'): void {
		void this.switchTab(tabId);
	}

	/**
	 * Public API: Refresh the current tab (re-render)
	 */
	public refresh(): void {
		void logger.debug('tabs', 'Refreshing active tab');
		void this.renderActiveTab();
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
		void logger.debug('tabs', 'Destroying SonicGraphSettingsTabs');
		this.container.empty();
	}
}