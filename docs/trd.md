# Voit - Technical Requirements Document

**Document Version:** 2.0  
**Last Updated:** February 8, 2026  
**Project Type:** ElevenLabs Hackathon Challenge Submission  
**Status:** Pre-Development  

---

## Overview

This Technical Requirements Document (TRD) defines the system architecture, technology stack, integrations, database design, API specifications, deployment architecture, and implementation details for Voit -- an autonomous voice AI appointment-booking assistant that discovers providers, calls them in parallel, and books the best match.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [ElevenLabs Integration](#4-elevenlabs-integration)
5. [Database Design](#5-database-design)
6. [API Specifications](#6-api-specifications)
7. [Real-Time Architecture](#7-real-time-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Implementation Timeline](#10-implementation-timeline)

---

## 1. System Architecture

### 1.1 High-Level Architecture

Voit uses a simplified architecture where ElevenLabs handles the entire voice AI pipeline (ASR, LLM, TTS, turn-taking) with Twilio integrated natively for phone connectivity. No separate telephony management is needed.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │   Web App    │  │  Mobile App  │  │     PWA      │                       │
│  │ (Vite+React) │  │   (Future)   │  │   (Future)   │                       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                       │
└─────────┼─────────────────┼─────────────────┼───────────────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Fastify on Railway)                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  • Authentication (Better Auth)                                      │   │
│  │  • Request Parsing (LLM-based intent extraction)                     │   │
│  │  • Provider Discovery (Convex queries + ranking)                     │   │
│  │  • Campaign Orchestration (spawn, monitor, aggregate agents)         │   │
│  │  • Tool Call Endpoints (calendar check, distance, availability)      │   │
│  │  • Scoring & Ranking Engine                                          │   │
│  │  • Rate Limiting & Validation                                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
          │                       │                        │
          ▼                       ▼                        ▼
┌──────────────────┐  ┌──────────────────────────┐  ┌──────────────────┐
│  CONVEX (Cloud)  │  │  ELEVENLABS + TWILIO      │  │  EXTERNAL APIs   │
│                  │  │  (Integrated Telephony)   │  │                  │
│  • Real-time DB  │  │                          │  │  • Google Calendar│
│  • Subscriptions │  │  Conversational AI 2.0    │  │  • Google Maps   │
│  • File storage  │  │  + Batch Calling API      │  │  • PostHog       │
│  • Scheduled fns │  │  + Twilio phone number    │  │  • Sentry        │
│  • ACID txns     │  │    for PSTN calls         │  │                  │
│                  │  │                          │  │                  │
│  Users, Providers│  │  [ElevenLabs handles:]   │  │                  │
│  Campaigns, Calls│  │   ASR, TTS, LLM,         │  │                  │
│  Appointments    │  │   Turn-taking, Tools,     │  │                  │
│                  │  │   Voicemail Detection     │  │                  │
│                  │  │  [Twilio handles:]        │  │                  │
│                  │  │   Phone number, PSTN      │  │                  │
└──────────────────┘  └──────────────────────────┘  └──────────────────┘
```

### 1.2 Data Flow

```
1. USER types: "Book me a dentist appointment this week, mornings preferred"
                                    │
                                    ▼
2. FRONTEND sends request to FASTIFY backend
                                    │
                                    ▼
3. FASTIFY parses intent via LLM:
   { category: "dentist", service: "general", timeframe: "this_week",
     preferred_time: "morning" }
                                    │
                                    ▼
4. FASTIFY enriches with user profile from CONVEX:
   { location: "Downtown Portland", max_distance: 5mi,
     insurance: "BlueCross PPO", calendar_conflicts: [...] }
                                    │
                                    ▼
5. FASTIFY queries CONVEX provider database:
   Filter by category, distance, rating, business hours
   Rank by match_score
   Select top 8
                                    │
                                    ▼
6. FASTIFY returns matched providers to FRONTEND
   → User sees preview: "Found 8 dentists. Ready to call?"
   → User clicks "Start Search"
                                    │
                                    ▼
7. FASTIFY creates campaign in CONVEX:
   { campaignId, userId, providers: [...], status: "ACTIVE" }
                                    │
                                    ▼
8. FASTIFY (Orchestrator) triggers ELEVENLABS Batch Calling API:
   → 8 parallel calls via ElevenLabs + Twilio
   → Each call = one Specialist Agent with provider-specific context
                                    │
                                    ▼
9. During each call, SPECIALIST AGENTS:
   a. Introduce themselves and state the request
   b. Invoke tools (check_calendar, report_availability, etc.)
   c. Tool calls hit FASTIFY → FASTIFY reads/writes CONVEX
   d. CONVEX updates trigger real-time UI updates on FRONTEND
                                    │
                                    ▼
10. FRONTEND dashboard shows live agent grid (Convex reactive queries)
    → User watches progress in real-time
    → Can intervene (Pause, Book Now, Cancel)
                                    │
                                    ▼
11. Campaign completes → FASTIFY (Aggregator) scores results:
    score = 0.35×availability + 0.25×distance + 0.20×rating + 0.20×preference
                                    │
                                    ▼
12. FRONTEND shows ranked results → User selects → Books
    → CONVEX: appointment status = CONFIRMED
    → Google Calendar: event added (if connected)
    → User: confirmation notification sent
```

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool + dev server |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| Tanstack Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| React Router | 6.x | Routing |
| Convex React | Latest | Real-time data subscriptions |

### 2.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| Fastify | 4.x | HTTP server (2x faster than Express for WebSocket workloads) |
| TypeScript | 5.x | Type safety |
| Better Auth | Latest | Authentication (framework-agnostic, built-in rate limiting) |
| Convex | Latest | Database + serverless functions |

### 2.3 External Services

| Service | Purpose | Integration Type |
|---------|---------|------------------|
| ElevenLabs | Voice AI (ASR + LLM + TTS + turn-taking + tools) | WebSocket + REST (Batch Calling API) |
| Twilio | Phone connectivity (PSTN) | Configured inside ElevenLabs natively |
| Google Calendar | Calendar sync | OAuth + REST |
| Google Maps | Distance calculation | REST (cached) |
| PostHog | Analytics + feature flags | SDK |
| Sentry | Error tracking | SDK |

### 2.4 Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting (Edge CDN, instant deploys) |
| Railway | Backend hosting (WebSocket support, auto-scaling) |
| Convex Cloud | Database + real-time subscriptions + file storage |
| Cloudflare | CDN + DNS (if needed) |

### 2.5 Key Architecture Decisions

**Why NOT separate Twilio management?**  
ElevenLabs has a [native Twilio integration](https://elevenlabs.io/docs/conversational-ai/guides/twilio/native-integration). You configure a Twilio phone number directly inside ElevenLabs. ElevenLabs handles voice generation/recognition, Twilio handles PSTN routing. No separate SIP trunk management, no custom WebSocket bridging.

**Why NOT BullMQ or a job queue?**  
ElevenLabs provides a [Batch Calling API](https://elevenlabs.io/docs/agents-platform/phone-numbers/batch-calls) (`POST /v1/convai/batch-calling/submit`) that handles parallel outbound calls natively. We don't need to build a custom parallel scheduler.

**Why NOT BERT or separate ML models?**  
ElevenLabs provides built-in ASR, turn-taking, and [conversation analysis](https://elevenlabs.io/docs/agents-platform/customization/agent-analysis). Combined with LLM-based transcript verification and agent-side `flag_uncertainty` tool calls, we have sufficient hallucination detection without custom models.

---

## 3. Project Structure

### 3.1 Directory Structure

```
voit/
├── backend/                         # Fastify API server (deployed to Railway)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts              # Authentication endpoints
│   │   │   ├── campaigns.ts         # Campaign CRUD + launch
│   │   │   ├── providers.ts         # Provider search/discovery
│   │   │   ├── calls.ts             # Call monitoring + override
│   │   │   └── webhooks.ts          # ElevenLabs + Twilio webhooks
│   │   ├── services/
│   │   │   ├── orchestrator.ts      # Campaign orchestration logic
│   │   │   ├── intent-parser.ts     # LLM-based request parsing
│   │   │   ├── provider-matcher.ts  # Provider search + ranking
│   │   │   ├── scoring-engine.ts    # Result scoring algorithm
│   │   │   └── confidence.ts        # Hallucination detection
│   │   ├── tools/                   # ElevenLabs Agentic Function handlers
│   │   │   ├── check-calendar.ts
│   │   │   ├── calculate-distance.ts
│   │   │   ├── report-availability.ts
│   │   │   ├── report-no-availability.ts
│   │   │   ├── flag-uncertainty.ts
│   │   │   └── update-call-status.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── rate-limit.ts
│   │   └── utils/
│   ├── server.ts                    # Fastify server entry
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                        # React web app (deployed to Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── campaign/            # Campaign creation + NL input
│   │   │   ├── monitoring/          # Live call monitoring grid
│   │   │   ├── results/             # Ranked results + booking
│   │   │   ├── providers/           # Provider discovery display
│   │   │   └── shared/              # Reusable UI components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── pages/                   # Route pages
│   │   ├── stores/                  # Zustand stores
│   │   └── utils/                   # Utility functions
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── convex/                          # Convex functions and schema
│   ├── schema.ts                    # Database schema
│   ├── users.ts                     # User queries/mutations
│   ├── providers.ts                 # Provider search queries
│   ├── campaigns.ts                 # Campaign management
│   ├── agentCalls.ts                # Call state management
│   ├── appointments.ts              # Appointment CRUD
│   ├── preferenceHistory.ts         # Preference learning
│   └── seed.ts                      # Mock provider data seeding
│
├── shared/                          # Shared types and utilities
│   ├── types/
│   │   ├── campaign.ts
│   │   ├── call.ts
│   │   ├── provider.ts
│   │   └── user.ts
│   ├── constants/
│   └── utils/
│
├── package.json                     # Root package.json
├── tsconfig.json                    # Root TypeScript config
└── README.md
```

### 3.2 Package Dependencies

```
frontend/
  ├── shared/
  └── convex/ (via Convex React hooks)

backend/
  ├── shared/
  └── convex/ (via Convex client)
```

---

## 4. ElevenLabs Integration

### 4.1 What ElevenLabs Provides Natively

ElevenLabs' [ElevenAgents platform](https://elevenlabs.io/docs/eleven-agents/overview) handles the entire voice AI pipeline. We do NOT need to build:

| Capability | Provided By ElevenLabs | Our Responsibility |
|---|---|---|
| Speech-to-Text (ASR) | Fine-tuned model, built-in | None |
| Text-to-Speech (TTS) | 5k+ voices, 31 languages | Select voice, configure settings |
| Turn-taking | Proprietary model | Configure sensitivity |
| LLM reasoning | Configurable (GPT-4o, etc.) | Write system prompt |
| Tool calling | Client, server, and system tools | Implement tool endpoints |
| Batch calling | API for parallel outbound calls | Trigger API, track results |
| Twilio telephony | Native integration | Configure phone number |
| Voicemail detection | Built-in system tool | Handle event |
| Language detection | Auto-switch | Enable in config |
| Conversation analysis | Built-in evaluation | Query API post-call |
| React SDK | Hooks and components | Use in frontend |

### 4.2 ElevenLabs + Twilio: How It Works

This is a key simplification. Twilio is NOT a separate system -- it's ElevenLabs' built-in telephony provider.

1. We create an ElevenLabs Conversational AI agent with a system prompt, tools, and voice configuration
2. We configure a Twilio phone number inside ElevenLabs as the agent's telephony provider
3. When we want to call providers, we use ElevenLabs' **Batch Calling API** -- passing the provider phone numbers
4. ElevenLabs generates voice audio, Twilio connects the call to the provider's phone
5. During the call, the agent invokes **Agentic Functions** (tool calls) that hit our Fastify backend
6. Our backend reads/writes Convex, which triggers real-time UI updates

### 4.3 Batch Calling API

```typescript
// backend/src/services/orchestrator.ts

// Launch parallel calls via ElevenLabs Batch Calling API
async function launchCampaign(campaignId: string, providers: Provider[]) {
  const response = await fetch('https://api.elevenlabs.io/v1/convai/batch-calling/submit', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID!,
      name: `campaign-${campaignId}`,
      recipients: providers.map(provider => ({
        phone_number: provider.phone,
        custom_variables: {
          provider_name: provider.name,
          provider_category: provider.category,
          campaign_id: campaignId,
          provider_id: provider._id,
        },
      })),
    }),
  });

  const batch = await response.json();
  return batch.batch_id;
}

