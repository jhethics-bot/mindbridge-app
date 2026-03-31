/**
 * careAlertStore - Care Alert State (Zustand)
 *
 * Tracks hydration, medication, inactivity, and mood alerts
 * sent to caregivers for their linked patients.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

export type AlertType = 'hydration_critical' | 'hydration_low' | 'medication_missed' | 'inactivity' | 'mood_decline';

export interface CareAlert {
  id: string;
  patient_id: string;
  caregiver_id: string;
  alert_type: AlertType;
  title: string;
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// ============================================
// STORE INTERFACE
// ============================================

interface CareAlertState {
  alerts: CareAlert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchAlerts: (caregiverId: string) => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  dismissAll: () => Promise<void>;
}

// ============================================
// STORE
// ============================================

export const useCareAlertStore = create<CareAlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchAlerts: async (caregiverId) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('care_alerts')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      const alerts: CareAlert[] = data ?? [];
      set({
        alerts,
        unreadCount: alerts.filter(a => !a.is_read).length,
        isLoading: false,
      });
    }
  },

  markAsRead: async (alertId) => {
    const { error } = await supabase
      .from('care_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (!error) {
      set(state => {
        const updated = state.alerts.map(a =>
          a.id === alertId ? { ...a, is_read: true } : a
        );
        return { alerts: updated, unreadCount: updated.filter(a => !a.is_read).length };
      });
    }
  },

  dismissAlert: async (alertId) => {
    const { error } = await supabase
      .from('care_alerts')
      .update({ is_dismissed: true, is_read: true })
      .eq('id', alertId);

    if (!error) {
      set(state => {
        const updated = state.alerts.filter(a => a.id !== alertId);
        return { alerts: updated, unreadCount: updated.filter(a => !a.is_read).length };
      });
    }
  },

  dismissAll: async () => {
    const { alerts } = get();
    const ids = alerts.map(a => a.id);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('care_alerts')
      .update({ is_dismissed: true, is_read: true })
      .in('id', ids);

    if (!error) {
      set({ alerts: [], unreadCount: 0 });
    }
  },
}));
