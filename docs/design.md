# CallPilot - Design Specifications

**Document Version:** 1.0  
**Last Updated:** February 8, 2026  
**Status:** Draft  

---

## Overview

This document defines the user interface design specifications for CallPilot, including layout structures, component definitions, interaction patterns, and visual guidelines for the web application dashboard.

---

## Design Principles

### 1. Transparency First
Users must always understand what the AI is doing. Every action is visible, explainable, and controllable.

### 2. Control at All Times
Override capabilities are never more than one click away. Users feel empowered, not replaced.

### 3. Progressive Complexity
Simple by default, powerful when needed. Advanced features reveal progressively as users gain experience.

### 4. Real-Time Feedback
System state is always visible. Latency and uncertainty are clearly communicated.

### 5. Calm Urgency
Important moments are highlighted without inducing panic. Design supports focused attention.

---

## Information Architecture

```
CallPilot
├── Dashboard (Home)
│   ├── Quick Actions
│   ├── Active Campaigns
│   └── Recent Activity
├── Campaigns
│   ├── Create New
│   ├── Active List
│   ├── Completed List
│   └── Campaign Detail
├── Monitoring (Live)
│   ├── Single Call View
│   ├── Grid View (Multi-Agent)
│   └── Override Controls
├── Appointments
│   ├── Upcoming
│   ├── Past
│   └── Calendar Integration
├── Providers
│   ├── Provider List
│   ├── Add Provider
│   └── Provider Detail
├── History
│   ├── Call Recordings
│   ├── Transcripts
│   └── Export
├── Family (Pro)
│   ├── Profiles
│   └── Permissions
└── Settings
    ├── Account
    ├── Preferences
    ├── Integrations
    └── Billing
```

---

## Core Dashboard Layout

### Primary Layout Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TOP NAVIGATION                                │
│  [Logo] [Dashboard] [Campaigns] [Appointments] [Providers] [History]   │
│                                                    [Profile ▼] [?]     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    MAIN CONTENT AREA                            │  │
│  │                                                                 │  │
│  │   Contextual content based on navigation selection              │  │
│  │                                                                 │  │
│  │   - Dashboard: Quick actions + activity feed                    │  │
│  │   - Campaigns: List/detail views                                │  │
│  │   - Monitoring: Real-time call interface                        │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [Status Bar: Active calls indicator] [Version] [Support]              │
└────────────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop XL | ≥1440px | Full layout, expanded panels |
| Desktop | 1024-1439px | Standard layout |
| Tablet | 768-1023px | Collapsed nav, stacked panels |
| Mobile | <768px | Bottom nav, full-screen modals |

---

## Live Monitoring Interface (CX Chat Panel)

The monitoring interface is inspired by customer support platforms, providing a familiar pattern for watching AI conversations in real-time.

