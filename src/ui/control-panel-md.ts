import { App, Modal, Setting } from 'obsidian';
import SonigraphPlugin from '../main';
import { getLogger } from '../logging';
import { createObsidianToggle } from './components';
import { HarmonicSettings } from '../audio/harmonic-engine';
import { EFFECT_PRESETS, ReverbSettings, ChorusSettings, FilterSettings, getSmartRanges, getParameterRange, INSTRUMENT_INFO } from '../utils/constants';
import { TAB_CONFIGS, setLucideIcon, createLucideIcon, getFamilyIcon, getInstrumentIcon, getEffectIcon, LucideIconName } from './lucide-icons';

const logger = getLogger('control-panel-md');

/**
 * Material Design Control Panel Modal
 * Family-based tab structure with monochrome Material Design styling
 */
export class MaterialControlPanelModal extends Modal {
	plugin: SonigraphPlugin;
	private statusInterval: number | null = null;
	private activeTab: string = 'status';
	private tabContainer: HTMLElement;
	private contentContainer: HTMLElement;
	private appBar: HTMLElement;
	private drawer: HTMLElement;
	private instrumentToggles: Map<string, HTMLElement> = new Map();

	constructor(app: App, plugin: SonigraphPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		logger.debug('ui', 'Opening Material Design Audio Control Center');

		// Add Material Design CSS
		this.loadMaterialDesignStyles();

		// Create app structure
		this.createAppBar();
		this.createMainContainer();
		
		// Start status updates
		this.startStatusUpdates();
	}

	onClose() {
		logger.debug('ui', 'Closing Material Design Audio Control Center');
		this.stopStatusUpdates();
	}

