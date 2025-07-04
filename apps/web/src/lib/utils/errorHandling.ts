/**
 * Enhanced error handling utilities with structured error responses
 * Provides consistent error handling patterns across the application
 */

import { NextResponse } from 'next/server';
import { logger } from '@lib/logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: unknown;
  path?: string;
  timestamp: string;
  requestId?: string;
  statusCode: number;
}

export interface ValidationErrorDetail {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
    this.name = 'AppError';
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      statusCode: this.statusCode
    };
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    details: ValidationErrorDetail[],
    requestId?: string
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details, requestId);
    this.name = 'ValidationError';
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    originalError?: Error,
    requestId?: string
  ) {
    super(ErrorCode.DATABASE_ERROR, message, 500, { originalError: originalError?.message }, requestId);
    this.name = 'DatabaseError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', requestId?: string) {
    super(ErrorCode.AUTHENTICATION_ERROR, message, 401, undefined, requestId);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', requestId?: string) {
    super(ErrorCode.AUTHORIZATION_ERROR, message, 403, undefined, requestId);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string, requestId?: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404, { resource }, requestId);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, requestId?: string) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, { retryAfter }, requestId);
    this.name = 'RateLimitError';
  }
}

/**
 * Handle Prisma database errors with specific error codes
 */
export function handlePrismaError(error: unknown, operation: string, resource: string, requestId?: string): AppError {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return new AppError(
          ErrorCode.DUPLICATE_ENTRY,
          `${resource} already exists`,
          409,
          { constraint: error.meta?.target, operation },
          requestId
        );
      
      case 'P2025':
        // Record not found
        return new NotFoundError(resource, requestId);
      
      case 'P2003':
        // Foreign key constraint violation
        return new AppError(
          ErrorCode.INVALID_REQUEST,
          `Invalid reference in ${resource}`,
          400,
          { constraint: error.meta?.field_name, operation },
          requestId
        );
      
      case 'P2004':
        // Database constraint violation
        return new AppError(
          ErrorCode.INVALID_REQUEST,
          `Data constraint violation in ${resource}`,
          400,
          { constraint: error.meta?.constraint, operation },
          requestId
        );
      
      case 'P2014':
        // Invalid ID
        return new AppError(
          ErrorCode.INVALID_REQUEST,
          `Invalid ID provided for ${resource}`,
          400,
          { operation },
          requestId
        );
      
      default:
        // Other Prisma errors
        return new DatabaseError(
          `Database operation failed for ${resource}`,
          error,
          requestId
        );
    }
  }
  
  // Unknown database error
  return new DatabaseError(
    `Unknown database error for ${resource}`,
    error instanceof Error ? error : new Error('Unknown error'),
    requestId
  );
}

/**
 * Create error response with consistent format
 */
export function createErrorResponse(error: AppError | Error, requestId?: string): NextResponse {
  let errorDetails: ErrorDetails;
  
  if (error instanceof AppError) {
    errorDetails = error.toJSON();
  } else {
    // Handle unexpected errors
    errorDetails = {
      code: ErrorCode.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      timestamp: new Date().toISOString(),
      requestId,
      statusCode: 500
    };
  }
  
  // Log error
  logger.error('API Error', {
    error: errorDetails,
    stack: error.stack,
    requestId
  });
  
  return NextResponse.json({ error: errorDetails }, { status: errorDetails.statusCode });
}

/**
 * Error handler middleware wrapper
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request ID if available
      const requestId = args[0] && typeof args[0] === 'object' && 'headers' in args[0] 
        ? (args[0] as { headers?: { get?: (key: string) => string | null } }).headers?.get?.('x-request-id') 
        : undefined;
      
      if (error instanceof AppError) {
        return createErrorResponse(error, requestId);
      }
      
      // Handle specific error types
      if (error instanceof PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error, 'unknown', 'resource', requestId);
        return createErrorResponse(appError, requestId);
      }
      
      // Handle unexpected errors
      const appError = new AppError(
        ErrorCode.INTERNAL_ERROR,
        process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error instanceof Error ? error.message : 'Unknown error',
        500,
        undefined,
        requestId
      );
      
      return createErrorResponse(appError, requestId);
    }
  };
}

/**
 * Utility functions for common error scenarios
 */
export const ErrorUtils = {
  /**
   * Create validation error from validation results
   */
  validationError: (errors: ValidationErrorDetail[], requestId?: string) => {
    return new ValidationError(
      'Validation failed',
      errors,
      requestId
    );
  },

  /**
   * Create authentication error
   */
  authenticationError: (message?: string, requestId?: string) => {
    return new AuthenticationError(message, requestId);
  },

  /**
   * Create authorization error
   */
  authorizationError: (message?: string, requestId?: string) => {
    return new AuthorizationError(message, requestId);
  },

  /**
   * Create not found error
   */
  notFoundError: (resource: string, requestId?: string) => {
    return new NotFoundError(resource, requestId);
  },

  /**
   * Create rate limit error
   */
  rateLimitError: (retryAfter?: number, requestId?: string) => {
    return new RateLimitError(undefined, retryAfter, requestId);
  },

  /**
   * Create database error
   */
  databaseError: (message: string, originalError?: Error, requestId?: string) => {
    return new DatabaseError(message, originalError, requestId);
  }
};

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a Prisma error
 */
export function isPrismaError(error: unknown): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError;
}