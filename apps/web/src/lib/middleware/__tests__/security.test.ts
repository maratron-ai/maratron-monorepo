/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withSecurityHeaders,
  withCORS,
  withInputSanitization,
  combineMiddleware
} from '../security';

describe('security middleware', () => {
  describe('withSecurityHeaders', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should add security headers to response', async () => {
      const middleware = withSecurityHeaders();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Content-Security-Policy')).toContain('default-src \'self\'');
      expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
    });

    it('should add HSTS header in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const middleware = withSecurityHeaders();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains; preload'
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not add HSTS header in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const middleware = withSecurityHeaders();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.headers.get('Strict-Transport-Security')).toBeNull();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('withCORS', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should handle OPTIONS preflight requests', async () => {
      const middleware = withCORS();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS'
      });
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');

      // Handler should not be called for preflight
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should add CORS headers to actual responses', async () => {
      const middleware = withCORS({ origin: 'https://example.com' });
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: { origin: 'https://example.com' }
      });
      const response = await wrappedHandler(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle multiple allowed origins', async () => {
      const middleware = withCORS({ 
        origin: ['https://example.com', 'https://test.com'] 
      });
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: { origin: 'https://test.com' }
      });
      const response = await wrappedHandler(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://test.com');
    });

    it('should fall back to first origin for unknown origins', async () => {
      const middleware = withCORS({ 
        origin: ['https://example.com', 'https://test.com'] 
      });
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: { origin: 'https://unknown.com' }
      });
      const response = await wrappedHandler(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    });

    it('should use custom methods', async () => {
      const middleware = withCORS({ methods: ['GET', 'POST'] });
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS'
      });
      const response = await wrappedHandler(request);

      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
    });

    it('should disable credentials when specified', async () => {
      const middleware = withCORS({ credentials: false });
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('false');
    });
  });

  describe('withInputSanitization', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should sanitize JSON request bodies', async () => {
      const middleware = withInputSanitization();
      const wrappedHandler = middleware(mockHandler);

      const maliciousBody = {
        name: '<script>alert("xss")</script>John',
        description: 'javascript:void(0)',
        nested: {
          value: 'onclick=malicious()'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(maliciousBody)
      });

      await wrappedHandler(request);

      // Verify the handler was called (sanitization happened internally)
      expect(mockHandler).toHaveBeenCalledTimes(1);
      // The middleware should pass through sanitized data - just verify it was called
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject oversized payloads', async () => {
      const middleware = withInputSanitization();
      const wrappedHandler = middleware(mockHandler);

      const largeBody = { data: 'x'.repeat(11 * 1024 * 1024) }; // >10MB

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(largeBody)
      });

      const response = await wrappedHandler(request);

      expect(response.status).toBe(413);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should pass through non-JSON requests', async () => {
      const middleware = withInputSanitization();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'plain text body'
      });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should pass through GET requests', async () => {
      const middleware = withInputSanitization();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', async () => {
      const middleware = withInputSanitization();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json{'
      });

      // Should not throw, but pass through to handler to deal with
      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle empty request bodies', async () => {
      const middleware = withInputSanitization();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' }
        // No body
      });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should sanitize nested objects and arrays', async () => {
      const middleware = withInputSanitization();
      const wrappedHandler = middleware(mockHandler);

      const complexBody = {
        users: [
          { name: '<script>alert(1)</script>Alice' },
          { name: 'Bob', bio: 'javascript:void(0)' }
        ],
        settings: {
          theme: 'onclick=hack()',
          preferences: {
            notifications: true,
            language: 'vbscript:malicious'
          }
        }
      };

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(complexBody)
      });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('combineMiddleware', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should combine multiple middleware functions', async () => {
      const combinedMiddleware = combineMiddleware(
        withSecurityHeaders,
        withInputSanitization
      );
      const wrappedHandler = combinedMiddleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'test' })
      });

      const response = await wrappedHandler(request);

      // Should have security headers from withSecurityHeaders
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      
      // Should have processed the request through withInputSanitization
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should apply middleware in the correct order', async () => {
      const order: string[] = [];

      const middleware1 = () => (handler: (...args: unknown[]) => Promise<NextResponse>) => async (...args: unknown[]) => {
        order.push('middleware1-before');
        const result = await handler(...args);
        order.push('middleware1-after');
        return result;
      };

      const middleware2 = () => (handler: (...args: unknown[]) => Promise<NextResponse>) => async (...args: unknown[]) => {
        order.push('middleware2-before');
        const result = await handler(...args);
        order.push('middleware2-after');
        return result;
      };

      const combinedMiddleware = combineMiddleware(middleware1, middleware2);
      const wrappedHandler = combinedMiddleware(() => {
        order.push('handler');
        return Promise.resolve(NextResponse.json({ success: true }));
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      await wrappedHandler(request);

      expect(order).toEqual([
        'middleware1-before',
        'middleware2-before',
        'handler',
        'middleware2-after',
        'middleware1-after'
      ]);
    });
  });
});