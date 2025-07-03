/**
 * MCP Integration Tests for Enhanced Chat Handler
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the AI SDK modules before importing any modules that use them
jest.mock('ai', () => ({
  generateText: jest.fn(),
  tool: jest.fn((config) => {
    console.log('🔧 MOCK: tool() called with description:', config?.description);
    return {
      description: config.description,
      parameters: config.parameters,
      execute: config.execute
    };
  })
}));

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn(() => 'mock-model')
}));

jest.mock('@lib/mcp/client');

// Import after mocking
import { handleMCPEnhancedChat } from '../chat-handler';
import { MaratronMCPClient } from '@lib/mcp/client';

describe('MCP Enhanced Chat Handler', () => {
  let mockMCPClient: jest.Mocked<MaratronMCPClient>;
  let mockGenerateText: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup MCP client mock
    mockMCPClient = {
      setUserContext: jest.fn(),
      getUserContext: jest.fn(),
      callTool: jest.fn(),
      getUserRuns: jest.fn(),
      getDatabaseSummary: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      listTools: jest.fn()
    } as jest.Mocked<MaratronMCPClient>;

    // Setup AI SDK mock - always provide a default response
    mockGenerateText = jest.fn().mockResolvedValue({
      text: 'Default response',
      toolCalls: []
    });
    const ai = jest.requireMock('ai') as { generateText: jest.Mock, tool: jest.Mock };
    ai.generateText = mockGenerateText;
  });

  describe('Function Calling Integration', () => {
    it('should provide tools to Claude when MCP client is available', async () => {
      const mockResponse = {
        text: 'I can help you with running!',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            getSmartUserContext: expect.any(Object),
            getUserRuns: expect.any(Object),
            addRun: expect.any(Object),
            addShoe: expect.any(Object),
            analyzeUserPatterns: expect.any(Object),
            getMotivationalContext: expect.any(Object),
            updateConversationIntelligence: expect.any(Object),
            getDatabaseSummary: expect.any(Object),
            listUserShoes: expect.any(Object)
          })
        })
      );

      expect(result.mcpStatus).toBe('enhanced');
    });

    it('should use fallback mode when MCP client is null', async () => {
      const mockResponse = {
        text: 'I can provide general running advice.',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', null);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Maratron AI')
            })
          ])
        })
      );

      // When MCP client is null, tools property should not be passed
      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('tools');

      expect(result.mcpStatus).toBe('fallback');
    });

    it('should track tool calls made by Claude', async () => {
      // Mock planning phase
      const planningResponse = {
        text: 'I will get your user context.',
        toolCalls: [
          {
            toolName: 'getSmartUserContext',
            args: {}
          }
        ]
      };
      
      // Mock synthesis phase
      const finalResponse = {
        text: 'Based on your context, here is my response.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse) // Phase 1: Planning
        .mockResolvedValueOnce(finalResponse);   // Phase 3: Synthesis

      const messages = [{ role: 'user' as const, content: 'Get my data' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(result.toolCalls).toEqual([
        { name: 'getSmartUserContext', arguments: {} }
      ]);
    });
  });

  describe('System Prompt Generation', () => {
    it('should include proper instructions for tool usage', async () => {
      const mockResponse = { text: 'Hello!', toolCalls: [] };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      const systemMessage = mockGenerateText.mock.calls[0][0].messages[0];
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('Maratron AI');
      expect(systemMessage.content).toContain('Available Tools');
      expect(systemMessage.content).toContain('natural, conversational language');
      expect(systemMessage.content).toContain('User context is automatically managed');
    });

    it('should include all available tools in system prompt', async () => {
      const mockResponse = { text: 'Hello!', toolCalls: [] };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      const systemMessage = mockGenerateText.mock.calls[0][0].messages[0];
      const tools = [
        'getSmartUserContext', 
        'getUserRuns',
        'addRun',
        'addShoe',
        'listUserShoes',
        'analyzeUserPatterns',
        'getMotivationalContext',
        'updateConversationIntelligence',
        'getDatabaseSummary'
      ];

      tools.forEach(tool => {
        expect(systemMessage.content).toContain(tool);
      });
    });
  });

  describe('Tool Function Implementations', () => {
    beforeEach(() => {
      // Mock a successful tool response
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'Tool executed successfully' }],
        isError: false
      });
    });

    it('should automatically set user context', async () => {
      const mockResponse = {
        text: 'Hello there!',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      // User context should be set automatically during initialization
      expect(mockMCPClient.setUserContext).toHaveBeenCalledWith('test-user', undefined);
    });

    it('should handle getSmartUserContext tool execution in three phases', async () => {
      // Mock planning phase response
      const planningResponse = {
        text: 'I will get your context.',
        toolCalls: [{
          toolName: 'getSmartUserContext',
          args: {}
        }]
      };
      
      // Mock final synthesis response
      const finalResponse = {
        text: 'Here is your context analysis.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse) // Phase 1: Planning
        .mockResolvedValueOnce(finalResponse);   // Phase 3: Synthesis

      const messages = [{ role: 'user' as const, content: 'Get my context' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      // Verify Phase 2: Tool execution
      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'set_current_user_tool',
        arguments: { user_id: 'test-user' }
      });
      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_smart_user_context',
        arguments: {}
      });
    });

    it('should handle addRun tool execution in three phases', async () => {
      // Mock planning phase response
      const planningResponse = {
        text: 'I will add your run.',
        toolCalls: [{
          toolName: 'addRun',
          args: {
            date: '2024-01-15',
            duration: '00:30:00',
            distance: 5.0,
            distanceUnit: 'miles'
          }
        }]
      };
      
      // Mock final synthesis response
      const finalResponse = {
        text: 'Run added successfully!',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse) // Phase 1: Planning
        .mockResolvedValueOnce(finalResponse);   // Phase 3: Synthesis

      const messages = [{ role: 'user' as const, content: 'Add my run' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      // Verify Phase 2: Tool execution (addRun doesn't set user context internally)
      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'add_run',
        arguments: {
          date: '2024-01-15',
          duration: '00:30:00',
          distance: 5.0,
          distanceUnit: 'miles'
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle function calling errors gracefully', async () => {
      mockGenerateText.mockRejectedValueOnce(new Error('Function calling failed'));
      
      // Mock fallback response
      mockGenerateText.mockResolvedValueOnce({
        text: 'I can provide general advice.',
        toolCalls: []
      });

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(result.mcpStatus).toBe('fallback');
      expect(result.error).toContain('Function calling failed');
    });

    it('should handle complete generation failure', async () => {
      mockGenerateText.mockRejectedValue(new Error('All generation failed'));

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(result.mcpStatus).toBe('fallback');
      expect(result.error).toContain('All generation methods failed');
      expect(result.content).toContain('technical difficulties');
    });

    it('should handle MCP tool execution errors', async () => {
      mockMCPClient.callTool.mockRejectedValue(new Error('MCP tool failed'));

      const mockResponse = {
        text: 'Getting context.',
        toolCalls: [{
          toolName: 'getSmartUserContext',
          args: {}
        }]
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Get context' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      // Should still succeed at the chat level but tool would fail internally
      expect(result.mcpStatus).toBe('enhanced');
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted ChatResponse', async () => {
      const mockResponse = {
        text: 'Hello, runner!',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(result).toMatchObject({
        content: 'Hello, runner!',
        mcpStatus: 'enhanced',
        systemPrompt: expect.stringContaining('Maratron AI'),
        toolCalls: []
      });
    });

    it('should include systemPrompt in response', async () => {
      const mockResponse = { text: 'Hello!', toolCalls: [] };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(result.systemPrompt).toContain('Maratron AI');
      expect(result.systemPrompt).toContain('running and fitness coach');
    });
  });
});