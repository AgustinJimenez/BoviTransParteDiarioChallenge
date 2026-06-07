import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/transport-requests/[id]/assign/route";
import { createRequest, createTruck, seedFuelPrice } from "./helpers";

const url = (id: string) => `http://localhost/api/transport-requests/${id}/assign`;

const makeReq = (id: string, body: object) =>
  new NextRequest(url(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const params = (id: string) => Promise.resolve({ id });

// Pre-seeded Asunción → Encarnación so geocoding/OSRM are never called
const GEO = {
  originLat: -25.2867,
  originLng: -57.6478,
  destinationLat: -27.3364,
  destinationLng: -55.8675,
  distanceKm: 310.5,
};

describe("PATCH /api/transport-requests/[id]/assign", () => {
  it("assigns truck to PENDING request — returns 200 with ASSIGNED status", async () => {
    const truck = await createTruck();
    const req   = await createRequest({ ...GEO });

    const res  = await PATCH(makeReq(req.id, { truckId: truck.id }), { params: params(req.id) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("ASSIGNED");
    expect(json.data.assignedTruck.id).toBe(truck.id);
    expect(json.error).toBeNull();
  });

  it("calculates fuel cost using DB fuel price", async () => {
    await seedFuelPrice(7500);
    const truck = await createTruck({ fuelConsumption: 0.45 });
    const req   = await createRequest({ ...GEO, cattleCount: 20 });

    const res  = await PATCH(makeReq(req.id, { truckId: truck.id }), { params: params(req.id) });
    const json = await res.json();

    // 310.5 × 0.45 × 7500 = 1.047.937,5
    expect(json.data.fuelCost).toBeCloseTo(310.5 * 0.45 * 7500, 0);
    expect(typeof json.data.fuelCost).toBe("number");
  });

  it("uses default fuel price (1250) when no config is set", async () => {
    const truck = await createTruck({ fuelConsumption: 0.45 });
    const req   = await createRequest({ ...GEO });

    const res  = await PATCH(makeReq(req.id, { truckId: truck.id }), { params: params(req.id) });
    const json = await res.json();

    expect(json.data.fuelCost).toBeCloseTo(310.5 * 0.45 * 1250, 0);
  });

  it("returns capacityWarning null when cattle <= truck capacity", async () => {
    const truck = await createTruck({ maxCapacity: 30 });
    const req   = await createRequest({ ...GEO, cattleCount: 20 });

    const res  = await PATCH(makeReq(req.id, { truckId: truck.id }), { params: params(req.id) });
    const json = await res.json();

    expect(json.capacityWarning).toBeNull();
  });

  it("returns capacityWarning with tripsNeeded when cattle > capacity — does not block", async () => {
    const truck = await createTruck({ maxCapacity: 20 });
    const req   = await createRequest({ ...GEO, cattleCount: 45 });

    const res  = await PATCH(makeReq(req.id, { truckId: truck.id }), { params: params(req.id) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("ASSIGNED");
    expect(json.capacityWarning).toMatchObject({ exceeded: true, tripsNeeded: 3 });
  });

  it("can reassign a different truck to an ASSIGNED request", async () => {
    const truck1 = await createTruck({ plate: "AA-111-BB" });
    const truck2 = await createTruck({ plate: "CC-222-DD" });
    const req    = await createRequest({ ...GEO, status: "ASSIGNED", assignedTruckId: truck1.id });

    const res  = await PATCH(makeReq(req.id, { truckId: truck2.id }), { params: params(req.id) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.assignedTruck.plate).toBe("CC-222-DD");
  });

  it("serializes all Decimal fields as numbers", async () => {
    const truck = await createTruck({ fuelConsumption: 0.38 });
    const req   = await createRequest({ ...GEO });

    const res  = await PATCH(makeReq(req.id, { truckId: truck.id }), { params: params(req.id) });
    const json = await res.json();

    expect(typeof json.data.distanceKm).toBe("number");
    expect(typeof json.data.fuelCost).toBe("number");
    expect(typeof json.data.assignedTruck.fuelConsumption).toBe("number");
    expect(typeof json.data.originLat).toBe("number");
    expect(typeof json.data.destinationLng).toBe("number");
  });

  it("returns 404 for unknown request id", async () => {
    const truck = await createTruck();
    const res   = await PATCH(
      makeReq("00000000-0000-0000-0000-000000000000", { truckId: truck.id }),
      { params: params("00000000-0000-0000-0000-000000000000") }
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown truck id", async () => {
    const req = await createRequest({ ...GEO });
    const res = await PATCH(
      makeReq(req.id, { truckId: "00000000-0000-0000-0000-000000000000" }),
      { params: params(req.id) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 422 for inactive truck", async () => {
    const truck = await createTruck({ isActive: false });
    const req   = await createRequest({ ...GEO });

    const res = await PATCH(makeReq(req.id, { truckId: truck.id }), { params: params(req.id) });
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/inactivo/i);
  });

  it("returns 422 when trying to assign to a COMPLETED request", async () => {
    const truck = await createTruck();
    const req   = await createRequest({ status: "COMPLETED", assignedTruckId: truck.id });

    const truck2 = await createTruck({ plate: "ZZ-999-ZZ" });
    const res    = await PATCH(makeReq(req.id, { truckId: truck2.id }), { params: params(req.id) });
    expect(res.status).toBe(422);
  });

  it("returns 400 for missing truckId", async () => {
    const req = await createRequest();
    const res = await PATCH(makeReq(req.id, {}), { params: params(req.id) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty truckId string", async () => {
    const req = await createRequest();
    const res = await PATCH(makeReq(req.id, { truckId: "" }), { params: params(req.id) });
    expect(res.status).toBe(400);
  });
});
