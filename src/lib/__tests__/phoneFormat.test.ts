import { describe, it, expect } from "vitest";
import { formatArgentinePhone, formatInternationalPhone } from "../phoneFormat";

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

describe("formatInternationalPhone", () => {
  describe("empty and non-digit input", () => {
    it("returns empty string for empty input", () => {
      expect(formatInternationalPhone("")).toBe("");
    });

    it("returns empty string for whitespace only", () => {
      expect(formatInternationalPhone("   ")).toBe("");
    });

    it("returns empty string for non-digit characters only", () => {
      expect(formatInternationalPhone("+-()")).toBe("");
    });

    it("strips non-digit characters before formatting", () => {
      expect(formatInternationalPhone("+595 985-246-653")).toBe("+595 985246653");
    });
  });

  describe("3-digit country codes (Paraguay, Bolivia, Ecuador…)", () => {
    it("detects Paraguay (+595) from raw digits", () => {
      expect(formatInternationalPhone("595985246653")).toBe("+595 985246653");
    });

    it("returns just the CC when no subscriber digits yet", () => {
      expect(formatInternationalPhone("595")).toBe("+595");
    });

    it("detects Bolivia (+591)", () => {
      expect(formatInternationalPhone("59171234567")).toBe("+591 71234567");
    });

    it("detects Ecuador (+593)", () => {
      expect(formatInternationalPhone("593991234567")).toBe("+593 991234567");
    });
  });

  describe("2-digit country codes (Argentina, Brazil, Chile…)", () => {
    it("detects Argentina (+54)", () => {
      expect(formatInternationalPhone("5491155551234")).toBe("+54 91155551234");
    });

    it("detects Brazil (+55)", () => {
      expect(formatInternationalPhone("5511987654321")).toBe("+55 11987654321");
    });

    it("detects Chile (+56)", () => {
      expect(formatInternationalPhone("56912345678")).toBe("+56 912345678");
    });
  });

  describe("NANP (+1)", () => {
    it("detects US/Canada (+1)", () => {
      expect(formatInternationalPhone("12025551234")).toBe("+1 2025551234");
    });

    it("returns +1 when only 1 is typed", () => {
      expect(formatInternationalPhone("1")).toBe("+1");
    });
  });

  describe("unknown leading digits", () => {
    it("prepends + when no CC matches", () => {
      expect(formatInternationalPhone("7999123456")).toBe("+7999123456");
    });
  });

  describe("E.164 15-digit limit", () => {
    it("truncates input beyond 15 digits", () => {
      // 595 + 12 subscriber digits = 15 total; 16th digit is dropped
      expect(formatInternationalPhone("595985246653123456")).toBe("+595 985246653123");
    });

    it("keeps exactly 15 digits intact", () => {
      expect(formatInternationalPhone("595985246653123")).toBe("+595 985246653123");
    });
  });

  describe("progressive formatting as user types", () => {
    it("formats partial CC (2 digits, no CC match yet)", () => {
      expect(formatInternationalPhone("59")).toBe("+59");
    });

    it("formats exactly at 3-digit CC boundary", () => {
      expect(formatInternationalPhone("595")).toBe("+595");
    });

    it("formats first subscriber digit after CC", () => {
      expect(formatInternationalPhone("5959")).toBe("+595 9");
    });
  });
});
