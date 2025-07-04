import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { requireAuth, unauthorizedResponse } from "@lib/middleware/auth";
import { withRateLimit, RATE_LIMITS } from "@lib/middleware/rateLimit";
import { cache } from "@lib/cache/cache-manager";
import {
  calculateLeaderboardRankings,
  filterRunsByPeriod,
  getLeaderboardPeriodRange,
} from "@lib/utils/leaderboard";
import {
  LeaderboardPeriod,
  LeaderboardMetric,
  LeaderboardType,
  LeaderboardData,
  LeaderboardResponse,
} from "@maratypes/leaderboard";
import { DistanceUnit } from "@maratypes/basics";

const VALID_PERIODS: LeaderboardPeriod[] = ["weekly", "monthly"];
const VALID_TYPES: LeaderboardType[] = ["group"];

export const GET = withRateLimit(RATE_LIMITS.API, "leaderboards-get")(
  async (req: NextRequest): Promise<NextResponse<LeaderboardResponse>> => {
    // Require authentication for leaderboard access
    const authResult = await requireAuth(req);
    if (!authResult.isAuthenticated) {
      return unauthorizedResponse(authResult.error) as NextResponse<LeaderboardResponse>;
    }

    try {
    const searchParams = req.nextUrl.searchParams;
    
    // Parse and validate parameters
    const period = (searchParams.get("period") as LeaderboardPeriod) || "weekly";
    const metric: LeaderboardMetric = "totalDistance"; // Always use distance
    const type = (searchParams.get("type") as LeaderboardType) || "group";
    const groupId = searchParams.get("groupId");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Validate parameters
    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json({
        success: false,
        error: "Invalid period. Must be weekly or monthly",
        data: {} as LeaderboardData,
      }, { status: 400 });
    }
    
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({
        success: false,
        error: "Invalid type. Must be group",
        data: {} as LeaderboardData,
      }, { status: 400 });
    }

    // Get date range for the period
    const { startDate, endDate } = getLeaderboardPeriodRange(period, new Date());

    let userIds: string[] = [];

    // Handle group leaderboard
    if (!groupId) {
      return NextResponse.json({
        success: false,
        error: "Group ID required for group leaderboard",
        data: {} as LeaderboardData,
      }, { status: 400 });
    }
    
    // Get group members
    const groupMembers = await prisma.runGroupMember.findMany({
      where: { groupId },
      include: {
        socialProfile: {
          select: { userId: true },
        },
      },
    });
    
    userIds = groupMembers
      .map(member => member.socialProfile?.userId)
      .filter((userId): userId is string => userId !== null);

    // Ensure we have users to query
    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          period,
          metric,
          type,
          entries: [],
          totalParticipants: 0,
          lastUpdated: new Date(),
        } as LeaderboardData,
      });
    }

    // OPTIMIZED: Cache leaderboard data
    const leaderboardData = await cache.leaderboard(groupId, period, metric, async () => {
      // Single query to fetch runs with user data
      const runs = await prisma.run.findMany({
        where: {
          userId: { in: userIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          userId: true,
          date: true,
          distance: true,
          distanceUnit: true,
          duration: true,
          createdAt: true,
          // Include user data in the same query to avoid N+1
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              defaultDistanceUnit: true,
              socialProfile: {
                select: {
                  username: true,
                  profilePhoto: true,
                },
              },
            },
          },
        },
        // Add reasonable limit to prevent memory issues
        take: 10000, // Limit to 10k runs max for leaderboard calculations
        orderBy: { date: 'desc' },
      });
      
      // Filter runs by period (additional filtering if needed)
      const filteredRuns = filterRunsByPeriod(runs, period, startDate, endDate);

      // Extract unique users from the runs data (already included)
      const userMap = new Map();
      runs.forEach(run => {
        if (!userMap.has(run.userId)) {
          userMap.set(run.userId, run.user);
        }
      });
      const users = Array.from(userMap.values());

      // Calculate rankings
      const defaultDistanceUnit: DistanceUnit = "miles"; // Could be made configurable
      const rankings = calculateLeaderboardRankings(
        filteredRuns,
        users,
        metric,
        defaultDistanceUnit
      );

      return {
        period,
        metric,
        type,
        entries: rankings,
        totalParticipants: rankings.length,
        groupId: groupId,
        lastUpdated: new Date(),
      };
    });
    
    // Apply limit and add user entry
    const limitedRankings = leaderboardData.entries.slice(0, limit);
    
    // Find current user's entry if they are a group member
    let userEntry;
    const session = await getServerSession(authOptions);
    if (session?.user?.id && userIds.includes(session.user.id)) {
      userEntry = leaderboardData.entries.find(entry => entry.userId === session.user.id);
    }

    const finalLeaderboardData: LeaderboardData = {
      ...leaderboardData,
      entries: limitedRankings,
      userEntry,
    };

    return NextResponse.json({
      success: true,
      data: finalLeaderboardData,
    });

  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch leaderboard data",
      data: {} as LeaderboardData,
    }, { status: 500 });
  }
});