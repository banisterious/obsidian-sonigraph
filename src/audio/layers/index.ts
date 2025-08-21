/**
 * Continuous Audio Layers - Phase 3 Implementation
 * 
 * This module provides continuous background audio layers that evolve
 * with vault state, activity, and temporal animation progress.
 */

// Core layer management
export { ContinuousLayerManager } from './ContinuousLayerManager';
export { MusicalGenreEngine } from './MusicalGenreEngine';
export { FreesoundSampleLoader } from './FreesoundSampleLoader';
export { RhythmicLayerManager } from './RhythmicLayerManager';
export { HarmonicLayerManager } from './HarmonicLayerManager';

// Musical theory integration
export { MusicalTheoryEngine } from '../theory/MusicalTheoryEngine';

// Type definitions
export * from './types';

/**
 * Phase 3 Feature Summary:
 * 
 * 1. **Continuous Layer System**: ContinuousLayerManager orchestrates
 *    ambient background audio that responds to vault state changes.
 * 
 * 2. **13 Musical Genres**: MusicalGenreEngine supports ambient, drone,
 *    orchestral, electronic, minimal, oceanic, sci-fi, experimental,
 *    industrial, urban, nature, mechanical, and organic genres.
 * 
 * 3. **Dynamic Parameter Modulation**: Layers respond to vault density,
 *    animation progress, and activity level in real-time.
 * 
 * 4. **Freesound Integration**: FreesoundSampleLoader uses preview URLs
 *    (no OAuth required) with intelligent caching for high-quality samples.
 * 
 * 5. **Rhythmic Background**: RhythmicLayerManager adds activity-based
 *    percussion and arpeggiator patterns.
 * 
 * 6. **Harmonic Evolution**: HarmonicLayerManager generates cluster-based
 *    chord progressions with musical theory constraints.
 * 
 * 7. **Temporal Integration**: Seamless integration with existing
 *    TemporalGraphAnimator for progress tracking and callbacks.
 * 
 * 8. **Performance Optimized**: Targets <5% CPU usage increase with
 *    adaptive quality and memory management.
 * 
 * Usage:
 * ```typescript
 * import { ContinuousLayerManager, MusicalGenre } from './audio/layers';
 * 
 * const layerManager = new ContinuousLayerManager(settings, {
 *   enabled: true,
 *   genre: 'ambient',
 *   intensity: 0.5,
 *   evolutionRate: 0.3,
 *   adaptiveIntensity: true
 * });
 * 
 * await layerManager.initialize();
 * await layerManager.start();
 * 
 * // Integration with temporal animator
 * temporalAnimator.setVaultStateCallback((vaultState) => {
 *   layerManager.updateVaultState(vaultState);
 * });
 * ```
 */