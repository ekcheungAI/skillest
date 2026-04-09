/**
 * TwitterAPI.io integration for persona vocabulary/expression analysis
 * Docs: https://docs.twitterapi.io/introduction
 */

const TWITTER_API_BASE = 'https://api.twitterapi.io/twitter';

export interface TwitterUserProfile {
  userName: string;
  displayName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  profileImageUrl: string;
  verified: boolean;
  createdAt: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  lang: string;
  source: string;
  isRetweet: boolean;
  isQuote: boolean;
  inReplyToUserName: string | null;
  isReply: boolean;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
}

export interface TwitterUserTweetsResponse {
  tweets: TwitterTweet[];
  nextToken?: string;
  total: number;
}

export interface VocabPattern {
  phrase: string;
  context: string;
  frequency: 'Rare' | 'Occasional' | 'Common' | 'Signature';
}

export interface ExpressionDNA {
  sentenceStyle: {
    avgLength: number;
    questionRatio: number;
    exclamationRatio: number;
    imperativeRatio: number;
  };
  vocabulary: {
    highFrequencyWords: string[];
    signaturePhrases: string[];
    tabooWords: string[];
  };
  tone: {
    certainty: 'high' | 'medium' | 'low';
    formality: 'formal' | 'casual' | 'mixed';
    humor: 'none' | 'dry' | 'witty' | 'self-deprecating';
  };
  rhythm: {
    leadsWithConclusion: boolean;
    usesAnalogies: boolean;
   转折Frequency: number;
  };
}

/**
 * Get user profile by Twitter username
 */
