// Shared types for the persona research pipeline

export interface TwitterCredentials {
  apiKey: string;
}

export interface FirecrawlCredentials {
  apiKey: string;
}

export interface ScraperConfig {
  twitter: TwitterCredentials;
  firecrawl: FirecrawlCredentials;
}

// ─── Raw scraped data ────────────────────────────────────────────────────────

export interface RawTweet {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number;
  lang: string;
  isReply: boolean;
  conversationId: string;
  author: {
    name: string;
    userName: string;
    followers: number;
    following: number;
    profilePicture: string;
    bio: string;
    createdAt: string;
  };
}

export interface ScraperResult {
  tweets: RawTweet[];
  profile: {
    name: string;
    username: string;
    bio: string;
    followers: number;
    following: number;
    profileImage: string;
    bannerImage: string;
    joinedAt: string;
  };
  metadata: {
    scrapedAt: string;
    tweetsScraped: number;
    oldestTweet: string | null;
    newestTweet: string | null;
  };
}

// ─── Persona candidate ───────────────────────────────────────────────────────

export interface PersonaCandidate {
  twitterHandle: string;
  displayName: string;
  bio: string;
  website?: string;
  category: string[];
  reason: string; // why this person qualifies for the library
}

// ─── Firecrawl research result ────────────────────────────────────────────────

export interface WebResearchResult {
  url: string;
  title: string;
  markdown: string;
  statusCode: number;
  creditsUsed: number;
}
