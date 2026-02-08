/**
 * Test Call Script
 *
 * End-to-end verification that ElevenLabs + Twilio + tool webhooks + Convex
 * all work together.
 *
 * Usage:
 *   pnpm --filter backend run test:call
 *
 * Prerequisites:
 *   - .env configured with ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, etc.
 *   - DEBUG_MODE=true with DEBUG_PHONE_NUMBER set to your phone
 *   - Backend running (pnpm --filter backend run dev)
 *   - ngrok running (ngrok http 3088 --url=deciding-doberman-stirred.ngrok-free.app)
 *   - Convex dev running (npx convex dev)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import { launchCampaign, checkBatchStatus } from "../services/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");

// Load env
dotenv.config({ path: path.join(rootDir, ".env") });

// ─── Config ─────────────────────────────────────────────────────────────────

const CONVEX_URL = process.env.CONVEX_URL || "";
const POLL_INTERVAL_MS = 5000; // Check status every 5 seconds
const MAX_POLL_ATTEMPTS = 60; // Max 5 minutes of polling

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  Voit Test Call Script");
  console.log("=".repeat(60));
  console.log();

  // Validate environment
  const requiredEnvVars = [
    "CONVEX_URL",
    "ELEVENLABS_API_KEY",
    "ELEVENLABS_AGENT_ID",
    "ELEVENLABS_PHONE_NUMBER_ID",
  ];

  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (process.env.DEBUG_MODE !== "true") {
    console.error("DEBUG_MODE must be 'true' for test calls.");
    console.error(
      "Set DEBUG_MODE=true and DEBUG_PHONE_NUMBER=<your-phone> in .env"
    );
    process.exit(1);
  }

  console.log(`Debug Mode: ON`);
  console.log(`Debug Phone: ${process.env.DEBUG_PHONE_NUMBER}`);
  console.log(`API URL: ${process.env.API_URL || "(not set)"}`);
  console.log(`Agent ID: ${process.env.ELEVENLABS_AGENT_ID}`);
  console.log();

  // Initialize Convex
  const convex = new ConvexHttpClient(CONVEX_URL);

  // Step 1: Find or get a test user
  console.log("Step 1: Looking for a test user...");
  const users = await convex.query(api.users.list, {});

  if (users.length === 0) {
    console.error(
      "No users found in the database. Please log in to the frontend first to create a user."
    );
    process.exit(1);
  }

  const testUser = users[0]!;
  console.log(`  Using user: ${testUser.name} (${testUser.email})`);

  // Step 2: Find a test provider
  console.log("\nStep 2: Looking for a test provider...");
  const providers = await convex.query(api.providers.listAll, {});

  if (providers.length === 0) {
    console.error(
      "No providers found. Run 'pnpm --filter backend run seed' first."
    );
    process.exit(1);
  }

  const testProvider = providers[0]!;
  console.log(
    `  Using provider: ${testProvider.name} (${testProvider.category})`
  );
  console.log(
    `  Real phone: ${testProvider.phone} -> Debug override: ${process.env.DEBUG_PHONE_NUMBER}`
  );

  // Step 3: Create a test campaign
  console.log("\nStep 3: Creating test campaign...");
  const campaignId = await convex.mutation(api.campaigns.create, {
    userId: testUser._id,
    request: {
      raw: "Test call - checking appointment availability",
      category: testProvider.category,
      specifics: `${testProvider.category} appointment`,
      timeframe: "this week",
      preferredTime: "morning",
    },
    providerIds: [testProvider._id],
  });
  console.log(`  Campaign created: ${campaignId}`);

  // Step 4: Create agentCall record
  console.log("\nStep 4: Creating agentCall record...");
  const agentCallId = await convex.mutation(api.agentCalls.create, {
    campaignId,
    providerId: testProvider._id,
  });
  console.log(`  AgentCall created: ${agentCallId}`);

  // Step 5: Launch the call
  console.log("\nStep 5: Launching call via ElevenLabs Batch Calling API...");
  try {
    const { batchId } = await launchCampaign({
      campaignId,
      providers: [
        {
          providerId: testProvider._id,
          name: testProvider.name,
          phone: testProvider.phone,
          category: testProvider.category,
        },
      ],
      user: {
        userId: testUser._id,
        name: testUser.name,
        phone: process.env.DEBUG_PHONE_NUMBER || testUser.email,
      },
      request: {
        category: testProvider.category,
        serviceType: `${testProvider.category} appointment`,
        timeframe: "this week",
        preferredTime: "morning",
      },
    });

    console.log(`  Batch submitted! Batch ID: ${batchId}`);

    // Update campaign with batch ID
    await convex.mutation(api.campaigns.updateStatus, {
      campaignId,
      status: "ACTIVE",
      batchId,
    });

    // Step 6: Poll for status
    console.log("\nStep 6: Polling for batch status...");
    console.log(`  (Press Ctrl+C to stop polling)\n`);

    let attempts = 0;
    let done = false;

    while (!done && attempts < MAX_POLL_ATTEMPTS) {
      attempts++;
      await sleep(POLL_INTERVAL_MS);

      try {
        const status = await checkBatchStatus(batchId);
        const elapsed = attempts * (POLL_INTERVAL_MS / 1000);

        console.log(
          `  [${elapsed}s] Batch status: ${status.status}`
        );

        if (status.recipients) {
          for (const r of status.recipients) {
            console.log(
              `    Recipient ${r.phone_number}: ${r.status}${r.call_id ? ` (call: ${r.call_id})` : ""}`
            );
          }
        }

        // Check if batch is done
        if (
          status.status === "completed" ||
          status.status === "failed" ||
          status.status === "cancelled"
        ) {
          done = true;
        }
      } catch (error) {
        console.error(`  [${attempts * (POLL_INTERVAL_MS / 1000)}s] Poll error:`, error);
      }
    }

    // Step 7: Verify Convex records
    console.log("\nStep 7: Verifying Convex records...");

    const finalCampaign = await convex.query(api.campaigns.get, {
      campaignId,
    });
    console.log(`  Campaign status: ${finalCampaign?.status}`);

    const calls = await convex.query(api.agentCalls.getByCampaign, {
      campaignId,
    });

    for (const call of calls) {
      console.log(
        `  AgentCall ${call._id}: status=${call.status} outcome=${call.outcome || "pending"}`
      );
      if (call.slotsFound && call.slotsFound.length > 0) {
        console.log(`    Slots found:`);
        for (const slot of call.slotsFound) {
          console.log(
            `      - ${slot.datetime}${slot.details ? ` (${slot.details})` : ""}`
          );
        }
      }
      if (call.transcript) {
        console.log(
          `    Transcript preview: ${call.transcript.slice(0, 200)}...`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("  Test call complete!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\nFailed to launch call:", error);
    console.error(
      "\nMake sure:\n" +
        "  1. ELEVENLABS_API_KEY is valid\n" +
        "  2. ELEVENLABS_AGENT_ID is set to your agent\n" +
        "  3. ELEVENLABS_PHONE_NUMBER_ID is set\n" +
        "  4. The agent has the Twilio phone number configured\n" +
        "  5. ngrok is running if using webhooks\n"
    );
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
