// stores/petStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  computePetMood,
  getTimeOfDay,
  minutesSince,
} from '../lib/petMoodEngine';
import type { PetMoodState, PetType } from '../lib/petMoodEngine';

interface CompanionPet {
  id: string;
  careRelationshipId: string;
  petType: PetType;
  petName: string;
  colorPrimary: string;
  colorSecondary: string | null;
  caregiverVoiceUrl: string | null;
}

interface PetInteractionSummary {
  interactionCountToday: number;
  lastInteractionAt: string | null;
  weeklyTrend: number[]; // 7 day interaction counts, oldest first
}

interface PetStore {
  pet: CompanionPet | null;
  moodState: PetMoodState;
  interactionSummary: PetInteractionSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPet: (careRelationshipId: string) => Promise<void>;
  logInteraction: (interactionType: string, moodAtInteraction?: number) => Promise<void>;
  refreshMood: (activitiesCompletedToday: number, patientMoodScore: number | null) => void;
  fetchInteractionSummary: () => Promise<void>;
  reset: () => void;
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: null,
  moodState: 'calm',
  interactionSummary: null,
  isLoading: false,
  error: null,

  fetchPet: async (careRelationshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('companion_pets')
        .select('*')
        .eq('care_relationship_id', careRelationshipId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found (no pet yet)

      set({
        pet: data ? {
          id: data.id,
          careRelationshipId: data.care_relationship_id,
          petType: data.pet_type as PetType,
          petName: data.pet_name,
          colorPrimary: data.color_primary,
          colorSecondary: data.color_secondary,
          caregiverVoiceUrl: data.caregiver_voice_url,
        } : null,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  logInteraction: async (interactionType: string, moodAtInteraction?: number) => {
    const { pet } = get();
    if (!pet) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from('pet_interactions').insert({
        pet_id: pet.id,
        patient_id: user.id,
        interaction_type: interactionType,
        mood_at_interaction: moodAtInteraction ?? null,
      });

      // Refresh summary after logging
      get().fetchInteractionSummary();
    } catch (e) {
      console.warn('[PetStore] Failed to log interaction:', e);
    }
  },

  refreshMood: (activitiesCompletedToday: number, patientMoodScore: number | null) => {
    const { interactionSummary } = get();
    const result = computePetMood({
      timeOfDay: getTimeOfDay(),
      activitiesCompletedToday,
      lastInteractionMinutesAgo: minutesSince(interactionSummary?.lastInteractionAt),
      patientMoodScore,
    });
    set({ moodState: result.state });
  },

  fetchInteractionSummary: async () => {
    const { pet } = get();
    if (!pet) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's count
      const { count: todayCount } = await supabase
        .from('pet_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', pet.id)
        .gte('created_at', today.toISOString());

      // Last interaction
      const { data: lastData } = await supabase
        .from('pet_interactions')
        .select('created_at')
        .eq('pet_id', pet.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      set({
        interactionSummary: {
          interactionCountToday: todayCount ?? 0,
          lastInteractionAt: lastData?.created_at ?? null,
          weeklyTrend: [], // populated separately if needed
        },
      });
    } catch (e) {
      console.warn('[PetStore] Failed to fetch summary:', e);
    }
  },

  reset: () => set({
    pet: null,
    moodState: 'calm',
    interactionSummary: null,
    isLoading: false,
    error: null,
  }),
}));
