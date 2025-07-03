import { GraphNode, GraphLink } from './GraphDataExtractor';
import { SonicGraphSettings } from '../utils/constants';
import { getLogger } from '../logging';

const logger = getLogger('AdaptiveDetailManager');

export type DetailLevel = 'overview' | 'standard' | 'detail' | 'ultra-detail';

export interface FilteredGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  level: DetailLevel;
  stats: {
    totalNodes: number;
    visibleNodes: number;
    totalLinks: number;
    visibleLinks: number;
    filterReason: string;
  };
}

export interface AdaptiveDetailState {
  currentLevel: DetailLevel;
  enabled: boolean;
  sessionOverride: boolean; // Temporary override from modal
}

/**
 * AdaptiveDetailManager - Smart zoom-based graph filtering
 * 
 * Automatically adjusts visible nodes and links based on zoom level to:
 * - Improve performance for large graphs
 * - Reduce visual clutter at different zoom levels
 * - Provide progressive disclosure of information
 */
export class AdaptiveDetailManager {
  private settings: SonicGraphSettings['adaptiveDetail'];
  private currentState: AdaptiveDetailState;
  private allNodes: GraphNode[] = [];
  private allLinks: GraphLink[] = [];

  constructor(settings: SonicGraphSettings['adaptiveDetail']) {
    this.settings = settings;
    this.currentState = {
      currentLevel: 'standard',
      enabled: settings.enabled,
      sessionOverride: false
    };
    
    logger.debug('adaptive-detail', 'AdaptiveDetailManager initialized', {
      enabled: settings.enabled,
      mode: settings.mode,
      thresholds: settings.thresholds
    });
  }

  /**
   * Update settings (from plugin settings or modal changes)
   */
  updateSettings(newSettings: SonicGraphSettings['adaptiveDetail']): void {
    this.settings = newSettings;
    this.currentState.enabled = newSettings.enabled && !this.currentState.sessionOverride;
    
    logger.debug('adaptive-detail', 'Settings updated', {
      enabled: this.currentState.enabled,
      mode: this.settings.mode,
      sessionOverride: this.currentState.sessionOverride
    });
  }

  /**
   * Set session override (from modal toggle)
   */
  setSessionOverride(override: boolean): void {
    this.currentState.sessionOverride = override;
    this.currentState.enabled = this.settings.enabled && !override;
    
    logger.debug('adaptive-detail', 'Session override set', {
      override,
      enabled: this.currentState.enabled
    });
  }

  /**
   * Update graph data (when new data is loaded)
   */
  setGraphData(nodes: GraphNode[], links: GraphLink[]): void {
    this.allNodes = nodes;
    this.allLinks = links;
    
    logger.debug('adaptive-detail', 'Graph data updated', {
      nodeCount: nodes.length,
      linkCount: links.length
    });
  }

  /**
   * Get current adaptive detail state
   */
  getState(): AdaptiveDetailState {
    return { ...this.currentState };
  }

  /**
   * Handle zoom level change and return filtered data
   */
  handleZoomChange(zoomLevel: number): FilteredGraphData {
    // If disabled, return all data
    if (!this.currentState.enabled) {
      return this.createFilteredData(this.allNodes, this.allLinks, 'ultra-detail', 'Adaptive detail disabled');
    }

    // Determine detail level based on zoom
    const newLevel = this.calculateDetailLevel(zoomLevel);
    
    // Only update if level changed
    if (newLevel !== this.currentState.currentLevel) {
      this.currentState.currentLevel = newLevel;
      logger.debug('adaptive-detail', 'Detail level changed', {
        zoomLevel,
        newLevel,
        mode: this.settings.mode
      });
    }

    // Filter data based on current level
    return this.filterDataForLevel(newLevel);
  }

  /**
   * Manual detail level override (for manual mode or debugging)
   */
  setDetailLevel(level: DetailLevel): FilteredGraphData {
    this.currentState.currentLevel = level;
    
    logger.debug('adaptive-detail', 'Manual detail level set', { level });
    
    return this.filterDataForLevel(level);
  }

  /**
   * Calculate appropriate detail level based on zoom
   */
  private calculateDetailLevel(zoomLevel: number): DetailLevel {
    const thresholds = this.settings.thresholds;
    
    if (zoomLevel < thresholds.overview) {
      return 'overview';
    } else if (zoomLevel < thresholds.standard) {
      return 'standard';
    } else if (zoomLevel < thresholds.detail) {
      return 'detail';
    } else {
      return 'ultra-detail';
    }
  }

