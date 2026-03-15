/**
 * Face-Name Matching Game (Errorless Learning)
 * Show a face, present name options. Patient picks, always celebrate.
 * Early: 4 options. Middle: 2 options. Late: single name, tap to confirm.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { MBButton } from '../../../components/ui/MBButton';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';
import { supabase, logActivitySession, getCurrentProfile, getFamilyPhotos } from '../../../lib/supabase';
import type { DiseaseStage } from '../../../types';

const SAMPLE_NAMES = [
  { name: 'Mom', initials: 'M', color: '#E8B4B8' },
  { name: 'Dad', initials: 'D', color: '#B4C7E8' },
  { name: 'Sarah', initials: 'S', color: '#B8E8B4' },
  { name: 'John', initials: 'J', color: '#E8D4B4' },
  { name: 'Mary', initials: 'M', color: '#D4B4E8' },
  { name: 'James', initials: 'J', color: '#B4E8D4' },
  { name: 'Linda', initials: 'L', color: '#E8E4B4' },
  { name: 'Robert', initials: 'R', color: '#B4D4E8' },
];

const STAGE_CFG: Record<string, { options: number; rounds: number }> = {
  early:  { options: 4, rounds: 6 },
  middle: { options: 2, rounds: 5 },
  late:   { options: 1, rounds: 3 },
};

const CELEBRATIONS = [
  "That's right! 🌟", 'Wonderful! 💛', 'You remembered! ⭐',
  'Beautiful! 🌸', 'Perfect! ✨', 'Great job! 🎉',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export default function FaceNameGame() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [faces, setFaces] = useState(SAMPLE_NAMES);
  const [round, setRound] = useState(0);
  const [currentFace, setCurrentFace] = useState(SAMPLE_NAMES[0]);
  const [options, setOptions] = useState<typeof SAMPLE_NAMES>([]);
  const [celebration, setCelebration] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'complete'>('loading');
  const startTime = useRef(Date.now());
  const patientId = useRef('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const p = await getCurrentProfile();
      if (p) {
        setStage(p.stage as DiseaseStage);
        patientId.current = p.id;

        // Try to load family photos for real faces
        const photos = await getFamilyPhotos(p.id);
        if (photos.length >= 4) {
          setFaces(photos.map((ph: any) => ({
            name: ph.person_name || ph.display_name || 'Family',
            initials: (ph.person_name || 'F')[0].toUpperCase(),
            color: SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)].color,
          })));
        }
      }
    } catch {}
    setGameState('playing');
  }

  useEffect(() => {
    if (gameState !== 'playing') return;
    setupRound(0);
  }, [gameState, stage, faces]);

  function setupRound(r: number) {
    const cfg = STAGE_CFG[stage] || STAGE_CFG.middle;
    if (r >= cfg.rounds) {
      handleComplete();
      return;
    }
    const target = faces[r % faces.length];
    setCurrentFace(target);
    setRound(r);
    setCelebration('');
    setShowResult(false);

    if (cfg.options === 1) {
      setOptions([target]); // Late stage: just tap to confirm
    } else {
      const distractors = pickRandom(faces.filter(f => f.name !== target.name), cfg.options - 1);
      setOptions(shuffle([target, ...distractors]));
    }
  }

  function handleSelect(name: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (name === currentFace.name) {
      // Correct (or late-stage confirm)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 1);
      setCelebration(CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
      setShowResult(true);
      setTimeout(() => setupRound(round + 1), 1500);
    } else {
      // Wrong — gently fade wrong option, highlight correct
      // In errorless learning, we don't punish. Just show the right answer.
      setCelebration(`This is ${currentFace.name} 💛`);
      setShowResult(true);
      setTimeout(() => setupRound(round + 1), 2000);
    }
  }

  async function handleComplete() {
    setGameState('complete');
    const dur = Math.round((Date.now() - startTime.current) / 1000);
    const cfg = STAGE_CFG[stage] || STAGE_CFG.middle;
    try {
      if (patientId.current) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'face_name',
          stage_at_time: stage,
          difficulty_params: { options: cfg.options, rounds: cfg.rounds },
          score: { correct: score, total: cfg.rounds },
          duration_seconds: dur,
          completed: true,
        });
      }
    } catch {}
  }

  if (gameState === 'loading') {
    return <MBSafeArea showHome showSOS><View style={st.center}><Text style={st.loading}>Loading...</Text></View></MBSafeArea>;
  }

  if (gameState === 'complete') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={st.center}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>🌟</Text>
          <Text style={st.doneTitle}>Well Done!</Text>
          <Text style={st.doneBody}>You practiced remembering names. That's wonderful!</Text>
          <MBButton label="Play Again" variant="primary" size="large" onPress={() => { setScore(0); setGameState('playing'); }} />
          <MBButton label="Go Home" variant="secondary" size="large" onPress={() => router.replace('/(patient)')} style={{ marginTop: 12 }} />
        </View>
      </MBSafeArea>
    );
  }

  const cfg = STAGE_CFG[stage] || STAGE_CFG.middle;

  return (
    <MBSafeArea showHome showSOS title="Face & Name">
      <View style={st.container}>
        <Text style={st.progress}>Round {round + 1} of {cfg.rounds}</Text>

        {celebration ? (
          <View style={st.celebBanner}><Text style={st.celebText}>{celebration}</Text></View>
        ) : (
          <Text style={st.prompt}>Who is this?</Text>
        )}

        {/* Face avatar */}
        <View style={[st.avatar, { backgroundColor: currentFace.color }]}>
          <Text style={st.avatarText}>{currentFace.initials}</Text>
        </View>

        {/* Name options */}
        <View style={st.optionsGrid}>
          {options.map((opt, i) => (
            <Pressable
              key={`${opt.name}-${i}`}
              onPress={() => !showResult && handleSelect(opt.name)}
              disabled={showResult}
              accessibilityRole="button"
              accessibilityLabel={opt.name}
              style={({ pressed }) => [
                st.optionBtn,
                showResult && opt.name === currentFace.name && st.optionCorrect,
                showResult && opt.name !== currentFace.name && st.optionFaded,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[
                st.optionText,
                showResult && opt.name === currentFace.name && st.optionTextCorrect,
                showResult && opt.name !== currentFace.name && { opacity: 0.4 },
              ]}>
                {opt.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  loading: { fontSize: A11Y.fontSizeHeading, color: COLORS.navy },
  progress: { fontSize: 16, color: COLORS.gray, marginBottom: 8 },
  prompt: { fontSize: A11Y.fontSizeHeading, fontWeight: '600', color: COLORS.navy, marginBottom: 20 },
  celebBanner: { backgroundColor: COLORS.glow, borderRadius: 16, padding: 10, marginBottom: 20 },
  celebText: { fontSize: 22, fontWeight: '700', color: COLORS.navy },
  avatar: {
    width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center',
    marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  avatarText: { fontSize: 56, fontWeight: '700', color: COLORS.white },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  optionBtn: {
    minWidth: 140, minHeight: A11Y.minTouchTarget, paddingHorizontal: 24, paddingVertical: 16,
    borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  optionCorrect: { borderColor: COLORS.gold, backgroundColor: COLORS.glow },
  optionFaded: { opacity: 0.5 },
  optionText: { fontSize: 22, fontWeight: '600', color: COLORS.navy },
  optionTextCorrect: { color: COLORS.navy, fontWeight: '700' },
  doneTitle: { fontSize: 36, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  doneBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32, textAlign: 'center' },
});
