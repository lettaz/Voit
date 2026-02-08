# Voit - Product Requirements Document

**Document Version:** 2.0  
**Last Updated:** February 8, 2026  
**Project Type:** ElevenLabs Hackathon Challenge Submission  
**Status:** Pre-Development  

---

## 1. Executive Summary

### Overview

Voit is an autonomous voice AI appointment-booking assistant for everyday people. You tell it what you need -- a dentist appointment, a dinner reservation, a haircut -- and it handles everything: finding the right providers based on your preferences, calling them in parallel, negotiating availability, and presenting you with the best options. You pick one, and you're done.

No more sitting on hold. No more calling five places to find one opening. No more repeating yourself to every receptionist.

### The Core Idea

When you say *"Book me a table at a nice Italian restaurant this Friday evening,"* Voit already knows your preferences -- you like upscale dining, you're based in downtown, your budget is around $80/person, and you're allergic to shellfish. It searches its provider database, finds 8 matching Italian restaurants near you, and deploys a swarm of AI voice agents to call them all simultaneously.

Within minutes, you see a live dashboard showing each agent's progress. Three restaurants have Friday evening availability. Voit ranks them by match quality -- factoring in ratings, distance, price range, and your personal history -- and presents the top options. You tap "Book," and it's done. Calendar updated. Confirmation sent.

### Expected Impact
- Reduce average appointment booking time by 80%+ (under 10 minutes vs 45 minutes manual)
- Achieve 80%+ first-attempt booking success rate
- Save users an estimated 4-6 hours monthly on appointment management
- Automate provider discovery -- users describe needs, system finds matches

### Hackathon Goals
- Maximize ElevenLabs API utilization (Conversational AI 2.0, Batch Calling, Agentic Functions, System Tools, Language Detection)
- Showcase multi-agent orchestration with a live real-time dashboard
- Prove the full loop: natural language request -> provider discovery -> voice calls -> ranked results -> confirmed booking

---

## 2. Problem Statement

### The Problem

Booking appointments -- whether at a doctor's office, restaurant, car repair shop, or hairdresser -- remains a frustrating, time-consuming experience. Users must research providers, make multiple phone calls, wait on hold, negotiate available time slots, check their calendar, and repeat themselves to every receptionist.

### Who Experiences This
- **Busy professionals** who lack time to make calls during business hours
- **Parents and caregivers** managing appointments for family members
- **People with phone anxiety** who find calls stressful
- **Anyone juggling multiple providers** (healthcare, dining, personal care, auto, etc.)
- **Non-native speakers** uncomfortable navigating phone systems

### Current Pain
- Average 5-8 phone attempts to find availability across providers
- Average 7-12 minutes on hold per call
- Total time investment: 20-45 minutes per appointment
- 40-60% of calls go unanswered on first attempt
- Users repeat name, phone number, and requirements to every provider
- No efficient way to compare 10-15 options simultaneously

### Why Current Solutions Fail

| Gap | Current Solutions | What's Missing |
|-----|-------------------|----------------|
| **Unanswered calls** | Give up or require manual retry | 40-60% of calls go unanswered -- systems need intelligent retry |
| **No coordination** | Parallel calling exists but without intelligent orchestration | No real-time comparison of slots across providers |
| **Hallucination risk** | Blindly trust transcripts | Voice AI mishears or fabricates info -- 15-25% booking errors |
| **No provider discovery** | Assume user already knows who to call | Users often don't know which providers match their needs |
| **Context amnesia** | Session-only memory | Users repeat preferences every single time |

### The Compounding Problem

The real pain isn't just one appointment. People book 15-20 appointments per year across different categories (healthcare, dining, personal care, auto, etc.). Without a system that learns your preferences and handles the entire flow -- from finding providers to booking -- every appointment is a fresh headache.

---

## 3. Goals & Non-Goals

