/**
 * ContextualModifier - Environmental context influence on musical parameters
 *
 * This module provides context-aware modifiers that can influence audio based on:
 * - Season (Spring/Summer/Fall/Winter)
 * - Time of day (Dawn/Day/Dusk/Night)
 * - Weather conditions (Clear/Cloudy/Rain/Storm/Snow)
 * - Theme (Light/Dark mode)
 *
 * Modifiers affect: instrument selection, pitch offset, velocity, and audio effects
 */

import { getLogger } from '../../logging';
import { SonigraphSettings } from '../../utils/constants';

const logger = getLogger('ContextualModifier');

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Weather = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow';
export type Theme = 'light' | 'dark';

/**
 * Context state representing current environmental conditions
 */
export interface ContextState {
	season: Season;
	timeOfDay: TimeOfDay;
	weather: Weather;
	theme: Theme;
}

/**
 * Modifiers to apply to musical parameters based on context
 */
export interface ContextModifiers {
	instrumentBias: number;    // -1.0 to +1.0 (affects instrument selection)
	pitchOffset: number;       // Semitones to add/subtract
	velocityMultiplier: number; // 0.5 to 1.5 (affects volume/intensity)
	reverbAmount: number;      // 0.0 to 1.0 (affects reverb/ambient effects)
	brightness: number;        // -1.0 to +1.0 (affects timbre/tone color)
}

export class ContextualModifier {
	private settings: SonigraphSettings;

	constructor(settings: SonigraphSettings) {
		this.settings = settings;
	}

	/**
	 * Get current context state based on settings and auto-detection
	 */
	getCurrentContext(): ContextState {
		const contextSettings = this.settings.localSoundscape?.contextAware;

		return {
			season: this.getCurrentSeason(contextSettings?.season?.override),
			timeOfDay: this.getCurrentTimeOfDay(contextSettings?.timeOfDay?.override),
			weather: this.getCurrentWeather(contextSettings?.weather?.override),
			theme: this.getCurrentTheme(contextSettings?.theme?.override)
		};
	}

	/**
	 * Calculate modifiers based on current context
	 */
	calculateModifiers(): ContextModifiers {
		const contextSettings = this.settings.localSoundscape?.contextAware;

		// If context-aware is disabled, return neutral modifiers
		if (!contextSettings?.enabled) {
			return this.getNeutralModifiers();
		}

		const context = this.getCurrentContext();
		const mode = contextSettings.mode || 'influenced';
		const influenceWeight = (contextSettings.influenceWeight ?? 50) / 100; // Convert 0-100% to 0-1

		// Calculate individual modifiers
		let seasonMods = this.getNeutralModifiers();
		let timeMods = this.getNeutralModifiers();
		let weatherMods = this.getNeutralModifiers();
		let themeMods = this.getNeutralModifiers();

		if (contextSettings.season?.enabled) {
			seasonMods = this.getSeasonModifiers(context.season);
		}
		if (contextSettings.timeOfDay?.enabled) {
			timeMods = this.getTimeOfDayModifiers(context.timeOfDay);
		}
		if (contextSettings.weather?.enabled) {
			weatherMods = this.getWeatherModifiers(context.weather);
		}
		if (contextSettings.theme?.enabled) {
			themeMods = this.getThemeModifiers(context.theme);
		}

		// Combine modifiers (average all enabled factors)
		const enabledCount = [
			contextSettings.season?.enabled,
			contextSettings.timeOfDay?.enabled,
			contextSettings.weather?.enabled,
			contextSettings.theme?.enabled
		].filter(Boolean).length;

		if (enabledCount === 0) {
			return this.getNeutralModifiers();
		}

		const combined: ContextModifiers = {
			instrumentBias: (seasonMods.instrumentBias + timeMods.instrumentBias + weatherMods.instrumentBias + themeMods.instrumentBias) / enabledCount,
			pitchOffset: (seasonMods.pitchOffset + timeMods.pitchOffset + weatherMods.pitchOffset + themeMods.pitchOffset) / enabledCount,
			velocityMultiplier: (seasonMods.velocityMultiplier + timeMods.velocityMultiplier + weatherMods.velocityMultiplier + themeMods.velocityMultiplier) / enabledCount,
			reverbAmount: (seasonMods.reverbAmount + timeMods.reverbAmount + weatherMods.reverbAmount + themeMods.reverbAmount) / enabledCount,
			brightness: (seasonMods.brightness + timeMods.brightness + weatherMods.brightness + themeMods.brightness) / enabledCount
		};

		// Apply influence weight (blend with neutral if mode is 'influenced')
		if (mode === 'influenced') {
			const neutral = this.getNeutralModifiers();
			return {
				instrumentBias: this.blend(neutral.instrumentBias, combined.instrumentBias, influenceWeight),
				pitchOffset: this.blend(neutral.pitchOffset, combined.pitchOffset, influenceWeight),
				velocityMultiplier: this.blend(neutral.velocityMultiplier, combined.velocityMultiplier, influenceWeight),
				reverbAmount: this.blend(neutral.reverbAmount, combined.reverbAmount, influenceWeight),
				brightness: this.blend(neutral.brightness, combined.brightness, influenceWeight)
			};
		}

		// Mode is 'only' - use full context modifiers
		return combined;
	}

