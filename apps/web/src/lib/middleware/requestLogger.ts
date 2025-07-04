/**
 * Request logging middleware for consistent request/response logging
 * Provides structured logging for API endpoints with performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@lib/logger';

export interface RequestLoggerOptions {
  logBody?: boolean;
  logHeaders?: boolean;
  logResponse?: boolean;
  maxBodySize?: number;
  sensitiveHeaders?: string[];
}

const DEFAULT_OPTIONS: RequestLoggerOptions = {
  logBody: false,
  logHeaders: false,
  logResponse: false,
  maxBodySize: 1024, // 1KB
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-session-id'
  ]
};

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return uuidv4();
}

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Sanitize headers by removing sensitive information
 */
function sanitizeHeaders(headers: Headers, sensitiveHeaders: string[]): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  headers.forEach((value, key) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

/**
 * Truncate body content for logging
 */
function truncateBody(body: string, maxSize: number): string {
  if (body.length <= maxSize) {
    return body;
  }
  
  return body.substring(0, maxSize) + '... (truncated)';
}

/**
 * Request logging middleware wrapper
 */
export function withRequestLogging(options: RequestLoggerOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  return function requestLoggerMiddleware<T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const requestId = generateRequestId();
      const startTime = Date.now();
      const clientIP = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      // Build request context
      const requestContext = {
        requestId,
        method: request.method,
        url: request.url,
        path: new URL(request.url).pathname,
        clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      };

      // Log request headers if enabled
      if (config.logHeaders) {
        const sanitizedHeaders = sanitizeHeaders(request.headers, config.sensitiveHeaders!);
        logger.debug('Request headers', {
          ...requestContext,
          headers: sanitizedHeaders
        });
      }

      // Log request body if enabled
      if (config.logBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const bodyText = await request.text();
          if (bodyText) {
            const truncatedBody = truncateBody(bodyText, config.maxBodySize!);
            logger.debug('Request body', {
              ...requestContext,
              body: truncatedBody,
              bodySize: bodyText.length
            });
            
            // Recreate request with the consumed body
            const newRequest = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: bodyText
            });
            
            request = newRequest;
          }
        } catch (error) {
          logger.warn('Failed to read request body for logging', {
            ...requestContext,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Log incoming request
      logger.info('API Request', requestContext);

      let response: NextResponse;
      let error: Error | null = null;

      try {
        // Call the actual handler
        response = await handler(request, ...args);
      } catch (err) {
        error = err instanceof Error ? err : new Error('Unknown error');
        
        // Log error
        logger.error('API Request Error', {
          ...requestContext,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          duration: Date.now() - startTime
        });

        // Re-throw to let error handling middleware deal with it
        throw err;
      }

      // Calculate duration
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Build response context
      const responseContext = {
        ...requestContext,
        statusCode,
        duration,
        success: statusCode >= 200 && statusCode < 400
      };

      // Log response body if enabled and not too large
      if (config.logResponse && statusCode >= 400) {
        try {
          const responseText = await response.text();
          if (responseText) {
            const truncatedResponse = truncateBody(responseText, config.maxBodySize!);
            logger.debug('Response body (error)', {
              ...responseContext,
              responseBody: truncatedResponse,
              responseSize: responseText.length
            });
            
            // Recreate response with the consumed body
            response = new NextResponse(responseText, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          }
        } catch (err) {
          logger.warn('Failed to read response body for logging', {
            ...responseContext,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      // Log response
      const logLevel = statusCode >= 400 ? 'warn' : 'info';
      logger[logLevel]('API Response', responseContext);

      // Log slow requests
      if (duration > 1000) {
        logger.warn('Slow API Request', {
          ...responseContext,
          slowRequest: true,
          threshold: 1000
        });
      }

      // Add request ID to response headers for tracing
      response.headers.set('x-request-id', requestId);

      return response;
    };
  };
}

/**
 * Performance monitoring middleware for critical endpoints
 */
export function withPerformanceMonitoring(thresholds: { warn: number; error: number } = { warn: 1000, error: 5000 }) {
  return function performanceMiddleware<T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      const response = await handler(request, ...args);
      
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      
      const performanceData = {
        path: new URL(request.url).pathname,
        method: request.method,
        duration,
        memoryDelta,
        heapUsed: endMemory.heapUsed,
        statusCode: response.status
      };

      // Log based on thresholds
      if (duration > thresholds.error) {
        logger.error('Critical performance issue', performanceData);
      } else if (duration > thresholds.warn) {
        logger.warn('Performance warning', performanceData);
      } else {
        logger.debug('Performance metrics', performanceData);
      }

      return response;
    };
  };
}

/**
 * Combined middleware for full request lifecycle logging
 */
export function withFullRequestLogging(options: RequestLoggerOptions = {}) {
  const requestLogger = withRequestLogging(options);
  const performanceMonitor = withPerformanceMonitoring();
  
  return function combinedMiddleware<T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return requestLogger(performanceMonitor(handler));
  };
}