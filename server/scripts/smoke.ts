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
