/**
 * Provider Discovery Service
 *
 * Uses Google Places API as the **primary** source for finding providers
 * (dentists, restaurants, barbers, etc.), with Firecrawl as a **secondary**
 * enrichment source for data that Places may not have (descriptions,
 * specialties, etc.).
 *
 * Falls back to mock data when neither API is configured or when errors occur.
 *
 * DEBUG_MODE: When enabled, the phone number used for *calls* (not stored data)
 * is overridden with DEBUG_PHONE_NUMBER. The real phone is always stored.
 */

import FirecrawlApp from "@mendable/firecrawl-js";
import {
  searchNearbyProviders as googleSearchNearby,
  textSearchProviders as googleTextSearch,
  getPlaceDetails as googleGetPlaceDetails,
  calculateDistance as googleCalculateDistance,
  resolveGooglePlacesType,
  type PlaceSearchResult,
  type DistanceResult,
} from "./googleMaps.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DiscoveredProvider {
  name: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  category: string;
  subcategories?: string[];
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  description?: string;
  businessHours?: Record<
    string,
    { open: string; close: string } | undefined
  >;
  source: "firecrawl" | "manual" | "mock";
  sourceUrl?: string;
  rawData?: unknown;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryOptions {
  category: string;
  location: string; // e.g. "Portland, OR"
  lat?: number; // user latitude for Places API
  lng?: number; // user longitude for Places API
  radiusMeters?: number; // search radius in meters (default 5000)
  limit?: number;
  query?: string; // additional search terms like "Italian restaurant"
}

export interface DiscoveryResult {
  providers: DiscoveredProvider[];
  source: "google_places" | "firecrawl" | "mock";
  rawSearchResults?: unknown;
}

// ─── Config (read lazily so dotenv has time to load) ────────────────────────

function getFirecrawlApiKey(): string {
  return process.env.FIRECRAWL_API_KEY || "";
}

/**
 * Returns the phone number(s) configured for debug mode.
 * Supports comma-separated list: "+1555...,+1666..."
 */
export function getDebugPhoneNumbers(): string[] {
  const raw = process.env.DEBUG_PHONE_NUMBER || "+15551234567";
  return raw.split(",").map((n) => n.trim()).filter(Boolean);
}

/**
 * Returns the phone number to use when placing calls.
 * In debug mode, returns a debug number (round-robins if multiple configured).
 * The *stored* phone in the database is always the real one.
 */
let debugPhoneIndex = 0;
export function getCallPhoneNumber(realPhone: string): string {
  if (isDebugMode()) {
    const numbers = getDebugPhoneNumbers();
    const number = numbers[debugPhoneIndex % numbers.length];
    debugPhoneIndex++;
    return number;
  }
  return realPhone;
}

export function isDebugMode(): boolean {
  return process.env.DEBUG_MODE === "true";
}

// ─── Firecrawl Client ───────────────────────────────────────────────────────

let firecrawlClient: FirecrawlApp | null = null;

function getFirecrawlClient(): FirecrawlApp | null {
  const apiKey = getFirecrawlApiKey();
  if (!apiKey) {
    return null;
  }
  if (!firecrawlClient) {
    firecrawlClient = new FirecrawlApp({ apiKey });
  }
  return firecrawlClient;
}

// ─── Search & Extract ───────────────────────────────────────────────────────

/**
 * Search for providers using Google Places as primary, Firecrawl as secondary.
 * Falls back to mock data if both fail or are unconfigured.
 */
