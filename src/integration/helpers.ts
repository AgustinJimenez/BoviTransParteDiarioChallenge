import { prisma } from "@/lib/prisma";

export const seedFuelPrice = async (price = 7500) => {
  await prisma.systemConfig.create({ data: { key: "fuel_price_per_liter", value: String(price) } });
};

export const createTruck = async (overrides: Partial<{
  plate: string;
  maxCapacity: number;
  fuelConsumption: number;
  isActive: boolean;
}> = {}) => {
  return prisma.truck.create({
    data: {
      plate:           overrides.plate           ?? `TEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      maxCapacity:     overrides.maxCapacity     ?? 30,
      fuelConsumption: overrides.fuelConsumption ?? 0.45,
      isActive:        overrides.isActive        ?? true,
    },
  });
};

export const createRequest = async (overrides: Partial<{
  requesterName:  string;
  requesterPhone: string;
  cattleCount:    number;
  origin:         string;
  destination:    string;
  status:         "PENDING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  assignedTruckId: string;
  distanceKm:     number;
  fuelCost:       number;
  originLat:      number;
  originLng:      number;
  destinationLat: number;
  destinationLng: number;
}> = {}) => {
  return prisma.transportRequest.create({
    data: {
      requesterName:   overrides.requesterName  ?? "Juan Pérez",
      requesterPhone:  overrides.requesterPhone,
      cattleCount:     overrides.cattleCount    ?? 20,
      origin:          overrides.origin         ?? "Rosario, Santa Fe",
      destination:     overrides.destination    ?? "Córdoba Capital",
      status:          overrides.status         ?? "PENDING",
      assignedTruckId: overrides.assignedTruckId,
      distanceKm:      overrides.distanceKm,
      fuelCost:        overrides.fuelCost,
      originLat:       overrides.originLat,
      originLng:       overrides.originLng,
      destinationLat:  overrides.destinationLat,
      destinationLng:  overrides.destinationLng,
    },
    include: { assignedTruck: true },
  });
};
