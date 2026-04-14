#!/usr/bin/env tsx
/**
 * warren-buffett-deep.ts
 *
 * Warren Buffett 深度研究脚本（Buffett 无 Twitter）：
 * 1. 60年股东信 (berkshirehathaway.com/letters)
 * 2. 维基百科 + 传记
 * 3. Firecrawl deep-research (5个时代)
 * 4. Firecrawl search (adversarial coverage)
 *
 * Usage:
 *   npx tsx scripts/research/warren-buffett-deep.ts
 */

try {
  const { readFileSync } = await import("fs");
  const { resolve, dirname } = await import("path");
  const { fileURLToPath } = await import("url");
  const thisFile = fileURLToPath(import.meta.url);
  const envPath = resolve(dirname(thisFile), "../../.env");
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* no .env */ }

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

async function scrapePage(
  apiKey: string,
  url: string,
  formats: ("markdown" | "html" | "json" | "extract")[] = ["markdown"]
) {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats,
      onlyMainContent: true,
      timeout: 60000,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    return {
      url,
      title: "",
      markdown: "",
      statusCode: data.statusCode || 0,
      creditsUsed: 0,
    };
  }

  return {
    url,
    title: data.data?.metadata?.title || "",
    markdown: data.data?.markdown || "",
    statusCode: data.data?.metadata?.statusCode || 200,
    creditsUsed: data.data?.metadata?.creditsUsed || 0,
  };
}

async function searchFirecrawl(
  apiKey: string,
  query: string,
  limit = 10
): Promise<any> {
  const res = await fetch(`${FIRECRAWL_BASE}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit,
    }),
  });

  return res.json();
}

async function deepResearch(
  apiKey: string,
  topic: string,
  options: { recencyDays?: number; limit?: number } = {}
) {
  const { recencyDays = 365, limit = 20 } = options;

  const res = await fetch(`${FIRECRAWL_BASE}/deep-research`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      recencyDays,
      limit,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl deep-research error ${res.status}: ${text}`);
  }

  return res.json();
}

