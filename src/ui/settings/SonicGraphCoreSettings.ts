/**
 * Sonic Graph Core Settings
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
			title: 'Graph and layout',
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

		// Enable Adaptive Detail Levels toggle
		new Setting(content)
			.setName('Enable adaptive detail levels')
			.setDesc('Automatically show/hide elements based on zoom level for better performance and visual clarity')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.adaptiveDetail?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					if (!this.plugin.settings.sonicGraphSettings.adaptiveDetail) {
						this.plugin.settings.sonicGraphSettings.adaptiveDetail = {
							enabled: value,
							mode: 'automatic',
							thresholds: { overview: 0.5, standard: 1.5, detail: 3.0 },
							overrides: { alwaysShowLabels: false, minimumVisibleNodes: 10, maximumVisibleNodes: -1 }
						};
					} else {
						this.plugin.settings.sonicGraphSettings.adaptiveDetail.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('core-settings', `Adaptive detail levels: ${value}`);
				})
			);

		// Enable Content-Aware Positioning toggle
		new Setting(content)
			.setName('Enable content-aware positioning')
			.setDesc('Position nodes based on tags, temporal data, and hub centrality for semantic clustering')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.contentAwarePositioning?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					if (!this.plugin.settings.sonicGraphSettings.contentAwarePositioning) {
						this.plugin.settings.sonicGraphSettings.contentAwarePositioning = {
							enabled: value,
							tagInfluence: { strength: 'moderate', weight: 0.3 },
							temporalPositioning: { enabled: true, weight: 0.1, recentThresholdDays: 30 },
							hubCentrality: { enabled: true, weight: 0.2, minimumConnections: 5 },
							debugVisualization: false
						};
					} else {
						this.plugin.settings.sonicGraphSettings.contentAwarePositioning.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('core-settings', `Content-aware positioning: ${value}`);
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
			title: 'Audio core',
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

		// Simultaneous event limit slider
		new Setting(content)
			.setName('Simultaneous event limit')
			.setDesc('Maximum concurrent notes playing at once (1-50). Higher values create richer soundscapes.')
			.addSlider(slider => slider
				.setLimits(1, 50, 1)
				.setValue(this.plugin.settings.sonicGraphSettings?.timeline.simultaneousEventLimit || 8)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.timeline.simultaneousEventLimit = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Simultaneous event limit: ${value}`);
				})
			);

		// Event batch size slider
		new Setting(content)
			.setName('Event batch size')
			.setDesc('Events processed per animation frame (1-20)')
			.addSlider(slider => slider
				.setLimits(1, 20, 1)
				.setValue(this.plugin.settings.sonicGraphSettings?.timeline.eventBatchSize || 10)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.timeline.eventBatchSize = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Event batch size: ${value}`);
				})
			);

		// Max event spacing slider
		new Setting(content)
			.setName('Max event spacing')
			.setDesc('Maximum time window for spreading events (0.5s - 10s)')
			.addSlider(slider => slider
				.setLimits(0.5, 10, 0.5)
				.setValue(this.plugin.settings.sonicGraphSettings?.timeline.maxEventSpacing || 3.0)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					this.plugin.settings.sonicGraphSettings.timeline.maxEventSpacing = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Max event spacing: ${value}s`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 3: Content-Aware Mapping Settings
	 */
	private renderContentMappingSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Content-aware mapping',
			iconName: 'brain',
			subtitle: 'Map content types and metadata to instruments',
			elevation: 1
		});

		const content = card.getContent();

		// Description
		const description = content.createDiv({ cls: 'osp-settings-description' });
		const descP = description.createEl('p');
		descP.setCssProps({
			color: 'var(--text-muted)',
			fontSize: '13px',
			lineHeight: '1.5',
			marginBottom: '1rem'
		});
		descP.textContent = 'Content-aware mapping automatically selects instruments based on file types, tags, ' +
			'folder structure, and frontmatter metadata. This creates semantic correlation between ' +
			'your vault\'s content and its musical representation.';

		// Create wrapper for detailed settings (will be dynamically shown/hidden)
		const detailsWrapper = content.createDiv({ cls: 'osp-settings-details-wrapper' });

		// Enable content-aware mapping toggle
		new Setting(content)
			.setName('Enable content-aware mapping')
			.setDesc('Automatically map file properties to musical parameters')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement) {
						this.plugin.settings.audioEnhancement = {} as Record<string, unknown>;
					}
					if (!this.plugin.settings.audioEnhancement.contentAwareMapping) {
						this.plugin.settings.audioEnhancement.contentAwareMapping = {
							enabled: value,
							frontmatterPropertyName: 'instrument',
							moodPropertyName: 'musical-mood',
							distributionStrategy: 'balanced',
							fileTypePreferences: {},
							tagMappings: {},
							folderMappings: {},
							connectionTypeMappings: {}
						};
					} else {
						this.plugin.settings.audioEnhancement.contentAwareMapping.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('core-settings', `Content-aware mapping: ${value}`);

					// Re-render only the details wrapper
					detailsWrapper.empty();
					if (value) {
						this.renderContentMappingDetails(detailsWrapper);
					}
				})
			);

		// Show detailed settings only if enabled
		if (this.plugin.settings.audioEnhancement?.contentAwareMapping?.enabled) {
			this.renderContentMappingDetails(detailsWrapper);
		}

		container.appendChild(card.getElement());
	}

	/**
	 * Render detailed content mapping settings
	 */
	private renderContentMappingDetails(content: HTMLElement): void {
		// Frontmatter instrument property
		new Setting(content)
			.setName('Instrument frontmatter property')
			.setDesc('Property name for explicit instrument selection (e.g., "instrument: piano")')
			.addText(text => text
				.setPlaceholder('instrument')
				.setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.frontmatterPropertyName || 'instrument')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.contentAwareMapping) return;
					this.plugin.settings.audioEnhancement.contentAwareMapping.frontmatterPropertyName = value || 'instrument';
					await this.plugin.saveSettings();
					logger.info('core-settings', `Frontmatter property: ${value}`);
				})
			);

		// Musical mood property
		new Setting(content)
			.setName('Musical mood property')
			.setDesc('Property name for musical mood/character (e.g., "musical-mood: contemplative")')
			.addText(text => text
				.setPlaceholder('musical-mood')
				.setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.moodPropertyName || 'musical-mood')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.contentAwareMapping) return;
					this.plugin.settings.audioEnhancement.contentAwareMapping.moodPropertyName = value || 'musical-mood';
					await this.plugin.saveSettings();
					logger.info('core-settings', `Mood property: ${value}`);
				})
			);

		// Distribution strategy dropdown
		new Setting(content)
			.setName('Instrument distribution')
			.setDesc('How to distribute instruments across similar files')
			.addDropdown(dropdown => dropdown
				.addOption('balanced', 'Balanced - Prevent clustering')
				.addOption('random', 'Random - Natural variation')
				.addOption('semantic', 'Semantic - Based on content')
				.setValue(this.plugin.settings.audioEnhancement?.contentAwareMapping?.distributionStrategy || 'balanced')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.contentAwareMapping) return;
					this.plugin.settings.audioEnhancement.contentAwareMapping.distributionStrategy = value;
					await this.plugin.saveSettings();
					logger.info('core-settings', `Distribution strategy: ${value}`);
				})
			);

		// Info note about advanced settings
		const advancedNote = content.createDiv({ cls: 'osp-settings-note' });
		const advancedP = advancedNote.createEl('p');
		advancedP.setCssProps({
			color: 'var(--text-muted)',
			fontSize: '12px',
			lineHeight: '1.5',
			marginTop: '1rem'
		});
		advancedP.createEl('strong', { text: 'Note:' });
		advancedP.appendText(' Advanced file type, tag, and folder mappings ' +
			'can be configured in the instrument settings. Connection type audio differentiation ' +
			'is available in the Spatial Audio tab.');
	}
}