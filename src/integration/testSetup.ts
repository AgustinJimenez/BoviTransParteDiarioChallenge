import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Truncate all data tables before each test for a clean slate
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE transport_requests, trucks, system_config RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
