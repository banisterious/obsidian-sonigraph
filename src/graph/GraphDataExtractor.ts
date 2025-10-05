import { TFile, TFolder, Vault, MetadataCache, CachedMetadata } from 'obsidian';
import { getLogger } from '../logging';
import { EnhancedGraphNode } from './types';
import { HubCentralityAnalyzer } from '../audio/orchestration/HubCentralityAnalyzer';
import type { CentralityWeights } from '../audio/orchestration/types';

const logger = getLogger('GraphDataExtractor');

export interface GraphNode {
  id: string;
  type: 'note' | 'image' | 'pdf' | 'audio' | 'video' | 'other';
  title: string;
  path: string;
  creationDate: Date;
  modificationDate: Date;
  fileSize: number;
  connections: string[];
  metadata?: {
    dimensions?: { width: number; height: number };
    dominantColors?: string[];
    tags?: string[];
  };
  // Phase 5.2: Hub centrality score
  hubCentrality?: number;
  // D3 simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'reference' | 'attachment' | 'tag';
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class GraphDataExtractor {
  private vault: Vault;
  private metadataCache: MetadataCache;
  private cachedData: GraphData | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private excludeFolders: string[];
  private excludeFiles: string[];
  private filterSettings: {
    showTags: boolean;
    showOrphans: boolean;
  };
  // Phase 5.2: Hub centrality calculation
  private hubCentralityAnalyzer: HubCentralityAnalyzer | null = null;
  private enableHubCentrality: boolean;

  constructor(vault: Vault, metadataCache: MetadataCache, options?: {
    excludeFolders?: string[];
    excludeFiles?: string[];
    filterSettings?: {
      showTags: boolean;
      showOrphans: boolean;
    };
    // Phase 5.2: Hub orchestration options
    calculateHubCentrality?: boolean;
    hubCentralityWeights?: CentralityWeights;
    hubThreshold?: number;
  }) {
    logger.debug('extraction', 'GraphDataExtractor constructor started');
    
    this.vault = vault;
    logger.debug('extraction', 'Vault assigned');
    
    this.metadataCache = metadataCache;
    logger.debug('extraction', 'MetadataCache assigned');
    
    this.excludeFolders = options?.excludeFolders || [];
    this.excludeFiles = options?.excludeFiles || [];
    this.filterSettings = options?.filterSettings || {
      showTags: true,
      showOrphans: true
    };

    // Phase 5.2: Initialize hub centrality analyzer if enabled
    this.enableHubCentrality = options?.calculateHubCentrality || false;
    if (this.enableHubCentrality) {
      this.hubCentralityAnalyzer = new HubCentralityAnalyzer(
        options?.hubCentralityWeights,
        options?.hubThreshold
      );
      logger.debug('extraction', 'Hub centrality analyzer initialized');
    }

    logger.debug('extraction', 'Exclusions and filters set:', {
      excludeFolders: this.excludeFolders.length,
      excludeFiles: this.excludeFiles.length,
      filterSettings: this.filterSettings,
      hubCentralityEnabled: this.enableHubCentrality
    });

    logger.debug('extraction', 'GraphDataExtractor constructor completed');
  }

  /**
   * Extract complete graph data from the vault
   */
  async extractGraphData(forceRefresh: boolean = false): Promise<GraphData> {
    const now = Date.now();
    
    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && this.cachedData && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      logger.debug('extraction', 'Returning cached graph data');
      return this.cachedData;
    }

    logger.info('graph-extraction', 'Starting graph data extraction');
    const startTime = logger.time('graphExtraction');

    try {
      logger.info('graph-extraction-nodes', 'Starting node extraction');
      const nodes = await this.extractNodes();
      logger.info('graph-extraction-nodes', `Node extraction completed: ${nodes.length} nodes`);
      
      logger.info('graph-extraction-links', 'Starting link extraction');
      let links: GraphLink[] = [];
      try {
        links = this.extractLinks(nodes);
        logger.info('graph-extraction-links', `Link extraction completed: ${links.length} links`);
      } catch (error) {
        logger.error('graph-extraction-links', 'Link extraction failed:', error);
        links = []; // Empty links array as fallback
        logger.info('graph-extraction-links', `Link extraction completed with fallback: ${links.length} links`);
      }
      
      // Always populate node connections for hub highlighting
      logger.info('graph-extraction-connections', 'Populating node connections for hub highlighting');
      this.populateNodeConnections(nodes, links);
      logger.info('graph-extraction-connections', 'Node connections populated');

      // Phase 5.2: Calculate hub centrality if enabled
      if (this.enableHubCentrality && this.hubCentralityAnalyzer) {
        logger.info('graph-extraction-hub-centrality', 'Calculating hub centrality metrics');
        const hubMetrics = this.hubCentralityAnalyzer.calculateHubMetrics(nodes, links);

        // Populate hubCentrality on each node
        nodes.forEach(node => {
          const metrics = hubMetrics.get(node.id);
          if (metrics) {
            node.hubCentrality = metrics.compositeScore;
          }
        });

        const hubCount = Array.from(hubMetrics.values()).filter(m => m.isHub).length;
        logger.info('graph-extraction-hub-centrality', `Hub centrality calculated: ${hubCount} hubs identified`);
      }

      // Filter orphans if showOrphans is disabled
      let filteredNodes = nodes;
      if (!this.filterSettings.showOrphans) {
        logger.info('graph-extraction-orphan-filter', 'Filtering orphan nodes');
        filteredNodes = this.filterOrphans(nodes, links);
        logger.info('graph-extraction-orphan-filter', `Orphan filtering completed: ${filteredNodes.length} nodes remaining (${nodes.length - filteredNodes.length} orphans removed)`);
      }
      
      logger.info('graph-extraction-time', 'Calculating time range');
      const timeRange = this.calculateTimeRange(filteredNodes);
      logger.info('graph-extraction-time', 'Time range calculated', { 
        start: timeRange.start.toISOString(), 
        end: timeRange.end.toISOString() 
      });

      this.cachedData = {
        nodes: filteredNodes,
        links,
        timeRange
      };
      
      this.lastCacheTime = now;
      
      startTime();
      logger.info('extraction', `Graph extraction completed: ${nodes.length} nodes, ${links.length} links`, {
        nodeCount: nodes.length,
        linkCount: links.length,
        timeSpan: timeRange.end.getTime() - timeRange.start.getTime()
      });

      return this.cachedData;
    } catch (error) {
      startTime();
      logger.error('extraction', 'Failed to extract graph data', error as Error);
      throw error;
    }
  }

