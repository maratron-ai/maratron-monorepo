# 🚀 Advanced Redis Caching Guide

This comprehensive guide covers Maratron's sophisticated Redis caching implementation, including tag-based invalidation, cache warming strategies, performance optimization, and production scaling.

## 🎯 Overview

Maratron's caching system provides enterprise-grade performance with:

- **Tag-Based Invalidation** - Intelligent cache invalidation using relationships
- **Cache Warming Strategies** - Proactive cache population for optimal performance
- **Multi-Strategy Caching** - Different TTL and patterns for various data types
- **Performance Monitoring** - Real-time cache metrics and optimization insights
- **Production Scaling** - Redis clustering and high-availability configurations
- **Intelligent Fallbacks** - Graceful degradation when cache is unavailable

## 🏗️ Cache Architecture

### Cache Manager Implementation

```typescript
// src/lib/cache/cache-manager.ts
import Redis from 'ioredis';
import { logger } from '@/lib/logger';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
  fallbackOnError?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  operations: {
    get: number;
    set: number;
    delete: number;
    invalidate: number;
  };
}

export class CacheManager {
  private redis: Redis;
  private cluster?: Redis.Cluster;
  private isCluster: boolean;
  private keyPrefix: string;
  private stats: CacheStats;
  private isShuttingDown: boolean = false;

  constructor(config?: {
    redis?: Redis;
    cluster?: Redis.Cluster;
    keyPrefix?: string;
  }) {
    this.keyPrefix = config?.keyPrefix || process.env.REDIS_KEY_PREFIX || 'maratron:';
    this.isCluster = !!config?.cluster;
    
    if (config?.cluster) {
      this.cluster = config.cluster;
    } else if (config?.redis) {
      this.redis = config.redis;
    } else {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    }

    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      operations: { get: 0, set: 0, delete: 0, invalidate: 0 }
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    const client = this.isCluster ? this.cluster : this.redis;
    
    client?.on('error', (error) => {
      if (!this.isRedisConnectionError(error)) {
        logger.error('Redis error:', error);
        this.stats.errors++;
      }
    });

    client?.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    // Graceful shutdown handlers
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SHUTDOWN_HANDLERS === 'true') {
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());
    }
  }

  private isRedisConnectionError(error: Error): boolean {
    return error.message.includes("Stream isn't writeable") ||
           error.message.includes('Connection is closed') ||
           error.message.includes('enableOfflineQueue');
  }

  private async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    logger.info('Shutting down Redis connection...');
    
    try {
      if (this.isCluster && this.cluster) {
        await this.cluster.disconnect();
      } else if (this.redis) {
        this.redis.disconnect();
      }
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error during Redis shutdown:', error);
    }
  }

  private getClient(): Redis | Redis.Cluster {
    return this.isCluster ? this.cluster! : this.redis;
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private buildTagKey(tag: string): string {
    return `${this.keyPrefix}tags:${tag}`;
  }

  // Core cache operations
  async get<T>(key: string, options?: Pick<CacheOptions, 'fallbackOnError'>): Promise<T | null> {
    try {
      this.stats.operations.get++;
      
      const client = this.getClient();
      const fullKey = this.buildKey(key);
      const value = await client.get(fullKey);
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // Return as string if not JSON
        return value as unknown as T;
      }
    } catch (error) {
      this.stats.errors++;
      logger.warn('Cache get error:', { key, error: error.message });
      
      if (options?.fallbackOnError === false) {
        throw error;
      }
      
      return null;
    }
  }

  async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      this.stats.operations.set++;
      
      const client = this.getClient();
      const fullKey = this.buildKey(key);
      
      // Serialize value
      const serializedValue = options.serialize !== false 
        ? JSON.stringify(value) 
        : String(value);
      
      // Set with TTL
      if (options.ttl) {
        await client.setex(fullKey, options.ttl, serializedValue);
      } else {
        await client.set(fullKey, serializedValue);
      }
      
      // Handle tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTags(fullKey, options.tags);
      }
      
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.warn('Cache set error:', { key, error: error.message });
      
      if (options.fallbackOnError === false) {
        throw error;
      }
      
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      this.stats.operations.delete++;
      
      const client = this.getClient();
      const fullKey = this.buildKey(key);
      const result = await client.del(fullKey);
      
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      logger.warn('Cache delete error:', { key, error: error.message });
      return false;
    }
  }

  // Tag-based invalidation
  private async addTags(key: string, tags: string[]): Promise<void> {
    try {
      const client = this.getClient();
      const pipeline = client.pipeline();
      
      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        pipeline.sadd(tagKey, key);
        pipeline.expire(tagKey, 86400); // Tags expire in 24 hours
      }
      
      await pipeline.exec();
    } catch (error) {
      logger.warn('Error adding cache tags:', { key, tags, error: error.message });
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      this.stats.operations.invalidate++;
      
      const client = this.getClient();
      let invalidatedCount = 0;
      
      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        const keys = await client.smembers(tagKey);
        
        if (keys.length > 0) {
          // Delete all keys associated with this tag
          const pipeline = client.pipeline();
          keys.forEach(key => pipeline.del(key));
          await pipeline.exec();
          
          invalidatedCount += keys.length;
          
          // Clean up the tag set
          await client.del(tagKey);
        }
      }
      
      logger.info('Cache invalidation completed', {
        tags,
        invalidatedKeys: invalidatedCount
      });
      
      return invalidatedCount;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache invalidation error:', { tags, error: error.message });
      return 0;
    }
  }

  // Cache warming
  async warmup(strategies: string[], options: {
    userIds?: string[];
    groupIds?: string[];
    force?: boolean;
  } = {}): Promise<{ [strategy: string]: number }> {
    const results: { [strategy: string]: number } = {};
    
    for (const strategy of strategies) {
      try {
        results[strategy] = await this.warmupStrategy(strategy, options);
      } catch (error) {
        logger.error('Cache warmup error:', { strategy, error: error.message });
        results[strategy] = 0;
      }
    }
    
    return results;
  }

  private async warmupStrategy(
    strategy: string, 
    options: { userIds?: string[]; groupIds?: string[]; force?: boolean }
  ): Promise<number> {
    switch (strategy) {
      case 'USER_PROFILE':
        return this.warmupUserProfiles(options.userIds || [], options.force);
      case 'USER_RUNS':
        return this.warmupUserRuns(options.userIds || [], options.force);
      case 'LEADERBOARD':
        return this.warmupLeaderboards(options.groupIds || [], options.force);
      case 'SOCIAL_FEED':
        return this.warmupSocialFeeds(options.userIds || [], options.force);
      default:
        logger.warn('Unknown warmup strategy:', strategy);
        return 0;
    }
  }

  // Performance monitoring
  getStats(): CacheStats & { hitRate: number; errorRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    const totalOps = Object.values(this.stats.operations).reduce((a, b) => a + b, 0);
    const errorRate = totalOps > 0 ? (this.stats.errors / totalOps) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      operations: { get: 0, set: 0, delete: 0, invalidate: 0 }
    };
  }

  // Helper method for cache-aside pattern
  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch from source
    const value = await fetcher();
    
    // Store in cache
    await this.set(key, value, options);
    
    return value;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();
```

