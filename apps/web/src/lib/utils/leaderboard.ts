import { Run } from "@maratypes/run";
import { User } from "@maratypes/user";
import { 
  LeaderboardEntry, 
  LeaderboardMetric, 
  LeaderboardPeriod, 
  LeaderboardStats,
  LeaderboardBadge
} from "@maratypes/leaderboard";
import { DistanceUnit } from "@maratypes/basics";

// Extended user type for leaderboard calculations
type UserWithSocialProfile = User & {
  socialProfile?: {
    id: string;
    username: string;
    profilePhoto: string | null;
  } | null;
};

/**
 * Converts distance to a target unit
 */
function convertDistance(distance: number, fromUnit: DistanceUnit, toUnit: DistanceUnit): number {
  if (fromUnit === toUnit) return distance;
  
  if (fromUnit === "kilometers" && toUnit === "miles") {
    return distance * 0.621371; // km to miles
  } else if (fromUnit === "miles" && toUnit === "kilometers") {
    return distance * 1.60934; // miles to km
  }
  
  return distance; // fallback
}

/**
 * Filters runs by the specified time period
 */
export function filterRunsByPeriod(
  runs: Run[],
  period: LeaderboardPeriod,
  startDate: Date,
  endDate: Date
): Run[] {
  return runs.filter(run => {
    const runDate = new Date(run.date);
    return runDate >= startDate && runDate <= endDate;
  });
}

/**
 * Calculates leaderboard statistics for a user's runs
 */
export function calculateLeaderboardStats(
  runs: Run[],
  distanceUnit: DistanceUnit
): LeaderboardStats {
  if (runs.length === 0) {
    return {
      totalDistance: 0,
      totalRuns: 0,
      averagePace: 0,
      longestRun: 0,
      weeklyMileage: 0,
      consistency: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
      distanceUnit,
    };
  }

  // Convert all distances to the target unit before summing
  const convertedDistances = runs.map(run => 
    convertDistance(run.distance, run.distanceUnit, distanceUnit)
  );
  
  const totalDistance = convertedDistances.reduce((sum, distance) => sum + distance, 0);
  const totalRuns = runs.length;
  const longestRun = Math.max(...convertedDistances);
  
  // Calculate average pace in seconds
  const paceSeconds = runs
    .filter(run => run.pace?.pace)
    .map(run => {
      const [minutes, seconds] = run.pace!.pace.split(':').map(Number);
      return minutes * 60 + seconds;
    });
  
  const averagePace = paceSeconds.length > 0 
    ? paceSeconds.reduce((sum, pace) => sum + pace, 0) / paceSeconds.length 
    : 0;

  const periodStart = new Date(Math.min(...runs.map(run => run.date.getTime())));
  const periodEnd = new Date(Math.max(...runs.map(run => run.date.getTime())));
  
  // Calculate weekly mileage (assuming the period represents a week)
  const weeklyMileage = totalDistance;

  return {
    totalDistance,
    totalRuns,
    averagePace,
    longestRun,
    weeklyMileage,
    consistency: 0, // Will be calculated separately
    periodStart,
    periodEnd,
    distanceUnit,
  };
}

/**
 * Calculates leaderboard rankings for all users
 */
export function calculateLeaderboardRankings(
  runs: Run[],
  users: UserWithSocialProfile[],
  metric: LeaderboardMetric,
  distanceUnit: DistanceUnit
): LeaderboardEntry[] {
  const userStats = users.map(user => {
    const userRuns = runs.filter(run => run.userId === user.id);
    const stats = calculateLeaderboardStats(userRuns, distanceUnit);
    
    // Since we only support totalDistance now
    const value = stats.totalDistance;

    return {
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      socialProfile: user.socialProfile ? {
        id: user.socialProfile.id,
        username: user.socialProfile.username,
        profilePhoto: user.socialProfile.profilePhoto,
      } : undefined,
      value,
      formattedValue: formatLeaderboardValue(value, metric, distanceUnit),
      rank: 0, // Will be assigned after sorting
    };
  });

  // Sort by total distance (descending - higher is better)
  userStats.sort((a, b) => b.value - a.value);

  // Assign ranks
  userStats.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return handleRankingTies(userStats);
}

/**
 * Handles ties in rankings by assigning the same rank to tied entries
 */
export function handleRankingTies(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const result = [...entries];
  
  for (let i = 0; i < result.length; i++) {
    if (i > 0 && result[i].value === result[i - 1].value) {
      // Same value as previous entry, assign same rank
      result[i].rank = result[i - 1].rank;
    } else if (i > 0) {
      // Different value, assign rank based on position
      result[i].rank = i + 1;
    }
  }
  
  return result;
}

/**
 * Formats a leaderboard value based on the metric type
 */
export function formatLeaderboardValue(
  value: number,
  metric: LeaderboardMetric,
  distanceUnit: DistanceUnit
): string {
  // Since we only support totalDistance now
  return `${value.toFixed(1)} ${distanceUnit}`;
}

/**
 * Calculates the change in rank from previous period
 */
export function calculateRankChange(
  previousRank: number | undefined,
  currentRank: number
): number | undefined {
  if (previousRank === undefined) {
    return undefined; // New entry
  }
  return previousRank - currentRank; // Positive = moved up, negative = moved down
}

/**
 * Calculates consistency score as percentage of days with runs
 */
export function calculateConsistencyScore(runs: Run[], totalDays: number): number {
  if (totalDays === 0) return 0;
  
  const uniqueDays = new Set(
    runs.map(run => run.date.toDateString())
  );
  
  const percentage = (uniqueDays.size / totalDays) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

/**
 * Generates badges for leaderboard entries
 */
export function generateLeaderboardBadges(entry: LeaderboardEntry): LeaderboardBadge[] {
  const badges: LeaderboardBadge[] = [];

  // Podium badges
  if (entry.rank === 1) {
    badges.push({
      type: "podium",
      label: "1st Place",
      description: "First place finish",
      color: "gold",
      icon: "trophy",
    });
  } else if (entry.rank === 2) {
    badges.push({
      type: "podium",
      label: "2nd Place",
      description: "Second place finish",
      color: "silver",
      icon: "medal",
    });
  } else if (entry.rank === 3) {
    badges.push({
      type: "podium",
      label: "3rd Place",
      description: "Third place finish",
      color: "bronze",
      icon: "medal",
    });
  }

  // Streak badges
  if (entry.streak && entry.streak >= 5) {
    badges.push({
      type: "streak",
      label: `${entry.streak} Week Streak`,
      description: `${entry.streak} consecutive weeks in top 10`,
      color: "purple",
      icon: "fire",
    });
  }

  // Improvement badges
  if (entry.change && entry.change >= 3) {
    badges.push({
      type: "improvement",
      label: "Rising Star",
      description: `Moved up ${entry.change} positions`,
      color: "green",
      icon: "trending-up",
    });
  }

  return badges;
}

/**
 * Gets the date range for a leaderboard period
 */
export function getLeaderboardPeriodRange(
  period: LeaderboardPeriod,
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const now = new Date(referenceDate);
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case "daily":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    
    case "weekly":
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since Monday
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59);
      break;
    
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  return { startDate, endDate };
}