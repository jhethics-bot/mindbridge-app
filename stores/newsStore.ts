import { create } from 'zustand';
import { NewsArticle, fetchNews } from '../lib/news-reader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'mindbridge_news_cache';
const CACHE_TTL = 4 * 60 * 60 * 1000;

interface NewsState {
  articles: NewsArticle[];
  loading: boolean;
  lastFetched: number | null;
  selectedCategory: string | null;
  loadNews: (category?: string) => Promise<void>;
  setCategory: (cat: string | null) => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  articles: [],
  loading: false,
  lastFetched: null,
  selectedCategory: null,

  loadNews: async (category?: string) => {
    set({ loading: true });
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        const filtered = category
          ? parsed.articles.filter((a: NewsArticle) => a.category === category)
          : parsed.articles;
        set({ articles: filtered, loading: false, lastFetched: parsed.timestamp });
        return;
      }
    }
    try {
      const articles = await fetchNews(category);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ articles, timestamp: Date.now() }));
      set({ articles, loading: false, lastFetched: Date.now() });
    } catch {
      if (cached) {
        const parsed = JSON.parse(cached);
        set({ articles: parsed.articles, loading: false });
      } else {
        set({ articles: [], loading: false });
      }
    }
  },

  setCategory: (cat: string | null) => {
    set({ selectedCategory: cat });
    get().loadNews(cat || undefined);
  },
}));