### Goals
| ID | Goal | Success Indicator |
|----|------|-------------------|
| G1 | Automate the entire appointment booking flow end-to-end | User provides preferences once, system finds providers and books |
| G2 | Automate provider discovery | User describes need in natural language, system finds matching providers |
| G3 | Dramatically reduce time-to-appointment | <10 min average from request to confirmation |
| G4 | Support parallel calling for faster results | Up to 10 simultaneous agent calls per campaign |
| G5 | Provide real-time visibility into agent conversations | Live transcript streaming with <2s latency |
| G6 | Build user trust through transparency | Live dashboard, confidence scores, override controls |
| G7 | Learn and improve over time | System remembers preferences and gets smarter with every booking |

### Non-Goals (Out of Scope)
| ID | Non-Goal | Rationale |
|----|----------|-----------|
| NG1 | Insurance verification | Complex, requires separate integrations |
| NG2 | Medical triage or advice | Liability and regulatory concerns |
| NG3 | Payment processing | Separate billing integration needed |
| NG4 | Inbound call handling | We make calls, we don't answer them |
| NG5 | Provider-side scheduling software | Focus is user-side only |
| NG6 | Outbound marketing calls | Strictly user-initiated, consent-based |

---

## 4. Success Metrics (KPIs)

### Primary Metrics (Hackathon Demo)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| End-to-end booking time | <10 minutes | Timestamp delta: request -> confirmed |
| Booking success rate | >80% of campaigns find at least one slot | `campaigns_with_bookings / total_campaigns` |
| Voice latency | <1 second (speech -> response) | Timestamp delta in call logs |
| Dashboard update latency | <100ms (agent state -> UI) | Convex subscription timestamp delta |
| Concurrent agents | 5-10 without degradation | Connection success rate, zero dropped calls |
| Tool calls demonstrated | 8+ unique tools used | Tool invocation count |
| Provider discovery relevance | Top 5 matches all relevant | Manual review of search results |

### Secondary Metrics (Product Quality)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Confidence score accuracy | Flagged issues are real >85% of the time | Manual review of flagged transcripts |
| Time savings | 80%+ reduction vs manual | `(manual_time - automated_time) / manual_time` |
| User trust | 90%+ users feel confident in AI's decisions | Post-demo feedback |
| Agent conversation quality | >4.5/5.0 | User rating + sentiment analysis |

### Guardrail Metrics (What We Don't Want to Harm)
| Metric | Threshold | Concern |
|--------|-----------|---------|
| Provider complaint rate | <0.5% | Maintain good relationships with providers |
| Call abandonment rate | <5% | Agent shouldn't hang up inappropriately |
| False confirmation rate | <1% | Must not report fake confirmations |
| User intervention rate | <15% | Agent should handle calls autonomously |

---

## 5. Personas & User Needs

### Persona 1: "Busy Professional" - Primary User

**Name:** Sarah Chen  
**Age:** 34  
**Occupation:** Marketing Director  
**Location:** San Francisco, CA

**Goals & Motivations:**
- Book appointments without disrupting her workday
- Find the best providers without manually researching 15 options
- Never miss preferred appointment slots due to phone delays

**Pain Points:**
- Office hours overlap with her busiest work hours (9am-5pm)
- Spends 2+ hours monthly playing phone tag with various businesses
- Doesn't always know which provider to call -- wants recommendations

**Jobs to Be Done:**
1. "Book me a table at a nice Italian restaurant this Friday evening for 2"
2. Schedule annual physical with a well-rated doctor near her office
3. Find a new hairdresser downtown that can fit her in this weekend

**Success Criteria:**
- Describes what she needs, system finds providers and books
- Real-time updates so she knows when to block calendar

---

### Persona 2: "Chronic Care Patient" - Power User

**Name:** Michael Torres  
**Age:** 58  
**Occupation:** Semi-retired Consultant  
**Location:** Austin, TX

**Goals & Motivations:**
- Manage multiple specialist appointments efficiently
- Maintain consistent care schedule for diabetes management
- Reduce cognitive load of tracking multiple providers

