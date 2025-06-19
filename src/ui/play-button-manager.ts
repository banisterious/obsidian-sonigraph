/**
 * Enhanced Play Button Manager
 * Provides comprehensive state management and animations for the play button
 */

import { createLucideIcon } from './lucide-icons';
import { getLogger } from '../logging';

const logger = getLogger('play-button-manager');

/**
 * Comprehensive play button states
 */
export type PlayButtonState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopping';

/**
 * Loading substates for detailed feedback
 */
export type LoadingSubstate = 'analyzing' | 'generating' | 'initializing' | 'starting';

/**
 * State configuration for each button state
 */
interface StateConfig {
	icon: string;
	text: string;
	disabled: boolean;
	cssClass: string;
	animation?: string;
}

/**
 * Play button state configurations
 */
const STATE_CONFIGS: Record<PlayButtonState, StateConfig> = {
	idle: {
		icon: 'play',
		text: 'Play',
		disabled: false,
		cssClass: 'osp-header-btn--idle'
	},
	loading: {
		icon: 'loader-2',
		text: 'Loading...',
		disabled: true,
		cssClass: 'osp-header-btn--loading',
		animation: 'perimeter-pulse 1.5s ease-in-out infinite'
	},
	playing: {
		icon: 'pause',
		text: 'Playing',
		disabled: false,
		cssClass: 'osp-header-btn--playing',
		animation: 'pulse-glow 2s ease-in-out infinite'
	},
	paused: {
		icon: 'play',
		text: 'Resume',
		disabled: false,
		cssClass: 'osp-header-btn--paused'
	},
	stopping: {
		icon: 'loader-2',
		text: 'Stopping...',
		disabled: true,
		cssClass: 'osp-header-btn--stopping',
		animation: 'spin 1s linear infinite'
	}
};

/**
 * Loading substate messages for detailed feedback
 */
const LOADING_MESSAGES: Record<LoadingSubstate, string> = {
	analyzing: 'Analyzing vault...',
	generating: 'Generating sequence...',
	initializing: 'Initializing audio...',
	starting: 'Starting playback...'
};

/**
 * Valid state transitions for validation
 */
const VALID_TRANSITIONS: Record<PlayButtonState, PlayButtonState[]> = {
	idle: ['loading', 'idle'], // Allow idle -> idle for reinitialization
	loading: ['playing', 'idle'], // idle on error
	playing: ['paused', 'stopping', 'idle'], // idle on completion
	paused: ['playing', 'stopping', 'idle'],
	stopping: ['idle']
};

/**
 * Enhanced Play Button Manager
 * Manages state, animations, and visual feedback for the play button
 */
export class PlayButtonManager {
	private button: HTMLElement | null = null;
	private currentState: PlayButtonState = 'idle';
	private currentSubstate: LoadingSubstate | null = null;
	private stateChangeListeners: Array<(state: PlayButtonState) => void> = [];

	/**
	 * Initialize the manager with a button element
	 */
	initialize(button: HTMLElement): void {
		this.button = button;
		this.setState('idle');
		logger.debug('manager', 'Play button manager initialized');
	}

	/**
	 * Get current state
	 */
	getCurrentState(): PlayButtonState {
		return this.currentState;
	}

	/**
	 * Set button state with validation
	 */
	setState(newState: PlayButtonState, substate?: LoadingSubstate): void {
		if (!this.isValidTransition(this.currentState, newState)) {
			logger.warn('manager', `Invalid state transition: ${this.currentState} -> ${newState}`);
			return;
		}

		const previousState = this.currentState;
		this.currentState = newState;
		this.currentSubstate = substate || null;

		logger.debug('manager', `State transition: ${previousState} -> ${newState}`, {
			substate: this.currentSubstate
		});

		this.updateButton();
		this.notifyStateChange(newState);
	}

	/**
	 * Set loading substate for detailed feedback
	 */
	setLoadingSubstate(substate: LoadingSubstate): void {
		if (this.currentState === 'loading') {
			this.currentSubstate = substate;
			this.updateButton();
			logger.debug('manager', `Loading substate: ${substate}`);
		}
	}

