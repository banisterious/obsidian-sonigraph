/**
 * Sonic Graph Audio Layers Settings - Phase 8.1
 *
 * Phase 3 Continuous Layers settings for Control Center.
 * Contains: Enable toggle, genre selection, layer controls, and intensity settings.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('SonicGraphLayersSettings');

export class SonicGraphLayersSettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all audio layers settings
	 */
	public render(container: HTMLElement): void {
		logger.debug('layers-settings', 'Rendering audio layers settings');

		// Section 1: Enable/Disable Continuous Layers
		this.renderEnableSection(container);

		// Section 2: Genre Selection (only if enabled)
		if (this.plugin.settings.audioEnhancement?.continuousLayers?.enabled) {
			this.renderGenreSection(container);
			this.renderIntensitySection(container);
			this.renderAdaptiveSection(container);
		}
	}

	/**
	 * Section 1: Enable Continuous Layers
	 */
	private renderEnableSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Continuous Audio Layers',
			iconName: 'layers',
			subtitle: 'Phase 3: Ambient background layers that evolve with your vault',
			elevation: 1
		});

		const content = card.getContent();

		// Description
		const description = content.createDiv({ cls: 'osp-settings-description' });
		description.innerHTML = `
			<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5; margin-bottom: 1rem;">
				Continuous layers add ambient background audio that responds to vault size, activity,
				and animation progress. Unlike node-based audio which plays when nodes appear, continuous
				layers provide a persistent soundscape that evolves over time.
			</p>
		`;

		// Enable toggle
		new Setting(content)
			.setName('Enable continuous layers')
			.setDesc('Add ambient background audio alongside node-based synthesis')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement) {
						// Initialize with full default structure
						this.plugin.settings.audioEnhancement = {
							contentAwareMapping: {
								enabled: false,
								fileTypePreferences: {},
								tagMappings: {},
								folderMappings: {},
								connectionTypeMappings: {},
								frontmatterPropertyName: 'instrument',
								moodPropertyName: 'musical-mood',
								distributionStrategy: 'balanced'
							},
							continuousLayers: {
								enabled: value,
								genre: 'ambient',
								intensity: 0.5,
								evolutionRate: 0.3,
								adaptiveIntensity: true,
								rhythmicEnabled: false,
								harmonicEnabled: false,
								scale: 'major',
								key: 'C',
								ambientDrone: {},
								rhythmicLayer: {},
								harmonicPad: {}
							},
							musicalTheory: {
								scale: 'major',
								key: 'C',
								mode: 'ionian',
								constrainToScale: false
							},
							externalServices: {
								freesoundApiKey: '',
								enableFreesoundSamples: false
							}
						};
					} else {
						this.plugin.settings.audioEnhancement.continuousLayers.enabled = value;
					}

					await this.plugin.saveSettings();
					logger.info('layers-settings', `Continuous layers: ${value}`);

					// Re-render to show/hide dependent sections
					container.empty();
					this.render(container);
				})
			);

		// Performance note
		const perfNote = content.createDiv({ cls: 'osp-settings-note' });
		perfNote.innerHTML = `
			<p style="color: var(--text-muted); font-size: 12px; font-style: italic;">
				Target: <5% additional CPU usage. Layers work alongside existing node-based audio.
			</p>
		`;

		container.appendChild(card.getElement());
	}

	/**
	 * Section 2: Musical Genre Selection
	 */
	private renderGenreSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Musical Genre',
			iconName: 'music-2',
			subtitle: 'Choose the ambient genre for your soundscape',
			elevation: 1
		});

		const content = card.getContent();

		// Genre dropdown with all 13 options
		new Setting(content)
			.setName('Genre selection')
			.setDesc('Each genre provides unique timbres and atmospheric qualities')
			.addDropdown(dropdown => dropdown
				.addOption('ambient', 'Ambient - Gentle evolving textures')
				.addOption('drone', 'Drone - Sustained atmospheric tones')
				.addOption('orchestral', 'Orchestral - Classical instruments')
				.addOption('electronic', 'Electronic - Synthesized pads')
				.addOption('minimal', 'Minimal - Sparse, contemplative')
				.addOption('oceanic', 'Oceanic - Whale songs & ocean')
				.addOption('sci-fi', 'Sci-Fi - Futuristic atmospheres')
				.addOption('experimental', 'Experimental - Unconventional')
				.addOption('industrial', 'Industrial - Mechanical drones')
				.addOption('urban', 'Urban - City soundscapes')
				.addOption('nature', 'Nature - Forest, rain, wind')
				.addOption('mechanical', 'Mechanical - Machine hums')
				.addOption('organic', 'Organic - Acoustic processing')
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.genre || 'ambient')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.genre = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Genre: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 3: Intensity Controls
	 */
	private renderIntensitySection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Layer Intensity',
			iconName: 'sliders',
			subtitle: 'Control volume and prominence',
			elevation: 1
		});

		const content = card.getContent();

		// Master intensity slider
		new Setting(content)
			.setName('Master intensity')
			.setDesc('Overall volume and prominence of continuous layers (0 = silent, 1 = full)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.05)
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.intensity || 0.5)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.intensity = value;
					await this.plugin.saveSettings();
					logger.debug('layers-settings', `Intensity: ${value}`);
				})
			);

		// Evolution rate slider
		new Setting(content)
			.setName('Evolution rate')
			.setDesc('How quickly the layers evolve and change over time')
			.addSlider(slider => slider
				.setLimits(0.1, 2.0, 0.1)
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.evolutionRate || 0.5)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.evolutionRate = value;
					await this.plugin.saveSettings();
					logger.debug('layers-settings', `Evolution rate: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 4: Adaptive Behavior
	 */
	private renderAdaptiveSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Adaptive Behavior',
			iconName: 'brain-circuit',
			subtitle: 'Context-aware layer adjustments',
			elevation: 1
		});

		const content = card.getElement();

		// Adaptive intensity toggle
		new Setting(content)
			.setName('Adaptive intensity')
			.setDesc('Automatically adjust layer volume based on vault activity and animation state')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.adaptiveIntensity || true)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.adaptiveIntensity = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Adaptive intensity: ${value}`);
				})
			);

		// Info note
		const note = content.createDiv({ cls: 'osp-settings-note' });
		note.innerHTML = `
			<p style="color: var(--text-muted); font-size: 12px; line-height: 1.5; margin-top: 0.5rem;">
				<strong>Adaptive Behavior:</strong> When enabled, layers respond to:
			</p>
			<ul style="color: var(--text-muted); font-size: 12px; margin: 0.5rem 0 0 1.5rem;">
				<li>Vault size (more files = richer textures)</li>
				<li>Animation progress (evolves through timeline)</li>
				<li>Node activity (quieter during busy moments)</li>
			</ul>
		`;

		container.appendChild(card.getElement());
	}
}