/**
 * Driving Safety Assessment
 *
 * Three-part cognitive screen: reaction time, road sign recognition,
 * and scenario-based decision making. Results saved to driving_assessments.
 * Not a medical clearance — generates data for caregiver/physician review.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';

const { width: SW } = Dimensions.get('window');

// ── Road Signs ──
const SIGNS = [
  { emoji: '🛑', name: 'Stop', correct: 'Stop completely', options: ['Stop completely', 'Slow down', 'Speed up', 'Honk horn'] },
  { emoji: '⚠️', name: 'Yield', correct: 'Slow and let others go', options: ['Stop completely', 'Slow and let others go', 'Speed up', 'Turn around'] },
  { emoji: '🚸', name: 'School Zone', correct: 'Slow down, watch for children', options: ['Slow down, watch for children', 'Speed up', 'Honk horn', 'Close eyes'] },
  { emoji: '🅿️', name: 'Parking', correct: 'You can park here', options: ['No stopping', 'You can park here', 'Turn left', 'Speed up'] },
  { emoji: '⛽', name: 'Gas Station', correct: 'Gas station ahead', options: ['Hospital ahead', 'Gas station ahead', 'Restaurant ahead', 'Stop'] },
  { emoji: '🚫', name: 'Do Not Enter', correct: 'Do not go this way', options: ['Go straight', 'Do not go this way', 'Slow down', 'Turn right'] },
];

// ── Driving Scenarios ──
const SCENARIOS = [
  {
    situation: 'A school bus stops with red lights flashing. You should:',
    correct: 'Stop and wait',
    options: ['Stop and wait', 'Pass carefully', 'Honk the horn', 'Speed up'],
  },
  {
    situation: 'You approach a yellow traffic light. You should:',
    correct: 'Slow down and prepare to stop',
    options: ['Speed up to make it', 'Slow down and prepare to stop', 'Stop immediately', 'Flash your lights'],
  },
  {
    situation: 'An ambulance approaches with sirens on. You should:',
    correct: 'Pull over to the right and stop',
    options: ['Speed up to get out of the way', 'Pull over to the right and stop', 'Keep driving', 'Turn left'],
  },
  {
    situation: 'It starts raining heavily while you are driving. You should:',
    correct: 'Slow down and turn on headlights',
    options: ['Keep your speed', 'Slow down and turn on headlights', 'Speed up to get home', 'Pull over and close eyes'],
  },
  {
    situation: 'You feel very tired while driving. You should:',
    correct: 'Pull over to a safe spot and rest',
    options: ['Open the window and keep going', 'Pull over to a safe spot and rest', 'Turn up the radio', 'Drive faster'],
  },
];

type Phase = 'intro' | 'reaction' | 'signs' | 'scenarios' | 'results';

export default function DrivingAssessment() {
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const [phase, setPhase] = useState<Phase>('intro');
  const [saving, setSaving] = useState(false);

  // Reaction time
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [reactionState, setReactionState] = useState<'wait' | 'ready' | 'go' | 'done'>('wait');
  const [reactionRound, setReactionRound] = useState(0);
  const goTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const REACTION_ROUNDS = 5;

  // Signs
  const [signIndex, setSignIndex] = useState(0);
  const [signCorrect, setSignCorrect] = useState(0);
  const [signFeedback, setSignFeedback] = useState('');

  // Scenarios
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioCorrect, setScenarioCorrect] = useState(0);
  const [scenarioFeedback, setScenarioFeedback] = useState('');

  useEffect(() => {
    (async () => {
      const profile = await getCurrentProfile();
      if (profile) setPatientId(profile.id);
    })();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // ── Reaction Time Logic ──
  function startReaction() {
    setReactionState('ready');
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    timerRef.current = setTimeout(() => {
      goTime.current = Date.now();
      setReactionState('go');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, delay);
  }

  function tapReaction() {
    if (reactionState === 'ready') {
      // Tapped too early
      if (timerRef.current) clearTimeout(timerRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setReactionState('wait');
      Alert.alert('Too early!', 'Wait for the green circle to appear, then tap.');
      return;
    }
    if (reactionState === 'go') {
      const time = Date.now() - goTime.current;
      const newTimes = [...reactionTimes, time];
      setReactionTimes(newTimes);
      setReactionRound(reactionRound + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (newTimes.length >= REACTION_ROUNDS) {
        setReactionState('done');
      } else {
        setReactionState('wait');
      }
    }
  }

  // ── Sign Recognition Logic ──
  function answerSign(answer: string) {
    const sign = SIGNS[signIndex];
    const correct = answer === sign.correct;
    if (correct) {
      setSignCorrect(signCorrect + 1);
      setSignFeedback('Correct! ✓');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setSignFeedback(`The answer is: ${sign.correct}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setTimeout(() => {
      setSignFeedback('');
      if (signIndex + 1 >= SIGNS.length) {
        setPhase('scenarios');
      } else {
        setSignIndex(signIndex + 1);
      }
    }, 1500);
  }

  // ── Scenario Logic ──
  function answerScenario(answer: string) {
    const scenario = SCENARIOS[scenarioIndex];
    const correct = answer === scenario.correct;
    if (correct) {
      setScenarioCorrect(scenarioCorrect + 1);
      setScenarioFeedback('Good thinking! ✓');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setScenarioFeedback(`Better answer: ${scenario.correct}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setTimeout(() => {
      setScenarioFeedback('');
      if (scenarioIndex + 1 >= SCENARIOS.length) {
        saveResults();
      } else {
        setScenarioIndex(scenarioIndex + 1);
      }
    }, 1800);
  }

  // ── Save Results ──
  async function saveResults() {
    setSaving(true);
    const avgReaction = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    try {
      if (patientId) {
        await supabase.from('driving_assessments').insert({
          patient_id: patientId,
          reaction_time_ms: reactionTimes,
          avg_reaction_ms: avgReaction,
          sign_recognition_correct: signCorrect,
          sign_recognition_total: SIGNS.length,
          decision_scenarios_correct: scenarioCorrect,
          decision_scenarios_total: SCENARIOS.length,
        });
      }
    } catch {}
    setSaving(false);
    setPhase('results');
  }

  // ── RENDER ──

  // Intro
  if (phase === 'intro') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.centered}>
          <Pressable onPress={() => router.back()} style={st.backBtn}>
            <Text style={st.backText}>← Home</Text>
          </Pressable>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🚗</Text>
          <Text style={st.introTitle}>Driving Safety Check</Text>
          <Text style={st.introBody}>
            This is a fun activity with 3 parts:{'\n\n'}
            1. Tap speed — how fast can you react?{'\n'}
            2. Road signs — do you know what they mean?{'\n'}
            3. Driving situations — what would you do?{'\n\n'}
            This is not a test. There is no pass or fail.
          </Text>
          <Pressable style={st.startBtn} onPress={() => { setPhase('reaction'); startReaction(); }}>
            <Text style={st.startBtnText}>Let's Start!</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Reaction Time
  if (phase === 'reaction') {
    if (reactionState === 'done') {
      const avg = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
      return (
        <SafeAreaView style={st.safe}>
          <View style={st.centered}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>⚡</Text>
            <Text style={st.phaseTitle}>Reaction Time Complete!</Text>
            <Text style={st.resultValue}>Average: {avg} ms</Text>
            <Text style={st.resultHint}>
              {avg < 400 ? 'Quick reflexes!' : avg < 700 ? 'Good reactions.' : 'Take your time — that is okay.'}
            </Text>
            <Pressable style={st.nextBtn} onPress={() => setPhase('signs')}>
              <Text style={st.nextBtnText}>Next: Road Signs →</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={st.safe}>
        <View style={st.centered}>
          <Text style={st.phaseTitle}>Tap Speed</Text>
          <Text style={st.phaseSubtitle}>Round {reactionRound + 1} of {REACTION_ROUNDS}</Text>

          <Pressable
            onPress={reactionState === 'wait' ? startReaction : tapReaction}
            style={[
              st.reactionCircle,
              reactionState === 'wait' && { backgroundColor: COLORS.lightGray },
              reactionState === 'ready' && { backgroundColor: COLORS.coral },
              reactionState === 'go' && { backgroundColor: COLORS.success },
            ]}
          >
            <Text style={st.reactionText}>
              {reactionState === 'wait' ? 'Tap to Start'
                : reactionState === 'ready' ? 'Wait...'
                : 'TAP NOW!'}
            </Text>
          </Pressable>

          {reactionTimes.length > 0 && (
            <Text style={st.lastTime}>Last: {reactionTimes[reactionTimes.length - 1]} ms</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Sign Recognition
  if (phase === 'signs') {
    const sign = SIGNS[signIndex];
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.centered}>
          <Text style={st.phaseTitle}>Road Signs</Text>
          <Text style={st.phaseSubtitle}>{signIndex + 1} of {SIGNS.length}</Text>

          <Text style={{ fontSize: 80, marginVertical: 16 }}>{sign.emoji}</Text>
          <Text style={st.signQuestion}>What does this sign mean?</Text>

          {signFeedback ? (
            <View style={[st.feedbackCard, signFeedback.includes('✓') ? st.feedbackGood : st.feedbackInfo]}>
              <Text style={st.feedbackText}>{signFeedback}</Text>
            </View>
          ) : (
            sign.options.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [st.optionBtn, pressed && { backgroundColor: COLORS.glow }]}
                onPress={() => answerSign(opt)}
              >
                <Text style={st.optionText}>{opt}</Text>
              </Pressable>
            ))
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Scenarios
  if (phase === 'scenarios') {
    const scenario = SCENARIOS[scenarioIndex];
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.centered}>
          <Text style={st.phaseTitle}>What Would You Do?</Text>
          <Text style={st.phaseSubtitle}>{scenarioIndex + 1} of {SCENARIOS.length}</Text>

          <View style={st.scenarioCard}>
            <Text style={st.scenarioText}>{scenario.situation}</Text>
          </View>

          {scenarioFeedback ? (
            <View style={[st.feedbackCard, scenarioFeedback.includes('✓') ? st.feedbackGood : st.feedbackInfo]}>
              <Text style={st.feedbackText}>{scenarioFeedback}</Text>
            </View>
          ) : (
            scenario.options.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [st.optionBtn, pressed && { backgroundColor: COLORS.glow }]}
                onPress={() => answerScenario(opt)}
              >
                <Text style={st.optionText}>{opt}</Text>
              </Pressable>
            ))
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Results
  const avgMs = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;
  const signPct = Math.round((signCorrect / SIGNS.length) * 100);
  const scenarioPct = Math.round((scenarioCorrect / SCENARIOS.length) * 100);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.centered}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}>🚗</Text>
        <Text style={st.introTitle}>Assessment Complete</Text>

        <View style={st.resultRow}>
          <View style={st.resultCard}>
            <Text style={st.resultLabel}>Reaction</Text>
            <Text style={st.resultBig}>{avgMs}ms</Text>
          </View>
          <View style={st.resultCard}>
            <Text style={st.resultLabel}>Signs</Text>
            <Text style={st.resultBig}>{signCorrect}/{SIGNS.length}</Text>
          </View>
          <View style={st.resultCard}>
            <Text style={st.resultLabel}>Decisions</Text>
            <Text style={st.resultBig}>{scenarioCorrect}/{SCENARIOS.length}</Text>
          </View>
        </View>

        <View style={st.disclaimerCard}>
          <Text style={st.disclaimerText}>
            This is a cognitive activity, not a medical evaluation. Share results with your
            doctor if you have concerns about driving safety.
          </Text>
        </View>

        <Pressable style={st.startBtn} onPress={() => router.back()}>
          <Text style={st.startBtnText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  centered: { flex: 1, padding: A11Y.screenPadding, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 10, left: A11Y.screenPadding },
  backText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  introTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 12, textAlign: 'center' },
  introBody: { fontSize: 16, color: COLORS.gray, lineHeight: 24, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  startBtn: { backgroundColor: COLORS.teal, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 },
  startBtnText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  phaseTitle: { fontSize: 24, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  phaseSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 16 },
  reactionCircle: {
    width: SW * 0.55, height: SW * 0.55, borderRadius: SW * 0.275,
    justifyContent: 'center', alignItems: 'center', marginVertical: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  reactionText: { fontSize: 22, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  lastTime: { fontSize: 16, color: COLORS.gray, marginTop: 8 },
  signQuestion: { fontSize: 18, fontWeight: '600', color: COLORS.navy, marginBottom: 16 },
  optionBtn: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 8,
    width: SW - A11Y.screenPadding * 2, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  optionText: { fontSize: 16, color: COLORS.navy, fontWeight: '500' },
  feedbackCard: { borderRadius: 14, padding: 16, marginBottom: 8, width: SW - A11Y.screenPadding * 2, alignItems: 'center' },
  feedbackGood: { backgroundColor: COLORS.success + '20' },
  feedbackInfo: { backgroundColor: COLORS.glow },
  feedbackText: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  scenarioCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 20, marginBottom: 16,
    width: SW - A11Y.screenPadding * 2, borderLeftWidth: 4, borderLeftColor: COLORS.gold,
  },
  scenarioText: { fontSize: 17, color: COLORS.navy, lineHeight: 24 },
  resultRow: { flexDirection: 'row', gap: 10, marginVertical: 20 },
  resultCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  resultLabel: { fontSize: 12, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  resultBig: { fontSize: 22, fontWeight: '700', color: COLORS.teal },
  resultValue: { fontSize: 24, fontWeight: '700', color: COLORS.teal, marginBottom: 4 },
  resultHint: { fontSize: 15, color: COLORS.gray, marginBottom: 20 },
  nextBtn: { backgroundColor: COLORS.teal, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 12 },
  nextBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  disclaimerCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: COLORS.gray,
  },
  disclaimerText: { fontSize: 13, color: COLORS.gray, lineHeight: 20, textAlign: 'center' },
});
