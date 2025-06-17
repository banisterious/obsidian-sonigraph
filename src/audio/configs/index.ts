/**
 * Modular instrument configuration exports
 * 
 * This module provides centralized access to all instrument families
 * extracted from the monolithic SAMPLER_CONFIGS object.
 */

export * from './types';
export { keyboardInstruments } from './keyboard-instruments';
export { stringInstruments } from './string-instruments';
export { brassInstruments } from './brass-instruments';
export { vocalInstruments } from './vocal-instruments';
export { woodwindInstruments } from './woodwind-instruments';
export { percussionInstruments, electronicInstruments } from './percussion-electronic-instruments';
export { worldInstruments } from './world-instruments';

import { keyboardInstruments } from './keyboard-instruments';
import { stringInstruments } from './string-instruments';
import { brassInstruments } from './brass-instruments';
import { vocalInstruments } from './vocal-instruments';
import { woodwindInstruments } from './woodwind-instruments';
import { percussionInstruments, electronicInstruments } from './percussion-electronic-instruments';
import { worldInstruments } from './world-instruments';
import { InstrumentFamily, InstrumentCollection } from './types';

/**
 * All instrument families organized by category
 */
export const instrumentFamilies: InstrumentFamily[] = [
    keyboardInstruments,
    stringInstruments,
    brassInstruments,
    vocalInstruments,
    woodwindInstruments,
    percussionInstruments,
    electronicInstruments,
    worldInstruments
];

/**
 * Flattened collection of all instruments for backward compatibility
 */
export function getAllInstruments(): InstrumentCollection {
    const allInstruments: InstrumentCollection = {};
    
    instrumentFamilies.forEach(family => {
        Object.assign(allInstruments, family.instruments);
    });
    
    return allInstruments;
}

/**
 * Get instruments by category
 */
export function getInstrumentsByCategory(category: string): InstrumentCollection {
    const instruments: InstrumentCollection = {};
    
    instrumentFamilies.forEach(family => {
        Object.entries(family.instruments).forEach(([name, config]) => {
            if (config.category === category) {
                instruments[name] = config;
            }
        });
    });
    
    return instruments;
}

/**
 * Get instrument families by name
 */
export function getInstrumentFamily(name: string): InstrumentFamily | undefined {
    return instrumentFamilies.find(family => 
        family.name.toLowerCase().includes(name.toLowerCase())
    );
}