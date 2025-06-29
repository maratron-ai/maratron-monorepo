import { generateLongDistancePlan, TrainingLevel as LongLevel } from "../running/plans/longDistancePlan";
import { generateShortDistancePlan, TrainingLevel as ShortLevel } from "../running/plans/shortDistancePlan";

describe("weeklyMileage totals", () => {
  it("long plan weekly mileage equals sum of runs", () => {
    const plan = generateLongDistancePlan(10, 13.1, "miles", LongLevel.Beginner, 40, 13.1);
    plan.schedule.forEach((week) => {
      const sum = week.runs.reduce((tot, r) => tot + r.mileage, 0);
      const roundHalf = (n: number) => Math.round(n * 2) / 2;
      expect(roundHalf(sum)).toBeCloseTo(week.weeklyMileage, 1);
    });
  });

  it("short plan weekly mileage equals sum of runs", () => {
    const plan = generateShortDistancePlan(8, 6.2, "miles", ShortLevel.Beginner, 40, undefined, undefined);
    plan.schedule.forEach((week) => {
      const sum = week.runs.reduce((tot, r) => tot + r.mileage, 0);
      expect(Number(sum.toFixed(1))).toBeCloseTo(week.weeklyMileage, 1);
    });
  });
});
