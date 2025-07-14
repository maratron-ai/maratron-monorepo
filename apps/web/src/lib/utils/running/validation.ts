/**
 * Custom error for running-related validation failures
 */
export class RunningValidationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'RunningValidationError';
  }
}

/**
 * Validates pace zone relationships to ensure they make physiological sense
 */
export function validatePaceZones(zones: {
  easy: string;
  marathon: string;
  tempo: string;
  interval: string;
}, vdot: number): void {
  const easySec = parseDuration(zones.easy);
  const marathonSec = parseDuration(zones.marathon);
  const tempoSec = parseDuration(zones.tempo);
  const intervalSec = parseDuration(zones.interval);

  // Tempo pace should be faster than easy pace
  if (tempoSec >= easySec) {
    throw new RunningValidationError(
      `VDOT ${vdot.toFixed(1)} produces invalid pace zones: Tempo pace (${zones.tempo}) should be faster than easy pace (${zones.easy}). Consider using a more recent race result for accurate VDOT calculation.`,
      'INVALID_TEMPO_PACE'
    );
  }

  // Tempo pace should be faster than marathon pace
  if (tempoSec >= marathonSec) {
    throw new RunningValidationError(
      `VDOT ${vdot.toFixed(1)} produces invalid pace zones: Tempo pace (${zones.tempo}) should be faster than marathon pace (${zones.marathon}). Consider using a more recent race result for accurate VDOT calculation.`,
      'INVALID_TEMPO_MARATHON_RELATIONSHIP'
    );
  }

  // Interval pace should be faster than tempo pace
  if (intervalSec >= tempoSec) {
    throw new RunningValidationError(
      `VDOT ${vdot.toFixed(1)} produces invalid pace zones: Interval pace (${zones.interval}) should be faster than tempo pace (${zones.tempo}). Consider using a more recent race result for accurate VDOT calculation.`,
      'INVALID_INTERVAL_PACE'
    );
  }
}

/**
 * Calculates expected VDOT improvement over a training period
 * Based on Jack Daniels' research: 1-2 VDOT points per quarter for consistent training
 */
export function calculateVDOTProgression(currentVDOT: number, weeks: number): number {
  // Conservative estimate: 1.5 VDOT points per quarter (13 weeks)
  const weeksPerQuarter = 13;
  const vdotImprovementPerQuarter = 1.5;
  
  // Calculate expected improvement over training period
  const expectedImprovement = (weeks / weeksPerQuarter) * vdotImprovementPerQuarter;
  
  // Cap maximum improvement to prevent unrealistic expectations
  const maxImprovement = Math.min(expectedImprovement, 6); // Max 6 VDOT points
  
  return currentVDOT + maxImprovement;
}

/**
 * Validates goal pace is achievable through realistic VDOT progression
 * Allows ambitious but achievable goals based on training adaptation
 */
