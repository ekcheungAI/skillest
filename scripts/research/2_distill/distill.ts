#!/usr/bin/env tsx
/**
 * distill.ts
 *
 * Distills raw scraped data into structured research files.
 * Reads from:
 *   data/{handle}_tweets.json      → 01-tweet-statistics.md
 *   data/{handle}_web.json         → 02-published-works.md, 03-interview-distillation.md
 *   data/{handle}_deep.json       → 04-adversarial-distillation.md, 05-behavioral-records.md
 *   output/{handle}/               → generates final SKILL.md draft
 *
 * Usage:
 *   npx tsx scripts/research/2_distill/distill.ts warren-buffett
 *   npx tsx scripts/research/2_distill/distill.ts warren-buffett --agent=1
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { getScriptDir, resolveProjectRoot } from "./path-utils.js";

const SCRIPT_DIR = getScriptDir();
const ROOT = resolveProjectRoot(SCRIPT_DIR);
const DATA_DIR = resolve(ROOT, "data");
const OUTPUT_DIR = resolve(ROOT, "output");

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RawTweet {
  id: string; text: string; createdAt: string;
  likeCount: number; retweetCount: number; replyCount: number;
  viewCount: number; lang: string; isReply: boolean;
  author: { name: string; userName: string; followers: number; following: number; bio: string; createdAt: string };
}

interface ScraperResult {
  tweets: RawTweet[];
  profile: { name: string; username: string; bio: string; followers: number; following: number; joinedAt: string };
  metadata: { scrapedAt: string; tweetsScraped: number; oldestTweet: string | null; newestTweet: string | null };
}

interface WebPage {
  url: string; title: string; markdown: string; statusCode: number; creditsUsed: number;
}

interface DeepResearchResult {
  id?: string; status?: string; data?: { markdown: string; sources?: { url: string; type: string }[] };
  markdown?: string; sources?: { url: string; type: string }[];
}

interface DeepResearchResult {
  id?: string; status?: string; data?: { markdown: string; sources?: { url: string; type: string }[] };
  markdown?: string; sources?: { url: string; type: string }[];
}

// ─── Structured Claim Extraction ───────────────────────────────────────────────

interface Claim {
  id: string;
  claim: string;
  quote?: string;
  sourceUrl: string;
  sourceType: string;
  layer: string;
  trustWeight: number;
  relevanceScore: number;
  date?: string;
  contradictedBy?: string[];
  tags: string[];
}

interface Contradiction {
  id: string;
  shortName: string;
  statedValue: string;
  statedSource?: string;
  observedBehavior: string;
  observedSource?: string;
  category: "value-behavior" | "timeline-shift" | "reversal" | "competing-commitments";
  severity: "high" | "medium" | "low";
  notes?: string;
}

/**
 * Extract structured claims from markdown text.
 * Pattern-based extraction for:
 *   - Quoted statements
 *   - Decision sentences ("bought X", "decided to Y")
 *   - Value statements ("I believe X", "the key is Y")
 *   - Comparison statements ("better than X", "unlike Y")
 */
