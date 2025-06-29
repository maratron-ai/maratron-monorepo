/**
 * Predicts race time for a new distance using Riegel's formula.
 *
 * @param knownTimeSec - The known race time in seconds.
 * @param knownDistM - The known race distance in meters.
 * @param newDistM - The target race distance in meters.
 * @param fatigueFactor - (Optional) The fatigue factor; defaults to 1.06.
 *
 * @returns {Object} An object containing:
 * @property {number} totalTimeSec - Predicted total race time in seconds.
 * @property {string} pacePerKm - Predicted pace per kilometer (mm:ss format).
 * @property {string} pacePerMile - Predicted pace per mile (mm:ss format).
 */

export const riegalCalculator = (
  knownTimeSec: number,
  knownDistM: number,
  newDistM: number,
  fatigueFactor: number = 1.06
): { totalTimeSec: number; pacePerKm: string; pacePerMile: string } => {
  const totalTimeSec =
    knownTimeSec * Math.pow(newDistM / knownDistM, fatigueFactor);

  const pacePerKmSec = totalTimeSec / (newDistM / 1000); // Pace per kilometer in seconds
  const pacePerMileSec = totalTimeSec / (newDistM / 1609.34); // Pace per mile in seconds

  // mm:ss format
  const formatPace = (paceSec: number): string => {
    const minutes = Math.floor(paceSec / 60);
    const seconds = Math.round(paceSec % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    totalTimeSec: Math.round(totalTimeSec),
    pacePerKm: formatPace(pacePerKmSec),
    pacePerMile: formatPace(pacePerMileSec),
  };
};
