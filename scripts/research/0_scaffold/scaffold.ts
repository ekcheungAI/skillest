#!/usr/bin/env tsx
/**
 * scaffold.ts
 *
 * Scaffolds a new persona research project from templates.
 * Generates:
 *   ../../output/{id}/PLAN.md           — filled Distill Plan (with era-based research)
 *   ../../output/{id}/SKILL_TEMPLATE.md     — filled SKILL.md template
 *   ../../output/{id}/triple-verify-log.md   — blank verification log
 *   ../../output/{id}/validation-log.md      — blank validation harness
 *   skills/{id}/research/triple-verify-log.md   — research archive copy
 *   skills/{id}/research/validation-log.md      — research archive copy
 *   skills/{id}/research/README.md              — research archive index
 *
 * New in v2:
 * - Era-based deep research queries (generalized from Buffett pattern)
 * - Adversarial + decision-record search queries
 * - Discovery module integration (6-layer source coverage)
 * - Source classification + trust weights
 *
 * Usage:
 *   npx tsx scripts/research/0_scaffold/scaffold.ts <persona-id> --type=HK_ENTREPRENEUR --name="Li Ka-shing"
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Persona type presets ─────────────────────────────────────────────────────

type PersonaType = "TWITTER_CRYPTO" | "CHINESE_BUSINESS" | "HK_ENTREPRENEUR" | "WESTERN_INVESTOR";

interface PersonaPreset {
  type: PersonaType;
  description: string;
  hasTwitter: boolean;
  hasBooks: boolean;
  hasLegalFilings: boolean;
  keyResearchAgents: string[];
  suggestedCategories: string[];
  deepResearchTopics: string[];
  referencePersona?: string;
}

const PRESETS: Record<string, PersonaPreset> = {
  TWITTER_CRYPTO: {
    type: "TWITTER_CRYPTO",
    description: "Crypto/trading persona with active Twitter/X presence.",
    hasTwitter: true,
    hasBooks: false,
    hasLegalFilings: true,
    keyResearchAgents: ["Agent 1", "Agent 3", "Agent 4", "Agent 5"],
    suggestedCategories: ["Crypto", "Trading", "Investing"],
    deepResearchTopics: [
      "trading methodology and market analysis approach",
      "competitive positioning vs other traders",
      "regulatory challenges and legal history",
    ],
    referencePersona: "KillaXBT",
  },
  CHINESE_BUSINESS: {
    type: "CHINESE_BUSINESS",
    description: "Chinese-language entrepreneur/business leader without Twitter.",
    hasTwitter: false,
    hasBooks: true,
    hasLegalFilings: false,
    keyResearchAgents: ["Agent 2", "Agent 4", "Agent 6"],
    suggestedCategories: ["Business", "Finance"],
    deepResearchTopics: [
      "management philosophy and organizational approach",
      "investment strategy and portfolio",
      "biography and career milestones",
    ],
    referencePersona: "Shi Yongqing",
  },
  HK_ENTREPRENEUR: {
    type: "HK_ENTREPRENEUR",
    description: "Hong Kong entrepreneur. Combines Chinese-language sources with English press.",
    hasTwitter: false,
    hasBooks: false,
    hasLegalFilings: true,
    keyResearchAgents: ["Agent 2", "Agent 4", "Agent 5", "Agent 6"],
    suggestedCategories: ["Business", "Finance", "Investing"],
    deepResearchTopics: [
      "Hong Kong real estate market analysis",
      "management philosophy and succession planning",
      "competitive dynamics and industry positioning",
    ],
    referencePersona: "Li Ka-shing",
  },
  WESTERN_INVESTOR: {
    type: "WESTERN_INVESTOR",
    description: "Western investor/business figure with English-language sources.",
    hasTwitter: false,
    hasBooks: true,
    hasLegalFilings: true,
    keyResearchAgents: ["Agent 1", "Agent 2", "Agent 4", "Agent 5", "Agent 6"],
    suggestedCategories: ["Investing", "Finance"],
    deepResearchTopics: [
      "investment philosophy and core methodology",
      "biography and formative experiences",
      "competitive landscape and key relationships",
    ],
    referencePersona: "Warren Buffett",
  },
};

// ─── Template file paths ──────────────────────────────────────────────────────

const TEMPLATES_DIR = resolve(__dirname, "../distill_templates");
const ROOT = resolve(__dirname, "../../..");

function readTemplate(name: string): string {
  const path = resolve(TEMPLATES_DIR, name);
  if (existsSync(path)) return readFileSync(path, "utf-8");
  return "";
}

// ─── Era query builder (generalized from Buffett pattern) ─────────────────────

interface EraQuery {
  era: string;
  topic: string;
  recencyDays: number;
  limit: number;
}

function buildEraQueries(type: string): EraQuery[] {
  const eraTemplates: Record<string, EraQuery[]> = {
    WESTERN_INVESTOR: [
      { era: "1-Origins", topic: "", recencyDays: 18250, limit: 15 },
      { era: "2-Building", topic: "", recencyDays: 14600, limit: 15 },
      { era: "3-Mature", topic: "", recencyDays: 10950, limit: 15 },
      { era: "4-Recent", topic: "", recencyDays: 1825, limit: 20 },
    ],
    CHINESE_BUSINESS: [
      { era: "1-Early", topic: "", recencyDays: 18250, limit: 12 },
      { era: "2-Ascent", topic: "", recencyDays: 10950, limit: 12 },
      { era: "3-Recent", topic: "", recencyDays: 3650, limit: 15 },
    ],
    HK_ENTREPRENEUR: [
      { era: "1-Founding", topic: "", recencyDays: 18250, limit: 12 },
      { era: "2-Expansion", topic: "", recencyDays: 10950, limit: 12 },
      { era: "3-Modern", topic: "", recencyDays: 3650, limit: 15 },
    ],
    TWITTER_CRYPTO: [
      { era: "1-Early", topic: "", recencyDays: 7300, limit: 12 },
      { era: "2-Growth", topic: "", recencyDays: 3650, limit: 12 },
      { era: "3-Recent", topic: "", recencyDays: 1095, limit: 15 },
    ],
  };
  return eraTemplates[type] || eraTemplates["CHINESE_BUSINESS"];
}

function buildEraTopic(era: string, type: string, name: string): string {
  const eraConfigs: Record<string, Record<string, string>> = {
    WESTERN_INVESTOR: {
      "1-Origins": name + " early life education mentorship first investments value investing origins",
      "2-Building": name + " career building partnership first major investments business formation methodology",
      "3-Mature": name + " mature phase methodology crystallization philosophy key decisions Berkshire",
      "4-Recent": name + " recent investment decisions current philosophy succession legacy",
    },
    CHINESE_BUSINESS: {
      "1-Early": name + " 早年 教育 创业 早期经历 管理哲学形成",
      "2-Ascent": name + " 发展 扩张 上市 关键决策 商业哲学",
      "3-Recent": name + " 近期 投资 动态 演讲 采访 管理理念",
    },
    HK_ENTREPRENEUR: {
      "1-Founding": name + " Hong Kong founding business origins real estate early career",
      "2-Expansion": name + " expansion acquisitions listed company corporate governance",
      "3-Modern": name + " recent investments succession philanthropy business philosophy",
    },
    TWITTER_CRYPTO: {
      "1-Early": name + " early crypto trading first posts methodology formation",
      "2-Growth": name + " trading career growth competitive positioning key trades",
      "3-Recent": name + " recent positions commentary current strategy market analysis",
    },
  };
  const typeEras = eraConfigs[type] || eraConfigs["CHINESE_BUSINESS"];
  return typeEras[era] || name + " " + era.replace("-", " ");
}

// ─── Adversarial query builder ──────────────────────────────────────────────

interface AdversarialQuery {
  category: string;
  query: string;
}

function buildAdversarialQueries(type: string, name: string): AdversarialQuery[] {
  const base: AdversarialQuery[] = [
    { category: "adversarial", query: '"' + name + '" criticism OR scandal OR failure OR mistake OR lawsuit' },
    { category: "adversarial", query: '"' + name + '" investigation OR SEC OR regulatory OR fraud OR accused' },
    { category: "decision-records", query: '"' + name + '" acquisition OR investment OR key decision reasoning' },
  ];

  switch (type) {
    case "WESTERN_INVESTOR":
      return [
        { category: "adversarial", query: '"' + name + '" no longer beats market academic evidence criticism' },
        { category: "adversarial", query: '"' + name + '" buybacks destroys value overvalued criticism' },
        { category: "adversarial", query: '"' + name + '" criticism scandal failure mistakes Berkshire' },
        { category: "decision-records", query: name + " 13F filings history investment timeline Berkshire" },
        { category: "decision-records", query: name + " Coca-Cola OR Apple OR acquisition decision reasoning" },
      ];
    case "CHINESE_BUSINESS":
      return [
        { category: "adversarial", query: name + " 批评 争议 调查 失败案例" },
        { category: "decision-records", query: name + " 投资决策 并购 上市 关键节点" },
        { category: "decision-records", query: name + " 收购 出售 重大决策" },
      ];
    default:
      return base;
  }
}

// ─── Deep research script generator ────────────────────────────────────────────

function generateDeepResearchScript(id: string, name: string, preset: PersonaPreset): string {
  const eras = buildEraQueries(preset.type);
  const advQueries = buildAdversarialQueries(preset.type, name);

  // Build era phases as a JS array string
  const eraPhases = eras.map(q => {
    const topic = buildEraTopic(q.era, preset.type, name);
    return "      {\n        era: \"" + q.era + "\",\n        topic: \"" + topic.replace(/"/g, '\\"') + "\",\n        recencyDays: " + q.recencyDays + ",\n        limit: " + q.limit + "\n      }";
  }).join(",\n");

  const advLines = advQueries.map(q =>
    "  { category: \"" + q.category + "\", query: \"" + q.query.replace(/"/g, '\\"') + "\" }"
  ).join(",\n");

  return [
    "#!/usr/bin/env tsx",
    "/**",
    " * " + id + "-deep.ts",
    " *",
    " * Persona-specific deep research for " + name + " (" + preset.type + ").",
    " * Auto-generated by `0_scaffold/scaffold.ts`.",
    " *",
    " * Features:",
    " * - Search-driven source discovery (6 layers)",
    " * - Era-segmented deep research (" + eras.length + " eras)",
    " * - Adversarial + decision-record search queries",
    " * - Source classification with trust weights",
    " *",
    " * Usage:",
    " *   npx tsx ../personas-deep-research/" + id + "-deep.ts",
    " */",
    "",
    "import { deepResearch, searchFirecrawl } from \"../firecrawl-research.js\";",
    "import { discoverSources } from \"../firecrawl-discovery.js\";",
    "import { writeFileSync, mkdirSync } from \"fs\";",
    "",
    "const FIRECRAWL_KEY = process.env.VITE_FIRECRAWL_API_KEY!;",
    "const TIMESTAMP = new Date().toISOString().slice(0, 10);",
    "const OUT_DIR = \"../../data\";",
    "const NAME = \"" + name + "\";",
    "const ID = \"" + id + "\";",
    "",
    "mkdirSync(OUT_DIR, { recursive: true });",
    "",
    "async function main() {",
    "  if (!FIRECRAWL_KEY) {",
    "    console.error(\"VITE_FIRECRAWL_API_KEY not set\");",
    "    process.exit(1);",
    "  }",
    "",
    "  console.log(\"\\u{1F4AC} Deep research for \" + NAME + \"...\");",
    "  console.log(\"\");",
    "",
    "  // Phase 0: Source discovery (6 layers)",
    "  console.log(\"=== Phase 0: Search-Driven Discovery ===\");",
    "  try {",
    "    const discResult = await discoverSources(NAME, \"" + preset.type + "\", { maxQueries: 15 });",
    "    console.log(\"  \\u2705 \" + discResult.totalSources + \" sources discovered across 6 layers\");",
    "    writeFileSync(",
    "      OUT_DIR + \"/discovery-\" + ID + \"-\" + TIMESTAMP + \".json\",",
    "      JSON.stringify(discResult, null, 2)",
    "    );",
    "    for (const gap of discResult.metadata.coverageGaps) {",
    "      console.log(\"  \\u26A0  \" + gap);",
    "    }",
    "    const targets = discResult.priorityScrapeTargets.slice(0, 12);",
    "    console.log(\"  \\u{1F3AF} Priority targets: \" + targets.length);",
    "    writeFileSync(",
    "      OUT_DIR + \"/scrape-targets-\" + ID + \"-\" + TIMESTAMP + \".json\",",
    "      JSON.stringify(targets, null, 2)",
    "    );",
    "  } catch (e: any) {",
    "    console.warn(\"  \\u26A0  Discovery failed: \" + e.message);",
    "  }",
    "  console.log(\"\");",
    "",
    "  // Phase 1: Era-segmented deep research",
    "  console.log(\"=== Phase 1: Era-Segmented Deep Research ===\");",
    "  const eraQueries = [",
    eraPhases,
    "  ];",
    "  for (const q of eraQueries) {",
    "    console.log(\"  \\u{1F4E1} [\" + q.era + \"] \" + q.topic.slice(0, 50) + \"...\");",
    "    try {",
    "      const result = await deepResearch(FIRECRAWL_KEY, q.topic, {",
    "        recencyDays: q.recencyDays,",
    "        limit: q.limit,",
    "      });",
    "      writeFileSync(",
    "        OUT_DIR + \"/deep-\" + ID + \"-\" + q.era + \"-\" + TIMESTAMP + \".json\",",
    "        JSON.stringify(result, null, 2)",
    "      );",
    "      const sources = result.data?.sources?.length || 0;",
    "      console.log(\"  \\u2705 [\" + q.era + \"] Deep research \\u2014 \" + sources + \" sources\");",
    "    } catch (e: any) {",
    "      console.warn(\"  \\u26A0  [\" + q.era + \"] Failed: \" + e.message);",
    "    }",
    "    await new Promise(r => setTimeout(r, 3000));",
    "  }",
    "  console.log(\"\");",
    "",
    "  // Phase 2: Adversarial + decision-record search",
    "  const adversarialQueries = [",
    advLines,
    "  ];",
    "  if (adversarialQueries.length > 0) {",
    "    console.log(\"=== Phase 2: Adversarial + Decision Records ===\");",
    "    for (const q of adversarialQueries) {",
    "      console.log(\"  \\u{1F50D} [\" + q.category + \"] \" + q.query.slice(0, 60) + \"...\");",
    "      try {",
    "        const result = await searchFirecrawl(FIRECRAWL_KEY, q.query, 10);",
    "        console.log(\"  \\u2705 \" + (result.data?.length || 0) + \" results\");",
    "        writeFileSync(",
    "          OUT_DIR + \"/search-\" + ID + \"-\" + q.category + \"-\" + TIMESTAMP + \".json\",",
    "          JSON.stringify(result, null, 2)",
    "        );",
    "      } catch (e: any) {",
    "        console.warn(\"  \\u26A0  \" + e.message);",
    "      }",
    "      await new Promise(r => setTimeout(r, 2000));",
    "    }",
    "  }",
    "",
    "  console.log(\"\");",
    "  console.log(\"\\u2705 Deep research complete. Files in \" + OUT_DIR + \"/\");",
    "}",
    "",
    "main().catch(console.error);",
  ].join("\n");
}

