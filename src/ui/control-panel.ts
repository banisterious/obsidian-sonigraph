import { App, Modal, Setting, Notice, requestUrl } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger, LoggerFactory, LogLevel } from '../logging';
import { createObsidianToggle } from './components';
import { HarmonicSettings } from '../audio/harmonic-engine';
import { EFFECT_PRESETS, ReverbSettings, ChorusSettings, FilterSettings, getSmartRanges, getParameterRange, INSTRUMENT_INFO } from '../utils/constants';
import { TAB_CONFIGS, setLucideIcon, createLucideIcon, getFamilyIcon, getInstrumentIcon, getEffectIcon, LucideIconName } from './lucide-icons';
import { MaterialCard, StatCard, InstrumentCard, EffectSection, ActionChip, MaterialSlider, MaterialButton, createGrid } from './material-components';
import { PlayButtonManager, PlayButtonState } from './play-button-manager';
import { PlaybackEventType, PlaybackEventData, PlaybackProgressData, PlaybackErrorData } from '../audio/playback-events';
import { GraphDemoModal } from './GraphDemoModal';
import { GraphDataExtractor } from '../graph/GraphDataExtractor';
import { GraphRenderer } from '../graph/GraphRenderer';
import { FolderSuggestModal } from './FolderSuggestModal';
import { FileSuggestModal } from './FileSuggestModal';
import { SonicGraphSettingsTabs } from './settings/SonicGraphSettingsTabs';
import { getWhaleIntegration } from '../external/whale-integration';
import { FreesoundSearchModal } from './FreesoundSearchModal';
import { SampleTableBrowser } from './SampleTableBrowser';
import { MusicalGenre, FreesoundSample } from '../audio/layers/types';

