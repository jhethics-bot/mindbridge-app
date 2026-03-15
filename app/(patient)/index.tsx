/**
 * Patient Home Screen - Daily Activity Queue
 *
 * Flow:
 * 1. Check if mood was checked in today
 * 2. If not, show mood prompt (inline, not separate screen)
 * 3. After mood, fetch today's AI-generated daily queue from ai_adjustments
 * 4. If no AI queue, use fallback queue
 * 5. Display queue as large, tappable activity cards
 *
 * Clinical basis: Single clear flow. One action per screen.
 * No scrolling on activity screens (queue fits in viewport with max 4 cards).
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { useTimeTheme, getPersonalizedGreeting } from '../../lib/time-theme';
import { supabase } from '../../lib/supabase';
import type { MoodType, DailyQueueItem, ActivityType } from '../../types';

// ============================================
// FALLBACK QUEUE (always shows something)
// ============================================
const FALLBACK_QUEUE: DailyQueueItem[] = [
  { activity: 'memory_cards', difficulty: { pairs: 4 }, order: 1, estimated_minutes: 10 },
  { activity: 'breathing', difficulty: { cycles: 5 }, order: 2, estimated_minutes: 5 },
  { activity: 'music_listen', difficulty: {}, order: 3, estimated_minutes: 15 },
  { activity: 'sorting', difficulty: { items: 3 }, order: 4, estimated_minutes: 8 },
];

// ============================================
// ACTIVITY DISPLAY CONFIG
// ============================================
const ACTIVITY_META: Record<string, { label: string; emoji: string; route: string }> = {
  face_name:           { label: 'Face & Name',    emoji: '👤', route: '/(patient)/games/face-name' },
  memory_cards:        { label: 'Memory Cards',   emoji: '🃏', route: '/(patient)/games/memory-cards' },
  word_find:           { label: 'Word Find',      emoji: '🔤', route: '/(patient)/games/word-find' },
  sorting:             { label: 'Sorting',         emoji: '📦', route: '/(patient)/games/sorting' },
  spelling:            { label: 'Spelling',        emoji: '✏️', route: '/(patient)/games/spelling' },
  color_number:        { label: 'Color by Number', emoji: '🎨', route: '/(patient)/games/color-number' },
  breathing:           { label: 'Breathing',       emoji: '🌬️', route: '/(patient)/breathing' },
  guided_workout:      { label: 'Workout',         emoji: '💪', route: '/(patient)/breathing' },
  chair_yoga:          { label: 'Chair Yoga',      emoji: '🧘', route: '/(patient)/breathing' },
  music_listen:        { label: 'Music',           emoji: '🎵', route: '/(patient)/music' },
  singalong:           { label: 'Sing Along',      emoji: '🎤', route: '/(patient)/music' },
  scripture_read:      { label: 'Daily Verse',     emoji: '📖', route: '/(patient)/verse' },
  scripture_animated:  { label: 'Animated Verse',  emoji: '✨', route: '/(patient)/verse' },
  devotional:          { label: 'Devotional',      emoji: '🙏', route: '/(patient)/verse' },
  photo_album:         { label: 'Photo Album',     emoji: '📸', route: '/(patient)/photos' },
  voice_message_listen:{ label: 'Voice Messages',  emoji: '💬', route: '/(patient)/photos' },
  sensory_calm:        { label: 'Calm Screen',     emoji: '🌊', route: '/(patient)/breathing' },
  gentle_touch:        { label: 'Gentle Touch',    emoji: '💫', route: '/(patient)/breathing' },
};

// ============================================
// MOOD EMOJI OPTIONS
// ============================================
const MOOD_OPTIONS: { mood: MoodType; emoji: string; label: string }[] = [
  { mood: 'happy', emoji: '😊', label: 'Happy' },
  { mood: 'okay', emoji: '😐', label: 'Okay' },
  { mood: 'sad', emoji: '😢', label: 'Sad' },
  { mood: 'confused', emoji: '😕', label: 'Confused' },
  { mood: 'tired', emoji: '😴', label: 'Tired' },
];

// ============================================
// COMPONENT
// ============================================
type HomeState = 'loading' | 'mood_prompt' | 'mood_submitting' | 'queue';

export default function PatientHome() {
  const router = useRouter();
  const theme = useTimeTheme();

  const [state, setState] = useState<HomeState>('loading');
  const [todayMood, setTodayMood] = useState<MoodType | null>(null);
  const [queue, setQueue] = useState<DailyQueueItem[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('there');

  // ---- Initial load: check auth + today's mood ----
  useEffect(() => {
    checkMoodAndLoadQueue();
  }, []);

  const checkMoodAndLoadQueue = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login' as any);
        return;
      }

      setPatientId(user.id);

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
      const { data: moodData } = await supabase
        .from('mood_checkins')
        .select('mood')
        .eq('patient_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (moodData && moodData.length > 0) {
        // Mood already done today - load queue
        setTodayMood(moodData[0].mood as MoodType);
        await loadDailyQueue(user.id);
        setState('queue');
      } else {
        // Need mood check-in first
        setState('mood_prompt');
      }
    } catch (err) {
      console.error('Home screen load error:', err);
      // On any error, show fallback queue so the screen isn't blank
      setQueue(FALLBACK_QUEUE);
      setState('queue');
    }
  }, []);

  // ---- Load daily queue from ai_adjustments ----
  const loadDailyQueue = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('ai_adjustments')
        .select('daily_queue')
        .eq('patient_id', userId)
        .eq('adjustment_date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].daily_queue) {
        const raw = data[0].daily_queue;
        // Handle both { daily_queue: [...] } and direct array
        const items = Array.isArray(raw)
          ? raw
          : (raw as any).daily_queue
            ? (raw as any).daily_queue
            : null;

        if (items && items.length > 0) {
          setQueue(items as DailyQueueItem[]);
          return;
        }
      }

      // No AI queue for today - use fallback
      setQueue(FALLBACK_QUEUE);
    } catch (err) {
      console.error('Queue load error:', err);
      setQueue(FALLBACK_QUEUE);
    }
  };

  // ---- Handle mood selection (inline) ----
  const handleMoodSelect = async (mood: MoodType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTodayMood(mood);
    setState('mood_submitting');

    try {
      if (patientId) {
        // Log mood to Supabase
        await supabase
          .from('mood_checkins')
          .insert({ patient_id: patientId, mood });

        // Try to generate AI queue (non-blocking)
        // The AI engine will write to ai_adjustments
        try {
          const { generateDailyQueue } = require('../../lib/ai-engine');
          const { data: profile } = await supabase
            .from('profiles')
            .select('stage, faith_enabled')
            .eq('id', patientId)
            .single();

          if (profile) {
            await generateDailyQueue(patientId, profile.stage, mood, profile.faith_enabled);
          }
        } catch {
          // AI engine may fail - that's fine, we have fallback
        }

        // Now load whatever queue is available
        await loadDailyQueue(patientId);
      } else {
        setQueue(FALLBACK_QUEUE);
      }
    } catch (err) {
      console.error('Mood submission error:', err);
      setQueue(FALLBACK_QUEUE);
    }

    setState('queue');
  };

  // ---- Navigate to activity ----
  const handleActivityPress = (item: DailyQueueItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const meta = ACTIVITY_META[item.activity];
    if (meta?.route) {
      router.push(meta.route as any);
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
  // RENDER: MOOD PROMPT (inline, not separate screen)
  // ============================================
  if (state === 'mood_prompt') {
    return (
      <MBSafeArea showHome={false} showSOS={true} backgroundColor={theme.backgroundColor}>
        <View style={styles.centerContainer}>
          <Text style={[styles.greeting, { color: theme.textColor }]}>
            {getPersonalizedGreeting(theme, displayName)}
          </Text>
          <Text style={[styles.question, { color: theme.secondaryText }]}>
            How are you feeling today?
          </Text>

          <View style={styles.emojiGrid}>
            {MOOD_OPTIONS.map((option) => (
              <Pressable
                key={option.mood}
                onPress={() => handleMoodSelect(option.mood)}
                accessibilityRole="button"
                accessibilityLabel={`I feel ${option.label}`}
                style={({ pressed }) => [
                  styles.emojiButton,
                  { backgroundColor: theme.cardBackground },
                  pressed && { transform: [{ scale: 0.95 }], opacity: 0.85 },
                ]}
              >
                <Text style={styles.emoji}>{option.emoji}</Text>
                <Text style={[styles.emojiLabel, { color: theme.textColor }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </MBSafeArea>
    );
  }

  // ============================================
  // RENDER: SUBMITTING MOOD
  // ============================================
  if (state === 'mood_submitting') {
    return (
      <MBSafeArea showHome={false} showSOS={true} backgroundColor={theme.backgroundColor}>
        <View style={styles.centerContainer}>
          <Text style={styles.thankYouEmoji}>💛</Text>
          <Text style={[styles.thankYouText, { color: theme.textColor }]}>
            Thank you!
          </Text>
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
            Getting your activities ready...
          </Text>
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 24 }} />
        </View>
      </MBSafeArea>
    );
  }

  // ============================================
  // RENDER: DAILY QUEUE
  // ============================================
  return (
    <MBSafeArea showHome={false} showSOS={true} backgroundColor={theme.backgroundColor}>
      <View style={styles.queueContainer}>
        {/* Greeting + mood badge */}
        <View style={styles.queueHeader}>
          <Text style={[styles.greetingSmall, { color: theme.textColor }]}>
            {getPersonalizedGreeting(theme, displayName)}
          </Text>
          {todayMood && (
            <View style={styles.moodBadge}>
              <Text style={styles.moodBadgeEmoji}>
                {MOOD_OPTIONS.find(m => m.mood === todayMood)?.emoji || '😊'}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.queueTitle, { color: theme.textColor }]}>
          Your activities today
        </Text>

        {/* Activity cards */}
        <View style={styles.cardGrid}>
          {queue.slice(0, 4).map((item, idx) => {
            const meta = ACTIVITY_META[item.activity] || {
              label: item.activity.replace(/_/g, ' '),
              emoji: '🎯',
              route: '',
            };
            return (
              <Pressable
                key={`${item.activity}-${idx}`}
                onPress={() => handleActivityPress(item)}
                accessibilityRole="button"
                accessibilityLabel={`${meta.label}, about ${item.estimated_minutes} minutes`}
                accessibilityHint={`Start ${meta.label} activity`}
                style={({ pressed }) => [
                  styles.activityCard,
                  { backgroundColor: theme.cardBackground },
                  pressed && {
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
                    {item.estimated_minutes} min
                  </Text>
                </View>
                <View style={styles.cardOrderBadge}>
                  <Text style={styles.cardOrderText}>{idx + 1}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
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

  // Mood prompt
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  question: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '500',
    marginBottom: 48,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  emojiButton: {
    width: 100,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: {
    fontSize: A11Y.fontSizeEmoji,
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '600',
  },

  // Thank you
  thankYouEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  thankYouText: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Queue view
  queueContainer: {
    flex: 1,
    paddingTop: 8,
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
  cardGrid: {
    flex: 1,
    gap: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    minHeight: A11Y.preferredTouchTarget,
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
