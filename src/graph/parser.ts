import { TFile, Vault, MetadataCache, CachedMetadata } from 'obsidian';
import { GraphData, GraphNode } from './types';
import { getLogger } from '../logging';

const logger = getLogger('graph-parser');

export class GraphParser {
	private vault: Vault;
	private metadataCache: MetadataCache;

	constructor(vault: Vault, metadataCache: MetadataCache) {
		this.vault = vault;
		this.metadataCache = metadataCache;
	}

	async parseVault(): Promise<GraphData> {
		const startTime = logger.time('vault-parsing');
		
		logger.info('parsing', 'Starting vault parsing', {
			totalFiles: this.vault.getMarkdownFiles().length
		});

		const nodes = new Map<string, GraphNode>();
		const edges: Array<{ from: string; to: string }> = [];
		
		// Get all markdown files
		const markdownFiles = this.vault.getMarkdownFiles();
		
		// First pass: Create all nodes
		for (const file of markdownFiles) {
			const node = await this.createNodeFromFile(file);
			if (node) {
				nodes.set(file.path, node);
			}
		}

		logger.debug('parsing', 'Created nodes', { nodeCount: nodes.size });

		// Second pass: Process connections and create edges
		for (const file of markdownFiles) {
			const connections = await this.extractConnectionsFromFile(file);
			const sourceNode = nodes.get(file.path);
			
			if (sourceNode && connections.length > 0) {
				// Update source node with connection count
				sourceNode.connections = connections;
				sourceNode.connectionCount = connections.length;

				// Create edges for each connection
				for (const targetPath of connections) {
					// Try to find the target file
					const targetFile = this.findFileByPath(targetPath, markdownFiles);
					if (targetFile && nodes.has(targetFile.path)) {
						edges.push({
							from: file.path,
							to: targetFile.path
						});
					}
				}
			}
		}

		startTime(); // Log completion time

		logger.info('parsing', 'Vault parsing complete', {
			nodeCount: nodes.size,
			edgeCount: edges.length,
			avgConnectionsPerNode: edges.length / nodes.size
		});

		return {
			nodes,
			edges
		};
	}

	private async createNodeFromFile(file: TFile): Promise<GraphNode | null> {
		try {
			const fileContent = await this.vault.read(file);
			const metadata = this.metadataCache.getFileCache(file);

			return {
				id: file.path,
				name: file.basename,
				path: file.path,
				connections: [], // Will be populated in second pass
				connectionCount: 0, // Will be calculated in second pass
				wordCount: this.countWords(fileContent),
				tags: this.extractTags(metadata),
				headings: this.extractHeadings(metadata),
				created: file.stat.ctime,
				modified: file.stat.mtime
			};
		} catch (error) {
			logger.error('file-parsing', `Failed to create node for file: ${file.path}`, error);
			return null;
		}
	}

	private async extractConnectionsFromFile(file: TFile): Promise<string[]> {
		try {
			const fileContent = await this.vault.read(file);
			const metadata = this.metadataCache.getFileCache(file);
			
			const connections: string[] = [];

			// Extract wikilinks from content
			const wikiLinks = this.extractLinksFromContent(fileContent);
			connections.push(...wikiLinks);

			// Extract links from metadata cache (more reliable)
			if (metadata?.links) {
				const metadataLinks = metadata.links.map(link => link.link);
				connections.push(...metadataLinks);
			}

			// Remove duplicates and clean up
			return [...new Set(connections)].filter(link => link.trim().length > 0);

		} catch (error) {
			logger.error('connection-extraction', `Failed to extract connections from: ${file.path}`, error);
			return [];
		}
	}

	private extractLinksFromContent(content: string): string[] {
		// Extract [[note name]] and [[note name|display text]] links
		const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
		const links: string[] = [];
		let match;

		while ((match = linkRegex.exec(content)) !== null) {
			links.push(match[1].trim());
		}

		return links;
	}

	private findFileByPath(linkPath: string, files: TFile[]): TFile | null {
		// First, try exact path match
		let targetFile = files.find(f => f.path === linkPath);
		if (targetFile) return targetFile;

		// Try with .md extension
		targetFile = files.find(f => f.path === `${linkPath}.md`);
		if (targetFile) return targetFile;

		// Try basename match (most common case)
		targetFile = files.find(f => f.basename === linkPath);
		if (targetFile) return targetFile;

		// Try case-insensitive basename match
		const lowerLinkPath = linkPath.toLowerCase();
		targetFile = files.find(f => f.basename.toLowerCase() === lowerLinkPath);
		if (targetFile) return targetFile;

		return null;
	}

	private countWords(content: string): number {
		// Remove markdown syntax and count words
		const cleanContent = content
			.replace(/```[\s\S]*?```/g, '') // Remove code blocks
			.replace(/`[^`]*`/g, '') // Remove inline code
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Replace markdown links with text
			.replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1') // Replace wikilinks with text
			.replace(/[#*_~`]/g, '') // Remove markdown formatting
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();

		return cleanContent ? cleanContent.split(' ').length : 0;
	}

	private extractTags(metadata: CachedMetadata | null): string[] {
		if (!metadata?.tags) return [];
		return metadata.tags.map(tag => tag.tag);
	}

	private extractHeadings(metadata: CachedMetadata | null): string[] {
		if (!metadata?.headings) return [];
		return metadata.headings.map(heading => heading.heading);
	}

	/**
	 * Get graph statistics for musical mapping
	 */
	getGraphStats(graphData: GraphData): {
		totalNodes: number;
		totalEdges: number;
		avgConnections: number;
		maxConnections: number;
		minConnections: number;
		isolatedNodes: number;
		clusters: number;
	} {
		const nodeCount = graphData.nodes.size;
		const edgeCount = graphData.edges.length;
		
		// Calculate connection statistics
		const connectionCounts = Array.from(graphData.nodes.values())
			.map(node => node.connectionCount);
		
		const avgConnections = connectionCounts.length > 0 
			? connectionCounts.reduce((a, b) => a + b, 0) / connectionCounts.length 
			: 0;
		
		const maxConnections = Math.max(...connectionCounts, 0);
		const minConnections = Math.min(...connectionCounts, 0);
		const isolatedNodes = connectionCounts.filter(count => count === 0).length;

		logger.debug('graph-stats', 'Calculated graph statistics', {
			nodeCount,
			edgeCount,
			avgConnections,
			maxConnections,
			minConnections,
			isolatedNodes
		});

		return {
			totalNodes: nodeCount,
			totalEdges: edgeCount,
			avgConnections,
			maxConnections,
			minConnections,
			isolatedNodes,
			clusters: 1 // Simplified for now - could implement cluster detection later
		};
	}
} 