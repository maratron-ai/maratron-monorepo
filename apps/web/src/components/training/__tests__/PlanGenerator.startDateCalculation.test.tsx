import { adjustStartDateToMaintainWeeks, calculateWeeksBetweenDates } from '@utils/running/smartDates';

describe('PlanGenerator start date calculation', () => {
  describe('Start date calculation based on race date and weeks', () => {
    it('should calculate correct start date when race date is set', () => {
      const testCases = [
        {
          raceDate: '2024-06-01',
          weeks: 12,
          expectedStartDate: '2024-03-09', // 12 weeks before June 1
        },
        {
          raceDate: '2024-05-15',
          weeks: 16,
          expectedStartDate: '2024-01-24', // 16 weeks before May 15
        },
        {
          raceDate: '2024-10-31',
          weeks: 8,
          expectedStartDate: '2024-09-05', // 8 weeks before Oct 31
        },
        {
          raceDate: '2024-12-25',
          weeks: 20,
          expectedStartDate: '2024-08-07', // 20 weeks before Dec 25
        },
      ];

      testCases.forEach(({ raceDate, weeks, expectedStartDate }) => {
        const calculatedStartDate = adjustStartDateToMaintainWeeks(raceDate, weeks);
        
        // Verify the calculation is correct
        expect(calculatedStartDate).toBe(expectedStartDate);
        
        // Double-check by calculating weeks between the dates
        const actualWeeks = calculateWeeksBetweenDates(calculatedStartDate, raceDate);
        expect(actualWeeks).toBe(weeks);
      });
    });

    it('should handle edge cases correctly', () => {
      // Very short plan (1 week)
      const shortPlan = adjustStartDateToMaintainWeeks('2024-03-08', 1);
      const shortWeeks = calculateWeeksBetweenDates(shortPlan, '2024-03-08');
      expect(shortWeeks).toBe(1);

      // Very long plan (52 weeks)
      const longPlan = adjustStartDateToMaintainWeeks('2024-12-31', 52);
      const longWeeks = calculateWeeksBetweenDates(longPlan, '2024-12-31');
      expect(longWeeks).toBe(52);

      // Leap year handling
      const leapYearPlan = adjustStartDateToMaintainWeeks('2024-02-29', 8);
      const leapWeeks = calculateWeeksBetweenDates(leapYearPlan, '2024-02-29');
      expect(leapWeeks).toBe(8);
    });

    it('should maintain consistent week calculations', () => {
      const raceDate = '2024-07-04';
      const weekOptions = [8, 12, 16, 20, 24, 32];

      weekOptions.forEach(weeks => {
        const startDate = adjustStartDateToMaintainWeeks(raceDate, weeks);
        const calculatedWeeks = calculateWeeksBetweenDates(startDate, raceDate);
        
        expect(calculatedWeeks).toBe(weeks);
      });
    });
  });

  describe('Plan generation logic flow', () => {
    it('should choose correct calculation method based on input', () => {
      // Simulate the logic from PlanGenerator
      const scenarios = [
        {
          name: 'Start Now with race date',
          startNow: true,
          endDate: '2024-06-01',
          weeks: 12,
          expectedBehavior: 'calculate weeks from today to race date',
        },
        {
          name: 'Generate Plan with race date',
          startNow: false,
          endDate: '2024-06-01',
          weeks: 12,
          expectedBehavior: 'calculate start date from race date and weeks',
        },
        {
          name: 'Generate Plan without race date',
          startNow: false,
          endDate: null,
          weeks: 12,
          expectedBehavior: 'start next Sunday and calculate end date',
        },
      ];

      scenarios.forEach(scenario => {
        if (scenario.startNow && scenario.endDate) {
          // This would use calculateWeeksBetweenDates(today, raceDate)
          const today = new Date().toISOString().slice(0, 10);
          const actualWeeks = calculateWeeksBetweenDates(today, scenario.endDate);
          expect(actualWeeks).toBeGreaterThanOrEqual(0);
        } else if (!scenario.startNow && scenario.endDate) {
          // This would use adjustStartDateToMaintainWeeks
          const startDate = adjustStartDateToMaintainWeeks(scenario.endDate, scenario.weeks);
          const calculatedWeeks = calculateWeeksBetweenDates(startDate, scenario.endDate);
          expect(calculatedWeeks).toBe(scenario.weeks);
        }
        // Third case (no race date) uses traditional date calculation
      });
    });
  });

  describe('User experience scenarios', () => {
    it('should handle typical marathon training scenarios', () => {
      const marathonScenarios = [
        {
          name: 'Spring marathon (16 weeks)',
          raceDate: '2024-04-21', // Boston Marathon
          weeks: 16,
        },
        {
          name: 'Fall marathon (20 weeks)',
          raceDate: '2024-11-03', // NYC Marathon
          weeks: 20,
        },
        {
          name: 'Half marathon (12 weeks)',
          raceDate: '2024-09-15',
          weeks: 12,
        },
      ];

      marathonScenarios.forEach(scenario => {
        const startDate = adjustStartDateToMaintainWeeks(scenario.raceDate, scenario.weeks);
        const actualWeeks = calculateWeeksBetweenDates(startDate, scenario.raceDate);
        
        expect(actualWeeks).toBe(scenario.weeks);
        
        // Ensure start date is in the past relative to race date
        expect(new Date(startDate).getTime()).toBeLessThan(new Date(scenario.raceDate).getTime());
        
        console.log(`${scenario.name}: ${startDate} → ${scenario.raceDate} (${actualWeeks} weeks)`);
      });
    });

    it('should handle date changes gracefully', () => {
      // User changes race date
      const originalRaceDate = '2024-06-01';
      const newRaceDate = '2024-06-15';
      const weeks = 12;

      const originalStartDate = adjustStartDateToMaintainWeeks(originalRaceDate, weeks);
      const newStartDate = adjustStartDateToMaintainWeeks(newRaceDate, weeks);

      // Both should maintain 12 weeks
      expect(calculateWeeksBetweenDates(originalStartDate, originalRaceDate)).toBe(weeks);
      expect(calculateWeeksBetweenDates(newStartDate, newRaceDate)).toBe(weeks);

      // New start date should be 2 weeks later
      const dateDiff = new Date(newStartDate).getTime() - new Date(originalStartDate).getTime();
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(14); // 2 weeks
    });
  });
});