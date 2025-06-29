import calculatePace from "../running/calculatePace";

describe("calculatePace", () => {
  it("computes pace from duration and distance", () => {
    expect(calculatePace("01:00:00", 10)).toBe("06:00");
    expect(calculatePace("00:30:00", 5)).toBe("06:00");
  });
});
