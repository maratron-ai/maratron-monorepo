import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { createProgressivePaceZones } from '../validation';
import { TrainingLevel } from '@maratypes/user';

describe('User Issue Reproduction', () => {
  describe('Exact User Scenario Investigation', () => {
    it('should reproduce user scenario and examine all run types', () => {
      console.log('\n🕵️ REPRODUCING USER EXACT SCENARIO\n');
      console.log('User reported: Goal 10:15, fastest long run in week 15 was 11:18');
      console.log('Let me test various VDOT values to find this discrepancy...\n');

      // Test different VDOT values to see if any produce the 11:18 pace
      const testVDOTs = [28, 30, 32, 35, 38, 40];
      const goal = '10:15';

      testVDOTs.forEach(vdot => {
        try {
          console.log(`--- Testing VDOT ${vdot} ---`);
          
          const plan = generateLongDistancePlan(
            16, 26.2, 'miles', TrainingLevel.Intermediate, vdot, 20, goal
          );

          // Check week 15 (second to last)
          const week15 = plan.schedule[14]; // 0-indexed
          console.log(`Week 15 runs:`);
          
          week15.runs.forEach((run, idx) => {
            console.log(`  ${idx+1}. ${run.type}: ${run.mileage} ${run.unit} at ${run.targetPace.pace}`);
          });

          // Find the fastest non-race run in week 15
          const nonRaceRuns = week15.runs.filter(r => r.type !== 'marathon');
          const fastestPace = nonRaceRuns.reduce((fastest, run) => {
            const currentSec = parseTime(run.targetPace.pace);
            const fastestSec = parseTime(fastest);
            return currentSec < fastestSec ? run.targetPace.pace : fastest;
          }, '99:99');

          console.log(`  Fastest non-race run: ${fastestPace}`);
          
          if (fastestPace === '11:18') {
            console.log(`  🎯 FOUND IT! VDOT ${vdot} produces 11:18 pace`);
          }
          
          console.log('');
        } catch (error: any) {
          console.log(`  ❌ VDOT ${vdot} failed: ${error.message}\n`);
        }
      });
    });

    it('should analyze progressive vs non-progressive training differences', () => {
      console.log('\n🔬 PROGRESSIVE vs NON-PROGRESSIVE COMPARISON\n');
      
      // Test both with and without progressive training to see differences
      const vdot = 35;
      const goal = '10:15';
      
      console.log('Testing if there are different code paths...');
      
      // Test 1: With goal pace (progressive training)
      try {
        const planWithGoal = generateLongDistancePlan(
          16, 26.2, 'miles', TrainingLevel.Intermediate, vdot, 20, goal
        );
        console.log('\nWith Goal Pace (Progressive Training):');
        const week15WithGoal = planWithGoal.schedule[14];
        week15WithGoal.runs.forEach(run => {
          console.log(`  ${run.type}: ${run.targetPace.pace}`);
        });
      } catch (error: any) {
        console.log(`With goal failed: ${error.message}`);
      }

      // Test 2: Without goal pace (traditional training)
      try {
        const planWithoutGoal = generateLongDistancePlan(
          16, 26.2, 'miles', TrainingLevel.Intermediate, vdot, 20
        );
        console.log('\nWithout Goal Pace (Traditional Training):');
        const week15WithoutGoal = planWithoutGoal.schedule[14];
        week15WithoutGoal.runs.forEach(run => {
          console.log(`  ${run.type}: ${run.targetPace.pace}`);
        });
      } catch (error: any) {
        console.log(`Without goal failed: ${error.message}`);
      }
    });

    it('should test if long runs use different pace calculation than marathon pace', () => {
      console.log('\n🎭 LONG RUN vs MARATHON PACE ANALYSIS\n');
      
      const vdot = 35;
      const goal = '10:15';
      const weeks = 16;
      const raceMeters = 26.2 * 1609.34;

      // Test week 15 progressive zones
      try {
        const week15Zones = createProgressivePaceZones(vdot, goal, weeks, 15, raceMeters);
        console.log('Week 15 Progressive Zones:');
        console.log(`  Marathon: ${week15Zones.zones.marathon}`);
        console.log(`  Easy: ${week15Zones.zones.easy}`);
        console.log(`  Tempo: ${week15Zones.zones.tempo}`);
        console.log(`  Interval: ${week15Zones.zones.interval}`);
        
        // Check what the plan actually assigns to long runs
        const plan = generateLongDistancePlan(
          16, 26.2, 'miles', TrainingLevel.Intermediate, vdot, 20, goal
        );
        
        const week15Plan = plan.schedule[14];
        const longRun = week15Plan.runs.find(r => r.type === 'long');
        
        console.log('\nActual Plan Assignment:');
        console.log(`  Long run pace: ${longRun?.targetPace.pace}`);
        console.log(`  Marathon zone pace: ${week15Zones.zones.marathon}`);
        
        if (longRun?.targetPace.pace !== week15Zones.zones.marathon) {
          console.log(`  ⚠️ DISCREPANCY: Long run uses different pace than marathon zone!`);
        }
        
      } catch (error: any) {
        console.log(`Analysis failed: ${error.message}`);
      }
    });

    it('should check if the issue is in the blending calculation', () => {
      console.log('\n🧮 BLENDING CALCULATION INVESTIGATION\n');
      
      const vdot = 35;
      const goal = '10:15';
      const weeks = 16;
      const raceMeters = 26.2 * 1609.34;

      console.log('Checking week-by-week blending in final 20% (weeks 13-16):');
      
      [13, 14, 15, 16].forEach(weekNum => {
        try {
          const zones = createProgressivePaceZones(vdot, goal, weeks, weekNum, raceMeters);
          const isInFinalPhase = weekNum >= weeks * 0.8;
          const isRaceWeek = weekNum === weeks;
          
          console.log(`Week ${weekNum}: ${zones.zones.marathon} (${isRaceWeek ? 'RACE WEEK' : isInFinalPhase ? 'BLENDED' : 'NORMAL'})`);
          
          if (zones.zones.marathon === '11:18') {
            console.log(`  🎯 FOUND 11:18 in week ${weekNum}!`);
          }
        } catch (error: any) {
          console.log(`Week ${weekNum}: ERROR - ${error.message}`);
        }
      });
    });
  });
});

// Helper function
function parseTime(timeStr: string): number {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
}