// ─── File generators ──────────────────────────────────────────────────────────

function generateResearchReadme(id: string, name: string, preset: PersonaPreset): string {
  const agents = preset.keyResearchAgents.join(", ");
  const today = new Date().toISOString().slice(0, 10);
  const eras = buildEraQueries(preset.type);
  const eraLines = eras.map(q =>
    "||| `deep-" + q.era + ".json` | Agent 6 (Era " + q.era + ") | Auto-generated by deep script |"
  ).join("\n");
  const advQueries = buildAdversarialQueries(preset.type, name);
  const advLines = advQueries.map(q =>
    "||| `search-" + q.category + ".json` | Agent 4 (Adversarial) | Auto-generated by deep script |"
  ).join("\n");

  return "# " + name + " \u2014 Research Archive\n" +
"|\n" +
"|> Compiled " + today + ". Research type: **" + preset.type + "**. See [distill_templates/](../distill_templates/) for methodology.\n" +
"|\n" +
"|## What's Inside\n" +
"|\n" +
"|  | File | Agent | Status |\n" +
"|--|-------|--------|\n" +
"|  | `PLAN.md` | Planning | Fill in before running research |\n" +
"|  | `00-discovery-report.md` | Discovery | Auto-generated by `pipeline.ts` |\n" +
"|  | `00-source-catalog.md` | \u2014 | Auto-generated by `pipeline.ts` (with trust weights) |\n" +
"|  | `01-tweet-statistics.md` | Agent 3 | `pipeline.ts` output (if Twitter) |\n" +
"|  | `02-published-works.md` | Agent 1 | `pipeline.ts` + manual |\n" +
"|  | `03-interview-distillation.md` | Agent 2 | Manual distillation |\n" +
"|  | `04-adversarial.md` | Agent 4 | Manual distillation |\n" +
"|  | `05-behavioral-records.md` | Agent 5 | Manual distillation |\n" +
eraLines + "\n" +
advLines + "\n" +
"|  | `triple-verify-log.md` | \u2014 | Triple verification evidence |\n" +
"|  | `validation-log.md` | \u2014 | Validation test results |\n" +
"|\n" +
"|## Research Type\n" +
"|\n" +
"|**" + preset.type + "** \u2014 " + preset.description + "\n" +
"|\n" +
"|Key research agents: " + agents + ".\n" +
"|\n" +
"|## Source Layers Targeted\n" +
"|\n" +
"|This pipeline targets 6 source layers (from `firecrawl-discovery.ts`):\n" +
"|- **Authored**: Books, letters, essays, annual reports \u2014 highest signal density\n" +
"|- **Spoken**: Interviews, podcasts, speeches \u2014 unscripted reasoning\n" +
"|- **Institutional**: SEC filings, annual reports, court docs \u2014 under accountability\n" +
"|- **Adversarial**: Criticism, investigations, lawsuits \u2014 grounds §8 Contradictions\n" +
"|- **Behavioral**: Biographies, career moves, acquisitions \u2014 what they actually do\n" +
"|- **Social**: Twitter/X, Threads (if applicable)\n" +
"|\n" +
"|## Era Breakdown\n" +
"|\n" +
"|Research is segmented into eras to prevent timeline smearing:\n" +
"|" + eras.map(q => "|  " + q.era + " | recency: " + (q.recencyDays / 365).toFixed(0) + "yr |").join("\n") + "\n" +
"|\n" +
"|## Research Checklist\n" +
"|\n" +
"|- [ ] Run `npx tsx scripts/research/1_collect/pipeline.ts " + id + " --type=" + preset.type + " --deep-research --name=\"" + name + "\"`\n" +
"|- [ ] Review `00-discovery-report.md` for coverage gaps\n" +
"|- [ ] Run deep research: `npx tsx ../personas-deep-research/" + id + "-deep.ts`\n" +
"|- [ ] Fill in PLAN.md\n" +
"|- [ ] Complete Agent distillation files\n" +
"|- [ ] Run triple verification \u2192 `triple-verify-log.md`\n" +
"|- [ ] Run validation harness \u2192 `validation-log.md`\n" +
"|- [ ] Write SKILL.md\n" +
"|- [ ] Ship\n" +
"|\n" +
"|## Reference Persona\n" +
"|\n" +
(preset.referencePersona ? "|See `skills/" + preset.referencePersona + "/research/` as format reference.|" : "|No direct reference \u2014 build from templates.|") + "\n" +
"|\n" +
"---\n" +
"|*Generated by `0_scaffold/scaffold.ts` on " + today + "*\n";
}