### Single Call View Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CALL MONITORING                              │
├───────────────────────────────────────┬─────────────────────────────┤
│                                       │                             │
│  ┌─────────────────────────────────┐  │  ┌───────────────────────┐  │
│  │                                 │  │  │   CALL INFO PANEL     │  │
│  │                                 │  │  │                       │  │
│  │     LIVE TRANSCRIPT            │  │  │  Provider: Dr. Smith  │  │
│  │                                 │  │  │  Phone: (555) 123-... │  │
│  │  [Agent] 🤖 Hello, I'm calling │  │  │  Status: 🟢 Connected  │  │
│  │  on behalf of Sarah Chen to... │  │  │  Duration: 2:34       │  │
│  │                                 │  │  │                       │  │
│  │  [Provider] 👤 Sure, what date │  │  │  Campaign: Annual...   │  │
│  │  are you looking for?          │  │  │  Attempt: 1 of 3      │  │
│  │                                 │  │  │                       │  │
│  │  [Agent] 🤖 Ideally sometime   │  │  ├───────────────────────┤  │
│  │  next week, Tuesday or Wed...  │  │  │  AVAILABLE SLOTS      │  │
│  │                                 │  │  │                       │  │
│  │  [Provider] 👤 Let me check... │  │  │  ○ Tue 10:00 AM       │  │
│  │                                 │  │  │  ○ Wed 2:30 PM        │  │
│  │  ┌───────────────────────────┐ │  │  │  ○ Thu 9:00 AM        │  │
│  │  │ 🎤 Agent speaking...      │ │  │  │                       │  │
│  │  └───────────────────────────┘ │  │  │  [User preference:    │  │
│  │                                 │  │  │   Morning preferred]  │  │
│  └─────────────────────────────────┘  │  └───────────────────────┘  │
│                                       │                             │
├───────────────────────────────────────┴─────────────────────────────┤
│                       CONTROL BAR                                   │
│                                                                     │
│  [🎧 Listen Live]  [💬 Send Instruction]  [🤚 Take Over]  [🛑 End] │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Multi-Agent Grid View (Parallel Calling)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PARALLEL CAMPAIGN MONITORING                           │
│  Campaign: "Q1 Checkup Scheduling"                     Progress: 2/4 ✓      │
├──────────────────────────────────┬──────────────────────────────────────────┤
│                                  │                                          │
│  ┌──────────────────────────┐   │  ┌──────────────────────────┐            │
│  │ 🟢 Agent 1               │   │  │ 🟢 Agent 2               │            │
│  │ Dr. Martinez (Primary)   │   │  │ City Lab Services        │            │
│  │ ─────────────────────────│   │  │ ─────────────────────────│            │
│  │ Status: NEGOTIATING      │   │  │ Status: ✅ CONFIRMED     │            │
│  │ Duration: 3:45           │   │  │ Duration: 2:12           │            │
│  │                          │   │  │                          │            │
│  │ "Let me check Wednesday" │   │  │ Booked: Mar 15, 8:00 AM  │            │
│  │                          │   │  │                          │            │
│  │ [View Full] [Override]   │   │  │ [View Details]           │            │
│  └──────────────────────────┘   │  └──────────────────────────┘            │
│                                  │                                          │
│  ┌──────────────────────────┐   │  ┌──────────────────────────┐            │
│  │ 🟡 Agent 3               │   │  │ ⏸️ Agent 4               │            │
│  │ Vision Care Center       │   │  │ Dental Associates        │            │
│  │ ─────────────────────────│   │  │ ─────────────────────────│            │
│  │ Status: ON HOLD          │   │  │ Status: PAUSED           │            │
│  │ Duration: 5:23           │   │  │ Duration: 0:00           │            │
│  │                          │   │  │                          │            │
│  │ 🎵 Hold music detected   │   │  │ Waiting for Lab confirm  │            │
│  │                          │   │  │                          │            │
│  │ [View Full] [End Call]   │   │  │ [Resume]                 │            │
│  └──────────────────────────┘   │  └──────────────────────────┘            │
│                                  │                                          │
├──────────────────────────────────┴──────────────────────────────────────────┤
│ Campaign Controls: [Pause All] [End Campaign] [Add Provider]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Status Grid (9 States)

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| DIALING | 🔵 Blue | 📞 | Initiating call |
| RINGING | 🔵 Blue | 🔔 | Waiting for answer |
| CONNECTED | 🟢 Green | 🟢 | Live conversation |
| NEGOTIATING | 🟢 Green | 💬 | Discussing availability |
| ON HOLD | 🟡 Yellow | ⏳ | Provider put on hold |
| CONFIRMED | ✅ Green | ✓ | Appointment booked |
| VOICEMAIL | 🟠 Orange | 📧 | Left/leaving message |
| FAILED | 🔴 Red | ✕ | Call unsuccessful |
| PAUSED | ⏸️ Gray | ⏸ | Waiting for trigger |

---

## Message Types in Transcript

### Visual Differentiation

