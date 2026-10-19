import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`RideX server running on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.info(`${signal} received; closing HTTP server and Prisma client.`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server gracefully:", error);
      process.exitCode = 1;
    }

    void prisma.$disconnect().catch((disconnectError: unknown) => {
      console.error("Failed to disconnect Prisma client:", disconnectError);
      process.exitCode = 1;
    });
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
