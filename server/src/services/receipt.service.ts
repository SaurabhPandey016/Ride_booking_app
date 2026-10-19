import { prisma } from "../config/prisma.js";
import { calculateFareBreakdown } from "./fare.service.js";
import { AppError } from "../utils/AppError.js";

export const getRideReceipt = async (rideId: string, userId: string) => {
  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [{ riderId: userId }, { driverId: userId }],
    },
    select: {
      vehicleType: true,
      pickupAddress: true,
      pickupLat: true,
      pickupLng: true,
      dropAddress: true,
      dropLat: true,
      dropLng: true,
      distanceKm: true,
      durationMin: true,
      farePaise: true,
      rider: { select: { name: true, email: true, phone: true } },
      driver: {
        select: {
          name: true,
          phone: true,
          driverProfile: {
            select: {
              vehicleType: true,
              vehicleModel: true,
              vehicleNumber: true,
            },
          },
        },
      },
      payment: {
        select: {
          receiptNumber: true,
          amountMinor: true,
          currency: true,
          status: true,
          createdAt: true,
          paidAt: true,
        },
      },
    },
  });
  if (!ride) {
    throw new AppError(404, "Ride receipt not found");
  }
  if (!ride.payment) {
    throw new AppError(404, "A receipt is not available before payment is initiated");
  }
  if (ride.payment.currency !== "INR" && ride.payment.currency !== "USD") {
    throw new AppError(409, "The payment currency is not supported for receipts");
  }
  if (!ride.driver || !ride.driver.driverProfile) {
    throw new AppError(409, "The assigned driver profile is not available");
  }

  const fareBreakdown = calculateFareBreakdown(
    ride.vehicleType,
    ride.distanceKm,
    ride.durationMin,
  );
  if (fareBreakdown.totalPaise !== ride.farePaise) {
    throw new AppError(409, "The stored ride fare does not match the fare calculation");
  }
  const wholeAmount = Math.floor(ride.payment.amountMinor / 100);
  const fractionAmount = String(ride.payment.amountMinor % 100).padStart(2, "0");

  return {
    receiptNumber: ride.payment.receiptNumber,
    date: (ride.payment.paidAt ?? ride.payment.createdAt).toISOString(),
    rider: ride.rider,
    driver: {
      name: ride.driver.name,
      phone: ride.driver.phone,
      vehicle: ride.driver.driverProfile,
    },
    pickup: {
      address: ride.pickupAddress,
      lat: ride.pickupLat,
      lng: ride.pickupLng,
    },
    drop: {
      address: ride.dropAddress,
      lat: ride.dropLat,
      lng: ride.dropLng,
    },
    distanceKm: ride.distanceKm,
    durationMin: ride.durationMin,
    fareBreakdown: {
      currency: "INR" as const,
      ...fareBreakdown,
    },
    payment: {
      currency: ride.payment.currency,
      totalMinor: ride.payment.amountMinor,
      totalAmount: `${wholeAmount}.${fractionAmount}`,
      status: ride.payment.status,
    },
  };
};
