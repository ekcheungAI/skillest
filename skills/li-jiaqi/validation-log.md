# Validation Harness — 李佳琦 (Austin Li)

> Run this BEFORE shipping any persona skill. Adapted from the Nuwa framework's 3+1 test. The point is to catch two failure modes: (a) the skill parrots known quotes but can't generalize, (b) the skill confidently fabricates on unknown territory.

---

## The 3+1 Protocol

### Part A — Three Known-Statement Tests (directional consistency)

Pick three statements the subject has made publicly that are **not quoted verbatim in SKILL.md**. Hide the ground-truth answer. Run the skill against the question the statement was responding to. Compare directions.

**Pass criterion:** skill's answer points in the same direction as the subject's real answer. Exact wording doesn't matter — *direction and reasoning pattern* do.

| # | Question posed | Subject's real public answer (hidden during test) | Skill's answer | Direction match? | Notes |
|---|---------------|---------------------------------------------------|----------------|:---------------:|-------|
| 1 | | | | ☐ | |
| 2 | | | | ☐ | |
| 3 | | | | ☐ | |

**Threshold:** 2 of 3 must be directional matches. Fewer → something in SKILL.md is wrong. Revisit mental models and heuristics.

---

### Part B — One Novel-Question Test (calibrated uncertainty)

Pose a question on a subject **where the persona has no public record**. Examples:
- A technology they've never commented on
- A specific competitor's product launched after their last public statement
- A personal topic they're known to avoid
- A counterfactual ("what if X had happened")

**Pass criterion:** skill responds in their voice, applies a relevant mental model, AND explicitly acknowledges the uncertainty. Confident fabrication = fail.

| Novel question posed | Skill's answer | Applied which mental model? | Uncertainty acknowledged? | Fabrication risk? | Verdict |
|----------------------|----------------|----------------------------|:-------------------------:|:-----------------:|---------|
| | | | ☐ | ☐ | Pass / Fail |

---

## Sourcing the test questions

**For Part A — where to find known statements:**
- Latest 10 interviews / podcast episodes (but NOT the ones distilled into SKILL.md §4 evidence blocks)
- Recent tweets under 200 likes (less likely to be the "greatest hits" already absorbed)
- Q&A transcripts from conferences

**For Part B — how to construct a novel question:**
- Take a recent news event from after the skill's research cutoff
- Or: a topic in their general domain they haven't specifically addressed
- Or: a cross-domain bridge ("as a builder, how would you evaluate this scientific paper?")

---

## Failure playbook

| Failure pattern | Likely cause | Fix |
|-----------------|--------------|-----|
| Skill parrots quotes, can't generalize | Mental models are too specific / stick too close to source wording | Rewrite models at higher abstraction; re-run triple verification |
| Skill confidently fabricates | §11 Honest Boundaries not internalized; role-play prompt too aggressive | Strengthen §11; add "When unsure, say so" to §1 Role-Play Rules |
| Wrong tone / off-voice | Expression DNA missing or generic | Re-scrape tweets; populate §6 with actual numbers |
| Contradicts known behavior | Skipped Agent 5 (Behavioral Record) | Run Agent 5; add findings to §8 Contradictions |
| Gives generic smart-person advice | Mental models failed Test 3 (exclusivity) but were included anyway | Cut weakest model(s); re-test |

---

## Ship gate

Do not publish the skill until:
- [ ] 2 of 3 Part A tests pass (directional match)
- [ ] Part B passes (no fabrication, calibrated uncertainty)
- [ ] Changelog entry drafted
- [ ] Source catalog committed
- [ ] Triple verification log committed

---

## Recurring re-validation

Re-run the full harness:
- **Every 3 months** for active public figures (they keep saying new things)
- **Every 12 months** for quieter figures
- **Immediately** after any major public event involving the subject
- **Immediately** after any SKILL.md edit to §4 or §5

Log results in a simple table:

| Date | Persona | Part A pass | Part B pass | Changes made |
|------|---------|:-----------:|:-----------:|--------------|
| | | | | |
