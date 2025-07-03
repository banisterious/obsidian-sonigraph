# Logging System Architecture

## Table of Contents

- [1. Architecture](#1-architecture)
- [2. Components](#2-components)
- [3. Usage Patterns](#3-usage-patterns)
- [4. Configuration](#4-configuration)

---

## 1. Architecture

The logging system provides enterprise-grade logging capabilities with flexibility, performance, and extensibility.

**Core Principles:**
- **Flexibility**: Multiple output targets (console, file, notices)
- **Performance**: Minimal overhead, especially for disabled log levels
- **Testability**: Easy to mock and verify in tests
- **Defensive Coding**: Built with reliability in mind
- **Extensibility**: Easy to add new outputs or formatters

## 2. Components

**Core Components:**
- **LogManager**: Central singleton managing all loggers and adapters
- **Logger**: Implementation of the ILogger interface
- **LoggerFactory**: Creates and configures loggers
- **SafeLogger**: Simple logger for early initialization

**Adapters:**
- **ConsoleAdapter**: Logs to the browser console
- **FileAdapter**: Logs to files with rotation
- **NoticeAdapter**: Shows logs as Obsidian notices
- **NullAdapter**: No-op adapter for testing

**Formatters:**
- **StandardFormatter**: Default text formatting
- **JSONFormatter**: Structured JSON output for analysis

**Interfaces:**
```typescript
interface ILogger {
  debug(category: string, message: string, data?: any): void;
  info(category: string, message: string, data?: any): void;
  warn(category: string, message: string, data?: any): void;
  error(category: string, message: string, error?: Error): void;
  time(operation: string): () => void;
  enrichError(error: Error, context: any): Error;
  withContext(context: any): ContextualLogger;
}
```

## 3. Usage Patterns

**Basic Usage:**
```typescript
import { getLogger } from 'src/logging';

const logger = getLogger('AudioEngine');

// Standard logging
logger.debug('initialization', 'Starting audio engine setup');
logger.info('playback', 'Sequence started successfully');
logger.warn('performance', 'High CPU usage detected');
logger.error('audio', 'Failed to initialize synthesizer', error);
```

**Contextual Logging:**
```typescript
const userLogger = logger.withContext({ 
  userId: user.id, 
  sessionId: session.id 
});

// All logs include context automatically
userLogger.info('login', 'User logged in successfully');
```

**Performance Timing:**
```typescript
function expensiveOperation() {
  const endTimer = logger.time('expensiveOperation');
  // ... do work
  endTimer(); // Logs duration automatically
}
```

## 4. Configuration

```typescript
interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath: string;
  maxSize: number;
  maxBackups: number;
  enableNotices: boolean;
}

// Initialize with configuration
loggerFactory.initialize({
  level: 'debug',
  enableConsole: true,
  enableFile: true,
  logFilePath: 'logs/debug.log',
  maxSize: 1024 * 1024, // 1MB
  maxBackups: 3,
  enableNotices: true
});
```

---

*For related documentation, see:*
- [Overview](overview.md) - System integration
- [Audio Engine](audio-engine.md) - Performance monitoring integration
- [UI Components](ui-components.md) - User interface logging