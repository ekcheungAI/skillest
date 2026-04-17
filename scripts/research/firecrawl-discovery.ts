#!/usr/bin/env tsx
/**
 * firecrawl-discovery.ts
 *
 * Search-driven source discovery module.
 * Replaces the hardcoded buildResearchUrlsForType() approach.
 *
 * For each target persona, runs parallel category searches to discover
 * the best available sources, classifies them by type and trust weight,
 * and returns a structured evidence ledger.
 *
 * The 6 source layers discovered:
 *   1. Social layer       — Twitter/X, Threads posts
 *   2. Authored layer      — Books, letters, essays, blog posts, annual letters
 *   3. Spoken layer        — Interviews, podcasts, speeches, conference talks
 *   4. Institutional layer — Annual reports, SEC filings, court filings, regulatory docs
 *   5. Adversarial layer   — Criticism, investigations, lawsuits, short-seller reports
 *   6. Behavioral layer   — Career moves, acquisitions, exits, public bets
 *
 * Usage:
 *   npx tsx scripts/research/firecrawl-discovery.ts "Warren Buffett" --type=WESTERN_INVESTOR
 *   npx tsx scripts/research/firecrawl-discovery.ts "Jack Ma" --type=CHINESE_BUSINESS
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

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PersonaResearchType =
  | "TWITTER_CRYPTO"
  | "CHINESE_BUSINESS"
  | "HK_ENTREPRENEUR"
  | "WESTERN_INVESTOR";

export type SourceLayer =
  | "social"
  | "authored"
  | "spoken"
  | "institutional"
  | "adversarial"
  | "behavioral";

export type SourceType =
  | "primary-authored"   // Books, letters, essays — person speaks in their own words
  | "primary-spoken"      // Interviews, podcasts, speeches — unscripted
  | "institutional-record" // Annual reports, SEC filings, court docs — under accountability
  | "secondary-profile"   // Wikipedia, biographies, news profiles
  | "adversarial-critique" // Criticism, investigations, lawsuits
  | "low-confidence";     // Random blog posts, low-signal commentary

export interface DiscoveredSource {
  url: string;
  title: string;
  layer: SourceLayer;
  sourceType: SourceType;
  trustWeight: number;     // 1.0–3.0, higher = more reliable
  insightDensity: "high" | "medium" | "low";
  relevanceScore: number;  // 0–100, how on-topic
  snippet?: string;
  discoveredVia?: string;  // the search query that found this
}

export interface DiscoveryResult {
  personaId: string;
  type: PersonaResearchType;
  discoveredAt: string;
  totalSources: number;
  byLayer: Record<SourceLayer, DiscoveredSource[]>;
  byType: Record<SourceType, DiscoveredSource[]>;
  topSources: DiscoveredSource[];      // top 20 by trustWeight × relevance
  priorityScrapeTargets: DiscoveredSource[]; // top 15 by insight density
  metadata: {
    searchesRun: number;
    avgRelevanceScore: number;
    coverageGaps: string[]; // layers with no or few sources
  };
}

// ─── Trust weight matrix ─────────────────────────────────────────────────────────

const TRUST_WEIGHTS: Record<SourceType, number> = {
  "primary-authored": 3.0,
  "institutional-record": 2.8,
  "primary-spoken": 2.5,
  "adversarial-critique": 2.2,
  "secondary-profile": 1.5,
  "low-confidence": 0.8,
};

// ─── Search query templates by type and persona type ─────────────────────────────

interface SearchQuery {
  query: string;
  layer: SourceLayer;
  sourceType: SourceType;
  insightDensity: "high" | "medium" | "low";
  count?: number;
}

function buildSearchQueries(name: string, type: PersonaResearchType): SearchQuery[] {
  const q = (q_str: string, layer: SourceLayer, st: SourceType, density: "high" | "medium" | "low", cnt = 10) =>
    ({ query: q_str, layer, sourceType: st, insightDensity: density, count: cnt });

  const baseQueries: SearchQuery[] = [
    // Primary authored — highest signal density
    q(`"${name}" book OR autobiography OR memoir OR essay OR "annual letter" OR "shareholder letter"`, "authored", "primary-authored", "high"),
    q(`"${name}" site:medium.com OR site:substack.com OR site:linkedin.com OR site:fortune.com OR site:bloomberg.com`, "authored", "primary-authored", "high"),
    q(`"${name}" letters to shareholders OR " Buffett letters" OR " Munger letters"`, "authored", "primary-authored", "high"),

    // Institutional records
    q(`"${name}" SEC filing OR 13F OR 10-K OR annual report OR shareholder meeting`, "institutional", "institutional-record", "high"),
    q(`"${name}" court case OR lawsuit OR regulatory filing OR EDGAR`, "institutional", "institutional-record", "high"),

    // Primary spoken — interviews and speeches
    q(`"${name}" interview podcast OR "in conversation with" OR "speech" OR "talk" OR "conference"`, "spoken", "primary-spoken", "high"),
    q(`"${name}" TED talk OR keynote OR commencement address OR "lectures"`, "spoken", "primary-spoken", "medium"),

    // Adversarial — critical coverage
    q(`"${name}" criticism OR scandal OR investigation OR lawsuit OR controversy OR failure OR mistake`, "adversarial", "adversarial-critique", "high"),
    q(`"${name}" short seller OR "accused of" OR "under investigation" OR "regulatory"`, "adversarial", "adversarial-critique", "medium"),

    // Behavioral — career moves and decisions
    q(`"${name}" acquisition OR investment OR "bought" OR "sold" OR "hired" OR "fired" OR "stepped down"`, "behavioral", "institutional-record", "medium"),
    q(`"${name}" biography timeline OR "early life" OR "career history" OR "milestones"`, "behavioral", "secondary-profile", "low"),

    // Secondary — profiles and reference
    q(`${name} Wikipedia biography`, "behavioral", "secondary-profile", "medium"),
  ];

  // Type-specific augmentations
  switch (type) {
    case "CHINESE_BUSINESS":
      return [
        ...baseQueries,
        q(`"${name}" 管理哲学 OR 投资哲学 OR 商业策略 OR 演讲 OR 采访`, "spoken", "primary-spoken", "high"),
        q(`"${name}" 书籍 OR 著作 OR 自传 OR 演讲集 OR 微博 OR 公众号`, "authored", "primary-authored", "high"),
        q(`"${name}" 年报 OR 业绩 OR 股东大会 OR 股价 OR 投资决策`, "institutional", "institutional-record", "high"),
        q(`"${name}" 批评 OR 争议 OR 调查 OR 诉讼 OR 失败案例`, "adversarial", "adversarial-critique", "high"),
        q(`"${name}" site:zh.wikipedia.org OR site:baike.baidu.com OR site:finance.sina.com.cn OR site:36kr.com`, "behavioral", "secondary-profile", "medium"),
      ];

    case "HK_ENTREPRENEUR":
      return [
        ...baseQueries,
        q(`"${name}" Hong Kong OR 深圳 OR 房地产 OR 商业 OR 采访 OR 演讲`, "spoken", "primary-spoken", "high"),
        q(`"${name}" 长实 OR 和黄 OR 港灯 OR 屈臣氏 OR 投资 OR 收购`, "institutional", "institutional-record", "high"),
        q(`"${name}" 批评 OR 争议 OR 调查 OR 诉讼 OR 失败`, "adversarial", "adversarial-critique", "high"),
        q(`"${name}" site:scmp.com OR site:bloomberg.com OR site:ft.com OR site:hk01.com`, "behavioral", "secondary-profile", "medium"),
      ];

    case "WESTERN_INVESTOR":
      return [
        q(`"${name}" investment philosophy OR "value investing" OR "strategy" OR "approach" book OR letter`, "authored", "primary-authored", "high"),
        q(`"${name}" Warren Buffett OR Charlie Munger OR Berkshire Hathaway shareholder letter`, "authored", "primary-authored", "high"),
        q(`"${name}" SEC filing OR 13F OR 10-K annual report Berkshire`, "institutional", "institutional-record", "high"),
        q(`"${name}" 1999 OR 2008 OR 2020 OR 2022 OR crisis OR bubble OR crash OR "in conversation" OR interview`, "spoken", "primary-spoken", "high"),
        q(`"${name}" criticism OR "no longer works" OR "buybacks" OR "overvalued" OR "mistakes" OR academic`, "adversarial", "adversarial-critique", "high"),
        q(`"${name}" biography OR early life OR Omaha OR Graham OR mentorship`, "behavioral", "secondary-profile", "medium"),
        q(`"${name}" Coca-Cola OR Apple OR See's Candies OR Geico OR acquisition decision reasoning`, "behavioral", "institutional-record", "high"),
        q(`"${name}" succession OR Ajit Jain OR Greg Abel OR cash position`, "institutional", "institutional-record", "medium"),
      ];

    case "TWITTER_CRYPTO":
      return [
        q(`"${name}" trading strategy OR methodology OR framework OR "how I trade" OR thread`, "authored", "primary-authored", "high"),
        q(`"${name}" interview podcast OR "in conversation" OR YouTube OR speaking`, "spoken", "primary-spoken", "high"),
        q(`"${name}" criticism OR "rug pull" OR scandal OR SEC OR CFTC OR investigation`, "adversarial", "adversarial-critique", "high"),
        q(`"${name}" on-chain data OR wallet OR transaction OR "bought" OR "sold" OR token`, "behavioral", "institutional-record", "high"),
        q(`"${name}" site:coindesk.com OR site:decrypt.co OR site:theblock.co OR site:dlnews.com`, "behavioral", "secondary-profile", "medium"),
      ];
  }

  return baseQueries;
}

// ─── Firecrawl API helpers ───────────────────────────────────────────────────────

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

async function searchFirecrawl(apiKey: string, query: string, limit = 10): Promise<any> {
  const res = await fetch(`${FIRECRAWL_BASE}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl search error ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Source URL dedup ────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip trailing slashes and common tracking params
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function isLikelyDocument(url: string): boolean {
  const docExts = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".csv"];
  return docExts.some(ext => url.toLowerCase().includes(ext));
}

function inferSourceType(url: string, title: string, snippet: string): { sourceType: SourceType; layer: SourceLayer } {
  const lower = (url + " " + title + " " + snippet).toLowerCase();

  // Primary authored
  if (
    lower.includes("letter to shareholder") ||
    lower.includes("annual letter") ||
    lower.includes("berkshirehathaway.com/letters") ||
    lower.includes("book") && lower.includes("chapter") ||
    lower.includes("substack") ||
    lower.includes("medium.com/@") ||
    lower.includes("fortune.com/author/") ||
    lower.includes("bloomberg.com/opinion") ||
    lower.includes("wsj.com/articles") && lower.includes("opinion")
  ) {
    return { sourceType: "primary-authored", layer: "authored" };
  }

  // Institutional
  if (
    lower.includes("sec.gov") ||
    lower.includes("edgar") ||
    lower.includes("10-k") ||
    lower.includes("13f") ||
    lower.includes("annual report") ||
    lower.includes("courtlistener") ||
    lower.includes("docket") ||
    lower.includes("lawsuit") ||
    lower.includes("regulatory")
  ) {
    return { sourceType: "institutional-record", layer: "institutional" };
  }

  // Primary spoken
  if (
    lower.includes("podcast") ||
    lower.includes("youtube.com/watch") ||
    lower.includes("ted.com/talk") ||
    lower.includes("lexfridman.com") ||
    lower.includes("joerogan.com") ||
    lower.includes("podcasts.google") ||
    lower.includes("spotify.com") ||
    lower.includes("speech") ||
    lower.includes("conference") ||
    lower.includes("commencement") ||
    lower.includes("lecture")
  ) {
    return { sourceType: "primary-spoken", layer: "spoken" };
  }

  // Adversarial
  if (
    lower.includes("accused") ||
    lower.includes("investigation") ||
    lower.includes("scandal") ||
    lower.includes("short-seller") ||
    lower.includes("fraud") ||
    lower.includes("lawsuit") ||
    lower.includes("criticism") ||
    lower.includes("failure") ||
    lower.includes("mistake") &&
    (lower.includes("critic") || lower.includes("wrong") || lower.includes("fail"))
  ) {
    return { sourceType: "adversarial-critique", layer: "adversarial" };
  }

  // Secondary profile
  if (
    lower.includes("wikipedia") ||
    lower.includes("biography") ||
    lower.includes("profile") ||
    lower.includes("about")
  ) {
    return { sourceType: "secondary-profile", layer: "behavioral" };
  }

  return { sourceType: "low-confidence", layer: "behavioral" };
}

function scoreRelevance(url: string, title: string, snippet: string, name: string): number {
  let score = 30; // base score

  const text = (url + " " + title + " " + snippet).toLowerCase();
  const nameLower = name.toLowerCase();

  // Strong name match
  if (text.includes(nameLower)) score += 25;

  // Document types — high signal
  if (isLikelyDocument(url)) score += 15;

  // Primary source domains — high signal
  const highSignalDomains = [
    "berkshirehathaway.com",
    "sec.gov",
    "edgar",
    "medium.com/@",
    "substack.com/@",
    "fortune.com/author/",
    "bloomberg.com/opinion",
    "wsj.com/articles",
    "cornell.edu",
    "ycombinator.com/news",
  ];
  for (const d of highSignalDomains) {
    if (url.includes(d)) { score += 20; break; }
  }

  // Social media — medium signal (useful for vocabulary but not primary source)
  const socialDomains = ["twitter.com", "x.com", "threads.net", "reddit.com"];
  for (const d of socialDomains) {
    if (url.includes(d)) { score += 10; break; }
  }

  // Wikipedia — known secondary
  if (url.includes("wikipedia.org")) score += 15;

  // News sites — medium signal
  const newsDomains = ["bloomberg.com", "reuters.com", "ft.com", "wsj.com", "nytimes.com",
    "scmp.com", "hk01.com", "yicai.com", "36kr.com", "sina.com", "qq.com"];
  for (const d of newsDomains) {
    if (url.includes(d)) { score += 15; break; }
  }

  // Generic search engine URLs — penalize
  if (url.includes("google.com/search") || url.includes("bing.com/search") || url.includes("duckduckgo")) {
    score -= 30;
  }

  // Video results without transcripts — lower signal for text research
  if (url.includes("youtube.com/results")) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ─── Main discovery function ─────────────────────────────────────────────────────

export async function discoverSources(
  name: string,
  type: PersonaResearchType,
  options: { dryRun?: boolean; maxQueries?: number; maxSourcesPerLayer?: number } = {}
): Promise<DiscoveryResult> {
  const { maxQueries = 20, maxSourcesPerLayer = 10 } = options;
  const apiKey = process.env.VITE_FIRECRAWL_API_KEY!;

  if (!apiKey) throw new Error("VITE_FIRECRAWL_API_KEY not set");

  const queries = buildSearchQueries(name, type);
  const selectedQueries = queries.slice(0, maxQueries);

  const seenUrls = new Set<string>();
  const allSources: DiscoveredSource[] = [];
  let searchesRun = 0;

  console.log(`\n🔍 Discovery: "${name}" (${type})`);
  console.log(`   Running ${selectedQueries.length} search queries across 6 layers...`);

  for (const sq of selectedQueries) {
    try {
      console.log(`   [${sq.layer}] ${sq.query.slice(0, 70)}...`);
      const result = await searchFirecrawl(apiKey, sq.query, sq.count || 10);
      searchesRun++;

      const results = result.data || [];

      for (const item of results) {
        const url = normalizeUrl(item.url || item.link || "");
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        const title = item.title || item.name || url;
        const snippet = item.description || item.excerpt || item.snippet || "";
        const relevance = scoreRelevance(url, title, snippet, name);

        const { sourceType, layer } = inferSourceType(url, title, snippet);
        const trustWeight = TRUST_WEIGHTS[sourceType];

        allSources.push({
          url,
          title,
          layer,
          sourceType,
          trustWeight,
          insightDensity: sq.insightDensity,
          relevanceScore: relevance,
          snippet: snippet.slice(0, 200),
          discoveredVia: sq.query.slice(0, 80),
        });
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn(`   ⚠️  Search failed: ${e.message}`);
    }
  }

  // Deduplicate by URL across layers
  const dedupedMap = new Map<string, DiscoveredSource>();
  for (const src of allSources) {
    if (!dedupedMap.has(src.url)) {
      dedupedMap.set(src.url, src);
    }
  }

  const deduped = Array.from(dedupedMap.values());

  // Group by layer
  const byLayer = {
    social: deduped.filter(s => s.layer === "social"),
    authored: deduped.filter(s => s.layer === "authored"),
    spoken: deduped.filter(s => s.layer === "spoken"),
    institutional: deduped.filter(s => s.layer === "institutional"),
    adversarial: deduped.filter(s => s.layer === "adversarial"),
    behavioral: deduped.filter(s => s.layer === "behavioral"),
  };

  // Group by type
  const byType = {
    "primary-authored": deduped.filter(s => s.sourceType === "primary-authored"),
    "primary-spoken": deduped.filter(s => s.sourceType === "primary-spoken"),
    "institutional-record": deduped.filter(s => s.sourceType === "institutional-record"),
    "adversarial-critique": deduped.filter(s => s.sourceType === "adversarial-critique"),
    "secondary-profile": deduped.filter(s => s.sourceType === "secondary-profile"),
    "low-confidence": deduped.filter(s => s.sourceType === "low-confidence"),
  };

  // Top sources by composite score (trust × relevance)
  const topSources = [...deduped]
    .sort((a, b) => (b.trustWeight * b.relevanceScore) - (a.trustWeight * a.relevanceScore))
    .slice(0, 20);

  // Priority scrape targets: prefer high insight density + high relevance
  const priorityScrapeTargets = [...deduped]
    .filter(s => s.sourceType !== "low-confidence")
    .sort((a, b) => {
      const densityScore = { high: 3, medium: 2, low: 1 };
      return (densityScore[b.insightDensity] * b.relevanceScore) -
             (densityScore[a.insightDensity] * a.relevanceScore);
    })
    .slice(0, 15);

  // Detect coverage gaps
  const coverageGaps: string[] = [];
  const layers: SourceLayer[] = ["authored", "spoken", "institutional", "adversarial", "behavioral"];
  for (const layer of layers) {
    if (byLayer[layer].length === 0) {
      coverageGaps.push(`No ${layer} sources discovered — manual research needed`);
    } else if (byLayer[layer].length < 3) {
      coverageGaps.push(`Few ${layer} sources (${byLayer[layer].length}) — expand search`);
    }
  }

  const result: DiscoveryResult = {
    personaId: name,
    type,
    discoveredAt: new Date().toISOString(),
    totalSources: deduped.length,
    byLayer,
    byType,
    topSources,
    priorityScrapeTargets,
    metadata: {
      searchesRun,
      avgRelevanceScore: deduped.length
        ? Math.round(deduped.reduce((s, src) => s + src.relevanceScore, 0) / deduped.length)
        : 0,
      coverageGaps,
    },
  };

  return result;
}

// ─── Markdown report generator ───────────────────────────────────────────────────

export function discoveryReport(result: DiscoveryResult): string {
  const lines: string[] = [];

  lines.push(`# Source Discovery Report — ${result.personaId}`);
  lines.push("");
  lines.push(`> Generated: ${result.discoveredAt} | ${result.totalSources} sources found | ${result.metadata.searchesRun} searches run`);
  lines.push("");

  // Coverage summary
  lines.push("## Layer Coverage");
  lines.push("");
  lines.push("| Layer | Sources | Top Types |");
  lines.push("|-------|--------:|-----------|");
  const layerNames: Record<SourceLayer, string> = {
    social: "Social (Twitter/X, Threads)",
    authored: "Authored (Books, Letters, Essays)",
    spoken: "Spoken (Interviews, Podcasts, Speeches)",
    institutional: "Institutional (Filings, Annual Reports)",
    adversarial: "Adversarial (Criticism, Investigations)",
    behavioral: "Behavioral (Biographies, Careers)",
  };
  for (const [layer, sources] of Object.entries(result.byLayer)) {
    const topTypes = [...new Set(sources.map(s => s.sourceType))].slice(0, 2).join(", ") || "—";
    lines.push(`| ${layerNames[layer as SourceLayer] || layer} | ${sources.length} | ${topTypes} |`);
  }
  lines.push("");

  // Coverage gaps
  if (result.metadata.coverageGaps.length > 0) {
    lines.push("## ⚠️  Coverage Gaps");
    lines.push("");
    for (const gap of result.metadata.coverageGaps) {
      lines.push(`- ⚠️  ${gap}`);
    }
    lines.push("");
  }

  // Top 20 sources by quality
  lines.push("## Top 20 Sources (Trust × Relevance)");
  lines.push("");
  lines.push("| # | Score | Layer | Type | Weight | Title |");
  lines.push("|--:|------:|-------|------|------:|------|");
  for (let i = 0; i < result.topSources.length; i++) {
    const src = result.topSources[i];
    const score = Math.round(src.trustWeight * src.relevanceScore);
    const title = src.title.slice(0, 50);
    lines.push(`| ${i + 1} | ${score} | ${src.layer} | ${src.sourceType} | ${src.trustWeight.toFixed(1)} | [${title}](${src.url}) |`);
  }
  lines.push("");

  // Priority scrape targets
  lines.push("## Priority Scrape Targets (Top 15)");
  lines.push("");
  lines.push("| # | Title | Layer | Insight |");
  lines.push("|--:|------|-------|--------:|");
  for (let i = 0; i < result.priorityScrapeTargets.length; i++) {
    const src = result.priorityScrapeTargets[i];
    const title = src.title.slice(0, 55);
    lines.push(`| ${i + 1} | [${title}](${src.url}) | ${src.layer} | ${src.insightDensity} |`);
  }
  lines.push("");

  // Source type breakdown
  lines.push("## Source Type Distribution");
  lines.push("");
  lines.push("| Type | Count | Avg Relevance |");
  lines.push("|------|------:|---------------:|");
  for (const [st, sources] of Object.entries(result.byType)) {
    if (sources.length === 0) continue;
    const avgRel = Math.round(sources.reduce((s, src) => s + src.relevanceScore, 0) / sources.length);
    lines.push(`| ${st} | ${sources.length} | ${avgRel} |`);
  }
  lines.push("");

  // Recommendations
  lines.push("## Recommendations");
  lines.push("");
  const primaryAuthored = result.byType["primary-authored"].length;
  const primarySpoken = result.byType["primary-spoken"].length;
  const institutional = result.byType["institutional-record"].length;
  const adversarial = result.byType["adversarial-critique"].length;

  if (primaryAuthored === 0) {
    lines.push("- ⚠️  **No primary authored sources found** — search for books, annual letters, essays directly");
  } else if (primaryAuthored < 3) {
    lines.push(`- 📚 Found ${primaryAuthored} authored sources — good start, look for more books/letters`);
  } else {
    lines.push(`- ✅ Found ${primaryAuthored} authored sources — solid long-form corpus`);
  }

  if (primarySpoken === 0) {
    lines.push("- 🎙️  **No interview/podcast sources found** — key for understanding unscripted reasoning");
  } else if (primarySpoken < 3) {
    lines.push(`- 🎙️ Found ${primarySpoken} spoken sources — expand with more interviews`);
  } else {
    lines.push(`- ✅ Found ${primarySpoken} spoken sources`);
  }

  if (institutional === 0) {
    lines.push("- 📋 No institutional records found — look for SEC filings, annual reports, court docs");
  } else {
    lines.push(`- 📋 Found ${institutional} institutional records — good for behavioral proof`);
  }

  if (adversarial === 0) {
    lines.push("- ⚔️  **No adversarial sources** — add adversarial queries to ground §8 Contradictions");
  } else if (adversarial < 2) {
    lines.push(`- ⚔️ Found ${adversarial} adversarial sources — expand to ensure 3–6 contradictions`);
  } else {
    lines.push(`- ✅ Found ${adversarial} adversarial sources — enough for §8 Contradictions`);
  }

  lines.push("");
  lines.push("*Generated by `firecrawl-discovery.ts` — replace hardcoded URL templates*");

  return lines.join("\n");
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const name = args.find(a => !a.startsWith("--")) || "";
  const typeArg = args.find(a => a.startsWith("--type="))?.replace("--type=", "") || "TWITTER_CRYPTO";
  const dryRun = args.includes("--dry-run");
  const maxQueries = parseInt(
    args.find(a => a.startsWith("--max-queries="))?.replace("--max-queries=", "") || "20"
  );

  if (!name) {
    console.error("Usage: npx tsx scripts/research/firecrawl-discovery.ts <name> [--type=TYPE] [--dry-run] [--max-queries=N]");
    console.error("  npx tsx scripts/research/firecrawl-discovery.ts \"Warren Buffett\" --type=WESTERN_INVESTOR");
    console.error("  npx tsx scripts/research/firecrawl-discovery.ts \"Jack Ma\" --type=CHINESE_BUSINESS");
    console.error("\nTypes: TWITTER_CRYPTO | CHINESE_BUSINESS | HK_ENTREPRENEUR | WESTERN_INVESTOR");
    process.exit(1);
  }

  const type = typeArg as PersonaResearchType;

  if (!["TWITTER_CRYPTO", "CHINESE_BUSINESS", "HK_ENTREPRENEUR", "WESTERN_INVESTOR"].includes(type)) {
    console.error(`Unknown type: ${type}`);
    process.exit(1);
  }

  console.log(`\n🚀 Source Discovery`);
  console.log(`   Name: ${name}`);
  console.log(`   Type: ${type}`);
  console.log(`   Max queries: ${maxQueries}`);

  const result = await discoverSources(name, type, { maxQueries });

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log(`  DISCOVERY RESULTS: ${name}`);
  console.log("═".repeat(60));
  console.log(`  Total sources: ${result.totalSources}`);
  console.log(`  Searches run: ${result.metadata.searchesRun}`);
  for (const [layer, sources] of Object.entries(result.byLayer)) {
    if (sources.length > 0) {
      console.log(`  ${(layer + ":").padEnd(15)} ${sources.length} sources`);
    }
  }
  console.log(`  Avg relevance: ${result.metadata.avgRelevanceScore}`);
  if (result.metadata.coverageGaps.length > 0) {
    console.log(`  ⚠️  Coverage gaps: ${result.metadata.coverageGaps.length}`);
    for (const gap of result.metadata.coverageGaps) {
      console.log(`     • ${gap}`);
    }
  }
  console.log("═".repeat(60));

  // Save results
  if (!dryRun) {
    const { writeFileSync, mkdirSync } = await import("fs");
    const { resolve } = await import("path");
    const dataDir = resolve("scripts/research/data");
    const outDir = resolve("scripts/research/output", name.replace(/\s+/g, "-").toLowerCase());
    mkdirSync(dataDir, { recursive: true });
    mkdirSync(outDir, { recursive: true });

    const jsonOut = resolve(dataDir, `discovery-${name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(jsonOut, JSON.stringify(result, null, 2));
    console.log(`\n💾 JSON saved: ${jsonOut}`);

    const mdOut = resolve(outDir, "00-discovery-report.md");
    writeFileSync(mdOut, discoveryReport(result));
    console.log(`📄 Markdown saved: ${mdOut}`);

    // Also save priority scrape targets as a scrape-ready list
    const scrapeTargets = result.priorityScrapeTargets.map(src => ({
      url: src.url,
      label: src.title.slice(0, 60),
      priority: src.insightDensity === "high" ? "high" : "medium",
      reason: `${src.layer} / ${src.sourceType} — trust: ${src.trustWeight}`,
    }));
    const targetsOut = resolve(dataDir, `scrape-targets-${name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(targetsOut, JSON.stringify(scrapeTargets, null, 2));
    console.log(`🎯 Targets saved: ${targetsOut}`);
  }
}

main().catch(console.error);