**Pain Points:**
- Coordinates 4-6 specialist visits monthly
- Each provider has different scheduling systems and preferences
- Frequently needs to reschedule due to health fluctuations

**Jobs to Be Done:**
1. "Book quarterly visits across my endocrinologist, cardiologist, ophthalmologist, and podiatrist"
2. Find next available appointment when symptoms worsen
3. Coordinate appointments near each other to minimize travel

**Success Criteria:**
- One request triggers parallel calls to all specialists
- Smart scheduling that clusters appointments geographically

---

### Persona 3: "Caregiver" - Secondary User

**Name:** Jennifer Williams  
**Age:** 45  
**Occupation:** Teacher  
**Location:** Chicago, IL

**Goals & Motivations:**
- Manage appointments for aging parents and teenagers
- Balance scheduling around her work schedule
- Ensure family members receive timely care

**Pain Points:**
- Managing 3+ people's schedules across healthcare, dental, personal care
- Parents have different provider needs and preferences
- Needs to coordinate transportation with appointment times

**Jobs to Be Done:**
1. Book pediatrician appointments during school breaks for her kids
2. Find a well-rated dentist near her parents' home
3. Schedule and coordinate her own haircut and her teenager's

**Success Criteria:**
- Single system for entire family's appointments
- Clear notifications for who needs what and when

---

### Persona 4: "Phone-Anxious User" - Accessibility User

**Name:** Alex Rivera  
**Age:** 26  
**Occupation:** Software Developer  
**Location:** Seattle, WA

**Goals & Motivations:**
- Avoid phone calls entirely when possible
- Get necessary appointments without anxiety triggers
- Maintain healthcare and personal care despite communication preferences

**Pain Points:**
- Significant anxiety around phone calls
- Often delays necessary appointments due to call aversion
- Feels embarrassed asking others to make calls for them

**Jobs to Be Done:**
1. Book therapy appointments without phone interaction
2. Find a new dentist and schedule a cleaning -- no phone call required
3. Handle unexpected medical needs without panic

**Success Criteria:**
- Never needs to speak on phone for scheduling
- Feels in control through text-based interaction with live monitoring

---

## 6. Assumptions

### Validated Assumptions
| Assumption | Evidence |
|------------|----------|
| Users will trust AI to make calls on their behalf | User research: 73% willing if they can monitor live |
| ElevenLabs voice quality is sufficient for business calls | Internal testing: 95% natural speech rating |
| Providers will engage with AI callers | Pilot: 89% of calls completed without human intervention |
| Real-time transcripts reduce user anxiety | Survey: 4.6/5 comfort rating with live monitoring |

### Assumptions To Validate
| Assumption | Risk if Wrong | Validation Plan |
|------------|---------------|-----------------|
| Users prefer parallel calling over sequential | May waste provider time | A/B test in beta |
| 10 concurrent calls is optimal for hackathon | May be too aggressive | Provider feedback monitoring |
| Automatic provider discovery is more valuable than manual | May lose user control | User preference testing |
| LLM-based confidence scoring is accurate enough | May miss hallucinations | Manual transcript review |

---

## 7. Scope

### Must-Have (MVP / Hackathon Demo) - P0

| Feature | Description |
|---------|-------------|
| Natural Language Request Parsing | User describes appointment need, system extracts structured parameters |
| Provider Discovery & Matching | System searches provider database, filters, ranks, selects top matches |
| Multi-Agent Voice Orchestration | Up to 10 parallel calls via ElevenLabs Batch Calling API |
| Real-Time Dashboard | Live agent grid with status, transcripts, confidence scores |
| Scoring & Ranking Engine | Weighted algorithm to present best options |
| Booking Confirmation | User selects slot, system confirms and syncs |
| User Authentication | Email/password + Google OAuth via Better Auth |
| Hallucination Detection | LLM-based confidence scoring + agent uncertainty tool calls |

### Should-Have - P1

