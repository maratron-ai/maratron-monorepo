import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('Output Long Runs', () => {
  it('should output all long runs for the optimized plan', () => {
    const plan = generateLongDistancePlan(
      16,        // weeks
      26.2,      // target distance (marathon)
      'miles',   // unit
      TrainingLevel.Beginner,
      30,        // VDOT
      20,        // starting weekly mileage
      '10:20'    // goal pace
    );

    const longRunsData = plan.schedule.map((week) => {
      const longRun = week.runs.find(r => r.type === 'long' || r.type === 'marathon');
      return {
        week: week.weekNumber,
        distance: longRun?.mileage || 0,
        pace: longRun?.targetPace?.pace || 'N/A',
        type: longRun?.type || 'N/A',
        phase: week.phase
      };
    });

    console.log(JSON.stringify(longRunsData, null, 2));
  });
});