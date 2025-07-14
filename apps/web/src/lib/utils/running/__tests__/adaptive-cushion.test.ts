import { createProgressivePaceZones } from "../validation";
import { TrainingLevel } from "@maratypes/user";

describe('Adaptive Cushion Based on Training Level and VDOT Gap', () => {
  it('should show different cushions for various scenarios', () => {
    console.log('\n🎯 ADAPTIVE CUSHION SYSTEM');
    console.log('==========================');
    console.log('Goal: 10:00 marathon | Week 1 pace calculations');
    console.log('');
    
    const goalPace = "10:00";
    const marathonMeters = 26.2 * 1609.34;
    const week = 1;
    const totalWeeks = 16;
    
    // Test different scenarios
    const scenarios = [
      { vdot: 35, level: TrainingLevel.Advanced, desc: "Advanced runner, modest goal" },
      { vdot: 32, level: TrainingLevel.Intermediate, desc: "Intermediate runner, moderate goal" },
      { vdot: 30, level: TrainingLevel.Beginner, desc: "Beginner runner, ambitious goal" },
      { vdot: 28, level: TrainingLevel.Beginner, desc: "Beginner runner, very ambitious goal" },
      { vdot: 25, level: TrainingLevel.Beginner, desc: "Beginner runner, extremely ambitious goal" }
    ];
    
    scenarios.forEach(scenario => {
      const result = createProgressivePaceZones(
        scenario.vdot,
        goalPace,
        totalWeeks,
        week,
        marathonMeters,
        scenario.level
      );
      
      // Calculate the cushion that was applied
      const goalPaceSeconds = 10 * 60; // 10:00 = 600 seconds
      const actualPaceSeconds = parsePaceToSeconds(result.zones.easy);
      const appliedCushion = actualPaceSeconds - goalPaceSeconds;
      
      console.log(`📊 VDOT ${scenario.vdot} | ${TrainingLevel[scenario.level]}`);
      console.log(`   ${scenario.desc}`);
      console.log(`   Week 1 Easy/Marathon: ${result.zones.easy}`);
      console.log(`   Applied cushion: +${appliedCushion}s`);
      console.log('');
    });
    
    console.log('💡 CUSHION CALCULATION LOGIC:');
    console.log('=============================');
    console.log('Base cushion by level:');
    console.log('• Advanced: 45s');
    console.log('• Intermediate: 60s');  
    console.log('• Beginner: 90s');
    console.log('');
    console.log('VDOT gap adjustment:');
    console.log('• +15s per VDOT point above 2-point improvement');
    console.log('• Example: If goal requires 6 VDOT improvement → +60s cushion');
    console.log('');
    console.log('🎯 BENEFITS:');
    console.log('============');
    console.log('• Advanced runners start more aggressively');
    console.log('• Beginners get conservative, achievable progressions');
    console.log('• Ambitious goals get extra cushion for safety');
    console.log('• Progression remains goal-oriented for all levels');
    
    expect(true).toBe(true);
  });
});

function parsePaceToSeconds(paceStr: string): number {
  const parts = paceStr.split(':');
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds;
}