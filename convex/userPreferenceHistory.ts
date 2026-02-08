import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Get all preference signals for a user. */
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPreferenceHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/** Get preference signals for a user in a specific category. */
export const getByUserAndCategory = query({
  args: {
    userId: v.id("users"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPreferenceHistory")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", args.category)
      )
      .collect();
  },
});

/** Record a new preference signal. */
export const addSignal = mutation({
  args: {
    userId: v.id("users"),
    category: v.string(),
    signal: v.string(),
    source: v.union(v.literal("booking"), v.literal("explicit")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userPreferenceHistory", {
      userId: args.userId,
      category: args.category,
      signal: args.signal,
      source: args.source,
      createdAt: Date.now(),
      metadata: args.metadata,
    });
  },
});
