/**
 * offlineStore - NeuBridge Offline Sync State (Zustand)
 *
 * Queues activity sessions and mood check-ins when the device
 * is offline, then syncs them to Supabase when connectivity returns.
 * Uses AsyncStorage as the persistence layer.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'neubridge_offline_queue';

interface OfflineEvent {
  id: string;
  type: 'activity_session' | 'mood_checkin';
  payload: Record<string, unknown>;
  created_at: string;
}

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;

  // Actions
  setOnline: (online: boolean) => void;
  queueEvent: (type: OfflineEvent['type'], payload: Record<string, unknown>) => Promise<void>;
  syncPending: () => Promise<void>;
  getPendingCount: () => Promise<number>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,

  setOnline: (online) => {
    set({ isOnline: online });
    if (online) {
      get().syncPending();
    }
  },

  queueEvent: async (type, payload) => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OfflineEvent[] = raw ? JSON.parse(raw) : [];
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload,
      created_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    set({ pendingCount: queue.length });
  },

  syncPending: async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return;

    const queue: OfflineEvent[] = JSON.parse(raw);
    if (queue.length === 0) return;

    set({ isSyncing: true });

    const remaining: OfflineEvent[] = [];

    for (const event of queue) {
      try {
        if (event.type === 'activity_session') {
          await supabase.from('activity_sessions').insert(event.payload);
        } else if (event.type === 'mood_checkin') {
          await supabase.from('mood_checkins').insert(event.payload);
        }
      } catch {
        remaining.push(event); // Keep failed events for retry
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    set({ pendingCount: remaining.length, isSyncing: false });
  },

  getPendingCount: async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OfflineEvent[] = raw ? JSON.parse(raw) : [];
    set({ pendingCount: queue.length });
    return queue.length;
  },
}));