```
┌────────────────────────────────────────────────────────────┐
│                    TRANSCRIPT PANEL                        │
│                                                            │
│  ┌─ Agent Message ─────────────────────────────────────┐  │
│  │ 🤖 Hello, I'm calling on behalf of Sarah Chen to   │  │
│  │    schedule an appointment with Dr. Martinez.       │  │
│  │                                          12:34:56   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ Provider Message ──────────────────────────────────┐  │
│  │ 👤 Sure, let me pull up the calendar. What dates    │  │
│  │    work best for her?                               │  │
│  │                                          12:35:02   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ System Event ──────────────────────────────────────┐  │
│  │ ⚙️ Tool called: check_calendar                      │  │
│  │    Found 3 available slots                          │  │
│  │                                          12:35:08   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ User Override ─────────────────────────────────────┐  │
│  │ 👆 User instruction: "Prefer Tuesday if available"  │  │
│  │                                          12:35:15   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ Confidence Alert ──────────────────────────────────┐  │
│  │ ⚠️ Low confidence: Agent unsure about insurance     │  │
│  │    question. Consider intervening.                  │  │
│  │                            [Send Instruction]       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Message Type Styling

| Type | Background | Border | Icon | Text Color |
|------|------------|--------|------|------------|
| Agent | `#EBF5FF` | `#3B82F6` | 🤖 | `#1E40AF` |
| Provider | `#F0FDF4` | `#22C55E` | 👤 | `#166534` |
| System | `#F5F5F5` | `#9CA3AF` | ⚙️ | `#4B5563` |
| User Override | `#FEF3C7` | `#F59E0B` | 👆 | `#92400E` |
| Confidence Alert | `#FEF2F2` | `#EF4444` | ⚠️ | `#991B1B` |
| Hallucination Warning | `#FDF4FF` | `#A855F7` | 🔮 | `#7E22CE` |

---

## Campaign Creation Flow

### Step 1: Describe Your Need

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREATE NEW CAMPAIGN                              │
│                                                                     │
│  Step 1 of 4: What appointment do you need?                         │
│  ○─────●─────○─────○                                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Describe what you need in your own words:                  │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ I need to schedule my annual physical exam with     │   │   │
│  │  │ Dr. Martinez. Ideally sometime next week, morning   │   │   │
│  │  │ preferred. I'll need about 45 minutes.              │   │   │
│  │  │                                                     │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  Quick templates:                                           │   │
│  │  [Annual Physical] [Follow-up Visit] [Specialist Consult]  │   │
│  │  [Lab Work] [Dental Cleaning] [Eye Exam]                   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                                           [Cancel]    [Next →]      │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2: Time Preferences

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREATE NEW CAMPAIGN                              │
│                                                                     │
│  Step 2 of 4: When works for you?                                   │
│  ●─────●─────○─────○                                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Preferred dates:                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  [📅] Mar 10 - Mar 14, 2026                         │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  Time of day:                                               │   │
│  │  [●] Morning (8am-12pm)    [ ] Anytime                      │   │
│  │  [ ] Afternoon (12pm-5pm)  [ ] After work (5pm+)            │   │
│  │                                                             │   │
│  │  Flexibility:                                               │   │
│  │  ○─────────●─────────○                                      │   │
│  │  Strict   Flexible    Very Flexible                         │   │
│  │  "Only my preferred times"  "Whatever's available"          │   │
│  │                                                             │   │
│  │  ☑️ Sync with my calendar (avoid conflicts)                 │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                                 [← Back]    [Cancel]    [Next →]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 3: Select Providers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREATE NEW CAMPAIGN                              │
│                                                                     │
│  Step 3 of 4: Who should we call?                                   │
│  ●─────●─────●─────○                                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Select providers (multiple = parallel calling):            │   │
│  │                                                             │   │
│  │  [🔍 Search providers...]                                   │   │
│  │                                                             │   │
│  │  Your Providers:                                            │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ [✓] Dr. Maria Martinez - Primary Care               │   │   │
│  │  │     (555) 123-4567 • 95% success rate • ⭐ Favorite  │   │   │
│  │  ├─────────────────────────────────────────────────────┤   │   │
│  │  │ [ ] CityMed Walk-in Clinic                          │   │   │
│  │  │     (555) 987-6543 • 82% success rate               │   │   │
│  │  ├─────────────────────────────────────────────────────┤   │   │
│  │  │ [ ] Dr. James Park - Primary Care                   │   │   │
│  │  │     (555) 456-7890 • New provider                   │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  [+ Add New Provider]                                       │   │
│  │                                                             │   │
│  │  ℹ️ Tip: Select multiple providers to call simultaneously   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                                 [← Back]    [Cancel]    [Next →]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 4: Review & Launch

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREATE NEW CAMPAIGN                              │
│                                                                     │
│  Step 4 of 4: Review and launch                                     │
│  ●─────●─────●─────●                                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  📋 CAMPAIGN SUMMARY                                        │   │
│  │  ────────────────────────────────────────────────────────   │   │
│  │                                                             │   │
│  │  Appointment:   Annual physical examination                 │   │
│  │  Provider:      Dr. Maria Martinez                          │   │
│  │  Dates:         Mar 10-14, 2026                             │   │
│  │  Time:          Morning preferred                           │   │
│  │  Duration:      ~45 minutes                                 │   │
│  │                                                             │   │
│  │  ────────────────────────────────────────────────────────   │   │
│  │                                                             │   │
│  │  📝 AGENT SCRIPT PREVIEW                          [Edit]    │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ "Hello, I'm calling on behalf of Sarah Chen to     │   │   │
│  │  │ schedule an annual physical examination. Are you   │   │   │
│  │  │ able to help me with that?..."                     │   │   │
│  │  │                                     [Show full →]   │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  🔊 [Preview Voice]                                         │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                [← Back]    [Save Draft]    [🚀 Start Calling]       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Library

