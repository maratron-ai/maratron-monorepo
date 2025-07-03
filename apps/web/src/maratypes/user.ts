import { DayOfWeek, DistanceUnit, ElevationUnit } from "./basics";
import { Shoe } from "./shoe"; // Import your shoe type
import { TrainingEnvironment } from "./basics";
import type { CoachPersona } from "./coach";

export enum TrainingLevel {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
}

export type Device =
  | "Garmin"
  | "Polar"
  | "Suunto"
  | "Fitbit"
  | "AppleWatch"
  | "SamsungGalaxyWatch"
  | "Coros"
  | "Other";

export type Gender = "Male" | "Female" | "Other";

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: Gender;
  trainingLevel?: TrainingLevel;
  VDOT?: number;
  goals?: string[];
  avatarUrl?: string;
  yearsRunning?: number;
  weeklyMileage?: number;
  height?: number;
  weight?: number;
  injuryHistory?: string;
  preferredTrainingDays?: DayOfWeek[];
  preferredTrainingEnvironment?: TrainingEnvironment;
  device?: Device;

  // Preferred/default units
  defaultDistanceUnit?: DistanceUnit;
  defaultElevationUnit?: ElevationUnit;

  shoes?: Shoe[];
  defaultShoeId?: string;

  // Coach persona
  selectedCoachId?: string;
  selectedCoach?: CoachPersona | null; // Will be populated with CoachPersona when included

  createdAt?: Date;
  updatedAt?: Date;
}
