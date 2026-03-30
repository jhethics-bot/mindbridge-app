/**
 * medicationAlertStore - NeuBridge Medication Alert State (Zustand)
 *
 * Tracks medication schedules, today's confirmations, and pending counts
 * for the medication forcing function.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

export interface MedicationSchedule {
  id: string;
  patient_id: string;
  caregiver_id: string;
  medication_name: string;
  dosage: string | null;
  schedule_times: string[];
  days_of_week: string[];
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationConfirmation {
  id: string;
  schedule_id: string;
  patient_id: string;
  scheduled_time: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  status: 'pending' | 'confirmed' | 'missed' | 'skipped';
  notes: string | null;
  created_at: string;
  // Joined fields
  medication_name?: string;
  dosage?: string | null;
}

// ============================================
// STORE INTERFACE
// ============================================

interface MedicationAlertState {
  medications: MedicationSchedule[];
  todaysConfirmations: MedicationConfirmation[];
  pendingCount: number;
  isLoading: boolean;
  error: string | null;

  fetchMedications: (patientId: string) => Promise<void>;
  fetchTodaysConfirmations: (patientId: string) => Promise<void>;
  confirmMedication: (confirmationId: string) => Promise<void>;
  skipMedication: (confirmationId: string, reason: string) => Promise<void>;
  addMedication: (schedule: Partial<MedicationSchedule>) => Promise<void>;
  updateMedication: (id: string, updates: Partial<MedicationSchedule>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
}

// ============================================
// STORE
// ============================================

export const useMedicationAlertStore = create<MedicationAlertState>((set, get) => ({
  medications: [],
  todaysConfirmations: [],
  pendingCount: 0,
  isLoading: false,
  error: null,

  fetchMedications: async (patientId) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('medication_schedules')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .order('medication_name');

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      set({ medications: data ?? [], isLoading: false });
    }
  },

  fetchTodaysConfirmations: async (patientId) => {
    set({ isLoading: true, error: null });
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('medication_confirmations')
      .select('*, medication_schedules(medication_name, dosage)')
      .eq('patient_id', patientId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('scheduled_time');

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      const confirmations: MedicationConfirmation[] = (data ?? []).map((c: any) => ({
        ...c,
        medication_name: c.medication_schedules?.medication_name,
        dosage: c.medication_schedules?.dosage,
      }));
      const pending = confirmations.filter(c => c.status === 'pending').length;
      set({ todaysConfirmations: confirmations, pendingCount: pending, isLoading: false });
    }
  },

  confirmMedication: async (confirmationId) => {
    set({ isLoading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('medication_confirmations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.id,
      })
      .eq('id', confirmationId);

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      set(state => {
        const updated = state.todaysConfirmations.map(c =>
          c.id === confirmationId
            ? { ...c, status: 'confirmed' as const, confirmed_at: new Date().toISOString(), confirmed_by: user?.id ?? null }
            : c
        );
        return {
          todaysConfirmations: updated,
          pendingCount: updated.filter(c => c.status === 'pending').length,
          isLoading: false,
        };
      });
    }
  },

  skipMedication: async (confirmationId, reason) => {
    set({ isLoading: true, error: null });

    const { error } = await supabase
      .from('medication_confirmations')
      .update({
        status: 'skipped',
        notes: reason,
      })
      .eq('id', confirmationId);

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      set(state => {
        const updated = state.todaysConfirmations.map(c =>
          c.id === confirmationId
            ? { ...c, status: 'skipped' as const, notes: reason }
            : c
        );
        return {
          todaysConfirmations: updated,
          pendingCount: updated.filter(c => c.status === 'pending').length,
          isLoading: false,
        };
      });
    }
  },

  addMedication: async (schedule) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('medication_schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) {
      set({ isLoading: false, error: error.message });
    } else if (data) {
      set(state => ({ medications: [...state.medications, data], isLoading: false }));
    }
  },

  updateMedication: async (id, updates) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('medication_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      set({ isLoading: false, error: error.message });
    } else if (data) {
      set(state => ({
        medications: state.medications.map(m => m.id === id ? data : m),
        isLoading: false,
      }));
    }
  },

  deleteMedication: async (id) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase
      .from('medication_schedules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      set(state => ({
        medications: state.medications.filter(m => m.id !== id),
        isLoading: false,
      }));
    }
  },
}));