### Buttons

```
┌─────────────────────────────────────────────────────────────┐
│ Primary Button (CTA)                                        │
│ ┌───────────────────────────┐                               │
│ │    🚀 Start Calling       │  Blue (#3B82F6), white text   │
│ └───────────────────────────┘                               │
│                                                             │
│ Secondary Button                                            │
│ ┌───────────────────────────┐                               │
│ │      Save Draft           │  White, blue border & text    │
│ └───────────────────────────┘                               │
│                                                             │
│ Danger Button                                               │
│ ┌───────────────────────────┐                               │
│ │    🛑 End Call            │  Red (#EF4444), white text    │
│ └───────────────────────────┘                               │
│                                                             │
│ Ghost Button                                                │
│ ┌───────────────────────────┐                               │
│ │      Cancel               │  Transparent, gray text       │
│ └───────────────────────────┘                               │
│                                                             │
│ Override Button (Special)                                   │
│ ┌───────────────────────────┐                               │
│ │  🤚 Take Over             │  Yellow bg, dark text, pulsing│
│ └───────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### Status Badges

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Active     [ 🟢 Connected ]     Green pill                 │
│  Pending    [ 🟡 On Hold    ]     Yellow pill               │
│  Success    [ ✅ Confirmed  ]     Green pill with check     │
│  Failed     [ 🔴 Failed     ]     Red pill                  │
│  Warning    [ ⚠️ Attention  ]     Orange pill               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cards

```
┌─────────────────────────────────────────────────────────────┐
│ Provider Card                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  🏥                                                     │ │
│ │  Dr. Maria Martinez                        ⭐ Favorite  │ │
│ │  Primary Care Physician                                 │ │
│ │  (555) 123-4567                                         │ │
│ │  ────────────────────────────────────────────────────── │ │
│ │  Last booked: 3 months ago  •  Success rate: 95%       │ │
│ │                                                         │ │
│ │  [Call Now]                          [Edit] [Delete]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Campaign Card                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [ 🟢 Active ]                                          │ │
│ │  Annual Physical                                        │ │
│ │  Dr. Martinez • Mar 10-14                               │ │
│ │  ────────────────────────────────────────────────────── │ │
│ │  ⏱️ 2:34 elapsed  •  1 of 1 calls                       │ │
│ │                                                         │ │
│ │  [View Live →]                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Forms

