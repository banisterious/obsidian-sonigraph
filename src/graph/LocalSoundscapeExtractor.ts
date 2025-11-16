/**
 * LocalSoundscapeExtractor
 *
 * Extracts graph data for Local Soundscape feature using depth-based BFS traversal.
 * Collects nodes at each depth level from a center note, tracking incoming/outgoing links.
 */

import { App, TFile } from 'obsidian';
import { getLogger } from '../logging';

const logger = getLogger('LocalSoundscapeExtractor');

export interface LocalSoundscapeNode {
	id: string;
	path: string;
	basename: string;
	depth: number;
	direction: 'center' | 'incoming' | 'outgoing' | 'bidirectional';
	wordCount: number;
	created: number;
	modified: number;
	x?: number;  // Will be set by layout algorithm
	y?: number;  // Will be set by layout algorithm
	cluster?: string;  // Cluster ID this node belongs to
	linkCount?: number;  // Number of links (for community detection)

	// Extended properties for configurable musical mapping
	charCount?: number;  // Character count of note content
	headings?: {
		count: number;
		levels: number[];  // Heading levels (1-6)
		text: string[];    // Heading text content
	};
	links?: {
		incoming: Array<{path: string; text: string}>;
		outgoing: Array<{path: string; text: string}>;
	};
	tags?: string[];  // All tags (from body and frontmatter)
	frontmatter?: Record<string, unknown>;  // Frontmatter properties
}

export interface LocalSoundscapeLink {
	id: string;
	source: string;
	target: string;
	direction: 'incoming' | 'outgoing' | 'bidirectional';
}

export interface LocalSoundscapeCluster {
	id: string;
	label: string;
	nodes: string[];  // Node IDs in this cluster
	color: string;    // Color for visualization
}

export interface LocalSoundscapeData {
	centerNode: LocalSoundscapeNode;
	nodesByDepth: Map<number, LocalSoundscapeNode[]>;
	allNodes: LocalSoundscapeNode[];
	links: LocalSoundscapeLink[];
	clusters?: LocalSoundscapeCluster[];  // Optional cluster data
	stats: {
		totalNodes: number;
		totalLinks: number;
		maxDepth: number;
		incomingCount: number;
		outgoingCount: number;
		bidirectionalCount: number;
	};
}

export interface LocalSoundscapeFilters {
	includeTags?: string[];
	excludeTags?: string[];
	includeFolders?: string[];
	excludeFolders?: string[];
	includeFileTypes?: string[];
	linkDirections?: ('incoming' | 'outgoing' | 'bidirectional')[];
}

export type ClusteringMethod = 'none' | 'folder' | 'tag' | 'depth' | 'community';

export class LocalSoundscapeExtractor {
	private app: App;
	private filters: LocalSoundscapeFilters;
	private clusteringMethod: ClusteringMethod = 'none';
	private enableRichMetadata: boolean = false;  // Enable extended property extraction

	constructor(app: App) {
		this.app = app;
		this.filters = {};
	}

	/**
	 * Enable or disable rich metadata extraction
	 * When enabled, extracts charCount, headings, detailed links, tags, and frontmatter
	 * When disabled, uses fast approximation (default)
	 */
	setRichMetadataExtraction(enabled: boolean): void {
		this.enableRichMetadata = enabled;
		logger.info('rich-metadata-config', 'Rich metadata extraction configured', { enabled });
	}

	/**
	 * Set filters for extraction
	 */
	setFilters(filters: LocalSoundscapeFilters): void {
		this.filters = filters;
		void logger.info('filters-set', 'Filters configured', filters);
	}

	/**
	 * Set clustering method
	 */
	setClusteringMethod(method: ClusteringMethod): void {
		this.clusteringMethod = method;
		logger.info('clustering-method-set', 'Clustering method configured', { method });
	}

