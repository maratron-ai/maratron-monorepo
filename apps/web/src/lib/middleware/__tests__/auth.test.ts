/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  requireAuth, 
  requireResourceOwnership, 
  unauthorizedResponse, 
  forbiddenResponse, 
  withAuth,
  AuthResult
} from '../auth';

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options
jest.mock('@lib/auth', () => ({
  authOptions: {
    session: { strategy: 'jwt' },
    secret: 'test-secret'
  }
}));

import { getServerSession } from 'next-auth/next';
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requireAuth', () => {
    it('should return authenticated result for valid session', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result).toEqual({
        isAuthenticated: true,
        userId: 'user-123'
      });
    });

    it('should return unauthenticated result when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await requireAuth();

      expect(result).toEqual({
        isAuthenticated: false,
        error: 'Authentication required'
      });
    });

    it('should return unauthenticated result when session has no user', async () => {
      const mockSession = {};
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result).toEqual({
        isAuthenticated: false,
        error: 'Authentication required'
      });
    });

    it('should return unauthenticated result when session user has no id', async () => {
      const mockSession = {
        user: { email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result).toEqual({
        isAuthenticated: false,
        error: 'Authentication required'
      });
    });

    it('should handle authentication errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockGetServerSession.mockRejectedValue(error);

      const result = await requireAuth();

      expect(result).toEqual({
        isAuthenticated: false,
        error: 'Authentication failed'
      });
      expect(console.error).toHaveBeenCalledWith('Authentication middleware error:', error);
    });

    it('should handle undefined session gracefully', async () => {
      mockGetServerSession.mockResolvedValue(undefined);

      const result = await requireAuth();

      expect(result).toEqual({
        isAuthenticated: false,
        error: 'Authentication required'
      });
    });
  });

  describe('requireResourceOwnership', () => {
    it('should return true when user owns the resource', async () => {
      const userId = 'user-123';
      const resourceUserId = 'user-123';

      const result = await requireResourceOwnership(userId, resourceUserId);

      expect(result).toBe(true);
    });

    it('should return false when user does not own the resource', async () => {
      const userId = 'user-123';
      const resourceUserId = 'user-456';

      const result = await requireResourceOwnership(userId, resourceUserId);

      expect(result).toBe(false);
    });

    it('should handle empty strings correctly', async () => {
      const result1 = await requireResourceOwnership('', '');
      const result2 = await requireResourceOwnership('user-123', '');
      const result3 = await requireResourceOwnership('', 'user-123');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const userId = 'user-123';
      const resourceUserId = 'USER-123';

      const result = await requireResourceOwnership(userId, resourceUserId);

      expect(result).toBe(false);
    });
  });

  describe('unauthorizedResponse', () => {
    it('should return 401 response with default message', () => {
      const response = unauthorizedResponse();
      
      expect(response.status).toBe(401);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return 401 response with custom message', () => {
      const customMessage = 'Custom unauthorized message';
      const response = unauthorizedResponse(customMessage);
      
      expect(response.status).toBe(401);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return proper JSON structure', async () => {
      const response = unauthorizedResponse('Test message');
      const data = await response.json();
      
      expect(data).toEqual({ error: 'Test message' });
    });
  });

  describe('forbiddenResponse', () => {
    it('should return 403 response with default message', () => {
      const response = forbiddenResponse();
      
      expect(response.status).toBe(403);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return 403 response with custom message', () => {
      const customMessage = 'Custom forbidden message';
      const response = forbiddenResponse(customMessage);
      
      expect(response.status).toBe(403);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return proper JSON structure', async () => {
      const response = forbiddenResponse('Access denied');
      const data = await response.json();
      
      expect(data).toEqual({ error: 'Access denied' });
    });
  });

  describe('withAuth wrapper', () => {
    const mockHandler = jest.fn();
    const mockRequest = new NextRequest('http://localhost:3000/api/test');

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should call handler when authentication succeeds', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);
      
      const expectedAuthResult: AuthResult = {
        isAuthenticated: true,
        userId: 'user-123'
      };
      
      const mockResponse = NextResponse.json({ success: true });
      mockHandler.mockResolvedValue(mockResponse);

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, expectedAuthResult);
      expect(response).toBe(mockResponse);
    });

    it('should return 401 when authentication fails', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toEqual({ error: 'Authentication required' });
    });

    it('should handle handler throwing errors', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);
      
      const handlerError = new Error('Handler failed');
      mockHandler.mockRejectedValue(handlerError);

      const wrappedHandler = withAuth(mockHandler);
      
      await expect(wrappedHandler(mockRequest)).rejects.toThrow('Handler failed');
    });

    it('should pass additional arguments to handler', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);
      
      const mockResponse = NextResponse.json({ success: true });
      mockHandler.mockResolvedValue(mockResponse);

      // Create a handler that expects additional arguments
      const handlerWithArgs = jest.fn().mockResolvedValue(mockResponse);
      const wrappedHandler = withAuth(handlerWithArgs);
      
      const additionalArg = { params: { id: '123' } };
      const response = await wrappedHandler(mockRequest, additionalArg);

      expect(handlerWithArgs).toHaveBeenCalledWith(
        mockRequest, 
        { isAuthenticated: true, userId: 'user-123' },
        additionalArg
      );
      expect(response).toBe(mockResponse);
    });

    it('should handle authentication middleware errors in wrapper', async () => {
      const error = new Error('Session service unavailable');
      mockGetServerSession.mockRejectedValue(error);

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toEqual({ error: 'Authentication failed' });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow for valid user', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      // Test complete flow
      const authResult = await requireAuth();
      expect(authResult.isAuthenticated).toBe(true);
      expect(authResult.userId).toBe('user-123');

      // Test resource ownership
      const ownsResource = await requireResourceOwnership('user-123', 'user-123');
      expect(ownsResource).toBe(true);

      // Test wrapper integration
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ data: 'success' }));
      const wrappedHandler = withAuth(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      
      const response = await wrappedHandler(request);
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request, authResult);
    });

    it('should handle complete authentication flow for unauthorized access', async () => {
      mockGetServerSession.mockResolvedValue(null);

      // Test complete flow
      const authResult = await requireAuth();
      expect(authResult.isAuthenticated).toBe(false);
      expect(authResult.error).toBe('Authentication required');

      // Test wrapper returns 401
      const mockHandler = jest.fn();
      const wrappedHandler = withAuth(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      
      const response = await wrappedHandler(request);
      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malformed session data', async () => {
      const malformedSession = {
        user: {
          id: null,
          email: 'test@example.com'
        }
      };
      mockGetServerSession.mockResolvedValue(malformedSession);

      const result = await requireAuth();
      expect(result.isAuthenticated).toBe(false);
    });

    it('should handle session with non-string user ID', async () => {
      const sessionWithNumericId = {
        user: {
          id: 123,  // numeric instead of string
          email: 'test@example.com'
        }
      };
      mockGetServerSession.mockResolvedValue(sessionWithNumericId);

      const result = await requireAuth();
      expect(result.isAuthenticated).toBe(true);
      expect(result.userId).toBe(123);
    });

    it('should not expose sensitive information in error responses', async () => {
      const sensitiveError = new Error('Database password: supersecret123');
      mockGetServerSession.mockRejectedValue(sensitiveError);

      const result = await requireAuth();
      expect(result.error).toBe('Authentication failed');
      expect(result.error).not.toContain('supersecret123');
    });
  });
});