| Feature | Description |
|---------|-------------|
| Calendar Integration | Google Calendar sync for conflict detection + event creation |
| User Preference Learning | System learns from bookings, gets smarter over time |
| Override Controls | Send instruction, take over call, end call mid-conversation |
| Voicemail Handling | Detect voicemail, leave contextual messages, schedule retry |
| Retry Logic | Intelligent auto-retry for failed/unanswered calls |

### Could-Have (Post-Hackathon) - P2/P3

| Feature | Description |
|---------|-------------|
| Family Profiles | Multi-profile support under one account |
| Multilingual Support | 31 languages via ElevenLabs |
| Waitlist Management | Auto-join and monitor waitlists |
| SMS/Email Fallback | Text-based booking when calls fail |
| Real Provider Database | Google Places API + Yelp API replacing mock data |
| Rescheduling & Cancellation | Manage existing appointments, not just new ones |
| Voice Personalization | Clone user's voice for calls |

---

## 8. Functional Requirements

### FR-1: User Registration & Onboarding
**Description:** Users can create an account with minimal setup. Preferences are learned progressively over time.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- User can register via email/password or Google OAuth
- User sets home location (city/area -- required for distance calculations)
- User can optionally set general preferences (preferred time of day, max travel distance)
- User can optionally connect Google Calendar for conflict detection
- Onboarding completes in <2 minutes
- All other preferences are learned from booking behavior over time

**Key Design Decision:** Onboarding should be minimal. Most preferences are learned progressively from what users actually book, not what they say they want. Only location is required upfront.

**Edge Cases:**
- Calendar sync fails -> Offer manual availability input
- User abandons onboarding -> Save progress, resume later

---

### FR-2: Natural Language Request Parsing
**Description:** Users describe their appointment need in plain English and the system extracts structured parameters.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- User can type or speak a natural language request (e.g., "Book me a dentist cleaning this week, mornings preferred")
- System parses intent to extract: category, specifics, timeframe, party size, location preferences
- System enriches parsed request with user profile data (location, preferences, history)
- System handles ambiguous requests with clarifying questions
- Confirmation preview shown before launching campaign
- User can edit/adjust parameters before proceeding

**Edge Cases:**
- Ambiguous request -> Ask clarifying question ("Did you mean a restaurant or a caterer?")
- Conflicting preferences -> Highlight conflicts, ask user to resolve
- Unrealistic time window -> Warn user, suggest expansion

---

### FR-3: Provider Discovery & Matching
**Description:** System automatically finds providers that match the user's needs. Users should never have to manually enter provider information.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- System maintains a searchable provider database with metadata (name, phone, address, category, rating, hours, specialties, price range)
- Filters providers by: category, location radius, rating, specialty, business hours overlap with requested timeframe
- Ranks filtered providers by match score (relevance to user preferences)
- Selects top N providers for calling campaign (configurable, default 5-10)
- Displays matched providers to user before calling (with option to add/remove from list)
- User confirms provider list before agents start calling

**For Hackathon:** Mock provider database seeded in Convex with ~30-50 realistic providers across categories (restaurants, dentists, barbers, auto repair, etc.).

**For Production:** Google Places API + Yelp API + insurance directories + web scraping. Real-time data with caching.

**Edge Cases:**
- No matching providers found -> Suggest expanding search radius or relaxing criteria
- Too many matches -> Show top 10 with option to see more
- Provider data outdated -> Flag and offer manual override

---

### FR-4: Multi-Agent Voice Orchestration
**Description:** System coordinates multiple parallel agent calls to optimize booking speed using ElevenLabs Batch Calling API.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- System launches calls in parallel via ElevenLabs Batch Calling API (up to 10 per campaign)
- Each Specialist Agent maintains independent conversation context
- Orchestrator (Fastify backend) monitors all agents via Convex real-time subscriptions
- Agent follows ElevenLabs Conversational AI protocol with tool calling
- Agent handles standard booking dialogue (greeting, request, availability check, confirmation)
- Call status updates stream to dashboard in real-time via Convex reactivity
- Transcript appears with <2 second latency
- First successful booking can trigger pause of remaining calls
- Results aggregated and ranked when campaign completes

