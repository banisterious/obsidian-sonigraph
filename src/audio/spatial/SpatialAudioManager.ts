/**
 * Spatial audio manager for graph-based stereo positioning
 * Phase 6.3: Spatial Audio and Panning
 */

import * as Tone from 'tone';
import { PanningSystem } from './PanningSystem';
import {
    PanPosition,
    GraphPosition,
    GraphBounds,
    NodeSpatialState,
    SpatialAudioConfig,
    SpatialAudioStats,
    SpatialAudioEvent,
    PanningMode,
    ClusterSpatialConfig,
} from './types';

/**
 * Manages spatial audio positioning for all nodes in the graph
 * Integrates with Tone.js Panner nodes for stereo positioning
 */
export class SpatialAudioManager {
    private config: SpatialAudioConfig;
    private panningSystem: PanningSystem;

    // Node tracking
    private nodeStates: Map<string, NodeSpatialState> = new Map();
    private pannerNodes: Map<string, Tone.Panner> = new Map();

    // Cluster tracking
    private clusterConfigs: Map<string, ClusterSpatialConfig> = new Map();

    // Update throttling
    private lastUpdateTime: Map<string, number> = new Map();
    private updateThrottleMs: number;

    // Statistics
    private stats: SpatialAudioStats = {
        totalNodes: 0,
        trackedNodes: 0,
        averagePan: 0,
        panDistribution: { left: 0, center: 0, right: 0 },
        updateFrequency: 0,
        lastBoundsUpdate: 0,
    };

    // Event handlers
    private eventHandlers: Map<string, ((event: SpatialAudioEvent) => void)[]> = new Map();

    constructor(config: SpatialAudioConfig) {
        this.config = config;
        this.panningSystem = new PanningSystem(config);
        this.updateThrottleMs = config.graphPositionSettings.updateThrottleMs;
    }

    /**
     * Update spatial audio configuration
     */
    updateConfig(config: SpatialAudioConfig): void {
        this.config = config;
        this.panningSystem.updateConfig(config);
        this.updateThrottleMs = config.graphPositionSettings.updateThrottleMs;

        // Recalculate all pan positions with new config
        if (config.enabled) {
            this.recalculateAllPanPositions();
        }

        this.emitEvent({
            type: 'mode-change',
            timestamp: Date.now(),
        });
    }

    /**
     * Update graph bounds (called when graph layout changes)
     */
    updateGraphBounds(bounds: GraphBounds): void {
        this.panningSystem.updateBounds(bounds);
        this.stats.lastBoundsUpdate = Date.now();

        // Recalculate positions with new bounds
        this.recalculateAllPanPositions();

        this.emitEvent({
            type: 'bounds-update',
            timestamp: Date.now(),
        });
    }

    /**
     * Register a node for spatial audio tracking
     */
    registerNode(nodeId: string, position: GraphPosition, folderPath?: string, clusterId?: string): void {
        if (!this.config.enabled) {
            return;
        }

        // Calculate pan position
        const panPosition = this.calculateNodePan(nodeId, position, folderPath, clusterId);

        // Create or update node state
        const state: NodeSpatialState = {
            nodeId,
            position,
            normalizedPosition: { x: 0, y: 0 }, // Will be calculated by panning system
            panPosition,
            folderBasedPan: folderPath ? this.panningSystem.calculateFolderPan(folderPath) || undefined : undefined,
            clusterPan: clusterId ? this.calculateClusterPan(clusterId, position) : undefined,
            finalPan: panPosition,
            lastUpdated: Date.now(),
        };

        this.nodeStates.set(nodeId, state);
        this.stats.trackedNodes = this.nodeStates.size;

        // Apply pan to audio node
        this.applyPanToNode(nodeId, panPosition);
    }

