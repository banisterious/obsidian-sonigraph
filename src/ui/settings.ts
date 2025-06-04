import { App, PluginSettingTab, Setting } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger } from '../logging';
import { createObsidianToggle } from './components';

const logger = getLogger('settings');

export class SonigraphSettingTab extends PluginSettingTab {
	plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		logger.debug('rendering', 'Rendering settings tab', { 
			settings: this.plugin.settings 
		});

		containerEl.createEl('h2', { text: 'Sonigraph Settings' });

		// Enable/Disable Toggle using standardized component
		const toggleContainer = containerEl.createDiv();
		createObsidianToggle(
			toggleContainer,
			this.plugin.settings.isEnabled,
			async (value) => {
				this.plugin.settings.isEnabled = value;
				await this.plugin.saveSettings();
				logger.info('state-change', 'Plugin enabled state changed', { enabled: value });
			},
			{
				name: 'Enable Sonigraph',
				description: 'Turn the plugin on or off'
			}
		);

		// Tempo Setting
		new Setting(containerEl)
			.setName('Tempo')
			.setDesc('The speed of the musical output (BPM)')
			.addSlider(slider => slider
				.setLimits(60, 200, 1)
				.setValue(this.plugin.settings.tempo)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.tempo = value;
					await this.plugin.saveSettings();
					logger.debug('settings-change', 'Tempo changed', { tempo: value });
				}));

		// Volume Setting
		new Setting(containerEl)
			.setName('Volume')
			.setDesc('The volume of the musical output (%)')
			.addSlider(slider => slider
				.setLimits(0, 100, 1)
				.setValue(this.plugin.settings.volume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.volume = value;
					await this.plugin.saveSettings();
					logger.debug('settings-change', 'Volume changed', { volume: value });
				}));

		// Musical Scale Setting
		new Setting(containerEl)
			.setName('Musical Scale')
			.setDesc('The scale to use for pitch mapping')
			.addDropdown(dropdown => dropdown
				.addOption('major', 'Major')
				.addOption('minor', 'Minor')
				.addOption('pentatonic', 'Pentatonic')
				.addOption('chromatic', 'Chromatic')
				.setValue(this.plugin.settings.scale)
				.onChange(async (value: 'major' | 'minor' | 'pentatonic' | 'chromatic') => {
					this.plugin.settings.scale = value;
					await this.plugin.saveSettings();
					logger.debug('settings-change', 'Scale changed', { scale: value });
				}));

		// Root Note Setting
		new Setting(containerEl)
			.setName('Root Note')
			.setDesc('The root note for the musical scale')
			.addDropdown(dropdown => dropdown
				.addOption('C', 'C')
				.addOption('C#', 'C#')
				.addOption('D', 'D')
				.addOption('D#', 'D#')
				.addOption('E', 'E')
				.addOption('F', 'F')
				.addOption('F#', 'F#')
				.addOption('G', 'G')
				.addOption('G#', 'G#')
				.addOption('A', 'A')
				.addOption('A#', 'A#')
				.addOption('B', 'B')
				.setValue(this.plugin.settings.rootNote)
				.onChange(async (value: string) => {
					this.plugin.settings.rootNote = value;
					await this.plugin.saveSettings();
					logger.debug('settings-change', 'Root note changed', { rootNote: value });
				}));

		logger.debug('rendering', 'Settings tab rendered successfully');
	}
} 