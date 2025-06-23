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
    
    // Calculate default date range from nodes
    const dates = nodes.map(n => n.creationDate).filter(d => d);
    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    
    this.config = {
      startDate: minDate,
      endDate: maxDate,
      duration: 30, // 30 seconds default
      speed: 1.0,
      ...config
    };
    
    this.buildTimeline();
    
    logger.debug('animator', 'TemporalGraphAnimator created', {
      nodeCount: nodes.length,
      linkCount: links.length,
      timelineEvents: this.timeline.length,
      dateRange: {
        start: this.config.startDate.toISOString(),
        end: this.config.endDate.toISOString()
      }
    });
  }

  /**
   * Build timeline events from node creation dates
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
    
    // Create appearance events for each node
    this.nodes.forEach(node => {
      if (node.creationDate) {
        const nodeTime = node.creationDate.getTime();
        if (nodeTime >= startTime && nodeTime <= endTime) {
          // Normalize to 0-1 range, then scale to animation duration
          const normalizedTime = (nodeTime - startTime) / timeRange;
          const animationTime = normalizedTime * this.config.duration;
          
          this.timeline.push({
            timestamp: animationTime,
            nodeId: node.id,
            type: 'appear'
          });
        }
      }
    });
    
    // Sort timeline by timestamp
    this.timeline.sort((a, b) => a.timestamp - b.timestamp);
    
    logger.debug('timeline', 'Timeline built', {
      events: this.timeline.length,
      firstEvent: this.timeline[0]?.timestamp || 0,
      lastEvent: this.timeline[this.timeline.length - 1]?.timestamp || 0
    });
  }

  /**
   * Start animation playback
   */
  play(): void {
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
      logger.debug('animation', `${newlyAppearedNodes.length} nodes appeared at time ${this.currentTime.toFixed(2)}s`);
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