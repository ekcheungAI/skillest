#!/usr/bin/env tsx
/**
 * pipeline.ts
 *
 * Orchestrates the full persona research pipeline:
 * 1. Scrape tweets from Twitter/X
 * 2. Deep-research via Firecrawl
 * 3. Analyze and structure the data into a persona draft
 *
 * Usage:
 *   npx tsx scripts/research/pipeline.ts KillaXBT
 *   npx tsx scripts/research/pipeline.ts KillaXBT --count 300
 *   npx tsx scripts/research/pipeline.ts KillaXBT --skip-tweets
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
import {
  scrapePage,
  deepResearch,
  buildResearchUrls,
} from "./firecrawl-research.js";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve } from "path";

// ─── CLI ────────────────────────────────────────────────────────────────────

interface PipelineOptions {
  maxTweets: number;
  skipTweets: boolean;
  skipWeb: boolean;
  deepResearch: boolean;
  outputFormat: "json" | "yaml" | "both";
}

function parseArgs(): { handle: string; options: PipelineOptions } {
  const args = process.argv.slice(2);
  const handle = args.find((a) => !a.startsWith("--"))?.replace("@", "") || "";
  const options: PipelineOptions = {
    maxTweets: 500,
    skipTweets: false,
    skipWeb: false,
    deepResearch: false,
    outputFormat: "json",
  };

  for (const arg of args) {
    if (arg.startsWith("--count=")) options.maxTweets = parseInt(arg.split("=")[1]);
    if (arg === "--skip-tweets") options.skipTweets = true;
    if (arg === "--skip-web") options.skipWeb = true;
    if (arg === "--deep-research") options.deepResearch = true;
    if (arg === "--output=yaml") options.outputFormat = "yaml";
    if (arg === "--output=both") options.outputFormat = "both";
  }

  return { handle, options };
}

// ─── Persona domain detection ─────────────────────────────────────────────────

interface DomainInfo {
  domain?: string;
  knownFor: string;
  suggestedCategories: string[];
}

function detectDomain(handle: string): DomainInfo {
  const knownProfiles: Record<string, DomainInfo> = {
    KillaXBT: {
      domain: "https://killalabs.io",
      knownFor: "quantitative crypto trading methodology",
      suggestedCategories: ["Crypto", "Trading", "Investing"],
    },
   elonmusk: {
      domain: "https://x.com/elonmusk",
      knownFor: "tech entrepreneur, Tesla/SpaceX/X CEO",
      suggestedCategories: ["Tech", "Business", "Entrepreneurship"],
    },
  };

  return (
    knownProfiles[handle] || {
      knownFor: "public figure / thought leader",
      suggestedCategories: ["Business"],
    }
  );
}

// ─── Analysis functions ────────────────────────────────────────────────────────

function analyzeTweets(tweets: any[]): {
  vocabularyPatterns: { phrase: string; count: number }[];
  engagementStats: { avgLikes: number; avgRetweets: number; totalViews: number };
  topTweets: { text: string; likes: number; date: string }[];
  tweetFrequency: { byMonth: Record<string, number>; avgPerDay: number };
  dayOfWeekStats: Record<string, { count: number; avgLikes: number }>;
  threadTopics: string[];
} {
  const words: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const dayStats: Record<string, { count: number; likes: number }> = {};
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (const tweet of tweets) {
    // Word frequency
    const text = (tweet.text || "")
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[^\w\s]/g, " ");
    for (const word of text.split(/\s+/).filter((w: string) => w.length > 4)) {
      words[word] = (words[word] || 0) + 1;
    }

    // Monthly frequency
    const month = tweet.createdAt?.slice(0, 7) || "";
    if (month) byMonth[month] = (byMonth[month] || 0) + 1;

    // Day of week
    if (tweet.createdAt) {
      const dow = weekdays[new Date(tweet.createdAt).getDay()];
      if (!dayStats[dow]) dayStats[dow] = { count: 0, likes: 0 };
      dayStats[dow].count++;
      dayStats[dow].likes += tweet.likeCount || 0;
    }
  }

  const topWords = Object.entries(words)
    .filter(([w]) => !["https", "http", "that", "this", "with", "from", "have"].includes(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([phrase, count]) => ({ phrase, count }));

  const avgLikes = tweets.reduce((s: number, t: any) => s + (t.likeCount || 0), 0) / tweets.length;
  const avgRetweets = tweets.reduce((s: number, t: any) => s + (t.retweetCount || 0), 0) / tweets.length;
  const totalViews = tweets.reduce((s: number, t: any) => s + (t.viewCount || 0), 0);

  const topTweets = [...tweets]
    .sort((a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 10)
    .map((t: any) => ({ text: t.text, likes: t.likeCount, date: t.createdAt }));

  // Days active
  const dates = tweets.map((t: any) => t.createdAt).filter(Boolean).sort();
  const firstDate = dates[0] ? new Date(dates[0]) : new Date();
  const lastDate = dates[dates.length - 1] ? new Date(dates[dates.length - 1]) : new Date();
  const daysActive = Math.max(
    1,
    Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgPerDay = Math.round((tweets.length / daysActive) * 10) / 10;

  return {
    vocabularyPatterns: topWords,
    engagementStats: {
      avgLikes: Math.round(avgLikes),
      avgRetweets: Math.round(avgRetweets),
      totalViews,
    },
    topTweets,
    tweetFrequency: { byMonth, avgPerDay },
    dayOfWeekStats: Object.fromEntries(
      weekdays.map((d) => [
        d,
        dayStats[d] || { count: 0, avgLikes: 0 },
      ])
    ),
    threadTopics: [], // filled by LLM in next phase
  };
}

function analyzeWebContent(pages: any[]): {
  keyPhrases: string[];
  bio: string;
  accomplishments: string[];
  links: { url: string; label: string }[];
} {
  const allText = pages.map((p) => p.markdown || "").join("\n\n");
  const links: { url: string; label: string }[] = [];

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s\)\"\]]+/g;
  const found = new Set<string>();
  for (const match of allText.match(urlRegex) || []) {
    if (!found.has(match) && match.length < 200) {
      found.add(match);
      const label = match
        .replace(/^https?:\/\/(www\.)?/, "")
        .replace(/\/$/, "")
        .slice(0, 50);
      links.push({ url: match, label });
    }
  }

  // Bio: first substantial paragraph
  const paragraphs = allText.split(/\n\n+/).filter((p: string) => p.trim().length > 100);
  const bio = paragraphs[0]?.trim() || "";

  return {
    keyPhrases: [],
    bio,
    accomplishments: [],
    links,
  };
}

// ─── Persona draft generator ───────────────────────────────────────────────────

interface PersonaDraft {
  id: string;
  name: string;
  twitterHandle: string;
  title: string;
  shortBio: string;
  fullBio: string;
  born: string;
  nationality: string;
  categories: string[];
  accentColor: string;
  image: string;
  freshnessStatus: "LIVE" | "RECENT" | "STALE" | "OUTDATED";
  lastUpdated: string;
  nextUpdateDue: string;
  dataSourceCount: number;
  // Raw analysis (to be turned into structured fields by LLM)
  rawAnalysis: {
    tweetCount: number;
    followerCount: number;
    topVocabulary: { phrase: string; count: number }[];
    dayOfWeekStats: Record<string, { count: number; avgLikes: number }>;
    topTweets: { text: string; likes: number; date: string }[];
    engagementStats: { avgLikes: number; avgRetweets: number; totalViews: number };
    tweetFrequency: { byMonth: Record<string, number>; avgPerDay: number };
    webSources: { url: string; title: string; chars: number }[];
    rawBio: string;
    links: { url: string; label: string }[];
  };
}

function generateDraft(
  handle: string,
  tweetData: any,
  webData: any
): PersonaDraft {
  const domainInfo = detectDomain(handle);
  const tweets = tweetData?.tweets || [];
  const profile = tweetData?.profile || {};
  const analysis = analyzeTweets(tweets);
  const webAnalysis = analyzeWebContent(webData || []);

  const id = handle.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const name = profile.name || handle;
  const title = domainInfo.knownFor;
  const tweetCount = tweets.length;
  const followerCount = profile.followers || 0;

  return {
    id,
    name,
    twitterHandle: handle,
    title,
    shortBio: `X: @${handle} · ${followerCount.toLocaleString()} followers · ${tweetCount} tweets analyzed`,
    fullBio: webAnalysis.bio || profile.bio || `Public figure active on X/Twitter as @${handle}.`,
    born: "Unknown",
    nationality: "Unknown",
    categories: domainInfo.suggestedCategories,
    accentColor: "#7C3AED",
    image: profile.profileImage || "",
    freshnessStatus: "LIVE",
    lastUpdated: new Date().toISOString().slice(0, 10),
    nextUpdateDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    dataSourceCount: tweetCount,
    rawAnalysis: {
      tweetCount,
      followerCount,
      topVocabulary: analysis.vocabularyPatterns.slice(0, 30),
      dayOfWeekStats: analysis.dayOfWeekStats,
      topTweets: analysis.topTweets.slice(0, 10),
      engagementStats: analysis.engagementStats,
      tweetFrequency: analysis.tweetFrequency,
      webSources: (webData || []).map((p: any) => ({
        url: p.url,
        title: p.title,
        chars: (p.markdown || "").length,
      })),
      rawBio: webAnalysis.bio,
      links: webAnalysis.links.slice(0, 20),
    },
  };
}

// ─── Research pipeline ────────────────────────────────────────────────────────

async function runPipeline(
  handle: string,
  options: PipelineOptions
): Promise<{ draft: PersonaDraft; tweetData: any; webData: any }> {
  const apiKey = process.env.VITE_TWITTER_API_KEY!;
  const firecrawlKey = process.env.VITE_FIRECRAWL_API_KEY!;
  const domainInfo = detectDomain(handle);

  mkdirSync("scripts/research/data", { recursive: true });
  mkdirSync("scripts/research/output", { recursive: true });

  // Step 1: Scrape tweets
  let tweetData: any = null;
  if (!options.skipTweets) {
    console.log("\n📡 Step 1: Scraping Twitter/X...");
    tweetData = await scrapeTwitter(apiKey, handle, {
      maxTweets: options.maxTweets,
    });

    // Save raw data
    writeFileSync(
      `scripts/research/data/${handle}_tweets.json`,
      JSON.stringify(tweetData, null, 2)
    );
    console.log(`   ✅ Saved ${tweetData.tweets.length} tweets`);
  }

  // Step 2: Web research
  let webData: any[] = [];
  if (!options.skipWeb) {
    console.log("\n🌐 Step 2: Web research via Firecrawl...");
    const urls = buildResearchUrls(handle, domainInfo.domain);
    const { scrapeUrls } = await import("./firecrawl-research.js");

    const pages = await scrapeUrls(firecrawlKey, urls.map((u) => u.url));
    webData = pages.filter((p) => p.statusCode === 200 && p.markdown.length > 100);

    writeFileSync(
      `scripts/research/data/${handle}_web.json`,
      JSON.stringify(webData, null, 2)
    );
    console.log(
      `   ✅ Scraped ${webData.length} web pages ` +
        `(${webData.reduce((s, p) => s + p.markdown.length, 0).toLocaleString()} total chars)`
    );
  }

  // Step 3: Deep research (if enabled)
  if (options.deepResearch) {
    console.log("\n🔬 Step 3: Deep research...");
    try {
      const dr = await deepResearch(firecrawlKey, `${handle} trading methodology analysis`, {
        recencyDays: 365,
        limit: 20,
      });
      writeFileSync(
        `scripts/research/data/${handle}_deep.json`,
        JSON.stringify(dr, null, 2)
      );
      console.log(`   ✅ Deep research complete`);
    } catch (e: any) {
      console.warn(`   ⚠️  Deep research failed: ${e.message}`);
    }
  }

  // Step 4: Generate draft
  console.log("\n📝 Step 4: Generating persona draft...");
  const draft = generateDraft(handle, tweetData, webData);

  const outFile = `scripts/research/output/${handle}_draft.json`;
  writeFileSync(outFile, JSON.stringify(draft, null, 2));
  console.log(`   ✅ Draft saved to ${outFile}`);

  return { draft, tweetData, webData };
}

// ─── Print summary ────────────────────────────────────────────────────────────

function printSummary(draft: PersonaDraft) {
  console.log("\n" + "═".repeat(60));
  console.log(`  PERSONA RESEARCH SUMMARY: @${draft.twitterHandle}`);
  console.log("═".repeat(60));

  console.log(`\n📊 Data Collected:`);
  console.log(`   Tweets analyzed:  ${draft.rawAnalysis.tweetCount.toLocaleString()}`);
  console.log(`   Followers:      ${draft.rawAnalysis.followerCount.toLocaleString()}`);
  console.log(`   Avg likes:      ${draft.rawAnalysis.engagementStats.avgLikes.toLocaleString()}`);
  console.log(
    `   Total views:    ${(draft.rawAnalysis.engagementStats.totalViews / 1e6).toFixed(1)}M`
  );
  console.log(`   Web pages:     ${draft.rawAnalysis.webSources.length}`);

  console.log(`\n📅 Day-of-Week Stats (tweet volume → avg likes):`);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (const d of days) {
    const stats = draft.rawAnalysis.dayOfWeekStats[d] || { count: 0, avgLikes: 0 };
    const avg = stats.count > 0 ? Math.round(stats.avgLikes / stats.count) : 0;
    const bar = "█".repeat(Math.min(Math.round(stats.count / 2), 20));
    console.log(
      `   ${d.padEnd(4)} ${bar.padEnd(20, " ")} ${stats.count.toString().padStart(4)} tweets  avg ${avg.toString().padStart(5)} likes`
    );
  }

  console.log(`\n🔤 Top Vocabulary:`);
  for (const { phrase, count } of draft.rawAnalysis.topVocabulary.slice(0, 15)) {
    console.log(`   ${count.toString().padStart(4)} × ${phrase}`);
  }

  console.log(`\n🏆 Top 5 Most-Liked Tweets:`);
  for (const tweet of draft.rawAnalysis.topTweets.slice(0, 5)) {
    const short = tweet.text.replace(/\n/g, " ").slice(0, 80);
    console.log(`   ❤️ ${tweet.likes.toLocaleString()}  ${short}${short.length < tweet.text.length ? "…" : ""}`);
  }

  if (draft.rawAnalysis.webSources.length > 0) {
    console.log(`\n🌐 Web Sources:`);
    for (const src of draft.rawAnalysis.webSources.slice(0, 5)) {
      console.log(`   ${src.title.slice(0, 60) || src.url.slice(0, 60)}`);
    }
  }

  console.log(`\n⚠️  Next Step: LLM processing to convert raw data → structured Persona schema`);
  console.log(`   Edit: scripts/research/output/${draft.twitterHandle}_draft.json`);
  console.log("═".repeat(60) + "\n");
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const { handle, options } = parseArgs();

  if (!handle) {
    console.error("Usage: npx tsx scripts/research/pipeline.ts <twitterHandle> [options]");
    console.error("\nOptions:");
    console.error("  --count=N          Number of tweets to fetch (default: 500)");
    console.error("  --skip-tweets      Skip Twitter scraping");
    console.error("  --skip-web         Skip web research");
    console.error("  --deep-research    Run Firecrawl deep-research (uses more credits)");
    console.error("  --output=yaml      Output as YAML instead of JSON");
    process.exit(1);
  }

  if (!process.env.VITE_TWITTER_API_KEY || !process.env.VITE_FIRECRAWL_API_KEY) {
    console.error("Error: Missing API keys. Check .env file has VITE_TWITTER_API_KEY and VITE_FIRECRAWL_API_KEY");
    process.exit(1);
  }

  console.log(`\n🚀 Persona Research Pipeline`);
  console.log(`   Handle: @${handle}`);
  console.log(`   Max tweets: ${options.maxTweets}`);
  console.log(`   Deep research: ${options.deepResearch ? "ON" : "OFF"}`);

  const { draft } = await runPipeline(handle, options);
  printSummary(draft);
}

main().catch(console.error);
