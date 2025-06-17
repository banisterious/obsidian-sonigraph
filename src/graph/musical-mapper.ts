import { GraphData, GraphNode, MusicalMapping, GraphStats } from './types';
import { SonigraphSettings } from '../utils/constants';
import { MUSICAL_SCALES } from '../utils/constants';
import { getLogger } from '../logging';

const logger = getLogger('musical-mapper');

export class MusicalMapper {
	private settings: SonigraphSettings;
	private scale: number[] = [];
	private rootNoteFreq: number = 261.63; // C4 in Hz

	constructor(settings: SonigraphSettings) {
		this.settings = settings;
		this.updateMusicalParams();
	}

	updateSettings(settings: SonigraphSettings): void {
		this.settings = settings;
		this.updateMusicalParams();
	}

	private updateMusicalParams(): void {
		// Set the musical scale
		this.scale = MUSICAL_SCALES[this.settings.scale as keyof typeof MUSICAL_SCALES] || MUSICAL_SCALES.major;
		
		// Set root note frequency
		this.rootNoteFreq = this.getRootNoteFrequency(this.settings.rootNote);
		
		logger.debug('params-update', 'Musical parameters updated', {
			scale: this.settings.scale,
			rootNote: this.settings.rootNote,
			rootFreq: this.rootNoteFreq,
			scaleNotes: this.scale.length
		});
	}

	/**
	 * Map graph nodes to musical parameters
	 */
	mapGraphToMusic(graphData: GraphData, stats: GraphStats): MusicalMapping[] {
		const startTime = logger.time('musical-mapping');
		
		logger.info('mapping', 'Starting musical mapping', {
			nodeCount: stats.totalNodes,
			edgeCount: stats.totalEdges
		});

		const mappings: MusicalMapping[] = [];
		const nodes = Array.from(graphData.nodes.values());

		// Sort nodes by connection count for consistent mapping
		nodes.sort((a, b) => b.connectionCount - a.connectionCount);

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const mapping = this.createNodeMapping(node, i, nodes.length, stats);
			mappings.push(mapping);
		}

		startTime();

		logger.info('mapping', 'Musical mapping complete', {
			mappingsCreated: mappings.length,
			avgPitch: mappings.reduce((sum, m) => sum + m.pitch, 0) / mappings.length,
			totalDuration: mappings.reduce((sum, m) => sum + m.duration, 0)
		});