export async function getUserProfile(
  username: string
): Promise<TwitterUserProfile | null> {
  const apiKey = import.meta.env.VITE_TWITTER_API_KEY;
  if (!apiKey) {
    console.warn('[TwitterAPI] No API key found');
    return null;
  }

  try {
    const response = await fetch(
      `${TWITTER_API_BASE}/user?userName=${encodeURIComponent(username)}`,
      {
        headers: {
          'X-API-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[TwitterAPI] getUserProfile error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[TwitterAPI] getUserProfile error:`, error);
    return null;
  }
}

/**
 * Get user tweets by Twitter username
 */
export async function getUserTweets(
  username: string,
  limit: number = 100
): Promise<TwitterTweet[]> {
  const apiKey = import.meta.env.VITE_TWITTER_API_KEY;
  if (!apiKey) {
    console.warn('[TwitterAPI] No API key found');
    return [];
  }

  try {
    const response = await fetch(
      `${TWITTER_API_BASE}/user/tweets?userName=${encodeURIComponent(username)}&maxResults=${limit}`,
      {
        headers: {
          'X-API-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[TwitterAPI] getUserTweets error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.tweets || [];
  } catch (error) {
    console.error(`[TwitterAPI] getUserTweets error:`, error);
    return [];
  }
}

/**
 * Analyze tweets to extract vocabulary patterns
 */
export function analyzeVocabPatterns(tweets: TwitterTweet[]): VocabPattern[] {
  if (tweets.length === 0) return [];

  const text = tweets.map((t) => t.text).join(' ');

  // Extract common word pairs and phrases
  const wordPairs = new Map<string, number>();
  const words = text.split(/\s+/).filter((w) => w.length > 3);

  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`.toLowerCase();
    wordPairs.set(pair, (wordPairs.get(pair) || 0) + 1);
  }

  // Also extract common 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const triple = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase();
    wordPairs.set(triple, (wordPairs.get(triple) || 0) + 1);
  }

  // Convert to patterns, filtering out common English stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'you', 'are',
    'was', 'were', 'been', 'have', 'has', 'had', 'but', 'not', 'all',
    'can', 'will', 'just', 'its', 'what', 'when', 'your', 'our', 'his',
    'her', 'their', 'they', 'them', 'out', 'about', 'more', 'some',
  ]);

  const patterns: VocabPattern[] = [];
  const sortedPairs = [...wordPairs.entries()]
    .filter(([pair]) => {
      const words = pair.split(' ');
      return !words.some((w) => stopWords.has(w));
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);

  const highFrequencyThreshold = Math.ceil(tweets.length * 0.08); // 8%
  const mediumFrequencyThreshold = Math.ceil(tweets.length * 0.03); // 3%

  for (const [phrase, count] of sortedPairs) {
    const frequency = count >= highFrequencyThreshold ? 'Signature' as const
      : count >= mediumFrequencyThreshold ? 'Common' as const
      : 'Occasional' as const;
    patterns.push({
      phrase,
      context: 'Signature phrase or commonly used expression',
      frequency,
    });
  }

  return patterns;
}

/**
 * Analyze tweets to extract expression DNA
 */
export function analyzeExpressionDNA(tweets: TwitterTweet[]): ExpressionDNA {
  if (tweets.length === 0) {
    return {
      sentenceStyle: { avgLength: 0, questionRatio: 0, exclamationRatio: 0, imperativeRatio: 0 },
      vocabulary: { highFrequencyWords: [], signaturePhrases: [], tabooWords: [] },
      tone: { certainty: 'medium', formality: 'mixed', humor: 'none' },
      rhythm: { leadsWithConclusion: false, usesAnalogies: false, 转折Frequency: 0 },
    };
  }

  const texts = tweets.map((t) => t.text);
  const totalWords = texts.reduce((acc, t) => acc + t.split(/\s+/).length, 0);
  const totalChars = texts.reduce((acc, t) => acc + t.length, 0);
  const avgLength = totalWords / texts.length;

  const questionCount = texts.filter((t) => /\?/.test(t)).length;
  const exclamationCount = texts.filter((t) => /!/.test(t)).length;
  const imperativeCount = texts.filter((t) => /^[A-Z].*(will|should|must|need|don't|do|go|let's|come)/i.test(t)).length;

  const questionRatio = questionCount / tweets.length;
  const exclamationRatio = exclamationCount / tweets.length;
  const imperativeRatio = imperativeCount / tweets.length;

  // Analyze vocabulary
  const wordFreq = new Map<string, number>();
  for (const text of texts) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const word of words) {
      if (word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
  }

  const sortedWords = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);
  const highFrequencyWords = sortedWords.slice(0, 20).map(([w]) => w);

  // Find signature phrases (appear in >5% of tweets)
  const phraseFreq = new Map<string, number>();
  for (const text of texts) {
    const phrases = text.toLowerCase().match(/(?:[a-z]+\s+){0,2}[a-z]{4,}(?:\s+[a-z]+){0,2}/g) || [];
    for (const phrase of phrases) {
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    }
  }

  const signaturePhrases = [...phraseFreq.entries()]
    .filter(([, count]) => count >= tweets.length * 0.05)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([p]) => p);

  // Analyze certainty
  const certaintyWords = ['definitely', 'absolutely', 'always', 'never', 'clearly', 'obviously', 'must', 'certainly'];
  const uncertaintyWords = ['maybe', 'perhaps', 'might', 'could', 'probably', 'possibly', 'think', 'believe', 'guess'];
  let certaintyCount = 0;
  let uncertaintyCount = 0;
  for (const text of texts) {
    const lower = text.toLowerCase();
    certaintyCount += certaintyWords.filter((w) => lower.includes(w)).length;
    uncertaintyCount += uncertaintyWords.filter((w) => lower.includes(w)).length;
  }

  const certainty = certaintyCount > uncertaintyCount * 2 ? 'high'
    : uncertaintyCount > certaintyCount * 2 ? 'low'
    : 'medium';

  // Analyze formality
  const formalWords = ['therefore', 'however', 'furthermore', 'consequently', 'nevertheless', 'accordingly'];
  const casualWords = ['lol', 'btw', 'gonna', 'wanna', 'yeah', 'hey', 'guys', 'awesome', 'cool'];
  let formalCount = 0;
  let casualCount = 0;
  for (const text of texts) {
    const lower = text.toLowerCase();
    formalCount += formalWords.filter((w) => lower.includes(w)).length;
    casualCount += casualWords.filter((w) => lower.includes(w)).length;
  }

  const formality = formalCount > casualCount * 2 ? 'formal'
    : casualCount > formalCount * 2 ? 'casual'
    : 'mixed';

  // Analyze humor
  const humorMarkers = ['lol', 'haha', "i'm kidding", 'jk', 'jk', 'sarcasm', 'obvious'];
  const humorCount = texts.filter((t) =>
    humorMarkers.some((m) => t.toLowerCase().includes(m))
  ).length;
  const humor = humorCount > tweets.length * 0.1 ? 'witty'
    : humorCount > 0 ? 'dry'
    : 'none';

  // Analyze rhythm
  const conclusionFirst = texts.filter((t) => {
    const words = t.trim().split(/\s+/);
    const firstClause = words.slice(0, Math.min(5, words.length)).join(' ');
    return firstClause.length > 20 && /^(yes|no|so|the|i think|i believe|actually)/i.test(firstClause) === false;
  }).length;
  const usesAnalogies = texts.filter((t) => /like |比喻|如同|好像|就好比/i.test(t)).length;
  const 转折Count = texts.filter((t) => /but|however|though|although|然而|但是|不过/i.test(t)).length;

  return {
    sentenceStyle: {
      avgLength: Math.round(avgLength),
      questionRatio: Math.round(questionRatio * 100),
      exclamationRatio: Math.round(exclamationRatio * 100),
      imperativeRatio: Math.round(imperativeRatio * 100),
    },
    vocabulary: {
      highFrequencyWords,
      signaturePhrases,
      tabooWords: [],
    },
    tone: {
      certainty,
      formality,
      humor,
    },
    rhythm: {
      leadsWithConclusion: conclusionFirst / texts.length > 0.3,
      usesAnalogies: usesAnalogies > texts.length * 0.05,
      转折Frequency: Math.round(转折Count / tweets.length * 100),
    },
  };
}

/**
 * Twitter username mapping for known personas
 * Maps our persona ID to their Twitter/X username
 */
export const PERSONA_TWITTER_MAP: Record<string, string> = {
  'elon-musk': 'elonmusk',
  'donald-trump': 'realDonaldTrump',
  'jack-ma': 'JackMa',
  'warren-buffett': 'WarrenBuffett',
  'jeff-bezos': 'JeffBezos',
  'charlie-munger': 'charlie_munger',
  'kobe-bryant': 'kobebryant',
  'lionel-messi': 'leomessi',
  'cristiano-ronaldo': 'Cristiano',
  'tiger-woods': 'TigerWoods',
  'simone-biles': 'Simone_Biles',
  'usain-bolt': 'usainbolt',
  'lebron-james': 'KingJames',
  'tom-brady': 'TomBrady',
  'roger-federer': 'rogerfederer',
  'stephen-curry': 'StephenCurry30',
  'novak-djokovic': 'DjokNole',
  'lars-reger': 'LarsReger',
  'philipp-herzig': 'pherzig',
  'gustav-soderstrom': 'GustavNordic',
};
