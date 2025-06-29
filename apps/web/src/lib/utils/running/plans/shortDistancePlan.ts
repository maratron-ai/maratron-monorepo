import { calculateGoalPaceForVDOT } from "../jackDaniels";
import { parsePace, getPacesFromRacePace } from "../paces";
import { parseDuration } from "@utils/time";
import { WeekPlan, RunningPlanData, PlannedRun } from "@maratypes/runningPlan";

export const Units = ["miles", "kilometers"] as const;
export type Unit = (typeof Units)[number];

export enum TrainingLevel {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
}

const MIN_WEEKS = 4;
const MAX_WEEKS = 16;
const TAPER_WEEKS = 1;

const LONG_RUN_PCT = {
  beginner: { start: 1.0, peak: 1.3 },
  intermediate: { start: 1.2, peak: 1.5 },
  advanced: { start: 1.4, peak: 1.8 },
} as const;

const WEEKLY_MILEAGE_MULT = {
  beginner: { start: 2.0, peak: 3.0 },
  intermediate: { start: 2.5, peak: 4.0 },
  advanced: { start: 3.0, peak: 5.0 },
} as const;

const EASY_PCT = 0.5;
const INTERVAL_PCT = 0.2;
const TEMPO_PCT = 0.22;
const TAPER_FACTOR = 0.7;

const MIN_TEMPO_RATIO = 0.5; // minimum tempo distance as fraction of race

function chooseReps(totalMeters: number) {
  const options = [200, 400, 800, 1000];
  let rep = 400;
  for (const d of options) {
    const reps = Math.round(totalMeters / d);
    if (reps <= 10) {
      rep = d;
      break;
    }
  }
  const reps = Math.max(1, Math.round(totalMeters / rep));
  return { scheme: `${reps}×${rep}m`, totalMeters: reps * rep };
}

export function generateShortDistancePlan(
  weeks: number,
  raceDistance: number,
  distanceUnit: Unit,
  trainingLevel: TrainingLevel,
  vdot: number,
  targetPace?: string,
  targetTotalTime?: string,
): RunningPlanData {
  if (!Number.isInteger(weeks) || weeks < MIN_WEEKS || weeks > MAX_WEEKS)
    throw new Error(
      `Weeks must be an integer between ${MIN_WEEKS} and ${MAX_WEEKS}.`
    );
  if (raceDistance <= 0) throw new Error("Distance must be > 0");
  if (!Units.includes(distanceUnit)) throw new Error("Invalid distance unit");
  if (vdot <= 0) throw new Error("VDOT must be > 0");

  const kmPerMile = 1.60934;
  const toKm = (d: number) =>
    distanceUnit === "miles" ? d * kmPerMile : d;
  const fromKm = (d: number) =>
    distanceUnit === "miles" ? d / kmPerMile : d;
  const toMeters = distanceUnit === "miles" ? 1609.34 : 1000;

  const raceKm = toKm(raceDistance);
  const raceMeters = raceKm * 1000;

  let goalPaceSec = parsePace(calculateGoalPaceForVDOT(raceMeters, vdot));
  if (targetTotalTime) {
    goalPaceSec = parseDuration(targetTotalTime) / raceDistance;
  } else if (targetPace) {
    goalPaceSec = parseDuration(targetPace);
  }

  const { easy: paceE, threshold: paceT, interval: paceI, race: goalPace } =
    getPacesFromRacePace(goalPaceSec);

  const buildWeeks = weeks - TAPER_WEEKS;
  const phases = [
    ...Array(buildWeeks).fill("Build" as const),
    ...Array(TAPER_WEEKS).fill("Taper" as const),
  ];

  const schedule: WeekPlan[] = [];
  const { start: SM, peak: PM } = WEEKLY_MILEAGE_MULT[trainingLevel];
  const { start: LS, peak: LP } = LONG_RUN_PCT[trainingLevel];

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const roundToHalf = (n: number): number => Math.round(n * 2) / 2;

  for (let w = 1; w <= weeks; w++) {
    const phase = phases[w - 1];
    let weeklyMileageKm: number;
    if (phase === "Build") {
      const ratio = buildWeeks === 1 ? 1 : (w - 1) / (buildWeeks - 1);
      weeklyMileageKm = raceKm * (SM + (PM - SM) * ratio);
    } else {
      weeklyMileageKm = raceKm * PM;
    }
    if (phase === "Taper") {
      weeklyMileageKm *= TAPER_FACTOR;
    }
    weeklyMileageKm = round1(weeklyMileageKm);

    const easyKmTotal = weeklyMileageKm * EASY_PCT;
    const easyKmSplit = easyKmTotal / 2;
    let intervalKm = weeklyMileageKm * INTERVAL_PCT;
    let tempoKm = weeklyMileageKm * TEMPO_PCT;
    if (phase !== "Taper") {
      tempoKm = Math.max(tempoKm, raceKm * MIN_TEMPO_RATIO);
    }
    intervalKm = Math.min(intervalKm, raceKm);
    tempoKm = Math.min(tempoKm, raceKm);

    const longPct =
      phase === "Build"
        ? LS + (LP - LS) * ((w - 1) / (buildWeeks - 1))
        : LP;
    let longKm = raceKm * longPct;
    const MAX_LONG_PCT = 1.5;
    if (longKm > raceKm * MAX_LONG_PCT) {
      longKm = raceKm * MAX_LONG_PCT;
    }
    if (phase === "Taper") {
      longKm *= TAPER_FACTOR;
    }

    const intervalReps = chooseReps(intervalKm * 1000);
    let runs: PlannedRun[] = [
      {
        type: "easy",
        day: "Monday",
        unit: distanceUnit,
        mileage: round1(fromKm(easyKmSplit)),
        targetPace: { unit: distanceUnit, pace: paceE },
      },
      {
        type: "interval",
        day: "Wednesday",
        unit: distanceUnit,
        mileage: round1(intervalReps.totalMeters / toMeters),
        targetPace: { unit: distanceUnit, pace: paceI },
        notes: `${intervalReps.scheme} @ I-pace`,
      },
      {
        type: "easy",
        day: "Thursday",
        unit: distanceUnit,
        mileage: round1(fromKm(easyKmSplit)),
        targetPace: { unit: distanceUnit, pace: paceE },
      },
      {
        type: "tempo",
        day: "Saturday",
        unit: distanceUnit,
        mileage: round1(fromKm(tempoKm)),
        targetPace: { unit: distanceUnit, pace: paceT },
        notes: `${tempoKm.toFixed(1)} km @ T-pace`,
      },
      {
        type: "long",
        day: "Sunday",
        unit: distanceUnit,
        mileage: roundToHalf(fromKm(longKm)),
        targetPace: { unit: distanceUnit, pace: paceE },
        notes: `${longKm.toFixed(1)} km @ E-pace`,
      },
    ];

    if (w === weeks) {
      runs = [
        {
          type: "race",
          day: runs[runs.length - 1].day,
          unit: distanceUnit,
          mileage: round1(fromKm(raceKm)),
          targetPace: { unit: distanceUnit, pace: goalPace },
        },
      ];
    }

    const weeklyMileage = round1(runs.reduce((tot, r) => tot + r.mileage, 0));

    const finalLabel = raceKm >= 10 ? "10K Week!" : "5K Week!";
    schedule.push({
      weekNumber: w,
      phase,
      unit: distanceUnit,
      weeklyMileage,
      runs,
      notes:
        w === weeks
          ? finalLabel
          : phase === "Taper"
          ? "Taper week"
          : "Build week",
    });
  }

  return { weeks, schedule, notes: "Generated by Maratron" };
}
