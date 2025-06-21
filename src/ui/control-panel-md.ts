import { App, Modal, Setting } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger, LoggerFactory, LogLevel } from '../logging';
import { createObsidianToggle } from './components';
import { HarmonicSettings } from '../audio/harmonic-engine';
import { EFFECT_PRESETS, ReverbSettings, ChorusSettings, FilterSettings, getSmartRanges, getParameterRange, INSTRUMENT_INFO } from '../utils/constants';
import { TAB_CONFIGS, setLucideIcon, createLucideIcon, getFamilyIcon, getInstrumentIcon, getEffectIcon, LucideIconName } from './lucide-icons';
import { MaterialCard, StatCard, InstrumentCard, EffectSection, ActionChip, MaterialSlider, MaterialButton, createGrid } from './material-components';
import { PlayButtonManager, PlayButtonState } from './play-button-manager';
import { PlaybackEventType, PlaybackEventData, PlaybackProgressData, PlaybackErrorData } from '../audio/playback-events';

const logger = getLogger('control-panel-md');

/**
 * Sonigraph Control Center Modal
 * Family-based tab structure with Material Design styling
 */
export class MaterialControlPanelModal extends Modal {
	plugin: SonigraphPlugin;
	private statusInterval: number | null = null;
	private activeTab: string = 'status';
	private tabContainer: HTMLElement;
	private contentContainer: HTMLElement;
	private appBar: HTMLElement;
	private drawer: HTMLElement;
	private playButton: HTMLElement;
	private playButtonManager: PlayButtonManager;
	private instrumentToggles: Map<string, HTMLElement> = new Map();
	
	// Phase 3: Progress indication elements
	private progressElement: HTMLElement | null = null;
	private progressText: HTMLElement | null = null;
	private progressBar: HTMLElement | null = null;

	// Issue #006 Fix: Store bound event handlers for proper cleanup
	private boundEventHandlers: {
		handlePlaybackStarted: () => void;
		handlePlaybackEnded: () => void;
		handlePlaybackStopped: () => void;
		handlePlaybackError: (data?: PlaybackEventData) => void;
		handleSequenceProgress: (data?: PlaybackEventData) => void;
	} | null = null;

	constructor(app: App, plugin: SonigraphPlugin) {
		super(app);
		this.plugin = plugin;
		this.playButtonManager = new PlayButtonManager();
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		logger.debug('ui', 'Opening Sonigraph Control Center');

		// Add OSP-prefixed class to the modal
		this.modalEl.addClass('osp-control-center-modal');

		// Issue #006 Fix: Reset play button manager state on open
		if (this.playButtonManager) {
			this.playButtonManager.forceReset();
			logger.debug('ui', 'Play button manager state reset on modal open');
		}

		// Material Design CSS is loaded via styles.css

		// Create modal structure
		this.createModalContainer();
		
		// Start status updates
		this.startStatusUpdates();
	}

	onClose() {
		logger.debug('ui', 'Closing Sonigraph Control Center');
		this.stopStatusUpdates();
		
		// Enhanced Play Button: Cleanup audio engine event listeners
		this.cleanupAudioEngineEventListeners();
		
		// Cleanup play button manager
		if (this.playButtonManager) {
			this.playButtonManager.dispose();
		}
	}


	/**
	 * Create contained modal structure with sticky header
	 */
	private createModalContainer(): void {
		const { contentEl } = this;
		
		// Close button (positioned above header)
		const closeButton = contentEl.createDiv({ cls: 'modal-close-button' });
		closeButton.addEventListener('click', () => this.close());
		
		// Main modal container
		const modalContainer = contentEl.createDiv({ cls: 'osp-modal-container' });
		
		// Sticky header
		this.createStickyHeader(modalContainer);
		
		// Main content area with drawer and content
		const mainContainer = modalContainer.createDiv({ cls: 'osp-main-container' });
		
		// Navigation drawer
		this.createNavigationDrawer(mainContainer);
		
		// Content area
		this.contentContainer = mainContainer.createDiv({ cls: 'osp-content-area' });
		
		// Show initial tab
		this.showTab(this.activeTab);
	}

	/**
	 * Create sticky header with title and action buttons
	 */
	private createStickyHeader(container: HTMLElement): void {
		this.appBar = container.createDiv({ cls: 'osp-sticky-header' });
		
		// Title section
		const titleSection = this.appBar.createDiv({ cls: 'osp-header-title' });
		const titleIcon = createLucideIcon('music', 20);
		titleSection.appendChild(titleIcon);
		titleSection.appendText('Sonigraph Control Center');
		
		// Action buttons section
		const actionsSection = this.appBar.createDiv({ cls: 'osp-header-actions' });
		this.createHeaderActions(actionsSection);
	}

	/**
	 * Create compact header action buttons
	 */
	private createHeaderActions(container: HTMLElement): void {
		// Volume control
		const volumeContainer = container.createDiv({ cls: 'osp-header-volume' });
		const volumeIcon = createLucideIcon('volume-2', 14);
		volumeContainer.appendChild(volumeIcon);
		
		const volumeSlider = new MaterialSlider({
			value: this.plugin.settings.volume || 0.5,
			min: 0,
			max: 1,
			step: 0.1,
			unit: '',
			className: 'osp-header-slider',
			onChange: (value) => this.handleMasterVolumeChange(value)
		});
		volumeContainer.appendChild(volumeSlider.getElement());

		// Play button (first)
		const playBtn = container.createEl('button', { cls: 'osp-header-btn osp-header-btn--primary' });
		this.playButton = playBtn; // Store reference for compatibility
		
		// Initialize enhanced play button manager
		this.playButtonManager.initialize(playBtn);
		
		// Set up state change listener for logging
		this.playButtonManager.onStateChange((state: PlayButtonState) => {
			logger.debug('ui', `Play button state changed: ${state}`);
		});
		
		// Enhanced Play Button: Connect to audio engine events
		this.setupAudioEngineEventListeners();
		
		playBtn.addEventListener('click', () => this.handlePlay());

		// Stop button (second)
		const stopBtn = container.createEl('button', { cls: 'osp-header-btn osp-header-btn--secondary' });
		const stopIcon = createLucideIcon('square', 16);
		stopBtn.appendChild(stopIcon);
		stopBtn.appendText('Stop');
		stopBtn.addEventListener('click', () => this.handleStop());

		// Pause button (third)
		const pauseBtn = container.createEl('button', { cls: 'osp-header-btn osp-header-btn--secondary' });
		const pauseIcon = createLucideIcon('pause', 16);
		pauseBtn.appendChild(pauseIcon);
		pauseBtn.appendText('Pause');
		pauseBtn.addEventListener('click', () => this.handlePause());
	}

	/**
	 * Create navigation drawer
	 */
	private createNavigationDrawer(container: HTMLElement): void {
		this.drawer = container.createDiv({ cls: 'osp-drawer' });
		
		// Drawer header
		const header = this.drawer.createDiv({ cls: 'osp-drawer__header' });
		const headerTitle = header.createDiv({ cls: 'osp-drawer__title' });
		headerTitle.textContent = 'Navigation';
		
		// Drawer content
		const content = this.drawer.createDiv({ cls: 'osp-drawer__content' });
		this.createNavigationList(content);
	}

	/**
	 * Create navigation list with family-based tabs
	 */
	private createNavigationList(container: HTMLElement): void {
		const list = container.createEl('ul', { cls: 'osp-nav-list' });
		
		TAB_CONFIGS.forEach((tabConfig, index) => {
			const listItem = list.createEl('li', { 
				cls: `osp-nav-item ${tabConfig.id === this.activeTab ? 'osp-nav-item--active' : ''}` 
			});
			listItem.setAttribute('data-tab', tabConfig.id);
			
			// Icon
			const graphic = listItem.createDiv({ cls: 'osp-nav-item__icon' });
			setLucideIcon(graphic, tabConfig.icon as LucideIconName, 20);
			
			// Text
			const text = listItem.createDiv({ cls: 'osp-nav-item__text' });
			text.textContent = tabConfig.name;
			
			// Meta (instrument count for family tabs)
			// Only show counts for family tabs (exclude status, musical, master)
			if (!['status', 'musical', 'master'].includes(tabConfig.id)) {
				const meta = listItem.createDiv({ cls: 'osp-nav-item__meta' });
				const enabledCount = this.getEnabledCount(tabConfig.id);
				const totalCount = this.getTotalCount(tabConfig.id);
				meta.textContent = `${enabledCount}/${totalCount}`;
			}
			
			// Add divider after master tab
			if (tabConfig.id === 'master') {
				const divider = container.createDiv({ cls: 'osp-nav-divider' });
			}
			
			// Click handler
			listItem.addEventListener('click', () => {
				this.switchTab(tabConfig.id);
			});
		});
	}

