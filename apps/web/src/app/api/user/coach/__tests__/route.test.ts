/**
 * @jest-environment node
 */

// Mock PrismaClient
jest.mock('@prisma/client');

// Mock prisma import
jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    coachPersona: {
      findUnique: jest.fn(),
    },
  },
}));

import { GET, PUT } from '../route';
import { prisma } from '@lib/prisma';
import { NextRequest } from 'next/server';

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth/next';
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('User Coach Selection API (TDD - Failing Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/coach', () => {
    it('should return user with selected coach', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      };

      const mockUserWithCoach = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        selectedCoachId: 'coach-1',
        selectedCoach: {
          id: 'coach-1',
          name: 'Thunder McGrath',
          description: 'High-energy motivational coach',
          icon: '🏃‍♂️',
          systemPrompt: 'You are Thunder McGrath...',
          personality: 'motivational',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.user as jest.Mock).findUnique.mockResolvedValue(mockUserWithCoach);

      const request = new NextRequest('http://localhost:3000/api/user/coach');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.selectedCoach).toBeDefined();
      expect(data.user.selectedCoach.name).toBe('Thunder McGrath');
      expect((prisma.user as jest.Mock).findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { selectedCoach: true },
      });
    });

    it('should return user with no selected coach', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      };

      const mockUserWithoutCoach = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        selectedCoachId: null,
        selectedCoach: null,
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.user as jest.Mock).findUnique.mockResolvedValue(mockUserWithoutCoach);

      const request = new NextRequest('http://localhost:3000/api/user/coach');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.selectedCoach).toBeNull();
      expect(data.user.selectedCoachId).toBeNull();
    });

    it('should return 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/coach');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      const mockSession = {
        user: { id: 'non-existent-user', email: 'test@example.com' },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.user as jest.Mock).findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/coach');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('PUT /api/user/coach', () => {
    it('should update user selected coach', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      };

      const mockCoach = {
        id: 'coach-1',
        name: 'Thunder McGrath',
        description: 'High-energy motivational coach',
        icon: '🏃‍♂️',
        systemPrompt: 'You are Thunder McGrath...',
        personality: 'motivational',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        selectedCoachId: 'coach-1',
        selectedCoach: mockCoach,
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.coachPersona as jest.Mock).findUnique.mockResolvedValue(mockCoach);
      (prisma.user as jest.Mock).update.mockResolvedValue(mockUpdatedUser);

      const request = new NextRequest('http://localhost:3000/api/user/coach', {
        method: 'PUT',
        body: JSON.stringify({ coachId: 'coach-1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.selectedCoachId).toBe('coach-1');
      expect(data.user.selectedCoach.name).toBe('Thunder McGrath');
      expect((prisma.user as jest.Mock).update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { selectedCoachId: 'coach-1' },
        include: { selectedCoach: true },
      });
    });

    it('should allow removing coach selection (set to null)', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      };

      const mockUpdatedUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        selectedCoachId: null,
        selectedCoach: null,
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.user as jest.Mock).update.mockResolvedValue(mockUpdatedUser);

      const request = new NextRequest('http://localhost:3000/api/user/coach', {
        method: 'PUT',
        body: JSON.stringify({ coachId: null }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.selectedCoachId).toBeNull();
      expect(data.user.selectedCoach).toBeNull();
      expect((prisma.user as jest.Mock).update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { selectedCoachId: null },
        include: { selectedCoach: true },
      });
    });

    it('should return 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/coach', {
        method: 'PUT',
        body: JSON.stringify({ coachId: 'coach-1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid coach ID', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.coachPersona as jest.Mock).findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/coach', {
        method: 'PUT',
        body: JSON.stringify({ coachId: 'invalid-coach-id' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid coach ID');
    });

    it('should return 400 for missing request body', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/user/coach', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing coachId in request body');
    });

    it('should handle database errors during update', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      };

      const mockCoach = {
        id: 'coach-1',
        name: 'Thunder McGrath',
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.coachPersona as jest.Mock).findUnique.mockResolvedValue(mockCoach);
      (prisma.user as jest.Mock).update.mockRejectedValue(new Error('Database update failed'));

      const request = new NextRequest('http://localhost:3000/api/user/coach', {
        method: 'PUT',
        body: JSON.stringify({ coachId: 'coach-1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update user coach selection');
    });
  });
});