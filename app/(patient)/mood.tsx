/**
 * Daily Mood Check-In Screen (standalone, navigated from home)
 *
 * Logs mood to Supabase, then navigates back to home screen
 * which will detect the mood and show the activity queue.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase } from '../../lib/supabase';
import type { MoodType } from '../../types';

interface MoodOption {
  mood: MoodType;
  emoji: string;
  label: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { mood: 'happy', emoji: '😊', label: 'Happy' },
  { mood: 'okay', emoji: '😐', label: 'Okay' },
  { mood: 'sad', emoji: '😢', label: 'Sad' },
  { mood: 'confused', emoji: '😕', label: 'Confused' },
  { mood: 'tired', emoji: '😴', label: 'Tired' },
];

export default function MoodCheckIn() {
  const router = useRouter();
  const [selected, setSelected] = useState<MoodType | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Guard: if mood already exists for today, skip straight to home
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('mood_checkins')
          .select('id')
          .eq('patient_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .limit(1);
        if (data && data.length > 0) {
          router.replace('/(patient)' as any);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const handleSelect = async (mood: MoodType) => {
    if (selected) return; // Prevent double-tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(mood);

    // Brief pause to show selection highlight
    setTimeout(async () => {
      setSubmitted(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: insertError } = await supabase
            .from('mood_checkins')
            .insert({ patient_id: user.id, mood });

          if (insertError) {
            console.error('[mood.tsx] Insert error:', insertError);
          }

          // Try AI queue generation (non-blocking, best-effort)
          try {
            const { generateDailyQueue } = require('../../lib/ai-engine');
            const { data: profile } = await supabase
              .from('profiles')
              .select('stage, faith_enabled')
              .eq('id', user.id)
              .single();
            if (profile) {
              generateDailyQueue(user.id, profile.stage, mood, profile.faith_enabled);
            }
          } catch {
            // AI engine failure is non-critical
          }
        }
      } catch (err) {
        console.error('[mood.tsx] Mood log error:', err);
      }

      // Navigate back to home after brief "thank you" display
      setTimeout(() => {
        router.replace('/(patient)' as any);
      }, 1500);
    }, 500);
  };

  if (submitted) {
    return (
      <MBSafeArea showHome={false} showSOS={true}>
        <View style={styles.thankYouContainer}>
          <Text style={styles.thankYouEmoji}>💛</Text>
          <Text style={styles.thankYouText}>Thank you!</Text>
          <Text style={styles.thankYouSub}>
            Getting your activities ready...
          </Text>
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 24 }} />
        </View>
      </MBSafeArea>
    );
  }

  return (
    <MBSafeArea showHome={false} showSOS={true}>
      <View style={styles.container}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.question}>How are you feeling today?</Text>

        <View style={styles.emojiGrid}>
          {MOOD_OPTIONS.map((option) => (
            <Pressable
              key={option.mood}
              onPress={() => handleSelect(option.mood)}
              accessibilityRole="button"
              accessibilityLabel={`I feel ${option.label}`}
              accessibilityHint={`Select ${option.label} as your mood for today`}
              style={({ pressed }) => [
                styles.emojiButton,
                selected === option.mood && styles.emojiSelected,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[
                styles.emojiLabel,
                selected === option.mood && styles.emojiLabelSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  question: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '500',
    color: COLORS.gray,
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
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emojiSelected: {
    borderWidth: 3,
    borderColor: COLORS.teal,
    backgroundColor: COLORS.glow,
  },
  emoji: {
    fontSize: A11Y.fontSizeEmoji,
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '600',
    color: COLORS.navy,
  },
  emojiLabelSelected: {
    color: COLORS.teal,
  },
  thankYouContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thankYouEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  thankYouText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
  thankYouSub: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.gray,
  },
});
