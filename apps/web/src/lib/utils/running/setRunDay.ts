import { RunningPlanData, PlannedRun } from "@maratypes/runningPlan";
import { DayOfWeek } from "@maratypes/basics";

export function setDayForRunType(
  plan: RunningPlanData,
  type: PlannedRun["type"],
  day: DayOfWeek
): RunningPlanData {
  const schedule = plan.schedule.map((week) => ({
    ...week,
    runs: week.runs.map((run) =>
      run.type === type ? { ...run, day } : run
    ),
  }));
  return { ...plan, schedule };
}
