// lib/middleware/rateLimit.ts
import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitState>();

// Different rate limits for different endpoint types
export const RATE_LIMITS = {
  AUTH: { requests: 5, window: 300 }, // 5 requests per 5 minutes for auth
  API: { requests: 100, window: 60 }, // 100 requests per minute for general API
  UPLOAD: { requests: 10, window: 60 }, // 10 uploads per minute
  CHAT: { requests: 20, window: 60 }, // 20 chat requests per minute
  SOCIAL: { requests: 50, window: 60 }, // 50 social requests per minute
} as const;

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || 
            request.headers.get("x-real-ip") || 
            "127.0.0.1";
  return ip;
}

/**
 * Check if request exceeds rate limit
 */
export function checkRateLimit(
  request: NextRequest, 
  config: RateLimitConfig,
  prefix: string = "general"
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request);
  const key = `${prefix}:${clientId}`;
  const now = Date.now();
  const windowMs = config.window * 1000;
  
  let state = rateLimitStore.get(key);
  
  // Reset if window has expired
  if (!state || now > state.resetTime) {
    state = {
      count: 0,
      resetTime: now + windowMs
    };
  }
  
  // Check if limit exceeded
  if (state.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: state.resetTime
    };
  }
  
  // Increment counter
  state.count++;
  rateLimitStore.set(key, state);
  
  return {
    allowed: true,
    remaining: config.requests - state.count,
    resetTime: state.resetTime
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  config: RateLimitConfig,
  type: string = "api"
) {
  return function rateLimitMiddleware(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
      const rateLimit = checkRateLimit(request, config, type);
      
      if (!rateLimit.allowed) {
        const resetDate = new Date(rateLimit.resetTime);
        
        return NextResponse.json(
          { 
            error: "Too many requests",
            resetTime: resetDate.toISOString()
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": config.requests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString(),
              "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
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
    };
  };
}

/**
 * Cleanup expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, state] of rateLimitStore.entries()) {
    if (now > state.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}