  /**
   * Extract all files as nodes with optimized metadata access
   * Phase 3.9: Use batch metadata access and reduce file system calls
   */
  private async extractNodes(): Promise<GraphNode[]> {
    const files = this.vault.getFiles();
    const nodes: GraphNode[] = [];
    
    logger.info('node-extraction', `Starting optimized node extraction from ${files.length} files`);
    const startTime = performance.now();

    // Phase 3.9: Pre-cache metadata for all files to reduce individual lookups
    const metadataCache = new Map<string, CachedMetadata | null>();
    let excludedCount = 0;
    let processedCount = 0;

    for (const file of files) {
      // Check if file should be excluded
      if (this.shouldExcludeFile(file)) {
        excludedCount++;
        logger.debug('extraction', `Excluding file: ${file.path}`);
        continue;
      }

      try {
        // Cache metadata lookup result
        const metadata = this.metadataCache.getFileCache(file);
        metadataCache.set(file.path, metadata);
        
        const node = this.createOptimizedNodeFromFile(file, metadata);
        if (node) {
          nodes.push(node);
          processedCount++;
        }
      } catch (error) {
        logger.warn('extraction', `Failed to process file: ${file.path}`, { path: file.path, error });
      }
    }

    const extractionTime = performance.now() - startTime;

    logger.info('node-extraction-complete', `Optimized node extraction completed in ${extractionTime.toFixed(1)}ms`, {
      totalFiles: files.length,
      processedFiles: processedCount,
      excludedFiles: excludedCount,
      extractedNodes: nodes.length,
      avgTimePerFile: (extractionTime / processedCount).toFixed(2) + 'ms'
    });
    
    return nodes;
  }

