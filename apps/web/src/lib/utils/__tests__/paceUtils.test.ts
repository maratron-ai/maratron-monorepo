import { parsePace, formatPace, getPacesFromRacePace } from "../running/paces";

describe("pace utilities", () => {
  it("parses and formats pace", () => {
    expect(parsePace("5:30")).toBe(330);
    expect(formatPace(330)).toBe("5:30");
  });

  it("calculates training paces from race pace", () => {
    const paces = getPacesFromRacePace(330);
    expect(paces).toEqual({
      easy: "7:00",
      marathon: "5:45",
      threshold: "5:15",
      interval: "5:00",
      race: "5:30",
    });
  });
});