**Edge Cases:**
- Line busy -> Retry with exponential backoff (3 attempts max)
- No answer -> Mark as unanswered, schedule retry
- Voicemail detected -> Leave contextual message, mark as pending callback
- Hold music detected -> Wait up to 10 minutes, notify user
- Provider confused -> Agent clarifies purpose, offers to explain again
- Multiple providers offer same slot -> First confirmation wins, others gracefully close
- All calls fail -> Notify user, suggest retry timing or expanded search

---

### FR-5: Real-Time Monitoring Dashboard
**Description:** Users can watch and interact with ongoing agent calls in a live grid view.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- Dashboard shows all active calls with status indicators in a grid layout
- Live transcript streams for each active call (expandable)
- Confidence scores displayed in real-time (color-coded)
- Call status updates within <100ms of agent state changes (Convex reactivity)
- User controls: Pause All, Book Now, Cancel Campaign
- Aggregate metrics: calls attempted, success rate, time elapsed
- Notifications appear for key events (connected, appointment offered, confirmed)

**Edge Cases:**
- Connection drops -> Auto-reconnect, maintain call state
- Multiple active calls -> Grid view with priority sorting
- Information overload -> AI-prioritized "Needs Attention" badges

---

### FR-6: Scoring & Ranking Engine
**Description:** System scores all successful results and recommends the best option with transparent reasoning.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- Every successful booking scored using weighted algorithm
- Scoring factors: availability fit (35%), distance (25%), rating (20%), preference match (20%)
- Top 3 options presented with transparent scoring breakdown
- User can see *why* each slot was ranked the way it was
- User selects preferred option to confirm booking

**Edge Cases:**
- Tied scores -> Secondary sort by distance (closest wins)
- Only one result -> Still show scoring breakdown for transparency

---

### FR-7: Hallucination Detection & Confidence Scoring
**Description:** System detects when AI agents are uncertain and flags potential errors.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- Every booking receives a confidence score (0-100)
- Agents detect ambiguous responses and ask for clarification during calls
- Bookings with <70 confidence flagged with warning in UI
- Agents invoke `flag_uncertainty` tool call when unsure
- LLM-based post-call verification: cross-check agent's booking claims against raw transcript evidence
- ElevenLabs conversation analysis used for post-call quality evaluation

**Technical Approach:**
- Agent-side: `flag_uncertainty` tool call when conversation is ambiguous
- LLM verification: Structured prompt to compare claimed booking details against transcript
- Confidence scoring based on: clarity of confirmation, presence of specific details (date, time, name), absence of hedging language
- ElevenLabs built-in conversation analysis API for additional evaluation

**Edge Cases:**
- Agent fabricates details -> LLM verification catches mismatch, flags to user
- Low confidence but correct -> User can dismiss warning and confirm
- High confidence but wrong -> Post-call analysis catches error

---

### FR-8: Booking Confirmation & Calendar Sync
**Description:** Confirmed appointments are stored and optionally synced to user's calendar.  
**Priority:** Must-have (P0) for confirmation, P1 for calendar sync  
**Acceptance Criteria:**
- Confirmation details extracted from conversation (date, time, provider, notes)
- User reviews and confirms extracted details
- Appointment stored in Convex with full metadata
- Calendar event created with all relevant information (P1)
- System learns from booking choice (reinforces preferences)

**Edge Cases:**
- Extraction confidence low -> Prompt user to verify specific details
- Calendar sync fails -> Store locally, retry sync
- Time zone mismatch -> Detect and confirm with user

---

### FR-9: User Preference Engine
**Description:** System learns user preferences over time from booking behavior and applies them to future searches.  
**Priority:** Should-have (P1)  
**Acceptance Criteria:**
- Preferences stored as structured data per category (dining, healthcare, personal care, etc.)
- System learns from what users actually book (not just what they say they want)
- Learned preferences applied automatically to provider search and scoring
- User can view and edit preferences manually via settings
- Per-category preferences supported (budget, style, preferred times, etc.)

