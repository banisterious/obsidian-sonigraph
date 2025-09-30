import { App, PluginSettingTab, Setting } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger, LoggerFactory } from '../logging';

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
			.setDesc('Open the Sonigraph Audio Control Center to configure all plugin settings')
			.addButton(button => button
				.setButtonText('Open Control Center')
				.setCta()
				.onClick(() => {
					// Close settings before opening Control Center
					(this.app as any).setting.close();
					this.plugin.openControlPanel();
				}));

		// Note about Sonic Graph settings
		const sonicGraphNote = containerEl.createDiv({ cls: 'osp-settings-note' });
		sonicGraphNote.innerHTML = `
			<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5; margin-top: 1rem;">
				<strong>Note:</strong> Sonic Graph settings (adaptive detail, content-aware positioning, smart clustering, animation duration)
				are now available in:
			</p>
			<ul style="color: var(--text-muted); font-size: 13px; line-height: 1.5; margin: 0.5rem 0 0 1.5rem;">
				<li><strong>Control Center > Sonic Graph tab</strong> for comprehensive settings</li>
				<li><strong>Sonic Graph settings panel</strong> (⚙️ icon) for quick visualization controls</li>
			</ul>
		`;

		// Legacy: Kept for backwards compatibility but no longer displayed
		/*
		// Sonic Graph Animation Duration Setting
		new Setting(containerEl)
			.setName('Sonic Graph animation duration')
			.setDesc('Base duration for temporal graph animations in seconds. Higher values create more contemplative pacing.')
			.addSlider(slider => slider
				.setLimits(15, 420, 15) // 15 seconds to 7 minutes, in 15-second increments
				.setValue(this.plugin.settings.sonicGraphAnimationDuration || 60)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.sonicGraphAnimationDuration = value;
					await this.plugin.saveSettings();
					logger.info('settings-change', 'Animation duration changed', { duration: value });
				})
			);

		// --- Sonic Graph Settings Section ---
		const sonicGraphSection = containerEl.createEl('div', { cls: 'osp-sonic-graph-settings' });
		sonicGraphSection.createEl('h3', { text: 'Sonic Graph Settings', cls: 'osp-section-header' });

		// Adaptive Detail Levels - Main Toggle
		new Setting(sonicGraphSection)
			.setName('Enable Adaptive Detail Levels')
			.setDesc('Automatically show/hide elements based on zoom level for better performance and visual clarity. Reduces clutter when zoomed out, shows more detail when zoomed in.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.adaptiveDetail?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) {
						this.plugin.settings.sonicGraphSettings = {
							timeline: { duration: 60, spacing: 'auto', loop: false, showMarkers: true, timeWindow: 'all-time', granularity: 'year', customRange: { value: 1, unit: 'years' }, eventSpreadingMode: 'gentle', maxEventSpacing: 5.0, simultaneousEventLimit: 3, eventBatchSize: 5 },
							audio: { density: 30, noteDuration: 0.3, enableEffects: true, autoDetectionOverride: 'auto' },
							visual: { showLabels: false, showFileNames: false, animationStyle: 'fade', nodeScaling: 1.0, connectionOpacity: 0.6, timelineMarkersEnabled: true, loopAnimation: false },
							navigation: { enableControlCenter: true, enableReset: true, enableExport: false },
							adaptiveDetail: { enabled: false, mode: 'automatic', thresholds: { overview: 0.5, standard: 1.5, detail: 3.0 }, overrides: { alwaysShowLabels: false, minimumVisibleNodes: 10, maximumVisibleNodes: -1 } },
							contentAwarePositioning: { enabled: false, tagInfluence: { strength: 'moderate', weight: 0.3 }, temporalPositioning: { enabled: true, weight: 0.1, recentThresholdDays: 30 }, hubCentrality: { enabled: true, weight: 0.2, minimumConnections: 5 }, debugVisualization: false },
							layout: { clusteringStrength: 0.15, groupSeparation: 0.08, pathBasedGrouping: { enabled: false, groups: [] }, filters: { showTags: true, showOrphans: true }, temporalClustering: false, journalGravity: 0.1, layoutPreset: 'balanced', adaptiveScaling: true },
							smartClustering: { enabled: false, algorithm: 'hybrid', weights: { linkStrength: 0.4, sharedTags: 0.3, folderHierarchy: 0.2, temporalProximity: 0.1 }, clustering: { minClusterSize: 3, maxClusters: 12, resolution: 1.0 }, visualization: { enableVisualization: true, showClusterLabels: true, clusterBoundaries: 'subtle', colorScheme: 'type-based' }, integration: { respectExistingGroups: true, hybridMode: true, overrideThreshold: 0.7 }, debugging: { debugMode: false, showStatistics: false, logClusteringDetails: false } },
							connectionTypeMapping: { enabled: false, independentFromContentAware: true, mappings: { wikilink: { enabled: true, instrumentFamily: 'strings', intensity: 0.7, audioCharacteristics: { baseVolume: 0.7, volumeVariation: 0.1, noteDuration: 1.0, attackTime: 0.05, releaseTime: 0.8, spatialSpread: 0.3, reverbAmount: 0.2, delayAmount: 0.1, harmonicRichness: 0.6, dissonanceLevel: 0.0, chordsEnabled: false, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.3, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, embed: { enabled: true, instrumentFamily: 'keyboards', intensity: 0.7, audioCharacteristics: { baseVolume: 0.8, volumeVariation: 0.15, noteDuration: 1.2, attackTime: 0.08, releaseTime: 1.2, spatialSpread: 0.5, reverbAmount: 0.3, delayAmount: 0.2, harmonicRichness: 0.8, dissonanceLevel: 0.0, chordsEnabled: true, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.4, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, markdown: { enabled: false, instrumentFamily: 'woodwinds', intensity: 0.7, audioCharacteristics: { baseVolume: 0.6, volumeVariation: 0.1, noteDuration: 0.8, attackTime: 0.03, releaseTime: 0.6, spatialSpread: 0.2, reverbAmount: 0.15, delayAmount: 0.05, harmonicRichness: 0.4, dissonanceLevel: 0.0, chordsEnabled: false, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.2, bidirectionalHarmony: false, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, tag: { enabled: false, instrumentFamily: 'ambient', intensity: 0.7, audioCharacteristics: { baseVolume: 0.5, volumeVariation: 0.2, noteDuration: 1.5, attackTime: 0.1, releaseTime: 2.0, spatialSpread: 0.7, reverbAmount: 0.4, delayAmount: 0.3, harmonicRichness: 0.9, dissonanceLevel: 0.0, chordsEnabled: true, strengthToVolumeEnabled: false, strengthToVolumeAmount: 0.0, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: false, frequencyThreshold: 3, volumeBoost: 1.0, harmonicBoost: 1.0 }, contextualModifiers: { sameFolderBoost: 1.0, crossFolderReduction: 1.0, recentConnectionBoost: 1.0, timeDecayDays: 30 } } }, globalSettings: { connectionVolumeMix: 0.6, maxSimultaneousConnections: 15, connectionAudioFadeTime: 0.3, enableCaching: true, maxCacheSize: 500, selectiveProcessing: true, highQualityMode: false, antiAliasingEnabled: true, compressionEnabled: true }, currentPreset: 'Default', customPresets: [], advancedFeatures: { connectionChords: false, contextualHarmony: false, dynamicInstrumentation: false, velocityModulation: true, temporalSpacing: false, crossfadeConnections: false } }
						};
					}
					if (!this.plugin.settings.sonicGraphSettings.adaptiveDetail) {
						this.plugin.settings.sonicGraphSettings.adaptiveDetail = {
							enabled: false,
							mode: 'automatic',
							thresholds: { overview: 0.5, standard: 1.5, detail: 3.0 },
							overrides: { alwaysShowLabels: false, minimumVisibleNodes: 10, maximumVisibleNodes: -1 }
						};
					}
					this.plugin.settings.sonicGraphSettings.adaptiveDetail.enabled = value;
					await this.plugin.saveSettings();
					logger.info('settings-change', 'Adaptive detail levels toggled', { enabled: value });
					
					// Refresh the settings display to show/hide sub-options
					this.display();
				})
			);

		// Adaptive Detail Mode (only show when enabled)
		if (this.plugin.settings.sonicGraphSettings?.adaptiveDetail?.enabled) {
			new Setting(sonicGraphSection)
				.setName('Adaptive Detail Mode')
				.setDesc('Automatic: Changes based on zoom level. Performance: Optimized for large vaults. Manual: User controls via buttons.')
				.addDropdown(dropdown => dropdown
					.addOption('automatic', 'Automatic (Recommended)')
					.addOption('performance', 'Performance Optimized')
					.addOption('manual', 'Manual Control')
					.setValue(this.plugin.settings.sonicGraphSettings.adaptiveDetail.mode)
					.onChange(async (value: 'automatic' | 'performance' | 'manual') => {
						this.plugin.settings.sonicGraphSettings!.adaptiveDetail.mode = value;
						await this.plugin.saveSettings();
						logger.info('settings-change', 'Adaptive detail mode changed', { mode: value });
					})
				);

			// Always Show Labels Override
			new Setting(sonicGraphSection)
				.setName('Always show labels')
				.setDesc('Override zoom-based label visibility and always show node labels regardless of zoom level.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.sonicGraphSettings.adaptiveDetail.overrides.alwaysShowLabels)
					.onChange(async (value) => {
						this.plugin.settings.sonicGraphSettings!.adaptiveDetail.overrides.alwaysShowLabels = value;
						await this.plugin.saveSettings();
						logger.info('settings-change', 'Always show labels override changed', { enabled: value });
					})
				);

			// Maximum Visible Nodes
			new Setting(sonicGraphSection)
				.setName('Maximum visible nodes')
				.setDesc('Limit the maximum number of nodes shown for performance. Set to 0 for no limit.')
				.addSlider(slider => slider
					.setLimits(0, 2000, 50)
					.setValue(this.plugin.settings.sonicGraphSettings.adaptiveDetail.overrides.maximumVisibleNodes === -1 ? 0 : this.plugin.settings.sonicGraphSettings.adaptiveDetail.overrides.maximumVisibleNodes)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.sonicGraphSettings!.adaptiveDetail.overrides.maximumVisibleNodes = value === 0 ? -1 : value;
						await this.plugin.saveSettings();
						logger.info('settings-change', 'Maximum visible nodes changed', { maxNodes: value === 0 ? 'unlimited' : value });
					})
				);
		}

		// Content-Aware Positioning - Main Toggle
		new Setting(sonicGraphSection)
			.setName('Enable Content-Aware Positioning')
			.setDesc('Use semantic relationships (tags, creation time, connections) to influence graph layout for more meaningful positioning.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.contentAwarePositioning?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) {
						this.plugin.settings.sonicGraphSettings = {
							timeline: { duration: 60, spacing: 'auto', loop: false, showMarkers: true, timeWindow: 'all-time', granularity: 'year', customRange: { value: 1, unit: 'years' }, eventSpreadingMode: 'gentle', maxEventSpacing: 5.0, simultaneousEventLimit: 3, eventBatchSize: 5 },
							audio: { density: 30, noteDuration: 0.3, enableEffects: true, autoDetectionOverride: 'auto' },
							visual: { showLabels: false, showFileNames: false, animationStyle: 'fade', nodeScaling: 1.0, connectionOpacity: 0.6, timelineMarkersEnabled: true, loopAnimation: false },
							navigation: { enableControlCenter: true, enableReset: true, enableExport: false },
							adaptiveDetail: { enabled: false, mode: 'automatic', thresholds: { overview: 0.5, standard: 1.5, detail: 3.0 }, overrides: { alwaysShowLabels: false, minimumVisibleNodes: 10, maximumVisibleNodes: -1 } },
							contentAwarePositioning: { enabled: false, tagInfluence: { strength: 'moderate', weight: 0.3 }, temporalPositioning: { enabled: true, weight: 0.1, recentThresholdDays: 30 }, hubCentrality: { enabled: true, weight: 0.2, minimumConnections: 5 }, debugVisualization: false },
							layout: { clusteringStrength: 0.15, groupSeparation: 0.08, pathBasedGrouping: { enabled: false, groups: [] }, filters: { showTags: true, showOrphans: true }, temporalClustering: false, journalGravity: 0.1, layoutPreset: 'balanced', adaptiveScaling: true },
							smartClustering: { enabled: false, algorithm: 'hybrid', weights: { linkStrength: 0.4, sharedTags: 0.3, folderHierarchy: 0.2, temporalProximity: 0.1 }, clustering: { minClusterSize: 3, maxClusters: 12, resolution: 1.0 }, visualization: { enableVisualization: true, showClusterLabels: true, clusterBoundaries: 'subtle', colorScheme: 'type-based' }, integration: { respectExistingGroups: true, hybridMode: true, overrideThreshold: 0.7 }, debugging: { debugMode: false, showStatistics: false, logClusteringDetails: false } },
							connectionTypeMapping: { enabled: false, independentFromContentAware: true, mappings: { wikilink: { enabled: true, instrumentFamily: 'strings', intensity: 0.7, audioCharacteristics: { baseVolume: 0.7, volumeVariation: 0.1, noteDuration: 1.0, attackTime: 0.05, releaseTime: 0.8, spatialSpread: 0.3, reverbAmount: 0.2, delayAmount: 0.1, harmonicRichness: 0.6, dissonanceLevel: 0.0, chordsEnabled: false, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.3, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, embed: { enabled: true, instrumentFamily: 'keyboards', intensity: 0.7, audioCharacteristics: { baseVolume: 0.8, volumeVariation: 0.15, noteDuration: 1.2, attackTime: 0.08, releaseTime: 1.2, spatialSpread: 0.5, reverbAmount: 0.3, delayAmount: 0.2, harmonicRichness: 0.8, dissonanceLevel: 0.0, chordsEnabled: true, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.4, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, markdown: { enabled: false, instrumentFamily: 'woodwinds', intensity: 0.7, audioCharacteristics: { baseVolume: 0.6, volumeVariation: 0.1, noteDuration: 0.8, attackTime: 0.03, releaseTime: 0.6, spatialSpread: 0.2, reverbAmount: 0.15, delayAmount: 0.05, harmonicRichness: 0.4, dissonanceLevel: 0.0, chordsEnabled: false, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.2, bidirectionalHarmony: false, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, tag: { enabled: false, instrumentFamily: 'ambient', intensity: 0.7, audioCharacteristics: { baseVolume: 0.5, volumeVariation: 0.2, noteDuration: 1.5, attackTime: 0.1, releaseTime: 2.0, spatialSpread: 0.7, reverbAmount: 0.4, delayAmount: 0.3, harmonicRichness: 0.9, dissonanceLevel: 0.0, chordsEnabled: true, strengthToVolumeEnabled: false, strengthToVolumeAmount: 0.0, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: false, frequencyThreshold: 3, volumeBoost: 1.0, harmonicBoost: 1.0 }, contextualModifiers: { sameFolderBoost: 1.0, crossFolderReduction: 1.0, recentConnectionBoost: 1.0, timeDecayDays: 30 } } }, globalSettings: { connectionVolumeMix: 0.6, maxSimultaneousConnections: 15, connectionAudioFadeTime: 0.3, enableCaching: true, maxCacheSize: 500, selectiveProcessing: true, highQualityMode: false, antiAliasingEnabled: true, compressionEnabled: true }, currentPreset: 'Default', customPresets: [], advancedFeatures: { connectionChords: false, contextualHarmony: false, dynamicInstrumentation: false, velocityModulation: true, temporalSpacing: false, crossfadeConnections: false } }
						};
					}
					if (!this.plugin.settings.sonicGraphSettings.contentAwarePositioning) {
						this.plugin.settings.sonicGraphSettings.contentAwarePositioning = {
							enabled: false,
							tagInfluence: { strength: 'moderate', weight: 0.3 },
							temporalPositioning: { enabled: true, weight: 0.1, recentThresholdDays: 30 },
							hubCentrality: { enabled: true, weight: 0.2, minimumConnections: 5 },
							debugVisualization: false
						};
					}
					this.plugin.settings.sonicGraphSettings.contentAwarePositioning.enabled = value;
					await this.plugin.saveSettings();
					logger.info('settings-change', 'Content-aware positioning toggled', { enabled: value });
				})
			);

		// Smart Clustering Algorithms - Main Toggle
		new Setting(sonicGraphSection)
			.setName('Enable Smart Clustering Algorithms')
			.setDesc('Automatically group related nodes using community detection and multi-factor analysis. Combines link strength, shared tags, folder hierarchy, and temporal proximity.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.smartClustering?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) {
						this.plugin.settings.sonicGraphSettings = {
							timeline: { duration: 60, spacing: 'auto', loop: false, showMarkers: true, timeWindow: 'all-time', granularity: 'year', customRange: { value: 1, unit: 'years' }, eventSpreadingMode: 'gentle', maxEventSpacing: 5.0, simultaneousEventLimit: 3, eventBatchSize: 5 },
							audio: { density: 30, noteDuration: 0.3, enableEffects: true, autoDetectionOverride: 'auto' },
							visual: { showLabels: false, showFileNames: false, animationStyle: 'fade', nodeScaling: 1.0, connectionOpacity: 0.6, timelineMarkersEnabled: true, loopAnimation: false },
							navigation: { enableControlCenter: true, enableReset: true, enableExport: false },
							adaptiveDetail: { enabled: false, mode: 'automatic', thresholds: { overview: 0.5, standard: 1.5, detail: 3.0 }, overrides: { alwaysShowLabels: false, minimumVisibleNodes: 10, maximumVisibleNodes: -1 } },
							contentAwarePositioning: { enabled: false, tagInfluence: { strength: 'moderate', weight: 0.3 }, temporalPositioning: { enabled: true, weight: 0.1, recentThresholdDays: 30 }, hubCentrality: { enabled: true, weight: 0.2, minimumConnections: 5 }, debugVisualization: false },
							layout: { clusteringStrength: 0.15, groupSeparation: 0.08, pathBasedGrouping: { enabled: false, groups: [] }, filters: { showTags: true, showOrphans: true }, temporalClustering: false, journalGravity: 0.1, layoutPreset: 'balanced', adaptiveScaling: true },
							smartClustering: { enabled: false, algorithm: 'hybrid', weights: { linkStrength: 0.4, sharedTags: 0.3, folderHierarchy: 0.2, temporalProximity: 0.1 }, clustering: { minClusterSize: 3, maxClusters: 12, resolution: 1.0 }, visualization: { enableVisualization: true, showClusterLabels: true, clusterBoundaries: 'subtle', colorScheme: 'type-based' }, integration: { respectExistingGroups: true, hybridMode: true, overrideThreshold: 0.7 }, debugging: { debugMode: false, showStatistics: false, logClusteringDetails: false } },
							connectionTypeMapping: { enabled: false, independentFromContentAware: true, mappings: { wikilink: { enabled: true, instrumentFamily: 'strings', intensity: 0.7, audioCharacteristics: { baseVolume: 0.7, volumeVariation: 0.1, noteDuration: 1.0, attackTime: 0.05, releaseTime: 0.8, spatialSpread: 0.3, reverbAmount: 0.2, delayAmount: 0.1, harmonicRichness: 0.6, dissonanceLevel: 0.0, chordsEnabled: false, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.3, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, embed: { enabled: true, instrumentFamily: 'keyboards', intensity: 0.7, audioCharacteristics: { baseVolume: 0.8, volumeVariation: 0.15, noteDuration: 1.2, attackTime: 0.08, releaseTime: 1.2, spatialSpread: 0.5, reverbAmount: 0.3, delayAmount: 0.2, harmonicRichness: 0.8, dissonanceLevel: 0.0, chordsEnabled: true, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.4, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, markdown: { enabled: false, instrumentFamily: 'woodwinds', intensity: 0.7, audioCharacteristics: { baseVolume: 0.6, volumeVariation: 0.1, noteDuration: 0.8, attackTime: 0.03, releaseTime: 0.6, spatialSpread: 0.2, reverbAmount: 0.15, delayAmount: 0.05, harmonicRichness: 0.4, dissonanceLevel: 0.0, chordsEnabled: false, strengthToVolumeEnabled: true, strengthToVolumeAmount: 0.2, bidirectionalHarmony: false, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: true, frequencyThreshold: 3, volumeBoost: 1.3, harmonicBoost: 1.2 }, contextualModifiers: { sameFolderBoost: 1.1, crossFolderReduction: 0.9, recentConnectionBoost: 1.15, timeDecayDays: 30 } }, tag: { enabled: false, instrumentFamily: 'ambient', intensity: 0.7, audioCharacteristics: { baseVolume: 0.5, volumeVariation: 0.2, noteDuration: 1.5, attackTime: 0.1, releaseTime: 2.0, spatialSpread: 0.7, reverbAmount: 0.4, delayAmount: 0.3, harmonicRichness: 0.9, dissonanceLevel: 0.0, chordsEnabled: true, strengthToVolumeEnabled: false, strengthToVolumeAmount: 0.0, bidirectionalHarmony: true, brokenLinkDissonance: false }, linkStrengthAnalysis: { enabled: false, frequencyThreshold: 3, volumeBoost: 1.0, harmonicBoost: 1.0 }, contextualModifiers: { sameFolderBoost: 1.0, crossFolderReduction: 1.0, recentConnectionBoost: 1.0, timeDecayDays: 30 } } }, globalSettings: { connectionVolumeMix: 0.6, maxSimultaneousConnections: 15, connectionAudioFadeTime: 0.3, enableCaching: true, maxCacheSize: 500, selectiveProcessing: true, highQualityMode: false, antiAliasingEnabled: true, compressionEnabled: true }, currentPreset: 'Default', customPresets: [], advancedFeatures: { connectionChords: false, contextualHarmony: false, dynamicInstrumentation: false, velocityModulation: true, temporalSpacing: false, crossfadeConnections: false } }
						};
					}

					if (!this.plugin.settings.sonicGraphSettings.smartClustering) {
						this.plugin.settings.sonicGraphSettings.smartClustering = {
							enabled: false,
							algorithm: 'hybrid',
							weights: { linkStrength: 0.4, sharedTags: 0.3, folderHierarchy: 0.2, temporalProximity: 0.1 },
							clustering: { minClusterSize: 3, maxClusters: 12, resolution: 1.0 },
							visualization: { enableVisualization: true, showClusterLabels: true, clusterBoundaries: 'subtle', colorScheme: 'type-based' },
							integration: { respectExistingGroups: true, hybridMode: true, overrideThreshold: 0.7 },
							debugging: { debugMode: false, showStatistics: false, logClusteringDetails: false }
						};
					}

					this.plugin.settings.sonicGraphSettings.smartClustering.enabled = value;
					await this.plugin.saveSettings();
					logger.info('settings-change', 'Smart clustering algorithms toggled', { enabled: value });
					this.display(); // Refresh to show/hide sub-options
				})
			);

		// Smart Clustering Algorithm Selection (only show when enabled)
		if (this.plugin.settings.sonicGraphSettings?.smartClustering?.enabled) {
			new Setting(sonicGraphSection)
				.setName('Clustering Algorithm')
				.setDesc('Louvain: Fast community detection. Modularity: High-quality academic clustering. Hybrid: Combines both with multi-factor refinement.')
				.addDropdown(dropdown => dropdown
					.addOption('louvain', 'Louvain (Fast)')
					.addOption('modularity', 'Modularity (Quality)')
					.addOption('hybrid', 'Hybrid (Recommended)')
					.setValue(this.plugin.settings.sonicGraphSettings.smartClustering.algorithm)
					.onChange(async (value: 'louvain' | 'modularity' | 'hybrid') => {
						this.plugin.settings.sonicGraphSettings!.smartClustering.algorithm = value;
						await this.plugin.saveSettings();
						logger.info('settings-change', 'Clustering algorithm changed', { algorithm: value });
					})
				);

			// Minimum Cluster Size
			new Setting(sonicGraphSection)
				.setName('Minimum cluster size')
				.setDesc('Minimum number of nodes required to form a cluster. Smaller values create more clusters.')
				.addSlider(slider => slider
					.setLimits(2, 10, 1)
					.setValue(this.plugin.settings.sonicGraphSettings.smartClustering.clustering.minClusterSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.sonicGraphSettings!.smartClustering.clustering.minClusterSize = value;
						await this.plugin.saveSettings();
						logger.info('settings-change', 'Minimum cluster size changed', { minSize: value });
					})
				);

			// Maximum Number of Clusters
			new Setting(sonicGraphSection)
				.setName('Maximum clusters')
				.setDesc('Maximum number of clusters to create. Prevents over-fragmentation of the graph.')
				.addSlider(slider => slider
					.setLimits(5, 25, 1)
					.setValue(this.plugin.settings.sonicGraphSettings.smartClustering.clustering.maxClusters)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.sonicGraphSettings!.smartClustering.clustering.maxClusters = value;
						await this.plugin.saveSettings();
						logger.info('settings-change', 'Maximum clusters changed', { maxClusters: value });
					})
				);

			// Respect Existing Groups
			new Setting(sonicGraphSection)
				.setName('Respect manual groups')
				.setDesc('Honor existing path-based groups when creating automatic clusters.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.sonicGraphSettings.smartClustering.integration.respectExistingGroups)
					.onChange(async (value) => {
						this.plugin.settings.sonicGraphSettings!.smartClustering.integration.respectExistingGroups = value;
						await this.plugin.saveSettings();
						logger.info('settings-change', 'Respect existing groups changed', { respectGroups: value });
					})
				);
		}
		*/

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