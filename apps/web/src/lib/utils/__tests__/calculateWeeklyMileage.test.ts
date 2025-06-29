import { calculateWeeklyMileage } from "../running/calculateWeeklyMileage";

describe("calculateWeeklyMileage", () => {
  it("handles each training phase", () => {
    const totalWeeks = 10;
    const peak = 50;
    expect(calculateWeeklyMileage(1, totalWeeks, peak)).toBe(28); // base
    expect(calculateWeeklyMileage(5, totalWeeks, peak)).toBe(38); // build
    expect(calculateWeeklyMileage(8, totalWeeks, peak)).toBe(50); // peak
    expect(calculateWeeklyMileage(10, totalWeeks, peak)).toBe(25); // taper
  });
});
