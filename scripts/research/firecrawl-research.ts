#!/usr/bin/env tsx
/**
 * firecrawl-research.ts
 *
 * Uses Firecrawl to deep-research a persona's web presence:
 * - Main website / landing page
 * - YouTube channel
 * - Wikipedia / Wiki pages
 * - Interview pages
 * - News articles
 *
 * Usage:
 *   npx tsx scripts/research/firecrawl-research.ts https://killalabs.io
 *   npx tsx scripts/research/firecrawl-research.ts https://killalabs.io,https://youtube.com/@KillaXBT
 */

// Auto-load .env when run as script
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

import type { WebResearchResult } from "./types.js";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

// ─── Firecrawl scrape ────────────────────────────────────────────────────────

export async function scrapePage(
  apiKey: string,
  url: string,
  formats: ("markdown" | "html" | "json" | "extract")[] = ["markdown"]
): Promise<WebResearchResult> {
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
      timeout: 30000,
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

// ─── Firecrawl deep research ──────────────────────────────────────────────────

export async function deepResearch(
  apiKey: string,
  topic: string,
  options: { recencyDays?: number; limit?: number } = {}
): Promise<{ completed: boolean; data: any }> {
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

// ─── Batch scraper ────────────────────────────────────────────────────────────

export async function scrapeUrls(
  apiKey: string,
  urls: string[],
  formats: ("markdown" | "html" | "json" | "extract")[] = ["markdown"]
): Promise<WebResearchResult[]> {
  const results: WebResearchResult[] = [];
  for (const url of urls) {
    console.log(`[Firecrawl] Scraping: ${url}`);
    const result = await scrapePage(apiKey, url, formats);
    results.push(result);
    // Brief delay between requests
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}

// ─── Default research targets for a persona ──────────────────────────────────

export function buildResearchUrls(
  handle: string,
  domain?: string
): { url: string; label: string }[] {
  const targets: { url: string; label: string }[] = [
    { url: `https://x.com/${handle}`, label: "X (Twitter) Profile" },
  ];

  if (domain) {
    targets.push({ url: domain, label: "Official Website" });
  }

  // Add known educational/research platforms
  targets.push(
    { url: `https://www.youtube.com/@${handle.replace("@", "")}`, label: "YouTube" },
    { url: `https://en.wikipedia.org/wiki/${encodeURIComponent(handle)}`, label: "Wikipedia" },
    { url: `https://www.google.com/search?q=${encodeURIComponent(handle)}+trading+methodology`, label: "Google Search" }
  );

  return targets;
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const urls = process.argv[2]?.split(",").map((u) => u.trim()) || [];
  if (urls.length === 0) {
    console.error("Usage: npx tsx firecrawl-research.ts <url1>,<url2>,...");
    console.error("  npx tsx firecrawl-research.ts https://killalabs.io");
    process.exit(1);
  }

  const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("Error: VITE_FIRECRAWL_API_KEY not set in .env");
    process.exit(1);
  }

  console.log(`[Firecrawl] Researching ${urls.length} URLs...`);
  const results = await scrapeUrls(apiKey, urls);

  const { writeFileSync, mkdirSync } = await import("fs");
  mkdirSync("scripts/research/data", { recursive: true });

  const timestamp = new Date().toISOString().slice(0, 10);
  const outFile = `scripts/research/data/firecrawl_${timestamp}.json`;
  writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`[Firecrawl] Saved to ${outFile} (${results.length} pages)`);

  for (const r of results) {
    console.log(
      `  ${r.statusCode === 200 ? "✅" : "❌"} ${r.url} — ${r.markdown.length} chars, ${r.creditsUsed} credits`
    );
  }
}