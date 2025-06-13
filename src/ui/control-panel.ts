import { App, Modal, Setting } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger } from '../logging';
import { createObsidianToggle } from './components';
import { HarmonicSettings } from '../audio/harmonic-engine';
import { EFFECT_PRESETS, ReverbSettings, ChorusSettings, FilterSettings, getSmartRanges, getParameterRange } from '../utils/constants';

const logger = getLogger('control-panel');

interface TabConfig {
	id: string;
	name: string;
	icon: string;
	description: string;
}

const TABS: TabConfig[] = [
	{ id: 'status', name: 'Status', icon: 'activity', description: 'Real-time system status and diagnostics' },
	{ id: 'instruments', name: 'Instruments', icon: 'piano', description: 'Manage voices and instrument assignments' },
	{ id: 'music', name: 'Musical', icon: 'music', description: 'Configure scales, tempo, and musical parameters' },
	{ id: 'harmony', name: 'Harmony', icon: 'sparkles', description: 'Advanced harmonic processing and chord settings' },
	{ id: 'effects', name: 'Effects', icon: 'headphones', description: 'Audio effects and spatial processing' }
];

export class ControlPanelModal extends Modal {
	plugin: SonigraphPlugin;
	private statusInterval: number | null = null;
	private activeTab: string = 'status';
	private tabContainer: HTMLElement;
	private contentContainer: HTMLElement;
	private instrumentToggles: Map<string, HTMLElement> = new Map();

	constructor(app: App, plugin: SonigraphPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		logger.debug('ui', 'Opening Audio Control Center');

		// Main modal container
		const modalContainer = contentEl.createDiv({ cls: 'sonigraph-modal-container' });

		// Header
		const header = modalContainer.createDiv({ cls: 'sonigraph-modal-header' });
		
		// Header text section
		const headerText = header.createDiv({ cls: 'sonigraph-modal-header-text' });
		headerText.createEl('h1', { text: 'Sonigraph Audio Control Center', cls: 'sonigraph-modal-title' });
		headerText.createEl('p', { text: 'Transform your knowledge graph into immersive soundscapes', cls: 'sonigraph-modal-subtitle' });
		
		// Quick playback controls in header
		const headerControls = header.createDiv({ cls: 'sonigraph-modal-header-controls' });
		this.createQuickPlaybackControls(headerControls);

		// Main content area with sidebar
		const mainContent = modalContainer.createDiv({ cls: 'sonigraph-modal-main' });

		// Sidebar with vertical tabs
		const sidebar = mainContent.createDiv({ cls: 'sonigraph-modal-sidebar' });
		this.tabContainer = sidebar.createDiv({ cls: 'sonigraph-tab-container' });

		// Content area
		this.contentContainer = mainContent.createDiv({ cls: 'sonigraph-modal-content' });

		// Create tabs
		this.createTabs();

		// Show initial tab
		this.showTab(this.activeTab);

		// Start status updates
		this.startStatusUpdates();
		

	}

	onClose() {
		logger.debug('ui', 'Closing Audio Control Center');
		this.stopStatusUpdates();
	}

	private createQuickPlaybackControls(container: HTMLElement): void {
		// Quick test button (positioned first/leftmost)
		const quickTestButton = container.createEl('button', {
			cls: 'sonigraph-quick-control-button',
			attr: { 'aria-label': 'Test Audio System' }
		});
		quickTestButton.innerHTML = this.getIconSvg('headphones');
		
		// Quick play button
		const quickPlayButton = container.createEl('button', {
			cls: 'sonigraph-quick-control-button',
			attr: { 'aria-label': 'Play Knowledge Graph' }
		});
		quickPlayButton.innerHTML = this.getIconSvg('play');
		
		// Quick stop button
		const quickStopButton = container.createEl('button', {
			cls: 'sonigraph-quick-control-button',
			attr: { 'aria-label': 'Stop Playback' }
		});
		quickStopButton.innerHTML = this.getIconSvg('stop');

		// Play button event handler
		quickPlayButton.addEventListener('click', async () => {
			try {
				quickPlayButton.disabled = true;
				quickPlayButton.addClass('is-loading');
				
				logger.info('user-action', 'Quick play button clicked');
				await this.plugin.processVault();
				await this.plugin.playSequence();
				
				quickPlayButton.removeClass('is-loading');
				quickPlayButton.addClass('is-playing');
				logger.info('debug', 'Quick playback started successfully');
				
			} catch (error) {
				logger.error('playback', 'Failed to start quick playback', error);
				quickPlayButton.disabled = false;
				quickPlayButton.removeClass('is-loading');
				this.showError(error.message);
			}
		});

		// Stop button event handler
		quickStopButton.addEventListener('click', () => {
			this.plugin.stopPlayback();
			quickPlayButton.disabled = false;
			quickPlayButton.removeClass('is-playing');
			logger.info('user-action', 'Quick stop button clicked');
		});

		// Test button event handler
		quickTestButton.addEventListener('click', async () => {
			try {
				logger.info('user-action', 'Quick test button clicked');
				if (this.plugin.audioEngine) {
					await this.plugin.audioEngine.playTestNote();
				}
			} catch (error) {
				this.showError('Audio test failed: ' + error.message);
			}
		});

		// Volume slider beneath the buttons
		const volumeContainer = container.createDiv({ cls: 'sonigraph-volume-slider-container' });
		const volumeLabel = volumeContainer.createEl('label', { text: 'Volume', cls: 'sonigraph-volume-label' });
		const volumeSlider = volumeContainer.createEl('input', { type: 'range', cls: 'sonigraph-volume-slider' }) as HTMLInputElement;
		volumeSlider.min = '0';
		volumeSlider.max = '100';
		volumeSlider.value = String(this.plugin.settings.volume);
		volumeSlider.step = '1';
		volumeSlider.style.width = '120px';
		volumeSlider.addEventListener('input', async (e) => {
			const value = Number((e.target as HTMLInputElement).value);
			this.plugin.settings.volume = value;
			await this.plugin.saveSettings();
			if (this.plugin.audioEngine) {
				this.plugin.audioEngine.updateVolume();
			}
		});
	}

