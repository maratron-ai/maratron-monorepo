import { NextResponse } from "next/server";
import { cacheManager } from "@lib/cache/cache-manager";
import { prisma } from "@lib/prisma";

export async function GET() {
  try {
    // Check Redis health
    const redisHealth = await cacheManager.healthCheck();
    
    // Check PostgreSQL health
    let databaseHealth = false;
    let databaseError = null;
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealth = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : "Unknown database error";
    }
    
    // Overall health status
    const isHealthy = redisHealth && databaseHealth;
    
    const healthStatus = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: redisHealth ? "healthy" : "unhealthy",
          enabled: process.env.REDIS_ENABLED !== "false"
        },
        database: {
          status: databaseHealth ? "healthy" : "unhealthy",
          error: databaseError
        }
      }
    };
    
    return NextResponse.json(healthStatus, { 
      status: isHealthy ? 200 : 503 
    });
    
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed"
      },
      { status: 500 }
    );
  }
}