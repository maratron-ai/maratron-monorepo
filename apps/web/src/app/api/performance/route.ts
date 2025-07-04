// src/app/api/performance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { performanceMonitor } from "@lib/performance/monitoring";
import { requireAuth, unauthorizedResponse } from "@lib/middleware/auth";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";
import { cacheManager } from "@lib/cache/cache-manager";

export const GET = withRateLimit(RATE_LIMITS.API, "performance-stats")(
  async (request: NextRequest) => {
    // Require authentication for performance data access
    const authResult = await requireAuth(request);
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error);
    }

    try {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');
      
      if (action === 'report') {
        // Generate and return performance report
        performanceMonitor.generateReport();
        return NextResponse.json({ 
          message: "Performance report generated in console",
          timestamp: new Date().toISOString()
        });
      }
      
      if (action === 'clear') {
        // Clear performance metrics
        performanceMonitor.clear();
        return NextResponse.json({ 
          message: "Performance metrics cleared",
          timestamp: new Date().toISOString()
        });
      }
      
      if (action === 'cache') {
        // Get cache information and health
        const [cacheInfo, cacheHealth] = await Promise.all([
          cacheManager.getInfo(),
          cacheManager.healthCheck()
        ]);
        
        return NextResponse.json({
          cache: {
            ...cacheInfo,
            healthy: cacheHealth,
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Return performance statistics
      const stats = performanceMonitor.getStats();
      
      return NextResponse.json({
        performance: stats,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        actions: {
          report: "/api/performance?action=report",
          clear: "/api/performance?action=clear",
          cache: "/api/performance?action=cache"
        }
      });
      
    } catch (error) {
      console.error("Error fetching performance stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch performance statistics" },
        { status: 500 }
      );
    }
  }
);