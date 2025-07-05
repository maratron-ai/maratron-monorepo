/**
 * Standardized API validation utility using existing Yup schemas
 * Provides consistent validation across all API routes
 */

import { NextRequest } from 'next/server';
import { Schema, ValidationError } from 'yup';
import { logger } from '@lib/logger';

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: string;
    message: string;
  }>;
  sanitizedData?: T;
}

export interface ValidationOptions {
  requireAuth?: boolean;
  sanitize?: boolean;
  logValidation?: boolean;
  maxBodySize?: number;
}

/**
 * Validate request body against a Yup schema
 */
export async function validateRequest<T = unknown>(
  request: NextRequest,
  schema: Schema<T>,
  options: ValidationOptions = {}
): Promise<ValidationResult<T>> {
  const {
    sanitize = true,
    logValidation = true,
    maxBodySize = 1024 * 1024 // 1MB default
  } = options;

  try {
    // Check content type for JSON requests
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return {
        success: false,
        errors: [{ path: 'content-type', message: 'Content-Type must be application/json' }]
      };
    }

    // Read and parse body
    const body = await request.text();
    
    // Check body size
    if (body.length > maxBodySize) {
      return {
        success: false,
        errors: [{ path: 'body', message: `Request body too large (max ${maxBodySize} bytes)` }]
      };
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return {
        success: false,
        errors: [{ path: 'body', message: 'Invalid JSON format' }]
      };
    }

    // Validate against schema
    const validatedData = await schema.validate(parsedBody, { 
      abortEarly: false,
      stripUnknown: true 
    });

    // Sanitize if requested
    const finalData = sanitize ? sanitizeInputData(validatedData) : validatedData;

    if (logValidation) {
      logger.debug('API validation successful', {
        path: request.url,
        method: request.method,
        fieldsValidated: Object.keys(finalData || {}).length
      });
    }

    return {
      success: true,
      data: finalData,
      sanitizedData: finalData
    };

  } catch (error) {
    if (error instanceof ValidationError) {
      const validationErrors = error.inner.map(err => ({
        path: err.path || 'unknown',
        message: err.message
      }));

      if (logValidation) {
        logger.warn('API validation failed', {
          path: request.url,
          method: request.method,
          errors: validationErrors
        });
      }

      return {
        success: false,
        errors: validationErrors
      };
    }

    // Log unexpected errors
    logger.error('API validation error', {
      path: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      errors: [{ path: 'unknown', message: 'Validation failed' }]
    };
  }
}

/**
 * Validate query parameters against a schema
 */
export async function validateQuery<T = unknown>(
  request: NextRequest,
  schema: Schema<T>,
  options: ValidationOptions = {}
): Promise<ValidationResult<T>> {
  const { logValidation = true } = options;

  try {
    const { searchParams } = new URL(request.url);
    const queryObject: Record<string, string | string[]> = {};

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      if (queryObject[key]) {
        // Multiple values for same key
        if (Array.isArray(queryObject[key])) {
          (queryObject[key] as string[]).push(value);
        } else {
          queryObject[key] = [queryObject[key] as string, value];
        }
      } else {
        queryObject[key] = value;
      }
    });

    // Validate against schema
    const validatedData = await schema.validate(queryObject, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (logValidation) {
      logger.debug('Query validation successful', {
        path: request.url,
        method: request.method,
        params: Object.keys(validatedData || {}).length
      });
    }

    return {
      success: true,
      data: validatedData
    };

  } catch (error) {
    if (error instanceof ValidationError) {
      const validationErrors = error.inner.map(err => ({
        path: err.path || 'unknown',
        message: err.message
      }));

      if (logValidation) {
        logger.warn('Query validation failed', {
          path: request.url,
          method: request.method,
          errors: validationErrors
        });
      }

      return {
        success: false,
        errors: validationErrors
      };
    }

    logger.error('Query validation error', {
      path: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      errors: [{ path: 'unknown', message: 'Query validation failed' }]
    };
  }
}

/**
 * Sanitize input data to prevent XSS and injection attacks
 */
export function sanitizeInputData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags and content
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:text\/html/gi, '') // Remove data URLs with HTML
      .replace(/vbscript:/gi, '') // Remove VBScript
      .replace(/expression\s*\(/gi, '') // Remove CSS expressions
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInputData(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key as well
      const sanitizedKey = key.replace(/[<>]/g, '').trim();
      sanitized[sanitizedKey] = sanitizeInputData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Check if a string contains suspicious patterns that might indicate an attack
 */
export function containsSuspiciousPatterns(content: string): boolean {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /@import/gi,
    /url\s*\(/gi
  ];

  return suspiciousPatterns.some(pattern => pattern.test(content));
}

/**
 * Enhanced chat message validation with content sanitization
 */
export function validateChatMessage(message: unknown): { isValid: boolean; error?: string; sanitizedMessage?: { role: 'user' | 'assistant' | 'system'; content: string } } {
  if (!message || typeof message !== 'object') {
    return { isValid: false, error: 'Message must be an object' };
  }

  const { role, content } = message as { role: unknown; content: unknown };

  // Validate role
  if (!role || !['user', 'assistant', 'system'].includes(role as string)) {
    return { isValid: false, error: 'Invalid message role' };
  }

  const validRole = role as 'user' | 'assistant' | 'system';

  // Validate content
  if (typeof content !== 'string') {
    return { isValid: false, error: 'Message content must be a non-empty string' };
  }

  // Check content length (reasonable limits)
  if (content.length > 4000) {
    return { isValid: false, error: 'Message too long (max 4000 characters)' };
  }

  if (content.trim().length < 1) {
    return { isValid: false, error: 'Message content cannot be empty' };
  }

  // Check for suspicious patterns
  if (containsSuspiciousPatterns(content)) {
    return { isValid: false, error: 'Message contains invalid content' };
  }

  // Sanitize content
  const sanitizedContent = sanitizeInputData(content);

  return {
    isValid: true,
    sanitizedMessage: {
      role: validRole,
      content: sanitizedContent
    }
  };
}