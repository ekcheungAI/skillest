#!/usr/bin/env tsx
/**
 * pipeline.ts
 *
 * Orchestrates the full persona research pipeline:
 * 1. Scrape tweets from Twitter/X (if handle has Twitter)
 * 2. Deep-research via Firecrawl
 * 3. Generate structured markdown research files aligned with distill_templates
 *
 * Usage:
 *   npx tsx scripts/research/1_collect/pipeline.ts KillaXBT
 *   npx tsx scripts/research/1_collect/pipeline.ts KillaXBT --count 300
 *   npx tsx scripts/research/1_collect/pipeline.ts KillaXBT --skip-tweets
 *   npx tsx scripts/research/1_collect/pipeline.ts KillaXBT --deep-research
 */

// Load .env variables automatically
try {
  const { readFileSync } = await import("fs");
  const { resolve, dirname } = await import("path");
  const { fileURLToPath } = await import("url");

  const thisFile = fileURLToPath(import.meta.url);
  const envPath = resolve(dirname(thisFile), "../../.env");
  const envContent = readFileSync(envPath, "utf-8");

  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* no .env found — rely on CI environment variables */ }

import { scrapeTwitter } from "../twitter-scraper.js";
import { scrapeThreads } from "../threads-scraper.js";
import {
  scrapePage,
  deepResearch,
  buildResearchUrlsForType,
  type PersonaResearchType,
} from "../firecrawl-research.js";
import {
  discoverSources,
  discoveryReport,
  type DiscoveredSource,
  type SourceLayer,
} from "../firecrawl-discovery.js";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// ─── Source type tracking ─────────────────────────────────────────────────────

interface ScrapedSource extends DiscoveredSource {
  statusCode: number;
  markdown: string;
  creditsUsed: number;
  charsCollected: number;
  layer: SourceLayer;
}

interface SourceClassification {
  primaryAuthored: number;
  primarySpoken: number;
  institutionalRecord: number;
  adversarialCritique: number;
  secondaryProfile: number;
  lowConfidence: number;
  total: number;
}

function classifySources(sources: ScrapedSource[]): SourceClassification {
  const cls: SourceClassification = {
    primaryAuthored: 0,
    primarySpoken: 0,
    institutionalRecord: 0,
    adversarialCritique: 0,
    secondaryProfile: 0,
    lowConfidence: 0,
    total: sources.length,
  };
  for (const s of sources) {
    switch (s.sourceType) {
      case "primary-authored": cls.primaryAuthored++; break;
      case "primary-spoken": cls.primarySpoken++; break;
      case "institutional-record": cls.institutionalRecord++; break;
      case "adversarial-critique": cls.adversarialCritique++; break;
      case "secondary-profile": cls.secondaryProfile++; break;
      case "low-confidence": cls.lowConfidence++; break;
    }
  }
  return cls;
}

// ─── Long-form document ingestion helpers ─────────────────────────────────────

function isDocumentUrl(url: string): boolean {
  const docExts = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"];
  return docExts.some(ext => url.toLowerCase().includes(ext));
}

