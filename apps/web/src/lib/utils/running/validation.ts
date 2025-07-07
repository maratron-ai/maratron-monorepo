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
 * Parse duration string to seconds - helper function for validation
 */
function parseDuration(durationStr: string): number {
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // mm:ss format
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss format
  }
  throw new RunningValidationError(`Invalid duration format: ${durationStr}`, 'INVALID_DURATION_FORMAT');
}