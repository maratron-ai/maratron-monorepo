import { riegalCalculator } from "../running/riegalCalculator";

describe("riegalCalculator", () => {
  it("predicts race performance", () => {
    const result = riegalCalculator(3600, 10000, 21097.5);
    expect(result).toEqual({
      totalTimeSec: 7943,
      pacePerKm: "6:16",
      pacePerMile: "10:06",
    });
  });
});
