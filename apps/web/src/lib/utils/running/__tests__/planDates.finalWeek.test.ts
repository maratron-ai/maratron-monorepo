import { assignDatesToPlan } from '../planDates';
import { RunningPlanData } from '@maratypes/runningPlan';

describe('assignDatesToPlan final week fix', () => {
  it('should align final week properly with race date', () => {
    // Create a mock plan
    const mockPlan: RunningPlanData = {
      weeks: 23,
      schedule: Array(23).fill(null).map((_, i) => ({
        weekNumber: i + 1,
        weeklyMileage: 30,
        unit: 'miles' as const,
        runs: [
          {
            type: 'easy' as const,
            unit: 'miles' as const,
            mileage: 8,
            targetPace: { unit: 'miles' as const, pace: '8:30' },
            day: 'Monday' as const,
          },
          // Add a marathon run to the final week
          ...(i === 22 ? [{
            type: 'marathon' as const,
            unit: 'miles' as const,
            mileage: 26.2,
            targetPace: { unit: 'miles' as const, pace: '8:00' },
            day: 'Thursday' as const,
          }] : []),
        ],
        phase: 'Base' as const,
      })),
      notes: 'Test plan',
    };

    // Test the problematic date range: 7/12/25 to 12/25/25
    const planWithDates = assignDatesToPlan(mockPlan, {
      startDate: '2025-07-12',
      endDate: '2025-12-25'
    });

    // Check that all weeks are continuous with no gaps
    const finalWeek = planWithDates.schedule[planWithDates.schedule.length - 1];
    const secondToLastWeek = planWithDates.schedule[planWithDates.schedule.length - 2];
    
    console.log('Second-to-last week start:', secondToLastWeek.startDate?.slice(0, 10));
    console.log('Final week start:', finalWeek.startDate?.slice(0, 10));
    console.log('Race date:', planWithDates.endDate?.slice(0, 10));
    
    // Verify weeks are continuous (final week should start exactly 7 days after second-to-last)
    const secondToLastStart = new Date(secondToLastWeek.startDate!);
    const finalStart = new Date(finalWeek.startDate!);
    const weekGap = Math.ceil((finalStart.getTime() - secondToLastStart.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('Days between last two weeks:', weekGap);
    expect(weekGap).toBe(7); // Should be exactly 7 days apart
    
    // 12/25/25 is a Thursday, so the Sunday before should be 12/21/25
    expect(finalWeek.startDate?.slice(0, 10)).toBe('2025-12-21');
    
    // Verify the marathon run is on the race date
    const marathonRun = finalWeek.runs.find(r => r.type === 'marathon');
    expect(marathonRun?.date?.slice(0, 10)).toBe('2025-12-25');
    
    // Calculate the gap between week start and race date (should be ≤ 6 days)
    const weekStartDate = new Date(finalWeek.startDate!);
    const raceDate = new Date(planWithDates.endDate!);
    const daysDiff = Math.ceil((raceDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('Days between final week start and race:', daysDiff);
    expect(daysDiff).toBeLessThanOrEqual(6); // Should be within a normal week
  });

  it('should handle race on different days of the week', () => {
    const mockPlan: RunningPlanData = {
      weeks: 12,
      schedule: Array(12).fill(null).map((_, i) => ({
        weekNumber: i + 1,
        weeklyMileage: 25,
        unit: 'miles' as const,
        runs: [
          {
            type: 'easy' as const,
            unit: 'miles' as const,
            mileage: 6,
            targetPace: { unit: 'miles' as const, pace: '9:00' },
            day: 'Tuesday' as const,
          },
          ...(i === 11 ? [{
            type: 'race' as const,
            unit: 'miles' as const,
            mileage: 13.1,
            targetPace: { unit: 'miles' as const, pace: '8:30' },
            day: 'Sunday' as const,
          }] : []),
        ],
        phase: 'Build' as const,
      })),
      notes: 'Half marathon plan',
    };

    // Test with race on Sunday
    const planWithSundayRace = assignDatesToPlan(mockPlan, {
      startDate: '2024-03-01',
      endDate: '2024-05-26' // Sunday
    });

    const finalWeek = planWithSundayRace.schedule[planWithSundayRace.schedule.length - 1];
    
    // For a Sunday race, the week should start on that same Sunday
    expect(finalWeek.startDate?.slice(0, 10)).toBe('2024-05-26');
    
    // Verify race is on correct date
    const raceRun = finalWeek.runs.find(r => r.type === 'race');
    expect(raceRun?.date?.slice(0, 10)).toBe('2024-05-26');
  });

  it('should maintain continuous weeks throughout the entire plan', () => {
    const mockPlan: RunningPlanData = {
      weeks: 16,
      schedule: Array(16).fill(null).map((_, i) => ({
        weekNumber: i + 1,
        weeklyMileage: 20 + i,
        unit: 'miles' as const,
        runs: [
          {
            type: 'easy' as const,
            unit: 'miles' as const,
            mileage: 5,
            targetPace: { unit: 'miles' as const, pace: '9:00' },
            day: 'Wednesday' as const,
          },
        ],
        phase: 'Base' as const,
      })),
      notes: 'Continuous weeks test',
    };

    const planWithDates = assignDatesToPlan(mockPlan, {
      startDate: '2024-01-07', // Sunday
      endDate: '2024-04-28'   // Sunday
    });

    // Check that all weeks are continuous
    for (let i = 1; i < planWithDates.schedule.length; i++) {
      const prevWeek = planWithDates.schedule[i - 1];
      const currentWeek = planWithDates.schedule[i];
      
      const prevStart = new Date(prevWeek.startDate!);
      const currentStart = new Date(currentWeek.startDate!);
      const daysBetween = Math.ceil((currentStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysBetween).toBe(7); // Each week should start exactly 7 days after the previous
    }

    // Verify last week aligns with race date and all weeks are continuous
    expect(planWithDates.schedule[15].startDate?.slice(0, 10)).toBe('2024-04-28'); // Race week starts on race day (Sunday)
    
    // The first week may be adjusted to ensure race date alignment
    const actualFirstWeek = planWithDates.schedule[0].startDate?.slice(0, 10);
    console.log('Adjusted first week start:', actualFirstWeek);
    
    // Verify it's exactly 15 weeks before the final week
    const firstWeekDate = new Date(actualFirstWeek!);
    const lastWeekDate = new Date(planWithDates.schedule[15].startDate!);
    const totalWeeks = Math.ceil((lastWeekDate.getTime() - firstWeekDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    expect(totalWeeks).toBe(15);
  });
});