export async function discoverProviders(
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const limit = options.limit || 10;

  // ─── Try Google Places first (primary) ─────────────────────────────
  const hasGoogleMapsKey = !!(
    process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACE_ID
  );
  const hasLocation = options.lat !== undefined && options.lng !== undefined;

  if (hasGoogleMapsKey) {
    try {
      const radius = options.radiusMeters || 5000;
      let places: PlaceSearchResult[] = [];

      // Use Text Search with the raw user query — Google understands natural language
      // This is far superior to keyword-based category → type mapping
      const rawQuery = options.query || options.category;

      if (rawQuery && rawQuery !== "general") {
        console.log(
          `[ProviderDiscovery] Text Search: "${rawQuery}"${hasLocation ? ` near (${options.lat}, ${options.lng})` : ""}`
        );

        places = await googleTextSearch(
          rawQuery,
          hasLocation ? options.lat : undefined,
          hasLocation ? options.lng : undefined,
          radius,
          limit
        );
      }

      // Fallback to Nearby Search if Text Search returned nothing and we have a known category
      if (places.length === 0 && hasLocation) {
        const placesType = resolveGooglePlacesType(options.category);
        console.log(
          `[ProviderDiscovery] Fallback to Nearby Search: type="${placesType}" at (${options.lat}, ${options.lng})`
        );

        places = await googleSearchNearby(
          options.lat!,
          options.lng!,
          radius,
          placesType,
          limit
        );
      }

      if (places.length > 0) {
        // Fetch details for each place (phone, hours, website)
        const providers: DiscoveredProvider[] = [];

        for (const place of places) {
          const details = await googleGetPlaceDetails(place.placeId);
          // Small delay to be polite to the API
          await new Promise((r) => setTimeout(r, 100));

          const phone =
            details?.internationalPhone ||
            details?.phone ||
            "";

          // Normalize phone to E.164
          const normalizedPhone = phone ? normalizePhone(phone) : "";

          const locationParts = options.location.split(",").map((s) => s.trim());
          const city = locationParts[0] || "";
          const state = locationParts[1] || "";

          // Try to parse city/state from formatted address
          const addrParts = details?.formattedAddress?.split(",").map((s) => s.trim()) || [];
          const parsedCity = addrParts.length >= 3 ? addrParts[addrParts.length - 3] : city;
          const stateZip = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : "";
          const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/);
          const parsedState = stateMatch?.[1] || state;
          const parsedZip = stateMatch?.[2] || "";

          providers.push({
            name: place.name,
            phone: normalizedPhone,
            website: details?.website || undefined,
            address: place.address || details?.formattedAddress || "",
            city: parsedCity || city,
            state: parsedState || state,
            zipCode: parsedZip,
            lat: place.lat,
            lng: place.lng,
            category: options.category,
            rating: place.rating ?? undefined,
            reviewCount: place.reviewCount ?? undefined,
            source: "firecrawl" as const, // Using "firecrawl" to match existing schema enum
            sourceUrl: undefined,
            rawData: { placeId: place.placeId, googlePlaces: true },
            metadata: {
              placeId: place.placeId,
              openNow: place.openNow,
              discoveredVia: "google_places",
            },
          });
        }

        // If Firecrawl is also available, try to enrich with descriptions/specialties
        const firecrawlClient = getFirecrawlClient();
        if (firecrawlClient && providers.length > 0) {
          try {
            await enrichWithFirecrawl(firecrawlClient, providers, options);
          } catch (err) {
            console.warn(
              "[ProviderDiscovery] Firecrawl enrichment failed (non-fatal):",
              err
            );
          }
        }

        console.log(
          `[ProviderDiscovery] Found ${providers.length} providers via Google Places`
        );

        return {
          providers,
          source: "google_places",
        };
      }
    } catch (error) {
      console.error("[ProviderDiscovery] Google Places error:", error);
    }
  }

  // ─── Fallback to Firecrawl (secondary) ─────────────────────────────
  const client = getFirecrawlClient();

  if (client) {
    try {
      const searchQuery = buildSearchQuery(options);
      console.log(`[ProviderDiscovery] Searching Firecrawl: "${searchQuery}"`);

      const searchResponse = await client.search(searchQuery, {
        limit,
      });

      const webResults = searchResponse.web || [];

      if (webResults.length > 0) {
        const providers: DiscoveredProvider[] = [];

        for (const result of webResults) {
          const extracted = parseSearchResult(
            result as Record<string, unknown>,
            options.category
          );
          if (extracted) {
            providers.push(extracted);
          }
        }

        if (providers.length > 0) {
          console.log(
            `[ProviderDiscovery] Found ${providers.length} providers via Firecrawl`
          );

          return {
            providers,
            source: "firecrawl",
            rawSearchResults: searchResponse,
          };
        }
      }

      console.log("[ProviderDiscovery] No Firecrawl results either");
    } catch (error) {
      console.error("[ProviderDiscovery] Firecrawl error:", error);
    }
  }

  // ─── Final fallback: mock data ─────────────────────────────────────
  console.log(
    "[ProviderDiscovery] No APIs returned results — falling back to mock data"
  );
  return {
    providers: generateMockProviders(options),
    source: "mock",
  };
}

