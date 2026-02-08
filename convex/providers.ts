import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { id: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

export const listByCategoryWithRating = query({
  args: {
    category: v.string(),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query("providers")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();

    if (args.minRating !== undefined) {
      return providers.filter(
        (p) => p.rating !== undefined && p.rating >= args.minRating!
      );
    }
    return providers;
  },
});

export const searchByName = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providers")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(20);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("providers").collect();
  },
});

/** Insert or update a provider (matched by name + phone). */
export const upsert = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    website: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    lat: v.number(),
    lng: v.number(),
    category: v.string(),
    subcategories: v.optional(v.array(v.string())),
    specialties: v.optional(v.array(v.string())),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    priceLevel: v.optional(v.number()),
    description: v.optional(v.string()),
    businessHours: v.optional(v.any()),
    source: v.union(
      v.literal("firecrawl"),
      v.literal("manual"),
      v.literal("mock")
    ),
    sourceUrl: v.optional(v.string()),
    rawData: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if provider with same name and phone already exists
    const existing = await ctx.db
      .query("providers")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("phone"), args.phone)
        )
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastVerified: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("providers", {
      ...args,
      discoveredAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Bulk insert providers. */
export const bulkInsert = mutation({
  args: {
    providers: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];
    for (const provider of args.providers) {
      const id = await ctx.db.insert("providers", {
        ...provider,
        discoveredAt: now,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }
    return ids;
  },
});
