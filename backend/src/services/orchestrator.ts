/**
 * ElevenLabs Batch Calling Orchestrator
 *
 * Manages campaign execution via the ElevenLabs Batch Calling API.
 * - launchCampaign: submits a batch of outbound calls
 * - checkBatchStatus: polls batch status
 * - cancelBatch: cancels a running batch
 *
 * In DEBUG_MODE all recipient phone numbers are replaced with DEBUG_PHONE_NUMBER
 * so test calls go to your phone instead of real providers.
 */

import { getCallPhoneNumber, isDebugMode } from "./providerDiscovery.js";
import { composeSystemPrompt, getFirstMessage } from "./agentPrompt.js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CampaignProvider {
  providerId: string; // Convex ID
  name: string;
  phone: string;
  category: string;
}

export interface CampaignUser {
  userId: string; // Convex user ID
  name: string;
  phone: string;
}

export interface CampaignRequest {
  category: string;
  serviceType: string;
  timeframe: string;
  preferredTime: string;
}

export interface LaunchCampaignParams {
  campaignId: string;
  providers: CampaignProvider[];
  user: CampaignUser;
  request: CampaignRequest;
}

export interface BatchRecipient {
  phone_number: string;
  conversation_initiation_client_data?: {
    conversation_config_override?: {
      agent?: {
        prompt?: { prompt?: string };
        first_message?: string;
      };
    };
    dynamic_variables?: Record<string, string | number | boolean>;
  };
}

export interface BatchCallPayload {
  call_name: string;
  agent_id: string;
  agent_phone_number_id: string;
  recipients: BatchRecipient[];
}

export interface BatchStatusResponse {
  batch_call_id?: string;
  id?: string;
  status: string;
  created_at?: string;
  created_at_unix?: number;
  total_calls_dispatched?: number;
  total_calls_finished?: number;
}

// ─── Config ─────────────────────────────────────────────────────────────────

function getElevenLabsApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return key;
}

function getAgentId(): string {
  const id = process.env.ELEVENLABS_AGENT_ID;
  if (!id) throw new Error("ELEVENLABS_AGENT_ID is not set");
  return id;
}

function getPhoneNumberId(): string {
  const id = process.env.ELEVENLABS_PHONE_NUMBER_ID;
  if (!id) throw new Error("ELEVENLABS_PHONE_NUMBER_ID is not set");
  return id;
}

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

// ─── API Helpers ────────────────────────────────────────────────────────────

async function elevenLabsFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ELEVENLABS_BASE_URL}${path}`;
  const apiKey = getElevenLabsApiKey();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Launch a campaign by submitting a batch call job to ElevenLabs.
 *
 * Each provider becomes a recipient with custom_variables that the agent's
 * system prompt uses via {{variable_name}} syntax.
 *
 * The system prompt is composed from the two-layer architecture:
 * BASE_PROMPT + user's custom prompt (if any).
 * The agent_name variable is read from the user's profile (defaults to "Voit").
 */
export async function launchCampaign(
  params: LaunchCampaignParams
): Promise<{ batchId: string }> {
  const { campaignId, providers, user, request } = params;

  console.log(
    `[Orchestrator] Launching campaign ${campaignId} with ${providers.length} providers`
  );
  if (isDebugMode()) {
    console.log(
      `[Orchestrator] DEBUG MODE — all calls routed to ${process.env.DEBUG_PHONE_NUMBER}`
    );
  }

  // Read user profile for custom prompt and agent name
  let userCustomPrompt: string | null = null;
  let agentName = "Voit"; // Default

  try {
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl && user.userId) {
      const convex = new ConvexHttpClient(convexUrl);
      const userProfile = await convex.query(api.users.getById, {
        id: user.userId as Id<"users">,
      });
      if (userProfile) {
        userCustomPrompt = userProfile.customPrompt || null;
        agentName = userProfile.agentName || "Voit";
      }
    }
  } catch (error) {
    console.warn("[Orchestrator] Could not read user profile for prompt composition:", error);
  }

  // Compose the two-layer system prompt
  const systemPrompt = composeSystemPrompt(userCustomPrompt);

  // Build recipients with per-recipient overrides and dynamic variables
  // Per the ElevenLabs API spec, dynamic_variables and conversation_config_override
  // are both inside conversation_initiation_client_data
  const batchRecipients: BatchRecipient[] = providers.map((provider) => {
    const callPhone = getCallPhoneNumber(provider.phone);
    console.log(
      `[Orchestrator] Recipient: ${provider.name} | real=${provider.phone} | calling=${callPhone}`
    );

    return {
      phone_number: callPhone,
      conversation_initiation_client_data: {
        dynamic_variables: {
          agent_name: agentName,
          campaign_id: campaignId,
          provider_id: provider.providerId,
          provider_name: provider.name,
          provider_category: provider.category,
          service_type: request.serviceType,
          timeframe: request.timeframe,
          preferred_time: request.preferredTime,
          client_name: user.name,
          client_phone: user.phone,
        },
      },
    };
  });

  const payload: BatchCallPayload = {
    call_name: `Campaign ${campaignId.slice(0, 8)} - ${request.category}`,
    agent_id: getAgentId(),
    agent_phone_number_id: getPhoneNumberId(),
    recipients: batchRecipients,
  };

  console.log(
    `[Orchestrator] Submitting batch with ${batchRecipients.length} recipients (agent_name="${agentName}")`
  );

  const response = await elevenLabsFetch<{ id?: string; batch_call_id?: string }>(
    "/v1/convai/batch-calling/submit",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const batchId = response.id || response.batch_call_id || "unknown";

  console.log(
    `[Orchestrator] Batch submitted: ${batchId}`
  );

  return { batchId };
}

/**
 * Check the status of a running batch call job.
 */
export async function checkBatchStatus(
  batchId: string
): Promise<BatchStatusResponse> {
  console.log(`[Orchestrator] Checking batch status: ${batchId}`);

  const response = await elevenLabsFetch<BatchStatusResponse>(
    `/v1/convai/batch-calling/${batchId}`,
    { method: "GET" }
  );

  console.log(
    `[Orchestrator] Batch ${batchId} status: ${response.status}`
  );

  return response;
}

/**
 * Cancel a running batch call job.
 */
export async function cancelBatch(batchId: string): Promise<void> {
  console.log(`[Orchestrator] Cancelling batch: ${batchId}`);

  await elevenLabsFetch(
    `/v1/convai/batch-calling/${batchId}/cancel`,
    { method: "POST" }
  );

  console.log(`[Orchestrator] Batch ${batchId} cancelled`);
}
