// @maratypes/run.ts

import { DistanceUnit, ElevationUnit, TrainingEnvironment } from "@maratypes/basics";

export interface Run {
  id?: string;
  date: Date; // date and time of run
  duration: string; // Format: HH:MM (or total duration in minutes)
  distance: number;
  distanceUnit: DistanceUnit;
  trainingEnvironment?: TrainingEnvironment;
  name?: string;
  pace?: Pace;
  elevationGain?: number;
  elevationGainUnit?: ElevationUnit;
  notes?: string;

  userId: string; // required ?? should change to optional ??

  shoeId?: string;
}

export interface Pace {
  unit: DistanceUnit; // e.g., "miles" or "kilometers"
  pace: string; // e.g., in mm:ss format per unit
}

export type PaceZone = "E" | "M" | "T" | "I" | "R";
