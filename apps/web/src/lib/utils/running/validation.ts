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
  trainingWeeks: number
): { isValid: boolean; projectedVDOT: number; message?: string } {
  const goalPaceSec = parseDuration(goalPaceStr);
  const currentCalculatedPaceSec = parseDuration(currentCalculatedPaceStr);
  
  // Calculate expected VDOT after training period
  const projectedVDOT = calculateVDOTProgression(currentVDOT, trainingWeeks);
  
  // Allow goals up to projected VDOT capability  
  const improvementRatio = currentCalculatedPaceSec / goalPaceSec;
  const maxReasonableImprovement = 1.20; // 20% pace improvement over training period
  
  if (improvementRatio > maxReasonableImprovement) {
    return {
      isValid: false,
      projectedVDOT,
      message: `Goal pace (${goalPaceStr}) requires ${((improvementRatio - 1) * 100).toFixed(1)}% improvement, which may be too aggressive for ${trainingWeeks} weeks. Consider a more gradual goal around ${formatPace(currentCalculatedPaceSec / 1.10)}.`
    };
  }
  
  // Goal is achievable
  return {
    isValid: true,
    projectedVDOT,
    message: `Goal pace (${goalPaceStr}) is achievable with consistent training. Expected fitness improvement: VDOT ${currentVDOT.toFixed(1)} → ${projectedVDOT.toFixed(1)}.`
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
  raceMeters: number
): { zones: { easy: string; marathon: string; tempo: string; interval: string }; currentTrainingVDOT: number } {
  const goalPaceSec = parseDuration(goalPaceStr);
  const projectedVDOT = calculateVDOTProgression(currentVDOT, trainingWeeks);
  
  // Calculate progression factor (0 to 1) based on training phase
  const progressionFactor = Math.min(weekNumber / trainingWeeks, 1);
  
  // Interpolate VDOT between current and projected
  const currentTrainingVDOT = currentVDOT + (projectedVDOT - currentVDOT) * progressionFactor;
  
  // Generate pace zones for current training VDOT
  const zones = {
    easy: calculatePaceForVDOT(raceMeters, currentTrainingVDOT, "E"),
    marathon: calculatePaceForVDOT(raceMeters, currentTrainingVDOT, "M"),
    tempo: calculatePaceForVDOT(raceMeters, currentTrainingVDOT, "T"),
    interval: calculatePaceForVDOT(raceMeters, currentTrainingVDOT, "I"),
  };
  
  // In final weeks, adjust marathon pace toward goal if realistic
  if (weekNumber >= trainingWeeks * 0.8) { // Final 20% of training
    const marathonPaceSec = parseDuration(zones.marathon);
    const blendedMarathonPaceSec = marathonPaceSec * 0.7 + goalPaceSec * 0.3;
    zones.marathon = formatPace(blendedMarathonPaceSec);
  }
  
  return { zones, currentTrainingVDOT };
}

/**
 * Helper function to format pace (moved from inline to reusable)
 */
function formatPace(paceSec: number): string {
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Import calculatePaceForVDOT from jackDaniels.ts
import { calculatePaceForVDOT } from "./jackDaniels";

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