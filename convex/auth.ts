import { betterAuth } from "better-auth";
import { createClient, type CreateAuth } from "@convex-dev/better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

// Component client for Better Auth on Convex
export const authComponent = createClient<DataModel>(components.betterAuth);

// Factory function: creates a Better Auth instance bound to a Convex context
export const createAuth: CreateAuth<DataModel> = (ctx) => {
  return betterAuth({
    database: authComponent.adapter(ctx),
    baseURL: process.env.SITE_URL, // Frontend URL — proxy forwards /api/auth/* to Convex
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: [
      process.env.SITE_URL || "http://localhost:8080",
    ],
  });
};

// Export clientApi query for auth boundary checks
export const { getAuthUser } = authComponent.clientApi();
