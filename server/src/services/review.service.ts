import { PaymentStatus, Prisma, RideStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export const createReview = async (
  riderId: string,
  rideId: string,
  rating: number,
  comment?: string,
) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const ride = await transaction.ride.findUnique({
        where: { id: rideId },
        select: {
          riderId: true,
          driverId: true,
          status: true,
          payment: { select: { status: true } },
        },
      });

      if (!ride || ride.riderId !== riderId) {
        throw new AppError(404, "Completed ride not found");
      }
      if (ride.status !== RideStatus.COMPLETED || ride.payment?.status !== PaymentStatus.SUCCEEDED) {
        throw new AppError(409, "A review is allowed only for a completed, paid ride");
      }
      if (!ride.driverId) {
        throw new AppError(409, "The completed ride has no assigned driver");
      }

      const review = await transaction.review.create({
        data: {
          rideId,
          riderId,
          driverId: ride.driverId,
          rating,
          comment,
        },
        select: {
          id: true,
          rideId: true,
          riderId: true,
          driverId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      });

      const updatedProfiles = await transaction.$executeRaw`
        UPDATE "DriverProfile"
        SET "ratingAvg" = (("ratingAvg" * "ratingCount") + ${rating}) / ("ratingCount" + 1),
            "ratingCount" = "ratingCount" + 1
        WHERE "userId" = ${ride.driverId}
      `;
      if (updatedProfiles !== 1) {
        throw new AppError(409, "Driver profile is not available");
      }

      return review;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "This ride has already been reviewed");
    }

    throw error;
  }
};

export const getDriverReviews = async (
  driverId: string,
  page: number,
  limit: number,
) => {
  const profile = await prisma.driverProfile.findUnique({
    where: { userId: driverId },
    select: { userId: true },
  });
  if (!profile) {
    throw new AppError(404, "Driver not found");
  }

  const where = { driverId };
  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rideId: true,
        rating: true,
        comment: true,
        createdAt: true,
        rider: { select: { name: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getRideReview = async (rideId: string, userId: string) => {
  const review = await prisma.review.findFirst({
    where: {
      rideId,
      ride: { OR: [{ riderId: userId }, { driverId: userId }] },
    },
    select: {
      id: true,
      rideId: true,
      riderId: true,
      driverId: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  });
  if (!review) {
    throw new AppError(404, "Ride review not found");
  }

  return review;
};
