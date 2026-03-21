/**
 * Feature Toggle AI Recommendations
 *
 * Analyzes patient engagement data and disease stage to recommend
 * which features to enable/disable. Saves recommendations to
 * ai_recommendations table for caregiver review. Runs as a local
 * heuristic engine (no API call needed for basic recommendations).
 */
import { supabase } from './supabase';

interface EngagementData {
  activity: string;
  sessions_7d: number;
  avg_duration: number;
  completion_rate: number;
}

interface FeatureRec {
  toggle_column: string;
  feature_name: string;
  recommended: boolean;
  reason: string;
  priority: number;
}

// Maps activity types to their feature toggle column names
const ACTIVITY_TOGGLE_MAP: Record<string, string> = {
  face_name: 'face_name_enabled',
  word_find: 'word_find_enabled',
  memory_cards: 'memory_cards_enabled',
  sorting: 'sorting_enabled',
  color_number: 'color_number_enabled',
  spelling: 'spelling_enabled',
  guided_workout: 'guided_workout_enabled',
  chair_yoga: 'chair_yoga_enabled',
  breathing: 'breathing_enabled',
  music_listen: 'music_enabled',
  singalong: 'singalong_enabled',
  photo_album: 'photo_album_enabled',
  voice_message_listen: 'voice_messages_enabled',
  scripture_read: 'scripture_enabled',
  sensory_calm: 'sensory_calm_enabled',
  gentle_touch: 'gentle_touch_enabled',
};

// Stage-appropriate feature defaults
const STAGE_DEFAULTS: Record<string, string[]> = {
  early: [
    'face_name_enabled', 'word_find_enabled', 'memory_cards_enabled',
    'sorting_enabled', 'color_number_enabled', 'spelling_enabled',
    'trivia_enabled', 'guided_workout_enabled', 'breathing_enabled',
    'music_enabled', 'photo_album_enabled', 'scripture_enabled',
    'journaling_enabled', 'driving_game_enabled', 'news_reader_enabled',
  ],
  middle: [
    'memory_cards_enabled', 'sorting_enabled', 'color_number_enabled',
    'breathing_enabled', 'chair_yoga_enabled', 'music_enabled',
    'singalong_enabled', 'photo_album_enabled', 'voice_messages_enabled',
    'scripture_enabled', 'sensory_calm_enabled', 'gentle_touch_enabled',
  ],
  late: [
    'music_enabled', 'singalong_enabled', 'photo_album_enabled',
    'voice_messages_enabled', 'sensory_calm_enabled', 'gentle_touch_enabled',
    'breathing_enabled', 'scripture_enabled',
  ],
};

/**
 * Generate feature recommendations for a patient based on their
 * engagement data and disease stage.
 */
export async function generateFeatureRecommendations(
  patientId: string,
  stage: string
): Promise<FeatureRec[]> {
  // Get 7-day engagement data
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: sessions } = await supabase
    .from('activity_sessions')
    .select('activity, duration_seconds, completed')
    .eq('patient_id', patientId)
    .gte('created_at', weekAgo);

  // Aggregate by activity
  const engagement: Record<string, EngagementData> = {};
  for (const s of sessions || []) {
    if (!engagement[s.activity]) {
      engagement[s.activity] = { activity: s.activity, sessions_7d: 0, avg_duration: 0, completion_rate: 0 };
    }
    const e = engagement[s.activity];
    e.sessions_7d++;
    e.avg_duration = ((e.avg_duration * (e.sessions_7d - 1)) + (s.duration_seconds || 0)) / e.sessions_7d;
    if (s.completed) e.completion_rate = (e.completion_rate * (e.sessions_7d - 1) + 1) / e.sessions_7d;
  }

  const recs: FeatureRec[] = [];
  const stageDefaults = STAGE_DEFAULTS[stage] || STAGE_DEFAULTS.middle;

  // Recommend enabling stage-appropriate features
  for (const toggle of stageDefaults) {
    const activity = Object.entries(ACTIVITY_TOGGLE_MAP).find(([, col]) => col === toggle)?.[0];
    const featureName = toggle.replace('_enabled', '').replace(/_/g, ' ');

    if (activity && engagement[activity]) {
      const e = engagement[activity];
      if (e.completion_rate < 0.2 && e.sessions_7d >= 3) {
        recs.push({
          toggle_column: toggle,
          feature_name: featureName,
          recommended: false,
          reason: `Low completion rate (${Math.round(e.completion_rate * 100)}%) over ${e.sessions_7d} sessions. May be too challenging at current stage.`,
          priority: 2,
        });
      } else if (e.sessions_7d >= 5 && e.completion_rate > 0.8) {
        recs.push({
          toggle_column: toggle,
          feature_name: featureName,
          recommended: true,
          reason: `High engagement (${e.sessions_7d} sessions, ${Math.round(e.completion_rate * 100)}% completion). Keep enabled.`,
          priority: 1,
        });
      }
    }
  }

  // Recommend disabling features not appropriate for stage
  const allToggles = Object.values(ACTIVITY_TOGGLE_MAP);
  for (const toggle of allToggles) {
    if (!stageDefaults.includes(toggle)) {
      const featureName = toggle.replace('_enabled', '').replace(/_/g, ' ');
      recs.push({
        toggle_column: toggle,
        feature_name: featureName,
        recommended: false,
        reason: `Not typically recommended for ${stage}-stage patients. Disable to simplify the experience.`,
        priority: 3,
      });
    }
  }

  // Recommend enabling unused but stage-appropriate features
  for (const toggle of stageDefaults) {
    const activity = Object.entries(ACTIVITY_TOGGLE_MAP).find(([, col]) => col === toggle)?.[0];
    if (activity && !engagement[activity]) {
      const featureName = toggle.replace('_enabled', '').replace(/_/g, ' ');
      recs.push({
        toggle_column: toggle,
        feature_name: featureName,
        recommended: true,
        reason: `Stage-appropriate but not yet tried. Consider enabling for variety.`,
        priority: 4,
      });
    }
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

/**
 * Save recommendations to Supabase for caregiver review.
 */
export async function saveRecommendations(
  patientId: string,
  recs: FeatureRec[]
): Promise<void> {
  const rows = recs.map((r) => ({
    patient_id: patientId,
    recommendation_type: 'feature_toggle',
    item_title: r.feature_name,
    reason: r.reason,
    priority: r.priority,
    status: 'pending',
  }));

  await supabase.from('ai_recommendations').insert(rows);
}

/**
 * Apply a set of recommendations by updating feature_toggles.
 */
export async function applyRecommendations(
  patientId: string,
  recs: FeatureRec[]
): Promise<void> {
  const updates: Record<string, boolean> = {};
  for (const r of recs) {
    updates[r.toggle_column] = r.recommended;
  }
  updates['updated_at'] = true; // Trigger timestamp — will be overridden by DB default

  await supabase
    .from('feature_toggles')
    .update(updates)
    .eq('patient_id', patientId);
}
