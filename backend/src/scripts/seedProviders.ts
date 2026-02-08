/**
 * Seed Script: Populate Convex with ~30 providers across categories.
 *
 * Uses the providerDiscovery service, which will use Firecrawl if
 * FIRECRAWL_API_KEY is set, otherwise falls back to realistic mock data.
 *
 * Usage:
 *   pnpm --filter backend run seed
 *   # or from root:
 *   pnpm run seed
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import {
  discoverProviders,
  type DiscoveryOptions,
} from "../services/providerDiscovery.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");

// Load env
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });

const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL || "";

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL is not set. Run `npx convex dev` first.");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// ─── Categories to seed ─────────────────────────────────────────────────────

const SEED_CATEGORIES: DiscoveryOptions[] = [
  { category: "dental", location: "Portland, OR", limit: 7 },
  { category: "restaurant", location: "Portland, OR", limit: 7 },
  { category: "barber", location: "Portland, OR", limit: 5 },
  { category: "auto", location: "Portland, OR", limit: 5 },
  { category: "healthcare", location: "Portland, OR", limit: 6 },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding providers into Convex...");
  console.log(`   Convex URL: ${CONVEX_URL}`);
  console.log(
    `   Firecrawl: ${process.env.FIRECRAWL_API_KEY ? "enabled" : "mock mode"}`
  );
  console.log("");

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const options of SEED_CATEGORIES) {
    console.log(
      `📋 Discovering ${options.category} providers in ${options.location}...`
    );

    const result = await discoverProviders(options);

    console.log(
      `   Found ${result.providers.length} providers (source: ${result.source})`
    );

    for (const provider of result.providers) {
      try {
        await convex.mutation(api.providers.upsert, {
          name: provider.name,
          phone: provider.phone,
          website: provider.website,
          address: provider.address,
          city: provider.city,
          state: provider.state,
          zipCode: provider.zipCode,
          lat: provider.lat,
          lng: provider.lng,
          category: provider.category,
          subcategories: provider.subcategories,
          specialties: provider.specialties,
          rating: provider.rating,
          reviewCount: provider.reviewCount,
          priceLevel: provider.priceLevel,
          description: provider.description,
          businessHours: provider.businessHours,
          source: provider.source,
          sourceUrl: provider.sourceUrl,
          rawData: provider.rawData,
          metadata: provider.metadata,
        });
        totalInserted++;
        process.stdout.write(`   ✅ ${provider.name}\n`);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        // If it's a duplicate (already exists), count as skipped
        if (message.includes("already exists")) {
          totalSkipped++;
          process.stdout.write(`   ⏭️  ${provider.name} (already exists)\n`);
        } else {
          console.error(`   ❌ ${provider.name}: ${message}`);
        }
      }
    }

    console.log("");
  }

  console.log("─".repeat(50));
  console.log(
    `🎉 Seeding complete! Inserted: ${totalInserted}, Skipped: ${totalSkipped}`
  );
  console.log(
    `   Total providers in categories: ${SEED_CATEGORIES.reduce(
      (sum, c) => sum + (c.limit || 10),
      0
    )}`
  );
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
