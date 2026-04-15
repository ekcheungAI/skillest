#!/usr/bin/env tsx
/**
 * threads-scraper.ts
 *
 * Scrapes Threads posts from a given user using Meta's Graph API.
 * Supports pagination to collect posts with full engagement metadata.
 *
 * Usage:
 *   npx tsx scripts/research/threads-scraper.ts 26144959155165366
 *   npx tsx scripts/research/threads-scraper.ts 26144959155165366 --count 200
 *
 * IMPORTANT: Threads Graph API user tokens can ONLY read the token owner's
 * own data. To scrape another user's Threads, you need a Pages token with
 * the threads_get_updates permission, or a Threads token scoped to that user.
 * The token owner (shrimpagent / @shrimpagent) is 26144959155165366.
 *
 * Requires: VITE_META_THREADS_TOKEN in .env
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

const META_API = "https://graph.threads.net";

interface ThreadsPost {
  id: string;
  text: string;
  timestamp: string;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  viewCount: number;
  username: string;
  isReply: boolean;
  parentId?: string;
}

interface ThreadsProfile {
  id: string;
  username: string;
  name: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  profilePictureUrl: string;
}

interface ThreadsResult {
  posts: ThreadsPost[];
  profile: ThreadsProfile;
  metadata: {
    scrapedAt: string;
    postsScraped: number;
    oldestPost: string | null;
    newestPost: string | null;
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Get Threads user ID from username.
 * NOTE: Threads Graph API does NOT support /:username lookups for user tokens.
 * If you know the numeric ID, pass it directly. If username is numeric, use it as-is.
 * Requires a Pages token or threads_get_updates permission for username lookups.
 */
async function resolveUserId(token: string, username: string): Promise<string> {
  // If it looks like a numeric ID, use it directly
  if (/^\d+$/.test(username)) return username;
  // threads_get_updates permission + Pages token can do /:username → ID
  // For now, throw if we can't look up
  throw new Error(
    `Threads API does not support username→ID lookup for user tokens. ` +
    `Pass the numeric Threads user ID directly (e.g., 26144959155165366). ` +
    `To scrape another user's Threads, obtain a Threads token with ` +
    `threads_get_updates permission for that specific user.`
  );
}

async function getProfileById(
  token: string,
  userId: string
): Promise<ThreadsProfile> {
  const fields = [
    "id",
    "username",
    "name",
    "threads_biography",
    "threads_profile_picture_url",
  ].join(",");
  const res = await fetch(
    `${META_API}/${userId}?fields=${fields}&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(`Threads profile fetch failed: ${data.error.message}`);
  return {
    id: data.id,
    username: data.username,
    name: data.name || data.username,
    bio: data.threads_biography || "",
    followersCount: 0, // threads_profile endpoint doesn't expose follower counts
    followingCount: 0,
    profilePictureUrl: data.threads_profile_picture_url || "",
  };
}

async function fetchPostsPage(
  token: string,
  userId: string,
  cursor?: string
): Promise<{ posts: ThreadsPost[]; nextCursor?: string; hasMore: boolean }> {
  const fields = [
    "id",
    "text",
    "timestamp",
    "like_count",
    "reply_count",
    "repost_count",
    "view_count",
    "is_reply",
    "parent_id",
  ].join(",");
  let url = `${META_API}/${userId}/threads?fields=${fields}&access_token=${token}&limit=100`;
  if (cursor) url += `&after=${cursor}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    console.warn(`  ⚠️  Threads API error: ${data.error.message}`);
    return { posts: [], hasMore: false };
  }

  const rawPosts: any[] = data.data || [];
  const posts: ThreadsPost[] = rawPosts.map((p: any) => ({
    id: p.id,
    text: p.text || "",
    timestamp: p.timestamp || "",
    likeCount: p.like_count || 0,
    replyCount: p.reply_count || 0,
    repostCount: p.repost_count || 0,
    viewCount: p.view_count || 0,
    username: data.username || "",
    isReply: p.is_reply || false,
    parentId: p.parent_id || undefined,
  }));

  const nextCursor = data.paging?.cursors?.after;
  return { posts, nextCursor, hasMore: !!nextCursor };
}

// ─── Main scrape function ────────────────────────────────────────────────────

export interface ScrapeThreadsOptions {
  maxPosts?: number;
  resolveUsername?: (token: string, username: string) => Promise<string>;
}

export async function scrapeThreads(
  handle: string,
  options: ScrapeThreadsOptions = {}
): Promise<ThreadsResult> {
  const token = process.env.VITE_META_THREADS_TOKEN;
  if (!token) throw new Error("VITE_META_THREADS_TOKEN not set in .env");

  const maxPosts = options.maxPosts ?? 500;

  // Resolve user ID
  const userId = await (options.resolveUsername ?? resolveUserId)(token, handle);
  console.log(`  🔍 Threads user ID: ${userId}`);

  // Get profile
  const profile = await getProfileById(token, userId);
  console.log(
    `  👤 ${profile.name} (@${profile.username})`
  );

  // Paginate posts
  const allPosts: ThreadsPost[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  let page = 1;

  while (hasMore && allPosts.length < maxPosts) {
    const { posts, nextCursor } = await fetchPostsPage(token, userId, cursor);
    const fetched = posts.length;
    allPosts.push(...posts);
    console.log(
      `  📦 Page ${page}: fetched ${fetched} posts (total: ${allPosts.length}/${maxPosts})`
    );
    cursor = nextCursor;
    hasMore = posts.length > 0 && !!nextCursor && allPosts.length < maxPosts;
    page++;

    // Threads rate limit: ~1 req/sec
    await new Promise((r) => setTimeout(r, 1200));
  }

  const sliced = allPosts.slice(0, maxPosts);
  const sorted = sliced.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const timestamps = sorted.map((p) => p.timestamp).filter(Boolean);
  const oldestPost = timestamps[timestamps.length - 1] || null;
  const newestPost = timestamps[0] || null;

  return {
    posts: sorted,
    profile,
    metadata: {
      scrapedAt: new Date().toISOString(),
      postsScraped: sorted.length,
      oldestPost,
      newestPost,
    },
  };
}

// ─── CLI entry point ─────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const handle = args.find((a) => !a.startsWith("--")) || "";
  const countArg = args.find((a) => a.startsWith("--count="));
  const maxPosts = countArg ? parseInt(countArg.split("=")[1]) : 500;

  if (!handle) {
    console.error("Usage: npx tsx scripts/research/threads-scraper.ts <threads-user-id> [--count=N]");
    console.error("\nExample:");
    console.error("  npx tsx scripts/research/threads-scraper.ts 26144959155165366");
    process.exit(1);
  }

  console.log(`\n🧵 Threads scraper: ${handle}\n`);

  try {
    const result = await scrapeThreads(handle, { maxPosts });
    const { writeFileSync, mkdirSync } = await import("fs");
    mkdirSync("scripts/research/data", { recursive: true });
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeHandle = handle.replace(/\D/g, "");
    writeFileSync(
      `scripts/research/data/threads-${safeHandle}-${timestamp}.json`,
      JSON.stringify(result, null, 2)
    );
    console.log(
      `\n✅ Done: ${result.metadata.postsScraped} posts | @${result.profile.username}`
    );
    if (result.metadata.oldestPost) {
      console.log(
        `   Range: ${result.metadata.oldestPost.slice(0, 10)} → ${result.metadata.newestPost?.slice(0, 10)}`
      );
    }
  } catch (e: any) {
    console.error(`\n❌ Error: ${e.message}`);
    process.exit(1);
  }
}
