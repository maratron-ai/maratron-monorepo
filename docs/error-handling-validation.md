# 🛡️ Error Handling & Validation Best Practices

This guide covers Maratron's comprehensive error handling and input validation strategies, including the AppError class, Yup validation schemas, and security best practices.

## 🎯 Overview

Maratron implements enterprise-grade error handling and validation with:

- **Centralized Error Management** - AppError class with consistent error responses
- **Comprehensive Input Validation** - Yup schemas for all API endpoints
- **Security-First Validation** - Input sanitization and XSS prevention
- **Structured Error Responses** - Consistent API error format across all endpoints
- **Developer-Friendly Debugging** - Detailed error context in development
- **Production Security** - Sanitized error messages in production

## 🔧 AppError Class Architecture

### Core AppError Implementation

```typescript
// src/lib/errors/AppError.ts
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Static factory methods for common errors
  static badRequest(message: string, details?: any): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details?: any): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static validation(message: string, errors: any): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', errors);
  }

  static rateLimit(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', null, false);
  }

  // Convert to API response format
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}
```

### Domain-Specific Error Classes

```typescript
// src/lib/errors/RunningErrors.ts
export class RunningError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, 400, `RUNNING_${code}`, details);
  }

  static invalidDistance(distance: number): RunningError {
    return new RunningError(
      'Invalid running distance',
      'INVALID_DISTANCE',
      { provided: distance, valid: 'Must be between 0.1 and 200 miles' }
    );
  }

  static invalidPace(pace: string): RunningError {
    return new RunningError(
      'Invalid pace format',
      'INVALID_PACE',
      { provided: pace, expected: 'MM:SS format (e.g., 8:15)' }
    );
  }

  static vdotCalculationFailed(reason: string): RunningError {
    return new RunningError(
      'VDOT calculation failed',
      'VDOT_CALCULATION_FAILED',
      { reason }
    );
  }
}

// src/lib/errors/AuthErrors.ts
export class AuthError extends AppError {
  constructor(message: string, code: string) {
    super(message, 401, `AUTH_${code}`);
  }

  static invalidCredentials(): AuthError {
    return new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  static tokenExpired(): AuthError {
    return new AuthError('Authentication token expired', 'TOKEN_EXPIRED');
  }

  static sessionNotFound(): AuthError {
    return new AuthError('Session not found', 'SESSION_NOT_FOUND');
  }
}

// src/lib/errors/CacheErrors.ts
export class CacheError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, 500, `CACHE_${code}`, details);
  }

  static connectionFailed(redisUrl: string): CacheError {
    return new CacheError(
      'Cache connection failed',
      'CONNECTION_FAILED',
      { redisUrl: redisUrl.replace(/:\w+@/, ':***@') } // Mask credentials
    );
  }

  static invalidationFailed(keys: string[]): CacheError {
    return new CacheError(
      'Cache invalidation failed',
      'INVALIDATION_FAILED',
      { affectedKeys: keys.length, sampleKeys: keys.slice(0, 3) }
    );
  }
}
```

## 📝 Input Validation with Yup

### Base Validation Schemas

```typescript
// src/lib/validation/base.ts
import * as yup from 'yup';

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  pace: /^(\d{1,2}):([0-5]\d)$/,
  duration: /^(\d{1,2}):([0-5]\d):([0-5]\d)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

// Base schemas for reuse
export const baseSchemas = {
  id: yup.string().uuid('Invalid ID format').required('ID is required'),
  email: yup
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .required('Password is required'),
  name: yup
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .matches(/^[a-zA-Z\s\-\'\.]+$/, 'Name contains invalid characters'),
  distance: yup
    .number()
    .positive('Distance must be positive')
    .max(200, 'Distance too large (max 200 miles)')
    .required('Distance is required'),
  pace: yup
    .string()
    .matches(validationPatterns.pace, 'Pace must be in MM:SS format')
    .test('pace-range', 'Pace must be between 3:00 and 20:00', (value) => {
      if (!value) return false;
      const [minutes, seconds] = value.split(':').map(Number);
      const totalSeconds = minutes * 60 + seconds;
      return totalSeconds >= 180 && totalSeconds <= 1200; // 3:00 to 20:00
    }),
  duration: yup
    .string()
    .matches(validationPatterns.duration, 'Duration must be in HH:MM:SS format')
    .required('Duration is required'),
};

// Sanitization helpers
export const sanitizers = {
  html: (str: string): string => {
    return str
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },
  
  sql: (str: string): string => {
    return str
      .replace(/['";\\]/g, '') // Remove SQL injection characters
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|UNION|SELECT)\b/gi, '') // Remove SQL keywords
      .trim();
  },
  
  filename: (str: string): string => {
    return str
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // Only allow safe characters
      .replace(/\.{2,}/g, '.') // Prevent directory traversal
      .substring(0, 255); // Limit length
  },
};
```

