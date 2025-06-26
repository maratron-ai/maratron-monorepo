// @maratypes/runningPlan.ts

import { Pace } from "./run";
import { DistanceUnit, DayOfWeek } from "@maratypes/basics";

export type TrainingPhase = "Base" | "Build" | "Peak" | "Taper";


// main type
export interface RunningPlan {
  id?: string;
  userId: string;
  name: string;
  planData: RunningPlanData; // Use the renamed type here.
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlannedRun {
  type:
    | "easy"
    | "tempo"
    | "interval"
    | "long"
    | "marathon"
    | "race"
    | "cross";
  unit: DistanceUnit;
  targetPace: Pace;
  mileage: number;
  notes?: string;
  day?: DayOfWeek;
  date?: string;
  done?: boolean;
}

export interface WeekPlan {
  weekNumber: number;
  weeklyMileage: number;
  unit: DistanceUnit;
  runs: PlannedRun[];
  phase?: TrainingPhase;
  notes?: string;
  startDate?: string;
  done?: boolean;
}

export interface RunningPlanData {
  weeks: number;
  schedule: WeekPlan[];
  startDate?: string;
  endDate?: string;
  notes?: string;
}