	/**
	 * Update navigation counts without rebuilding the entire drawer
	 */
	private updateNavigationCounts(): void {
		this.drawer.querySelectorAll('.osp-nav-item').forEach(item => {
			const tabId = item.getAttribute('data-tab');
			if (tabId) {
				const tabConfig = TAB_CONFIGS.find(config => config.id === tabId);
				// Only update counts for family tabs (exclude status, musical, master)
				if (tabConfig && !['status', 'musical', 'master'].includes(tabId)) {
					const metaElement = item.querySelector('.osp-nav-item__meta');
					if (metaElement) {
						const enabledCount = this.getEnabledCount(tabId);
						const totalCount = this.getTotalCount(tabId);
						metaElement.textContent = `${enabledCount}/${totalCount}`;
					}
				}
			}
		});
	}

	/**
	 * Switch to a different tab
	 */
	private switchTab(tabId: string): void {
		// Update active state in navigation
		this.drawer.querySelectorAll('.osp-nav-item').forEach(item => {
			item.classList.remove('osp-nav-item--active');
		});
		
		const activeItem = this.drawer.querySelector(`[data-tab="${tabId}"]`);
		if (activeItem) {
			activeItem.classList.add('osp-nav-item--active');
		}
		
		// Update active tab and show content
		this.activeTab = tabId;
		this.showTab(tabId);
	}

	/**
	 * Show content for the specified tab
	 */
	private showTab(tabId: string): void {
		this.contentContainer.empty();
		
		switch (tabId) {
			case 'status':
				this.createStatusTab();
				break;
			case 'musical':
				this.createMusicalTab();
				break;
			case 'master':
				this.createMasterTab();
				break;
			case 'strings':
			case 'woodwinds':
			case 'brass':
			case 'vocals':
			case 'percussion':
			case 'electronic':
			case 'experimental':
				this.createFamilyTab(tabId);
				break;
			default:
				this.createPlaceholderTab(tabId);
		}
	}

	/**
	 * Create Status tab content
	 */
	private createStatusTab(): void {
		// Active Instruments Card
		this.createActiveInstrumentsCard();
		
		// Performance Metrics Card
		this.createPerformanceMetricsCard();
		
		// Audio System Status Card
		this.createAudioSystemCard();
		
		// Global Settings Card (moved from Master tab)
		this.createGlobalSettingsCard();
		
		// Logging Card
		this.createLoggingCard();
	}

	private createActiveInstrumentsCard(): void {
		const card = new MaterialCard({
			title: 'Active Instruments',
			iconName: 'music',
			subtitle: 'Currently enabled instruments and their status',
			elevation: 1
		});

		const content = card.getContent();
		const enabledInstruments = this.getEnabledInstrumentsList();
		
		if (enabledInstruments.length === 0) {
			content.createDiv({ 
				text: 'No instruments currently enabled', 
				cls: 'osp-status-empty' 
			});
		} else {
			enabledInstruments.forEach(instrument => {
				const instrumentRow = content.createDiv({ cls: 'osp-instrument-status-row' });
				
				const icon = createLucideIcon('music', 16);
				instrumentRow.appendChild(icon);
				
				const name = instrumentRow.createSpan({ cls: 'osp-instrument-name' });
				name.textContent = this.capitalizeWords(instrument.name);
				
				const status = instrumentRow.createSpan({ cls: 'osp-instrument-voices' });
				status.textContent = `${instrument.activeVoices}/${instrument.maxVoices} voices`;
			});
		}

		this.contentContainer.appendChild(card.getElement());
	}

	private createPerformanceMetricsCard(): void {
		const card = new MaterialCard({
			title: 'Performance',
			iconName: 'zap',
			subtitle: 'Real-time system performance metrics',
			elevation: 1
		});

		const content = card.getContent();
		
		// Get current status from plugin
		const status = this.plugin.getStatus();
		
		// Compact stats row
		const statsRow = content.createDiv({ cls: 'osp-stats-row' });
		
		const cpuStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		cpuStat.innerHTML = `
			<span class="osp-stat-value">12%</span>
			<span class="osp-stat-label">CPU</span>
		`;
		
		const voicesStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		voicesStat.innerHTML = `
			<span class="osp-stat-value">${status.audio.currentNotes || 0}</span>
			<span class="osp-stat-label">Voices</span>
		`;
		
		const contextStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		const contextValue = status.audio.audioContext || 'Suspended';
		const contextColor = contextValue === 'running' ? 'var(--text-success)' : 'var(--text-warning)';
		contextStat.innerHTML = `
			<span class="osp-stat-value" style="color: ${contextColor}">${contextValue}</span>
			<span class="osp-stat-label">Context</span>
		`;

		this.contentContainer.appendChild(card.getElement());
	}

	private audioModeValueElement: HTMLElement | null = null;

	private createAudioSystemCard(): void {
		const card = new MaterialCard({
			title: 'Audio System',
			iconName: 'settings',
			subtitle: 'Current audio configuration and settings',
			elevation: 1
		});

		const content = card.getContent();
		
		// High Quality Samples Setting (moved from Global Settings)
		createObsidianToggle(
			content,
			this.plugin.settings.useHighQualitySamples,
			(enabled) => this.handleHighQualitySamplesChange(enabled),
			{
				name: 'Use High Quality Samples',
				description: 'Load professional audio recordings when available (19/34 instruments). Uses built-in synthesis for remaining instruments. Audio format chosen automatically.'
			}
		);
		
		const systemInfo = content.createDiv({ cls: 'osp-system-info' });
		systemInfo.style.marginTop = 'var(--md-space-4)';

		// Audio format status
		const formatRow = systemInfo.createDiv({ cls: 'osp-info-row' });
		formatRow.createSpan({ text: 'Audio Mode:', cls: 'osp-info-label' });
		this.audioModeValueElement = formatRow.createSpan({ 
			text: this.plugin.settings.useHighQualitySamples ? 'High Quality Samples' : 'Synthesis Only', 
			cls: 'osp-info-value' 
		});

		// Sample rate (mock for now)
		const sampleRateRow = systemInfo.createDiv({ cls: 'osp-info-row' });
		sampleRateRow.createSpan({ text: 'Sample Rate:', cls: 'osp-info-label' });
		sampleRateRow.createSpan({ text: '44.1 kHz', cls: 'osp-info-value' });

		// Buffer size (mock for now)
		const bufferRow = systemInfo.createDiv({ cls: 'osp-info-row' });
		bufferRow.createSpan({ text: 'Buffer Size:', cls: 'osp-info-label' });
		bufferRow.createSpan({ text: '256 samples', cls: 'osp-info-value' });

		this.contentContainer.appendChild(card.getElement());
	}

	private getEnabledInstrumentsList(): Array<{name: string, activeVoices: number, maxVoices: number}> {
		const enabled: Array<{name: string, activeVoices: number, maxVoices: number}> = [];
		
		Object.entries(this.plugin.settings.instruments).forEach(([key, settings]) => {
			if (settings.enabled) {
				enabled.push({
					name: key,
					activeVoices: this.getInstrumentActiveVoices(key),
					maxVoices: settings.maxVoices
				});
			}
		});
		
		return enabled;
	}

	/**
	 * Create Musical tab content
	 */
	private createMusicalTab(): void {
		// Scale & Key Settings Card
		this.createScaleKeyCard();
		
		// Tempo & Timing Card
		this.createTempoTimingCard();
		
		// Master Tuning Card
		this.createMasterTuningCard();
	}

	private createScaleKeyCard(): void {
		const card = new MaterialCard({
			title: 'Scale & Key Settings',
			iconName: 'music',
			subtitle: 'Musical scale and key signature configuration',
			elevation: 1
		});

		const content = card.getContent();
		const settingsGrid = createGrid('2-col');

		// Scale selection
		const scaleGroup = settingsGrid.createDiv({ cls: 'osp-control-group' });
		scaleGroup.createEl('label', { text: 'Musical scale', cls: 'osp-control-label' });
		const scaleSelect = scaleGroup.createEl('select', { cls: 'osp-select' });
		['Major', 'Minor', 'Dorian', 'Mixolydian', 'Pentatonic'].forEach(scale => {
			const option = scaleSelect.createEl('option', { value: scale.toLowerCase(), text: scale });
			if (scale === 'Major') option.selected = true;
		});

		// Key selection
		const keyGroup = settingsGrid.createDiv({ cls: 'osp-control-group' });
		keyGroup.createEl('label', { text: 'Key signature', cls: 'osp-control-label' });
		const keySelect = keyGroup.createEl('select', { cls: 'osp-select' });
		['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach(key => {
			const option = keySelect.createEl('option', { value: key, text: key });
			if (key === 'C') option.selected = true;
		});

