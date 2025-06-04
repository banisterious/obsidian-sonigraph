# Logging System Documentation

## Overview

The Sonigraph plugin includes a robust, modular logging system designed with the following principles:

- **Flexibility**: Support for multiple output targets (console, file, notices)
- **Performance**: Minimal overhead, especially for disabled log levels
- **Testability**: Easy to mock and verify in tests
- **Defensive Coding**: Built with reliability in mind
- **Extensibility**: Easy to add new outputs or formatters

## Architecture

### Core Components

- **LogManager**: Central singleton managing all loggers and adapters
- **Logger**: Implementation of the ILogger interface
- **LoggerFactory**: Creates and configures loggers
- **SafeLogger**: Simple logger for early initialization

### Adapters

- **ConsoleAdapter**: Logs to the browser console
- **FileAdapter**: Logs to files with rotation
- **NoticeAdapter**: Shows logs as Obsidian notices
- **NullAdapter**: No-op adapter for testing

### Formatters

- **StandardFormatter**: Default text formatting

### Interfaces

- **ILogger**: Core logging interface
- **LogAdapter**: Interface for output adapters
- **LogFormatter**: Interface for message formatting
- **ContextualLogger**: Extended logger with context

## Usage Examples

### Basic Usage

```typescript
import { getLogger } from 'src/logging';

// Get a logger for a component
const logger = getLogger('MyComponent');

// Log at different levels
logger.debug('Operation', 'Starting operation', { id: 123 });
logger.info('Operation', 'Operation completed successfully');
logger.warn('Validation', 'Data format is deprecated');
logger.error('API', 'Failed to fetch data', error);
```

### Contextual Logging

```typescript
import { getLogger } from 'src/logging';

const logger = getLogger('Authentication');

// Create a context-aware logger
const userLogger = logger.withContext({ 
  userId: user.id, 
  sessionId: session.id 
});

// All logs include the context automatically
userLogger.info('Login', 'User logged in successfully');
userLogger.debug('Permissions', 'Loading user permissions');
```

### Error Enrichment

```typescript
import { getLogger } from 'src/logging';

const logger = getLogger('DataService');

try {
  // ...operation that might fail
} catch (error) {
  // Enrich the error with context
  throw logger.enrichError(error, {
    component: 'DataService',
    operation: 'fetchUserData',
    metadata: {
      userId: userId,
      timestamp: Date.now()
    }
  });
}
```

### Performance Timing

```typescript
import { getLogger } from 'src/logging';

const logger = getLogger('Performance');

function expensiveOperation() {
  // Start a timer
  const endTimer = logger.time('expensiveOperation');
  
  // ... do work
  
  // End the timer and log the duration
  endTimer();
}
```

## Configuration

The logging system can be configured through the LoggerFactory:

```typescript
import { loggerFactory } from 'src/logging';

// Initialize with configuration
loggerFactory.initialize({
  level: 'debug',           // Global log level
  enableConsole: true,      // Enable console output
  enableFile: true,         // Enable file output
  logFilePath: 'logs/debug.log',  // Path for log files
  maxSize: 1024 * 1024,     // 1MB max file size
  maxBackups: 3,            // Keep 3 backups
  enableNotices: true       // Show important logs as notices
});
```

## Extending the System

### Creating a Custom Adapter

```typescript
import { LogAdapter, LogEntry } from 'src/logging';

export class CustomAdapter implements LogAdapter {
  log(entry: LogEntry): void {
    // Custom implementation
  }
  
  async flush(): Promise<void> {
    // Flush any buffered logs
  }
  
  async dispose(): Promise<void> {
    // Clean up resources
  }
}
```

### Creating a Custom Formatter

```typescript
import { LogFormatter, LogEntry } from 'src/logging';

export class JSONFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify({
      level: entry.level,
      category: entry.category,
      message: entry.message,
      timestamp: entry.timestamp,
      data: entry.data
    });
  }
}
```

## Migration

For guidance on migrating from the old logging system, see the [Logging Migration Guide](./logging-migration-guide.md) 
