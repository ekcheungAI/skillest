# AI Persona Library — Claude Code Handoff

> This file is the complete context document for continuing development of the **AI Persona Library** in Claude Code. Read this entire file before making any changes.

---

## What This Project Is

A **static React web app** that is a Wikipedia-depth library of famous people turned into actionable AI agent personas. Users can:

1. Browse a card-game-style library of 22 personas across multiple categories
2. Click any persona to read their full profile (thinking style, working style, skills, news, relationships, AI prompts)
3. Add personas to a "stack" and generate a composite AI system prompt
4. Take a "Persona Match" quiz to find the best AI agent stack for their own working style

The product is aimed at **vibe coders and AI agent builders** who want to install a famous person's thinking style into their LLM with one click.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Routing | Wouter 3.x (lightweight, no React Router) |
| Styling | Tailwind CSS 4 (OKLCH color tokens) |
| UI Components | shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |
| Toasts | Sonner |
| Charts | Recharts |
| Fonts | Fraunces (display) + Inter (body) + JetBrains Mono (code) |
| Build | Vite 8 + npm |

**This is a pure static frontend — no backend, no database, no API calls.** All data lives in `src/lib/personas.ts`.

---

## Project Structure

```
Skillist/
├── CLAUDE.md                              ← You are here
├── PRODUCT_ARCHITECTURE.md                ← Product vision and Phase 1/2 roadmap
├── package.json                           ← React 19 + Vite + npm dependencies
├── vite.config.ts                         ← Vite config with @ path alias
├── tsconfig.json / tsconfig.app.json
├── index.html                             ← Google Fonts: Fraunces, Inter, JetBrains Mono
└── src/
    ├── main.tsx
    ├── App.tsx                           ← Routes + ScrollToTop + ThemeProvider
    ├── index.css                         ← Global design tokens + Foil shimmer animation
    ├── vite-env.d.ts
    ├── lib/
    │   └── personas.ts                   ← 5 personas with full profiles + rarityOverride
    ├── pages/
    │   ├── Home.tsx                     ← Card grid + sidebar (rarity filter) + stack tray (mobile)
    │   ├── PersonaDetail.tsx            ← 6-tab profile + nativeName display
    │   ├── PersonaMatch.tsx
    │   └── NotFound.tsx
    ├── components/
    │   ├── PersonaCard.tsx
    │   ├── RelationshipGraph.tsx
    │   ├── ErrorBoundary.tsx
    │   └── ui/
    │       ├── sonner.tsx
    │       └── tooltip.tsx
    └── contexts/
        └── ThemeContext.tsx
```

> **Note:** All source files are in `src/`. The `@/` path alias points to `src/` (configured in `vite.config.ts`).

---

## Project Structure

```
persona-library/
├── CLAUDE.md                          ← You are here
├── PRODUCT_ARCHITECTURE.md            ← Product vision and Phase 1/2 roadmap
├── client/
│   ├── index.html                     ← Google Fonts: Fraunces, Inter, JetBrains Mono
│   └── src/
│       ├── App.tsx                    ← Routes + ScrollToTop + ThemeProvider
│       ├── index.css                  ← Global design tokens, animations, card styles
│       ├── lib/
│       │   └── personas.ts            ← ALL persona data (22 personas, full profiles)
│       ├── pages/
│       │   ├── Home.tsx               ← Library index: card grid + sidebar + stack tray
│       │   ├── PersonaDetail.tsx      ← Full persona profile page (6 tabs)
│       │   ├── PersonaMatch.tsx       ← Quiz + match results page
│       │   └── NotFound.tsx
│       └── components/
│           ├── PersonaCard.tsx        ← Card component (used in PersonaMatch results)
    │           └── RelationshipGraph.tsx  ← Network graph (used in PersonaDetail Network tab)
```

---

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `Home.tsx` | Library index — card grid, sidebar filters, stack tray |
| `/persona/:id` | `PersonaDetail.tsx` | Full persona profile page |
| `/match` | `PersonaMatch.tsx` | Persona Match quiz + results |
| `/404` | `NotFound.tsx` | 404 page |

---

## Design System

### Philosophy
**Premium Card Game Library** — feels like a physical trading card game (think Magic: The Gathering meets Bloomberg Terminal). Clean, editorial, not flashy.

### Colors
- Background: `#F7F6F2` (warm cream)
- Cards: white with 4px colored left spine
- Rarity-driven cover colors (see below)
- Text: `#1A1A1A` headings, `#4B5563` body

### Typography
- **Fraunces** — display headings, hero text, persona names
- **Inter** — body text, UI labels, stats
- **JetBrains Mono** — AI prompts, code blocks, version numbers

