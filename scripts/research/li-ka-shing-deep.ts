#!/usr/bin/env tsx
/**
 * li-ka-shing-deep.ts
 *
 * Research Li Ka-shing using Firecrawl batch scrape + deep research polling.
 */
import { scrapePage, deepResearch } from "./firecrawl-research.js";
import { writeFileSync, mkdirSync } from "fs";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

async function pollDeepResearch(
  apiKey: string,
  jobId: string,
  maxWaitMs = 180000
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 10000));
    const res = await fetch(`${FIRECRAWL_BASE}/deep-research/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error("Deep research failed: " + JSON.stringify(data));
    console.log(`  ⏳ Still processing... (${Math.round((Date.now() - start) / 1000)}s)`);
  }
  throw new Error("Timed out waiting for deep research");
}

async function main() {
  const apiKey = process.env.VITE_FIRECRAWL_API_KEY!;
  if (!apiKey) {
    console.error("VITE_FIRECRAWL_API_KEY not set");
    process.exit(1);
  }

  mkdirSync("data", { recursive: true });

  // ── 1. Batch scrape key pages ───────────────────────────────────────────
  const urls = [
    { url: "https://en.wikipedia.org/wiki/Li_Ka-shing", label: "Wikipedia" },
    { url: "https://en.wikipedia.org/wiki/CK_Hutchison_Holdings", label: "CK Hutchison" },
    { url: "https://www.lksf.org/en/", label: "Li Ka Shing Foundation" },
    { url: "https://en.wikipedia.org/wiki/Victor_Li", label: "Victor Li" },
  ];

  console.log("=== Scrape Phase ===");
  const scraped: Record<string, string> = {};
  for (const { url, label } of urls) {
    process.stdout.write(`  Scraping ${label}... `);
    try {
      const result = await scrapePage(apiKey, url, ["markdown"]);
      scraped[label] = result.markdown;
      console.log(`✅ ${result.markdown.length} chars`);
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  writeFileSync("data/li-ka-shing-scrape.json", JSON.stringify(scraped, null, 2));
  console.log("Saved scrape data.\n");

  // ── 2. Deep research ────────────────────────────────────────────────────
  console.log("=== Deep Research Phase ===");
  const topic = `Li Ka-shing 2024-2026: latest investment strategy, Victor Li succession results, CK Hutchison performance, geopolitical navigation, philanthropy updates, key quotes and decision patterns, recent news about CK Hutchison ports/smart ports, AI/data center investments, UK/Brexit impact, Hong Kong political risk, Orange sale lessons learned, advice for long-term investors`;

  const initRes = await deepResearch(apiKey, topic, { recencyDays: 730, limit: 20 });
  console.log("Job started:", initRes.id);

  if (initRes.id) {
    console.log("  Polling for results (may take 1-3 min)...\n");
    try {
      const result = await pollDeepResearch(apiKey, initRes.id);
      writeFileSync("data/li-ka-shing-deep-research.json", JSON.stringify(result, null, 2));
      console.log("✅ Deep research complete! Saved to data/li-ka-shing-deep-research.json");

      if (result.sources) {
        console.log("\nSources found:");
        result.sources.slice(0, 10).forEach((s: any) => {
          console.log(`  - [${s.type}] ${s.url}`);
        });
      }
      if (result.markdown) {
        console.log("\nContent preview (first 6000 chars):");
        console.log(result.markdown.slice(0, 6000));
      }
    } catch (e: any) {
      console.error("Deep research failed:", e.message);
    }
  }
}

main().catch(console.error);