### Cache Strategy Implementations

```typescript
// src/lib/cache/strategies.ts
import { cacheManager } from './cache-manager';
import { prisma } from '@/lib/prisma';

export class CacheStrategies {
  // User profile caching - 15 minutes TTL
  static async getUserProfile(userId: string, fetcher?: () => Promise<any>) {
    return cacheManager.remember(
      `user:profile:${userId}`,
      fetcher || (() => prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          trainingLevel: true,
          VDOT: true,
          defaultDistanceUnit: true,
          goals: true,
          createdAt: true,
        }
      })),
      {
        ttl: 900, // 15 minutes
        tags: ['user', 'profile'],
        compress: true
      }
    );
  }

  // User runs caching - 5 minutes TTL
  static async getUserRuns(
    userId: string, 
    page: number = 1, 
    limit: number = 10,
    fetcher?: () => Promise<any>
  ) {
    return cacheManager.remember(
      `user:runs:${userId}:${page}:${limit}`,
      fetcher || (() => prisma.run.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          shoe: {
            select: { id: true, name: true }
          }
        }
      })),
      {
        ttl: 300, // 5 minutes
        tags: ['user', 'runs'],
        serialize: true
      }
    );
  }

  // Leaderboard caching - 10 minutes TTL
  static async getLeaderboard(
    groupId: string, 
    period: 'weekly' | 'monthly',
    fetcher?: () => Promise<any>
  ) {
    return cacheManager.remember(
      `leaderboard:${groupId}:${period}`,
      fetcher || (() => this.calculateLeaderboard(groupId, period)),
      {
        ttl: 600, // 10 minutes
        tags: ['leaderboard', 'social'],
        compress: true
      }
    );
  }

  // Social feed caching - 3 minutes TTL
  static async getSocialFeed(
    userId: string, 
    page: number = 1,
    fetcher?: () => Promise<any>
  ) {
    return cacheManager.remember(
      `social:feed:${userId}:${page}`,
      fetcher || (() => this.generateSocialFeed(userId, page)),
      {
        ttl: 180, // 3 minutes
        tags: ['social', 'feed'],
        serialize: true
      }
    );
  }

  // User statistics caching - 30 minutes TTL
  static async getUserStats(userId: string, fetcher?: () => Promise<any>) {
    return cacheManager.remember(
      `user:stats:${userId}`,
      fetcher || (() => this.calculateUserStats(userId)),
      {
        ttl: 1800, // 30 minutes
        tags: ['user', 'stats'],
        compress: true
      }
    );
  }

  // Static data caching - 2 hours TTL
  static async getStaticData(key: string, fetcher: () => Promise<any>) {
    return cacheManager.remember(
      `static:${key}`,
      fetcher,
      {
        ttl: 7200, // 2 hours
        tags: ['static'],
        compress: true
      }
    );
  }

  // Private helper methods
  private static async calculateLeaderboard(groupId: string, period: 'weekly' | 'monthly') {
    const startDate = period === 'weekly' 
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return prisma.run.groupBy({
      by: ['userId'],
      where: {
        user: {
          socialProfile: {
            groups: {
              some: { id: groupId }
            }
          }
        },
        date: { gte: startDate }
      },
      _sum: { distance: true },
      _count: { id: true },
      orderBy: { _sum: { distance: 'desc' } }
    });
  }

  private static async generateSocialFeed(userId: string, page: number) {
    const limit = 20;
    const skip = (page - 1) * limit;

    return prisma.post.findMany({
      where: {
        socialProfile: {
          OR: [
            { userId }, // User's own posts
            { 
              followers: {
                some: { followerId: userId }
              }
            }
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        socialProfile: {
          select: { id: true, username: true, userId: true }
        },
        run: {
          select: { distance: true, duration: true, pace: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });
  }

  private static async calculateUserStats(userId: string) {
    const [runStats, shoeStats] = await Promise.all([
      prisma.run.aggregate({
        where: { userId },
        _sum: { distance: true },
        _count: { id: true },
        _avg: { distance: true }
      }),
      prisma.shoe.aggregate({
        where: { userId, retired: false },
        _sum: { currentDistance: true },
        _count: { id: true }
      })
    ]);

    return {
      totalRuns: runStats._count.id,
      totalDistance: runStats._sum.distance,
      averageDistance: runStats._avg.distance,
      activeShoes: shoeStats._count.id,
      totalShoeMiles: shoeStats._sum.currentDistance
    };
  }
}
```