```
┌─────────────────────────────────────────────────────────────┐
│ Text Input                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Provider Name                                           │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Dr. Maria Martinez                                  │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ Enter the full name of the healthcare provider          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Phone Input (with validation)                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Phone Number                                            │ │
│ │ ┌──────┐ ┌────────────────────────────────────────────┐ │ │
│ │ │ +1 ▼ │ │ (555) 123-4567                           ✓ │ │ │
│ │ └──────┘ └────────────────────────────────────────────┘ │ │
│ │ ✓ Valid phone number format                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Textarea (expandable)                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Special Instructions                                    │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Ask about Dr. Martinez specifically if available.   │ │ │
│ │ │ I've been her patient for 5 years.                  │ │ │
│ │ │                                                     │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ 127/500 characters                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Trigger Points

### Trigger Categories

#### 1. User-Initiated Triggers

| Trigger | User Action | Agent Response |
|---------|-------------|----------------|
| New Booking | Clicks "Start Calling" | Initiates campaign |
| Quick Book | Clicks on favorite provider | Single call, no wizard |
| Reschedule | Clicks "Reschedule" on appointment | Calls provider with change request |
| Cancel | Clicks "Cancel Appointment" | Calls provider to cancel |
| Retry | Clicks "Try Again" after failure | Re-attempts with same parameters |

#### 2. System-Initiated Triggers

| Trigger | System Detection | Agent Response |
|---------|------------------|----------------|
| Voicemail Retry | 24h after voicemail left | Automatic retry call |
| Callback Received | Incoming call to Twilio number | Connect to user or handle autonomously |
| Appointment Reminder | 24h before appointment | Optional reminder call |
| Schedule Conflict | Calendar conflict detected | Reschedule call |
| Provider Hours | Provider opens for the day | Queue retry for previously failed |

#### 3. Confidence-Based Triggers

| Trigger | Confidence Level | Action |
|---------|------------------|--------|
| High Confidence (>90%) | Agent sure of response | Continue autonomously |
| Medium Confidence (70-90%) | Agent somewhat sure | Add to transcript with note |
| Low Confidence (<70%) | Agent unsure | Pause, notify user, suggest instruction |
| Hallucination Detected | Agent fabricated info | Alert user, roll back statement |

### Trigger UI Patterns

```
┌─────────────────────────────────────────────────────────────┐
│ CONFIDENCE ALERT IN TRANSCRIPT                             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ⚠️ LOW CONFIDENCE MOMENT                              │ │
│  │                                                       │ │
│  │ Agent is unsure how to respond to:                    │ │
│  │ "Do you have insurance information on file?"          │ │
│  │                                                       │ │
│  │ Agent's planned response:                             │ │
│  │ "I'm not sure, let me check with Sarah"               │ │
│  │                                                       │ │
│  │ [Let Agent Continue]   [Send Instruction]   [Take Over]│ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Override Control Interface

### Override Control Bar (Always Visible During Call)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       OVERRIDE CONTROLS                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │   [🎧 Listen Live]    Audio currently OFF                   │   │
│  │   ──────────────                                            │   │
│  │   Toggle to hear the call in real-time                      │   │
│  │                                                             │   │
│  │   [💬 Send Instruction]                                     │   │
│  │   ────────────────────                                      │   │
│  │   Type a message for the agent to incorporate               │   │
│  │                                                             │   │
│  │   [🤚 Take Over Call]                     [🛑 End Call]     │   │
│  │   ──────────────────                      ────────────      │   │
│  │   Transfer audio to your device           Terminate call    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Send Instruction Modal

```
┌─────────────────────────────────────────────────────────────┐
│                  SEND INSTRUCTION                           │
│                                                             │
│  Type an instruction for the agent:                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tell them I prefer the Tuesday appointment, and     │   │
│  │ that I can come earlier if needed.                  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Quick instructions:                                        │
│  [Accept this offer] [Decline, try different time]          │
│  [Ask about wait times] [Request specific doctor]           │
│                                                             │
│  ℹ️ Agent will smoothly incorporate this into the           │
│     conversation at the next natural pause.                 │
│                                                             │
│                              [Cancel]    [Send Instruction] │
└─────────────────────────────────────────────────────────────┘
```

### Take Over Confirmation