	private createTabs(): void {
		TABS.forEach(tab => {
			const tabElement = this.tabContainer.createDiv({ 
				cls: `sonigraph-tab ${tab.id === this.activeTab ? 'active' : ''}`,
				attr: { 'data-tab': tab.id }
			});

			// Tab icon
			const icon = tabElement.createDiv({ cls: 'sonigraph-tab-icon' });
			icon.innerHTML = this.getIconSvg(tab.icon);

			// Tab content
			const content = tabElement.createDiv({ cls: 'sonigraph-tab-content' });
			content.createEl('div', { text: tab.name, cls: 'sonigraph-tab-name' });
			content.createEl('div', { text: tab.description, cls: 'sonigraph-tab-desc' });

			// Click handler
			tabElement.addEventListener('click', () => {
				this.setActiveTab(tab.id);
			});
		});
	}

	private setActiveTab(tabId: string): void {
		// Update tab appearance
		this.tabContainer.querySelectorAll('.sonigraph-tab').forEach(tab => {
			tab.removeClass('active');
		});
		this.tabContainer.querySelector(`[data-tab="${tabId}"]`)?.addClass('active');

		this.activeTab = tabId;
		this.showTab(tabId);
	}

	private showTab(tabId: string): void {
		this.contentContainer.empty();

		switch (tabId) {
			case 'instruments':
				this.createInstrumentsTab();
				break;
			case 'music':
				this.createMusicalTab();
				break;
			case 'harmony':
				this.createHarmonyTab();
				break;
			case 'effects':
				this.createEffectsTab();
				break;
			case 'status':
				this.createStatusTab();
				break;
		}
	}

