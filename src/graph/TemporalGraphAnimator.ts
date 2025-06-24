/**
 * TemporalGraphAnimator
 * 
 * Handles temporal animation of the graph based on file creation dates.
 * Controls timeline playback, node appearance/disappearance, and synchronization with audio.
 */

import { GraphNode, GraphLink } from './GraphDataExtractor';
import { getLogger } from '../logging';

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
  
  // Intelligent spacing options
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
  private visibleNodes: Set<string> = new Set();
  
  // Callbacks
  private onVisibilityChange?: (visibleNodeIds: Set<string>) => void;
  private onTimeUpdate?: (currentTime: number, progress: number) => void;
  private onAnimationEnd?: () => void;
  private onNodeAppear?: (node: GraphNode) => void;

  constructor(nodes: GraphNode[], links: GraphLink[], config?: Partial<AnimationConfig>) {
    this.nodes = nodes;
    this.links = links;
    
    // Set default configuration
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    
    this.config = {
      startDate: oneYearAgo,
      endDate: now,
      duration: 60, // 60 seconds default for more contemplative pacing
      speed: 1.0,
      enableIntelligentSpacing: true, // Enable spacing by default
      simultaneousThreshold: 0.01, // 10ms threshold for truly simultaneous events
      maxSpacingWindow: 10.0, // Spread over max 10 seconds for large clusters
      minEventSpacing: 0.2, // Minimum 200ms between events for clear separation
      ...config
    };
    
    // Calculate actual date range from nodes if not provided
    if (this.nodes.length > 0) {
      const dates = this.nodes
        .map(n => n.creationDate)
        .filter(d => d !== undefined) as Date[];
      
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        if (!config?.startDate) this.config.startDate = minDate;
        if (!config?.endDate) this.config.endDate = maxDate;
      }
    }
    
    this.buildTimeline();
    
    logger.debug('animator', 'TemporalGraphAnimator created', {
      nodeCount: this.nodes.length,
      linkCount: this.links.length,
      config: this.config,
      timelineEvents: this.timeline.length
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
    
    // Second pass: Add intelligent spacing for simultaneous events
    this.timeline = this.addIntelligentSpacing(initialEvents);
    
    logger.debug('timeline', 'Timeline built with intelligent spacing', {
      originalEvents: initialEvents.length,
      finalEvents: this.timeline.length,
      firstEvent: this.timeline[0]?.timestamp || 0,
      lastEvent: this.timeline[this.timeline.length - 1]?.timestamp || 0
    });
  }

  /**
   * Add intelligent spacing to events that would appear simultaneously
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
    logger.info('playback', 'Temporal animator play called', { 
      timelineEvents: this.timeline.length,
      duration: this.config.duration,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused
    });
    
    // Debug: Log sample of timeline events to understand the issue
    if (this.timeline.length > 0) {
      const sampleEvents = this.timeline.slice(0, 10);
      logger.info('playback', 'Sample timeline events (first 10)', {
        events: sampleEvents.map(e => ({
          timestamp: e.timestamp.toFixed(3),
          nodeId: e.nodeId,
          type: e.type
        })),
        totalEvents: this.timeline.length,
        dateRange: {
          start: this.config.startDate.toISOString(),
          end: this.config.endDate.toISOString()
        }
      });
    }
    
    if (this.isPlaying && !this.isPaused) {
      logger.debug('playback', 'Animation already playing');
      return;
    }
    
    this.isPlaying = true;
    this.isPaused = false;
    this.animationStartTime = performance.now() - (this.currentTime * 1000 / this.config.speed);
    
    logger.info('playback', 'Starting temporal animation', {
      currentTime: this.currentTime,
      speed: this.config.speed,
      duration: this.config.duration
    });
    
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
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    logger.info('playback', 'Animation paused', { currentTime: this.currentTime });
  }

  /**
   * Stop animation and reset to beginning
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    logger.info('playback', 'Animation stopped and reset');
    
    // Reset to initial state (no nodes visible)
    this.updateVisibility();
  }

  /**
   * Seek to specific time in animation
   */
  seekTo(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.config.duration));
    this.updateVisibility();
    
    if (this.isPlaying && !this.isPaused) {
      // Restart animation from new position
      this.animationStartTime = performance.now() - (this.currentTime * 1000 / this.config.speed);
    }
    
    logger.debug('playback', 'Seeked to time', { time: this.currentTime });
  }

  /**
   * Set animation speed
   */
  setSpeed(speed: number): void {
    const wasPlaying = this.isPlaying && !this.isPaused;
    
    if (wasPlaying) {
      // Update animation start time to maintain current position
      this.animationStartTime = performance.now() - (this.currentTime * 1000 / speed);
    }
    
    this.config.speed = speed;
    logger.debug('playback', 'Speed changed', { speed });
  }

  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isPlaying || this.isPaused) {
      return;
    }
    
    const now = performance.now();
    this.currentTime = ((now - this.animationStartTime) * this.config.speed) / 1000;
    
    // Check if animation is complete
    if (this.currentTime >= this.config.duration) {
      this.currentTime = this.config.duration;
      this.updateVisibility();
      
      // Animation complete
      this.isPlaying = false;
      this.onAnimationEnd?.();
      
      logger.info('playback', 'Animation completed');
      return;
    }
    
    this.updateVisibility();
    
    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
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
      logger.info('animation', 'Nodes appeared in temporal animation', {
        count: newlyAppearedNodes.length,
        time: this.currentTime.toFixed(2),
        nodeIds: newlyAppearedNodes.map(n => n.id),
        nodeTitles: newlyAppearedNodes.map(n => n.title),
        hasCallback: !!this.onNodeAppear
      });
      newlyAppearedNodes.forEach(node => {
        this.onNodeAppear?.(node);
      });
    }
    
    // Update time progress
    const progress = this.config.duration > 0 ? this.currentTime / this.config.duration : 0;
    this.onTimeUpdate?.(this.currentTime, progress);
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
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnimationConfig>): void {
    const wasPlaying = this.isPlaying && !this.isPaused;
    
    if (wasPlaying) {
      this.pause();
    }
    
    this.config = { ...this.config, ...newConfig };
    this.buildTimeline();
    
    if (wasPlaying) {
      this.play();
    }
    
    logger.debug('config', 'Animation config updated', this.config);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    
    this.onVisibilityChange = undefined;
    this.onTimeUpdate = undefined;
    this.onAnimationEnd = undefined;
    this.onNodeAppear = undefined;
    
    logger.debug('cleanup', 'TemporalGraphAnimator destroyed');
  }
} 