/**
 * TurnTakingEngine
 *
 * Creates musical dialogue patterns by organizing instruments into turn-taking
 * instead of all playing simultaneously. Reduces sonic congestion and adds
 * conversational interest.
 *
 * Patterns:
 * - none: All instruments together (current default)
 * - sequential: One instrument at a time
 * - call-response: Alternating groups (center vs periphery)
 * - solos: Featured instrument with accompaniment
 * - layered-entry: Progressive build-up
 * - conversation: Graph-based dialogue
 * - fugue: Imitative staggered entries
 * - antiphonal: Stereo spatial alternation
 */

import { getLogger } from '../../logging';

const logger = getLogger('TurnTakingEngine');

/**
 * Turn-taking pattern types
 */
export type TurnTakingPattern =
	| 'none'              // All instruments together (default)
	| 'sequential'        // One instrument at a time
	| 'call-response'     // Alternating groups
	| 'solos'             // Featured instrument + accompaniment
	| 'layered-entry'     // Progressive build
	| 'conversation'      // Graph-based dialogue
	| 'fugue'             // Imitative entries
	| 'antiphonal';       // Stereo alternation

/**
 * Turn-taking configuration
 */
export interface TurnTakingConfig {
	enabled: boolean;
	pattern: TurnTakingPattern;
	turnLength: number;              // Beats per turn (default: 4)
	accompanimentReduction: number;  // 0-1, volume reduction for non-solo (default: 0.4)
}

/**
 * Extended mapping interface for turn-taking metadata
 */
export interface TurnTakingMapping {
	isSolo?: boolean;           // This note is featured/prominent
	isAccompaniment?: boolean;  // This note is background support
	turnIndex?: number;         // Which turn this belongs to
	depth?: number;             // Depth in graph (for grouping)
	instrument?: string;        // Instrument name (for grouping)
	pan?: number;               // Stereo position (for antiphonal)
	timing?: number;            // Note timing (for turn calculation)
	velocity?: number;          // Note velocity (to modify)
	duration?: number;          // Note duration
}

/**
 * Default turn-taking configuration
 */
export const DEFAULT_TURN_TAKING_CONFIG: TurnTakingConfig = {
	enabled: false,
	pattern: 'call-response',
	turnLength: 4,              // 4 beats per turn
	accompanimentReduction: 0.4  // 40% volume reduction
};

/**
 * TurnTakingEngine class
 */
export class TurnTakingEngine {
	private config: TurnTakingConfig;

	constructor(config: Partial<TurnTakingConfig>) {
		this.config = { ...DEFAULT_TURN_TAKING_CONFIG, ...config };

		logger.info('turn-taking-init', 'TurnTakingEngine initialized', {
			enabled: this.config.enabled,
			pattern: this.config.pattern,
			turnLength: this.config.turnLength
		});
	}

	/**
	 * Apply turn-taking pattern to mappings
	 */
	public applyPattern<T extends TurnTakingMapping>(mappings: T[]): T[] {
		if (!this.config.enabled || mappings.length === 0) {
			return mappings;
		}

		logger.info('turn-taking-apply', `Applying ${this.config.pattern} pattern`, {
			totalMappings: mappings.length
		});

		switch (this.config.pattern) {
			case 'sequential':
				return this.applySequential(mappings);

			case 'call-response':
				return this.applyCallResponse(mappings);

			case 'solos':
				return this.applySolos(mappings);

			case 'layered-entry':
				return this.applyLayeredEntry(mappings);

			case 'conversation':
				return this.applyConversation(mappings);

			case 'fugue':
				return this.applyFugue(mappings);

			case 'antiphonal':
				return this.applyAntiphonal(mappings);

			case 'none':
			default:
				return mappings;
		}
	}

	/**
	 * Sequential: One instrument at a time
	 */
	private applySequential<T extends TurnTakingMapping>(mappings: T[]): T[] {
		// Group by instrument
		const instrumentGroups = this.groupByInstrument(mappings);
		const instruments = Array.from(instrumentGroups.keys());

		if (instruments.length === 0) return mappings;

		const turnDuration = this.config.turnLength; // In beats (assuming 1 beat = 1 second for simplicity)
		const totalDuration = this.getTotalDuration(mappings);

		mappings.forEach(mapping => {
			// Determine which turn this mapping falls into
			const turnIndex = Math.floor((mapping.timing || 0) / turnDuration);
			const activeInstrument = instruments[turnIndex % instruments.length];

			if (mapping.instrument === activeInstrument) {
				mapping.isSolo = true;
				mapping.turnIndex = turnIndex;
			} else {
				mapping.isAccompaniment = true;
				mapping.velocity = (mapping.velocity || 1.0) * this.config.accompanimentReduction;
			}
		});

		logger.debug('sequential-applied', `Sequential pattern applied`, {
			instruments: instruments.length,
			turns: Math.ceil(totalDuration / turnDuration)
		});

		return mappings;
	}

