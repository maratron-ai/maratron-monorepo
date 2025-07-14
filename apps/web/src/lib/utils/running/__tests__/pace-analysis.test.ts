import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('Comprehensive Pace Analysis', () => {
  it('should analyze pace zones across multiple training scenarios', () => {
    console.log('\n🔍 COMPREHENSIVE PACE ZONE ANALYSIS');
    console.log('=====================================');
    
    const scenarios = [
      {
        name: 'Beginner VDOT 30, Goal 10:20',
        vdot: 30,
        goal: '10:20',
        level: TrainingLevel.Beginner,
        expectedEasy: '11:50-12:20',
        expectedTempo: '9:50-10:05'
      },
      {
        name: 'Intermediate VDOT 35, Goal 9:30', 
        vdot: 35,
        goal: '9:30',
        level: TrainingLevel.Intermediate,
        expectedEasy: '11:00-11:30',
        expectedTempo: '9:00-9:15'
      },
      {
        name: 'Advanced VDOT 40, Goal 8:45',
        vdot: 40, 
        goal: '8:45',
        level: TrainingLevel.Advanced,
        expectedEasy: '10:15-10:45',
        expectedTempo: '8:15-8:30'
      },
      {
        name: 'Conservative Goal (VDOT 35, Goal 10:30)',
        vdot: 35,
        goal: '10:30', 
        level: TrainingLevel.Intermediate,
        expectedEasy: '12:00-12:30',
        expectedTempo: '10:00-10:15'
      }
    ];

    scenarios.forEach((scenario, index) => {
      console.log(`\n${index + 1}. ${scenario.name}`);
      console.log('=' + '='.repeat(scenario.name.length + 3));
      
      const plan = generateLongDistancePlan(
        16, 26.2, 'miles', scenario.level, scenario.vdot, 20, scenario.goal
      );

      // Analyze week 1, week 8, and week 16 pace zones
      const week1 = plan.schedule[0];
      const week8 = plan.schedule[7]; 
      const week16 = plan.schedule[15];
      
      console.log(`\n📊 PACE PROGRESSION:`);
      console.log(`Week  1: Easy=${week1.runs.find(r => r.type === 'easy')?.targetPace?.pace || 'N/A'}, Tempo=${week1.runs.find(r => r.type === 'tempo')?.targetPace?.pace || 'N/A'}, Long=${week1.runs.find(r => r.type === 'long')?.targetPace?.pace || 'N/A'}`);
      console.log(`Week  8: Easy=${week8.runs.find(r => r.type === 'easy')?.targetPace?.pace || 'N/A'}, Tempo=${week8.runs.find(r => r.type === 'tempo')?.targetPace?.pace || 'N/A'}, Long=${week8.runs.find(r => r.type === 'long')?.targetPace?.pace || 'N/A'}`);
      console.log(`Week 16: Marathon pace = ${week16.runs.find(r => r.type === 'marathon')?.targetPace?.pace || 'N/A'}`);
      
      // Calculate pace relationships
      const week1Easy = week1.runs.find(r => r.type === 'easy')?.targetPace?.pace;
      const week1Tempo = week1.runs.find(r => r.type === 'tempo')?.targetPace?.pace;
      const goalPace = scenario.goal;
      
      if (week1Easy && week1Tempo) {
        const easySeconds = parseTimeToSeconds(week1Easy);
        const tempoSeconds = parseTimeToSeconds(week1Tempo);
        const goalSeconds = parseTimeToSeconds(goalPace);
        
        const easyVsGoal = easySeconds - goalSeconds;
        const tempoVsGoal = goalSeconds - tempoSeconds;
        
        console.log(`\n🎯 PACE RELATIONSHIPS:`);
        console.log(`Easy vs Goal: +${easyVsGoal}s (should be +90-120s)`);
        console.log(`Tempo vs Goal: -${tempoVsGoal}s (should be +15-30s faster)`);
        console.log(`Expected Easy: ${scenario.expectedEasy}`);
        console.log(`Expected Tempo: ${scenario.expectedTempo}`);
        
        // Flag issues
        if (easyVsGoal > 150) {
          console.log(`❌ ISSUE: Easy pace too slow (${easyVsGoal}s vs goal)`);
        }
        if (tempoVsGoal < 15) {
          console.log(`❌ ISSUE: Tempo pace not fast enough vs goal`);
        }
        if (easyVsGoal < 60) {
          console.log(`❌ ISSUE: Easy pace too fast (not sustainable)`);
        }
      }
    });

    function parseTimeToSeconds(timeStr: string): number {
      const [mins, secs] = timeStr.split(':').map(Number);
      return mins * 60 + secs;
    }
  });
});