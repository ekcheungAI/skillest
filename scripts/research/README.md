# Persona Research Pipeline

English quick-reference. See [INSTRUCTION.md](./INSTRUCTION.md) for the full Chinese manual.

---

## Directory Structure

```
scripts/research/
├── README.md              ← You are here (quick reference)
├── INSTRUCTION.md         ← Full Chinese manual (workflow, standards)
├── types.ts              ← Shared TypeScript interfaces
│
├── 0_scaffold/           ← Project scaffolding (v2: era-based deep script)
│   └── scaffold.ts      ← npx tsx 0_scaffold/scaffold.ts <id> --type=TYPE --name=NAME
│
├── 1_collect/           ← Data collection (v2: discovery + scrape)
│   ├── pipeline.ts      ← Full pipeline: discovery → tweets → web → deep research
│   ├── twitter-scraper.ts
│   ├── threads-scraper.ts
│   └── firecrawl-research.ts  ← (includes firecrawl-discovery.ts via pipeline)
│
├── firecrawl-discovery.ts   ← NEW (v2): Search-driven source discovery, 6 layers
│
├── 2_distill/           ← Distillation & export (v2: + claim extraction)
│   ├── distill.ts           ← Raw data → structured research files
│   ├── distill-from-persona.ts  ← personas.ts → SKILL.md (single persona)
│   ├── skill-file-generator.ts  ← Single persona → all skill files
│   ├── export-all-skills.ts    ← Batch export all 70 personas
│   └── triple-verify-runner.ts ← Auto-fill triple-verify-log.md
│
├── 3_validate/           ← Validation
│   └── validation-runner.ts ← Run validation harness before shipping
│
├── personas-deep-research/   ← Persona-specific deep research scripts
│   ├── warren-buffett-deep.ts ← Reference: era-based + adversarial + decision-record
│   ├── li-ka-shing-deep.ts
│   └── shi-yongqing-deep.ts
│
├── distill_templates/       ← All templates
│   ├── DISTILL_PLAN.md         ← v2: era-based research section
│   ├── SKILL_TEMPLATE.md
│   ├── TRIPLE_VERIFY.md
│   ├── VALIDATION_HARNESS.md
│   └── ...
│
├── data/                    ← Raw scraped JSON (pipeline output)
│   ├── {handle}_tweets.json
│   ├── {handle}_web.json
│   ├── {handle}_deep.json
│   ├── discovery-{handle}-*.json    ← v2: discovery results
│   └── scrape-targets-{handle}-*.json ← v2: prioritized scrape list
│
└── output/                  ← Structured research files (pipeline output)
    └── {persona-id}/
        ├── PLAN.md
        ├── 00-discovery-report.md     ← v2: 6-layer coverage report
        ├── 00-source-catalog.md       ← v2: with trust weights + layer tags
        ├── 01-tweet-statistics.md
        └── 07-claims-contradictions.md ← v2: auto-extracted claims + contradictions
```

---

## Standard Workflow (v2)

### Path A: Full research pipeline (new persona)

```bash
# 1. Scaffold the project (v2: generates era-based deep research script)
npx tsx scripts/research/0_scaffold/scaffold.ts <id> --type=TYPE --name="Full Name"

# 2. Run discovery + collection pipeline (v2: discovery runs by default)
npx tsx scripts/research/1_collect/pipeline.ts <handle> --count=500 --deep-research --type=TWITTER_CRYPTO --name="Full Name"

# 3. Run era-based deep research (v2: discovery + era queries + adversarial search)
npx tsx scripts/research/personas-deep-research/<id>-deep.ts

# 4. Distill raw data (v2: now includes claim extraction)
npx tsx scripts/research/2_distill/distill.ts <id> --agent=all

# 5. Run validation before shipping
npx tsx scripts/research/3_validate/validation-runner.ts <id>
```

### Path B: Export from personas.ts (fastest, no scraping)

```bash
# Single persona
npx tsx scripts/research/2_distill/export-all-skills.ts <persona-id>

# Auto-fill triple-verify-log.md
npx tsx scripts/research/2_distill/triple-verify-runner.ts <persona-id>
```

---

## Skill File Output Standard

Every persona's `skills/{id}/` directory must contain:

| File | Format |
|------|--------|
| `SKILL.md` | 11-section Nuwa-grade format |
| `SYSTEM_PROMPT.md` | YAML frontmatter + short prompt + full prompt + changelog |
| `USE_CASE_PROMPTS.md` | One section per use-case prompt |
| `PROFILE.md` | Wikipedia-depth profile from persona fields |
| `README.md` | Quick-reference install instructions |
| `research/README.md` | Research archive index (v2: includes 6-layer coverage) |
| `research/triple-verify-log.md` | Blank (fill before shipping) |
| `research/validation-log.md` | Blank (fill before shipping) |
| `research/07-claims-contradictions.md` | v2: auto-extracted claims + contradictions |

---

## Reference Format

See `https://github.com/ekcheungAI/perskill/tree/main/skills/justin-sun` for the canonical fully-distilled example.

See `personas-deep-research/warren-buffett-deep.ts` for the reference era-based deep research implementation.

---

## Credit Budget (v2)

| Tool | Typical cost |
|------|-------------|
| TwitterAPI.io | ~$2–8 / persona |
| Firecrawl `/search` (discovery) | ~$1–2 / persona |
| Firecrawl `/scrape` | ~$2–4 / persona |
| Firecrawl `/deep-research` | ~$3–6 / persona |
| **Total target** | **$8–20 / persona** |

Over-collecting is the most common mistake. Triple verification (TRIPLE_VERIFY.md) is the antidote, not more sources.

---

*Last updated: 2026-04-16 — v2 pipeline upgrade*