	/**
	 * Get neutral modifiers (no context influence)
	 */
	private getNeutralModifiers(): ContextModifiers {
		return {
			instrumentBias: 0,
			pitchOffset: 0,
			velocityMultiplier: 1.0,
			reverbAmount: 0.3, // Base reverb amount
			brightness: 0
		};
	}

	/**
	 * Blend two values based on weight (0 = use a, 1 = use b)
	 */
	private blend(a: number, b: number, weight: number): number {
		return a * (1 - weight) + b * weight;
	}

	/**
	 * Get current season based on date or override
	 */
	private getCurrentSeason(override?: Season | null): Season {
		if (override) {
			return override;
		}

		// Auto-detect season based on month (Northern Hemisphere)
		const month = new Date().getMonth(); // 0-11
		if (month >= 2 && month <= 4) return 'spring'; // Mar-May
		if (month >= 5 && month <= 7) return 'summer'; // Jun-Aug
		if (month >= 8 && month <= 10) return 'fall'; // Sep-Nov
		return 'winter'; // Dec-Feb
	}

	/**
	 * Get season-based modifiers
	 * Spring: Bright, major keys, rising pitches
	 * Summer: Warm, energetic, higher velocities
	 * Fall: Mellow, minor keys, descending
	 * Winter: Cold, sparse, lower velocities
	 */
	private getSeasonModifiers(season: Season): ContextModifiers {
		switch (season) {
			case 'spring':
				return {
					instrumentBias: 0.3,      // Prefer brighter instruments
					pitchOffset: 2,           // +2 semitones (brighter)
					velocityMultiplier: 1.1,  // Slightly more energetic
					reverbAmount: 0.4,        // Moderate reverb (open space)
					brightness: 0.5           // Bright timbre
				};
			case 'summer':
				return {
					instrumentBias: 0.5,      // Strong preference for energetic instruments
					pitchOffset: 3,           // +3 semitones (warm, high)
					velocityMultiplier: 1.3,  // Very energetic
					reverbAmount: 0.2,        // Less reverb (dry, direct)
					brightness: 0.7           // Very bright
				};
			case 'fall':
				return {
					instrumentBias: -0.3,     // Prefer mellower instruments
					pitchOffset: -2,          // -2 semitones (darker)
					velocityMultiplier: 0.9,  // Slightly subdued
					reverbAmount: 0.5,        // More reverb (contemplative)
					brightness: -0.3          // Warmer, less bright
				};
			case 'winter':
				return {
					instrumentBias: -0.5,     // Prefer sparse, cold instruments
					pitchOffset: -4,          // -4 semitones (very low)
					velocityMultiplier: 0.7,  // Subdued, quiet
					reverbAmount: 0.7,        // High reverb (empty, cold space)
					brightness: -0.6          // Dark, cold timbre
				};
		}
	}

	/**
	 * Get current time of day based on hour or override
	 */
	private getCurrentTimeOfDay(override?: TimeOfDay | null): TimeOfDay {
		if (override) {
			return override;
		}

		// Auto-detect based on hour
		const hour = new Date().getHours();
		if (hour >= 5 && hour < 8) return 'dawn';   // 5am-8am
		if (hour >= 8 && hour < 17) return 'day';   // 8am-5pm
		if (hour >= 17 && hour < 20) return 'dusk'; // 5pm-8pm
		return 'night'; // 8pm-5am
	}

	/**
	 * Get time-of-day modifiers
	 * Dawn: Rising pitches, increasing velocity
	 * Day: Stable, consistent
	 * Dusk: Descending pitches, decreasing velocity
	 * Night: Ambient, reverb-heavy, quiet
	 */
	private getTimeOfDayModifiers(timeOfDay: TimeOfDay): ContextModifiers {
		switch (timeOfDay) {
			case 'dawn':
				return {
					instrumentBias: 0.2,      // Slight preference for brighter
					pitchOffset: 1,           // +1 semitone (rising)
					velocityMultiplier: 0.9,  // Gentle start
					reverbAmount: 0.5,        // Atmospheric
					brightness: 0.3           // Brightening
				};
			case 'day':
				return {
					instrumentBias: 0,        // Neutral
					pitchOffset: 0,           // Neutral
					velocityMultiplier: 1.0,  // Normal energy
					reverbAmount: 0.3,        // Normal reverb
					brightness: 0.2           // Slightly bright
				};
			case 'dusk':
				return {
					instrumentBias: -0.2,     // Slight preference for warmer
					pitchOffset: -1,          // -1 semitone (descending)
					velocityMultiplier: 0.9,  // Winding down
					reverbAmount: 0.5,        // More atmospheric
					brightness: -0.3          // Darkening
				};
			case 'night':
				return {
					instrumentBias: -0.4,     // Prefer ambient, pad instruments
					pitchOffset: -2,          // -2 semitones (lower)
					velocityMultiplier: 0.7,  // Quiet, subdued
					reverbAmount: 0.8,        // Heavy reverb (space, silence)
					brightness: -0.5          // Dark, warm
				};
		}
	}

