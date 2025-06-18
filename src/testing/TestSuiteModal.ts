/**
 * Unified Test Suite Modal for Performance Validation and Testing
 * 
 * Provides comprehensive testing capabilities for the refactored audio engine
 * with real-time metrics, test execution, and data export functionality.
 */

import { Modal, App, Setting, ButtonComponent } from 'obsidian';
import { PerformanceMonitor } from './performance/PerformanceMonitor';
import { BaselineTests } from './performance/BaselineTests';
import { ComponentTests } from './performance/ComponentTests';
import { AudioEngineTests } from './integration/AudioEngineTests';
import { IssueValidationTests } from './integration/IssueValidationTests';
import { TestRunner } from './utils/TestRunner';
import { MetricsCollector, TestResults } from './utils/MetricsCollector';
import { ReportGenerator } from './utils/ReportGenerator';
import { AudioEngine } from '../audio/engine';

export interface TestSuiteConfig {
    selectedTests: {
        baseline: boolean;
        voiceManager: boolean;
        effectBus: boolean;
        configLoader: boolean;
        integration: boolean;
        issueValidation: boolean;
    };
    exportFormat: 'markdown' | 'json' | 'csv';
    realTimeMetrics: boolean;
    detailedLogging: boolean;
    loggingLevel: 'none' | 'basic' | 'detailed' | 'debug';
    enableLogExport: boolean;
}

export class TestSuiteModal extends Modal {
    private audioEngine: AudioEngine;
    private performanceMonitor: PerformanceMonitor;
    private testRunner: TestRunner;
    private metricsCollector: MetricsCollector;
    private reportGenerator: ReportGenerator;
    
    private config: TestSuiteConfig = {
        selectedTests: {
            baseline: true,
            voiceManager: true,
            effectBus: true,
            configLoader: true,
            integration: false,
            issueValidation: true  // Enable by default to test Phase 2.2 optimization
        },
        exportFormat: 'markdown',
        realTimeMetrics: true,
        detailedLogging: false,
        loggingLevel: 'basic',
        enableLogExport: true
    };
    
    private currentResults: TestResults | null = null;
    private isRunning = false;
    private metricsDisplay: HTMLElement | null = null;
    private progressDisplay: HTMLElement | null = null;
    private resultsDisplay: HTMLElement | null = null;

