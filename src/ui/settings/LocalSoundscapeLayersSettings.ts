/**
 * Local Soundscape Continuous Layers Settings
 *
 * UI controls for continuous audio layers in Local Soundscape.
 * Provides ambient background that fills out sparse soundscapes.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('LocalSoundscapeLayersSettings');

export class LocalSoundscapeLayersSettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all continuous layers settings
	 */
	public render(container: HTMLElement): void {
		logger.debug('layers-settings', 'Rendering Local Soundscape continuous layers settings');

		// Section 1: Enable/Disable Continuous Layers
		this.renderEnableSection(container);

		// Section 2: Layer controls (only if enabled)
		if (this.plugin.settings.localSoundscape?.continuousLayers?.enabled) {
			this.renderLayerControlsSection(container);
		}
	}

	/**
	 * Section 1: Enable Continuous Layers
	 */
	private renderEnableSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Continuous audio layers',
			iconName: 'layers',
			subtitle: 'Ambient background that fills out sparse soundscapes',
			elevation: 1
		});

		const content = card.getContent();

		// Description
		const description = content.createDiv({ cls: 'osp-settings-description' });
		const descP = description.createEl('p');
		descP.style.color = 'var(--text-muted)';
		descP.style.fontSize = '13px';
		descP.style.lineHeight = '1.5';
		descP.style.marginBottom = '0.5rem';
		descP.textContent = 'Continuous layers add ambient background audio that plays alongside note-based sonification. ' +
			'Perfect for sparse graphs with few connections - layers provide harmonic foundation, rhythmic pulse, ' +
			'and ambient texture even when there are only a few notes.';

		// Important note about Freesound samples
		const noteDiv = description.createDiv({ cls: 'osp-settings-note' });
		noteDiv.style.backgroundColor = 'var(--background-modifier-info)';
		noteDiv.style.borderLeft = '3px solid var(--interactive-accent)';
		noteDiv.style.padding = '8px 12px';
		noteDiv.style.marginBottom = '1rem';
		noteDiv.style.borderRadius = '4px';

		const noteIcon = noteDiv.createSpan();
		noteIcon.textContent = 'ℹ️ ';
		noteIcon.style.marginRight = '6px';

		const noteText = noteDiv.createSpan();
		noteText.style.fontSize = '12px';
		noteText.style.color = 'var(--text-normal)';
		noteText.innerHTML = '<strong>Important:</strong> Continuous layers require Freesound samples to be enabled. ' +
			'Go to the <strong>Layers</strong> tab and use the Sample Browser to enable at least one sample in each category ' +
			'(Ambient, Harmonic, Rhythmic) you want to use.';

		// Enable toggle
		new Setting(content)
			.setName('Enable continuous layers')
			.setDesc('Add ambient background audio alongside note sonification')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.localSoundscape?.continuousLayers?.enabled || false)
				.onChange(async (value) => {
					// Initialize settings structure if needed
					if (!this.plugin.settings.localSoundscape) {
						this.plugin.settings.localSoundscape = {};
					}
					if (!this.plugin.settings.localSoundscape.continuousLayers) {
						this.plugin.settings.localSoundscape.continuousLayers = {
							enabled: value,
							intensity: 0.5,
							ambientEnabled: true,
							harmonicEnabled: true,
							rhythmicEnabled: false,
							volume: -12 // dB, slightly quieter than note audio
						};
					} else {
						this.plugin.settings.localSoundscape.continuousLayers.enabled = value;
					}

					await this.plugin.saveSettings();
					logger.info('layers-settings', `Continuous layers: ${value}`);

					// Re-render to show/hide layer controls
					this.render(container);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 2: Layer Controls
	 */
	private renderLayerControlsSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Layer settings',
			iconName: 'sliders-horizontal',
			subtitle: 'Control individual layer types and intensity',
			elevation: 1
		});

		const content = card.getContent();

		const layers = this.plugin.settings.localSoundscape!.continuousLayers!;

		// Intensity slider
		new Setting(content)
			.setName('Overall intensity')
			.setDesc('How prominent the layers are (0% = subtle, 100% = bold)')
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue((layers.intensity || 0.5) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					layers.intensity = value / 100;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Layer intensity: ${value}%`);
				})
			);

		// Volume slider
		new Setting(content)
			.setName('Layer volume')
			.setDesc('Overall volume of continuous layers (-24dB = quiet, 0dB = full)')
			.addSlider(slider => slider
				.setLimits(-24, 0, 1)
				.setValue(layers.volume || -12)
				.setDynamicTooltip()
				.onChange(async (value) => {
					layers.volume = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Layer volume: ${value}dB`);
				})
			);

		// Add visual separator
		content.createEl('hr', { cls: 'osp-settings-separator' });

		// Layer type toggles header
		const layerTypesHeader = content.createEl('h4');
		layerTypesHeader.style.marginTop = 'var(--size-4-4)';
		layerTypesHeader.style.marginBottom = 'var(--size-4-2)';
		layerTypesHeader.style.fontSize = 'var(--font-ui-medium)';
		layerTypesHeader.style.fontWeight = '600';
		layerTypesHeader.textContent = 'Layer types';

		const layerTypesDesc = content.createEl('p');
		layerTypesDesc.style.color = 'var(--text-muted)';
		layerTypesDesc.style.fontSize = 'var(--font-ui-small)';
		layerTypesDesc.style.marginBottom = 'var(--size-4-3)';
		layerTypesDesc.textContent = 'Enable individual layer types to customize your soundscape texture.';

		// Ambient layer toggle
		new Setting(content)
			.setName('Ambient drone')
			.setDesc('Sustained atmospheric tones that provide harmonic foundation')
			.addToggle(toggle => toggle
				.setValue(layers.ambientEnabled !== false) // Default true
				.onChange(async (value) => {
					layers.ambientEnabled = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Ambient layer: ${value}`);
				})
			);

		// Harmonic layer toggle
		new Setting(content)
			.setName('Harmonic pads')
			.setDesc('Slow-evolving chords that respect your selected musical key')
			.addToggle(toggle => toggle
				.setValue(layers.harmonicEnabled !== false) // Default true
				.onChange(async (value) => {
					layers.harmonicEnabled = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Harmonic layer: ${value}`);
				})
			);

		// Rhythmic layer toggle
		new Setting(content)
			.setName('Rhythmic pulse')
			.setDesc('Subtle beat synchronized with Rhythmic Patterns tempo')
			.addToggle(toggle => toggle
				.setValue(layers.rhythmicEnabled || false) // Default false (more subtle)
				.onChange(async (value) => {
					layers.rhythmicEnabled = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Rhythmic layer: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}
}