    /**
     * Update node position (called during force simulation)
     */
    updateNodePosition(nodeId: string, position: GraphPosition): void {
        if (!this.config.enabled) {
            return;
        }

        const state = this.nodeStates.get(nodeId);
        if (!state) {
            return; // Node not registered
        }

        // Check throttle
        const now = Date.now();
        const lastUpdate = this.lastUpdateTime.get(nodeId) || 0;
        if (now - lastUpdate < this.updateThrottleMs) {
            return; // Too soon, skip update
        }

        // Update position
        const oldPan = state.finalPan;
        state.position = position;

        // Recalculate pan
        const newPan = this.calculateNodePan(
            nodeId,
            position,
            undefined, // Keep existing folder path
            undefined  // Keep existing cluster
        );

        state.finalPan = newPan;
        state.lastUpdated = now;
        this.lastUpdateTime.set(nodeId, now);

        // Apply if pan changed significantly
        if (Math.abs(newPan - oldPan) > 0.01) {
            this.applyPanToNode(nodeId, newPan);

            this.emitEvent({
                type: 'pan-change',
                nodeId,
                oldPan,
                newPan,
                timestamp: now,
            });
        }
    }

    /**
     * Unregister a node (when removed from graph)
     */
    unregisterNode(nodeId: string): void {
        this.nodeStates.delete(nodeId);
        this.lastUpdateTime.delete(nodeId);
        this.panningSystem.clearNodeState(nodeId);

        // Dispose panner node
        const panner = this.pannerNodes.get(nodeId);
        if (panner) {
            panner.dispose();
            this.pannerNodes.delete(nodeId);
        }

        this.stats.trackedNodes = this.nodeStates.size;
    }

    /**
     * Get or create panner node for a node
     */
    getPannerForNode(nodeId: string): Tone.Panner | null {
        if (!this.config.enabled) {
            return null;
        }

        let panner = this.pannerNodes.get(nodeId);
        if (!panner) {
            panner = new Tone.Panner(0).toDestination();
            this.pannerNodes.set(nodeId, panner);
        }

        return panner;
    }

    /**
     * Update cluster configuration
     */
    updateClusterConfig(clusterId: string, config: ClusterSpatialConfig): void {
        this.clusterConfigs.set(clusterId, config);

        // Update all nodes in this cluster
        for (const [nodeId, state] of this.nodeStates.entries()) {
            if (state.clusterPan !== undefined) {
                // Node belongs to a cluster, recalculate
                const newClusterPan = this.calculateClusterPan(clusterId, state.position);
                state.clusterPan = newClusterPan;

                // Recalculate final pan
                const newPan = this.calculateNodePan(nodeId, state.position);
                if (Math.abs(newPan - state.finalPan) > 0.01) {
                    state.finalPan = newPan;
                    this.applyPanToNode(nodeId, newPan);
                }
            }
        }
    }

    /**
     * Calculate pan position for a node based on current mode
     */
    private calculateNodePan(
        nodeId: string,
        position: GraphPosition,
        folderPath?: string,
        clusterId?: string
    ): PanPosition {
        const state = this.nodeStates.get(nodeId);

        switch (this.config.mode) {
            case PanningMode.GraphPosition:
                return this.panningSystem.calculatePanFromPosition(position, nodeId);

            case PanningMode.FolderBased:
                const folderPan = folderPath ? this.panningSystem.calculateFolderPan(folderPath) :
                    state?.folderBasedPan;
                return folderPan !== null && folderPan !== undefined ? folderPan : 0;

            case PanningMode.ClusterBased:
                const clusterPan = clusterId ? this.calculateClusterPan(clusterId, position) :
                    state?.clusterPan;
                return clusterPan !== undefined ? clusterPan : 0;

            case PanningMode.Hybrid:
                const graphPan = this.panningSystem.calculatePanFromPosition(position, nodeId);
                const folderHybridPan = folderPath ? this.panningSystem.calculateFolderPan(folderPath) :
                    state?.folderBasedPan || null;
                const clusterHybridPan = clusterId ? this.calculateClusterPan(clusterId, position) :
                    state?.clusterPan !== undefined ? state.clusterPan : null;

                return this.panningSystem.calculateHybridPan(graphPan, folderHybridPan, clusterHybridPan);

            case PanningMode.Disabled:
            default:
                return 0; // Center
        }
    }

