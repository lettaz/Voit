import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

// Load .env from the project root
dotenv.config({ path: path.join(rootDir, ".env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { ConvexHttpClient } from "convex/browser";
import { providerRoutes } from "./routes/providers.js";
import { toolRoutes } from "./routes/tools.js";
import { campaignRoutes } from "./routes/campaigns.js";
import { agentRoutes } from "./routes/agent.js";

const PORT = Number(process.env.PORT) || 3088;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL || "";

// --- Convex client ---
const convex = new ConvexHttpClient(CONVEX_URL);

// --- Fastify instance ---
const app = Fastify({ logger: true });

// --- Plugins ---
await app.register(cors, {
  origin: (origin, cb) => {
    // Allow frontend origin
    if (!origin || origin === FRONTEND_URL) {
      cb(null, true);
      return;
    }
    // Allow ElevenLabs webhook calls (no browser origin) and ngrok
    if (
      !origin ||
      origin.includes("elevenlabs.io") ||
      origin.includes("ngrok")
    ) {
      cb(null, true);
      return;
    }
    cb(null, false);
  },
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: false, // relaxed for dev
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

await app.register(multipart, {
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
    files: 1,
  },
});

// --- Routes ---
app.get("/api/health", async (_request, _reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    convexConnected: !!CONVEX_URL,
    debugMode: process.env.DEBUG_MODE === "true",
    elevenLabs: {
      apiKeySet: !!process.env.ELEVENLABS_API_KEY,
      agentIdSet: !!process.env.ELEVENLABS_AGENT_ID,
      phoneNumberIdSet: !!process.env.ELEVENLABS_PHONE_NUMBER_ID,
    },
    apiUrl: process.env.API_URL || "(not set)",
  };
});

// Provider discovery routes
await providerRoutes(app, convex);

// Tool webhook endpoints (called by ElevenLabs during conversations)
await toolRoutes(app, convex);

// Campaign management routes
await campaignRoutes(app, convex);

// Agent configuration routes (ElevenLabs API proxy)
await agentRoutes(app);

// --- Start ---
const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`   CORS origin: ${FRONTEND_URL}`);
    console.log(`   Convex URL: ${CONVEX_URL || "(not set)"}`);
    console.log(`   API URL (webhooks): ${process.env.API_URL || "(not set)"}`);
    console.log(`   ElevenLabs Agent: ${process.env.ELEVENLABS_AGENT_ID || "(not set)"}`);
    console.log(`   Debug Mode: ${process.env.DEBUG_MODE === "true" ? "ON" : "OFF"}`);
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
