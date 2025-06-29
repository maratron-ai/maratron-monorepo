// src/lib/utils/calculateRacePaces.ts
import { riegalCalculator } from "@lib/utils/running/riegalCalculator";

export interface RacePrediction {
  target: string;         // e.g., "5K", "10K", "Half Marathon", "Marathon"
  predictedTime: string;  // Predicted total race time formatted (H:MM:SS or MM:SS)
  pacePerKm: string;      // Predicted pace per kilometer (mm:ss format)
  pacePerMile: string;    // Predicted pace per mile (mm:ss format)
}

/**
 * Formats a given time in seconds into a string.
 * If the time is 3600 seconds (1 hour) or more, it includes hours.
 *
 * @param totalSec - Total time in seconds.
 * @returns Time formatted as H:MM:SS (if >= 3600 sec) or MM:SS.
 */
const formatTime = (totalSec: number): string => {
  if (totalSec >= 3600) {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = Math.round(totalSec % 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.round(totalSec % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
};

/**
 * Uses Riegel's formula to predict race performance for standard distances.
 *
 * @param timeInMinutes - The known race time in minutes.
 * @param distanceKm - The known race distance in kilometers.
 * @param fatigueFactor - The fatigue factor; defaults to 1.06.
 * @returns An array of predictions for 5K, 10K, Half Marathon, and Marathon.
 */
export function calculateRacePaces(
  timeInMinutes: number,
  distanceKm: number,
  fatigueFactor: number = 1.06
): RacePrediction[] {
  // Convert known race time and distance into seconds and meters respectively.
  const knownTimeSec = timeInMinutes * 60;
  const knownDistM = distanceKm * 1000;

  // Define target distances in meters.
  const targets = [
    { target: "5K", dist: 5000 },
    { target: "10K", dist: 10000 },
    { target: "Half Marathon", dist: 21097.5 },
    { target: "Marathon", dist: 42195 },
  ];

  // For each target distance, use Riegel's formula to predict performance.
  const predictions = targets.map(({ target, dist }) => {
    const prediction = riegalCalculator(
      knownTimeSec,
      knownDistM,
      dist,
      fatigueFactor
    );
    return {
      target,
      predictedTime: formatTime(prediction.totalTimeSec),
      pacePerKm: prediction.pacePerKm,
      pacePerMile: prediction.pacePerMile,
    };
  });

  return predictions;
}
