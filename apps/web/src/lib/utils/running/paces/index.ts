export function parsePace(pace: string): number {
  const [min, sec] = pace.split(":").map(Number);
  return min * 60 + sec;
}

export function formatPace(seconds: number): string {
  const interval = 15;
  const rounded = Math.round(seconds / interval) * interval;
  const m = Math.floor(rounded / 60);
  const s = Math.round(rounded % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// this is only for short distance plans... just generic for now
export function getPacesFromRacePace(racePaceSec: number) {
  return {
    easy: formatPace(racePaceSec * 1.25),
    marathon: formatPace(racePaceSec * 1.05),
    threshold: formatPace(racePaceSec * 0.95),
    interval: formatPace(racePaceSec * 0.9),
    race: formatPace(racePaceSec),
  };
}