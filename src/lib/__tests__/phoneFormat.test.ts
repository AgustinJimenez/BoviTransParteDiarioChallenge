import { describe, it, expect } from "vitest";
import { formatArgentinePhone } from "../phoneFormat";

describe("formatArgentinePhone", () => {
  describe("empty and non-digit input", () => {
    it("returns empty string for empty input", () => {
      expect(formatArgentinePhone("")).toBe("");
    });

    it("returns empty string for whitespace only", () => {
      expect(formatArgentinePhone("   ")).toBe("");
    });

    it("returns empty string for non-digit characters only", () => {
      expect(formatArgentinePhone("+-()")).toBe("");
    });

    it("strips non-digit characters before formatting", () => {
      expect(formatArgentinePhone("(341) 555-1234")).toBe("+54 9 341 555-1234");
    });
  });

  describe("progressive formatting as user types", () => {
    it("formats 1 digit", () => {
      expect(formatArgentinePhone("3")).toBe("+54 9 3");
    });

    it("formats 3 digits", () => {
      expect(formatArgentinePhone("341")).toBe("+54 9 341");
    });

    it("formats 4 digits", () => {
      expect(formatArgentinePhone("3415")).toBe("+54 9 341 5");
    });

    it("formats 6 digits", () => {
      expect(formatArgentinePhone("341555")).toBe("+54 9 341 555");
    });

    it("formats 7 digits", () => {
      expect(formatArgentinePhone("3415551")).toBe("+54 9 341 555-1");
    });

    it("formats 10 digits — 3-digit area code (Rosario)", () => {
      expect(formatArgentinePhone("3415551234")).toBe("+54 9 341 555-1234");
    });

    it("formats 10 digits — 3-digit area code (Córdoba)", () => {
      expect(formatArgentinePhone("3515559012")).toBe("+54 9 351 555-9012");
    });

    it("formats 10 digits — 2-digit area code (Buenos Aires)", () => {
      expect(formatArgentinePhone("1155551234")).toBe("+54 9 115 555-1234");
    });
  });

  describe("strips country/mobile prefix typed by user", () => {
    it("strips leading 9", () => {
      expect(formatArgentinePhone("93415551234")).toBe("+54 9 341 555-1234");
    });

    it("strips leading 54", () => {
      expect(formatArgentinePhone("543415551234")).toBe("+54 9 341 555-1234");
    });

    it("strips leading 549", () => {
      expect(formatArgentinePhone("5493415551234")).toBe("+54 9 341 555-1234");
    });

    it("strips +54 9 prefix typed literally", () => {
      expect(formatArgentinePhone("+54 9 3415551234")).toBe("+54 9 341 555-1234");
    });
  });

  describe("truncates to 10 local digits", () => {
    it("ignores digits beyond the 10th", () => {
      expect(formatArgentinePhone("341555123499")).toBe("+54 9 341 555-1234");
    });
  });

  describe("real-world examples from seed data", () => {
    it("formats Rosario number", () => {
      expect(formatArgentinePhone("3415551234")).toBe("+54 9 341 555-1234");
    });

    it("formats Mar del Plata number", () => {
      expect(formatArgentinePhone("2235553456")).toBe("+54 9 223 555-3456");
    });

    it("formats Salta number", () => {
      expect(formatArgentinePhone("3875557890")).toBe("+54 9 387 555-7890");
    });
  });
});
