/**
 * TemporalGraphAnimator
 * 
 * Handles temporal animation of the graph based on file creation dates.
 * Controls timeline playback, node appearance/disappearance, and synchronization with audio.
 */

import { GraphNode, GraphLink } from './GraphDataExtractor';
import { getLogger } from '../logging';
import { SonicGraphSettings } from '../utils/constants';
import { VaultState, ActivityMetrics } from '../audio/layers/types';

const logger = getLogger('TemporalGraphAnimator');

export interface TimelineEvent {
  timestamp: number;
  nodeId: string;
  type: 'appear' | 'disappear';
}

export interface AnimationConfig {
  startDate: Date;
  endDate: Date;
  duration: number; // Animation duration in seconds
  speed: number; // Playback speed multiplier (1.0 = normal)
  loop?: boolean; // Whether to loop the animation automatically
  
  // Time window filtering
  timeWindow?: 'all-time' | 'past-year' | 'past-month' | 'past-week' | 'past-day' | 'past-hour';
  
  // Timeline granularity settings
  granularity?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'custom';
  customRange?: {
    value: number;
    unit: 'years' | 'months' | 'weeks' | 'days' | 'hours';
  };
  eventSpreadingMode?: 'none' | 'gentle' | 'aggressive';
  maxEventSpacing?: number;
  simultaneousEventLimit?: number;
  eventBatchSize?: number;
  
  // Legacy intelligent spacing options (deprecated, use eventSpreadingMode)
  enableIntelligentSpacing?: boolean; // Whether to space out simultaneous events
  simultaneousThreshold?: number; // Time threshold for considering events simultaneous (seconds)
  maxSpacingWindow?: number; // Maximum time window to spread events over (seconds)
  minEventSpacing?: number; // Minimum spacing between individual events (seconds)
}

export class TemporalGraphAnimator {
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private timeline: TimelineEvent[] = [];
  private config: AnimationConfig;
  
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private currentTime: number = 0;
  private animationStartTime: number = 0;
  private animationId: number | null = null;
  
  // Additional context for comprehensive logging
  private loggingContext: {
    pluginSettings?: any;
    audioSettings?: any;
    visualSettings?: any;
  } = {};
  private visibleNodes: Set<string> = new Set();
  
  // Performance optimization: Adaptive frame rate
  private lastAnimationTime: number = 0;
  private animationFrameRate: number = 30; // Target FPS for animation
  private frameInterval: number = 1000 / 30; // 33ms for 30fps

  // Audio throttling: Skip frames to prevent polyphony overflow
  private audioFrameCounter: number = 0;
  private readonly AUDIO_FRAMES_TO_SKIP = 5; // Only trigger audio every 5th frame (~167ms spacing at 30fps)

  // Callbacks
  private onVisibilityChange?: (visibleNodeIds: Set<string>) => void;
  private onTimeUpdate?: (currentTime: number, progress: number) => void;
  private onAnimationEnd?: () => void;
  private onNodeAppear?: (node: GraphNode) => void;
  
  // Phase 3: Continuous layer integration callbacks
  private onVaultStateChange?: (vaultState: VaultState) => void;
  private onActivityChange?: (metrics: ActivityMetrics) => void;

  // Visibility change handling
  private visibilityChangeHandler?: () => void;
  private wasPlayingBeforeHidden: boolean = false;

  constructor(nodes: GraphNode[], links: GraphLink[], config?: Partial<AnimationConfig>) {
    this.nodes = nodes;
    this.links = links;

    // Setup visibility change listener to handle tab/window focus loss
    this.setupVisibilityHandling();
    
    // Set default configuration
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    
    this.config = {
      startDate: oneYearAgo,
      endDate: now,
      duration: 60, // 60 seconds default for more contemplative pacing
      speed: 1.0,
      timeWindow: 'all-time', // Default to showing all files
      granularity: 'year',
      customRange: { value: 1, unit: 'years' },
      eventSpreadingMode: 'gentle',
      maxEventSpacing: 3.0,
      simultaneousEventLimit: 8,
      eventBatchSize: 10,
      // Legacy options for backward compatibility
      enableIntelligentSpacing: true,
      simultaneousThreshold: 0.01,
      maxSpacingWindow: 10.0,
      minEventSpacing: 0.2,
      ...config
    };
    
    // Calculate date range based on granularity settings
    this.calculateDateRangeFromGranularity();
    
    this.buildTimeline();
    
    // Performance optimization: Adjust animation frame rate based on graph size
    this.setAdaptiveFrameRate(this.nodes.length, this.timeline.length);
    
    logger.debug('animator', 'TemporalGraphAnimator created', {
      nodeCount: this.nodes.length,
      linkCount: this.links.length,
      config: this.config,
      timelineEvents: this.timeline.length,
      animationFPS: this.animationFrameRate
    });
  }