  /**
   * Check if a file should be excluded based on exclusion settings
   */
  private shouldExcludeFile(file: TFile): boolean {
    // Check if file is directly excluded
    if (this.excludeFiles.includes(file.path)) {
      return true;
    }

    // Check if file is in an excluded folder
    for (const excludeFolder of this.excludeFolders) {
      if (file.path.startsWith(excludeFolder + '/') || file.path === excludeFolder) {
        return true;
      }
    }

    return false;
  }

  /**
   * Phase 3.9: Optimized node creation without async file operations
   */
  private createOptimizedNodeFromFile(file: TFile, metadata: CachedMetadata | null): GraphNode | null {
    const stat = file.stat;

    const node: GraphNode = {
      id: file.path,
      type: this.getFileType(file),
      title: this.getDisplayTitle(file, metadata),
      path: file.path,
      creationDate: new Date(stat.ctime),
      modificationDate: new Date(stat.mtime),
      fileSize: stat.size,
      connections: [],
      metadata: this.extractOptimizedFileMetadata(file, metadata)
    };

    return node;
  }

  /**
   * Create a node from a TFile (legacy method)
   */
  private async createNodeFromFile(file: TFile): Promise<GraphNode | null> {
    const metadata = this.metadataCache.getFileCache(file);
    const stat = file.stat;

    const node: GraphNode = {
      id: file.path,
      type: this.getFileType(file),
      title: this.getDisplayTitle(file, metadata),
      path: file.path,
      creationDate: new Date(stat.ctime),
      modificationDate: new Date(stat.mtime),
      fileSize: stat.size,
      connections: [],
      metadata: await this.extractFileMetadata(file, metadata)
    };

    return node;
  }

