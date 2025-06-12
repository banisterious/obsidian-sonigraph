// Core logging interfaces
export interface ILogger {
	debug(category: string, message: string, data?: any): void;
	info(category: string, message: string, data?: any): void;
	warn(category: string, message: string, data?: any): void;
	error(category: string, message: string, error?: any): void;
	time(operation: string): () => void;
	withContext(context: Record<string, any>): ContextualLogger;
	enrichError(error: Error, context: Record<string, any>): Error;
}

export interface ContextualLogger extends ILogger {
	getContext(): Record<string, any>;
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	component: string;
	category: string;
	message: string;
	data?: any;
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
	private context?: Record<string, any>;

	constructor(component: string, context?: Record<string, any>) {
		this.component = component;
		this.context = context;
	}

	debug(category: string, message: string, data?: any): void {
		this.log('debug', category, message, data);
	}

	info(category: string, message: string, data?: any): void {
		this.log('info', category, message, data);
	}

	warn(category: string, message: string, data?: any): void {
		this.log('warn', category, message, data);
	}

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

	withContext(newContext: Record<string, any>): ContextualLogger {
		const mergedContext = { ...this.context, ...newContext };
		return new ContextualLoggerImpl(this.component, mergedContext);
	}

	enrichError(error: Error, context: Record<string, any>): Error {
		// Add context to error without modifying original
		const enrichedError = new Error(error.message);
		enrichedError.name = error.name;
		enrichedError.stack = error.stack;
		(enrichedError as any).context = { ...this.context, ...context };
		return enrichedError;
	}

	private log(level: LogLevel, category: string, message: string, data?: any): void {
		// Filter based on global log level
		if (LOG_LEVELS[level] > LoggerFactory.getLogLevelValue()) return;
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
		// Collect logs for export
		LoggerFactory.collectLog(entry);
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

class ContextualLoggerImpl extends Logger implements ContextualLogger {
	constructor(component: string, context: Record<string, any>) {
		super(component, context);
	}

	getContext(): Record<string, any> {
		return { ...(this as any).context };
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
	initialize(config?: any): void {
		// Future: Add configuration support
		if (config && config.logLevel) {
			LoggerFactory.setLogLevel(config.logLevel);
		}
		console.log('Logger factory initialized');
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