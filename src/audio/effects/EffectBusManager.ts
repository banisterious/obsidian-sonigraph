import { Reverb, Chorus, Filter, Delay, Distortion, Compressor, EQ3, getDestination } from 'tone';
import { 
    EffectNode, 
    SendBus, 
    ReturnBus, 
    EffectChain, 
    MasterEffectsConfig, 
    EffectParameters,
    EffectInstance,
    EffectBusMetrics,
    EffectType,
    EffectConfig
} from './types';
import { getLogger } from '../../logging';

const logger = getLogger('effect-bus-manager');

export class EffectBusManager {
    private enhancedRouting: boolean = false;
    private effectChains: Map<string, EffectNode[]> = new Map();
    private sendBuses: Map<string, SendBus> = new Map();
    private returnBuses: Map<string, ReturnBus> = new Map();
    private masterEffectsNodes: Map<string, any> = new Map();
    private effectNodeInstances: Map<string, any> = new Map();
    
    // Master effects
    private masterReverb: Reverb | null = null;
    private masterEQ: EQ3 | null = null;
    private masterCompressor: Compressor | null = null;
    
    // Legacy per-instrument effects backup
    private instrumentEffects: Map<string, Map<string, any>> = new Map();
    
    constructor() {
        logger.debug('initialization', 'EffectBusManager created');
        this.initializeDefaultConfigs();
    }

    /**
     * Initialize default effect configurations
     */
    private initializeDefaultConfigs(): void {
        // Set up default send/return buses
        this.sendBuses.set('reverb-send', {
            id: 'reverb-send',
            name: 'Reverb Send',
            level: 0.3,
            enabled: true,
            destination: 'master-reverb'
        });
        
        this.sendBuses.set('chorus-send', {
            id: 'chorus-send', 
            name: 'Chorus Send',
            level: 0.2,
            enabled: true,
            destination: 'master-chorus'
        });
        
        this.returnBuses.set('master-reverb', {
            id: 'master-reverb',
            name: 'Master Reverb',
            level: 1.0,
            enabled: true,
            effectChain: []
        });
        
        this.returnBuses.set('master-chorus', {
            id: 'master-chorus',
            name: 'Master Chorus', 
            level: 1.0,
            enabled: true,
            effectChain: []
        });
    }

    /**
     * Enable enhanced routing system
     */
    async enableEnhancedRouting(): Promise<void> {
        if (this.enhancedRouting) return;
        
        logger.info('routing', 'Enabling enhanced effect routing');
        
        // Initialize master effects
        await this.initializeMasterEffects();
        
        // Initialize send/return buses
        this.initializeSendReturnBuses();
        
        this.enhancedRouting = true;
        logger.info('routing', 'Enhanced routing enabled');
    }

    /**
     * Disable enhanced routing system
     */
    disableEnhancedRouting(): void {
        if (!this.enhancedRouting) return;
        
        logger.info('routing', 'Disabling enhanced effect routing');
        
        // Dispose of all enhanced routing effects
        this.disposeAllEffects();
        
        this.enhancedRouting = false;
        logger.info('routing', 'Enhanced routing disabled');
    }

    /**
     * Initialize master effects chain
     */
    private async initializeMasterEffects(): Promise<void> {
        // Master Reverb
        this.masterReverb = new Reverb(2.0).toDestination();
        this.masterEffectsNodes.set('master-reverb', this.masterReverb);
        
        // Master EQ
        this.masterEQ = new EQ3({
            low: 0,
            mid: 0,
            high: 0
        }).connect(this.masterReverb);
        this.masterEffectsNodes.set('master-eq', this.masterEQ);
        
        // Master Compressor  
        this.masterCompressor = new Compressor({
            threshold: -24,
            ratio: 12,
            attack: 0.003,
            release: 0.25
        }).connect(this.masterEQ);
        this.masterEffectsNodes.set('master-compressor', this.masterCompressor);
        
        logger.debug('effects', 'Master effects initialized');
    }

