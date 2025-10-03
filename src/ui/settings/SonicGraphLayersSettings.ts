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
	private onToggleCallback?: () => void;

	constructor(app: App, plugin: SonigraphPlugin, onToggleCallback?: () => void) {
		this.app = app;
		this.plugin = plugin;
		this.onToggleCallback = onToggleCallback;
	}

	/**
	 * Render all audio layers settings
	 */
	public render(container: HTMLElement): void {
		logger.debug('layers-settings', 'Rendering audio layers settings');

		// Section 1: Enable/Disable Continuous Layers
		this.renderEnableSection(container);

		// Section 2: Additional settings (only if enabled)
		if (this.plugin.settings.audioEnhancement?.continuousLayers?.enabled) {
			this.renderGenreSection(container);
			this.renderIntensitySection(container);
			this.renderLayerTypesSection(container);
			this.renderMusicalSettingsSection(container);
			this.renderAdaptiveSection(container);
		}
	}

	/**
	 * Section 1: Enable Continuous Layers
	 */
	private renderEnableSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Continuous audio layers',
			iconName: 'layers',
			subtitle: 'Ambient background layers that evolve with your vault',
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
								enabled: false,
								scale: 'major',
								rootNote: 'C',
								enforceHarmony: false,
								allowChromaticPassing: false,
								dissonanceThreshold: 0.3,
								quantizationStrength: 0.8,
								preferredChordProgression: 'I-IV-V-I',
								dynamicScaleModulation: false
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

					// Trigger parent tab re-render to show/hide Freesound integration
					if (this.onToggleCallback) {
						this.onToggleCallback();
					} else {
						// Fallback: re-render just the layers settings
						container.empty();
						this.render(container);
					}
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
			title: 'Musical genre',
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
			title: 'Layer intensity',
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
	 * Section 4: Layer Types (Rhythmic & Harmonic)
	 */
	private renderLayerTypesSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Additional layers',
			iconName: 'layers-3',
			subtitle: 'Rhythmic and harmonic layers',
			elevation: 1
		});

		const content = card.getContent();

		// Description
		const description = content.createDiv({ cls: 'osp-settings-description' });
		description.innerHTML = `
			<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5; margin-bottom: 1rem;">
				Beyond the ambient drone, you can enable rhythmic percussion and harmonic pad layers
				that respond to vault activity and cluster dynamics.
			</p>
		`;

		// Rhythmic layer toggle
		new Setting(content)
			.setName('Enable rhythmic layer')
			.setDesc('Add activity-based percussion patterns')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicEnabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.rhythmicEnabled = value;

					// Initialize rhythmic layer config if enabled
					if (value && !this.plugin.settings.audioEnhancement.continuousLayers.rhythmicLayer) {
						this.plugin.settings.audioEnhancement.continuousLayers.rhythmicLayer = {
							enabled: true,
							baseTempo: 120,
							tempoRange: [80, 160],
							percussionIntensity: 0.7,
							arpeggioComplexity: 0.5,
							activitySensitivity: 0.6
						};
					}

					await this.plugin.saveSettings();
					logger.info('layers-settings', `Rhythmic layer: ${value}`);

					// Re-render to show/hide detailed settings
					container.empty();
					this.render(container);
				})
			);

		// Rhythmic layer detailed settings (only if enabled)
		if (this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicEnabled) {
			const rhythmicDetails = content.createDiv({ cls: 'osp-settings-subsection' });
			rhythmicDetails.createEl('h4', { text: 'Rhythmic layer settings', attr: { style: 'margin-top: 1rem;' } });

			new Setting(rhythmicDetails)
				.setName('Base tempo')
				.setDesc('Base BPM for rhythmic patterns (60-180)')
				.addSlider(slider => slider
					.setLimits(60, 180, 5)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer?.baseTempo || 120)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer) return;
						this.plugin.settings.audioEnhancement.continuousLayers.rhythmicLayer.baseTempo = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(rhythmicDetails)
				.setName('Percussion intensity')
				.setDesc('Volume and prominence of percussive elements (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer?.percussionIntensity || 0.7)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer) return;
						this.plugin.settings.audioEnhancement.continuousLayers.rhythmicLayer.percussionIntensity = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(rhythmicDetails)
				.setName('Pattern complexity')
				.setDesc('Complexity of rhythmic patterns and arpeggios (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer?.arpeggioComplexity || 0.5)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer) return;
						this.plugin.settings.audioEnhancement.continuousLayers.rhythmicLayer.arpeggioComplexity = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(rhythmicDetails)
				.setName('Activity sensitivity')
				.setDesc('How responsive tempo is to vault activity (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer?.activitySensitivity || 0.6)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.rhythmicLayer) return;
						this.plugin.settings.audioEnhancement.continuousLayers.rhythmicLayer.activitySensitivity = value;
						await this.plugin.saveSettings();
					})
				);
		}

		// Harmonic layer toggle
		new Setting(content)
			.setName('Enable harmonic layer')
			.setDesc('Add cluster-based harmonic pads')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicEnabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.harmonicEnabled = value;

					// Initialize harmonic layer config if enabled
					if (value && !this.plugin.settings.audioEnhancement.continuousLayers.harmonicPad) {
						this.plugin.settings.audioEnhancement.continuousLayers.harmonicPad = {
							enabled: true,
							chordComplexity: 3,
							progressionSpeed: 0.5,
							dissonanceLevel: 0.3,
							clusterInfluence: 0.7,
							scaleConstraints: true
						};
					}

					await this.plugin.saveSettings();
					logger.info('layers-settings', `Harmonic layer: ${value}`);

					// Re-render to show/hide detailed settings
					container.empty();
					this.render(container);
				})
			);

		// Harmonic layer detailed settings (only if enabled)
		if (this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicEnabled) {
			const harmonicDetails = content.createDiv({ cls: 'osp-settings-subsection' });
			harmonicDetails.createEl('h4', { text: 'Harmonic layer settings', attr: { style: 'margin-top: 1rem;' } });

			new Setting(harmonicDetails)
				.setName('Chord complexity')
				.setDesc('Number of voices in chords (2-6)')
				.addSlider(slider => slider
					.setLimits(2, 6, 1)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad?.chordComplexity || 3)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad) return;
						this.plugin.settings.audioEnhancement.continuousLayers.harmonicPad.chordComplexity = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(harmonicDetails)
				.setName('Progression speed')
				.setDesc('How fast harmonies change (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad?.progressionSpeed || 0.5)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad) return;
						this.plugin.settings.audioEnhancement.continuousLayers.harmonicPad.progressionSpeed = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(harmonicDetails)
				.setName('Dissonance level')
				.setDesc('Harmonic tension and complexity (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad?.dissonanceLevel || 0.3)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad) return;
						this.plugin.settings.audioEnhancement.continuousLayers.harmonicPad.dissonanceLevel = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(harmonicDetails)
				.setName('Cluster influence')
				.setDesc('How much clusters affect harmony (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad?.clusterInfluence || 0.7)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad) return;
						this.plugin.settings.audioEnhancement.continuousLayers.harmonicPad.clusterInfluence = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(harmonicDetails)
				.setName('Scale constraints')
				.setDesc('Constrain harmonies to the selected musical scale')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad?.scaleConstraints ?? true)
					.onChange(async (value) => {
						if (!this.plugin.settings.audioEnhancement?.continuousLayers?.harmonicPad) return;
						this.plugin.settings.audioEnhancement.continuousLayers.harmonicPad.scaleConstraints = value;
						await this.plugin.saveSettings();
					})
				);
		}

		container.appendChild(card.getElement());
	}

	/**
	 * Section 5: Musical Settings (Scale & Key)
	 */
	private renderMusicalSettingsSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Layer tonality',
			iconName: 'music-4',
			subtitle: 'Musical scale and key for all continuous layers',
			elevation: 1
		});

		const content = card.getContent();

		// Scale selection
		new Setting(content)
			.setName('Continuous layer scale')
			.setDesc('Scale for ambient, rhythmic, and harmonic layers (independent of node sonification)')
			.addDropdown(dropdown => dropdown
				.addOption('major', 'Major - Bright, happy')
				.addOption('minor', 'Minor - Dark, melancholic')
				.addOption('dorian', 'Dorian - Modal, jazzy')
				.addOption('phrygian', 'Phrygian - Spanish, exotic')
				.addOption('lydian', 'Lydian - Dreamy, ethereal')
				.addOption('mixolydian', 'Mixolydian - Folk, bluesy')
				.addOption('pentatonic', 'Pentatonic - Asian, simple')
				.addOption('chromatic', 'Chromatic - All notes')
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.scale || 'major')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.scale = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Continuous layers scale: ${value}`);
				})
			);

		// Key selection
		new Setting(content)
			.setName('Continuous layer key')
			.setDesc('Root note for all continuous layers (ambient, rhythmic, harmonic)')
			.addDropdown(dropdown => dropdown
				.addOption('C', 'C')
				.addOption('C#', 'C# / Db')
				.addOption('D', 'D')
				.addOption('D#', 'D# / Eb')
				.addOption('E', 'E')
				.addOption('F', 'F')
				.addOption('F#', 'F# / Gb')
				.addOption('G', 'G')
				.addOption('G#', 'G# / Ab')
				.addOption('A', 'A')
				.addOption('A#', 'A# / Bb')
				.addOption('B', 'B')
				.setValue(this.plugin.settings.audioEnhancement?.continuousLayers?.key || 'C')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.continuousLayers) return;
					this.plugin.settings.audioEnhancement.continuousLayers.key = value;
					await this.plugin.saveSettings();
					logger.info('layers-settings', `Continuous layers key: ${value}`);
				})
			);

		// Info note
		const note = content.createDiv({ cls: 'osp-settings-note' });
		note.innerHTML = `
			<p style="color: var(--text-muted); font-size: 12px; line-height: 1.5; margin-top: 1rem;">
				<strong>Note:</strong> These musical settings apply to all continuous layers (ambient, rhythmic, and harmonic).
				For node-based synthesis, use the Musical Theory settings in the Advanced Features tab.
			</p>
		`;

		container.appendChild(card.getElement());
	}

	/**
	 * Section 6: Adaptive Behavior
	 */
	private renderAdaptiveSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Adaptive behavior',
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