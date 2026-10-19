import { Prisma, RideStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { reverse } from "./geocode.service.js";
import { calculateFare } from "./fare.service.js";
import { getRoute } from "./routing.service.js";
import { AppError } from "../utils/AppError.js";
import {
  emitNewRide,
  emitRideAccepted,
  emitRideCancelled,
  emitRideStatus,
  joinUserToRideRoom,
  updateOnlineDriverRoom,
} from "../utils/socket.js";
import type { Coordinates } from "../validators/maps.validator.js";
import type { CreateRideInput } from "../validators/ride.validator.js";
import type { RideEventPayload } from "../sockets/socket.types.js";

const activeStatuses: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.ACCEPTED,
  RideStatus.ARRIVED,
  RideStatus.IN_PROGRESS,
];

const allowedTransitions: Record<RideStatus, RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
  [RideStatus.ACCEPTED]: [RideStatus.ARRIVED, RideStatus.CANCELLED],
  [RideStatus.ARRIVED]: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
  [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
};

const assertTransitionAllowed = (from: RideStatus, to: RideStatus): void => {
  if (!allowedTransitions[from].includes(to)) {
    throw new AppError(409, `Cannot transition ride from ${from} to ${to}`);
  }
};

const rideSelect = {
  id: true,
  riderId: true,
  driverId: true,
  status: true,
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
  routeGeometry: true,
  requestedAt: true,
  acceptedAt: true,
  startedAt: true,
  completedAt: true,
  cancelledAt: true,
  cancelReason: true,
  rider: { select: { id: true, name: true, phone: true, avatarUrl: true } },
  driver: {
    select: {
      id: true,
      name: true,
      phone: true,
      avatarUrl: true,
      driverProfile: {
        select: {
          vehicleType: true,
          vehicleModel: true,
          vehicleNumber: true,
          ratingAvg: true,
        },
      },
    },
  },
} satisfies Prisma.RideSelect;

type RideDetails = Prisma.RideGetPayload<{ select: typeof rideSelect }>;

const toRideEvent = (ride: RideDetails): RideEventPayload => ({
  id: ride.id,
  riderId: ride.riderId,
  driverId: ride.driverId,
  status: ride.status,
  vehicleType: ride.vehicleType,
  pickupAddress: ride.pickupAddress,
  pickupLat: ride.pickupLat,
  pickupLng: ride.pickupLng,
  dropAddress: ride.dropAddress,
  dropLat: ride.dropLat,
  dropLng: ride.dropLng,
  distanceKm: ride.distanceKm,
  durationMin: ride.durationMin,
  farePaise: ride.farePaise,
  routeGeometry: ride.routeGeometry,
});

const findRideOrThrow = async (rideId: string): Promise<RideDetails> => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: rideSelect,
  });
  if (!ride) {
    throw new AppError(404, "Ride not found");
  }

  return ride;
};

const haversineKm = (from: Coordinates, to: Coordinates): number => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
};

const declinedRideIds = new Map<string, Set<string>>();

