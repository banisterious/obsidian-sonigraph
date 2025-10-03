/**
 * Accent Mapper
 *
 * Maps note properties to drum selection for intelligent percussion accents
 */

import { DrumType, NoteEvent, AccentMode, PercussionConfig } from './types';

/**
 * Select which drum to trigger based on note properties and accent mode
 */
export class AccentMapper {
    /**
     * Select drum type based on note event and configuration
     */
    selectDrum(note: NoteEvent, config: PercussionConfig): DrumType | null {
        // Check if percussion should trigger based on density
        if (Math.random() > config.density) {
            return null;
        }

        // Get list of enabled drums
        const enabledDrums = this.getEnabledDrums(config);
        if (enabledDrums.length === 0) {
            return null;
        }

        // Select drum based on accent mode
        switch (config.accentMode) {
            case 'velocity':
                return this.selectByVelocity(note, enabledDrums);
            case 'pitch':
                return this.selectByPitch(note, enabledDrums);
            case 'random':
                return this.selectRandom(enabledDrums);
            default:
                return this.selectRandom(enabledDrums);
        }
    }

    /**
     * Get list of enabled drums from config
     */
    private getEnabledDrums(config: PercussionConfig): DrumType[] {
        const enabled: DrumType[] = [];
        if (config.activeDrums.kick) enabled.push('kick');
        if (config.activeDrums.snare) enabled.push('snare');
        if (config.activeDrums.hihat) enabled.push('hihat');
        if (config.activeDrums.tom) enabled.push('tom');
        return enabled;
    }

    /**
     * Select drum based on note velocity
     * - Low velocity (0-0.3): hi-hat
     * - Medium velocity (0.3-0.6): snare or tom
     * - High velocity (0.6-1.0): kick
     */
    private selectByVelocity(note: NoteEvent, enabledDrums: DrumType[]): DrumType {
        const velocity = note.velocity;

        if (velocity < 0.3) {
            // Soft hit - prefer hi-hat
            if (enabledDrums.includes('hihat')) return 'hihat';
        } else if (velocity < 0.6) {
            // Medium hit - prefer snare or tom
            if (enabledDrums.includes('snare') && enabledDrums.includes('tom')) {
                return Math.random() < 0.5 ? 'snare' : 'tom';
            }
            if (enabledDrums.includes('snare')) return 'snare';
            if (enabledDrums.includes('tom')) return 'tom';
        } else {
            // Hard hit - prefer kick
            if (enabledDrums.includes('kick')) return 'kick';
        }

        // Fallback to random enabled drum
        return this.selectRandom(enabledDrums);
    }

    /**
     * Select drum based on note pitch
     * - Low notes (< MIDI 48): kick
     * - Mid-low notes (48-60): tom
     * - Mid-high notes (60-72): snare
     * - High notes (> 72): hi-hat
     */
    private selectByPitch(note: NoteEvent, enabledDrums: DrumType[]): DrumType {
        const pitch = note.pitch;

        if (pitch < 48) {
            // Low pitch - prefer kick
            if (enabledDrums.includes('kick')) return 'kick';
        } else if (pitch < 60) {
            // Mid-low pitch - prefer tom
            if (enabledDrums.includes('tom')) return 'tom';
        } else if (pitch < 72) {
            // Mid-high pitch - prefer snare
            if (enabledDrums.includes('snare')) return 'snare';
        } else {
            // High pitch - prefer hi-hat
            if (enabledDrums.includes('hihat')) return 'hihat';
        }

        // Fallback to random enabled drum
        return this.selectRandom(enabledDrums);
    }

    /**
     * Select random drum from enabled drums
     */
    private selectRandom(enabledDrums: DrumType[]): DrumType {
        const index = Math.floor(Math.random() * enabledDrums.length);
        return enabledDrums[index];
    }

    /**
     * Get velocity multiplier based on note velocity
     * Maps note velocity to drum hit intensity
     */
    getVelocityMultiplier(note: NoteEvent): number {
        // Map 0-1 velocity to 0.5-1.0 range for drums
        // (Don't go below 0.5 or drums sound too quiet)
        return 0.5 + (note.velocity * 0.5);
    }
}