	private createMusicalTab(): void {
		const section = this.createTabSection('Musical Parameters', 'Configure scales, tempo, and musical characteristics');

		// Scale and key settings
		const scaleGroup = this.createSettingsGroup(section, 'Scale & Key', 'Define the musical foundation');

		new Setting(scaleGroup)
			.setName('Musical Scale')
			.setDesc('The scale pattern used for pitch mapping')
			.addDropdown(dropdown => dropdown
				.addOption('major', 'Major (Happy, bright)')
				.addOption('minor', 'Minor (Melancholic, introspective)')
				.addOption('pentatonic', 'Pentatonic (Asian, simple)')
				.addOption('chromatic', 'Chromatic (All notes, complex)')
				.setValue(this.plugin.settings.scale)
				.onChange(async (value) => {
					this.plugin.settings.scale = value as any;
					await this.plugin.saveSettings();
					this.updateMusicalMapper();
				}));

		new Setting(scaleGroup)
			.setName('Root Note')
			.setDesc('The fundamental note that defines the key')
			.addDropdown(dropdown => {
				const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
				notes.forEach(note => dropdown.addOption(note, note));
				return dropdown
					.setValue(this.plugin.settings.rootNote)
					.onChange(async (value) => {
						this.plugin.settings.rootNote = value;
						await this.plugin.saveSettings();
						this.updateMusicalMapper();
					});
			});

		// Timing and dynamics
		const timingGroup = this.createSettingsGroup(section, 'Timing & Dynamics', 'Control rhythm and energy');

		new Setting(timingGroup)
			.setName('Tempo')
			.setDesc('Musical speed in beats per minute')
			.addSlider(slider => slider
				.setLimits(40, 200, 5)
				.setValue(this.plugin.settings.tempo)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.tempo = value;
					await this.plugin.saveSettings();
					this.updateMusicalMapper();
				}));

		new Setting(timingGroup)
			.setName('Master Volume')
			.setDesc('Overall audio output level')
			.addSlider(slider => slider
				.setLimits(0, 100, 1)
				.setValue(this.plugin.settings.volume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.volume = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				}));
	}

	private createInstrumentsTab(): void {
		const section = this.createTabSection('Instrument Configuration', 'Manage voices and instrument assignments');

		// Voice assignment strategy
		const assignmentGroup = this.createSettingsGroup(section, 'Voice Assignment Strategy', 'How instruments are chosen for notes');

		new Setting(assignmentGroup)
			.setName('Assignment Strategy')
			.setDesc('Method for assigning notes to instruments')
			.addDropdown(dropdown => {
				dropdown
					.addOption('frequency', 'Frequency-Based (Automatic)')
					.addOption('round-robin', 'Round-Robin (Cycling)')
					.addOption('connection-based', 'Connection-Based (Graph)')
					.setValue(this.plugin.settings.voiceAssignmentStrategy)
					.onChange(async (value: 'frequency' | 'round-robin' | 'connection-based') => {
						this.plugin.settings.voiceAssignmentStrategy = value;
						await this.plugin.saveSettings();
						this.updateAssignmentStrategyInfo();
					});
			});

		// Strategy description area
		const strategyInfo = assignmentGroup.createDiv({ 
			cls: 'sonigraph-strategy-info',
			attr: { id: 'sonigraph-strategy-info' }
		});
		this.updateAssignmentStrategyInfo();

		// Real-time voice activity monitor
		const activityGroup = this.createSettingsGroup(section, 'Live Voice Activity', 'Real-time instrument usage monitoring');
		const activityDisplay = activityGroup.createDiv({ cls: 'sonigraph-voice-activity' });

		// Updated for Phase 6A: All 13 instruments including new vocal sections
		['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone', 'soprano', 'alto', 'tenor', 'bass'].forEach(instrumentKey => {
			const info = this.getInstrumentInfo(instrumentKey);
			const activityRow = activityDisplay.createDiv({ cls: 'sonigraph-activity-row' });
			
			const label = activityRow.createDiv({ cls: 'sonigraph-activity-label' });
			label.createSpan({ text: info.icon, cls: 'sonigraph-activity-icon' });
			label.createSpan({ text: info.name, cls: 'sonigraph-activity-name' });
			
			const voices = activityRow.createDiv({ cls: 'sonigraph-activity-voices' });
			// Use different voice counts: 8 for original instruments, 4 for vocal sections
			const maxVoices = ['soprano', 'alto', 'tenor', 'bass'].includes(instrumentKey) ? 4 : 8;
			for (let i = 0; i < maxVoices; i++) {
				voices.createDiv({ 
					cls: 'sonigraph-voice-indicator',
					attr: { id: `voice-${instrumentKey}-${i}` }
				});
			}
			
			const count = activityRow.createDiv({ 
				cls: 'sonigraph-activity-count',
				text: `0/${maxVoices}`,
				attr: { id: `count-${instrumentKey}` }
			});
		});

		// Individual instrument controls
		const instrumentsGroup = this.createSettingsGroup(section, 'Individual Instrument Controls', 'Configure each instrument separately');

		// Updated for Phase 6A: All 13 instruments including new vocal sections
		['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone', 'soprano', 'alto', 'tenor', 'bass'].forEach(instrumentKey => {
			// Check if instrument exists in settings - skip if missing
			const instrumentSettings = this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments];
			if (!instrumentSettings) {
				console.warn(`Instrument ${instrumentKey} not found in settings - skipping`);
				return;
			}
			
			const info = this.getInstrumentInfo(instrumentKey);
			const instrumentContainer = instrumentsGroup.createDiv({ cls: 'sonigraph-instrument-control' });
			
			// Capture this reference for callbacks
			const self = this;
			
			// Header with icon and name
			const header = instrumentContainer.createDiv({ cls: 'sonigraph-instrument-header' });
			header.createSpan({ text: info.icon, cls: 'sonigraph-instrument-icon' });
			header.createSpan({ text: info.name, cls: 'sonigraph-instrument-name' });
			

			// Enable/disable toggle - each toggle gets its own updating flag
			const toggle = createObsidianToggle(
				instrumentContainer,
				instrumentSettings.enabled,
				async (value) => {
					console.log(`✓ Toggle ${instrumentKey} (${info.name}) changed to:`, value);
					console.log(`✓ Toggle UI state - checked: ${(toggle as HTMLInputElement).checked}, container classes:`, toggle.parentElement?.className);
					
					(self.plugin.settings.instruments as any)[instrumentKey].enabled = value;
					await self.plugin.saveSettings();
					await self.updateInstrumentState(instrumentKey, value);
					
					// Show/hide instrument controls based on enabled state
					controlsContainer.style.display = value ? 'block' : 'none';
					
					// Verify UI state after update
					console.log(`✓ After update - Toggle UI state - checked: ${(toggle as HTMLInputElement).checked}, container classes:`, toggle.parentElement?.className);
				},
				{
					name: `Enable ${info.name}`,
					description: info.description
				}
			);
			
			// Store reference for programmatic updates
			this.instrumentToggles.set(instrumentKey, toggle);
			console.log(`✓ Toggle created and stored for ${instrumentKey} (${info.name})`);
			
			// Add click handler to the entire toggle container for debugging
			instrumentContainer.addEventListener('click', (event) => {
				console.log(`Container clicked for ${instrumentKey} (${info.name}), target:`, event.target);
			});
			
			// Container for instrument controls (volume, voices, frequency info)
			const controlsContainer = instrumentContainer.createDiv({ cls: 'sonigraph-instrument-controls' });
			// Initially show/hide based on current enabled state
			controlsContainer.style.display = instrumentSettings.enabled ? 'block' : 'none';

			// Volume control
			new Setting(controlsContainer)
				.setName('Volume')
				.setDesc(`Individual volume for ${info.name.toLowerCase()} (0-100%)`)
				.addSlider(slider => slider
					.setLimits(0, 100, 5)
					.setValue(Math.round(instrumentSettings.volume * 100))
					.setDynamicTooltip()
					.onChange(async (value) => {
						(self.plugin.settings.instruments as any)[instrumentKey].volume = value / 100;
						await self.plugin.saveSettings();
						if (self.plugin.audioEngine) {
							self.plugin.audioEngine.updateInstrumentVolume(instrumentKey, value / 100);
						}
					}));

			// Max voices control
			new Setting(controlsContainer)
				.setName('Maximum Voices')
				.setDesc(`Voice limit for ${info.name.toLowerCase()} (1-16)`)
				.addSlider(slider => slider
					.setLimits(1, 16, 1)
					.setValue(instrumentSettings.maxVoices)
					.setDynamicTooltip()
					.onChange(async (value) => {
						(self.plugin.settings.instruments as any)[instrumentKey].maxVoices = value;
						await self.plugin.saveSettings();
						if (self.plugin.audioEngine) {
							self.plugin.audioEngine.updateInstrumentVoices(instrumentKey, value);
						}
					}));

			// Frequency range info (for frequency-based strategy)
			const rangeInfo = controlsContainer.createDiv({ cls: 'sonigraph-frequency-info' });
			rangeInfo.createEl('small', { 
				text: `Default range: ${info.defaultFrequencyRange}`,
				cls: 'sonigraph-frequency-range'
			});
		});
	}

	private updateAssignmentStrategyInfo(): void {
		const strategyInfo = document.getElementById('sonigraph-strategy-info');
		if (!strategyInfo) return;

		strategyInfo.empty();
		
		const strategy = this.plugin.settings.voiceAssignmentStrategy;
		const infoBox = strategyInfo.createDiv({ cls: 'sonigraph-info-box' });
		
		switch (strategy) {
			case 'frequency':
				infoBox.createEl('h4', { text: 'Frequency-Based Assignment (13 Instruments)' });
				infoBox.createEl('p', { text: 'Ultra High (>1600Hz) → 🎺 Flute (airy, crystalline)' });
				infoBox.createEl('p', { text: 'Very High (>1400Hz) → 🎹 Piano (crisp, percussive)' });
				infoBox.createEl('p', { text: 'High-Mid (800-1200Hz) → 👩‍🎤 Soprano, 🎵 Clarinet' });
				infoBox.createEl('p', { text: 'High (1000-1400Hz) → 🎤 Choir, 🎙️ Alto' });
				infoBox.createEl('p', { text: 'Mid-High (600-1000Hz) → 🌊 Vocal Pads, 🧑‍🎤 Tenor' });
				infoBox.createEl('p', { text: 'Medium (400-800Hz) → 🎛️ Organ (rich, sustained)' });
				infoBox.createEl('p', { text: 'Mid-Low (300-600Hz) → 🎷 Saxophone (expressive)' });
				infoBox.createEl('p', { text: 'Low-Med (200-400Hz) → 🎛️ Pad (ambient foundation)' });
				infoBox.createEl('p', { text: 'Low (100-200Hz) → 🎻 Strings (warm, flowing)' });
				infoBox.createEl('p', { text: 'Very Low (<100Hz) → 🎤 Bass (deep, resonant)' });
				break;
			case 'round-robin':
				infoBox.createEl('h4', { text: 'Round-Robin Assignment (13 Instruments)' });
				infoBox.createEl('p', { text: 'Cycles through all enabled instruments in order' });
				infoBox.createEl('p', { text: 'Ensures equal distribution across Piano, Organ, Strings, Choir, Vocal Pads, Pad, Flute, Clarinet, Saxophone, Soprano, Alto, Tenor, Bass' });
				break;
			case 'connection-based':
				infoBox.createEl('h4', { text: 'Connection-Based Assignment (13 Instruments)' });
				infoBox.createEl('p', { text: 'Highly connected nodes → Piano, Flute (prominent, percussive)' });
				infoBox.createEl('p', { text: 'Medium connections → Organ, Choir, Soprano, Alto (harmonic foundation)' });
				infoBox.createEl('p', { text: 'Low connections → Strings, Vocal Pads, Pad, Tenor, Bass (ambient, atmospheric)' });
				break;
		}
	}

	private async updateInstrumentState(instrumentKey: string, enabled: boolean): Promise<void> {
		if (this.plugin.audioEngine) {
			const status = this.plugin.audioEngine.getStatus();
			
			// Initialize audio engine if not already initialized
			if (!status.isInitialized) {
				try {
					await this.plugin.audioEngine.initialize();
				} catch (error) {
					console.error('Failed to initialize audio engine:', error);
					return;
				}
			}
			
			this.plugin.audioEngine.setInstrumentEnabled(instrumentKey, enabled);
		}
	}

	private getInstrumentInfo(instrumentKey: string): { name: string; icon: string; description: string; defaultFrequencyRange: string } {
		const INSTRUMENT_INFO = {
			piano: {
				name: 'Piano',
				icon: '🎹',
				description: 'Triangle waves with quick attack/decay for percussive clarity',
				defaultFrequencyRange: 'Very High (>1400Hz)'
			},
			organ: {
				name: 'Organ', 
				icon: '🎛️',
				description: 'FM synthesis with chorus effect for rich, sustained tones',
				defaultFrequencyRange: 'Medium (400-800Hz)'
			},
			strings: {
				name: 'Strings',
				icon: '🎻',
				description: 'AM synthesis with filtering for warm, flowing sounds',
				defaultFrequencyRange: 'Very Low (<200Hz)'
			},
			choir: {
				name: 'Choir',
				icon: '🎤',
				description: 'Additive synthesis with formant filtering for ethereal human voices',
				defaultFrequencyRange: 'High (1000-1400Hz)'
			},
			vocalPads: {
				name: 'Vocal Pads',
				icon: '🌊',
				description: 'Multi-layer sine waves with formant filtering for atmospheric textures',
				defaultFrequencyRange: 'Mid-High (600-1000Hz)'
			},
			pad: {
				name: 'Pad',
				icon: '🎛️',
				description: 'Multi-oscillator synthesis with filter sweeps for ambient foundations',
				defaultFrequencyRange: 'Low-Mid (200-400Hz)'
			},
			flute: {
				name: 'Flute',
				icon: '🎺',
				description: 'Pure sine waves with breath noise for airy, crystalline tones',
				defaultFrequencyRange: 'Ultra High (>1600Hz)'
			},
			clarinet: {
				name: 'Clarinet',
				icon: '🎵',
				description: 'Square wave harmonics for warm, hollow woodwind character',
				defaultFrequencyRange: 'High-Mid (800-1200Hz)'
			},
			saxophone: {
				name: 'Saxophone',
				icon: '🎷',
				description: 'Sawtooth waves with reedy harmonics for rich, expressive tone',
				defaultFrequencyRange: 'Mid (300-600Hz)'
			},
			// Phase 6A: Individual Vocal Sections with advanced formant synthesis
			soprano: {
				name: 'Soprano',
				icon: '👩‍🎤',
				description: 'High female voice with AM synthesis and formant filtering for vowel morphing',
				defaultFrequencyRange: 'High-Mid (800-1200Hz)'
			},
			alto: {
				name: 'Alto',
				icon: '🎙️',
				description: 'Lower female voice with rich harmonics and breath noise modeling',
				defaultFrequencyRange: 'High (1000-1400Hz)'
			},
			tenor: {
				name: 'Tenor',
				icon: '🧑‍🎤',
				description: 'High male voice with FM synthesis and vocal fry characteristics',
				defaultFrequencyRange: 'Mid-High (600-1000Hz)'
			},
			bass: {
				name: 'Bass',
				icon: '🎤',
				description: 'Low male voice with sub-harmonics and chest resonance modeling',
				defaultFrequencyRange: 'Very Low (<100Hz)'
			}
		};
		
		return INSTRUMENT_INFO[instrumentKey as keyof typeof INSTRUMENT_INFO] || INSTRUMENT_INFO.piano;
	}

	private createHarmonyTab(): void {
		const section = this.createTabSection('Harmonic Control', 'Advanced harmony features coming soon');

		// Placeholder for future harmony features
		const placeholderGroup = this.createSettingsGroup(section, '🚧 Coming Soon', 'Advanced harmonic features are planned for future releases');
		
		const placeholder = placeholderGroup.createDiv({ cls: 'sonigraph-placeholder' });
		placeholder.createEl('p', { 
			text: 'Advanced harmonic control features including voice leading, chord progression analysis, and intelligent harmony generation are planned for future development.',
			cls: 'sonigraph-placeholder-text'
		});
		
		placeholder.createEl('p', { 
			text: 'Current focus is on perfecting the core audio engine and effect system. Stay tuned for updates!',
			cls: 'sonigraph-placeholder-text'
		});
	}

	private createEffectsTab(): void {
		const section = this.createTabSection('Audio Effects', 'Configure reverb, chorus, and filter effects');

		// Effect Presets Section
		const presetsSection = this.createSettingsGroup(section, '🎭 Effect Presets', 'Instantly apply professional effect combinations');
		
		// Venue Presets
		const venueGroup = presetsSection.createDiv({ cls: 'sonigraph-preset-group' });
		venueGroup.createEl('h4', { text: 'Venue Presets', cls: 'sonigraph-preset-category' });
		
		const venueButtons = venueGroup.createDiv({ cls: 'sonigraph-preset-buttons' });
		Object.entries(EFFECT_PRESETS).forEach(([key, preset]) => {
			if (preset.category === 'venue') {
				const button = venueButtons.createEl('button', {
					cls: 'sonigraph-preset-button',
					text: preset.name,
					attr: { title: preset.description }
				});
				
				button.addEventListener('click', async () => {
					if (this.plugin.audioEngine) {
						// Apply to all enabled instruments
						this.plugin.audioEngine.applyEffectPresetToAll(key);
						await this.plugin.saveSettings();
						
						// Refresh the effects tab to show updated settings
						this.showTab('effects');
						
						// Show confirmation
						const notification = this.contentContainer.createEl('div', {
							cls: 'sonigraph-notification',
							text: `Applied "${preset.name}" preset to all enabled instruments`
						});
						setTimeout(() => notification.remove(), 3000);
					}
				});
			}
		});

		// Genre Presets
		const genreGroup = presetsSection.createDiv({ cls: 'sonigraph-preset-group' });
		genreGroup.createEl('h4', { text: 'Genre Presets', cls: 'sonigraph-preset-category' });
		
		const genreButtons = genreGroup.createDiv({ cls: 'sonigraph-preset-buttons' });
		Object.entries(EFFECT_PRESETS).forEach(([key, preset]) => {
			if (preset.category === 'genre') {
				const button = genreButtons.createEl('button', {
					cls: 'sonigraph-preset-button',
					text: preset.name,
					attr: { title: preset.description }
				});
				
				button.addEventListener('click', async () => {
					if (this.plugin.audioEngine) {
						// Apply to all enabled instruments
						this.plugin.audioEngine.applyEffectPresetToAll(key);
						await this.plugin.saveSettings();
						
						// Refresh the effects tab to show updated settings
						this.showTab('effects');
						
						// Show confirmation
						const notification = this.contentContainer.createEl('div', {
							cls: 'sonigraph-notification',
							text: `Applied "${preset.name}" preset to all enabled instruments`
						});
						setTimeout(() => notification.remove(), 3000);
					}
				});
			}
		});

		// Quick Reset Button
		const resetGroup = presetsSection.createDiv({ cls: 'sonigraph-preset-group' });
		resetGroup.createEl('h4', { text: 'Reset', cls: 'sonigraph-preset-category' });
		
		const resetButton = resetGroup.createEl('button', {
			cls: 'sonigraph-preset-button sonigraph-reset-button',
			text: 'Reset All to Defaults'
		});
		
		resetButton.addEventListener('click', async () => {
			if (this.plugin.audioEngine) {
				// Reset all instruments to defaults
				Object.keys(this.plugin.settings.instruments).forEach(instrumentKey => {
					const instrumentSettings = this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments];
					if (instrumentSettings?.enabled) {
						this.plugin.audioEngine!.resetInstrumentEffects(instrumentKey);
					}
				});
				
				await this.plugin.saveSettings();
				
				// Refresh the effects tab to show updated settings
				this.showTab('effects');
				
				// Show confirmation
				const notification = this.contentContainer.createEl('div', {
					cls: 'sonigraph-notification',
					text: 'Reset all instruments to default effect settings'
				});
				setTimeout(() => notification.remove(), 3000);
			}
		});

		// Separator
		section.createEl('hr', { cls: 'sonigraph-section-separator' });

		// Individual instrument effect controls - Updated for Phase 6A: All 13 instruments
		['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone', 'soprano', 'alto', 'tenor', 'bass'].forEach(instrumentKey => {
			this.createInstrumentEffectControls(section, instrumentKey);
		});
	}

	private createInstrumentEffectControls(
		parent: HTMLElement, 
		instrumentKey: string, 
		title?: string, 
		description?: string,
		updateStatusCallback?: () => void
	): void {
		// Get smart ranges for this instrument
		const smartRanges = getSmartRanges(instrumentKey);
		
		// Check if instrument exists in settings - skip if missing
		const instrumentSettings = this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments];
		if (!instrumentSettings) {
			console.warn(`Instrument '${instrumentKey}' not found in settings, skipping effect controls`);
			return;
		}

		// Get instrument info for display
		const instrumentInfo = this.getInstrumentInfo(instrumentKey);
		
		// Create instrument section
		const instrumentGroup = parent.createDiv({ cls: 'sonigraph-instrument-group' });
		
		// Instrument header with real-time controls
		const instrumentHeader = instrumentGroup.createDiv({ cls: 'sonigraph-instrument-header' });
		const headerLeft = instrumentHeader.createDiv({ cls: 'sonigraph-instrument-header-left' });
		const headerRight = instrumentHeader.createDiv({ cls: 'sonigraph-instrument-header-right' });
		
		headerLeft.createEl('h3', { text: `${instrumentInfo.icon} ${instrumentInfo.name}`, cls: 'sonigraph-instrument-title' });
		
		// Real-time preview controls
		const previewButton = headerRight.createEl('button', {
			cls: 'sonigraph-preview-button',
			text: '🎵 Preview',
			attr: { title: 'Play sustained note to hear effect changes in real-time' }
		});
		
		const performanceIndicator = headerRight.createDiv({ cls: 'sonigraph-performance-indicator' });
		
		// Preview button functionality
		let isPreviewActive = false;
		previewButton.addEventListener('click', () => {
			if (!this.plugin.audioEngine) return;
			
			if (isPreviewActive) {
				this.plugin.audioEngine.disableParameterPreview();
				previewButton.setText('🎵 Preview');
				previewButton.removeClass('active');
				isPreviewActive = false;
			} else {
				this.plugin.audioEngine.enableParameterPreview(instrumentKey);
				previewButton.setText('⏹️ Stop');
				previewButton.addClass('active');
				isPreviewActive = true;
			}
		});

		// Performance monitoring update
		const updatePerformance = () => {
			if (this.plugin.audioEngine) {
				const metrics = this.plugin.audioEngine.getPerformanceMetrics();
				performanceIndicator.setText(`CPU: ${Math.round(metrics.cpuUsage)}% | ${Math.round(metrics.latency)}ms`);
				
				// Color coding for performance
				performanceIndicator.removeClass('good', 'warning', 'danger');
				if (metrics.cpuUsage < 50) performanceIndicator.addClass('good');
				else if (metrics.cpuUsage < 80) performanceIndicator.addClass('warning');
				else performanceIndicator.addClass('danger');
			}
		};
		
		// Update performance every 2 seconds
		setInterval(updatePerformance, 2000);
		updatePerformance(); // Initial update

		// Status callback including performance
		const finalUpdateCallback = () => {
			if (updateStatusCallback) updateStatusCallback();
			updatePerformance();
		};

		const effectStates = instrumentSettings.effects;

		// Reverb Controls with Real-time Feedback
		const reverbGroup = instrumentGroup.createDiv({ cls: 'sonigraph-effect-group' });
		
		// Reverb header with bypass button
		const reverbHeader = reverbGroup.createDiv({ cls: 'sonigraph-effect-header' });
		reverbHeader.createEl('h4', { text: '🏛️ Reverb', cls: 'sonigraph-effect-title' });
		
		const reverbBypassButton = reverbHeader.createEl('button', {
			cls: 'sonigraph-bypass-button',
			text: 'Bypass',
			attr: { title: 'A/B compare with/without reverb' }
		});
		
		// Bypass button functionality
		reverbBypassButton.addEventListener('click', () => {
			if (!this.plugin.audioEngine) return;
			
			const bypassed = this.plugin.audioEngine.toggleEffectBypass(instrumentKey, 'reverb');
			reverbBypassButton.setText(bypassed ? 'Bypassed' : 'Bypass');
			reverbBypassButton.toggleClass('bypassed', bypassed);
		});

		// Reverb Enable Toggle
		createObsidianToggle(
			reverbGroup,
			effectStates.reverb.enabled,
			async (value) => {
				effectStates.reverb.enabled = value;
				await this.plugin.saveSettings();
				if (this.plugin.audioEngine) {
					this.plugin.audioEngine.setReverbEnabled(value, instrumentKey);
				}
				// Show/hide reverb settings
				reverbSettingsContainer.style.display = value ? 'block' : 'none';
				finalUpdateCallback();
			},
			{
				name: 'Enable reverb',
				description: 'Natural spatial ambience'
			}
		);

		// Container for reverb settings
		const reverbSettingsContainer = reverbGroup.createDiv({ cls: 'sonigraph-effect-settings-container' });

		// Smart Decay Slider with Real-time Preview
		const decayRange = smartRanges.reverb.decay;
		new Setting(reverbSettingsContainer)
			.setName('Decay time')
			.setDesc(`${decayRange.musicalContext} (${decayRange.min} - ${decayRange.max} seconds)`)
			.addSlider(slider => {
				slider
					.setLimits(decayRange.min, decayRange.max, decayRange.step)
					.setValue(effectStates.reverb.params.decay as number)
					.setDynamicTooltip()
					.onChange(async (value) => {
						// Real-time preview if enabled
						if (this.plugin.audioEngine && isPreviewActive) {
							this.plugin.audioEngine.previewParameterChange(instrumentKey, 'reverb', 'decay', value);
						}
						
						effectStates.reverb.params.decay = value;
						await this.plugin.saveSettings();
						if (this.plugin.audioEngine) {
							this.plugin.audioEngine.updateReverbSettings({ decay: value }, instrumentKey);
						}
					});
				
				// Add suggestion buttons if available
				if (decayRange.suggestions) {
					const suggestionsDiv = reverbSettingsContainer.createDiv({ cls: 'sonigraph-suggestions' });
					decayRange.suggestions.forEach(suggestion => {
						const btn = suggestionsDiv.createEl('button', {
							cls: 'sonigraph-suggestion-button',
							text: suggestion.label,
							attr: { title: `Set to ${suggestion.value}s` }
						});
						btn.addEventListener('click', async () => {
							slider.setValue(suggestion.value);
							effectStates.reverb.params.decay = suggestion.value;
							await this.plugin.saveSettings();
							if (this.plugin.audioEngine) {
								this.plugin.audioEngine.updateReverbSettings({ decay: suggestion.value }, instrumentKey);
							}
						});
					});
				}
				
				return slider;
			});

		// Smart Pre-delay Slider with Real-time Preview
		const preDelayRange = smartRanges.reverb.preDelay;
		new Setting(reverbSettingsContainer)
			.setName('Pre-delay')
			.setDesc(`${preDelayRange.musicalContext} (${preDelayRange.min} - ${preDelayRange.max} seconds)`)
			.addSlider(slider => slider
				.setLimits(preDelayRange.min, preDelayRange.max, preDelayRange.step)
				.setValue(effectStates.reverb.params.preDelay as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					// Real-time preview if enabled
					if (this.plugin.audioEngine && isPreviewActive) {
						this.plugin.audioEngine.previewParameterChange(instrumentKey, 'reverb', 'preDelay', value);
					}
					
					effectStates.reverb.params.preDelay = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateReverbSettings({ preDelay: value }, instrumentKey);
					}
				}));

		// Smart Wet Level Slider with Real-time Preview
		const wetRange = smartRanges.reverb.wet;
		new Setting(reverbSettingsContainer)
			.setName('Wet level')
			.setDesc(`${wetRange.musicalContext} (${Math.round(wetRange.min * 100)} - ${Math.round(wetRange.max * 100)}%)`)
			.addSlider(slider => slider
				.setLimits(wetRange.min * 100, wetRange.max * 100, wetRange.step * 100)
				.setValue((effectStates.reverb.params.wet as number) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					// Real-time preview if enabled
					if (this.plugin.audioEngine && isPreviewActive) {
						this.plugin.audioEngine.previewParameterChange(instrumentKey, 'reverb', 'wet', value / 100);
					}
					
					effectStates.reverb.params.wet = value / 100;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateReverbSettings({ wet: value / 100 }, instrumentKey);
					}
				}));

		// Initialize visibility states
		reverbSettingsContainer.style.display = effectStates.reverb.enabled ? 'block' : 'none';

		// Chorus Controls with Real-time Feedback
		const chorusGroup = instrumentGroup.createDiv({ cls: 'sonigraph-effect-group' });
		
		// Chorus header with bypass button
		const chorusHeader = chorusGroup.createDiv({ cls: 'sonigraph-effect-header' });
		chorusHeader.createEl('h4', { text: '🌀 Chorus', cls: 'sonigraph-effect-title' });
		
		const chorusBypassButton = chorusHeader.createEl('button', {
			cls: 'sonigraph-bypass-button',
			text: 'Bypass',
			attr: { title: 'A/B compare with/without chorus' }
		});
		
		// Bypass button functionality
		chorusBypassButton.addEventListener('click', () => {
			if (!this.plugin.audioEngine) return;
			
			const bypassed = this.plugin.audioEngine.toggleEffectBypass(instrumentKey, 'chorus');
			chorusBypassButton.setText(bypassed ? 'Bypassed' : 'Bypass');
			chorusBypassButton.toggleClass('bypassed', bypassed);
		});

		// Chorus Enable Toggle
		createObsidianToggle(
			chorusGroup,
			effectStates.chorus.enabled,
			async (value) => {
				effectStates.chorus.enabled = value;
				await this.plugin.saveSettings();
				if (this.plugin.audioEngine) {
					this.plugin.audioEngine.setChorusEnabled(value, instrumentKey);
				}
				// Show/hide chorus settings
				chorusSettingsContainer.style.display = value ? 'block' : 'none';
				finalUpdateCallback();
			},
			{
				name: 'Enable chorus',
				description: 'Rich modulation and width'
			}
		);

		// Container for chorus settings
		const chorusSettingsContainer = chorusGroup.createDiv({ cls: 'sonigraph-effect-settings-container' });

		// Smart Rate Slider with Real-time Preview
		const frequencyRange = smartRanges.chorus.frequency;
		new Setting(chorusSettingsContainer)
			.setName('Rate')
			.setDesc(`${frequencyRange.musicalContext} (${frequencyRange.min} - ${frequencyRange.max} Hz)`)
			.addSlider(slider => slider
				.setLimits(frequencyRange.min, frequencyRange.max, frequencyRange.step)
				.setValue(effectStates.chorus.params.frequency as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					// Real-time preview if enabled
					if (this.plugin.audioEngine && isPreviewActive) {
						this.plugin.audioEngine.previewParameterChange(instrumentKey, 'chorus', 'frequency', value);
					}
					
					effectStates.chorus.params.frequency = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateChorusSettings({ frequency: value }, instrumentKey);
					}
				}));

		// Initialize visibility states
		chorusSettingsContainer.style.display = effectStates.chorus.enabled ? 'block' : 'none';

		// ... existing code for other effects ...
	}

	private createStatusTab(): void {
		const section = this.createTabSection('System Status', 'Real-time monitoring and diagnostics');

		// System status
		const systemGroup = this.createSettingsGroup(section, 'System Status', 'Core system health');
		const systemDisplay = systemGroup.createDiv({ cls: 'sonigraph-status-grid' });

		this.createStatusRow(systemDisplay, 'Plugin Status', 'plugin-status', 'Initializing...');
		this.createStatusRow(systemDisplay, 'Audio Context', 'audio-context', 'Loading...');
		this.createStatusRow(systemDisplay, 'Playback State', 'playback-status', 'Stopped');
		this.createStatusRow(systemDisplay, 'Graph Data', 'graph-status', 'Not Loaded');

		// Effects status
		const effectsGroup = this.createSettingsGroup(section, 'Audio Effects Status', 'Active effects by instrument');
		const effectsDisplay = effectsGroup.createDiv({ cls: 'sonigraph-effects-status' });
		
		// Create effect status display
		const statusContent = effectsDisplay.createDiv({ cls: 'sonigraph-effects-status-content' });
		statusContent.createEl('h4', { text: 'Active effects by instrument:', cls: 'sonigraph-effects-status-title' });
		
		const statusList = statusContent.createDiv({ cls: 'sonigraph-effects-status-list' });
		
		// Piano status
		const pianoStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		pianoStatus.createSpan({ text: '🎹 Piano: ', cls: 'sonigraph-effect-instrument-label' });
		pianoStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-piano' }
		});
		
		// Organ status
		const organStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		organStatus.createSpan({ text: '🎛️ Organ: ', cls: 'sonigraph-effect-instrument-label' });
		organStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-organ' }
		});
		
		// Strings status
		const stringsStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		stringsStatus.createSpan({ text: '🎻 Strings: ', cls: 'sonigraph-effect-instrument-label' });
		stringsStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-strings' }
		});
		
		// Choir status
		const choirStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		choirStatus.createSpan({ text: '🎤 Choir: ', cls: 'sonigraph-effect-instrument-label' });
		choirStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-choir' }
		});
		
		// Vocal Pads status
		const vocalPadsStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		vocalPadsStatus.createSpan({ text: '🌊 Vocal Pads: ', cls: 'sonigraph-effect-instrument-label' });
		vocalPadsStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-vocalPads' }
		});
		
		// Pad status
		const padStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		padStatus.createSpan({ text: '🎛️ Pad: ', cls: 'sonigraph-effect-instrument-label' });
		padStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-pad' }
		});
		
		// Flute status
		const fluteStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		fluteStatus.createSpan({ text: '🎺 Flute: ', cls: 'sonigraph-effect-instrument-label' });
		fluteStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-flute' }
		});
		
		// Clarinet status
		const clarinetStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		clarinetStatus.createSpan({ text: '🎵 Clarinet: ', cls: 'sonigraph-effect-instrument-label' });
		clarinetStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-clarinet' }
		});
		
		// Saxophone status
		const saxophoneStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		saxophoneStatus.createSpan({ text: '🎷 Saxophone: ', cls: 'sonigraph-effect-instrument-label' });
		saxophoneStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-saxophone' }
		});
		
		// Phase 6A: Individual Vocal Sections status displays
		// Soprano status
		const sopranoStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		sopranoStatus.createSpan({ text: '👩‍🎤 Soprano: ', cls: 'sonigraph-effect-instrument-label' });
		sopranoStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-soprano' }
		});
		
		// Alto status
		const altoStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		altoStatus.createSpan({ text: '🎙️ Alto: ', cls: 'sonigraph-effect-instrument-label' });
		altoStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-alto' }
		});
		
		// Tenor status
		const tenorStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		tenorStatus.createSpan({ text: '🧑‍🎤 Tenor: ', cls: 'sonigraph-effect-instrument-label' });
		tenorStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-tenor' }
		});
		
		// Bass status
		const bassVoiceStatus = statusList.createDiv({ cls: 'sonigraph-effect-instrument-status' });
		bassVoiceStatus.createSpan({ text: '🎤 Bass: ', cls: 'sonigraph-effect-instrument-label' });
		bassVoiceStatus.createSpan({ 
			text: 'Loading...', 
			cls: 'sonigraph-effect-instrument-effects',
			attr: { id: 'sonigraph-effects-status-bass' }
		});
		
		// Add configuration hint
		const configHint = effectsDisplay.createDiv({ cls: 'sonigraph-effects-config-hint' });
		configHint.createSpan({ text: '→ Configure effects in the ', cls: 'sonigraph-hint-text' });
		configHint.createSpan({ text: 'Effects', cls: 'sonigraph-hint-link' });
		configHint.createSpan({ text: ' tab', cls: 'sonigraph-hint-text' });

		// Graph statistics
		const graphGroup = this.createSettingsGroup(section, 'Vault Analysis', 'Knowledge graph metrics');
		const graphDisplay = graphGroup.createDiv({ cls: 'sonigraph-status-grid' });

		this.createStatusRow(graphDisplay, 'Total Notes', 'total-nodes', '0');
		this.createStatusRow(graphDisplay, 'Connections', 'total-edges', '0');
		this.createStatusRow(graphDisplay, 'Average Links', 'avg-connections', '0.0');
		this.createStatusRow(graphDisplay, 'Musical Events', 'musical-events', '0');

		// Performance metrics
		const perfGroup = this.createSettingsGroup(section, 'Performance', 'Processing and audio metrics');
		const perfDisplay = perfGroup.createDiv({ cls: 'sonigraph-status-grid' });

		this.createStatusRow(perfDisplay, 'Voices Active', 'active-voices', '0');
		this.createStatusRow(perfDisplay, 'Sequence Duration', 'sequence-duration', '0s');
		this.createStatusRow(perfDisplay, 'Processing Time', 'process-time', '0ms');
		this.createStatusRow(perfDisplay, 'Harmonic Reduction', 'harmonic-reduction', '0%');
	}

	private createTabSection(title: string, description: string): HTMLElement {
		const section = this.contentContainer.createDiv({ cls: 'sonigraph-tab-section' });
		section.createEl('h2', { text: title, cls: 'sonigraph-section-title' });
		section.createEl('p', { text: description, cls: 'sonigraph-section-desc' });
		return section;
	}

	private createSettingsGroup(parent: HTMLElement, title: string, description: string): HTMLElement {
		const group = parent.createDiv({ cls: 'sonigraph-settings-group' });
		group.createEl('h3', { text: title, cls: 'sonigraph-group-title' });
		group.createEl('p', { text: description, cls: 'sonigraph-group-desc' });
		return group;
	}

	private createStatusRow(container: HTMLElement, label: string, id: string, initialValue: string): void {
		const row = container.createDiv({ cls: 'sonigraph-status-row' });
		row.createSpan({ text: label, cls: 'sonigraph-status-label' });
		row.createSpan({ 
			text: initialValue, 
			cls: 'sonigraph-status-value',
			attr: { id: `sonigraph-${id}` }
		});
	}

	private updateMusicalMapper(): void {
		if (this.plugin.musicalMapper) {
			this.plugin.musicalMapper.updateSettings(this.plugin.settings);
		}
	}

	private startStatusUpdates(): void {
		this.stopStatusUpdates();
		this.statusInterval = window.setInterval(() => {
			this.updateStatus();
		}, 500);
	}

	private stopStatusUpdates(): void {
		if (this.statusInterval) {
			window.clearInterval(this.statusInterval);
			this.statusInterval = null;
		}
	}

	private updateStatus(): void {
		const status = this.plugin.getStatus();

		// Update status displays
		this.updateStatusValue('plugin-status', status.plugin.enabled ? 'Active' : 'Disabled');
		this.updateStatusValue('audio-context', status.audio.audioContext || 'Unknown');
		this.updateStatusValue('playback-status', status.audio.isPlaying ? 'Playing' : 'Stopped');
		this.updateStatusValue('graph-status', status.plugin.hasGraphData ? 'Loaded' : 'Not Loaded');

		// Graph statistics
		if (status.graph) {
			this.updateStatusValue('total-nodes', status.graph.totalNodes?.toString() || '0');
			this.updateStatusValue('total-edges', status.graph.totalEdges?.toString() || '0');
			this.updateStatusValue('avg-connections', status.graph.avgConnections?.toFixed(1) || '0.0');
		}

		// Musical information
		this.updateStatusValue('musical-events', status.audio.currentNotes?.toString() || '0');
		this.updateStatusValue('active-voices', status.audio.currentNotes?.toString() || '0');
		
		// Update effects status
		this.updateEffectsStatus();
	}

	private updateStatusValue(id: string, value: string): void {
		const element = this.contentContainer.querySelector(`#sonigraph-${id}`);
		if (element) {
			element.textContent = value;
		}
	}

	private updateEffectsStatus(): void {
		// Update effects status for each instrument - now includes Phase 6A vocal instruments
		['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad', 'flute', 'clarinet', 'saxophone', 'soprano', 'alto', 'tenor', 'bass'].forEach((instrumentKey) => {
			const instrumentSettings = (this.plugin.settings.instruments as any)[instrumentKey];
			if (!instrumentSettings?.effects) return;
			
			const activeEffects: string[] = [];
			
			// Check each effect type
			if (instrumentSettings.effects.reverb?.enabled) {
				activeEffects.push('Reverb');
			}
			if (instrumentSettings.effects.chorus?.enabled) {
				activeEffects.push('Chorus');
			}
			if (instrumentSettings.effects.filter?.enabled) {
				activeEffects.push('Filter');
			}
			
			// Create status text
			const statusText = activeEffects.length > 0 ? activeEffects.join(', ') : 'None';
			
			// Update the status display
			const statusElement = this.contentContainer.querySelector(`#sonigraph-effects-status-${instrumentKey}`);
			if (statusElement) {
				statusElement.textContent = statusText;
			}
		});
	}

	private showError(message: string): void {
		// Create temporary error display
		const errorEl = this.contentContainer.createDiv({ 
			cls: 'sonigraph-error-message',
			text: message 
		});
		
		setTimeout(() => {
			errorEl.remove();
		}, 5000);
	}

	private getIconSvg(iconName: string): string {
		const icons: Record<string, string> = {
			play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
			stop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>',
			music: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
			piano: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>',
			sparkles: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 12L7 7.5 5.5 12 1 13.5l4.5 1.5L7 20l2.5-4.5L14 13.5 9.5 12zM19 3l-1 4h-4l4 1 1 4 1-4 4-1-4-1L19 3z"/></svg>',
			headphones: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/></svg>',
			activity: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
		};
		return icons[iconName] || icons.play;
	}
} 