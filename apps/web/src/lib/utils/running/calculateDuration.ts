export function calculateDurationFromPace(distance: number, pace: string): string {
  const [min, sec] = pace.split(":").map(Number);
  const total = (min * 60 + sec) * distance;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.round(total % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
