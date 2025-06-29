import { calculateDurationFromPace } from "../running/calculateDuration";

describe("calculateDurationFromPace", () => {
  it("computes duration from pace and distance", () => {
    expect(calculateDurationFromPace(5, "06:00")).toBe("00:30:00");
    expect(calculateDurationFromPace(10, "06:00")).toBe("01:00:00");
  });
});