	/**
	 * Get current weather (uses override or default to 'clear')
	 * Note: Weather API integration would go here
	 */
	private getCurrentWeather(override?: Weather | null): Weather {
		if (override) {
			return override;
		}

		// TODO: Implement weather API integration
		// For now, default to clear
		return 'clear';
	}

	/**
	 * Get weather-based modifiers
	 * Clear: Clean, bright, normal
	 * Cloudy: Muted, softer
	 * Rain: Rhythmic elements, moderate reverb
	 * Storm: Dramatic, intense
	 * Snow: Crystalline, sparse, quiet
	 */
	private getWeatherModifiers(weather: Weather): ContextModifiers {
		switch (weather) {
			case 'clear':
				return {
					instrumentBias: 0.1,      // Slight preference for clean tones
					pitchOffset: 0,           // Neutral
					velocityMultiplier: 1.0,  // Normal
					reverbAmount: 0.2,        // Clear, direct
					brightness: 0.3           // Bright, clear
				};
			case 'cloudy':
				return {
					instrumentBias: -0.1,     // Slightly muted
					pitchOffset: -1,          // Slightly lower
					velocityMultiplier: 0.9,  // Softer
					reverbAmount: 0.4,        // Diffused
					brightness: -0.2          // Less bright
				};
			case 'rain':
				return {
					instrumentBias: 0,        // Neutral (rhythmic)
					pitchOffset: 0,           // Neutral
					velocityMultiplier: 1.1,  // Slightly more active
					reverbAmount: 0.6,        // Wet, reflective
					brightness: -0.1          // Slightly muted
				};
			case 'storm':
				return {
					instrumentBias: 0.6,      // Strong, dramatic instruments
					pitchOffset: 2,           // Higher tension
					velocityMultiplier: 1.4,  // Very intense
					reverbAmount: 0.7,        // Heavy atmosphere
					brightness: 0.5           // Dramatic, cutting
				};
			case 'snow':
				return {
					instrumentBias: -0.3,     // Sparse, crystalline
					pitchOffset: 3,           // Higher (crystalline quality)
					velocityMultiplier: 0.6,  // Very quiet
					reverbAmount: 0.9,        // Very spacious (muffled world)
					brightness: 0.7           // Bright, crystalline
				};
		}
	}

	/**
	 * Get current theme (light/dark mode)
	 */
	private getCurrentTheme(override?: Theme | null): Theme {
		if (override) {
			return override;
		}

		// Auto-detect from Obsidian theme
		// Check if document body has theme class
		const body = document.body;
		if (body.classList.contains('theme-dark')) {
			return 'dark';
		}
		return 'light';
	}

	/**
	 * Get theme-based modifiers
	 * Light: Higher octaves, brighter timbres
	 * Dark: Lower octaves, warmer tones
	 */
	private getThemeModifiers(theme: Theme): ContextModifiers {
		switch (theme) {
			case 'light':
				return {
					instrumentBias: 0.2,      // Prefer brighter instruments
					pitchOffset: 2,           // +2 semitones (higher)
					velocityMultiplier: 1.1,  // Slightly more energetic
					reverbAmount: 0.2,        // Less reverb (clear)
					brightness: 0.5           // Bright timbre
				};
			case 'dark':
				return {
					instrumentBias: -0.2,     // Prefer warmer instruments
					pitchOffset: -2,          // -2 semitones (lower)
					velocityMultiplier: 0.9,  // Slightly subdued
					reverbAmount: 0.5,        // More reverb (atmospheric)
					brightness: -0.4          // Warm, dark timbre
				};
		}
	}

	/**
	 * Log current context state for debugging
	 */
	logContext(): void {
		const context = this.getCurrentContext();
		const modifiers = this.calculateModifiers();

		logger.info('context-state', 'Current environmental context', {
			season: context.season,
			timeOfDay: context.timeOfDay,
			weather: context.weather,
			theme: context.theme,
			modifiers: {
				instrumentBias: modifiers.instrumentBias.toFixed(2),
				pitchOffset: modifiers.pitchOffset.toFixed(1),
				velocityMultiplier: modifiers.velocityMultiplier.toFixed(2),
				reverbAmount: modifiers.reverbAmount.toFixed(2),
				brightness: modifiers.brightness.toFixed(2)
			}
		});
	}
}
