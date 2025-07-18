/**
 * Tests for Chat API Consistent MCP Integration
 * 
 * Tests verify that MCP integration provides consistent AI intelligence across
 * all environments (local, Docker, production). No environment-specific bypasses.
 * 
 * Key test coverage:
 * - MCP client connection and tool execution
 * - Query analysis and smart data fetching  
 * - Graceful fallback when MCP unavailable
 * - Consistent behavior regardless of deployment environment
 */

import { 
  handleMCPEnhancedChat,
  authenticateUser,
  validateChatRequest 
} from '../chat-handler';
import { generateText } from 'ai';
import { cache } from '@lib/cache/cache-manager';
import { prisma } from '@lib/prisma';
import type { User } from '@maratypes/user';

// Mock dependencies
jest.mock('@lib/mcp/client');
jest.mock('@ai-sdk/anthropic');
jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    run: {
      count: jest.fn()
    }
  }
}));
jest.mock('@lib/cache/cache-manager', () => ({
  cache: {
    user: {
      context: jest.fn()
    }
  }
}));
jest.mock('ai', () => ({
  generateText: jest.fn(),
  tool: jest.fn((config) => ({
    ...config,
    execute: config.execute
  }))
}));

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockCache = cache as jest.Mocked<typeof cache>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Chat API MCP Integration', () => {
  const mockMCPClient = {
    connect: jest.fn(),
    setUserContext: jest.fn(),
    isUserContextSet: jest.fn().mockReturnValue(false), // Default: context not set
    clearUserContext: jest.fn(),
    callTool: jest.fn(),
    getUserContext: jest.fn(),
    getUserRuns: jest.fn(),
    getDatabaseSummary: jest.fn(),
    listTools: jest.fn(),
    disconnect: jest.fn(),
  } as jest.Mocked<typeof mockMCPClient>; // Type assertion for test mock

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default Prisma mocks for all tests
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      defaultDistanceUnit: 'miles',
      defaultElevationUnit: 'feet',
      trainingLevel: 'beginner',
      goals: [],
      createdAt: new Date()
    } as Partial<User>);
    
    mockPrisma.run.count.mockResolvedValue(5);
    
    // Set up default cache mock - always call fallback for tests
    mockCache.user.context.mockImplementation(async (userId, fallback) => {
      if (fallback) {
        return await fallback();
      }
      return null;
    });
    
    // Default mock for generateText
    mockGenerateText.mockResolvedValue({
      text: 'Mock AI response',
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
    });
  });

  describe('authenticateUser', () => {
    it('should return user info for valid session', async () => {
      const mockSession = {
        user: { id: 'test-user-123', name: 'Test User' }
      };

      const result = await authenticateUser(mockSession);

      expect(result.isAuthenticated).toBe(true);
      expect(result.userId).toBe('test-user-123');
    });

    it('should reject null or undefined session', async () => {
      const result1 = await authenticateUser(null);
      const result2 = await authenticateUser(undefined);

      expect(result1.isAuthenticated).toBe(false);
      expect(result2.isAuthenticated).toBe(false);
    });

    it('should reject session without user ID', async () => {
      const mockSession = {
        user: { name: 'Test User' } // Missing ID
      };

      const result = await authenticateUser(mockSession);

      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('validateChatRequest', () => {
    it('should validate correct message format', () => {
      const validRequest = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      };

      const result = validateChatRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.messages).toEqual(validRequest.messages);
    });

    it('should reject invalid message format', () => {
      const invalidRequests = [
        { messages: 'not an array' },
        { messages: [] },
        { messages: null },
        { messages: undefined },
        { notMessages: [] },
        {}
      ];

      invalidRequests.forEach(request => {
        const result = validateChatRequest(request);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject messages with invalid structure', () => {
      const invalidMessage = {
        messages: [
          { role: 'user' }, // Missing content
          { content: 'Hello' }, // Missing role
          { role: 'invalid', content: 'Hello' } // Invalid role
        ]
      };

      const result = validateChatRequest(invalidMessage);

      expect(result.isValid).toBe(false);
    });
  });

  describe('handleMCPEnhancedChat', () => {
    const validMessages = [
      { role: 'user', content: 'How did my last run go?' }
    ];
    const userId = 'test-user-123';

    it('should initialize MCP user context', async () => {
      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '{}' }],
        isError: false
      });

      // Mocks are set up globally in beforeEach

      await handleMCPEnhancedChat(validMessages, userId, mockMCPClient);

      expect(mockMCPClient.setUserContext).toHaveBeenCalledWith(userId, undefined);
    });

    it('should detect data queries and call MCP tools', async () => {
      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ recent_runs: [] }) }],
        isError: false
      });

      // Mock planning phase (Claude decides to use getUserRuns tool)
      const planningResponse = {
        text: 'I will get your recent runs.',
        toolCalls: [{
          toolName: 'getUserRuns',
          args: { limit: 5 }
        }]
      };
      
      // Mock synthesis phase
      const finalResponse = {
        text: 'Here are your recent runs',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      const dataQuery = [
        { role: 'user', content: 'Show me my recent runs' }
      ];

      const result = await handleMCPEnhancedChat(dataQuery, userId, mockMCPClient);

      // With three-phase execution, tool calls should be tracked
      expect(result.toolCalls).toBeDefined();
      expect(result.toolCalls.length).toBeGreaterThan(0);
      expect(result.toolCalls[0].name).toBe('getUserRuns');
    });

    it('should handle general queries without MCP data calls', async () => {
      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);

      // Mock that Claude doesn't decide to use any tools for general queries
      const mockResponse = {
        text: 'Running has many benefits for cardiovascular health...',
        toolCalls: [] // No tool calls for general queries
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const generalQuery = [
        { role: 'user', content: 'What are the benefits of running?' }
      ];

      const result = await handleMCPEnhancedChat(generalQuery, userId, mockMCPClient);

      // For general queries, Claude decides not to use tools
      expect(result.toolCalls).toEqual([]);
      expect(result.mcpStatus).toBe('enhanced'); // Still enhanced mode, just no tools used
    });

    it('should fallback gracefully when MCP fails', async () => {
      // Silence expected console.warn for this test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock that initial setUserContext fails, but handler continues
      mockMCPClient.setUserContext.mockRejectedValue(new Error('MCP failed'));
      
      // Mock successful fallback response
      const mockResponse = {
        text: 'I can provide general running advice.',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await handleMCPEnhancedChat(validMessages, userId, mockMCPClient);

      expect(result.mcpStatus).toBe('enhanced'); // Still enhanced, just warning logged
      expect(result.content).toBeDefined();
      
      // Verify the warning was called (but silenced) - updated for new implementation
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to set user context for ${userId}:`,
        expect.any(Error)
      );
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should include personalized system prompt when user data available', async () => {
      const userData = {
        recent_runs: [{ distance: 5, pace: '8:00' }],
        preferences: { distance_unit: 'miles' }
      };

      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(userData) }],
        isError: false
      });

      // Mock planning and synthesis phases
      const planningResponse = {
        text: 'I will analyze your last run.',
        toolCalls: [{
          toolName: 'getUserRuns',
          args: { limit: 1 }
        }]
      };
      
      const finalResponse = {
        text: 'Your last run was great!',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      // Use a data-requiring query
      const dataQuery = [
        { role: 'user', content: 'How did my last run go?' }
      ];

      const result = await handleMCPEnhancedChat(dataQuery, userId, mockMCPClient);

      // With three-phase execution, system prompt is consistent across all requests
      expect(result.systemPrompt).toContain('running coach');
      expect(result.systemPrompt).toContain('User Information');
      expect(result.mcpStatus).toBe('enhanced');
    });

    it('should handle MCP timeout gracefully', async () => {
      // Silence expected console.warn for this test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockMCPClient.setUserContext.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      // Mock successful response despite timeout
      const mockResponse = {
        text: 'I can provide general running advice.',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await handleMCPEnhancedChat(validMessages, userId, mockMCPClient);

      expect(result.mcpStatus).toBe('enhanced'); // Still enhanced, just context warning
      expect(result.content).toBeDefined();
      
      // Verify the warning was called (but silenced) - updated for new three-phase implementation
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to set user context for ${userId}:`,
        expect.any(Error)
      );
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should always use MCP for consistent AI intelligence', async () => {
      const dataQuery = [
        { role: 'user', content: 'Show me my shoes' }
      ];

      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'Mock shoe data' }],
        isError: false
      });

      // Mocks are set up globally in beforeEach

      // Mock planning and synthesis phases
      const planningResponse = {
        text: 'I will get your shoes.',
        toolCalls: [{
          toolName: 'listUserShoes',
          args: { limit: 10 }
        }]
      };
      
      const finalResponse = {
        text: 'Here are your shoes',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      const result = await handleMCPEnhancedChat(dataQuery, userId, mockMCPClient);

      // With three-phase execution, user context is set multiple times
      expect(mockMCPClient.setUserContext).toHaveBeenCalledWith(userId, undefined);
      // In three-phase execution, tools are called according to Claude's planning
      expect(result.mcpStatus).toBe('enhanced');
      expect(result.toolCalls.length).toBeGreaterThan(0);
    });

    it('should fallback when MCP client is not available', async () => {
      // Silence expected console.warn for this test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const dataQuery = [
        { role: 'user', content: 'Show me my recent runs' }
      ];

      // Pass null as MCP client to simulate unavailable MCP
      const result = await handleMCPEnhancedChat(dataQuery, userId, null);

      expect(result.mcpStatus).toBe('fallback');
      expect(result.content).toBeDefined();
      
      // Verify the warning was called with updated message
      expect(consoleWarnSpy).toHaveBeenCalledWith('No MCP client available, using basic response mode');
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should return appropriate response structure', async () => {
      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '{}' }],
        isError: false
      });

      const result = await handleMCPEnhancedChat(validMessages, userId, mockMCPClient);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('mcpStatus');
      expect(result).toHaveProperty('systemPrompt');
      expect(result).toHaveProperty('toolCalls');
      expect(typeof result.content).toBe('string');
      expect(Array.isArray(result.toolCalls)).toBe(true);
    });
  });
});