/**
 * Centralized logging utility for the Maratron web application
 * Provides structured logging with appropriate levels and context
 */

import { loggingConfig, sanitizeLogData } from './config/logging';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private config = loggingConfig;

  private shouldLog(level: LogLevel): boolean {
    const levels = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.DEBUG]: 3
    };

    return levels[level] <= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): LogMessage {
    const sanitizedContext = context ? sanitizeLogData(context) : undefined;
    
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: sanitizedContext as LogContext
    };

    if (error) {
      logMessage.error = {
        name: error.name,
        message: error.message,
        stack: this.config.level === 'debug' ? error.stack : undefined
      };
    }

    return logMessage;
  }

  private output(logMessage: LogMessage): void {
    if (!this.config.enableConsole) {
      return;
    }

    if (this.config.enableStructured) {
      // JSON output for production (structured logging)
      console.log(JSON.stringify(logMessage));
    } else {
      // Pretty print for development
      const colorMap = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[37m'  // White
      };
      
      const reset = '\x1b[0m';
      const color = colorMap[logMessage.level];
      
      console.log(
        `${color}[${logMessage.timestamp}] ${logMessage.level.toUpperCase()}${reset}: ${logMessage.message}`
      );
      
      if (logMessage.context) {
        console.log('Context:', JSON.stringify(logMessage.context, null, 2));
      }
      
      if (logMessage.error) {
        console.log('Error:', logMessage.error);
      }
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const logMessage = this.formatMessage(LogLevel.ERROR, message, context, error);
    this.output(logMessage);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const logMessage = this.formatMessage(LogLevel.WARN, message, context);
    this.output(logMessage);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const logMessage = this.formatMessage(LogLevel.INFO, message, context);
    this.output(logMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const logMessage = this.formatMessage(LogLevel.DEBUG, message, context);
    this.output(logMessage);
  }

  // API-specific logging methods
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      ...context
    });
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `API Response: ${method} ${path} - ${statusCode} (${duration}ms)`;
    
    if (level === LogLevel.WARN) {
      this.warn(message, { method, path, statusCode, duration, ...context });
    } else {
      this.info(message, { method, path, statusCode, duration, ...context });
    }
  }

  apiError(method: string, path: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${method} ${path}`, {
      method,
      path,
      ...context
    }, error);
  }

  // Database operation logging
  dbQuery(operation: string, table: string, context?: LogContext): void {
    if (!this.config.enableDatabaseLogging) return;
    
    this.debug(`Database ${operation}: ${table}`, {
      operation,
      table,
      ...context
    });
  }

  dbError(operation: string, table: string, error: Error, context?: LogContext): void {
    this.error(`Database Error: ${operation} on ${table}`, {
      operation,
      table,
      ...context
    }, error);
  }

  // Security logging
  securityEvent(event: string, context?: LogContext): void {
    if (!this.config.enableSecurityLogging) return;
    
    this.warn(`Security Event: ${event}`, {
      event,
      ...context
    });
  }

  authEvent(event: string, context?: LogContext): void {
    if (!this.config.enableSecurityLogging) return;
    
    this.info(`Auth Event: ${event}`, {
      event,
      ...context
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Utility function to extract request context
export function getRequestContext(request: Request): LogContext {
  const url = new URL(request.url);
  return {
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    // Note: IP extraction would require additional headers in production
    requestId: request.headers.get('x-request-id') || undefined
  };
}

// Helper to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}