	/**
	 * Load Material Design CSS framework
	 */
	private loadMaterialDesignStyles(): void {
		// Check if styles are already loaded
		if (!document.querySelector('link[href*="material-design.css"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'app://obsidian.md/src/ui/material-design.css';
			document.head.appendChild(link);
		}
	}

	/**
	 * Create Material Design App Bar
	 */
	private createAppBar(): void {
		const { contentEl } = this;
		
		this.appBar = contentEl.createDiv({ cls: 'mdc-app-bar' });
		
		// App bar title section
		const titleContainer = this.appBar.createDiv();
		const title = titleContainer.createDiv({ cls: 'mdc-app-bar__title' });
		
		const titleIcon = createLucideIcon('music', 24);
		title.appendChild(titleIcon);
		title.appendText('Sonigraph Control Center');
		
		const subtitle = title.createSpan({ cls: 'mdc-app-bar__subtitle' });
		subtitle.textContent = '• Transform your knowledge into orchestral soundscapes';
		
		// App bar actions
		const actions = this.appBar.createDiv({ cls: 'mdc-app-bar__actions' });
		this.createHeaderActions(actions);
	}

	/**
	 * Create header action buttons
	 */
	private createHeaderActions(container: HTMLElement): void {
		// Test Audio button
		const testBtn = container.createEl('button', { cls: 'mdc-button mdc-button--text' });
		const testIcon = createLucideIcon('headphones', 18);
		testBtn.appendChild(testIcon);
		testBtn.appendText('Test Audio');
		testBtn.addEventListener('click', () => this.handleTestAudio());

		// Pause button
		const pauseBtn = container.createEl('button', { cls: 'mdc-button mdc-button--outlined' });
		const pauseIcon = createLucideIcon('pause', 18);
		pauseBtn.appendChild(pauseIcon);
		pauseBtn.appendText('Pause');
		pauseBtn.addEventListener('click', () => this.handlePause());

		// Play button
		const playBtn = container.createEl('button', { cls: 'mdc-button mdc-button--filled' });
		const playIcon = createLucideIcon('play', 18);
		playBtn.appendChild(playIcon);
		playBtn.appendText('Play Graph');
		playBtn.addEventListener('click', () => this.handlePlay());
	}

	/**
	 * Create main container with drawer and content area
	 */
	private createMainContainer(): void {
		const { contentEl } = this;
		
		const mainContainer = contentEl.createDiv({ cls: 'main-container' });
		
		// Navigation drawer
		this.createNavigationDrawer(mainContainer);
		
		// Content area
		this.contentContainer = mainContainer.createDiv({ cls: 'content-area' });
		
		// Show initial tab
		this.showTab(this.activeTab);
	}

	/**
	 * Create Material Design navigation drawer
	 */
	private createNavigationDrawer(container: HTMLElement): void {
		this.drawer = container.createDiv({ cls: 'mdc-drawer' });
		
		// Drawer header
		const header = this.drawer.createDiv({ cls: 'mdc-drawer__header' });
		const headerTitle = header.createDiv({ cls: 'mdc-drawer__title' });
		headerTitle.textContent = 'Navigation';
		
		// Drawer content
		const content = this.drawer.createDiv({ cls: 'mdc-drawer__content' });
		this.createNavigationList(content);
	}

	/**
	 * Create navigation list with family-based tabs
	 */
	private createNavigationList(container: HTMLElement): void {
		const list = container.createEl('ul', { cls: 'mdc-list' });
		
		TAB_CONFIGS.forEach((tabConfig, index) => {
			const listItem = list.createEl('li', { 
				cls: `mdc-list-item ${tabConfig.id === this.activeTab ? 'mdc-list-item--activated' : ''}` 
			});
			listItem.setAttribute('data-tab', tabConfig.id);
			
			// Icon
			const graphic = listItem.createDiv({ cls: 'mdc-list-item__graphic' });
			setLucideIcon(graphic, tabConfig.icon as LucideIconName, 24);
			
			// Text
			const text = listItem.createDiv({ cls: 'mdc-list-item__text' });
			text.textContent = tabConfig.name;
			
			// Meta (instrument count for family tabs)
			if ('instrumentCount' in tabConfig) {
				const meta = listItem.createDiv({ cls: 'mdc-list-item__meta' });
				meta.textContent = `${this.getEnabledCount(tabConfig.id)}/${tabConfig.instrumentCount}`;
			}
			
			// Add divider after master tab
			if (tabConfig.id === 'master') {
				const divider = container.createDiv({ cls: 'mdc-divider' });
			}
			
			// Click handler
			listItem.addEventListener('click', () => {
				this.switchTab(tabConfig.id);
			});
		});
	}

	/**
	 * Switch to a different tab
	 */
	private switchTab(tabId: string): void {
		// Update active state in navigation
		this.drawer.querySelectorAll('.mdc-list-item').forEach(item => {
			item.classList.remove('mdc-list-item--activated');
		});
		
		const activeItem = this.drawer.querySelector(`[data-tab="${tabId}"]`);
		if (activeItem) {
			activeItem.classList.add('mdc-list-item--activated');
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
		const card = this.createCard('System Status', 'analytics', 'Real-time monitoring and diagnostics');
		
		const content = card.querySelector('.mdc-card__content') as HTMLElement;
		content.textContent = 'Status tab content will be implemented here...';
		
		this.contentContainer.appendChild(card);
	}

	/**
	 * Create Musical tab content
	 */
	private createMusicalTab(): void {
		const card = this.createCard('Musical Parameters', 'music-4', 'Scale, tempo, and musical settings');
		
		const content = card.querySelector('.mdc-card__content') as HTMLElement;
		content.textContent = 'Musical tab content will be implemented here...';
		
		this.contentContainer.appendChild(card);
	}

	/**
	 * Create Master tab content
	 */
	private createMasterTab(): void {
		const card = this.createCard('Master Controls', 'sliders-horizontal', 'Global audio controls and presets');
		
		const content = card.querySelector('.mdc-card__content') as HTMLElement;
		content.textContent = 'Master tab content will be implemented here...';
		
		this.contentContainer.appendChild(card);
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
		const card = this.createCard(
			`${tabConfig.name} Family Overview`, 
			tabConfig.icon, 
			`${this.getEnabledCount(familyId)} of ${tabConfig.instrumentCount} instruments enabled`
		);
		
		const content = card.querySelector('.mdc-card__content') as HTMLElement;
		
		// Stats grid
		const statsGrid = content.createDiv({ cls: 'mdc-grid mdc-grid--auto-fit' });
		this.createStatCard(statsGrid, `${this.getEnabledCount(familyId)}/${tabConfig.instrumentCount}`, 'Enabled');
		this.createStatCard(statsGrid, this.getActiveVoices(familyId).toString(), 'Active Voices');
		this.createStatCard(statsGrid, '85%', 'CPU Usage');
		this.createStatCard(statsGrid, '2.1s', 'Avg Reverb');
		
		// Bulk actions
		const chipSet = content.createDiv({ cls: 'mdc-chip-set' });
		this.createActionChip(chipSet, 'Enable All', 'check-circle', true);
		this.createActionChip(chipSet, 'Disable All', 'x-circle');
		this.createActionChip(chipSet, 'Reset Volumes', 'volume-2');
		this.createActionChip(chipSet, 'Default Effects', 'settings');
		
		this.contentContainer.appendChild(card);
	}

	/**
	 * Create instruments card for family
	 */
	private createInstrumentsCard(familyId: string, tabConfig: any): void {
		const card = this.createCard('Individual Instruments', 'music', '');
		
		const content = card.querySelector('.mdc-card__content') as HTMLElement;
		const instrumentGrid = content.createDiv({ cls: 'mdc-grid mdc-grid--auto-fill' });
		
		// Get instruments for this family
		const instruments = this.getInstrumentsForFamily(familyId);
		
		instruments.forEach(instrument => {
			this.createInstrumentCard(instrumentGrid, instrument);
		});
		
		this.contentContainer.appendChild(card);
	}

	/**
	 * Create family effects card
	 */
	private createFamilyEffectsCard(familyId: string, tabConfig: any): void {
		const card = this.createCard(
			`${tabConfig.name} Effects`, 
			'waves', 
			'Family-wide effect processing'
		);
		
		const content = card.querySelector('.mdc-card__content') as HTMLElement;
		const effectsGrid = content.createDiv({ cls: 'mdc-grid mdc-grid--3-col' });
		
		// Create effect sections
		this.createEffectSection(effectsGrid, 'Reverb', 'waves', true);
		this.createEffectSection(effectsGrid, 'Chorus', 'repeat', true);
		this.createEffectSection(effectsGrid, 'Filter', 'sliders-horizontal', false);
		
		this.contentContainer.appendChild(card);
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
		
		const content = card.querySelector('.mdc-card__content') as HTMLElement;
		content.textContent = `${tabConfig?.name || 'This'} tab functionality will be implemented soon...`;
		
		this.contentContainer.appendChild(card);
	}

	/**
	 * Utility: Create a Material Design card
	 */
	private createCard(title: string, iconName: LucideIconName, subtitle: string = ''): HTMLElement {
		const card = document.createElement('div');
		card.className = 'mdc-card';
		
		const header = card.createDiv({ cls: 'mdc-card__header' });
		const titleContainer = header.createDiv({ cls: 'mdc-card__title' });
		
		const icon = createLucideIcon(iconName, 24);
		titleContainer.appendChild(icon);
		titleContainer.appendText(title);
		
		if (subtitle) {
			const subtitleEl = header.createDiv({ cls: 'mdc-card__subtitle' });
			subtitleEl.textContent = subtitle;
		}
		
		const content = card.createDiv({ cls: 'mdc-card__content' });
		
		return card;
	}

	/**
	 * Utility: Create a stat card
	 */
	private createStatCard(container: HTMLElement, value: string, label: string): void {
		const statCard = container.createDiv({ cls: 'mdc-surface-container' });
		statCard.style.padding = 'var(--md-space-4)';
		statCard.style.borderRadius = 'var(--md-corner-sm)';
		statCard.style.textAlign = 'center';
		
		const valueEl = statCard.createDiv();
		valueEl.textContent = value;
		valueEl.style.fontSize = 'var(--md-font-headline-small)';
		valueEl.style.fontWeight = '700';
		valueEl.style.color = 'var(--md-primary)';
		valueEl.style.marginBottom = 'var(--md-space-1)';
		
		const labelEl = statCard.createDiv();
		labelEl.textContent = label;
		labelEl.style.fontSize = 'var(--md-font-label-medium)';
		labelEl.style.color = 'var(--md-on-surface-variant)';
		labelEl.style.textTransform = 'uppercase';
		labelEl.style.letterSpacing = '0.5px';
	}

	/**
	 * Utility: Create an action chip
	 */
	private createActionChip(container: HTMLElement, text: string, iconName: LucideIconName, selected: boolean = false): void {
		const chip = container.createDiv({ cls: `mdc-chip ${selected ? 'mdc-chip--selected' : ''}` });
		
		const icon = createLucideIcon(iconName, 16);
		chip.appendChild(icon);
		chip.appendText(text);
		
		chip.addEventListener('click', () => {
			chip.classList.toggle('mdc-chip--selected');
		});
	}

	/**
	 * Utility: Create an individual instrument card
	 */
	private createInstrumentCard(container: HTMLElement, instrumentName: string): void {
		const isEnabled = this.plugin.settings[instrumentName]?.enabled || false;
		
		const card = container.createDiv({ cls: `instrument-card ${isEnabled ? 'instrument-card--enabled' : ''}` });
		
		// Header
		const header = card.createDiv({ cls: 'instrument-card__header' });
		const nameEl = header.createDiv({ cls: 'instrument-name' });
		nameEl.textContent = this.capitalizeWords(instrumentName);
		
		const status = header.createDiv({ cls: 'instrument-status' });
		const statusChip = status.createDiv({ cls: `status-chip ${isEnabled ? 'status-chip--enabled' : ''}` });
		statusChip.textContent = isEnabled ? 'Enabled' : 'Disabled';
		
		// Voice indicators
		const voiceIndicators = status.createDiv({ cls: 'voice-indicators' });
		const maxVoices = this.plugin.settings[instrumentName]?.maxVoices || 4;
		for (let i = 0; i < maxVoices; i++) {
			const dot = voiceIndicators.createDiv({ cls: `voice-dot ${i < 2 && isEnabled ? 'voice-dot--active' : ''}` });
		}
		
		// Content
		const content = card.createDiv({ cls: 'instrument-card__content' });
		
		// Enable toggle
		this.createControlGroup(content, 'Enable Instrument', () => {
			const switchContainer = document.createElement('div');
			switchContainer.className = 'mdc-switch';
			
			const input = switchContainer.createEl('input', { type: 'checkbox', cls: 'mdc-switch__input' });
			input.checked = isEnabled;
			
			const track = switchContainer.createDiv({ cls: 'mdc-switch__track' });
			const thumb = track.createDiv({ cls: 'mdc-switch__thumb' });
			
			return switchContainer;
		});
		
		// Volume slider
		this.createControlGroup(content, 'Volume', () => {
			return this.createSlider(this.plugin.settings[instrumentName]?.volume || 0.7, '0.7');
		});
		
		// Max voices slider
		this.createControlGroup(content, 'Max Voices', () => {
			return this.createSlider(maxVoices / 8, maxVoices.toString());
		});
	}

	/**
	 * Utility: Create an effect section
	 */
	private createEffectSection(container: HTMLElement, name: string, iconName: LucideIconName, enabled: boolean): void {
		const section = container.createDiv({ cls: `effect-card ${enabled ? 'effect-card--enabled' : ''}` });
		
		const header = section.createDiv({ cls: 'effect-header' });
		const title = header.createDiv({ cls: 'effect-title' });
		
		const icon = createLucideIcon(iconName, 20);
		title.appendChild(icon);
		title.appendText(name);
		
		const toggle = header.createDiv({ cls: 'mdc-switch' });
		const input = toggle.createEl('input', { type: 'checkbox', cls: 'mdc-switch__input' });
		input.checked = enabled;
		const track = toggle.createDiv({ cls: 'mdc-switch__track' });
		const thumb = track.createDiv({ cls: 'mdc-switch__thumb' });
		
		// Effect parameters would go here
		if (enabled) {
			section.createDiv({ text: 'Effect parameters...', cls: 'mdc-text-secondary' });
		}
	}

	/**
	 * Utility: Create a control group with label and control element
	 */
	private createControlGroup(container: HTMLElement, label: string, createControl: () => HTMLElement): void {
		const group = container.createDiv({ cls: 'control-group' });
		
		const labelEl = group.createEl('label', { cls: 'control-label' });
		labelEl.textContent = label;
		
		const control = createControl();
		group.appendChild(control);
	}

	/**
	 * Utility: Create a Material Design slider
	 */
	private createSlider(value: number, displayValue: string): HTMLElement {
		const sliderContainer = document.createElement('div');
		sliderContainer.className = 'mdc-slider-container';
		
		const slider = sliderContainer.createDiv({ cls: 'mdc-slider' });
		const track = slider.createDiv({ cls: 'mdc-slider__track' });
		const thumb = slider.createDiv({ cls: 'mdc-slider__thumb' });
		
		// Set initial position
		const percentage = Math.min(Math.max(value * 100, 0), 100);
		thumb.style.left = `${percentage}%`;
		
		const valueDisplay = sliderContainer.createDiv({ cls: 'slider-value' });
		valueDisplay.textContent = displayValue;
		
		return sliderContainer;
	}

	// Utility methods
	private getEnabledCount(familyId: string): number {
		const instruments = this.getInstrumentsForFamily(familyId);
		return instruments.filter(inst => this.plugin.settings[inst]?.enabled).length;
	}

	private getActiveVoices(familyId: string): number {
		// Mock implementation - would get actual voice count from audio engine
		return Math.floor(Math.random() * 20);
	}

	private getInstrumentsForFamily(familyId: string): string[] {
		const familyMap: Record<string, string[]> = {
			strings: ['violin', 'viola', 'cello', 'doubleBass', 'harp', 'piano', 'guitar'],
			woodwinds: ['flute', 'clarinet', 'saxophone', 'bassoon', 'oboe'],
			brass: ['trumpet', 'frenchHorn', 'trombone', 'tuba'],
			vocals: ['soprano', 'alto', 'tenor', 'bass'],
			percussion: ['timpani', 'xylophone', 'vibraphone', 'gongs'],
			electronic: ['leadSynth', 'bassSynth', 'arpSynth'],
			experimental: ['whaleHumpback']
		};
		
		return familyMap[familyId] || [];
	}

	private capitalizeWords(str: string): string {
		return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
	}

	// Event handlers
	private handleTestAudio(): void {
		logger.info('ui', 'Test audio clicked');
		// Implement test audio functionality
	}

	private handlePause(): void {
		logger.info('ui', 'Pause clicked');
		// Implement pause functionality
	}

	private handlePlay(): void {
		logger.info('ui', 'Play clicked');
		// Implement play functionality
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
}