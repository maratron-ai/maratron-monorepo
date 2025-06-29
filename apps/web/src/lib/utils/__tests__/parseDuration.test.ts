import { parseDuration } from "../time/parseDuration";

describe("parseDuration", () => {
  it("converts hh:mm:ss to seconds", () => {
    expect(parseDuration("01:00:00")).toBe(3600);
    expect(parseDuration("00:30:15")).toBe(1815);
  });

  it("converts mm:ss to seconds", () => {
    expect(parseDuration("10:30")).toBe(630);
  });
});