function extractClaims(
  markdown: string,
  source: { url: string; sourceType?: string; layer?: string; trustWeight?: number; relevanceScore?: number }
): Claim[] {
  const claims: Claim[] = [];
  const lines = markdown.split("\n");
  let claimId = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 20) continue;

    // Blockquote: direct quote
    if (trimmed.startsWith("> ") && trimmed.length > 30) {
      const quote = trimmed.slice(2).replace(/^[""]|[""]$/g, "").trim();
      if (quote.length > 15) {
        claims.push({
          id: `claim-${++claimId}`,
          claim: quote,
          quote,
          sourceUrl: source.url,
          sourceType: source.sourceType || "unknown",
          layer: source.layer || "unknown",
          trustWeight: source.trustWeight || 1.5,
          relevanceScore: source.relevanceScore || 50,
          tags: ["direct-quote"],
        });
      }
      continue;
    }

    // Decision pattern: "bought", "sold", "invested", "acquired", "decided", "chose", "launched"
    const decisionPatterns = /\b(bought|sold|acquired|invested|decided|chose|launched|entered|exited|hired|fired|promoted|demoted|closed|cancelled|announced)\b/gi;
    if (decisionPatterns.test(trimmed) && trimmed.length > 40 && trimmed.length < 500) {
      claims.push({
        id: `claim-${++claimId}`,
        claim: trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim(),
        sourceUrl: source.url,
        sourceType: source.sourceType || "unknown",
        layer: source.layer || "unknown",
        trustWeight: source.trustWeight || 1.5,
        relevanceScore: source.relevanceScore || 50,
        tags: ["decision-record"],
      });
      continue;
    }

    // Value statement: "I believe", "the key", "the most important", "I think"
    const valuePatterns = /\b(I believe|I think|the key is|the most important|I always|I never|my philosophy|my approach|what matters is)\b/gi;
    if (valuePatterns.test(trimmed) && trimmed.length > 25 && trimmed.length < 600) {
      claims.push({
        id: `claim-${++claimId}`,
        claim: trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim(),
        sourceUrl: source.url,
        sourceType: source.sourceType || "unknown",
        layer: source.layer || "unknown",
        trustWeight: source.trustWeight || 1.5,
        relevanceScore: source.relevanceScore || 50,
        tags: ["value-statement"],
      });
    }
  }

  return claims;
}

/**
 * Detect contradictions by comparing claims across layers.
 * Particularly effective when adversarial sources are present.
 */
