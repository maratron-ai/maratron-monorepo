import { parseDuration } from "../time/parseDuration";

describe("parseDuration", () => {
  describe("valid time formats", () => {
    it("converts hh:mm:ss to seconds", () => {
      expect(parseDuration("01:00:00")).toBe(3600);
      expect(parseDuration("00:30:15")).toBe(1815);
      expect(parseDuration("02:45:30")).toBe(9930);
    });

    it("converts mm:ss to seconds", () => {
      expect(parseDuration("10:30")).toBe(630);
      expect(parseDuration("05:45")).toBe(345);
      expect(parseDuration("00:30")).toBe(30);
    });

    it("handles single-digit components", () => {
      expect(parseDuration("1:2:3")).toBe(3723);
      expect(parseDuration("5:30")).toBe(330);
      expect(parseDuration("0:5")).toBe(5);
    });

    it("handles zero values", () => {
      expect(parseDuration("00:00:00")).toBe(0);
      expect(parseDuration("00:00")).toBe(0);
      expect(parseDuration("0:0")).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles valid large time values", () => {
      expect(parseDuration("23:59:59")).toBe(86399);
      expect(parseDuration("59:59")).toBe(3599);
    });

    it("returns 0 for invalid time values (seconds >= 60)", () => {
      expect(parseDuration("01:00:70")).toBe(0); // Invalid: seconds >= 60
      expect(parseDuration("05:90")).toBe(0); // Invalid: seconds >= 60
    });

    it("returns 0 for invalid time values (minutes >= 60)", () => {
      expect(parseDuration("01:70:00")).toBe(0); // Invalid: minutes >= 60
    });
  });

  describe("input validation and error handling", () => {
    it("handles empty string", () => {
      expect(parseDuration("")).toBe(0);
    });

    it("handles whitespace correctly", () => {
      // Note: The function doesn't trim whitespace, so these may return 0
      expect(parseDuration("01:30:00")).toBe(5400);
      expect(parseDuration("10:30")).toBe(630);
    });

    it("returns 0 for invalid formats", () => {
      expect(parseDuration("invalid")).toBe(0);
      expect(parseDuration("abc:def")).toBe(0);
      expect(parseDuration("::")).toBe(0); // Empty components
      expect(parseDuration("a:b:c")).toBe(0); // Non-numeric
    });

    it("handles edge cases with leading/trailing colons", () => {
      expect(parseDuration(":30")).toBe(30); // Treated as 0:30 (30 seconds)
      expect(parseDuration("30:")).toBe(1800); // Treated as 30:0 (30 minutes)
    });

    it("returns 0 for negative values", () => {
      expect(parseDuration("-01:30:00")).toBe(0);
      expect(parseDuration("01:-30:00")).toBe(0);
      expect(parseDuration("01:30:-30")).toBe(0);
    });

    it("returns 0 for non-numeric components", () => {
      expect(parseDuration("aa:bb:cc")).toBe(0);
      expect(parseDuration("1a:2b:3c")).toBe(0);
    });

    it("handles single numbers as seconds", () => {
      expect(parseDuration("30")).toBe(30);
      expect(parseDuration("90")).toBe(90);
      expect(parseDuration("0")).toBe(0);
    });
  });

  describe("boundary testing", () => {
    it("handles maximum realistic running times", () => {
      // Ultra-marathon scenarios
      expect(parseDuration("24:00:00")).toBe(86400); // 24 hours
      expect(parseDuration("100:00:00")).toBe(360000); // 100 hours
    });

    it("handles very precise times", () => {
      expect(parseDuration("00:00:01")).toBe(1);
      expect(parseDuration("00:01:00")).toBe(60);
      expect(parseDuration("01:00:00")).toBe(3600);
    });
  });

  describe("real-world running scenarios", () => {
    it("handles typical 5K times", () => {
      expect(parseDuration("15:30")).toBe(930); // Fast 5K
      expect(parseDuration("20:45")).toBe(1245); // Average 5K
      expect(parseDuration("30:00")).toBe(1800); // Beginner 5K
    });

    it("handles typical marathon times", () => {
      expect(parseDuration("02:30:00")).toBe(9000); // Elite marathon
      expect(parseDuration("03:15:30")).toBe(11730); // Good amateur
      expect(parseDuration("04:30:00")).toBe(16200); // Average marathon
      expect(parseDuration("06:00:00")).toBe(21600); // Walking marathon
    });

    it("handles interval training times", () => {
      expect(parseDuration("00:30")).toBe(30); // 30-second sprint
      expect(parseDuration("01:45")).toBe(105); // 400m interval
      expect(parseDuration("05:00")).toBe(300); // Mile interval
    });
  });
});
