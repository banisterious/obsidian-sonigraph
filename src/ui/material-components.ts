/**
 * Material Design Components for Sonigraph Control Center
 * Reusable UI components following Material Design 3 principles
 */

import { createLucideIcon, LucideIconName } from './lucide-icons';
import { getLogger } from '../logging';

const logger = getLogger('material-components');

/**
 * Interface for component options
 */
export interface ComponentOptions {
	className?: string;
	disabled?: boolean;
	onClick?: () => void;
	[key: string]: unknown;
}

/**
 * Interface for card options
 */
export interface CardOptions extends ComponentOptions {
	title: string;
	iconName?: LucideIconName;
	subtitle?: string;
	elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

/**
 * Interface for stat card options
 */
export interface StatCardOptions extends ComponentOptions {
	value: string;
	label: string;
	iconName?: LucideIconName;
	color?: 'primary' | 'success' | 'warning' | 'error';
}

/**
 * Interface for instrument card options
 */
export interface InstrumentCardOptions extends ComponentOptions {
	instrumentName: string;
	displayName?: string;
	enabled: boolean;
	volume: number;
	maxVoices: number;
	activeVoices?: number;
	onEnabledChange?: (enabled: boolean) => void;
	onVolumeChange?: (volume: number) => void;
	onMaxVoicesChange?: (maxVoices: number) => void;
}

/**
 * Interface for effect section options
 */
export interface EffectSectionOptions extends ComponentOptions {
	effectName: string;
	iconName: LucideIconName;
	enabled: boolean;
	parameters: Array<{
		name: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		onChange?: (value: number) => void;
	}>;
	onEnabledChange?: (enabled: boolean) => void;
}

/**
 * Interface for action chip options
 */
export interface ActionChipOptions extends ComponentOptions {
	text: string;
	iconName?: LucideIconName;
	selected?: boolean;
	onToggle?: (selected: boolean) => void;
}

/**
 * Interface for slider options
 */
export interface SliderOptions extends ComponentOptions {
	value: number;
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
	displayValue?: string;
	onChange?: (value: number) => void;
}

/**
 * Material Design Card Component
 * Creates a card with header, content, and optional actions
 */
export class MaterialCard {
	private container: HTMLElement;
	private header: HTMLElement;
	private content: HTMLElement;
	private actions?: HTMLElement;

	constructor(options: CardOptions) {
		this.container = this.createCardContainer(options);
		this.header = this.createHeader(options);
		this.content = this.createContent();
		
		this.container.appendChild(this.header);
		this.container.appendChild(this.content);
	}

	private createCardContainer(options: CardOptions): HTMLElement {
		const card = document.createElement('div');
		card.className = `ospcc-card ${options.elevation ? `ospcc-elevation-${options.elevation}` : ''} ${options.className || ''}`;
		
		if (options.onClick) {
			card.setCssProps({ cursor: 'pointer' });
			void card.addEventListener('click', options.onClick);
		}

		return card;
	}

	private createHeader(options: CardOptions): HTMLElement {
		const header = document.createElement('div');
		header.className = 'ospcc-card__header';

		const titleContainer = header.createDiv({ cls: 'ospcc-card__title' });

		if (options.iconName) {
			const icon = createLucideIcon(options.iconName, 24);
			void titleContainer.appendChild(icon);
		}

		void titleContainer.appendText(options.title);

		if (options.subtitle) {
			const subtitle = header.createDiv({ cls: 'ospcc-card__subtitle' });
			subtitle.textContent = options.subtitle;
		}

		return header;
	}

	private createContent(): HTMLElement {
		return this.container.createDiv({ cls: 'ospcc-card__content' });
	}

	/**
	 * Get the content container for adding content
	 */
	getContent(): HTMLElement {
		return this.content;
	}

	/**
	 * Get the card container element
	 */
	getElement(): HTMLElement {
		return this.container;
	}

