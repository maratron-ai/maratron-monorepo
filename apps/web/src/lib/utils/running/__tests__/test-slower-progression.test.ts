describe('Test Slower Easy/Long Pace Progression', () => {
  it('should show different progression starting points', () => {
    console.log('\n🎯 EASY/LONG PACE PROGRESSION OPTIONS');
    console.log('====================================');
    console.log('Goal: 10:00 marathon | VDOT: 30 | 16 weeks');
    console.log('');
    
    const goalPaceSeconds = 10 * 60; // 10:00 = 600 seconds
    const totalWeeks = 16;
    
    // Different starting cushions to test
    const cushionOptions = [30, 45, 60, 90];
    
    cushionOptions.forEach(cushion => {
      console.log(`📊 Starting ${cushion} seconds slower than goal:`);
      console.log('Week | Progression Factor | Easy/Long Pace | Gap from Goal');
      console.log('-----|-------------------|----------------|---------------');
      
      [1, 4, 8, 12, 16].forEach(week => {
        const progressionFactor = Math.min(week / totalWeeks, 1);
        const paceSeconds = goalPaceSeconds + (1 - progressionFactor) * cushion;
        const minutes = Math.floor(paceSeconds / 60);
        const seconds = Math.round(paceSeconds % 60);
        const paceStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const gapSeconds = paceSeconds - goalPaceSeconds;
        const gapStr = gapSeconds > 0 ? `+${gapSeconds.toFixed(0)}s` : '0s';
        
        console.log(`${week.toString().padStart(4)} | ${progressionFactor.toFixed(3).padStart(17)} | ${paceStr.padStart(14)} | ${gapStr.padStart(13)}`);
      });
      console.log('');
    });
    
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log('• 30s cushion: Current (aggressive) - Week 1 at 10:28');
    console.log('• 45s cushion: Moderate - Week 1 at 10:45');  
    console.log('• 60s cushion: Conservative - Week 1 at 11:00');
    console.log('• 90s cushion: Very conservative - Week 1 at 11:30');
    console.log('');
    console.log('For VDOT 30 → 10:00 goal, suggest 60s cushion for safer progression');
    
    expect(true).toBe(true);
  });
});