// Check batch status
async function checkBatchStatus(batchId: string) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/batch-calling/${batchId}`,
    { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! } }
  );
  return response.json();
}
```

### 4.4 Tool Definitions (Agentic Functions)

These are the tools the ElevenLabs agent can invoke during a call. Each tool hits a Fastify endpoint on our backend.

```typescript
// Tool definitions registered with ElevenLabs agent

export const voitTools = {
  // Check user's calendar for conflicts
  check_calendar: {
    type: 'webhook',
    name: 'check_calendar',
    description: 'Check if the user is available at a proposed time',
    parameters: {
      type: 'object',
      properties: {
        proposed_datetime: {
          type: 'string',
          description: 'ISO datetime string of proposed appointment',
        },
        duration_minutes: {
          type: 'number',
          description: 'Expected appointment duration',
        },
      },
      required: ['proposed_datetime'],
    },
    webhook_url: `${process.env.API_URL}/tools/check-calendar`,
  },

  // Calculate distance from user to provider
  calculate_distance: {
    type: 'webhook',
    name: 'calculate_distance',
    description: 'Get travel time from user to this provider',
    parameters: {
      type: 'object',
      properties: {
        provider_address: {
          type: 'string',
          description: 'Provider address',
        },
      },
      required: ['provider_address'],
    },
    webhook_url: `${process.env.API_URL}/tools/calculate-distance`,
  },

  // Report available slots back to orchestrator
  report_availability: {
    type: 'webhook',
    name: 'report_availability',
    description: 'Tell the orchestrator what time slots this provider has available',
    parameters: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        provider_id: { type: 'string' },
        slots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              datetime: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
      required: ['campaign_id', 'provider_id', 'slots'],
    },
    webhook_url: `${process.env.API_URL}/tools/report-availability`,
  },

  // Report no availability
  report_no_availability: {
    type: 'webhook',
    name: 'report_no_availability',
    description: 'Tell the orchestrator this provider has no matching availability',
    parameters: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        provider_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['campaign_id', 'provider_id'],
    },
    webhook_url: `${process.env.API_URL}/tools/report-no-availability`,
  },

  // Flag uncertainty (hallucination guard)
  flag_uncertainty: {
    type: 'webhook',
    name: 'flag_uncertainty',
    description: 'Signal that the agent is unsure about something in the conversation',
    parameters: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        provider_id: { type: 'string' },
        uncertainty_type: { type: 'string' },
        details: { type: 'string' },
      },
      required: ['campaign_id', 'provider_id', 'uncertainty_type'],
    },
    webhook_url: `${process.env.API_URL}/tools/flag-uncertainty`,
  },

  // Update call status (streams progress to dashboard)
  update_call_status: {
    type: 'webhook',
    name: 'update_call_status',
    description: 'Update the dashboard with current call progress',
    parameters: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        provider_id: { type: 'string' },
        status: { type: 'string' },
        details: { type: 'string' },
      },
      required: ['campaign_id', 'provider_id', 'status'],
    },
    webhook_url: `${process.env.API_URL}/tools/update-call-status`,
  },

  // Request clarification (internal prompt adjustment)
  request_clarification: {
    type: 'client',
    name: 'request_clarification',
    description: 'Agent asks provider to repeat or clarify something',
  },

  // End call gracefully
  end_call: {
    type: 'system',
    name: 'end_call',
    description: 'Terminate the call gracefully',
  },
};
```