  /**
   * Determine file type based on extension
   */
  private getFileType(file: TFile): GraphNode['type'] {
    const ext = file.extension.toLowerCase();
    
    if (ext === 'md') return 'note';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext)) return 'video';
    
    return 'other';
  }

  /**
   * Get display title for a file
   */
  private getDisplayTitle(file: TFile, metadata: CachedMetadata | null): string {
    // Try to get title from frontmatter
    if (metadata?.frontmatter?.title) {
      return metadata.frontmatter.title;
    }
    
    // Use filename without extension
    return file.basename;
  }

  /**
   * Phase 3.9: Optimized metadata extraction without async operations
   */
  private extractOptimizedFileMetadata(file: TFile, metadata: CachedMetadata | null): GraphNode['metadata'] {
    const result: GraphNode['metadata'] = {};

    // Extract tags from cached metadata
    if (metadata?.tags) {
      result.tags = metadata.tags.map(tag => tag.tag);
    }

    // For images, set placeholder data (real analysis would be too expensive)
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(file.extension.toLowerCase())) {
      // Lightweight placeholder for future image analysis
      result.dimensions = { width: 0, height: 0 };
      result.dominantColors = [];
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Extract additional metadata from file (legacy method)
   */
  private async extractFileMetadata(file: TFile, metadata: CachedMetadata | null): Promise<GraphNode['metadata']> {
    const result: GraphNode['metadata'] = {};

    // Extract tags
    if (metadata?.tags) {
      result.tags = metadata.tags.map(tag => tag.tag);
    }

    // For images, we could extract dimensions and colors in the future
    if (file.extension.toLowerCase() in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']) {
      // Placeholder for future image analysis
      result.dimensions = { width: 0, height: 0 };
      result.dominantColors = [];
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Extract links between nodes using Obsidian's pre-computed resolvedLinks for optimal performance
   * Phase 3.9: Leverage MetadataCache.resolvedLinks and unresolvedLinks for instant graph data access
   */
  private extractLinks(nodes: GraphNode[]): GraphLink[] {
    const links: GraphLink[] = [];
    const nodeMap = new Map(nodes.map(node => [node.path, node]));
    const linkSet = new Set<string>(); // Prevent duplicate links

    logger.info('graph-extraction-links', `Starting optimized link extraction using MetadataCache for ${nodes.length} nodes`);
    
    const startTime = performance.now();

    // Phase 3.9: Use pre-computed resolvedLinks from MetadataCache for maximum performance
    const resolvedLinks = this.metadataCache.resolvedLinks;
    let processedConnections = 0;
    let skippedConnections = 0;

    // Process resolved links - these are guaranteed to be valid connections
    for (const [sourcePath, targets] of Object.entries(resolvedLinks)) {
      // Only process if source node exists in our graph
      if (!nodeMap.has(sourcePath)) {
        continue;
      }

      for (const [targetPath, linkCount] of Object.entries(targets)) {
        // Only process if target node exists in our graph  
        if (!nodeMap.has(targetPath)) {
          skippedConnections++;
          continue;
        }

        // Phase 3.9: Generate consistent link ID for deduplication
        const linkId = this.generateLinkId(sourcePath, targetPath);
        
        if (!linkSet.has(linkId)) {
          linkSet.add(linkId);
          links.push({
            source: sourcePath,
            target: targetPath,
            type: 'reference',
            strength: this.calculateLinkStrengthFromCount(linkCount)
          });
          processedConnections++;
        }
      }
    }

    // Phase 3.9: Add tag-based connections if enabled (optimized approach)
    if (this.filterSettings.showTags) {
      this.createOptimizedTagBasedLinks(nodes, links, linkSet);
    }

    // Phase 3.9: Add selective folder hierarchy connections for clustering (much more efficient)
    if (nodes.length < 1000) { // Only for smaller graphs to avoid performance impact
      this.createOptimizedFolderHierarchyLinks(nodes, links, linkSet);
    }

    const extractionTime = performance.now() - startTime;

    logger.info('link-extraction-complete', `Optimized link extraction completed in ${extractionTime.toFixed(1)}ms`, {
      totalNodes: nodes.length,
      extractedLinks: links.length,
      processedConnections,
      skippedConnections,
      linksPerNode: (links.length / nodes.length).toFixed(2),
      linkTypes: this.summarizeLinkTypes(links),
      performanceGain: 'Using MetadataCache.resolvedLinks for instant access'
    });

    // Debug: Log sample links to understand what's being created
    if (links.length > 0) {
      const sampleLinks = links.slice(0, 3);
      sampleLinks.forEach(link => {
        logger.debug('sample-link', `Link: ${typeof link.source === 'string' ? link.source : link.source.id} -> ${typeof link.target === 'string' ? link.target : link.target.id} (${link.type})`);
      });
    } else {
      logger.debug('no-links', 'No links were created - this explains why all nodes have 0 connections');
    }
    
    return links;
  }

  /**
   * Phase 3.8: Generate consistent link ID for deduplication
   */
  private generateLinkId(sourcePath: string, targetPath: string): string {
    // Ensure consistent ordering to prevent duplicate bidirectional links
    const [first, second] = [sourcePath, targetPath].sort();
    return `${first}<->${second}`;
  }

  /**
   * Phase 3.9: Calculate link strength from MetadataCache link count for better relationship weighting
   */
  private calculateLinkStrengthFromCount(linkCount: number): number {
    // Scale link strength based on frequency: 1-2 links = 1.0, 3-5 = 1.2, 6+ = 1.5
    if (linkCount >= 6) return 1.5;
    if (linkCount >= 3) return 1.2;
    return 1.0;
  }


  /**
   * Phase 3.9: Optimized tag-based link creation using pre-computed tag index
   */
  private createOptimizedTagBasedLinks(nodes: GraphNode[], links: GraphLink[], linkSet: Set<string>): void {
    // Build tag index once for all nodes
    const tagIndex = new Map<string, GraphNode[]>();
    
    for (const node of nodes) {
      const file = this.vault.getAbstractFileByPath(node.path);
      if (!file || !(file instanceof TFile)) continue;
      
      const metadata = this.metadataCache.getFileCache(file);
      if (!metadata?.tags) continue;
      
      const nodeTags = metadata.tags.map(tag => tag.tag);
      for (const tag of nodeTags) {
        if (!tagIndex.has(tag)) {
          tagIndex.set(tag, []);
        }
        tagIndex.get(tag)!.push(node);
      }
    }

    // Create links between nodes sharing tags
    let tagLinksCreated = 0;
    const MAX_TAG_LINKS = 500; // Prevent excessive tag links
    
    for (const [tag, taggedNodes] of tagIndex) {
      if (taggedNodes.length < 2) continue; // Need at least 2 nodes to create links
      if (tagLinksCreated >= MAX_TAG_LINKS) break;
      
      // Limit connections per tag to prevent performance issues
      const limitedNodes = taggedNodes.slice(0, 20);
      
      for (let i = 0; i < limitedNodes.length && tagLinksCreated < MAX_TAG_LINKS; i++) {
        for (let j = i + 1; j < limitedNodes.length && tagLinksCreated < MAX_TAG_LINKS; j++) {
          const linkId = this.generateLinkId(limitedNodes[i].path, limitedNodes[j].path);
          
          if (!linkSet.has(linkId)) {
            linkSet.add(linkId);
            links.push({
              source: limitedNodes[i].path,
              target: limitedNodes[j].path,
              type: 'tag',
              strength: 0.3 // Weak connection for tag relationships
            });
            tagLinksCreated++;
          }
        }
      }
    }

    logger.debug('tag-links-optimized', `Created ${tagLinksCreated} tag-based links from ${tagIndex.size} unique tags`);
  }


  /**
   * Phase 3.9: Optimized folder hierarchy link creation using pre-computed folder index
   */
  private createOptimizedFolderHierarchyLinks(nodes: GraphNode[], links: GraphLink[], linkSet: Set<string>): void {
    // Build folder index once for all nodes
    const folderIndex = new Map<string, GraphNode[]>();
    
    for (const node of nodes) {
      const folderPath = node.path.substring(0, node.path.lastIndexOf('/'));
      if (!folderPath) continue; // Skip root level files
      
      if (!folderIndex.has(folderPath)) {
        folderIndex.set(folderPath, []);
      }
      folderIndex.get(folderPath)!.push(node);
    }

    // Create sibling links within folders (but limit to prevent excessive connections)
    let folderLinksCreated = 0;
    const MAX_FOLDER_LINKS = 200;
    
    for (const [folderPath, folderNodes] of folderIndex) {
      if (folderNodes.length < 2) continue; // Need at least 2 nodes
      if (folderLinksCreated >= MAX_FOLDER_LINKS) break;
      
      // Limit connections per folder - create star pattern from first node to others
      const limitedNodes = folderNodes.slice(0, 8); // Max 8 nodes per folder
      
      for (let i = 0; i < limitedNodes.length && folderLinksCreated < MAX_FOLDER_LINKS; i++) {
        for (let j = i + 1; j < limitedNodes.length && folderLinksCreated < MAX_FOLDER_LINKS; j++) {
          const linkId = this.generateLinkId(limitedNodes[i].path, limitedNodes[j].path);
          
          if (!linkSet.has(linkId)) {
            linkSet.add(linkId);
            links.push({
              source: limitedNodes[i].path,
              target: limitedNodes[j].path,
              type: 'reference',
              strength: 0.2 // Very weak connection for folder siblings
            });
            folderLinksCreated++;
          }
        }
      }
    }

    logger.debug('folder-links-optimized', `Created ${folderLinksCreated} folder hierarchy links from ${folderIndex.size} folders`);
  }


  /**
   * Phase 3.8: Summarize link types for debugging
   */
  private summarizeLinkTypes(links: GraphLink[]): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const link of links) {
      summary[link.type] = (summary[link.type] || 0) + 1;
    }
    return summary;
  }

  /**
   * Calculate the time range of the graph
   */
  private calculateTimeRange(nodes: GraphNode[]): { start: Date; end: Date } {
    if (nodes.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    let earliest = nodes[0].creationDate;
    let latest = nodes[0].creationDate;

    for (const node of nodes) {
      if (node.creationDate < earliest) {
        earliest = node.creationDate;
      }
      if (node.creationDate > latest) {
        latest = node.creationDate;
      }
    }

    return { start: earliest, end: latest };
  }

  /**
   * Populate each node's connections array with actual connection data
   */
  private populateNodeConnections(nodes: GraphNode[], links: GraphLink[]): void {
    // Update each node's connections array with actual connection data
    for (const node of nodes) {
      // Create array of connected node IDs
      node.connections = [];
      for (const link of links) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (sourceId === node.id && !node.connections.includes(targetId)) {
          node.connections.push(targetId);
        } else if (targetId === node.id && !node.connections.includes(sourceId)) {
          node.connections.push(sourceId);
        }
      }
    }
  }

  /**
   * Filter out orphan nodes (nodes with few or no connections)
   */
  private filterOrphans(nodes: GraphNode[], links: GraphLink[]): GraphNode[] {
    // Filter nodes: keep nodes with 1 or more connections (orphans = 0 connections)
    const ORPHAN_THRESHOLD = 1;
    const filteredNodes = nodes.filter(node => {
      const connections = node.connections.length;
      return connections >= ORPHAN_THRESHOLD;
    });
    
    logger.debug('orphan-filter', `Filtered orphans: ${nodes.length} → ${filteredNodes.length} nodes (orphans = files with 0 connections)`);
    
    return filteredNodes;
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.cachedData = null;
    this.lastCacheTime = 0;
    logger.debug('extraction', 'Graph data cache cleared');
  }

  /**
   * Phase 1.2: Extract enhanced metadata for advanced audio mapping
   */
  async extractEnhancedNodes(): Promise<EnhancedGraphNode[]> {
    const files = this.vault.getFiles();
    const enhancedNodes: EnhancedGraphNode[] = [];
    
    logger.info('enhanced-extraction', `Starting enhanced node extraction from ${files.length} files`);
    const startTime = performance.now();

    for (const file of files) {
      if (this.shouldExcludeFile(file)) {
        continue;
      }

      try {
        const metadata = this.metadataCache.getFileCache(file);
        const enhancedNode = this.createEnhancedNodeFromFile(file, metadata);
        if (enhancedNode) {
          enhancedNodes.push(enhancedNode);
        }
      } catch (error) {
        logger.warn('enhanced-extraction', `Failed to process file: ${file.path}`, { path: file.path, error });
      }
    }

    const extractionTime = performance.now() - startTime;
    logger.info('enhanced-extraction-complete', `Enhanced extraction completed in ${extractionTime.toFixed(1)}ms`, {
      totalFiles: files.length,
      extractedNodes: enhancedNodes.length
    });
    
    return enhancedNodes;
  }

  /**
   * Phase 1.2: Create enhanced node with detailed metadata
   */
  private createEnhancedNodeFromFile(file: TFile, metadata: CachedMetadata | null): EnhancedGraphNode | null {
    const stat = file.stat;
    const baseNode = this.createOptimizedNodeFromFile(file, metadata);
    if (!baseNode) return null;

    // Extract enhanced metadata
    const enhancedMetadata = this.extractEnhancedMetadata(file, metadata);
    
    // Analyze connection types
    const connectionDetails = this.analyzeConnectionTypes(file, metadata);
    
    // Analyze folder hierarchy
    const folderAnalysis = this.analyzeFolderHierarchy(file.path);

    const enhancedNode: EnhancedGraphNode = {
      ...baseNode,
      name: baseNode.title,
      connections: [], // Will be populated later
      connectionCount: 0,
      wordCount: enhancedMetadata.wordCount || 0,
      tags: enhancedMetadata.tags,
      headings: [], // Extract headings separately if needed
      created: stat.ctime,
      modified: stat.mtime,
      metadata: enhancedMetadata,
      connectionDetails: connectionDetails,
      folderDepth: folderAnalysis.depth,
      pathComponents: folderAnalysis.components
    };

    return enhancedNode;
  }

  /**
   * Phase 1.2: Extract comprehensive metadata for enhanced mapping
   */
  private extractEnhancedMetadata(file: TFile, metadata: CachedMetadata | null): EnhancedGraphNode['metadata'] {
    const result: EnhancedGraphNode['metadata'] = {
      tags: [],
      frontmatter: {},
      wordCount: undefined,
      headingCount: undefined
    };

    if (metadata) {
      // Extract tags
      if (metadata.tags) {
        result.tags = metadata.tags.map(tag => tag.tag);
      }

      // Extract frontmatter
      if (metadata.frontmatter) {
        result.frontmatter = { ...metadata.frontmatter };
      }

      // Extract headings count
      if (metadata.headings) {
        result.headingCount = metadata.headings.length;
      }
    }

    // For markdown files, estimate word count from file size
    if (file.extension === 'md') {
      // Rough estimation: average 5 characters per word
      result.wordCount = Math.round(file.stat.size / 5);
    }

    return result;
  }

  /**
   * Phase 1.2: Analyze different connection types for a file
   */
  private analyzeConnectionTypes(file: TFile, metadata: CachedMetadata | null): EnhancedGraphNode['connectionDetails'] {
    const result: EnhancedGraphNode['connectionDetails'] = {
      wikilinks: [],
      markdownLinks: [],
      embeds: [],
      tagConnections: [],
      totalCount: 0
    };

    if (!metadata) return result;

    // Extract wikilinks
    if (metadata.links) {
      result.wikilinks = metadata.links
        .filter(link => !link.original.startsWith('!'))
        .map(link => link.link);
    }

    // Extract embeds
    if (metadata.embeds) {
      result.embeds = metadata.embeds.map(embed => embed.link);
    }

    // Extract markdown links (from frontmatter or content)
    if (metadata.frontmatter?.links) {
      result.markdownLinks = Array.isArray(metadata.frontmatter.links) 
        ? metadata.frontmatter.links 
        : [];
    }

    // Tag connections will be populated during link extraction
    result.tagConnections = [];

    result.totalCount = result.wikilinks.length + 
                       result.markdownLinks.length + 
                       result.embeds.length;

    return result;
  }

  /**
   * Phase 1.2: Analyze folder hierarchy for a file path
   */
  private analyzeFolderHierarchy(filePath: string): { depth: number; components: string[] } {
    const components = filePath.split('/').filter(comp => comp !== '');
    
    // Remove filename to get folder components only
    if (components.length > 0) {
      components.pop();
    }

    return {
      depth: components.length,
      components: components
    };
  }

  /**
   * Phase 1.2: Calculate hub centrality for nodes based on connections
   */
  calculateHubCentrality(nodes: EnhancedGraphNode[]): void {
    // Calculate average connections
    const avgConnections = nodes.reduce((sum, node) => sum + node.connectionCount, 0) / nodes.length;
    
    // Calculate standard deviation
    const variance = nodes.reduce((sum, node) => 
      sum + Math.pow(node.connectionCount - avgConnections, 2), 0) / nodes.length;
    const stdDev = Math.sqrt(variance);

    // Assign hub centrality scores
    for (const node of nodes) {
      if (node.connectionCount > avgConnections + 2 * stdDev) {
        node.hubCentrality = 1.0; // Major hub
      } else if (node.connectionCount > avgConnections + stdDev) {
        node.hubCentrality = 0.7; // Moderate hub
      } else if (node.connectionCount > avgConnections) {
        node.hubCentrality = 0.4; // Minor hub
      } else {
        node.hubCentrality = 0.1; // Not a hub
      }
    }
  }
} 