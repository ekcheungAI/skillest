/**
 * Persona Data Enricher
 * Orchestrates Twitter + Firecrawl APIs to enhance persona data
 * Based on Nuwa methodology: 6-dimensional research + triple-verification synthesis
 */

import type { Persona } from '../personas';
import {
  getUserTweets,
  getUserProfile,
  analyzeVocabPatterns,
  analyzeExpressionDNA,
  PERSONA_TWITTER_MAP,
} from './twitter';
import {
  searchWeb,
  scrapePage,
  deepResearch,
  getRecentNewsForPersona,
  researchPersona,
  NewsItem,
} from './firecrawl';
import { personas } from '../personas';
import type {
  ThinkingFramework,
  VocabularyPattern,
  Relationship,
  BookOrResource,
  CompetitorProfile,
  MentalModel,
  SkillChainEntry,
  DecisionEntry,
  FailureCase,
  CompetitiveWorldview,
  UseCasePrompt,
  PromptVersion,
} from '../personas';

export interface EnrichmentResult {
  success: boolean;
  personaId: string;
  fieldsUpdated: string[];
  twitterData?: {
    tweetsLoaded: number;
    vocabPatternsFound: number;
  };
  firecrawlData?: {
    newsItemsFound: number;
    researchCompleted: boolean;
  };
  error?: string;
}

/**
 * Main enrichment orchestrator — run this per persona
 * Returns which fields were updated
 */
export async function enrichPersona(personaId: string): Promise<EnrichmentResult> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) {
    return { success: false, personaId, fieldsUpdated: [], error: 'Persona not found' };
  }

  const fieldsUpdated: string[] = [];
  const twitterUsername = PERSONA_TWITTER_MAP[personaId];

  // ── Step 1: Twitter data (if available) ─────────────────────────────────────
  let vocabPatterns: VocabularyPattern[] = [];
  let tweetsLoaded = 0;

  if (twitterUsername) {
    try {
      const tweets = await getUserTweets(twitterUsername, 100);
      if (tweets.length > 0) {
        tweetsLoaded = tweets.length;
        vocabPatterns = analyzeVocabPatterns(tweets);
        // If persona already has vocabularyPatterns, merge (add new unique ones)
        if (persona.vocabularyPatterns && persona.vocabularyPatterns.length > 0) {
          const existingPhrases = new Set(persona.vocabularyPatterns.map((p) => p.phrase));
          const newPatterns = vocabPatterns.filter((p) => !existingPhrases.has(p.phrase));
          persona.vocabularyPatterns = [...persona.vocabularyPatterns, ...newPatterns];
        } else {
          persona.vocabularyPatterns = vocabPatterns;
        }
        fieldsUpdated.push('vocabularyPatterns');
      }
    } catch (e) {
      console.warn(`[Enricher] Twitter enrichment failed for ${personaId}:`, e);
    }
  }

  // ── Step 2: Recent news via Firecrawl ───────────────────────────────────────
  try {
    const news = await getRecentNewsForPersona(persona.name, 10);
    if (news.length > 0) {
      // Merge with existing news, avoiding duplicates by headline
      const existingHeadlines = new Set(persona.recentNews.map((n) => n.headline));
      const newNews = news.filter((n) => !existingHeadlines.has(n.headline));
      if (newNews.length > 0) {
        persona.recentNews = [...newNews, ...persona.recentNews].slice(0, 10);
        fieldsUpdated.push('recentNews');
      }
    }
  } catch (e) {
    console.warn(`[Enricher] News enrichment failed for ${personaId}:`, e);
  }

  // ── Step 3: Update freshness status ─────────────────────────────────────────
  if (fieldsUpdated.includes('recentNews')) {
    const latestNews = persona.recentNews[0];
    if (latestNews) {
      const monthsSince = monthsSinceDate(latestNews.date);
      if (monthsSince < 1) persona.freshnessStatus = 'LIVE';
      else if (monthsSince < 3) persona.freshnessStatus = 'RECENT';
      else persona.freshnessStatus = 'STALE';
      fieldsUpdated.push('freshnessStatus');
    }
  }

  return {
    success: true,
    personaId,
    fieldsUpdated,
    twitterData: { tweetsLoaded, vocabPatternsFound: vocabPatterns.length },
    firecrawlData: {
      newsItemsFound: persona.recentNews.length,
      researchCompleted: false,
    },
  };
}

/**
 * Build a complete aiPersonaPrompt for a persona using Firecrawl deep research
 * This is the most intensive operation — use sparingly
 */