function detectContradictions(
  allClaims: Claim[],
  adversarialPages: Array<{ url: string; markdown: string }>
): Contradiction[] {
  const contradictions: Contradiction[] = [];
  let contrId = 0;

  // Group claims by type
  const valueClaims = allClaims.filter(c => c.tags.includes("value-statement"));
  const decisionClaims = allClaims.filter(c => c.tags.includes("decision-record"));
  const directQuotes = allClaims.filter(c => c.tags.includes("direct-quote"));

  // Pattern: stated value vs. observed decision
  for (const value of valueClaims.slice(0, 15)) {
    const valueLower = value.claim.toLowerCase();

    // Check if any decision contradicts this value
    for (const decision of decisionClaims.slice(0, 30)) {
      const decisionLower = decision.claim.toLowerCase();

      // "long-term" vs short-term trade
      if (
        (valueLower.includes("long-term") || valueLower.includes("patient")) &&
        (decisionLower.includes("sold") || decisionLower.includes("exited") || decisionLower.includes("quick"))
      ) {
        contradictions.push({
          id: `contr-${++contrId}`,
          shortName: `Long-term vs ${extractSubject(decision.claim)}`,
          statedValue: value.claim.slice(0, 150),
          statedSource: value.sourceUrl,
          observedBehavior: decision.claim.slice(0, 150),
          observedSource: decision.sourceUrl,
          category: "value-behavior",
          severity: "medium",
          notes: `Value stated in ${value.layer} source, behavior observed in ${decision.layer} source`,
        });
      }

      // "not about money" vs profit-maximizing behavior
      if (
        (valueLower.includes("not about money") || valueLower.includes("principles over profit") || valueLower.includes("mission over money")) &&
        (decisionLower.includes("profit") || decisionLower.includes("sold for") || decisionLower.includes("billion"))
      ) {
        contradictions.push({
          id: `contr-${++contrId}`,
          shortName: `Mission vs profit`,
          statedValue: value.claim.slice(0, 150),
          statedSource: value.sourceUrl,
          observedBehavior: decision.claim.slice(0, 150),
          observedSource: decision.sourceUrl,
          category: "competing-commitments",
          severity: "high",
        });
      }
    }
  }

  // Pattern: reversal (was X, now Y)
  for (const quote of directQuotes.slice(0, 10)) {
    const quoteLower = quote.claim.toLowerCase();
    if (quoteLower.includes("never") || quoteLower.includes("always")) {
      // Look for counter-examples in decisions
      for (const decision of decisionClaims.slice(0, 20)) {
        const decisionLower = decision.claim.toLowerCase();
        if (decisionLower.includes(extractSubject(quote.claim).toLowerCase())) {
          contradictions.push({
            id: `contr-${++contrId}`,
            shortName: `Never/Always reversal`,
            statedValue: quote.claim.slice(0, 150),
            statedSource: quote.sourceUrl,
            observedBehavior: decision.claim.slice(0, 150),
            observedSource: decision.sourceUrl,
            category: "reversal",
            severity: "high",
          });
        }
      }
    }
  }

  // Dedup by similar statedValue
  const seen = new Set<string>();
  return contradictions.filter(c => {
    const key = c.statedValue.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12); // cap at 12
}

function extractSubject(text: string): string {
  const match = text.match(/\b(I|he|she|they|we)\s+(\w+)/i);
  return match ? match[0] : text.slice(0, 30);
}

// ─── Claim + Contradiction Report Generator ──────────────────────────────────

function generateClaimsAndContradictionsMd(
  claims: Claim[],
  contradictions: Contradiction[],
  sourceCount: number
): string {
  const lines: string[] = [];

  lines.push("# Claims & Contradictions Ledger");
  lines.push("");
  lines.push(`> Auto-extracted from ${sourceCount} sources. ` +
    "Fill in the gaps marked with \`[?]\` before writing SKILL.md §8.");
  lines.push("");

  // Claims by layer
  lines.push("## Claims by Layer");
  lines.push("");
  const layers = ["authored", "spoken", "institutional", "adversarial", "behavioral", "unknown"];
  for (const layer of layers) {
    const layerClaims = claims.filter(c => c.layer === layer);
    if (layerClaims.length === 0) continue;
    lines.push(`### ${layer.charAt(0).toUpperCase() + layer.slice(1)} (${layerClaims.length})`);
    lines.push("");
    for (const c of layerClaims.slice(0, 8)) {
      const tagIcons = c.tags.map(t => {
        switch (t) {
          case "direct-quote": return "💬";
          case "decision-record": return "📋";
          case "value-statement": return "🧭";
          default: return "•";
        }
      }).join(" ");
      const score = Math.round(c.trustWeight * c.relevanceScore / 10);
      lines.push(`- ${tagIcons} **[${score}]** ${c.claim.slice(0, 120)}${c.claim.length > 120 ? "..." : ""}`);
      lines.push(`  - Source: ${c.sourceType} | [link](${c.sourceUrl})`);
    }
    lines.push("");
  }

  // Claims by type
  lines.push("## Claims by Type");
  lines.push("");
  lines.push("| Type | Count | Weight |");
  lines.push("|------|------:|-------:|");
  const typeGroups: Record<string, { count: number; avgWeight: number }> = {};
  for (const c of claims) {
    const tag = c.tags[0] || "other";
    if (!typeGroups[tag]) typeGroups[tag] = { count: 0, avgWeight: 0 };
    typeGroups[tag].count++;
    typeGroups[tag].avgWeight += c.trustWeight;
  }
  for (const [tag, data] of Object.entries(typeGroups)) {
    const avg = (data.avgWeight / data.count).toFixed(1);
    lines.push(`| ${tag} | ${data.count} | ${avg} |`);
  }
  lines.push("");

  // Contradictions
  lines.push("## Contradictions (SKILL.md §8 — MANDATORY 3–6)");
  lines.push("");
  if (contradictions.length === 0) {
    lines.push("> ⚠️  No contradictions auto-detected. Add them manually based on:");
    lines.push("- Adversarial sources (lawsuits, investigations, criticism)");
    lines.push("- Timeline reversals (said X in 2015, did Y in 2018)");
    lines.push("- Value-behavior gaps (says mission > money, but...");
    lines.push("- Competing commitments (invests in both X and anti-X)");
    lines.push("");
  }
  for (const c of contradictions) {
    const severityIcon = c.severity === "high" ? "🔴" : c.severity === "medium" ? "🟡" : "🟢";
    lines.push(`### ${severityIcon} ${c.shortName}`);
    lines.push("");
    lines.push(`| Dimension | Content | Source |`);
    lines.push(`|-----------|---------|--------|`);
    lines.push(`| **Says** | ${c.statedValue?.slice(0, 120) || "[?]"} | ${c.statedSource ? `[link](${c.statedSource})` : "[?]"} |`);
    lines.push(`| **Does** | ${c.observedBehavior?.slice(0, 120) || "[?]"} | ${c.observedSource ? `[link](${c.observedSource})` : "[?]"} |`);
    lines.push(`| Category | ${c.category} | |`);
    if (c.notes) lines.push(`| Notes | ${c.notes} | |`);
    lines.push("");
  }

  // Manual fill-in template
  lines.push("## Manual Fill-In Template (for SKILL.md §8)");
  lines.push("");
  lines.push("Use this to document contradictions not caught by auto-detection:");
  lines.push("");
  for (let i = contradictions.length + 1; i <= 6; i++) {
    lines.push(`### Contradiction ${i}: [Short Name]`);
    lines.push(`- **Says:** > "[quote of stated value]" — [source]`);
    lines.push(`- **Does:** [observed behavior with citation]`);
    lines.push(`- **Reconciliation:** [their explanation, or "they don't"]`);
    lines.push("");
  }

  lines.push("---");
  lines.push("*Auto-generated by `2_distill/distill.ts` — review all claims before use*");

  return lines.join("\n");
}

// ─── Tweet Statistics Distiller ────────────────────────────────────────────────

function distillTweets(result: ScraperResult): string {
  const tweets = result.tweets;
  const profile = result.profile;
  const meta = result.metadata;

  // Language split
  const enTweets = tweets.filter(t => t.lang === "en" || t.lang === "en-gb");
  const zhTweets = tweets.filter(t => t.lang === "zh" || t.lang === "zh-cn" || t.lang === "zh-tw");

  // Length distribution
  const lengths = tweets.map(t => t.text.length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const lt50 = tweets.filter(t => t.text.length < 50).length;
  const lt140 = tweets.filter(t => t.text.length >= 50 && t.text.length < 140).length;
  const lt280 = tweets.filter(t => t.text.length >= 140 && t.text.length < 280).length;
  const gt280 = tweets.filter(t => t.text.length >= 280).length;

  // Engagement
  const totalLikes = tweets.reduce((a, t) => a + t.likeCount, 0);
  const totalRTs = tweets.reduce((a, t) => a + t.retweetCount, 0);
  const totalViews = tweets.reduce((a, t) => a + t.viewCount, 0);
  const avgLikes = totalLikes / tweets.length;
  const avgRTs = totalRTs / tweets.length;
  const avgViews = totalViews / tweets.length;

  // Top tweets by likes
  const topTweets = [...tweets].sort((a, b) => b.likeCount - a.likeCount).slice(0, 10);

  // Day of week
  const dow: Record<string, { count: number; totalLikes: number }> = {};
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
    dow[day] = { count: 0, totalLikes: 0 };
  }
  for (const tweet of tweets) {
    const d = new Date(tweet.createdAt).getDay();
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
    dow[dayName].count++;
    dow[dayName].totalLikes += tweet.likeCount;
  }

  // Type distribution
  const replies = tweets.filter(t => t.isReply).length;
  const originals = tweets.filter(t => !t.isReply).length;

  // Emoji frequency
  const emojiCount: Record<string, number> = {};
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  for (const tweet of tweets) {
    const emojis = tweet.text.match(emojiRegex) || [];
    for (const e of emojis) emojiCount[e] = (emojiCount[e] || 0) + 1;
  }
  const topEmojis = Object.entries(emojiCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Top EN words (simple stopword filter)
  const enStopwords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "to", "of", "and", "in", "that", "it", "for", "on", "with", "as", "at", "by", "from", "or", "this", "have", "has", "had", "not", "but", "what", "all", "were", "when", "we", "you", "your", "i", "my", "me", "do", "so", "just", "get", "if", "about", "would", "there", "their", "which", "out", "up", "more", "one", "can", "will", "than", "also", "how", "its", "no", "been", "very", "because", "into", "them", "only", "some", "other", "these", "then", "like", "him", "her", "his", "our", "who", "over", "such", "any", "now", "after", "before", "new", "back", "most", "dont", "know", "want", "make", "go", "see", "think", "time", "really", "good", "great", "right", "way", "first", "need", "here", "even", "still", "say", "said", "take", "year", "years"]);
  const wordCount: Record<string, number> = {};
  for (const tweet of enTweets) {
    const words = tweet.text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && !enStopwords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    }
  }
  const topWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Top ZH n-grams (2-char minimum)
  const zhCharCount: Record<string, number> = {};
  for (const tweet of zhTweets) {
    const chars = tweet.text.match(/[\u4e00-\u9fff]{2,}/g) || [];
    for (const c of chars) {
      zhCharCount[c] = (zhCharCount[c] || 0) + 1;
    }
  }
  const topZh = Object.entries(zhCharCount).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Generate markdown
  const topTweetsMd = topTweets.map(t =>
    `| ${t.likeCount.toLocaleString()} likes | ${t.lang} | ${t.text.slice(0, 120).replace(/\|/g, "\\|")} |`
  ).join("\n");

  const emojiMd = topEmojis.map(([emoji, count]) =>
    `| ${emoji} | ${count} |`
  ).join("\n");

  const wordMd = topWords.map(([word, count]) =>
    `| ${word} | ${count} |`
  ).join("\n");

  const zhMd = topZh.map(([phrase, count]) =>
    `| ${phrase} | ${count} |`
  ).join("\n");

  const dowMd = Object.entries(dow).map(([day, data]) =>
    `| ${day} | ${data.count} | ${Math.round(data.totalLikes / data.count)} |`
  ).join("\n");

  return `# Tweet Statistics — ${profile.name}

> **@${profile.username}** | ${meta.tweetsScraped.toLocaleString()} tweets | ${meta.oldestTweet ? new Date(meta.oldestTweet).getFullYear() : "?"}–${meta.newestTweet ? new Date(meta.newestTweet).getFullYear() : "?"} | Scraped: ${meta.scrapedAt}
> **Language split:** ${enTweets.length} EN (${Math.round(enTweets.length / tweets.length * 100)}%) / ${zhTweets.length} ZH (${Math.round(zhTweets.length / tweets.length * 100)}%)

---

## Volume Overview

| Metric | Value |
|--------|------:|
| Total tweets | ${meta.tweetsScraped.toLocaleString()} |
| EN tweets | ${enTweets.length.toLocaleString()} |
| ZH tweets | ${zhTweets.length.toLocaleString()} |
| Followers | ${profile.followers.toLocaleString()} |
| Following | ${profile.following.toLocaleString()} |
| Joined | ${profile.joinedAt} |

---

## Character Length Distribution

| Range | Count | % |
|-------|------:|--:|
| < 50 chars | ${lt50} | ${Math.round(lt50 / tweets.length * 100)}% |
| 50–140 chars | ${lt140} | ${Math.round(lt140 / tweets.length * 100)}% |
| 140–280 chars | ${lt280} | ${Math.round(lt280 / tweets.length * 100)}% |
| > 280 chars | ${gt280} | ${Math.round(gt280 / tweets.length * 100)}% |
| **Average** | | **${Math.round(avgLen)} chars** |

---

## Engagement Stats

| Metric | Value |
|--------|------:|
| Avg likes / tweet | ${Math.round(avgLikes).toLocaleString()} |
| Avg retweets / tweet | ${Math.round(avgRTs).toLocaleString()} |
| Avg views / tweet | ${Math.round(avgViews).toLocaleString()} |
| Total likes | ${totalLikes.toLocaleString()} |
| Total retweets | ${totalRTs.toLocaleString()} |
| Total views | ${totalViews.toLocaleString()} |

---

## Top 10 Tweets by Likes

| Likes | Lang | Text |
|------:|-----:|------|
${topTweetsMd}

---

## Day-of-Week Activity

| Day | Tweets | Avg Likes |
|-----|-------:|----------:|
${dowMd}

---

## Emoji Fingerprint (Top 10)

| Emoji | Count |
|------:|------:|
${emojiMd}

---

## Top EN Vocabulary (stopwords filtered, top 30)

| Word | Count |
|------|------:|
${wordMd}

---

## Top ZH Phrases (2+ char, top 30)

| Phrase | Count |
|--------|------:|
${zhMd}

---

## Post Type Distribution

| Type | Count | % |
|------|------:|--:|
| Original | ${originals} | ${Math.round(originals / tweets.length * 100)}% |
| Reply | ${replies} | ${Math.round(replies / tweets.length * 100)}% |

---

## Bio

> ${profile.bio}

---

*Generated by \`scripts/research/2_distill/distill.ts\` from ${meta.tweetsScraped.toLocaleString()} tweets*
`;
}