	/**
	 * Add action buttons to the card
	 */
	addActions(): HTMLElement {
		if (!this.actions) {
			this.actions = this.container.createDiv({ cls: 'ospcc-card__actions' });
		}
		return this.actions;
	}

	/**
	 * Update the card title
	 */
	setTitle(title: string): void {
		const titleEl = this.header.querySelector('.ospcc-card__title');
		if (titleEl) {
			const textNode = Array.from(titleEl.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
			if (textNode) {
				textNode.textContent = title;
			}
		}
	}

	/**
	 * Update the card subtitle
	 */
	setSubtitle(subtitle: string): void {
		let subtitleEl = this.header.querySelector('.ospcc-card__subtitle');
		if (!subtitleEl) {
			subtitleEl = this.header.createDiv({ cls: 'ospcc-card__subtitle' });
		}
		subtitleEl.textContent = subtitle;
	}
}

/**
 * Stat Card Component
 * Displays a statistic with value, label, and optional icon
 */
export class StatCard {
	private container: HTMLElement;

	constructor(options: StatCardOptions) {
		this.container = this.createStatCard(options);
	}

	private createStatCard(options: StatCardOptions): HTMLElement {
		const statCard = document.createElement('div');
		const classes = ['ospcc-surface-container', 'ospcc-stat-card'];
		if (options.className) classes.push(options.className);
		if (options.onClick) classes.push('ospcc-stat-card--clickable');
		statCard.className = classes.join(' ');

		if (options.onClick) {
			void statCard.addEventListener('click', options.onClick);
		}

		// Icon (optional)
		if (options.iconName) {
			const iconEl = statCard.createDiv();
			iconEl.className = `ospcc-stat-card__icon ospcc-stat-card__icon--${options.color || 'primary'}`;
			const icon = createLucideIcon(options.iconName, 20);
			void iconEl.appendChild(icon);
		}

		// Value
		const valueEl = statCard.createDiv();
		valueEl.textContent = options.value;
		valueEl.className = `ospcc-stat-card__value ospcc-stat-card__value--${options.color || 'primary'}`;

		// Label
		const labelEl = statCard.createDiv();
		labelEl.textContent = options.label;
		labelEl.className = 'ospcc-stat-card__label';

		return statCard;
	}

	private getColorValue(color?: string): string {
		switch (color) {
			case 'success': return 'var(--md-success)';
			case 'warning': return 'var(--md-warning)';
			case 'error': return 'var(--md-error)';
			case 'primary':
			default: return 'var(--md-primary)';
		}
	}

	getElement(): HTMLElement {
		return this.container;
	}

	setValue(value: string): void {
		const valueEl = this.container.querySelector('div:nth-child(2)');
		if (valueEl) {
			valueEl.textContent = value;
		}
	}
}

/**
 * Instrument Card Component
 * Complete instrument control with enable, volume, voices, and status
 */
export class InstrumentCard {
	private container: HTMLElement;
	private enableSwitch: HTMLInputElement;
	private volumeSlider: MaterialSlider;
	private voicesSlider: MaterialSlider;
	private voiceIndicators: HTMLElement[] = [];

	constructor(private options: InstrumentCardOptions) {
		this.container = this.createInstrumentCard();
	}

	private createInstrumentCard(): HTMLElement {
		const card = document.createElement('div');
		card.className = `instrument-card ${this.options.enabled ? 'instrument-card--enabled' : ''} ${this.options.className || ''}`;

		// Header
		const header = card.createDiv({ cls: 'instrument-card__header' });
		void this.createHeader(header);

		// Content
		const content = card.createDiv({ cls: 'instrument-card__content' });
		void this.createControls(content);

		return card;
	}

