"use client";

import { io, type Socket } from "socket.io-client";
import { apiBaseUrl } from "./api";

let rideSocket: Socket | null = null;

export const getRideSocket = (): Socket => {
  if (typeof window === "undefined") {
    throw new Error("RideX sockets can only be created in the browser");
  }
  if (!rideSocket) {
    rideSocket = io(apiBaseUrl.replace(/\/api\/?$/, ""), {
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
