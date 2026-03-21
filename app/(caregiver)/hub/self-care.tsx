/**
 * Caregiver Self-Care Check-In
 *
 * Quick daily wellness check (mood, sleep, burnout 1-5, gratitude note)
 * with affirmations. Logs to caregiver_checkins table.
 * Also offers the full Zarit Burden Interview for deeper assessment.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../../lib/supabase';

const MOODS = [
  { key: 'happy', emoji: '😊', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'sad', emoji: '😢', label: 'Struggling' },
  { key: 'tired', emoji: '😴', label: 'Exhausted' },
  { key: 'confused', emoji: '😟', label: 'Overwhelmed' },
];

const AFFIRMATIONS = [
  'You are doing an incredible job. Caregiving is one of the hardest and most loving things a person can do.',
  'It is okay to feel tired. Resting is not giving up — it is how you keep going.',
  'Your presence matters more than perfection. Just being there is enough.',
  'You deserve kindness too — especially from yourself.',
  'The love you give every day makes a difference, even when it does not feel like it.',
  'Taking care of yourself is not selfish. It is necessary.',
  'You are stronger than you know. And it is okay to ask for help.',
  'Every small act of care you give is a gift that matters deeply.',
];

const ZARIT_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Nearly Always' },
];

type Screen = 'checkin' | 'zarit' | 'zarit-result' | 'history';

export default function SelfCareScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('checkin');
  const [caregiverId, setCaregiverId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quick check-in state
  const [mood, setMood] = useState('');
  const [sleepQuality, setSleepQuality] = useState(0);
  const [burnoutScore, setBurnoutScore] = useState(0);
  const [gratitudeNote, setGratitudeNote] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [todayCheckin, setTodayCheckin] = useState(false);

  // Zarit state
  const [zaritQuestions, setZaritQuestions] = useState<{ number: number; question: string }[]>([]);
  const [zaritResponses, setZaritResponses] = useState<Record<number, number>>({});
  const [zaritResult, setZaritResult] = useState<{ score: number; severity: string } | null>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.back(); return; }
      setCaregiverId(profile.id);

      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('caregiver_checkins')
        .select('id')
        .eq('caregiver_id', profile.id)
        .gte('created_at', `${today}T00:00:00`)
        .limit(1);

      if (existing && existing.length > 0) {
        setTodayCheckin(true);
      }

      // Pick random affirmation
      setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
    } catch {}
    setLoading(false);
  }

  async function saveCheckin() {
    if (!mood) { Alert.alert('How are you feeling?', 'Please select your mood.'); return; }
    if (sleepQuality === 0) { Alert.alert('Sleep quality', 'Please rate your sleep (1-5).'); return; }

    setSaving(true);
    try {
      const aff = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
      await supabase.from('caregiver_checkins').insert({
        caregiver_id: caregiverId,
        mood,
        sleep_quality: sleepQuality,
        burnout_score: burnoutScore || null,
        gratitude_note: gratitudeNote.trim() || null,
        affirmation_shown: aff,
      });
      setAffirmation(aff);
      setTodayCheckin(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Error', 'Could not save check-in. Please try again.');
    }
    setSaving(false);
  }

  async function loadZarit() {
    const { data } = await supabase
      .from('zarit_questions')
      .select('number, question')
      .order('number');
    setZaritQuestions(data || []);
    setZaritResponses({});
    setScreen('zarit');
  }

  async function submitZarit() {
    const answered = Object.keys(zaritResponses).length;
    if (answered < zaritQuestions.length) {
      Alert.alert('Incomplete', `Please answer all ${zaritQuestions.length} questions (${answered} answered).`);
      return;
    }

    const totalScore = Object.values(zaritResponses).reduce((sum, v) => sum + v, 0);
    let severity = 'little_or_no';
    if (totalScore >= 61) severity = 'severe';
    else if (totalScore >= 41) severity = 'moderate_to_severe';
    else if (totalScore >= 21) severity = 'mild_to_moderate';

    setSaving(true);
    try {
      await supabase.from('zarit_assessments').insert({
        caregiver_id: caregiverId,
        responses: zaritResponses,
        total_score: totalScore,
        severity,
      });
      setZaritResult({ score: totalScore, severity });
      setScreen('zarit-result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not save assessment.');
    }
    setSaving(false);
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('caregiver_checkins')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .order('created_at', { ascending: false })
      .limit(14);
    setHistory(data || []);
    setScreen('history');
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  // ── Zarit Result Screen ──
  if (screen === 'zarit-result' && zaritResult) {
    const labels: Record<string, { title: string; color: string; msg: string }> = {
      little_or_no: { title: 'Little or No Burden', color: COLORS.success, msg: 'You are managing well. Keep prioritizing your own wellness alongside caregiving.' },
      mild_to_moderate: { title: 'Mild to Moderate Burden', color: COLORS.gold, msg: 'You may benefit from additional support. Consider joining a caregiver support group or talking to your doctor.' },
      moderate_to_severe: { title: 'Moderate to Severe Burden', color: COLORS.coral, msg: 'Please reach out for help. Respite care, counseling, and support groups can make a real difference.' },
      severe: { title: 'Severe Burden', color: COLORS.coral, msg: 'Your wellbeing matters. Please talk to a healthcare provider about caregiver support services available to you.' },
    };
    const info = labels[zaritResult.severity] || labels.little_or_no;

    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll}>
          <Text style={st.title}>Zarit Assessment Results</Text>
          <View style={[st.resultCard, { borderColor: info.color }]}>
            <Text style={[st.resultScore, { color: info.color }]}>{zaritResult.score}</Text>
            <Text style={st.resultLabel}>{info.title}</Text>
            <Text style={st.resultMsg}>{info.msg}</Text>
          </View>
          <Text style={st.disclaimer}>
            This is a screening tool, not a diagnosis. Please discuss results with a healthcare professional.
          </Text>
          <Pressable style={st.primaryBtn} onPress={() => setScreen('checkin')}>
            <Text style={st.primaryBtnText}>Back to Self-Care</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Zarit Assessment Screen ──
  if (screen === 'zarit') {
    const answered = Object.keys(zaritResponses).length;
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll}>
          <Pressable onPress={() => setScreen('checkin')} style={st.backBtn}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>
          <Text style={st.title}>Zarit Burden Interview</Text>
          <Text style={st.subtitle}>{answered} of {zaritQuestions.length} answered</Text>

          {zaritQuestions.map((q) => (
            <View key={q.number} style={st.questionCard}>
              <Text style={st.questionText}>{q.number}. {q.question}</Text>
              <View style={st.optionRow}>
                {ZARIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setZaritResponses((prev) => ({ ...prev, [q.number]: opt.value }));
                    }}
                    style={[
                      st.optionBtn,
                      zaritResponses[q.number] === opt.value && st.optionSelected,
                    ]}
                  >
                    <Text style={[
                      st.optionLabel,
                      zaritResponses[q.number] === opt.value && st.optionLabelSelected,
                    ]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Pressable
            style={[st.primaryBtn, saving && { opacity: 0.5 }]}
            onPress={submitZarit}
            disabled={saving}
          >
            <Text style={st.primaryBtnText}>{saving ? 'Saving...' : 'Submit Assessment'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── History Screen ──
  if (screen === 'history') {
    const moodMap: Record<string, string> = { happy: '😊', okay: '😐', sad: '😢', tired: '😴', confused: '😟' };
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll}>
          <Pressable onPress={() => setScreen('checkin')} style={st.backBtn}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>
          <Text style={st.title}>Recent Check-Ins</Text>
          {history.length === 0 ? (
            <Text style={st.emptyText}>No check-ins yet. Start today!</Text>
          ) : (
            history.map((h) => (
              <View key={h.id} style={st.historyCard}>
                <View style={st.historyHeader}>
                  <Text style={{ fontSize: 28 }}>{moodMap[h.mood] || '😊'}</Text>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={st.historyDate}>
                      {new Date(h.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={st.historyMeta}>
                      Sleep: {h.sleep_quality}/5 · Burnout: {h.burnout_score || '—'}/5
                    </Text>
                  </View>
                </View>
                {h.gratitude_note && (
                  <Text style={st.historyGratitude}>"{h.gratitude_note}"</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main Check-In Screen ──
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>

        <Text style={st.title}>Self-Care Check-In</Text>
        <Text style={st.subtitle}>Take a moment for yourself 💛</Text>

        {/* Affirmation */}
        <View style={st.affirmationCard}>
          <Text style={st.affirmationText}>{affirmation}</Text>
        </View>

        {todayCheckin ? (
          <View style={st.doneCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>✅</Text>
            <Text style={st.doneTitle}>Today's check-in complete</Text>
            <Text style={st.doneBody}>Remember: you matter too.</Text>
          </View>
        ) : (
          <>
            {/* Mood */}
            <Text style={st.sectionLabel}>How are you feeling?</Text>
            <View style={st.moodRow}>
              {MOODS.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMood(m.key); }}
                  style={[st.moodBtn, mood === m.key && st.moodSelected]}
                  accessibilityLabel={m.label}
                >
                  <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
                  <Text style={[st.moodLabel, mood === m.key && { color: COLORS.teal }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Sleep Quality */}
            <Text style={st.sectionLabel}>How did you sleep? (1-5)</Text>
            <View style={st.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSleepQuality(n); }}
                  style={[st.ratingBtn, sleepQuality === n && st.ratingSelected]}
                >
                  <Text style={[st.ratingText, sleepQuality === n && { color: COLORS.white }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={st.ratingLabels}>
              <Text style={st.ratingHint}>Poor</Text>
              <Text style={st.ratingHint}>Great</Text>
            </View>

            {/* Burnout Score */}
            <Text style={st.sectionLabel}>Burnout level today (1-5)</Text>
            <View style={st.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBurnoutScore(n); }}
                  style={[st.ratingBtn, burnoutScore === n && st.ratingSelected]}
                >
                  <Text style={[st.ratingText, burnoutScore === n && { color: COLORS.white }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={st.ratingLabels}>
              <Text style={st.ratingHint}>Low</Text>
              <Text style={st.ratingHint}>High</Text>
            </View>

            {/* Gratitude Note */}
            <Text style={st.sectionLabel}>One thing you are grateful for (optional)</Text>
            <TextInput
              style={st.input}
              value={gratitudeNote}
              onChangeText={setGratitudeNote}
              placeholder="Today I'm grateful for..."
              placeholderTextColor={COLORS.gray}
              multiline
              maxLength={280}
            />

            {/* Save Button */}
            <Pressable
              style={[st.primaryBtn, saving && { opacity: 0.5 }]}
              onPress={saveCheckin}
              disabled={saving}
            >
              <Text style={st.primaryBtnText}>{saving ? 'Saving...' : 'Save Check-In'}</Text>
            </Pressable>
          </>
        )}

        {/* Action Cards */}
        <View style={st.actionRow}>
          <Pressable style={st.actionCard} onPress={loadZarit}>
            <Text style={{ fontSize: 24 }}>📋</Text>
            <Text style={st.actionLabel}>Burnout Assessment</Text>
            <Text style={st.actionSub}>Zarit Burden Interview</Text>
          </Pressable>
          <Pressable style={st.actionCard} onPress={loadHistory}>
            <Text style={{ fontSize: 24 }}>📊</Text>
            <Text style={st.actionLabel}>My History</Text>
            <Text style={st.actionSub}>Past 2 weeks</Text>
          </Pressable>
        </View>

        {/* Crisis line */}
        <View style={st.crisisCard}>
          <Text style={st.crisisTitle}>Need to talk to someone?</Text>
          <Text style={st.crisisBody}>
            Alzheimer's Association 24/7 Helpline: 800-272-3900{'\n'}
            Crisis Text Line: Text HOME to 741741
          </Text>
        </View>
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
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.gray, marginBottom: 20 },
  affirmationCard: {
    backgroundColor: COLORS.glow, borderRadius: 16, padding: 20, marginBottom: 24,
    borderLeftWidth: 4, borderLeftColor: COLORS.gold,
  },
  affirmationText: { fontSize: 16, color: COLORS.navy, lineHeight: 24, fontStyle: 'italic' },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: COLORS.navy, marginBottom: 10, marginTop: 16 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  moodBtn: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 12,
    backgroundColor: COLORS.white, borderWidth: 2, borderColor: 'transparent',
  },
  moodSelected: { borderColor: COLORS.teal, backgroundColor: COLORS.teal + '10' },
  moodLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  ratingBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.lightGray,
  },
  ratingSelected: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  ratingText: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  ratingLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 4 },
  ratingHint: { fontSize: 12, color: COLORS.gray },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    fontSize: 16, color: COLORS.navy, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  primaryBtn: {
    backgroundColor: COLORS.teal, borderRadius: 16, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  primaryBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  doneCard: { alignItems: 'center', padding: 32 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  doneBody: { fontSize: 16, color: COLORS.gray },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  actionCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.navy, marginTop: 8, textAlign: 'center' },
  actionSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  crisisCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginTop: 20,
    borderLeftWidth: 4, borderLeftColor: COLORS.coral,
  },
  crisisTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 6 },
  crisisBody: { fontSize: 14, color: COLORS.gray, lineHeight: 22 },
  questionCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  questionText: { fontSize: 15, color: COLORS.navy, marginBottom: 10, lineHeight: 22 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionBtn: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  optionSelected: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  optionLabel: { fontSize: 12, color: COLORS.navy, fontWeight: '500' },
  optionLabelSelected: { color: COLORS.white },
  resultCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 24, marginVertical: 20,
    alignItems: 'center', borderWidth: 2,
  },
  resultScore: { fontSize: 48, fontWeight: '700', marginBottom: 4 },
  resultLabel: { fontSize: 20, fontWeight: '600', color: COLORS.navy, marginBottom: 8, textAlign: 'center' },
  resultMsg: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
  disclaimer: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  emptyText: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 20 },
  historyCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center' },
  historyDate: { fontSize: 15, fontWeight: '600', color: COLORS.navy },
  historyMeta: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  historyGratitude: { fontSize: 14, color: COLORS.teal, marginTop: 8, fontStyle: 'italic' },
});
