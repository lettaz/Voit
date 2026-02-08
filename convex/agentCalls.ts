import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentCalls")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("agentCalls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Find an agentCall by campaign + provider (used by tool webhooks). */
export const getByCampaignAndProvider = query({
  args: {
    campaignId: v.id("campaigns"),
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentCalls")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq(q.field("providerId"), args.providerId))
      .first();
  },
});

export const create = mutation({
  args: {
    campaignId: v.id("campaigns"),
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agentCalls", {
      campaignId: args.campaignId,
      providerId: args.providerId,
      status: "QUEUED",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    callId: v.id("agentCalls"),
    status: v.union(
      v.literal("QUEUED"),
      v.literal("RINGING"),
      v.literal("CONNECTED"),
      v.literal("NEGOTIATING"),
      v.literal("ON_HOLD"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("NO_ANSWER"),
      v.literal("VOICEMAIL"),
      v.literal("CANCELLED")
    ),
    transcript: v.optional(v.string()),
    slotsFound: v.optional(
      v.array(
        v.object({
          datetime: v.string(),
          details: v.optional(v.string()),
        })
      )
    ),
    confidenceScore: v.optional(v.number()),
    outcome: v.optional(
      v.union(
        v.literal("BOOKED"),
        v.literal("NO_AVAILABILITY"),
        v.literal("UNANSWERED"),
        v.literal("VOICEMAIL_LEFT"),
        v.literal("ERROR")
      )
    ),
    elevenLabsCallId: v.optional(v.string()),
    elevenLabsConversationId: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { callId, ...updates } = args;
    const now = Date.now();

    const patch: Record<string, unknown> = {
      ...updates,
      updatedAt: now,
    };

    if (args.status === "RINGING" || args.status === "CONNECTED") {
      const call = await ctx.db.get(callId);
      if (call && !call.startedAt) {
        patch.startedAt = now;
      }
    }

    if (
      args.status === "COMPLETED" ||
      args.status === "FAILED" ||
      args.status === "NO_ANSWER" ||
      args.status === "VOICEMAIL" ||
      args.status === "CANCELLED"
    ) {
      patch.endedAt = now;
    }

    await ctx.db.patch(callId, patch);
  },
});

// ─── Live Events ──────────────────────────────────────────────────────────

/** Append a real-time event to the call's live event feed. */
export const appendLiveEvent = mutation({
  args: {
    callId: v.id("agentCalls"),
    event: v.object({
      type: v.string(),
      data: v.any(),
      timestamp: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return;

    const existingEvents = call.liveEvents || [];
    await ctx.db.patch(args.callId, {
      liveEvents: [...existingEvents, args.event],
      updatedAt: Date.now(),
    });
  },
});

// ─── User-in-the-loop Feedback ────────────────────────────────────────────

/** Store a pending question from the agent, clear any previous response. */
export const setPendingQuestion = mutation({
  args: {
    callId: v.id("agentCalls"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, {
      pendingUserQuestion: args.question,
      userResponse: undefined,
      updatedAt: Date.now(),
    });
  },
});

/** Store the user's response to the pending question. */
export const setUserResponse = mutation({
  args: {
    callId: v.id("agentCalls"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, {
      userResponse: args.response,
      updatedAt: Date.now(),
    });
  },
});

/** Get the pending question for a call (frontend reads this). */
export const getPendingQuestion = query({
  args: { callId: v.id("agentCalls") },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return null;
    return {
      question: call.pendingUserQuestion || null,
      hasResponse: !!call.userResponse,
      response: call.userResponse || null,
    };
  },
});

/** Clear the pending question after it's been answered. */
export const clearPendingQuestion = mutation({
  args: { callId: v.id("agentCalls") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, {
      pendingUserQuestion: undefined,
      userResponse: undefined,
      updatedAt: Date.now(),
    });
  },
});
