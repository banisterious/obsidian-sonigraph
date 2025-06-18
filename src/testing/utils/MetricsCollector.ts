/**
 * MetricsCollector - Comprehensive test results and performance data collection
 * 
 * Collects, aggregates, and manages test results and performance metrics
 * for analysis and export purposes.
 */

export interface TestDetail {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
    metrics?: PerformanceMetrics;
    timestamp: number;
}

export interface TestResults {
    testsRun: number;
    passed: number;
    failed: number;
    duration: number;
    timestamp: number;
    testDetails: TestDetail[];
    systemInfo: SystemInfo;
    overallMetrics: OverallMetrics;
}

export interface PerformanceMetrics {
    memory: {
        heapUsed: number;
        heapTotal: number;
        objectCount: number;
        gcCollections?: number;
    };
    audio: {
        cpuUsage: number;
        latency: number;
        activeVoices: number;
        sampleRate: number;
        bufferSize: number;
    };
    timing: {
        instrumentLoadTime: number;
        voiceAllocationTime: number;
        effectProcessingTime: number;
        configLoadTime?: number;
    };
    custom?: Record<string, any>;
}

export interface SystemInfo {
    userAgent: string;
    platform: string;
    audioContext: {
        sampleRate: number;
        state: string;
        baseLatency?: number;
        outputLatency?: number;
    };
    memory: {
        jsHeapSizeLimit?: number;
        totalJSHeapSize?: number;
        usedJSHeapSize?: number;
    };
    timestamp: number;
    obsidianVersion?: string;
    pluginVersion?: string;
}

export interface OverallMetrics {
    averageMetrics: PerformanceMetrics;
    peakMetrics: PerformanceMetrics;
    trends: {
        memoryGrowth: number;
        cpuTrend: number;
        latencyStability: number;
    };
}

export class MetricsCollector {
    private results: TestResults[] = [];
    private currentMetrics: PerformanceMetrics[] = [];
    private startTime: number = 0;

    /**
     * Start a new test session
     */
    startSession(): void {
        this.startTime = performance.now();
        this.currentMetrics = [];
    }

    /**
     * Record a performance metric sample
     */
    recordMetrics(metrics: PerformanceMetrics): void {
        this.currentMetrics.push({
            ...metrics,
            timestamp: performance.now()
        } as any);
    }

    /**
     * Add completed test results
     */
    addResults(results: TestResults): void {
        this.results.push(results);
    }

    /**
     * Get current performance metrics snapshot
     */
    getCurrentMetrics(): PerformanceMetrics {
        return {
            memory: this.getMemoryMetrics(),
            audio: this.getAudioMetrics(),
            timing: this.getTimingMetrics()
        };
    }

