import { calculatePaceForVDOT } from "../jackDaniels";
import { WeekPlan, RunningPlanData, PlannedRun } from "@maratypes/runningPlan";
import { DayOfWeek } from "@maratypes/basics";
import { formatPace } from "@utils/running/paces";
import { parseDuration } from "@utils/time";
import { validatePaceZones, validateGoalPace, createProgressivePaceZones } from "../validation";

// const formatPace = (sec: number): string => {
//   const m = Math.floor(sec / 60);
//   const s = Math.round(sec % 60);
//   return `${m}:${s.toString().padStart(2, "0")}`;
// };

const MIN_WEEKS = 8;
const TAPER_WEEKS: number = 2;
const EASY_PERCENT = 0.15;
const TEMPO_PERCENT = 0.2;
const WUCD_PERCENT = 0.1; // warm-up/cool-down as fraction of run
const CUTBACK_FREQUENCY = 4;
// Cut back long, tempo and easy runs by roughly 25%
const CUTBACK_RUN_FACTOR = 0.75;

export const Units = ["miles", "kilometers"] as const;
export type Unit = (typeof Units)[number];

export enum TrainingLevel {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
}

const RAW_INTERVAL_WORKOUTS = [
  {
    description: "10×400 m sprints",
    reps: 10,
    distanceMeters: 400,
    notes: "Sprint at I-pace with 60–90 s jog recovery.",
  },
  {
    description: "6×800 m repeats",
    reps: 6,
    distanceMeters: 800,
    notes: "Run at I-pace with equal jog recovery.",
  },
  {
    description: "8×200 m hills",
    reps: 8,
    distanceMeters: 200,
    notes: "Uphill at I-pace, jog downhill.",
  },
  {
    description: "5×1 km repeats",
    reps: 5,
    distanceMeters: 1000,
    notes: "Run at I-pace with 2–3 min recovery.",
  },
] as const;

export interface IntervalWorkout {
  description: string;
  reps: number;
  distanceMeters: number;
  notes: string;
}

// -- Validation to enforce data validity at edges
function validateWorkout(w: Partial<IntervalWorkout>): IntervalWorkout {
  if (!w.description || w.reps! <= 0 || w.distanceMeters! <= 0 || !w.notes) {
    throw new Error(`Invalid workout entry: ${JSON.stringify(w)}`);
  }
  return w as IntervalWorkout;
}
export const INTERVAL_WORKOUTS: readonly IntervalWorkout[] =
  RAW_INTERVAL_WORKOUTS.map((w) => validateWorkout(w));

interface PaceZones {
  easy: string;
  marathon: string;
  tempo: string;
  interval: string;
}

// -- Immutable progression state
export enum TrainingPhase {
  Base = "Base",
  Build = "Build",
  Peak = "Peak",
  Taper = "Taper",
}

interface ProgressionState {
  week: number;
  mileage: number;
  phase: TrainingPhase;
  cutback?: boolean;
}

function computeLinearProgression(
  weeks: number,
  startMileage: number,
  maxMileage: number,
  taperWeeks: number
): ProgressionState[] {
  const progressWeeks = weeks - taperWeeks;

  const baseWeeks = Math.max(1, Math.round(progressWeeks * 0.4));
  const buildWeeks = Math.max(1, Math.round(progressWeeks * 0.4));
  let peakWeeks = progressWeeks - baseWeeks - buildWeeks;
  if (peakWeeks < 1) {
    peakWeeks = 1;
  }

  const states: ProgressionState[] = [];
  for (let i = 0; i < progressWeeks; i++) {
    const ratio = progressWeeks === 1 ? 1 : i / (progressWeeks - 1);
    const baseMileage = startMileage + (maxMileage - startMileage) * ratio;
    const mileage = baseMileage;
    const cutback = (i + 1) % CUTBACK_FREQUENCY === 0;
    // Leave mileage unchanged so progression continues smoothly; runs will be
    // scaled down later when cutback is true
    let phase: TrainingPhase;
    if (i < baseWeeks) phase = TrainingPhase.Base;
    else if (i < baseWeeks + buildWeeks) phase = TrainingPhase.Build;
    else phase = TrainingPhase.Peak;
    states.push({ week: i + 1, mileage, phase, cutback });
  }

  for (let j = 0; j < taperWeeks; j++) {
    const ratio = taperWeeks === 1 ? 1 : j / (taperWeeks - 1);
    const mileage = maxMileage - (maxMileage - startMileage) * ratio;
    states.push({
      week: progressWeeks + j + 1,
      mileage,
      phase: TrainingPhase.Taper,
    });
  }
  return states;
}