    /**
     * Initialize send/return bus system
     */
    private initializeSendReturnBuses(): void {
        // Create send buses to master effects
        for (const [busId, bus] of this.sendBuses.entries()) {
            if (bus.enabled) {
                logger.debug('bus', `Initializing send bus: ${busId}`);
            }
        }
        
        // Initialize return buses
        for (const [busId, bus] of this.returnBuses.entries()) {
            if (bus.enabled) {
                logger.debug('bus', `Initializing return bus: ${busId}`);
            }
        }
    }

    /**
     * Initialize effect chain for an instrument
     */
    initializeInstrumentEffectChain(instrumentName: string, effectList: string[]): void {
        const chain: EffectNode[] = [];
        
        for (let i = 0; i < effectList.length; i++) {
            const effectType = effectList[i] as EffectType;
            const effectId = `${instrumentName}-${effectType}-${i}`;
            
            const effectNode: EffectNode = {
                id: effectId,
                type: effectType,
                enabled: true,
                bypassed: false,
                parameters: this.getDefaultParametersForEffect(effectType)
            };
            
            // Create actual Tone.js effect instance
            const effectInstance = this.createEffectInstance(effectType, effectNode.parameters);
            if (effectInstance) {
                this.effectNodeInstances.set(effectId, effectInstance);
                chain.push(effectNode);
            }
        }
        
        this.effectChains.set(instrumentName, chain);
        logger.debug('effects', `Initialized effect chain for ${instrumentName}: ${effectList.join(', ')}`);
    }

    /**
     * Create Tone.js effect instance
     */
    private createEffectInstance(type: EffectType, parameters: EffectParameters): any {
        switch (type) {
            case 'reverb':
                return new Reverb(parameters.decay || 1.5);
                
            case 'chorus':
                return new Chorus({
                    frequency: parameters.frequency || 1.5,
                    delayTime: parameters.delayTime || 3.5,
                    depth: parameters.depth || 0.7,
                    feedback: parameters.feedback || 0.1
                });
                
            case 'filter':
                return new Filter({
                    frequency: parameters.frequency || 1000,
                    type: parameters.type || 'lowpass',
                    rolloff: parameters.rolloff || -12,
                    Q: parameters.Q || 1
                });
                
            case 'delay':
                return new Delay(parameters.delayTime || 0.25);
                
            case 'distortion':
                return new Distortion(parameters.distortion || 0.4);
                
            case 'compressor':
                return new Compressor({
                    threshold: parameters.threshold || -24,
                    ratio: parameters.ratio || 12,
                    attack: parameters.attack || 0.003,
                    release: parameters.release || 0.25,
                    knee: parameters.knee || 30
                });
                
            case 'eq3':
                return new EQ3({
                    low: parameters.low || 0,
                    mid: parameters.mid || 0,
                    high: parameters.high || 0
                });
                
            default:
                logger.warn('effects', `Unknown effect type: ${type}`);
                return null;
        }
    }

    /**
     * Connect instrument through its effect chain
     */
    connectInstrumentEnhanced(instrument: any, instrumentName: string): void {
        if (!this.enhancedRouting) return;
        
        const chain = this.effectChains.get(instrumentName);
        if (!chain || chain.length === 0) {
            // No effects - connect directly to master chain
            this.connectToMasterChain(instrument);
            return;
        }
        
        // Connect through effect chain
        let currentNode = instrument;
        
        for (const effectNode of chain) {
            if (!effectNode.enabled || effectNode.bypassed) continue;
            
            const effectInstance = this.effectNodeInstances.get(effectNode.id);
            if (effectInstance) {
                currentNode = currentNode.connect(effectInstance);
            }
        }
        
        // Connect final node to master chain
        this.connectToMasterChain(currentNode);
        
        logger.debug('routing', `Connected ${instrumentName} through effect chain`);
    }

    /**
     * Connect to master effects chain
     */
    private connectToMasterChain(node: any): any {
        if (this.masterCompressor) {
            return node.connect(this.masterCompressor);
        } else {
            return node.toDestination();
        }
    }

    /**
     * Get effect chain for instrument
     */
    getEffectChain(instrumentName: string): EffectNode[] {
        return this.effectChains.get(instrumentName) || [];
    }