    constructor(app: App, audioEngine: AudioEngine) {
        super(app);
        this.audioEngine = audioEngine;
        this.performanceMonitor = new PerformanceMonitor();
        this.testRunner = new TestRunner(audioEngine);
        this.metricsCollector = new MetricsCollector();
        this.reportGenerator = new ReportGenerator(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Modal header
        contentEl.createEl('h1', { text: 'Audio Engine Test Suite' });
        contentEl.createEl('p', { 
            text: 'Comprehensive performance validation for the refactored audio engine',
            cls: 'test-suite-description'
        });

        // Test configuration section
        this.createTestSelectionSection(contentEl);
        
        // Settings section
        this.createSettingsSection(contentEl);
        
        // Control buttons
        this.createControlSection(contentEl);
        
        // Real-time metrics display
        this.createMetricsDisplay(contentEl);
        
        // Progress display
        this.createProgressDisplay(contentEl);
        
        // Results display
        this.createResultsDisplay(contentEl);

        // Add CSS classes for styling
        contentEl.addClass('test-suite-modal');
    }

    private createTestSelectionSection(container: HTMLElement) {
        const section = container.createDiv('test-selection-section');
        section.createEl('h2', { text: 'Test Selection' });

        const grid = section.createDiv('test-grid');

        // Baseline Tests
        this.createTestCheckbox(grid, 'baseline', 'Baseline Performance', 
            'System capability detection and baseline measurements');

        // Component Tests
        this.createTestCheckbox(grid, 'voiceManager', 'Voice Manager', 
            'Voice allocation, stealing, and pool management performance');

        this.createTestCheckbox(grid, 'effectBus', 'Effect Bus Manager', 
            'Effect routing, shared processing, and bypass performance');

        this.createTestCheckbox(grid, 'configLoader', 'Config Loader', 
            'Instrument configuration loading and caching performance');

        // Integration Tests
        this.createTestCheckbox(grid, 'integration', 'Integration Tests', 
            'Full audio engine stress testing and complex scenarios');

        // Issue Validation
        this.createTestCheckbox(grid, 'issueValidation', 'Issue #001 & #002 Validation', 
            'Audio crackling resolution, performance improvements, and architecture validation');
    }

    private createTestCheckbox(container: HTMLElement, key: keyof TestSuiteConfig['selectedTests'], 
                              title: string, description: string) {
        const testItem = container.createDiv('test-item');
        
        new Setting(testItem)
            .setName(title)
            .setDesc(description)
            .addToggle(toggle => toggle
                .setValue(this.config.selectedTests[key])
                .onChange(value => {
                    this.config.selectedTests[key] = value;
                })
            );
    }

    private createSettingsSection(container: HTMLElement) {
        const section = container.createDiv('settings-section');
        section.createEl('h2', { text: 'Test Settings' });

        // Export format
        new Setting(section)
            .setName('Export Format')
            .setDesc('Choose format for test result exports')
            .addDropdown(dropdown => dropdown
                .addOption('markdown', 'Markdown (for vault notes)')
                .addOption('json', 'JSON (for data analysis)')
                .addOption('csv', 'CSV (for spreadsheets)')
                .setValue(this.config.exportFormat)
                .onChange(value => {
                    this.config.exportFormat = value as 'markdown' | 'json' | 'csv';
                })
            );

        // Real-time metrics
        new Setting(section)
            .setName('Real-time Metrics')
            .setDesc('Display live performance metrics during testing')
            .addToggle(toggle => toggle
                .setValue(this.config.realTimeMetrics)
                .onChange(value => {
                    this.config.realTimeMetrics = value;
                })
            );

        // Detailed logging
        new Setting(section)
            .setName('Detailed Logging')
            .setDesc('Include verbose test execution details')
            .addToggle(toggle => toggle
                .setValue(this.config.detailedLogging)
                .onChange(value => {
                    this.config.detailedLogging = value;
                })
            );

        // Logging level (mirrored from Control Center)
        new Setting(section)
            .setName('Logging Level')
            .setDesc('Control the verbosity of test logging output')
            .addDropdown(dropdown => dropdown
                .addOption('none', 'None - No logging')
                .addOption('basic', 'Basic - Essential information only')
                .addOption('detailed', 'Detailed - Comprehensive logging')
                .addOption('debug', 'Debug - Full diagnostic output')
                .setValue(this.config.loggingLevel)
                .onChange(value => {
                    this.config.loggingLevel = value as 'none' | 'basic' | 'detailed' | 'debug';
                })
            );

        // Log export toggle
        new Setting(section)
            .setName('Enable Log Export')
            .setDesc('Include logs in exported test results')
            .addToggle(toggle => toggle
                .setValue(this.config.enableLogExport)
                .onChange(value => {
                    this.config.enableLogExport = value;
                })
            );
    }

    private createControlSection(container: HTMLElement) {
        const section = container.createDiv('control-section');
        
        const buttonContainer = section.createDiv('button-container');

        // Run Tests button
        new ButtonComponent(buttonContainer)
            .setButtonText('Run Selected Tests')
            .setCta()
            .onClick(() => this.runTests());

        // Stop Tests button
        new ButtonComponent(buttonContainer)
            .setButtonText('Stop Tests')
            .setWarning()
            .onClick(() => this.stopTests());

        // Quick Test button
        new ButtonComponent(buttonContainer)
            .setButtonText('Quick Test')
            .onClick(() => this.runQuickTest());

        // Export Results button
        new ButtonComponent(buttonContainer)
            .setButtonText('Export Results')
            .onClick(() => this.exportResults());

        // Export Logs button (mirrored from Control Center)
        new ButtonComponent(buttonContainer)
            .setButtonText('Export Logs')
            .onClick(() => this.exportLogs());

        // Copy to Clipboard button
        new ButtonComponent(buttonContainer)
            .setButtonText('Copy to Clipboard')
            .onClick(() => this.copyToClipboard());
    }

    private createMetricsDisplay(container: HTMLElement) {
        const section = container.createDiv('metrics-section');
        section.createEl('h2', { text: 'Real-time Metrics' });
        
        this.metricsDisplay = section.createDiv('metrics-display');
        const placeholder = this.metricsDisplay.createDiv('metrics-placeholder');
        placeholder.textContent = 'Metrics will appear here during testing';
    }

    private createProgressDisplay(container: HTMLElement) {
        const section = container.createDiv('progress-section');
        section.createEl('h2', { text: 'Test Progress' });
        
        this.progressDisplay = section.createDiv('progress-display');
        const progressPlaceholder = this.progressDisplay.createDiv('progress-placeholder');
        progressPlaceholder.textContent = 'Test progress will appear here';
    }

    private createResultsDisplay(container: HTMLElement) {
        const section = container.createDiv('results-section');
        section.createEl('h2', { text: 'Test Results' });
        
        this.resultsDisplay = section.createDiv('results-display');
        const resultsPlaceholder = this.resultsDisplay.createDiv('results-placeholder');
        resultsPlaceholder.textContent = 'Test results will appear here';
    }

    private async runTests() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateUI();
        
        try {
            // Start performance monitoring if enabled
            if (this.config.realTimeMetrics) {
                this.performanceMonitor.start();
                this.startMetricsUpdate();
            }

            // Initialize test runner
            this.testRunner.configure({
                detailedLogging: this.config.detailedLogging,
                onProgress: (progress) => this.updateProgress(progress),
                onResults: (results) => this.handleResults(results)
            });

            // Run selected tests
            const results = await this.testRunner.runTests(this.config.selectedTests);
            this.currentResults = results;
            this.displayResults(results);

        } catch (error) {
            console.error('Test execution failed:', error);
            this.showError('Test execution failed: ' + error.message);
        } finally {
            this.isRunning = false;
            this.performanceMonitor.stop();
            this.updateUI();
        }
    }