  /**
   * Filter graph data based on detail level
   */
  private filterDataForLevel(level: DetailLevel): FilteredGraphData {
    let filteredNodes: GraphNode[];
    let filteredLinks: GraphLink[];
    let filterReason: string;

    switch (level) {
      case 'overview':
        filteredNodes = this.filterNodesForOverview();
        filteredLinks = this.filterLinksForOverview(filteredNodes);
        filterReason = 'Overview mode: showing major hubs only';
        break;

      case 'standard':
        filteredNodes = this.filterNodesForStandard();
        filteredLinks = this.filterLinksForStandard(filteredNodes);
        filterReason = 'Standard mode: showing connected nodes';
        break;

      case 'detail':
        filteredNodes = this.filterNodesForDetail();
        filteredLinks = this.filterLinksForDetail(filteredNodes);
        filterReason = 'Detail mode: showing most nodes and links';
        break;

      case 'ultra-detail':
      default:
        filteredNodes = [...this.allNodes];
        filteredLinks = [...this.allLinks];
        filterReason = 'Ultra-detail mode: showing everything';
        break;
    }

    // Apply override constraints
    filteredNodes = this.applyOverrides(filteredNodes);

    return this.createFilteredData(filteredNodes, filteredLinks, level, filterReason);
  }

  /**
   * Overview mode: Show only major hubs (≥5 connections)
   */
  private filterNodesForOverview(): GraphNode[] {
    const minConnections = 5;
    const hubs = this.allNodes.filter(node => node.connections.length >= minConnections);
    
    // Ensure minimum visible nodes for orientation
    if (hubs.length < this.settings.overrides.minimumVisibleNodes) {
      // Add the most connected nodes to reach minimum
      const sortedNodes = [...this.allNodes].sort((a, b) => b.connections.length - a.connections.length);
      const needed = this.settings.overrides.minimumVisibleNodes - hubs.length;
      const additional = sortedNodes.filter(node => !hubs.includes(node)).slice(0, needed);
      return [...hubs, ...additional];
    }
    
    return hubs;
  }

  /**
   * Standard mode: Show nodes with ≥2 connections
   */
  private filterNodesForStandard(): GraphNode[] {
    const minConnections = 2;
    return this.allNodes.filter(node => node.connections.length >= minConnections);
  }

  /**
   * Detail mode: Show all connected nodes (≥1 connection)
   */
  private filterNodesForDetail(): GraphNode[] {
    const minConnections = 1;
    return this.allNodes.filter(node => node.connections.length >= minConnections);
  }

  /**
   * Filter links for overview: Show only strongest 20% of links
   */
  private filterLinksForOverview(visibleNodes: GraphNode[]): GraphLink[] {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    
    // Only include links between visible nodes
    const relevantLinks = this.allLinks.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    // Sort by strength and take top 20%
    const sortedLinks = relevantLinks.sort((a, b) => b.strength - a.strength);
    const keepCount = Math.max(1, Math.floor(sortedLinks.length * 0.2));
    
    return sortedLinks.slice(0, keepCount);
  }

  /**
   * Filter links for standard: Show strongest 60% of links
   */
  private filterLinksForStandard(visibleNodes: GraphNode[]): GraphLink[] {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    
    const relevantLinks = this.allLinks.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    // Sort by strength and take top 60%
    const sortedLinks = relevantLinks.sort((a, b) => b.strength - a.strength);
    const keepCount = Math.max(1, Math.floor(sortedLinks.length * 0.6));
    
    return sortedLinks.slice(0, keepCount);
  }

  /**
   * Filter links for detail: Show strongest 90% of links
   */
  private filterLinksForDetail(visibleNodes: GraphNode[]): GraphLink[] {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    
    const relevantLinks = this.allLinks.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    // Sort by strength and take top 90%
    const sortedLinks = relevantLinks.sort((a, b) => b.strength - a.strength);
    const keepCount = Math.max(1, Math.floor(sortedLinks.length * 0.9));
    
    return sortedLinks.slice(0, keepCount);
  }

  /**
   * Apply override constraints to filtered nodes
   */
  private applyOverrides(nodes: GraphNode[]): GraphNode[] {
    const maxNodes = this.settings.overrides.maximumVisibleNodes;
    
    // Apply maximum node limit if specified
    if (maxNodes > 0 && nodes.length > maxNodes) {
      // Keep the most connected nodes
      const sortedNodes = [...nodes].sort((a, b) => b.connections.length - a.connections.length);
      return sortedNodes.slice(0, maxNodes);
    }
    
    return nodes;
  }

  /**
   * Create FilteredGraphData result
   */
  private createFilteredData(
    nodes: GraphNode[], 
    links: GraphLink[], 
    level: DetailLevel, 
    filterReason: string
  ): FilteredGraphData {
    return {
      nodes,
      links,
      level,
      stats: {
        totalNodes: this.allNodes.length,
        visibleNodes: nodes.length,
        totalLinks: this.allLinks.length,
        visibleLinks: links.length,
        filterReason
      }
    };
  }
}