/**
 * Campaign API Routes
 *
 * POST /api/campaigns/launch    — Launch a campaign (creates agentCalls + submits batch)
 * POST /api/campaigns/:id/cancel — Cancel a running campaign
 * GET  /api/campaigns/:id/status — Get campaign + batch status
 */

import type { FastifyInstance } from "fastify";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";
import {
  launchCampaign,
  checkBatchStatus,
  cancelBatch,
} from "../services/orchestrator.js";
import { getCallPhoneNumber, isDebugMode } from "../services/providerDiscovery.js";

export async function campaignRoutes(
  app: FastifyInstance,
  convex: ConvexHttpClient
) {
  /**
   * POST /api/campaigns/launch
   *
   * Body: { campaignId: string }
   *
   * Fetches the campaign from Convex, creates agentCall records for each
   * provider, then submits the batch to ElevenLabs.
   */
  app.post<{
    Body: { campaignId: string };
  }>("/api/campaigns/launch", async (request, reply) => {
    const { campaignId } = request.body;

    if (!campaignId) {
      return reply.status(400).send({ error: "campaignId is required" });
    }

    console.log(`[Campaigns] Launching campaign: ${campaignId}`);

    // 1. Fetch the campaign
    const campaign = await convex.query(api.campaigns.get, {
      campaignId: campaignId as Id<"campaigns">,
    });

    if (!campaign) {
      return reply.status(404).send({ error: "Campaign not found" });
    }

    if (campaign.status !== "PREVIEW") {
      return reply.status(400).send({
        error: `Campaign is in ${campaign.status} state. Only PREVIEW campaigns can be launched.`,
      });
    }

    // 2. Fetch the user
    const user = await convex.query(api.users.getById, {
      id: campaign.userId,
    });

    if (!user) {
      return reply.status(404).send({ error: "Campaign user not found" });
    }

    // 3. Fetch all providers
    const providers = [];
    for (const providerId of campaign.providerIds) {
      const provider = await convex.query(api.providers.getById, {
        id: providerId,
      });
      if (provider) {
        providers.push(provider);
      } else {
        console.warn(
          `[Campaigns] Provider ${providerId} not found, skipping`
        );
      }
    }

    if (providers.length === 0) {
      return reply.status(400).send({
        error: "No valid providers found for this campaign",
      });
    }

    // 4. Create agentCall records for each provider
    const agentCallIds: Id<"agentCalls">[] = [];
    for (const provider of providers) {
      const callId = await convex.mutation(api.agentCalls.create, {
        campaignId: campaignId as Id<"campaigns">,
        providerId: provider._id,
      });
      agentCallIds.push(callId);
    }

    console.log(
      `[Campaigns] Created ${agentCallIds.length} agentCall records`
    );

    // 5. Submit the batch to ElevenLabs
    try {
      const { batchId } = await launchCampaign({
        campaignId,
        providers: providers.map((p) => ({
          providerId: p._id,
          name: p.name,
          phone: p.phone,
          category: p.category,
        })),
        user: {
          userId: user._id,
          name: user.name,
          phone: user.email, // Use email as fallback; real phone from user profile when available
        },
        request: {
          category: campaign.request.category,
          serviceType: campaign.request.specifics || campaign.request.category,
          timeframe: campaign.request.timeframe,
          preferredTime: campaign.request.preferredTime || "any time",
        },
      });

      // 6. Update campaign status to ACTIVE with the batch ID
      await convex.mutation(api.campaigns.updateStatus, {
        campaignId: campaignId as Id<"campaigns">,
        status: "ACTIVE",
        batchId,
      });

      console.log(
        `[Campaigns] Campaign ${campaignId} launched. Batch ID: ${batchId}`
      );

      return {
        campaignId,
        batchId,
        callCount: agentCallIds.length,
        debugMode: isDebugMode(),
        providers: providers.map((p) => ({
          id: p._id,
          name: p.name,
          realPhone: p.phone,
          callPhone: getCallPhoneNumber(p.phone),
        })),
        status: "ACTIVE",
      };
    } catch (error) {
      console.error("[Campaigns] Failed to launch batch:", error);

      // Mark campaign as failed
      await convex.mutation(api.campaigns.updateStatus, {
        campaignId: campaignId as Id<"campaigns">,
        status: "FAILED",
      });

      // Mark all agent calls as failed
      for (const callId of agentCallIds) {
        await convex.mutation(api.agentCalls.updateStatus, {
          callId,
          status: "FAILED",
          outcome: "ERROR",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }

      return reply.status(500).send({
        error: "Failed to submit batch to ElevenLabs",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/campaigns/:id/cancel
   *
   * Cancels a running campaign and its ElevenLabs batch.
   */
  app.post<{
    Params: { id: string };
  }>("/api/campaigns/:id/cancel", async (request, reply) => {
    const { id } = request.params;
    console.log(`[Campaigns] Cancelling campaign: ${id}`);

    const campaign = await convex.query(api.campaigns.get, {
      campaignId: id as Id<"campaigns">,
    });

    if (!campaign) {
      return reply.status(404).send({ error: "Campaign not found" });
    }

    if (campaign.status !== "ACTIVE") {
      return reply.status(400).send({
        error: `Campaign is in ${campaign.status} state. Only ACTIVE campaigns can be cancelled.`,
      });
    }

    // Cancel the ElevenLabs batch if we have a batch ID
    if (campaign.batchId) {
      try {
        await cancelBatch(campaign.batchId);
      } catch (error) {
        console.error(
          "[Campaigns] Error cancelling ElevenLabs batch:",
          error
        );
        // Continue with Convex update even if ElevenLabs cancel fails
      }
    }

    // Update campaign status
    await convex.mutation(api.campaigns.updateStatus, {
      campaignId: id as Id<"campaigns">,
      status: "CANCELLED",
    });

    // Cancel all queued/in-progress calls
    const calls = await convex.query(api.agentCalls.getByCampaign, {
      campaignId: id as Id<"campaigns">,
    });

    const cancellableStatuses = [
      "QUEUED",
      "RINGING",
      "CONNECTED",
      "NEGOTIATING",
      "ON_HOLD",
    ];
    for (const call of calls) {
      if (cancellableStatuses.includes(call.status)) {
        await convex.mutation(api.agentCalls.updateStatus, {
          callId: call._id,
          status: "CANCELLED",
        });
      }
    }

    return {
      campaignId: id,
      status: "CANCELLED",
      message: "Campaign cancelled successfully.",
    };
  });

  /**
   * GET /api/campaigns/:id/status
   *
   * Returns the campaign status, including ElevenLabs batch status if available.
   */
  app.get<{
    Params: { id: string };
  }>("/api/campaigns/:id/status", async (request, reply) => {
    const { id } = request.params;

    const campaign = await convex.query(api.campaigns.get, {
      campaignId: id as Id<"campaigns">,
    });

    if (!campaign) {
      return reply.status(404).send({ error: "Campaign not found" });
    }

    // Fetch all agent calls for this campaign
    const calls = await convex.query(api.agentCalls.getByCampaign, {
      campaignId: id as Id<"campaigns">,
    });

    // Summarize call statuses
    const statusSummary: Record<string, number> = {};
    for (const call of calls) {
      statusSummary[call.status] = (statusSummary[call.status] || 0) + 1;
    }

    // Get ElevenLabs batch status if available
    let batchStatus = null;
    if (campaign.batchId && campaign.status === "ACTIVE") {
      try {
        batchStatus = await checkBatchStatus(campaign.batchId);
      } catch (error) {
        console.error("[Campaigns] Error checking batch status:", error);
        batchStatus = {
          error: "Could not fetch batch status from ElevenLabs",
        };
      }
    }

    // Collect found slots across all calls
    const slotsFound = calls
      .filter((call) => call.slotsFound && call.slotsFound.length > 0)
      .map((call) => ({
        providerId: call.providerId,
        slots: call.slotsFound,
        confidence: call.confidenceScore,
      }));

    return {
      campaignId: id,
      status: campaign.status,
      request: campaign.request,
      batchId: campaign.batchId,
      batchStatus,
      totalCalls: calls.length,
      statusSummary,
      slotsFound,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
    };
  });
}
