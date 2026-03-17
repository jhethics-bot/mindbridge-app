/**
 * NeuBridge AI Adaptive Difficulty Engine
 * 
 * Powered by Claude API (Sonnet 4). Calibrates daily activity difficulty
 * based on mood, performance data, and disease stage.
 * 
 * Three touchpoints:
 * 1. Morning Calibration (after mood check-in)
 * 2. Mid-Session Adjustment (if performance drops sharply)
 * 3. Weekly Report Generation (Sunday evening)
 */
import { supabase, getRecentPerformance } from './supabase';
import type {
  DiseaseStage,
  MoodType,
  DailyQueue,
  AICalibrationInput,
  ActivityType,
} from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
// Store API key in secure environment variable, never in code
// For Expo: use expo-secure-store or environment config
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';

const SYSTEM_PROMPT = `You are the NeuBridge Adaptive Difficulty Engine. Your role is to calibrate cognitive activities for a person living with Alzheimer's disease. You receive their current disease stage, today's mood, and 7 days of performance data.

CRITICAL RULES:
- NEVER increase difficulty by more than 10% per day
- If mood is "confused" or "tired", reduce difficulty by 20% and add more calming/sensory activities
- If mood is "sad", prioritize music, photo album, and faith content (if enabled)
- Always include at least one physical activity
- Always end the queue with a calming activity (breathing, music, or scripture)
- Total queue should target 30-45 minutes for early/middle, 15-20 for late
- For "late" stage patients, queue is primarily sensory + music + voice messages

STAGE CONSTRAINTS:
- Early: All activities available. 4 answer options in cognitive games.
- Middle: No spelling, no trivia. 2-3 answer options. Simplified interfaces.
- Late: Sensory, music, voice messages, photo slideshow, gentle touch only.

Respond ONLY with valid JSON matching this schema:
{
  "daily_queue": [
    {
      "activity": "activity_type_string",
      "difficulty": { activity-specific parameters },
      "order": number,
      "estimated_minutes": number
    }
  ],
  "reasoning": "Plain language explanation for caregiver"
}`;

/**
 * Generate the daily activity queue after mood check-in
 */
export async function generateDailyQueue(
  patientId: string,
  stage: DiseaseStage,
  mood: MoodType,
  faithEnabled: boolean = false
): Promise<DailyQueue> {
  // Get recent performance data
  const recentSessions = await getRecentPerformance(patientId, 7);
  
  // Aggregate performance by activity type
  const performance: Record<string, { accuracy: number; avg_time_ms: number; sessions_7d: number }> = {};
  
  const activityGroups: Record<string, typeof recentSessions> = {};
  for (const session of recentSessions) {
    if (!activityGroups[session.activity]) {
      activityGroups[session.activity] = [];
    }
    activityGroups[session.activity].push(session);
  }
  
  for (const [activity, sessions] of Object.entries(activityGroups)) {
    const completedSessions = sessions.filter(s => s.completed);
    const avgAccuracy = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + ((s.score as any)?.accuracy || 0), 0) / completedSessions.length
      : 0;
    const avgTime = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.duration_seconds * 1000), 0) / completedSessions.length
      : 0;
    
    performance[activity] = {
      accuracy: avgAccuracy,
      avg_time_ms: avgTime,
      sessions_7d: sessions.length,
    };
  }

  const input: AICalibrationInput = {
    patient_id: patientId,
    stage,
    mood,
    recent_performance: performance,
    request: 'generate_daily_queue',
  };

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT + (faithEnabled ? '\n\nNote: This patient has scripture/faith content ENABLED. Include daily scripture or devotional when mood is sad, confused, or tired.' : '\n\nNote: Scripture/faith content is DISABLED for this patient.'),
        messages: [
          {
            role: 'user',
            content: JSON.stringify(input),
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    
    // Parse JSON from response (strip any markdown fences)
    const clean = text.replace(/```json|```/g, '').trim();
    const queue: DailyQueue = JSON.parse(clean);

    // Log the adjustment to Supabase
    await supabase.from('ai_adjustments').insert({
      patient_id: patientId,
      adjustment_date: new Date().toISOString().split('T')[0],
      mood_input: mood,
      performance_input: performance,
      daily_queue: queue,
      reasoning: queue.reasoning,
    });

    return queue;
  } catch (error) {
    console.error('AI Engine error:', error);
    // Fallback: return a safe default queue
    return getDefaultQueue(stage, mood, faithEnabled);
  }
}

