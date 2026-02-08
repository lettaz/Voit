# Voit - User Journey Documentation

**Document Version:** 2.0  
**Last Updated:** February 8, 2026  
**Project Type:** ElevenLabs Hackathon Challenge Submission  
**Status:** Pre-Development  

---

## Overview

This document maps the complete user journeys for Voit, detailing every stage from initial discovery through long-term retention. Each journey includes touchpoints, emotional states, pain points, and opportunities for improvement.

**Key Principle:** Users never manually add providers. They describe what they need in natural language, and Voit discovers matching providers automatically.

---

## Journey Map Framework

Each journey stage documents:
- **User Goal:** What the user is trying to accomplish
- **Actions:** Specific steps the user takes
- **Touchpoints:** Where interaction occurs
- **Emotions:** User's emotional state (positive/neutral/negative)
- **Pain Points:** Friction or frustration sources
- **Opportunities:** Ways to improve the experience

---

## Journey 1: First-Time User - New Appointment Booking

### Stage 1: Discover

**User Goal:** Find a solution for appointment scheduling frustration

**Actions:**
1. Searches for "schedule doctor appointment for me" or "AI appointment booking"
2. Sees Voit ad or organic result
3. Reads landing page value proposition
4. Watches demo video (30 seconds)
5. Decides to try the service

**Touchpoints:**
- Search engine results
- Landing page
- Demo video
- Testimonials section

**Emotions:** Frustrated -> Curious -> Hopeful

**Pain Points:**
- Skepticism about AI making real calls
- Unclear pricing on landing page
- Privacy concerns about data

**Opportunities:**
- Clear "how it works" explainer with real call audio samples
- Prominent security badges and privacy compliance info
- Free trial without credit card to reduce friction

---

### Stage 2: Onboard

**User Goal:** Set up account quickly and understand how to use the service

**Actions:**
1. Clicks "Get Started Free"
2. Signs up with Google OAuth (or email)
3. Sets home location (city/area -- only required field)
4. Optionally sets preferred time of day and max travel distance
5. Optionally connects Google Calendar
6. Sees dashboard -- ready to book

**Touchpoints:**
- Sign-up modal
- Onboarding wizard (2-3 steps, <2 minutes)
- Optional calendar connection screen
- Dashboard home

**Emotions:** Optimistic -> (brief setup) -> Ready

**Key Design Decision:** Onboarding is minimal. Only location is required upfront. All other preferences (cuisine, budget, preferred times, etc.) are learned progressively from what the user actually books. This avoids tedious questionnaires and respects that people don't always know their preferences until they see results.

**Pain Points:**
- Calendar permission requests feel invasive
- Not sure what the system will do with location data

**Opportunities:**
- Explain why location is needed ("so we find providers near you")
- Explain why calendar access helps ("so we don't double-book you")
- "Skip for now" option on non-critical steps
- Show that preferences are learned, not interrogated

**User Flow:**
```
Sign Up -> Set Location -> (Optional: Calendar Connect) -> Dashboard Ready!
```

---

### Stage 3: First Booking (Core Task)

This is the "magic moment" -- where the user sees the full power of Voit for the first time.

**User Goal:** Successfully book an appointment using Voit for the first time

**Actions:**
1. Types a natural language request: *"I need a dentist cleaning this week, mornings preferred"*
2. Reviews the system's understanding (parsed request + enriched context)
3. Sees matched providers: "Found 8 dentists within 5 miles. Ready to call?"
4. Optionally removes/adds providers from the list
5. Clicks "Start Search"
6. Watches live dashboard as agents call all 8 providers simultaneously
7. Sees slots found, confidence scores updating in real-time
8. Campaign completes -- ranked results appear
9. Selects best option, confirms booking
10. Checks calendar for new event

**Touchpoints:**
- Natural language input field
- Confirmation preview (parsed request + matched providers)
- Live monitoring dashboard (agent grid)
- Results screen (ranked options with scoring)
- Booking confirmation modal
- Calendar notification

**Emotions:** Curious -> Impressed (providers found automatically!) -> Nervous (calls happening) -> Amazed (it works!) -> Delighted -> Triumphant

**Pain Points:**
- Uncertainty if system understood the request correctly
- Anxiety about what AI will say on the phone
- Impatience during calls (even if short)
- Uncertainty if confirmation is real
- Information overload with multiple agents calling at once

