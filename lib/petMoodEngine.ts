// lib/petMoodEngine.ts
// Companion Pet Mood Engine — deterministic, client-side, no API calls
// Same philosophy as the AI daily queue rebuild

export type PetMoodState = 'happy' | 'calm' | 'sleepy' | 'cozy' | 'curious';
export type PetType = 'dog' | 'cat' | 'bird' | 'bunny';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface PetMoodContext {
  timeOfDay: TimeOfDay;
  activitiesCompletedToday: number;
  lastInteractionMinutesAgo: number;
  patientMoodScore: number | null; // 1-5 scale, null if no check-in today
}

export interface PetMoodResult {
  state: PetMoodState;
  animationKey: string;   // maps to Reanimated animation preset
  soundKey: string;       // maps to audio file key
  moodEmoji: string;      // for caregiver dashboard display
}

/**
 * Compute the pet's current mood state based on context.
 * Priority order: time of day → recent interaction → activities → patient mood → default
 *
 * CRITICAL RULE: No state should ever feel punishing or negative.
 * The pet is NEVER distressed due to patient inaction.
 */
export function computePetMood(context: PetMoodContext): PetMoodResult {
  const {
    timeOfDay,
    activitiesCompletedToday,
    lastInteractionMinutesAgo,
    patientMoodScore,
  } = context;

  let state: PetMoodState;

  // Evening always overrides everything — natural sleep rhythm
  if (timeOfDay === 'evening') {
    state = 'sleepy';
  }
  // Just interacted in the last 5 minutes — still in post-interaction warmth
  else if (lastInteractionMinutesAgo < 5) {
    state = 'cozy';
  }
  // Had a productive day — pet is energized and happy
  else if (activitiesCompletedToday >= 2) {
    state = 'happy';
  }
  // Patient reported low mood — pet shifts to calm/comfort presence
  else if (patientMoodScore !== null && patientMoodScore <= 2) {
    state = 'calm';
  }
  // First visit of the day (no interaction in 24+ hours) — curious and alert
  else if (lastInteractionMinutesAgo > 1440) {
    state = 'curious';
  }
  // Default: calm and present
  else {
    state = 'calm';
  }

  return {
    state,
    animationKey: getMoodAnimation(state),
    soundKey: getMoodSound(state),
    moodEmoji: getMoodEmoji(state),
  };
}

/**
 * Get the Reanimated 3 animation preset key for a given mood state.
 * These keys map to animation configs in components/CompanionPet.tsx
 */
function getMoodAnimation(state: PetMoodState): string {
  const map: Record<PetMoodState, string> = {
    happy: 'happy_bounce',
    calm: 'idle_breathe',
    sleepy: 'sleepy_drift',
    cozy: 'cozy_curl',
    curious: 'curious_tilt',
  };
  return map[state];
}

/**
 * Get the ambient sound key for the current mood.
 * Sounds are loaded at app init and cached.
 */
function getMoodSound(state: PetMoodState): string {
  const map: Record<PetMoodState, string> = {
    happy: 'ambient_happy',
    calm: 'ambient_calm',
    sleepy: 'ambient_sleepy',
    cozy: 'ambient_cozy',
    curious: 'ambient_curious',
  };
  return map[state];
}

function getMoodEmoji(state: PetMoodState): string {
  const map: Record<PetMoodState, string> = {
    happy: '😊',
    calm: '😌',
    sleepy: '😴',
    cozy: '🥰',
    curious: '🤔',
  };
  return map[state];
}

/**
 * Determine time of day bucket from a Date object.
 * Morning: 5am–11:59am, Afternoon: 12pm–5:59pm, Evening: 6pm–4:59am
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Calculate how many minutes ago a timestamp was.
 * Returns Infinity if no timestamp provided (e.g. never interacted).
 */
export function minutesSince(timestamp: string | null | undefined): number {
  if (!timestamp) return Infinity;
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  return Math.floor((now - then) / 60000);
}
