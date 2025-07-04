/**
 * @jest-environment node
 */

// Mock logger before imports
jest.mock('@lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

import { NextRequest, NextResponse } from 'next/server';
import {
  withRequestLogging,
  withPerformanceMonitoring,
  withFullRequestLogging,
  generateRequestId
} from '../requestLogger';
import { logger } from '@lib/logger';

const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

describe('requestLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id = generateRequestId();
      expect(id).toBe('mock-uuid-1234');
    });
  });

  describe('withRequestLogging', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should log request and response', async () => {
      const middleware = withRequestLogging();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'user-agent': 'test-agent',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const response = await wrappedHandler(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'API Request',
        expect.objectContaining({
          requestId: 'mock-uuid-1234',
          method: 'GET',
          url: 'http://localhost:3000/api/test',
          path: '/api/test',
          clientIP: '192.168.1.1',
          userAgent: 'test-agent'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'API Response',
        expect.objectContaining({
          requestId: 'mock-uuid-1234',
          statusCode: 200,
          success: true,
          duration: expect.any(Number)
        })
      );

      expect(response.headers.get('x-request-id')).toBe('mock-uuid-1234');
    });

    it('should log request headers when enabled', async () => {
      const middleware = withRequestLogging({ logHeaders: true });
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer token',
          'content-type': 'application/json',
          'x-api-key': 'secret-key'
        }
      });

      await wrappedHandler(request);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request headers',
        expect.objectContaining({
          headers: expect.objectContaining({
            'authorization': '[REDACTED]',
            'content-type': 'application/json',
            'x-api-key': '[REDACTED]'
          })
        })
      );
    });

    it('should log request body when enabled', async () => {
      const middleware = withRequestLogging({ logBody: true, maxBodySize: 100 });
      const wrappedHandler = middleware(mockHandler);

      const requestBody = { name: 'test', data: 'value' };
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      await wrappedHandler(request);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request body',
        expect.objectContaining({
          body: JSON.stringify(requestBody),
          bodySize: JSON.stringify(requestBody).length
        })
      );
    });

    it('should truncate large request bodies', async () => {
      const middleware = withRequestLogging({ logBody: true, maxBodySize: 10 });
      const wrappedHandler = middleware(mockHandler);

      const largeBody = { data: 'very long string that exceeds the limit' };
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(largeBody)
      });

      await wrappedHandler(request);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request body',
        expect.objectContaining({
          body: expect.stringContaining('... (truncated)')
        })
      );
    });

    it('should log errors during request processing', async () => {
      const error = new Error('Handler failed');
      mockHandler.mockRejectedValue(error);

      const middleware = withRequestLogging();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await expect(wrappedHandler(request)).rejects.toThrow('Handler failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Request Error',
        expect.objectContaining({
          error: {
            name: 'Error',
            message: 'Handler failed',
            stack: expect.any(String)
          },
          duration: expect.any(Number)
        })
      );
    });

    it('should warn on slow requests', async () => {
      // Mock a slow handler - timing is handled differently in tests
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(0) // Start time
        .mockReturnValueOnce(1100); // End time (1.1 seconds later)

      mockHandler.mockImplementation(async () => {
        return NextResponse.json({ success: true });
      });

      const middleware = withRequestLogging();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Slow API Request',
        expect.objectContaining({
          slowRequest: true,
          threshold: 1000,
          duration: 1100
        })
      );

      (Date.now as jest.Mock).mockRestore();
    });

    it('should warn on error responses', async () => {
      mockHandler.mockResolvedValue(NextResponse.json({ error: 'Not found' }, { status: 404 }));

      const middleware = withRequestLogging();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'API Response',
        expect.objectContaining({
          statusCode: 404,
          success: false
        })
      );
    });

    it('should extract client IP from various headers', async () => {
      const middleware = withRequestLogging();
      const wrappedHandler = middleware(mockHandler);

      // Test x-real-ip header
      const request1 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-real-ip': '10.0.0.1' }
      });

      await wrappedHandler(request1);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'API Request',
        expect.objectContaining({
          clientIP: '10.0.0.1'
        })
      );

      mockLogger.info.mockClear();

      // Test x-forwarded-for header (first IP)
      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      });

      await wrappedHandler(request2);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'API Request',
        expect.objectContaining({
          clientIP: '192.168.1.1'
        })
      );
    });

    it('should handle missing user agent', async () => {
      const middleware = withRequestLogging();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'API Request',
        expect.objectContaining({
          userAgent: 'unknown'
        })
      );
    });
  });

  describe('withPerformanceMonitoring', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should log performance metrics for normal requests', async () => {
      const middleware = withPerformanceMonitoring();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Performance metrics',
        expect.objectContaining({
          path: '/api/test',
          method: 'GET',
          duration: expect.any(Number),
          memoryDelta: expect.any(Number),
          heapUsed: expect.any(Number),
          statusCode: 200
        })
      );
    });

    it('should warn on slow requests', async () => {
      // Mock a slow handler
      mockHandler.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 60)); // Reduced time for testing
        return NextResponse.json({ success: true });
      });

      const middleware = withPerformanceMonitoring({ warn: 50, error: 100 }); // Lower thresholds
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Performance warning',
        expect.objectContaining({
          duration: expect.any(Number)
        })
      );
    });

    it('should error on critically slow requests', async () => {
      // Mock a very slow handler
      mockHandler.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced time for testing
        return NextResponse.json({ success: true });
      });

      const middleware = withPerformanceMonitoring({ warn: 50, error: 75 }); // Lower thresholds
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Critical performance issue',
        expect.objectContaining({
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('withFullRequestLogging', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should combine request logging and performance monitoring', async () => {
      const middleware = withFullRequestLogging();
      const wrappedHandler = middleware(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      // Should have both request logging and performance monitoring
      expect(mockLogger.info).toHaveBeenCalledWith(
        'API Request',
        expect.objectContaining({
          requestId: expect.any(String),
          method: 'GET'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'API Response',
        expect.objectContaining({
          statusCode: 200
        })
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Performance metrics',
        expect.objectContaining({
          duration: expect.any(Number)
        })
      );
    });
  });
});