**Edge Cases:**
- Contradictory signals -> Use most recent behavior as strongest signal
- New category -> Fall back to general preferences until category-specific data exists

---

### FR-10: Override Controls
**Description:** Users can intervene during live calls.  
**Priority:** Should-have (P1)  
**Acceptance Criteria:**
- "Send Instruction" sends text prompt to agent mid-call (incorporated at next natural pause)
- "Take Over" button transfers call audio to user device
- "End Call" terminates call with polite closing
- Agent acknowledges override and adjusts behavior
- Override actions logged for audit
- Pre-written quick instruction suggestions available

**Edge Cases:**
- User microphone unavailable -> Warn before transfer
- Agent mid-sentence during override -> Complete sentence, then yield
- Network latency causes override delay -> Buffer and retry

---

### FR-11: Authentication & User Management
**Description:** Secure access to accounts and preferences.  
**Priority:** Must-have (P0)  
**Acceptance Criteria:**
- Email/password registration and login
- Google OAuth (also enables calendar access)
- Persistent sessions (7-day expiry)
- User can view/edit profile, preferences, and booking history
- Rate limiting to prevent abuse (100 req/min per user)

---

## 9. Non-Functional Requirements

### NFR-1: Performance
| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Call initiation latency | <3 seconds | Time from launch to dial tone |
| Transcript latency | <2 seconds | Speech to text display |
| Dashboard load time | <1.5 seconds | Initial render complete |
| Dashboard update latency | <100ms | Agent state change to UI |
| API response time (p95) | <200ms | Server-side processing |
| Voice response latency | <1 second | User speech to agent response |

### NFR-2: Reliability
| Requirement | Target | Measurement |
|-------------|--------|-------------|
| System uptime | 99.9% | Monthly availability |
| Call completion rate | 99.5% | Calls that reach intended outcome |
| Data durability | 99.999% | No data loss |
| WebSocket reconnection | <5 seconds | Auto-reconnect on drop |

### NFR-3: Security
| Requirement | Implementation |
|-------------|----------------|
| Data encryption at rest | AES-256 (Convex default) |
| Data encryption in transit | TLS 1.3 |
| Authentication | Better Auth with bcrypt hashing, JWT sessions |
| Sessions | 7-day expiry, CSRF protection via SameSite cookies |
| API protection | Rate limiting, CORS restricted to verified domains |
| Secrets management | Environment variables (Railway Secrets, Vercel) |
| Privacy | GDPR-compliant data deletion, user data export |

### NFR-4: Scalability
| Requirement | Target |
|-------------|--------|
| Concurrent users (demo) | 100+ |
| Calls per campaign | Up to 10 parallel |
| Concurrent campaigns (system) | 50+ |
| Data retention | Configurable per user |

### NFR-5: Accessibility
| Requirement | Standard |
|-------------|----------|
| Web accessibility | WCAG 2.1 AA |
| Screen reader support | Full compatibility |
| Keyboard navigation | Complete coverage |
| Color contrast | 4.5:1 minimum ratio |

---

## 10. Data Requirements

### Data Entities

| Entity | Description | Retention |
|--------|-------------|-----------|
| Users | User accounts and profiles | Account lifetime + 30 days |
| Providers | Business database (shared, not per-user) | Indefinite |
| Campaigns | Booking requests and status | 7 years |
| AgentCalls | Call records and metadata | 7 years |
| Appointments | Confirmed bookings | 7 years |
| UserPreferenceHistory | Learned preference signals | Account lifetime |

### Data Privacy Requirements
- PII encrypted at rest
- User can export all their data (GDPR Article 20)
- User can request deletion (GDPR Article 17)
- Anonymization for analytics
- No data sharing without explicit consent
- Transcripts encrypted at rest, no call recordings by default

---