### API Endpoint Validation Schemas

```typescript
// src/lib/validation/user.ts
import * as yup from 'yup';
import { baseSchemas, sanitizers } from './base';

export const createUserSchema = yup.object({
  name: baseSchemas.name
    .transform(sanitizers.html)
    .required(),
  email: baseSchemas.email
    .transform((value) => value?.toLowerCase().trim()),
  password: baseSchemas.password,
  age: yup
    .number()
    .integer('Age must be a whole number')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Invalid age')
    .optional(),
  gender: yup
    .string()
    .oneOf(['male', 'female', 'other', 'prefer-not-to-say'], 'Invalid gender')
    .optional(),
  trainingLevel: yup
    .string()
    .oneOf(['beginner', 'intermediate', 'advanced', 'elite'], 'Invalid training level')
    .optional(),
  VDOT: yup
    .number()
    .min(20, 'VDOT too low')
    .max(85, 'VDOT too high')
    .optional(),
  goals: yup
    .array()
    .of(yup.string().max(500, 'Goal too long').transform(sanitizers.html))
    .max(5, 'Too many goals')
    .optional(),
  yearsRunning: yup
    .number()
    .integer('Years running must be a whole number')
    .min(0, 'Years running cannot be negative')
    .max(80, 'Years running too high')
    .optional(),
  weeklyMileage: yup
    .number()
    .min(0, 'Weekly mileage cannot be negative')
    .max(200, 'Weekly mileage too high')
    .optional(),
  height: yup
    .number()
    .min(36, 'Height too short (minimum 36 inches)')
    .max(108, 'Height too tall (maximum 108 inches)')
    .optional(),
  weight: yup
    .number()
    .min(50, 'Weight too low (minimum 50 lbs)')
    .max(500, 'Weight too high (maximum 500 lbs)')
    .optional(),
  defaultDistanceUnit: yup
    .string()
    .oneOf(['miles', 'kilometers'], 'Invalid distance unit')
    .default('miles'),
  defaultElevationUnit: yup
    .string()
    .oneOf(['feet', 'meters'], 'Invalid elevation unit')
    .default('feet'),
});

export const updateUserSchema = createUserSchema.partial().omit(['email', 'password']);

export const loginSchema = yup.object({
  email: baseSchemas.email,
  password: yup.string().required('Password is required'),
});
```

