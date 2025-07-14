import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { createProgressivePaceZones } from '../validation';
import { TrainingLevel } from '@maratypes/user';

describe('Training Pace Analysis - Deep Investigation', () => {
  describe('Realistic Training Pace Investigation', () => {
    it('should analyze training pace gaps across different fitness/goal combinations', () => {
      console.log('\n🔍 DEEP ANALYSIS: Training Pace vs Goal Pace Gaps\n');

      const testScenarios = [
        // Scenario 1: User's reported issue
        { 
          name: "User Reported Issue", 
          vdot: 35, 
          goal: '10:15', 
          description: "Intermediate runner with ambitious goal"
        },
        // Scenario 2: Conservative goal
        { 
          name: "Conservative Goal", 
          vdot: 35, 
          goal: '12:00', 
          description: "Same fitness, realistic goal"
        },
        // Scenario 3: Very ambitious goal
        { 
          name: "Very Ambitious", 
          vdot: 30, 
          goal: '9:00', 
          description: "Beginner with very ambitious goal"
        },
        // Scenario 4: Well-matched fitness/goal
        { 
          name: "Well Matched", 
          vdot: 42, 
          goal: '9:15', 
          description: "Good fitness-to-goal ratio"
        },
        // Scenario 5: Elite scenario
        { 
          name: "Elite Scenario", 
          vdot: 55, 
          goal: '6:30', 
          description: "High fitness, elite goal"
        }
      ];

      testScenarios.forEach(({ name, vdot, goal, description }) => {
        console.log(`\n--- ${name} (${description}) ---`);
        console.log(`VDOT: ${vdot}, Goal: ${goal}`);
        
        try {
          const plan = generateLongDistancePlan(
            16, 26.2, 'miles', TrainingLevel.Intermediate, vdot, 20, goal
          );

          // Analyze key weeks
          const week1 = plan.schedule[0];
          const week8 = plan.schedule[7]; 
          const week14 = plan.schedule[13]; // Second to last week
          const week16 = plan.schedule[15]; // Race week

          const week1Long = week1.runs.find(r => r.type === 'long');
          const week8Long = week8.runs.find(r => r.type === 'long');
          const week14Long = week14.runs.find(r => r.type === 'long');
          const raceRun = week16.runs.find(r => r.type === 'marathon');

          // Calculate pace differences
          const goalSec = parseTime(goal);
          const week1Gap = parseTime(week1Long?.targetPace.pace || '0:00') - goalSec;
          const week8Gap = parseTime(week8Long?.targetPace.pace || '0:00') - goalSec;
          const week14Gap = parseTime(week14Long?.targetPace.pace || '0:00') - goalSec;

          console.log(`Week 1 Long:  ${week1Long?.targetPace.pace} (${formatGap(week1Gap)} slower than goal)`);
          console.log(`Week 8 Long:  ${week8Long?.targetPace.pace} (${formatGap(week8Gap)} slower than goal)`);
          console.log(`Week 14 Long: ${week14Long?.targetPace.pace} (${formatGap(week14Gap)} slower than goal)`);
          console.log(`Week 16 Race: ${raceRun?.targetPace.pace} (goal pace)`);
          
          // Flag problematic gaps
          if (week14Gap > 45) {
            console.log(`⚠️  PROBLEM: Week 14 is ${Math.round(week14Gap)}s slower than goal (should be <45s)`);
          }
          if (week8Gap > 90) {
            console.log(`⚠️  PROBLEM: Week 8 is ${Math.round(week8Gap)}s slower than goal (should be <90s)`);
          }
          
        } catch (error: any) {
          console.log(`❌ FAILED: ${error.message}`);
        }
      });

      expect(true).toBe(true); // Allow test to run for analysis
    });

    it('should analyze progressive pace zone calculations', () => {
      console.log('\n🔬 PROGRESSIVE PACE ZONE ANALYSIS\n');
      
      // Analyze the user's specific scenario week by week
      const vdot = 35;
      const goal = '10:15';
      const weeks = 16;
      const raceMeters = 26.2 * 1609.34;

      console.log(`Analyzing progressive zones for VDOT ${vdot}, Goal ${goal}:`);
      
      // Test specific weeks
      const testWeeks = [1, 4, 8, 12, 14, 15, 16];
      
      testWeeks.forEach(weekNum => {
        try {
          const result = createProgressivePaceZones(vdot, goal, weeks, weekNum, raceMeters);
          const goalSec = parseTime(goal);
          const marathonSec = parseTime(result.zones.marathon);
          const gap = marathonSec - goalSec;
          
          console.log(`Week ${weekNum.toString().padStart(2)}: Marathon=${result.zones.marathon} (${formatGap(gap)} from goal), VDOT=${result.currentTrainingVDOT.toFixed(1)}`);
          
          if (weekNum >= 14 && gap > 45) {
            console.log(`  ⚠️  Late-stage training too slow! Should be within 45s of goal.`);
          }
        } catch (error: any) {
          console.log(`Week ${weekNum}: ERROR - ${error.message}`);
        }
      });
    });

    it('should compare current vs marathon pace calculations', () => {
      console.log('\n⚖️  PACE CALCULATION COMPARISON\n');
      
      // For a VDOT 35 runner, what does Jack Daniels formula predict?
      const vdot = 35;
      const raceMeters = 26.2 * 1609.34;
      
      console.log(`For VDOT ${vdot} runner:`);
      
      // Import the calculatePaceForVDOT function to test directly
      const { calculatePaceForVDOT } = require('../jackDaniels');
      
      const easyPace = calculatePaceForVDOT(raceMeters, vdot, "E");
      const marathonPace = calculatePaceForVDOT(raceMeters, vdot, "M"); 
      const tempoPace = calculatePaceForVDOT(raceMeters, vdot, "T");
      const intervalPace = calculatePaceForVDOT(raceMeters, vdot, "I");
      
      console.log(`Easy: ${easyPace}`);
      console.log(`Marathon: ${marathonPace} <-- This is what VDOT 35 can actually do`);
      console.log(`Tempo: ${tempoPace}`);
      console.log(`Interval: ${intervalPace}`);
      console.log(`User Goal: 10:15 <-- This is what they want to do`);
      
      const marathonSec = parseTime(marathonPace);
      const goalSec = parseTime('10:15');
      const fitnessGap = marathonSec - goalSec;
      
      console.log(`\nFitness Gap: ${formatGap(fitnessGap)} (goal is ${Math.round(fitnessGap)}s faster than current fitness)`);
      
      if (fitnessGap > 120) {
        console.log(`⚠️  MAJOR GAP: Goal requires significant fitness improvement`);
      }
    });
  });
});

// Helper functions
function parseTime(timeStr: string): number {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
}

function formatGap(seconds: number): string {
  if (seconds === 0) return '0s';
  const sign = seconds > 0 ? '+' : '-';
  const abs = Math.abs(seconds);
  return `${sign}${abs}s`;
}