import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getActiveCampaign = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "ACTIVE")
      )
      .first();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    request: v.object({
      raw: v.string(),
      category: v.string(),
      specifics: v.optional(v.string()),
      timeframe: v.string(),
      preferredTime: v.optional(v.string()),
      partySize: v.optional(v.number()),
    }),
    providerIds: v.array(v.id("providers")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("campaigns", {
      userId: args.userId,
      request: args.request,
      providerIds: args.providerIds,
      status: "PREVIEW",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    campaignId: v.id("campaigns"),
    status: v.union(
      v.literal("PREVIEW"),
      v.literal("ACTIVE"),
      v.literal("PAUSED"),
      v.literal("COMPLETED"),
      v.literal("BOOKED"),
      v.literal("CANCELLED"),
      v.literal("FAILED")
    ),
    batchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.batchId) updates.batchId = args.batchId;
    if (args.status === "ACTIVE") updates.startedAt = Date.now();
    if (
      args.status === "COMPLETED" ||
      args.status === "BOOKED" ||
      args.status === "FAILED"
    ) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.campaignId, updates);
  },
});