### 4.5 Agent Configuration

```typescript
// Agent configuration for ElevenLabs

export const agentConfig = {
  voice: {
    voiceId: process.env.ELEVENLABS_VOICE_ID!,
    model: 'eleven_flash_v2_5',     // Low-latency model
    stability: 0.5,
    similarityBoost: 0.75,
    speed: 1.0,
  },
  llm: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
  },
  conversation: {
    maxDurationSeconds: 600,         // 10 minutes max per call
    silenceTimeoutSeconds: 30,
    interruptionSensitivity: 0.5,
  },
  knowledge: {
    ragEnabled: true,                // For provider-specific context
    knowledgeBaseId: process.env.ELEVENLABS_KB_ID,
  },
};
```

---

## 5. Database Design

### 5.1 Convex Schema

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Users table
  users: defineTable({
    email: v.string(),
    name: v.string(),
    authProvider: v.union(v.literal('email'), v.literal('google')),
    authProviderId: v.optional(v.string()),
    location: v.object({
      area: v.string(),              // "Downtown Portland"
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
    }),
    preferences: v.object({
      maxDistanceMiles: v.number(),
      preferredTimes: v.array(v.string()),   // ["morning", "evening"]
      avoidTimes: v.optional(v.array(v.string())),
    }),
    categoryPreferences: v.optional(v.object({
      dining: v.optional(v.object({
        cuisines: v.optional(v.array(v.string())),
        budgetPerPerson: v.optional(v.string()),
        dietary: v.optional(v.array(v.string())),
      })),
      healthcare: v.optional(v.object({
        insurance: v.optional(v.string()),
        preferredGender: v.optional(v.string()),
      })),
      personalCare: v.optional(v.object({
        preferences: v.optional(v.array(v.string())),
      })),
    })),
    calendarConnected: v.boolean(),
    calendarTokens: v.optional(v.object({
      accessToken: v.string(),
      refreshToken: v.string(),
      expiresAt: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_auth', ['authProvider', 'authProviderId']),

  // Providers table (SHARED database -- not per-user)
  providers: defineTable({
    name: v.string(),
    category: v.string(),            // "restaurant", "dentist", "barber", etc.
    phone: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    rating: v.number(),              // 0-5 average rating
    reviewCount: v.number(),
    priceRange: v.string(),          // "$", "$$", "$$$", "$$$$"
    specialties: v.array(v.string()), // ["Italian", "Seafood"] or ["Cleaning", "Filling"]
    businessHours: v.object({
      monday: v.optional(v.object({ open: v.string(), close: v.string() })),
      tuesday: v.optional(v.object({ open: v.string(), close: v.string() })),
      wednesday: v.optional(v.object({ open: v.string(), close: v.string() })),
      thursday: v.optional(v.object({ open: v.string(), close: v.string() })),
      friday: v.optional(v.object({ open: v.string(), close: v.string() })),
      saturday: v.optional(v.object({ open: v.string(), close: v.string() })),
      sunday: v.optional(v.object({ open: v.string(), close: v.string() })),
    }),
    metadata: v.optional(v.any()),   // Category-specific fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_category', ['category'])
    .index('by_category_rating', ['category', 'rating'])
    .searchIndex('search_name', { searchField: 'name' }),

  // Campaigns table
  campaigns: defineTable({
    userId: v.id('users'),
    request: v.object({
      raw: v.string(),               // Original natural language request
      category: v.string(),
      specifics: v.optional(v.string()),
      timeframe: v.string(),
      preferredTime: v.optional(v.string()),
      partySize: v.optional(v.number()),
    }),
    providerIds: v.array(v.id('providers')),
    status: v.union(
      v.literal('PREVIEW'),          // User reviewing matched providers
      v.literal('ACTIVE'),           // Calls in progress
      v.literal('PAUSED'),           // User paused campaign
      v.literal('COMPLETED'),        // Results ready
      v.literal('BOOKED'),           // User confirmed a booking
      v.literal('CANCELLED'),        // User cancelled
      v.literal('FAILED')            // All calls failed
    ),
    batchId: v.optional(v.string()), // ElevenLabs batch calling ID
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_status', ['status']),

  // Agent Calls table
  agentCalls: defineTable({
    campaignId: v.id('campaigns'),
    providerId: v.id('providers'),
    status: v.union(
      v.literal('QUEUED'),
      v.literal('RINGING'),
      v.literal('CONNECTED'),
      v.literal('NEGOTIATING'),
      v.literal('ON_HOLD'),
      v.literal('COMPLETED'),
      v.literal('FAILED'),
      v.literal('NO_ANSWER'),
      v.literal('VOICEMAIL'),
      v.literal('CANCELLED')
    ),
    transcript: v.optional(v.string()),      // Running transcript
    slotsFound: v.optional(v.array(v.object({
      datetime: v.string(),
      details: v.optional(v.string()),
    }))),
    confidenceScore: v.optional(v.number()), // 0-100
    outcome: v.optional(v.union(
      v.literal('BOOKED'),
      v.literal('NO_AVAILABILITY'),
      v.literal('UNANSWERED'),
      v.literal('VOICEMAIL_LEFT'),
      v.literal('ERROR')
    )),
    durationSeconds: v.optional(v.number()),
    retryCount: v.number(),
    maxRetries: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_campaign', ['campaignId'])
    .index('by_campaign_status', ['campaignId', 'status']),

  // Appointments table
  appointments: defineTable({
    userId: v.id('users'),
    providerId: v.id('providers'),
    campaignId: v.id('campaigns'),
    callId: v.id('agentCalls'),
    datetime: v.number(),            // Appointment timestamp
    details: v.string(),             // "Table for 2", "Dental cleaning", etc.
    status: v.union(
      v.literal('CONFIRMED'),
      v.literal('CANCELLED'),
      v.literal('COMPLETED')
    ),
    confidenceScore: v.number(),
    scoringBreakdown: v.object({
      availability: v.number(),
      distance: v.number(),
      rating: v.number(),
      preference: v.number(),
      total: v.number(),
    }),
    calendarEventId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_datetime', ['userId', 'datetime'])
    .index('by_campaign', ['campaignId']),

  // User Preference History (for learning)
  userPreferenceHistory: defineTable({
    userId: v.id('users'),
    category: v.string(),            // "restaurant", "dentist", etc.
    signal: v.string(),              // "prefers_evening", "chose_moderate_budget"
    source: v.union(
      v.literal('booking'),          // Learned from actual booking choice
      v.literal('explicit')          // User set manually
    ),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_category', ['userId', 'category']),
});
```

### 5.2 Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│             │
│ id (pk)     │
│ email       │
│ name        │
│ location    │
│ preferences │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐         ┌─────────────────────┐
│  campaigns  │         │     providers       │
│             │         │  (shared database)  │
│ id (pk)     │    N:M  │                     │
│ userId (fk) │────────>│ id (pk)             │
│ providerIds │         │ name                │
│ request     │         │ category            │
│ status      │         │ phone, address      │
│ batchId     │         │ rating, priceRange  │
└──────┬──────┘         │ specialties         │
       │                └─────────┬───────────┘
       │ 1:N                      │
       ▼                          │
┌─────────────┐                   │
│ agentCalls  │                   │
│             │  N:1              │
│ id (pk)     │───────────────────┘
│ campaignId  │
│ providerId  │
│ status      │
│ transcript  │
│ slotsFound  │
│ confidence  │
└──────┬──────┘
       │
       │ 1:1
       ▼
┌─────────────┐
│appointments │
│             │
│ id (pk)     │
│ userId (fk) │
│ providerId  │
│ campaignId  │
│ callId      │
│ datetime    │
│ scoring     │
└─────────────┘

┌──────────────────────┐
│ userPreferenceHistory│
│                      │
│ userId (fk)          │
│ category             │
│ signal               │
│ source               │
└──────────────────────┘
```

**Key difference from V1:** Providers are a **shared database**, not per-user. Users don't own providers -- they search them. The system discovers providers on behalf of users.

---

## 6. API Specifications

### 6.1 REST API Endpoints

#### Authentication

```typescript
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/google
// GET  /api/auth/session
// POST /api/auth/logout
```

#### Campaigns

```typescript
// POST /api/campaigns/parse
// Parse natural language request into structured parameters
Request: { query: string; }
Response: {
  parsed: {
    category: string;
    specifics?: string;
    timeframe: string;
    preferredTime?: string;
    partySize?: number;
  };
  enriched: {
    location: { area: string; lat: number; lng: number; };
    maxDistance: number;
    calendarConflicts: string[];
    preferences: Record<string, unknown>;
  };
}

// POST /api/campaigns/discover
// Find matching providers
Request: {
  parsed: ParsedRequest;
  enriched: EnrichedContext;
}
Response: {
  providers: Array<{
    id: string;
    name: string;
    category: string;
    rating: number;
    distance: number;
    priceRange: string;
    matchScore: number;
  }>;
}

// POST /api/campaigns
// Create campaign and launch calls
Request: {
  request: ParsedRequest;
  providerIds: string[];    // User-confirmed provider list
}
Response: {
  campaignId: string;
  status: 'ACTIVE';
  batchId: string;
  callIds: string[];
}

// POST /api/campaigns/:id/pause
// Pause active campaign

// POST /api/campaigns/:id/cancel
// Cancel campaign

// GET /api/campaigns/:id/results
// Get scored results
Response: {
  results: Array<{
    provider: Provider;
    slots: Slot[];
    score: ScoringBreakdown;
    confidence: number;
  }>;
}

// POST /api/campaigns/:id/book
// Confirm booking
Request: {
  callId: string;
  slotDatetime: string;
}
Response: {
  appointmentId: string;
  status: 'CONFIRMED';
}
```

#### Tool Endpoints (Called by ElevenLabs agents)

```typescript
// POST /tools/check-calendar
// POST /tools/calculate-distance
// POST /tools/report-availability
// POST /tools/report-no-availability
// POST /tools/flag-uncertainty
// POST /tools/update-call-status
```

### 6.2 Convex Real-Time Queries

```typescript
// convex/agentCalls.ts

// Real-time call status subscription (used by dashboard)
export const getCampaignCalls = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('agentCalls')
      .withIndex('by_campaign', (q) => q.eq('campaignId', args.campaignId))
      .collect();
  },
});

// Real-time campaign status
export const getCampaign = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});
```

```typescript
// Frontend usage with Convex React hooks

function CampaignDashboard({ campaignId }: { campaignId: Id<'campaigns'> }) {
  // Real-time subscription -- UI updates within <100ms of any change
  const campaign = useQuery(api.campaigns.getCampaign, { campaignId });
  const calls = useQuery(api.agentCalls.getCampaignCalls, { campaignId });

  return (
    <div className="grid grid-cols-2 gap-4">
      {calls?.map(call => (
        <AgentCard key={call._id} call={call} />
      ))}
    </div>
  );
}
```

---

## 7. Real-Time Architecture

### 7.1 How Real-Time Works

Voit achieves <100ms dashboard updates using Convex's built-in reactive subscriptions. No custom WebSocket server or SSE broadcaster needed.

```
┌────────────────────────────────────────────────────────────────────┐
│                     REAL-TIME FLOW                                   │
│                                                                    │
│  ElevenLabs Agent                              User Browser        │
│  (during call)                                                     │
│       │                                              │              │
│       │ 1. Tool call: update_call_status             │              │
│       ▼                                              │              │
│  Fastify Backend                                     │              │
│       │                                              │              │
│       │ 2. Convex mutation: update agentCalls        │              │
│       ▼                                              │              │
│  Convex Database                                     │              │
│       │                                              │              │
│       │ 3. Real-time subscription fires (<100ms)     │              │
│       └──────────────────────────────────────────────┘              │
│                                                                    │
│       Result: Agent speaks → status/transcript updates in Convex   │
│       → dashboard re-renders instantly via useQuery()              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 7.2 Convex Mutations (Called by Tool Endpoints)

```typescript
// convex/agentCalls.ts

export const updateCallStatus = mutation({
  args: {
    campaignId: v.id('campaigns'),
    providerId: v.id('providers'),
    status: v.string(),
    transcript: v.optional(v.string()),
    slotsFound: v.optional(v.array(v.object({
      datetime: v.string(),
      details: v.optional(v.string()),
    }))),
    confidenceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query('agentCalls')
      .withIndex('by_campaign', (q) => q.eq('campaignId', args.campaignId))
      .filter((q) => q.eq(q.field('providerId'), args.providerId))
      .first();

    if (call) {
      await ctx.db.patch(call._id, {
        status: args.status,
        ...(args.transcript && { transcript: args.transcript }),
        ...(args.slotsFound && { slotsFound: args.slotsFound }),
        ...(args.confidenceScore && { confidenceScore: args.confidenceScore }),
        updatedAt: Date.now(),
      });
    }
  },
});
```

---

## 8. Deployment Architecture

### 8.1 Production Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEPLOYMENT ARCHITECTURE                             │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      CLOUDFLARE (DNS + CDN)                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                 ┌──────────────────┼──────────────────┐                    │
│                 ▼                  ▼                  ▼                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   VERCEL         │  │   RAILWAY        │  │   CONVEX CLOUD   │         │
│  │                  │  │                  │  │                  │         │
│  │  Frontend SPA    │  │  Fastify API     │  │  Database        │         │
│  │  (Vite + React)  │  │  Orchestration   │  │  Real-time subs  │         │
│  │  Edge CDN        │  │  Tool endpoints  │  │  File storage    │         │
│  │  Instant deploys │  │  Auth middleware │  │  Scheduled fns   │         │
│  │                  │  │  WebSocket ready │  │  ACID txns       │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                    │                                        │
│                 ┌──────────────────┼──────────────────┐                    │
│                 ▼                  ▼                  ▼                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   ELEVENLABS     │  │   GOOGLE APIs    │  │   MONITORING     │         │
│  │                  │  │                  │  │                  │         │
│  │  Voice AI API    │  │  Calendar API    │  │  PostHog         │         │
│  │  Batch Calling   │  │  Maps API        │  │  (analytics)     │         │
│  │  Twilio (native) │  │                  │  │  Sentry          │         │
│  │  Conv. Analysis  │  │                  │  │  (errors)        │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Environment Configuration

```typescript
interface EnvironmentConfig {
  // Core
  NODE_ENV: 'development' | 'staging' | 'production';
  API_URL: string;         // Railway backend URL
  WEB_URL: string;         // Vercel frontend URL

  // Convex
  CONVEX_DEPLOYMENT: string;
  CONVEX_URL: string;

  // ElevenLabs (handles voice AI + Twilio telephony)
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_AGENT_ID: string;
  ELEVENLABS_VOICE_ID: string;
  ELEVENLABS_KB_ID: string;

  // Auth
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  // Google APIs
  GOOGLE_CALENDAR_API_KEY: string;
  GOOGLE_MAPS_API_KEY: string;

  // Monitoring
  SENTRY_DSN: string;
  POSTHOG_API_KEY: string;
}
```

**Note:** No separate Twilio credentials in our env. Twilio is configured directly inside ElevenLabs. We only interact with ElevenLabs API.

---

## 9. Security Architecture

### 9.1 Authentication Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                             │
│                                                                    │
│  1. User clicks "Sign Up" / "Log In"                               │
│  2. Better Auth handles registration/OAuth flow                    │
│  3. Session created (JWT, 7-day expiry, httpOnly cookie)           │
│  4. User record created/retrieved in Convex                        │
│  5. All subsequent requests include session cookie                 │
│  6. Fastify middleware validates session on every request           │
│                                                                    │
│  Google OAuth additionally grants Google Calendar access            │
│  (if user consents during sign-in)                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 9.2 Security Measures

```typescript
const securityMeasures = {
  // Encryption
  dataAtRest: 'AES-256 (Convex default)',
  dataInTransit: 'TLS 1.3',
  sensitiveFields: 'PII encrypted in Convex',

  // Authentication
  passwordHashing: 'bcrypt',
  sessions: 'JWT (RS256), 7-day expiry, httpOnly, SameSite',
  csrf: 'SameSite cookie policy',

  // API Protection
  rateLimiting: '100 req/min per user',
  cors: 'Restricted to verified domains',
  inputValidation: 'Fastify JSON Schema validation',

  // Privacy
  gdprCompliant: true,
  dataExport: 'JSON export endpoint',
  dataDeletion: 'Full purge endpoint',
  callRecordings: 'Off by default (transcripts only)',
  noCredentialsInCode: true,
};
```

---

## 10. Implementation Timeline

### 10.1 48-Hour Hackathon Timeline

#### Phase 1: Foundation (Hours 1-12)

**Hours 1-3: Infrastructure Setup**
- [ ] Create repo with structure: `/backend`, `/frontend`, `/convex`, `/shared`
- [ ] Initialize Convex project + deploy dev instance
- [ ] Set up Railway + deploy initial Fastify app
- [ ] Initialize Vite React app + deploy to Vercel
- [ ] Configure environment variables

**Hours 4-6: Auth + Database**
- [ ] Integrate Better Auth with Fastify
- [ ] Implement registration + login endpoints
- [ ] Create Convex schema (all tables)
- [ ] Seed mock provider database (~30-50 providers across categories)
- [ ] Test auth flow end-to-end

**Hours 7-9: ElevenLabs + Twilio Foundation**
- [ ] Create ElevenLabs account + configure API keys
- [ ] Set up Twilio account + purchase phone number
- [ ] Configure Twilio as telephony provider inside ElevenLabs
- [ ] Implement single-agent voice call (test with 1 mock provider)
- [ ] Verify call connects + transcript streams back

**Hours 10-12: Provider Discovery + Request Parsing**
- [ ] Implement LLM-based intent parser
- [ ] Build provider search/matching logic in Convex
- [ ] User profile enrichment (merge parsed request + stored preferences)
- [ ] Test: "Book me a dentist this week" -> returns 8 matching providers
- [ ] Implement confirmation preview endpoint

#### Phase 2: Core Features (Hours 13-24)

**Hours 13-15: Multi-Agent Orchestration**
- [ ] Implement Orchestrator logic using ElevenLabs Batch Calling API
- [ ] Configure Specialist Agent system prompt for ElevenLabs
- [ ] Test parallel calling with 3 agents
- [ ] Agent state management in Convex (status updates streaming)
- [ ] Error handling for connection failures

**Hours 16-18: Tool Calling**
- [ ] Implement tool endpoints in Fastify:
  - `check_calendar`, `calculate_distance`, `report_availability`
  - `report_no_availability`, `flag_uncertainty`, `update_call_status`
- [ ] Register tools as ElevenLabs Agentic Functions
- [ ] Test tool invocation during live call

**Hours 19-21: Live Dashboard**
- [ ] Build agent status grid (cards with real-time updates)
- [ ] Implement Convex reactive subscriptions in React
- [ ] Add live transcript viewer (expandable per agent)
- [ ] Display campaign metrics (calls, success rate, time)
- [ ] Test dashboard with 3-5 simultaneous agents

**Hours 22-24: Scoring + Results**
- [ ] Implement scoring algorithm
- [ ] Create results UI (top 3 slots with scoring breakdown)
- [ ] Booking confirmation flow
- [ ] Test complete loop: request -> providers -> calls -> dashboard -> results -> book

#### Phase 3: Polish & Differentiators (Hours 25-36)

**Hours 25-27: Hallucination Detection**
- [ ] Implement confidence scoring (analyze transcript for certainty indicators)
- [ ] LLM-based verification (cross-check claims vs transcript)
- [ ] Hallucination warning UI in dashboard
- [ ] Agent uncertainty behavior (asks for clarification when unsure)

**Hours 28-30: User Preference Engine**
- [ ] Preference learning from bookings
- [ ] Apply learned preferences to provider search
- [ ] Preference management UI

**Hours 31-33: Retry Logic + Edge Cases**
- [ ] Auto-retry for unanswered calls
- [ ] "No availability" scenario handling
- [ ] User override mid-campaign (Book Now, Pause All)

**Hours 34-36: UI Polish**
- [ ] Design system, loading states, animations
- [ ] Mobile responsive layout
- [ ] Empty states, error states, success states

#### Phase 4: Demo Prep (Hours 37-48)

**Hours 37-42: Testing + Demo Script**
- [ ] End-to-end tests (happy path, partial failure, no availability)
- [ ] Write demo script, rehearse
- [ ] Create polished demo provider data

**Hours 43-48: Final Polish + Submission**
- [ ] Final UI tweaks
- [ ] Record demo video (if required)
- [ ] Write README
- [ ] Submit

### 10.2 Minimum Viable Demo

If time is tight, this is the absolute minimum:

1. User types a request -> system finds matching providers (mock DB)
2. System calls 3-5 providers in parallel via ElevenLabs + Twilio
3. Live dashboard shows agent progress in real-time
4. Results ranked and presented -> user books
5. ~~Hallucination detection~~ (nice to have)
6. ~~Preference learning~~ (can fake with seeded data)
7. ~~Calendar integration~~ (can show static availability)

---

## Appendix A: Technology Decision Records

### TDR-001: Database Choice - Convex

**Decision:** Use Convex as primary database  
**Rationale:**
- Native real-time subscriptions (agent state -> UI in <100ms)
- TypeScript-first with full type safety
- Serverless functions co-located with data
- File storage built-in
- ACID transactions (prevents double-booking)
- Automatic scaling

**Alternatives Considered:** Supabase, PlanetScale, Firebase

### TDR-002: Voice AI - ElevenLabs

**Decision:** Use ElevenLabs ElevenAgents platform  
**Rationale:**
- Best-in-class voice quality
- Proprietary turn-taking model for natural conversations
- Integrated RAG for knowledge access
- Agentic Functions (tool calling) system
- Batch Calling API for parallel outbound
- Native Twilio integration (no separate telephony management)
- Voicemail detection built-in
- Conversation analysis API for post-call evaluation
- React SDK for frontend integration

**Alternatives Considered:** Play.ht, Deepgram, OpenAI Realtime API

### TDR-003: Backend Hosting - Railway

**Decision:** Use Railway for Fastify backend  
**Rationale:**
- WebSocket support (critical for real-time features)
- Auto-scaling
- Easy deployment from GitHub
- Encrypted environment variables
- Affordable for hackathon ($20/mo)

**Alternatives Considered:** Vercel Serverless (no persistent WebSocket), AWS (overkill for hackathon)

### TDR-004: No Separate Job Queue

**Decision:** Use ElevenLabs Batch Calling API instead of BullMQ/Redis  
**Rationale:**
- ElevenLabs handles parallel call orchestration natively
- No need for Redis instance or job queue infrastructure
- Simpler architecture, fewer moving parts
- Batch status tracking via ElevenLabs API

### TDR-005: No Custom ML Models (BERT, etc.)

**Decision:** Use LLM-based verification + ElevenLabs conversation analysis  
**Rationale:**
- ElevenLabs provides built-in conversation analysis
- Agent-side `flag_uncertainty` tool calls catch ambiguity in real-time
- LLM prompt-based transcript verification is sufficient for confidence scoring
- Deploying custom BERT models adds infrastructure complexity not worth the marginal accuracy gain for a hackathon

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Agent | ElevenLabs voice AI that conducts calls |
| Batch Calling API | ElevenLabs API for initiating multiple simultaneous outbound calls |
| Campaign | User's appointment search session (request -> calls -> results -> booking) |
| Orchestrator | Fastify backend logic that manages all agents during a campaign |
| Specialist Agent | Individual ElevenLabs agent assigned to call one provider |
| Provider Discovery | Automatic process of finding matching providers from the database |
| Agentic Functions | ElevenLabs feature allowing agents to invoke external functions during calls |
| Confidence Score | 0-100 metric indicating how certain the agent is about booking details |
| RAG | Retrieval-Augmented Generation for provider-specific knowledge access |

---

## Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | Voit Team | Initial TRD (as "CallPilot") |
| 2.0 | Feb 8, 2026 | Voit Team | Simplified architecture. Native ElevenLabs+Twilio. Batch Calling API. Railway backend. Removed BullMQ, BERT, separate Twilio layer. Provider discovery (shared DB). 48h hackathon timeline. |

---

*End of Technical Requirements Document*
