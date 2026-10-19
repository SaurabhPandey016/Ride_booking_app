import "../src/config/env.js";
import { Role } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import app from "../src/app.js";

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

const runSmoke = async () => {
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
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
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }

    await prisma.$disconnect();
  }
};

runSmoke().catch((error: unknown) => {
  console.error("Authentication smoke test failed:", error);
  process.exitCode = 1;
});
