import { describe, it, expect } from "vitest";
import { idr } from "./format";

// Non-breaking space used by Intl for the IDR currency format.
const normalize = (s: string) => s.replace(/\u00a0/g, " ");

describe("idr", () => {
  it("formats a number as Indonesian Rupiah without fraction digits", () => {
    expect(normalize(idr(1000))).toBe("Rp 1.000");
    expect(normalize(idr(1500000))).toBe("Rp 1.500.000");
  });

  it("formats zero", () => {
    expect(normalize(idr(0))).toBe("Rp 0");
  });

  it("rounds away fractional values", () => {
    expect(normalize(idr(1000.9))).toBe("Rp 1.001");
  });

  it("formats negative values with a leading minus sign", () => {
    expect(normalize(idr(-2000))).toBe("-Rp 2.000");
  });
});
