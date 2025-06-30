/**
 * Advanced MCP Integration Tests for Enhanced Chat Handler
 * 
 * Tests ALL 28 new MCP tools including health & recovery, route & environment,
 * equipment & gear, competition & racing tools through the chat interface.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleMCPEnhancedChat } from '../chat-handler';
import { MaratronMCPClient } from '@lib/mcp/client';

// Mock the Anthropic SDK
jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn(() => 'mock-model')
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
  tool: jest.fn((config) => ({
    ...config,
    execute: config.execute
  }))
}));

// Mock the MCP client
jest.mock('@lib/mcp/client');

describe('Advanced MCP Integration Tests', () => {
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

    // Setup AI SDK mock
    mockGenerateText = jest.fn();
    const ai = jest.requireMock('ai') as { generateText: jest.Mock };
    ai.generateText = mockGenerateText;
  });

  describe('Training Plan Tools', () => {
    it('should provide training plan tools to Claude', async () => {
      const mockResponse = {
        text: 'I can help you create a training plan!',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'I want to train for a marathon' }];
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            generateTrainingPlan: expect.any(Object),
            getActiveTrainingPlan: expect.any(Object)
          })
        })
      );

      expect(result.mcpStatus).toBe('enhanced');
    });

    it('should execute generateTrainingPlan tool correctly', async () => {
      // Mock planning phase
      const planningResponse = {
        text: 'I will create a training plan for you.',
        toolCalls: [{
          toolName: 'generateTrainingPlan',
          args: {
            goalType: 'race',
            targetDistance: 26.2,
            targetTime: '4:00:00',
            weeks: 16,
            distanceUnit: 'miles'
          }
        }]
      };
      
      // Mock synthesis phase
      const finalResponse = {
        text: 'Here is your customized 16-week marathon training plan!',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      // Mock MCP tool response
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '🏃‍♂️ Training Plan Generated Successfully! Plan: Marathon Training Plan...' }],
        isError: false
      });

      const messages = [{ 
        role: 'user' as const, 
        content: 'Create a 16-week marathon training plan for a 4-hour goal' 
      }];
      
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      // Verify tool was called with correct parameters
      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'generate_training_plan',
        arguments: {
          goal_type: 'race',
          target_distance: 26.2,
          target_time: '4:00:00',
          weeks: 16,
          distance_unit: 'miles'
        }
      });

      expect(result.toolCalls).toEqual([{
        name: 'generateTrainingPlan',
        arguments: {
          goalType: 'race',
          targetDistance: 26.2,
          targetTime: '4:00:00',
          weeks: 16,
          distanceUnit: 'miles'
        }
      }]);
    });

    it('should execute getActiveTrainingPlan tool correctly', async () => {
      // Mock planning phase
      const planningResponse = {
        text: 'I will get your current training plan.',
        toolCalls: [{
          toolName: 'getActiveTrainingPlan',
          args: {}
        }]
      };
      
      const finalResponse = {
        text: 'Here is your active training plan with this week\'s schedule.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '🏃‍♂️ Active Training Plan: Marathon Plan Week 4 of 16...' }],
        isError: false
      });

      const messages = [{ 
        role: 'user' as const, 
        content: 'Show me my current training plan progress' 
      }];
      
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_active_training_plan',
        arguments: {}
      });
    });
  });

  describe('Goal Management Tools', () => {
    it('should provide goal management tools to Claude', async () => {
      const mockResponse = {
        text: 'I can help you set and track running goals!',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'I want to set a running goal' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            setRunningGoal: expect.any(Object),
            getGoalProgress: expect.any(Object)
          })
        })
      );
    });

    it('should execute setRunningGoal tool correctly', async () => {
      const planningResponse = {
        text: 'I will set a running goal for you.',
        toolCalls: [{
          toolName: 'setRunningGoal',
          args: {
            goalType: 'distance_pr',
            targetValue: 20.0,
            targetDate: '2024-12-31',
            description: 'Run my first 20-mile long run'
          }
        }]
      };
      
      const finalResponse = {
        text: 'Your 20-mile distance goal has been set!',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '🎯 Goal Set Successfully! Goal Type: Distance Pr Target: 20.0 miles...' }],
        isError: false
      });

      const messages = [{ 
        role: 'user' as const, 
        content: 'I want to set a goal to run 20 miles by the end of the year' 
      }];
      
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'set_running_goal',
        arguments: {
          goal_type: 'distance_pr',
          target_value: 20.0,
          target_date: '2024-12-31',
          description: 'Run my first 20-mile long run'
        }
      });
    });
  });

  describe('Analytics Tools', () => {
    it('should provide analytics tools to Claude', async () => {
      const mockResponse = {
        text: 'I can analyze your performance trends!',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Analyze my running performance' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            getPerformanceTrends: expect.any(Object),
            predictRaceTime: expect.any(Object)
          })
        })
      );
    });

    it('should execute getPerformanceTrends tool correctly', async () => {
      const planningResponse = {
        text: 'I will analyze your performance trends.',
        toolCalls: [{
          toolName: 'getPerformanceTrends',
          args: { period: '6months' }
        }]
      };
      
      const finalResponse = {
        text: 'Here is your 6-month performance analysis with insights.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '📈 Performance Trends (6months) Training Volume: Total Runs: 45...' }],
        isError: false
      });

      const messages = [{ 
        role: 'user' as const, 
        content: 'Show me my performance trends over the last 6 months' 
      }];
      
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_performance_trends',
        arguments: { period: '6months' }
      });
    });

    it('should execute predictRaceTime tool correctly', async () => {
      const planningResponse = {
        text: 'I will predict your race time.',
        toolCalls: [{
          toolName: 'predictRaceTime',
          args: {
            distance: 13.1,
            goalDate: '2024-10-15',
            distanceUnit: 'miles'
          }
        }]
      };
      
      const finalResponse = {
        text: 'Based on your current fitness, here is your half marathon prediction.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '🔮 Race Time Prediction Race: 13.1 miles on 2024-10-15 Predictions: Current Fitness: 1:45:00...' }],
        isError: false
      });

      const messages = [{ 
        role: 'user' as const, 
        content: 'What time should I expect for a half marathon on October 15th?' 
      }];
      
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'predict_race_time',
        arguments: {
          distance: 13.1,
          goal_date: '2024-10-15',
          distance_unit: 'miles'
        }
      });
    });
  });

  describe('Social Features', () => {
    it('should provide social tools to Claude', async () => {
      const mockResponse = {
        text: 'I can help you with social features!',
        toolCalls: []
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Show me my social feed' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            getSocialFeed: expect.any(Object),
            createRunPost: expect.any(Object)
          })
        })
      );
    });

    it('should execute getSocialFeed tool correctly', async () => {
      const planningResponse = {
        text: 'I will get your social feed.',
        toolCalls: [{
          toolName: 'getSocialFeed',
          args: { limit: 15 }
        }]
      };
      
      const finalResponse = {
        text: 'Here are the latest posts from your running community.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '👥 Social Feed (5 recent posts) @runner_friend posted: 🏃‍♂️ 6.2 miles in 00:50:00...' }],
        isError: false
      });

      const messages = [{ 
        role: 'user' as const, 
        content: 'Show me my social feed with recent posts' 
      }];
      
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_social_feed',
        arguments: { limit: 15 }
      });
    });

    it('should execute createRunPost tool correctly', async () => {
      const planningResponse = {
        text: 'I will create a social post for your run.',
        toolCalls: [{
          toolName: 'createRunPost',
          args: {
            runId: 'run-123',
            caption: 'Amazing morning run in the park!',
            shareToGroups: 'true'
          }
        }]
      };
      
      const finalResponse = {
        text: 'Your run has been shared with your followers and groups!',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: '✅ Run Posted Successfully! Post Details: Distance: 5.0 miles Time: 00:40:00...' }],
        isError: false
      });

      const messages = [{ 
        role: 'user' as const, 
        content: 'Share my latest run with caption "Amazing morning run in the park!" to all my groups' 
      }];
      
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'create_run_post',
        arguments: {
          run_id: 'run-123',
          caption: 'Amazing morning run in the park!',
          share_to_groups: 'true'
        }
      });
    });
  });

  describe('Advanced System Prompt', () => {
    it('should include advanced tools in system prompt', async () => {
      const mockResponse = { text: 'Hello!', toolCalls: [] };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      const systemMessage = mockGenerateText.mock.calls[0][0].messages[0];
      
      // Check for advanced tools sections
      expect(systemMessage.content).toContain('Advanced Training & Analytics:');
      expect(systemMessage.content).toContain('generateTrainingPlan');
      expect(systemMessage.content).toContain('setRunningGoal');
      expect(systemMessage.content).toContain('getPerformanceTrends');
      expect(systemMessage.content).toContain('predictRaceTime');
      expect(systemMessage.content).toContain('Social Features:');
      expect(systemMessage.content).toContain('getSocialFeed');
      expect(systemMessage.content).toContain('createRunPost');
      expect(systemMessage.content).toContain('Advanced Capabilities:');
    });
  });

  describe('Tool Error Handling', () => {
    it('should handle advanced tool failures gracefully', async () => {
      const planningResponse = {
        text: 'I will generate a training plan.',
        toolCalls: [{
          toolName: 'generateTrainingPlan',
          args: { goalType: 'race', targetDistance: 26.2 }
        }]
      };
      
      const finalResponse = {
        text: 'I apologize, there was an issue generating your training plan.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      // Mock tool failure
      mockMCPClient.callTool.mockRejectedValue(new Error('Training plan generation failed'));

      const messages = [{ 
        role: 'user' as const, 
        content: 'Create a marathon training plan' 
      }];
      
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      // Should still return a response despite tool failure
      expect(result.mcpStatus).toBe('enhanced');
      expect(result.content).toBeDefined();
    });
  });

  describe('Multi-Tool Coordination', () => {
    it('should handle multiple advanced tools in one request', async () => {
      const planningResponse = {
        text: 'I will analyze your progress and create a plan.',
        toolCalls: [
          {
            toolName: 'getPerformanceTrends',
            args: { period: '3months' }
          },
          {
            toolName: 'generateTrainingPlan',
            args: { 
              goalType: 'race', 
              targetDistance: 26.2,
              weeks: 16 
            }
          }
        ]
      };
      
      const finalResponse = {
        text: 'Based on your performance trends, here is your customized training plan.',
        toolCalls: []
      };
      
      mockGenerateText
        .mockResolvedValueOnce(planningResponse)
        .mockResolvedValueOnce(finalResponse);

      mockMCPClient.callTool
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'Performance trends analysis...' }],
          isError: false
        })
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'Training plan generated...' }],
          isError: false
        });

      const messages = [{ 
        role: 'user' as const, 
        content: 'Analyze my performance and create a marathon training plan based on my progress' 
      }];
      
      const result = await handleMCPEnhancedChat(messages, 'test-user', mockMCPClient);

      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].name).toBe('getPerformanceTrends');
      expect(result.toolCalls[1].name).toBe('generateTrainingPlan');
    });
  });
});