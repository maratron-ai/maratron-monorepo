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

// Mock dependencies
jest.mock('@lib/mcp/client');
jest.mock('@ai-sdk/anthropic');
jest.mock('ai', () => ({
  generateText: jest.fn()
}));

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('Chat API MCP Integration', () => {
  const mockMCPClient = {
    connect: jest.fn(),
    setUserContext: jest.fn(),
    callTool: jest.fn(),
    getUserContext: jest.fn(),
    disconnect: jest.fn(),
  } as any; // Type assertion for test mock

  beforeEach(() => {
    jest.clearAllMocks();
    
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

      await handleMCPEnhancedChat(validMessages, userId, mockMCPClient);

      expect(mockMCPClient.setUserContext).toHaveBeenCalledWith(userId);
    });

    it('should detect data queries and call MCP tools', async () => {
      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ recent_runs: [] }) }],
        isError: false
      });

      const dataQuery = [
        { role: 'user', content: 'Show me my recent runs' }
      ];

      const result = await handleMCPEnhancedChat(dataQuery, userId, mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_smart_user_context',
        arguments: {}
      });
      expect(result.toolCalls).toBeDefined();
      expect(result.toolCalls.length).toBeGreaterThan(0);
    });

    it('should handle general queries without MCP data calls', async () => {
      mockMCPClient.setUserContext.mockResolvedValue(undefined);
      mockMCPClient.getUserContext.mockResolvedValue(null);

      const generalQuery = [
        { role: 'user', content: 'What are the benefits of running?' }
      ];

      const result = await handleMCPEnhancedChat(generalQuery, userId, mockMCPClient);

      // For general queries, we don't need to set user context or call tools
      expect(mockMCPClient.callTool).not.toHaveBeenCalled();
      expect(result.mcpStatus).toBe('no-data-needed');
    });

    it('should fallback gracefully when MCP fails', async () => {
      // Silence expected console.warn for this test
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockMCPClient.setUserContext.mockRejectedValue(new Error('MCP failed'));

      const result = await handleMCPEnhancedChat(validMessages, userId, mockMCPClient);

      expect(result.mcpStatus).toBe('fallback');
      expect(result.content).toBeDefined();
      
      // Verify the warning was called (but silenced)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Data gathering failed, falling back to standard response:',
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

      // Use a data-requiring query
      const dataQuery = [
        { role: 'user', content: 'How did my last run go?' }
      ];

      const result = await handleMCPEnhancedChat(dataQuery, userId, mockMCPClient);

      expect(result.systemPrompt).toContain('Recent runs');
      expect(result.systemPrompt).toContain('miles');
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

      const result = await handleMCPEnhancedChat(validMessages, userId, mockMCPClient);

      expect(result.mcpStatus).toBe('fallback');
      expect(result.content).toBeDefined();
      
      // Verify the warning was called (but silenced)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Data gathering failed, falling back to standard response:',
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
        content: [{ type: 'text', text: JSON.stringify({ shoes: [] }) }],
        isError: false
      });

      const result = await handleMCPEnhancedChat(dataQuery, userId, mockMCPClient);

      // Always use MCP for consistent AI intelligence across all environments
      expect(mockMCPClient.setUserContext).toHaveBeenCalledWith(userId);
      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_smart_user_context',
        arguments: {}
      });
      expect(result.mcpStatus).toBe('enhanced');
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
      
      // Verify the warning was called
      expect(consoleWarnSpy).toHaveBeenCalledWith('No MCP client available, using fallback');
      
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