# Triple Verification Log — 李佳琦 (Austin Li)

> Adapted from the Nuwa-skill extraction framework. This is the gating document that decides what makes it into SKILL.md §4 (Mental Models) vs §5 (Heuristics) vs the cutting-room floor.

**Rule:** A pattern qualifies as a **Mental Model** only if it passes ALL THREE tests below. Pass 2 → demote to a **Decision Heuristic**. Pass 1 → cut, or keep as color in Identity Card / Timeline. Pass 0 → cut.

---

## The Three Tests

### Test 1 — Cross-Domain Reproduction
The same framework must surface in **≥2 different domains** of the subject's life (e.g., business decisions + personal philosophy + investing + creative work). One domain = coincidence. Two = pattern. Three+ = operating system.

### Test 2 — Generative Power
The model must let you **predict their stance on a problem they've never addressed publicly**. If the only way to know what they'd think is to quote them directly, it's not a model — it's a catchphrase.

### Test 3 — Non-Obvious / Exclusive
Not something any smart operator would think. If the model is "focus on what matters" or "hire great people," cut it — that's wallpaper. The model must reveal a perspective that is distinctively theirs and that a thoughtful competitor would disagree with.

---

## Candidate Log

Fill in one row per candidate pattern. Do this BEFORE writing SKILL.md §4.

| # | Candidate model | Domain 1 evidence | Domain 2 evidence | Domain 3 evidence | T1 pass? | Novel prediction enabled | T2 pass? | Who would disagree? | T3 pass? | Verdict |
|---|----------------|-------------------|-------------------|-------------------|:--------:|--------------------------|:--------:|--------------------|:--------:|---------|
| 1 | {one-line name} | > "{quote}" — {source, year} | > "{quote}" — {source, year} | {behavioral pattern + source} | ☐ | {what this predicts on a novel question} | ☐ | {named counter-operator + why} | ☐ | Model / Heuristic / Cut |
| 2 | | | | | ☐ | | ☐ | | ☐ | |
| 3 | | | | | ☐ | | ☐ | | ☐ | |

> Target candidate count: **15–25**. Most will be cut or demoted. Final mental model count should land at **3–7**. Final heuristic count at **5–10**.

---

## Verdict Rules

- **✅ Pass 3/3** → Mental Model (include in SKILL.md §4 with `(N源交叉验证)` tag)
- **⚠️ Pass 2/3** → Decision Heuristic (include in SKILL.md §5 as one-liner with case)
- **⚠️ Pass 1/3** → Color detail (maybe Identity Card §3 or Timeline §7, NOT a model)
- **❌ Pass 0/3** → Cut entirely

---

## Worked example (use this format when logging)

### Candidate: "Chicken vs. Duck paradigm recognition" — from Justin Sun distillation

**Domain 1 — Creative autobiography (2017):**
> "I entered Hupan [University], and felt like a duck in a flock of chickens... Six years of entrepreneurship went in circles, I realized I can only be a duck." — Zinc Finance long interview, 2018

**Domain 2 — Business decision-making (2024):**
> "Ruan Xiaoqi is the only one who jumped out of Liangshan... our world has become an expanding universe." — Huazong podcast, 2024 (evolved version of same model applied to market structure)

**Domain 3 — Behavioral record:**
Refused three traditional VC rounds (2016–2017) before launching TRON via token sale. On-chain record: no equity dilution from A/B/C rounds, only token issuance.

- T1 Cross-domain pass? ✅ (autobiography + podcast + behavioral)
- Novel prediction: "Would Justin Sun back a seed-stage SaaS startup using traditional equity?" → Model predicts NO. (Validation: he hasn't, in 8 years of public investing.)
- T2 pass? ✅
- Who would disagree? Peter Thiel (believes equity markets are the superior rail). → Genuinely contested.
- T3 pass? ✅

**Verdict:** Mental Model. Include as Core Model #2 with `(3源交叉)` tag.

---

## Anti-patterns — what NOT to promote to mental model

- **Universal virtues** — "work hard", "focus", "think long-term" → cut
- **Single-domain quirks** — behavior only observed in one arena → heuristic at best
- **Post-hoc narratives** — stories the subject tells about past wins that don't predict future moves → color only
- **Values statements without behavioral proof** — "I believe in X" with no documented X-shaped decision → cut

---

## Promotion ledger

Track what got in and why. Useful when you revise the skill later.

| Final slot | Model / Heuristic name | Candidate # | Verification pass count | Notes |
|------------|------------------------|-------------|:-----------------------:|-------|
| Meta | | | 3/3 | |
| Model 1 | | | 3/3 | |
| Model 2 | | | 3/3 | |
| Heuristic 1 | | | 2/3 | |
| … | | | | |

---

## Review cadence

Re-run triple verification **every 6 months** for active personas. New public statements may:
- Promote a heuristic to a model (if a second domain now shows the pattern)
- Demote a model (if recent behavior contradicts it → add to §8 Contradictions instead)
- Surface a new model entirely

Log changes in SKILL.md changelog.
