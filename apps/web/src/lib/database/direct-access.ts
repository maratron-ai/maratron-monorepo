/**
 * Direct database access for Docker environment
 * Bypasses MCP when running in same container
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserDataResult {
  profile?: {
    id: string;
    name: string | null;
    email: string;
    trainingLevel: string | null;
    defaultDistanceUnit: string | null;
    yearsRunning: number | null;
    weeklyMileage: number | null;
    goals: string[];
    createdAt: Date;
  } | null;
  recent_runs?: {
    id: string;
    date: Date;
    distance: number;
    distanceUnit: string;
    duration: string;
    pace: string | null;
    elevationGain: number | null;
    name: string | null;
    notes: string | null;
  }[];
  shoes?: {
    id: string;
    name: string;
    currentDistance: number;
    maxDistance: number;
    distanceUnit: string;
    retired: boolean;
    notes: string | null;
    createdAt: Date;
  }[];
  preferences?: {
    distance_unit: string;
    response_detail: string;
    max_results: number;
  };
}

/**
 * Get user data directly from database for Docker environment
 */
export async function getUserDataDirect(userId: string, dataTypes: string[]): Promise<UserDataResult> {
  try {
    const result: UserDataResult = {};

    // Get user profile if needed
    if (dataTypes.includes('profile') || dataTypes.includes('shoes') || dataTypes.includes('runs')) {
      result.profile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          trainingLevel: true,
          defaultDistanceUnit: true,
          yearsRunning: true,
          weeklyMileage: true,
          goals: true,
          createdAt: true
        }
      });
    }

    // Get recent runs if needed
    if (dataTypes.includes('runs')) {
      result.recent_runs = await prisma.run.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10,
        select: {
          id: true,
          date: true,
          distance: true,
          distanceUnit: true,
          duration: true,
          pace: true,
          elevationGain: true,
          name: true,
          notes: true
        }
      });
    }

    // Get shoes if needed
    if (dataTypes.includes('shoes')) {
      result.shoes = await prisma.shoe.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          currentDistance: true,
          maxDistance: true,
          distanceUnit: true,
          retired: true,
          notes: true,
          createdAt: true
        }
      });
    }

    // Set basic preferences
    result.preferences = {
      distance_unit: result.profile?.defaultDistanceUnit || 'miles',
      response_detail: 'detailed',
      max_results: 10
    };

    return result;
  } catch (error) {
    console.error('Direct database access failed:', error);
    return {};
  }
}

/**
 * Check if we're running in Docker environment
 * Note: MCP bypass removed to maintain consistent AI intelligence across all environments
 */
export function isDockerEnvironment(): boolean {
  // Always use MCP for consistent AI capabilities - Docker bypass removed
  return false;
}