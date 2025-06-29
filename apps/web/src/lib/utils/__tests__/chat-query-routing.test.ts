/**
 * Tests for intelligent query routing in chat
 * These tests should fail initially (TDD approach)
 */

import { 
  needsUserData, 
  gatherUserData, 
  createPersonalizedPrompt 
} from '../chat-query-routing';
import { MaratronMCPClient } from '@lib/mcp/client';

// This module doesn't exist yet - tests should fail
describe('Chat Query Routing', () => {
  describe('needsUserData function', () => {
    it('should detect queries requiring user run data', () => {
      const runDataQueries = [
        'How did my last run go?',
        'What\'s my weekly mileage?',
        'Show me my recent runs',
        'What was my pace yesterday?',
        'How far did I run this week?',
        'Am I improving my pace?'
      ];

      runDataQueries.forEach(query => {
        const result = needsUserData(query);
        expect(result.requiresData).toBe(true);
        expect(result.dataTypes).toContain('runs');
        expect(result.mcpTools).toContain('get_smart_user_context');
      });
    });

    it('should detect queries requiring shoe data', () => {
      const shoeQueries = [
        'How many miles on my shoes?',
        'Should I retire these shoes?',
        'Which shoes should I wear?',
        'My shoe mileage'
      ];

      shoeQueries.forEach(query => {
        const result = needsUserData(query);
        expect(result.requiresData).toBe(true);
        expect(result.dataTypes).toContain('shoes');
      });
    });

    it('should detect queries requiring training plan data', () => {
      const planQueries = [
        'What should I run today?',
        'What\'s my next workout?',
        'Show me my training plan',
        'When is my next rest day?'
      ];

      planQueries.forEach(query => {
        const result = needsUserData(query);
        expect(result.requiresData).toBe(true);
        expect(result.dataTypes).toContain('goals');
        expect(result.mcpTools).toContain('get_smart_user_context');
      });
    });

    it('should detect queries requiring profile data', () => {
      const profileQueries = [
        'What\'s my current VDOT?',
        'My personal records',
        'How much do I weigh?',
        'What are my goals?'
      ];

      profileQueries.forEach(query => {
        const result = needsUserData(query);
        expect(result.requiresData).toBe(true);
        expect(result.dataTypes).toContain('profile');
      });
    });

    it('should NOT require data for general advice queries', () => {
      const generalQueries = [
        'What are the benefits of running?',
        'How to prevent shin splints?',
        'Best nutrition for marathons',
        'Running form tips',
        'How to train for a 5K?'
      ];

      generalQueries.forEach(query => {
        const result = needsUserData(query);
        expect(result.requiresData).toBe(false);
        expect(result.dataTypes).toEqual([]);
        expect(result.mcpTools).toEqual([]);
      });
    });

    it('should handle mixed queries that might need multiple data types', () => {
      const mixedQueries = [
        'How are my runs going and should I get new shoes?',
        'Show me my progress and next workout',
        'My running stats and goals'
      ];

      mixedQueries.forEach(query => {
        const result = needsUserData(query);
        expect(result.requiresData).toBe(true);
        expect(result.dataTypes.length).toBeGreaterThan(1);
      });
    });

    it('should return appropriate MCP tools for detected data types', () => {
      const result = needsUserData('Show me my recent runs and current VDOT');
      
      expect(result.requiresData).toBe(true);
      expect(result.mcpTools).toContain('get_smart_user_context');
      expect(result.dataTypes).toContain('runs');
      expect(result.dataTypes).toContain('profile');
    });
  });

  describe('gatherUserData function', () => {
    const mockMCPClient = {
      callTool: jest.fn(),
      setUserContext: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should gather run data when requested', async () => {
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ recent_runs: [] }) }],
        isError: false
      });

      const result = await gatherUserData(['runs'], 'user-123', mockMCPClient as unknown as MaratronMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_smart_user_context',
        arguments: {}
      });
      expect(result.runs).toBeDefined();
    });

    it('should gather multiple data types in parallel', async () => {
      mockMCPClient.callTool.mockResolvedValue({
        content: [{ 
          type: 'text', 
          text: JSON.stringify({ 
            recent_runs: [{ distance: 5 }], 
            shoes: [{ name: 'Nike' }] 
          }) 
        }],
        isError: false
      });

      const result = await gatherUserData(['runs', 'shoes'], 'user-123', mockMCPClient as unknown as MaratronMCPClient);

      expect(mockMCPClient.callTool).toHaveBeenCalledTimes(1); // Smart context gets everything
      expect(result).toHaveProperty('runs');
      expect(result).toHaveProperty('shoes');
    });

    it('should handle MCP tool failures gracefully', async () => {
      // Silence console.error for this test since we expect the error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMCPClient.callTool.mockRejectedValue(new Error('Tool failed'));

      const result = await gatherUserData(['runs'], 'user-123', mockMCPClient as unknown as MaratronMCPClient);

      expect(result).toEqual({});
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should parse JSON responses correctly', async () => {
      const mockData = {
        recent_runs: [{ distance: 5, pace: '8:00' }],
        preferences: { distance_unit: 'miles' }
      };

      mockMCPClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockData) }],
        isError: false
      });

      const result = await gatherUserData(['runs'], 'user-123', mockMCPClient as unknown as MaratronMCPClient);

      expect(result.recent_runs).toEqual(mockData.recent_runs);
      expect(result.preferences).toEqual(mockData.preferences);
    });
  });

  describe('createPersonalizedPrompt function', () => {
    it('should create basic system prompt without user data', () => {
      const prompt = createPersonalizedPrompt({}, null);

      expect(prompt).toContain('Maratron AI');
      expect(prompt).toContain('running and fitness coach');
      expect(prompt).toContain('Claude 3.5');
    });

    it('should include user run data in prompt when available', () => {
      const userData = {
        recent_runs: [
          { distance: 5, pace: '8:00', date: '2024-01-15' },
          { distance: 3, pace: '7:30', date: '2024-01-14' }
        ]
      };

      const prompt = createPersonalizedPrompt(userData, null);

      expect(prompt).toContain('recent runs');
      expect(prompt).toContain('5 mile');
      expect(prompt).toContain('8:00');
    });

    it('should include user preferences in prompt', () => {
      const userData = {
        preferences: {
          distance_unit: 'kilometers',
          response_detail: 'detailed'
        }
      };

      const prompt = createPersonalizedPrompt(userData, null);

      expect(prompt).toContain('kilometers');
      expect(prompt).toContain('detailed');
    });

    it('should include user context when available', () => {
      const userContext = {
        userId: 'user-123',
        preferences: {
          distanceUnit: 'miles',
          responseDetail: 'brief',
          maxResults: 5
        }
      };

      const prompt = createPersonalizedPrompt({}, userContext);

      expect(prompt).toContain('miles');
      expect(prompt).toContain('brief');
    });

    it('should handle empty or null data gracefully', () => {
      const prompt1 = createPersonalizedPrompt(null, null);
      const prompt2 = createPersonalizedPrompt({}, null);
      const prompt3 = createPersonalizedPrompt(undefined, undefined);

      [prompt1, prompt2, prompt3].forEach(prompt => {
        expect(prompt).toContain('Maratron AI');
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(100);
      });
    });

    it('should prioritize user data over general context', () => {
      const userData = {
        preferences: { distance_unit: 'kilometers' }
      };
      const userContext = {
        userId: 'user-123',
        preferences: { distanceUnit: 'miles' }
      };

      const prompt = createPersonalizedPrompt(userData, userContext);

      // Should use kilometers from userData, not miles from userContext
      expect(prompt).toContain('kilometers');
    });
  });
});