### Rarity System (Card Cover Colors)
The card cover background color is determined by rarity tier, NOT per-persona accent color:

| Tier | Label | Cover Color | Badge Style | Shine |
|---|---|---|---|---|
| C | Common | `#6B7280` (gray) | Gray badge | No |
| CC | Uncommon | `#2563EB` (blue) | Blue badge | No |
| R | Rare | `#7C3AED` (purple) | Purple badge | No |
| RR | Double Rare | `#B45309` (amber) | Amber badge | Yes |
| RRR | Ultra Rare | `#991B1B` (crimson) | Red badge | Yes |

Rarity is auto-computed from `personalityDimensions` average score:
- `< 60` → C, `60–74` → CC, `75–84` → R, `85–92` → RR, `≥ 93` → RRR

To override rarity manually, add a `rarity` field to the `Persona` interface and check it first in `getRarityKey()` in `Home.tsx`.

### Category Colors (Sidebar)
```
Tech: #0EA5E9 | Business: #F59E0B | Entrepreneurship: #8B5CF6
Finance: #10B981 | Politics: #EF4444 | Science: #06B6D4
Film: #EC4899 | Investing: #84CC16 | Philosophy: #A78BFA | Military: #6B7280
```

---

## Persona Data Schema

All personas live in `client/src/lib/personas.ts` as a typed array `personas: Persona[]`.

### Key Interface Fields

```typescript
interface Persona {
  // Identity
  id: string;                    // slug, used in URL: /persona/{id}
  name: string;                  // English name
  nativeName?: string;           // e.g. "馬雲", "李嘉誠", "王家衛"
  title: string;                 // Role/title line
  shortBio: string;              // 1-2 sentence summary for card
  fullBio: string;               // Full paragraph for detail page
  born: string;                  // e.g. "1944, Chaozhou, China"
  nationality: string;           // e.g. "Chinese-American"
  categories: PersonaCategory[]; // ["Tech", "Business"] etc.
  accentColor: string;           // hex, used for UI accents (NOT card cover)
  image: string;                 // URL or "" (falls back to initials)

  // Freshness
  freshnessStatus: "LIVE" | "RECENT" | "STALE" | "OUTDATED";
  lastUpdated: string;           // "2025-01-15"
  nextUpdateDue: string;
  dataSourceCount: number;

  // Personality
  personalityTraits: string[];
  personalityDimensions: PersonalityDimension[];  // 6 dimensions, 0-100
  mbtiType?: string;
  enneagramType?: string;

  // Skills
  keySkills: Skill[];            // { name, level: 0-100, description, category }

  // Thinking
  thinkingFrameworks: ThinkingFramework[];  // { name, description, howToApply, example }
  decisionMakingStyle: string;
  problemSolvingApproach: string;

  // Communication
  communicationStyle: string;
  vocabularyPatterns: VocabularyPattern[];  // { phrase, context, frequency }
  famousQuotes: string[];

  // Working Style
  workingStyle: string;
  leadershipStyle: string;
  teamDynamics: string;

  // Accomplishments
  accomplishments: Accomplishment[];  // { year, title, description, impact, tags }

  // News
  recentNews: NewsItem[];  // { date, headline, summary, source, sourceUrl, sentiment, tags }

  // Relationships
  relationships: Relationship[];  // { personaId, type, description, strength, since, status }

  // Resources
  recommendedResources: BookOrResource[];

  // Weaknesses
  weaknesses: string;
  blindSpots: string[];

  // AI Prompts
  aiPersonaPrompt: string;       // Full behavioral system prompt (500-1000 words)
  aiPersonaPromptShort: string;  // Quick 2-3 sentence prompt
  promptVersion: string;         // e.g. "2.1"
  promptChangelog: PromptVersion[];

  // Use-case prompts
  useCasePrompts: UseCasePrompt[];  // { title, icon, description, prompt, tags }
}
```

---

## Current Personas (22 loaded)

### Business / Tech (4)
| ID | Name | Category | Rarity |
|---|---|---|---|
| `larry-ellison` | Larry Ellison | Tech, Business | RR |
| `elon-musk` | Elon Musk | Tech, Business | RRR |
| `donald-trump` | Donald Trump | Politics, Business | RR |
| `li-ka-shing` | Li Ka-shing 李嘉誠 | Business, Finance | RR |

### Entrepreneurship (1)
| ID | Name | Category | Rarity |
|---|---|---|---|
| `jack-ma` | Jack Ma 馬雲 | Business, Entrepreneurship | RR |

