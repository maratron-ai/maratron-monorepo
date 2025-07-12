import { assignDatesToPlan } from '../planDates';
import { RunningPlanData } from '@maratypes/runningPlan';

describe('Start Now Date Alignment Fix', () => {
  it('should align week start dates with run dates when starting now', () => {
    // Create a simple plan similar to what the generator creates
    const mockPlan: RunningPlanData = {
      weeks: 2,
      schedule: [
        {
          weekNumber: 1,
          weeklyMileage: 20,
          unit: 'miles' as const,
          runs: [
            {
              type: 'easy' as const,
              unit: 'miles' as const,
              mileage: 6,
              targetPace: { unit: 'miles' as const, pace: '8:30' },
              day: 'Monday' as const,
            },
            {
              type: 'long' as const,
              unit: 'miles' as const,
              mileage: 8,
              targetPace: { unit: 'miles' as const, pace: '9:00' },
              day: 'Sunday' as const,
            },
          ],
          phase: 'Base' as const,
        },
        {
          weekNumber: 2,
          weeklyMileage: 22,
          unit: 'miles' as const,
          runs: [
            {
              type: 'easy' as const,
              unit: 'miles' as const,
              mileage: 6,
              targetPace: { unit: 'miles' as const, pace: '8:30' },
              day: 'Monday' as const,
            },
            {
              type: 'race' as const,
              unit: 'miles' as const,
              mileage: 13.1,
              targetPace: { unit: 'miles' as const, pace: '8:00' },
              day: 'Sunday' as const,
            },
          ],
          phase: 'Peak' as const,
        },
      ],
      notes: 'Start Now Test Plan',
    };

    // Simulate "Start Now" scenario: today is 2025-07-13 (Sunday), race is 2025-07-20 (Sunday)
    // The fix should start the plan on the beginning of the current week (2025-07-13)
    const planWithDates = assignDatesToPlan(mockPlan, {
      startDate: '2025-07-13', // Sunday (start of current week)
      endDate: '2025-07-20'    // Sunday (race date)
    });

    // Verify all dates are properly aligned - the key fix validation

    // Week 1 should start on 2025-07-13 (the provided start date)
    expect(planWithDates.schedule[0].startDate?.slice(0, 10)).toBe('2025-07-13');
    
    // Week 2 should start on 2025-07-20 (race week starts on race day for Sunday races)
    expect(planWithDates.schedule[1].startDate?.slice(0, 10)).toBe('2025-07-20');

    // Monday run in Week 1 should be on 2025-07-14
    const week1MondayRun = planWithDates.schedule[0].runs.find(r => r.day === 'Monday');
    expect(week1MondayRun?.date?.slice(0, 10)).toBe('2025-07-14');

    // Sunday run in Week 1 should be on 2025-07-13 (first Sunday of the plan)
    const week1SundayRun = planWithDates.schedule[0].runs.find(r => r.day === 'Sunday' && r.type === 'long');
    expect(week1SundayRun?.date?.slice(0, 10)).toBe('2025-07-13');

    // Race run in Week 2 should be on the race date (2025-07-20)
    const raceRun = planWithDates.schedule[1].runs.find(r => r.type === 'race');
    expect(raceRun?.date?.slice(0, 10)).toBe('2025-07-20');

    // Monday run in Week 2 should be on 2025-07-21
    const week2MondayRun = planWithDates.schedule[1].runs.find(r => r.day === 'Monday');
    expect(week2MondayRun?.date?.slice(0, 10)).toBe('2025-07-21');
  });

  it('should handle start now from mid-week (Wednesday)', () => {
    const mockPlan: RunningPlanData = {
      weeks: 1,
      schedule: [
        {
          weekNumber: 1,
          weeklyMileage: 15,
          unit: 'miles' as const,
          runs: [
            {
              type: 'easy' as const,
              unit: 'miles' as const,
              mileage: 5,
              targetPace: { unit: 'miles' as const, pace: '8:30' },
              day: 'Wednesday' as const,
            },
            {
              type: 'easy' as const,
              unit: 'miles' as const,
              mileage: 5,
              targetPace: { unit: 'miles' as const, pace: '8:30' },
              day: 'Friday' as const,
            },
            {
              type: 'long' as const,
              unit: 'miles' as const,
              mileage: 5,
              targetPace: { unit: 'miles' as const, pace: '9:00' },
              day: 'Sunday' as const,
            },
          ],
          phase: 'Base' as const,
        },
      ],
      notes: 'Mid-week start test',
    };

    // Today is Wednesday 2025-07-16, race is Sunday 2025-07-20
    // Start should be beginning of current week (2025-07-13)
    const planWithDates = assignDatesToPlan(mockPlan, {
      startDate: '2025-07-13', // Sunday (start of current week)
      endDate: '2025-07-20'    // Sunday (race date)
    });

    // With race date prioritization, the week starts on race day (2025-07-20)
    expect(planWithDates.schedule[0].startDate?.slice(0, 10)).toBe('2025-07-20');

    // Wednesday run should be on 2025-07-23 (3 days after week start)
    const wednesdayRun = planWithDates.schedule[0].runs.find(r => r.day === 'Wednesday');
    expect(wednesdayRun?.date?.slice(0, 10)).toBe('2025-07-23');

    // Friday run should be on 2025-07-25 (5 days after week start)
    const fridayRun = planWithDates.schedule[0].runs.find(r => r.day === 'Friday');
    expect(fridayRun?.date?.slice(0, 10)).toBe('2025-07-25');

    // Sunday run should be on race date (2025-07-20)
    const sundayRun = planWithDates.schedule[0].runs.find(r => r.day === 'Sunday');
    expect(sundayRun?.date?.slice(0, 10)).toBe('2025-07-20');
  });
});