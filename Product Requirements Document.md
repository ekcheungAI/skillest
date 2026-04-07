# Product Requirements Document
## AI Persona Library

**Version:** 1.0  
**Date:** April 7, 2026  
**Author:** Manus AI  
**Status:** Living Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Vision](#4-product-vision)
5. [Success Metrics](#5-success-metrics)
6. [Current State (Phase 1 — MVP)](#6-current-state-phase-1--mvp)
7. [Feature Requirements](#7-feature-requirements)
8. [Persona Data Model](#8-persona-data-model)
9. [Rarity System](#9-rarity-system)
10. [Design System](#10-design-system)
11. [Phase Roadmap](#11-phase-roadmap)
12. [Technical Architecture](#12-technical-architecture)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Open Questions & Decisions](#14-open-questions--decisions)
15. [Out of Scope](#15-out-of-scope)

---

## 1. Executive Summary

The **AI Persona Library** is a curated, card-game-style web application that transforms famous people's thinking styles, working habits, and behavioral patterns into ready-to-use AI system prompts. A user who wants their LLM agent to negotiate like Li Ka-shing, direct like Wong Kar-wai, or engineer like Elon Musk can browse the library, read a deep-research profile, and copy a battle-tested system prompt in one click.

The product sits at the intersection of two growing behaviors: the proliferation of personal AI agents (ChatGPT, Claude, Cursor, etc.) and the desire to make those agents feel distinctly purposeful rather than generic. The library is the "character pack" for the AI era — a collectible, browsable, stackable set of cognitive archetypes.

The current MVP is a fully functional static React application with 16 personas across 6 categories, a Persona Match quiz, and a stack builder for composite prompts. This PRD covers the full product vision across three phases.

---

## 2. Problem Statement

### The Core Problem

When a knowledge worker wants to use an LLM agent for a specific task — negotiating a deal, writing a pitch deck, debugging an architecture — they face a fundamental configuration problem. The default "helpful assistant" persona is too generic to be useful for high-stakes, stylistically demanding work. Writing a good system prompt requires both deep knowledge of the target persona's behavioral patterns and significant prompt engineering skill. Most users have neither.

### The Gap in Existing Solutions

| Existing Approach | Limitation |
|---|---|
| Generic system prompts ("Act like a CEO") | No behavioral depth; agent reverts to generic patterns under pressure |
| Reddit/GitHub prompt collections | Unverified, inconsistent quality, no behavioral research backing |
| Prompt marketplaces (PromptBase, etc.) | Transactional, no discovery layer, no persona comparison |
| AI character apps (Character.AI, etc.) | Entertainment-focused; not designed for professional agent configuration |

### Why This Matters Now

The market for AI agent configuration is nascent but accelerating. As LLM context windows grow and agent frameworks mature (LangChain, AutoGen, CrewAI), the bottleneck is shifting from "can the model do this?" to "does the model have the right behavioral configuration to do this well?" The AI Persona Library addresses this bottleneck directly.

---

## 3. Target Users

### Primary: The Vibe Coder

A developer or technical founder who builds with AI tools daily — Cursor, Claude, ChatGPT, Replit. They want their coding agent to think like a specific engineering archetype (first-principles, systems-level, pragmatic). They are comfortable with system prompts but do not want to spend hours researching and writing them. They value depth, authenticity, and the "collector" feeling of assembling a team of AI personas.

**Behavioral signals:** Uses Cursor or Claude daily. Has experimented with custom GPTs. Follows AI Twitter/X. Interested in productivity and "second brain" tools.

### Secondary: The AI-Curious Professional

A non-technical knowledge worker — consultant, product manager, writer, investor — who uses ChatGPT or Claude for work but has never written a system prompt. They want to improve the quality of their AI interactions but do not know where to start. The Persona Match quiz is specifically designed for this user: it meets them where they are (describing their own working style) and gives them a concrete recommendation.

**Behavioral signals:** Uses ChatGPT Plus. Reads newsletters about AI productivity. Does not identify as a developer.

### Tertiary: The Researcher / Educator

Someone studying leadership styles, cognitive archetypes, or decision-making frameworks. The library's depth of behavioral research — thinking frameworks, vocabulary patterns, relationship networks — makes it a useful reference even without the AI prompt use case.

---

## 4. Product Vision

> **"The character pack for the AI era."**

The AI Persona Library should feel like discovering a rare trading card collection that also happens to make your AI agent dramatically better. Every persona should feel **earned** — backed by real research, not generated filler. Every prompt should feel **behavioral** — encoding how the person thinks, not just what they are known for.

### Design Philosophy

The product deliberately adopts a **premium card game aesthetic** (Magic: The Gathering meets Bloomberg Terminal). This is not arbitrary — it encodes the product's core value proposition: these personas are collectible, tiered by rarity, and combinable into stacks. The visual language primes users to think of personas as assets to collect and deploy, not just text to copy.

### What the Product Is NOT

The library is not a chatbot, not a social network, not a content feed, and not an entertainment product. It is a **professional configuration tool** with a collector's interface. Every design and feature decision should be evaluated against this definition.

---

## 5. Success Metrics

### Phase 1 (Static MVP — Current)

| Metric | Target | Measurement Method |
|---|---|---|
| Persona prompt copies | 500 copies/month | Copy button click events (manual tracking or analytics) |
| Persona Match completions | 200 completions/month | Quiz completion rate |
| Average session duration | > 3 minutes | Analytics |
| Return visit rate | > 25% | Analytics |
| Stack builder usage | > 15% of sessions | Stack tray open events |

### Phase 2 (Research Pipeline)

| Metric | Target |
|---|---|
| Persona library size | 50+ personas |
| News freshness | < 7 days for all LIVE personas |
| Prompt copy-to-share ratio | > 10% (users share prompts they copy) |
| Organic search traffic | 1,000 sessions/month from persona name searches |

### Phase 3 (Agent Connection)

| Metric | Target |
|---|---|
| Registered users | 5,000 |
| Saved persona stacks | 2,000 |
| Weekly active users | 1,500 |
| Prompt version adoption rate | > 60% of users on latest prompt version within 2 weeks |

---

## 6. Current State (Phase 1 — MVP)

The MVP is a fully deployed static React application. The following features are live and functional.

### Live Features

**Persona Library (Home Page)**
The home page presents all 16 personas in a 3-column card grid. Each card shows the persona's cover (rarity-colored gradient), avatar (photo or initials fallback), name (with native Chinese name for relevant personas), title, rarity badge, thinking archetype tag, top personality dimension score, and an "Add to Stack" button. A left sidebar provides category and region filters. A search bar filters in real time across name, title, bio, and traits.

**Persona Detail Page**
Each persona has a full-page profile with six tabs:
1. **Thinking Style** — personality dimension bars, decision-making style, problem-solving approach, and an accordion of named thinking frameworks with real examples
2. **Working Style** — leadership style, communication style, team dynamics, and vocabulary patterns (signature phrases with context)
3. **AI Prompts** — short prompt, full behavioral system prompt (500–1,000 words), use-case prompts for specific scenarios, and a prompt changelog with version history
4. **Overview** — full biography, accomplishments timeline, and recommended resources
5. **News** — recent news items with sentiment badges (Positive/Neutral/Negative) and source links
6. **Network** — relationship graph showing connections to other personas and key figures

**Stack Builder**
A persistent bottom tray allows users to add up to 4 personas to a "stack." Clicking "Generate Stack Prompt" opens a modal with a composite system prompt that synthesizes the selected personas' behavioral rules. The composite prompt is copyable with one click.

**Persona Match Quiz**
A 3-step flow: intro (choose quiz or free-text mode), 6-question assessment mapping to personality dimensions, and a results page showing the user's profile radar chart, ranked persona matches with compatibility scores, and a recommended 2-persona stack with composite prompt. Matching uses a complementarity algorithm — it finds personas that fill the user's lowest-scoring dimensions, not those most similar to the user.

### Current Persona Roster (16 Personas)

| Persona | Category | Rarity | Native Name |
|---|---|---|---|
| Larry Ellison | Tech, Business | RR | — |
| Elon Musk | Tech, Business | RRR | — |
| Donald Trump | Politics, Business | RR | — |
| Li Ka-shing | Business, Finance | RR | 李嘉誠 |
| Jack Ma | Business, Entrepreneurship | RR | 馬雲 |
| Dr. Philipp Herzig | Tech | R | — |
| Gustav Söderström | Tech | R | — |
| Lars Reger | Tech | R | — |
| Dr. Sabine Klauke | Tech | R | — |
| Erik Ekudden | Tech | R | — |
| Tsui Hark | Film | RR | 徐克 |
| Peter Chan Ho-sun | Film | R | 陳可辛 |
| Johnnie To Kei-fung | Film | RR | 杜琪峯 |
| Wong Kar-wai | Film | RRR | 王家衛 |
| John Woo Yü-sen | Film | RR | 吳宇森 |
| Stephen Chow Sing-chi | Film | RRR | 周星馳 |

### Known Issues (Phase 1)

The following issues are documented and prioritized for immediate resolution:

1. **Home page mobile layout** — the sidebar does not collapse on small screens; the card grid does not reduce to a single column on mobile.
2. **Stack tray on mobile** — the fixed bottom tray has no tap-to-expand interaction; it is difficult to use on small screens.
3. **Native names on detail page** — the `nativeName` field is populated in the data but not rendered in the PersonaDetail hero section.
4. **Persona photos** — all 16 personas use the initials fallback; no real headshots are uploaded.
5. **Rarity manual override** — rarity is computed from personality dimension averages, which does not always reflect editorial intent (e.g., Elon Musk and Wong Kar-wai should be RRR by editorial decision, not just by score average).

---

## 7. Feature Requirements

### 7.1 Core Library (P0 — Must Have)

**F-001: Persona Card Grid**
The home page must display all personas in a responsive card grid. Each card must show: cover image (rarity-colored gradient), avatar (photo or initials), name, native name (if applicable), title, rarity badge, thinking archetype tag, and top personality dimension with score. Cards must be filterable by category, region, and rarity tier. Cards must be sortable by name, freshness, and rarity.

**F-002: Persona Detail Page**
Each persona must have a dedicated URL (`/persona/:id`) with a full profile. The profile must include all six tabs described in Section 6. The AI Prompts tab must include a one-click copy button for both the short and full prompts. The page must be fully accessible without login.

**F-003: One-Click Prompt Copy**
Every copyable prompt must have a clearly labeled copy button. On click, the prompt text is copied to the clipboard and a toast notification confirms success. The button must work on all modern browsers including mobile Safari.

**F-004: Stack Builder**
Users must be able to add up to 4 personas to a stack from any page. The stack must persist across navigation within the session (not across page refreshes — no backend required in Phase 1). The composite prompt modal must synthesize the selected personas' behavioral rules into a coherent, non-redundant system prompt.

**F-005: Search and Filter**
The home page must support real-time text search across persona name, title, bio, and personality traits. Category and region filters must be combinable (AND logic). Active filters must be clearly indicated and individually dismissible.

### 7.2 Persona Match (P0 — Must Have)

**F-006: Quiz Mode**
A 6-question multiple-choice quiz that maps user answers to the 6 personality dimensions. Each question must have 4 answer options. Progress must be indicated. Users must be able to go back to previous questions.

**F-007: Free-Text Mode**
An alternative to the quiz where users describe their working style in natural language. In Phase 1, this is a placeholder that collects the text and shows a generic result. In Phase 2, it will be processed by an LLM to extract dimension scores.

**F-008: Match Results**
Results must show: the user's inferred personality profile as a radar chart, top 3 persona matches with compatibility percentage scores and explanations, a recommended 2-persona stack with composite prompt, and a one-click copy for the recommended stack prompt.

**F-009: Shareable Results URL** *(Phase 2)*
Quiz results must be encodable in a URL query string so users can share their match results without a backend. Format: `/match/results?r=3,2,1,4,2,3` where values are the user's dimension scores.

### 7.3 Content & Data (P1 — Should Have)

**F-010: Rarity Manual Override**
The `Persona` interface must support an optional `rarityOverride` field that takes precedence over the computed rarity. This allows editorial control over which personas are designated RRR without requiring score manipulation.

**F-011: Persona Comparison Page** *(Phase 2)*
A `/compare` route that accepts two persona IDs as query parameters and renders a side-by-side view of their personality radar charts, thinking frameworks, and working styles. Accessible from a "Compare" button on persona detail pages.

**F-012: Director's Cut Prompts** *(Film Category)*
Film persona profiles must include a second prompt variant labeled "Director's Cut" focused on creative direction, visual storytelling, and narrative structure — distinct from the general behavioral prompt. This is in addition to, not replacing, the standard AI prompt.

**F-013: Rarity Filter in Sidebar**
The sidebar must include a rarity tier filter (C / CC / R / RR / RRR) in addition to the existing category and region filters.

**F-014: Foil Shimmer Animation**
RR and RRR cards must display a subtle animated shimmer effect on the card cover, mimicking the holographic foil treatment of premium trading cards. The animation must be CSS-only (no JavaScript) and must respect `prefers-reduced-motion`.

### 7.4 Discovery & Engagement (P2 — Nice to Have)

**F-015: "You Might Also Like" Recommendations**
The persona detail page must show 2–3 related personas based on shared categories, overlapping thinking frameworks, or relationship network connections.

**F-016: Persona of the Week**
A featured persona slot in the hero banner that rotates weekly. The featured persona gets a larger card treatment and a brief editorial note explaining why they are featured.

**F-017: Prompt Version Notifications** *(Phase 3)*
Registered users who have copied a prompt receive an in-app notification when a new version of that prompt is published, with a diff showing what changed.

---

## 8. Persona Data Model

Each persona is a structured TypeScript object with 23+ fields organized into the following logical groups.

### 8.1 Identity Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | URL slug, e.g. `elon-musk` |
| `name` | `string` | Yes | Full English name |
| `nativeName` | `string` | No | Native script name (Chinese, etc.) |
| `title` | `string` | Yes | Current role or defining title |
| `shortBio` | `string` | Yes | 1–2 sentence summary for card view |
| `fullBio` | `string` | Yes | Full paragraph for detail page |
| `born` | `string` | Yes | Birth year and location |
| `nationality` | `string` | Yes | e.g. "Chinese-American" |
| `categories` | `PersonaCategory[]` | Yes | One or more category tags |
| `accentColor` | `string` | Yes | Hex color for UI accents |
| `image` | `string` | Yes | CDN URL or `""` for initials fallback |

### 8.2 Freshness Fields

The freshness system tracks how recently each persona's data was researched and updated. This is important for news items and relationship data, which decay in relevance faster than biographical data.

| Field | Type | Values |
|---|---|---|
| `freshnessStatus` | `enum` | `"LIVE"` / `"RECENT"` / `"STALE"` / `"OUTDATED"` |
| `lastUpdated` | `string` | ISO date, e.g. `"2025-01-15"` |
| `nextUpdateDue` | `string` | ISO date |
| `dataSourceCount` | `number` | Number of sources consulted |

### 8.3 Personality Dimensions

Each persona has exactly 6 personality dimensions scored 0–100. These scores drive both the radar chart visualization and the rarity computation (unless overridden).

The 6 standard dimensions are: **First-Principles Thinking**, **Risk Tolerance**, **Technical Depth**, **Visionary Thinking**, **Communication Intensity**, and **Empathy**. Additional dimensions may be added for specific categories (e.g., "Visual Storytelling" for Film personas) but must not replace the 6 standard ones.

### 8.4 AI Prompt Fields

The AI prompt is the product's core deliverable. Each persona must have:

- **`aiPersonaPromptShort`** — A 2–3 sentence quick-install prompt for users who want minimal configuration.
- **`aiPersonaPrompt`** — A full behavioral system prompt of 500–1,000 words, structured with three mandatory sections:
  - `IDENTITY` — Who this person is and their core worldview
  - `SPEECH RHYTHM` — How they speak: sentence length, vocabulary register, rhetorical devices, characteristic phrases
  - `BEHAVIORAL RULES` — Explicit rules for how the agent behaves under pressure, what it refuses, how it handles disagreement, and what it prioritizes
- **`promptVersion`** — Semantic version string, e.g. `"2.1"`
- **`promptChangelog`** — Array of version objects documenting what changed and why

The behavioral rules section is what differentiates this product from generic persona prompts. It must encode not just style but **constraints and refusals** — what the persona would never say, never agree to, and how they respond when challenged.

### 8.5 Use-Case Prompts

Each persona must have 3–5 use-case prompts — specialized variants of the main prompt tailored to specific professional contexts. Examples: "Negotiate a deal," "Review a business plan," "Give feedback on creative work," "Debug an architecture decision."

---

## 9. Rarity System

The rarity system is the product's primary collectibility mechanic. It must feel editorially intentional, not algorithmically arbitrary.

### 9.1 Tier Definitions

| Tier | Label | Cover Color | Shimmer | Editorial Meaning |
|---|---|---|---|---|
| C | Common | Slate gray `#6B7280` | No | Influential in their domain; well-documented thinking style |
| CC | Uncommon | Steel blue `#2563EB` | No | Significant cross-domain impact; distinctive communication style |
| R | Rare | Deep purple `#7C3AED` | No | Industry-defining figure; highly distinctive behavioral patterns |
| RR | Double Rare | Amber gold `#B45309` | Yes | Era-defining figure; behavioral patterns widely studied and emulated |
| RRR | Ultra Rare | Crimson `#991B1B` | Yes | Civilizational or genre-defining impact; uniquely irreplicable thinking style |

### 9.2 Rarity Assignment Rules

Rarity should be assigned by editorial judgment using the following criteria as a guide, not a formula:

1. **Breadth of influence** — How many industries, decades, or geographies did this person shape?
2. **Uniqueness of thinking style** — How rare is this specific combination of cognitive traits? Could another person be substituted?
3. **Behavioral distinctiveness** — How much does the AI prompt change the agent's behavior compared to the default? A highly distinctive persona produces a more dramatically different agent.
4. **Cultural longevity** — Will this persona's thinking style still be relevant in 10 years?

The computed average of personality dimension scores serves as a **starting point** for rarity assignment, not the final determination. A `rarityOverride` field in the data model allows editors to set the final tier.

### 9.3 Current RRR Designations

By editorial judgment, the following personas are designated RRR regardless of computed score:

- **Elon Musk** — Simultaneous civilizational-scale impact across automotive, aerospace, energy, and social media; uniquely irreplicable risk tolerance and first-principles combination
- **Wong Kar-wai 王家衛** — Genre-defining auteur whose atmospheric, non-linear storytelling style is entirely inimitable; the only director whose visual and temporal grammar is immediately recognizable across cultures

---

## 10. Design System

### 10.1 Design Philosophy

The product adopts a **Premium Card Game Library** aesthetic — the visual language of a physical trading card collection (Magic: The Gathering, Pokémon) applied to a professional reference tool. This is a deliberate product decision: it encodes collectibility, rarity, and the idea that personas are assets to be assembled into a team.

The design deliberately avoids the "AI slop" aesthetic of purple gradients, uniform rounded corners, and Inter-only typography.

### 10.2 Typography

| Role | Font | Usage |
|---|---|---|
| Display | Fraunces (serif) | Hero headings, persona names, section titles |
| Body | Inter (sans-serif) | Body text, UI labels, stats, descriptions |
| Code | JetBrains Mono (monospace) | AI prompts, code blocks, version numbers |

### 10.3 Color Tokens

The color system uses OKLCH format for all CSS custom properties (required by Tailwind CSS 4).

- **Background:** Warm cream `#F7F6F2` — evokes aged paper, premium print materials
- **Card surface:** White with 4px colored left spine — the spine color encodes rarity
- **Text primary:** Near-black `#1A1A1A`
- **Text secondary:** Medium gray `#4B5563`

### 10.4 Card Anatomy

Each persona card has four visual zones:

1. **Cover** (top 40%) — Solid rarity-tier color with subtle geometric pattern overlay; contains the avatar (photo or initials in frosted-glass circle)
2. **Spine** (left 4px border) — Rarity color, visible on the card body below the cover
3. **Body** (bottom 60%) — White; contains name, title, rarity badge, archetype tag, top dimension score, and action buttons
4. **Shimmer** (RR/RRR only) — Animated diagonal highlight sweep across the cover, CSS-only

---

## 11. Phase Roadmap

### Phase 1: Static MVP (Current)

**Goal:** Validate product-market fit with a fully functional static site. No backend required. Focus on content depth and UX polish.

**Scope:** 16 personas, card library, detail pages, stack builder, Persona Match quiz. All content open access.

**Success condition:** 500 prompt copies per month, 3-minute average session, positive qualitative feedback from vibe coder community.

**Remaining work:**
- Fix mobile layout (home page sidebar, stack tray)
- Add rarity manual override
- Add rarity filter to sidebar
- Add foil shimmer animation for RR/RRR
- Display native names on detail page hero
- Upload real persona headshots

### Phase 2: Research Pipeline

**Goal:** Scale persona library to 50+ with automated research and weekly freshness updates. Introduce basic user accounts for saving stacks.

**Key additions:**
- Next.js App Router migration (SSR for SEO, persona name searches)
- Supabase Postgres backend with JSONB persona storage
- Firecrawl `/deep-research` integration for new persona onboarding
- Weekly cron: Firecrawl `/search` → Claude Sonnet synthesis → `recentNews[]` update
- Prompt versioning with diff-based changelog
- Shareable match results URL
- Persona comparison page (`/compare`)
- Copy event tracking (anonymous, no login required)
- Sanity CMS for non-technical persona editing

### Phase 3: Agent Connection

**Goal:** Connect the library to users' actual AI agent workflows. Enable saved stacks, prompt version notifications, and community-driven persona discovery.

**Key additions:**
- Manus OAuth user accounts
- Saved persona stacks (persisted to Supabase)
- Prompt version notifications for saved personas
- "Personas similar users found useful" recommendations
- API endpoint for programmatic prompt retrieval (for agent frameworks)
- Persona submission pipeline (community-contributed personas, editorial review)
- Steve Jobs, Warren Buffett, and other high-demand personas

---

## 12. Technical Architecture

### Phase 1 (Current)

```
Browser
  └── React 19 + TypeScript
        ├── Wouter (routing)
        ├── Tailwind CSS 4 (styling)
        ├── shadcn/ui (components)
        └── personas.ts (all data, static)
```

All data is hardcoded in `client/src/lib/personas.ts`. There is no API, no database, and no server-side rendering. The site is deployed as a static bundle.

### Phase 2 (Planned)

```
Browser
  └── Next.js App Router (SSR + static)
        ├── Supabase client (data fetching)
        └── Tailwind CSS 4 + shadcn/ui

Supabase
  ├── personas table (JSONB)
  ├── prompt_versions table
  └── copy_events table (anonymous analytics)

Research Pipeline (cron, weekly)
  ├── Firecrawl /search (news gathering)
  ├── Claude Sonnet (synthesis + prompt update)
  └── Supabase write (update recentNews[])
```

### Phase 3 (Planned)

```
Browser
  └── Next.js App Router
        ├── Manus OAuth (user sessions)
        └── Supabase client

Supabase
  ├── personas table
  ├── users table
  ├── saved_stacks table
  └── notification_queue table

API Layer
  └── /api/persona/:id/prompt (programmatic access)
```

---

## 13. Non-Functional Requirements

### Performance
- First Contentful Paint (FCP) must be under 1.5 seconds on a 4G connection for the home page.
- The persona detail page must load all 6 tabs' content synchronously (no lazy-loaded tab content) to enable instant tab switching.
- Card grid must render 50+ cards without visible jank (virtualization required at that scale).

### Accessibility
- All interactive elements must have visible focus rings.
- Color must not be the only means of conveying rarity information — the rarity badge text (C/CC/R/RR/RRR) must always be present.
- The copy button must have an accessible label that changes to "Copied!" on success.
- All animations must respect `prefers-reduced-motion`.

### Responsiveness
- The site must be fully functional on screens from 375px (iPhone SE) to 2560px (large desktop).
- The home page sidebar must collapse to a horizontal scrollable pill row on screens narrower than 768px.
- The persona detail tab bar must be horizontally scrollable on mobile.

### Content Integrity
- Every AI prompt must include all three mandatory sections: IDENTITY, SPEECH RHYTHM, BEHAVIORAL RULES.
- Every persona must have a minimum of 3 thinking frameworks, 3 vocabulary patterns, 3 accomplishments, and 3 news items.
- Prompt versions must be monotonically increasing (never decrease).

---

## 14. Open Questions & Decisions

| Question | Status | Notes |
|---|---|---|
| Should rarity be fully editorial or partially computed? | **Decision needed** | Recommendation: editorial override with computed fallback |
| What is the right maximum stack size? (Currently 4) | **Open** | 4 feels right for coherent composite prompts; 6+ becomes incoherent |
| Should the free-text Persona Match mode use an LLM in Phase 1? | **Deferred to Phase 2** | Phase 1 shows a generic result; Phase 2 adds LLM extraction |
| Should personas have a "verified" badge for research quality? | **Open** | Could differentiate deeply researched personas from placeholder-quality ones |
| What is the right update cadence for LIVE personas? | **Proposed: weekly** | News items older than 30 days should downgrade status from LIVE to RECENT |
| Should the library support user-submitted personas in Phase 3? | **Open** | High risk of quality degradation; requires editorial review pipeline |
| Should prompts be versioned per-model (GPT-4o vs Claude vs Gemini)? | **Deferred** | Model-specific tuning is high-value but high-effort; defer to Phase 3 |

---

## 15. Out of Scope

The following are explicitly out of scope for all three phases unless a separate PRD is written:

- **Real-time chat with personas** — This is a chatbot product, not a configuration tool. Character.AI and similar products already serve this use case.
- **Persona creation by end users** — User-generated content introduces quality control problems that undermine the library's core value proposition (depth and authenticity).
- **Monetization / paywalls** — The product is fully open access. Monetization strategy is deferred and will be addressed in a separate commercial PRD.
- **Mobile native apps** — The web experience is the product. Native apps add distribution complexity without proportional value at this stage.
- **Multi-language UI** — The product is English-first. Native names (Chinese characters) are displayed inline for relevant personas, but the UI itself is English only.
- **Real-time collaboration on stacks** — Stacks are single-user, session-scoped in Phase 1 and account-scoped in Phase 3. Real-time multiplayer stack building is not a use case.

---

*This PRD is a living document. It should be updated when significant product decisions are made, new phases are scoped, or user research changes the understanding of the target user.*
