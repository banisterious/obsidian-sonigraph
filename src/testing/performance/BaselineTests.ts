/**
 * BaselineTests - System capability detection and baseline measurements
 * 
 * Establishes performance baselines for the testing environment to enable
 * meaningful comparison of audio engine performance improvements.
 */

import { AudioEngine } from '../../audio/engine';
import { TestDetail, PerformanceMetrics } from '../utils/MetricsCollector';

export class BaselineTests {
    private audioEngine: AudioEngine;

    constructor(audioEngine: AudioEngine) {
        this.audioEngine = audioEngine;
    }

    /**
     * Run all baseline tests
     */
    async runAll(): Promise<TestDetail[]> {
        const tests: TestDetail[] = [];

        // System capability tests
        tests.push(await this.testSystemCapabilities());
        tests.push(await this.testAudioContextCapabilities());
        tests.push(await this.testMemoryBaseline());
        tests.push(await this.testTimingBaseline());
        tests.push(await this.testAudioEngineInitialization());

        return tests;
    }

    /**
     * Test basic system capabilities
     */
    private async testSystemCapabilities(): Promise<TestDetail> {
        const startTime = performance.now();
        let passed = false;
        let error: string | undefined;
        let metrics: PerformanceMetrics | undefined;

        try {
            const capabilities = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                hardwareConcurrency: navigator.hardwareConcurrency || 1,
                memoryInfo: (navigator as any).deviceMemory || 'unknown',
                connection: (navigator as any).connection?.effectiveType || 'unknown'
            };

            // Test basic JavaScript performance
            const jsPerformance = await this.measureJavaScriptPerformance();
            
            // Test Web APIs availability
            const webApiSupport = {
                audioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
                webAudio: !!window.AudioContext,
                performance: !!window.performance,
                requestAnimationFrame: !!window.requestAnimationFrame,
                workers: !!window.Worker
            };

            metrics = {
                memory: this.getMemorySnapshot(),
                audio: {
                    cpuUsage: jsPerformance.cpuScore,
                    latency: 0, // Will be measured in audio tests
                    activeVoices: 0,
                    sampleRate: 0,
                    bufferSize: 0
                },
                timing: {
                    instrumentLoadTime: 0,
                    voiceAllocationTime: 0,
                    effectProcessingTime: 0
                },
                custom: {
                    capabilities,
                    jsPerformance,
                    webApiSupport
                }
            };

            // Verify minimum requirements
            const hasMinimumRequirements = 
                webApiSupport.audioContext &&
                webApiSupport.performance &&
                jsPerformance.arrayOpsPerSec > 1000000; // 1M ops/sec minimum

            if (!hasMinimumRequirements) {
                throw new Error('System does not meet minimum requirements for audio engine testing');
            }

            passed = true;

        } catch (err) {
            error = err.message;
        }

        const endTime = performance.now();
        
