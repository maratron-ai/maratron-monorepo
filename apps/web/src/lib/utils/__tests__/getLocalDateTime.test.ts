// src/lib/utils/__tests__/getLocalDateTime.test.ts

import { getLocalDateTime } from "../time";

describe("getLocalDateTime", () => {
  it("returns ISO datetime without timezone offset", () => {
    const value = getLocalDateTime();
    expect(value).toHaveLength(16);
    expect(value).toMatch(/T/);

    // Force parsing as UTC by appending "Z"
    const asDate = new Date(value + "Z");
    expect(asDate.toISOString().slice(0, 16)).toBe(value);
  });
});
