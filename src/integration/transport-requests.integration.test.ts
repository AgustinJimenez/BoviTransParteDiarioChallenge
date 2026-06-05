import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/transport-requests/route";
import { createRequest, createTruck } from "./helpers";

const url = (path: string) => `http://localhost${path}`;

describe("GET /api/transport-requests", () => {
  it("returns empty list when no records exist", async () => {
    const res = await GET(new NextRequest(url("/api/transport-requests")));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.items).toHaveLength(0);
    expect(json.data.hasMore).toBe(false);
    expect(json.data.total).toBe(0);
  });

  it("paginates correctly", async () => {
    await createRequest();
    await createRequest();
    await createRequest();

    const res = await GET(new NextRequest(url("/api/transport-requests?limit=2&page=1")));
    const json = await res.json();

    expect(json.data.items).toHaveLength(2);
    expect(json.data.hasMore).toBe(true);
    expect(json.data.total).toBe(3);

    const page2 = await GET(new NextRequest(url("/api/transport-requests?limit=2&page=2")));
    const json2 = await page2.json();

    expect(json2.data.items).toHaveLength(1);
    expect(json2.data.hasMore).toBe(false);
  });

  it("filters by status", async () => {
    await createRequest({ status: "PENDING" });
    await createRequest({ status: "PENDING" });
    await createRequest({ status: "COMPLETED" });

    const res = await GET(new NextRequest(url("/api/transport-requests?status=PENDING")));
    const json = await res.json();

    expect(json.data.items).toHaveLength(2);
    expect(json.data.items.every((r: { status: string }) => r.status === "PENDING")).toBe(true);
  });

  it("searches by requester name (case-insensitive)", async () => {
    await createRequest({ requesterName: "Juan Pérez" });
    await createRequest({ requesterName: "María García" });

    const res = await GET(new NextRequest(url("/api/transport-requests?search=juan")));
    const json = await res.json();

    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].requesterName).toBe("Juan Pérez");
  });

  it("searches by origin city", async () => {
    await createRequest({ origin: "Rosario, Santa Fe" });
    await createRequest({ origin: "Córdoba Capital" });

    const res = await GET(new NextRequest(url("/api/transport-requests?search=rosario")));
    const json = await res.json();

    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].origin).toBe("Rosario, Santa Fe");
  });

  it("serializes Decimal fields as numbers — not strings (Prisma v7 gotcha)", async () => {
    const truck = await createTruck();
    await createRequest({
      status: "ASSIGNED",
      assignedTruckId: truck.id,
      distanceKm: 450.75,
      fuelCost: 253548.75,
    });

    const res = await GET(new NextRequest(url("/api/transport-requests")));
    const json = await res.json();
    const item = json.data.items[0];

    expect(typeof item.distanceKm).toBe("number");
    expect(typeof item.fuelCost).toBe("number");
    expect(typeof item.assignedTruck.fuelConsumption).toBe("number");
    expect(item.distanceKm).toBe(450.75);
  });

  it("orders by createdAt descending", async () => {
    const first  = await createRequest({ requesterName: "Primero" });
    const second = await createRequest({ requesterName: "Segundo" });

    const res = await GET(new NextRequest(url("/api/transport-requests")));
    const json = await res.json();

    expect(json.data.items[0].id).toBe(second.id);
    expect(json.data.items[1].id).toBe(first.id);
  });
});

describe("POST /api/transport-requests", () => {
  const makeReq = (body: object) =>
    new NextRequest(url("/api/transport-requests"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("creates a request and returns 201", async () => {
    const res = await POST(makeReq({
      requesterName: "Ana Martínez",
      requesterPhone: "+54 9 341 555-1234",
      cattleCount: 25,
      origin: "Rosario, Santa Fe",
      destination: "Córdoba Capital",
    }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.requesterName).toBe("Ana Martínez");
    expect(json.data.status).toBe("PENDING");
    expect(json.data.assignedTruck).toBeNull();
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeReq({ cattleCount: 10 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  it("returns 400 for cattleCount of zero", async () => {
    const res = await POST(makeReq({
      requesterName: "Test",
      cattleCount: 0,
      origin: "Rosario",
      destination: "Córdoba",
    }));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/transport-requests — combined filters", () => {
  beforeEach(async () => {
    await createRequest({ requesterName: "Juan Pérez",   status: "PENDING"   });
    await createRequest({ requesterName: "Juan García",  status: "ASSIGNED"  });
    await createRequest({ requesterName: "María López",  status: "PENDING"   });
  });

  it("combines status and search filters", async () => {
    const res = await GET(new NextRequest(url("/api/transport-requests?status=PENDING&search=juan")));
    const json = await res.json();

    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].requesterName).toBe("Juan Pérez");
  });
});
