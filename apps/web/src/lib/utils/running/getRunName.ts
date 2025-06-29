import type { Run } from "@maratypes/run";

export const getRunName = (run: Pick<Run, 'date' | 'trainingEnvironment'>): string => {
  const dt = new Date(run.date);
  const datePart = dt.toLocaleDateString();
  const timePart = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const env = run.trainingEnvironment ?? 'run';
  return `${datePart} ${timePart} - ${env}`.trim();
};
