/**
 * Sonic Graph Freesound & Presets Settings - Phase 8.1
 *
 * Phase 7 Freesound integration and preset management for Control Center.
 * Contains: Freesound API, Caching & Preloading, Preset Management.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('SonicGraphFreesoundSettings');

export class SonicGraphFreesoundSettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all Freesound & Presets settings sections
	 */
	public render(container: HTMLElement): void {
		logger.debug('freesound-settings', 'Rendering Freesound & Presets settings');

		// Section 1: Freesound API Integration
		this.renderFreesoundApiSection(container);

		// Section 2: Caching & Preloading
		this.renderCachingSection(container);

		// Section 3: Preset Management
		this.renderPresetManagementSection(container);
	}

	/**
	 * Section 1: Freesound API Integration (Phase 7.1)
	 */
	private renderFreesoundApiSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Freesound API integration',
			iconName: 'cloud-download',
			subtitle: 'Access Freesound.org audio library',
			elevation: 1
		});

		const content = card.getContent();

		// Info about Freesound
		const infoDiv = content.createDiv({ cls: 'osp-settings-note' });
		const infoP1 = infoDiv.createEl('p');
		infoP1.style.color = 'var(--text-muted)';
		infoP1.style.fontSize = '13px';
		infoP1.style.lineHeight = '1.5';
		infoP1.style.marginBottom = '1rem';
		infoP1.createEl('strong', { text: 'About Freesound:' });
		infoP1.appendText(' Freesound.org is a collaborative database of Creative Commons ' +
			'licensed sounds. An API key is required to download samples for the continuous layer system.');

		const infoP2 = infoDiv.createEl('p');
		infoP2.style.color = 'var(--text-muted)';
		infoP2.style.fontSize = '13px';
		infoP2.style.lineHeight = '1.5';
		infoP2.style.marginBottom = '1rem';
		infoP2.appendText('Get your free API key at: ');
		const apiLink = infoP2.createEl('a', {
			text: 'https://freesound.org/apiv2/apply/',
			href: 'https://freesound.org/apiv2/apply/'
		});
		apiLink.style.color = 'var(--text-accent)';

		// API key input with test button
		new Setting(content)
			.setName('Freesound API key')
			.setDesc('Your personal API key from Freesound.org')
			.addText(text => text
				.setPlaceholder('Enter API key...')
				.setValue(this.plugin.settings.freesoundApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.freesoundApiKey = value;
					await this.plugin.saveSettings();
					logger.info('freesound-settings', `API key ${value ? 'set' : 'cleared'}`);
				})
			)
			.addButton(button => button
				.setButtonText('Test')
				.setTooltip('Test API key connection')
				.onClick(async () => {
					const apiKey = this.plugin.settings.freesoundApiKey;
					if (!apiKey || apiKey.trim().length === 0) {
						button.setButtonText('No key');
						setTimeout(() => button.setButtonText('Test'), 2000);
						return;
					}

					button.setButtonText('Testing...');
					button.setDisabled(true);

					try {
						// Use FreesoundAuthManager to test connection (same as original working implementation)
						const { FreesoundAuthManager } = await import('../../audio/freesound/FreesoundAuthManager');
						const authManager = new FreesoundAuthManager({ apiKey: apiKey.trim() });
						const result = await authManager.testConnection();

						if (result.success) {
							button.setButtonText('✓ Valid');
							const username = result.username ? ` (${result.username})` : '';
							logger.info('freesound-settings', `API key valid${username}`);
						} else {
							button.setButtonText('✗ Invalid');
							logger.warn('freesound-settings', `API test failed: ${result.message}`);
						}
					} catch (error) {
						button.setButtonText('✗ Failed');
						logger.error('freesound-settings', `API test error: ${error.message}`);
					} finally {
						button.setDisabled(false);
						setTimeout(() => button.setButtonText('Test'), 3000);
					}
				})
			);

		// Enable Freesound samples toggle
		new Setting(content)
			.setName('Enable Freesound samples')
			.setDesc('Use Freesound.org samples for continuous ambient layers')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableFreesoundSamples || false)
				.onChange(async (value) => {
					this.plugin.settings.enableFreesoundSamples = value;
					await this.plugin.saveSettings();
					logger.info('freesound-settings', `Freesound samples: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 2: Caching & Preloading (Phase 7.3)
	 */
	private renderCachingSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Caching and preloading',
			iconName: 'database',
			subtitle: 'Optimize sample loading performance',
			elevation: 1
		});

		const content = card.getContent();

		// Description
		const description = content.createDiv({ cls: 'osp-settings-description' });
		const descP = description.createEl('p');
		descP.style.color = 'var(--text-muted)';
		descP.style.fontSize = '13px';
		descP.style.lineHeight = '1.5';
		descP.style.marginBottom = '1rem';
		descP.textContent = 'Control how Freesound samples are cached and preloaded for optimal performance.';

		// Predictive preload toggle
		new Setting(content)
			.setName('Predictive preload')
			.setDesc('Anticipate and preload samples based on usage patterns')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.freesoundPredictivePreload ?? true)
				.onChange(async (value) => {
					this.plugin.settings.freesoundPredictivePreload = value;
					await this.plugin.saveSettings();
					logger.info('freesound-settings', `Predictive preload: ${value}`);
				})
			);

		// Preload on startup toggle
		new Setting(content)
			.setName('Preload on startup')
			.setDesc('Load frequently used samples when Obsidian starts')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.freesoundPreloadOnStartup ?? false)
				.onChange(async (value) => {
					this.plugin.settings.freesoundPreloadOnStartup = value;
					await this.plugin.saveSettings();
					logger.info('freesound-settings', `Preload on startup: ${value}`);
				})
			);

		// Background loading toggle
		new Setting(content)
			.setName('Background loading')
			.setDesc('Load samples in the background during idle time')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.freesoundBackgroundLoading ?? true)
				.onChange(async (value) => {
					this.plugin.settings.freesoundBackgroundLoading = value;
					await this.plugin.saveSettings();
					logger.info('freesound-settings', `Background loading: ${value}`);
				})
			);

		// Cache strategy dropdown
		new Setting(content)
			.setName('Cache strategy')
			.setDesc('Algorithm for managing cached samples')
			.addDropdown(dropdown => dropdown
				.addOption('lru', 'LRU - Least Recently Used')
				.addOption('lfu', 'LFU - Least Frequently Used')
				.addOption('fifo', 'FIFO - First In First Out')
				.addOption('adaptive', 'Adaptive - Smart balancing')
				.addOption('predictive', 'Predictive - Pattern based')
				.setValue(this.plugin.settings.freesoundCacheStrategy || 'adaptive')
				.onChange(async (value) => {
					this.plugin.settings.freesoundCacheStrategy = value as any;
					await this.plugin.saveSettings();
					logger.info('freesound-settings', `Cache strategy: ${value}`);
				})
			);

		// Max storage slider
		new Setting(content)
			.setName('Max cache storage')
			.setDesc('Maximum disk space for cached samples (MB)')
			.addSlider(slider => slider
				.setLimits(50, 1000, 50)
				.setValue(this.plugin.settings.freesoundMaxStorageMB || 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.freesoundMaxStorageMB = value;
					await this.plugin.saveSettings();
					logger.info('freesound-settings', `Max cache storage: ${value}MB`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 3: Preset Management
	 */
	private renderPresetManagementSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Preset management',
			iconName: 'save',
			subtitle: 'Save and load configuration presets',
			elevation: 1
		});

		const content = card.getContent();

		// Description
		const description = content.createDiv({ cls: 'osp-settings-description' });
		const descP = description.createEl('p');
		descP.style.color = 'var(--text-muted)';
		descP.style.fontSize = '13px';
		descP.style.lineHeight = '1.5';
		descP.style.marginBottom = '1rem';
		descP.textContent = 'Presets allow you to save complete Sonic Graph configurations and quickly switch between ' +
			'different setups for different vaults or workflows.';

		// Current preset display
		const currentPreset = (this.plugin.settings.sonicGraphSettings as any)?.currentPreset || 'Default';
		new Setting(content)
			.setName('Current preset')
			.setDesc('Currently active configuration preset')
			.addText(text => text
				.setValue(currentPreset)
				.setDisabled(true)
			);

		// Preset count info
		const customPresetCount = (this.plugin.settings.sonicGraphSettings as any)?.customPresets?.length || 0;
		const presetInfo = content.createDiv({ cls: 'osp-settings-note' });
		const presetP = presetInfo.createEl('p');
		presetP.style.color = 'var(--text-muted)';
		presetP.style.fontSize = '12px';
		presetP.style.marginTop = '0.5rem';
		presetP.createEl('strong', { text: 'Custom Presets:' });
		presetP.appendText(` ${customPresetCount} saved`);

		// Action buttons section
		const actionsDiv = content.createDiv({ cls: 'osp-settings-actions' });

		// Note about preset management
		const noteDiv = content.createDiv({ cls: 'osp-settings-note' });
		const noteP = noteDiv.createEl('p');
		noteP.style.color = 'var(--text-muted)';
		noteP.style.fontSize = '12px';
		noteP.style.marginTop = '1rem';
		noteP.createEl('strong', { text: 'Note:' });
		noteP.appendText(' Full preset management (save, load, export, import) is available ' +
			'in the Sonic Graph modal\'s settings panel. This shows the currently active preset only.');

		container.appendChild(card.getElement());
	}
}