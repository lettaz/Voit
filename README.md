# Voit

Agentic Voice AI for Autonomous Appointment Scheduling. Powered by ElevenLabs.

You tell Voit what you need -- a dentist, a dinner reservation, a haircut -- and it calls providers on your behalf, negotiates availability, and presents you with the best options.

---

## Architecture

```
Voit/
├── frontend/          React + Vite + TailwindCSS + shadcn/ui
├── backend/           Fastify (Node.js) -- orchestration, webhooks, API
├── convex/            Convex -- real-time database, serverless functions, auth
├── shared/            Shared types
├── docs/              PRD, TRD, user journey, tool schemas
├── package.json       Root monorepo config (pnpm workspaces)
└── .env               All environment variables (single file)
```

**Stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, Framer Motion |
| Backend | Fastify, ElevenLabs Batch Calling API, Firecrawl |
| Database | Convex (real-time, serverless) |
| Auth | Better Auth (running as Convex component), Google OAuth |
| Voice AI | ElevenLabs Conversational AI + Twilio (outbound calls) |
| Provider Discovery | Firecrawl (web scraping) with mock fallback |
| i18n | react-i18next (English, German) |

---

## Quick Start (Team Member)

If the project owner has already set up Convex and shared the `.env` file with you:

### Prerequisites

- **Node.js** 18+
- **pnpm** -- install with `npm i -g pnpm`

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd Voit

# 2. Install all dependencies
pnpm install

# 3. Get the .env file from the project owner and place it in the ROOT of the repo
#    (contains Convex, ElevenLabs, Firecrawl, and auth credentials)

# 4. Start the frontend (uses Vite dev server — required for auth to work)
pnpm run dev:frontend   # http://localhost:8080