export function generateLongDistancePlan(
  weeks: number,
  targetDistance: number,
  distanceUnit: Unit,
  trainingLevel: TrainingLevel,
  vdot: number,
  _startingWeeklyMileage: number,
  targetPace?: string,
  targetTotalTime?: string,
  runTypeDays?: Partial<Record<PlannedRun["type"], DayOfWeek>>
): RunningPlanData {
  if (weeks < MIN_WEEKS) throw new Error(`Plan must be ≥ ${MIN_WEEKS} weeks.`);
  if (targetDistance <= 0) throw new Error("Distance must be > 0");
  if (targetDistance < 13) {
    throw new Error(
      "generateLongDistancePlan is intended for half and full marathons"
    );
  }

  // -- helpers
  const roundToHalf = (n: number): number => Math.round(n * 2) / 2;

  // -- compute goal pace override
  let goalPaceSec: number | undefined;
  if (targetTotalTime) {
    goalPaceSec = parseDuration(targetTotalTime) / targetDistance;
  } else if (targetPace) {
    goalPaceSec = parseDuration(targetPace);
  }

  // -- distance conversions
  const toMeters = distanceUnit === "miles" ? 1609.34 : 1000;
  const raceMeters = targetDistance * toMeters;

  // -- Initialize with current fitness pace zones
  const baseZones: PaceZones = {
    easy: calculatePaceForVDOT(raceMeters, vdot, "E"),
    marathon: calculatePaceForVDOT(raceMeters, vdot, "M"),
    tempo: calculatePaceForVDOT(raceMeters, vdot, "T"),
    interval: calculatePaceForVDOT(raceMeters, vdot, "I"),
  };
  
  // Track whether we're using progressive training
  let usingProgressiveTraining = false;
  let goalValidation: { isValid: boolean; projectedVDOT: number; message?: string } | null = null;
  
  // If user has a goal pace, validate and set up progressive training
  if (goalPaceSec !== undefined) {
    const goalPaceStr = formatPace(goalPaceSec);
    goalValidation = validateGoalPace(goalPaceStr, baseZones.marathon, vdot, weeks);
    
    if (goalValidation.isValid) {
      usingProgressiveTraining = true;
      console.log(`🎯 Progressive training enabled: ${goalValidation.message}`);
    } else {
      console.warn(`⚠️ Goal pace adjustment: ${goalValidation.message}`);
      // Still allow the goal but warn user
    }
  }
  
  // Start with base zones for week 1, will be updated per week if progressive
  let zones = { ...baseZones };
  if (goalPaceSec !== undefined && !usingProgressiveTraining) {
    // Static goal pace override (original behavior for conservative goals)
    zones.marathon = formatPace(goalPaceSec);
  }

  // -- validate pace zone relationships for initial zones
  validatePaceZones(zones, vdot);
  
  // Get tempo pace in seconds for calculations (after validation passes)
  const tempoSecNum = parseDuration(zones.tempo);

  // -- weekly mileage bounds
  const isHalfMarathon =
    (distanceUnit === "miles" && targetDistance <= 13.2) ||
    (distanceUnit === "kilometers" && targetDistance <= 21.2);

  const levelBounds = isHalfMarathon
    ? {
        [TrainingLevel.Beginner]: { startMult: 1.0, endMult: 1.7 },
        [TrainingLevel.Intermediate]: { startMult: 1.1, endMult: 1.9 },
        [TrainingLevel.Advanced]: { startMult: 1.2, endMult: 2.1 },
      }
    : {
        [TrainingLevel.Beginner]: { startMult: 1.0, endMult: 1.4 },
        [TrainingLevel.Intermediate]: { startMult: 1.1, endMult: 1.5 },
        [TrainingLevel.Advanced]: { startMult: 1.2, endMult: 1.6 },
      } as const;

  const bounds = levelBounds[trainingLevel] || levelBounds[TrainingLevel.Beginner];
  const { startMult, endMult } = bounds;

  const startMileage = targetDistance * startMult;
  const maxMileage = targetDistance * endMult;

  const longBounds = {
    [TrainingLevel.Beginner]: { startPct: 0.4, peakPct: 0.65 },
    [TrainingLevel.Intermediate]: { startPct: 0.5, peakPct: 0.75 },
    [TrainingLevel.Advanced]: { startPct: 0.6, peakPct: 0.85 },
  } as const;

  const { startPct, peakPct } = longBounds[trainingLevel];
  const initialLong = targetDistance * startPct;
  const peakLong = targetDistance * peakPct;
  const weekOneLong = initialLong;

  const progression = computeLinearProgression(
    weeks,
    startMileage,
    maxMileage,
    TAPER_WEEKS
  );

  const progressWeeks = weeks - TAPER_WEEKS;

  const schedule: WeekPlan[] = progression.map(({ week, mileage, phase, cutback }) => {
    // Update pace zones for progressive training
    let currentZones = zones;
    if (usingProgressiveTraining && goalPaceSec !== undefined) {
      const goalPaceStr = formatPace(goalPaceSec);
      const progressiveResult = createProgressivePaceZones(
        vdot,
        goalPaceStr,
        weeks,
        week,
        raceMeters
      );
      currentZones = progressiveResult.zones;
      
      // Log progression for debugging
      if (week === 1 || week === Math.floor(weeks / 2) || week === weeks) {
        console.log(`📈 Week ${week} pace zones (VDOT ${progressiveResult.currentTrainingVDOT.toFixed(1)}): M=${currentZones.marathon}, T=${currentZones.tempo}`);
      }
    }

    // Long-run progression logic
    let longDist: number;
    if (week > progressWeeks) {
      const taperIndex = week - progressWeeks - 1;
      const ratio = TAPER_WEEKS === 1 ? 1 : taperIndex / (TAPER_WEEKS - 1);
      longDist = peakLong - (peakLong - targetDistance) * ratio;
      if (longDist > weekOneLong) longDist = weekOneLong;
    } else {
      const ratio =
        progressWeeks === 1 ? 1 : (week - 1) / (progressWeeks - 1);
      longDist = initialLong + (peakLong - initialLong) * ratio;
    }
    longDist = roundToHalf(longDist);

    // Interval workout with rep-specific pace
    const workout = INTERVAL_WORKOUTS[(week - 1) % INTERVAL_WORKOUTS.length];
    const intervalMileage = roundToHalf(
      (workout.reps * workout.distanceMeters) / toMeters
    );
    const baseIntervalPaceSec = parseDuration(currentZones.interval);
    const repDistanceUnits = workout.distanceMeters / toMeters;
    const repPaceSec = baseIntervalPaceSec * repDistanceUnits;
    const repPace = formatPace(repPaceSec);
    let intervalNotes = `${workout.description} – ${workout.notes}`;
    intervalNotes += ` Each ${workout.distanceMeters}m in ~${repPace}`;
    if (workout.description.toLowerCase().includes("sprint")) {
      intervalNotes += `; total sprint distance: ${intervalMileage} ${distanceUnit}.`;
    }

    // Easy & tempo runs
    let easyMileage = roundToHalf(mileage * EASY_PERCENT);
    let tempoMileage = roundToHalf(mileage * TEMPO_PERCENT);
    let adjustedLong = longDist;
    if (cutback) {
      easyMileage = roundToHalf(easyMileage * CUTBACK_RUN_FACTOR);
      tempoMileage = roundToHalf(tempoMileage * CUTBACK_RUN_FACTOR);
      adjustedLong = roundToHalf(longDist * CUTBACK_RUN_FACTOR);
    }
    const tempoNotes = `Tempo at T-pace (${
      currentZones.tempo
    }) for ${tempoMileage} ${distanceUnit}, plus ${WUCD_PERCENT * 100}% WU/CD`;

    let runs: PlannedRun[];
    if (week === weeks) {
      runs = [
        {
          type: "marathon",
          unit: distanceUnit,
          mileage: roundToHalf(targetDistance),
          targetPace: { unit: distanceUnit, pace: currentZones.marathon },
        },
      ];
    } else {
      runs = [
        {
          type: "easy",
          unit: distanceUnit,
          mileage: easyMileage,
          targetPace: { unit: distanceUnit, pace: currentZones.easy },
        },
        {
          type: "interval",
          unit: distanceUnit,
          mileage: intervalMileage,
          targetPace: { unit: distanceUnit, pace: currentZones.interval },
          notes: intervalNotes,
        },
        {
          type: "tempo",
          unit: distanceUnit,
          mileage: tempoMileage,
          targetPace: { unit: distanceUnit, pace: currentZones.tempo },
          notes: tempoNotes,
        },
        {
          type: "long",
          unit: distanceUnit,
          mileage: adjustedLong,
          targetPace: { unit: distanceUnit, pace: currentZones.marathon },
        },
      ];
    }

    const weeklyMileage = roundToHalf(runs.reduce((tot, r) => tot + r.mileage, 0));

    const finalLabel = isHalfMarathon ? "Half Marathon Week!" : "Marathon Week!";
    const notes =
      week === weeks
        ? finalLabel
        : `${phase} phase${cutback ? " - Cutback" : ""}`;

    return {
      weekNumber: week,
      weeklyMileage,
      unit: distanceUnit,
      runs,
      phase,
      notes,
    };
  });

  const finalSchedule = runTypeDays
    ? schedule.map((week) => ({
        ...week,
        runs: week.runs.map((r) =>
          runTypeDays[r.type] ? { ...r, day: runTypeDays[r.type]! } : r
        ),
      }))
    : schedule;

  return { weeks, schedule: finalSchedule, notes: "Generated by Maratron" };
}
