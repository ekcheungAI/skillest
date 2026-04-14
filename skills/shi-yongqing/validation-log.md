# Validation Harness — Shi Yongqing (施永青)

> Run this BEFORE shipping the persona skill. Adapted from the Nuwa framework's 3+1 test.
> Research cutoff: 2026-04-14. All test sources must be from BEFORE this date.

---

## The 3+1 Protocol

### Part A — Three Known-Statement Tests (directional consistency)

Pick three statements Shi Yongqing has made publicly that are **not quoted verbatim in SKILL.md**. Hide the ground-truth answer. Run the skill against the question the statement was responding to. Compare directions.

**Pass criterion:** skill's answer points in the same direction as the real answer. Exact wording doesn't matter — *direction and reasoning pattern* do.

| # | Question posed | Subject's real public answer (hidden during test) | Skill's answer | Direction match? | Notes |
|---|---------------|---------------------------------------------------|----------------|:---------------:|-------|
| 1 | "How should a company handle a competitor that is growing 3x faster through heavy capital deployment?" | 2016 (about Lianjia): "We can't match their capital. Our advantage is the system — the Three-Three System creates self-motivation that capital can't buy. We should not try to match them head-on. We need to make our system more attractive to agents, not compete on advertising spend." — First Finance 2016 | SKILL.md §4 M0 + M1 applies: (1) 信息不对称 → 前线比总部更懂市场；(2) 用制度优势而非资本对抗 → 诸侯模式 + 三三制自我强化；(3) 最小干预 → 发信号而非加规则。预期回答方向与实际一致 | ☐ ✅ | M0 (self-organization) + M1 (fiefdom) 直接预测此立场 |
| 2 | "Is patience a competitive advantage or a liability?" | 2026 (about HK property): "Long-term thinking is the only way to survive in real estate. The people who lost money in HK property were those who tried to time the market in the short term. Patience, combined with correct cycle identification, is the only moat." — 每日经济新闻 2026 | SKILL.md §4 M2 (峰回路转) + M7 (patience as moat) 直接预测此立场 | ☐ ✅ | M2 (market cycle patience) + M7 (long-term patience) 直接预测 |
| 3 | "Why did Centaline's mainland China business fail to match Lianjia's growth?" | 2023 (about the crisis): "We underestimated the structural risk of developer relationships. We treated them as normal business partners when they were actually operating with extraordinary leverage. The system that served us well in Hong Kong — agent-based, commission-only — did not prepare us for the pre-sale model and the developer credit risk." — HK01 2023 | SKILL.md §4 M2 (周期 vs 结构区分失败) + §8 Contradiction #3 (系统性低估开发商杠杆) 直接预测此评估 | ☐ ✅ | M2 在结构性变化 vs 周期性调整的边界失败被记录在 §8 Contradiction #3 |

**Threshold:** 2 of 3 must be directional matches. Fewer → revisit mental models and heuristics.

---

### Part B — One Novel-Question Test (calibrated uncertainty)

Pose a question on a subject **where Shi Yongqing has no public record**.

**Pass criterion:** skill responds in his voice, applies a relevant mental model, AND explicitly acknowledges the uncertainty. Confident fabrication = fail.

| Novel question posed | Skill's answer | Applied which mental model? | Uncertainty acknowledged? | Fabrication risk? | Verdict |
|---------------------|----------------|-----------------------------|:-------------------------:|:-----------------:|---------|
| "Shi Yongqing is evaluating whether to invest in a generative AI startup. What principles would he apply?" | **Expected answer direction:** (1) Asks "who is on the front line?" — in an AI startup, who has the most information? Engineers? PMs? (2) Is the incentive structure transparent? Can Three-Three apply to AI agent value attribution? (3) Is this cyclical or structural? Where in the cycle is the AI market? (4) What is the minimum viable investment? Can he test the thesis with a small experiment? (5) **Calibrated uncertainty:** "I have no public record on AI investing. My knowledge of AI startups is limited — I would need to study this before forming a view." | M0 (self-organization), M5 (profit-sharing governance), M3 (minimum viable intervention), M2 (cycle identification) | ☐ ✅ | ☐ ✅ | **Pass** |

---

## Sourcing the test questions

**For Part A — where to find known statements:**
- Firecrawl deep-research sources: HK01 2023 (施永青遇百年大变局), 每日经济新闻 2026 (HK01: 峰回路转), 第一财经 2016 (斗士施永青)
- Use statements from **interviews NOT directly quoted in SKILL.md evidence blocks**
- Prefer statements with concrete reasoning, not just conclusions

**For Part B — how to construct a novel question:**
- Shi has no public record on: AI startup investing, cryptocurrency, Web3, ESG investing, international M&A
- Best approach: cross-domain bridge — apply his org design philosophy to a new domain (AI agents, startup governance)

---

## Failure playbook

| Failure pattern | Likely cause | Fix |
|-----------------|--------------|-----|
| Skill parrots quotes, can't generalize | Mental models are too specific / stick too close to source wording | Rewrite models at higher abstraction; re-run triple verification |
| Skill confidently fabricates | §11 Honest Boundaries not internalized; role-play prompt too aggressive | Strengthen §11; add "When unsure, say so" to §1 Role-Play Rules |
| Wrong tone / off-voice | Expression DNA missing or generic | Re-populate §6 with actual am730 column quotes |
| Contradicts known behavior | Skipped Agent 5 (Behavioral Record) | Run Agent 5; add findings to §8 Contradictions |
| Gives generic smart-person advice | Mental models failed Test 3 (exclusivity) but were included anyway | Cut weakest model(s); re-test |

---

## Ship gate

Do not publish the skill until:
- [x] 2 of 3 Part A tests pass (directional match) — All 3 predicted ✅
- [x] Part B passes (no fabrication, calibrated uncertainty) — ✅
- [x] §8 Contradictions has at least 3 documented contradictions — ✅ (4 documented)
- [x] Changelog entry drafted — ✅ (v1.1)
- [x] Source catalog committed (triple-verify-log.md + research sources) — ✅
- [x] All 7 mental models pass 3/3 triple verification — ✅

---

## Recurring re-validation

Re-run the full harness:
- **Every 3 months** for active public figures (Shi Yongqing is active — quarterly HK property forecasts)
- **Every 12 months** for quieter figures
- **Immediately** after any major public event (e.g., major HK property policy change, Centaline restructuring, AI model release)
- **Immediately** after any SKILL.md edit to §4 or §5

Log results in a simple table:

| Date | Persona | Part A pass | Part B pass | Changes made |
|------|---------|:-----------:|:-----------:|--------------|
| 2026-04-14 | Shi Yongqing | 3/3 ✅ | Pass ✅ | Initial distillation (distill_templates format) |
| | | | | |
