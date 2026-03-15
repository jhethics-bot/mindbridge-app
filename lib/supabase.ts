/**
 * MindBridge Supabase Client
 * 
 * SETUP: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
 * These should be moved to environment variables before production.
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://gzopkdbuznupcvtsmisb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6b3BrZGJ1em51cGN2dHNtaXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjgzMzYsImV4cCI6MjA4OTEwNDMzNn0.gZZ1RncezBZgGd49ANPinZqEImaplqk-yEEZcg_oMSA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// Helper functions
// ============================================

/**
 * Get current authenticated user profile
 */
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return data;
}

/**
 * Get patients linked to a caregiver
 */
export async function getCaregiverPatients(caregiverId: string) {
  const { data } = await supabase
    .from('care_relationships')
    .select(`
      *,
      patient:profiles!care_relationships_patient_id_fkey(*)
    `)
    .eq('caregiver_id', caregiverId);
  
  return data;
}

/**
 * Log a mood check-in
 */
export async function logMoodCheckin(patientId: string, mood: string) {
  const { data, error } = await supabase
    .from('mood_checkins')
    .insert({ patient_id: patientId, mood })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Log an activity session
 */
export async function logActivitySession(session: {
  patient_id: string;
  activity: string;
  stage_at_time: string;
  difficulty_params: Record<string, unknown>;
  score: Record<string, unknown>;
  duration_seconds: number;
  completed: boolean;
  mood_at_start?: string;
}) {
  const { data, error } = await supabase
    .from('activity_sessions')
    .insert({
      ...session,
      completed_at: session.completed ? new Date().toISOString() : null,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get recent activity performance for AI engine
 */
export async function getRecentPerformance(patientId: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const { data } = await supabase
    .from('activity_sessions')
    .select('*')
    .eq('patient_id', patientId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });
  
  return data || [];
}

/**
 * Get family photos for face-name game
 */
export async function getFamilyPhotos(patientId: string) {
  const { data } = await supabase
    .from('family_media')
    .select('*')
    .eq('patient_id', patientId)
    .eq('media_type', 'photo')
    .not('person_name', 'is', null)
    .order('sort_order');
  
  return data || [];
}

/**
 * Log SOS event
 */
export async function logSOSEvent(event: {
  patient_id: string;
  sos_type: 'emergency' | 'confused';
  latitude?: number;
  longitude?: number;
}) {
  const { data, error } = await supabase
    .from('sos_events')
    .insert(event)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
