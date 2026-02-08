/**
 * Tool Webhook Endpoints + Post-Call Webhook
 *
 * These are the Fastify endpoints that ElevenLabs calls during a live
 * conversation when the agent invokes a server tool, and the post-call
 * webhook that fires after a call ends.
 *
 * ElevenLabs sends a POST with the tool parameters in the body.
 * Each endpoint extracts campaign_id + provider_id to find the
 * corresponding agentCall record in Convex.
 *
 * Endpoints:
 *   POST /tools/report-availability
 *   POST /tools/report-no-availability
 *   POST /tools/update-call-status
 *   POST /tools/flag-uncertainty
 *   POST /tools/check-calendar
 *   POST /tools/calculate-distance
 *   POST /tools/get-provider-info
 *   POST /tools/validate-slot
 *   POST /tools/request-user-feedback   (NEW)
 *   POST /tools/query-user-context      (NEW)
 *   POST /webhooks/elevenlabs/post-call
 */

import type { FastifyInstance } from "fastify";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";
import { checkAvailability, createCalendarEvent } from "../services/googleCalendar.js";
import { calculateDistance as googleCalculateDistance } from "../services/googleMaps.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find the agentCall record for a given campaign + provider.
 * Returns the call ID or null if not found.
 */
async function findAgentCall(
  convex: ConvexHttpClient,
  campaignId: string,
  providerId: string
): Promise<{
  callId: Id<"agentCalls">;
  call: Record<string, unknown>;
} | null> {
  try {
    const call = await convex.query(api.agentCalls.getByCampaignAndProvider, {
      campaignId: campaignId as Id<"campaigns">,
      providerId: providerId as Id<"providers">,
    });

    if (!call) {
      console.warn(
        `[Tools] No agentCall found for campaign=${campaignId} provider=${providerId}`
      );
      return null;
    }

    return { callId: call._id, call: call as unknown as Record<string, unknown> };
  } catch (error) {
    console.error("[Tools] Error finding agentCall:", error);
    return null;
  }
}

/**
 * Get the userId for a campaign (needed for calendar / location lookups).
 */
async function getUserIdForCampaign(
  convex: ConvexHttpClient,
  campaignId: string
): Promise<Id<"users"> | null> {
  try {
    const campaign = await convex.query(api.campaigns.get, {
      campaignId: campaignId as Id<"campaigns">,
    });
    return campaign?.userId || null;
  } catch (error) {
    console.error("[Tools] Error getting campaign userId:", error);
    return null;
  }
}

/**
 * Append a live event to an agentCall for real-time frontend updates.
 */
