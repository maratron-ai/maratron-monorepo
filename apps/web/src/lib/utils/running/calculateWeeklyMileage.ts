export function calculateWeeklyMileage(
  currentWeek: number,
  totalWeeks: number,
  peakMileage: number
): number {
  const baseWeeks = Math.floor(totalWeeks * 0.4);
  const buildWeeks = Math.floor(totalWeeks * 0.3);
  const peakWeeks = Math.floor(totalWeeks * 0.2);
  const taperWeeks = totalWeeks - (baseWeeks + buildWeeks + peakWeeks);

  if (currentWeek <= baseWeeks) {
    // Base phase: mileage increases from 50% to 70% of peak
    const progress = currentWeek / baseWeeks;
    return Math.round(peakMileage * (0.5 + 0.2 * progress));
  } else if (currentWeek <= baseWeeks + buildWeeks) {
    // Build phase: increases from 70% to 90%
    const progress = (currentWeek - baseWeeks) / buildWeeks;
    return Math.round(peakMileage * (0.7 + 0.2 * progress));
  } else if (currentWeek <= baseWeeks + buildWeeks + peakWeeks) {
    // Peak phase: maintain peak mileage
    return peakMileage;
  } else {
    // Taper phase: mileage reduces from 80% down to 50%
    const taperProgress =
      (currentWeek - baseWeeks - buildWeeks - peakWeeks) / taperWeeks;
    return Math.round(peakMileage * (0.8 - 0.3 * taperProgress));
  }
}