## 🔄 Cache Invalidation Strategies

### Tag-Based Invalidation Patterns

```typescript
// src/lib/cache/invalidation.ts
import { cacheManager } from './cache-manager';
import { logger } from '@/lib/logger';

export class CacheInvalidation {
  // User-related invalidation
  static async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      cacheManager.invalidateByTags(['user']),
      cacheManager.delete(`user:profile:${userId}`),
      cacheManager.delete(`user:stats:${userId}`),
      this.invalidateUserRunPages(userId),
      this.invalidateUserSocialContent(userId)
    ]);
    
    logger.info('User cache invalidated', { userId });
  }

  // Run-related invalidation
  static async invalidateRuns(userId: string): Promise<void> {
    await Promise.all([
      cacheManager.invalidateByTags(['runs']),
      this.invalidateUserRunPages(userId),
      this.invalidateUserStats(userId),
      this.invalidateLeaderboards(), // Runs affect leaderboards
    ]);
    
    logger.info('Run cache invalidated', { userId });
  }

  // Social content invalidation
  static async invalidateSocial(userId?: string, groupId?: string): Promise<void> {
    const tasks = [
      cacheManager.invalidateByTags(['social', 'feed'])
    ];
    
    if (userId) {
      tasks.push(this.invalidateUserSocialContent(userId));
    }
    
    if (groupId) {
      tasks.push(this.invalidateGroupContent(groupId));
    }
    
    await Promise.all(tasks);
    
    logger.info('Social cache invalidated', { userId, groupId });
  }

  // Leaderboard invalidation
  static async invalidateLeaderboards(): Promise<void> {
    await cacheManager.invalidateByTags(['leaderboard']);
    logger.info('Leaderboard cache invalidated');
  }

  // Private helper methods
  private static async invalidateUserRunPages(userId: string): Promise<void> {
    // Invalidate multiple pages of runs for a user
    const tasks = [];
    for (let page = 1; page <= 10; page++) { // Invalidate up to 10 pages
      for (const limit of [10, 20, 50]) {
        tasks.push(cacheManager.delete(`user:runs:${userId}:${page}:${limit}`));
      }
    }
    await Promise.all(tasks);
  }

  private static async invalidateUserStats(userId: string): Promise<void> {
    await cacheManager.delete(`user:stats:${userId}`);
  }

  private static async invalidateUserSocialContent(userId: string): Promise<void> {
    // Invalidate social feeds that might include this user's content
    const tasks = [];
    for (let page = 1; page <= 5; page++) {
      tasks.push(cacheManager.delete(`social:feed:${userId}:${page}`));
    }
    await Promise.all(tasks);
  }

  private static async invalidateGroupContent(groupId: string): Promise<void> {
    // Invalidate group-specific content
    await Promise.all([
      cacheManager.delete(`leaderboard:${groupId}:weekly`),
      cacheManager.delete(`leaderboard:${groupId}:monthly`),
      cacheManager.invalidateByTags([`group:${groupId}`])
    ]);
  }
}
```

