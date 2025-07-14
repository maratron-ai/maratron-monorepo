import { generateLongDistancePlan } from '../plans/longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('Improvement Analysis', () => {
  it('should analyze the fixes to cutback weeks, taper, and easy runs', () => {
    const plan = generateLongDistancePlan(
      16, 26.2, 'miles', TrainingLevel.Beginner, 30, 20, '10:20'
    );

    console.log('\n📊 IMPROVEMENT ANALYSIS - BEFORE vs AFTER');
    console.log('=========================================');
    
    // Volume progression analysis
    const weeklyVolumes = plan.schedule.map(w => w.weeklyMileage);
    console.log('\n📈 WEEKLY VOLUME PROGRESSION:');
    console.log('Week:  ' + plan.schedule.map(w => w.weekNumber).join('  '));
    console.log('Miles: ' + weeklyVolumes.join(' '));
    
    // Cutback analysis
    console.log('\n🔄 CUTBACK WEEK ANALYSIS:');
    const cutbackWeeks = plan.schedule.filter(w => w.notes.includes('Cutback'));
    cutbackWeeks.forEach((week, i) => {
      const prevWeek = plan.schedule[week.weekNumber - 2];
      if (prevWeek) {
        const reduction = ((prevWeek.weeklyMileage - week.weeklyMileage) / prevWeek.weeklyMileage * 100).toFixed(0);
        console.log(`Week ${week.weekNumber}: ${prevWeek.weeklyMileage} → ${week.weeklyMileage} miles (${reduction}% reduction)`);
      }
    });
    
    // Easy run analysis
    console.log('\n🏃 EASY RUN ANALYSIS:');
    const easyRuns = plan.schedule.map(w => {
      const easy = w.runs.find(r => r.type === 'easy');
      return { week: w.weekNumber, miles: easy?.mileage || 0, phase: w.phase };
    }).filter(e => e.miles > 0);
    
    const maxEasy = Math.max(...easyRuns.map(e => e.miles));
    const minEasy = Math.min(...easyRuns.map(e => e.miles));
    console.log(`Easy run range: ${minEasy} - ${maxEasy} miles`);
    console.log(`Peak easy run: ${maxEasy} miles (${maxEasy <= 8 ? '✅ Good' : '❌ Too long'})`);
    
    // Taper tempo analysis
    console.log('\n⏰ TAPER TEMPO ANALYSIS:');
    const taperWeeks = plan.schedule.filter(w => w.phase === 'Taper' && w.weekNumber < 16);
    taperWeeks.forEach(week => {
      const tempo = week.runs.find(r => r.type === 'tempo');
      if (tempo) {
        console.log(`Week ${week.weekNumber}: ${tempo.mileage} mile tempo (${tempo.mileage <= 3 ? '✅ Appropriate' : '❌ Too long'})`);
      }
    });
    
    // Volume distribution analysis
    console.log('\n📋 VOLUME DISTRIBUTION SUMMARY:');
    console.log(`Peak week: ${Math.max(...weeklyVolumes)} miles`);
    console.log(`Taper weeks: ${taperWeeks.map(w => w.weeklyMileage).join(', ')} miles`);
    console.log(`Race week: ${plan.schedule[15].weeklyMileage} miles`);
    
    expect(maxEasy).toBeLessThanOrEqual(8);
    expect(cutbackWeeks.length).toBeGreaterThan(0);
  });
});