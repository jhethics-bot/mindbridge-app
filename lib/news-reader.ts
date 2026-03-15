import { callEdgeFunction } from './supabase';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  published_at: string;
  category: 'research' | 'caregiving' | 'treatment' | 'policy' | 'lifestyle';
  bias_removed: boolean;
}

export interface NewsResponse {
  articles: NewsArticle[];
  last_fetched: string;
}

// Fetches and de-biases Alzheimer's/dementia news via Edge Function
export async function fetchNews(category?: string): Promise<NewsArticle[]> {
  try {
    const response = await callEdgeFunction<NewsResponse>('news-reader', {
      action: 'fetch',
      category: category || 'all',
    });
    return response.articles || [];
  } catch {
    // Return cached articles from AsyncStorage if offline
    return [];
  }
}

// AI-powered bias removal prompt template
export const BIAS_REMOVAL_SYSTEM_PROMPT = `You are a neutral medical news summarizer for Alzheimer's caregivers. Your job:

1. Rewrite the article summary to remove:
   - Political framing or partisan language
   - Sensationalist or fear-based phrasing
   - Pharmaceutical marketing language
   - Unsubstantiated miracle cure claims
   - Emotional manipulation

2. Keep:
   - Factual medical information
   - Study citations and sample sizes
   - Practical implications for caregivers
   - Treatment timelines and availability
   - Honest uncertainty when evidence is mixed

3. Tone: Warm, clear, and honest. Write for a tired caregiver reading at 10pm.
   Explain medical terms in parentheses. Keep summaries under 150 words.

4. Add a one-line "What this means for you" at the end.`;

// RSS feed sources for Alzheimer's news (used by Edge Function)
export const NEWS_SOURCES = [
  { name: 'Alzheimer\'s Association', url: 'https://www.alz.org/news/rss', category: 'research' },
  { name: 'NIA News', url: 'https://www.nia.nih.gov/news/rss', category: 'research' },
  { name: 'Being Patient', url: 'https://www.beingpatient.com/feed/', category: 'caregiving' },
  { name: 'Alzheimer\'s News Today', url: 'https://alzheimersnewstoday.com/feed/', category: 'treatment' },
];