    /**
     * Generate comprehensive test report data
     */
    generateReportData(): {
        summary: TestSummary;
        detailedResults: TestResults[];
        performanceAnalysis: PerformanceAnalysis;
        recommendations: string[];
    } {
        return {
            summary: this.generateSummary(),
            detailedResults: this.results,
            performanceAnalysis: this.analyzePerformance(),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Export data for sharing (optimized for copying to external tools)
     */
    getExportData(): ExportData {
        return {
            metadata: {
                exportTime: new Date().toISOString(),
                sessionCount: this.results.length,
                metricsCount: this.currentMetrics.length,
                systemInfo: this.getSystemInfo()
            },
            testResults: this.results,
            performanceMetrics: this.currentMetrics,
            analysis: this.analyzePerformance(),
            summary: this.generateSummary()
        };
    }

    /**
     * Get memory performance metrics
     */
    private getMemoryMetrics(): PerformanceMetrics['memory'] {
        const memory = (performance as any).memory;
        
        return {
            heapUsed: memory?.usedJSHeapSize || 0,
            heapTotal: memory?.totalJSHeapSize || 0,
            objectCount: this.estimateObjectCount(),
            gcCollections: memory?.gcCollections || 0
        };
    }

    /**
     * Get audio context performance metrics
     */
    private getAudioMetrics(): PerformanceMetrics['audio'] {
        // These would be provided by the audio engine
        return {
            cpuUsage: 0, // Will be populated by actual audio engine
            latency: 0,
            activeVoices: 0,
            sampleRate: 44100,
            bufferSize: 256
        };
    }

    /**
     * Get timing performance metrics
     */
    private getTimingMetrics(): PerformanceMetrics['timing'] {
        return {
            instrumentLoadTime: 0, // Will be populated by actual measurements
            voiceAllocationTime: 0,
            effectProcessingTime: 0,
            configLoadTime: 0
        };
    }

    /**
     * Estimate object count (rough heuristic)
     */
    private estimateObjectCount(): number {
        const memory = (performance as any).memory;
        if (memory?.usedJSHeapSize) {
            // Rough estimate: assume average object size of 100 bytes
            return Math.floor(memory.usedJSHeapSize / 100);
        }
        return 0;
    }

    /**
     * Generate test summary
     */
    private generateSummary(): TestSummary {
        const totalTests = this.results.reduce((sum, r) => sum + r.testsRun, 0);
        const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
        const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        return {
            totalSessions: this.results.length,
            totalTests,
            totalPassed,
            totalFailed,
            successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
            averageDuration: this.results.length > 0 ? totalDuration / this.results.length : 0,
            lastRunTime: this.results.length > 0 ? this.results[this.results.length - 1].timestamp : 0
        };
    }

    /**
     * Analyze performance trends and patterns
     */
    private analyzePerformance(): PerformanceAnalysis {
        if (this.currentMetrics.length === 0) {
            return {
                memoryTrend: 'stable',
                cpuTrend: 'stable',
                latencyTrend: 'stable',
                recommendations: [],
                issues: []
            };
        }

        const memoryTrend = this.analyzeMemoryTrend();
        const cpuTrend = this.analyzeCpuTrend();
        const latencyTrend = this.analyzeLatencyTrend();

        return {
            memoryTrend,
            cpuTrend,
            latencyTrend,
            recommendations: this.generatePerformanceRecommendations(),
            issues: this.identifyIssues()
        };
    }

    /**
     * Analyze memory usage trends
     */
    private analyzeMemoryTrend(): 'improving' | 'stable' | 'degrading' {
        if (this.currentMetrics.length < 3) return 'stable';

        const recent = this.currentMetrics.slice(-5);
        const earlier = this.currentMetrics.slice(0, 5);

        const recentAvg = recent.reduce((sum, m) => sum + m.memory.heapUsed, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, m) => sum + m.memory.heapUsed, 0) / earlier.length;

        const change = (recentAvg - earlierAvg) / earlierAvg;

        if (change > 0.1) return 'degrading';
        if (change < -0.05) return 'improving';
        return 'stable';
    }

    /**
     * Analyze CPU usage trends
     */
    private analyzeCpuTrend(): 'improving' | 'stable' | 'degrading' {
        // Similar analysis for CPU usage
        return 'stable'; // Placeholder
    }

    /**
     * Analyze latency trends
     */
    private analyzeLatencyTrend(): 'improving' | 'stable' | 'degrading' {
        // Similar analysis for latency
        return 'stable'; // Placeholder
    }

    /**
     * Generate performance recommendations
     */
    private generatePerformanceRecommendations(): string[] {
        const recommendations: string[] = [];

        // Analyze current state and generate recommendations
        if (this.currentMetrics.length > 0) {
            const latest = this.currentMetrics[this.currentMetrics.length - 1];
            
            if (latest.memory.heapUsed > 50 * 1024 * 1024) { // 50MB
                recommendations.push('High memory usage detected. Consider optimizing instrument caching.');
            }
            
            if (latest.audio.cpuUsage > 80) {
                recommendations.push('High CPU usage detected. Consider reducing voice count or effect complexity.');
            }
            
            if (latest.audio.latency > 10) {
                recommendations.push('High audio latency detected. Consider increasing buffer size.');
            }
        }

        return recommendations;
    }

    /**
     * Generate general recommendations
     */
    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        const summary = this.generateSummary();

        if (summary.successRate < 90) {
            recommendations.push('Test success rate is below 90%. Review failing tests.');
        }

        if (summary.averageDuration > 10000) { // 10 seconds
            recommendations.push('Tests are taking longer than expected. Consider optimizing test execution.');
        }

        return recommendations;
    }

    /**
     * Identify performance issues
     */
    private identifyIssues(): string[] {
        const issues: string[] = [];

        // Check for common performance issues
        if (this.currentMetrics.length > 0) {
            const latest = this.currentMetrics[this.currentMetrics.length - 1];
            
            if (latest.timing.instrumentLoadTime > 1000) {
                issues.push('Slow instrument loading detected');
            }
            
            if (latest.timing.voiceAllocationTime > 5) {
                issues.push('Slow voice allocation detected');
            }
        }

        return issues;
    }

    /**
     * Get system information
     */
    private getSystemInfo(): SystemInfo {
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
     * Clear all collected data
     */
    clear(): void {
        this.results = [];
        this.currentMetrics = [];
    }
}

// Supporting interfaces
interface TestSummary {
    totalSessions: number;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    successRate: number;
    averageDuration: number;
    lastRunTime: number;
}

interface PerformanceAnalysis {
    memoryTrend: 'improving' | 'stable' | 'degrading';
    cpuTrend: 'improving' | 'stable' | 'degrading';
    latencyTrend: 'improving' | 'stable' | 'degrading';
    recommendations: string[];
    issues: string[];
}

interface ExportData {
    metadata: {
        exportTime: string;
        sessionCount: number;
        metricsCount: number;
        systemInfo: SystemInfo;
    };
    testResults: TestResults[];
    performanceMetrics: PerformanceMetrics[];
    analysis: PerformanceAnalysis;
    summary: TestSummary;
}