**Opportunities:**
- Show parsed intent for user to verify ("Looking for: dentist, cleaning, this week, mornings, within 5 miles")
- "First booking" coaching overlay explaining each UI element
- Visual progress indicator during calls
- AI-prioritized "Needs Attention" badges on agent cards
- Explicit confirmation step with details to verify
- Immediate calendar event as proof

**User Flow:**
```
Describe Need -> Review Parsed Request -> See Matched Providers -> Launch Campaign
   -> Monitor Live Grid -> See Ranked Results -> Confirm Booking -> Calendar Sync -> Done!
```

---

### Stage 4: Post-Booking Success

**User Goal:** Feel confident the appointment is real and properly scheduled

**Actions:**
1. Receives confirmation notification with details
2. Sees calendar event with provider address and notes
3. Gets reminder notification (24h before)
4. Optionally rates the experience
5. System learns from this booking (reinforces preferences)

**Touchpoints:**
- Confirmation notification (in-app + optional email)
- Calendar app
- Push notifications
- Rating prompt (after 2nd successful booking, not the first)

**Emotions:** Relieved -> Satisfied -> Neutral (task complete)

**Behind the scenes:** System learns from this booking:
- User chose a morning slot -> reinforce "morning" preference
- User chose a $$ dentist -> reinforce "moderate budget" for healthcare
- Provider responded quickly -> boost provider's reliability score

**Pain Points:**
- Calendar event missing key details
- No way to verify appointment with provider
- Rating request feels intrusive (if shown too early)

**Opportunities:**
- Rich calendar events with address, phone, notes
- "Call to verify" button that connects to provider
- Rating prompt only after 2nd successful booking
- Show what the system learned: "Got it -- you prefer mornings!"

---

### Stage 5: Retention & Expansion

**User Goal:** Continue using Voit for all scheduling needs

**Actions:**
1. Returns when next appointment needed
2. Notices system remembers preferences ("Evening slots prioritized based on your history")
3. Tries different categories (restaurant, barber, auto repair)
4. Upgrades to paid plan for more parallel calls
5. Invites family members (Pro plan, P2)

**Touchpoints:**
- Dashboard home screen
- "Book Again" quick action
- Category exploration
- Upgrade prompts
- Feature discovery tooltips

**Emotions:** Comfortable -> Power user -> Loyal

**Pain Points:**
- Free plan limits feel restrictive
- Unclear upgrade benefits
- Feature overload for simple users

**Opportunities:**
- Usage-based upgrade prompts (not time-based)
- Clear feature comparison matrix
- Progressive feature disclosure
- Show time saved: "You've saved 3.5 hours this month with Voit"

---

## Journey 2: Power User - Multi-Provider Campaign

### Stage 1: Campaign Planning

**User Goal:** Schedule multiple related appointments efficiently

**Actions:**
1. Types: *"I need to schedule my quarterly checkup -- endocrinologist, cardiologist, and ophthalmologist, all within 2 weeks"*
2. System parses: 3 appointment types, enriches with user's location and known insurance
3. System discovers providers for each specialty: 5 endocrinologists, 4 cardiologists, 6 ophthalmologists
4. User reviews and adjusts provider lists if needed
5. Configures: "Try to cluster appointments on the same day or consecutive days"
6. Clicks "Start Search"

**Touchpoints:**
- Multi-appointment input
- Provider discovery results (grouped by specialty)
- Time configuration
- Clustering preferences

**Emotions:** Strategic -> Confident -> In control

**Pain Points:**
- Complex request -- will the system understand it?
- Worried about double-booking across specialties
- Not sure which providers to prioritize
- Unclear how time clustering works

**Opportunities:**
- Show parsed intent clearly: "I understood 3 appointments..."
- Visual timeline showing proposed schedule
- Auto-detect calendar conflict risks
- Historical success rates shown per provider
- "Routine checkup" template for returning users

**User Flow:**
```
Describe Multi-Appointment Need -> Review Parsed Request -> See Discovered Providers (grouped)
   -> Configure Time Preferences -> Launch Campaign
```

---

### Stage 2: Parallel Execution

**User Goal:** Monitor multiple simultaneous calls efficiently

