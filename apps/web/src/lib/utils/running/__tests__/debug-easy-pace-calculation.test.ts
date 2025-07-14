import { calculatePaceForVDOT } from "../jackDaniels";
import { createProgressivePaceZones } from "../validation";

describe('Debug Easy Pace Calculation Steps', () => {
  it('should walk through easy pace calculation for VDOT 30', () => {
    console.log('\n🔍 EASY PACE CALCULATION WALKTHROUGH');
    console.log('=====================================');
    console.log('VDOT: 30 | Goal: 10:00 marathon | Week 1');
    console.log('');
    
    const vdot = 30;
    const goalPace = "10:00";
    const marathonMeters = 26.2 * 1609.34; // Marathon distance in meters
    const week = 1;
    const totalWeeks = 16;
    
    console.log('📋 INPUT PARAMETERS:');
    console.log(`- Current VDOT: ${vdot}`);
    console.log(`- Goal pace: ${goalPace}`);
    console.log(`- Marathon distance: ${marathonMeters.toFixed(0)} meters`);
    console.log(`- Week: ${week} of ${totalWeeks}`);
    console.log('');
    
    // Step 1: Traditional VDOT-based easy pace
    console.log('🏃 STEP 1: Traditional VDOT-Based Easy Pace');
    console.log('===========================================');
    const traditionalEasyPace = calculatePaceForVDOT(marathonMeters, vdot, "E");
    console.log(`Traditional Easy pace for VDOT ${vdot}: ${traditionalEasyPace}`);
    console.log('Formula: Uses Jack Daniels zone factor of 0.7 for Easy pace');
    console.log('Process: VO2 = VDOT * 0.7 = 30 * 0.7 = 21');
    console.log('Then binary search finds pace that produces VO2 of 21');
    console.log('');
    
    // Step 2: Progressive pace zones calculation
    console.log('🎯 STEP 2: Our Progressive Training System');
    console.log('==========================================');
    const progressiveResult = createProgressivePaceZones(
      vdot,
      goalPace,
      totalWeeks,
      week,
      marathonMeters
    );
    
    console.log(`Easy pace from progressive system: ${progressiveResult.zones.easy}`);
    console.log(`Marathon pace from progressive system: ${progressiveResult.zones.marathon}`);
    console.log('');
    
    // Step 3: Show the key difference
    console.log('🔄 STEP 3: Key Decision - Easy = Marathon Pace');
    console.log('===============================================');
    console.log('User requested: "Lets make the easy pace the same as the long pace"');
    console.log('Implementation: Easy runs use progressive marathon pace for specificity');
    console.log('');
    console.log(`Traditional VDOT 30 Easy: ${traditionalEasyPace} (very slow)`);
    console.log(`Progressive Easy/Marathon: ${progressiveResult.zones.easy} (goal-oriented)`);
    console.log('');
    
    console.log('📊 WHY THIS MAKES SENSE:');
    console.log('========================');
    console.log('1. Traditional easy pace (14:30) is too slow for aggressive goals');
    console.log('2. Marathon-specific training principle: practice goal pace gradually');
    console.log('3. Progressive approach: 10:28 → 10:26 → 10:24 → ... → 10:00');
    console.log('4. Easy runs become marathon-pace practice sessions');
    console.log('');
    
    // Step 4: Show the progression factor
    console.log('🔢 STEP 4: Progressive Calculation Details');
    console.log('==========================================');
    
    // Parse goal pace to seconds
    const goalPaceParts = goalPace.split(':');
    const goalPaceSeconds = parseInt(goalPaceParts[0]) * 60 + parseInt(goalPaceParts[1]);
    
    // Calculate progression factor
    const progressionFactor = Math.min(week / totalWeeks, 1);
    
    // Progressive pace calculation
    const progressivePaceSeconds = goalPaceSeconds + (1 - progressionFactor) * 30;
    
    console.log(`Goal pace: ${goalPace} = ${goalPaceSeconds} seconds`);
    console.log(`Week ${week} progression factor: ${week}/${totalWeeks} = ${progressionFactor.toFixed(3)}`);
    console.log(`Progressive pace formula: ${goalPaceSeconds} + (1 - ${progressionFactor.toFixed(3)}) * 30`);
    console.log(`= ${goalPaceSeconds} + ${((1 - progressionFactor) * 30).toFixed(1)} = ${progressivePaceSeconds.toFixed(1)} seconds`);
    
    const progressiveMinutes = Math.floor(progressivePaceSeconds / 60);
    const progressiveSecondsRemainder = Math.round(progressivePaceSeconds % 60);
    console.log(`= ${progressiveMinutes}:${progressiveSecondsRemainder.toString().padStart(2, '0')} pace`);
    console.log('');
    
    console.log('🎯 SUMMARY:');
    console.log('===========');
    console.log(`Week ${week} Easy Pace: ${progressiveResult.zones.easy}`);
    console.log('Calculation: Goal-oriented progressive marathon pace');
    console.log('Purpose: Marathon-specific training with gradual progression');
    console.log('User benefit: Practices goal pace gradually instead of shuffling');
    
    expect(progressiveResult.zones.easy).toBe(progressiveResult.zones.marathon);
  });
});