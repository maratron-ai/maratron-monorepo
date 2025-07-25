// lib/cache/__tests__/cache-manager.test.ts
import { cacheManager, CacheManager } from '../cache-manager';
// import { createRedisClient } from '../redis-config';

// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    ping: jest.fn(),
    info: jest.fn(),
    flushdb: jest.fn(),
    keys: jest.fn(),
    ttl: jest.fn(),
    sadd: jest.fn(),
    smembers: jest.fn(),
    expire: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
  };
  
  return {
    Redis: jest.fn(() => mockRedis),
    __mockRedis: mockRedis,
  };
});

// Mock compression module
jest.mock('../compression', () => ({
  compress: jest.fn((data: string) => Promise.resolve(Buffer.from(data).toString('base64'))),
  decompress: jest.fn((data: string) => Promise.resolve(Buffer.from(data, 'base64').toString())),
}));

interface MockRedis {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  flushall: jest.Mock;
  scan: jest.Mock;
  keys: jest.Mock;
  mget: jest.Mock;
  mset: jest.Mock;
  expire: jest.Mock;
  ttl: jest.Mock;
}

describe('CacheManager', () => {
  let mockRedis: MockRedis;
  
  beforeEach(() => {
    // Get the mocked Redis instance
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockRedis = require('ioredis').__mockRedis as MockRedis;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set default mock behaviors
    mockRedis.ping.mockResolvedValue('PONG');
    mockRedis.info.mockResolvedValue('redis_version:7.0.0\r\nused_memory:1024\r\n');
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(300);
    mockRedis.keys.mockResolvedValue([]);
    mockRedis.smembers.mockResolvedValue([]);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.flushdb.mockResolvedValue('OK');
  });

  describe('get method', () => {
    it('should return cached data when available', async () => {
      const testData = { id: 1, name: 'Test User' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));
      
      // Need to provide a strategy with serialize: true for proper deserialization
      const strategy = { ttl: 300, serialize: true };
      const result = await cacheManager.get('test:key', undefined, strategy);
      
      expect(result.hit).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.source).toBe('cache');
    });

    it('should use fallback when cache miss occurs', async () => {
      const testData = { id: 1, name: 'Test User' };
      mockRedis.get.mockResolvedValue(null);
      
      const fallback = jest.fn().mockResolvedValue(testData);
      const result = await cacheManager.get('test:key', fallback);
      
      expect(result.hit).toBe(false);
      expect(result.data).toEqual(testData);
      expect(result.source).toBe('database');
      expect(fallback).toHaveBeenCalled();
    });

    it('should handle cache disabled scenario', async () => {
      // Create a new cache manager with disabled cache
      process.env.REDIS_ENABLED = 'false';
      const disabledCacheManager = new CacheManager();
      
      const testData = { id: 1, name: 'Test User' };
      const fallback = jest.fn().mockResolvedValue(testData);
      
      const result = await disabledCacheManager.get('test:key', fallback);
      
      expect(result.hit).toBe(false);
      expect(result.data).toEqual(testData);
      expect(result.source).toBe('database');
      expect(fallback).toHaveBeenCalled();
      
      // Reset environment
      delete process.env.REDIS_ENABLED;
    });

    it('should handle Redis connection errors gracefully', async () => {
      const testData = { id: 1, name: 'Test User' };
      const connectionError = new Error('Stream isn\'t writeable and enableOfflineQueue options is false');
      mockRedis.get.mockRejectedValue(connectionError);
      
      const fallback = jest.fn().mockResolvedValue(testData);
      const result = await cacheManager.get('test:key', fallback);
      
      expect(result.hit).toBe(false);
      expect(result.data).toEqual(testData);
      expect(result.source).toBe('database');
      expect(fallback).toHaveBeenCalled();
    });
  });

  describe('set method', () => {
    it('should set data in cache with TTL', async () => {
      const testData = { id: 1, name: 'Test User' };
      
      const result = await cacheManager.set('test:key', testData, {
        ttl: 300,
        serialize: true,
      });
      
      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        300,
        JSON.stringify(testData)
      );
    });

    it('should handle cache disabled scenario', async () => {
      process.env.REDIS_ENABLED = 'false';
      const disabledCacheManager = new CacheManager();
      
      const result = await disabledCacheManager.set('test:key', 'test data', {
        ttl: 300,
      });
      
      expect(result).toBe(false);
      
      // Reset environment
      delete process.env.REDIS_ENABLED;
    });

    it('should handle Redis connection errors gracefully', async () => {
      const connectionError = new Error('Stream isn\'t writeable and enableOfflineQueue options is false');
      mockRedis.setex.mockRejectedValue(connectionError);
      
      const result = await cacheManager.set('test:key', 'test data', {
        ttl: 300,
      });
      
      expect(result).toBe(false);
    });
  });

  describe('delete method', () => {
    it('should delete key from cache', async () => {
      const result = await cacheManager.delete('test:key');
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });
  });

  describe('invalidateByTags method', () => {
    it('should invalidate cache entries by tags', async () => {
      mockRedis.smembers.mockResolvedValue(['key1', 'key2']);
      mockRedis.del.mockResolvedValue(2);
      
      const result = await cacheManager.invalidateByTags(['user']);
      
      expect(result).toBe(2);
      expect(mockRedis.smembers).toHaveBeenCalledWith('tag:user');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });
  });

  describe('healthCheck method', () => {
    it('should return true when Redis is healthy', async () => {
      const result = await cacheManager.healthCheck();
      
      expect(result).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should return false when Redis is unhealthy', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));
      
      const result = await cacheManager.healthCheck();
      
      expect(result).toBe(false);
    });
  });

  describe('getStats method', () => {
    it('should return cache statistics', () => {
      const stats = cacheManager.getStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('enabled');
    });
  });

  describe('getInfo method', () => {
    it('should return cache information when enabled', async () => {
      const info = await cacheManager.getInfo();
      
      expect(info.enabled).toBe(true);
      expect(info).toHaveProperty('stats');
      expect(info).toHaveProperty('redisInfo');
    });
  });
});