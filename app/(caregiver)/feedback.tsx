/**
 * Beta Feedback — Caregiver Screen
 * NPS score + open text fields saved to beta_feedback table.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';

export default function FeedbackScreen() {
  const router = useRouter();
  const [nps, setNps] = useState<number | null>(null);
  const [love, setLove] = useState('');
  const [change, setChange] = useState('');
  const [other, setOther] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (nps === null) {
      Alert.alert('Please rate', 'Tap a number from 0 to 10 to rate NeuBridge.');
      return;
    }
    setSaving(true);
    try {
      const profile = await getCurrentProfile();
      await supabase.from('beta_feedback').insert({
        user_id: profile?.id,
        nps_score: nps,
        what_you_love: love.trim() || null,
        what_to_change: change.trim() || null,
        other_thoughts: other.trim() || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Could not submit feedback. Please try again.');
    }
    setSaving(false);
  };

  if (submitted) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>💜</Text>
          <Text style={st.thankTitle}>Thank You!</Text>
          <Text style={st.thankBody}>
            Your feedback directly shapes NeuBridge for thousands of families.
          </Text>
          <Pressable onPress={() => router.back()} style={st.backLink}>
            <Text style={st.backLinkText}>← Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={st.back}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Share Your Feedback</Text>

        {/* NPS */}
        <Text style={st.question}>How likely are you to recommend NeuBridge to another caregiver?</Text>
        <View style={st.npsRow}>
          {Array.from({ length: 11 }, (_, i) => (
            <Pressable
              key={i}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNps(i); }}
              style={[st.npsBtn, nps === i && st.npsBtnActive]}
              accessibilityLabel={`${i} out of 10`}
            >
              <Text style={[st.npsNum, nps === i && st.npsNumActive]}>{i}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.npsLabels}>
          <Text style={st.npsLabel}>Not likely</Text>
          <Text style={st.npsLabel}>Very likely</Text>
        </View>

        {/* Open fields */}
        <Text style={st.question}>What do you love about NeuBridge?</Text>
        <TextInput
          style={st.input}
          value={love}
          onChangeText={setLove}
          placeholder="Tell us what works well..."
          placeholderTextColor={COLORS.gray}
          multiline
        />

        <Text style={st.question}>What would you change or add?</Text>
        <TextInput
          style={st.input}
          value={change}
          onChangeText={setChange}
          placeholder="Share your ideas..."
          placeholderTextColor={COLORS.gray}
          multiline
        />

        <Text style={st.question}>Any other thoughts?</Text>
        <TextInput
          style={st.input}
          value={other}
          onChangeText={setOther}
          placeholder="Anything else on your mind..."
          placeholderTextColor={COLORS.gray}
          multiline
        />

        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={[st.submitBtn, saving && { opacity: 0.5 }]}
        >
          <Text style={st.submitText}>{saving ? 'Submitting...' : 'Submit Feedback'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  back: { fontSize: 18, color: COLORS.teal, fontWeight: '600', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 24 },
  question: { fontSize: 16, fontWeight: '600', color: COLORS.navy, marginBottom: 10, marginTop: 16 },
  npsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  npsBtn: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.lightGray,
  },
  npsBtnActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  npsNum: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  npsNumActive: { color: COLORS.white },
  npsLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 8 },
  npsLabel: { fontSize: 12, color: COLORS.gray },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, fontSize: 16,
    color: COLORS.navy, minHeight: 80, borderWidth: 1, borderColor: COLORS.lightGray,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.teal, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 24,
  },
  submitText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  thankTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  thankBody: { fontSize: 18, color: COLORS.gray, textAlign: 'center', lineHeight: 28, marginBottom: 32 },
  backLink: { padding: 16 },
  backLinkText: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
});