function generateTripleVerifyLog(id: string, name: string): string {
  return "# Triple Verification Log \u2014 " + name + "\n" +
"|\n" +
"|> Adapted from `distill_templates/TRIPLE_VERIFY.md`.\n" +
"|> Copy this file to `research/triple-verify-log.md` and fill in BEFORE writing SKILL.md §4.\n" +
"|\n" +
"|**Rule:** Pass 3/3 \u2192 Mental Model. Pass 2/3 \u2192 Decision Heuristic. Pass 1/3 \u2192 Color. Pass 0/3 \u2192 Cut.\n" +
"|\n" +
"|---\n" +
"|\n" +
"|## The Three Tests\n" +
"|\n" +
"|### Test 1 \u2014 Cross-Domain Reproduction\n" +
"|Same framework must surface in \u22652 different domains. One domain = coincidence. Two = pattern. Three+ = operating system.\n" +
"|\n" +
"|### Test 2 \u2014 Generative Power\n" +
"|The model must let you predict their stance on a problem they've never addressed publicly.\n" +
"|\n" +
"|### Test 3 \u2014 Non-Obvious / Exclusive\n" +
"|Not something any smart operator would think. Must reveal a distinctively theirs perspective.\n" +
"|\n" +
"|---\n" +
"|\n" +
"|## Candidate Log\n" +
"|\n" +
"|  | # | Candidate model | Domain 1 | Domain 2 | T1? | Novel prediction | T2? | Who disagrees? | T3? | Verdict |\n" +
"|--|---|---|-| - |:---:|- |:---:|- |:---:| - |\n" +
"|  | 1 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 2 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 3 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 4 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 5 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 6 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 7 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 8 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 9 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|  | 10 | | | | \u2610 | | \u2610 | | \u2610 | |\n" +
"|\n" +
"|**Target:** 15\u201325 candidates \u2192 3\u20137 Mental Models + 5\u201310 Heuristics.\n" +
"|\n" +
"|---\n" +
"|\n" +
"|## Promotion Ledger\n" +
"|\n" +
"|  | Slot | Name | Candidates # | Pass count |\n" +
"|--|------|------|------------|:-----------:|\n" +
"|  | Meta | | | 3/3 |\n" +
"|  | Model 1 | | | 3/3 |\n" +
"|  | Model 2 | | | 3/3 |\n" +
"|  | Model 3 | | | 3/3 |\n" +
"|  | Heuristic 1 | | | 2/3 |\n" +
"|  | Heuristic 2 | | | 2/3 |\n" +
"|\n" +
"|---\n" +
"|\n" +
"|## Anti-patterns \u2014 What NOT to promote\n" +
"|\n" +
"|- Universal virtues: \"work hard\", \"think long-term\" \u2192 cut\n" +
"|- Single-domain quirks \u2192 heuristic at best\n" +
"|- Post-hoc narratives \u2192 color only\n" +
"|- Values statements without behavioral proof \u2192 cut\n" +
"|\n" +
"|---\n" +
"|\n" +
"|*Fill in for persona: " + name + " (" + id + ")*\n";
}

