// Core logging interfaces
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ILogger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	debug(category: string, message: string, data?: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	info(category: string, message: string, data?: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	warn(category: string, message: string, data?: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error(category: string, message: string, error?: any): void;
	time(operation: string): () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	withContext(context: Record<string, any>): ContextualLogger;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	enrichError(error: Error, context: Record<string, any>): Error;
}

export interface ContextualLogger extends ILogger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getContext(): Record<string, any>;
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	component: string;
	category: string;
	message: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	context?: Record<string, any>;
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private context?: Record<string, any>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(component: string, context?: Record<string, any>) {
		this.component = component;
		this.context = context;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	debug(category: string, message: string, data?: any): void {
		this.log('debug', category, message, data);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	info(category: string, message: string, data?: any): void {
		this.log('info', category, message, data);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	warn(category: string, message: string, data?: any): void {
		this.log('warn', category, message, data);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error(category: string, message: string, error?: any): void {
		this.log('error', category, message, error);
	}

	time(operation: string): () => void {
		const startTime = performance.now();
		return () => {
			const duration = performance.now() - startTime;
			this.debug('Performance', `${operation} completed in ${duration.toFixed(2)}ms`);
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	withContext(newContext: Record<string, any>): ContextualLogger {
		const mergedContext = { ...this.context, ...newContext };
		return new ContextualLoggerImpl(this.component, mergedContext);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	enrichError(error: Error, context: Record<string, any>): Error {
		// Add context to error without modifying original
		interface EnrichedError extends Error {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			context?: Record<string, any>;
		}
		const enrichedError = new Error(error.message) as EnrichedError;
		enrichedError.name = error.name;
		enrichedError.stack = error.stack;
		enrichedError.context = { ...this.context, ...context };
		return enrichedError;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private log(level: LogLevel, category: string, message: string, data?: any): void {
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
		this.output(entry);
	}

	private output(entry: LogEntry): void {
		// Always collect logs for export regardless of current log level
		LoggerFactory.collectLog(entry);
		
		// Only output to console if the log level is appropriate
		if (LOG_LEVELS[entry.level] <= LoggerFactory.getLogLevelValue()) {
			const contextStr = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
			const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
			const logMessage = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] [${entry.component}/${entry.category}]${contextStr} ${entry.message}${dataStr}`;
			switch (entry.level) {
				case 'debug':
					console.debug(logMessage);
					break;
				case 'info':
					console.info(logMessage);
					break;
				case 'warn':
					console.warn(logMessage);
					break;
				case 'error':
					console.error(logMessage);
					break;
			}
		}
	}
}

class ContextualLoggerImpl extends Logger implements ContextualLogger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private context: Record<string, any>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(component: string, context: Record<string, any>) {
		super(component, context);
		this.context = context;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getContext(): Record<string, any> {
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
		return this.loggers.get(component)!;
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	initialize(config?: any): void {
		// Future: Add configuration support
		if (config && config.logLevel) {
			LoggerFactory.setLogLevel(config.logLevel);
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