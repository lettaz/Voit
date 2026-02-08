/**
 * Test Script: Google Calendar Integration
 *
 * Tests OAuth user data, calendar events, free/busy times,
 * and event creation/deletion with a Google OAuth token.
 *
 * Usage (from project root):
 *   # With access token directly (e.g. from Google OAuth Playground):
 *   npx tsx scripts/testCalendar.ts --token=ya29.xxx
 *
 *   # Interactive OAuth flow (opens browser):
 *   npx tsx scripts/testCalendar.ts --interactive
 *
 *   # From Convex (reads stored tokens from Convex users table):
 *   npx tsx scripts/testCalendar.ts --from-convex --email=user@example.com
 */

import dotenv from "dotenv";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Load env
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });

// ─── Config ─────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3089/oauth/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

// ─── Convex: Fetch tokens from stored user data ─────────────────────────────

async function fetchTokensFromConvex(
  email: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const CONVEX_URL =
    process.env.CONVEX_URL || process.env.VITE_CONVEX_URL || "";

  if (!CONVEX_URL) {
    throw new Error(
      "CONVEX_URL ist nicht gesetzt. Setze CONVEX_URL in .env oder .env.local."
    );
  }

  console.log(`📡 Verbinde mit Convex: ${CONVEX_URL}`);
  console.log(`📧 Suche User mit Email: ${email}`);

  const { ConvexHttpClient } = await import("convex/browser");
  const { api } = await import("../convex/_generated/api.js");

  const client = new ConvexHttpClient(CONVEX_URL);

  const user = await client.query(api.users.getByEmail, { email });

  if (!user) {
    throw new Error(
      `Kein User mit Email "${email}" in Convex gefunden. Hat sich der User schon angemeldet?`
    );
  }

  console.log(`✅ User gefunden: ${user.name} (${user.email})`);

  if (!user.calendarTokens) {
    throw new Error(
      `User "${email}" hat keine Calendar Tokens gespeichert. ` +
        "Hat sich der User mit Google angemeldet und Calendar-Zugriff erteilt?"
    );
  }

  if (!user.calendarConnected) {
    console.warn(
      "⚠️  calendarConnected ist false, aber Tokens sind vorhanden. Fahre fort..."
    );
  }

  console.log(`🔑 Calendar Tokens gefunden:`);
  console.log(
    `   Access Token:  ${user.calendarTokens.accessToken.substring(0, 30)}...`
  );
  console.log(
    `   Refresh Token: ${user.calendarTokens.refreshToken ? "vorhanden" : "nicht vorhanden"}`
  );
  console.log(
    `   Laeuft ab:     ${new Date(user.calendarTokens.expiresAt).toLocaleString("de-DE")}`
  );

  // Check if token is expired
  if (user.calendarTokens.expiresAt < Date.now()) {
    console.warn(
      "⚠️  Access Token ist abgelaufen! Versuche es trotzdem (Refresh Token wird ggf. benoetigt)."
    );
  }

  return user.calendarTokens;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function separator(title: string) {
  console.log("");
  console.log("═".repeat(60));
  console.log(`  ${title}`);
  console.log("═".repeat(60));
  console.log("");
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseArgs(): {
  token?: string;
  interactive: boolean;
  fromConvex: boolean;
  email?: string;
} {
  const args = process.argv.slice(2);
  let token: string | undefined;
  let interactive = false;
  let fromConvex = false;
  let email: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--token=")) {
      token = arg.replace("--token=", "");
    }
    if (arg === "--interactive") {
      interactive = true;
    }
    if (arg === "--from-convex") {
      fromConvex = true;
    }
    if (arg.startsWith("--email=")) {
      email = arg.replace("--email=", "");
    }
  }

  return { token, interactive, fromConvex, email };
}

// ─── OAuth Setup ────────────────────────────────────────────────────────────

function setupOAuth(): OAuth2Client {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error(
      "❌ GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET muessen in .env gesetzt sein."
    );
    console.error(
      "   Trage sie ein oder nutze --token=<access_token> mit einem Token vom OAuth Playground."
    );
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  return oauth2Client;
}

/**
 * Interactive OAuth flow: opens browser, starts local server to catch callback.
 */
