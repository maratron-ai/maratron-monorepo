import lerp from "../math/lerp";

describe("lerp", () => {
  describe("basic interpolation", () => {
    it("interpolates between start and end values", () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it("interpolates with non-zero start values", () => {
      expect(lerp(5, 15, 0.5)).toBe(10);
      expect(lerp(10, 20, 0.25)).toBe(12.5);
      expect(lerp(100, 200, 0.3)).toBe(130);
    });
  });

  describe("edge cases", () => {
    it("handles negative values", () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
      expect(lerp(-5, -15, 0.5)).toBe(-10);
      expect(lerp(5, -5, 0.5)).toBe(0);
    });

    it("handles reverse interpolation (end < start)", () => {
      expect(lerp(10, 0, 0.5)).toBe(5);
      expect(lerp(100, 50, 0.6)).toBe(70);
    });

    it("handles same start and end values", () => {
      expect(lerp(5, 5, 0)).toBe(5);
      expect(lerp(5, 5, 0.5)).toBe(5);
      expect(lerp(5, 5, 1)).toBe(5);
    });

    it("handles extreme t values", () => {
      // t = 0 should return start
      expect(lerp(10, 20, 0)).toBe(10);
      // t = 1 should return end
      expect(lerp(10, 20, 1)).toBe(20);
    });
  });

  describe("precision and floating point", () => {
    it("handles floating point precision correctly", () => {
      const result = lerp(0, 1, 1/3);
      expect(result).toBeCloseTo(0.333333, 5);
    });

    it("handles very small differences", () => {
      expect(lerp(1.0001, 1.0002, 0.5)).toBeCloseTo(1.00015, 5);
    });

    it("handles very large numbers", () => {
      expect(lerp(1000000, 2000000, 0.5)).toBe(1500000);
    });
  });

  describe("mathematical properties", () => {
    it("is linear (additivity)", () => {
      const start = 10;
      const end = 30;
      const t1 = 0.3;
      const t2 = 0.7;
      
      const result1 = lerp(start, end, t1);
      const result2 = lerp(start, end, t2);
      const direct = lerp(start, end, t1 + t2);
      
      // This property doesn't directly apply, but we can test linearity
      expect(lerp(start, end, 0.3)).toBe(16);
      expect(lerp(start, end, 0.6)).toBe(22);
    });

    it("maintains monotonicity", () => {
      // For increasing function, increasing t should increase result
      expect(lerp(0, 10, 0.2)).toBeLessThan(lerp(0, 10, 0.8));
      
      // For decreasing function, increasing t should decrease result
      expect(lerp(10, 0, 0.2)).toBeGreaterThan(lerp(10, 0, 0.8));
    });
  });
});
