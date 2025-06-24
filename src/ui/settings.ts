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
		onboardingContent.createEl('p', { text: 'Use the Sonigraph Control Center to configure audio settings, instruments, and musical parameters. Use the command palette, the ribbon button, or the button below to open the Control Center.' });
		
		const onboardingActions = onboardingContent.createEl('div', { cls: 'sonigraph-onboarding-actions' });
		const dismissBtn = onboardingActions.createEl('button', { text: 'Dismiss', cls: 'mod-muted' });
		
		dismissBtn.addEventListener('click', () => {
			onboardingSection.style.display = 'none';
		});

		// Control Center Setting
		new Setting(containerEl)
			.setName('Control center')
			.setDesc('Open the Sonigraph Audio Control Center to configure instruments, musical parameters, and effects')
			.addButton(button => button
				.setButtonText('Open Control Center')
				.setCta()
				.onClick(() => {
					// Close settings before opening Control Center
					(this.app as any).setting.close();
					this.plugin.openControlPanel();
				}));

		// Sonic Graph Animation Duration Setting
		new Setting(containerEl)
			.setName('Sonic Graph animation duration')
			.setDesc('Base duration for temporal graph animations in seconds. Higher values create more contemplative pacing.')
			.addSlider(slider => slider
				.setLimits(15, 300, 15) // 15 seconds to 5 minutes, in 15-second increments
				.setValue(this.plugin.settings.sonicGraphAnimationDuration || 60)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.sonicGraphAnimationDuration = value;
					await this.plugin.saveSettings();
					logger.info('settings-change', 'Animation duration changed', { duration: value });
				})
			);

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