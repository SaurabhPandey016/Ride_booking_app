import type { Prisma, Role, RideStatus, VehicleType } from "@prisma/client";

export type AuthenticatedSocketUser = {
  id: string;
  email: string;
  role: Role;
};

export type SocketData = {
  user: AuthenticatedSocketUser;
  isDriverOnline: boolean;
};

export type RideEventPayload = {
  id: string;
  riderId: string;
  driverId: string | null;
  status: RideStatus;
  vehicleType: VehicleType;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  distanceKm: number;
  durationMin: number;
  farePaise: number;
  routeGeometry: Prisma.JsonValue | null;
};

export interface ClientToServerEvents {
  "driver:location": (payload: {
    lat: number;
    lng: number;
    rideId?: string;
  }) => void;
  "ride:join": (payload: { rideId: string }) => void;
  "ride:leave": (payload: { rideId: string }) => void;
}

export interface ServerToClientEvents {
  "ride:new": (ride: RideEventPayload) => void;
  "ride:accepted": (ride: RideEventPayload) => void;
  "ride:status": (payload: { ride: RideEventPayload; previousStatus: RideStatus }) => void;
  "ride:cancelled": (ride: RideEventPayload) => void;
  "driver:location": (payload: { driverId: string; lat: number; lng: number }) => void;
  "socket:error": (payload: { message: string }) => void;
}
