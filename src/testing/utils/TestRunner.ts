/**
 * TestRunner - Orchestrates test execution and manages test flow
 * 
 * Handles test scheduling, execution, timeout management, and result aggregation
 * for the unified test suite.
 */

import { AudioEngine } from '../../audio/engine';
import { BaselineTests } from '../performance/BaselineTests';
import { ComponentTests } from '../performance/ComponentTests';
import { AudioEngineTests } from '../integration/AudioEngineTests';
import { IssueValidationTests } from '../integration/IssueValidationTests';
import { TestResults, TestDetail, PerformanceMetrics } from './MetricsCollector';

export interface TestRunnerConfig {
    detailedLogging: boolean;
    onProgress: (progress: TestProgress) => void;
    onResults: (results: TestResults) => void;
    timeout?: number; // Default 30 seconds per test
}

export interface TestProgress {
    current: number;
    total: number;
    currentTest: string;
    phase: 'setup' | 'running' | 'cleanup' | 'complete';
}

export interface TestSelection {
    baseline: boolean;
    voiceManager: boolean;
    effectBus: boolean;
    configLoader: boolean;
    integration: boolean;
    issueValidation: boolean;
}

export class TestRunner {
    private audioEngine: AudioEngine;
    private config: TestRunnerConfig | null = null;
    private isRunning = false;
    private shouldStop = false;
    private currentTest = '';
    private testStartTime = 0;

    // Test instances
    private baselineTests: BaselineTests;
    private componentTests: ComponentTests;
    private audioEngineTests: AudioEngineTests;
    private issueValidationTests: IssueValidationTests;

    constructor(audioEngine: AudioEngine) {
        this.audioEngine = audioEngine;
        this.baselineTests = new BaselineTests(audioEngine);
        this.componentTests = new ComponentTests(audioEngine);
        this.audioEngineTests = new AudioEngineTests(audioEngine);
        this.issueValidationTests = new IssueValidationTests(audioEngine);
    }

    /**
     * Configure the test runner
     */
    configure(config: TestRunnerConfig): void {
        this.config = {
            timeout: 30000, // 30 seconds default
            ...config
        };
    }

