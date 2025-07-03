import { DistanceUnit } from "./basics";
import { SocialProfile } from "./social";

export type LeaderboardPeriod = "weekly" | "monthly";

export type LeaderboardMetric = "totalDistance";

export type LeaderboardType = "group";

export interface LeaderboardEntry {
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  socialProfile?: Pick<SocialProfile, "id" | "username" | "profilePhoto">;
  value: number;
  formattedValue: string;
  unit?: DistanceUnit;
  rank: number;
  previousRank?: number;
  change?: number; // Position change from previous period
  streak?: number; // Number of consecutive periods in top 10
  badge?: LeaderboardBadge;
}

export interface LeaderboardData {
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  totalParticipants: number;
  userEntry?: LeaderboardEntry; // Current user's position even if not in top 10
  groupId?: string; // For group leaderboards
  groupName?: string; // For group leaderboards
  lastUpdated: Date;
}

export interface LeaderboardBadge {
  type: "podium" | "streak" | "achievement" | "improvement";
  label: string;
  description: string;
  color: "gold" | "silver" | "bronze" | "purple" | "green" | "blue";
  icon?: string;
}

export interface LeaderboardStats {
  totalDistance: number;
  totalRuns: number;
  averagePace: number; // in seconds per unit
  longestRun: number;
  weeklyMileage: number;
  consistency: number; // percentage of days with runs
  periodStart: Date;
  periodEnd: Date;
  distanceUnit: DistanceUnit;
}

export interface LeaderboardFilters {
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  type: LeaderboardType;
  groupId?: string;
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponse {
  data: LeaderboardData;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PodiumEntry extends LeaderboardEntry {
  medal: "gold" | "silver" | "bronze";
  celebration?: boolean;
}

export interface LeaderboardTrend {
  period: LeaderboardPeriod;
  value: number;
  rank: number;
  date: Date;
}

export interface LeaderboardAchievement {
  id: string;
  userId: string;
  type: "first_podium" | "streak_5" | "streak_10" | "most_improved" | "consistency_king";
  title: string;
  description: string;
  earnedAt: Date;
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  value: number;
}