    /**
     * Calculate cluster-based pan
     */
    private calculateClusterPan(clusterId: string, nodePosition: GraphPosition): PanPosition | undefined {
        const clusterConfig = this.clusterConfigs.get(clusterId);
        if (!clusterConfig) {
            return undefined;
        }

        if (this.config.clusterSettings.useCentroid) {
            return this.panningSystem.calculateClusterPan(clusterConfig.centerPosition, nodePosition);
        } else {
            // Use predefined cluster pan position
            return clusterConfig.panPosition;
        }
    }

    /**
     * Apply pan position to audio node
     */
    private applyPanToNode(nodeId: string, pan: PanPosition): void {
        const panner = this.pannerNodes.get(nodeId);
        if (panner) {
            panner.pan.value = pan;
        }
    }

    /**
     * Recalculate all node pan positions
     */
    private recalculateAllPanPositions(): void {
        for (const [nodeId, state] of this.nodeStates.entries()) {
            const newPan = this.calculateNodePan(nodeId, state.position);
            if (Math.abs(newPan - state.finalPan) > 0.01) {
                state.finalPan = newPan;
                this.applyPanToNode(nodeId, newPan);
            }
        }

        this.updateStatistics();
    }

    /**
     * Update statistics
     */
    private updateStatistics(): void {
        const states = Array.from(this.nodeStates.values());

        this.stats.totalNodes = states.length;
        this.stats.trackedNodes = states.length;

        if (states.length === 0) {
            this.stats.averagePan = 0;
            this.stats.panDistribution = { left: 0, center: 0, right: 0 };
            return;
        }

        // Calculate average pan
        const totalPan = states.reduce((sum, state) => sum + state.finalPan, 0);
        this.stats.averagePan = totalPan / states.length;

        // Calculate distribution
        let left = 0, center = 0, right = 0;
        for (const state of states) {
            if (state.finalPan < -0.33) left++;
            else if (state.finalPan > 0.33) right++;
            else center++;
        }

        this.stats.panDistribution = { left, center, right };
    }

    /**
     * Get current statistics
     */
    getStatistics(): SpatialAudioStats {
        return { ...this.stats };
    }

    /**
     * Get node state
     */
    getNodeState(nodeId: string): NodeSpatialState | undefined {
        return this.nodeStates.get(nodeId);
    }

    /**
     * Get all node states
     */
    getAllNodeStates(): NodeSpatialState[] {
        return Array.from(this.nodeStates.values());
    }

    /**
     * Event handling
     */
    addEventListener(type: string, handler: (event: SpatialAudioEvent) => void): void {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, []);
        }
        this.eventHandlers.get(type)!.push(handler);
    }

    removeEventListener(type: string, handler: (event: SpatialAudioEvent) => void): void {
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    private emitEvent(event: SpatialAudioEvent): void {
        const handlers = this.eventHandlers.get(event.type);
        if (handlers) {
            for (const handler of handlers) {
                handler(event);
            }
        }

        // Also emit to wildcard listeners
        const wildcardHandlers = this.eventHandlers.get('*');
        if (wildcardHandlers) {
            for (const handler of wildcardHandlers) {
                handler(event);
            }
        }
    }

    /**
     * Enable spatial audio
     */
    enable(): void {
        this.config.enabled = true;
        this.recalculateAllPanPositions();
    }

    /**
     * Disable spatial audio (center all audio)
     */
    disable(): void {
        this.config.enabled = false;

        // Center all audio
        for (const panner of this.pannerNodes.values()) {
            panner.pan.value = 0;
        }
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        // Dispose all panner nodes
        for (const panner of this.pannerNodes.values()) {
            panner.dispose();
        }

        this.pannerNodes.clear();
        this.nodeStates.clear();
        this.lastUpdateTime.clear();
        this.clusterConfigs.clear();
        this.eventHandlers.clear();
        this.panningSystem.clearAllState();
    }
}