async function pollDeepResearch(
  apiKey: string,
  jobId: string,
  maxWaitMs = 300000
) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 15000));
    const res = await fetch(`${FIRECRAWL_BASE}/deep-research/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error("Deep research failed: " + JSON.stringify(data));
    console.log(`  ⏳ Still processing... (${Math.round((Date.now() - start) / 1000)}s elapsed)`);
  }
  throw new Error("Timed out waiting for deep research");
}

// ─── Target URLs ──────────────────────────────────────────────────────────────

const scrapeTargets = [
  // High priority: Berkshire official
  {
    url: "https://en.wikipedia.org/wiki/Warren_Buffett",
    label: "Wikipedia: Warren Buffett",
    priority: "high",
    reason: "Complete biographical record, citations to primary sources",
  },
  {
    url: "https://en.wikipedia.org/wiki/Berkshire_Hathaway",
    label: "Wikipedia: Berkshire Hathaway",
    priority: "high",
    reason: "Business history, major acquisitions, financial structure",
  },
  {
    url: "https://en.wikipedia.org/wiki/Charlie_Munger",
    label: "Wikipedia: Charlie Munger",
    priority: "high",
    reason: "Munger relationship, Berkshire vice-chairman role",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/2023.html",
    label: "BRK 2023 Annual Letter",
    priority: "high",
    reason: "Most recent annual letter — latest thinking",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/2022.html",
    label: "BRK 2022 Annual Letter",
    priority: "high",
    reason: "BRK annual letter 2022",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/2020.html",
    label: "BRK 2020 Annual Letter",
    priority: "high",
    reason: "COVID crisis letter — behavioral response",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/2019.html",
    label: "BRK 2019 Annual Letter",
    priority: "high",
    reason: "BRK annual letter 2019",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/2016.html",
    label: "BRK 2016 Annual Letter",
    priority: "high",
    reason: "Apple investment beginning — decision record",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/2008.html",
    label: "BRK 2008 Annual Letter",
    priority: "high",
    reason: "Financial crisis — how Buffett thought and acted",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/1999.html",
    label: "BRK 1999 Annual Letter",
    priority: "high",
    reason: "Internet bubble — classic Buffett counter-cyclical thinking",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/1996.html",
    label: "BRK 1996 Annual Letter",
    priority: "high",
    reason: "BRK 1996 letter",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/1987.html",
    label: "BRK 1987 Annual Letter",
    priority: "high",
    reason: "Post-crash 1987 — market crash analysis",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/1980.html",
    label: "BRK 1980 Annual Letter",
    priority: "high",
    reason: "BRK 1980 letter — early Berkshire",
  },
  {
    url: "https://www.berkshirehathaway.com/letters/1977.html",
    label: "BRK 1977 Annual Letter",
    priority: "high",
    reason: "BRK 1977 — earliest available letter",
  },
  {
    url: "https://www.berkshirehathaway.com/annual.html",
    label: "BRK Annual Reports Page",
    priority: "medium",
    reason: "Index of all annual reports",
  },

  // Medium: Interviews and coverage
  {
    url: "https://fortune.com/author/warren-buffett/",
    label: "Fortune: Warren Buffett columns",
    priority: "medium",
    reason: "50+ Buffett-written Fortune columns (Allen & Buffett series)",
  },
  {
    url: "https://www.cnbc.com/buffett/",
    label: "CNBC: Warren Buffett coverage",
    priority: "medium",
    reason: "Current Buffett news and AGM coverage",
  },
];

// ─── Deep Research Queries (5 eras) ───────────────────────────────────────────

const deepResearchQueries = [
  {
    era: "1-Origins",
    topic: "Warren Buffett early life 1930-1956: Omaha childhood, paper route, Benjamin Graham mentorship, Graham-Newman partnership, first investments, value investing philosophy origins, early partnership letters",
    recencyDays: 18250,
    limit: 15,
  },
  {
    era: "2-Partnership-Years",
    topic: "Warren Buffett partnership 1956-1969: how he ran the partnership, returns achieved, why he closed it in 1969, relationship with Bill Ruane, Sequoia Fund origin, transition to Berkshire Hathaway, first Berkshire purchase in 1962",
    recencyDays: 18250,
    limit: 15,
  },
  {
    era: "3-Berkshire-Accumulation",
    topic: "Warren Buffett Berkshire Hathaway 1970-1999: See's Candies acquisition 1972, float-based insurance model, National Indemnity, Geico investment, Mr. Market philosophy, intrinsic value concept, Wesco Financial acquisition, how Munger changed his thinking, textile business mistake, 'The Superinvestors of Graham-and-Doddsville'",
    recencyDays: 10950,
    limit: 15,
  },
  {
    era: "4-Global-Fame",
    topic: "Warren Buffett 1999-2008: internet bubble and 'Carnival' speech, why he didn't buy tech, dot-com crash vindication, LTCM crisis 1998, MidAmerican Energy acquisition, Burlington Northern acquisition plan, 2008 financial crisis response, Goldman Sachs preferred shares, 'Quiet! I am thinking' quote, Tom Knapptman underwriting ad",
    recencyDays: 9125,
    limit: 15,
  },
  {
    era: "5-Recent-Era",
    topic: "Warren Buffett 2009-2026: Apple investment decision 2016-2024, $700 billion buyback program, Kraft Heinz deal, Occidental Petroleum stake, succession planning Ajit Jain Greg Abel, Berkshire's massive cash position $168 billion, pandemic response, 'Berkshire will remain a fortress' letter, why he sold Apple in 2024, current investment philosophy",
    recencyDays: 1825,
    limit: 20,
  },
];

// ─── Search Queries (adversarial + decision records) ──────────────────────────

const searchQueries = [
  {
    category: "adversarial",
    query: "Warren Buffett criticism why he no longer beats the market academic evidence",
  },
  {
    category: "adversarial",
    query: "Warren Buffett mistakes failures Berkshire Textile Dexterity shoe",
  },
  {
    category: "adversarial",
    query: "Buffett Berkshire overvalued buybacks destroys value academic criticism",
  },
  {
    category: "adversarial",
    query: "Warren Buffett stock buybacks hypocrisy SEC criticism",
  },
  {
    category: "adversarial",
    query: "Buffett Munger relationship economics compensation Berkshire structure",
  },
  {
    category: "adversarial",
    query: "Warren Buffett political donations Gates Foundation philanthropy critique",
  },
  {
    category: "adversarial",
    query: "Buffett Apple sell 2024 billion gains Tim Cook relationship",
  },
  {
    category: "decision-records",
    query: "Berkshire Hathaway 13F filings history Apple Bank of America investments timeline",
  },
  {
    category: "decision-records",
    query: "Warren Buffett Coca-Cola acquisition 1988 decision reasoning Mr Market",
  },
  {
    category: "decision-records",
    query: "Berkshire Hathaway See's Candies Charlie Munger decision analysis 1972",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("❌ VITE_FIRECRAWL_API_KEY not set");
    process.exit(1);
  }

  const { writeFileSync, mkdirSync } = await import("fs");
  const timestamp = new Date().toISOString().slice(0, 10);

  mkdirSync("scripts/research/data", { recursive: true });
  mkdirSync("scripts/research/output/warren-buffett", { recursive: true });

  console.log("🚀 Warren Buffett 深度研究开始");
  console.log("   特点: 无 Twitter → 用股东信 + 传记替代 Agent 3 (Social DNA)");
  console.log("");

  // ── Phase 1: Scrape ─────────────────────────────────────────────────────────
  console.log("=== Phase 1: 批量抓取 ===\n");

  const results: any[] = [];
  let totalCredits = 0;

  const priorityGroups = ["high", "medium", "low"] as const;
  for (const priority of priorityGroups) {
    const group = scrapeTargets.filter((t) => t.priority === priority);
    if (group.length === 0) continue;

    console.log(`\n[${priority.toUpperCase()} PRIORITY — ${group.length} targets]`);

    for (const target of group) {
      const start = Date.now();
      try {
        const result = await scrapePage(apiKey, target.url);
        const elapsed = Date.now() - start;

        results.push({
          ...result,
          label: target.label,
          priority: target.priority,
          reason: target.reason,
        });

        totalCredits += result.creditsUsed;

        if (result.statusCode === 200) {
          const chars = result.markdown.length;
          console.log(`  ✅ ${result.title || target.url}`);
          console.log(`     ${result.statusCode} | ${chars.toLocaleString()} chars | ${result.creditsUsed} credits | ${elapsed}ms`);
        } else {
          console.log(`  ❌ ${target.label} — HTTP ${result.statusCode}`);
        }
      } catch (e: any) {
        console.log(`  ❌ ${target.label} — ${e.message}`);
        results.push({ url: target.url, label: target.label, priority: target.priority, reason: target.reason, markdown: "", statusCode: 0, creditsUsed: 0, error: e.message });
      }

      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Save scrape results
  writeFileSync(
    `scripts/research/data/warren-buffett-scrape-${timestamp}.json`,
    JSON.stringify(results, null, 2)
  );
  console.log(`\n💾 抓取数据已保存: scripts/research/data/warren-buffett-scrape-${timestamp}.json`);

  // ── Phase 2: Deep Research (5 eras) ─────────────────────────────────────────
  console.log("\n=== Phase 2: Deep Research — 5 Eras ===\n");

  const deepResults: any[] = [];

  for (const q of deepResearchQueries) {
    console.log(`📡 [${q.era}] ${q.topic.slice(0, 60)}...`);
    try {
      const initRes = await deepResearch(apiKey, q.topic, { recencyDays: q.recencyDays, limit: q.limit });
      const jobId = initRes.id || initRes.jobId;
      if (jobId) {
        console.log(`   🆔 Job: ${jobId} — polling (may take 1-3 min)...`);
        const result = await pollDeepResearch(apiKey, jobId);
        deepResults.push({ era: q.era, ...result });
        writeFileSync(
          `scripts/research/data/warren-buffett-deep-${q.era}-${timestamp}.json`,
          JSON.stringify(result, null, 2)
        );
        console.log(`   ✅ [${q.era}] Deep research complete — ${result.data?.sources?.length || 0} sources`);
      }
    } catch (e: any) {
      console.log(`   ❌ [${q.era}] Deep research failed: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }

  // ── Phase 3: Search (adversarial + decision records) ────────────────────────
  console.log("\n=== Phase 3: Search — Adversarial + Decision Records ===\n");

  const searchResults: any[] = [];

  for (const q of searchQueries) {
    console.log(`🔍 [${q.category}] ${q.query.slice(0, 60)}...`);
    try {
      const result = await searchFirecrawl(apiKey, q.query, 10);
      searchResults.push({ query: q.query, category: q.category, ...result });
      const chars = result.data?.length || 0;
      console.log(`   ✅ ${chars} results`);
    } catch (e: any) {
      console.log(`   ❌ ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  writeFileSync(
    `scripts/research/data/warren-buffett-search-${timestamp}.json`,
    JSON.stringify(searchResults, null, 2)
  );

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("📊 研究汇总");
  console.log("═".repeat(60));
  console.log(`\n抓取: ${results.filter((r) => r.statusCode === 200).length}/${scrapeTargets.length} 成功`);
  console.log(`深度研究: ${deepResults.length}/${deepResearchQueries.length} 完成`);
  console.log(`搜索: ${searchResults.length}/${searchQueries.length} 完成`);
  console.log(`总消耗 credits: ~${totalCredits}`);
  console.log(`\n💾 数据保存至 scripts/research/data/warren-buffett-*-${timestamp}.json`);
}

main().catch(console.error);
