import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Trucks
  const trucks = await Promise.all([
    prisma.truck.upsert({
      where: { plate: "AB-123-CD" },
      update: {},
      create: { plate: "AB-123-CD", maxCapacity: 30, fuelConsumption: 0.45, isActive: true },
    }),
    prisma.truck.upsert({
      where: { plate: "EF-456-GH" },
      update: {},
      create: { plate: "EF-456-GH", maxCapacity: 20, fuelConsumption: 0.38, isActive: true },
    }),
    prisma.truck.upsert({
      where: { plate: "IJ-789-KL" },
      update: {},
      create: { plate: "IJ-789-KL", maxCapacity: 40, fuelConsumption: 0.55, isActive: true },
    }),
    prisma.truck.upsert({
      where: { plate: "MN-012-OP" },
      update: {},
      create: { plate: "MN-012-OP", maxCapacity: 25, fuelConsumption: 0.42, isActive: false },
    }),
  ]);

  // Transport requests
  await prisma.transportRequest.createMany({
    skipDuplicates: true,
    data: [
      {
        requesterName: "Juan Pérez",
        requesterPhone: "+54 9 341 555-1234",
        cattleCount: 25,
        origin: "Rosario, Santa Fe",
        destination: "Córdoba Capital",
        originLat: -32.9442,
        originLng: -60.6505,
        destinationLat: -31.4201,
        destinationLng: -64.1888,
        status: "PENDING",
      },
      {
        requesterName: "María González",
        requesterPhone: "+54 9 11 555-5678",
        cattleCount: 45,
        origin: "Buenos Aires",
        destination: "Mar del Plata, Buenos Aires",
        originLat: -34.6037,
        originLng: -58.3816,
        destinationLat: -38.0023,
        destinationLng: -57.5575,
        status: "PENDING",
      },
      {
        requesterName: "Carlos Rodríguez",
        requesterPhone: "+54 9 351 555-9012",
        cattleCount: 18,
        origin: "Córdoba Capital",
        destination: "Mendoza Capital",
        originLat: -31.4201,
        originLng: -64.1888,
        destinationLat: -32.8908,
        destinationLng: -68.8272,
        status: "ASSIGNED",
        assignedTruckId: trucks[0].id,
        distanceKm: 680.5,
        fuelCost: 138.7,
      },
      {
        requesterName: "Ana Martínez",
        requesterPhone: "+54 9 221 555-3456",
        cattleCount: 15,
        origin: "La Plata, Buenos Aires",
        destination: "Bahía Blanca, Buenos Aires",
        originLat: -34.9215,
        originLng: -57.9545,
        destinationLat: -38.7183,
        destinationLng: -62.2663,
        status: "ASSIGNED",
        assignedTruckId: trucks[1].id,
        distanceKm: 650.2,
        fuelCost: 93.63,
      },
      {
        requesterName: "Roberto Silva",
        requesterPhone: "+54 9 387 555-7890",
        cattleCount: 35,
        origin: "Salta Capital",
        destination: "Tucumán Capital",
        originLat: -24.7859,
        originLng: -65.4117,
        destinationLat: -26.8083,
        destinationLng: -65.2176,
        status: "COMPLETED",
        assignedTruckId: trucks[2].id,
        distanceKm: 310.8,
        fuelCost: 171.44,
      },
    ],
  });

  // System config
  await prisma.systemConfig.upsert({
    where: { key: "fuel_price_per_liter" },
    update: {},
    create: { key: "fuel_price_per_liter", value: "1250" },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
