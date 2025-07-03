import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
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

export async function GET(req: NextRequest): Promise<NextResponse<LeaderboardResponse>> {
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

    // Fetch runs for the period
    const runQuery = {
      where: {
        userId: { in: userIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            defaultDistanceUnit: true,
          },
        },
      },
    };

    const runs = await prisma.run.findMany(runQuery);
    
    // Filter runs by period (additional filtering if needed)
    const filteredRuns = filterRunsByPeriod(runs, period, startDate, endDate);

    // Get users for the leaderboard with social profiles
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        defaultDistanceUnit: true,
        socialProfile: {
          select: {
            username: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Calculate rankings
    const defaultDistanceUnit: DistanceUnit = "miles"; // Could be made configurable
    const rankings = calculateLeaderboardRankings(
      filteredRuns,
      users,
      metric,
      defaultDistanceUnit
    );

    // Apply limit
    const limitedRankings = rankings.slice(0, limit);

    // Find current user's entry if they are a group member
    let userEntry;
    const session = await getServerSession(authOptions);
    if (session?.user?.id && userIds.includes(session.user.id)) {
      userEntry = rankings.find(entry => entry.userId === session.user.id);
    }

    const leaderboardData: LeaderboardData = {
      period,
      metric,
      type,
      entries: limitedRankings,
      totalParticipants: rankings.length,
      userEntry,
      groupId: groupId,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: leaderboardData,
    });

  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch leaderboard data",
      data: {} as LeaderboardData,
    }, { status: 500 });
  }
}