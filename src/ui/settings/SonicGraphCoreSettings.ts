/**
 * Sonic Graph Core Settings - Phase 8.1
 *
 * Essential graph visualization and audio settings for Control Center.
 * Contains: Graph & Layout, Audio Core, and Content-Aware Mapping basics.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('SonicGraphCoreSettings');

export class SonicGraphCoreSettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all core settings sections
	 */
	public render(container: HTMLElement): void {
		logger.debug('core-settings', 'Rendering core settings');

		// Section 1: Graph & Layout
		this.renderGraphLayoutSettings(container);

		// Section 2: Audio Core
		this.renderAudioCoreSettings(container);

		// Section 3: Content-Aware Mapping
		this.renderContentMappingSettings(container);
	}

	/**
	 * Section 1: Graph & Layout Settings
	 */
	private renderGraphLayoutSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Graph & Layout',
			iconName: 'layout-grid',
			subtitle: 'Visual appearance and force simulation settings',
			elevation: 1
		});

		const content = card.getContent();

		// Show file names toggle
		new Setting(content)
			.setName('Show file names')
			.setDesc('Display file names as labels on graph nodes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphShowFileNames || false)
				.onChange(async (value) => {
					this.plugin.settings.sonicGraphShowFileNames = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Show file names: ${value}`);
				})
			);

		// Journal gravity slider (renamed from node density for clarity)
		new Setting(content)
			.setName('Journal gravity')
			.setDesc('How strongly daily notes cluster together')
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue(this.plugin.settings.sonicGraphSettings?.layout.journalGravity || 30)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.layout.journalGravity = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Journal gravity: ${value}`);
				})
			);

		// Clustering strength slider
		new Setting(content)
			.setName('Clustering strength')
			.setDesc('How strongly nodes cluster together by similarity')
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue(this.plugin.settings.sonicGraphSettings?.layout.clusteringStrength || 50)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.layout.clusteringStrength = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Clustering strength: ${value}`);
				})
			);

		// Group separation slider
		new Setting(content)
			.setName('Group separation')
			.setDesc('Distance between different groups of nodes')
			.addSlider(slider => slider
				.setLimits(10, 200, 10)
				.setValue(this.plugin.settings.sonicGraphSettings?.layout.groupSeparation || 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.layout.groupSeparation = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Group separation: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 2: Audio Core Settings
	 */
	private renderAudioCoreSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Audio Core',
			iconName: 'music',
			subtitle: 'Basic audio playback and timing settings',
			elevation: 1
		});

		const content = card.getContent();

		// Audio detection dropdown
		new Setting(content)
			.setName('Audio detection')
			.setDesc('Override automatic temporal clustering detection')
			.addDropdown(dropdown => dropdown
				.addOption('auto', 'Auto (detect from timeline)')
				.addOption('dense', 'Force Dense')
				.addOption('balanced', 'Force Balanced')
				.addOption('sparse', 'Force Sparse')
				.setValue(this.plugin.settings.sonicGraphSettings?.audio.autoDetectionOverride || 'auto')
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.audio.autoDetectionOverride = value as 'auto' | 'dense' | 'balanced' | 'sparse';
					await this.plugin.saveSettings();
					logger.info('core-settings', `Audio detection: ${value}`);
				})
			);

		// Note duration slider
		new Setting(content)
			.setName('Note duration')
			.setDesc('How long each note plays (0.1s - 2.0s)')
			.addSlider(slider => slider
				.setLimits(0.1, 2.0, 0.1)
				.setValue(this.plugin.settings.sonicGraphSettings?.audio.noteDuration || 0.5)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.audio.noteDuration = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Note duration: ${value}s`);
				})
			);

		// Animation duration slider
		new Setting(content)
			.setName('Animation duration')
			.setDesc('Speed of timeline animation (seconds)')
			.addSlider(slider => slider
				.setLimits(5, 120, 5)
				.setValue(this.plugin.settings.sonicGraphSettings?.timeline.duration || 30)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.timeline.duration = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Animation duration: ${value}s`);
				})
			);

		// Loop animation toggle
		new Setting(content)
			.setName('Loop animation')
			.setDesc('Automatically restart animation when it completes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.timeline.loop || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.timeline.loop = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Loop animation: ${value}`);
				})
			);

		// Event spreading dropdown
		new Setting(content)
			.setName('Event spreading')
			.setDesc('Prevent audio crackling by spacing simultaneous events')
			.addDropdown(dropdown => dropdown
				.addOption('none', 'None - No spreading')
				.addOption('gentle', 'Gentle - Light spreading')
				.addOption('aggressive', 'Aggressive - Heavy spreading')
				.setValue(this.plugin.settings.sonicGraphSettings?.timeline.eventSpreadingMode || 'gentle')
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.timeline.eventSpreadingMode = value as 'none' | 'gentle' | 'aggressive';
					await this.plugin.saveSettings();
					logger.info('core-settings', `Event spreading: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 3: Content-Aware Mapping Settings
	 */
	private renderContentMappingSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Content-Aware Mapping',
			iconName: 'brain',
			subtitle: 'Phase 1-2: Map content types to instruments (Coming Soon)',
			elevation: 1
		});

		const content = card.getContent();

		// Placeholder note
		const note = content.createDiv({ cls: 'osp-settings-note' });
		note.innerHTML = `
			<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">
				Content-aware mapping will allow the Sonic Graph to automatically select instruments
				based on file types, tags, and folder structure. This feature is planned for Phase 1-2
				implementation.
			</p>
			<p style="color: var(--text-muted); font-size: 13px; margin-top: 0.5rem;">
				For now, instruments are selected using the basic audio engine settings configured
				in the Control Center's Instrument tabs.
			</p>
		`;

		container.appendChild(card.getElement());
	}
}