```typescript
// src/lib/validation/run.ts
import * as yup from 'yup';
import { baseSchemas, sanitizers } from './base';

export const createRunSchema = yup.object({
  date: yup
    .date()
    .max(new Date(), 'Run date cannot be in the future')
    .min(new Date('1900-01-01'), 'Run date too far in the past')
    .required('Date is required'),
  duration: baseSchemas.duration,
  distance: baseSchemas.distance,
  distanceUnit: yup
    .string()
    .oneOf(['miles', 'kilometers'], 'Invalid distance unit')
    .required('Distance unit is required'),
  trainingEnvironment: yup
    .string()
    .oneOf(['outdoor', 'treadmill', 'track'], 'Invalid training environment')
    .default('outdoor'),
  name: yup
    .string()
    .transform(sanitizers.html)
    .max(100, 'Run name too long')
    .optional(),
  pace: baseSchemas.pace.optional(),
  elevationGain: yup
    .number()
    .min(0, 'Elevation gain cannot be negative')
    .max(30000, 'Elevation gain too high (max 30,000 feet)')
    .optional(),
  elevationGainUnit: yup
    .string()
    .oneOf(['feet', 'meters'], 'Invalid elevation unit')
    .when('elevationGain', {
      is: (val: any) => val != null,
      then: (schema) => schema.required('Elevation unit required when elevation gain provided'),
      otherwise: (schema) => schema.optional(),
    }),
  notes: yup
    .string()
    .transform(sanitizers.html)
    .max(1000, 'Notes too long')
    .optional(),
  heartRate: yup
    .object({
      average: yup.number().min(40, 'Heart rate too low').max(220, 'Heart rate too high'),
      maximum: yup.number().min(40, 'Heart rate too low').max(220, 'Heart rate too high'),
    })
    .optional(),
  weather: yup
    .object({
      temperature: yup.number().min(-50, 'Temperature too cold').max(130, 'Temperature too hot'),
      humidity: yup.number().min(0, 'Humidity cannot be negative').max(100, 'Humidity cannot exceed 100%'),
      conditions: yup.string().oneOf([
        'sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy'
      ], 'Invalid weather condition'),
    })
    .optional(),
  userId: baseSchemas.id,
  shoeId: baseSchemas.id.optional(),
}).test('pace-consistency', 'Pace inconsistent with time and distance', function(values) {
  const { duration, distance, pace, distanceUnit } = values;
  
  if (!duration || !distance || !pace) return true; // Skip if optional fields missing
  
  // Convert duration to seconds
  const [hours, minutes, seconds] = duration.split(':').map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  // Convert distance to miles for calculation
  const distanceInMiles = distanceUnit === 'kilometers' ? distance * 0.621371 : distance;
  
  // Calculate expected pace
  const [paceMinutes, paceSeconds] = pace.split(':').map(Number);
  const paceInSeconds = paceMinutes * 60 + paceSeconds;
  
  const expectedTotalSeconds = distanceInMiles * paceInSeconds;
  const tolerance = 0.1; // 10% tolerance
  
  if (Math.abs(totalSeconds - expectedTotalSeconds) > expectedTotalSeconds * tolerance) {
    return this.createError({
      message: 'Pace, time, and distance are inconsistent',
      path: 'pace',
    });
  }
  
  return true;
});

export const updateRunSchema = createRunSchema.partial().omit(['userId']);
```

```typescript
// src/lib/validation/social.ts
import * as yup from 'yup';
import { baseSchemas, sanitizers } from './base';

export const createPostSchema = yup.object({
  content: yup
    .string()
    .transform(sanitizers.html)
    .min(1, 'Post content cannot be empty')
    .max(2000, 'Post content too long')
    .required('Content is required'),
  socialProfileId: baseSchemas.id,
  runId: baseSchemas.id.optional(),
  image: yup
    .string()
    .url('Invalid image URL')
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i, 'Invalid image format')
    .optional(),
  tags: yup
    .array()
    .of(
      yup.string()
        .transform(sanitizers.html)
        .matches(/^#[a-zA-Z0-9_]+$/, 'Invalid hashtag format')
        .max(30, 'Hashtag too long')
    )
    .max(10, 'Too many hashtags')
    .optional(),
});

export const createCommentSchema = yup.object({
  text: yup
    .string()
    .transform(sanitizers.html)
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment too long')
    .required('Comment text is required'),
  socialProfileId: baseSchemas.id,
});

export const createGroupSchema = yup.object({
  name: yup
    .string()
    .transform(sanitizers.html)
    .min(3, 'Group name too short')
    .max(100, 'Group name too long')
    .required('Group name is required'),
  description: yup
    .string()
    .transform(sanitizers.html)
    .max(1000, 'Description too long')
    .optional(),
  ownerId: baseSchemas.id,
  password: yup
    .string()
    .min(4, 'Group password too short')
    .max(50, 'Group password too long')
    .when('private', {
      is: true,
      then: (schema) => schema.required('Password required for private groups'),
      otherwise: (schema) => schema.optional(),
    }),
  private: yup.boolean().default(false),
});
```

## 🚨 Error Handling Middleware

### Global Error Handler