        return {
            name: 'System Capabilities',
            passed,
            duration: endTime - startTime,
            error,
            metrics,
            timestamp: Date.now()
        };
    }

    /**
     * Test audio context capabilities
     */
    private async testAudioContextCapabilities(): Promise<TestDetail> {
        const startTime = performance.now();
        let passed = false;
        let error: string | undefined;
        let metrics: PerformanceMetrics | undefined;

        try {
            // Create audio context
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();

            const capabilities = {
                sampleRate: audioContext.sampleRate,
                state: audioContext.state,
                baseLatency: audioContext.baseLatency || 0,
                outputLatency: audioContext.outputLatency || 0,
                maxChannelCount: audioContext.destination.maxChannelCount,
                numberOfInputs: audioContext.destination.numberOfInputs,
                numberOfOutputs: audioContext.destination.numberOfOutputs
            };

            // Test basic audio node creation
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const analyser = audioContext.createAnalyser();
            
            // Test advanced features
            const advancedFeatures = {
                scriptProcessor: !!audioContext.createScriptProcessor,
                audioWorklet: !!(audioContext as any).audioWorklet,
                mediaStreamSource: !!audioContext.createMediaStreamSource,
                convolverNode: !!audioContext.createConvolver
            };

            // Measure audio context startup time
            const contextStartTime = performance.now();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            const contextStartupTime = performance.now() - contextStartTime;

            metrics = {
                memory: this.getMemorySnapshot(),
                audio: {
                    cpuUsage: 0,
                    latency: (capabilities.baseLatency + capabilities.outputLatency) * 1000,
                    activeVoices: 0,
                    sampleRate: capabilities.sampleRate,
                    bufferSize: 256 // Default assumption
                },
                timing: {
                    instrumentLoadTime: 0,
                    voiceAllocationTime: 0,
                    effectProcessingTime: 0
                },
                custom: {
                    capabilities,
                    advancedFeatures,
                    contextStartupTime
                }
            };

            // Clean up
            oscillator.disconnect();
            gainNode.disconnect();
            analyser.disconnect();
            audioContext.close();

            passed = true;

        } catch (err) {
            error = err.message;
        }

        const endTime = performance.now();
        
        return {
            name: 'Audio Context Capabilities',
            passed,
            duration: endTime - startTime,
            error,
            metrics,
            timestamp: Date.now()
        };
    }

    /**
     * Test memory baseline
     */
    private async testMemoryBaseline(): Promise<TestDetail> {
        const startTime = performance.now();
        let passed = false;
        let error: string | undefined;
        let metrics: PerformanceMetrics | undefined;

        try {
            const initialMemory = this.getMemorySnapshot();
            
            // Allocate some test data to measure memory behavior
            const testData = this.allocateTestData();
            const afterAllocationMemory = this.getMemorySnapshot();
            
            // Clean up test data
            testData.length = 0;
            
            // Force garbage collection if possible
            if ('gc' in window && typeof (window as any).gc === 'function') {
                (window as any).gc();
            }
            
            // Wait a bit for potential GC
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const afterCleanupMemory = this.getMemorySnapshot();
            
            const memoryBehavior = {
                initial: initialMemory,
                afterAllocation: afterAllocationMemory,
                afterCleanup: afterCleanupMemory,
                allocationDelta: afterAllocationMemory.heapUsed - initialMemory.heapUsed,
                cleanupEfficiency: (afterAllocationMemory.heapUsed - afterCleanupMemory.heapUsed) / 
                                  (afterAllocationMemory.heapUsed - initialMemory.heapUsed)
            };

            metrics = {
                memory: afterCleanupMemory,
                audio: {
                    cpuUsage: 0,
                    latency: 0,
                    activeVoices: 0,
                    sampleRate: 44100,
                    bufferSize: 256
                },
                timing: {
                    instrumentLoadTime: 0,
                    voiceAllocationTime: 0,
                    effectProcessingTime: 0
                },
                custom: {
                    memoryBehavior
                }
            };

            passed = true;

        } catch (err) {
            error = err.message;
        }

        const endTime = performance.now();
        
        return {
            name: 'Memory Baseline',
            passed,
            duration: endTime - startTime,
            error,
            metrics,
            timestamp: Date.now()
        };
    }

    /**
     * Test timing baseline
     */
    private async testTimingBaseline(): Promise<TestDetail> {
        const startTime = performance.now();
        let passed = false;
        let error: string | undefined;
        let metrics: PerformanceMetrics | undefined;

        try {
            // Test various timing operations
            const timingTests = {
                performanceNow: this.measurePerformanceNow(),
                setTimeout: await this.measureSetTimeout(),
                requestAnimationFrame: await this.measureRequestAnimationFrame(),
                promiseResolution: await this.measurePromiseResolution(),
                functionCall: this.measureFunctionCall()
            };

            // Test high-precision timing
            const precisionTest = this.testTimingPrecision();

            metrics = {
                memory: this.getMemorySnapshot(),
                audio: {
                    cpuUsage: 0,
                    latency: 0,
                    activeVoices: 0,
                    sampleRate: 44100,
                    bufferSize: 256
                },
                timing: {
                    instrumentLoadTime: 0,
                    voiceAllocationTime: 0,
                    effectProcessingTime: 0
                },
                custom: {
                    timingTests,
                    precisionTest
                }
            };

            passed = true;

        } catch (err) {
            error = err.message;
        }

        const endTime = performance.now();
        
        return {
            name: 'Timing Baseline',
            passed,
            duration: endTime - startTime,
            error,
            metrics,
            timestamp: Date.now()
        };
    }

    /**
     * Test audio engine initialization performance
     */
    private async testAudioEngineInitialization(): Promise<TestDetail> {
        const startTime = performance.now();
        let passed = false;
        let error: string | undefined;
        let metrics: PerformanceMetrics | undefined;

        try {
            const beforeInit = this.getMemorySnapshot();
            const initStartTime = performance.now();
            
            // Test if audio engine is already initialized
            const wasInitialized = this.audioEngine.testIsInitialized;
            
            if (!wasInitialized) {
                // Initialize if not already done
                await this.audioEngine.initialize();
            }
            
            const initEndTime = performance.now();
            const afterInit = this.getMemorySnapshot();
            
            const initializationMetrics = {
                wasAlreadyInitialized: wasInitialized,
                initializationTime: wasInitialized ? 0 : initEndTime - initStartTime,
                memoryUsage: afterInit.heapUsed - beforeInit.heapUsed,
                instrumentCount: Object.keys(this.audioEngine.getTestSamplerConfigs()).length
            };

            metrics = {
                memory: afterInit,
                audio: {
                    cpuUsage: 0,
                    latency: 0,
                    activeVoices: 0,
                    sampleRate: 44100,
                    bufferSize: 256
                },
                timing: {
                    instrumentLoadTime: initializationMetrics.initializationTime,
                    voiceAllocationTime: 0,
                    effectProcessingTime: 0
                },
                custom: {
                    initializationMetrics
                }
            };

            passed = true;

        } catch (err) {
            error = err.message;
        }

        const endTime = performance.now();
        
        return {
            name: 'Audio Engine Initialization',
            passed,
            duration: endTime - startTime,
            error,
            metrics,
            timestamp: Date.now()
        };
    }

    /**
     * Get current memory snapshot
     */
    private getMemorySnapshot(): PerformanceMetrics['memory'] {
        const memory = (performance as any).memory;
        
        return {
            heapUsed: memory?.usedJSHeapSize || 0,
            heapTotal: memory?.totalJSHeapSize || 0,
            objectCount: memory ? Math.floor(memory.usedJSHeapSize / 100) : 0
        };
    }

    /**
     * Measure JavaScript performance
     */
    private async measureJavaScriptPerformance(): Promise<any> {
        const results = {
            arrayOpsPerSec: 0,
            mathOpsPerSec: 0,
            stringOpsPerSec: 0,
            cpuScore: 0
        };

        // Array operations test
        const arrayStart = performance.now();
        const testArray = new Array(10000);
        for (let i = 0; i < 10000; i++) {
            testArray[i] = Math.random();
        }
        testArray.sort();
        const arrayEnd = performance.now();
        results.arrayOpsPerSec = 10000 / ((arrayEnd - arrayStart) / 1000);

        // Math operations test
        const mathStart = performance.now();
        let mathResult = 0;
        for (let i = 0; i < 100000; i++) {
            mathResult += Math.sin(i) * Math.cos(i);
        }
        const mathEnd = performance.now();
        results.mathOpsPerSec = 100000 / ((mathEnd - mathStart) / 1000);

        // String operations test
        const stringStart = performance.now();
        let str = '';
        for (let i = 0; i < 10000; i++) {
            str += 'test' + i;
        }
        const stringEnd = performance.now();
        results.stringOpsPerSec = 10000 / ((stringEnd - stringStart) / 1000);

        // Calculate overall CPU score
        results.cpuScore = (results.arrayOpsPerSec + results.mathOpsPerSec + results.stringOpsPerSec) / 30000;

        return results;
    }

    /**
     * Allocate test data for memory testing
     */
    private allocateTestData(): any[] {
        const data = [];
        for (let i = 0; i < 10000; i++) {
            data.push({
                id: i,
                data: new Array(100).fill(Math.random()),
                timestamp: Date.now()
            });
        }
        return data;
    }

    /**
     * Measure performance.now() precision
     */
    private measurePerformanceNow(): number {
        const start = performance.now();
        const end = performance.now();
        return end - start;
    }

    /**
     * Measure setTimeout accuracy
     */
    private measureSetTimeout(): Promise<number> {
        return new Promise(resolve => {
            const start = performance.now();
            setTimeout(() => {
                const end = performance.now();
                resolve(end - start);
            }, 10);
        });
    }

    /**
     * Measure requestAnimationFrame timing
     */
    private measureRequestAnimationFrame(): Promise<number> {
        return new Promise(resolve => {
            const start = performance.now();
            requestAnimationFrame(() => {
                const end = performance.now();
                resolve(end - start);
            });
        });
    }

    /**
     * Measure promise resolution timing
     */
    private measurePromiseResolution(): Promise<number> {
        const start = performance.now();
        return Promise.resolve().then(() => {
            const end = performance.now();
            return end - start;
        });
    }

    /**
     * Measure function call overhead
     */
    private measureFunctionCall(): number {
        const testFunction = () => { return 42; };
        
        const start = performance.now();
        for (let i = 0; i < 100000; i++) {
            testFunction();
        }
        const end = performance.now();
        
        return (end - start) / 100000; // Time per function call
    }

    /**
     * Test timing precision
     */
    private testTimingPrecision(): any {
        const samples = [];
        for (let i = 0; i < 100; i++) {
            samples.push(performance.now());
        }
        
        const deltas = [];
        for (let i = 1; i < samples.length; i++) {
            deltas.push(samples[i] - samples[i - 1]);
        }
        
        const minDelta = Math.min(...deltas.filter(d => d > 0));
        const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
        
        return {
            resolution: minDelta,
            averageDelta: avgDelta,
            samples: samples.length
        };
    }
}