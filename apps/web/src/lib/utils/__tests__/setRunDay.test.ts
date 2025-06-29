import { setDayForRunType } from "../running/setRunDay";
import { RunningPlanData } from "@maratypes/runningPlan";

describe("setDayForRunType", () => {
  it("sets day for all runs of given type", () => {
    const plan: RunningPlanData = {
      weeks: 1,
      schedule: [
        {
          weekNumber: 1,
          weeklyMileage: 10,
          unit: "miles",
          runs: [
            {
              type: "easy",
              unit: "miles",
              targetPace: { unit: "miles", pace: "10:00" },
              mileage: 5,
            },
            {
              type: "long",
              unit: "miles",
              targetPace: { unit: "miles", pace: "11:00" },
              mileage: 10,
            },
          ],
        },
      ],
    };
    const result = setDayForRunType(plan, "easy", "Monday");
    expect(result.schedule[0].runs[0].day).toBe("Monday");
    expect(result.schedule[0].runs[1].day).toBeUndefined();
  });
});