    private async runQuickTest() {
        // Run a minimal test suite for quick validation
        const quickConfig = {
            baseline: true,
            voiceManager: true,
            effectBus: false,
            configLoader: true,
            integration: false,
            issueValidation: false
        };

        const originalConfig = { ...this.config.selectedTests };
        this.config.selectedTests = quickConfig;
        
        await this.runTests();
        
        this.config.selectedTests = originalConfig;
    }

    private stopTests() {
        if (this.isRunning) {
            this.testRunner.stop();
            this.performanceMonitor.stop();
            this.isRunning = false;
            this.updateUI();
        }
    }

    private startMetricsUpdate() {
        const updateInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(updateInterval);
                return;
            }
            
            const metrics = this.performanceMonitor.getCurrentMetrics();
            this.updateMetricsDisplay(metrics);
        }, 100); // Update every 100ms
    }

    private updateMetricsDisplay(metrics: any) {
        if (!this.metricsDisplay) return;
        
        this.metricsDisplay.empty();
        
        const grid = this.metricsDisplay.createDiv('metrics-grid');
        
        // Memory metrics
        const memoryCard = grid.createDiv('metric-card');
        memoryCard.createEl('h3', { text: 'Memory' });
        memoryCard.createEl('div', { text: `Heap: ${(metrics.memory.heapUsed / 1024 / 1024).toFixed(1)} MB` });
        memoryCard.createEl('div', { text: `Objects: ${metrics.memory.objectCount}` });
        
        // Audio metrics
        const audioCard = grid.createDiv('metric-card');
        audioCard.createEl('h3', { text: 'Audio' });
        audioCard.createEl('div', { text: `CPU: ${metrics.audio.cpuUsage.toFixed(1)}%` });
        audioCard.createEl('div', { text: `Latency: ${metrics.audio.latency.toFixed(1)}ms` });
        audioCard.createEl('div', { text: `Voices: ${metrics.audio.activeVoices}` });
        
        // Timing metrics
        const timingCard = grid.createDiv('metric-card');
        timingCard.createEl('h3', { text: 'Performance' });
        timingCard.createEl('div', { text: `Load Time: ${metrics.timing.instrumentLoadTime.toFixed(1)}ms` });
        timingCard.createEl('div', { text: `Voice Alloc: ${metrics.timing.voiceAllocationTime.toFixed(1)}ms` });
    }

    private updateProgress(progress: { current: number; total: number; currentTest: string }) {
        if (!this.progressDisplay) return;
        
        this.progressDisplay.empty();
        
        const progressBar = this.progressDisplay.createDiv('progress-bar');
        const progressFill = progressBar.createDiv('progress-fill');
        progressFill.style.width = `${(progress.current / progress.total) * 100}%`;
        
        const progressText = this.progressDisplay.createDiv('progress-text');
        progressText.textContent = `${progress.current}/${progress.total} - ${progress.currentTest}`;
    }

    private handleResults(results: TestResults) {
        this.currentResults = results;
        this.metricsCollector.addResults(results);
    }

    private displayResults(results: TestResults) {
        if (!this.resultsDisplay) return;
        
        this.resultsDisplay.empty();
        
        // Summary
        const summary = this.resultsDisplay.createDiv('results-summary');
        summary.createEl('h3', { text: 'Test Summary' });
        summary.createEl('div', { text: `Tests Run: ${results.testsRun}` });
        summary.createEl('div', { text: `Passed: ${results.passed}` });
        summary.createEl('div', { text: `Failed: ${results.failed}` });
        summary.createEl('div', { text: `Duration: ${results.duration}ms` });
        
        // Individual test results
        const details = this.resultsDisplay.createDiv('results-details');
        details.createEl('h3', { text: 'Detailed Results' });
        
        results.testDetails.forEach(test => {
            const testItem = details.createDiv('test-result-item');
            testItem.addClass(test.passed ? 'test-passed' : 'test-failed');
            testItem.createEl('strong', { text: test.name });
            testItem.createEl('span', { text: ` - ${test.passed ? 'PASS' : 'FAIL'}` });
            testItem.createEl('div', { text: `Duration: ${test.duration}ms` });
            if (test.metrics) {
                testItem.createEl('div', { text: `Metrics: ${JSON.stringify(test.metrics)}` });
            }
            if (!test.passed && test.error) {
                testItem.createEl('div', { text: `Error: ${test.error}`, cls: 'test-error' });
            }
        });
    }

    private async exportResults() {
        if (!this.currentResults) {
            this.showError('No test results to export');
            return;
        }

        try {
            const exportData = await this.reportGenerator.generateReport(
                this.currentResults, 
                this.config.exportFormat
            );
            
            // Create a note in the vault with the results
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `test-results-${timestamp}.${this.config.exportFormat === 'markdown' ? 'md' : this.config.exportFormat}`;
            
            await this.app.vault.create(filename, exportData);
            
            this.showSuccess(`Test results exported to ${filename}`);
        } catch (error) {
            this.showError('Export failed: ' + error.message);
        }
    }

    private async copyToClipboard() {
        if (!this.currentResults) {
            this.showError('No test results to copy');
            return;
        }

        try {
            const exportData = await this.reportGenerator.generateReport(
                this.currentResults, 
                'json' // Always use JSON for clipboard for easy sharing
            );
            
            await navigator.clipboard.writeText(exportData);
            this.showSuccess('Test results copied to clipboard');
        } catch (error) {
            this.showError('Copy failed: ' + error.message);
        }
    }

    private updateUI() {
        // Update button states based on running status
        const buttons = this.contentEl.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.textContent?.includes('Run')) {
                button.disabled = this.isRunning;
            } else if (button.textContent?.includes('Stop')) {
                button.disabled = !this.isRunning;
            }
        });
    }

    private showError(message: string) {
        // Create a temporary error message
        const errorEl = this.contentEl.createDiv('test-error-message');
        errorEl.setText(message);
        setTimeout(() => errorEl.remove(), 5000);
    }

    private showSuccess(message: string) {
        // Create a temporary success message
        const successEl = this.contentEl.createDiv('test-success-message');
        successEl.setText(message);
        setTimeout(() => successEl.remove(), 3000);
    }

    private async exportLogs() {
        if (!this.config.enableLogExport) {
            this.showError('Log export is disabled. Enable it in settings first.');
            return;
        }

        try {
            // Collect logs from various sources
            const logs = this.collectTestLogs();
            
            if (logs.length === 0) {
                this.showError('No logs available to export');
                return;
            }

            // Format logs based on logging level
            const formattedLogs = this.formatLogs(logs);
            
            // Create log file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `test-logs-${timestamp}.txt`;
            
            await this.app.vault.create(filename, formattedLogs);
            
            this.showSuccess(`Test logs exported to ${filename}`);
        } catch (error) {
            this.showError('Log export failed: ' + error.message);
        }
    }

    private collectTestLogs(): any[] {
        // Collect logs from various sources based on logging level
        const logs = [];
        
        // Add system information
        if (this.config.loggingLevel !== 'none') {
            logs.push({
                timestamp: Date.now(),
                level: 'info',
                source: 'system',
                message: 'Test session started',
                data: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Add test configuration
        if (this.config.loggingLevel === 'detailed' || this.config.loggingLevel === 'debug') {
            logs.push({
                timestamp: Date.now(),
                level: 'info',
                source: 'config',
                message: 'Test configuration',
                data: this.config
            });
        }

        // Add test results if available
        if (this.currentResults) {
            logs.push({
                timestamp: Date.now(),
                level: 'info',
                source: 'results',
                message: 'Test results summary',
                data: {
                    testsRun: this.currentResults.testsRun,
                    passed: this.currentResults.passed,
                    failed: this.currentResults.failed,
                    duration: this.currentResults.duration
                }
            });

            // Add detailed test logs for debug level
            if (this.config.loggingLevel === 'debug') {
                this.currentResults.testDetails.forEach(test => {
                    logs.push({
                        timestamp: test.timestamp,
                        level: test.passed ? 'info' : 'error',
                        source: 'test',
                        message: `Test: ${test.name}`,
                        data: {
                            passed: test.passed,
                            duration: test.duration,
                            error: test.error,
                            metrics: test.metrics
                        }
                    });
                });
            }
        }

        // Add performance metrics if available
        if (this.config.loggingLevel === 'debug') {
            const metrics = this.performanceMonitor.getHistoricalMetrics();
            if (metrics.length > 0) {
                logs.push({
                    timestamp: Date.now(),
                    level: 'info',
                    source: 'performance',
                    message: 'Performance metrics',
                    data: {
                        sampleCount: metrics.length,
                        latestMetrics: metrics[metrics.length - 1]
                    }
                });
            }
        }

        return logs;
    }

    private formatLogs(logs: any[]): string {
        let output = '';
        
        // Add header
        output += '='.repeat(80) + '\n';
        output += 'SONIGRAPH AUDIO ENGINE TEST LOGS\n';
        output += `Generated: ${new Date().toISOString()}\n`;
        output += `Logging Level: ${this.config.loggingLevel}\n`;
        output += '='.repeat(80) + '\n\n';

        // Format each log entry
        logs.forEach(log => {
            const timestamp = new Date(log.timestamp).toISOString();
            output += `[${timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}\n`;
            
            if (log.data && (this.config.loggingLevel === 'detailed' || this.config.loggingLevel === 'debug')) {
                output += `Data: ${JSON.stringify(log.data, null, 2)}\n`;
            }
            
            output += '\n';
        });

        // Add footer
        output += '='.repeat(80) + '\n';
        output += `Total log entries: ${logs.length}\n`;
        output += 'End of logs\n';
        output += '='.repeat(80) + '\n';

        return output;
    }

    onClose() {
        this.stopTests();
        const { contentEl } = this;
        contentEl.empty();
    }
}