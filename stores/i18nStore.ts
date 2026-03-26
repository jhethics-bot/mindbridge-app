/**
 * i18nStore — NeuBridge Internationalization State (Zustand)
 *
 * Wraps lib/i18n.ts engine with reactive Zustand state so
 * components re-render when the locale changes.
 */
import { create } from 'zustand';
import { initI18n, t as rawT, getLocale, setLocale, getAvailableLocales } from '../lib/i18n';

interface I18nState {
  locale: string;
  isLoaded: boolean;
  availableLocales: { code: string; name: string; nativeName: string }[];

  // Actions
  initLocale: () => Promise<void>;
  switchLocale: (locale: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: 'en',
  isLoaded: false,
  availableLocales: getAvailableLocales(),

  initLocale: async () => {
    await initI18n();
    set({ locale: getLocale(), isLoaded: true });
  },

  switchLocale: async (locale: string) => {
    await setLocale(locale);
    // Re-init to reload strings for new locale
    await initI18n();
    set({ locale });
  },

  t: (key: string, fallback?: string) => {
    const result = rawT(key);
    // If rawT returned the key itself (no translation), use fallback
    if (result === key && fallback) return fallback;
    return result;
  },
}));
