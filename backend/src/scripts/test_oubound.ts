/**
 * Test Batch/Outbound Call Script
 *
 * Attempts batch calling first, falls back to individual outbound calls.
 *
 * Usage:
 *   npx tsx backend/src/scripts/testBatchCall.ts
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(rootDir, ".env") });

// ─── Config ─────────────────────────────────────────────────────────────────

const API_KEY = process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "";
const PHONE_NUMBER_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID || "";

const RECIPIENTS = [
  { phone_number: "+41766821744", name: "Recipient 1" },
  { phone_number: "+41794750885", name: "Recipient 2" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

async function elevenLabsFetch<T>(
  urlPath: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const response = await fetch(`https://api.elevenlabs.io${urlPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return { ok: false, status: response.status, data: {} as T, error: errorBody };
  }

  const data = (await response.json()) as T;
  return { ok: true, status: response.status, data };
}

// ─── Batch Call ─────────────────────────────────────────────────────────────

async function tryBatchCall(): Promise<boolean> {
  console.log("Attempting Batch Call API...");
  console.log();

  const result = await elevenLabsFetch<{ batch_call_id?: string; id?: string }>(
    "/v1/convai/batch-calling/submit",
    {
      call_name: `voit-test-${Date.now()}`,
      agent_id: AGENT_ID,
      agent_phone_number_id: PHONE_NUMBER_ID,
      recipients: RECIPIENTS.map((r) => ({
        phone_number: r.phone_number,
        name: r.name,
      })),
    }
  );

  if (!result.ok) {
    console.log(`Batch Call failed (${result.status}): ${result.error}`);
    return false;
  }

  const batchId = result.data.batch_call_id || result.data.id;
  console.log(`Batch Call submitted! ID: ${batchId}`);
  console.log();

  // Poll status
  console.log("Polling batch status...");
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const statusRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/batch-calling/${batchId}`,
      {
        headers: { "xi-api-key": API_KEY },
      }
    );

    if (statusRes.ok) {
      const status = (await statusRes.json()) as Record<string, unknown>;
      console.log(
        `  [${(i + 1) * 5}s] Status: ${status.status} | Dispatched: ${status.total_calls_dispatched} | Finished: ${status.total_calls_finished}`
      );

      if (
        status.status === "completed" ||
        status.status === "failed" ||
        status.status === "cancelled"
      ) {
        break;
      }
    }
  }

  return true;
}

// ─── Individual Outbound Calls ──────────────────────────────────────────────

async function makeIndividualCalls(): Promise<void> {
  console.log("Making individual outbound calls...");
  console.log();

  for (const recipient of RECIPIENTS) {
    console.log(`Calling ${recipient.name} (${recipient.phone_number})...`);

    const result = await elevenLabsFetch<{
      success: boolean;
      message: string;
      conversation_id?: string;
      callSid?: string;
    }>("/v1/convai/twilio/outbound-call", {
      agent_id: AGENT_ID,
      agent_phone_number_id: PHONE_NUMBER_ID,
      to_number: recipient.phone_number,
    });

    if (!result.ok) {
      console.log(`  FAILED (${result.status}): ${result.error}`);
    } else {
      console.log(`  Success: ${result.data.success}`);
      console.log(`  Message: ${result.data.message}`);
      console.log(`  Conversation ID: ${result.data.conversation_id || "-"}`);
      console.log(`  Call SID: ${result.data.callSid || "-"}`);
    }
    console.log();

    // Small delay between calls
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  Voit – Batch/Outbound Call Test");
  console.log("=".repeat(60));
  console.log();
  console.log(`Agent ID:         ${AGENT_ID}`);
  console.log(`Phone Number ID:  ${PHONE_NUMBER_ID}`);
  console.log(`Recipients:       ${RECIPIENTS.map((r) => r.phone_number).join(", ")}`);
  console.log();

  // Try batch first
  const batchWorked = await tryBatchCall();

  if (!batchWorked) {
    console.log();
    console.log("Batch Call not available, falling back to individual calls...");
    console.log();
    await makeIndividualCalls();
  }

  console.log("=".repeat(60));
  console.log("  Done!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
