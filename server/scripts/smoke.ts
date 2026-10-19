import "../src/config/env.js";
import { Role, VehicleType } from "@prisma/client";
import { createServer } from "node:http";
import { prisma } from "../src/config/prisma.js";
import app from "../src/app.js";
import { attachSocketServer } from "../src/utils/socket.js";
import {
  io as createSocketClient,
  type Socket as ClientSocket,
} from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../src/sockets/socket.types.js";

type SmokeSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

const requireStatus = (response: Response, expectedStatus: number, step: string) => {
  if (response.status !== expectedStatus) {
    throw new Error(`${step} failed: expected HTTP ${expectedStatus}, received ${response.status}`);
  }
};

const readAuthCookie = (response: Response): string => {
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .find((header) => header.startsWith("token="));

  if (!cookie) {
    throw new Error("The response did not set the auth cookie");
  }

  return cookie;
};

const waitForSocketConnect = (socket: SmokeSocket): Promise<void> =>
  new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => reject(new Error("Socket connection timed out")), 10_000);
    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    socket.connect();
  });

const waitForSocketEvent = (
  socket: SmokeSocket,
  event: "ride:new" | "ride:accepted" | "ride:status" | "driver:location",
  matches: (payload: unknown) => boolean = () => true,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for socket event ${event}`));
    }, 15_000);

    const handler = (payload: unknown) => {
      if (!matches(payload)) {
        return;
      }
      clearTimeout(timeout);
      socket.off(event, handler);
      resolve(payload);
    };

    socket.on(event, handler);
  });

const runSmoke = async () => {
  const server = createServer(app);
  const io = attachSocketServer(server);
  const sockets: SmokeSocket[] = [];

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
      server.listen(0, "127.0.0.1");
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Could not determine the local server address");
    }

    const baseUrl = `http://127.0.0.1:${address.port}/api/auth`;
    const email = `smoke-${Date.now()}@example.com`;
    const password = "SmokeTest9";

    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Smoke Test Rider",
        email,
        phone: "+15550001999",
        password,
        role: Role.RIDER,
      }),
    });
    requireStatus(registerResponse, 201, "Register");
    let cookie = readAuthCookie(registerResponse);
    console.info("PASS register rider");

    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    requireStatus(loginResponse, 200, "Login");
    cookie = readAuthCookie(loginResponse);
    const riderCookie = cookie;
    console.info("PASS login");

    const meResponse = await fetch(`${baseUrl}/me`, {
      headers: { cookie },
    });
    requireStatus(meResponse, 200, "Authenticated /me");
    console.info("PASS authenticated /me");

    const logoutResponse = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { cookie },
    });
    requireStatus(logoutResponse, 200, "Logout");
    cookie = readAuthCookie(logoutResponse);
    console.info("PASS logout");

    const loggedOutMeResponse = await fetch(`${baseUrl}/me`, {
      headers: { cookie },
    });
    requireStatus(loggedOutMeResponse, 401, "Logged-out /me");
    console.info("PASS logged-out /me returns 401");

    const driverEmail = `smoke-driver-${Date.now()}@example.com`;
    const driverRegisterResponse = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Smoke Test Driver",
        email: driverEmail,
        phone: "+15550001998",
        password,
        role: Role.DRIVER,
        vehicleType: "CAB",
        vehicleModel: "Smoke Sedan",
        vehicleNumber: `SMOKE-${Date.now()}`,
      }),
    });
    requireStatus(driverRegisterResponse, 201, "Register driver");
    cookie = readAuthCookie(driverRegisterResponse);
    console.info("PASS register driver profile");

    const updateProfileResponse = await fetch(`${baseUrl}/me`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ vehicleModel: "Updated Smoke Sedan" }),
    });
    requireStatus(updateProfileResponse, 200, "Update driver profile");
    console.info("PASS update driver vehicle profile");
    const driverCookie = cookie;

    const secondDriverRegisterResponse = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Smoke Test Driver Two",
        email: `smoke-driver-two-${Date.now()}@example.com`,
        phone: "+15550001997",
        password,
        role: Role.DRIVER,
        vehicleType: VehicleType.CAB,
        vehicleModel: "Smoke Sedan Two",
        vehicleNumber: `SMOKE2-${Date.now()}`,
      }),
    });
    requireStatus(secondDriverRegisterResponse, 201, "Register second driver");
    const secondDriverCookie = readAuthCookie(secondDriverRegisterResponse);

    const pickupLocation = { lat: 28.6139, lng: 77.209 };
    for (const driverSession of [driverCookie, secondDriverCookie]) {
      const onlineResponse = await fetch(
        `http://127.0.0.1:${address.port}/api/driver/status`,
        {
          method: "POST",
          headers: { "content-type": "application/json", cookie: driverSession },
          body: JSON.stringify({ isOnline: true, ...pickupLocation }),
        },
      );
      requireStatus(onlineResponse, 200, "Set driver online");
    }

    const searchResponse = await fetch(
      `${new URL("/api/maps/search", `http://127.0.0.1:${address.port}`).toString()}?q=Rewa`,
      { headers: { cookie } },
    );
    requireStatus(searchResponse, 200, "Location search");
    const searchResult = (await searchResponse.json()) as {
      data: { results: Array<{ label: string; lat: number; lng: number }> };
    };
    console.info("Location search result:", JSON.stringify(searchResult.data.results));

    const trip = {
      pickup: { lat: 28.6139, lng: 77.209 },
      drop: { lat: 27.1767, lng: 78.0081 },
    };
    const reverseResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/maps/reverse?lat=${trip.pickup.lat}&lng=${trip.pickup.lng}`,
      { headers: { cookie } },
    );
    requireStatus(reverseResponse, 200, "Reverse geocoding");
    const reverseResult = (await reverseResponse.json()) as {
      data: { place: { label: string; lat: number; lng: number } };
    };
    console.info("Reverse geocode result:", JSON.stringify(reverseResult.data.place));

    const routeResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/maps/route`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify(trip),
      },
    );
    requireStatus(routeResponse, 200, "Route calculation");
    const routeResult = (await routeResponse.json()) as {
      data: {
        route: {
          distanceKm: number;
          durationMin: number;
          geometry: { type: string; coordinates: [number, number][] };
        };
      };
    };
    console.info(
      "Route result:",
      JSON.stringify({
        distanceKm: routeResult.data.route.distanceKm,
        durationMin: routeResult.data.route.durationMin,
        geometryType: routeResult.data.route.geometry.type,
        coordinateCount: routeResult.data.route.geometry.coordinates.length,
      }),
    );

    const estimateResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/rides/estimate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify(trip),
      },
    );
    requireStatus(estimateResponse, 200, "Ride estimate");
    const estimateResult = (await estimateResponse.json()) as {
      data: {
        route: { distanceKm: number; durationMin: number };
        fares: Array<{
          vehicleType: string;
          farePaise: number;
          fareINR: number;
          fareUSD: number;
        }>;
      };
    };
    console.info(
      "Ride estimate result:",
      JSON.stringify({
        route: {
          distanceKm: estimateResult.data.route.distanceKm,
          durationMin: estimateResult.data.route.durationMin,
        },
        fares: estimateResult.data.fares,
      }),
    );

    const socketUrl = `http://127.0.0.1:${address.port}`;
    const riderSocket = createSocketClient(socketUrl, {
      autoConnect: false,
      extraHeaders: { cookie: riderCookie },
    }) as SmokeSocket;
    const driverSocket = createSocketClient(socketUrl, {
      autoConnect: false,
      extraHeaders: { cookie: driverCookie },
    }) as SmokeSocket;
    const secondDriverSocket = createSocketClient(socketUrl, {
      autoConnect: false,
      extraHeaders: { cookie: secondDriverCookie },
    }) as SmokeSocket;
    sockets.push(riderSocket, driverSocket, secondDriverSocket);
    const socketEvents: string[] = [];
    riderSocket.on("ride:accepted", () => socketEvents.push("rider:ride:accepted"));
    riderSocket.on("ride:status", (payload) =>
      socketEvents.push(`rider:ride:status:${payload.ride.status}`),
    );
    driverSocket.on("ride:new", () => socketEvents.push("driver:ride:new"));
    driverSocket.on("ride:accepted", () => socketEvents.push("driver:ride:accepted"));
    driverSocket.on("ride:status", (payload) =>
      socketEvents.push(`driver:ride:status:${payload.ride.status}`),
    );
    riderSocket.on("driver:location", () => socketEvents.push("rider:driver:location"));
    secondDriverSocket.on("ride:new", () => socketEvents.push("second-driver:ride:new"));

    await Promise.all(sockets.map(waitForSocketConnect));
    console.info("PASS authenticated Socket.io connections");

    const rideNewForDriver = waitForSocketEvent(driverSocket, "ride:new");
    const rideNewForSecondDriver = waitForSocketEvent(secondDriverSocket, "ride:new");
    const rideCreateResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/rides`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: riderCookie },
        body: JSON.stringify({
          pickup: pickupLocation,
          drop: { lat: 27.1767, lng: 78.0081 },
          vehicleType: VehicleType.CAB,
        }),
      },
    );
    if (rideCreateResponse.status !== 201) {
      const errorBody = await rideCreateResponse.text();
      void rideNewForDriver.catch(() => undefined);
      void rideNewForSecondDriver.catch(() => undefined);
      throw new Error(
        `Create ride failed: expected HTTP 201, received ${rideCreateResponse.status}: ${errorBody}`,
      );
    }
    const createdRide = (await rideCreateResponse.json()) as {
      data: { ride: { id: string; farePaise: number } };
    };
    const rideId = createdRide.data.ride.id;
    await Promise.all([rideNewForDriver, rideNewForSecondDriver]);
    console.info(
      "Ride created:",
      JSON.stringify({ rideId, farePaise: createdRide.data.ride.farePaise }),
    );
    console.info("PASS ride:new sent to nearby online drivers");

    const requestsResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/driver/requests`,
      { headers: { cookie: driverCookie } },
    );
    requireStatus(requestsResponse, 200, "Nearby driver requests");
    const requests = (await requestsResponse.json()) as {
      data: { rides: Array<{ id: string }> };
    };
    if (!requests.data.rides.some((ride) => ride.id === rideId)) {
      throw new Error("The nearby driver request list did not include the new ride");
    }
    console.info("PASS online driver request list includes nearby ride");

    const duplicateRideResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/rides`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: riderCookie },
        body: JSON.stringify({
          pickup: pickupLocation,
          drop: { lat: 27.1767, lng: 78.0081 },
          vehicleType: VehicleType.CAB,
        }),
      },
    );
    requireStatus(duplicateRideResponse, 409, "Block duplicate active ride");
    console.info("PASS rider cannot create another ride while active");

    riderSocket.emit("ride:join", { rideId });
    await new Promise((resolve) => setTimeout(resolve, 150));

    const acceptedEvent = waitForSocketEvent(riderSocket, "ride:accepted");
    const acceptResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/rides/${rideId}/accept`,
      { method: "POST", headers: { cookie: driverCookie } },
    );
    requireStatus(acceptResponse, 200, "Driver accepts ride");
    await acceptedEvent;
    console.info("PASS driver accepts ride and rider receives ride:accepted");

    const secondAcceptResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/rides/${rideId}/accept`,
      { method: "POST", headers: { cookie: secondDriverCookie } },
    );
    requireStatus(secondAcceptResponse, 409, "Second driver accept");
    console.info(
      `Second driver accept: HTTP ${secondAcceptResponse.status} ${
        ((await secondAcceptResponse.json()) as { message: string }).message
      }`,
    );

    const locationEvent = waitForSocketEvent(riderSocket, "driver:location");
    driverSocket.emit("driver:location", {
      ...pickupLocation,
      rideId,
    });
    await locationEvent;
    console.info("PASS driver location forwarded to ride room");

    for (const [action, expectedStatus] of [
      ["arrived", "ARRIVED"],
      ["start", "IN_PROGRESS"],
      ["complete", "COMPLETED"],
    ] as const) {
      const statusEvent = waitForSocketEvent(
        riderSocket,
        "ride:status",
        (payload) =>
          typeof payload === "object" &&
          payload !== null &&
          "ride" in payload &&
          typeof payload.ride === "object" &&
          payload.ride !== null &&
          "status" in payload.ride &&
          payload.ride.status === expectedStatus,
      );
      const actionResponse = await fetch(
        `http://127.0.0.1:${address.port}/api/rides/${rideId}/${action}`,
        { method: "POST", headers: { cookie: driverCookie } },
      );
      requireStatus(actionResponse, 200, `Ride ${action}`);
      await statusEvent;
      console.info(`PASS ride ${action} and socket ride:status:${expectedStatus}`);
    }

    const earningsResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/driver/earnings`,
      { headers: { cookie: driverCookie } },
    );
    requireStatus(earningsResponse, 200, "Driver earnings");
    const earningsResult = (await earningsResponse.json()) as {
      data: { earnings: { tripCount: number; allTimePaise: number } };
    };
    if (
      earningsResult.data.earnings.tripCount < 1 ||
      earningsResult.data.earnings.allTimePaise < createdRide.data.ride.farePaise
    ) {
      throw new Error("Completed ride was not included in driver earnings");
    }
    console.info("PASS driver earnings include completed ride");

    console.info("Socket events received:", JSON.stringify(socketEvents));
  } finally {
    for (const socket of sockets) {
      socket.disconnect();
    }

    await new Promise<void>((resolve) => io.close(() => resolve()));
    await prisma.$disconnect();
  }
};

runSmoke().catch((error: unknown) => {
  console.error("Authentication smoke test failed:", error);
  process.exitCode = 1;
});