**Actions:**
1. Campaign launches -- up to 10 parallel calls across specialties
2. Views grid dashboard showing all agents
3. Prioritizes attention on most promising calls
4. Sends instruction to one agent: "Ask about Dr. Patel specifically"
5. Receives first confirmation (cardiologist)
6. Remaining cardiology calls auto-pause; other specialties continue
7. Second confirmation (endocrinologist)
8. Campaign continues for ophthalmologist

**Touchpoints:**
- Grid monitoring dashboard
- Individual agent cards with live transcripts
- Instruction input
- Notification toasts
- Auto-pause indicators
- Partial completion status

**Emotions:** Intense focus -> Excitement -> Victory (partial) -> Continued monitoring -> Full victory

**Pain Points:**
- Information overload with 10+ live transcripts
- Difficult to track which call needs attention
- Unclear when to intervene vs. trust the agent
- Fear of missing important moment in one call while watching another

**Opportunities:**
- AI-prioritized "Needs Attention" alert badges
- Summary view vs. detail view toggle
- Auto-mute less promising calls
- Smart grouping by specialty
- "Book Now" instant action when a great slot appears

---

### Stage 3: Coordination & Confirmation

**User Goal:** Ensure all appointments work together

**Actions:**
1. Reviews 2 confirmed appointments
2. Sees 1 specialty still calling (ophthalmologist)
3. Adjusts remaining search: "Try to find something near the cardiologist office"
4. Third appointment confirmed
5. Verifies no calendar conflicts
6. Reviews scoring breakdown for all 3
7. Confirms all bookings

**Touchpoints:**
- Campaign completion summary
- Calendar view with all appointments
- Scoring breakdown per booking
- Confirmation flow

**Emotions:** Satisfied -> Problem-solving -> Accomplished

**Pain Points:**
- No clear view of what succeeded vs. what's still pending
- Manual work to check geographic coordination
- Travel time not automatically considered

**Opportunities:**
- Campaign completion summary with clear status per specialty
- Travel time awareness in scheduling
- Map view showing appointment locations
- "All confirmed!" celebration moment

---

## Journey 3: Anxious User - First-Time with Override

### Stage 1: Hesitant Start

**User Goal:** Book appointment while staying in control

**Actions:**
1. Types request cautiously: *"Book me a therapy appointment, anywhere near me, anytime this week"*
2. Reviews matched providers -- glad they didn't have to find them manually
3. Reviews the confirmation preview for a long time
4. Hovers over "Start Search" button for 30+ seconds
5. Starts campaign with finger over "End Call" button
6. Watches transcript intensely

**Touchpoints:**
- Natural language input (low-pressure)
- Provider discovery results (system did the hard work)
- Start button
- Override controls (always visible)
- Transcript stream

