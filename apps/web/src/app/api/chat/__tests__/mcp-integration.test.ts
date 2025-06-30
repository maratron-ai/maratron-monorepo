/**
 * MCP Integration Tests for Enhanced Chat Handler
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleMCPEnhancedChat, ChatResponse } from '../chat-handler';
import { MaratronMCPClient } from '@lib/mcp/client';

// Mock the Anthropic SDK
jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn(() => 'mock-model')
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
  tool: jest.fn((config) => config)
}));

// Mock the MCP client
jest.mock('@lib/mcp/client');

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
    } as any;

    // Setup AI SDK mock
    mockGenerateText = jest.fn();
    (require('ai') as any).generateText = mockGenerateText;
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
            setUserContext: expect.any(Object),
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
          tools: undefined
        })
      );

      expect(result.mcpStatus).toBe('fallback');
    });

    it('should track tool calls made by Claude', async () => {
      const mockResponse = {
        text: 'I will get your user context.',
        toolCalls: [
          {
            toolName: 'setUserContext',
            args: { userId: 'test-user' }
          },
          {
            toolName: 'getSmartUserContext',
            args: {}
          }
        ]
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Get my data' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(result.toolCalls).toEqual([
        { name: 'setUserContext', arguments: { userId: 'test-user' } },
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
      expect(systemMessage.content).toContain('setUserContext');
      expect(systemMessage.content).toContain('Available Tools');
      expect(systemMessage.content).toContain('natural, conversational language');
    });

    it('should include all available tools in system prompt', async () => {
      const mockResponse = { text: 'Hello!', toolCalls: [] };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      const systemMessage = mockGenerateText.mock.calls[0][0].messages[0];
      const tools = [
        'setUserContext',
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

    it('should handle setUserContext tool execution', async () => {
      const mockResponse = {
        text: 'Context set.',
        toolCalls: [{
          toolName: 'setUserContext',
          args: { userId: 'test-user' }
        }]
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Set my context' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.setUserContext).toHaveBeenCalledWith('test-user');
    });

    it('should handle getSmartUserContext tool execution', async () => {
      const mockResponse = {
        text: 'Here is your context.',
        toolCalls: [{
          toolName: 'getSmartUserContext',
          args: {}
        }]
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Get my context' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_smart_user_context',
        arguments: {}
      });
    });

    it('should handle addRun tool execution', async () => {
      const mockResponse = {
        text: 'Run added.',
        toolCalls: [{
          toolName: 'addRun',
          args: {
            userId: 'test-user',
            date: '2024-01-15',
            duration: '00:30:00',
            distance: 5.0,
            distanceUnit: 'miles'
          }
        }]
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Add my run' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'add_run',
        arguments: {
          userId: 'test-user',
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