/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth';
import { hashPassword } from '../utils/passwordUtils';

// Don't mock NextAuth for this test - we want to test the real implementation

// Create a test database instance with minimal logging
const prisma = new PrismaClient({
  log: [] // Disable all Prisma logging for tests
});

describe('Authentication Security', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-auth'
        }
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-auth'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('Credentials Provider Authorization', () => {
    let testUser: { id: string; name: string; email: string };

    beforeEach(async () => {
      // Create a test user with hashed password
      const passwordHash = await hashPassword('testPassword123!');
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test-auth-user@example.com',
          passwordHash,
        }
      });
    });

    afterEach(async () => {
      // Clean up after each test
      if (testUser?.id) {
        await prisma.user.delete({
          where: { id: testUser.id }
        });
      }
    });

    it('should authenticate user with correct credentials', async () => {
      const credentialsProvider = authOptions.providers[0] as any;
      
      const result = await credentialsProvider.options.authorize({
        email: 'test-auth-user@example.com',
        password: 'testPassword123!'
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('test-auth-user@example.com');
      expect(result.name).toBe('Test User');
      expect(result.passwordHash).toBeUndefined(); // Should not expose password hash
    });

    it('should reject user with incorrect password', async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      const result = await credentialsProvider.options.authorize({
        email: 'test-auth-user@example.com',
        password: 'wrongPassword123!'
      });

      expect(result).toBeNull();
    });

    it('should reject non-existent user', async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      const result = await credentialsProvider.options.authorize({
        email: 'nonexistent@example.com',
        password: 'testPassword123!'
      });

      expect(result).toBeNull();
    });

    it('should reject empty credentials', async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      const result1 = await credentialsProvider.options.authorize({
        email: '',
        password: 'testPassword123!'
      });

      const result2 = await credentialsProvider.options.authorize({
        email: 'test-auth-user@example.com',
        password: ''
      });

      const result3 = await credentialsProvider.options.authorize({});

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('should handle malformed credentials gracefully', async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      const result = await credentialsProvider.options.authorize({
        email: 'test-auth-user@example.com',
        password: null
      });

      expect(result).toBeNull();
    });
  });

  describe('Password Security Requirements', () => {
    it('should never return password hash in user object', async () => {
      const passwordHash = await hashPassword('testPassword123!');
      const testUser = await prisma.user.create({
        data: {
          name: 'Test Security User',
          email: 'test-auth-security@example.com',
          passwordHash,
        }
      });

      const credentialsProvider = authOptions.providers[0] as any;

      const result = await credentialsProvider.options.authorize({
        email: 'test-auth-security@example.com',
        password: 'testPassword123!'
      });

      expect(result).toBeDefined();
      expect(result.passwordHash).toBeUndefined();
      expect(Object.keys(result)).not.toContain('passwordHash');

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should use secure bcrypt password verification', async () => {
      // This test ensures we're using bcrypt.compare, not string comparison
      const passwordHash = await hashPassword('testPassword123!');
      const testUser = await prisma.user.create({
        data: {
          name: 'Test Bcrypt User',
          email: 'test-auth-bcrypt@example.com',
          passwordHash,
        }
      });

      const credentialsProvider = authOptions.providers[0] as any;

      // Should work with correct password
      const correctResult = await credentialsProvider.options.authorize({
        email: 'test-auth-bcrypt@example.com',
        password: 'testPassword123!'
      });

      // Should fail with password that matches hash string (if using string comparison)
      const hashMatchResult = await credentialsProvider.options.authorize({
        email: 'test-auth-bcrypt@example.com',
        password: passwordHash
      });

      expect(correctResult).toBeDefined();
      expect(hashMatchResult).toBeNull(); // This proves we're using bcrypt.compare, not string comparison

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      // Temporarily break database connection
      const originalFindUnique = prisma.user.findUnique;
      prisma.user.findUnique = jest.fn().mockRejectedValue(new Error('Database connection error'));

      const credentialsProvider = authOptions.providers[0] as any;

      const result = await credentialsProvider.options.authorize({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeNull(); // Should fail gracefully

      // Restore original function
      prisma.user.findUnique = originalFindUnique;
    });

    it('should handle corrupted password hash gracefully', async () => {
      // Create user with invalid hash
      const testUser = await prisma.user.create({
        data: {
          name: 'Test Corrupted User',
          email: 'test-auth-corrupted@example.com',
          passwordHash: 'invalid-hash-format',
        }
      });

      const credentialsProvider = authOptions.providers[0] as any;

      const result = await credentialsProvider.options.authorize({
        email: 'test-auth-corrupted@example.com',
        password: 'testPassword123!'
      });

      expect(result).toBeNull(); // Should fail gracefully with invalid hash

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
    });
  });

  describe('NextAuth Configuration Security', () => {
    it('should have secure session configuration', () => {
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.session?.maxAge).toBeDefined();
      expect(authOptions.secret).toBeDefined();
    });

    it('should have proper callback configuration', () => {
      expect(authOptions.callbacks?.session).toBeDefined();
      expect(authOptions.callbacks?.jwt).toBeDefined();
    });

    it('should have credentials provider properly configured', () => {
      const credentialsProvider = authOptions.providers[0];
      expect(credentialsProvider).toBeDefined();
      expect((credentialsProvider as any).authorize).toBeDefined();
    });
  });
});