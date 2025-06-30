/**
 * Tests for Chat API MCP Integration Business Logic
 * Following TDD approach - these tests should fail initially
 */

import { 
  handleMCPEnhancedChat,
  authenticateUser,
  validateChatRequest 
} from '../chat-handler';
import { generateText } from 'ai';
import { getUserDataDirect, isDockerEnvironment } from '@lib/database/direct-access';

// Mock dependencies
jest.mock('@lib/mcp/client');
jest.mock('@ai-sdk/anthropic');
jest.mock('ai', () => ({
  generateText: jest.fn()
}));
jest.mock('@lib/database/direct-access', () => ({
  getUserDataDirect: jest.fn(),
  isDockerEnvironment: jest.fn()
}));

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockGetUserDataDirect = getUserDataDirect as jest.MockedFunction<typeof getUserDataDirect>;
const mockIsDockerEnvironment = isDockerEnvironment as jest.MockedFunction<typeof isDockerEnvironment>;

// This module doesn't exist yet - tests will fail initially
describe('Chat API MCP Integration', () => {
  const mockMCPClient = {
    connect: jest.fn(),
    setUserContext: jest.fn(),
    callTool: jest.fn(),
    getUserContext: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for generateText
    mockGenerateText.mockResolvedValue({
      text: 'Mock AI response',
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
    });
    
    // Default to local mode (not Docker) for most tests
    mockIsDockerEnvironment.mockReturnValue(false);
    
    // Default mock for direct database access
    mockGetUserDataDirect.mockResolvedValue({
      profile: { name: 'Test User', defaultDistanceUnit: 'miles' },
      preferences: { distance_unit: 'miles', response_detail: 'detailed', max_results: 10 }
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
      // Ensure we're not in Docker mode so MCP client is used
      mockIsDockerEnvironment.mockReturnValue(false);
      
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

    it('should use direct database access in Docker mode', async () => {
      // Enable Docker mode
      mockIsDockerEnvironment.mockReturnValue(true);
      
      const dataQuery = [
        { role: 'user', content: 'Show me my shoes' }
      ];

      const result = await handleMCPEnhancedChat(dataQuery, userId, mockMCPClient);

      // In Docker mode, should use direct database access instead of MCP
      expect(mockGetUserDataDirect).toHaveBeenCalledWith(userId, ['shoes']);
      expect(mockMCPClient.setUserContext).not.toHaveBeenCalled();
      expect(mockMCPClient.callTool).not.toHaveBeenCalled();
      expect(result.mcpStatus).toBe('enhanced');
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