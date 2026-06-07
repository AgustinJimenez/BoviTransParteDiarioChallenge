import { describe, it, expect } from "vitest";
import {
  calculateFuelCost,
  calculateTripsNeeded,
  isCapacityExceeded,
  haversineDistanceKm,
} from "../calculations";

// ---------------------------------------------------------------------------
// calculateFuelCost
// ---------------------------------------------------------------------------

describe("calculateFuelCost", () => {
  it("returns distance × consumption × price", () => {
    expect(calculateFuelCost(100, 0.45, 1250)).toBe(56_250);
  });

  it("scales linearly with distance", () => {
    const base = calculateFuelCost(100, 0.45, 1250);
    expect(calculateFuelCost(200, 0.45, 1250)).toBe(base * 2);
  });

  it("scales linearly with fuel price", () => {
    const base = calculateFuelCost(100, 0.45, 1250);
    expect(calculateFuelCost(100, 0.45, 2500)).toBe(base * 2);
  });

  it("scales linearly with consumption", () => {
    const base = calculateFuelCost(100, 0.45, 1250);
    expect(calculateFuelCost(100, 0.90, 1250)).toBeCloseTo(base * 2);
  });

  it("returns 0 when distance is 0", () => {
    expect(calculateFuelCost(0, 0.45, 1250)).toBe(0);
  });

  it("returns 0 when fuel price is 0", () => {
    expect(calculateFuelCost(100, 0.45, 0)).toBe(0);
  });

  it("uses seed-data values correctly — Concepción → Asunción (Paraguay)", () => {
    // Seed: 310.50 km, AB-123-CD (0.45 L/km), 7500 Gs/L
    expect(calculateFuelCost(310.50, 0.45, 7500)).toBeCloseTo(1_047_937.5, 0);
  });
});

// ---------------------------------------------------------------------------
// calculateTripsNeeded
// ---------------------------------------------------------------------------

describe("calculateTripsNeeded", () => {
  it("returns 1 when cattle fit exactly in one truck", () => {
    expect(calculateTripsNeeded(30, 30)).toBe(1);
  });

  it("returns 1 when cattle count is below capacity", () => {
    expect(calculateTripsNeeded(25, 30)).toBe(1);
  });

  it("rounds up when cattle exceed capacity by one", () => {
    expect(calculateTripsNeeded(31, 30)).toBe(2);
  });

  it("calculates correctly for 45 cattle and 20 capacity", () => {
    // 45 / 20 = 2.25 → ceil → 3
    expect(calculateTripsNeeded(45, 20)).toBe(3);
  });

  it("calculates correctly for 60 cattle and 30 capacity", () => {
    // 60 / 30 = 2 exactly → 2
    expect(calculateTripsNeeded(60, 30)).toBe(2);
  });

  it("calculates correctly for 61 cattle and 30 capacity", () => {
    // 61 / 30 = 2.03... → 3
    expect(calculateTripsNeeded(61, 30)).toBe(3);
  });

  it("returns 1 for a single animal", () => {
    expect(calculateTripsNeeded(1, 30)).toBe(1);
  });

  it("handles large numbers", () => {
    // 1000 cattle, 40 per truck → 25 trips
    expect(calculateTripsNeeded(1000, 40)).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// isCapacityExceeded
// ---------------------------------------------------------------------------

describe("isCapacityExceeded", () => {
  it("returns false when cattle count is below capacity", () => {
    expect(isCapacityExceeded(25, 30)).toBe(false);
  });

  it("returns false when cattle count equals capacity exactly", () => {
    // Boundary: 30 > 30 is false
    expect(isCapacityExceeded(30, 30)).toBe(false);
  });

  it("returns true when cattle count exceeds capacity by one", () => {
    expect(isCapacityExceeded(31, 30)).toBe(true);
  });

  it("returns true when cattle count far exceeds capacity", () => {
    expect(isCapacityExceeded(100, 30)).toBe(true);
  });

  it("returns false for a single animal in any truck", () => {
    expect(isCapacityExceeded(1, 20)).toBe(false);
    expect(isCapacityExceeded(1, 40)).toBe(false);
  });

  it("is consistent with calculateTripsNeeded — exceeded implies > 1 trip", () => {
    const cattle = 31;
    const capacity = 30;
    expect(isCapacityExceeded(cattle, capacity)).toBe(true);
    expect(calculateTripsNeeded(cattle, capacity)).toBeGreaterThan(1);
  });

  it("not exceeded implies exactly 1 trip needed", () => {
    const cattle = 30;
    const capacity = 30;
    expect(isCapacityExceeded(cattle, capacity)).toBe(false);
    expect(calculateTripsNeeded(cattle, capacity)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// haversineDistanceKm
// ---------------------------------------------------------------------------

describe("haversineDistanceKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistanceKm(-34.6037, -58.3816, -34.6037, -58.3816)).toBe(0);
  });

  it("is symmetric — distance A→B equals B→A", () => {
    const d1 = haversineDistanceKm(-32.9442, -60.6505, -31.4201, -64.1888);
    const d2 = haversineDistanceKm(-31.4201, -64.1888, -32.9442, -60.6505);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it("approximates Rosario → Córdoba (~374 km straight line)", () => {
    // Rosario: -32.9442, -60.6505  |  Córdoba: -31.4201, -64.1888
    const dist = haversineDistanceKm(-32.9442, -60.6505, -31.4201, -64.1888);
    expect(dist).toBeGreaterThan(340);
    expect(dist).toBeLessThan(420);
  });

  it("approximates Buenos Aires → Mar del Plata (~380 km straight line)", () => {
    // BA: -34.6037, -58.3816  |  MdP: -38.0023, -57.5575
    const dist = haversineDistanceKm(-34.6037, -58.3816, -38.0023, -57.5575);
    expect(dist).toBeGreaterThan(340);
    expect(dist).toBeLessThan(420);
  });

  it("returns a positive value for any non-identical coordinates", () => {
    const dist = haversineDistanceKm(-24.7859, -65.4117, -26.8083, -65.2176);
    expect(dist).toBeGreaterThan(0);
  });
});
