# AI Persona Library — Product Architecture

## Tier Model

### FREE
- Static profile: bio, MBTI, traits, 3 personality dimensions
- 3 thinking frameworks (titles only, descriptions locked)
- Top 3 skills (no descriptions)
- 2 accomplishments
- Quick AI prompt (≤280 chars)
- No news feed
- No relationship graph
- No changelog / version history

### PRO ($9/mo or $79/yr)
- Full personality radar + all dimensions
- All thinking frameworks with how-to-apply + real examples
- All skills with full descriptions + category breakdown
- Full accomplishments timeline with impact ratings
- Live news feed (updated weekly via pipeline)
- Relationship graph (allies, rivals, mentors, mentees)
- Full AI system prompt (versioned, with changelog diffs)
- Vocabulary patterns + signature phrases
- Working style, leadership style, team dynamics
- Recommended resources
- Blind spots & weaknesses
- "What would X do?" quick-ask panel
- Prompt changelog (see how the persona evolved over time)
- Export prompt as .txt / .md / .json

## Data Freshness System

Each persona has a `lastUpdated` timestamp and a `freshnessScore` (0–100).
- 🟢 LIVE (updated within 7 days)
- 🟡 RECENT (updated within 30 days)
- 🟠 STALE (updated within 90 days)
- 🔴 OUTDATED (>90 days)

Pro users see the freshness indicator on every section.
Free users see a blurred "Last updated X days ago — Upgrade to see latest" teaser.

## Relationship Schema

Each persona has a `relationships` array:
```ts
interface Relationship {
  personaId: string;       // links to another persona in the library
  type: "Ally" | "Rival" | "Mentor" | "Mentee" | "Partner" | "Critic";
  description: string;     // 1-2 sentence summary of the relationship
  strength: number;        // 0–100
  since: string;           // year or period
  status: "Active" | "Historical" | "Complicated";
}
```

### Current Relationships
- Ellison ↔ Musk: Ally (board, OCI partnership, personal friendship) — strength 85
- Ellison ↔ Trump: Ally (political alignment, Mar-a-Lago relationship) — strength 60
- Musk ↔ Trump: Ally (DOGE, political support) — strength 90
- Musk → Ellison: Mentor dynamic (Ellison is older, more experienced in enterprise) — strength 70

## Vibe Coder Engagement Hooks

1. **"What changed this week"** — weekly diff of persona updates, shown on home page
2. **Prompt Changelog** — versioned system prompts with diffs (like a git log for personas)
3. **"Build with this persona"** — curated prompts for specific use cases (code review, product decisions, negotiation)
4. **Relationship context prompts** — "How would Ellison respond to Musk's DOGE initiative?"
5. **Copy as JSON** — export full persona as structured JSON for use in agent frameworks
6. **Freshness badge** — shows when data was last updated, creates urgency to upgrade
7. **"Recently updated"** sort filter on home page