```typescript
// src/lib/middleware/errorHandler.ts
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export async function errorHandler(
  error: Error,
  request: NextRequest
): Promise<NextResponse> {
  // Log error details
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });

  // Report to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: {
        endpoint: request.url,
        method: request.method,
      },
      extra: {
        headers: Object.fromEntries(request.headers.entries()),
      },
    });
  }

  // Handle known AppError instances
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Yup validation errors
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors || error.message,
      },
      { status: 422 }
    );
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return handlePrismaError(error);
  }

  // Handle rate limiting errors
  if (error.message.includes('Too Many Requests')) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        details: 'Please wait before making another request',
      },
      { status: 429 }
    );
  }

  // Default to internal server error
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    { status: 500 }
  );
}

function handlePrismaError(error: any): NextResponse {
  switch (error.code) {
    case 'P2002':
      return NextResponse.json(
        {
          error: 'A record with this information already exists',
          code: 'DUPLICATE_RECORD',
          details: error.meta?.target ? `Duplicate: ${error.meta.target.join(', ')}` : undefined,
        },
        { status: 409 }
      );
    
    case 'P2025':
      return NextResponse.json(
        {
          error: 'Record not found',
          code: 'RECORD_NOT_FOUND',
        },
        { status: 404 }
      );
    
    case 'P2003':
      return NextResponse.json(
        {
          error: 'Foreign key constraint failed',
          code: 'FOREIGN_KEY_ERROR',
          details: 'Referenced record does not exist',
        },
        { status: 400 }
      );
    
    default:
      return NextResponse.json(
        {
          error: 'Database operation failed',
          code: 'DATABASE_ERROR',
          ...(process.env.NODE_ENV === 'development' && { details: error.message }),
        },
        { status: 500 }
      );
  }
}
```

### Request Validation Middleware

```typescript
// src/lib/middleware/validation.ts
import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors/AppError';
import { AnyObjectSchema } from 'yup';

export function withValidation(schema: AnyObjectSchema) {
  return async function validate(request: NextRequest, body: any) {
    try {
      // Validate and transform the request body
      const validatedData = await schema.validate(body, {
        abortEarly: false, // Collect all validation errors
        stripUnknown: true, // Remove unknown fields
      });
      
      return validatedData;
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        // Format Yup validation errors
        const details = error.inner.reduce((acc: any, err: any) => {
          acc[err.path] = err.message;
          return acc;
        }, {});
        
        throw AppError.validation('Validation failed', details);
      }
      
      throw error;
    }
  };
}

// Usage in API routes
export async function validateRequest<T>(
  request: NextRequest,
  schema: AnyObjectSchema
): Promise<T> {
  const body = await request.json().catch(() => ({}));
  const validator = withValidation(schema);
  return await validator(request, body);
}
```

## 🔒 Input Sanitization & Security

### Content Sanitization

```typescript
// src/lib/security/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '@/lib/logger';

export class InputSanitizer {
  // HTML sanitization for user content
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
    
    // Log potential XSS attempts
    if (sanitized !== input) {
      logger.warn('HTML sanitization applied', {
        original: input,
        sanitized: sanitized,
        timestamp: new Date().toISOString(),
      });
    }
    
    return sanitized;
  }

  // SQL injection prevention (additional layer beyond parameterized queries)
  static sanitizeSQL(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const dangerous = /('|(\\)|;|--|\/\*|\*\/|xp_|sp_|exec|execute|drop|create|alter|insert|update|delete|union|select|from|where)/gi;
    
    if (dangerous.test(input)) {
      logger.warn('Potential SQL injection attempt detected', {
        input: input,
        timestamp: new Date().toISOString(),
      });
      
      // Remove dangerous patterns
      return input.replace(dangerous, '');
    }
    
    return input;
  }

  // File path sanitization
  static sanitizeFilePath(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // Only alphanumeric, dash, underscore, dot
      .replace(/\.{2,}/g, '.') // Prevent directory traversal
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255); // Limit length
  }

  // URL sanitization
  static sanitizeURL(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    try {
      const url = new URL(input);
      
      // Only allow safe protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        logger.warn('Unsafe URL protocol detected', {
          url: input,
          protocol: url.protocol,
        });
        return '';
      }
      
      return url.toString();
    } catch {
      logger.warn('Invalid URL format', { url: input });
      return '';
    }
  }

  // General text sanitization
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, maxLength);
  }

  // Email sanitization
  static sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, '') // Only alphanumeric, @, dot, dash
      .substring(0, 255);
  }
}
```

### Rate Limiting with Error Handling

