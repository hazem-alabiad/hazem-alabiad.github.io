import { describe, it, expect } from "vitest";
import { absDate, relDate } from "./dates";

const now = new Date("2026-09-02T12:00:00Z");

describe("absDate", () => {
  it("formats an ISO date as month day, year", () => {
    expect(absDate("2026-05-21")).toBe("May 21, 2026");
  });
  it("returns empty string for empty input and falls back to the raw value when invalid", () => {
    expect(absDate("")).toBe("");
    expect(absDate("not-a-date")).toBe("not-a-date");
  });
});

describe("relDate", () => {
  it("returns an empty string for no date", () => {
    expect(relDate("", now)).toBe("");
  });
  it("falls back to the absolute form for unparseable input", () => {
    expect(relDate("garbage", now)).toBe("garbage");
  });
  it("labels today and yesterday", () => {
    expect(relDate("2026-09-02", now)).toBe("today");
    expect(relDate("2026-09-01", now)).toBe("yesterday");
  });
  it("counts recent days, then weeks", () => {
    expect(relDate("2026-08-30", now)).toBe("3 days ago");
    expect(relDate("2026-08-12", now)).toBe("3 weeks ago");
  });
  it("counts months, then years", () => {
    expect(relDate("2026-07-01", now)).toBe("2 months ago");
    expect(relDate("2024-06-01", now)).toBe("2 years ago");
    expect(relDate("2025-01-01", now)).toBe("last year");
  });
  it("keeps future dates as absolute", () => {
    expect(relDate("2027-01-01", now)).toBe("Jan 1, 2027");
  });
});
