/**
 * NeuBridge Offline Sync Engine
 *
 * Caches daily queue, mood checkins, and activity sessions locally
 * using AsyncStorage. When offline, queues writes. When back online,
 * flushes the queue to Supabase. Core activities work without network.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from './supabase';

const KEYS = {
  QUEUE: 'mb_daily_queue',
  QUEUE_DATE: 'mb_queue_date',
  PROFILE: 'mb_cached_profile',
  PENDING_WRITES: 'mb_pending_writes',
  LAST_MOOD: 'mb_last_mood',
  VERSE: 'mb_daily_verse',
} as const;

interface PendingWrite {
  id: string;
  table: string;
  data: Record<string, unknown>;
  created_at: string;
}

// ── Connection State ──

let _isOnline = true;
let _listeners: ((online: boolean) => void)[] = [];

export function isOnline(): boolean {
  return _isOnline;
}

export function onConnectivityChange(cb: (online: boolean) => void): () => void {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter((l) => l !== cb); };
}

/**
 * Initialize connectivity monitoring. Call once at app start.
 */
export function initOfflineSync(): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOffline = !_isOnline;
    _isOnline = state.isConnected === true && state.isInternetReachable !== false;
    _listeners.forEach((cb) => cb(_isOnline));

    // If we just came back online, flush pending writes
    if (wasOffline && _isOnline) {
      flushPendingWrites();
    }
  });
  return unsubscribe;
}

// ── Cache Operations ──

/**
 * Cache the user profile for offline access.
 */
export async function cacheProfile(profile: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

/**
 * Get cached profile when offline.
 */
export async function getCachedProfile(): Promise<Record<string, unknown> | null> {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Cache the daily activity queue.
 */
export async function cacheDailyQueue(queue: unknown[], date: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(queue));
  await AsyncStorage.setItem(KEYS.QUEUE_DATE, date);
}

/**
 * Get cached daily queue if it matches today's date.
 */
export async function getCachedDailyQueue(): Promise<unknown[] | null> {
  const today = new Date().toISOString().split('T')[0];
  const cachedDate = await AsyncStorage.getItem(KEYS.QUEUE_DATE);
  if (cachedDate !== today) return null;
  const raw = await AsyncStorage.getItem(KEYS.QUEUE);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Cache the last mood check-in.
 */
export async function cacheLastMood(mood: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_MOOD, JSON.stringify({ mood, date: new Date().toISOString().split('T')[0] }));
}

/**
 * Get cached mood if it's from today.
 */
export async function getCachedMood(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(KEYS.LAST_MOOD);
  if (!raw) return null;
  const { mood, date } = JSON.parse(raw);
  const today = new Date().toISOString().split('T')[0];
  return date === today ? mood : null;
}

/**
 * Cache today's daily verse.
 */
export async function cacheDailyVerse(verse: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(KEYS.VERSE, JSON.stringify({ ...verse, cached_date: new Date().toISOString().split('T')[0] }));
}

/**
 * Get cached verse if from today.
 */
export async function getCachedVerse(): Promise<Record<string, unknown> | null> {
  const raw = await AsyncStorage.getItem(KEYS.VERSE);
  if (!raw) return null;
  const verse = JSON.parse(raw);
  const today = new Date().toISOString().split('T')[0];
  return verse.cached_date === today ? verse : null;
}

// ── Offline Write Queue ──

/**
 * Queue a write operation for when connectivity returns.
 * If online, writes directly to Supabase instead.
 */
export async function queueWrite(table: string, data: Record<string, unknown>): Promise<void> {
  if (_isOnline) {
    // Try direct write
    const { error } = await supabase.from(table).insert(data);
    if (!error) return;
    // If direct write fails, queue it
  }

  const pending = await getPendingWrites();
  pending.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    table,
    data,
    created_at: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEYS.PENDING_WRITES, JSON.stringify(pending));
}

/**
 * Get all pending writes.
 */
async function getPendingWrites(): Promise<PendingWrite[]> {
  const raw = await AsyncStorage.getItem(KEYS.PENDING_WRITES);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Get count of pending writes (for UI badge).
 */
export async function getPendingWriteCount(): Promise<number> {
  const pending = await getPendingWrites();
  return pending.length;
}

/**
 * Flush all pending writes to Supabase.
 * Called automatically when connectivity returns.
 */
export async function flushPendingWrites(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingWrites();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  const remaining: PendingWrite[] = [];

  for (const write of pending) {
    try {
      const { error } = await supabase.from(write.table).insert(write.data);
      if (error) {
        remaining.push(write);
      } else {
        synced++;
      }
    } catch {
      remaining.push(write);
    }
  }

  await AsyncStorage.setItem(KEYS.PENDING_WRITES, JSON.stringify(remaining));
  return { synced, failed: remaining.length };
}

/**
 * Clear all cached data (for sign-out).
 */
export async function clearOfflineCache(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
