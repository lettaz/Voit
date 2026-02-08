import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    campaignId: v.id("campaigns"),
    callId: v.id("agentCalls"),
    providerId: v.id("providers"),
    datetime: v.string(),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    confidenceScore: v.number(),
    scoringBreakdown: v.object({
      availability: v.number(),
      distance: v.number(),
      rating: v.number(),
      preference: v.number(),
      total: v.number(),
    }),
    calendarEventId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("appointments", {
      ...args,
      status: "CONFIRMED",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("appointments"),
    status: v.union(
      v.literal("CONFIRMED"),
      v.literal("CANCELLED"),
      v.literal("COMPLETED")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