### Smart Invalidation Hooks

```typescript
// src/lib/cache/hooks.ts
import { CacheInvalidation } from './invalidation';

export class CacheHooks {
  // Database operation hooks
  static async onUserUpdate(userId: string, changes: any): Promise<void> {
    // Only invalidate relevant caches based on what changed
    if (changes.name || changes.trainingLevel || changes.VDOT) {
      await CacheInvalidation.invalidateUser(userId);
    }
    
    if (changes.defaultDistanceUnit || changes.goals) {
      await Promise.all([
        CacheInvalidation.invalidateUserStats(userId),
        CacheInvalidation.invalidateLeaderboards()
      ]);
    }
  }

  static async onRunCreate(userId: string, runData: any): Promise<void> {
    await Promise.all([
      CacheInvalidation.invalidateRuns(userId),
      CacheInvalidation.invalidateLeaderboards(),
      // Invalidate social feeds if run is shared
      runData.shared && CacheInvalidation.invalidateSocial()
    ]);
  }

  static async onRunUpdate(userId: string, runId: string, changes: any): Promise<void> {
    // Only invalidate if distance or time changed (affects stats)
    if (changes.distance || changes.duration) {
      await Promise.all([
        CacheInvalidation.invalidateRuns(userId),
        CacheInvalidation.invalidateLeaderboards()
      ]);
    }
  }

  static async onRunDelete(userId: string): Promise<void> {
    await Promise.all([
      CacheInvalidation.invalidateRuns(userId),
      CacheInvalidation.invalidateLeaderboards()
    ]);
  }

  static async onSocialPost(userId: string): Promise<void> {
    await CacheInvalidation.invalidateSocial(userId);
  }

  static async onFollow(followerId: string, followingId: string): Promise<void> {
    // Invalidate follower's social feed
    await CacheInvalidation.invalidateSocial(followerId);
  }
}
```

