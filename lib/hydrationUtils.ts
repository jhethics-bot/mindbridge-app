/**
 * Hydration Utilities
 * Meal period detection, reminder logic, progress calculation.
 */

export type MealPeriod = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/**
 * Determine current meal period based on time of day.
 * 5-10 breakfast, 10-14 lunch, 14-17 snack, 17-21 dinner
 */
export function getMealPeriod(date: Date = new Date()): MealPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'snack';
  return 'dinner';
}

export function getMealPeriodLabel(period: MealPeriod): string {
  const labels: Record<MealPeriod, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    snack: 'Snack',
    dinner: 'Dinner',
  };
  return labels[period];
}

export function getMealPeriodEmoji(period: MealPeriod): string {
  const emojis: Record<MealPeriod, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    snack: '🍎',
    dinner: '🌙',
  };
  return emojis[period];
}

interface HydrationSettingsInput {
  reminder_frequency_hours: number;
  quiet_hours_start: string;   // "HH:MM" format
  quiet_hours_end: string;     // "HH:MM" format
}

/**
 * Check if a hydration reminder should be sent right now.
 */
export function shouldSendHydrationReminder(
  settings: HydrationSettingsInput,
  lastDrinkTime: Date | null,
  currentTime: Date = new Date()
): boolean {
  // Check quiet hours
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const [qStartH, qStartM] = settings.quiet_hours_start.split(':').map(Number);
  const [qEndH, qEndM] = settings.quiet_hours_end.split(':').map(Number);
  const quietStart = qStartH * 60 + qStartM;
  const quietEnd = qEndH * 60 + qEndM;

  // Handle overnight quiet hours (e.g., 21:00 - 07:00)
  if (quietStart > quietEnd) {
    if (currentMinutes >= quietStart || currentMinutes < quietEnd) return false;
  } else {
    if (currentMinutes >= quietStart && currentMinutes < quietEnd) return false;
  }

  // No last drink — always remind
  if (!lastDrinkTime) return true;

  const hoursSinceLastDrink = (currentTime.getTime() - lastDrinkTime.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastDrink >= settings.reminder_frequency_hours;
}

export interface HydrationProgress {
  current: number;       // total oz consumed today
  target: number;        // daily target oz
  percentage: number;    // 0-100
  glassesLogged: number; // assuming 8oz per glass
  glassesTarget: number;
}

/**
 * Calculate hydration progress from today's logs.
 */
export function getHydrationProgress(
  todayLogs: { amount_oz: number }[],
  targetOz: number
): HydrationProgress {
  const current = todayLogs.reduce((sum, log) => sum + (log.amount_oz ?? 8), 0);
  const percentage = Math.min(Math.round((current / targetOz) * 100), 100);
  return {
    current,
    target: targetOz,
    percentage,
    glassesLogged: Math.round(current / 8),
    glassesTarget: Math.round(targetOz / 8),
  };
}

const PET_HYDRATION_MESSAGES = [
  (name: string) => `${name} is thirsty! Time for a drink together? 💧`,
  (name: string) => `${name} just had some water. Your turn! 💧`,
  (name: string) => `Stay hydrated with ${name}! 💧`,
  (name: string) => `${name} says: "Water time!" 💧`,
  (name: string) => `You and ${name} both need water! 💧`,
];

/**
 * Get a pet-themed hydration reminder message.
 */
export function getPetHydrationMessage(petName: string): string {
  const idx = Math.floor(Math.random() * PET_HYDRATION_MESSAGES.length);
  return PET_HYDRATION_MESSAGES[idx](petName);
}
