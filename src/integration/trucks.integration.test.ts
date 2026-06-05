import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/trucks/route";
import { PATCH } from "@/app/api/trucks/[id]/route";
import { createTruck } from "./helpers";

const url = (path: string) => `http://localhost${path}`;

describe("GET /api/trucks", () => {
  it("returns all trucks", async () => {
    await createTruck({ plate: "AA-111-BB" });
    await createTruck({ plate: "CC-222-DD", isActive: false });

    const res = await GET(new NextRequest(url("/api/trucks")));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(2);
  });

  it("filters to active-only when ?active=true", async () => {
    await createTruck({ plate: "AA-111-BB", isActive: true });
    await createTruck({ plate: "CC-222-DD", isActive: false });

    const res = await GET(new NextRequest(url("/api/trucks?active=true")));
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].plate).toBe("AA-111-BB");
  });

  it("serializes fuelConsumption as number", async () => {
    await createTruck({ fuelConsumption: 0.45 });

    const res = await GET(new NextRequest(url("/api/trucks")));
    const json = await res.json();

    expect(typeof json.data[0].fuelConsumption).toBe("number");
    expect(json.data[0].fuelConsumption).toBe(0.45);
  });
});

describe("POST /api/trucks", () => {
  const makeReq = (body: object) =>
    new NextRequest(url("/api/trucks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("creates a truck and uppercases the plate", async () => {
    const res = await POST(makeReq({ plate: "ab-123-cd", maxCapacity: 30, fuelConsumption: 0.45 }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.plate).toBe("AB-123-CD");
    expect(json.data.isActive).toBe(true);
  });

  it("returns 409 for duplicate plate", async () => {
    await createTruck({ plate: "DUP-001" });
    const res = await POST(makeReq({ plate: "dup-001", maxCapacity: 30, fuelConsumption: 0.45 }));
    expect(res.status).toBe(409);
  });

  it("returns 400 for zero capacity", async () => {
    const res = await POST(makeReq({ plate: "ZZ-000-ZZ", maxCapacity: 0, fuelConsumption: 0.45 }));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/trucks/[id] — toggle active", () => {
  const patchReq = (id: string) =>
    new NextRequest(url(`/api/trucks/${id}`), { method: "PATCH" });

  it("deactivates an active truck", async () => {
    const truck = await createTruck({ isActive: true });

    const res = await PATCH(patchReq(truck.id), { params: Promise.resolve({ id: truck.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isActive).toBe(false);
  });

  it("activates an inactive truck", async () => {
    const truck = await createTruck({ isActive: false });

    const res = await PATCH(patchReq(truck.id), { params: Promise.resolve({ id: truck.id }) });
    const json = await res.json();

    expect(json.data.isActive).toBe(true);
  });

  it("returns 404 for unknown id", async () => {
    const res = await PATCH(patchReq("00000000-0000-0000-0000-000000000000"), { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }) });
    expect(res.status).toBe(404);
  });
});

