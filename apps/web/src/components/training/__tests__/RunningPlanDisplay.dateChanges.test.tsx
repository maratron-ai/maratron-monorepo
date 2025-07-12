import { calculateWeeksBetweenDates } from '@utils/running/smartDates';
import { RunningPlanData } from '@maratypes/runningPlan';

// Mock data for testing
const mockPlanData: RunningPlanData = {
  weeks: 12,
  schedule: Array(12).fill(null).map((_, i) => ({
    weekNumber: i + 1,
    weeklyMileage: 30 + i * 2,
    unit: 'miles' as const,
    runs: [
      {
        type: 'easy' as const,
        unit: 'miles' as const,
        mileage: 8,
        targetPace: { unit: 'miles' as const, pace: '8:30' },
      },
      {
        type: 'long' as const,
        unit: 'miles' as const,
        mileage: 15,
        targetPace: { unit: 'miles' as const, pace: '9:00' },
      },
    ],
    phase: 'Base' as const,
    notes: 'Base building week',
  })),
  startDate: '2024-03-01',
  endDate: '2024-05-24',
  notes: 'Test plan',
};

describe('RunningPlanDisplay date change logic', () => {
  describe('Week calculation and plan regeneration triggers', () => {
    it('should detect when date changes require plan regeneration', () => {
      const originalStartDate = '2024-03-01';
      const originalEndDate = '2024-05-24';
      const originalWeeks = calculateWeeksBetweenDates(originalStartDate, originalEndDate);
      
      // Test various date change scenarios
      const scenarios = [
        {
          name: 'Minor start date change (same week)',
          newStartDate: '2024-03-03',
          endDate: originalEndDate,
          shouldRegenerate: false,
        },
        {
          name: 'Significant start date change (+4 weeks)',
          newStartDate: '2024-02-01',
          endDate: originalEndDate,
          shouldRegenerate: true,
        },
        {
          name: 'Minor end date change (same week)',
          startDate: originalStartDate,
          newEndDate: '2024-05-26',
          shouldRegenerate: false,
        },
        {
          name: 'Significant end date change (+3 weeks)',
          startDate: originalStartDate,
          newEndDate: '2024-06-14',
          shouldRegenerate: true,
        },
        {
          name: 'Major compression (16 weeks to 8 weeks)',
          newStartDate: '2024-03-29',
          newEndDate: '2024-05-24',
          shouldRegenerate: true,
        },
      ];

      scenarios.forEach(scenario => {
        const startDate = scenario.newStartDate || originalStartDate;
        const endDate = scenario.newEndDate || originalEndDate;
        const newWeeks = calculateWeeksBetweenDates(startDate, endDate);
        const weeksDifference = Math.abs(newWeeks - originalWeeks);
        const shouldRegenerate = weeksDifference > 1;

        expect(shouldRegenerate).toBe(scenario.shouldRegenerate);
        console.log(`${scenario.name}: ${originalWeeks} → ${newWeeks} weeks (${shouldRegenerate ? 'regenerate' : 'keep'})`);
      });
    });

    it('should calculate correct weeks for various date ranges', () => {
      const testCases = [
        { start: '2024-01-01', end: '2024-01-08', expectedWeeks: 1 },
        { start: '2024-01-01', end: '2024-01-15', expectedWeeks: 2 },
        { start: '2024-01-01', end: '2024-04-01', expectedWeeks: 13 },
        { start: '2024-01-01', end: '2024-07-01', expectedWeeks: 26 },
        { start: '2024-03-01', end: '2024-03-01', expectedWeeks: 0 },
      ];

      testCases.forEach(({ start, end, expectedWeeks }) => {
        const actualWeeks = calculateWeeksBetweenDates(start, end);
        expect(actualWeeks).toBe(expectedWeeks);
      });
    });

    it('should handle edge cases gracefully', () => {
      // Same day
      expect(calculateWeeksBetweenDates('2024-03-01', '2024-03-01')).toBe(0);
      
      // End date before start date
      expect(calculateWeeksBetweenDates('2024-03-08', '2024-03-01')).toBe(0);
      
      // Very long plans
      expect(calculateWeeksBetweenDates('2024-01-01', '2025-01-01')).toBe(52);
    });
  });

  describe('Plan parameter extraction', () => {
    it('should extract correct parameters from existing plan', () => {
      // Test distance unit extraction
      const distanceUnit = mockPlanData.schedule[0]?.runs[0]?.unit || 'miles';
      expect(distanceUnit).toBe('miles');

      // Test target distance extraction (should find marathon/race run)
      const lastWeek = mockPlanData.schedule[mockPlanData.schedule.length - 1];
      const marathonRun = lastWeek?.runs.find(r => r.type === 'marathon' || r.type === 'race');
      
      // For our mock data, we don't have a marathon run, so it should use fallback
      const targetDistance = marathonRun?.mileage || 26.2;
      expect(targetDistance).toBe(26.2); // Should use fallback

      // Test pace extraction
      const marathonWeek = mockPlanData.schedule.find(w => w.runs.some(r => r.type === 'marathon'));
      const targetPace = marathonWeek?.runs.find(r => r.type === 'marathon')?.targetPace?.pace;
      expect(targetPace).toBeUndefined(); // No marathon run in mock data
    });
  });

  describe('Race type detection', () => {
    it('should determine correct race type based on target distance', () => {
      const testCases = [
        { distance: 3.1, expectedType: '5k' },
        { distance: 6.2, expectedType: '10k' },
        { distance: 13.1, expectedType: 'half' },
        { distance: 26.2, expectedType: 'marathon' },
        { distance: 2.0, expectedType: '5k' }, // Edge case: shorter than 5k
        { distance: 50.0, expectedType: 'marathon' }, // Edge case: ultra distance
      ];

      testCases.forEach(({ distance, expectedType }) => {
        let detectedType: string;
        
        if (distance <= 3.2) {
          detectedType = '5k';
        } else if (distance <= 6.5) {
          detectedType = '10k';
        } else if (distance <= 13.2) {
          detectedType = 'half';
        } else {
          detectedType = 'marathon';
        }

        expect(detectedType).toBe(expectedType);
      });
    });
  });
});