export async function buildPersonaPrompt(personaId: string): Promise<string | null> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;

  const twitterUsername = PERSONA_TWITTER_MAP[personaId];

  // ── Gather raw data from all sources ───────────────────────────────────────
  let expressionDNA = '';
  if (twitterUsername) {
    const tweets = await getUserTweets(twitterUsername, 50);
    if (tweets.length > 0) {
      const dna = analyzeExpressionDNA(tweets);
      expressionDNA = buildExpressionDNAString(dna, persona.name);
    }
  }

  // ── Deep research on the person ─────────────────────────────────────────────
  const researchQuery = `${persona.name} ${persona.nativeName || ''} ${persona.title} thinking style decision making philosophy methodology`;
  const research = await deepResearch(researchQuery, 365 * 5); // last 5 years

  // ── Build the prompt ────────────────────────────────────────────────────────
  const prompt = buildPromptFromResearch(persona, research, expressionDNA);
  return prompt;
}

/**
 * Update recentNews for a persona using Firecrawl search
 */
export async function updatePersonaNews(
  personaId: string,
  limit: number = 10
): Promise<{ added: number; total: number }> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return { added: 0, total: 0 };

  const news = await getRecentNewsForPersona(persona.name, limit);
  const existingHeadlines = new Set(persona.recentNews.map((n) => n.headline));
  const newNews = news.filter((n) => !existingHeadlines.has(n.headline));

  persona.recentNews = [...newNews, ...persona.recentNews].slice(0, 10);
  return { added: newNews.length, total: persona.recentNews.length };
}

/**
 * Build vocabularyPatterns from Twitter for a persona
 */
export async function buildVocabFromTwitter(personaId: string): Promise<VocabularyPattern[]> {
  const twitterUsername = PERSONA_TWITTER_MAP[personaId];
  if (!twitterUsername) return [];

  const tweets = await getUserTweets(twitterUsername, 200);
  if (tweets.length === 0) return [];

  return analyzeVocabPatterns(tweets);
}

/**
 * Research a person's biography and career from web sources
 */
export async function researchPerson(personaId: string): Promise<{
  biography: string;
  keyEvents: { year: string; event: string; impact: string }[];
  sources: string[];
} | null> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;

  const query = `${persona.name} biography career achievements ${persona.categories.join(' ')}`;
  return researchPersona(persona.name);
}

/**
 * Perform deep research for competitor intelligence
 */
export async function researchCompetitorIntelligence(personaId: string): Promise<{
  competitors: CompetitorProfile[];
  mentalModels: MentalModel[];
  skillChain: SkillChainEntry[];
  decisionJournal: DecisionEntry[];
  failureCases: FailureCase[];
  competitiveWorldview: CompetitiveWorldview;
} | null> {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;

  const researchQuery = `${persona.name} competitors strategy competitive advantage market position thinking frameworks`;
  const research = await deepResearch(researchQuery, 365 * 3);

  if (!research) return null;

  // Parse research markdown to extract structured information
  const markdown = research.markdown;
  const sections = research.sections;

  // This would need more sophisticated parsing in production
  // For now, return a placeholder structure
  return {
    competitors: parseCompetitorsFromResearch(sections, persona.name),
    mentalModels: parseMentalModelsFromResearch(sections, persona.name),
    skillChain: [],
    decisionJournal: [],
    failureCases: [],
    competitiveWorldview: {
      marketFrame: '',
      threatRanking: [],
      strategicFears: [],
      strategicConfidence: [],
      contrarianBeliefs: [],
    },
  };
}

// ─── Helper functions ───────────────────────────────────────────────────────

function monthsSinceDate(dateStr: string): number {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  } catch {
    return 999;
  }
}

function buildExpressionDNAString(
  dna: ReturnType<typeof analyzeExpressionDNA>,
  personName: string
): string {
  return `Expression style: ${dna.tone.formality} formality, ${dna.tone.humor === 'none' ? 'serious' : dna.tone.humor} humor, ${dna.tone.certainty} certainty.
Sentence style: avg ${dna.sentenceStyle.avgLength} words/sentence, ${dna.sentenceStyle.questionRatio}% questions, ${dna.sentenceStyle.exclamationRatio}% exclamations.
Rhythm: ${dna.rhythm.leadsWithConclusion ? 'Leads with conclusion' : 'Builds to conclusion'}, ${dna.rhythm.usesAnalogies ? 'uses analogies frequently' : 'direct style'}.
High-frequency vocabulary: ${dna.vocabulary.highFrequencyWords.slice(0, 10).join(', ')}.
Signature phrases: ${dna.vocabulary.signaturePhrases.slice(0, 5).join(', ') || 'none detected'}.`;
}