	private createHeader(container: HTMLElement): void {
		const nameEl = container.createDiv({ cls: 'instrument-name' });
		nameEl.textContent = this.options.displayName || this.capitalizeWords(this.options.instrumentName);

		const status = container.createDiv({ cls: 'instrument-status' });
		
		const statusChip = status.createDiv({ 
			cls: `status-chip ${this.options.enabled ? 'status-chip--enabled' : ''}` 
		});
		statusChip.textContent = this.options.enabled ? 'Enabled' : 'Disabled';

		// Voice indicators
		const voiceIndicators = status.createDiv({ cls: 'voice-indicators' });
		for (let i = 0; i < this.options.maxVoices; i++) {
			const dot = voiceIndicators.createDiv({ 
				cls: `voice-dot ${i < (this.options.activeVoices || 0) && this.options.enabled ? 'voice-dot--active' : ''}` 
			});
			this.voiceIndicators.push(dot);
		}
	}

	private createControls(container: HTMLElement): void {
		// Enable toggle
		this.createControlGroup(container, 'Enable Instrument', () => {
			const switchContainer = document.createElement('div');
			switchContainer.className = 'ospcc-switch';
			switchContainer.setAttribute('data-tooltip', `Toggle ${this.options.displayName || this.capitalizeWords(this.options.instrumentName)} on/off`);
			switchContainer.setAttribute('title', `Toggle ${this.options.displayName || this.capitalizeWords(this.options.instrumentName)} on/off`);

			this.enableSwitch = switchContainer.createEl('input', {
				type: 'checkbox',
				cls: 'ospcc-switch__input'
			});
			this.enableSwitch.checked = this.options.enabled;
			
			// Add event listener with debugging
			this.enableSwitch.addEventListener('change', (e) => {
				logger.debug('ui', 'Instrument enable switch changed', { checked: this.enableSwitch.checked });
				void this.updateEnabledState(this.enableSwitch.checked);
			});

			const track = switchContainer.createDiv({ cls: 'ospcc-switch__track' });
			track.createDiv({ cls: 'ospcc-switch__thumb' });
			
			// Make the entire switch container clickable
			switchContainer.addEventListener('click', (e) => {
				if (e.target !== this.enableSwitch) {
					void e.preventDefault();
					this.enableSwitch.checked = !this.enableSwitch.checked;
					this.enableSwitch.dispatchEvent(new Event('change'));
				}
			});

			return switchContainer;
		}, true);

		// Volume slider
		this.volumeSlider = new MaterialSlider({
			value: this.options.volume,
			min: 0,
			max: 1,
			step: 0.1,
			unit: '',
			onChange: (value) => {
				if (this.options.onVolumeChange) {
					this.options.onVolumeChange(value);
				}
			}
		});

		this.createControlGroup(container, 'Volume', () => {
			return this.volumeSlider.getElement();
		});

		// Max voices slider
		this.voicesSlider = new MaterialSlider({
			value: this.options.maxVoices,
			min: 1,
			max: 8,
			step: 1,
			unit: '',
			onChange: (value) => {
				this.updateMaxVoices(Math.round(value));
				if (this.options.onMaxVoicesChange) {
					this.options.onMaxVoicesChange(Math.round(value));
				}
			}
		});

		this.createControlGroup(container, 'Max Voices', () => {
			return this.voicesSlider.getElement();
		});
	}

	private createControlGroup(container: HTMLElement, label: string, createControl: () => HTMLElement, isToggle: boolean = false): void {
		const group = container.createDiv({ cls: isToggle ? 'control-group control-group--toggle' : 'control-group control-group--slider' });

		const labelEl = group.createEl('label', { cls: 'control-label' });
		labelEl.textContent = label;

		if (isToggle) {
			const controlWrapper = group.createDiv({ cls: 'control-wrapper' });
			const control = createControl();
			void controlWrapper.appendChild(control);
		} else {
			const control = createControl();
			void group.appendChild(control);
		}
	}