export const createRide = async (riderId: string, input: CreateRideInput) => {
  const currentRide = await prisma.ride.findFirst({
    where: { riderId, status: { in: activeStatuses } },
    select: { id: true },
  });
  if (currentRide) {
    throw new AppError(409, "You already have an active ride");
  }

  const [route, pickup, drop] = await Promise.all([
    getRoute(input.pickup, input.drop),
    reverse(input.pickup.lat, input.pickup.lng),
    reverse(input.drop.lat, input.drop.lng),
  ]);
  const fare = calculateFare(input.vehicleType, route.distanceKm, route.durationMin);

  let ride: RideDetails;
  try {
    ride = await prisma.$transaction(
      async (transaction) => {
        const activeRide = await transaction.ride.findFirst({
          where: { riderId, status: { in: activeStatuses } },
          select: { id: true },
        });
        if (activeRide) {
          throw new AppError(409, "You already have an active ride");
        }

        return transaction.ride.create({
          data: {
            riderId,
            vehicleType: input.vehicleType,
            pickupAddress: pickup.label,
            pickupLat: input.pickup.lat,
            pickupLng: input.pickup.lng,
            dropAddress: drop.label,
            dropLat: input.drop.lat,
            dropLng: input.drop.lng,
            distanceKm: route.distanceKm,
            durationMin: route.durationMin,
            farePaise: fare.farePaise,
            routeGeometry: route.geometry,
          },
          select: rideSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new AppError(409, "You already have an active ride");
    }
    throw error;
  }

  const nearbyProfiles = await prisma.driverProfile.findMany({
    where: {
      isOnline: true,
      vehicleType: input.vehicleType,
      currentLat: { not: null },
      currentLng: { not: null },
    },
    select: { userId: true, currentLat: true, currentLng: true },
  });
  const nearbyDriverIds = nearbyProfiles
    .filter(
      (profile) =>
        profile.currentLat !== null &&
        profile.currentLng !== null &&
        haversineKm(input.pickup, {
          lat: profile.currentLat,
          lng: profile.currentLng,
        }) <= 15,
    )
    .map((profile) => profile.userId);

  emitNewRide(nearbyDriverIds, toRideEvent(ride));
  return ride;
};

export const getActiveRide = async (userId: string, role: Role) => {
  const where =
    role === Role.RIDER
      ? { riderId: userId, status: { in: activeStatuses } }
      : { driverId: userId, status: { in: activeStatuses } };

  return prisma.ride.findFirst({
    where,
    orderBy: { requestedAt: "desc" },
    select: rideSelect,
  });
};

export const getRideHistory = async (
  userId: string,
  role: Role,
  page: number,
  limit: number,
) => {
  const where =
    role === Role.RIDER ? { riderId: userId } : { driverId: userId };
  const [rides, total] = await prisma.$transaction([
    prisma.ride.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: rideSelect,
    }),
    prisma.ride.count({ where }),
  ]);

  return {
    rides,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getRideForParticipant = async (rideId: string, userId: string) => {
  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [{ riderId: userId }, { driverId: userId }],
    },
    select: rideSelect,
  });
  if (!ride) {
    throw new AppError(404, "Ride not found");
  }

  return ride;
};

const requireOnlineDriver = async (driverId: string) => {
  const profile = await prisma.driverProfile.findUnique({
    where: { userId: driverId },
    select: { isOnline: true, currentLat: true, currentLng: true, vehicleType: true },
  });

  if (!profile || !profile.isOnline) {
    throw new AppError(409, "You must be online to perform this action");
  }

  return profile;
};

export const getDriverRequests = async (driverId: string) => {
  const profile = await requireOnlineDriver(driverId);
  if (profile.currentLat === null || profile.currentLng === null) {
    throw new AppError(409, "Set your current location before viewing ride requests");
  }

  const ignoredIds = [...(declinedRideIds.get(driverId) ?? new Set<string>())];
  const requestedRides = await prisma.ride.findMany({
    where: {
      status: RideStatus.REQUESTED,
      vehicleType: profile.vehicleType,
      ...(ignoredIds.length > 0 ? { id: { notIn: ignoredIds } } : {}),
    },
    orderBy: { requestedAt: "asc" },
    select: rideSelect,
  });

  const driverLocation = { lat: profile.currentLat, lng: profile.currentLng };
  return requestedRides.filter(
    (ride) =>
      haversineKm(driverLocation, { lat: ride.pickupLat, lng: ride.pickupLng }) <= 15,
  );
};

export const setDriverStatus = async (
  driverId: string,
  isOnline: boolean,
  lat?: number,
  lng?: number,
) => {
  const profile = await prisma.driverProfile.findUnique({
    where: { userId: driverId },
    select: { userId: true },
  });
  if (!profile) {
    throw new AppError(404, "Driver profile not found");
  }

  const updated = await prisma.driverProfile.update({
    where: { userId: driverId },
    data: {
      isOnline,
      ...(lat !== undefined && lng !== undefined
        ? { currentLat: lat, currentLng: lng }
        : {}),
    },
    select: {
      isOnline: true,
      currentLat: true,
      currentLng: true,
    },
  });

  await updateOnlineDriverRoom(driverId, isOnline);
  return updated;
};

export const acceptRide = async (rideId: string, driverId: string) => {
  assertTransitionAllowed(RideStatus.REQUESTED, RideStatus.ACCEPTED);
  const driverProfile = await requireOnlineDriver(driverId);
  const requestedRide = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { vehicleType: true },
  });
  if (!requestedRide) {
    throw new AppError(404, "Ride not found");
  }
  if (requestedRide.vehicleType !== driverProfile.vehicleType) {
    throw new AppError(409, "Your vehicle type does not match this ride");
  }

  const update = await prisma.ride.updateMany({
    where: {
      id: rideId,
      status: RideStatus.REQUESTED,
      driverId: null,
    },
    data: {
      status: RideStatus.ACCEPTED,
      driverId,
      acceptedAt: new Date(),
    },
  });

  if (update.count === 0) {
    throw new AppError(409, "Ride already taken");
  }

  const ride = await findRideOrThrow(rideId);
  const eventRide = toRideEvent(ride);
  await joinUserToRideRoom(driverId, rideId);
  emitRideAccepted(eventRide);
  emitRideStatus(eventRide, RideStatus.REQUESTED);
  return ride;
};

