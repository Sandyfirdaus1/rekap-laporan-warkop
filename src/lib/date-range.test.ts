import { describe, it, expect } from "vitest";
import { getRangeBounds, formatDayKey, formatHourKey } from "./date-range";

describe("getRangeBounds", () => {
  it("returns start and end of the same day for the 'today' preset", () => {
    const now = new Date(2024, 0, 17, 14, 30, 45, 123); // Wed 2024-01-17
    const { start, end } = getRangeBounds("today", now);

    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(17);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);

    expect(end.getDate()).toBe(17);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("spans Monday to Sunday for the 'week' preset (mid-week input)", () => {
    const now = new Date(2024, 0, 17, 9, 0, 0); // Wednesday
    const { start, end } = getRangeBounds("week", now);

    // Monday of that week
    expect(start.getDate()).toBe(15);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);

    // Sunday of that week
    expect(end.getDate()).toBe(21);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("treats Sunday as the last day of the week", () => {
    const now = new Date(2024, 0, 21, 12, 0, 0); // Sunday
    const { start, end } = getRangeBounds("week", now);

    // Week should start on the preceding Monday (Jan 15)
    expect(start.getDate()).toBe(15);
    // and end on this Sunday (Jan 21)
    expect(end.getDate()).toBe(21);
  });

  it("spans the full calendar month for the 'month' preset", () => {
    const now = new Date(2024, 1, 10, 8, 0, 0); // February 2024 (leap year)
    const { start, end } = getRangeBounds("month", now);

    expect(start.getMonth()).toBe(1);
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);

    // Feb 2024 has 29 days
    expect(end.getMonth()).toBe(1);
    expect(end.getDate()).toBe(29);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("defaults to the current time when no date is provided", () => {
    const { start, end } = getRangeBounds("today");
    expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
  });
});

describe("formatDayKey", () => {
  it("formats a date as YYYY-MM-DD with zero padding", () => {
    expect(formatDayKey(new Date(2024, 0, 5))).toBe("2024-01-05");
    expect(formatDayKey(new Date(2024, 11, 25))).toBe("2024-12-25");
  });
});

describe("formatHourKey", () => {
  it("appends a zero-padded hour to the day key", () => {
    expect(formatHourKey(new Date(2024, 0, 5, 9))).toBe("2024-01-05 09:00");
    expect(formatHourKey(new Date(2024, 0, 5, 23))).toBe("2024-01-05 23:00");
  });
});
