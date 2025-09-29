/**
 * Phase 6.2: Temporal Influence
 *
 * Determines instrument selection and orchestration characteristics
 * based on time of day and season to create contextually appropriate soundscapes.
 */

import {
  TimeOfDay,
  Season,
  TemporalInfluence as TemporalInfluenceData
} from './types';

export class TemporalInfluence {
  private timeOfDayStrength: number = 0.5;
  private seasonalStrength: number = 0.3;

  /**
   * Get current temporal influence based on system time
   */
  getCurrentTemporalInfluence(): TemporalInfluenceData {
    const now = new Date();
    const timeOfDay = this.determineTimeOfDay(now);
    const season = this.determineSeason(now);

    return this.calculateInfluence(timeOfDay, season);
  }

  /**
   * Determine time of day from Date object
   */
  private determineTimeOfDay(date: Date): TimeOfDay {
    const hour = date.getHours();

    if (hour >= 5 && hour < 8) return 'early-morning';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 && hour < 24) return 'night';
    return 'late-night';
  }

  /**
   * Determine season from Date object
   */
  private determineSeason(date: Date): Season {
    const month = date.getMonth(); // 0-11

    if (month >= 2 && month <= 4) return 'spring';   // Mar-May
    if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
    if (month >= 8 && month <= 10) return 'autumn';  // Sep-Nov
    return 'winter';                                  // Dec-Feb
  }

  /**
   * Calculate temporal influence data
   */
  private calculateInfluence(
    timeOfDay: TimeOfDay,
    season: Season
  ): TemporalInfluenceData {
    const brightness = this.calculateBrightness(timeOfDay, season);
    const density = this.calculateDensity(timeOfDay, season);
    const instruments = this.selectPreferredInstruments(timeOfDay, season);
    const timbreAdj = this.calculateTimbreAdjustment(timeOfDay, season);

    return {
      timeOfDay,
      season,
      instrumentBrightness: brightness,
      orchestralDensity: density,
      preferredInstruments: instruments,
      timbreAdjustment: timbreAdj
    };
  }

  /**
   * Calculate instrument brightness (0-1)
   * Higher values = brighter, more open sounds
   */
  private calculateBrightness(timeOfDay: TimeOfDay, season: Season): number {
    let brightness = 0.5; // Baseline

    // Time of day influence
    switch (timeOfDay) {
      case 'early-morning':
        brightness += 0.3 * this.timeOfDayStrength;
        break;
      case 'morning':
        brightness += 0.4 * this.timeOfDayStrength;
        break;
      case 'afternoon':
        brightness += 0.2 * this.timeOfDayStrength;
        break;
      case 'evening':
        brightness -= 0.2 * this.timeOfDayStrength;
        break;
      case 'night':
        brightness -= 0.3 * this.timeOfDayStrength;
        break;
      case 'late-night':
        brightness -= 0.4 * this.timeOfDayStrength;
        break;
    }

    // Seasonal influence
    switch (season) {
      case 'spring':
        brightness += 0.2 * this.seasonalStrength;
        break;
      case 'summer':
        brightness += 0.3 * this.seasonalStrength;
        break;
      case 'autumn':
        brightness -= 0.1 * this.seasonalStrength;
        break;
      case 'winter':
        brightness -= 0.2 * this.seasonalStrength;
        break;
    }

    return Math.max(0, Math.min(1, brightness));
  }

  /**
   * Calculate orchestral density (0-1)
   * Higher values = more instruments active
   */
  private calculateDensity(timeOfDay: TimeOfDay, season: Season): number {
    let density = 0.5; // Baseline

    // Time of day influence
    switch (timeOfDay) {
      case 'early-morning':
        density -= 0.2 * this.timeOfDayStrength;
        break;
      case 'morning':
        density += 0.2 * this.timeOfDayStrength;
        break;
      case 'afternoon':
        density += 0.3 * this.timeOfDayStrength;
        break;
      case 'evening':
        density += 0.1 * this.timeOfDayStrength;
        break;
      case 'night':
        density -= 0.2 * this.timeOfDayStrength;
        break;
      case 'late-night':
        density -= 0.4 * this.timeOfDayStrength;
        break;
    }

    // Seasonal influence
    switch (season) {
      case 'spring':
        density += 0.1 * this.seasonalStrength;
        break;
      case 'summer':
        density += 0.3 * this.seasonalStrength;
        break;
      case 'autumn':
        density += 0.2 * this.seasonalStrength;
        break;
      case 'winter':
        density -= 0.1 * this.seasonalStrength;
        break;
    }

    return Math.max(0.2, Math.min(1, density));
  }

  /**
   * Select preferred instruments based on temporal context
   */
  private selectPreferredInstruments(
    timeOfDay: TimeOfDay,
    season: Season
  ): string[] {
    const instruments: string[] = [];

    // Time of day instrument preferences
    const timeInstruments = this.getTimeOfDayInstruments(timeOfDay);
    instruments.push(...timeInstruments);

    // Seasonal instrument preferences
    const seasonInstruments = this.getSeasonalInstruments(season);
    instruments.push(...seasonInstruments);

    // Remove duplicates
    return [...new Set(instruments)];
  }

  /**
   * Get instruments appropriate for time of day
   */
  private getTimeOfDayInstruments(timeOfDay: TimeOfDay): string[] {
    switch (timeOfDay) {
      case 'early-morning':
        return ['flute', 'celesta', 'harp', 'vibraphone'];
      case 'morning':
        return ['flute', 'violin', 'trumpet', 'piano'];
      case 'afternoon':
        return ['piano', 'guitar', 'cello', 'clarinet'];
      case 'evening':
        return ['cello', 'french-horn', 'oboe', 'piano'];
      case 'night':
        return ['bass', 'synth-pad', 'vocal-pad', 'electric-piano'];
      case 'late-night':
        return ['synth-pad', 'bass', 'ambient-drone', 'vocal-pad'];
      default:
        return ['piano', 'synth-pad'];
    }
  }

  /**
   * Get instruments appropriate for season
   */
  private getSeasonalInstruments(season: Season): string[] {
    switch (season) {
      case 'spring':
        return ['flute', 'violin', 'harp', 'celesta', 'clarinet'];
      case 'summer':
        return ['trumpet', 'guitar', 'vibraphone', 'saxophone', 'marimba'];
      case 'autumn':
        return ['cello', 'oboe', 'french-horn', 'bassoon', 'piano'];
      case 'winter':
        return ['celesta', 'vibraphone', 'synth-pad', 'bells', 'ambient-drone'];
      default:
        return ['piano', 'synth-pad'];
    }
  }

  /**
   * Calculate timbre adjustment (-1 to 1)
   * Negative = darker/warmer, Positive = brighter/cooler
   */
  private calculateTimbreAdjustment(
    timeOfDay: TimeOfDay,
    season: Season
  ): number {
    let adjustment = 0;

    // Time of day influence
    switch (timeOfDay) {
      case 'early-morning':
        adjustment += 0.3;
        break;
      case 'morning':
        adjustment += 0.4;
        break;
      case 'afternoon':
        adjustment += 0.1;
        break;
      case 'evening':
        adjustment -= 0.2;
        break;
      case 'night':
        adjustment -= 0.4;
        break;
      case 'late-night':
        adjustment -= 0.5;
        break;
    }

    // Seasonal influence
    switch (season) {
      case 'spring':
        adjustment += 0.2;
        break;
      case 'summer':
        adjustment += 0.1;
        break;
      case 'autumn':
        adjustment -= 0.1;
        break;
      case 'winter':
        adjustment -= 0.2;
        break;
    }

    return Math.max(-1, Math.min(1, adjustment));
  }

  /**
   * Set time of day influence strength (0-1)
   */
  setTimeOfDayStrength(strength: number): void {
    this.timeOfDayStrength = Math.max(0, Math.min(1, strength));
  }

  /**
   * Set seasonal influence strength (0-1)
   */
  setSeasonalStrength(strength: number): void {
    this.seasonalStrength = Math.max(0, Math.min(1, strength));
  }

  /**
   * Get readable description of current temporal context
   */
  getTemporalDescription(influence: TemporalInfluenceData): string {
    const timeDesc = this.getTimeOfDayDescription(influence.timeOfDay);
    const seasonDesc = this.getSeasonDescription(influence.season);
    return `${timeDesc}, ${seasonDesc}`;
  }

  /**
   * Get description for time of day
   */
  private getTimeOfDayDescription(timeOfDay: TimeOfDay): string {
    switch (timeOfDay) {
      case 'early-morning':
        return 'Early morning awakening';
      case 'morning':
        return 'Bright morning energy';
      case 'afternoon':
        return 'Warm afternoon balance';
      case 'evening':
        return 'Mellow evening reflection';
      case 'night':
        return 'Dark atmospheric night';
      case 'late-night':
        return 'Minimal late-night ambience';
      default:
        return 'Unknown time';
    }
  }

  /**
   * Get description for season
   */
  private getSeasonDescription(season: Season): string {
    switch (season) {
      case 'spring':
        return 'spring renewal';
      case 'summer':
        return 'summer richness';
      case 'autumn':
        return 'autumn warmth';
      case 'winter':
        return 'winter clarity';
      default:
        return 'unknown season';
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // No resources to dispose
  }
}