**Emotions:** Anxious -> Relieved (didn't have to call anyone!) -> Nervous -> Stressed

**Pain Points:**
- Feeling loss of control
- Not sure what the AI will say
- No "undo" once calls start
- Override controls seem drastic

**Opportunities:**
- Low-pressure natural language input (no forms, no phone numbers)
- Provider discovery removes the burden of researching providers
- Preview what the agent will say (system prompt preview)
- "Test call" to practice number
- Softer override options ("send hint" vs. "take over")
- Visible "End Call" always available
- Reassurance: "You can stop this at any time"

---

### Stage 2: Crisis Moment

**User Goal:** Intervene when something seems wrong

**Actions:**
1. Sees unexpected question in transcript from provider
2. Panics -- clicks "Send Instruction"
3. Types instruction quickly: "Tell them I'm a new patient"
4. Sees pre-written suggestion: "I'm a new patient" -- clicks it instead
5. Watches agent smoothly incorporate instruction
6. Relaxes as call continues naturally

**Touchpoints:**
- Instruction input
- Pre-written quick instruction suggestions
- Agent acknowledgment in transcript
- Continued conversation

**Emotions:** Panic -> Anxious -> Surprised (it worked!) -> Relieved

**Pain Points:**
- Not sure what to type under pressure
- Worried instruction won't arrive in time
- Agent might sound weird incorporating it
- Heart rate elevated

**Opportunities:**
- Pre-written instruction suggestions (contextual to the conversation)
- Visual confirmation: "Instruction delivered -- agent will incorporate at next natural pause"
- Smooth incorporation language from agent
- Post-call debrief explaining what happened and why

---

### Stage 3: Trust Building

**User Goal:** Gain confidence for future bookings

**Actions:**
1. Call completes successfully -- appointment booked
2. Reviews transcript to see how the agent handled everything
3. Notices confidence score was 94% -- reassuring
4. Sees scoring breakdown explaining why this provider was recommended
5. Returns for second booking
6. Uses override controls less frequently
7. Eventually trusts the system fully

**Touchpoints:**
- Call transcript review
- Confidence score display
- Scoring explanation
- Return visit
- Progress acknowledgment

**Emotions:** Relieved -> Reflective -> Confident -> Trusting

**Pain Points:**
- Hard to find specific moment in transcript
- No explanation of why agent said what it said
- Still nervous on second call
- Progress not acknowledged

**Opportunities:**
- Searchable transcript with timestamps
- "Agent reasoning" explanation mode
- Progress tracking: "You've had 3 successful bookings!"
- Decreasing override prompts as trust builds
- "Your appointments are being handled" confidence messages

---

## Journey 4: Caregiver - Family Management

### Stage 1: Setup Multiple Profiles

**User Goal:** Manage appointments for multiple family members

**Actions:**
1. Upgrades to Pro plan
2. Creates profile for parent (Margaret, 72) with her location and insurance
3. Creates profile for teenager (Jake, 16) with his school address
4. Sets who can view/manage each profile

**Touchpoints:**
- Upgrade flow
- Family settings
- Profile creation (minimal: name, location, relevant preferences)
- Permission settings

**Emotions:** Hopeful -> Brief setup -> Organized

**Pain Points:**
- Lots of information to enter per person
- Confusing permission model
- Worried about mixing up appointments

**Opportunities:**
- Simplified permission presets ("Full access for me, view-only for spouse")
- Profile photos and color coding
- Clear "Booking for: [Name]" indicator everywhere
- Minimal required fields (just name and location -- preferences learned over time)

---

### Stage 2: Multi-Person Booking

**User Goal:** Schedule appointments for self and parent efficiently

**Actions:**
1. Switches to Margaret's profile
2. Types: *"Margaret needs a podiatrist appointment, mornings preferred, within 3 miles of her house"*
3. System discovers podiatrists near Margaret's location (not the caregiver's)
4. Launches campaign -- watches agents call
5. Books Margaret's appointment
6. Switches to own profile
7. Types: *"I need a haircut this Saturday afternoon"*
8. System discovers salons near caregiver's location
9. Books own appointment
10. Sees both appointments on shared family calendar

**Touchpoints:**
- Profile selector
- Natural language input (context-aware per profile)
- Separate campaign views
- Shared family calendar
- Notification routing

**Emotions:** Juggling -> Capable -> Accomplished

**Pain Points:**
- Switching between profiles is clunky
- Easy to accidentally book under wrong person
- Notifications overwhelming across profiles
- Calendar gets cluttered

**Opportunities:**
- Strong visual differentiation per family member (colors, avatars)
- "Booking for: Margaret" always visible and prominent
- Smart notification grouping
- Calendar with family member filters
- Location/preferences automatically adjust per profile

---

## Journey 5: Edge Case - Failed Booking Recovery

### Stage 1: Initial Failure

**User Goal:** Book appointment (will encounter failure)

**Actions:**
1. Types: *"Book me a table at a nice Italian restaurant this Friday evening for 2"*
2. System discovers 6 matching restaurants
3. Launches campaign -- agents start calling
4. 3 calls go to voicemail, 2 report no Friday availability, 1 still ringing
5. Campaign completes with 0 bookings -- all attempts failed

**Touchpoints:**
- Campaign dashboard showing mixed results
- Voicemail detection indicators
- "No Availability" status cards
- Recovery options prompt

**Emotions:** Hopeful -> Watching -> Disappointed -> "Now what?"

**Pain Points:**
- Feels like a complete failure
- Unclear if voicemail messages will get a response
- Doesn't know what to do next
- Wasted time

**Opportunities:**
- Frame as "in progress" not "failed" -- voicemails are pending callbacks
- Show voicemail transcript (what the agent said)
- Set expectation: "Restaurants often call back within 2 hours"
- Immediate recovery options

---

### Stage 2: Recovery Options

**User Goal:** Still get the appointment

**Actions:**
1. Reviews recovery options presented:
   - "Retry tomorrow morning (restaurants pick up more before lunch rush)"
   - "Expand search: 3 more Italian restaurants within 8 miles"
   - "Try different day: Saturday evening has better availability historically"
