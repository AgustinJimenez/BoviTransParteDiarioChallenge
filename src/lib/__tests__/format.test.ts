import { describe, it, expect } from "vitest";
import { fmtDistance, fmtConsumption, fmtCost, fmtPrice } from "../format";

// ---------------------------------------------------------------------------
// fmtDistance
// ---------------------------------------------------------------------------

describe("fmtDistance", () => {
  it("formats integer distance with no decimals", () => {
    expect(fmtDistance(310)).toBe("310");
  });

  it("formats distance with up to 2 significant decimal places", () => {
    expect(fmtDistance(392.95)).toBe("392,95");
  });

  it("drops trailing zeros after decimal", () => {
    // maximumFractionDigits: 2 — no trailing zeros
    expect(fmtDistance(310.5)).toBe("310,5");
    expect(fmtDistance(100.0)).toBe("100");
  });

  it("uses dot as thousands separator and comma as decimal (es-AR locale)", () => {
    expect(fmtDistance(1234.56)).toBe("1.234,56");
  });

  it("formats zero", () => {
    expect(fmtDistance(0)).toBe("0");
  });

  it("matches what the detail page shows for seed request Concepción → Asunción", () => {
    // Seed: distance_km = 310.50
    expect(fmtDistance(310.5)).toBe("310,5");
  });
});

// ---------------------------------------------------------------------------
// fmtConsumption
// ---------------------------------------------------------------------------

describe("fmtConsumption", () => {
  it("always shows 2 decimal places", () => {
    expect(fmtConsumption(0.45)).toBe("0,45");
    expect(fmtConsumption(0.4)).toBe("0,40");
    expect(fmtConsumption(0.55)).toBe("0,55");
    expect(fmtConsumption(0.38)).toBe("0,38");
  });

  it("does not add extra decimals beyond 2", () => {
    expect(fmtConsumption(0.123)).toBe("0,12");
  });

  it("formats integer consumption with 2 trailing zeros", () => {
    expect(fmtConsumption(1)).toBe("1,00");
  });

  it("matches seed fleet values (AB-123-CD, EF-456-GH, IJ-789-KL)", () => {
    expect(fmtConsumption(0.45)).toBe("0,45"); // AB-123-CD
    expect(fmtConsumption(0.38)).toBe("0,38"); // EF-456-GH
    expect(fmtConsumption(0.55)).toBe("0,55"); // IJ-789-KL
  });
});

// ---------------------------------------------------------------------------
// fmtCost
// ---------------------------------------------------------------------------

describe("fmtCost", () => {
  it("formats with thousands separator, no decimals", () => {
    expect(fmtCost(1047937.5)).toBe("1.047.938");
  });

  it("rounds to nearest integer", () => {
    expect(fmtCost(1047937.4)).toBe("1.047.937");
    expect(fmtCost(1047937.5)).toBe("1.047.938");
  });

  it("formats zero", () => {
    expect(fmtCost(0)).toBe("0");
  });

  it("formats values below 1000 without separator", () => {
    expect(fmtCost(500)).toBe("500");
  });

  it("matches seed: Concepción → Asunción — AB-123-CD — 310.50 km × 0.45 L/km × 7500 Gs/L", () => {
    // 310.50 × 0.45 × 7500 = 1.047.937,50 → rounded → 1.047.938
    expect(fmtCost(310.5 * 0.45 * 7500)).toBe("1.047.938");
  });

  it("matches seed: Encarnación → Ciudad del Este — EF-456-GH — 290.40 km × 0.38 L/km × 7500 Gs/L", () => {
    // 290.40 × 0.38 × 7500 = 827.640
    expect(fmtCost(290.4 * 0.38 * 7500)).toBe("827.640");
  });
});

// ---------------------------------------------------------------------------
// fmtPrice
// ---------------------------------------------------------------------------

describe("fmtPrice", () => {
  it("formats with thousands separator, no decimals", () => {
    expect(fmtPrice(7500)).toBe("7.500");
  });

  it("formats the current Paraguayan diesel price", () => {
    expect(fmtPrice(7500)).toBe("7.500");
  });

  it("formats zero", () => {
    expect(fmtPrice(0)).toBe("0");
  });

  it("rounds decimal input to integer", () => {
    expect(fmtPrice(7500.9)).toBe("7.501");
  });

  it("formats large price", () => {
    expect(fmtPrice(12500)).toBe("12.500");
  });
});