```
┌─────────────────────────────────────────────────────────────┐
│                  TAKE OVER CALL?                            │
│                                                             │
│  ⚠️ You are about to take control of this call.             │
│                                                             │
│  What will happen:                                          │
│  • Call audio will transfer to your device                  │
│  • Agent will introduce you ("I'm connecting you now")      │
│  • You'll speak directly with the provider                  │
│                                                             │
│  Requirements:                                              │
│  ✓ Microphone access enabled                                │
│  ✓ Audio output ready                                       │
│                                                             │
│                     [Cancel]    [Take Over Now]             │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Blue | `#3B82F6` | CTAs, links, agent messages |
| Primary Dark | `#1E40AF` | Headers, emphasis |
| Primary Light | `#EBF5FF` | Agent message backgrounds |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success Green | `#22C55E` | Confirmed, connected |
| Warning Yellow | `#F59E0B` | On hold, attention |
| Error Red | `#EF4444` | Failed, danger actions |
| Info Blue | `#3B82F6` | Information, progress |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Gray 900 | `#111827` | Primary text |
| Gray 600 | `#4B5563` | Secondary text |
| Gray 400 | `#9CA3AF` | Muted text, borders |
| Gray 100 | `#F3F4F6` | Backgrounds |
| White | `#FFFFFF` | Cards, panels |

---

## Typography

### Font Family

- **Primary:** Inter (Google Fonts)
- **Monospace:** JetBrains Mono (for transcripts)

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| H1 | 30px | 700 | 36px | Page titles |
| H2 | 24px | 600 | 32px | Section headers |
| H3 | 20px | 600 | 28px | Card titles |
| H4 | 16px | 600 | 24px | Subsection headers |
| Body | 16px | 400 | 24px | Primary text |
| Small | 14px | 400 | 20px | Secondary text |
| Caption | 12px | 400 | 16px | Labels, timestamps |
| Mono | 14px | 400 | 22px | Transcripts, code |

---

## Animation & Transitions

### Timing Functions

| Name | Easing | Duration | Usage |
|------|--------|----------|-------|
| Quick | ease-out | 150ms | Hover states, toggles |
| Normal | ease-in-out | 250ms | Modals, panels |
| Slow | ease-in-out | 400ms | Page transitions |

### Loading States

```
┌─────────────────────────────────────────────────────────────┐
│ Skeleton Loaders                                            │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                 │  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                     │  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Pulse animation: opacity 0.5 → 1.0 over 1.5s, infinite      │
└─────────────────────────────────────────────────────────────┘
```

### Call Status Animations

| Status | Animation |
|--------|-----------|
| Dialing | Ripple effect from phone icon |
| Ringing | Gentle pulse on card border |
| Connected | Green glow fade-in |
| Speaking | Audio waveform visualization |
| Listening | Muted waveform, awaiting input |
| Confirmed | Checkmark draw animation + confetti |

---

## Accessibility Specifications

### Focus States

- Focus ring: 2px blue outline with 2px offset
- Skip links: Hidden until focused
- Tab order: Logical flow top-to-bottom, left-to-right

### Color Contrast

- All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Status indicators never rely on color alone (always include icons/text)

### Screen Reader Considerations

- Live regions (`aria-live="polite"`) for transcript updates
- `aria-live="assertive"` for confidence alerts
- Descriptive button labels (not just "Submit")
- Status changes announced

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Enter/Space | Activate buttons, submit forms |
| Escape | Close modals, cancel actions |
| Arrow keys | Navigate within component groups |

---

## Responsive Design Details

### Mobile Monitoring (< 768px)

```
┌───────────────────────────────┐
│ ← Back    Dr. Martinez    ... │
├───────────────────────────────┤
│                               │
│   CALL STATUS                 │
│   🟢 Connected • 2:34         │
│                               │
├───────────────────────────────┤
│                               │
│  ┌─────────────────────────┐  │
│  │ Agent: Hello, I'm       │  │
│  │ calling on behalf of... │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │ Provider: Sure, what    │  │
│  │ date are you looking... │  │
│  └─────────────────────────┘  │
│                               │
│           ...                 │
│                               │
├───────────────────────────────┤
│                               │
│  [🎧 Listen] [💬 Msg] [🛑 End]│
│                               │
└───────────────────────────────┘
```

---

## Dark Mode (Future)

Reserved for future implementation. Design system includes dark mode tokens:

| Light Token | Dark Token |
|-------------|------------|
| `gray-100` | `gray-900` |
| `gray-900` | `gray-100` |
| `white` | `gray-800` |
| `blue-500` | `blue-400` |

---

*End of Design Specifications*
