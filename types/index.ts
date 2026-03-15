/**
 * MindBridge Global Types
 */

// ============================================
// USER & AUTH
// ============================================

export type UserRole = 'patient' | 'caregiver' | 'facility_staff';
export type DiseaseStage = 'early' | 'middle' | 'late';
export type MoodType = 'happy' | 'okay' | 'sad' | 'confused' | 'tired';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  avatar_url?: string;
  stage: DiseaseStage;
  date_of_birth?: string;
  preferred_era?: string;
  faith_enabled: boolean;
  faith_tradition?: string;
  timezone: string;
  onboarding_complete: boolean;
  created_at: string;
}

export interface CareRelationship {
  id: string;
  caregiver_id: string;
  patient_id: string;
  relationship_type?: string;
  permissions: {
    can_edit_settings: boolean;
    can_view_reports: boolean;
    can_upload_media: boolean;
  };
  is_primary: boolean;
}

// ============================================
// ACTIVITIES
// ============================================

export type ActivityType =
  | 'face_name' | 'word_find' | 'spelling' | 'color_number'
  | 'memory_cards' | 'sorting' | 'trivia'
  | 'guided_workout' | 'chair_yoga' | 'breathing' | 'meditation'
  | 'music_listen' | 'singalong'
  | 'scripture_read' | 'scripture_animated' | 'devotional'
  | 'photo_album' | 'voice_message_listen'
  | 'sensory_calm' | 'gentle_touch';

export interface ActivitySession {
  id: string;
  patient_id: string;
  activity: ActivityType;
  stage_at_time: DiseaseStage;
  difficulty_params: Record<string, unknown>;
  score: Record<string, unknown>;
  duration_seconds: number;
  completed: boolean;
  mood_at_start?: MoodType;
  created_at: string;
  completed_at?: string;
}

export interface DailyQueueItem {
  activity: ActivityType;
  difficulty: Record<string, unknown>;
  order: number;
  estimated_minutes: number;
}

export interface DailyQueue {
  daily_queue: DailyQueueItem[];
  reasoning: string;
}

// ============================================
// AI ENGINE
// ============================================

export interface AICalibrationInput {
  patient_id: string;
  stage: DiseaseStage;
  mood: MoodType;
  recent_performance: Record<string, {
    accuracy: number;
    avg_time_ms: number;
    sessions_7d: number;
  }>;
  request: 'generate_daily_queue' | 'mid_session_adjust' | 'weekly_report';
}

export interface AIAdjustment {
  id: string;
  patient_id: string;
  adjustment_date: string;
  mood_input: MoodType;
  performance_input: Record<string, unknown>;
  daily_queue: DailyQueue;
  reasoning: string;
}

// ============================================
// MEDIA
// ============================================

export type MediaType = 'photo' | 'voice_message' | 'music' | 'video';

export interface FamilyMedia {
  id: string;
  patient_id: string;
  uploaded_by: string;
  media_type: MediaType;
  storage_path: string;
  display_name?: string;
  description?: string;
  tags: string[];
  person_name?: string;
  era?: string;
  duration_seconds?: number;
}

export interface Playlist {
  id: string;
  patient_id: string;
  name: string;
  playlist_type: 'custom' | 'hymns' | 'era' | 'calming';
  songs: Array<{
    title: string;
    artist?: string;
    source: 'upload' | 'spotify' | 'apple_music';
    uri: string;
    duration?: number;
  }>;
}

// ============================================
// SCRIPTURE
// ============================================

export interface ScripturePreferences {
  patient_id: string;
  enabled: boolean;
  translation: 'KJV' | 'WEB' | 'ASV';
  preferred_themes: string[];
  custom_verses: Array<{ reference: string; text: string }>;
}

export interface DailyVerse {
  id: string;
  patient_id: string;
  verse_date: string;
  reference: string;
  text: string;
  translation: string;
  theme?: string;
  mood_context?: MoodType;
  was_viewed: boolean;
}

// ============================================
// SOS
// ============================================

export type SOSType = 'emergency' | 'confused';

export interface SOSEvent {
  id: string;
  patient_id: string;
  sos_type: SOSType;
  latitude?: number;
  longitude?: number;
  address_text?: string;
  contacts_notified: string[];
  resolved: boolean;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  phone: string;
  relationship?: string;
  is_primary: boolean;
  notify_on_confused: boolean;
  notify_on_emergency: boolean;
}

// ============================================
// MOOD
// ============================================

export interface MoodCheckin {
  id: string;
  patient_id: string;
  mood: MoodType;
  notes?: string;
  created_at: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ActivityProps {
  stage: DiseaseStage;
  difficulty: Record<string, unknown>;
  onComplete: (result: ActivityResult) => void;
  onExit: () => void;
}

export interface ActivityResult {
  activity: ActivityType;
  score: Record<string, unknown>;
  duration_seconds: number;
  completed: boolean;
}

// ============================================
// WEEKLY REPORT
// ============================================

export interface WeeklyReport {
  id: string;
  patient_id: string;
  week_start: string;
  week_end: string;
  report_data: {
    mood_distribution: Record<MoodType, number>;
    activity_summary: Record<ActivityType, { sessions: number; total_minutes: number }>;
    cognitive_metrics: Record<string, { current: number; previous: number; trend: 'up' | 'stable' | 'down' }>;
    sos_events: number;
  };
  ai_narrative: string;
  pdf_storage_path?: string;
}
