/**
 * ConnectionTypePresetManager - Phase 4.4: Preset Management for Connection Type Audio Differentiation
 *
 * Manages built-in and custom presets for connection type mappings, including
 * loading, saving, validation, and integration with the settings system.
 */

import { Notice } from 'obsidian';
import {
    ConnectionTypeMappingConfig,
    ConnectionTypePreset,
    ConnectionType,
    BUILT_IN_PRESETS,
    DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG
} from './ConnectionTypeMappingConfig';
import { getLogger } from '../../logging';

const logger = getLogger('connection-type-preset-manager');

/**
 * Result of preset operation
 */
export interface PresetOperationResult {
    success: boolean;
    message: string;
    preset?: ConnectionTypePreset;
    errors?: string[];
}

/**
 * Preset validation result
 */
export interface PresetValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    compatibility: {
        version: string;
        compatible: boolean;
        requiresUpgrade: boolean;
    };
}

export class ConnectionTypePresetManager {
    private config: ConnectionTypeMappingConfig;
    private customPresets: Map<string, ConnectionTypePreset>;
    private builtInPresets: Map<string, ConnectionTypePreset>;

    constructor(config: ConnectionTypeMappingConfig) {
        this.config = { ...config };
        this.customPresets = new Map();
        this.builtInPresets = new Map();

        // Initialize built-in presets
        BUILT_IN_PRESETS.forEach(preset => {
            this.builtInPresets.set(preset.name, preset);
        });

        // Load custom presets from config
        this.config.customPresets.forEach(preset => {
            this.customPresets.set(preset.name, preset);
        });

        logger.info('connection-type-preset-manager', 'Preset manager initialized', {
            builtInCount: this.builtInPresets.size,
            customCount: this.customPresets.size,
            currentPreset: this.config.currentPreset
        });
    }

    /**
     * Get all available presets (built-in and custom)
     */
    public getAllPresets(): ConnectionTypePreset[] {
        const presets: ConnectionTypePreset[] = [];

        // Add built-in presets first
        this.builtInPresets.forEach(preset => presets.push(preset));

        // Add custom presets
        this.customPresets.forEach(preset => presets.push(preset));

        return presets;
    }

    /**
     * Get built-in presets only
     */
    public getBuiltInPresets(): ConnectionTypePreset[] {
        return Array.from(this.builtInPresets.values());
    }

    /**
     * Get custom presets only
     */
    public getCustomPresets(): ConnectionTypePreset[] {
        return Array.from(this.customPresets.values());
    }

    /**
     * Get a specific preset by name
     */
    public getPreset(name: string): ConnectionTypePreset | null {
        return this.builtInPresets.get(name) || this.customPresets.get(name) || null;
    }

    /**
     * Load a preset into the current configuration
     */
    public async loadPreset(presetName: string): Promise<PresetOperationResult> {
        try {
            const preset = this.getPreset(presetName);
            if (!preset) {
                return {
                    success: false,
                    message: `Preset '${presetName}' not found`
                };
            }

            // Validate preset before applying
            const validation = this.validatePreset(preset);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: `Preset '${presetName}' is invalid`,
                    errors: validation.errors
                };
            }

            // Apply preset mappings to current config
            const updatedConfig = this.applyPresetToConfig(preset, this.config);

            // Update current config
            this.config = updatedConfig;
            this.config.currentPreset = presetName;

            logger.info('connection-type-preset-manager', 'Preset loaded successfully', {
                presetName,
                mappingsApplied: Object.keys(preset.mappings).length,
                isCustom: this.customPresets.has(presetName)
            });

            // Show success notice
            new Notice(`Connection Type Preset '${presetName}' loaded successfully`);

