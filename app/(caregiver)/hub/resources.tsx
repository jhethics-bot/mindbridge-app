/**
 * Resources — Caregiver Hub
 * Curated articles and guides for Alzheimer's caregivers.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';

interface Resource {
  title: string;
  source: string;
  emoji: string;
  url: string;
}

const RESOURCES: Resource[] = [
  { title: 'Understanding Alzheimer\'s Stages', source: 'Alzheimer\'s Association', emoji: '🧠', url: 'https://www.alz.org/alzheimers-dementia/stages' },
  { title: 'Caregiver Stress & Burnout', source: 'Mayo Clinic', emoji: '💛', url: 'https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/caregiver-stress/art-20044784' },
  { title: 'MIND Diet for Brain Health', source: 'Harvard Health', emoji: '🥗', url: 'https://www.health.harvard.edu/blog/mind-diet-associated-with-reduced-incidence-of-alzheimers-disease-201502907780' },
  { title: 'Communication Tips', source: 'National Institute on Aging', emoji: '💬', url: 'https://www.nia.nih.gov/health/alzheimers-and-dementia/communicating-people-dementia' },
  { title: 'Home Safety Checklist', source: 'Alzheimer\'s Association', emoji: '🏠', url: 'https://www.alz.org/help-support/caregiving/safety/home-safety' },
  { title: 'Legal & Financial Planning', source: 'National Institute on Aging', emoji: '📋', url: 'https://www.nia.nih.gov/health/legal-and-financial-planning-people-alzheimers' },
  { title: 'Wandering Prevention', source: 'Alzheimer\'s Association', emoji: '🚶', url: 'https://www.alz.org/help-support/caregiving/stages-behaviors/wandering' },
  { title: 'Music Therapy Benefits', source: 'AARP', emoji: '🎵', url: 'https://www.aarp.org/health/brain-health/info-2020/music-therapy-dementia.html' },
];

export default function ResourcesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={st.back}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Resources</Text>
        <Text style={st.subtitle}>Trusted information from leading organizations</Text>

        {RESOURCES.map((r, i) => (
          <Pressable
            key={i}
            onPress={() => Linking.openURL(r.url)}
            accessibilityRole="link"
            accessibilityLabel={r.title}
            style={({ pressed }) => [st.card, pressed && { opacity: 0.85 }]}
          >
            <Text style={st.cardEmoji}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.cardTitle}>{r.title}</Text>
              <Text style={st.cardSource}>{r.source}</Text>
            </View>
            <Text style={st.arrow}>→</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  back: { fontSize: 18, color: COLORS.teal, fontWeight: '600', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.gray, marginBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  cardSource: { fontSize: 13, color: COLORS.teal, marginTop: 2 },
  arrow: { fontSize: 18, color: COLORS.gray },
});
