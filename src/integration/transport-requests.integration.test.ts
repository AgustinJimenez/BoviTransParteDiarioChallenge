import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/transport-requests/route";
import { PATCH as patchStatus } from "@/app/api/transport-requests/[id]/status/route";
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

  it("accepts optional coordinate fields and returns them as numbers", async () => {
    const res = await POST(makeReq({
      requesterName: "Coord Test",
      cattleCount: 10,
      origin: "Encarnacion, Paraguay",
      originLat: -27.3364,
      originLng: -55.8675,
      destination: "Asunción, Paraguay",
      destinationLat: -25.2867,
      destinationLng: -57.6478,
    }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(typeof json.data.originLat).toBe("number");
    expect(typeof json.data.originLng).toBe("number");
    expect(typeof json.data.destinationLat).toBe("number");
    expect(typeof json.data.destinationLng).toBe("number");
    expect(json.data.originLat).toBeCloseTo(-27.3364, 4);
    expect(json.data.destinationLng).toBeCloseTo(-57.6478, 4);
  });

  it("returns null coordinates when not provided", async () => {
    const res = await POST(makeReq({
      requesterName: "No Coords",
      cattleCount: 5,
      origin: "Rosario",
      destination: "Córdoba",
    }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.originLat).toBeNull();
    expect(json.data.originLng).toBeNull();
    expect(json.data.destinationLat).toBeNull();
    expect(json.data.destinationLng).toBeNull();
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

// ---------------------------------------------------------------------------
// PATCH /api/transport-requests/[id]/status
// ---------------------------------------------------------------------------

describe("PATCH /api/transport-requests/[id]/status", () => {
  const makeReq = (id: string, body: object) =>
    new NextRequest(url(`/api/transport-requests/${id}/status`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const params = (id: string) => Promise.resolve({ id });

  it("PENDING → CANCELLED succeeds", async () => {
    const req = await createRequest({ status: "PENDING" });
    const res = await patchStatus(makeReq(req.id, { status: "CANCELLED" }), { params: params(req.id) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("CANCELLED");
    expect(json.error).toBeNull();
  });

  it("ASSIGNED → COMPLETED succeeds", async () => {
    const truck = await createTruck();
    const req = await createRequest({ status: "ASSIGNED", assignedTruckId: truck.id });
    const res = await patchStatus(makeReq(req.id, { status: "COMPLETED" }), { params: params(req.id) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("COMPLETED");
  });

  it("ASSIGNED → CANCELLED succeeds", async () => {
    const truck = await createTruck();
    const req = await createRequest({ status: "ASSIGNED", assignedTruckId: truck.id });
    const res = await patchStatus(makeReq(req.id, { status: "CANCELLED" }), { params: params(req.id) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("CANCELLED");
  });

  it("PENDING → COMPLETED is rejected with 422", async () => {
    const req = await createRequest({ status: "PENDING" });
    const res = await patchStatus(makeReq(req.id, { status: "COMPLETED" }), { params: params(req.id) });

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBeTruthy();
  });

  it("COMPLETED → CANCELLED is rejected with 422", async () => {
    const truck = await createTruck();
    const req = await createRequest({ status: "COMPLETED", assignedTruckId: truck.id });
    const res = await patchStatus(makeReq(req.id, { status: "CANCELLED" }), { params: params(req.id) });

    expect(res.status).toBe(422);
  });

  it("CANCELLED → COMPLETED is rejected with 422", async () => {
    const req = await createRequest({ status: "CANCELLED" });
    const res = await patchStatus(makeReq(req.id, { status: "COMPLETED" }), { params: params(req.id) });

    expect(res.status).toBe(422);
  });

  it("returns 404 for unknown request id", async () => {
    const res = await patchStatus(
      makeReq("00000000-0000-0000-0000-000000000000", { status: "CANCELLED" }),
      { params: params("00000000-0000-0000-0000-000000000000") }
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid status value", async () => {
    const req = await createRequest({ status: "PENDING" });
    const res = await patchStatus(makeReq(req.id, { status: "INVALID" }), { params: params(req.id) });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing status field", async () => {
    const req = await createRequest({ status: "PENDING" });
    const res = await patchStatus(makeReq(req.id, {}), { params: params(req.id) });

    expect(res.status).toBe(400);
  });
});