async function scrapeWithRetry(
  firecrawlKey: string,
  url: string,
  maxRetries = 2
): Promise<{ result: any; creditsUsed: number }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapePage(firecrawlKey, url);
      return { result, creditsUsed: result.creditsUsed || 0 };
    } catch (e: any) {
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

// ─── CLI ────────────────────────────────────────────────────────────────────

interface PipelineOptions {
  maxTweets: number;
  skipTweets: boolean;
  skipThreads: boolean;
  skipWeb: boolean;
  skipDiscovery: boolean;
  skipLongform: boolean;
  deepResearch: boolean;
  type: PersonaResearchType;
  personaName?: string;
}

function parseArgs(): { handle: string; options: PipelineOptions } {
  const args = process.argv.slice(2);
  const handle = args.find((a) => !a.startsWith("--"))?.replace("@", "") || "";
  const options: PipelineOptions = {
    maxTweets: 500,
    skipTweets: false,
    skipThreads: false,
    skipWeb: false,
    skipDiscovery: false,
    skipLongform: false,
    deepResearch: false,
    type: "TWITTER_CRYPTO",
  };

  for (const arg of args) {
    if (arg.startsWith("--count=")) options.maxTweets = parseInt(arg.split("=")[1]);
    if (arg === "--skip-tweets") options.skipTweets = true;
    if (arg === "--skip-threads") options.skipThreads = true;
    if (arg === "--skip-web") options.skipWeb = true;
    if (arg === "--skip-discovery") options.skipDiscovery = true;
    if (arg === "--skip-longform") options.skipLongform = true;
    if (arg === "--deep-research") options.deepResearch = true;
    if (arg.startsWith("--type=")) options.type = arg.split("=")[1] as PersonaResearchType;
    if (arg.startsWith("--name=")) options.personaName = arg.split("=").slice(1).join("=");
  }

  return { handle, options };
}

// ─── Enhanced tweet analysis ─────────────────────────────────────────────────

const EN_STOPWORDS = new Set([
  "https", "http", "that", "this", "with", "from", "have", "will",
  "just", "like", "would", "could", "should", "been", "were", "they",
  "their", "what", "when", "which", "your", "more", "some", "into",
  "over", "also", "than", "them", "then", "very", "only", "about",
  "after", "back", "want", "need", "make", "know", "think", "take",
  "come", "here", "there", "year", "being", "other", "these", "those",
]);

function detectLang(text: string): "en" | "zh" | "mixed" {
  const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const enChars = (text.match(/[a-zA-Z]/g) || []).length;
  if (zhChars > enChars * 0.3) return "zh";
  if (enChars > 0) return "en";
  return "mixed";
}

interface TweetAnalysis {
  totalCount: number;
  enCount: number;
  zhCount: number;
  followerCount: number;
  dateRange: { start: string | null; end: string | null };
  avgTweetsPerDay: number;
  lengthDist: { lt50: number; between50_140: number; between140_280: number; gt280: number };
  typeDist: { original: number; reply: number; retweet: number };
  engagementStats: { avgLikes: number; avgRetweets: number; avgViews: number; totalViews: number };
  dayOfWeekStats: Record<string, { count: number; avgLikes: number }>;
  byMonth: Record<string, number>;
  enVocab: { phrase: string; count: number }[];
  zhVocab: { phrase: string; count: number }[];
  emojiStats: { emoji: string; count: number }[];
  topTweets: { text: string; likes: number; date: string; lang: string }[];
}

function analyzeTweets(tweets: any[]): TweetAnalysis {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const enWords: Record<string, number> = {};
  const zhWords: Record<string, number> = {};
  const emojis: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const dayStats: Record<string, { count: number; likes: number }> = {};
  const dates: string[] = [];
  let enCount = 0, zhCount = 0;
  let lt50 = 0, between50_140 = 0, between140_280 = 0, gt280 = 0;
  let original = 0, reply = 0, retweet = 0;
  let totalLikes = 0, totalRetweets = 0, totalViews = 0;

  for (const tweet of tweets) {
    const text = tweet.text || "";
    const lang = detectLang(text);
    const cleanText = text.replace(/https?:\/\/\S+/g, "").trim();
    const len = cleanText.length;

    if (lang === "en") enCount++;
    else if (lang === "zh") zhCount++;
    else if (lang === "mixed") { enCount++; zhCount++; }

    // Length distribution
    if (len < 50) lt50++;
    else if (len <= 140) between50_140++;
    else if (len <= 280) between140_280++;
    else gt280++;

    // Type distribution
    if (text.startsWith("RT @")) retweet++;
    else if (tweet.isReply || tweet.conversationId !== tweet.id) reply++;
    else original++;

    // Engagement
    totalLikes += tweet.likeCount || 0;
    totalRetweets += tweet.retweetCount || 0;
    totalViews += tweet.viewCount || 0;

    // Month
    const month = tweet.createdAt?.slice(0, 7) || "";
    if (month) byMonth[month] = (byMonth[month] || 0) + 1;

    // Day of week
    if (tweet.createdAt) {
      const dow = weekdays[new Date(tweet.createdAt).getDay()];
      if (!dayStats[dow]) dayStats[dow] = { count: 0, likes: 0 };
      dayStats[dow].count++;
      dayStats[dow].likes += tweet.likeCount || 0;
      dates.push(tweet.createdAt);
    }

    // English vocabulary
    if (lang === "en" || lang === "mixed") {
      const words = cleanText
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w: string) => w.length > 3);
      for (const w of words) {
        if (!EN_STOPWORDS.has(w)) {
          enWords[w] = (enWords[w] || 0) + 1;
        }
      }
    }

    // Chinese vocabulary
    if (lang === "zh" || lang === "mixed") {
      const chars = (cleanText.match(/[\u4e00-\u9fff]{2,}/g) || []);
      for (const w of chars) {
        zhWords[w] = (zhWords[w] || 0) + 1;
      }
    }

    // Emoji frequency
    const emojiMatches = text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]/gu) || [];
    for (const e of emojiMatches) {
      emojis[e] = (emojis[e] || 0) + 1;
    }
  }

  const sortedDates = dates.filter(Boolean).sort();
  const firstDate = sortedDates[0] || null;
  const lastDate = sortedDates[sortedDates.length - 1] || null;
  const daysActive = firstDate && lastDate
    ? Math.max(1, Math.round((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const avgPerDay = Math.round((tweets.length / daysActive) * 10) / 10;

  const topEnVocab = Object.entries(enWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([phrase, count]) => ({ phrase, count }));

  const topZhVocab = Object.entries(zhWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([phrase, count]) => ({ phrase, count }));

  const topEmojis = Object.entries(emojis)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }));

  const topTweets = [...tweets]
    .sort((a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 10)
    .map((t: any) => ({
      text: t.text,
      likes: t.likeCount || 0,
      date: t.createdAt || "",
      lang: detectLang(t.text || ""),
    }));

  return {
    totalCount: tweets.length,
    enCount,
    zhCount,
    followerCount: tweets[0]?.author?.followers || 0,
    dateRange: { start: firstDate, end: lastDate },
    avgTweetsPerDay: avgPerDay,
    lengthDist: { lt50, between50_140, between140_280, gt280 },
    typeDist: { original, reply, retweet },
    engagementStats: {
      avgLikes: tweets.length ? Math.round(totalLikes / tweets.length) : 0,
      avgRetweets: tweets.length ? Math.round(totalRetweets / tweets.length) : 0,
      avgViews: tweets.length ? Math.round(totalViews / tweets.length) : 0,
      totalViews,
    },
    dayOfWeekStats: Object.fromEntries(
      weekdays.map((d) => [d, dayStats[d] || { count: 0, avgLikes: 0 }])
    ),
    byMonth,
    enVocab: topEnVocab,
    zhVocab: topZhVocab,
    emojiStats: topEmojis,
    topTweets,
  };
}

