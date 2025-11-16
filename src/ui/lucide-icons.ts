/**
 * Lucide Icon Integration for Sonigraph Control Center
 * Maps Material Design concepts to Lucide icons available in Obsidian
 */

import { setIcon } from 'obsidian';

/**
 * Icon mapping for different UI elements and instrument families
 * All icons are from the Lucide icon set that Obsidian provides
 */
export const LUCIDE_ICONS = {
  // Navigation and UI
  menu: 'menu',
  close: 'x',
  settings: 'settings',
  search: 'search',
  filter: 'filter',
  more: 'more-horizontal',
  
  // Audio Controls
  play: 'play',
  pause: 'pause',
  stop: 'square',
  volume: 'volume-2',
  volumeOff: 'volume-x',
  headphones: 'headphones',
  
  // Status and Monitoring
  activity: 'activity',
  analytics: 'bar-chart-3',
  cpu: 'cpu',
  zap: 'zap',
  checkCircle: 'check-circle',
  alertCircle: 'alert-circle',
  info: 'info',
  
  // Musical Elements
  music: 'music',
  musicNote: 'music',
  waveform: 'activity',
  equalizer: 'sliders-horizontal',
  
  // Instrument Families
  strings: 'music', // Piano/keyboard for strings
  woodwinds: 'circle', // Using circle for woodwinds
  brass: 'volume-2', // Horn-like icon for brass

  percussion: 'circle', // Circle for percussion
  electronic: 'zap', // Electronic/synthesizer
  experimental: 'flask', // Science flask for experimental
  
  // Individual Instruments - Strings
  piano: 'music',
  violin: 'music',
  viola: 'music',
  cello: 'music',
  doubleBass: 'music',
  harp: 'music',
  guitar: 'music',
  
  // Individual Instruments - Woodwinds
  flute: 'circle',
  clarinet: 'circle',
  saxophone: 'circle',
  bassoon: 'circle',
  oboe: 'circle',
  
  // Individual Instruments - Brass
  trumpet: 'volume-2',
  frenchHorn: 'volume-2',
  trombone: 'volume-2',
  tuba: 'volume-2',
  
  // Individual Instruments - Vocals
  
  
  
  // Individual Instruments - Percussion
  timpani: 'circle',
  xylophone: 'grid-3x3',
  vibraphone: 'grid-3x3',
  gongs: 'circle',
  
  // Individual Instruments - Electronic
  leadSynth: 'zap',
  bassSynth: 'zap',
  arpSynth: 'zap',
  
  // Individual Instruments - Experimental
  whaleHumpback: 'activity',
  
  // Effects
  reverb: 'activity',
  chorus: 'repeat',
  delay: 'clock',
  distortion: 'zap',
  compressor: 'maximize-2',
  
  // Controls
  enable: 'toggle-right',
  disable: 'toggle-left',
  volumeControl: 'volume-2',
  voices: 'users',
  
  // Actions
  save: 'save',
  load: 'folder-open',
  reset: 'rotate-ccw',
  copy: 'copy',
  paste: 'clipboard',
  delete: 'trash-2',
  
  // States
  enabled: 'check-circle',
  disabled: 'circle',
  active: 'circle',
  inactive: 'circle',
  warning: 'alert-triangle',
  error: 'x-circle',
  success: 'check-circle',
  
  // Arrows and Navigation
  arrowLeft: 'arrow-left',
  arrowRight: 'arrow-right',
  arrowUp: 'arrow-up',
  arrowDown: 'arrow-down',
  chevronLeft: 'chevron-left',
  chevronRight: 'chevron-right',
  chevronUp: 'chevron-up',
  chevronDown: 'chevron-down',
  
  // Plus/Minus
  plus: 'plus',
  minus: 'minus',
  plusCircle: 'plus-circle',
  minusCircle: 'minus-circle',
  
  // Toggles and Controls
  toggleOn: 'toggle-right',
  toggleOff: 'toggle-left',
  powerOn: 'power',
  powerOff: 'power-off',
} as const;

/**
 * Icon mapping for instrument families with proper categorization
 */
export const FAMILY_ICONS = {
  keyboard: LUCIDE_ICONS.piano,
  strings: LUCIDE_ICONS.strings,
  woodwinds: LUCIDE_ICONS.woodwinds,
  brass: LUCIDE_ICONS.brass,

  percussion: LUCIDE_ICONS.percussion,
  electronic: LUCIDE_ICONS.electronic,
  experimental: LUCIDE_ICONS.experimental,
} as const;

/**
 * Icon mapping for individual instruments
 */
export const INSTRUMENT_ICONS = {
  // Strings
  violin: LUCIDE_ICONS.violin,
  viola: LUCIDE_ICONS.viola,
  cello: LUCIDE_ICONS.cello,
  doubleBass: LUCIDE_ICONS.doubleBass,
  harp: LUCIDE_ICONS.harp,
  piano: LUCIDE_ICONS.piano,
  guitar: LUCIDE_ICONS.guitar,
  
  // Woodwinds
  flute: LUCIDE_ICONS.flute,
  clarinet: LUCIDE_ICONS.clarinet,
  saxophone: LUCIDE_ICONS.saxophone,
  bassoon: LUCIDE_ICONS.bassoon,
  oboe: LUCIDE_ICONS.oboe,
  
  // Brass
  trumpet: LUCIDE_ICONS.trumpet,
  frenchHorn: LUCIDE_ICONS.frenchHorn,
  trombone: LUCIDE_ICONS.trombone,
  tuba: LUCIDE_ICONS.tuba,
  
  // Vocals
  
  
  
  // Percussion
  timpani: LUCIDE_ICONS.timpani,
  xylophone: LUCIDE_ICONS.xylophone,
  vibraphone: LUCIDE_ICONS.vibraphone,
  gongs: LUCIDE_ICONS.gongs,
  
  // Electronic
  leadSynth: LUCIDE_ICONS.leadSynth,
  bassSynth: LUCIDE_ICONS.bassSynth,
  arpSynth: LUCIDE_ICONS.arpSynth,
  
  // Experimental
  whaleHumpback: LUCIDE_ICONS.whaleHumpback,
} as const;