		content.appendChild(settingsGrid);
		this.contentContainer.appendChild(card.getElement());
	}

	private createTempoTimingCard(): void {
		const card = new MaterialCard({
			title: 'Tempo & Timing',
			iconName: 'clock',
			subtitle: 'Playback speed and timing controls',
			elevation: 1
		});

		const content = card.getContent();

		// Tempo slider
		const tempoGroup = content.createDiv({ cls: 'osp-control-group' });
		tempoGroup.createEl('label', { text: 'Tempo (BPM)', cls: 'osp-control-label' });
		
		const tempoSlider = new MaterialSlider({
			value: 120,
			min: 60,
			max: 200,
			step: 5,
			unit: ' BPM',
			onChange: (value) => this.handleTempoChange(value)
		});
		tempoGroup.appendChild(tempoSlider.getElement());

		// Note duration slider
		const durationGroup = content.createDiv({ cls: 'osp-control-group' });
		durationGroup.createEl('label', { text: 'Note Duration', cls: 'osp-control-label' });
		
		const durationSlider = new MaterialSlider({
			value: 0.5,
			min: 0.1,
			max: 2.0,
			step: 0.1,
			unit: 's',
			onChange: (value) => this.handleNoteDurationChange(value)
		});
		durationGroup.appendChild(durationSlider.getElement());

		this.contentContainer.appendChild(card.getElement());
	}

	private createMasterTuningCard(): void {
		const card = new MaterialCard({
			title: 'Master Tuning',
			iconName: 'settings',
			subtitle: 'Global tuning and harmonic settings',
			elevation: 1
		});

		const content = card.getContent();

		// A440 tuning
		const tuningGroup = content.createDiv({ cls: 'osp-control-group' });
		tuningGroup.createEl('label', { text: 'Concert Pitch (A4)', cls: 'osp-control-label' });
		
		const tuningSlider = new MaterialSlider({
			value: 440,
			min: 415,
			max: 466,
			step: 1,
			unit: ' Hz',
			displayValue: '440 Hz',
			onChange: (value) => this.handleTuningChange(value)
		});
		tuningGroup.appendChild(tuningSlider.getElement());

		// Microtuning toggle - using grid layout like instrument toggles
		const microtuningGroup = content.createDiv({ cls: 'control-group control-group--toggle' });
		const microtuningLabel = microtuningGroup.createEl('label', { cls: 'control-label' });
		microtuningLabel.textContent = 'Enable Microtuning';
		
		const controlWrapper = microtuningGroup.createDiv({ cls: 'control-wrapper' });
		const switchContainer = controlWrapper.createDiv({ cls: 'ospcc-switch' });
		switchContainer.setAttribute('title', 'Toggle microtuning precision on/off');
		
		const microtuningToggle = switchContainer.createEl('input', { 
			type: 'checkbox', 
			cls: 'ospcc-switch__input' 
		}) as HTMLInputElement;
		microtuningToggle.checked = this.plugin.settings.microtuning ?? false;
		microtuningToggle.addEventListener('change', () => {
			logger.debug('ui', 'Microtuning toggle changed', { enabled: microtuningToggle.checked });
			this.handleMicrotuningChange(microtuningToggle.checked);
		});
		
		const track = switchContainer.createDiv({ cls: 'ospcc-switch__track' });
		const thumb = track.createDiv({ cls: 'ospcc-switch__thumb' });
		
		// Make the entire switch container clickable
		switchContainer.addEventListener('click', (e) => {
			if (e.target !== microtuningToggle) {
				e.preventDefault();
				microtuningToggle.checked = !microtuningToggle.checked;
				microtuningToggle.dispatchEvent(new Event('change'));
			}
		});

		this.contentContainer.appendChild(card.getElement());
	}

	// Musical parameter handlers
	private handleTempoChange(tempo: number): void {
		logger.info('musical', `Tempo changed to ${tempo} BPM`);
		// Update plugin settings
	}

	private handleNoteDurationChange(duration: number): void {
		logger.info('musical', `Note duration changed to ${duration}s`);
		// Update plugin settings
	}

	private handleTuningChange(frequency: number): void {
		logger.info('musical', `Concert pitch changed to ${frequency} Hz`);
		// Update plugin settings
	}

	private handleMicrotuningChange(enabled: boolean): void {
		logger.info('musical', `Microtuning ${enabled ? 'enabled' : 'disabled'}`);
		// Update plugin settings
		this.plugin.settings.microtuning = enabled;
		this.plugin.saveSettings();
	}
	
	private handleMasterEffectEnabledChange(effectName: string, enabled: boolean): void {
		logger.info('effects', `Master effect ${effectName} ${enabled ? 'enabled' : 'disabled'}`);
		// Initialize effects settings if not present
		if (!this.plugin.settings.effects) {
			this.plugin.settings.effects = {};
		}
		if (!this.plugin.settings.effects[effectName]) {
			this.plugin.settings.effects[effectName] = { enabled: false };
		}
		this.plugin.settings.effects[effectName].enabled = enabled;
		this.plugin.saveSettings();
	}
	
	private handleMasterEffectChange(effectName: string, paramName: string, value: number): void {
		logger.debug('effects', `Master effect ${effectName} ${paramName} changed to ${value}`);
		// Initialize effects settings if not present
		if (!this.plugin.settings.effects) {
			this.plugin.settings.effects = {};
		}
		if (!this.plugin.settings.effects[effectName]) {
			this.plugin.settings.effects[effectName] = { enabled: false };
		}
		this.plugin.settings.effects[effectName][paramName] = value;
		this.plugin.saveSettings();
	}

	private handleHighQualitySamplesChange(enabled: boolean): void {
		logger.info('settings', `High quality samples setting changed to ${enabled}`);
		this.plugin.settings.useHighQualitySamples = enabled;
		this.plugin.saveSettings();
		
		// Update audio engine with new sample setting
		if (this.plugin.audioEngine) {
			this.plugin.audioEngine.updateSettings(this.plugin.settings);
			logger.debug('ui', 'Audio engine settings updated after high quality samples change', { 
				useHighQualitySamples: enabled,
				action: 'high-quality-samples-change'
			});
		}
		
		// Immediately update the audio mode display text
		if (this.audioModeValueElement) {
			this.audioModeValueElement.textContent = enabled ? 'High Quality Samples' : 'Synthesis Only';
		}
	}

	private createGlobalSettingsCard(): void {
		const globalCard = new MaterialCard({
			title: 'Global Settings',
			iconName: 'settings',
			subtitle: 'System configuration and bulk operations',
			elevation: 1
		});
		
		const globalContent = globalCard.getContent();

		// Bulk Action Chips
		const globalChipSet = globalContent.createDiv({ cls: 'ospcc-chip-set' });
		
		const enableAllChip = new ActionChip({
			text: 'Enable All Instruments',
			iconName: 'checkCircle',
			onToggle: (selected) => this.handleGlobalAction('enableAll', selected)
		});
		
		const resetAllChip = new ActionChip({
			text: 'Reset All Settings',
			iconName: 'reset',
			onToggle: (selected) => this.handleGlobalAction('resetAll', selected)
		});
		
		const optimizeChip = new ActionChip({
			text: 'Optimize Performance',
			iconName: 'zap',
			onToggle: (selected) => this.handleGlobalAction('optimize', selected)
		});
		
		globalChipSet.appendChild(enableAllChip.getElement());
		globalChipSet.appendChild(resetAllChip.getElement());
		globalChipSet.appendChild(optimizeChip.getElement());
		
		this.contentContainer.appendChild(globalCard.getElement());
	}

	private createLoggingCard(): void {
		const loggingCard = new MaterialCard({
			title: 'Logging',
			iconName: 'file-text',
			subtitle: 'Debug logging level and log export',
			elevation: 1
		});
		
		const loggingContent = loggingCard.getContent();
		
		// Logging Level Setting
		const logLevelGroup = loggingContent.createDiv({ cls: 'osp-control-group' });
		logLevelGroup.createEl('label', { text: 'Logging Level', cls: 'osp-control-label' });
		const logLevelSelect = logLevelGroup.createEl('select', { cls: 'osp-select' });
		
		const logLevelOptions = [
			{ value: 'off', text: 'Off' },
			{ value: 'error', text: 'Errors Only' },
			{ value: 'warn', text: 'Warnings' },
			{ value: 'info', text: 'Info' },
			{ value: 'debug', text: 'Debug' }
		];
		
		logLevelOptions.forEach(option => {
			const optionEl = logLevelSelect.createEl('option', { value: option.value, text: option.text });
			if (option.value === LoggerFactory.getLogLevel()) optionEl.selected = true;
		});
		
		logLevelSelect.addEventListener('change', () => {
			const newLevel = logLevelSelect.value as LogLevel;
			LoggerFactory.setLogLevel(newLevel);
			logger.info('settings-change', 'Log level changed from Control Center', { level: newLevel });
		});
		
		// Export Logs Action Chip
		const logChipSet = loggingContent.createDiv({ cls: 'ospcc-chip-set' });
		logChipSet.style.marginTop = 'var(--md-space-4)';
		
		const exportLogsChip = new ActionChip({
			text: 'Export Logs',
			iconName: 'download',
			onToggle: (selected) => this.handleExportLogs(selected)
		});
		
		logChipSet.appendChild(exportLogsChip.getElement());
		
		this.contentContainer.appendChild(loggingCard.getElement());
	}

	/**
	 * Create Master tab content
	 */
	private createMasterTab(): void {
		// Master Effects Card
		const masterEffectsCard = new MaterialCard({
			title: 'Master Effects',
			iconName: 'equalizer',
			subtitle: 'Global orchestral processing',
			elevation: 1
		});
		
		const masterContent = masterEffectsCard.getContent();
		
		// Create horizontal effect sections with saved state
		const effects = this.plugin.settings.effects || {};
		
		this.createHorizontalEffectSection(masterContent, 'Orchestral Reverb Hall', 'reverb', 
			effects.orchestralreverbhall?.enabled ?? true, [
			{ name: 'Hall Size', value: effects.orchestralreverbhall?.hallsize ?? 0.8, min: 0, max: 1, step: 0.1, unit: '' },
			{ name: 'Decay Time', value: effects.orchestralreverbhall?.decaytime ?? 3.5, min: 0.5, max: 10, step: 0.1, unit: 's' }
		]);
		
		this.createHorizontalEffectSection(masterContent, '3-Band EQ', 'equalizer', 
			effects['3bandeq']?.enabled ?? true, [
			{ name: 'Bass Boost', value: effects['3bandeq']?.bassboost ?? 0, min: -12, max: 12, step: 1, unit: 'dB' },
			{ name: 'Treble Boost', value: effects['3bandeq']?.trebleboost ?? 0, min: -12, max: 12, step: 1, unit: 'dB' }
		]);
		
		this.createHorizontalEffectSection(masterContent, 'Dynamic Compressor', 'compressor', 
			effects.dynamiccompressor?.enabled ?? false, [
			{ name: 'Threshold', value: effects.dynamiccompressor?.threshold ?? -20, min: -40, max: 0, step: 1, unit: 'dB' },
			{ name: 'Ratio', value: effects.dynamiccompressor?.ratio ?? 4, min: 1, max: 20, step: 1, unit: ':1' }
		]);
		
		// Performance Settings Card
		const performanceCard = new MaterialCard({
			title: 'Performance Optimization',
			iconName: 'zap',
			subtitle: 'CPU monitoring and adaptive quality control',
			elevation: 1
		});
		
		const perfContent = performanceCard.getContent();
		
		// Compact stats row (similar to Status tab Performance card)
		const perfStatsRow = perfContent.createDiv({ cls: 'osp-stats-row' });
		
		const cpuStat = perfStatsRow.createDiv({ cls: 'osp-stat-compact' });
		cpuStat.innerHTML = `
			<span class="osp-stat-value">23%</span>
			<span class="osp-stat-label">CPU Usage</span>
		`;
		
		const voicesStat = perfStatsRow.createDiv({ cls: 'osp-stat-compact' });
		voicesStat.innerHTML = `
			<span class="osp-stat-value">47/128</span>
			<span class="osp-stat-label">Voices</span>
		`;
		
		const qualityStat = perfStatsRow.createDiv({ cls: 'osp-stat-compact' });
		qualityStat.innerHTML = `
			<span class="osp-stat-value" style="color: var(--color-green)">High</span>
			<span class="osp-stat-label">Audio Quality</span>
		`;
		
		this.contentContainer.appendChild(masterEffectsCard.getElement());
		this.contentContainer.appendChild(performanceCard.getElement());
	}


	/**
	 * Create horizontal effect section for Master Effects
	 */
	private createHorizontalEffectSection(container: HTMLElement, effectName: string, iconName: string, enabled: boolean, parameters: any[]): void {
		const section = container.createDiv({ cls: 'osp-effect-section-horizontal' });
		
		// Header with effect name and toggle
		const header = section.createDiv({ cls: 'osp-effect-header-horizontal' });
		
		const titleArea = header.createDiv({ cls: 'osp-effect-title-area' });
		const icon = createLucideIcon(iconName, 16);
		titleArea.appendChild(icon);
		titleArea.appendText(effectName);
		
		// Toggle switch
		const toggleContainer = header.createDiv({ cls: 'ospcc-switch' });
		toggleContainer.setAttribute('title', `Toggle ${effectName} on/off`);
		
		const toggleInput = toggleContainer.createEl('input', { 
			type: 'checkbox', 
			cls: 'ospcc-switch__input' 
		}) as HTMLInputElement;
		toggleInput.checked = enabled;
		toggleInput.addEventListener('change', () => {
			logger.debug('ui', 'Master effect toggle changed', { effectName, enabled: toggleInput.checked });
			this.handleMasterEffectEnabledChange(effectName.toLowerCase().replace(/\s+/g, ''), toggleInput.checked);
		});
		
		const track = toggleContainer.createDiv({ cls: 'ospcc-switch__track' });
		const thumb = track.createDiv({ cls: 'ospcc-switch__thumb' });
		
		// Make the entire switch container clickable
		toggleContainer.addEventListener('click', (e) => {
			if (e.target !== toggleInput) {
				e.preventDefault();
				toggleInput.checked = !toggleInput.checked;
				toggleInput.dispatchEvent(new Event('change'));
			}
		});
		
		// Parameters in horizontal layout
		const paramsContainer = section.createDiv({ cls: 'osp-effect-params-horizontal' });
		
		parameters.forEach(param => {
			const paramGroup = paramsContainer.createDiv({ cls: 'osp-param-group-horizontal' });
			
			const label = paramGroup.createDiv({ cls: 'osp-param-label' });
			label.textContent = param.name;
			
			const sliderContainer = paramGroup.createDiv({ cls: 'osp-param-slider' });
			const slider = new MaterialSlider({
				value: param.value,
				min: param.min,
				max: param.max,
				step: param.step,
				unit: param.unit,
				onChange: (value) => this.handleMasterEffectChange(effectName.toLowerCase().replace(/\s+/g, ''), param.name.toLowerCase().replace(/\s+/g, ''), value)
			});
			sliderContainer.appendChild(slider.getElement());
		});
	}

	/**
	 * Create family tab content (Strings, Woodwinds, etc.)
	 */
	private createFamilyTab(familyId: string): void {
		const tabConfig = TAB_CONFIGS.find(tab => tab.id === familyId);
		if (!tabConfig) return;
		
		// Family Overview Card
		this.createFamilyOverviewCard(familyId, tabConfig);
		
		// Individual Instruments Card
		this.createInstrumentsCard(familyId, tabConfig);
		
		// Family Effects Card
		this.createFamilyEffectsCard(familyId, tabConfig);
	}

	/**
	 * Create family overview card with stats and bulk actions
	 */
	private createFamilyOverviewCard(familyId: string, tabConfig: any): void {
		const card = new MaterialCard({
			title: `${tabConfig.name} Family Overview`,
			iconName: tabConfig.icon,
			subtitle: `${this.getEnabledCount(familyId)} of ${this.getTotalCount(familyId)} instruments enabled`,
			elevation: 1
		});
		
		const content = card.getContent();
		
		// Compact stats row
		const statsRow = content.createDiv({ cls: 'osp-stats-row' });
		
		const enabledStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		enabledStat.innerHTML = `
			<span class="osp-stat-value">${this.getEnabledCount(familyId)}/${this.getTotalCount(familyId)}</span>
			<span class="osp-stat-label">Enabled</span>
		`;
		
		const voicesStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		voicesStat.innerHTML = `
			<span class="osp-stat-value">${this.getActiveVoices(familyId)}</span>
			<span class="osp-stat-label">Voices</span>
		`;
		
		const avgVolumeStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		avgVolumeStat.innerHTML = `
			<span class="osp-stat-value">0.7</span>
			<span class="osp-stat-label">Avg Vol</span>
		`;
		
		// Compact bulk actions
		const actionsRow = content.createDiv({ cls: 'osp-actions-row' });
		
		const enableAllBtn = actionsRow.createEl('button', { 
			cls: 'osp-action-btn osp-action-btn--primary',
			text: 'Enable All'
		});
		enableAllBtn.addEventListener('click', () => this.handleBulkAction(familyId, 'enableAll', true));
		
		const disableAllBtn = actionsRow.createEl('button', { 
			cls: 'osp-action-btn osp-action-btn--secondary',
			text: 'Disable All'
		});
		disableAllBtn.addEventListener('click', () => this.handleBulkAction(familyId, 'disableAll', true));
		
		const resetBtn = actionsRow.createEl('button', { 
			cls: 'osp-action-btn osp-action-btn--secondary',
			text: 'Reset'
		});
		resetBtn.addEventListener('click', () => this.handleBulkAction(familyId, 'resetVolumes', true));
		
		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Create instruments card for family
	 */
	private createInstrumentsCard(familyId: string, tabConfig: any): void {
		const card = new MaterialCard({
			title: 'Individual Instruments',
			iconName: 'music',
			elevation: 1
		});
		
		const content = card.getContent();
		
		// Get instruments for this family
		const instruments = this.getInstrumentsForFamily(familyId);
		
		instruments.forEach(instrument => {
			const settings = this.plugin.settings.instruments?.[instrument as keyof typeof this.plugin.settings.instruments];
			this.createHorizontalInstrumentSection(content, instrument, {
				enabled: settings?.enabled || false,
				volume: settings?.volume || 0.7,
				maxVoices: settings?.maxVoices || 4,
				activeVoices: this.getInstrumentActiveVoices(instrument)
			});
		});
		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Create family effects card
	 */
	private createFamilyEffectsCard(familyId: string, tabConfig: any): void {
		const card = new MaterialCard({
			title: `${tabConfig.name} Effects`,
			iconName: 'activity',
			subtitle: 'Family-wide effect processing',
			elevation: 1
		});
		
		const content = card.getContent();
		const effectsGrid = createGrid('3-col');
		
		// Reverb section
		const reverbSection = new EffectSection({
			effectName: 'Reverb',
			iconName: 'reverb',
			enabled: this.getFamilyEffectState(familyId, 'reverb'),
			parameters: [
				{
					name: 'Decay Time',
					value: 2.5,
					min: 0.1,
					max: 10,
					step: 0.1,
					unit: 's',
					onChange: (value) => this.handleEffectParameterChange(familyId, 'reverb', 'decay', value)
				},
				{
					name: 'Wet Level',
					value: 0.3,
					min: 0,
					max: 1,
					step: 0.1,
					unit: '',
					onChange: (value) => this.handleEffectParameterChange(familyId, 'reverb', 'wet', value)
				}
			],
			onEnabledChange: (enabled) => this.handleEffectEnabledChange(familyId, 'reverb', enabled)
		});
		
		// Chorus section
		const chorusSection = new EffectSection({
			effectName: 'Chorus',
			iconName: 'chorus',
			enabled: this.getFamilyEffectState(familyId, 'chorus'),
			parameters: [
				{
					name: 'Rate',
					value: 1.5,
					min: 0.1,
					max: 10,
					step: 0.1,
					unit: 'Hz',
					onChange: (value) => this.handleEffectParameterChange(familyId, 'chorus', 'frequency', value)
				},
				{
					name: 'Depth',
					value: 0.4,
					min: 0,
					max: 1,
					step: 0.1,
					unit: '',
					onChange: (value) => this.handleEffectParameterChange(familyId, 'chorus', 'depth', value)
				}
			],
			onEnabledChange: (enabled) => this.handleEffectEnabledChange(familyId, 'chorus', enabled)
		});
		
		// Filter section
		const filterSection = new EffectSection({
			effectName: 'Filter',
			iconName: 'filter',
			enabled: false,
			parameters: [
				{
					name: 'Frequency',
					value: 800,
					min: 20,
					max: 20000,
					step: 10,
					unit: 'Hz',
					onChange: (value) => this.handleEffectParameterChange(familyId, 'filter', 'frequency', value)
				},
				{
					name: 'Resonance',
					value: 1.0,
					min: 0.1,
					max: 30,
					step: 0.1,
					unit: '',
					onChange: (value) => this.handleEffectParameterChange(familyId, 'filter', 'Q', value)
				}
			],
			onEnabledChange: (enabled) => this.handleEffectEnabledChange(familyId, 'filter', enabled)
		});
		
		effectsGrid.appendChild(reverbSection.getElement());
		effectsGrid.appendChild(chorusSection.getElement());
		effectsGrid.appendChild(filterSection.getElement());
		
		content.appendChild(effectsGrid);
		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Create placeholder tab for future implementation
	 */
	private createPlaceholderTab(tabId: string): void {
		const tabConfig = TAB_CONFIGS.find(tab => tab.id === tabId);
		const card = this.createCard(
			tabConfig?.name || 'Tab', 
			tabConfig?.icon as LucideIconName || 'settings', 
			'This tab is under development'
		);
		
		const content = card.querySelector('.ospcc-card__content') as HTMLElement;
		content.textContent = `${tabConfig?.name || 'This'} tab functionality will be implemented soon...`;
		
		this.contentContainer.appendChild(card);
	}

	/**
	 * Utility method to create basic cards for simple tabs
	 */
	private createCard(title: string, iconName: LucideIconName, subtitle: string): HTMLElement {
		const card = new MaterialCard({
			title,
			iconName,
			subtitle,
			elevation: 1
		});
		
		return card.getElement();
	}


	// Utility methods
	private getEnabledCount(familyId: string): number {
		const instruments = this.getInstrumentsForFamily(familyId);
		const enabledInstruments = instruments.filter(inst => {
			const settings = this.plugin.settings.instruments?.[inst as keyof typeof this.plugin.settings.instruments];
			const isEnabled = settings?.enabled;
			
			// Debug logging for troubleshooting specific families
			if (familyId === 'strings' || familyId === 'woodwinds') {
				logger.debug('ui', 'Checking family instrument enabled state', { 
					familyId,
					instrument: inst, 
					hasSettings: !!settings, 
					isEnabled: isEnabled,
					action: 'count-enabled-instruments'
				});
			}
			
			return isEnabled;
		});
		
		if (familyId === 'strings' || familyId === 'woodwinds') {
			logger.debug('ui', 'Family enabled count result', { 
				familyId,
				totalInstruments: instruments.length,
				enabledCount: enabledInstruments.length,
				instruments: instruments,
				enabledInstruments: enabledInstruments,
				action: 'family-enabled-count'
			});
		}
		
		return enabledInstruments.length;
	}

	/**
	 * Get total count of instruments available in a family
	 * @param familyId - The family identifier
	 * @returns Total number of instruments in the family
	 */
	private getTotalCount(familyId: string): number {
		const instruments = this.getInstrumentsForFamily(familyId);
		return instruments.length;
	}

	private getActiveVoices(familyId: string): number {
		// Calculate total max voices for enabled instruments in this family
		const instruments = this.getInstrumentsForFamily(familyId);
		let totalVoices = 0;
		
		instruments.forEach(instrument => {
			const settings = this.plugin.settings.instruments?.[instrument as keyof typeof this.plugin.settings.instruments];
			if (settings?.enabled) {
				totalVoices += settings.maxVoices || 0;
			}
		});
		
		return totalVoices;
	}

	private getInstrumentsForFamily(familyId: string): string[] {
		// Let's determine the family mapping dynamically based on what actually exists in settings
		const allInstruments = Object.keys(this.plugin.settings.instruments);
		logger.debug('ui', 'All available instruments in settings', { 
			allInstruments, 
			totalCount: allInstruments.length,
			action: 'get-family-instruments'
		});
		
		const familyMap: Record<string, string[]> = {
			// Based on actual instruments defined in DEFAULT_SETTINGS
			strings: ['strings', 'violin', 'cello', 'harp', 'piano', 'guitar'], 
			woodwinds: ['flute', 'clarinet', 'saxophone', 'oboe'],
			brass: ['trumpet', 'frenchHorn', 'trombone', 'tuba'],
			vocals: ['choir', 'vocalPads', 'soprano', 'alto', 'tenor', 'bass'], // All vocal instruments including choir and pads
			percussion: ['timpani', 'xylophone', 'vibraphone', 'gongs'],
			electronic: ['leadSynth', 'bassSynth', 'arpSynth', 'pad'], // All electronic instruments including pad
			experimental: ['whaleHumpback'],
			// Additional families for other instruments
			keyboard: ['piano', 'organ', 'electricPiano', 'harpsichord', 'accordion', 'celesta']
		};
		
		const familyInstruments = familyMap[familyId] || [];
		
		// Filter to only include instruments that actually exist in settings
		const validInstruments = familyInstruments.filter(inst => 
			allInstruments.includes(inst)
		);
		
		const invalidInstruments = familyInstruments.filter(inst => 
			!allInstruments.includes(inst)
		);
		
		if (invalidInstruments.length > 0) {
			logger.warn('ui', 'Family mapping includes non-existent instruments', { 
				familyId, 
				invalidInstruments, 
				validInstruments,
				allAvailableInstruments: allInstruments,
				action: 'validate-family-mapping'
			});
		}
		
		logger.debug('ui', 'Family instrument mapping', { 
			familyId, 
			requestedInstruments: familyInstruments,
			validInstruments, 
			invalidInstruments,
			validCount: validInstruments.length,
			invalidCount: invalidInstruments.length,
			action: 'family-mapping-result'
		});
		
		return validInstruments;
	}

	// Event handlers
	private handlePause(): void {
		logger.info('ui', 'Pause clicked');
		this.playButtonManager.setState('paused');
		this.plugin.stopPlayback();
	}

	private async handleResume(): Promise<void> {
		logger.info('ui', 'Resume clicked');
		
		// TODO: Implement actual resume functionality in audio engine
		// For now, just restart playback from the beginning
		this.playButtonManager.setState('loading', 'starting');
		
		try {
			// Audio engine will emit 'playback-started' event on success
			await this.plugin.playSequence();
		} catch (error) {
			logger.error('ui', 'Failed to resume sequence', error);
			// Audio engine should emit 'playback-error' event, but fallback to idle if not
			this.playButtonManager.setState('idle');
		}
	}

	private handleStop(): void {
		logger.info('ui', 'Stop clicked');
		this.playButtonManager.setState('stopping');
		
		// Audio engine will emit 'playback-stopped' event which will transition to idle
		this.plugin.stopPlayback();
	}

	private async handlePlay(): Promise<void> {
		logger.info('ui', 'Play clicked');
		
		const currentState = this.playButtonManager.getCurrentState();
		
		// Handle different states
		if (currentState === 'playing') {
			// If playing, pause the playback
			this.handlePause();
			return;
		} else if (currentState === 'paused') {
			// If paused, resume playback
			this.handleResume();
			return;
		} else if (currentState === 'loading' || currentState === 'stopping') {
			// Ignore clicks during loading or stopping
			return;
		}
		
		// Start playback from idle state
		this.playButtonManager.setState('loading', 'analyzing');
		
		try {
			// Show detailed loading stages for better UX
			this.playButtonManager.setLoadingSubstate('analyzing');
			await new Promise(resolve => setTimeout(resolve, 200)); // Brief delay for UX
			
			this.playButtonManager.setLoadingSubstate('generating');
			await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UX
			
			this.playButtonManager.setLoadingSubstate('initializing');
			await new Promise(resolve => setTimeout(resolve, 200)); // Brief delay for UX
			
			this.playButtonManager.setLoadingSubstate('starting');
			
			// Start playback - audio engine will emit 'playback-started' event
			// which will automatically transition button to 'playing' state
			await this.plugin.playSequence();
			
		} catch (error) {
			logger.error('ui', 'Failed to play sequence', error);
			// Reset to idle state on error (if audio engine doesn't emit error event)
			this.playButtonManager.setState('idle');
			// TODO: Show user notification about the error
		}
	}


	private handleMasterVolumeChange(volume: number): void {
		logger.info('ui', `Master volume changed to ${volume}`);
		this.plugin.settings.volume = volume;
		this.plugin.saveSettings();
	}

	/**
	 * Enhanced Play Button: Audio Engine Event Integration
	 */
	
	private setupAudioEngineEventListeners(): void {
		if (!this.plugin.audioEngine) {
			logger.warn('ui', 'Cannot setup audio event listeners: AudioEngine not available');
			return;
		}

		// Issue #006 Fix: Prevent double-setup of event listeners
		if (this.boundEventHandlers) {
			logger.debug('ui', 'Audio engine event listeners already configured, skipping setup');
			return;
		}

		// Issue #006 Fix: Store bound event handlers for proper cleanup
		this.boundEventHandlers = {
			handlePlaybackStarted: this.handlePlaybackStarted.bind(this),
			handlePlaybackEnded: this.handlePlaybackEnded.bind(this),
			handlePlaybackStopped: this.handlePlaybackStopped.bind(this),
			handlePlaybackError: this.handlePlaybackError.bind(this),
			handleSequenceProgress: this.handleSequenceProgress.bind(this)
		};

		// Listen for playback events from audio engine using stored bound handlers
		this.plugin.audioEngine.on('playback-started', this.boundEventHandlers.handlePlaybackStarted);
		this.plugin.audioEngine.on('playback-ended', this.boundEventHandlers.handlePlaybackEnded);
		this.plugin.audioEngine.on('playback-stopped', this.boundEventHandlers.handlePlaybackStopped);
		this.plugin.audioEngine.on('playback-error', this.boundEventHandlers.handlePlaybackError);
		this.plugin.audioEngine.on('sequence-progress', this.boundEventHandlers.handleSequenceProgress);

		logger.debug('ui', 'Audio engine event listeners configured with bound handlers');
	}

	private cleanupAudioEngineEventListeners(): void {
		if (!this.plugin.audioEngine || !this.boundEventHandlers) {
			return;
		}

		// Issue #006 Fix: Remove only this modal's specific bound handlers
		this.plugin.audioEngine.off('playback-started', this.boundEventHandlers.handlePlaybackStarted);
		this.plugin.audioEngine.off('playback-ended', this.boundEventHandlers.handlePlaybackEnded);
		this.plugin.audioEngine.off('playback-stopped', this.boundEventHandlers.handlePlaybackStopped);
		this.plugin.audioEngine.off('playback-error', this.boundEventHandlers.handlePlaybackError);
		this.plugin.audioEngine.off('sequence-progress', this.boundEventHandlers.handleSequenceProgress);

		// Clear the stored handlers
		this.boundEventHandlers = null;

		logger.debug('ui', 'Audio engine event listeners cleaned up (specific handlers only)');
	}

	private handlePlaybackStarted(): void {
		logger.debug('ui', 'Audio engine playback started - switching to playing state');
		this.playButtonManager.setState('playing');
		
		// Phase 3: Show progress indication
		this.showProgressIndication();
	}

	private handlePlaybackEnded(): void {
		logger.debug('ui', 'Audio engine playback ended - switching to idle state');
		this.playButtonManager.setState('idle');
		
		// Phase 3: Hide progress indication
		this.hideProgressIndication();
	}

	private handlePlaybackStopped(): void {
		logger.debug('ui', 'Audio engine playback stopped - switching to idle state');
		this.playButtonManager.setState('idle');
		
		// Phase 3: Hide progress indication
		this.hideProgressIndication();
	}

	private handlePlaybackError(data?: PlaybackEventData): void {
		const errorData = data as PlaybackErrorData;
		logger.error('ui', 'Audio engine playback error', {
			error: errorData?.error?.message,
			context: errorData?.context
		});
		
		// Reset to idle state on error
		this.playButtonManager.setState('idle');
		
		// Phase 3: Hide progress indication on error
		this.hideProgressIndication();
		
		// TODO: Show user notification about the error
		// Could use Obsidian's Notice API or a custom error display
	}

	private handleSequenceProgress(data?: PlaybackEventData): void {
		const progressData = data as PlaybackProgressData;
		if (progressData) {
			logger.debug('ui', 'Sequence progress update', {
				percent: progressData.percentComplete.toFixed(1),
				currentNote: progressData.currentIndex,
				totalNotes: progressData.totalNotes
			});
			
			// Phase 3: Update progress indication in UI
			this.updateProgressIndication(progressData);
		}
	}

	private startStatusUpdates(): void {
		// Implement status updates
	}

	private stopStatusUpdates(): void {
		if (this.statusInterval) {
			clearInterval(this.statusInterval);
			this.statusInterval = null;
		}
	}

	/**
	 * Phase 3: Progress indication methods
	 */
	private showProgressIndication(): void {
		if (!this.playButton) return;

		// Create progress container if it doesn't exist
		if (!this.progressElement) {
			this.progressElement = this.playButton.createDiv({ cls: 'osp-play-progress' });
			
			// Progress bar
			this.progressBar = this.progressElement.createDiv({ cls: 'osp-progress-bar' });
			this.progressBar.createDiv({ cls: 'osp-progress-fill' });
			
			// Progress text
			this.progressText = this.progressElement.createDiv({ 
				cls: 'osp-progress-text',
				text: 'Starting...'
			});
		}

		// Show with smooth transition
		this.progressElement.addClass('osp-progress--visible');
		logger.debug('ui', 'Progress indication shown');
	}

	private hideProgressIndication(): void {
		if (this.progressElement) {
			// Hide with smooth transition
			this.progressElement.removeClass('osp-progress--visible');
			
			// Remove after transition
			setTimeout(() => {
				if (this.progressElement && this.progressElement.parentNode) {
					this.progressElement.remove();
					this.progressElement = null;
					this.progressBar = null;
					this.progressText = null;
				}
			}, 300); // Match CSS transition duration
		}
		logger.debug('ui', 'Progress indication hidden');
	}

	private updateProgressIndication(progressData: PlaybackProgressData): void {
		if (!this.progressElement || !this.progressBar || !this.progressText) return;

		// Update progress bar
		const progressFill = this.progressBar.querySelector('.osp-progress-fill') as HTMLElement;
		if (progressFill) {
			progressFill.style.width = `${Math.min(progressData.percentComplete, 100)}%`;
		}

		// Update progress text
		const currentMinutes = Math.floor(progressData.elapsedTime / 60000);
		const currentSeconds = Math.floor((progressData.elapsedTime % 60000) / 1000);
		const totalMinutes = Math.floor(progressData.estimatedTotalTime / 60000);
		const totalSeconds = Math.floor((progressData.estimatedTotalTime % 60000) / 1000);
		
		const timeString = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
		
		this.progressText.textContent = `Playing: ${progressData.currentIndex}/${progressData.totalNotes} notes (${timeString})`;

		// Add subtle pulse animation when nearing completion
		if (progressData.percentComplete > 90) {
			this.progressElement.addClass('osp-progress--finishing');
		} else {
			this.progressElement.removeClass('osp-progress--finishing');
		}
	}

	// Event handlers for component interactions
	private handleBulkAction(familyId: string, action: string, selected: boolean): void {
		logger.info('ui', `Bulk action: ${action} for ${familyId}`, { selected });
		
		const instruments = this.getInstrumentsForFamily(familyId);
		
		switch (action) {
			case 'enableAll':
				if (selected) {
					logger.debug('ui', 'Enabling all instruments in family', { 
						familyId, 
						instruments, 
						action: 'enable-all-start',
						instrumentCount: instruments.length 
					});
					instruments.forEach(instrument => {
						const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
						if (this.plugin.settings.instruments[instrumentKey]) {
							this.plugin.settings.instruments[instrumentKey].enabled = true;
						}
					});
					
					// Update audio engine with new settings
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateSettings(this.plugin.settings);
						logger.debug('ui', 'Audio engine settings updated after bulk enable', { 
							familyId, 
							action: 'bulk-enable-audio-update' 
						});
					}
				}
				break;
			case 'disableAll':
				if (selected) {
					logger.debug('ui', 'Disabling all instruments in family', { 
						familyId, 
						instruments, 
						action: 'disable-all-start',
						instrumentCount: instruments.length 
					});
					instruments.forEach(instrument => {
						const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
						const settings = this.plugin.settings.instruments[instrumentKey];
						
						if (settings) {
							logger.debug('ui', 'Disabling instrument', { 
								instrument, 
								wasEnabled: settings.enabled,
								action: 'disable-instrument'
							});
							
							// Disable the instrument
							const wasEnabled = settings.enabled;
							settings.enabled = false;
							
							// Extra logging for piano specifically
							if (instrument === 'piano') {
								logger.info('ui', 'Piano specifically disabled', {
									instrument: 'piano',
									wasEnabled: wasEnabled,
									nowEnabled: settings.enabled,
									action: 'disable-piano-specifically'
								});
							}
							
							// Also disable all individual instrument effects
							if (settings.effects) {
								settings.effects.reverb.enabled = false;
								settings.effects.chorus.enabled = false;
								settings.effects.filter.enabled = false;
							}
						} else {
							logger.warn('ui', 'Instrument not found in settings', { 
								instrument, 
								availableInstruments: Object.keys(this.plugin.settings.instruments),
								action: 'disable-all-missing-instrument',
								familyId
							});
						}
					});
					
					// After disabling, let's check what's actually still enabled
					logger.debug('ui', 'After disable all, checking remaining enabled instruments', { familyId });
					const allInstrumentKeys = Object.keys(this.plugin.settings.instruments);
					const stillEnabled = allInstrumentKeys.filter(key => {
						const settings = this.plugin.settings.instruments[key as keyof typeof this.plugin.settings.instruments];
						return settings?.enabled;
					});
					
					logger.debug('ui', 'Instruments still enabled after disable all', { 
						familyId, 
						stillEnabledInstruments: stillEnabled,
						totalEnabledCount: stillEnabled.length,
						action: 'disable-all-complete'
					});
					
					// Update audio engine with new settings
					if (this.plugin.audioEngine) {
						this.plugin.audioEngine.updateSettings(this.plugin.settings);
						logger.debug('ui', 'Audio engine settings updated after bulk disable', { 
							familyId, 
							action: 'bulk-disable-audio-update' 
						});
					}
					
					// Note: Family effects will automatically appear disabled since no instruments have effects enabled
				}
				break;
			case 'resetVolumes':
				if (selected) {
					instruments.forEach(instrument => {
						const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
						if (this.plugin.settings.instruments[instrumentKey]) {
							this.plugin.settings.instruments[instrumentKey].volume = 0.7;
						}
					});
				}
				break;
			case 'defaultEffects':
				if (selected) {
					// Reset effects to default values for this family
					// Implementation would reset family-wide effects
				}
				break;
		}
		
		// Save settings and refresh UI
		this.plugin.saveSettings();
		this.updateNavigationCounts(); // Update tab counts in navigation drawer
		this.showTab(familyId); // Refresh the current tab
	}

	private handleInstrumentEnabledChange(instrument: string, enabled: boolean): void {
		logger.info('ui', `Instrument ${instrument} enabled changed`, { enabled });
		
		const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
		if (this.plugin.settings.instruments[instrumentKey]) {
			this.plugin.settings.instruments[instrumentKey].enabled = enabled;
			this.plugin.saveSettings();
		}
		
		// Update navigation counts immediately
		this.updateNavigationCounts();
		
		// Update audio engine if available
		if (this.plugin.audioEngine) {
			this.plugin.audioEngine.updateSettings(this.plugin.settings);
			logger.debug('ui', 'Audio engine settings updated after instrument enable/disable', { 
				instrument, 
				enabled 
			});
		}
	}

	private handleInstrumentVolumeChange(instrument: string, volume: number): void {
		logger.debug('ui', `Instrument ${instrument} volume changed`, { volume });
		
		const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
		if (this.plugin.settings.instruments[instrumentKey]) {
			this.plugin.settings.instruments[instrumentKey].volume = volume;
			this.plugin.saveSettings();
		}
		
		// Update audio engine if available
		if (this.plugin.audioEngine) {
			// Audio engine would handle the volume change
		}
	}

	private handleInstrumentMaxVoicesChange(instrument: string, maxVoices: number): void {
		logger.debug('ui', `Instrument ${instrument} max voices changed`, { maxVoices });
		
		const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
		if (this.plugin.settings.instruments[instrumentKey]) {
			this.plugin.settings.instruments[instrumentKey].maxVoices = maxVoices;
			this.plugin.saveSettings();
		}
	}

	private handleEffectEnabledChange(familyId: string, effectType: string, enabled: boolean): void {
		logger.info('ui', `Effect ${effectType} for ${familyId} enabled changed`, { enabled });
		
		// Implementation would update family-wide effect settings
		const instruments = this.getInstrumentsForFamily(familyId);
		instruments.forEach(instrument => {
			const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
			const settings = this.plugin.settings.instruments[instrumentKey];
			if (settings && settings.effects) {
				if (!settings.effects[effectType as keyof typeof settings.effects]) {
					// Initialize effect if it doesn't exist
					(settings.effects as any)[effectType] = {
						enabled: enabled,
						params: this.getDefaultEffectParams(effectType)
					};
				} else {
					(settings.effects as any)[effectType].enabled = enabled;
				}
			}
		});
		
		this.plugin.saveSettings();
	}

	private handleEffectParameterChange(familyId: string, effectType: string, parameter: string, value: number): void {
		logger.debug('ui', `Effect ${effectType} parameter ${parameter} changed for ${familyId}`, { value });
		
		// Implementation would update family-wide effect parameters
		const instruments = this.getInstrumentsForFamily(familyId);
		instruments.forEach(instrument => {
			const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
			const settings = this.plugin.settings.instruments[instrumentKey];
			if (settings && settings.effects) {
				if (!(settings.effects as any)[effectType]) {
					(settings.effects as any)[effectType] = {
						enabled: true,
						params: this.getDefaultEffectParams(effectType)
					};
				}
				
				(settings.effects as any)[effectType].params[parameter] = value;
			}
		});
		
		this.plugin.saveSettings();
	}

	private getDefaultEffectParams(effectType: string): any {
		switch (effectType) {
			case 'reverb':
				return { decay: 2.0, preDelay: 0.1, wet: 0.3 };
			case 'chorus':
				return { frequency: 1.0, depth: 0.3, delayTime: 0.02, feedback: 0.1 };
			case 'filter':
				return { frequency: 1000, Q: 1.0, type: 'lowpass' };
			default:
				return {};
		}
	}

	private getInstrumentActiveVoices(instrument: string): number {
		// Mock implementation - would get actual voice count from audio engine
		const settings = this.plugin.settings.instruments?.[instrument as keyof typeof this.plugin.settings.instruments];
		if (settings?.enabled) {
			return Math.floor(Math.random() * (settings.maxVoices || 4));
		}
		return 0;
	}

	/**
	 * Create horizontal instrument section similar to effect sections
	 */
	private createHorizontalInstrumentSection(container: HTMLElement, instrumentName: string, options: {
		enabled: boolean;
		volume: number;
		maxVoices: number;
		activeVoices: number;
	}): void {
		const section = container.createDiv({ cls: 'osp-effect-section-horizontal' });
		
		// Header with instrument name and toggle
		const header = section.createDiv({ cls: 'osp-effect-header-horizontal' });
		
		const title = header.createDiv({ cls: 'osp-effect-title-area' });
		const icon = createLucideIcon(getInstrumentIcon(instrumentName), 20);
		title.appendChild(icon);
		title.appendText(this.capitalizeWords(instrumentName));
		
		// Enable toggle
		const toggleContainer = header.createDiv({ cls: 'ospcc-switch' });
		toggleContainer.setAttribute('data-tooltip', `Toggle ${this.capitalizeWords(instrumentName)} on/off`);
		toggleContainer.setAttribute('title', `Toggle ${this.capitalizeWords(instrumentName)} on/off`);
		
		const toggleInput = toggleContainer.createEl('input', { 
			type: 'checkbox', 
			cls: 'ospcc-switch__input' 
		}) as HTMLInputElement;
		toggleInput.checked = options.enabled;
		toggleInput.addEventListener('change', () => {
			logger.debug('ui', 'Instrument toggle changed', { instrumentName, enabled: toggleInput.checked });
			this.handleInstrumentEnabledChange(instrumentName, toggleInput.checked);
		});
		
		const track = toggleContainer.createDiv({ cls: 'ospcc-switch__track' });
		const thumb = track.createDiv({ cls: 'ospcc-switch__thumb' });
		
		// Make the entire switch container clickable
		toggleContainer.addEventListener('click', (e) => {
			if (e.target !== toggleInput) {
				e.preventDefault();
				toggleInput.checked = !toggleInput.checked;
				toggleInput.dispatchEvent(new Event('change'));
			}
		});
		
		// Parameters in horizontal layout
		const paramsContainer = section.createDiv({ cls: 'osp-effect-params-horizontal' });
		
		// Volume parameter
		const volumeGroup = paramsContainer.createDiv({ cls: 'osp-param-group-horizontal' });
		const volumeLabel = volumeGroup.createDiv({ cls: 'osp-param-label' });
		volumeLabel.textContent = 'Volume';
		
		const volumeSliderContainer = volumeGroup.createDiv({ cls: 'osp-param-slider' });
		const volumeSlider = new MaterialSlider({
			value: options.volume,
			min: 0,
			max: 1,
			step: 0.1,
			unit: '',
			onChange: (value) => this.handleInstrumentVolumeChange(instrumentName, value)
		});
		volumeSliderContainer.appendChild(volumeSlider.getElement());
		
		// Max Voices parameter
		const voicesGroup = paramsContainer.createDiv({ cls: 'osp-param-group-horizontal' });
		const voicesLabel = voicesGroup.createDiv({ cls: 'osp-param-label' });
		voicesLabel.textContent = 'Max Voices';
		
		const voicesSliderContainer = voicesGroup.createDiv({ cls: 'osp-param-slider' });
		const voicesSlider = new MaterialSlider({
			value: options.maxVoices,
			min: 1,
			max: 8,
			step: 1,
			unit: '',
			onChange: (value) => this.handleInstrumentMaxVoicesChange(instrumentName, Math.round(value))
		});
		voicesSliderContainer.appendChild(voicesSlider.getElement());
		
		// Effect toggles section
		const effectsGroup = paramsContainer.createDiv({ cls: 'osp-param-group-horizontal osp-effects-toggles' });
		const effectsLabel = effectsGroup.createDiv({ cls: 'osp-param-label' });
		effectsLabel.textContent = 'Effects';
		
		const effectsContainer = effectsGroup.createDiv({ cls: 'osp-effects-container' });
		
		// Get current instrument settings
		const instrumentSettings = this.plugin.settings.instruments?.[instrumentName as keyof typeof this.plugin.settings.instruments];
		
		// Reverb toggle
		this.createEffectToggle(effectsContainer, 'Reverb', 'reverb', instrumentName, instrumentSettings?.effects?.reverb?.enabled || false);
		
		// Chorus toggle  
		this.createEffectToggle(effectsContainer, 'Chorus', 'chorus', instrumentName, instrumentSettings?.effects?.chorus?.enabled || false);
		
		// Filter toggle
		this.createEffectToggle(effectsContainer, 'Filter', 'filter', instrumentName, instrumentSettings?.effects?.filter?.enabled || false);
	}

	/**
	 * Create individual effect toggle for instruments
	 */
	private createEffectToggle(container: HTMLElement, effectName: string, effectKey: string, instrumentName: string, enabled: boolean): void {
		const toggleGroup = container.createDiv({ cls: 'osp-effect-toggle-group' });
		
		const label = toggleGroup.createDiv({ cls: 'osp-effect-toggle-label' });
		label.textContent = effectName;
		
		const toggleContainer = toggleGroup.createDiv({ cls: 'ospcc-switch osp-effect-toggle' });
		toggleContainer.setAttribute('data-tooltip', `Toggle ${effectName} for ${this.capitalizeWords(instrumentName)}`);
		toggleContainer.setAttribute('title', `Toggle ${effectName} for ${this.capitalizeWords(instrumentName)}`);
		
		const toggleInput = toggleContainer.createEl('input', { 
			type: 'checkbox', 
			cls: 'ospcc-switch__input' 
		}) as HTMLInputElement;
		toggleInput.checked = enabled;
		toggleInput.addEventListener('change', (e) => {
			this.handleInstrumentEffectChange(instrumentName, effectKey, toggleInput.checked);
		});
		
		const track = toggleContainer.createDiv({ cls: 'ospcc-switch__track' });
		const thumb = track.createDiv({ cls: 'ospcc-switch__thumb' });
		
		// Make the entire switch container clickable
		toggleContainer.addEventListener('click', (e) => {
			if (e.target !== toggleInput) {
				e.preventDefault();
				toggleInput.checked = !toggleInput.checked;
				toggleInput.dispatchEvent(new Event('change'));
			}
		});
	}

	/**
	 * Handle individual instrument effect toggle changes
	 */
	private handleInstrumentEffectChange(instrumentName: string, effectKey: string, enabled: boolean): void {
		logger.info('ui', `Instrument ${instrumentName} effect ${effectKey} changed`, { enabled });
		
		const instrumentKey = instrumentName as keyof typeof this.plugin.settings.instruments;
		const instrumentSettings = this.plugin.settings.instruments[instrumentKey];
		
		if (instrumentSettings && instrumentSettings.effects) {
			// Update the specific effect's enabled state
			switch (effectKey) {
				case 'reverb':
					instrumentSettings.effects.reverb.enabled = enabled;
					break;
				case 'chorus':
					instrumentSettings.effects.chorus.enabled = enabled;
					break;
				case 'filter':
					instrumentSettings.effects.filter.enabled = enabled;
					break;
			}
			
			// Save settings
			this.plugin.saveSettings();
			
			// Update audio engine if available
			if (this.plugin.audioEngine) {
				// Audio engine would handle the effect enable/disable
				logger.debug('ui', `Audio engine would update ${effectKey} for ${instrumentName}`, { enabled });
			}
		} else {
			logger.warn('ui', `Could not find settings for instrument ${instrumentName}`);
		}
	}

	/**
	 * Get the family-wide effect state based on instrument effect states
	 * Returns true if any instrument in the family has the effect enabled
	 */
	private getFamilyEffectState(familyId: string, effectType: string): boolean {
		const instruments = this.getInstrumentsForFamily(familyId);
		
		return instruments.some(instrument => {
			const instrumentKey = instrument as keyof typeof this.plugin.settings.instruments;
			const settings = this.plugin.settings.instruments[instrumentKey];
			
			if (settings && settings.effects) {
				switch (effectType) {
					case 'reverb':
						return settings.effects.reverb?.enabled || false;
					case 'chorus':
						return settings.effects.chorus?.enabled || false;
					case 'filter':
						return settings.effects.filter?.enabled || false;
					default:
						return false;
				}
			}
			return false;
		});
	}

	private capitalizeWords(str: string): string {
		return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
	}


	private handleGlobalAction(action: string, selected: boolean): void {
		logger.info('ui', `Global action: ${action}`, { selected });
		
		switch (action) {
			case 'enableAll':
				if (selected) {
					// Enable all instruments across all families
					Object.keys(this.plugin.settings.instruments).forEach(instrumentKey => {
							const key = instrumentKey as keyof typeof this.plugin.settings.instruments;
							this.plugin.settings.instruments[key].enabled = true;
					});
				}
				break;
			case 'resetAll':
				if (selected) {
					// Reset all settings to defaults
					// Implementation would reset to DEFAULT_SETTINGS
				}
				break;
			case 'optimize':
				if (selected) {
					// Run performance optimization
					// Implementation would optimize voice allocation, enable adaptive quality, etc.
				}
				break;
		}
		
		if (selected) {
			this.plugin.saveSettings();
			// Refresh current tab to show updated state
			this.showTab(this.activeTab);
		}
	}

	private handleExportLogs(selected: boolean): void {
		if (selected) {
			logger.info('ui', 'Exporting logs from Control Center');
			
			const now = new Date();
			const pad = (n: number) => n.toString().padStart(2, '0');
			const filename = `osp-logs-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
			const logs = LoggerFactory.getLogs();
			const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			logger.info('export', 'Logs exported from Control Center', { filename });
		}
	}
}