/**
 * Enrich Google Places results with Firecrawl data (descriptions, specialties).
 * Runs a single search and tries to match by name.
 */
async function enrichWithFirecrawl(
  client: FirecrawlApp,
  providers: DiscoveredProvider[],
  options: DiscoveryOptions
): Promise<void> {
  const searchQuery = buildSearchQuery(options);
  console.log(
    `[ProviderDiscovery] Enriching ${providers.length} providers via Firecrawl`
  );

  const searchResponse = await client.search(searchQuery, {
    limit: options.limit || 10,
  });

  const webResults = searchResponse.web || [];

  for (const result of webResults) {
    const parsed = parseSearchResult(
      result as Record<string, unknown>,
      options.category
    );
    if (!parsed) continue;

    // Try to match by name (fuzzy)
    const match = providers.find(
      (p) =>
        p.name.toLowerCase().includes(parsed.name.toLowerCase()) ||
        parsed.name.toLowerCase().includes(p.name.toLowerCase())
    );

    if (match) {
      // Enrich missing fields
      if (!match.description && parsed.description) {
        match.description = parsed.description;
      }
      if (
        (!match.specialties || match.specialties.length === 0) &&
        parsed.specialties
      ) {
        match.specialties = parsed.specialties;
      }
      if (!match.website && parsed.website) {
        match.website = parsed.website;
      }
    }
  }
}

/**
 * Rank providers by distance from a user's location.
 * Uses Google Maps Distance Matrix for accurate driving distances.
 */
export async function rankByDistance(
  providers: DiscoveredProvider[],
  userLat: number,
  userLng: number
): Promise<Array<DiscoveredProvider & { distance?: DistanceResult }>> {
  const results: Array<DiscoveredProvider & { distance?: DistanceResult }> = [];

  for (const provider of providers) {
    if (provider.lat && provider.lng) {
      const distance = await googleCalculateDistance(
        { lat: userLat, lng: userLng },
        { lat: provider.lat, lng: provider.lng }
      );
      results.push({ ...provider, distance: distance || undefined });
    } else {
      results.push({ ...provider });
    }
  }

  // Sort by distance (nearest first), providers without distance go last
  results.sort((a, b) => {
    if (!a.distance && !b.distance) return 0;
    if (!a.distance) return 1;
    if (!b.distance) return -1;
    return a.distance.distanceMeters - b.distance.distanceMeters;
  });

  return results;
}

/**
 * Use Firecrawl's extract endpoint on a specific URL to get structured
 * provider data (business name, phone, address, hours, etc.)
 */
