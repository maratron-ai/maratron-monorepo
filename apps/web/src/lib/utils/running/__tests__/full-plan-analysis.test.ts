import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('Full Plan Analysis', () => {
  it('should output the complete 16-week training plan for analysis', () => {
    const plan = generateLongDistancePlan(
      16,        // weeks
      26.2,      // target distance (marathon)
      'miles',   // unit
      TrainingLevel.Beginner,
      30,        // VDOT
      20,        // starting weekly mileage
      '10:20'    // goal pace
    );

    console.log('\n📋 COMPLETE 16-WEEK MARATHON TRAINING PLAN:');
    console.log('==========================================');
    
    console.log(JSON.stringify(plan, null, 2));
    
    expect(plan.schedule).toHaveLength(16);
    expect(plan.weeks).toBe(16);
  });
});