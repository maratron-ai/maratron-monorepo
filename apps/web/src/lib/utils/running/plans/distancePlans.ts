import { generateLongDistancePlan, Unit, TrainingLevel } from "./longDistancePlan";
import { generateShortDistancePlan } from "./shortDistancePlan";
import { customizePlanRuns } from "./customizeRuns";
import type { RunningPlanData, PlannedRun } from "@maratypes/runningPlan";
import type { DayOfWeek } from "@maratypes/basics";

export interface DistancePlanOptions {
  weeks?: number;
  distanceUnit: Unit;
  trainingLevel: TrainingLevel;
  vdot: number;
  startingWeeklyMileage?: number;
  targetPace?: string;
  targetTotalTime?: string;
  runTypeDays?: Partial<Record<PlannedRun["type"], DayOfWeek>>;
  runsPerWeek?: number;
  crossTrainingDays?: number;
}

function toDistance(unit: Unit, milesVal: number, kmVal: number): number {
  return unit === "kilometers" ? kmVal : milesVal;
}

export function generate5kPlan(options: DistancePlanOptions): RunningPlanData {
  const { weeks = 8, distanceUnit, trainingLevel, vdot } = options;
  const dist = toDistance(distanceUnit, 3.1, 5);
  const plan = generateShortDistancePlan(
    weeks,
    dist,
    distanceUnit,
    trainingLevel,
    vdot,
    options.targetPace,
    options.targetTotalTime,
  );
  return options.runsPerWeek
    ? customizePlanRuns(plan, {
        runsPerWeek: options.runsPerWeek,
        crossTrainingDays: options.crossTrainingDays,
      })
    : plan;
}

export function generate10kPlan(options: DistancePlanOptions): RunningPlanData {
  const { weeks = 10, distanceUnit, trainingLevel, vdot } = options;
  const dist = toDistance(distanceUnit, 6.2, 10);
  const plan = generateShortDistancePlan(
    weeks,
    dist,
    distanceUnit,
    trainingLevel,
    vdot,
    options.targetPace,
    options.targetTotalTime,
  );
  return options.runsPerWeek
    ? customizePlanRuns(plan, {
        runsPerWeek: options.runsPerWeek,
        crossTrainingDays: options.crossTrainingDays,
      })
    : plan;
}

export function generateHalfMarathonPlan(options: DistancePlanOptions): RunningPlanData {
  const {
    weeks = 12,
    distanceUnit,
    trainingLevel,
    vdot,
    startingWeeklyMileage,
    targetPace,
    targetTotalTime,
  } = options;
  const dist = toDistance(distanceUnit, 13.1, 21.1);
  const plan = generateLongDistancePlan(
    weeks,
    dist,
    distanceUnit,
    trainingLevel,
    vdot,
    startingWeeklyMileage ?? 0,
    targetPace,
    targetTotalTime,
    options.runTypeDays,
  );
  return options.runsPerWeek
    ? customizePlanRuns(plan, {
        runsPerWeek: options.runsPerWeek,
        crossTrainingDays: options.crossTrainingDays,
      })
    : plan;
}

export function generateClassicMarathonPlan(options: DistancePlanOptions): RunningPlanData {
  const {
    weeks = 16,
    distanceUnit,
    trainingLevel,
    vdot,
    startingWeeklyMileage,
    targetPace,
    targetTotalTime,
  } = options;
  const dist = toDistance(distanceUnit, 26.2, 42.2);
  const plan = generateLongDistancePlan(
    weeks,
    dist,
    distanceUnit,
    trainingLevel,
    vdot,
    startingWeeklyMileage ?? 0,
    targetPace,
    targetTotalTime,
    options.runTypeDays,
  );
  return options.runsPerWeek
    ? customizePlanRuns(plan, {
        runsPerWeek: options.runsPerWeek,
        crossTrainingDays: options.crossTrainingDays,
      })
    : plan;
}

export { generateLongDistancePlan as generateMarathonBasePlan } from "./longDistancePlan";
