// lib/cache/redis-config.ts
import { Redis } from 'ioredis';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  username?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  commandTimeout: number;
}

export interface CacheStrategy {
  ttl: number;
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
}

export const CACHE_STRATEGIES = {
  // User data - rarely changes, cache for longer
  USER_PROFILE: { ttl: 15 * 60, tags: ['user'], serialize: true } as CacheStrategy, // 15 minutes
  USER_RUNS: { ttl: 5 * 60, tags: ['user', 'runs'], serialize: true } as CacheStrategy, // 5 minutes
  USER_SHOES: { ttl: 10 * 60, tags: ['user', 'shoes'], serialize: true } as CacheStrategy, // 10 minutes
  
  // Social data - frequently updated
  SOCIAL_FEED: { ttl: 2 * 60, tags: ['social', 'feed'], serialize: true } as CacheStrategy, // 2 minutes
  SOCIAL_PROFILE: { ttl: 5 * 60, tags: ['social', 'profile'], serialize: true } as CacheStrategy, // 5 minutes
  
  // Leaderboards - computationally expensive
  LEADERBOARD: { ttl: 10 * 60, tags: ['leaderboard'], serialize: true } as CacheStrategy, // 10 minutes
  
  // Groups - moderately dynamic
  GROUP_LIST: { ttl: 5 * 60, tags: ['groups'], serialize: true } as CacheStrategy, // 5 minutes
  GROUP_POSTS: { ttl: 3 * 60, tags: ['groups', 'posts'], serialize: true } as CacheStrategy, // 3 minutes
  
  // Static data - cache for longer
  COACHES: { ttl: 60 * 60, tags: ['coaches'], serialize: true } as CacheStrategy, // 1 hour
  
  // Session data - short-lived
  USER_SESSION: { ttl: 30 * 60, tags: ['session'], serialize: true } as CacheStrategy, // 30 minutes
  
  // Performance data
  PERFORMANCE_STATS: { ttl: 5 * 60, tags: ['performance'], serialize: true } as CacheStrategy, // 5 minutes
} as const;

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'maratron:',
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  commandTimeout: 5000,
};

let redisClient: Redis | null = null;

export function createRedisClient(config: Partial<CacheConfig> = {}): Redis {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  
  const redis = new Redis({
    host: finalConfig.host,
    port: finalConfig.port,
    password: finalConfig.password,
    username: finalConfig.username,
    db: finalConfig.db,
    keyPrefix: finalConfig.keyPrefix,
    retryDelayOnFailover: finalConfig.retryDelayOnFailover,
    enableOfflineQueue: finalConfig.enableOfflineQueue,
    maxRetriesPerRequest: finalConfig.maxRetriesPerRequest,
    lazyConnect: finalConfig.lazyConnect,
    commandTimeout: finalConfig.commandTimeout,
    // Connection pool settings
    family: 4,
    keepAlive: true,
    // Error handling
    showFriendlyErrorStack: process.env.NODE_ENV === 'development',
  });

  // Connection event handlers
  redis.on('connect', () => {
    console.log('🔗 Redis client connected');
  });

  redis.on('ready', () => {
    console.log('✅ Redis client ready');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis client error:', err.message);
  });

  redis.on('close', () => {
    console.log('🔌 Redis client connection closed');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis client reconnecting...');
  });

  redis.on('end', () => {
    console.log('🔚 Redis client connection ended');
  });

  return redis;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis client disconnected');
  }
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Cache key generators
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_RUNS: (userId: string, page: number = 0, limit: number = 50) => 
    `user:runs:${userId}:${page}:${limit}`,
  USER_SHOES: (userId: string) => `user:shoes:${userId}`,
  
  SOCIAL_FEED: (userId: string, page: number = 0) => `social:feed:${userId}:${page}`,
  SOCIAL_PROFILE: (username: string) => `social:profile:${username}`,
  
  LEADERBOARD: (groupId: string, period: string, metric: string) => 
    `leaderboard:${groupId}:${period}:${metric}`,
  
  GROUP_LIST: (profileId?: string, page: number = 0) => 
    `groups:list:${profileId || 'all'}:${page}`,
  GROUP_POSTS: (groupId: string, page: number = 0) => `groups:posts:${groupId}:${page}`,
  
  COACHES: () => 'coaches:list',
  
  USER_SESSION: (userId: string) => `session:${userId}`,
  
  PERFORMANCE_STATS: () => 'performance:stats',
} as const;

// Environment-specific configurations
export const getEnvironmentConfig = (): Partial<CacheConfig> => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return {
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 5,
        commandTimeout: 10000,
      };
    case 'development':
      return {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 2,
        commandTimeout: 2000,
      };
    case 'test':
      return {
        db: 15, // Use a different database for tests
        retryDelayOnFailover: 50,
        maxRetriesPerRequest: 1,
        commandTimeout: 1000,
      };
    default:
      return {};
  }
};