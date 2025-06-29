import { assignDatesToPlan, removeDatesFromPlan } from "../running/planDates";
import { RunningPlanData } from "@maratypes/runningPlan";

describe("assignDatesToPlan", () => {
  it("assigns week and run dates from start date", () => {
    const data: RunningPlanData = {
      weeks: 2,
      schedule: [
        { weekNumber: 1, weeklyMileage: 10, unit: "miles", runs: [{ type: "easy", unit: "miles", targetPace: { unit: "miles", pace: "10:00" }, mileage: 5, day: "Monday" }] },
        { weekNumber: 2, weeklyMileage: 10, unit: "miles", runs: [{ type: "easy", unit: "miles", targetPace: { unit: "miles", pace: "10:00" }, mileage: 5, day: "Monday" }] },
      ],
    };
    const future = new Date();
    const daysToMonday = (8 - future.getUTCDay()) % 7; // next Monday
    future.setUTCDate(future.getUTCDate() + daysToMonday);
    const str = future.toISOString().slice(0, 10);
    const result = assignDatesToPlan(data, { startDate: str });
    const start = new Date(str);
    expect(result.schedule[0].startDate).toBe(start.toISOString());
    expect(result.schedule[0].runs[0].date).toBe(`${str}T00:00:00.000Z`);
  });

  it("uses partial first week and snaps following weeks to Sunday", () => {
    const plan: RunningPlanData = {
      weeks: 3,
      schedule: [
        { weekNumber: 1, weeklyMileage: 10, unit: "miles", runs: [] },
        { weekNumber: 2, weeklyMileage: 10, unit: "miles", runs: [] },
        { weekNumber: 3, weeklyMileage: 10, unit: "miles", runs: [] },
      ],
    };
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 2); // future arbitrary weekday
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 24); // three weeks later
    const result = assignDatesToPlan(plan, {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
    expect(result.schedule[0].startDate).toBe(start.toISOString());
    const week2Start = new Date(start);
    week2Start.setUTCDate(week2Start.getUTCDate() + (7 - week2Start.getUTCDay()));
    week2Start.setUTCHours(0, 0, 0, 0);
    expect(result.schedule[1].startDate).toBe(week2Start.toISOString());
  });

  it("prevents past start dates", () => {
    const data: RunningPlanData = {
      weeks: 1,
      schedule: [
        {
          weekNumber: 1,
          weeklyMileage: 10,
          unit: "miles",
          runs: [
            { type: "easy", unit: "miles", targetPace: { unit: "miles", pace: "10:00" }, mileage: 5, day: "Monday" },
          ],
        },
      ],
    };
    const past = new Date();
    past.setDate(past.getDate() - 30);
    const result = assignDatesToPlan(data, { startDate: past.toISOString().slice(0,10) });
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString();
    expect(result.startDate).toBe(todayUTC);
  });

  it("defaults to next Sunday when no dates given", () => {
    const data: RunningPlanData = {
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
              day: "Monday",
            },
          ],
        },
      ],
    };
    const result = assignDatesToPlan(data, {});
    const today = new Date();
    const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const diff = (7 - base.getUTCDay()) % 7;
    base.setUTCDate(base.getUTCDate() + (diff === 0 ? 7 : diff));
    expect(result.startDate).toBe(base.toISOString());
  });

  it("calculates end date from start date and weeks", () => {
    const plan: RunningPlanData = {
      weeks: 2,
      schedule: [
        { weekNumber: 1, weeklyMileage: 10, unit: "miles", runs: [] },
        { weekNumber: 2, weeklyMileage: 10, unit: "miles", runs: [] },
      ],
    };
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 3); // later this week
    const str = start.toISOString().slice(0, 10);
    const result = assignDatesToPlan(plan, { startDate: str });
    const expectedEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    expectedEnd.setUTCDate(expectedEnd.getUTCDate() + plan.weeks * 7);
    expect(result.endDate).toBe(expectedEnd.toISOString());
  });

  it("computes start date when only end date provided", () => {
    const plan: RunningPlanData = {
      weeks: 3,
      schedule: [
        { weekNumber: 1, weeklyMileage: 10, unit: "miles", runs: [] },
        { weekNumber: 2, weeklyMileage: 10, unit: "miles", runs: [] },
        { weekNumber: 3, weeklyMileage: 10, unit: "miles", runs: [] },
      ],
    };
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + 30);
    const str = end.toISOString().slice(0, 10);
    const result = assignDatesToPlan(plan, { endDate: str });
    const expectedStart = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    expectedStart.setUTCDate(expectedStart.getUTCDate() - plan.weeks * 7);
    expect(result.startDate).toBe(expectedStart.toISOString());
  });

  it("clears all dates from the plan", () => {
    const data: RunningPlanData = {
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
              day: "Monday",
              date: "2024-07-01T00:00:00.000Z",
              done: false,
            },
          ],
          startDate: "2024-06-30T00:00:00.000Z",
          done: false,
        },
      ],
      startDate: "2024-06-30T00:00:00.000Z",
      endDate: "2024-06-30T00:00:00.000Z",
    };
    const result = removeDatesFromPlan(data);
    expect(result.startDate).toBeUndefined();
    expect(result.schedule[0].startDate).toBeUndefined();
    expect(result.schedule[0].runs[0].date).toBeUndefined();
  });
});