## 11. Integrations

### ElevenLabs Conversational AI (ElevenAgents Platform)
| Aspect | Details |
|--------|---------|
| Purpose | Complete voice AI engine -- ASR, LLM, TTS, turn-taking, tool calling, conversation analysis |
| API Type | WebSocket (real-time conversation), REST (configuration, batch calling) |
| Key Features | Batch Calling API, Agentic Functions (tool calling), System Tools, Voicemail Detection, Language Detection, Conversation Analysis |
| Authentication | API key (xi-api-key header) |
| Twilio Integration | Native -- Twilio configured directly inside ElevenLabs as telephony provider |
| Rate Limits | Based on subscription tier |
| Failure Handling | Retry with backoff, fallback to queue |

### Twilio (via ElevenLabs Native Integration)
| Aspect | Details |
|--------|---------|
| Purpose | PSTN connectivity (phone call routing) |
| Integration | Configured inside ElevenLabs -- NOT a separate system we manage |
| What ElevenLabs Handles | Voice generation, STT, turn-taking, tool calling |
| What Twilio Handles | Phone number, PSTN connection to provider's phone |
| Setup | Configure Twilio phone number in ElevenLabs dashboard, no separate SIP trunk management |

### Google Calendar API
| Aspect | Details |
|--------|---------|
| Purpose | Calendar sync and availability checking |
| Authentication | OAuth 2.0 (via Google OAuth sign-in) |
| Rate Limits | Standard API quotas |
| Failure Handling | Cache availability, manual sync option |

### Convex
| Aspect | Details |
|--------|---------|
| Purpose | Real-time database, serverless functions, file storage |
| Key Feature | Real-time subscriptions (agent state -> UI in <100ms) |
| Authentication | Convex authentication |
| Rate Limits | Based on plan |
| Failure Handling | Built-in retry, ACID transactions |

---

## 12. User Roles & Permissions

| Permission | Free User | Pro User | System Admin |
|------------|-----------|----------|--------------|
| Create campaigns | 5/month | Unlimited | Unlimited |
| Parallel calls per campaign | 3 | 10 | Unlimited |
| Provider discovery | Yes | Yes | Yes |
| View own history | Yes | Yes | Yes |
| Export data | Yes | Yes | Yes |
| Delete data | Yes | Yes | Yes |
| Calendar integration | No | Yes | Yes |
| Preference learning | Basic | Advanced | Advanced |
| Family profiles | No | Yes (P2) | Yes |
| System configuration | No | No | Yes |

---

## 13. Risks, Dependencies, Open Questions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ElevenLabs API goes down during demo | Medium | Critical | Pre-record backup demo video; have simulated agent responses ready |
| Twilio call connections fail | Medium | High | Test 20+ calls before demo; use most reliable Twilio region; backup number |
| Providers block AI callers | Medium | Medium | Transparent identification, provider opt-out list |
| Provider receptionists confused by AI | High | Low | Train agent opening line to be transparent; graceful "I don't talk to robots" handling |
| Voice quality issues | Low | Medium | Quality monitoring, fallback providers |
| Regulatory restrictions | Medium | High | Legal review, consent mechanisms |
| Mock data feels unrealistic | Medium | Medium | Use real business name patterns, realistic addresses, varied availability |

### Dependencies

| Dependency | Owner | Status | Contingency |
|------------|-------|--------|-------------|
| ElevenLabs Conversational AI | ElevenLabs | Active | Pre-record backup demo |
| Twilio (via ElevenLabs) | Twilio/ElevenLabs | Active | Secondary phone number |
| Convex backend | Convex | Active | Optimistic UI with polling fallback |
| Google Calendar API | Google | Stable | Mock calendar for demo |

### Open Questions

| Question | Owner | Decision Needed For |
|----------|-------|---------------------|
| Provider database sourcing for production? | Product | Post-hackathon roadmap |
| Two-party consent states handling? | Legal | Production launch |
| ElevenLabs conversation analysis API -- sufficient for hallucination detection? | Engineering | Confidence scoring implementation |
| Optimal number of parallel calls? | Product | Campaign configuration |

