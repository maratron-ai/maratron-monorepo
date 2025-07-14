import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('2-Week Taper Analysis', () => {
  it('should show the improved 2-week taper progression', () => {
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
        phase: week.phase
      };
    });

    console.log('\n🏃‍♂️ 2-WEEK TAPER ANALYSIS:');
    console.log('===========================');
    
    // Focus on final weeks
    const finalWeeks = longRunsData.slice(-4); // Last 4 weeks
    console.table(finalWeeks);
    
    console.log('\n📊 TAPER BREAKDOWN:');
    console.log('==================');
    
    const peakWeek = longRunsData[13]; // Week 14 (0-indexed)
    const taperWeek1 = longRunsData[14]; // Week 15
    const raceWeek = longRunsData[15]; // Week 16
    
    console.log(`🎯 Peak Week (${peakWeek.week}): ${peakWeek.distance} miles at ${peakWeek.pace} pace`);
    console.log(`📉 Taper Week (${taperWeek1.week}): ${taperWeek1.distance} miles at ${taperWeek1.pace} pace`);
    console.log(`🏆 Race Week (${raceWeek.week}): ${raceWeek.distance} miles at ${raceWeek.pace} pace`);
    
    const taperReduction = ((peakWeek.distance - taperWeek1.distance) / peakWeek.distance * 100).toFixed(0);
    console.log(`\n📈 Taper Reduction: ${peakWeek.distance} → ${taperWeek1.distance} miles (${taperReduction}% reduction)`);
    
    // Validate proper 2-week taper structure
    expect(peakWeek.phase).toBe('Peak');
    expect(taperWeek1.phase).toBe('Taper');
    expect(raceWeek.phase).toBe('Taper');
    expect(taperWeek1.distance).toBeLessThan(peakWeek.distance);
    expect(taperWeek1.distance).toBeGreaterThanOrEqual(15); // Minimum taper distance
  });
});