## ⚡ Cache Warming Strategies

### Proactive Cache Population

```typescript
// src/lib/cache/warming.ts
import { cacheManager, CacheStrategies } from './index';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class CacheWarming {
  // Warm cache for most active users
  static async warmActiveUsers(limit: number = 100): Promise<void> {
    try {
      // Get most active users (those with recent runs)
      const activeUsers = await prisma.user.findMany({
        where: {
          runs: {
            some: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            }
          }
        },
        select: { id: true },
        take: limit,
        orderBy: {
          runs: {
            _count: 'desc'
          }
        }
      });

      const userIds = activeUsers.map(u => u.id);
      
      await Promise.all([
        this.warmUserProfiles(userIds),
        this.warmUserRuns(userIds),
        this.warmUserStats(userIds)
      ]);
      
      logger.info('Active user cache warming completed', {
        userCount: userIds.length
      });
    } catch (error) {
      logger.error('Cache warming error:', error);
    }
  }

  // Warm user profiles
  static async warmUserProfiles(userIds: string[]): Promise<number> {
    let warmed = 0;
    
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (userId) => {
          try {
            await CacheStrategies.getUserProfile(userId);
            warmed++;
          } catch (error) {
            logger.warn('Profile warming failed:', { userId, error: error.message });
          }
        })
      );
    }
    
    return warmed;
  }

  // Warm user runs (first page)
  static async warmUserRuns(userIds: string[]): Promise<number> {
    let warmed = 0;
    
    const batchSize = 5; // Smaller batch for runs (more data)
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (userId) => {
          try {
            // Warm first page with different limits
            await Promise.all([
              CacheStrategies.getUserRuns(userId, 1, 10),
              CacheStrategies.getUserRuns(userId, 1, 20)
            ]);
            warmed++;
          } catch (error) {
            logger.warn('Runs warming failed:', { userId, error: error.message });
          }
        })
      );
    }
    
    return warmed;
  }

  // Warm user statistics
  static async warmUserStats(userIds: string[]): Promise<number> {
    let warmed = 0;
    
    const batchSize = 20;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (userId) => {
          try {
            await CacheStrategies.getUserStats(userId);
            warmed++;
          } catch (error) {
            logger.warn('Stats warming failed:', { userId, error: error.message });
          }
        })
      );
    }
    
    return warmed;
  }

  // Warm leaderboards for active groups
  static async warmLeaderboards(): Promise<number> {
    try {
      // Get groups with recent activity
      const activeGroups = await prisma.group.findMany({
        where: {
          members: {
            some: {
              user: {
                runs: {
                  some: {
                    date: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                  }
                }
              }
            }
          }
        },
        select: { id: true },
        take: 50
      });

      let warmed = 0;
      
      await Promise.all(
        activeGroups.map(async (group) => {
          try {
            await Promise.all([
              CacheStrategies.getLeaderboard(group.id, 'weekly'),
              CacheStrategies.getLeaderboard(group.id, 'monthly')
            ]);
            warmed++;
          } catch (error) {
            logger.warn('Leaderboard warming failed:', { groupId: group.id, error: error.message });
          }
        })
      );
      
      return warmed;
    } catch (error) {
      logger.error('Leaderboard warming error:', error);
      return 0;
    }
  }

  // Scheduled cache warming
  static async scheduledWarmup(): Promise<void> {
    logger.info('Starting scheduled cache warmup');
    
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.warmActiveUsers(50), // Top 50 active users
        this.warmLeaderboards(),
        this.warmStaticData()
      ]);
      
      const duration = Date.now() - startTime;
      logger.info('Scheduled cache warmup completed', {
        duration: `${duration}ms`
      });
    } catch (error) {
      logger.error('Scheduled warmup failed:', error);
    }
  }

  // Warm static/reference data
  static async warmStaticData(): Promise<void> {
    try {
      await Promise.all([
        // Warm coach data
        CacheStrategies.getStaticData('coaches', () => 
          prisma.coach.findMany({ where: { active: true } })
        ),
        // Warm training levels
        CacheStrategies.getStaticData('training-levels', () =>
          Promise.resolve(['beginner', 'intermediate', 'advanced', 'elite'])
        ),
        // Warm distance units
        CacheStrategies.getStaticData('distance-units', () =>
          Promise.resolve(['miles', 'kilometers'])
        )
      ]);
    } catch (error) {
      logger.error('Static data warming error:', error);
    }
  }
}

// Schedule cache warming (if needed)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CACHE_WARMING === 'true') {
  // Warm cache every 30 minutes
  setInterval(() => {
    CacheWarming.scheduledWarmup();
  }, 30 * 60 * 1000);
  
  // Initial warmup after 30 seconds
  setTimeout(() => {
    CacheWarming.scheduledWarmup();
  }, 30000);
}
```

