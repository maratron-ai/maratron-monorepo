// lib/performance/monitoring.ts
import { NextRequest } from "next/server";

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
  queryCount?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  userAgent?: string;
  ip?: string;
}

interface QueryMetrics {
  query: string;
  duration: number;
  params?: string;
  slow: boolean;
}

interface EndpointStat {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  slowCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private queryMetrics: QueryMetrics[] = [];
  private readonly maxStoredMetrics = 1000;

  /**
   * Track API endpoint performance
   */
  async trackEndpoint<T>(
    request: NextRequest,
    endpoint: string,
    handler: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await handler();
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage();
      
      this.recordMetric({
        endpoint,
        method: request.method,
        duration,
        timestamp: new Date(),
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        userAgent: request.headers.get('user-agent') || undefined,
        ip: this.getClientIP(request),
      });
      
      // Log slow requests
      if (duration > 2000) {
        console.warn(`🐌 Slow endpoint: ${endpoint} (${duration}ms)`);
      } else if (duration > 1000) {
        console.log(`⚠️ Moderate response time: ${endpoint} (${duration}ms)`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ Endpoint error: ${endpoint} (${duration}ms):`, error);
      throw error;
    }
  }

  /**
   * Record database query metrics
   */
  recordQuery(query: string, duration: number, params?: string) {
    const slow = duration > 500; // Queries over 500ms are considered slow
    
    this.queryMetrics.push({
      query: query.substring(0, 200), // Truncate long queries
      duration,
      params: params?.substring(0, 100),
      slow,
    });
    
    // Keep only recent queries
    if (this.queryMetrics.length > this.maxStoredMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxStoredMetrics);
    }
    
    if (slow) {
      console.warn(`🐌 Slow query (${duration}ms):`, query.substring(0, 100));
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const recentMetrics = this.metrics.slice(-100); // Last 100 requests
    const recentQueries = this.queryMetrics.slice(-100);
    
    if (recentMetrics.length === 0) {
      return {
        endpoints: {},
        queries: {},
        summary: {
          totalRequests: 0,
          averageResponseTime: 0,
          slowRequests: 0,
          slowQueries: 0,
        }
      };
    }
    
    // Endpoint statistics
    const endpointStats = recentMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          slowCount: 0,
        };
      }
      
      acc[key].count++;
      acc[key].totalDuration += metric.duration;
      acc[key].avgDuration = acc[key].totalDuration / acc[key].count;
      acc[key].minDuration = Math.min(acc[key].minDuration, metric.duration);
      acc[key].maxDuration = Math.max(acc[key].maxDuration, metric.duration);
      
      if (metric.duration > 1000) {
        acc[key].slowCount++;
      }
      
      return acc;
    }, {} as Record<string, EndpointStat>);
    
    // Query statistics
    const queryStats = {
      totalQueries: recentQueries.length,
      slowQueries: recentQueries.filter(q => q.slow).length,
      averageQueryTime: recentQueries.length > 0 
        ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length 
        : 0,
      slowestQueries: recentQueries
        .filter(q => q.slow)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
    };
    
    // Overall summary
    const summary = {
      totalRequests: recentMetrics.length,
      averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
      slowRequests: recentMetrics.filter(m => m.duration > 1000).length,
      slowQueries: queryStats.slowQueries,
      memoryTrend: this.getMemoryTrend(recentMetrics),
    };
    
    return {
      endpoints: endpointStats,
      queries: queryStats,
      summary,
    };
  }

  /**
   * Get memory usage trend
   */
  private getMemoryTrend(metrics: PerformanceMetrics[]) {
    if (metrics.length < 2) return 'stable';
    
    const recentMemory = metrics.slice(-10).map(m => m.memoryUsage?.heapUsed || 0);
    const trend = recentMemory.reduce((sum, mem, i, arr) => {
      if (i === 0) return 0;
      return sum + (mem - arr[i - 1]);
    }, 0) / (recentMemory.length - 1);
    
    if (trend > 1024 * 1024) return 'increasing'; // >1MB increase
    if (trend < -1024 * 1024) return 'decreasing'; // >1MB decrease
    return 'stable';
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const stats = this.getStats();
    
    console.log('\n📊 PERFORMANCE REPORT');
    console.log('='.repeat(50));
    console.log(`Total Requests: ${stats.summary.totalRequests}`);
    console.log(`Average Response Time: ${stats.summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`Slow Requests (>1s): ${stats.summary.slowRequests}`);
    console.log(`Slow Queries (>500ms): ${stats.summary.slowQueries}`);
    console.log(`Memory Trend: ${stats.summary.memoryTrend}`);
    
    if (Object.keys(stats.endpoints).length > 0) {
      console.log('\n🎯 ENDPOINT PERFORMANCE:');
      Object.entries(stats.endpoints).forEach(([endpoint, data]: [string, EndpointStat]) => {
        console.log(`  ${endpoint}: ${data.avgDuration.toFixed(2)}ms avg (${data.count} requests)`);
        if (data.slowCount > 0) {
          console.log(`    ⚠️ ${data.slowCount} slow requests`);
        }
      });
    }
    
    if (stats.queries.slowestQueries.length > 0) {
      console.log('\n🐌 SLOWEST QUERIES:');
      stats.queries.slowestQueries.slice(0, 5).forEach((query: QueryMetrics) => {
        console.log(`  ${query.duration}ms: ${query.query.substring(0, 80)}...`);
      });
    }
    
    console.log('='.repeat(50));
  }

  /**
   * Clear stored metrics
   */
  clear() {
    this.metrics = [];
    this.queryMetrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Export wrapper function for easy use in API routes
export const withPerformanceTracking = (endpoint: string) => {
  return <T>(handler: (request: NextRequest) => Promise<T>) => {
    return (request: NextRequest) => {
      return performanceMonitor.trackEndpoint(request, endpoint, () => handler(request));
    };
  };
};

// Export function to integrate with Prisma query logging
export const trackPrismaQuery = (query: string, duration: number, params?: string) => {
  performanceMonitor.recordQuery(query, duration, params);
};