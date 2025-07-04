/**
 * @jest-environment node
 */

// Mock PrismaClient
jest.mock('@prisma/client');

// Mock prisma import
jest.mock('@lib/prisma', () => ({
  prisma: {
    coachPersona: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('@lib/middleware/auth', () => ({
  requireAuth: jest.fn(),
  unauthorizedResponse: jest.fn(),
}));

// Mock rate limiting
jest.mock('@lib/middleware/rateLimit', () => ({
  withRateLimit: jest.fn(() => (handler) => handler),
  RATE_LIMITS: { API: {} },
}));

import { GET } from '../route';
import { prisma } from '@lib/prisma';
import { NextRequest } from 'next/server';
import { requireAuth } from '@lib/middleware/auth';

describe('GET /api/coaches (TDD - Failing Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication by default
    (requireAuth as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId: 'test-user-id',
    });
  });

  it('should return all coach personas', async () => {
    const mockCoaches = [
      {
        id: '1',
        name: 'Thunder McGrath',
        description: 'High-energy motivational coach',
        icon: '🏃‍♂️',
        systemPrompt: 'You are Thunder McGrath...',
        personality: 'motivational',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Zen Rodriguez',
        description: 'Mindful, philosophical approach',
        icon: '🧘‍♀️',
        systemPrompt: 'You are Zen Rodriguez...',
        personality: 'zen',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.coachPersona.findMany as jest.Mock).mockResolvedValue(mockCoaches);

    const request = new NextRequest('http://localhost:3000/api/coaches');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Dates get serialized as strings in JSON response
    expect(data.coaches).toHaveLength(2);
    expect(data.coaches[0].name).toBe('Thunder McGrath');
    expect(data.coaches[1].name).toBe('Zen Rodriguez');
    expect(prisma.coachPersona.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('should handle database errors gracefully', async () => {
    (prisma.coachPersona.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/coaches');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch coaches');
  });

  it('should return empty array when no coaches exist', async () => {
    (prisma.coachPersona.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/coaches');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.coaches).toEqual([]);
    expect(data.coaches).toHaveLength(0);
  });

  it('should include correct coach properties in response', async () => {
    const mockCoach = {
      id: '1',
      name: 'Thunder McGrath',
      description: 'High-energy motivational coach',
      icon: '🏃‍♂️',
      systemPrompt: 'You are Thunder McGrath...',
      personality: 'motivational',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.coachPersona.findMany as jest.Mock).mockResolvedValue([mockCoach]);

    const request = new NextRequest('http://localhost:3000/api/coaches');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.coaches[0]).toHaveProperty('id');
    expect(data.coaches[0]).toHaveProperty('name');
    expect(data.coaches[0]).toHaveProperty('description');
    expect(data.coaches[0]).toHaveProperty('icon');
    expect(data.coaches[0]).toHaveProperty('systemPrompt');
    expect(data.coaches[0]).toHaveProperty('personality');
    expect(data.coaches[0]).toHaveProperty('createdAt');
    expect(data.coaches[0]).toHaveProperty('updatedAt');
  });
});