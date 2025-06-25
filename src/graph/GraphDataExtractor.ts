import { TFile, TFolder, Vault, MetadataCache, CachedMetadata } from 'obsidian';
import { getLogger } from '../logging';

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

  constructor(vault: Vault, metadataCache: MetadataCache, options?: {
    excludeFolders?: string[];
    excludeFiles?: string[];
    filterSettings?: {
      showTags: boolean;
      showOrphans: boolean;
    };
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
    logger.debug('extraction', 'Exclusions and filters set:', { 
      excludeFolders: this.excludeFolders.length,
      excludeFiles: this.excludeFiles.length,
      filterSettings: this.filterSettings
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
      const links = this.extractLinks(nodes);
      logger.info('graph-extraction-links', `Link extraction completed: ${links.length} links`);
      
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
   * Extract all files as nodes
   */
  private async extractNodes(): Promise<GraphNode[]> {
    const files = this.vault.getFiles();
    const nodes: GraphNode[] = [];

    for (const file of files) {
      // Check if file should be excluded
      if (this.shouldExcludeFile(file)) {
        logger.debug('extraction', `Excluding file: ${file.path}`);
        continue;
      }

      try {
        const node = await this.createNodeFromFile(file);
        if (node) {
          nodes.push(node);
        }
      } catch (error) {
        logger.warn('extraction', `Failed to process file: ${file.path}`, { path: file.path, error });
      }
    }

    logger.debug('extraction', `Extracted ${nodes.length} nodes from ${files.length} files`);
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
   * Create a node from a TFile
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
   * Extract additional metadata from file
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
   * Extract links between nodes
   * Phase 3.8: Enhanced link detection with expanded scope and better consistency
   */
  private extractLinks(nodes: GraphNode[]): GraphLink[] {
    const links: GraphLink[] = [];
    const nodeMap = new Map(nodes.map(node => [node.path, node]));
    const linkSet = new Set<string>(); // Prevent duplicate links

    logger.info('graph-extraction-links', `Starting link extraction for ${nodes.length} nodes`);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      // Progress logging every 100 nodes
      if (i % 100 === 0) {
        logger.info('graph-extraction-links', `Processing node ${i + 1}/${nodes.length}: ${node.path}`);
      }
      
      const file = this.vault.getAbstractFileByPath(node.path) as TFile;
      if (!file) continue;

      const metadata = this.metadataCache.getFileCache(file);
      
      // Phase 3.8: Expand scope - process files with metadata (primarily markdown)
      if (metadata) {
        // Process outgoing links with enhanced debugging
        if (metadata.links) {
          logger.debug('link-detection', `Processing ${metadata.links.length} links from ${file.path}`);
          
          for (const link of metadata.links) {
            // Phase 3.8: Improved link resolution using getFirstLinkpathDest
            const targetFile = this.metadataCache.getFirstLinkpathDest(link.link, file.path);
            
            if (targetFile && nodeMap.has(targetFile.path)) {
              // Phase 3.8: Consistent link ID generation
              const linkId = this.generateLinkId(node.path, targetFile.path);
              
              if (!linkSet.has(linkId)) {
                linkSet.add(linkId);
                links.push({
                  source: node.path, // Use path for consistency
                  target: targetFile.path,
                  type: 'reference',
                  strength: this.calculateLinkStrength(link, 'reference')
                });
                logger.debug('link-success', `Link resolved: ${link.link} -> ${targetFile.path}`, {
                  from: file.path,
                  to: targetFile.path,
                  linkText: link.link,
                  strength: this.calculateLinkStrength(link, 'reference')
                });
              }
            } else {
              logger.debug('link-fail', `Link not resolved: ${link.link}`, {
                from: file.path,
                originalLink: link.link,
                reason: targetFile ? 'target not in graph' : 'target not found'
              });
            }
          }
        }

        // Process embeds with enhanced debugging  
        if (metadata.embeds) {
          logger.debug('embed-detection', `Processing ${metadata.embeds.length} embeds from ${file.path}`);
          
          for (const embed of metadata.embeds) {
            // Phase 3.8: Enhanced embed resolution
            const targetFile = this.metadataCache.getFirstLinkpathDest(embed.link, file.path);
            
            if (targetFile && nodeMap.has(targetFile.path)) {
              // Phase 3.8: Consistent link ID generation
              const linkId = this.generateLinkId(node.path, targetFile.path);
              
              if (!linkSet.has(linkId)) {
                linkSet.add(linkId);
                links.push({
                  source: node.path, // Use path for consistency
                  target: targetFile.path,
                  type: 'attachment',
                  strength: this.calculateLinkStrength(embed, 'attachment')
                });
                logger.debug('embed-success', `Embed resolved: ${embed.link} -> ${targetFile.path}`, {
                  from: file.path,
                  to: targetFile.path,
                  embedText: embed.link,
                  strength: this.calculateLinkStrength(embed, 'attachment')
                });
              }
            } else {
              logger.debug('embed-fail', `Embed not resolved: ${embed.link}`, {
                from: file.path,
                originalEmbed: embed.link,
                reason: targetFile ? 'target not in graph' : 'target not found'
              });
            }
          }
        }

        // Phase 3.8: Process tags as weak connections (only if showTags is enabled)
        if (this.filterSettings.showTags && metadata.tags && metadata.tags.length > 0) {
          const nodeTags = metadata.tags.map(tag => tag.tag);
          // Limit tag processing to prevent infinite loops and improve performance
          const limitedTags = nodeTags.slice(0, 10); // Max 10 tags per node for better performance
          this.createTagBasedLinks(node, limitedTags, nodes, links, linkSet);
        }
      }
      
      // Phase 3.8: Add folder hierarchy connections for better clustering
      // Only process every 20th node for hierarchy to reduce complexity for better performance
      if (i % 20 === 0) {
        this.createFolderHierarchyLinks(node, nodes, links, linkSet);
      }
    }

    logger.debug('link-extraction-complete', `Extracted ${links.length} unique links`, {
      totalNodes: nodes.length,
      linksPerNode: (links.length / nodes.length).toFixed(2),
      linkTypes: this.summarizeLinkTypes(links)
    });
    
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
   * Phase 3.8: Calculate link strength based on link type and context
   */
  private calculateLinkStrength(link: any, type: 'reference' | 'attachment'): number {
    const baseStrength = type === 'reference' ? 1.0 : 0.8;
    
    // Could enhance this based on link context, frequency, etc.
    // For now, return base strength
    return baseStrength;
  }

  /**
   * Phase 3.8: Create weak connections between nodes sharing tags
   */
  private createTagBasedLinks(node: GraphNode, nodeTags: string[], allNodes: GraphNode[], 
                            links: GraphLink[], linkSet: Set<string>): void {
    if (nodeTags.length === 0) return;

    let connectionsCreated = 0;
    const MAX_CONNECTIONS_PER_NODE = 25; // Limit connections per node for better performance

    for (const otherNode of allNodes) {
      if (otherNode.id === node.id) continue;
      if (connectionsCreated >= MAX_CONNECTIONS_PER_NODE) break;
      
      const otherFile = this.vault.getAbstractFileByPath(otherNode.path) as TFile;
      if (!otherFile) continue;
      
      const otherMetadata = this.metadataCache.getFileCache(otherFile);
      if (!otherMetadata?.tags) continue;
      
      const otherTags = otherMetadata.tags.map(tag => tag.tag);
      const sharedTags = nodeTags.filter(tag => otherTags.includes(tag));
      
      if (sharedTags.length > 0) {
        const linkId = this.generateLinkId(node.path, otherNode.path);
        
        if (!linkSet.has(linkId)) {
          linkSet.add(linkId);
          links.push({
            source: node.path,
            target: otherNode.path,
            type: 'tag',
            strength: Math.min(0.3 * sharedTags.length, 0.6) // Weak connection, max 0.6
          });
          
          connectionsCreated++;
          
          logger.debug('tag-link', `Tag-based link created`, {
            from: node.path,
            to: otherNode.path,
            sharedTags,
            strength: Math.min(0.3 * sharedTags.length, 0.6)
          });
        }
      }
    }
  }

  /**
   * Phase 3.8: Create hierarchy connections based on folder relationships
   */
  private createFolderHierarchyLinks(node: GraphNode, allNodes: GraphNode[], 
                                   links: GraphLink[], linkSet: Set<string>): void {
    const nodeFolderPath = node.path.substring(0, node.path.lastIndexOf('/'));
    if (!nodeFolderPath) return; // Root level file
    
    // Find other files in the same folder
    const siblingNodes = allNodes.filter(other => {
      if (other.id === node.id) return false;
      const otherFolderPath = other.path.substring(0, other.path.lastIndexOf('/'));
      return otherFolderPath === nodeFolderPath;
    });
    
    // Limit connections to prevent excessive sibling links
    const limitedSiblings = siblingNodes.slice(0, 10);
    
    // Create weak links between siblings (files in same folder)
    for (const sibling of limitedSiblings) {
      const linkId = this.generateLinkId(node.path, sibling.path);
      
      if (!linkSet.has(linkId)) {
        linkSet.add(linkId);
        links.push({
          source: node.path,
          target: sibling.path,
          type: 'reference',
          strength: 0.2 // Very weak connection for folder siblings
        });
        
        logger.debug('folder-link', `Folder hierarchy link created`, {
          from: node.path,
          to: sibling.path,
          folder: nodeFolderPath,
          strength: 0.2
        });
      }
    }
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
   * Filter out orphan nodes (nodes with few or no connections)
   */
  private filterOrphans(nodes: GraphNode[], links: GraphLink[]): GraphNode[] {
    // Count connections for each node
    const connectionCounts = new Map<string, number>();
    
    // Initialize all nodes with 0 connections
    for (const node of nodes) {
      connectionCounts.set(node.id, 0);
    }
    
    // Count connections from links
    for (const link of links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
    }
    
    // Filter nodes: keep nodes with 1 or more connections (orphans = 0 connections)
    const ORPHAN_THRESHOLD = 1;
    const filteredNodes = nodes.filter(node => {
      const connections = connectionCounts.get(node.id) || 0;
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
} 