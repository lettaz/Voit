import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users ─────────────────────────────────────────────────────────
  // App-level user profile. Better Auth manages its own auth tables
  // (user, session, account) separately via the component.
  users: defineTable({
    // Identity
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),

    // Auth link
    authProvider: v.union(v.literal("email"), v.literal("google")),
    authProviderId: v.optional(v.string()),

    // Location
    location: v.optional(
      v.object({
        area: v.string(), // "Downtown Portland"
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
      })
    ),

    // Preferences
    preferences: v.optional(
      v.object({
        maxDistanceMiles: v.number(),
        preferredTimes: v.array(v.string()), // ["morning", "evening"]
        avoidTimes: v.optional(v.array(v.string())),
      })
    ),

    // Category-specific preferences
    categoryPreferences: v.optional(
      v.object({
        dining: v.optional(
          v.object({
            cuisines: v.optional(v.array(v.string())),
            budgetPerPerson: v.optional(v.string()),
            dietary: v.optional(v.array(v.string())),
          })
        ),
        healthcare: v.optional(
          v.object({
            insurance: v.optional(v.string()),
            preferredGender: v.optional(v.string()),
          })
        ),
        personalCare: v.optional(
          v.object({
            preferences: v.optional(v.array(v.string())),
          })
        ),
      })
    ),

    // Google Calendar
    calendarConnected: v.optional(v.boolean()),
    calendarTokens: v.optional(
      v.object({
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresAt: v.number(),
      })
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),

    // Agent name (dynamic, used as {{agent_name}} in prompts)
    agentName: v.optional(v.string()),

    // Custom prompt (user-editable, appended to base prompt)
    customPrompt: v.optional(v.string()),

    // Extensibility
    metadata: v.optional(v.any()),
  })
    .index("by_email", ["email"])
    .index("by_auth", ["authProvider", "authProviderId"]),

  // ─── Providers ─────────────────────────────────────────────────────
  // Shared provider database. Shaped to match Firecrawl output.
  providers: defineTable({
    // Identity
    name: v.string(),
    phone: v.string(),
    website: v.optional(v.string()),

    // Location
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    lat: v.number(),
    lng: v.number(),

    // Classification
    category: v.string(), // "dental", "restaurant", "barber", "auto"
    subcategories: v.optional(v.array(v.string())),
    specialties: v.optional(v.array(v.string())),

    // Reputation
    rating: v.optional(v.number()), // 0-5
    reviewCount: v.optional(v.number()),
    priceLevel: v.optional(v.number()), // 1-4

    // Operations
    description: v.optional(v.string()),
    businessHours: v.optional(
      v.object({
        monday: v.optional(v.object({ open: v.string(), close: v.string() })),
        tuesday: v.optional(v.object({ open: v.string(), close: v.string() })),
        wednesday: v.optional(
          v.object({ open: v.string(), close: v.string() })
        ),
        thursday: v.optional(
          v.object({ open: v.string(), close: v.string() })
        ),
        friday: v.optional(v.object({ open: v.string(), close: v.string() })),
        saturday: v.optional(
          v.object({ open: v.string(), close: v.string() })
        ),
        sunday: v.optional(v.object({ open: v.string(), close: v.string() })),
      })
    ),

    // Google Places reference
    placeId: v.optional(v.string()),

    // Source / crawl data
    source: v.union(
      v.literal("firecrawl"),
      v.literal("manual"),
      v.literal("mock")
    ),
    sourceUrl: v.optional(v.string()),
    rawData: v.optional(v.any()),
    discoveredAt: v.number(),
    lastVerified: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),

    // Extensibility
    metadata: v.optional(v.any()),
  })
    .index("by_category", ["category"])
    .index("by_category_rating", ["category", "rating"])
    .searchIndex("search_name", { searchField: "name" }),

  // ─── Campaigns ─────────────────────────────────────────────────────
  // A user's appointment search session.
  campaigns: defineTable({
    userId: v.id("users"),

    request: v.object({
      raw: v.string(), // Original natural language request
      category: v.string(),
      specifics: v.optional(v.string()),
      timeframe: v.string(),
      preferredTime: v.optional(v.string()),
      partySize: v.optional(v.number()),
    }),

    providerIds: v.array(v.id("providers")),

    status: v.union(
      v.literal("PREVIEW"), // User reviewing matched providers
      v.literal("ACTIVE"), // Calls in progress
      v.literal("PAUSED"), // User paused campaign
      v.literal("COMPLETED"), // Results ready
      v.literal("BOOKED"), // User confirmed a booking
      v.literal("CANCELLED"), // User cancelled
      v.literal("FAILED") // All calls failed
    ),

    batchId: v.optional(v.string()), // ElevenLabs batch calling ID

    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Extensibility
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"]),

  // ─── Agent Calls ───────────────────────────────────────────────────
  // Individual call made by an ElevenLabs agent to a provider.
  agentCalls: defineTable({
    campaignId: v.id("campaigns"),
    providerId: v.id("providers"),

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

    confidenceScore: v.optional(v.number()), // 0-100

    outcome: v.optional(
      v.union(
        v.literal("BOOKED"),
        v.literal("NO_AVAILABILITY"),
        v.literal("UNANSWERED"),
        v.literal("VOICEMAIL_LEFT"),
        v.literal("ERROR")
      )
    ),

    // ElevenLabs references
    elevenLabsCallId: v.optional(v.string()),
    elevenLabsConversationId: v.optional(v.string()),

    // Real-time event feed (for live call view)
    liveEvents: v.optional(
      v.array(
        v.object({
          type: v.string(),
          data: v.any(),
          timestamp: v.number(),
        })
      )
    ),

    // User-in-the-loop feedback
    pendingUserQuestion: v.optional(v.string()),
    userResponse: v.optional(v.string()),

    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Extensibility
    metadata: v.optional(v.any()),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_provider", ["providerId"])
    .index("by_campaign_status", ["campaignId", "status"]),

  // ─── Appointments ──────────────────────────────────────────────────
  // Confirmed bookings.
  appointments: defineTable({
    userId: v.id("users"),
    campaignId: v.id("campaigns"),
    callId: v.id("agentCalls"),
    providerId: v.id("providers"),

    datetime: v.string(),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),

    status: v.union(
      v.literal("CONFIRMED"),
      v.literal("CANCELLED"),
      v.literal("COMPLETED")
    ),

    confidenceScore: v.number(),

    scoringBreakdown: v.object({
      availability: v.number(),
      distance: v.number(),
      rating: v.number(),
      preference: v.number(),
      total: v.number(),
    }),

    calendarEventId: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),

    // Extensibility
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_datetime", ["userId", "datetime"])
    .index("by_campaign", ["campaignId"]),

  // ─── User Preference History ───────────────────────────────────────
  // Signals learned from user behavior for preference engine.
  userPreferenceHistory: defineTable({
    userId: v.id("users"),
    category: v.string(),
    signal: v.string(), // "prefers_evening", "chose_moderate_budget"
    source: v.union(
      v.literal("booking"), // Learned from actual booking
      v.literal("explicit") // User set manually
    ),
    createdAt: v.number(),

    // Extensibility
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"]),
});
