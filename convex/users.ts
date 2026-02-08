import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Upsert a user from auth — create if not exists, update if email matches. */
export const upsertFromAuth = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    authProvider: v.union(v.literal("email"), v.literal("google")),
    authProviderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        avatarUrl: args.avatarUrl,
        authProvider: args.authProvider,
        authProviderId: args.authProviderId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      authProvider: args.authProvider,
      authProviderId: args.authProviderId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePreferences = mutation({
  args: {
    id: v.id("users"),
    location: v.optional(
      v.object({
        area: v.string(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
      })
    ),
    preferences: v.optional(
      v.object({
        maxDistanceMiles: v.number(),
        preferredTimes: v.array(v.string()),
        avoidTimes: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
