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

		// Issue #010 Fix: Assign instruments to notes to prevent all notes defaulting to same instrument
		// This prevents crackling from overlapping notes on the same instrument
		const instrument = this.assignInstrumentToNode(node, index, totalNodes);

		return {
			nodeId: node.id,
			pitch,
			duration,
			velocity,
			timing,
			instrument
		};
	}

	private mapConnectionsToPitch(connections: number, maxConnections: number): number {
		if (maxConnections === 0) {
			return this.rootNoteFreq;
		}

		// Normalize connection count to scale position
		const normalizedPosition = Math.min(connections / maxConnections, 1);
		
		// Issue #010 Fix: Add frequency diversification to reduce clustering at same pitch
		// Use a power curve to spread low connection counts across more frequencies
		const diversifiedPosition = Math.pow(normalizedPosition, 0.7); // Power curve for better distribution
		
		// Map to scale notes across 4 octaves instead of 3 for more range
		const scalePosition = Math.floor(diversifiedPosition * (this.scale.length * 4));
		const octave = Math.floor(scalePosition / this.scale.length);
		const noteInScale = scalePosition % this.scale.length;
		
		// Calculate base frequency
		const baseFrequency = this.rootNoteFreq * Math.pow(2, (this.scale[noteInScale] + (octave * 12)) / 12);
		
		// Issue #010 Future-Proof Fix: Deterministic micro-detuning to prevent phase interference
		// Use node characteristics for consistent but varied detuning
		const nodeHash = this.hashString(`${connections}-${maxConnections}-freq`);
		const detuningAmount = this.settings.antiCracklingDetuning || 2.0; // Default ±2 cents, configurable
		const detuningCents = ((nodeHash % 100) / 100 - 0.5) * detuningAmount; // Deterministic ±cents
		const detunedFrequency = baseFrequency * Math.pow(2, detuningCents / 1200);

		return detunedFrequency;
	}

	private mapWordCountToDuration(wordCount: number): number {
		// Shorter durations to reduce overlap and crackling
		const baseDuration = 0.3;
		const maxDuration = 0.6;  // Reduced from 0.8
		const minDuration = 0.15; // Reduced from 0.2

		// Enhanced logarithmic scaling for word count with better progression
		const scaleFactor = Math.log10(Math.max(wordCount, 1)) * 0.6; // Reduced scaling
		const scaledDuration = baseDuration + scaleFactor + (wordCount > 100 ? 0.3 : 0); // Reduced bonus
		
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

		// Issue #010 Additional Fix: Add micro-jittering to prevent simultaneous note triggers
		// Sort by timing to identify clusters
		sequence.sort((a, b) => a.timing - b.timing);
		const jitterAmount = 0.02; // 20ms jitter window
		
		for (let i = 1; i < sequence.length; i++) {
			const timeDiff = sequence[i].timing - sequence[i-1].timing;
			// If notes are too close (within 50ms), add small jitter
			if (timeDiff < 0.05) {
				const jitter = Math.random() * jitterAmount;
				sequence[i].timing += jitter;
				logger.debug('sequence', `Applied anti-crackling jitter: ${jitter.toFixed(3)}s to note ${i}`);
			}
		}

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

	/**
	 * Issue #010 Fix: Assign instruments to notes based on characteristics
	 * This prevents all notes from defaulting to the same instrument and causing crackling
	 * Only suggests enabled instruments to prevent fallback to default
	 */
	private assignInstrumentToNode(node: GraphNode, index: number, totalNodes: number): string {
		// Get enabled instruments from settings
		const enabledInstruments = Object.keys(this.settings.instruments).filter(instrumentName => 
			this.settings.instruments[instrumentName as keyof typeof this.settings.instruments]?.enabled
		);

		if (enabledInstruments.length === 0) {
			return 'piano'; // Fallback if no instruments enabled
		}

		if (enabledInstruments.length === 1) {
			return enabledInstruments[0]; // Only one option
		}

		// Define instrument families by frequency range and characteristics (corrected names)
		const instrumentsByRange = {
			low: ['bass', 'tuba', 'cello', 'bassSynth', 'timpani'],
			mid: ['piano', 'strings', 'guitar', 'organ', 'pad', 'saxophone', 'trombone', 'frenchHorn'],
			high: ['violin', 'flute', 'clarinet', 'trumpet', 'soprano', 'xylophone', 'vibraphone', 'oboe'],
			very_high: ['alto', 'tenor', 'leadSynth', 'arpSynth', 'gongs', 'harp']
		};

		// Determine frequency range based on connections (matches our pitch mapping)
		const connectionRatio = node.connectionCount / Math.max(totalNodes, 1);
		let rangeKey: keyof typeof instrumentsByRange;
		
		if (connectionRatio < 0.25) {
			rangeKey = 'low';
		} else if (connectionRatio < 0.5) {
			rangeKey = 'mid';
		} else if (connectionRatio < 0.75) {
			rangeKey = 'high';
		} else {
			rangeKey = 'very_high';
		}

		// Filter candidate instruments to only enabled ones
		const candidateInstruments = instrumentsByRange[rangeKey].filter(instrument => 
			enabledInstruments.includes(instrument)
		);

		// If no enabled instruments in this range, fall back to any enabled instrument
		const finalCandidates = candidateInstruments.length > 0 ? candidateInstruments : enabledInstruments;

		// Use node characteristics to pick a specific instrument
		const nodeHash = this.hashString(node.id + node.name);
		const instrumentIndex = nodeHash % finalCandidates.length;
		const selectedInstrument = finalCandidates[instrumentIndex];

		logger.debug('instrument-assignment', `Assigned ${selectedInstrument} to node ${node.name}`, {
			nodeId: node.id,
			connections: node.connectionCount,
			connectionRatio: connectionRatio.toFixed(3),
			range: rangeKey,
			instrument: selectedInstrument,
			candidateInstruments,
			enabledInstruments: enabledInstruments.length,
			finalCandidates
		});

		return selectedInstrument;
	}

	/**
	 * Simple string hash function for consistent instrument assignment
	 */
	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}
} 