	/**
	 * Extract graph data centered on a specific file
	 */
	async extractFromCenter(centerFile: TFile, maxDepth: number): Promise<LocalSoundscapeData> {
		const startTime = performance.now();

		logger.info('extract-start', 'Extracting local soundscape', {
			center: centerFile.path,
			maxDepth
		});

		// Initialize data structures
		const nodesByDepth = new Map<number, LocalSoundscapeNode[]>();
		const allNodes: LocalSoundscapeNode[] = [];
		const links: LocalSoundscapeLink[] = [];
		const visitedNodes = new Set<string>();
		const nodeDirections = new Map<string, 'incoming' | 'outgoing' | 'bidirectional'>();

		// Create center node
		const centerNode = await this.createNode(centerFile, 0, 'center');
		void allNodes.push(centerNode);
		void visitedNodes.add(centerFile.path);
		nodesByDepth.set(0, [centerNode]);

		// BFS traversal
		const queue: Array<{ file: TFile; depth: number; pathFromCenter: string[] }> = [];
		queue.push({ file: centerFile, depth: 0, pathFromCenter: [centerFile.path] });

		// Track link directions from center
		const centerCache = this.app.metadataCache.getFileCache(centerFile);
		const centerOutgoingPaths = new Set<string>();
		const centerIncomingPaths = new Set<string>();

		// Get outgoing links from center
		if (centerCache?.links) {
			for (const link of centerCache.links) {
				const linkedFile = this.app.metadataCache.getFirstLinkpathDest(link.link, centerFile.path);
				if (linkedFile) {
					void centerOutgoingPaths.add(linkedFile.path);
				}
			}
		}

		// Get incoming links to center (backlinks)
		const backlinks = this.app.metadataCache.getBacklinksForFile(centerFile);
		if (backlinks) {
			for (const backlinkPath of backlinks.keys()) {
				void centerIncomingPaths.add(backlinkPath);
			}
		}

		// Process queue (BFS)
		while (queue.length > 0) {
			const { file, depth, pathFromCenter } = queue.shift();

			if (depth >= maxDepth) continue;

			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache) continue;

			// Get outgoing links
			const outgoingLinks = cache.links || [];
			for (const link of outgoingLinks) {
				const linkedFile = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path);

				if (!linkedFile || !(linkedFile instanceof TFile)) continue;
				if (pathFromCenter.includes(linkedFile.path)) continue; // Avoid cycles

				if (!visitedNodes.has(linkedFile.path)) {
					// Determine direction relative to center
					let direction: 'incoming' | 'outgoing' | 'bidirectional' = 'outgoing';

					if (depth === 0) {
						// Direct connection to center
						direction = 'outgoing';
					} else {
						// For deeper levels, check relationship to center
						const hasIncoming = centerIncomingPaths.has(linkedFile.path);
						const hasOutgoing = centerOutgoingPaths.has(linkedFile.path);

						if (hasIncoming && hasOutgoing) {
							direction = 'bidirectional';
						} else if (hasIncoming) {
							direction = 'incoming';
						} else {
							direction = 'outgoing';
						}
					}

					// Check if node passes filters
					if (!this.shouldIncludeNode(linkedFile, direction)) {
						visitedNodes.add(linkedFile.path); // Mark as visited but don't include
						continue;
					}

					void visitedNodes.add(linkedFile.path);
					void nodeDirections.set(linkedFile.path, direction);

					// Create node
					const node = await this.createNode(linkedFile, depth + 1, direction);
					void allNodes.push(node);

					if (!nodesByDepth.has(depth + 1)) {
						nodesByDepth.set(depth + 1, []);
					}
					const depthNodes = nodesByDepth.get(depth + 1); if (depthNodes) depthNodes.push(node);

					// Add to queue for further traversal
					queue.push({
						file: linkedFile,
						depth: depth + 1,
						pathFromCenter: [...pathFromCenter, linkedFile.path]
					});
				}

				// Create link
				const linkId = `${file.path}->${linkedFile.path}`;
				if (!links.find(l => l.id === linkId)) {
					links.push({
						id: linkId,
						source: file.path,
						target: linkedFile.path,
						direction: nodeDirections.get(linkedFile.path) || 'outgoing'
					});
				}
			}

