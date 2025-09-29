/**
 * Panning system for stereo positioning calculations
 * Phase 6.3: Spatial Audio and Panning
 */

import {
    PanPosition,
    NormalizedPosition,
    GraphPosition,
    GraphBounds,
    PanningCurve,
    SpatialAudioConfig,
} from './types';

/**
 * Core panning system responsible for calculating stereo positions
 * from graph coordinates using various mapping algorithms
 */
export class PanningSystem {
    private config: SpatialAudioConfig;
    private currentBounds: GraphBounds | null = null;

    // Velocity damping state for smooth transitions
    private velocityState: Map<string, { pan: number; velocity: number; lastUpdate: number }> = new Map();

    constructor(config: SpatialAudioConfig) {
        this.config = config;
    }

    /**
     * Update the panning system configuration
     */
    updateConfig(config: SpatialAudioConfig): void {
        this.config = config;
    }

    /**
     * Update graph bounds for normalization
     */
    updateBounds(bounds: GraphBounds): void {
        this.currentBounds = bounds;
    }

    /**
     * Calculate pan position from graph coordinates
     * @param position Raw graph position
     * @param nodeId Node identifier for velocity damping
     * @returns Pan position (-1 to 1)
     */
    calculatePanFromPosition(position: GraphPosition, nodeId: string): PanPosition {
        if (!this.currentBounds) {
            return 0; // Center if bounds not set
        }

        // Normalize position to 0-1 range
        const normalized = this.normalizePosition(position);

        // Apply panning curve
        const rawPan = this.applyCurve(normalized.x);

        // Apply intensity scaling
        const scaledPan = rawPan * this.config.graphPositionSettings.intensity;

        // Apply boundary padding
        const paddedPan = this.applyBoundaryPadding(scaledPan);

        // Apply velocity damping if enabled
        if (this.config.advanced.velocityDamping) {
            return this.applyVelocityDamping(nodeId, paddedPan);
        }

        return this.clampPan(paddedPan);
    }

