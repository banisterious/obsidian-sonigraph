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
}

export interface LocalSoundscapeLink {
	id: string;
	source: string;
	target: string;
	direction: 'incoming' | 'outgoing' | 'bidirectional';
}

export interface LocalSoundscapeData {
	centerNode: LocalSoundscapeNode;
	nodesByDepth: Map<number, LocalSoundscapeNode[]>;
	allNodes: LocalSoundscapeNode[];
	links: LocalSoundscapeLink[];
	stats: {
		totalNodes: number;
		totalLinks: number;
		maxDepth: number;
		incomingCount: number;
		outgoingCount: number;
		bidirectionalCount: number;
	};
}

export class LocalSoundscapeExtractor {
	private app: App;

	constructor(app: App) {
		this.app = app;
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
		allNodes.push(centerNode);
		visitedNodes.add(centerFile.path);
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
					centerOutgoingPaths.add(linkedFile.path);
				}
			}
		}

		// Get incoming links to center (backlinks)
		const backlinks = this.app.metadataCache.getBacklinksForFile(centerFile);
		if (backlinks) {
			for (const backlinkPath of backlinks.keys()) {
				centerIncomingPaths.add(backlinkPath);
			}
		}

		// Process queue (BFS)
		while (queue.length > 0) {
			const { file, depth, pathFromCenter } = queue.shift()!;

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
					visitedNodes.add(linkedFile.path);

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

					nodeDirections.set(linkedFile.path, direction);

					// Create node
					const node = await this.createNode(linkedFile, depth + 1, direction);
					allNodes.push(node);

					if (!nodesByDepth.has(depth + 1)) {
						nodesByDepth.set(depth + 1, []);
					}
					nodesByDepth.get(depth + 1)!.push(node);

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
						visitedNodes.add(backlinkPath);

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

						nodeDirections.set(backlinkPath, direction);

						// Create node
						const node = await this.createNode(backlinkFile, depth + 1, direction);
						allNodes.push(node);

						if (!nodesByDepth.has(depth + 1)) {
							nodesByDepth.set(depth + 1, []);
						}
						nodesByDepth.get(depth + 1)!.push(node);

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
	 */
	private async createNode(
		file: TFile,
		depth: number,
		direction: 'center' | 'incoming' | 'outgoing' | 'bidirectional'
	): Promise<LocalSoundscapeNode> {
		// Get word count (approximate)
		const content = await this.app.vault.cachedRead(file);
		const wordCount = content.split(/\s+/).length;

		return {
			id: file.path,
			path: file.path,
			basename: file.basename,
			depth,
			direction,
			wordCount,
			created: file.stat.ctime,
			modified: file.stat.mtime
		};
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