/**
 * Fallback queue if AI call fails
 */
function getDefaultQueue(
  stage: DiseaseStage,
  mood: MoodType,
  faithEnabled: boolean
): DailyQueue {
  const isCalm = mood === 'confused' || mood === 'tired' || mood === 'sad';
  
  if (stage === 'late') {
    return {
      daily_queue: [
        { activity: 'music_listen', difficulty: {}, order: 1, estimated_minutes: 15 },
        { activity: 'sensory_calm', difficulty: {}, order: 2, estimated_minutes: 10 },
        { activity: 'voice_message_listen', difficulty: {}, order: 3, estimated_minutes: 5 },
      ],
      reasoning: 'Default late-stage comfort queue: music, calming visuals, and family voice messages.',
    };
  }

  const queue: DailyQueue['daily_queue'] = [];
  let order = 1;

  // Start with something gentle if having a hard day
  if (isCalm) {
    queue.push({ activity: 'breathing', difficulty: { duration_minutes: 5, pattern: '4-4-6' }, order: order++, estimated_minutes: 5 });
  }

  // Core cognitive activity
  queue.push({
    activity: 'face_name',
    difficulty: { num_faces: isCalm ? 3 : 4, cue_visibility: isCalm ? 0.8 : 0.5 },
    order: order++,
    estimated_minutes: 10,
  });

  // Physical activity
  queue.push({
    activity: stage === 'middle' ? 'chair_yoga' : 'guided_workout',
    difficulty: { duration_minutes: 15 },
    order: order++,
    estimated_minutes: 15,
  });

  // Second cognitive activity
  if (stage === 'early') {
    queue.push({
      activity: isCalm ? 'color_number' : 'word_find',
      difficulty: { grid_size: isCalm ? 6 : 10 },
      order: order++,
      estimated_minutes: 10,
    });
  }

  // Faith content if enabled and appropriate
  if (faithEnabled && (mood === 'sad' || mood === 'confused')) {
    queue.push({
      activity: 'scripture_animated',
      difficulty: {},
      order: order++,
      estimated_minutes: 3,
    });
  }

  // Always end with calming activity
  queue.push({
    activity: 'music_listen',
    difficulty: { playlist_type: 'calming' },
    order: order++,
    estimated_minutes: 10,
  });

  return {
    daily_queue: queue,
    reasoning: `Default ${stage}-stage queue adjusted for ${mood} mood. ${isCalm ? 'Reduced difficulty and added calming content.' : 'Standard difficulty.'}`,
  };
}

/**
 * Mid-session difficulty adjustment
 * Called when 3+ consecutive incorrect responses detected
 */
export async function adjustMidSession(
  patientId: string,
  activity: ActivityType,
  currentDifficulty: Record<string, unknown>,
  recentAccuracy: number
): Promise<Record<string, unknown>> {
  // Simple rule-based fallback (avoid API call for speed)
  const adjusted = { ...currentDifficulty };
  
  if (recentAccuracy < 0.3) {
    // Struggling significantly: reduce everything by 30%
    for (const key of Object.keys(adjusted)) {
      if (typeof adjusted[key] === 'number') {
        adjusted[key] = Math.max(1, Math.round((adjusted[key] as number) * 0.7));
      }
    }
    // Increase cue visibility if present
    if ('cue_visibility' in adjusted) {
      adjusted.cue_visibility = Math.min(1, (adjusted.cue_visibility as number) + 0.3);
    }
  } else if (recentAccuracy < 0.5) {
    // Somewhat struggling: reduce by 15%
    for (const key of Object.keys(adjusted)) {
      if (typeof adjusted[key] === 'number') {
        adjusted[key] = Math.max(1, Math.round((adjusted[key] as number) * 0.85));
      }
    }
  }

  return adjusted;
}