export async function extractProviderFromUrl(
  url: string,
  category: string
): Promise<DiscoveredProvider | null> {
  const client = getFirecrawlClient();
  if (!client) return null;

  try {
    // v4 API: scrape() returns Document directly. Use "json" format with a
    // schema to extract structured data (replaces the old "extract" format).
    const scrapeResponse = await client.scrape(url, {
      formats: [
        {
          type: "json",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              phone: { type: "string" },
              address: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              zipCode: { type: "string" },
              description: { type: "string" },
              rating: { type: "number" },
              reviewCount: { type: "number" },
              website: { type: "string" },
              businessHours: {
                type: "object",
                properties: {
                  monday: {
                    type: "object",
                    properties: {
                      open: { type: "string" },
                      close: { type: "string" },
                    },
                  },
                  tuesday: {
                    type: "object",
                    properties: {
                      open: { type: "string" },
                      close: { type: "string" },
                    },
                  },
                  wednesday: {
                    type: "object",
                    properties: {
                      open: { type: "string" },
                      close: { type: "string" },
                    },
                  },
                  thursday: {
                    type: "object",
                    properties: {
                      open: { type: "string" },
                      close: { type: "string" },
                    },
                  },
                  friday: {
                    type: "object",
                    properties: {
                      open: { type: "string" },
                      close: { type: "string" },
                    },
                  },
                  saturday: {
                    type: "object",
                    properties: {
                      open: { type: "string" },
                      close: { type: "string" },
                    },
                  },
                  sunday: {
                    type: "object",
                    properties: {
                      open: { type: "string" },
                      close: { type: "string" },
                    },
                  },
                },
              },
            },
            required: ["name"],
          },
        },
      ],
    });

    // v4: scrape returns Document; extracted data lives in the json field
    const data = (scrapeResponse.json || scrapeResponse) as Record<string, unknown>;
    if (!data.name) {
      return null;
    }

    return {
      name: (data.name as string) || "Unknown",
      phone: (data.phone as string) || "",
      website: (data.website as string) || url,
      address: (data.address as string) || "",
      city: (data.city as string) || "",
      state: (data.state as string) || "",
      zipCode: (data.zipCode as string) || "",
      lat: 0,
      lng: 0,
      category,
      rating: data.rating as number | undefined,
      reviewCount: data.reviewCount as number | undefined,
      description: (data.description as string) || undefined,
      businessHours: data.businessHours as DiscoveredProvider["businessHours"],
      source: "firecrawl",
      sourceUrl: url,
      rawData: scrapeResponse,
    };
  } catch (error) {
    console.error(
      `[ProviderDiscovery] Extract error for ${url}:`,
      error
    );
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildSearchQuery(options: DiscoveryOptions): string {
  const parts = [options.query || options.category, options.location];

  // Add category-specific search hints
  const categoryHints: Record<string, string> = {
    dental: "dentist dental office",
    restaurant: "restaurant dining",
    barber: "barber shop haircut",
    auto: "auto mechanic car repair",
    healthcare: "doctor medical clinic",
    salon: "hair salon beauty",
    veterinary: "vet veterinary animal clinic",
    fitness: "gym fitness studio",
  };

  const hint = categoryHints[options.category.toLowerCase()];
  if (hint && !options.query) {
    parts[0] = hint;
  }

  parts.push("phone number address");

  return parts.join(" ");
}

function parseSearchResult(
  result: Record<string, unknown>,
  category: string
): DiscoveredProvider | null {
  // Firecrawl search returns { title, url, description, markdown, ... }
  const title = (result.title as string) || "";
  const description = (result.description as string) || "";
  const url = (result.url as string) || "";
  const markdown = (result.markdown as string) || "";

  // Try to extract a phone number from available text
  const fullText = `${title} ${description} ${markdown}`;
  const phoneMatch = fullText.match(
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );
  const phone = phoneMatch ? normalizePhone(phoneMatch[0]) : "";

  // Try to extract a name — use title, clean up site names
  const name = cleanProviderName(title);

  if (!name) return null;

  // Try to extract address components from text
  const addressInfo = extractAddress(fullText);

  return {
    name,
    phone,
    website: url,
    address: addressInfo.address,
    city: addressInfo.city,
    state: addressInfo.state,
    zipCode: addressInfo.zipCode,
    lat: 0, // Would need geocoding API to get real coords
    lng: 0,
    category,
    description: description.slice(0, 500),
    source: "firecrawl",
    sourceUrl: url,
    rawData: result,
  };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

function cleanProviderName(title: string): string {
  // Remove common suffixes like " - Yelp", " | Google Maps", " - Reviews"
  return title
    .replace(/\s*[-|–]\s*(Yelp|Google.*|Reviews|Maps|Directions).*/i, "")
    .replace(/\s*\(.*\)$/, "")
    .trim();
}

function extractAddress(text: string): {
  address: string;
  city: string;
  state: string;
  zipCode: string;
} {
  // Try to find a US address pattern
  const zipMatch = text.match(
    /(\d+\s+[^,\n]+),?\s*([A-Za-z\s]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/
  );
  if (zipMatch) {
    return {
      address: zipMatch[1].trim(),
      city: zipMatch[2].trim(),
      state: zipMatch[3].trim(),
      zipCode: zipMatch[4].trim(),
    };
  }

  // Fallback — try at least to get state + zip
  const stateZipMatch = text.match(/([A-Z]{2})\s+(\d{5})/);
  return {
    address: "",
    city: "",
    state: stateZipMatch?.[1] || "",
    zipCode: stateZipMatch?.[2] || "",
  };
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

/**
 * Generate realistic mock provider data for development/testing.
 * Shaped exactly like Firecrawl output so switching is seamless.
 */
export function generateMockProviders(
  options: DiscoveryOptions
): DiscoveredProvider[] {
  const { category, location } = options;
  const limit = options.limit || 10;

  const mocksByCategory: Record<string, Partial<DiscoveredProvider>[]> = {
    dental: [
      { name: "Bright Smile Dental Care", phone: "+15035551001", address: "1234 NW 23rd Ave", specialties: ["General Dentistry", "Cosmetic"], rating: 4.7, reviewCount: 234 },
      { name: "Portland Family Dentistry", phone: "+15035551002", address: "567 SE Division St", specialties: ["Family Dentistry", "Orthodontics"], rating: 4.5, reviewCount: 189 },
      { name: "Rose City Dental", phone: "+15035551003", address: "890 NE Broadway", specialties: ["General Dentistry", "Implants"], rating: 4.8, reviewCount: 312 },
      { name: "Pearl District Dental Studio", phone: "+15035551004", address: "1100 NW Glisan St", specialties: ["Cosmetic Dentistry", "Veneers"], rating: 4.9, reviewCount: 167 },
      { name: "Hawthorne Dental Group", phone: "+15035551005", address: "3456 SE Hawthorne Blvd", specialties: ["General Dentistry", "Periodontics"], rating: 4.3, reviewCount: 98 },
      { name: "Eastside Modern Dental", phone: "+15035551006", address: "2200 NE Sandy Blvd", specialties: ["General Dentistry", "Whitening"], rating: 4.6, reviewCount: 145 },
      { name: "Sellwood Dental Care", phone: "+15035551007", address: "7890 SE Milwaukie Ave", specialties: ["Pediatric Dentistry", "Orthodontics"], rating: 4.4, reviewCount: 203 },
      { name: "Alberta Arts Dental", phone: "+15035551008", address: "2456 NE Alberta St", specialties: ["Holistic Dentistry", "General"], rating: 4.2, reviewCount: 76 },
      { name: "St Johns Dental Clinic", phone: "+15035551009", address: "6789 N Lombard St", specialties: ["General Dentistry", "Emergency"], rating: 4.1, reviewCount: 134 },
      { name: "Downtown Portland Dental", phone: "+15035551010", address: "400 SW 5th Ave", specialties: ["General Dentistry", "Cosmetic"], rating: 4.8, reviewCount: 278 },
    ],
    restaurant: [
      { name: "The Garden Table", phone: "+15035552001", address: "234 NW 11th Ave", specialties: ["Farm-to-Table", "American"], rating: 4.6, reviewCount: 456, priceLevel: 3 },
      { name: "Bella Cucina", phone: "+15035552002", address: "789 SE Belmont St", specialties: ["Italian", "Pasta"], rating: 4.8, reviewCount: 321, priceLevel: 3 },
      { name: "Sakura Sushi House", phone: "+15035552003", address: "1567 NE Broadway", specialties: ["Japanese", "Sushi"], rating: 4.5, reviewCount: 198, priceLevel: 2 },
      { name: "El Mercado Taqueria", phone: "+15035552004", address: "4321 SE Division St", specialties: ["Mexican", "Tacos"], rating: 4.7, reviewCount: 567, priceLevel: 1 },
      { name: "Pine State Bistro", phone: "+15035552005", address: "3640 SE Hawthorne Blvd", specialties: ["Brunch", "American"], rating: 4.4, reviewCount: 234, priceLevel: 2 },
      { name: "Jade Garden Chinese", phone: "+15035552006", address: "422 NW Davis St", specialties: ["Chinese", "Dim Sum"], rating: 4.3, reviewCount: 178, priceLevel: 2 },
      { name: "Café Provence", phone: "+15035552007", address: "1123 NE Alberta St", specialties: ["French", "Bistro"], rating: 4.9, reviewCount: 289, priceLevel: 4 },
      { name: "Mumbai Spice Kitchen", phone: "+15035552008", address: "2890 SE Powell Blvd", specialties: ["Indian", "Curry"], rating: 4.5, reviewCount: 156, priceLevel: 2 },
      { name: "Blue Star Donuts & Café", phone: "+15035552009", address: "1155 SW Washington St", specialties: ["Café", "Bakery"], rating: 4.2, reviewCount: 678, priceLevel: 1 },
      { name: "The Woodsman Tavern", phone: "+15035552010", address: "4537 SE Division St", specialties: ["American", "Cocktails"], rating: 4.6, reviewCount: 345, priceLevel: 3 },
    ],
    barber: [
      { name: "The Modern Man Barbershop", phone: "+15035553001", address: "1890 NE Alberta St", specialties: ["Fades", "Hot Towel Shave"], rating: 4.8, reviewCount: 189 },
      { name: "Classic Cuts PDX", phone: "+15035553002", address: "567 SE Hawthorne Blvd", specialties: ["Classic Cuts", "Beard Trim"], rating: 4.5, reviewCount: 134 },
      { name: "Division Street Barbers", phone: "+15035553003", address: "3456 SE Division St", specialties: ["Fades", "Line-ups"], rating: 4.6, reviewCount: 98 },
      { name: "Pearl Grooming Lounge", phone: "+15035553004", address: "1100 NW 14th Ave", specialties: ["Premium Grooming", "Styling"], rating: 4.9, reviewCount: 267 },
      { name: "Eastside Fades", phone: "+15035553005", address: "2345 NE Sandy Blvd", specialties: ["Fades", "Designs"], rating: 4.3, reviewCount: 78 },
    ],
    auto: [
      { name: "Rose City Auto Repair", phone: "+15035554001", address: "4567 SE Powell Blvd", specialties: ["General Repair", "Oil Change"], rating: 4.7, reviewCount: 234 },
      { name: "Portland Motor Works", phone: "+15035554002", address: "890 NE Columbia Blvd", specialties: ["European Cars", "BMW/Mercedes"], rating: 4.5, reviewCount: 167 },
      { name: "Honest Wrench Auto", phone: "+15035554003", address: "2345 SE 82nd Ave", specialties: ["General Repair", "Brakes"], rating: 4.8, reviewCount: 312 },
      { name: "Pacific NW Automotive", phone: "+15035554004", address: "678 N Interstate Ave", specialties: ["Japanese Cars", "Diagnostics"], rating: 4.4, reviewCount: 145 },
      { name: "Sellwood Auto Service", phone: "+15035554005", address: "7890 SE 17th Ave", specialties: ["General Repair", "Transmission"], rating: 4.6, reviewCount: 198 },
    ],
    healthcare: [
      { name: "Portland Wellness Clinic", phone: "+15035555001", address: "1234 SW Yamhill St", specialties: ["Primary Care", "Preventive"], rating: 4.6, reviewCount: 289 },
      { name: "Rose City Medical Group", phone: "+15035555002", address: "567 NE Lloyd Blvd", specialties: ["Family Medicine", "Pediatrics"], rating: 4.4, reviewCount: 178 },
      { name: "Hawthorne Health Center", phone: "+15035555003", address: "3456 SE Hawthorne Blvd", specialties: ["Internal Medicine", "Geriatrics"], rating: 4.7, reviewCount: 234 },
      { name: "Pearl Urgent Care", phone: "+15035555004", address: "1100 NW 10th Ave", specialties: ["Urgent Care", "Walk-in"], rating: 4.3, reviewCount: 456 },
      { name: "Alberta Street Clinic", phone: "+15035555005", address: "2345 NE Alberta St", specialties: ["General Practice", "Mental Health"], rating: 4.5, reviewCount: 167 },
    ],
  };

  // Parse location for city/state
  const locationParts = location.split(",").map((s) => s.trim());
  const city = locationParts[0] || "Portland";
  const state = locationParts[1] || "OR";

  const categoryMocks = mocksByCategory[category.toLowerCase()] || mocksByCategory.dental!;

  return categoryMocks.slice(0, limit).map((mock, i) => ({
    name: mock.name || `${category} Provider ${i + 1}`,
    phone: mock.phone || `+1503555${String(1000 + i)}`,
    website: `https://example.com/${mock.name?.toLowerCase().replace(/\s+/g, "-") || `provider-${i}`}`,
    address: mock.address || `${100 + i * 100} Main St`,
    city,
    state,
    zipCode: `97${String(200 + i).padStart(3, "0")}`,
    lat: 45.5155 + (Math.random() - 0.5) * 0.05,
    lng: -122.6789 + (Math.random() - 0.5) * 0.05,
    category,
    subcategories: [],
    specialties: mock.specialties || [],
    rating: mock.rating || 4.0 + Math.random() * 0.9,
    reviewCount: mock.reviewCount || Math.floor(50 + Math.random() * 300),
    priceLevel: mock.priceLevel,
    description: `Quality ${category} services in ${city}, ${state}.`,
    source: "mock" as const,
    sourceUrl: undefined,
    rawData: undefined,
    metadata: {
      generatedAt: Date.now(),
      mockData: true,
    },
  }));
}