	private updateEnabledState(enabled: boolean): void {
		this.options.enabled = enabled;
		
		// Update card appearance
		if (enabled) {
			this.container.classList.add('instrument-card--enabled');
		} else {
			this.container.classList.remove('instrument-card--enabled');
		}

		// Update status chip
		const statusChip = this.container.querySelector('.status-chip');
		if (statusChip) {
			statusChip.textContent = enabled ? 'Enabled' : 'Disabled';
			statusChip.classList.toggle('status-chip--enabled', enabled);
		}

		// Update voice indicators
		void this.updateVoiceIndicators();

		// Call callback
		if (this.options.onEnabledChange) {
			this.options.onEnabledChange(enabled);
		}
	}

	private updateMaxVoices(maxVoices: number): void {
		this.options.maxVoices = maxVoices;

		// Recreate voice indicators
		const indicatorsContainer = this.container.querySelector('.voice-indicators');
		if (indicatorsContainer) {
			void indicatorsContainer.empty();
			this.voiceIndicators = [];

			for (let i = 0; i < maxVoices; i++) {
				const dot = indicatorsContainer.createDiv({ 
					cls: `voice-dot ${i < (this.options.activeVoices || 0) && this.options.enabled ? 'voice-dot--active' : ''}` 
				});
				this.voiceIndicators.push(dot);
			}
		}
	}

	private updateVoiceIndicators(): void {
		this.voiceIndicators.forEach((indicator, index) => {
			const isActive = index < (this.options.activeVoices || 0) && this.options.enabled;
			indicator.classList.toggle('voice-dot--active', isActive);
		});
	}

	private capitalizeWords(str: string): string {
		return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
	}

	getElement(): HTMLElement {
		return this.container;
	}

	setActiveVoices(activeVoices: number): void {
		this.options.activeVoices = activeVoices;
		void this.updateVoiceIndicators();
	}

	setEnabled(enabled: boolean): void {
		this.enableSwitch.checked = enabled;
		void this.updateEnabledState(enabled);
	}

	setVolume(volume: number): void {
		this.volumeSlider.setValue(volume);
	}
}

/**
 * Effect Section Component
 * Control panel for individual effects with parameters
 */
export class EffectSection {
	private container: HTMLElement;
	private enableSwitch: HTMLInputElement;
	private parameterSliders: MaterialSlider[] = [];

	constructor(private options: EffectSectionOptions) {
		this.container = this.createEffectSection();
	}

	private createEffectSection(): HTMLElement {
		const section = document.createElement('div');
		section.className = `effect-card ${this.options.enabled ? 'effect-card--enabled' : ''} ${this.options.className || ''}`;

		// Header
		const header = section.createDiv({ cls: 'effect-header' });
		void this.createHeader(header);

		// Parameters
		if (this.options.parameters.length > 0) {
			void this.createParameters(section);
		}

		return section;
	}

	private createHeader(container: HTMLElement): void {
		const title = container.createDiv({ cls: 'effect-title' });

		const icon = createLucideIcon(this.options.iconName, 20);
		void title.appendChild(icon);
		void title.appendText(this.options.effectName);

		// Enable toggle
		const toggleContainer = container.createDiv({ cls: 'ospcc-switch' });

		this.enableSwitch = toggleContainer.createEl('input', {
			type: 'checkbox',
			cls: 'ospcc-switch__input'
		});
		this.enableSwitch.checked = this.options.enabled;
		this.enableSwitch.addEventListener('change', () => {
			void this.updateEnabledState(this.enableSwitch.checked);
		});

		const track = toggleContainer.createDiv({ cls: 'ospcc-switch__track' });
		track.createDiv({ cls: 'ospcc-switch__thumb' });
		
		// Make the entire switch container clickable
		toggleContainer.addEventListener('click', (e) => {
			if (e.target !== this.enableSwitch) {
				void e.preventDefault();
				this.enableSwitch.checked = !this.enableSwitch.checked;
				this.enableSwitch.dispatchEvent(new Event('change'));
			}
		});
	}