// ─── Markdown output generators ───────────────────────────────────────────────

function generateTweetStatisticsMd(
  handle: string,
  analysis: TweetAnalysis,
  profileName: string
): string {
  const total = analysis.totalCount;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxDay = Math.max(...days.map(d => analysis.dayOfWeekStats[d]?.count || 0), 1);
  const maxMonth = Math.max(...Object.values(analysis.byMonth), 1);

  const lines: string[] = [];
  lines.push(`# ${profileName} — Tweet Statistics`);
  lines.push("");
  lines.push(`> Generated ${new Date().toISOString().slice(0, 10)} | ${total.toLocaleString()} tweets analyzed`);
  lines.push("");

  // Volume summary
  lines.push("## 1. Volume Overview");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total tweets | ${total.toLocaleString()} |`);
  lines.push(`| English | ${analysis.enCount.toLocaleString()} |`);
  lines.push(`| Chinese | ${analysis.zhCount.toLocaleString()} |`);
  lines.push(`| Followers | ~${analysis.followerCount.toLocaleString()} |`);
  lines.push(`| Date range | ${analysis.dateRange.start?.slice(0, 10) ?? "?"} → ${analysis.dateRange.end?.slice(0, 10) ?? "?"} |`);
  lines.push(`| Avg/day | ${analysis.avgTweetsPerDay} |`);
  lines.push("");

  // Length distribution
  lines.push("## 2. Tweet Length Distribution");
  lines.push("");
  const pct = (n: number) => total ? `${Math.round((n / total) * 100)}%` : "0%";
  lines.push(`| Bucket | Count | % |`);
  lines.push(`|--------|------:|--:|`);
  lines.push(`| <50 chars | ${analysis.lengthDist.lt50.toLocaleString()} | ${pct(analysis.lengthDist.lt50)} |`);
  lines.push(`| 50–140 chars | ${analysis.lengthDist.between50_140.toLocaleString()} | ${pct(analysis.lengthDist.between50_140)} |`);
  lines.push(`| 140–280 chars | ${analysis.lengthDist.between140_280.toLocaleString()} | ${pct(analysis.lengthDist.between140_280)} |`);
  lines.push(`| >280 chars | ${analysis.lengthDist.gt280.toLocaleString()} | ${pct(analysis.lengthDist.gt280)} |`);
  lines.push("");

  // Type distribution
  lines.push("## 3. Tweet Type Distribution");
  lines.push("");
  lines.push(`| Type | Count | % |`);
  lines.push(`|------|------:|--:|`);
  lines.push(`| Original | ${analysis.typeDist.original.toLocaleString()} | ${pct(analysis.typeDist.original)} |`);
  lines.push(`| Reply | ${analysis.typeDist.reply.toLocaleString()} | ${pct(analysis.typeDist.reply)} |`);
  lines.push(`| Retweet | ${analysis.typeDist.retweet.toLocaleString()} | ${pct(analysis.typeDist.retweet)} |`);
  lines.push("");

  // Engagement
  lines.push("## 4. Engagement Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Avg likes/tweet | ${analysis.engagementStats.avgLikes.toLocaleString()} |`);
  lines.push(`| Avg retweets/tweet | ${analysis.engagementStats.avgRetweets.toLocaleString()} |`);
  lines.push(`| Avg views/tweet | ${analysis.engagementStats.avgViews.toLocaleString()} |`);
  lines.push(`| Total views | ${(analysis.engagementStats.totalViews / 1e6).toFixed(1)}M |`);
  lines.push("");

  // Day of week
  lines.push("## 5. Day-of-Week Pattern");
  lines.push("");
  lines.push("| Day | Count | Bar | Avg Likes |");
  lines.push("|-----|------:|-----|----------:|");
  for (const d of days) {
    const stats = analysis.dayOfWeekStats[d];
    const bar = "█".repeat(Math.round(((stats?.count || 0) / maxDay) * 20));
    const avgLikes = stats?.count ? Math.round((stats.avgLikes || 0) / stats.count) : 0;
    lines.push(`| ${d} | ${stats?.count || 0} | ${bar} | ${avgLikes.toLocaleString()} |`);
  }
  lines.push("");

  // Monthly volume (top 10 months)
  lines.push("## 6. Monthly Volume (Top 10)");
  lines.push("");
  const topMonths = Object.entries(analysis.byMonth)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  lines.push("| Month | Count | Bar |");
  lines.push("|-------|------:|-----|");
  for (const [month, count] of topMonths) {
    const bar = "█".repeat(Math.round((count / maxMonth) * 20));
    lines.push(`| ${month} | ${count} | ${bar} |`);
  }
  lines.push("");

  // English vocabulary
  if (analysis.enVocab.length > 0) {
    lines.push("## 7. English Vocabulary (Top 20)");
    lines.push("");
    lines.push("| Word | Count |");
    lines.push("|------|------:|");
    for (const { phrase, count } of analysis.enVocab.slice(0, 20)) {
      lines.push(`| ${phrase} | ${count} |`);
    }
    lines.push("");
  }

  // Chinese vocabulary
  if (analysis.zhVocab.length > 0) {
    lines.push("## 8. Chinese Vocabulary (Top 20)");
    lines.push("");
    lines.push("| 词汇 | 频次 |");
    lines.push("|------|------:|");
    for (const { phrase, count } of analysis.zhVocab.slice(0, 20)) {
      lines.push(`| ${phrase} | ${count} |`);
    }
    lines.push("");
  }

  // Emojis
  if (analysis.emojiStats.length > 0) {
    lines.push("## 9. Emoji Fingerprint");
    lines.push("");
    lines.push("| Emoji | Count |");
    lines.push("|-------|------:|");
    for (const { emoji, count } of analysis.emojiStats) {
      lines.push(`| ${emoji} | ${count} |`);
    }
    lines.push("");
  }

  // Top tweets
  lines.push("## 10. Top 10 Most-Liked Tweets");
  lines.push("");
  for (let i = 0; i < analysis.topTweets.length; i++) {
    const t = analysis.topTweets[i];
    lines.push(`### ${i + 1}. ❤️ ${t.likes.toLocaleString()} — ${t.date?.slice(0, 10) ?? ""}`);
    lines.push("");
    lines.push(`> ${t.text}`);
    lines.push("");
  }

  return lines.join("\n");
}

