# Distillation Plan — Warren Buffett

> Copy to `scripts/research/output/warren-buffett/PLAN.md` BEFORE spending API credits.
> Buffett's unique case: NO TWITTER. Replace Agent 3 (Social DNA) with Agent 3 (Shareholder Letters).

---

## Pre-flight qualification (kill-switch)

- [x] **Book-length or 60+ min adversarial source exists?** ✅ — The Snowball (Alice Schroeder, 624pp), Buffett: The Making of an American Capitalist (Roger Lowenstein), all shareholder letters (60 years, free at brk.com)
- [x] **≥2,000 public utterances across tweets / posts / interviews?** ✅ — 60 annual shareholder letters (~200 pages each = ~12,000 pages), 50+ annual meetings, dozens of interviews
- [x] **At least one documented contradiction between stated values and behavior?** ✅ — "I don't time markets" vs. market-timing with Coke/P&G sells; "Simple businesses" vs. huge stakes in Apple; Munger relationship economics
- [x] **Subject is relevant to Perskill's target audience (AI builders / operators / vibe coders)?** ✅ — Investing framework, long-term thinking, capital allocation, ethical capitalism
- [x] **Estimated 15–25 hours of reading time available?** ✅ — Snowball is 624pp; shareholder letters fully indexed and searchable

---

## Credit budget (Buffett-specific)

> Buffett does NOT have Twitter. Replace Agent 3 (Social DNA) with Agent 3 (Shareholder Letters).

| Tool | Typical usage | Cost estimate |
|------|---------------|---------------|
| TwitterAPI.io | N/A — Buffett doesn't tweet | $0 |
| Firecrawl `/scrape` | 10-15 key URLs: berkshirehathaway.com/letters, Snowball excerpts, BRK annual reports | ~$1-2 |
| Firecrawl `/deep-research` | 5 runs (one per era, see Agent 6) | ~$3-5 |
| Firecrawl `/search` | 10-15 queries: Buffett controversy, Buffett criticism, Buffett SEC | ~$1-2 |
| **Total budget target** | | **$5-10 per persona** |

---

## Tool division of labor

| Agent | Tool | Why |
|-------|------|-----|
| Agent 1 — Published Works | Firecrawl `/scrape` | Shareholder letters at brk.com + Snowball book excerpts |
| Agent 2 — Interviews | Firecrawl `/scrape` | CNBC clips, Fortune interviews, Becky Quick sessions |
| Agent 3 — Shareholder Letters | Direct scrape (free) | berkshirehathaway.com/letters — 60 years free |
| Agent 4 — Adversarial | Firecrawl `/search` | Short-seller critiques, academic papers, Warren critics |
| Agent 5 — Decision Records | Firecrawl `/search` + SEC EDGAR | Berkshire 13F filings history, major acquisitions |
| Agent 6 — Timeline | Firecrawl `/deep-research` | 5 era sweeps |

---

## The 6 Collection Agents

### Agent 1 — Published Works

**Goal:** Long-form authored output. Buffett's own voice.

**Target sources:**
- berkshirehathaway.com/letters — 60 annual letters (1977-2024+), free
- Fortune magazine interviews (Buffett has written ~50 "Allen & Buffett" pieces)
- Any essays, op-eds, or academic writings

**Tools:** Firecrawl `/scrape` for Snowball excerpts. Direct download for shareholder letters.

**Output:** `research/01-shareholder-letters.md` — per decade: key passages as blockquotes, recurring themes

---

### Agent 2 — Interviews & Podcasts

**Goal:** Unscripted long-form. Where contradictions surface.

**Target sources:**
- Becky Quick / CNBC "Buffett, Munger, and Becky Quick" annual sessions (2015-2024)
- Fortune interviews with Carol Loomis
- Charlie Rose (60 Minutes equivalent coverage)
- Academic lectures: University of Nebraska, University of Florida

**Tools:** Firecrawl `/scrape` on transcript sites. YouTube for full speeches.

**Output:** `research/02-interview-distillation.md`

---

### Agent 3 — Shareholder Letters Analysis (replaces Twitter DNA)

**Goal:** Buffett's writing fingerprint across 6 decades. What changed, what stayed the same.

**Target sources:**
- 60 annual letters at brk.com/letters (1977-present)
- 1987 Letter to Partners (pre-Berkshire)
- 1996 Letter on stock splits
- 2008 Letter on financial crisis
- 2020 Letter on COVID