	/**
	 * Call-Response: Alternating groups (center vs periphery)
	 */
	private applyCallResponse<T extends TurnTakingMapping>(mappings: T[]): T[] {
		const centerGroup = mappings.filter(m => m.depth === 0);
		const peripheryGroup = mappings.filter(m => (m.depth || 0) > 0);

		const turnDuration = this.config.turnLength;
		const totalDuration = this.getTotalDuration(mappings);

		let isCallTurn = true;

		for (let time = 0; time < totalDuration; time += turnDuration) {
			const activeGroup = isCallTurn ? centerGroup : peripheryGroup;
			const silentGroup = isCallTurn ? peripheryGroup : centerGroup;

			// Active group plays prominently
			activeGroup
				.filter(m => (m.timing || 0) >= time && (m.timing || 0) < time + turnDuration)
				.forEach(m => {
					m.isSolo = true;
					m.turnIndex = Math.floor(time / turnDuration);
				});

			// Silent group is reduced
			silentGroup
				.filter(m => (m.timing || 0) >= time && (m.timing || 0) < time + turnDuration)
				.forEach(m => {
					m.isAccompaniment = true;
					m.velocity = (m.velocity || 1.0) * this.config.accompanimentReduction;
				});

			isCallTurn = !isCallTurn;
		}

		logger.debug('call-response-applied', `Call-response pattern applied`, {
			centerNotes: centerGroup.length,
			peripheryNotes: peripheryGroup.length,
			turns: Math.ceil(totalDuration / turnDuration)
		});

		return mappings;
	}

	/**
	 * Solos: Featured instrument with accompaniment
	 */
	private applySolos<T extends TurnTakingMapping>(mappings: T[]): T[] {
		const instrumentGroups = this.groupByInstrument(mappings);
		const instruments = Array.from(instrumentGroups.keys());

		if (instruments.length === 0) return mappings;

		const phraseLength = this.config.turnLength;
		const totalDuration = this.getTotalDuration(mappings);

		for (let time = 0; time < totalDuration; time += phraseLength) {
			const turnIndex = Math.floor(time / phraseLength);
			const soloInstrument = instruments[turnIndex % instruments.length];

			mappings
				.filter(m => (m.timing || 0) >= time && (m.timing || 0) < time + phraseLength)
				.forEach(mapping => {
					if (mapping.instrument === soloInstrument) {
						// Solo instrument - prominent
						mapping.isSolo = true;
						mapping.turnIndex = turnIndex;
						mapping.velocity = Math.min(1.0, (mapping.velocity || 1.0) * 1.2); // Slight boost
					} else {
						// Accompaniment - reduced
						mapping.isAccompaniment = true;
						mapping.velocity = (mapping.velocity || 1.0) * this.config.accompanimentReduction;
					}
				});
		}

		logger.debug('solos-applied', `Solos pattern applied`, {
			instruments: instruments.length,
			phrases: Math.ceil(totalDuration / phraseLength)
		});

		return mappings;
	}

	/**
	 * Layered Entry: Instruments enter progressively
	 */
	private applyLayeredEntry<T extends TurnTakingMapping>(mappings: T[]): T[] {
		const instrumentGroups = this.groupByInstrument(mappings);
		const instruments = Array.from(instrumentGroups.keys());

		if (instruments.length === 0) return mappings;

		const entryInterval = this.config.turnLength;

		instruments.forEach((instrument, index) => {
			const entryTime = index * entryInterval;

			instrumentGroups.get(instrument)?.forEach(mapping => {
				if ((mapping.timing || 0) < entryTime) {
					// Before this instrument's entry time - mute
					mapping.velocity = 0;
					mapping.isAccompaniment = true;
				} else {
					// After entry - gradually fade in
					const timeSinceEntry = (mapping.timing || 0) - entryTime;
					const fadeDuration = 1.0; // 1 second fade

					if (timeSinceEntry < fadeDuration) {
						// Still fading in
						const fadeProgress = timeSinceEntry / fadeDuration;
						mapping.velocity = (mapping.velocity || 1.0) * fadeProgress;
					}
				}
			});
		});

		logger.debug('layered-entry-applied', `Layered entry pattern applied`, {
			instruments: instruments.length,
			entryInterval
		});

		return mappings;
	}

	/**
	 * Conversation: Graph-based dialogue (bidirectional links)
	 * Simplified: alternates between depth layers as "conversation"
	 */
	private applyConversation<T extends TurnTakingMapping>(mappings: T[]): T[] {
		// Group by depth
		const depthGroups = this.groupByDepth(mappings);
		const depths = Array.from(depthGroups.keys()).sort((a, b) => a - b);

		if (depths.length === 0) return mappings;

		const turnDuration = this.config.turnLength;
		const totalDuration = this.getTotalDuration(mappings);

		for (let time = 0; time < totalDuration; time += turnDuration) {
			const turnIndex = Math.floor(time / turnDuration);
			const activeDepth = depths[turnIndex % depths.length];

			mappings
				.filter(m => (m.timing || 0) >= time && (m.timing || 0) < time + turnDuration)
				.forEach(mapping => {
					if (mapping.depth === activeDepth) {
						mapping.isSolo = true;
						mapping.turnIndex = turnIndex;
					} else {
						mapping.isAccompaniment = true;
						mapping.velocity = (mapping.velocity || 1.0) * this.config.accompanimentReduction;
					}
				});
		}

		logger.debug('conversation-applied', `Conversation pattern applied`, {
			depths: depths.length,
			turns: Math.ceil(totalDuration / turnDuration)
		});

		return mappings;
	}