function generateValidationLog(id: string, name: string): string {
  return "# Validation Harness \u2014 " + name + "\n" +
"|\n" +
"|> Adapted from `../distill_templates/VALIDATION_HARNESS.md`.\n" +
"|> Run this BEFORE shipping. Copy to `validation-log.md` in the skill folder.\n" +
"|\n" +
"|---\n" +
"|\n" +
"|## 3+1 Protocol\n" +
"|\n" +
"|### Part A \u2014 Three Known-Statement Tests\n" +
"|\n" +
"|  | # | Question | Direction match? | Notes |\n" +
"|--|---|----------|:---------------:|------|\n" +
"|  | 1 | | \u2610 | |\n" +
"|  | 2 | | \u2610 | |\n" +
"|  | 3 | | \u2610 | |\n" +
"|\n" +
"|**Threshold:** 2 of 3 must be directional matches.\n" +
"|\n" +
"|### Part B \u2014 One Novel-Question Test\n" +
"|\n" +
"|  | Question | Uncertainty acknowledged? | Fabrication risk? | Verdict |\n" +
"|--|----------|:-------------------------:|\u2610-----------------:|---------|\n" +
"|  | | \u2610 | \u2610 | Pass / Fail |\n" +
"|\n" +
"|---\n" +
"|\n" +
"|## Ship Gate\n" +
"|\n" +
"|- [ ] 2 of 3 Part A tests pass\n" +
"|- [ ] Part B passes\n" +
"|- [ ] Changelog entry drafted\n" +
"|- [ ] Source catalog committed\n" +
"|- [ ] Triple verification log committed\n" +
"|\n" +
"|---\n" +
"|\n" +
"|## Results Log\n" +
"|\n" +
"|  | Date | Persona | Part A | Part B | Changes |\n" +
"|--|------|---------|:------:|:------:|---------|\n" +
"|  | | " + name + " | | | |\n" +
"|\n" +
"|---\n" +
"|\n" +
"|*Fill in for persona: " + name + " (" + id + ")*\n";
}