```typescript
// src/lib/middleware/rateLimit.ts
import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors/AppError';
import { cache } from '@/lib/cache/cache-manager';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(request: NextRequest): Promise<void> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(request)
      : this.getDefaultKey(request);
    
    const windowKey = `rate_limit:${key}:${Math.floor(Date.now() / this.config.windowMs)}`;
    
    try {
      const current = await cache.get(windowKey) || 0;
      
      if (current >= this.config.maxRequests) {
        throw AppError.rateLimit(
          `Too many requests. Limit: ${this.config.maxRequests} per ${this.config.windowMs / 1000} seconds`
        );
      }
      
      await cache.set(windowKey, current + 1, {
        ttl: Math.ceil(this.config.windowMs / 1000),
      });
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      // If rate limiting fails, log but don't block request
      console.error('Rate limiting error:', error);
    }
  }

  private getDefaultKey(request: NextRequest): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    return ip.trim();
  }
}

// Pre-configured rate limiters
export const apiRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (request) => {
    // Rate limit by IP for auth endpoints
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    return `auth:${ip.trim()}`;
  },
});

export const aiChatRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyGenerator: (request) => {
    // Rate limit by user for AI endpoints
    const userId = request.headers.get('x-user-id') || 'anonymous';
    return `ai:${userId}`;
  },
});
```

## 📋 API Route Implementation Patterns

### Standard API Route with Error Handling

```typescript
// src/app/api/runs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createRunSchema } from '@/lib/validation/run';
import { validateRequest } from '@/lib/middleware/validation';
import { errorHandler } from '@/lib/middleware/errorHandler';
import { apiRateLimit } from '@/lib/middleware/rateLimit';
import { AppError, RunningError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    await apiRateLimit.checkLimit(request);
    
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw AppError.unauthorized('Authentication required');
    }
    
    // Request validation
    const validatedData = await validateRequest(request, createRunSchema);
    
    // Business logic validation
    if (validatedData.distance <= 0) {
      throw RunningError.invalidDistance(validatedData.distance);
    }
    
    // Create run
    const run = await prisma.run.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, VDOT: true }
        },
        shoe: {
          select: { id: true, name: true, currentDistance: true }
        }
      }
    });
    
    // Update shoe mileage
    if (validatedData.shoeId) {
      await updateShoeMileage(validatedData.shoeId, validatedData.distance, validatedData.distanceUnit);
    }
    
    // Calculate and update VDOT if applicable
    const newVDOT = calculateVDOT(validatedData.distance, validatedData.duration, validatedData.distanceUnit);
    if (newVDOT && newVDOT > (run.user.VDOT || 0)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { VDOT: newVDOT }
      });
    }
    
    // Log successful creation
    logger.info('Run created successfully', {
      runId: run.id,
      userId: session.user.id,
      distance: validatedData.distance,
      duration: validatedData.duration,
    });
    
    return NextResponse.json(run, { status: 201 });
    
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await apiRateLimit.checkLimit(request);
    
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw AppError.unauthorized('Authentication required');
    }
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;
    
    // Fetch runs with pagination
    const [runs, total] = await Promise.all([
      prisma.run.findMany({
        where: { userId: session.user.id },
        orderBy: { date: 'desc' },
        take: limit,
        skip,
        include: {
          shoe: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.run.count({
        where: { userId: session.user.id }
      })
    ]);
    
    return NextResponse.json({
      runs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

// Helper functions
async function updateShoeMileage(shoeId: string, distance: number, unit: string) {
  const distanceInMiles = unit === 'kilometers' ? distance * 0.621371 : distance;
  
  await prisma.shoe.update({
    where: { id: shoeId },
    data: {
      currentDistance: {
        increment: distanceInMiles
      }
    }
  });
}

function calculateVDOT(distance: number, duration: string, unit: string): number | null {
  try {
    // VDOT calculation logic here
    // Return calculated VDOT or null if not applicable
    return null; // Placeholder
  } catch (error) {
    logger.warn('VDOT calculation failed', {
      distance,
      duration,
      unit,
      error: error.message
    });
    return null;
  }
}
```

### Error Response Format Standards

```typescript
// src/lib/types/api.ts
export interface ApiErrorResponse {
  error: string;
  code: string;
  statusCode: number;
  details?: any;
  stack?: string; // Development only
  timestamp?: string;
  requestId?: string;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Consistent response builders
export class ApiResponse {
  static success<T>(data: T, message?: string, pagination?: any): ApiSuccessResponse<T> {
    return {
      data,
      ...(message && { message }),
      ...(pagination && { pagination }),
    };
  }

  static error(error: AppError, requestId?: string): ApiErrorResponse {
    return {
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: error.statusCode,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && error.stack && { stack: error.stack }),
      ...(requestId && { requestId }),
      timestamp: new Date().toISOString(),
    };
  }
}
```

