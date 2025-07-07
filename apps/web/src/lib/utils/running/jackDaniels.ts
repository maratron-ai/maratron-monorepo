import { formatPace } from "@utils/running/paces";

// Caching for performance optimization
const CACHE_SIZE_LIMIT = 1000;

// Simple memoization utility
function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    
    // LRU eviction: if cache is full, remove oldest entry
    if (cache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  }) as T;
}

// Core VDOT calculation function (not memoized directly to allow for testing)
const calculateVDOTJackDanielsCore = (
  distanceMeters: number,
  timeSeconds: number
): number => {
  if (distanceMeters <= 0 || timeSeconds <= 0) {
    throw new Error("distance and time must be positive");
  }
  
  const timeMinutes = timeSeconds / 60;

  const velocity = distanceMeters / timeMinutes;

  const vo2MaxPercentage =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * Math.pow(velocity, 2);

  let vdot = vo2 / vo2MaxPercentage;

  if (vdot > 100) vdot = 100; // cap VDOT at 100 for practical purposes
  if (vdot < 20) vdot = 20; // minimum VDOT is 20

  return vdot;
};

// Memoized version for performance
export const calculateVDOTJackDaniels = memoize(calculateVDOTJackDanielsCore);

type PaceZone = "E" | "M" | "T" | "I" | "R";

const ZONE_FACTORS: Record<PaceZone, number> = {
  E: 0.7, // easy
  M: 0.88, // marathon
  T: 0.95, // threshold
  I: 1.02, // interval
  R: 1.08, // repetition
};


/**
 * Invert Daniels’ VO₂→pace model for a given zone.
 *
 * @param distanceMeters  Race distance in meters
 * @param targetVDOT      Runner’s VDOT
 * @param zone            One of "E","M","T","I","R"
 * @returns               Pace string "mm:ss" per mile
 */
// Core pace calculation function
const calculatePaceForVDOTCore = (
  distanceMeters: number,
  targetVDOT: number,
  zone: PaceZone
): string => {
  // adjust VO₂ for zone intensity
  const zonalVO2 = targetVDOT * ZONE_FACTORS[zone];

  // binary search bounds on race time (in seconds)
  let low = distanceMeters / 10; // super-fast
  let high = distanceMeters / 1; // super-slow
  let mid = 0;

  for (let i = 0; i < 50; i++) {
    mid = (low + high) / 2;
    const vo2 = calculateVDOTJackDaniels(distanceMeters, mid);
    if (Math.abs(vo2 - zonalVO2) < 0.1) break;
    if (vo2 < zonalVO2) {
      // mid is too slow (VO₂ too low), speed up
      high = mid;
    } else {
      // mid is too fast (VO₂ too high), slow down
      low = mid;
    }
  }

  // convert race time to pace per mile
  const metersPerMile = 1609.34;
  const paceSec = mid / (distanceMeters / metersPerMile);
  return formatPace(paceSec);
};

// Memoized version for performance
export const calculatePaceForVDOT = memoize(calculatePaceForVDOTCore);

/**
 * Predicts race-pace from a VDOT value for the given distance.
 * This is identical to `calculatePaceForVDOT` but without any
 * zone adjustment so the result represents goal pace.
 */
// Core goal pace calculation function
const calculateGoalPaceForVDOTCore = (
  distanceMeters: number,
  targetVDOT: number
): string => {
  let low = distanceMeters / 10;
  let high = distanceMeters;
  let mid = 0;

  for (let i = 0; i < 50; i++) {
    mid = (low + high) / 2;
    const vo2 = calculateVDOTJackDaniels(distanceMeters, mid);
    if (Math.abs(vo2 - targetVDOT) < 0.1) break;
    if (vo2 < targetVDOT) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const metersPerMile = 1609.34;
  const paceSec = mid / (distanceMeters / metersPerMile);
  return formatPace(paceSec);
};

// Memoized version for performance
export const calculateGoalPaceForVDOT = memoize(calculateGoalPaceForVDOTCore);
