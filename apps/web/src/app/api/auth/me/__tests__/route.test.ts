/**
 * Security tests for SMS-176: Fix Information Leakage in Error Responses
 * Tests authentication endpoint for proper error handling and data sanitization
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@lib/prisma';

// Mock crypto API
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => '12345678-1234-1234-1234-123456789abc'
  }
});

// Mock Prisma
jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('/api/auth/me security tests (SMS-176)', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Security', () => {
    it('should return standardized error for missing session', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
      expect(data.error.message).toBe('Authentication required');
      expect(data.error.timestamp).toBeDefined();
      expect(data.error.requestId).toBeDefined();
    });

    it('should return standardized error for invalid user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          Cookie: 'session_user=invalid-user-id'
        }
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
      expect(data.error.message).toBe('Authentication failed');
      expect(data.error.timestamp).toBeDefined();
      expect(data.error.requestId).toBeDefined();
    });
  });

  describe('Data Sanitization Security', () => {
    const mockUser: Record<string, unknown> = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: '$2b$10$super.secret.hash', // MUST NOT be exposed
      age: 25,
      profile: {
        id: 'profile-123',
        username: 'testuser',
        bio: 'Test bio',
        profilePhoto: 'photo-url'
      },
      selectedCoach: {
        id: 'coach-123',
        name: 'Test Coach',
        description: 'Coach description',
        icon: '🏃',
        personality: 'motivational'
      },
      sessions: [
        { id: 'session-1', sessionData: 'sensitive-session-data' } // MUST NOT be exposed
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should sanitize user data and exclude sensitive fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          Cookie: 'session_user=valid-user-id'
        }
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      
      // Should include safe data
      expect(data.id).toBe('123');
      expect(data.name).toBe('Test User');
      expect(data.email).toBe('test@example.com');
      expect(data.age).toBe(25);
      expect(data.profile).toBeDefined();
      expect(data.selectedCoach).toBeDefined();
      
      // CRITICAL: Should exclude sensitive data
      expect(data.passwordHash).toBeUndefined();
      expect(data.sessions).toBeUndefined();
    });

    it('should include only selected fields from related models', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          Cookie: 'session_user=valid-user-id'
        }
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      // Profile should only include selected fields
      expect(data.profile).toEqual({
        id: 'profile-123',
        username: 'testuser',
        bio: 'Test bio',
        profilePhoto: 'photo-url'
      });
      
      // Coach should only include selected fields
      expect(data.selectedCoach).toEqual({
        id: 'coach-123',
        name: 'Test Coach',
        description: 'Coach description',
        icon: '🏃',
        personality: 'motivational'
      });
    });
  });

  describe('Database Error Handling Security', () => {
    it('should handle Prisma errors securely without exposing system details', async () => {
      const prismaError = new Error('Database connection failed');
      prismaError.name = 'PrismaClientKnownRequestError';
      (prismaError as Error & { code: string }).code = 'P2002';
      
      mockPrisma.user.findUnique.mockRejectedValue(prismaError);
      
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          Cookie: 'session_user=valid-user-id'
        }
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
      expect(data.error.requestId).toBeDefined();
      
      // Should not expose internal error details
      expect(data.error.message).not.toContain('Database connection failed');
      expect(data.error.message).not.toContain('Prisma');
    });

    it('should handle unexpected errors gracefully in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const unexpectedError = new Error('Internal system error with sensitive details');
      mockPrisma.user.findUnique.mockRejectedValue(unexpectedError);
      
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          Cookie: 'session_user=valid-user-id'
        }
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred');
      
      // Should not expose sensitive error details in production
      expect(data.error.message).not.toContain('Internal system error');
      expect(data.error.message).not.toContain('sensitive details');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Response Structure Security', () => {
    it('should have consistent error response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
      expect(data.error.timestamp).toBeDefined();
      expect(data.error.statusCode).toBeDefined();
      expect(data.error.requestId).toBeDefined();
      
      // Should not expose sensitive fields
      expect(data.error.details).toBeUndefined();
      expect(data.error.stack).toBeUndefined();
    });

    it('should include request ID for tracking without exposing system info', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.error.requestId).toBeDefined();
      expect(typeof data.error.requestId).toBe('string');
      expect(data.error.requestId.length).toBeGreaterThan(0);
      
      // Request ID should be a UUID format (for tracking) but not expose sensitive info
      expect(data.error.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('HTTP Status Code Security', () => {
    it('should use appropriate status codes without leaking information', async () => {
      // Test authentication required
      const noSessionRequest = new NextRequest('http://localhost:3000/api/auth/me');
      const noSessionResponse = await GET(noSessionRequest);
      expect(noSessionResponse.status).toBe(401);
      
      // Test invalid user (should also be 401 to prevent user enumeration)
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const invalidUserRequest = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: { Cookie: 'session_user=invalid' }
      });
      const invalidUserResponse = await GET(invalidUserRequest);
      expect(invalidUserResponse.status).toBe(401);
    });
  });
});