	/**
	 * Fugue: Imitative staggered entries
	 */
	private applyFugue<T extends TurnTakingMapping>(mappings: T[]): T[] {
		const instrumentGroups = this.groupByInstrument(mappings);
		const instruments = Array.from(instrumentGroups.keys());

		if (instruments.length === 0) return mappings;

		const entryDelay = this.config.turnLength;

		instruments.forEach((instrument, voiceIndex) => {
			instrumentGroups.get(instrument)?.forEach(mapping => {
				// Offset timing by voice index * entry delay
				if (mapping.timing !== undefined) {
					mapping.timing += voiceIndex * entryDelay;
				}

				// Mark as part of fugue voice
				mapping.turnIndex = voiceIndex;
			});
		});

		logger.debug('fugue-applied', `Fugue pattern applied`, {
			voices: instruments.length,
			entryDelay
		});

		return mappings;
	}

	/**
	 * Antiphonal: Stereo spatial alternation (left vs right)
	 */
	private applyAntiphonal<T extends TurnTakingMapping>(mappings: T[]): T[] {
		const leftGroup = mappings.filter(m => (m.pan || 0) < -0.3);
		const rightGroup = mappings.filter(m => (m.pan || 0) > 0.3);
		const centerGroup = mappings.filter(m => Math.abs(m.pan || 0) <= 0.3);

		const turnDuration = this.config.turnLength;
		const totalDuration = this.getTotalDuration(mappings);

		let isLeftTurn = true;

		for (let time = 0; time < totalDuration; time += turnDuration) {
			const activeGroup = isLeftTurn ? leftGroup : rightGroup;
			const silentGroup = isLeftTurn ? rightGroup : leftGroup;

			// Active side plays prominently
			activeGroup
				.filter(m => (m.timing || 0) >= time && (m.timing || 0) < time + turnDuration)
				.forEach(m => {
					m.isSolo = true;
					m.turnIndex = Math.floor(time / turnDuration);
				});

			// Opposite side is reduced
			silentGroup
				.filter(m => (m.timing || 0) >= time && (m.timing || 0) < time + turnDuration)
				.forEach(m => {
					m.isAccompaniment = true;
					m.velocity = (m.velocity || 1.0) * 0.3; // Heavy reduction
				});

			// Center provides subtle foundation
			centerGroup
				.filter(m => (m.timing || 0) >= time && (m.timing || 0) < time + turnDuration)
				.forEach(m => {
					m.isAccompaniment = true;
					m.velocity = (m.velocity || 1.0) * 0.5;
				});

			isLeftTurn = !isLeftTurn;
		}

		logger.debug('antiphonal-applied', `Antiphonal pattern applied`, {
			leftNotes: leftGroup.length,
			rightNotes: rightGroup.length,
			centerNotes: centerGroup.length,
			turns: Math.ceil(totalDuration / turnDuration)
		});

		return mappings;
	}

	/**
	 * Helper: Group mappings by instrument
	 */
	private groupByInstrument<T extends TurnTakingMapping>(mappings: T[]): Map<string, T[]> {
		const groups = new Map<string, T[]>();

		mappings.forEach(m => {
			const instrument = m.instrument || 'unknown';
			const group = groups.get(instrument) || [];
			void group.push(m);
			void groups.set(instrument, group);
		});

		return groups;
	}

	/**
	 * Helper: Group mappings by depth
	 */
	private groupByDepth<T extends TurnTakingMapping>(mappings: T[]): Map<number, T[]> {
		const groups = new Map<number, T[]>();

		mappings.forEach(m => {
			const depth = m.depth ?? 0;
			const group = groups.get(depth) || [];
			void group.push(m);
			void groups.set(depth, group);
		});

		return groups;
	}

	/**
	 * Helper: Get total duration of sequence
	 */
	private getTotalDuration<T extends TurnTakingMapping>(mappings: T[]): number {
		if (mappings.length === 0) return 0;

		const lastMapping = mappings.reduce((latest, m) =>
			(m.timing || 0) > (latest.timing || 0) ? m : latest
		);

		return (lastMapping.timing || 0) + (lastMapping.duration || 1.0);
	}

	/**
	 * Update configuration
	 */
	public updateConfig(config: Partial<TurnTakingConfig>): void {
		this.config = { ...this.config, ...config };
		logger.info('turn-taking-config-updated', 'Turn-taking config updated', {
			pattern: this.config.pattern,
			turnLength: this.config.turnLength
		});
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): TurnTakingConfig {
		return { ...this.config };
	}
}
