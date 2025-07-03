import { 
  buildPersonalizedPrompt, 
  getCoachSystemPrompt, 
  enhanceSystemPrompt 
} from '../prompt-builder';

// Mock coach personas data
jest.mock('../../../lib/data/coach-personas', () => ({
  getCoachPersonaByName: jest.fn(),
  COACH_PERSONAS: [
    {
      name: 'Thunder McGrath',
      description: 'High-energy motivational coach',
      icon: '🏃‍♂️',
      personality: 'motivational',
      systemPrompt: 'You are Thunder McGrath, a high-energy motivational running coach...',
    },
    {
      name: 'Zen Rodriguez',
      description: 'Mindful, philosophical approach',
      icon: '🧘‍♀️',
      personality: 'zen',
      systemPrompt: 'You are Zen Rodriguez, a mindful running coach...',
    },
  ],
}));

describe('Coach Prompt Builder (TDD - Failing Tests)', () => {
  describe('getCoachSystemPrompt', () => {
    it('should return coach system prompt when coach is provided', () => {
      const mockCoach = {
        id: '1',
        name: 'Thunder McGrath',
        description: 'High-energy motivational coach',
        icon: '🏃‍♂️',
        systemPrompt: 'You are Thunder McGrath, a high-energy motivational running coach. Always push for more effort and challenge runners to go beyond their comfort zone.',
        personality: 'motivational',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = getCoachSystemPrompt(mockCoach);

      expect(result).toBe(mockCoach.systemPrompt);
      expect(result).toContain('Thunder McGrath');
      expect(result).toContain('high-energy motivational');
    });

    it('should return null when no coach is provided', () => {
      const result = getCoachSystemPrompt(null);
      expect(result).toBeNull();
    });

    it('should return null when coach is undefined', () => {
      const result = getCoachSystemPrompt(undefined);
      expect(result).toBeNull();
    });

    it('should handle coach with empty system prompt', () => {
      const mockCoach = {
        id: '1',
        name: 'Test Coach',
        description: 'Test description',
        icon: '🏃‍♂️',
        systemPrompt: '',
        personality: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = getCoachSystemPrompt(mockCoach);
      expect(result).toBe('');
    });
  });

  describe('enhanceSystemPrompt', () => {
    it('should combine base prompt with coach prompt when coach is provided', () => {
      const basePrompt = 'You are a helpful running assistant.';
      const coachPrompt = 'You are Thunder McGrath, a high-energy motivational coach.';

      const result = enhanceSystemPrompt(basePrompt, coachPrompt);

      expect(result).toContain(basePrompt);
      expect(result).toContain(coachPrompt);
      expect(result).toContain('Thunder McGrath');
      // Should be structured with clear sections
      expect(result).toMatch(/coach persona/i);
    });

    it('should return base prompt when no coach prompt is provided', () => {
      const basePrompt = 'You are a helpful running assistant.';

      const result = enhanceSystemPrompt(basePrompt, null);

      expect(result).toBe(basePrompt);
    });

    it('should return base prompt when coach prompt is empty', () => {
      const basePrompt = 'You are a helpful running assistant.';

      const result = enhanceSystemPrompt(basePrompt, '');

      expect(result).toBe(basePrompt);
    });

    it('should handle base prompt being null or undefined', () => {
      const coachPrompt = 'You are Thunder McGrath.';

      const resultNull = enhanceSystemPrompt(null, coachPrompt);
      const resultUndefined = enhanceSystemPrompt(undefined, coachPrompt);

      expect(resultNull).toBe(coachPrompt);
      expect(resultUndefined).toBe(coachPrompt);
    });

    it('should structure the combined prompt correctly', () => {
      const basePrompt = 'You are a helpful running assistant with access to user data.';
      const coachPrompt = 'You are Thunder McGrath, a high-energy motivational coach. Use lots of energy and excitement!';

      const result = enhanceSystemPrompt(basePrompt, coachPrompt);

      // Should maintain base functionality
      expect(result).toContain('running assistant');
      expect(result).toContain('user data');
      
      // Should include coach personality
      expect(result).toContain('Thunder McGrath');
      expect(result).toContain('energy and excitement');
      
      // Should be well-structured
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(3); // Should be multi-line
    });
  });

  describe('buildPersonalizedPrompt', () => {
    it('should build complete personalized prompt with coach and user data', () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: '1',
          name: 'Thunder McGrath',
          description: 'High-energy motivational coach',
          icon: '🏃‍♂️',
          systemPrompt: 'You are Thunder McGrath, a high-energy motivational coach. Always push for greatness!',
          personality: 'motivational',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const basePrompt = 'You are a helpful running assistant.';
      const userContext = 'User has run 5 miles today at 7:30 pace.';

      const result = buildPersonalizedPrompt(basePrompt, mockUser, userContext);

      expect(result).toContain('Thunder McGrath');
      expect(result).toContain('John Runner');
      expect(result).toContain('5 miles today');
      expect(result).toContain('running assistant');
      expect(result).toContain('push for greatness');
    });

    it('should handle user without selected coach', () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: null,
      };

      const basePrompt = 'You are a helpful running assistant.';
      const userContext = 'User has run 5 miles today.';

      const result = buildPersonalizedPrompt(basePrompt, mockUser, userContext);

      expect(result).toContain('running assistant');
      expect(result).toContain('John Runner');
      expect(result).toContain('5 miles today');
      expect(result).not.toContain('Thunder McGrath');
    });

    it('should handle missing user context', () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: '1',
          name: 'Thunder McGrath',
          systemPrompt: 'You are Thunder McGrath!',
          personality: 'motivational',
        },
      };

      const basePrompt = 'You are a helpful running assistant.';

      const result = buildPersonalizedPrompt(basePrompt, mockUser, null);

      expect(result).toContain('Thunder McGrath');
      expect(result).toContain('John Runner');
      expect(result).toContain('running assistant');
    });

    it('should prioritize coach personality over generic responses', () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: '1',
          name: 'Thunder McGrath',
          systemPrompt: 'You are Thunder McGrath! Use high-energy motivation and push harder!',
          personality: 'motivational',
        },
      };

      const basePrompt = 'You are a calm and measured running assistant.';

      const result = buildPersonalizedPrompt(basePrompt, mockUser);

      // Coach personality should override the calm tone
      expect(result).toContain('Thunder McGrath');
      expect(result).toContain('high-energy');
      expect(result).toContain('push harder');
      
      // Should still maintain assistant functionality
      expect(result).toContain('running assistant');
    });

    it('should handle complex user context data', () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: '2',
          name: 'Zen Rodriguez',
          systemPrompt: 'You are Zen Rodriguez, a mindful coach. Focus on balance and awareness.',
          personality: 'zen',
        },
      };

      const basePrompt = 'You are a helpful running assistant.';
      const userContext = `
        Recent runs: 5 mile easy run (7:30 pace), 3 mile tempo (6:45 pace)
        Goals: Marathon training, injury prevention
        VDOT: 52
        Training level: Intermediate
      `;

      const result = buildPersonalizedPrompt(basePrompt, mockUser, userContext);

      expect(result).toContain('Zen Rodriguez');
      expect(result).toContain('mindful');
      expect(result).toContain('John Runner');
      expect(result).toContain('Marathon training');
      expect(result).toContain('VDOT: 52');
      expect(result).toContain('Intermediate');
    });
  });

  describe('Prompt Quality and Structure', () => {
    it('should create prompts with proper length and structure', () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Runner',
        selectedCoach: {
          id: '1',
          name: 'Thunder McGrath',
          systemPrompt: 'You are Thunder McGrath, a high-energy motivational coach.',
          personality: 'motivational',
        },
      };

      const basePrompt = 'You are a helpful running assistant.';
      const userContext = 'User data here.';

      const result = buildPersonalizedPrompt(basePrompt, mockUser, userContext);

      // Should be substantial but not excessive
      expect(result.length).toBeGreaterThan(100);
      expect(result.length).toBeLessThan(5000);

      // Should have clear structure
      const lines = result.split('\n').filter(line => line.trim());
      expect(lines.length).toBeGreaterThan(3);
    });

    it('should maintain consistent prompt quality across different coaches', () => {
      const basePrompt = 'You are a helpful running assistant.';
      const userContext = 'User has been running for 2 years.';

      const coaches = [
        {
          name: 'Thunder McGrath',
          systemPrompt: 'You are Thunder McGrath, high-energy coach.',
          personality: 'motivational',
        },
        {
          name: 'Zen Rodriguez', 
          systemPrompt: 'You are Zen Rodriguez, mindful coach.',
          personality: 'zen',
        },
      ];

      coaches.forEach(coach => {
        const mockUser = {
          id: 'user-1',
          name: 'Test User',
          selectedCoach: coach,
        };

        const result = buildPersonalizedPrompt(basePrompt, mockUser, userContext);

        expect(result).toContain(coach.name);
        expect(result).toContain('running assistant');
        expect(result).toContain('Test User');
        expect(result.length).toBeGreaterThan(100);
      });
    });
  });
});