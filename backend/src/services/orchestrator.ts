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
import { getSystemPrompt, getFirstMessage } from "./agentPrompt.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CampaignProvider {
  providerId: string; // Convex ID
  name: string;
  phone: string;
  category: string;
}

export interface CampaignUser {
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
  name: string;
  custom_variables: Record<string, string>;
}

export interface BatchCallPayload {
  agent_id: string;
  phone_number_id: string;
  recipients: BatchRecipient[];
  system_prompt?: string;
  first_message?: string;
}

export interface BatchStatusResponse {
  batch_call_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  recipients: Array<{
    phone_number: string;
    status: string;
    call_id?: string;
    conversation_id?: string;
  }>;
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

  const recipients: BatchRecipient[] = providers.map((provider) => ({
    phone_number: getCallPhoneNumber(provider.phone),
    name: provider.name,
    custom_variables: {
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
  }));

  const payload: BatchCallPayload = {
    agent_id: getAgentId(),
    phone_number_id: getPhoneNumberId(),
    recipients,
    // Override system prompt and first message with our templates
    system_prompt: getSystemPrompt(),
    first_message: getFirstMessage(),
  };

  console.log(
    `[Orchestrator] Submitting batch with ${recipients.length} recipients`
  );

  const response = await elevenLabsFetch<{ batch_call_id: string }>(
    "/v1/convai/batch-calling/submit",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  console.log(
    `[Orchestrator] Batch submitted: ${response.batch_call_id}`
  );

  return { batchId: response.batch_call_id };
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