2. Selects "Expand search" -- system discovers 3 more restaurants
3. Launches mini-campaign with just the new providers
4. Gets a booking on the second attempt

**Touchpoints:**
- Recovery options panel (with recommended action highlighted)
- Expanded provider discovery
- Mini-campaign launch
- Success confirmation

**Emotions:** Problem-solving -> Proactive -> Eventually satisfied -> Relieved

**Pain Points:**
- Too many options, unclear best path
- Adding more providers feels like starting over
- Long total wait for resolution

**Opportunities:**
- "Recommended action" prominently displayed (based on time of day, category patterns)
- Smart retry timing based on provider category (restaurants vs. doctors)
- One-click "Expand search" that automatically finds more providers
- Persistent campaign state -- results from first attempt preserved
- Celebration: "Persistence paid off!"

---

## User Flow Diagrams

### Core Booking Flow
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│  Describe   │───>│   Confirm    │───>│  Discover   │───>│   Launch   │
│   Need      │    │   Intent     │    │  Providers  │    │  Campaign  │
│  (NL input) │    │  (parsed)    │    │  (auto)     │    │  (parallel)│
└─────────────┘    └──────────────┘    └─────────────┘    └────────────┘
                                                               │
                                         ┌─────────────────────┤
                                         ▼                     ▼
                                   ┌──────────┐         ┌──────────────┐
                                   │ Override │         │  Agents Call │
                                   │  (opt)   │         │  in Parallel │
                                   └──────────┘         └──────────────┘
                                         │                     │
                                         └──────────┬──────────┘
                                                    ▼
                                             ┌────────────┐
                                             │  Ranked    │
                                             │  Results   │
                                             └────────────┘
                                                    │
                                                    ▼
                                             ┌────────────┐
                                             │  Confirm   │
                                             │  Booking   │
                                             └────────────┘
                                                    │
                                                    ▼
                                             ┌────────────┐
                                             │  Calendar  │
                                             │   Sync     │
                                             └────────────┘
```

### Parallel Campaign Flow
```
┌─────────────────────────────────────────────────────────┐
│           PROVIDER DISCOVERY COMPLETE                    │
│     "Found 8 matching dentists. Ready to call?"         │
│                    [Start Search]                        │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Agent 1   │  │  Agent 2   │  │  Agent 3   │   ... (up to 10)
    │ Dr. Smith  │  │ CityMed    │  │ Dr. Park   │
    │ RINGING    │  │ CONFIRMED  │  │ ON_HOLD    │
    └────────────┘  └────────────┘  └────────────┘
           │         ┌─────┴─────┐         │
           │         ▼ CONFIRMED ▼         │
           │    ┌────────────────────┐     │
           │    │ Best result found! │     │
           │    │ Score: 95/100      │     │
           │    └────────────────────┘     │
           │               │               │
           │               ▼               │
           │    ┌────────────────────┐     │
           │    │  Continue others   │     │
           │    │  (may find better) │     │
           │    └────────────────────┘     │
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                 ┌───────────────────┐
                 │ Campaign Complete │
                 │ Show Ranked Results│
                 └───────────────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ User Picks Best   │
                 │ Slot & Confirms   │
                 └───────────────────┘
```

### Recovery Flow
```
┌──────────────────┐
│ Campaign Complete │
│ No Bookings Found │
└──────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│         RECOVERY OPTIONS             │
│     ★ Recommended: Expand Search     │
├──────────────┬───────────┬───────────┤
│ Auto-Retry   │ Expand    │  Try      │
│ Tomorrow     │ Search    │  Different│
│ Morning      │ Radius    │  Day      │
└──────────────┴───────────┴───────────┘
       │              │            │
       ▼              ▼            ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ Schedule │   │ Discover │   │ New     │
  │ Retry    │   │ More     │   │ Request │
  └─────────┘   │ Providers│   └─────────┘
                └─────────┘
       │              │            │
       └──────────────┼────────────┘
                      ▼
              ┌───────────────┐
              │ New Campaign  │
              │ -> Booking!   │
              └───────────────┘
