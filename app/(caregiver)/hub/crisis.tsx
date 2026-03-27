/**
 * Crisis Resources — Caregiver Screen
 * Emergency helplines with tappable phone numbers.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';

interface Helpline {
  name: string;
  number: string;
  description: string;
  emoji: string;
}

const HELPLINES: Helpline[] = [
  { name: 'Alzheimer\'s Association 24/7 Helpline', number: '1-800-272-3900', description: 'Free support, education, and referrals 24 hours a day, 365 days a year.', emoji: '💜' },
  { name: 'Crisis Text Line', number: '741741', description: 'Text HOME to 741741 to connect with a trained crisis counselor.', emoji: '💬' },
  { name: '988 Suicide & Crisis Lifeline', number: '988', description: 'Call or text 988 for immediate emotional support.', emoji: '🆘' },
  { name: 'Local Emergency Services', number: '911', description: 'For immediate danger or medical emergencies.', emoji: '🚨' },
  { name: 'Eldercare Locator', number: '1-800-677-1116', description: 'Connects older adults and caregivers with local support services.', emoji: '🏠' },
];

export default function CrisisResourcesScreen() {
  const router = useRouter();

  const callNumber = (number: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cleaned = number.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleaned}`);
  };

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={st.back}>← Back</Text>
        </Pressable>

        <Text style={st.title}>Crisis Resources</Text>
        <Text style={st.message}>
          You are not alone. Help is available 24 hours a day, 7 days a week.
        </Text>

        {HELPLINES.map((h, i) => (
          <Pressable
            key={i}
            onPress={() => callNumber(h.number)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${h.name} at ${h.number}`}
            style={({ pressed }) => [st.card, pressed && { backgroundColor: COLORS.glow }]}
          >
            <Text style={st.cardEmoji}>{h.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.cardName}>{h.name}</Text>
              <Text style={st.cardNumber}>{h.number}</Text>
              <Text style={st.cardDesc}>{h.description}</Text>
            </View>
            <Text style={st.callIcon}>📞</Text>
          </Pressable>
        ))}

        <View style={st.encouragement}>
          <Text style={st.encourageText}>
            Caring for someone with Alzheimer's is one of the hardest things a person can do. Please reach out — you deserve support too.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  back: { fontSize: 18, color: COLORS.teal, fontWeight: '600', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  message: { fontSize: A11Y.fontSizeBody, color: COLORS.navy, lineHeight: 28, marginBottom: 24, fontWeight: '500' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardEmoji: { fontSize: 28 },
  cardName: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  cardNumber: { fontSize: 20, fontWeight: '700', color: COLORS.teal, marginTop: 2 },
  cardDesc: { fontSize: 13, color: COLORS.gray, marginTop: 4, lineHeight: 18 },
  callIcon: { fontSize: 24 },
  encouragement: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginTop: 12,
    borderWidth: 1, borderColor: COLORS.gold,
  },
  encourageText: {
    fontSize: 16, color: COLORS.navy, lineHeight: 26, textAlign: 'center', fontStyle: 'italic',
  },
});
