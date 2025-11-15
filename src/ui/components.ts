/**
 * UI Components - Standardized Obsidian-style components
 * 
 * These components match Obsidian's native UI patterns exactly,
 * ensuring perfect visual consistency and theme compatibility.
 * 
 * USAGE EXAMPLES:
 * 
 * // Full setting item with name and description
 * createObsidianToggle(container, true, (value) => logger.debug('toggle', 'value changed', { value }), {
 *   name: 'Enable Feature',
 *   description: 'Turn this feature on or off'
 * });
 * 
 * // Simple inline toggle
 * createSimpleToggle(container, false, (value) => logger.debug('toggle', 'value changed', { value }), {
 *   ariaLabel: 'Toggle notification'
 * });
 * 
 * // Programmatic control
 * const checkbox = createObsidianToggle(...);
 * updateToggleValue(checkbox, false);
 * setToggleDisabled(checkbox, true);
 */

import { getLogger } from '../logging';

const logger = getLogger('components');

/**
 * Creates an Obsidian-style toggle that matches the native implementation
 * Based on DOM structure observed in Obsidian's settings
 */
export function createObsidianToggle(
	container: HTMLElement,
	initialValue: boolean,
	onChange: (value: boolean) => void,
	options?: {
		name?: string;
		description?: string;
		disabled?: boolean;
	}
): HTMLElement {
	const settingItem = container.createDiv({ cls: 'setting-item' });
	
	// Setting info (name and description)
	if (options?.name || options?.description) {
		const settingItemInfo = settingItem.createDiv({ cls: 'setting-item-info' });
		
		if (options.name) {
			settingItemInfo.createDiv({ 
				cls: 'setting-item-name',
				text: options.name 
			});
		}
		
		if (options.description) {
			settingItemInfo.createDiv({ 
				cls: 'setting-item-description',
				text: options.description 
			});
		}
	}
	
	// Setting control container
	const settingItemControl = settingItem.createDiv({ cls: 'setting-item-control' });
	
	// Checkbox container (this is what we saw in the Inspector)
	const checkboxContainer = settingItemControl.createDiv({ 
		cls: `checkbox-container${initialValue ? ' is-enabled' : ''}` 
	});
	
	// The actual checkbox input
	const checkbox = checkboxContainer.createEl('input', {
		type: 'checkbox',
		attr: { tabindex: '0' }
	});
	
	// Set initial state
	checkbox.checked = initialValue;
	if (options?.disabled) {
		checkbox.disabled = true;
		checkboxContainer.addClass('is-disabled');
	}
	
	// Handle state changes
	checkbox.addEventListener('change', async (event) => {
		const originalDisabled = checkbox.disabled;
		const checkboxId = Math.random().toString(36).substring(2, 11); // Generate unique ID for tracking
		
		try {
			const newValue = checkbox.checked;
			logger.debug('ui', 'Checkbox change event fired', { 
				checkboxId, 
				newValue, 
				disabled: checkbox.disabled,
				containerElement: checkboxContainer 
			});
			
			// Temporarily disable to prevent multiple rapid clicks
			checkbox.disabled = true;
			
			// Update visual state immediately
			if (newValue) {
				checkboxContainer.addClass('is-enabled');
			} else {
				checkboxContainer.removeClass('is-enabled');
			}
			
			// Call the onChange callback
			logger.debug('ui', 'Calling onChange callback', { checkboxId });
			await onChange(newValue);
			logger.debug('ui', 'Checkbox onChange callback completed', { checkboxId, newValue });
		} catch (error) {
			logger.error('ui', 'Error in checkbox change handler', { checkboxId, error });
			// Revert the checkbox state if the callback failed
			checkbox.checked = !checkbox.checked;
			if (checkbox.checked) {
				checkboxContainer.addClass('is-enabled');
			} else {
				checkboxContainer.removeClass('is-enabled');
			}
		} finally {
			// Re-enable the checkbox
			checkbox.disabled = originalDisabled;
			logger.debug('ui', 'Checkbox re-enabled', { checkboxId, disabled: checkbox.disabled });
		}
	});

	// CRITICAL FIX: Add click handler to container to ensure clicks reach the checkbox
	checkboxContainer.addEventListener('click', (event) => {
		// If the click wasn't on the checkbox itself, forward it to the checkbox
		if (event.target !== checkbox && !checkbox.disabled) {
			logger.debug('ui', 'Container clicked, forwarding to checkbox', { target: event.target });
			event.preventDefault();
			event.stopPropagation();
			checkbox.click(); // This will trigger the change event
		}
	});
	
	// Return the checkbox element for external control if needed
	return checkbox;
}

/**
 * Creates a simple toggle without the full setting item wrapper
 * Useful for inline toggles in custom UI components
 */
export function createSimpleToggle(
	container: HTMLElement,
	initialValue: boolean,
	onChange: (value: boolean) => void,
	options?: {
		disabled?: boolean;
		ariaLabel?: string;
	}
): HTMLElement {
	// Just the checkbox container part
	const checkboxContainer = container.createDiv({ 
		cls: `checkbox-container${initialValue ? ' is-enabled' : ''}` 
	});
	
	const checkbox = checkboxContainer.createEl('input', {
		type: 'checkbox',
		attr: { 
			tabindex: '0',
			...(options?.ariaLabel && { 'aria-label': options.ariaLabel })
		}
	});
	
	checkbox.checked = initialValue;
	if (options?.disabled) {
		checkbox.disabled = true;
		checkboxContainer.addClass('is-disabled');
	}
	
	checkbox.addEventListener('change', () => {
		const newValue = checkbox.checked;
		
		if (newValue) {
			checkboxContainer.addClass('is-enabled');
		} else {
			checkboxContainer.removeClass('is-enabled');
		}
		
		onChange(newValue);
	});
	
	return checkbox;
}

/**
 * Helper to update a toggle's value programmatically
 */
export function updateToggleValue(checkbox: HTMLElement, value: boolean): void {
	if (checkbox instanceof HTMLInputElement && checkbox.type === 'checkbox') {
		checkbox.checked = value;
		
		const container = checkbox.parentElement;
		if (container?.hasClass('checkbox-container')) {
			if (value) {
				container.addClass('is-enabled');
			} else {
				container.removeClass('is-enabled');
			}
		}
	}
}

/**
 * Helper to enable/disable a toggle programmatically
 */
export function setToggleDisabled(checkbox: HTMLElement, disabled: boolean): void {
	if (checkbox instanceof HTMLInputElement && checkbox.type === 'checkbox') {
		checkbox.disabled = disabled;
		
		const container = checkbox.parentElement;
		if (container?.hasClass('checkbox-container')) {
			if (disabled) {
				container.addClass('is-disabled');
			} else {
				container.removeClass('is-disabled');
			}
		}
	}
} 