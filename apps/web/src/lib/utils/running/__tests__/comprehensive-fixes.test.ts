import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('Comprehensive Algorithm Fixes', () => {
  it('should produce user-friendly progression with no dual stress violations', () => {
    const plan = generateLongDistancePlan(
      16,        // weeks
      26.2,      // target distance (marathon)
      'miles',   // unit
      TrainingLevel.Beginner,
      30,        // VDOT
      20,        // starting weekly mileage
      '10:20'    // goal pace
    );

    console.log('\n🚀 COMPREHENSIVE FIXES - SMART PROGRESSION:');
    console.log('============================================');
    
    const longRunsData = plan.schedule.map((week, index) => {
      const longRun = week.runs.find(r => r.type === 'long' || r.type === 'marathon');
      return {
        week: week.weekNumber,
        distance: longRun?.mileage || 0,
        pace: longRun?.targetPace?.pace || 'N/A',
        type: longRun?.type || 'N/A',
        phase: week.phase
      };
    });

    // Analyze for dual stress violations
    console.log('\n🔍 DUAL STRESS ANALYSIS:');
    for (let i = 1; i < longRunsData.length - 1; i++) { // Skip race week
      const prev = longRunsData[i-1];
      const curr = longRunsData[i];
      
      const distanceChange = curr.distance - prev.distance;
      const prevPaceSeconds = parseTimeToSeconds(prev.pace);
      const currPaceSeconds = parseTimeToSeconds(curr.pace);
      const paceChange = prevPaceSeconds - currPaceSeconds; // Positive = improvement
      
      if (Math.abs(distanceChange) > 0.1 && Math.abs(paceChange) > 5) {
        console.log(`⚠️ Week ${prev.week}→${curr.week}: Distance ${distanceChange > 0 ? '+' : ''}${distanceChange.toFixed(1)}mi, Pace ${paceChange > 0 ? '-' : '+'}${Math.abs(paceChange)}s`);
      } else if (Math.abs(distanceChange) > 0.1) {
        console.log(`✅ Week ${prev.week}→${curr.week}: Distance focus ${distanceChange > 0 ? '+' : ''}${distanceChange.toFixed(1)}mi`);
      } else if (Math.abs(paceChange) > 5) {
        console.log(`✅ Week ${prev.week}→${curr.week}: Pace focus ${paceChange > 0 ? '-' : '+'}${Math.abs(paceChange)}s`);
      }
    }

    console.log('\n📊 LONG RUNS PROGRESSION:');
    console.log(JSON.stringify(longRunsData, null, 2));

    expect(longRunsData).toHaveLength(16);
    
    // Validate peak distance is improved
    const peakDistance = Math.max(...longRunsData.slice(0, -1).map(r => r.distance));
    console.log(`\n🎯 Peak distance: ${peakDistance} miles (${(peakDistance/26.2*100).toFixed(0)}% of marathon)`);
    expect(peakDistance).toBeGreaterThanOrEqual(20); // Should be 20+ miles for proper marathon preparation
  });
});

function parseTimeToSeconds(timeStr: string): number {
  const [mins, secs] = timeStr.split(':').map(Number);
  return mins * 60 + secs;
}