import { VehicleType } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

type VehiclePricing = {
  basePaise: number;
  perKmPaise: number;
  perMinutePaise: number;
  minimumFarePaise: number;
};

const pricing: Record<VehicleType, VehiclePricing> = {
  [VehicleType.BIKE]: {
    basePaise: 2000,
    perKmPaise: 800,
    perMinutePaise: 100,
    minimumFarePaise: 2000,
  },
  [VehicleType.AUTO]: {
    basePaise: 3000,
    perKmPaise: 1200,
    perMinutePaise: 150,
    minimumFarePaise: 3000,
  },
  [VehicleType.CAB]: {
    basePaise: 5000,
    perKmPaise: 1600,
    perMinutePaise: 200,
    minimumFarePaise: 5000,
  },
  [VehicleType.PREMIUM]: {
    basePaise: 8000,
    perKmPaise: 2400,
    perMinutePaise: 300,
    minimumFarePaise: 8000,
  },
};

export const toMinor = (amount: number, currency: "INR" | "USD" = "INR"): number => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(400, "Amount must be a non-negative finite number");
  }

  if (currency !== "INR" && currency !== "USD") {
    throw new AppError(400, "Currency must be INR or USD");
  }

  return Math.round(amount * 100);
};

export type FareQuote = {
  vehicleType: VehicleType;
  farePaise: number;
  fareINR: number;
  fareUSD: number;
};

export const calculateFare = (
  vehicleType: VehicleType,
  distanceKm: number,
  durationMin: number,
): FareQuote => {
  if (
    !Number.isFinite(distanceKm) ||
    distanceKm < 0 ||
    !Number.isFinite(durationMin) ||
    durationMin < 0
  ) {
    throw new AppError(400, "Route distance and duration must be non-negative finite numbers");
  }

  if (!Number.isFinite(env.USD_INR_RATE) || env.USD_INR_RATE <= 0) {
    throw new AppError(500, "USD_INR_RATE must be a positive number");
  }

  const vehiclePricing = pricing[vehicleType];
  const calculatedPaise =
    vehiclePricing.basePaise +
    vehiclePricing.perKmPaise * distanceKm +
    vehiclePricing.perMinutePaise * durationMin;
  const farePaise = Math.max(vehiclePricing.minimumFarePaise, Math.round(calculatedPaise));
  const fareINR = farePaise / 100;

  return {
    vehicleType,
    farePaise,
    fareINR,
    fareUSD: Math.round((fareINR / env.USD_INR_RATE) * 100) / 100,
  };
};

export const calculateAllFares = (distanceKm: number, durationMin: number): FareQuote[] =>
  Object.values(VehicleType).map((vehicleType) =>
    calculateFare(vehicleType, distanceKm, durationMin),
  );