## 📊 Performance Optimization Techniques

### Cache Key Management

```typescript
// src/lib/cache/key-management.ts
import { cacheManager } from './cache-manager';

export class CacheKeyManager {
  // Generate consistent cache keys
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    
    return `${prefix}:${sortedParams}`;
  }

  // Generate versioned keys for cache busting
  static generateVersionedKey(
    prefix: string, 
    params: Record<string, any>, 
    version: string = '1'
  ): string {
    return `${prefix}:v${version}:${this.generateKey('', params)}`;
  }

  // Scan for keys matching pattern (development only)
  static async scanKeys(pattern: string): Promise<string[]> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Key scanning not allowed in production');
    }
    
    try {
      const redis = (cacheManager as any).redis;
      const keys: string[] = [];
      const stream = redis.scanStream({
        match: `${process.env.REDIS_KEY_PREFIX || 'maratron:'}${pattern}`,
        count: 100
      });
      
      return new Promise((resolve, reject) => {
        stream.on('data', (resultKeys: string[]) => {
          keys.push(...resultKeys);
        });
        
        stream.on('end', () => {
          resolve(keys);
        });
        
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Key scanning error:', error);
      return [];
    }
  }

  // Clean up expired keys
  static async cleanup(): Promise<number> {
    try {
      // This would typically be handled by Redis TTL
      // But we can implement custom cleanup logic here
      
      let cleaned = 0;
      
      // Clean up old tag sets
      const tagPattern = 'tags:*';
      const tagKeys = await this.scanKeys(tagPattern);
      
      for (const tagKey of tagKeys) {
        const members = await (cacheManager as any).redis.scard(tagKey);
        if (members === 0) {
          await cacheManager.delete(tagKey.replace(process.env.REDIS_KEY_PREFIX || 'maratron:', ''));
          cleaned++;
        }
      }
      
      return cleaned;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }
}
```

### Performance Monitoring & Debugging