**Analysis to run:**
- Vocabulary evolution by decade (1960s vs 2020s)
- Key phrase frequency: "margin of safety", "owner earnings", "intrinsic value", "Mr. Market"
- Structural patterns: how does he open? How does he close?
- Controversy avoidance: how does he handle politically sensitive topics?
- Humor fingerprint: cricket analogies, rodeo references

**Output:** `research/03-letter-analysis.md` — quantitative + qualitative

---

### Agent 4 — Critical / Adversarial Coverage

**Goal:** Ground §8 Contradictions in the strongest possible counter-case.

**Target sources:**
- "The New Warren Buffett" critiques — academic papers on whether Buffett still beats
- Short-seller analysis of BRK overvaluation argument
- Michael Lewis "Big Short" / SEC enforcement coverage
- Criticism of Buffett's political donations / Gates Foundation dynamics
- "Buffett is wrong about stock buybacks" academic debate

**Tools:** Firecrawl `/search` with: `"Warren Buffett" criticism`, `"Buffett" overvalued`, `"Buffett" doesn't work anymore`, `"Buffett" mistakes`

**Output:** `research/04-adversarial-distillation.md`

---

### Agent 5 — Decision Records (Behavioral Proof)

**Goal:** What Buffett DID, not what he SAID. Ground truth for contradictions.

**Target sources:**
- Berkshire Hathaway 13F filings history (SEC EDGAR) — 50+ years of portfolio
- Major acquisitions: See's Candies (1972), Scott & Fetzer (1984), Dexterity (1998 failed), MidAmerican (2000), Burlington Northern (2011), Kraft Heinz (2015), Apple (2016-present)
- Insurance float deployment history
- Share buyback history ($700B+ in buybacks 2000-2024)
- Pre-Berkshire partnership records (1950s-1960s)

**Output:** `research/05-decision-record.md`

---

### Agent 6 — Biographical Timeline (5 Eras)

**Goal:** Era boundaries for §7 Timeline. Show behavioral evolution.

**Tools:** Firecrawl `/deep-research` with era-windowed queries:

- **Era 1 (Origins):** "Warren Buffett early life Omaha", "Buffett student Nebraska", "Graham value investing", 1950-1956
- **Era 2 (Partnership years):** "Buffett partnership 1956-1969", "Buffett closes partnership", 1956-1969
- **Era 3 (Berkshire accumulation):** "Buffett Berkshire Hathaway 1970s", "See's Candies acquisition", 1970-1999
- **Era 4 (Global fame):** "Buffett Munger partnership", "Buffett Yahoo", "Dot-com Buffett", 1999-2008
- **Era 5 (Recent):** "Buffett Apple investment", "Buffett Berkshire buybacks", "Buffett succession", 2009-present

**Output:** `research/06-timeline.md`

---

## Parallel execution checklist

- [ ] Agent 1 (Published works) — {N} letters / books captured
- [ ] Agent 2 (Interviews) — {N} interviews transcript
- [ ] Agent 3 (Shareholder Letters) — 60 letters analyzed by decade
- [ ] Agent 4 (Adversarial) — {N} hostile sources
- [ ] Agent 5 (Behavioral) — {N} filings / acquisitions
- [ ] Agent 6 (Timeline) — 5 eras mapped

---

## Distillation sequence (after collection)

1. Skim all 6 research files
2. List 15–25 candidate patterns in `triple-verify-log.md`
3. Run triple verification on every candidate
4. Write SKILL.md §4 (Mental Models) — 3–7 only, each with `(N源交叉)` tag
5. Write §5 (Heuristics) — demoted candidates, max 10
6. Write §6 (Expression DNA) — from `03-letter-analysis.md`
7. Write §8 (Contradictions) — 3–6 items from Agent 4 + Agent 5
8. Write §7 (Timeline) — map 5 eras with behavioral shifts
9. Fill remaining sections (§1, §2, §3, §9, §10, §11)
10. Run `validation-log.md` — 3 known statements + 1 novel question
11. Ship

---

## Estimated time budget

| Stage | Hours |
|-------|------:|
| Pre-flight + plan | 1 |
| 6-agent collection (parallel) | 4–6 |
| Reading + skim | 6–10 |
| Triple verification | 2–3 |
| SKILL.md drafting | 3–5 |
| Validation + iteration | 1–2 |
| **Total per persona** | **17–27 hrs** |
