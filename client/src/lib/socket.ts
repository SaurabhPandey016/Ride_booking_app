"use client";

import { io, type Socket } from "socket.io-client";

let rideSocket: Socket | null = null;

export const getRideSocket = (): Socket => {
  if (typeof window === "undefined") {
    throw new Error("RideX sockets can only be created in the browser");
  }
  if (!rideSocket) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    rideSocket = io(apiUrl.replace(/\/api\/?$/, ""), {
      autoConnect: false,
      withCredentials: true,
    });
  }

  return rideSocket;
};

export const disconnectRideSocket = (): void => {
  rideSocket?.disconnect();
  rideSocket = null;
};