    /**
     * Run selected tests
     */
    async runTests(selection: TestSelection): Promise<TestResults> {
        if (!this.config) {
            throw new Error('TestRunner not configured. Call configure() first.');
        }

        if (this.isRunning) {
            throw new Error('Tests are already running');
        }

        this.isRunning = true;
        this.shouldStop = false;
        const startTime = performance.now();
        const testDetails: TestDetail[] = [];
        let current = 0;

        try {
            // Calculate total tests
            const total = this.calculateTotalTests(selection);
            
            this.config.onProgress({
                current: 0,
                total,
                currentTest: 'Initializing...',
                phase: 'setup'
            });

            // Run baseline tests
            if (selection.baseline && !this.shouldStop) {
                const baselineResults = await this.runTestGroup(
                    'Baseline Tests',
                    () => this.baselineTests.runAll(),
                    current++,
                    total
                );
                testDetails.push(...baselineResults);
            }

            // Run component tests
            if (selection.voiceManager && !this.shouldStop) {
                const voiceResults = await this.runTestGroup(
                    'Voice Manager Tests',
                    () => this.componentTests.runVoiceManagerTests(),
                    current++,
                    total
                );
                testDetails.push(...voiceResults);
            }

            if (selection.effectBus && !this.shouldStop) {
                const effectResults = await this.runTestGroup(
                    'Effect Bus Tests',
                    () => this.componentTests.runEffectBusTests(),
                    current++,
                    total
                );
                testDetails.push(...effectResults);
            }

            if (selection.configLoader && !this.shouldStop) {
                const configResults = await this.runTestGroup(
                    'Config Loader Tests',
                    () => this.componentTests.runConfigLoaderTests(),
                    current++,
                    total
                );
                testDetails.push(...configResults);
            }

            // Run integration tests
            if (selection.integration && !this.shouldStop) {
                const integrationResults = await this.runTestGroup(
                    'Integration Tests',
                    () => this.audioEngineTests.runAll(),
                    current++,
                    total
                );
                testDetails.push(...integrationResults);
            }

            // Run issue validation tests
            if (selection.issueValidation && !this.shouldStop) {
                const issueResults = await this.runTestGroup(
                    'Issue Validation Tests',
                    () => this.issueValidationTests.runAll(),
                    current++,
                    total
                );
                testDetails.push(...issueResults);
            }

            // Calculate results
            const endTime = performance.now();
            const duration = endTime - startTime;
            const passed = testDetails.filter(t => t.passed).length;
            const failed = testDetails.filter(t => !t.passed).length;

            const results: TestResults = {
                testsRun: testDetails.length,
                passed,
                failed,
                duration,
                timestamp: Date.now(),
                testDetails,
                systemInfo: this.getSystemInfo(),
                overallMetrics: this.calculateOverallMetrics(testDetails)
            };

            this.config.onProgress({
                current: total,
                total,
                currentTest: 'Complete',
                phase: 'complete'
            });

            this.config.onResults(results);
            return results;

        } catch (error) {
            this.log('error', 'Test execution failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
            this.shouldStop = false;
        }
    }

    /**
     * Stop running tests
     */
    stop(): void {
        if (this.isRunning) {
            this.shouldStop = true;
            this.log('info', 'Test execution stopped by user');
        }
    }

    /**
     * Check if tests are currently running
     */
    isTestRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Run a group of tests with progress tracking
     */
    private async runTestGroup(
        groupName: string,
        testFunction: () => Promise<TestDetail[]>,
        current: number,
        total: number
    ): Promise<TestDetail[]> {
        if (!this.config) return [];

        this.currentTest = groupName;
        this.config.onProgress({
            current,
            total,
            currentTest: groupName,
            phase: 'running'
        });

        this.log('info', `Starting ${groupName}`);
        this.testStartTime = performance.now();

        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Test group timeout: ${groupName}`)), this.config!.timeout);
            });

            const testPromise = testFunction();
            const results = await Promise.race([testPromise, timeoutPromise]);

            const duration = performance.now() - this.testStartTime;
            this.log('info', `Completed ${groupName} in ${duration.toFixed(1)}ms`);

            return results;

        } catch (error) {
            const duration = performance.now() - this.testStartTime;
            this.log('error', `Failed ${groupName} after ${duration.toFixed(1)}ms:`, error);

            // Return a failed test result
            return [{
                name: groupName,
                passed: false,
                duration,
                error: error.message,
                timestamp: Date.now()
            }];
        }
    }

    /**
     * Calculate total number of test groups
     */
    private calculateTotalTests(selection: TestSelection): number {
        let total = 0;
        if (selection.baseline) total++;
        if (selection.voiceManager) total++;
        if (selection.effectBus) total++;
        if (selection.configLoader) total++;
        if (selection.integration) total++;
        if (selection.issueValidation) total++;
        return total;
    }

    /**
     * Calculate overall performance metrics from test details
     */
    private calculateOverallMetrics(testDetails: TestDetail[]): any {
        const metricsArray = testDetails
            .map(test => test.metrics)
            .filter(metrics => metrics !== undefined) as PerformanceMetrics[];

        if (metricsArray.length === 0) {
            return {
                averageMetrics: this.getEmptyMetrics(),
                peakMetrics: this.getEmptyMetrics(),
                trends: {
                    memoryGrowth: 0,
                    cpuTrend: 0,
                    latencyStability: 1
                }
            };
        }

        // Calculate averages
        const averageMetrics: PerformanceMetrics = {
            memory: {
                heapUsed: metricsArray.reduce((sum, m) => sum + m.memory.heapUsed, 0) / metricsArray.length,
                heapTotal: metricsArray.reduce((sum, m) => sum + m.memory.heapTotal, 0) / metricsArray.length,
                objectCount: Math.round(metricsArray.reduce((sum, m) => sum + m.memory.objectCount, 0) / metricsArray.length)
            },
            audio: {
                cpuUsage: metricsArray.reduce((sum, m) => sum + m.audio.cpuUsage, 0) / metricsArray.length,
                latency: metricsArray.reduce((sum, m) => sum + m.audio.latency, 0) / metricsArray.length,
                activeVoices: Math.round(metricsArray.reduce((sum, m) => sum + m.audio.activeVoices, 0) / metricsArray.length),
                sampleRate: metricsArray[0].audio.sampleRate,
                bufferSize: metricsArray[0].audio.bufferSize
            },
            timing: {
                instrumentLoadTime: metricsArray.reduce((sum, m) => sum + m.timing.instrumentLoadTime, 0) / metricsArray.length,
                voiceAllocationTime: metricsArray.reduce((sum, m) => sum + m.timing.voiceAllocationTime, 0) / metricsArray.length,
                effectProcessingTime: metricsArray.reduce((sum, m) => sum + m.timing.effectProcessingTime, 0) / metricsArray.length
            }
        };

        // Calculate peaks
        const peakMetrics: PerformanceMetrics = {
            memory: {
                heapUsed: Math.max(...metricsArray.map(m => m.memory.heapUsed)),
                heapTotal: Math.max(...metricsArray.map(m => m.memory.heapTotal)),
                objectCount: Math.max(...metricsArray.map(m => m.memory.objectCount))
            },
            audio: {
                cpuUsage: Math.max(...metricsArray.map(m => m.audio.cpuUsage)),
                latency: Math.max(...metricsArray.map(m => m.audio.latency)),
                activeVoices: Math.max(...metricsArray.map(m => m.audio.activeVoices)),
                sampleRate: metricsArray[0].audio.sampleRate,
                bufferSize: metricsArray[0].audio.bufferSize
            },
            timing: {
                instrumentLoadTime: Math.max(...metricsArray.map(m => m.timing.instrumentLoadTime)),
                voiceAllocationTime: Math.max(...metricsArray.map(m => m.timing.voiceAllocationTime)),
                effectProcessingTime: Math.max(...metricsArray.map(m => m.timing.effectProcessingTime))
            }
        };

        // Calculate trends (simplified)
        const trends = {
            memoryGrowth: this.calculateMemoryGrowth(metricsArray),
            cpuTrend: this.calculateCpuTrend(metricsArray),
            latencyStability: this.calculateLatencyStability(metricsArray)
        };

        return {
            averageMetrics,
            peakMetrics,
            trends
        };
    }

    /**
     * Calculate memory growth trend
     */
    private calculateMemoryGrowth(metrics: PerformanceMetrics[]): number {
        if (metrics.length < 2) return 0;
        
        const first = metrics[0].memory.heapUsed;
        const last = metrics[metrics.length - 1].memory.heapUsed;
        return (last - first) / first;
    }

    /**
     * Calculate CPU usage trend
     */
    private calculateCpuTrend(metrics: PerformanceMetrics[]): number {
        if (metrics.length < 2) return 0;
        
        const first = metrics[0].audio.cpuUsage;
        const last = metrics[metrics.length - 1].audio.cpuUsage;
        return (last - first) / Math.max(first, 1);
    }

    /**
     * Calculate latency stability
     */
    private calculateLatencyStability(metrics: PerformanceMetrics[]): number {
        if (metrics.length < 2) return 1;
        
        const latencies = metrics.map(m => m.audio.latency);
        const mean = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
        const variance = latencies.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / latencies.length;
        const stdDev = Math.sqrt(variance);
        
        // Convert to stability score (lower variance = higher stability)
        return Math.max(0, 1 - (stdDev / Math.max(mean, 1)));
    }

    /**
     * Get empty metrics template
     */
    private getEmptyMetrics(): PerformanceMetrics {
        return {
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                objectCount: 0
            },
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
            }
        };
    }

    /**
     * Get system information
     */
    private getSystemInfo(): any {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            audioContext: {
                sampleRate: audioContext.sampleRate,
                state: audioContext.state,
                baseLatency: audioContext.baseLatency,
                outputLatency: audioContext.outputLatency
            },
            memory: (performance as any).memory || {},
            timestamp: Date.now(),
            obsidianVersion: (window as any).require?.('obsidian')?.version,
            pluginVersion: '1.0.0' // Should be read from manifest
        };
    }

    /**
     * Log messages based on configuration
     */
    private log(level: 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
        if (this.config?.detailedLogging) {
            const timestamp = new Date().toISOString();
            const prefix = `[TestRunner ${timestamp}]`;
            
            switch (level) {
                case 'info':
                    console.log(prefix, message, ...args);
                    break;
                case 'warn':
                    console.warn(prefix, message, ...args);
                    break;
                case 'error':
                    console.error(prefix, message, ...args);
                    break;
            }
        }
    }
}