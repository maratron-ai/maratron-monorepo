/**
 * @jest-environment node
 */

import { hashPassword, verifyPassword, generateSecurePassword } from '../passwordUtils';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password and return a string', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 characters
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should throw error for undefined password', async () => {
      await expect(hashPassword(undefined as never)).rejects.toThrow('Password cannot be empty');
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(longPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password against hash', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password against hash', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const hash = await hashPassword('testPassword123!');
      await expect(verifyPassword('', hash)).rejects.toThrow('Password cannot be empty');
    });

    it('should reject empty hash', async () => {
      await expect(verifyPassword('testPassword123!', '')).rejects.toThrow('Hash cannot be empty');
    });

    it('should reject invalid hash format', async () => {
      const isValid = await verifyPassword('testPassword123!', 'invalidhash');
      expect(isValid).toBe(false);
    });

    it('should handle password with special characters', async () => {
      const password = 'test!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate a password of default length (12)', () => {
      const password = generateSecurePassword();
      
      expect(typeof password).toBe('string');
      expect(password.length).toBe(12);
    });

    it('should generate a password of specified length', () => {
      const length = 16;
      const password = generateSecurePassword(length);
      
      expect(password.length).toBe(length);
    });

    it('should generate different passwords on multiple calls', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });

    it('should generate password with mixed character types', () => {
      const password = generateSecurePassword(20);
      
      // Should contain at least one lowercase
      expect(/[a-z]/.test(password)).toBe(true);
      // Should contain at least one uppercase
      expect(/[A-Z]/.test(password)).toBe(true);
      // Should contain at least one number
      expect(/[0-9]/.test(password)).toBe(true);
      // Should contain at least one special character
      expect(/[!@#$%^&*]/.test(password)).toBe(true);
    });

    it('should throw error for invalid length', () => {
      expect(() => generateSecurePassword(0)).toThrow('Password length must be at least 8');
      expect(() => generateSecurePassword(7)).toThrow('Password length must be at least 8');
      expect(() => generateSecurePassword(-1)).toThrow('Password length must be at least 8');
    });
  });

  describe('Security Requirements', () => {
    it('should use bcrypt with sufficient salt rounds (timing test)', async () => {
      const password = 'testPassword123!';
      const startTime = Date.now();
      await hashPassword(password);
      const endTime = Date.now();
      
      // bcrypt with 12 rounds should take some time (at least 100ms)
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThan(50); // Minimum time indicating proper salt rounds
    });

    it('should produce bcrypt-formatted hash', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      
      // bcrypt hash format: $2a$rounds$salt+hash (60 chars total)
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
    });
  });
});