import type { Server as HttpServer } from "node:http";
import type { Server as SocketServer } from "socket.io";
import { initSockets } from "../sockets/index.js";
import type { RideEventPayload } from "../sockets/socket.types.js";

let io: SocketServer | undefined;

export const attachSocketServer = (httpServer: HttpServer): SocketServer => {
  io = initSockets(httpServer);
  return io;
};

const getSocketServer = (): SocketServer => {
  if (!io) {
    throw new Error("Socket.io has not been attached to the HTTP server");
  }

  return io;
};

export const emitNewRide = (driverIds: string[], ride: RideEventPayload): void => {
  const socketServer = getSocketServer();
  for (const driverId of driverIds) {
    socketServer.to(`user:${driverId}`).emit("ride:new", ride);
  }
};

export const emitRideAccepted = (ride: RideEventPayload): void => {
  const rooms = [`ride:${ride.id}`, `user:${ride.riderId}`];
  if (ride.driverId) {
    rooms.push(`user:${ride.driverId}`);
  }
  getSocketServer().to(rooms).emit("ride:accepted", ride);
};

export const joinUserToRideRoom = async (userId: string, rideId: string): Promise<void> => {
  const sockets = await getSocketServer().in(`user:${userId}`).fetchSockets();
  await Promise.all(sockets.map((socket) => socket.join(`ride:${rideId}`)));
};

export const emitRideStatus = (
  ride: RideEventPayload,
  previousStatus: RideEventPayload["status"],
): void => {
  getSocketServer()
    .to(`ride:${ride.id}`)
    .emit("ride:status", { ride, previousStatus });
};

export const emitRideCancelled = (ride: RideEventPayload): void => {
  const rooms = [`ride:${ride.id}`, `user:${ride.riderId}`];
  if (ride.driverId) {
    rooms.push(`user:${ride.driverId}`);
  }

  getSocketServer().to(rooms).emit("ride:cancelled", ride);
};

export const emitDriverLocation = (
  rideId: string,
  payload: { driverId: string; lat: number; lng: number },
): void => {
  getSocketServer().to(`ride:${rideId}`).emit("driver:location", payload);
};

export const updateOnlineDriverRoom = async (
  userId: string,
  isOnline: boolean,
): Promise<void> => {
  const sockets = await getSocketServer().in(`user:${userId}`).fetchSockets();
  await Promise.all(
    sockets.map((socket) =>
      isOnline ? socket.join("drivers:online") : socket.leave("drivers:online"),
    ),
  );
};
