import type { Server as HttpServer } from "node:http";
import { Role } from "@prisma/client";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { verifyToken } from "../utils/jwt.js";
import { driverLocationSocketSchema, rideRoomSocketSchema } from "../validators/ride.validator.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket.types.js";

const locationUpdateTimes = new Map<string, number>();

const getAuthToken = (cookieHeader: string | undefined): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  if (!cookie) {
    return undefined;
  }

  try {
    return decodeURIComponent(cookie.slice("token=".length));
  } catch {
    return undefined;
  }
};

export const initSockets = (httpServer: HttpServer) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.CLIENT_URL,
        credentials: true,
      },
    },
  );

  io.use((socket, next) => {
    const token = getAuthToken(socket.handshake.headers.cookie);
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      next(new Error("Authentication required"));
      return;
    }

    void prisma.user
      .findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          role: true,
          driverProfile: { select: { isOnline: true } },
        },
      })
      .then((user) => {
        if (!user) {
          next(new Error("Authentication required"));
          return;
        }

        socket.data.user = { id: user.id, email: user.email, role: user.role };
        socket.data.isDriverOnline =
          user.role === Role.DRIVER && user.driverProfile?.isOnline === true;
        next();
      })
      .catch(() => next(new Error("Unable to authenticate socket connection")));
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    void socket.join(`user:${user.id}`);
    if (socket.data.isDriverOnline) {
      void socket.join("drivers:online");
    }

    socket.on("ride:join", (payload) => {
      const parsed = rideRoomSocketSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("socket:error", { message: "Invalid ride room request" });
        return;
      }

      void prisma.ride
        .findFirst({
          where: {
            id: parsed.data.rideId,
            OR: [{ riderId: user.id }, { driverId: user.id }],
          },
          select: { id: true },
        })
        .then((ride) => {
          if (!ride) {
            socket.emit("socket:error", { message: "Ride not found or access denied" });
            return;
          }

          return socket.join(`ride:${ride.id}`);
        })
        .catch(() => socket.emit("socket:error", { message: "Could not join ride room" }));
    });

    socket.on("ride:leave", (payload) => {
      const parsed = rideRoomSocketSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("socket:error", { message: "Invalid ride room request" });
        return;
      }

      void socket.leave(`ride:${parsed.data.rideId}`);
    });

    socket.on("driver:location", (payload) => {
      const parsed = driverLocationSocketSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("socket:error", { message: "Invalid driver location" });
        return;
      }

      if (user.role !== Role.DRIVER) {
        socket.emit("socket:error", { message: "Only drivers can send location updates" });
        return;
      }

      const now = Date.now();
      const lastUpdate = locationUpdateTimes.get(user.id) ?? 0;
      if (now - lastUpdate < 1000) {
        return;
      }

      locationUpdateTimes.set(user.id, now);
      void prisma.driverProfile
        .update({
          where: { userId: user.id },
          data: { currentLat: parsed.data.lat, currentLng: parsed.data.lng },
          select: { id: true },
        })
        .then(async () => {
          if (!parsed.data.rideId) {
            return;
          }

          const ride = await prisma.ride.findFirst({
            where: { id: parsed.data.rideId, driverId: user.id },
            select: { id: true },
          });

          if (ride) {
            io.to(`ride:${ride.id}`).emit("driver:location", {
              driverId: user.id,
              lat: parsed.data.lat,
              lng: parsed.data.lng,
            });
          }
        })
        .catch(() =>
          socket.emit("socket:error", { message: "Could not update driver location" }),
        );
    });

    socket.on("disconnect", () => {
      const connected = io.sockets.adapter.rooms.get(`user:${user.id}`);
      if (!connected || connected.size === 0) {
        locationUpdateTimes.delete(user.id);
      }
    });
  });

  return io;
};