### European Tech Leaders (1, 4 more pending research)
| ID | Name | Role |
|---|---|---|
| `erik-ekudden` | Erik Ekudden | CTO & SVP Technology, Ericsson |

### Hong Kong Film Directors (1, 5 more pending research)
| ID | Name | Native Name | Known For |
|---|---|---|---|
| `stephen-chow` | Stephen Chow | 周星馳 | Mo Lei Tau comedy, underdog narratives |

---

## Key Components

### Home.tsx (Library Index)
- **Left sidebar** (w-44, sticky): category filter pills with counts + region filter + sort
- **3-column card grid**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Bottom stack tray**: fixed bottom bar showing selected personas + composite prompt modal
- **Hero banner**: compact, includes "How to Use" steps on the right column
- **Search**: filters by name, title, bio, traits in real-time

### PersonaDetail.tsx (Profile Page)
6-tab layout with sticky tab bar:
1. **Thinking Style** — personality radar (stat bars), decision making, mental frameworks (accordion)
2. **Working Style** — leadership, communication, team dynamics, vocabulary patterns
3. **AI Prompts** — short prompt, full system prompt, use-case prompts, prompt changelog
4. **Overview** — full bio, accomplishments timeline, recommended resources
5. **News** — recent news items with sentiment badges
6. **Network** — relationship graph (RelationshipGraph component)

**Avatar fallback**: If `persona.image` is empty, renders initials (e.g. "EM" for Elon Musk) with a gradient background derived from `persona.accentColor`.

### PersonaMatch.tsx (Persona Match Feature)
3-step flow:
1. **Intro** — two mode cards: "Take the Quiz" or "Describe Your Style" (free text)
2. **Quiz** — 6 multiple-choice questions mapping to personality dimensions
3. **Results** — user profile radar chart + ranked persona matches with compatibility scores + recommended 2-persona stack + composite prompt

**Matching logic**: Complementarity score (not similarity). Finds personas that fill the user's lowest-scoring dimensions.

---

## Adding a New Persona

### Phase 1: Automated Research Pipeline

Before writing any persona content manually, **always run the research pipeline first**:

```bash
# Quick research (tweets only, fast)
npx tsx scripts/research/pipeline.ts <handle> --count=200

# Full research (tweets + web + deep research, uses API credits)
npx tsx scripts/research/pipeline.ts <handle> --count=500 --deep-research
```

The pipeline:
1. **TwitterAPI.io** — scrapes 500+ tweets with full metadata (engagement, day-of-week stats, vocabulary)
2. **Firecrawl** — deep-researches website, YouTube, Wikipedia, news
3. **Analysis** — extracts vocabulary patterns, day-of-week stats, top tweets, engagement metrics
4. **Output** — saves raw draft to `scripts/research/output/{handle}_draft.json`

Results are also displayed in the **Research tab** on each persona's detail page.

### Phase 2: Write Persona Content

1. Read the research draft at `scripts/research/output/{handle}_draft.json`
2. Add a new persona object to `src/lib/personas.ts`
3. Follow the `Persona` interface exactly — all fields required except `nativeName`, `mbtiType`, `enneagramType`
4. Copy real research data into persona fields:
   - `vocabularyPatterns` from `topVocabulary`
   - `decisionJournal` from notable tweets
   - `thinkingFrameworks` from methodology threads
   - `personalityTraits` from bio analysis
5. Set `image: ""` if no photo — initials fallback handles it
6. Set `categories` to valid `PersonaCategory` values
7. Set `rarityOverride` based on average `personalityDimensions` score
8. If adding a new category, add it to:
   - `PersonaCategory` type in `personas.ts`
   - `CATEGORY_CONFIG` in `Home.tsx`

### Research Data Display

The **Research tab** on `PersonaDetail` shows the raw collected data:
- Import pipeline output into `src/lib/research/{id}.json`
- Add entry to `src/lib/research-data.ts` → `researchDrafts` map
- Tab auto-appears when `researchDrafts[persona.id]` exists

### API Keys

Located in `.env`:
- `VITE_TWITTER_API_KEY` — TwitterAPI.io (for `scripts/research/` scripts)
- `VITE_FIRECRAWL_API_KEY` — Firecrawl (for scraping web content)

---

## Known Issues / TODO

