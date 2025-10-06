/**
 * Sonic Graph Visual Display Settings
 *
 * Accessibility feature for visual note display during timeline playback.
 * Provides settings for piano roll, spectrum analyzer, and other visualization modes.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('SonicGraphVisualDisplaySettings');

export class SonicGraphVisualDisplaySettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all visual display settings sections
	 */
	public render(container: HTMLElement): void {
		logger.debug('visual-display-settings', 'Rendering visual display settings');

		// Section 1: Core Visual Display Settings
		this.renderCoreDisplaySettings(container);

		// Section 2: Visualization Customization
		this.renderVisualizationCustomization(container);

		// Section 3: Performance Settings
		this.renderPerformanceSettings(container);
	}

	/**
	 * Section 1: Core Visual Display Settings
	 */
	private renderCoreDisplaySettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Visual note display',
			iconName: 'eye',
			subtitle: 'Accessibility feature: visualize notes during playback',
			elevation: 1
		});

		const content = card.getContent();

		// Enable visual display toggle
		new Setting(content)
			.setName('Enable visual note display')
			.setDesc('Show visual representation of notes during timeline playback (improves accessibility)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.enabled ?? true)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					if (!this.plugin.settings.sonicGraphSettings.visualDisplay) {
						this.plugin.settings.sonicGraphSettings.visualDisplay = {
							enabled: true,
							mode: 'piano-roll',
							frameRate: 30,
							colorScheme: 'layer',
							showLabels: true,
							showGrid: true,
							enableTrails: false,
							height: 250
						};
					}
					this.plugin.settings.sonicGraphSettings.visualDisplay.enabled = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Visual display enabled: ${value}`);
				})
			);

		// Visualization mode dropdown
		new Setting(content)
			.setName('Visualization mode')
			.setDesc('Choose how notes are displayed visually')
			.addDropdown(dropdown => dropdown
				.addOption('piano-roll', 'Piano Roll (Recommended)')
				.addOption('spectrum', 'Spectrum Analyzer')
				.addOption('staff', 'Musical Staff')
				.addOption('graph-highlight', 'Graph Node Highlighting')
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.mode || 'piano-roll')
				.onChange(async (value: 'piano-roll' | 'spectrum' | 'staff' | 'graph-highlight') => {
					if (!this.plugin.settings.sonicGraphSettings?.visualDisplay) return;
					this.plugin.settings.sonicGraphSettings.visualDisplay.mode = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Visualization mode: ${value}`);
				})
			);

		// Panel height slider
		new Setting(content)
			.setName('Panel height')
			.setDesc('Height of the visual display panel in pixels')
			.addSlider(slider => slider
				.setLimits(150, 400, 10)
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.height || 250)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings?.visualDisplay) return;
					this.plugin.settings.sonicGraphSettings.visualDisplay.height = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Panel height: ${value}px`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 2: Visualization Customization
	 */
	private renderVisualizationCustomization(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Visualization customization',
			iconName: 'palette',
			subtitle: 'Customize colors, labels, and visual style',
			elevation: 1
		});

		const content = card.getContent();

		// Color scheme dropdown
		new Setting(content)
			.setName('Color scheme')
			.setDesc('How notes are colored in the visualization')
			.addDropdown(dropdown => dropdown
				.addOption('layer', 'By Layer (Recommended)')
				.addOption('pitch', 'By Pitch')
				.addOption('intensity', 'By Intensity')
				.addOption('high-contrast', 'High Contrast (Accessibility)')
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.colorScheme || 'layer')
				.onChange(async (value: 'layer' | 'pitch' | 'intensity' | 'high-contrast') => {
					if (!this.plugin.settings.sonicGraphSettings?.visualDisplay) return;
					this.plugin.settings.sonicGraphSettings.visualDisplay.colorScheme = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Color scheme: ${value}`);
				})
			);

		// Show labels toggle
		new Setting(content)
			.setName('Show note labels')
			.setDesc('Display pitch names on notes (e.g., C4, D#5)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.showLabels ?? true)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings?.visualDisplay) return;
					this.plugin.settings.sonicGraphSettings.visualDisplay.showLabels = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Show labels: ${value}`);
				})
			);

		// Show grid toggle
		new Setting(content)
			.setName('Show grid lines')
			.setDesc('Display grid lines for better orientation')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.showGrid ?? true)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings?.visualDisplay) return;
					this.plugin.settings.sonicGraphSettings.visualDisplay.showGrid = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Show grid: ${value}`);
				})
			);

		// Enable trails toggle
		new Setting(content)
			.setName('Enable note trails')
			.setDesc('Show fading trails behind notes for motion clarity')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.enableTrails ?? false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings?.visualDisplay) return;
					this.plugin.settings.sonicGraphSettings.visualDisplay.enableTrails = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Enable trails: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 3: Performance Settings
	 */
	private renderPerformanceSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Performance settings',
			iconName: 'gauge',
			subtitle: 'Adjust rendering performance and frame rate',
			elevation: 1
		});

		const content = card.getContent();

		// Frame rate slider
		new Setting(content)
			.setName('Target frame rate')
			.setDesc('Higher frame rates are smoother but use more CPU')
			.addSlider(slider => slider
				.setLimits(15, 60, 5)
				.setValue(this.plugin.settings.sonicGraphSettings?.visualDisplay?.frameRate || 30)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings?.visualDisplay) return;
					this.plugin.settings.sonicGraphSettings.visualDisplay.frameRate = value;
					await this.plugin.saveSettings();
					logger.info('visual-display-settings', `Frame rate: ${value} fps`);
				})
			);

		// Info message about performance
		const infoDiv = content.createDiv({ cls: 'osp-settings-info' });
		infoDiv.createEl('p', {
			text: 'Note: Visual display is optimized for performance with automatic quality adjustment based on system capabilities.',
			cls: 'osp-settings-info-text'
		});

		container.appendChild(card.getElement());
	}
}