export function validateGoalPace(
  goalPaceStr: string, 
  currentCalculatedPaceStr: string, 
  currentVDOT: number, 
  trainingWeeks: number,
  raceDistance?: number,
  distanceUnit?: 'miles' | 'kilometers'
): { isValid: boolean; projectedVDOT: number; message?: string } {
  const goalPaceSec = parseDuration(goalPaceStr);
  const currentCalculatedPaceSec = parseDuration(currentCalculatedPaceStr);
  
  // Calculate expected VDOT after training period (for compatibility when race distance not provided)
  const projectedVDOT = calculateVDOTProgression(currentVDOT, trainingWeeks);
  
  // Calculate the VDOT needed to achieve the goal pace
  let targetVDOT = projectedVDOT; // default to progression-based VDOT
  if (raceDistance && distanceUnit) {
    // Convert distance to meters
    const distanceMeters = distanceUnit === 'miles' ? raceDistance * 1609.34 : raceDistance * 1000;
    // Calculate total time for goal pace
    const goalTotalSeconds = goalPaceSec * raceDistance;
    // Calculate VDOT needed for this performance
    targetVDOT = calculateVDOTJackDaniels(distanceMeters, goalTotalSeconds);
  }
  
  // Allow goals up to projected VDOT capability  
  const improvementRatio = currentCalculatedPaceSec / goalPaceSec;
  const maxReasonableImprovement = 1.20; // 20% pace improvement over training period
  
  if (improvementRatio > maxReasonableImprovement) {
    const suggestedPace = formatPace(currentCalculatedPaceSec / 1.10);
    let message: string;
    
    if (raceDistance && distanceUnit) {
      const goalTotalTime = calculateTotalTime(goalPaceStr, raceDistance, distanceUnit);
      const suggestedTotalTime = calculateTotalTime(suggestedPace, raceDistance, distanceUnit);
      message = `${goalPaceStr} pace (${goalTotalTime} total time) might be too ambitious. Try ${suggestedPace} pace (${suggestedTotalTime}) instead.`;
    } else {
      message = `${goalPaceStr} pace might be too ambitious for ${trainingWeeks} weeks. Try ${suggestedPace} pace instead.`;
    }
    
    return {
      isValid: false,
      projectedVDOT: targetVDOT,
      message
    };
  }
  
  // Goal is achievable
  let message: string;
  if (raceDistance && distanceUnit) {
    const totalTime = calculateTotalTime(goalPaceStr, raceDistance, distanceUnit);
    message = `${goalPaceStr} pace (${totalTime} total time) looks good! 🎯`;
  } else {
    message = `${goalPaceStr} pace looks achievable with consistent training! 🎯`;
  }
  
  return {
    isValid: true,
    projectedVDOT: raceDistance && distanceUnit ? targetVDOT : projectedVDOT,
    message
  };
}

/**
 * Creates progressive pace zones that adapt toward goal over training period
 * Starts conservative and gradually approaches goal pace
 */
