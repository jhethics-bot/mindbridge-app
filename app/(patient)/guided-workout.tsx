/**
 * Guided Workout — Patient Screen
 * Gentle seated/standing exercises with rep counts and timers.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBButton } from '../../components/ui/MBButton';
import { PetCelebration } from '../../components/PetCelebration';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { getCurrentProfile, logActivitySession } from '../../lib/supabase';

interface Exercise {
  name: string;
  instruction: string;
  emoji: string;
  type: 'reps' | 'timed';
  value: number; // reps or seconds
}

const EXERCISES: Exercise[] = [
  { name: 'Arm Raises', instruction: 'Slowly raise both arms above your head, then lower them.', emoji: '🙌', type: 'reps', value: 10 },
  { name: 'Seated Marching', instruction: 'Lift your knees one at a time, like marching in place.', emoji: '🦵', type: 'timed', value: 30 },
  { name: 'Shoulder Rolls', instruction: 'Roll shoulders forward 5 times, then backward 5 times.', emoji: '💪', type: 'reps', value: 10 },
  { name: 'Ankle Circles', instruction: 'Circle each ankle 5 times clockwise, then counterclockwise.', emoji: '🦶', type: 'reps', value: 10 },
  { name: 'Gentle Torso Twist', instruction: 'Place hands on knees. Slowly twist left, then right.', emoji: '🔄', type: 'reps', value: 10 },
  { name: 'Wrist Stretches', instruction: 'Extend your arm. Gently pull fingers back with other hand. Switch.', emoji: '🤲', type: 'timed', value: 30 },
  { name: 'Deep Breathing', instruction: 'Breathe in for 4 counts, hold for 4, out for 4. Repeat.', emoji: '🌬️', type: 'timed', value: 60 },
];

type Phase = 'intro' | 'exercise' | 'complete';

export default function GuidedWorkoutScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [patientId, setPatientId] = useState('');
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfile();
      if (p) setPatientId(p.id);
    })();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startExercise = (idx: number) => {
    setCurrentIdx(idx);
    setPhase('exercise');
    if (idx === 0) startTime.current = Date.now();
    const ex = EXERCISES[idx];
    if (ex.type === 'timed') {
      setCountdown(ex.value);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(0);
    }
  };

  const nextExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIdx < EXERCISES.length - 1) {
      startExercise(currentIdx + 1);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('complete');
    if (patientId) {
      try {
        await logActivitySession({
          patient_id: patientId,
          activity: 'guided_workout',
          stage_at_time: 'middle',
          difficulty_params: { exercises: EXERCISES.length },
          score: { completed: EXERCISES.length },
          duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
          completed: true,
        });
      } catch {}
    }
  };

  if (phase === 'complete') {
    return (
      <MBSafeArea>
        <View style={st.center}>
          <Text style={st.emoji}>💪</Text>
          <PetCelebration patientId={patientId} />
          <Text style={st.title}>Great workout!</Text>
          <Text style={st.body}>You finished all {EXERCISES.length} exercises!</Text>
          <MBButton label="Go Home" variant="primary" size="large" onPress={() => router.replace('/(patient)')} />
        </View>
      </MBSafeArea>
    );
  }

  if (phase === 'intro') {
    return (
      <MBSafeArea title="Gentle Workout">
        <View style={st.center}>
          <Text style={st.emoji}>🏋️</Text>
          <Text style={st.title}>Gentle Workout</Text>
          <Text style={st.body}>{EXERCISES.length} easy exercises you can do seated</Text>
          <MBButton label="Start" variant="primary" size="large" onPress={() => startExercise(0)} />
        </View>
      </MBSafeArea>
    );
  }

  const ex = EXERCISES[currentIdx];
  return (
    <MBSafeArea title="Gentle Workout">
      <View style={st.exContainer}>
        <View style={st.progressBar}>
          <View style={[st.progressFill, { width: `${((currentIdx + 1) / EXERCISES.length) * 100}%` as any }]} />
        </View>
        <Text style={st.progressText}>{currentIdx + 1} of {EXERCISES.length}</Text>

        <Text style={st.exEmoji}>{ex.emoji}</Text>
        <Text style={st.exName}>{ex.name}</Text>
        <Text style={st.exInstruction}>{ex.instruction}</Text>

        {ex.type === 'timed' ? (
          <Text style={st.timer}>{countdown > 0 ? `${countdown}s` : 'Done!'}</Text>
        ) : (
          <Text style={st.reps}>{ex.value} reps</Text>
        )}

        <MBButton
          label={currentIdx < EXERCISES.length - 1 ? 'Done — Next' : 'Finish!'}
          variant="primary"
          size="large"
          onPress={nextExercise}
        />
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emoji: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  body: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', marginBottom: 32 },
  exContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: COLORS.lightGray, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 4 },
  progressText: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  exEmoji: { fontSize: 56, marginBottom: 12 },
  exName: { fontSize: A11Y.fontSizeHeading, fontWeight: '700', color: COLORS.navy, marginBottom: 12, textAlign: 'center' },
  exInstruction: { fontSize: A11Y.fontSizeBody, color: COLORS.teal, textAlign: 'center', lineHeight: 28, marginBottom: 24 },
  timer: { fontSize: 48, fontWeight: '700', color: COLORS.navy, marginBottom: 32 },
  reps: { fontSize: 36, fontWeight: '700', color: COLORS.teal, marginBottom: 32 },
});