- [x] **Rarity manual override**: `rarityOverride?: RarityKey` added to Persona interface; applied to Larry Ellison (RR), Erik Ekudden (R), Stephen Chow (RRR), Philipp Herzig (R), Gustav Söderström (R), Lars Reger (R), Sabine Klauke (R), Tsui Hark (RR), Peter Chan (R), Johnnie To (RR), Wong Kar-wai (RRR), John Woo (RR)
- [x] **Native Chinese names on detail page**: `nativeName` is now displayed in PersonaDetail hero section below English name
- [x] **Foil shimmer animation for RR/RRR**: CSS-only `card-shine` animation added to `index.css`, applied to CoverBackground component
- [x] **Rarity filter in sidebar**: Added to both desktop sidebar and mobile pill row
- [x] **Home page mobile layout**: Mobile filter section now shows category pills + rarity pills + region pills; 3-column grid already responsive
- [x] **Stack Tray mobile**: Added mobile bottom-sheet expand/collapse behavior with `mobileExpanded` state
- [ ] **Real persona photos**: all personas currently use initials fallback; upload headshots to CDN and set `image` field
- [x] **All 9 new personas added** (Apr 2026): Philipp Herzig, Gustav Söderström, Lars Reger, Sabine Klauke (European Tech), Tsui Hark, Peter Chan, Johnnie To, Wong Kar-wai, John Woo (HK Directors)
- [x] **UpgradeModal.tsx**: deleted (legacy component, unused, referenced non-existent TIER_FEATURES)
- [ ] **PersonaCard.tsx**: legacy component; PersonaMatch uses it for results cards (still functional)

---

## Product Roadmap (from PRODUCT_ARCHITECTURE.md)

### Phase 1 (Current — Static MVP)
- ✅ 22 persona cards with full profiles (4 athletes + 6 tech/business + 1 artist excluded + 9 new: European Tech + HK Directors)
- ✅ One-click copy system prompt
- ✅ Stack builder (composite prompt)
- ✅ Persona Match quiz
- ✅ Category + region + rarity filtering
- ✅ Rarity tier system

### Phase 2 (Next — Research Pipeline)
- Firecrawl `/deep-research` for new persona onboarding
- Weekly cron: Firecrawl `/search` → Claude Sonnet → update `recentNews[]`
- Supabase Postgres: `personas` table with JSONB columns
- Prompt versioning with diff-based changelog
- Next.js App Router migration for SSR + SEO
- Sanity CMS for non-technical persona editing

### Phase 3 (Future — Agent Connection)
- Users paste their existing agent system prompt
- Platform extracts working style dimensions automatically
- Shareable match results URL (`/match/results?r=3,2,1,4,2,3`)
- "Personas similar users found useful" recommendations
- Notification when a new persona matches a user's gap profile

---

## Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| No backend | Phase 1 is pure demand validation; static site loads instantly and can be published with one click |
| Rarity-based cover colors | Prevents rainbow chaos from 16 different accent colors; makes the card game metaphor coherent |
| Complementarity matching (not similarity) | Users don't want an AI that thinks like them — they want one that fills their gaps |
| Fraunces serif for headings | Distinctive, editorial feel that avoids the "AI slop" look of Inter-only interfaces |
| All content open (no paywall) | Removed paywall to maximize shareability and trust; monetization deferred to Phase 2 |
| `personas.ts` as single source of truth | Trivial to migrate to Supabase/Sanity later — just replace the import with an API call |

---

## Avatar Image Upload Process

When uploading real headshots for personas:

1. **Upload**: Use `manus-upload-file --webdev <image.jpg>` or manually upload to the configured CDN
2. **Recommended specs**: 400×400px, JPG or WebP, < 200KB
3. **Update**: Set `image: "<cdn_url>"` in the persona's `personas.ts` entry
4. **Fallback**: If `image` is empty or fails to load, the `PersonaAvatarThumb` component renders initials with a gradient background

Current status: all personas use `image: ""` (initials fallback). Real photos pending upload.

---

## Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# TypeScript check (run before committing)
npx tsc --noEmit

# Build for production
npm run build
```

---

## Important Notes for Claude Code

1. **Never touch `server/` directory** — it is a placeholder for static hosting compatibility; all logic is frontend-only
2. **All Tailwind colors must use OKLCH format** in `index.css` CSS variables (not HSL)
3. **Use `toast()` from `sonner`** for all notifications — do not add react-toastify or other toast libraries
4. **Use `Link` from `wouter`** for internal navigation — never nest `<a>` inside `<Link>`
5. **Images must be CDN URLs** — do not store images in `client/public/` or `client/src/assets/`; use `manus-upload-file --webdev` to get CDN URLs
6. **ScrollToTop is in App.tsx** — it fires on every route change via `useLocation` from wouter
7. **The `Persona` interface is the contract** — every new persona object must satisfy all required fields or TypeScript will error
8. **Rarity is computed, not stored** — `getRarityKey()` in `Home.tsx` derives the tier from `personalityDimensions` average; to override, add a `rarity` field to the interface