export function createProgressivePaceZones(
  currentVDOT: number,
  goalPaceStr: string,
  trainingWeeks: number,
  weekNumber: number,
  raceMeters: number,
  trainingLevel: number = 0 // 0=Beginner, 1=Intermediate, 2=Advanced
): { zones: { easy: string; marathon: string; tempo: string; interval: string }; currentTrainingVDOT: number } {
  const goalPaceSec = parseDuration(goalPaceStr);
  const projectedVDOT = calculateVDOTProgression(currentVDOT, trainingWeeks);
  
  // Calculate progression factor (0 to 1) based on training phase
  const progressionFactor = Math.min(weekNumber / trainingWeeks, 1);
  
  // Interpolate VDOT between current and projected
  const currentTrainingVDOT = currentVDOT + (projectedVDOT - currentVDOT) * progressionFactor;
  
  // Calculate dynamic progression cushion based on training level and goal ambition
  const goalTotalSecondsForVDOT = goalPaceSec * (raceMeters / 1609.34);
  const goalVDOTRequired = calculateVDOTJackDaniels(raceMeters, goalTotalSecondsForVDOT);
  const vdotGap = goalVDOTRequired - currentVDOT;
  
  // Base cushion by training level (seconds slower than goal to start)
  const baseCushionByLevel = {
    'Beginner': 90,     // Very conservative start
    'Intermediate': 60, // Moderate start  
    'Advanced': 45      // More aggressive start
  };
  
  // Adjust cushion based on VDOT improvement needed
  const vdotAdjustment = Math.max(0, (vdotGap - 2) * 15); // +15s per VDOT point above 2
  
  // Map training level to cushion
  const levelMapping = ['Beginner', 'Intermediate', 'Advanced'];
  const levelString = levelMapping[trainingLevel] || 'Beginner';
  const baseCushion = baseCushionByLevel[levelString as keyof typeof baseCushionByLevel] || 90;
  const totalCushion = baseCushion + vdotAdjustment;
  
  // Progressive marathon pace: start with calculated cushion, progress to goal pace
  const progressionPaceSec = goalPaceSec + (1 - progressionFactor) * totalCushion;
  const progressionPaceStr = formatPace(progressionPaceSec);
  
  // Calculate goal VDOT to determine target training intensities
  const goalTotalSeconds = goalPaceSec * (raceMeters / 1609.34);
  const goalVDOT = calculateVDOTJackDaniels(raceMeters, goalTotalSeconds);
  
  // Create progressive training zones that blend current fitness with goal-oriented paces
  // For aggressive goals, we need goal-oriented tempo and interval paces to be effective
  const blendFactor = Math.min(progressionFactor * 1.5, 1); // More aggressive blending for tempo/interval
  
  // Blend current fitness VDOT with goal VDOT for training zones
  const trainingVDOTForTempo = currentTrainingVDOT + (goalVDOT - currentTrainingVDOT) * blendFactor;
  const trainingVDOTForInterval = currentTrainingVDOT + (goalVDOT - currentTrainingVDOT) * blendFactor;
  
  // Calculate goal-oriented training paces
  const currentTempo = parseDuration(calculatePaceForVDOT(raceMeters, trainingVDOTForTempo, "T"));
  const currentInterval = parseDuration(calculatePaceForVDOT(raceMeters, trainingVDOTForInterval, "I"));
  
  // Ensure proper pace hierarchy: Interval < Tempo < Marathon/Easy
  const marathonPaceSec = progressionPaceSec;
  
  // Tempo must be faster than marathon pace
  const tempoSec = Math.min(currentTempo, marathonPaceSec - 15); // At least 15s faster than marathon
  
  // Interval must be faster than tempo
  const intervalSec = Math.min(currentInterval, tempoSec - 15); // At least 15s faster than tempo
  
  const zones = {
    easy: progressionPaceStr, // Easy runs = marathon pace for specificity
    marathon: progressionPaceStr,
    tempo: formatPace(tempoSec),
    interval: formatPace(intervalSec),
  };
  
  // In final weeks, adjust marathon pace toward goal if realistic
  if (weekNumber === trainingWeeks) {
    // Race week: Use exact goal pace and calculate VDOT-based zones for consistency
    zones.marathon = goalPaceStr;
    
    // Calculate VDOT needed for goal pace and use it for other zones
    const goalTotalSeconds = goalPaceSec * (raceMeters / 1609.34); // Convert to total race time
    const goalVDOT = calculateVDOTJackDaniels(raceMeters, goalTotalSeconds);
    
    // Recalculate other zones based on goal VDOT to maintain proper relationships
    zones.easy = calculatePaceForVDOT(raceMeters, goalVDOT, "E");
    zones.tempo = calculatePaceForVDOT(raceMeters, goalVDOT, "T");
    zones.interval = calculatePaceForVDOT(raceMeters, goalVDOT, "I");
  } else if (weekNumber >= Math.ceil(trainingWeeks * 0.4)) {
    // Build phase progression: Start at 40% through plan with gradual 15-second improvements
    const marathonPaceSec = parseDuration(zones.marathon);
    const fitnessGap = marathonPaceSec - goalPaceSec;
    
    // Phase-based progression: Start earlier but with smaller, safer increments
    const buildPhaseStart = Math.ceil(trainingWeeks * 0.4); // Week 7 for 16-week plan
    const progressWeeks = weekNumber - buildPhaseStart + 1;
    
    // Calculate target improvement per week (max 15 seconds)
    const totalWeeksToGoal = trainingWeeks - buildPhaseStart;
    const improvementPerWeek = Math.min(15, Math.max(5, fitnessGap / totalWeeksToGoal));
    
    // Progressive improvement: 15-second increments for user-friendly progression
    const totalImprovement = progressWeeks * improvementPerWeek;
    let targetPaceSec = marathonPaceSec - totalImprovement;
    
    // Ensure we don't go faster than goal pace during training
    targetPaceSec = Math.max(targetPaceSec, goalPaceSec + 10); // Stay 10s slower than goal minimum
    
    // For final weeks, allow closer to goal pace
    if (weekNumber >= trainingWeeks - 2) {
      targetPaceSec = Math.max(targetPaceSec, goalPaceSec + 5); // Within 5s of goal in final weeks
    }
    
    zones.marathon = formatPace(targetPaceSec);
    
    // Ensure proper pace zone relationships are maintained after blending
    const marathonSec = parseDuration(zones.marathon);
    const tempoSec = parseDuration(zones.tempo);
    const intervalSec = parseDuration(zones.interval);
    const easySec = parseDuration(zones.easy);
    
    // Fix pace zone relationships if they're physiologically incorrect
    let correctedTempo = tempoSec;
    let correctedInterval = intervalSec;
    
    // Tempo should be faster than marathon pace
    if (tempoSec >= marathonSec) {
      correctedTempo = Math.max(marathonSec - 15, marathonSec * 0.95); // At least 15s or 5% faster
      zones.tempo = formatPace(correctedTempo);
    }
    
    // Interval should be faster than tempo pace  
    if (intervalSec >= correctedTempo) {
      correctedInterval = Math.max(correctedTempo - 15, correctedTempo * 0.95); // At least 15s or 5% faster
      zones.interval = formatPace(correctedInterval);
    }
  }
  
  return { zones, currentTrainingVDOT };
}