	private createParameters(container: HTMLElement): void {
		this.options.parameters.forEach(param => {
			const group = container.createDiv({ cls: 'control-group' });

			const label = group.createEl('label', { cls: 'control-label' });
			label.textContent = param.name;

			const slider = new MaterialSlider({
				value: param.value,
				min: param.min || 0,
				max: param.max || 1,
				step: param.step || 0.1,
				unit: param.unit || '',
				onChange: param.onChange
			});

			group.appendChild(slider.getElement());
			this.parameterSliders.push(slider);
		});
	}

	private updateEnabledState(enabled: boolean): void {
		this.options.enabled = enabled;

		// Update appearance
		this.container.classList.toggle('effect-card--enabled', enabled);

		// Call callback
		if (this.options.onEnabledChange) {
			this.options.onEnabledChange(enabled);
		}
	}

	getElement(): HTMLElement {
		return this.container;
	}

	setEnabled(enabled: boolean): void {
		this.enableSwitch.checked = enabled;
		void this.updateEnabledState(enabled);
	}

	setParameterValue(parameterIndex: number, value: number): void {
		if (parameterIndex < this.parameterSliders.length) {
			this.parameterSliders[parameterIndex].setValue(value);
		}
	}
}

/**
 * Action Chip Component
 * Toggleable chip for bulk actions and selections
 */
export class ActionChip {
	private container: HTMLElement;

	constructor(private options: ActionChipOptions) {
		this.container = this.createActionChip();
	}

	private createActionChip(): HTMLElement {
		const chip = document.createElement('div');
		chip.className = `ospcc-chip ${this.options.selected ? 'ospcc-chip--selected' : ''} ${this.options.className || ''}`;

		if (this.options.iconName) {
			const icon = createLucideIcon(this.options.iconName, 16);
			void chip.appendChild(icon);
		}

		void chip.appendText(this.options.text);

		chip.addEventListener('click', () => {
			if (!this.options.disabled) {
				void this.toggle();
			}
		});

		if (this.options.disabled) {
			void chip.addClass('ospcc-chip--disabled');
		}

		return chip;
	}

	private toggle(): void {
		const newSelected = !this.options.selected;
		this.options.selected = newSelected;
		this.container.classList.toggle('ospcc-chip--selected', newSelected);

		if (this.options.onToggle) {
			this.options.onToggle(newSelected);
		}
	}

	getElement(): HTMLElement {
		return this.container;
	}

	setSelected(selected: boolean): void {
		this.options.selected = selected;
		this.container.classList.toggle('ospcc-chip--selected', selected);
	}

	setText(text: string): void {
		// Find text node and update it
		const textNode = Array.from(this.container.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
		if (textNode) {
			textNode.textContent = text;
		}
	}
}

/**
 * Material Slider Component
 * Slider with Material Design styling and value display
 */
export class MaterialSlider {
	private container: HTMLElement;
	private slider: HTMLElement;
	private thumb: HTMLElement;
	private track: HTMLElement;
	private valueDisplay: HTMLElement;

	constructor(private options: SliderOptions) {
		this.container = this.createSlider();
		void this.updateDisplay();
	}

	private createSlider(): HTMLElement {
		const sliderContainer = document.createElement('div');
		sliderContainer.className = `ospcc-slider-container ${this.options.className || ''}`;

		// Slider track container
		this.slider = sliderContainer.createDiv({ cls: 'ospcc-slider' });
		const trackContainer = this.slider.createDiv({ cls: 'ospcc-slider__track-container' });
		this.track = trackContainer.createDiv({ cls: 'ospcc-slider__track' });
		this.track.createDiv({ cls: 'ospcc-slider__track-active' });
		this.thumb = this.slider.createDiv({ cls: 'ospcc-slider__thumb' });

		// Value display
		this.valueDisplay = sliderContainer.createDiv({ cls: 'slider-value' });

		// Mouse interaction
		void this.setupInteraction();

		return sliderContainer;
	}

