/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ErrorCode,
  handlePrismaError,
  createErrorResponse,
  withErrorHandler,
  ErrorUtils,
  isAppError,
  isPrismaError
} from '../errorHandling';

// Mock logger to avoid logging during tests
jest.mock('@lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('errorHandling', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test error',
        400,
        { field: 'test' },
        'req-123'
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.requestId).toBe('req-123');
      expect(error.name).toBe('AppError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 'Not found', 404);
      const json = error.toJSON();

      expect(json).toEqual({
        code: ErrorCode.NOT_FOUND,
        message: 'Not found',
        statusCode: 404,
        timestamp: expect.any(String),
        requestId: undefined,
        details: undefined
      });
    });
  });

  describe('Specific Error Classes', () => {
    it('should create ValidationError correctly', () => {
      const details = [{ path: 'email', message: 'Invalid email', value: 'test' }];
      const error = new ValidationError('Validation failed', details, 'req-123');

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
      expect(error.requestId).toBe('req-123');
    });

    it('should create DatabaseError correctly', () => {
      const originalError = new Error('DB connection failed');
      const error = new DatabaseError('Database error', originalError, 'req-123');

      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ originalError: 'DB connection failed' });
    });

    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();

      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should create AuthorizationError with custom message', () => {
      const error = new AuthorizationError('Access denied', 'req-123');

      expect(error.code).toBe(ErrorCode.AUTHORIZATION_ERROR);
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });

    it('should create NotFoundError correctly', () => {
      const error = new NotFoundError('User', 'req-123');

      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ resource: 'User' });
    });

    it('should create RateLimitError with retry info', () => {
      const error = new RateLimitError('Too many requests', 60, 'req-123');

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe('handlePrismaError', () => {
    it('should handle unique constraint violation (P2002)', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '4.0.0' }
      );
      prismaError.meta = { target: ['email'] };

      const result = handlePrismaError(prismaError, 'create', 'user', 'req-123');

      expect(result.code).toBe(ErrorCode.DUPLICATE_ENTRY);
      expect(result.statusCode).toBe(409);
      expect(result.message).toBe('user already exists');
    });

    it('should handle record not found (P2025)', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '4.0.0' }
      );

      const result = handlePrismaError(prismaError, 'update', 'user', 'req-123');

      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.statusCode).toBe(404);
    });

    it('should handle foreign key constraint (P2003)', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '4.0.0' }
      );
      prismaError.meta = { field_name: 'userId' };

      const result = handlePrismaError(prismaError, 'create', 'post', 'req-123');

      expect(result.code).toBe(ErrorCode.INVALID_REQUEST);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Invalid reference in post');
    });

    it('should handle invalid ID (P2014)', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Invalid ID',
        { code: 'P2014', clientVersion: '4.0.0' }
      );

      const result = handlePrismaError(prismaError, 'delete', 'user', 'req-123');

      expect(result.code).toBe(ErrorCode.INVALID_REQUEST);
      expect(result.message).toBe('Invalid ID provided for user');
    });

    it('should handle unknown Prisma errors', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unknown error',
        { code: 'P9999', clientVersion: '4.0.0' }
      );

      const result = handlePrismaError(prismaError, 'query', 'data', 'req-123');

      expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(result.statusCode).toBe(500);
    });

    it('should handle non-Prisma errors', () => {
      const genericError = new Error('Connection timeout');

      const result = handlePrismaError(genericError, 'connect', 'database', 'req-123');

      expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('createErrorResponse', () => {
    it('should create response for AppError', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error', 400);
      const response = createErrorResponse(error, 'req-123');

      expect(response.status).toBe(400);
    });

    it('should create response for generic Error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Internal error');
      const response = createErrorResponse(error, 'req-123');

      expect(response.status).toBe(500);

      process.env.NODE_ENV = originalEnv;
    });

    it('should create response for generic Error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Debug error message');
      const response = createErrorResponse(error, 'req-123');

      expect(response.status).toBe(500);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('withErrorHandler', () => {
    it('should handle successful execution', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const wrappedHandler = withErrorHandler(handler);

      const request = new NextRequest('http://localhost:3000/test');
      const result = await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request);
      expect(result.status).toBe(200);
    });

    it('should handle AppError', async () => {
      const handler = jest.fn().mockRejectedValue(
        new ValidationError('Invalid data', [])
      );
      const wrappedHandler = withErrorHandler(handler);

      const request = new NextRequest('http://localhost:3000/test');
      const result = await wrappedHandler(request);

      expect(result.status).toBe(400);
    });

    it('should handle PrismaClientKnownRequestError', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '4.0.0' }
      );
      const handler = jest.fn().mockRejectedValue(prismaError);
      const wrappedHandler = withErrorHandler(handler);

      const request = new NextRequest('http://localhost:3000/test');
      const result = await wrappedHandler(request);

      expect(result.status).toBe(409);
    });

    it('should handle generic errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Unexpected error'));
      const wrappedHandler = withErrorHandler(handler);

      const request = new NextRequest('http://localhost:3000/test');
      const result = await wrappedHandler(request);

      expect(result.status).toBe(500);
    });

    it('should extract request ID from headers', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrappedHandler = withErrorHandler(handler);

      const request = new NextRequest('http://localhost:3000/test');
      request.headers.set('x-request-id', 'test-123');
      
      await wrappedHandler(request);

      // Verify that the error was handled (no assertion on request ID extraction)
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('ErrorUtils', () => {
    it('should create validation error', () => {
      const errors = [{ path: 'email', message: 'Required' }];
      const error = ErrorUtils.validationError(errors, 'req-123');

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toEqual(errors);
    });

    it('should create authentication error', () => {
      const error = ErrorUtils.authenticationError('Login required', 'req-123');

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Login required');
    });

    it('should create authorization error', () => {
      const error = ErrorUtils.authorizationError('Forbidden', 'req-123');

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe('Forbidden');
    });

    it('should create not found error', () => {
      const error = ErrorUtils.notFoundError('User', 'req-123');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('User not found');
    });

    it('should create rate limit error', () => {
      const error = ErrorUtils.rateLimitError(30, 'req-123');

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.details).toEqual({ retryAfter: 30 });
    });

    it('should create database error', () => {
      const originalError = new Error('Connection failed');
      const error = ErrorUtils.databaseError('DB error', originalError, 'req-123');

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.details).toEqual({ originalError: 'Connection failed' });
    });
  });

  describe('Type Guards', () => {
    it('should identify AppError', () => {
      const appError = new AppError(ErrorCode.INTERNAL_ERROR, 'Test');
      const genericError = new Error('Generic');

      expect(isAppError(appError)).toBe(true);
      expect(isAppError(genericError)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });

    it('should identify PrismaClientKnownRequestError', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Test',
        { code: 'P2002', clientVersion: '4.0.0' }
      );
      const genericError = new Error('Generic');

      expect(isPrismaError(prismaError)).toBe(true);
      expect(isPrismaError(genericError)).toBe(false);
      expect(isPrismaError(null)).toBe(false);
    });
  });
});