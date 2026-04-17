# Li Ka-shing Research Log

## Pipeline Version
**v2** (2026-04-16) — Search-driven discovery + era-segmented deep research + automated claim extraction

---

## Source Discovery (v2)

| Layer | Sources | Trust Weight | Key Finding |
|-------|--------:|------------|-------------|
| Authored | 6 | 3.0 | Medium essays (variable quality) |
| Spoken | 12 | 2.5 | Bloomberg interview (2016), SCMP video |
| Institutional | 13 | 2.8 | SEC filings, CKAH Annual Report 2024 |
| Adversarial | 11 | 2.2 | Beijing rift (2019), Panama dispute (2025) |
| Behavioral | 91 | 1.0–1.8 | Wikipedia, biographies |
| Social (Twitter) | 0 | — | No active social presence |

**Total: 133 sources across 6 layers**
**Avg relevance: 47**
**Top source types**: primary-authored, institutional-record, adversarial-critique

### Coverage Gaps
- Few institutional sources (1) — expand search for shareholder letters, CKHH annual reports
- No primary authored sources (books, essays directly from Li Ka-shing)
- No social media presence (Twitter/X, Threads)

---

## Era-Segmented Deep Research (v2)

| Era | Focus | Status |
|----|-------|--------|
| 1-Founding | 1930s Chaozhou → 1970s acquisition | Empty (rate limit hit) |
| 2-Expansion | Orange 1999 → globalization | Empty (rate limit hit) |
| 3-Modern | 2018–2026 Victor Li, Panama, AI pivot | ⏳ Rate limit hit during run |

### Adversarial + Decision Records Search (60 results)
- Adversarial: Beijing relationship fracture (2019–2026), Panama Canal dispute, 3 Italy failure
- Decision Records: Orange sale reasoning, CK Hutchison ports acquisition, Victor Li succession

---

## Claims & Contradictions

**29 claims auto-extracted from 14 sources**
**0 contradictions auto-detected** (manual fill-in required)

Key claims extracted:
- Philanthropy: HK$30B+ since 1980 (LKSF)
- Orange sale: $17B, France Telecom, cash only
- Foundation: established 1980, education + medical reform
- Hutchison Asia Telecom: Vietnamese and Thai operations
- Panama Canal: contract dispute → international arbitration

Manual contradictions to add:
1. Beijing relationship: says "neutrality" → 2019 protest criticism
2. Patient capital paradox: extreme patience costs full exits (3 Italy)
3. Political neutrality: positions as apolitical → philanthropy as geopolitical tool
4. "Never do anything embarrassing" → 2019 Beijing criticism forced public statement

---

## Data Files

```
perskill/data/
├── li-ka-shing_web.json       — 14 scraped pages (v2 pipeline output)
├── li-ka-shing_deep.json     — 2024–2026 deep research (Apr 2026)

scripts/research/data/
├── discovery-li-ka-shing-2026-04-16.json     — 133 sources, 6 layers
├── scrape-targets-li-ka-shing-2026-04-16.json — 15 priority targets
├── search-li-ka-shing-adversarial-2026-04-16.json     — 10 adversarial results
├── search-li-ka-shing-decision-records-2026-04-16.json — 10 decision record results
├── li-ka-shing-corporate-research-2026-04-10.json     — pre-v2 scrape (12 pages)
├── li-ka-shing-scrape.json                                  — pre-v2 raw scrape
├── li-ka-shing-deep-research.json                            — pre-v2 deep research

scripts/research/output/li-ka-shing/
├── 00-discovery-report.md         — v2 discovery report
└── 07-claims-contradictions.md    — claims ledger + contradiction templates

perskill/output/li-ka-shing/
└── 07-claims-contradictions.md    — distill output (claims + contradiction ledger)
```

---

## Previous Research (pre-v2)

- **SKILL.md v2.0**: Based on 23 sources — 3 mental models, 3 decision heuristics
- **SKILL.md v3.0**: Based on 133+ sources — 4 mental models, 5 decision heuristics, era phases, adversarial layer, 2024–2026 update

---

## Next Steps

- [ ] Run Era 1 + Era 2 deep research (retry after rate limit reset)
- [ ] Fill in 6 contradiction templates in `07-claims-contradictions.md`
- [ ] Triple-verify log: add 15–25 candidate models from new research
- [ ] Validate Panama Canal / AI pivot claims against primary sources (CKHH annual report 2024)
- [ ] Consider adding `li-ka-shing-deeper-v2.ts` with rate-limit-aware backoff
