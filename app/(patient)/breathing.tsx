/**
 * Breathing Exercise Screen
 * Queries breathing_protocols table (7 seeded protocols).
 * Stage-adaptive: simpler protocols for later stages.
 * Pulsing circle animation guides inhale/hold/exhale.
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

interface BreathingProtocol {
  id: string;
  name: string;
  inhale_seconds: number;
  hold_seconds: number;
  exhale_seconds: number;
  cycles: number;
  description: string;
  stage_suitability: string[];
}

// Fallback if DB query fails
const FALLBACK_PROTOCOL: BreathingProtocol = {
  id: 'fallback',
  name: 'Calm Breathing',
  inhale_seconds: 4,
  hold_seconds: 2,
  exhale_seconds: 6,
  cycles: 5,
  description: 'A gentle breathing exercise to help you relax.',
  stage_suitability: ['early', 'middle', 'late'],
};

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

export default function BreathingScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [protocols, setProtocols] = useState<BreathingProtocol[]>([]);
  const [activeProtocol, setActiveProtocol] = useState<BreathingProtocol>(FALLBACK_PROTOCOL);
  const [phase, setPhase] = useState<Phase>('idle');
  const [cycle, setCycle] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  const startTime = useRef(Date.now());
  const patientId = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function loadData() {
    try {
      const p = await getCurrentProfile();
      if (p) { setStage(p.stage as DiseaseStage); patientId.current = p.id; }

      const { data } = await supabase
        .from('breathing_protocols')
        .select('*')
        .order('created_at');

      if (data && data.length > 0) {
        setProtocols(data as BreathingProtocol[]);
        // Pick first protocol suitable for this stage
        const suitable = data.find((pr: any) =>
          !pr.stage_suitability || pr.stage_suitability.includes(p?.stage || 'middle')
        );
        if (suitable) setActiveProtocol(suitable as BreathingProtocol);
      }
    } catch {}
  }

  function startBreathing() {
    setCycle(0);
    startTime.current = Date.now();
    runCycle(0);
  }

  function runCycle(c: number) {
    if (c >= activeProtocol.cycles) {
      setPhase('complete');
      handleComplete();
      return;
    }
    setCycle(c);
    doInhale(c);
  }

  function doInhale(c: number) {
    setPhase('inhale');
    setPhaseLabel('Breathe in...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1, duration: activeProtocol.inhale_seconds * 1000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8, duration: activeProtocol.inhale_seconds * 1000, useNativeDriver: true,
      }),
    ]).start();
    timerRef.current = setTimeout(() => doHold(c), activeProtocol.inhale_seconds * 1000);
  }

  function doHold(c: number) {
    setPhase('hold');
    setPhaseLabel('Hold...');
    timerRef.current = setTimeout(() => doExhale(c), activeProtocol.hold_seconds * 1000);
  }

  function doExhale(c: number) {
    setPhase('exhale');
    setPhaseLabel('Breathe out...');
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5, duration: activeProtocol.exhale_seconds * 1000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.4, duration: activeProtocol.exhale_seconds * 1000, useNativeDriver: true,
      }),
    ]).start();
    timerRef.current = setTimeout(() => runCycle(c + 1), activeProtocol.exhale_seconds * 1000);
  }

  async function handleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dur = Math.round((Date.now() - startTime.current) / 1000);
    try {
      if (patientId.current) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'breathing',
          stage_at_time: stage,
          difficulty_params: {
            protocol: activeProtocol.name,
            inhale: activeProtocol.inhale_seconds,
            hold: activeProtocol.hold_seconds,
            exhale: activeProtocol.exhale_seconds,
          },
          score: { cycles_completed: activeProtocol.cycles },
          duration_seconds: dur,
          completed: true,
        });
      }
    } catch {}
  }

  // IDLE state
  if (phase === 'idle') {
    return (
      <MBSafeArea showHome showSOS title="Breathing">
        <View style={st.center}>
          <Text style={st.title}>{activeProtocol.name}</Text>
          <Text style={st.description}>{activeProtocol.description}</Text>
          <Text style={st.details}>
            {activeProtocol.inhale_seconds}s in · {activeProtocol.hold_seconds}s hold · {activeProtocol.exhale_seconds}s out · {activeProtocol.cycles} cycles
          </Text>
          <MBButton label="Begin" variant="primary" size="large" onPress={startBreathing}
            accessibilityHint="Start the breathing exercise" style={{ marginTop: 32 }} />

          {protocols.length > 1 && (
            <View style={st.protocolList}>
              {protocols.map(pr => (
                <MBButton
                  key={pr.id}
                  label={pr.name}
                  variant={pr.id === activeProtocol.id ? 'primary' : 'secondary'}
                  size="compact"
                  onPress={() => setActiveProtocol(pr)}
                  style={{ marginTop: 8 }}
                />
              ))}
            </View>
          )}
        </View>
      </MBSafeArea>
    );
  }

  // COMPLETE state
  if (phase === 'complete') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={st.center}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>🌬️</Text>
          <Text style={st.doneTitle}>Well Done</Text>
          <Text style={st.doneBody}>You completed all {activeProtocol.cycles} cycles. Take a moment to notice how calm you feel.</Text>
          <MBButton label="Do Again" variant="primary" size="large" onPress={() => setPhase('idle')} />
          <MBButton label="Go Home" variant="secondary" size="large"
            onPress={() => router.replace('/(patient)')} style={{ marginTop: 12 }} />
        </View>
      </MBSafeArea>
    );
  }

  // BREATHING state
  return (
    <MBSafeArea showHome showSOS backgroundColor="#EEF5F3">
      <View style={st.breathContainer}>
        <Text style={st.cycleText}>Cycle {cycle + 1} of {activeProtocol.cycles}</Text>

        <View style={st.circleContainer}>
          <Animated.View style={[
            st.breathCircle,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]} />
          <Text style={st.phaseLabel}>{phaseLabel}</Text>
        </View>
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', marginBottom: 12, paddingHorizontal: 20 },
  details: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  protocolList: { marginTop: 24, width: '100%' },
  breathContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cycleText: { fontSize: 18, color: COLORS.gray, marginBottom: 40 },
  circleContainer: { width: 250, height: 250, justifyContent: 'center', alignItems: 'center' },
  breathCircle: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: COLORS.teal,
  },
  phaseLabel: { fontSize: 28, fontWeight: '700', color: COLORS.navy, textAlign: 'center' },
  doneTitle: { fontSize: 36, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  doneBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32, textAlign: 'center', paddingHorizontal: 20 },
});