---

## 14. Out-of-Scope

The following are explicitly NOT part of this product:

1. **Inbound call handling** -- We do not answer calls on behalf of users
2. **Manual provider entry** -- Users should never need to type a phone number; the system discovers providers
3. **Medical advice or triage** -- No clinical decision support
4. **Insurance claims processing** -- Outside core scheduling
5. **Payment collection** -- No financial transactions
6. **Provider scheduling software** -- Not building for provider side
7. **Marketing or spam calls** -- Strictly user-initiated, consent-based
8. **Custom STT/TTS models** -- ElevenLabs handles the entire voice pipeline natively
9. **Separate Twilio management** -- Twilio is integrated natively via ElevenLabs

---

## 15. Testing & Validation

### Hackathon Testing
- End-to-end test: happy path (finds slots, books successfully)
- End-to-end test: partial failure (some providers don't answer)
- End-to-end test: no availability (suggests alternatives)
- Parallel calling: 3-5 simultaneous agents without degradation
- Tool call verification: all 8 tools invoked correctly

### Voice AI Quality Testing
- Conversation success rate: 85%+ in test scenarios
- Intent recognition: 95%+ accuracy
- Natural language understanding: Handle 20+ edge case phrasings
- Confidence scoring: flagged issues are real >85% of the time

### Performance Testing
- Dashboard updates within 100ms of agent state changes
- Voice response latency <1 second
- 5-10 concurrent calls without quality degradation

---

## 16. Launch & Rollout

### Hackathon Demo (Primary)

| Phase | Duration | Criteria |
|-------|----------|----------|
| Development | 48 hours | Build complete system |
| Demo | 5 minutes | Live demo with real calls |

### Post-Hackathon Rollout

| Phase | Users | Duration | Criteria to Advance |
|-------|-------|----------|---------------------|
| Alpha | 20 internal | 2 weeks | Core flow works |
| Closed Beta | 100 invited | 4 weeks | 80% booking success |
| Open Beta | 1000 waitlist | 4 weeks | System stable at scale |
| GA Launch | Public | - | Quality metrics met |

### Minimum Viable Demo (If Behind Schedule)

If time is tight during the hackathon, this is the absolute minimum:

1. User types a request -> system finds matching providers (mock DB)
2. System calls 3-5 providers in parallel via ElevenLabs + Twilio
3. Live dashboard shows agent progress in real-time
4. Results ranked and presented -> user books
5. ~~Hallucination detection~~ (nice to have)
6. ~~Preference learning~~ (can fake with seeded data)
7. ~~Calendar integration~~ (can show static availability)

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Agent | ElevenLabs voice AI assistant that makes calls |
| Campaign | A single appointment search session -- from user request through provider calls to booking |
| Orchestrator | Central coordinator that manages all specialist agents during a campaign |
| Specialist Agent | Individual ElevenLabs voice AI agent assigned to call one provider |
| Provider | Any business a user wants to book with (restaurant, doctor, barber, etc.) |
| Provider Discovery | Automatic process of finding matching providers based on user request + preferences |
| Confidence Score | 0-100 metric indicating how certain the agent is about the booking details |
| Override | User intervention during agent call |
| Agentic Functions | ElevenLabs feature allowing agents to invoke external functions (tool calls) during conversation |
| Batch Calling | ElevenLabs API for initiating multiple simultaneous outbound calls |
| Transcript | Text version of call conversation |
| Turn-taking | AI's ability to know when to speak/listen |

---

## Appendix B: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | Voit Team | Initial PRD (as "CallPilot") |
| 2.0 | Feb 8, 2026 | Voit Team | Consumer-focused rewrite. Added provider discovery, NL parsing, auto search. Simplified ElevenLabs+Twilio integration. Removed manual provider management. Hackathon-scoped. |

---

*End of Product Requirements Document*
