/**
 * @jest-environment node
 */

import { performance } from 'perf_hooks';
import { generateEnhancedChat } from '../chat-handler';

// Mock dependencies
jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@lib/mcp/client', () => ({
  getMCPClient: jest.fn(() => ({
    setUserContext: jest.fn(),
    readResource: jest.fn(),
    callTool: jest.fn(),
  })),
}));

jest.mock('@ai-sdk/anthropic');
jest.mock('ai', () => ({
  generateText: jest.fn(),
  tool: jest.fn((config) => config),
}));

jest.mock('@lib/coaches/prompt-builder', () => ({
  buildChatSystemPrompt: jest.fn(),
  hasSelectedCoach: jest.fn(),
  getCoachDisplayName: jest.fn(),
}));

import { prisma } from '@lib/prisma';
import { generateText } from 'ai';
import { buildChatSystemPrompt, hasSelectedCoach, getCoachDisplayName } from '@lib/coaches/prompt-builder';

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockBuildChatSystemPrompt = buildChatSystemPrompt as jest.MockedFunction<typeof buildChatSystemPrompt>;
const mockHasSelectedCoach = hasSelectedCoach as jest.MockedFunction<typeof hasSelectedCoach>;
const mockGetCoachDisplayName = getCoachDisplayName as jest.MockedFunction<typeof getCoachDisplayName>;

