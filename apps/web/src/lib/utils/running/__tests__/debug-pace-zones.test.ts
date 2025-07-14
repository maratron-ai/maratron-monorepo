import { calculatePaceForVDOT } from "../jackDaniels";

describe('Debug Pace Zone Calculations', () => {
  it('should debug VDOT 30 pace zones for marathon distance', () => {
    console.log('\n🔍 DEBUGGING VDOT 30 PACE ZONES');
    console.log('=================================');
    
    const vdot = 30;
    const marathonMeters = 26.2 * 1609.34; // Marathon in meters
    
    console.log(`VDOT: ${vdot}`);
    console.log(`Distance: ${marathonMeters.toFixed(0)} meters (marathon)`);
    console.log('');
    
    // Test each zone
    const zones = ['E', 'M', 'T', 'I', 'R'] as const;
    
    zones.forEach(zone => {
      const pace = calculatePaceForVDOT(marathonMeters, vdot, zone);
      console.log(`${zone}-pace: ${pace}`);
    });
    
    console.log('\n🎯 EXPECTED vs ACTUAL:');
    console.log('======================');
    console.log('Expected hierarchy (fastest to slowest):');
    console.log('R (Repetition) > I (Interval) > T (Tempo) > M (Marathon) > E (Easy)');
    console.log('');
    
    const paces = zones.map(zone => ({
      zone,
      pace: calculatePaceForVDOT(marathonMeters, vdot, zone),
      seconds: parsePaceToSeconds(calculatePaceForVDOT(marathonMeters, vdot, zone))
    }));
    
    // Sort by pace (fastest first)
    paces.sort((a, b) => a.seconds - b.seconds);
    
    console.log('Actual hierarchy (fastest to slowest):');
    paces.forEach((p, index) => {
      console.log(`${index + 1}. ${p.zone}-pace: ${p.pace} (${p.seconds}s)`);
    });
    
    // Check if hierarchy is correct
    const expectedOrder = ['R', 'I', 'T', 'M', 'E'];
    const actualOrder = paces.map(p => p.zone);
    
    console.log('\n✅ HIERARCHY CHECK:');
    console.log('===================');
    expectedOrder.forEach((zone, index) => {
      const isCorrect = actualOrder[index] === zone;
      console.log(`${index + 1}. ${zone}: ${isCorrect ? '✅' : '❌'} (actual: ${actualOrder[index]})`);
    });
    
    expect(true).toBe(true); // Pass test to show debug info
  });
});

function parsePaceToSeconds(paceStr: string): number {
  const parts = paceStr.split(':');
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds;
}