```

---

## Edge Cases & Error States

### E1: Provider Disconnects Mid-Call
**Situation:** Provider hangs up unexpectedly during booking conversation  
**User Experience:**
- Call status changes to "Disconnected"
- Transcript shows final exchange
- Options: Retry immediately, retry later, skip this provider  
**Recovery:** One-click retry with context "continuing our previous call"

### E2: User Loses Internet During Live Campaign
**Situation:** Dashboard disconnects but calls continue  
**User Experience:**
- Reconnect banner appears
- Calls continue (agents don't know user lost view)
- On reconnect, full state populates from Convex (real-time catch-up)  
**Prevention:** All state persisted in Convex -- nothing lost

### E3: Wrong Number / Not a Provider
**Situation:** Phone number in database is incorrect or personal line  
**User Experience:**
- Agent detects confusion ("This is a residence")
- Agent politely ends call
- Call marked as "Wrong Number" with low confidence  
**Recovery:** Provider flagged in database; suggest trying next match

### E4: Provider Asks to Call Back
**Situation:** Office says "Can I call you back?"  
**User Experience:**
- Agent provides callback number (Twilio number configured in ElevenLabs)
- Campaign enters "awaiting callback" state for this provider
- Callback auto-handled when received  
**Handling:** 24-hour callback window, then fallback to retry

### E5: Language Barrier
**Situation:** Provider speaks different language than expected  
**User Experience:**
- Agent detects language mismatch (ElevenLabs Language Detection)
- Attempts language switch (31 languages supported)
- If unable, ends politely  
**Recovery:** Suggest updating search to language-specific providers

### E6: All Providers Unavailable
**Situation:** Every call results in no availability or failure  
**User Experience:**
- Campaign shows all results as failed/no-availability
- Recovery panel appears immediately
- Suggested actions based on failure pattern  
**Recovery:** Expand search radius, try different date, or schedule retry

---

## Accessibility Considerations

### Visual Accessibility
- All status indicators have text labels, not just color
- Transcript font size adjustable
- High contrast mode available
- Screen reader announces all status changes (aria-live regions)

### Motor Accessibility
- Full keyboard navigation through all flows
- Large click targets (44x44px minimum)
- Override controls accessible without precision
- Voice input for natural language request (future)

### Cognitive Accessibility
- Simple, consistent language throughout
- Progress indicators show where user is in flow
- Natural language input removes form complexity
- Provider discovery removes research burden
- Help tooltips explain complex concepts

### Hearing Accessibility
- Live transcript eliminates need to hear calls
- Visual notifications for all audio alerts
- Closed captions on all tutorial videos

---

## Mobile vs Desktop Differences

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Agent grid (parallel calls) | 2x2 grid | Stacked cards with swipe |
| Transcript viewing | Side panel | Full screen overlay |
| Override controls | Always visible | Sticky bottom bar |
| Natural language input | Text field with templates | Text field + voice input |
| Results display | Side-by-side comparison | Stacked cards |
| Calendar integration | OAuth flow | Deep link to calendar app |

---

## Emotional Design Touchpoints

### Celebration Moments
- First successful booking: Confetti animation, "Your first booking -- done!"
- Time saved milestone: "You've saved 2 hours this month with Voit"
- Multi-booking success: "All 3 appointments confirmed!"

### Reassurance Moments
- Pre-campaign: "Found 8 matching providers -- you're in good hands"
- During calls: "You can pause or stop at any time"
- Low confidence: "We're not 100% sure about this one -- please verify the details"
- Post-call: "Transcript available if you want to review what happened"

### Recovery Moments
- After failure: "30% of first calls go to voicemail -- that's normal. Here's what we do next..."
- After retry success: "Persistence paid off!"
- No availability: "Let's try a wider search -- more options, more chances"

### Trust-Building Moments
- Show what the system learned: "Based on your bookings, you prefer mornings -- searching accordingly"
- Transparent scoring: "Here's exactly why we recommend this option"
- Confidence display: "94% confident this booking is correct"

---

## Journey Success Metrics

| Journey | Key Metric | Target |
|---------|------------|--------|
| First-Time User | Time to first booking | <10 min |
| First-Time User | Onboarding completion | >90% (it's only 2 steps) |
| First-Time User | Provider discovery satisfaction | >85% relevant matches |
| Power User | Campaigns per session | >2 |
| Power User | Parallel call usage | >50% of campaigns |
| Anxious User | Override frequency | Decreasing over time |
| Anxious User | Return rate after first booking | >70% |
| Caregiver | Profiles created | 2+ per family account |
| Caregiver | Cross-profile bookings | >30% of campaigns |
| Recovery | Retry success rate | >60% on second attempt |

---

*End of User Journey Documentation*
