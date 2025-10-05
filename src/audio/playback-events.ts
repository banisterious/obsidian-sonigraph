/**
 * Playback Event System for Audio Engine
 * Provides event-driven communication between audio engine and UI components
 */

import { getLogger } from '../logging';

const logger = getLogger('playback-events');

/**
 * Playback event types
 */
export type PlaybackEventType =
	| 'playback-started'
	| 'playback-ended'
	| 'playback-paused'
	| 'playback-resumed'
	| 'playback-stopped'
	| 'playback-error'
	| 'sequence-progress'
	| 'note-triggered';

/**
 * Event data interfaces
 */
export interface PlaybackProgressData {
	currentIndex: number;
	totalNotes: number;
	elapsedTime: number;
	estimatedTotalTime: number;
	percentComplete: number;
}

export interface PlaybackErrorData {
	error: Error;
	context: string;
}

export interface NoteTriggeredData {
	pitch: number;
	velocity: number;
	duration: number;
	layer: 'rhythmic' | 'harmonic' | 'melodic' | 'ambient' | 'percussion';
	timestamp: number;
	instrument: string;
}

/**
 * Event data union type
 */
export type PlaybackEventData = PlaybackProgressData | PlaybackErrorData | NoteTriggeredData | null;

/**
 * Event listener function type
 */
export type PlaybackEventListener<T = PlaybackEventData> = (data: T) => void;

/**
 * Simple event emitter for playback events
 * Lightweight alternative to Node.js EventEmitter for browser compatibility
 */
export class PlaybackEventEmitter {
	private listeners: Map<PlaybackEventType, PlaybackEventListener[]> = new Map();

	/**
	 * Add event listener
	 */
	on<T = PlaybackEventData>(event: PlaybackEventType, listener: PlaybackEventListener<T>): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push(listener as unknown as PlaybackEventListener);
		
		logger.debug('events', `Added listener for ${event}`, { 
			listenerCount: this.listeners.get(event)!.length 
		});
	}

	/**
	 * Remove event listener
	 */
	off<T = PlaybackEventData>(event: PlaybackEventType, listener: PlaybackEventListener<T>): void {
		const eventListeners = this.listeners.get(event);
		if (!eventListeners) return;

		const index = eventListeners.indexOf(listener as unknown as PlaybackEventListener);
		if (index > -1) {
			eventListeners.splice(index, 1);
			logger.debug('events', `Removed listener for ${event}`, { 
				listenerCount: eventListeners.length 
			});
		}
	}

	/**
	 * Remove all listeners for an event
	 */
	removeAllListeners(event?: PlaybackEventType): void {
		if (event) {
			this.listeners.delete(event);
			logger.debug('events', `Removed all listeners for ${event}`);
		} else {
			this.listeners.clear();
			logger.debug('events', 'Removed all event listeners');
		}
	}

	/**
	 * Emit event to all listeners
	 */
	emit<T = PlaybackEventData>(event: PlaybackEventType, data?: T): void {
		const eventListeners = this.listeners.get(event);
		if (!eventListeners || eventListeners.length === 0) {
			logger.debug('events', `No listeners for ${event}`);
			return;
		}

		logger.debug('events', `Emitting ${event}`, { 
			listenerCount: eventListeners.length,
			data: data ? 'present' : 'none'
		});

		// Call listeners with error handling
		eventListeners.forEach(listener => {
			try {
				listener(data as unknown as PlaybackEventData);
			} catch (error) {
				logger.error('events', `Error in ${event} listener`, error);
			}
		});
	}

	/**
	 * Get listener count for event
	 */
	listenerCount(event: PlaybackEventType): number {
		return this.listeners.get(event)?.length ?? 0;
	}

	/**
	 * Get all registered event types
	 */
	getEventTypes(): PlaybackEventType[] {
		return Array.from(this.listeners.keys());
	}

	/**
	 * Cleanup all listeners
	 */
	dispose(): void {
		this.listeners.clear();
		logger.debug('events', 'PlaybackEventEmitter disposed');
	}
}