async function appendLiveEvent(
  convex: ConvexHttpClient,
  callId: Id<"agentCalls">,
  type: string,
  data: unknown
): Promise<void> {
  try {
    await convex.mutation(api.agentCalls.appendLiveEvent, {
      callId,
      event: {
        type,
        data,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error("[Tools] Error appending live event:", error);
  }
}

/**
 * Verify webhook secret if configured.
 * Returns true if valid or if no secret is configured.
 */
function verifyWebhookSecret(authHeader: string | undefined): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured, skip verification
  if (!authHeader) return false;
  // Support both "Bearer <secret>" and raw secret
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  return token === secret;
}

// ─── Route Registration ─────────────────────────────────────────────────────

export async function toolRoutes(
  app: FastifyInstance,
  convex: ConvexHttpClient
) {
  // Note: Auth check removed for MVP. ElevenLabs tool webhooks and post-call
  // webhooks don't reliably send auth headers in a format we can verify.
  // The webhook URLs are obscure and only called by ElevenLabs.
  // TODO: Re-enable auth once we confirm how ElevenLabs sends the wsec_ secret.

  // ─── Test endpoint (verify webhooks are reachable) ──────────────────

  app.get("/tools/test", async () => {
    return {
      status: "ok",
      message: "Tool webhooks are reachable",
      timestamp: new Date().toISOString(),
    };
  });

  app.post("/tools/test", async (request) => {
    console.log("[Tools:test] Received test webhook:", JSON.stringify(request.body));
    return {
      status: "ok",
      message: "POST webhook received",
      body: request.body,
      timestamp: new Date().toISOString(),
    };
  });

  // ─── Tool 1: report_availability ────────────────────────────────────

  app.post<{
    Body: {
      campaign_id: string;
      provider_id: string;
      slots: Array<{ datetime: string; details?: string }>;
    };
  }>("/tools/report-availability", async (request, reply) => {
    const { campaign_id, provider_id, slots } = request.body;
    console.log(
      `[Tool:report_availability] campaign=${campaign_id} provider=${provider_id} slots=${slots?.length}`
    );

    const result = await findAgentCall(convex, campaign_id, provider_id);
    if (!result) {
      return reply.status(404).send({ error: "Call not found" });
    }

    await convex.mutation(api.agentCalls.updateStatus, {
      callId: result.callId,
      status: "COMPLETED",
      slotsFound: slots || [],
      outcome: "BOOKED",
      confidenceScore: 90,
    });

    // Live event: slots found
    await appendLiveEvent(convex, result.callId, "slots_found", {
      slots,
      providerName: provider_id,
    });

    return {
      message: "Availability recorded. Thank the provider and end the call.",
    };
  });

  // ─── Tool 2: report_no_availability ─────────────────────────────────

  app.post<{
    Body: {
      campaign_id: string;
      provider_id: string;
      reason?: string;
    };
  }>("/tools/report-no-availability", async (request, reply) => {
    const { campaign_id, provider_id, reason } = request.body;
    console.log(
      `[Tool:report_no_availability] campaign=${campaign_id} provider=${provider_id} reason=${reason}`
    );

    const result = await findAgentCall(convex, campaign_id, provider_id);
    if (!result) {
      return reply.status(404).send({ error: "Call not found" });
    }

    await convex.mutation(api.agentCalls.updateStatus, {
      callId: result.callId,
      status: "COMPLETED",
      outcome: "NO_AVAILABILITY",
      metadata: { noAvailabilityReason: reason },
    });

    // Live event: no availability
    await appendLiveEvent(convex, result.callId, "no_availability", {
      reason,
    });

    return {
      message: "Noted. Thank the provider and end the call.",
    };
  });

  // ─── Tool 3: update_call_status ─────────────────────────────────────

  app.post<{
    Body: {
      campaign_id: string;
      provider_id: string;
      status: string;
      details?: string;
    };
  }>("/tools/update-call-status", async (request, reply) => {
    const { campaign_id, provider_id, status, details } = request.body;
    console.log(
      `[Tool:update_call_status] campaign=${campaign_id} provider=${provider_id} status=${status} details=${details}`
    );

    const result = await findAgentCall(convex, campaign_id, provider_id);
    if (!result) {
      return reply.status(404).send({ error: "Call not found" });
    }

    // Map the status from the tool call to a valid agentCall status
    const validStatuses = [
      "RINGING",
      "CONNECTED",
      "NEGOTIATING",
      "ON_HOLD",
      "COMPLETED",
      "FAILED",
      "NO_ANSWER",
      "VOICEMAIL",
    ] as const;

    const normalizedStatus = status.toUpperCase() as (typeof validStatuses)[number];

    if (!validStatuses.includes(normalizedStatus)) {
      return reply.status(400).send({
        error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updatePayload: Record<string, unknown> = {
      callId: result.callId,
      status: normalizedStatus,
    };

    // If voicemail, set the outcome
    if (normalizedStatus === "VOICEMAIL") {
      updatePayload.outcome = "VOICEMAIL_LEFT";
    }

    // Store details in metadata
    if (details) {
      const existingMetadata = (result.call.metadata as Record<string, unknown>) || {};
      updatePayload.metadata = {
        ...existingMetadata,
        lastStatusDetails: details,
        statusHistory: [
          ...((existingMetadata.statusHistory as Array<unknown>) || []),
          { status: normalizedStatus, details, timestamp: Date.now() },
        ],
      };
    }

    await convex.mutation(api.agentCalls.updateStatus, updatePayload as Parameters<typeof convex.mutation>[1]);

    // Live event: status change
    await appendLiveEvent(convex, result.callId, "status_change", {
      status: normalizedStatus,
      details,
    });

    return { message: "Status updated." };
  });

  // ─── Tool 4: flag_uncertainty ───────────────────────────────────────

  app.post<{
    Body: {
      campaign_id: string;
      provider_id: string;
      uncertainty_type: string;
      details?: string;
    };
  }>("/tools/flag-uncertainty", async (request, reply) => {
    const { campaign_id, provider_id, uncertainty_type, details } =
      request.body;
    console.log(
      `[Tool:flag_uncertainty] campaign=${campaign_id} provider=${provider_id} type=${uncertainty_type}`
    );

    const result = await findAgentCall(convex, campaign_id, provider_id);
    if (!result) {
      return reply.status(404).send({ error: "Call not found" });
    }

    // Append uncertainty flag to metadata
    const existingMetadata = (result.call.metadata as Record<string, unknown>) || {};
    const uncertainties = (existingMetadata.uncertainties as Array<unknown>) || [];

    await convex.mutation(api.agentCalls.updateStatus, {
      callId: result.callId,
      status: result.call.status as "NEGOTIATING",
      metadata: {
        ...existingMetadata,
        uncertainties: [
          ...uncertainties,
          {
            type: uncertainty_type,
            details,
            timestamp: Date.now(),
          },
        ],
      },
    });

    // Live event: uncertainty flagged
    await appendLiveEvent(convex, result.callId, "uncertainty", {
      type: uncertainty_type,
      details,
    });

    return {
      message:
        "Uncertainty flagged. Try to clarify with the provider or proceed with caution.",
    };
  });

  // ─── Tool 5: check_calendar (REAL implementation) ───────────────────

  app.post<{
    Body: {
      campaign_id: string;
      proposed_datetime: string;
      duration_minutes?: number;
    };
  }>("/tools/check-calendar", async (request, reply) => {
    const { campaign_id, proposed_datetime, duration_minutes } = request.body;
    console.log(
      `[Tool:check_calendar] campaign=${campaign_id} datetime=${proposed_datetime} duration=${duration_minutes}`
    );

    // Look up the campaign to find the userId
    const userId = await getUserIdForCampaign(convex, campaign_id);
    if (!userId) {
      return {
        available: true,
        message: "Could not find the campaign. Assuming the client is available.",
        calendarConnected: false,
      };
    }

    // Call real Google Calendar API
    const availability = await checkAvailability(
      convex,
      userId,
      proposed_datetime,
      duration_minutes || 60
    );

    return {
      available: availability.available,
      conflicts: availability.conflicts,
      message: availability.message,
      calendarConnected: availability.calendarConnected,
    };
  });

  // ─── Tool 6: calculate_distance (REAL implementation) ───────────────

  app.post<{
    Body: {
      campaign_id: string;
      provider_id: string;
      provider_address?: string;
    };
  }>("/tools/calculate-distance", async (request, reply) => {
    const { campaign_id, provider_id, provider_address } = request.body;
    console.log(
      `[Tool:calculate_distance] campaign=${campaign_id} provider=${provider_id} address=${provider_address}`
    );

    // Look up the campaign to find the userId, then get user's location
    const userId = await getUserIdForCampaign(convex, campaign_id);
    let userLocation: { lat: number; lng: number } | null = null;

    if (userId) {
      try {
        const user = await convex.query(api.users.getById, { id: userId });
        if (user?.location?.lat && user?.location?.lng) {
          userLocation = { lat: user.location.lat, lng: user.location.lng };
        }
      } catch {
        // Ignore
      }
    }

    // Get provider's location
    let providerLocation: { lat: number; lng: number } | string | null = null;
    let providerName = "the provider";

    try {
      const provider = await convex.query(api.providers.getById, {
        id: provider_id as Id<"providers">,
      });
      if (provider) {
        providerName = provider.name;
        if (provider.lat && provider.lng) {
          providerLocation = { lat: provider.lat, lng: provider.lng };
        } else if (provider.address) {
          providerLocation = `${provider.address}, ${provider.city}, ${provider.state} ${provider.zipCode}`;
        }
      }
    } catch {
      // Ignore
    }

    // Use provider_address param as fallback
    if (!providerLocation && provider_address) {
      providerLocation = provider_address;
    }

    // If we have both locations, calculate real distance
    if (userLocation && providerLocation) {
      const distance = await googleCalculateDistance(userLocation, providerLocation);

      if (distance) {
        return {
          distance_miles: distance.distanceMiles,
          duration_minutes: distance.durationMinutes,
          distance_text: distance.distanceText,
          duration_text: distance.durationText,
          message: `${providerName} is ${distance.distanceText} away (${distance.durationText} by car) from the client.`,
        };
      }
    }

    // Fallback: no location data or API unavailable
    return {
      distance_miles: null,
      duration_minutes: null,
      message: `Could not calculate distance to ${providerName}. No location data available. Proceed with the appointment — the client will verify distance later.`,
      note: "Distance calculation unavailable. Set GOOGLE_MAPS_API_KEY and user location for real distances.",
    };
  });

  // ─── Tool 7: get_provider_info ──────────────────────────────────────

  app.post<{
    Body: {
      provider_id: string;
    };
  }>("/tools/get-provider-info", async (request, reply) => {
    const { provider_id } = request.body;
    console.log(`[Tool:get_provider_info] provider=${provider_id}`);

    try {
      const provider = await convex.query(api.providers.getById, {
        id: provider_id as Id<"providers">,
      });

      if (!provider) {
        return reply.status(404).send({
          error: "Provider not found",
          message: "I don't have information about that provider in my database.",
        });
      }

      return {
        name: provider.name,
        phone: provider.phone,
        address: `${provider.address}, ${provider.city}, ${provider.state} ${provider.zipCode}`,
        category: provider.category,
        rating: provider.rating ?? null,
        reviewCount: provider.reviewCount ?? null,
        specialties: provider.specialties ?? [],
        businessHours: provider.businessHours ?? null,
        description: provider.description ?? null,
        message: `${provider.name} is a ${provider.category} provider located at ${provider.address}, ${provider.city}. Rating: ${provider.rating ?? "N/A"}/5.`,
      };
    } catch (error) {
      console.error("[Tool:get_provider_info] Error:", error);
      return reply.status(500).send({
        error: "Failed to look up provider",
        message: "I wasn't able to look up the provider details right now.",
      });
    }
  });

  // ─── Tool 8: validate_slot (REAL implementation) ────────────────────

  app.post<{
    Body: {
      campaign_id: string;
      provider_id: string;
      proposed_datetime: string;
      duration_minutes?: number;
      details?: string;
    };
  }>("/tools/validate-slot", async (request, reply) => {
    const {
      campaign_id,
      provider_id,
      proposed_datetime,
      duration_minutes,
      details,
    } = request.body;
    console.log(
      `[Tool:validate_slot] campaign=${campaign_id} provider=${provider_id} datetime=${proposed_datetime}`
    );

    const reasons: string[] = [];
    let calendarScore = 40; // max 40
    let distanceScore = 30; // max 30
    let ratingScore = 0; // max 20
    let preferenceScore = 0; // max 10

    // ── 1. Real calendar check (weight: 40%) ────────────────────────
    const userId = await getUserIdForCampaign(convex, campaign_id);

    if (userId) {
      const availability = await checkAvailability(
        convex,
        userId,
        proposed_datetime,
        duration_minutes || 60
      );

      if (!availability.available) {
        calendarScore = 0;
        reasons.push(
          `Calendar conflict: ${availability.conflicts.length} conflicting event(s)`
        );
      }
      // If no calendar connected, keep full score (benefit of the doubt)
    }

    // ── 2. Real distance check (weight: 30%) ────────────────────────
    let userLocation: { lat: number; lng: number } | null = null;
    let maxDistanceMiles = 15; // default max distance

    if (userId) {
      try {
        const user = await convex.query(api.users.getById, { id: userId });
        if (user?.location?.lat && user?.location?.lng) {
          userLocation = { lat: user.location.lat, lng: user.location.lng };
        }
        if (user?.preferences?.maxDistanceMiles) {
          maxDistanceMiles = user.preferences.maxDistanceMiles;
        }
      } catch {
        // Ignore
      }
    }

    let providerLocation: { lat: number; lng: number } | null = null;
    try {
      const provider = await convex.query(api.providers.getById, {
        id: provider_id as Id<"providers">,
      });
      if (provider?.lat && provider?.lng) {
        providerLocation = { lat: provider.lat, lng: provider.lng };
      }
      // Rating score (max 20)
      if (provider?.rating) {
        ratingScore = Math.min(20, Math.round((provider.rating / 5) * 20));
      }
    } catch {
      // Ignore
    }

    if (userLocation && providerLocation) {
      const distance = await googleCalculateDistance(userLocation, providerLocation);
      if (distance) {
        if (distance.distanceMiles > maxDistanceMiles) {
          distanceScore = Math.max(
            0,
            30 - Math.round((distance.distanceMiles / maxDistanceMiles) * 15)
          );
          reasons.push(
            `Provider is ${distance.distanceText} away (max preference: ${maxDistanceMiles} mi)`
          );
        }
        // Within distance: keep full score
      }
    }
    // If no location data, keep full score

    // ── 3. Time preference check (weight: 10%) ─────────────────────
    const proposedHour = new Date(proposed_datetime).getHours();
    if (userId) {
      try {
        const user = await convex.query(api.users.getById, { id: userId });
        const preferredTimes = user?.preferences?.preferredTimes || [];
        const avoidTimes = user?.preferences?.avoidTimes || [];

        // Check if proposed time matches preferred times
        if (preferredTimes.includes("morning") && proposedHour >= 8 && proposedHour <= 11) {
          preferenceScore = 10;
        } else if (preferredTimes.includes("afternoon") && proposedHour >= 12 && proposedHour <= 16) {
          preferenceScore = 10;
        } else if (preferredTimes.includes("evening") && proposedHour >= 17 && proposedHour <= 20) {
          preferenceScore = 10;
        } else if (preferredTimes.length === 0) {
          preferenceScore = 5; // No preference set, give partial score
        } else {
          preferenceScore = 2;
          reasons.push("Time doesn't match client's preferred time of day");
        }

        // Penalize avoided times
        if (avoidTimes.includes("morning") && proposedHour >= 8 && proposedHour <= 11) {
          preferenceScore = 0;
          reasons.push("Client prefers to avoid morning appointments");
        }
        if (avoidTimes.includes("evening") && proposedHour >= 17 && proposedHour <= 20) {
          preferenceScore = 0;
          reasons.push("Client prefers to avoid evening appointments");
        }
      } catch {
        preferenceScore = 5;
      }
    } else {
      preferenceScore = 5;
    }

    // ── 4. Composite score ──────────────────────────────────────────
    const totalScore = calendarScore + distanceScore + ratingScore + preferenceScore;
    const valid = calendarScore > 0 && totalScore >= 50;

    if (valid) {
      return {
        valid: true,
        score: totalScore,
        breakdown: {
          calendar: calendarScore,
          distance: distanceScore,
          rating: ratingScore,
          preference: preferenceScore,
        },
        message: `This slot works well for the client. Score: ${totalScore}/100.${details ? ` Details: ${details}` : ""}`,
      };
    } else {
      return {
        valid: false,
        score: totalScore,
        breakdown: {
          calendar: calendarScore,
          distance: distanceScore,
          rating: ratingScore,
          preference: preferenceScore,
        },
        reasons,
        message: `This slot doesn't work. ${reasons.join(". ")}. Ask for alternatives.`,
      };
    }
  });

  // ─── Tool 9: request_user_feedback (NEW) ────────────────────────────

  app.post<{
    Body: {
      campaign_id: string;
      provider_id: string;
      question: string;
      context?: string;
    };
  }>("/tools/request-user-feedback", async (request, reply) => {
    const { campaign_id, provider_id, question, context } = request.body;
    console.log(
      `[Tool:request_user_feedback] campaign=${campaign_id} provider=${provider_id} question="${question}"`
    );

    const result = await findAgentCall(convex, campaign_id, provider_id);
    if (!result) {
      return {
        user_response: "Unable to reach the client right now. Proceed with your best judgment.",
        responded: false,
      };
    }

    // Store the question in Convex so the frontend can display it
    await convex.mutation(api.agentCalls.setPendingQuestion, {
      callId: result.callId,
      question,
    });

    // Live event: user question
    await appendLiveEvent(convex, result.callId, "user_question", {
      question,
      context,
    });

    // Poll for user response with a 30-second timeout
    const TIMEOUT_MS = 30_000;
    const POLL_INTERVAL_MS = 2_000;
    const startTime = Date.now();

    while (Date.now() - startTime < TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      try {
        const feedbackState = await convex.query(api.agentCalls.getPendingQuestion, {
          callId: result.callId,
        });

        if (feedbackState?.hasResponse && feedbackState.response) {
          // User responded! Clear the question and return the response
          await convex.mutation(api.agentCalls.clearPendingQuestion, {
            callId: result.callId,
          });

          await appendLiveEvent(convex, result.callId, "user_response_received", {
            question,
            response: feedbackState.response,
          });

          return {
            user_response: feedbackState.response,
            responded: true,
          };
        }
      } catch (error) {
        console.error("[Tool:request_user_feedback] Poll error:", error);
      }
    }

    // Timeout — clear the question and return default
    await convex.mutation(api.agentCalls.clearPendingQuestion, {
      callId: result.callId,
    });

    await appendLiveEvent(convex, result.callId, "user_feedback_timeout", {
      question,
    });

    return {
      user_response:
        "The client did not respond in time. Proceed with your best judgment based on the information you already have.",
      responded: false,
    };
  });

  // ─── Tool 10: query_user_context (NEW) ──────────────────────────────

  app.post<{
    Body: {
      campaign_id: string;
      query: string;
    };
  }>("/tools/query-user-context", async (request, reply) => {
    const { campaign_id, query: userQuery } = request.body;
    console.log(
      `[Tool:query_user_context] campaign=${campaign_id} query="${userQuery}"`
    );

    const userId = await getUserIdForCampaign(convex, campaign_id);
    if (!userId) {
      return {
        context: "No user context available.",
        sources: [],
      };
    }

    const contextParts: string[] = [];
    const sources: string[] = [];

    try {
      // 1. Get user profile data
      const user = await convex.query(api.users.getById, { id: userId });
      if (user) {
        // Location
        if (user.location) {
          contextParts.push(`Client location: ${user.location.area}`);
          sources.push("user_profile");
        }

        // General preferences
        if (user.preferences) {
          contextParts.push(
            `Max distance: ${user.preferences.maxDistanceMiles} miles`
          );
          if (user.preferences.preferredTimes?.length) {
            contextParts.push(
              `Preferred times: ${user.preferences.preferredTimes.join(", ")}`
            );
          }
          if (user.preferences.avoidTimes?.length) {
            contextParts.push(
              `Avoids: ${user.preferences.avoidTimes.join(", ")}`
            );
          }
          sources.push("user_preferences");
        }

        // Category preferences
        if (user.categoryPreferences) {
          const cp = user.categoryPreferences;
          if (cp.healthcare) {
            if (cp.healthcare.insurance) {
              contextParts.push(`Insurance: ${cp.healthcare.insurance}`);
            }
            if (cp.healthcare.preferredGender) {
              contextParts.push(
                `Preferred provider gender: ${cp.healthcare.preferredGender}`
              );
            }
            sources.push("category_preferences");
          }
          if (cp.dining) {
            if (cp.dining.cuisines?.length) {
              contextParts.push(
                `Cuisine preferences: ${cp.dining.cuisines.join(", ")}`
              );
            }
            if (cp.dining.dietary?.length) {
              contextParts.push(
                `Dietary restrictions: ${cp.dining.dietary.join(", ")}`
              );
            }
            if (cp.dining.budgetPerPerson) {
              contextParts.push(
                `Budget per person: ${cp.dining.budgetPerPerson}`
              );
            }
            sources.push("category_preferences");
          }
          if (cp.personalCare?.preferences?.length) {
            contextParts.push(
              `Personal care preferences: ${cp.personalCare.preferences.join(", ")}`
            );
            sources.push("category_preferences");
          }
        }

        // Calendar status
        contextParts.push(
          `Calendar connected: ${user.calendarConnected ? "Yes" : "No"}`
        );
      }

      // 2. Get preference history signals
      const prefHistory = await convex.query(
        api.userPreferenceHistory.getByUser,
        { userId }
      );
      if (prefHistory && prefHistory.length > 0) {
        const recentSignals = prefHistory
          .slice(-10) // last 10 signals
          .map(
            (h: { signal: string; source: string; category: string }) =>
              `${h.category}: ${h.signal} (${h.source})`
          );
        contextParts.push(
          `Recent behavioral signals: ${recentSignals.join("; ")}`
        );
        sources.push("preference_history");
      }

      // 3. Query ElevenLabs KB if agent ID is available
      const agentId = process.env.ELEVENLABS_AGENT_ID;
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (agentId && apiKey) {
        try {
          const agentRes = await fetch(
            `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
            {
              headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
              },
            }
          );
          if (agentRes.ok) {
            const agentData = (await agentRes.json()) as Record<string, unknown>;
            const kb = (agentData as { conversation_config?: { agent?: { prompt?: { knowledge_base?: Array<{ name?: string; id?: string }> } } } })
              ?.conversation_config?.agent?.prompt?.knowledge_base;
            if (kb && kb.length > 0) {
              contextParts.push(
                `Knowledge base documents: ${kb.map((doc: { name?: string }) => doc.name || "unnamed").join(", ")}`
              );
              sources.push("elevenlabs_kb");
            }
          }
        } catch {
          // KB lookup failed, non-fatal
        }
      }
    } catch (error) {
      console.error("[Tool:query_user_context] Error:", error);
    }

    const context =
      contextParts.length > 0
        ? contextParts.join("\n")
        : "No specific context found for this query.";

    return {
      context,
      sources: [...new Set(sources)],
    };
  });

  // ─── Frontend endpoint: user responds to agent question ─────────────

  app.post<{
    Params: { callId: string };
    Body: { response: string };
  }>("/api/calls/:callId/respond", async (request, reply) => {
    const { callId } = request.params;
    const { response } = request.body;

    console.log(
      `[API:respond] callId=${callId} response="${response?.substring(0, 50)}..."`
    );

    try {
      await convex.mutation(api.agentCalls.setUserResponse, {
        callId: callId as Id<"agentCalls">,
        response,
      });
      return { success: true };
    } catch (error) {
      console.error("[API:respond] Error:", error);
      return reply.status(500).send({ error: "Failed to save response" });
    }
  });

  // ─── Post-Call Webhook ──────────────────────────────────────────────

  app.post<{
    Body: {
      agent_id?: string;
      call_id?: string;
      conversation_id?: string;
      status?: string;
      transcript?: string;
      duration_seconds?: number;
      custom_variables?: Record<string, string>;
      recording_url?: string;
      metadata?: Record<string, unknown>;
    };
  }>("/webhooks/elevenlabs/post-call", async (request, reply) => {
    const body = request.body;
    console.log(
      `[PostCall] Received post-call webhook: call_id=${body.call_id} conversation_id=${body.conversation_id}`
    );

    const campaignId = body.custom_variables?.campaign_id;
    const providerId = body.custom_variables?.provider_id;

    if (!campaignId || !providerId) {
      console.warn(
        "[PostCall] Missing campaign_id or provider_id in custom_variables"
      );
      return reply.status(200).send({ message: "Acknowledged (no IDs)" });
    }

    // Find the agentCall record
    const result = await findAgentCall(convex, campaignId, providerId);
    if (!result) {
      console.warn(
        `[PostCall] No agentCall found for campaign=${campaignId} provider=${providerId}`
      );
      return reply.status(200).send({ message: "Acknowledged (call not found)" });
    }

    // Determine final status from the webhook payload
    const callStatus = body.status?.toUpperCase() || "COMPLETED";
    const finalStatus =
      callStatus === "COMPLETED" || callStatus === "ENDED"
        ? "COMPLETED"
        : callStatus === "FAILED"
          ? "FAILED"
          : "COMPLETED";

    // Determine outcome if not already set
    const existingOutcome = result.call.outcome as string | undefined;
    let outcome = existingOutcome;
    if (!outcome) {
      if (finalStatus === "FAILED") {
        outcome = "ERROR";
      }
      // If slots were already recorded, keep the existing outcome
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      callId: result.callId,
      status: finalStatus as "COMPLETED" | "FAILED",
      elevenLabsCallId: body.call_id,
      elevenLabsConversationId: body.conversation_id,
      durationSeconds: body.duration_seconds,
    };

    if (body.transcript) {
      updatePayload.transcript = body.transcript;
    }

    if (outcome) {
      updatePayload.outcome = outcome;
    }

    // Merge any extra metadata
    const existingMetadata = (result.call.metadata as Record<string, unknown>) || {};
    updatePayload.metadata = {
      ...existingMetadata,
      postCallWebhook: {
        receivedAt: Date.now(),
        agentId: body.agent_id,
        recordingUrl: body.recording_url,
        webhookStatus: body.status,
        webhookMetadata: body.metadata,
      },
    };

    await convex.mutation(api.agentCalls.updateStatus, updatePayload as Parameters<typeof convex.mutation>[1]);

    // Live event: call ended
    await appendLiveEvent(convex, result.callId, "call_ended", {
      status: finalStatus,
      durationSeconds: body.duration_seconds,
      outcome,
    });

    console.log(
      `[PostCall] Updated agentCall ${result.callId} -> ${finalStatus}`
    );

    // Check if all calls in the campaign are complete
    await checkCampaignCompletion(convex, campaignId);

    return { message: "Post-call processed successfully." };
  });
}

// ─── Campaign Completion Check ──────────────────────────────────────────────

/**
 * Check if all agentCalls in a campaign have finished.
 * If so, update the campaign status to COMPLETED (or FAILED if all failed).
 */
async function checkCampaignCompletion(
  convex: ConvexHttpClient,
  campaignId: string
): Promise<void> {
  try {
    const calls = await convex.query(api.agentCalls.getByCampaign, {
      campaignId: campaignId as Id<"campaigns">,
    });

    const terminalStatuses = [
      "COMPLETED",
      "FAILED",
      "NO_ANSWER",
      "VOICEMAIL",
      "CANCELLED",
    ];

    const allDone = calls.every((call: { status: string }) =>
      terminalStatuses.includes(call.status)
    );

    if (!allDone) {
      console.log(
        `[PostCall] Campaign ${campaignId}: ${calls.filter((c: { status: string }) => terminalStatuses.includes(c.status)).length}/${calls.length} calls complete`
      );
      return;
    }

    // All calls are done — determine campaign outcome
    const hasSlots = calls.some(
      (call: { outcome?: string }) => call.outcome === "BOOKED"
    );
    const allFailed = calls.every(
      (call: { status: string }) =>
        call.status === "FAILED" ||
        call.status === "NO_ANSWER" ||
        call.status === "CANCELLED"
    );

    const campaignStatus = allFailed
      ? "FAILED"
      : hasSlots
        ? "COMPLETED"
        : "COMPLETED"; // Even if no slots, the campaign is complete

    await convex.mutation(api.campaigns.updateStatus, {
      campaignId: campaignId as Id<"campaigns">,
      status: campaignStatus as "COMPLETED" | "FAILED",
    });

    console.log(
      `[PostCall] Campaign ${campaignId} marked as ${campaignStatus}`
    );
  } catch (error) {
    console.error("[PostCall] Error checking campaign completion:", error);
  }
}
