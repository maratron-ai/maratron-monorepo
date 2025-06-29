import { RunningPlanData, PlannedRun } from "@maratypes/runningPlan";

export interface CustomizeOptions {
  runsPerWeek: number;
  crossTrainingDays?: number;
}

export function customizePlanRuns(
  plan: RunningPlanData,
  { runsPerWeek, crossTrainingDays = 0 }: CustomizeOptions,
): RunningPlanData {
  if (runsPerWeek < 2 || runsPerWeek > 5) {
    throw new Error("runsPerWeek must be between 2 and 5");
  }

  if (crossTrainingDays < 0) {
    throw new Error("crossTrainingDays cannot be negative");
  }

  if (runsPerWeek + crossTrainingDays > 7) {
    throw new Error("Total workout days cannot exceed 7 per week");
  }

  const schedule = plan.schedule.map((week, idx) => {
    if (week.runs.length <= 1) {
      const runs = [...week.runs];
      for (let i = 0; i < crossTrainingDays; i++) {
        runs.splice(runs.length - 1, 0, {
          type: "cross",
          unit: week.unit,
          mileage: 0,
          targetPace: { unit: week.unit, pace: "" },
          notes: "Cross training",
        });
      }
      return { ...week, runs };
    }

    const easyRuns = week.runs.filter((r) => r.type === "easy");
    const longRun = week.runs.find((r) => r.type === "long" || r.type === "marathon");
    const tempoRun = week.runs.find((r) => r.type === "tempo");
    const intervalRun = week.runs.find((r) => r.type === "interval");

    const runs: PlannedRun[] = [];

    switch (runsPerWeek) {
      case 5:
        if (easyRuns[0]) runs.push(easyRuns[0]);
        if (easyRuns[1]) runs.push(easyRuns[1]);
        else if (easyRuns[0]) runs.push({ ...easyRuns[0] });
        if (tempoRun) runs.push(tempoRun);
        if (intervalRun) runs.push(intervalRun);
        if (longRun) runs.push(longRun);
        break;
      case 4:
        if (easyRuns[0]) runs.push(easyRuns[0]);
        if (tempoRun) runs.push(tempoRun);
        if (intervalRun) runs.push(intervalRun);
        if (longRun) runs.push(longRun);
        break;
      case 3:
        if (easyRuns[0]) runs.push(easyRuns[0]);
        if (longRun) runs.push(longRun);
        const alt3 = idx % 2 === 0 ? intervalRun : tempoRun;
        if (alt3) runs.push(alt3);
        break;
      case 2:
        if (longRun) runs.push(longRun);
        const alt2 = idx % 2 === 0 ? intervalRun : tempoRun;
        if (alt2) runs.push(alt2);
        break;
    }

    const longIndex = runs.findIndex((r) => r.type === "long" || r.type === "marathon");
    const insertAt = longIndex === -1 ? runs.length : longIndex;
    for (let i = 0; i < crossTrainingDays; i++) {
      runs.splice(insertAt, 0, {
        type: "cross",
        unit: week.unit,
        mileage: 0,
        targetPace: { unit: week.unit, pace: "" },
        notes: "Cross training",
      });
    }

    const weeklyMileage = runs.reduce((tot, r) => tot + (r.mileage || 0), 0);

    let notes = week.notes;
    if (runsPerWeek < 4 && notes) {
      notes = notes.replace(/\s*-?\s*Cutback\b/i, "").trim();
    }

    return { ...week, runs, weeklyMileage, notes };
  });

  return { ...plan, schedule };
}
