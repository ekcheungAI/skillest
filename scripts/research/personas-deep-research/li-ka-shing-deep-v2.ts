#!/usr/bin/env tsx
/**
 * li-ka-shing-deep-v2.ts
 *
 * Li Ka-shing v2 deep research:
 * Phase 1: Era-segmented deep research (3 eras)
 * Phase 2: Adversarial + decision-record search
 *
 * Usage:
 *   npx tsx scripts/research/personas-deep-research/li-ka-shing-deep-v2.ts
 */

import { deepResearch, searchFirecrawl } from "../firecrawl-research.js";
import { writeFileSync, mkdirSync } from "fs";

const FIRECRAWL_KEY = process.env.VITE_FIRECRAWL_API_KEY!;
const TIMESTAMP = new Date().toISOString().slice(0, 10);
const OUT_DIR = "scripts/research/data";
const NAME = "Li Ka-shing 李嘉誠";
const ID = "li-ka-shing";

mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  if (!FIRECRAWL_KEY) {
    console.error("VITE_FIRECRAWL_API_KEY not set");
    process.exit(1);
  }

  console.log("🔬 Li Ka-shing v2 Deep Research...");
  console.log("");

  // Phase 0: Quick source count (reuse saved discovery)
  console.log("=== Phase 0: Discovery Data Available ===");
  console.log("  Full discovery already saved — see discovery-li-ka-shing-2026-04-16.json");
  console.log("");

  // Phase 1: Era-segmented deep research
  console.log("=== Phase 1: Era-Segmented Deep Research ===");
  const eraQueries = [
    {
      era: "1-Founding",
      topic: "Li Ka-shing early life 1930s Chaozhou refugee origins塑料厂创业1950 Cheung Kong founding philosophy principles first investments",
      recencyDays: 18250,
      limit: 15,
    },
    {
      era: "2-Expansion",
      topic: "Li Ka-shing 1970s-1990s Cheung Kong acquisition strategy Orange telecom 1999 peak sell Hutchison Whampoa globalization",
      recencyDays: 18250,
      limit: 15,
    },
    {
      era: "3-Modern",
      topic: "Li Ka-shing 2000s-2026 Victor Li succession CK Hutchison politics Beijing Panama Canal sale Canada 3G departure philanthropy foundation geopolitical hedging",
      recencyDays: 3650,
      limit: 20,
    },
  ];

  for (const q of eraQueries) {
    console.log("  📡 [" + q.era + "] " + q.topic.slice(0, 60) + "...");
    try {
      const result = await deepResearch(FIRECRAWL_KEY, q.topic, {
        recencyDays: q.recencyDays,
        limit: q.limit,
      });
      writeFileSync(
        OUT_DIR + "/deep-" + ID + "-" + q.era + "-" + TIMESTAMP + ".json",
        JSON.stringify(result, null, 2)
      );
      const sources = result.data?.sources?.length || 0;
      console.log("  ✅ [" + q.era + "] Deep research — " + sources + " sources");
    } catch (e: any) {
      console.warn("  ⚠️  [" + q.era + "] Failed: " + e.message);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log("");

  // Phase 2: Adversarial + Decision Records
  console.log("=== Phase 2: Adversarial + Decision Records ===");
  const adversarialQueries = [
    { category: "adversarial", query: "Li Ka-shing criticism Beijing Panama Canal sale controversy geopolitical" },
    { category: "adversarial", query: "Li Ka-shing Canada 3G telecom failure mistake regret" },
    { category: "adversarial", query: "Li Ka-shing political loyalty controversy Hong Kong Beijing relationship" },
    { category: "decision-records", query: "Li Ka-shing Orange sale 1999 France Telecom decision reasoning peak sell" },
    { category: "decision-records", query: "Li Ka-shing CK Hutchison ports infrastructure acquisition strategy timeline" },
    { category: "decision-records", query: "Li Ka-shing Victor Li succession transition results challenges" },
  ];

  for (const q of adversarialQueries) {
    console.log("  🔍 [" + q.category + "] " + q.query.slice(0, 60) + "...");
    try {
      const result = await searchFirecrawl(FIRECRAWL_KEY, q.query, 10);
      const count = result.data?.length || 0;
      console.log("  ✅ " + count + " results");
      writeFileSync(
        OUT_DIR + "/search-" + ID + "-" + q.category + "-" + TIMESTAMP + ".json",
        JSON.stringify(result, null, 2)
      );
    } catch (e: any) {
      console.warn("  ⚠️  " + e.message);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("");
  console.log("✅ Deep research complete. Files in " + OUT_DIR + "/");
  console.log("");
  console.log("Next:");
  console.log("  npx tsx scripts/research/2_distill/distill.ts " + ID + " --agent=claims");
}

main().catch(console.error);
