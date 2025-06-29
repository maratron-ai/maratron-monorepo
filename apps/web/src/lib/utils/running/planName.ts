export type RaceType = "5k" | "10k" | "half" | "full";

const LABELS: Record<RaceType, string> = {
  "5k": "5K",
  "10k": "10K",
  half: "Half Marathon",
  full: "Marathon",
};

export function getDistanceLabel(race: RaceType): string {
  return LABELS[race] || "";
}

export function defaultPlanName(race: RaceType, count: number): string {
  const label = getDistanceLabel(race);
  return `${label} Training Plan ${count}`;
}
