import { calculateRacePaces } from "../running/calculateRacePaces";

describe("calculateRacePaces", () => {
  it("returns predictions for standard distances", () => {
    const results = calculateRacePaces(50, 10); // 10k in 50 mins
    expect(results).toEqual([
      { target: "5K", predictedTime: "23:59", pacePerKm: "4:48", pacePerMile: "7:43" },
      { target: "10K", predictedTime: "50:00", pacePerKm: "5:00", pacePerMile: "8:03" },
      { target: "Half Marathon", predictedTime: "1:50:19", pacePerKm: "5:14", pacePerMile: "8:25" },
      { target: "Marathon", predictedTime: "3:50:01", pacePerKm: "5:27", pacePerMile: "8:46" },
    ]);
  });
});
