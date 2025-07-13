/**
 * Structured logging utility for production-ready logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  correlationId?: string;
  service?: string;
}

class Logger {
  private service: string;
  private isDevelopment: boolean;

  constructor(service: string) {
    this.service = service;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
    };
    
    if (context) {
      // Extract correlationId if present and add it to top level
      if (context.correlationId) {
        entry.correlationId = context.correlationId as string;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correlationId: _, ...restContext } = context;
        if (Object.keys(restContext).length > 0) {
          entry.context = restContext;
        }
      } else {
        entry.context = context;
      }
    }
    
    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // In development, use colored console output
      const color = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      }[entry.level];
      const reset = '\x1b[0m';
      
      console.log(
        `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} [${entry.service}] ${entry.message}`,
        entry.context ? entry.context : ''
      );
    } else {
      // In production, output structured JSON
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.LOG_LEVEL === 'debug' || this.isDevelopment) {
      this.output(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    this.output(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.formatLog('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }
    
    this.output(this.formatLog('error', message, errorContext));
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.service);
    const originalOutput = childLogger.output.bind(childLogger);
    
    childLogger.output = (entry: LogEntry) => {
      entry.context = { ...additionalContext, ...entry.context };
      originalOutput(entry);
    };
    
    return childLogger;
  }
}

// Export factory function to create loggers
export function createLogger(service: string): Logger {
  return new Logger(service);
}

// Pre-configured loggers for common services
export const apiLogger = createLogger('api');
export const dbLogger = createLogger('database');
export const authLogger = createLogger('auth');
export const trpcLogger = createLogger('trpc');

// Helper function for request logging
export function logRequest(
  logger: Logger,
  method: string,
  path: string,
  context?: LogContext
): void {
  logger.info(`${method} ${path}`, {
    ...context,
    request: { method, path },
  });
}

// Helper function for response logging
export function logResponse(
  logger: Logger,
  method: string,
  path: string,
  status: number,
  duration: number,
  context?: LogContext
): void {
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  
  logger[level](`${method} ${path} ${status} ${duration}ms`, {
    ...context,
    response: { status, duration },
  });
}