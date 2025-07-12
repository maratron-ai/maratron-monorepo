import { generateLongDistancePlan } from '../longDistancePlan';
import { TrainingLevel } from '@maratypes/user';

describe('generateLongDistancePlan', () => {
  const baseParams = {
    weeks: 12,
    targetDistance: 26.2,
    distanceUnit: 'miles' as const,
    vdot: 35,
    _startingWeeklyMileage: 20
  };

  it('should handle all valid training levels', () => {
    // Test all enum values
    const levels = [TrainingLevel.Beginner, TrainingLevel.Intermediate, TrainingLevel.Advanced];
    
    levels.forEach(level => {
      expect(() => {
        generateLongDistancePlan(
          baseParams.weeks,
          baseParams.targetDistance,
          baseParams.distanceUnit,
          level,
          baseParams.vdot,
          baseParams._startingWeeklyMileage
        );
      }).not.toThrow();
    });
  });

  it('should handle undefined training level gracefully', () => {
    expect(() => {
      generateLongDistancePlan(
        baseParams.weeks,
        baseParams.targetDistance,
        baseParams.distanceUnit,
        undefined as any, // Simulate invalid input
        baseParams.vdot,
        baseParams._startingWeeklyMileage
      );
    }).not.toThrow();
  });

  it('should handle invalid training level gracefully', () => {
    expect(() => {
      generateLongDistancePlan(
        baseParams.weeks,
        baseParams.targetDistance,
        baseParams.distanceUnit,
        'invalid' as any, // Simulate invalid input
        baseParams.vdot,
        baseParams._startingWeeklyMileage
      );
    }).not.toThrow();
  });

  it('should generate valid plan with default parameters', () => {
    const plan = generateLongDistancePlan(
      baseParams.weeks,
      baseParams.targetDistance,
      baseParams.distanceUnit,
      TrainingLevel.Beginner,
      baseParams.vdot,
      baseParams._startingWeeklyMileage
    );

    expect(plan).toBeDefined();
    expect(plan.weeks).toBe(baseParams.weeks);
    expect(plan.schedule).toHaveLength(baseParams.weeks);
    expect(plan.schedule[0].runs).toBeDefined();
    expect(plan.schedule[0].runs.length).toBeGreaterThan(0);
  });

  it('should reject plans for distances under 13 miles', () => {
    expect(() => {
      generateLongDistancePlan(
        baseParams.weeks,
        10, // Too short for long distance plan
        baseParams.distanceUnit,
        TrainingLevel.Beginner,
        baseParams.vdot,
        baseParams._startingWeeklyMileage
      );
    }).toThrow('generateLongDistancePlan is intended for half and full marathons');
  });

  it('should reject plans with too few weeks', () => {
    expect(() => {
      generateLongDistancePlan(
        6, // Too few weeks
        baseParams.targetDistance,
        baseParams.distanceUnit,
        TrainingLevel.Beginner,
        baseParams.vdot,
        baseParams._startingWeeklyMileage
      );
    }).toThrow('Plan must be ≥ 8 weeks');
  });
});