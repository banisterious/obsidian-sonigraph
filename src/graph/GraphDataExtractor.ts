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
}

export interface GraphLink {
  source: string;
  target: string;
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

  constructor(vault: Vault, metadataCache: MetadataCache) {
    this.vault = vault;
    this.metadataCache = metadataCache;
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

    logger.info('extraction', 'Starting graph data extraction');
    const startTime = logger.time('graphExtraction');

    try {
      const nodes = await this.extractNodes();
      const links = this.extractLinks(nodes);
      const timeRange = this.calculateTimeRange(nodes);

      this.cachedData = {
        nodes,
        links,
        timeRange
      };
      
      this.lastCacheTime = now;
      
      endTimer();
      logger.info('extraction', `Graph extraction completed: ${nodes.length} nodes, ${links.length} links`, {
        nodeCount: nodes.length,
        linkCount: links.length,
        timeSpan: timeRange.end.getTime() - timeRange.start.getTime()
      });

      return this.cachedData;
    } catch (error) {
      endTimer();
      logger.error('extraction', 'Failed to extract graph data', error as Error);
      throw error;
    }

    const endTimer = startTime;
  }

  /**
   * Extract all files as nodes
   */
  private async extractNodes(): Promise<GraphNode[]> {
    const files = this.vault.getFiles();
    const nodes: GraphNode[] = [];

    for (const file of files) {
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
   */
  private extractLinks(nodes: GraphNode[]): GraphLink[] {
    const links: GraphLink[] = [];
    const nodeMap = new Map(nodes.map(node => [node.path, node]));

    for (const node of nodes) {
      if (node.type === 'note') {
        const file = this.vault.getAbstractFileByPath(node.path) as TFile;
        if (file) {
          const metadata = this.metadataCache.getFileCache(file);
          
          // Process outgoing links
          if (metadata?.links) {
            for (const link of metadata.links) {
              const targetPath = this.vault.adapter.path.normalize(
                this.vault.adapter.path.join(
                  this.vault.adapter.path.dirname(file.path),
                  link.link
                )
              );
              
              const targetFile = this.vault.getAbstractFileByPath(targetPath + '.md') as TFile;
              if (targetFile && nodeMap.has(targetFile.path)) {
                links.push({
                  source: node.id,
                  target: targetFile.path,
                  type: 'reference',
                  strength: 1.0
                });
              }
            }
          }

          // Process embeds
          if (metadata?.embeds) {
            for (const embed of metadata.embeds) {
              const targetFile = this.vault.getAbstractFileByPath(embed.link) as TFile;
              if (targetFile && nodeMap.has(targetFile.path)) {
                links.push({
                  source: node.id,
                  target: targetFile.path,
                  type: 'attachment',
                  strength: 0.8
                });
              }
            }
          }
        }
      }
    }

    logger.debug('extraction', `Extracted ${links.length} links`);
    return links;
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
   * Clear cached data
   */
  clearCache(): void {
    this.cachedData = null;
    this.lastCacheTime = 0;
    logger.debug('extraction', 'Graph data cache cleared');
  }
} 