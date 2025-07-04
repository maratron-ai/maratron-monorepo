// lib/middleware/rateLimit.ts
import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
  blockDuration?: number; // in seconds, for progressive penalties
}

interface RateLimitState {
  count: number;
  resetTime: number;
  violations?: number; // Track repeated violations
  blockedUntil?: number; // Block timestamp for progressive penalties
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitState | null>;
  set(key: string, state: RateLimitState): Promise<void>;
  delete(key: string): Promise<void>;
}

// In-memory store for development (fallback)
const memoryStore = new Map<string, RateLimitState>();

// Type for Redis client
interface RedisClient {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<number>;
}

// Redis store implementation (production) - using our ioredis client
class RedisRateLimitStore implements RateLimitStore {
  private redis: RedisClient | null = null;

  constructor() {
    // Only initialize Redis when our cache is enabled
    if (process.env.REDIS_ENABLED === 'true') {
      this.initializeRedis();
    }
  }

  private async initializeRedis() {
    try {
      // Use our existing Redis client
      const { getRedisClient } = await import('../cache/redis-config');
      this.redis = getRedisClient();
    } catch (error) {
      console.warn('Redis cache not available, falling back to in-memory rate limiting:', error);
      this.redis = null;
    }
  }

  async get(key: string): Promise<RateLimitState | null> {
    if (!this.redis) return memoryStore.get(key) || null;
    
    try {
      const data = await this.redis.get(`ratelimit:${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return memoryStore.get(key) || null;
    }
  }

  async set(key: string, state: RateLimitState): Promise<void> {
    if (!this.redis) {
      memoryStore.set(key, state);
      return;
    }

    try {
      const ttl = Math.max(0, state.resetTime - Date.now());
      await this.redis.setEx(`ratelimit:${key}`, Math.ceil(ttl / 1000), JSON.stringify(state));
    } catch {
      memoryStore.set(key, state);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) {
      memoryStore.delete(key);
      return;
    }

    try {
      await this.redis.del(`ratelimit:${key}`);
    } catch {
      memoryStore.delete(key);
    }
  }
}

// Initialize store
const rateLimitStore = new RedisRateLimitStore();

// Different rate limits for different endpoint types with progressive penalties
export const RATE_LIMITS = {
  AUTH: { requests: 5, window: 300, blockDuration: 900 }, // 5 requests per 5 minutes, 15-min block
  API: { requests: 100, window: 60, blockDuration: 300 }, // 100 requests per minute, 5-min block
  UPLOAD: { requests: 10, window: 60, blockDuration: 600 }, // 10 uploads per minute, 10-min block
  CHAT: { requests: 20, window: 60, blockDuration: 180 }, // 20 chat requests per minute, 3-min block
  SOCIAL: { requests: 50, window: 60, blockDuration: 240 }, // 50 social requests per minute, 4-min block
} as const;

// Trusted IP ranges (can be configured via environment)
const TRUSTED_IPS = new Set(
  (process.env.TRUSTED_IPS || '127.0.0.1,::1').split(',').map(ip => ip.trim())
);

/**
 * Get client identifier for rate limiting with improved proxy support
 */
function getClientId(request: NextRequest): string {
  // Handle various proxy headers in order of preference
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  const xClientIp = request.headers.get("x-client-ip");
  
  let ip = "127.0.0.1";
  
  if (cfConnectingIp) {
    ip = cfConnectingIp;
  } else if (realIp) {
    ip = realIp;
  } else if (forwarded) {
    // Take the first IP from the forwarded chain
    ip = forwarded.split(",")[0].trim();
  } else if (xClientIp) {
    ip = xClientIp;
  }
  
  // Validate IP format and sanitize
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    console.warn(`Invalid IP format detected: ${ip}, using fallback`);
    ip = "127.0.0.1";
  }
  
  return ip;
}

/**
 * Check if request exceeds rate limit with progressive penalties
 */
export async function checkRateLimit(
  request: NextRequest, 
  config: RateLimitConfig,
  prefix: string = "general"
): Promise<{ allowed: boolean; remaining: number; resetTime: number; blockedUntil?: number }> {
  const clientId = getClientId(request);
  
  // Skip rate limiting for trusted IPs
  if (TRUSTED_IPS.has(clientId)) {
    return {
      allowed: true,
      remaining: config.requests,
      resetTime: Date.now() + config.window * 1000
    };
  }
  
  const key = `${prefix}:${clientId}`;
  const now = Date.now();
  const windowMs = config.window * 1000;
  
  let state = await rateLimitStore.get(key);
  
  // Check if currently blocked
  if (state?.blockedUntil && now < state.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: state.resetTime,
      blockedUntil: state.blockedUntil
    };
  }
  
  // Reset if window has expired
  if (!state || now > state.resetTime) {
    state = {
      count: 0,
      resetTime: now + windowMs,
      violations: state?.violations || 0
    };
  }
  
  // Check if limit exceeded
  if (state.count >= config.requests) {
    // Increment violations and apply progressive penalty
    state.violations = (state.violations || 0) + 1;
    const blockDuration = (config.blockDuration || 300) * Math.min(state.violations, 5); // Max 5x penalty
    state.blockedUntil = now + blockDuration * 1000;
    
    await rateLimitStore.set(key, state);
    
    // Log security event
    console.warn(`Rate limit exceeded for ${clientId}, blocked for ${blockDuration}s (violation #${state.violations})`);
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: state.resetTime,
      blockedUntil: state.blockedUntil
    };
  }
  
  // Increment counter
  state.count++;
  await rateLimitStore.set(key, state);
  
  return {
    allowed: true,
    remaining: config.requests - state.count,
    resetTime: state.resetTime
  };
}

/**
 * Enhanced rate limiting middleware with progressive penalties
 */
export function withRateLimit(
  config: RateLimitConfig,
  type: string = "api"
) {
  return function rateLimitMiddleware(
    handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
      try {
        const rateLimit = await checkRateLimit(request, config, type);
        
        if (!rateLimit.allowed) {
          const resetDate = new Date(rateLimit.resetTime);
          const retryAfter = rateLimit.blockedUntil 
            ? Math.ceil((rateLimit.blockedUntil - Date.now()) / 1000)
            : Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
          
          const errorMessage = rateLimit.blockedUntil 
            ? "Rate limit exceeded. Temporarily blocked due to repeated violations."
            : "Too many requests";
          
          return NextResponse.json(
            { 
              error: errorMessage,
              resetTime: resetDate.toISOString(),
              retryAfter
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": config.requests.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString(),
                "Retry-After": retryAfter.toString(),
                ...(rateLimit.blockedUntil && {
                  "X-RateLimit-Blocked-Until": Math.ceil(rateLimit.blockedUntil / 1000).toString()
                })
              }
            }
          );
        }
        
        const response = await handler(request, ...args);
        
        // Add rate limit headers to successful responses
        response.headers.set("X-RateLimit-Limit", config.requests.toString());
        response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
        response.headers.set("X-RateLimit-Reset", Math.ceil(rateLimit.resetTime / 1000).toString());
        
        return response;
      } catch (error) {
        // If rate limiting fails, log error but don't block the request
        console.error("Rate limiting error:", error);
        return await handler(request, ...args);
      }
    };
  };
}

/**
 * Cleanup expired rate limit entries (call periodically)
 * Note: Redis entries have TTL, so this only cleans memory store
 */
export async function cleanupRateLimitStore(): Promise<void> {
  const now = Date.now();
  for (const [key, state] of memoryStore.entries()) {
    if (now > state.resetTime && (!state.blockedUntil || now > state.blockedUntil)) {
      memoryStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes (only for memory store)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupRateLimitStore().catch(error => {
      console.error("Rate limit cleanup error:", error);
    });
  }, 5 * 60 * 1000);
}