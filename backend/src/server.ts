import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

// Load .env then .env.local (Convex CLI writes to .env.local)
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ConvexHttpClient } from "convex/browser";
import { providerRoutes } from "./routes/providers.js";

const PORT = Number(process.env.PORT) || 3088;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL || "";

// --- Convex client ---
const convex = new ConvexHttpClient(CONVEX_URL);

// --- Fastify instance ---
const app = Fastify({ logger: true });

// --- Plugins ---
await app.register(cors, {
  origin: FRONTEND_URL,
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: false, // relaxed for dev
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// --- Routes ---
app.get("/api/health", async (_request, _reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    convexConnected: !!CONVEX_URL,
    debugMode: process.env.DEBUG_MODE === "true",
  };
});

// Provider discovery routes
await providerRoutes(app, convex);

// --- Start ---
const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`   CORS origin: ${FRONTEND_URL}`);
    console.log(`   Convex URL: ${CONVEX_URL || "(not set)"}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// --- Graceful shutdown ---
const shutdown = async () => {
  console.log("\nShutting down...");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { app, convex };