	/**
	 * Add state change listener
	 */
	onStateChange(listener: (state: PlayButtonState) => void): void {
		this.stateChangeListeners.push(listener);
	}

	/**
	 * Remove state change listener
	 */
	removeStateChangeListener(listener: (state: PlayButtonState) => void): void {
		const index = this.stateChangeListeners.indexOf(listener);
		if (index > -1) {
			this.stateChangeListeners.splice(index, 1);
		}
	}

	/**
	 * Check if state transition is valid
	 */
	private isValidTransition(from: PlayButtonState, to: PlayButtonState): boolean {
		return VALID_TRANSITIONS[from]?.includes(to) ?? false;
	}

	/**
	 * Update button appearance based on current state
	 */
	private updateButton(): void {
		if (!this.button) return;

		const button = this.button as HTMLButtonElement;
		const config = STATE_CONFIGS[this.currentState];

		// Clear existing content and classes
		button.textContent = '';
		button.className = button.className.replace(/osp-header-btn--\w+/g, '');

		// Apply new state
		button.disabled = config.disabled;
		button.classList.add(config.cssClass);

		// Create icon
		const icon = createLucideIcon(config.icon, 16);
		if (config.animation) {
			icon.style.animation = config.animation;
		}
		button.appendChild(icon);

		// Add text - use substate message if available
		const text = this.getDisplayText();
		button.appendText(text);

		// Apply accessibility attributes
		this.updateAccessibility(button, text);
	}

	/**
	 * Get display text based on state and substate
	 */
	private getDisplayText(): string {
		if (this.currentState === 'loading' && this.currentSubstate) {
			return LOADING_MESSAGES[this.currentSubstate];
		}
		return STATE_CONFIGS[this.currentState].text;
	}

	/**
	 * Update accessibility attributes
	 */
	private updateAccessibility(button: HTMLButtonElement, text: string): void {
		button.setAttribute('aria-label', text);
		button.setAttribute('data-state', this.currentState);
		
		if (this.currentState === 'loading' || this.currentState === 'stopping') {
			button.setAttribute('aria-busy', 'true');
		} else {
			button.removeAttribute('aria-busy');
		}
	}

	/**
	 * Notify all state change listeners
	 */
	private notifyStateChange(state: PlayButtonState): void {
		this.stateChangeListeners.forEach(listener => {
			try {
				listener(state);
			} catch (error) {
				logger.error('manager', 'Error in state change listener', error);
			}
		});
	}

	/**
	 * Update loading progress (Phase 3: Enhanced feedback)
	 * Updates button text with progress percentage during loading
	 */
	updateLoadingProgress(percent: number, context?: string): void {
		if (this.currentState !== 'loading') return;
		
		if (!this.button) return;
		
		const progressText = context ? 
			`${context} ${Math.round(percent)}%` : 
			`Loading ${Math.round(percent)}%`;
		
		// Find and update button text
		const textNode = this.button.childNodes[1]; // Text is usually the second child after icon
		if (textNode && textNode.nodeType === Node.TEXT_NODE) {
			textNode.textContent = progressText;
		}
		
		// Update aria-label for accessibility
		this.button.setAttribute('aria-label', progressText);
		
		logger.debug('manager', `Updated loading progress: ${progressText}`);
	}

	/**
	 * Force state reset (for error recovery)
	 */
	forceReset(): void {
		logger.info('manager', 'Force resetting play button state');
		this.currentState = 'idle';
		this.currentSubstate = null;
		this.updateButton();
	}

	/**
	 * Get state configuration for external use
	 */
	getStateConfig(state: PlayButtonState): StateConfig {
		return { ...STATE_CONFIGS[state] };
	}

	/**
	 * Cleanup resources
	 */
	dispose(): void {
		this.stateChangeListeners = [];
		this.button = null;
		logger.debug('manager', 'Play button manager disposed');
	}
}