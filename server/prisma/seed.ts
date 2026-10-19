import "../src/config/env.js";
import bcrypt from "bcryptjs";
import { Role, VehicleType } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";

const seed = async () => {
  const passwordHash = await bcrypt.hash("Password@123", 12);

  await prisma.user.upsert({
    where: { email: "rider@example.com" },
    update: {
      name: "Test Rider",
      phone: "+15550001001",
      passwordHash,
      role: Role.RIDER,
    },
    create: {
      name: "Test Rider",
      email: "rider@example.com",
      phone: "+15550001001",
      passwordHash,
      role: Role.RIDER,
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: "driver@example.com" },
    update: {
      name: "Test Driver",
      phone: "+15550001002",
      passwordHash,
      role: Role.DRIVER,
    },
    create: {
      name: "Test Driver",
      email: "driver@example.com",
      phone: "+15550001002",
      passwordHash,
      role: Role.DRIVER,
    },
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {
      vehicleType: VehicleType.CAB,
      vehicleModel: "Test Sedan",
      vehicleNumber: "TEST-001",
    },
    create: {
      userId: driver.id,
      vehicleType: VehicleType.CAB,
      vehicleModel: "Test Sedan",
      vehicleNumber: "TEST-001",
    },
  });

  console.info("Seeded test rider and driver.");
};

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
