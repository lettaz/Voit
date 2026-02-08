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
 *   POST /webhooks/elevenlabs/post-call
 */

import type { FastifyInstance } from "fastify";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

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
  // Middleware: verify webhook secret on all /tools/* routes
  app.addHook("preHandler", async (request, reply) => {
    const path = request.url;
    if (path.startsWith("/tools/") || path.startsWith("/webhooks/")) {
      const auth = request.headers.authorization;
      if (!verifyWebhookSecret(auth)) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
    }
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

    return {
      message:
        "Uncertainty flagged. Try to clarify with the provider or proceed with caution.",
    };
  });

  // ─── Tool 5: check_calendar ─────────────────────────────────────────

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

    // TODO: Integrate Google Calendar API when keys are configured.
    // For now, return a mock "available" response.
    // In production, this would:
    // 1. Look up the campaign to find the userId
    // 2. Get the user's calendar tokens from Convex
    // 3. Query Google Calendar API for conflicts at proposed_datetime
    // 4. Return availability status

    return {
      available: true,
      message: `The client is available at ${proposed_datetime}.`,
      note: "Calendar check is using mock data. Connect Google Calendar for real availability.",
    };
  });

  // ─── Tool 6: calculate_distance ─────────────────────────────────────

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

    // TODO: Integrate Google Maps Distance Matrix API when keys are configured.
    // For now, return a mock distance response.
    // In production, this would:
    // 1. Look up the campaign to find the userId
    // 2. Get the user's location from Convex
    // 3. Get the provider's address from Convex (or use provider_address param)
    // 4. Call Google Maps Distance Matrix API
    // 5. Return distance and travel time

    // Try to look up provider for a more realistic mock
    let providerName = "the provider";
    try {
      const provider = await convex.query(api.providers.getById, {
        id: provider_id as Id<"providers">,
      });
      if (provider) {
        providerName = provider.name;
      }
    } catch {
      // Ignore — use default name
    }

    return {
      distance_miles: 3.2,
      duration_minutes: 12,
      message: `${providerName} is about 12 minutes away from the client.`,
      note: "Distance calculation is using mock data. Connect Google Maps for real distances.",
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

  // ─── Tool 8: validate_slot ──────────────────────────────────────────

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

    // Composite validation:
    // 1. Check calendar availability (mock for now)
    // 2. Check distance (mock for now)
    // 3. Check against user preferences
    // 4. Compute a score

    let calendarOk = true;
    let distanceOk = true;
    let preferenceScore = 80;
    const reasons: string[] = [];

    // TODO: Replace mocks with real API calls when Google APIs are integrated.

    // Mock calendar check
    // In production: query Google Calendar
    calendarOk = true;

    // Mock distance check
    // In production: query Google Maps Distance Matrix
    distanceOk = true;

    // Try to look up provider for rating bonus
    try {
      const provider = await convex.query(api.providers.getById, {
        id: provider_id as Id<"providers">,
      });
      if (provider?.rating && provider.rating >= 4.5) {
        preferenceScore += 10; // Bonus for highly rated provider
      }
    } catch {
      // Ignore — use base score
    }

    // Parse time preference
    const proposedHour = new Date(proposed_datetime).getHours();
    if (proposedHour >= 9 && proposedHour <= 11) {
      preferenceScore += 5; // Morning slots often preferred
    }

    if (!calendarOk) {
      reasons.push("Calendar conflict at that time");
      preferenceScore -= 30;
    }
    if (!distanceOk) {
      reasons.push("Provider is too far from client");
      preferenceScore -= 20;
    }

    const valid = calendarOk && distanceOk && preferenceScore >= 50;
    const score = Math.min(100, Math.max(0, preferenceScore));

    if (valid) {
      return {
        valid: true,
        score,
        message: `This slot works well for the client. Score: ${score}/100.${details ? ` Details: ${details}` : ""}`,
      };
    } else {
      return {
        valid: false,
        score,
        reasons,
        message: `This slot doesn't work. ${reasons.join(". ")}. Ask for alternatives.`,
      };
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
