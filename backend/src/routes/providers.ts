/**
 * Provider Discovery API Routes
 *
 * POST /api/providers/discover  — Search for providers via Firecrawl (or mock)
 * POST /api/providers/extract   — Extract provider info from a specific URL
 * GET  /api/providers/debug     — Check debug mode status
 */

import type { FastifyInstance } from "fastify";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import {
  discoverProviders,
  extractProviderFromUrl,
  getCallPhoneNumber,
  isDebugMode,
  type DiscoveryOptions,
  type DiscoveredProvider,
} from "../services/providerDiscovery.js";

export async function providerRoutes(
  app: FastifyInstance,
  convex: ConvexHttpClient
) {
  /**
   * POST /api/providers/discover
   *
   * Body: { category, location, limit?, query? }
   * Returns discovered providers and saves them to Convex.
   */
  app.post<{
    Body: DiscoveryOptions;
  }>("/api/providers/discover", async (request, reply) => {
    const { category, location, limit, query } = request.body;

    if (!category || !location) {
      return reply.status(400).send({
        error: "category and location are required",
      });
    }

    const result = await discoverProviders({
      category,
      location,
      limit,
      query,
    });

    // Save discovered providers to Convex
    const savedProviders = [];
    for (const provider of result.providers) {
      try {
        const id = await convex.mutation(api.providers.upsert, {
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
        savedProviders.push({ ...provider, _id: id });
      } catch (err) {
        console.error(
          `[ProviderRoutes] Failed to save provider "${provider.name}":`,
          err
        );
      }
    }

    return {
      providers: savedProviders.map((p) => ({
        ...p,
        // Include the phone that would be used for calling
        callPhone: getCallPhoneNumber(p.phone),
      })),
      source: result.source,
      debug: isDebugMode(),
      count: savedProviders.length,
    };
  });

  /**
   * POST /api/providers/extract
   *
   * Body: { url, category }
   * Extracts provider info from a specific URL using Firecrawl.
   */
  app.post<{
    Body: { url: string; category: string };
  }>("/api/providers/extract", async (request, reply) => {
    const { url, category } = request.body;

    if (!url || !category) {
      return reply.status(400).send({
        error: "url and category are required",
      });
    }

    const provider = await extractProviderFromUrl(url, category);

    if (!provider) {
      return reply.status(404).send({
        error: "Could not extract provider info from URL",
      });
    }

    // Save to Convex
    try {
      const id = await convex.mutation(api.providers.upsert, {
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

      return {
        provider: {
          ...provider,
          _id: id,
          callPhone: getCallPhoneNumber(provider.phone),
        },
        debug: isDebugMode(),
      };
    } catch (err) {
      console.error("[ProviderRoutes] Failed to save extracted provider:", err);
      return reply.status(500).send({
        error: "Failed to save provider",
      });
    }
  });

  /**
   * GET /api/providers/debug
   *
   * Returns current debug mode status and debug phone number.
   */
  app.get("/api/providers/debug", async () => {
    return {
      debugMode: isDebugMode(),
      debugPhoneNumber: isDebugMode()
        ? (process.env.DEBUG_PHONE_NUMBER || "+15551234567")
        : "(hidden — not in debug mode)",
      info: isDebugMode()
        ? "All calls will be routed to the debug phone number. Provider data stores real numbers."
        : "Production mode — calls go to real provider numbers.",
    };
  });
}
