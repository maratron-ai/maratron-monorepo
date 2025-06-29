import {
  generate5kPlan,
  generateHalfMarathonPlan,
  DistancePlanOptions,
} from "../running/plans/distancePlans";
import { TrainingLevel } from "../running/plans/longDistancePlan";


describe("customizePlanRuns", () => {
  it("reduces to three runs with alternating quality workouts", () => {
    const base = generate5kPlan({
      distanceUnit: "miles",
      trainingLevel: TrainingLevel.Beginner,
      vdot: 40,
      runsPerWeek: 3,
    });
    const week1Types = base.schedule[0].runs.map((r) => r.type);
    const week2Types = base.schedule[1].runs.map((r) => r.type);
    expect(base.schedule[0].runs).toHaveLength(3);
    expect(base.schedule[1].runs).toHaveLength(3);
    expect(week1Types.filter((t) => t === "easy").length).toBe(1);
    expect(week1Types.filter((t) => t === "long").length).toBe(1);
    expect(week1Types.some((t) => t === "interval" || t === "tempo")).toBe(true);
    const week1Quality = week1Types.find((t) => t === "interval" || t === "tempo");
    const week2Quality = week2Types.find((t) => t === "interval" || t === "tempo");
    expect(week1Quality).not.toBe(week2Quality);
  });

  it("adds the requested number of cross training days", () => {
    const opts: DistancePlanOptions = {
      distanceUnit: "miles",
      trainingLevel: TrainingLevel.Beginner,
      vdot: 40,
      runsPerWeek: 5,
      crossTrainingDays: 2,
    };
    const plan = generate5kPlan(opts);
    const week1 = plan.schedule[0];
    const crossCount = week1.runs.filter((r) => r.type === "cross").length;
    expect(crossCount).toBe(2);
  });

  it("produces four runs with tempo and interval", () => {
    const plan = generateHalfMarathonPlan({
      distanceUnit: "miles",
      trainingLevel: TrainingLevel.Beginner,
      vdot: 40,
      runsPerWeek: 4,
    });
    const week1 = plan.schedule[0];
    const types = week1.runs.map((r) => r.type);
    expect(week1.runs).toHaveLength(4);
    expect(types.filter((t) => t === "easy").length).toBe(1);
    expect(types).toContain("tempo");
    expect(types).toContain("interval");
  });

  it("handles two-run weeks with alternating quality", () => {
    const plan = generate5kPlan({
      distanceUnit: "miles",
      trainingLevel: TrainingLevel.Beginner,
      vdot: 40,
      runsPerWeek: 2,
    });
    const w1Types = plan.schedule[0].runs.map((r) => r.type);
    const w2Types = plan.schedule[1].runs.map((r) => r.type);
    expect(plan.schedule[0].runs).toHaveLength(2);
    expect(w1Types).toContain("long");
    expect(w1Types.some((t) => t === "tempo" || t === "interval")).toBe(true);
    const q1 = w1Types.find((t) => t === "tempo" || t === "interval");
    const q2 = w2Types.find((t) => t === "tempo" || t === "interval");
    expect(q1).not.toBe(q2);
  });

  it("removes cutback notes when under four runs", () => {
    const plan = generateHalfMarathonPlan({
      distanceUnit: "miles",
      trainingLevel: TrainingLevel.Beginner,
      vdot: 40,
      runsPerWeek: 3,
    });
    expect(plan.schedule.some((w) => /Cutback/i.test(w.notes || ""))).toBe(false);
  });

  it("forwards runTypeDays to the generator", () => {
    const plan = generateHalfMarathonPlan({
      distanceUnit: "miles",
      trainingLevel: TrainingLevel.Beginner,
      vdot: 40,
      runTypeDays: { long: "Sunday", marathon: "Sunday" },
    });
    plan.schedule.forEach((w) => {
      const longRun = w.runs.find((r) => r.type === "long" || r.type === "marathon");
      if (longRun) expect(longRun.day).toBe("Sunday");
    });
  });
});