			// Get incoming links (backlinks)
			const backlinksForFile = this.app.metadataCache.getBacklinksForFile(file);
			if (backlinksForFile) {
				for (const backlinkPath of backlinksForFile.keys()) {
					const backlinkFile = this.app.vault.getAbstractFileByPath(backlinkPath);

					if (!backlinkFile || !(backlinkFile instanceof TFile)) continue;
					if (pathFromCenter.includes(backlinkPath)) continue; // Avoid cycles

					if (!visitedNodes.has(backlinkPath)) {
						// Determine direction relative to center
						let direction: 'incoming' | 'outgoing' | 'bidirectional' = 'incoming';

						if (depth === 0) {
							// Direct backlink to center
							direction = 'incoming';
						} else {
							// For deeper levels, check relationship to center
							const hasIncoming = centerIncomingPaths.has(backlinkPath);
							const hasOutgoing = centerOutgoingPaths.has(backlinkPath);

							if (hasIncoming && hasOutgoing) {
								direction = 'bidirectional';
							} else if (hasOutgoing) {
								direction = 'outgoing';
							} else {
								direction = 'incoming';
							}
						}

						// Check if node passes filters
						if (!this.shouldIncludeNode(backlinkFile, direction)) {
							visitedNodes.add(backlinkPath); // Mark as visited but don't include
							continue;
						}

						void visitedNodes.add(backlinkPath);
						void nodeDirections.set(backlinkPath, direction);

						// Create node
						const node = await this.createNode(backlinkFile, depth + 1, direction);
						void allNodes.push(node);

						if (!nodesByDepth.has(depth + 1)) {
							nodesByDepth.set(depth + 1, []);
						}
						const depthNodes = nodesByDepth.get(depth + 1); if (depthNodes) depthNodes.push(node);

						// Add to queue for further traversal
						queue.push({
							file: backlinkFile,
							depth: depth + 1,
							pathFromCenter: [...pathFromCenter, backlinkPath]
						});
					}

					// Create link
					const linkId = `${backlinkPath}->${file.path}`;
					if (!links.find(l => l.id === linkId)) {
						links.push({
							id: linkId,
							source: backlinkPath,
							target: file.path,
							direction: nodeDirections.get(backlinkPath) || 'incoming'
						});
					}
				}
			}
		}

		// Add link counts to nodes for community detection
		allNodes.forEach(node => {
			node.linkCount = links.filter(l => l.source === node.id || l.target === node.id).length;
		});

		// Apply clustering if enabled
		const clusters = this.clusteringMethod !== 'none'
			? this.computeClusters(allNodes, links, this.clusteringMethod)
			: undefined;

		// Calculate stats
		const incomingCount = allNodes.filter(n => n.direction === 'incoming').length;
		const outgoingCount = allNodes.filter(n => n.direction === 'outgoing').length;
		const bidirectionalCount = allNodes.filter(n => n.direction === 'bidirectional').length;

		const extractTime = performance.now() - startTime;

		const result: LocalSoundscapeData = {
			centerNode,
			nodesByDepth,
			allNodes,
			links,
			clusters,
			stats: {
				totalNodes: allNodes.length,
				totalLinks: links.length,
				maxDepth,
				incomingCount,
				outgoingCount,
				bidirectionalCount
			}
		};

		logger.info('extract-complete', 'Local soundscape extraction complete', {
			totalNodes: result.stats.totalNodes,
			totalLinks: result.stats.totalLinks,
			incomingCount,
			outgoingCount,
			bidirectionalCount,
			extractTime: extractTime.toFixed(2) + 'ms'
		});

		return result;
	}

	/**
	 * Create a node from a file
	 * Note: Word count is approximated from file size by default to avoid slow file reads
	 * When rich metadata is enabled, reads file content to extract extended properties
	 */
	private async createNode(
		file: TFile,
		depth: number,
		direction: 'center' | 'incoming' | 'outgoing' | 'bidirectional'
	): Promise<LocalSoundscapeNode> {
		// Base node with fast approximation
		const node: LocalSoundscapeNode = {
			id: file.path,
			path: file.path,
			basename: file.basename,
			depth,
			direction,
			wordCount: Math.floor(file.stat.size / 5),  // Fast approximation (avg ~5 bytes per word)
			created: file.stat.ctime,
			modified: file.stat.mtime
		};

		// If rich metadata extraction is disabled, return fast version
		if (!this.enableRichMetadata) {
			return node;
		}

		// Rich metadata extraction - read file content
		try {
			const content = await this.app.vault.read(file);
			const cache = this.app.metadataCache.getFileCache(file);

			// Accurate character count
			node.charCount = content.length;

			// Accurate word count (override approximation)
			node.wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

			// Extract headings
			if (cache?.headings && cache.headings.length > 0) {
				node.headings = {
					count: cache.headings.length,
					levels: cache.headings.map(h => h.level),
					text: cache.headings.map(h => h.heading)
				};
			}

			// Extract detailed link information
			const incomingLinks: Array<{path: string; text: string}> = [];
			const outgoingLinks: Array<{path: string; text: string}> = [];

			// Outgoing links
			if (cache?.links) {
				for (const link of cache.links) {
					const linkedFile = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path);
					if (linkedFile) {
						outgoingLinks.push({
							path: linkedFile.path,
							text: link.displayText || link.link
						});
					}
				}
			}

			// Incoming links (backlinks)
			const backlinks = this.app.metadataCache.getBacklinksForFile(file);
			if (backlinks) {
				for (const [backlinkPath, backlinkData] of backlinks.entries()) {
					const backlinkFile = this.app.vault.getAbstractFileByPath(backlinkPath);
					if (backlinkFile instanceof TFile) {
						// Get link text from backlink file cache
						const backlinkCache = this.app.metadataCache.getFileCache(backlinkFile);
						let linkText = file.basename;  // Default to basename

						if (backlinkCache?.links) {
							const linkToThisFile = backlinkCache.links.find(l => {
								const dest = this.app.metadataCache.getFirstLinkpathDest(l.link, backlinkPath);
								return dest?.path === file.path;
							});
							if (linkToThisFile) {
								linkText = linkToThisFile.displayText || linkToThisFile.link;
							}
						}

						incomingLinks.push({
							path: backlinkPath,
							text: linkText
						});
					}
				}
			}

			if (incomingLinks.length > 0 || outgoingLinks.length > 0) {
				node.links = { incoming: incomingLinks, outgoing: outgoingLinks };
			}

			// Extract all tags (from body and frontmatter)
			const allTags = new Set<string>();
			if (cache?.tags) {
				cache.tags.forEach(tagCache => {
					const tag = tagCache.tag.startsWith('#') ? tagCache.tag.slice(1) : tagCache.tag;
					void allTags.add(tag);
				});
			}
			if (cache?.frontmatter?.tags) {
				const fmTags = cache.frontmatter.tags;
				if (Array.isArray(fmTags)) {
					fmTags.forEach(tag => allTags.add(tag));
				} else if (typeof fmTags === 'string') {
					void allTags.add(fmTags);
				}
			}
			if (allTags.size > 0) {
				node.tags = Array.from(allTags);
			}

			// Extract frontmatter
			if (cache?.frontmatter && Object.keys(cache.frontmatter).length > 0) {
				// Clone frontmatter to avoid reference issues
				node.frontmatter = { ...cache.frontmatter };
			}

		} catch (error) {
			logger.warn('rich-metadata-extraction-failed', 'Failed to extract rich metadata', {
				file: file.path,
				error: (error as Error).message
			});
			// Return base node with fast approximation if extraction fails
		}

		return node;
	}

	/**
	 * Check if a node should be included based on filters
	 */
	private shouldIncludeNode(
		file: TFile,
		direction: 'center' | 'incoming' | 'outgoing' | 'bidirectional'
	): boolean {
		const cache = this.app.metadataCache.getFileCache(file);

		// Link direction filter
		if (this.filters.linkDirections && this.filters.linkDirections.length > 0) {
			// Center node is always included
			if (direction !== 'center' && !this.filters.linkDirections.includes(direction)) {
				logger.debug('filter-direction', 'Node filtered by direction', {
					file: file.path,
					direction,
					allowed: this.filters.linkDirections
				});
				return false;
			}
		}

		// File type filter
		if (this.filters.includeFileTypes && this.filters.includeFileTypes.length > 0) {
			const fileType = this.getFileType(file);
			if (!this.filters.includeFileTypes.includes(fileType)) {
				logger.debug('filter-filetype', 'Node filtered by file type', {
					file: file.path,
					type: fileType,
					allowed: this.filters.includeFileTypes
				});
				return false;
			}
		}

		// Folder filters
		if (this.filters.excludeFolders && this.filters.excludeFolders.length > 0) {
			for (const excludeFolder of this.filters.excludeFolders) {
				if (file.path.startsWith(excludeFolder + '/') || file.path === excludeFolder) {
					logger.debug('filter-folder-exclude', 'Node filtered by excluded folder', {
						file: file.path,
						excludeFolder
					});
					return false;
				}
			}
		}

		if (this.filters.includeFolders && this.filters.includeFolders.length > 0) {
			let included = false;
			for (const includeFolder of this.filters.includeFolders) {
				if (file.path.startsWith(includeFolder + '/') || file.path === includeFolder) {
					included = true;
					break;
				}
			}
			if (!included) {
				logger.debug('filter-folder-include', 'Node filtered by included folders', {
					file: file.path,
					includeFolders: this.filters.includeFolders
				});
				return false;
			}
		}

		// Tag filters
		const fileTags = new Set<string>();
		if (cache?.tags) {
			cache.tags.forEach(tagCache => {
				const tag = tagCache.tag.startsWith('#') ? tagCache.tag.slice(1) : tagCache.tag;
				void fileTags.add(tag);
			});
		}
		if (cache?.frontmatter?.tags) {
			const fmTags = cache.frontmatter.tags;
			if (Array.isArray(fmTags)) {
				fmTags.forEach(tag => fileTags.add(tag));
			} else if (typeof fmTags === 'string') {
				void fileTags.add(fmTags);
			}
		}

		// Exclude tags
		if (this.filters.excludeTags && this.filters.excludeTags.length > 0) {
			for (const excludeTag of this.filters.excludeTags) {
				if (fileTags.has(excludeTag)) {
					logger.debug('filter-tag-exclude', 'Node filtered by excluded tag', {
						file: file.path,
						tag: excludeTag
					});
					return false;
				}
			}
		}

		// Include tags
		if (this.filters.includeTags && this.filters.includeTags.length > 0) {
			let hasIncludedTag = false;
			for (const includeTag of this.filters.includeTags) {
				if (fileTags.has(includeTag)) {
					hasIncludedTag = true;
					break;
				}
			}
			if (!hasIncludedTag) {
				logger.debug('filter-tag-include', 'Node filtered by included tags', {
					file: file.path,
					includeTags: this.filters.includeTags
				});
				return false;
			}
		}

		return true;
	}

	/**
	 * Get file type based on extension
	 */
	private getFileType(file: TFile): string {
		const ext = file.extension.toLowerCase();
		if (ext === 'md') return 'md';
		if (ext === 'pdf') return 'pdf';
		if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
		if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
		if (['mp4', 'webm', 'ogv', 'mov', 'avi'].includes(ext)) return 'video';
		return 'other';
	}

	/**
	 * Compute clusters based on the specified method
	 */
	private computeClusters(
		nodes: LocalSoundscapeNode[],
		links: LocalSoundscapeLink[],
		method: ClusteringMethod
	): LocalSoundscapeCluster[] {
		logger.info('compute-clusters', 'Computing clusters', { method, nodeCount: nodes.length });

		switch (method) {
			case 'folder':
				return this.clusterByFolder(nodes);
			case 'tag':
				return this.clusterByTag(nodes);
			case 'depth':
				return this.clusterByDepth(nodes);
			case 'community':
				return this.clusterByCommunity(nodes, links);
			default:
				return [];
		}
	}

	/**
	 * Cluster nodes by folder
	 */
	private clusterByFolder(nodes: LocalSoundscapeNode[]): LocalSoundscapeCluster[] {
		const clusterMap = new Map<string, string[]>();

		nodes.forEach(node => {
			const folder = node.path.substring(0, node.path.lastIndexOf('/')) || '/';
			if (!clusterMap.has(folder)) {
				clusterMap.set(folder, []);
			}
			const folderCluster = clusterMap.get(folder); if (folderCluster) folderCluster.push(node.id);
			node.cluster = folder;
		});

		const colors = this.generateClusterColors(clusterMap.size);
		const clusters: LocalSoundscapeCluster[] = [];
		let colorIndex = 0;

		clusterMap.forEach((nodeIds, folder) => {
			clusters.push({
				id: folder,
				label: folder === '/' ? 'Root' : folder.split('/').pop() || folder,
				nodes: nodeIds,
				color: colors[colorIndex++ % colors.length]
			});
		});

		logger.info('folder-clustering', `Created ${clusters.length} folder-based clusters`);
		return clusters;
	}

	/**
	 * Cluster nodes by primary tag
	 */
	private clusterByTag(nodes: LocalSoundscapeNode[]): LocalSoundscapeCluster[] {
		const clusterMap = new Map<string, string[]>();

		nodes.forEach(node => {
			const file = this.app.vault.getAbstractFileByPath(node.path);
			if (!(file instanceof TFile)) return;

			const cache = this.app.metadataCache.getFileCache(file);
			let primaryTag = 'untagged';

			// Get first tag from document or frontmatter
			if (cache?.tags && cache.tags.length > 0) {
				primaryTag = cache.tags[0].tag.startsWith('#')
					? cache.tags[0].tag.slice(1)
					: cache.tags[0].tag;
			} else if (cache?.frontmatter?.tags) {
				const fmTags = cache.frontmatter.tags;
				if (Array.isArray(fmTags) && fmTags.length > 0) {
					primaryTag = fmTags[0];
				} else if (typeof fmTags === 'string') {
					primaryTag = fmTags;
				}
			}

			if (!clusterMap.has(primaryTag)) {
				clusterMap.set(primaryTag, []);
			}
			const tagCluster = clusterMap.get(primaryTag); if (tagCluster) tagCluster.push(node.id);
			node.cluster = primaryTag;
		});

		const colors = this.generateClusterColors(clusterMap.size);
		const clusters: LocalSoundscapeCluster[] = [];
		let colorIndex = 0;

		clusterMap.forEach((nodeIds, tag) => {
			clusters.push({
				id: tag,
				label: tag,
				nodes: nodeIds,
				color: colors[colorIndex++ % colors.length]
			});
		});

		logger.info('tag-clustering', `Created ${clusters.length} tag-based clusters`);
		return clusters;
	}

	/**
	 * Cluster nodes by depth level
	 */
	private clusterByDepth(nodes: LocalSoundscapeNode[]): LocalSoundscapeCluster[] {
		const clusterMap = new Map<number, string[]>();

		nodes.forEach(node => {
			if (!clusterMap.has(node.depth)) {
				clusterMap.set(node.depth, []);
			}
			const depthCluster = clusterMap.get(node.depth); if (depthCluster) depthCluster.push(node.id);
			node.cluster = `depth-${node.depth}`;
		});

		const colors = this.generateClusterColors(clusterMap.size);
		const clusters: LocalSoundscapeCluster[] = [];
		let colorIndex = 0;

		clusterMap.forEach((nodeIds, depth) => {
			clusters.push({
				id: `depth-${depth}`,
				label: depth === 0 ? 'Center' : `Depth ${depth}`,
				nodes: nodeIds,
				color: colors[colorIndex++ % colors.length]
			});
		});

		logger.info('depth-clustering', `Created ${clusters.length} depth-based clusters`);
		return clusters;
	}

	/**
	 * Cluster nodes by community detection (simplified Louvain-like algorithm)
	 */
	private clusterByCommunity(nodes: LocalSoundscapeNode[], links: LocalSoundscapeLink[]): LocalSoundscapeCluster[] {
		// Build adjacency map
		const adjacency = new Map<string, Set<string>>();
		nodes.forEach(node => adjacency.set(node.id, new Set()));

		links.forEach(link => {
			adjacency.get(link.source)?.add(link.target);
			adjacency.get(link.target)?.add(link.source);
		});

		// Simple greedy clustering based on link density
		const nodeClusters = new Map<string, number>();
		let nextClusterId = 0;

		nodes.forEach(node => {
			if (nodeClusters.has(node.id)) return;

			// Start new cluster
			const clusterId = nextClusterId++;
			const queue = [node.id];
			void nodeClusters.set(node.id, clusterId);

			// BFS to find tightly connected nodes
			while (queue.length > 0 && nodeClusters.size < nodes.length) {
				const current = queue.shift();
				const neighbors = adjacency.get(current) || new Set();

				neighbors.forEach(neighbor => {
					if (!nodeClusters.has(neighbor)) {
						// Check if neighbor is well-connected to this cluster
						const neighborConnections = adjacency.get(neighbor) || new Set();
						const clusterNodes = Array.from(nodeClusters.entries())
							.filter(([, cid]) => cid === clusterId)
							.map(([nid]) => nid);

						const connectionsToCluster = clusterNodes.filter(cn => neighborConnections.has(cn)).length;

						// If more than 30% of connections are to this cluster, add to cluster
						if (connectionsToCluster / neighborConnections.size > 0.3) {
							void nodeClusters.set(neighbor, clusterId);
							void queue.push(neighbor);
						}
					}
				});
			}
		});

		// Build cluster objects
		const clusterMap = new Map<number, string[]>();
		nodeClusters.forEach((clusterId, nodeId) => {
			if (!clusterMap.has(clusterId)) {
				clusterMap.set(clusterId, []);
			}
			const communityCluster = clusterMap.get(clusterId); if (communityCluster) communityCluster.push(nodeId);
			const node = nodes.find(n => n.id === nodeId);
			if (node) node.cluster = `community-${clusterId}`;
		});

		const colors = this.generateClusterColors(clusterMap.size);
		const clusters: LocalSoundscapeCluster[] = [];
		let colorIndex = 0;

		clusterMap.forEach((nodeIds, clusterId) => {
			clusters.push({
				id: `community-${clusterId}`,
				label: `Community ${clusterId + 1}`,
				nodes: nodeIds,
				color: colors[colorIndex++ % colors.length]
			});
		});

		logger.info('community-clustering', `Created ${clusters.length} community-based clusters`);
		return clusters;
	}

	/**
	 * Generate visually distinct colors for clusters
	 */
	private generateClusterColors(count: number): string[] {
		const colors: string[] = [];
		const hueStep = 360 / Math.max(count, 1);

		for (let i = 0; i < count; i++) {
			const hue = Math.floor(i * hueStep);
			const saturation = 65 + (i % 3) * 10; // Vary saturation slightly
			const lightness = 55 + (i % 2) * 5;   // Vary lightness slightly
			colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
		}

		return colors;
	}

	/**
	 * Get nodes at a specific depth
	 */
	getNodesAtDepth(data: LocalSoundscapeData, depth: number): LocalSoundscapeNode[] {
		return data.nodesByDepth.get(depth) || [];
	}

	/**
	 * Get links connected to a specific node
	 */
	getLinksForNode(data: LocalSoundscapeData, nodeId: string): LocalSoundscapeLink[] {
		return data.links.filter(link =>
			link.source === nodeId || link.target === nodeId
		);
	}
}
