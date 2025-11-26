/**
 * Logging utility for the MirrorMe application.
 * Provides structured logging with different log levels and optional context.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // In production, default to INFO level. In development, use DEBUG.
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Sets the minimum log level.
   * Messages below this level will not be logged.
   * 
   * @param level - Minimum log level to display
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Formats a log message with context.
   * 
   * @param level - Log level name
   * @param message - Log message
   * @param context - Optional context object
   * @returns Formatted log string
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Logs a debug message.
   * Only shown in development mode by default.
   * 
   * @param message - Debug message
   * @param context - Optional context object
   */
  debug(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Logs an info message.
   * 
   * @param message - Info message
   * @param context - Optional context object
   */
  info(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * Logs a warning message.
   * 
   * @param message - Warning message
   * @param context - Optional context object
   */
  warn(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  /**
   * Logs an error message.
   * 
   * @param message - Error message
   * @param error - Error object or context
   */
  error(message: string, error?: Error | LogContext): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const context = error instanceof Error 
        ? { error: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  /**
   * Logs performance metrics.
   * 
   * @param operation - Name of the operation
   * @param duration - Duration in milliseconds
   * @param context - Optional context object
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(this.formatMessage('PERF', `${operation} took ${duration}ms`, context));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Convenience function to create a scoped logger with a prefix.
 * 
 * @param prefix - Prefix to add to all log messages
 * @returns Scoped logger instance
 * 
 * @example
 * ```typescript
 * const scanLogger = createScopedLogger('Scan');
 * scanLogger.info('Processing scan'); // [INFO] Scan: Processing scan
 * ```
 */
export function createScopedLogger(prefix: string) {
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(`${prefix}: ${message}`, context),
    info: (message: string, context?: LogContext) => 
      logger.info(`${prefix}: ${message}`, context),
    warn: (message: string, context?: LogContext) => 
      logger.warn(`${prefix}: ${message}`, context),
    error: (message: string, error?: Error | LogContext) => 
      logger.error(`${prefix}: ${message}`, error),
    performance: (operation: string, duration: number, context?: LogContext) =>
      logger.performance(`${prefix}.${operation}`, duration, context),
  };
}

