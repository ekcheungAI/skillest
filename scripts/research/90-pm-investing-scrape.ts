#!/usr/bin/env tsx
/**
 * 90-pm-investing-scrape.ts
 *
 * Scrape 5 primary authored Substack articles for 90s.PM.Investing persona.
 *
 * Usage:
 *   npx tsx scripts/research/90-pm-investing-scrape.ts
 */
import { scrapePage } from "./firecrawl-research.js";
import { writeFileSync, mkdirSync } from "fs";

const API_KEY = process.env.VITE_FIRECRAWL_API_KEY!;
const OUT_DIR = "scripts/research/data";
const ID = "90-pm-investing";

mkdirSync(OUT_DIR, { recursive: true });

const ARTICLES = [
  {
    url: "https://90spminvesting.substack.com/p/90spminvesting-101",
    label: "101-前言",
  },
  {
    url: "https://90spminvesting.substack.com/p/90spminvesting-102",
    label: "102-北极星",
  },
  {
    url: "https://90spminvesting.substack.com/p/90spminvesting-103",
    label: "103-故事",
  },
  {
    url: "https://90spminvesting.substack.com/p/90spminvesting-104",
    label: "104-假设",
  },
  {
    url: "https://90spminvesting.substack.com/p/90spminvesting-105",
    label: "105-画树",
  },
];

async function main() {
  if (!API_KEY) {
    console.error("VITE_FIRECRAWL_API_KEY not set");
    process.exit(1);
  }

  console.log("📄 Scraping 5 Substack articles for 90s.PM.Investing...\n");

  const results: Record<string, string> = {};

  for (const { url, label } of ARTICLES) {
    process.stdout.write(`  Scraping ${label}... `);
    try {
      const result = await scrapePage(API_KEY, url, ["markdown"]);
      const chars = result.markdown.length;
      const words = result.markdown.split(/\s+/).length;
      results[label] = result.markdown;
      console.log(`✅ ${chars.toLocaleString()} chars / ~${words.toLocaleString()} words`);
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  writeFileSync(
    `${OUT_DIR}/${ID}_substack.json`,
    JSON.stringify(results, null, 2)
  );
  const totalChars = Object.values(results).reduce((s, v) => s + v.length, 0);
  console.log(`\n✅ Saved ${Object.keys(results).length}/${ARTICLES.length} articles`);
  console.log(`   Total: ${totalChars.toLocaleString()} chars`);
  console.log(`   File: ${OUT_DIR}/${ID}_substack.json`);
}

main().catch(console.error);