## 🧪 Testing Error Handling

### Error Handling Tests

```typescript
// src/lib/errors/__tests__/AppError.test.ts
import { AppError, RunningError, AuthError } from '../AppError';

describe('AppError', () => {
  it('should create error with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'value' });
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.details).toEqual({ field: 'value' });
    expect(error.isOperational).toBe(true);
  });

  it('should create bad request error', () => {
    const error = AppError.badRequest('Invalid input');
    
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Invalid input');
  });

  it('should create validation error with details', () => {
    const details = { email: 'Invalid email format' };
    const error = AppError.validation('Validation failed', details);
    
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
  });

  it('should convert to JSON correctly', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'value' });
    const json = error.toJSON();
    
    expect(json).toEqual({
      error: 'Test error',
      code: 'TEST_ERROR',
      statusCode: 400,
      details: { field: 'value' }
    });
  });
});

describe('RunningError', () => {
  it('should create invalid distance error', () => {
    const error = RunningError.invalidDistance(-5);
    
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('RUNNING_INVALID_DISTANCE');
    expect(error.details.provided).toBe(-5);
  });

  it('should create invalid pace error', () => {
    const error = RunningError.invalidPace('invalid');
    
    expect(error.code).toBe('RUNNING_INVALID_PACE');
    expect(error.details.provided).toBe('invalid');
    expect(error.details.expected).toBe('MM:SS format (e.g., 8:15)');
  });
});
```

### Validation Tests

```typescript
// src/lib/validation/__tests__/user.test.ts
import { createUserSchema, loginSchema } from '../user';
import { ValidationError } from 'yup';

describe('User Validation', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        age: 30,
        trainingLevel: 'intermediate'
      };
      
      const result = await createUserSchema.validate(validData);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should sanitize HTML in name', async () => {
      const data = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'john@example.com',
        password: 'SecurePass123'
      };
      
      const result = await createUserSchema.validate(data);
      expect(result.name).toBe('John Doe');
    });

    it('should require strong password', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak'
      };
      
      await expect(createUserSchema.validate(data))
        .rejects
        .toThrow('Password must be at least 8 characters');
    });

    it('should validate email format', async () => {
      const data = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123'
      };
      
      await expect(createUserSchema.validate(data))
        .rejects
        .toThrow('Invalid email format');
    });

    it('should validate VDOT range', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        VDOT: 100
      };
      
      await expect(createUserSchema.validate(data))
        .rejects
        .toThrow('VDOT too high');
    });
  });

  describe('loginSchema', () => {
    it('should validate login credentials', async () => {
      const data = {
        email: 'john@example.com',
        password: 'anypassword'
      };
      
      const result = await loginSchema.validate(data);
      expect(result.email).toBe('john@example.com');
      expect(result.password).toBe('anypassword');
    });

    it('should require both email and password', async () => {
      const data = { email: 'john@example.com' };
      
      await expect(loginSchema.validate(data))
        .rejects
        .toThrow('Password is required');
    });
  });
});
```

## 📋 Error Handling Checklist

### Development Phase
- [ ] **AppError classes defined** for all domain areas
- [ ] **Yup validation schemas** for all API endpoints
- [ ] **Input sanitization** implemented for user content
- [ ] **Rate limiting** configured for sensitive endpoints
- [ ] **Error middleware** integrated in API routes
- [ ] **Consistent error responses** across all endpoints
- [ ] **Validation error details** properly structured
- [ ] **Security logging** for suspicious activities

### Testing Phase
- [ ] **Unit tests** for all validation schemas
- [ ] **Error scenario tests** for API endpoints
- [ ] **Input sanitization tests** with malicious inputs
- [ ] **Rate limiting tests** with burst requests
- [ ] **Error response format** consistency verified
- [ ] **Security vulnerability** scanning completed

### Production Phase
- [ ] **Error monitoring** with Sentry integration
- [ ] **Log aggregation** for error analysis
- [ ] **Alert thresholds** for error rates
- [ ] **Sanitized error messages** in production
- [ ] **Performance monitoring** for validation overhead
- [ ] **Security headers** configured correctly

---

*For performance optimization, see the [Performance Monitoring Guide](./performance-monitoring.md). For caching strategies, see the [Advanced Redis Caching Guide](./redis-caching.md).*