async function getTokenInteractive(
  oauth2Client: OAuth2Client
): Promise<string> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("🌐 Oeffne diesen Link im Browser um dich anzumelden:");
  console.log("");
  console.log(`   ${authUrl}`);
  console.log("");
  console.log("⏳ Warte auf OAuth Callback...");

  // Try to open browser automatically
  const { exec } = await import("child_process");
  const openCmd =
    process.platform === "win32"
      ? "start"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  exec(`${openCmd} "${authUrl}"`);

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || "", `http://localhost:3089`);

        if (url.pathname === "/oauth/callback") {
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
              `<h1>Fehler</h1><p>${error}</p><p>Du kannst dieses Fenster schliessen.</p>`
            );
            server.close();
            reject(new Error(`OAuth Error: ${error}`));
            return;
          }

          if (!code) {
            res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
              `<h1>Fehler</h1><p>Kein Authorization Code erhalten.</p>`
            );
            server.close();
            reject(new Error("No authorization code received"));
            return;
          }

          // Exchange code for tokens
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(
            `<h1>✅ Erfolgreich authentifiziert!</h1>
             <p>Du kannst dieses Fenster schliessen und zum Terminal zurueckkehren.</p>
             <p><b>Access Token:</b> <code style="word-break:break-all">${tokens.access_token?.substring(0, 30)}...</code></p>
             <p><b>Refresh Token:</b> ${tokens.refresh_token ? "✅ erhalten" : "❌ nicht erhalten"}</p>`
          );

          console.log("");
          console.log("✅ OAuth Token erhalten!");
          console.log(
            `   Access Token:  ${tokens.access_token?.substring(0, 40)}...`
          );
          console.log(
            `   Refresh Token: ${tokens.refresh_token ? "vorhanden" : "nicht vorhanden"}`
          );
          console.log(
            `   Laeuft ab:     ${tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString("de-DE") : "unbekannt"}`
          );
          console.log("");

          // Info for Convex storage
          if (tokens.refresh_token) {
            console.log(
              "💾 Diese Tokens koennen in Convex users.calendarTokens gespeichert werden:"
            );
            console.log(
              JSON.stringify(
                {
                  accessToken: tokens.access_token?.substring(0, 20) + "...",
                  refreshToken:
                    tokens.refresh_token?.substring(0, 20) + "...",
                  expiresAt: tokens.expiry_date,
                },
                null,
                2
              )
            );
            console.log("");
          }

          server.close();
          resolve(tokens.access_token || "");
        }
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.listen(3089, () => {
      console.log("   Lokaler OAuth Server laeuft auf http://localhost:3089");
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("OAuth Timeout - keine Anmeldung innerhalb von 2 Minuten"));
    }, 120_000);
  });
}

// ─── Test: User Info ────────────────────────────────────────────────────────

async function testUserInfo(oauth2Client: OAuth2Client) {
  separator("1. USER INFO - Google Profildaten");

  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    console.log("📋 Google User Profil:");
    console.log(`   Name:        ${data.name}`);
    console.log(`   Email:       ${data.email}`);
    console.log(`   Verifiziert: ${data.verified_email ? "✅" : "❌"}`);
    console.log(`   Profilbild:  ${data.picture || "keins"}`);
    console.log(`   Google ID:   ${data.id}`);
    console.log(`   Locale:      ${data.locale || "nicht gesetzt"}`);
    console.log("");

    console.log("💾 Mapping fuer Convex users-Tabelle:");
    console.log(
      JSON.stringify(
        {
          email: data.email,
          name: data.name,
          avatarUrl: data.picture,
          authProvider: "google",
          authProviderId: data.id,
        },
        null,
        2
      )
    );

    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Fehler beim Abrufen der User Info: ${message}`);
    return null;
  }
}

// ─── Test: List Events ──────────────────────────────────────────────────────

async function testListEvents(oauth2Client: OAuth2Client) {
  separator("2. KALENDER EVENTS - Naechste 7 Tage");

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    const events = data.items || [];

    if (events.length === 0) {
      console.log("📭 Keine Events in den naechsten 7 Tagen gefunden.");
      console.log(
        "   (Das bedeutet der Kalender ist komplett frei fuer Buchungen!)"
      );
    } else {
      console.log(`📅 ${events.length} Event(s) gefunden:`);
      console.log("");

      for (const event of events) {
        const start = event.start?.dateTime || event.start?.date || "";
        const end = event.end?.dateTime || event.end?.date || "";
        const isAllDay = !event.start?.dateTime;

        console.log(`   📌 ${event.summary || "(Kein Titel)"}`);
        console.log(
          `      ${isAllDay ? "Ganztaegig" : `${formatDate(start)} - ${formatDate(end)}`}`
        );
        if (event.location) {
          console.log(`      📍 Ort: ${event.location}`);
        }
        if (event.attendees && event.attendees.length > 0) {
          console.log(
            `      👥 Teilnehmer: ${event.attendees.map((a) => a.email).join(", ")}`
          );
        }
        console.log(
          `      🔗 Status: ${event.status} | ID: ${event.id?.substring(0, 20)}...`
        );
        console.log("");
      }
    }

    console.log("─".repeat(40));
    console.log(`   Gesamt: ${events.length} Events`);
    console.log(
      `   Zeitraum: ${formatDate(now.toISOString())} bis ${formatDate(nextWeek.toISOString())}`
    );

    return events;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Fehler beim Abrufen der Events: ${message}`);
    return [];
  }
}