    /**
     * Add effect to instrument chain
     */
    addEffectToChain(instrumentName: string, effectType: EffectType, position?: number): string {
        const chain = this.effectChains.get(instrumentName) || [];
        const effectId = `${instrumentName}-${effectType}-${Date.now()}`;
        
        const effectNode: EffectNode = {
            id: effectId,
            type: effectType,
            enabled: true,
            bypassed: false,
            parameters: this.getDefaultParametersForEffect(effectType)
        };
        
        // Create effect instance
        const effectInstance = this.createEffectInstance(effectType, effectNode.parameters);
        if (effectInstance) {
            this.effectNodeInstances.set(effectId, effectInstance);
            
            if (position !== undefined && position < chain.length) {
                chain.splice(position, 0, effectNode);
            } else {
                chain.push(effectNode);
            }
            
            this.effectChains.set(instrumentName, chain);
            logger.debug('effects', `Added ${effectType} to ${instrumentName} chain`);
        }
        
        return effectId;
    }

    /**
     * Remove effect from chain
     */
    removeEffectFromChain(instrumentName: string, effectId: string): boolean {
        const chain = this.effectChains.get(instrumentName);
        if (!chain) return false;
        
        const index = chain.findIndex(node => node.id === effectId);
        if (index === -1) return false;
        
        // Dispose of effect instance
        const effectInstance = this.effectNodeInstances.get(effectId);
        if (effectInstance && effectInstance.dispose) {
            effectInstance.dispose();
        }
        this.effectNodeInstances.delete(effectId);
        
        // Remove from chain
        chain.splice(index, 1);
        this.effectChains.set(instrumentName, chain);
        
        logger.debug('effects', `Removed effect ${effectId} from ${instrumentName} chain`);
        return true;
    }

    /**
     * Toggle effect enabled state
     */
    toggleEffect(instrumentName: string, effectId: string): boolean {
        const chain = this.effectChains.get(instrumentName);
        if (!chain) return false;
        
        const effectNode = chain.find(node => node.id === effectId);
        if (!effectNode) return false;
        
        effectNode.enabled = !effectNode.enabled;
        logger.debug('effects', `Toggled ${effectId} enabled: ${effectNode.enabled}`);
        
        return effectNode.enabled;
    }

    /**
     * Toggle effect bypass state
     */
    toggleEffectBypass(instrumentName: string, effectId: string): boolean {
        const chain = this.effectChains.get(instrumentName);
        if (!chain) return false;
        
        const effectNode = chain.find(node => node.id === effectId);
        if (!effectNode) return false;
        
        effectNode.bypassed = !effectNode.bypassed;
        
        // Update actual effect instance
        const effectInstance = this.effectNodeInstances.get(effectId);
        if (effectInstance && effectInstance.wet) {
            effectInstance.wet.value = effectNode.bypassed ? 0 : 1;
        }
        
        logger.debug('effects', `Toggled ${effectId} bypass: ${effectNode.bypassed}`);
        return effectNode.bypassed;
    }

    /**
     * Update effect parameters
     */
    updateEffectParameters(instrumentName: string, effectId: string, parameters: EffectParameters): void {
        const chain = this.effectChains.get(instrumentName);
        if (!chain) return;
        
        const effectNode = chain.find(node => node.id === effectId);
        if (!effectNode) return;
        
        effectNode.parameters = { ...effectNode.parameters, ...parameters };
        
        // Update actual effect instance
        const effectInstance = this.effectNodeInstances.get(effectId);
        if (effectInstance) {
            this.applyParametersToInstance(effectInstance, effectNode.type, parameters);
        }
        
        logger.debug('effects', `Updated parameters for ${effectId}`);
    }

