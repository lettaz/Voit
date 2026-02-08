# Voit -- ElevenLabs Agent Tools Reference

**Status:** Reference for agent configuration + backend implementation

---

## System Tools (Enable in ElevenLabs Dashboard)

These are built-in ElevenLabs features. Toggle them on in the agent settings -- no webhook needed.

| # | Tool | How to Enable | Purpose |
|---|------|--------------|---------|
| 1 | `end_call` | Agent settings > System tools | Gracefully terminate the call |
| 2 | Voicemail detection | Agent settings > System tools | Auto-detect voicemail systems, trigger voicemail behavior |
| 3 | `hand_off_to_human` | Agent settings > System tools (configure with user phone) | Transfer call to the actual user when uncertain or provider requests a real person |
| 4 | Language detection | Agent settings > System tools | Auto-detect provider's language and switch (German, English, etc.) |

### Guardrail for Handoff

Add to system prompt Guardrails section:
```
*   If the provider insists on speaking to the actual client, or if you cannot resolve the situation confidently, use the hand_off_to_human tool to transfer the call.
```

---

## Server Tools (Webhook Endpoints on Fastify Backend)

These are registered in the ElevenLabs agent dashboard as server tools. Each points to a webhook URL on the Fastify backend (via ngrok in dev, public URL in prod).

**Base URL:** `https://<your-ngrok-domain>.ngrok-free.app` (dev) or `https://<your-railway-url>` (prod)

---

### Tool 1: `report_availability`

**Webhook URL:** `{API_URL}/tools/report-availability`

**Description:** Agent found available appointment slots at the provider. Records the exact dates, times, and details mentioned by the provider.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "campaign_id": {
      "type": "string",
      "description": "The campaign ID for this call"
    },
    "provider_id": {
      "type": "string",
      "description": "The provider ID being called"
    },
    "slots": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "datetime": {
            "type": "string",
            "description": "The date and time of the available slot (e.g., 'Tuesday March 12 at 10:00 AM')"
          },
          "details": {
            "type": "string",
            "description": "Any additional details about the slot (e.g., 'with Dr. Smith', '45 minute appointment')"
          }
        },
        "required": ["datetime"]
      },
      "description": "List of available appointment slots"
    }
  },
  "required": ["campaign_id", "provider_id", "slots"]
}
```

**Expected Response:** `{ "message": "Availability recorded. Thank the provider and end the call." }`

---

### Tool 2: `report_no_availability`

**Webhook URL:** `{API_URL}/tools/report-no-availability`

**Description:** Provider has no matching appointment slots available. Records the reason.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "campaign_id": {
      "type": "string",
      "description": "The campaign ID for this call"
    },
    "provider_id": {
      "type": "string",
      "description": "The provider ID being called"
    },
    "reason": {
      "type": "string",
      "description": "Why no slots are available (e.g., 'fully booked this week', 'not accepting new patients')"
    }
  },
  "required": ["campaign_id", "provider_id"]
}
```

**Expected Response:** `{ "message": "Noted. Thank the provider and end the call." }`

---

### Tool 3: `update_call_status`

**Webhook URL:** `{API_URL}/tools/update-call-status`

**Description:** Update the dashboard with current call progress. Call this whenever the situation changes.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "campaign_id": {
      "type": "string",
      "description": "The campaign ID for this call"
    },
    "provider_id": {
      "type": "string",
      "description": "The provider ID being called"
    },
    "status": {
      "type": "string",
      "enum": ["RINGING", "CONNECTED", "NEGOTIATING", "ON_HOLD", "COMPLETED", "FAILED", "NO_ANSWER", "VOICEMAIL"],
      "description": "Current call status"
    },
    "details": {
      "type": "string",
      "description": "Brief description of what is happening (e.g., 'Speaking with receptionist', 'Put on hold')"
    }
  },
  "required": ["campaign_id", "provider_id", "status"]
}
```

**Expected Response:** `{ "message": "Status updated." }`

---

### Tool 4: `flag_uncertainty`

**Webhook URL:** `{API_URL}/tools/flag-uncertainty`

**Description:** Signal that the agent is unsure about a detail in the conversation. Use after asking the provider to repeat and still being uncertain.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "campaign_id": {
      "type": "string",
      "description": "The campaign ID for this call"
    },
    "provider_id": {
      "type": "string",
      "description": "The provider ID being called"
    },
    "uncertainty_type": {
      "type": "string",
      "enum": ["datetime", "name", "details", "availability", "other"],
      "description": "What type of information is uncertain"
    },
    "details": {
      "type": "string",
      "description": "Description of what is uncertain (e.g., 'Provider said a time but it was unclear if AM or PM')"
    }
  },
  "required": ["campaign_id", "provider_id", "uncertainty_type"]
}
```

