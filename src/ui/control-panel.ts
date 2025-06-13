import { App, Modal, Setting } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger } from '../logging';
import { createObsidianToggle } from './components';
import { HarmonicSettings } from '../audio/harmonic-engine';

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

		['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad'].forEach(instrumentKey => {
			const info = this.getInstrumentInfo(instrumentKey);
			const activityRow = activityDisplay.createDiv({ cls: 'sonigraph-activity-row' });
			
			const label = activityRow.createDiv({ cls: 'sonigraph-activity-label' });
			label.createSpan({ text: info.icon, cls: 'sonigraph-activity-icon' });
			label.createSpan({ text: info.name, cls: 'sonigraph-activity-name' });
			
			const voices = activityRow.createDiv({ cls: 'sonigraph-activity-voices' });
			for (let i = 0; i < 8; i++) {
				voices.createDiv({ 
					cls: 'sonigraph-voice-indicator',
					attr: { id: `voice-${instrumentKey}-${i}` }
				});
			}
			
			const count = activityRow.createDiv({ 
				cls: 'sonigraph-activity-count',
				text: '0/8',
				attr: { id: `count-${instrumentKey}` }
			});
		});

		// Individual instrument controls
		const instrumentsGroup = this.createSettingsGroup(section, 'Individual Instrument Controls', 'Configure each instrument separately');

		['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad'].forEach(instrumentKey => {
			const instrumentSettings = this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments];
			console.log(`Creating toggle for instrument: ${instrumentKey}, enabled: ${instrumentSettings.enabled}`);
			
			const info = this.getInstrumentInfo(instrumentKey);
			const instrumentContainer = instrumentsGroup.createDiv({ cls: 'sonigraph-instrument-control' });
			
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
					
					this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments].enabled = value;
					await this.plugin.saveSettings();
					await this.updateInstrumentState(instrumentKey, value);
					
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
			


			// Volume control
			new Setting(instrumentContainer)
				.setName('Volume')
				.setDesc(`Individual volume for ${info.name.toLowerCase()} (0-100%)`)
				.addSlider(slider => slider
					.setLimits(0, 100, 5)
					.setValue(Math.round(instrumentSettings.volume * 100))
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments].volume = value / 100;
						await this.plugin.saveSettings();
						if (this.plugin.audioEngine) {
							this.plugin.audioEngine.updateInstrumentVolume(instrumentKey, value / 100);
						}
					}));

			// Max voices control
			new Setting(instrumentContainer)
				.setName('Maximum Voices')
				.setDesc(`Voice limit for ${info.name.toLowerCase()} (1-16)`)
				.addSlider(slider => slider
					.setLimits(1, 16, 1)
					.setValue(instrumentSettings.maxVoices)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments].maxVoices = value;
						await this.plugin.saveSettings();
						if (this.plugin.audioEngine) {
							this.plugin.audioEngine.updateInstrumentVoices(instrumentKey, value);
						}
					}));

			// Frequency range info (for frequency-based strategy)
			const rangeInfo = instrumentContainer.createDiv({ cls: 'sonigraph-frequency-info' });
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
				infoBox.createEl('h4', { text: 'Frequency-Based Assignment' });
				infoBox.createEl('p', { text: 'Very High (>1200Hz) → Piano (crisp, percussive)' });
				infoBox.createEl('p', { text: 'High (800-1200Hz) → Choir (ethereal voices)' });
				infoBox.createEl('p', { text: 'Mid-High (600-800Hz) → Vocal Pads (atmospheric)' });
				infoBox.createEl('p', { text: 'Medium (300-600Hz) → Organ (rich, sustained)' });
				infoBox.createEl('p', { text: 'Low-Med (150-300Hz) → Pad (ambient foundation)' });
				infoBox.createEl('p', { text: 'Very Low (<150Hz) → Strings (warm, flowing)' });
				break;
			case 'round-robin':
				infoBox.createEl('h4', { text: 'Round-Robin Assignment' });
				infoBox.createEl('p', { text: 'Cycles through all enabled instruments in order' });
				infoBox.createEl('p', { text: 'Ensures equal distribution across Piano, Organ, Strings, Choir, Vocal Pads, Pad' });
				break;
			case 'connection-based':
				infoBox.createEl('h4', { text: 'Connection-Based Assignment' });
				infoBox.createEl('p', { text: 'Highly connected nodes → Piano (prominent, percussive)' });
				infoBox.createEl('p', { text: 'Medium connections → Organ, Choir (harmonic foundation)' });
				infoBox.createEl('p', { text: 'Low connections → Strings, Vocal Pads, Pad (ambient, atmospheric)' });
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
				defaultFrequencyRange: 'High (>800Hz)'
			},
			organ: {
				name: 'Organ', 
				icon: '🎛️',
				description: 'FM synthesis with chorus effect for rich, sustained tones',
				defaultFrequencyRange: 'Medium (300-800Hz)'
			},
			strings: {
				name: 'Strings',
				icon: '🎻',
				description: 'AM synthesis with filtering for warm, flowing sounds',
				defaultFrequencyRange: 'Low (<300Hz)'
			},
			choir: {
				name: 'Choir',
				icon: '🎤',
				description: 'Additive synthesis with formant filtering for ethereal human voices',
				defaultFrequencyRange: 'Mid-High (400-1200Hz)'
			},
			vocalPads: {
				name: 'Vocal Pads',
				icon: '🌊',
				description: 'Multi-layer sine waves with formant filtering for atmospheric textures',
				defaultFrequencyRange: 'Mid (300-800Hz)'
			},
			pad: {
				name: 'Pad',
				icon: '🎛️',
				description: 'Multi-oscillator synthesis with filter sweeps for ambient foundations',
				defaultFrequencyRange: 'Full Spectrum (100-2000Hz)'
			}
		};
		
		return INSTRUMENT_INFO[instrumentKey as keyof typeof INSTRUMENT_INFO] || INSTRUMENT_INFO.piano;
	}

	private createHarmonyTab(): void {
		const section = this.createTabSection('Harmonic Processing', 'Advanced harmony and chord progression settings');

		// Voice limiting
		const voicesGroup = this.createSettingsGroup(section, 'Voice Management', 'Control simultaneous note limits');

		// We'll need to add these settings to the plugin settings type
		const maxVoicesSlider = new Setting(voicesGroup)
			.setName('Maximum Simultaneous Voices')
			.setDesc('Limit concurrent notes to prevent discord (1-12)')
			.addSlider(slider => slider
				.setLimits(1, 12, 1)
				.setValue(6) // Default from harmonic engine
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateHarmonicSettings({ maxSimultaneousNotes: value });
					}
				}));

		// Consonance settings
		const consonanceGroup = this.createSettingsGroup(section, 'Harmonic Consonance', 'Chord progression and harmony strength');

		new Setting(consonanceGroup)
			.setName('Consonance Strength')
			.setDesc('How aggressively to enforce harmonic compatibility (0-100%)')
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue(70) // Default 70%
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateHarmonicSettings({ 
							consonanceStrength: value / 100 
						});
					}
				}));

		createObsidianToggle(
			consonanceGroup,
			true, // Default enabled
			async (value) => {
				if (this.plugin.audioEngine) {
					this.plugin.audioEngine.updateHarmonicSettings({ 
						enableChordProgression: value 
					});
				}
			},
			{
				name: 'Enable Chord Progression',
				description: 'Automatically group notes into musical chords'
			}
		);

		new Setting(consonanceGroup)
			.setName('Voice Spacing')
			.setDesc('Minimum semitones between simultaneous voices (1-6)')
			.addSlider(slider => slider
				.setLimits(1, 6, 1)
				.setValue(2) // Default 2 semitones
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateHarmonicSettings({ 
							voiceSpreadMin: value 
						});
					}
				}));
	}

	private createEffectsTab(): void {
		const section = this.createTabSection('Audio Effects', 'Per-instrument effect routing and processing');

		// Effect Status Display - Show per-instrument routing
		const statusGroup = this.createSettingsGroup(section, 'Effect routing status', 'Current per-instrument effect states');
		const statusDisplay = statusGroup.createDiv({ cls: 'sonigraph-effects-status' });

		// Real-time effect parameters display
		const parametersDisplay = statusDisplay.createDiv({ cls: 'sonigraph-effect-parameters' });
		parametersDisplay.createEl('h4', { text: 'Active effects by instrument:' });

		// Status rows for each instrument
		const pianoStatus = parametersDisplay.createDiv({ cls: 'sonigraph-effect-status-row' });
		pianoStatus.createSpan({ text: '🎹 Piano: ', cls: 'sonigraph-effect-label' });
		const pianoStateSpan = pianoStatus.createSpan({ text: 'Loading...', cls: 'sonigraph-effect-state', attr: { id: 'piano-effects-state' } });

		const organStatus = parametersDisplay.createDiv({ cls: 'sonigraph-effect-status-row' });
		organStatus.createSpan({ text: '🎛️ Organ: ', cls: 'sonigraph-effect-label' });
		const organStateSpan = organStatus.createSpan({ text: 'Loading...', cls: 'sonigraph-effect-state', attr: { id: 'organ-effects-state' } });

		const stringsStatus = parametersDisplay.createDiv({ cls: 'sonigraph-effect-status-row' });
		stringsStatus.createSpan({ text: '🎻 Strings: ', cls: 'sonigraph-effect-label' });
		const stringsStateSpan = stringsStatus.createSpan({ text: 'Loading...', cls: 'sonigraph-effect-state', attr: { id: 'strings-effects-state' } });

		const choirStatus = parametersDisplay.createDiv({ cls: 'sonigraph-effect-status-row' });
		choirStatus.createSpan({ text: '🎤 Choir: ', cls: 'sonigraph-effect-label' });
		const choirStateSpan = choirStatus.createSpan({ text: 'Loading...', cls: 'sonigraph-effect-state', attr: { id: 'choir-effects-state' } });

		const vocalPadsStatus = parametersDisplay.createDiv({ cls: 'sonigraph-effect-status-row' });
		vocalPadsStatus.createSpan({ text: '🌊 Vocal Pads: ', cls: 'sonigraph-effect-label' });
		const vocalPadsStateSpan = vocalPadsStatus.createSpan({ text: 'Loading...', cls: 'sonigraph-effect-state', attr: { id: 'vocalPads-effects-state' } });

		const padStatus = parametersDisplay.createDiv({ cls: 'sonigraph-effect-status-row' });
		padStatus.createSpan({ text: '🎛️ Pad: ', cls: 'sonigraph-effect-label' });
		const padStateSpan = padStatus.createSpan({ text: 'Loading...', cls: 'sonigraph-effect-state', attr: { id: 'pad-effects-state' } });

		// Function to update status display
		const updateStatusDisplay = () => {
			// Update piano effects status
			const pianoEffects = this.plugin.settings.instruments.piano.effects;
			const pianoActiveEffects = [];
			if (pianoEffects.reverb.enabled) pianoActiveEffects.push('Reverb');
			if (pianoEffects.chorus.enabled) pianoActiveEffects.push('Chorus');
			if (pianoEffects.filter.enabled) pianoActiveEffects.push('Filter');
			pianoStateSpan.textContent = pianoActiveEffects.length > 0 ? pianoActiveEffects.join(', ') : 'No effects';
			pianoStateSpan.className = `sonigraph-effect-state ${pianoActiveEffects.length > 0 ? 'enabled' : 'disabled'}`;

			// Update organ effects status
			const organEffects = this.plugin.settings.instruments.organ.effects;
			const organActiveEffects = [];
			if (organEffects.reverb.enabled) organActiveEffects.push('Reverb');
			if (organEffects.chorus.enabled) organActiveEffects.push('Chorus');
			if (organEffects.filter.enabled) organActiveEffects.push('Filter');
			organStateSpan.textContent = organActiveEffects.length > 0 ? organActiveEffects.join(', ') : 'No effects';
			organStateSpan.className = `sonigraph-effect-state ${organActiveEffects.length > 0 ? 'enabled' : 'disabled'}`;

			// Update strings effects status
			const stringsEffects = this.plugin.settings.instruments.strings.effects;
			const stringsActiveEffects = [];
			if (stringsEffects.reverb.enabled) stringsActiveEffects.push('Reverb');
			if (stringsEffects.chorus.enabled) stringsActiveEffects.push('Chorus');
			if (stringsEffects.filter.enabled) stringsActiveEffects.push('Filter');
			stringsStateSpan.textContent = stringsActiveEffects.length > 0 ? stringsActiveEffects.join(', ') : 'No effects';
			stringsStateSpan.className = `sonigraph-effect-state ${stringsActiveEffects.length > 0 ? 'enabled' : 'disabled'}`;

			// Update choir effects status
			const choirEffects = this.plugin.settings.instruments.choir.effects;
			const choirActiveEffects = [];
			if (choirEffects.reverb.enabled) choirActiveEffects.push('Reverb');
			if (choirEffects.chorus.enabled) choirActiveEffects.push('Chorus');
			if (choirEffects.filter.enabled) choirActiveEffects.push('Filter');
			choirStateSpan.textContent = choirActiveEffects.length > 0 ? choirActiveEffects.join(', ') : 'No effects';
			choirStateSpan.className = `sonigraph-effect-state ${choirActiveEffects.length > 0 ? 'enabled' : 'disabled'}`;

			// Update vocal pads effects status
			const vocalPadsEffects = this.plugin.settings.instruments.vocalPads.effects;
			const vocalPadsActiveEffects = [];
			if (vocalPadsEffects.reverb.enabled) vocalPadsActiveEffects.push('Reverb');
			if (vocalPadsEffects.chorus.enabled) vocalPadsActiveEffects.push('Chorus');
			if (vocalPadsEffects.filter.enabled) vocalPadsActiveEffects.push('Filter');
			vocalPadsStateSpan.textContent = vocalPadsActiveEffects.length > 0 ? vocalPadsActiveEffects.join(', ') : 'No effects';
			vocalPadsStateSpan.className = `sonigraph-effect-state ${vocalPadsActiveEffects.length > 0 ? 'enabled' : 'disabled'}`;

			// Update pad effects status
			const padEffects = this.plugin.settings.instruments.pad.effects;
			const padActiveEffects = [];
			if (padEffects.reverb.enabled) padActiveEffects.push('Reverb');
			if (padEffects.chorus.enabled) padActiveEffects.push('Chorus');
			if (padEffects.filter.enabled) padActiveEffects.push('Filter');
			padStateSpan.textContent = padActiveEffects.length > 0 ? padActiveEffects.join(', ') : 'No effects';
			padStateSpan.className = `sonigraph-effect-state ${padActiveEffects.length > 0 ? 'enabled' : 'disabled'}`;
		};

		// Create per-instrument effect controls
		this.createInstrumentEffectControls(section, 'piano', '🎹 Piano Effects', 'Percussive clarity and brightness', updateStatusDisplay);
		this.createInstrumentEffectControls(section, 'organ', '🎛️ Organ Effects', 'Rich harmonic content and sustain', updateStatusDisplay);
		this.createInstrumentEffectControls(section, 'strings', '🎻 Strings Effects', 'Warm, flowing textures', updateStatusDisplay);
		this.createInstrumentEffectControls(section, 'choir', '🎤 Choir Effects', 'Ethereal human voices with formant filtering', updateStatusDisplay);
		this.createInstrumentEffectControls(section, 'vocalPads', '🌊 Vocal Pads Effects', 'Atmospheric voice textures with sustained envelopes', updateStatusDisplay);
		this.createInstrumentEffectControls(section, 'pad', '🎛️ Pad Effects', 'Ambient synthetic textures with filter sweeps', updateStatusDisplay);

		// Initialize display
		updateStatusDisplay();
	}

	private createInstrumentEffectControls(
		parent: HTMLElement, 
		instrumentKey: string, 
		title: string, 
		description: string,
		updateStatusCallback: () => void
	): void {
		const instrumentGroup = this.createSettingsGroup(parent, title, description);
		const effectStates = this.plugin.settings.instruments[instrumentKey as keyof typeof this.plugin.settings.instruments].effects;

		// Reverb Controls
		const reverbGroup = instrumentGroup.createDiv({ cls: 'sonigraph-effect-group' });
		reverbGroup.createEl('h4', { text: '🌊 Reverb', cls: 'sonigraph-effect-title' });

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
				updateStatusCallback();
			},
			{
				name: 'Enable reverb',
				description: 'Spatial depth and ambience'
			}
		);

		// Container for reverb settings
		const reverbSettingsContainer = reverbGroup.createDiv({ cls: 'sonigraph-effect-settings-container' });

		new Setting(reverbSettingsContainer)
			.setName('Decay time')
			.setDesc('How long the reverb tail lasts (0.1 - 10 seconds)')
			.addSlider(slider => slider
				.setLimits(0.1, 10, 0.1)
				.setValue(effectStates.reverb.params.decay as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.reverb.params.decay = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateReverbSettings({ decay: value }, instrumentKey);
					}
				}));

		new Setting(reverbSettingsContainer)
			.setName('Pre-delay')
			.setDesc('Initial delay before reverb starts (0 - 0.1 seconds)')
			.addSlider(slider => slider
				.setLimits(0, 0.1, 0.005)
				.setValue(effectStates.reverb.params.preDelay as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.reverb.params.preDelay = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateReverbSettings({ preDelay: value }, instrumentKey);
					}
				}));

		new Setting(reverbSettingsContainer)
			.setName('Wet level')
			.setDesc('Amount of reverb mixed in (0 - 100%)')
			.addSlider(slider => slider
				.setLimits(0, 100, 1)
				.setValue((effectStates.reverb.params.wet as number) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.reverb.params.wet = value / 100;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateReverbSettings({ wet: value / 100 }, instrumentKey);
					}
				}));

		// Chorus Controls
		const chorusGroup = instrumentGroup.createDiv({ cls: 'sonigraph-effect-group' });
		chorusGroup.createEl('h4', { text: '🌀 Chorus', cls: 'sonigraph-effect-title' });

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
				updateStatusCallback();
			},
			{
				name: 'Enable chorus',
				description: 'Rich modulation and width'
			}
		);

		// Container for chorus settings
		const chorusSettingsContainer = chorusGroup.createDiv({ cls: 'sonigraph-effect-settings-container' });

		new Setting(chorusSettingsContainer)
			.setName('Rate')
			.setDesc('Modulation speed (0.1 - 5 Hz)')
			.addSlider(slider => slider
				.setLimits(0.1, 5, 0.1)
				.setValue(effectStates.chorus.params.frequency as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.chorus.params.frequency = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateChorusSettings({ frequency: value }, instrumentKey);
					}
				}));

		new Setting(chorusSettingsContainer)
			.setName('Depth')
			.setDesc('Modulation intensity (0 - 100%)')
			.addSlider(slider => slider
				.setLimits(0, 100, 1)
				.setValue((effectStates.chorus.params.depth as number) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.chorus.params.depth = value / 100;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateChorusSettings({ depth: value / 100 }, instrumentKey);
					}
				}));

		new Setting(chorusSettingsContainer)
			.setName('Delay time')
			.setDesc('Base delay amount (1 - 20 ms)')
			.addSlider(slider => slider
				.setLimits(1, 20, 0.5)
				.setValue(effectStates.chorus.params.delayTime as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.chorus.params.delayTime = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateChorusSettings({ delayTime: value }, instrumentKey);
					}
				}));

		new Setting(chorusSettingsContainer)
			.setName('Feedback')
			.setDesc('Amount of signal fed back (0 - 50%)')
			.addSlider(slider => slider
				.setLimits(0, 50, 1)
				.setValue((effectStates.chorus.params.feedback as number) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.chorus.params.feedback = value / 100;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateChorusSettings({ feedback: value / 100 }, instrumentKey);
					}
				}));

		// Filter Controls
		const filterGroup = instrumentGroup.createDiv({ cls: 'sonigraph-effect-group' });
		filterGroup.createEl('h4', { text: '🎚️ Filter', cls: 'sonigraph-effect-title' });

		// Filter Enable Toggle
		createObsidianToggle(
			filterGroup,
			effectStates.filter.enabled,
			async (value) => {
				effectStates.filter.enabled = value;
				await this.plugin.saveSettings();
				if (this.plugin.audioEngine) {
					this.plugin.audioEngine.setFilterEnabled(value, instrumentKey);
				}
				// Show/hide filter settings
				filterSettingsContainer.style.display = value ? 'block' : 'none';
				updateStatusCallback();
			},
			{
				name: 'Enable filter',
				description: 'Frequency shaping for tone'
			}
		);

		// Container for filter settings
		const filterSettingsContainer = filterGroup.createDiv({ cls: 'sonigraph-effect-settings-container' });

		new Setting(filterSettingsContainer)
			.setName('Cutoff frequency')
			.setDesc('Filter cutoff point (200 - 8000 Hz)')
			.addSlider(slider => slider
				.setLimits(200, 8000, 50)
				.setValue(effectStates.filter.params.frequency as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.filter.params.frequency = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateFilterSettings({ frequency: value }, instrumentKey);
					}
				}));

		new Setting(filterSettingsContainer)
			.setName('Resonance (Q)')
			.setDesc('Filter sharpness and character (0.1 - 5.0)')
			.addSlider(slider => slider
				.setLimits(0.1, 5.0, 0.1)
				.setValue(effectStates.filter.params.Q as number)
				.setDynamicTooltip()
				.onChange(async (value) => {
					effectStates.filter.params.Q = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateFilterSettings({ Q: value }, instrumentKey);
					}
				}));

		new Setting(filterSettingsContainer)
			.setName('Filter type')
			.setDesc('Type of frequency filtering')
			.addDropdown(dropdown => dropdown
				.addOption('lowpass', 'Low-pass (warm, removes highs)')
				.addOption('highpass', 'High-pass (bright, removes lows)')
				.addOption('bandpass', 'Band-pass (focused, removes highs & lows)')
				.setValue(effectStates.filter.params.type as string)
				.onChange(async (value: 'lowpass' | 'highpass' | 'bandpass') => {
					effectStates.filter.params.type = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateFilterSettings({ type: value }, instrumentKey);
					}
				}));

		// Initialize visibility states
		reverbSettingsContainer.style.display = effectStates.reverb.enabled ? 'block' : 'none';
		chorusSettingsContainer.style.display = effectStates.chorus.enabled ? 'block' : 'none';
		filterSettingsContainer.style.display = effectStates.filter.enabled ? 'block' : 'none';
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
		// Update effects status for each instrument
		['piano', 'organ', 'strings', 'choir', 'vocalPads', 'pad'].forEach((instrumentKey) => {
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