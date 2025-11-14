// Core logging interfaces
 
export interface ILogger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
	debug(category: string, message: string, data?: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
	info(category: string, message: string, data?: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
	warn(category: string, message: string, data?: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
	error(category: string, message: string, error?: any): void;
	time(operation: string): () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context allows arbitrary metadata keys
	withContext(context: Record<string, any>): ContextualLogger;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Error context allows arbitrary metadata
	enrichError(error: Error, context: Record<string, any>): Error;
}

export interface ContextualLogger extends ILogger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context contains arbitrary metadata keys
	getContext(): Record<string, any>;
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	component: string;
	category: string;
	message: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Log data can be any serializable value
	data?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context allows arbitrary metadata keys
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context stores arbitrary metadata
	private context?: Record<string, any>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context accepts arbitrary metadata keys
	constructor(component: string, context?: Record<string, any>) {
		this.component = component;
		this.context = context;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
	debug(category: string, message: string, data?: any): void {
		this.log('debug', category, message, data);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
	info(category: string, message: string, data?: any): void {
		this.log('info', category, message, data);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
	warn(category: string, message: string, data?: any): void {
		this.log('warn', category, message, data);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Console methods accept variadic arguments of any type
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context accepts arbitrary metadata keys
	withContext(newContext: Record<string, any>): ContextualLogger {
		const mergedContext = { ...this.context, ...newContext };
		return new ContextualLoggerImpl(this.component, mergedContext);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Error context allows arbitrary metadata
	enrichError(error: Error, context: Record<string, any>): Error {
		// Add context to error without modifying original
		interface EnrichedError extends Error {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Error context stores arbitrary metadata
			context?: Record<string, any>;
		}
		const enrichedError = new Error(error.message) as EnrichedError;
		enrichedError.name = error.name;
		enrichedError.stack = error.stack;
		enrichedError.context = { ...this.context, ...context };
		return enrichedError;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Log data accepts any serializable value
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context stores arbitrary metadata
	private context: Record<string, any>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context stores arbitrary metadata
	constructor(component: string, context: Record<string, any>) {
		super(component, context);
		this.context = context;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Context contains arbitrary metadata keys
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