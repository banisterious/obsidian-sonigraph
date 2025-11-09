/**
 * Local Soundscape Settings
 *
 * Comprehensive audio configuration settings for Local Soundscape feature.
 * Contains: Auto-play, Musical Key, Context-Aware Modifiers, and Musical Enhancements.
 *
 * This consolidates settings previously scattered across view sidebar and Control Center.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('LocalSoundscapeSettings');

export class LocalSoundscapeSettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all Local Soundscape audio settings sections
	 */
	public render(container: HTMLElement): void {
		logger.debug('ls-settings', 'Rendering Local Soundscape settings');

		// Clear container to prevent duplicates on re-render
		container.empty();

		// Section 1: Auto-play Settings
		this.renderAutoPlaySettings(container);

		// Section 2: Musical Key Selection
		this.renderMusicalKeySettings(container);

		// Section 3: Context-Aware Modifiers
		this.renderContextAwareSettings(container);

		// Section 4: Musical Theory & Enhancements (Phase 2/3)
		this.renderMusicalEnhancementsSettings(container);
	}

	/**
	 * Section 1: Auto-play Settings
	 */
	private renderAutoPlaySettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Auto-play settings',
			iconName: 'play',
			subtitle: 'Control automatic playback behavior',
			elevation: 1
		});

		const content = card.getContent();

		// Auto-play when opening toggle
		new Setting(content)
			.setName('Auto-play when opening')
			.setDesc('Automatically start playback when opening Local Soundscape view')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.localSoundscape?.autoPlay || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.localSoundscape) {
						this.plugin.settings.localSoundscape = {};
					}
					this.plugin.settings.localSoundscape.autoPlay = value;
					await this.plugin.saveSettings();
					logger.info('auto-play', `Auto-play on open: ${value}`);
				})
			);

		// Auto-play active note toggle
		new Setting(content)
			.setName('Auto-play active note')
			.setDesc('Automatically play the currently active note when it changes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.localSoundscape?.autoPlayActiveNote || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.localSoundscape) {
						this.plugin.settings.localSoundscape = {};
					}
					this.plugin.settings.localSoundscape.autoPlayActiveNote = value;
					await this.plugin.saveSettings();
					logger.info('auto-play', `Auto-play active note: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 2: Musical Key Selection
	 */
	private renderMusicalKeySettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Musical key selection',
			iconName: 'music',
			subtitle: 'Determine the musical key based on note context',
			elevation: 1
		});

		const content = card.getContent();

		// Initialize keySelection if it doesn't exist
		if (!this.plugin.settings.localSoundscape?.keySelection) {
			if (!this.plugin.settings.localSoundscape) {
				this.plugin.settings.localSoundscape = {};
			}
			this.plugin.settings.localSoundscape.keySelection = {
				mode: 'vault-name',
				folderDepth: 1,
				customKey: 'C'
			};
		}

		const keySelection = this.plugin.settings.localSoundscape.keySelection;

		// Key based on dropdown
		new Setting(content)
			.setName('Key based on')
			.setDesc('How to determine the musical key for the soundscape')
			.addDropdown(dropdown => dropdown
				.addOption('vault-name', 'Vault name')
				.addOption('root-folder', 'Root folder')
				.addOption('folder-path', 'Folder path')
				.addOption('full-path', 'Full path')
				.addOption('file-name', 'File name')
				.addOption('custom', 'Custom key')
				.setValue(keySelection.mode || 'vault-name')
				.onChange(async (value: any) => {
					keySelection.mode = value;
					await this.plugin.saveSettings();
					logger.info('key-selection', `Key mode: ${value}`);

					// Re-render to show/hide conditional settings
					this.render(container);
				})
			);

		// Folder depth slider (conditional - only shown for folder-path mode)
		if (keySelection.mode === 'folder-path') {
			new Setting(content)
				.setName('Folder depth')
				.setDesc('Which level of folder to use for key selection')
				.addSlider(slider => slider
					.setLimits(1, 5, 1)
					.setValue(keySelection.folderDepth || 1)
					.setDynamicTooltip()
					.onChange(async (value) => {
						keySelection.folderDepth = value;
						await this.plugin.saveSettings();
						logger.info('key-selection', `Folder depth: ${value}`);
					})
				);
		}

		// Custom key dropdown (conditional - only shown for custom mode)
		if (keySelection.mode === 'custom') {
			new Setting(content)
				.setName('Custom key')
				.setDesc('Select a specific musical key')
				.addDropdown(dropdown => {
					// Add all 12 chromatic keys
					const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
					keys.forEach(key => dropdown.addOption(key, key));

					return dropdown
						.setValue(keySelection.customKey || 'C')
						.onChange(async (value) => {
							keySelection.customKey = value;
							await this.plugin.saveSettings();
							logger.info('key-selection', `Custom key: ${value}`);
						});
				});
		}

		// Current key display (read-only info)
		const currentKeyDesc = content.createEl('div', {
			cls: 'setting-item-description',
			text: `Current key will be determined dynamically based on the active note's ${keySelection.mode}.`
		});
		currentKeyDesc.style.marginTop = '10px';
		currentKeyDesc.style.fontStyle = 'italic';
		currentKeyDesc.style.opacity = '0.7';

		container.appendChild(card.getElement());
	}

	/**
	 * Section 3: Context-Aware Modifiers
	 */
	private renderContextAwareSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Context-aware audio modifiers',
			iconName: 'sliders-horizontal',
			subtitle: 'Modify audio based on time, weather, season, and theme',
			elevation: 1
		});

		const content = card.getContent();

		// Initialize contextAware if it doesn't exist
		if (!this.plugin.settings.localSoundscape?.contextAware) {
			if (!this.plugin.settings.localSoundscape) {
				this.plugin.settings.localSoundscape = {};
			}
			this.plugin.settings.localSoundscape.contextAware = {
				enabled: false,
				mode: 'influenced',
				influenceWeight: 0.3,
				season: true,
				timeOfDay: true,
				weather: false,
				theme: false
			};
		}

		const contextAware = this.plugin.settings.localSoundscape.contextAware;

		// Enable context-aware toggle
		new Setting(content)
			.setName('Enable context-aware audio')
			.setDesc('Modify audio parameters based on contextual factors')
			.addToggle(toggle => toggle
				.setValue(contextAware.enabled || false)
				.onChange(async (value) => {
					contextAware.enabled = value;
					await this.plugin.saveSettings();
					logger.info('context-aware', `Enabled: ${value}`);

					// Re-render to show/hide sub-settings
					this.render(container);
				})
			);

		// Show additional settings only if enabled
		if (contextAware.enabled) {
			// Context mode dropdown
			new Setting(content)
				.setName('Context mode')
				.setDesc('How contextual factors affect audio')
				.addDropdown(dropdown => dropdown
					.addOption('influenced', 'Influenced - Blend with base values')
					.addOption('only', 'Only - Use context exclusively')
					.setValue(contextAware.mode || 'influenced')
					.onChange(async (value: any) => {
						contextAware.mode = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Mode: ${value}`);
					})
				);

			// Influence weight slider (only shown in 'influenced' mode)
			if (contextAware.mode === 'influenced') {
				new Setting(content)
					.setName('Influence weight')
					.setDesc('How much context affects the audio (0% = ignore, 100% = dominant)')
					.addSlider(slider => slider
						.setLimits(0, 100, 5)
						.setValue((contextAware.influenceWeight || 0.3) * 100)
						.setDynamicTooltip()
						.onChange(async (value) => {
							contextAware.influenceWeight = value / 100;
							await this.plugin.saveSettings();
							logger.info('context-aware', `Influence weight: ${value}%`);
						})
					);
			}

			// Individual context factor toggles
			new Setting(content)
				.setName('Season influence')
				.setDesc('Modify audio based on current season')
				.addToggle(toggle => toggle
					.setValue(contextAware.season !== false)
					.onChange(async (value) => {
						contextAware.season = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Season: ${value}`);
					})
				);

			new Setting(content)
				.setName('Time of day influence')
				.setDesc('Modify audio based on current time (morning/day/evening/night)')
				.addToggle(toggle => toggle
					.setValue(contextAware.timeOfDay !== false)
					.onChange(async (value) => {
						contextAware.timeOfDay = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Time of day: ${value}`);
					})
				);

			new Setting(content)
				.setName('Weather influence')
				.setDesc('Modify audio based on weather conditions (requires external data)')
				.addToggle(toggle => toggle
					.setValue(contextAware.weather || false)
					.onChange(async (value) => {
						contextAware.weather = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Weather: ${value}`);
					})
				);

			new Setting(content)
				.setName('Theme influence')
				.setDesc('Modify audio based on Obsidian theme (light/dark)')
				.addToggle(toggle => toggle
					.setValue(contextAware.theme || false)
					.onChange(async (value) => {
						contextAware.theme = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Theme: ${value}`);
					})
				);
		}

		container.appendChild(card.getElement());
	}

	/**
	 * Section 4: Musical Theory & Enhancements (Phase 2/3)
	 * Scale quantization, chord voicing, rhythmic patterns, etc.
	 */
	private renderMusicalEnhancementsSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Musical enhancements',
			iconName: 'music-2',
			subtitle: 'Advanced musical features for richer soundscapes',
			elevation: 1
		});

		const content = card.getContent();

		// Note: These settings are configured per-soundscape instance via the DepthBasedMapper
		// They are not stored in plugin settings, but provided here for reference/documentation

		const infoText = content.createEl('div', {
			cls: 'setting-item-description',
			text: 'Musical enhancements are currently configured programmatically. UI controls for scale quantization, chord voicing, adaptive pitch ranges, and rhythmic patterns will be added in a future update.'
		});
		infoText.style.padding = '10px';
		infoText.style.marginBottom = '15px';
		infoText.style.opacity = '0.8';
		infoText.style.fontStyle = 'italic';

		// List of available enhancements with status
		const enhancementsList = content.createEl('div', { cls: 'enhancements-list' });

		const enhancements = [
			{
				name: 'Scale Quantization',
				status: 'Available',
				description: 'Constrains pitches to musical scales for harmonic consonance'
			},
			{
				name: 'Chord Voicing',
				status: 'Available',
				description: 'Adds polyphonic richness with depth-based harmonic layers'
			},
			{
				name: 'Adaptive Pitch Ranges',
				status: 'Available',
				description: 'Key-relative pitch ranges for better harmonic integration'
			},
			{
				name: 'Rhythmic Patterns',
				status: 'Implemented',
				description: 'Temporal organization with multiple pattern types (arpeggio, pulse, etc.)'
			},
			{
				name: 'Tension Tracking',
				status: 'Planned',
				description: 'Melodic arc and tension/release for emotional narrative'
			},
			{
				name: 'Dynamic Panning',
				status: 'Planned',
				description: 'Smooth spatial transitions for immersive stereo field'
			},
			{
				name: 'Turn-Taking',
				status: 'Planned',
				description: 'Instrument dialogue patterns for textural clarity'
			}
		];

		enhancements.forEach(enhancement => {
			const item = enhancementsList.createEl('div', { cls: 'enhancement-item' });
			item.style.padding = '8px 12px';
			item.style.marginBottom = '6px';
			item.style.borderLeft = '3px solid var(--interactive-accent)';
			item.style.backgroundColor = 'var(--background-secondary)';

			const header = item.createEl('div', { cls: 'enhancement-header' });
			header.style.display = 'flex';
			header.style.justifyContent = 'space-between';
			header.style.alignItems = 'center';
			header.style.marginBottom = '4px';

			const name = header.createEl('span', {
				text: enhancement.name,
				cls: 'enhancement-name'
			});
			name.style.fontWeight = '600';

			const statusBadge = header.createEl('span', {
				text: enhancement.status,
				cls: 'enhancement-status'
			});
			statusBadge.style.padding = '2px 8px';
			statusBadge.style.borderRadius = '4px';
			statusBadge.style.fontSize = '0.85em';
			statusBadge.style.fontWeight = '500';

			if (enhancement.status === 'Implemented') {
				statusBadge.style.backgroundColor = 'var(--interactive-success)';
				statusBadge.style.color = 'var(--text-on-accent)';
			} else if (enhancement.status === 'Available') {
				statusBadge.style.backgroundColor = 'var(--interactive-accent)';
				statusBadge.style.color = 'var(--text-on-accent)';
			} else {
				statusBadge.style.backgroundColor = 'var(--background-modifier-border)';
			}

			const description = item.createEl('div', {
				text: enhancement.description,
				cls: 'enhancement-description'
			});
			description.style.fontSize = '0.9em';
			description.style.opacity = '0.8';
		});

		container.appendChild(card.getElement());
	}
}
