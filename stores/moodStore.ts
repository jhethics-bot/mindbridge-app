/**
 * moodStore - NeuBridge Mood State (Zustand)
 *
 * Tracks today's mood check-in, mood history for the week,
 * and the current in-session mood for AI queue calibration.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { MoodType, MoodCheckin } from '../types';

interface MoodState {
  // State
  todayMood: MoodType | null;
  todayCheckinId: string | null;
  weekHistory: MoodCheckin[];
  isLoading: boolean;

  // Actions
  loadTodayMood: (patientId: string) => Promise<void>;
  logMood: (patientId: string, mood: MoodType) => Promise<void>;
  loadWeekHistory: (patientId: string) => Promise<void>;
  resetForTesting: () => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  todayMood: null,
  todayCheckinId: null,
  weekHistory: [],
  isLoading: false,

  loadTodayMood: async (patientId) => {
    set({ isLoading: true });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('patient_id', patientId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    set({
      todayMood: data?.mood ?? null,
      todayCheckinId: data?.id ?? null,
      isLoading: false,
    });
  },

  logMood: async (patientId, mood) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('mood_checkins')
      .insert({ patient_id: patientId, mood })
      .select()
      .single();

    if (!error && data) {
      set({
        todayMood: mood,
        todayCheckinId: data.id,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  loadWeekHistory: async (patientId) => {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('patient_id', patientId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    set({ weekHistory: data ?? [] });
  },

  resetForTesting: () => set({ todayMood: null, todayCheckinId: null, weekHistory: [] }),
}));