function buildPromptFromResearch(
  persona: Persona,
  research: { sections: { title: string; content: string }[]; markdown: string; sources: string[] } | null,
  expressionDNA: string
): string {
  // Extract key themes from research sections
  const themes: string[] = [];
  const decisions: string[] = [];
  const quotes: string[] = [];

  if (research) {
    for (const section of research.sections) {
      if (section.title.toLowerCase().includes('thinking') ||
          section.title.toLowerCase().includes('philosophy') ||
          section.title.toLowerCase().includes('approach')) {
        themes.push(section.content.slice(0, 500));
      }
      if (section.title.toLowerCase().includes('decision') ||
          section.title.toLowerCase().includes('choice')) {
        decisions.push(section.content.slice(0, 300));
      }
    }

    // Extract notable quotes from markdown
    const quoteMatches = research.markdown.match(/"[^"]{10,150}"/g) || [];
    quotes.push(...quoteMatches.slice(0, 5));
  }

  const themesText = themes.length > 0 ? themes.join('\n\n') : 'Based on public record and documented behavior.';
  const decisionsText = decisions.length > 0 ? decisions.join('\n') : '';
  const quotesText = quotes.length > 0 ? `Notable expressions:\n${quotes.map((q) => `- ${q}`).join('\n')}` : '';

  return `## ${persona.name} · AI Persona Prompt

**Activated when**: You are asked to think, decide, or advise using ${persona.name}'s perspective.

---

### Who You Are

You are ${persona.name}${persona.nativeName ? ` (${persona.nativeName})` : ''}, ${persona.title}.

${expressionDNA ? `\n### How You Speak\n${expressionDNA}\n` : ''}

---

### Core Thinking Frameworks

${themesText || `You approach problems through ${persona.thinkingFrameworks?.map(f => f.name).join(', ') || 'a distinctive set of mental models derived from your ${persona.categories.join(' and ')} experience.'}`}

${decisionsText ? `\n### How You Make Decisions\n${decisionsText}\n` : ''}

---

### Key Principles

${persona.thinkingFrameworks?.map((f, i) => `${i + 1}. **${f.name}**: ${f.description}`).join('\n') || ''}

---

### Your Voice in Action

${quotesText || persona.famousQuotes?.slice(0, 3).map(q => `- "${q}"`).join('\n') || ''}

---

### Honest Boundaries

This perspective is based on ${persona.name}'s publicly documented thinking and behavior. It cannot predict reactions to entirely novel situations, and public expression may differ from private deliberation. Information current as of ${new Date().toISOString().split('T')[0]}.

---
*Research sources: ${research?.sources?.slice(0, 5).join(', ') || 'Public records and documented interviews'}`;
}

function parseCompetitorsFromResearch(
  sections: { title: string; content: string }[],
  personName: string
): CompetitorProfile[] {
  const competitors: CompetitorProfile[] = [];
  const competitorSection = sections.find((s) =>
    s.title.toLowerCase().includes('competitor') || s.title.toLowerCase().includes('rival')
  );

  if (competitorSection) {
    // Basic parsing — would need refinement in production
    const names = competitorSection.content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    for (const name of [...new Set(names)].slice(0, 3)) {
      if (name !== personName) {
        competitors.push({
          name,
          relationship: 'Primary Rival',
          marketPosition: 'Competitor in overlapping market',
          competitiveDynamic: 'Ongoing competitive tension',
          tacticalResponse: 'Monitor closely',
          whatTheyDoBetter: 'TBD from further research',
          whatTheyDoWorse: 'TBD from further research',
          status: 'Active',
        });
      }
    }
  }

  return competitors;
}

function parseMentalModelsFromResearch(
  sections: { title: string; content: string }[],
  personName: string
): MentalModel[] {
  const mentalModels: MentalModel[] = [];
  const thinkingSection = sections.find((s) =>
    s.title.toLowerCase().includes('think') || s.title.toLowerCase().includes('model')
  );

  if (thinkingSection) {
    const lines = thinkingSection.content.split('\n').filter((l) => l.trim().length > 20);
    for (const line of lines.slice(0, 5)) {
      const cleaned = line.replace(/^#{1,6}\s*/, '').trim();
      if (cleaned.length > 10) {
        mentalModels.push({
          name: cleaned.split(' ').slice(0, 4).join(' '),
          origin: `Developed through ${personName}'s career experience`,
          trigger: `When facing ${cleaned.split(' ').slice(0, 2).join(' ')} type problems`,
          internalMonologue: `I recall that ${cleaned.toLowerCase()}`,
          output: cleaned,
          confidence: 'Pragmatic',
        });
      }
    }
  }

  return mentalModels;
}
