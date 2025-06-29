import { generateLongDistancePlan, TrainingLevel } from "../running/plans/longDistancePlan";

describe("generateLongDistancePlan cutback weeks", () => {
  it("inserts cutback mileage every 4th week", () => {
    const plan = generateLongDistancePlan(
      12,
      13.1,
      "miles",
      TrainingLevel.Beginner,
      40,
      13.1
    );
    const week4 = plan.schedule[3];
    const week5 = plan.schedule[4];
    expect(week4.notes).toContain("Cutback");
    expect(week4.weeklyMileage).toBeLessThan(week5.weeklyMileage);
  });

  it("sets final run as marathon race", () => {
    const weeks = 12;
    const plan = generateLongDistancePlan(
      weeks,
      26.2,
      "miles",
      TrainingLevel.Beginner,
      45,
      26.2
    );
    const lastWeek = plan.schedule[weeks - 1];
    expect(lastWeek.runs).toHaveLength(1);
    const lastRun = lastWeek.runs[0];
    expect(lastRun.type).toBe("marathon");
    expect(lastWeek.notes).toBe("Marathon Week!");
  });

  it("labels half marathon race week", () => {
    const weeks = 10;
    const plan = generateLongDistancePlan(
      weeks,
      13.1,
      "miles",
      TrainingLevel.Beginner,
      40,
      13.1
    );
    const lastWeek = plan.schedule[weeks - 1];
    expect(lastWeek.notes).toBe("Half Marathon Week!");
  });

  it("caps taper long run at week one distance", () => {
    const plan = generateLongDistancePlan(
      12,
      26.2,
      "miles",
      TrainingLevel.Beginner,
      45,
      26.2
    );
    const firstLong = plan.schedule[0].runs.find((r) => r.type === "long")!;
    const taperWeek = plan.schedule[plan.weeks - 2];
    const taperLong = taperWeek.runs.find((r) => r.type === "long")!;
    expect(taperLong.mileage).toBeLessThanOrEqual(firstLong.mileage);
  });

  it("applies run type day mapping", () => {
    const plan = generateLongDistancePlan(
      12,
      26.2,
      "miles",
      TrainingLevel.Beginner,
      45,
      26.2,
      undefined,
      undefined,
      { easy: "Monday" }
    );
    plan.schedule.forEach((week) => {
      week.runs
        .filter((r) => r.type === "easy")
        .forEach((r) => expect(r.day).toBe("Monday"));
    });
  });

  it("rounds long runs to the nearest half unit", () => {
    const plan = generateLongDistancePlan(
      12,
      13.1,
      "miles",
      TrainingLevel.Beginner,
      40,
      13.1
    );
    plan.schedule.forEach((week) => {
      const longRun = week.runs.find((r) => r.type === "long" || r.type === "marathon");
      if (longRun) {
        expect(longRun.mileage * 2).toBeCloseTo(Math.round(longRun.mileage * 2));
      }
    });
  });
});
