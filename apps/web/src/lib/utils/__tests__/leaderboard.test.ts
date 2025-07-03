import {
  calculateLeaderboardRankings,
  filterRunsByPeriod,
  formatLeaderboardValue,
  calculateLeaderboardStats,
  handleRankingTies,
  calculateRankChange,
  generateLeaderboardBadges,
  calculateConsistencyScore,
} from "../leaderboard";
import { Run } from "@maratypes/run";
import { User } from "@maratypes/user";
import { LeaderboardEntry } from "@maratypes/leaderboard";

describe("leaderboard calculations", () => {
  // Mock data for testing
  const mockUsers: User[] = [
    {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      avatarUrl: "https://example.com/avatar1.jpg",
      defaultDistanceUnit: "miles",
    },
    {
      id: "user2", 
      name: "Jane Smith",
      email: "jane@example.com",
      avatarUrl: "https://example.com/avatar2.jpg",
      defaultDistanceUnit: "miles",
    },
    {
      id: "user3",
      name: "Bob Johnson",
      email: "bob@example.com",
      avatarUrl: "https://example.com/avatar3.jpg",
      defaultDistanceUnit: "miles",
    },
  ];

  const mockRuns: Run[] = [
    {
      id: "run1",
      userId: "user1",
      date: new Date("2024-01-01"),
      distance: 5.0,
      distanceUnit: "miles",
      duration: "35:00",
      pace: { unit: "miles", pace: "7:00" },
    },
    {
      id: "run2",
      userId: "user1",
      date: new Date("2024-01-02"),
      distance: 3.0,
      distanceUnit: "miles",
      duration: "21:30",
      pace: { unit: "miles", pace: "7:10" },
    },
    {
      id: "run3",
      userId: "user2",
      date: new Date("2024-01-01"),
      distance: 6.0,
      distanceUnit: "miles",
      duration: "42:00",
      pace: { unit: "miles", pace: "7:00" },
    },
    {
      id: "run4",
      userId: "user2",
      date: new Date("2024-01-03"),
      distance: 4.0,
      distanceUnit: "miles",
      duration: "28:00",
      pace: { unit: "miles", pace: "7:00" },
    },
    {
      id: "run5",
      userId: "user3",
      date: new Date("2024-01-01"),
      distance: 2.0,
      distanceUnit: "miles",
      duration: "14:00",
      pace: { unit: "miles", pace: "7:00" },
    },
  ];

  describe("filterRunsByPeriod", () => {
    it("filters runs by weekly period", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-07");
      const result = filterRunsByPeriod(mockRuns, "weekly", startDate, endDate);
      expect(result).toHaveLength(5);
    });

    it("filters runs by daily period", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-01");
      const result = filterRunsByPeriod(mockRuns, "daily", startDate, endDate);
      expect(result).toHaveLength(3); // Three users ran on 2024-01-01
    });

    it("returns empty array for period with no runs", () => {
      const startDate = new Date("2024-02-01");
      const endDate = new Date("2024-02-07");
      const result = filterRunsByPeriod(mockRuns, "weekly", startDate, endDate);
      expect(result).toHaveLength(0);
    });
  });

  describe("calculateLeaderboardStats", () => {
    it("calculates total distance correctly", () => {
      const userRuns = mockRuns.filter(run => run.userId === "user1");
      const stats = calculateLeaderboardStats(userRuns, "miles");
      expect(stats.totalDistance).toBe(8.0); // 5.0 + 3.0
      expect(stats.totalRuns).toBe(2);
    });

    it("calculates average pace correctly", () => {
      const userRuns = mockRuns.filter(run => run.userId === "user1");
      const stats = calculateLeaderboardStats(userRuns, "miles");
      expect(stats.averagePace).toBe(425); // Average of 7:00 and 7:10 in seconds
    });

    it("finds longest run correctly", () => {
      const userRuns = mockRuns.filter(run => run.userId === "user2");
      const stats = calculateLeaderboardStats(userRuns, "miles");
      expect(stats.longestRun).toBe(6.0);
    });
  });

  describe("calculateLeaderboardRankings", () => {
    it("ranks users by total distance", () => {
      const rankings = calculateLeaderboardRankings(
        mockRuns,
        mockUsers,
        "totalDistance",
        "miles"
      );
      expect(rankings).toHaveLength(3);
      expect(rankings[0].userId).toBe("user2"); // 10.0 miles total
      expect(rankings[1].userId).toBe("user1"); // 8.0 miles total
      expect(rankings[2].userId).toBe("user3"); // 2.0 miles total
    });

    it("only supports total distance metric", () => {
      const rankings = calculateLeaderboardRankings(
        mockRuns,
        mockUsers,
        "totalDistance",
        "miles"
      );
      // Since we only support totalDistance now, all rankings are by distance
      expect(rankings[0].userId).toBe("user2"); // 10.0 miles total
      expect(rankings[1].userId).toBe("user1"); // 8.0 miles total
      expect(rankings[2].userId).toBe("user3"); // 2.0 miles total
    });

    it("assigns correct ranks", () => {
      const rankings = calculateLeaderboardRankings(
        mockRuns,
        mockUsers,
        "totalDistance",
        "miles"
      );
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].rank).toBe(2);
      expect(rankings[2].rank).toBe(3);
    });
  });

  describe("handleRankingTies", () => {
    it("handles ties correctly", () => {
      const entries: LeaderboardEntry[] = [
        {
          userId: "user1",
          user: { id: "user1", name: "John" },
          value: 10.0,
          formattedValue: "10.0 miles",
          rank: 1,
        },
        {
          userId: "user2",
          user: { id: "user2", name: "Jane" },
          value: 10.0,
          formattedValue: "10.0 miles",
          rank: 2,
        },
        {
          userId: "user3",
          user: { id: "user3", name: "Bob" },
          value: 8.0,
          formattedValue: "8.0 miles",
          rank: 3,
        },
      ];

      const result = handleRankingTies(entries);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(1); // Tied for first
      expect(result[2].rank).toBe(3); // Next rank after tie
    });
  });

  describe("formatLeaderboardValue", () => {
    it("formats distance values", () => {
      const result = formatLeaderboardValue(15.5, "totalDistance", "miles");
      expect(result).toBe("15.5 miles");
    });

    it("formats distance values", () => {
      const result = formatLeaderboardValue(12.5, "totalDistance", "miles");
      expect(result).toBe("12.5 miles");
    });

    it("formats distance values in kilometers", () => {
      const result = formatLeaderboardValue(20.1, "totalDistance", "kilometers");
      expect(result).toBe("20.1 kilometers");
    });
  });

  describe("calculateRankChange", () => {
    it("calculates positive rank change", () => {
      const change = calculateRankChange(5, 3);
      expect(change).toBe(2); // Moved up 2 positions
    });

    it("calculates negative rank change", () => {
      const change = calculateRankChange(3, 5);
      expect(change).toBe(-2); // Moved down 2 positions
    });

    it("returns 0 for no change", () => {
      const change = calculateRankChange(3, 3);
      expect(change).toBe(0);
    });

    it("returns undefined for new entries", () => {
      const change = calculateRankChange(undefined, 3);
      expect(change).toBeUndefined();
    });
  });

  describe("calculateConsistencyScore", () => {
    it("calculates consistency for daily runs", () => {
      const runs = [
        { date: new Date("2024-01-01") },
        { date: new Date("2024-01-02") },
        { date: new Date("2024-01-03") },
      ];
      const totalDays = 7;
      const score = calculateConsistencyScore(runs as Run[], totalDays);
      expect(score).toBe(42.86); // 3/7 * 100, rounded to 2 decimal places
    });

    it("handles empty runs array", () => {
      const score = calculateConsistencyScore([], 7);
      expect(score).toBe(0);
    });
  });

  describe("generateLeaderboardBadges", () => {
    it("generates podium badges", () => {
      const entry: LeaderboardEntry = {
        userId: "user1",
        user: { id: "user1", name: "John" },
        value: 50.0,
        formattedValue: "50.0 miles",
        rank: 1,
      };

      const badges = generateLeaderboardBadges(entry);
      expect(badges).toHaveLength(1);
      expect(badges[0].type).toBe("podium");
      expect(badges[0].color).toBe("gold");
    });

    it("generates streak badges", () => {
      const entry: LeaderboardEntry = {
        userId: "user1",
        user: { id: "user1", name: "John" },
        value: 30.0,
        formattedValue: "30.0 miles",
        rank: 5,
        streak: 5,
      };

      const badges = generateLeaderboardBadges(entry);
      expect(badges.some(badge => badge.type === "streak")).toBe(true);
    });

    it("generates improvement badges", () => {
      const entry: LeaderboardEntry = {
        userId: "user1",
        user: { id: "user1", name: "John" },
        value: 20.0,
        formattedValue: "20.0 miles",
        rank: 3,
        change: 5, // Moved up 5 positions
      };

      const badges = generateLeaderboardBadges(entry);
      expect(badges.some(badge => badge.type === "improvement")).toBe(true);
    });
  });
});