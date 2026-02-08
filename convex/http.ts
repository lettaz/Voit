import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Register Better Auth HTTP routes at /api/auth/*
// This handles sign-in, sign-up, OAuth callbacks, sessions, etc.
authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [
      process.env.SITE_URL || "http://localhost:8080",
    ],
  },
});

export default http;