    /**
     * Normalize graph position to 0-1 range
     */
    private normalizePosition(position: GraphPosition): NormalizedPosition {
        if (!this.currentBounds) {
            return { x: 0.5, y: 0.5 };
        }

        const x = (position.x - this.currentBounds.minX) / this.currentBounds.width;
        const y = (position.y - this.currentBounds.minY) / this.currentBounds.height;

        return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y)),
        };
    }

    /**
     * Apply panning curve transformation
     * Converts 0-1 normalized X to -1 to 1 pan
     */
    private applyCurve(normalizedX: number): PanPosition {
        // Convert 0-1 to -1 to 1 range
        const centered = (normalizedX * 2) - 1;

        switch (this.config.graphPositionSettings.curve) {
            case PanningCurve.Linear:
                return centered;

            case PanningCurve.Exponential:
                // y = sign(x) * |x|^2
                return Math.sign(centered) * Math.pow(Math.abs(centered), 2);

            case PanningCurve.Sigmoid:
                // S-curve: smoother transitions, bias toward center
                // y = 2 / (1 + e^(-4x)) - 1
                return (2 / (1 + Math.exp(-4 * centered))) - 1;

            case PanningCurve.Logarithmic:
                // Logarithmic: compress extremes
                // y = sign(x) * log(1 + 9|x|) / log(10)
                return Math.sign(centered) * (Math.log10(1 + 9 * Math.abs(centered)));

            default:
                return centered;
        }
    }

    /**
     * Apply boundary padding to keep pan away from extremes
     */
    private applyBoundaryPadding(pan: PanPosition): PanPosition {
        const padding = this.config.advanced.boundaryPadding;
        const range = 1 - padding;

        return pan * range;
    }

    /**
     * Apply velocity damping for smooth transitions
     */
    private applyVelocityDamping(nodeId: string, targetPan: PanPosition): PanPosition {
        const now = performance.now();
        const state = this.velocityState.get(nodeId);

        if (!state) {
            // Initialize state
            this.velocityState.set(nodeId, {
                pan: targetPan,
                velocity: 0,
                lastUpdate: now,
            });
            return targetPan;
        }

        const dt = (now - state.lastUpdate) / 1000; // Convert to seconds
        if (dt < 0.001) {
            return state.pan; // Too soon, return current
        }

        // Calculate velocity
        const panDelta = targetPan - state.pan;
        const dampingFactor = this.config.advanced.dampingFactor;

        // Apply damping: velocity gradually approaches target
        const acceleration = panDelta * (1 - dampingFactor);
        const newVelocity = (state.velocity + acceleration) * dampingFactor;

        // Update pan with velocity
        const newPan = state.pan + newVelocity;

        // Update state
        this.velocityState.set(nodeId, {
            pan: newPan,
            velocity: newVelocity,
            lastUpdate: now,
        });

        return this.clampPan(newPan);
    }

    /**
     * Calculate folder-based pan position
     * @param folderPath Full folder path
     * @returns Pan position or null if no mapping found
     */
    calculateFolderPan(folderPath: string): PanPosition | null {
        if (!this.config.folderSettings.enabled) {
            return null;
        }

        const mappings = this.config.folderSettings.customMappings;
        let bestMatch: { mapping: typeof mappings[0]; depth: number } | null = null;

        // Find best matching folder (deepest match wins for nested folders)
        for (const mapping of mappings) {
            if (folderPath.startsWith(mapping.folderPath)) {
                const depth = mapping.folderPath.split('/').length;

                if (!bestMatch || depth > bestMatch.depth ||
                    (depth === bestMatch.depth && mapping.priority > bestMatch.mapping.priority)) {
                    bestMatch = { mapping, depth };
                }
            }
        }

        if (bestMatch) {
            // Apply spread factor for files within folder
            const basePan = bestMatch.mapping.panPosition;
            const spread = this.config.folderSettings.spreadFactor;

            // Generate slight variation based on file path hash
            const variation = this.hashPathToVariation(folderPath) * spread;

            return this.clampPan(basePan + variation);
        }

        // Auto-detect top-level folder if enabled
        if (this.config.folderSettings.autoDetectTopLevel) {
            const topLevelFolder = folderPath.split('/')[0];
            if (topLevelFolder) {
                // Generate consistent pan from folder name hash
                return this.hashPathToVariation(topLevelFolder);
            }
        }

        return null;
    }

    /**
     * Calculate cluster-based pan position
     * @param clusterCenter Center position of cluster
     * @param nodePosition Individual node position
     * @returns Pan position
     */
    calculateClusterPan(clusterCenter: GraphPosition, nodePosition: GraphPosition): PanPosition {
        if (!this.currentBounds) {
            return 0;
        }

        // Calculate pan from cluster center
        const centerNormalized = this.normalizePosition(clusterCenter);
        const centerPan = this.applyCurve(centerNormalized.x) * this.config.graphPositionSettings.intensity;

        // Calculate individual node pan
        const nodeNormalized = this.normalizePosition(nodePosition);
        const nodePan = this.applyCurve(nodeNormalized.x) * this.config.graphPositionSettings.intensity;

        // Blend center and individual based on spread setting
        const spread = this.config.clusterSettings.individualSpread;
        const blendedPan = centerPan * (1 - spread) + nodePan * spread;

        return this.clampPan(blendedPan);
    }

    /**
     * Calculate weighted hybrid pan from multiple sources
     */
    calculateHybridPan(
        graphPan: PanPosition,
        folderPan: PanPosition | null,
        clusterPan: PanPosition | null
    ): PanPosition {
        const weights = this.config.hybridWeights;
        let totalWeight = 0;
        let weightedSum = 0;

        // Graph position (always available)
        weightedSum += graphPan * weights.graphPosition;
        totalWeight += weights.graphPosition;

        // Folder-based (if available)
        if (folderPan !== null) {
            weightedSum += folderPan * weights.folderBased;
            totalWeight += weights.folderBased;
        }

        // Cluster-based (if available)
        if (clusterPan !== null) {
            weightedSum += clusterPan * weights.clusterBased;
            totalWeight += weights.clusterBased;
        }

        // Normalize by total weight
        if (totalWeight > 0) {
            return this.clampPan(weightedSum / totalWeight);
        }

        return graphPan; // Fallback to graph position
    }

    /**
     * Calculate depth-based volume adjustment (future feature)
     * @param normalizedY Y-position in 0-1 range (0 = top, 1 = bottom)
     * @returns Volume multiplier (0-1)
     */
    calculateDepthVolume(normalizedY: number): number {
        if (!this.config.advanced.enableDepthMapping) {
            return 1.0;
        }

        const influence = this.config.advanced.depthInfluence;

        // Bottom of graph = closer = louder
        // Top of graph = farther = quieter
        const depthFactor = 1 - (normalizedY * influence);

        return Math.max(0.1, Math.min(1.0, depthFactor));
    }

    /**
     * Clear velocity state for a node (e.g., when node is removed)
     */
    clearNodeState(nodeId: string): void {
        this.velocityState.delete(nodeId);
    }

    /**
     * Clear all velocity state
     */
    clearAllState(): void {
        this.velocityState.clear();
    }

    /**
     * Clamp pan position to valid range
     */
    private clampPan(pan: PanPosition): PanPosition {
        return Math.max(-1, Math.min(1, pan));
    }

    /**
     * Generate consistent variation from path hash
     * @returns Value between -1 and 1
     */
    private hashPathToVariation(path: string): number {
        let hash = 0;
        for (let i = 0; i < path.length; i++) {
            hash = ((hash << 5) - hash) + path.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Convert to -1 to 1 range
        const normalized = (hash % 1000) / 1000;
        return (normalized * 2) - 1;
    }

    /**
     * Get current bounds
     */
    getBounds(): GraphBounds | null {
        return this.currentBounds;
    }

    /**
     * Check if position is within current bounds
     */
    isPositionInBounds(position: GraphPosition): boolean {
        if (!this.currentBounds) {
            return false;
        }

        return (
            position.x >= this.currentBounds.minX &&
            position.x <= this.currentBounds.maxX &&
            position.y >= this.currentBounds.minY &&
            position.y <= this.currentBounds.maxY
        );
    }
}