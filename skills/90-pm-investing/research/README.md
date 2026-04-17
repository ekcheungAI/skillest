# 90-pm-investing Research Log

## Pipeline Version
**v1** (2026-04-16) — Discovery-driven source collection + Substack article analysis + behavioral pattern extraction

---

## Source Discovery

| Layer | Sources | Trust Weight | Key Finding |
|-------|--------:|------------|-------------|
| Authored (Substack) | 12 | 3.0 | Full 101-105 course, 6+ equity analyses (NVDA, PLTR, BE, TYR, NKE, STX) |
| Spoken (Threads/YouTube) | 2 | 2.5 | Threads posts with personal narrative; YouTube skill kit announcement |
| Institutional | 0 | — | No institutional records (CFA employment, fund evaluation background) |
| Adversarial | 1 | 2.2 | Single Threads self-critique post |
| Behavioral | 19 | 0.8-1.5 | HK Companies Registry (90s.pm.investing Limited), Gumroad pricing, interview preparation history |
| Social (Threads) | 20+ | 1.5 | Heavy Threads presence; 26K+ followers |

**Total: 35+ sources across 5 layers**
**Avg relevance: 56**
**Top source types**: primary-authored (Substack), primary-spoken (Threads), behavioral (HK CR, Gumroad)

### Coverage Gaps
- No institutional records confirming CFA employment, fund evaluation committee participation
- Limited adversarial sources — only 1 self-referential post
- No primary-spoken interviews or podcast appearances
- Behavioral layer relies on low-confidence threads metadata and HK CR data

---

## Substack Article Analysis

| Article | Word Count | Core Framework | Key Models |
|---------|-----------:|----------------|------------|
| 101: Introduction | ~3,000 | Tree thinking vs story thinking; science over faith; community-driven alpha | MECE, Feynman |
| 102: North Star | ~4,000 | Alpha = cognitive asymmetry; 79% fund managers underperform; individual advantages | Lynch, Beta/Alpha |
| 103: Story | ~4,500 | Five-signal framework; six narrative error types | Peter Lynch, Rosling |
| 104: Hypothesis | ~5,000 | Falsification method; GME vs OXY; Feynman; kill conditions | Feynman, Popper |
| 105: Drawing Trees | ~6,000 | Three drawing methods; MECE; leaf node anatomy; three correction postures | McKinsey, BCG, Bain, Minto |

---

## Claims & Contradictions

**Auto-extracted from 101-105 + equity analyses:**

Key claims:
- "Every thesis is a falsifiable hypothesis" — core operational principle
- "Alpha = cognitive asymmetry" — definition from CAPM/Fama-French framework
- "79% of US large-cap fund managers underperform S&P 500" — SPIVA 2025
- "GME loss: HK$2M, no kill condition" — documented personal failure
- "OXY first bucket: bought at $10-20, oil -$37.63 to $100+" — documented success
- "MECE: Mutually Exclusive, Collectively Exhaustive" — Minto-derived
- "Story drives valuation; numbers are translations" — narrative primacy claim
- "CFA + institutional fund evaluation committee experience" — claimed background
- "26K Threads followers, 6,300+ Substack subscribers" — claimed metrics

Contradiction candidates (to verify):
1. Claims scientific objectivity → but Substack is a business with paid tiers ($75 USD / HK$60 Patreon)
2. "Community-driven alpha" → but skill products priced at $3,999-$9,999/seat/year
3. "Science over faith" → but investment decisions still involve judgment/art beyond science
4. Personal success story (OXY) → survivorship bias; no mention of other losing positions
5. "Individual investors have structural advantages" → but also founded a company, built community, sells products

---

## Data Files

```
scripts/research/output/90-pm-investing/skills/90-pm-investing/
├── PROFILE.md                   — This file's companion: human-readable persona summary
├── SKILL.md                     — AI agent system prompt (complete)
├── README.md                    — Research pipeline log (this file)
├── 01-source-catalog.md         — Full source catalog with URLs and snippets
├── 02-investment-decisions.md    — GME, OXY, NVDA case studies
├── 03-mental-models.md           — Framework deep-dive (Feynman, Lynch, McKinsey, Marks)
├── 04-behavioral-records.md      — Personal history, career background
└── 05-substack-analysis.md       — Deep analysis of 101-105 methodology

scripts/research/data/
├── discovery-90s.pm.investing-2026-04-16.json        — 35 sources, 5 layers
├── scrape-targets-90s.pm.investing-2026-04-16.json  — 15 priority scrape targets
├── 90-pm-investing_substack.json                       — Full Substack content (101-105 + equity analyses)
└── search-li-ka-shing-adversarial-2026-04-16.json   — (shared, for comparison)

scripts/research/output/90s.pm.investing/
└── 00-discovery-report.md         — Discovery report
```

---

## Previous Research

- **SKILL.md v1.0**: Based on initial Substack introduction post — 3 mental models, 2 case studies
- **SKILL.md v2.0**: Based on 35+ sources — complete framework, vocabulary patterns, interaction style, full case studies

---

## Next Steps

- [ ] Triple-verify CFA claim against institutional records
- [ ] Verify "institutional fund evaluation committee" background
- [ ] Expand adversarial layer — find contradictions or critiques from other finance educators
- [ ] Collect more equity analysis samples beyond Substack paywall
- [ ] Verify 26K Threads / 6,300+ Substack subscriber claims
- [ ] Add behavioral data: posting frequency, engagement patterns, topic distribution