**Expected Response:** `{ "message": "Uncertainty flagged. Try to clarify with the provider or proceed with caution." }`

---

### Tool 5: `check_calendar`

**Webhook URL:** `{API_URL}/tools/check-calendar`

**Description:** Check if the user is available at a proposed appointment time. Use this when a provider offers a specific slot to verify it doesn't conflict with the user's calendar.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "campaign_id": {
      "type": "string",
      "description": "The campaign ID for this call"
    },
    "proposed_datetime": {
      "type": "string",
      "description": "ISO datetime string of the proposed appointment (e.g., '2026-02-12T10:00:00')"
    },
    "duration_minutes": {
      "type": "number",
      "description": "Expected appointment duration in minutes"
    }
  },
  "required": ["campaign_id", "proposed_datetime"]
}
```

**Expected Response:** `{ "available": true, "message": "The client is available at that time." }` or `{ "available": false, "conflict": "Client has a meeting from 10-11 AM", "message": "That time doesn't work. Ask for an alternative." }`

---

### Tool 6: `calculate_distance`

**Webhook URL:** `{API_URL}/tools/calculate-distance`

**Description:** Calculate travel time and distance from the user's location to the provider. Use when confirming if a location works for the client.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "campaign_id": {
      "type": "string",
      "description": "The campaign ID for this call"
    },
    "provider_id": {
      "type": "string",
      "description": "The provider ID being called"
    },
    "provider_address": {
      "type": "string",
      "description": "The provider's address"
    }
  },
  "required": ["campaign_id", "provider_id"]
}
```

**Expected Response:** `{ "distance_miles": 3.2, "duration_minutes": 12, "message": "The provider is about 12 minutes away from the client." }`

---

### Tool 7: `get_provider_info`

**Webhook URL:** `{API_URL}/tools/get-provider-info`

**Description:** Look up detailed information about the provider being called (rating, specialties, business hours). Use to inform the conversation or verify details.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "provider_id": {
      "type": "string",
      "description": "The provider ID to look up"
    }
  },
  "required": ["provider_id"]
}
```

**Expected Response:** `{ "name": "Rose City Dental", "rating": 4.7, "specialties": ["General Dentistry", "Cosmetic"], "phone": "+15035551001", "address": "1234 NW 23rd Ave, Portland, OR" }`

---

### Tool 8: `validate_slot`

**Webhook URL:** `{API_URL}/tools/validate-slot`

**Description:** Cross-check a proposed appointment slot against the user's preferences, calendar, and distance constraints. Returns whether the slot is a good match.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "campaign_id": {
      "type": "string",
      "description": "The campaign ID for this call"
    },
    "provider_id": {
      "type": "string",
      "description": "The provider ID"
    },
    "proposed_datetime": {
      "type": "string",
      "description": "The proposed appointment datetime"
    },
    "duration_minutes": {
      "type": "number",
      "description": "Expected duration in minutes"
    },
    "details": {
      "type": "string",
      "description": "Any additional slot details from the provider"
    }
  },
  "required": ["campaign_id", "provider_id", "proposed_datetime"]
}
```

**Expected Response:** `{ "valid": true, "score": 85, "message": "This slot works well for the client. Good time and close location." }` or `{ "valid": false, "reasons": ["Calendar conflict", "Too far from client"], "message": "This slot doesn't work. Ask for alternatives." }`

---

## Summary

| # | Tool | Type | Evaluation Criterion |
|---|------|------|---------------------|
| 1 | `end_call` | System | Core |
| 2 | Voicemail detection | System | Failure handling |
| 3 | `hand_off_to_human` | System | Hallucination-aware handover, User-in-the-loop |
| 4 | Language detection | System | Multilingual support |
| 5 | `report_availability` | Server | Slot validation |
| 6 | `report_no_availability` | Server | Decision-making |
| 7 | `update_call_status` | Server | Real-time UX |
| 8 | `flag_uncertainty` | Server | Hallucination guard |
| 9 | `check_calendar` | Server | Calendar queries, prevents double booking |
| 10 | `calculate_distance` | Server | Distance calculations, optimal match |
| 11 | `get_provider_info` | Server | Provider lookup |
| 12 | `validate_slot` | Server | Smart preference matching |

**Total: 4 system tools + 8 server tools = 12 agentic functions**

---

## Registration Notes

- Register server tools in ElevenLabs: Agent settings > Tools > Add server tool
- Each tool needs: name, description, parameters schema (JSON above), webhook URL
- Authentication: Use Bearer token or custom header with `ELEVENLABS_WEBHOOK_SECRET`
- For local dev: webhook URLs use ngrok static domain
- For production: webhook URLs use Railway backend URL