	private setupInteraction(): void {
		let isDragging = false;

		const updateValue = (clientX: number) => {
			const rect = this.slider.getBoundingClientRect();
			const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
			
			const min = this.options.min || 0;
			const max = this.options.max || 1;
			const step = this.options.step || 0.1;
			
			let value = min + percentage * (max - min);
			value = Math.round(value / step) * step;
			value = Math.max(min, Math.min(max, value));

			this.options.value = value;
			void this.updateDisplay();

			if (this.options.onChange) {
				this.options.onChange(value);
			}
		};

		this.slider.addEventListener('mousedown', (e) => {
			isDragging = true;
			updateValue(e.clientX);
			void e.preventDefault();
		});

		document.addEventListener('mousemove', (e) => {
			if (isDragging) {
				updateValue(e.clientX);
			}
		});

		document.addEventListener('mouseup', () => {
			isDragging = false;
		});

		// Note: Hover effect is handled by CSS (.ospcc-slider:hover .ospcc-slider__thumb)
	}

	private updateDisplay(): void {
		const min = this.options.min || 0;
		const max = this.options.max || 1;
		const percentage = (this.options.value - min) / (max - min) * 100;

		// Update thumb and track position
		this.thumb.style.left = `${percentage}%`;
		
		const activeTrack = this.track.querySelector('.ospcc-slider__track-active');
		if (activeTrack) {
			activeTrack.style.width = `${percentage}%`;
		}

		// Update value display
		const displayValue = this.options.displayValue || `${this.options.value.toFixed(1)}${this.options.unit || ''}`;
		this.valueDisplay.textContent = displayValue;
		
		// Update tooltip data attribute
		this.thumb.setAttribute('data-value', displayValue);
	}

	getElement(): HTMLElement {
		return this.container;
	}

	setValue(value: number): void {
		this.options.value = value;
		void this.updateDisplay();
	}

	getValue(): number {
		return this.options.value;
	}

	setDisplayValue(displayValue: string): void {
		this.options.displayValue = displayValue;
		void this.updateDisplay();
	}
}

/**
 * Material Button Component
 * Button with Material Design variants
 */
export class MaterialButton {
	private container: HTMLElement;

	constructor(options: {
		text: string;
		variant?: 'text' | 'outlined' | 'filled' | 'tonal';
		iconName?: LucideIconName;
		disabled?: boolean;
		onClick?: () => void;
		className?: string;
	}) {
		this.container = this.createButton(options);
	}

	private createButton(options: unknown): HTMLElement {
		const button = document.createElement('button');
		button.className = `ospcc-button ospcc-button--${options.variant || 'filled'} ${options.className || ''}`;
		button.disabled = options.disabled || false;

		if (options.iconName) {
			const icon = createLucideIcon(options.iconName, 18);
			void button.appendChild(icon);
		}

		void button.appendText(options.text);

		if (options.onClick) {
			void button.addEventListener('click', options.onClick);
		}

		return button;
	}

	getElement(): HTMLElement {
		return this.container;
	}

	setDisabled(disabled: boolean): void {
		(this.container as HTMLButtonElement).disabled = disabled;
	}

	setText(text: string): void {
		const textNode = Array.from(this.container.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
		if (textNode) {
			textNode.textContent = text;
		}
	}
}

/**
 * Material Divider Component
 */
export function createDivider(): HTMLElement {
	return document.createElement('div') as HTMLElement & { className: string };
}

/**
 * Utility function to create a grid container
 */
export function createGrid(columns?: 'auto-fit' | 'auto-fill' | '2-col' | '3-col'): HTMLElement {
	const grid = document.createElement('div');
	grid.className = `ospcc-grid ${columns ? `ospcc-grid--${columns}` : ''}`;
	return grid;
}