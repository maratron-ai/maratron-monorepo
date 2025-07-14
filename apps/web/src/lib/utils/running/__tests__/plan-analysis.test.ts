import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('Training Plan Analysis', () => {
  it('should analyze complete long run progression', () => {
    console.log('\n=== COMPLETE LONG RUN ANALYSIS ===');
    console.log('Goal: 10:15 pace marathon (VDOT 35)');
    console.log('Training Level: Intermediate, 16 weeks\n');

    const plan = generateLongDistancePlan(16, 26.2, 'miles', TrainingLevel.Intermediate, 35, 20, '10:15');

    console.log('ALL LONG RUNS:');
    console.log('Week | Distance | Pace   | Comments');
    console.log('-----|----------|--------|---------------------------');

    const goalPaceSeconds = 10 * 60 + 15; // 10:15 in seconds
    const longRuns: Array<{week: number, distance: number, pace: string, gap: number}> = [];
    
    plan.schedule.forEach((week, idx) => {
      const longRun = week.runs.find(r => r.type === 'long' || r.type === 'marathon');
      if (longRun) {
        const weekNum = idx + 1;
        const distance = longRun.mileage;
        const pace = longRun.targetPace.pace;
        
        // Calculate gap from goal pace
        const [mins, secs] = pace.split(':').map(Number);
        const paceSeconds = mins * 60 + secs;
        const gap = paceSeconds - goalPaceSeconds;
        
        longRuns.push({week: weekNum, distance, pace, gap});
        
        const weekStr = weekNum.toString().padStart(2);
        const distStr = distance.toString().padStart(2);
        const gapStr = gap > 0 ? `+${gap}s` : `${gap}s`;
        
        let comment = '';
        if (weekNum === 16) comment = `RACE DAY - ${gapStr} from goal`;
        else if (gap > 45) comment = `TOO SLOW - ${gapStr} from goal`;
        else if (gap > 20) comment = `Slow - ${gapStr} from goal`;
        else if (gap > 10) comment = `Good - ${gapStr} from goal`;
        else comment = `Excellent - ${gapStr} from goal`;
        
        console.log(`${weekStr}   | ${distStr} miles | ${pace}  | ${comment}`);
      }
    });
    
    console.log('\n=== DISTANCE PROGRESSION ANALYSIS ===');
    const distances = longRuns.slice(0, -1).map(r => r.distance); // Exclude race week
    const peak = Math.max(...distances);
    const peakWeek = longRuns.find(r => r.distance === peak)?.week;
    
    console.log(`Starting distance: ${distances[0]} miles`);
    console.log(`Peak distance: ${peak} miles (Week ${peakWeek})`);
    console.log(`Final long run: ${longRuns[longRuns.length-2].distance} miles (Week ${longRuns[longRuns.length-2].week})`);
    
    // Check for proper progression
    const week4 = longRuns.find(r => r.week === 4)?.distance;
    const week8 = longRuns.find(r => r.week === 8)?.distance;
    const week12 = longRuns.find(r => r.week === 12)?.distance;
    
    console.log('\nKey progression points:');
    console.log(`Week 4: ${week4} miles`);
    console.log(`Week 8: ${week8} miles`);
    console.log(`Week 12: ${week12} miles`);
    
    console.log('\n=== PACE PROGRESSION ANALYSIS ===');
    const paces = longRuns.slice(0, -1); // Exclude race
    const week1Gap = paces[0].gap;
    const finalGap = paces[paces.length-1].gap;
    
    console.log(`Starting pace gap: +${week1Gap}s from goal`);
    console.log(`Final training gap: +${finalGap}s from goal`);
    console.log(`Pace improvement: ${week1Gap - finalGap} seconds over training`);
    
    console.log('\n🚨 PROBLEMS IDENTIFIED:');
    let problems = 0;
    
    if (peak < 20) {
      console.log(`❌ Peak distance of ${peak} miles is too short for marathon (should be 20-22)`);
      problems++;
    }
    
    if (week8! <= distances[0]) {
      console.log(`❌ Week 8 distance (${week8} mi) should be higher than Week 1 (${distances[0]} mi)`);
      problems++;
    }
    
    if (peakWeek! > 13) {
      console.log(`❌ Peak distance in Week ${peakWeek} is too late (should be Week 12-13)`);
      problems++;
    }
    
    if (finalGap > 30) {
      console.log(`❌ Final training pace is ${finalGap}s slower than goal (should be <30s)`);
      problems++;
    }
    
    // Check for backwards progression
    for (let i = 1; i < Math.min(12, distances.length); i++) {
      if (distances[i] < distances[i-1] - 2) { // Allow for minor cutbacks
        console.log(`❌ Distance goes backwards: Week ${i} (${distances[i-1]} mi) → Week ${i+1} (${distances[i]} mi)`);
        problems++;
        break;
      }
    }
    
    if (problems === 0) {
      console.log('✅ No major problems identified');
    } else {
      console.log(`\nTotal problems found: ${problems}`);
    }

    expect(true).toBe(true); // Allow test to run for analysis
  });
});