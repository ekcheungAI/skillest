#!/usr/bin/env tsx
/**
 * twitter-scraper.ts
 *
 * Scrapes tweets from a given Twitter/X handle using the TwitterAPI.io API.
 * Supports pagination to collect 500+ tweets with full metadata.
 *
 * Usage:
 *   npx tsx scripts/research/twitter-scraper.ts KillaXBT
 *   npx tsx scripts/research/twitter-scraper.ts KillaXBT --count 200
 */

// Auto-load .env variables when run directly
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
} catch { /* no .env — CI env vars take precedence */ }

import type { RawTweet, ScraperResult } from "./types.js";

const API_BASE = "https://api.twitterapi.io/twitter";

// ─── API calls ────────────────────────────────────────────────────────────────

async function getUserProfile(
  apiKey: string,
  username: string
): Promise<ScraperResult["profile"]> {
  const url = `https://api.twitterapi.io/twitter/user/search?query=${encodeURIComponent(username)}&maxResults=5`;
  const res = await fetch(url, {
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error(`Profile API error: ${res.status}`);

  const data = await res.json();
  const user = data.users?.find(
    (u: any) =>
      u.screen_name?.toLowerCase() === username.toLowerCase() ||
      u.name?.toLowerCase() === username.toLowerCase()
  );

  if (!user) throw new Error(`User @${username} not found`);

  return {
    name: user.name,
    username: user.screen_name,
    bio: user.description || "",
    followers: user.followers_count,
    following: user.friends_count,
    profileImage: user.profile_image_url_https,
    bannerImage: user.profile_banner_url || "",
    joinedAt: user.created_at,
  };
}

async function fetchTweetsPage(
  apiKey: string,
  username: string,
  cursor?: string
): Promise<{ tweets: any[]; nextCursor?: string; hasMore: boolean }> {
  const params = new URLSearchParams({
    userName: username,
    maxResults: "100",
  });
  if (cursor) params.set("cursor", cursor);

  const url = `${API_BASE}/user/last_tweets?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error(`Tweets API error: ${res.status}`);

  const data = await res.json();
  return {
    tweets: data.data?.tweets || [],
    nextCursor: data.next_cursor || undefined,
    hasMore: data.has_next_page || false,
  };
}

// ─── Tweet normalization ────────────────────────────────────────────────────

function normalizeTweet(raw: any): RawTweet {
  const author = raw.author || {};
  return {
    id: raw.id,
    text: raw.text || "",
    createdAt: raw.createdAt,
    likeCount: raw.likeCount || 0,
    retweetCount: raw.retweetCount || 0,
    replyCount: raw.replyCount || 0,
    viewCount: raw.viewCount || 0,
    lang: raw.lang || "en",
    isReply: raw.isReply || false,
    conversationId: raw.conversationId || raw.id,
    author: {
      name: author.name || "",
      userName: author.userName || "",
      followers: author.followers || 0,
      following: author.following || 0,
      profilePicture: author.profilePicture || "",
      bio: author.profile_bio?.description || "",
      createdAt: author.createdAt || "",
    },
  };
}

// ─── Main scraper ────────────────────────────────────────────────────────────

export async function scrapeTwitter(
  apiKey: string,
  username: string,
  options: { maxTweets?: number; skipRetweets?: boolean } = {}
): Promise<ScraperResult> {
  const { maxTweets = 500, skipRetweets = true } = options;

  console.log(`[Twitter] Scraping @${username} (target: ${maxTweets} tweets)...`);

  const [profile, ...pages] = await Promise.all([
    getUserProfile(apiKey, username),
    fetchTweetsPage(apiKey, username),
  ]);

  const allTweets: RawTweet[] = [];
  let cursor = pages[0]?.nextCursor;
  let hasMore = pages[0]?.hasMore ?? false;

  // First page already fetched
  for (const raw of pages[0]?.tweets || []) {
    if (allTweets.length >= maxTweets) break;
    // Skip retweets
    if (skipRetweets && raw.text?.startsWith("RT @")) continue;
    allTweets.push(normalizeTweet(raw));
  }

  // Paginate
  while (hasMore && allTweets.length < maxTweets) {
    console.log(`[Twitter] Page fetched: ${allTweets.length}/${maxTweets} tweets...`);
    const page = await fetchTweetsPage(apiKey, username, cursor);
    for (const raw of page.tweets) {
      if (allTweets.length >= maxTweets) break;
      if (skipRetweets && raw.text?.startsWith("RT @")) continue;
      allTweets.push(normalizeTweet(raw));
    }
    cursor = page.nextCursor;
    hasMore = page.hasMore;

    // Rate limit protection
    await new Promise((r) => setTimeout(r, 200));
  }

  const normalized = allTweets.slice(0, maxTweets);
  const dates = normalized.map((t) => t.createdAt).filter(Boolean).sort();

  console.log(
    `[Twitter] Done. Collected ${normalized.length} tweets ` +
      `(${dates[0] ?? "?"} → ${dates[dates.length - 1] ?? "?"})`
  );

  return {
    tweets: normalized,
    profile,
    metadata: {
      scrapedAt: new Date().toISOString(),
      tweetsScraped: normalized.length,
      oldestTweet: dates[0] ?? null,
      newestTweet: dates[dates.length - 1] ?? null,
    },
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const handle = process.argv[2];
  const countArg = process.argv.find((a) => a.startsWith("--count="));
  const maxTweets = countArg ? parseInt(countArg.split("=")[1]) : 500;

  if (!handle) {
    console.error("Usage: npx tsx twitter-scraper.ts <twitterHandle> [--count=N]");
    process.exit(1);
  }

  const apiKey = process.env.VITE_TWITTER_API_KEY;
  if (!apiKey) {
    console.error("Error: VITE_TWITTER_API_KEY not set in .env");
    process.exit(1);
  }

  const result = await scrapeTwitter(apiKey, handle.replace("@", ""), { maxTweets });

  // Save to JSON
  const outFile = `scripts/research/data/${handle.replace("@", "")}_tweets.json`;
  const { writeFileSync, mkdirSync } = await import("fs");
  mkdirSync("scripts/research/data", { recursive: true });
  writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`[Twitter] Saved to ${outFile}`);
}
