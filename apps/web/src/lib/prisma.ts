// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Performance monitoring and logging
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// Enhanced logging configuration
const getLogConfig = () => {
  if (isTest) return [];
  if (isDevelopment) {
    return [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ] as const;
  }
  return [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ] as const;
};

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: getLogConfig(),
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Enhanced error formatting
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
  });

// Performance monitoring and query logging
if (!isTest) {
  // Import performance monitoring (dynamic to avoid circular deps)
  let trackPrismaQuery: ((query: string, duration: number, params?: string) => void) | null = null;
  
  try {
    // Dynamic import to avoid potential circular dependency
    import('./performance/monitoring').then(module => {
      trackPrismaQuery = module.trackPrismaQuery;
    }).catch(() => {
      // Ignore if monitoring module not available
    });
  } catch {
    // Ignore import errors
  }

  // Query performance monitoring
  prisma.$on('query', (e) => {
    const duration = e.duration;
    const query = e.query;
    
    // Track query in performance monitor
    if (trackPrismaQuery) {
      trackPrismaQuery(query, duration, e.params);
    }
    
    // Log slow queries (>1000ms in production, >500ms in development)
    const slowQueryThreshold = isProduction ? 1000 : 500;
    
    if (duration > slowQueryThreshold) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        params: e.params?.substring(0, 100),
        timestamp: new Date().toISOString(),
      });
    }
    
    // In development, log all queries for debugging
    if (isDevelopment && process.env.LOG_ALL_QUERIES === 'true') {
      console.log(`🔍 Query (${duration}ms):`, {
        query: query.substring(0, 150) + (query.length > 150 ? '...' : ''),
        duration: `${duration}ms`,
      });
    }
  });

  // Error monitoring
  prisma.$on('error', (e) => {
    console.error('🚨 Prisma Error:', {
      message: e.message,
      timestamp: new Date().toISOString(),
    });
  });

  // Info logging (connection events, etc.)
  prisma.$on('info', (e) => {
    if (isDevelopment) {
      console.info('ℹ️ Prisma Info:', e.message);
    }
  });

  // Warning monitoring
  prisma.$on('warn', (e) => {
    console.warn('⚠️ Prisma Warning:', e.message);
  });
}

// Global instance management for development hot reloading
if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

// Connection monitoring utilities
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Performance utilities
export const queryWithMetrics = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    if (duration > 100) { // Log queries taking >100ms
      console.log(`📊 ${queryName} completed in ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ ${queryName} failed after ${duration}ms:`, error);
    throw error;
  }
};

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('✅ Prisma connection closed');
};

// Handle shutdown signals
if (typeof process !== 'undefined') {
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('beforeExit', gracefulShutdown);
}
