/**
 * Zarit Burnout Assessment — Standalone Caregiver Screen
 * Direct access to the validated Zarit Burden Interview (22 questions).
 * Accessible from caregiver settings and self-care hub.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';

const ZARIT_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Quite Frequently' },
  { value: 4, label: 'Nearly Always' },
];

const SEVERITY_INFO: Record<string, { title: string; color: string; msg: string }> = {
  little_or_no: {
    title: 'Little or No Burden (0-20)',
    color: COLORS.success,
    msg: 'You are managing well. Keep prioritizing your own wellness alongside caregiving.',
  },
  mild_to_moderate: {
    title: 'Mild to Moderate Burden (21-40)',
    color: COLORS.gold,
    msg: 'You may benefit from additional support. Consider joining a caregiver support group or talking to your doctor about resources.',
  },
  moderate_to_severe: {
    title: 'Moderate to Severe Burden (41-60)',
    color: COLORS.coral,
    msg: 'Please reach out for help. Respite care, counseling, and support groups can make a real difference in your wellbeing.',
  },
  severe: {
    title: 'Severe Burden (61-88)',
    color: COLORS.coral,
    msg: 'Your wellbeing matters deeply. Please talk to a healthcare provider about caregiver support services available to you.',
  },
};

type Screen = 'intro' | 'questions' | 'result';

export default function ZaritScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('intro');
  const [caregiverId, setCaregiverId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [questions, setQuestions] = useState<{ number: number; question: string }[]>([]);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; severity: string } | null>(null);
  const [pastScores, setPastScores] = useState<{ score: number; date: string }[]>([]);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.back(); return; }
      setCaregiverId(profile.id);

      // Load questions
      const { data: qData } = await supabase
        .from('zarit_questions')
        .select('number, question')
        .order('number');
      setQuestions(qData || []);

      // Load past assessments
      const { data: pastData } = await supabase
        .from('zarit_assessments')
        .select('total_score, created_at')
        .eq('caregiver_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (pastData) {
        setPastScores(pastData.map((p: any) => ({
          score: p.total_score,
          date: new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        })));
      }
    } catch {}
    setLoading(false);
  }

  async function submitAssessment() {
    const answered = Object.keys(responses).length;
    if (answered < questions.length) {
      Alert.alert('Incomplete', `Please answer all ${questions.length} questions (${answered} answered).`);
      return;
    }

    const totalScore = Object.values(responses).reduce((sum, v) => sum + v, 0);
    let severity = 'little_or_no';
    if (totalScore >= 61) severity = 'severe';
    else if (totalScore >= 41) severity = 'moderate_to_severe';
    else if (totalScore >= 21) severity = 'mild_to_moderate';

    setSaving(true);
    try {
      await supabase.from('zarit_assessments').insert({
        caregiver_id: caregiverId,
        responses,
        total_score: totalScore,
        severity,
      });
      setResult({ score: totalScore, severity });
      setScreen('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not save assessment. Please try again.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  // ── Result Screen ──
  if (screen === 'result' && result) {
    const info = SEVERITY_INFO[result.severity] || SEVERITY_INFO.little_or_no;
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll}>
          <Text style={st.title}>Your Results</Text>

          <View style={[st.resultCard, { borderColor: info.color }]}>
            <Text style={[st.resultScore, { color: info.color }]}>{result.score}</Text>
            <Text style={st.resultOf}>out of 88</Text>
            <Text style={st.resultLabel}>{info.title}</Text>
            <Text style={st.resultMsg}>{info.msg}</Text>
          </View>

          <View style={st.disclaimerCard}>
            <Text style={st.disclaimerTitle}>Important</Text>
            <Text style={st.disclaimerText}>
              This is a screening tool, not a clinical diagnosis. If you are struggling,
              please reach out to a healthcare professional or call the Alzheimer's
              Association Helpline at 1-800-272-3900.
            </Text>
          </View>

          <Pressable style={st.primaryBtn} onPress={() => router.push('/(caregiver)/hub/self-care' as any)}>
            <Text style={st.primaryBtnText}>Self-Care Resources</Text>
          </Pressable>
          <Pressable style={st.secondaryBtn} onPress={() => router.back()}>
            <Text style={st.secondaryBtnText}>Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Questions Screen ──
  if (screen === 'questions') {
    const answered = Object.keys(responses).length;
    const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;

    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll}>
          <Pressable onPress={() => setScreen('intro')} style={st.backBtn}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>

          <Text style={st.title}>Caregiver Wellness Check</Text>
          <View style={st.progressBar}>
            <View style={[st.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={st.progressLabel}>{answered} of {questions.length} answered</Text>

          {questions.map((q) => (
            <View key={q.number} style={st.questionCard}>
              <Text style={st.questionText}>{q.number}. {q.question}</Text>
              <View style={st.optionRow}>
                {ZARIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setResponses((prev) => ({ ...prev, [q.number]: opt.value }));
                    }}
                    style={[
                      st.optionBtn,
                      responses[q.number] === opt.value && st.optionSelected,
                    ]}
                    accessibilityLabel={`${opt.label} for question ${q.number}`}
                  >
                    <Text style={[
                      st.optionLabel,
                      responses[q.number] === opt.value && st.optionLabelSelected,
                    ]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Pressable
            style={[st.primaryBtn, saving && { opacity: 0.5 }]}
            onPress={submitAssessment}
            disabled={saving}
          >
            <Text style={st.primaryBtnText}>{saving ? 'Saving...' : 'Submit Assessment'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Intro Screen ──
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>

        <Text style={st.title}>Caregiver Wellness Check</Text>
        <Text style={st.subtitle}>
          The Zarit Burden Interview helps you understand your stress level as a caregiver.
          This is for you, not your loved one.
        </Text>

        <View style={st.infoCard}>
          <Text style={st.infoTitle}>What to expect</Text>
          <Text style={st.infoText}>
            {'\u2022'} 22 questions about your caregiving experience{'\n'}
            {'\u2022'} Each answered on a 0-4 scale (Never to Nearly Always){'\n'}
            {'\u2022'} Takes about 5-10 minutes{'\n'}
            {'\u2022'} Score range: 0-88{'\n'}
            {'\u2022'} Your answers are private and stored securely
          </Text>
        </View>

        {pastScores.length > 0 && (
          <View style={st.historyCard}>
            <Text style={st.historyTitle}>Past Assessments</Text>
            {pastScores.map((ps, idx) => (
              <View key={idx} style={st.historyRow}>
                <Text style={st.historyDate}>{ps.date}</Text>
                <Text style={st.historyScore}>Score: {ps.score}/88</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable style={st.primaryBtn} onPress={() => { setResponses({}); setScreen('questions'); }}>
          <Text style={st.primaryBtnText}>Begin Assessment</Text>
        </Pressable>

        <Text style={st.footerDisclaimer}>
          This is a validated screening tool, not a clinical diagnosis. If you are struggling,
          please reach out to a healthcare professional or call the Alzheimer's Association
          Helpline at 1-800-272-3900.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.gray, lineHeight: 24, marginBottom: 20 },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: COLORS.teal,
  },
  infoTitle: { fontSize: 18, fontWeight: '600', color: COLORS.navy, marginBottom: 10 },
  infoText: { fontSize: 15, color: COLORS.gray, lineHeight: 24 },
  historyCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 20,
  },
  historyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.navy, marginBottom: 10 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  historyDate: { fontSize: 14, color: COLORS.gray },
  historyScore: { fontSize: 14, fontWeight: '600', color: COLORS.navy },
  primaryBtn: {
    backgroundColor: COLORS.teal, borderRadius: 16, padding: 18,
    alignItems: 'center', marginTop: 8, minHeight: A11Y.preferredTouchTarget,
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  secondaryBtn: {
    borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10,
    minHeight: A11Y.preferredTouchTarget, justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 18, fontWeight: '600', color: COLORS.teal },
  footerDisclaimer: {
    fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 24,
    lineHeight: 20, fontStyle: 'italic',
  },
  progressBar: {
    width: '100%', height: 8, borderRadius: 4, backgroundColor: COLORS.lightGray,
    marginBottom: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 4 },
  progressLabel: { fontSize: 14, color: COLORS.gray, marginBottom: 16 },
  questionCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12,
  },
  questionText: { fontSize: 16, color: COLORS.navy, marginBottom: 12, lineHeight: 24 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.lightGray,
    minHeight: 40, justifyContent: 'center',
  },
  optionSelected: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  optionLabel: { fontSize: 13, color: COLORS.navy, fontWeight: '500' },
  optionLabelSelected: { color: COLORS.white },
  resultCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 28,
    marginVertical: 20, alignItems: 'center', borderWidth: 2,
  },
  resultScore: { fontSize: 56, fontWeight: '700', marginBottom: 2 },
  resultOf: { fontSize: 16, color: COLORS.gray, marginBottom: 8 },
  resultLabel: { fontSize: 18, fontWeight: '600', color: COLORS.navy, marginBottom: 10, textAlign: 'center' },
  resultMsg: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 24 },
  disclaimerCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.gold,
  },
  disclaimerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 6 },
  disclaimerText: { fontSize: 14, color: COLORS.gray, lineHeight: 22 },
});
