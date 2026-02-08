/**
 * Google Maps Service
 *
 * Provides distance calculation, nearby provider search, and place details
 * using the Google Maps Platform APIs (Distance Matrix, Places Nearby Search,
 * Place Details). Uses raw `fetch` -- no extra dependencies needed.
 *
 * Based on the patterns proven in scripts/testPlaces.ts.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DistanceResult {
  distanceMiles: number;
  durationMinutes: number;
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  openNow: boolean | null;
  types: string[];
}

export interface PlaceDetailsResult {
  phone: string | null;
  internationalPhone: string | null;
  formattedAddress: string | null;
  website: string | null;
  openNow: boolean | null;
  openingHoursText: string[] | null;
}

// ─── Category → Google Places type mapping ──────────────────────────────────

export const CATEGORY_TYPE_MAP: Record<string, string> = {
  doctor: "doctor",
  healthcare: "doctor",
  arzt: "doctor",
  dentist: "dentist",
  dental: "dentist",
  zahnarzt: "dentist",
  restaurant: "restaurant",
  barber: "hair_care",
  friseur: "hair_care",
  salon: "hair_care",
  apotheke: "pharmacy",
  pharmacy: "pharmacy",
  veterinary: "veterinary_care",
  tierarzt: "veterinary_care",
  gym: "gym",
  fitnessstudio: "gym",
  auto: "car_repair",
  mechanic: "car_repair",
};

// ─── Config ─────────────────────────────────────────────────────────────────

function getApiKey(): string {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACE_ID || "";
}

// ─── Distance Matrix ────────────────────────────────────────────────────────

/**
 * Calculate driving distance and duration between two points.
 * Returns null if the API is not configured or fails.
 */
export async function calculateDistance(
  origin: string | { lat: number; lng: number },
  destination: string | { lat: number; lng: number }
): Promise<DistanceResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log("[GoogleMaps] No API key configured, cannot calculate distance");
    return null;
  }

  const originStr =
    typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`;
  const destStr =
    typeof destination === "string"
      ? destination
      : `${destination.lat},${destination.lng}`;

  const url = new URL(
    "https://maps.googleapis.com/maps/api/distancematrix/json"
  );
  url.searchParams.set("origins", originStr);
  url.searchParams.set("destinations", destStr);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("key", apiKey);

  try {
    console.log(
      `[GoogleMaps] Distance Matrix: ${originStr} → ${destStr}`
    );

    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      status: string;
      error_message?: string;
      rows?: Array<{
        elements: Array<{
          status: string;
          distance?: { text: string; value: number };
          duration?: { text: string; value: number };
        }>;
      }>;
    };

    if (data.status !== "OK") {
      console.error(
        `[GoogleMaps] Distance Matrix error: ${data.status} - ${data.error_message || ""}`
      );
      return null;
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK" || !element.distance || !element.duration) {
      console.error("[GoogleMaps] No valid distance element returned");
      return null;
    }

    const distanceMiles = element.distance.value / 1609.34;
    const durationMinutes = element.duration.value / 60;

    console.log(
      `[GoogleMaps] Distance: ${distanceMiles.toFixed(1)} mi, Duration: ${durationMinutes.toFixed(0)} min`
    );

    return {
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      durationMinutes: Math.round(durationMinutes),
      distanceText: element.distance.text,
      durationText: element.duration.text,
      distanceMeters: element.distance.value,
      durationSeconds: element.duration.value,
    };
  } catch (error) {
    console.error("[GoogleMaps] Distance Matrix fetch failed:", error);
    return null;
  }
}

// ─── Places Nearby Search ───────────────────────────────────────────────────

/**
 * Search for nearby places of a given type.
 * Returns up to `maxResults` places sorted by prominence.
 */
export async function searchNearbyProviders(
  lat: number,
  lng: number,
  radiusMeters: number = 5000,
  type: string = "doctor",
  maxResults: number = 10
): Promise<PlaceSearchResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log("[GoogleMaps] No API key configured, cannot search places");
    return [];
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusMeters));
  url.searchParams.set("type", type);
  url.searchParams.set("key", apiKey);

  try {
    console.log(
      `[GoogleMaps] Nearby Search: type="${type}" radius=${radiusMeters}m at (${lat}, ${lng})`
    );

    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      status: string;
      error_message?: string;
      results?: Array<{
        place_id: string;
        name: string;
        vicinity: string;
        geometry: { location: { lat: number; lng: number } };
        rating?: number;
        user_ratings_total?: number;
        opening_hours?: { open_now?: boolean };
        types?: string[];
      }>;
    };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(
        `[GoogleMaps] Places API error: ${data.status} - ${data.error_message || ""}`
      );
      return [];
    }

    const results = (data.results || []).slice(0, maxResults);

    console.log(`[GoogleMaps] Found ${results.length} nearby places`);

    return results.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? null,
      openNow: place.opening_hours?.open_now ?? null,
      types: place.types || [],
    }));
  } catch (error) {
    console.error("[GoogleMaps] Places Nearby Search failed:", error);
    return [];
  }
}

// ─── Place Details ──────────────────────────────────────────────────────────

/**
 * Get detailed information about a place (phone, hours, website).
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetailsResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log("[GoogleMaps] No API key configured, cannot get place details");
    return null;
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "formatted_phone_number,international_phone_number,formatted_address,opening_hours,website"
  );
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      status: string;
      result?: {
        formatted_phone_number?: string;
        international_phone_number?: string;
        formatted_address?: string;
        opening_hours?: {
          open_now?: boolean;
          weekday_text?: string[];
        };
        website?: string;
      };
    };

    if (data.status !== "OK" || !data.result) {
      return null;
    }

    return {
      phone: data.result.formatted_phone_number || null,
      internationalPhone: data.result.international_phone_number || null,
      formattedAddress: data.result.formatted_address || null,
      website: data.result.website || null,
      openNow: data.result.opening_hours?.open_now ?? null,
      openingHoursText: data.result.opening_hours?.weekday_text || null,
    };
  } catch (error) {
    console.error("[GoogleMaps] Place Details fetch failed:", error);
    return null;
  }
}

/**
 * Resolve a Google Places type string from a user-facing category.
 */
export function resolveGooglePlacesType(category: string): string {
  return CATEGORY_TYPE_MAP[category.toLowerCase()] || category;
}