/**
 * Helper function to format pace (moved from inline to reusable)
 */
function formatPace(paceSec: number): string {
  const totalSeconds = Math.round(paceSec);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Helper function to calculate total time from pace and distance
 */
function calculateTotalTime(paceStr: string, distance: number, distanceUnit: 'miles' | 'kilometers'): string {
  const paceSeconds = parseDuration(paceStr);
  
  // The pace is already in the correct unit (pace per mile or pace per km)
  // so we just multiply by the distance
  const totalSeconds = paceSeconds * distance;
  
  // Format as h:mm:ss
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

// Import functions from jackDaniels.ts
import { calculatePaceForVDOT, calculateVDOTJackDaniels } from "./jackDaniels";

/**
 * Parse duration string to seconds with robust input validation
 */
function parseDuration(durationStr: string): number {
  if (!durationStr || typeof durationStr !== 'string') {
    throw new RunningValidationError(`Invalid duration: ${durationStr}`, 'INVALID_DURATION_FORMAT');
  }

  // Clean and normalize the input
  const cleaned = durationStr.trim();
  
  // Handle single number case (assume minutes)
  if (/^\d+$/.test(cleaned)) {
    const minutes = parseInt(cleaned, 10);
    if (minutes < 0 || minutes > 600) { // Reasonable bounds: 0-10 hours
      throw new RunningValidationError(`Pace out of reasonable range: ${minutes} minutes`, 'INVALID_PACE_RANGE');
    }
    return minutes * 60; // Convert to seconds
  }

  // Handle mm:ss or hh:mm:ss format
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleaned)) {
    throw new RunningValidationError(`Invalid pace format: ${durationStr}. Use mm:ss format (e.g., "8:30")`, 'INVALID_DURATION_FORMAT');
  }

  const parts = cleaned.split(':').map(Number);
  
  // Validate all parts are valid numbers
  if (parts.some(isNaN)) {
    throw new RunningValidationError(`Invalid pace format: ${durationStr}. Use mm:ss format (e.g., "8:30")`, 'INVALID_DURATION_FORMAT');
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    
    // Validate ranges
    if (minutes < 0 || minutes > 60 || seconds < 0 || seconds >= 60) {
      throw new RunningValidationError(`Invalid pace: ${durationStr}. Minutes should be 0-60, seconds 0-59`, 'INVALID_PACE_RANGE');
    }
    
    return minutes * 60 + seconds; // mm:ss format
  }
  
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    
    // Validate ranges
    if (hours < 0 || hours > 10 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
      throw new RunningValidationError(`Invalid pace: ${durationStr}. Use h:mm:ss format with reasonable values`, 'INVALID_PACE_RANGE');
    }
    
    return hours * 3600 + minutes * 60 + seconds; // hh:mm:ss format
  }

  throw new RunningValidationError(`Invalid pace format: ${durationStr}. Use mm:ss format (e.g., "8:30")`, 'INVALID_DURATION_FORMAT');
}