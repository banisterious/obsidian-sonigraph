// Core logging interfaces
 
export interface ILogger {
	debug(category: string, message: string, data?: unknown): void;
	info(category: string, message: string, data?: unknown): void;
	warn(category: string, message: string, data?: unknown): void;
	error(category: string, message: string, error?: unknown): void;
	time(operation: string): () => void;
	withContext(context: Record<string, unknown>): ContextualLogger;
	enrichError(error: Error, context: Record<string, unknown>): Error;
}

export interface ContextualLogger extends ILogger {
	getContext(): Record<string, unknown>;
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	component: string;
	category: string;
	message: string;
	data?: unknown;
	context?: Record<string, unknown>;
}

export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug';

// Helper to compare log levels
const LOG_LEVELS: Record<LogLevel, number> = {
	'off': 0,
	'error': 1,
	'warn': 2,
	'info': 3,
	'debug': 4
};

// Simple Logger implementation
class Logger implements ILogger {
	private component: string;
	private context?: Record<string, unknown>;

	constructor(component: string, context?: Record<string, unknown>) {
		this.component = component;
		this.context = context;
	}

	debug(category: string, message: string, data?: unknown): void {
		void this.log('debug', category, message, data);
	}

	info(category: string, message: string, data?: unknown): void {
		void this.log('info', category, message, data);
	}

	warn(category: string, message: string, data?: unknown): void {
		void this.log('warn', category, message, data);
	}

	error(category: string, message: string, error?: unknown): void {
		void this.log('error', category, message, error);
	}

	time(operation: string): () => void {
		const startTime = performance.now();
		return () => {
			const duration = performance.now() - startTime;
			this.debug('Performance', `${operation} completed in ${duration.toFixed(2)}ms`);
		};
	}

	withContext(newContext: Record<string, unknown>): ContextualLogger {
		const mergedContext = { ...this.context, ...newContext };
		return new ContextualLoggerImpl(this.component, mergedContext);
	}

	enrichError(error: Error, context: Record<string, unknown>): Error {
		// Add context to error without modifying original
		interface EnrichedError extends Error {
			context?: Record<string, unknown>;
		}
		const enrichedError = new Error(error.message) as EnrichedError;
		enrichedError.name = error.name;
		enrichedError.stack = error.stack;
		enrichedError.context = { ...this.context, ...context };
		return enrichedError;
	}

	private log(level: LogLevel, category: string, message: string, data?: unknown): void {
		if (level === 'off') return;
		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			component: this.component,
			category,
			message,
			data,
			context: this.context
		};
		void this.output(entry);
	}

	private output(entry: LogEntry): void {
		// Always collect logs for export regardless of current log level
		void LoggerFactory.collectLog(entry);
		
		// Only output to console if the log level is appropriate
		if (LOG_LEVELS[entry.level] <= LoggerFactory.getLogLevelValue()) {
			const contextStr = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
			const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
			const logMessage = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] [${entry.component}/${entry.category}]${contextStr} ${entry.message}${dataStr}`;
			switch (entry.level) {
				case 'debug':
					void console.debug(logMessage);
					break;
				case 'info':
					void console.warn(logMessage);
					break;
				case 'warn':
					void console.warn(logMessage);
					break;
				case 'error':
					void console.error(logMessage);
					break;
			}
		}
	}
}

class ContextualLoggerImpl extends Logger implements ContextualLogger {
	private context: Record<string, unknown>;

	constructor(component: string, context: Record<string, unknown>) {
		super(component, context);
		this.context = context;
	}

	getContext(): Record<string, unknown> {
		return { ...this.context };
	}
}

// Logger factory
class LoggerFactory {
	private loggers = new Map<string, ILogger>();
	private static logLevel: LogLevel = 'warn';
	private static logs: LogEntry[] = [];

	static collectLog(entry: LogEntry) {
		LoggerFactory.logs.push(entry);
	}

	static getLogs(): LogEntry[] {
		return LoggerFactory.logs.slice();
	}

	static clearLogs() {
		LoggerFactory.logs = [];
	}

	getLogger(component: string): ILogger {
		if (!this.loggers.has(component)) {
			this.loggers.set(component, new Logger(component));
		}
		return this.loggers.get(component);
	}

	static setLogLevel(level: LogLevel) {
		LoggerFactory.logLevel = level;
	}
	static getLogLevel(): LogLevel {
		return LoggerFactory.logLevel;
	}
	static getLogLevelValue(): number {
		return LOG_LEVELS[LoggerFactory.logLevel];
	}

	// For future configuration
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Config structure varies by environment
	initialize(config?: any): void {
		// Future: Add configuration support
		if (config && config.logLevel) {
			void LoggerFactory.setLogLevel(config.logLevel);
		}
	}
}

// Global factory instance
const loggerFactory = new LoggerFactory();

// Convenience function
export function getLogger(component: string): ILogger {
	return loggerFactory.getLogger(component);
}

// Export factory for configuration
export { loggerFactory, LoggerFactory }; 