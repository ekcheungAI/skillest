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
 *   npx tsx scripts/research/pipeline.ts KillaXBT
 *   npx tsx scripts/research/pipeline.ts KillaXBT --count 300
 *   npx tsx scripts/research/pipeline.ts KillaXBT --skip-tweets
 *   npx tsx scripts/research/pipeline.ts KillaXBT --deep-research
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

import { scrapeTwitter } from "./twitter-scraper.js";
import { scrapeThreads } from "./threads-scraper.js";
import {
  scrapePage,
  deepResearch,
  buildResearchUrlsForType,
  type PersonaResearchType,
} from "./firecrawl-research.js";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// ─── CLI ────────────────────────────────────────────────────────────────────

interface PipelineOptions {
  maxTweets: number;
  skipTweets: boolean;
  skipThreads: boolean;
  skipWeb: boolean;
  deepResearch: boolean;
  type: PersonaResearchType;
}

function parseArgs(): { handle: string; options: PipelineOptions } {
  const args = process.argv.slice(2);
  const handle = args.find((a) => !a.startsWith("--"))?.replace("@", "") || "";
  const options: PipelineOptions = {
    maxTweets: 500,
    skipTweets: false,
    skipThreads: false,
    skipWeb: false,
    deepResearch: false,
    type: "TWITTER_CRYPTO",
  };

  for (const arg of args) {
    if (arg.startsWith("--count=")) options.maxTweets = parseInt(arg.split("=")[1]);
    if (arg === "--skip-tweets") options.skipTweets = true;
    if (arg === "--skip-threads") options.skipThreads = true;
    if (arg === "--skip-web") options.skipWeb = true;
    if (arg === "--deep-research") options.deepResearch = true;
    if (arg.startsWith("--type=")) options.type = arg.split("=")[1] as PersonaResearchType;
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
  deepData: any | null
): string {
  const lines: string[] = [];
  lines.push("# Source Catalog");
  lines.push("");
  lines.push(`> Compiled ${new Date().toISOString().slice(0, 10)} | ${webPages.length} web pages scraped`);
  lines.push("");

  // Group by domain
  const groups: Record<string, { url: string; title: string; chars: number; status: number }[]> = {};
  for (const page of webPages) {
    try {
      const domain = new URL(page.url).hostname.replace("www.", "");
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push({
        url: page.url,
        title: page.title || page.url,
        chars: page.markdown?.length || 0,
        status: page.statusCode || 0,
      });
    } catch {
      const key = "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        url: page.url,
        title: page.title || page.url,
        chars: page.markdown?.length || 0,
        status: page.statusCode || 0,
      });
    }
  }

  lines.push("## Web Sources by Domain");
  lines.push("");
  for (const [domain, pages] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`### ${domain} (${pages.length} page${pages.length !== 1 ? "s" : ""})`);
    lines.push("");
    lines.push(`| Status | Title | Chars |`);
    lines.push(`|--------|-------|------:|`);
    for (const p of pages) {
      const title = p.title?.slice(0, 60) || p.url.slice(0, 60);
      const statusIcon = p.status === 200 ? "✅" : "❌";
      lines.push(`| ${statusIcon} ${p.status} | [${title}](${p.url}) | ${p.chars.toLocaleString()} |`);
    }
    lines.push("");
  }

  if (deepData?.data?.sources?.length) {
    lines.push("## Deep Research Sources");
    lines.push("");
    lines.push("| # | Source |");
    lines.push("|--|--------|");
    for (let i = 0; i < deepData.data.sources.length; i++) {
      const src = deepData.data.sources[i];
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
): Promise<{ handle: string; analysis: TweetAnalysis | null; webPages: any[]; deepData: any | null }> {
  const apiKey = process.env.VITE_TWITTER_API_KEY!;
  const firecrawlKey = process.env.VITE_FIRECRAWL_API_KEY!;

  const outDir = resolve("scripts/research/output", handle);
  const dataDir = resolve("scripts/research/data");
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

  // Step 2: Web research
  let webPages: any[] = [];
  if (!options.skipWeb) {
    console.log("\n🌐 Step 2: Web research via Firecrawl...");
    const urls = buildResearchUrlsForType(handle, options.type);

    webPages = [];
    for (const { url, label } of urls) {
      console.log(`   📄 ${label}: ${url}`);
      try {
        const result = await scrapePage(firecrawlKey, url);
        webPages.push(result);
        await new Promise((r) => setTimeout(r, 300));
      } catch (e: any) {
        console.warn(`   ⚠️  Failed: ${e.message}`);
      }
    }

    const successful = webPages.filter(p => p.statusCode === 200 && p.markdown.length > 100);
    writeFileSync(resolve(dataDir, `${handle}_web.json`), JSON.stringify(webPages, null, 2));
    console.log(
      `   ✅ Scraped ${successful.length}/${webPages.length} pages ` +
      `(${successful.reduce((s: number, p: any) => s + p.markdown.length, 0).toLocaleString()} total chars)`
    );

    // Source catalog
    const catalogMd = generateSourceCatalogMd(handle, successful, null);
    writeFileSync(resolve(outDir, "00-source-catalog.md"), catalogMd);
    console.log(`   ✅ Generated 00-source-catalog.md`);
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
  console.log(`  Output dir: scripts/research/output/${handle}/`);
  if (analysis) {
    console.log(`  Tweets: ${analysis.totalCount.toLocaleString()} (EN: ${analysis.enCount}, ZH: ${analysis.zhCount})`);
    console.log(`  Avg/day: ${analysis.avgTweetsPerDay}`);
    console.log(`  Avg likes: ${analysis.engagementStats.avgLikes.toLocaleString()}`);
  }
  console.log(`  Web pages: ${webPages.length}`);
  console.log(`  Deep research: ${options.deepResearch ? "ON" : "off"}`);
  console.log("═".repeat(60) + "\n");

  return { handle, analysis, webPages, deepData };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const { handle, options } = parseArgs();

  if (!handle) {
    console.error("Usage: npx tsx scripts/research/pipeline.ts <handle> [options]");
    console.error("\nOptions:");
    console.error("  --count=N          Number of tweets to fetch (default: 500)");
    console.error("  --skip-tweets      Skip Twitter scraping (for non-Twitter personas)");
    console.error("  --skip-threads     Skip Threads scraping (for personas without Threads)");
    console.error("  --skip-web         Skip web research");
    console.error("  --deep-research    Run Firecrawl deep-research");
    console.error("  --type=TYPE        Persona type: TWITTER_CRYPTO | CHINESE_BUSINESS | HK_ENTREPRENEUR | WESTERN_INVESTOR");
    console.error("\nTypes:");
    console.error("  TWITTER_CRYPTO     Default. Crypto/trading persona with active Twitter.");
    console.error("  CHINESE_BUSINESS   No Twitter. Chinese-language sources. 中文人物.");
    console.error("  HK_ENTREPRENEUR   Hong Kong entrepreneur. Wikipedia/zh + industry media.");
    console.error("  WESTERN_INVESTOR   Western investor. EN Wikipedia + annual reports.");
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
