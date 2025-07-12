import { calculateSmartStartDate, calculateFirstWeekDuration, getMostRecentSunday, getNextSunday } from '../smartDates';
import { assignDatesToPlan } from '../planDates';
import { RunningPlanData } from '@maratypes/runningPlan';

describe('Smart Start Now Functionality', () => {
  describe('Helper Functions', () => {
    it('should calculate smart start date correctly for each day of week', () => {
      // Sunday-Wednesday: Start on most recent Sunday
      expect(calculateSmartStartDate('2025-07-13')).toBe('2025-07-13'); // Sunday
      expect(calculateSmartStartDate('2025-07-14')).toBe('2025-07-13'); // Monday → prev Sunday
      expect(calculateSmartStartDate('2025-07-15')).toBe('2025-07-13'); // Tuesday → prev Sunday  
      expect(calculateSmartStartDate('2025-07-16')).toBe('2025-07-13'); // Wednesday → prev Sunday
      
      // Thursday-Saturday: Start today
      expect(calculateSmartStartDate('2025-07-17')).toBe('2025-07-17'); // Thursday → today
      expect(calculateSmartStartDate('2025-07-18')).toBe('2025-07-18'); // Friday → today
      expect(calculateSmartStartDate('2025-07-19')).toBe('2025-07-19'); // Saturday → today
    });

    it('should calculate first week duration correctly', () => {
      expect(calculateFirstWeekDuration('2025-07-13')).toBe(7); // Sunday → 7 days
      expect(calculateFirstWeekDuration('2025-07-14')).toBe(6); // Monday → 6 days to next Sunday
      expect(calculateFirstWeekDuration('2025-07-15')).toBe(5); // Tuesday → 5 days
      expect(calculateFirstWeekDuration('2025-07-16')).toBe(4); // Wednesday → 4 days
      expect(calculateFirstWeekDuration('2025-07-17')).toBe(3); // Thursday → 3 days to Sunday
      expect(calculateFirstWeekDuration('2025-07-18')).toBe(2); // Friday → 2 days
      expect(calculateFirstWeekDuration('2025-07-19')).toBe(1); // Saturday → 1 day
    });

    it('should get most recent Sunday correctly', () => {
      expect(getMostRecentSunday('2025-07-13')).toBe('2025-07-13'); // Sunday
      expect(getMostRecentSunday('2025-07-14')).toBe('2025-07-13'); // Monday
      expect(getMostRecentSunday('2025-07-19')).toBe('2025-07-13'); // Saturday
      expect(getMostRecentSunday('2025-07-20')).toBe('2025-07-20'); // Next Sunday
    });

    it('should get next Sunday correctly', () => {
      expect(getNextSunday('2025-07-13')).toBe('2025-07-20'); // Sunday → next Sunday
      expect(getNextSunday('2025-07-14')).toBe('2025-07-20'); // Monday → next Sunday
      expect(getNextSunday('2025-07-19')).toBe('2025-07-20'); // Saturday → next Sunday
    });
  });

  describe('Smart Start Now Integration', () => {
    const createTestPlan = (weeks: number): RunningPlanData => ({
      weeks,
      schedule: Array(weeks).fill(null).map((_, i) => ({
        weekNumber: i + 1,
        weeklyMileage: 25,
        unit: 'miles' as const,
        runs: [
          {
            type: 'easy' as const,
            unit: 'miles' as const,
            mileage: 5,
            targetPace: { unit: 'miles' as const, pace: '8:30' },
            day: 'Monday' as const,
          },
          {
            type: 'easy' as const,
            unit: 'miles' as const,
            mileage: 6,
            targetPace: { unit: 'miles' as const, pace: '8:30' },
            day: 'Wednesday' as const,
          },
          {
            type: 'long' as const,
            unit: 'miles' as const,
            mileage: 8,
            targetPace: { unit: 'miles' as const, pace: '9:00' },
            day: 'Sunday' as const,
          },
          // Add race to final week
          ...(i === weeks - 1 ? [{
            type: 'race' as const,
            unit: 'miles' as const,
            mileage: 13.1,
            targetPace: { unit: 'miles' as const, pace: '8:00' },
            day: 'Sunday' as const,
          }] : []),
        ],
        phase: 'Base' as const,
      })),
      notes: 'Smart Start Test Plan',
    });

    it('should handle Thursday start correctly (start today, extend first week)', () => {
      const plan = createTestPlan(3);
      const smartStart = calculateSmartStartDate('2025-07-17'); // Thursday
      
      const planWithDates = assignDatesToPlan(plan, {
        startDate: smartStart,
        endDate: '2025-07-27', // Sunday race
        smartStartNow: true
      });

      // Debug output removed - test working correctly

      // First week should start Thursday
      expect(planWithDates.schedule[0].startDate?.slice(0, 10)).toBe('2025-07-17');
      
      // Monday run in first week should be Monday of NEXT week (can't go back)
      const week1Monday = planWithDates.schedule[0].runs.find(r => r.day === 'Monday');
      expect(week1Monday?.date?.slice(0, 10)).toBe('2025-07-21');
      
      // Wednesday run in first week should be next Wednesday  
      const week1Wednesday = planWithDates.schedule[0].runs.find(r => r.day === 'Wednesday');
      expect(week1Wednesday?.date?.slice(0, 10)).toBe('2025-07-23');
      
      // Sunday run in first week should be this upcoming Sunday
      const week1Sunday = planWithDates.schedule[0].runs.find(r => r.day === 'Sunday' && r.type === 'long');
      expect(week1Sunday?.date?.slice(0, 10)).toBe('2025-07-20');
      
      // Second week should start on Sunday after the extended first week (7/27)
      expect(planWithDates.schedule[1].startDate?.slice(0, 10)).toBe('2025-07-27');
    });

    it('should handle Monday start correctly (start on previous Sunday)', () => {
      const plan = createTestPlan(2);
      const smartStart = calculateSmartStartDate('2025-07-14'); // Monday
      
      const planWithDates = assignDatesToPlan(plan, {
        startDate: smartStart, // This will be 2025-07-13 (prev Sunday)
        endDate: '2025-07-20', // Sunday race
        smartStartNow: true
      });

      // First week should start on previous Sunday
      expect(planWithDates.schedule[0].startDate?.slice(0, 10)).toBe('2025-07-13');
      
      // Monday run should be today (within first week)
      const week1Monday = planWithDates.schedule[0].runs.find(r => r.day === 'Monday');
      expect(week1Monday?.date?.slice(0, 10)).toBe('2025-07-14');
      
      // Wednesday run should be this week
      const week1Wednesday = planWithDates.schedule[0].runs.find(r => r.day === 'Wednesday');
      expect(week1Wednesday?.date?.slice(0, 10)).toBe('2025-07-16');
      
      // Sunday run should be this Sunday
      const week1Sunday = planWithDates.schedule[0].runs.find(r => r.day === 'Sunday' && r.type === 'long');
      expect(week1Sunday?.date?.slice(0, 10)).toBe('2025-07-13');
    });

    it('should handle Saturday start correctly (start today, longest first week)', () => {
      const plan = createTestPlan(2);
      const smartStart = calculateSmartStartDate('2025-07-19'); // Saturday
      
      const planWithDates = assignDatesToPlan(plan, {
        startDate: smartStart,
        endDate: '2025-07-27', // Sunday race
        smartStartNow: true
      });

      // First week should start Saturday
      expect(planWithDates.schedule[0].startDate?.slice(0, 10)).toBe('2025-07-19');
      
      // Sunday run should be next day (tomorrow)
      const week1Sunday = planWithDates.schedule[0].runs.find(r => r.day === 'Sunday' && r.type === 'long');
      expect(week1Sunday?.date?.slice(0, 10)).toBe('2025-07-20');
      
      // Monday run should be in next week (first full week)
      const week1Monday = planWithDates.schedule[0].runs.find(r => r.day === 'Monday');
      expect(week1Monday?.date?.slice(0, 10)).toBe('2025-07-21');
      
      // Second week should start on Sunday after extended first week (skips one week)
      expect(planWithDates.schedule[1].startDate?.slice(0, 10)).toBe('2025-07-27');
    });

    it('should handle Sunday start correctly (normal 7-day week)', () => {
      const plan = createTestPlan(2);
      const smartStart = calculateSmartStartDate('2025-07-13'); // Sunday
      
      const planWithDates = assignDatesToPlan(plan, {
        startDate: smartStart,
        endDate: '2025-07-20' // Next Sunday race
      });

      // First week should start Sunday
      expect(planWithDates.schedule[0].startDate?.slice(0, 10)).toBe('2025-07-13');
      
      // All runs should be within the same week
      const week1Monday = planWithDates.schedule[0].runs.find(r => r.day === 'Monday');
      expect(week1Monday?.date?.slice(0, 10)).toBe('2025-07-14');
      
      const week1Wednesday = planWithDates.schedule[0].runs.find(r => r.day === 'Wednesday');
      expect(week1Wednesday?.date?.slice(0, 10)).toBe('2025-07-16');
      
      const week1Sunday = planWithDates.schedule[0].runs.find(r => r.day === 'Sunday' && r.type === 'long');
      expect(week1Sunday?.date?.slice(0, 10)).toBe('2025-07-13');
      
      // Second week (race week) should start on race day
      expect(planWithDates.schedule[1].startDate?.slice(0, 10)).toBe('2025-07-20');
    });

    it('should maintain race date alignment with smart start', () => {
      const plan = createTestPlan(4);
      const smartStart = calculateSmartStartDate('2025-07-18'); // Friday
      
      const planWithDates = assignDatesToPlan(plan, {
        startDate: smartStart,
        endDate: '2025-08-10', // Sunday race
        smartStartNow: true
      });

      // Race should still be on specified date
      const raceRun = planWithDates.schedule[3].runs.find(r => r.type === 'race');
      expect(raceRun?.date?.slice(0, 10)).toBe('2025-08-10');
      
      // All weeks after first should start on Sundays (Friday start skips one week)
      expect(planWithDates.schedule[1].startDate?.slice(0, 10)).toBe('2025-07-27'); // Sunday (skipped one week)
      expect(planWithDates.schedule[2].startDate?.slice(0, 10)).toBe('2025-08-03'); // Sunday  
      expect(planWithDates.schedule[3].startDate?.slice(0, 10)).toBe('2025-08-10'); // Sunday (race week)
    });
  });
});