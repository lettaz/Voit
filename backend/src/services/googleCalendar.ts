/**
 * Google Calendar Service
 *
 * Provides real calendar availability checks and event creation
 * using the Google Calendar API. Reads user tokens from Convex,
 * refreshes them when expired, and falls back gracefully when
 * no calendar is connected.
 *
 * Based on the patterns proven in scripts/testCalendar.ts.
 */

import { google, type Auth } from "googleapis";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AvailabilityResult {
  available: boolean;
  conflicts: Array<{ start: string; end: string }>;
  message: string;
  calendarConnected: boolean;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  location?: string;
  timeZone?: string;
}

export interface CalendarEventResult {
  eventId: string;
  htmlLink: string;
  status: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────

function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || "";
}

function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || "";
}

// ─── OAuth2 Client Builder ──────────────────────────────────────────────────

async function getOAuth2ClientForUser(
  convex: ConvexHttpClient,
  userId: Id<"users">
): Promise<{ client: InstanceType<typeof google.auth.OAuth2>; connected: boolean }> {
  const user = await convex.query(api.users.getById, { id: userId });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  if (!user.calendarConnected || !user.calendarTokens) {
    return {
      client: new google.auth.OAuth2(),
      connected: false,
    };
  }

  const oauth2Client = new google.auth.OAuth2(
    getGoogleClientId(),
    getGoogleClientSecret()
  );

  oauth2Client.setCredentials({
    access_token: user.calendarTokens.accessToken,
    refresh_token: user.calendarTokens.refreshToken,
    expiry_date: user.calendarTokens.expiresAt,
  });

  // If token is expired or about to expire (within 5 minutes), refresh it
  const fiveMinutes = 5 * 60 * 1000;
  if (user.calendarTokens.expiresAt < Date.now() + fiveMinutes) {
    console.log("[GoogleCalendar] Token expired, refreshing...");
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update tokens in Convex
      if (credentials.access_token) {
        await convex.mutation(api.users.updateCalendarTokens, {
          id: userId,
          calendarTokens: {
            accessToken: credentials.access_token,
            refreshToken:
              credentials.refresh_token ||
              user.calendarTokens.refreshToken,
            expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
          },
        });
        console.log("[GoogleCalendar] Token refreshed and saved to Convex");
      }
    } catch (err) {
      console.error("[GoogleCalendar] Token refresh failed:", err);
      return { client: oauth2Client, connected: false };
    }
  }

  return { client: oauth2Client, connected: true };
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Check if the user is free at a proposed appointment time.
 * Returns availability status with any conflicts found.
 * Falls back gracefully if no calendar is connected.
 */
export async function checkAvailability(
  convex: ConvexHttpClient,
  userId: Id<"users">,
  proposedDatetime: string,
  durationMinutes: number = 60
): Promise<AvailabilityResult> {
  const { client, connected } = await getOAuth2ClientForUser(convex, userId);

  if (!connected) {
    return {
      available: true,
      conflicts: [],
      message:
        "No calendar connected -- assuming the client is available. The client will confirm later.",
      calendarConnected: false,
    };
  }

  try {
    const calendar = google.calendar({ version: "v3", auth: client });

    const proposedStart = new Date(proposedDatetime);
    const proposedEnd = new Date(
      proposedStart.getTime() + durationMinutes * 60 * 1000
    );

    console.log(
      `[GoogleCalendar] Checking free/busy: ${proposedStart.toISOString()} - ${proposedEnd.toISOString()}`
    );

    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: proposedStart.toISOString(),
        timeMax: proposedEnd.toISOString(),
        timeZone: "UTC",
        items: [{ id: "primary" }],
      },
    });

    const busySlots = data.calendars?.primary?.busy || [];
    const available = busySlots.length === 0;

    const conflicts = busySlots.map((slot) => ({
      start: slot.start || "",
      end: slot.end || "",
    }));

    const message = available
      ? `The client is available at ${proposedDatetime}.`
      : `The client has ${busySlots.length} conflict(s) at that time. Please ask for an alternative.`;

    console.log(
      `[GoogleCalendar] Result: ${available ? "AVAILABLE" : `BUSY (${busySlots.length} conflicts)`}`
    );

    return { available, conflicts, message, calendarConnected: true };
  } catch (error) {
    console.error("[GoogleCalendar] Free/busy check failed:", error);
    return {
      available: true,
      conflicts: [],
      message:
        "Could not check the client's calendar right now. Proceed and the client will confirm later.",
      calendarConnected: true,
    };
  }
}

/**
 * Create a Google Calendar event for a confirmed appointment.
 */
export async function createCalendarEvent(
  convex: ConvexHttpClient,
  userId: Id<"users">,
  eventInput: CalendarEventInput
): Promise<CalendarEventResult | null> {
  const { client, connected } = await getOAuth2ClientForUser(convex, userId);

  if (!connected) {
    console.log("[GoogleCalendar] No calendar connected, skipping event creation");
    return null;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth: client });
    const timeZone =
      eventInput.timeZone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: eventInput.summary,
        description: eventInput.description,
        location: eventInput.location,
        start: {
          dateTime: eventInput.startDateTime,
          timeZone,
        },
        end: {
          dateTime: eventInput.endDateTime,
          timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 30 }],
        },
      },
    });

    console.log(`[GoogleCalendar] Event created: ${data.id}`);

    return {
      eventId: data.id || "",
      htmlLink: data.htmlLink || "",
      status: data.status || "confirmed",
    };
  } catch (error) {
    console.error("[GoogleCalendar] Event creation failed:", error);
    return null;
  }
}
