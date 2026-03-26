/**
 * Spelling Game (Early Stage ONLY)
 * Voice prompts word, patient types it. First letter pre-filled.
 * Wrong letters simply don't register — no red, no negative feedback.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { MBButton } from '../../../components/ui/MBButton';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';
import { logActivitySession, getCurrentProfile } from '../../../lib/supabase';
import type { DiseaseStage } from '../../../types';
import { PetCelebration } from '../../../components/PetCelebration';

const { width: SCREEN_W } = Dimensions.get('window');

const WORDS = [
  'LOVE', 'HOME', 'ROSE', 'CAKE', 'BIRD', 'SONG', 'RAIN', 'STAR',
  'FISH', 'TREE', 'MOON', 'BOOK', 'BELL', 'DEER', 'FARM', 'GIFT',
  'HOPE', 'LAKE', 'NEST', 'PARK', 'SEED', 'WAVE', 'BOAT', 'LAMP',
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SpellingGame() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('early');
  const [wordList, setWordList] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [slots, setSlots] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState(1); // Position 0 is pre-filled
  const [celebration, setCelebration] = useState('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'complete'>('loading');
  const [score, setScore] = useState(0);
  const startTime = useRef(Date.now());
  const patientId = useRef('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const p = await getCurrentProfile();
      if (p) {
        setStage(p.stage as DiseaseStage);
        patientId.current = p.id;
      }
    } catch {}
    const list = shuffle(WORDS).slice(0, 6);
    setWordList(list);
    setupWord(list, 0);
    setGameState('playing');
  }

  function setupWord(list: string[], idx: number) {
    if (idx >= list.length) {
      handleComplete();
      return;
    }
    const word = list[idx];
    const s = Array(word.length).fill('');
    s[0] = word[0]; // First letter hint
    setSlots(s);
    setCursorPos(1);
    setWordIdx(idx);
    setCelebration('');
    // Speak the word
    setTimeout(() => speakWord(word), 300);
  }

  function speakWord(word: string) {
    Speech.speak(word, { rate: 0.7, language: 'en-US' });
  }

  function handleKeyPress(letter: string) {
    if (cursorPos >= slots.length) return;
    const word = wordList[wordIdx];

    if (letter === word[cursorPos]) {
      // Correct letter
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = [...slots];
      next[cursorPos] = letter;
      setSlots(next);
      const newPos = cursorPos + 1;
      setCursorPos(newPos);

      // Word complete?
      if (newPos >= word.length) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScore(s => s + 1);
        setCelebration(['Spelled it! 🌟', 'Perfect! ✨', 'Wonderful! 💛'][Math.floor(Math.random() * 3)]);
        setTimeout(() => setupWord(wordList, wordIdx + 1), 1800);
      }
    } else {
      // Wrong letter — just don't register. Gentle haptic only.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handleHint() {
    if (cursorPos >= slots.length) return;
    const word = wordList[wordIdx];
    const next = [...slots];
    next[cursorPos] = word[cursorPos];
    setSlots(next);
    setCursorPos(cursorPos + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (cursorPos + 1 >= word.length) {
      setCelebration('Great job! 🌟');
      setScore(s => s + 1);
      setTimeout(() => setupWord(wordList, wordIdx + 1), 1800);
    }
  }

  async function handleComplete() {
    setGameState('complete');
    const dur = Math.round((Date.now() - startTime.current) / 1000);
    try {
      if (patientId.current) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'spelling',
          stage_at_time: stage,
          difficulty_params: { word_count: wordList.length },
          score: { correct: score, total: wordList.length },
          duration_seconds: dur,
          completed: true,
        });
      }
    } catch {}
  }

  if (gameState === 'loading') {
    return <MBSafeArea showHome showSOS><View style={st.center}><Text style={st.loadText}>Loading...</Text></View></MBSafeArea>;
  }

  if (gameState === 'complete') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={st.center}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>✏️</Text>
          <PetCelebration patientId={patientId.current} />
          <Text style={st.doneTitle}>Great Spelling!</Text>
          <Text style={st.doneBody}>You spelled {score} words. Wonderful practice!</Text>
          <MBButton label="Play Again" variant="primary" size="large"
            onPress={() => { setScore(0); setGameState('loading'); loadProfile(); }} />
          <MBButton label="Go Home" variant="secondary" size="large"
            onPress={() => router.replace('/(patient)')} style={{ marginTop: 12 }} />
        </View>
      </MBSafeArea>
    );
  }

  const word = wordList[wordIdx] || '';
  const keyW = Math.min((SCREEN_W - 48 - 9 * 4) / 10, 36);

  return (
    <MBSafeArea showHome showSOS title="Spelling">
      <View style={st.container}>
        {celebration ? (
          <View style={st.celebBanner}><Text style={st.celebText}>{celebration}</Text></View>
        ) : (
          <Text style={st.progress}>Word {wordIdx + 1} of {wordList.length}</Text>
        )}

        {/* Action buttons */}
        <View style={st.actionRow}>
          <MBButton label="🔊 Hear Word" variant="secondary" size="compact"
            onPress={() => speakWord(word)} accessibilityHint="Listen to the word again" />
          <MBButton label="💡 Hint" variant="secondary" size="compact"
            onPress={handleHint} accessibilityHint="Fill in the next letter" />
        </View>

        {/* Letter slots */}
        <View style={st.slotsRow}>
          {slots.map((letter, i) => (
            <View key={i} style={[st.slot, i === cursorPos && st.slotActive, letter && st.slotFilled]}>
              <Text style={[st.slotText, letter && st.slotTextFilled]}>
                {letter || (i === 0 ? word[0] : '')}
              </Text>
            </View>
          ))}
        </View>

        {/* Keyboard */}
        <View style={st.keyboard}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <View key={ri} style={st.keyRow}>
              {row.map(letter => (
                <Pressable
                  key={letter}
                  onPress={() => handleKeyPress(letter)}
                  accessibilityRole="button"
                  accessibilityLabel={letter}
                  style={({ pressed }) => [
                    st.key, { width: keyW, height: keyW * 1.2 },
                    pressed && { backgroundColor: COLORS.glow },
                  ]}
                >
                  <Text style={st.keyText}>{letter}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingBottom: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  loadText: { fontSize: A11Y.fontSizeHeading, color: COLORS.navy },
  progress: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginBottom: 8 },
  celebBanner: { backgroundColor: COLORS.glow, borderRadius: 16, padding: 10, alignSelf: 'center', marginBottom: 8 },
  celebText: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  slotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  slot: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
  },
  slotActive: { borderColor: COLORS.teal },
  slotFilled: { backgroundColor: COLORS.glow, borderColor: COLORS.gold },
  slotText: { fontSize: 28, fontWeight: '700', color: COLORS.lightGray },
  slotTextFilled: { color: COLORS.navy },
  keyboard: { gap: 6 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  key: {
    borderRadius: 8, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  keyText: { fontSize: 18, fontWeight: '600', color: COLORS.navy },
  doneTitle: { fontSize: 36, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  doneBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32, textAlign: 'center' },
});