```typescript
// src/lib/cache/monitoring.ts
import { cacheManager } from './cache-manager';
import { logger } from '@/lib/logger';

export class CacheMonitoring {
  // Performance metrics collection
  static getDetailedStats() {
    const stats = cacheManager.getStats();
    
    return {
      ...stats,
      performance: {
        hitRateThreshold: 85, // Target hit rate
        hitRateStatus: stats.hitRate >= 85 ? 'good' : 'poor',
        errorRateThreshold: 5, // Max acceptable error rate
        errorRateStatus: stats.errorRate <= 5 ? 'good' : 'poor'
      },
      recommendations: this.generateRecommendations(stats)
    };
  }

  // Generate performance recommendations
  private static generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    if (stats.hitRate < 70) {
      recommendations.push('Critical: Cache hit rate below 70%. Consider cache warming or longer TTLs.');
    } else if (stats.hitRate < 85) {
      recommendations.push('Warning: Cache hit rate below target. Review cache strategies.');
    }
    
    if (stats.errorRate > 5) {
      recommendations.push('High error rate detected. Check Redis connectivity.');
    }
    
    if (stats.operations.get > stats.operations.set * 10) {
      recommendations.push('High read-to-write ratio. Consider longer TTLs for stable data.');
    }
    
    return recommendations;
  }

  // Health check for cache system
  static async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      
      // Test basic operations
      const testKey = 'health:test:' + Date.now();
      const testValue = 'test-value';
      
      await cacheManager.set(testKey, testValue, { ttl: 10 });
      const retrieved = await cacheManager.get(testKey);
      await cacheManager.delete(testKey);
      
      const latency = Date.now() - start;
      
      if (retrieved !== testValue) {
        return {
          healthy: false,
          status: 'Cache operation failed',
          latency
        };
      }
      
      return {
        healthy: true,
        status: 'Cache operational',
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'Cache connection failed',
        error: error.message
      };
    }
  }

  // Real-time performance monitoring
  static startMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      const stats = this.getDetailedStats();
      
      logger.info('Cache performance stats', {
        hitRate: stats.hitRate,
        errorRate: stats.errorRate,
        operations: stats.operations,
        performance: stats.performance,
        recommendations: stats.recommendations
      });
      
      // Alert on poor performance
      if (stats.hitRate < 70 || stats.errorRate > 10) {
        logger.warn('Cache performance degraded', {
          hitRate: stats.hitRate,
          errorRate: stats.errorRate
        });
      }
    }, intervalMs);
  }
}
```

## 🏭 Production Scaling Configurations

### Redis Cluster Setup

```yaml
# docker-compose.redis-cluster.yml
version: '3.8'

services:
  redis-node-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6379
    ports:
      - "6379:6379"
      - "16379:16379"
    volumes:
      - redis-node-1-data:/data
    networks:
      - redis-cluster

  redis-node-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6379
    ports:
      - "6380:6379"
      - "16380:16379"
    volumes:
      - redis-node-2-data:/data
    networks:
      - redis-cluster

  redis-node-3:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6379
    ports:
      - "6381:6379"
      - "16381:16379"
    volumes:
      - redis-node-3-data:/data
    networks:
      - redis-cluster

  redis-node-4:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6379
    ports:
      - "6382:6379"
      - "16382:16379"
    volumes:
      - redis-node-4-data:/data
    networks:
      - redis-cluster

  redis-node-5:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6379
    ports:
      - "6383:6379"
      - "16383:16379"
    volumes:
      - redis-node-5-data:/data
    networks:
      - redis-cluster

  redis-node-6:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes --port 6379
    ports:
      - "6384:6379"
      - "16384:16379"
    volumes:
      - redis-node-6-data:/data
    networks:
      - redis-cluster

  redis-cluster-init:
    image: redis:7-alpine
    depends_on:
      - redis-node-1
      - redis-node-2
      - redis-node-3
      - redis-node-4
      - redis-node-5
      - redis-node-6
    command: >
      sh -c "
        sleep 10 &&
        redis-cli --cluster create
        redis-node-1:6379
        redis-node-2:6379
        redis-node-3:6379
        redis-node-4:6379
        redis-node-5:6379
        redis-node-6:6379
        --cluster-replicas 1 --cluster-yes
      "
    networks:
      - redis-cluster

volumes:
  redis-node-1-data:
  redis-node-2-data:
  redis-node-3-data:
  redis-node-4-data:
  redis-node-5-data:
  redis-node-6-data:

networks:
  redis-cluster:
    driver: bridge
```

