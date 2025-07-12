import { 
  calculateVDOTProgression, 
  validateGoalPace, 
  createProgressivePaceZones 
} from '../validation';

describe('Progressive Training System', () => {
  describe('calculateVDOTProgression', () => {
    it('should calculate conservative VDOT improvement over time', () => {
      const currentVDOT = 40;
      const weeks = 16;
      
      const projectedVDOT = calculateVDOTProgression(currentVDOT, weeks);
      
      // 16 weeks = ~1.25 quarters, so ~1.85 VDOT improvement
      expect(projectedVDOT).toBeCloseTo(41.85, 1);
    });

    it('should cap maximum improvement at 6 VDOT points', () => {
      const currentVDOT = 30;
      const weeks = 52; // 1 year
      
      const projectedVDOT = calculateVDOTProgression(currentVDOT, weeks);
      
      // Should cap at 6 points max
      expect(projectedVDOT).toBe(36);
    });

    it('should handle short training periods', () => {
      const currentVDOT = 45;
      const weeks = 6;
      
      const projectedVDOT = calculateVDOTProgression(currentVDOT, weeks);
      
      // 6 weeks = ~0.46 quarters, so ~0.7 VDOT improvement
      expect(projectedVDOT).toBeCloseTo(45.7, 1);
    });
  });

  describe('validateGoalPace', () => {
    it('should validate achievable goal pace', () => {
      const goalPace = '7:45'; // 10% improvement
      const currentCalculatedPace = '8:30'; // 510 seconds
      const currentVDOT = 40;
      const trainingWeeks = 16;
      
      const result = validateGoalPace(goalPace, currentCalculatedPace, currentVDOT, trainingWeeks);
      
      expect(result.isValid).toBe(true);
      expect(result.projectedVDOT).toBeCloseTo(41.85, 1);
      expect(result.message).toContain('7:45 pace looks achievable');
    });

    it('should reject overly aggressive goal pace', () => {
      const goalPace = '6:30'; // 23% improvement - too aggressive
      const currentCalculatedPace = '8:00'; // 480 seconds
      const currentVDOT = 35;
      const trainingWeeks = 12;
      
      const result = validateGoalPace(goalPace, currentCalculatedPace, currentVDOT, trainingWeeks);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('might be too ambitious');
      expect(result.message).toContain('Try 7:16 pace instead');
    });

    it('should suggest more realistic goal for aggressive pace', () => {
      const goalPace = '6:00'; // 25% improvement
      const currentCalculatedPace = '8:00'; // 480 seconds
      const currentVDOT = 40;
      const trainingWeeks = 16;
      
      const result = validateGoalPace(goalPace, currentCalculatedPace, currentVDOT, trainingWeeks);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Try 7:16 pace instead');
    });

    it('should handle edge case where goal matches current pace', () => {
      const goalPace = '8:00';
      const currentCalculatedPace = '8:00';
      const currentVDOT = 45;
      const trainingWeeks = 16;
      
      const result = validateGoalPace(goalPace, currentCalculatedPace, currentVDOT, trainingWeeks);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('8:00 pace looks achievable');
    });
  });

  describe('createProgressivePaceZones', () => {
    const currentVDOT = 40;
    const goalPace = '7:30'; // Ambitious but achievable
    const trainingWeeks = 16;
    const raceMeters = 42164.708; // Marathon distance

    it('should start with conservative pace zones in week 1', () => {
      const { zones, currentTrainingVDOT } = createProgressivePaceZones(
        currentVDOT, 
        goalPace, 
        trainingWeeks, 
        1, 
        raceMeters
      );
      
      // Week 1 should be close to current VDOT (within 0.2 for progression)
      expect(currentTrainingVDOT).toBeCloseTo(currentVDOT, 0);
      
      // Marathon pace should be close to current fitness level
      expect(zones.marathon).toMatch(/^[7-9]:[0-5][0-9]$/);
      expect(zones.tempo).toMatch(/^[6-8]:[0-5][0-9]$/);
      expect(zones.easy).toMatch(/^[8-9]:[0-5][0-9]$/);
      expect(zones.interval).toMatch(/^[6-7]:[0-5][0-9]$/);
    });

    it('should progress toward goal pace by mid-training', () => {
      const midWeek = Math.floor(trainingWeeks / 2);
      const { zones, currentTrainingVDOT } = createProgressivePaceZones(
        currentVDOT, 
        goalPace, 
        trainingWeeks, 
        midWeek, 
        raceMeters
      );
      
      // VDOT should be between current and projected
      expect(currentTrainingVDOT).toBeGreaterThan(currentVDOT);
      expect(currentTrainingVDOT).toBeLessThan(currentVDOT + 2);
      
      // Paces should be getting faster but still realistic for mid-training
      const marathonPaceSec = parseDuration(zones.marathon);
      expect(marathonPaceSec).toBeLessThan(600); // Faster than 10:00
    });

    it('should approach goal pace in final weeks', () => {
      const finalWeek = Math.floor(trainingWeeks * 0.9); // 90% through
      const { zones, currentTrainingVDOT } = createProgressivePaceZones(
        currentVDOT, 
        goalPace, 
        trainingWeeks, 
        finalWeek, 
        raceMeters
      );
      
      // VDOT should be close to projected
      expect(currentTrainingVDOT).toBeGreaterThan(currentVDOT + 1);
      
      // Marathon pace should be blended toward goal (but may not be exact due to blending)
      const marathonPaceSec = parseDuration(zones.marathon);
      const goalPaceSec = parseDuration(goalPace);
      expect(marathonPaceSec).toBeLessThan(goalPaceSec + 60); // Within 60 seconds of goal
    });

    it('should maintain proper pace zone relationships throughout progression', () => {
      const testWeeks = [1, 8, 16];
      
      testWeeks.forEach(week => {
        const { zones } = createProgressivePaceZones(
          currentVDOT, 
          goalPace, 
          trainingWeeks, 
          week, 
          raceMeters
        );
        
        const easySec = parseDuration(zones.easy);
        const marathonSec = parseDuration(zones.marathon);
        const tempoSec = parseDuration(zones.tempo);
        const intervalSec = parseDuration(zones.interval);
        
        // Verify proper pace hierarchy
        expect(intervalSec).toBeLessThan(tempoSec);
        expect(tempoSec).toBeLessThan(marathonSec);
        expect(marathonSec).toBeLessThan(easySec);
      });
    });

    it('should handle edge case with very short training period', () => {
      const shortWeeks = 4;
      const { zones, currentTrainingVDOT } = createProgressivePaceZones(
        currentVDOT, 
        goalPace, 
        shortWeeks, 
        2, 
        raceMeters
      );
      
      // Should still progress but more gradually
      expect(currentTrainingVDOT).toBeGreaterThan(currentVDOT);
      expect(currentTrainingVDOT).toBeLessThan(currentVDOT + 1);
      
      // Should maintain valid pace zones (broader range for short training)
      expect(zones.marathon).toMatch(/^[7-9]:[0-5][0-9]$/);
    });
  });

  describe('Integration with VDOT 30 edge case', () => {
    it('should handle VDOT 30 with ambitious goal pace', () => {
      const currentVDOT = 30;
      const goalPace = '10:00'; // User's ambitious goal
      const currentCalculatedPace = '12:12'; // What VDOT 30 actually produces
      const trainingWeeks = 16;
      
      const validation = validateGoalPace(goalPace, currentCalculatedPace, currentVDOT, trainingWeeks);
      
      // 10:00 vs 12:12 is 18% improvement - should be valid with new system
      expect(validation.isValid).toBe(true);
      expect(validation.message).toContain('10:00 pace looks achievable');
    });

    it('should create progressive zones for VDOT 30 scenario', () => {
      const currentVDOT = 30;
      const goalPace = '10:00';
      const trainingWeeks = 16;
      const raceMeters = 42164.708;
      
      // Test week 1 - should start conservative
      const week1 = createProgressivePaceZones(currentVDOT, goalPace, trainingWeeks, 1, raceMeters);
      
      // Test final week - should approach goal
      const finalWeek = createProgressivePaceZones(currentVDOT, goalPace, trainingWeeks, trainingWeeks, raceMeters);
      
      // Week 1 should be slower than final week
      const week1MarathonSec = parseDuration(week1.zones.marathon);
      const finalMarathonSec = parseDuration(finalWeek.zones.marathon);
      
      expect(week1MarathonSec).toBeGreaterThan(finalMarathonSec);
      
      // Final week should be close to goal
      const goalPaceSec = parseDuration(goalPace);
      expect(finalMarathonSec).toBeLessThan(goalPaceSec + 60); // Within 1 minute of goal
    });
  });
});

// Helper function for parsing pace strings
function parseDuration(durationStr: string): number {
  const parts = durationStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}