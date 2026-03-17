/**
 * NeuBridge Time-of-Day Theming System
 *
 * Background colors and ambient atmosphere shift gently throughout the day,
 * mirroring natural light patterns. This serves both aesthetic and clinical
 * purposes: warm morning tones encourage engagement, calming evening tones
 * support sundowning management (a common Alzheimer's symptom where agitation
 * increases in late afternoon/evening).
 *
 * Clinical basis: Circadian rhythm disruption is common in Alzheimer's.
 * Light-responsive environments help orient patients to time of day and
 * reduce sundowning episodes.
 */

import { useEffect, useState, useMemo } from 'react';
import { Dimensions } from 'react-native';

// ============================================
// TIME PERIODS
// ============================================

export type TimePeriod =
  | 'early_morning'  // 5:00 - 7:59    Gentle dawn
  | 'morning'        // 8:00 - 11:59   Bright and warm
  | 'afternoon'      // 12:00 - 15:59  Full daylight
  | 'late_afternoon' // 16:00 - 17:59  Golden hour (pre-sundown care)
  | 'evening'        // 18:00 - 20:59  Calming twilight
  | 'night';         // 21:00 - 4:59   Deep rest

export interface TimeTheme {
  period: TimePeriod;
  label: string;               // Friendly greeting
  backgroundColor: string;     // Primary background
  backgroundGradient: [string, string]; // Top to bottom gradient
  accentColor: string;         // Adjusted teal for contrast
  textColor: string;           // Primary text
  secondaryText: string;       // Secondary text
  cardBackground: string;      // Card/surface color
  greeting: string;            // Time-appropriate greeting
  ambientIcon: string;         // Emoji for time context
}

// ============================================
// THEME DEFINITIONS
// ============================================

const TIME_THEMES: Record<TimePeriod, TimeTheme> = {
  early_morning: {
    period: 'early_morning',
    label: 'Early Morning',
    backgroundColor: '#FEF3E2',        // Soft peach dawn
    backgroundGradient: ['#FEF3E2', '#FDE8D0'],
    accentColor: '#2A9D8F',
    textColor: '#1B2A4A',
    secondaryText: '#7C6F64',
    cardBackground: '#FFFFFF',
    greeting: 'Good morning',
    ambientIcon: '🌅',
  },
  morning: {
    period: 'morning',
    label: 'Morning',
    backgroundColor: '#F4F1DE',         // Warm cream (standard)
    backgroundGradient: ['#F4F1DE', '#EDE8CB'],
    accentColor: '#2A9D8F',
    textColor: '#1B2A4A',
    secondaryText: '#6B7280',
    cardBackground: '#FFFFFF',
    greeting: 'Good morning',
    ambientIcon: '☀️',
  },
  afternoon: {
    period: 'afternoon',
    label: 'Afternoon',
    backgroundColor: '#F0F4EC',         // Light sage
    backgroundGradient: ['#F0F4EC', '#E8EDE3'],
    accentColor: '#2A9D8F',
    textColor: '#1B2A4A',
    secondaryText: '#6B7280',
    cardBackground: '#FFFFFF',
    greeting: 'Good afternoon',
    ambientIcon: '🌤️',
  },
  late_afternoon: {
    period: 'late_afternoon',
    label: 'Late Afternoon',
    // CLINICAL: Golden warm tones help ease the transition into evening
    // and can reduce sundowning agitation
    backgroundColor: '#FDF6EC',         // Warm golden cream
    backgroundGradient: ['#FDF6EC', '#F9EDDA'],
    accentColor: '#2A8A7E',
    textColor: '#1B2A4A',
    secondaryText: '#7C6F64',
    cardBackground: '#FFFDF8',
    greeting: 'Good afternoon',
    ambientIcon: '🌇',
  },
  evening: {
    period: 'evening',
    label: 'Evening',
    // CLINICAL: Cool, calming tones signal wind-down time
    // Reduced visual stimulation to prepare for sleep
    backgroundColor: '#EEF0F5',         // Soft blue-gray
    backgroundGradient: ['#EEF0F5', '#E3E7EF'],
    accentColor: '#2A8A7E',
    textColor: '#1B2A4A',
    secondaryText: '#6B7280',
    cardBackground: '#F8F9FC',
    greeting: 'Good evening',
    ambientIcon: '🌙',
  },
  night: {
    period: 'night',
    label: 'Night',
    // CLINICAL: Minimal stimulation. Warm navy tones.
    // If app is opened at night, present calming content only.
    backgroundColor: '#E8EBF0',         // Muted lavender-gray
    backgroundGradient: ['#E8EBF0', '#DEE2EA'],
    accentColor: '#4A90D9',             // Softer blue for night
    textColor: '#2D3748',
    secondaryText: '#718096',
    cardBackground: '#F0F2F6',
    greeting: 'Hello',
    ambientIcon: '✨',
  },
};

// ============================================
// TIME DETECTION
// ============================================

function getCurrentPeriod(): TimePeriod {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 18) return 'late_afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

// ============================================
// REACT HOOK
// ============================================

/**
 * useTimeTheme - Returns the current time-of-day theme
 *
 * Updates automatically every 15 minutes to handle transitions.
 * Use this in every screen that has a background color.
 *
 * Usage:
 *   const theme = useTimeTheme();
 *   <View style={{ backgroundColor: theme.backgroundColor }}>
 *     <Text style={{ color: theme.textColor }}>{theme.greeting}, Mom!</Text>
 *   </View>
 */
export function useTimeTheme(): TimeTheme {
  const [period, setPeriod] = useState<TimePeriod>(getCurrentPeriod());

  useEffect(() => {
    // Check every 15 minutes for time period changes
    const interval = setInterval(() => {
      const newPeriod = getCurrentPeriod();
      if (newPeriod !== period) {
        setPeriod(newPeriod);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [period]);

  return useMemo(() => TIME_THEMES[period], [period]);
}

/**
 * getThemeForPeriod - Get theme for a specific time period
 * Useful for previewing or testing different time states
 */
export function getThemeForPeriod(period: TimePeriod): TimeTheme {
  return TIME_THEMES[period];
}

/**
 * getPersonalizedGreeting - Combines time greeting with patient name
 *
 * Usage:
 *   const greeting = getPersonalizedGreeting(theme, 'Mom');
 *   // "Good morning, Mom! ☀️"
 */
export function getPersonalizedGreeting(
  theme: TimeTheme,
  name: string
): string {
  return `${theme.greeting}, ${name}! ${theme.ambientIcon}`;
}

/**
 * shouldShowCalmingContent - Clinical helper
 *
 * Returns true during late afternoon and evening hours when
 * sundowning risk is elevated. The AI engine uses this to
 * adjust the activity queue toward more calming content.
 */
export function shouldShowCalmingContent(): boolean {
  const period = getCurrentPeriod();
  return period === 'late_afternoon' || period === 'evening' || period === 'night';
}

/**
 * isNightMode - Returns true during nighttime hours
 *
 * When true, the app should:
 * - Show only calming/sensory content
 * - Reduce screen brightness suggestion
 * - Prioritize music and breathing exercises
 * - Display a gentle "Time to rest" message
 */
export function isNightMode(): boolean {
  return getCurrentPeriod() === 'night';
}