// ─── Main scaffold function ───────────────────────────────────────────────────

function scaffoldPersona(
  id: string,
  name: string,
  type: PersonaType
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const preset = PRESETS[type];
  if (!preset) {
    errors.push("Unknown type: " + type + ". Valid types: " + Object.keys(PRESETS).join(", "));
    return { ok: false, errors };
  }

  const outputDir = resolve(ROOT, "../../output", id);
  const skillResearchDir = resolve(ROOT, "skills", id, "research");

  if (existsSync(skillResearchDir)) {
    const existing = resolve(skillResearchDir, "README.md");
    if (existsSync(existing)) {
      errors.push("skills/" + id + "/research/ already exists. Remove it first if you want to re-scaffold.");
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  mkdirSync(outputDir, { recursive: true });
  console.log("📁 Created: ../../output/" + id + "/");

  // PLAN.md — with era-based research section
  const planTemplate = readTemplate("DISTILL_PLAN.md");
  const eras = buildEraQueries(type);
  const eraSection = eras.map(q => {
    const topic = buildEraTopic(q.era, type, name);
    return "- **Era " + q.era + "** (`recencyDays=" + q.recencyDays + "`): " + topic;
  }).join("\n");

  const filledPlan = planTemplate
    .replace(/\{Persona Name\}/g, name)
    .replace(/\{slug\}/g, id)
    .replace(/\{N\}/g, "\u2014")
    .replace(/# Credit budget \(target per persona\)/, "# Credit budget (target per persona)\n\n**Type:** " + preset.type + " \u2014 " + preset.description)
    .replace(
      /## The 6 Collection Agents.*/s,
      "## The 6 Collection Agents (" + preset.keyResearchAgents.join(", ") + " active)\n\n**Active agents for " + preset.type + ":** " + preset.keyResearchAgents.join(", ") + ".\n**Inactive agents:** " + (["Agent 1", "Agent 2", "Agent 3", "Agent 4", "Agent 5", "Agent 6"].filter(a => !preset.keyResearchAgents.includes(a)).join(", ") || "none") + "."
    )
    .replace(
      /### Agent 6 — Biographical Timeline.*/s,
      "### Agent 6 — Biographical Timeline\n**Era-segmented queries (generalized from Buffett pattern):**\n" + eraSection
    );
  writeFileSync(resolve(outputDir, "PLAN.md"), filledPlan);
  console.log("\u2705 Created: ../../output/" + id + "/PLAN.md (era-based)");

  // TRIPLE_VERIFY.md
  const tvTemplate = readTemplate("TRIPLE_VERIFY.md");
  const filledTv = tvTemplate.replace(/\{Persona Name\}/g, name);
  writeFileSync(resolve(outputDir, "triple-verify-log.md"), filledTv);
  console.log("\u2705 Created: ../../output/" + id + "/triple-verify-log.md");

  // VALIDATION_HARNESS.md
  const vhTemplate = readTemplate("VALIDATION_HARNESS.md");
  const filledVh = vhTemplate.replace(/\{Persona Name\}/g, name);
  writeFileSync(resolve(outputDir, "validation-log.md"), filledVh);
  console.log("\u2705 Created: ../../output/" + id + "/validation-log.md");

  // SKILL_TEMPLATE.md
  const skillTemplate = readTemplate("SKILL_TEMPLATE.md");
  const filledSkill = skillTemplate.replace(/\{Name\}/g, name).replace(/\{persona-slug\}/g, id);
  writeFileSync(resolve(outputDir, "SKILL_TEMPLATE.md"), filledSkill);
  console.log("\u2705 Created: ../../output/" + id + "/SKILL_TEMPLATE.md");

  // Research archive dir
  mkdirSync(skillResearchDir, { recursive: true });
  writeFileSync(resolve(skillResearchDir, "README.md"), generateResearchReadme(id, name, preset));
  writeFileSync(resolve(skillResearchDir, "triple-verify-log.md"), generateTripleVerifyLog(id, name));
  writeFileSync(resolve(skillResearchDir, "validation-log.md"), generateValidationLog(id, name));
  console.log("\u2705 Created: skills/" + id + "/research/");

  // Deep research script
  const deepScript = generateDeepResearchScript(id, name, preset);
  const deepScriptPath = resolve(__dirname, "../personas-deep-research", id + "-deep.ts");
  writeFileSync(deepScriptPath, deepScript);
  console.log("\u2705 Created: ../personas-deep-research/" + id + "-deep.ts");

  return { ok: true, errors: [] };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(): { id: string; name: string; type: PersonaType } {
  const args = process.argv.slice(2);
  const id = args[0]?.trim() || "";
  let name = args[1]?.trim() || id;
  let type: PersonaType = "CHINESE_BUSINESS";

  for (const arg of args) {
    if (arg.startsWith("--type=")) {
      const t = arg.split("=")[1]?.toUpperCase() as PersonaType;
      if (PRESETS[t]) type = t;
    }
    if (arg.startsWith("--name=")) name = arg.split("=").slice(1).join("=").trim();
  }

  return { id, name, type };
}

function main() {
  const { id, name, type } = parseArgs();

  if (!id) {
    console.error("Usage: npx tsx scripts/research/0_scaffold/scaffold.ts <persona-id> [--type=TYPE] [--name='Full Name']");
    console.error("");
    console.error("Types:");
    for (const [key, val] of Object.entries(PRESETS)) {
      console.error("  " + key.padEnd(22) + val.description);
    }
    console.error("");
    console.error("Examples:");
    console.error("  npx tsx scripts/research/0_scaffold/scaffold.ts li-ka-shing --type=HK_ENTREPRENEUR --name='Li Ka-shing 李嘉誠'");
    console.error("  npx tsx scripts/research/0_scaffold/scaffold.ts warren-buffett --type=WESTERN_INVESTOR --name='Warren Buffett'");
    console.error("  npx tsx scripts/research/0_scaffold/scaffold.ts killa-xbt --type=TWITTER_CRYPTO --name='KillaXBT'");
    process.exit(1);
  }

  console.log("\n🚀 Scaffolding persona research: " + name + " (" + id + ")");
  console.log("   Type: " + type);
  console.log("");

  const result = scaffoldPersona(id, name, type);

  if (!result.ok) {
    console.error("\n❌ Errors:");
    for (const e of result.errors) console.error("   - " + e);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("  ✅ Scaffolding complete: " + id);
  console.log("=".repeat(60));
  console.log("");
  console.log("Next steps:");
  console.log("  1. npx tsx ../1_collect/pipeline.ts " + id + " --type=" + type + " --deep-research --name=\"" + name + "\"");
  console.log("  2. Review ../../output/" + id + "/00-discovery-report.md for coverage gaps");
  console.log("  3. npx tsx ../personas-deep-research/" + id + "-deep.ts");
  console.log("  4. Edit ../../output/" + id + "/PLAN.md");
  console.log("  5. Run distillation \u2192 fill in triple-verify-log.md");
  console.log("  6. npx tsx ../3_validate/validation-runner.ts " + id);
  console.log("  7. Write skills/" + id + "/SKILL.md");
  console.log("");
}

main();