  /**
   * Setup visibility change handling to keep animation running when tab loses focus
   * Uses requestAnimationFrame when visible, setTimeout when hidden
   */
  private setupVisibilityHandling(): void {
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        // Tab became hidden
        if (this.isPlaying && !this.isPaused) {
          logger.debug('visibility', 'Tab hidden while animation playing - switching to background mode');
          // Cancel the current animation frame and restart with setTimeout
          if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
          }
          // Restart animation loop with setTimeout for background operation
          this.scheduleNextFrame();
        }
      } else {
        // Tab became visible again
        if (this.isPlaying && !this.isPaused) {
          logger.debug('visibility', 'Tab visible again - switching to foreground mode');
          // Already running with setTimeout, will naturally switch to requestAnimationFrame
          // on next iteration since document.hidden will be false
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Schedule the next animation frame, using requestAnimationFrame when visible
   * or setTimeout when hidden (to keep animation running in background)
   */
  private scheduleNextFrame(): void {
    if (document.hidden) {
      // Tab is hidden, use setTimeout to continue animation in background
      this.animationId = window.setTimeout(() => this.animate(), this.frameInterval) as unknown as number;
    } else {
      // Tab is visible, use requestAnimationFrame for smooth animation
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Calculate date range based on time window filtering and actual file dates
   */
  private calculateDateRangeFromGranularity(): void {
    if (this.nodes.length === 0) {
      // No nodes, fall back to default range
      const now = new Date();
      this.config.startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      this.config.endDate = now;
      return;
    }

    const dates = this.nodes
      .map(n => n.creationDate)
      .filter(d => d !== undefined) as Date[];
    
    if (dates.length === 0) {
      // No valid dates, fall back to default range
      const now = new Date();
      this.config.startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      this.config.endDate = now;
      return;
    }

    const actualMinDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const actualMaxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Calculate date range based on time window setting
    let startDate: Date;
    let endDate: Date;
    
    const now = new Date();
    
    switch (this.config.timeWindow) {
      case 'past-hour':
        startDate = new Date(now.getTime() - (60 * 60 * 1000));
        endDate = now;
        break;
      case 'past-day':
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        endDate = now;
        break;
      case 'past-week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        endDate = now;
        break;
      case 'past-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        endDate = now;
        break;
      case 'past-year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        endDate = now;
        break;
      case 'all-time':
      default:
        // Use the full range of actual file dates
        startDate = actualMinDate;
        endDate = actualMaxDate;
        break;
    }
    
    // Ensure we don't go earlier than the earliest file or later than the latest file
    if (startDate.getTime() < actualMinDate.getTime()) {
      startDate = actualMinDate;
    }
    if (endDate.getTime() > actualMaxDate.getTime()) {
      endDate = actualMaxDate;
    }
    
    // Always update the date range based on time window and granularity settings
    // This ensures the timeline properly reflects the current configuration
    this.config.startDate = startDate;
    this.config.endDate = endDate;
    
    // Count files that will be included in the timeline
    const filesInRange = dates.filter(d => 
      d.getTime() >= this.config.startDate.getTime() && 
      d.getTime() <= this.config.endDate.getTime()
    ).length;
    
    logger.debug('time-window', 'Date range calculated from time window and file dates', {
      timeWindow: this.config.timeWindow,
      granularity: this.config.granularity,
      customRange: this.config.customRange,
      actualMinDate: actualMinDate.toISOString(),
      actualMaxDate: actualMaxDate.toISOString(),
      calculatedStartDate: startDate.toISOString(),
      calculatedEndDate: endDate.toISOString(),
      finalStartDate: this.config.startDate.toISOString(),
      finalEndDate: this.config.endDate.toISOString(),
      timeSpan: this.config.endDate.getTime() - this.config.startDate.getTime(),
      totalFiles: dates.length,
      filesInRange
    });
  }

  /**
   * Build timeline of events based on node creation dates
   */
  private buildTimeline(): void {
    this.timeline = [];
    
    const startTime = this.config.startDate.getTime();
    const endTime = this.config.endDate.getTime();
    const timeRange = endTime - startTime;
    
    if (timeRange <= 0) {
      logger.warn('timeline', 'Invalid date range for timeline');
      return;
    }
    
    // First pass: Create initial appearance events for each node
    const initialEvents: TimelineEvent[] = [];
    this.nodes.forEach(node => {
      if (node.creationDate) {
        const nodeTime = node.creationDate.getTime();
        if (nodeTime >= startTime && nodeTime <= endTime) {
          // Normalize to 0-1 range, then scale to animation duration
          const normalizedTime = (nodeTime - startTime) / timeRange;
          const animationTime = normalizedTime * this.config.duration;
          
          initialEvents.push({
            timestamp: animationTime,
            nodeId: node.id,
            type: 'appear'
          });
        }
      }
    });
    
    // Sort by timestamp to identify clusters
    initialEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    // Second pass: Apply event spreading based on mode
    this.timeline = this.applyEventSpreading(initialEvents);
    
    logger.debug('timeline', 'Timeline built with event spreading', {
      originalEvents: initialEvents.length,
      finalEvents: this.timeline.length,
      firstEvent: this.timeline[0]?.timestamp || 0,
      lastEvent: this.timeline[this.timeline.length - 1]?.timestamp || 0,
      eventSpreadingMode: this.config.eventSpreadingMode,
      granularity: this.config.granularity
    });
  }

  /**
   * Apply event spreading to prevent audio crackling from simultaneous events
   */
  private applyEventSpreading(events: TimelineEvent[]): TimelineEvent[] {
    if (events.length === 0) return events;
    
    // Handle 'none' mode - no spreading
    if (this.config.eventSpreadingMode === 'none') {
      return events;
    }
    
    // Use new spreading algorithm or fall back to legacy intelligent spacing
    if (this.config.eventSpreadingMode === 'gentle' || this.config.eventSpreadingMode === 'aggressive') {
      return this.addAdvancedEventSpreading(events);
    } else {
      // Fallback to legacy algorithm for backward compatibility
      return this.addIntelligentSpacing(events);
    }
  }

  /**
   * Advanced event spreading algorithm with batch processing
   */
  private addAdvancedEventSpreading(events: TimelineEvent[]): TimelineEvent[] {
    if (events.length === 0) return events;
    
    const mode = this.config.eventSpreadingMode!;
    const maxEventSpacing = this.config.maxEventSpacing || 5.0;
    const simultaneousEventLimit = this.config.simultaneousEventLimit || 3;
    const eventBatchSize = this.config.eventBatchSize || 5;
    
    // Configure parameters based on mode
    const modeConfig = mode === 'gentle' ? {
      simultaneousThreshold: 0.1, // 100ms threshold
      maxSpacingWindow: Math.min(maxEventSpacing, 2.0), // Gentler spreading
      minEventSpacing: 0.05, // 50ms minimum spacing (reduced for more notes)
      batchProcessing: true
    } : {
      simultaneousThreshold: 0.05, // 50ms threshold (more aggressive)
      maxSpacingWindow: maxEventSpacing, // Use full spacing window
      minEventSpacing: 0.03, // 30ms minimum spacing (reduced for more notes)
      batchProcessing: true
    };
    
    const spacedEvents: TimelineEvent[] = [];
    let i = 0;
    
    while (i < events.length) {
      const currentTime = events[i].timestamp;
      const simultaneousEvents: TimelineEvent[] = [];
      
      // Collect simultaneous events within threshold
      while (i < events.length && Math.abs(events[i].timestamp - currentTime) <= modeConfig.simultaneousThreshold) {
        simultaneousEvents.push(events[i]);
        i++;
      }
      
      if (simultaneousEvents.length === 1) {
        // Single event, no spreading needed
        spacedEvents.push(simultaneousEvents[0]);
      } else if (simultaneousEvents.length <= simultaneousEventLimit) {
        // Small cluster - spread all events
        spacedEvents.push(...this.spreadEventCluster(simultaneousEvents, currentTime, modeConfig));
      } else {
        // Large cluster - use batch processing
        spacedEvents.push(...this.processBatchedEvents(simultaneousEvents, currentTime, modeConfig, eventBatchSize));
      }
    }
    
    // Final sort and minimum spacing enforcement
    spacedEvents.sort((a, b) => a.timestamp - b.timestamp);
    return this.enforceMinimumSpacing(spacedEvents, modeConfig.minEventSpacing);
  }

  /**
   * Spread a cluster of simultaneous events
   */
  private spreadEventCluster(events: TimelineEvent[], baseTime: number, config: any): TimelineEvent[] {
    const spacingWindow = Math.min(config.maxSpacingWindow, events.length * config.minEventSpacing * 1.5);
    const spacing = events.length > 1 ? spacingWindow / (events.length - 1) : 0;
    
    // Sort by node ID for consistent ordering
    events.sort((a, b) => this.hashString(a.nodeId) - this.hashString(b.nodeId));
    
    return events.map((event, index) => ({
      ...event,
      timestamp: baseTime + (spacing * index)
    }));
  }

  /**
   * Process large clusters using batch approach
   */
  private processBatchedEvents(events: TimelineEvent[], baseTime: number, config: any, batchSize: number): TimelineEvent[] {
    const result: TimelineEvent[] = [];
    const batches = this.createEventBatches(events, batchSize);
    
    batches.forEach((batch, batchIndex) => {
      const batchBaseTime = baseTime + (batchIndex * config.maxSpacingWindow * 0.2); // 20% of max spacing between batches
      result.push(...this.spreadEventCluster(batch, batchBaseTime, {
        ...config,
        maxSpacingWindow: config.maxSpacingWindow * 0.15 // Tighter spacing within batches
      }));
    });
    
    return result;
  }

  /**
   * Create event batches for large simultaneous event clusters
   */
  private createEventBatches(events: TimelineEvent[], batchSize: number): TimelineEvent[][] {
    const batches: TimelineEvent[][] = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Enforce minimum spacing between consecutive events
   */
  private enforceMinimumSpacing(events: TimelineEvent[], minSpacing: number): TimelineEvent[] {
    const result: TimelineEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      if (result.length === 0) {
        result.push(event);
      } else {
        const lastEvent = result[result.length - 1];
        const timeDiff = event.timestamp - lastEvent.timestamp;
        
        if (timeDiff < minSpacing) {
          const adjustedEvent = { ...event };
          adjustedEvent.timestamp = lastEvent.timestamp + minSpacing;
          result.push(adjustedEvent);
        } else {
          result.push(event);
        }
      }
    }
    
    return result;
  }

  /**
   * Legacy intelligent spacing algorithm for backward compatibility
   */
  private addIntelligentSpacing(events: TimelineEvent[]): TimelineEvent[] {
    if (events.length === 0) return events;
    
    // Check if intelligent spacing is enabled
    if (!this.config.enableIntelligentSpacing) {
      return events;
    }
    
    const spacedEvents: TimelineEvent[] = [];
    const simultaneousThreshold = this.config.simultaneousThreshold || 0.1;
    const maxSpacingWindow = this.config.maxSpacingWindow || 2.0;
    const minSpacing = this.config.minEventSpacing || 0.05;
    
    let i = 0;
    while (i < events.length) {
      const currentTime = events[i].timestamp;
      const simultaneousEvents: TimelineEvent[] = [];
      
      // Collect all events that are simultaneous (within threshold)
      while (i < events.length && Math.abs(events[i].timestamp - currentTime) <= simultaneousThreshold) {
        simultaneousEvents.push(events[i]);
        i++;
      }
      
      if (simultaneousEvents.length === 1) {
        // Single event, no spacing needed
        spacedEvents.push(simultaneousEvents[0]);
      } else {
        // Multiple simultaneous events - spread them out
        const spacingWindow = Math.min(maxSpacingWindow, simultaneousEvents.length * minSpacing * 2);
        const spacing = spacingWindow / (simultaneousEvents.length - 1);
        
        // Sort simultaneous events by a consistent factor for reproducible spacing
        simultaneousEvents.sort((a, b) => {
          // Use node ID hash for consistent ordering
          const hashA = this.hashString(a.nodeId);
          const hashB = this.hashString(b.nodeId);
          return hashA - hashB;
        });
        
        simultaneousEvents.forEach((event, index) => {
          const spacedEvent = { ...event };
          if (index === 0) {
            // First event keeps original time
            spacedEvent.timestamp = currentTime;
          } else {
            // Subsequent events are spaced out
            spacedEvent.timestamp = currentTime + (spacing * index);
          }
          spacedEvents.push(spacedEvent);
        });
        
        logger.debug('timeline', 'Applied spacing to simultaneous events', {
          originalTime: currentTime.toFixed(3),
          eventCount: simultaneousEvents.length,
          spacingWindow: spacingWindow.toFixed(3),
          individualSpacing: spacing.toFixed(3),
          threshold: simultaneousThreshold
        });
      }
    }
    
    // Final sort to ensure timeline is in chronological order
    spacedEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    // Final pass: Ensure minimum spacing between ALL consecutive events
    const finalEvents: TimelineEvent[] = [];
    for (let i = 0; i < spacedEvents.length; i++) {
      const event = spacedEvents[i];
      
      if (finalEvents.length === 0) {
        // First event, no adjustment needed
        finalEvents.push(event);
      } else {
        const lastEvent = finalEvents[finalEvents.length - 1];
        const timeDiff = event.timestamp - lastEvent.timestamp;
        
        if (timeDiff < minSpacing) {
          // Adjust this event to maintain minimum spacing
          const adjustedEvent = { ...event };
          adjustedEvent.timestamp = lastEvent.timestamp + minSpacing;
          finalEvents.push(adjustedEvent);
          
          logger.debug('timeline', 'Applied minimum spacing adjustment', {
            originalTime: event.timestamp.toFixed(3),
            adjustedTime: adjustedEvent.timestamp.toFixed(3),
            minSpacing: minSpacing
          });
        } else {
          // Sufficient spacing, no adjustment needed
          finalEvents.push(event);
        }
      }
    }
    
    return finalEvents;
  }

  /**
   * Simple hash function for consistent node ordering
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

  /**
   * Start animation playback
   */
  play(): void {
    if (this.isPlaying && !this.isPaused) {
      logger.debug('playback', 'Animation already playing');
      return;
    }
    
    // Calculate time span for context
    const timeSpanMs = this.config.endDate.getTime() - this.config.startDate.getTime();
    const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
    const timeSpanYears = timeSpanDays / 365;
    const timeSpanFormatted = timeSpanYears >= 1 
      ? `${timeSpanYears.toFixed(1)} years`
      : `${Math.round(timeSpanDays)} days`;
    
    // Count nodes that will actually appear in the animation
    const nodesInTimeRange = this.nodes.filter(node => {
      const nodeTime = node.creationDate.getTime();
      return nodeTime >= this.config.startDate.getTime() && 
             nodeTime <= this.config.endDate.getTime();
    }).length;
    
    // Log comprehensive timelapse start information
    logger.info('timelapse-start', 'Temporal animation started', {
      // Core timing
      duration: this.config.duration,
      
      // Timeline configuration
      timeline: {
        window: this.config.timeWindow || 'all-time',
        granularity: this.config.granularity || 'year',
        spreading: this.config.eventSpreadingMode || 'none',
        customRange: this.config.customRange
      },
      
      // Audio settings (from logging context if available)
      audio: {
        density: this.loggingContext.audioSettings?.density || 'unknown',
        activeInstruments: this.loggingContext.audioSettings?.activeInstruments || 'unknown',
        masterVolume: this.loggingContext.audioSettings?.masterVolume || 'unknown',
        simultaneousLimit: this.config.simultaneousEventLimit || 3,
        effectsEnabled: this.loggingContext.audioSettings?.effectsEnabled || 'unknown'
      },
      
      // Performance settings
      performance: {
        adaptiveDetail: this.loggingContext.visualSettings?.adaptiveDetail?.enabled || false,
        maxNodes: this.loggingContext.visualSettings?.adaptiveDetail?.overrides?.maximumVisibleNodes || -1,
        temporalClustering: this.loggingContext.visualSettings?.temporalClustering || false
      },
      
      // Context information
      context: {
        totalNotes: this.nodes.length,
        filteredNotes: nodesInTimeRange,
        timeSpan: timeSpanFormatted,
        dateRange: {
          start: this.config.startDate.toISOString(),
          end: this.config.endDate.toISOString()
        },
        eventCount: this.timeline.length
      }
    });
    
    this.isPlaying = true;
    this.isPaused = false;
    this.animationStartTime = performance.now() - (this.currentTime * 1000 / this.config.speed);
    
    this.animate();
  }

  /**
   * Pause animation playback
   */
  pause(): void {
    if (!this.isPlaying || this.isPaused) {
      logger.debug('playback', 'Animation not playing or already paused');
      return;
    }

    this.isPaused = true;

    if (this.animationId) {
      // Cancel both requestAnimationFrame and setTimeout
      cancelAnimationFrame(this.animationId);
      clearTimeout(this.animationId);
      this.animationId = null;
    }

    logger.info('playback', 'Animation paused', { currentTime: this.currentTime });
  }

  /**
   * Stop animation and reset to beginning
   */
  stop(): void {
    const wasPlaying = this.isPlaying;
    const currentProgress = this.currentTime / this.config.duration;

    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;

    if (this.animationId) {
      // Cancel both requestAnimationFrame and setTimeout
      cancelAnimationFrame(this.animationId);
      clearTimeout(this.animationId);
      this.animationId = null;
    }
    
    // Log completion if animation was actually playing
    if (wasPlaying && currentProgress > 0 && currentProgress < 1) {
      logger.info('timelapse-complete', 'Animation stopped', {
        duration: `${this.config.duration}s`,
        nodesAnimated: this.visibleNodes.size,
        audioEventsPlayed: this.visibleNodes.size, // Approximation
        completionType: 'interrupted',
        stoppedAt: `${Math.round(currentProgress * 100)}%`
      });
    }
    
    // Reset to initial state (no nodes visible)
    this.updateVisibility();
  }

  /**
   * Seek to specific time in animation
   */
  seekTo(time: number): void {
    const previousTime = this.currentTime;
    this.currentTime = Math.max(0, Math.min(time, this.config.duration));
    this.updateVisibility();
    
    if (this.isPlaying && !this.isPaused) {
      // Restart animation from new position
      this.animationStartTime = performance.now() - (this.currentTime * 1000 / this.config.speed);
    }
    
    // Log user interaction for timelapse analytics
    logger.info('timelapse-interaction', 'Timeline scrubbed', {
      from: `${Math.round((previousTime / this.config.duration) * 100)}%`,
      to: `${Math.round((this.currentTime / this.config.duration) * 100)}%`,
      direction: time > previousTime ? 'forward' : 'backward'
    });
  }

  /**
   * Set animation speed
   */
  setSpeed(speed: number): void {
    const wasPlaying = this.isPlaying && !this.isPaused;
    const previousSpeed = this.config.speed;
    
    if (wasPlaying) {
      // Update animation start time to maintain current position
      this.animationStartTime = performance.now() - (this.currentTime * 1000 / speed);
    }
    
    this.config.speed = speed;
    
    // Log user interaction for timelapse analytics
    logger.info('timelapse-interaction', 'Speed changed', {
      from: `${previousSpeed}x`,
      to: `${speed}x`,
      currentProgress: `${Math.round((this.currentTime / this.config.duration) * 100)}%`
    });
  }

  /**
   * Enable or disable animation looping
   */
  setLoop(loop: boolean): void {
    this.config.loop = loop;
    logger.debug('playback', 'Loop setting changed', { loop });
  }

  /**
   * Set adaptive frame rate based on graph complexity
   */
  private setAdaptiveFrameRate(nodeCount: number, timelineEvents: number): void {
    const complexity = nodeCount + (timelineEvents * 0.5);
    
    if (complexity <= 100) {
      this.animationFrameRate = 60; // High quality for small graphs
    } else if (complexity <= 500) {
      this.animationFrameRate = 30; // Balanced for medium graphs
    } else {
      this.animationFrameRate = 20; // Performance mode for large graphs
    }
    
    this.frameInterval = 1000 / this.animationFrameRate;
    
    logger.debug('animation-performance', 'Adaptive frame rate set', {
      nodeCount,
      timelineEvents,
      complexity: complexity.toFixed(1),
      targetFPS: this.animationFrameRate,
      frameInterval: this.frameInterval.toFixed(1)
    });
  }

  /**
   * Main animation loop with frame rate control
   */
  private animate(): void {
    if (!this.isPlaying || this.isPaused) {
      return;
    }
    
    const now = performance.now();
    
    // Performance optimization: Frame rate limiting
    if (now - this.lastAnimationTime < this.frameInterval) {
      this.scheduleNextFrame();
      return;
    }
    this.lastAnimationTime = now;
    
    this.currentTime = ((now - this.animationStartTime) * this.config.speed) / 1000;
    
    // Check if animation is complete
    if (this.currentTime >= this.config.duration) {
      this.currentTime = this.config.duration;
      this.updateVisibility();
      
      // Check if looping is enabled
      if (this.config.loop) {
        // Reset for loop
        logger.debug('playback', 'Animation completed, looping...');
        this.currentTime = 0;
        this.animationStartTime = performance.now();
        this.visibleNodes.clear();
        
        // Trigger visibility change to reset the graph
        this.onVisibilityChange?.(this.visibleNodes);

        // Continue the loop
        this.scheduleNextFrame();
        return;
      } else {
        // Animation complete, no loop
        this.isPlaying = false;
        
        // Log animation completion summary
        logger.info('timelapse-complete', 'Animation finished', {
          duration: `${this.config.duration}s`,
          nodesAnimated: this.visibleNodes.size,
          audioEventsPlayed: this.visibleNodes.size, // Actual nodes that played audio
          completionType: 'natural'
        });
        
        this.onAnimationEnd?.();
        return;
      }
    }
    
    this.updateVisibility();

    // Continue animation
    this.scheduleNextFrame();
  }

  /**
   * Update node visibility based on current time
   */
  private updateVisibility(): void {
    const visibleNodeIds = new Set<string>();
    const newlyAppearedNodes: GraphNode[] = [];
    
    // Find all nodes that should be visible at current time
    this.timeline.forEach(event => {
      if (event.timestamp <= this.currentTime && event.type === 'appear') {
        const wasVisible = this.visibleNodes.has(event.nodeId);
        visibleNodeIds.add(event.nodeId);
        
        // If node just became visible, trigger appearance callback
        if (!wasVisible) {
          const node = this.nodes.find(n => n.id === event.nodeId);
          if (node) {
            newlyAppearedNodes.push(node);
          }
        }
      }
    });
    
    // Store current visible nodes for next comparison
    this.visibleNodes = visibleNodeIds;
    
    // Update visibility
    this.onVisibilityChange?.(visibleNodeIds);
    
    // Trigger appearance callbacks for newly visible nodes
    if (newlyAppearedNodes.length > 0) {
      logger.info('temporal-animation', 'Nodes appeared in temporal animation', {
        count: newlyAppearedNodes.length,
        currentTime: this.currentTime.toFixed(2),
        duration: this.config.duration,
        nodeIds: newlyAppearedNodes.map(n => n.id),
        nodeTitles: newlyAppearedNodes.map(n => n.title),
        nodeTypes: newlyAppearedNodes.map(n => n.type),
        hasCallback: !!this.onNodeAppear,
        callbackFunction: this.onNodeAppear ? 'registered' : 'missing'
      });

      // CRITICAL: Frame skipping to prevent polyphony overflow
      // Only trigger audio every Nth frame to allow notes to release
      this.audioFrameCounter++;

      if (this.audioFrameCounter >= this.AUDIO_FRAMES_TO_SKIP) {
        this.audioFrameCounter = 0; // Reset counter

        // Limit nodes per audio-enabled frame
        const limit = this.config.simultaneousEventLimit || 1;
        const nodesToTrigger = newlyAppearedNodes.slice(0, limit);

        nodesToTrigger.forEach(node => {
          this.onNodeAppear?.(node);
        });

        if (newlyAppearedNodes.length > limit) {
          logger.debug('throttling', `Throttled ${newlyAppearedNodes.length - limit} nodes this frame`);
        }
      } else {
        logger.debug('frame-skip', `Skipped audio for ${newlyAppearedNodes.length} nodes (frame ${this.audioFrameCounter}/${this.AUDIO_FRAMES_TO_SKIP})`);
      }
    }
    
    // Update time progress
    const progress = this.config.duration > 0 ? this.currentTime / this.config.duration : 0;
    this.onTimeUpdate?.(this.currentTime, progress);
    
    // Phase 3: Update continuous layers with vault state and activity metrics
    if (this.onVaultStateChange) {
      const vaultState = this.generateVaultState();
      this.onVaultStateChange(vaultState);
    }
    
    if (this.onActivityChange) {
      const activityMetrics = this.generateActivityMetrics();
      this.onActivityChange(activityMetrics);
    }
  }

  /**
   * Set callback for visibility changes
   */
  onVisibilityChanged(callback: (visibleNodeIds: Set<string>) => void): void {
    this.onVisibilityChange = callback;
  }

  /**
   * Set callback for time updates
   */
  onTimeChanged(callback: (currentTime: number, progress: number) => void): void {
    this.onTimeUpdate = callback;
  }

  /**
   * Set callback for animation end
   */
  onAnimationEnded(callback: () => void): void {
    this.onAnimationEnd = callback;
  }

  /**
   * Set callback for node appearance (for audio sync)
   */
  onNodeAppeared(callback: (node: GraphNode) => void): void {
    this.onNodeAppear = callback;
  }

  /**
   * Get current animation state
   */
  getState(): {
    isPlaying: boolean;
    isPaused: boolean;
    currentTime: number;
    progress: number;
    duration: number;
    speed: number;
  } {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentTime: this.currentTime,
      progress: this.config.duration > 0 ? this.currentTime / this.config.duration : 0,
      duration: this.config.duration,
      speed: this.config.speed
    };
  }

  /**
   * Get timeline information
   */
  getTimelineInfo(): {
    startDate: Date;
    endDate: Date;
    eventCount: number;
    duration: number;
  } {
    return {
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      eventCount: this.timeline.length,
      duration: this.config.duration
    };
  }

  /**
   * Set additional context for comprehensive logging
   */
  setLoggingContext(context: {
    pluginSettings?: any;
    audioSettings?: any;
    visualSettings?: any;
  }): void {
    this.loggingContext = { ...this.loggingContext, ...context };
    logger.debug('context', 'Logging context updated', { 
      hasPluginSettings: !!context.pluginSettings,
      hasAudioSettings: !!context.audioSettings,
      hasVisualSettings: !!context.visualSettings
    });
  }

  /**
   * Update configuration and rebuild timeline if necessary
   */
  updateConfig(newConfig: Partial<AnimationConfig>): void {
    const wasPlaying = this.isPlaying && !this.isPaused;
    
    if (wasPlaying) {
      this.pause();
    }
    
    // Check if granularity or time window settings changed
    const granularityChanged = 
      newConfig.timeWindow !== this.config.timeWindow ||
      newConfig.granularity !== this.config.granularity ||
      (newConfig.customRange && (
        newConfig.customRange.value !== this.config.customRange?.value ||
        newConfig.customRange.unit !== this.config.customRange?.unit
      )) ||
      newConfig.eventSpreadingMode !== this.config.eventSpreadingMode ||
      newConfig.maxEventSpacing !== this.config.maxEventSpacing ||
      newConfig.simultaneousEventLimit !== this.config.simultaneousEventLimit ||
      newConfig.eventBatchSize !== this.config.eventBatchSize;
    
    this.config = { ...this.config, ...newConfig };
    
    // Recalculate date range if granularity or time window changed
    if (granularityChanged && (newConfig.timeWindow || newConfig.granularity || newConfig.customRange)) {
      this.calculateDateRangeFromGranularity();
    }
    
    this.buildTimeline();
    
    if (wasPlaying) {
      this.play();
    }
    
    logger.debug('config', 'Animation config updated', {
      ...this.config,
      granularityChanged,
      timelineEvents: this.timeline.length
    });
  }

  /**
   * Update timeline granularity settings from SonicGraphSettings
   */
  updateTimelineSettings(settings: SonicGraphSettings['timeline']): void {
    this.updateConfig({
      timeWindow: settings.timeWindow,  // Add missing timeWindow parameter
      granularity: settings.granularity,
      customRange: settings.customRange,
      eventSpreadingMode: settings.eventSpreadingMode,
      maxEventSpacing: settings.maxEventSpacing,
      simultaneousEventLimit: settings.simultaneousEventLimit,
      eventBatchSize: settings.eventBatchSize,
      duration: settings.duration,
      loop: settings.loop
    });
    
    logger.info('timeline-settings', 'Timeline settings updated from SonicGraphSettings', {
      timeWindow: settings.timeWindow,
      granularity: settings.granularity,
      customRange: settings.customRange,
      eventSpreadingMode: settings.eventSpreadingMode,
      newTimelineEvents: this.timeline.length
    });
  }

  /**
   * Phase 3: Set vault state change callback for continuous layers
   */
  setVaultStateCallback(callback: (vaultState: VaultState) => void): void {
    this.onVaultStateChange = callback;
    logger.debug('callback', 'Vault state callback registered');
  }

  /**
   * Phase 3: Set activity change callback for continuous layers
   */
  setActivityCallback(callback: (metrics: ActivityMetrics) => void): void {
    this.onActivityChange = callback;
    logger.debug('callback', 'Activity callback registered');
  }

  /**
   * Phase 3: Generate vault state for continuous layers
   */
  private generateVaultState(): VaultState {
    return {
      totalNodes: this.nodes.length,
      maxNodes: Math.max(this.nodes.length, 1000), // Reasonable maximum
      currentAnimationProgress: this.currentTime / (this.config.endDate.getTime() - this.config.startDate.getTime()),
      vaultActivityLevel: this.calculateActivityLevel(),
      visibleNodes: this.visibleNodes,
      clusters: [] // Would be populated by cluster analysis
    };
  }

  /**
   * Phase 3: Calculate current activity level
   */
  private calculateActivityLevel(): number {
    // Count events in the last 5 seconds of animation time
    const lookbackTime = 5000; // 5 seconds in ms
    const recentEvents = this.timeline.filter(event => 
      event.timestamp >= this.currentTime - lookbackTime && 
      event.timestamp <= this.currentTime
    );
    
    return recentEvents.length;
  }

  /**
   * Phase 3: Generate activity metrics
   */
  private generateActivityMetrics(): ActivityMetrics {
    const recentEvents = this.timeline.filter(event => 
      event.timestamp >= this.currentTime - 5000 && 
      event.timestamp <= this.currentTime
    );
    
    const eventRate = recentEvents.length / 5; // Events per second
    const intensitySpikes = recentEvents.length > 5;
    
    // Calculate average spacing between events
    let averageSpacing = 0;
    if (recentEvents.length > 1) {
      const spacings = recentEvents.slice(1).map((event, i) => 
        event.timestamp - recentEvents[i].timestamp
      );
      averageSpacing = spacings.reduce((sum, spacing) => sum + spacing, 0) / spacings.length;
    }
    
    return {
      recentEventCount: recentEvents.length,
      eventRate,
      intensitySpikes,
      averageEventSpacing: averageSpacing / 1000 // Convert to seconds
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();

    // Remove visibility change listener
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = undefined;
    }

    // Clear all data arrays to release memory
    this.timeline = [];
    this.nodes = [];
    this.links = [];
    this.visibleNodes.clear();

    // Clear callbacks
    this.onVisibilityChange = undefined;
    this.onTimeUpdate = undefined;
    this.onAnimationEnd = undefined;
    this.onNodeAppear = undefined;
    this.onVaultStateChange = undefined;
    this.onActivityChange = undefined;

    logger.debug('cleanup', 'TemporalGraphAnimator destroyed and memory released');
  }
} 