import { App, PluginSettingTab, Setting } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger, loggerFactory, LoggerFactory } from '../logging';
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

		// Onboarding section (dismissible)
		const onboardingSection = containerEl.createEl('div', { cls: 'sonigraph-onboarding-section sonigraph-onboarding-bordered' });
		const onboardingContent = onboardingSection.createEl('div', { cls: 'sonigraph-onboarding-content' });
		onboardingContent.createEl('h3', { text: '🎵 Welcome to Sonigraph!' });
		onboardingContent.createEl('p', { text: 'Use the Control Center to configure audio settings, instruments, and musical parameters. Click the ribbon icon or use the command palette to open it.' });
		
		const onboardingActions = onboardingContent.createEl('div', { cls: 'sonigraph-onboarding-actions' });
		const openControlPanelBtn = onboardingActions.createEl('button', { text: 'Open Control Center', cls: 'mod-cta' });
		const dismissBtn = onboardingActions.createEl('button', { text: 'Dismiss', cls: 'mod-muted' });
		
		openControlPanelBtn.addEventListener('click', () => {
			this.plugin.openControlPanel();
		});
		
		dismissBtn.addEventListener('click', () => {
			onboardingSection.style.display = 'none';
		});

		// Audio Format Setting
		new Setting(containerEl)
			.setName('Audio format')
			.setDesc('Choose between MP3 (smaller size) or WAV (higher quality)')
			.addDropdown(dropdown => dropdown
				.addOption('mp3', 'MP3 (Recommended)')
				.addOption('wav', 'WAV (High Quality)')
				.setValue(this.plugin.settings.audioFormat)
				.onChange(async (value: 'mp3' | 'wav') => {
					this.plugin.settings.audioFormat = value;
					await this.plugin.saveSettings();
					logger.debug('settings-change', 'Audio format changed', { format: value });
				}));

		// Control Center Setting
		new Setting(containerEl)
			.setName('Control center')
			.setDesc('Open the Sonigraph Audio Control Center to configure instruments, musical parameters, and effects')
			.addButton(button => button
				.setButtonText('Open Control Center')
				.setCta()
				.onClick(() => {
					this.plugin.openControlPanel();
				}));

		// --- Advanced Section ---
		const advancedSection = containerEl.createEl('details', { cls: 'osp-advanced-settings' });
		advancedSection.createEl('summary', { text: 'Advanced', cls: 'osp-advanced-summary' });
		advancedSection.open = false;

		// Logging Level Setting
		new Setting(advancedSection)
			.setName('Logging level')
			.setDesc('Control the verbosity of plugin logs. Default is "Warnings".')
			.addDropdown(dropdown => dropdown
				.addOption('off', 'Off')
				.addOption('error', 'Errors Only')
				.addOption('warn', 'Warnings')
				.addOption('info', 'Info')
				.addOption('debug', 'Debug')
				.setValue(LoggerFactory.getLogLevel())
				.onChange((value: 'off' | 'error' | 'warn' | 'info' | 'debug') => {
					LoggerFactory.setLogLevel(value);
					logger.info('settings-change', 'Log level changed', { level: value });
				})
			);

		// Export Logs Button
		new Setting(advancedSection)
			.setName('Export logs')
			.setDesc('Download all plugin logs as a JSON file for support or debugging.')
			.addButton(button => button
				.setButtonText('Export Logs')
				.onClick(async () => {
					const now = new Date();
					const pad = (n: number) => n.toString().padStart(2, '0');
					const filename = `osp-logs-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
					const logs = this.plugin.getLogs ? this.plugin.getLogs() : [];
					const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
					logger.info('export', 'Logs exported', { filename });
				})
			);

		logger.debug('rendering', 'Settings tab rendered successfully');
	}
} 