function generateSourceCatalogMd(
  handle: string,
  webPages: any[],
  classification: SourceClassification | null,
  discoveryResult: any | null
): string {
  const lines: string[] = [];
  lines.push("# Source Catalog");
  lines.push("");
  lines.push(`> Compiled ${new Date().toISOString().slice(0, 10)} | ${webPages.length} web pages scraped`);
  lines.push("");

  // Source classification summary
  if (classification) {
    lines.push("## Source Classification Summary");
    lines.push("");
    lines.push("| Type | Count | Trust Weight | Description |");
    lines.push("|------|------:|-------------:|-------------|");
    const typeMeta: Record<string, { desc: string; weight: number }> = {
      "primaryAuthored": { desc: "Books, letters, essays — person speaks in their own words", weight: 3.0 },
      "primarySpoken": { desc: "Interviews, podcasts, speeches — unscripted", weight: 2.5 },
      "institutionalRecord": { desc: "Annual reports, SEC filings, court docs", weight: 2.8 },
      "adversarialCritique": { desc: "Criticism, investigations, lawsuits", weight: 2.2 },
      "secondaryProfile": { desc: "Wikipedia, biographies, news profiles", weight: 1.5 },
      "lowConfidence": { desc: "Random blog posts, low-signal commentary", weight: 0.8 },
    };
    const typeKeys: Array<keyof SourceClassification> = [
      "primaryAuthored", "primarySpoken", "institutionalRecord",
      "adversarialCritique", "secondaryProfile", "lowConfidence",
    ];
    for (const key of typeKeys) {
      if (key === "total") continue;
      const count = classification[key] as number;
      if (count === 0) continue;
      const meta = typeMeta[key];
      lines.push(`| ${key} | ${count} | ${meta.weight.toFixed(1)} | ${meta.desc} |`);
    }
    lines.push("");
  }

  // Group by layer (if available)
  const layerGroups: Record<string, any[]> = {};
  for (const page of webPages) {
    const layer = page.layer || "unknown";
    if (!layerGroups[layer]) layerGroups[layer] = [];
    layerGroups[layer].push(page);
  }

  const layerNames: Record<string, string> = {
    social: "Social (Twitter/X, Threads)",
    authored: "Authored (Books, Letters, Essays)",
    spoken: "Spoken (Interviews, Podcasts, Speeches)",
    institutional: "Institutional (Filings, Annual Reports)",
    adversarial: "Adversarial (Criticism, Investigations)",
    behavioral: "Behavioral (Biographies, Careers)",
    unknown: "Unknown",
  };

  lines.push("## Sources by Layer");
  lines.push("");
  for (const [layer, pages] of Object.entries(layerGroups).sort((a, b) => b[1].length - a[1].length)) {
    if (pages.length === 0) continue;
    lines.push(`### ${layerNames[layer] || layer} (${pages.length} source${pages.length !== 1 ? "s" : ""})`);
    lines.push("");
    lines.push(`| Status | Title | Chars | Weight | Insight |`);
    lines.push(`|--------|-------|------:|-------:|--------:|`);
    for (const p of pages) {
      const title = (p.title || p.url || "").slice(0, 55);
      const statusIcon = p.statusCode === 200 ? "✅" : "❌";
      const weight = p.trustWeight ? p.trustWeight.toFixed(1) : "—";
      const insight = p.insightDensity || "—";
      lines.push(`| ${statusIcon} ${p.statusCode} | [${title}](${p.url}) | ${(p.markdown?.length || 0).toLocaleString()} | ${weight} | ${insight} |`);
    }
    lines.push("");
  }

  // Legacy domain-based grouping for non-classified sources
  const unclassified = webPages.filter(p => !p.layer);
  if (unclassified.length > 0) {
    const groups: Record<string, any[]> = {};
    for (const page of unclassified) {
      try {
        const domain = new URL(page.url).hostname.replace("www.", "");
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push(page);
      } catch {
        const key = "other";
        if (!groups[key]) groups[key] = [];
        groups[key].push(page);
      }
    }
    lines.push("## Sources by Domain (unclassified)");
    lines.push("");
    for (const [domain, pages] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
      lines.push(`### ${domain} (${pages.length} page${pages.length !== 1 ? "s" : ""})`);
      lines.push("");
      lines.push(`| Status | Title | Chars |`);
      lines.push(`|--------|-------|------:|`);
      for (const p of pages) {
        const title = (p.title || p.url || "").slice(0, 55);
        const statusIcon = p.statusCode === 200 ? "✅" : "❌";
        lines.push(`| ${statusIcon} ${p.statusCode} | [${title}](${p.url}) | ${(p.markdown?.length || 0).toLocaleString()} |`);
      }
      lines.push("");
    }
  }

  // Deep research sources
  if (discoveryResult?.data?.sources?.length) {
    lines.push("## Deep Research Sources");
    lines.push("");
    lines.push("| # | Source |");
    lines.push("|--|--------|");
    for (let i = 0; i < discoveryResult.data.sources.length; i++) {
      const src = discoveryResult.data.sources[i];
      lines.push(`| ${i + 1} | ${src} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Research pipeline ───────────────────────────────────────────────────────

async function runPipeline(
  handle: string,
  options: PipelineOptions
): Promise<{ handle: string; analysis: TweetAnalysis | null; webPages: any[]; deepData: any | null; discoveryResult: any | null; sourceClassification: SourceClassification | null }> {
  const apiKey = process.env.VITE_TWITTER_API_KEY!;
  const firecrawlKey = process.env.VITE_FIRECRAWL_API_KEY!;

  const outDir = resolve("../output", handle);
  const dataDir = resolve("../data");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  let tweetData: any = null;
  let threadsData: any = null;
  let analysis: TweetAnalysis | null = null;

  // Step 1: Twitter scraping (if applicable)
  if (!options.skipTweets) {
    console.log("\n📡 Step 1: Scraping Twitter/X...");
    try {
      tweetData = await scrapeTwitter(apiKey, handle, { maxTweets: options.maxTweets });
      writeFileSync(resolve(dataDir, `${handle}_tweets.json`), JSON.stringify(tweetData, null, 2));
      console.log(`   ✅ Saved ${tweetData.tweets.length} tweets`);

      // Analyze
      analysis = analyzeTweets(tweetData.tweets);

      // Output markdown
      const tweetMd = generateTweetStatisticsMd(handle, analysis, tweetData.profile?.name || handle);
      writeFileSync(resolve(outDir, "01-tweet-statistics.md"), tweetMd);
      console.log(`   ✅ Generated 01-tweet-statistics.md`);
    } catch (e: any) {
      console.warn(`   ⚠️  Twitter scraping failed: ${e.message}`);
    }
  }

  // Step 1b: Threads scraping (if --skip-threads not set)
  const threadsAvailable = !!process.env.VITE_META_THREADS_TOKEN;
  if (!options.skipThreads && threadsAvailable) {
    console.log("\n🧵 Step 1b: Scraping Threads...");
    try {
      threadsData = await scrapeThreads(handle, { maxPosts: options.maxTweets });
      writeFileSync(resolve(dataDir, `${handle}_threads.json`), JSON.stringify(threadsData, null, 2));
      console.log(`   ✅ Saved ${threadsData.posts.length} Threads posts`);
    } catch (e: any) {
      console.warn(`   ⚠️  Threads scraping failed: ${e.message}`);
    }
  } else if (!threadsAvailable) {
    console.log("\n🧵 Step 1b: Skipped (VITE_META_THREADS_TOKEN not set)");
  }

  // ─── Step 0: Discovery (NEW — search-driven source finding) ─────────────────
  let discoveryResult: any | null = null;
  let priorityTargets: DiscoveredSource[] = [];

  if (!options.skipDiscovery) {
    console.log("\n🔍 Step 0: Search-driven source discovery...");
    const personaName = options.personaName || handle;
    try {
      discoveryResult = await discoverSources(personaName, options.type, { maxQueries: 20 });
      priorityTargets = discoveryResult.priorityScrapeTargets || [];

      writeFileSync(
        resolve(dataDir, `${handle}_discovery.json`),
        JSON.stringify(discoveryResult, null, 2)
      );
      const discReport = discoveryReport(discoveryResult);
      writeFileSync(resolve(outDir, "00-discovery-report.md"), discReport);
      console.log(`   ✅ Discovery: ${discoveryResult.totalSources} sources across 6 layers`);
      console.log(`   ✅ Generated 00-discovery-report.md`);
      console.log(`   📊 Avg relevance: ${discoveryResult.metadata.avgRelevanceScore} | Searches: ${discoveryResult.metadata.searchesRun}`);

      if (discoveryResult.metadata.coverageGaps.length > 0) {
        console.log(`   ⚠️  Coverage gaps:`);
        for (const gap of discoveryResult.metadata.coverageGaps.slice(0, 3)) {
          console.log(`      • ${gap}`);
        }
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Discovery failed: ${e.message} — falling back to hardcoded URLs`);
      options.skipDiscovery = true;
    }
  } else {
    console.log("\n🔍 Step 0: Skipped (--skip-discovery)");
  }

  // ─── Step 2: Web research (now uses discovery targets OR fallback URLs) ──────
  let webPages: any[] = [];
  let sourceClassification: SourceClassification | null = null;
  if (!options.skipWeb) {
    console.log("\n🌐 Step 2: Web research via Firecrawl...");

    // Determine URLs: discovery targets take priority, fallback to hardcoded
    const urls = options.skipDiscovery
      ? buildResearchUrlsForType(handle, options.type)
      : priorityTargets.map((src: DiscoveredSource) => ({
          url: src.url,
          label: src.title?.slice(0, 60) || src.url,
          priority: src.insightDensity === "high" ? "high" as const : "medium" as const,
          reason: `${src.layer} / ${src.sourceType} (trust: ${src.trustWeight})`,
        }));

    if (options.skipDiscovery) {
      console.log(`   (Discovery skipped — using ${urls.length} hardcoded fallback URLs)`);
    } else {
      console.log(`   Scraping ${urls.length} priority targets from discovery`);
    }

    webPages = [];
    for (const target of urls) {
      const label = typeof target === "string" ? target : target.label;
      const url = typeof target === "string" ? target : target.url;
      console.log(`   📄 ${label}: ${url.slice(0, 70)}`);
      try {
        const result = await scrapePage(firecrawlKey, url);
        webPages.push({
          ...result,
          layer: typeof target !== "string" && "reason" in target ? (target.reason || "unknown") : "unknown",
          insightDensity: typeof target !== "string" && "insightDensity" in target ? target.insightDensity : "unknown",
        });
        await new Promise((r) => setTimeout(r, 400));
      } catch (e: any) {
        console.warn(`   ⚠️  Failed: ${e.message}`);
      }
    }

    const successful = webPages.filter(p => p.statusCode === 200 && p.markdown.length > 100);

    // Enrich with discovery metadata where available
    if (discoveryResult && !options.skipDiscovery) {
      const srcMap = new Map(discoveryResult.topSources.map((s: any) => [s.url, s]));
      for (const page of webPages) {
        const disc = srcMap.get(page.url);
        if (disc) {
          page.sourceType = disc.sourceType;
          page.layer = disc.layer;
          page.trustWeight = disc.trustWeight;
          page.insightDensity = disc.insightDensity;
          page.relevanceScore = disc.relevanceScore;
        }
      }
    }

    // Classify scraped sources
    const scrapedWithClass = successful.filter(p => p.sourceType);
    if (scrapedWithClass.length > 0) {
      sourceClassification = classifySources(scrapedWithClass);
    }

    writeFileSync(resolve(dataDir, `${handle}_web.json`), JSON.stringify(webPages, null, 2));
    const totalChars = successful.reduce((s: number, p: any) => s + p.markdown.length, 0);
    console.log(
      `   ✅ Scraped ${successful.length}/${webPages.length} pages ` +
      `(${totalChars.toLocaleString()} total chars)`
    );

    // Source catalog with classification
    const catalogMd = generateSourceCatalogMd(handle, successful, sourceClassification, discoveryResult);
    writeFileSync(resolve(outDir, "00-source-catalog.md"), catalogMd);
    console.log(`   ✅ Generated 00-source-catalog.md (with trust weights)`);

    // Long-form documents report (if any)
    const docs = successful.filter(p => isDocumentUrl(p.url));
    if (docs.length > 0) {
      console.log(`   📄 ${docs.length} long-form documents scraped:`);
      for (const doc of docs) {
        console.log(`      • ${doc.title?.slice(0, 60) || doc.url} — ${doc.markdown.length.toLocaleString()} chars`);
      }
    }
  }

  // Step 3: Deep research
  let deepData: any | null = null;
  if (options.deepResearch) {
    console.log("\n🔬 Step 3: Deep research...");
    const topicsByType: Record<PersonaResearchType, string> = {
      TWITTER_CRYPTO: `${handle} trading methodology analysis`,
      CHINESE_BUSINESS: `${handle} management philosophy investment strategy biography`,
      HK_ENTREPRENEUR: `${handle} Hong Kong real estate business strategy management`,
      WESTERN_INVESTOR: `${handle} investment philosophy strategy biography`,
    };
    try {
      deepData = await deepResearch(firecrawlKey, topicsByType[options.type] || handle, {
        recencyDays: 730,
        limit: 20,
      });
      writeFileSync(resolve(dataDir, `${handle}_deep.json`), JSON.stringify(deepData, null, 2));
      console.log(`   ✅ Deep research complete`);
    } catch (e: any) {
      console.warn(`   ⚠️  Deep research failed: ${e.message}`);
    }
  }

  // Step 4: Generate PLAN.md from template
  console.log("\n📋 Step 4: Generating PLAN.md...");
  const profileName = tweetData?.profile?.name || handle;
  const planMd = [
    `# Distillation Plan — ${profileName}`,
    "",
    `> Generated ${new Date().toISOString().slice(0, 10)}. Fill in before spending API credits.`,
    "",
    "## Pre-flight qualification",
    "",
    "- [ ] **Kill-switch check**: Book or 60+ min adversarial source exists? (If no, this will be hagiography)",
    "- [ ] **Data check**: 2,000+ public utterances available?",
    "- [ ] **Contradiction check**: At least one documented value vs behavior contradiction?",
    "- [ ] **Audience check**: Relevant to AI builders / operators / vibe coders?",
    "- [ ] **Time check**: 15–25 hours of reading available?",
    "",
    "## Collection checklist",
    "",
    "- [ ] Agent 1 (Published works):",
    "- [ ] Agent 2 (Interviews):",
    "- [ ] Agent 3 (Social DNA): " + (analysis ? `${analysis.totalCount} tweets` : "N/A — no Twitter"),
    "- [ ] Agent 4 (Adversarial):",
    "- [ ] Agent 5 (Behavioral records):",
    "- [ ] Agent 6 (Biographical timeline):",
    "",
    "## Credit budget",
    "",
    "- TwitterAPI.io: ~$2–8",
    "- Firecrawl /scrape: ~$2–4",
    "- Firecrawl /deep-research: ~$3–6",
    "- Firecrawl /search: ~$1–2",
    "- **Total target: $8–20**",
    "",
  ].join("\n");
  writeFileSync(resolve(outDir, "PLAN.md"), planMd);
  console.log(`   ✅ Generated PLAN.md`);

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log(`  RESEARCH OUTPUT: @${handle}`);
  console.log("═".repeat(60));
  console.log(`  Output dir: ../output/${handle}/`);
  if (analysis) {
    console.log(`  Tweets: ${analysis.totalCount.toLocaleString()} (EN: ${analysis.enCount}, ZH: ${analysis.zhCount})`);
    console.log(`  Avg/day: ${analysis.avgTweetsPerDay}`);
    console.log(`  Avg likes: ${analysis.engagementStats.avgLikes.toLocaleString()}`);
  }
  console.log(`  Discovery: ${discoveryResult ? `${discoveryResult.totalSources} sources` : "skipped"}`);
  if (sourceClassification) {
    console.log(`  Sources: ${sourceClassification.primaryAuthored} authored / ${sourceClassification.primarySpoken} spoken / ${sourceClassification.institutionalRecord} institutional / ${sourceClassification.adversarialCritique} adversarial`);
  }
  console.log(`  Web pages: ${webPages.length}`);
  console.log(`  Deep research: ${options.deepResearch ? "ON" : "off"}`);
  console.log("═".repeat(60) + "\n");

  return { handle, analysis, webPages, deepData, discoveryResult, sourceClassification };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const { handle, options } = parseArgs();

  if (!handle) {
    console.error("Usage: npx tsx scripts/research/1_collect/pipeline.ts <handle> [options]");
    console.error("\nOptions:");
    console.error("  --count=N          Number of tweets to fetch (default: 500)");
    console.error("  --skip-tweets      Skip Twitter scraping (for non-Twitter personas)");
    console.error("  --skip-threads     Skip Threads scraping (for personas without Threads)");
    console.error("  --skip-web         Skip web research");
    console.error("  --skip-discovery   Skip search-driven discovery (use hardcoded fallback URLs)");
    console.error("  --skip-longform    Skip long-form document ingestion");
    console.error("  --deep-research    Run Firecrawl deep-research");
    console.error("  --type=TYPE        Persona type: TWITTER_CRYPTO | CHINESE_BUSINESS | HK_ENTREPRENEUR | WESTERN_INVESTOR");
    console.error("  --name=NAME        Full display name for discovery queries (default: handle)");
    console.error("\nTypes:");
    console.error("  TWITTER_CRYPTO     Default. Crypto/trading persona with active Twitter.");
    console.error("  CHINESE_BUSINESS   No Twitter. Chinese-language sources. 中文人物.");
    console.error("  HK_ENTREPRENEUR   Hong Kong entrepreneur. Wikipedia/zh + industry media.");
    console.error("  WESTERN_INVESTOR   Western investor. EN Wikipedia + annual reports.");
    console.error("\nPipeline steps (default: all enabled):");
    console.error("  1. Discovery    — Search-driven source finding across 6 layers");
    console.error("  2. Twitter      — Tweet scraping + vocabulary analysis");
    console.error("  3. Threads       — Threads post scraping (if token available)");
    console.error("  4. Web scrape   — Priority URLs from discovery (with trust weights)");
    console.error("  5. Deep research — Era-segmented deep research queries");
    process.exit(1);
  }

  if (!options.skipWeb && !process.env.VITE_FIRECRAWL_API_KEY) {
    console.error("Error: VITE_FIRECRAWL_API_KEY not set in .env");
    process.exit(1);
  }

  if (!options.skipTweets && !process.env.VITE_TWITTER_API_KEY) {
    console.error("Error: VITE_TWITTER_API_KEY not set in .env");
    process.exit(1);
  }

  if (!options.skipThreads && !process.env.VITE_META_THREADS_TOKEN) {
    console.error("Error: VITE_META_THREADS_TOKEN not set in .env");
    process.exit(1);
  }

  console.log(`\n🚀 Persona Research Pipeline`);
  console.log(`   Handle: @${handle}`);
  console.log(`   Type: ${options.type}`);
  console.log(`   Max tweets: ${options.maxTweets}`);
  console.log(`   Deep research: ${options.deepResearch ? "ON" : "OFF"}`);

  await runPipeline(handle, options);
}

main().catch(console.error);