// ─── Source Catalog Distiller ─────────────────────────────────────────────────

function distillSourceCatalog(pages: WebPage[]): string {
  const lines: string[] = [
    "# Source Catalog",
    "",
    `> **${pages.length} sources** scraped.`,
    "",
    "| # | Label | URL | Status | Chars |",
    "|--:|-------|-----|--------|------:|",
  ];

  pages.forEach((page, i) => {
    const label = page.title.slice(0, 40);
    const url = page.url.slice(0, 60);
    lines.push(`| ${i + 1} | ${label} | ${url} | ${page.statusCode === 200 ? "✅" : "❌ " + page.statusCode} | ${page.markdown.length.toLocaleString()} |`);
  });

  lines.push("");
  lines.push("## Priority Targets (not scraped)");
  lines.push("");
  lines.push("Add any missing sources here after manual collection.");

  return lines.join("\n");
}

// ─── WebPage extended with classification fields ──────────────────────────────────

interface EnrichedWebPage extends WebPage {
  sourceType?: string;
  layer?: string;
  trustWeight?: number;
  relevanceScore?: number;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

interface DistillOptions {
  agent?: string;  // "1" | "2" | "3" | "4" | "5" | "6" | "claims"
}

function distill(personaId: string, options: DistillOptions = {}): void {
  const { agent } = options;
  const outDir = resolve(OUTPUT_DIR, personaId);
  const dataDir = DATA_DIR;

  mkdirSync(outDir, { recursive: true });

  // Load all data upfront for cross-layer analysis
  let allWebPages: EnrichedWebPage[] = [];
  const webPath = resolve(dataDir, `${personaId}_web.json`);
  if (existsSync(webPath)) {
    const raw: EnrichedWebPage[] = JSON.parse(readFileSync(webPath, "utf-8"));
    allWebPages = raw;
  }

  const adversarialPages = allWebPages.filter(p =>
    (p.layer === "adversarial" || p.sourceType === "adversarial-critique") &&
    p.statusCode === 200 && p.markdown.length > 100
  );

  // Agent 3: Tweet statistics
  if (!agent || agent === "3") {
    const tweetPath = resolve(dataDir, `${personaId}_tweets.json`);
    if (existsSync(tweetPath)) {
      const raw = readFileSync(tweetPath, "utf-8");
      const result: ScraperResult = JSON.parse(raw);
      const stats = distillTweets(result);
      writeFileSync(resolve(outDir, "01-tweet-statistics.md"), stats);
      console.log(`  ✅ 01-tweet-statistics.md (${result.tweets.length} tweets)`);
    } else {
      console.log(`  ⚠️  No tweet data found for "${personaId}" at ${tweetPath}`);
    }
  }

  // Agent 1+2: Web pages
  if (!agent || agent === "1" || agent === "2") {
    if (existsSync(webPath)) {
      const pages: WebPage[] = JSON.parse(readFileSync(webPath, "utf-8"));
      const catalog = distillSourceCatalog(pages);
      writeFileSync(resolve(outDir, "00-source-catalog.md"), catalog);
      console.log(`  ✅ 00-source-catalog.md (${pages.length} pages)`);
    }
  }

  // Agent 4+5: Deep research
  if (!agent || agent === "4" || agent === "5") {
    const deepPath = resolve(dataDir, `${personaId}_deep.json`);
    if (existsSync(deepPath)) {
      const result: DeepResearchResult = JSON.parse(readFileSync(deepPath, "utf-8"));
      const markdown = result.markdown || result.data?.markdown || "";
      if (markdown.length > 100) {
        writeFileSync(resolve(outDir, "04-deep-research.md"), "# Deep Research — " + personaId + "\n\n" + markdown);
        console.log(`  ✅ 04-deep-research.md (${markdown.length} chars)`);
      }
    }
  }

  // Agent 7: Claim extraction + contradiction detection (NEW)
  if (!agent || agent === "claims" || agent === "all") {
    if (allWebPages.length > 0) {
      const successful = allWebPages.filter(p => p.statusCode === 200 && p.markdown.length > 100);
      const allClaims: Claim[] = [];

      for (const page of successful) {
        const pageClaims = extractClaims(page.markdown || "", {
          url: page.url,
          sourceType: page.sourceType || "unknown",
          layer: page.layer || "unknown",
          trustWeight: page.trustWeight,
          relevanceScore: page.relevanceScore,
        });
        allClaims.push(...pageClaims);
      }

      console.log(`  📊 Extracted ${allClaims.length} claims from ${successful.length} pages`);

      const contradictions = detectContradictions(allClaims, adversarialPages);
      console.log(`  🔍 Detected ${contradictions.length} potential contradictions`);

      const report = generateClaimsAndContradictionsMd(allClaims, contradictions, successful.length);
      writeFileSync(resolve(outDir, "07-claims-contradictions.md"), report);
      console.log(`  ✅ 07-claims-contradictions.md (${allClaims.length} claims, ${contradictions.length} contradictions)`);
    } else {
      console.log(`  ⚠️  No web pages found — run pipeline.ts first to collect data`);
    }
  }

  console.log(`\n📁 Output: ../output/${personaId}/`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const personaId = args[0];
  const agentArg = args.find(a => a.startsWith("--agent="));

  if (!personaId) {
    console.error("Usage: npx tsx scripts/research/2_distill/distill.ts <persona-id>");
    console.error("  npx tsx scripts/research/2_distill/distill.ts warren-buffett");
    console.error("  npx tsx scripts/research/2_distill/distill.ts warren-buffett --agent=3");
    console.error("  npx tsx scripts/research/2_distill/distill.ts warren-buffett --agent=claims");
    console.error("\nAgents:");
    console.error("  1      Web pages → source catalog");
    console.error("  2      (alias for 1)");
    console.error("  3      Tweets → statistics");
    console.error("  4      Deep research → markdown");
    console.error("  5      (alias for 4)");
    console.error("  claims Auto-extract claims + detect contradictions from all web pages");
    console.error("  all    Run all agents including claim extraction");
    process.exit(1);
  }

  console.log(`\n🔬 Distilling: ${personaId}`);
  distill(personaId, {
    agent: agentArg ? agentArg.replace("--agent=", "") : undefined,
  });
}

main();
