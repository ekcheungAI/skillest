/**
 * Firecrawl API integration for deep research and web scraping
 * Docs: https://docs.firecrawl.dev
 */

const FIRESCRAPER_BASE = 'https://api.firecrawl.dev/v0';

export interface FirecrawlPage {
  title: string;
  description: string;
  url: string;
  markdown: string;
  html: string;
  rawHtml: string;
  metadata: {
    title?: string;
    description?: string;
    author?: string;
    publishedDate?: string;
    tags?: string[];
    source?: string;
    ogImage?: string;
  };
}

export interface FirecrawlSearchResult {
  title: string;
  description: string;
  url: string;
  publishedDate?: string;
  raw: string;
}

export interface FirecrawlSearchResponse {
  success: boolean;
  data: FirecrawlSearchResult[];
}

export interface FirecrawlScrapeResponse {
  success: boolean;
  data: FirecrawlPage;
}

export interface FirecrawlDeepResearchResponse {
  success: boolean;
  data: {
    title: string;
    description: string;
    sources: string[];
    markdown: string;
    sections: DeepResearchSection[];
  };
}

export interface DeepResearchSection {
  title: string;
  content: string;
}

export interface NewsItem {
  date: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Controversial';
  tags: string[];
}

function getApiKey(): string {
  const key = import.meta.env.VITE_FIRECRAWL_API_KEY;
  if (!key) {
    console.warn('[Firecrawl] No API key found');
  }
  return key || '';
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getApiKey()}`,
  };
}

/**
 * Scrape a single URL and return parsed content
 */
export async function scrapePage(url: string): Promise<FirecrawlPage | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${FIRESCRAPER_BASE}/scrape`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html', 'metadata'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`[Firecrawl] scrapePage error: ${response.status} for ${url}`);
      return null;
    }

    const data: FirecrawlScrapeResponse = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`[Firecrawl] scrapePage error:`, error);
    return null;
  }
}

/**
 * Search the web for a query and return results
 */
export async function searchWeb(
  query: string,
  limit: number = 10
): Promise<FirecrawlSearchResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch(`${FIRESCRAPER_BASE}/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        query,
        limit,
        searchImmediately: true,
      }),
    });

    if (!response.ok) {
      console.error(`[Firecrawl] searchWeb error: ${response.status} for query: ${query}`);
      return [];
    }

    const data: FirecrawlSearchResponse = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error(`[Firecrawl] searchWeb error:`, error);
    return [];
  }
}

/**
 * Perform deep research on a topic/question
 * This uses Firecrawl's AI-powered research capability
 */
export async function deepResearch(
  query: string,
  recencyDays?: number
): Promise<{
  title: string;
  description: string;
  sources: string[];
  markdown: string;
  sections: DeepResearchSection[];
} | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${FIRESCRAPER_BASE}/deep-search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        query,
        recencyDays,
        maxAttempts: 3,
      }),
    });

    if (!response.ok) {
      console.error(`[Firecrawl] deepResearch error: ${response.status} for query: ${query}`);
      return null;
    }

    const data: FirecrawlDeepResearchResponse = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`[Firecrawl] deepResearch error:`, error);
    return null;
  }
}

/**
 * Batch scrape multiple URLs in parallel
 */
export async function batchScrape(urls: string[]): Promise<FirecrawlPage[]> {
  const results = await Promise.all(urls.map((url) => scrapePage(url)));
  return results.filter((r): r is FirecrawlPage => r !== null);
}

/**
 * Get recent news for a persona (last 6 months)
 */
export async function getRecentNewsForPersona(
  name: string,
  limit: number = 10
): Promise<NewsItem[]> {
  const query = `${name} news 2024 2025`;
  const results = await searchWeb(query, limit);

  const newsItems: NewsItem[] = results.map((result) => {
    // Determine sentiment based on common keywords
    const positiveWords = ['success', 'win', 'growth', 'achievement', 'partnership', 'launch', 'breakthrough', 'record', 'champion', 'award'];
    const negativeWords = ['lawsuit', 'scandal', 'investigation', 'fraud', 'crisis', 'failure', 'accused', 'lawsuit', 'suspended', 'retirement'];
    const text = `${result.title} ${result.description}`.toLowerCase();

    let sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Controversial' = 'Neutral';
    if (negativeWords.some((w) => text.includes(w))) sentiment = 'Negative';
    if (positiveWords.some((w) => text.includes(w)) && sentiment !== 'Negative') sentiment = 'Positive';
    if (['controversy', 'dispute', 'debate'].some((w) => text.includes(w))) sentiment = 'Controversial';

    return {
      date: result.publishedDate || new Date().toISOString().split('T')[0],
      headline: result.title,
      summary: result.description,
      source: new URL(result.url).hostname.replace('www.', ''),
      sourceUrl: result.url,
      sentiment,
      tags: [],
    };
  });

  return newsItems;
}

/**
 * Research a person's biography and career from web sources
 */
export async function researchPersona(name: string): Promise<{
  biography: string;
  keyEvents: { year: string; event: string; impact: string }[];
  sources: string[];
  relationships: { name: string; type: string; description: string }[];
} | null> {
  // First search for Wikipedia and authoritative sources
  const searchResults = await searchWeb(`${name} biography career achievements`, 10);

  // Filter for high-quality sources
  const highQualitySources = searchResults.filter((r) =>
    /wikipedia|forbes|bloomberg|economist|nytimes|wsj|cnn|business|official/i.test(r.url)
  );

  // Scrape top sources
  const urlsToScrape = highQualitySources.slice(0, 5).map((r) => r.url);
  const pages = await batchScrape(urlsToScrape);

  if (pages.length === 0) {
    // Fall back to any available sources
    const fallbackUrls = searchResults.slice(0, 3).map((r) => r.url);
    const fallbackPages = await batchScrape(fallbackUrls);
    if (fallbackPages.length === 0) return null;
  }

  const primarySource = pages[0];
  if (!primarySource) return null;

  // Extract key information
  const biography = primarySource.markdown.slice(0, 5000); // First 5000 chars as bio
  const sources = [...new Set(searchResults.map((r) => r.url))];

  // Extract year mentions for timeline
  const yearPattern = /\b(19|20)\d{2}\b/g;
  const years = primarySource.markdown.match(yearPattern) || [];
  const uniqueYears = [...new Set(years)].sort().slice(-10);

  const keyEvents = uniqueYears.map((year) => ({
    year,
    event: `Major activity around ${year}`,
    impact: 'Significant career milestone',
  }));

  return {
    biography,
    keyEvents,
    sources,
    relationships: [],
  };
}