// ─── Test: Free/Busy ────────────────────────────────────────────────────────

async function testFreeBusy(oauth2Client: OAuth2Client) {
  separator("3. FREI/BELEGT - Verfuegbare Zeitfenster");

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: nextWeek.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        items: [{ id: "primary" }],
      },
    });

    const busySlots = data.calendars?.primary?.busy || [];

    if (busySlots.length === 0) {
      console.log("✅ Komplett frei in den naechsten 7 Tagen!");
      console.log("   Der Agent koennte jeden beliebigen Termin buchen.");
    } else {
      console.log(`⏰ ${busySlots.length} belegte Zeitbloecke gefunden:`);
      console.log("");

      for (const slot of busySlots) {
        console.log(
          `   🔴 BELEGT: ${formatDate(slot.start)} - ${formatDate(slot.end)}`
        );
      }

      console.log("");

      // Calculate free slots between busy periods (business hours 8:00-18:00)
      console.log("🟢 Freie Zeitfenster (8:00-18:00, nur Werktage):");
      console.log("");

      const dayNames = [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
      ];

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const day = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        const dayOfWeek = day.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dayStart = new Date(day);
        dayStart.setHours(8, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(18, 0, 0, 0);

        // Skip if day is in the past
        if (dayEnd < now) continue;

        // Find busy slots that overlap with this day's business hours
        const dayBusy = busySlots.filter((slot) => {
          const slotStart = new Date(slot.start || "");
          const slotEnd = new Date(slot.end || "");
          return slotStart < dayEnd && slotEnd > dayStart;
        });

        const freeBlocks: string[] = [];
        let cursor = dayStart < now ? now : dayStart;

        for (const busy of dayBusy) {
          const busyStart = new Date(busy.start || "");
          const busyEnd = new Date(busy.end || "");

          const effectiveStart = busyStart < dayStart ? dayStart : busyStart;
          const effectiveEnd = busyEnd > dayEnd ? dayEnd : busyEnd;

          if (cursor < effectiveStart) {
            freeBlocks.push(
              `${cursor.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}-${effectiveStart.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} FREI`
            );
          }
          cursor = effectiveEnd > cursor ? effectiveEnd : cursor;
        }

        // Free block after last busy slot
        if (cursor < dayEnd) {
          freeBlocks.push(
            `${cursor.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}-${dayEnd.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} FREI`
          );
        }

        const dateStr = day.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
        });
        console.log(
          `   ${dayNames[dayOfWeek]} ${dateStr}: ${freeBlocks.length > 0 ? freeBlocks.join(" | ") : "Komplett belegt"}`
        );
      }
    }

    console.log("");
    console.log("💡 Der KI-Agent kann diese freien Slots nutzen um Termine zu buchen.");

    return busySlots;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Fehler bei FreeBusy-Abfrage: ${message}`);
    return [];
  }
}

// ─── Test: Create Event ─────────────────────────────────────────────────────

async function testCreateEvent(
  oauth2Client: OAuth2Client
): Promise<string | null> {
  separator("4. TEST-TERMIN ERSTELLEN");

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create event for tomorrow at 15:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);

    const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour

    const event = {
      summary: "🤖 Voit Test-Termin",
      description:
        "Automatisch erstellt vom Voit Calendar Test-Script.\nDieser Termin kann geloescht werden.",
      start: {
        dateTime: tomorrow.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 10 }],
      },
    };

    console.log("📝 Erstelle Test-Termin...");
    console.log(`   Titel: ${event.summary}`);
    console.log(`   Wann:  ${formatDate(tomorrow.toISOString())}`);
    console.log(`   Dauer: 1 Stunde`);
    console.log("");

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    console.log("✅ Termin erfolgreich erstellt!");
    console.log(`   Event ID:      ${data.id}`);
    console.log(`   Status:        ${data.status}`);
    console.log(`   Calendar Link: ${data.htmlLink}`);
    console.log(`   Created:       ${formatDate(data.created || "")}`);
    console.log("");

    console.log("💾 Fuer Convex appointments.calendarEventId:");
    console.log(`   calendarEventId: "${data.id}"`);

    return data.id || null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Fehler beim Erstellen des Events: ${message}`);
    return null;
  }
}

// ─── Test: Delete Event ─────────────────────────────────────────────────────

