/**
 * settingsStore - NeuBridge Settings State (Zustand)
 *
 * Manages patient settings: disease stage, feature toggles,
 * PIN lock for caregiver settings, and faith preferences.
 * Synced with Supabase on load and on change.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { DiseaseStage } from '../types';

interface FeatureToggles {
  faith_enabled: boolean;
  music_enabled: boolean;
  games_enabled: boolean;
  exercise_enabled: boolean;
  community_enabled: boolean;
  news_enabled: boolean;
  voice_messages_enabled: boolean;
  photo_album_enabled: boolean;
  painting_enabled: boolean;
  singalong_enabled: boolean;
  sensory_mode_enabled: boolean;
  medication_reminders_enabled: boolean;
  push_notifications_enabled: boolean;
  companion_pet_enabled: boolean;
}

const DEFAULT_TOGGLES: FeatureToggles = {
  faith_enabled: false,
  music_enabled: true,
  games_enabled: true,
  exercise_enabled: true,
  community_enabled: true,
  news_enabled: true,
  voice_messages_enabled: true,
  photo_album_enabled: true,
  painting_enabled: true,
  singalong_enabled: true,
  sensory_mode_enabled: false,
  medication_reminders_enabled: true,
  push_notifications_enabled: false,
  companion_pet_enabled: true,
};

interface SettingsState {
  stage: DiseaseStage;
  toggles: FeatureToggles;
  caregiverPin: string | null;
  isLoading: boolean;

  // Actions
  loadSettings: (patientId: string) => Promise<void>;
  updateStage: (patientId: string, stage: DiseaseStage) => Promise<void>;
  toggleFeature: (patientId: string, feature: keyof FeatureToggles, value: boolean) => Promise<void>;
  setPin: (patientId: string, pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  stage: 'middle',
  toggles: DEFAULT_TOGGLES,
  caregiverPin: null,
  isLoading: false,

  loadSettings: async (patientId) => {
    set({ isLoading: true });
    try {
      // Load profile for stage
      const { data: profile } = await supabase
        .from('profiles')
        .select('stage, faith_enabled')
        .eq('id', patientId)
        .single();

      // Load feature toggles
      const { data: toggleRows } = await supabase
        .from('feature_toggles')
        .select('feature_key, is_enabled')
        .eq('patient_id', patientId);

      const toggles = { ...DEFAULT_TOGGLES };
      if (profile?.faith_enabled !== undefined) {
        toggles.faith_enabled = profile.faith_enabled;
      }
      (toggleRows ?? []).forEach((row: any) => {
        if (row.feature_key in toggles) {
          (toggles as any)[row.feature_key] = row.is_enabled;
        }
      });

      // Load PIN
      const { data: pinRow } = await supabase
        .from('caregiver_pins')
        .select('pin_hash')
        .eq('patient_id', patientId)
        .single();

      set({
        stage: (profile?.stage as DiseaseStage) ?? 'middle',
        toggles,
        caregiverPin: pinRow?.pin_hash ?? null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  updateStage: async (patientId, stage) => {
    set({ stage });
    await supabase
      .from('profiles')
      .update({ stage })
      .eq('id', patientId);
  },

  toggleFeature: async (patientId, feature, value) => {
    set((state) => ({
      toggles: { ...state.toggles, [feature]: value },
    }));

    await supabase
      .from('feature_toggles')
      .upsert({
        patient_id: patientId,
        feature_key: feature,
        is_enabled: value,
      }, { onConflict: 'patient_id,feature_key' });
  },

  setPin: async (patientId, pin) => {
    // Store PIN as plain string in this version.
    // Production should hash with bcrypt before storing.
    set({ caregiverPin: pin });
    await supabase
      .from('caregiver_pins')
      .upsert({ patient_id: patientId, pin_hash: pin }, { onConflict: 'patient_id' });
  },

  verifyPin: (pin) => {
    return get().caregiverPin === pin;
  },
}));
