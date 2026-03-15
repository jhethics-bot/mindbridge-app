/**
 * Daily Verse Screen
 * Queries daily_verses table for today's verse.
 * Shows verse with gentle fade-in animation.
 * Faith module is optional — shows graceful empty state if disabled.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, logActivitySession, getCurrentProfile } from '../../lib/supabase';
import type { DiseaseStage } from '../../types';

interface DailyVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  theme?: string;
}

const FALLBACK_VERSE: DailyVerse = {
  id: 'fallback',
  reference: 'Psalm 23:1',
  text: 'The Lord is my shepherd; I shall not want.',
  translation: 'KJV',
  theme: 'comfort',
};

export default function VerseScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [faithEnabled, setFaithEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const patientId = useRef('');

  useEffect(() => {
    loadVerse();
  }, []);

  async function loadVerse() {
    try {
      const p = await getCurrentProfile();
      if (p) {
        setStage(p.stage as DiseaseStage);
        patientId.current = p.id;
        setFaithEnabled(p.faith_enabled !== false);
      }

      if (!p?.faith_enabled) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_verses')
        .select('*')
        .eq('patient_id', p?.id)
        .eq('verse_date', today)
        .limit(1);

      if (data && data.length > 0) {
        setVerse(data[0] as DailyVerse);
        // Mark as viewed
        await supabase
          .from('daily_verses')
          .update({ was_viewed: true })
          .eq('id', data[0].id);
      } else {
        setVerse(FALLBACK_VERSE);
      }

      // Log activity
      if (p) {
        await logActivitySession({
          patient_id: p.id,
          activity: 'scripture_read',
          stage_at_time: p.stage || 'middle',
          difficulty_params: {},
          score: { viewed: true },
          duration_seconds: 0,
          completed: true,
        });
      }
    } catch {
      setVerse(FALLBACK_VERSE);
    }
    setLoading(false);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }

  const fontSize = stage === 'late' ? 28 : stage === 'middle' ? 24 : 22;

  if (loading) {
    return (
      <MBSafeArea showHome showSOS>
        <View style={st.center}>
          <Text style={st.loadText}>Loading...</Text>
        </View>
      </MBSafeArea>
    );
  }

  if (!faithEnabled) {
    return (
      <MBSafeArea showHome showSOS>
        <View style={st.center}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>📖</Text>
          <Text style={st.disabledTitle}>Scripture is not enabled</Text>
          <Text style={st.disabledBody}>
            Ask your caregiver to enable the faith module in settings.
          </Text>
          <MBButton label="Go Home" variant="primary" size="large"
            onPress={() => router.replace('/(patient)')} style={{ marginTop: 32 }} />
        </View>
      </MBSafeArea>
    );
  }

  return (
    <MBSafeArea showHome showSOS backgroundColor="#FDF8F0">
      <Animated.View style={[st.verseContainer, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Text style={st.crossIcon}>✝</Text>

        {verse && (
          <>
            <Text style={[st.verseText, { fontSize }]}>
              "{verse.text}"
            </Text>
            <Text style={st.reference}>— {verse.reference}</Text>
            <Text style={st.translation}>{verse.translation}</Text>
          </>
        )}

        <View style={st.actions}>
          <MBButton
            label="🔊 Listen"
            variant="secondary"
            size="standard"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // expo-speech would read the verse aloud
              try {
                const Speech = require('expo-speech');
                Speech.speak(verse?.text || '', { rate: 0.8, language: 'en-US' });
              } catch {}
            }}
          />
          <MBButton
            label="Go Home"
            variant="primary"
            size="standard"
            onPress={() => router.replace('/(patient)')}
          />
        </View>
      </Animated.View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  loadText: { fontSize: A11Y.fontSizeHeading, color: COLORS.navy },
  verseContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40,
  },
  crossIcon: { fontSize: 48, color: COLORS.gold, marginBottom: 32 },
  verseText: {
    fontWeight: '500', color: COLORS.navy, textAlign: 'center', lineHeight: 38,
    fontStyle: 'italic', marginBottom: 20, paddingHorizontal: 8,
  },
  reference: { fontSize: 20, fontWeight: '600', color: COLORS.teal, marginBottom: 4 },
  translation: { fontSize: 14, color: COLORS.gray, marginBottom: 40 },
  actions: { flexDirection: 'row', gap: 16 },
  disabledTitle: { fontSize: 24, fontWeight: '700', color: COLORS.navy, marginBottom: 12, textAlign: 'center' },
  disabledBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 20 },
});
