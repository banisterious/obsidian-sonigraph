/**
 * Sonic Graph Advanced Features Settings - Phase 8.1
 *
 * Advanced audio features for Control Center (Phases 5-6).
 * Contains: Clustering Audio, Musical Theory, Orchestration, Spatial Audio.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('SonicGraphAdvancedSettings');

export class SonicGraphAdvancedSettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all advanced features settings
	 */
	public render(container: HTMLElement): void {
		logger.debug('advanced-settings', 'Rendering advanced features settings');

		// Note about advanced features
		this.renderOverviewCard(container);

		// Phase 5: Smart Clustering Audio
		this.renderClusteringSection(container);

		// Phase 6.1: Musical Theory
		this.renderMusicalTheorySection(container);

		// Phase 6.2 & 6.3: Orchestration & Spatial (Coming Soon)
		this.renderComingSoonSection(container);
	}

	/**
	 * Overview Card
	 */
	private renderOverviewCard(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Advanced Features',
			iconName: 'sparkles',
			subtitle: 'Sophisticated audio features for power users',
			elevation: 1
		});

		const content = card.getContent();

		const description = content.createDiv({ cls: 'osp-settings-description' });
		description.innerHTML = `
			<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">
				Advanced features provide sophisticated audio mappings based on graph structure,
				musical theory, and spatial positioning. These features are designed for users who
				want fine-grained control over the sonic experience.
			</p>
		`;

		container.appendChild(card.getElement());
	}

	/**
	 * Phase 5: Smart Clustering Audio
	 */
	private renderClusteringSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Smart Clustering Audio',
			iconName: 'network',
			subtitle: 'Phase 5: Generate audio themes for cluster types',
			elevation: 1
		});

		const content = card.getContent();

		// Enable toggle
		new Setting(content)
			.setName('Enable cluster audio')
			.setDesc('Generate unique audio themes for different cluster types (tag-based, temporal, link-dense, community)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.clusterAudio?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.clusterAudio) {
						this.plugin.settings.clusterAudio = {
							enabled: value,
							globalVolume: 0.7,
							clusterTypeEnabled: {
								'tag-based': true,
								'folder-based': true,
								'link-dense': true,
								'temporal': true,
								'community': true
							},
							clusterTypeVolumes: {
								'tag-based': 0.8,
								'folder-based': 0.7,
								'link-dense': 0.9,
								'temporal': 0.6,
								'community': 0.8
							},
							transitionsEnabled: true,
							transitionVolume: 0.5,
							transitionSpeed: 1.0,
							realTimeUpdates: true,
							updateThrottleMs: 100,
							strengthModulation: true,
							strengthSensitivity: 0.5,
							spatialAudio: false,
							maxSimultaneousClusters: 5
						};
					} else {
						this.plugin.settings.clusterAudio.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Cluster audio: ${value}`);

					// Re-render to show/hide controls
					container.empty();
					this.render(container);
				})
			);

		// Show additional controls if enabled
		if (this.plugin.settings.clusterAudio?.enabled) {
			// Global volume
			new Setting(content)
				.setName('Global cluster volume')
				.setDesc('Master volume for all cluster-based audio')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.05)
					.setValue(this.plugin.settings.clusterAudio?.globalVolume || 0.7)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.clusterAudio) {
							this.plugin.settings.clusterAudio.globalVolume = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Transitions enabled toggle
			new Setting(content)
				.setName('Enable transitions')
				.setDesc('Smooth transitions between cluster themes')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.clusterAudio?.transitionsEnabled || true)
					.onChange(async (value) => {
						if (this.plugin.settings.clusterAudio) {
							this.plugin.settings.clusterAudio.transitionsEnabled = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Note about detailed settings
			const note = content.createDiv({ cls: 'osp-settings-note' });
			note.innerHTML = `
				<p style="color: var(--text-muted); font-size: 12px; margin-top: 0.5rem;">
					<strong>Note:</strong> Detailed per-cluster-type settings (tag-based, temporal, link-dense,
					community, topical) are available in the Sonic Graph modal's settings panel.
				</p>
			`;
		}

		container.appendChild(card.getElement());
	}

	/**
	 * Phase 6.1: Musical Theory Integration
	 */
	private renderMusicalTheorySection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Musical Theory Integration',
			iconName: 'book-open',
			subtitle: 'Phase 6.1: Constrain notes to scales and modes',
			elevation: 1
		});

		const content = card.getContent();

		// Scale selection
		new Setting(content)
			.setName('Musical scale')
			.setDesc('Constrain generated notes to a specific scale')
			.addDropdown(dropdown => dropdown
				.addOption('major', 'Major - Bright, happy')
				.addOption('minor', 'Minor - Dark, melancholic')
				.addOption('dorian', 'Dorian - Modal, jazzy')
				.addOption('phrygian', 'Phrygian - Spanish, exotic')
				.addOption('lydian', 'Lydian - Dreamy, ethereal')
				.addOption('mixolydian', 'Mixolydian - Folk, bluesy')
				.addOption('pentatonic', 'Pentatonic - Asian, simple')
				.addOption('chromatic', 'Chromatic - All notes')
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.scale || 'major')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.scale = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Scale: ${value}`);
				})
			);

		// Key selection
		new Setting(content)
			.setName('Key signature')
			.setDesc('Root note for the selected scale')
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
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.key || 'C')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.key = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Key: ${value}`);
				})
			);

		// Constrain to scale toggle
		new Setting(content)
			.setName('Constrain to scale')
			.setDesc('Force all notes to fit within the selected scale (experimental)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.constrainToScale || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.constrainToScale = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Constrain to scale: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Coming Soon: Phase 6.2 & 6.3
	 */
	private renderComingSoonSection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Dynamic Orchestration & Spatial Audio',
			iconName: 'construction',
			subtitle: 'Phase 6.2 & 6.3: Coming soon',
			elevation: 1
		});

		const content = card.getContent();

		const note = content.createDiv({ cls: 'osp-settings-description' });
		note.innerHTML = `
			<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">
				<strong>Phase 6.2: Dynamic Orchestration</strong><br>
				Automatically adjust instrument complexity tiers based on graph density and temporal influence.
			</p>
			<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5; margin-top: 1rem;">
				<strong>Phase 6.3: Spatial Audio & Panning</strong><br>
				Position sounds in stereo space based on node position, using geometric or cluster-based panning.
			</p>
			<p style="color: var(--text-muted); font-size: 12px; font-style: italic; margin-top: 1rem;">
				These features are planned for future implementation.
			</p>
		`;

		container.appendChild(card.getElement());
	}
}