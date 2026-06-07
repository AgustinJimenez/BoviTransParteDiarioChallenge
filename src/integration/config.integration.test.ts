import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/config/fuel-price/route";
import { seedFuelPrice } from "./helpers";

const url = "http://localhost/api/config/fuel-price";

const putReq = (body: object) =>
  new NextRequest(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("GET /api/config/fuel-price", () => {
  it("returns default price (1250) when no config exists", async () => {
    const res  = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.price).toBe(1250);
    expect(json.data.updatedAt).toBeNull();
    expect(json.error).toBeNull();
  });

  it("returns stored price when config exists", async () => {
    await seedFuelPrice(7500);

    const res  = await GET();
    const json = await res.json();

    expect(json.data.price).toBe(7500);
    expect(json.data.updatedAt).not.toBeNull();
  });
});

describe("PUT /api/config/fuel-price", () => {
  it("creates config and returns updated price", async () => {
    const res  = await PUT(putReq({ price: 8000 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.price).toBe(8000);
    expect(json.error).toBeNull();
  });

  it("updates existing config (upsert)", async () => {
    await seedFuelPrice(7500);

    const res  = await PUT(putReq({ price: 9000 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.price).toBe(9000);
  });

  it("GET after PUT reflects the new price", async () => {
    await PUT(putReq({ price: 12000 }));

    const res  = await GET();
    const json = await res.json();

    expect(json.data.price).toBe(12000);
  });

  it("returns 400 for price = 0", async () => {
    const res = await PUT(putReq({ price: 0 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  it("returns 400 for negative price", async () => {
    const res = await PUT(putReq({ price: -100 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing price field", async () => {
    const res = await PUT(putReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-numeric price", async () => {
    const res = await PUT(putReq({ price: "7500" }));
    expect(res.status).toBe(400);
  });
});
