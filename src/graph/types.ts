export interface GraphNode {
	id: string;
	name: string;
	path: string;
	connections: string[];
	connectionCount: number;
	wordCount: number;
	tags: string[];
	headings: string[];
	created: number;
	modified: number;
}

export interface GraphData {
	nodes: Map<string, GraphNode>;
	edges: Array<{ from: string; to: string }>;
}

export interface ParsedVault {
	files: GraphNode[];
	totalConnections: number;
}

export interface MusicalMapping {
	nodeId: string;
	pitch: number;
	duration: number;
	velocity: number;
	timing: number;
	instrument?: string;
}

export interface GraphStats {
	totalNodes: number;
	totalEdges: number;
	avgConnections: number;
	maxConnections: number;
	minConnections: number;
	isolatedNodes: number;
	clusters: number;
} 