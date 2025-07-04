/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import * as Yup from 'yup';
import {
  validateRequest,
  validateQuery,
  sanitizeInputData,
  containsSuspiciousPatterns,
  validateChatMessage
} from '../apiValidator';

// Mock logger to avoid logging during tests
jest.mock('@lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('apiValidator', () => {
  describe('validateRequest', () => {
    const testSchema = Yup.object().shape({
      name: Yup.string().required(),
      age: Yup.number().positive().required(),
      email: Yup.string().email().required()
    });

    it('should validate valid request body', async () => {
      const body = { name: 'John', age: 25, email: 'john@example.com' };
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(body);
      expect(result.sanitizedData).toEqual(body);
    });

    it('should reject invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json'
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([{ path: 'body', message: 'Invalid JSON format' }]);
    });

    it('should reject wrong content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'test'
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([{ path: 'content-type', message: 'Content-Type must be application/json' }]);
    });

    it('should reject oversized requests', async () => {
      const largeBody = { data: 'x'.repeat(2000000) }; // >1MB
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(largeBody)
      });

      const result = await validateRequest(request, testSchema, { maxBodySize: 1000 });

      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toContain('Request body too large');
    });

    it('should return validation errors for invalid data', async () => {
      const invalidBody = { name: '', age: -5, email: 'invalid-email' };
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invalidBody)
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors?.some(err => err.message.includes('required'))).toBe(true);
      expect(result.errors?.some(err => err.message.includes('positive'))).toBe(true);
      expect(result.errors?.some(err => err.message.includes('email'))).toBe(true);
    });

    it('should sanitize input data', async () => {
      const body = { 
        name: '<script>alert("xss")</script>John', 
        age: 25, 
        email: 'john@example.com',
        description: 'javascript:void(0)'
      };
      const schema = Yup.object().shape({
        name: Yup.string().required(),
        age: Yup.number().required(),
        email: Yup.string().required(),
        description: Yup.string()
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await validateRequest(request, schema, { sanitize: true });

      expect(result.success).toBe(true);
      expect(result.sanitizedData?.name).toBe('John');
      expect(result.sanitizedData?.description).toBe('void(0)');
    });
  });

  describe('validateQuery', () => {
    const querySchema = Yup.object().shape({
      page: Yup.number().integer().min(0).default(0),
      limit: Yup.number().integer().min(1).max(100).default(10),
      search: Yup.string()
    });

    it('should validate query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/test?page=1&limit=20&search=test');

      const result = await validateQuery(request, querySchema);

      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
      expect(result.data?.search).toBe('test');
    });

    it('should handle missing optional parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = await validateQuery(request, querySchema);

      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(0);
      expect(result.data?.limit).toBe(10);
    });

    it('should handle multiple values for same parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/test?tags=tag1&tags=tag2');
      const multiSchema = Yup.object().shape({
        tags: Yup.array().of(Yup.string())
      });

      const result = await validateQuery(request, multiSchema);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.tags)).toBe(true);
    });

    it('should return validation errors for invalid query params', async () => {
      const request = new NextRequest('http://localhost:3000/api/test?page=-1&limit=200');

      const result = await validateQuery(request, querySchema);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      // Check that we get validation errors for page and limit
      const errorMessages = result.errors!.map(err => err.message).join(' ');
      expect(errorMessages.toLowerCase()).toContain('0');
      expect(errorMessages.toLowerCase()).toContain('100');
    });
  });

  describe('sanitizeInputData', () => {
    it('should sanitize string values', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInputData(input);
      expect(result).toBe('Hello');
    });

    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        details: {
          bio: 'javascript:void(0)',
          age: 25
        }
      };
      const result = sanitizeInputData(input) as { name: string; details: { bio: string; age: number } };
      expect(result.name).toBe('John');
      expect(result.details.bio).toBe('void(0)');
      expect(result.details.age).toBe(25);
    });

    it('should sanitize arrays', () => {
      const input = ['<script>test</script>', 'normal text', { name: 'onclick="hack()"' }];
      const result = sanitizeInputData(input) as unknown[];
      expect(result[0]).toBe('');
      expect(result[1]).toBe('normal text');
      // The onclick= pattern should be removed, leaving just the quotes
      expect((result[2] as { name: string }).name).toBe('"hack()"');
    });

    it('should handle non-string values', () => {
      const input = { number: 42, boolean: true, null: null };
      const result = sanitizeInputData(input);
      expect(result).toEqual(input);
    });
  });

  describe('containsSuspiciousPatterns', () => {
    it('should detect script tags', () => {
      expect(containsSuspiciousPatterns('<script>alert("xss")</script>')).toBe(true);
      expect(containsSuspiciousPatterns('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
    });

    it('should detect javascript: URLs', () => {
      expect(containsSuspiciousPatterns('javascript:void(0)')).toBe(true);
      expect(containsSuspiciousPatterns('JAVASCRIPT:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsSuspiciousPatterns('onclick=alert(1)')).toBe(true);
      expect(containsSuspiciousPatterns('onload=malicious()')).toBe(true);
    });

    it('should detect data URLs with HTML', () => {
      expect(containsSuspiciousPatterns('data:text/html,<script>alert(1)</script>')).toBe(true);
    });

    it('should allow safe content', () => {
      expect(containsSuspiciousPatterns('This is normal text')).toBe(false);
      expect(containsSuspiciousPatterns('https://example.com')).toBe(false);
      expect(containsSuspiciousPatterns('user@example.com')).toBe(false);
    });
  });

  describe('validateChatMessage', () => {
    it('should validate valid chat message', () => {
      const message = { role: 'user', content: 'Hello, how are you?' };
      const result = validateChatMessage(message);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedMessage).toEqual(message);
    });

    it('should reject invalid roles', () => {
      const message = { role: 'invalid', content: 'Hello' };
      const result = validateChatMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid message role');
    });

    it('should reject empty content', () => {
      const message = { role: 'user', content: '' };
      const result = validateChatMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message content cannot be empty');
    });

    it('should reject oversized messages', () => {
      const message = { role: 'user', content: 'x'.repeat(5000) };
      const result = validateChatMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message too long (max 4000 characters)');
    });

    it('should reject suspicious content', () => {
      const message = { role: 'user', content: '<script>alert("xss")</script>' };
      const result = validateChatMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message contains invalid content');
    });

    it('should sanitize valid content', () => {
      const message = { role: 'user', content: 'Hello <span>world</span>!' };
      const result = validateChatMessage(message);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedMessage?.content).toBe('Hello world!');
    });

    it('should reject non-object messages', () => {
      const result = validateChatMessage('not an object');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message must be an object');
    });

    it('should reject non-string content', () => {
      const message = { role: 'user', content: 123 };
      const result = validateChatMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message content must be a non-empty string');
    });
  });
});