import { generateLongDistancePlan } from "../plans/longDistancePlan";
import { TrainingLevel } from "@maratypes/user";

describe('Full 16-Week Marathon Plan Display', () => {
  it('should display complete 16-week plan for VDOT 30, goal 10:00', () => {
    console.log('\n🏃‍♂️ 16-WEEK MARATHON TRAINING PLAN');
    console.log('=====================================');
    console.log('Current VDOT: 30 | Goal Pace: 10:00 | Distance: 26.2 miles');
    console.log('Training Level: Beginner | Progressive pace development enabled\n');

    const plan = generateLongDistancePlan(
      16,                    // weeks
      26.2,                 // target distance (marathon)
      "miles",              // distance unit
      TrainingLevel.Beginner, // training level
      30,                   // current VDOT
      20,                   // starting weekly mileage
      "10:00",              // target pace
      undefined,            // target total time
      undefined             // run type days
    );

    // Display each week in detail
    plan.schedule.forEach((week, index) => {
      const weekNum = week.weekNumber;
      const phase = week.phase;
      const notes = week.notes;
      const totalMiles = week.weeklyMileage;
      
      console.log(`📅 WEEK ${weekNum} - ${phase.toUpperCase()} PHASE`);
      console.log(`Total Volume: ${totalMiles} miles | ${notes}`);
      console.log('─'.repeat(50));
      
      week.runs.forEach((run, runIndex) => {
        const runType = run.type.toUpperCase().padEnd(8);
        const distance = run.mileage.toString().padStart(4);
        const pace = run.targetPace.pace;
        const notes = run.notes ? ` | ${run.notes}` : '';
        
        console.log(`  ${runType}: ${distance} mi @ ${pace} pace${notes}`);
      });
      
      console.log(''); // Empty line between weeks
    });

    console.log('\n📊 PLAN SUMMARY');
    console.log('===============');
    console.log(`Total Weeks: ${plan.weeks}`);
    console.log(`Total Distance: ${plan.schedule.reduce((total, week) => total + week.weeklyMileage, 0)} miles`);
    console.log(`Average Weekly Volume: ${(plan.schedule.reduce((total, week) => total + week.weeklyMileage, 0) / plan.weeks).toFixed(1)} miles`);
    console.log(`Peak Week Volume: ${Math.max(...plan.schedule.map(w => w.weeklyMileage))} miles`);
    
    // Show pace progression
    console.log('\n🎯 PACE PROGRESSION');
    console.log('===================');
    const marathonPaces = plan.schedule
      .filter(week => week.runs.some(run => run.type === 'long' || run.type === 'marathon'))
      .map(week => {
        const longRun = week.runs.find(run => run.type === 'long' || run.type === 'marathon');
        return {
          week: week.weekNumber,
          pace: longRun?.targetPace.pace || 'N/A'
        };
      });
    
    // Show key progression points
    const keyWeeks = [1, 4, 8, 12, 16];
    keyWeeks.forEach(weekNum => {
      const weekData = marathonPaces.find(w => w.week === weekNum);
      if (weekData) {
        console.log(`Week ${weekNum.toString().padStart(2)}: ${weekData.pace} pace`);
      }
    });

    expect(plan.schedule.length).toBe(16);
    expect(plan.schedule[15].runs[0].targetPace.pace).toBe("10:00"); // Final race pace
  });
});