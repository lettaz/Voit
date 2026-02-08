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

/** Dashboard stats for a user. */
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const todayCampaigns = campaigns.filter((c) => c.createdAt >= todayMs).length;

    let completedCalls = 0;
    let successfulCalls = 0;

    for (const campaign of campaigns) {
      const calls = await ctx.db
        .query("agentCalls")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
        .collect();
      for (const call of calls) {
        if (
          ["COMPLETED", "FAILED", "NO_ANSWER", "VOICEMAIL", "CANCELLED"].includes(
            call.status
          )
        ) {
          completedCalls++;
        }
        if (call.outcome === "BOOKED") {
          successfulCalls++;
        }
      }
    }

    const successRate =
      completedCalls > 0
        ? Math.round((successfulCalls / completedCalls) * 100)
        : 0;

    return {
      activeCampaigns,
      todayCampaigns,
      successRate,
      totalCampaigns: campaigns.length,
    };
  },
});

/** Campaigns with call progress and provider info for the calls tab. */
export const listWithDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return Promise.all(
      campaigns.map(async (campaign) => {
        const calls = await ctx.db
          .query("agentCalls")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .collect();

        const providers = (
          await Promise.all(campaign.providerIds.map((id) => ctx.db.get(id)))
        ).filter(Boolean);

        const terminalStatuses = [
          "COMPLETED",
          "FAILED",
          "NO_ANSWER",
          "VOICEMAIL",
          "CANCELLED",
        ];

        return {
          ...campaign,
          calls,
          providers,
          progress: {
            total: calls.length,
            completed: calls.filter((c) => terminalStatuses.includes(c.status))
              .length,
            successful: calls.filter((c) => c.outcome === "BOOKED").length,
            slotsFound: calls
              .filter((c) => c.slotsFound && c.slotsFound.length > 0)
              .flatMap((c) =>
                (c.slotsFound || []).map((s) => ({
                  ...s,
                  providerId: c.providerId,
                  callId: c._id,
                  confidenceScore: c.confidenceScore,
                }))
              ),
          },
        };
      })
    );
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
