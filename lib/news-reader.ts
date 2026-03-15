import { supabase } from './supabase';

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

export async function fetchNews(category?: string): Promise<NewsArticle[]> {
  try {
    const { data, error } = await supabase.functions.invoke('news-reader', {
      body: { action: 'fetch', category: category || 'all' },
    });
    if (error) throw error;
    return (data as NewsResponse)?.articles || [];
  } catch {
    return [];
  }
}
