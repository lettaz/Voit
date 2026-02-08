/**
 * Test Script: Google Places API + Distance Matrix
 *
 * Tests:
 *  1. Places Nearby Search – find doctors/dentists/etc. near a location
 *  2. Place Details – get phone number & opening hours for each result
 *  3. Distance Matrix – calculate travel distance & duration from user to providers
 *  4. Ranking – sort results by proximity (nearest first)
 *
 * Usage (from project root):
 *   npx tsx scripts/testPlaces.ts
 *   npx tsx scripts/testPlaces.ts --category=dentist
 *   npx tsx scripts/testPlaces.ts --category=doctor --lat=45.5155 --lng=-122.6789
 *   npx tsx scripts/testPlaces.ts --radius=3000
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ─── Setup ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Load .env.local first (higher priority), then .env as fallback
dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

const GOOGLE_API_KEY = process.env.GOOGLE_PLACE_ID || "";

// Default test location: Portland, OR
const DEFAULT_LAT = 45.5155;
const DEFAULT_LNG = -122.6789;
const DEFAULT_RADIUS = 5000; // meters
const DEFAULT_CATEGORY = "doctor";

// Category → Google Places type mapping
const CATEGORY_TYPE_MAP: Record<string, string> = {
  doctor: "doctor",
  healthcare: "doctor",
  arzt: "doctor",
  dentist: "dentist",
  dental: "dentist",
  zahnarzt: "dentist",
  restaurant: "restaurant",
  barber: "hair_care",
  friseur: "hair_care",
  apotheke: "pharmacy",
  pharmacy: "pharmacy",
  veterinary: "veterinary_care",
  tierarzt: "veterinary_care",
  gym: "gym",
  fitnessstudio: "gym",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  types?: string[];
}

interface PlaceDetails {
  formatted_phone_number?: string;
  international_phone_number?: string;
  formatted_address?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  website?: string;
}

interface DistanceElement {
  distance: { text: string; value: number }; // value in meters
  duration: { text: string; value: number }; // value in seconds
  status: string;
}

interface RankedProvider {
  rank: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  openNow: boolean | null;
  openingHours: string[] | null;
  distanceText: string | null;
  distanceMeters: number | null;
  durationText: string | null;
  durationSeconds: number | null;
  placeId: string;
}

// ─── CLI Argument Parser ─────────────────────────────────────────────────────

function parseArgs(): {
  category: string;
  lat: number;
  lng: number;
  radius: number;
} {
  const args = process.argv.slice(2);
  let category = DEFAULT_CATEGORY;
  let lat = DEFAULT_LAT;
  let lng = DEFAULT_LNG;
  let radius = DEFAULT_RADIUS;

  for (const arg of args) {
    const [key, value] = arg.replace("--", "").split("=");
    switch (key) {
      case "category":
        category = value || DEFAULT_CATEGORY;
        break;
      case "lat":
        lat = parseFloat(value) || DEFAULT_LAT;
        break;
      case "lng":
        lng = parseFloat(value) || DEFAULT_LNG;
        break;
      case "radius":
        radius = parseInt(value, 10) || DEFAULT_RADIUS;
        break;
    }
  }

  return { category, lat, lng, radius };
}

// ─── Google Places: Nearby Search ────────────────────────────────────────────

async function searchNearby(
  lat: number,
  lng: number,
  radius: number,
  type: string
): Promise<PlaceResult[]> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("type", type);
  url.searchParams.set("key", GOOGLE_API_KEY);

  console.log(`\n📍 Nearby Search: type="${type}" radius=${radius}m`);
  console.log(`   URL: ${url.toString().replace(GOOGLE_API_KEY, "***")}`);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK") {
    console.error(`   ❌ Places API Error: ${data.status}`);
    if (data.error_message) {
      console.error(`   Message: ${data.error_message}`);
    }
    return [];
  }

  const results: PlaceResult[] = data.results || [];
  console.log(`   ✅ Found ${results.length} results`);
  return results;
}

// ─── Google Places: Place Details ────────────────────────────────────────────

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "formatted_phone_number,international_phone_number,formatted_address,opening_hours,website"
  );
  url.searchParams.set("key", GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK") {
    return null;
  }

  return data.result || null;
}

// ─── Google Distance Matrix ──────────────────────────────────────────────────

async function calculateDistances(
  originLat: number,
  originLng: number,
  destinations: Array<{ lat: number; lng: number; placeId: string }>
): Promise<Map<string, DistanceElement>> {
  if (destinations.length === 0) return new Map();

  // Distance Matrix supports up to 25 destinations per request
  const destinationStr = destinations
    .map((d) => `${d.lat},${d.lng}`)
    .join("|");

  const url = new URL(
    "https://maps.googleapis.com/maps/api/distancematrix/json"
  );
  url.searchParams.set("origins", `${originLat},${originLng}`);
  url.searchParams.set("destinations", destinationStr);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("key", GOOGLE_API_KEY);

  console.log(`\n🚗 Distance Matrix: ${destinations.length} destinations`);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK") {
    console.error(`   ❌ Distance Matrix Error: ${data.status}`);
    if (data.error_message) {
      console.error(`   Message: ${data.error_message}`);
    }
    return new Map();
  }

  const elements: DistanceElement[] = data.rows?.[0]?.elements || [];
  const result = new Map<string, DistanceElement>();

  for (let i = 0; i < destinations.length && i < elements.length; i++) {
    if (elements[i].status === "OK") {
      result.set(destinations[i].placeId, elements[i]);
    }
  }

  console.log(`   ✅ Got distances for ${result.size} destinations`);
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  Voit – Google Places API + Distance Matrix Test");
  console.log("=".repeat(60));

  // Validate API key
  if (!GOOGLE_API_KEY) {
    console.error(
      "\n❌ GOOGLE_PLACE_ID (API Key) not found in .env"
    );
    console.error(
      "   Set GOOGLE_PLACE_ID=AIzaSy... in your .env file"
    );
    process.exit(1);
  }
  console.log(`\n🔑 API Key: ${GOOGLE_API_KEY.slice(0, 10)}...`);

  // Parse CLI args
  const { category, lat, lng, radius } = parseArgs();
  const placesType = CATEGORY_TYPE_MAP[category.toLowerCase()] || category;

  console.log(`\n📋 Config:`);
  console.log(`   Category:  ${category} → Places type: "${placesType}"`);
  console.log(`   Location:  ${lat}, ${lng}`);
  console.log(`   Radius:    ${radius}m (${(radius / 1000).toFixed(1)}km)`);

  // ─── Step 1: Nearby Search ───────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  STEP 1: Google Places Nearby Search");
  console.log("─".repeat(60));

  const places = await searchNearby(lat, lng, radius, placesType);

  if (places.length === 0) {
    console.log("\n⚠️  Keine Ergebnisse gefunden. Versuche:");
    console.log("   - Anderen Radius (--radius=10000)");
    console.log("   - Andere Kategorie (--category=dentist)");
    console.log("   - Andere Koordinaten (--lat=... --lng=...)");
    process.exit(0);
  }

  // Print raw results
  console.log("\n   Gefundene Orte:");
  for (const place of places.slice(0, 10)) {
    const star = place.rating ? `⭐ ${place.rating}` : "";
    const open =
      place.opening_hours?.open_now !== undefined
        ? place.opening_hours.open_now
          ? "🟢 offen"
          : "🔴 geschlossen"
        : "";
    console.log(`   • ${place.name} – ${place.vicinity} ${star} ${open}`);
  }

  // ─── Step 2: Place Details (phone, hours) ────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  STEP 2: Place Details (Telefon, Oeffnungszeiten)");
  console.log("─".repeat(60));

  const detailsMap = new Map<string, PlaceDetails>();
  // Only fetch details for first 10 to avoid excessive API calls
  const topPlaces = places.slice(0, 10);

  for (const place of topPlaces) {
    const details = await getPlaceDetails(place.place_id);
    if (details) {
      detailsMap.set(place.place_id, details);
    }
    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n   Details fuer ${detailsMap.size}/${topPlaces.length} Orte geladen`);

  // ─── Step 3: Distance Matrix ─────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  STEP 3: Distance Matrix (Entfernungen berechnen)");
  console.log("─".repeat(60));

  const destinations = topPlaces.map((p) => ({
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    placeId: p.place_id,
  }));

  const distances = await calculateDistances(lat, lng, destinations);

  // ─── Step 4: Ranking ─────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  STEP 4: Ranking nach Naehe");
  console.log("─".repeat(60));

  const ranked: RankedProvider[] = topPlaces.map((place) => {
    const details = detailsMap.get(place.place_id);
    const distance = distances.get(place.place_id);

    return {
      rank: 0,
      name: place.name,
      address: details?.formatted_address || place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? null,
      phone: details?.international_phone_number || details?.formatted_phone_number || null,
      website: details?.website || null,
      openNow: place.opening_hours?.open_now ?? details?.opening_hours?.open_now ?? null,
      openingHours: details?.opening_hours?.weekday_text || null,
      distanceText: distance?.distance?.text || null,
      distanceMeters: distance?.distance?.value || null,
      durationText: distance?.duration?.text || null,
      durationSeconds: distance?.duration?.value || null,
      placeId: place.place_id,
    };
  });

  // Sort by distance (nearest first), null distances go last
  ranked.sort((a, b) => {
    if (a.distanceMeters === null && b.distanceMeters === null) return 0;
    if (a.distanceMeters === null) return 1;
    if (b.distanceMeters === null) return -1;
    return a.distanceMeters - b.distanceMeters;
  });

  // Assign rank
  ranked.forEach((p, i) => {
    p.rank = i + 1;
  });

  // ─── Output ──────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("  ERGEBNIS: Provider sortiert nach Naehe");
  console.log("=".repeat(60));

  for (const p of ranked) {
    const stars = p.rating ? `⭐ ${p.rating} (${p.reviewCount ?? "?"} Bewertungen)` : "keine Bewertung";
    const dist = p.distanceText ? `📏 ${p.distanceText}` : "Entfernung unbekannt";
    const time = p.durationText ? `⏱️  ${p.durationText}` : "";
    const phone = p.phone ? `📞 ${p.phone}` : "kein Telefon";
    const open =
      p.openNow === true
        ? "🟢 jetzt offen"
        : p.openNow === false
          ? "🔴 geschlossen"
          : "";

    console.log(`\n  #${p.rank} ${p.name}`);
    console.log(`     ${p.address}`);
    console.log(`     ${dist}  ${time}`);
    console.log(`     ${stars}  ${open}`);
    console.log(`     ${phone}`);
    if (p.website) {
      console.log(`     🌐 ${p.website}`);
    }
  }

  // ─── JSON Output ─────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  Rohdaten (JSON):");
  console.log("─".repeat(60));
  console.log(JSON.stringify(ranked, null, 2));

  console.log("\n✅ Test abgeschlossen.");
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("\n💥 Unerwarteter Fehler:", err);
  process.exit(1);
});