    /**
     * Apply parameters to effect instance
     */
    private applyParametersToInstance(instance: any, type: EffectType, parameters: EffectParameters): void {
        switch (type) {
            case 'reverb':
                if (parameters.decay !== undefined) instance.decay = parameters.decay;
                if (parameters.preDelay !== undefined) instance.preDelay = parameters.preDelay;
                if (parameters.wet !== undefined) instance.wet.value = parameters.wet;
                break;
                
            case 'chorus':
                if (parameters.frequency !== undefined) instance.frequency.value = parameters.frequency;
                if (parameters.delayTime !== undefined) instance.delayTime = parameters.delayTime;
                if (parameters.depth !== undefined) instance.depth = parameters.depth;
                break;
                
            case 'filter':
                if (parameters.frequency !== undefined) instance.frequency.value = parameters.frequency;
                if (parameters.Q !== undefined) instance.Q.value = parameters.Q;
                break;
                
            case 'delay':
                if (parameters.delayTime !== undefined) instance.delayTime.value = parameters.delayTime;
                if (parameters.wet !== undefined) instance.wet.value = parameters.wet;
                break;
                
            case 'distortion':
                if (parameters.distortion !== undefined) instance.distortion = parameters.distortion;
                break;
                
            case 'eq3':
                if (parameters.low !== undefined) instance.low.value = parameters.low;
                if (parameters.mid !== undefined) instance.mid.value = parameters.mid;
                if (parameters.high !== undefined) instance.high.value = parameters.high;
                break;
                
            // Add other effect types as needed
        }
    }

    /**
     * Get default parameters for effect type
     */
    private getDefaultParametersForEffect(type: EffectType): EffectParameters {
        const defaults: Record<EffectType, EffectParameters> = {
            reverb: { decay: 1.5, preDelay: 0.01, wet: 0.3 },
            chorus: { frequency: 1.5, delayTime: 3.5, depth: 0.7 },
            filter: { frequency: 1000, type: 'lowpass', rolloff: -12, Q: 1 },
            delay: { delayTime: 0.25, wet: 0.3 },
            distortion: { distortion: 0.4 },
            compressor: { threshold: -24, ratio: 12, attack: 0.003, release: 0.25, knee: 30 },
            eq3: { low: 0, mid: 0, high: 0 }
        };
        
        return defaults[type] || {};
    }

    /**
     * Get performance metrics
     */
    getMetrics(): EffectBusMetrics {
        let totalEffectNodes = 0;
        let activeEffectNodes = 0;
        
        for (const chain of this.effectChains.values()) {
            totalEffectNodes += chain.length;
            activeEffectNodes += chain.filter(node => node.enabled && !node.bypassed).length;
        }
        
        const cpuUsageEstimate = activeEffectNodes * 3; // 3% CPU per active effect estimate
        
        return {
            totalEffectNodes,
            activeEffectNodes,
            sendBusCount: this.sendBuses.size,
            returnBusCount: this.returnBuses.size,
            cpuUsageEstimate
        };
    }

    /**
     * Check if enhanced routing is enabled
     */
    isEnhancedRoutingEnabled(): boolean {
        return this.enhancedRouting;
    }

    /**
     * Get send buses
     */
    getSendBuses(): Map<string, SendBus> {
        return new Map(this.sendBuses);
    }

    /**
     * Get return buses
     */
    getReturnBuses(): Map<string, ReturnBus> {
        return new Map(this.returnBuses);
    }

    /**
     * Dispose all effects and clean up
     */
    private disposeAllEffects(): void {
        // Dispose effect instances
        for (const effectInstance of this.effectNodeInstances.values()) {
            if (effectInstance && effectInstance.dispose) {
                effectInstance.dispose();
            }
        }
        this.effectNodeInstances.clear();
        
        // Dispose master effects
        if (this.masterReverb) {
            this.masterReverb.dispose();
            this.masterReverb = null;
        }
        if (this.masterEQ) {
            this.masterEQ.dispose();
            this.masterEQ = null;
        }
        if (this.masterCompressor) {
            this.masterCompressor.dispose();
            this.masterCompressor = null;
        }
        
        // Clear all collections
        this.effectChains.clear();
        this.masterEffectsNodes.clear();
        
        logger.debug('effects', 'All effects disposed');
    }

    /**
     * Dispose of the EffectBusManager
     */
    dispose(): void {
        this.disposeAllEffects();
        this.sendBuses.clear();
        this.returnBuses.clear();
        this.instrumentEffects.clear();
        
        logger.debug('effects', 'EffectBusManager disposed');
    }
}