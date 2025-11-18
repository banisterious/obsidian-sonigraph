/**
 * Local Soundscape settings
 *
 * Comprehensive audio configuration settings for Local Soundscape feature.
 * Contains: Auto-play, Musical key, Context-aware modifiers, and Musical enhancements.
 *
 * This consolidates settings previously scattered across view sidebar and Control Center.
 */

import { App, Setting } from 'obsidian';
import type SonigraphPlugin from '../../main';
import { MaterialCard } from '../material-components';
import { getLogger } from '../../logging';

const logger = getLogger('LocalSoundscapeSettings');

export class LocalSoundscapeSettings {
	private app: App;
	private plugin: SonigraphPlugin;

	constructor(app: App, plugin: SonigraphPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Render all Local Soundscape audio settings sections
	 */
	public render(container: HTMLElement): void {
		void logger.debug('ls-settings', 'Rendering Local Soundscape settings');

		// Clear container to prevent duplicates on re-render
		void container.empty();

		// Section 1: Auto-play settings
		void this.renderAutoPlaySettings(container);

		// Section 2: Musical key selection
		void this.renderMusicalKeySettings(container);

		// Section 3: Context-aware modifiers
		void this.renderContextAwareSettings(container);

		// Section 4: Musical enhancements (Phase 2/3)
		void this.renderMusicalEnhancementsSettings(container);
	}

	/**
	 * Section 1: Auto-play settings
	 */
	private renderAutoPlaySettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Playback settings',
			iconName: 'play',
			subtitle: 'Control playback mode and automatic behavior',
			elevation: 1
		});

		const content = card.getContent();

		// Playback mode selection
		new Setting(content)
			.setName('Playback mode')
			.setDesc('Choose audio generation approach')
			.addDropdown(dropdown => dropdown
				.addOption('note-centric', 'Note-centric (rich single-note sonification)')
				.addOption('graph-centric', 'Graph-centric (traditional multi-node approach)')
				.setValue(this.plugin.settings.localSoundscape?.playbackMode || 'note-centric')
				.onChange(async (value: 'graph-centric' | 'note-centric') => {
					if (!this.plugin.settings.localSoundscape) {
						this.plugin.settings.localSoundscape = {};
					}
					this.plugin.settings.localSoundscape.playbackMode = value;
					await this.plugin.saveSettings();
					logger.info('playback-mode', `Playback mode: ${value}`);
				})
			);

		// Add description of each mode
		const modeDesc = content.createDiv({ cls: 'osp-settings-description' });
		modeDesc.setCssProps({
			marginBottom: '1rem',
			padding: '8px 12px',
			backgroundColor: 'var(--background-secondary)',
			borderRadius: '4px',
			fontSize: '12px',
			lineHeight: '1.5'
		});
		modeDesc.createEl('strong', { text: 'Note-centric' });
		modeDesc.appendText(' (recommended): Generates rich musical phrases from the center note\'s prose structure. Creates compelling audio even for isolated notes with zero connections. Connected nodes add optional embellishments.');
		void modeDesc.createEl('br');
		void modeDesc.createEl('br');
		modeDesc.createEl('strong', { text: 'Graph-centric' });
		modeDesc.appendText(' (traditional): Maps each connected node to individual notes. Requires multiple connections for interesting audio. Best for dense, well-connected graphs.');

		// Add visual separator
		content.createEl('hr', { cls: 'osp-settings-separator' });

		// Auto-play when opening toggle
		new Setting(content)
			.setName('Auto-play when opening')
			.setDesc('Automatically start playback when opening Local Soundscape view')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.localSoundscape?.autoPlay || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.localSoundscape) {
						this.plugin.settings.localSoundscape = {};
					}
					this.plugin.settings.localSoundscape.autoPlay = value;
					await this.plugin.saveSettings();
					logger.info('auto-play', `Auto-play on open: ${value}`);
				})
			);

		// Auto-play active note toggle
		new Setting(content)
			.setName('Auto-play active note')
			.setDesc('Automatically play the currently active note when it changes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.localSoundscape?.autoPlayActiveNote || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.localSoundscape) {
						this.plugin.settings.localSoundscape = {};
					}
					this.plugin.settings.localSoundscape.autoPlayActiveNote = value;
					await this.plugin.saveSettings();
					logger.info('auto-play', `Auto-play active note: ${value}`);
				})
			);

		container.appendChild(card.getElement());
	}

	/**
	 * Section 2: Musical key selection
	 */
	private renderMusicalKeySettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Musical key selection',
			iconName: 'music',
			subtitle: 'Determine the musical key based on note context',
			elevation: 1
		});

		const content = card.getContent();

		// Initialize keySelection if it doesn't exist
		if (!this.plugin.settings.localSoundscape?.keySelection) {
			if (!this.plugin.settings.localSoundscape) {
				this.plugin.settings.localSoundscape = {};
			}
			this.plugin.settings.localSoundscape.keySelection = {
				mode: 'vault-name',
				folderDepth: 1,
				customKey: 'C'
			};
		}

		const keySelection = this.plugin.settings.localSoundscape.keySelection;

		// Key based on dropdown
		new Setting(content)
			.setName('Key based on')
			.setDesc('How to determine the musical key for the soundscape')
			.addDropdown(dropdown => dropdown
				.addOption('vault-name', 'Vault name')
				.addOption('root-folder', 'Root folder')
				.addOption('folder-path', 'Folder path')
				.addOption('full-path', 'Full path')
				.addOption('file-name', 'File name')
				.addOption('custom', 'Custom key')
				.setValue(keySelection.mode || 'vault-name')
				.onChange(async (value) => {
					keySelection.mode = value as 'vault-name' | 'root-folder' | 'folder-path' | 'full-path' | 'file-name' | 'custom';
					await this.plugin.saveSettings();
					logger.info('key-selection', `Key mode: ${value}`);

					// Re-render to show/hide conditional settings
					void this.render(container);
				})
			);

		// Folder depth slider (conditional - only shown for folder-path mode)
		if (keySelection.mode === 'folder-path') {
			new Setting(content)
				.setName('Folder depth')
				.setDesc('Which level of folder to use for key selection')
				.addSlider(slider => slider
					.setLimits(1, 5, 1)
					.setValue(keySelection.folderDepth || 1)
					.setDynamicTooltip()
					.onChange(async (value) => {
						keySelection.folderDepth = value;
						await this.plugin.saveSettings();
						logger.info('key-selection', `Folder depth: ${value}`);
					})
				);
		}

		// Custom key dropdown (conditional - only shown for custom mode)
		if (keySelection.mode === 'custom') {
			new Setting(content)
				.setName('Custom key')
				.setDesc('Select a specific musical key')
				.addDropdown(dropdown => {
					// Add all 12 chromatic keys
					const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
					keys.forEach(key => void dropdown.addOption(key, key));

					return dropdown
						.setValue(keySelection.customKey || 'C')
						.onChange(async (value) => {
							keySelection.customKey = value;
							await this.plugin.saveSettings();
							logger.info('key-selection', `Custom key: ${value}`);
						});
				});
		}

		// Current key display (read-only info)
		const currentKeyDesc = content.createEl('div', {
			cls: 'setting-item-description',
			text: `Current key will be determined dynamically based on the active note's ${keySelection.mode}.`
		});
		currentKeyDesc.setCssProps({
			marginTop: '10px',
			fontStyle: 'italic',
			opacity: '0.7'
		});

		container.appendChild(card.getElement());
	}

	/**
	 * Section 3: Context-aware modifiers
	 */
	private renderContextAwareSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Context-aware audio modifiers',
			iconName: 'sliders-horizontal',
			subtitle: 'Modify audio based on time, weather, season, and theme',
			elevation: 1
		});

		const content = card.getContent();

		// Initialize contextAware if it doesn't exist
		if (!this.plugin.settings.localSoundscape?.contextAware) {
			if (!this.plugin.settings.localSoundscape) {
				this.plugin.settings.localSoundscape = {};
			}
			this.plugin.settings.localSoundscape.contextAware = {
				enabled: false,
				mode: 'influenced',
				influenceWeight: 0.3,
				season: true,
				timeOfDay: true,
				weather: false,
				theme: false
			};
		}

		const contextAware = this.plugin.settings.localSoundscape.contextAware;

		// Enable context-aware toggle
		new Setting(content)
			.setName('Enable context-aware audio')
			.setDesc('Modify audio parameters based on contextual factors')
			.addToggle(toggle => toggle
				.setValue(contextAware.enabled || false)
				.onChange(async (value) => {
					contextAware.enabled = value;
					await this.plugin.saveSettings();
					logger.info('context-aware', `Enabled: ${value}`);

					// Re-render to show/hide sub-settings
					void this.render(container);
				})
			);

		// Show additional settings only if enabled
		if (contextAware.enabled) {
			// Context mode dropdown
			new Setting(content)
				.setName('Context mode')
				.setDesc('How contextual factors affect audio')
				.addDropdown(dropdown => dropdown
					.addOption('influenced', 'Influenced - blend with base values')
					.addOption('only', 'Only - use context exclusively')
					.setValue(contextAware.mode || 'influenced')
					.onChange(async (value) => {
						contextAware.mode = value as 'influenced' | 'only';
						await this.plugin.saveSettings();
						logger.info('context-aware', `Mode: ${value}`);
					})
				);

			// Influence weight slider (only shown in 'influenced' mode)
			if (contextAware.mode === 'influenced') {
				new Setting(content)
					.setName('Influence weight')
					.setDesc('How much context affects the audio (0% = ignore, 100% = dominant)')
					.addSlider(slider => slider
						.setLimits(0, 100, 5)
						.setValue((contextAware.influenceWeight || 0.3) * 100)
						.setDynamicTooltip()
						.onChange(async (value) => {
							contextAware.influenceWeight = value / 100;
							await this.plugin.saveSettings();
							logger.info('context-aware', `Influence weight: ${value}%`);
						})
					);
			}

			// Individual context factor toggles
			new Setting(content)
				.setName('Season influence')
				.setDesc('Modify audio based on current season')
				.addToggle(toggle => toggle
					.setValue(contextAware.season !== false)
					.onChange(async (value) => {
						contextAware.season = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Season: ${value}`);
					})
				);

			new Setting(content)
				.setName('Time of day influence')
				.setDesc('Modify audio based on current time (morning/day/evening/night)')
				.addToggle(toggle => toggle
					.setValue(contextAware.timeOfDay !== false)
					.onChange(async (value) => {
						contextAware.timeOfDay = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Time of day: ${value}`);
					})
				);

			new Setting(content)
				.setName('Weather influence')
				.setDesc('Modify audio based on weather conditions (requires external data)')
				.addToggle(toggle => toggle
					.setValue(contextAware.weather || false)
					.onChange(async (value) => {
						contextAware.weather = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Weather: ${value}`);
					})
				);

			new Setting(content)
				.setName('Theme influence')
				.setDesc('Modify audio based on Obsidian theme (light/dark)')
				.addToggle(toggle => toggle
					.setValue(contextAware.theme || false)
					.onChange(async (value) => {
						contextAware.theme = value;
						await this.plugin.saveSettings();
						logger.info('context-aware', `Theme: ${value}`);
					})
				);

			// Add visual separator before prose structure
			content.createEl('hr', { cls: 'osp-settings-separator' });

			// Prose structure header
			const proseHeader = content.createEl('h4');
			proseHeader.setCssProps({
				marginTop: 'var(--size-4-4)',
				marginBottom: 'var(--size-4-2)',
				fontSize: 'var(--font-ui-medium)',
				fontWeight: '600'
			});
			proseHeader.textContent = 'Prose structure analysis';

			const proseDesc = content.createEl('p');
			proseDesc.setCssProps({
				color: 'var(--text-muted)',
				fontSize: 'var(--font-ui-small)',
				marginBottom: 'var(--size-4-3)'
			});
			proseDesc.textContent = 'Analyze note content (density, structure, linguistic features) to create more expressive, content-aware soundscapes.';

			// Prose structure toggle
			new Setting(content)
				.setName('Enable prose analysis')
				.setDesc('Analyze content structure to modulate musical parameters')
				.addToggle(toggle => toggle
					.setValue(contextAware.proseStructure?.enabled || false)
					.onChange(async (value) => {
						if (!contextAware.proseStructure) {
							contextAware.proseStructure = {
								enabled: value,
								sensitivity: 0.5,
								affectPitch: true,
								affectDuration: true,
								affectVelocity: true,
								affectTimbre: false
							};
						} else {
							contextAware.proseStructure.enabled = value;
						}
						await this.plugin.saveSettings();
						logger.info('context-aware', `Prose structure: ${value}`);

						// Re-render to show/hide sub-settings
						void this.render(container);
					})
				);

			// Prose structure sub-settings (only shown when enabled)
			if (contextAware.proseStructure?.enabled) {
				// Sensitivity slider
				new Setting(content)
					.setName('Analysis sensitivity')
					.setDesc('How strongly prose structure affects audio (0% = minimal, 100% = strong)')
					.addSlider(slider => slider
						.setLimits(0, 100, 5)
						.setValue((contextAware.proseStructure?.sensitivity || 0.5) * 100)
						.setDynamicTooltip()
						.onChange(async (value) => {
							if (contextAware.proseStructure) {
								contextAware.proseStructure.sensitivity = value / 100;
							}
							await this.plugin.saveSettings();
							logger.info('context-aware', `Prose sensitivity: ${value}%`);
						})
					);

				// Parameter toggles
				new Setting(content)
					.setName('Affect pitch range')
					.setDesc('Content complexity modulates pitch range width')
					.addToggle(toggle => toggle
						.setValue(contextAware.proseStructure?.affectPitch !== false)
						.onChange(async (value) => {
							if (contextAware.proseStructure) {
								contextAware.proseStructure.affectPitch = value;
							}
							await this.plugin.saveSettings();
							logger.info('context-aware', `Prose affect pitch: ${value}`);
						})
					);

				new Setting(content)
					.setName('Affect note duration')
					.setDesc('Prose density modulates note lengths (dense = longer)')
					.addToggle(toggle => toggle
						.setValue(contextAware.proseStructure?.affectDuration !== false)
						.onChange(async (value) => {
							if (contextAware.proseStructure) {
								contextAware.proseStructure.affectDuration = value;
							}
							await this.plugin.saveSettings();
							logger.info('context-aware', `Prose affect duration: ${value}`);
						})
					);

				new Setting(content)
					.setName('Affect velocity')
					.setDesc('Content expressiveness modulates note dynamics')
					.addToggle(toggle => toggle
						.setValue(contextAware.proseStructure?.affectVelocity !== false)
						.onChange(async (value) => {
							if (contextAware.proseStructure) {
								contextAware.proseStructure.affectVelocity = value;
							}
							await this.plugin.saveSettings();
							logger.info('context-aware', `Prose affect velocity: ${value}`);
						})
					);

				new Setting(content)
					.setName('Affect timbre')
					.setDesc('Content type influences instrument selection preference')
					.addToggle(toggle => toggle
						.setValue(contextAware.proseStructure?.affectTimbre || false)
						.onChange(async (value) => {
							if (contextAware.proseStructure) {
								contextAware.proseStructure.affectTimbre = value;
							}
							await this.plugin.saveSettings();
							logger.info('context-aware', `Prose affect timbre: ${value}`);
						})
					);
			}
		}

		container.appendChild(card.getElement());
	}

	/**
	 * Section 4: Musical enhancements (Phase 2/3)
	 * Scale quantization, chord voicing, adaptive pitch, rhythmic patterns
	 */
	private renderMusicalEnhancementsSettings(container: HTMLElement): void {
		const card = new MaterialCard({
			title: 'Musical enhancements',
			iconName: 'music-2',
			subtitle: 'Advanced musical features for richer soundscapes',
			elevation: 1
		});

		const content = card.getContent();

		// Initialize musicalEnhancements if it doesn't exist
		if (!this.plugin.settings.localSoundscape?.musicalEnhancements) {
			if (!this.plugin.settings.localSoundscape) {
				this.plugin.settings.localSoundscape = {};
			}
			this.plugin.settings.localSoundscape.musicalEnhancements = {
				scaleQuantization: {
					enabled: false,
					rootNote: 'C',
					scale: 'major',
					quantizationStrength: 0.8
				},
				adaptivePitch: {
					enabled: false
				},
				chordVoicing: {
					enabled: false,
					voicingDensity: 0.5
				},
				rhythmicPatterns: {
					enabled: false,
					tempo: 60
				},
				tensionTracking: {
					enabled: false,
					arcShape: 'rise-fall',
					peakPosition: 0.6
				},
				dynamicPanning: {
					enabled: false,
					smoothingFactor: 0.3,
					animationSpeed: 2.0
				},
				turnTaking: {
					enabled: false,
					pattern: 'call-response',
					turnLength: 4,
					accompanimentReduction: 0.4
				}
			};
		}

		const enhancements = this.plugin.settings.localSoundscape.musicalEnhancements;

		// Scale Quantization toggle
		new Setting(content)
			.setName('Scale quantization')
			.setDesc('Constrain pitches to musical scales for harmonic consonance')
			.addToggle(toggle => toggle
				.setValue(enhancements.scaleQuantization?.enabled || false)
				.onChange(async (value) => {
					enhancements.scaleQuantization = enhancements.scaleQuantization || {
						rootNote: 'C',
						scale: 'major',
						quantizationStrength: 0.8
					};
					enhancements.scaleQuantization.enabled = value;
					await this.plugin.saveSettings();
					logger.info('musical-enhancements', `Scale quantization: ${value}`);

					// Re-render to show/hide sub-settings
					void this.render(container);
				})
			);

		// Show scale settings only if quantization enabled
		if (enhancements.scaleQuantization?.enabled) {
			// Root note selector
			new Setting(content)
				.setName('Root note')
				.setDesc('The root note of the musical scale')
				.addDropdown(dropdown => {
					const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
					rootNotes.forEach(note => void dropdown.addOption(note, note));

					return dropdown
						.setValue(enhancements.scaleQuantization?.rootNote || 'C')
						.onChange(async (value) => {
							if (enhancements.scaleQuantization) {
								enhancements.scaleQuantization.rootNote = value as 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
							}
							await this.plugin.saveSettings();
							logger.info('musical-enhancements', `Root note: ${value}`);
						});
				});

			// Scale type selector
			new Setting(content)
				.setName('Scale type')
				.setDesc('The type of musical scale to use')
				.addDropdown(dropdown => {
					const scales = [
						{ value: 'major', label: 'Major (bright, happy)' },
						{ value: 'minor', label: 'Natural Minor (dark, melancholic)' },
						{ value: 'harmonic-minor', label: 'Harmonic Minor (exotic, dramatic)' },
						{ value: 'melodic-minor', label: 'Melodic Minor (bright minor)' },
						{ value: 'pentatonic-major', label: 'Pentatonic Major (simple, folk)' },
						{ value: 'pentatonic-minor', label: 'Pentatonic Minor (blues, rock)' },
						{ value: 'blues', label: 'Blues (blue notes)' },
						{ value: 'dorian', label: 'Dorian (jazz, modern)' },
						{ value: 'phrygian', label: 'Phrygian (Spanish, dark)' },
						{ value: 'lydian', label: 'Lydian (dreamy, floating)' },
						{ value: 'mixolydian', label: 'Mixolydian (folk, bluegrass)' }
					];

					scales.forEach(scale => void dropdown.addOption(scale.value, scale.label));

					return dropdown
						.setValue(enhancements.scaleQuantization?.scale || 'major')
						.onChange(async (value) => {
							if (enhancements.scaleQuantization) {
								enhancements.scaleQuantization.scale = value as 'major' | 'minor' | 'harmonic-minor' | 'melodic-minor' | 'pentatonic-major' | 'pentatonic-minor' | 'blues' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian';
							}
							await this.plugin.saveSettings();
							logger.info('musical-enhancements', `Scale type: ${value}`);
						});
				});

			// Quantization strength slider
			new Setting(content)
				.setName('Quantization strength')
				.setDesc('How strongly pitches are pulled to scale notes (0% = off, 100% = strict)')
				.addSlider(slider => slider
					.setLimits(0, 100, 5)
					.setValue((enhancements.scaleQuantization?.quantizationStrength || 0.8) * 100)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (enhancements.scaleQuantization) {
							enhancements.scaleQuantization.quantizationStrength = value / 100;
						}
						await this.plugin.saveSettings();
						logger.info('musical-enhancements', `Quantization strength: ${value}%`);
					})
				);
		}

		// Adaptive Pitch Ranges toggle
		new Setting(content)
			.setName('Adaptive pitch ranges')
			.setDesc('Pitch ranges adapt to selected key for better harmonic integration')
			.addToggle(toggle => toggle
				.setValue(enhancements.adaptivePitch?.enabled || false)
				.onChange(async (value) => {
					enhancements.adaptivePitch = enhancements.adaptivePitch || {};
					enhancements.adaptivePitch.enabled = value;
					await this.plugin.saveSettings();
					logger.info('musical-enhancements', `Adaptive pitch: ${value}`);
				})
			);

		// Chord Voicing toggle
		new Setting(content)
			.setName('Chord voicing')
			.setDesc('Add harmonic richness with depth-based polyphonic voicing')
			.addToggle(toggle => toggle
				.setValue(enhancements.chordVoicing?.enabled || false)
				.onChange(async (value) => {
					enhancements.chordVoicing = enhancements.chordVoicing || { voicingDensity: 0.5 };
					enhancements.chordVoicing.enabled = value;
					await this.plugin.saveSettings();
					logger.info('musical-enhancements', `Chord voicing: ${value}`);

					// Re-render to show/hide voicing density
					void this.render(container);
				})
			);

		// Voicing density slider (only shown when chord voicing enabled)
		if (enhancements.chordVoicing?.enabled) {
			new Setting(content)
				.setName('Voicing density')
				.setDesc('How many additional harmonic notes to add (0% = minimal, 100% = full)')
				.addSlider(slider => slider
					.setLimits(0, 100, 10)
					.setValue((enhancements.chordVoicing?.voicingDensity || 0.5) * 100)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (enhancements.chordVoicing) {
							enhancements.chordVoicing.voicingDensity = value / 100;
						}
						await this.plugin.saveSettings();
						logger.info('musical-enhancements', `Voicing density: ${value}%`);
					})
				);
		}

		// Rhythmic Patterns toggle
		new Setting(content)
			.setName('Rhythmic patterns')
			.setDesc('Organize note timing into musical patterns (arpeggio, pulse, etc.)')
			.addToggle(toggle => toggle
				.setValue(enhancements.rhythmicPatterns?.enabled || false)
				.onChange(async (value) => {
					enhancements.rhythmicPatterns = enhancements.rhythmicPatterns || { tempo: 60 };
					enhancements.rhythmicPatterns.enabled = value;
					await this.plugin.saveSettings();
					logger.info('musical-enhancements', `Rhythmic patterns: ${value}`);

					// Re-render to show/hide tempo
					void this.render(container);
				})
			);

		// Tempo slider (only shown when rhythmic patterns enabled)
		if (enhancements.rhythmicPatterns?.enabled) {
			new Setting(content)
				.setName('Tempo (BPM)')
				.setDesc('The tempo for rhythmic patterns in beats per minute')
				.addSlider(slider => slider
					.setLimits(40, 200, 5)
					.setValue(enhancements.rhythmicPatterns?.tempo || 60)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (enhancements.rhythmicPatterns) {
							enhancements.rhythmicPatterns.tempo = value;
						}
						await this.plugin.saveSettings();
						logger.info('musical-enhancements', `Tempo: ${value} BPM`);
					})
				);
		}

		// Tension Tracking toggle (Phase 3 - Planned)
		new Setting(content)
			.setName('Tension tracking')
			.setDesc('Create melodic arcs with tension and release for emotional narrative')
			.addToggle(toggle => toggle
				.setValue(enhancements.tensionTracking?.enabled || false)
				.onChange(async (value) => {
					enhancements.tensionTracking = enhancements.tensionTracking || {
						arcShape: 'rise-fall',
						peakPosition: 0.6
					};
					enhancements.tensionTracking.enabled = value;
					await this.plugin.saveSettings();
					logger.info('musical-enhancements', `Tension tracking: ${value}`);

					// Re-render to show/hide sub-settings
					void this.render(container);
				})
			);

		// Tension tracking sub-settings (only shown when enabled)
		if (enhancements.tensionTracking?.enabled) {
			// Arc shape selector
			new Setting(content)
				.setName('Arc shape')
				.setDesc('The emotional journey of the soundscape')
				.addDropdown(dropdown => {
					const shapes = [
						{ value: 'rise-fall', label: 'Rise-Fall (climax in middle)' },
						{ value: 'build', label: 'Build (increasing tension)' },
						{ value: 'release', label: 'Release (decreasing tension)' },
						{ value: 'wave', label: 'Wave (multiple peaks)' },
						{ value: 'plateau', label: 'Plateau (sustained tension)' }
					];

					shapes.forEach(shape => void dropdown.addOption(shape.value, shape.label));

					return dropdown
						.setValue(enhancements.tensionTracking?.arcShape || 'rise-fall')
						.onChange(async (value) => {
							if (enhancements.tensionTracking) {
								enhancements.tensionTracking.arcShape = value as 'rise-fall' | 'build' | 'release' | 'wave' | 'plateau';
							}
							await this.plugin.saveSettings();
							logger.info('musical-enhancements', `Arc shape: ${value}`);
						});
				});

			// Peak position slider (only for rise-fall and wave)
			if (enhancements.tensionTracking.arcShape === 'rise-fall' || enhancements.tensionTracking.arcShape === 'wave') {
				new Setting(content)
					.setName('Peak position')
					.setDesc('Where in the sequence the tension peaks (0% = start, 100% = end)')
					.addSlider(slider => slider
						.setLimits(0, 100, 5)
						.setValue((enhancements.tensionTracking?.peakPosition || 0.6) * 100)
						.setDynamicTooltip()
						.onChange(async (value) => {
							if (enhancements.tensionTracking) {
								enhancements.tensionTracking.peakPosition = value / 100;
							}
							await this.plugin.saveSettings();
							logger.info('musical-enhancements', `Peak position: ${value}%`);
						})
					);
			}
		}

		// Dynamic Panning toggle (Phase 3 - Planned)
		new Setting(content)
			.setName('Dynamic panning')
			.setDesc('Smooth spatial transitions for immersive stereo field')
			.addToggle(toggle => toggle
				.setValue(enhancements.dynamicPanning?.enabled || false)
				.onChange(async (value) => {
					enhancements.dynamicPanning = enhancements.dynamicPanning || {
						smoothingFactor: 0.3,
						animationSpeed: 2.0
					};
					enhancements.dynamicPanning.enabled = value;
					await this.plugin.saveSettings();
					logger.info('musical-enhancements', `Dynamic panning: ${value}`);

					// Re-render to show/hide sub-settings
					void this.render(container);
				})
			);

		// Dynamic panning sub-settings (only shown when enabled)
		if (enhancements.dynamicPanning?.enabled) {
			// Smoothing factor slider
			new Setting(content)
				.setName('Smoothing factor')
				.setDesc('How smoothly panning transitions occur (0% = instant, 100% = very gradual)')
				.addSlider(slider => slider
					.setLimits(0, 100, 5)
					.setValue((enhancements.dynamicPanning?.smoothingFactor || 0.3) * 100)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (enhancements.dynamicPanning) {
							enhancements.dynamicPanning.smoothingFactor = value / 100;
						}
						await this.plugin.saveSettings();
						logger.info('musical-enhancements', `Smoothing factor: ${value}%`);
					})
				);

			// Animation speed slider
			new Setting(content)
				.setName('Animation speed')
				.setDesc('How quickly the stereo field evolves (0.5x = slow, 5x = fast)')
				.addSlider(slider => slider
					.setLimits(0.5, 5.0, 0.5)
					.setValue(enhancements.dynamicPanning?.animationSpeed || 2.0)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (enhancements.dynamicPanning) {
							enhancements.dynamicPanning.animationSpeed = value;
						}
						await this.plugin.saveSettings();
						logger.info('musical-enhancements', `Animation speed: ${value}x`);
					})
				);
		}

		// Turn-Taking toggle (Phase 3 - Planned)
		new Setting(content)
			.setName('Turn-taking')
			.setDesc('Instrument dialogue patterns for textural clarity')
			.addToggle(toggle => toggle
				.setValue(enhancements.turnTaking?.enabled || false)
				.onChange(async (value) => {
					enhancements.turnTaking = enhancements.turnTaking || {
						pattern: 'call-response',
						turnLength: 4,
						accompanimentReduction: 0.4
					};
					enhancements.turnTaking.enabled = value;
					await this.plugin.saveSettings();
					logger.info('musical-enhancements', `Turn-taking: ${value}`);

					// Re-render to show/hide sub-settings
					void this.render(container);
				})
			);

		// Turn-taking sub-settings (only shown when enabled)
		if (enhancements.turnTaking?.enabled) {
			// Pattern selector
			new Setting(content)
				.setName('Turn-taking pattern')
				.setDesc('How instruments take turns')
				.addDropdown(dropdown => {
					const patterns = [
						{ value: 'none', label: 'None (all together)' },
						{ value: 'sequential', label: 'Sequential (one at a time)' },
						{ value: 'call-response', label: 'Call-Response (alternating groups)' },
						{ value: 'solos', label: 'Solos (featured instrument)' },
						{ value: 'layered-entry', label: 'Layered Entry (progressive build)' },
						{ value: 'conversation', label: 'Conversation (graph-based dialogue)' },
						{ value: 'fugue', label: 'Fugue (imitative entries)' },
						{ value: 'antiphonal', label: 'Antiphonal (stereo alternation)' }
					];

					patterns.forEach(pattern => void dropdown.addOption(pattern.value, pattern.label));

					return dropdown
						.setValue(enhancements.turnTaking?.pattern || 'call-response')
						.onChange(async (value) => {
							if (enhancements.turnTaking) {
								enhancements.turnTaking.pattern = value as 'none' | 'sequential' | 'call-response' | 'solos' | 'layered-entry' | 'conversation' | 'fugue' | 'antiphonal';
							}
							await this.plugin.saveSettings();
							logger.info('musical-enhancements', `Turn-taking pattern: ${value}`);
						});
				});

			// Turn length slider
			new Setting(content)
				.setName('Turn length')
				.setDesc('Duration of each turn in beats (2 = short phrases, 8 = long phrases)')
				.addSlider(slider => slider
					.setLimits(1, 16, 1)
					.setValue(enhancements.turnTaking?.turnLength || 4)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (enhancements.turnTaking) {
							enhancements.turnTaking.turnLength = value;
						}
						await this.plugin.saveSettings();
						logger.info('musical-enhancements', `Turn length: ${value} beats`);
					})
				);

			// Accompaniment reduction slider
			new Setting(content)
				.setName('Accompaniment reduction')
				.setDesc('How much to reduce non-featured instruments (0% = equal, 100% = silent)')
				.addSlider(slider => slider
					.setLimits(0, 100, 5)
					.setValue((enhancements.turnTaking?.accompanimentReduction || 0.4) * 100)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (enhancements.turnTaking) {
							enhancements.turnTaking.accompanimentReduction = value / 100;
						}
						await this.plugin.saveSettings();
						logger.info('musical-enhancements', `Accompaniment reduction: ${value}%`);
					})
				);
		}

		container.appendChild(card.getElement());
	}
}
