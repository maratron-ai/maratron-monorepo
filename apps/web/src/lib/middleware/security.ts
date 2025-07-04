// lib/middleware/security.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Security headers middleware to enhance application security
 */
export function withSecurityHeaders() {
  return function securityMiddleware(
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
      const response = await handler(request, ...args);
      
      // Add security headers
      const securityHeaders = {
        // Prevent clickjacking
        "X-Frame-Options": "DENY",
        
        // Prevent MIME type sniffing
        "X-Content-Type-Options": "nosniff",
        
        // XSS protection
        "X-XSS-Protection": "1; mode=block",
        
        // Referrer policy
        "Referrer-Policy": "strict-origin-when-cross-origin",
        
        // Content Security Policy (basic)
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Relaxed for Next.js
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "frame-ancestors 'none'"
        ].join("; "),
        
        // HSTS (only in production)
        ...(process.env.NODE_ENV === "production" && {
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
        }),
        
        // Permissions policy
        "Permissions-Policy": [
          "camera=()",
          "microphone=()",
          "geolocation=()",
          "payment=()"
        ].join(", ")
      };
      
      // Apply headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        if (value) {
          response.headers.set(key, value);
        }
      });
      
      return response;
    };
  };
}

/**
 * CORS middleware for API routes
 */
export function withCORS(options: {
  origin?: string | string[];
  credentials?: boolean;
  methods?: string[];
} = {}) {
  const {
    origin = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  } = options;
  
  return function corsMiddleware(
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': Array.isArray(origin) ? origin[0] : origin,
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': credentials.toString(),
            'Access-Control-Max-Age': '86400'
          }
        });
      }
      
      const response = await handler(request, ...args);
      
      // Add CORS headers to actual responses
      const requestOrigin = request.headers.get('origin');
      const allowedOrigin = Array.isArray(origin) 
        ? origin.includes(requestOrigin || '') ? requestOrigin : origin[0]
        : origin;
      
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      response.headers.set('Access-Control-Allow-Credentials', credentials.toString());
      
      return response;
    };
  };
}

/**
 * Request logging middleware for security monitoring
 */
export function withRequestLogging() {
  return function loggingMiddleware(
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
      const start = Date.now();
      const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
      
      try {
        const response = await handler(request, ...args);
        const duration = Date.now() - start;
        
        // Log successful requests (in production, consider using structured logging)
        if (process.env.NODE_ENV === 'development') {
          console.log(`${request.method} ${request.url} - ${response.status} - ${duration}ms - ${ip}`);
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - start;
        
        // Log errors
        console.error(`${request.method} ${request.url} - ERROR - ${duration}ms - ${ip}:`, error);
        
        throw error;
      }
    };
  };
}

/**
 * Input sanitization middleware
 */
export function withInputSanitization() {
  return function sanitizationMiddleware(
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
      // For POST/PUT requests, sanitize the body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const contentType = request.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const body = await request.json();
            
            // Basic input validation
            if (typeof body === 'object' && body !== null) {
              // Check for suspiciously large payloads
              const bodyString = JSON.stringify(body);
              if (bodyString.length > 10 * 1024 * 1024) { // 10MB limit
                return NextResponse.json(
                  { error: 'Request payload too large' },
                  { status: 413 }
                );
              }
              
              // TODO: Add more sophisticated input sanitization here
              // For now, we rely on validation in individual handlers
            }
            
            // Recreate request with sanitized body
            const sanitizedRequest = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: JSON.stringify(body)
            });
            
            return await handler(sanitizedRequest, ...args);
          }
        } catch (error) {
          // If JSON parsing fails, let the original handler deal with it
          console.warn('Input sanitization failed:', error);
        }
      }
      
      return await handler(request, ...args);
    };
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: Array<() => unknown>) {
  return function combinedMiddleware(
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return middlewares.reduceRight(
      (acc, middleware) => middleware()(acc),
      handler
    );
  };
}