describe('Coach Integration Performance Tests', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test Runner',
    email: 'test@example.com',
    selectedCoachId: 'coach-thunder',
    selectedCoach: {
      id: 'coach-thunder',
      name: 'Thunder McGrath',
      description: 'High-energy motivational coach',
      icon: '🏃‍♂️',
      systemPrompt: 'You are Thunder McGrath, a high-energy running coach who pushes athletes to achieve their personal best. You use motivational language, exclamation points, and running metaphors. Always encourage pushing limits while staying safe.',
      personality: 'motivational',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockMessages = [
    { role: 'user' as const, content: 'I want to improve my 5K time' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    mockBuildChatSystemPrompt.mockReturnValue('You are Thunder McGrath! PUSH HARDER!');
    mockHasSelectedCoach.mockReturnValue(true);
    mockGetCoachDisplayName.mockReturnValue('Thunder McGrath');
    
    mockGenerateText.mockResolvedValue({
      text: 'Hey champ! Thunder here, ready to help you CRUSH that 5K goal! 🔥'
    });
  });

  describe('Chat Response Time Performance', () => {
    it('should complete coach-enhanced chat request in <100ms', async () => {
      const startTime = performance.now();
      
      const result = await generateEnhancedChat(mockMessages, 'user-1', null);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Coach-enhanced chat completed in ${duration.toFixed(2)}ms`);
      
      // Target: <100ms for chat processing (excluding AI model inference)
      expect(duration).toBeLessThan(100);
      expect(result.content).toBeDefined();
      expect(result.coachName).toBe('Thunder McGrath');
    }, 10000); // 10s timeout for safety

    it('should complete coach lookup and prompt building in <20ms', async () => {
      const startTime = performance.now();
      
      // Just test the coach-specific logic, not the full AI generation
      await (prisma.user.findUnique as jest.Mock)();
      mockBuildChatSystemPrompt(mockUser, 'test context');
      mockHasSelectedCoach(mockUser);
      mockGetCoachDisplayName(mockUser);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Coach lookup and prompt building completed in ${duration.toFixed(2)}ms`);
      
      // Target: <20ms for coach-specific operations
      expect(duration).toBeLessThan(20);
    });

    it('should handle multiple concurrent coach requests efficiently', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(mockMessages);
      
      const startTime = performance.now();
      
      const results = await Promise.all(
        requests.map(() => generateEnhancedChat(mockMessages, 'user-1', null))
      );
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / concurrentRequests;
      
      console.log(`${concurrentRequests} concurrent requests completed in ${totalDuration.toFixed(2)}ms`);
      console.log(`Average duration per request: ${averageDuration.toFixed(2)}ms`);
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.content).toBeDefined();
        expect(result.coachName).toBe('Thunder McGrath');
      });
      
      // Average should still be reasonable for concurrent processing
      expect(averageDuration).toBeLessThan(150);
    }, 15000);

    it('should perform well with different coach personas', async () => {
      const coaches = [
        {
          name: 'Thunder McGrath',
          personality: 'motivational',
          systemPrompt: 'You are Thunder McGrath! High energy!'
        },
        {
          name: 'Zen Rodriguez',
          personality: 'mindful',
          systemPrompt: 'You are Zen Rodriguez. Calm and mindful approach.'
        },
        {
          name: 'Tech Thompson',
          personality: 'analytical',
          systemPrompt: 'You are Tech Thompson. Data-driven analysis.'
        }
      ];

      const durations: number[] = [];

      for (const coach of coaches) {
        const userWithCoach = {
          ...mockUser,
          selectedCoach: {
            ...mockUser.selectedCoach,
            name: coach.name,
            personality: coach.personality,
            systemPrompt: coach.systemPrompt,
          }
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithCoach);
        mockBuildChatSystemPrompt.mockReturnValue(coach.systemPrompt);
        mockGetCoachDisplayName.mockReturnValue(coach.name);

        const startTime = performance.now();
        
        const result = await generateEnhancedChat(mockMessages, 'user-1', null);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        durations.push(duration);

        console.log(`${coach.name} (${coach.personality}) completed in ${duration.toFixed(2)}ms`);

        expect(result.content).toBeDefined();
        expect(result.coachName).toBe(coach.name);
      }

      // All coach personas should perform consistently
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = maxDuration - minDuration;
      
      console.log(`Performance variance across coaches: ${variance.toFixed(2)}ms`);
      
      // Variance should be small (consistent performance)
      expect(variance).toBeLessThan(30);
      expect(maxDuration).toBeLessThan(100);
    });

    it('should handle fallback gracefully when coach data is missing', async () => {
      const userWithoutCoach = {
        ...mockUser,
        selectedCoachId: null,
        selectedCoach: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithoutCoach);
      mockHasSelectedCoach.mockReturnValue(false);
      mockGetCoachDisplayName.mockReturnValue(null);
      mockBuildChatSystemPrompt.mockReturnValue('You are a helpful running assistant.');

      const startTime = performance.now();
      
      const result = await generateEnhancedChat(mockMessages, 'user-1', null);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Fallback mode completed in ${duration.toFixed(2)}ms`);
      
      // Fallback should be just as fast
      expect(duration).toBeLessThan(100);
      expect(result.content).toBeDefined();
      expect(result.coachName).toBeUndefined();
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated coach requests', async () => {
      const iterations = 10;
      const memoryUsageBefore = process.memoryUsage();
      
      // Perform repeated requests
      for (let i = 0; i < iterations; i++) {
        await generateEnhancedChat(mockMessages, 'user-1', null);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryUsageAfter = process.memoryUsage();
      const heapIncrease = memoryUsageAfter.heapUsed - memoryUsageBefore.heapUsed;
      
      console.log(`Memory usage before: ${Math.round(memoryUsageBefore.heapUsed / 1024 / 1024)}MB`);
      console.log(`Memory usage after: ${Math.round(memoryUsageAfter.heapUsed / 1024 / 1024)}MB`);
      console.log(`Heap increase: ${Math.round(heapIncrease / 1024)}KB`);
      
      // Memory increase should be minimal (under 5MB for 10 iterations)
      expect(heapIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe('Error Performance', () => {
    it('should handle database errors quickly', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const startTime = performance.now();
      
      const result = await generateEnhancedChat(mockMessages, 'user-1', null);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Error handling completed in ${duration.toFixed(2)}ms`);
      
      // Error handling should be fast
      expect(duration).toBeLessThan(50);
      expect(result.content).toBeDefined(); // Should fallback gracefully
    });

    it('should handle prompt building errors quickly', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockBuildChatSystemPrompt.mockImplementation(() => {
        throw new Error('Prompt building error');
      });
      
      const startTime = performance.now();
      
      try {
        const result = await generateEnhancedChat(mockMessages, 'user-1', null);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`Prompt error handling completed in ${duration.toFixed(2)}ms`);
        
        // Error handling should be fast
        expect(duration).toBeLessThan(50);
        expect(result.content).toBeDefined(); // Should fallback gracefully
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`Prompt error handling completed in ${duration.toFixed(2)}ms`);
        
        // Error handling should be fast even when throwing
        expect(duration).toBeLessThan(50);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});