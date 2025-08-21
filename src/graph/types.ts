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
	hasBeenTriggered?: boolean;
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

// Enhanced GraphNode interface for Phase 1 audio enhancement
export interface EnhancedGraphNode extends GraphNode {
	metadata: {
		tags: string[];
		frontmatter: Record<string, any>;
		wordCount?: number;
		headingCount?: number;
	};
	connectionDetails: {
		wikilinks: string[];
		markdownLinks: string[];
		embeds: string[];
		tagConnections: string[];
		totalCount: number;
	};
	clusterInfo?: {
		clusterId: string;
		clusterType: 'tag-based' | 'temporal' | 'link-dense' | 'community';
		clusterStrength: number;
	};
	hubCentrality?: number;
	folderDepth: number;
	pathComponents: string[];
}

// Musical context for audio mapping decisions
export interface MusicalContext {
	totalNodes: number;
	maxNodes: number;
	currentAnimationProgress: number; // 0-1
	vaultActivityLevel: number; // Recent event frequency
	timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
	seasonalContext?: 'spring' | 'summer' | 'autumn' | 'winter';
}

// Audio mapping configuration interfaces
export interface InstrumentMapping {
	instrument: string;
	priority: number;
	conditions?: {
		minConnections?: number;
		maxConnections?: number;
		requiredTags?: string[];
		excludedTags?: string[];
	};
}

export interface AudioMappingConfig {
	contentAwareMapping: {
		enabled: boolean;
		fileTypePreferences: Record<string, string[]>;
		tagMappings: Record<string, InstrumentMapping>;
		folderMappings: Record<string, InstrumentMapping>;
		connectionTypeMappings: Record<string, InstrumentMapping>;
		frontmatterPropertyName?: string;
		moodPropertyName?: string;
		distributionStrategy?: string;
	};
	continuousLayers: {
		enabled: boolean;
		genre?: string;
		intensity?: number;
		evolutionRate?: number;
		adaptiveIntensity?: boolean;
		rhythmicEnabled?: boolean;
		harmonicEnabled?: boolean;
		scale?: string;
		key?: string;
		ambientDrone: any; // Will be defined when implementing layers
		rhythmicLayer: any;
		harmonicPad: any;
	};
	musicalTheory: {
		scale: string; // Will be enhanced with MusicalScale type later
		key: string;
		mode: string;
		constrainToScale: boolean;
	};
	externalServices: {
		freesoundApiKey: string;
		enableFreesoundSamples: boolean;
	};
} 