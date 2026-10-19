import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { attachSocketServer } from "./utils/socket.js";

const server = createServer(app);
const io = attachSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`RideX server running on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.info(`${signal} received; closing HTTP server and Prisma client.`);

  io.close(() => {
    void prisma.$disconnect().catch((disconnectError: unknown) => {
      console.error("Failed to disconnect Prisma client:", disconnectError);
      process.exitCode = 1;
    });
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
