/**
 * Sonic Graph Advanced Features Settings
 *
 * Advanced audio features for Control Center.
 * Contains: Clustering Audio, Musical Theory, Orchestration, Spatial Audio.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';
import { PanningMode, PanningCurve } from '../../audio/spatial/types';

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

		// Smart Clustering Audio
		this.renderClusteringSection(container);

		// Hub Node Orchestration
		this.renderHubOrchestrationSection(container);

		// Musical Theory
		this.renderMusicalTheorySection(container);

		// Dynamic Orchestration
		this.renderDynamicOrchestrationSection(container);

		// Spatial Audio & Panning
		this.renderSpatialAudioSection(container);
	}

	/**
	 * Smart Clustering Audio
	 */
	public renderClusteringSection(container: HTMLElement): void {
		// Create a wrapper for this card so we can re-render just this section
		const cardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderClusteringCard(cardContainer);
	}

	private renderClusteringCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		const card = new MaterialCard({
			title: 'Smart clustering audio',
			iconName: 'network',
			subtitle: 'Generate audio themes for cluster types',
			elevation: 1
		});

		const content = card.getContent();

		// Enable Smart Clustering Algorithms toggle
		new Setting(content)
			.setName('Enable smart clustering algorithms')
			.setDesc('Use advanced algorithms to detect and group related notes based on links, tags, folders, and temporal proximity')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sonicGraphSettings?.smartClustering?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.sonicGraphSettings) return;
					if (!this.plugin.settings.sonicGraphSettings.smartClustering) {
						this.plugin.settings.sonicGraphSettings.smartClustering = {
							enabled: value,
							algorithm: 'hybrid',
							weights: { linkStrength: 0.4, sharedTags: 0.3, folderHierarchy: 0.2, temporalProximity: 0.1 },
							clustering: { minClusterSize: 3, maxClusters: 12, resolution: 1.0 },
							visualization: { enableVisualization: true, showClusterLabels: true, clusterBoundaries: 'subtle', colorScheme: 'type-based' },
							integration: { respectExistingGroups: true, hybridMode: true, overrideThreshold: 0.7 },
							debugging: { debugMode: false, showStatistics: false, logClusteringDetails: false }
						};
					} else {
						this.plugin.settings.sonicGraphSettings.smartClustering.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Smart clustering algorithms: ${value}`);
				})
			);

		// Enable cluster audio toggle
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

					// Re-render only this card
					this.renderClusteringCard(cardContainer);
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
			const noteP = note.createEl('p');
			noteP.style.color = 'var(--text-muted)';
			noteP.style.fontSize = '12px';
			noteP.style.marginTop = '0.5rem';
			noteP.createEl('strong', { text: 'Note:' });
			noteP.appendText(' Detailed per-cluster-type settings (tag-based, temporal, link-dense, ' +
				'community, topical) are available in the Sonic Graph modal\'s settings panel.');
		}

		cardContainer.appendChild(card.getElement());
	}

	/**
	 * Musical Theory Integration
	 */
	public renderMusicalTheorySection(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Musical theory integration',
			iconName: 'book-open',
			subtitle: 'Constrain notes to scales and modes',
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
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.rootNote || 'C')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.rootNote = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Root note: ${value}`);
				})
			);

		// Enforce harmony toggle
		new Setting(content)
			.setName('Enforce harmony')
			.setDesc('Force all notes to fit within the selected scale and key')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.enforceHarmony || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.enforceHarmony = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Enforce harmony: ${value}`);
				})
			);

		// Allow chromatic passing toggle
		new Setting(content)
			.setName('Allow chromatic passing')
			.setDesc('Allow notes outside the scale as passing tones between scale notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.allowChromaticPassing || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.allowChromaticPassing = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Allow chromatic passing: ${value}`);
				})
			);

		// Dissonance threshold slider
		new Setting(content)
			.setName('Dissonance threshold')
			.setDesc('Maximum allowed dissonance in harmonies (0 = consonant, 1 = fully dissonant)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.05)
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.dissonanceThreshold || 0.5)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.dissonanceThreshold = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Dissonance threshold: ${value}`);
				})
			);

		// Quantization strength slider
		new Setting(content)
			.setName('Quantization strength')
			.setDesc('How strongly to snap notes to the scale (0 = free, 1 = strict quantization)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.05)
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.quantizationStrength || 0.8)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.quantizationStrength = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Quantization strength: ${value}`);
				})
			);

		// Preferred chord progression text input
		new Setting(content)
			.setName('Preferred chord progression')
			.setDesc('Name of preferred chord progression (e.g., "I-IV-V-I", "ii-V-I"). Leave empty for automatic.')
			.addText(text => text
				.setPlaceholder('e.g., I-IV-V-I')
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.preferredChordProgression || '')
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.preferredChordProgression = value || undefined;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Preferred chord progression: ${value || 'automatic'}`);
				})
			);

		// Dynamic scale modulation toggle
		new Setting(content)
			.setName('Dynamic scale modulation')
			.setDesc('Automatically change scale based on vault state and context')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.dynamicScaleModulation || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.dynamicScaleModulation = value;
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Dynamic scale modulation: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Hub Node Orchestration
	 */
	public renderHubOrchestrationSection(container: HTMLElement): void {
		// Create a wrapper for this card so we can re-render just this section
		const cardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderHubOrchestrationCard(cardContainer);
	}

	private renderHubOrchestrationCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		const card = new MaterialCard({
			title: 'Hub node orchestration',
			iconName: 'git-branch',
			subtitle: 'Emphasize highly connected nodes',
			elevation: 1
		});

		const content = card.getContent();

		// Enable toggle
		new Setting(content)
			.setName('Enable hub orchestration')
			.setDesc('Make highly connected "hub" nodes more prominent in the audio mix')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hubOrchestration?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.hubOrchestration) {
						this.plugin.settings.hubOrchestration = {
							enabled: value,
							hubThreshold: 0.6,
							prominenceMultiplier: 2.0,
							orchestrationMode: 'balanced',
							transitionsEnabled: true,
							centralityWeights: {
								degree: 0.3,
								betweenness: 0.3,
								eigenvector: 0.2,
								pageRank: 0.2
							},
							hubInstrumentPreference: ['piano', 'strings', 'brass']
						};
					} else {
						this.plugin.settings.hubOrchestration.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Hub orchestration: ${value}`);

					// Re-render only this card
					this.renderHubOrchestrationCard(cardContainer);
				})
			);

		// Show controls if enabled
		if (this.plugin.settings.hubOrchestration?.enabled) {
			// Hub threshold
			new Setting(content)
				.setName('Hub threshold')
				.setDesc('Minimum composite score for a node to be considered a hub (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.05)
					.setValue(this.plugin.settings.hubOrchestration?.hubThreshold || 0.6)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration) {
							this.plugin.settings.hubOrchestration.hubThreshold = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Prominence multiplier
			new Setting(content)
				.setName('Prominence multiplier')
				.setDesc('How much louder hub nodes are (1-5x)')
				.addSlider(slider => slider
					.setLimits(1, 5, 0.5)
					.setValue(this.plugin.settings.hubOrchestration?.prominenceMultiplier || 2.0)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration) {
							this.plugin.settings.hubOrchestration.prominenceMultiplier = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Orchestration mode
			new Setting(content)
				.setName('Orchestration mode')
				.setDesc('How hubs interact with other nodes')
				.addDropdown(dropdown => dropdown
					.addOption('hub-led', 'Hub-Led - Hubs dominate')
					.addOption('balanced', 'Balanced - Moderate emphasis')
					.addOption('democratic', 'Democratic - Subtle emphasis')
					.setValue(this.plugin.settings.hubOrchestration?.orchestrationMode || 'balanced')
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration) {
							this.plugin.settings.hubOrchestration.orchestrationMode = value as 'hub-led' | 'balanced' | 'democratic';
							await this.plugin.saveSettings();
						}
					})
				);

			// Transitions enabled
			new Setting(content)
				.setName('Hub transitions')
				.setDesc('Play special audio when nodes become or cease to be hubs')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.hubOrchestration?.transitionsEnabled ?? true)
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration) {
							this.plugin.settings.hubOrchestration.transitionsEnabled = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Centrality weights section
			const weightsDiv = content.createDiv({ cls: 'osp-settings-subsection' });
			new Setting(weightsDiv)
				.setHeading()
				.setName('Centrality weights')
				.setDesc('Adjust how different centrality metrics contribute to hub detection');

			// Degree centrality weight
			new Setting(weightsDiv)
				.setName('Degree weight')
				.setDesc('Basic connectivity (number of connections)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.hubOrchestration?.centralityWeights?.degree || 0.3)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration?.centralityWeights) {
							this.plugin.settings.hubOrchestration.centralityWeights.degree = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Betweenness centrality weight
			new Setting(weightsDiv)
				.setName('Betweenness weight')
				.setDesc('Bridge importance (on shortest paths)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.hubOrchestration?.centralityWeights?.betweenness || 0.3)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration?.centralityWeights) {
							this.plugin.settings.hubOrchestration.centralityWeights.betweenness = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Eigenvector centrality weight
			new Setting(weightsDiv)
				.setName('Eigenvector weight')
				.setDesc('Network influence (connected to well-connected nodes)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.hubOrchestration?.centralityWeights?.eigenvector || 0.2)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration?.centralityWeights) {
							this.plugin.settings.hubOrchestration.centralityWeights.eigenvector = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// PageRank weight
			new Setting(weightsDiv)
				.setName('PageRank weight')
				.setDesc('Authority score (Google PageRank algorithm)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.hubOrchestration?.centralityWeights?.pageRank || 0.2)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.hubOrchestration?.centralityWeights) {
							this.plugin.settings.hubOrchestration.centralityWeights.pageRank = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Hub instrument preference
			const instrumentsNote = content.createDiv({ cls: 'osp-settings-note' });
			const instrumentsP = instrumentsNote.createEl('p');
			instrumentsP.style.color = 'var(--text-muted)';
			instrumentsP.style.fontSize = '12px';
			instrumentsP.style.lineHeight = '1.5';
			instrumentsP.style.marginTop = '1rem';
			instrumentsP.createEl('strong', { text: 'Hub Instrument Preference:' });
			instrumentsP.appendText(' Hub nodes will preferentially use piano, strings, ' +
				'and brass instruments to emphasize their prominence in the network.');
		}

		cardContainer.appendChild(card.getElement());
	}

	/**
	 * Dynamic Orchestration
	 */
	public renderDynamicOrchestrationSection(container: HTMLElement): void {
		// Create a wrapper for this card so we can re-render just this section
		const cardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderDynamicOrchestrationCard(cardContainer);
	}

	private renderDynamicOrchestrationCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		const card = new MaterialCard({
			title: 'Dynamic orchestration',
			iconName: 'activity',
			subtitle: 'Auto-adjust complexity based on context',
			elevation: 1
		});

		const content = card.getContent();

		// Enable toggle
		new Setting(content)
			.setName('Enable dynamic orchestration')
			.setDesc('Automatically adjust instrument complexity based on graph density and time')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.dynamicOrchestration?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.dynamicOrchestration) {
						this.plugin.settings.dynamicOrchestration = {
							enabled: value,
							customThresholds: false,
							temporalInfluenceEnabled: true,
							timeOfDayInfluence: 0.5,
							seasonalInfluence: 0.3,
							transitionDuration: 3.0,
							autoAdjust: true
						};
					} else {
						this.plugin.settings.dynamicOrchestration.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Dynamic orchestration: ${value}`);

					// Re-render only this card
					this.renderDynamicOrchestrationCard(cardContainer);
				})
			);

		// Show controls if enabled
		if (this.plugin.settings.dynamicOrchestration?.enabled) {
			// Temporal influence
			new Setting(content)
				.setName('Temporal influence')
				.setDesc('Enable time-of-day and seasonal effects')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.dynamicOrchestration?.temporalInfluenceEnabled || true)
					.onChange(async (value) => {
						if (this.plugin.settings.dynamicOrchestration) {
							this.plugin.settings.dynamicOrchestration.temporalInfluenceEnabled = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Time of day influence
			new Setting(content)
				.setName('Time-of-day influence')
				.setDesc('How much time-of-day affects orchestration (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.dynamicOrchestration?.timeOfDayInfluence || 0.5)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.dynamicOrchestration) {
							this.plugin.settings.dynamicOrchestration.timeOfDayInfluence = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Seasonal influence
			new Setting(content)
				.setName('Seasonal influence')
				.setDesc('How much season affects orchestration (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.dynamicOrchestration?.seasonalInfluence || 0.3)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.dynamicOrchestration) {
							this.plugin.settings.dynamicOrchestration.seasonalInfluence = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Transition duration
			new Setting(content)
				.setName('Transition duration')
				.setDesc('How long to transition between complexity tiers (seconds)')
				.addSlider(slider => slider
					.setLimits(0.5, 10, 0.5)
					.setValue(this.plugin.settings.dynamicOrchestration?.transitionDuration || 3.0)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.dynamicOrchestration) {
							this.plugin.settings.dynamicOrchestration.transitionDuration = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Auto-adjust
			new Setting(content)
				.setName('Auto-adjust')
				.setDesc('Automatically adjust to vault changes')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.dynamicOrchestration?.autoAdjust || true)
					.onChange(async (value) => {
						if (this.plugin.settings.dynamicOrchestration) {
							this.plugin.settings.dynamicOrchestration.autoAdjust = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Custom thresholds
			new Setting(content)
				.setName('Custom complexity thresholds')
				.setDesc('Use custom thresholds instead of automatic detection')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.dynamicOrchestration?.customThresholds || false)
					.onChange(async (value) => {
						if (this.plugin.settings.dynamicOrchestration) {
							this.plugin.settings.dynamicOrchestration.customThresholds = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Info note about complexity tiers
			const note = content.createDiv({ cls: 'osp-settings-note' });
			const noteP = note.createEl('p');
			noteP.style.color = 'var(--text-muted)';
			noteP.style.fontSize = '12px';
			noteP.style.lineHeight = '1.5';
			noteP.style.marginTop = '1rem';
			noteP.createEl('strong', { text: 'Complexity Tiers:' });
			noteP.appendText(' The system automatically adjusts orchestration based on vault size:');
			noteP.createEl('br');
			noteP.appendText('• Minimal (0-100 nodes): Basic instruments only');
			noteP.createEl('br');
			noteP.appendText('• Simple (100-500): Add rhythmic layers');
			noteP.createEl('br');
			noteP.appendText('• Moderate (500-1000): Add harmonic pads');
			noteP.createEl('br');
			noteP.appendText('• Complex (1000-5000): Full orchestral arrangement');
			noteP.createEl('br');
			noteP.appendText('• Extensive (5000+): Maximum complexity');
		}

		cardContainer.appendChild(card.getElement());
	}

	/**
	 * Spatial Audio & Panning
	 */
	public renderSpatialAudioSection(container: HTMLElement): void {
		// Core spatial audio settings
		const spatialCardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderSpatialAudioCard(spatialCardContainer);

		// Hybrid mode weights (conditionally rendered when hybrid mode is selected)
		const hybridCardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderHybridModeWeightsCard(hybridCardContainer);

		// Folder-based panning (conditionally rendered when spatial audio is enabled)
		const folderCardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderFolderPanningCard(folderCardContainer);

		// Cluster-based panning (conditionally rendered when spatial audio is enabled)
		const clusterCardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderClusterPanningCard(clusterCardContainer);

		// Advanced spatial settings (conditionally rendered when spatial audio is enabled)
		const advancedCardContainer = container.createDiv({ cls: 'osp-settings-card-container' });
		this.renderAdvancedSpatialCard(advancedCardContainer);
	}

	private renderSpatialAudioCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		const card = new MaterialCard({
			title: 'Spatial audio and panning',
			iconName: 'radio',
			subtitle: 'Position sounds in stereo space',
			elevation: 1
		});

		const content = card.getContent();

		// Enable toggle
		new Setting(content)
			.setName('Enable spatial audio')
			.setDesc('Position sounds in stereo space based on node position')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.spatialAudio?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.spatialAudio) {
						this.plugin.settings.spatialAudio = {
							enabled: value,
							mode: PanningMode.Hybrid,
							graphPositionSettings: {
								curve: PanningCurve.Sigmoid,
								intensity: 0.7,
								smoothingFactor: 0.5,
								updateThrottleMs: 100
							},
							folderSettings: {
								enabled: true,
								customMappings: [],
								autoDetectTopLevel: true,
								spreadFactor: 0.3
							},
							clusterSettings: {
								enabled: true,
								useCentroid: true,
								individualSpread: 0.2,
								clusterSeparation: 0.5
							},
							hybridWeights: {
								graphPosition: 0.5,
								folderBased: 0.3,
								clusterBased: 0.2
							},
							advanced: {
								enableDepthMapping: false,
								depthInfluence: 0.3,
								boundaryPadding: 0.1,
								velocityDamping: true,
								dampingFactor: 0.7
							}
						};
					} else {
						this.plugin.settings.spatialAudio.enabled = value;
					}
					await this.plugin.saveSettings();
					logger.info('advanced-settings', `Spatial audio: ${value}`);

					// Re-render only this card
					this.renderSpatialAudioCard(cardContainer);
				})
			);

		// Show controls if enabled
		if (this.plugin.settings.spatialAudio?.enabled) {
			// Panning mode
			new Setting(content)
				.setName('Panning mode')
				.setDesc('How node positions map to stereo panning')
				.addDropdown(dropdown => dropdown
					.addOption('geometric', 'Geometric - Based on X position')
					.addOption('cluster-based', 'Cluster-Based - By cluster')
					.addOption('folder-based', 'Folder-Based - By folder')
					.addOption('hybrid', 'Hybrid - Combined approach')
					.setValue(this.plugin.settings.spatialAudio?.mode || 'hybrid')
					.onChange(async (value: string) => {
						if (this.plugin.settings.spatialAudio) {
							this.plugin.settings.spatialAudio.mode = value as import('../../audio/spatial/types').PanningMode;
							await this.plugin.saveSettings();

							// Re-render spatial audio section to show/hide hybrid weights card
							const container = cardContainer.parentElement;
							if (container) {
								container.empty();
								this.renderSpatialAudioSection(container);
							}
						}
					})
				);

			// Pan intensity
			new Setting(content)
				.setName('Pan intensity')
				.setDesc('How extreme panning can be (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.spatialAudio?.graphPositionSettings.intensity || 0.7)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.spatialAudio?.graphPositionSettings) {
							this.plugin.settings.spatialAudio.graphPositionSettings.intensity = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Smoothing factor
			new Setting(content)
				.setName('Smoothing factor')
				.setDesc('Smooths position changes (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.spatialAudio?.graphPositionSettings.smoothingFactor || 0.5)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.spatialAudio?.graphPositionSettings) {
							this.plugin.settings.spatialAudio.graphPositionSettings.smoothingFactor = value;
							await this.plugin.saveSettings();
						}
					})
				);

			// Panning curve
			new Setting(content)
				.setName('Panning curve')
				.setDesc('Curve type for position-to-pan mapping')
				.addDropdown(dropdown => dropdown
					.addOption(PanningCurve.Linear, 'Linear - Direct proportion')
					.addOption(PanningCurve.Exponential, 'Exponential - Emphasize extremes')
					.addOption(PanningCurve.Sigmoid, 'Sigmoid - Smooth S-curve')
					.addOption(PanningCurve.Logarithmic, 'Logarithmic - Compress extremes')
					.setValue(this.plugin.settings.spatialAudio?.graphPositionSettings.curve || PanningCurve.Sigmoid)
					.onChange(async (value) => {
						if (this.plugin.settings.spatialAudio?.graphPositionSettings) {
							this.plugin.settings.spatialAudio.graphPositionSettings.curve = value as PanningCurve;
							await this.plugin.saveSettings();
						}
					})
				);

			// Update throttle
			new Setting(content)
				.setName('Update throttle')
				.setDesc('Minimum milliseconds between position updates (lower = more responsive, higher = better performance)')
				.addSlider(slider => slider
					.setLimits(16, 500, 16)
					.setValue(this.plugin.settings.spatialAudio?.graphPositionSettings.updateThrottleMs || 100)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.spatialAudio?.graphPositionSettings) {
							this.plugin.settings.spatialAudio.graphPositionSettings.updateThrottleMs = value;
							await this.plugin.saveSettings();
						}
					})
				);
		}

		cardContainer.appendChild(card.getElement());
	}

	/**
	 * Folder-Based Panning Card
	 */
	private renderFolderPanningCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		// Only render if spatial audio is enabled
		if (!this.plugin.settings.spatialAudio?.enabled) {
			return;
		}

		const card = new MaterialCard({
			title: 'Folder-based panning',
			iconName: 'folder',
			subtitle: 'Pan sounds based on vault folder structure',
			elevation: 1
		});

		const content = card.getContent();

		new Setting(content)
			.setName('Enable folder panning')
			.setDesc('Use folder structure to determine pan positions')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.spatialAudio?.folderSettings?.enabled ?? true)
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.folderSettings) {
						this.plugin.settings.spatialAudio.folderSettings.enabled = value;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(content)
			.setName('Auto-detect top folders')
			.setDesc('Automatically assign pan positions to top-level folders')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.spatialAudio?.folderSettings?.autoDetectTopLevel ?? true)
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.folderSettings) {
						this.plugin.settings.spatialAudio.folderSettings.autoDetectTopLevel = value;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(content)
			.setName('Folder spread')
			.setDesc('How much nested files vary from folder pan (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.spatialAudio?.folderSettings?.spreadFactor || 0.3)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.folderSettings) {
						this.plugin.settings.spatialAudio.folderSettings.spreadFactor = value;
						await this.plugin.saveSettings();
					}
				})
			);

		cardContainer.appendChild(card.getElement());
	}

	/**
	 * Cluster-Based Panning Card
	 */
	private renderClusterPanningCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		// Only render if spatial audio is enabled
		if (!this.plugin.settings.spatialAudio?.enabled) {
			return;
		}

		const card = new MaterialCard({
			title: 'Cluster-based panning',
			iconName: 'network',
			subtitle: 'Pan sounds based on cluster positions',
			elevation: 1
		});

		const content = card.getContent();

		new Setting(content)
			.setName('Enable cluster panning')
			.setDesc('Use cluster positions for panning')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.spatialAudio?.clusterSettings?.enabled ?? true)
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.clusterSettings) {
						this.plugin.settings.spatialAudio.clusterSettings.enabled = value;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(content)
			.setName('Use cluster centroid')
			.setDesc('Pan based on cluster center position')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.spatialAudio?.clusterSettings?.useCentroid ?? true)
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.clusterSettings) {
						this.plugin.settings.spatialAudio.clusterSettings.useCentroid = value;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(content)
			.setName('Individual spread')
			.setDesc('How much nodes vary within cluster (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.spatialAudio?.clusterSettings?.individualSpread || 0.2)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.clusterSettings) {
						this.plugin.settings.spatialAudio.clusterSettings.individualSpread = value;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(content)
			.setName('Cluster separation')
			.setDesc('Force clusters to different pan positions (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.spatialAudio?.clusterSettings?.clusterSeparation || 0.5)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.clusterSettings) {
						this.plugin.settings.spatialAudio.clusterSettings.clusterSeparation = value;
						await this.plugin.saveSettings();
					}
				})
			);

		cardContainer.appendChild(card.getElement());
	}

	/**
	 * Advanced Spatial Settings Card
	 */
	private renderAdvancedSpatialCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		// Only render if spatial audio is enabled
		if (!this.plugin.settings.spatialAudio?.enabled) {
			return;
		}

		const card = new MaterialCard({
			title: 'Advanced spatial settings',
			iconName: 'settings',
			subtitle: 'Fine-tune spatial audio behavior',
			elevation: 1
		});

		const content = card.getContent();

		new Setting(content)
			.setName('Enable depth mapping')
			.setDesc('Use Y-axis position for future surround sound support')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.spatialAudio?.advanced?.enableDepthMapping ?? false)
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.advanced) {
						this.plugin.settings.spatialAudio.advanced.enableDepthMapping = value;
						await this.plugin.saveSettings();

						// Re-render to show/hide depth influence slider
						const container = cardContainer.parentElement;
						if (container) {
							container.empty();
							this.renderSpatialAudioSection(container);
						}
					}
				})
			);

		// Show depth influence only if depth mapping is enabled
		if (this.plugin.settings.spatialAudio?.advanced?.enableDepthMapping) {
			new Setting(content)
				.setName('Depth influence')
				.setDesc('How much depth affects volume (0-1)')
				.addSlider(slider => slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.spatialAudio?.advanced?.depthInfluence || 0.3)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.spatialAudio?.advanced) {
							this.plugin.settings.spatialAudio.advanced.depthInfluence = value;
							await this.plugin.saveSettings();
						}
					})
				);
		}

		new Setting(content)
			.setName('Velocity damping')
			.setDesc('Smooth rapid position changes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.spatialAudio?.advanced?.velocityDamping ?? true)
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.advanced) {
						this.plugin.settings.spatialAudio.advanced.velocityDamping = value;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(content)
			.setName('Damping strength')
			.setDesc('How much to damp rapid changes (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.spatialAudio?.advanced?.dampingFactor || 0.7)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.advanced) {
						this.plugin.settings.spatialAudio.advanced.dampingFactor = value;
						await this.plugin.saveSettings();
					}
				})
			);

		new Setting(content)
			.setName('Boundary padding')
			.setDesc('Keep sounds away from extreme pan positions (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.05)
				.setValue(this.plugin.settings.spatialAudio?.advanced?.boundaryPadding || 0.1)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.advanced) {
						this.plugin.settings.spatialAudio.advanced.boundaryPadding = value;
						await this.plugin.saveSettings();
					}
				})
			);

		cardContainer.appendChild(card.getElement());
	}

	/**
	 * Hybrid Mode Weights Card - Conditionally rendered when hybrid panning mode is selected
	 */
	private renderHybridModeWeightsCard(cardContainer: HTMLElement): void {
		cardContainer.empty();

		// Only render if spatial audio is enabled and mode is hybrid
		if (!this.plugin.settings.spatialAudio?.enabled ||
		    this.plugin.settings.spatialAudio?.mode !== PanningMode.Hybrid) {
			return;
		}

		const card = new MaterialCard({
			title: 'Hybrid mode weights',
			iconName: 'sliders',
			subtitle: 'Balance between different panning strategies',
			elevation: 1
		});

		const content = card.getContent();

		// Description
		content.createEl('p', {
			text: 'Adjust how much each panning strategy contributes to the final pan position. Values should sum to approximately 1.0 for best results.',
			cls: 'osp-settings-description'
		});

		// Graph position weight
		new Setting(content)
			.setName('Graph position weight')
			.setDesc('Weight for X-position based panning (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.spatialAudio?.hybridWeights?.graphPosition || 0.5)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.hybridWeights) {
						this.plugin.settings.spatialAudio.hybridWeights.graphPosition = value;
						await this.plugin.saveSettings();
					}
				})
			);

		// Folder weight
		new Setting(content)
			.setName('Folder weight')
			.setDesc('Weight for folder-based panning (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.spatialAudio?.hybridWeights?.folderBased || 0.3)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.hybridWeights) {
						this.plugin.settings.spatialAudio.hybridWeights.folderBased = value;
						await this.plugin.saveSettings();
					}
				})
			);

		// Cluster weight
		new Setting(content)
			.setName('Cluster weight')
			.setDesc('Weight for cluster-based panning (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.spatialAudio?.hybridWeights?.clusterBased || 0.2)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.spatialAudio?.hybridWeights) {
						this.plugin.settings.spatialAudio.hybridWeights.clusterBased = value;
						await this.plugin.saveSettings();
					}
				})
			);

		// Weight sum indicator (helpful for users)
		const weightsSum = (this.plugin.settings.spatialAudio?.hybridWeights?.graphPosition || 0) +
		                   (this.plugin.settings.spatialAudio?.hybridWeights?.folderBased || 0) +
		                   (this.plugin.settings.spatialAudio?.hybridWeights?.clusterBased || 0);

		const sumIndicator = content.createDiv({ cls: 'osp-settings-info' });
		sumIndicator.createEl('strong', { text: 'Total weight: ' });
		sumIndicator.createEl('span', {
			text: weightsSum.toFixed(2),
			cls: weightsSum >= 0.9 && weightsSum <= 1.1 ? 'osp-text-success' : 'osp-text-warning'
		});
		sumIndicator.createEl('span', {
			text: ' (recommended: ~1.0)',
			cls: 'osp-text-muted'
		});

		cardContainer.appendChild(card.getElement());
	}
}