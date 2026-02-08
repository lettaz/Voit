# Voit — Product Requirements Document

**Version:** 2.0
**Date:** February 8, 2026
**Project Type:** ElevenLabs Hackathon Challenge Submission
**Status:** Pre-Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Users](#4-target-users)
5. [User Journey](#5-user-journey)
6. [Core Features & Requirements](#6-core-features--requirements)
7. [System Architecture](#7-system-architecture)
8. [Multi-Agent Design](#8-multi-agent-design)
9. [Data Models](#9-data-models)
10. [Success Metrics](#10-success-metrics)
11. [Development Roadmap](#11-development-roadmap)
12. [Risk Assessment & Mitigation](#12-risk-assessment--mitigation)
13. [Future Enhancements](#13-future-enhancements)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### Overview

Voit is an autonomous voice AI appointment-booking assistant for everyday people. You tell it what you need — a dentist appointment, a dinner reservation, a haircut — and it handles everything: finding the right providers based on your preferences, calling them in parallel, negotiating availability, and presenting you with the best options. You pick one, and you're done.

No more sitting on hold. No more calling five places to find one opening. No more repeating yourself to every receptionist.

### The Core Idea

When you say *"Book me a table at a nice Italian restaurant this Friday evening,"* Voit already knows your preferences — you like upscale dining, you're based in downtown, your budget is around $80/person, and you're allergic to shellfish. It searches its provider database, finds 8 matching Italian restaurants near you, and deploys a swarm of AI voice agents to call them all simultaneously.

Within minutes, you see a live dashboard showing each agent's progress. Three restaurants have Friday evening availability. Voit ranks them by match quality — factoring in ratings, distance, price range, and your personal history — and presents the top options. You tap "Book," and it's done. Calendar updated. Confirmation sent.

### Why It Matters

- **For you:** Book appointments 80%+ faster (8 minutes vs 45 minutes manual) across multiple providers simultaneously
- **Differentiator:** Not just parallel calling — intelligent orchestration with provider discovery, user preference matching, hallucination detection, and self-healing when calls fail

---

## 2. Problem Statement

### The Current Pain

Booking a single appointment — whether at a doctor's office, restaurant, car repair shop, or hairdresser — requires:

- **Multiple phone calls** — average 5–8 attempts to find availability
- **Hold times** — average 7–12 minutes per call
- **Manual slot negotiation** — "How about Tuesday? No? Wednesday?"
- **Calendar conflict checking** — switching between phone and calendar app
- **Repeating yourself** — name, phone number, requirements to each provider
- **Provider research** — finding places that match your needs in the first place

**Total time investment: 20–45 minutes per appointment.**

And that's for a single booking. When you factor in personal preferences — travel distance, provider ratings, dietary restrictions, insurance acceptance, accessibility needs — no human can efficiently compare 10–15 options simultaneously. But an AI voice agent swarm can.

### Why Current Solutions Fail

Existing AI appointment booking tools fall short in five critical ways:

| Gap | Current Solutions | What's Missing |
|-----|-------------------|----------------|
| **Unanswered calls** | Give up or require manual retry | 40–60% of calls go unanswered on first attempt — systems need intelligent retry |
| **No coordination** | Parallel calling exists but without intelligent orchestration | No real-time comparison of slots across providers |
| **Hallucination risk** | Blindly trust transcripts | Voice AI mishears or fabricates info → 15–25% booking errors |
| **No provider discovery** | Assume user already knows who to call | Users often don't know which providers match their needs |
| **Context amnesia** | Session-only memory | Users repeat preferences every single time |

### The Compounding Problem

The real pain isn't just one appointment. People book 15–20 appointments per year across different categories (healthcare, dining, personal care, auto, etc.). Without a system that learns your preferences and handles the entire flow — from finding providers to booking — every appointment is a fresh headache.

---

## 3. Product Vision & Goals

### Vision Statement

Voit transforms appointment booking from a manual, time-consuming chore into an autonomous, intelligent process — where AI agents find the right providers, call them on your behalf, negotiate availability, and deliver the best match based on your unique preferences.

### Primary Goals

1. **Reduce booking time by 80%+** — from 45 minutes average to under 10 minutes
2. **Automate provider discovery** — user describes what they need, system finds matching providers
3. **Achieve 80%+ booking success rate** — vs industry average of ~45%
4. **Build user trust through transparency** — live dashboard showing exactly what agents are doing
5. **Learn and improve** — system remembers preferences and gets smarter with every booking

### Hackathon-Specific Goals

1. **Maximize ElevenLabs API utilization** — Conversational AI 2.0, Batch Calling, Agentic Functions, System Tools, Language Detection
2. **Showcase multi-agent orchestration** — hierarchical agent swarm coordinating in real-time
3. **Deliver a stunning live demo** — real-time dashboard showing multiple agents negotiating simultaneously
4. **Prove the full loop** — from natural language request → provider discovery → voice calls → ranked results → confirmed booking

---

## 4. Target Users

### Primary Persona: The Time-Strapped Individual

**Demographics:**
- Age: 25–55
- Occupation: Working professionals, parents, caregivers, students
- Tech savviness: Moderate to high (comfortable with apps and AI)
- Income: $40k–$150k+

**Needs:**
- Book appointments without disrupting their day
- Find the best provider without researching 15 options manually
- Minimize time on phone calls (especially during work hours)
- Maintain control over the final decision
- Trust that the AI won't make errors or book the wrong thing

**Pain Points:**
- No time for multiple phone calls during work hours
- Provider offices only answer during business hours (overlap with user's work hours)
- Frustration with hold times, busy signals, and voicemail
- Difficulty comparing availability across providers
- Forgetting to follow up on missed calls
- Re-explaining requirements to every single receptionist

### Secondary Persona: The Coordinator

**Demographics:**
- Age: 30–55
- Role: Parents scheduling for kids, adult children managing elderly parents' care, personal assistants
- Responsible for: Scheduling for multiple people

**Needs:**
- Coordinate appointments for multiple individuals (family members)
- Track appointment history and preferences per person
- Handle cancellations and rescheduling efficiently
- Manage complex requirements (accessibility, insurance, specific providers)

**Pain Points:**
- Juggling multiple calendars simultaneously
- Remembering each person's preferences and constraints
- No centralized system for tracking all appointments across people

---

## 5. User Journey

This section walks through the complete user experience, from sign-up to confirmed booking. This is the core flow that the hackathon demo will showcase.

### 5.1 Onboarding (First Time Only — ~2 Minutes)

```
User lands on Voit → Signs up (email/password or Google OAuth)
→ Prompted to set up profile:
    - Home location (city/area — for distance calculations)
    - General preferences (preferred time of day, max travel distance)
    - Optional: Connect Google Calendar for conflict detection
→ Dashboard unlocked
```

**Key Design Decision:** Onboarding should be minimal. Most preferences are learned over time from the user's booking behavior. Only location is required upfront — everything else is optional and progressive.

### 5.2 Making a Request (30 Seconds)

The user types or speaks a natural language request:

> *"Book me a table at a nice Italian restaurant for 2 this Friday evening"*

> *"I need a dentist cleaning appointment this week, preferably mornings"*

> *"Find me a barber near downtown that can fit me in tomorrow"*

**What the system does:**
1. Parses the intent to extract structured parameters:
   - **Category:** restaurant / dentist / barber
   - **Specifics:** Italian, cleaning, near downtown
   - **Party size:** 2 (if applicable)
   - **Timeframe:** this Friday evening / this week mornings / tomorrow
2. Enriches with user knowledge (from profile + past behavior):
   - User's location → search radius
   - Past preferences → cuisine, budget, price range
   - Calendar → availability conflicts
3. Shows the user a confirmation preview before starting:

```
"Searching for Italian restaurants within 5 miles of downtown,
 evening availability this Friday, party of 2.
 Budget range: $60–100/person (based on your preferences).
 Found 8 matching providers. Ready to start calling?"

 [Start Search]  [Edit Preferences]
```

### 5.3 Provider Discovery (Automatic — 2–5 Seconds)

Before any calls happen, Voit needs to find the right providers to call. This is a critical step that no existing solution does well.

**How it works:**

1. **User's request + profile** forms a search query
2. **Provider database** is searched with filters:
   - Category match (restaurant, dentist, barber, etc.)
   - Location proximity (within user's max distance)
   - Rating threshold (e.g., 3.5+ stars)
   - Specialty/cuisine match
   - Business hours overlap with requested timeframe
3. **Results ranked** by relevance to user's preferences
4. **Top N providers selected** for calling (configurable, default 5–10 for demo)

**For the hackathon:** We use a mock provider database seeded in Convex with realistic data (names, addresses, phone numbers, ratings, business hours, specialties, menus/services). In production, this would be web scraping + Google Places API + Yelp API.

**Example — Restaurant search:**

| Provider | Rating | Distance | Cuisine | Price Range | Match Score |
|----------|--------|----------|---------|-------------|-------------|
| Bella Notte | 4.7★ | 1.2 mi | Italian | $$$ | 95 |
| Trattoria Roma | 4.5★ | 2.1 mi | Italian | $$ | 88 |
| Luigi's Kitchen | 4.3★ | 0.8 mi | Italian | $$ | 85 |
| Casa Napoli | 4.6★ | 3.5 mi | Italian | $$$$ | 78 |
| ... | ... | ... | ... | ... | ... |

### 5.4 Live Campaign (3–8 Minutes)

Once the user clicks "Start Search," the system launches a voice campaign:

1. **Orchestrator Agent** spawns one **Specialist Agent** per provider
2. Each Specialist Agent calls its assigned provider via **ElevenLabs + Twilio** (integrated telephony)
3. The dashboard transforms into a **live agent grid**:

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  📞 Bella Notte      │  │  ✅ Trattoria Roma   │  │  🔄 Luigi's Kitchen  │
│  ★★★★★ 4.7 · 1.2mi  │  │  ★★★★★ 4.5 · 2.1mi  │  │  ★★★★☆ 4.3 · 0.8mi  │
│                     │  │                     │  │                     │
│  Status: Ringing... │  │  Status: BOOKED ✓   │  │  Status: On Hold... │
│  Duration: 0:23     │  │  Fri 7:30pm, 2 ppl  │  │  Duration: 1:45     │
│  Confidence: —      │  │  Confidence: 94%    │  │  Confidence: —      │
│                     │  │                     │  │                     │
│  [View Transcript]  │  │  [View Transcript]  │  │  [View Transcript]  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

**What each agent does during a call:**
- Introduces itself: *"Hi, I'm calling on behalf of [USER_NAME] to check availability..."*
- Describes the request: *"Looking for a table for 2 this Friday evening around 7–8pm"*
- Negotiates slots if needed: *"Is 7:30 available? How about 8?"*
- Confirms details: *"So that's Friday, February 13th at 7:30pm for 2 people, correct?"*
- Reports back to Orchestrator with outcome + confidence score

**User controls during campaign:**
- **Pause All** — freeze all agents (useful if user spots a perfect slot early)
- **Boost Priority** — tell a specific agent to push harder on its provider
- **Book Now** — if user sees a great option, skip waiting and book immediately
- **Cancel** — abort the campaign

### 5.5 Results & Booking (1 Minute)

Once agents complete their calls (or user intervenes), the Aggregator scores all results:

```
🏆 BEST MATCH (Score: 95/100)
   Trattoria Roma
   📅 Friday, Feb 13 at 7:30pm · Party of 2
   ⭐ 4.5 stars (189 reviews)
   📍 2.1 miles (7 min drive)
   💰 $$ (matches your budget)
   ✅ Confidence: 94%

   Why this slot?
   ├─ Earliest available Friday evening slot
   ├─ Matches your Italian cuisine preference
   ├─ Within your 5-mile radius
   └─ High booking confidence (clear confirmation from host)

   [Book This Slot]

───────────────────────────────────────

🥈 RUNNER UP (Score: 87/100)
   Bella Notte
   📅 Friday, Feb 13 at 8:15pm · Party of 2
   ⭐ 4.7 stars (312 reviews)
   📍 1.2 miles (4 min drive)
   💰 $$$ (slightly above your usual budget)
   ✅ Confidence: 91%

   [Book This Slot]
```

**Scoring algorithm:**
```
score = (0.35 × availability_fit) + (0.25 × distance_score) + (0.20 × rating_score) + (0.20 × preference_match)
```

### 5.6 Post-Booking (15 Seconds)

When user selects a slot:
1. Appointment status updated to **CONFIRMED**
2. Event added to user's Google Calendar (if connected)
3. Confirmation SMS/notification sent to user
4. System **learns from this booking:**
   - User chose a $$ Italian restaurant → reinforce "moderate budget" + "Italian" preference
   - User booked a 7:30pm slot → reinforce "evening" preference
   - Provider responded quickly → boost provider's reliability score

### 5.7 Edge Cases

**Low Confidence Booking:**
- Agent gets ambiguous response (e.g., receptionist said "maybe" or line was unclear)
- Dashboard shows warning: *"⚠️ Needs Confirmation — receptionist's response was unclear"*
- System can send SMS to provider to verify, or user can confirm manually

**No Availability Found:**
- All agents report no openings
- System suggests: *"No availability this Friday. Want to try next Friday, or expand your search to 10 miles?"*
- User adjusts → new campaign launches

**Provider Doesn't Answer:**
- Agent marks call as unanswered
- Orchestrator schedules auto-retry (with intelligent timing)
- After 2 failed attempts → marks provider as unreachable for this campaign

**User Intervenes Mid-Campaign:**
- User sees a perfect slot in an agent's live transcript
- Clicks "Book Now" on that agent → all other agents paused → booking confirmed

---

## 6. Core Features & Requirements

### Feature 1: Natural Language Request Parsing

**User Story:** As a user, I want to describe what I need in plain English and have the system understand my intent.

| Requirement | Description |
|-------------|-------------|
| FR1.1 | Parse natural language input to extract: category, specifics, timeframe, party size |
| FR1.2 | Enrich parsed request with user profile data (location, preferences, history) |
| FR1.3 | Handle ambiguous requests with clarifying questions |
| FR1.4 | Show confirmation preview before launching campaign |
| FR1.5 | Support both text and voice input |

**Technical Approach:**
- LLM-based intent parsing (structured output extraction)
- User profile lookup from Convex to enrich context
- Confirmation step before committing to calling campaign

### Feature 2: User Profile & Preference Engine

**User Story:** As a user, I want the system to know my preferences so I don't repeat myself every time.

| Requirement | Description |
|-------------|-------------|
| FR2.1 | Store user profile: location, general preferences, dietary restrictions, budget ranges |
| FR2.2 | Learn preferences from booking history (what user picks, what they skip) |
| FR2.3 | Allow manual preference editing via settings UI |
| FR2.4 | Apply preferences automatically to provider search and scoring |
| FR2.5 | Support per-category preferences (dining vs healthcare vs personal care) |

**Profile Structure:**
```yaml
user_preferences:
  location:
    area: "Downtown Portland"
    max_distance_miles: 5
  general:
    preferred_times: ["evening", "morning"]
    avoid_times: ["early_afternoon"]
  dining:
    cuisines: ["Italian", "Japanese", "Mexican"]
    budget_per_person: "$40–$80"
    dietary: ["no shellfish"]
    ambiance: ["upscale casual"]
  healthcare:
    insurance: "BlueCross PPO"
    preferred_gender: "no preference"
    accessibility: []
  personal_care:
    barber_style: "modern fade"
    preferred_salon_type: "appointment only"
```

**Key Design Decision:** Preferences are stored as structured data in Convex and passed to the provider search engine and to voice agents as context. They're updated progressively — the system learns from what users book, not just what they say they want.

### Feature 3: Provider Discovery & Matching

**User Story:** As a user, I want the system to find providers that match my needs — I shouldn't have to know who to call.

| Requirement | Description |
|-------------|-------------|
| FR3.1 | Maintain a searchable provider database with metadata (name, phone, address, category, rating, hours, specialties, price range) |
| FR3.2 | Filter providers by: category, location radius, rating, specialty, business hours overlap |
| FR3.3 | Rank filtered providers by match score (relevance to user preferences) |
| FR3.4 | Select top N providers for calling campaign |
| FR3.5 | Display matched providers to user before calling (with option to add/remove) |

**For Hackathon:** Mock provider database seeded in Convex with ~30–50 realistic providers across categories (restaurants, dentists, barbers, auto repair, etc.).

**For Production:** Web scraping + Google Places API + Yelp API + insurance directories. Real-time data with caching.

### Feature 4: Multi-Agent Voice Orchestration

**User Story:** As a user, I want the system to call multiple providers simultaneously and find me the best available slot.

| Requirement | Description |
|-------------|-------------|
| FR4.1 | Support simultaneous calling of up to 10 providers per campaign |
| FR4.2 | Each Specialist Agent maintains independent conversation context |
| FR4.3 | Orchestrator Agent monitors all Specialists in real-time |
| FR4.4 | Aggregate results and present ranked recommendations |
| FR4.5 | Handle call failures gracefully (busy, voicemail, no answer) without affecting other agents |
| FR4.6 | Auto-retry failed calls with intelligent timing |

**Technical Approach:**
- ElevenLabs Conversational AI 2.0 for voice generation and conversation management
- ElevenLabs Batch Calling API for parallel outreach
- Twilio integrated as ElevenLabs' telephony provider (phone number + PSTN connectivity)
- Agent state tracked in Convex real-time database

### Feature 5: Real-Time Dashboard

**User Story:** As a user, I want to see what my AI agents are doing in real-time so I can trust the system and intervene if needed.

| Requirement | Description |
|-------------|-------------|
| FR5.1 | Display status of all agents simultaneously in a grid layout |
| FR5.2 | Show live transcripts for any active agent (expandable) |
| FR5.3 | Display confidence scores in real-time (color-coded) |
| FR5.4 | User controls: Pause All, Boost Priority, Book Now, Cancel |
| FR5.5 | Show aggregate metrics: calls attempted, success rate, time elapsed |
| FR5.6 | Updates within 100ms of agent state changes (Convex reactivity) |

### Feature 6: Scoring & Ranking Engine

**User Story:** As a user, I want the system to recommend the best option — not just the first available one.

| Requirement | Description |
|-------------|-------------|
| FR6.1 | Score every successful booking using weighted algorithm |
| FR6.2 | Factors: availability fit (35%), distance (25%), rating (20%), preference match (20%) |
| FR6.3 | Present top 3 options with transparent scoring breakdown |
| FR6.4 | User can see *why* each slot was ranked the way it was |

### Feature 7: Hallucination Detection & Confidence Scoring

**User Story:** As a user, I want to know when the AI is uncertain so I don't end up with a wrong booking.

| Requirement | Description |
|-------------|-------------|
| FR7.1 | Every booking receives a confidence score (0–100) |
| FR7.2 | Agents detect ambiguous responses and ask for clarification |
| FR7.3 | Bookings with <70 confidence flagged with warning in UI |
| FR7.4 | Agents explicitly state uncertainty instead of guessing |
| FR7.5 | LLM-based verification: cross-check agent's claims against transcript evidence |

**Technical Approach (Hackathon):**
- LLM prompt-based detector to verify booking claims against raw transcript
- Confidence scoring based on: clarity of confirmation, presence of specific details (date, time, name), absence of hedging language
- Stretch: BERT stochastic checker (generate multiple interpretations, flag high variance)

### Feature 8: Calendar Integration

**User Story:** As a user, I want the AI to check my calendar so it doesn't book me during an existing commitment.

| Requirement | Description |
|-------------|-------------|
| FR8.1 | Google Calendar OAuth integration |
| FR8.2 | Check availability in real-time during agent calls |
| FR8.3 | Detect conflicts with existing appointments |
| FR8.4 | Auto-add confirmed bookings to calendar |
| FR8.5 | Support user-defined preferred time ranges |

### Feature 9: Authentication & User Management

**User Story:** As a user, I want secure access to my account and preferences.

| Requirement | Description |
|-------------|-------------|
| FR9.1 | Email/password registration and login |
| FR9.2 | Google OAuth (also enables calendar access) |
| FR9.3 | Persistent sessions (7-day expiry) |
| FR9.4 | User can view/edit profile, preferences, and booking history |
| FR9.5 | Rate limiting to prevent abuse |

---

## 7. System Architecture

### 7.1 High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                            │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │  Auth UI  │  │ Search Input │  │  Dashboard   │  │ Results  │  │
│  └────┬─────┘  └──────┬───────┘  └──────┬──────┘  └────┬─────┘  │
└───────┼───────────────┼────────────────┼───────────────┼─────────┘
        │               │                │               │
        ▼               ▼                ▼               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React)                        │
│                    Deployed on Vercel                             │
│  - Reactive UI via Convex React hooks                            │
│  - Real-time dashboard with <100ms updates                       │
│  - User preference management                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
┌───────────────────┐ ┌──────────┐ ┌───────────────────────────────┐
│  BACKEND (Fastify) │ │  CONVEX  │ │  ELEVENLABS + TWILIO          │
│  Deployed on       │ │  (Cloud) │ │  (Integrated Telephony)       │
│  Railway           │ │          │ │                               │
│                   │ │  Real-time│ │  Conversational AI 2.0        │
│  - Orchestration  │ │  Database │ │  + Batch Calling API          │
│    logic          │◄─►│         │ │  + Twilio phone number        │
│  - Tool calling   │ │  - Users │ │    for PSTN calls             │
│    endpoints      │ │  - Provid│ │                               │
│  - Request parsing│ │  - Appts │ │  Voice AI ←→ Phone Network    │
│  - Auth middleware│ │  - Calls │ │                               │
│  - Google APIs    │ │  - Agent │ │  [ElevenLabs handles voice]   │
│                   │ │    state │ │  [Twilio handles phone conn]  │
└───────────────────┘ └──────────┘ └───────────────────────────────┘
```

### 7.2 Technology Stack

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| **Frontend** | Vite + React | Fast HMR, modern tooling, Convex React hooks for real-time UI |
| **Backend** | Node.js + Fastify | 2x faster than Express for WebSocket workloads, native JSON Schema validation, rich plugin ecosystem |
| **Database** | Convex | Real-time reactivity (agent state changes → UI in <100ms), ACID transactions (prevents double-booking), TypeScript-native |
| **Voice AI** | ElevenLabs Conversational AI 2.0 | WebSocket-based bidirectional voice, Batch Calling API for parallel calls, Agentic Functions (tool calling), System Tools |
| **Telephony** | Twilio (via ElevenLabs) | Twilio integrates directly into ElevenLabs as the phone provider. We configure a Twilio phone number in ElevenLabs — ElevenLabs handles voice, Twilio handles the PSTN connection. No separate SIP trunk management needed. |
| **Auth** | Better Auth | Modern, framework-agnostic, built-in rate limiting, easy Google OAuth for calendar |
| **Deployment** | Railway (backend) + Vercel (frontend) + Convex Cloud (DB) | Railway for WebSocket support + auto-scaling; Vercel for edge network + instant deploys |

### 7.3 ElevenLabs + Twilio Integration

This is a key simplification from the original design. Twilio is not a separate system — it's ElevenLabs' built-in telephony provider.

**How it works:**
1. We create an ElevenLabs Conversational AI agent with a system prompt, tools, and voice configuration
2. We configure a Twilio phone number inside ElevenLabs as the agent's telephony provider
3. When we want to call a provider, we use ElevenLabs' Batch Calling API — passing the provider's phone number
4. ElevenLabs generates voice audio, Twilio connects the call to the provider's phone
5. The conversation happens in real-time: provider speaks → Twilio receives audio → ElevenLabs transcribes + generates response → Twilio plays audio to provider
6. During the call, the agent can invoke **Agentic Functions** (tool calls) — these hit our Fastify backend endpoints

**ElevenLabs features we use:**
- **Conversational AI 2.0 WebSocket API** — real-time bidirectional voice
- **Batch Calling API** — parallel outreach to multiple providers
- **Agentic Functions (Tool Calling)** — 8+ custom tools for calendar, distance, scoring, memory
- **System Tools** — `end_call` (graceful termination), `transfer_agent` (escalation)
- **Language Detection** — auto-switch if provider speaks different language
- **Voice Library** — professional-sounding agent voice

**Tool calls the agent can make during a call:**

| Tool | Purpose | Backend Endpoint |
|------|---------|-----------------|
| `check_calendar` | Verify user has no conflicts at proposed time | Fastify → Google Calendar API |
| `calculate_distance` | Get travel time from user to provider | Fastify → Google Maps API (cached) |
| `report_availability` | Tell orchestrator what slots this provider has | Fastify → Convex mutation |
| `report_no_availability` | Tell orchestrator this provider has nothing | Fastify → Convex mutation |
| `flag_uncertainty` | Mark response as ambiguous (low confidence) | Fastify → Convex mutation |
| `update_call_status` | Stream call progress to dashboard | Fastify → Convex mutation |
| `request_clarification` | Agent asks provider to repeat/clarify | Internal (prompt adjustment) |
| `end_call` | Gracefully end conversation | ElevenLabs System Tool |

### 7.4 Data Flow

**Complete flow from request to booking:**

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
   SELECT * FROM providers
   WHERE category = "dentist"
     AND distance(user_location, provider_location) < 5mi
     AND rating >= 3.5
   ORDER BY match_score DESC
   LIMIT 8
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
11. Campaign completes → FASTIFY (Aggregator logic) scores results:
    score = 0.35×availability + 0.25×distance + 0.20×rating + 0.20×preference_match
                                    │
                                    ▼
12. FRONTEND shows ranked results → User selects → Books
    → CONVEX: appointment status = CONFIRMED
    → Google Calendar: event added
    → User: confirmation notification sent
```

### 7.5 Security

| Area | Approach |
|------|----------|
| **Auth** | Better Auth with bcrypt password hashing, JWT sessions (RS256), httpOnly refresh tokens |
| **Sessions** | 7-day expiry, CSRF protection via SameSite cookies |
| **API** | Rate limiting (100 req/min per user), CORS restricted to verified domains |
| **Data** | Transcripts encrypted at rest, PII encrypted in Convex, no call recordings by default |
| **Infrastructure** | HTTPS/TLS 1.3 everywhere, encrypted env vars (Railway Secrets, Vercel), no credentials in code |
| **Privacy** | GDPR-compliant data deletion endpoint, user can export all data as JSON |

---

## 8. Multi-Agent Design

### Agent Hierarchy

```
                    ┌─────────────────────┐
                    │   ORCHESTRATOR      │
                    │   (Campaign Manager) │
                    │                     │
                    │   - Spawns agents   │
                    │   - Monitors health │
                    │   - Aggregates      │
                    │     results         │
                    │   - Selects optimal │
                    │     slot            │
                    └─────┬───────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │ SPECIALIST  │ │ SPECIALIST  │ │ SPECIALIST  │    ... (up to 10)
   │ Agent #1    │ │ Agent #2    │ │ Agent #3    │
   │             │ │             │ │             │
   │ Provider:   │ │ Provider:   │ │ Provider:   │
   │ Bella Notte │ │ Trattoria   │ │ Luigi's     │
   │             │ │ Roma        │ │ Kitchen     │
   │ Status:     │ │ Status:     │ │ Status:     │
   │ CALLING     │ │ BOOKED ✓   │ │ ON_HOLD     │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### Agent Details

**Orchestrator Agent (1 per campaign)**
- **Role:** Campaign coordinator — runs on Fastify backend
- **Lifespan:** Entire campaign duration (3–10 minutes)
- **Responsibilities:**
  - Parse user request and enrich with preferences
  - Query provider database and select matches
  - Spawn Specialist Agents via ElevenLabs Batch Calling API
  - Monitor all agents via Convex real-time subscriptions
  - Detect when to trigger retries or fallbacks
  - Run scoring algorithm when agents complete
  - Present ranked results to user

**Specialist Agent (1 per provider)**
- **Role:** Single-provider caller — runs as an ElevenLabs Conversational AI agent
- **Lifespan:** Single call (1–5 minutes typical)
- **Responsibilities:**
  - Call assigned provider via Twilio
  - Navigate receptionist/host conversation
  - Negotiate available time slots
  - Invoke tool calls (calendar check, report availability, flag uncertainty)
  - Report outcome back to Orchestrator (via Convex)
- **State tracked in Convex:**
  - `QUEUED` → `RINGING` → `CONNECTED` → `NEGOTIATING` → `COMPLETED` / `FAILED` / `NO_ANSWER`
  - Transcript (streaming)
  - Confidence score
  - Available slots found

### Failure Handling

| Scenario | System Response |
|----------|-----------------|
| Provider doesn't answer | Mark as `NO_ANSWER` → Orchestrator schedules retry in 10–15 min → After 2 failures, mark as unreachable |
| Busy signal | Retry immediately once → Then schedule delayed retry |
| Ambiguous response | Agent asks for clarification → If still unclear, flag as low-confidence and continue |
| Agent hears something unexpected | `flag_uncertainty` tool call → Dashboard shows warning |
| WebSocket drops mid-call | Auto-reconnect within 5s → Resume from last confirmed state (context stored in Convex) |
| All providers unavailable | Suggest expanding search (wider area, different date, different time) |
| User clicks "Book Now" mid-campaign | Immediately pause all other agents → Confirm selected slot → End campaign |

---

## 9. Data Models

### Convex Schema

**`users`**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ID | Auto-generated |
| `email` | string | User email (unique) |
| `name` | string | Display name |
| `location` | object | `{ area, lat, lng }` |
| `preferences` | object | Structured preferences (see Feature 2) |
| `calendarConnected` | boolean | Google Calendar OAuth status |
| `createdAt` | number | Timestamp |

**`providers`**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ID | Auto-generated |
| `name` | string | Business name |
| `category` | string | "restaurant", "dentist", "barber", etc. |
| `phone` | string | Contact number |
| `address` | string | Full address |
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `rating` | number | Average rating (0–5) |
| `reviewCount` | number | Number of reviews |
| `priceRange` | string | "$", "$$", "$$$", "$$$$" |
| `specialties` | array | e.g., ["Italian", "Seafood"] or ["Cleaning", "Filling"] |
| `businessHours` | object | Per-day open/close times |
| `metadata` | object | Category-specific fields (menu items, insurance accepted, etc.) |

**`campaigns`**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ID | Auto-generated |
| `userId` | ID | Reference to user |
| `request` | object | Parsed user request `{ category, specifics, timeframe, ... }` |
| `providerIds` | array | Providers selected for calling |
| `status` | string | "ACTIVE", "COMPLETED", "CANCELLED" |
| `startedAt` | number | Timestamp |
| `completedAt` | number | Timestamp (nullable) |

**`agentCalls`**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ID | Auto-generated |
| `campaignId` | ID | Reference to campaign |
| `providerId` | ID | Reference to provider |
| `status` | string | "QUEUED", "RINGING", "CONNECTED", "NEGOTIATING", "COMPLETED", "FAILED", "NO_ANSWER" |
| `transcript` | string | Running transcript text |
| `slotsFound` | array | Available slots reported by agent `[{ datetime, details }]` |
| `confidenceScore` | number | 0–100 |
| `duration` | number | Call duration in seconds |
| `outcome` | string | "BOOKED", "NO_AVAILABILITY", "UNANSWERED", "ERROR" |
| `startedAt` | number | Timestamp |
| `completedAt` | number | Timestamp (nullable) |

**`appointments`**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ID | Auto-generated |
| `userId` | ID | Reference to user |
| `providerId` | ID | Reference to provider |
| `campaignId` | ID | Reference to campaign |
| `datetime` | number | Appointment timestamp |
| `details` | string | Description (e.g., "Table for 2", "Dental cleaning") |
| `status` | string | "CONFIRMED", "CANCELLED", "COMPLETED" |
| `confidenceScore` | number | Booking confidence |
| `scoringBreakdown` | object | `{ availability, distance, rating, preference }` |
| `createdAt` | number | Timestamp |

**`userPreferenceHistory`**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ID | Auto-generated |
| `userId` | ID | Reference to user |
| `category` | string | "restaurant", "dentist", etc. |
| `signal` | string | What the system learned (e.g., "prefers_evening", "chose_moderate_budget") |
| `source` | string | "booking" (from actual booking) or "explicit" (user set manually) |
| `createdAt` | number | Timestamp |

---

## 10. Success Metrics

### Primary KPIs (Hackathon Demo)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **End-to-end booking time** | < 10 minutes | Time from "Start Search" to "Booking Confirmed" |
| **Booking success rate** | 80%+ of campaigns find at least one slot | `campaigns_with_bookings / total_campaigns` |
| **Voice latency** | < 1 second (user speech → agent response) | Timestamp delta in call logs |
| **Dashboard update latency** | < 100ms (agent state → UI) | Convex subscription timestamp delta |
| **Concurrent agents** | 5–10 agents without degradation | Monitor connection success rate, zero dropped calls |
| **Tool calls demonstrated** | 8+ unique tools used in demo | Tool invocation count |
| **Scoring accuracy** | Recommended slot has highest score | Compare recommended vs alternatives |

### Secondary KPIs (Product Quality)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Confidence score accuracy** | Flagged issues are real > 85% of the time | Manual review of flagged transcripts |
| **Time savings** | 80%+ reduction vs manual | `(manual_time - automated_time) / manual_time` |
| **Provider discovery relevance** | Top 5 matches are all relevant to request | Manual review of search results |
| **User trust** | 90%+ users feel "confident in AI's decisions" | Post-demo feedback |

---

## 11. Development Roadmap

### 48-Hour Hackathon Timeline

#### Phase 1: Foundation (Hours 1–12)

**Hours 1–3: Infrastructure Setup**
- [ ] Create GitHub repo with structure: `/backend`, `/frontend`, `/convex`, `/shared`
- [ ] Initialize Convex project + deploy dev instance
- [ ] Set up Railway + deploy initial Fastify app
- [ ] Initialize Vite React app + deploy to Vercel
- [ ] Configure environment variables everywhere

**Hours 4–6: Auth + Database**
- [ ] Integrate Better Auth with Fastify
- [ ] Implement registration + login endpoints
- [ ] Create Convex schema (all tables defined in Section 9)
- [ ] Seed mock provider database (~30–50 providers across categories)
- [ ] Test auth flow end-to-end

**Hours 7–9: ElevenLabs + Twilio Foundation**
- [ ] Create ElevenLabs account + configure API keys
- [ ] Set up Twilio account + purchase phone number
- [ ] Configure Twilio as telephony provider in ElevenLabs
- [ ] Implement single-agent voice call (test with 1 mock provider)
- [ ] Verify call connects + transcript streams back

**Hours 10–12: Provider Discovery + Request Parsing**
- [ ] Implement LLM-based intent parser (natural language → structured request)
- [ ] Build provider search/matching logic in Convex
- [ ] User profile enrichment (merge parsed request + stored preferences)
- [ ] Test: "Book me a dentist this week" → returns 8 matching providers
- [ ] Implement confirmation preview endpoint

#### Phase 2: Core Features (Hours 13–24)

**Hours 13–15: Multi-Agent Orchestration**
- [ ] Implement Orchestrator logic in Fastify (spawn, monitor, aggregate)
- [ ] Implement Specialist Agent configuration for ElevenLabs
- [ ] Test parallel calling with 3 agents (validate independent conversations)
- [ ] Agent state management in Convex (status updates streaming)
- [ ] Error handling for connection failures

**Hours 16–18: Tool Calling**
- [ ] Implement core tools as Fastify endpoints:
  - `check_calendar` → Google Calendar API
  - `report_availability` → Convex mutation
  - `report_no_availability` → Convex mutation
  - `flag_uncertainty` → Convex mutation
  - `update_call_status` → Convex mutation
  - `calculate_distance` → Google Maps API (or mock)
- [ ] Register tools as ElevenLabs Agentic Functions
- [ ] Test tool invocation during live call

**Hours 19–21: Live Dashboard**
- [ ] Build agent status grid (cards with real-time updates)
- [ ] Implement Convex reactive subscriptions in React
- [ ] Add live transcript viewer (expandable per agent)
- [ ] Display campaign metrics (calls, success rate, time)
- [ ] Test dashboard with 3–5 simultaneous agents

**Hours 22–24: Scoring + Results**
- [ ] Implement scoring algorithm (availability × distance × rating × preference)
- [ ] Create results UI (top 3 slots with scoring breakdown)
- [ ] Booking confirmation flow (update status, add to calendar)
- [ ] Test complete loop: request → providers → calls → dashboard → results → book

#### Phase 3: Polish & Differentiators (Hours 25–36)

**Hours 25–27: Hallucination Detection**
- [ ] Implement confidence scoring (analyze transcript for certainty indicators)
- [ ] LLM-based verification (cross-check claims vs transcript)
- [ ] Hallucination warning UI in dashboard (badge on low-confidence results)
- [ ] Agent uncertainty behavior (asks for clarification when unsure)

**Hours 28–30: User Preference Engine**
- [ ] Preference learning from bookings (post-booking analysis)
- [ ] Preference management UI (settings page)
- [ ] Apply learned preferences to provider search automatically
- [ ] Test: Book morning slot → system learns morning preference → next search prioritizes mornings

**Hours 31–33: Retry Logic + Edge Cases**
- [ ] Auto-retry for unanswered calls (intelligent timing)
- [ ] Handle "no availability" scenario (suggest expanding search)
- [ ] User override mid-campaign (Book Now, Pause All)
- [ ] WebSocket reconnection logic

**Hours 34–36: UI Polish**
- [ ] Design system (colors, typography, spacing, consistent components)
- [ ] Loading states and animations (agent cards pulse when calling)
- [ ] Mobile responsive layout (at least tablet)
- [ ] Empty states, error states, success states

#### Phase 4: Demo Prep (Hours 37–48)

**Hours 37–39: Demo Script + Data**
- [ ] Write 5-minute demo script with narrative arc
- [ ] Create polished demo provider data (realistic names, varied availability)
- [ ] Rehearse demo flow 3 times

**Hours 40–42: Testing**
- [ ] End-to-end test — happy path (finds slots, books successfully)
- [ ] End-to-end test — partial failure (some providers don't answer)
- [ ] End-to-end test — no availability (suggests alternatives)
- [ ] Fix critical bugs

**Hours 43–48: Final Polish + Submission**
- [ ] Final UI tweaks based on testing
- [ ] Record demo video (if required)
- [ ] Write README with setup instructions
- [ ] Submit

### Minimum Viable Demo (If Behind Schedule)

If time is tight, this is the absolute minimum for a compelling demo:

1. ✅ User types a request → system finds matching providers (mock DB)
2. ✅ System calls 3–5 providers in parallel via ElevenLabs + Twilio
3. ✅ Live dashboard shows agent progress in real-time
4. ✅ Results ranked and presented → user books
5. ❌ ~~Hallucination detection~~ (nice to have)
6. ❌ ~~Preference learning~~ (can fake with seeded data)
7. ❌ ~~Calendar integration~~ (can show static availability)

---

## 12. Risk Assessment & Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **ElevenLabs API goes down during demo** | Medium | Critical | Pre-record backup demo video; have simulated agent responses ready; test 24h before |
| **Twilio call connections fail** | Medium | High | Test 20+ calls before demo; use most reliable Twilio region; have backup phone number |
| **Convex latency spikes** | Low | High | Implement optimistic UI updates; fall back to polling (500ms) if subscriptions fail |
| **Google Calendar API rate limits** | Low | Medium | Cache availability for 5 min; pre-fetch for demo; have mock calendar fallback |
| **WebSocket drops mid-call** | Medium | Medium | Auto-reconnect within 5s; conversation context preserved in Convex |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Hallucination detection produces false positives** | Medium | Medium | Tune threshold carefully; allow user to dismiss warnings; show "why" for every flag |
| **Provider receptionists confused by AI** | High | Low | Train agent opening line to be transparent; have graceful handling for "I don't talk to robots" |
| **Mock data feels unrealistic** | Medium | Medium | Use real business name patterns, realistic addresses, varied availability; make data feel alive |

### Execution Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Not enough time for all features** | High | Medium | Prioritize ruthlessly per "Minimum Viable Demo" list; cut hallucination detection first, then preference learning |
| **Complex debugging across ElevenLabs + Twilio + Convex** | High | Medium | Build incrementally — single call works before attempting parallel; log everything |

---

## 13. Future Enhancements

These are explicitly out of scope for the hackathon but represent the product's growth potential.

### Post-Hackathon (Month 1–3)
- **SMS/Email Fallback** — when calls fail, automatically send booking request via text
- **Multi-language Support** — leverage ElevenLabs language detection for Spanish, French, etc.
- **Waitlist Intelligence** — register on cancellation waitlists, auto-book when slot opens
- **Insurance Verification** — for healthcare, pre-check insurance acceptance before calling
- **Rescheduling & Cancellation** — manage existing appointments, not just new ones

### Mid-Term (Month 4–6)
- **Business-Side Dashboard** — providers see bookings coming from Voit (B2B entry point)
- **Group Booking** — "Book dentist appointments for my 3 kids on the same day"
- **Voice Cloning** — use the user's own voice for calls (increases provider trust)
- **Real No-Show Prediction** — ML model trained on actual booking outcomes
- **Web Scraping for Providers** — replace mock DB with real-time provider discovery

### Long-Term (Month 7–12)
- **Predictive Suggestions** — "It's been 6 months since your last dentist visit — want me to book?"
- **Healthcare Coordination** — manage referral chains (primary care → specialist → imaging → follow-up)
- **Enterprise Call Center** — hospitals/clinics deploy Voit for patient scheduling

---

## 14. Appendix

### Glossary

| Term | Definition |
|------|-----------|
| **Campaign** | A single appointment search session — from user request through provider calls to booking |
| **Orchestrator** | Central coordinator that manages all specialist agents during a campaign |
| **Specialist Agent** | Individual ElevenLabs voice AI agent assigned to call one provider |
| **Confidence Score** | 0–100 metric indicating how certain the agent is about the booking details |
| **Provider Discovery** | Process of finding matching providers based on user request + preferences |
| **Agentic Functions** | ElevenLabs feature allowing agents to invoke external functions (tool calls) during conversation |
| **Batch Calling** | ElevenLabs API for initiating multiple simultaneous outbound calls |

### Technical Specifications

**Development Environment:**
- Node.js: v20.11+
- npm: v10.2+
- TypeScript: v5.3+
- React: v18.2+
- Vite: v5.0+

**Production Infrastructure:**
- Backend: Railway (auto-scaling)
- Frontend: Vercel (Edge CDN)
- Database: Convex Cloud
- Voice AI: ElevenLabs API
- Telephony: Twilio (via ElevenLabs integration)

**API Rate Limits (Demo):**
- ElevenLabs: 100 concurrent sessions
- Google Calendar: 1M requests/day
- Google Maps: 100K elements/day
- Twilio: Pay-per-use (no hard limit)

**Estimated Monthly Costs (Production):**

| Service | Cost | Notes |
|---------|------|-------|
| ElevenLabs | ~$99 | Starter plan, 100K characters |
| Twilio | ~$500 | ~5000 calls @ $0.10/call |
| Railway | ~$20 | Pro plan |
| Vercel | ~$20 | Pro plan |
| Convex | ~$25 | Pro plan |
| Google APIs | ~$50 | Pay-as-you-go |
| **Total** | **~$714/month** | Supports ~5000 bookings |

### References

1. Elite Voice Agents. (2025). *Why Appointment Booking SUCKS | Voice AI Bookings.* https://elitevoiceagents.com/why-appointment-booking-sucks-voice-ai-bookings/
2. Intelligence Factory. (2025). *Real-Time Hallucination Detection in Voice Agents.* https://www.intelligencefactory.ai/portfolio/real-time-hallucination-detection-in-voice-agents
3. Medical Economics. (2025). *Can AI predict no-shows before they happen?* https://www.medicaleconomics.com/view/can-ai-predict-no-shows-before-they-happen-this-new-model-says-yes
4. ElevenLabs. (2025). *Batch calling for ElevenLabs Conversational AI.* https://elevenlabs.io/blog/introducing-batch-calling-for-elevenlabs-conversational-ai
5. ConversAI Labs. (2025). *Multi-Agent AI Orchestration: Managing 50+ Voice Agents.* https://www.conversailabs.com/blog/multi-agent-ai-orchestration

---

*Document Version: 2.0 — Rewritten February 8, 2026. Consumer-focused. Removed B2B scope. Added provider discovery flow, user journey clarity, and simplified ElevenLabs + Twilio architecture.*