const logger = getLogger('control-panel');

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

	// Sonic Graph components
	private graphRenderer: GraphRenderer | null = null;
	private showFileNames: boolean = false;
	private sonicGraphSettingsTabs: SonicGraphSettingsTabs | null = null;

	// Sample browser container for refreshing when genre changes
	private sampleBrowserContainer: HTMLElement | null = null;
	private sampleBrowserCard: MaterialCard | null = null;

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
		
		// Cleanup graph renderer
		if (this.graphRenderer) {
			this.graphRenderer.destroy();
			this.graphRenderer = null;
		}

		// Phase 8.1: Cleanup settings tabs
		if (this.sonicGraphSettingsTabs) {
			this.sonicGraphSettingsTabs.destroy();
			this.sonicGraphSettingsTabs = null;
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

		// Plugin Settings button (fourth)
		const pluginSettingsBtn = container.createEl('button', { cls: 'osp-header-btn osp-header-btn--secondary' });
		const pluginSettingsIcon = createLucideIcon('cog', 16);
		pluginSettingsBtn.appendChild(pluginSettingsIcon);
		pluginSettingsBtn.appendText('Plugin Settings');
		pluginSettingsBtn.addEventListener('click', () => this.openPluginSettings());

		// Sonic Graph button (fifth)
		const sonicGraphBtn = container.createEl('button', { cls: 'osp-header-btn osp-header-btn--accent' });
		const sonicGraphIcon = createLucideIcon('chart-network', 16);
		sonicGraphBtn.appendChild(sonicGraphIcon);
		sonicGraphBtn.appendText('Sonic Graph');
		sonicGraphBtn.addEventListener('click', () => this.launchSonicGraphView());
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
			case 'layers':
				this.createLayersTab();
				break;
			case 'sonic-graph':
				this.createSonicGraphTab();
				break;
			case 'keyboard':
			case 'strings':
			case 'woodwinds':
			case 'brass':

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
		
		// Global Settings Card (moved from Master tab)
		this.createGlobalSettingsCard();
		
		// Logging Card
		this.createLoggingCard();
	}

	private createActiveInstrumentsCard(): void {
		const card = new MaterialCard({
			title: 'Active instruments',
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
			title: 'Performance metrics',
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
		cpuStat.createSpan({ cls: 'osp-stat-value', text: '12%' });
		cpuStat.createSpan({ cls: 'osp-stat-label', text: 'CPU' });
		
		const voicesStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		voicesStat.createSpan({ cls: 'osp-stat-value', text: `${status.audio.currentNotes || 0}` });
		voicesStat.createSpan({ cls: 'osp-stat-label', text: 'Voices' });
		
		const contextStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		const contextValue = status.audio.audioContext || 'Suspended';
		const contextColor = contextValue === 'running' ? 'var(--text-success)' : 'var(--text-warning)';
		const contextValueSpan = contextStat.createSpan({ cls: 'osp-stat-value', text: contextValue });
		contextValueSpan.style.color = contextColor;
		contextStat.createSpan({ cls: 'osp-stat-label', text: 'Context' });

		this.contentContainer.appendChild(card.getElement());
	}



	private getEnabledInstrumentsList(): Array<{name: string, activeVoices: number, maxVoices: number}> {
		const enabled: Array<{name: string, activeVoices: number, maxVoices: number}> = [];

		Object.entries(this.plugin.settings.instruments).forEach(([key, settings]) => {
			// Filter out whale instruments (temporarily disabled)
			if (settings.enabled && !key.toLowerCase().includes('whale')) {
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

		// Chord Fusion Card
		this.createChordFusionCard();

		// Tempo & Timing Card
		this.createTempoTimingCard();

		// Master Tuning Card
		this.createMasterTuningCard();
	}

	/**
	 * Create Sonic Graph tab content
	 */
	private createSonicGraphTab(): void {
		// Graph Preview Card
		this.createGraphPreviewCard();

		// Sonic Graph Settings Tabs (Phase 8.1)
		this.createSonicGraphSettingsTabs();
	}

	/**
	 * Create Layers tab - Continuous layers and Freesound integration
	 */
	private createLayersTab(): void {
		// Import layers settings class - renders continuous layers card first
		import('./settings/SonicGraphLayersSettings').then(({ SonicGraphLayersSettings }) => {
			// Callback to re-render entire tab when toggle changes
			const onToggle = () => {
				this.contentContainer.empty();
				this.createLayersTab();
			};

			// Callback to refresh sample browser when genre changes
			const onGenreChange = () => {
				this.refreshSampleBrowser();
			};

			const layersSettings = new SonicGraphLayersSettings(this.app, this.plugin, onToggle, onGenreChange);
			layersSettings.render(this.contentContainer);

			// Freesound Integration Card - only show when continuous layers are enabled
			if (this.plugin.settings.audioEnhancement?.continuousLayers?.enabled) {
				this.createFreesoundIntegrationCard();

				// Sample Browser Card - only show when Freesound is enabled
				if (this.plugin.settings.enableFreesoundSamples) {
					this.createSampleBrowserCard();
				}
			}
		});
	}

	/**
	 * Create Freesound integration card for Layers tab
	 */
	private createFreesoundIntegrationCard(): void {
		const card = new MaterialCard({
			title: 'Freesound integration',
			iconName: 'cloud-download',
			subtitle: 'Configure Freesound.org API for audio samples',
			elevation: 1
		});

		const content = card.getContent();
		const settingsSection = content.createDiv({ cls: 'osp-settings-section' });

		// Enable Freesound Integration toggle
		new Setting(settingsSection)
			.setName('Enable Freesound integration')
			.setDesc('Use Freesound.org API to download real audio samples for continuous layers')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableFreesoundSamples || false)
				.onChange(async (value) => {
					this.plugin.settings.enableFreesoundSamples = value;
					await this.plugin.saveSettings();
					logger.info('freesound', `Freesound integration ${value ? 'enabled' : 'disabled'}`);

					// Re-render the entire Layers tab to show/hide settings
					this.contentContainer.empty();
					this.createLayersTab();
				})
			);

		// Only show configuration if enabled
		if (this.plugin.settings.enableFreesoundSamples) {
			// Description paragraph
			settingsSection.createEl('p', {
				text: 'Enter your API key from Freesound.org here. Get your free API key at: https://freesound.org/apiv2/apply/',
				cls: 'osp-settings-description'
			});

			// API Key field with test button
			const apiKeyContainer = settingsSection.createDiv({ cls: 'osp-settings-item osp-settings-description--wide-input' });

			new Setting(apiKeyContainer)
				.setName('API key')
				.addText(text => {
					text
						.setPlaceholder('Enter your Freesound API key (32 characters)')
						.setValue(this.plugin.settings.freesoundApiKey || '')
						.onChange(async (value) => {
							this.plugin.settings.freesoundApiKey = value;
							await this.plugin.saveSettings();
							logger.info('freesound', 'Freesound API key updated');
						});
					text.inputEl.style.fontSize = '13px';
				})
				.addButton(button => {
					button
						.setButtonText('Test connection')
						.setTooltip('Test API key and connection to Freesound')
						.onClick(async () => {
							await this.testFreesoundConnection(button.buttonEl);
						});
				});

			// Security note
			settingsSection.createEl('p', {
				text: `Note: This key will be stored in plain text in ${this.app.vault.configDir}/plugins/sonigraph/data.json. ` +
					  'Only share your vault if you trust recipients with API access.',
				cls: 'osp-security-note'
			});
			// Preloading and Caching Settings
			new Setting(settingsSection).setHeading().setName('Preloading and caching');

			// Enable predictive preloading
			new Setting(settingsSection)
				.setName('Predictive preloading')
				.setDesc('Automatically preload samples for genres you use frequently')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.freesoundPredictivePreload !== false)
					.onChange(async (value) => {
						this.plugin.settings.freesoundPredictivePreload = value;
						await this.plugin.saveSettings();
						logger.info('freesound', `Predictive preloading ${value ? 'enabled' : 'disabled'}`);
					})
				);

			// Preload on startup
			new Setting(settingsSection)
				.setName('Preload on startup')
				.setDesc('Automatically preload frequently used samples when Obsidian starts')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.freesoundPreloadOnStartup || false)
					.onChange(async (value) => {
						this.plugin.settings.freesoundPreloadOnStartup = value;
						await this.plugin.saveSettings();
						logger.info('freesound', `Preload on startup ${value ? 'enabled' : 'disabled'}`);
					})
				);

			// Background loading
			new Setting(settingsSection)
				.setName('Background loading')
				.setDesc('Download samples in the background during idle time')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.freesoundBackgroundLoading !== false)
					.onChange(async (value) => {
						this.plugin.settings.freesoundBackgroundLoading = value;
						await this.plugin.saveSettings();
						logger.info('freesound', `Background loading ${value ? 'enabled' : 'disabled'}`);
					})
				);

			// Cache eviction strategy
			new Setting(settingsSection)
				.setName('Cache strategy')
				.setDesc('Algorithm for managing cached samples when storage is full')
				.addDropdown(dropdown => dropdown
					.addOption('adaptive', 'Adaptive (Recommended)')
					.addOption('lru', 'Least Recently Used')
					.addOption('lfu', 'Least Frequently Used')
					.addOption('predictive', 'Predictive')
					.setValue(this.plugin.settings.freesoundCacheStrategy || 'adaptive')
					.onChange(async (value) => {
						this.plugin.settings.freesoundCacheStrategy = value as 'lru' | 'lfu' | 'fifo' | 'adaptive' | 'predictive';
						await this.plugin.saveSettings();
						logger.info('freesound', `Cache strategy set to ${value}`);
					})
				);

			// Storage quota
			new Setting(settingsSection)
				.setName('Max storage (MB)')
				.setDesc('Maximum disk space for cached samples (default: 100MB)')
				.addText(text => text
					.setPlaceholder('100')
					.setValue(String(this.plugin.settings.freesoundMaxStorageMB || 100))
					.onChange(async (value) => {
						const numValue = parseInt(value) || 100;
						this.plugin.settings.freesoundMaxStorageMB = numValue;
						await this.plugin.saveSettings();
						logger.info('freesound', `Max storage set to ${numValue}MB`);
					})
				);
		}

		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Create sample browser card for browsing and selecting Freesound samples
	 */
	private createSampleBrowserCard(): void {
		const card = new MaterialCard({
			title: 'Sample browser',
			iconName: 'library',
			subtitle: 'Browse, preview, and manage your Freesound sample library',
			elevation: 1
		});

		// Store card reference for later refresh
		this.sampleBrowserCard = card;

		const content = card.getContent();
		const browserSection = content.createDiv({ cls: 'osp-sample-browser-section' });

		// Store browser container reference for refreshing
		this.sampleBrowserContainer = browserSection;

		// Initial render
		this.refreshSampleBrowser();

		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Refresh the sample browser
	 */
	public refreshSampleBrowser(): void {
		if (!this.sampleBrowserContainer) return;

		// Clear existing content
		this.sampleBrowserContainer.empty();

		// Get sample loader - try from layer manager first, fallback to creating new instance
		let sampleLoader;
		const layerManager = (this.plugin as any).continuousLayerManager;

		if (layerManager && layerManager.sampleLoader) {
			sampleLoader = layerManager.sampleLoader;
		} else {
			// Create temporary sample loader just for browsing
			// Import FreesoundSampleLoader dynamically
			import('../audio/layers/FreesoundSampleLoader').then(({ FreesoundSampleLoader }) => {
				const tempLoader = new FreesoundSampleLoader(this.plugin.settings.freesoundApiKey);
				this.renderSampleBrowser(this.sampleBrowserContainer!, tempLoader);
			});
			return;
		}

		this.renderSampleBrowser(this.sampleBrowserContainer, sampleLoader);
	}

	/**
	 * Render the sample browser UI with table layout
	 */
	private renderSampleBrowser(container: HTMLElement, sampleLoader: any): void {
		// Use the new table-based browser
		const tableBrowser = new SampleTableBrowser(this.app, this.plugin, container);
		tableBrowser.render();
	}

	/**
	 * Render a single sample item
	 */
	private renderSampleItem(
		container: HTMLElement,
		sample: any,
		number: number,
		isUserSample: boolean
	): void {
		const sampleItem = container.createDiv({
			cls: isUserSample ? 'osp-sample-item osp-user-sample' : 'osp-sample-item osp-placeholder-sample'
		});

		// Sample info section
		const infoSection = sampleItem.createDiv({ cls: 'osp-sample-info' });

		// Sample title and metadata
		infoSection.createEl('div', {
			text: `${number}. ${sample.title}`,
			cls: 'osp-sample-title'
		});

		const metaEl = infoSection.createDiv({ cls: 'osp-sample-metadata' });
		metaEl.createEl('span', {
			text: `ID: ${sample.id}`,
			cls: 'osp-sample-id'
		});
		metaEl.createEl('span', {
			text: ` • ${sample.duration}s`,
			cls: 'osp-sample-duration'
		});
		metaEl.createEl('span', {
			text: ` • ${sample.license}`,
			cls: 'osp-sample-license'
		});
		metaEl.createEl('span', {
			text: ` • by ${sample.attribution}`,
			cls: 'osp-sample-attribution'
		});

		// Fade settings
		const fadeEl = infoSection.createDiv({ cls: 'osp-sample-fade-info' });
		fadeEl.createEl('span', {
			text: `Fade in: ${sample.fadeIn}s, Fade out: ${sample.fadeOut}s`,
			cls: 'osp-sample-fade-text'
		});

		// Action buttons section
		const actionsSection = sampleItem.createDiv({ cls: 'osp-sample-actions' });

		// Preview button
		const previewBtn = actionsSection.createEl('button', {
			text: 'Preview',
			cls: 'osp-sample-action-btn osp-preview-btn'
		});
		previewBtn.addEventListener('click', async () => {
			await this.previewSample(sample, previewBtn);
		});

		// Info button (opens Freesound page)
		const infoBtn = actionsSection.createEl('button', {
			text: 'Info',
			cls: 'osp-sample-action-btn osp-info-btn'
		});
		infoBtn.addEventListener('click', () => {
			// Log sample details for debugging
			logger.debug('sample-info', `Opening Freesound page for sample`, {
				id: sample.id,
				title: sample.title,
				attribution: sample.attribution,
				url: `https://freesound.org/s/${sample.id}/`
			});
			window.open(`https://freesound.org/s/${sample.id}/`, '_blank');
		});

		// User sample controls (toggle + remove)
		if (isUserSample) {
			const isEnabled = sample.enabled !== false; // Default to true if undefined

			// Toggle button (Enable/Disable)
			const toggleBtn = actionsSection.createEl('button', {
				text: isEnabled ? 'Disable' : 'Enable',
				cls: `osp-sample-action-btn ${isEnabled ? 'osp-disable-btn' : 'osp-enable-btn'}`
			});
			toggleBtn.addEventListener('click', async () => {
				await this.toggleSampleEnabled(sample.id);
			});

			// Remove button
			const removeBtn = actionsSection.createEl('button', {
				text: 'Remove',
				cls: 'osp-sample-action-btn osp-remove-btn'
			});
			removeBtn.addEventListener('click', async () => {
				await this.removeSampleFromLibrary(sample.id);
			});
		}
	}

	private currentPreviewAudio: HTMLAudioElement | null = null;
	private currentPreviewButton: HTMLButtonElement | null = null;

	/**
	 * Preview a Freesound sample
	 */
	private async previewSample(sample: any, button: HTMLButtonElement): Promise<void> {
		// If already playing this sample, stop it
		if (button.textContent === 'Stop') {
			this.stopPreview();
			return;
		}

		// Stop any currently playing preview
		if (this.currentPreviewAudio) {
			this.stopPreview();
		}

		const originalText = button.textContent || 'Preview';
		let audio: HTMLAudioElement | null = null;

		try {
			// Show loading state
			button.textContent = 'Loading...';
			button.disabled = true;

			// Fetch fresh preview URL from Freesound API
			const apiKey = this.plugin.settings.freesoundApiKey;
			if (!apiKey) {
				throw new Error('Freesound API key not configured');
			}

			logger.debug('sample-preview', `Fetching fresh preview URL for sample ${sample.id}`);
			const soundUrl = `https://freesound.org/apiv2/sounds/${sample.id}/?token=${apiKey}&fields=previews`;
			const soundResponse = await requestUrl({
				url: soundUrl,
				method: 'GET'
			});

			const soundData = JSON.parse(soundResponse.text);
			const previewUrl = soundData.previews['preview-hq-mp3'] || soundData.previews['preview-lq-mp3'];

			if (!previewUrl) {
				throw new Error('No preview URL available for this sound');
			}

			// Download audio data using Obsidian's requestUrl to bypass CORS
			logger.debug('sample-preview', `Downloading sample ${sample.id} from ${previewUrl}`);
			const response = await requestUrl({
				url: previewUrl,
				method: 'GET'
			});

			// Convert array buffer to blob URL
			const blob = new Blob([response.arrayBuffer], { type: 'audio/mpeg' });
			const blobUrl = URL.createObjectURL(blob);

			// Create audio element for preview
			audio = new Audio();

			// Set up error handling before setting src
			audio.addEventListener('error', (e) => {
				logger.error('sample-preview', `Audio load error for sample ${sample.id}`, e);
				URL.revokeObjectURL(blobUrl); // Clean up blob URL
				button.textContent = 'Error';
				button.disabled = false;
				setTimeout(() => {
					button.textContent = originalText;
				}, 2000);
			});

			// Wait for audio to be ready
			await new Promise<void>((resolve, reject) => {
				if (!audio) {
					reject(new Error('Audio element not created'));
					return;
				}

				audio.addEventListener('canplay', () => resolve(), { once: true });
				audio.addEventListener('error', (e) => reject(e), { once: true });
				audio.src = blobUrl;
				audio.load();
			});

			// Start playback with fade in
			audio.volume = 0;
			const playPromise = audio.play();

			if (playPromise !== undefined) {
				await playPromise;
			}

			// Store current preview references
			this.currentPreviewAudio = audio;
			this.currentPreviewButton = button;

			// Fade in
			const fadeInSteps = 20;
			const fadeInInterval = (sample.fadeIn * 1000) / fadeInSteps;
			for (let i = 0; i <= fadeInSteps; i++) {
				setTimeout(() => {
					if (audio) {
						audio.volume = Math.min(1, i / fadeInSteps);
					}
				}, i * fadeInInterval);
			}

			// Update button to show playing state
			button.textContent = 'Stop';
			button.disabled = false;

			// Clean up blob URL when audio ends
			audio.addEventListener('ended', () => {
				URL.revokeObjectURL(blobUrl);
			});

			// Auto-stop when audio ends
			audio.addEventListener('ended', () => {
				if (this.currentPreviewButton) {
					this.currentPreviewButton.textContent = originalText;
				}
				this.currentPreviewAudio = null;
				this.currentPreviewButton = null;
			});

		} catch (error) {
			logger.error('sample-preview', `Failed to preview sample ${sample.id}`, error);
			button.textContent = 'Error';
			button.disabled = false;
			setTimeout(() => {
				button.textContent = originalText;
			}, 2000);
			this.currentPreviewAudio = null;
			this.currentPreviewButton = null;
		}
	}

	/**
	 * Stop the currently playing preview
	 */
	private stopPreview(): void {
		if (!this.currentPreviewAudio || !this.currentPreviewButton) return;

		const audio = this.currentPreviewAudio;
		const button = this.currentPreviewButton;
		const fadeOut = 1; // Default fade out time in seconds

		// Fade out
		const fadeOutSteps = 20;
		const fadeOutInterval = (fadeOut * 1000) / fadeOutSteps;
		const currentVolume = audio.volume;

		for (let i = fadeOutSteps; i >= 0; i--) {
			setTimeout(() => {
				if (audio) {
					audio.volume = (i / fadeOutSteps) * currentVolume;
					if (i === 0) {
						audio.pause();
						audio.currentTime = 0;
						// Clean up blob URL if it was used
						if (audio.src.startsWith('blob:')) {
							URL.revokeObjectURL(audio.src);
						}
					}
				}
			}, (fadeOutSteps - i) * fadeOutInterval);
		}

		button.textContent = 'Preview';
		this.currentPreviewAudio = null;
		this.currentPreviewButton = null;
	}

	/**
	 * Open Freesound search modal
	 */
	private openFreesoundSearch(): void {
		const apiKey = this.plugin.settings.freesoundApiKey;

		if (!apiKey) {
			new Notice('Please enter your Freesound API key in the Freesound Integration settings first.');
			return;
		}

		const modal = new FreesoundSearchModal(
			this.app,
			apiKey,
			(sample: FreesoundSample) => this.addSampleToLibrary(sample)
		);

		modal.open();
	}

	/**
	 * Add a sample to the user's library
	 */
	private async addSampleToLibrary(sample: FreesoundSample): Promise<void> {
		// Initialize freesoundSamples as array if it doesn't exist
		if (!this.plugin.settings.freesoundSamples) {
			this.plugin.settings.freesoundSamples = [];
		}

		// Check if sample already exists
		const exists = this.plugin.settings.freesoundSamples.some(s => s.id === sample.id);
		if (exists) {
			new Notice(`Sample "${sample.title}" is already in your library`);
			return;
		}

		// Add sample to library with enabled flag set to true by default
		const sampleWithEnabled = { ...sample, enabled: true };
		this.plugin.settings.freesoundSamples.push(sampleWithEnabled);
		await this.plugin.saveSettings();

		logger.info('library', `Added sample ${sample.id} to library`);

		// Refresh the sample browser to show the new sample
		this.refreshSampleBrowser();
	}

	/**
	 * Toggle a sample's enabled status
	 */
	private async toggleSampleEnabled(sampleId: number): Promise<void> {
		if (!this.plugin.settings.freesoundSamples) {
			return;
		}

		// Find the sample in flat array
		const sample = this.plugin.settings.freesoundSamples.find(s => s.id === sampleId);

		if (!sample) {
			new Notice('Sample not found in library');
			return;
		}

		// Toggle enabled state
		const wasEnabled = sample.enabled !== false;
		sample.enabled = !wasEnabled;
		await this.plugin.saveSettings();

		logger.info('library', `${wasEnabled ? 'Disabled' : 'Enabled'} sample ${sampleId}`);
		new Notice(`${wasEnabled ? 'Disabled' : 'Enabled'} "${sample.title}"`);

		// Refresh the sample browser to reflect the change
		this.refreshSampleBrowser();
	}

	/**
	 * Remove a sample from the user's library
	 */
	private async removeSampleFromLibrary(sampleId: number): Promise<void> {
		if (!this.plugin.settings.freesoundSamples) {
			return;
		}

		// Find index of sample to remove in flat array
		const index = this.plugin.settings.freesoundSamples.findIndex(s => s.id === sampleId);

		if (index === -1) {
			new Notice('Sample not found in library');
			return;
		}

		// Get sample title for confirmation message
		const sampleTitle = this.plugin.settings.freesoundSamples[index].title;

		// Remove sample from array
		this.plugin.settings.freesoundSamples.splice(index, 1);
		await this.plugin.saveSettings();

		logger.info('library', `Removed sample ${sampleId} from library`);
		new Notice(`Removed "${sampleTitle}" from library`);

		// Refresh the sample browser to reflect the removal
		this.refreshSampleBrowser();
	}

	private createScaleKeyCard(): void {
		const card = new MaterialCard({
			title: 'Scale & harmony',
			iconName: 'music',
			subtitle: 'Musical scale, key signature, and harmonic controls',
			elevation: 1
		});

		const content = card.getContent();
		const settingsGrid = createGrid('2-col');

		// Scale selection
		const scaleGroup = settingsGrid.createDiv({ cls: 'osp-control-group' });
		scaleGroup.createEl('label', { text: 'Musical scale', cls: 'osp-control-label' });
		const scaleSelect = scaleGroup.createEl('select', { cls: 'osp-select' });

		const scales = [
			{ value: 'major', label: 'Major' },
			{ value: 'minor', label: 'Minor (Natural)' },
			{ value: 'dorian', label: 'Dorian' },
			{ value: 'phrygian', label: 'Phrygian' },
			{ value: 'lydian', label: 'Lydian' },
			{ value: 'mixolydian', label: 'Mixolydian' },
			{ value: 'aeolian', label: 'Aeolian' },
			{ value: 'locrian', label: 'Locrian' },
			{ value: 'pentatonic-major', label: 'Pentatonic Major' },
			{ value: 'pentatonic-minor', label: 'Pentatonic Minor' },
			{ value: 'blues', label: 'Blues' },
			{ value: 'whole-tone', label: 'Whole Tone' },
			{ value: 'chromatic', label: 'Chromatic' }
		];

		scales.forEach(scale => {
			const option = scaleSelect.createEl('option', { value: scale.value, text: scale.label });
			if (this.plugin.settings.audioEnhancement?.musicalTheory?.scale === scale.value) {
				option.selected = true;
			}
		});

		scaleSelect.addEventListener('change', async () => {
			if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
			this.plugin.settings.audioEnhancement.musicalTheory.scale = scaleSelect.value;
			await this.plugin.saveSettings();
			if (this.plugin.audioEngine) {
				await this.plugin.audioEngine.updateSettings(this.plugin.settings);
			}
		});

		// Key selection
		const keyGroup = settingsGrid.createDiv({ cls: 'osp-control-group' });
		keyGroup.createEl('label', { text: 'Key signature', cls: 'osp-control-label' });
		const keySelect = keyGroup.createEl('select', { cls: 'osp-select' });

		const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		keys.forEach(key => {
			const option = keySelect.createEl('option', { value: key, text: key });
			if (this.plugin.settings.audioEnhancement?.musicalTheory?.rootNote === key) {
				option.selected = true;
			}
		});

		keySelect.addEventListener('change', async () => {
			if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
			this.plugin.settings.audioEnhancement.musicalTheory.rootNote = keySelect.value;
			await this.plugin.saveSettings();
			if (this.plugin.audioEngine) {
				await this.plugin.audioEngine.updateSettings(this.plugin.settings);
			}
		});

		content.appendChild(settingsGrid);

		// Enforce harmony toggle
		new Setting(content)
			.setName('Enforce harmony')
			.setDesc('Force all notes to fit within the selected scale')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.enforceHarmony || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.enforceHarmony = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Quantization strength
		new Setting(content)
			.setName('Quantization strength')
			.setDesc('How strongly to snap notes to the scale (0 = free, 1 = strict)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.05)
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.quantizationStrength || 0.8)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.quantizationStrength = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Dissonance threshold
		new Setting(content)
			.setName('Dissonance threshold')
			.setDesc('Maximum allowed dissonance (0 = consonant, 1 = dissonant)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.05)
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.dissonanceThreshold || 0.5)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.dissonanceThreshold = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Allow chromatic passing
		new Setting(content)
			.setName('Chromatic passing tones')
			.setDesc('Allow notes outside the scale as passing tones')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.musicalTheory?.allowChromaticPassing || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.musicalTheory) return;
					this.plugin.settings.audioEnhancement.musicalTheory.allowChromaticPassing = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		this.contentContainer.appendChild(card.getElement());
	}

	private createChordFusionCard(): void {
		const card = new MaterialCard({
			title: 'Chord fusion',
			iconName: 'music-4',
			subtitle: 'Combine simultaneous notes into chords',
			elevation: 1
		});

		const content = card.getContent();

		// Master enable toggle
		new Setting(content)
			.setName('Enable chord fusion')
			.setDesc('Automatically combine notes that trigger simultaneously into chords')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement) {
						this.plugin.settings.audioEnhancement = {} as any;
					}
					if (!this.plugin.settings.audioEnhancement.chordFusion) {
						this.plugin.settings.audioEnhancement.chordFusion = {
							enabled: value,
							mode: 'smart',
							timingWindow: 200,
							minimumNotes: 2,
							layerSettings: {
								melodic: false,
								harmonic: true,
								rhythmic: true,
								ambient: true
							},
							connectionChords: false,
							contextualHarmony: false,
							chordComplexity: 3,
							progressionSpeed: 0.5,
							dissonanceLevel: 0.3,
							voicingStrategy: 'compact'
						};
					} else {
						this.plugin.settings.audioEnhancement.chordFusion.enabled = value;
					}
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}

					// Refresh to show/hide detailed settings
					content.empty();
					this.createChordFusionSettings(content);
				})
			);

		// Show detailed settings only if enabled
		if (this.plugin.settings.audioEnhancement?.chordFusion?.enabled) {
			this.createChordFusionSettings(content);
		}

		this.contentContainer.appendChild(card.getElement());
	}

	private createChordFusionSettings(container: HTMLElement): void {
		// Re-create the enable toggle
		new Setting(container)
			.setName('Enable chord fusion')
			.setDesc('Automatically combine notes that trigger simultaneously into chords')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
					this.plugin.settings.audioEnhancement.chordFusion.enabled = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}

					// Refresh to show/hide detailed settings
					container.empty();
					this.createChordFusionSettings(container);
				})
			);

		if (!this.plugin.settings.audioEnhancement?.chordFusion?.enabled) {
			return; // Don't show settings if disabled
		}

		const settingsGrid = createGrid('2-col');
		container.appendChild(settingsGrid);

		// Chord mode
		const modeGroup = settingsGrid.createDiv({ cls: 'osp-control-group' });
		modeGroup.createEl('label', { text: 'Chord mode', cls: 'osp-control-label' });
		const modeSelect = modeGroup.createEl('select', { cls: 'osp-select' });

		const modes = [
			{ value: 'smart', label: 'Smart (fit to chord patterns)' },
			{ value: 'direct', label: 'Direct (play as-is)' }
		];

		modes.forEach(mode => {
			const option = modeSelect.createEl('option', { value: mode.value, text: mode.label });
			if (this.plugin.settings.audioEnhancement?.chordFusion?.mode === mode.value) {
				option.selected = true;
			}
		});

		modeSelect.addEventListener('change', async () => {
			if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
			this.plugin.settings.audioEnhancement.chordFusion.mode = modeSelect.value as 'smart' | 'direct';
			await this.plugin.saveSettings();
			if (this.plugin.audioEngine) {
				await this.plugin.audioEngine.updateSettings(this.plugin.settings);
			}
		});

		// Minimum notes
		const minNotesGroup = settingsGrid.createDiv({ cls: 'osp-control-group' });
		minNotesGroup.createEl('label', { text: 'Minimum notes', cls: 'osp-control-label' });
		const minNotesSelect = minNotesGroup.createEl('select', { cls: 'osp-select' });

		[2, 3, 4].forEach(num => {
			const option = minNotesSelect.createEl('option', { value: num.toString(), text: num.toString() });
			if (this.plugin.settings.audioEnhancement?.chordFusion?.minimumNotes === num) {
				option.selected = true;
			}
		});

		minNotesSelect.addEventListener('change', async () => {
			if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
			this.plugin.settings.audioEnhancement.chordFusion.minimumNotes = parseInt(minNotesSelect.value);
			await this.plugin.saveSettings();
			if (this.plugin.audioEngine) {
				await this.plugin.audioEngine.updateSettings(this.plugin.settings);
			}
		});

		// Timing window
		new Setting(container)
			.setName('Timing window')
			.setDesc('Notes arriving within this window are grouped into chords. Start with 50-100ms for simultaneous notes. WARNING: Values over 200ms will group sequential notes into large chords.')
			.addSlider(slider => slider
				.setLimits(20, 500, 10)
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.timingWindow || 50)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
					this.plugin.settings.audioEnhancement.chordFusion.timingWindow = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Layer-specific settings heading
		container.createEl('h4', { text: 'Layer-specific chord fusion', cls: 'osp-section-heading' });

		// Melodic layer
		new Setting(container)
			.setName('Melodic layer')
			.setDesc('Enable chord fusion for melodic notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings?.melodic || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings) return;
					this.plugin.settings.audioEnhancement.chordFusion.layerSettings.melodic = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Harmonic layer
		new Setting(container)
			.setName('Harmonic layer')
			.setDesc('Enable chord fusion for harmonic notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings?.harmonic || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings) return;
					this.plugin.settings.audioEnhancement.chordFusion.layerSettings.harmonic = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Rhythmic layer
		new Setting(container)
			.setName('Rhythmic layer')
			.setDesc('Enable chord fusion for rhythmic notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings?.rhythmic || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings) return;
					this.plugin.settings.audioEnhancement.chordFusion.layerSettings.rhythmic = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Ambient layer
		new Setting(container)
			.setName('Ambient layer')
			.setDesc('Enable chord fusion for ambient notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings?.ambient || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion?.layerSettings) return;
					this.plugin.settings.audioEnhancement.chordFusion.layerSettings.ambient = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Advanced settings heading
		container.createEl('h4', { text: 'Advanced chord settings', cls: 'osp-section-heading' });

		// Chord complexity
		new Setting(container)
			.setName('Chord complexity')
			.setDesc('Maximum number of voices per chord (2-6)')
			.addSlider(slider => slider
				.setLimits(2, 6, 1)
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.chordComplexity || 3)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
					this.plugin.settings.audioEnhancement.chordFusion.chordComplexity = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Voicing strategy
		const voicingGrid = createGrid('1-col');
		container.appendChild(voicingGrid);

		const voicingGroup = voicingGrid.createDiv({ cls: 'osp-control-group' });
		voicingGroup.createEl('label', { text: 'Voicing strategy', cls: 'osp-control-label' });
		const voicingSelect = voicingGroup.createEl('select', { cls: 'osp-select' });

		const voicings = [
			{ value: 'compact', label: 'Compact (notes close together)' },
			{ value: 'spread', label: 'Spread (wide spacing)' },
			{ value: 'drop2', label: 'Drop-2 (jazz voicing)' },
			{ value: 'drop3', label: 'Drop-3 (jazz voicing)' }
		];

		voicings.forEach(voicing => {
			const option = voicingSelect.createEl('option', { value: voicing.value, text: voicing.label });
			if (this.plugin.settings.audioEnhancement?.chordFusion?.voicingStrategy === voicing.value) {
				option.selected = true;
			}
		});

		voicingSelect.addEventListener('change', async () => {
			if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
			this.plugin.settings.audioEnhancement.chordFusion.voicingStrategy = voicingSelect.value as any;
			await this.plugin.saveSettings();
			if (this.plugin.audioEngine) {
				await this.plugin.audioEngine.updateSettings(this.plugin.settings);
			}
		});

		// Connection-based chords
		new Setting(container)
			.setName('Connection chords')
			.setDesc('Enable chord progressions for connection events')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.connectionChords || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
					this.plugin.settings.audioEnhancement.chordFusion.connectionChords = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Contextual harmony
		new Setting(container)
			.setName('Contextual harmony')
			.setDesc('Harmonize based on connected note content')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.audioEnhancement?.chordFusion?.contextualHarmony || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.audioEnhancement?.chordFusion) return;
					this.plugin.settings.audioEnhancement.chordFusion.contextualHarmony = value;
					await this.plugin.saveSettings();
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);
	}

	private createTempoTimingCard(): void {
		const card = new MaterialCard({
			title: 'Tempo & timing',
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
		durationGroup.createEl('label', { text: 'Note duration', cls: 'osp-control-label' });
		
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
			title: 'Master tuning',
			iconName: 'settings',
			subtitle: 'Global tuning and harmonic settings',
			elevation: 1
		});

		const content = card.getContent();

		// A440 tuning
		const tuningGroup = content.createDiv({ cls: 'osp-control-group' });
		tuningGroup.createEl('label', { text: 'Concert pitch (A4)', cls: 'osp-control-label' });
		
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
		microtuningLabel.textContent = 'Enable microtuning';
		
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

	// Global high quality samples setting removed - now using per-instrument control

	private createGlobalSettingsCard(): void {
		const globalCard = new MaterialCard({
			title: 'Global settings',
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
		
		globalChipSet.appendChild(enableAllChip.getElement());
		globalChipSet.appendChild(resetAllChip.getElement());
		
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
		logLevelGroup.createEl('label', { text: 'Logging level', cls: 'osp-control-label' });
		const logLevelSelect = logLevelGroup.createEl('select', { cls: 'osp-select' });
		
		const logLevelOptions = [
			{ value: 'off', text: 'Off' },
			{ value: 'error', text: 'Errors only' },
			{ value: 'warn', text: 'Warnings' },
			{ value: 'info', text: 'Info' },
			{ value: 'debug', text: 'Debug' }
		];
		
		logLevelOptions.forEach(option => {
			const optionEl = logLevelSelect.createEl('option', { value: option.value, text: option.text });
			if (option.value === LoggerFactory.getLogLevel()) optionEl.selected = true;
		});
		
		logLevelSelect.addEventListener('change', async () => {
			const newLevel = logLevelSelect.value as LogLevel;
			LoggerFactory.setLogLevel(newLevel);
			
			// Save to plugin settings for persistence
			await this.plugin.updateSettings({ logLevel: newLevel });
			
			logger.info('settings-change', 'Log level changed from Control Center', { 
				level: newLevel,
				persisted: true 
			});
		});
		
		// Export Logs Action Chip
		const logChipSet = loggingContent.createDiv({ cls: 'ospcc-chip-set osp-logging-chip-set' });
		
		const exportLogsChip = new ActionChip({
			text: 'Export logs',
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
			title: 'Master effects',
			iconName: 'equalizer',
			subtitle: 'Global orchestral processing',
			elevation: 1
		});
		
		const masterContent = masterEffectsCard.getContent();
		
		// Create horizontal effect sections with saved state
		const effects = this.plugin.settings.effects || {};
		
		this.createHorizontalEffectSection(masterContent, 'Orchestral reverb hall', 'reverb', 
			effects.orchestralreverbhall?.enabled ?? true, [
			{ name: 'Hall size', value: effects.orchestralreverbhall?.hallsize ?? 0.8, min: 0, max: 1, step: 0.1, unit: '' },
			{ name: 'Decay time', value: effects.orchestralreverbhall?.decaytime ?? 3.5, min: 0.5, max: 10, step: 0.1, unit: 's' }
		]);
		
		this.createHorizontalEffectSection(masterContent, '3-band EQ', 'equalizer', 
			effects['3bandeq']?.enabled ?? true, [
			{ name: 'Bass boost', value: effects['3bandeq']?.bassboost ?? 0, min: -12, max: 12, step: 1, unit: 'dB' },
			{ name: 'Treble boost', value: effects['3bandeq']?.trebleboost ?? 0, min: -12, max: 12, step: 1, unit: 'dB' }
		]);
		
		this.createHorizontalEffectSection(masterContent, 'Dynamic compressor', 'compressor', 
			effects.dynamiccompressor?.enabled ?? false, [
			{ name: 'Threshold', value: effects.dynamiccompressor?.threshold ?? -20, min: -40, max: 0, step: 1, unit: 'dB' },
			{ name: 'Ratio', value: effects.dynamiccompressor?.ratio ?? 4, min: 1, max: 20, step: 1, unit: ':1' }
		]);
		
		// Performance Settings Card
		const performanceCard = new MaterialCard({
			title: 'Performance optimization',
			iconName: 'zap',
			subtitle: 'CPU monitoring and adaptive quality control',
			elevation: 1
		});
		
		const perfContent = performanceCard.getContent();
		
		// Compact stats row (similar to Status tab Performance card)
		const perfStatsRow = perfContent.createDiv({ cls: 'osp-stats-row' });
		
		const cpuStat = perfStatsRow.createDiv({ cls: 'osp-stat-compact' });
		cpuStat.createSpan({ cls: 'osp-stat-value', text: '23%' });
		cpuStat.createSpan({ cls: 'osp-stat-label', text: 'CPU usage' });
		
		const voicesStat = perfStatsRow.createDiv({ cls: 'osp-stat-compact' });
		voicesStat.createSpan({ cls: 'osp-stat-value', text: '47/128' });
		voicesStat.createSpan({ cls: 'osp-stat-label', text: 'Voices' });
		
		const qualityStat = perfStatsRow.createDiv({ cls: 'osp-stat-compact' });
		const qualityValueSpan = qualityStat.createSpan({ cls: 'osp-stat-value', text: 'High' });
		qualityValueSpan.style.color = 'var(--color-green)';
		qualityStat.createSpan({ cls: 'osp-stat-label', text: 'Audio quality' });
		
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
	 * Create Graph Preview Card for Sonic Graph tab
	 */
	private createGraphPreviewCard(): void {
		const card = new MaterialCard({
			title: 'Knowledge graph preview',
			iconName: 'globe',
			subtitle: 'Static view of your vault structure and connections',
			elevation: 1
		});

		const content = card.getContent();
		
		// Graph container with fixed height
		const graphContainer = content.createDiv({ 
			cls: 'osp-graph-preview-container',
			attr: { style: 'height: 300px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary-alt);' }
		});
		
		// Loading placeholder initially
		const loadingDiv = graphContainer.createDiv({ 
			cls: 'osp-graph-loading',
			text: 'Loading graph preview...',
			attr: { style: 'display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);' }
		});

		// Initialize graph preview asynchronously
		this.initializeGraphPreview(graphContainer, loadingDiv);

		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Create Sonic Graph Controls Card
	 */
	private createSonicGraphControlsCard(): void {
		const card = new MaterialCard({
			title: 'Sonic graph settings',
			iconName: 'settings',
			subtitle: 'Configure graph visualization preferences',
			elevation: 1
		});

		const content = card.getContent();
		
		// Description
		const description = content.createDiv({ cls: 'osp-control-description' });
		description.createEl('p', { text: 'Transform your knowledge graph into a temporal audio-visual experience. Notes appear chronologically with musical accompaniment based on content and connections.' });

		// Settings section
		const settingsSection = content.createDiv({ cls: 'osp-settings-section osp-settings-section--spaced' });
		
		// Show file names toggle
		logger.debug('ui', `Creating show file names toggle with initial state: ${this.showFileNames}`);
		createObsidianToggle(
			settingsSection,
			this.showFileNames, // Use current state
			(enabled) => this.handleShowFileNamesToggle(enabled),
			{
				name: 'Show file names',
				description: 'Display file names as labels on graph nodes'
			}
		);
		logger.debug('ui', 'Show file names toggle created');

		// Note: Freesound Integration moved to Layers tab for better UX
		// Add some spacing before exclusion settings
		settingsSection.createDiv({ cls: 'osp-settings-spacer' });

		// Exclusion settings
		this.createExclusionFields(settingsSection);

		// Note: Launch functionality moved to header Sonic Graph button

		// Quick stats
		const statsContainer = content.createDiv({ cls: 'osp-stats-row' });
		
		const filesStat = statsContainer.createDiv({ cls: 'osp-stat-compact' });
		filesStat.createSpan({ cls: 'osp-stat-value', text: '—' });
		filesStat.createSpan({ cls: 'osp-stat-label', text: 'Files' });
		
		const linksStat = statsContainer.createDiv({ cls: 'osp-stat-compact' });
		linksStat.createSpan({ cls: 'osp-stat-value', text: '—' });
		linksStat.createSpan({ cls: 'osp-stat-label', text: 'Links' });

		// Update stats asynchronously
		this.updateSonicGraphStats(filesStat, linksStat);

		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Phase 8.1: Create Sonic Graph Settings Tabs
	 */
	private createSonicGraphSettingsTabs(): void {
		const card = new MaterialCard({
			title: 'Sonic graph settings',
			iconName: 'settings',
			subtitle: 'Configure graph visualization preferences',
			elevation: 1
		});

		const content = card.getContent();

		// Add reset button at the top
		const resetButtonContainer = content.createDiv({ cls: 'osp-sonic-graph-reset-container' });
		const resetButton = new MaterialButton({
			text: 'Reset to Defaults',
			icon: 'rotate-ccw',
			variant: 'outlined',
			onClick: () => this.resetSonicGraphSettings()
		});
		resetButtonContainer.appendChild(resetButton.getElement());

		// Create tabs container
		const tabsContainer = content.createDiv({ cls: 'osp-sonic-graph-settings-tabs' });

		// Initialize tabs system
		this.sonicGraphSettingsTabs = new SonicGraphSettingsTabs(
			this.app,
			this.plugin,
			tabsContainer
		);

		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Reset Sonic Graph settings to defaults
	 */
	private async resetSonicGraphSettings(): Promise<void> {
		try {
			// Import default settings
			const { DEFAULT_SETTINGS } = await import('../utils/constants');

			// Reset sonicGraphSettings to defaults
			this.plugin.settings.sonicGraphSettings = JSON.parse(
				JSON.stringify(DEFAULT_SETTINGS.sonicGraphSettings)
			);

			// Save settings
			await this.plugin.saveSettings();

			// Refresh the tab UI to reflect changes
			if (this.sonicGraphSettingsTabs) {
				this.sonicGraphSettingsTabs.refresh();
			}

			// Show confirmation notice
			new Notice('Sonic Graph settings reset to defaults');

			logger.info('ui', 'Sonic Graph settings reset to defaults');
		} catch (error) {
			logger.error('ui', 'Failed to reset Sonic Graph settings:', error);
			new Notice('Failed to reset settings');
		}
	}

	/**
	 * Initialize graph preview visualization
	 */
	private async initializeGraphPreview(container: HTMLElement, loadingDiv: HTMLElement): Promise<void> {
		try {
			const extractor = new GraphDataExtractor(this.app.vault, this.app.metadataCache, {
				excludeFolders: this.plugin.settings.sonicGraphExcludeFolders || [],
				excludeFiles: this.plugin.settings.sonicGraphExcludeFiles || []
			});
			const graphData = await extractor.extractGraphData();
			
			// Remove loading indicator
			loadingDiv.remove();
			
			// Create graph renderer
			this.graphRenderer = new GraphRenderer(container, {
				width: container.clientWidth,
				height: 300,
				enableZoom: true, // Enable zoom for interactive preview
				showLabels: this.showFileNames // Use stored toggle state
			});
			
			this.graphRenderer.render(graphData.nodes, graphData.links);
			logger.debug('ui', `Graph renderer initialized with showLabels: ${this.showFileNames}`);
			
		} catch (error) {
			logger.error('ui', 'Failed to initialize graph preview:', error);
			loadingDiv.textContent = 'Failed to load graph preview';
		}
	}

	/**
	 * Update stats for Sonic Graph controls
	 */
	private async updateSonicGraphStats(filesEl: HTMLElement, linksEl: HTMLElement): Promise<void> {
		try {
			const extractor = new GraphDataExtractor(this.app.vault, this.app.metadataCache, {
				excludeFolders: this.plugin.settings.sonicGraphExcludeFolders || [],
				excludeFiles: this.plugin.settings.sonicGraphExcludeFiles || []
			});
			const graphData = await extractor.extractGraphData();
			
			const filesValue = filesEl.querySelector('.osp-stat-value') as HTMLElement;
			const linksValue = linksEl.querySelector('.osp-stat-value') as HTMLElement;
			
			if (filesValue) filesValue.textContent = graphData.nodes.length.toString();
			if (linksValue) linksValue.textContent = graphData.links.length.toString();
			
		} catch (error) {
			logger.error('ui', 'Failed to update Sonic Graph stats:', error);
		}
	}

	/**
	 * Open Plugin Settings
	 */
	private openPluginSettings(): void {
		logger.debug('ui', 'Opening Plugin Settings');
		
		// Close Control Center first for smooth transition
		this.close();
		
		// Open Plugin Settings
		(this.app as any).setting.open();
		(this.app as any).setting.openTabById(this.plugin.manifest.id);
	}

	/**
	 * Launch the full Sonic Graph view
	 */
	private launchSonicGraphView(): void {
		logger.debug('ui', 'Launching Sonic Graph view from Control Center');

		// Close Control Center first for smooth transition
		this.close();

		try {
			// Open Sonic Graph view (primary interface)
			this.plugin.activateSonicGraphView();
			logger.debug('ui', 'Sonic Graph view activated');
		} catch (error) {
			logger.error('ui', 'Failed to launch Sonic Graph view:', (error as Error).message);
			logger.error('ui', 'Error stack:', (error as Error).stack);
			new Notice('Failed to launch Sonic Graph: ' + (error as Error).message);
		}
	}

	/**
	 * Handle show file names toggle
	 */
	private handleShowFileNamesToggle(enabled: boolean): void {
		this.showFileNames = enabled;
		logger.debug('ui', `Show file names toggled: ${enabled}, renderer exists: ${!!this.graphRenderer}`);
		
		// Show a notice for debugging
		new Notice(`File names ${enabled ? 'shown' : 'hidden'}`);
		
		if (this.graphRenderer) {
			this.graphRenderer.updateConfig({ showLabels: enabled });
			logger.debug('ui', `Graph file names visibility updated: ${enabled}`);
		} else {
			logger.debug('ui', 'Graph renderer not yet initialized, will apply setting when created');
		}
	}

	/**
	 * Create exclusion fields for folders and files
	 */
	private createExclusionFields(container: HTMLElement): void {
		// Exclude folders section
		const excludeFoldersSection = container.createDiv({ cls: 'osp-exclusion-section osp-exclusion-section--spaced' });
		
		const foldersLabel = excludeFoldersSection.createDiv({ cls: 'osp-exclusion-label' });
		foldersLabel.textContent = 'Exclude folders';
		
		const foldersDescription = excludeFoldersSection.createDiv({ cls: 'osp-exclusion-description' });
		foldersDescription.textContent = 'Folders to exclude from the graph visualization';
		
		const foldersContainer = excludeFoldersSection.createDiv({ cls: 'osp-exclusion-container' });
		this.createExclusionList(foldersContainer, 'folders');
		
		const addFolderBtn = excludeFoldersSection.createEl('button', { 
			cls: 'osp-exclusion-add-btn',
			text: 'Add folder'
		});
		addFolderBtn.addEventListener('click', () => this.openFolderSuggestModal());

		// Exclude files section
		const excludeFilesSection = container.createDiv({ cls: 'osp-exclusion-section osp-exclusion-section--spaced' });
		
		const filesLabel = excludeFilesSection.createDiv({ cls: 'osp-exclusion-label' });
		filesLabel.textContent = 'Exclude files';
		
		const filesDescription = excludeFilesSection.createDiv({ cls: 'osp-exclusion-description' });
		filesDescription.textContent = 'Files to exclude from the graph visualization';
		
		const filesContainer = excludeFilesSection.createDiv({ cls: 'osp-exclusion-container' });
		this.createExclusionList(filesContainer, 'files');
		
		const addFileBtn = excludeFilesSection.createEl('button', { 
			cls: 'osp-exclusion-add-btn',
			text: 'Add file'
		});
		addFileBtn.addEventListener('click', () => this.openFileSuggestModal());
	}

	/**
	 * Create exclusion list display
	 */
	private createExclusionList(container: HTMLElement, type: 'folders' | 'files'): void {
		const settingKey = type === 'folders' ? 'sonicGraphExcludeFolders' : 'sonicGraphExcludeFiles';
		const exclusionList = this.plugin.settings[settingKey] || [];
		
		logger.debug('ui', `Creating exclusion list for ${type}`, { settingKey, exclusionList, listLength: exclusionList.length });
		
		if (exclusionList.length === 0) {
			const emptyMessage = container.createDiv({ cls: 'osp-exclusion-empty' });
			emptyMessage.textContent = type === 'folders' ? 'No folders excluded' : 'No files excluded';
			logger.debug('ui', `Created empty message for ${type}`);
			return;
		}

		exclusionList.forEach((item, index) => {
			logger.debug('ui', `Creating exclusion item: ${item}`);
			const itemEl = container.createDiv({ cls: 'osp-exclusion-item' });
			
			const itemText = itemEl.createDiv({ cls: 'osp-exclusion-item-text' });
			itemText.textContent = item;
			
			const removeBtn = itemEl.createEl('button', { 
				cls: 'osp-exclusion-remove-btn',
				text: '×'
			});
			removeBtn.addEventListener('click', () => this.removeExclusionItem(type, index));
		});
	}

	/**
	 * Open folder suggest modal
	 */
	private openFolderSuggestModal(): void {
		const modal = new FolderSuggestModal(this.app, (folder) => {
			this.addExclusionItem('folders', folder.path);
		});
		modal.open();
	}

	/**
	 * Open file suggest modal
	 */
	private openFileSuggestModal(): void {
		const modal = new FileSuggestModal(this.app, (file) => {
			this.addExclusionItem('files', file.path);
		});
		modal.open();
	}

	/**
	 * Add exclusion item
	 */
	private addExclusionItem(type: 'folders' | 'files', path: string): void {
		const settingKey = type === 'folders' ? 'sonicGraphExcludeFolders' : 'sonicGraphExcludeFiles';
		const currentList = this.plugin.settings[settingKey] || [];
		
		logger.debug('ui', `Adding ${type} exclusion: ${path}`, { currentList, settingKey });
		
		// Check if already exists
		if (currentList.includes(path)) {
			new Notice(`${type === 'folders' ? 'Folder' : 'File'} already excluded`);
			return;
		}
		
		// Add to list
		currentList.push(path);
		this.plugin.settings[settingKey] = currentList;
		
		logger.debug('ui', `Updated settings`, { newList: currentList });
		
		// Save settings
		this.plugin.saveSettings().then(() => {
			logger.debug('ui', 'Settings saved successfully');
			// Refresh the UI after settings are saved
			this.refreshExclusionLists();
		}).catch(error => {
			logger.error('ui', 'Failed to save settings', error);
		});
		
		logger.debug('ui', `Added ${type === 'folders' ? 'folder' : 'file'} exclusion: ${path}`);
		new Notice(`${type === 'folders' ? 'Folder' : 'File'} excluded: ${path}`);
	}

	/**
	 * Remove exclusion item
	 */
	private removeExclusionItem(type: 'folders' | 'files', index: number): void {
		const settingKey = type === 'folders' ? 'sonicGraphExcludeFolders' : 'sonicGraphExcludeFiles';
		const currentList = this.plugin.settings[settingKey] || [];
		
		if (index >= 0 && index < currentList.length) {
			const removedItem = currentList.splice(index, 1)[0];
			this.plugin.settings[settingKey] = currentList;
			this.plugin.saveSettings();
			
			// Refresh the UI
			this.refreshExclusionLists();
			
			logger.debug('ui', `Removed ${type === 'folders' ? 'folder' : 'file'} exclusion: ${removedItem}`);
			new Notice(`${type === 'folders' ? 'Folder' : 'File'} exclusion removed: ${removedItem}`);
		}
	}

	/**
	 * Refresh exclusion lists display
	 */
	private refreshExclusionLists(): void {
		logger.debug('ui', 'Refreshing exclusion lists');
		
		// Find and refresh both exclusion containers
		const exclusionSections = this.contentContainer.querySelectorAll('.osp-exclusion-section');
		logger.debug('ui', `Found ${exclusionSections.length} exclusion sections`);
		
		// First section should be folders, second should be files
		if (exclusionSections.length >= 1) {
			const foldersContainer = exclusionSections[0].querySelector('.osp-exclusion-container') as HTMLElement;
			if (foldersContainer) {
				logger.debug('ui', 'Refreshing folders container');
				foldersContainer.empty();
				this.createExclusionList(foldersContainer, 'folders');
			}
		}
		
		if (exclusionSections.length >= 2) {
			const filesContainer = exclusionSections[1].querySelector('.osp-exclusion-container') as HTMLElement;
			if (filesContainer) {
				logger.debug('ui', 'Refreshing files container');
				filesContainer.empty();
				this.createExclusionList(filesContainer, 'files');
			}
		}

		// Refresh graph preview and stats with new exclusion settings
		this.refreshGraphWithExclusions();
	}

	/**
	 * Refresh graph preview and stats with updated exclusion settings
	 */
	private async refreshGraphWithExclusions(): Promise<void> {
		try {
			// Update stats
			const statsContainer = this.contentContainer.querySelector('.osp-stats-row');
			if (statsContainer) {
				const filesStat = statsContainer.querySelector('.osp-stat-compact:first-child') as HTMLElement;
				const linksStat = statsContainer.querySelector('.osp-stat-compact:last-child') as HTMLElement;
				if (filesStat && linksStat) {
					await this.updateSonicGraphStats(filesStat, linksStat);
				}
			}

			// Refresh graph preview if it exists
			if (this.graphRenderer) {
				const graphPreviewContainer = this.contentContainer.querySelector('.osp-graph-preview-container') as HTMLElement;
				if (graphPreviewContainer) {
					// Clear current graph
					this.graphRenderer.destroy();
					this.graphRenderer = null;
					
					// Show loading indicator
					graphPreviewContainer.empty();
					const loadingDiv = graphPreviewContainer.createDiv({ cls: 'osp-graph-loading' });
					loadingDiv.textContent = 'Updating graph...';
					
					// Reinitialize with new exclusions
					await this.initializeGraphPreview(graphPreviewContainer, loadingDiv);
				}
			}
		} catch (error) {
			logger.error('ui', 'Failed to refresh graph with exclusions:', error);
		}
	}

	/**
	 * Create family tab content (Strings, Woodwinds, etc.)
	 */
	private createFamilyTab(familyId: string): void {
		const tabConfig = TAB_CONFIGS.find(tab => tab.id === familyId);
		if (!tabConfig) return;

		// Family Overview Card
		this.createFamilyOverviewCard(familyId, tabConfig);

		// Whale integration temporarily disabled due to CORS download issues
		// TODO: Re-enable when we have a reliable sample delivery method (bundled samples or backend)
		// if (familyId === 'experimental') {
		// 	this.createWhaleIntegrationCard();
		// }

		// Individual Instruments Card
		this.createInstrumentsCard(familyId, tabConfig);

		// Rhythmic Percussion Accent Layer (percussion family only)
		if (familyId === 'percussion') {
			this.createRhythmicPercussionCard();
		}

		// Family Effects Card
		this.createFamilyEffectsCard(familyId, tabConfig);
	}

	/**
	 * Create family overview card with stats and bulk actions
	 */
	private createFamilyOverviewCard(familyId: string, tabConfig: any): void {
		const card = new MaterialCard({
			title: `${tabConfig.name} family overview`,
			iconName: getFamilyIcon(familyId),
			subtitle: `${this.getEnabledCount(familyId)} of ${this.getTotalCount(familyId)} instruments enabled`,
			elevation: 1
		});
		
		const content = card.getContent();
		
		// Compact stats row
		const statsRow = content.createDiv({ cls: 'osp-stats-row' });
		
		const enabledStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		enabledStat.createSpan({ cls: 'osp-stat-value', text: `${this.getEnabledCount(familyId)}/${this.getTotalCount(familyId)}` });
		enabledStat.createSpan({ cls: 'osp-stat-label', text: 'Enabled' });
		
		const voicesStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		voicesStat.createSpan({ cls: 'osp-stat-value', text: `${this.getActiveVoices(familyId)}` });
		voicesStat.createSpan({ cls: 'osp-stat-label', text: 'Voices' });
		
		const avgVolumeStat = statsRow.createDiv({ cls: 'osp-stat-compact' });
		avgVolumeStat.createSpan({ cls: 'osp-stat-value', text: '0.7' });
		avgVolumeStat.createSpan({ cls: 'osp-stat-label', text: 'Avg Vol' });
		
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
			title: 'Individual instruments',
			iconName: 'list',
			subtitle: 'Configure instrument-specific settings',
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
	 * Create rhythmic percussion accent layer card
	 */
	private createRhythmicPercussionCard(): void {
		const card = new MaterialCard({
			title: 'Rhythmic Percussion (Accent Layer)',
			iconName: 'drum',
			subtitle: 'Add drum accents to enhance rhythmic emphasis',
			elevation: 1
		});

		const content = card.getContent();

		// Enable/disable toggle
		const enabledSetting = new Setting(content)
			.setName('Enable drum accents')
			.setDesc('Trigger percussion sounds alongside regular notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.percussionAccents?.enabled || false)
				.onChange(async (value) => {
					if (!this.plugin.settings.percussionAccents) {
						this.plugin.settings.percussionAccents = {
							enabled: value,
							density: 0.6,
							activeDrums: { kick: true, snare: true, hihat: true, tom: false },
							accentMode: 'velocity',
							volume: -6
						};
					} else {
						this.plugin.settings.percussionAccents.enabled = value;
					}
					await this.plugin.saveSettings();

					// Reinitialize audio engine to apply changes
					if (this.plugin.audioEngine) {
						await this.plugin.audioEngine.updateSettings(this.plugin.settings);
					}
				})
			);

		// Density slider
		const densitySetting = new Setting(content)
			.setName('Density')
			.setDesc('Probability of percussion triggering (0-100%)')
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue((this.plugin.settings.percussionAccents?.density || 0.6) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.percussionAccents) {
						this.plugin.settings.percussionAccents.density = value / 100;
						await this.plugin.saveSettings();

						// Update percussion engine if initialized
						if (this.plugin.audioEngine) {
							await this.plugin.audioEngine.updateSettings(this.plugin.settings);
						}
					}
				})
			);

		// Active drums section
		const drumsContainer = content.createDiv({ cls: 'osp-percussion-drums-container' });
		new Setting(drumsContainer).setHeading().setName('Active drums');

		const drumsGrid = drumsContainer.createDiv({ cls: 'osp-drums-grid' });

		// Individual drum toggles
		const drums: Array<{ key: 'kick' | 'snare' | 'hihat' | 'tom', label: string }> = [
			{ key: 'kick', label: 'Kick Drum' },
			{ key: 'snare', label: 'Snare Drum' },
			{ key: 'hihat', label: 'Hi-Hat' },
			{ key: 'tom', label: 'Tom' }
		];

		drums.forEach(drum => {
			new Setting(drumsGrid)
				.setName(drum.label)
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.percussionAccents?.activeDrums[drum.key] || false)
					.onChange(async (value) => {
						if (this.plugin.settings.percussionAccents) {
							this.plugin.settings.percussionAccents.activeDrums[drum.key] = value;
							await this.plugin.saveSettings();

							// Update percussion engine if initialized
							if (this.plugin.audioEngine) {
								await this.plugin.audioEngine.updateSettings(this.plugin.settings);
							}
						}
					})
				);
		});

		// Accent mode dropdown
		const modeSetting = new Setting(content)
			.setName('Accent mode')
			.setDesc('How drums are selected based on note properties')
			.addDropdown(dropdown => dropdown
				.addOption('velocity', 'Velocity-based (soft=hi-hat, loud=kick)')
				.addOption('pitch', 'Pitch-based (low=kick, high=hi-hat)')
				.addOption('random', 'Random selection')
				.setValue(this.plugin.settings.percussionAccents?.accentMode || 'velocity')
				.onChange(async (value: 'velocity' | 'pitch' | 'random') => {
					if (this.plugin.settings.percussionAccents) {
						this.plugin.settings.percussionAccents.accentMode = value;
						await this.plugin.saveSettings();

						// Update percussion engine if initialized
						if (this.plugin.audioEngine) {
							await this.plugin.audioEngine.updateSettings(this.plugin.settings);
						}
					}
				})
			);

		// Volume slider
		const volumeSetting = new Setting(content)
			.setName('Volume')
			.setDesc('Percussion volume in dB (-12 to 0)')
			.addSlider(slider => slider
				.setLimits(-12, 0, 1)
				.setValue(this.plugin.settings.percussionAccents?.volume || -6)
				.setDynamicTooltip()
				.onChange(async (value) => {
					if (this.plugin.settings.percussionAccents) {
						this.plugin.settings.percussionAccents.volume = value;
						await this.plugin.saveSettings();

						// Update percussion engine if initialized
						if (this.plugin.audioEngine) {
							await this.plugin.audioEngine.updateSettings(this.plugin.settings);
						}
					}
				})
			);

		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Create whale integration card for experimental family
	 */
	private createWhaleIntegrationCard(): void {
		const card = new MaterialCard({
			title: 'Whale sound integration',
			iconName: 'waves',
			subtitle: 'High-quality external whale samples from marine research institutions',
			elevation: 1
		});

		const content = card.getContent();

		// Get whale integration status
		const whaleIntegration = this.getWhaleIntegrationStatus();
		
		// Enable external whale samples toggle
		createObsidianToggle(
			content,
			whaleIntegration.enabled,
			(enabled) => this.handleWhaleIntegrationToggle(enabled),
			{
				name: 'Use external whale samples',
				description: 'Replace synthesis with authentic whale recordings from NOAA, MBARI, and marine research institutions'
			}
		);

		// Status information section
		const statusSection = content.createDiv({ cls: 'osp-whale-status osp-whale-status--spaced' });

		// Sample collection status
		const collectionRow = statusSection.createDiv({ cls: 'osp-info-row' });
		collectionRow.createSpan({ text: 'Sample collection:', cls: 'osp-info-label' });
		const collectionStatus = collectionRow.createSpan({ 
			text: whaleIntegration.collectionStatus,
			cls: 'osp-info-value' 
		});

		// Available species
		const speciesRow = statusSection.createDiv({ cls: 'osp-info-row' });
		speciesRow.createSpan({ text: 'Available species:', cls: 'osp-info-label' });
		speciesRow.createSpan({ 
			text: whaleIntegration.availableSpecies.join(', '),
			cls: 'osp-info-value' 
		});

		// Sample sources
		const sourcesRow = statusSection.createDiv({ cls: 'osp-info-row' });
		sourcesRow.createSpan({ text: 'Sources:', cls: 'osp-info-label' });
		sourcesRow.createSpan({ 
			text: whaleIntegration.sources.join(', '),
			cls: 'osp-info-value' 
		});

		// Action buttons section
		const actionsRow = content.createDiv({ cls: 'osp-actions-row osp-actions-row--spaced' });

		// Download samples button
		const downloadBtn = actionsRow.createEl('button', {
			cls: 'osp-action-btn osp-action-btn--primary',
			text: 'Download samples'
		});
		downloadBtn.addEventListener('click', () => this.handleWhaleDownload());

		// Preview random sample button
		const previewBtn = actionsRow.createEl('button', {
			cls: 'osp-action-btn osp-action-btn--secondary',
			text: 'Preview sample'
		});
		previewBtn.addEventListener('click', () => this.handleWhalePreview());

		// View attribution info button
		const attributionBtn = actionsRow.createEl('button', {
			cls: 'osp-action-btn osp-action-btn--secondary',
			text: 'Attribution info'
		});
		attributionBtn.addEventListener('click', () => this.handleWhaleAttribution());

		// Future: Manual discovery button (Phase 2)
		const discoveryBtn = actionsRow.createEl('button', { 
			cls: 'osp-action-btn osp-action-btn--secondary',
			text: 'Find new samples'
		});
		discoveryBtn.disabled = true; // Disabled in Phase 1
		discoveryBtn.title = 'Manual sample discovery coming in Phase 2';

		this.contentContainer.appendChild(card.getElement());
	}

	/**
	 * Create family effects card
	 */
	private createFamilyEffectsCard(familyId: string, tabConfig: any): void {
		const card = new MaterialCard({
			title: `${tabConfig.name} effects`,
			iconName: 'sliders-horizontal',
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
			strings: ['strings', 'violin', 'cello', 'contrabass', 'guitar', 'guitarElectric', 'guitarNylon', 'bassElectric', 'harp'],
			woodwinds: ['flute', 'clarinet', 'saxophone', 'bassoon', 'oboe'],
			brass: ['trumpet', 'frenchHorn', 'trombone', 'tuba'],

			percussion: ['timpani', 'xylophone', 'vibraphone', 'gongs'],
			electronic: ['leadSynth', 'bassSynth', 'arpSynth'], // All electronic instruments
			experimental: [], // Whale instruments temporarily disabled
			// experimental: ['whaleHumpback', 'whaleBlue', 'whaleOrca', 'whaleGray', 'whaleSperm', 'whaleMinke', 'whaleFin', 'whaleRight', 'whaleSei', 'whalePilot'],
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

	private handleDemo(): void {
		logger.debug('ui', 'Demo button clicked');
		const demoModal = new GraphDemoModal(this.app);
		demoModal.open();
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
		
		// Use proper instrument name from INSTRUMENT_INFO instead of capitalizeWords
		const instrumentInfo = INSTRUMENT_INFO[instrumentName as keyof typeof INSTRUMENT_INFO] || INSTRUMENT_INFO.piano;
		const titleSpan = title.createSpan();
		this.createInstrumentTitleWithStatus(instrumentName, instrumentInfo, titleSpan);
		
		// Enable toggle
		const toggleContainer = header.createDiv({ cls: 'ospcc-switch' });
		toggleContainer.setAttribute('data-tooltip', `Toggle ${instrumentInfo.name} on/off`);
		toggleContainer.setAttribute('title', `Toggle ${instrumentInfo.name} on/off`);
		
		const toggleInput = toggleContainer.createEl('input', { 
			type: 'checkbox', 
			cls: 'ospcc-switch__input' 
		}) as HTMLInputElement;
		
		// Check if instrument can be toggled (synthesis instruments always can, HQ instruments only if downloaded)
		const canToggle = !this.instrumentRequiresHighQuality(instrumentName) || this.checkIfSampleDownloaded(instrumentName);
		const isEnabled = options.enabled && canToggle;
		
		toggleInput.checked = isEnabled;
		
		// Disable toggle if samples not available
		if (!canToggle) {
			toggleInput.disabled = true;
			toggleContainer.classList.add('ospcc-switch--unavailable');
			toggleContainer.style.cursor = 'not-allowed';
			toggleContainer.setAttribute('data-tooltip', `${instrumentInfo.name} samples not yet downloaded`);
			toggleContainer.setAttribute('title', `${instrumentInfo.name} samples not yet downloaded`);
		}
		
		toggleInput.addEventListener('change', () => {
			if (canToggle) {
				logger.debug('ui', 'Instrument toggle changed', { instrumentName, enabled: toggleInput.checked });
				this.handleInstrumentEnabledChange(instrumentName, toggleInput.checked);
			}
		});
		
		const track = toggleContainer.createDiv({ cls: 'ospcc-switch__track' });
		const thumb = track.createDiv({ cls: 'ospcc-switch__thumb' });
		
		// Make the entire switch container clickable (only if can toggle)
		if (canToggle) {
			toggleContainer.addEventListener('click', (e) => {
				if (e.target !== toggleInput) {
					e.preventDefault();
					toggleInput.checked = !toggleInput.checked;
					toggleInput.dispatchEvent(new Event('change'));
				}
			});
		}
		
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
		voicesLabel.textContent = 'Max voices';
		
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
		const instrumentSettings = (this.plugin.settings.instruments as any)[instrumentName];
		
		// Reverb toggle
		this.createEffectToggle(effectsContainer, 'Reverb', 'reverb', instrumentName, instrumentSettings?.effects?.reverb?.enabled || false);
		
		// Chorus toggle  
		this.createEffectToggle(effectsContainer, 'Chorus', 'chorus', instrumentName, instrumentSettings?.effects?.chorus?.enabled || false);
		
		// Filter toggle
		this.createEffectToggle(effectsContainer, 'Filter', 'filter', instrumentName, instrumentSettings?.effects?.filter?.enabled || false);
		
		// Add quality dropdown for instruments that support both synthesis and recordings
		if (this.instrumentSupportsQualityChoice(instrumentName)) {
			const qualityGroup = paramsContainer.createDiv({ cls: 'osp-param-group-horizontal' });
			const qualityLabel = qualityGroup.createDiv({ cls: 'osp-param-label' });
			qualityLabel.textContent = 'Quality';
			
			const qualityContainer = qualityGroup.createDiv({ cls: 'setting-item' });
			const qualitySelect = qualityContainer.createEl('select', { cls: 'dropdown' });
			
			// Add options
			qualitySelect.createEl('option', { 
				value: 'synthesis',
				text: 'Use synthesis'
			});
			qualitySelect.createEl('option', { 
				value: 'recording', 
				text: 'Use recording'
			});
			
			// Set current value
			const currentSettings = (this.plugin.settings.instruments as any)[instrumentName];
			const usesHighQuality = currentSettings.useHighQuality ?? false;
			qualitySelect.value = usesHighQuality ? 'recording' : 'synthesis';
			
			// Handle changes
			qualitySelect.addEventListener('change', async () => {
				const useRecording = qualitySelect.value === 'recording';
				
				// Check if recording is available when switching to recording mode
				if (useRecording && this.instrumentRequiresHighQuality(instrumentName)) {
					const isDownloaded = this.checkIfSampleDownloaded(instrumentName);
					if (!isDownloaded) {
						new Notice(`${instrumentInfo.name} recording not yet downloaded. Please wait for download to complete.`);
						// Revert selection
						qualitySelect.value = 'synthesis';
						return;
					}
				}
				
				// Update settings
				(this.plugin.settings.instruments as any)[instrumentName].useHighQuality = useRecording;
				await this.plugin.saveSettings();
				
				// Show feedback
				const modeText = useRecording ? 'recording' : 'synthesis';
				new Notice(`${instrumentInfo.name} switched to ${modeText} mode`);
			});
			
			// Disable recording option if not available
			if (this.instrumentRequiresHighQuality(instrumentName)) {
				const isDownloaded = this.checkIfSampleDownloaded(instrumentName);
				if (!isDownloaded) {
					const recordingOption = qualitySelect.querySelector('option[value="recording"]') as HTMLOptionElement;
					if (recordingOption) {
						recordingOption.disabled = true;
						recordingOption.text = 'Use recording (not downloaded)';
					}
				}
			}
		}
	}

	/**
	 * Create individual effect toggle for instruments
	 */
	private createEffectToggle(container: HTMLElement, effectName: string, effectKey: string, instrumentName: string, enabled: boolean): void {
		const toggleGroup = container.createDiv({ cls: 'osp-effect-toggle-group' });
		
		const label = toggleGroup.createDiv({ cls: 'osp-effect-toggle-label' });
		label.textContent = effectName;
		
		const toggleContainer = toggleGroup.createDiv({ cls: 'ospcc-switch osp-effect-toggle' });
		const instrumentInfo = INSTRUMENT_INFO[instrumentName as keyof typeof INSTRUMENT_INFO] || INSTRUMENT_INFO.piano;
		toggleContainer.setAttribute('data-tooltip', `Toggle ${effectName} for ${instrumentInfo.name}`);
		toggleContainer.setAttribute('title', `Toggle ${effectName} for ${instrumentInfo.name}`);
		
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

	private instrumentRequiresHighQuality(instrumentKey: string): boolean {
		// High-quality whale species require high-quality mode
		const highQualityInstruments = ['whaleBlue', 'whaleOrca', 'whaleGray', 'whaleSperm', 'whaleMinke', 'whaleFin', 'whaleRight', 'whaleSei', 'whalePilot'];
		return highQualityInstruments.includes(instrumentKey);
	}

	private instrumentIsSynthesisOnly(instrumentKey: string): boolean {
		// These instruments don't have sample files available and are synthesis-only
		const synthesisOnlyInstruments = ['strings', 'electricPiano', 'harpsichord', 'accordion', 'celesta', 'timpani', 'vibraphone', 'gongs', 'leadSynth', 'bassSynth', 'arpSynth'];
		return synthesisOnlyInstruments.includes(instrumentKey);
	}

	private instrumentSupportsQualityChoice(instrumentKey: string): boolean {
		// Show dropdown for all instruments that support quality choice
		// (No longer dependent on global setting - per-instrument control)
		
		// Check if instrument has useHighQuality setting (indicates it supports choice)
		const instrumentSettings = (this.plugin.settings.instruments as any)[instrumentKey];
		if (!instrumentSettings || !('useHighQuality' in instrumentSettings)) {
			return false;
		}
		
		// Synthesis-only instruments don't need quality choice dropdown
		if (this.instrumentIsSynthesisOnly(instrumentKey)) {
			return false;
		}
		
		// Check if instrument has both synthesis and recording options
		// Instruments with only recordings (requiresHighQuality: true) don't need dropdown
		const requiresHighQuality = this.instrumentRequiresHighQuality(instrumentKey);
		
		// If instrument requires high quality, it's recordings-only (no choice)
		// If instrument doesn't require high quality but has useHighQuality setting, 
		// it has both synthesis and recording options
		return !requiresHighQuality;
	}

	private createInstrumentTitleWithStatus(instrumentKey: string, instrumentInfo: { name: string; icon: string; description: string; defaultFrequencyRange: string }, container: HTMLElement): void {
		container.appendText(`${instrumentInfo.icon} ${instrumentInfo.name}`);

		// Add download status for high-quality instruments
		if (this.instrumentRequiresHighQuality(instrumentKey)) {
			const isDownloaded = this.checkIfSampleDownloaded(instrumentKey);
			const statusText = isDownloaded ? '(downloaded)' : '(not downloaded)';
			container.appendText(' ');
			container.createEl('em', { text: statusText });
		}
	}

	private checkIfSampleDownloaded(instrumentKey: string): boolean {
		// Check if whale samples are downloaded for this species
		try {
			// Get whale integration instance
			const whaleIntegration = (this.plugin as any).whaleIntegration;
			if (!whaleIntegration || !whaleIntegration.whaleManager) {
				return false;
			}

			// Map instrument key to species
			const speciesMap: Record<string, string> = {
				'whaleBlue': 'blue',
				'whaleOrca': 'orca', 
				'whaleGray': 'gray',
				'whaleSperm': 'sperm',
				'whaleMinke': 'minke',
				'whaleFin': 'fin',
				'whaleRight': 'right',
				'whaleSei': 'sei',
				'whalePilot': 'pilot'
			};

			const species = speciesMap[instrumentKey];
			if (!species) return false;

			// Check cache status
			const cacheStatus = whaleIntegration.whaleManager.getCacheStatus();
			return (cacheStatus.cacheBySpecies[species] || 0) > 0;
		} catch (error) {
			return false;
		}
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

	/**
	 * Get whale integration status for UI display
	 */
	private getWhaleIntegrationStatus(): {
		enabled: boolean;
		collectionStatus: string;
		availableSpecies: string[];
		sources: string[];
	} {
		const isHighQuality = false; // Per-instrument quality control - no global setting
		const isWhaleEnabled = this.plugin.settings.instruments.whaleHumpback?.enabled;
		const whaleIntegrationEnabled = isHighQuality && isWhaleEnabled;

		return {
			enabled: whaleIntegrationEnabled || false,
			collectionStatus: whaleIntegrationEnabled ? 'Seed collection (10 samples)' : 'Disabled',
			availableSpecies: whaleIntegrationEnabled ? 
				['Humpback', 'Blue', 'Orca', 'Gray', 'Sperm', 'Minke', 'Fin'] : 
				['None'],
			sources: whaleIntegrationEnabled ? 
				['NOAA Fisheries', 'MBARI MARS', 'NOAA PMEL'] : 
				['None']
		};
	}

	/**
	 * Handle whale integration toggle
	 */
	private async handleWhaleIntegrationToggle(enabled: boolean): Promise<void> {
		if (enabled) {
			// Enable both high quality samples and whale instrument
			await this.plugin.updateSettings({
				instruments: {
					...this.plugin.settings.instruments,
					whaleHumpback: {
						...this.plugin.settings.instruments.whaleHumpback,
						enabled: true,
						useHighQuality: true  // Enable high-quality external samples
					}
				}
			});

			logger.info('whale-ui', 'Whale integration enabled via UI', {
				highQualitySamples: true,
				whaleEnabled: true
			});
		} else {
			// Just disable whale instrument, keep high quality samples setting
			await this.plugin.updateSettings({
				instruments: {
					...this.plugin.settings.instruments,
					whaleHumpback: {
						...this.plugin.settings.instruments.whaleHumpback,
						enabled: false
					}
				}
			});
			
			logger.info('whale-ui', 'Whale integration disabled via UI', {
				whaleEnabled: false
			});
		}

		// Refresh the current tab to update status
		this.showTab('experimental');
	}

	/**
	 * Handle whale sample preview
	 */
	private async handleWhalePreview(): Promise<void> {
		// Play a test whale sound using the audio engine
		if (!this.plugin.audioEngine) {
			new Notice('⚠️ Audio engine not available');
			logger.warn('whale-ui', 'Cannot preview whale sample: audio engine not available');
			return;
		}

		try {
			// Check if whale instrument is enabled
			const whaleEnabled = this.plugin.settings.instruments.whaleHumpback?.enabled;

			if (!whaleEnabled) {
				new Notice('⚠️ Please enable whale sounds first');
				logger.warn('whale-ui', 'Cannot preview whale: instrument not enabled');
				return;
			}

			// Check if whale integration has samples
			const whaleIntegration = getWhaleIntegration();
			const hasSamples = whaleIntegration?.whaleManager?.hasSamples() || false;

			if (!hasSamples) {
				new Notice('ℹ️ No whale samples downloaded yet. Click "Download samples" first to hear authentic whale recordings. Playing synthesized preview...');
				logger.info('whale-ui', 'No cached whale samples available, playing synthesis');
			}

			// Play a low frequency note (typical whale range: 40-200 Hz)
			await this.plugin.audioEngine.playNoteImmediate({
				pitch: 50,        // Low frequency for whale sound
				duration: 2000,   // 2 second duration
				velocity: 0.8,    // Strong velocity
				instrument: 'whaleHumpback'
			});

			if (hasSamples) {
				new Notice('🐋 Playing whale recording...');
			}

			logger.info('whale-ui', 'Whale sample preview triggered', {
				pitch: 50,
				instrument: 'whaleHumpback',
				hasSamples
			});
		} catch (error) {
			new Notice('❌ Failed to preview whale sample');
			logger.error('whale-ui', 'Whale preview failed', {
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	/**
	 * Handle whale attribution info display
	 */
	private handleWhaleAttribution(): void {
		// Create attribution modal or display info
		const attributionInfo = `
# Whale Sample Attribution

## NOAA Fisheries
- Right whale upcalls and multi-sound patterns
- Sei whale downsweeps  
- Pilot whale multi-sound recordings
- Source: https://www.fisheries.noaa.gov/national/science-data/sounds-ocean-mammals

## MBARI MARS Observatory
- Blue whale D-calls from Monterey Bay (36.71°N, 122.187°W)
- Orca vocalizations from California deep-sea observatory
- Gray whale migration recordings
- Sperm whale echolocation clicks
- Source: Deep-sea cabled observatory hydrophone recordings

## NOAA PMEL Acoustics Program
- Alaska humpback whale songs (Winter 1999)
- Atlantic minke whale downsweeps
- Source: https://www.pmel.noaa.gov/acoustics/whales/

## Freesound.org Contributors
- Caribbean humpback whale field recordings by listeningtowhales
- Newfoundland sperm whale echolocation by smithereens
- All samples used under Creative Commons licensing

All whale samples are authentic recordings from marine research institutions and field recordings, ensuring scientific accuracy and educational value.
		`.trim();

		// For now, just log the attribution info
		// In a full implementation, this could open a modal with formatted attribution
		logger.debug('whale-ui', 'Whale attribution info:', attributionInfo);

		logger.info('whale-ui', 'Whale attribution info displayed');

		// Show a simple notice for now
		new Notice('Whale sample attribution information logged to console. Check developer tools for details.');
	}

	/**
	 * Handle manual whale sample download
	 */
	private async handleWhaleDownload(): Promise<void> {
		// Get whale integration instance
		const whaleIntegration = getWhaleIntegration();

		if (!whaleIntegration || !whaleIntegration.whaleManager) {
			new Notice('⚠️ Whale integration not initialized. Please enable whale sounds first.');
			logger.warn('whale-ui', 'Cannot download samples - whale integration not initialized');
			return;
		}

		try {
			new Notice('📥 Starting whale sample download... This may take a few minutes.');
			logger.info('whale-ui', 'Manual whale sample download initiated by user');

			const before = whaleIntegration.whaleManager.getCachedSampleCount();

			await whaleIntegration.whaleManager.manuallyDownloadSamples();

			const after = whaleIntegration.whaleManager.getCachedSampleCount();

			if (after.totalSamples > before.totalSamples || after.totalSamples > 0) {
				new Notice(`✅ Downloaded ${after.totalSamples} whale sample(s) for ${after.speciesCount} species!`);
				logger.info('whale-ui', 'Whale sample download completed', {
					speciesCount: after.speciesCount,
					totalSamples: after.totalSamples
				});
			} else {
				new Notice('⚠️ No whale samples could be downloaded. This may be due to network issues or CORS restrictions. Whale sounds will use synthesis as fallback.');
				logger.warn('whale-ui', 'Whale sample download completed but no samples were cached');
			}
		} catch (error) {
			new Notice('❌ Failed to download whale samples. Check console for details.');
			logger.error('whale-ui', 'Whale sample download failed', {
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	/**
	 * Phase 7.1: Test Freesound API connection
	 */
	private async testFreesoundConnection(buttonEl: HTMLElement): Promise<void> {
		const apiKey = this.plugin.settings.freesoundApiKey;

		if (!apiKey || apiKey.trim().length === 0) {
			new Notice('⚠️ Please enter a Freesound API key first');
			return;
		}

		// Disable button and show loading state
		const button = buttonEl as HTMLButtonElement;
		button.textContent = 'Testing...';
		button.disabled = true;

		logger.info('freesound', `Testing connection with API key (length: ${apiKey.length})`);

		try {
			// Import FreesoundAuthManager dynamically
			const { FreesoundAuthManager } = await import('../audio/freesound/FreesoundAuthManager');

			// Create auth manager and test connection
			const authManager = new FreesoundAuthManager({ apiKey: apiKey.trim() });
			logger.debug('freesound', 'FreesoundAuthManager created, testing connection...');

			const result = await authManager.testConnection();
			logger.debug('freesound', `Connection test result: ${JSON.stringify(result)}`);

			// Restore button state
			button.textContent = 'Test Connection';
			button.disabled = false;

			// Show result to user
			if (result.success) {
				const message = result.username
					? `✓ Connected successfully as ${result.username}`
					: `✓ ${result.message}`;
				new Notice(message, 5000);
				logger.info('freesound', `Connection test successful: ${result.message}`);
			} else {
				// Show more detailed error message
				const detailedMessage = result.message + (result.error ? ` (${result.error})` : '');
				new Notice(`✗ Connection failed: ${detailedMessage}`, 8000);
				logger.error('freesound', `Connection test failed: ${result.error} - ${result.message}`);
			}

		} catch (error) {
			// Restore button state
			button.textContent = 'Test Connection';
			button.disabled = false;

			const errorMessage = error.message || 'Unknown error';
			const stackTrace = error.stack || '';

			new Notice(`✗ Connection test error: ${errorMessage}`, 8000);
			logger.error('freesound', `Connection test exception: ${errorMessage}`);
			logger.debug('freesound', `Stack trace: ${stackTrace}`);
		}
	}
}