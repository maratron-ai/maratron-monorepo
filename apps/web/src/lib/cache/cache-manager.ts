// lib/cache/cache-manager.ts
import { Redis } from 'ioredis';
import { getRedisClient, CacheStrategy, CACHE_STRATEGIES } from './redis-config';
import { compress, decompress } from './compression';

export interface CacheResult<T> {
  data: T | null;
  hit: boolean;
  ttl?: number;
  source: 'cache' | 'database' | 'error';
}

export interface CacheSetOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
}

export class CacheManager {
  private redis: Redis;
  private isEnabled: boolean;
  private stats: {
    hits: number;
    misses: number;
    errors: number;
    sets: number;
    deletes: number;
  };

  constructor() {
    this.redis = getRedisClient();
    this.isEnabled = process.env.REDIS_ENABLED !== 'false';
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Get data from cache with fallback to database
   */
  async get<T>(
    key: string,
    fallback?: () => Promise<T>,
    strategy?: CacheStrategy
  ): Promise<CacheResult<T>> {
    if (!this.isEnabled) {
      if (fallback) {
        const data = await fallback();
        return { data, hit: false, source: 'database' };
      }
      return { data: null, hit: false, source: 'error' };
    }

    try {
      // Try to get from cache first
      const cached = await this.redis.get(key);
      
      if (cached !== null) {
        this.stats.hits++;
        let data: T;
        
        try {
          // Decompress if needed
          const decompressed = strategy?.compress ? await decompress(cached) : cached;
          // Deserialize if needed
          data = strategy?.serialize ? JSON.parse(decompressed) : decompressed;
          
          // Get TTL for metadata
          const ttl = await this.redis.ttl(key);
          
          return { 
            data, 
            hit: true, 
            source: 'cache',
            ttl: ttl > 0 ? ttl : undefined 
          };
        } catch (parseError) {
          console.warn(`Cache parse error for key ${key}:`, parseError);
          // If parsing fails, delete the corrupted cache entry
          await this.delete(key);
          this.stats.errors++;
        }
      }

      // Cache miss - use fallback if provided
      this.stats.misses++;
      
      if (fallback) {
        const data = await fallback();
        
        // Cache the result if strategy is provided
        if (strategy && data !== null && data !== undefined) {
          await this.set(key, data, strategy);
        }
        
        return { data, hit: false, source: 'database' };
      }

      return { data: null, hit: false, source: 'cache' };
      
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.stats.errors++;
      
      // If cache fails, try fallback
      if (fallback) {
        try {
          const data = await fallback();
          return { data, hit: false, source: 'database' };
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return { data: null, hit: false, source: 'error' };
        }
      }
      
      return { data: null, hit: false, source: 'error' };
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheSetOptions | CacheStrategy
  ): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      let serialized: string;
      
      // Serialize if needed
      if (options.serialize !== false) {
        serialized = JSON.stringify(data);
      } else {
        serialized = data as string;
      }
      
      // Compress if needed
      if (options.compress) {
        serialized = await compress(serialized);
      }
      
      // Set with TTL
      const ttl = options.ttl || 300; // Default 5 minutes
      await this.redis.setex(key, ttl, serialized);
      
      // Add tags for invalidation if provided
      if (options.tags && options.tags.length > 0) {
        await this.addTags(key, options.tags);
      }
      
      this.stats.sets++;
      return true;
      
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const result = await this.redis.del(key);
      if (result > 0) {
        this.stats.deletes++;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isEnabled) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.stats.deletes += result;
      return result;
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isEnabled || tags.length === 0) {
      return 0;
    }

    try {
      let totalDeleted = 0;
      
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.redis.smembers(tagKey);
        
        if (keys.length > 0) {
          // Delete all keys associated with this tag
          const deleted = await this.redis.del(...keys);
          totalDeleted += deleted;
          
          // Remove the tag set
          await this.redis.del(tagKey);
        }
      }
      
      this.stats.deletes += totalDeleted;
      return totalDeleted;
      
    } catch (error) {
      console.error(`Cache invalidate by tags error:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Add tags to a key for invalidation
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await this.redis.sadd(tagKey, key);
        // Set expiry on tag set (longer than typical cache entries)
        await this.redis.expire(tagKey, 3600); // 1 hour
      }
    } catch (error) {
      console.error(`Error adding tags for key ${key}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: parseFloat(hitRate.toFixed(2)),
      total,
      enabled: this.isEnabled,
    };
  }

  /**
   * Clear all cache statistics
   */
  clearStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled) {
      return true; // Consider it healthy if disabled
    }

    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Get cache info
   */
  async getInfo(): Promise<Record<string, unknown>> {
    if (!this.isEnabled) {
      return { enabled: false };
    }

    try {
      const info = await this.redis.info();
      const stats = this.getStats();
      
      return {
        enabled: true,
        stats,
        redisInfo: this.parseRedisInfo(info),
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return { enabled: true, error: error.message };
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const parsed: Record<string, string> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    }
    
    return parsed;
  }

  /**
   * Flush all cache data (use with caution)
   */
  async flush(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      await this.redis.flushdb();
      this.clearStats();
      console.log('✅ Cache flushed successfully');
      return true;
    } catch (error) {
      console.error('Error flushing cache:', error);
      return false;
    }
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Helper function for common caching patterns
export async function withCache<T>(
  key: string,
  fallback: () => Promise<T>,
  strategy: CacheStrategy
): Promise<T> {
  const result = await cacheManager.get(key, fallback, strategy);
  return result.data!;
}

// Predefined cache methods for common operations
export const cache = {
  user: {
    profile: (userId: string, fallback: () => Promise<unknown>) =>
      withCache(`user:profile:${userId}`, fallback, CACHE_STRATEGIES.USER_PROFILE),
    
    runs: (userId: string, page: number, limit: number, fallback: () => Promise<unknown>) =>
      withCache(`user:runs:${userId}:${page}:${limit}`, fallback, CACHE_STRATEGIES.USER_RUNS),
    
    shoes: (userId: string, fallback: () => Promise<unknown>) =>
      withCache(`user:shoes:${userId}`, fallback, CACHE_STRATEGIES.USER_SHOES),
  },
  
  social: {
    feed: (userId: string, page: number, fallback: () => Promise<unknown>) =>
      withCache(`social:feed:${userId}:${page}`, fallback, CACHE_STRATEGIES.SOCIAL_FEED),
    
    profile: (username: string, fallback: () => Promise<unknown>) =>
      withCache(`social:profile:${username}`, fallback, CACHE_STRATEGIES.SOCIAL_PROFILE),
  },
  
  leaderboard: (groupId: string, period: string, metric: string, fallback: () => Promise<unknown>) =>
    withCache(`leaderboard:${groupId}:${period}:${metric}`, fallback, CACHE_STRATEGIES.LEADERBOARD),
  
  coaches: (fallback: () => Promise<unknown>) =>
    withCache('coaches:list', fallback, CACHE_STRATEGIES.COACHES),
};