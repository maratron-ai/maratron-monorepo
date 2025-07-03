/* eslint-disable @typescript-eslint/no-unused-vars */
import { 
  generateEnhancedChat, 
  authenticateUser, 
  ChatResponse 
} from '../chat-handler';

// Mock dependencies
jest.mock('@ai-sdk/anthropic');
jest.mock('@lib/mcp/client');
jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock the prompt builder
jest.mock('@lib/coaches/prompt-builder', () => ({
  buildChatSystemPrompt: jest.fn(),
  hasSelectedCoach: jest.fn(),
  getCoachDisplayName: jest.fn(),
}));

// Mock imports
const mockGenerateText = jest.fn();

jest.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  tool: jest.fn((config) => config),
}));

import { buildChatSystemPrompt, hasSelectedCoach, getCoachDisplayName } from '@lib/coaches/prompt-builder';
import { prisma } from '@lib/prisma';

const mockBuildChatSystemPromptTyped = buildChatSystemPrompt as jest.MockedFunction<typeof buildChatSystemPrompt>;
const mockHasSelectedCoachTyped = hasSelectedCoach as jest.MockedFunction<typeof hasSelectedCoach>;
const mockGetCoachDisplayNameTyped = getCoachDisplayName as jest.MockedFunction<typeof getCoachDisplayName>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Chat Handler Coach Integration (TDD - Failing Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockBuildChatSystemPromptTyped.mockReturnValue('Enhanced system prompt with coach');
    mockHasSelectedCoachTyped.mockReturnValue(true);
    mockGetCoachDisplayNameTyped.mockReturnValue('Thunder McGrath');
  });

  describe('generateEnhancedChat with Coach Personas', () => {
    it('should fetch user with selected coach and enhance system prompt', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
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

      const mockUserContext = 'User has run 5 miles today at 7:30 pace.';

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBuildChatSystemPromptTyped.mockReturnValue('You are Thunder McGrath, a high-energy coach! PUSH HARDER!');
      
      mockGenerateText.mockResolvedValue({
        text: 'GREAT JOB! That 5-mile run shows real dedication! Let\'s push for even faster times!'
      });

      const messages = [
        { role: 'user' as const, content: 'How was my run today?' }
      ];

      const result = await generateEnhancedChat(
        messages,
        'user-1',
        null // no MCP client for this test
      );

      // Should fetch user with coach relationship
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { selectedCoach: true }
      });

      // Should build personalized prompt with coach
      expect(mockBuildChatSystemPromptTyped).toHaveBeenCalledWith(
        mockUser,
        expect.any(String) // user context
      );

      // Should use enhanced prompt in generation
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are Thunder McGrath, a high-energy coach! PUSH HARDER!'
            })
          ])
        })
      );

      expect(result.content).toContain('GREAT JOB');
      expect(result.systemPrompt).toBe('You are Thunder McGrath, a high-energy coach! PUSH HARDER!');
    });

    it('should handle user without selected coach gracefully', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoachId: null,
        selectedCoach: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHasSelectedCoachTyped.mockReturnValue(false);
      mockGetCoachDisplayNameTyped.mockReturnValue(null);
      mockBuildChatSystemPromptTyped.mockReturnValue('You are a helpful running assistant.');
      
      mockGenerateText.mockResolvedValue({
        text: 'I can help you with your running questions!'
      });

      const messages = [
        { role: 'user' as const, content: 'How was my run today?' }
      ];

      const result = await generateEnhancedChat(messages, 'user-1', null);

      expect(mockBuildChatSystemPromptTyped).toHaveBeenCalledWith(
        mockUser,
        expect.any(String)
      );

      expect(result.content).toContain('help you with your running');
      expect(result.systemPrompt).toBe('You are a helpful running assistant.');
    });

    it('should include coach name in response metadata', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: 'coach-1',
          name: 'Thunder McGrath',
          icon: '🏃‍♂️',
          personality: 'motivational',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHasSelectedCoachTyped.mockReturnValue(true);
      mockGetCoachDisplayNameTyped.mockReturnValue('Thunder McGrath');
      
      mockGenerateText.mockResolvedValue({
        text: 'LET\'S GO! Time to CRUSH those goals!'
      });

      const result = await generateEnhancedChat(
        [{ role: 'user', content: 'Motivate me!' }],
        'user-1',
        null
      );

      // Result should include coach information
      expect(result).toHaveProperty('coachName', 'Thunder McGrath');
      expect(result).toHaveProperty('coachIcon', expect.any(String));
    });

    it('should handle different coach personalities correctly', async () => {
      const coaches = [
        {
          name: 'Thunder McGrath',
          personality: 'motivational',
          expectedTone: 'high-energy and motivational'
        },
        {
          name: 'Zen Rodriguez', 
          personality: 'zen',
          expectedTone: 'calm and mindful'
        },
        {
          name: 'Tech Thompson',
          personality: 'analytical',
          expectedTone: 'data-driven and analytical'
        }
      ];

      for (const coach of coaches) {
        const mockUser = {
          id: 'user-1',
          name: 'Test User',
          selectedCoach: {
            ...coach,
            id: 'coach-1',
            icon: coach.name === 'Thunder McGrath' ? '🏃‍♂️' : '🧘‍♀️',
          },
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockGetCoachDisplayNameTyped.mockReturnValue(coach.name);
        mockBuildChatSystemPromptTyped.mockReturnValue(`You are ${coach.name}, a ${coach.expectedTone} coach.`);
        
        mockGenerateText.mockResolvedValue({
          text: `Response from ${coach.name}`
        });

        const result = await generateEnhancedChat(
          [{ role: 'user', content: 'Help me with training' }],
          'user-1',
          null
        );

        expect(mockBuildChatSystemPromptTyped).toHaveBeenCalledWith(
          mockUser,
          expect.any(String)
        );

        expect(result.systemPrompt).toContain(coach.name);
        expect(result.systemPrompt).toContain(coach.expectedTone);
      }
    });

    it('should include coach context in user data gathering', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: 'coach-1',
          name: 'Thunder McGrath',
          icon: '🏃‍♂️',
          personality: 'motivational',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Should gather user context and pass to prompt builder
      const result = await generateEnhancedChat(
        [{ role: 'user', content: 'What should I do today?' }],
        'user-1',
        null
      );

      expect(mockBuildChatSystemPromptTyped).toHaveBeenCalledWith(
        mockUser,
        expect.stringContaining('John Runner') // Should include user context
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));
      
      mockGenerateText.mockResolvedValue({
        text: 'I can help with general running advice.'
      });

      const result = await generateEnhancedChat(
        [{ role: 'user', content: 'Help me run better' }],
        'user-1',
        null
      );

      // Should fall back to default behavior
      expect(result.content).toContain('help with general running');
      expect(result.coachName).toBeUndefined();
    });

    it('should maintain backwards compatibility when coach integration fails', async () => {
      // Simulate coach integration failure
      mockBuildChatSystemPromptTyped.mockImplementation(() => {
        throw new Error('Coach integration failed');
      });

      mockGenerateText.mockResolvedValue({
        text: 'Running advice without coach context'
      });

      const result = await generateEnhancedChat(
        [{ role: 'user', content: 'Give me advice' }],
        'user-1',
        null
      );

      // Should still work without coach integration
      expect(result.content).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('Coach Response Format', () => {
    it('should format response as if coming from the selected coach', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: 'coach-1',
          name: 'Thunder McGrath',
          icon: '🏃‍♂️',
          personality: 'motivational',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockGetCoachDisplayNameTyped.mockReturnValue('Thunder McGrath');
      
      mockGenerateText.mockResolvedValue({
        text: 'Time to PUSH HARDER and break through those barriers!'
      });

      const result = await generateEnhancedChat(
        [{ role: 'user', content: 'I need motivation' }],
        'user-1',
        null
      );

      // Response should include coach metadata for UI display
      expect(result.coachName).toBe('Thunder McGrath');
      expect(result.coachIcon).toBe('🏃‍♂️');
      expect(result.content).toContain('PUSH HARDER');
    });

    it('should not include coach metadata when no coach is selected', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHasSelectedCoachTyped.mockReturnValue(false);
      mockGetCoachDisplayNameTyped.mockReturnValue(null);
      
      mockGenerateText.mockResolvedValue({
        text: 'I can help with your running questions.'
      });

      const result = await generateEnhancedChat(
        [{ role: 'user', content: 'Help me' }],
        'user-1',
        null
      );

      expect(result.coachName).toBeUndefined();
      expect(result.coachIcon).toBeUndefined();
    });
  });
});