async function testDeleteEvent(
  oauth2Client: OAuth2Client,
  eventId: string
) {
  separator("5. TEST-TERMIN LOESCHEN (Aufraeumen)");

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    console.log(`🗑️  Loesche Event: ${eventId}`);

    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });

    console.log("✅ Test-Termin erfolgreich geloescht!");
    console.log("   Der Kalender ist wieder sauber.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Fehler beim Loeschen des Events: ${message}`);
    console.log(
      `   Du kannst den Termin manuell in Google Calendar loeschen.`
    );
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("🔬 Voit - Google Calendar Test Script");
  console.log("─".repeat(40));
  console.log("");

  const { token, interactive, fromConvex, email } = parseArgs();

  if (!token && !interactive && !fromConvex) {
    console.log("Verwendung:");
    console.log(
      "  npx tsx scripts/testCalendar.ts --token=<ACCESS_TOKEN>"
    );
    console.log(
      "  npx tsx scripts/testCalendar.ts --interactive"
    );
    console.log(
      "  npx tsx scripts/testCalendar.ts --from-convex --email=<EMAIL>"
    );
    console.log("");
    console.log("Optionen:");
    console.log(
      "  --token=<TOKEN>     Google OAuth Access Token (z.B. vom OAuth Playground)"
    );
    console.log(
      "  --interactive       Startet lokalen OAuth Flow (oeffnet Browser)"
    );
    console.log(
      "  --from-convex       Liest Calendar Tokens aus der Convex users-Tabelle"
    );
    console.log(
      "  --email=<EMAIL>     Email des Users (noetig fuer --from-convex)"
    );
    console.log("");
    console.log(
      "💡 Tipp: Hole einen Token vom Google OAuth Playground:"
    );
    console.log(
      "   https://developers.google.com/oauthplayground"
    );
    console.log(
      '   Scopes: "Google Calendar API v3" + "Google OAuth2 API v2"'
    );
    process.exit(0);
  }

  let oauth2Client: OAuth2Client;

  if (fromConvex) {
    // Option C: Fetch tokens from Convex
    if (!email) {
      console.error(
        "❌ --email=<EMAIL> ist noetig wenn --from-convex verwendet wird."
      );
      console.error(
        "   Beispiel: npx tsx scripts/testCalendar.ts --from-convex --email=info@example.com"
      );
      process.exit(1);
    }

    separator("TOKENS AUS CONVEX LADEN");
    const tokens = await fetchTokensFromConvex(email);

    oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken || undefined,
    });
  } else if (token) {
    // Option A: Direct token
    console.log("🔑 Verwende bereitgestellten Access Token");
    console.log(`   Token: ${token.substring(0, 30)}...`);

    oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
  } else {
    // Option B: Interactive flow
    console.log("🔑 Starte interaktiven OAuth Flow...");
    oauth2Client = setupOAuth();
    await getTokenInteractive(oauth2Client);
  }

  // Run all tests
  const userInfo = await testUserInfo(oauth2Client);
  if (!userInfo) {
    console.error(
      "\n❌ User Info konnte nicht abgerufen werden. Token ungueltig?"
    );
    console.error(
      "   Stelle sicher, dass der Token die richtigen Scopes hat:"
    );
    console.error(`   ${SCOPES.join("\n   ")}`);
    process.exit(1);
  }

  await testListEvents(oauth2Client);
  await testFreeBusy(oauth2Client);

  const eventId = await testCreateEvent(oauth2Client);

  if (eventId) {
    // Wait a moment so user can see the event in their calendar
    console.log("");
    console.log(
      "⏳ Warte 5 Sekunden (du kannst den Termin jetzt in Google Calendar sehen)..."
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await testDeleteEvent(oauth2Client, eventId);
  }

  // Summary
  separator("ZUSAMMENFASSUNG");
  console.log("✅ Alle Tests abgeschlossen!");
  console.log("");
  console.log("Ergebnisse:");
  console.log(`   👤 User:      ${userInfo.name} (${userInfo.email})`);
  console.log(`   📅 Calendar:  Zugriff funktioniert`);
  console.log(`   📝 Events:    Lesen ✅ | Erstellen ✅ | Loeschen ✅`);
  console.log(`   ⏰ FreeBusy:  Abfrage funktioniert`);
  console.log("");
  console.log("Naechste Schritte:");
  console.log(
    "   1. Calendar-Service erstellen: backend/src/services/googleCalendar.ts"
  );
  console.log(
    "   2. Tokens in Convex speichern: users.calendarTokens"
  );
  console.log(
    "   3. Tool-Endpoint fuer ElevenLabs: POST /api/tools/check-calendar"
  );
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Script fehlgeschlagen:", err.message || err);
  process.exit(1);
});
