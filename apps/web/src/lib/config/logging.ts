/**
 * Logging configuration for the Maratron web application
 */

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  enableConsole: boolean;
  enableStructured: boolean;
  enableFileLogging: boolean;
  logFile?: string;
  enableRequestLogging: boolean;
  enableDatabaseLogging: boolean;
  enableSecurityLogging: boolean;
  sensitiveFields: string[];
}

// Environment-based logging configuration
const getLoggingConfig = (): LoggingConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const logLevel = (process.env.LOG_LEVEL as LoggingConfig['level']) || 
    (isDevelopment ? 'debug' : 'info');

  return {
    level: logLevel,
    enableConsole: !isTest, // Disable console logs in tests
    enableStructured: !isDevelopment, // JSON logs in production
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logFile: process.env.LOG_FILE,
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enableDatabaseLogging: isDevelopment || process.env.ENABLE_DB_LOGGING === 'true',
    enableSecurityLogging: true, // Always enable security logging
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'authorization',
      'cookie',
      'session',
      'apiKey',
      'accessToken',
      'refreshToken'
    ]
  };
};

export const loggingConfig = getLoggingConfig();

// Environment variable documentation
export const LOG_ENV_VARS = {
  LOG_LEVEL: 'Set logging level: error, warn, info, debug (default: info in prod, debug in dev)',
  ENABLE_FILE_LOGGING: 'Enable file logging: true/false (default: false)',
  LOG_FILE: 'Log file path when file logging is enabled',
  ENABLE_REQUEST_LOGGING: 'Enable request/response logging: true/false (default: true)',
  ENABLE_DB_LOGGING: 'Enable database query logging: true/false (default: dev only)',
} as const;

// Helper function to check if a field is sensitive
export function isSensitiveField(fieldName: string): boolean {
  return loggingConfig.sensitiveFields.some(
    sensitive => fieldName.toLowerCase().includes(sensitive.toLowerCase())
  );
}

// Helper function to sanitize log data
export function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    }
  }
  
  return sanitized;
}