            return {
                success: true,
                message: `Preset '${presetName}' loaded successfully`,
                preset
            };

        } catch (error) {
            logger.error('connection-type-preset-manager', 'Failed to load preset', {
                presetName,
                error: (error as Error).message
            });

            return {
                success: false,
                message: `Failed to load preset: ${(error as Error).message}`
            };
        }
    }

    /**
     * Save current configuration as a custom preset
     */
    public async savePreset(name: string, description: string, author?: string): Promise<PresetOperationResult> {
        try {
            // Check if preset name already exists
            if (this.builtInPresets.has(name)) {
                return {
                    success: false,
                    message: `Cannot overwrite built-in preset '${name}'`
                };
            }

            // Create preset from current config
            const preset: ConnectionTypePreset = {
                name,
                description,
                author: author || 'User',
                version: '1.0.0',
                mappings: this.extractMappingsFromConfig(this.config)
            };

            // Validate preset
            const validation = this.validatePreset(preset);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: `Cannot save invalid preset`,
                    errors: validation.errors
                };
            }

            // Save to custom presets
            this.customPresets.set(name, preset);

            // Update config's custom presets array
            this.config.customPresets = Array.from(this.customPresets.values());

            logger.info('connection-type-preset-manager', 'Custom preset saved', {
                presetName: name,
                mappingsCount: Object.keys(preset.mappings).length
            });

            // Show success notice
            new Notice(`Custom preset '${name}' saved successfully`);

            return {
                success: true,
                message: `Custom preset '${name}' saved successfully`,
                preset
            };

        } catch (error) {
            logger.error('connection-type-preset-manager', 'Failed to save preset', {
                name,
                error: (error as Error).message
            });

            return {
                success: false,
                message: `Failed to save preset: ${(error as Error).message}`
            };
        }
    }

    /**
     * Delete a custom preset
     */
    public async deletePreset(name: string): Promise<PresetOperationResult> {
        try {
            // Can't delete built-in presets
            if (this.builtInPresets.has(name)) {
                return {
                    success: false,
                    message: `Cannot delete built-in preset '${name}'`
                };
            }

            if (!this.customPresets.has(name)) {
                return {
                    success: false,
                    message: `Custom preset '${name}' not found`
                };
            }

            // Remove from custom presets
            const deletedPreset = this.customPresets.get(name);
            this.customPresets.delete(name);

            // Update config's custom presets array
            this.config.customPresets = Array.from(this.customPresets.values());

            // If this was the current preset, switch to default
            if (this.config.currentPreset === name) {
                this.config.currentPreset = 'Default';
            }

            logger.info('connection-type-preset-manager', 'Custom preset deleted', { presetName: name });

            // Show success notice
            new Notice(`Custom preset '${name}' deleted successfully`);

            return {
                success: true,
                message: `Custom preset '${name}' deleted successfully`,
                preset: deletedPreset
            };

        } catch (error) {
            logger.error('connection-type-preset-manager', 'Failed to delete preset', {
                name,
                error: (error as Error).message
            });

            return {
                success: false,
                message: `Failed to delete preset: ${(error as Error).message}`
            };
        }
    }

    /**
     * Validate a preset for correctness and compatibility
     */
    public validatePreset(preset: ConnectionTypePreset): PresetValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic structure validation
        if (!preset.name || preset.name.trim().length === 0) {
            errors.push('Preset name is required');
        }

        if (!preset.description || preset.description.trim().length === 0) {
            warnings.push('Preset description is empty');
        }

        if (!preset.mappings || Object.keys(preset.mappings).length === 0) {
            errors.push('Preset must have at least one connection type mapping');
        }

        // Validate individual mappings
        if (preset.mappings) {
            Object.entries(preset.mappings).forEach(([connectionType, mapping]) => {
                if (!mapping) {
                    errors.push(`Mapping for '${connectionType}' is null or undefined`);
                    return;
                }

                // Validate connection type
                const validConnectionTypes: ConnectionType[] = [
                    'wikilink', 'embed', 'markdown', 'tag', 'backlink', 'unresolved', 'external', 'alias'
                ];
                if (!validConnectionTypes.includes(connectionType as ConnectionType)) {
                    errors.push(`Invalid connection type: '${connectionType}'`);
                }

                // Validate instrument family
                const validInstrumentFamilies = [
                    'strings', 'brass', 'woodwinds', 'percussion', 'keyboards',
                    'electronic', 'world', 'vocals', 'ambient', 'organic'
                ];
                if (mapping.instrumentFamily && !validInstrumentFamilies.includes(mapping.instrumentFamily)) {
                    errors.push(`Invalid instrument family for '${connectionType}': '${mapping.instrumentFamily}'`);
                }

                // Validate intensity
                if (mapping.intensity !== undefined && (mapping.intensity < 0 || mapping.intensity > 1)) {
                    errors.push(`Intensity for '${connectionType}' must be between 0 and 1`);
                }

                // Validate audio characteristics ranges
                if (mapping.audioCharacteristics) {
                    const characteristics = mapping.audioCharacteristics;

                    if (characteristics.baseVolume !== undefined && (characteristics.baseVolume < 0 || characteristics.baseVolume > 1)) {
                        errors.push(`Base volume for '${connectionType}' must be between 0 and 1`);
                    }

                    if (characteristics.noteDuration !== undefined && (characteristics.noteDuration < 0.1 || characteristics.noteDuration > 3.0)) {
                        errors.push(`Note duration for '${connectionType}' must be between 0.1 and 3.0`);
                    }

                    if (characteristics.harmonicRichness !== undefined && (characteristics.harmonicRichness < 0 || characteristics.harmonicRichness > 1)) {
                        errors.push(`Harmonic richness for '${connectionType}' must be between 0 and 1`);
                    }
                }
            });
        }

        // Version compatibility check
        const compatibility = {
            version: preset.version || '1.0.0',
            compatible: true,
            requiresUpgrade: false
        };

        // Future: Add version compatibility logic here
        if (preset.version && preset.version !== '1.0.0') {
            warnings.push(`Preset version '${preset.version}' may require updates`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            compatibility
        };
    }

    /**
     * Apply preset mappings to a configuration
     */
    private applyPresetToConfig(preset: ConnectionTypePreset, baseConfig: ConnectionTypeMappingConfig): ConnectionTypeMappingConfig {
        const updatedConfig = { ...baseConfig };

        // Apply preset mappings
        Object.entries(preset.mappings).forEach(([connectionType, mapping]) => {
            if (mapping && updatedConfig.mappings[connectionType as ConnectionType]) {
                updatedConfig.mappings[connectionType as ConnectionType] = { ...mapping };
            }
        });

        return updatedConfig;
    }

    /**
     * Extract mappings from config for saving as preset
     */
    private extractMappingsFromConfig(config: ConnectionTypeMappingConfig): Partial<Record<ConnectionType, any>> {
        const mappings: Partial<Record<ConnectionType, any>> = {};

        Object.entries(config.mappings).forEach(([connectionType, mapping]) => {
            if (mapping.enabled) {
                mappings[connectionType as ConnectionType] = {
                    enabled: mapping.enabled,
                    instrumentFamily: mapping.instrumentFamily,
                    intensity: mapping.intensity,
                    audioCharacteristics: { ...mapping.audioCharacteristics },
                    linkStrengthAnalysis: { ...mapping.linkStrengthAnalysis },
                    contextualModifiers: { ...mapping.contextualModifiers },
                    priority: mapping.priority
                };
            }
        });

        return mappings;
    }

    /**
     * Export preset to JSON string
     */
    public exportPreset(name: string): string | null {
        const preset = this.getPreset(name);
        if (!preset) {
            return null;
        }

        try {
            return JSON.stringify(preset, null, 2);
        } catch (error) {
            logger.error('connection-type-preset-manager', 'Failed to export preset', {
                name,
                error: (error as Error).message
            });
            return null;
        }
    }

    /**
     * Import preset from JSON string
     */
    public async importPreset(jsonString: string, overwriteExisting: boolean = false): Promise<PresetOperationResult> {
        try {
            const preset: ConnectionTypePreset = JSON.parse(jsonString);

            // Validate imported preset
            const validation = this.validatePreset(preset);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Imported preset is invalid',
                    errors: validation.errors
                };
            }

            // Check if preset already exists
            if (this.getPreset(preset.name) && !overwriteExisting) {
                return {
                    success: false,
                    message: `Preset '${preset.name}' already exists. Use overwriteExisting=true to replace it.`
                };
            }

            // Save as custom preset
            this.customPresets.set(preset.name, preset);
            this.config.customPresets = Array.from(this.customPresets.values());

            logger.info('connection-type-preset-manager', 'Preset imported successfully', {
                presetName: preset.name,
                overwritten: overwriteExisting
            });

            new Notice(`Preset '${preset.name}' imported successfully`);

            return {
                success: true,
                message: `Preset '${preset.name}' imported successfully`,
                preset
            };

        } catch (error) {
            logger.error('connection-type-preset-manager', 'Failed to import preset', {
                error: (error as Error).message
            });

            return {
                success: false,
                message: `Failed to import preset: ${(error as Error).message}`
            };
        }
    }

    /**
     * Reset to default configuration
     */
    public async resetToDefaults(): Promise<PresetOperationResult> {
        try {
            // Load default preset
            const defaultPreset = this.builtInPresets.get('Default');
            if (!defaultPreset) {
                return {
                    success: false,
                    message: 'Default preset not found'
                };
            }

            // Reset config to defaults
            this.config = { ...DEFAULT_CONNECTION_TYPE_MAPPING_CONFIG };

            // Apply default preset
            this.config = this.applyPresetToConfig(defaultPreset, this.config);
            this.config.currentPreset = 'Default';

            logger.info('connection-type-preset-manager', 'Configuration reset to defaults');

            new Notice('Connection Type Mapping reset to default configuration');

            return {
                success: true,
                message: 'Configuration reset to defaults successfully',
                preset: defaultPreset
            };

        } catch (error) {
            logger.error('connection-type-preset-manager', 'Failed to reset to defaults', {
                error: (error as Error).message
            });

            return {
                success: false,
                message: `Failed to reset to defaults: ${(error as Error).message}`
            };
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): ConnectionTypeMappingConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: ConnectionTypeMappingConfig): void {
        this.config = { ...newConfig };

        // Sync custom presets
        this.customPresets.clear();
        this.config.customPresets.forEach(preset => {
            this.customPresets.set(preset.name, preset);
        });

        logger.debug('connection-type-preset-manager', 'Configuration updated');
    }

    /**
     * Get preset usage statistics
     */
    public getPresetStats(): {
        totalPresets: number;
        builtInPresets: number;
        customPresets: number;
        currentPreset: string | null;
        mostUsedConnectionTypes: string[];
    } {
        const allPresets = this.getAllPresets();
        const connectionTypeUsage: Record<string, number> = {};

        // Count connection type usage across all presets
        allPresets.forEach(preset => {
            Object.keys(preset.mappings).forEach(connectionType => {
                connectionTypeUsage[connectionType] = (connectionTypeUsage[connectionType] || 0) + 1;
            });
        });

        // Sort by usage
        const sortedConnectionTypes = Object.entries(connectionTypeUsage)
            .sort(([, a], [, b]) => b - a)
            .map(([type]) => type);

        return {
            totalPresets: allPresets.length,
            builtInPresets: this.builtInPresets.size,
            customPresets: this.customPresets.size,
            currentPreset: this.config.currentPreset,
            mostUsedConnectionTypes: sortedConnectionTypes.slice(0, 5)
        };
    }
}