		return mappings;
	}

	private createNodeMapping(
		node: GraphNode, 
		index: number, 
		totalNodes: number, 
		stats: GraphStats
	): MusicalMapping {
		// Map connection count to pitch (more connections = higher pitch)
		const pitch = this.mapConnectionsToPitch(node.connectionCount, stats.maxConnections);
		
		// Map word count to duration (more content = longer notes)
		const duration = this.mapWordCountToDuration(node.wordCount);
		
		// Map node position in sorted list to velocity (importance)
		const velocity = this.mapPositionToVelocity(index, totalNodes);
		
		// Map creation time to timing offset
		const timing = Math.min(this.mapTimestampToTiming(node.created, node.modified), 5.0); // Cap at 5 seconds

		logger.debug('node-mapping', `Mapped node: ${node.name}`, {
			connections: node.connectionCount,
			wordCount: node.wordCount,
			pitch,
			duration,
			velocity,
			timing
		});

		return {
			nodeId: node.id,
			pitch,
			duration,
			velocity,
			timing
		};
	}

	private mapConnectionsToPitch(connections: number, maxConnections: number): number {
		if (maxConnections === 0) {
			return this.rootNoteFreq;
		}

		// Normalize connection count to scale position
		const normalizedPosition = Math.min(connections / maxConnections, 1);
		
		// Map to scale notes across 3 octaves
		const scalePosition = Math.floor(normalizedPosition * (this.scale.length * 3));
		const octave = Math.floor(scalePosition / this.scale.length);
		const noteInScale = scalePosition % this.scale.length;
		
		// Calculate frequency: root * 2^(semitones/12)
		const semitones = this.scale[noteInScale] + (octave * 12);
		const frequency = this.rootNoteFreq * Math.pow(2, semitones / 12);

		return frequency;
	}

	private mapWordCountToDuration(wordCount: number): number {
		// Base duration in seconds, scaled by word count
		const baseDuration = 1.0;
		const maxDuration = 6.0;
		const minDuration = 0.5;

		// Enhanced logarithmic scaling for word count with better progression
		const scaleFactor = Math.log10(Math.max(wordCount, 1)) * 0.8;
		const scaledDuration = baseDuration + scaleFactor + (wordCount > 100 ? 0.5 : 0);
		
		return Math.max(minDuration, Math.min(maxDuration, scaledDuration));
	}

	private mapPositionToVelocity(position: number, totalNodes: number): number {
		// Higher position (more important nodes) = higher velocity
		const normalizedPosition = 1 - (position / Math.max(totalNodes - 1, 1));
		
		// Map to MIDI velocity range (0.3 to 1.0)
		const minVelocity = 0.3;
		const maxVelocity = 1.0;
		
		return minVelocity + (normalizedPosition * (maxVelocity - minVelocity));
	}

	private mapTimestampToTiming(created: number, modified: number): number {
		// Use recency of modification for timing offset
		const now = Date.now();
		const daysSinceModified = (now - modified) / (1000 * 60 * 60 * 24);
		
		// More recently modified notes play sooner, but with minimal delay
		// Map to 0-3 second range for subtle timing variation
		const maxOffset = 3.0;
		const normalizedAge = Math.min(daysSinceModified / 365, 1); // 1 year = max age
		
		return normalizedAge * maxOffset;
	}

	private getRootNoteFrequency(rootNote: string): number {
		// Frequencies for C4 octave
		const noteFrequencies: Record<string, number> = {
			'C': 261.63,
			'C#': 277.18,
			'D': 293.66,
			'D#': 311.13,
			'E': 329.63,
			'F': 349.23,
			'F#': 369.99,
			'G': 392.00,
			'G#': 415.30,
			'A': 440.00,
			'A#': 466.16,
			'B': 493.88
		};

		return noteFrequencies[rootNote] || noteFrequencies['C'];
	}

	/**
	 * Generate sequence timing based on graph structure
	 */
	generateSequence(mappings: MusicalMapping[], graphData: GraphData): MusicalMapping[] {
		logger.debug('sequence', 'Generating playback sequence', {
			totalMappings: mappings.length
		});

		// Create a copy for processing
		const sequence = [...mappings];

		// Sort by timing offset for initial ordering
		sequence.sort((a, b) => a.timing - b.timing);

		// Redistribute timing to avoid clustering
		const totalDuration = Math.max(30, Math.min(60, sequence.length * 0.08)); // 30-60 seconds with denser notes
		sequence.forEach((mapping, index) => {
			// Spread notes more evenly across time
			const baseTime = (index / sequence.length) * totalDuration;
			const randomOffset = (Math.random() - 0.5) * 0.5; // ±0.25 second variation
			mapping.timing = Math.max(0, baseTime + randomOffset);
		});

		// Apply tempo scaling (convert to musical time)
		const beatDuration = 60 / this.settings.tempo; // seconds per beat
		const tempoMultiplier = Math.sqrt(beatDuration / 0.5); // Gentler scaling using square root
		
		sequence.forEach(mapping => {
			mapping.timing = mapping.timing * Math.min(tempoMultiplier, 1.5); // Cap at 1.5x scaling
		});

		// Final sort by timing
		sequence.sort((a, b) => a.timing - b.timing);

		const finalDuration = Math.max(...sequence.map(m => m.timing + m.duration));
		
		logger.info('sequence', 'Sequence generated with improved timing', {
			totalDuration: finalDuration.toFixed(2),
			noteCount: sequence.length,
			firstNote: sequence[0]?.timing.toFixed(2) || 0,
			lastNote: sequence[sequence.length - 1]?.timing.toFixed(2) || 0,
			avgSpacing: (finalDuration / sequence.length).toFixed(2)
		});

		return sequence;
	}

	/**
	 * Get musical information for display
	 */
	getMusicalInfo(): {
		scale: string;
		rootNote: string;
		tempo: number;
		scaleNotes: number[];
	} {
		return {
			scale: this.settings.scale,
			rootNote: this.settings.rootNote,
			tempo: this.settings.tempo,
			scaleNotes: this.scale
		};
	}
} 