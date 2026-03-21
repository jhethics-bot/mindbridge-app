/**
 * authStore - NeuBridge Auth State (Zustand)
 *
 * Manages Supabase session, profile, and role-based routing.
 * Persisted via AsyncStorage through Supabase's built-in session persistence.
 */
import { create } from 'zustand';
import { supabase, getCurrentProfile } from '../lib/supabase';
import type { Profile, UserRole } from '../types';

interface AuthState {
  // State
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  role: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: async () => {
    try {
      const profile = await getCurrentProfile();
      set({
        profile,
        role: profile?.role ?? null,
        isHydrated: true,
        error: null,
      });
    } catch (e) {
      set({ isHydrated: true, error: null }); // Silent — user just not logged in
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const profile = await getCurrentProfile();
      set({ profile, role: profile?.role ?? null, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? 'Sign in failed' });
      throw e;
    }
  },

  signUp: async (email, password, role, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      // Create profile row
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role,
        display_name: displayName,
        stage: 'middle',
        faith_enabled: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        onboarding_complete: false,
      });
      if (profileError) throw profileError;

      const profile = await getCurrentProfile();
      set({ profile, role: profile?.role ?? null, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? 'Sign up failed' });
      throw e;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ profile: null, role: null, isLoading: false, error: null });
  },

  refreshProfile: async () => {
    const profile = await getCurrentProfile();
    set({ profile, role: profile?.role ?? null });
  },

  clearError: () => set({ error: null }),
}));
