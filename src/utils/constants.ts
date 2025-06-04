export interface SonigraphSettings {
	tempo: number;
	volume: number;
	scale: string;
	rootNote: string;
	traversalMethod: string;
	isEnabled: boolean;
}

export const DEFAULT_SETTINGS: SonigraphSettings = {
	tempo: 120,
	volume: 0.5,
	scale: 'major',
	rootNote: 'C',
	traversalMethod: 'breadth-first',
	isEnabled: true
};

export const MUSICAL_SCALES = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
	pentatonic: [0, 2, 4, 7, 9],
	chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const TRAVERSAL_METHODS = ['breadth-first', 'depth-first', 'sequential']; 