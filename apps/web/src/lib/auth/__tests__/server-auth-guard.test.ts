/**
 * @jest-environment node
 */

import { redirect } from 'next/navigation';
import { 
  requireAuth, 
  getAuthSession, 
  isAuthenticated, 
  getUserId, 
  apiRequireAuth 
} from '../server-auth-guard';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options - importing from the correct path as per the source file
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {
    session: { strategy: 'jwt' },
    secret: 'test-secret'
  }
}));

import { getServerSession } from 'next-auth';
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('Server Auth Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requireAuth', () => {
    const mockSession = {
      user: { 
        id: 'user-123', 
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    it('should return session when user is authenticated', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result).toBe(mockSession);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should redirect to signin-required when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      // Mock redirect to throw to stop execution (Next.js redirect behavior)
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });

      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/signin-required');
    });

    it('should redirect to signin-required when session has no user', async () => {
      const sessionWithoutUser = {};
      mockGetServerSession.mockResolvedValue(sessionWithoutUser);

      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });

      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/signin-required');
    });

    it('should include callbackUrl in redirect query params', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const callbackUrl = '/protected-page';

      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });

      await expect(requireAuth(callbackUrl)).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/signin-required?callbackUrl=%2Fprotected-page');
    });

    it('should include message in redirect query params', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const message = 'You need to login to access this page';

      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });

      await expect(requireAuth(undefined, message)).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/signin-required?message=You+need+to+login+to+access+this+page');
    });

    it('should include both callbackUrl and message in redirect query params', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const callbackUrl = '/admin/dashboard';
      const message = 'Admin access required';

      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });

      await expect(requireAuth(callbackUrl, message)).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/signin-required?callbackUrl=%2Fadmin%2Fdashboard&message=Admin+access+required');
    });

    it('should handle special characters in query parameters', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const callbackUrl = '/page?param=value&other=test';
      const message = 'Access denied: insufficient permissions!';

      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });

      await expect(requireAuth(callbackUrl, message)).rejects.toThrow('NEXT_REDIRECT');
      
      const expectedUrl = '/signin-required?callbackUrl=%2Fpage%3Fparam%3Dvalue%26other%3Dtest&message=Access+denied%3A+insufficient+permissions%21';
      expect(mockRedirect).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('getAuthSession', () => {
    it('should return session when available', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await getAuthSession();

      expect(result).toBe(mockSession);
    });

    it('should return null when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await getAuthSession();

      expect(result).toBe(null);
    });

    it('should return null when getServerSession throws error', async () => {
      const error = new Error('Session service unavailable');
      mockGetServerSession.mockRejectedValue(error);

      const result = await getAuthSession();

      expect(result).toBe(null);
      expect(console.error).toHaveBeenCalledWith('Error getting auth session:', error);
    });

    it('should handle undefined session', async () => {
      mockGetServerSession.mockResolvedValue(undefined);

      const result = await getAuthSession();

      expect(result).toBe(undefined);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when session has no user', async () => {
      const sessionWithoutUser = {};
      mockGetServerSession.mockResolvedValue(sessionWithoutUser);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when session user is null', async () => {
      const sessionWithNullUser = { user: null };
      mockGetServerSession.mockResolvedValue(sessionWithNullUser);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when getAuthSession throws error', async () => {
      const error = new Error('Database error');
      mockGetServerSession.mockRejectedValue(error);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it('should handle truthy user objects correctly', async () => {
      const sessionWithUser = {
        user: { 
          id: 'user-123', 
          email: 'test@example.com',
          name: '' // empty string should still be truthy for user presence
        }
      };
      mockGetServerSession.mockResolvedValue(sessionWithUser);

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });
  });

  describe('getUserId', () => {
    it('should return user ID when authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await getUserId();

      expect(result).toBe('user-123');
    });

    it('should return null when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await getUserId();

      expect(result).toBe(null);
    });

    it('should return null when session has no user', async () => {
      const sessionWithoutUser = {};
      mockGetServerSession.mockResolvedValue(sessionWithoutUser);

      const result = await getUserId();

      expect(result).toBe(null);
    });

    it('should return null when user has no id', async () => {
      const sessionWithoutUserId = {
        user: { email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(sessionWithoutUserId);

      const result = await getUserId();

      expect(result).toBe(null);
    });

    it('should handle user id as null explicitly', async () => {
      const sessionWithNullId = {
        user: { id: null, email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(sessionWithNullId);

      const result = await getUserId();

      expect(result).toBe(null);
    });

    it('should handle numeric user IDs', async () => {
      const sessionWithNumericId = {
        user: { id: 123, email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(sessionWithNumericId);

      const result = await getUserId();

      expect(result).toBe(123);
    });

    it('should return null when getAuthSession throws error', async () => {
      const error = new Error('Session error');
      mockGetServerSession.mockRejectedValue(error);

      const result = await getUserId();

      expect(result).toBe(null);
    });
  });

  describe('apiRequireAuth', () => {
    it('should return session when user is authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await apiRequireAuth();

      expect(result).toBe(mockSession);
    });

    it('should throw error when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      await expect(apiRequireAuth()).rejects.toThrow('Authentication required');
    });

    it('should throw error when session has no user', async () => {
      const sessionWithoutUser = {};
      mockGetServerSession.mockResolvedValue(sessionWithoutUser);

      await expect(apiRequireAuth()).rejects.toThrow('Authentication required');
    });

    it('should throw error when user is null', async () => {
      const sessionWithNullUser = { user: null };
      mockGetServerSession.mockResolvedValue(sessionWithNullUser);

      await expect(apiRequireAuth()).rejects.toThrow('Authentication required');
    });

    it('should propagate getAuthSession errors', async () => {
      const error = new Error('Database connection failed');
      mockGetServerSession.mockRejectedValue(error);

      // The error from getAuthSession should be caught and null returned,
      // which then triggers the authentication required error
      await expect(apiRequireAuth()).rejects.toThrow('Authentication required');
    });

    it('should accept session with empty user properties', async () => {
      const sessionWithEmptyProps = {
        user: { 
          id: 'user-123', 
          email: '', 
          name: null 
        }
      };
      mockGetServerSession.mockResolvedValue(sessionWithEmptyProps);

      const result = await apiRequireAuth();

      expect(result).toBe(sessionWithEmptyProps);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow for valid user', async () => {
      const mockSession = {
        user: { 
          id: 'user-123', 
          email: 'test@example.com',
          name: 'Test User'
        }
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      // Test all functions with valid session
      const authSession = await getAuthSession();
      const authenticated = await isAuthenticated();
      const userId = await getUserId();
      const apiSession = await apiRequireAuth();
      const requiredAuth = await requireAuth();

      expect(authSession).toBe(mockSession);
      expect(authenticated).toBe(true);
      expect(userId).toBe('user-123');
      expect(apiSession).toBe(mockSession);
      expect(requiredAuth).toBe(mockSession);
    });

    it('should handle complete authentication flow for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      // Test all functions with no session
      const authSession = await getAuthSession();
      const authenticated = await isAuthenticated();
      const userId = await getUserId();

      expect(authSession).toBe(null);
      expect(authenticated).toBe(false);
      expect(userId).toBe(null);

      // These should throw/redirect
      await expect(apiRequireAuth()).rejects.toThrow('Authentication required');

      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });
      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT');
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle malformed session objects', async () => {
      const malformedSession = {
        user: 'not-an-object' // user should be an object
      };
      mockGetServerSession.mockResolvedValue(malformedSession);

      const authenticated = await isAuthenticated();
      const userId = await getUserId();

      expect(authenticated).toBe(true); // truthy value
      expect(userId).toBe(null); // can't access .id on string
    });

    it('should handle session with prototype pollution attempts', async () => {
      const maliciousSession = {
        user: { 
          id: 'user-123',
          __proto__: { isAdmin: true },
          constructor: { prototype: { isAdmin: true } }
        }
      };
      mockGetServerSession.mockResolvedValue(maliciousSession);

      const userId = await getUserId();
      const authenticated = await isAuthenticated();

      expect(userId).toBe('user-123');
      expect(authenticated).toBe(true);
      // The function should only access direct properties, not inherited ones
    });

    it('should handle circular reference in session object', async () => {
      const circularSession: any = {
        user: { id: 'user-123' }
      };
      circularSession.user.circular = circularSession;
      mockGetServerSession.mockResolvedValue(circularSession);

      // These operations should work despite circular reference
      const userId = await getUserId();
      const authenticated = await isAuthenticated();

      expect(userId).toBe('user-123');
      expect(authenticated).toBe(true);
    });

    it('should handle very large user ID', async () => {
      const sessionWithLargeId = {
        user: { 
          id: 'a'.repeat(10000), // Very large ID
          email: 'test@example.com'
        }
      };
      mockGetServerSession.mockResolvedValue(sessionWithLargeId);

      const userId = await getUserId();
      const authenticated = await isAuthenticated();

      expect(userId).toBe('a'.repeat(10000));
      expect(authenticated).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network timeout in getServerSession', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockGetServerSession.mockRejectedValue(timeoutError);

      const authSession = await getAuthSession();
      const authenticated = await isAuthenticated();

      expect(authSession).toBe(null);
      expect(authenticated).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error getting auth session:', timeoutError);
    });

    it('should handle JSON parsing errors in session', async () => {
      const parseError = new Error('JSON parse error');
      parseError.name = 'SyntaxError';
      mockGetServerSession.mockRejectedValue(parseError);

      const result = await getAuthSession();

      expect(result).toBe(null);
      expect(console.error).toHaveBeenCalledWith('Error getting auth session:', parseError);
    });

    it('should handle memory issues gracefully', async () => {
      const memoryError = new Error('Out of memory');
      memoryError.name = 'RangeError';
      mockGetServerSession.mockRejectedValue(memoryError);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });
});