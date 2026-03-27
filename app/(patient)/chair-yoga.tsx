/**
 * Chair Yoga — Patient Screen
 * Step-by-step seated yoga poses with timers.
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
import { supabase, getCurrentProfile, logActivitySession } from '../../lib/supabase';

interface Pose {
  name: string;
  instruction: string;
  emoji: string;
  holdSeconds: number;
}

const POSES: Pose[] = [
  { name: 'Seated Mountain', instruction: 'Sit tall with feet flat. Reach your arms overhead. Breathe deeply.', emoji: '🏔️', holdSeconds: 15 },
  { name: 'Neck Rolls', instruction: 'Slowly roll your head in a circle. Switch direction halfway.', emoji: '🔄', holdSeconds: 20 },
  { name: 'Shoulder Shrugs', instruction: 'Lift shoulders to ears, hold, then release. Repeat slowly.', emoji: '💪', holdSeconds: 15 },
  { name: 'Seated Cat-Cow', instruction: 'Arch your back (look up), then round your back (look down). Alternate slowly.', emoji: '🐱', holdSeconds: 20 },
  { name: 'Seated Twist', instruction: 'Place right hand on left knee. Gently twist to the left. Hold and breathe.', emoji: '🌀', holdSeconds: 15 },
  { name: 'Ankle Circles', instruction: 'Lift one foot slightly. Circle your ankle 5 times each direction. Switch feet.', emoji: '🦶', holdSeconds: 20 },
  { name: 'Seated Forward Bend', instruction: 'Slowly lean forward from your hips. Let your arms hang. Breathe and relax.', emoji: '🙇', holdSeconds: 15 },
  { name: 'Deep Breath Finish', instruction: 'Sit tall. Take 3 deep breaths. In through the nose, out through the mouth.', emoji: '🌬️', holdSeconds: 20 },
];

type Phase = 'list' | 'pose' | 'complete';

export default function ChairYogaScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('list');
  const [currentPose, setCurrentPose] = useState(0);
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

  const startPose = (idx: number) => {
    setCurrentPose(idx);
    setCountdown(POSES[idx].holdSeconds);
    setPhase('pose');
    if (idx === 0) startTime.current = Date.now();

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextPose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentPose < POSES.length - 1) {
      startPose(currentPose + 1);
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
          activity: 'chair_yoga',
          stage_at_time: 'middle',
          difficulty_params: { poses: POSES.length },
          score: { completed_poses: POSES.length },
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
          <Text style={st.completeEmoji}>🧘</Text>
          <PetCelebration patientId={patientId} />
          <Text style={st.completeTitle}>Great stretch!</Text>
          <Text style={st.completeBody}>You completed all {POSES.length} poses. Wonderful!</Text>
          <MBButton label="Go Home" variant="primary" size="large" onPress={() => router.replace('/(patient)')} />
        </View>
      </MBSafeArea>
    );
  }

  if (phase === 'list') {
    return (
      <MBSafeArea title="Chair Yoga">
        <View style={st.center}>
          <Text style={st.introEmoji}>🪑</Text>
          <Text style={st.introTitle}>Chair Yoga</Text>
          <Text style={st.introBody}>{POSES.length} gentle seated poses</Text>
          <MBButton label="Start" variant="primary" size="large" onPress={() => startPose(0)} />
        </View>
      </MBSafeArea>
    );
  }

  const pose = POSES[currentPose];
  return (
    <MBSafeArea title="Chair Yoga">
      <View style={st.poseContainer}>
        {/* Progress */}
        <View style={st.progressBar}>
          <View style={[st.progressFill, { width: `${((currentPose + 1) / POSES.length) * 100}%` as any }]} />
        </View>
        <Text style={st.progressText}>{currentPose + 1} of {POSES.length}</Text>

        <Text style={st.poseEmoji}>{pose.emoji}</Text>
        <Text style={st.poseName}>{pose.name}</Text>
        <Text style={st.poseInstruction}>{pose.instruction}</Text>

        <Text style={st.timer}>{countdown > 0 ? `${countdown}s` : 'Done!'}</Text>

        <MBButton
          label={currentPose < POSES.length - 1 ? 'Next Pose' : 'Finish!'}
          variant="primary"
          size="large"
          onPress={nextPose}
        />
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  introEmoji: { fontSize: 64, marginBottom: 12 },
  introTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  introBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32 },
  poseContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: COLORS.lightGray, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 4 },
  progressText: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  poseEmoji: { fontSize: 56, marginBottom: 12 },
  poseName: { fontSize: A11Y.fontSizeHeading, fontWeight: '700', color: COLORS.navy, marginBottom: 12, textAlign: 'center' },
  poseInstruction: { fontSize: A11Y.fontSizeBody, color: COLORS.teal, textAlign: 'center', lineHeight: 28, marginBottom: 24, paddingHorizontal: 8 },
  timer: { fontSize: 48, fontWeight: '700', color: COLORS.navy, marginBottom: 32 },
  completeEmoji: { fontSize: 64, marginBottom: 8 },
  completeTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  completeBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', marginBottom: 32 },
});
