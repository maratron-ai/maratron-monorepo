/**
 * @jest-environment node
 */

// Mock PrismaClient
jest.mock('@prisma/client');

// Mock prisma import
jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
    run: {
      findMany: jest.fn(),
    },
    runGroupMember: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock leaderboard utilities
jest.mock('@lib/utils/leaderboard', () => ({
  calculateLeaderboardRankings: jest.fn(),
  filterRunsByPeriod: jest.fn(),
  getLeaderboardPeriodRange: jest.fn(),
}));

import { GET } from '../route';
import { prisma } from '@lib/prisma';
import { NextRequest } from 'next/server';
import {
  calculateLeaderboardRankings,
  filterRunsByPeriod,
  getLeaderboardPeriodRange,
} from '@lib/utils/leaderboard';

describe('GET /api/leaderboards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUsers = [
    {
      id: 'user1',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar1.jpg',
      defaultDistanceUnit: 'miles',
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      avatarUrl: 'https://example.com/avatar2.jpg',
      defaultDistanceUnit: 'miles',
    },
  ];

  const mockRuns = [
    {
      id: 'run1',
      userId: 'user1',
      date: new Date('2024-01-01'),
      distance: 5.0,
      distanceUnit: 'miles',
      duration: '35:00',
      user: mockUsers[0],
    },
    {
      id: 'run2',
      userId: 'user2',
      date: new Date('2024-01-02'),
      distance: 6.0,
      distanceUnit: 'miles',
      duration: '42:00',
      user: mockUsers[1],
    },
  ];

  const mockLeaderboardEntries = [
    {
      userId: 'user2',
      user: { id: 'user2', name: 'Jane Smith', avatarUrl: 'https://example.com/avatar2.jpg' },
      value: 6.0,
      formattedValue: '6.0 miles',
      rank: 1,
    },
    {
      userId: 'user1',
      user: { id: 'user1', name: 'John Doe', avatarUrl: 'https://example.com/avatar1.jpg' },
      value: 5.0,
      formattedValue: '5.0 miles',
      rank: 2,
    },
  ];

  describe('Group Leaderboards', () => {
    it('should return group leaderboard with valid groupId', async () => {
      // Mock group members
      (prisma.runGroupMember.findMany as jest.Mock).mockResolvedValue([
        { socialProfile: { userId: 'user1' } },
        { socialProfile: { userId: 'user2' } }
      ]);
      
      (getLeaderboardPeriodRange as jest.Mock).mockReturnValue({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      });
      (prisma.run.findMany as jest.Mock).mockResolvedValue(mockRuns);
      (filterRunsByPeriod as jest.Mock).mockReturnValue(mockRuns);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (calculateLeaderboardRankings as jest.Mock).mockReturnValue(mockLeaderboardEntries);

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=group&groupId=group1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('group');
      expect(data.data.groupId).toBe('group1');
      expect(data.data.entries).toHaveLength(2);
    });

    it('should require groupId for group leaderboard', async () => {
      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=group');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Group ID required for group leaderboard');
    });

    it('should handle period parameter', async () => {
      (prisma.runGroupMember.findMany as jest.Mock).mockResolvedValue([
        { socialProfile: { userId: 'user1' } }
      ]);
      (getLeaderboardPeriodRange as jest.Mock).mockReturnValue({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
      (prisma.run.findMany as jest.Mock).mockResolvedValue(mockRuns);
      (filterRunsByPeriod as jest.Mock).mockReturnValue(mockRuns);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (calculateLeaderboardRankings as jest.Mock).mockReturnValue(mockLeaderboardEntries);

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=group&groupId=group1&period=monthly');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.period).toBe('monthly');
      expect(getLeaderboardPeriodRange).toHaveBeenCalledWith('monthly', expect.any(Date));
    });

    it('should handle limit parameter', async () => {
      (prisma.runGroupMember.findMany as jest.Mock).mockResolvedValue([
        { socialProfile: { userId: 'user1' } }
      ]);
      (getLeaderboardPeriodRange as jest.Mock).mockReturnValue({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      });
      (prisma.run.findMany as jest.Mock).mockResolvedValue(mockRuns);
      (filterRunsByPeriod as jest.Mock).mockReturnValue(mockRuns);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (calculateLeaderboardRankings as jest.Mock).mockReturnValue(mockLeaderboardEntries.slice(0, 1));

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=group&groupId=group1&limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.entries).toHaveLength(1);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle invalid period parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=group&groupId=group1&period=daily');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid period. Must be weekly or monthly');
    });

    it('should handle invalid type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=friends&groupId=group1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid type. Must be group');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.runGroupMember.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=group&groupId=group1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch leaderboard data');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      (prisma.runGroupMember.findMany as jest.Mock).mockResolvedValue([]);
      (getLeaderboardPeriodRange as jest.Mock).mockReturnValue({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      });
      (prisma.run.findMany as jest.Mock).mockResolvedValue([]);
      (filterRunsByPeriod as jest.Mock).mockReturnValue([]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (calculateLeaderboardRankings as jest.Mock).mockReturnValue([]);
    });

    it('should return properly formatted response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=group&groupId=group1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('period');
      expect(data.data).toHaveProperty('metric');
      expect(data.data).toHaveProperty('type');
      expect(data.data).toHaveProperty('entries');
      expect(data.data).toHaveProperty('totalParticipants');
      expect(data.data).toHaveProperty('lastUpdated');
      expect(data.data.metric).toBe('totalDistance');
      expect(data.data.type).toBe('group');
    });
  });
});