# 5. (Optional) Start the backend if you're working on campaigns / voice calls
pnpm run dev:backend    # http://localhost:3088
```

### Why just the `.env`?

All auth configuration (secrets, Google OAuth keys) is stored as **Convex environment variables on the cloud deployment**, which the project owner already set up. Those are shared automatically -- every client connecting to the same Convex deployment uses them. You do **not** need to run `npx convex env set` or `npx convex dev` unless you're changing the Convex schema or functions.

> **WARNING: Do NOT run `npx convex dev` or `pnpm run dev` (the root command that includes Convex).**
> If you do, Convex will auto-create a `.env.local` file that may provision a **brand new empty deployment** with no auth secrets configured. This will break signup/login with the error: `BetterAuthError: You are using the default secret`.
> If this happens, delete `.env.local` and restart the frontend.

### Important: Auth requires the Vite dev server

Account creation (signup/login) works through a **Vite proxy** that forwards `/api/auth/*` requests from `localhost:8080` to the Convex site URL. This means:

- You **must** start the frontend with `pnpm run dev:frontend` (not a static file server)
- The root `.env` **must** contain `CONVEX_SITE_URL` -- the Vite proxy reads this to know where to forward auth requests
- The root `.env` **must** contain `CONVEX_URL` -- the Convex React client reads this to connect to the database

If auth isn't working, check that your `.env` has both of these:
```env
CONVEX_URL=https://tame-crow-429.convex.cloud
CONVEX_SITE_URL=https://tame-crow-429.convex.site
```

### Verify it works

- Frontend: http://localhost:8080 (should show the auth screen)
- Create an account with email/password, or sign in with Google
- Backend health (if running): http://localhost:3088/api/health

---

## Full Setup (From Scratch)

If you're setting up the entire project yourself:

### Prerequisites

- **Node.js** 18+
- **pnpm** -- `npm i -g pnpm`
- **Convex account** -- free at https://convex.dev
- **Google Cloud project** -- for OAuth (optional, email/password works without it)
- **ElevenLabs account** -- with Conversational AI access
- **Twilio account** -- with a voice-capable phone number
- **ngrok** -- for exposing local webhooks to ElevenLabs
- **Firecrawl API key** -- optional, falls back to mock provider data

### 1. Install dependencies

```bash
git clone <repo-url>
cd Voit
pnpm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This is interactive -- it will ask you to log in and create a project. When it finishes, it writes deployment info to `.env.local`. Copy those values into your `.env` file (see step 3) and delete `.env.local`.

### 3. Create the `.env` file

Create a `.env` file in the project root:

```env
# ─── Convex ──────────────────────────────────
CONVEX_DEPLOYMENT=dev:your-deployment-name
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=https://your-deployment.convex.site

# ─── Backend ─────────────────────────────────
PORT=3088
FRONTEND_URL=http://localhost:8080
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=http://localhost:3088

# ─── Google OAuth (optional) ────────────────
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

# ─── ElevenLabs + Twilio ────────────────────
ELEVENLABS_API_KEY=<from-elevenlabs-dashboard>
ELEVENLABS_AGENT_ID=<your-agent-id>
ELEVENLABS_PHONE_NUMBER_ID=<twilio-number-id-from-elevenlabs>
ELEVENLABS_WEBHOOK_SECRET=<generate-a-random-hex-string>
API_URL=https://<your-ngrok-domain>.ngrok-free.app

# ─── Firecrawl (optional) ───────────────────
FIRECRAWL_API_KEY=<from-firecrawl.dev>

# ─── Debug Mode ──────────────────────────────
DEBUG_MODE=true
DEBUG_PHONE_NUMBER=<your-personal-phone-for-test-calls>
```

To generate secrets:
```bash
# For BETTER_AUTH_SECRET
openssl rand -hex 32

# For ELEVENLABS_WEBHOOK_SECRET
openssl rand -hex 32
```

### 4. Set Convex environment variables (one-time, stored in the cloud)

Better Auth runs *inside* Convex, so it reads secrets from Convex's own environment -- not your local `.env`. Run these once; they persist on the cloud deployment and apply to everyone sharing it:

```bash
npx convex env set SITE_URL http://localhost:8080
npx convex env set BETTER_AUTH_SECRET <same-value-as-in-env>
npx convex env set GOOGLE_CLIENT_ID <your-google-client-id>
npx convex env set GOOGLE_CLIENT_SECRET <your-google-client-secret>
```

> **Team members do NOT need to run these.** Once set by the project owner, they're shared automatically.

### 5. Google OAuth setup (optional)

1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials (Web Application)
3. Add authorized redirect URI: `http://localhost:8080/api/auth/callback/google`
4. Copy the Client ID and Client Secret into your `.env` and Convex env vars

### 6. Seed the database

Populate test providers (dentists, restaurants, barbers, etc.):

```bash
pnpm run seed
```

### 7. Start development

```bash
# Run all three services (Convex + Frontend + Backend)
pnpm run dev

# Or run individually:
pnpm run dev:convex     # Convex dev server (pushes schema/functions on save)
pnpm run dev:frontend   # Vite dev server on :8080
pnpm run dev:backend    # Fastify dev server on :3088
```

### 8. ElevenLabs agent setup

See `docs/elevenlabs-tools.md` for the full tool configuration reference.

1. Create an agent in the ElevenLabs dashboard (Conversational AI)
2. Configure voice, LLM (GPT-4o), and audio format (u-law 8000 Hz for Twilio)
3. Paste the system prompt from `backend/src/services/agentPrompt.ts`
4. Register the Twilio phone number in ElevenLabs
5. Enable system tools: `end_call`, `Voicemail detection`, `hand_off_to_human`, `Language detection`
6. Register 8 server tools with webhook URLs pointing to your ngrok domain (see docs)

### 9. ngrok setup (for ElevenLabs webhooks)

```bash
ngrok http 3088 --url=<your-static-domain>.ngrok-free.app
```

### 10. Test a call

```bash
# Make sure DEBUG_MODE=true and DEBUG_PHONE_NUMBER is set
pnpm --filter backend run test:call
```

---

## Project Structure

### Frontend (`frontend/`)

| Path | Purpose |
|------|---------|
| `src/pages/Auth.tsx` | Login / Signup / Google OAuth |
| `src/pages/Index.tsx` | Main app (renders Dashboard) |
| `src/components/Dashboard.tsx` | Home screen with tab navigation |
| `src/components/HeroCard.tsx` | Voice input card with mic button |
| `src/components/CallsPage.tsx` | Active/past agent calls list |
| `src/components/ActiveCall.tsx` | Fullscreen live call view with transcript |
| `src/components/AppointmentsSection.tsx` | Upcoming/past appointments |
| `src/components/BottomNav.tsx` | Bottom tab bar (Home, Calls, Appointments, Integrations) |
| `src/components/SettingsDropdown.tsx` | User avatar menu (language toggle, sign out) |
| `src/components/ThemeToggle.tsx` | Sun/moon theme toggle in header |
| `src/components/IntegrationsPage.tsx` | Service connections + agent setup (voice, handoff) |
| `src/components/SetupWizard.tsx` | First-time onboarding flow (5 steps) |
| `src/contexts/AuthContext.tsx` | Auth state + Convex user sync |
| `src/contexts/ThemeContext.tsx` | Dark/light mode |
| `src/i18n/` | English and German translations |
| `src/data/mockData.ts` | Mock data (being replaced with Convex queries) |

### Backend (`backend/`)

| Path | Purpose |
|------|---------|
| `src/server.ts` | Fastify entry point, registers all routes |
| `src/routes/providers.ts` | Provider discovery API (Firecrawl + mock) |
| `src/routes/campaigns.ts` | Campaign launch / cancel / status API |
| `src/routes/tools.ts` | 8 ElevenLabs tool webhook endpoints + post-call webhook |
| `src/services/orchestrator.ts` | ElevenLabs Batch Calling API client |
| `src/services/agentPrompt.ts` | System prompt + first message templates |
| `src/services/providerDiscovery.ts` | Firecrawl integration + mock data |
| `src/scripts/seedProviders.ts` | Populate database with test providers |
| `src/scripts/testCall.ts` | End-to-end single call test |

### Convex (`convex/`)

| Path | Purpose |
|------|---------|
| `schema.ts` | Database schema (users, providers, campaigns, agentCalls, appointments) |
| `users.ts` | User queries + mutations |
| `providers.ts` | Provider CRUD + search |
| `campaigns.ts` | Campaign lifecycle management |
| `agentCalls.ts` | Individual call tracking |
| `appointments.ts` | Confirmed booking records |
| `auth.ts` | Better Auth configuration |
| `http.ts` | HTTP routes for auth callbacks |

---

## Available Scripts

| Command | What it does |
|---------|-------------|
| `pnpm run dev` | Start all 3 services (Convex + Frontend + Backend) |
| `pnpm run dev:convex` | Convex dev server only |
| `pnpm run dev:frontend` | Vite dev server only (port 8080) |
| `pnpm run dev:backend` | Fastify dev server only (port 3088) |
| `pnpm run seed` | Seed database with test providers |
| `pnpm --filter backend run test:call` | Run a single test call via ElevenLabs |

---

## Key Design Decisions

- **Single `.env` file** -- no `.env.local`. All config in one place.
- **Debug mode** -- when `DEBUG_MODE=true`, all outbound calls go to `DEBUG_PHONE_NUMBER` instead of real providers. Provider data still stores real numbers.
- **Metadata fields** -- every Convex table has an optional `metadata` field for extensibility without schema changes.
- **Auth proxy** -- the frontend proxies `/api/auth/*` to Convex (for same-origin cookies) and `/api/*` to Fastify. In production, Vercel rewrites handle this (see `frontend/vercel.json`).
- **Mock fallbacks** -- `check_calendar` and `calculate_distance` tools return mock data until Google APIs are integrated. Firecrawl falls back to realistic mock providers if no API key is set.

---

## Roadmap

Features planned for future iterations:

### Per-User Agent Creation
Each user will be able to create and customize their own ElevenLabs voice agent via the Agent API (`POST /v1/convai/agents`). This includes:
- Selecting from the full ElevenLabs voice library or cloning their own voice
- Uploading a personal Knowledge Base (insurance details, dietary needs, medical info) via the ElevenLabs KB API
- Per-agent system prompt customization
- Individual Twilio number assignment per user

### Full Google Calendar Integration
- OAuth2 flow to connect Google Calendar
- Real-time calendar availability checks during calls (replacing the current mock `check_calendar` tool)
- Automatic event creation when an appointment is booked
- Double-booking prevention

### Google Maps / Places API
- Auto-detect user location via browser geolocation
- Real distance/travel time calculations via Distance Matrix API (replacing the mock `calculate_distance` tool)
- Provider search enrichment via Places API (ratings, hours, photos)

### PWA Conversion
- Service worker for offline support
- Native splash screens and app icons
- Push notifications for call completion, appointment confirmations, and campaign results
- Add-to-homescreen prompt

### Advanced Agent Features
- Live user-in-the-loop: real-time transcript streaming with user intervention/override
- Domain expert routing: specialized sub-agents for health, automotive, dining
- Waitlist & callback intelligence: register on provider waitlists with automatic retry
- Rescheduling & cancellation agent: manage existing bookings autonomously
- Multilingual auto-detection and seamless language switching mid-call

---

## Documentation

- `docs/prd.md` -- Product Requirements Document
- `docs/trd.md` -- Technical Requirements Document
- `docs/user_journey.md` -- User journey flows
- `docs/elevenlabs-tools.md` -- ElevenLabs agent tool schemas and configuration
