/**
 * Patient Home Screen - Daily Activity Queue
 *
 * Flow:
 * 1. Check if mood was checked in today
 * 2. If not, redirect to mood screen
 * 3. If mood exists, fetch today's AI-generated daily queue from ai_adjustments
 * 4. If no AI queue, use fallback queue
 * 5. Display queue as large, tappable activity cards (scrollable)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { useTimeTheme, getPersonalizedGreeting } from '../../lib/time-theme';
import { supabase } from '../../lib/supabase';

// ============================================
// ROUTE MAP - activity name to expo-router path
// ============================================
const ROUTE_MAP: Record<string, string> = {
  memory_cards: '/(patient)/games/memory-cards',
  word_find: '/(patient)/games/word-find',
  sorting: '/(patient)/games/sorting',
  face_name: '/(patient)/games/face-name',
  spelling: '/(patient)/games/spelling',
  color_number: '/(patient)/games/color-number',
  breathing: '/(patient)/breathing',
  breathing_exercise: '/(patient)/breathing',
  music_listen: '/(patient)/music',
  music_therapy: '/(patient)/music',
  photo_album: '/(patient)/photos',
  photo_slideshow: '/(patient)/photos',
  daily_verse: '/(patient)/verse',
  scripture_read: '/(patient)/verse',
  scripture_animated: '/(patient)/verse',
  devotional: '/(patient)/verse',
  gentle_exercise: '/(patient)/breathing',
  guided_workout: '/(patient)/breathing',
  chair_yoga: '/(patient)/breathing',
  singalong: '/(patient)/music',
  voice_message_listen: '/(patient)/photos',
  sensory_calm: '/(patient)/breathing',
  gentle_touch: '/(patient)/breathing',
};

// ============================================
// ACTIVITY DISPLAY CONFIG
// ============================================
const ACTIVITY_META: Record<string, { label: string; emoji: string }> = {
  face_name:            { label: 'Face & Name',     emoji: '👤' },
  memory_cards:         { label: 'Memory Cards',    emoji: '🃏' },
  word_find:            { label: 'Word Find',       emoji: '🔤' },
  sorting:              { label: 'Sorting',          emoji: '📦' },
  spelling:             { label: 'Spelling',         emoji: '✏️' },
  color_number:         { label: 'Color by Number',  emoji: '🎨' },
  breathing:            { label: 'Breathing',        emoji: '🌬️' },
  breathing_exercise:   { label: 'Breathing',        emoji: '🌬️' },
  guided_workout:       { label: 'Workout',          emoji: '💪' },
  chair_yoga:           { label: 'Chair Yoga',       emoji: '🧘' },
  music_listen:         { label: 'Music',            emoji: '🎵' },
  music_therapy:        { label: 'Music Therapy',    emoji: '🎵' },
  singalong:            { label: 'Sing Along',       emoji: '🎤' },
  scripture_read:       { label: 'Daily Verse',      emoji: '📖' },
  scripture_animated:   { label: 'Animated Verse',   emoji: '✨' },
  devotional:           { label: 'Devotional',       emoji: '🙏' },
  photo_album:          { label: 'Photo Album',      emoji: '📸' },
  photo_slideshow:      { label: 'Photo Slideshow',  emoji: '📸' },
  daily_verse:          { label: 'Daily Verse',      emoji: '📖' },
  voice_message_listen: { label: 'Voice Messages',   emoji: '💬' },
  sensory_calm:         { label: 'Calm Screen',      emoji: '🌊' },
  gentle_touch:         { label: 'Gentle Touch',     emoji: '💫' },
  gentle_exercise:      { label: 'Gentle Exercise',  emoji: '🤸' },
};

// ============================================
// FALLBACK QUEUE
// ============================================
interface QueueItem {
  activity: string;
  difficulty?: Record<string, unknown>;
  order: number;
  estimated_minutes: number;
}

const FALLBACK_QUEUE: QueueItem[] = [
  { activity: 'memory_cards', difficulty: { pairs: 4 }, order: 1, estimated_minutes: 10 },
  { activity: 'breathing', difficulty: { cycles: 5 }, order: 2, estimated_minutes: 5 },
  { activity: 'music_listen', difficulty: {}, order: 3, estimated_minutes: 15 },
  { activity: 'sorting', difficulty: { items: 3 }, order: 4, estimated_minutes: 8 },
];

// ============================================
// MOOD EMOJI MAP (for badge display)
// ============================================
const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', okay: '😐', sad: '😢', confused: '😕', tired: '😴',
};

// ============================================
// COMPONENT
// ============================================
type HomeState = 'loading' | 'queue';

export default function PatientHome() {
  const router = useRouter();
  const theme = useTimeTheme();

  const [state, setState] = useState<HomeState>('loading');
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [displayName, setDisplayName] = useState('there');

  // ---- Initial load: check auth + today's mood ----
  useEffect(() => {
    checkMoodAndLoadQueue();
  }, []);

  const checkMoodAndLoadQueue = useCallback(async () => {
    try {
      console.log('[home] Checking auth and mood...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[home] No user, redirecting to login');
        router.replace('/(auth)/login' as any);
        return;
      }

      console.log('[home] User:', user.id);

      // Get profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }

      // Check if mood was checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: moods } = await supabase
        .from('mood_checkins')
        .select('mood')
        .eq('patient_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('[home] Mood check result:', moods?.length, 'records');

      if (moods && moods.length > 0) {
        // Mood already done today - load queue
        setTodayMood(moods[0].mood);
        await loadDailyQueue(user.id);
        setState('queue');
      } else {
        // No mood today - redirect to mood check-in screen
        console.log('[home] No mood today, redirecting to mood screen');
        router.replace('/(patient)/mood' as any);
      }
    } catch (err) {
      console.error('[home] Load error:', err);
      // On any error, show fallback queue so the screen isn't blank
      setQueue(FALLBACK_QUEUE);
      setState('queue');
    }
  }, []);

  // ---- Load daily queue from ai_adjustments ----
  const loadDailyQueue = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('[home] Loading queue for', today);

      const { data: adjustments } = await supabase
        .from('ai_adjustments')
        .select('daily_queue')
        .eq('patient_id', userId)
        .eq('adjustment_date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('[home] AI adjustments result:', adjustments?.length, 'records');

      if (adjustments && adjustments.length > 0 && adjustments[0].daily_queue) {
        let raw = adjustments[0].daily_queue;

        // Handle nested { daily_queue: [...] } structure from AI engine
        if (raw && !Array.isArray(raw) && (raw as any).daily_queue) {
          raw = (raw as any).daily_queue;
        }

        if (Array.isArray(raw) && raw.length > 0) {
          console.log('[home] Queue loaded:', raw.length, 'items');
          setQueue(raw as QueueItem[]);
          return;
        }
      }

      // No AI queue for today - use fallback
      console.log('[home] No AI queue, using fallback');
      setQueue(FALLBACK_QUEUE);
    } catch (err) {
      console.error('[home] Queue load error:', err);
      setQueue(FALLBACK_QUEUE);
    }
  };

  // ---- Navigate to activity ----
  const handleActivityPress = (item: QueueItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const route = ROUTE_MAP[item.activity];
    if (route) {
      console.log('[home] Navigating to:', route);
      router.push(route as any);
    } else {
      Alert.alert('Coming Soon', 'This activity will be available in a future update.');
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (state === 'loading') {
    return (
      <MBSafeArea showHome={false} showSOS={true} backgroundColor={theme.backgroundColor}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            Getting things ready...
          </Text>
        </View>
      </MBSafeArea>
    );
  }

  // ============================================
  // RENDER: DAILY QUEUE (scrollable)
  // ============================================
  return (
    <MBSafeArea showHome={false} showSOS={true} backgroundColor={theme.backgroundColor}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting + mood badge */}
        <View style={styles.queueHeader}>
          <Text style={[styles.greetingSmall, { color: theme.textColor }]}>
            {getPersonalizedGreeting(theme, displayName)}
          </Text>
          {todayMood && (
            <View style={styles.moodBadge}>
              <Text style={styles.moodBadgeEmoji}>
                {MOOD_EMOJI[todayMood] || '😊'}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.queueTitle, { color: theme.textColor }]}>
          Your activities today
        </Text>

        {/* Activity cards */}
        {queue.map((item, idx) => {
          const meta = ACTIVITY_META[item.activity] || {
            label: item.activity.replace(/_/g, ' '),
            emoji: '🎯',
          };
          const hasRoute = !!ROUTE_MAP[item.activity];

          return (
            <Pressable
              key={`${item.activity}-${idx}`}
              onPress={() => handleActivityPress(item)}
              disabled={!hasRoute}
              accessibilityRole="button"
              accessibilityLabel={`${meta.label}, about ${item.estimated_minutes} minutes`}
              accessibilityHint={hasRoute ? `Start ${meta.label} activity` : 'Coming soon'}
              style={({ pressed }) => [
                styles.activityCard,
                { backgroundColor: theme.cardBackground },
                !hasRoute && { opacity: 0.5 },
                pressed && hasRoute && {
                  transform: [{ scale: 0.97 }],
                  backgroundColor: COLORS.glow,
                },
              ]}
            >
              <Text style={styles.cardEmoji}>{meta.emoji}</Text>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardLabel, { color: theme.textColor }]}>
                  {meta.label}
                </Text>
                <Text style={[styles.cardDuration, { color: theme.secondaryText }]}>
                  {hasRoute
                    ? `${item.estimated_minutes} min`
                    : 'Coming Soon'}
                </Text>
              </View>
              <View style={[styles.cardOrderBadge, !hasRoute && { backgroundColor: COLORS.gray }]}>
                <Text style={styles.cardOrderText}>{idx + 1}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </MBSafeArea>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  // Shared
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: A11Y.fontSizeBody,
    marginTop: 16,
  },

  // Queue view (scrollable)
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingSmall: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    flex: 1,
  },
  moodBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.glow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodBadgeEmoji: {
    fontSize: 28,
  },
  queueTitle: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '500',
    marginBottom: 20,
    opacity: 0.7,
  },

  // Activity cards
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    minHeight: A11Y.preferredTouchTarget,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  cardDuration: {
    fontSize: 16,
    marginTop: 2,
  },
  cardOrderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOrderText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