export const declineRide = async (rideId: string, driverId: string): Promise<void> => {
  await requireOnlineDriver(driverId);
  const ride = await prisma.ride.findFirst({
    where: { id: rideId, status: RideStatus.REQUESTED, driverId: null },
    select: { id: true },
  });
  if (!ride) {
    throw new AppError(409, "Ride is no longer available");
  }

  const declined = declinedRideIds.get(driverId) ?? new Set<string>();
  declined.add(rideId);
  declinedRideIds.set(driverId, declined);
};

const transitionRide = async (
  rideId: string,
  userId: string,
  targetStatus: RideStatus,
  cancelReason?: string,
) => {
  const currentRide = await findRideOrThrow(rideId);
  assertTransitionAllowed(currentRide.status, targetStatus);

  const isDriverTransition = new Set<RideStatus>([
    RideStatus.ARRIVED,
    RideStatus.IN_PROGRESS,
    RideStatus.COMPLETED,
  ]).has(targetStatus);
  const participantWhere =
    targetStatus === RideStatus.CANCELLED
      ? {
          OR: [{ riderId: userId }, { driverId: userId }],
        }
      : isDriverTransition
        ? { driverId: userId }
        : { riderId: userId };

  if (
    (isDriverTransition && currentRide.driverId !== userId) ||
    (targetStatus === RideStatus.CANCELLED &&
      currentRide.riderId !== userId &&
      currentRide.driverId !== userId)
  ) {
    throw new AppError(403, "You are not a participant in this ride");
  }

  const where = {
    id: rideId,
    status: currentRide.status,
    ...participantWhere,
  };
  const updateData: Prisma.RideUpdateManyMutationInput = {
    status: targetStatus,
    ...(targetStatus === RideStatus.IN_PROGRESS ? { startedAt: new Date() } : {}),
    ...(targetStatus === RideStatus.COMPLETED ? { completedAt: new Date() } : {}),
    ...(targetStatus === RideStatus.CANCELLED
      ? { cancelledAt: new Date(), cancelReason }
      : {}),
  };

  const updatedRide = await prisma.$transaction(async (transaction) => {
    const update = await transaction.ride.updateMany({ where, data: updateData });
    if (update.count === 0) {
      throw new AppError(409, "Ride state changed; refresh and try again");
    }

    return transaction.ride.findUniqueOrThrow({
      where: { id: rideId },
      select: rideSelect,
    });
  });

  const eventRide = toRideEvent(updatedRide);
  if (targetStatus === RideStatus.CANCELLED) {
    emitRideCancelled(eventRide);
  }
  emitRideStatus(eventRide, currentRide.status);
  return updatedRide;
};

export const markRideArrived = (rideId: string, driverId: string) =>
  transitionRide(rideId, driverId, RideStatus.ARRIVED);

export const startRide = (rideId: string, driverId: string) =>
  transitionRide(rideId, driverId, RideStatus.IN_PROGRESS);

export const completeRide = (rideId: string, driverId: string) =>
  transitionRide(rideId, driverId, RideStatus.COMPLETED);

export const cancelRide = (rideId: string, userId: string, reason: string) =>
  transitionRide(rideId, userId, RideStatus.CANCELLED, reason);

export const getDriverEarnings = async (driverId: string) => {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const mondayOffset = (todayStart.getUTCDay() + 6) % 7;
  const weekStart = new Date(todayStart.getTime() - mondayOffset * 24 * 60 * 60 * 1000);

  const [paidRides, tripCount] = await Promise.all([
    prisma.ride.findMany({
      where: {
        driverId,
        status: RideStatus.COMPLETED,
        payment: { status: "SUCCEEDED" },
      },
      select: { farePaise: true, completedAt: true },
    }),
    prisma.ride.count({
      where: { driverId, status: RideStatus.COMPLETED },
    }),
  ]);

  const payoutBetween = (from: Date, until?: Date) =>
    paidRides.reduce((total, ride) => {
      if (
        !ride.completedAt ||
        ride.completedAt < from ||
        (until !== undefined && ride.completedAt >= until)
      ) {
        return total;
      }

      return total + Math.floor((ride.farePaise * 85) / 100);
    }, 0);

  return {
    todayPaise: payoutBetween(todayStart),
    thisWeekPaise: payoutBetween(weekStart),
    allTimePaise: payoutBetween(new Date(0)),
    tripCount,
  };
};
