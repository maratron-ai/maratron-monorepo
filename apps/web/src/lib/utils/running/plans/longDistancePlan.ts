import { calculatePaceForVDOT } from "../jackDaniels";
import { WeekPlan, RunningPlanData, PlannedRun } from "@maratypes/runningPlan";
import { DayOfWeek } from "@maratypes/basics";
import { TrainingLevel } from "@maratypes/user";
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
// Fixed volume distribution for proper 80/20 training
const EASY_PERCENT = 0.65;  // 65% easy running (80/20 principle)
const TEMPO_PERCENT = 0.15; // 15% tempo work (quality work)
const WUCD_PERCENT = 0.1; // warm-up/cool-down as fraction of run
const CUTBACK_FREQUENCY = 4;
// Cut back long, tempo and easy runs by roughly 25%
const CUTBACK_RUN_FACTOR = 0.75;

export const Units = ["miles", "kilometers"] as const;
export type Unit = (typeof Units)[number];

/**
 * Creates goal-oriented pace zones based on goal marathon pace
 * Follows industry standards for pace relationships
 */
function createGoalOrientedZones(goalPaceSec: number, currentVDOT: number, raceMeters: number): PaceZones {
  const goalPaceStr = formatPace(goalPaceSec);
  
  // Calculate goal-oriented zones following industry standards
  const easyPaceSec = goalPaceSec + 105; // Goal + 1:45 (middle of 1:30-2:00 range)
  const tempoPaceSec = goalPaceSec - 22; // Goal - 22s (middle of 15-30s faster range)
  const intervalPaceSec = tempoPaceSec - 30; // 30s faster than tempo
  
  // Get current fitness zones for validation
  const currentEasy = parseDuration(calculatePaceForVDOT(raceMeters, currentVDOT, "E"));
  const currentTempo = parseDuration(calculatePaceForVDOT(raceMeters, currentVDOT, "T"));
  const currentInterval = parseDuration(calculatePaceForVDOT(raceMeters, currentVDOT, "I"));
  
  // Ensure goal-oriented zones don't exceed current fitness capabilities by too much
  // Allow up to 30s improvement from current fitness for progressive goals
  const maxEasyImprovement = 30;
  const maxTempoImprovement = 45;
  const maxIntervalImprovement = 60;
  
  const adjustedEasy = Math.min(easyPaceSec, currentEasy + maxEasyImprovement);
  const adjustedTempo = Math.min(tempoPaceSec, currentTempo + maxTempoImprovement);
  const adjustedInterval = Math.min(intervalPaceSec, currentInterval + maxIntervalImprovement);
  
  return {
    easy: formatPace(adjustedEasy),
    marathon: goalPaceStr,
    tempo: formatPace(adjustedTempo),
    interval: formatPace(adjustedInterval)
  };
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

  // -- Initialize with goal-oriented pace zones
  let baseZones: PaceZones;
  let usingProgressiveTraining = false;
  let goalValidation: { isValid: boolean; projectedVDOT: number; message?: string } | null = null;
  
  if (goalPaceSec !== undefined) {
    const goalPaceStr = formatPace(goalPaceSec);
    const currentMarathonPace = calculatePaceForVDOT(raceMeters, vdot, "M");
    goalValidation = validateGoalPace(goalPaceStr, currentMarathonPace, vdot, weeks);
    
    if (goalValidation.isValid) {
      usingProgressiveTraining = true;
      console.log(`🎯 Progressive training enabled: ${goalValidation.message}`);
    } else {
      console.warn(`⚠️ Goal pace adjustment: ${goalValidation.message}`);
    }
    
    // Create goal-oriented base zones regardless of validation
    baseZones = createGoalOrientedZones(goalPaceSec, vdot, raceMeters);
  } else {
    // No goal pace provided - use current fitness zones
    baseZones = {
      easy: calculatePaceForVDOT(raceMeters, vdot, "E"),
      marathon: calculatePaceForVDOT(raceMeters, vdot, "M"),
      tempo: calculatePaceForVDOT(raceMeters, vdot, "T"),
      interval: calculatePaceForVDOT(raceMeters, vdot, "I"),
    };
  }
  
  // Start with base zones for week 1, will be updated per week if progressive
  let zones = { ...baseZones };

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
    [TrainingLevel.Beginner]: { startPct: 0.45, peakPct: 0.78 },    // 12 → 20.5 miles for marathon
    [TrainingLevel.Intermediate]: { startPct: 0.48, peakPct: 0.82 }, // 12.5 → 21.5 miles for marathon  
    [TrainingLevel.Advanced]: { startPct: 0.52, peakPct: 0.87 },     // 13.5 → 23 miles for marathon
  } as const;

  // Safe lookup with fallback to Beginner level
  const longBoundsForLevel = longBounds[trainingLevel] || longBounds[TrainingLevel.Beginner];
  const { startPct, peakPct } = longBoundsForLevel;
  const initialLong = targetDistance * startPct;
  const peakLong = targetDistance * peakPct;
  const weekOneLong = initialLong;

  // Proper 2-week taper: peak at week 13 for 16-week plan, then 2-week taper (weeks 14-15)
  const targetTaperWeeks = 3; // Include week 14 and 15 as taper, week 16 as race
  const progressWeeks = weeks - targetTaperWeeks; // Build phase ends 3 weeks before race (week 13 is peak)
  const actualTaperWeeks = 2; // Only 2 actual taper weeks (14, 15)

  const progression = computeLinearProgression(
    weeks,
    startMileage,
    maxMileage,
    targetTaperWeeks
  );

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
        raceMeters,
        trainingLevel
      );
      currentZones = progressiveResult.zones;
      
      // Log progression for debugging
      if (week === 1 || week === Math.floor(weeks / 2) || week === weeks) {
        console.log(`📈 Week ${week} pace zones (VDOT ${progressiveResult.currentTrainingVDOT.toFixed(1)}): M=${currentZones.marathon}, T=${currentZones.tempo}`);
      }
    }

    // Dual stress prevention: Check if pace changed from previous week
    let paceChanged = false;
    let previousLongDist = week === 1 ? weekOneLong : null;
    if (week > 1) {
      // Get previous week's marathon pace for comparison
      if (usingProgressiveTraining && goalPaceSec !== undefined) {
        const goalPaceStr = formatPace(goalPaceSec);
        const prevProgressiveResult = createProgressivePaceZones(
          vdot,
          goalPaceStr,
          weeks,
          week - 1,
          raceMeters,
          trainingLevel
        );
        const prevPace = prevProgressiveResult.zones.marathon;
        paceChanged = currentZones.marathon !== prevPace;
        
        // Get previous week's long run distance for comparison
        const prevWeekIndex = week - 2; // Array is 0-indexed
        if (prevWeekIndex >= 0 && progression[prevWeekIndex]) {
          // Calculate what previous week's long distance would have been
          if (week - 1 > progressWeeks) {
            // Previous week was in taper
            const taperIndex = (week - 1) - progressWeeks - 1;
            const taperMultipliers = [0.90, 0.75, 0.65];
            const taperWeek = Math.min(taperIndex, taperMultipliers.length - 1);
            previousLongDist = peakLong * taperMultipliers[taperWeek];
          } else {
            // Previous week was in build phase
            const ratio = progressWeeks === 1 ? 1 : ((week - 1) - 1) / (progressWeeks - 1);
            previousLongDist = initialLong + (peakLong - initialLong) * ratio;
          }
          previousLongDist = roundToHalf(previousLongDist);
        }
      }
    }

    // Improved long-run progression logic with dual stress prevention
    let longDist: number;
    if (week > progressWeeks) {
      // 2-week taper phase: strategic reduction for race preparation
      const taperIndex = week - progressWeeks - 1; // 0 for week 14, 1 for week 15, 2 for week 16
      
      if (week === weeks) {
        // Race week: target distance (26.2 miles)
        longDist = targetDistance;
      } else if (taperIndex === 0) {
        // First taper week (week 14 of 16-week plan): moderate reduction to 75% of peak
        // Use 20 miles as reference for consistency (close to actual peak achieved)
        longDist = 20 * 0.75; // 15 miles
        
        // Ensure minimum adequate distance for marathon prep
        longDist = Math.max(longDist, 15);
      } else if (taperIndex === 1) {
        // Second taper week (week 15 of 16-week plan): final taper to 12 miles
        // Strategic reduction for final recovery
        longDist = 12;
      } else {
        // Safety fallback for additional weeks
        longDist = 10;
      }
    } else {
      // Build phase: smooth progression from start to peak
      const ratio = progressWeeks === 1 ? 1 : (week - 1) / (progressWeeks - 1);
      longDist = initialLong + (peakLong - initialLong) * ratio;
    }
    longDist = roundToHalf(longDist);
    
    // Apply comprehensive dual stress prevention (only during build phases, not taper)
    if (paceChanged && previousLongDist !== null && week <= progressWeeks) {
      const distanceIncrease = longDist > previousLongDist;
      const significantDistanceChange = Math.abs(longDist - previousLongDist) >= 0.5;
      
      if (distanceIncrease && significantDistanceChange) {
        // Pace improved and distance would increase significantly - this is dual stress
        // Strategy: Hold distance constant to allow pace adaptation
        longDist = previousLongDist;
        console.log(`🛡️ Week ${week}: Dual stress prevented - holding distance at ${longDist} miles due to pace improvement`);
      } else if (significantDistanceChange && !distanceIncrease) {
        // Distance would decrease with pace improvement - allow this as it's safer (recovery weeks)
        console.log(`✅ Week ${week}: Pace improvement with distance relief (${previousLongDist} → ${longDist} miles)`);
      }
    }
    
    // Alternative dual stress prevention: Delay pace progression if distance must increase (only during build phases)
    if (week > 1 && week <= progressWeeks && previousLongDist !== null) {
      const plannedDistanceIncrease = longDist > previousLongDist && Math.abs(longDist - previousLongDist) >= 0.5;
      
      if (plannedDistanceIncrease && usingProgressiveTraining && goalPaceSec !== undefined) {
        // Check if we're significantly behind on distance progression
        const targetProgressRatio = (week - 1) / (progressWeeks - 1);
        const targetDistance = initialLong + (peakLong - initialLong) * targetProgressRatio;
        const distanceBehind = targetDistance - previousLongDist;
        
        if (distanceBehind >= 1.0) {
          // We're significantly behind on distance - keep pace steady this week
          const goalPaceStr = formatPace(goalPaceSec);
          const prevProgressiveResult = createProgressivePaceZones(
            vdot,
            goalPaceStr,
            weeks,
            week - 1,
            raceMeters,
            trainingLevel
          );
          currentZones.marathon = prevProgressiveResult.zones.marathon;
          console.log(`🎯 Week ${week}: Pace held at ${currentZones.marathon} to allow distance catch-up (${previousLongDist} → ${longDist} miles)`);
        }
      }
    }

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

    // Smart volume distribution ensuring proper 80/20 training
    let adjustedLong = longDist;
    let easyMileage: number;
    let tempoMileage: number;
    
    // Ensure long run never exceeds 40% of weekly volume (except during taper)
    const maxLongRunPercent = 0.40;
    const isTaperWeek = week > progressWeeks;
    if (!isTaperWeek && adjustedLong > mileage * maxLongRunPercent) {
      // Scale weekly mileage up to accommodate long run progression
      const minWeeklyMileage = adjustedLong / maxLongRunPercent;
      const scaledMileage = Math.max(mileage, minWeeklyMileage);
      
      // Recalculate distribution with scaled weekly volume
      const remainingMileage = scaledMileage - adjustedLong - intervalMileage;
      easyMileage = roundToHalf(remainingMileage * EASY_PERCENT / (EASY_PERCENT + TEMPO_PERCENT));
      tempoMileage = roundToHalf(remainingMileage * TEMPO_PERCENT / (EASY_PERCENT + TEMPO_PERCENT));
      
      // Cap easy runs at reasonable levels based on training level
      let maxEasyMileage: number;
      if (trainingLevel === TrainingLevel.Beginner) {
        // Progressive caps for beginners
        if (week <= 4) {
          maxEasyMileage = 4; // Start with 4 miles max in early weeks
        } else if (week <= 8) {
          maxEasyMileage = 5; // Build to 5 miles in mid weeks
        } else {
          maxEasyMileage = targetDistance > 20 ? 6 : 5; // 6 miles max for marathon, 5 for half
        }
      } else {
        maxEasyMileage = targetDistance > 20 ? 8 : 6; // 8 miles for experienced marathon, 6 for half
      }
      easyMileage = Math.min(easyMileage, maxEasyMileage);
    } else if (isTaperWeek) {
      // Taper weeks: significantly reduce volume and intensity
      // Easy runs should be short and truly easy
      easyMileage = 6; // Fixed moderate easy volume for taper
      
      // Tempo runs should be much shorter during taper - just maintaining feel
      if (week === weeks - 2) {
        // First taper week: moderate tempo
        tempoMileage = 3;
      } else {
        // Second taper week: minimal tempo
        tempoMileage = 2;
      }
    } else {
      // Standard distribution: ensure 65% easy, 15% tempo minimum
      const totalTargetMileage = adjustedLong + intervalMileage;
      
      // Progressive easy run minimums based on training level and week
      let minEasyMileage: number;
      if (trainingLevel === TrainingLevel.Beginner) {
        // Beginners start smaller and build up gradually
        if (week <= 4) {
          minEasyMileage = Math.max(3, Math.min(4, mileage * EASY_PERCENT)); // 3-4 miles early weeks
        } else if (week <= 8) {
          minEasyMileage = Math.max(4, Math.min(5, mileage * EASY_PERCENT)); // 4-5 miles mid weeks
        } else {
          minEasyMileage = Math.max(4, Math.min(6, mileage * EASY_PERCENT)); // 4-6 miles later weeks
        }
      } else {
        // Intermediate/Advanced can handle more volume earlier
        minEasyMileage = Math.max(4, mileage * EASY_PERCENT);
      }
      
      const minTempoMileage = Math.max(2, mileage * TEMPO_PERCENT);
      
      // Cap easy runs at reasonable levels based on training level and distance
      let maxEasyMileage: number;
      if (trainingLevel === TrainingLevel.Beginner) {
        maxEasyMileage = targetDistance > 20 ? 6 : 5; // 6 miles max for marathon beginners, 5 for half
      } else {
        maxEasyMileage = targetDistance > 20 ? 8 : 6; // 8 miles for experienced marathon, 6 for half
      }
      minEasyMileage = Math.min(minEasyMileage, maxEasyMileage);
      
      
      // If current distribution meets minimums, use it
      if (totalTargetMileage + minEasyMileage + minTempoMileage <= mileage * 1.05) {
        easyMileage = roundToHalf(minEasyMileage);
        tempoMileage = roundToHalf(minTempoMileage);
      } else {
        // Scale down long run slightly to maintain proper volume distribution
        const availableVolume = mileage - minEasyMileage - minTempoMileage - intervalMileage;
        adjustedLong = Math.min(adjustedLong, availableVolume);
        easyMileage = roundToHalf(minEasyMileage);
        tempoMileage = roundToHalf(minTempoMileage);
      }
    }
    
    // Proper cutback logic: meaningful recovery every 4th week
    if (cutback && week <= progressWeeks) {
      // Apply 20-25% reduction for real recovery benefit
      easyMileage = roundToHalf(easyMileage * 0.75);  // 25% reduction
      tempoMileage = roundToHalf(tempoMileage * 0.8);  // 20% reduction
      adjustedLong = roundToHalf(adjustedLong * 0.8);  // 20% reduction
      console.log(`🔄 Week ${week}: Cutback week - 20-25% volume reduction for recovery`);
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
          targetPace: { unit: distanceUnit, pace: currentZones.marathon },
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