### Production Cache Configuration

```typescript
// src/lib/cache/production-config.ts
import Redis from 'ioredis';
import { CacheManager } from './cache-manager';

export function createProductionCacheManager(): CacheManager {
  if (process.env.REDIS_CLUSTER_ENABLED === 'true') {
    // Redis Cluster configuration
    const cluster = new Redis.Cluster([
      { host: process.env.REDIS_NODE_1_HOST || 'redis-node-1', port: 6379 },
      { host: process.env.REDIS_NODE_2_HOST || 'redis-node-2', port: 6379 },
      { host: process.env.REDIS_NODE_3_HOST || 'redis-node-3', port: 6379 },
    ], {
      enableOfflineQueue: false,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      scaleReads: 'slave',
      clusterRetryAfter: 5000,
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        connectTimeout: 10000,
        commandTimeout: 5000,
        lazyConnect: true,
      }
    });

    return new CacheManager({
      cluster,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'maratron:prod:'
    });
  } else {
    // Single Redis instance with Sentinel for HA
    const redis = new Redis({
      sentinels: [
        { host: process.env.REDIS_SENTINEL_1_HOST || 'sentinel-1', port: 26379 },
        { host: process.env.REDIS_SENTINEL_2_HOST || 'sentinel-2', port: 26379 },
        { host: process.env.REDIS_SENTINEL_3_HOST || 'sentinel-3', port: 26379 },
      ],
      name: 'maratron-master',
      password: process.env.REDIS_PASSWORD,
      enableOfflineQueue: false,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      lazyConnect: true,
    });

    return new CacheManager({
      redis,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'maratron:prod:'
    });
  }
}

// Memory optimization for high-traffic scenarios
export const productionCacheOptions = {
  // Shorter TTLs for memory efficiency
  userProfile: { ttl: 600 },      // 10 minutes (was 15)
  userRuns: { ttl: 180 },         // 3 minutes (was 5)
  leaderboard: { ttl: 300 },      // 5 minutes (was 10)
  socialFeed: { ttl: 120 },       // 2 minutes (was 3)
  userStats: { ttl: 900 },        // 15 minutes (was 30)
  
  // Compression for large objects
  compression: {
    threshold: 1024, // Compress objects > 1KB
    level: 6,        // Compression level (1-9)
  },
  
  // Connection pool settings
  connectionPool: {
    min: 10,
    max: 100,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  }
};
```

## 📋 Cache Implementation Checklist

### Development Phase
- [ ] **Cache Manager implemented** with tag support
- [ ] **Cache strategies defined** for all data types
- [ ] **Invalidation patterns** established
- [ ] **Cache warming** implemented for critical paths
- [ ] **Performance monitoring** integrated
- [ ] **Error handling** with graceful degradation
- [ ] **Memory management** optimized

### Testing Phase
- [ ] **Cache hit rate testing** under various loads
- [ ] **Invalidation testing** for all scenarios
- [ ] **Performance benchmarking** completed
- [ ] **Memory usage profiling** done
- [ ] **Failover testing** with Redis unavailable
- [ ] **Cluster testing** in production-like environment

### Production Phase
- [ ] **Redis clustering** configured
- [ ] **Monitoring dashboards** setup
- [ ] **Alert thresholds** configured
- [ ] **Backup strategies** implemented
- [ ] **Capacity planning** completed
- [ ] **Security hardening** applied

---

*For performance monitoring details, see the [Performance Monitoring Guide](./performance-monitoring.md). For production deployment, see the [Production Deployment Guide](./production-deployment.md).*