/**
 * Effect icons mapping
 */
export const EFFECT_ICONS = {
  reverb: LUCIDE_ICONS.reverb,
  chorus: LUCIDE_ICONS.chorus,
  filter: LUCIDE_ICONS.filter,
  delay: LUCIDE_ICONS.delay,
  distortion: LUCIDE_ICONS.distortion,
  compressor: LUCIDE_ICONS.compressor,
} as const;

/**
 * Utility function to set Lucide icons on elements
 * @param element - HTML element to set icon on
 * @param iconName - Name of the Lucide icon
 * @param size - Optional size (defaults to 20)
 */
export function setLucideIcon(
  element: HTMLElement,
  iconName: string,
  size: number = 20
): void {
  // Clear any existing content
  void element.empty();

  // Get the actual icon name from our mapping or use the provided name directly
  const actualIconName = (LUCIDE_ICONS as Record<string, string>)[iconName] || iconName;

  // Set the icon using Obsidian's setIcon function
  setIcon(element, actualIconName);

  // Add classes for styling (layout handled by CSS)
  void element.addClass('lucide-icon');

  // Set size dynamically (must remain in JS)
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
}

/**
 * Create an icon element with Lucide icon
 * @param iconName - Name of the Lucide icon
 * @param size - Optional size (defaults to 20)
 * @returns HTMLElement with the icon
 */
export function createLucideIcon(
  iconName: string, 
  size: number = 20
): HTMLElement {
  const iconElement = document.createElement('span');
  setLucideIcon(iconElement, iconName, size);
  return iconElement;
}

/**
 * Get the appropriate icon for an instrument family
 * @param familyName - Name of the instrument family
 * @returns Lucide icon name
 */
export function getFamilyIcon(familyName: string): string {
  const family = familyName.toLowerCase() as keyof typeof FAMILY_ICONS;
  return FAMILY_ICONS[family] || 'music';
}

/**
 * Get the appropriate icon for an individual instrument
 * @param instrumentName - Name of the instrument
 * @returns Lucide icon name
 */
export function getInstrumentIcon(instrumentName: string): string {
  const instrument = instrumentName.toLowerCase().replace(/\s+/g, '') as keyof typeof INSTRUMENT_ICONS;
  return INSTRUMENT_ICONS[instrument] || 'music';
}

/**
 * Get the appropriate icon for an effect type
 * @param effectName - Name of the effect
 * @returns Lucide icon name
 */
export function getEffectIcon(effectName: string): string {
  const effect = effectName.toLowerCase() as keyof typeof EFFECT_ICONS;
  return EFFECT_ICONS[effect] || 'sliders-horizontal';
}

/**
 * Tab configuration with Lucide icons for the new family-based structure
 */
export const TAB_CONFIGS = [
  {
    id: 'guide',
    name: 'Guide',
    icon: 'book-open',
    description: 'Getting started guide and feature overview'
  },
  {
    id: 'status',
    name: 'Status',
    icon: 'bar-chart-3',
    description: 'System monitoring and diagnostics'
  },
  {
    id: 'musical',
    name: 'Musical',
    icon: 'music',
    description: 'Scale, tempo, and musical parameters'
  },
  {
    id: 'master',
    name: 'Master',
    icon: 'sliders-horizontal',
    description: 'Global controls and presets'
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: 'piano',
    description: '7 keyboard instruments',
    instrumentCount: 7
  },
  {
    id: 'strings',
    name: 'Strings',
    icon: 'music',
    description: '9 string instruments',
    instrumentCount: 9
  },
  {
    id: 'woodwinds',
    name: 'Woodwinds',
    icon: 'circle',
    description: '5 woodwind instruments',
    instrumentCount: 5
  },
  {
    id: 'brass',
    name: 'Brass',
    icon: 'volume-2',
    description: '4 brass instruments',
    instrumentCount: 4
  },

  {
    id: 'percussion',
    name: 'Percussion',
    icon: 'circle',
    description: '4 percussion instruments',
    instrumentCount: 4
  },
  {
    id: 'electronic',
    name: 'Electronic',
    icon: 'zap',
    description: '3 electronic synthesizers',
    instrumentCount: 3
  },
  {
    id: 'layers',
    name: 'Layers',
    icon: 'layers',
    description: 'Continuous audio layers and Freesound integration'
  },
  // Experimental tab temporarily hidden - whale integration disabled
  // {
  //   id: 'experimental',
  //   name: 'Experimental',
  //   icon: 'flask',
  //   description: 'Experimental sound sources',
  //   instrumentCount: 1
  // },
  {
    id: 'sonic-graph',
    name: 'Sonic Graph',
    icon: 'globe',
    description: 'Knowledge graph visualization with temporal animation'
  },
  {
    id: 'local-soundscape',
    name: 'Local Soundscape',
    icon: 'compass',
    description: 'Depth-based audio mapping for note exploration'
  }
] as const;

/**
 * Type definitions for better TypeScript support
 */
export type LucideIconName = string; // Simplified to allow any valid Lucide icon name
export type FamilyName = keyof typeof FAMILY_ICONS;
export type InstrumentName = keyof typeof INSTRUMENT_ICONS;
export type EffectName = keyof typeof EFFECT_ICONS;
export type TabConfig = typeof TAB_CONFIGS[number];