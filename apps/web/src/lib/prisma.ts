// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

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
      logger.warn('Slow database query detected', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration,
        params: e.params?.substring(0, 100),
        slowQueryThreshold
      });
    }
    
    // In development, log all queries for debugging
    if (isDevelopment && process.env.LOG_ALL_QUERIES === 'true') {
      logger.debug('Database query executed', {
        query: query.substring(0, 150) + (query.length > 150 ? '...' : ''),
        duration
      });
    }
  });

  // Error monitoring
  prisma.$on('error', (e) => {
    logger.error('Prisma database error', {
      message: e.message,
      target: e.target
    });
  });

  // Info logging (connection events, etc.)
  prisma.$on('info', (e) => {
    if (isDevelopment) {
      logger.info('Prisma info', {
        message: e.message,
        target: e.target
      });
    }
  });

  // Warning monitoring
  prisma.$on('warn', (e) => {
    logger.warn('Prisma warning', {
      message: e.message,
      target: e.target
    });
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
    logger.debug('Database connection check successful');
    return true;
  } catch (error) {
    logger.error('Database connection check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
      logger.info('Database query completed', {
        queryName,
        duration,
        slow: duration > 500
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query failed', {
      queryName,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = async () => {
  if (isShuttingDown) {
    return; // Prevent multiple shutdown attempts
  }
  
  isShuttingDown = true;
  logger.info('Shutting down Prisma connection');
  
  try {
    await prisma.$disconnect();
    logger.info('Prisma connection closed successfully');
  } catch (error) {
    logger.error('Error closing Prisma connection', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Handle shutdown signals (only in production or when explicitly needed)
if (typeof process !== 'undefined' && (isProduction || process.env.ENABLE_PRISMA_SHUTDOWN_HANDLERS === 'true')) {
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  // Remove beforeExit as it's triggered too frequently in development
}
